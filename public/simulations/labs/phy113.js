// Hooke's law: spring constant of a helical spring. A spring hangs from a
// stand in front of a vertical scale; slotted weights are added to a hanger
// with a pointer. The load oscillates (lightly damped) before it settles.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const HOOK = V3(0, 55, -12); // spring top, relative to the bench top
const SCALE_X = -5.2, SCALE_TOP = 52, SCALE_LEN = 40; // scale reads 0 at the top, increasing downward
const L0 = 10, M_HANGER = 0.05, M_SLOT = 0.05, G = 9.8;

function buildStand() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(18, 1.6, 26), PH.PM.castIron); base.position.set(0, 0.8, -18); base.castShadow = true;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 66, 14), PH.PM.steel); rod.position.set(0, 33, -27);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 16, 10), PH.PM.steel); arm.rotation.x = Math.PI / 2; arm.position.set(0, HOOK.y + 2, -19.5);
  const boss = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 2.6), PH.PM.darkSteel); boss.position.set(0, HOOK.y + 2, -27);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.14, 6, 14, Math.PI * 1.5), PH.PM.darkSteel); hook.position.set(0, HOOK.y + 1, HOOK.z); hook.rotation.y = Math.PI / 2;
  // vertical scale on its own arm, beside the spring
  const sArm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 16, 10), PH.PM.steel); sArm.rotation.x = Math.PI / 2; sArm.position.set(SCALE_X, 30, -19.5);
  const sBoss = boss.clone(); sBoss.position.set(0, 30, -27);
  const sArm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, SCALE_X * -1, 8), PH.PM.steel); sArm2.rotation.z = Math.PI / 2; sArm2.position.set(SCALE_X / 2, 30, -27);
  const plank = new THREE.Mesh(new THREE.BoxGeometry(3.4, SCALE_LEN + 2, 0.6), PH.PM.wood); plank.position.set(SCALE_X - 0.6, SCALE_TOP - SCALE_LEN / 2, HOOK.z - 1.2);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(3, SCALE_LEN), new THREE.MeshStandardMaterial({ map: PH.scaleTexture(SCALE_LEN, { vertical: true }), roughness: 0.6 }));
  strip.position.set(SCALE_X - 0.6, SCALE_TOP - SCALE_LEN / 2, HOOK.z - 0.88);
  g.add(base, rod, arm, boss, hook, sArm, sBoss, sArm2, plank, strip);
  return { group: g, size: [18, 66, 26], grip: V3(0, 40, -26.3) };
}
function buildSpring() {
  const s = PH.spring({ turns: 28, r: 1.0, wire: 0.1 });
  const g = new THREE.Group();
  g.add(s.mesh);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 6, 12), s.mesh.material); eye.position.y = 0.4; g.add(eye);
  return { group: g, spring: s, size: [2.4, 12, 2.4], grip: V3(0, -2, 1), pose: 'pinch' };
}
function buildHanger() {
  const g = PH.hanger(50);
  // pointer: a thin horizontal needle toward the scale
  const p = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0xdc2626 })); p.position.set(-2.4, 9.2, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 8), p.material); tip.rotation.z = Math.PI / 2; tip.position.set(-4.9, 9.2, 0);
  g.add(p, tip);
  return { group: g, size: [4.4, 10.5, 4.4], grip: V3(0, 7, 0.4), pose: 'pinch' };
}
function buildWeightBox() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(22, 2.4, 8), PH.PM.darkWood); box.position.y = 1.2; box.castShadow = true;
  g.add(box);
  const weights = [];
  for (let i = 0; i < 6; i++) {
    const w = PH.slottedWeight(50);
    w.position.set(-8.5 + i * 3.4, 2.4, 0);
    w.rotation.z = -Math.PI / 2 + 0.25; w.rotation.y = Math.PI / 2;
    w.userData.home = w.position.clone(); w.userData.homeRot = w.rotation.clone();
    g.add(w); weights.push(w);
  }
  return { group: g, weights, size: [22, 5, 8], grip: V3(10, 2.4, 0) };
}

export default {
  id: 'phy113',
  lab: 'Physics Lab',
  title: 'Hooke’s law — spring constant of a helical spring',
  intro: 'Find the spring constant of a helical spring by loading it with slotted weights and measuring its extension.',
  board: {
    title: 'Hooke’s law: F = k x',
    formulas: ['F = k x', 'k = F / x = m g / x', 'k = slope of F–x graph'],
    steps: ['Hang the spring from the rigid support', 'Hang the hanger; note pointer reading (zero load)', 'Add 50 g at a time; wait until it stops', 'Read pointer with eye level (no parallax)', 'Extension x = reading − zero reading'],
    note: 'Do not exceed the elastic limit!',
  },
  items: {
    stand: { name: 'Stand with vertical scale', label: 'Stand and scale', build: () => buildStand(), slot: [0, 0, 0], home: [186, 12, 0], setupText: 'Carry the stand with its vertical metre scale to the bench.', why: 'A heavy base keeps the support rigid, so only the spring stretches.' },
    spring: { name: 'Helical spring', label: 'Spring', build: () => buildSpring(), slot: [HOOK.x, HOOK.z, 0], slotY: -3 + HOOK.y, homeY: -3 + L0 + 1, setupText: 'Hang the spring from the hook of the stand.' },
    hanger: { name: 'Weight hanger with pointer', label: 'Hanger (50 g)', build: () => buildHanger(), slot: [HOOK.x, HOOK.z, 0], slotY: -3 + HOOK.y - L0 - 10.2, setupText: 'Hang the 50 g hanger (with its pointer) on the spring.', why: 'The pointer moves over the scale with the lower end of the spring.' },
    box: { name: 'Box of slotted weights (50 g)', label: 'Slotted weights', build: () => buildWeightBox(), slot: [26, 10, 0] },
  },
  setupOrder: ['stand', 'spring', 'hanger', 'box'],
  views: {
    spring: { label: 'Spring & scale', pos: [16, 34, 36], target: [-2, 38, -12] },
  },
  classicView: 'spring',
  pips: [
    { id: 'pointer', title: 'Pointer on the scale (eye level)', fov: 22, update: (cam, lab) => { const y = pointerY(lab); cam.position.set(SCALE_X - 1.5, y, HOOK.z + 12); cam.lookAt(SCALE_X - 1.5, y, HOOK.z - 1); }, show: (lab) => lab.items.hanger.placed },
  ],
  overlay: '<b>Load–extension</b><canvas id="fxGraph" width="220" height="140" style="width:220px;height:140px;display:block"></canvas><div id="hState"></div>',
  hintExtra: 'click the <b>hanger</b> to add a weight, the <b>box</b> to take one off',
  panel: [{
    title: 'Loading',
    html: `
      <div class="row"><button class="btn act" id="hAdd">Add 50 g</button><button class="btn ghost act" id="hRem">Remove 50 g</button></div>
      <div class="meters">
        <div class="m"><i>Added load</i><b id="hM">0 g</b></div>
        <div class="m"><i>Pointer reading</i><b id="hR">—</b></div>
        <div class="m"><i>Extension</i><b id="hX">—</b></div>
        <div class="m"><i>Spring</i><b id="hMot">at rest</b></div>
      </div>`,
    bind: (lab, root) => {
      root.querySelector('#hAdd').onclick = () => lab.act(() => addWeight(lab));
      root.querySelector('#hRem').onclick = () => lab.act(() => removeWeight(lab));
    },
  }],
  table: {
    columns: [
      { key: 'm', label: 'Load (g)', fmt: (v) => String(Math.round(v * 1000)) },
      { key: 'r', label: 'Reading (cm)', fmt: (v) => v.toFixed(1) },
      { key: 'x', label: 'x (cm)', fmt: (v) => v.toFixed(1) },
      { key: 'F', label: 'F = mg (N)', fmt: (v) => v.toFixed(2) },
      { key: 'k', label: 'k = F/x (N/m)', fmt: (v) => v.toFixed(1) },
    ],
    recordLabel: 'Record pointer reading',
    note: 'The zero-load reading (hanger only) is recorded first; x is measured from it.',
  },
  record: (lab) => lab.act(() => record(lab)),
  steps: (lab) => [
    { phase: 'Zero reading', text: 'With only the hanger on the spring, wait for it to stop and note the pointer reading.', why: 'Keep your eye level with the pointer to avoid parallax error.', check: () => lab.x.r0 != null, demo: () => record(lab), rings: () => [V3(SCALE_X, pointerY(lab), HOOK.z)] },
    ...[1, 2, 3, 4, 5].map((n) => ({
      phase: 'Loading',
      text: `Gently add a ${n === 1 ? '' : 'further '}50 g slotted weight (total ${n * 50} g), wait for the oscillations to die out and record the reading.`,
      why: n === 1 ? 'Lower each weight gently; a dropped weight can overstretch the spring.' : n === 3 ? 'Each extra 50 g should give the same extra extension if Hooke’s law holds.' : '',
      check: () => lab.rows.filter((q) => q.m > 0).length >= n,
      demo: async () => { while (lab.x.n < n) await addWeight(lab); await lab.waitFor(() => Math.abs(lab.x.v) < 0.3 && Math.abs(lab.x.ext - eqExt(lab)) < 0.05, 20); await record(lab); },
    })),
  ],
  state: () => ({ k: 20 + Math.random() * 14, n: 0, ext: 0, v: 0, r0: null, hung: false }),
  init: (lab) => {
    lab.actionable(lab.items.hanger.group, { tip: () => `Hanger with ${lab.x.n * 50} g — click to add a 50 g weight`, run: () => addWeight(lab), enabled: () => lab.items.hanger.placed });
    lab.actionable(lab.items.box.group, { tip: 'Box of slotted weights — click to take a weight off the hanger', run: () => removeWeight(lab), enabled: () => lab.items.box.placed && lab.x.n > 0 });
  },
  reset: (lab) => {
    const box = lab.items.box.app;
    box.weights.forEach((w) => { box.group.add(w); w.position.copy(w.userData.home); w.rotation.copy(w.userData.homeRot); });
    lab.x.ext = eqExt(lab);
  },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.k == null) return;
    const hung = lab.items.hanger.placed && lab.items.spring.placed;
    const Mtot = (hung ? M_HANGER + x.n * M_SLOT : 0) + 0.004;
    const xeq = eqExt(lab);
    const w = Math.sqrt(x.k / Mtot), zeta = 0.05;
    const steps = Math.max(1, Math.ceil(dt / 0.002)), h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const acc = -w * w * (x.ext - xeq) - 2 * zeta * w * x.v;
      x.v += acc * h; x.ext += x.v * h;
    }
  },
  update: (lab) => {
    const x = lab.x;
    if (x.k == null) return;
    const sp = lab.items.spring;
    if (sp.placed) sp.app.spring.setLength(L0 + Math.max(0, x.ext)); else sp.app.spring.setLength(L0);
    const hg = lab.items.hanger;
    if (hg.placed && !lab.carried.has('hanger')) hg.group.position.set(HOOK.x, -3 + HOOK.y - L0 - x.ext - 10.2, HOOK.z);
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const r = reading(lab);
    $('hM').textContent = `${x.n * 50} g`;
    $('hR').textContent = lab.items.hanger.placed ? `${r.toFixed(2)} cm` : '—';
    $('hX').textContent = x.r0 != null ? `${(r - x.r0).toFixed(2)} cm` : '—';
    const moving = Math.abs(x.v) > 0.3;
    $('hMot').textContent = moving ? 'oscillating' : 'at rest';
    $('hMot').className = moving ? 'warn' : 'ok';
    $('hState').textContent = `Pointer: ${lab.items.hanger.placed ? r.toFixed(1) : '—'} cm ${moving ? '(oscillating)' : ''}`;
    drawGraph(lab);
  },
  chips: (lab) => [[`Load: ${lab.x.n * 50} g`, ''], [Math.abs(lab.x.v) > 0.3 ? 'Spring oscillating' : 'Spring at rest', Math.abs(lab.x.v) > 0.3 ? 'hot' : 'ok']],
  result: (lab) => {
    const r = lab.rows.filter((q) => q.x > 0);
    if (!r.length) return { items: [['Mean k', '—'], ['Slope of F–x', '—'], ['Actual k', 'hidden']], note: 'Record the zero reading, then five loaded readings.' };
    const mean = r.reduce((s, q) => s + q.k, 0) / r.length;
    const slope = (r.reduce((s, q) => s + q.F * q.x, 0) / r.reduce((s, q) => s + q.x * q.x, 0)) * 100;
    const reveal = r.length >= 5;
    return { items: [['Mean k = F/x', `${mean.toFixed(1)} N/m`], ['Slope of F–x', `${slope.toFixed(1)} N/m`], ['Actual k (after 5)', reveal ? `${lab.x.k.toFixed(1)} N/m` : 'hidden'], ['Error', reveal ? `${(((mean - lab.x.k) / lab.x.k) * 100).toFixed(1)} %` : '—']], note: 'Equal loads give equal extensions: extension is proportional to load (Hooke’s law).' };
  },
  obsRows: 5,
  obsKeys: ['F', 'x', 'k'],
  observation: (lab) => ({ rows: lab.rows.filter((q) => q.x > 0).map((q) => ({ F: q.F.toFixed(2), x: q.x.toFixed(1), k: q.k.toFixed(1) })) }),
};

// ---------------------------------------------------------------------------

const eqExt = (lab) => ((lab.items.hanger.placed && lab.items.spring.placed ? M_HANGER + lab.x.n * M_SLOT : 0) * G) / lab.x.k * 100;
const pointerY = (lab) => -3 + HOOK.y - L0 - lab.x.ext - 10.2 + 9.2;
const reading = (lab) => SCALE_TOP - (pointerY(lab) + 3);

async function addWeight(lab) {
  const x = lab.x, box = lab.items.box.app, hg = lab.items.hanger;
  if (!hg.placed) { lab.toast('Hang the hanger on the spring first.', 'err'); return; }
  if (x.n >= box.weights.length) { lab.toast('No more weights in the box.', 'warn'); return; }
  const w = box.weights[x.n];
  const R = lab.handR();
  await lab.touch(w, null, { pose: 'pinch', lift: 0.8 });
  lab.scene.attach(w);
  const start = w.position.clone(), q0 = w.quaternion.clone();
  const q1 = new THREE.Quaternion();
  // over the hanger rod, then slide down onto the stack
  const top = () => hg.group.localToWorld(V3(0, 0.45 + x.n * 0.62, 0));
  await lab.tween(1.0, (e) => { w.position.lerpVectors(start, top().add(V3(0, 11, 0)), e); w.position.y += Math.sin(Math.PI * e) * 6; w.quaternion.slerpQuaternions(q0, q1, e); R.goal.copy(w.position).add(V3(0, 0.8, 0)); });
  const s2 = w.position.clone();
  await lab.tween(0.8, (e) => { w.position.lerpVectors(s2, top(), e); R.goal.copy(w.position).add(V3(1, 0.8, 0)); });
  hg.group.attach(w);
  w.position.set(0, 0.45 + x.n * 0.62, 0); w.rotation.set(0, (x.n * 0.7) % 3, 0);
  x.n++;
  lab.sfx('tick');
  x.v -= 2.5; // a small jolt as the weight is released
  await lab.wait(0.4);
}
async function removeWeight(lab) {
  const x = lab.x, box = lab.items.box.app, hg = lab.items.hanger;
  if (x.n <= 0) return;
  const w = box.weights[x.n - 1];
  const R = lab.handR();
  await lab.touch(w, null, { pose: 'pinch', lift: 0.8 });
  lab.scene.attach(w);
  const start = w.position.clone();
  const home = box.group.localToWorld(w.userData.home.clone());
  await lab.tween(1.2, (e) => { w.position.lerpVectors(start, home, e); w.position.y += Math.sin(Math.PI * e) * 12; R.goal.copy(w.position).add(V3(0, 0.8, 0)); });
  box.group.attach(w);
  w.position.copy(w.userData.home); w.rotation.copy(w.userData.homeRot);
  x.n--;
  x.v += 2;
  void hg;
}
async function record(lab) {
  const x = lab.x;
  if (!lab.items.hanger.placed) { lab.toast('Hang the hanger on the spring first.', 'err'); return; }
  if (Math.abs(x.v) > 0.3) { lab.toast('The spring is still oscillating — wait until the pointer is at rest.', 'warn'); return; }
  await lab.touch(V3(SCALE_X - 1, pointerY(lab) + 0.5, HOOK.z + 1.2), null, { pose: 'point', pitch: -0.1 });
  const r = Math.round(reading(lab) * 10) / 10;
  if (x.r0 == null || x.n === 0) { x.r0 = r; lab.addRow({ m: 0, r, x: 0, F: 0, k: 0 }); lab.toast(`Zero-load reading: ${r.toFixed(1)} cm`, 'ok'); return; }
  if (lab.rows.some((q) => Math.abs(q.m - x.n * M_SLOT) < 1e-6)) { lab.toast('This load is already recorded — add another weight.', 'warn'); return; }
  const ext = r - x.r0, F = x.n * M_SLOT * G;
  lab.addRow({ m: x.n * M_SLOT, r, x: ext, F, k: (F / ext) * 100 });
  lab.toast(`Load ${x.n * 50} g: reading ${r.toFixed(1)} cm, extension ${ext.toFixed(1)} cm`, 'ok');
}
function drawGraph(lab) {
  const c = document.getElementById('fxGraph');
  if (!c) return;
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  const x0 = 26, y0 = H - 16, w = W - 34, h = H - 24;
  g.strokeStyle = '#94a3b8'; g.beginPath(); g.moveTo(x0, 4); g.lineTo(x0, y0); g.lineTo(x0 + w, y0); g.stroke();
  g.fillStyle = '#94a3b8'; g.font = '10px sans-serif'; g.fillText('x (cm)', x0 + w - 30, y0 + 12); g.fillText('F', 8, 12);
  const pts = lab.rows.filter((q) => q.x > 0);
  const xm = 14, Fm = 3;
  g.fillStyle = '#fbbf24';
  pts.forEach((q) => { g.beginPath(); g.arc(x0 + (q.x / xm) * w, y0 - (q.F / Fm) * h, 3, 0, 7); g.fill(); });
  if (pts.length >= 2) {
    const k = pts.reduce((s, q) => s + q.F * q.x, 0) / pts.reduce((s, q) => s + q.x * q.x, 0);
    g.strokeStyle = '#34d399'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w, y0 - ((k * xm) / Fm) * h); g.stroke();
    g.fillStyle = '#34d399'; g.fillText(`k = ${(k * 100).toFixed(1)} N/m`, x0 + 6, 14);
  }
}
