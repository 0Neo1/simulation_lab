// Paper chromatography of black ink: a spot on a pencil line, the paper hung
// in a jar of solvent, and the solvent front rising by capillary action
// (h² ∝ t). Each dye travels a fixed fraction of the solvent's distance: Rf.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PW = 3, PL = 14, LINE = 2, JAR = [0, -10], JAR_H = 18, SOLV = 1.0;
const DYES = [
  { key: 'y', name: 'Yellow', rf: 0.8 + Math.random() * 0.04, col: '#e8c21a' },
  { key: 'r', name: 'Red', rf: 0.58 + Math.random() * 0.04, col: '#d4285a' },
  { key: 'b', name: 'Blue', rf: 0.37 + Math.random() * 0.04, col: '#2750c8' },
  { key: 'v', name: 'Violet', rf: 0.16 + Math.random() * 0.04, col: '#6d28d9' },
];

function buildPaper() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 600;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, side: THREE.DoubleSide }));
  m.position.y = PL / 2; // local origin at the bottom edge
  g.add(m);
  return { group: g, canvas: c, texture: t, mesh: m, size: [PW, 0.1, PL], grip: V3(0, PL - 0.8, 0), pose: 'pinch' };
}
function drawPaper(lab) {
  const p = lab.items.paper.app, x = lab.x;
  const c = p.canvas.getContext("2d"), W = p.canvas.width, H = p.canvas.height, px = H / PL;
  c.filter = 'none';
  c.fillStyle = '#fbfbf7'; c.fillRect(0, 0, W, H);
  const y = (cm) => H - cm * px;
  if (x.front > 0) { c.fillStyle = 'rgba(180,200,215,0.35)'; c.fillRect(0, y(LINE + x.front + 0.02 * (x.wetBottom ? 1 : 0)), W, H); }
  if (x.frontMarked != null) { c.strokeStyle = '#333'; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(4, y(LINE + x.frontMarked)); c.lineTo(W - 4, y(LINE + x.frontMarked)); c.stroke(); c.setLineDash([]); }
  if (x.line) { c.strokeStyle = '#555'; c.lineWidth = 2; c.beginPath(); c.moveTo(6, y(LINE)); c.lineTo(W - 6, y(LINE)); c.stroke(); }
  if (x.spot > 0) {
    if (x.front <= 0.05) { c.fillStyle = `rgba(25,25,35,${Math.min(0.95, 0.35 + x.spot * 0.2)})`; c.beginPath(); c.ellipse(W / 2, y(LINE), 14 + x.spot * 3, 10 + x.spot * 2, 0, 0, 7); c.fill(); }
    else {
      DYES.forEach((d) => {
        const h = d.rf * x.front, spread = 9 + h * 2.4;
        c.filter = `blur(${(1 + h * 0.5).toFixed(1)}px)`;
        c.fillStyle = d.col; c.globalAlpha = Math.min(0.9, 0.35 + x.spot * 0.18);
        c.beginPath(); c.ellipse(W / 2, y(LINE + h), 30 + h * 1.5, spread, 0, 0, 7); c.fill();
        c.globalAlpha = 1; c.filter = 'none';
      });
    }
  }
  p.texture.needsUpdate = true;
}
function buildCapillary() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 8, 6), C.MAT.glassRim); m.rotation.z = Math.PI / 2; m.position.y = 0.1;
  g.add(m);
  return { group: g, size: [8, 0.2, 0.2], grip: V3(2.5, 0.2, 0), pose: 'pinch', tipLocal: V3(-4, 0.1, 0) };
}
function buildPencil() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 15, 6), new THREE.MeshStandardMaterial({ color: 0xf2c418, roughness: 0.6 })); b.rotation.z = Math.PI / 2; b.position.y = 0.35;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 6), new THREE.MeshStandardMaterial({ color: 0xe8c7a0 })); tip.rotation.z = Math.PI / 2; tip.position.set(-8.2, 0.35, 0);
  g.add(b, tip);
  return { group: g, size: [16, 0.7, 0.7], grip: V3(2, 0.7, 0), pose: 'pinch', tipLocal: V3(-8.9, 0.35, 0) };
}
function buildRule() {
  const g = new THREE.Group();
  const r = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 3), [PH.PM.wood, PH.PM.wood, new THREE.MeshStandardMaterial({ map: PH.scaleTexture(30, { vertical: false }), roughness: 0.6 }), PH.PM.wood, PH.PM.wood, PH.PM.wood]);
  r.position.y = 0.15; g.add(r);
  return { group: g, size: [30, 0.3, 3], grip: V3(8, 0.3, 0), pose: 'grab' };
}

export default {
  id: 'che112',
  lab: 'Chemistry Lab',
  title: 'Paper chromatography of ink',
  intro: 'Separate the coloured components of black ink by paper chromatography and find the Rf value of each.',
  poster: 'chemsafety',
  board: {
    title: 'Paper chromatography',
    formulas: ['Rf = distance moved by the component / distance moved by the solvent'],
    steps: ['Pencil line 2 cm from the bottom (not ink!)', 'Small concentrated spot of ink on the line', 'Hang the paper so the spot is above the solvent', 'Cover the jar; let the solvent rise', 'Mark the solvent front; measure; find Rf'],
    note: 'Do not disturb the jar while the chromatogram develops',
  },
  items: {
    jar: { name: 'Chromatography jar with lid', label: 'Chromatography jar', build: () => { const j = C.jar(4.2, JAR_H, true); return Object.assign(j.app, { v: j, lid: j.lid }); }, slot: [JAR[0], JAR[1], 0] },
    solvent: { name: 'Solvent (water–alcohol)', label: 'Solvent', build: () => { const b = C.reagentBottle('Solvent', 'water : alcohol', { labelColor: '#0369a1', liquid: 80, liquidColor: 0xf1f5f9, opacity: 0.2, capacity: 100 }); return Object.assign(b.app, { v: b, stopper: b.stopper }); }, slot: [-34, -18, 0] },
    paper: { name: 'Strip of chromatography paper', label: 'Chromatography paper', build: () => buildPaper(), slot: [-20, 16, 0], restRot: [-Math.PI / 2, 0, 0], restLift: 0.05 },
    ink: { name: 'Black ink', label: 'Black ink', build: () => { const d = C.dropperBottle('Black ink', { liquidColor: 0x111118, opacity: 0.95, labelColor: '#111827' }); return Object.assign(d.app, { v: d, dropper: d.dropper, dropColor: d.dropColor }); }, slot: [30, -16, 0] },
    cap: { name: 'Fine capillary tube', label: 'Capillary', build: () => buildCapillary(), slot: [30, 8, 0] },
    pencil: { name: 'Pencil', label: 'Pencil', build: () => buildPencil(), slot: [4, 24, 0] },
    rule: { name: '30 cm scale', label: 'Scale', build: () => buildRule(), slot: [44, 26, 0] },
  },
  setupOrder: ['jar', 'solvent', 'paper', 'ink', 'cap', 'pencil', 'rule'],
  views: { jar: { label: 'Jar', pos: [JAR[0] + 10, 18, JAR[1] + 34], target: [JAR[0], 6, JAR[1]] } },
  classicView: 'jar',
  pips: [{ id: 'paper', title: 'The chromatogram', fov: 32, update: (cam, lab) => { const g = lab.items.paper.group; g.updateMatrixWorld(true); const p = g.localToWorld(V3(0, PL / 2, 0)); const n = V3(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion())); cam.position.copy(p).addScaledVector(n, 12); cam.up.set(0, 1, 0); if (Math.abs(n.y) > 0.9) cam.up.set(0, 0, -1); cam.lookAt(p); }, show: (lab) => lab.items.paper.placed || lab.x.hung }],
  overlay: '<b>Chromatogram</b><span class="big" id="cF">front: —</span><div id="cS"></div>',
  hintExtra: 'panel buttons carry out each stage',
  panel: [{
    title: 'Chromatography',
    html: `
      <div class="row"><button class="btn ghost act" id="cLine">Draw pencil line</button><button class="btn ghost act" id="cSpot">Spot the ink</button></div>
      <div class="row"><button class="btn ghost act" id="cSolv">Solvent into jar</button><button class="btn act" id="cHang">Hang paper in jar</button></div>
      <div class="row"><button class="btn ghost act" id="cOut">Remove and mark front</button><button class="btn ghost act" id="cMeasure">Measure the spots</button></div>
      <div class="meters"><div class="m"><i>Solvent front</i><b id="cFr">—</b></div><div class="m"><i>Stage</i><b id="cSt">—</b></div></div>`,
    bind: (lab, root) => {
      const on = (id, f) => { root.querySelector(`#${id}`).onclick = () => lab.act(() => f(lab)); };
      on('cLine', drawLine); on('cSpot', spotInk); on('cSolv', addSolvent); on('cHang', hang); on('cOut', removePaper); on('cMeasure', measure);
    },
  }],
  table: { columns: [{ key: 'component', label: 'Component' }, { key: 'd_c', label: 'd component (cm)', fmt: (v) => v.toFixed(1) }, { key: 'd_s', label: 'd solvent (cm)', fmt: (v) => v.toFixed(1) }, { key: 'Rf', label: 'Rf', fmt: (v) => v.toFixed(2) }], note: 'Distances are measured from the pencil line to the centre of each spot.' },
  steps: (lab) => [
    { phase: 'Prepare the paper', text: 'Draw a light pencil line 2 cm from the bottom of the paper strip.', why: 'Pencil (graphite) does not dissolve in the solvent; an ink line would run.', check: () => lab.x.line, demo: () => drawLine(lab) },
    { phase: 'Prepare the paper', text: 'With a fine capillary put a small spot of ink on the line; let it dry and spot again 2–3 times.', why: 'A small, concentrated spot gives sharp, well-separated bands.', check: () => lab.x.spot >= 3, demo: () => spotInk(lab) },
    { phase: 'Develop', text: 'Pour solvent into the jar to a depth of about 1 cm.', why: 'The solvent level must be below the spot, or the ink would dissolve into the solvent.', check: () => lab.x.solvent, demo: () => addSolvent(lab) },
    { phase: 'Develop', text: 'Hang the paper in the jar with its lower edge in the solvent and cover the jar.', why: 'The lid keeps the air saturated with solvent vapour so it does not evaporate off the paper.', check: () => lab.x.hung || lab.x.frontMarked != null, demo: () => hang(lab) },
    { phase: 'Develop', text: 'Leave the jar undisturbed while the solvent rises and the ink separates. Take the paper out when the front is near the top and mark it.', check: () => lab.x.frontMarked != null, demo: async () => { await lab.waitFor(() => lab.x.front >= 8.5, 400); await removePaper(lab); } },
    { phase: 'Measure', text: 'Measure the distance of each coloured spot and of the solvent front from the pencil line, and work out the Rf values.', check: () => lab.rows.length >= DYES.length, demo: () => measure(lab) },
  ],
  state: () => ({ line: false, spot: 0, solvent: false, hung: false, front: 0, frontMarked: null, t: 0 }),
  init: (lab) => { drawPaper(lab); },
  reset: (lab) => { lab.items.jar.app.v.setLiquid(0); lab.items.jar.app.lid.visible = true; lab.items.solvent.app.v.setLiquid(80); drawPaper(lab); },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.front == null) return;
    if (x.hung && x.frontMarked == null) { x.t += dt; x.front = Math.min(PL - LINE - 1, Math.sqrt((64 / 80) * x.t)); }
  },
  update: (lab) => {
    const x = lab.x;
    if (x.front == null) return;
    const key = `${x.line}|${x.spot}|${x.front.toFixed(2)}|${x.frontMarked}`;
    if (key !== x.drawn) { x.drawn = key; drawPaper(lab); }
  },
  chips: (lab) => [[`Solvent front: ${lab.x.front.toFixed(1)} cm`, lab.x.hung ? 'hot' : ''], [lab.x.hung ? 'Developing…' : lab.x.frontMarked != null ? 'Developed' : 'Not started', lab.x.frontMarked != null ? 'ok' : '']],
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    $('cF').textContent = `front: ${x.front.toFixed(1)} cm`;
    $('cS').textContent = x.front > 0.5 ? DYES.map((d) => `${d.name} ${(d.rf * x.front).toFixed(1)}`).join(' · ') : 'Spots not yet separated';
    $('cFr').textContent = `${x.front.toFixed(1)} cm`;
    $('cSt').textContent = !x.line ? 'paper not marked' : x.spot < 3 ? 'spotting' : !x.hung && x.frontMarked == null ? 'ready to develop' : x.hung ? 'developing' : 'developed';
  },
  result: (lab) => ({ items: lab.rows.length ? lab.rows.map((r) => [`Rf ${r.component}`, r.Rf.toFixed(2)]) : [['Rf values', '—']], note: 'The component most soluble in the solvent (least held by the paper) travels farthest and has the largest Rf.' }),
  obsRows: 4,
  obsKeys: ['component', 'd_c', 'd_s', 'Rf'],
  observation: (lab) => ({ rows: lab.rows.map((r) => ({ component: r.component, d_c: r.d_c.toFixed(1), d_s: r.d_s.toFixed(1), Rf: r.Rf.toFixed(2) })) }),
};

// ---------------------------------------------------------------------------

const paperPoint = (lab, cmUp) => lab.items.paper.group.localToWorld(V3(0, cmUp, 0));
async function drawLine(lab) {
  const R = lab.handR();
  await lab.touch(lab.items.pencil.group.localToWorld(V3(2, 0.7, 0)), null, { pose: 'pinch' });
  const a = lab.items.paper.group.localToWorld(V3(-PW / 2 + 0.2, LINE, 0.1)), b = lab.items.paper.group.localToWorld(V3(PW / 2 - 0.2, LINE, 0.1));
  await lab.handTo(R, a.clone().add(V3(0, 1, 0)), { pose: 'pinch', contact: 'pinch', dur: 0.8 });
  await lab.tween(0.9, (e) => { R.goal.lerpVectors(a, b, e).add(V3(0, 1, 0)); });
  lab.x.line = true;
}
async function spotInk(lab) {
  if (!lab.x.line) await drawLine(lab);
  const R = lab.handR();
  for (let i = 0; lab.x.spot < 3 && i < 3; i++) {
    await lab.touch(lab.items.ink.group.localToWorld(V3(0, 7, 0)), null, { pose: 'pinch' }); // dip the capillary
    await lab.touch(paperPoint(lab, LINE).add(V3(0, 0.8, 0)), () => { lab.x.spot++; lab.sfx('drip'); }, { pose: 'pinch', lift: 0 });
    await lab.wait(0.6); // let it dry
    void R;
  }
}
async function addSolvent(lab) {
  const jar = lab.items.jar;
  jar.app.lid.visible = false;
  await C.pour(lab, lab.fx || (lab.fx = { stream: C.stream(lab.scene) }), 'solvent', 'jar', Math.PI * 4 * 4 * SOLV, { dur: 1.4 });
  lab.x.solvent = true;
}
async function hang(lab) {
  const x = lab.x;
  if (x.spot < 1) { lab.toast('Spot the ink on the paper first.', 'err'); return; }
  if (!x.solvent) await addSolvent(lab);
  const jar = lab.items.jar;
  jar.app.lid.visible = false;
  await lab.pickUp('paper');
  const bottomY = jar.group.position.y + jar.app.v.level - 0.5;
  await lab.holdAt('paper', V3(JAR[0], bottomY + 14, JAR[1] + 0.5), new THREE.Euler(0, 0, 0), { dur: 1.2, arc: 12 });
  await lab.holdAt('paper', V3(JAR[0], bottomY, JAR[1] + 0.5), new THREE.Euler(0, 0, 0), { dur: 0.8, arc: 0 });
  lab.releaseCarried('paper');
  await lab.touch(jar.group.localToWorld(V3(0, JAR_H + 1, 0)), () => { jar.app.lid.visible = true; lab.sfx('glass'); }, { pose: 'grab' });
  x.hung = true; x.t = 0; x.front = 0.01;
}
async function removePaper(lab) {
  const x = lab.x, jar = lab.items.jar, p = lab.items.paper;
  await lab.touch(jar.group.localToWorld(V3(0, JAR_H + 1, 0)), () => { jar.app.lid.visible = false; }, { pose: 'grab' });
  x.hung = false;
  await lab.pickUp('paper');
  await lab.putDown('paper', V3(p.slot[0], -3 + 0.05, p.slot[1]), { euler: new THREE.Euler(-Math.PI / 2, 0, 0), slot: true });
  // mark the front with the pencil before it evaporates
  const R = lab.handR();
  await lab.touch(paperPoint(lab, LINE + x.front).add(V3(0, 1, 0)), null, { pose: 'pinch', lift: 0 });
  await lab.tween(0.6, () => { R.goal.x += 0; });
  x.frontMarked = x.front;
  jar.app.lid.visible = true;
  lab.toast(`Solvent front marked at ${x.front.toFixed(1)} cm above the pencil line.`, 'info', 4000);
}
async function measure(lab) {
  const x = lab.x;
  if (x.frontMarked == null) { lab.toast('Develop the chromatogram and mark the solvent front first.', 'err'); return; }
  const rule = lab.items.rule;
  await lab.pickUp('rule');
  await lab.holdAt('rule', paperPoint(lab, LINE + 4).add(V3(PW / 2 + 1.8, 0.4, 0)), new THREE.Euler(0, Math.PI / 2, 0), { dur: 1.0 });
  const ds = Math.round(x.frontMarked * 10) / 10;
  for (const d of DYES) {
    if (lab.rows.some((r) => r.component === d.name)) continue;
    const dc = Math.round((d.rf * x.frontMarked + (Math.random() - 0.5) * 0.08) * 10) / 10;
    lab.addRow({ component: d.name, d_c: dc, d_s: ds, Rf: dc / ds });
    await lab.wait(0.5);
  }
  await lab.putDown('rule', V3(rule.slot[0], -3, rule.slot[1]), { rot: 0, slot: true });
}
