// Separating a mixture of ammonium chloride and common salt by sublimation:
// the mixture is heated in a china dish under an inverted funnel; NH₄Cl
// vapour condenses on the cool funnel walls, salt stays behind. Both parts
// are weighed.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TRIPOD = [-6, -10];

function buildFunnel() {
  const f = C.funnel(4.2);
  f.glass.material = C.MAT.glassRim.clone(); f.glass.material.opacity = 0.35;
  // the white sublimate that collects on the inside
  const coat = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.3, -1), new THREE.Vector2(0.3, 0.3), new THREE.Vector2(3.9, 4.4)], 28), new THREE.MeshStandardMaterial({ color: 0xfafaf7, roughness: 0.9, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  coat.scale.setScalar(0.95);
  f.group.add(coat);
  const plug = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })); plug.position.y = -5.4; plug.scale.y = 1.6;
  f.group.add(plug);
  return Object.assign(f.app, { v: f, coat });
}

export default {
  id: 'che091',
  lab: 'Chemistry Lab',
  title: 'Separating ammonium chloride and salt by sublimation',
  intro: 'Separate a mixture of ammonium chloride and common salt by sublimation and find the mass of each component.',
  poster: 'chemsafety',
  board: {
    title: 'Sublimation',
    formulas: ['NH₄Cl(s) ⇌ NH₃(g) + HCl(g)  on heating', 'NaCl does not sublime'],
    steps: ['Weigh the mixture in a china dish', 'Cover with an inverted funnel, cotton plug in the stem', 'Heat gently on a tripod and gauze', 'White sublimate forms on the funnel', 'Weigh the sublimate and the residue'],
    note: 'Heat gently and in a well-ventilated place',
  },
  items: {
    tripod: { name: 'Tripod stand with wire gauze', label: 'Tripod & gauze', build: () => C.tripod(18), slot: [TRIPOD[0], TRIPOD[1], 0] },
    burner: { name: 'Bunsen burner', label: 'Bunsen burner', build: () => { const b = C.bunsenBurner(); return Object.assign(b.app, { flame: b.flame, knob: b.knob, topWorld: b.topWorld }); }, slot: [TRIPOD[0], TRIPOD[1], 0], why: 'The burner goes under the tripod; the gauze spreads the heat evenly.' },
    balance: { name: 'Digital balance', label: 'Balance', build: () => { const b = C.balance(); return Object.assign(b.app, { show: b.show, panTop: b.panTop, pan: b.pan, tare: b.tare }); }, slot: [44, 4, 0] },
    dish: { name: 'China dish', label: 'China dish', build: () => { const d = C.chinaDish(4.2); return Object.assign(d.app, { v: d }); }, slot: [22, 18, 0] },
    mix: { name: 'Mixture of NH₄Cl and NaCl', label: 'Mixture', build: () => { const d = C.sampleDish('NH₄Cl + NaCl', 0xf0efe9); return Object.assign(d.app, { heap: d.heap }); }, slot: [-40, 14, 0] },
    funnel: { name: 'Glass funnel with cotton plug', label: 'Funnel', build: () => buildFunnel(), slot: [-58, -8, 0], slotY: -3 + 6, homeY: -3 + 6 },
    spatula: { name: 'Spatula', label: 'Spatula', build: () => C.spatula(), slot: [-26, 26, 0] },
  },
  setupOrder: ['tripod', 'burner', 'balance', 'dish', 'mix', 'funnel', 'spatula'],
  views: { heat: { label: 'Tripod', pos: [TRIPOD[0] + 16, 32, TRIPOD[1] + 42], target: [TRIPOD[0], 18, TRIPOD[1]] }, bal: { label: 'Balance', pos: [44, 22, 32], target: [44, 2, 4] } },
  classicView: 'heat',
  pips: [
    { id: 'bal', title: 'Balance display', fov: 26, update: (cam, lab) => { const b = lab.items.balance.group; b.updateMatrixWorld(true); const p = b.localToWorld(V3(-2.5, 2.5, 11.6)); cam.position.copy(p).add(V3(0, 5, 9)); cam.lookAt(p); }, show: (lab) => lab.items.balance.placed },
    { id: 'funnel', title: 'Inside the funnel', fov: 30, update: (cam, lab) => { const p = lab.items.tripod.group.localToWorld(V3(0, 22, 0)); cam.position.set(p.x + 4, p.y + 3, p.z + 18); cam.lookAt(p); }, show: (lab) => lab.x.covered },
  ],
  overlay: '<b>Sublimation</b><span class="big" id="sbM">—</span><div id="sbS"></div>',
  hintExtra: 'panel buttons weigh, heat and collect',
  panel: [{
    title: 'Procedure',
    html: `
      <div class="row"><button class="btn ghost act" id="sbW">Weigh 5 g mixture</button><button class="btn ghost act" id="sbC">Dish on tripod, cover with funnel</button></div>
      <div class="row"><button class="btn act" id="sbH">Heat</button><button class="btn ghost act" id="sbStop">Stop heating</button></div>
      <div class="row"><button class="btn ghost act" id="sbSub">Weigh sublimate</button><button class="btn ghost act" id="sbRes">Weigh residue</button></div>
      <div class="meters"><div class="m"><i>Sublimed so far</i><b id="sbP">0 %</b></div><div class="m"><i>Burner</i><b id="sbB">off</b></div></div>`,
    bind: (lab, root) => {
      const on = (id, f) => { root.querySelector(`#${id}`).onclick = () => lab.act(() => f(lab)); };
      on('sbW', weighMix); on('sbC', cover); on('sbH', heat); on('sbStop', stop); on('sbSub', weighSub); on('sbRes', weighRes);
    },
  }],
  table: { columns: [{ key: 'm_mix', label: 'Mixture (g)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) }, { key: 'm_nh4cl', label: 'Sublimate NH₄Cl (g)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) }, { key: 'm_salt', label: 'Residue NaCl (g)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) }], note: 'A small mass is lost as vapour escaping the funnel.' },
  steps: (lab) => [
    { phase: 'Weigh', text: 'Put the empty china dish on the balance, tare it, and add about 5 g of the mixture with the spatula.', check: () => lab.x.mMix != null, demo: () => weighMix(lab) },
    { phase: 'Sublime', text: 'Place the dish on the gauze, cover it with the inverted funnel and plug the funnel stem with cotton.', why: 'The cotton stops vapour escaping; the funnel walls are cool, so the vapour condenses on them.', check: () => lab.x.covered, demo: () => cover(lab) },
    { phase: 'Sublime', text: 'Heat gently until no more white fumes rise and the white solid has collected on the inside of the funnel.', check: () => lab.x.done, demo: async () => { await heat(lab); await lab.waitFor(() => lab.x.sub >= 0.985, 120); await stop(lab); } },
    { phase: 'Weigh', text: 'Let it cool, scrape the sublimate off the funnel and weigh it; then weigh the residue left in the dish.', check: () => lab.x.mSub != null && lab.x.mRes != null, demo: async () => { await weighSub(lab); await weighRes(lab); } },
  ],
  state: () => ({ frac: 0.40 + Math.random() * 0.06, mMix: null, covered: false, sub: 0, heating: false, done: false, mSub: null, mRes: null }),
  init: (lab) => {
    lab.x = lab.x || {};
    const b = lab.items.burner.app;
    lab.actionable(b.knob, { tip: () => (b.flame.on ? 'Gas tap — click to turn off' : 'Gas tap — click to light and heat'), run: () => (b.flame.on ? stop(lab) : heat(lab)) });
  },
  reset: (lab) => {
    const d = lab.items.dish.app.v; d.setPpt(0, 0xffffff, 0); d.setLiquid(0);
    lab.items.funnel.app.coat.material.opacity = 0; lab.items.funnel.group.rotation.set(0, 0, 0);
    lab.items.burner.app.flame.on = false; lab.items.balance.app.show('0.00 g');
    lab.items.mix.app.heap.visible = true;
  },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.sub == null) return;
    if (x.heating && x.covered && x.mMix != null) x.sub = Math.min(1, x.sub + dt / 40 * (1 - x.sub * 0.6));
    const d = lab.items.dish.app.v;
    if (x.mMix != null) d.setPpt(0.55 * (1 - x.frac * x.sub), 0xf2f1ec, 0);
    lab.items.funnel.app.coat.material.opacity = Math.min(0.85, x.sub * 0.9);
    if (x.fumes) { x.fumes.rate = x.heating && x.covered && x.sub < 0.98 ? 0.7 : 0; x.fumes.origin.copy(lab.items.tripod.group.localToWorld(V3(0, 21, 0))); }
  },
  update: (lab, dt, t) => { C.update(dt, t); },
  chips: (lab) => [[`Burner: ${lab.items.burner.app.flame.on ? 'on' : 'off'}`, lab.items.burner.app.flame.on ? 'hot' : ''], [`Sublimed: ${Math.round(lab.x.sub * 100)} %`, lab.x.done ? 'ok' : '']],
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    $('sbM').textContent = x.mMix != null ? `${x.mMix.toFixed(2)} g mixture` : '—';
    $('sbS').textContent = x.heating ? 'Heating — white fumes rising, sublimate collecting' : x.done ? 'Sublimation complete' : '';
    $('sbP').textContent = `${Math.round(x.sub * 100)} %`;
    $('sbB').textContent = lab.items.burner.app.flame.on ? 'on' : 'off';
  },
  result: (lab) => {
    const x = lab.x;
    const r = lab.rows[0];
    return { items: [['Mixture', r?.m_mix != null ? `${r.m_mix.toFixed(2)} g` : '—'], ['NH₄Cl', r?.m_nh4cl != null ? `${r.m_nh4cl.toFixed(2)} g (${((r.m_nh4cl / r.m_mix) * 100).toFixed(1)} %)` : '—'], ['NaCl', r?.m_salt != null ? `${r.m_salt.toFixed(2)} g (${((r.m_salt / r.m_mix) * 100).toFixed(1)} %)` : '—'], ['Loss', r?.m_salt != null && r?.m_nh4cl != null ? `${(r.m_mix - r.m_salt - r.m_nh4cl).toFixed(2)} g` : '—']], note: x.done ? 'Ammonium chloride sublimes; common salt does not.' : '' };
  },
  obsRows: 1,
  obsKeys: ['m_mix', 'm_nh4cl', 'm_salt'],
  observation: (lab) => ({ rows: lab.rows.map((r) => ({ m_mix: r.m_mix?.toFixed(2) ?? '', m_nh4cl: r.m_nh4cl?.toFixed(2) ?? '', m_salt: r.m_salt?.toFixed(2) ?? '' })) }),
};

// ---------------------------------------------------------------------------

function row(lab) { if (!lab.rows.length) lab.addRow({ m_mix: null, m_nh4cl: null, m_salt: null }); return lab.rows[0]; }
async function toBalance(lab, key, y = 0) {
  const b = lab.items.balance;
  await lab.pickUp(key);
  await lab.putDown(key, b.group.localToWorld(b.app.panTop.clone()).add(V3(0, y, 0)), { rot: 0 });
}
async function weighMix(lab) {
  const x = lab.x, bal = lab.items.balance.app;
  await toBalance(lab, 'dish');
  await lab.touch(bal.tare, () => { bal.show('0.00 g'); lab.sfx('tick'); }, { pose: 'press' });
  const target = 5 + Math.round((Math.random() - 0.5) * 6) / 100;
  let m = 0;
  for (let i = 0; i < 4; i++) {
    await lab.touch(lab.items.mix.group.position.clone().add(V3(0, 1.5, 0)), null, { pose: 'pinch' });
    await lab.touch(lab.items.dish.group.localToWorld(V3(0, 3, 0)), () => { m = i < 3 ? m + 1.4 + Math.random() * 0.2 : target; bal.show(`${m.toFixed(2)} g`); lab.items.dish.app.v.setPpt(0.15 + 0.1 * (i + 1), 0xf2f1ec, 0); lab.sfx('tick'); }, { pose: 'pinch' });
  }
  x.mMix = target;
  row(lab).m_mix = target; lab.renderTable();
  lab.toast(`Mass of the mixture: ${target.toFixed(2)} g`, 'ok');
}
async function cover(lab) {
  const x = lab.x, tp = lab.items.tripod;
  await lab.pickUp('dish');
  await lab.putDown('dish', tp.group.localToWorld(V3(0, tp.app.top, 0)), { rot: 0 });
  lab.items.balance.app.show('0.00 g');
  await lab.pickUp('funnel');
  await lab.putDown('funnel', tp.group.localToWorld(V3(0, tp.app.top + 4.6 + 1.9, 0)), { euler: new THREE.Euler(Math.PI, 0, 0) });
  x.covered = true;
  if (!x.fumes) x.fumes = C.fumes(lab.scene, { col: 0xffffff, opacity: 0.35, spread: 1.2, rise: 3 });
}
async function heat(lab) {
  const b = lab.items.burner.app;
  if (!b.flame.on) await lab.touch(b.knob, () => { b.flame.on = true; lab.sfx('click'); }, { pose: 'pinch' });
  lab.x.heating = true;
}
async function stop(lab) {
  const b = lab.items.burner.app;
  if (b.flame.on) await lab.touch(b.knob, () => { b.flame.on = false; lab.sfx('click'); }, { pose: 'pinch' });
  lab.x.heating = false;
  if (lab.x.sub > 0.95) { lab.x.done = true; lab.toast('No more fumes: all the ammonium chloride has sublimed onto the funnel.', 'info', 4000); }
}
async function weighSub(lab) {
  const x = lab.x, bal = lab.items.balance.app;
  if (!x.done) { lab.toast('Finish the sublimation first.', 'err'); return; }
  await lab.touch(lab.items.funnel.group.position.clone().add(V3(0, 4, 0)), null, { pose: 'pinch' });
  lab.items.funnel.app.coat.material.opacity = 0.1;
  const m = Math.round((x.mMix * x.frac * 0.985) * 100) / 100;
  await lab.touch(lab.items.balance.group.localToWorld(bal.panTop.clone()).add(V3(0, 2, 0)), () => { bal.show(`${m.toFixed(2)} g`); lab.sfx('tick'); }, { pose: 'pinch' });
  x.mSub = m; row(lab).m_nh4cl = m; lab.renderTable();
  lab.toast(`Sublimate (NH₄Cl) scraped from the funnel: ${m.toFixed(2)} g`, 'ok');
}
async function weighRes(lab) {
  const x = lab.x, bal = lab.items.balance.app;
  if (!x.done) { lab.toast('Finish the sublimation first.', 'err'); return; }
  await lab.pickUp('funnel');
  await lab.putDown('funnel', V3(-58, -3 + 6, -8), { euler: new THREE.Euler(0, 0, 0) });
  await toBalance(lab, 'dish');
  const m = Math.round((x.mMix * (1 - x.frac) * 0.995) * 100) / 100; // the balance is still tared for the empty dish
  bal.show(`${m.toFixed(2)} g`);
  x.mRes = m; row(lab).m_salt = m; lab.renderTable();
  lab.sfx('ok');
  lab.toast(`Residue (NaCl) in the dish: ${m.toFixed(2)} g`, 'ok');
}
