import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import * as P from './physics.js';
import * as S from './scene.js';
import { buildRoom, ROOM, TROLLEY, FLOOR_Y } from './room.js';
import { loadAvatar } from './avatar.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('gl');
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------
// Renderer, camera, lighting
// ---------------------------------------------------------------------------

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  stage.insertAdjacentHTML('beforeend', '<div id="glError">WebGL is not available in this browser, so the 3D lab cannot be shown.</div>');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const params = new URLSearchParams(location.search);
let lowGfx = params.has('lowgfx');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd9d4c8);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 2500);
camera.position.set(60, 95, 150);
const controls = new OrbitControls(camera, canvas);
controls.target.set(55, -8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 10;
controls.maxDistance = 420;
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

scene.add(new THREE.HemisphereLight(0xfff8ec, 0x6b5a48, 0.9));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
sun.position.set(-380, 260, 40);
sun.target.position.set(60, S.TABLE_Y, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 110, bottom: -110, near: 100, far: 900 });
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
function applyQuality(low) {
  lowGfx = low;
  renderer.setPixelRatio(low ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !low;
  sun.castShadow = !low;
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
  const cb = document.getElementById('optQuality');
  if (cb) cb.checked = !low;
  if (typeof resize === 'function') resize();
}
[[0, 190, -110], [0, 190, 110], [220, 190, 0]].forEach(([x, y, z]) => {
  const l = new THREE.PointLight(0xfff6e5, 26000, 0, 2);
  l.position.set(x, y, z);
  scene.add(l);
});

const room = buildRoom(scene, S.TABLE_Y);
const M = S.makeMaterials();

// ---------------------------------------------------------------------------
// Apparatus
// ---------------------------------------------------------------------------

const board = S.buildBoard(M);
scene.add(board.group);

const ITEMS = {
  box: { name: 'Resistance box', build: () => S.buildResistanceBox(M), slot: [-27, -27, 0], home: [157, -15, 0], label: 'Resistance box (R)' },
  galv: { name: 'Galvanometer', build: () => S.buildGalvanometer(M), slot: [0, -27, 0], home: [213, -15, 0], label: 'Galvanometer (G)' },
  coil: { name: 'Test wire', build: null, slot: [27, -23, 0], home: [158, 17, 0], label: 'Test wire (X)' },
  cell: { name: 'Accumulator', build: () => S.buildAccumulator(M), slot: [-38, 30, 0.12], home: [194, 18, 0], label: 'Accumulator (E)' },
  key: { name: 'Plug key', build: () => S.buildPlugKey(M), slot: [-14, 29, 0], home: [222, 19, 0], label: 'Plug key (K)' },
  jockey: { name: 'Jockey', build: () => S.buildJockey(M), slot: null, home: [180, 27, 0], label: 'Jockey' },
};
const gauge = S.buildScrewGauge(M);
gauge.group.position.set(62, S.TABLE_Y, 32);
gauge.group.rotation.y = -0.35;
scene.add(gauge.group);
const ppe = S.buildPPEStation(M);
ppe.group.position.set(ROOM.x1 - 2, FLOOR_Y, 90);
ppe.group.rotation.y = -Math.PI / 2; // faces into the room
scene.add(ppe.group);
Object.values(ppe.items).forEach((o) => { o.userData.home = o.position.clone(); });
const PPE_SPOT = { x: 470, z: 90, h: -Math.PI / 2 };
const GEAR = ['coat', 'goggles', 'gloves', 'shoes'];
const GEAR_NAMES = { coat: 'lab coat', goggles: 'safety goggles', gloves: 'nitrile gloves', shoes: 'safety shoes' };
const rule = S.buildRule(M);
rule.group.position.set(0, S.TABLE_Y, -40);
scene.add(rule.group);

const state = {
  materialChoice: 'nichrome',
  app: null,
  plugsOut: new Set(),
  keyIn: false,
  protect: true,
  l: 50,
  lift: 1.2,
  holdSources: new Set(),
  T: P.T_ROOM,
  keyOnFor: 0,
  needle: { theta: 0, omega: 0 },
  sol: { Ig: 0, Icell: 0, IX: 0, P_X: 0 },
  probe: null,
  hrUsed: false,
  endsTapped: { lo: null, hi: null },
  readings: [],
  gauge: { zero: null, rows: [] },
  length: null,
  flow: true,
  labels: true,
  pip: true,
  sound: true,
  leadColor: 'auto',
  mode: 'auto', // auto (watch the student) | fp (first person) | classic (no human)
  started: false,
  scratchWarned: 0,
  shortWarned: 0,
};

function makeItems() {
  for (const [key, it] of Object.entries(ITEMS)) {
    if (key === 'coil') continue;
    it.app = it.build();
    it.group = it.app.group;
    scene.add(it.group);
    it.key = key;
    it.group.traverse((o) => { if (!o.userData.pick && !o.userData.term) o.userData.item = key; });
  }
}
makeItems();

function buildCoilItem() {
  const it = ITEMS.coil;
  const prev = it.group;
  it.app = S.buildCoil(M, state.app.material, state.app.lengthCm);
  it.group = it.app.group;
  it.key = 'coil';
  if (prev) { it.group.position.copy(prev.position); it.group.rotation.copy(prev.rotation); scene.remove(prev); S.disposeGroup(prev); }
  scene.add(it.group);
  it.group.traverse((o) => { o.userData.item = 'coil'; });
  registerTerminals();
}

const itemAt = (it, spot) => {
  it.group.position.set(spot[0], S.TABLE_Y, spot[1]);
  it.group.rotation.set(0, spot[2] || 0, 0);
};

function sendHome(key) {
  const it = ITEMS[key];
  it.placed = false; it.onBoard = false;
  if (key === 'jockey') {
    it.group.position.set(it.home[0], S.TABLE_Y + 0.6, it.home[1]);
    it.group.rotation.set(0, 0.3, Math.PI / 2);
  } else itemAt(it, it.home);
}
function placeAtSlot(key) {
  const it = ITEMS[key];
  if (key === 'jockey') { it.onBoard = true; it.placed = true; return; }
  itemAt(it, it.slot);
  it.placed = true;
}

// Slot markers show where each item belongs while setting up
const slotMarkers = {};
for (const [key, it] of Object.entries(ITEMS)) {
  if (!it.slot) continue;
  const size = key === 'coil' ? [20, 3, 9] : null;
  const s = size || (it.app ? it.app.size : [10, 1, 10]);
  const m = S.slotMarker(M, s[0], s[2], it.name);
  m.position.set(it.slot[0], S.TABLE_Y + 0.02, it.slot[1]);
  m.rotation.y = it.slot[2] || 0;
  m.visible = false;
  scene.add(m);
  slotMarkers[key] = m;
}
const wireMarker = (() => {
  const g = new THREE.Mesh(new THREE.BoxGeometry(100, 0.1, 2.2), M.ghost.clone());
  g.position.set(0, S.WIRE_Y + 0.2, S.WIRE_Z);
  g.visible = false;
  scene.add(g);
  return g;
})();

// ---------------------------------------------------------------------------
// Terminals and leads
// ---------------------------------------------------------------------------

const terminals = {}; // id → { owner, local, label, screw }
function registerTerminals() {
  const add = (prefix, owner, terms) => {
    for (const [n, t] of Object.entries(terms)) {
      const id = `${prefix}.${n}`;
      terminals[id] = { id, owner, local: t.local, label: t.label, screw: t.screw };
      if (t.screw) t.screw.traverse((o) => { o.userData.term = id; });
    }
  };
  add('board', board.group, board.terminals);
  for (const [key, it] of Object.entries(ITEMS)) if (it.app) add(key, it.group, it.app.terminals);
}
const termWorld = (id) => {
  const t = terminals[id];
  t.owner.updateMatrixWorld(true);
  return t.owner.localToWorld(t.local.clone());
};

const leads = []; // { id, a, b, color, mesh, curve, pa, pb }
let leadSeq = 0;
let leadsVersion = 0;
const COLORS = ['red', 'black', 'blue', 'yellow', 'green', 'white'];
function pickColor(a) {
  if (state.leadColor !== 'auto') return state.leadColor;
  if (a === 'cell.+') return 'red';
  if (a === 'cell.-') return 'black';
  if (a.startsWith('galv') || a === 'jockey.T') return 'green';
  if (a.startsWith('box') || a.startsWith('coil')) return 'blue';
  return COLORS[leads.length % COLORS.length];
}

// ---- Lead routing: leads go round the meter bridge board and drape over
// whatever they cross instead of passing through it ----
const BOARD_RECT = { x0: -56, x1: 56, z0: -12, z1: 16, top: 1.1 };
const inRect = (p, r, m = 0) => p.x > r.x0 - m && p.x < r.x1 + m && p.z > r.z0 - m && p.z < r.z1 + m;
function leadObstacles() {
  const list = [BOARD_RECT];
  const box = new THREE.Box3();
  for (const it of Object.values(ITEMS)) {
    if (!it.group || !it.group.visible || carried.has(it.key)) continue;
    box.setFromObject(it.group);
    list.push({ x0: box.min.x, x1: box.max.x, z0: box.min.z, z1: box.max.z, top: box.max.y + 0.3, item: it.key });
  }
  return list;
}
// Length of a straight xz path from p to q that lies inside the board, ignoring the part within `near` of q
function crossesBoard(p, q, near = 0) {
  let inside = 0;
  const n = 24;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = p.x + (q.x - p.x) * t, z = p.z + (q.z - p.z) * t;
    if (Math.hypot(q.x - x, q.z - z) < near || Math.hypot(p.x - x, p.z - z) < near) continue;
    if (inRect({ x, z }, BOARD_RECT)) inside++;
  }
  return inside > 0;
}
function routedLeadCurve(a, b, slack = 1) {
  const floor = S.TABLE_Y + 0.25;
  const obstacles = leadObstacles();
  const aOn = inRect(a, BOARD_RECT, 1), bOn = inRect(b, BOARD_RECT, 1);
  // A lead from off the board to a terminal on it (or across it) detours round a board corner
  let via = null;
  if (!(aOn && bOn) && crossesBoard(a, b, aOn || bOn ? 16 : 0)) {
    let best = Infinity;
    for (const [cx, cz] of [[-61, 21], [61, 21], [-61, -17], [61, -17]]) {
      const P = { x: cx, z: cz };
      const okA = !crossesBoard(P, a, aOn ? 16 : 0), okB = !crossesBoard(P, b, bOn ? 16 : 0);
      const cost = Math.hypot(a.x - cx, a.z - cz) + Math.hypot(b.x - cx, b.z - cz);
      if (okA && okB && cost < best) { best = cost; via = V3(cx, floor, cz); }
    }
  }
  const up = (p, h) => p.clone().add(V3(0, h, 0));
  const sagPt = (p, q, f) => { const m = p.clone().lerp(q, f); m.y = floor; return m; };
  const pts = [a.clone(), up(a, 1.3)];
  if (via) pts.push(sagPt(a, via, 0.55), via, sagPt(via, b, 0.45));
  else { const base = S.leadCurve(a, b, { slack }); pts.push(...base.points.slice(2, -2)); }
  pts.push(up(b, 1.3), b.clone());
  // Drape: sample the path and lift it over the board and apparatus it crosses
  const raw = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const N = 40;
  const out = [];
  for (let i = 0; i <= N; i++) {
    const p = raw.getPoint(i / N);
    if (i > 1 && i < N - 1) {
      const dA = Math.hypot(p.x - a.x, p.z - a.z), dB = Math.hypot(p.x - b.x, p.z - b.z);
      let h = floor;
      for (const o of obstacles) {
        if (!inRect(p, o, 0.6)) continue;
        if ((inRect(a, o, 1) && dA < 4) || (inRect(b, o, 1) && dB < 4)) continue; // its own terminal
        h = Math.max(h, o.top);
      }
      p.y = Math.max(p.y, h);
    }
    out.push(p);
  }
  return new THREE.CatmullRomCurve3(out, false, 'centripetal', 0.3);
}

function rebuildLeadMesh(L) {
  if (L.mesh) { scene.remove(L.mesh); S.disposeGroup(L.mesh); }
  L.pa = termWorld(L.a); L.pb = termWorld(L.b);
  L.curve = routedLeadCurve(L.pa, L.pb, L.slack);
  L.mesh = S.leadMesh(L.curve, L.color);
  L.mesh.traverse((o) => { o.userData.lead = L; });
  scene.add(L.mesh);
}

function connect(a, b, color) {
  if (a === b) return null;
  if (leads.some((L) => (L.a === a && L.b === b) || (L.a === b && L.b === a))) {
    toast('Those two terminals are already connected.', 'info');
    return null;
  }
  const busy = (t) => leads.filter((L) => L.a === t || L.b === t).length;
  if (busy(a) >= 3 || busy(b) >= 3) { toast('A binding screw can hold at most three leads.', 'warn'); return null; }
  const L = { id: ++leadSeq, a, b, color: color || pickColor(a), slack: 0.8 + Math.random() * 0.5 };
  rebuildLeadMesh(L);
  leads.push(L);
  leadsVersion++;
  spinScrew(a); spinScrew(b);
  sfx('tick');
  checkFaults(L);
  return L;
}
function disconnect(L) {
  const i = leads.indexOf(L);
  if (i < 0) return;
  leads.splice(i, 1);
  scene.remove(L.mesh); S.disposeGroup(L.mesh);
  leadsVersion++;
  sfx('tick');
}
const spinning = [];
function spinScrew(id) {
  const t = terminals[id];
  if (t && t.screw && t.screw.userData.cap) spinning.push({ cap: t.screw.userData.cap, left: 0.45 });
}
function updateLeads() {
  for (const L of leads) {
    const pa = termWorld(L.a), pb = termWorld(L.b);
    if (pa.distanceToSquared(L.pa) > 1e-4 || pb.distanceToSquared(L.pb) > 1e-4) rebuildLeadMesh(L);
  }
}

// A lead being run from one terminal to the hand
let pending = null; // { from, mesh }
function updatePendingLead(handPoint) {
  if (!pending) return;
  if (pending.mesh) { scene.remove(pending.mesh); S.disposeGroup(pending.mesh); }
  const a = termWorld(pending.from);
  const curve = S.leadCurve(a, handPoint, { slack: 0.6 });
  pending.mesh = S.leadMesh(curve, pending.color);
  scene.add(pending.mesh);
}
function startLead(from) {
  cancelLead();
  pending = { from, color: pickColor(from), mesh: null };
  spinScrew(from);
  sfx('tick');
}
function cancelLead() {
  if (pending && pending.mesh) { scene.remove(pending.mesh); S.disposeGroup(pending.mesh); }
  pending = null;
}
function finishLead(to) {
  if (!pending) return null;
  const { from, color } = pending;
  cancelLead();
  return connect(from, to, color);
}

// ---------------------------------------------------------------------------
// Wiring topology (what the student has actually connected)
// ---------------------------------------------------------------------------

const STRIPS = [['board.A', 'board.g1a'], ['board.g1b', 'board.B'], ['board.B', 'board.g2a'], ['board.g2b', 'board.C']];
function topology() {
  return P.netClasses([...STRIPS, ...leads.map((L) => [L.a, L.b])]);
}
function wiringChecks() {
  const f = topology();
  const same = (a, b) => f(a) === f(b);
  const A = f('board.A'), B = f('board.B'), C = f('board.C');
  const cls = (t) => f(t);
  // Cell and key in series between the A and C strips (either way round)
  const cellT = ['cell.+', 'cell.-'], keyT = ['key.1', 'key.2'];
  let ck = null;
  for (const c of cellT) for (const k of keyT) {
    if (!same(c, k)) continue;
    const ko = keyT.find((x) => x !== k), co = cellT.find((x) => x !== c);
    const kStrip = cls(ko) === A ? 'A' : cls(ko) === C ? 'C' : null;
    const cStrip = cls(co) === A ? 'A' : cls(co) === C ? 'C' : null;
    const cand = { cellToKey: true, keyToStrip: !!kStrip, cellToStrip: !!cStrip && cStrip !== kStrip };
    if (!ck || (cand.keyToStrip + cand.cellToStrip) > (ck.keyToStrip + ck.cellToStrip)) ck = cand;
  }
  ck = ck || { cellToKey: false, keyToStrip: false, cellToStrip: false };
  const across = (p, q, X, Y) => (cls(p) === X && cls(q) === Y) || (cls(p) === Y && cls(q) === X);
  const boxGap = across('box.1', 'box.2', A, B) ? 1 : across('box.1', 'box.2', B, C) ? 2 : 0;
  const coilGap = across('coil.1', 'coil.2', A, B) ? 1 : across('coil.1', 'coil.2', B, C) ? 2 : 0;
  const gB = cls('galv.+') === B ? 'galv.-' : cls('galv.-') === B ? 'galv.+' : null;
  const galvB = !!gB;
  const galvJ = gB ? cls(gB) === cls('jockey.T') : (same('galv.+', 'jockey.T') || same('galv.-', 'jockey.T'));
  return {
    cellKey: ck.cellToKey, keyStrip: ck.keyToStrip, cellStrip: ck.cellToStrip,
    boxGap, coilGap, box: boxGap > 0 && boxGap !== coilGap, coil: coilGap > 0 && coilGap !== boxGap,
    galvB, galvJ,
    complete: !!(ck.cellToKey && ck.keyToStrip && ck.cellToStrip && boxGap && coilGap && boxGap !== coilGap && galvB && galvJ),
    swapped: boxGap === 2,
  };
}

// Warn straight away about connections that short something out
function checkFaults(L) {
  const f = topology();
  const same = (a, b) => f(a) === f(b);
  const faults = [];
  if (same('cell.+', 'cell.-')) faults.push('That lead short-circuits the accumulator! Remove it at once.');
  if (same('board.A', 'board.B') || same('board.B', 'board.C') || same('board.A', 'board.C')) faults.push('That lead joins two copper strips directly and shorts part of the bridge.');
  if (same('box.1', 'box.2')) faults.push('Both resistance-box terminals are now joined, so the box is shorted.');
  if (same('coil.1', 'coil.2')) faults.push('Both ends of the test wire are joined, so the wire is shorted.');
  if (same('galv.+', 'galv.-')) faults.push('The galvanometer terminals are joined — it can never deflect.');
  if (same('key.1', 'key.2')) faults.push('The key is bypassed, so current will flow without it.');
  if (['board.A', 'board.B', 'board.C'].some((t) => same(t, 'jockey.T'))) faults.push('The jockey should go to the galvanometer, not to a copper strip.');
  if (faults.length) { toast(faults[0], 'err', 6500); sfx('buzz'); }
  else {
    const t = (id) => terminals[id]?.label || id;
    toast(`Connected: ${t(L.a)} ↔ ${t(L.b)}`, 'ok', 2200);
  }
}

// ---------------------------------------------------------------------------
// Electrical solution of whatever has been wired
// ---------------------------------------------------------------------------

const currentR = () => [...state.plugsOut].reduce((s, i) => s + P.BOX_PLUGS[i], 0);
const contact = () => state.lift < 0.04 && ITEMS.jockey.onBoard;
let E = {};

function buildNet({ l = state.l, pressed = contact(), protect = state.protect, keyIn = liveKey() } = {}) {
  const a = state.app;
  const X = P.wireResistance(a, state.T);
  const el = [];
  const add = (e) => { el.push(e); return e; };
  const lc = THREE.MathUtils.clamp(l, 0, 100);
  E = {};
  E.cell = add({ a: 'cell.+', b: 'cell.-', emf: a.cell.emf, r: a.cell.internal });
  E.key = keyIn ? add({ a: 'key.1', b: 'key.2', R: 0.002 }) : null;
  E.box = add({ a: 'box.1', b: 'box.2', R: Math.max(currentR(), 0.0005) + a.contact });
  E.coil = add({ a: 'coil.1', b: 'coil.2', R: X + a.contact });
  E.galv = add({ a: 'galv.+', b: 'galv.-', R: P.GALV.resistance + (protect ? P.GALV.protection : 0) });
  E.stripA = add({ a: 'board.A', b: 'board.g1a', R: 0.0008 });
  E.alpha = add({ a: 'board.A', b: 'wA', R: a.alpha });
  E.wireL = add({ a: 'wA', b: 'D', R: a.lambda * lc + 1e-4 });
  E.wireR = add({ a: 'D', b: 'wC', R: a.lambda * (100 - lc) + 1e-4 });
  E.beta = add({ a: 'wC', b: 'board.C', R: a.beta });
  E.stripB1 = add({ a: 'board.g1b', b: 'board.B', R: 0.0008 });
  E.stripB2 = add({ a: 'board.B', b: 'board.g2a', R: 0.0008 });
  E.stripC = add({ a: 'board.g2b', b: 'board.C', R: 0.0008 });
  E.jockey = pressed ? add({ a: 'jockey.T', b: 'D', R: 0.05 }) : null;
  for (const L of leads) L.el = add({ a: L.a, b: L.b, R: P.LEAD_RESISTANCE });
  return { el, X };
}
const liveKey = () => state.keyIn && ITEMS.key.app.plug.userData.t > 0.92;

function solveNow(opts) {
  const { el, X } = buildNet(opts);
  const net = P.solveNetwork(el, 'cell.-');
  const Ig = net.current(E.galv);
  const IX = net.current(E.coil);
  return { net, Ig, Icell: net.current(E.cell), IX, P_X: IX * IX * X, E };
}

// Null point from the student's actual circuit (null if there is none)
function findNull() {
  const f = (l) => solveNow({ l, pressed: true, protect: false, keyIn: true }).Ig;
  if (!ITEMS.jockey.onBoard) return null;
  let lo = 0.5, hi = 99.5, flo = f(lo);
  const fhi = f(hi);
  if (Math.sign(flo) === Math.sign(fhi) || Math.abs(flo) < 1e-12) return null;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Charge-flow particles along leads, strips, wires
// ---------------------------------------------------------------------------

const FLOW_MAX = 1600;
const flowMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), FLOW_MAX);
flowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
flowMesh.frustumCulled = false;
scene.add(flowMesh);
const colMain = new THREE.Color(0xffd166), colGalv = new THREE.Color(0x5eead4);
let flowSegs = [];
let flowKey = '';
const poly = (...pts) => {
  const path = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return path;
};
function rebuildFlow() {
  const y = S.STRIP_TOP + 0.05;
  const v = (x, z, yy = y) => V3(x, yy, z);
  const cur = (k) => () => (state.sol.net && E[k] ? state.sol.net.current(E[k]) : 0);
  const segs = [
    { curve: poly(v(-51, -1.5), v(-51, S.WIRE_Z)), I: cur('alpha') },
    { curve: poly(v(-51, -1.5), v(-51, -8), v(-30.5, -8)), I: cur('stripA') },
    { curve: poly(v(-17.5, -8), v(0, -8)), I: cur('stripB1') },
    { curve: poly(v(0, -8), v(17.5, -8)), I: cur('stripB2') },
    { curve: poly(v(30.5, -8), v(51, -8), v(51, -1.5)), I: cur('stripC') },
    { curve: poly(v(51, S.WIRE_Z), v(51, -1.5)), I: cur('beta') },
    { curve: null, I: cur('wireL'), dyn: 'wireL' },
    { curve: null, I: cur('wireR'), dyn: 'wireR' },
  ];
  const bi = poly(termWorld('box.1').add(V3(0, 0.3, 0)), termWorld('box.2').add(V3(0, 0.3, 0)));
  segs.push({ curve: bi, I: cur('box') });
  const cg = ITEMS.coil.group; cg.updateMatrixWorld(true);
  segs.push({ curve: new THREE.CatmullRomCurve3(ITEMS.coil.app.curve.points.map((p) => cg.localToWorld(p.clone())), false, 'centripetal', 0.2), I: cur('coil') });
  for (const L of leads) {
    const galv = [L.a, L.b].some((t) => t.startsWith('galv') || t === 'jockey.T');
    segs.push({ curve: L.curve, I: () => (state.sol.net && L.el ? state.sol.net.current(L.el) : 0), galv });
  }
  flowSegs = segs.map((s) => ({ ...s, phase: Math.random(), len: s.curve ? Math.max(0.5, s.curve.getLength()) : 1 }));
}
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
function visSpeed(I) {
  const a = Math.abs(I);
  if (a < 2e-8) return 0;
  return Math.sign(I) * (3 + 19 * Math.min(1, Math.log10(a / 2e-8) / 7.7));
}
function updateFlow(dt) {
  const key = `${leadsVersion}|${leads.map((L) => L.pa.x.toFixed(1) + L.pb.z.toFixed(1)).join()}|${ITEMS.coil.group.position.x}|${ITEMS.box.group.position.x}`;
  if (key !== flowKey) { flowKey = key; rebuildFlow(); }
  const x = S.lToX(state.l), wy = S.WIRE_Y;
  for (const s of flowSegs) {
    if (s.dyn === 'wireL') { s.curve = poly(V3(-50, wy, S.WIRE_Z), V3(Math.max(x, -49.9), wy, S.WIRE_Z)); s.len = Math.max(0.5, x + 50); }
    if (s.dyn === 'wireR') { s.curve = poly(V3(Math.min(x, 49.9), wy, S.WIRE_Z), V3(50, wy, S.WIRE_Z)); s.len = Math.max(0.5, 50 - x); }
  }
  let n = 0;
  if (state.flow && state.sol.net && Math.abs(state.sol.Icell) > 1e-6) {
    for (const s of flowSegs) {
      if (!s.curve) continue;
      const I = s.I();
      const v = visSpeed(I);
      if (!v) continue;
      s.phase = (s.phase + (v * dt) / s.len + 1) % 1;
      const count = Math.max(1, Math.floor(s.len / 2.4));
      const size = 0.6 + 0.6 * Math.min(1, Math.log10(Math.abs(I) / 2e-8) / 7.7);
      for (let i = 0; i < count && n < FLOW_MAX; i++) {
        s.curve.getPointAt((i / count + s.phase) % 1, tmpP);
        tmpS.setScalar(s.galv ? size * 1.15 : size);
        tmpM.compose(tmpP, tmpQ, tmpS);
        flowMesh.setMatrixAt(n, tmpM);
        flowMesh.setColorAt(n, s.galv ? colGalv : colMain);
        n++;
      }
    }
  }
  flowMesh.count = n;
  flowMesh.instanceMatrix.needsUpdate = true;
  if (flowMesh.instanceColor) flowMesh.instanceColor.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

let actx = null;
function sfx(kind) {
  if (!state.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime;
    const g = actx.createGain();
    g.connect(actx.destination);
    const o = actx.createOscillator();
    const spec = { tick: [2400, 0.03, 0.08, 'square'], click: [900, 0.05, 0.12, 'triangle'], thud: [140, 0.09, 0.25, 'sine'], buzz: [110, 0.35, 0.12, 'sawtooth'], ok: [880, 0.12, 0.08, 'sine'] }[kind] || [600, 0.05, 0.1, 'sine'];
    o.type = spec[3]; o.frequency.setValueAtTime(spec[0], t);
    if (kind === 'ok') o.frequency.setValueAtTime(1320, t + 0.06);
    g.gain.setValueAtTime(spec[2], t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + spec[1]);
    o.connect(g); o.start(t); o.stop(t + spec[1] + 0.02);
  } catch (e) { /* audio unavailable */ }
}

// ---------------------------------------------------------------------------
// Hands
// ---------------------------------------------------------------------------

let hands = null; // the hands in use (null in the no-human mode)
let handsLoaded = null;
let avatar = null;
const FIXED_SHOULDER = { right: V3(40, 45, 120), left: V3(-40, 45, 120) };
const SHOULDER = { right: FIXED_SHOULDER.right.clone(), left: FIXED_SHOULDER.left.clone() };
const LEFT_REST = V3(-78, S.TABLE_Y + 1.2, 34);
function aimHand(hand, target, pitch = -0.2) {
  const d = target.clone().sub(SHOULDER[hand.side]);
  const base = bodyMode() && avatar ? avatar.state.heading : 0;
  const yaw = Math.atan2(-d.x, -d.z);
  hand.yawGoal = base + THREE.MathUtils.clamp(wrapAngle(yaw - base), -1.1, 1.1);
  hand.pitchGoal = pitch;
}
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const bodyMode = () => state.mode === 'auto' || state.mode === 'fp';
const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;

// ---------------------------------------------------------------------------
// Student body: walking, collisions, reach
// ---------------------------------------------------------------------------

const keys = new Set();
const walking = { active: false, speed: 0, keys: false };
// Floor-plan obstacles (x0, x1, z0, z1) the student cannot walk through
const OBSTACLES = [
  [-120, 120, -45, 45], // own bench
  [TROLLEY.x - TROLLEY.w / 2 - 6, TROLLEY.x + TROLLEY.w / 2 + 8, TROLLEY.z - TROLLEY.d / 2, TROLLEY.z + TROLLEY.d / 2],
  [-330, -250, -170, 30], [-330, -250, 70, 270], [230, 430, 210, 290], // other benches
  [ROOM.x1 - 47, ROOM.x1, -205, -15], // apparatus cabinet
  [-167, -133, 43, 77], // stool
  [ROOM.x1 - 50, ROOM.x1, 20, 160], // PPE station
];
const BODY_R = 16;
function collide(p) {
  p.x = THREE.MathUtils.clamp(p.x, ROOM.x0 + BODY_R, ROOM.x1 - BODY_R);
  p.z = THREE.MathUtils.clamp(p.z, ROOM.z0 + BODY_R, ROOM.z1 - BODY_R);
  for (const [x0, x1, z0, z1] of OBSTACLES) {
    const a = x0 - BODY_R, b = x1 + BODY_R, c = z0 - BODY_R, d = z1 + BODY_R;
    if (p.x > a && p.x < b && p.z > c && p.z < d) {
      const pen = [p.x - a, b - p.x, p.z - c, d - p.z];
      const m = Math.min(...pen);
      if (m === pen[0]) p.x = a; else if (m === pen[1]) p.x = b; else if (m === pen[2]) p.z = c; else p.z = d;
    }
  }
  return p;
}
// Can the student reach point p from where they stand (leaning over the bench)?
function reachable(p) {
  if (!bodyMode() || !avatar) return true;
  const a = avatar.state.pos, h = avatar.state.heading;
  const dx = p.x - a.x, dz = p.z - a.z;
  const fwd = -dx * Math.sin(h) - dz * Math.cos(h);
  const side = dx * Math.cos(h) - dz * Math.sin(h);
  return fwd > -12 && fwd < 96 && Math.abs(side) < 58;
}
function standSpot(p) {
  if (p.x > 440 && Math.abs(p.z - PPE_SPOT.z) < 80) return PPE_SPOT;
  const nearTrolley = Math.abs(p.x - TROLLEY.x) < TROLLEY.w / 2 + 12 && Math.abs(p.z - TROLLEY.z) < TROLLEY.d / 2 + 12;
  if (nearTrolley) return { x: THREE.MathUtils.clamp(p.x, TROLLEY.x - 40, TROLLEY.x + 40), z: TROLLEY.z + TROLLEY.d / 2 + 24, h: 0 };
  return { x: THREE.MathUtils.clamp(p.x, -100, 100), z: 58, h: 0 };
}
async function walkTo(spot) {
  if (!avatar) return;
  const a = avatar.state;
  const dest = collide(V3(spot.x, FLOOR_Y, spot.z));
  const pts = [a.pos.clone()];
  // Go round by the front aisle when moving between bench and trolley
  if (Math.abs(a.pos.x - dest.x) > 60 && (a.pos.z < 80 || dest.z < 80)) {
    pts.push(collide(V3(a.pos.x, FLOOR_Y, Math.max(a.pos.z, 84))), collide(V3(dest.x, FLOOR_Y, Math.max(dest.z, 84))));
  }
  pts.push(dest);
  walking.active = true;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const len = p0.distanceTo(p1);
    if (len < 1) continue;
    const hd = Math.atan2(-(p1.x - p0.x), -(p1.z - p0.z));
    walking.speed = 140;
    await tween(len / 140, (e, k) => { a.pos.lerpVectors(p0, p1, k); a.heading = lerpAngle(a.heading, hd, 0.25); });
    checkAbort();
  }
  walking.speed = 0;
  await tween(0.35, () => { a.heading = lerpAngle(a.heading, spot.h ?? 0, 0.3); });
  walking.active = false;
}
// In student mode, walk over first if the target is out of reach
async function approach(p) {
  if (!bodyMode() || !avatar || reachable(p)) return;
  await walkTo(standSpot(p));
}
// Hands follow the body while walking: carried items in front, otherwise at the sides
function bodyHands(dt) {
  if (!hands || !avatar) return;
  const swing = Math.sin(avatar.state.phase) * Math.min(1, avatar.state.speed / 120);
  for (const hand of [hands.right, hands.left]) {
    const s = hand.side === 'right' ? 1 : -1;
    const carrying = [...carried.values()].some((c) => c.hand === hand);
    if (carrying) {
      hand.setPose('grab', 'palm');
      hand.goal.copy(avatar.bodyPoint(s * 12, 104, -32));
      hand.yawGoal = avatar.state.heading; hand.pitchGoal = 0;
    } else {
      hand.setPose('relaxed', 'index');
      hand.goal.copy(avatar.bodyPoint(s * 23, 80, -3 + swing * 14 * s));
      hand.yawGoal = avatar.state.heading + s * 0.1; hand.pitchGoal = -1.35;
    }
  }
  void dt;
}
// ---- Safety gear ----
const gearOn = (g) => !!(avatar && avatar.gear[g]);
const allGear = () => state.mode === 'classic' || GEAR.every(gearOn);
function wearGear(g, on = true) {
  if (!avatar) return;
  avatar.setGear(g, on);
  ppe.items[g].visible = !on;
  if (g === 'gloves' && handsLoaded) handsLoaded.setGloves(on);
  const ov = $('gogglesOverlay');
  if (ov) ov.classList.toggle('on', state.mode === 'fp' && gearOn('goggles'));
  if (on) { sfx('ok'); toast(`${GEAR_NAMES[g][0].toUpperCase() + GEAR_NAMES[g].slice(1)} on.${allGear() ? ' All safety gear is on — you may start the experiment.' : ''}`, 'ok', 2600); }
}
function resetGear() { GEAR.forEach((g) => wearGear(g, false)); }
// Take an item from the PPE station and put it on
async function demoGear(g) {
  if (!avatar || !hands || gearOn(g)) { if (avatar) wearGear(g); return; }
  const R = hands.right;
  const grab = ppe.group.localToWorld(ppe.grab[g].clone());
  await approach(grab);
  await handTo(R, grab, { pose: 'grab', contact: 'palm', dur: 0.8, arc: 6, pitch: g === 'shoes' ? -1.2 : -0.2 });
  const itemObj = ppe.items[g];
  const startW = itemObj.getWorldPosition(new THREE.Vector3());
  // Carry the item to where it is worn
  const wornAt = { coat: avatar.bodyPoint(0, 140, -14), goggles: avatar.eyeWorld(), gloves: avatar.bodyPoint(0, 105, -30), shoes: avatar.bodyPoint(0, 8, -10) }[g];
  const parent = itemObj.parent;
  scene.attach(itemObj);
  await tween(0.9, (e) => {
    itemObj.position.lerpVectors(startW, wornAt, e);
    R.goal.lerpVectors(grab, wornAt, e);
    if (g === 'coat') itemObj.scale.setScalar(1 + e * 0.1);
  });
  if (g === 'gloves') {
    // pull each glove on: hands meet in front of the body
    await Promise.all([
      handTo(hands.left, avatar.bodyPoint(-6, 105, -32), { pose: 'flat', contact: 'palm', dur: 0.5, arc: 2, pitch: 0 }),
      handTo(R, avatar.bodyPoint(6, 108, -32), { pose: 'pinch', contact: 'pinch', dur: 0.5, arc: 2, pitch: 0 }),
    ]);
  }
  parent.attach(itemObj);
  itemObj.position.copy(itemObj.userData.home || itemObj.position);
  itemObj.scale.setScalar(1);
  wearGear(g);
  await wait(0.3);
}

const fp = { yaw: 0, pitch: -0.3 };
function driveStudent(dt) {
  if (state.mode !== 'fp' || !avatar) return;
  const a = avatar.state;
  let f = 0, st = 0, turn = 0;
  if (!autopilot && state.started) {
    if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
    if (keys.has('KeyD')) st += 1;
    if (keys.has('KeyA')) st -= 1;
    if (keys.has('KeyQ')) turn += 1;
    if (keys.has('KeyE')) turn -= 1;
  }
  fp.yaw += turn * dt * 1.8;
  walking.keys = !!(f || st);
  if (walking.keys) {
    const fw = V3(-Math.sin(fp.yaw), 0, -Math.cos(fp.yaw));
    const rt = V3(Math.cos(fp.yaw), 0, -Math.sin(fp.yaw));
    const move = fw.multiplyScalar(f).add(rt.multiplyScalar(st)).normalize();
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 230 : 130;
    a.pos.addScaledVector(move, speed * dt);
    collide(a.pos);
    walking.speed = speed;
  } else if (!walking.active) walking.speed = 0;
}
// Game-style hands: held in view in front of the camera when not working
function fpHands() {
  if (!hands || !avatar) return;
  const eye = avatar.eyeWorld();
  const y = fp.yaw;
  const fw = V3(-Math.sin(y), 0, -Math.cos(y)), rt = V3(Math.cos(y), 0, -Math.sin(y));
  const bob = Math.sin(avatar.state.phase * 2) * 1.4 * Math.min(1, avatar.state.speed / 120);
  for (const hand of [hands.right, hands.left]) {
    const sgn = hand.side === 'right' ? 1 : -1;
    hand.speed = 35; // held in view: follow the head closely so the hands never swim
    const carrying = [...carried.values()].some((c) => c.hand === hand);
    if (carrying) {
      hand.setPose('grab', 'palm');
      hand.goal.copy(eye).addScaledVector(fw, 42).addScaledVector(rt, 9 * sgn).add(V3(0, -24 + bob, 0));
      hand.yawGoal = y; hand.pitchGoal = 0;
    } else {
      hand.setPose('relaxed', 'index');
      hand.goal.copy(eye).addScaledVector(fw, 36).addScaledVector(rt, 16 * sgn).add(V3(0, -25 + bob, 0));
      hand.yawGoal = y + sgn * 0.3; hand.pitchGoal = -0.5;
    }
  }
}
function updateFPCamera() {
  if (state.mode !== 'fp' || !avatar) return;
  if (autopilot) fp.yaw = lerpAngle(fp.yaw, avatar.state.heading, 0.12); else avatar.state.heading = fp.yaw;
  const eye = avatar.eyeWorld();
  camera.position.copy(eye);
  const dir = V3(-Math.sin(fp.yaw) * Math.cos(fp.pitch), Math.sin(fp.pitch), -Math.cos(fp.yaw) * Math.cos(fp.pitch));
  camera.lookAt(eye.add(dir));
}
let followPrev = null;
// Watch mode: the camera chases the student; dragging still orbits around them
function followCamera(dt = 0.016) {
  if (state.mode !== 'auto' || !avatar || fly || state.holdCamera) return;
  const chest = avatar.bodyPoint(0, 118, -10);
  const d = chest.sub(controls.target).multiplyScalar(Math.min(1, dt * 3));
  controls.target.add(d);
  camera.position.add(d);
}

// ---------------------------------------------------------------------------
// Tweens and autopilot (demonstrations)
// ---------------------------------------------------------------------------

// Demonstrations run on a clock that can be paused and sped up (watch mode)
const vclock = { now: 0, scale: 1, paused: false };
const tweens = new Set();
function tween(dur, fn) {
  return new Promise((resolve) => { tweens.add({ t0: vclock.now, dur: Math.max(1, dur * 1000), fn, resolve }); });
}
function runTweens(dt = 0) {
  if (!vclock.paused) vclock.now += dt * 1000 * vclock.scale;
  const now = vclock.now;
  for (const tw of [...tweens]) {
    const k = Math.min(1, (now - tw.t0) / tw.dur);
    tw.fn(k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, k);
    if (k >= 1) { tweens.delete(tw); tw.resolve(); }
  }
}
const wait = (s) => tween(s, () => {});

let autopilot = 0; // >0 while a demonstration drives the hands
let demoAbort = false;
async function withAutopilot(fn) {
  if (autopilot) return;
  autopilot++;
  demoAbort = false;
  document.body.classList.add('demo');
  setDemoButtons(true);
  try { await fn(); } catch (e) { if (e !== 'abort') console.error(e); } finally {
    autopilot--;
    document.body.classList.remove('demo');
    setDemoButtons(false);
    state.holdSources.delete('auto');
    for (const [key, c] of [...carried]) { carried.delete(key); if (!ITEMS[key].placed) dropCarried(key); void c; }
    if (hands) {
      hands.right.setPose('relaxed', 'index');
      hands.left.setPose('flat', 'palm');
      if (!bodyMode()) hands.right.goal.set(72, S.TABLE_Y + 6, 42); // rest at the front-right of the bench
      hover = null;
    }
  }
}
function checkAbort() { if (demoAbort) throw 'abort'; }

// Move a hand along an arc to `to` in `dur` seconds.
async function handTo(hand, to, { pose, contact: contactPt = 'index', dur = 0.7, arc = 8, pitch } = {}) {
  checkAbort();
  if (!hands) return;
  const from = hand.goal.clone();
  if (pose) hand.setPose(pose, contactPt);
  hand.speed = 40;
  aimHand(hand, to, pitch ?? (pose === 'grab' ? 0 : pose === 'press' ? -0.55 : -0.3));
  await tween(dur, (e) => {
    hand.goal.lerpVectors(from, to, e);
    hand.goal.y += Math.sin(Math.PI * e) * arc;
  });
  hand.speed = 14;
}

// Carry an item with a hand: the item follows the palm until released.
const carried = new Map(); // item key → { hand, offset }
function attach(key, hand) {
  const it = ITEMS[key];
  const gw = it.group.localToWorld(it.app.grip.clone());
  if (hand.pos) hand.pos.copy(gw);
  carried.set(key, { hand, offset: it.group.position.clone().sub(gw) });
  it.placed = false;
  if (key === 'jockey') it.onBoard = false;
  sfx('click');
}
function updateCarried() {
  for (const [key, c] of carried) ITEMS[key].group.position.copy(c.hand.pos || c.hand.goal).add(c.offset);
}
async function demoPlace(key) {
  const it = ITEMS[key];
  if (!hands) { placeAtSlot(key); return; }
  const R = hands.right;
  await approach(it.group.localToWorld(it.app.grip.clone()));
  if (key === 'jockey') { it.group.rotation.set(0, 0, 0); it.group.position.y = S.TABLE_Y; }
  const grip = () => it.group.localToWorld(it.app.grip.clone());
  await handTo(R, grip(), { pose: 'point', contact: 'palm', dur: 0.8, arc: 10 });
  R.setPose('grab', 'palm');
  await wait(0.25);
  attach(key, R);
  let dest;
  if (key === 'jockey') dest = V3(S.lToX(state.l), S.WIRE_Y + 1.2 + it.app.grip.y, S.WIRE_Z);
  else dest = V3(it.slot[0], S.TABLE_Y, it.slot[1]).add(it.app.grip.clone().applyAxisAngle(V3(0, 1, 0), it.slot[2] || 0));
  await approach(dest);
  if (key !== 'jockey') {
    const r0 = it.group.rotation.y;
    tween(1.1, (e) => { it.group.rotation.y = THREE.MathUtils.lerp(r0, it.slot[2] || 0, e); });
  }
  await handTo(R, dest.clone().add(V3(0, 3, 0)), { pose: 'grab', contact: 'palm', dur: 1.1, arc: 18, pitch: 0 });
  await handTo(R, dest, { pose: 'grab', contact: 'palm', dur: 0.3, arc: 0, pitch: 0 });
  carried.delete(key);
  placeAtSlot(key);
  sfx('thud');
  R.setPose('relaxed', 'index');
  await handTo(R, dest.clone().add(V3(0, 12, 12)), { dur: 0.4, arc: 0 });
}
async function demoConnect(a, b) {
  if (!hands) { connect(a, b); return; }
  const R = hands.right;
  await approach(termWorld(a));
  await handTo(R, termWorld(a).add(V3(0, 0.6, 0)), { pose: 'pinch', contact: 'pinch', dur: 0.8, arc: 10, pitch: -0.4 });
  startLead(a);
  await wait(0.2);
  await approach(termWorld(b));
  await handTo(R, termWorld(b).add(V3(0, 0.6, 0)), { pose: 'pinch', contact: 'pinch', dur: 1.0, arc: 12, pitch: -0.4 });
  finishLead(b);
  await wait(0.15);
}
async function demoTouch(obj, fn, pose = 'pinch') {
  if (!hands) { fn(); await wait(0.15); return; }
  const R = hands.right;
  const p = obj.getWorldPosition(new THREE.Vector3()).add(V3(0, 2.2, 0));
  await approach(p);
  await handTo(R, p, { pose, contact: pose === 'pinch' ? 'pinch' : 'index', dur: 0.7, arc: 8, pitch: -0.4 });
  fn();
  await wait(0.35);
}
async function demoSlide(l) {
  const j = ITEMS.jockey;
  if (!hands) {
    const l0 = state.l;
    await tween(Math.min(0.8, 0.2 + Math.abs(l - l0) / 80), (e) => { setL(l0 + (l - l0) * e, true); });
    return;
  }
  const R = hands.right;
  const grip = () => j.group.localToWorld(j.app.grip.clone());
  await approach(grip());
  await handTo(R, grip(), { pose: 'pinch', contact: 'pinch', dur: 0.6, arc: 6, pitch: -0.25 });
  const l0 = state.l;
  R.speed = 40;
  await tween(Math.min(1.2, 0.25 + Math.abs(l - l0) / 60), (e) => { setL(l0 + (l - l0) * e, true); placeJockey(); R.goal.copy(grip()); });
  R.speed = 14;
}
async function demoPress(seconds = 1.0) {
  const R = hands ? hands.right : { goal: V3(0, 0, 0) };
  const j = ITEMS.jockey;
  const cap = () => j.group.localToWorld(V3(0, 9.75, 0));
  await handTo(R, cap(), { pose: 'press', contact: 'index', dur: 0.35, arc: 2, pitch: -0.32 });
  state.holdSources.add('auto');
  const seq0 = state.probe?.seq || 0;
  const t0 = performance.now();
  // Hold until the galvanometer has settled (in simulation time), however slow the frame rate
  while (performance.now() - t0 < 6000 || vclock.paused) {
    await tween(0.15, () => { R.goal.copy(cap()); });
    checkAbort();
    if ((state.probe?.seq || 0) > seq0 + 1 && state.probe.l === state.l && performance.now() - t0 > (seconds * 800) / vclock.scale) break;
  }
  const d = state.probe && state.probe.l === state.l ? state.probe.div : state.needle.theta;
  state.holdSources.delete('auto');
  await tween(0.3, () => { R.goal.copy(cap()).add(V3(0, 1.5, 0)); });
  return d;
}
async function demoProbe(l) { await demoSlide(l); return demoPress(1.0); }

async function demoNull() {
  let lo = 8, hi = 92;
  const dlo = await demoProbe(lo);
  const dhi = await demoProbe(hi);
  if (Math.sign(dlo) === Math.sign(dhi)) { toast('Both ends deflect the same way — the circuit is not a proper bridge. Check the connections.', 'err'); return; }
  for (let i = 0; i < 10 && hi - lo > 0.15; i++) {
    const mid = Math.round(((lo + hi) / 2) * 10) / 10;
    const d = await demoProbe(mid);
    if (Math.abs(d) < 0.2) { lo = hi = mid; break; }
    if (Math.sign(d) === Math.sign(dlo)) lo = mid; else hi = mid;
  }
  let l = Math.round(((lo + hi) / 2) * 10) / 10;
  // Near the null: take the high resistance out for full sensitivity, then refine
  if (state.protect) await demoTouch(ITEMS.galv.app.knob, toggleHR);
  let d = await demoProbe(l);
  for (let i = 0; i < 6 && Math.abs(d) > 0.45; i++) {
    const step = -Math.sign(d) * Math.sign(dhi - dlo) * 0.1;
    l = Math.round((l + step) * 10) / 10;
    d = await demoProbe(l);
  }
}

const GAP_SWAP = { 'board.g1a': 'board.g2a', 'board.g2a': 'board.g1a', 'board.g1b': 'board.g2b', 'board.g2b': 'board.g1b' };
async function demoInterchange() {
  const box = ITEMS.box, coil = ITEMS.coil;
  const bSlot = box.slot, cSlot = coil.slot;
  if (!hands) {
    // No-human mode: swap the two pieces and move their leads straight away
    box.slot = [cSlot[0], bSlot[1], 0]; coil.slot = [bSlot[0], cSlot[1], 0];
    placeAtSlot('box'); placeAtSlot('coil');
    for (const L of leads) { if (GAP_SWAP[L.a]) L.a = GAP_SWAP[L.a]; else if (GAP_SWAP[L.b]) L.b = GAP_SWAP[L.b]; rebuildLeadMesh(L); }
    leadsVersion++; state.probe = null; sfx('thud');
    toast('R and X interchanged: the resistance box is now in gap 2 and the test wire in gap 1. Now X = R·l / (100 − l).', 'info', 6000);
    return;
  }
  const R = hands.right, Lh = hands.left;
  await approach(V3(0, S.TABLE_Y, -20));
  const bGrip = () => box.group.localToWorld(box.app.grip.clone());
  const cGrip = () => coil.group.localToWorld(coil.app.grip.clone());
  await Promise.all([
    handTo(R, bGrip(), { pose: 'point', contact: 'palm', dur: 0.8 }),
    handTo(Lh, cGrip(), { pose: 'point', contact: 'palm', dur: 0.8 }),
  ]);
  R.setPose('grab', 'palm'); Lh.setPose('grab', 'palm');
  await wait(0.25);
  attach('box', R); attach('coil', Lh);
  const bx = box.group.position.x, cx = coil.group.position.x;
  const bDest = bGrip().setX(cx - (box.group.position.x - bGrip().x)), cDest = cGrip().setX(bx);
  bDest.x = cSlot[0]; cDest.x = bSlot[0];
  await Promise.all([
    handTo(R, bDest.clone().setZ(bDest.z + 10), { pose: 'grab', contact: 'palm', dur: 0.7, arc: 14, pitch: 0 }),
    handTo(Lh, cDest.clone().setZ(cDest.z - 4), { pose: 'grab', contact: 'palm', dur: 0.7, arc: 22, pitch: 0 }),
  ]);
  await Promise.all([
    handTo(R, bDest, { pose: 'grab', contact: 'palm', dur: 0.5, arc: 4, pitch: 0 }),
    handTo(Lh, cDest, { pose: 'grab', contact: 'palm', dur: 0.5, arc: 4, pitch: 0 }),
  ]);
  carried.delete('box'); carried.delete('coil');
  box.slot = [cSlot[0], bSlot[1], 0]; coil.slot = [bSlot[0], cSlot[1], 0];
  placeAtSlot('box'); placeAtSlot('coil');
  void cx;
  sfx('thud');
  Lh.setPose('flat', 'palm');
  handTo(Lh, LEFT_REST, { pose: 'flat', contact: 'palm', dur: 0.8, pitch: 0 });
  // Re-plug the four gap leads into the other gap
  const map = { 'board.g1a': 'board.g2a', 'board.g2a': 'board.g1a', 'board.g1b': 'board.g2b', 'board.g2b': 'board.g1b' };
  const gapLeads = leads.filter((L) => map[L.a] || map[L.b]);
  for (const L of gapLeads) {
    const end = map[L.a] ? 'a' : 'b';
    const fromT = L[end], toT = map[fromT];
    await handTo(R, termWorld(fromT).add(V3(0, 0.6, 0)), { pose: 'pinch', contact: 'pinch', dur: 0.6, arc: 6, pitch: -0.4 });
    spinScrew(fromT); sfx('tick');
    const start = termWorld(fromT), dest = termWorld(toT);
    await tween(0.8, (e) => {
      const p = start.clone().lerp(dest, e); p.y += Math.sin(Math.PI * e) * 6;
      R.goal.copy(p.clone().add(V3(0, 0.6, 0)));
    });
    L[end] = toT;
    rebuildLeadMesh(L);
    leadsVersion++;
    spinScrew(toT); sfx('tick');
  }
  state.probe = null;
  toast('R and X interchanged: the resistance box is now in gap 2 and the test wire in gap 1. Now X = R·l / (100 − l).', 'info', 6000);
}

// ---------------------------------------------------------------------------
// Pointer interaction (the student's own hand)
// ---------------------------------------------------------------------------

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tablePlane = new THREE.Plane(V3(0, 1, 0), -S.TABLE_Y);
const wirePlane = new THREE.Plane(V3(0, 1, 0), -(S.WIRE_Y + 1));
let pointer = null;
let hover = null;
let pointerNdcValid = false;

function setNdc(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  pointerNdcValid = true;
}

const pickRoots = () => [board.group, gauge.group, ppe.group, ...Object.values(ITEMS).map((it) => it.group), ...leads.map((L) => L.mesh)];
function classify(o) {
  for (let x = o; x; x = x.parent) {
    if (x.userData.term) return { kind: 'term', id: x.userData.term };
    if (x.userData.lead) return { kind: 'lead', lead: x.userData.lead };
    if (x.userData.pick) {
      const p = x.userData.pick;
      return { kind: p.userData.kind, obj: p };
    }
    if (x.userData.item) return { kind: x.userData.item === 'jockey' && ITEMS.jockey.onBoard ? 'jockey' : 'item', key: x.userData.item };
  }
  return null;
}
function pick(e) {
  setNdc(e);
  const hits = raycaster.intersectObjects(pickRoots(), true);
  for (const h of hits) {
    if (h.object === flowMesh || h.object.material === M.glass || h.object.material === M.cursor) continue;
    if (carried.size && h.object.userData.item && carried.has(h.object.userData.item)) continue;
    const c = classify(h.object);
    if (c) return { ...c, point: h.point };
    return { kind: 'surface', point: h.point };
  }
  const p = V3(0, 0, 0);
  if (raycaster.ray.intersectPlane(tablePlane, p)) return { kind: 'surface', point: p };
  return null;
}
function onSurface(p) {
  const inBench = Math.abs(p.x) < 118 && Math.abs(p.z) < 43;
  const inTrolley = Math.abs(p.x - TROLLEY.x) < TROLLEY.w / 2 - 2 && Math.abs(p.z - TROLLEY.z) < TROLLEY.d / 2 - 2;
  return inBench || inTrolley;
}

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  if (!state.started || autopilot) return;
  const h = pick(e);
  if (e.button === 2) {
    if (h && h.kind === 'lead') { disconnect(h.lead); toast('Lead removed.', 'info', 1500); return; }
    if (pending) cancelLead();
    return;
  }
  if (state.mode === 'fp' && e.button === 0 && (!h || h.kind === 'surface' || h.kind === 'lead')) {
    // drag to look around
    canvas.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, look: true, hit: { kind: 'look' } };
    return;
  }
  if (e.button !== 0 || !h) { if (pending && e.button === 0) cancelLead(); return; }
  if (h.kind === 'surface' || h.kind === 'lead') { if (pending) cancelLead(); return; }
  if (state.mode === 'fp' && h.kind === 'ppe') {
    e.preventDefault();
    if (gearOn(h.obj.userData.gear)) return;
    const g = h.obj.userData.gear;
    withAutopilot(() => demoGear(g));
    return;
  }
  if (state.mode === 'fp' && !allGear()) {
    toast('Safety first: put on your lab coat, goggles, gloves and safety shoes at the PPE station by the door.', 'warn', 4000);
    return;
  }
  if (bodyMode() && !reachable(h.point)) {
    e.preventDefault();
    toast('Too far to reach — walking over…', 'info', 1500);
    withAutopilot(() => walkTo(standSpot(h.point)));
    return;
  }
  e.preventDefault();
  controls.enabled = false;
  canvas.setPointerCapture(e.pointerId);
  pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, t0: performance.now(), hit: h };
  // Keep the hand on what was clicked for a moment, so the action is seen being done
  state.actionHold = { point: h.point.clone(), until: performance.now() + 900, pose: h.kind === 'term' ? 'pinch' : 'press' };
  if (h.kind === 'term') {
    if (pending) { if (pending.from === h.id) cancelLead(); else finishLead(h.id); }
    else startLead(h.id);
  } else if (h.kind === 'plug') togglePlug(h.obj.userData.index);
  else if (h.kind === 'key') toggleKey();
  else if (h.kind === 'hr') toggleHR();
  else if (h.kind === 'jockey') {
    const p = V3(0, 0, 0);
    raycaster.ray.intersectPlane(wirePlane, p);
    pointer.grabL = state.l; pointer.grabX = p.x;
  } else if (h.kind === 'item') {
    const it = ITEMS[h.key];
    if (h.key === 'jockey') { it.group.rotation.set(0, 0, 0); it.group.position.y = S.TABLE_Y; }
    const gw = it.group.localToWorld(it.app.grip.clone());
    pointer.carry = h.key;
    const carrier = hands ? hands.right : { goal: gw.clone(), side: 'right' };
    if (!hands) pointer.proxy = carrier;
    carrier.goal.copy(gw);
    if (hands) hands.right.setPose('grab', 'palm');
    attach(h.key, carrier);
  }
});

let lastMouse = null; // last cursor position over the canvas, re-picked every frame
canvas.addEventListener('pointerleave', () => { lastMouse = null; });
canvas.addEventListener('pointermove', (e) => {
  lastMouse = { clientX: e.clientX, clientY: e.clientY };
  if (!state.started) return;
  const h = pick(e);
  hover = h;
  updateTip(e, h);
  if (!pointer) {
    canvas.style.cursor = h && h.kind !== 'surface' ? (h.kind === 'jockey' || h.kind === 'item' ? 'grab' : 'pointer') : '';
    return;
  }
  if (e.pointerId !== pointer.id) return;
  if (pointer.look) {
    fp.yaw -= (e.clientX - pointer.x) * 0.0045;
    fp.pitch = THREE.MathUtils.clamp(fp.pitch - (e.clientY - pointer.y) * 0.0045, -1.35, 0.75);
    pointer.x = e.clientX; pointer.y = e.clientY;
    return;
  }
  if (!pointer.moved && Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 4) pointer.moved = true;
  if (pointer.hit.kind === 'jockey' && pointer.moved) {
    const p = V3(0, 0, 0);
    if (raycaster.ray.intersectPlane(wirePlane, p)) setL(pointer.grabL + (p.x - pointer.grabX));
    canvas.style.cursor = 'grabbing';
  }
  if (pointer.carry) {
    const p = V3(0, 0, 0);
    if (raycaster.ray.intersectPlane(tablePlane, p)) {
      const it = ITEMS[pointer.carry];
      const target = V3(p.x, S.TABLE_Y + it.app.grip.y + 5, p.z);
      (hands ? hands.right : pointer.proxy).goal.copy(target);
    }
    canvas.style.cursor = 'grabbing';
  }
});

function endPointer(e) {
  if (!pointer || e.pointerId !== pointer.id) return;
  if (pointer.hit.kind === 'jockey' && !pointer.moved && !state.holdSources.has('pointer')) tapPress();
  if (pointer.carry) dropCarried(pointer.carry);
  state.holdSources.delete('pointer');
  pointer = null;
  controls.enabled = state.mode !== 'fp';
  canvas.style.cursor = '';
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
setInterval(() => {
  if (pointer && pointer.hit.kind === 'jockey' && !pointer.moved && performance.now() - pointer.t0 > 180) state.holdSources.add('pointer');
}, 50);

function dropCarried(key) {
  const it = ITEMS[key];
  carried.delete(key);
  const pos = it.group.position;
  if (key === 'jockey') {
    const near = Math.abs(pos.z - S.WIRE_Z) < 9 && Math.abs(pos.x) < 52;
    if (near) { state.l = THREE.MathUtils.clamp(Math.round(S.xToL(pos.x) * 10) / 10, 0, 100); placeAtSlot('jockey'); toast('Jockey placed on the bridge wire.', 'ok', 2000); }
    else if (onSurface(pos)) { it.group.position.y = S.TABLE_Y + 0.6; it.group.rotation.set(0, 0.3, Math.PI / 2); }
    else sendHome(key);
    sfx('thud');
    return;
  }
  const slot = it.slot;
  const d = Math.hypot(pos.x - slot[0], pos.z - slot[1]);
  if (d < 16) { placeAtSlot(key); toast(`${it.name} placed.`, 'ok', 1800); }
  else if (onSurface(pos)) { pos.y = S.TABLE_Y; it.placed = false; }
  else sendHome(key);
  sfx('thud');
}

function tapPress() {
  state.holdSources.add('tap');
  setTimeout(() => state.holdSources.delete('tap'), 650);
}

const tipEl = $('tip');
function updateTip(e, h) {
  let text = '';
  if (h) {
    if (h.kind === 'term') text = terminals[h.id]?.label || h.id;
    else if (h.kind === 'item') text = ITEMS[h.key].placed || ITEMS[h.key].onBoard ? `${ITEMS[h.key].name} — drag to move` : `${ITEMS[h.key].name} — drag onto the bench`;
    else if (h.kind === 'lead') text = 'Lead — right-click to remove';
    else if (h.kind === 'plug') text = `${h.obj.userData.value} Ω plug — click to ${h.obj.userData.inserted ? 'take out' : 'put back'}`;
    else if (h.kind === 'key') text = `Key K — click to ${state.keyIn ? 'remove' : 'insert'}`;
    else if (h.kind === 'hr') text = `High resistance — click to ${state.protect ? 'remove' : 'put in'}`;
    else if (h.kind === 'jockey') text = 'Jockey — drag to slide, hold to press';
    else if (h.kind === 'ppe') text = gearOn(h.obj.userData.gear) ? `${GEAR_NAMES[h.obj.userData.gear]} — already wearing` : `${GEAR_NAMES[h.obj.userData.gear]} — click to put on`;
  }
  if (text && h && h.kind !== 'surface' && bodyMode() && !reachable(h.point)) text = `${text.split(' — ')[0]} — too far: walk closer (W A S D) or click to walk there`;
  if (pending && h && h.kind === 'term') text = `Connect lead to ${text}`;
  else if (pending) text = 'Click a terminal to finish the lead (Esc cancels)';
  tipEl.classList.toggle('hidden', !text);
  if (text) {
    const r = stage.getBoundingClientRect();
    tipEl.textContent = text;
    tipEl.style.left = `${e.clientX - r.left}px`;
    tipEl.style.top = `${e.clientY - r.top}px`;
  }
}

const WALK_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ShiftLeft', 'ShiftRight'];
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT' || (e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox')) return;
  if (WALK_KEYS.includes(e.code)) { keys.add(e.code); if (state.mode === 'fp' && e.code.startsWith('Arrow')) e.preventDefault(); }
  if (e.code === 'Escape') { if (autopilot) demoAbort = true; cancelLead(); }
  if (autopilot || !state.started) return;
  if (e.code === 'Space') { state.holdSources.add('space'); e.preventDefault(); }
  else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    if (e.target.type === 'range') return;
    setL(state.l + (e.code === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 0.1));
    e.preventDefault();
  } else if (e.code === 'KeyK') toggleKey();
  else if (e.code === 'KeyH') toggleHR();
  else if (e.code === 'KeyR') recordReading();
});
window.addEventListener('keyup', (e) => { keys.delete(e.code); if (e.code === 'Space') state.holdSources.delete('space'); });
window.addEventListener('blur', () => { state.holdSources.clear(); keys.clear(); });

function setL(l, quiet = false) {
  const nl = Math.round(THREE.MathUtils.clamp(l, 0, 100) * 100) / 100;
  if (!quiet && contact() && Math.abs(nl - state.l) > 0.3 && performance.now() - state.scratchWarned > 4000) {
    toast('Lift the jockey before sliding it — dragging it while pressed scrapes the wire.', 'warn');
    state.scratchWarned = performance.now();
  }
  state.l = nl;
  $('lSlider').value = nl;
}

function togglePlug(i) {
  if (state.plugsOut.has(i)) state.plugsOut.delete(i); else state.plugsOut.add(i);
  syncPlugs();
  sfx('click');
}
function setR(target) {
  state.plugsOut.clear();
  let rem = target;
  const order = P.BOX_PLUGS.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  for (const [v, i] of order) if (v <= rem + 1e-9) { state.plugsOut.add(i); rem -= v; }
  syncPlugs();
}
function syncPlugs() {
  ITEMS.box.app.plugs.forEach((p, i) => { p.userData.inserted = !state.plugsOut.has(i); });
  document.querySelectorAll('.plug').forEach((el) => el.classList.toggle('out', state.plugsOut.has(+el.dataset.i)));
  $('Rval').textContent = `${fmt(currentR(), 1)} Ω`;
  state.probe = null;
}
function toggleKey() {
  state.keyIn = !state.keyIn;
  ITEMS.key.app.plug.userData.inserted = state.keyIn;
  if (!state.keyIn) state.keyOnFor = 0;
  sfx('click');
}
function toggleHR() {
  state.protect = !state.protect;
  state.probe = null;
  sfx('click');
}

// ---------------------------------------------------------------------------
// Panel wiring
// ---------------------------------------------------------------------------

const plugWrap = $('plugChips');
P.BOX_PLUGS.forEach((v, i) => {
  const b = document.createElement('button');
  b.className = 'plug'; b.dataset.i = i; b.textContent = v; b.title = `${v} Ω plug`;
  b.onclick = () => togglePlug(i);
  plugWrap.appendChild(b);
});
const sw = $('leadColors');
['auto', ...COLORS].forEach((c) => {
  const b = document.createElement('button');
  if (c === 'auto') { b.className = 'auto sel'; b.textContent = 'auto'; }
  else b.style.background = `#${S.LEAD_COLORS[c].toString(16).padStart(6, '0')}`;
  b.title = c;
  b.onclick = () => { state.leadColor = c; sw.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === b)); };
  sw.appendChild(b);
});
document.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { setR(+b.dataset.r); sfx('click'); }));
$('btnKey').onclick = () => { if (!autopilot) (hands ? withAutopilot(() => demoTouch(ITEMS.key.app.plug, toggleKey)) : toggleKey()); };
$('btnHR').onclick = () => { if (!autopilot) (hands ? withAutopilot(() => demoTouch(ITEMS.galv.app.knob, toggleHR)) : toggleHR()); };
$('btnSwap').onclick = () => {
  const w = wiringChecks();
  if (!w.box || !w.coil) return toast('Connect the resistance box and the test wire across the two gaps first.', 'err');
  withAutopilot(demoInterchange);
};
$('lSlider').addEventListener('input', (e) => setL(+e.target.value));
const pressBtn = $('btnPress');
pressBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); state.holdSources.add('button'); });
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => pressBtn.addEventListener(ev, () => state.holdSources.delete('button')));
$('btnAuto').onclick = () => {
  if (!wiringChecks().complete) return toast('Finish wiring the circuit first.', 'err');
  if (!state.keyIn) toggleKey();
  if (currentR() === 0) setR(2);
  withAutopilot(demoNull);
};
$('btnRecord').onclick = recordReading;
$('btnZero').onclick = () => withAutopilot(checkZero);
$('btnGauge').onclick = () => withAutopilot(gaugeReading);
$('btnLength').onclick = () => withAutopilot(measureLength);
$('btnSend').onclick = sendToObservation;
$('btnCsv').onclick = exportCsv;
$('btnNew').onclick = () => { newSpecimen(); toast('A fresh specimen has been fitted. Previous readings were cleared.', 'info'); };
$('material').onchange = (e) => { state.materialChoice = e.target.value; newSpecimen(); };
$('optFlow').onchange = (e) => (state.flow = e.target.checked);
$('optLabels').onchange = (e) => { state.labels = e.target.checked; labelsEl.classList.toggle('hidden', !state.labels); };
$('optPip').onchange = (e) => { state.pip = e.target.checked; };
$('optSound').onchange = (e) => (state.sound = e.target.checked);
$('optQuality').onchange = (e) => applyQuality(!e.target.checked);
$('optHands').onchange = (e) => { if (handsLoaded) { handsLoaded.right.root.visible = handsLoaded.left.root.visible = e.target.checked && state.mode !== 'classic'; } if (avatar) avatar.setVisible(e.target.checked && bodyMode()); };
$('btnUndoLead').onclick = () => { if (leads.length) disconnect(leads[leads.length - 1]); };
$('btnClearLeads').onclick = () => { [...leads].forEach(disconnect); };
$('btnDemo').onclick = () => { const s = currentStep(); if (s && s.demo) withAutopilot(s.demo); };
$('btnDoPhase').onclick = () => withAutopilot(async () => {
  const ph = currentPhase();
  for (let guard = 0; guard < 40; guard++) {
    const s = currentStep();
    if (!s || s.phase !== ph || !s.demo) break;
    await s.demo();
    await wait(0.2);
    if (!isDone(s)) break;
  }
});
document.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) b.blur(); });
document.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => flyTo(b.dataset.view)));
function setDemoButtons(busy) {
  ['btnDemo', 'btnDoPhase', 'btnAuto', 'btnSwap', 'btnZero', 'btnGauge', 'btnLength', 'btnKey', 'btnHR'].forEach((id) => { $(id).disabled = busy; });
  $('btnDemo').textContent = busy ? 'Working… (Esc stops)' : state.mode === 'classic' ? '▶ Do this step' : '▶ Show me';
}

function toast(msg, kind = 'info', ms = 4200) {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  const box = $('toasts');
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), ms);
}
const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');

// ---------------------------------------------------------------------------
// Observations, screw gauge, result
// ---------------------------------------------------------------------------

function recordReading() {
  const R = currentR();
  const w = wiringChecks();
  if (!w.complete) return toast('The circuit is not wired as in the diagram yet — finish the connections first.', 'err');
  if (!state.keyIn) return toast('Insert the key K first — no current flows in the bridge.', 'err');
  if (R === 0) return toast('Take out at least one plug from the resistance box to introduce a known R.', 'err');
  const pr = state.probe;
  if (!pr || Math.abs(pr.l - state.l) > 0.05) return toast('Press the jockey at this position and watch the galvanometer before recording.', 'err');
  if (pr.protect) return toast('The high resistance is still in series with the galvanometer. Remove HR to locate the null point precisely.', 'warn');
  if (Math.abs(pr.div) > 0.5) return toast(`The galvanometer still deflects ${fmt(pr.div, 1)} div. Move the jockey toward the null point.`, 'err');
  if (state.l < 20 || state.l > 80) toast('Balance point is far from the middle of the wire; end errors will be large. Choose R so that l lies between 30 and 70 cm.', 'warn', 6000);
  const l = Math.round(state.l * 10) / 10;
  const X = w.swapped ? (R * l) / (100 - l) : (R * (100 - l)) / l;
  state.readings.push({ gap: w.swapped ? 1 : 2, R, l, X, T: state.T });
  renderTables();
  updateResult();
  sfx('ok');
  toast(`Recorded: R = ${R} Ω, l = ${l.toFixed(1)} cm → X = ${X.toFixed(3)} Ω`, 'ok');
  if (state.T > P.T_ROOM + 8) toast('The test wire has warmed up. Remove the key between readings to let it cool.', 'warn');
}

let gaugeNow = 3;
async function turnGaugeTo(mm, sampleMm, dur = 1.4) {
  const start = gaugeNow;
  const ratchetAt = (r) => gauge.group.localToWorld(V3(gauge.zeroX + 10 + r * 0.3, gauge.axisY + 1.2, 0.8));
  if (hands) await approach(ratchetAt(start));
  if (hands) await handTo(hands.right, ratchetAt(start), { pose: 'pinch', contact: 'pinch', dur: 0.6, arc: 6, pitch: -0.15 });
  await tween(dur, (e) => {
    const r = start + (mm - start) * e;
    gauge.setReading(r, sampleMm);
    if (hands) { hands.right.goal.copy(ratchetAt(r)); hands.right.pitchGoal = -0.15 + Math.sin(e * 24) * 0.08; }
  });
  gaugeNow = mm;
  sfx('tick');
}

async function checkZero() {
  flyTo('gauge');
  const z = state.app.zeroErrorMm;
  await turnGaugeTo(1.2, null, 0.6);
  await turnGaugeTo(z, null, 1.2);
  state.gauge.zero = z;
  const csd = Math.round(Math.abs(z) / 0.01);
  toast(z === 0 ? 'Jaws closed: the zero of the circular scale coincides with the reference line. No zero error.' :
    z > 0 ? `Jaws closed: zero of circular scale is ${csd} div below the reference line → positive zero error +${z.toFixed(2)} mm.` :
      `Jaws closed: zero of circular scale is ${csd} div above the reference line → negative zero error ${z.toFixed(2)} mm.`, 'info', 6500);
  renderTables();
  updateResult();
}

async function gaugeReading() {
  if (state.gauge.zero == null) return toast('Check the zero error of the screw gauge first.', 'warn');
  if (state.gauge.rows.length >= 6) return toast('Six readings (three places, two perpendicular directions) are enough.', 'info');
  flyTo('gauge');
  const i = state.gauge.rows.length;
  const r = P.screwGaugeReading(state.app, Math.floor(i / 2) + (i % 2) * 0.5);
  await turnGaugeTo(1.6, null, 0.5);
  await turnGaugeTo(r.raw, state.app.diameterMm, 1.2);
  state.gauge.rows.push(r);
  renderTables();
  updateResult();
  toast(`Screw gauge: MSR ${r.msr.toFixed(1)} mm + ${r.csd} div × 0.01 mm = ${r.raw.toFixed(2)} mm`, 'info');
}

async function measureLength() {
  flyTo('coil');
  if (hands) {
    const c = ITEMS.coil.group;
    await approach(c.position);
    await handTo(hands.right, c.localToWorld(V3(8.8, 3, 3.3)), { pose: 'point', dur: 0.8 });
    await handTo(hands.right, c.localToWorld(V3(-8.8, 3, 3.3)), { pose: 'point', dur: 1.0, arc: 2 });
  }
  const L = Math.round((state.app.lengthCm + (Math.random() - 0.5) * 0.16) * 10) / 10;
  state.length = L;
  toast(`Length of test wire between its terminals, measured with the metre rule: ${L.toFixed(1)} cm`, 'info');
  renderTables();
  updateResult();
}

function renderTables() {
  const tb = $('obsTable').querySelector('tbody');
  tb.innerHTML = '';
  state.readings.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>gap ${r.gap}</td><td>${fmt(r.R, 1)}</td><td>${fmt(r.l, 1)}</td><td>${fmt(100 - r.l, 1)}</td><td>${fmt(r.X, 3)}</td><td><button title="Delete">✕</button></td>`;
    tr.querySelector('button').onclick = () => { state.readings.splice(i, 1); renderTables(); updateResult(); };
    tb.appendChild(tr);
  });
  const gb = $('gaugeTable').querySelector('tbody');
  gb.innerHTML = '';
  const z = state.gauge.zero ?? 0;
  state.gauge.rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${r.msr.toFixed(1)}</td><td>${r.csd}</td><td>${r.raw.toFixed(2)}</td><td>${(r.raw - z).toFixed(2)}</td>`;
    gb.appendChild(tr);
  });
  $('mZero').textContent = state.gauge.zero == null ? '—' : `${state.gauge.zero >= 0 ? '+' : ''}${state.gauge.zero.toFixed(2)} mm`;
  const d = meanD();
  $('mD').textContent = d ? `${d.toFixed(3)} mm` : '—';
  $('mL').textContent = state.length ? `${state.length.toFixed(1)} cm` : '—';
  $('mA').textContent = d ? `${(Math.PI * (d / 2000) ** 2).toExponential(3)} m²` : '—';
}
function meanD() {
  if (!state.gauge.rows.length || state.gauge.zero == null) return null;
  return state.gauge.rows.reduce((s, r) => s + r.raw - state.gauge.zero, 0) / state.gauge.rows.length;
}
function meanX() {
  if (!state.readings.length) return null;
  return state.readings.reduce((s, r) => s + r.X, 0) / state.readings.length;
}
function updateResult() {
  const X = meanX(), d = meanD(), L = state.length;
  $('rX').textContent = X ? `${X.toFixed(3)} Ω` : '—';
  const note = [];
  if (X && d && L) {
    const rho = (X * Math.PI * (d / 2000) ** 2) / (L / 100);
    $('rRho').textContent = `${rho.toExponential(3)} Ω·m`;
    const mat = state.app.material;
    const reveal = state.materialChoice !== 'mystery' || state.readings.length >= 4;
    if (state.materialChoice === 'mystery') {
      const best = Object.values(P.MATERIALS).reduce((a, b) => (Math.abs(Math.log(b.rho / rho)) < Math.abs(Math.log(a.rho / rho)) ? b : a));
      note.push(`Closest handbook value: ${best.name} (${best.rho.toExponential(2)} Ω·m).`);
      note.push(reveal ? `Actual specimen: ${mat.name}.` : 'Record at least four readings to reveal the actual material.');
    }
    $('rStd').textContent = reveal ? `${mat.rho.toExponential(2)} Ω·m` : 'hidden';
    $('rErr').textContent = reveal ? `${(((rho - mat.rho) / mat.rho) * 100).toFixed(2)} %` : '—';
    if (new Set(state.readings.map((r) => r.gap)).size < 2) note.push('Tip: interchange R and X and take readings in both positions to cancel end resistances.');
  } else {
    $('rRho').textContent = $('rStd').textContent = $('rErr').textContent = '—';
    if (!X) note.push('Record balance points to find X.');
    if (!d) note.push('Measure the diameter with the screw gauge.');
    if (!L) note.push('Measure the length of the wire.');
  }
  $('rNote').textContent = note.join(' ');
}

function sendToObservation() {
  if (!state.readings.length) return toast('Record some balance points first.', 'err');
  const rows = state.readings.slice(0, 3).map((r) => ({
    R: String(r.R),
    // The observation table uses X = R(100 − l)/l, so express interchanged readings the same way.
    l: (r.gap === 2 ? r.l : 100 - r.l).toFixed(1),
    X: r.X.toFixed(3),
  }));
  while (rows.length < 3) rows.push({ R: '', l: '', X: '' });
  const d = meanD();
  const payload = { rows, metricInputs: { d: d ? d.toFixed(3) : '', L: state.length ? state.length.toFixed(1) : '' }, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem('experimentObservations:phy121', JSON.stringify(payload));
    state.sent = true;
    toast('Saved. Open the Observation tab to see your readings (the first three are used).', 'ok');
  } catch (e) {
    toast('Could not save to this browser (storage is blocked). Use Export CSV instead.', 'err');
  }
}
function exportCsv() {
  const lines = [['#', 'X in gap', 'R (ohm)', 'l (cm)', '100-l (cm)', 'X (ohm)', 'wire temp (C)']];
  state.readings.forEach((r, i) => lines.push([i + 1, r.gap, r.R, r.l.toFixed(1), (100 - r.l).toFixed(1), r.X.toFixed(4), r.T.toFixed(1)]));
  lines.push([]);
  lines.push(['Screw gauge zero error (mm)', state.gauge.zero ?? '']);
  state.gauge.rows.forEach((r, i) => lines.push([`d reading ${i + 1} (mm)`, r.raw.toFixed(2)]));
  lines.push(['Mean corrected d (mm)', meanD()?.toFixed(3) ?? '']);
  lines.push(['Length L (cm)', state.length ?? '']);
  lines.push(['Mean X (ohm)', meanX()?.toFixed(4) ?? '']);
  const blob = new Blob([lines.map((l) => l.join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'meter-bridge-observations.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------------------------------------------------------------------------
// Guided procedure: phases, steps, highlights and demonstrations
// ---------------------------------------------------------------------------

const hl = { slots: [], terms: [], wire: false };
const W = () => wiringChecks();
const recordedNormal = () => state.readings.filter((r) => r.gap === 2).length;
const recordedSwapped = () => state.readings.filter((r) => r.gap === 1).length;

async function demoRecordSet(Rs) {
  for (const R of Rs) {
    if (!state.keyIn) await demoTouch(ITEMS.key.app.plug, toggleKey);
    if (currentR() !== R) {
      const target = new Set();
      let rem = R;
      P.BOX_PLUGS.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).forEach(([v, i]) => { if (v <= rem + 1e-9) { target.add(i); rem -= v; } });
      for (let i = 0; i < P.BOX_PLUGS.length; i++) {
        if (target.has(i) !== state.plugsOut.has(i)) await demoTouch(ITEMS.box.app.plugs[i], () => togglePlug(i));
      }
    }
    if (state.protect) await demoTouch(ITEMS.galv.app.knob, toggleHR);
    const nul = findNull();
    if (nul == null) { toast('No balance point exists with this wiring.', 'err'); return; }
    const guess = Math.round(nul * 10) / 10;
    await demoProbe(Math.round(guess));
    let d = await demoProbe(guess);
    if (Math.abs(d) > 0.45) {
      const alt = Math.round((guess + (Math.sign(d) === Math.sign(solveNow({ l: guess + 1, pressed: true, protect: false, keyIn: true }).Ig) ? -0.1 : 0.1)) * 10) / 10;
      d = await demoProbe(alt);
    }
    recordReading();
    await wait(0.3);
    await demoTouch(ITEMS.key.app.plug, toggleKey); // key out to let the wire cool
  }
}

const PHASES = ['Safety gear', 'Set up the apparatus', 'Make the connections', 'Check the circuit', 'Find balance points', 'Measure the wire', 'Result'];
const STEPS = [
  ...GEAR.map((g) => ({
    phase: 0,
    text: {
      coat: 'Go to the PPE station by the door and put on a lab coat.',
      goggles: 'Put on the safety goggles.',
      gloves: 'Put on nitrile gloves.',
      shoes: 'Change into safety shoes.',
    }[g],
    why: {
      coat: 'A buttoned lab coat protects your clothes and skin from spills and hot components.',
      goggles: 'Goggles protect your eyes from sparks, splashes and flying wire ends.',
      gloves: 'Gloves keep sweat and grease off the bridge wire and protect your hands.',
      shoes: 'Closed safety shoes protect your feet from dropped apparatus.',
    }[g],
    check: () => state.mode === 'classic' || gearOn(g),
    demo: () => demoGear(g),
  })),
  ...['box', 'galv', 'coil', 'cell', 'key'].map((k) => ({
    phase: 1,
    text: {
      box: 'Carry the resistance box from the trolley and place it behind gap 1.',
      galv: 'Place the galvanometer behind the centre terminal B.',
      coil: 'Place the test wire (on its former) behind gap 2.',
      cell: 'Place the accumulator at the front-left of the bench.',
      key: 'Place the plug key next to the accumulator.',
    }[k],
    why: k === 'box' ? 'Keep apparatus close to the terminals it connects to, so leads are short and do not cross.' : k === 'cell' ? 'In a real lab the cell is connected last, after all other connections are checked.' : '',
    check: () => ITEMS[k].placed,
    demo: () => demoPlace(k),
    slots: [k],
  })),
  { phase: 1, text: 'Stand the jockey on the bridge wire.', why: 'The jockey’s knife edge touches the wire only while it is pressed.', check: () => ITEMS.jockey.onBoard, demo: () => demoPlace('jockey'), wire: true },
  { phase: 2, text: 'Connect the accumulator (+) to one terminal of the plug key.', why: 'The key lets you switch the current off between readings.', check: () => W().cellKey, demo: () => demoConnect('cell.+', 'key.1'), terms: ['cell.+', 'key.1'] },
  { phase: 2, text: 'Connect the other key terminal to terminal A of the bridge.', check: () => W().keyStrip, demo: () => demoConnect('key.2', 'board.A'), terms: ['key.2', 'board.A'] },
  { phase: 2, text: 'Connect the accumulator (−) to terminal C of the bridge.', check: () => W().cellStrip, demo: () => demoConnect('cell.-', 'board.C'), terms: ['cell.-', 'board.C'] },
  { phase: 2, text: 'Connect the resistance box across gap 1 (between the A-strip and the centre strip).', why: 'The known resistance R forms one arm of the Wheatstone bridge.', check: () => W().box, demo: async () => { await demoConnect('box.1', 'board.g1a'); await demoConnect('box.2', 'board.g1b'); }, terms: ['box.1', 'board.g1a', 'box.2', 'board.g1b'] },
  { phase: 2, text: 'Connect the two ends of the test wire across gap 2.', why: 'The unknown resistance X forms the adjacent arm.', check: () => W().coil, demo: async () => { await demoConnect('coil.1', 'board.g2a'); await demoConnect('coil.2', 'board.g2b'); }, terms: ['coil.1', 'board.g2a', 'coil.2', 'board.g2b'] },
  { phase: 2, text: 'Connect one galvanometer terminal to the centre terminal B.', check: () => W().galvB, demo: () => demoConnect('galv.-', 'board.B'), terms: ['galv.-', 'board.B'] },
  { phase: 2, text: 'Connect the other galvanometer terminal to the jockey.', why: 'Galvanometer and jockey form the detector arm between B and the point D on the wire.', check: () => W().galvJ, demo: () => demoConnect('galv.+', 'jockey.T'), terms: ['galv.+', 'jockey.T'] },
  { phase: 3, text: 'Insert the plug in key K to switch the current on.', check: () => state.keyIn, demo: () => demoTouch(ITEMS.key.app.plug, toggleKey) },
  { phase: 3, text: 'Take a plug out of the resistance box to introduce a known R (e.g. 2 Ω).', check: () => currentR() > 0, demo: () => demoTouch(ITEMS.box.app.plugs[2], () => togglePlug(2)) },
  { phase: 3, text: 'With HR in, press the jockey near end A, then near end C. The deflections must be in opposite directions.', why: 'Opposite deflections at the two ends prove the circuit is correct and that a null point exists.', check: () => state.endsTapped.lo != null && state.endsTapped.hi != null && Math.sign(state.endsTapped.lo) !== Math.sign(state.endsTapped.hi), demo: async () => { if (!state.protect) await demoTouch(ITEMS.galv.app.knob, toggleHR); await demoProbe(5); await demoProbe(95); } },
  { phase: 4, text: 'Turn the HR knob to remove the high resistance, for full galvanometer sensitivity.', check: () => !state.protect, demo: () => demoTouch(ITEMS.galv.app.knob, toggleHR) },
  { phase: 4, text: 'Tap the jockey along the wire to find the point of zero deflection (null point).', why: 'Tap, don’t slide. Bracket the null from both sides and narrow down in 1 mm steps.', check: () => (state.probe && !state.probe.protect && Math.abs(state.probe.div) < 0.5) || state.readings.length > 0, demo: demoNull },
  { phase: 4, text: 'Record the balance length. Take readings for three different values of R, removing the key between readings.', check: () => recordedNormal() >= 3, demo: () => demoRecordSet([2, 3, 5].slice(recordedNormal())) },
  { phase: 4, text: 'Interchange the resistance box and the test wire (swap the gaps).', why: 'Interchanging cancels the end resistances of the bridge wire.', check: () => W().swapped, demo: demoInterchange },
  { phase: 4, text: 'Record three balance points in the interchanged position.', check: () => recordedSwapped() >= 3, demo: () => demoRecordSet([2, 3, 5].slice(recordedSwapped())) },
  { phase: 5, text: 'Close the screw gauge jaws and note its zero error.', check: () => state.gauge.zero != null, demo: checkZero },
  { phase: 5, text: 'Measure the wire diameter at three places, in two perpendicular directions.', check: () => state.gauge.rows.length >= 6, demo: async () => { while (state.gauge.rows.length < 6) await gaugeReading(); } },
  { phase: 5, text: 'Measure the length of the test wire with the metre rule.', check: () => state.length != null, demo: measureLength },
  { phase: 6, text: 'Compare your resistivity with the standard value, then send the readings to the Observation tab.', check: () => !!state.sent, demo: async () => sendToObservation() },
];
// Checks and balance-point steps stay ticked once achieved (the key is rightly
// taken out between readings); setup and wiring steps stay live, so a lead
// removed later is flagged again.
STEPS.forEach((s, i) => { s.i = i; s.sticky = s.phase >= 3; });
function isDone(s) {
  if (s.latched) return true;
  const ok = !!s.check();
  if (ok && s.sticky && state.started) s.latched = true;
  return ok;
}
function currentStep() { return STEPS.find((s) => !isDone(s)); }
function currentPhase() { const s = currentStep(); return s ? s.phase : PHASES.length; }

let stepsBuilt = false;
let lastStepIndex = -1;
function updateGuide() {
  const ol = $('steps');
  if (!stepsBuilt) {
    let ph = -1;
    STEPS.forEach((s) => {
      if (s.phase !== ph) { ph = s.phase; const h = document.createElement('li'); h.className = 'ph'; h.textContent = `${ph + 1} · ${PHASES[ph]}`; ol.appendChild(h); }
      const li = document.createElement('li'); li.textContent = s.text; li.dataset.i = s.i; li.value = s.i + 1; ol.appendChild(li);
    });
    stepsBuilt = true;
  }
  const cur = currentStep();
  ol.querySelectorAll('li[data-i]').forEach((li) => {
    const s = STEPS[+li.dataset.i];
    li.classList.toggle('done', isDone(s));
    li.classList.toggle('current', s === cur);
  });
  const done = STEPS.filter((s) => isDone(s)).length;
  $('guideBar').style.width = `${(done / STEPS.length) * 100}%`;
  if (cur) {
    $('guidePhase').textContent = `Phase ${cur.phase + 1} of ${PHASES.length} · ${PHASES[cur.phase]}`;
    $('guideText').textContent = cur.text;
    $('guideWhy').textContent = cur.why || '';
    $('bannerPhase').textContent = `Step ${cur.i + 1} of ${STEPS.length} · ${PHASES[cur.phase]}`;
    $('bannerText').textContent = cur.text;
    $('stepBanner').classList.remove('done');
    $('chipPhase').textContent = PHASES[cur.phase];
    hl.slots = cur.slots || []; hl.terms = cur.terms || []; hl.wire = !!cur.wire;
    if (cur.i !== lastStepIndex && lastStepIndex >= 0 && state.started) sfx('ok');
    lastStepIndex = cur.i;
  } else {
    $('guidePhase').textContent = 'Experiment complete';
    $('guideText').textContent = 'Well done! Every step is complete. Keep experimenting, fit a new specimen, or identify an unknown one.';
    $('guideWhy').textContent = '';
    $('bannerPhase').textContent = 'Complete';
    $('bannerText').textContent = 'Experiment complete — great work.';
    $('stepBanner').classList.add('done');
    $('chipPhase').textContent = 'Complete';
    hl.slots = []; hl.terms = []; hl.wire = false;
  }
}

// Pulsing rings over the terminals the current step needs
const ringPool = [];
function updateHighlights(t) {
  for (const [k, m] of Object.entries(slotMarkers)) {
    m.visible = state.started && hl.slots.includes(k) && !ITEMS[k].placed;
    if (m.visible) m.userData.plane.material.opacity = 0.14 + 0.12 * Math.sin(t * 5);
  }
  wireMarker.visible = state.started && hl.wire && !ITEMS.jockey.onBoard;
  if (wireMarker.visible) wireMarker.material.opacity = 0.15 + 0.12 * Math.sin(t * 5);
  const ids = state.started ? hl.terms.filter((id) => terminals[id] && !leads.some((L) => L.a === id || L.b === id)) : [];
  if (pending) ids.push(pending.from);
  while (ringPool.length < ids.length) {
    const r = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.35, 32), M.ring.clone());
    r.rotation.x = -Math.PI / 2;
    scene.add(r); ringPool.push(r);
  }
  ringPool.forEach((r, i) => {
    r.visible = i < ids.length;
    if (!r.visible) return;
    r.position.copy(termWorld(ids[i])).add(V3(0, 0.3, 0));
    const s = 1 + 0.25 * Math.sin(t * 6 + i);
    r.scale.set(s, s, s);
    r.material.color.setHex(pending && ids[i] === pending.from ? 0x22d3ee : 0xfde047);
  });
}

// ---------------------------------------------------------------------------
// Camera views
// ---------------------------------------------------------------------------

// Frame the x-range [x0, x1] for the current screen shape, looking down at the bench
function fitView(x0, x1, target) {
  const dir = V3(0, 0.66, 0.75).normalize();
  return {
    target: () => target,
    pos: () => {
      const vf = THREE.MathUtils.degToRad(camera.fov);
      const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
      const d = Math.max(((x1 - x0) / 2) * 1.08 / Math.tan(hf / 2), 90);
      return V3(...target).addScaledVector(dir, d).toArray();
    },
  };
}
const VIEWS = {
  room: { pos: [-40, 150, 330], target: [40, -20, -40] },
  setup: fitView(-62, 242, [90, -10, -6]),
  bench: fitView(-64, 64, [0, -4, -2]),
  scale: { pos: () => [S.lToX(state.l), 18, S.WIRE_Z + 30], target: () => [S.lToX(state.l), 0, S.WIRE_Z + 2] },
  galv: { pos: () => { const g = ITEMS.galv.group.position; return [g.x, 30, g.z + 20]; }, target: () => { const g = ITEMS.galv.group.position; return [g.x, S.TABLE_Y + 6, g.z]; } },
  box: { pos: () => { const g = ITEMS.box.group.position; return [g.x, 34, g.z + 32]; }, target: () => { const g = ITEMS.box.group.position; return [g.x, S.TABLE_Y + 4, g.z]; } },
  coil: { pos: () => { const g = ITEMS.coil.group.position; return [g.x, 30, g.z + 28]; }, target: () => { const g = ITEMS.coil.group.position; return [g.x, S.TABLE_Y + 2, g.z]; } },
  gauge: { pos: () => { const g = gauge.group.localToWorld(V3(gauge.zeroX + 1.5, gauge.axisY + 5, 19)); return [g.x, g.y, g.z]; }, target: () => { const g = gauge.group.localToWorld(V3(gauge.zeroX + 0.5, gauge.axisY, 0)); return [g.x, g.y, g.z]; } },
  top: { pos: [30, 190, 20], target: [30, 0, 0] },
};
let fly = null;
function flyTo(name) {
  const v = VIEWS[name];
  const val = (x) => (typeof x === 'function' ? x() : x);
  fly = { t0: performance.now(), dur: 900, p0: camera.position.clone(), t0v: controls.target.clone(), p1: V3(...val(v.pos)), t1: V3(...val(v.target)) };
}
function updateFly() {
  if (!fly) return;
  const k = Math.min(1, (performance.now() - fly.t0) / fly.dur);
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  camera.position.lerpVectors(fly.p0, fly.p1, e);
  controls.target.lerpVectors(fly.t0v, fly.t1, e);
  if (k >= 1) fly = null;
}
controls.addEventListener('start', () => { fly = null; });

// ---------------------------------------------------------------------------
// Labels and close-up insets
// ---------------------------------------------------------------------------

const labelsEl = $('labels');
const LABELS = [
  ...Object.entries(ITEMS).map(([k, it]) => [it.label, () => {
    const s = it.app?.size || [10, 8, 10];
    return it.group.position.clone().add(V3(0, (k === 'jockey' && it.onBoard ? 12 : s[1] + 4), 0));
  }]),
  ['Meter bridge', () => V3(-30, 3, S.WIRE_Z)],
  ['Screw gauge', () => gauge.group.position.clone().add(V3(0, 10, 0))],
  ['Apparatus trolley', () => V3(TROLLEY.x, S.TABLE_Y + 16, TROLLEY.z - 30)],
  ['PPE station — safety gear', () => ppe.group.localToWorld(V3(0, 214, 6))],
];
const labelEls = LABELS.map(([t]) => { const d = document.createElement('div'); d.className = 'tag'; d.textContent = t; labelsEl.appendChild(d); return d; });
const projV = new THREE.Vector3();
function updateLabels(w, h) {
  if (!state.labels) return;
  LABELS.forEach(([, f], i) => {
    const p = f();
    projV.copy(p).project(camera);
    const el = labelEls[i];
    const vis = state.started && projV.z < 1 && Math.abs(projV.x) < 1.05 && Math.abs(projV.y) < 1.05 && camera.position.distanceTo(p) < 330;
    el.style.display = vis ? '' : 'none';
    if (vis) el.style.transform = `translate(${((projV.x + 1) / 2) * w}px, ${((1 - projV.y) / 2) * h}px) translate(-50%, -100%)`;
  });
}

// Close-up insets: drag by the title bar, minimise with the – button.
// Position and minimised state are remembered in this browser.
function setupPip(el) {
  const key = `mbPip:${el.id}`;
  const bar = el.querySelector('.pipbar'), btn = el.querySelector('.pipmin');
  const clampPos = (x, y) => {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    return [THREE.MathUtils.clamp(x, 0, Math.max(0, sw - el.offsetWidth)), THREE.MathUtils.clamp(y, 0, Math.max(0, sh - 22))];
  };
  const put = (x, y) => { [x, y] = clampPos(x, y); el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.right = 'auto'; el.style.bottom = 'auto'; };
  const save = () => { try { localStorage.setItem(key, JSON.stringify({ x: el.offsetLeft, y: el.offsetTop, min: el.classList.contains('min') })); } catch (e) { /* storage unavailable */ } };
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    if (v) { if (v.min) el.classList.add('min'); requestAnimationFrame(() => put(v.x, v.y)); }
  } catch (e) { /* storage unavailable */ }
  const setMin = (m) => { el.classList.toggle('min', m); btn.textContent = m ? '▢' : '–'; btn.title = m ? 'Restore' : 'Minimise'; save(); };
  if (el.classList.contains('min')) setMin(true);
  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  btn.addEventListener('click', (e) => { e.stopPropagation(); setMin(!el.classList.contains('min')); });
  bar.addEventListener('dblclick', () => setMin(!el.classList.contains('min')));
  bar.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    bar.setPointerCapture(e.pointerId);
    const ox = e.clientX - el.offsetLeft, oy = e.clientY - el.offsetTop;
    el.classList.add('dragging');
    const move = (ev) => put(ev.clientX - ox, ev.clientY - oy);
    const up = () => { el.classList.remove('dragging'); bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); save(); };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
  });
  window.addEventListener('resize', () => { if (el.style.left) put(el.offsetLeft, el.offsetTop); });
}
setupPip($('pipLoupe'));
setupPip($('pipGalv'));

const loupeCam = new THREE.PerspectiveCamera(26, 250 / 150, 0.5, 300);
const galvCam = new THREE.PerspectiveCamera(30, 250 / 150, 0.5, 300);
function renderPip(el, cam) {
  if (el.classList.contains('min')) return;
  const BAR = 22;
  const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
  const x = r.left - sr.left + 2, w = r.width - 4, h = r.height - 4 - BAR;
  const y = sr.height - (r.top - sr.top) - r.height + 2;
  cam.aspect = w / h; cam.updateProjectionMatrix();
  renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h);
  renderer.render(scene, cam);
}

// ---------------------------------------------------------------------------
// Simulation loop
// ---------------------------------------------------------------------------

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function tweenPlug(p, dt) {
  const u = p.userData;
  u.t = THREE.MathUtils.damp(u.t, u.inserted ? 1 : 0, 10, dt);
  const lift = Math.sin(Math.PI * (1 - Math.abs(u.t * 2 - 1))) * 2.2;
  p.position.lerpVectors(u.out, u.home, u.t);
  p.position.y += lift;
  p.rotation.x = -(1 - u.t) * (Math.PI / 2);
}

let prevContact = false, settleTime = 0;
function simulate(dt) {
  const app = state.app;
  ITEMS.box.app.plugs.forEach((p) => tweenPlug(p, dt));
  tweenPlug(ITEMS.key.app.plug, dt);
  const pressing = state.holdSources.size > 0 && ITEMS.jockey.onBoard;
  state.lift = THREE.MathUtils.damp(state.lift, pressing ? 0 : 1.2, pressing ? 22 : 12, dt);
  if (state.lift < 0.04 && pressing) state.lift = 0;

  const sol = solveNow();
  state.sol = sol;
  state.T = P.stepTemperature(app, state.T, sol.P_X, dt);
  const keyIn = liveKey();
  state.keyOnFor = keyIn ? state.keyOnFor + dt : 0;
  if (state.keyOnFor > 25 && Math.floor(state.keyOnFor) % 20 === 5 && Math.floor(state.keyOnFor - dt) % 20 === 4) {
    toast(`The key has been in for ${Math.round(state.keyOnFor)} s. The test wire is at ${state.T.toFixed(1)} °C — remove the key between readings.`, 'warn');
  }
  if (Math.abs(sol.Icell) > 3 && performance.now() - state.shortWarned > 6000) {
    state.shortWarned = performance.now();
    toast(`Short circuit! ${Math.abs(sol.Icell).toFixed(1)} A is flowing from the accumulator. Remove the key and check the leads.`, 'err', 6000);
    sfx('buzz');
  }
  let target = P.deflection(sol.Ig);
  if (contact() && keyIn) target += (Math.random() - 0.5) * 0.08;
  state.needle = P.stepNeedle(state.needle, target, dt);

  const c = contact() && keyIn;
  if (c) {
    settleTime = prevContact ? settleTime + dt : 0;
    if (settleTime > 0.6 && (Math.abs(state.needle.omega) < 3 || Math.abs(state.needle.theta) > P.GALV.maxDiv)) {
      state.probe = { l: state.l, div: state.needle.theta, protect: state.protect, seq: (state.probe?.seq || 0) + 1 };
      if (state.protect) {
        state.hrUsed = true;
        if (state.l < 15) state.endsTapped.lo = state.needle.theta;
        if (state.l > 85) state.endsTapped.hi = state.needle.theta;
      }
    }
  }
  if (c && !prevContact) board.spark.material.opacity = Math.min(1, 0.25 + Math.abs(sol.Ig) * 2000);
  prevContact = c;
  board.spark.material.opacity *= Math.exp(-dt * 9);
  state.keyLive = keyIn;
}

function advance(seconds) {
  let t = seconds;
  while (t > 1e-9) { const h = Math.min(t, 1 / 60); simulate(h); t -= h; }
}

const clock = new THREE.Clock();
let uiTimer = 0;
let elapsed = 0;

function placeJockey() {
  const j = ITEMS.jockey;
  const jx = S.lToX(state.l);
  board.carriage.position.x = j.onBoard ? jx : -50;
  if (j.onBoard && !carried.has('jockey')) {
    j.group.position.set(jx, S.WIRE_Y + state.lift, S.WIRE_Z);
    j.group.rotation.set(0, 0, -0.08);
  }
  board.spark.position.set(jx, S.WIRE_Y, S.WIRE_Z);
}

// The student's right hand follows the mouse and adopts the right grip.
const armReach = () => (avatar ? avatar.armLen.upper + avatar.armLen.fore + avatar.armLen.hand - 2 : 88);
function clampReach(p) {
  state.reachTarget = p.clone(); // where the student wants to reach (drives the lean)
  const d = p.clone().sub(SHOULDER.right);
  // shoulder → fingertip; beyond this the student leans over the bench instead
  const max = armReach();
  if (d.length() > max) p.copy(SHOULDER.right).addScaledVector(d.normalize(), max);
  return p;
}
function driveHands() {
  if (!hands) return;
  state.reachTarget = null;
  const student = bodyMode() && avatar;
  if (student) {
    SHOULDER.right.copy(avatar.shoulderWorld('right'));
    SHOULDER.left.copy(avatar.shoulderWorld('left'));
    if (walking.active || (walking.keys && !autopilot)) { if (state.mode === 'fp') fpHands(); else bodyHands(); return; }
  }
  if (autopilot) return;
  const R = hands.right, Lh = hands.left;
  const hold = state.actionHold && performance.now() < state.actionHold.until ? state.actionHold : null;
  if (student && hold && !pointer && !state.holdSources.size) {
    R.setPose(hold.pose, hold.pose === 'pinch' ? 'pinch' : 'index');
    R.speed = 22;
    R.goal.copy(clampReach(hold.point.clone().add(V3(0, 1.2, 0))));
    aimHand(R, R.goal, -0.4);
    return;
  }
  const usable = hover && hover.point && hover.kind !== 'surface' && hover.kind !== 'lead';
  if (student && state.mode === 'fp' && !usable && !(pointer && (pointer.carry || pointer.hit.kind === 'jockey')) && !state.holdSources.size && !pending) {
    fpHands();
    return;
  }
  if (student && (!hover || !hover.point || (!reachable(hover.point) && !(pointer && pointer.carry)) || (hover.kind === 'surface' && !pointer)) && !state.holdSources.size && !pending) {
    // Nothing within reach under the mouse: arms relax at the sides, or point toward a far object
    if (hover && hover.point && hover.kind !== 'surface') {
      R.setPose('point', 'index');
      R.goal.copy(clampReach(hover.point.clone().add(V3(0, 4, 0))));
      aimHand(R, hover.point, -0.2);
    } else if (state.mode === 'fp') fpHands(); else bodyHands();
    return;
  }
  R.speed = 22;
  if (pointer && pointer.carry) {
    R.setPose('grab', 'palm');
    if (student) clampReach(R.goal);
    aimHand(R, R.goal, 0);
  } else if (state.holdSources.size && ITEMS.jockey.onBoard) {
    R.setPose('press', 'index');
    R.goal.copy(ITEMS.jockey.group.localToWorld(V3(0, 9.75, 0)));
    aimHand(R, R.goal, -0.32);
  } else if (pointer && pointer.hit.kind === 'jockey') {
    R.setPose('pinch', 'pinch');
    R.goal.copy(ITEMS.jockey.group.localToWorld(ITEMS.jockey.app.grip.clone()));
    aimHand(R, R.goal, -0.25);
  } else if (hover && hover.point) {
    const k = hover.kind;
    if (pending) { R.setPose('pinch', 'pinch'); R.goal.copy(hover.point).add(V3(0, 2.2, 0)); aimHand(R, R.goal, -0.4); }
    else if (k === 'surface') { R.setPose('relaxed', 'index'); R.goal.copy(hover.point).add(V3(0, 3.5, 0)); aimHand(R, R.goal, -0.2); }
    else { R.setPose('point', 'index'); R.goal.copy(hover.point).add(V3(0, 1.4, 0)); aimHand(R, R.goal, -0.35); }
  }
  if (student) clampReach(R.goal);
  R.goal.y = Math.max(R.goal.y, S.TABLE_Y + 1);
  R.goal.x = THREE.MathUtils.clamp(R.goal.x, ROOM.x0 + 30, ROOM.x1 - 30);
  R.goal.z = THREE.MathUtils.clamp(R.goal.z, ROOM.z0 + 30, ROOM.z1 - 30);
  if (student) {
    // Left hand rests on the bench edge in front of the student, or hangs at the side
    const a = avatar.state.pos;
    const atBench = Math.abs(a.x) < 118 && a.z < 80;
    if (atBench) { Lh.setPose('flat', 'palm'); Lh.goal.set(a.x - 20, S.TABLE_Y + 1.2, 40); Lh.yawGoal = 0.3; Lh.pitchGoal = 0; }
    else { Lh.setPose('relaxed', 'index'); Lh.goal.copy(avatar.bodyPoint(-23, 80, -3)); Lh.yawGoal = avatar.state.heading - 0.1; Lh.pitchGoal = -1.35; }
    return;
  }
  Lh.setPose('flat', 'palm'); Lh.goal.copy(LEFT_REST); Lh.yawGoal = 0.35; Lh.pitchGoal = 0;
}

const fpsProbe = { frames: 0, t: 0, done: false };
function frame() {
  const dt = Math.min(clock.getDelta(), 0.5);
  elapsed += dt;
  if (state.started && !fpsProbe.done) {
    fpsProbe.frames++; fpsProbe.t += dt;
    if (fpsProbe.t > 5) {
      fpsProbe.done = true;
      if (!lowGfx && fpsProbe.frames / fpsProbe.t < 22) toast('Motion looks slow on this computer. Untick “High-quality graphics” under “Specimen & view” for smoother motion.', 'info', 8000);
    }
  }
  runTweens(dt);
  if (state.app) advance(dt);
  driveStudent(dt);
  // The view or the body may have moved since the mouse last did: re-aim at what is under the cursor now
  if (state.started && lastMouse && hands && !(pointer && (pointer.look || pointer.carry))) hover = pick(lastMouse);
  driveHands();
  updateCarried();
  placeJockey();
  if (hands) hands.update(dt);
  if (avatar && bodyMode() && hands) {
    const a = avatar.state;
    // Lean over the bench until the target is within arm's reach (in first person
    // the torso is hidden and the camera does not follow the lean)
    const tgt = autopilot ? hands.right.goal : state.reachTarget;
    if (tgt && tgt.y < 30) {
      const deficit = tgt.distanceTo(SHOULDER.right) - (armReach() - 9);
      a.leanGoal = THREE.MathUtils.clamp(a.lean + deficit / 45, 0, 0.95);
    } else a.leanGoal = 0;
    avatar.update(dt, { moving: walking.speed > 1, speed: walking.speed, handL: hands.left, handR: hands.right });
  }
  updateFPCamera();
  if (pending) updatePendingLead(hands ? hands.right.goal.clone() : (hover && hover.point ? hover.point.clone().add(V3(0, 2, 0)) : termWorld(pending.from).add(V3(0, 4, 4))));
  updateLeads();
  for (const s of [...spinning]) { s.cap.rotation.y += dt * 14; s.left -= dt; if (s.left <= 0) spinning.splice(spinning.indexOf(s), 1); }
  ITEMS.galv.app.pivot.rotation.y = -(state.needle.theta / P.GALV.maxDiv) * THREE.MathUtils.degToRad(48);
  ITEMS.galv.app.knob.rotation.y = state.protect ? 0.8 : -0.8;
  const hot = THREE.MathUtils.clamp((state.T - 45) / 80, 0, 1);
  ITEMS.coil.app.wireMesh.material.emissive.setRGB(hot * 0.8, hot * 0.15, 0);
  room.update();
  updateFlow(dt);
  updateHighlights(elapsed);
  updateFly();
  followCamera(dt);
  if (state.mode !== 'fp') controls.update();
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, ROOM.x0 + 15, ROOM.x1 - 15);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, ROOM.z0 + 15, ROOM.z1 - 15);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, FLOOR_Y + 20, FLOOR_Y + 290);

  const jx = S.lToX(state.l);
  loupeCam.position.set(jx, 13, S.WIRE_Z + 13.5);
  loupeCam.lookAt(jx, 0.7, S.WIRE_Z + 1.3);
  const gp = ITEMS.galv.group.position;
  galvCam.position.set(gp.x, S.TABLE_Y + 6.5 + 17, gp.z + 9);
  galvCam.lookAt(gp.x, S.TABLE_Y + 6.5, gp.z - 0.4);

  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, w, h);
  renderer.render(scene, camera);
  const atBench = !avatar || state.mode !== 'fp' || (Math.abs(avatar.state.pos.x) < 125 && avatar.state.pos.z < 95);
  const showPip = state.started && state.pip && w > 360 && ITEMS.jockey.onBoard && ITEMS.galv.placed && atBench;
  $('pipLoupe').classList.toggle('hidden', !showPip);
  $('pipGalv').classList.toggle('hidden', !showPip);
  if (showPip) {
    renderer.setScissorTest(true);
    renderPip($('pipLoupe'), loupeCam);
    renderPip($('pipGalv'), galvCam);
    renderer.setScissorTest(false);
  }
  updateLabels(w, h);
  uiTimer += dt;
  if (uiTimer > 0.1) { uiTimer = 0; updateUi(); }
  requestAnimationFrame(frame);
}

function updateUi() {
  const s = state.sol;
  const div = state.needle.theta;
  const keyIn = state.keyLive;
  $('lval').textContent = `${state.l.toFixed(1)} cm`;
  $('mDiv').textContent = `${div >= 0 ? '+' : ''}${div.toFixed(1)} div`;
  $('mDiv').style.color = contact() && keyIn ? (Math.abs(div) < 0.5 ? '#34d399' : '#fbbf24') : '#67e8f9';
  $('mIg').textContent = `${(s.Ig * 1e6).toFixed(Math.abs(s.Ig) < 1e-4 ? 1 : 0)} μA`;
  $('mIc').textContent = `${(s.Icell * 1000).toFixed(0)} mA`;
  $('mT').textContent = `${state.T.toFixed(1)} °C`;
  $('mT').style.color = state.T > P.T_ROOM + 8 ? '#fbbf24' : '#67e8f9';
  const kb = $('btnKey');
  kb.textContent = state.keyIn ? 'Remove key K' : 'Insert key K';
  kb.classList.toggle('on', state.keyIn);
  const hb = $('btnHR');
  hb.textContent = state.protect ? 'Remove HR (fine null)' : 'Put HR back in';
  hb.classList.toggle('warn', !state.protect);
  pressBtn.classList.toggle('active', contact());
  const w = wiringChecks();
  const chip = (id, text, cls) => { const el = $(id); el.textContent = text; el.className = `chip ${cls || ''}`; };
  chip('chipKey', `Key K: ${state.keyIn ? 'in' : 'out'}`, state.keyIn ? (state.T > P.T_ROOM + 8 ? 'hot' : 'ok') : '');
  chip('chipHR', `HR: ${state.protect ? 'in (protected)' : 'out (sensitive)'}`, state.protect ? '' : 'hot');
  chip('chipJockey', ITEMS.jockey.onBoard ? `Jockey: ${contact() ? 'pressed' : 'lifted'} @ ${state.l.toFixed(1)} cm` : 'Jockey: not on the wire', contact() ? 'ok' : '');
  const nLeads = leads.length;
  chip('chipCircuit', w.complete ? `Circuit: complete${w.swapped ? ' (R in gap 2)' : ''}` : `Circuit: ${nLeads} lead${nLeads === 1 ? '' : 's'}`, w.complete ? 'ok' : '');
  const xj = 20 + state.l * 1.8;
  $('schJockey').setAttribute('cx', xj);
  $('schLead').setAttribute('x2', xj);
  const na = THREE.MathUtils.clamp(div / P.GALV.maxDiv, -1.1, 1.1) * 0.9;
  $('schNeedle').setAttribute('x2', 110 + Math.sin(na) * 11);
  $('schNeedle').setAttribute('y2', 74 - Math.cos(na) * 11);
  $('schLeftLabel').textContent = w.swapped ? 'X' : `R = ${fmt(currentR(), 1)} Ω`;
  $('schRightLabel').textContent = w.swapped ? `R = ${fmt(currentR(), 1)} Ω` : 'X';
  $('schL').textContent = `l = ${state.l.toFixed(1)}`;
  $('schM').textContent = `${(100 - state.l).toFixed(1)}`;
  $('schM').setAttribute('x', Math.min(185, xj + 8));
  $('schL').setAttribute('x', Math.max(22, xj / 2 - 10));
  updateGuide();
}

// ---------------------------------------------------------------------------
// Specimen, setup modes and boot
// ---------------------------------------------------------------------------

function newSpecimen() {
  const key = state.materialChoice === 'mystery'
    ? ['nichrome', 'constantan', 'manganin', 'eureka'][Math.floor(Math.random() * 4)]
    : state.materialChoice;
  state.app = P.createApparatus(key, (Math.random() * 2 ** 31) | 0);
  state.T = P.T_ROOM;
  state.readings = [];
  state.gauge = { zero: null, rows: [] };
  state.length = null;
  state.probe = null;
  state.sent = false;
  if (typeof STEPS !== 'undefined') STEPS.forEach((st) => { if (st.phase >= 4) st.latched = false; });
  buildCoilItem();
  leads.forEach(rebuildLeadMesh);
  flowKey = '';
  renderTables();
  updateResult();
}

function resetBench() {
  STEPS.forEach((st) => { st.latched = false; });
  [...leads].forEach(disconnect);
  cancelLead();
  ITEMS.box.slot = [-27, -27, 0];
  ITEMS.coil.slot = [27, -23, 0];
  Object.keys(ITEMS).forEach(sendHome);
  state.keyIn = false; ITEMS.key.app.plug.userData.inserted = false;
  state.protect = true; state.hrUsed = false; state.endsTapped = { lo: null, hi: null };
  state.plugsOut.clear(); syncPlugs();
}

function quickSetup() {
  Object.keys(ITEMS).forEach(placeAtSlot);
  [['cell.+', 'key.1'], ['key.2', 'board.A'], ['cell.-', 'board.C'], ['box.1', 'board.g1a'], ['box.2', 'board.g1b'],
    ['coil.1', 'board.g2a'], ['coil.2', 'board.g2b'], ['galv.-', 'board.B'], ['galv.+', 'jockey.T']]
    .forEach(([a, b]) => {
      const L = { id: ++leadSeq, a, b, color: pickColor(a), slack: 0.8 + Math.random() * 0.5 };
      placeJockey();
      rebuildLeadMesh(L); leads.push(L);
    });
  leadsVersion++;
  state.hrUsed = true; state.endsTapped = { lo: -1, hi: 1 };
  toast('The bench is set up and wired. Insert key K, choose R and find the balance point.', 'info', 6000);
}

const MODE_HINTS = {
  auto: '<b>Watch</b>: the student performs the whole experiment. <b>Drag</b> to move the camera around them, <b>scroll</b> to zoom · <b>Pause</b> / speed in the Guide panel',
  fp: '<b>W A S D</b> walk · <b>Q/E</b> turn · <b>drag</b> empty space to look · <b>click</b> things to use them with your hands · <b>drag</b> apparatus to carry · <b>click</b> terminal → terminal for a lead · <b>right-click</b> a lead to remove · <b>hold</b> the jockey or <b>Space</b> to press',
  classic: '<b>Drag</b> the jockey to slide it · <b>hold</b> it, <b>Space</b> or <b>Press</b> to touch the wire · <b>←/→</b> 1 mm (Shift: 1 cm) · <b>click</b> plugs, key K and the HR knob · <b>drag</b> empty space to look around',
};
function studentView() {
  // From the middle of the room toward the student, raised to look down on them
  const t = avatar.bodyPoint(0, 95, -20);
  const dir = V3(60 - t.x, 0, 110 - t.z);
  if (dir.lengthSq() < 1) dir.set(0, 0, 1);
  dir.normalize();
  return { pos: t.clone().addScaledVector(dir, 230).add(V3(0, 120, 0)).toArray(), target: t.toArray() };
}
let pendingAuto = false;
function setMode(mode) {
  if (mode !== 'classic' && (!handsLoaded || !avatar)) mode = 'classic';
  if (autopilot) { demoAbort = true; pendingAuto = mode === 'auto'; }
  state.mode = mode;
  hands = mode === 'classic' ? null : handsLoaded;
  cancelLead();
  keys.clear();
  if (handsLoaded) {
    handsLoaded.right.root.visible = handsLoaded.left.root.visible = mode !== 'classic' && $('optHands').checked;
  }
  if (avatar) {
    avatar.setVisible(mode !== 'classic' && $('optHands').checked);
    avatar.setHeadVisible(mode !== 'fp');
    fp.yaw = avatar.state.heading; fp.pitch = -0.3;
  }
  controls.enabled = mode !== 'fp';
  camera.near = mode === 'fp' ? 2.5 : 0.5;
  camera.fov = mode === 'fp' ? 70 : 40; // wide, game-like view in first person
  camera.updateProjectionMatrix();
  $('gogglesOverlay').classList.toggle('on', mode === 'fp' && gearOn('goggles'));
  if (mode === 'classic' && !wiringChecks().complete) {
    // No human: the bench is set up and wired for you
    [...leads].forEach(disconnect);
    carried.clear();
    quickSetup();
  }
  $('mode').value = mode;
  $('hint').innerHTML = MODE_HINTS[mode];
  document.body.dataset.mode = mode;
  followPrev = null;
  if (state.started) {
    if (mode === 'auto') { fly = null; const v = studentView(); camera.position.set(...v.pos); controls.target.set(...v.target); }
    else if (mode === 'classic') flyTo('bench');
    else { controls.target.copy(avatar.eyeWorld()); }
  }
  setDemoButtons(false);
  if (mode === 'auto' && state.started && !autopilot) setTimeout(runAuto, 400);
}

// Watch mode: the student performs every remaining step, one by one
async function runAuto() {
  if (state.mode !== 'auto' || autopilot || !avatar) return;
  $('autoPause').textContent = '⏸ Pause';
  await withAutopilot(async () => {
    let last = -1, tries = 0;
    for (let guard = 0; guard < 90; guard++) {
      const st = currentStep();
      if (!st || state.mode !== 'auto') break;
      if (st.i === last) { if (++tries > 2) { toast('The student could not finish this step. Press Restart to try again.', 'err', 6000); break; } } else { last = st.i; tries = 0; }
      await st.demo();
      await wait(0.35);
    }
  });
  if (pendingAuto) { pendingAuto = false; if (state.mode === 'auto') setTimeout(runAuto, 200); return; }
  if (state.mode === 'auto' && !currentStep()) { toast('The student has completed the experiment — every reading and measurement is recorded.', 'ok', 8000); $('autoPause').textContent = '↻ Watch again'; }
}

function start(mode, ready) {
  $('startScreen').classList.add('hidden');
  state.started = true;
  demoAbort = true;
  resetBench();
  resetGear();
  vclock.paused = false;
  if (avatar) { avatar.state.pos.set(470, FLOOR_Y, 300); avatar.state.heading = Math.PI / 2; } // entering by the door
  if (mode === 'classic' || ready) quickSetup();
  setMode(mode);
  if (mode === 'fp') {
    toast('You are the student. First go to the PPE station on your left and put on a lab coat, goggles, gloves and safety shoes (click each one).', 'info', 9000);
  } else if (mode === 'auto') {
    toast('Watch the student gear up, set up the bench and perform the experiment. Drag to move the camera.', 'info', 7000);
  }
  sfx('ok');
}

new ResizeObserver(resize).observe(stage);
resize();
if (lowGfx) applyQuality(true);
registerTerminals();
newSpecimen();
resetBench();
syncPlugs();
updateGuide();
frame();

const START_BTNS = ['startAuto', 'startFP', 'startClassic'];
START_BTNS.forEach((id) => { $(id).disabled = true; });
loadAvatar(scene).then((a) => {
  avatar = a;
  avatar.state.pos.set(470, FLOOR_Y, 300);
  avatar.state.heading = Math.PI / 2;
  avatar.setVisible(false);
  // The student's own hands are the interactive hands
  const h = a.hands;
  handsLoaded = h;
  h.right.goal.copy(a.bodyPoint(23, 80, -3)); h.right.pos.copy(h.right.goal);
  h.left.goal.copy(a.bodyPoint(-23, 80, -3)); h.left.pos.copy(h.left.goal);
}).catch((e) => {
  console.warn('Human models could not be loaded; only the no-human mode is available.', e);
}).finally(() => {
  $('loadNote').textContent = handsLoaded ? 'Ready. Choose how you want to work.' : 'Ready (human models unavailable — no-human mode only).';
  START_BTNS.forEach((id) => { $(id).disabled = !handsLoaded && id !== 'startClassic'; });
  setDemoButtons(false);
});
$('startAuto').onclick = () => start('auto', $('startReady').checked);
$('startFP').onclick = () => start('fp', $('startReady').checked);
$('startClassic').onclick = () => start('classic', true);
$('mode').onchange = (e) => setMode(e.target.value);
$('autoPause').onclick = () => {
  if (!autopilot) { if (!currentStep()) start('auto', $('startReady').checked); else runAuto(); return; }
  vclock.paused = !vclock.paused;
  $('autoPause').textContent = vclock.paused ? '▶ Resume' : '⏸ Pause';
};
$('autoSpeed').onchange = (e) => { vclock.scale = +e.target.value; };
$('autoRestart').onclick = () => start('auto', $('startReady').checked);

// Exposed for automated checks and curious students
window.meterBridge = {
  state, P, advance, leads, terminals, ITEMS, connect, disconnect, wiringChecks, findNull, setL, setR,
  ppeItems: ppe.items, pickAt: (x, y) => { const h = pick({ clientX: x, clientY: y }); return h && { kind: h.kind, name: h.obj?.userData?.gear || h.key || h.id }; },
  toggleKey, toggleHR, recordReading, flyTo, start, setMode, withAutopilot, walkTo, keys, runAuto, vclock, fp, wearGear, allGear, currentStep, STEPS, demoInterchange,
  get hands() { return hands; }, get autopilot() { return autopilot; }, get avatar() { return avatar; },
  camera, controls, gauge, walking, hoverKind: () => hover && hover.kind, lastMouseSet: () => !!lastMouse,
  updateUi: () => updateUi(),
};
