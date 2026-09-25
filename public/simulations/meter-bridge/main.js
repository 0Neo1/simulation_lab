import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import * as P from './physics.js';
import * as S from './scene.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('gl');

// ---------------------------------------------------------------------------
// Renderer, camera, lighting
// ---------------------------------------------------------------------------

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  stage.insertAdjacentHTML('beforeend', '<div id="glError">WebGL is not available in this browser, so the 3D bench cannot be shown.</div>');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151b26);
scene.fog = new THREE.Fog(0x151b26, 260, 520);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 1200);
camera.position.set(0, 72, 96);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, -2, -2);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 12;
controls.maxDistance = 260;

scene.add(new THREE.HemisphereLight(0xdbeafe, 0x3b2a1a, 0.55));
const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
sun.position.set(-60, 120, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 70, bottom: -70, near: 10, far: 320 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun);
const fill = new THREE.PointLight(0x9ecbff, 400, 0, 2);
fill.position.set(70, 40, -60);
scene.add(fill);

const M = S.makeMaterials();
const H = S.buildBench(scene, M);

// ---------------------------------------------------------------------------
// Experiment state
// ---------------------------------------------------------------------------

const state = {
  materialChoice: 'nichrome',
  app: null,
  plugsOut: new Set(),
  keyIn: false,
  protect: true,
  swapped: false,
  l: 50,
  lift: 1.2, // jockey height above the wire (0 = touching)
  holdSources: new Set(), // pointer / space / button
  T: P.T_ROOM,
  keyOnFor: 0,
  needle: { theta: 0, omega: 0 },
  sol: null,
  probe: null, // last settled reading while pressed: { l, div, protect }
  hrUsed: false,
  readings: [],
  gauge: { zero: null, rows: [] },
  length: null,
  flow: true,
  labels: true,
  pip: true,
  scratchWarned: 0,
};

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
  S.layoutGaps(H, M, { swapped: state.swapped, material: state.app.material, wireLengthCm: state.app.lengthCm });
  buildFlow();
  renderTables();
  updateResult();
}

const currentR = () => [...state.plugsOut].reduce((s, i) => s + P.BOX_PLUGS[i], 0);
const contact = () => state.lift < 0.04;

// ---------------------------------------------------------------------------
// Charge-flow particles
// ---------------------------------------------------------------------------

const FLOW_MAX = 1400;
const flowGeo = new THREE.SphereGeometry(0.16, 8, 6);
const flowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
const flowMesh = new THREE.InstancedMesh(flowGeo, flowMat, FLOW_MAX);
flowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
flowMesh.frustumCulled = false;
scene.add(flowMesh);
const colMain = new THREE.Color(0xffd166);
const colGalv = new THREE.Color(0x5eead4);
let flowSegs = [];

const poly = (...pts) => {
  const path = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return path;
};

function buildFlow() {
  const T = H.terminals;
  const y = S.STRIP_TOP + 0.05;
  const v = (x, z, yy = y) => new THREE.Vector3(x, yy, z);
  const cur = (k) => () => (state.sol ? state.sol[k] : 0);
  const gapBox = () => (state.sol ? (state.swapped ? state.sol.Iright : state.sol.Ileft) : 0);
  const gapWire = () => (state.sol ? (state.swapped ? state.sol.Ileft : state.sol.Iright) : 0);
  const segs = [
    { curve: H.curves.cellA, I: cur('Icell') },
    { curve: reverseCurve(H.curves.cellKey), I: cur('Icell') },
    { curve: reverseCurve(H.curves.keyC), I: cur('Icell') },
    // copper strips
    { curve: poly(v(-51, -1.5), v(-51, S.WIRE_Z)), I: cur('IwireL') },
    { curve: poly(v(-51, -1.5), v(-51, -8), v(-30.5, -8)), I: cur('Ileft') },
    { curve: poly(v(-17.5, -8), v(0, -8)), I: cur('Ileft') },
    { curve: poly(v(0, -8), v(17.5, -8)), I: cur('Iright') },
    { curve: poly(v(30.5, -8), v(51, -8), v(51, -1.5)), I: cur('Iright') },
    { curve: poly(v(51, S.WIRE_Z), v(51, -1.5)), I: cur('IwireR') },
    // gaps
    ...H.gapPaths.box.map((c) => ({ curve: c, I: gapBox })),
    ...H.gapPaths.wire.map((c) => ({ curve: c, I: gapWire })),
    // galvanometer branch: B → G → jockey
    { curve: H.curves.galvB, I: cur('Ig'), galv: true },
    { curve: null, I: cur('Ig'), galv: true, dyn: 'jockeyLead' },
    // bridge wire either side of the jockey
    { curve: null, I: cur('IwireL'), dyn: 'wireL' },
    { curve: null, I: cur('IwireR'), dyn: 'wireR' },
  ];
  flowSegs = segs.map((s) => ({ ...s, phase: Math.random() }));
  updateDynamicCurves(true);
}

function reverseCurve(c) {
  const pts = c.points.slice().reverse();
  return new THREE.CatmullRomCurve3(pts, false, c.curveType, c.tension);
}

let jockeyLeadMesh = null;
let lastLeadKey = '';
function updateDynamicCurves(force = false) {
  const x = S.lToX(state.l);
  const wy = S.WIRE_Y;
  const key = `${state.l.toFixed(2)}|${state.lift.toFixed(2)}`;
  if (!force && key === lastLeadKey) return;
  lastLeadKey = key;
  H.jockey.group.updateMatrixWorld(true);
  const top = H.jockey.leadTop();
  const g = H.anchors.galvJ;
  const mid = top.clone().lerp(g, 0.5);
  mid.y = Math.max(S.TABLE_Y + 0.3, Math.min(top.y, g.y) + 1);
  const curve = new THREE.CatmullRomCurve3([
    g.clone(), g.clone().add(new THREE.Vector3(0, 2, 0)),
    g.clone().lerp(mid, 0.5).setY(g.y + 4),
    mid.setY(mid.y + 6),
    top.clone().add(new THREE.Vector3(0, 4, 0)), top.clone(),
  ], false, 'centripetal');
  if (jockeyLeadMesh) { scene.remove(jockeyLeadMesh); jockeyLeadMesh.traverse((o) => o.geometry && o.geometry.dispose()); }
  jockeyLeadMesh = S.leadMesh(curve, 'green');
  scene.add(jockeyLeadMesh);
  for (const s of flowSegs) {
    if (s.dyn === 'jockeyLead') s.curve = curve;
    else if (s.dyn === 'wireL') s.curve = poly(new THREE.Vector3(-50, wy, S.WIRE_Z), new THREE.Vector3(Math.max(x, -49.9), wy, S.WIRE_Z));
    else if (s.dyn === 'wireR') s.curve = poly(new THREE.Vector3(Math.min(x, 49.9), wy, S.WIRE_Z), new THREE.Vector3(50, wy, S.WIRE_Z));
    if (s.curve) s.len = Math.max(0.5, s.curve.getLength());
  }
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const tmpP = new THREE.Vector3();
function visSpeed(I) {
  const a = Math.abs(I);
  if (a < 2e-8) return 0;
  return Math.sign(I) * (3 + 19 * Math.min(1, Math.log10(a / 2e-8) / 7.7));
}
function updateFlow(dt) {
  let n = 0;
  if (state.flow && state.keyIn) {
    for (const s of flowSegs) {
      if (!s.curve) continue;
      const I = s.I();
      const v = visSpeed(I);
      if (!v) continue;
      s.phase = (s.phase + (v * dt) / s.len + 1) % 1;
      const count = Math.max(1, Math.floor(s.len / 2.4));
      const size = 0.6 + 0.6 * Math.min(1, Math.log10(Math.abs(I) / 2e-8) / 7.7);
      for (let i = 0; i < count && n < FLOW_MAX; i++) {
        const f = (i / count + s.phase) % 1;
        s.curve.getPointAt(f, tmpP);
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
// Picking & interaction
// ---------------------------------------------------------------------------

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(S.WIRE_Y + 1));
let pointer = null; // { id, x, y, mode: 'jockey'|'maybe', moved, t0, target }

function setNdc(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
}

const pickables = () => [H.jockey.jockey, H.key.plug, H.galv.knob, ...H.box.plugs, H.jockey.carriage];

function pick(e) {
  setNdc(e);
  const hits = raycaster.intersectObjects(pickables(), true);
  if (!hits.length) return null;
  const o = hits[0].object;
  return o.userData.pick || (H.jockey.carriage.getObjectById(o.id) ? H.jockey.jockey : null);
}

function lFromPointer(e) {
  setNdc(e);
  const p = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(dragPlane, p)) return null;
  return THREE.MathUtils.clamp(S.xToL(p.x), 0, 100);
}

canvas.addEventListener('pointerdown', (e) => {
  const target = pick(e);
  if (!target) return;
  const kind = target.userData.kind;
  e.preventDefault();
  if (kind === 'jockey') {
    controls.enabled = false;
    canvas.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, t0: performance.now(), grabL: state.l, grabP: lFromPointer(e) };
  } else if (kind === 'plug') togglePlug(target.userData.index);
  else if (kind === 'key') toggleKey();
  else if (kind === 'hr') toggleHR();
});

canvas.addEventListener('pointermove', (e) => {
  if (!pointer) {
    const t = pick(e);
    canvas.style.cursor = t ? (t.userData.kind === 'jockey' ? 'grab' : 'pointer') : '';
    return;
  }
  if (e.pointerId !== pointer.id) return;
  const dist = Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y);
  if (!pointer.moved && dist > 4) pointer.moved = true;
  if (pointer.moved) {
    const l = lFromPointer(e);
    if (l != null && pointer.grabP != null) setL(pointer.grabL + (l - pointer.grabP));
    canvas.style.cursor = 'grabbing';
  }
});

function endPointer(e) {
  if (!pointer || e.pointerId !== pointer.id) return;
  if (!pointer.moved && !state.holdSources.has('pointer')) tapPress();
  state.holdSources.delete('pointer');
  pointer = null;
  controls.enabled = true;
  canvas.style.cursor = '';
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

function tapPress() {
  state.holdSources.add('tap');
  setTimeout(() => state.holdSources.delete('tap'), 650);
}

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  if (e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') { state.holdSources.add('space'); e.preventDefault(); }
  else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    if (e.target.type === 'range') return;
    const step = e.shiftKey ? 1 : 0.1;
    setL(state.l + (e.code === 'ArrowLeft' ? -step : step));
    e.preventDefault();
  } else if (e.code === 'KeyK') toggleKey();
  else if (e.code === 'KeyH') toggleHR();
  else if (e.code === 'KeyR') recordReading();
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space') state.holdSources.delete('space'); });
window.addEventListener('blur', () => state.holdSources.clear());

// Holding still on the jockey for a moment presses it down
setInterval(() => {
  if (pointer && !pointer.moved && performance.now() - pointer.t0 > 180) state.holdSources.add('pointer');
}, 50);

function setL(l) {
  const nl = Math.round(THREE.MathUtils.clamp(l, 0, 100) * 100) / 100;
  if (contact() && Math.abs(nl - state.l) > 0.3 && performance.now() - state.scratchWarned > 4000) {
    toast('Lift the jockey before sliding it — dragging it while pressed scrapes the wire and changes its cross-section.', 'warn');
    state.scratchWarned = performance.now();
  }
  state.l = nl;
  $('lSlider').value = nl;
}

function togglePlug(i) {
  if (state.plugsOut.has(i)) state.plugsOut.delete(i); else state.plugsOut.add(i);
  syncPlugs();
}
function setR(target) {
  // Choose plugs greedily from the largest, as one would on a real box
  state.plugsOut.clear();
  let rem = target;
  const order = P.BOX_PLUGS.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  for (const [v, i] of order) if (v <= rem + 1e-9) { state.plugsOut.add(i); rem -= v; }
  syncPlugs();
}
function syncPlugs() {
  H.box.plugs.forEach((p, i) => { p.userData.inserted = !state.plugsOut.has(i); });
  document.querySelectorAll('.plug').forEach((el) => el.classList.toggle('out', state.plugsOut.has(+el.dataset.i)));
  $('Rval').textContent = `${fmt(currentR(), 1)} Ω`;
  state.probe = null;
}
function toggleKey() {
  state.keyIn = !state.keyIn;
  H.key.plug.userData.inserted = state.keyIn;
  if (!state.keyIn) state.keyOnFor = 0;
}
function toggleHR() {
  state.protect = !state.protect;
  if (state.protect) state.hrUsed = true;
  state.probe = null;
}
function toggleSwap() {
  state.swapped = !state.swapped;
  state.probe = null;
  S.layoutGaps(H, M, { swapped: state.swapped, material: state.app.material, wireLengthCm: state.app.lengthCm });
  buildFlow();
  toast(state.swapped ? 'Resistance box moved to gap 2 and the test wire to gap 1. Now X = R·l / (100 − l).' : 'Resistance box back in gap 1. X = R·(100 − l) / l.', 'info');
}

// ---------------------------------------------------------------------------
// Panel wiring
// ---------------------------------------------------------------------------

const plugWrap = $('plugChips');
P.BOX_PLUGS.forEach((v, i) => {
  const b = document.createElement('button');
  b.className = 'plug'; b.dataset.i = i; b.textContent = v;
  b.title = `${v} Ω plug`;
  b.onclick = () => togglePlug(i);
  plugWrap.appendChild(b);
});
document.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => setR(+b.dataset.r)));
$('btnKey').onclick = toggleKey;
$('btnHR').onclick = toggleHR;
$('btnSwap').onclick = toggleSwap;
$('lSlider').addEventListener('input', (e) => setL(+e.target.value));
const pressBtn = $('btnPress');
const pressOn = (e) => { e.preventDefault(); state.holdSources.add('button'); };
const pressOff = () => state.holdSources.delete('button');
pressBtn.addEventListener('pointerdown', pressOn);
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => pressBtn.addEventListener(ev, pressOff));
$('btnAuto').onclick = autoHunt;
$('btnRecord').onclick = recordReading;
$('btnZero').onclick = checkZero;
$('btnGauge').onclick = gaugeReading;
$('btnLength').onclick = measureLength;
$('btnSend').onclick = sendToObservation;
$('btnCsv').onclick = exportCsv;
$('btnNew').onclick = () => { newSpecimen(); toast('A fresh specimen has been connected. Previous readings were cleared.', 'info'); };
$('material').onchange = (e) => { state.materialChoice = e.target.value; newSpecimen(); };
$('optFlow').onchange = (e) => (state.flow = e.target.checked);
$('optLabels').onchange = (e) => { state.labels = e.target.checked; labelsEl.classList.toggle('hidden', !state.labels); };
$('optPip').onchange = (e) => { state.pip = e.target.checked; $('pipLoupe').classList.toggle('hidden', !state.pip); $('pipGalv').classList.toggle('hidden', !state.pip); };
// Keep Space for the jockey: never leave focus on a clicked button
document.addEventListener('click', (e) => { if (e.target.closest('button')) e.target.closest('button').blur(); });
document.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => flyTo(b.dataset.view)));

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
// Auto-hunt (demonstration of the bracketing technique)
// ---------------------------------------------------------------------------

let hunting = false;
async function autoHunt() {
  if (hunting) return;
  if (!state.keyIn) toggleKey();
  if (currentR() === 0) setR(2);
  hunting = true;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const probeAt = async (l) => {
    await glide(l);
    state.holdSources.add('auto');
    await wait(900);
    const d = state.needle.theta;
    state.holdSources.delete('auto');
    await wait(250);
    return d;
  };
  try {
    let lo = 5, hi = 95;
    const dlo = await probeAt(lo);
    for (let i = 0; i < 9 && hi - lo > 0.15; i++) {
      const mid = Math.round(((lo + hi) / 2) * 10) / 10;
      const d = await probeAt(mid);
      if (Math.abs(d) < 0.15) { lo = hi = mid; break; }
      if (Math.sign(d) === Math.sign(dlo)) lo = mid; else hi = mid;
    }
    await probeAt(Math.round(((lo + hi) / 2) * 10) / 10);
    toast('Null point bracketed. Tap the jockey once more to confirm, then record it.', 'ok');
  } finally {
    hunting = false;
    state.holdSources.delete('auto');
  }
}
function glide(target) {
  return new Promise((resolve) => {
    const start = state.l, t0 = performance.now(), dur = 450;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      state.l = start + (target - start) * (1 - Math.pow(1 - k, 3));
      $('lSlider').value = state.l;
      if (k < 1) requestAnimationFrame(step); else { state.l = target; resolve(); }
    };
    step();
  });
}

// ---------------------------------------------------------------------------
// Observations, screw gauge, result
// ---------------------------------------------------------------------------

function recordReading() {
  const R = currentR();
  if (!state.keyIn) return toast('Insert the key K first — no current flows in the bridge.', 'err');
  if (R === 0) return toast('Take out at least one plug from the resistance box to introduce a known R.', 'err');
  const pr = state.probe;
  if (!pr || Math.abs(pr.l - state.l) > 0.05) return toast('Press the jockey at this position and watch the galvanometer before recording.', 'err');
  if (pr.protect) return toast('The high resistance is still in series with the galvanometer. Remove HR to locate the null point precisely.', 'warn');
  if (Math.abs(pr.div) > 0.5) return toast(`The galvanometer still deflects ${fmt(pr.div, 1)} div. Move the jockey toward the null point.`, 'err');
  if (state.l < 20 || state.l > 80) toast('Balance point is far from the middle of the wire; end errors will be large. Choose R so that l lies between 30 and 70 cm.', 'warn', 6000);
  const l = Math.round(state.l * 10) / 10;
  const X = state.swapped ? (R * l) / (100 - l) : (R * (100 - l)) / l;
  state.readings.push({ gap: state.swapped ? 1 : 2, R, l, X, T: state.T });
  renderTables();
  updateResult();
  toast(`Recorded: R = ${R} Ω, l = ${l.toFixed(1)} cm → X = ${X.toFixed(3)} Ω`, 'ok');
  if (state.T > P.T_ROOM + 8) toast('The test wire has warmed up. Remove the key between readings to let it cool.', 'warn');
}

function checkZero() {
  const z = state.app.zeroErrorMm;
  state.gauge.zero = z;
  const csd = Math.round(Math.abs(z) / 0.01);
  toast(z === 0 ? 'Jaws closed: the zero of the circular scale coincides with the reference line. No zero error.' :
    z > 0 ? `Jaws closed: zero of circular scale is ${csd} div below the reference line → positive zero error +${z.toFixed(2)} mm.` :
      `Jaws closed: zero of circular scale is ${csd} div above the reference line → negative zero error ${z.toFixed(2)} mm.`, 'info', 6500);
  renderTables();
  updateResult();
}

function gaugeReading() {
  if (state.gauge.zero == null) return toast('Check the zero error of the screw gauge first.', 'warn');
  if (state.gauge.rows.length >= 6) return toast('Six readings (three places, two perpendicular directions) are enough.', 'info');
  const i = state.gauge.rows.length;
  const r = P.screwGaugeReading(state.app, Math.floor(i / 2) + (i % 2) * 0.5);
  state.gauge.rows.push(r);
  renderTables();
  updateResult();
}

function measureLength() {
  const L = Math.round((state.app.lengthCm + (Math.random() - 0.5) * 0.16) * 10) / 10;
  state.length = L;
  toast(`Length of test wire between the terminals, measured with a metre scale: ${L.toFixed(1)} cm`, 'info');
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
      if (reveal) note.push(`Actual specimen: ${mat.name}.`); else note.push('Record at least four readings to reveal the actual material.');
    }
    $('rStd').textContent = reveal ? `${mat.rho.toExponential(2)} Ω·m` : 'hidden';
    $('rErr').textContent = reveal ? `${(((rho - mat.rho) / mat.rho) * 100).toFixed(2)} %` : '—';
    const both = new Set(state.readings.map((r) => r.gap)).size === 2;
    if (!both) note.push('Tip: interchange R and X and take readings in both positions to cancel end resistances.');
  } else {
    $('rRho').textContent = $('rStd').textContent = $('rErr').textContent = '—';
    if (!X) note.push('Record balance points to find X.');
    if (!d) note.push('Measure the diameter with the screw gauge.');
    if (!L) note.push('Measure the length of the wire.');
  }
  $('rNote').textContent = note.join(' ');
  updateSteps();
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
  const payload = {
    rows,
    metricInputs: { d: d ? d.toFixed(3) : '', L: state.length ? state.length.toFixed(1) : '' },
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem('experimentObservations:phy121', JSON.stringify(payload));
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

// Guided procedure checklist
const STEPS = [
  ['Insert the key K to close the cell circuit', () => state.keyIn || state.readings.length > 0],
  ['Take a plug out of the resistance box (choose R)', () => currentR() > 0 || state.readings.length > 0],
  ['With HR in, tap the jockey near both ends — deflections should be opposite', () => state.hrUsed || state.readings.length > 0],
  ['Remove HR and find the exact null point', () => (state.probe && !state.probe.protect && Math.abs(state.probe.div) < 0.5) || state.readings.length > 0],
  ['Record three balance points with different R', () => state.readings.filter((r) => r.gap === 2).length >= 3],
  ['Interchange R and X and record again', () => state.readings.some((r) => r.gap === 1)],
  ['Measure diameter (zero error + readings) and length', () => meanD() && state.length],
  ['Compute ρ and compare with the standard value', () => meanX() && meanD() && state.length],
];
function updateSteps() {
  const ol = $('steps');
  if (!ol.children.length) STEPS.forEach(([t]) => { const li = document.createElement('li'); li.textContent = t; ol.appendChild(li); });
  let currentSet = false;
  STEPS.forEach(([, done], i) => {
    const li = ol.children[i];
    const ok = !!done();
    li.classList.toggle('done', ok);
    li.classList.toggle('current', !ok && !currentSet);
    if (!ok) currentSet = true;
  });
}

// ---------------------------------------------------------------------------
// Camera views
// ---------------------------------------------------------------------------

const VIEWS = {
  bench: { pos: () => benchPose().pos, target: () => benchPose().target },
  scale: { pos: () => [S.lToX(state.l), 18, S.WIRE_Z + 30], target: () => [S.lToX(state.l), 0, S.WIRE_Z + 2] },
  galv: { pos: [0, 30, -8], target: [0, S.TABLE_Y + 6, -27] },
  box: { pos: [0, 34, 4], target: [0, S.TABLE_Y + 4, -27] },
  top: { pos: [0, 150, 8], target: [0, 0, 0] },
};
let fly = null;
function flyTo(name) {
  const v = VIEWS[name];
  const val = (x) => (typeof x === 'function' ? x() : x);
  let target = new THREE.Vector3(...val(v.target));
  let pos = new THREE.Vector3(...val(v.pos));
  if (name === 'box') {
    const bx = H.box.group.position.x;
    target.x = bx; pos.x = bx;
  }
  fly = { t0: performance.now(), dur: 900, p0: camera.position.clone(), t0v: controls.target.clone(), p1: pos, t1: target };
}
function updateFly() {
  if (!fly) return;
  const k = Math.min(1, (performance.now() - fly.t0) / fly.dur);
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  camera.position.lerpVectors(fly.p0, fly.p1, e);
  controls.target.lerpVectors(fly.t0v, fly.t1, e);
  if (k >= 1) fly = null;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const labelsEl = $('labels');
const LABELS = [
  ['Resistance box (R)', () => H.box.group.position.clone().add(new THREE.Vector3(0, 11, 0))],
  ['Test wire (X)', () => new THREE.Vector3(state.swapped ? -27 : 27, S.TABLE_Y + 6, -21)],
  ['Galvanometer', () => new THREE.Vector3(0, S.TABLE_Y + 11, -27)],
  ['Accumulator (E)', () => new THREE.Vector3(-38, S.TABLE_Y + 15, 30)],
  ['Plug key K', () => new THREE.Vector3(-14, S.TABLE_Y + 7, 29)],
  ['Jockey', () => new THREE.Vector3(S.lToX(state.l), S.WIRE_Y + state.lift + 11.5, S.WIRE_Z)],
  ['Bridge wire, 100 cm', () => new THREE.Vector3(-30, S.WIRE_Y + 1.5, S.WIRE_Z)],
];
const labelEls = LABELS.map(([t]) => {
  const d = document.createElement('div');
  d.className = 'tag'; d.textContent = t;
  labelsEl.appendChild(d);
  return d;
});
const projV = new THREE.Vector3();
function updateLabels(w, h) {
  if (!state.labels) return;
  LABELS.forEach(([, f], i) => {
    projV.copy(f()).project(camera);
    const el = labelEls[i];
    const vis = projV.z < 1 && Math.abs(projV.x) < 1.05 && Math.abs(projV.y) < 1.05;
    el.style.display = vis ? '' : 'none';
    if (vis) el.style.transform = `translate(${((projV.x + 1) / 2) * w}px, ${((1 - projV.y) / 2) * h}px) translate(-50%, -100%)`;
  });
}
labelEls.forEach((el) => { el.style.left = '0'; el.style.top = '0'; });

// ---------------------------------------------------------------------------
// Close-up insets
// ---------------------------------------------------------------------------

const loupeCam = new THREE.PerspectiveCamera(26, 250 / 150, 0.5, 200);
const galvCam = new THREE.PerspectiveCamera(30, 250 / 150, 0.5, 200);
galvCam.position.set(0, S.TABLE_Y + 6.5 + 17, -27 + 9);
galvCam.lookAt(0, S.TABLE_Y + 6.5, -27 - 0.4);

function renderPip(el, cam) {
  const sr = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const x = r.left - sr.left + 2, w = r.width - 4, h = r.height - 4;
  const y = sr.height - (r.top - sr.top) - r.height + 2;
  cam.aspect = w / h;
  cam.updateProjectionMatrix();
  renderer.setViewport(x, y, w, h);
  renderer.setScissor(x, y, w, h);
  renderer.render(scene, cam);
}

// ---------------------------------------------------------------------------
// Frame loop
// ---------------------------------------------------------------------------

// Pull the default bench view back on narrow (portrait) screens so the whole
// bridge fits, until the student moves the camera themselves.
let userMovedCamera = false;
controls.addEventListener('start', () => { userMovedCamera = true; fly = null; });
function benchPose() {
  const k = THREE.MathUtils.clamp(1.6 / camera.aspect, 1, 2.8);
  // Look down more steeply as we pull back so the table, not the backdrop, fills the frame
  return { pos: [0, 72 * k + 14 * (k - 1), 96 * k - 18 * (k - 1)], target: [0, -2, -2 + 4 * (k - 1)] };
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (!userMovedCamera && !fly) {
    const b = benchPose();
    camera.position.set(...b.pos);
    controls.target.set(...b.target);
  }
}

const clock = new THREE.Clock();
let uiTimer = 0;
let prevContact = false;
let settleTime = 0;

function tweenPlug(p, dt) {
  const u = p.userData;
  u.t = THREE.MathUtils.damp(u.t, u.inserted ? 1 : 0, 10, dt);
  const lift = Math.sin(Math.PI * (1 - Math.abs(u.t * 2 - 1))) * 2.2;
  p.position.lerpVectors(u.out, u.home, u.t);
  p.position.y += lift;
  p.rotation.x = -(1 - u.t) * (Math.PI / 2);
}

// Physics runs in fixed sub-steps on the real clock, so the experiment keeps
// real time even when rendering is slow.
function simulate(dt) {
  const app = state.app;

  // Mechanics of plugs, key and jockey
  H.box.plugs.forEach((p) => tweenPlug(p, dt));
  tweenPlug(H.key.plug, dt);
  const pressing = state.holdSources.size > 0;
  state.lift = THREE.MathUtils.damp(state.lift, pressing ? 0 : 1.2, pressing ? 22 : 12, dt);
  if (state.lift < 0.04 && pressing) state.lift = 0;
  const jx = S.lToX(state.l);
  H.jockey.group.position.x = jx;
  H.jockey.jockey.position.set(0, S.WIRE_Y + state.lift, S.WIRE_Z);
  H.jockey.jockey.rotation.z = -0.08;

  // Electrical solution. Contact only closes the galvanometer branch.
  const X = P.wireResistance(app, state.T);
  const keyIn = state.keyIn && H.key.plug.userData.t > 0.92;
  state.sol = P.solveBridge(app, { R: currentR(), X, l: state.l, keyIn, pressed: contact(), protect: state.protect, swapped: state.swapped });
  state.T = P.stepTemperature(app, state.T, state.sol.P_X, dt);
  state.keyOnFor = keyIn ? state.keyOnFor + dt : 0;
  if (state.keyOnFor > 25 && Math.floor(state.keyOnFor) % 20 === 5 && Math.floor(state.keyOnFor - dt) % 20 === 4) {
    toast(`The key has been in for ${Math.round(state.keyOnFor)} s. The test wire is at ${state.T.toFixed(1)} °C — remove the key between readings.`, 'warn');
  }

  // Galvanometer pointer with a touch of mechanical jitter when in contact
  let target = P.deflection(state.sol.Ig);
  if (contact() && keyIn) target += (Math.random() - 0.5) * 0.08;
  state.needle = P.stepNeedle(state.needle, target, dt);
  const ang = -(state.needle.theta / P.GALV.maxDiv) * THREE.MathUtils.degToRad(48);
  H.galv.pivot.rotation.y = ang;
  H.galv.knob.rotation.y = state.protect ? 0.8 : -0.8;

  // Track a settled reading while the jockey is pressed
  const c = contact() && keyIn;
  if (c) {
    settleTime = prevContact ? settleTime + dt : 0;
    if (settleTime > 0.6 && (Math.abs(state.needle.omega) < 3 || Math.abs(state.needle.theta) > P.GALV.maxDiv)) {
      state.probe = { l: state.l, div: state.needle.theta, protect: state.protect };
      if (state.protect) state.hrUsed = true;
    }
  }
  if (c && !prevContact) H.jockey.spark.material.opacity = Math.min(1, 0.25 + Math.abs(state.sol.Ig) * 2000);
  prevContact = c;
  H.jockey.spark.position.set(jx, S.WIRE_Y, S.WIRE_Z);
  H.jockey.spark.material.opacity *= Math.exp(-dt * 9);
  H.jockey.spark.scale.setScalar(0.6 + H.jockey.spark.material.opacity);

  // Test wire warms visibly only if badly overheated
  const hot = THREE.MathUtils.clamp((state.T - 45) / 80, 0, 1);
  if (H.coilMesh) H.coilMesh.material.emissive.setRGB(hot * 0.8, hot * 0.15, 0);
  state.keyLive = keyIn;
}

function advance(seconds) {
  let t = seconds;
  while (t > 1e-9) { const h = Math.min(t, 1 / 60); simulate(h); t -= h; }
}

function frame() {
  const dt = Math.min(clock.getDelta(), 0.5);
  advance(dt);
  const jx = S.lToX(state.l);
  updateDynamicCurves();
  updateFlow(dt);
  updateFly();
  controls.update();

  // Loupe follows the jockey
  loupeCam.position.set(jx, 13, S.WIRE_Z + 13.5);
  loupeCam.lookAt(jx, 0.7, S.WIRE_Z + 1.3);

  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, w, h);
  renderer.render(scene, camera);
  if (state.pip && w > 360) {
    renderer.setScissorTest(true);
    renderPip($('pipLoupe'), loupeCam);
    renderPip($('pipGalv'), galvCam);
    renderer.setScissorTest(false);
  }
  updateLabels(w, h);

  uiTimer += dt;
  if (uiTimer > 0.08) { uiTimer = 0; updateUi(state.keyLive); }
  requestAnimationFrame(frame);
}

function updateUi(keyIn) {
  const s = state.sol;
  const div = state.needle.theta;
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

  const chip = (id, text, cls) => { const el = $(id); el.textContent = text; el.className = `chip ${cls || ''}`; };
  chip('chipKey', `Key K: ${state.keyIn ? 'in' : 'out'}`, state.keyIn ? (state.T > P.T_ROOM + 8 ? 'hot' : 'ok') : '');
  chip('chipHR', `HR: ${state.protect ? 'in (protected)' : 'out (sensitive)'}`, state.protect ? '' : 'hot');
  chip('chipJockey', `Jockey: ${contact() ? 'pressed' : 'lifted'} @ ${state.l.toFixed(1)} cm`, contact() ? 'ok' : '');
  chip('chipGap', `R in gap ${state.swapped ? 2 : 1} · X in gap ${state.swapped ? 1 : 2}`);

  // Schematic
  const xj = 20 + state.l * 1.8;
  $('schJockey').setAttribute('cx', xj);
  $('schLead').setAttribute('x2', xj);
  const na = THREE.MathUtils.clamp(div / P.GALV.maxDiv, -1.1, 1.1) * 0.9;
  $('schNeedle').setAttribute('x2', 110 + Math.sin(na) * 11);
  $('schNeedle').setAttribute('y2', 74 - Math.cos(na) * 11);
  $('schLeftLabel').textContent = state.swapped ? 'X' : `R = ${fmt(currentR(), 1)} Ω`;
  $('schRightLabel').textContent = state.swapped ? `R = ${fmt(currentR(), 1)} Ω` : 'X';
  $('schL').textContent = `l = ${state.l.toFixed(1)}`;
  $('schM').textContent = `${(100 - state.l).toFixed(1)}`;
  $('schM').setAttribute('x', Math.min(185, xj + 8));
  $('schL').setAttribute('x', Math.max(22, xj / 2 - 10));
  updateSteps();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

new ResizeObserver(resize).observe(stage);
resize();
newSpecimen();
syncPlugs();
updateSteps();
frame();
setTimeout(() => toast('Welcome! Insert key K, take out a plug to set R, then tap the jockey along the wire until the galvanometer shows no deflection.', 'info', 7000), 600);

// Exposed for automated checks and curious students
window.meterBridge = { state, P, advance, updateUi: () => updateUi(state.keyLive), setL, setR, toggleKey, toggleHR, toggleSwap, recordReading, flyTo };
