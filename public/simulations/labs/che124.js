// Tests for functional groups in organic compounds: unsaturation (bromine
// water), carboxylic acid (NaHCO₃), phenol (neutral FeCl₃), carbonyl
// (2,4-DNP), aldehyde (Tollens' reagent, warmed) and alcohol (ceric
// ammonium nitrate). Any reagent can be tried on any compound.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';
import { tubeTests } from './tubetests.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const COMPOUNDS = {
  hexene: { name: 'Cyclohexene', groups: ['ene'] },
  acid: { name: 'Acetic acid', groups: ['cooh'] },
  phenol: { name: 'Phenol', groups: ['phenol'], color: 0xf7f2ea },
  acetone: { name: 'Acetone', groups: ['co'] },
  ald: { name: 'Acetaldehyde', groups: ['co', 'cho'] },
  eth: { name: 'Ethanol', groups: ['oh'] },
};
const REAG = {
  br2: { name: 'Bromine water', color: 0xd9822b, opacity: 0.55, group: 'ene' },
  bicarb: { name: 'NaHCO₃ solution', bottle: true, mL: 2, color: 0xf4f7fa, opacity: 0.2, group: 'cooh' },
  fecl3: { name: 'Neutral FeCl₃', color: 0xd9a441, opacity: 0.5, group: 'phenol' },
  dnp: { name: '2,4-DNP reagent', color: 0xe8871e, opacity: 0.6, group: 'co' },
  tollens: { name: 'Tollens’ reagent', bottle: true, mL: 2, color: 0xf4f6f7, opacity: 0.25, group: 'cho' },
  can: { name: 'Ceric ammonium nitrate', color: 0xf2c14e, opacity: 0.55, group: 'oh' },
};
const RESULT = {
  br2: { yes: ['Orange colour of bromine water disappears', 'Unsaturation (C=C) present'], no: 'Orange colour remains' },
  bicarb: { yes: ['Brisk effervescence of CO₂', 'Carboxylic acid (–COOH) present'], no: 'No effervescence' },
  fecl3: { yes: ['Violet colouration', 'Phenolic –OH present'], no: 'No violet colour' },
  dnp: { yes: ['Yellow-orange precipitate', 'Carbonyl group (C=O) present'], no: 'No precipitate' },
  tollens: { yes: ['Silver mirror on warming', 'Aldehyde (–CHO) present'], no: 'No silver mirror' },
  can: { yes: ['Yellow solution turns red', 'Alcoholic –OH present'], no: 'Solution stays yellow' },
};

export default tubeTests({
  id: 'che124',
  title: 'Tests for functional groups in organic compounds',
  intro: 'Identify the functional groups in six organic compounds with the standard test reagents.',
  board: {
    title: 'Functional group tests',
    formulas: ['C=C : Br₂ water decolourised', '–COOH : effervescence with NaHCO₃', 'Phenol : violet with neutral FeCl₃', 'C=O : orange ppt with 2,4-DNP', '–CHO : silver mirror (Tollens’)'],
    steps: ['1 mL compound in a clean tube', 'Add the reagent, shake', 'Warm gently only where needed', 'Record observation and inference'],
    note: 'Organic compounds are flammable — no flames near them!',
  },
  samples: Object.entries(COMPOUNDS).map(([key, c], i) => ({ key, name: c.name, color: c.color ?? 0xf5f7f9, opacity: 0.22, mL: 1.5, labelColor: '#7c3aed', amber: key === 'phenol', slot: [-100 + i * 13 + (i >= 3 ? 24 : 0), -26, 0] })),
  reagents: Object.entries(REAG).map(([key, r], i) => ({ key, name: r.name, bottle: !!r.bottle, mL: r.mL, color: r.color, opacity: r.opacity, drops: 4, labelColor: '#b91c1c', slot: [30 + (i % 3) * 14, -24 + Math.floor(i / 3) * 16, 0] })),
  extraItems: {
    bath: { name: 'Beaker of warm water (water bath)', label: 'Warm water bath', build: () => { const b = C.beaker(250); b.setLiquid(150, 0xdbeafe, 0.3); return Object.assign(b.app, { v: b }); }, slot: [84, 14, 0] },
  },
  react: (lab, c, t) => {
    const comp = COMPOUNDS[c.sample];
    if (!comp) return null;
    const keys = Object.keys(c.reag);
    if (!keys.length) return { color: comp.color ?? 0xf5f7f9, opacity: 0.22, obs: `${comp.name} (colourless liquid)` };
    const k = keys[keys.length - 1], r = REAG[k], pos = comp.groups.includes(r.group);
    const res = RESULT[k];
    if (k === 'tollens' && pos && !t.warmed) return { color: r.color, opacity: 0.25, obs: 'Mixed with Tollens’ reagent — warm it in the water bath', inf: '' };
    if (!pos) return { color: r.color, opacity: r.opacity * 0.8, obs: `${r.name}: ${res.no}`, inf: `No ${r.group === 'ene' ? 'unsaturation' : `${res.yes[1].split(' present')[0]}`} in ${comp.name.toLowerCase()}` };
    const base = { obs: `${r.name}: ${res.yes[0]}`, inf: res.yes[1] };
    if (k === 'br2') return { ...base, color: 0xf6f7f5, opacity: 0.22, rate: 1.1 };
    if (k === 'bicarb') return { ...base, color: 0xf4f7fa, opacity: 0.22, bubbles: 1, fumesCold: false };
    if (k === 'fecl3') return { ...base, color: 0x6b21a8, opacity: 0.75 };
    if (k === 'dnp') return { ...base, color: 0xe8871e, opacity: 0.65, ppt: 0.8, pptColor: 0xf2a024, turbid: 0.6 };
    if (k === 'tollens') return { ...base, color: 0x9ca3af, opacity: 0.6, mirror: true };
    return { ...base, color: 0xb91c1c, opacity: 0.7 };
  },
  tick: (lab, t, dt) => {
    if (t.goal && t.goal.bubbles) t.goal.bubbles = Math.max(0, t.goal.bubbles - dt * 0.08); // effervescence dies away
    const mir = !!(t.goal && t.goal.mirror);
    if (mir && !t.mirrorOn) { t.mirrorOn = true; t.glassMat = t.v.glass.material; t.v.glass.material = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 1, roughness: 0.15, transparent: true, opacity: 0.2, side: THREE.DoubleSide }); }
    if (t.mirrorOn) { if (!mir) { t.v.glass.material = t.glassMat; t.mirrorOn = false; } else t.v.glass.material.opacity = Math.min(0.92, t.v.glass.material.opacity + dt * 0.25); }
  },
  actions: [{ label: 'Warm in water bath', run: (lab, api) => warm(lab, api) }],
  tests: [
    { sample: 'hexene', reagents: [{ key: 'br2' }], text: 'Unsaturation: add bromine water drop by drop to cyclohexene and shake.', why: 'Bromine adds across the C=C double bond, so its orange colour is used up.' },
    { sample: 'acid', reagents: [{ key: 'bicarb' }], text: 'Carboxylic acid: add sodium hydrogencarbonate solution to acetic acid.', why: 'Carboxylic acids are strong enough to release CO₂ from hydrogencarbonates; phenols are not.' },
    { sample: 'phenol', reagents: [{ key: 'fecl3' }], text: 'Phenol: add a few drops of neutral iron(III) chloride to phenol.' },
    { sample: 'acetone', reagents: [{ key: 'dnp' }], text: 'Carbonyl group: add 2,4-dinitrophenylhydrazine reagent to acetone.', why: 'Aldehydes and ketones both give the orange 2,4-dinitrophenylhydrazone.' },
    { text: 'Aldehyde: add Tollens’ reagent to acetaldehyde and warm the tube in the water bath.', why: 'Aldehydes reduce the silver-ammonia complex to metallic silver, which coats the glass. Ketones do not.', demo: async (lab, api) => { const t = await api.addSample(lab, 'ald'); if (!t) return; await api.addReagent(lab, 'tollens', 2, t); await warm(lab, api); await api.observe(lab, t, 1.5); api.record(lab, t); } },
    { sample: 'eth', reagents: [{ key: 'can' }], text: 'Alcohol: add ceric ammonium nitrate solution to ethanol.' },
  ],
  columns: [{ key: 'test', label: 'Test' }, { key: 'observation', label: 'Observation' }, { key: 'inference', label: 'Inference' }],
  row: (lab, t) => { const k = Object.keys(t.contents.reag).pop(); if (!k) { lab.toast('Add a test reagent first.', 'err'); return null; } return { _key: `${t.contents.sample}-${k}`, test: `${REAG[k].name} + ${COMPOUNDS[t.contents.sample].name}`, observation: t.goal.obs.split(': ').slice(1).join(': ') || t.goal.obs, inference: t.goal.inf || '' }; },
  tableNote: 'Record the observation and what it tells you about the compound.',
  obsRows: 5,
  obsKeys: ['test', 'observation', 'inference'],
  resultNote: 'Each test is specific to one functional group; 2,4-DNP detects both aldehydes and ketones, Tollens’ only aldehydes.',
});

async function warm(lab, api) {
  const t = api.cur(lab);
  if (!t || !t.used) { lab.toast('Select a test tube first.', 'err'); return; }
  const bath = lab.items.bath.group, R = lab.handR();
  const g = t.group, home = g.position.clone(), rack = g.parent;
  await lab.touch(g.localToWorld(V3(0, 14, 0.9)), null, { pose: 'pinch', lift: 0 });
  lab.scene.attach(g);
  const s0 = g.position.clone();
  const dest = bath.localToWorld(V3(0, 1.2, 0));
  await lab.tween(1.1, (e) => { g.position.lerpVectors(s0, dest, e); g.position.y += Math.sin(Math.PI * e) * 12; R.goal.copy(g.localToWorld(V3(0, 13.5, 0.9))); });
  await lab.wait(2.4);
  t.warmed = true;
  api.react(lab, t);
  await lab.wait(1.2);
  const s1 = g.position.clone(), back = rack.localToWorld(home.clone());
  await lab.tween(1.1, (e) => { g.position.lerpVectors(s1, back, e); g.position.y += Math.sin(Math.PI * e) * 12; R.goal.copy(g.localToWorld(V3(0, 13.5, 0.9))); });
  rack.attach(g); g.position.copy(home); g.rotation.set(0, 0, 0);
}
