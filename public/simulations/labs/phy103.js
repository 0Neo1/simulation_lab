// Image formation by a convex lens for different object positions
import { optics } from './optics.js';

const f1 = (v) => (v == null ? '—' : v.toFixed(1));
export default optics({
  id: 'phy103',
  title: 'Image formed by a convex lens',
  intro: 'Study the position, size and nature of the image formed by a convex lens as the object is moved from far away to inside the focus.',
  lensMark: 70,
  allowVirtual: true,
  uFactors: [3.0, 2.0, 1.5, 1.0, 0.6],
  stepText: (i) => [
    'Object beyond 2F (about 3f): catch the image on the screen and note its position, size and nature.',
    'Object at 2F: find the image and compare its size with the object.',
    'Object between F and 2F: find the image.',
    'Object at F: try to catch the image.',
    'Object between F and the lens: look through the lens from the other side.',
  ][i],
  firstWhy: 'Magnification m = v/u tells you whether the image is enlarged (m > 1) or diminished (m < 1).',
  whys: ['', 'At 2F the image is the same size as the object.', 'This is how a projector works.', 'Rays leave the lens parallel: the image is at infinity.', 'This is how a magnifying glass works.'],
  columns: [
    { key: 'u', label: 'u (cm)', fmt: f1 },
    { key: 'v', label: 'v (cm)', fmt: (v, r) => (v != null ? v.toFixed(1) : r.vVirtual != null ? `${r.vVirtual.toFixed(1)} (virtual)` : '∞') },
    { key: 'm', label: 'm = v/u', fmt: (v) => (v == null ? '∞' : v.toFixed(2)) },
    { key: 'nature', label: 'Nature of image' },
  ],
  tableNote: 'For an object at F the image is at infinity; inside F it is virtual and cannot be caught on a screen.',
  result: (lab) => {
    const r = lab.rows.filter((x) => x.f != null);
    const f = r.length ? r.reduce((s, x) => s + x.f, 0) / r.length : null;
    return { items: [['Readings', `${lab.rows.length} of 5`], ['f from real images', f ? `${f.toFixed(2)} cm` : '—'], ['Actual f', lab.rows.length >= 5 ? `${lab.x.f.toFixed(2)} cm` : 'hidden']], note: 'As the object comes closer to F the real image moves away and grows; inside F the image becomes virtual, erect and magnified.' };
  },
  obsRows: 5,
  obsKeys: ['u', 'v', 'm', 'nature'],
  obsRow: (r) => ({ u: r.u.toFixed(1), v: r.v != null ? r.v.toFixed(1) : r.vVirtual != null ? r.vVirtual.toFixed(1) : '∞', m: r.m != null ? r.m.toFixed(2) : '∞', nature: r.nature }),
  board: {
    title: 'Image formation by a convex lens',
    formulas: ['1/f = 1/v − 1/u', 'm = v / u'],
    steps: ['u > 2f: real, inverted, diminished', 'u = 2f: real, inverted, same size', 'f < u < 2f: real, inverted, magnified', 'u = f: image at infinity', 'u < f: virtual, erect, magnified'],
  },
});
