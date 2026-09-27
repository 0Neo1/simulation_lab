// Average speed of a marble rolling down an inclined plane, timed with a
// stopwatch over different distances. The marble rolls without slipping:
// a = (5/7) g sin θ, less a little rolling resistance; human reaction time
// adds a small random error to every timing.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const LEN = 120, TOP_X = -64, Z = -4, RISE = 11; // plank length, top end x, lane z, height of the raised end (cm)
const TH = Math.asin(RISE / LEN), R_BALL = 0.8, G = 9.8;
const DISTANCES = [0.5, 0.75, 1.0];
// A point on the groove, s cm from the top end, lifted by y
const along = (s, y = 0) => V3(TOP_X + s * Math.cos(TH), -3 + RISE - s * Math.sin(TH) + 2.2 + y, Z);

function buildRamp() {
  const g = new THREE.Group();
  const plankMat = new THREE.MeshStandardMaterial({ map: PH.PM.wood.map, roughness: 0.55 });
  const plank = new THREE.Mesh(new THREE.BoxGeometry(LEN, 2, 10), plankMat);
  plank.position.set(TOP_X + (LEN / 2) * Math.cos(TH), -3 + RISE - (LEN / 2) * Math.sin(TH) + 1, Z);
  plank.rotation.z = -TH; plank.castShadow = true; plank.receiveShadow = true;
  const rails = [-1.6, 1.6].map((dz) => { const r = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.9, 0.5), PH.PM.darkWood); r.position.copy(plank.position).add(V3(0, 1.3 * Math.cos(TH), dz)); r.rotation.z = -TH; return r; });
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(LEN - 4, 2.4), new THREE.MeshStandardMaterial({ map: PH.scaleTexture(LEN - 4, { vertical: false }), roughness: 0.6 }));
  scale.position.copy(plank.position).add(V3(0, 1.02 * Math.cos(TH), 3.6)); scale.rotation.set(-Math.PI / 2, 0, 0); scale.rotateOnWorldAxis(V3(0, 0, 1), -TH);
  const stack = new THREE.Group();
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(8, RISE / 3 - 0.05, 12), PH.PM.darkWood); b.position.set(TOP_X + 4, -3 + (RISE / 3) * (i + 0.5), Z); b.castShadow = true; stack.add(b); }
  g.add(plank, ...rails, scale, stack);
  // start line
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 3.2), new THREE.MeshBasicMaterial({ color: 0xdc2626 })); line.position.copy(along(4, -R_BALL + 0.05)); line.rotation.z = -TH;
  g.add(line);
  return { group: g, size: [LEN, RISE + 3, 12], grip: V3(0, RISE, 6) };
}
function buildBarrier() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 4.6), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 })); b.position.y = 1.5; b.castShadow = true;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 3.2), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 })); pad.position.set(-0.75, 1.6, 0);
  g.add(b, pad);
  return { group: g, size: [1.2, 3, 4.6], grip: V3(0, 3, 0), pose: 'pinch' };
}
function buildMarble() {
  const g = new THREE.Group();
  const tex = PH.tex(256, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#1d4ed8'); gr.addColorStop(0.5, '#e0f2fe'); gr.addColorStop(1, '#1d4ed8'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#f97316'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse((i / 6) * w, h / 2, 12, 50, 0.4, 0, 7); c.fill(); } });
  const m = new THREE.Mesh(new THREE.SphereGeometry(R_BALL, 24, 16), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.05, clearcoat: 1, transmission: 0, transparent: true, opacity: 0.95 }));
  m.position.y = R_BALL; m.castShadow = true;
  g.add(m);
  return { group: g, ball: m, size: [1.6, 1.6, 1.6], grip: V3(0, R_BALL * 2, 0), pose: 'pinch' };
}

export default {
  id: 'phy104',
  lab: 'Physics Lab',
  title: 'Average speed of a marble on an inclined plane',
  intro: 'Time a marble rolling down an inclined plane over different distances and find its average speed v = d/t.',
  board: {
    title: 'Motion on an inclined plane',
    formulas: ['v(average) = d / t', 'a = (5/7) g sin θ  (rolling ball)', 'd = ½ a t²'],
    steps: ['Raise one end of the plank on blocks', 'Put the stopper at the distance d', 'Release the marble from rest at the start line', 'Start the stopwatch at release, stop at the click', 'Repeat for different d'],
    note: 'Release — do not push!',
  },
  items: {
    ramp: { name: 'Inclined plane (grooved plank on blocks)', label: 'Inclined plane', build: () => buildRamp(), slot: [0, 0, 0], fixed: true, labelY: RISE + 4 },
    barrier: { name: 'Stopper block', label: 'Stopper', build: () => buildBarrier(), slot: [30, 22, 0] },
    marble: { name: 'Glass marble', label: 'Marble', build: () => buildMarble(), slot: [-40, 22, 0] },
    watch: { name: 'Stopwatch', label: 'Stopwatch', build: () => { const s = C.stopwatch(); return Object.assign(s.app, { sw: s }); }, slot: [-20, 26, 0] },
  },
  setupOrder: ['marble', 'barrier', 'watch'],
  views: { ramp: { label: 'Inclined plane', fit: [-70, 64, [0, 2, Z]] } },
  classicView: 'ramp',
  pips: [{ id: 'watch', title: 'Stopwatch', fov: 24, update: (cam, lab) => { const p = lab.items.watch.group.position; cam.position.set(p.x, p.y + 9, p.z + 7); cam.lookAt(p.x, p.y + 2, p.z); }, show: (lab) => lab.items.watch.placed }],
  overlay: '<b>Inclined plane</b><span class="big" id="iT">0.00 s</span><div id="iD"></div><div id="iS"></div>',
  hintExtra: 'drag the <b>stopper</b> along the plank · click the <b>marble</b> to release it',
  panel: [{
    title: 'Timing',
    html: `
      <div class="row small">Stopper at: ${DISTANCES.map((d) => `<button class="mini act" data-d="${d}">${d * 100} cm</button>`).join('')}</div>
      <div class="row"><button class="btn act" id="iGo">Release marble + start watch</button><button class="btn ghost act" id="iBack">Marble back to start</button></div>
      <div class="meters"><div class="m"><i>Incline angle</i><b>${((TH * 180) / Math.PI).toFixed(1)}°</b></div><div class="m"><i>Stopper distance</i><b id="iDist">—</b></div><div class="m"><i>Marble speed</i><b id="iV">0.00 m/s</b></div><div class="m"><i>Stopwatch</i><b id="iW">0.0 s</b></div></div>`,
    bind: (lab, root) => {
      root.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => lab.act(() => moveStopper(lab, +b.dataset.d)); });
      root.querySelector('#iGo').onclick = () => lab.act(() => run(lab));
      root.querySelector('#iBack').onclick = () => lab.act(() => resetMarble(lab));
    },
  }],
  table: { columns: [{ key: 'd', label: 'd (m)', fmt: (v) => v.toFixed(2) }, { key: 't', label: 't (s)', fmt: (v) => v.toFixed(2) }, { key: 'v', label: 'v = d/t (m/s)', fmt: (v) => v.toFixed(3) }], note: 'Average speed rises with distance: the marble accelerates down the slope.' },
  steps: (lab) => DISTANCES.flatMap((d, i) => [
    { phase: `Distance ${d * 100} cm`, text: `Set the stopper ${d * 100} cm down the plank from the start line.`, why: i === 0 ? 'Measure along the plank, from where the marble is released to the stopper face.' : '', check: () => lab.rows.length > i || Math.abs(lab.x.d - d) < 0.005, demo: () => moveStopper(lab, d) },
    { phase: `Distance ${d * 100} cm`, text: 'Hold the marble at the start line, release it and start the stopwatch together; stop the watch when it hits the stopper. Record t.', why: i === 0 ? 'Your reaction time adds a small error to each timing — repeat and average in a real lab.' : '', check: () => lab.rows.length > i, demo: () => run(lab) },
  ]),
  state: () => ({ d: 0.3, s: 4, v: 0, rolling: false, t: 0, timing: false, watch: 0, react: 0, hitAt: null, onRamp: false, onStart: false, marbleOn: false }),
  init: (lab) => {
    const b = lab.items.barrier;
    lab.actionable(b.group, { tip: () => `Stopper at ${(lab.x.d * 100).toFixed(0)} cm — drag along the plank`, enabled: () => lab.x.onRamp, drag: { move: (p) => { lab.x.d = THREE.MathUtils.clamp(Math.round(((p.x - TOP_X) / Math.cos(TH) - 4)) / 100, 0.2, 1.05); placeBarrier(lab); }, hand: () => b.group.localToWorld(V3(0, 3, 0)) } });
    lab.actionable(lab.items.marble.group, { tip: 'Marble — click to release it and start the stopwatch', enabled: () => lab.x.onStart, run: () => run(lab) });
  },
  reset: (lab) => { lab.x.onRamp = false; lab.x.onStart = false; lab.x.marbleOn = false; lab.items.watch.app.sw.show(0); },
  quickSetup: (lab) => { lab.x.onRamp = true; placeBarrier(lab); lab.x.onStart = true; lab.x.marbleOn = true; placeMarble(lab); },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.d == null) return;
    if (x.rolling) {
      const a = (5 / 7) * G * Math.sin(TH) - 0.04; // m/s², minus rolling resistance
      x.v += a * dt; x.s += x.v * 100 * dt;
      const stop = x.d * 100 + 4 - R_BALL;
      if (x.s >= stop) { x.s = stop; x.rolling = false; x.v = 0; x.hitAt = x.t; lab.sfx('thud'); }
    }
    if (x.rolling || x.timing || x.armed) x.t += dt;
    // the watch starts after the student's reaction time (all in simulation time)
    if (x.armed && x.t >= x.startLag) { x.armed = false; x.timing = true; x.watch = x.t - x.startLag; }
    if (x.timing) { x.watch += dt; if (x.hitAt != null && x.t - x.hitAt >= x.react) { x.timing = false; lab.sfx('click'); } }
  },
  update: (lab) => {
    const x = lab.x;
    if (x.d == null) return;
    lab.items.watch.app.sw.show(x.watch || 0);
    if (x.marbleOn && !lab.carried.has('marble')) placeMarble(lab);
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    $('iT').textContent = `${(x.watch || 0).toFixed(2)} s`;
    $('iD').textContent = `Stopper: ${x.onRamp ? `${(x.d * 100).toFixed(0)} cm` : 'not on the plank'}`;
    $('iS').textContent = x.rolling ? 'Marble rolling…' : x.onStart ? 'Marble at the start line' : '';
    $('iDist').textContent = x.onRamp ? `${(x.d * 100).toFixed(0)} cm` : '—';
    $('iV').textContent = `${x.v.toFixed(2)} m/s`;
    $('iW').textContent = `${(x.watch || 0).toFixed(2)} s`;
  },
  chips: (lab) => [[`Stopper: ${lab.x.onRamp ? `${(lab.x.d * 100).toFixed(0)} cm` : '—'}`, ''], [lab.x.rolling ? 'Rolling' : 'At rest', lab.x.rolling ? 'hot' : '']],
  result: (lab) => {
    const r = lab.rows;
    if (!r.length) return { items: [['Mean speed', '—'], ['Acceleration', '—']], note: 'Time the marble over three distances.' };
    const aEst = r.reduce((s, q) => s + (2 * q.d) / (q.t * q.t), 0) / r.length;
    return { items: [['Mean average speed', `${(r.reduce((s, q) => s + q.v, 0) / r.length).toFixed(3)} m/s`], ['a = 2d/t² (mean)', `${aEst.toFixed(3)} m/s²`], ['Theory (5/7) g sin θ', `${((5 / 7) * G * Math.sin(TH)).toFixed(3)} m/s²`]], note: 'The average speed grows with d because the marble keeps speeding up: d/t² stays about constant.' };
  },
  obsRows: 3,
  obsKeys: ['d', 't', 'v'],
  observation: (lab) => ({ rows: lab.rows.map((q) => ({ d: q.d.toFixed(2), t: q.t.toFixed(2), v: q.v.toFixed(3) })) }),
};

function placeBarrier(lab) {
  const p = along(lab.x.d * 100 + 4, -2.2 - 0.05);
  const b = lab.items.barrier.group;
  b.position.set(p.x, p.y + 0.9, Z); b.rotation.set(0, 0, -TH);
}
function placeMarble(lab) {
  const m = lab.items.marble;
  m.group.position.copy(along(lab.x.s, 0.9 - 2.2)).setZ(Z);
  m.app.ball.rotation.z = -(lab.x.s / R_BALL);
}
async function moveStopper(lab, d) {
  const b = lab.items.barrier;
  if (!lab.x.onRamp) {
    await lab.pickUp('barrier');
    const p = along(d * 100 + 4, -2.2 - 0.05);
    await lab.holdAt('barrier', V3(p.x, p.y + 0.9, Z), new THREE.Euler(0, 0, -TH), { dur: 1.0 });
    lab.releaseCarried('barrier');
    lab.x.onRamp = true;
  } else {
    const R = lab.handR();
    await lab.touch(b.group.localToWorld(V3(0, 3.2, 0)), null, { pose: 'pinch', lift: 0 });
    const d0 = lab.x.d;
    await lab.tween(0.5 + Math.abs(d - d0) * 1.5, (e) => { lab.x.d = d0 + (d - d0) * e; placeBarrier(lab); R.goal.copy(b.group.localToWorld(V3(0, 3.2, 0))); });
  }
  lab.x.d = d; placeBarrier(lab);
  lab.toast(`Stopper set ${(d * 100).toFixed(0)} cm from the start line.`, 'info', 2500);
}
async function resetMarble(lab) {
  const x = lab.x;
  if (!x.marbleOn) {
    await lab.pickUp('marble');
    await lab.holdAt('marble', along(4, 0.9 - 2.2), new THREE.Euler(0, 0, 0), { dur: 1.0 });
    lab.releaseCarried('marble');
  } else {
    const m = lab.items.marble.group;
    await lab.touch(m.position.clone().add(V3(0, 1.8, 0)), null, { pose: 'pinch' });
    const s0 = x.s, R = lab.handR();
    await lab.tween(0.8, (e) => { x.s = s0 + (4 - s0) * e; placeMarble(lab); R.goal.copy(m.position).add(V3(0, 1.8, 0)); });
  }
  x.s = 4; x.onStart = true; x.marbleOn = true; x.v = 0; x.rolling = false;
}
async function run(lab) {
  const x = lab.x;
  if (!x.onRamp) { lab.toast('Put the stopper on the plank first.', 'err'); return; }
  if (!x.onStart || x.s > 4.01) await resetMarble(lab);
  // left hand ready on the stopwatch, right finger holding the marble
  const w = lab.items.watch.group;
  const L = lab.handL(), R = lab.handR();
  await lab.handTo(L, w.localToWorld(V3(0, 5, -0.9)), { pose: 'press', contact: 'index', dur: 0.6, arc: 4 });
  await lab.handTo(R, lab.items.marble.group.position.clone().add(V3(-0.6, 1.9, 0)), { pose: 'press', contact: 'index', dur: 0.6, arc: 4 });
  await lab.wait(0.4);
  x.watch = 0; x.t = 0; x.hitAt = null; x.react = 0.12 + (Math.random() - 0.5) * 0.1;
  const startLag = 0.12 + (Math.random() - 0.5) * 0.1; // human reaction at the start too
  x.startLag = startLag; x.armed = true;
  x.rolling = true;
  lab.sfx('click');
  await lab.handTo(R, R.goal.clone().add(V3(-2, 4, 0)), { pose: 'relaxed', dur: 0.3, arc: 0 });
  await lab.waitFor(() => !x.rolling && !x.timing && !x.armed, 12);
  x.watch = Math.max(0, x.watch);
  const t = Math.round(x.watch * 100) / 100;
  if (lab.rows.some((r) => Math.abs(r.d - x.d) < 1e-6)) { lab.toast('Already timed at this distance — move the stopper.', 'warn'); return; }
  lab.addRow({ d: x.d, t, v: x.d / t });
  lab.toast(`d = ${(x.d * 100).toFixed(0)} cm, t = ${t.toFixed(2)} s → v = ${(x.d / t).toFixed(3)} m/s`, 'ok', 5000);
  x.onStart = false; // the marble now rests against the stopper
}
