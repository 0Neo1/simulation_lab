// Acidic and basic oxides: magnesium ribbon burnt in air and sulphur burnt in
// a gas jar; their oxides dissolved in water and tested with litmus and
// universal indicator, with sodium oxide and carbon dioxide for comparison.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';
import * as PH from '../lab-engine/phys.js';
import { tubeTests } from './tubetests.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const OX = {
  mgo: { oxide: 'MgO', name: 'Magnesium oxide', color: 0xf1f1ec, opacity: 0.6, pH: 10 },
  so2: { oxide: 'SO₂', name: 'Sulphur dioxide', color: 0xf6f8f9, opacity: 0.2, pH: 3 },
  na2o: { oxide: 'Na₂O', name: 'Sodium oxide', color: 0xf4f7f8, opacity: 0.22, pH: 13 },
  soda: { oxide: 'CO₂', name: 'Carbon dioxide (soda water)', color: 0xf3f6f7, opacity: 0.2, pH: 5 },
};

function buildTongs() {
  const g = new THREE.Group();
  const steel = PH.PM.steel;
  [-0.3, 0.3].forEach((dz, i) => { const a = new THREE.Mesh(new THREE.BoxGeometry(20, 0.25, 0.5), steel); a.position.set(0, 0.4, dz); a.rotation.y = (i ? 1 : -1) * 0.03; g.add(a); });
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.35), new THREE.MeshStandardMaterial({ color: 0xc9ced3, metalness: 0.9, roughness: 0.3 }));
  ribbon.position.set(-12.5, 0.4, 0);
  g.add(ribbon);
  return { group: g, ribbon, size: [26, 0.8, 1.2], grip: V3(7, 0.5, 0), pose: 'grab', tipLocal: V3(-13, 0.4, 0) };
}
function buildSpoon() {
  const g = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 22, 8), PH.PM.steel); rod.rotation.z = Math.PI / 2; rod.position.set(0, 0.5, 0);
  const cup = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), PH.PM.darkSteel); cup.position.set(-11.2, 0.9, 0);
  const sulphur = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf2d61a, roughness: 0.9 })); sulphur.position.set(-11.2, 0.75, 0);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.3, 24), PH.PM.darkSteel); lid.position.set(-4, 0.5, 0); lid.rotation.z = Math.PI / 2;
  g.add(rod, cup, sulphur, lid);
  return { group: g, sulphur, size: [24, 1.5, 7], grip: V3(8, 0.6, 0), pose: 'grab', tipLocal: V3(-11.2, 0.9, 0) };
}

let glow = null;
function flash(lab, pos, col, on) {
  if (!glow) {
    const tex = C.canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
    glow = { sp: new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })), light: new THREE.PointLight(0xffffff, 0, 160, 2) };
    glow.sp.userData.noPick = true;
    lab.scene.add(glow.sp, glow.light);
  }
  glow.sp.visible = on; glow.light.intensity = on ? 900 : 0;
  if (on) { glow.sp.position.copy(pos); glow.light.position.copy(pos); glow.sp.material.color.set(col); glow.light.color.set(col); }
}

export default tubeTests({
  id: 'che113',
  title: 'Acidic and basic oxides',
  intro: 'Burn magnesium and sulphur, dissolve their oxides in water, and test the solutions (with those of sodium oxide and carbon dioxide) to classify each oxide as acidic or basic.',
  board: {
    title: 'Metal and non-metal oxides',
    formulas: ['2Mg + O₂ → 2MgO;  MgO + H₂O → Mg(OH)₂', 'S + O₂ → SO₂;  SO₂ + H₂O → H₂SO₃', 'Metal oxides: basic · Non-metal oxides: acidic'],
    steps: ['Burn Mg ribbon with tongs — do not stare at it', 'Dissolve the white ash in water', 'Burn sulphur in a deflagrating spoon inside a gas jar', 'Shake the gas with water', 'Test each solution with litmus and pH paper'],
    note: 'Burning magnesium is dazzling — look away!',
  },
  samples: [
    { key: 'na2o', name: 'Sodium oxide', solid: true, color: 0xf4f4f0, slot: [-96, -24, 0] },
    { key: 'soda', name: 'Soda water (CO₂)', color: 0xf3f6f7, opacity: 0.2, labelColor: '#0369a1', slot: [-80, -26, 0] },
  ],
  reagents: [{ key: 'water', name: 'Distilled water', bottle: true, mL: 3, color: 0xeef6fb, opacity: 0.18, labelColor: '#0284c7', slot: [-64, -26, 0] }],
  extraItems: {
    burner: { name: 'Bunsen burner', label: 'Bunsen burner', build: () => { const b = C.bunsenBurner(); return Object.assign(b.app, { flame: b.flame, knob: b.knob, topWorld: b.topWorld }); }, slot: [34, -14, 0] },
    tongs: { name: 'Tongs with magnesium ribbon', label: 'Mg ribbon (tongs)', build: () => buildTongs(), slot: [22, 22, 0] },
    dish: { name: 'China dish', label: 'China dish', build: () => { const d = C.chinaDish(4); return Object.assign(d.app, { v: d }); }, slot: [52, 6, 0] },
    spoon: { name: 'Deflagrating spoon with sulphur', label: 'Sulphur (spoon)', build: () => buildSpoon(), slot: [60, 26, 0] },
    gasjar: { name: 'Gas jar with a little water', label: 'Gas jar', build: () => { const j = C.jar(3.2, 16, false); j.setLiquid(8, 0xeef6fb, 0.2); return Object.assign(j.app, { v: j }); }, slot: [76, -12, 0] },
    tile: { name: 'White tile with test papers', label: 'Tile & papers', build: () => C.whiteTile(14), slot: [-40, 22, 0] },
    chart: { name: 'Universal indicator chart', label: 'pH chart', build: () => C.phChart(), slot: [-64, 16, 0] },
  },
  react: (lab, c) => {
    const o = OX[c.sample];
    if (!o) return null;
    if (c.sample === 'na2o' && !c.reag.water) return { color: 0xffffff, opacity: 0.2, obs: 'White solid (sodium oxide)' };
    return { color: o.color, opacity: o.opacity, pH: o.pH, obs: `Solution of ${o.name.toLowerCase()}` };
  },
  tests: [
    { phase: 'Metal oxide', text: 'Light the burner. Hold the magnesium ribbon in the flame with tongs over a china dish; collect the white ash.', why: 'Magnesium burns with a dazzling white flame, combining with oxygen to form white magnesium oxide.', check: (lab) => lab.x.ash, demo: (lab) => burnMg(lab) },
    { phase: 'Metal oxide', text: 'Dissolve the ash in a little water, pour it into a test tube and test it with litmus and universal indicator paper.', check: (lab) => lab.rows.some((r) => r._key === 'mgo'), demo: async (lab, api) => { await dissolve(lab, api, 'mgo'); } },
    { phase: 'Non-metal oxide', text: 'Heat sulphur in a deflagrating spoon until it burns, lower it into the gas jar and cover it. Shake the gas with the water in the jar.', why: 'Sulphur burns with a blue flame giving choking sulphur dioxide — do not breathe it.', check: (lab) => lab.x.so2, demo: (lab) => burnS(lab) },
    { phase: 'Non-metal oxide', text: 'Pour some of the solution from the gas jar into a test tube and test it with the papers.', check: (lab) => lab.rows.some((r) => r._key === 'so2'), demo: async (lab, api) => { await dissolve(lab, api, 'so2'); } },
    { phase: 'More oxides', text: 'Dissolve a little sodium oxide in water in a test tube and test the solution.', check: (lab) => lab.rows.some((r) => r._key === 'na2o'), demo: async (lab, api) => { const t = await api.addSample(lab, 'na2o'); await api.addReagent(lab, 'water', 3, t); await paperRecord(lab, api, t); } },
    { phase: 'More oxides', text: 'Test soda water (carbon dioxide dissolved in water).', check: (lab) => lab.rows.some((r) => r._key === 'soda'), demo: async (lab, api) => { const t = await api.addSample(lab, 'soda'); await paperRecord(lab, api, t); } },
  ],
  actions: [{ label: 'Test with papers', run: async (lab, api) => { const t = api.cur(lab); if (t && t.goal && t.goal.pH != null) await api.paperTest(lab, t); else lab.toast('Put an oxide solution in a tube first.', 'err'); } }],
  columns: [{ key: 'oxide', label: 'Oxide' }, { key: 'litmus', label: 'Litmus' }, { key: 'pH', label: 'pH' }, { key: 'class', label: 'Nature' }],
  row: (lab, t) => (t.paper ? { _key: t.contents.sample, oxide: OX[t.contents.sample].oxide, litmus: t.paper.litmus, pH: String(t.paper.pH), class: t.paper.cls === 'Acidic' ? 'Acidic' : t.paper.cls === 'Basic' ? 'Basic' : 'Neutral' } : (lab.toast('Test the solution with the papers first.', 'err'), null)),
  tableNote: 'Oxides of metals dissolve to give alkalis; oxides of non-metals give acids.',
  obsRows: 4,
  obsKeys: ['oxide', 'litmus', 'pH', 'class'],
  state: () => ({ ash: false, so2: false }),
  reset: (lab) => {
    lab.items.tongs.app.ribbon.visible = true; lab.items.tongs.app.ribbon.scale.x = 1;
    lab.items.spoon.app.sulphur.visible = true;
    const d = lab.items.dish.app.v; d.setLiquid(0); d.setPpt(0, 0xffffff, 0);
    lab.items.gasjar.app.v.setLiquid(8, 0xeef6fb, 0.2);
    lab.items.burner.app.flame.on = false;
  },
  result: (lab) => ({ items: lab.rows.map((r) => [r.oxide, `${r.class} (pH ${r.pH})`]).concat(lab.rows.length ? [] : [['Oxides tested', '—']]), note: 'MgO and Na₂O (metal oxides) are basic; SO₂ and CO₂ (non-metal oxides) are acidic.' }),
});

async function light(lab) {
  const b = lab.items.burner.app;
  if (!b.flame.on) await lab.touch(b.knob, () => { b.flame.on = true; lab.sfx('click'); }, { pose: 'pinch' });
}
async function tipTo(lab, key, p, e, dur = 1.0) {
  const it = lab.items[key];
  const q = new THREE.Quaternion().setFromEuler(e);
  await lab.holdAt(key, p.clone().sub(it.app.tipLocal.clone().applyQuaternion(q)), e, { dur, arc: 8 });
}
async function burnMg(lab) {
  await light(lab);
  const tg = lab.items.tongs;
  await lab.pickUp('tongs');
  const e = new THREE.Euler(0, Math.PI, 0.2);
  const flame = lab.items.burner.app.topWorld().add(V3(0.5, 4, 0));
  await tipTo(lab, 'tongs', flame, e);
  const rib = tg.app.ribbon;
  // it catches fire, then burns with a dazzling white light; hold it over the dish
  const over = lab.items.dish.group.localToWorld(V3(0, 7, 0));
  await tipTo(lab, 'tongs', over, e, 1.0);
  await lab.tween(3.0, (k) => { rib.scale.x = 1 - k * 0.95; flash(lab, tg.group.localToWorld(tg.app.tipLocal.clone()), 0xffffff, true); });
  flash(lab, null, 0xffffff, false);
  rib.visible = false;
  const d = lab.items.dish.app.v;
  d.setPpt(0.6, 0xf2f2ee, 0);
  lab.x.ash = true;
  lab.toast('Magnesium burnt with a dazzling white flame, leaving a white powder (MgO).', 'info', 4500);
  await lab.putBack('tongs');
}
async function burnS(lab) {
  await light(lab);
  const sp = lab.items.spoon;
  await lab.pickUp('spoon');
  const e = new THREE.Euler(0, Math.PI, 0.15);
  await tipTo(lab, 'spoon', lab.items.burner.app.topWorld().add(V3(0, 4, 0)), e);
  await lab.wait(1.2);
  // blue flame on the spoon
  sp.app.sulphur.material.color.set(0x9a3412);
  const jar = lab.items.gasjar;
  await tipTo(lab, 'spoon', jar.group.localToWorld(V3(0, 18, 0)), new THREE.Euler(0, Math.PI, Math.PI / 2 - 0.05), 1.0);
  const fx = lab.x.fume || (lab.x.fume = C.fumes(lab.scene, { col: 0xe7e5e4, opacity: 0.25, spread: 1.5, rise: 2 }));
  fx.origin.copy(jar.group.localToWorld(V3(0, 10, 0)));
  fx.rate = 0.8;
  flash(lab, jar.group.localToWorld(V3(0, 10, 0)), 0x4f7dff, true);
  await lab.wait(2.4);
  flash(lab, null, 0, false);
  fx.rate = 0;
  sp.app.sulphur.visible = false;
  await lab.putBack('spoon');
  // shake the jar (covered with the lid)
  await lab.pickUp('gasjar');
  const g = jar.group, R = lab.handR();
  await lab.tween(1.2, (e2, k) => { g.rotation.z = Math.sin(k * Math.PI * 6) * 0.2; void R; });
  g.rotation.z = 0;
  await lab.putBack('gasjar');
  lab.x.so2 = true;
  lab.toast('Sulphur burnt with a blue flame; the sulphur dioxide dissolved in the water in the jar.', 'info', 4500);
}
async function dissolve(lab, api, key) {
  let t = api.freshTube(lab);
  if (!t) return;
  t.used = true;
  if (key === 'mgo') {
    if (!lab.x.ash) await burnMg(lab);
    const d = lab.items.dish.app.v;
    await C.pour(lab, api.fx, 'r_water', 'dish', 6, { dur: 1.0, tilt: 1.2 });
    await lab.touch(lab.items.dish.group.localToWorld(V3(0, 2, 0)), async () => { await lab.wait(0.6); }, { pose: 'pinch' }); // stir
    d.color.set(0xf1f1ec); d.opacity = 0.6; d.setPpt(0.2, 0xf2f2ee, 0.3);
    await C.pour(lab, api.fx, 'dish', api.target(t), 3, { dur: 1.0, tilt: 1.3 });
  } else {
    if (!lab.x.so2) await burnS(lab);
    await C.pour(lab, api.fx, 'gasjar', api.target(t), 3, { dur: 1.0, tilt: 1.2 });
  }
  t.contents.sample = key;
  api.react(lab, t);
  await paperRecord(lab, api, t);
}
async function paperRecord(lab, api, t) {
  await api.paperTest(lab, t);
  await api.observe(lab, t, 0.8);
  api.record(lab, t);
}
