// Rate of reaction of a carbonate with a strong and a weak acid: marble chips
// with dilute HCl and with dilute acetic acid, timed until the lime water
// turns milky.
import * as C from '../lab-engine/chem.js';
import { tubeTests } from './tubetests.js';
import { demoFit, limeWaterGoal } from './gas.js';

const ACIDS = { hcl: { name: 'Dilute HCl', k: 1.0, medium: 'Dilute HCl' }, acetic: { name: 'Dilute acetic acid', k: 0.16, medium: 'Dilute acetic acid' } };
const RUNS = [{ acid: 'hcl', gen: 0, lime: 2 }, { acid: 'acetic', gen: 3, lime: 5 }];

export default tubeTests({
  id: 'che104',
  title: 'Reaction of carbonates with acids — rate of reaction',
  intro: 'Compare how fast marble chips react with dilute hydrochloric acid and with dilute acetic acid by timing how long the lime water takes to turn milky.',
  board: {
    title: 'Carbonate + acid: strong vs weak',
    formulas: ['CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂', 'CaCO₃ + 2CH₃COOH → (CH₃COO)₂Ca + H₂O + CO₂'],
    steps: ['Same mass of chips, same volume of acid', 'Fit the delivery tube into lime water', 'Start the stopwatch as the acid is added', 'Stop when the lime water turns milky', 'Compare the two acids'],
    note: 'A strong acid has more H⁺ ions: faster reaction',
  },
  samples: [
    { key: 'marble', name: 'Marble chips', solid: true, color: 0xe5e3dc, slot: [-80, -22, 0] },
    { key: 'lime', name: 'Lime water', color: 0xf4f7f6, opacity: 0.22, mL: 3, labelColor: '#0f766e', slot: [-56, -26, 0] },
  ],
  reagents: [
    { key: 'hcl', name: 'Dilute HCl', bottle: true, mL: 3, color: 0xf5f8fa, opacity: 0.2, labelColor: '#dc2626', slot: [34, -24, 0] },
    { key: 'acetic', name: 'Dilute acetic acid', bottle: true, mL: 3, color: 0xf7f4ea, opacity: 0.22, labelColor: '#78350f', slot: [50, -24, 0] },
  ],
  extraItems: { watch: { name: 'Stopwatch', label: 'Stopwatch', build: () => { const s = C.stopwatch(); return Object.assign(s.app, { sw: s }); }, slot: [70, 14, 0] } },
  state: () => ({ timer: 0, timing: false, runAcid: null }),
  react: (lab, c, t) => {
    if (c.sample === 'lime') return limeWaterGoal(t.co2 || 0);
    if (c.sample === 'marble') {
      const a = Object.keys(c.reag)[0];
      if (!a) return { color: 0xffffff, opacity: 0.2, obs: 'Marble chips (white solid)' };
      const r = ACIDS[a].k * (t.chips ?? 1);
      return { color: 0xf5f8fa, opacity: 0.22, bubbles: r, obs: a === 'hcl' ? 'Brisk effervescence' : 'Slow effervescence', inf: '' };
    }
    return null;
  },
  tick: (lab, t, dt, api) => {
    const a = Object.keys(t.contents.reag)[0];
    if (t.contents.sample === 'marble' && a && (t.chips ?? 1) > 0) {
      t.chips = Math.max(0, (t.chips ?? 1) - dt / 120);
      const rate = ACIDS[a].k * t.chips;
      if (t.goal) t.goal.bubbles = rate;
      if (t.limeTube) { const L = t.limeTube; L.co2 = (L.co2 || 0) + rate * dt; api.react(lab, L); L.goal.bubbles = Math.min(1, rate * 1.2); }
    }
  },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.timing) {
      x.timer += dt;
      const run = RUNS.find((r) => r.acid === x.runAcid);
      if (run && lab.items.rack.app.tubes[run.lime].v.turbid > 0.5) { x.timing = false; x.stoppedAt = x.timer + 0.15 + (Math.random() - 0.5) * 0.1; }
    }
    if (x.stoppedAt != null && !x.timing) { x.timer = x.stoppedAt; }
  },
  update: (lab) => { lab.items.watch.app.sw.show(lab.x.timer || 0); },
  tests: RUNS.map((run, i) => ({
    phase: ACIDS[run.acid].name,
    text: `Marble chips in one tube and lime water in another; add ${ACIDS[run.acid].name.toLowerCase()}, fit the delivery tube, start the stopwatch and time until the lime water turns milky.`,
    why: i === 0 ? 'Use the same amount of chips and acid in both runs, so only the acid differs.' : 'Acetic acid is a weak acid: far fewer H⁺ ions, so CO₂ is given off slowly.',
    demo: async (lab, api) => {
      const tubes = lab.items.rack.app.tubes, g = tubes[run.gen], l = tubes[run.lime];
      if (g.used || l.used) { await api.cleanAll(lab); }
      await api.addSample(lab, 'marble', g);
      await api.addSample(lab, 'lime', l);
      await lab.touch(lab.items.watch.group.localToWorld(lab.V3(0, 5, -0.9)), null, { pose: 'press' });
      await api.addReagent(lab, run.acid, 3, g);
      lab.x.timer = 0; lab.x.stoppedAt = null; lab.x.timing = true; lab.x.runAcid = run.acid;
      await demoFit(lab, g, l);
      lab.x.cur = run.lime;
      await lab.waitFor(() => !lab.x.timing, 120);
      await api.observe(lab, l, 1);
      lab.x.cur = run.gen;
      api.record(lab, g);
    },
  })),
  columns: [{ key: 'medium', label: 'Acid' }, { key: 'observation', label: 'Observation' }, { key: 'time', label: 'Time to milky (s)' }],
  row: (lab, t) => { const a = Object.keys(t.contents.reag)[0]; if (!a || lab.x.timing) { lab.toast('Wait until the lime water turns milky.', 'err'); return null; } return { _key: a, medium: ACIDS[a].medium, observation: a === 'hcl' ? 'Brisk effervescence; lime water milky quickly' : 'Slow effervescence; lime water milky after a long time', time: (lab.x.timer || 0).toFixed(1) }; },
  tableNote: 'The shorter the time, the faster the reaction.',
  obsRows: 2,
  obsKeys: ['medium', 'observation', 'time'],
  result: (lab) => { const r = lab.rows; const h = r.find((q) => q.medium === 'Dilute HCl'), a = r.find((q) => q.medium !== 'Dilute HCl'); return { items: [['HCl', h ? `${h.time} s` : '—'], ['Acetic acid', a ? `${a.time} s` : '—'], ['Faster', h && a ? (+h.time < +a.time ? 'HCl (strong acid)' : 'acetic acid') : '—']], note: 'Both acids give CO₂ with a carbonate, but the strong acid reacts much faster.' }; },
});
