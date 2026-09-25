// Meter bridge circuit model.
//
// The bridge is solved as a full resistor network (nodal analysis), not by the
// ideal balance formula, so the galvanometer responds realistically away from
// the null point and the non-ideal effects of a real bench are all present:
// cell internal resistance, end resistances at the copper strips, galvanometer
// resistance, an optional protective series resistance and Joule heating of the
// test wire when the key is left in.
//
//          left gap              right gap
//   A ────[ R or X ]──── B ────[ X or R ]──── C
//   │                    │                    │
//   │                    G  (galvanometer)    │
//   │                    │                    │
//   A'═══α═══ bridge wire ═══ D (jockey) ═══β═══ C'
//   └──────────── cell E, r ── key K ─────────┘

export const MATERIALS = {
  nichrome: { name: 'Nichrome', rho: 1.10e-6, tempco: 4.0e-4, color: 0x9aa3ad, density: 8400, c: 450 },
  constantan: { name: 'Constantan', rho: 4.90e-7, tempco: 2.0e-5, color: 0xc9a27a, density: 8900, c: 390 },
  manganin: { name: 'Manganin', rho: 4.82e-7, tempco: 1.0e-5, color: 0xb88a5a, density: 8400, c: 406 },
  eureka: { name: 'Eureka', rho: 4.90e-7, tempco: 2.0e-5, color: 0xd1b48c, density: 8900, c: 390 },
};

// Plugs of a standard laboratory resistance box, in order on the lid.
export const BOX_PLUGS = [0.5, 1, 2, 2, 5, 10, 20, 50];

export const GALV = {
  resistance: 60, // Ω, coil resistance of the pointer galvanometer
  figureOfMerit: 25e-6, // A per division
  maxDiv: 30, // 30 – 0 – 30 scale
  stopDiv: 33, // mechanical stops
  protection: 2000, // Ω, series high resistance used while hunting for the null
};

export const BRIDGE = {
  length: 100, // cm
  resistance: 1.20, // Ω for the whole 100 cm of bridge wire (constantan, 24 SWG)
};

const T_ROOM = 25; // °C

// Seeded PRNG so a session's "unknown" values are stable but differ per student.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Builds one session's apparatus: the test wire's true dimensions, the end
// resistances of this particular bridge and the screw gauge's zero error.
export function createApparatus(materialKey = 'nichrome', seed = Date.now()) {
  const rand = mulberry32(seed);
  const mat = MATERIALS[materialKey];
  const lambda = BRIDGE.resistance / BRIDGE.length; // Ω per cm
  const lengthCm = 40 + Math.round(rand() * 30); // 40–70 cm of wire in the gap
  const swg = [0.376, 0.417, 0.457, 0.508, 0.559][Math.floor(rand() * 5)];
  const diameterMm = swg * (1 + (rand() - 0.5) * 0.03); // manufacturing tolerance
  const area = Math.PI * (diameterMm / 2000) ** 2;
  const X0 = (mat.rho * lengthCm) / 100 / area;
  return {
    seed,
    materialKey,
    material: mat,
    lengthCm,
    diameterMm,
    X0, // test-wire resistance at room temperature
    lambda,
    alpha: lambda * (0.3 + rand() * 0.6), // end resistance at A (cm-equivalent 0.3–0.9)
    beta: lambda * (0.3 + rand() * 0.6), // end resistance at C
    contact: 0.004 + rand() * 0.006, // Ω of plug / terminal contacts in each gap
    zeroErrorMm: [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03][Math.floor(rand() * 7)],
    cell: { emf: 2.0, internal: 0.35 + rand() * 0.25 }, // lead accumulator
    // thermal model of the test wire
    heatCapacity: (() => {
      const volume = area * (lengthCm / 100);
      return volume * mat.density * mat.c; // J/K
    })(),
    coolingK: 0.012, // W/K, still air convection for a thin wire
  };
}

// Solves Ax = b in place for a small dense system (partial pivoting).
function solve(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    [A[i], A[p]] = [A[p], A[i]];
    [b[i], b[p]] = [b[p], b[i]];
    for (let k = i + 1; k < n; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) A[k][j] -= f * A[i][j];
      b[k] -= f * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return x;
}

// state: { R, X, l, keyIn, pressed, protect, swapped }
// Returns every branch current so the scene can animate charge flow.
export function solveBridge(app, state) {
  const { R, X, l, keyIn, pressed, protect, swapped } = state;
  const zero = { VA: 0, VB: 0, VD: 0, Ig: 0, Icell: 0, Ileft: 0, Iright: 0, IwireL: 0, IwireR: 0, P_X: 0 };
  if (!keyIn) return zero;

  const left = (swapped ? X : R) + app.contact;
  const right = (swapped ? R : X) + app.contact;
  const lc = Math.min(Math.max(l, 0), BRIDGE.length);
  const wL = app.alpha + app.lambda * lc;
  const wR = app.beta + app.lambda * (BRIDGE.length - lc);
  const gBranch = pressed ? GALV.resistance + (protect ? GALV.protection : 0) : Infinity;
  const rs = app.cell.internal + 0.02; // cell + key + leads

  // Unknowns VA, VB, VD with C grounded. The cell is a Norton source E/rs
  // injecting into A with conductance 1/rs to ground.
  const g1 = 1 / left, g2 = 1 / right, g3 = 1 / wL, g4 = 1 / wR, gg = 1 / gBranch, gs = 1 / rs;
  const A = [
    [g1 + g3 + gs, -g1, -g3],
    [-g1, g1 + g2 + gg, -gg],
    [-g3, -gg, g3 + g4 + gg],
  ];
  const b = [app.cell.emf * gs, 0, 0];
  const [VA, VB, VD] = solve(A, b);

  const Ig = (VB - VD) * gg; // + means B → D
  const Ileft = (VA - VB) * g1;
  const Iright = VB * g2;
  const IwireL = (VA - VD) * g3;
  const IwireR = VD * g4;
  const Icell = (app.cell.emf - VA) * gs;
  const IX = swapped ? Ileft : Iright;
  return { VA, VB, VD, Ig, Icell, Ileft, Iright, IwireL, IwireR, P_X: IX * IX * X };
}

// Test-wire resistance at temperature T (°C).
export function wireResistance(app, T) {
  return app.X0 * (1 + app.material.tempco * (T - T_ROOM));
}

// Advances the wire temperature by dt seconds given dissipated power P.
export function stepTemperature(app, T, P, dt) {
  const dT = (P - app.coolingK * (T - T_ROOM)) / app.heatCapacity;
  return T + dT * dt;
}

export { T_ROOM };

// Galvanometer target deflection in divisions (signed, before mechanical stops).
export function deflection(Ig) {
  return Ig / GALV.figureOfMerit;
}

// Damped moving-coil pointer: θ'' = ω²(θt − θ) − 2ζωθ'. Returns new {theta, omega}.
export function stepNeedle(needle, target, dt) {
  const w = 2 * Math.PI * 1.1;
  const zeta = 0.32;
  let { theta, omega } = needle;
  const steps = Math.max(1, Math.ceil(dt / 0.004));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const acc = w * w * (target - theta) - 2 * zeta * w * omega;
    omega += acc * h;
    theta += omega * h;
    if (theta > GALV.stopDiv) { theta = GALV.stopDiv; omega = -omega * 0.3; }
    if (theta < -GALV.stopDiv) { theta = -GALV.stopDiv; omega = -omega * 0.3; }
  }
  return { theta, omega };
}

// The ideal null point for the current configuration, found numerically from
// the full network (so it already includes end resistances).
export function findNull(app, state) {
  let lo = 0.5, hi = 99.5;
  const f = (l) => solveBridge(app, { ...state, l, pressed: true, protect: false, keyIn: true }).Ig;
  let flo = f(lo);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hi = mid;
  }
  return (lo + hi) / 2;
}

// Screw gauge: pitch 0.5 mm, 50 circular divisions → least count 0.01 mm.
// Returns a raw reading (MSR + CSD × LC) including the gauge's zero error and a
// small non-uniformity of the wire along its length.
export function screwGaugeReading(app, position, rand = Math.random) {
  const trueD = app.diameterMm * (1 + Math.sin(position * 2.1 + app.seed % 7) * 0.006);
  const observed = trueD + app.zeroErrorMm + (rand() - 0.5) * 0.004;
  const pitch = 0.5, lc = 0.01;
  const msr = Math.floor(observed / pitch) * pitch;
  const csd = Math.round((observed - msr) / lc);
  return { msr, csd, lc, raw: msr + csd * lc };
}
