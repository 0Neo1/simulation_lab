// Radius of curvature of a convex surface with a spherometer (pitch 1 mm,
// 100 disc divisions, least count 0.01 mm): readings on the convex surface
// and on a plane glass plate give the sagitta h; the leg spacing l comes from
// the marks the legs leave on paper. R = l²/(6h) + h/2.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SC = 1.6; // drawn 1.6× life size
const PLATE_AT = [-8, 6], CONVEX_H = 1.4;

function buildSpherometer(l) {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xc3cad1, metalness: 0.95, roughness: 0.25 });
  const r = (l / 10 / Math.sqrt(3)) * SC; // leg circle radius (cm, scaled)
  const frame = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * SC, 0.7 * SC, 0.6 * SC, 18), steel); hub.position.y = 2.2 * SC;
  frame.add(hub);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(r, 0.25 * SC, 0.4 * SC), steel); arm.position.set(Math.cos(a) * r / 2, 2.2 * SC, Math.sin(a) * r / 2); arm.rotation.y = -a;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * SC, 0.03 * SC, 2.2 * SC, 10), steel); leg.position.set(Math.cos(a) * r, 1.1 * SC, Math.sin(a) * r);
    frame.add(arm, leg);
  }
  // vertical pitch scale on a post beside the disc
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.4 * SC, 3.4 * SC, 0.12 * SC), steel); post.position.set(1.9 * SC, 3.7 * SC, 0.2);
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(0.36 * SC, 3 * SC), new THREE.MeshStandardMaterial({ map: PH.tex(64, 512, (c, w, h) => {
    c.fillStyle = '#e5e8eb'; c.fillRect(0, 0, w, h); c.fillStyle = '#111';
    for (let i = 0; i <= 15; i++) { const y = h - 16 - i * ((h - 32) / 15); c.fillRect(0, y - 1.5, i % 5 === 0 ? 40 : 24, 3); if (i % 5 === 0) { c.font = 'bold 20px Arial'; c.fillText(String(i), 42, y + 7); } }
  }), roughness: 0.4, metalness: 0.3 }));
  scale.position.set(1.9 * SC, 3.7 * SC, 0.2 + 0.07 * SC);
  frame.add(post, scale);
  g.add(frame);
  // central screw with the graduated disc; moves up/down as it turns
  const screw = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * SC, 0.16 * SC, 5 * SC, 12), steel); shaft.position.y = 2.5 * SC;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16 * SC, 0.3 * SC, 12), steel); tip.rotation.x = Math.PI; tip.position.y = -0.1 * SC;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.7 * SC, 1.7 * SC, 0.18 * SC, 64), [new THREE.MeshStandardMaterial({ map: PH.tex(2048, 64, (c, w, h) => {
    c.fillStyle = '#d9dde2'; c.fillRect(0, 0, w, h); c.fillStyle = '#111';
    for (let i = 0; i < 100; i++) { const x = (i / 100) * w; c.fillRect(x - 1.5, 0, 3, i % 10 === 0 ? 40 : i % 5 === 0 ? 30 : 20); if (i % 10 === 0) { c.font = 'bold 18px Arial'; c.fillText(String(i), x + 3, 60); } }
  }), metalness: 0.4, roughness: 0.35 }), steel, steel]);
  disc.position.y = 4.2 * SC;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * SC, 0.45 * SC, 0.6 * SC, 16), PH.PM.black); knob.position.y = 5.1 * SC;
  screw.add(shaft, tip, disc, knob);
  g.add(screw);
  const api = {
    group: g, screw, disc, knob, r, size: [2 * r + 0.5, 6 * SC, 2 * r + 0.5], grip: V3(0, 5.2 * SC, 0), pose: 'pinch',
    // reading in mm: vertical-scale value at the disc's upper edge; tip rises as the reading falls
    set(reading) {
      const dmm = reading - 10; // tip below the leg plane (mm)
      screw.position.y = -(dmm / 10) * SC;
      screw.rotation.y = -((reading % 1) + 1) % 1 * Math.PI * 2;
    },
    knobWorld() { g.updateMatrixWorld(true); return knob.getWorldPosition(V3()); },
    discWorld() { g.updateMatrixWorld(true); return disc.getWorldPosition(V3()); },
  };
  api.set(10);
  return api;
}
function buildPlate() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 16), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ee, roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1 })); p.position.y = 0.3;
  g.add(p);
  return { group: g, size: [16, 0.6, 16], grip: V3(7.5, 0.6, 0) };
}
function buildConvex(Rmm) {
  const g = new THREE.Group();
  const Rc = (Rmm / 10) * SC; // scaled radius
  const a = Math.asin(Math.min(0.98, 5.5 / Rc));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(Rc, 64, 16, 0, Math.PI * 2, 0, a), new THREE.MeshPhysicalMaterial({ color: 0xdff2fa, roughness: 0.03, transparent: true, opacity: 0.6, clearcoat: 1 }));
  const drop = Rc - Rc * Math.cos(a);
  cap.position.y = CONVEX_H - Rc + drop + drop * 0; // top of the dome at CONVEX_H + drop
  cap.position.y = -Rc + drop + 0.4;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.4, 48), cap.material); base.position.y = 0.2;
  g.add(cap, base);
  return { group: g, size: [11.2, drop + 0.6, 11.2], grip: V3(5.4, 0.3, 0), topY: drop + 0.4 };
}
function buildPaper() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.9 })); p.rotation.x = -Math.PI / 2; p.position.y = 0.03;
  g.add(p);
  const dots = [];
  for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), new THREE.MeshBasicMaterial({ color: 0x1e3a8a })); d.rotation.x = -Math.PI / 2; d.visible = false; g.add(d); dots.push(d); }
  return { group: g, dots, size: [14, 0.1, 10], grip: V3(6.5, 0.1, 0) };
}

export default {
  id: 'phy111',
  lab: 'Physics Lab',
  title: 'Radius of curvature with a spherometer',
  intro: 'Find the radius of curvature of a convex surface with a spherometer.',
  board: {
    title: 'Spherometer',
    formulas: ['L.C. = pitch / disc divisions = 1 mm / 100', 'h = reading(plane) − reading(convex)', 'R = l² / 6h + h / 2'],
    steps: ['Find pitch and least count', 'Place on convex surface; turn till tip just touches', 'Read vertical scale + disc division', 'Repeat on the plane glass plate', 'Press on paper: measure leg distances l'],
    note: 'Tip just touches when the spherometer starts to rock',
  },
  items: {
    plate: { name: 'Plane glass plate', label: 'Glass plate', build: () => buildPlate(), slot: [PLATE_AT[0], PLATE_AT[1], 0] },
    convex: { name: 'Convex surface (watch glass)', label: 'Convex surface', build: (lab) => { lab.Rmm = 150 + Math.random() * 150; return buildConvex(lab.Rmm); }, slot: [22, 4, 0] },
    sph: { name: 'Spherometer', label: 'Spherometer', build: (lab) => { lab.lmm = Math.round((38 + Math.random() * 6) * 10) / 10; return buildSpherometer(lab.lmm); }, slot: [-36, 16, 0] },
    paper: { name: 'Sheet of paper and scale', label: 'Paper', build: () => buildPaper(), slot: [48, 20, 0] },
  },
  setupOrder: ['plate', 'convex', 'sph', 'paper'],
  views: { disc: { label: 'Disc & scale', pos: (lab) => { const p = lab.items.sph.app.discWorld(); return [p.x + 4, p.y + 5, p.z + 12]; }, target: (lab) => { const p = lab.items.sph.app.discWorld(); return [p.x + 2, p.y, p.z]; } } },
  classicView: 'disc',
  pips: [
    { id: 'disc', title: 'Disc against the vertical scale', fov: 24, update: (cam, lab) => { const s = lab.items.sph.app, G = lab.items.sph.group; G.updateMatrixWorld(true); const p = G.localToWorld(V3(1.9 * SC, s.screw.position.y + 4.2 * SC, 0.3)); cam.position.set(p.x + 0.4, p.y + 1.4, p.z + 6); cam.lookAt(p.x - 0.6, p.y, p.z); }, show: (lab) => lab.items.sph.placed },
    { id: 'tip', title: 'Tip and surface', fov: 26, update: (cam, lab) => { const G = lab.items.sph.group; G.updateMatrixWorld(true); const p = G.localToWorld(V3(0, 0, 0)); cam.position.set(p.x + 6, p.y + 1.2, p.z + 6); cam.lookAt(p.x, p.y + 0.3, p.z); }, show: (lab) => lab.items.sph.placed },
  ],
  overlay: '<b>Spherometer</b><span class="big" id="sRead">—</span><div id="sParts"></div>',
  hintExtra: 'drag the <b>disc knob</b> to turn the screw',
  panel: [{
    title: 'Spherometer',
    html: `
      <div class="row"><button class="btn ghost act" id="sConvex">Reading on convex surface</button><button class="btn ghost act" id="sPlane">Reading on plane plate</button></div>
      <div class="row"><button class="btn ghost act" id="sL">Measure leg distance l</button></div>
      <div class="meters"><div class="m"><i>Pitch / L.C.</i><b>1 mm / 0.01 mm</b></div><div class="m"><i>l (mean)</i><b id="sLv">—</b></div><div class="m"><i>Convex reading</i><b id="sC">—</b></div><div class="m"><i>Plane reading</i><b id="sP">—</b></div></div>`,
    bind: (lab, root) => {
      root.querySelector('#sConvex').onclick = () => lab.act(() => readOn(lab, 'convex'));
      root.querySelector('#sPlane').onclick = () => lab.act(() => readOn(lab, 'plate'));
      root.querySelector('#sL').onclick = () => lab.act(() => measureL(lab));
    },
  }],
  table: {
    columns: [
      { key: 'c', label: 'Convex (mm)', fmt: (v) => v.toFixed(2) },
      { key: 'p', label: 'Plane (mm)', fmt: (v) => v.toFixed(2) },
      { key: 'h', label: 'h (mm)', fmt: (v) => v.toFixed(2) },
      { key: 'l', label: 'l (mm)', fmt: (v) => (v == null ? '—' : v.toFixed(1)) },
      { key: 'R', label: 'R (mm)', fmt: (v) => (v == null ? '—' : v.toFixed(1)) },
    ],
    note: 'Each row: one reading on the convex surface and one on the plane plate.',
  },
  steps: (lab) => [
    { phase: 'Least count', text: 'Turn the disc through one full rotation and see how far it moves along the vertical scale (the pitch). Least count = pitch / 100.', check: () => lab.x.lc, demo: async () => { await turnTo(lab, lab.x.reading + 1, 1.4); await turnTo(lab, lab.x.reading - 1, 1.0); lab.x.lc = true; lab.toast('One rotation moves the disc 1 mm: pitch 1 mm, 100 divisions, least count 0.01 mm.', 'info', 5500); } },
    { phase: 'Leg distance', text: 'Press the spherometer lightly on the paper and measure the distances between the three leg marks with the scale.', why: 'The mean distance between the legs is l.', check: () => lab.x.l != null, demo: () => measureL(lab) },
    ...[0, 1, 2].flatMap((k) => [
      { phase: `Reading ${k + 1}`, text: 'Place the spherometer on the convex surface and turn the screw until its tip just touches. Record the reading.', why: k === 0 ? 'When the tip touches, the spherometer starts to rock on the tip — stop turning at that moment.' : 'Turn the surface a little between readings.', check: () => lab.rows.length > k || (lab.x.pend.c != null && lab.rows.length === k), demo: () => readOn(lab, 'convex') },
      { phase: `Reading ${k + 1}`, text: 'Place it on the plane glass plate, turn until the tip just touches, and record the reading.', check: () => lab.rows.length > k, demo: () => readOn(lab, 'plate') },
    ]),
  ],
  state: () => ({ reading: 12, lc: false, l: null, pend: { c: null, p: null }, on: null }),
  init: (lab) => {
    const s = lab.items.sph.app;
    let r0 = 0;
    lab.actionable(s.screw, { tip: () => `Disc — drag sideways to turn the screw (reading ${lab.x.reading.toFixed(2)} mm)`, drag: { start: () => { r0 = lab.x.reading; }, move: (p, st) => { lab.x.reading = THREE.MathUtils.clamp(r0 + (p.x - st.x) * 0.25, contactReading(lab), 15); }, hand: () => s.knobWorld() }, enabled: () => lab.items.sph.placed });
  },
  update: (lab) => {
    const x = lab.x;
    if (x.reading == null) return;
    lab.items.sph.app.set(x.reading);
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const r = x.reading, main = Math.floor(r + 1e-9), div = Math.round((r - main) * 100);
    $('sRead').textContent = `${r.toFixed(2)} mm`;
    $('sParts').textContent = `scale ${main} mm + disc ${div} × 0.01 mm${x.on ? ` · on ${x.on === 'convex' ? 'convex surface' : 'plane plate'}` : ''}`;
    $('sLv').textContent = x.l ? `${x.l.toFixed(1)} mm` : '—';
    $('sC').textContent = x.pend.c != null ? `${x.pend.c.toFixed(2)} mm` : '—';
    $('sP').textContent = x.pend.p != null ? `${x.pend.p.toFixed(2)} mm` : '—';
  },
  chips: (lab) => [[`Least count: ${lab.x.lc ? '0.01 mm' : 'not found'}`, lab.x.lc ? 'ok' : ''], [`l: ${lab.x.l ? `${lab.x.l.toFixed(1)} mm` : 'not measured'}`, lab.x.l ? 'ok' : '']],
  result: (lab) => {
    const r = lab.rows.filter((q) => q.R != null);
    if (!r.length) return { items: [['Mean h', '—'], ['Mean R', '—'], ['Actual R', 'hidden']], note: 'Measure l, then take three pairs of readings.' };
    const h = r.reduce((s, q) => s + q.h, 0) / r.length, R = r.reduce((s, q) => s + q.R, 0) / r.length;
    const reveal = r.length >= 3;
    return { items: [['Mean h', `${h.toFixed(3)} mm`], ['Mean R', `${R.toFixed(1)} mm`], ['Actual R (after 3)', reveal ? `${lab.Rmm.toFixed(1)} mm` : 'hidden'], ['Error', reveal ? `${(((R - lab.Rmm) / lab.Rmm) * 100).toFixed(1)} %` : '—']], note: 'h is small, so a 0.01 mm error in h changes R noticeably — take readings carefully.' };
  },
  obsRows: 3,
  obsKeys: ['h', 'l', 'R'],
  observation: (lab) => ({ rows: lab.rows.map((q) => ({ h: q.h.toFixed(2), l: q.l != null ? q.l.toFixed(1) : '', R: q.R != null ? q.R.toFixed(1) : '' })) }),
};

// Reading at which the tip just touches the surface under it
function contactReading(lab) {
  const x = lab.x;
  if (x.on === 'convex') { const r = lab.lmm / Math.sqrt(3), R = lab.Rmm; return 10 - (R - Math.sqrt(R * R - r * r)); }
  if (x.on === 'plate') return 10;
  return 10 - 1.5; // in the air the screw can go lower than the legs
}
async function placeOn(lab, where) {
  const x = lab.x;
  if (x.on === where) return;
  await lab.pickUp('sph');
  // raise the screw clear before putting it down
  x.reading = Math.max(x.reading, 12);
  const it = lab.items[where];
  const top = where === 'convex' ? it.app.topY - (lab.lmm / Math.sqrt(3) / 10 * SC) ** 2 / (2 * lab.Rmm / 10 * SC) : 0.6;
  const p = it.group.position.clone().add(V3(0, top, 0));
  await lab.putDown('sph', p, { rot: 0 });
  x.on = where;
}
async function turnTo(lab, target, dur = 1.2) {
  const s = lab.items.sph.app, R = lab.handR();
  await lab.touch(s.knobWorld().add(V3(0, 0.8, 0)), null, { pose: 'pinch', lift: 0 });
  const r0 = lab.x.reading;
  await lab.tween(dur, (e) => { lab.x.reading = r0 + (target - r0) * e; R.goal.copy(s.knobWorld()).add(V3(0, 0.8, 0)); R.pitchGoal = -0.3 + Math.sin(e * 20) * 0.1; });
  lab.x.reading = target;
}
async function readOn(lab, where) {
  const x = lab.x;
  if (!lab.x.lc) { lab.toast('Find the least count first.', 'warn'); return; }
  await placeOn(lab, where);
  const touch = contactReading(lab) + (Math.random() - 0.5) * 0.012;
  await turnTo(lab, touch + 0.4, 0.8);
  await turnTo(lab, touch, 1.2);
  lab.sfx('tick');
  const main = Math.floor(touch + 1e-9), div = Math.round((touch - main) * 100);
  const reading = main + div * 0.01;
  if (where === 'convex') x.pend.c = reading; else x.pend.p = reading;
  lab.toast(`${where === 'convex' ? 'Convex surface' : 'Plane plate'}: scale ${main} mm + ${div} × 0.01 = ${reading.toFixed(2)} mm`, 'ok', 4500);
  if (x.pend.c != null && x.pend.p != null) {
    const h = x.pend.p - x.pend.c;
    const l = x.l;
    lab.addRow({ c: x.pend.c, p: x.pend.p, h, l, R: l ? (l * l) / (6 * h) + h / 2 : null });
    x.pend = { c: null, p: null };
  }
  await turnTo(lab, x.reading + 0.8, 0.4);
}
async function measureL(lab) {
  const x = lab.x;
  await placeOn(lab, 'paper');
  const paper = lab.items.paper.app, pg = lab.items.paper.group;
  const r = lab.items.sph.app.r;
  paper.dots.forEach((d, i) => { const a = (i / 3) * Math.PI * 2 + Math.PI / 2; const w = lab.items.sph.group.localToWorld(V3(Math.cos(a) * r, 0, Math.sin(a) * r)); d.position.copy(pg.worldToLocal(w)).setY(0.05); d.visible = true; });
  lab.sfx('tick');
  await lab.wait(0.4);
  const sides = [0, 1, 2].map(() => Math.round((lab.lmm + (Math.random() - 0.5) * 0.6) * 10) / 10);
  x.l = sides.reduce((s, v) => s + v, 0) / 3;
  lab.toast(`Leg distances: ${sides.map((v) => v.toFixed(1)).join(', ')} mm → l = ${x.l.toFixed(1)} mm`, 'ok', 5000);
  lab.rows.forEach((q) => { q.l = x.l; q.R = (x.l * x.l) / (6 * q.h) + q.h / 2; });
  lab.renderTable();
  await lab.pickUp('sph');
  await lab.putDown('sph', V3(lab.items.sph.slot[0], -3, lab.items.sph.slot[1]), { rot: 0, slot: true });
  x.on = null;
}
