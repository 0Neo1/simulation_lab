// Molarity of HCl by titration against standard 0.1 M sodium carbonate (methyl orange)
import { titration } from './titration.js';

export default titration({
  id: 'che122',
  title: 'Titration — HCl against standard sodium carbonate',
  intro: 'Find the molarity of hydrochloric acid by titrating it against standard 0.1 M sodium carbonate solution, using methyl orange as the indicator.',
  titrant: { name: 'HCl solution', short: 'HCl', sub: 'unknown molarity', color: 0xf5f8fa, opacity: 0.18, buretteOpacity: 0.35, labelColor: '#dc2626' },
  analyte: { name: 'Sodium carbonate', short: 'Na₂CO₃', sub: '0.1 M (standard)', color: 0xf6f8fa, opacity: 0.18, colourName: 'colourless', labelColor: '#0f766e' },
  indicator: { name: 'Methyl orange', drops: 2, bottleColor: 0xe8731f, dropColor: 0xf08a24, baseColor: 0xf7c232, baseOpacity: 0.5, note: 'Methyl orange turns the carbonate solution yellow.', why: 'Methyl orange is yellow above pH 4.4 and red below 3.1: it changes at the second equivalence point of carbonate with a strong acid.' },
  endColor: 0xf0602d, flashColor: 0xe0342a, endOpacity: 0.58, endName: 'orange-pink', beforeName: 'yellow',
  endText: 'the yellow solution just turns orange-pink (onion pink) and stays so after swirling.',
  unknownM: () => 0.18 + Math.random() * 0.04,
  equivalence: (M, V) => (2 * 0.1 * V) / M, // Na2CO3 + 2 HCl → 2 NaCl + H2O + CO2
  molarity: (Vt, V) => (2 * 0.1 * V) / Vt,
  resultLabel: 'Molarity of HCl',
  equation: 'Na₂CO₃ + 2 HCl → 2 NaCl + H₂O + CO₂, so M_HCl = 2 × 0.1 × V_Na₂CO₃ / V_HCl.',
  extraResult: (M) => [['Strength of HCl', `${(M * 36.5).toFixed(2)} g/L`]],
  keys: { aliquot: 'V_Na2CO3', titrant: 'V_HCl' },
  board: {
    title: 'Titration: HCl vs Na₂CO₃',
    formulas: ['Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂', 'M(HCl) = 2 × 0.1 × 20 / V'],
    steps: ['Rinse & fill burette with HCl, set zero', 'Pipette 20 mL Na₂CO₃ into flask', 'Add 2 drops methyl orange (yellow)', 'Titrate till yellow → orange-pink', 'Repeat for concordant readings'],
    note: 'Swirl constantly — CO₂ is given off near the end.',
  },
});
