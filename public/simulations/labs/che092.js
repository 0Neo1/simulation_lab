// Carbon dioxide from limestone (marble chips) and dilute hydrochloric acid,
// passed through lime water through a delivery tube.
import { tubeTests } from './tubetests.js';
import { demoFit, limeWaterGoal } from './gas.js';

export default tubeTests({
  id: 'che092',
  title: 'Carbon dioxide and lime water',
  intro: 'Prepare carbon dioxide from marble chips and dilute hydrochloric acid and test it by passing it through lime water.',
  board: {
    title: 'Test for carbon dioxide',
    formulas: ['CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑', 'Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O  (milky)', 'CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂  (clear)'],
    steps: ['Marble chips in a test tube', 'Fresh lime water in another tube', 'Add dilute HCl; fit cork and delivery tube', 'Delivery tube dips into lime water', 'Observe: lime water turns milky'],
    note: 'Keep the cork tight so the gas goes through the lime water',
  },
  samples: [
    { key: 'marble', name: 'Marble chips', solid: true, color: 0xe5e3dc, slot: [-80, -22, 0] },
    { key: 'lime', name: 'Lime water', color: 0xf4f7f6, opacity: 0.22, mL: 3, labelColor: '#0f766e', slot: [-56, -26, 0] },
  ],
  reagents: [{ key: 'hcl', name: 'Dilute HCl', bottle: true, mL: 3, color: 0xf5f8fa, opacity: 0.2, labelColor: '#dc2626', slot: [40, -24, 0] }],
  react: (lab, c, t) => {
    if (c.sample === 'lime') return limeWaterGoal(t.co2 || 0);
    if (c.sample === 'marble') {
      if (!c.reag.hcl) return { color: 0xffffff, opacity: 0.2, obs: 'Marble chips (white solid)' };
      const r = t.chips ?? 1;
      return { color: 0xf5f8fa, opacity: 0.22, bubbles: r, obs: r > 0.1 ? 'Brisk effervescence — a colourless gas is given off' : 'Effervescence has stopped', inf: 'A gas is evolved from the carbonate' };
    }
    return null;
  },
  tick: (lab, t, dt, api) => {
    if (t.contents.sample === 'marble' && t.contents.reag.hcl && (t.chips ?? 1) > 0) {
      t.chips = Math.max(0, (t.chips ?? 1) - dt / 90);
      if (t.goal) t.goal.bubbles = t.chips;
      if (t.limeTube) { const L = t.limeTube; L.co2 = (L.co2 || 0) + t.chips * dt; api.react(lab, L); L.goal.bubbles = Math.min(1, t.chips * 1.2); }
    }
  },
  tests: [
    { phase: 'Prepare', text: 'Put a few marble chips in a clean test tube.', check: (lab) => lab.items.rack.app.tubes[0].contents.sample === 'marble', demo: async (lab, api) => { await api.addSample(lab, 'marble', lab.items.rack.app.tubes[0]); } },
    { phase: 'Prepare', text: 'Pour about 3 mL of fresh, clear lime water into a second test tube.', why: 'Lime water is a solution of calcium hydroxide; it must be clear to start with.', check: (lab) => lab.items.rack.app.tubes[2].contents.sample === 'lime', demo: async (lab, api) => { await api.addSample(lab, 'lime', lab.items.rack.app.tubes[2]); } },
    { phase: 'Reaction', text: 'Add dilute HCl to the marble chips and at once fit the cork with the delivery tube dipping into the lime water.', check: (lab) => !!lab.items.rack.app.tubes[0].delivery, demo: async (lab, api) => { const [g, , l] = lab.items.rack.app.tubes; await api.addReagent(lab, 'hcl', 3, g); await demoFit(lab, g, l); } },
    { phase: 'Reaction', text: 'Watch the lime water as the gas bubbles through it, then record your observation.', why: 'Only carbon dioxide turns lime water milky: insoluble calcium carbonate forms.', demo: async (lab, api) => { const l = lab.items.rack.app.tubes[2]; lab.x.cur = 2; await lab.waitFor(() => l.v.turbid > 0.5, 40); await api.observe(lab, l, 2); api.record(lab, l); } },
  ],
  columns: [{ key: 'observation', label: 'Observation' }, { key: 'inference', label: 'Inference' }],
  row: (lab, t) => (t.contents.sample === 'lime' && t.v.turbid > 0.4 ? { _key: 'co2', observation: 'Brisk effervescence in the acid; lime water turns milky', inference: 'The gas is carbon dioxide (CO₂)' } : (lab.toast('Record when the lime water has turned milky.', 'err'), null)),
  tableNote: 'If CO₂ is bubbled for a long time the milkiness disappears (soluble calcium hydrogencarbonate).',
  obsRows: 1,
  obsKeys: ['observation', 'inference'],
  result: (lab) => ({ items: [['Gas', lab.rows.length ? 'carbon dioxide' : '—'], ['Lime water', lab.items.rack.app.tubes[2].v.turbid > 0.4 ? 'milky' : 'clear']], note: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂; CO₂ + Ca(OH)₂ → CaCO₃ (milky) + H₂O.' }),
});
