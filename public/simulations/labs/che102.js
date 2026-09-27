// Ammonia from ammonium chloride and sodium hydroxide on heating; tested with
// moist red litmus paper and a glass rod dipped in concentrated HCl.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';
import { tubeTests } from './tubetests.js';
import { heatTube, returnTube } from './gas.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export default tubeTests({
  id: 'che102',
  title: 'Ammonium chloride with sodium hydroxide',
  intro: 'Heat ammonium chloride with sodium hydroxide solution and identify the gas given off.',
  board: {
    title: 'Test for ammonia',
    formulas: ['NH₄Cl + NaOH → NaCl + H₂O + NH₃↑', 'NH₃ + HCl → NH₄Cl  (white fumes)'],
    steps: ['A little NH₄Cl + 2 mL NaOH in a tube', 'Heat gently with a tube holder', 'Waft the gas towards you — do not sniff', 'Moist red litmus at the mouth → blue', 'HCl rod at the mouth → dense white fumes'],
    note: 'Point the mouth of the tube away from everyone!',
  },
  samples: [{ key: 'nh4cl', name: 'Ammonium chloride', solid: true, color: 0xf4f4f0, slot: [-80, -22, 0] }],
  reagents: [
    { key: 'naoh', name: 'NaOH solution', bottle: true, mL: 2, color: 0xf4f7fa, opacity: 0.2, labelColor: '#1d4ed8', slot: [-56, -24, 0] },
    { key: 'hcl', name: 'Conc. HCl', color: 0xf3f6f5, opacity: 0.25, labelColor: '#dc2626', slot: [56, -22, 0] },
  ],
  extraItems: {
    burner: { name: 'Bunsen burner', label: 'Bunsen burner', build: () => { const b = C.bunsenBurner(); return Object.assign(b.app, { flame: b.flame, knob: b.knob, topWorld: b.topWorld }); }, slot: [36, -10, 0], why: 'Heat gently: the gas comes off well below boiling.' },
    holder: { name: 'Test-tube holder', label: 'Holder', build: () => C.testTubeHolder(), slot: [36, 20, 0] },
    litmus: { name: 'Red litmus papers', label: 'Red litmus', build: () => C.litmusVial('red'), slot: [76, -18, 0] },
    rod: { name: 'Glass rod', label: 'Glass rod', build: () => C.glassRod(18), slot: [70, 22, 0] },
  },
  state: () => ({ stage: null }),
  react: (lab, c, t) => {
    if (c.sample !== 'nh4cl') return null;
    if (!c.reag.naoh) return { color: 0xffffff, opacity: 0.2, obs: 'White crystalline solid' };
    if ((t.heat || 0) < 0.2 && !t.heated) return { color: 0xf4f7fa, opacity: 0.22, obs: 'Faint smell of ammonia in the cold', inf: '' };
    t.heated = true;
    const s = lab.x.stage;
    return {
      color: 0xf4f7fa, opacity: 0.22, bubbles: t.heat > 0.5 ? 0.25 : 0.05, fumes: t.heat > 0.5 ? 0.25 : 0,
      obs: s === 'hcl' ? 'Dense white fumes form at the mouth' : s === 'litmus' ? 'Pungent smell; moist red litmus turns blue' : 'A colourless gas with a pungent smell is given off',
      inf: s === 'hcl' ? 'NH₃ confirmed — white fumes are NH₄Cl' : s === 'litmus' ? 'Ammonia (NH₃), a basic gas, is evolved' : '',
    };
  },
  tests: [
    { phase: 'Prepare', text: 'Put a little ammonium chloride in a clean test tube and add about 2 mL of sodium hydroxide solution.', check: (lab) => !!lab.items.rack.app.tubes[0].contents.reag.naoh, demo: async (lab, api) => { const t = await api.addSample(lab, 'nh4cl', lab.items.rack.app.tubes[0]); await api.addReagent(lab, 'naoh', 2, t); } },
    { phase: 'Heat', text: 'Light the burner, hold the tube in the holder and heat it gently. Test the gas with moist red litmus paper at the mouth.', why: 'A basic gas turns moist red litmus blue. Ammonia is the only common alkaline gas.', check: (lab) => lab.rows.some((r) => r._key === 'litmus'), demo: async (lab, api) => { const t = lab.items.rack.app.tubes[0]; lab.x.cur = 0; await heatTube(lab, api, t, 3); await litmusAtMouth(lab, api, t); api.record(lab, t); } },
    { phase: 'Heat', text: 'Bring a glass rod dipped in concentrated HCl near the mouth of the tube.', why: 'Ammonia and hydrogen chloride combine to form a dense white smoke of ammonium chloride.', check: (lab) => lab.rows.some((r) => r._key === 'hcl'), demo: async (lab, api) => { const t = lab.items.rack.app.tubes[0]; lab.x.cur = 0; if (!t.heldAt) await heatTube(lab, api, t, 2); await hclRod(lab, api, t); api.record(lab, t); await returnTube(lab, t); } },
  ],
  actions: [
    { label: 'Heat the tube', run: async (lab, api) => { const t = api.cur(lab); if (!t) return; await heatTube(lab, api, t, 3); } },
    { label: 'Red litmus at mouth', run: async (lab, api) => { const t = api.cur(lab); if (t && t.heldAt) await litmusAtMouth(lab, api, t); else lab.toast('Heat the tube first (hold it in the holder).', 'err'); } },
    { label: 'HCl rod at mouth', run: async (lab, api) => { const t = api.cur(lab); if (t && t.heldAt) await hclRod(lab, api, t); else lab.toast('Heat the tube first.', 'err'); } },
    { label: 'Put tube back', run: async (lab, api) => { const t = api.cur(lab); if (t) await returnTube(lab, t); } },
  ],
  columns: [{ key: 'observation', label: 'Observation' }, { key: 'inference', label: 'Inference' }],
  row: (lab, t) => (t.goal && t.goal.inf ? { _key: lab.x.stage, observation: t.goal.obs, inference: t.goal.inf } : (lab.toast('Carry out the gas test first.', 'err'), null)),
  tableNote: 'Never smell a gas directly — waft it towards your nose with your hand.',
  obsRows: 2,
  obsKeys: ['observation', 'inference'],
  result: (lab) => ({ items: [['Gas evolved', lab.rows.length ? 'Ammonia (NH₃)' : '—'], ['Tests done', `${lab.rows.length} of 2`]], note: 'NH₄Cl + NaOH → NaCl + H₂O + NH₃. Ammonia is the only common gas that is alkaline.' }),
});

async function litmusAtMouth(lab, api, t) {
  const mouth = t.group.localToWorld(V3(0, 16.5, 0));
  const strip = C.paperStrip(0xd6453d, 0.9, 3.2);
  const vial = lab.items.litmus.group;
  const L = lab.handL();
  await lab.handTo(L, vial.getWorldPosition(V3()).add(V3(0, 6, 0)), { pose: 'pinch', contact: 'pinch', dur: 0.7 });
  lab.scene.add(strip.group);
  strip.group.position.copy(L.goal).add(V3(0, -0.5, 0));
  const s0 = strip.group.position.clone(), dest = mouth.clone().add(V3(1.2, 1.4, 0));
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  await lab.tween(1.0, (e) => { strip.group.position.lerpVectors(s0, dest, e); strip.group.quaternion.slerpQuaternions(new THREE.Quaternion(), q, e); L.goal.copy(strip.group.position).add(V3(0, 1.8, 0)); });
  const c0 = strip.mat.color.clone();
  await lab.tween(1.4, (e) => { strip.mat.color.copy(c0).lerp(new THREE.Color(0x3b6fd8), e); });
  lab.x.stage = 'litmus';
  api.react(lab, t);
  await lab.wait(0.6);
  lab.stripMeshes.push(strip.group);
  L.setPose('flat', 'palm');
}
async function hclRod(lab, api, t) {
  const rod = lab.items.rod;
  const mouth = t.group.localToWorld(V3(0, 16.5, 0));
  await C.addDrops(lab, api.fx, api.reagentKey('hcl'), { topW: () => rod.group.localToWorld(V3(5, 0.4, 0)), surfW: () => rod.group.localToWorld(V3(5, 0.4, 0)), add: () => {} }, 1, { onDrop: () => {} });
  await lab.pickUp('rod');
  await lab.holdAt('rod', mouth.clone().add(V3(-3, 2, 0)), new THREE.Euler(0, 0, -0.6), { dur: 1.0 });
  lab.x.stage = 'hcl';
  api.react(lab, t);
  const smoke = lab.x.smoke || (lab.x.smoke = C.fumes(lab.scene, { col: 0xffffff, opacity: 0.6, spread: 2, rise: 4, max: 60 }));
  smoke.origin.copy(mouth.clone().add(V3(0, 1.5, 0)));
  smoke.rate = 1;
  await lab.wait(2.4);
  smoke.rate = 0;
  await lab.putBack('rod');
}
