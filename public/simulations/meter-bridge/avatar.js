// A full student body for the lab: lab coat, trousers, shoes, head with hair
// and safety goggles, a walk cycle, a forward lean for reaching across the
// bench, and two-bone arms that end at the rigged hands. Units are cm; the
// group's origin is between the feet on the floor and the student faces −Z
// when heading = 0.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

function limb(radiusTop, radiusBottom, mat) {
  // Unit-length capsule-ish limb along −Y from its origin; scaled to length at runtime
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, 1, 18, 1, true), mat);
  cyl.position.y = -0.5;
  cyl.castShadow = true;
  const capA = new THREE.Mesh(new THREE.SphereGeometry(radiusTop, 16, 10), mat);
  const capB = new THREE.Mesh(new THREE.SphereGeometry(radiusBottom, 16, 10), mat);
  capA.castShadow = capB.castShadow = true;
  g.add(cyl, capA, capB);
  g.userData = { cyl, capB };
  return g;
}
function setLimb(g, a, b) {
  // Place limb `g` (built along −Y) from world point a to world point b
  const d = tmp.copy(b).sub(a);
  const len = Math.max(0.01, d.length());
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize());
  g.userData.cyl.scale.set(1, len, 1);
  g.userData.cyl.position.y = -len / 2;
  g.userData.capB.position.y = -len;
}

export function buildAvatar(scene, skinMat) {
  const coat = new THREE.MeshStandardMaterial({ color: 0xf3f5f7, roughness: 0.9 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x1f2a44, roughness: 0.85 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.8 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2b1b12, roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4 });
  const goggleMat = new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: 0.05, transmission: 0.8, transparent: true, opacity: 0.35, depthWrite: false });
  const strap = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });

  const root = new THREE.Group();
  root.name = 'student';
  scene.add(root);

  // Legs: hip → knee → ankle pivots
  const legs = ['L', 'R'].map((side) => {
    const s = side === 'L' ? -1 : 1;
    const hip = new THREE.Group();
    hip.position.set(9 * s, 88, 0);
    const thigh = limb(7.2, 5.8, trousers);
    thigh.userData.cyl.scale.y = 42; thigh.userData.cyl.position.y = -21; thigh.userData.capB.position.y = -42;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -42;
    hip.add(knee);
    const shin = limb(5.6, 4.4, trousers);
    shin.userData.cyl.scale.y = 40; shin.userData.cyl.position.y = -20; shin.userData.capB.position.y = -40;
    knee.add(shin);
    const ankle = new THREE.Group();
    ankle.position.y = -41;
    knee.add(ankle);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 26), shoe);
    foot.geometry.translate(0, -2.5, -6);
    foot.castShadow = true;
    const toe = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), shoe);
    toe.scale.set(1, 0.7, 1.2); toe.position.set(0, -5.5, -18);
    ankle.add(foot, toe);
    root.add(hip);
    return { hip, knee, ankle };
  });

  // Torso pivots at the hips so the student can lean over the bench
  const torso = new THREE.Group();
  torso.position.set(0, 90, 0);
  root.add(torso);
  const coatProfile = [
    [0.1, -28], [19, -28], [18.5, -14], [16, 0], [15.5, 10], [18, 26], [20.5, 38], [19, 44], [8, 50], [0.1, 50],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(coatProfile, 36), coat);
  body.scale.set(1, 1, 0.62);
  body.castShadow = true; body.receiveShadow = true;
  torso.add(body);
  // Shirt and collar showing through the open coat, plus buttons and a pocket
  const placket = new THREE.Mesh(new THREE.PlaneGeometry(9, 36), shirt);
  placket.position.set(0, 26, -12.2);
  placket.rotation.y = Math.PI;
  torso.add(placket);
  const lapelL = new THREE.Mesh(new THREE.PlaneGeometry(6, 20), coat);
  lapelL.position.set(-5, 36, -12.4); lapelL.rotation.set(0, Math.PI, -0.35);
  const lapelR = lapelL.clone(); lapelR.position.x = 5; lapelR.rotation.z = 0.35;
  torso.add(lapelL, lapelR);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12), dark);
    b.rotation.x = Math.PI / 2; b.position.set(6.5, 20 - i * 12, -11.6);
    torso.add(b);
  }
  const pocket = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.9 }));
  pocket.position.set(-10, 30, -12.1); pocket.rotation.y = Math.PI;
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 8, 10), strap);
  pen.position.set(-8.5, 32.5, -12.4);
  torso.add(pocket, pen);

  // Neck and head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.2, 10, 16), skinMat);
  neck.position.y = 54;
  torso.add(neck);
  const head = new THREE.Group();
  head.position.y = 67;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 24), skinMat);
  skull.scale.set(0.86, 1.08, 0.98);
  skull.castShadow = true;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(10.6, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.scale.set(0.9, 1.08, 1.02); hair.position.set(0, 1.2, 0.8); hair.rotation.x = 0.25;
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), dark);
  eyeL.position.set(-3.2, 1.5, -9.2);
  const eyeR = eyeL.clone(); eyeR.position.x = 3.2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 10), skinMat);
  nose.rotation.x = -Math.PI / 2; nose.position.set(0, -1, -10.4);
  const earL = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 8), skinMat);
  earL.scale.set(0.5, 1, 0.8); earL.position.set(-8.6, 0, 0);
  const earR = earL.clone(); earR.position.x = 8.6;
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a4a3a }));
  mouth.position.set(0, -5, -9.3);
  // Safety goggles
  const goggles = new THREE.Mesh(new THREE.TorusGeometry(9.9, 1.6, 10, 40, Math.PI * 1.1), strap);
  goggles.rotation.set(Math.PI / 2, 0, Math.PI * 1.45); goggles.position.set(0, 1.5, 0);
  const lens = new THREE.Mesh(new THREE.BoxGeometry(14, 4.4, 1.2), goggleMat);
  lens.position.set(0, 1.5, -9.6);
  head.add(skull, hair, eyeL, eyeR, nose, earL, earR, mouth, goggles, lens);

  // Arms: upper arm and forearm in coat sleeves, placed each frame by IK
  const arms = ['L', 'R'].map((side) => {
    const upper = limb(5.2, 4.4, coat);
    const fore = limb(4.4, 3.4, coat);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.5, 8, 20), coat);
    root.parent.add(upper, fore, cuff);
    return { side, upper, fore, cuff, shoulderLocal: new THREE.Vector3(side === 'L' ? -19.5 : 19.5, 42, 1) };
  });

  const state = { pos: new THREE.Vector3(0, 0, 70), heading: 0, lean: 0, leanGoal: 0, phase: 0, speed: 0, visible: true };

  function shoulderWorld(side) {
    torso.updateMatrixWorld(true);
    return torso.localToWorld(arms[side === 'left' ? 0 : 1].shoulderLocal.clone());
  }

  // Two-bone IK from the shoulder to the wrist with a slight stretch allowance
  function solveArm(arm, wrist, cuffDir) {
    const S = torso.localToWorld(arm.shoulderLocal.clone());
    const a = 30, b = 27;
    const d = wrist.clone().sub(S);
    let dist = d.length();
    const k = Math.min(1.18, Math.max(1, dist / (a + b - 0.5)));
    const A = a * k, B = b * k;
    dist = Math.min(dist, A + B - 0.01);
    const dir = d.normalize();
    const along = (A * A - B * B + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, A * A - along * along));
    // Elbows point down and outward
    const sideSign = arm.side === 'L' ? -1 : 1;
    const pole = new THREE.Vector3(sideSign * 0.6, -1, 0.35).applyAxisAngle(UP, state.heading);
    pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const E = S.clone().addScaledVector(dir, along).addScaledVector(pole, h);
    const W = S.clone().addScaledVector(dir, dist);
    setLimb(arm.upper, S, E);
    setLimb(arm.fore, E, W);
    arm.cuff.position.copy(W);
    arm.cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cuffDir || dir);
  }

  function update(dt, { moving, speed, wristL, wristR, cuffL, cuffR }) {
    state.speed += (speed - state.speed) * Math.min(1, dt * 8);
    const amp = Math.min(1, state.speed / 120);
    state.phase += (state.speed * dt) / 55 * Math.PI;
    const sw = Math.sin(state.phase);
    legs[0].hip.rotation.x = sw * 0.5 * amp;
    legs[1].hip.rotation.x = -sw * 0.5 * amp;
    legs[0].knee.rotation.x = Math.max(0, -Math.cos(state.phase)) * 0.9 * amp;
    legs[1].knee.rotation.x = Math.max(0, Math.cos(state.phase)) * 0.9 * amp;
    legs[0].ankle.rotation.x = -legs[0].hip.rotation.x * 0.4;
    legs[1].ankle.rotation.x = -legs[1].hip.rotation.x * 0.4;
    state.lean += ((moving ? 0.05 : state.leanGoal) - state.lean) * Math.min(1, dt * 5);
    // Lean forward from the hips, keeping the feet planted
    torso.rotation.set(-state.lean, 0, sw * 0.03 * amp);
    head.rotation.x = state.lean * 0.5; // look down at the bench while leaning
    root.position.set(state.pos.x, state.pos.y + Math.abs(sw) * 1.4 * amp, state.pos.z);
    root.rotation.y = state.heading;
    root.updateMatrixWorld(true);
    if (wristL) solveArm(arms[0], wristL, cuffL);
    if (wristR) solveArm(arms[1], wristR, cuffR);
  }

  function setVisible(v) {
    state.visible = v;
    root.visible = v;
    arms.forEach((a) => { a.upper.visible = a.fore.visible = a.cuff.visible = v; });
  }

  // Local-to-world helper for body-relative targets (e.g. hands resting at the sides)
  function bodyPoint(x, y, z) {
    if (Math.abs(root.position.y - state.pos.y) > 3) root.position.y = state.pos.y;
    root.position.x = state.pos.x; root.position.z = state.pos.z;
    root.rotation.y = state.heading;
    root.updateMatrixWorld(true);
    return root.localToWorld(new THREE.Vector3(x, y, z));
  }

  return { root, torso, head, state, update, shoulderWorld, setVisible, bodyPoint };
}
