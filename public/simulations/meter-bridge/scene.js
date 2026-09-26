// 3D apparatus for the meter bridge experiment. Units are centimetres; the
// bench top is at y = TABLE_Y and the bridge wire runs along x from
// A (l = 0, x = −50) to C (l = 100, x = +50). Every piece of apparatus is a
// separate group whose origin sits on its base, so it can be picked up and
// placed; `terminals` gives the lead anchor of each binding screw in the
// group's local frame.
import * as THREE from 'three';
import { BOX_PLUGS, GALV } from './physics.js';

export const TABLE_Y = -3;
export const WIRE_Z = 6;
export const STRIP_TOP = 0.35;
export const WIRE_Y = STRIP_TOP + 0.45;
export const lToX = (l) => -50 + l;
export const xToL = (x) => x + 50;
const BACK_Z = -8;
const SCREW_TOP = 0.62; // binding screw lead anchor above its base

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

function scaleTexture() {
  const PX = 40;
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
    const span = (Math.PI / 180) * 48;
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

// Screw gauge sleeve: main scale in mm above the reference line, half-mm below
export const SLEEVE_PX = { x0: 150, pxmm: 36, w: 1024 };
function sleeveTexture() {
  return canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = '#d7dbe0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#111'; g.fillStyle = '#111';
    const x0 = SLEEVE_PX.x0, pxmm = SLEEVE_PX.pxmm; // ~24 mm visible
    g.lineWidth = 3; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    for (let hm = 0; hm <= 50; hm++) {
      const x = x0 + hm * pxmm / 2;
      const full = hm % 2 === 0;
      g.lineWidth = full ? 3 : 2.4;
      g.beginPath();
      if (full) { g.moveTo(x, h / 2); g.lineTo(x, h / 2 - (hm % 10 === 0 ? 60 : 40)); }
      else { g.moveTo(x, h / 2); g.lineTo(x, h / 2 + 34); }
      g.stroke();
      if (hm % 10 === 0) { g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText(String(hm / 2), x, h / 2 - 72); }
    }
  }, { srgb: true });
}

// Thimble: 50 divisions around the circumference, short marks at the bevelled
// edge (canvas top) and a knurled grip further along.
function thimbleTexture() {
  return canvasTexture(1024, 512, (g, w, h) => {
    g.fillStyle = '#c9ced4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#111'; g.fillStyle = '#111';
    for (let d = 0; d < 50; d++) {
      const x = (d / 50) * w;
      g.lineWidth = d % 5 === 0 ? 3 : 2;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, d % 5 === 0 ? 40 : 24); g.stroke();
      if (d % 5 === 0) { g.font = 'bold 24px Arial'; g.textAlign = 'center'; g.fillText(String(d), x, 70); }
    }
    for (let x = 0; x < w; x += 6) { g.fillStyle = x % 12 ? '#9aa1a8' : '#7c848c'; g.fillRect(x, 240, 4, h - 240); }
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
    chrome: new THREE.MeshStandardMaterial({ color: 0xe5e9ee, metalness: 1, roughness: 0.12 }),
    enamel: new THREE.MeshStandardMaterial({ color: 0x1f3b73, metalness: 0.2, roughness: 0.35 }),
    bridgeWire: new THREE.MeshStandardMaterial({ color: 0xd4b28a, metalness: 1, roughness: 0.25 }),
    board: new THREE.MeshStandardMaterial({ map: woodTexture('#8a5a33', '#3b2413', 7), roughness: 0.55, metalness: 0 }),
    boardSide: new THREE.MeshStandardMaterial({ map: woodTexture('#6f4524', '#2c190c', 3, 90), roughness: 0.6 }),
    mahogany: new THREE.MeshStandardMaterial({ map: woodTexture('#5a2616', '#2a0f07', 11), roughness: 0.45 }),
    handle: new THREE.MeshStandardMaterial({ map: woodTexture('#7b4a22', '#2f1a0b', 5, 30), roughness: 0.4 }),
    ruler: new THREE.MeshStandardMaterial({ map: scaleTexture(), roughness: 0.55 }),
    scale: new THREE.MeshStandardMaterial({ map: scaleTexture(), roughness: 0.6 }),
    dial: new THREE.MeshStandardMaterial({ map: dialTexture(), roughness: 0.7 }),
    lid: new THREE.MeshStandardMaterial({ map: lidTexture(), roughness: 0.4 }),
    sleeve: new THREE.MeshStandardMaterial({ map: sleeveTexture(), metalness: 0.6, roughness: 0.35 }),
    thimble: new THREE.MeshStandardMaterial({ map: thimbleTexture(), metalness: 0.6, roughness: 0.35 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 0.95, transparent: true, opacity: 0.25, clearcoat: 1, depthWrite: false }),
    accumulator: new THREE.MeshPhysicalMaterial({ color: 0x1d2b22, roughness: 0.25, clearcoat: 0.6 }),
    needle: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }),
    red: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35 }),
    hairline: new THREE.MeshBasicMaterial({ color: 0xdc2626 }),
    cursor: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false }),
    spark: new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    ghost: new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.18, depthWrite: false }),
    ghostLine: new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.8 }),
    ring: new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
  };
}

export const LEAD_COLORS = { red: 0xc0262d, black: 0x1f1f1f, blue: 0x1d4ed8, yellow: 0xd6a312, green: 0x15803d, white: 0xdedede };

function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}

// Knurled binding screw at `pos` (its base). The cap is exposed so it can be
// spun when a lead is tightened.
function bindingScrew(M, pos) {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.5, 20), M.brass);
  base.position.y = 0.25;
  const cap = new THREE.Group();
  const capBody = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.75, 28, 1), M.brass);
  const knurl = mesh(new THREE.TorusGeometry(0.72, 0.06, 6, 28), M.brassDull);
  knurl.rotation.x = Math.PI / 2; knurl.position.y = -0.15;
  const knurl2 = knurl.clone(); knurl2.position.y = 0.17;
  const slot = mesh(new THREE.BoxGeometry(1.2, 0.08, 0.14), M.brassDull);
  slot.position.y = 0.38;
  cap.add(capBody, knurl, knurl2, slot);
  cap.position.y = 0.95;
  const post = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), M.brassDull);
  post.position.y = 1.5;
  g.add(base, cap, post);
  g.position.copy(pos);
  g.userData.cap = cap;
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

// Adds a binding screw at local `pos` and registers it as a terminal.
function terminal(M, group, terms, name, pos, label) {
  const s = bindingScrew(M, pos);
  group.add(s);
  terms[name] = { local: pos.clone().setY(pos.y + SCREW_TOP), screw: s, label };
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

// Insulated lead sagging between two anchors, never dropping through `floor`.
export function leadCurve(a, b, { floor = TABLE_Y + 0.25, slack = 1 } = {}) {
  const dist = a.distanceTo(b);
  const sag = Math.min(12, 2 + dist * 0.18) * slack;
  const up = (p, h) => p.clone().add(new THREE.Vector3(0, h, 0));
  const mid = a.clone().lerp(b, 0.5);
  mid.y = Math.max(floor, Math.min(a.y, b.y) - sag);
  const q1 = a.clone().lerp(mid, 0.5); q1.y = Math.max(floor, (a.y + mid.y) / 2 + 0.4);
  const q2 = b.clone().lerp(mid, 0.5); q2.y = Math.max(floor, (b.y + mid.y) / 2 + 0.4);
  return new THREE.CatmullRomCurve3([a.clone(), up(a, 1.3), q1, mid, q2, up(b, 1.3), b.clone()], false, 'centripetal');
}

export function leadMesh(curve, color) {
  const mat = new THREE.MeshPhysicalMaterial({ color: LEAD_COLORS[color] ?? color, roughness: 0.35, clearcoat: 0.5 });
  const g = new THREE.Group();
  const tube = mesh(new THREE.TubeGeometry(curve, 96, 0.22, 10, false), mat, { receive: false });
  const lugMat = new THREE.MeshStandardMaterial({ color: 0xd9a948, metalness: 1, roughness: 0.3 });
  const lug = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10), lugMat);
  const lug2 = lug.clone();
  const p0 = curve.points[0], p1 = curve.points[curve.points.length - 1];
  lug.position.copy(p0).add(new THREE.Vector3(0, 0.45, 0));
  lug2.position.copy(p1).add(new THREE.Vector3(0, 0.45, 0));
  const sleeveMat = mat.clone();
  const boot = mesh(new THREE.CylinderGeometry(0.32, 0.28, 1.1, 10), sleeveMat);
  boot.position.copy(p0).add(new THREE.Vector3(0, 1.3, 0));
  const boot2 = boot.clone(); boot2.position.copy(p1).add(new THREE.Vector3(0, 1.3, 0));
  g.add(tube, lug, lug2, boot, boot2);
  g.userData.tube = tube;
  return g;
}

export function disposeGroup(g) {
  g.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}

// ---------------------------------------------------------------------------
// The meter bridge board (fixed to the bench)
// ---------------------------------------------------------------------------

export function buildBoard(M) {
  const group = new THREE.Group();
  const terms = {};
  const board = mesh(new THREE.BoxGeometry(112, 3, 28), [M.boardSide, M.boardSide, M.board, M.boardSide, M.boardSide, M.boardSide]);
  board.position.set(0, -1.5, 2);
  group.add(board);
  [-54, 54].forEach((x) => [-10, 14].forEach((z) => {
    const foot = mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 16), M.ebonite);
    foot.position.set(x, TABLE_Y + 0.2, z);
    group.add(foot);
  }));
  const scalePlate = mesh(new THREE.BoxGeometry(104, 0.16, 5.5), [M.boardSide, M.boardSide, M.scale, M.boardSide, M.boardSide, M.boardSide]);
  scalePlate.position.set(0, 0.08, WIRE_Z + 3.6);
  group.add(scalePlate);

  const strip = (x0, x1, z0, z1) => {
    const s = mesh(new THREE.BoxGeometry(x1 - x0, STRIP_TOP, z1 - z0), M.copper);
    s.position.set((x0 + x1) / 2, STRIP_TOP / 2, (z0 + z1) / 2);
    group.add(s);
  };
  strip(-52.8, -49.2, BACK_Z - 1.3, WIRE_Z + 1.3);
  strip(-52.8, -29.5, BACK_Z - 1.3, BACK_Z + 1.3);
  strip(-18.5, 18.5, BACK_Z - 1.3, BACK_Z + 1.3);
  strip(49.2, 52.8, BACK_Z - 1.3, WIRE_Z + 1.3);
  strip(29.5, 52.8, BACK_Z - 1.3, BACK_Z + 1.3);

  const engrave = (t, x, z, w = 2.2) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.6), new THREE.MeshStandardMaterial({ map: labelTexture(t, { bg: '#7c4d2a', fg: '#f5e6c8', w: 64 * Math.ceil(w), h: 96, font: 'bold 60px Georgia, serif' }), roughness: 0.6 }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.02, z);
    group.add(p);
  };
  engrave('A', -51, 10.5); engrave('C', 51, 10.5); engrave('B', 0, BACK_Z - 3);
  engrave('Gap 1', -24, BACK_Z + 3.2, 4); engrave('Gap 2', 24, BACK_Z + 3.2, 4);

  const T = (name, x, z, label) => terminal(M, group, terms, name, new THREE.Vector3(x, STRIP_TOP, z), label);
  T('A', -51, -1.5, 'Terminal A');
  T('C', 51, -1.5, 'Terminal C');
  T('g1a', -30.5, BACK_Z, 'Gap 1 (A side)');
  T('g1b', -17.5, BACK_Z, 'Gap 1 (B side)');
  T('B', 0, BACK_Z, 'Centre terminal B');
  T('g2a', 17.5, BACK_Z, 'Gap 2 (B side)');
  T('g2b', 30.5, BACK_Z, 'Gap 2 (C side)');

  [-50, 50].forEach((x) => {
    const clamp = mesh(new THREE.BoxGeometry(1.8, 0.6, 1.6), M.brass);
    clamp.position.set(x, STRIP_TOP + 0.3, WIRE_Z);
    const screw = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 14), M.steel);
    screw.position.set(x, STRIP_TOP + 0.85, WIRE_Z);
    group.add(clamp, screw);
  });
  const bw = mesh(new THREE.CylinderGeometry(0.06, 0.06, 100, 10), M.bridgeWire);
  bw.rotation.z = Math.PI / 2;
  bw.position.set(0, WIRE_Y, WIRE_Z);
  group.add(bw);

  // Sliding cursor with hairline that rides along the scale with the jockey
  const carriage = new THREE.Group();
  const shoe = mesh(new THREE.BoxGeometry(3.4, 0.9, 1.2), M.brass);
  shoe.position.set(0, 0.45, WIRE_Z + 7.1);
  const win = mesh(new THREE.BoxGeometry(3.2, 0.12, 5.6), M.cursor, { cast: false, receive: false });
  win.position.set(0, 0.26, WIRE_Z + 3.7);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 5.4), M.hairline);
  hair.position.set(0, 0.34, WIRE_Z + 3.7);
  carriage.add(shoe, win, hair);
  group.add(carriage);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), M.spark);
  group.add(spark);
  return { group, terminals: terms, carriage, spark, wire: bw };
}

// ---------------------------------------------------------------------------
// Portable apparatus
// ---------------------------------------------------------------------------

export function buildResistanceBox(M) {
  const group = new THREE.Group();
  const terms = {};
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
  terminal(M, group, terms, '1', new THREE.Vector3(-W / 2 + 1.5, top, -3.2), 'Resistance box terminal');
  terminal(M, group, terms, '2', new THREE.Vector3(W / 2 - 1.5, top, -3.2), 'Resistance box terminal');
  return { group, terminals: terms, plugs, size: [W, 8, D], grip: new THREE.Vector3(0, top + 1, 2.5) };
}

export function buildGalvanometer(M) {
  const group = new THREE.Group();
  const terms = {};
  const W = 16, Hh = 6, D = 13;
  const body = mesh(new THREE.BoxGeometry(W, Hh, D), M.bakelite);
  body.position.y = Hh / 2;
  const bezel = mesh(new THREE.BoxGeometry(W - 1, 0.5, D - 2.4), M.ebonite);
  bezel.position.set(0, Hh + 0.25, -0.4);
  group.add(body, bezel);
  const dialGroup = new THREE.Group();
  dialGroup.position.set(0, Hh + 0.52, -0.4);
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 10), M.dial);
  dial.rotation.x = -Math.PI / 2;
  dial.receiveShadow = true;
  dialGroup.add(dial);
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

  const knob = mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.8, 24), M.ebonite);
  knob.position.set(-5.5, Hh + 0.4, D / 2 - 1.1);
  const mark = mesh(new THREE.BoxGeometry(0.15, 0.05, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  mark.position.set(0, 0.42, -0.4);
  knob.add(mark);
  knob.userData.pick = knob;
  knob.userData.kind = 'hr';
  mark.userData.pick = knob;
  group.add(knob);
  const hrLabel = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.1), new THREE.MeshStandardMaterial({ map: labelTexture('HR  2 kΩ', { bg: '#2a1a12', fg: '#f5e6c8', w: 256, h: 96, font: 'bold 38px Georgia, serif' }) }));
  hrLabel.rotation.x = -Math.PI / 2; hrLabel.position.set(-5.5, Hh + 0.02, D / 2 - 2.9);
  group.add(hrLabel);
  const pm = (t, x) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: labelTexture(t, { bg: '#2a1a12', fg: t === '+' ? '#f87171' : '#e5e7eb', w: 96, h: 96, font: 'bold 80px Arial' }) }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, Hh + 0.02, D / 2 - 3.1);
    group.add(p);
  };
  pm('−', 3.4); pm('+', 6.4);
  terminal(M, group, terms, '-', new THREE.Vector3(3.4, Hh, D / 2 - 1.3), 'Galvanometer (−)');
  terminal(M, group, terms, '+', new THREE.Vector3(6.4, Hh, D / 2 - 1.3), 'Galvanometer (+)');
  return { group, terminals: terms, pivot, knob, size: [W, 7, D], grip: new THREE.Vector3(0, Hh + 1, 0) };
}

export function buildAccumulator(M) {
  const group = new THREE.Group();
  const terms = {};
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
  const cp = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 16), M.red); cp.position.set(-2.4, Hh + 1.0, 0);
  const cn = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 16), M.black); cn.position.set(2.4, Hh + 1.0, 0);
  group.add(cp, cn);
  terminal(M, group, terms, '+', new THREE.Vector3(-2.4, Hh + 1.1, 0), 'Accumulator (+)');
  terminal(M, group, terms, '-', new THREE.Vector3(2.4, Hh + 1.1, 0), 'Accumulator (−)');
  return { group, terminals: terms, size: [W, 12, D], grip: new THREE.Vector3(0, Hh + 1.5, 0) };
}

export function buildPlugKey(M) {
  const group = new THREE.Group();
  const terms = {};
  const base = mesh(new THREE.BoxGeometry(9, 1, 4.5), M.ebonite);
  base.position.y = 0.5;
  const b1 = mesh(new THREE.BoxGeometry(3.2, 1.2, 2.6), M.brass); b1.position.set(-2, 1.6, 0);
  const b2 = b1.clone(); b2.position.x = 2;
  group.add(base, b1, b2);
  const p = plug(M);
  const home = new THREE.Vector3(0, 1.8, 0);
  const out = new THREE.Vector3(0, 1.75, 4.4);
  p.position.copy(out);
  p.rotation.x = -Math.PI / 2;
  p.userData = { kind: 'key', home, out, inserted: false, t: 0 };
  p.traverse((o) => { o.userData.pick = p; });
  group.add(p);
  terminal(M, group, terms, '1', new THREE.Vector3(-3, 2.2, -0.6), 'Plug key terminal');
  terminal(M, group, terms, '2', new THREE.Vector3(3, 2.2, -0.6), 'Plug key terminal');
  const label = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshStandardMaterial({ map: labelTexture('KEY  K', { bg: '#141414', fg: '#f5e6c8', w: 256, h: 96, font: 'bold 44px Georgia, serif' }) }));
  label.rotation.x = -Math.PI / 2; label.position.set(0, 1.01, 1.6);
  group.add(label);
  return { group, terminals: terms, plug: p, size: [9, 3, 4.5], grip: new THREE.Vector3(0, 2.4, -1.5) };
}

// The test wire, wound zig-zag over ebonite pegs on a small wooden former,
// with its two ends brought to binding screws.
export function buildCoil(M, material, lengthCm) {
  const group = new THREE.Group();
  const terms = {};
  const frame = mesh(new THREE.BoxGeometry(20, 1, 9), M.mahogany);
  frame.position.set(0, 0.5, 0);
  group.add(frame);
  const n = Math.max(3, Math.min(6, Math.round(lengthCm / 12)));
  const z0 = 3, z1 = -3;
  for (let i = 0; i < n; i++) {
    const px = -7 + (14 * i) / (n - 1);
    [z0, z1].forEach((pz) => {
      const peg = mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 14), M.ebonite);
      peg.position.set(px, 2.1, pz);
      group.add(peg);
    });
  }
  terminal(M, group, terms, '1', new THREE.Vector3(-8.8, 1, 3.3), 'Test wire end');
  terminal(M, group, terms, '2', new THREE.Vector3(8.8, 1, 3.3), 'Test wire end');
  const pts = [terms['1'].local.clone().add(new THREE.Vector3(0, -0.2, 0)), new THREE.Vector3(-8, 2.6, z0 + 0.6)];
  for (let i = 0; i < n; i++) {
    const px = -7 + (14 * i) / (n - 1);
    const zs = i % 2 === 0 ? [z0 + 0.5, z1 - 0.5] : [z1 - 0.5, z0 + 0.5];
    zs.forEach((pz) => pts.push(new THREE.Vector3(px + (i % 2 ? 0.45 : -0.45), 2.4, pz)));
  }
  pts.push(new THREE.Vector3(8, 2.6, z0 + 0.6), terms['2'].local.clone().add(new THREE.Vector3(0, -0.2, 0)));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.2);
  const wireMat = new THREE.MeshStandardMaterial({ color: material.color, metalness: 1, roughness: 0.28, emissive: 0x000000 });
  const wireMesh = mesh(new THREE.TubeGeometry(curve, 300, 0.09, 8, false), wireMat, { receive: false });
  group.add(wireMesh);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.4), new THREE.MeshStandardMaterial({ map: labelTexture('TEST WIRE  X', { bg: '#f1e8d0', fg: '#1b1b1b', w: 384, h: 96, font: 'bold 44px Georgia, serif' }) }));
  tag.rotation.x = -Math.PI / 2; tag.position.set(0, 1.02, 3.6);
  group.add(tag);
  return { group, terminals: terms, curve, wireMesh, size: [20, 3, 9], grip: new THREE.Vector3(0, 3, 0) };
}

export function buildJockey(M) {
  const group = new THREE.Group();
  const terms = {};
  const blade = mesh(new THREE.CylinderGeometry(0.32, 0.02, 1.4, 4, 1), M.brass);
  blade.rotation.y = Math.PI / 4;
  blade.position.y = 0.7;
  const ferrule = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.8, 18), M.brass);
  ferrule.position.y = 1.8;
  const handle = mesh(new THREE.CylinderGeometry(0.55, 0.45, 7, 20), M.handle);
  handle.position.y = 5.6;
  const cap = mesh(new THREE.SphereGeometry(0.6, 18, 12), M.handle);
  cap.position.y = 9.1;
  const socket = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.6, 12), M.brass);
  socket.position.set(0, 9.55, 0);
  group.add(blade, ferrule, handle, cap, socket);
  terms.T = { local: new THREE.Vector3(0, 9.7, 0), screw: socket, label: 'Jockey lead socket' };
  return { group, terminals: terms, size: [1.4, 10, 1.4], grip: new THREE.Vector3(0, 6.5, 0) };
}

// A micrometer screw gauge standing on its frame. setReading(mm) turns the
// thimble so the scales show that reading.
export function buildScrewGauge(M) {
  const group = new THREE.Group();
  const frameMat = M.enamel;
  const S = 1.6; // drawn at 1.6× life size so the scales are legible
  const arc = new THREE.Mesh(new THREE.TorusGeometry(2.4 * S, 0.45 * S, 12, 32, Math.PI), frameMat);
  arc.rotation.z = Math.PI; arc.position.set(0, 3.2 * S, 0); arc.castShadow = true;
  const foot = mesh(new THREE.BoxGeometry(2 * S, 0.5, 1.6 * S), M.ebonite);
  foot.position.set(0, 0.25, 0);
  const stem = mesh(new THREE.CylinderGeometry(0.3 * S, 0.35 * S, 0.9 * S, 12), frameMat);
  stem.position.set(0, 0.35 * S + 0.25, 0);
  group.add(arc, foot, stem);
  const axisY = 3.2 * S;
  const anvil = mesh(new THREE.CylinderGeometry(0.28 * S, 0.28 * S, 0.9 * S, 18), M.chrome);
  anvil.rotation.z = Math.PI / 2; anvil.position.set(-2.4 * S + 0.45 * S, axisY, 0);
  group.add(anvil);
  const anvilFace = -2.4 * S + 0.9 * S;
  const sleeveLen = 5.2 * S;
  const sleeveX0 = 2.4 * S; // sleeve starts at the right arm of the frame
  const sleeve = mesh(new THREE.CylinderGeometry(0.42 * S, 0.42 * S, sleeveLen, 32, 1, true), M.sleeve);
  sleeve.rotation.z = Math.PI / 2;
  sleeve.position.set(sleeveX0 + sleeveLen / 2, axisY, 0);
  sleeve.rotation.x = 0;
  group.add(sleeve);
  const spindle = mesh(new THREE.CylinderGeometry(0.28 * S, 0.28 * S, 1, 18), M.chrome);
  spindle.rotation.z = Math.PI / 2;
  group.add(spindle);
  const thimble = new THREE.Group();
  const thimbleLen = 5.2 * S + 0.6; // long enough that the sleeve always ends inside the thimble
  const tBody = mesh(new THREE.CylinderGeometry(0.62 * S, 0.62 * S, thimbleLen, 48, 1, false), [M.thimble, M.steel, M.steel]);
  tBody.rotation.z = Math.PI / 2; // texture top (divisions) toward the sleeve edge
  tBody.position.x = thimbleLen / 2;
  const bevel = mesh(new THREE.CylinderGeometry(0.44 * S, 0.62 * S, 0.3 * S, 48), M.steel);
  bevel.rotation.z = Math.PI / 2; bevel.position.x = 0.15 * S;
  tBody.position.x = thimbleLen / 2 + 0.3 * S;
  const ratchet = mesh(new THREE.CylinderGeometry(0.4 * S, 0.4 * S, 1.2 * S, 24), M.steel);
  ratchet.rotation.z = Math.PI / 2; ratchet.position.x = thimbleLen + 0.6 * S;
  thimble.add(tBody, bevel, ratchet);
  thimble.position.set(0, axisY, 0);
  group.add(thimble);
  const lockLever = mesh(new THREE.BoxGeometry(0.3 * S, 0.9 * S, 0.3 * S), M.chrome);
  lockLever.position.set(1.9 * S, axisY + 0.6 * S, 0.4 * S);
  group.add(lockLever);
  // The sleeve texture's first graduation (0 mm) sits at SLEEVE_PX.x0 px of 1024 over its length
  const mmToCm = (sleeveLen * (SLEEVE_PX.pxmm / SLEEVE_PX.w)); // sleeve cm per real mm
  const zeroX = sleeveX0 + sleeveLen * (SLEEVE_PX.x0 / SLEEVE_PX.w);
  // Orient sleeve texture: u runs around the circumference, v along the length.
  // Rotate the geometry's UVs so the mm scale runs along the axis instead.
  const uv = sleeve.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, 1 - v, u * 4 + 0.5); }
  M.sleeve.map.wrapT = THREE.RepeatWrapping;
  uv.needsUpdate = true;

  const sample = mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 10), M.bridgeWire);
  sample.rotation.x = Math.PI / 2;
  sample.visible = false;
  group.add(sample);

  function setReading(mm, sampleMm = null) {
    const edge = zeroX + mm * mmToCm;
    thimble.position.x = edge;
    // one revolution = 0.5 mm; division aligned with the reference line = CSD
    thimble.rotation.x = ((((mm % 0.5) + 0.5) % 0.5) / 0.5) * Math.PI * 2;
    const gapMm = Math.max(0, mm);
    const tipX = anvilFace + gapMm * mmToCm;
    spindle.scale.y = Math.max(0.1, edge - tipX);
    spindle.position.set((edge + tipX) / 2, axisY, 0);
    if (sampleMm != null) {
      sample.visible = true;
      const r = Math.max(0.03, (sampleMm * mmToCm) / 2);
      sample.scale.set(r / 0.05, 1, r / 0.05);
      sample.position.set(anvilFace + r, axisY, 0);
    } else sample.visible = false;
  }
  setReading(3);
  return { group, setReading, axisY, zeroX, size: [14, 8, 3], grip: new THREE.Vector3(3 * S, axisY + 1, 0) };
}

// Half-metre wooden rule for measuring the test wire.
export function buildRule(M) {
  const group = new THREE.Group();
  const r = mesh(new THREE.BoxGeometry(104, 0.4, 3.2), [M.boardSide, M.boardSide, M.ruler, M.boardSide, M.boardSide, M.boardSide]);
  r.position.y = 0.2;
  group.add(r);
  return { group, size: [104, 0.4, 3.2], grip: new THREE.Vector3(0, 1, 0) };
}

// Slot marker drawn on the bench where a piece of apparatus belongs.
export function slotMarker(M, w, d, label) {
  const g = new THREE.Group();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w + 2, d + 2), M.ghost.clone());
  plane.rotation.x = -Math.PI / 2; plane.position.y = 0.05;
  const shape = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-w / 2 - 1, 0.08, -d / 2 - 1), new THREE.Vector3(w / 2 + 1, 0.08, -d / 2 - 1),
    new THREE.Vector3(w / 2 + 1, 0.08, d / 2 + 1), new THREE.Vector3(-w / 2 - 1, 0.08, d / 2 + 1),
    new THREE.Vector3(-w / 2 - 1, 0.08, -d / 2 - 1),
  ]);
  const outline = new THREE.Line(shape, M.ghostLine.clone());
  g.add(plane, outline);
  g.userData.label = label;
  g.userData.plane = plane;
  return g;
}
