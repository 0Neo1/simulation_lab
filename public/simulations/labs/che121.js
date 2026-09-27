// Fe²⁺ (Mohr's salt) estimated by titration with standard 0.02 M KMnO₄ (self-indicator)
import { titration } from './titration.js';

export default titration({
  id: 'che121',
  title: 'Redox titration — KMnO₄ against Fe²⁺ (Mohr’s salt)',
  intro: 'Find the molarity and strength of an Fe²⁺ solution (Mohr’s salt) by titrating it in acid against standard 0.02 M potassium permanganate, which is its own indicator.',
  titrant: { name: 'KMnO₄ solution', short: 'KMnO₄', sub: '0.02 M (standard)', color: 0x5b0f63, opacity: 0.92, buretteOpacity: 0.95, amber: true, labelColor: '#7e22ce' },
  analyte: { name: 'Mohr’s salt (Fe²⁺)', short: 'Fe²⁺', sub: 'unknown molarity', color: 0xd9ecc4, opacity: 0.28, colourName: 'pale green', labelColor: '#15803d' },
  indicator: null,
  selfIndicator: true,
  readTop: true,
  acidify: { name: 'dil. H₂SO₄', sub: '1 M', mL: 10, text: 'Add about 10 mL of dilute sulphuric acid to the flask with the measuring cylinder.', why: 'MnO₄⁻ is reduced to colourless Mn²⁺ only in acid; without enough acid a brown MnO₂ precipitate forms.', note: 'Dilute H₂SO₄ added — the acid provides the H⁺ ions the reaction needs.' },
  endColor: 0xe455a8, flashColor: 0x7a1f8f, endOpacity: 0.5, endName: 'pink', beforeName: 'pale green (purple drops decolourise)',
  endText: 'the purple drops stop decolourising — the first permanent light pink after swirling.',
  unknownM: () => 0.05 + Math.random() * 0.012,
  equivalence: (M, V) => (M * V) / (5 * 0.02), // MnO4⁻ + 5 Fe²⁺ + 8 H⁺ → Mn²⁺ + 5 Fe³⁺ + 4 H2O
  molarity: (Vt, V) => (5 * 0.02 * Vt) / V,
  resultLabel: 'Molarity of Fe²⁺',
  equation: 'MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O, so M_Fe = 5 × 0.02 × V_KMnO₄ / V_Fe.',
  extraResult: (M) => [['Fe²⁺ per litre', `${(M * 55.85).toFixed(2)} g/L`]],
  keys: { aliquot: 'V_Fe', titrant: 'V_KMnO4' },
  metricInputs: { M_KMnO4: '0.02' },
  board: {
    title: 'Redox titration: KMnO₄ vs Fe²⁺',
    formulas: ['MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O', 'M(Fe²⁺) = 5 × 0.02 × V / 20'],
    steps: ['Fill burette with KMnO₄ (read upper meniscus)', 'Pipette 20 mL Fe²⁺ solution into flask', 'Add 10 mL dilute H₂SO₄', 'Titrate till first permanent light pink', 'Repeat for concordant readings'],
    note: 'KMnO₄ is its own indicator — no indicator needed.',
  },
});
