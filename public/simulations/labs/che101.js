// Acidic and basic nature of food items with litmus and universal indicator
import * as C from '../lab-engine/chem.js';
import { tubeTests } from './tubetests.js';

const FOODS = {
  lemon: { name: 'Lemon juice', color: 0xf4e9a1, opacity: 0.45, pH: 2.3 },
  vinegar: { name: 'Vinegar', color: 0xf7f1dc, opacity: 0.25, pH: 2.9 },
  milk: { name: 'Milk', color: 0xfbfaf4, opacity: 0.95, pH: 6.6 },
  soda: { name: 'Baking soda solution', color: 0xf5f7f8, opacity: 0.3, pH: 8.4 },
  soap: { name: 'Soap solution', color: 0xeef1ea, opacity: 0.6, pH: 10.2 },
};

export default tubeTests({
  id: 'che101',
  title: 'Acidic and basic nature of food items',
  intro: 'Test lemon juice, vinegar, milk, baking-soda solution and soap solution with litmus paper and universal indicator paper, and classify them as acidic, basic or neutral.',
  board: {
    title: 'Acids and bases in food',
    formulas: ['Acid: blue litmus → red, pH < 7', 'Base: red litmus → blue, pH > 7', 'Neutral: no change, pH = 7'],
    steps: ['Take a little sample in a clean tube', 'Dip a clean glass rod in it', 'Touch blue and red litmus paper', 'Touch universal indicator paper', 'Match the colour with the pH chart'],
    note: 'Rinse the glass rod between samples!',
  },
  samples: Object.entries(FOODS).map(([key, s], i) => ({ key, name: s.name, color: s.color, opacity: s.opacity, labelColor: ['#ca8a04', '#78350f', '#0369a1', '#0f766e', '#7c3aed'][i], slot: [-100 + i * 14 + (i >= 3 ? 20 : 0), -26, 0] })),
  reagents: [],
  extraItems: {
    tile: { name: 'White tile with test papers', label: 'Tile & papers', build: () => C.whiteTile(14), slot: [48, 14, 0] },
    chart: { name: 'Universal indicator colour chart', label: 'pH chart', build: () => C.phChart(), slot: [48, -8, 0] },
    blue: { name: 'Blue litmus papers', label: 'Blue litmus', build: () => C.litmusVial('blue'), slot: [76, -18, 0] },
    red: { name: 'Red litmus papers', label: 'Red litmus', build: () => C.litmusVial('red'), slot: [88, -18, 0] },
  },
  react: (lab, c) => {
    const f = FOODS[c.sample];
    return f ? { color: f.color, opacity: f.opacity, pH: f.pH, obs: `${f.name} in the tube` } : null;
  },
  tests: Object.keys(FOODS).slice(0, 5).map((k, i) => ({
    phase: 'Tests',
    text: `Take a little ${FOODS[k].name.toLowerCase()} in a clean test tube; test it with blue litmus, red litmus and universal indicator paper.`,
    why: i === 0 ? 'Litmus only tells acid or base; universal indicator gives the pH.' : i === 2 ? 'Milk is very slightly acidic — close to neutral.' : '',
    demo: async (lab, api) => {
      const t = await api.addSample(lab, k);
      if (!t) return;
      const r = await api.paperTest(lab, t);
      t.goal.obs = `${FOODS[k].name}: litmus ${r.litmus.toLowerCase()}, pH ≈ ${r.pH}`;
      t.goal.inf = r.cls;
      await api.observe(lab, t, 1);
      api.record(lab, t);
    },
  })),
  actions: [{ label: 'Test with papers', run: async (lab, api) => { const t = api.cur(lab); if (!t || !t.goal) { lab.toast('Put a sample in a tube first.', 'err'); return; } const r = await api.paperTest(lab, t); t.goal.obs = `${FOODS[t.contents.sample].name}: litmus ${r.litmus.toLowerCase()}, pH ≈ ${r.pH}`; t.goal.inf = r.cls; } }],
  columns: [{ key: 'sample', label: 'Food sample' }, { key: 'litmus', label: 'Litmus' }, { key: 'pH', label: 'pH' }, { key: 'class', label: 'Nature' }],
  row: (lab, t) => (t.paper ? { _key: t.contents.sample, sample: FOODS[t.contents.sample].name, litmus: t.paper.litmus, pH: String(t.paper.pH), class: t.paper.cls === 'Acidic' ? 'Acid' : t.paper.cls === 'Basic' ? 'Base' : 'Neutral' } : (lab.toast('Test the sample with the papers first.', 'err'), null)),
  tableNote: 'Compare the universal-indicator colour with the chart to read the pH.',
  obsRows: 4,
  obsKeys: ['sample', 'litmus', 'pH', 'class'],
  resultNote: 'Citrus juices and vinegar are acidic; baking soda and soap are basic; milk is almost neutral.',
});
