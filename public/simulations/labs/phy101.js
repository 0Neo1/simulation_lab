// Dimensions of a rectangular block with vernier calipers (least count
// 0.01 cm): length, breadth and height, three times each, with zero error.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SC = 1.4; // drawn 1.4× life size so the scales are legible
const JAW0 = 1.2; // main-scale zero sits this far (life-size cm) to the right of the fixed jaw face

function mainScaleTex() {
  return PH.tex(4096, 128, (c, w, h) => {
    c.fillStyle = '#d8dde2'; c.fillRect(0, 0, w, h);
    const px = (w - 40) / 18; // 18 cm
    c.fillStyle = '#111'; c.strokeStyle = '#111';
    for (let i = 0; i <= 180; i++) {
      const x = 20 + (i / 10) * px;
      const L = i % 10 === 0 ? 70 : i % 5 === 0 ? 50 : 34;
      c.lineWidth = i % 10 === 0 ? 5 : 3;
      c.beginPath(); c.moveTo(x, h); c.lineTo(x, h - L); c.stroke();
      if (i % 10 === 0) { c.font = 'bold 44px Arial'; c.textAlign = 'center'; c.fillText(String(i / 10), x, 42); }
    }
    c.font = 'bold 30px Arial'; c.textAlign = 'left'; c.fillText('cm', w - 90, 42);
  });
}
function vernierTex() {
  return PH.tex(1024, 128, (c, w, h) => {
    c.fillStyle = '#e6e9ec'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#111'; c.strokeStyle = '#111';
    const px = w / 1.2; // plate covers 1.2 cm; 10 divisions over 0.9 cm, zero 40 px in
    for (let i = 0; i <= 10; i++) {
      const x = 40 + ((i * 0.09) * px);
      const L = i % 5 === 0 ? 70 : 46;
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, L); c.stroke();
      if (i % 5 === 0) { c.font = 'bold 36px Arial'; c.textAlign = 'center'; c.fillText(String(i), x, 112); }
    }
  });
}
function buildCalipers() {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9cfd5, metalness: 0.9, roughness: 0.28 });
  const beamLen = 18 * SC + 3;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(beamLen, 0.35, 1.8 * SC), steel); beam.position.set(beamLen / 2 - 1, 0.18, 0); beam.castShadow = true;
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(18 * SC * (4096 / (4096 - 40)), 0.9 * SC), new THREE.MeshStandardMaterial({ map: mainScaleTex(), roughness: 0.4, metalness: 0.3 }));
  scale.rotation.x = -Math.PI / 2; scale.position.set(JAW0 * SC + (9 * SC) * (4096 / (4096 - 40)) - (20 / 4096) * 18 * SC * (4096 / (4096 - 40)), 0.37, -0.35 * SC);
  const fixedJaw = new THREE.Mesh(new THREE.BoxGeometry(1.0 * SC, 0.35, 4.2 * SC), steel); fixedJaw.position.set(-0.5 * SC, 0.18, -2.6 * SC); fixedJaw.castShadow = true;
  g.add(beam, scale, fixedJaw);
  const slider = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2 * SC, 0.6, 2.4 * SC), steel); frame.position.set(1.4 * SC, 0.3, 0.1);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.0 * SC, 0.35, 4.2 * SC), steel); jaw.position.set(0.5 * SC, 0.18, -2.6 * SC); jaw.castShadow = true;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.2 * SC, 0.7 * SC), new THREE.MeshStandardMaterial({ map: vernierTex(), roughness: 0.4, metalness: 0.2 }));
  plate.rotation.x = -Math.PI / 2; plate.position.set(0, 0.62, 0.35 * SC); // positioned so its zero line is at slider x = vernier zero
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * SC, 0.4 * SC, 0.4, 14), steel); thumb.position.set(2.6 * SC, 0.7, 1.4 * SC);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * SC, 0.28 * SC, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0x8b8f93, metalness: 0.9 })); screw.position.set(1.4 * SC, 0.9, -0.2);
  slider.add(frame, jaw, plate, thumb, screw);
  g.add(slider);
  const api = {
    group: g, slider, plate, thumb, size: [beamLen, 1, 7 * SC], grip: V3(10, 0.4, 0.6), pose: 'grab',
    // gap: jaw separation (life-size cm); zero: zero error (cm) of the vernier
    set(gap, zero) {
      slider.position.x = gap * SC;
      // vernier zero line = JAW0 + gap + zero on the main scale; plate texture zero at u = 40/1024
      plate.position.x = (JAW0 + zero) * SC + (0.6 - (40 / 1024) * 1.2) * SC;
    },
    jawWorld() { g.updateMatrixWorld(true); return g.localToWorld(V3(slider.position.x, 0.4, -3.6 * SC)); },
    thumbWorld() { g.updateMatrixWorld(true); return thumb.getWorldPosition(V3()); },
    vernierWorld() { g.updateMatrixWorld(true); return plate.getWorldPosition(V3()); },
  };
  api.set(4, 0);
  return api;
}
function buildBlock(dims) {
  const g = new THREE.Group();
  const [l, b, h] = dims;
  const m = new THREE.Mesh(new THREE.BoxGeometry(l * SC, h * SC, b * SC), new THREE.MeshStandardMaterial({ map: PH.PM.wood.map, roughness: 0.6 }));
  m.position.y = (h * SC) / 2; m.castShadow = true;
  g.add(m);
  return { group: g, mesh: m, size: [l * SC, h * SC, b * SC], grip: V3(0, h * SC, 0), pose: 'grab' };
}

const DIMS = ['l', 'b', 'h'];
const NAMES = { l: 'length', b: 'breadth', h: 'height' };

export default {
  id: 'phy101',
  lab: 'Physics Lab',
  title: 'Dimensions of a block with vernier calipers',
  intro: 'Measure the length, breadth and height of a rectangular block with vernier calipers and find its volume and surface area.',
  board: {
    title: 'Vernier calipers',
    formulas: ['L.C. = 1 MSD − 1 VSD = 1 mm − 0.9 mm', '= 0.1 mm = 0.01 cm', 'Reading = MSR + VSD × L.C.', 'V = l × b × h'],
    steps: ['Close the jaws: find the zero error', 'Hold the block between the jaws, gently', 'Main-scale reading just before vernier zero', 'Vernier division that coincides', 'Repeat 3 times for l, b and h'],
    note: 'Correct every reading for zero error',
  },
  items: {
    cal: { name: 'Vernier calipers', label: 'Vernier calipers', build: () => buildCalipers(), slot: [-10, 18, 0] },
    block: { name: 'Wooden block', label: 'Block', build: (lab) => { lab.dims = [4.6 + Math.random() * 1.2, 2.7 + Math.random() * 0.8, 1.7 + Math.random() * 0.6].map((v) => Math.round(v * 100) / 100); return buildBlock(lab.dims); }, slot: [34, 14, 0] },
  },
  setupOrder: ['cal', 'block'],
  views: { vernier: { label: 'Vernier scale', pos: (lab) => { const p = lab.items.cal.app.vernierWorld(); return [p.x, p.y + 18, p.z + 16]; }, target: (lab) => { const p = lab.items.cal.app.vernierWorld(); return [p.x, p.y, p.z - 0.5]; } } },
  classicView: 'vernier',
  pips: [
    { id: 'vernier', title: 'Main scale and vernier', fov: 24, update: (cam, lab) => { const p = lab.items.cal.app.vernierWorld(); cam.position.set(p.x + 0.4, p.y + 7, p.z + 2.4); cam.lookAt(p.x + 0.4, p.y, p.z - 0.6); }, show: (lab) => lab.items.cal.placed },
    { id: 'jaws', title: 'Jaws', fov: 34, update: (cam, lab) => { const c = lab.items.cal; c.group.updateMatrixWorld(true); const p = c.group.localToWorld(V3(lab.x.gap * SC / 2, 0.5, -3 * SC)); cam.position.set(p.x, p.y + 12, p.z + 10); cam.lookAt(p); }, show: (lab) => lab.items.cal.placed },
  ],
  overlay: '<b>Vernier calipers</b><span class="big" id="vRead">—</span><div id="vParts"></div>',
  hintExtra: 'drag the <b>thumb wheel</b> to slide the jaw · panel buttons to measure',
  panel: [{
    title: 'Vernier calipers',
    html: `
      <div class="row"><button class="btn ghost act" id="vZero">Check zero error</button></div>
      <div class="row small">Measure: <button class="mini act" data-d="l">Length</button><button class="mini act" data-d="b">Breadth</button><button class="mini act" data-d="h">Height</button></div>
      <div class="meters"><div class="m"><i>Least count</i><b>0.01 cm</b></div><div class="m"><i>Zero error</i><b id="vZ">—</b></div><div class="m"><i>Volume</i><b id="vV">—</b></div><div class="m"><i>Surface area</i><b id="vA">—</b></div></div>`,
    bind: (lab, root) => {
      root.querySelector('#vZero').onclick = () => lab.act(() => zeroCheck(lab));
      root.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => lab.act(() => measure(lab, b.dataset.d)); });
    },
  }],
  table: {
    columns: [
      { key: 'l', label: 'Length l (cm)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) },
      { key: 'b', label: 'Breadth b (cm)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) },
      { key: 'h', label: 'Height h (cm)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) },
    ],
    note: 'Each row is one set of corrected readings of l, b and h.',
  },
  steps: (lab) => [
    { phase: 'Zero error', text: 'Close the jaws gently and check whether the vernier zero coincides with the main-scale zero. Note the zero error.', why: 'If the vernier zero is to the right of the main-scale zero the error is positive.', check: () => lab.x.zero != null, demo: () => zeroCheck(lab) },
    ...[0, 1, 2].flatMap((k) => DIMS.map((d) => ({
      phase: `Set ${k + 1}`,
      text: `Hold the block between the jaws to measure its ${NAMES[d]} and read the calipers.`,
      why: k === 0 && d === 'l' ? 'Close the jaws gently — pressing hard tilts the jaw and gives a smaller reading.' : '',
      check: () => (lab.rows[k] && lab.rows[k][d] != null),
      demo: () => measure(lab, d),
    }))),
  ],
  state: () => ({ gap: 4, zero: null, zeroE: [-0.03, -0.02, 0.01, 0.02, 0.03, 0][Math.floor(Math.random() * 6)] }),
  init: (lab) => {
    const c = lab.items.cal.app;
    let g0 = 0;
    lab.actionable(c.slider, {
      tip: () => `Sliding jaw — drag to open or close (gap ${lab.x.gap.toFixed(2)} cm)`,
      drag: { start: () => { g0 = lab.x.gap; }, move: (p, s) => { lab.x.gap = THREE.MathUtils.clamp(g0 + (p.x - s.x) / SC, 0, 15); }, hand: () => c.thumbWorld() },
      enabled: () => lab.items.cal.placed,
    });
  },
  update: (lab) => {
    const x = lab.x;
    if (x.gap == null) return;
    lab.items.cal.app.set(x.gap, x.zeroE);
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const R = x.gap + x.zeroE;
    const msr = Math.floor(R * 10 + 1e-6) / 10, vsd = Math.round((R - msr) / 0.01);
    $('vRead').textContent = `${(msr + vsd * 0.01).toFixed(2)} cm`;
    $('vParts').textContent = `MSR ${msr.toFixed(1)} cm + ${vsd} × 0.01 cm`;
    $('vZ').textContent = x.zero == null ? '—' : `${x.zero >= 0 ? '+' : ''}${x.zero.toFixed(2)} cm`;
    const r = done(lab);
    if (r) { $('vV').textContent = `${(r.l * r.b * r.h).toFixed(2)} cm³`; $('vA').textContent = `${(2 * (r.l * r.b + r.b * r.h + r.h * r.l)).toFixed(2)} cm²`; }
  },
  chips: (lab) => [[`Zero error: ${lab.x.zero == null ? 'not checked' : `${lab.x.zero.toFixed(2)} cm`}`, lab.x.zero == null ? '' : 'ok'], [`Gap: ${lab.x.gap.toFixed(2)} cm`, '']],
  result: (lab) => {
    const r = done(lab);
    if (!r) return { items: [['Mean l, b, h', '—'], ['Volume', '—'], ['Surface area', '—']], note: 'Measure l, b and h three times each.' };
    const reveal = lab.rows.length >= 3 && lab.rows.every((q) => DIMS.every((d) => q[d] != null));
    const [L, B, H] = lab.dims;
    return { items: [['Mean l × b × h', `${r.l.toFixed(2)} × ${r.b.toFixed(2)} × ${r.h.toFixed(2)} cm`], ['Volume V', `${(r.l * r.b * r.h).toFixed(2)} cm³`], ['Surface area A', `${(2 * (r.l * r.b + r.b * r.h + r.h * r.l)).toFixed(2)} cm²`], ['Actual V', reveal ? `${(L * B * H).toFixed(2)} cm³` : 'hidden']], note: 'Readings are corrected for the zero error of the calipers.' };
  },
  obsRows: 3,
  obsKeys: ['l', 'b', 'h'],
  observation: (lab) => ({ rows: lab.rows.map((q) => ({ l: q.l != null ? q.l.toFixed(2) : '', b: q.b != null ? q.b.toFixed(2) : '', h: q.h != null ? q.h.toFixed(2) : '' })) }),
};

function done(lab) {
  const mean = (d) => { const v = lab.rows.map((q) => q[d]).filter((q) => q != null); return v.length ? v.reduce((s, q) => s + q, 0) / v.length : null; };
  const r = { l: mean('l'), b: mean('b'), h: mean('h') };
  return r.l && r.b && r.h ? r : null;
}
async function slideTo(lab, gap, dur = 0.9) {
  const c = lab.items.cal.app, R = lab.handR();
  await lab.touch(c.thumbWorld().add(V3(0, 0.6, 0)), null, { pose: 'pinch', lift: 0 });
  const g0 = lab.x.gap;
  await lab.tween(dur, (e) => { lab.x.gap = g0 + (gap - g0) * e; c.set(lab.x.gap, lab.x.zeroE); R.goal.copy(c.thumbWorld()).add(V3(0, 0.6, 0)); });
  lab.x.gap = gap;
}
async function zeroCheck(lab) {
  await slideTo(lab, 0, 1.0);
  lab.x.zero = lab.x.zeroE;
  const z = lab.x.zeroE;
  lab.toast(z === 0 ? 'With the jaws closed the vernier zero coincides with the main-scale zero: no zero error.' : `With the jaws closed the vernier zero is ${Math.round(Math.abs(z) / 0.01)} divisions to the ${z > 0 ? 'right' : 'left'}: zero error = ${z > 0 ? '+' : ''}${z.toFixed(2)} cm.`, 'info', 6000);
  await slideTo(lab, 3, 0.5);
}
async function measure(lab, d) {
  const x = lab.x;
  if (x.zero == null) { lab.toast('Check the zero error first.', 'warn'); return; }
  let k = lab.rows.findIndex((q) => q[d] == null);
  if (k < 0) { if (lab.rows.length >= 3) { lab.toast(`Three readings of the ${NAMES[d]} are enough.`, 'info'); return; } lab.rows.push({ l: null, b: null, h: null }); k = lab.rows.length - 1; }
  const idx = DIMS.indexOf(d);
  const true_ = lab.dims[idx] + (Math.random() - 0.5) * 0.02; // the block is not perfectly square
  await slideTo(lab, true_ + 1.2, 0.5);
  // bring the block into the jaws, turned so the chosen dimension lies along the scale
  const c = lab.items.cal, blk = lab.items.block;
  await lab.pickUp('block');
  c.group.updateMatrixWorld(true);
  const centre = c.group.localToWorld(V3((true_ / 2) * SC, 0, -3.1 * SC));
  const e = d === 'l' ? new THREE.Euler(0, 0, 0) : d === 'b' ? new THREE.Euler(0, Math.PI / 2, 0) : new THREE.Euler(0, 0, Math.PI / 2);
  const [L, , H] = lab.dims;
  const at = d === 'h' ? V3(centre.x + (H * SC) / 2, -3 + (L * SC) / 2, centre.z) : centre.clone().setY(-3);
  await lab.holdAt('block', at, e, { dur: 1.0 });
  lab.releaseCarried('block'); // the block rests between the jaws while the jaw is closed
  await slideTo(lab, true_, 0.9);
  const R = x.gap + x.zeroE;
  const msr = Math.floor(R * 10 + 1e-6) / 10, vsd = Math.round((R - msr) / 0.01);
  const reading = msr + vsd * 0.01;
  lab.rows[k][d] = reading - x.zero;
  lab.renderTable();
  lab.sfx('ok');
  lab.toast(`${NAMES[d][0].toUpperCase() + NAMES[d].slice(1)}: MSR ${msr.toFixed(1)} + ${vsd} × 0.01 = ${reading.toFixed(2)} cm → corrected ${(reading - x.zero).toFixed(2)} cm`, 'ok', 5000);
  await slideTo(lab, true_ + 1.0, 0.4);
  await lab.pickUp('block');
  await lab.putDown('block', V3(blk.slot[0], -3, blk.slot[1]), { rot: 0, slot: true });
}
