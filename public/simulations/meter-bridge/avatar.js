// The student: a realistic, textured and rigged character (a Ready Player Me
// avatar, see assets/STUDENT-LICENSE.md). The character's own hands are the
// interactive hands: arms reach with two-bone IK on the real arm bones, the
// wrist turns to the requested orientation and each finger curls on its own
// bones. Safety gear is applied to the character's own clothes in the shader
// (white lab coat, black safety shoes, blue nitrile gloves on the skin of the
// hands) so it fits and deforms with the body; goggles and the coat's lower
// skirt are separate meshes attached to bones.
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

import { POSES } from './hands.js';

// In first person only the forearms and hands are drawn (like a game's view model)
const KEEP_IN_FP = /^(Left|Right)(ForeArm|Hand)/;
const d2r = THREE.MathUtils.degToRad;

// Adds per-vertex masks from the skin weights and a small shader layer to a
// skinned mesh's material: an optional tint of the clothing (keeping the
// texture's folds and shading), blue nitrile gloves over the hands, and
// discarding the torso/head in first person.
function patchMesh(mesh, bones, { tint = false, glove = false } = {}) {
  const geo = mesh.geometry;
  const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
  const skel = mesh.skeleton.bones.map((b) => b.name.replace('mixamorig', ''));
  const isHand = skel.map((n) => /^(Left|Right)Hand/.test(n));
  const isKeep = skel.map((n) => KEEP_IN_FP.test(n));
  const isHandB = skel.map((n) => /^(Left|Right)Hand/.test(n));
  const aGlove = new Float32Array(si.count), aHide = new Float32Array(si.count);
  for (let i = 0; i < si.count; i++) {
    for (let k = 0; k < 4; k++) {
      const b = si.getComponent(i, k), w = sw.getComponent(i, k);
      if (isHand[b]) aGlove[i] += w;
      if (isKeep[b]) aHide[i] += w;
    }
    aHide[i] = 1 - Math.min(1, aHide[i]);
  }
  geo.setAttribute('aGlove', new THREE.BufferAttribute(aGlove, 1));
  geo.setAttribute('aHide', new THREE.BufferAttribute(aHide, 1));
  // Keep the model's own material (and so its authored skin and cloth look);
  // only a small shader layer is added
  const mat = mesh.material.clone();
  mat.side = THREE.DoubleSide; // cut edges and sleeve openings show cloth, never see-through gaps
  const u = {
    uTint: { value: new THREE.Color(1, 1, 1) }, uTintMix: { value: 0 }, uTintBase: { value: 0.5 }, uTintGain: { value: 0.8 },
    uGlove: { value: 0 }, uGloveColor: { value: new THREE.Color(0x2c78dc) }, uFP: { value: 0 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlove; attribute float aHide; varying float vGlove; varying float vHide;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlove = aGlove; vHide = aHide;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vGlove; varying float vHide;
uniform vec3 uTint; uniform float uTintMix; uniform float uTintBase; uniform float uTintGain;
uniform float uGlove; uniform vec3 uGloveColor; uniform float uFP;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
if (uFP > 0.5 && vHide > 0.5) discard; // cut cleanly at the elbow`)
      .replace('#include <map_fragment>', `#include <map_fragment>
float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
diffuseColor.rgb = mix(diffuseColor.rgb, uTint * clamp(uTintBase + uTintGain * lum, 0.0, 1.2), uTintMix);
float gloveK = smoothstep(0.3, 0.7, vGlove) * uGlove;
diffuseColor.rgb = mix(diffuseColor.rgb, uGloveColor * (0.78 + 0.3 * lum), gloveK);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.36, gloveK);');
  };
  mat.customProgramCacheKey = () => `mb-${glove ? 'g' : ''}${tint ? 't' : ''}`;
  mesh.material = mat;
  return u;
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
  const armLen = { upper: W('RightArm').distanceTo(W('RightForeArm')), fore: W('RightForeArm').distanceTo(W('RightHand')) };
  armLen.hand = W('RightHand').distanceTo(W('RightHandMiddle4'));

  // ---- Clothing and skin shading ----
  const U = {};
  const patch = (name, opts) => { if (parts[name]) U[name] = patchMesh(parts[name], B, opts); };
  patch('Wolf3D_Body', { glove: true });
  patch('Wolf3D_Outfit_Top', { tint: true });
  patch('Wolf3D_Outfit_Bottom', { tint: true });
  patch('Wolf3D_Outfit_Footwear', { tint: true });
  const setTint = (name, hex, base, gain, mix = 1) => {
    const u = U[name]; if (!u) return;
    u.uTint.value.setHex(hex); u.uTintBase.value = base; u.uTintGain.value = gain; u.uTintMix.value = mix;
  };
  // Everyday clothes: a navy sweatshirt and denim jeans (the model's suit re-coloured)
  const casualTop = () => setTint('Wolf3D_Outfit_Top', 0x1f3b63, 0.45, 0.9);
  setTint('Wolf3D_Outfit_Bottom', 0x3a5a8c, 0.4, 0.95);
  casualTop();

  const M = {
    coat: new THREE.MeshStandardMaterial({ color: 0xf3f5f7, roughness: 0.85, side: THREE.DoubleSide }),
    pen: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 }),
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
  const hipY = W('Hips').y;

  // Lab coat: the jacket turns white (see setGear) and a coat skirt hangs to the knees
  // Open at the front like a real coat, and roomy enough that the legs stay inside
  const skirt = new THREE.Mesh(new THREE.LatheGeometry([[21.5, W('RightLeg').y - 2], [20, hipY - 14], [18.2, hipY + 4]].map(([r, y]) => new THREE.Vector2(r, y)), 48, Math.PI + 0.5, Math.PI * 2 - 1.0), M.coat);
  skirt.scale.set(1, 1, 0.86);
  attachTo(B.Hips, shadow(skirt));
  // Name badge and pen on the chest, placed on the jacket surface found by a ray
  const chestFront = (() => {
    const top = parts.Wolf3D_Outfit_Top;
    const y = W('Spine2').y + 2;
    const hits = top ? new THREE.Raycaster(V(0, y, -60), V(0, 0, 1)).intersectObject(top) : [];
    return hits.length ? hits[0].point.z : -14;
  })();
  const coatBits = new THREE.Group();
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.4), M.badge);
  badge.position.set(8.5, W('Spine2').y + 2, chestFront - 0.6); badge.rotation.set(-0.1, Math.PI, 0);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 10), M.pen);
  pen.position.set(-8.5, W('Spine2').y + 4, chestFront - 0.9); pen.rotation.x = -0.1;
  coatBits.add(badge, pen);
  attachTo(B.Spine2, shadow(coatBits));

  // Goggles on the head at eye level
  const goggles = makeGoggles();
  const eyeY = B.LeftEye ? W('LeftEye').y : W('Head').y + 9;
  goggles.position.set(0, eyeY + 0.4, W('Head').z - 0.6);
  goggles.scale.set(0.9, 0.95, 1.08);
  attachTo(B.Head, shadow(goggles));

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
    const cy = eyeY + 5.5, r = (top.y - cy) * 1.06;
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

  // ---- Hand rig, measured in the rest pose (student at the origin, facing −Z) ----
  const FINGERS = { index: 'Index', middle: 'Middle', ring: 'Ring', pinky: 'Pinky' };
  const rig = {};
  ['Left', 'Right'].forEach((side) => {
    const h = `${side}Hand`;
    const f0 = W(`${h}Middle1`).sub(W(h)).normalize();
    const lat = W(`${h}Index1`).sub(W(`${h}Pinky1`)).normalize();
    // Palm normal (out of the palm): for a right hand with fingers f and index-to-pinky
    // direction lat, the palm faces lat × f; for a left hand, f × lat
    const n0 = (side === 'Right' ? lat.clone().cross(f0) : f0.clone().cross(lat)).normalize();
    const q0 = B[h].getWorldQuaternion(new THREE.Quaternion());
    const m0 = new THREE.Matrix4().makeBasis(f0, n0, f0.clone().cross(n0)).invert();
    // Curl axes in each finger bone's own frame: rotating the finger toward the palm
    const axisW = f0.clone().cross(n0).normalize();
    const curl = {};
    Object.entries(FINGERS).forEach(([k, F]) => {
      curl[k] = [1, 2, 3].map((j) => {
        const b = B[`${h}${F}${j}`];
        return { b, axis: axisW.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize() };
      });
    });
    const t0 = W(`${h}Thumb2`).sub(W(`${h}Thumb1`)).normalize();
    // The thumb flexes across the palm toward the little finger (opposition), not straight out of it
    const tTarget = n0.clone().multiplyScalar(0.6).addScaledVector(lat, -1).normalize();
    const tAxisW = t0.clone().cross(tTarget).normalize();
    curl.thumb = [1, 2, 3].map((j) => {
      const b = B[`${h}Thumb${j}`];
      return { b, axis: tAxisW.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize() };
    });
    rig[side] = { q0, m0, curl, off: V(0, 0, 0), offKey: '', palmDotThumb: W(`${h}Thumb3`).sub(W(h)).dot(n0), n0: n0.clone(), qa: null };
  });

  const gear = { coat: false, goggles: false, gloves: false, shoes: false };
  const state = { pos: new THREE.Vector3(0, 0, 70), heading: 0, lean: 0, leanGoal: 0, phase: 0, speed: 0, visible: true, lookDown: 0 };
  let fpView = false;
  function setGear(name, on) {
    gear[name] = on;
    if (name === 'coat') {
      if (on) setTint('Wolf3D_Outfit_Top', 0xf5f7fa, 0.78, 0.35); else casualTop();
      skirt.visible = on && !fpView; coatBits.visible = on && !fpView;
    } else if (name === 'goggles') goggles.visible = on;
    else if (name === 'gloves') { if (U.Wolf3D_Body) U.Wolf3D_Body.uGlove.value = on ? 1 : 0; }
    else if (name === 'shoes') { if (on) setTint('Wolf3D_Outfit_Footwear', 0x111214, 0.25, 0.55); else setTint('Wolf3D_Outfit_Footwear', 0xffffff, 0, 0, 0); }
  }
  ['coat', 'goggles', 'gloves', 'shoes'].forEach((g) => setGear(g, false));

  function place() {
    root.position.set(state.pos.x, state.pos.y, state.pos.z);
    root.rotation.y = state.heading;
    root.updateMatrixWorld(true);
  }
  function shoulderWorld(side) { place(); return W(side === 'left' ? 'LeftArm' : 'RightArm'); }
  function eyeWorld() { return V(state.pos.x, state.pos.y + EYE_HEIGHT, state.pos.z).add(V(-Math.sin(state.heading), 0, -Math.cos(state.heading)).multiplyScalar(8)); }
  function bodyPoint(x, y, z) { place(); return root.localToWorld(V(x, y, z)); }

  // Two-bone IK on the real arm bones (no stretching: the student leans to reach)
  function solveArm(side, wrist) {
    const S = W(`${side}Arm`);
    const a = armLen.upper, b = armLen.fore;
    const d = wrist.clone().sub(S);
    const dist = Math.min(d.length(), a + b - 0.05);
    const dir = d.normalize();
    const along = (a * a - b * b + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, a * a - along * along));
    const sgn = side === 'Left' ? -1 : 1;
    const pole = V(sgn * 0.75, -1, 0.3).applyAxisAngle(V(0, 1, 0), state.heading);
    pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const E = S.clone().addScaledVector(dir, along).addScaledVector(pole, h);
    aimBone(B[`${side}Arm`], W(`${side}ForeArm`), E);
    aimBone(B[`${side}ForeArm`], W(`${side}Hand`), S.clone().addScaledVector(dir, dist));
  }
  // The hand's world orientation for a yaw/pitch (fingers along −Z, palm down at 0/0)
  function handQuat(side, yaw, pitch) {
    const e = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    const F = V(0, 0, -1).applyEuler(e), N = V(0, -1, 0).applyEuler(e);
    const m1 = new THREE.Matrix4().makeBasis(F, N, F.clone().cross(N));
    const q = new THREE.Quaternion().setFromRotationMatrix(m1.multiply(rig[side].m0));
    return q.multiply(rig[side].q0);
  }
  function setWorldQuat(bone, q) {
    const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    bone.quaternion.copy(pq.multiply(q));
    bone.updateMatrixWorld(true);
  }
  // Human wrists: the forearm rolls (pronation/supination, up to ~100°) and the
  // wrist bends at most ~70°. The model has no twist bones, so an unlimited
  // twist at the wrist would pinch the skin into a gap; instead the roll goes
  // into the forearm and the remaining bend is capped.
  function limitWrist(side, qWant) {
    const fore = B[`${side}ForeArm`], hand = B[`${side}Hand`];
    const relRest = rest[`${side}Hand`];
    const foreW = fore.getWorldQuaternion(new THREE.Quaternion());
    const delta = foreW.clone().invert().multiply(qWant).multiply(relRest.clone().invert()); // in forearm frame
    const axis = hand.position.clone().normalize();
    const d = new THREE.Vector3(delta.x, delta.y, delta.z);
    const p = axis.clone().multiplyScalar(d.dot(axis));
    let twist = new THREE.Quaternion(p.x, p.y, p.z, delta.w);
    if (twist.lengthSq() < 1e-9) twist.identity(); else twist.normalize();
    const clampQ = (q, maxRad) => {
      const ang = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(q.w), 0, 1));
      return ang > maxRad ? new THREE.Quaternion().slerp(q, maxRad / ang) : q;
    };
    const twistC = clampQ(twist, d2r(100));
    fore.quaternion.multiply(twistC);
    fore.updateMatrixWorld(true);
    const swing = clampQ(twistC.clone().invert().multiply(delta), d2r(72));
    hand.quaternion.copy(swing.multiply(relRest));
    hand.updateMatrixWorld(true);
  }
  function contactPoint(side, contact, palmN) {
    const h = `${side}Hand`;
    if (contact === 'pinch') return W(`${h}Index4`).lerp(W(`${h}Thumb4`), 0.5);
    if (contact === 'palm') return W(h).lerp(W(`${h}Middle1`), 0.55).addScaledVector(palmN, 2.2);
    return W(`${h}Index4`);
  }
  // Places a hand so that its contact point (fingertip, pinch or palm) is at hand.pos
  function poseHand(side, hand) {
    const r = rig[side];
    const q = handQuat(side, hand.yaw, hand.pitch);
    const key = hand.contact;
    if (r.offKey !== key) { r.offKey = key; r.off.set(0, -2, -armLen.hand); }
    const wrist = hand.pos.clone().sub(r.off.clone().applyQuaternion(r.qa || q));
    solveArm(side, wrist);
    limitWrist(side, q);
    const cur = hand.current;
    for (const [k, list] of Object.entries(r.curl)) {
      const ang = cur[k];
      list.forEach(({ b, axis }, j) => {
        b.quaternion.copy(rest[b.name.replace('mixamorig', '')]).multiply(new THREE.Quaternion().setFromAxisAngle(axis, d2r(ang[j]) * (k === 'thumb' ? 0.9 : 1)));
      });
    }
    B[`${side}Hand`].updateMatrixWorld(true);
    // Remember where the contact point sits relative to the wrist, in the hand's frame, for next frame
    const qa = B[`${side}Hand`].getWorldQuaternion(new THREE.Quaternion()); // actual (limited) orientation
    r.qa = qa;
    const n = r.n0.clone().applyQuaternion(qa.clone().multiply(r.q0.clone().invert())); // palm normal now
    const cp = contactPoint(side, key, n);
    r.off.copy(cp.sub(W(`${side}Hand`)).applyQuaternion(qa.clone().invert()));
    hand.tip = W(`${side}HandIndex4`);
  }

  function update(dt, { moving, speed, handL, handR }) {
    state.speed += (speed - state.speed) * Math.min(1, dt * 8);
    const amp = Math.min(1, state.speed / 120);
    state.phase += (state.speed * dt) / 55 * Math.PI;
    const sw = Math.sin(state.phase);
    state.lean += ((moving ? 0.04 : state.leanGoal) - state.lean) * Math.min(1, dt * 4);
    place();
    Object.entries(rest).forEach(([n, q]) => B[n].quaternion.copy(q));
    root.updateMatrixWorld(true);
    const side = V(1, 0, 0).applyAxisAngle(V(0, 1, 0), state.heading); // student's right
    turnBone(B.LeftUpLeg, side, sw * 0.45 * amp);
    turnBone(B.RightUpLeg, side, -sw * 0.45 * amp);
    turnBone(B.LeftLeg, side, -Math.max(0, -Math.cos(state.phase)) * 0.8 * amp);
    turnBone(B.RightLeg, side, -Math.max(0, Math.cos(state.phase)) * 0.8 * amp);
    turnBone(B.Spine, side, -state.lean * 0.55);
    turnBone(B.Spine1, side, -state.lean * 0.3);
    turnBone(B.Spine2, side, -state.lean * 0.15);
    turnBone(B.Neck, side, -(state.lean * 0.3 + state.lookDown));
    if (handL) poseHand('Left', handL);
    if (handR) poseHand('Right', handR);
  }

  function setVisible(v) { state.visible = v; root.visible = v; }
  // First person: the camera sits in the head, so the head, neck and torso are
  // not drawn (they would fill the view); arms, hands and legs stay visible
  function setHeadVisible(v) {
    fpView = !v;
    B.Head.scale.setScalar(v ? 1 : 0.001);
    ['Wolf3D_Head', 'EyeLeft', 'EyeRight', 'Wolf3D_Teeth'].forEach((n) => { if (parts[n]) parts[n].visible = v; });
    Object.values(U).forEach((u) => { u.uFP.value = v ? 0 : 1; });
    coatBits.visible = gear.coat && v;
    skirt.visible = gear.coat && v;
    ['Wolf3D_Outfit_Bottom', 'Wolf3D_Outfit_Footwear'].forEach((n) => { if (parts[n]) parts[n].visible = v; });
  }

  // Hand controllers with the interface the lab uses (goal, pose, contact, yaw/pitch);
  // the avatar applies them to its own arm, wrist and finger bones in update()
  class BodyHand {
    constructor(sideName) {
      this.side = sideName; // 'right' | 'left'
      this.pos = V(0, 0, 0); this.goal = V(0, 0, 0);
      this.yaw = 0; this.yawGoal = 0; this.pitch = 0; this.pitchGoal = 0;
      this.speed = 14; this.contact = 'index';
      this.current = JSON.parse(JSON.stringify(POSES.relaxed));
      this.target = POSES.relaxed;
      this.root = { visible: true };
      this.tip = V(0, 0, 0);
    }
    setPose(name, contact) { this.target = POSES[name] || POSES.relaxed; if (contact) this.contact = contact; }
    update(dt) {
      const k = 1 - Math.exp(-dt * this.speed);
      this.pos.lerp(this.goal, k);
      this.yaw += Math.atan2(Math.sin(this.yawGoal - this.yaw), Math.cos(this.yawGoal - this.yaw)) * k;
      this.pitch += (this.pitchGoal - this.pitch) * k;
      const kp = 1 - Math.exp(-dt * 16);
      ['index', 'middle', 'ring', 'pinky', 'thumb'].forEach((f) => {
        for (let i = 0; i < 3; i++) this.current[f][i] += (this.target[f][i] - this.current[f][i]) * kp;
      });
    }
    tipWorld() { return this.tip.clone(); }
    setSleeve() {}
  }
  const right = new BodyHand('right'), left = new BodyHand('left');
  const hands = {
    right, left,
    setGloves(on) { setGear('gloves', on); },
    setSkin() {},
    update(dt) { right.update(dt); left.update(dt); },
  };

  return { root, bones: B, parts, rig, state, gear, armLen, hands, update, shoulderWorld, eyeWorld, setVisible, setHeadVisible, setGear, bodyPoint };
}
