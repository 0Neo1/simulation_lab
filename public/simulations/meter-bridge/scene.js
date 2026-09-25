// 3D apparatus for the meter bridge bench. Units are centimetres; the bridge
// wire runs along x from A (l = 0, x = −50) to C (l = 100, x = +50).
import * as THREE from 'three';
import { BOX_PLUGS, GALV } from './physics.js';

export const WIRE_Z = 6;
export const STRIP_TOP = 0.35;
export const WIRE_Y = STRIP_TOP + 0.45;
export const TABLE_Y = -3;
export const lToX = (l) => -50 + l;
export const xToL = (x) => x + 50;

const GAP_X = { left: [-30.5, -17.5], right: [17.5, 30.5] };
const BACK_Z = -8;

// ---------------------------------------------------------------------------
// Procedural textures
// ---------------------------------------------------------------------------

function canvasTexture(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 8;
  return t;
}

function woodTexture(base, dark, seed = 1, rings = 60) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < rings; i++) {
      const y0 = rnd() * h, amp = 2 + rnd() * 10, f = 0.002 + rnd() * 0.01, ph = rnd() * 6;
      g.strokeStyle = dark; g.globalAlpha = 0.05 + rnd() * 0.18; g.lineWidth = 0.6 + rnd() * 2.4;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.3 + ph) * amp * 0.3;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 0.06;
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = rnd() > 0.5 ? '#000' : '#fff';
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1);
    }
    g.globalAlpha = 1;
  });
}

// Metre scale: 104 cm plate, graduations from 0 to 100 cm with mm divisions.
function scaleTexture() {
  const PX = 40; // pixels per cm
  const W = 104 * PX, H = 220;
  return canvasTexture(W, H, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#f4ecd6'); grd.addColorStop(1, '#e6dcc0');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1b1b1b'; g.fillStyle = '#1b1b1b';
    for (let mm = 0; mm <= 1000; mm++) {
      const x = (2 + mm / 10) * PX;
      const len = mm % 100 === 0 ? 90 : mm % 10 === 0 ? 62 : mm % 5 === 0 ? 42 : 26;
      g.lineWidth = mm % 10 === 0 ? 3 : 1.6;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, len); g.stroke();
      if (mm % 10 === 0) {
        const cm = mm / 10;
        g.font = cm % 10 === 0 ? 'bold 44px Georgia, serif' : '28px Georgia, serif';
        g.textAlign = 'center';
        g.fillText(String(cm), x, cm % 10 === 0 ? 140 : 104);
      }
    }
    g.font = 'italic 26px Georgia, serif'; g.textAlign = 'left';
    g.fillText('cm', 2 + 101.2 * PX, 140);
    g.font = '22px Georgia, serif';
    g.fillText('METRE BRIDGE  ·  LEAST COUNT 1 mm', 40 * PX, 200);
  });
}

function dialTexture() {
  return canvasTexture(1024, 768, (g, w, h) => {
    const bg = g.createRadialGradient(w / 2, h * 0.9, 50, w / 2, h * 0.9, 800);
    bg.addColorStop(0, '#fffdf6'); bg.addColorStop(1, '#ece5d2');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.86, R = h * 0.68;
    const span = (Math.PI / 180) * 48; // ±48° for ±30 div
    g.strokeStyle = '#111'; g.fillStyle = '#111';
    g.lineWidth = 4;
    g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2 - span, -Math.PI / 2 + span); g.stroke();
    for (let d = -GALV.maxDiv; d <= GALV.maxDiv; d++) {
      const a = -Math.PI / 2 + (d / GALV.maxDiv) * span;
      const len = d % 10 === 0 ? 52 : d % 5 === 0 ? 36 : 22;
      g.lineWidth = d % 10 === 0 ? 5 : 2.5;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      g.lineTo(cx + Math.cos(a) * (R - len), cy + Math.sin(a) * (R - len));
      g.stroke();
      if (d % 10 === 0) {
        g.font = 'bold 50px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(Math.abs(d)), cx + Math.cos(a) * (R - 92), cy + Math.sin(a) * (R - 92));
      }
    }
    // mirror strip for parallax-free reading
    g.fillStyle = 'rgba(160,180,200,0.55)';
    g.beginPath(); g.arc(cx, cy, R + 26, -Math.PI / 2 - span, -Math.PI / 2 + span);
    g.arc(cx, cy, R + 8, -Math.PI / 2 + span, -Math.PI / 2 - span, true); g.fill();
    g.fillStyle = '#111';
    g.font = 'bold 64px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText('G', cx, cy - R * 0.42);
    g.font = '26px Georgia, serif';
    g.fillText('CENTRE-ZERO GALVANOMETER', cx, cy - R * 0.25);
    g.fillText('1 div ≈ 25 μA', cx, cy - R * 0.25 + 34);
    g.font = 'bold 40px Georgia, serif';
    g.fillText('−', cx - R * 0.95, cy - 30); g.fillText('+', cx + R * 0.95, cy - 30);
  });
}

function lidTexture() {
  return canvasTexture(1440, 400, (g, w, h) => {
    g.fillStyle = '#121212'; g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.05;
    for (let i = 0; i < 3000; i++) { g.fillStyle = '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
    g.globalAlpha = 1;
    g.fillStyle = '#e9e1c9';
    g.font = 'bold 34px Georgia, serif'; g.textAlign = 'center';
    const n = BOX_PLUGS.length, block = 3.2, gap = 0.8, total = (n + 1) * block + n * gap;
    BOX_PLUGS.forEach((v, i) => {
      const xcm = -total / 2 + block + gap / 2 + i * (block + gap);
      g.fillText(`${v}`, w / 2 + (xcm / 36.4) * w, h * 0.8);
    });
    g.font = '26px Georgia, serif';
    g.fillText('RESISTANCE BOX  ·  OHMS', w / 2, h * 0.16);
  });
}

function labelTexture(text, { bg = '#0f172a', fg = '#fde68a', w = 256, h = 96, font = 'bold 44px Georgia, serif' } = {}) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2);
  });
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export function makeMaterials() {
  return {
    brass: new THREE.MeshStandardMaterial({ color: 0xd9a948, metalness: 1, roughness: 0.28 }),
    brassDull: new THREE.MeshStandardMaterial({ color: 0xb58a3a, metalness: 1, roughness: 0.45 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xc27a4a, metalness: 1, roughness: 0.3 }),
    ebonite: new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0, roughness: 0.38 }),
    bakelite: new THREE.MeshStandardMaterial({ color: 0x2a1a12, metalness: 0, roughness: 0.42 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 1, roughness: 0.22 }),
    bridgeWire: new THREE.MeshStandardMaterial({ color: 0xd4b28a, metalness: 1, roughness: 0.25 }),
    board: new THREE.MeshStandardMaterial({ map: woodTexture('#8a5a33', '#3b2413', 7), roughness: 0.55, metalness: 0 }),
    boardSide: new THREE.MeshStandardMaterial({ map: woodTexture('#6f4524', '#2c190c', 3, 90), roughness: 0.6 }),
    mahogany: new THREE.MeshStandardMaterial({ map: woodTexture('#5a2616', '#2a0f07', 11), roughness: 0.45 }),
    handle: new THREE.MeshStandardMaterial({ map: woodTexture('#7b4a22', '#2f1a0b', 5, 30), roughness: 0.4 }),
    table: new THREE.MeshStandardMaterial({ map: (() => { const t = woodTexture('#3f3a36', '#1f1b18', 21, 120); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1.6); return t; })(), roughness: 0.7 }),
    scale: new THREE.MeshStandardMaterial({ map: scaleTexture(), roughness: 0.6 }),
    dial: new THREE.MeshStandardMaterial({ map: dialTexture(), roughness: 0.7 }),
    lid: new THREE.MeshStandardMaterial({ map: lidTexture(), roughness: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 0.95, transparent: true, opacity: 0.25, clearcoat: 1, depthWrite: false }),
    accumulator: new THREE.MeshPhysicalMaterial({ color: 0x1d2b22, roughness: 0.25, clearcoat: 0.6 }),
    needle: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }),
    red: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35 }),
    hairline: new THREE.MeshBasicMaterial({ color: 0xdc2626 }),
    cursor: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false }),
    spark: new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  };
}

const LEAD_COLORS = { red: 0xc0262d, black: 0x1f1f1f, blue: 0x1d4ed8, yellow: 0xd6a312, green: 0x15803d, white: 0xdedede };

function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}

// Knurled binding screw; returns group whose userData.top is the lead anchor.
function bindingScrew(M, pos) {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.5, 20), M.brass);
  base.position.y = 0.25;
  const cap = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.75, 28, 1), M.brass);
  cap.position.y = 0.95;
  const knurl = mesh(new THREE.TorusGeometry(0.72, 0.06, 6, 28), M.brassDull);
  knurl.rotation.x = Math.PI / 2; knurl.position.y = 0.8;
  const knurl2 = knurl.clone(); knurl2.position.y = 1.12;
  const post = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), M.brassDull);
  post.position.y = 1.5;
  g.add(base, cap, knurl, knurl2, post);
  g.position.copy(pos);
  g.userData.top = pos.clone().add(new THREE.Vector3(0, 0.62, 0));
  return g;
}

function plug(M) {
  const g = new THREE.Group();
  const head = mesh(new THREE.CylinderGeometry(0.62, 0.7, 1.3, 24), M.ebonite);
  head.position.y = 1.35;
  const knob = mesh(new THREE.SphereGeometry(0.62, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.ebonite);
  knob.position.y = 2.0;
  const collar = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 20), M.brass);
  collar.position.y = 0.66;
  const taper = mesh(new THREE.CylinderGeometry(0.4, 0.25, 1.4, 20), M.brass);
  taper.position.y = -0.1;
  g.add(head, knob, collar, taper);
  return g;
}

// A lead: insulated tube following a sagging curve between anchors.
export function leadCurve(a, b, { sag = 2.5, floor = TABLE_Y + 0.25, via = [] } = {}) {
  const pts = [a.clone(), a.clone().add(new THREE.Vector3(0, 1.2, 0))];
  via.forEach((p) => pts.push(p.clone()));
  if (!via.length) {
    const mid = a.clone().lerp(b, 0.5);
    mid.y = Math.max(floor, Math.min(a.y, b.y) - sag);
    pts.push(a.clone().lerp(mid, 0.55).setY((a.y + mid.y) / 2 + 0.6), mid, b.clone().lerp(mid, 0.55).setY((b.y + mid.y) / 2 + 0.6));
  }
  pts.push(b.clone().add(new THREE.Vector3(0, 1.2, 0)), b.clone());
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

function leadMesh(curve, color) {
  const mat = new THREE.MeshPhysicalMaterial({ color: LEAD_COLORS[color], roughness: 0.35, clearcoat: 0.5 });
  const m = mesh(new THREE.TubeGeometry(curve, 120, 0.22, 10, false), mat, { receive: false });
  const lug = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10), new THREE.MeshStandardMaterial({ color: 0xd9a948, metalness: 1, roughness: 0.3 }));
  const lug2 = lug.clone();
  lug.position.copy(curve.points[0]).add(new THREE.Vector3(0, 0.45, 0));
  lug2.position.copy(curve.points[curve.points.length - 1]).add(new THREE.Vector3(0, 0.45, 0));
  const g = new THREE.Group();
  g.add(m, lug, lug2);
  return g;
}

// ---------------------------------------------------------------------------
// Bench
// ---------------------------------------------------------------------------

export function buildBench(scene, M) {
  const H = {}; // handles returned to main
  const bench = new THREE.Group();
  scene.add(bench);

  // Lab table and the bridge's base board
  const table = mesh(new THREE.BoxGeometry(420, 4, 300), M.table, { cast: false });
  table.position.set(0, TABLE_Y - 2, 0);
  bench.add(table);

  const board = mesh(new THREE.BoxGeometry(112, 3, 28), [M.boardSide, M.boardSide, M.board, M.boardSide, M.boardSide, M.boardSide]);
  board.position.set(0, -1.5, 2);
  bench.add(board);
  [-54, 54].forEach((x) => {
    [-10, 14].forEach((z) => {
      const foot = mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 16), M.ebonite);
      foot.position.set(x, TABLE_Y + 0.2, z);
      bench.add(foot);
    });
  });

  // Metre scale plate under the wire
  const scalePlate = mesh(new THREE.BoxGeometry(104, 0.16, 5.5), [M.boardSide, M.boardSide, M.scale, M.boardSide, M.boardSide, M.boardSide]);
  scalePlate.position.set(0, 0.08, WIRE_Z + 3.6);
  bench.add(scalePlate);

  // Thick copper strips: two L-shaped end strips and the middle strip
  const stripMat = M.copper;
  const strip = (x0, x1, z0, z1) => {
    const s = mesh(new THREE.BoxGeometry(x1 - x0, STRIP_TOP, z1 - z0), stripMat);
    s.position.set((x0 + x1) / 2, STRIP_TOP / 2, (z0 + z1) / 2);
    bench.add(s);
    return s;
  };
  strip(-52.8, -49.2, BACK_Z - 1.3, WIRE_Z + 1.3);
  strip(-52.8, -29.5, BACK_Z - 1.3, BACK_Z + 1.3);
  strip(-18.5, 18.5, BACK_Z - 1.3, BACK_Z + 1.3);
  strip(49.2, 52.8, BACK_Z - 1.3, WIRE_Z + 1.3);
  strip(29.5, 52.8, BACK_Z - 1.3, BACK_Z + 1.3);

  // Engraved letters A, B, C
  [['A', -51, 10.5], ['C', 51, 10.5], ['B', 0, BACK_Z - 3]].forEach(([t, x, z]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshStandardMaterial({ map: labelTexture(t, { bg: '#7c4d2a', fg: '#f5e6c8', w: 128, h: 96, font: 'bold 72px Georgia, serif' }), roughness: 0.6 }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.02, z);
    bench.add(p);
  });
  [['R', -24], ['X', 24]].forEach(([t, x]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: labelTexture(t === 'R' ? 'Gap 1' : 'Gap 2', { bg: '#7c4d2a', fg: '#f5e6c8', w: 192, h: 96, font: 'bold 50px Georgia, serif' }), roughness: 0.6 }));
    p.scale.set(1.6, 1, 1);
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.02, BACK_Z + 3.2);
    bench.add(p);
    H[`gapLabel${t}`] = p;
  });

  // Binding screws
  const T = {};
  const addScrew = (key, x, z) => { const s = bindingScrew(M, new THREE.Vector3(x, STRIP_TOP, z)); bench.add(s); T[key] = s.userData.top; };
  addScrew('A', -51, -1.5);
  addScrew('C', 51, -1.5);
  addScrew('g1a', GAP_X.left[0], BACK_Z);
  addScrew('g1b', GAP_X.left[1], BACK_Z);
  addScrew('g2a', GAP_X.right[0], BACK_Z);
  addScrew('g2b', GAP_X.right[1], BACK_Z);
  addScrew('B', 0, BACK_Z);
  H.terminals = T;

  // Wire clamps at the ends and the stretched bridge wire itself
  [-50, 50].forEach((x) => {
    const clamp = mesh(new THREE.BoxGeometry(1.8, 0.6, 1.6), M.brass);
    clamp.position.set(x, STRIP_TOP + 0.3, WIRE_Z);
    const screw = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 14), M.steel);
    screw.position.set(x, STRIP_TOP + 0.85, WIRE_Z);
    bench.add(clamp, screw);
  });
  const bw = mesh(new THREE.CylinderGeometry(0.06, 0.06, 100, 10), M.bridgeWire);
  bw.rotation.z = Math.PI / 2;
  bw.position.set(0, WIRE_Y, WIRE_Z);
  bench.add(bw);

  // Resistance box, test-wire coil and galvanometer on the table behind the board
  H.box = buildResistanceBox(M);
  bench.add(H.box.group);

  H.galv = buildGalvanometer(M);
  H.galv.group.position.set(0, TABLE_Y, -27);
  bench.add(H.galv.group);

  H.cell = buildAccumulator(M);
  H.cell.group.position.set(-38, TABLE_Y, 30);
  H.cell.group.rotation.y = 0.12;
  bench.add(H.cell.group);

  H.key = buildPlugKey(M);
  H.key.group.position.set(-14, TABLE_Y, 29);
  bench.add(H.key.group);

  H.jockey = buildJockey(M);
  bench.add(H.jockey.group);

  // Fixed leads: galvanometer ↔ B, cell ↔ A, cell ↔ key, key ↔ C
  H.cell.group.updateMatrixWorld(true);
  H.key.group.updateMatrixWorld(true);
  H.galv.group.updateMatrixWorld(true);
  const wp = (obj, local) => obj.localToWorld(local.clone());
  H.anchors = {
    galvB: wp(H.galv.group, H.galv.termLeft),
    galvJ: wp(H.galv.group, H.galv.termRight),
    cellPos: wp(H.cell.group, H.cell.termPos),
    cellNeg: wp(H.cell.group, H.cell.termNeg),
    keyA: wp(H.key.group, H.key.termA),
    keyB: wp(H.key.group, H.key.termB),
  };
  const A_ = H.anchors;
  H.curves = {
    galvB: leadCurve(T.B, A_.galvB, { sag: 3 }),
    cellA: leadCurve(A_.cellPos, T.A, { via: [new THREE.Vector3(-46, TABLE_Y + 0.3, 24), new THREE.Vector3(-58, TABLE_Y + 0.3, 10), new THREE.Vector3(-57, TABLE_Y + 1.5, -1.5)] }),
    cellKey: leadCurve(A_.cellNeg, A_.keyA, { sag: 2 }),
    keyC: leadCurve(A_.keyB, T.C, { via: [new THREE.Vector3(10, TABLE_Y + 0.3, 30), new THREE.Vector3(50, TABLE_Y + 0.3, 24), new THREE.Vector3(58, TABLE_Y + 0.3, 10), new THREE.Vector3(57, TABLE_Y + 1.5, -1.5)] }),
  };
  bench.add(leadMesh(H.curves.galvB, 'yellow'));
  bench.add(leadMesh(H.curves.cellA, 'red'));
  bench.add(leadMesh(H.curves.cellKey, 'black'));
  bench.add(leadMesh(H.curves.keyC, 'black'));

  // Swappable parts: resistance box + leads and the test-wire coil
  H.swapGroup = new THREE.Group();
  bench.add(H.swapGroup);
  H.bench = bench;
  return H;
}

// Places resistance box and test wire in the chosen gaps and rebuilds their leads.
export function layoutGaps(H, M, { swapped, material, wireLengthCm }) {
  const g = H.swapGroup;
  while (g.children.length) {
    const c = g.children.pop();
    c.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }
  const T = H.terminals;
  const boxGap = swapped ? ['g2a', 'g2b'] : ['g1a', 'g1b'];
  const wireGap = swapped ? ['g1a', 'g1b'] : ['g2a', 'g2b'];
  const boxX = swapped ? 27 : -27;
  const coilX = swapped ? -27 : 27;

  H.box.group.position.set(boxX, TABLE_Y, -27);
  H.box.group.updateMatrixWorld(true);
  const bL = H.box.group.localToWorld(H.box.termLeft.clone());
  const bR = H.box.group.localToWorld(H.box.termRight.clone());
  // Current enters the gap at the terminal nearer A, so orient accordingly.
  const boxLeadA = leadCurve(T[boxGap[0]], bL, { sag: 3 });
  const boxLeadB = leadCurve(bR, T[boxGap[1]], { sag: 3 });
  g.add(leadMesh(boxLeadA, 'blue'), leadMesh(boxLeadB, 'blue'));

  // Test wire: a long loop resting on an insulating former behind the gap
  const coil = buildCoil(M, material, wireLengthCm, T[wireGap[0]], T[wireGap[1]], coilX);
  g.add(coil.group);

  // Charge-flow paths through each gap, oriented A → C
  const boxInner = new THREE.CatmullRomCurve3([bL.clone().add(new THREE.Vector3(0, 0.3, 0)), bR.clone().add(new THREE.Vector3(0, 0.3, 0))]);
  H.gapPaths = {
    box: [boxLeadA, boxInner, boxLeadB],
    wire: [coil.curve],
  };
  H.coilMesh = coil.wireMesh;
  return H;
}

function buildCoil(M, material, lengthCm, tA, tB, cx) {
  const group = new THREE.Group();
  const z0 = -21;
  // Insulating former (a wooden frame with ebonite pegs)
  const frame = mesh(new THREE.BoxGeometry(20, 1, 9), M.mahogany);
  frame.position.set(cx, TABLE_Y + 0.5, z0 - 3);
  group.add(frame);
  const pegs = [];
  const n = Math.max(3, Math.min(6, Math.round(lengthCm / 12)));
  for (let i = 0; i < n; i++) {
    const px = cx - 8 + (16 * i) / (n - 1);
    [z0 - 6, z0].forEach((pz) => {
      const peg = mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 14), M.ebonite);
      peg.position.set(px, TABLE_Y + 2.1, pz);
      group.add(peg);
      pegs.push(new THREE.Vector3(px, TABLE_Y + 2.4, pz));
    });
  }
  // Zig-zag the wire across the pegs so its visible length tracks lengthCm
  const pts = [tA.clone(), tA.clone().add(new THREE.Vector3(0, 1.0, -1.5)), new THREE.Vector3(cx - 9, TABLE_Y + 2.6, z0 + 1.5)];
  for (let i = 0; i < n; i++) {
    const px = cx - 8 + (16 * i) / (n - 1);
    const zs = i % 2 === 0 ? [z0 + 0.5, z0 - 6.5] : [z0 - 6.5, z0 + 0.5];
    zs.forEach((pz) => pts.push(new THREE.Vector3(px + (i % 2 ? 0.45 : -0.45), TABLE_Y + 2.4, pz)));
  }
  pts.push(new THREE.Vector3(cx + 9, TABLE_Y + 2.6, z0 + 1.5), tB.clone().add(new THREE.Vector3(0, 1.0, -1.5)), tB.clone());
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.2);
  const wireMat = new THREE.MeshStandardMaterial({ color: material.color, metalness: 1, roughness: 0.28, emissive: 0x000000 });
  const wireMesh = mesh(new THREE.TubeGeometry(curve, 400, 0.09, 8, false), wireMat, { receive: false });
  group.add(wireMesh);
  return { group, curve, wireMesh };
}

function buildResistanceBox(M) {
  const group = new THREE.Group();
  const W = 36, Hh = 6, D = 10;
  const body = mesh(new THREE.BoxGeometry(W, Hh, D), M.mahogany);
  body.position.y = Hh / 2;
  const lid = mesh(new THREE.BoxGeometry(W + 0.4, 0.5, D + 0.4), [M.ebonite, M.ebonite, M.lid, M.ebonite, M.ebonite, M.ebonite]);
  lid.position.y = Hh + 0.25;
  group.add(body, lid);
  const top = Hh + 0.5;
  const n = BOX_PLUGS.length, block = 3.2, gap = 0.8, total = (n + 1) * block + n * gap;
  for (let i = 0; i <= n; i++) {
    const b = mesh(new THREE.BoxGeometry(block, 0.8, 2.6), M.brass);
    b.position.set(-total / 2 + block / 2 + i * (block + gap), top + 0.4, 0);
    group.add(b);
  }
  const plugs = BOX_PLUGS.map((value, i) => {
    const p = plug(M);
    const x = -total / 2 + block + gap / 2 + i * (block + gap);
    const home = new THREE.Vector3(x, top + 0.4, 0);
    const out = new THREE.Vector3(x, top + 0.95, -1.9);
    p.position.copy(home);
    p.userData = { kind: 'plug', index: i, value, home, out, inserted: true, t: 1 };
    p.traverse((o) => { o.userData.pick = p; });
    group.add(p);
    return p;
  });
  const termLeft = new THREE.Vector3(-W / 2 + 1.5, top, -3.2);
  const termRight = new THREE.Vector3(W / 2 - 1.5, top, -3.2);
  [termLeft, termRight].forEach((tp) => {
    const s = bindingScrew(M, tp.clone());
    group.add(s);
  });
  return { group, plugs, termLeft: termLeft.clone().setY(top + 0.62), termRight: termRight.clone().setY(top + 0.62) };
}

function buildGalvanometer(M) {
  const group = new THREE.Group();
  const W = 16, Hh = 6, D = 13;
  const body = mesh(new THREE.BoxGeometry(W, Hh, D), M.bakelite);
  body.position.y = Hh / 2;
  const bezel = mesh(new THREE.BoxGeometry(W - 1, 0.5, D - 2.4), M.ebonite);
  bezel.position.set(0, Hh + 0.25, -0.4);
  group.add(body, bezel);

  // Dial on the top face, tilted toward the observer
  const dialGroup = new THREE.Group();
  dialGroup.position.set(0, Hh + 0.52, -0.4);
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 10), M.dial);
  dial.rotation.x = -Math.PI / 2;
  dial.receiveShadow = true;
  dialGroup.add(dial);
  // Needle pivots near the front edge and points away from the observer
  const pivot = new THREE.Group();
  pivot.position.set(0, 0.12, 10 * (0.86 - 0.5));
  const needle = mesh(new THREE.BoxGeometry(0.1, 0.05, 6.7), M.needle, { receive: false });
  needle.position.z = -3.35;
  const tail = mesh(new THREE.BoxGeometry(0.35, 0.06, 1.2), M.needle);
  tail.position.z = 0.5;
  const hub = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16), M.brass);
  pivot.add(needle, tail, hub);
  dialGroup.add(pivot);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(13.6, 10.2), M.glass);
  glass.rotation.x = -Math.PI / 2; glass.position.y = 0.5;
  dialGroup.add(glass);
  group.add(dialGroup);

  // Protective high-resistance selector knob at the front
  const knob = mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.8, 24), M.ebonite);
  knob.position.set(-5.5, Hh + 0.4, D / 2 - 1.1);
  const mark = mesh(new THREE.BoxGeometry(0.15, 0.05, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  mark.position.set(0, 0.42, -0.4);
  knob.add(mark);
  knob.userData.pick = knob;
  knob.userData.kind = 'hr';
  group.add(knob);
  const hrLabel = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.1), new THREE.MeshStandardMaterial({ map: labelTexture('HR  2 kΩ', { bg: '#2a1a12', fg: '#f5e6c8', w: 256, h: 96, font: 'bold 38px Georgia, serif' }) }));
  hrLabel.rotation.x = -Math.PI / 2; hrLabel.position.set(-5.5, Hh + 0.02, D / 2 - 2.9);
  group.add(hrLabel);

  const termLeft = new THREE.Vector3(3.4, Hh, D / 2 - 1.3);
  const termRight = new THREE.Vector3(6.4, Hh, D / 2 - 1.3);
  [termLeft, termRight].forEach((tp) => group.add(bindingScrew(M, tp.clone())));
  return { group, pivot, knob, termLeft: termLeft.clone().setY(Hh + 0.62), termRight: termRight.clone().setY(Hh + 0.62), dialGroup };
}

function buildAccumulator(M) {
  const group = new THREE.Group();
  const W = 8, Hh = 10, D = 6;
  const body = mesh(new THREE.BoxGeometry(W, Hh, D), M.accumulator);
  body.position.y = Hh / 2;
  const lid = mesh(new THREE.BoxGeometry(W + 0.3, 0.8, D + 0.3), M.ebonite);
  lid.position.y = Hh + 0.4;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ map: labelTexture('2 V  ACCUMULATOR', { bg: '#e8dcc0', fg: '#1b1b1b', w: 512, h: 160, font: 'bold 52px Georgia, serif' }) }));
  label.position.set(0, Hh * 0.55, D / 2 + 0.01);
  const vent = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16), M.red);
  vent.position.set(0, Hh + 1.05, 0);
  group.add(body, lid, label, vent);
  const termPos = new THREE.Vector3(-2.4, Hh + 0.8, 0);
  const termNeg = new THREE.Vector3(2.4, Hh + 0.8, 0);
  const cp = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 16), M.red); cp.position.copy(termPos).add(new THREE.Vector3(0, 0.1, 0));
  const cn = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 16), M.black); cn.position.copy(termNeg).add(new THREE.Vector3(0, 0.1, 0));
  group.add(cp, cn, bindingScrew(M, termPos.clone().add(new THREE.Vector3(0, 0.3, 0))), bindingScrew(M, termNeg.clone().add(new THREE.Vector3(0, 0.3, 0))));
  return { group, termPos: termPos.clone().setY(Hh + 1.72), termNeg: termNeg.clone().setY(Hh + 1.72) };
}

function buildPlugKey(M) {
  const group = new THREE.Group();
  const base = mesh(new THREE.BoxGeometry(9, 1, 4.5), M.ebonite);
  base.position.y = 0.5;
  const b1 = mesh(new THREE.BoxGeometry(3.2, 1.2, 2.6), M.brass); b1.position.set(-2, 1.6, 0);
  const b2 = b1.clone(); b2.position.x = 2;
  group.add(base, b1, b2);
  const p = plug(M);
  const home = new THREE.Vector3(0, 1.8, 0);
  const out = new THREE.Vector3(0, 1.75, 4.4);
  p.position.copy(out);
  p.userData = { kind: 'key', home, out, inserted: false, t: 0 };
  p.traverse((o) => { o.userData.pick = p; });
  group.add(p);
  const termA = new THREE.Vector3(-3, 2.2, -0.6);
  const termB = new THREE.Vector3(3, 2.2, -0.6);
  [termA, termB].forEach((tp) => group.add(bindingScrew(M, tp.clone())));
  const label = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshStandardMaterial({ map: labelTexture('KEY  K', { bg: '#141414', fg: '#f5e6c8', w: 256, h: 96, font: 'bold 44px Georgia, serif' }) }));
  label.rotation.x = -Math.PI / 2; label.position.set(0, 1.01, 1.6);
  group.add(label);
  return { group, plug: p, termA: termA.clone().setY(2.82), termB: termB.clone().setY(2.82) };
}

function buildJockey(M) {
  const group = new THREE.Group();
  // Sliding carriage riding on the front edge of the scale with a hairline index
  const carriage = new THREE.Group();
  const shoe = mesh(new THREE.BoxGeometry(3.4, 0.9, 1.2), M.brass);
  shoe.position.set(0, 0.45, WIRE_Z + 7.1);
  const window_ = mesh(new THREE.BoxGeometry(3.2, 0.12, 5.6), M.cursor, { cast: false, receive: false });
  window_.position.set(0, 0.26, WIRE_Z + 3.7);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 5.4), M.hairline);
  hair.position.set(0, 0.34, WIRE_Z + 3.7);
  carriage.add(shoe, window_, hair);
  group.add(carriage);

  // The jockey proper: knife-edge contact on a turned wooden handle
  const jockey = new THREE.Group();
  const blade = mesh(new THREE.CylinderGeometry(0.32, 0.02, 1.4, 4, 1), M.brass);
  blade.rotation.y = Math.PI / 4;
  blade.position.y = 0.7;
  const ferrule = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.8, 18), M.brass);
  ferrule.position.y = 1.8;
  const handle = mesh(new THREE.CylinderGeometry(0.55, 0.45, 7, 20), M.handle);
  handle.position.y = 5.6;
  const cap = mesh(new THREE.SphereGeometry(0.6, 18, 12), M.handle);
  cap.position.y = 9.1;
  jockey.add(blade, ferrule, handle, cap);
  jockey.traverse((o) => { o.userData.pick = jockey; });
  jockey.userData.kind = 'jockey';
  group.add(jockey);

  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), M.spark);
  group.add(spark);
  return { group, carriage, jockey, spark, leadTop: () => jockey.localToWorld(new THREE.Vector3(0, 9.3, 0)) };
}

export { LEAD_COLORS, leadMesh };
