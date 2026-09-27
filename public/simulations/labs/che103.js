// Reactions of sodium hydroxide with salt solutions: the colour of the
// metal hydroxide precipitate identifies the cation; zinc hydroxide
// redissolves in excess alkali.
import { tubeTests } from './tubetests.js';

const SALTS = {
  feso4: { name: 'FeSO₄', color: 0xcfe6bf, opacity: 0.3, ppt: 0x5b6e3e, obs: 'Dirty green precipitate', inf: 'Fe²⁺ ion present (Fe(OH)₂)' },
  fecl3: { name: 'FeCl₃', color: 0xd9a441, opacity: 0.45, ppt: 0x8a3b14, obs: 'Reddish-brown precipitate', inf: 'Fe³⁺ ion present (Fe(OH)₃)' },
  cuso4: { name: 'CuSO₄', color: 0x3b8fd9, opacity: 0.45, ppt: 0x5aa7e8, obs: 'Pale blue precipitate', inf: 'Cu²⁺ ion present (Cu(OH)₂)' },
  znso4: { name: 'ZnSO₄', color: 0xf3f6f8, opacity: 0.2, ppt: 0xf4f4f2, obs: 'White gelatinous precipitate', inf: 'Zn²⁺ ion present (Zn(OH)₂)' },
};

export default tubeTests({
  id: 'che103',
  title: 'Reaction of sodium hydroxide with salt solutions',
  intro: 'Add sodium hydroxide solution to solutions of iron(II), iron(III), copper(II) and zinc salts and identify each metal ion from the precipitate it forms.',
  board: {
    title: 'Metal ions with NaOH',
    formulas: ['M²⁺ + 2OH⁻ → M(OH)₂↓', 'Fe³⁺ + 3OH⁻ → Fe(OH)₃↓'],
    steps: ['Take 2 mL of salt solution in a clean tube', 'Add NaOH drop by drop; shake', 'Note the colour of the precipitate', 'Add excess NaOH: does it dissolve?'],
    note: 'Fe²⁺ green · Fe³⁺ red-brown · Cu²⁺ blue · Zn²⁺ white',
  },
  samples: Object.entries(SALTS).map(([key, s], i) => ({ key, name: `${s.name} solution`, color: s.color, opacity: s.opacity, labelColor: ['#15803d', '#b45309', '#1d4ed8', '#475569'][i] })),
  reagents: [
    { key: 'naoh', name: 'NaOH (dil.)', color: 0xf4f7fa, opacity: 0.25, drops: 4, labelColor: '#1d4ed8' },
    { key: 'naohx', name: 'NaOH (excess)', bottle: true, mL: 3, color: 0xf4f7fa, opacity: 0.2, labelColor: '#1e3a8a', slot: [82, -24, 0] },
  ],
  react: (lab, c) => {
    const s = SALTS[c.sample];
    if (!s) return null;
    const oh = (c.reag.naoh || 0) + (c.reag.naohx || 0) * 20; // 1 mL ≈ 20 drops
    if (!oh) return { color: s.color, opacity: s.opacity, obs: `${s.name} solution: ${c.sample === 'znso4' ? 'colourless' : 'coloured'} solution` };
    if (c.sample === 'znso4' && oh > 30) return { color: 0xf4f7fa, opacity: 0.22, ppt: 0, turbid: 0, obs: 'White precipitate dissolves in excess NaOH (colourless solution)', inf: 'Zn²⁺ confirmed — Zn(OH)₂ is amphoteric', rate: 0.8 };
    const amount = Math.min(1, oh / 8);
    return { color: s.color, opacity: s.opacity, ppt: amount, pptColor: s.ppt, turbid: 0.7 * amount, obs: s.obs + (c.sample !== 'znso4' && oh > 30 ? ' (insoluble in excess)' : ''), inf: s.inf, rate: 1.4 };
  },
  tests: [
    { sample: 'feso4', reagents: [{ key: 'naoh' }], text: 'Take about 2 mL of iron(II) sulphate solution in a test tube and add dilute NaOH drop by drop. Shake and observe.', why: 'Fe(OH)₂ is dirty green; on standing in air it slowly turns brown as it is oxidised.' },
    { sample: 'fecl3', reagents: [{ key: 'naoh' }], text: 'Repeat with iron(III) chloride solution.' },
    { sample: 'cuso4', reagents: [{ key: 'naoh' }], text: 'Repeat with copper sulphate solution.' },
    { sample: 'znso4', reagents: [{ key: 'naoh' }], text: 'Repeat with zinc sulphate solution.' },
    { phase: 'Excess alkali', text: 'Add excess NaOH to the zinc sulphate tube and shake. Then do the same for one of the other precipitates.', why: 'Amphoteric Zn(OH)₂ dissolves in excess alkali to form sodium zincate; the others do not.', demo: async (lab, api) => { const t = api.tubes(lab).find((q) => q.contents.sample === 'znso4') || await api.addSample(lab, 'znso4'); lab.x.cur = t.i; if (!t.contents.reag.naoh) await api.addReagent(lab, 'naoh', 4, t); await api.addReagent(lab, 'naohx', 3, t); await api.shake(lab, t); await api.observe(lab, t, 2); api.record(lab, t); } },
  ],
  columns: [{ key: 'salt', label: 'Salt solution' }, { key: 'observation', label: 'Observation' }, { key: 'inference', label: 'Inference' }],
  row: (lab, t) => ({ _key: t.goal.obs, salt: SALTS[t.contents.sample].name, observation: t.goal.obs, inference: t.goal.inf || '' }),
  tableNote: 'The colour of the hydroxide precipitate identifies the metal ion.',
  obsRows: 2,
  obsKeys: ['salt', 'observation', 'inference'],
  resultNote: 'Fe²⁺ → green, Fe³⁺ → reddish-brown, Cu²⁺ → blue, Zn²⁺ → white (soluble in excess).',
});
