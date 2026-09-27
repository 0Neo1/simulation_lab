// Melde's experiment (transverse arrangement): a thread tied to an
// electrically maintained tuning fork passes over a pulley to a pan of
// weights. At resonance the thread vibrates in p loops:
// f = (p / 2L) √(T/μ). The thread's motion is shown slowed down, with its
// blurred envelope as the eye sees it.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Z = -6, AXIS_Y = 12, PULLEY_X = 118, PR = 2.6, G = 9.8, PAN = 0.010; // kg
const SETS = [{ w: 40, p: 3 }, { w: 70, p: 4 }, { w: 100, p: 4 }, { w: 140, p: 5 }]; // added grams, loops aimed for

function buildScaleStrip() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.PlaneGeometry(200, 2.4), new THREE.MeshStandardMaterial({ map: PH.scaleTexture(200, { vertical: false }), roughness: 0.6 }));
  s.rotation.x = -Math.PI / 2; s.position.set(0, 0.03, 0);
  g.add(s);
  return { group: g, size: [200, 0.1, 2.4], grip: V3(0, 0.1, 0) };
}
function buildVibrator() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 10), PH.PM.castIron); base.position.y = 1; base.castShadow = true;
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.5, 20), PH.PM.copper); coil.rotation.z = Math.PI / 2; coil.position.set(-2, AXIS_Y - 4.2, 0);
  const post = new THREE.Mesh(new THREE.BoxGeometry(2, AXIS_Y - 4, 2), PH.PM.darkSteel); post.position.set(-4.5, (AXIS_Y - 4) / 2 + 2, 0);
  const fork = new THREE.Group();
  const steel = PH.PM.steel;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 10), steel); stem.rotation.z = Math.PI / 2; stem.position.set(-4.5, 0, 0);
  const prongs = [-0.9, 0.9].map((dz) => { const p = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, 0.5), steel); p.position.set(1.5, 0, dz); return p; });
  const bend = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.25, 8, 16, Math.PI), steel); bend.rotation.x = Math.PI / 2; bend.rotation.z = Math.PI / 2; bend.position.set(-3, 0, 0);
  fork.add(stem, ...prongs, bend);
  fork.position.set(0, AXIS_Y - 2, 0);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.2), PH.PM.red); sw.position.set(-5, 2.3, 4.2);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3f3f46, emissive: 0x22ff66, emissiveIntensity: 0 })); lamp.position.set(-2.8, 2.3, 4.2);
  g.add(base, coil, post, fork, sw, lamp);
  return { group: g, fork, prongs, sw, lamp, size: [14, AXIS_Y + 1, 10], grip: V3(-4, 3, 5), tipLocal: V3(6, AXIS_Y - 2, 0.9) };
}
function buildPulley() {
  const g = new THREE.Group();
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 5), PH.PM.castIron); clamp.castShadow = true;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1, AXIS_Y + 5, 1.2), PH.PM.darkSteel); arm.position.set(0, (AXIS_Y + 5) / 2, -1.4);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR, 0.8, 32), new THREE.MeshStandardMaterial({ color: 0xd9a948, metalness: 0.9, roughness: 0.3 })); wheel.rotation.x = Math.PI / 2; wheel.position.set(0, AXIS_Y + 3 - PR, 0);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 10), PH.PM.steel); screw.position.set(0, -5, 0);
  g.add(clamp, arm, wheel, screw);
  return { group: g, wheel, size: [3, AXIS_Y + 6, 5], grip: V3(0, 2, 2.6), pose: 'grab' };
}
function buildWeights() {
  const g = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(22, 1.4, 8), PH.PM.darkWood); tray.position.y = 0.7; g.add(tray);
  const pan = new THREE.Group();
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.6, 0.5, 24), PH.PM.brass); dish.position.y = 0.25;
  const strings = [0, 1, 2].map((i) => { const a = (i / 3) * Math.PI * 2; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 7.5, 4), new THREE.MeshStandardMaterial({ color: 0xe5e5e5 })); s.position.set(Math.cos(a) * 1.3, 4, Math.sin(a) * 1.3); s.rotation.set(Math.sin(a) * 0.34, 0, -Math.cos(a) * 0.34); return s; });
  pan.add(dish, ...strings);
  pan.position.set(-7, 1.4, 0);
  g.add(pan);
  const weights = [10, 10, 20, 20, 50, 50].map((m, i) => { const w = PH.slottedWeight(m); w.scale.setScalar(0.7); w.position.set(-1 + i * 3.3, 1.4, 0); w.userData.home = w.position.clone(); w.userData.m = m; g.add(w); return w; });
  return { group: g, pan, weights, size: [22, 3, 8], grip: V3(10, 1.4, 0) };
}

export default {
  id: 'phy114',
  lab: 'Physics Lab',
  title: 'Melde’s experiment — frequency of a tuning fork',
  intro: 'Find the frequency of an electrically maintained tuning fork from the standing waves it sets up on a stretched thread (transverse arrangement).',
  board: {
    title: 'Melde’s experiment (transverse)',
    formulas: ['f = (p / 2L) √(T / μ)', 'T = (m_pan + m) g', 'λ = 2L / p'],
    steps: ['Thread from fork prong over the pulley to the pan', 'Switch on the fork; add weights to the pan', 'Slide the fork to get sharp, steady loops', 'Count loops p; measure L fork → pulley', 'Repeat for different tensions'],
    note: 'Prongs vibrate perpendicular to the thread',
  },
  items: {
    strip: { name: 'Bench scale', label: 'Bench scale', build: () => buildScaleStrip(), slot: [20, Z + 4, 0], fixed: true, labelY: 1 },
    vib: { name: 'Electrically maintained tuning fork', label: 'Tuning fork vibrator', build: () => buildVibrator(), slot: [-40, Z, 0], setupText: 'Place the electrically maintained tuning fork at the far end of the bench, in line with the scale.' },
    pulley: { name: 'Pulley with bench clamp', label: 'Pulley', build: () => buildPulley(), slot: [PULLEY_X, Z, 0], slotY: -3 - 1, setupText: 'Clamp the pulley to the other end of the bench.' },
    wts: { name: 'Pan and slotted weights', label: 'Pan & weights', build: () => buildWeights(), slot: [80, 22, 0] },
  },
  setupOrder: ['vib', 'pulley', 'wts'],
  views: { thread: { label: 'Thread', fit: [-60, 125, [30, 8, Z]] } },
  classicView: 'thread',
  pips: [{ id: 'loops', title: 'Loops on the thread', fov: 30, update: (cam, lab) => { const a = tipX(lab), mid = (a + PULLEY_X) / 2, w = PULLEY_X - a; cam.position.set(mid, -3 + AXIS_Y + w * 0.25, Z + w * 1.05); cam.lookAt(mid, -3 + AXIS_Y, Z); }, show: (lab) => lab.x.tied }],
  overlay: '<b>Melde’s experiment</b><span class="big" id="mL">L = —</span><div id="mT"></div><div id="mP"></div>',
  hintExtra: 'drag the <b>vibrator</b> along the bench to change L · click the pan to add weights',
  panel: [{
    title: 'Controls',
    html: `
      <div class="row"><button class="btn ghost act" id="mTie">Tie thread, hang pan</button><button class="btn act" id="mOn">Switch on fork</button></div>
      <div class="row small">Add to pan: <button class="mini act" data-w="10">+10 g</button><button class="mini act" data-w="20">+20 g</button><button class="mini act" data-w="50">+50 g</button><button class="mini act" data-w="0">empty</button></div>
      <label class="lbl">Length L (fork to pulley) <span class="big" id="mLv">—</span></label>
      <input type="range" id="mSlide" min="40" max="150" step="0.1" value="100" />
      <div class="meters"><div class="m"><i>Tension T</i><b id="mTv">—</b></div><div class="m"><i>Loops</i><b id="mPv">—</b></div><div class="m"><i>μ (given)</i><b id="mMu">—</b></div><div class="m"><i>Resonance</i><b id="mRes">—</b></div></div>`,
    bind: (lab, root) => {
      root.querySelector('#mTie').onclick = () => lab.act(() => tie(lab));
      root.querySelector('#mOn').onclick = () => lab.act(() => toggle(lab));
      root.querySelectorAll('[data-w]').forEach((b) => { b.onclick = () => lab.act(() => (+b.dataset.w ? addMass(lab, +b.dataset.w) : emptyPan(lab))); });
      root.querySelector('#mSlide').oninput = (e) => { if (!lab.autopilot) setL(lab, +e.target.value); };
    },
  }],
  table: { columns: [{ key: 'T', label: 'T (N)', fmt: (v) => v.toFixed(3) }, { key: 'L', label: 'L (m)', fmt: (v) => v.toFixed(3) }, { key: 'p', label: 'Loops p' }, { key: 'f', label: 'f (Hz)', fmt: (v) => v.toFixed(1) }], recordLabel: 'Record T, L and loops', note: 'Record only when the loops are sharp and steady (at resonance).' },
  record: (lab) => lab.act(() => record(lab)),
  steps: (lab) => [
    { phase: 'Prepare', text: 'Tie the thread to the prong of the fork, pass it over the pulley and hang the pan on it.', check: () => lab.x.tied, demo: () => tie(lab) },
    { phase: 'Prepare', text: 'Switch on the electrically maintained tuning fork.', check: () => lab.x.on, demo: () => toggle(lab), rings: () => [lab.items.vib.app.sw.getWorldPosition(V3())] },
    ...SETS.flatMap((s, i) => [
      { phase: `Tension ${i + 1}`, text: `Put ${s.w} g in the pan, then slide the fork along the bench until the thread vibrates in sharp, steady loops. Count the loops and record T, L and p.`, why: i === 0 ? 'Sharp loops mean resonance: the fork frequency matches a natural frequency of the thread.' : i === 1 ? 'More tension means faster waves, so each loop becomes longer.' : '', check: () => lab.rows.length > i, demo: async () => { await setPan(lab, s.w); await tune(lab, s.p); await record(lab); } },
    ]),
  ],
  state: () => ({ f0: 95 + Math.random() * 20, mu: (4.5 + Math.random()) * 1e-4, L: 100, tied: false, on: false, added: 0, onPan: [] }),
  init: (lab) => {
    const v = lab.items.vib;
    let L0 = 0;
    lab.actionable(v.group, { tip: () => `Vibrator — drag along the bench (L = ${lab.x.L.toFixed(1)} cm)`, enabled: () => v.placed && lab.x.tied, drag: { start: () => { L0 = lab.x.L; }, move: (p, s) => setL(lab, L0 - (p.x - s.x)), hand: () => v.group.localToWorld(V3(-4, 3, 5)) } });
    lab.actionable(v.app.sw, { tip: () => `Fork switch — ${lab.x.on ? 'on' : 'off'}`, run: () => toggle(lab), enabled: () => v.placed });
    const mk = (op) => new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0xfff7e0, roughness: 0.8, transparent: op < 1, opacity: op, depthWrite: op >= 1 }));
    lab.thread = { live: mk(1), env1: mk(0.35), env2: mk(0.35), down: mk(1) };
    Object.values(lab.thread).forEach((m) => { m.userData.noPick = true; lab.scene.add(m); m.visible = false; });
  },
  reset: (lab) => { lab.x.onPan = []; const W = lab.items.wts; W.app.weights.forEach((w) => { W.group.add(w); w.position.copy(w.userData.home); w.rotation.set(0, 0, 0); }); W.group.add(W.app.pan); W.app.pan.position.set(-7, 1.4, 0); },
  quickSetup: () => {},
  update: (lab, dt, t) => {
    const x = lab.x;
    if (x.f0 == null) return;
    const v = lab.items.vib;
    if (v.placed && x.tied && !lab.carried.has('vib')) v.group.position.x = PULLEY_X - x.L - v.app.tipLocal.x;
    v.app.lamp.material.emissiveIntensity = x.on ? 2 : 0;
    const buzz = x.on ? Math.sin(t * 60) * 0.06 : 0;
    v.app.prongs.forEach((p, i) => { p.position.y = (i ? 1 : -1) * buzz; });
    const th = lab.thread;
    const vis = x.tied && v.placed;
    Object.values(th).forEach((m) => { m.visible = vis; });
    if (!vis) return;
    const a = tipX(lab), b = PULLEY_X, y0 = -3 + AXIS_Y;
    const { A, p } = response(lab);
    const N = 90;
    const mkTube = (fy) => { const pts = []; for (let i = 0; i <= N; i++) { const s = i / N; pts.push(V3(a + (b - a) * s, y0 + fy(s), Z)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, 0.09, 5, false); };
    const shape = (s) => Math.sin(p * Math.PI * s) * A;
    const phase = Math.sin(t * 2 * Math.PI * 1.6); // slowed-down motion
    const set = (m, geo) => { m.geometry.dispose(); m.geometry = geo; };
    set(th.live, mkTube((s) => shape(s) * phase));
    set(th.env1, mkTube((s) => shape(s)));
    set(th.env2, mkTube((s) => -shape(s)));
    const hangY = -3 + AXIS_Y + 3 - PR - 20;
    set(th.down, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(b, y0 + 0.1, Z), V3(b + PR * 0.7, y0 - PR * 0.3, Z), V3(b + PR, y0 - PR, Z), V3(b + PR, hangY + 7.5, Z)]), 20, 0.07, 5, false));
    const pan = lab.items.wts.app.pan;
    if (pan.parent !== lab.scene) lab.scene.attach(pan);
    pan.position.set(b + PR, hangY, Z); pan.rotation.set(0, 0, 0);
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const T = tension(lab), r = response(lab);
    $('mL').textContent = `L = ${x.L.toFixed(1)} cm`;
    $('mT').textContent = `T = ${T.toFixed(3)} N (pan + ${x.added} g)`;
    $('mP').textContent = !x.on ? 'Fork off' : r.sharp ? `${r.p} sharp loops` : r.A > 0.25 ? `${r.p} loops, not steady` : 'Thread barely vibrates';
    $('mLv').textContent = `${x.L.toFixed(1)} cm`; $('mSlide').value = x.L;
    $('mTv').textContent = `${T.toFixed(3)} N`; $('mPv').textContent = x.on ? String(r.p) : '—';
    $('mMu').textContent = `${(x.mu * 1e4).toFixed(2)}×10⁻⁴ kg/m`;
    $('mRes').textContent = r.sharp ? 'sharp' : 'no'; $('mRes').className = r.sharp ? 'ok' : '';
    $('mOn').textContent = x.on ? 'Switch off fork' : 'Switch on fork';
  },
  chips: (lab) => { const r = response(lab); return [[`Fork: ${lab.x.on ? 'on' : 'off'}`, lab.x.on ? 'ok' : ''], [r.sharp ? `${r.p} sharp loops` : 'Not at resonance', r.sharp ? 'ok' : '']]; },
  result: (lab) => {
    const r = lab.rows;
    if (!r.length) return { items: [['Mean f', '—'], ['Actual f', 'hidden']], note: 'Record four sets of T, L and p.' };
    const f = r.reduce((s, q) => s + q.f, 0) / r.length;
    const reveal = r.length >= 4;
    return { items: [['Mean f', `${f.toFixed(1)} Hz`], ['Actual f (after 4)', reveal ? `${lab.x.f0.toFixed(1)} Hz` : 'hidden'], ['Error', reveal ? `${(((f - lab.x.f0) / lab.x.f0) * 100).toFixed(2)} %` : '—'], ['p²T (should be constant for fixed L)', r.length ? (r[0].p ** 2 * r[0].T).toFixed(3) : '—']], note: 'In the transverse arrangement the thread vibrates at the fork’s own frequency.' };
  },
  obsRows: 4,
  obsKeys: ['T', 'L', 'p', 'f'],
  observation: (lab) => ({ rows: lab.rows.map((q) => ({ T: q.T.toFixed(3), L: q.L.toFixed(3), p: String(q.p), f: q.f.toFixed(1) })), metricInputs: { mu: lab.x.mu.toExponential(2) } }),
};

// ---------------------------------------------------------------------------

const tension = (lab) => (PAN + lab.x.added / 1000) * G;
const tipX = (lab) => PULLEY_X - lab.x.L;
function response(lab) {
  const x = lab.x;
  const v = Math.sqrt(tension(lab) / x.mu); // m/s
  const L = x.L / 100;
  const pr = (2 * L * x.f0) / v; // loops that would fit exactly
  const p = Math.max(1, Math.round(pr));
  const fp = (p * v) / (2 * L);
  const r = x.f0 / fp, z = 0.012;
  const amp = x.on ? Math.min(2.4, 0.075 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2)) : 0;
  return { A: amp, p, sharp: amp > 1.8 };
}
function setL(lab, L) { lab.x.L = THREE.MathUtils.clamp(L, 40, 150); }
async function tie(lab) {
  const v = lab.items.vib;
  if (!v.placed || !lab.items.pulley.placed) { lab.toast('Place the vibrator and the pulley first.', 'err'); return; }
  lab.x.L = THREE.MathUtils.clamp(PULLEY_X - (v.group.position.x + v.app.tipLocal.x), 40, 150);
  await lab.touch(v.group.localToWorld(v.app.tipLocal.clone()), null, { pose: 'pinch' });
  await lab.touch(V3(PULLEY_X, -3 + AXIS_Y + 1, Z), null, { pose: 'pinch' });
  lab.x.tied = true;
  lab.sfx('tick');
}
async function toggle(lab) {
  await lab.touch(lab.items.vib.app.sw, () => { lab.x.on = !lab.x.on; lab.sfx('click'); });
}
async function addMass(lab, m) {
  const x = lab.x, W = lab.items.wts.app;
  const w = W.weights.find((q) => q.userData.m === m && !x.onPan.includes(q));
  if (!w) { lab.toast(`No more ${m} g weights.`, 'warn'); return; }
  await lab.touch(w, null, { pose: 'pinch', lift: 0.5 });
  const pan = W.pan;
  lab.scene.attach(w);
  const s0 = w.position.clone(), R = lab.handR();
  const dest = () => pan.localToWorld(V3(0, 0.5 + x.onPan.length * 0.45, 0));
  await lab.tween(1.0, (e) => { w.position.lerpVectors(s0, dest(), e); w.position.y += Math.sin(Math.PI * e) * 6; R.goal.copy(w.position).add(V3(0, 0.8, 0)); });
  pan.attach(w); w.position.set(0, 0.5 + x.onPan.length * 0.45, 0); w.rotation.set(0, x.onPan.length, 0);
  x.onPan.push(w); x.added += m;
  lab.sfx('tick');
}
async function emptyPan(lab) {
  const x = lab.x, W = lab.items.wts;
  for (const w of x.onPan) { W.group.attach(w); w.position.copy(w.userData.home); w.rotation.set(0, 0, 0); }
  x.onPan = []; x.added = 0;
}
async function setPan(lab, grams) {
  const x = lab.x;
  if (!x.tied) await tie(lab);
  if (!x.on) await toggle(lab);
  if (x.added === grams) return;
  await emptyPan(lab); // make the new load up from the full set of weights
  const avail = [50, 20, 10];
  let need = grams - x.added;
  for (const m of avail) while (need >= m && lab.items.wts.app.weights.some((q) => q.userData.m === m && !x.onPan.includes(q))) { await addMass(lab, m); need -= m; }
}
async function tune(lab, pTarget) {
  const x = lab.x;
  const v = Math.sqrt(tension(lab) / x.mu);
  let p = pTarget;
  let Lres = ((p * v) / (2 * x.f0)) * 100;
  while (Lres > 148 && p > 1) { p--; Lres = ((p * v) / (2 * x.f0)) * 100; }
  while (Lres < 42) { p++; Lres = ((p * v) / (2 * x.f0)) * 100; }
  const vib = lab.items.vib, R = lab.handR();
  const grip = () => vib.group.localToWorld(V3(-4, 3, 5));
  await lab.touch(grip(), null, { pose: 'grab', lift: 0 });
  const go = async (L, dur) => { const L0 = x.L; await lab.tween(dur, (e) => { setL(lab, L0 + (L - L0) * e); R.goal.copy(grip()); }); };
  await go(Lres + 7, 0.8);
  await go(Lres - 4, 1.2);
  await go(Lres + 0.8, 0.7);
  await go(Lres + (Math.random() - 0.5) * 0.3, 0.5);
  await lab.wait(0.6);
}
async function record(lab) {
  const x = lab.x;
  const r = response(lab);
  if (!x.on) { lab.toast('Switch on the tuning fork first.', 'err'); return; }
  if (!r.sharp) { lab.toast('The loops are not sharp — slide the fork to reach resonance first.', 'err'); return; }
  const T = tension(lab), L = Math.round(x.L * 10) / 1000;
  if (lab.rows.some((q) => Math.abs(q.T - T) < 1e-6)) { lab.toast('This tension is already recorded — change the load.', 'warn'); return; }
  const f = (r.p / (2 * L)) * Math.sqrt(T / x.mu);
  lab.addRow({ T, L, p: r.p, f });
  lab.toast(`T = ${T.toFixed(3)} N, L = ${L.toFixed(3)} m, p = ${r.p} → f = ${f.toFixed(1)} Hz`, 'ok', 5000);
}
