// Rigged human hands (WebXR "generic-hand" models, MIT) that follow the mouse
// and perform the experiment. Finger poses are applied to the 25-joint
// skeleton; the hand is positioned so that the active contact point (index
// fingertip, pinch point or palm) lands exactly on the target.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const FINGERS = ['index-finger', 'middle-finger', 'ring-finger', 'pinky-finger'];
const PHAL = ['phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal'];
const THUMB = ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal'];

// Curl angles in degrees: [proximal, intermediate, distal] per finger,
// thumb [metacarpal, proximal, distal], plus finger spread.
export const POSES = {
  relaxed: { index: [18, 22, 10], middle: [24, 28, 12], ring: [28, 30, 14], pinky: [32, 32, 16], thumb: [12, 14, 8], spread: 4 },
  point: { index: [2, 4, 2], middle: [78, 95, 55], ring: [82, 95, 55], pinky: [86, 95, 55], thumb: [30, 30, 20], spread: 0 },
  press: { index: [14, 12, 6], middle: [78, 95, 55], ring: [82, 95, 55], pinky: [86, 95, 55], thumb: [30, 30, 20], spread: 0 },
  pinch: { index: [38, 48, 28], middle: [48, 60, 34], ring: [58, 70, 40], pinky: [66, 76, 44], thumb: [34, 30, 26], spread: 0 },
  grab: { index: [48, 44, 22], middle: [50, 46, 24], ring: [52, 48, 24], pinky: [54, 50, 26], thumb: [26, 18, 12], spread: 6 },
  flat: { index: [4, 4, 2], middle: [4, 4, 2], ring: [5, 5, 3], pinky: [6, 6, 3], thumb: [8, 6, 4], spread: 8 },
};

const SKIN_TONES = { light: 0xf1c7a9, medium: 0xd29c78, tan: 0xa8714f, deep: 0x6b4430 };

const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const xAxis = new THREE.Vector3(1, 0, 0);
const yAxis = new THREE.Vector3(0, 1, 0);

class Hand {
  constructor(gltf, side, skinMat, sleeveMat) {
    this.side = side;
    this.root = new THREE.Group(); // world placement, oriented palm-down, fingers toward −Z
    this.model = gltf.scene;
    this.bones = {};
    this.model.traverse((o) => {
      if (o.isBone || o.type === 'Object3D' || o.isObject3D) if (o.name) this.bones[o.name] = o;
      if (o.isSkinnedMesh) {
        this.skinned = o;
        o.material = skinMat;
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    // The WebXR joints are all siblings (absolute poses). Chain them wrist →
    // metacarpal → phalanges → tip, keeping their world transforms, so that
    // bending a knuckle carries the rest of the finger with it.
    this.model.updateMatrixWorld(true);
    const chain = (names) => {
      let parent = this.bones.wrist;
      names.forEach((n) => { const b = this.bones[n]; if (b && parent) { parent.attach(b); parent = b; } });
    };
    FINGERS.forEach((f) => chain([`${f}-metacarpal`, ...PHAL.map((p) => `${f}-${p}`), `${f}-tip`]));
    chain([...THUMB, 'thumb-tip']);
    this.rest = {};
    Object.entries(this.bones).forEach(([n, b]) => { this.rest[n] = b.quaternion.clone(); });

    // Work out the model's own frame from its bones, then rotate it so the
    // palm faces down and the fingers point away from the student.
    this.model.updateMatrixWorld(true);
    const wp = (n) => this.bones[n].getWorldPosition(new THREE.Vector3());
    const wrist = wp('wrist');
    const f = wp('middle-finger-phalanx-proximal').sub(wrist).normalize();
    let t = wp('index-finger-phalanx-proximal').sub(wp('pinky-finger-phalanx-proximal')).normalize();
    t.sub(f.clone().multiplyScalar(t.dot(f))).normalize();
    const n = side === 'right' ? t.clone().cross(f) : f.clone().cross(t); // palm normal
    const from = new THREE.Matrix4().makeBasis(t, n, f.clone().negate()); // model axes as columns
    // Target: thumb side → −X (right hand) / +X (left), palm normal → −Y, fingers → −Z
    const tt = new THREE.Vector3(side === 'right' ? -1 : 1, 0, 0);
    const to = new THREE.Matrix4().makeBasis(tt, new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1));
    const rot = to.multiply(from.clone().invert());
    this.model.quaternion.setFromRotationMatrix(rot);
    this.model.scale.setScalar(100); // metres → centimetres
    this.model.position.copy(wrist.applyQuaternion(this.model.quaternion).multiplyScalar(-100));
    this.root.add(this.model);

    // Lab-coat sleeve and cuff over the forearm
    // The forearm drops away toward the elbow, as when reaching onto a bench
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 4.3, 22, 24, 1, true), sleeveMat); // narrow at the wrist
    sleeve.geometry.translate(0, -11, 0);
    sleeve.rotation.x = 0.55 - Math.PI / 2; // points toward the student and down
    sleeve.position.set(0, 0.6, 6.4);
    sleeve.castShadow = true;
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.45, 10, 28), sleeveMat);
    cuff.position.set(0, 0.6, 6.2);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.9, 7, 20, 1, false), skinMat);
    inner.rotation.x = Math.PI / 2; inner.scale.set(1.2, 1, 0.8); inner.position.set(0, 0.3, 3.4);
    this.root.add(sleeve, cuff, inner);
    this.inner = inner;
    this.skinMat = skinMat;
    this.sleeve = sleeve;
    this.cuff = cuff;

    this.current = JSON.parse(JSON.stringify(POSES.relaxed));
    this.target = POSES.relaxed;
    this.pos = new THREE.Vector3(side === 'right' ? 30 : -60, 20, 60);
    this.goal = this.pos.clone();
    this.contact = 'index'; // index | pinch | palm
    this.yaw = 0; this.yawGoal = 0;
    this.pitch = 0; this.pitchGoal = 0;
    this.speed = 14;
    this.shoulder = new THREE.Vector3(side === 'right' ? 40 : -40, 45, 120);
  }

  setPose(name, contact) {
    this.target = POSES[name] || POSES.relaxed;
    if (contact) this.contact = contact;
  }

  applyPose(dt) {
    const k = 1 - Math.exp(-dt * 16);
    const cur = this.current, tgt = this.target;
    ['index', 'middle', 'ring', 'pinky', 'thumb'].forEach((f) => {
      for (let i = 0; i < 3; i++) cur[f][i] += (tgt[f][i] - cur[f][i]) * k;
    });
    cur.spread += (tgt.spread - cur.spread) * k;
    const d2r = THREE.MathUtils.degToRad;
    FINGERS.forEach((fname, fi) => {
      const key = fname.split('-')[0];
      PHAL.forEach((p, j) => {
        const b = this.bones[`${fname}-${p}`];
        if (!b) return;
        b.quaternion.copy(this.rest[b.name]);
        // WebXR joint frame: −Z along the bone, +Y dorsal. Curl = rotate toward the palm.
        b.quaternion.multiply(tmpQ.setFromAxisAngle(xAxis, -d2r(cur[key][j])));
        if (j === 0) b.quaternion.multiply(tmpQ.setFromAxisAngle(yAxis, d2r((fi - 1.5) * cur.spread * (this.side === 'right' ? -1 : 1))));
      });
    });
    THUMB.forEach((n, j) => {
      const b = this.bones[n];
      if (!b) return;
      b.quaternion.copy(this.rest[n]);
      b.quaternion.multiply(tmpQ.setFromAxisAngle(xAxis, -d2r(cur.thumb[j])));
    });
  }

  // Local offset from the root to the active contact point, in root space.
  contactOffset() {
    this.root.updateMatrixWorld(true);
    const inv = this.root.matrixWorld.clone().invert();
    const w = (n) => this.bones[n].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    if (this.contact === 'pinch') return w('index-finger-tip').lerp(w('thumb-tip'), 0.5);
    if (this.contact === 'palm') {
      const p = w('middle-finger-phalanx-proximal').lerp(w('wrist'), 0.45);
      return p.add(new THREE.Vector3(0, -2.2, 0));
    }
    return w('index-finger-tip');
  }

  update(dt) {
    this.applyPose(dt);
    const k = 1 - Math.exp(-dt * this.speed);
    this.pos.lerp(this.goal, k);
    this.yaw += (this.yawGoal - this.yaw) * k;
    this.pitch += (this.pitchGoal - this.pitch) * k;
    this.root.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    this.root.position.set(0, 0, 0);
    const off = this.contactOffset().applyEuler(this.root.rotation);
    this.root.position.copy(this.pos).sub(off);
    // Aim the forearm (sleeve) from the wrist toward the shoulder, whatever the wrist does
    this.root.updateMatrixWorld(true);
    const wrist = this.root.localToWorld(new THREE.Vector3(0, 0.6, 6.4));
    const dir = this.shoulder.clone().sub(wrist).normalize();
    dir.y = Math.min(dir.y, 0.35); // elbow stays fairly low
    dir.normalize().applyQuaternion(this.root.getWorldQuaternion(tmpQ).invert());
    this.sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  }

  // Nitrile gloves: swap the skin for glove material, including the cuff over the wrist
  setGloves(on, gloveMat) {
    this.skinned.material = on ? gloveMat : this.skinMat;
    this.inner.material = on ? gloveMat : this.skinMat;
  }

  // Show or hide the hand's own lab-coat sleeve (hidden when a full body supplies the arms)
  setSleeve(v) { this.sleeve.visible = v; this.cuff.visible = v; }

  // Where the forearm meets the hand, and the direction back up the forearm
  wristWorld() { return this.root.localToWorld(new THREE.Vector3(0, 0.4, 4.2)); }
  forearmDir() { return new THREE.Vector3(0, 0, 1).applyQuaternion(this.root.getWorldQuaternion(new THREE.Quaternion())); }

  tipWorld() {
    return this.bones['index-finger-tip'].getWorldPosition(new THREE.Vector3());
  }
}

export async function loadHands(scene, base = './meter-bridge/assets/') {
  const loader = new GLTFLoader();
  const load = (f) => new Promise((res, rej) => loader.load(base + f, res, undefined, rej));
  const [r, l] = await Promise.all([load('hand-right.glb'), load('hand-left.glb')]);
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: SKIN_TONES.medium, roughness: 0.55, metalness: 0,
    sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffd7c2),
    clearcoat: 0.08, clearcoatRoughness: 0.6,
  });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.92, side: THREE.DoubleSide });
  const gloveMat = new THREE.MeshPhysicalMaterial({
    color: 0x2f7fe0, roughness: 0.42, metalness: 0,
    sheen: 0.8, sheenRoughness: 0.35, sheenColor: new THREE.Color(0x9cc9ff),
    clearcoat: 0.35, clearcoatRoughness: 0.4,
  });
  const right = new Hand(r, 'right', skinMat, sleeveMat);
  const left = new Hand(l, 'left', skinMat, sleeveMat);
  scene.add(right.root, left.root);
  return {
    right, left, skinMat, gloveMat,
    setGloves(on) { right.setGloves(on, gloveMat); left.setGloves(on, gloveMat); },
    setSkin(tone) { skinMat.color.setHex(SKIN_TONES[tone] ?? SKIN_TONES.medium); },
    update(dt) { right.update(dt); left.update(dt); },
  };
}
