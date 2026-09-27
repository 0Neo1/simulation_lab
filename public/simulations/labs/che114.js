// Purification of impure copper sulphate by crystallisation: weigh, dissolve
// in the minimum of hot water with a little dilute H₂SO₄, filter off the
// insoluble impurities, concentrate to the crystallisation point, cool, and
// weigh the dry crystals.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TRIPOD = [-10, -12], STAND = [34, -16];
const BLUE = 0x1f7fd6;

function buildCrystals() {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x2f7fe0, roughness: 0.1, transparent: true, opacity: 0.9, clearcoat: 1 });
  const im = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.28, 0), mat, 90);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V3();
  for (let i = 0; i < 90; i++) {
    const r = Math.sqrt(Math.random()) * 2.8, a = Math.random() * Math.PI * 2;
    q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3));
    s.set(1 + Math.random(), 0.6 + Math.random() * 0.8, 0.8 + Math.random());
    m.compose(V3(Math.cos(a) * r, 0.35 + Math.random() * 0.2, Math.sin(a) * r), q, s);
    im.setMatrixAt(i, m);
  }
  im.count = 0; im.userData.noPick = true;
  g.add(im);
  return { group: g, im };
}
function buildFilterStand() {
  const s = C.retortStand({ clampY: 30, ringY: 26, reach: 11 });
  const f = C.funnel(3.4);
  const paper = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.6, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf7f6f0, roughness: 0.95, side: THREE.DoubleSide }));
  paper.rotation.x = Math.PI; paper.position.y = 2.05;
  const residue = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0x7c6f5b, roughness: 1 }));
  residue.rotation.x = Math.PI; residue.position.y = 0.6; residue.visible = false;
  f.group.add(paper, residue);
  f.group.position.set(0, 26 + 0.4, -8 + 11 + 3.6);
  s.group.add(f.group);
  return Object.assign(s.app, { funnel: f, residue, funnelTop: () => f.group.localToWorld(V3(0, 3.6, 0)), stemWorld: () => f.group.localToWorld(V3(0, -6, 0)) });
}

export default {
  id: 'che114',
  lab: 'Chemistry Lab',
  title: 'Crystallisation of impure copper sulphate',
  intro: 'Purify a sample of impure copper sulphate by crystallisation and find the percentage yield of pure crystals.',
  poster: 'chemsafety',
  board: {
    title: 'Crystallisation of CuSO₄·5H₂O',
    formulas: ['Yield % = mass of pure crystals / mass of impure salt × 100'],
    steps: ['Weigh about 5 g of the impure salt', 'Dissolve in minimum hot water + few drops dil. H₂SO₄', 'Filter to remove insoluble impurities', 'Concentrate to the crystallisation point', 'Cool slowly; dry and weigh the crystals'],
    note: 'Dil. H₂SO₄ prevents hydrolysis of copper sulphate',
  },
  items: {
    balance: { name: 'Digital balance', label: 'Balance', build: () => { const b = C.balance(); return Object.assign(b.app, { show: b.show, panTop: b.panTop, tare: b.tare }); }, slot: [70, 8, 0] },
    salt: { name: 'Impure copper sulphate', label: 'Impure CuSO₄', build: () => { const d = C.sampleDish('Impure CuSO₄', 0x3d7fc4); return Object.assign(d.app, { heap: d.heap }); }, slot: [-50, 14, 0] },
    watch: { name: 'Watch glass', label: 'Watch glass', build: () => { const w = C.watchGlass(3.2); const h = C.heap(0x3d7fc4, 1.4, 0.8); h.visible = false; w.group.add(h); return Object.assign(w.app, { heap: h }); }, slot: [48, 22, 0] },
    beaker: { name: '100 mL beaker', label: 'Beaker', build: () => { const b = C.beaker(100); return Object.assign(b.app, { v: b }); }, slot: [-30, 20, 0] },
    water: { name: 'Distilled water', label: 'Distilled water', build: () => { const b = C.reagentBottle('Distilled water', 'H₂O', { labelColor: '#0284c7', liquid: 150, liquidColor: 0xeef6fb, opacity: 0.18, capacity: 250 }); return Object.assign(b.app, { v: b, stopper: b.stopper }); }, slot: [-70, -18, 0] },
    acid: { name: 'Dil. H₂SO₄ dropper bottle', label: 'Dil. H₂SO₄', build: () => { const d = C.dropperBottle('Dil. H₂SO₄', { liquidColor: 0xf3f6f8, opacity: 0.3, labelColor: '#dc2626' }); return Object.assign(d.app, { v: d, dropper: d.dropper, dropColor: d.dropColor }); }, slot: [-54, -20, 0] },
    tripod: { name: 'Tripod stand with wire gauze', label: 'Tripod', build: () => C.tripod(18), slot: [TRIPOD[0], TRIPOD[1], 0] },
    burner: { name: 'Bunsen burner', label: 'Burner', build: () => { const b = C.bunsenBurner(); return Object.assign(b.app, { flame: b.flame, knob: b.knob }); }, slot: [TRIPOD[0], TRIPOD[1], 0] },
    stand: { name: 'Stand with funnel and filter paper', label: 'Filter funnel', build: () => buildFilterStand(), slot: [STAND[0], STAND[1] - 3.6, 0] },
    dish: { name: 'China dish', label: 'China dish', build: () => { const d = C.chinaDish(4.2); const cr = buildCrystals(); d.group.add(cr.group); return Object.assign(d.app, { v: d, crystals: cr.im }); }, slot: [STAND[0], STAND[1] + 3, 0] },
    rod: { name: 'Glass rod', label: 'Glass rod', build: () => C.glassRod(16), slot: [10, 26, 0] },
  },
  setupOrder: ['balance', 'salt', 'watch', 'beaker', 'water', 'acid', 'tripod', 'burner', 'stand', 'dish', 'rod'],
  views: { work: { label: 'Workbench', fit: [-60, 60, [0, 10, -10]] } },
  classicView: 'work',
  pips: [{ id: 'bal', title: 'Balance display', fov: 26, update: (cam, lab) => { const b = lab.items.balance.group; b.updateMatrixWorld(true); const p = b.localToWorld(V3(-2.5, 2.5, 11.6)); cam.position.copy(p).add(V3(0, 5, 9)); cam.lookAt(p); }, show: (lab) => lab.items.balance.placed }, { id: 'dish', title: 'China dish', fov: 30, update: (cam, lab) => { const p = lab.items.dish.group.localToWorld(V3(0, 1, 0)); cam.position.set(p.x + 2, p.y + 12, p.z + 10); cam.lookAt(p); }, show: (lab) => lab.items.dish.app.v.vol > 0.5 || lab.x.crystals > 0 }],
  overlay: '<b>Crystallisation</b><span class="big" id="kS">—</span><div id="kT"></div>',
  hintExtra: 'panel buttons carry out each stage',
  panel: [{
    title: 'Procedure',
    html: `
      <div class="row"><button class="btn ghost act" id="kW">Weigh 5 g</button><button class="btn ghost act" id="kD">Dissolve (heat & stir)</button></div>
      <div class="row"><button class="btn ghost act" id="kF">Filter</button><button class="btn ghost act" id="kE">Concentrate</button></div>
      <div class="row"><button class="btn ghost act" id="kC">Cool & crystallise</button><button class="btn ghost act" id="kP">Dry & weigh crystals</button></div>
      <div class="meters"><div class="m"><i>Solution</i><b id="kV">—</b></div><div class="m"><i>Temperature</i><b id="kTe">—</b></div></div>`,
    bind: (lab, root) => {
      const on = (id, f) => { root.querySelector(`#${id}`).onclick = () => lab.act(() => f(lab)); };
      on('kW', weigh); on('kD', dissolve); on('kF', filter); on('kE', concentrate); on('kC', crystallise); on('kP', weighCrystals);
    },
  }],
  table: { columns: [{ key: 'm_impure', label: 'Impure salt (g)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) }, { key: 'm_pure', label: 'Pure crystals (g)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) }, { key: 'yield', label: 'Yield (%)', fmt: (v) => (v == null ? '—' : v.toFixed(1)) }], note: 'Some copper sulphate always stays dissolved in the mother liquor, so the yield is below 100 %.' },
  steps: (lab) => [
    { phase: 'Weigh', text: 'Tare the watch glass on the balance and weigh about 5 g of impure copper sulphate.', check: () => lab.x.m != null, demo: () => weigh(lab) },
    { phase: 'Dissolve', text: 'Put the salt in the beaker with about 20 mL of water and a few drops of dilute H₂SO₄; warm on the tripod and stir until it dissolves.', why: 'Use the minimum of water, so crystals will form later without boiling off a lot of it.', check: () => lab.x.dissolved, demo: () => dissolve(lab) },
    { phase: 'Filter', text: 'Filter the hot solution into the china dish; the insoluble impurities stay on the filter paper.', check: () => lab.x.filtered, demo: () => filter(lab) },
    { phase: 'Crystallise', text: 'Heat the filtrate to the crystallisation point: a drop on a glass rod forms crystals when it cools.', why: 'Do not evaporate to dryness — impurities would come down with the crystals and the water of crystallisation would be lost.', check: () => lab.x.concentrated, demo: () => concentrate(lab) },
    { phase: 'Crystallise', text: 'Leave the dish to cool slowly: blue crystals of CuSO₄·5H₂O separate out.', why: 'Slow cooling gives larger, purer crystals.', check: () => lab.x.crystals >= 0.99, demo: () => crystallise(lab) },
    { phase: 'Weigh', text: 'Pour off the mother liquor, dry the crystals between filter papers and weigh them. Work out the yield.', check: () => lab.x.mPure != null, demo: () => weighCrystals(lab) },
  ],
  state: () => ({ m: null, dissolved: false, filtered: false, concentrated: false, crystals: 0, T: 25, heating: false, mPure: null, purity: 0.84 + Math.random() * 0.04 }),
  init: (lab) => {
    const b = lab.items.burner.app;
    lab.actionable(b.knob, { tip: () => `Gas tap — ${b.flame.on ? 'on' : 'off'}`, run: () => lab.touch(b.knob, () => { b.flame.on = !b.flame.on; lab.x.heating = b.flame.on; }) });
  },
  reset: (lab) => {
    lab.items.beaker.app.v.setLiquid(0); lab.items.dish.app.v.setLiquid(0); lab.items.dish.app.crystals.count = 0;
    lab.items.stand.app.residue.visible = false; lab.items.watch.app.heap.visible = false; lab.items.salt.app.heap.visible = true;
    lab.items.burner.app.flame.on = false; lab.items.balance.app.show('0.00 g');
  },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.T == null) return;
    const onTripod = (k) => lab.items[k].group.position.distanceTo(lab.items.tripod.group.localToWorld(V3(0, lab.items.tripod.app.top, 0))) < 3;
    const hot = lab.items.burner.app.flame.on && (onTripod('beaker') || onTripod('dish'));
    x.T += ((hot ? 98 : 25) - x.T) * (1 - Math.exp(-dt / (hot ? 12 : 30)));
    const d = lab.items.dish.app.v;
    if (hot && onTripod('dish') && d.vol > 5) d.setLiquid(d.vol - dt * 0.35);
    if (x.fumes) { x.fumes.rate = x.T > 80 ? 0.4 : 0; const k = onTripod('dish') ? 'dish' : 'beaker'; x.fumes.origin.copy(lab.items[k].group.localToWorld(V3(0, 4, 0))); }
    if (x.cooling && x.T < 45) x.crystals = Math.min(1, x.crystals + dt / 12);
    lab.items.dish.app.crystals.count = Math.round(x.crystals * 90);
    lab.items.dish.app.crystals.instanceMatrix.needsUpdate = true;
  },
  update: (lab, dt, t) => C.update(dt, t),
  chips: (lab) => [[`Burner: ${lab.items.burner.app.flame.on ? 'on' : 'off'}`, lab.items.burner.app.flame.on ? 'hot' : ''], [`${lab.x.T.toFixed(0)} °C`, lab.x.T > 60 ? 'hot' : '']],
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const stage = x.mPure != null ? 'done' : x.crystals > 0.05 ? 'crystals forming' : x.concentrated ? 'at crystallisation point' : x.filtered ? 'filtrate in dish' : x.dissolved ? 'dissolved' : x.m != null ? 'weighed' : 'start';
    $('kS').textContent = stage;
    $('kT').textContent = `Temperature ${x.T.toFixed(0)} °C`;
    $('kV').textContent = `${(lab.items.dish.app.v.vol || lab.items.beaker.app.v.vol).toFixed(0)} mL`;
    $('kTe').textContent = `${x.T.toFixed(0)} °C`;
  },
  result: (lab) => { const r = lab.rows[0]; return { items: [['Impure salt', r?.m_impure != null ? `${r.m_impure.toFixed(2)} g` : '—'], ['Pure crystals', r?.m_pure != null ? `${r.m_pure.toFixed(2)} g` : '—'], ['Yield', r?.yield != null ? `${r.yield.toFixed(1)} %` : '—']], note: 'The crystals are bright blue CuSO₄·5H₂O; the impurities stayed on the filter paper and in the mother liquor.' }; },
  obsRows: 1,
  obsKeys: ['m_impure', 'm_pure', 'yield'],
  observation: (lab) => ({ rows: lab.rows.map((r) => ({ m_impure: r.m_impure?.toFixed(2) ?? '', m_pure: r.m_pure?.toFixed(2) ?? '', yield: r.yield?.toFixed(1) ?? '' })) }),
};

// ---------------------------------------------------------------------------

const fx = (lab) => lab.cfx || (lab.cfx = { stream: C.stream(lab.scene), drops: C.dropper(lab.scene) });
function row(lab) { if (!lab.rows.length) lab.addRow({ m_impure: null, m_pure: null, yield: null }); return lab.rows[0]; }
async function burner(lab, on) { const b = lab.items.burner.app; if (b.flame.on !== on) await lab.touch(b.knob, () => { b.flame.on = on; lab.sfx('click'); }, { pose: 'pinch' }); lab.x.heating = on; if (!lab.x.fumes) lab.x.fumes = C.fumes(lab.scene, { col: 0xffffff, opacity: 0.25, spread: 1, rise: 5 }); }
async function weigh(lab) {
  const bal = lab.items.balance;
  await lab.pickUp('watch');
  await lab.putDown('watch', bal.group.localToWorld(bal.app.panTop.clone()), { rot: 0 });
  await lab.touch(bal.app.tare, () => { bal.app.show('0.00 g'); lab.sfx('tick'); }, { pose: 'press' });
  const m = 5 + Math.round((Math.random() - 0.5) * 6) / 100;
  for (let i = 0; i < 3; i++) {
    await lab.touch(lab.items.salt.group.position.clone().add(V3(0, 1.5, 0)), null, { pose: 'pinch' });
    await lab.touch(lab.items.watch.group.position.clone().add(V3(0, 2, 0)), () => { lab.items.watch.app.heap.visible = true; bal.app.show(`${(i < 2 ? (i + 1) * 1.9 : m).toFixed(2)} g`); lab.sfx('tick'); }, { pose: 'pinch' });
  }
  lab.x.m = m; row(lab).m_impure = m; lab.renderTable();
  lab.toast(`Impure copper sulphate: ${m.toFixed(2)} g`, 'ok');
}
async function dissolve(lab) {
  const x = lab.x, tp = lab.items.tripod;
  if (x.m == null) await weigh(lab);
  await lab.pickUp('beaker');
  await lab.putDown('beaker', tp.group.localToWorld(V3(0, tp.app.top, 0)), { rot: 0 });
  await C.pour(lab, fx(lab), 'water', 'beaker', 20, { dur: 1.4 });
  await lab.touch(lab.items.watch.group.position.clone().add(V3(0, 2, 0)), null, { pose: 'pinch' });
  lab.items.watch.app.heap.visible = false;
  const bv = lab.items.beaker.app.v;
  bv.setPpt(0.5, 0x3d7fc4, 0.2);
  await C.addDrops(lab, fx(lab), 'acid', 'beaker', 3, { interval: 0.3 });
  await burner(lab, true);
  // stir with the glass rod while it warms
  await lab.pickUp('rod');
  const top = lab.items.beaker.group.localToWorld(V3(0, 8, 0));
  await lab.holdAt('rod', top, new THREE.Euler(0, 0, -1.2), { dur: 0.8 });
  const c0 = bv.color.clone();
  await lab.tween(4, (e, k) => { lab.items.rod.group.rotation.y = Math.sin(k * 20) * 0.4; bv.color.copy(c0).lerp(new THREE.Color(BLUE), e); bv.opacity = 0.3 + 0.35 * e; bv.setPpt(0.5 * (1 - e) + 0.08, 0x6b5f4c, 0.3 * (1 - e) + 0.1); });
  await lab.putBack('rod');
  x.dissolved = true;
  lab.toast('The blue salt has dissolved; a little insoluble dirt remains suspended.', 'info', 4000);
}
async function filter(lab) {
  const x = lab.x;
  if (!x.dissolved) await dissolve(lab);
  await burner(lab, false);
  const st = lab.items.stand.app, dv = lab.items.dish.app.v, bv = lab.items.beaker.app.v;
  const tgt = { topW: () => st.funnelTop(), surfW: () => st.funnelTop().add(V3(0, -2, 0)), add: () => {} };
  const s2 = C.stream(lab.scene);
  let showing = true;
  const drip = () => { if (showing) s2.show(st.stemWorld(), lab.items.dish.group.localToWorld(V3(0, dv.level, 0)), BLUE, 0.07); };
  await C.pour(lab, fx(lab), 'beaker', tgt, bv.vol, { dur: 2.2, onFlow: (d) => { dv.add(d * 0.97, BLUE, 0.65); drip(); } });
  st.residue.visible = true;
  await lab.wait(0.8);
  showing = false; s2.hide();
  bv.setLiquid(0); bv.setPpt(0, 0xffffff, 0);
  x.filtered = true;
  lab.toast('Clear blue filtrate in the dish; the dirt stays on the filter paper.', 'info', 4000);
}
async function concentrate(lab) {
  const x = lab.x, tp = lab.items.tripod;
  if (!x.filtered) await filter(lab);
  await lab.pickUp('dish');
  await lab.putDown('dish', tp.group.localToWorld(V3(0, tp.app.top, 0)), { rot: 0 });
  await burner(lab, true);
  const dv = lab.items.dish.app.v;
  const target = Math.max(5, dv.vol * 0.35);
  await lab.waitFor(() => dv.vol <= target + 0.1, 120);
  // crystallisation-point test with the glass rod
  await lab.pickUp('rod');
  await lab.holdAt('rod', lab.items.dish.group.localToWorld(V3(0, 4, 0)), new THREE.Euler(0, 0, -1.1), { dur: 0.7 });
  await lab.wait(0.6);
  await lab.holdAt('rod', lab.items.dish.group.localToWorld(V3(8, 10, 6)), new THREE.Euler(0, 0, -0.4), { dur: 0.7 });
  await lab.wait(1.0);
  await lab.putBack('rod');
  await burner(lab, false);
  x.concentrated = true;
  dv.color.set(0x1766b8); dv.opacity = 0.8; dv.refresh();
  lab.toast('Tiny crystals form on the cooled glass rod: the crystallisation point is reached.', 'info', 4500);
}
async function crystallise(lab) {
  const x = lab.x;
  if (!x.concentrated) await concentrate(lab);
  const dish = lab.items.dish;
  await lab.pickUp('dish');
  await lab.putDown('dish', V3(dish.slot[0] - 20, -3, dish.slot[1] + 18), { rot: 0 });
  x.cooling = true;
  await lab.waitFor(() => x.crystals >= 0.99, 200);
  lab.toast('Bright blue crystals of hydrated copper sulphate have formed.', 'ok', 4000);
}
async function weighCrystals(lab) {
  const x = lab.x;
  if (x.crystals < 0.99) await crystallise(lab);
  const dv = lab.items.dish.app.v, bal = lab.items.balance;
  // pour off the mother liquor into the beaker, dry the crystals
  await C.pour(lab, fx(lab), 'dish', 'beaker', dv.vol * 0.9, { dur: 1.2, tilt: 1.1 });
  await lab.wait(0.6);
  await lab.touch(bal.app.tare, () => { bal.app.show('0.00 g'); }, { pose: 'press' });
  const m = Math.round(x.m * x.purity * (0.78 + Math.random() * 0.04) * 100) / 100;
  await lab.touch(bal.group.localToWorld(bal.app.panTop.clone()).add(V3(0, 2, 0)), () => { bal.app.show(`${m.toFixed(2)} g`); lab.sfx('tick'); }, { pose: 'pinch' });
  x.mPure = m;
  const r = row(lab); r.m_pure = m; r.yield = (m / x.m) * 100; lab.renderTable();
  lab.toast(`Pure crystals: ${m.toFixed(2)} g → yield ${(m / x.m * 100).toFixed(1)} %`, 'ok', 5000);
}
