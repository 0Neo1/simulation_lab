// The student: a full body that arrives in everyday clothes (t-shirt, jeans,
// trainers) and puts on the lab's safety gear (lab coat, goggles, gloves,
// safety shoes) before working. It walks, leans over the bench to reach, and
// its arms bend at the elbows to meet the rigged hands. Units are cm; the
// group's origin is between the feet on the floor and the student faces −Z
// when heading = 0.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

function limb(radiusTop, radiusBottom, mat) {
  // Limb along −Y from its origin, scaled to length at runtime
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, 1, 20, 1, true), mat);
  cyl.position.y = -0.5;
  const capA = new THREE.Mesh(new THREE.SphereGeometry(radiusTop, 18, 12), mat);
  const capB = new THREE.Mesh(new THREE.SphereGeometry(radiusBottom, 18, 12), mat);
  [cyl, capA, capB].forEach((m) => { m.castShadow = true; });
  g.add(cyl, capA, capB);
  g.userData = { cyl, capA, capB };
  return g;
}
function setLimbMaterial(g, mat) { ['cyl', 'capA', 'capB'].forEach((k) => { g.userData[k].material = mat; }); }
function fixedLimb(g, len) {
  g.userData.cyl.scale.y = len; g.userData.cyl.position.y = -len / 2; g.userData.capB.position.y = -len;
}
function setLimb(g, a, b) {
  const d = tmp.copy(b).sub(a);
  const len = Math.max(0.01, d.length());
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize());
  fixedLimb(g, len);
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const lathe = (pts, mat, seg = 40) => {
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

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

export function buildAvatar(scene, skinMat) {
  const M = {
    coat: new THREE.MeshStandardMaterial({ color: 0xf5f7f9, roughness: 0.88 }),
    coatShade: new THREE.MeshStandardMaterial({ color: 0xe3e7ec, roughness: 0.9 }),
    tee: new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.85 }),
    jeans: new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#2f4a78'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.18;
      for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() > 0.5 ? '#9fb6dc' : '#172745'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
    }), roughness: 0.9 }),
    sneaker: new THREE.MeshStandardMaterial({ color: 0xf1f1f1, roughness: 0.6 }),
    sole: new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 }),
    boot: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.45, metalness: 0.1 }),
    toecap: new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.3, metalness: 0.5 }),
    hair: new THREE.MeshStandardMaterial({ color: 0x24160e, roughness: 0.75 }),
    brow: new THREE.MeshStandardMaterial({ color: 0x1d120b, roughness: 0.8 }),
    eyeWhite: new THREE.MeshStandardMaterial({ color: 0xf8f8f5, roughness: 0.3 }),
    iris: new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.2 }),
    lips: new THREE.MeshStandardMaterial({ color: 0xa4574a, roughness: 0.5 }),
    goggleFrame: new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.35 }),
    goggleLens: new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, roughness: 0.02, transmission: 0.75, transparent: true, opacity: 0.45, clearcoat: 1, iridescence: 0.6, depthWrite: false }),
    strap: new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.6 }),
    badge: new THREE.MeshStandardMaterial({ map: canvasTex(128, 160, (g, w, h) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, w, 36);
      g.fillStyle = '#fff'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText('ZEROLAB', w / 2, 26);
      g.fillStyle = '#cbd5e1'; g.fillRect(34, 46, 60, 60);
      g.fillStyle = '#111'; g.font = 'bold 18px Arial'; g.fillText('STUDENT', w / 2, 132);
    }), roughness: 0.5 }),
  };

  const root = new THREE.Group();
  root.name = 'student';
  scene.add(root);

  // ---- Legs (jeans) with interchangeable footwear ----
  const legs = ['L', 'R'].map((side) => {
    const s = side === 'L' ? -1 : 1;
    const hip = new THREE.Group();
    hip.position.set(9 * s, 88, 0);
    const thigh = limb(7.6, 5.9, M.jeans); fixedLimb(thigh, 42);
    hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -42; hip.add(knee);
    const shin = limb(5.7, 4.5, M.jeans); fixedLimb(shin, 40);
    knee.add(shin);
    const ankle = new THREE.Group(); ankle.position.y = -41; knee.add(ankle);
    // Trainers
    const trainer = new THREE.Group();
    const tUpper = new THREE.Mesh(new THREE.BoxGeometry(9.5, 6, 24), M.sneaker);
    tUpper.geometry.translate(0, -2.2, -5.5);
    const tSole = new THREE.Mesh(new THREE.BoxGeometry(10.4, 2.2, 26), M.sole);
    tSole.geometry.translate(0, -5.9, -5.5);
    const tToe = new THREE.Mesh(new THREE.SphereGeometry(4.8, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.sneaker);
    tToe.scale.set(1, 0.8, 1.1); tToe.position.set(0, -5, -16.5);
    const swoosh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 9), M.strap);
    swoosh.position.set(4.9 * s, -2.5, -5); swoosh.rotation.x = 0.2;
    trainer.add(tUpper, tSole, tToe, swoosh);
    // Safety shoes: black leather with a steel toe cap and a thick sole
    const boot = new THREE.Group();
    const bUpper = new THREE.Mesh(new THREE.BoxGeometry(10.2, 9, 25), M.boot);
    bUpper.geometry.translate(0, -1, -5.5);
    const bSole = new THREE.Mesh(new THREE.BoxGeometry(11, 3, 27), M.goggleFrame);
    bSole.geometry.translate(0, -6.5, -5.5);
    const bToe = new THREE.Mesh(new THREE.SphereGeometry(5.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.toecap);
    bToe.scale.set(1, 0.85, 1.1); bToe.position.set(0, -5, -17);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.8, 3, 16), M.boot);
    collar.position.y = 3.5;
    boot.add(bUpper, bSole, bToe, collar);
    boot.visible = false;
    [trainer, boot].forEach((g) => g.traverse((o) => { if (o.isMesh) o.castShadow = true; }));
    ankle.add(trainer, boot);
    root.add(hip);
    return { hip, knee, ankle, trainer, boot };
  });

  // ---- Torso: pivots at the hips so the student can lean over the bench ----
  const torso = new THREE.Group();
  torso.position.set(0, 90, 0);
  root.add(torso);
  const flat = (m) => { m.scale.set(1, 1, 0.62); return m; };
  // Everyday t-shirt and belt line
  const tee = flat(lathe([[0.1, -6], [16.5, -6], [16, 4], [15.5, 12], [17.8, 26], [20, 38], [18.5, 44], [8.5, 50], [0.1, 50]], M.tee));
  const belt = flat(lathe([[16.8, -8], [16.8, -4]], M.goggleFrame));
  const hips = flat(lathe([[0.1, -14], [17.5, -14], [17, -6], [0.1, -6]], M.jeans));
  torso.add(tee, belt, hips);
  // Lab coat: longer, fuller, with lapels, buttons, pocket, pen and ID badge
  const coat = new THREE.Group();
  const coatBody = flat(lathe([[0.1, -30], [19.5, -30], [19, -14], [16.8, 0], [16.3, 10], [18.6, 26], [21, 38], [19.6, 44], [9, 50.5], [0.1, 50.5]], M.coat));
  coat.add(coatBody);
  const shirtV = new THREE.Mesh(new THREE.PlaneGeometry(8, 22), M.tee);
  shirtV.position.set(0, 38, -12.9); shirtV.rotation.y = Math.PI;
  const lapelL = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 22), M.coatShade);
  lapelL.position.set(-5.2, 37, -13.1); lapelL.rotation.set(0, Math.PI, -0.33);
  const lapelR = lapelL.clone(); lapelR.position.x = 5.2; lapelR.rotation.z = 0.33;
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 50), M.coatShade);
  seam.position.set(0, 0, -12.1); seam.rotation.y = Math.PI;
  coat.add(shirtV, lapelL, lapelR, seam);
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12), M.goggleFrame);
    b.rotation.x = Math.PI / 2; b.position.set(1.2, 24 - i * 12, -12.3);
    coat.add(b);
  }
  const pocket = new THREE.Mesh(new THREE.PlaneGeometry(8, 6.5), M.coatShade);
  pocket.position.set(-10.5, 30, -12.4); pocket.rotation.y = Math.PI;
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 8, 10), M.strap);
  pen.position.set(-8.6, 32.8, -12.7);
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 5.8), M.badge);
  badge.position.set(10.5, 30, -12.6); badge.rotation.y = Math.PI;
  const hipPocket = pocket.clone(); hipPocket.position.set(11, -12, -12.4);
  coat.add(pocket, pen, badge, hipPocket);
  coat.visible = false;
  torso.add(coat);

  // ---- Neck and head ----
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.3, 11, 18), skinMat);
  neck.position.y = 54;
  torso.add(neck);
  const head = new THREE.Group();
  head.position.y = 67;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(10, 40, 30), skinMat);
  skull.scale.set(0.84, 1.06, 0.96);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(7.2, 30, 20), skinMat);
  jaw.scale.set(0.95, 0.8, 0.95); jaw.position.set(0, -5.2, -1.2);
  const chin = new THREE.Mesh(new THREE.SphereGeometry(3.4, 16, 12), skinMat);
  chin.scale.set(1, 0.8, 0.8); chin.position.set(0, -8.6, -4.6);
  // Hair: a fuller crown, side volume and a fringe
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(10.7, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.56), M.hair);
  hairCap.scale.set(0.9, 1.1, 1.04); hairCap.position.set(0, 1.4, 0.8); hairCap.rotation.x = 0.22;
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(9.6, 24, 16), M.hair);
  hairBack.scale.set(0.9, 0.9, 0.7); hairBack.position.set(0, -1.5, 4.2);
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(5.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.hair);
  fringe.scale.set(1.3, 0.5, 0.75); fringe.position.set(1.5, 7.6, -7.2); fringe.rotation.set(-0.5, 0, 0.18);
  const face = new THREE.Group();
  const eye = (x) => {
    const g = new THREE.Group();
    const w = new THREE.Mesh(new THREE.SphereGeometry(1.25, 16, 12), M.eyeWhite);
    w.scale.set(1.1, 0.75, 0.6);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), M.iris);
    iris.position.z = -0.55;
    g.add(w, iris);
    g.position.set(x, 1.4, -8.9);
    return g;
  };
  const brow = (x, r) => { const b = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.55, 0.8), M.brow); b.position.set(x, 3.4, -9.1); b.rotation.z = r; return b; };
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.8, 12), skinMat);
  nose.rotation.x = -Math.PI / 2 + 0.25; nose.position.set(0, -0.8, -10.2);
  const lipU = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 8), M.lips);
  lipU.scale.set(1.35, 0.32, 0.5); lipU.position.set(0, -4.9, -8.8);
  const lipL = lipU.clone(); lipL.scale.set(1.2, 0.38, 0.5); lipL.position.y = -5.6;
  const ear = (x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 10), skinMat); e.scale.set(0.45, 1, 0.75); e.position.set(x, 0.2, 0.4); return e; };
  face.add(eye(-3.3), eye(3.3), brow(-3.3, 0.06), brow(3.3, -0.06), nose, lipU, lipL, ear(-8.5), ear(8.5));
  head.add(skull, jaw, chin, hairCap, hairBack, fringe, face);
  // Wraparound safety goggles over the eyes
  const goggles = makeGoggles();
  goggles.position.set(0, 1.9, 0);
  goggles.scale.set(0.86, 0.95, 0.96);
  goggles.visible = false;
  head.add(goggles);

  // ---- Arms: IK from shoulder to wrist; short tee sleeves or long coat sleeves ----
  const arms = ['L', 'R'].map((side) => {
    const upper = limb(5.3, 4.5, M.tee);
    const fore = limb(4.3, 3.3, skinMat);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.55, 8, 20), M.coat);
    [upper, fore, cuff].forEach((o) => scene.add(o));
    return { side, upper, fore, cuff, shoulderLocal: new THREE.Vector3(side === 'L' ? -19.5 : 19.5, 42, 1) };
  });

  const gear = { coat: false, goggles: false, gloves: false, shoes: false };
  const state = { pos: new THREE.Vector3(0, 0, 70), heading: 0, lean: 0, leanGoal: 0, phase: 0, speed: 0, visible: true };

  function setGear(name, on) {
    gear[name] = on;
    if (name === 'coat') {
      coat.visible = on;
      tee.visible = !on;
      arms.forEach((a) => {
        setLimbMaterial(a.upper, on ? M.coat : M.tee);
        setLimbMaterial(a.fore, on ? M.coat : skinMat);
        a.cuff.visible = on && state.visible;
      });
    } else if (name === 'goggles') goggles.visible = on;
    else if (name === 'shoes') legs.forEach((l) => { l.boot.visible = on; l.trainer.visible = !on; });
  }

  function shoulderWorld(side) {
    torso.updateWorldMatrix(true, false);
    return torso.localToWorld(arms[side === 'left' ? 0 : 1].shoulderLocal.clone());
  }
  // Eye level (between the eyes, slightly forward) for the first-person camera
  function eyeWorld() {
    head.updateWorldMatrix(true, false);
    return head.localToWorld(new THREE.Vector3(0, 1.4, -9.5));
  }

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
    torso.rotation.set(-state.lean, 0, sw * 0.03 * amp);
    head.rotation.x = state.lean * 0.5 + (state.lookDown || 0);
    root.position.set(state.pos.x, state.pos.y + Math.abs(sw) * 1.4 * amp, state.pos.z);
    root.rotation.y = state.heading;
    root.updateMatrixWorld(true);
    if (wristL) solveArm(arms[0], wristL, cuffL);
    if (wristR) solveArm(arms[1], wristR, cuffR);
  }

  function setVisible(v) {
    state.visible = v;
    root.visible = v;
    arms.forEach((a) => { a.upper.visible = a.fore.visible = v; a.cuff.visible = v && gear.coat; });
  }
  // In first person the head is hidden (the camera is inside it); the body stays
  function setHeadVisible(v) { head.visible = v; neck.visible = v; }

  function bodyPoint(x, y, z) {
    if (Math.abs(root.position.y - state.pos.y) > 3) root.position.y = state.pos.y;
    root.position.x = state.pos.x; root.position.z = state.pos.z;
    root.rotation.y = state.heading;
    root.updateMatrixWorld(true);
    return root.localToWorld(new THREE.Vector3(x, y, z));
  }

  return { root, torso, head, state, gear, update, shoulderWorld, eyeWorld, setVisible, setHeadVisible, setGear, bodyPoint };
}
