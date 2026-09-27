// Diameter of a wire with a screw gauge (pitch 0.5 mm, 50 divisions, least
// count 0.01 mm), including the zero error. The gauge is the detailed model
// from the meter bridge lab, drawn at 1.6× life size so its scales are legible.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const GAUGE_AT = [-4, 8];
const PLACES = ['near one end', 'at the middle', 'near the other end', 'at the middle, turned 90°', 'near one end, turned 90°'];

function buildWire() {
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 16, 8), new THREE.MeshStandardMaterial({ color: 0xc27a4a, metalness: 1, roughness: 0.3 }));
  w.rotation.z = Math.PI / 2; w.position.y = 0.06;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.6), new THREE.MeshStandardMaterial({ map: PH.label('Wire specimen', { bg: '#f1ead8', fg: '#111', w: 256, h: 80, font: 'bold 32px Arial' }) }));
  card.rotation.x = -Math.PI / 2; card.position.set(0, 0.02, 2);
  g.add(w, card);
  return { group: g, size: [16, 0.2, 4], grip: V3(5, 0.1, 0), pose: 'pinch' };
}
function buildLens() {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 9, 12), PH.PM.darkWood); handle.rotation.z = Math.PI / 2; handle.position.set(-7, 0.6, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3, 0.3, 8, 28), PH.PM.black); rim.rotation.x = Math.PI / 2; rim.position.y = 0.6;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.3, 28), PH.PM.glassSolid); glass.position.y = 0.6;
  g.add(handle, rim, glass);
  return { group: g, size: [16, 1.2, 6.6], grip: V3(-8, 0.8, 0), pose: 'grab' };
}

export default {
  id: 'phy102',
  lab: 'Physics Lab',
  title: 'Diameter of a wire with a screw gauge',
  intro: 'Measure the diameter of a thin wire with a screw gauge, correcting for its zero error, and find its cross-sectional area.',
  board: {
    title: 'Screw gauge',
    formulas: ['L.C. = pitch / no. of circular divisions', '= 0.5 mm / 50 = 0.01 mm', 'Reading = MSR + CSD × L.C.', 'd = reading − zero error'],
    steps: ['Close the jaws with the ratchet; note zero error', 'Place the wire between anvil and spindle', 'Turn the ratchet till it clicks — never the thimble', 'Read MSR on the sleeve, CSD on the thimble', 'Measure at 5 places, in two directions'],
    note: 'Always turn by the ratchet!',
  },
  items: {
    gauge: { name: 'Screw gauge', label: 'Screw gauge', build: (lab) => lab.S.buildScrewGauge(lab.M), slot: [GAUGE_AT[0], GAUGE_AT[1], 0], setupText: 'Place the screw gauge on the bench in front of you.' },
    wire: { name: 'Wire specimen', label: 'Wire', build: () => buildWire(), slot: [-38, 12, 0] },
    lens: { name: 'Magnifying glass', label: 'Magnifier', build: () => buildLens(), slot: [30, 14, 0], why: 'A magnifier helps you see which circular-scale division lies on the reference line.' },
  },
  setupOrder: ['gauge', 'wire', 'lens'],
  views: {
    gauge: { label: 'Scale close-up', pos: (lab) => { const g = lab.items.gauge.app; const p = lab.items.gauge.group.localToWorld(V3(g.zeroX + 1.5, g.axisY + 5, 19)); return p.toArray(); }, target: (lab) => { const g = lab.items.gauge.app; return lab.items.gauge.group.localToWorld(V3(g.zeroX + 0.5, g.axisY, 0)).toArray(); } },
  },
  classicView: 'gauge',
  pips: [
    { id: 'scale', title: 'Sleeve & thimble scales', fov: 26, update: (cam, lab) => { const g = lab.items.gauge.app, G = lab.items.gauge.group; G.updateMatrixWorld(true); cam.position.copy(G.localToWorld(V3(g.zeroX + 2.2, g.axisY + 3.2, 9))); cam.lookAt(G.localToWorld(V3(g.zeroX + 1.6, g.axisY, 0))); }, show: (lab) => lab.items.gauge.placed },
    { id: 'jaws', title: 'Anvil and spindle', fov: 24, update: (cam, lab) => { const g = lab.items.gauge.app, G = lab.items.gauge.group; G.updateMatrixWorld(true); cam.position.copy(G.localToWorld(V3(-2.2, g.axisY + 1.5, 7))); cam.lookAt(G.localToWorld(V3(-2.2, g.axisY, 0))); }, show: (lab) => lab.items.gauge.placed },
  ],
  overlay: '<b>Screw gauge</b><span class="big" id="gRead">—</span><div id="gParts"></div>',
  hintExtra: 'click the <b>ratchet</b> to close on the wire · panel buttons for zero error and readings',
  panel: [{
    title: 'Screw gauge',
    html: `
      <div class="row"><button class="btn ghost act" id="gZero">Check zero error</button><button class="btn act" id="gRead2">Measure the wire</button></div>
      <div class="meters">
        <div class="m"><i>Pitch</i><b>0.5 mm</b></div><div class="m"><i>Least count</i><b>0.01 mm</b></div>
        <div class="m"><i>Zero error</i><b id="gZ">—</b></div><div class="m"><i>Mean corrected d</i><b id="gD">—</b></div>
      </div>`,
    bind: (lab, root) => {
      root.querySelector('#gZero').onclick = () => lab.act(() => zeroCheck(lab));
      root.querySelector('#gRead2').onclick = () => lab.act(() => measure(lab));
    },
  }],
  table: {
    columns: [
      { key: 'place', label: 'Place' },
      { key: 'msr', label: 'MSR (mm)', fmt: (v) => v.toFixed(1) },
      { key: 'csd', label: 'CSD' },
      { key: 'raw', label: 'Observed (mm)', fmt: (v) => v.toFixed(2) },
      { key: 'd', label: 'Corrected d (mm)', fmt: (v) => v.toFixed(2) },
    ],
    recordLabel: 'Take a reading',
    note: 'Corrected diameter = observed reading − zero error (with its sign).',
  },
  record: (lab) => lab.act(() => measure(lab)),
  steps: (lab) => [
    { phase: 'Zero error', text: 'With nothing between the jaws, turn the ratchet until the anvil and spindle just touch and it clicks. Note the zero error.', why: 'If the zero of the circular scale is below the reference line the zero error is positive; above it, negative.', check: () => lab.x.zero != null, demo: () => zeroCheck(lab) },
    ...PLACES.map((p, i) => ({ phase: 'Diameter', text: `Place the wire between the jaws ${p}, turn the ratchet until it clicks, and read the scales.`, why: i === 0 ? 'Measure at several places and in perpendicular directions: a wire is never perfectly round or uniform.' : '', check: () => lab.rows.length > i, demo: () => measure(lab) })),
  ],
  state: () => ({ d: 0.3 + Math.round(Math.random() * 30) / 100, zeroE: [-0.03, -0.02, 0.02, 0.03, 0.04][Math.floor(Math.random() * 5)], zero: null, now: 3, seed: Math.random() * 10 }),
  init: (lab) => {
    const g = lab.items.gauge.app;
    const ratchet = g.group.children.find((c) => c.isGroup && c.children.length >= 3);
    lab.actionable(ratchet || g.group, { tip: 'Ratchet — click to close the jaws (on the wire, if it is in place)', run: () => (lab.x.zero == null ? zeroCheck(lab) : measure(lab)), enabled: () => lab.items.gauge.placed });
  },
  reset: (lab) => { lab.items.gauge.app.setReading(3); lab.x.now = 3; },
  update: () => {},
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const mm = x.now;
    const msr = Math.floor(mm / 0.5 + 1e-9) * 0.5, csd = Math.round((mm - msr) / 0.01);
    $('gRead').textContent = `${mm.toFixed(2)} mm`;
    $('gParts').textContent = `MSR ${msr.toFixed(1)} mm + ${csd} × 0.01 mm`;
    $('gZ').textContent = x.zero == null ? '—' : `${x.zero >= 0 ? '+' : ''}${x.zero.toFixed(2)} mm`;
    const m = lab.rows.length ? lab.rows.reduce((s, r) => s + r.d, 0) / lab.rows.length : null;
    $('gD').textContent = m ? `${m.toFixed(3)} mm` : '—';
  },
  chips: (lab) => [[`Zero error: ${lab.x.zero == null ? 'not checked' : `${lab.x.zero.toFixed(2)} mm`}`, lab.x.zero == null ? '' : 'ok'], [`Readings: ${lab.rows.length} of 5`, '']],
  result: (lab) => {
    const r = lab.rows;
    if (!r.length) return { items: [['Mean d', '—'], ['Area', '—'], ['Actual d', 'hidden']], note: 'Check the zero error, then take five readings.' };
    const d = r.reduce((s, q) => s + q.d, 0) / r.length;
    const reveal = r.length >= 5;
    return { items: [['Mean d', `${d.toFixed(3)} mm`], ['Area πd²/4', `${((Math.PI * d * d) / 4).toFixed(4)} mm²`], ['Actual d (after 5)', reveal ? `${lab.x.d.toFixed(3)} mm` : 'hidden'], ['Error', reveal ? `${(((d - lab.x.d) / lab.x.d) * 100).toFixed(2)} %` : '—']], note: 'The zero error has been subtracted from every observed reading.' };
  },
  obsRows: 5,
  obsKeys: ['d'],
  observation: (lab) => ({ rows: lab.rows.map((r) => ({ d: r.d.toFixed(2) })) }),
};

async function turnTo(lab, mm, sample, dur = 1.3) {
  const g = lab.items.gauge.app, G = lab.items.gauge.group, x = lab.x;
  const R = lab.handR();
  const ratchetAt = (r) => G.localToWorld(V3(g.zeroX + 10 + r * 0.3, g.axisY + 1.2, 0.8));
  await lab.touch(ratchetAt(x.now), null, { pose: 'pinch', pitch: -0.15, lift: 0 });
  const start = x.now;
  await lab.tween(dur, (e) => {
    const r = start + (mm - start) * e;
    g.setReading(r, sample);
    x.now = r;
    R.goal.copy(ratchetAt(r)); R.pitchGoal = -0.15 + Math.sin(e * 24) * 0.08;
  });
  x.now = mm;
  for (let i = 0; i < 3; i++) { lab.sfx('tick'); await lab.wait(0.12); } // the ratchet clicks
}
async function zeroCheck(lab) {
  const x = lab.x;
  await turnTo(lab, 1.2, null, 0.6);
  await turnTo(lab, x.zeroE, null, 1.2);
  x.zero = x.zeroE;
  const csd = Math.round(Math.abs(x.zeroE) / 0.01);
  lab.toast(x.zeroE > 0 ? `Zero of the circular scale is ${csd} divisions below the reference line: zero error = +${x.zeroE.toFixed(2)} mm.` : `Zero of the circular scale is ${csd} divisions above the reference line: zero error = ${x.zeroE.toFixed(2)} mm.`, 'info', 6500);
  await turnTo(lab, 1.5, null, 0.5);
}
async function measure(lab) {
  const x = lab.x;
  if (x.zero == null) { lab.toast('Check the zero error first.', 'warn'); return; }
  if (lab.rows.length >= PLACES.length) { lab.toast('Five readings are enough.', 'info'); return; }
  const i = lab.rows.length;
  // open, put the wire in, close on it with the ratchet
  const g = lab.items.gauge.app, G = lab.items.gauge.group;
  if (x.now < x.d + 0.5) await turnTo(lab, x.d + 1, null, 0.5);
  const w = lab.items.wire;
  await lab.pickUp('wire');
  const jaw = G.localToWorld(V3(-2.4 * 1.6 + 0.9 * 1.6 + 0.05, g.axisY, 0));
  await lab.holdAt('wire', jaw.clone().add(V3(-5, -0.06, 0)), new THREE.Euler(0, Math.PI / 2, 0), { dur: 1.0 });
  const trueD = x.d * (1 + Math.sin(i * 2.1 + x.seed) * 0.022);
  w.group.visible = false;
  lab.releaseCarried('wire');
  const raw0 = trueD + x.zeroE + (Math.random() - 0.5) * 0.004;
  await turnTo(lab, raw0, trueD, 1.2);
  const msr = Math.floor(raw0 / 0.5 + 1e-9) * 0.5, csd = Math.round((raw0 - msr) / 0.01);
  const raw = msr + csd * 0.01;
  lab.addRow({ place: PLACES[i], msr, csd, raw, d: raw - x.zero });
  lab.toast(`MSR ${msr.toFixed(1)} mm + ${csd} × 0.01 = ${raw.toFixed(2)} mm → d = ${(raw - x.zero).toFixed(2)} mm`, 'ok', 5000);
  await turnTo(lab, raw0 + 0.6, null, 0.4);
  w.group.visible = true;
  lab.placeAtSlot('wire');
}
