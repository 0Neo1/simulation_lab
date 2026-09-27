// Ohm's law: V–I characteristic of a resistance coil. Battery, plug key,
// ammeter, rheostat and the coil in series, voltmeter across the coil. The
// circuit the student actually wires is solved by nodal analysis, so a
// reversed meter reads backwards and a misplaced one behaves as it would.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const EMF = 6, R_INT = 0.4, R_AMM = 0.05, R_VOLT = 2000, LEAD = 0.015;

export default {
  id: 'phy124',
  lab: 'Physics Lab',
  title: 'Ohm’s law — V–I characteristic of a resistor',
  intro: 'Verify Ohm’s law and find the resistance of a coil by plotting the potential difference across it against the current through it.',
  wiring: true,
  flowOption: 'Show charge flow',
  board: {
    title: 'Ohm’s law: V ∝ I',
    formulas: ['V = I R', 'R = slope of V–I graph'],
    steps: ['Connect battery, key, ammeter, rheostat, R in series', 'Voltmeter in parallel across R (+ to +)', 'Start with the rheostat at maximum', 'Insert key, read V and I', 'Change rheostat, take 5 readings', 'Remove key between readings'],
    note: 'Ammeter in series · Voltmeter in parallel',
    draw: (g) => {
      const L = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
      L([[120, 300], [120, 620], [860, 620], [860, 300], [120, 300]]);
      g.strokeRect(420, 280, 160, 40); g.fillText('R', 488, 265);
      g.beginPath(); g.arc(250, 300, 34, 0, 7); g.stroke(); g.fillText('A', 236, 314);
      g.beginPath(); g.arc(500, 420, 34, 0, 7); g.stroke(); g.fillText('V', 486, 434);
      L([[420, 300], [420, 420], [466, 420]]); L([[534, 420], [580, 420], [580, 300]]);
      L([[700, 600], [700, 640]]); L([[720, 590], [720, 650]]); g.fillText('E', 700, 700);
      g.strokeRect(300, 600, 120, 40); g.fillText('Rh', 330, 580);
    },
  },
  items: {
    battery: { name: 'Battery (4 dry cells, 6 V)', label: 'Battery 6 V', build: (lab) => PH.battery(lab.M, { cells: 4 }), slot: [-66, 14, 0] },
    key: { name: 'Plug key', label: 'Key K', build: (lab) => PH.plugKey(lab.M), slot: [-42, 20, 0] },
    amm: { name: 'Ammeter (0–2 A)', label: 'Ammeter', build: (lab) => PH.dialMeter(lab.M, { symbol: 'A', max: 2, major: 0.5, minor: 0.02, name: 'Ammeter', range: '0 – 2 A', labelDec: 1 }), slot: [-34, -18, 0] },
    rh: { name: 'Rheostat (20 Ω)', label: 'Rheostat', build: (lab) => PH.rheostat(lab.M, { Rmax: 20 }), slot: [2, 20, 0], why: 'The rheostat changes the current, so several pairs of V and I can be taken.' },
    coil: { name: 'Resistance coil R', label: 'Resistance coil R', build: (lab) => PH.resistanceCoil(lab.M, { labelText: 'R = ?' }), slot: [4, -20, 0] },
    volt: { name: 'Voltmeter (0–10 V)', label: 'Voltmeter', build: (lab) => PH.dialMeter(lab.M, { symbol: 'V', max: 10, major: 2, minor: 0.1, name: 'Voltmeter', range: '0 – 10 V', labelDec: 0 }), slot: [40, -18, 0] },
  },
  setupOrder: ['battery', 'key', 'amm', 'rh', 'coil', 'volt'],
  leadColor: (a) => (a === 'battery.+' ? 'red' : a === 'battery.-' ? 'black' : a.startsWith('volt') ? 'yellow' : 'blue'),
  views: {
    meters: { label: 'Meters', pos: [2, 30, 30], target: [2, -2, -18] },
    rheostat: { label: 'Rheostat', pos: [2, 22, 48], target: [2, 2, 20] },
  },
  pips: [
    { id: 'amm', title: 'Ammeter', fov: 34, update: (cam, lab) => { const f = lab.items.amm.app.faceWorld(15); cam.position.copy(f.eye); cam.lookAt(f.at); }, show: (lab) => lab.items.amm.placed },
    { id: 'volt', title: 'Voltmeter', fov: 34, update: (cam, lab) => { const f = lab.items.volt.app.faceWorld(15); cam.position.copy(f.eye); cam.lookAt(f.at); }, show: (lab) => lab.items.volt.placed },
  ],
  overlay: '<b>V–I graph</b><canvas id="viGraph" width="220" height="150" style="width:220px;height:150px;display:block"></canvas>',
  hintExtra: 'click the <b>key</b> plug · <b>drag</b> the rheostat slider',
  panel: [{
    title: 'Circuit',
    html: `
      <div class="row"><button class="btn act" id="oKey">Insert key K</button><button class="btn ghost act" id="oMax">Rheostat to maximum</button></div>
      <label class="lbl">Rheostat slider (resistance in circuit) <span class="big" id="oRh">—</span></label>
      <input type="range" id="oSlider" min="0" max="1" step="0.01" value="1" />
      <div class="meters">
        <div class="m"><i>Ammeter</i><b id="oI">—</b></div>
        <div class="m"><i>Voltmeter</i><b id="oV">—</b></div>
        <div class="m"><i>Coil temperature</i><b id="oT">—</b></div>
        <div class="m"><i>Circuit</i><b id="oC">—</b></div>
      </div>`,
    bind: (lab, root) => {
      const $ = (id) => root.querySelector(`#${id}`);
      $('oKey').onclick = () => lab.act(() => pressKey(lab));
      $('oMax').onclick = () => lab.act(() => slideTo(lab, 1));
      $('oSlider').oninput = (e) => { if (!lab.autopilot) lab.items.rh.app.set(+e.target.value); };
    },
  }],
  table: {
    columns: [
      { key: 'V', label: 'V (V)', fmt: (v) => v.toFixed(2) },
      { key: 'I', label: 'I (A)', fmt: (v) => v.toFixed(2) },
      { key: 'R', label: 'R = V/I (Ω)', fmt: (v) => v.toFixed(2) },
    ],
    recordLabel: 'Record V and I',
    note: 'Take at least five readings with different rheostat settings. Remove the key between readings so the coil does not heat up.',
  },
  record: (lab) => recordReading(lab),
  steps: (lab) => {
    const W = () => wiring(lab);
    const conn = (text, check, pairs, why) => ({ phase: 'Make the connections', text, why, check, terms: pairs.flat(), demo: async () => { for (const [a, b] of pairs) if (!joined(lab, a, b)) await lab.demoConnect(a, b); } });
    return [
      conn('Connect the battery (+) to one terminal of the plug key.', () => W().batKey, [['battery.+', 'key.1']], 'Connections are made with the key out, so no current flows while wiring.'),
      conn('Connect the other key terminal to the ammeter (+).', () => W().keyAmm, [['key.2', 'amm.+']], 'Current must enter a meter at its + terminal.'),
      conn('Connect the ammeter (−) to end A of the rheostat.', () => W().ammRh, [['amm.-', 'rh.A']]),
      conn('Connect the rheostat slider C to one end of the coil R.', () => W().rhCoil, [['rh.C', 'coil.1']]),
      conn('Connect the other end of the coil to the battery (−).', () => W().coilBat, [['coil.2', 'battery.-']], 'Everything so far is in series: the same current flows through the ammeter and the coil.'),
      conn('Connect the voltmeter across the coil: (+) to the end joined to the rheostat, (−) to the other end.', () => W().voltOk, [['volt.+', 'coil.1'], ['volt.-', 'coil.2']], 'A voltmeter is always connected in parallel with the component whose p.d. it measures.'),
      { phase: 'Check the circuit', text: 'Set the rheostat to maximum resistance before switching on.', why: 'Starting with the largest resistance keeps the current small in case of a wrong connection.', check: () => lab.items.rh.app.f > 0.95 || lab.x.checked, demo: () => slideTo(lab, 1), rings: () => [lab.items.rh.app.knobWorld()] },
      { phase: 'Check the circuit', text: 'Insert the key and check that both meters deflect the right way.', check: () => lab.x.checked, demo: async () => { if (!lab.x.keyIn) await pressKey(lab); await lab.wait(1.2); lab.x.checked = true; }, rings: () => [lab.items.key.app.plug.getWorldPosition(V3())] },
      ...[0, 1, 2, 3, 4].map((i) => ({
        phase: 'Take readings',
        text: i === 0 ? 'Read the voltmeter and ammeter, and record the pair of readings.' : `Move the rheostat slider to a new position and record reading ${i + 1}.`,
        why: i === 0 ? 'Read with your eye directly above the needle so its image in the mirror strip is hidden.' : i === 1 ? 'Remove the key between readings so the coil stays at room temperature.' : '',
        check: () => lab.rows.length > i,
        demo: async () => {
          const f = [1, 0.72, 0.48, 0.26, 0.05][i];
          if (Math.abs(lab.items.rh.app.f - f) > 0.02) await slideTo(lab, f);
          if (!lab.x.keyIn) await pressKey(lab);
          await lab.wait(1.0);
          await lab.waitFor(() => Math.abs(lab.items.amm.app.needle.v) < 0.02 && Math.abs(lab.items.volt.app.needle.v) < 0.02, 8);
          await recordReading(lab);
          await pressKey(lab); // key out while changing
        },
      })),
    ];
  },
  state: () => ({ keyIn: false, T: 25, checked: false, V: 0, I: 0, sol: null, warnedAt: 0, keyOn: 0 }),
  init: (lab) => {
    lab.x = { keyIn: false, T: 25 };
    const R0 = 4 + Math.random() * 2;
    lab.R0 = R0;
    const plugObj = lab.items.key.app.plug;
    lab.actionable(plugObj, { tip: () => `Key K — click to ${lab.x.keyIn ? 'take the plug out' : 'insert the plug'}`, run: () => pressKey(lab) });
    const rh = lab.items.rh.app;
    let f0 = 0;
    lab.actionable(rh.slider, {
      tip: () => `Rheostat slider — drag along the rod (${(rh.f * rh.Rmax).toFixed(1)} Ω in circuit)`,
      drag: {
        start: () => { f0 = rh.f; },
        move: (p, start) => { const dx = rh.group.worldToLocal(p.clone()).x - rh.group.worldToLocal(start.clone()).x; rh.set(f0 + dx / rh.length); },
        hand: () => rh.knobWorld(),
      },
    });
    buildFlow(lab);
  },
  reset: (lab) => {
    lab.items.key.app.plug.userData.inserted = false;
    lab.items.rh.app.set(0.5);
    lab.R0 = 4 + Math.random() * 2;
  },
  quickSetup: (lab) => {
    [['battery.+', 'key.1'], ['key.2', 'amm.+'], ['amm.-', 'rh.A'], ['rh.C', 'coil.1'], ['coil.2', 'battery.-'], ['volt.+', 'coil.1'], ['volt.-', 'coil.2']].forEach(([a, b]) => lab.connect(a, b, null, true));
    lab.items.rh.app.set(1);
  },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.T == null) return;
    const R = lab.R0 * (1 + 0.0008 * (x.T - 25)); // a nichrome-like coil: small temperature coefficient
    const sol = solve(lab, R);
    x.sol = sol;
    x.I = sol.I; x.V = sol.V;
    const P = sol.Icoil * sol.Icoil * R;
    x.T += (P / 6 - (x.T - 25) * 0.05) * dt; // heat capacity ~6 J/K, cooling to the room
    x.keyOn = x.keyIn ? x.keyOn + dt : 0;
    lab.items.amm.app.set(sol.I);
    lab.items.volt.app.set(sol.V);
    lab.items.amm.app.update(dt);
    lab.items.volt.app.update(dt);
    PH.animatePlug(lab.items.key.app.plug, dt);
    if (Math.abs(sol.Icell) > 4 && performance.now() - x.warnedAt > 6000) { x.warnedAt = performance.now(); lab.toast(`Short circuit! ${Math.abs(sol.Icell).toFixed(1)} A from the battery. Take the key out and check the connections.`, 'err', 6000); lab.sfx('buzz'); }
    if (sol.I < -0.03 && performance.now() - x.warnedAt > 6000) { x.warnedAt = performance.now(); lab.toast('The ammeter needle is pushed below zero — its + and − are reversed.', 'warn'); }
    if (sol.V < -0.2 && performance.now() - x.warnedAt > 6000) { x.warnedAt = performance.now(); lab.toast('The voltmeter reads backwards — swap its leads.', 'warn'); }
  },
  update: (lab, dt, t) => {
    PH.update(dt, t);
    updateFlow(lab, dt);
  },
  chips: (lab) => {
    const w = wiring(lab);
    return [
      [`Key K: ${lab.x.keyIn ? 'in' : 'out'}`, lab.x.keyIn ? 'ok' : ''],
      [`Circuit: ${w.complete ? 'complete' : `${lab.leads.length} lead${lab.leads.length === 1 ? '' : 's'}`}`, w.complete ? 'ok' : ''],
      [`Rheostat: ${(lab.items.rh.app.f * 20).toFixed(1)} Ω`, ''],
    ];
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    $('oKey').textContent = x.keyIn ? 'Remove key K' : 'Insert key K';
    $('oKey').classList.toggle('on', x.keyIn);
    $('oRh').textContent = `${(lab.items.rh.app.f * 20).toFixed(1)} Ω`;
    $('oSlider').value = lab.items.rh.app.f;
    $('oI').textContent = `${lab.items.amm.app.reading().toFixed(2)} A`;
    $('oV').textContent = `${lab.items.volt.app.reading().toFixed(2)} V`;
    $('oT').textContent = `${x.T.toFixed(1)} °C`;
    $('oT').className = x.T > 32 ? 'warn' : '';
    $('oC').textContent = wiring(lab).complete ? 'as in the diagram' : 'incomplete';
    drawGraph(lab);
  },
  result: (lab) => {
    const rows = lab.rows;
    if (!rows.length) return { items: [['Mean R', '—'], ['Slope of V–I', '—'], ['Actual R', 'hidden']], note: 'Record at least five (V, I) pairs.' };
    const mean = rows.reduce((s, r) => s + r.R, 0) / rows.length;
    let slope = null;
    if (rows.length >= 2) {
      const mx = rows.reduce((s, r) => s + r.I, 0) / rows.length, my = rows.reduce((s, r) => s + r.V, 0) / rows.length;
      let num = 0, den = 0;
      rows.forEach((r) => { num += (r.I - mx) * (r.V - my); den += (r.I - mx) ** 2; });
      slope = den > 1e-9 ? num / den : null;
    }
    const reveal = rows.length >= 5;
    return {
      items: [['Mean R = V/I', `${mean.toFixed(2)} Ω`], ['Slope of V–I', slope ? `${slope.toFixed(2)} Ω` : '—'], ['Actual R (after 5)', reveal ? `${lab.R0.toFixed(2)} Ω` : 'hidden'], ['Error', reveal ? `${(((mean - lab.R0) / lab.R0) * 100).toFixed(2)} %` : '—']],
      note: rows.length >= 3 ? 'V/I is the same for every reading and the V–I graph is a straight line through the origin: Ohm’s law is verified.' : 'Take more readings to see the straight line.',
    };
  },
  obsRows: 5,
  obsKeys: ['V', 'I', 'R'],
  observation: (lab) => ({ rows: lab.rows.map((r) => ({ V: r.V.toFixed(2), I: r.I.toFixed(2), R: r.R.toFixed(2) })) }),
  checkFault: (lab) => {
    const f = lab.topology(), same = (a, b) => f(a) === f(b);
    if (same('battery.+', 'battery.-')) return 'That lead short-circuits the battery! Remove it at once.';
    if (same('amm.+', 'amm.-')) return 'The ammeter terminals are joined — it is bypassed.';
    if (same('coil.1', 'coil.2')) return 'Both ends of the coil are joined — it is shorted.';
    return null;
  },
};

// ---- helpers ----
function joined(lab, a, b) { const f = lab.topology(); return f(a) === f(b); }
function wiring(lab) {
  const f = lab.topology(), s = (a, b) => f(a) === f(b);
  const keyOther = s('battery.+', 'key.1') ? 'key.2' : s('battery.+', 'key.2') ? 'key.1' : null;
  const batKey = !!keyOther;
  const keyAmm = batKey && s(keyOther, 'amm.+');
  const rhEnd = s('amm.-', 'rh.A') ? 'rh.A' : s('amm.-', 'rh.B') ? 'rh.B' : null;
  const ammRh = !!rhEnd;
  const coilIn = s('rh.C', 'coil.1') ? 'coil.1' : s('rh.C', 'coil.2') ? 'coil.2' : null;
  const rhCoil = !!coilIn;
  const coilOut = coilIn === 'coil.1' ? 'coil.2' : 'coil.1';
  const coilBat = rhCoil && s(coilOut, 'battery.-');
  const voltOk = !!coilIn && s('volt.+', coilIn) && s('volt.-', coilOut);
  return { batKey, keyAmm, ammRh, rhCoil, coilBat, voltOk, complete: batKey && keyAmm && ammRh && rhCoil && coilBat && voltOk };
}
function solve(lab, R) {
  const rh = lab.items.rh.app;
  const el = [];
  const add = (e) => { el.push(e); return e; };
  const cell = add({ a: 'battery.+', b: 'battery.-', emf: EMF, r: R_INT });
  if (lab.x.keyIn && lab.items.key.app.plug.userData.t > 0.9) add({ a: 'key.1', b: 'key.2', R: 0.002 });
  const amm = add({ a: 'amm.+', b: 'amm.-', R: R_AMM });
  const volt = add({ a: 'volt.+', b: 'volt.-', R: R_VOLT });
  const rA = add({ a: 'rh.A', b: 'rh.C', R: rh.f * rh.Rmax + 0.02 });
  const rB = add({ a: 'rh.C', b: 'rh.B', R: (1 - rh.f) * rh.Rmax + 0.02 });
  const coil = add({ a: 'coil.1', b: 'coil.2', R });
  for (const L of lab.leads) L.el = add({ a: L.a, b: L.b, R: LEAD });
  const net = lab.P.solveNetwork(el, 'battery.-');
  lab.x.elems = { cell, amm, volt, rA, rB, coil };
  lab.x.net = net;
  return { I: net.current(amm), V: net.volt('volt.+') - net.volt('volt.-'), Icell: net.current(cell), Icoil: net.current(coil) };
}
async function pressKey(lab) {
  const p = lab.items.key.app.plug;
  await lab.touch(p, () => { lab.x.keyIn = !lab.x.keyIn; p.userData.inserted = lab.x.keyIn; lab.sfx('click'); }, { pose: 'pinch' });
}
async function slideTo(lab, f) {
  const rh = lab.items.rh.app;
  const R = lab.handR();
  await lab.touch(rh.knobWorld().add(V3(0, 0.8, 0)), null, { pose: 'pinch' });
  const f0 = rh.f;
  await lab.tween(0.5 + Math.abs(f - f0) * 1.2, (e) => { rh.set(f0 + (f - f0) * e); R.goal.copy(rh.knobWorld()).add(V3(0, 0.8, 0)); });
}
async function recordReading(lab) {
  const x = lab.x;
  if (!wiring(lab).complete) { lab.toast('Wire the circuit as in the diagram first.', 'err'); return; }
  if (!x.keyIn) { lab.toast('Insert the key — no current flows.', 'err'); return; }
  const amm = lab.items.amm.app, volt = lab.items.volt.app;
  if (Math.abs(amm.needle.v) > 0.05 || Math.abs(volt.needle.v) > 0.05) { lab.toast('Wait for the needles to settle before reading.', 'warn'); return; }
  const I = Math.round(amm.reading() / 0.01) * 0.01, V = Math.round(volt.reading() / 0.05) * 0.05;
  if (I < 0.02) { lab.toast('The current is too small to read — check the circuit.', 'err'); return; }
  if (lab.rows.some((r) => Math.abs(r.I - I) < 0.015)) { lab.toast('You already have this reading — move the rheostat slider for a new one.', 'warn'); return; }
  lab.addRow({ V, I, R: V / I });
  lab.toast(`Recorded V = ${V.toFixed(2)} V, I = ${I.toFixed(2)} A → R = ${(V / I).toFixed(2)} Ω`, 'ok');
  if (x.T > 32) lab.toast('The coil is warming up — its resistance rises. Take the key out between readings.', 'warn');
}
function drawGraph(lab) {
  const c = document.getElementById('viGraph');
  if (!c) return;
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  const x0 = 28, y0 = H - 18, w = W - 38, h = H - 28;
  g.strokeStyle = '#94a3b8'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0, 6); g.lineTo(x0, y0); g.lineTo(x0 + w, y0); g.stroke();
  g.fillStyle = '#94a3b8'; g.font = '10px sans-serif'; g.fillText('I (A)', x0 + w - 24, y0 + 13); g.fillText('V', 8, 14);
  const Imax = 1.4, Vmax = 7;
  for (let i = 0; i <= 7; i++) { const yy = y0 - (i / 7) * h; g.fillText(String(i), 16, yy + 3); }
  [0.5, 1].forEach((i) => g.fillText(String(i), x0 + (i / Imax) * w - 6, y0 + 13));
  const rows = lab.rows;
  g.fillStyle = '#fbbf24';
  rows.forEach((r) => { g.beginPath(); g.arc(x0 + (r.I / Imax) * w, y0 - (r.V / Vmax) * h, 3.2, 0, 7); g.fill(); });
  if (rows.length >= 2) {
    const k = rows.reduce((s, r) => s + r.V * r.I, 0) / rows.reduce((s, r) => s + r.I * r.I, 0);
    g.strokeStyle = '#34d399'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w, y0 - ((k * Imax) / Vmax) * h); g.stroke();
    g.fillStyle = '#34d399'; g.fillText(`slope R = ${k.toFixed(2)} Ω`, x0 + 6, 16);
  }
  // live point
  const I = lab.items.amm.app.reading(), V = lab.items.volt.app.reading();
  if (I > 0.01) { g.strokeStyle = '#67e8f9'; g.beginPath(); g.arc(x0 + (I / Imax) * w, y0 - (V / Vmax) * h, 4, 0, 7); g.stroke(); }
}

// Charge-flow dots along the leads, sized by current
let flowMesh = null;
function buildFlow(lab) {
  flowMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), 900);
  flowMesh.frustumCulled = false; flowMesh.userData.noPick = true;
  flowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  lab.scene.add(flowMesh);
}
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pp = new THREE.Vector3();
function updateFlow(lab, dt) {
  if (!flowMesh) return;
  let n = 0;
  const net = lab.x.net;
  if (lab.state.flow && net && lab.x.keyIn) {
    for (const L of lab.leads) {
      if (!L.curve || !L.el) continue;
      const I = net.current(L.el);
      if (Math.abs(I) < 1e-3) continue;
      L.phase = ((L.phase || 0) + (Math.sign(I) * (4 + 12 * Math.min(1, Math.abs(I))) * dt) / Math.max(1, L.curve.getLength()) + 1) % 1;
      const len = L.curve.getLength(), count = Math.max(2, Math.floor(len / 2.4));
      for (let i = 0; i < count && n < 900; i++) {
        L.curve.getPointAt((i / count + L.phase) % 1, pp);
        sc.setScalar(0.7 + Math.min(1, Math.abs(I)) * 0.6);
        m4.compose(pp, q, sc); flowMesh.setMatrixAt(n++, m4);
      }
    }
  }
  flowMesh.count = n;
  flowMesh.instanceMatrix.needsUpdate = true;
}
