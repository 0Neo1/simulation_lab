// Molarity of NaOH by titration against standard 0.5 M oxalic acid (phenolphthalein)
import { titration } from './titration.js';

export default titration({
  id: 'che123',
  title: 'Titration — NaOH against standard oxalic acid',
  intro: 'Find the molarity of a sodium hydroxide solution by titrating it against standard 0.5 M oxalic acid, using phenolphthalein as the indicator.',
  titrant: { name: 'NaOH solution', short: 'NaOH', sub: 'unknown molarity', color: 0xf3f7fa, opacity: 0.2, buretteOpacity: 0.35, labelColor: '#1d4ed8' },
  analyte: { name: 'Oxalic acid', short: 'oxalic acid', sub: '0.5 M (standard)', color: 0xf6f8fa, opacity: 0.18, colourName: 'colourless', labelColor: '#b45309' },
  indicator: { name: 'Phenolphthalein', drops: 2, bottleColor: 0xf5f5f5, dropColor: 0xf5f5f5, note: 'Phenolphthalein is colourless in acid — the solution stays colourless.', why: 'Phenolphthalein changes from colourless to pink between pH 8.2 and 10, just past the equivalence point of a weak acid with a strong base.' },
  endColor: 0xff2e93, flashColor: 0xff4fa8, endOpacity: 0.55, endName: 'pink', beforeName: 'colourless',
  endText: 'the first permanent faint pink that stays for 30 seconds after swirling.',
  unknownM: () => 0.9 + Math.random() * 0.2,
  equivalence: (M, V) => (2 * 0.5 * V) / M, // (COOH)2 + 2 NaOH → (COONa)2 + 2 H2O
  molarity: (Vt, V) => (2 * 0.5 * V) / Vt,
  resultLabel: 'Molarity of NaOH',
  equation: 'H₂C₂O₄ + 2 NaOH → Na₂C₂O₄ + 2 H₂O, so M_NaOH = 2 × 0.5 × V_ox / V_NaOH.',
  extraResult: (M) => [['Strength of NaOH', `${(M * 40).toFixed(1)} g/L`]],
  keys: { aliquot: 'V_Ox', titrant: 'V_NaOH' },
  board: {
    title: 'Titration: NaOH vs oxalic acid',
    formulas: ['H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O', 'M₁V₁ / n₁ = M₂V₂ / n₂', 'M(NaOH) = 2 × 0.5 × 20 / V'],
    steps: ['Rinse & fill burette with NaOH, set zero', 'Pipette 20 mL oxalic acid into flask', 'Add 2 drops phenolphthalein', 'Titrate till faint permanent pink', 'Repeat for concordant readings'],
    note: 'Never blow out the last drop of the pipette!',
  },
});
