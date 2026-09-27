// Focal length of a convex lens by the u–v method on an optical bench
import { optics } from './optics.js';

const f1 = (v) => (v == null ? '—' : v.toFixed(1));
export default optics({
  id: 'phy122',
  title: 'Focal length of a convex lens (u–v method)',
  intro: 'Find the focal length of a convex lens by measuring several pairs of object and image distances on an optical bench.',
  lensMark: 70,
  uFactors: [1.5, 1.8, 2.0, 2.4, 3.0],
  stepText: (i, k) => (i === 0 ? 'Place the object at about 1.5 f from the lens, move the screen until the image is sharpest, and record u and v.' : `Move the object to about ${k} f and record the new u and v.`),
  firstWhy: 'Move the screen to and fro to find the sharpest image; read the positions from the index marks on the carriages.',
  whys: ['', '', 'At u = 2f the image is the same size as the object (v = 2f).'],
  columns: [
    { key: 'u', label: 'u (cm)', fmt: f1 },
    { key: 'v', label: 'v (cm)', fmt: f1 },
    { key: 'f', label: 'f = uv/(u+v) (cm)', fmt: (v) => (v == null ? '—' : v.toFixed(2)) },
  ],
  tableNote: 'Five pairs of (u, v). The mean of f = uv/(u+v) is the focal length; power P = 100/f dioptres.',
  result: (lab) => {
    const r = lab.rows.filter((x) => x.f != null);
    if (!r.length) return { items: [['Mean f', '—'], ['Power P', '—'], ['Actual f', 'hidden']], note: 'Record at least five pairs of u and v.' };
    const f = r.reduce((s, x) => s + x.f, 0) / r.length;
    const reveal = r.length >= 5;
    return { items: [['Mean f', `${f.toFixed(2)} cm`], ['Power P = 100/f', `${(100 / f).toFixed(2)} D`], ['Actual f (after 5)', reveal ? `${lab.x.f.toFixed(2)} cm` : 'hidden'], ['Error', reveal ? `${(((f - lab.x.f) / lab.x.f) * 100).toFixed(2)} %` : '—']], note: 'A graph of 1/v against 1/u is a straight line cutting both axes at 1/f.' };
  },
  obsRows: 5,
  obsKeys: ['u', 'v', 'f'],
  obsRow: (r) => ({ u: r.u.toFixed(1), v: r.v != null ? r.v.toFixed(1) : '', f: r.f != null ? r.f.toFixed(2) : '' }),
  board: {
    title: 'Convex lens: focal length by u–v method',
    formulas: ['1/f = 1/v − 1/u  (sign convention)', 'f = uv / (u + v)  (magnitudes)', 'P = 100 / f(cm)  dioptre'],
    steps: ['Find rough f using a distant object', 'Object, lens, screen on the axis', 'Object between 1.5f and 3f', 'Move screen for the sharpest image', 'Record u and v; repeat 5 times'],
    note: 'At u = 2f, v = 2f and the image is the same size',
  },
});
