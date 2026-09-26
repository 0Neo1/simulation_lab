// The student: a realistic, textured and rigged character (a Ready Player Me
// avatar, see assets/STUDENT-LICENSE.md) who arrives in everyday clothes and puts on
// the lab's safety gear (lab coat, goggles, gloves, safety shoes). The gear is
// attached to the skeleton so it moves with the body. The character's own
// hands are collapsed and replaced by the rigged WebXR hands (which can wear
// gloves); the arms reach them with two-bone IK on the real arm bones.
// Units are cm; the group's origin is between the feet on the floor and the
// student faces −Z when heading = 0.
import * as THREE from 'three';
import { loadGLB } from './hands.js';

export const EYE_HEIGHT = 171; // cm above the floor, used by the first-person camera

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const qTmp = new THREE.Quaternion();
const qTmp2 = new THREE.Quaternion();

// Wraparound safety goggles sized for a head of radius ~10 cm: a curved tinted
// lens across the eyes, a rim above and below, side vents and a strap. The
// lens faces −Z; the group's origin is the centre of the head at eye level.
export function makeGoggles() {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.35 });
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x8fd3ff, roughness: 0.02, transmission: 0.7, transparent: true, opacity: 0.5, clearcoat: 1, iridescence: 0.7, iridescenceIOR: 1.6, depthWrite: false, side: THREE.DoubleSide });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.6 });
  const R = 10.4, L = Math.PI * 0.74;
  const arc = (r, y, a0, len, closed = false) => new THREE.CatmullRomCurve3(
    Array.from({ length: 33 }, (_, i) => { const t = a0 + (len * i) / 32; return new THREE.Vector3(r * Math.sin(t), y, r * Math.cos(t)); }), closed);
  const g = new THREE.Group();
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 4.6, 40, 1, true, Math.PI - L / 2, L), lensMat);
  const rimTop = new THREE.Mesh(new THREE.TubeGeometry(arc(R + 0.1, 2.4, Math.PI - L / 2, L), 40, 0.55, 8), frameMat);
  const rimBot = new THREE.Mesh(new THREE.TubeGeometry(arc(R + 0.1, -2.4, Math.PI - L / 2, L), 40, 0.55, 8), frameMat);
  const strap = new THREE.Mesh(new THREE.TubeGeometry(arc(R + 0.35, 0.6, Math.PI + L / 2 - 0.05, Math.PI * 2 - L + 0.1), 48, 0.8, 8), strapMat);
  strap.scale.set(1, 1, 1.05);
  // Nose notch: a small arch in the lower rim instead of a block over the nose
  const notch = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.5, 8, 16, Math.PI), frameMat);
  notch.position.set(0, -2.4, -R - 0.1);
  g.add(lens, rimTop, rimBot, strap, notch);
  [-1, 1].forEach((s) => {
    const t = Math.PI + s * (L / 2);
    const side = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.2, 2), frameMat);
    side.position.set(R * Math.sin(t), 0, R * Math.cos(t));
    side.rotation.y = t;
    const vent = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 0.5), strapMat);
    vent.position.set((R + 0.3) * Math.sin(Math.PI + s * 0.55), 2.6, (R + 0.3) * Math.cos(Math.PI + s * 0.55));
    vent.rotation.y = Math.PI + s * 0.55;
    g.add(side, vent);
  });
  g.traverse((o) => { if (o.isMesh && o !== lens) o.castShadow = true; });
  return g;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// Rotates `bone` so that its child (at world position childW) points at `target`
function aimBone(bone, childW, target) {
  const bw = bone.getWorldPosition(new THREE.Vector3());
  const cur = childW.clone().sub(bw).normalize();
  const want = target.clone().sub(bw).normalize();
  const dq = qTmp.setFromUnitVectors(cur, want);
  const wq = bone.getWorldQuaternion(qTmp2).premultiply(dq);
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  bone.quaternion.copy(pq.multiply(wq));
  bone.updateMatrixWorld(true);
}
// Rotates `bone` by `angle` about a world-space axis
function turnBone(bone, axisW, angle) {
  const wq = bone.getWorldQuaternion(new THREE.Quaternion());
  wq.premultiply(qTmp.setFromAxisAngle(axisW, angle));
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  bone.quaternion.copy(pq.multiply(wq));
  bone.updateMatrixWorld(true);
}

export async function loadAvatar(scene) {
  const gltf = await loadGLB('student.glb');
  const root = new THREE.Group();
  root.name = 'student';
  scene.add(root);
  const model = gltf.scene;
  model.scale.setScalar(100); // metres → cm
  model.rotation.y = Math.PI; // the model faces +Z; the student faces −Z
  root.add(model);
  const B = {};
  const parts = {};
  model.traverse((o) => {
    if (o.isBone) B[o.name.replace('mixamorig', '')] = o;
    if (o.isSkinnedMesh || o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; parts[o.name] = o; }
  });
  root.updateMatrixWorld(true);
  const rest = {};
  Object.entries(B).forEach(([n, b]) => { rest[n] = b.quaternion.clone(); });
  const W = (n) => B[n].getWorldPosition(new THREE.Vector3());
  const armLen = { upper: W('LeftArm').distanceTo(W('LeftForeArm')), fore: W('LeftForeArm').distanceTo(W('LeftHand')) };

  // ---- Safety gear, built in the rest (T) pose and attached to bones ----
  const M = {
    coat: new THREE.MeshStandardMaterial({ color: 0xf5f7f9, roughness: 0.86 }),
    coatShade: new THREE.MeshStandardMaterial({ color: 0xe1e6eb, roughness: 0.9 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1b1f27, roughness: 0.5 }),
    pen: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 }),
    boot: new THREE.MeshStandardMaterial({ color: 0x131313, roughness: 0.42, metalness: 0.1 }),
    toecap: new THREE.MeshStandardMaterial({ color: 0x3b3b3b, roughness: 0.3, metalness: 0.6 }),
    sole: new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.8 }),
    badge: new THREE.MeshStandardMaterial({ map: canvasTex(128, 160, (g, w, h) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, w, 36);
      g.fillStyle = '#fff'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText('ZEROLAB', w / 2, 26);
      g.fillStyle = '#cbd5e1'; g.fillRect(34, 46, 60, 60);
      g.fillStyle = '#111'; g.font = 'bold 18px Arial'; g.fillText('STUDENT', w / 2, 132);
    }), roughness: 0.5 }),
  };
  const shadow = (o) => { o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };
  const attachTo = (bone, obj) => { root.add(obj); root.updateMatrixWorld(true); bone.attach(obj); return obj; };
  const hipY = W('Hips').y, neckY = W('Neck').y;
  const coat = new THREE.Group();
  // Upper coat on the chest (follows leaning), skirt from the hips to the knees
  const chest = new THREE.Mesh(new THREE.LatheGeometry([[0.1, hipY - 12], [17, hipY - 12], [15.6, hipY + 4], [16.2, hipY + 16], [17.4, neckY - 12], [16.6, neckY - 6], [12, neckY - 1], [7, neckY + 1.5], [0.1, neckY + 1.5]].map(([r, y]) => new THREE.Vector2(r, y)), 40), M.coat);
  chest.scale.set(1, 1, 0.9);
  chest.position.z = -1.2;
  const skirt = new THREE.Mesh(new THREE.LatheGeometry([[18, W('LeftLeg').y - 4], [17.2, hipY - 14], [16.8, hipY + 2]].map(([r, y]) => new THREE.Vector2(r, y)), 40, 0, Math.PI * 2), M.coat);
  skirt.material = M.coat.clone(); skirt.material.side = THREE.DoubleSide;
  skirt.scale.set(1, 1, 0.74);
  const front = new THREE.Group();
  const zF = -17.4 * 0.9 - 1.2 - 0.3;
  const lapelL = new THREE.Mesh(new THREE.PlaneGeometry(6, 18), M.coatShade);
  lapelL.position.set(-5, neckY - 10, zF); lapelL.rotation.set(0, Math.PI, -0.35);
  const lapelR = lapelL.clone(); lapelR.position.x = 5; lapelR.rotation.z = 0.35;
  front.add(lapelL, lapelR);
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 12), M.dark);
    b.rotation.x = Math.PI / 2; b.position.set(1, neckY - 22 - i * 10, zF);
    front.add(b);
  }
  const pocket = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 6), M.coatShade);
  pocket.position.set(-9.5, neckY - 16, zF + 0.1); pocket.rotation.y = Math.PI;
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 7.5, 10), M.pen);
  pen.position.set(-7.8, neckY - 13.5, zF - 0.3);
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5.6), M.badge);
  badge.position.set(9.5, neckY - 16, zF); badge.rotation.y = Math.PI;
  front.add(pocket, pen, badge);
  const upperCoat = new THREE.Group(); upperCoat.add(chest, front);
  attachTo(B.Spine1, shadow(upperCoat));
  attachTo(B.Hips, shadow(skirt));
  // Sleeves along each upper arm and forearm, with a cuff at the wrist
  const sleeves = [];
  ['Left', 'Right'].forEach((side) => {
    const seg = (a, b, r0, r1, bone) => {
      const pa = W(a), pb = W(b);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, pa.distanceTo(pb) + 2, 20, 1, true), M.coat);
      m.position.copy(pa).lerp(pb, 0.5);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), pb.clone().sub(pa).normalize());
      sleeves.push(attachTo(bone, shadow(m)));
    };
    seg(`${side}Arm`, `${side}ForeArm`, 5.6, 5.0, B[`${side}Arm`]);
    seg(`${side}ForeArm`, `${side}Hand`, 5.0, 4.2, B[`${side}ForeArm`]);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.6, 8, 20), M.coat);
    const ph = W(`${side}Hand`), pf = W(`${side}ForeArm`);
    cuff.position.copy(ph).lerp(pf, 0.04);
    cuff.quaternion.setFromUnitVectors(V(0, 0, 1), ph.clone().sub(pf).normalize());
    sleeves.push(attachTo(B[`${side}ForeArm`], cuff));
  });
  coat.visible = false;
  // Goggles on the head at eye level
  const goggles = makeGoggles();
  const eyeY = B.LeftEye ? W('LeftEye').y : W('Head').y + 9;
  goggles.position.set(0, eyeY + 0.4, W('Head').z - 0.6);
  goggles.scale.set(0.9, 0.95, 1.08);
  attachTo(B.Head, shadow(goggles));
  // Safety shoes: black leather with a steel toe cap and a thick sole
  const boots = ['Left', 'Right'].map((side) => {
    const foot = W(`${side}Foot`), toe = W(`${side}ToeBase`);
    const g = new THREE.Group();
    const len = 27, cz = (foot.z + toe.z) / 2 - 2;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(10.5, 10, len), M.boot); upper.position.set(foot.x, 6, cz);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(11.2, 2.6, len + 1), M.sole); sole.position.set(foot.x, 1.2, cz);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(5.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.toecap);
    cap.scale.set(1, 0.9, 1.1); cap.position.set(foot.x, 2.2, cz - len / 2 + 5);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.2, 5, 18), M.boot); collar.position.set(foot.x, 12, foot.z + 2);
    g.add(upper, sole, cap, collar);
    return attachTo(B[`${side}Foot`], shadow(g));
  });

  // A student look: no hat or moustache; a short haircut modelled on the scalp
  if (parts.Wolf3D_Headwear) parts.Wolf3D_Headwear.visible = false;
  if (parts.Wolf3D_Beard) parts.Wolf3D_Beard.visible = false;
  {
    const hairTex = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#2a1b12'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * w, y = Math.random() * h, l = 4 + Math.random() * 10;
        g.strokeStyle = Math.random() > 0.5 ? 'rgba(80,55,38,0.5)' : 'rgba(10,6,4,0.55)';
        g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + l); g.stroke();
      }
    });
    const hairMat = new THREE.MeshStandardMaterial({ map: hairTex, roughness: 0.85, color: 0xffffff });
    const top = W('HeadTop_End'), head = W('Head');
    const eyeY0 = B.LeftEye ? W('LeftEye').y : head.y + 9;
    const cy = eyeY0 + 5.5, r = (top.y - cy) * 1.06;
    const hair = new THREE.Group();
    const crown = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
    crown.scale.set(0.9, 0.95, 1.02);
    const back = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 16, Math.PI * 0.55, Math.PI * 0.9, Math.PI * 0.5, Math.PI * 0.3), hairMat);
    back.scale.set(0.9, 0.95, 1.02);
    const fringe = new THREE.Mesh(new THREE.SphereGeometry(r * 0.99, 30, 8, -Math.PI * 0.3, Math.PI * 0.6, Math.PI * 0.46, Math.PI * 0.05), hairMat);
    fringe.scale.set(0.91, 0.95, 1.04);
    hair.add(crown, back, fringe);
    hair.position.set(0, cy, (top.z + head.z) / 2 + 1.2);
    hair.rotation.x = 0.18;
    attachTo(B.Head, shadow(hair));
    parts.hair = hair;
  }

  // The character's own hands give way to the rigged (glove-able) hands
  B.LeftHand.scale.setScalar(0.001);
  B.RightHand.scale.setScalar(0.001);

  const gear = { coat: false, goggles: false, gloves: false, shoes: false };
  const state = { pos: new THREE.Vector3(0, 0, 70), heading: 0, lean: 0, leanGoal: 0, phase: 0, speed: 0, visible: true, lookDown: 0 };
  let fpView = false;
  function setGear(name, on) {
    gear[name] = on;
    if (name === 'coat') { upperCoat.visible = on && !fpView; skirt.visible = on; sleeves.forEach((m) => { m.visible = on; }); if (parts.Wolf3D_Outfit_Top) parts.Wolf3D_Outfit_Top.visible = !on && !fpView; }
    else if (name === 'goggles') goggles.visible = on;
    else if (name === 'shoes') { boots.forEach((b) => { b.visible = on; }); if (parts.Wolf3D_Outfit_Footwear) parts.Wolf3D_Outfit_Footwear.visible = !on; }
  }
  ['coat', 'goggles', 'shoes'].forEach((g) => setGear(g, false));

  function place() {
    root.position.set(state.pos.x, state.pos.y, state.pos.z);
    root.rotation.y = state.heading;
    root.updateMatrixWorld(true);
  }
  function shoulderWorld(side) { place(); return W(side === 'left' ? 'LeftArm' : 'RightArm'); }
  function eyeWorld() { return V(state.pos.x, state.pos.y + EYE_HEIGHT, state.pos.z).add(V(-Math.sin(state.heading), 0, -Math.cos(state.heading)).multiplyScalar(8)); }
  function bodyPoint(x, y, z) { place(); return root.localToWorld(V(x, y, z)); }

  // Two-bone IK on the real arm bones; the forearm may stretch a little so the
  // hand can reach across the bench
  function solveArm(side, wrist) {
    const S = W(`${side}Arm`);
    const a = armLen.upper, b0 = armLen.fore;
    const d = wrist.clone().sub(S);
    let dist = d.length();
    const k = THREE.MathUtils.clamp((dist - a) / b0, 1, 1.4);
    const b = b0 * k;
    B[`${side}ForeArm`].scale.set(1, k, 1);
    dist = Math.min(dist, a + b - 0.01);
    const dir = d.normalize();
    const along = (a * a - b * b + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, a * a - along * along));
    const sgn = side === 'Left' ? -1 : 1;
    const pole = V(sgn * 0.7, -1, 0.35).applyAxisAngle(V(0, 1, 0), state.heading);
    pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const E = S.clone().addScaledVector(dir, along).addScaledVector(pole, h);
    const Wp = S.clone().addScaledVector(dir, dist);
    aimBone(B[`${side}Arm`], W(`${side}ForeArm`), E);
    aimBone(B[`${side}ForeArm`], W(`${side}Hand`), Wp);
  }

  function update(dt, { moving, speed, wristL, wristR }) {
    state.speed += (speed - state.speed) * Math.min(1, dt * 8);
    const amp = Math.min(1, state.speed / 120);
    state.phase += (state.speed * dt) / 55 * Math.PI;
    const sw = Math.sin(state.phase);
    state.lean += ((moving ? 0.04 : state.leanGoal) - state.lean) * Math.min(1, dt * 4);
    place();
    Object.entries(rest).forEach(([n, q]) => B[n].quaternion.copy(q));
    root.updateMatrixWorld(true);
    const side = V(1, 0, 0).applyAxisAngle(V(0, 1, 0), state.heading); // student's right
    // Walk cycle: hips swing the thighs, knees bend on the back swing
    turnBone(B.LeftUpLeg, side, sw * 0.45 * amp);
    turnBone(B.RightUpLeg, side, -sw * 0.45 * amp);
    turnBone(B.LeftLeg, side, -Math.max(0, -Math.cos(state.phase)) * 0.8 * amp);
    turnBone(B.RightLeg, side, -Math.max(0, Math.cos(state.phase)) * 0.8 * amp);
    // Lean over the bench from the waist, look down at the work
    turnBone(B.Spine, side, -state.lean * 0.55);
    turnBone(B.Spine1, side, -state.lean * 0.3);
    turnBone(B.Spine2, side, -state.lean * 0.15);
    turnBone(B.Neck, side, -(state.lean * 0.3 + state.lookDown));
    if (wristL) solveArm('Left', wristL);
    if (wristR) solveArm('Right', wristR);
  }

  function setVisible(v) { state.visible = v; root.visible = v; }
  // First person: the camera sits in the head, so hide the head, neck and torso
  // (they would fill the view); legs, coat sleeves and the hands stay visible
  function setHeadVisible(v) {
    fpView = !v;
    B.Head.scale.setScalar(v ? 1 : 0.001);
    ['Wolf3D_Body', 'Wolf3D_Head', 'EyeLeft', 'EyeRight', 'Wolf3D_Teeth'].forEach((n) => { if (parts[n]) parts[n].visible = v; });
    if (parts.Wolf3D_Outfit_Top) parts.Wolf3D_Outfit_Top.visible = v && !gear.coat;
    upperCoat.visible = v && gear.coat;
  }

  return { root, bones: B, parts, state, gear, armLen, update, shoulderWorld, eyeWorld, setVisible, setHeadVisible, setGear, bodyPoint };
}
