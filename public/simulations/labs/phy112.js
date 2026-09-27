// Young's modulus of a steel wire by Searle's method. Reference and
// experimental wires hang from a rigid frame; a spirit level joins their
// lower frames and rests on a micrometer screw (pitch 0.5 mm, 100 divisions,
// least count 0.005 mm). Each load stretches the experimental wire; the
// micrometer is turned to re-level the bubble, and the change in reading is
// the extension.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const FX = -30, FZ = -22, TOP = 150, L_WIRE = 120; // cm (relative to the bench top)
const XR = FX - 5, XE = FX + 5, FRAME_Y = TOP - L_WIRE - 2; // frame tops
const G = 9.8, SLOT = 0.5; // kg per slotted weight

function buildFrame() {
  const g = new THREE.Group();
  const iron = PH.PM.castIron;
  const base = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 24), iron); base.position.set(FX, 1, FZ - 2); base.castShadow = true;
  [-17, 17].forEach((dx) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, TOP + 4, 14), PH.PM.darkSteel); p.position.set(FX + dx, (TOP + 4) / 2, FZ - 10); p.castShadow = true; g.add(p); });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(38, 3, 4), iron); bar.position.set(FX, TOP + 2, FZ - 10);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(18, 2.4, 12), iron); arm.position.set(FX, TOP + 1, FZ - 4);
  g.add(base, bar, arm);
  const wireMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 1, roughness: 0.25 });
  const wires = [XR, XE].map((x) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, L_WIRE, 6), wireMat); w.position.set(x, TOP - L_WIRE / 2, FZ); g.add(w); const chuck = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 10), PH.PM.brass); chuck.position.set(x, TOP - 0.8, FZ); g.add(chuck); return w; });
  // lower frames (move with the wire ends)
  const mkFrame = (x) => {
    const f = new THREE.Group();
    const brass = PH.PM.brass;
    [-2, 2].forEach((dx) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 0.5), brass); s.position.set(dx, -6, 0); f.add(s); });
    const t = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 1), brass); t.position.y = 0; const b = t.clone(); b.position.y = -12;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 6, 12), PH.PM.steel); hook.position.y = -13;
    f.add(t, b, hook);
    f.position.set(x, FRAME_Y, FZ);
    g.add(f);
    return f;
  };
  const fR = mkFrame(XR), fE = mkFrame(XE);
  // micrometer on the experimental frame: pitch scale + disc; the level rests on its tip
  const micro = new THREE.Group();
  const scale = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 0.8), new THREE.MeshStandardMaterial({ map: PH.tex(64, 512, (c, w, h) => { c.fillStyle = '#e5e8eb'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; for (let i = 0; i <= 10; i++) { const y = h - 20 - i * ((h - 40) / 10); c.fillRect(0, y - 1.5, i % 2 === 0 ? 40 : 26, 3); if (i % 2 === 0) { c.font = 'bold 22px Arial'; c.fillText(String(i / 2 * 1), 42, y + 7); } } }), metalness: 0.3, roughness: 0.4 }));
  scale.position.set(1.6, -4.2, 0.9);
  const screw = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5, 10), PH.PM.steel); shaft.position.y = -2.5;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 48), [new THREE.MeshStandardMaterial({ map: PH.tex(2048, 64, (c, w, h) => { c.fillStyle = '#d9dde2'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; for (let i = 0; i < 100; i++) { const x = (i / 100) * w; c.fillRect(x - 1.5, 0, 3, i % 10 === 0 ? 40 : i % 5 === 0 ? 30 : 20); if (i % 10 === 0) { c.font = 'bold 18px Arial'; c.fillText(String(i), x + 3, 60); } } }), metalness: 0.4, roughness: 0.35 }), PH.PM.steel, PH.PM.steel]);
  disc.position.y = -5.4;
  screw.add(shaft, disc);
  screw.position.set(0, 0, 0);
  micro.add(scale, screw);
  micro.position.set(0, -1, 0);
  fE.add(micro);
  // spirit level: hinged on the reference frame, resting on the micrometer tip
  const level = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 8, 16), new THREE.MeshPhysicalMaterial({ color: 0xd9f99d, transparent: true, opacity: 0.6, roughness: 0.1 })); tube.rotation.z = Math.PI / 2; tube.position.set(4, 0.8, 0.9);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })); bubble.scale.x = 2.2; bubble.position.set(4, 0.8, 0.9);
  const marks = [-0.9, 0.9].map((d) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.04, 4, 16), new THREE.MeshBasicMaterial({ color: 0x111111 })); m.rotation.y = Math.PI / 2; m.position.set(4 + d, 0.8, 0.9); return m; });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 1.4), PH.PM.brass); plate.position.set(4.6, 0.2, 0.6);
  level.add(tube, bubble, ...marks, plate);
  level.position.set(XR - FX + 0.5, FRAME_Y - 6, FZ);
  level.position.set(XR + 0.5, FRAME_Y - 6, FZ);
  g.add(level);
  // hangers under the frames: the experimental one takes slotted weights
  const mkHanger = (f) => { const h = PH.hanger(1000); h.scale.set(1.4, 1.4, 1.4); h.position.set(0, -13.4 - 9.6 * 1.4 - 0.6, 0); f.add(h); return h; };
  const hR = mkHanger(fR), hE = mkHanger(fE);
  const dead = PH.slottedWeight(500); dead.scale.setScalar(1.8); dead.position.set(0, 0.6, 0); hR.add(dead);
  const dead2 = PH.slottedWeight(500); dead2.scale.setScalar(1.8); dead2.position.set(0, 0.6, 0); hE.add(dead2);
  return { group: g, fR, fE, screw, disc, level, bubble, hE, wires, size: [40, TOP, 24], grip: V3(FX, 20, FZ + 8) };
}
function buildWeights() {
  const g = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(30, 1.6, 10), PH.PM.darkWood); tray.position.y = 0.8; g.add(tray);
  const weights = [];
  for (let i = 0; i < 5; i++) { const w = PH.slottedWeight(500); w.scale.setScalar(1.8); w.position.set(-11 + i * 5.5, 1.6, 0); w.userData.home = w.position.clone(); g.add(w); weights.push(w); }
  return { group: g, weights, size: [30, 4, 10], grip: V3(14, 1.6, 0) };
}
function buildRule() {
  const g = new THREE.Group();
  const r = new THREE.Mesh(new THREE.BoxGeometry(100, 0.4, 3), [PH.PM.wood, PH.PM.wood, new THREE.MeshStandardMaterial({ map: PH.scaleTexture(100, { vertical: false }), roughness: 0.6 }), PH.PM.wood, PH.PM.wood, PH.PM.wood]);
  r.position.y = 0.2; g.add(r);
  return { group: g, size: [100, 0.4, 3], grip: V3(20, 0.4, 0), pose: 'grab' };
}

export default {
  id: 'phy112',
  lab: 'Physics Lab',
  title: 'Young’s modulus of a wire (Searle’s method)',
  intro: 'Determine the Young’s modulus of the material of a steel wire with Searle’s apparatus.',
  board: {
    title: 'Young’s modulus — Searle’s apparatus',
    formulas: ['Y = stress / strain = (M g / π r²) / (ΔL / L)', 'Y = g L (M/ΔL) / (π r²)', 'L.C. of micrometer = 0.5 mm / 100 = 0.005 mm'],
    steps: ['Measure L with a metre scale, r with a screw gauge', 'Dead load on both wires keeps them straight', 'Level the bubble with the micrometer: reading r₀', 'Add 0.5 kg, wait, re-level, read', 'ΔL = reading − r₀; plot M against ΔL'],
    note: 'Load and unload gently — stay within the elastic limit',
  },
  items: {
    frame: { name: 'Searle’s apparatus', label: 'Searle’s apparatus', build: () => buildFrame(), slot: [0, 0, 0], fixed: true, labelY: TOP + 6 },
    weights: { name: 'Slotted weights (0.5 kg)', label: '0.5 kg weights', build: () => buildWeights(), slot: [30, 14, 0] },
    gauge: { name: 'Screw gauge', label: 'Screw gauge', build: (lab) => lab.S.buildScrewGauge(lab.M), slot: [66, 18, 0], why: 'The wire’s radius enters as r²: measure it carefully.' },
    rule: { name: 'Metre scale', label: 'Metre scale', build: () => buildRule(), slot: [10, 32, 0], home: [186, 28, 0] },
  },
  setupOrder: ['weights', 'gauge', 'rule'],
  views: { searle: { label: 'Micrometer & level', pos: [XE + 14, FRAME_Y + 4, FZ + 26], target: [XE - 2, FRAME_Y - 6, FZ] }, frame: { label: 'Apparatus', pos: [FX + 60, 90, 130], target: [FX, 60, FZ] } },
  classicView: 'searle',
  pips: [
    { id: 'micro', title: 'Micrometer disc and scale', fov: 26, update: (cam, lab) => { const f = lab.items.frame.app; f.group.updateMatrixWorld(true); const p = f.disc.getWorldPosition(V3()); cam.position.set(p.x + 1.4, p.y + 1.6, p.z + 6); cam.lookAt(p.x + 0.8, p.y + 0.6, p.z); } },
    { id: 'level', title: 'Spirit level', fov: 24, update: (cam, lab) => { const f = lab.items.frame.app; const p = f.level.localToWorld(V3(4, 0.8, 0.9)); cam.position.set(p.x, p.y + 3, p.z + 6); cam.lookAt(p); } },
  ],
  overlay: '<b>Searle’s apparatus</b><span class="big" id="yR">—</span><div id="yB"></div><div id="yM"></div>',
  hintExtra: 'drag the <b>micrometer disc</b> to re-level the bubble',
  panel: [{
    title: 'Measurements',
    html: `
      <div class="row"><button class="btn ghost act" id="yL">Measure L</button><button class="btn ghost act" id="yD">Measure diameter</button></div>
      <div class="row"><button class="btn ghost act" id="yLevel">Level the bubble</button><button class="btn act" id="yAdd">Add 0.5 kg</button><button class="btn ghost act" id="yRem">Remove 0.5 kg</button></div>
      <div class="meters"><div class="m"><i>L</i><b id="yLv">—</b></div><div class="m"><i>r</i><b id="yRv">—</b></div><div class="m"><i>Load added</i><b id="yMv">0 kg</b></div><div class="m"><i>Bubble</i><b id="yBv">—</b></div></div>`,
    bind: (lab, root) => {
      root.querySelector('#yL').onclick = () => lab.act(() => measureL(lab));
      root.querySelector('#yD').onclick = () => lab.act(() => measureD(lab));
      root.querySelector('#yLevel').onclick = () => lab.act(() => relevel(lab));
      root.querySelector('#yAdd').onclick = () => lab.act(() => addWeight(lab));
      root.querySelector('#yRem').onclick = () => lab.act(() => removeWeight(lab));
    },
  }],
  table: { columns: [{ key: 'M', label: 'Load M (kg)', fmt: (v) => v.toFixed(1) }, { key: 'r', label: 'Micrometer (mm)', fmt: (v) => v.toFixed(3) }, { key: 'dL', label: 'ΔL (mm)', fmt: (v) => v.toFixed(3) }, { key: 'ratio', label: 'M/ΔL (kg/mm)', fmt: (v) => v.toFixed(2) }], recordLabel: 'Record micrometer reading', note: 'The first row is the zero-load reading r₀.' },
  record: (lab) => lab.act(() => record(lab)),
  steps: (lab) => [
    { phase: 'Wire dimensions', text: 'Measure the length L of the experimental wire, from the chuck to the frame, with the metre scale.', check: () => lab.x.L != null, demo: () => measureL(lab) },
    { phase: 'Wire dimensions', text: 'Measure the wire’s diameter with the screw gauge at a few places; r = d/2.', check: () => lab.x.r != null, demo: () => measureD(lab) },
    { phase: 'Zero reading', text: 'Turn the micrometer until the bubble is exactly in the centre of the level. Record the reading r₀.', why: 'Both wires carry a dead load; temperature changes stretch them equally, so the level cancels them.', check: () => lab.x.r0 != null, demo: async () => { await relevel(lab); await record(lab); } },
    ...[1, 2, 3, 4, 5].map((n) => ({ phase: 'Loading', text: `Add a 0.5 kg slotted weight (total ${(n * 0.5).toFixed(1)} kg). The bubble moves; re-level it with the micrometer and record the reading.`, why: n === 1 ? 'Wait a little after each load so the wire settles before re-levelling.' : '', check: () => lab.rows.filter((q) => q.M > 0).length >= n, demo: async () => { while (lab.x.n < n) await addWeight(lab); await relevel(lab); await record(lab); } })),
  ],
  state: () => ({ Y: 1.9e11 + Math.random() * 0.2e11, rTrue: 0.24 + Math.random() * 0.04, n: 0, micro: 3.2 + Math.random() * 0.3, set0: null, L: null, r: null, r0: null }),
  init: (lab) => {
    const f = lab.items.frame.app;
    let m0 = 0;
    lab.actionable(f.disc, { tip: () => `Micrometer — drag sideways to turn (${lab.x.micro.toFixed(3)} mm)`, drag: { start: () => { m0 = lab.x.micro; }, move: (p, s) => { lab.x.micro = THREE.MathUtils.clamp(m0 + (p.x - s.x) * 0.02, 0, 5); }, hand: () => f.disc.getWorldPosition(V3()) } });
    lab.x.set0 = lab.x.micro + (Math.random() - 0.5) * 0.2; // micrometer reading that levels the bubble with no added load
  },
  reset: (lab) => { lab.x.set0 = lab.x.micro + (Math.random() - 0.5) * 0.2; const w = lab.items.weights.app; w.weights.forEach((q) => { lab.items.weights.group.add(q); q.position.copy(q.userData.home); q.rotation.set(0, 0, 0); }); },
  update: (lab) => {
    const x = lab.x, f = lab.items.frame.app;
    if (x.n == null || x.set0 == null) return;
    const dL = ext(lab); // mm
    // exaggerate the frame drop ×10 so it is visible
    f.fE.position.y = FRAME_Y - dL * 0.1 * 10 * 0.1;
    f.wires[1].scale.y = 1 + (dL / 10) / L_WIRE;
    f.screw.position.y = -(x.micro - 3) * 0.1 * 2;
    f.screw.rotation.y = -((x.micro / 0.5) % 1) * Math.PI * 2;
    const off = levelOff(lab); // mm; + means the micrometer end is high
    f.level.rotation.z = THREE.MathUtils.clamp(off * 0.02, -0.05, 0.05);
    f.bubble.position.x = 4 + THREE.MathUtils.clamp(off * 12, -3.2, 3.2);
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const r = x.micro, main = Math.floor(r / 0.5 + 1e-9) * 0.5, div = Math.round((r - main) / 0.005);
    $('yR').textContent = `${r.toFixed(3)} mm`;
    $('yB').textContent = `scale ${main.toFixed(1)} mm + ${div} × 0.005 mm`;
    const off = levelOff(lab);
    $('yM').textContent = `Bubble: ${Math.abs(off) < 0.004 ? 'centred' : off > 0 ? 'off to the right' : 'off to the left'}`;
    $('yLv').textContent = x.L ? `${x.L.toFixed(3)} m` : '—';
    $('yRv').textContent = x.r ? `${x.r.toFixed(3)} mm` : '—';
    $('yMv').textContent = `${(x.n * SLOT).toFixed(1)} kg`;
    $('yBv').textContent = Math.abs(off) < 0.004 ? 'centred' : 'not level';
    $('yBv').className = Math.abs(off) < 0.004 ? 'ok' : 'warn';
  },
  chips: (lab) => [[`Load: ${(lab.x.n * SLOT).toFixed(1)} kg`, ''], [Math.abs(levelOff(lab)) < 0.004 ? 'Bubble centred' : 'Bubble not level', Math.abs(levelOff(lab)) < 0.004 ? 'ok' : 'hot']],
  result: (lab) => {
    const x = lab.x, r = lab.rows.filter((q) => q.M > 0);
    if (!r.length || !x.L || !x.r) return { items: [['Mean M/ΔL', r.length ? `${(r.reduce((s, q) => s + q.ratio, 0) / r.length).toFixed(2)} kg/mm` : '—'], ['Y', '—']], note: 'Measure L and r, then record the loaded readings.' };
    const k = r.reduce((s, q) => s + q.M * q.dL, 0) / r.reduce((s, q) => s + q.dL * q.dL, 0); // kg/mm, slope through origin
    const Y = (G * x.L * (k * 1000)) / (Math.PI * (x.r / 1000) ** 2);
    const reveal = r.length >= 5;
    return { items: [['Slope M/ΔL', `${k.toFixed(2)} kg/mm`], ['Young’s modulus Y', `${Y.toExponential(3)} N/m²`], ['Actual Y (after 5)', reveal ? `${x.Y.toExponential(3)} N/m²` : 'hidden'], ['Error', reveal ? `${(((Y - x.Y) / x.Y) * 100).toFixed(1)} %` : '—']], note: 'Equal loads give equal extensions within the elastic limit (Hooke’s law).' };
  },
  obsRows: 5,
  obsKeys: ['M', 'dL', 'ratio'],
  observation: (lab) => ({ rows: lab.rows.filter((q) => q.M > 0).map((q) => ({ M: q.M.toFixed(1), dL: q.dL.toFixed(3), ratio: q.ratio.toFixed(2) })), metricInputs: { L: lab.x.L ? lab.x.L.toFixed(3) : '', r: lab.x.r ? lab.x.r.toFixed(3) : '' } }),
};

// extension of the experimental wire (mm) from the added load
function ext(lab) { const x = lab.x; return ((x.n * SLOT * G * (L_WIRE / 100)) / (Math.PI * (x.rTrue / 1000) ** 2 * x.Y)) * 1000; }
// how far the micrometer end of the level is from level (mm)
function levelOff(lab) { const x = lab.x; return (x.micro - x.set0) - ext(lab); }
async function turnTo(lab, target, dur = 1.2) {
  const f = lab.items.frame.app, R = lab.handR();
  await lab.touch(f.disc.getWorldPosition(V3()).add(V3(1.4, 0.3, 0.6)), null, { pose: 'pinch', lift: 0 });
  const m0 = lab.x.micro;
  await lab.tween(dur, (e) => { lab.x.micro = m0 + (target - m0) * e; R.goal.copy(f.disc.getWorldPosition(V3())).add(V3(1.4, 0.3, 0.6)); R.pitchGoal = -0.2 + Math.sin(e * 18) * 0.1; });
  lab.x.micro = target;
}
async function relevel(lab) {
  const x = lab.x;
  const target = x.set0 + ext(lab) + (Math.random() - 0.5) * 0.004;
  await turnTo(lab, target + (Math.random() < 0.5 ? 0.03 : -0.03), 0.9);
  await turnTo(lab, target, 1.0);
}
async function record(lab) {
  const x = lab.x;
  if (Math.abs(levelOff(lab)) > 0.006) { lab.toast('The bubble is not centred — re-level it with the micrometer first.', 'err'); return; }
  const f = lab.items.frame.app;
  await lab.touch(f.disc.getWorldPosition(V3()).add(V3(0, 1.2, 1.6)), null, { pose: 'point' });
  const r = Math.round(x.micro / 0.005) * 0.005;
  if (x.n === 0) { x.r0 = r; lab.addRow({ M: 0, r, dL: 0, ratio: 0 }); lab.toast(`Zero reading r₀ = ${r.toFixed(3)} mm`, 'ok'); return; }
  if (x.r0 == null) { lab.toast('Take the zero reading with no added load first.', 'err'); return; }
  const M = x.n * SLOT;
  if (lab.rows.some((q) => Math.abs(q.M - M) < 1e-6)) { lab.toast('This load is already recorded.', 'warn'); return; }
  const dL = r - x.r0;
  lab.addRow({ M, r, dL, ratio: M / dL });
  lab.toast(`M = ${M.toFixed(1)} kg: reading ${r.toFixed(3)} mm → ΔL = ${dL.toFixed(3)} mm`, 'ok', 5000);
}
async function addWeight(lab) {
  const x = lab.x, W = lab.items.weights.app, f = lab.items.frame.app;
  if (x.n >= W.weights.length) { lab.toast('All the weights are on.', 'warn'); return; }
  const w = W.weights[x.n];
  await lab.touch(w, null, { pose: 'pinch', lift: 1 });
  lab.scene.attach(w);
  const s0 = w.position.clone(), R = lab.handR();
  const dest = () => f.hE.localToWorld(V3(0, 0.6 + (x.n + 1) * 0.55, 0));
  await lab.tween(1.3, (e) => { w.position.lerpVectors(s0, dest(), e); w.position.y += Math.sin(Math.PI * e) * 10; R.goal.copy(w.position).add(V3(0, 1.2, 0)); });
  f.hE.attach(w); w.position.set(0, 0.6 + (x.n + 1) * 0.55 / 1.4, 0); w.rotation.set(0, x.n * 0.9, 0); w.scale.setScalar(1.8 / 1.4);
  x.n++;
  lab.sfx('tick');
  await lab.wait(0.6);
}
async function removeWeight(lab) {
  const x = lab.x, W = lab.items.weights;
  if (x.n <= 0) return;
  const w = W.app.weights[x.n - 1];
  await lab.touch(w, null, { pose: 'pinch', lift: 1 });
  W.group.attach(w); w.position.copy(w.userData.home); w.rotation.set(0, 0, 0); w.scale.setScalar(1.8);
  x.n--;
}
async function measureL(lab) {
  const rule = lab.items.rule;
  await lab.pickUp('rule');
  await lab.holdAt('rule', V3(XE + 3, -3 + TOP - L_WIRE / 2, FZ + 3), new THREE.Euler(0, 0, Math.PI / 2), { dur: 1.2 });
  await lab.wait(0.8);
  lab.x.L = Math.round((L_WIRE / 100 + (Math.random() - 0.5) * 0.002) * 1000) / 1000;
  lab.toast(`Length of the wire L = ${lab.x.L.toFixed(3)} m`, 'ok', 4000);
  await lab.putDown('rule', V3(rule.slot[0], -3, rule.slot[1]), { rot: 0, slot: true });
}
async function measureD(lab) {
  const g = lab.items.gauge.app;
  await lab.touch(lab.items.gauge.group.localToWorld(V3(g.zeroX + 10, g.axisY + 1.2, 0.8)), null, { pose: 'pinch' });
  const ds = [0, 1, 2].map(() => Math.round((2 * lab.x.rTrue + (Math.random() - 0.5) * 0.01) / 0.01) * 0.01);
  for (const d of ds) { g.setReading(d, d); lab.sfx('tick'); await lab.wait(0.5); }
  const dm = ds.reduce((s, v) => s + v, 0) / ds.length;
  lab.x.r = dm / 2;
  lab.toast(`Diameters ${ds.map((v) => v.toFixed(2)).join(', ')} mm → r = ${(dm / 2).toFixed(3)} mm`, 'ok', 5000);
  g.setReading(2);
}
