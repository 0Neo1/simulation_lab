// Newton's second law: a trolley on a runway is pulled by a string over a
// pulley at the end of the bench by a hanging load. Friction is compensated
// by tilting the runway; the time over a fixed distance gives a = 2s/t².
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Z = -8, RUN_X0 = -100, RUN_X1 = 112, RUN_TOP = 2.4, START_X = 26, S = 0.6; // m
const PULLEY = V3(118, -3 + RUN_TOP + 5.5, Z), PR = 2.6, G = 9.8, MU = 0.022;
const LOADS = [20, 40, 60, 80]; // g, hanger included

function buildRunway() {
  const g = new THREE.Group();
  const len = RUN_X1 - RUN_X0;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(len, RUN_TOP, 14), new THREE.MeshStandardMaterial({ map: PH.PM.wood.map, roughness: 0.5 }));
  deck.position.set(len / 2, RUN_TOP / 2, 0); deck.castShadow = true; deck.receiveShadow = true;
  const lip1 = new THREE.Mesh(new THREE.BoxGeometry(len, 1, 0.6), PH.PM.darkWood); lip1.position.set(len / 2, RUN_TOP + 0.5, 6.7);
  const lip2 = lip1.clone(); lip2.position.z = -6.7;
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(len - 4, 1.6), new THREE.MeshStandardMaterial({ map: PH.scaleTexture(Math.round(len - 4), { vertical: false }), roughness: 0.6 }));
  scale.rotation.x = -Math.PI / 2; scale.position.set(len / 2, RUN_TOP + 0.02, 5.4);
  const start = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 12), new THREE.MeshBasicMaterial({ color: 0x16a34a })); start.position.set(START_X - RUN_X0, RUN_TOP + 0.03, 0);
  const flag = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 12, 6), PH.PM.darkSteel); pole.position.y = 6;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6), new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide })); cloth.position.set(2, 10.5, 0);
  flag.add(pole, cloth); flag.position.set(START_X - RUN_X0 + S * 100, RUN_TOP, -7.4);
  const buffer = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 12), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })); buffer.position.set(len - 8, RUN_TOP + 2, 0);
  g.add(deck, lip1, lip2, scale, start, flag, buffer);
  const wedge = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 12), PH.PM.darkWood); wedge.position.set(4, -0.2, 0);
  g.add(wedge);
  return { group: g, wedge, size: [len, RUN_TOP + 12, 14], grip: V3(10, RUN_TOP, 6) };
}
function buildTrolley() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(14, 4, 9), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.2 })); body.position.y = 3.4; body.castShadow = true;
  const top = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 7), PH.PM.darkSteel); top.position.y = 5.7;
  g.add(body, top);
  const wheels = [];
  [-4.5, 4.5].forEach((x) => [-4.9, 4.9].forEach((z) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.8, 18), PH.PM.black); w.rotation.x = Math.PI / 2; w.position.set(x, 1.4, z); g.add(w); wheels.push(w); }));
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 6, 12), PH.PM.steel); hook.position.set(7.4, 3.6, 0); hook.rotation.y = Math.PI / 2;
  g.add(hook);
  return { group: g, wheels, size: [14, 6, 10], grip: V3(0, 6, 0), pose: 'grab', hookLocal: V3(7.6, 3.6, 0) };
}
function buildPulley() {
  const g = new THREE.Group();
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 5), PH.PM.castIron); clamp.position.set(0, 0, 0); clamp.castShadow = true;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1, 7, 1.2), PH.PM.darkSteel); arm.position.set(0, 4.5, 0);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR, 0.8, 32), new THREE.MeshStandardMaterial({ color: 0xd9a948, metalness: 0.9, roughness: 0.3 })); wheel.rotation.x = Math.PI / 2; wheel.position.set(0, 8.5 - PR - 0.4 + 0.4, 0);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 10), PH.PM.steel); screw.position.set(0, -5, 0);
  g.add(clamp, arm, wheel, screw);
  return { group: g, wheel, size: [3, 12, 5], grip: V3(0, 2, 2.6), pose: 'grab' };
}
function buildHangerSet() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 7), PH.PM.darkWood); box.position.y = 1; g.add(box);
  const hanger = PH.hanger(20); hanger.scale.setScalar(0.7); hanger.position.set(-6, 2, 0); g.add(hanger);
  const weights = [];
  for (let i = 0; i < 3; i++) { const w = PH.slottedWeight(20); w.scale.setScalar(0.8); w.position.set(-1 + i * 3.6, 2, 0); w.userData.home = w.position.clone(); g.add(w); weights.push(w); }
  return { group: g, hanger, weights, size: [18, 8, 7], grip: V3(8, 2, 0) };
}

export default {
  id: 'phy092',
  lab: 'Physics Lab',
  title: 'Newton’s second law — force, mass and acceleration',
  intro: 'Pull a trolley with different hanging loads, measure its acceleration from the time taken over a fixed distance, and relate force to acceleration.',
  board: {
    title: 'Newton’s second law: F = m a',
    formulas: ['s = ½ a t²  ⇒  a = 2s / t²', 'F = m_load × g', 'F / a = mass being accelerated'],
    steps: ['Compensate friction: tilt the runway', 'Tie string: trolley → pulley → hanger', 'Hold trolley at the start line, release', 'Time it over s = 0.60 m', 'Repeat with larger loads'],
    note: 'Catch the load before it hits the floor!',
  },
  items: {
    runway: { name: 'Runway with scale', label: 'Runway', build: () => buildRunway(), slot: [RUN_X0, Z, 0], fixed: true, labelY: 6 },
    pulley: { name: 'Pulley with bench clamp', label: 'Pulley', build: () => buildPulley(), slot: [PULLEY.x, Z, 0], slotY: -3 - 1, setupText: 'Clamp the pulley to the end of the bench, in line with the runway.' },
    trolley: { name: 'Trolley', label: 'Trolley', build: (lab) => { lab.M_trolley = 0.5 + Math.random() * 0.3; return buildTrolley(); }, slot: [START_X - 7.6, Z, 0], slotY: -3 + RUN_TOP, setupText: 'Put the trolley on the runway at the start line.' },
    hset: { name: 'Hanger (20 g) and slotted masses', label: 'Hanger & masses', build: () => buildHangerSet(), slot: [60, 26, 0] },
    watch: { name: 'Stopwatch', label: 'Stopwatch', build: () => { const s = C.stopwatch(); return Object.assign(s.app, { sw: s }); }, slot: [10, 28, 0] },
  },
  setupOrder: ['pulley', 'trolley', 'hset', 'watch'],
  views: { runway: { label: 'Runway', fit: [-100, 125, [12, 0, Z]] }, pulley: { label: 'Pulley', pos: [95, 20, 45], target: [118, -20, Z] } },
  classicView: 'runway',
  pips: [{ id: 'watch', title: 'Stopwatch', fov: 24, update: (cam, lab) => { const p = lab.items.watch.group.position; cam.position.set(p.x, p.y + 9, p.z + 7); cam.lookAt(p.x, p.y + 2, p.z); }, show: (lab) => lab.items.watch.placed }],
  overlay: '<b>Trolley</b><span class="big" id="nT">0.00 s</span><div id="nF"></div><div id="nS"></div>',
  hintExtra: 'click the <b>trolley</b> to release it · panel buttons change the load',
  panel: [{
    title: 'Motion',
    html: `
      <div class="row"><button class="btn ghost act" id="nTie">Tie string over pulley</button><button class="btn ghost act" id="nComp">Compensate friction</button></div>
      <div class="row small">Load: ${LOADS.map((m) => `<button class="mini act" data-m="${m}">${m} g</button>`).join('')}</div>
      <div class="row"><button class="btn act" id="nGo">Release + time</button><button class="btn ghost act" id="nBack">Trolley to start</button></div>
      <div class="meters"><div class="m"><i>Hanging load</i><b id="nL">—</b></div><div class="m"><i>Runway tilt</i><b id="nTh">0.0°</b></div><div class="m"><i>Trolley speed</i><b id="nV">0.00 m/s</b></div><div class="m"><i>Distance</i><b id="nD">0.00 m</b></div></div>`,
    bind: (lab, root) => {
      root.querySelector('#nTie').onclick = () => lab.act(() => tie(lab));
      root.querySelector('#nComp').onclick = () => lab.act(() => compensate(lab));
      root.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => lab.act(() => setLoad(lab, +b.dataset.m)); });
      root.querySelector('#nGo').onclick = () => lab.act(() => run(lab));
      root.querySelector('#nBack').onclick = () => lab.act(() => toStart(lab));
    },
  }],
  table: { columns: [{ key: 'F', label: 'F (N)', fmt: (v) => v.toFixed(3) }, { key: 't', label: 't (s)', fmt: (v) => v.toFixed(2) }, { key: 's', label: 's (m)', fmt: (v) => v.toFixed(2) }, { key: 'a', label: 'a = 2s/t² (m/s²)', fmt: (v) => v.toFixed(3) }], note: 'The trolley’s mass stays the same; only the pulling force changes.' },
  steps: (lab) => [
    { phase: 'Prepare', text: 'Tie the string to the trolley, pass it over the pulley and hook the 20 g hanger on its end.', check: () => lab.x.tied, demo: () => tie(lab) },
    { phase: 'Prepare', text: 'Compensate friction: with the hanger removed, raise the runway’s far end with the wedge until a gentle push makes the trolley move at a steady speed.', why: 'Then the net force on the trolley is just the pull of the hanging load.', check: () => lab.x.comp, demo: () => compensate(lab) },
    ...LOADS.flatMap((m, i) => [
      { phase: `Load ${m} g`, text: i === 0 ? 'Hold the trolley at the start line with the 20 g hanger, release it and time it over 0.60 m.' : `Add a 20 g mass (load ${m} g), bring the trolley back to the start line, release it and time it.`, why: i === 0 ? 'Start the stopwatch at release; stop it as the trolley passes the red flag.' : '', check: () => lab.rows.some((r) => Math.abs(r.m - m) < 1e-6), demo: async () => { if (lab.x.load !== m) await setLoad(lab, m); await run(lab); } },
    ]),
  ],
  state: () => ({ tied: false, comp: false, theta: 0, load: 20, x: 0, v: 0, moving: false, t: 0, watch: 0, timing: false, armed: false, hitAt: null, react: 0.1, startLag: 0.1 }),
  init: (lab) => {
    lab.actionable(lab.items.trolley.group, { tip: 'Trolley — click to release it (and start the stopwatch)', enabled: () => lab.items.trolley.placed && lab.x.tied, run: () => run(lab) });
    const line = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.9 }));
    line.userData.noPick = true;
    lab.scene.add(line);
    lab.string = line;
  },
  reset: (lab) => { lab.x.tied = false; },
  quickSetup: (lab) => { lab.x.tied = true; },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.load == null) return;
    const M = lab.M_trolley, m = x.load / 1000;
    if (x.moving) {
      const push = x.tied ? m * G : 0;
      const a = (push + M * G * Math.sin(x.theta) - MU * M * G * Math.cos(x.theta)) / (M + (x.tied ? m : 0));
      x.v = Math.max(0, x.v + a * dt);
      x.x += x.v * 100 * dt;
      if (x.x >= S * 100 && x.hitAt == null) x.hitAt = x.t;
      const maxX = RUN_X1 - 10 - 7 - (START_X);
      if (x.x >= maxX) { x.x = maxX; x.v = 0; x.moving = false; lab.sfx('thud'); }
    }
    if (x.moving || x.timing || x.armed) x.t += dt;
    if (x.armed && x.t >= x.startLag) { x.armed = false; x.timing = true; x.watch = x.t - x.startLag; }
    if (x.timing) { x.watch += dt; if (x.hitAt != null && x.t - x.hitAt >= x.react) { x.timing = false; lab.sfx('click'); } }
  },
  update: (lab) => {
    const x = lab.x;
    if (x.load == null) return;
    const tr = lab.items.trolley;
    const rw = lab.items.runway.group;
    // the start end is raised on the wedge; the runway pivots at the pulley end
    rw.rotation.z = -x.theta;
    rw.position.y = -3 + Math.sin(x.theta) * (RUN_X1 - RUN_X0);
    if (tr.placed && !lab.carried.has('trolley')) {
      const px = START_X + x.x;
      tr.group.position.set(px - 7.6, -3 + RUN_TOP + (RUN_X1 - px) * Math.tan(x.theta), Z);
      tr.group.rotation.set(0, 0, -x.theta);
      tr.app.wheels.forEach((w) => { w.rotation.y = -(x.x / 1.4); });
    }
    lab.items.pulley.app.wheel.rotation.z = -(x.x / PR);
    lab.items.watch.app.sw.show(x.watch || 0);
    // string and hanging load
    const hs = lab.items.hset.app;
    if (x.tied && tr.placed) {
      tr.group.updateMatrixWorld(true);
      const a = tr.group.localToWorld(tr.app.hookLocal.clone());
      const top = V3(PULLEY.x, PULLEY.y + PR - 0.2, Z);
      const hangY = PULLEY.y - 6 - x.x;
      const pts = [a, top, V3(PULLEY.x + PR * 0.7, PULLEY.y + PR * 0.7, Z), V3(PULLEY.x + PR, PULLEY.y, Z), V3(PULLEY.x + PR, hangY + 7.3, Z)];
      lab.string.geometry.dispose();
      lab.string.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 40, 0.06, 5, false);
      lab.string.visible = true;
      if (hs.hanger.parent !== lab.scene) lab.scene.attach(hs.hanger);
      hs.hanger.position.set(PULLEY.x + PR, hangY, Z); hs.hanger.rotation.set(0, 0, 0);
    } else lab.string.visible = false;
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    $('nT').textContent = `${(x.watch || 0).toFixed(2)} s`;
    $('nF').textContent = `Load ${x.load} g → F = ${((x.load / 1000) * G).toFixed(3)} N`;
    $('nS').textContent = x.moving ? 'Trolley moving…' : x.comp ? 'Friction compensated' : 'Friction not compensated';
    $('nL').textContent = `${x.load} g`; $('nTh').textContent = `${((x.theta * 180) / Math.PI).toFixed(2)}°`;
    $('nV').textContent = `${x.v.toFixed(2)} m/s`; $('nD').textContent = `${(x.x / 100).toFixed(2)} m`;
  },
  chips: (lab) => [[`String: ${lab.x.tied ? 'over the pulley' : 'not tied'}`, lab.x.tied ? 'ok' : ''], [`Friction: ${lab.x.comp ? 'compensated' : 'not compensated'}`, lab.x.comp ? 'ok' : ''], [`Load: ${lab.x.load} g`, '']],
  result: (lab) => {
    const r = lab.rows;
    if (!r.length) return { items: [['F / a', '—'], ['Trolley mass', 'hidden']], note: 'Time the trolley for four different loads.' };
    const k = r.reduce((s, q) => s + q.F * q.a, 0) / r.reduce((s, q) => s + q.a * q.a, 0);
    const reveal = r.length >= 4;
    return { items: [['Slope F/a', `${k.toFixed(3)} kg`], ['Trolley mass (after 4)', reveal ? `${lab.M_trolley.toFixed(3)} kg` : 'hidden'], ['a ∝ F?', r.length >= 2 ? 'yes — a straight line through the origin' : '—']], note: 'F/a comes out as the total mass being accelerated (trolley plus hanging load), as F = ma predicts.' };
  },
  obsRows: 4,
  obsKeys: ['F', 't', 's', 'a'],
  observation: (lab) => ({ rows: lab.rows.map((q) => ({ F: q.F.toFixed(3), t: q.t.toFixed(2), s: q.s.toFixed(2), a: q.a.toFixed(3) })) }),
};

async function tie(lab) {
  const tr = lab.items.trolley;
  if (!tr.placed) { lab.toast('Put the trolley on the runway first.', 'err'); return; }
  await lab.touch(tr.group.localToWorld(tr.app.hookLocal.clone()), null, { pose: 'pinch' });
  await lab.touch(V3(PULLEY.x, PULLEY.y + PR + 1, Z), null, { pose: 'pinch' });
  const hs = lab.items.hset.app;
  await lab.touch(hs.hanger.getWorldPosition(V3()).add(V3(0, 6, 0)), null, { pose: 'pinch' });
  lab.x.tied = true;
  lab.sfx('tick');
}
async function compensate(lab) {
  const x = lab.x;
  const wedge = lab.items.runway.app.wedge;
  const wasTied = x.tied;
  x.tied = false; // hanger off while compensating
  await lab.touch(wedge.getWorldPosition(V3()).add(V3(0, 1.5, 6)), null, { pose: 'grab' });
  const th = Math.asin(MU) * (1 + (Math.random() - 0.5) * 0.08);
  const t0 = x.theta;
  await lab.tween(1.2, (e) => { x.theta = t0 + (th - t0) * e; wedge.scale.y = 1 + e * 2.4; });
  // a gentle push: the trolley keeps a steady speed
  await toStart(lab);
  x.v = 0.18; x.moving = true;
  await lab.wait(1.6);
  x.moving = false; x.v = 0;
  x.comp = true;
  x.tied = wasTied;
  lab.toast('The pushed trolley now rolls at a steady speed: friction is compensated.', 'ok', 4500);
  await toStart(lab);
}
async function setLoad(lab, m) {
  const x = lab.x, hs = lab.items.hset.app;
  const need = (m - 20) / 20;
  const cur = (x.load - 20) / 20;
  for (let i = cur; i < need; i++) {
    const w = hs.weights[i];
    await lab.touch(w, null, { pose: 'pinch', lift: 0.6 });
    lab.scene.attach(w);
    const s0 = w.position.clone(), R = lab.handR();
    const dest = () => hs.hanger.localToWorld(V3(0, 0.45 + i * 0.5, 0));
    await lab.tween(1.0, (e) => { w.position.lerpVectors(s0, dest(), e); w.position.y += Math.sin(Math.PI * e) * 5; R.goal.copy(w.position).add(V3(0, 0.8, 0)); });
    hs.hanger.attach(w); w.position.set(0, 0.45 / 0.7 + i * 0.7, 0); w.rotation.set(0, i, 0);
    lab.sfx('tick');
  }
  for (let i = cur - 1; i >= need; i--) {
    const w = hs.weights[i];
    lab.items.hset.group.attach(w); w.position.copy(w.userData.home); w.rotation.set(0, 0, 0);
  }
  x.load = m;
}
async function toStart(lab) {
  const x = lab.x, tr = lab.items.trolley;
  if (x.x < 0.1) { x.x = 0; return; }
  await lab.touch(tr.group.localToWorld(V3(0, 6.2, 0)), null, { pose: 'grab' });
  const x0 = x.x, R = lab.handR();
  await lab.tween(0.6 + x0 / 80, (e) => { x.x = x0 * (1 - e); R.goal.copy(tr.group.localToWorld(V3(0, 6.2, 0))); });
  x.x = 0; x.v = 0;
}
async function run(lab) {
  const x = lab.x;
  if (!x.tied) { lab.toast('Tie the string over the pulley first.', 'err'); return; }
  if (x.x > 0.1) await toStart(lab);
  const w = lab.items.watch.group, tr = lab.items.trolley;
  const L = lab.handL(), R = lab.handR();
  await lab.handTo(L, w.localToWorld(V3(0, 5, -0.9)), { pose: 'press', contact: 'index', dur: 0.6, arc: 4 });
  await lab.handTo(R, tr.group.localToWorld(V3(-3, 6.2, 0)), { pose: 'grab', contact: 'palm', dur: 0.6, arc: 4 });
  await lab.wait(0.3);
  x.watch = 0; x.t = 0; x.hitAt = null; x.react = 0.11 + (Math.random() - 0.5) * 0.08;
  x.startLag = 0.11 + (Math.random() - 0.5) * 0.08; x.armed = true;
  x.moving = true; x.v = 0;
  lab.sfx('click');
  await lab.handTo(R, R.goal.clone().add(V3(-4, 6, 4)), { pose: 'relaxed', dur: 0.3, arc: 0 });
  await lab.waitFor(() => !x.timing && !x.armed && x.hitAt != null, 15);
  await lab.waitFor(() => !x.moving, 6);
  const t = Math.round(x.watch * 100) / 100;
  if (lab.rows.some((r) => Math.abs(r.m - x.load) < 1e-6)) { lab.toast('This load is already timed — change the load.', 'warn'); return; }
  const F = (x.load / 1000) * G, a = (2 * S) / (t * t);
  lab.addRow({ m: x.load, F, t, s: S, a });
  lab.toast(`Load ${x.load} g: t = ${t.toFixed(2)} s over ${S.toFixed(2)} m → a = ${a.toFixed(3)} m/s²`, 'ok', 5000);
}
