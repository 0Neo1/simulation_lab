// Shared 3D lab engine. Every experiment page (physics and chemistry) is an
// experiment "spec" run by this engine, which provides what the meter bridge
// lab pioneered: the lab room, the student avatar with safety gear, the three
// ways of working (watch the student, be the student, no human), carrying and
// placing apparatus, optional wiring with leads, guided phases with
// demonstrations, close-up insets, the observation table and the hand-off to
// the Observation tab.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import * as P from '../meter-bridge/physics.js';
import * as S from '../meter-bridge/scene.js';
import { buildRoom, ROOM, TROLLEY, FLOOR_Y } from '../meter-bridge/room.js';
import { loadAvatar } from '../meter-bridge/avatar.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const $ = (id) => document.getElementById(id);
const TABLE_Y = S.TABLE_Y;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;
const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const GEAR = ['coat', 'goggles', 'gloves', 'shoes'];
const GEAR_NAMES = { coat: 'lab coat', goggles: 'safety goggles', gloves: 'nitrile gloves', shoes: 'safety shoes' };
const PPE_SPOT = { x: 470, z: 90, h: -Math.PI / 2 };

// ---------------------------------------------------------------------------
// Page markup (the same layout and classes as the meter bridge lab)
// ---------------------------------------------------------------------------

function buildDom(spec) {
  const pips = (spec.pips || []).map((p, i) => `<div class="pip" id="pip_${p.id}" style="right:${12 + i * 262}px"><div class="pipbar"><span>${esc(p.title)}</span><button class="pipmin" title="Minimise">–</button></div></div>`).join('');
  const views = { room: 'Room', setup: 'Bench + trolley', bench: 'Bench', ...Object.fromEntries(Object.entries(spec.views || {}).map(([k, v]) => [k, v.label || k])), top: 'Top' };
  const sections = (spec.panel || []).map((s, i) => `<details ${s.open === false ? '' : 'open'} data-sec="${i}"><summary>${esc(s.title)}</summary>${s.html || ''}</details>`).join('');
  const cols = (spec.table?.columns || []);
  document.body.innerHTML = `
<div id="app">
  <section id="stage">
    <canvas id="gl"></canvas>
    <div class="overlay top-left">
      <h1>${esc(spec.lab || 'Physics Lab')} <span>· ${esc(spec.title)}</span></h1>
      <div class="chips" id="chips"><span class="chip" id="chipPhase">Setting up</span></div>
    </div>
    <div id="stepBanner" class="overlay banner"><b id="bannerPhase"></b><span id="bannerText"></span></div>
    ${spec.overlay ? `<div class="overlay top-right labdiagram" id="diagram">${spec.overlay}</div>` : ''}
    ${pips}
    <div id="gogglesOverlay" aria-hidden="true"></div>
    <div id="labels"></div>
    <div id="tip" class="tip hidden"></div>
    <div id="toasts" aria-live="polite"></div>
    <div class="overlay hint" id="hint"></div>
    <div id="startScreen" class="modal">
      <div class="card">
        <h2>Welcome to the ${esc(spec.lab || 'Physics Lab')}</h2>
        <p class="lead">${spec.intro || esc(spec.title)} The apparatus is waiting on the trolley beside your bench.
          Choose how you want to work — you can switch at any time from the panel.</p>
        <div class="choices three">
          <button class="choice" id="startAuto"><b>Watch the student</b>
            <span>A student walks in, puts on lab coat, goggles, gloves and safety shoes, then sets up the bench and performs every step by themselves. Drag to move the camera around them.</span></button>
          <button class="choice mid" id="startFP"><b>Be the student</b>
            <span>First-person view through the student's eyes, with your hands in view like a game. Walk with W A S D, look by dragging, and do everything yourself — starting with your safety gear.</span></button>
          <button class="choice alt" id="startClassic"><b>No human</b>
            <span>No body or hands. The bench is ready — click and drag the apparatus and use the panel, like a classic simulator.</span></button>
        </div>
        <label class="check startready"><input type="checkbox" id="startReady" /> Bench already set up (skip setting up the apparatus — safety gear is still required)</label>
        <div class="mouse">
          <div><b>Watch</b> — drag to orbit the camera · scroll to zoom</div>
          <div><b>Be the student</b> — W A S D walk · Q/E turn · drag to look</div>
          <div><b>Click</b> things to use them · <b>drag</b> apparatus to carry it</div>
          <div><b>Panel</b> buttons perform actions with the student's hands</div>
        </div>
        <p class="note" id="loadNote">Loading the lab…</p>
      </div>
    </div>
  </section>
  <aside id="panel">
    <details open><summary>Guide</summary>
      <div class="guide">
        <div class="phase" id="guidePhase"></div>
        <div class="progress"><i id="guideBar"></i></div>
        <p class="instr" id="guideText"></p>
        <p class="why" id="guideWhy"></p>
        <div class="row autobar">
          <button class="btn" id="autoPause">⏸ Pause</button>
          <select id="autoSpeed" title="Speed"><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>
          <button class="btn ghost" id="autoRestart">↻ Restart</button>
        </div>
        <div class="row"><button class="btn" id="btnDemo">▶ Show me</button><button class="btn ghost" id="btnDoPhase">Do this phase for me</button></div>
        <ol id="steps" class="steps"></ol>
      </div>
    </details>
    <details open><summary>Bench</summary>
      <label class="lbl">Who performs the experiment
        <select id="mode"><option value="auto">Watch the student (automatic)</option><option value="fp">Be the student (first person)</option><option value="classic">No human (classic controls)</option></select>
      </label>
      ${spec.wiring ? '<div class="row"><button class="btn ghost" id="btnUndoLead">Undo last lead</button><button class="btn ghost" id="btnClearLeads">Remove all leads</button></div>' : ''}
      <div class="row small"><label class="check inline"><input type="checkbox" id="optHands" checked /> Show the student</label></div>
    </details>
    ${sections}
    ${spec.table ? `<details open><summary>Observations</summary>
      ${spec.record ? `<button class="btn wide act" id="btnRecord">${esc(spec.table.recordLabel || 'Record reading')}</button>` : ''}
      <div class="tablewrap"><table id="obsTable"><thead><tr><th>#</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th></th></tr></thead><tbody></tbody></table></div>
      ${spec.table.note ? `<p class="note">${spec.table.note}</p>` : ''}
    </details>` : ''}
    <details open><summary>Result</summary>
      <div class="meters" id="resultMeters"></div>
      <p class="note" id="rNote"></p>
      <div class="row"><button class="btn" id="btnSend">Send to Observation tab</button><button class="btn ghost" id="btnCsv">Export CSV</button></div>
    </details>
    <details><summary>View</summary>
      <label class="lbl">Camera</label>
      <div class="row small">${Object.entries(views).map(([k, l]) => `<button class="mini" data-view="${k}">${esc(l)}</button>`).join('')}</div>
      ${spec.flowOption ? `<label class="check"><input type="checkbox" id="optFlow" checked /> ${esc(spec.flowOption)}</label>` : ''}
      <label class="check"><input type="checkbox" id="optLabels" checked /> Show labels</label>
      ${spec.pips?.length ? '<label class="check"><input type="checkbox" id="optPip" checked /> Show close-up insets</label>' : ''}
      <label class="check"><input type="checkbox" id="optSound" checked /> Sound effects</label>
      <label class="check"><input type="checkbox" id="optQuality" checked /> High-quality graphics (shadows, sharp)</label>
    </details>
  </aside>
</div>`;
  document.title = `${spec.title} — Virtual ${spec.lab || 'Lab'}`;
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

export function runLab(spec) {
  buildDom(spec);
  const stage = $('stage');
  const canvas = $('gl');
  const params = new URLSearchParams(location.search);
  let lowGfx = params.has('lowgfx');

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9d4c8);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 2500);
  camera.position.set(60, 95, 150);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(40, -8, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 8;
  controls.maxDistance = 420;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

  scene.add(new THREE.HemisphereLight(0xfff8ec, 0x6b5a48, 0.9));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(-380, 260, 40);
  sun.target.position.set(60, TABLE_Y, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 110, bottom: -110, near: 100, far: 900 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  [[0, 190, -110], [0, 190, 110], [220, 190, 0]].forEach(([x, y, z]) => {
    const l = new THREE.PointLight(0xfff6e5, 26000, 0, 2);
    l.position.set(x, y, z);
    scene.add(l);
  });
  function applyQuality(low) {
    lowGfx = low;
    renderer.setPixelRatio(low ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !low;
    sun.castShadow = !low;
    scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
    const cb = $('optQuality');
    if (cb) cb.checked = !low;
    resize();
  }

  const room = buildRoom(scene, TABLE_Y, { board: spec.board, poster: spec.poster });
  const M = S.makeMaterials();
  const ppe = S.buildPPEStation(M);
  ppe.group.position.set(ROOM.x1 - 2, FLOOR_Y, 90);
  ppe.group.rotation.y = -Math.PI / 2;
  scene.add(ppe.group);
  Object.values(ppe.items).forEach((o) => { o.userData.home = o.position.clone(); });

  const state = {
    mode: 'auto', started: false, labels: true, pip: true, sound: true, flow: true,
    holdSources: new Set(), leadColor: 'auto', sent: false, rows: [],
  };

  // ---- lab: the API handed to the experiment ----
  const lab = {
    THREE, V3, P, S, M, scene, camera, controls, renderer, state, TABLE_Y, ROOM, TROLLEY, FLOOR_Y, fmt, $,
    get hands() { return hands; }, get avatar() { return avatar; }, get mode() { return state.mode; },
    get autopilot() { return autopilot; }, get started() { return state.started; },
    x: {}, // the experiment's own state
  };

  // ---------------------------------------------------------------------------
  // Apparatus items: built by the spec, carried from the trolley to the bench
  // ---------------------------------------------------------------------------

  const ITEMS = {};
  lab.items = ITEMS;
  const itemKeys = Object.keys(spec.items || {});
  // Default places on the trolley: a grid on its top
  const autoHome = (i, n) => {
    const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(n * 1.6))));
    const rows = Math.ceil(n / cols);
    const c = i % cols, r = Math.floor(i / cols);
    return [TROLLEY.x - TROLLEY.w / 2 + (TROLLEY.w / cols) * (c + 0.5), TROLLEY.z - TROLLEY.d / 2 + (TROLLEY.d / rows) * (r + 0.5), 0];
  };
  const movable = itemKeys.filter((k) => !spec.items[k].fixed);
  function tagItem(it) {
    it.group.traverse((o) => { if (o.userData.item == null && !o.userData.term) o.userData.item = it.key; });
  }
  for (const key of itemKeys) {
    const def = spec.items[key];
    const it = { key, ...def };
    const built = def.build(lab);
    // builders return either { group, size, grip, … } or { …, app: { group, size, grip } }
    if (built.app && built.app.grip) {
      // keep the builder's extra properties (top, holes, clampAt, …) reachable from it.app
      for (const [k, v] of Object.entries(built)) if (k !== 'app' && !(k in built.app)) built.app[k] = v;
      built.app.api = built;
      it.app = built.app;
    } else it.app = built;
    it.group = it.app.group;
    it.pose = def.pose || it.app.pose || built.pose;
    it.home = def.home || autoHome(movable.indexOf(key), movable.length);
    it.slotY = def.slotY ?? TABLE_Y;
    it.homeY = def.homeY ?? TABLE_Y;
    scene.add(it.group);
    if (!it.fixed) tagItem(it);
    ITEMS[key] = it;
  }
  // Items may rest in a turned pose (a pipette lying on its side): restRot [x, y, z], lifted by restLift
  // (homeRot, if given, is used on the trolley only: a hanging balance lies down there)
  const restEuler = (it, rot = 0, home = false) => { const r = (home && it.homeRot) || it.restRot || [0, 0, 0]; return new THREE.Euler(r[0], rot + r[1], r[2]); };
  const itemAt = (it, spot, y, home = false) => {
    it.group.position.set(spot[0], y + (home && it.homeRot ? 0 : it.restLift || 0), spot[1]);
    it.group.rotation.copy(restEuler(it, spot[2] || 0, home));
  };
  function sendHome(key) {
    const it = ITEMS[key];
    if (it.fixed) { placeAtSlot(key); return; }
    it.placed = false;
    itemAt(it, it.home, it.homeY, true);
    if (it.onHome) it.onHome(lab);
  }
  function placeAtSlot(key) {
    const it = ITEMS[key];
    itemAt(it, it.slot, it.slotY);
    it.placed = true;
    if (it.onPlace) it.onPlace(lab);
  }
  // Put an item somewhere on the bench (not its slot), e.g. after an action
  function setItemPos(key, x, z, rot = 0, y = TABLE_Y) {
    const it = ITEMS[key];
    it.group.position.set(x, y, z);
    it.group.rotation.set(0, rot, 0);
  }
  Object.assign(lab, { sendHome, placeAtSlot, setItemPos });

  const slotMarkers = {};
  for (const [key, it] of Object.entries(ITEMS)) {
    if (it.fixed || !it.slot) continue;
    const s = it.app.size || [10, 1, 10];
    const m = S.slotMarker(M, s[0], s[2], it.name);
    m.position.set(it.slot[0], it.slotY + 0.02, it.slot[1]);
    m.rotation.y = it.slot[2] || 0;
    m.visible = false;
    scene.add(m);
    slotMarkers[key] = m;
  }

  // ---------------------------------------------------------------------------
  // Actionable parts: things the student clicks or drags to use
  // ---------------------------------------------------------------------------

  // action: { tip: string|fn, run: async fn, drag: { start(p), move(p, start), end(), plane: 'h'|'v', hand: fn → V3 }, enabled: fn }
  function actionable(obj, action) {
    obj.userData.action = action;
    obj.traverse((o) => { o.userData.pick = obj; });
    return obj;
  }
  lab.actionable = actionable;
  const extraPickRoots = [];
  lab.addPickRoot = (o) => extraPickRoots.push(o);

  // ---------------------------------------------------------------------------
  // Wiring: terminals and leads (for circuit experiments)
  // ---------------------------------------------------------------------------

  const terminals = {};
  const leads = [];
  let leadSeq = 0, leadsVersion = 0;
  const COLORS = ['red', 'black', 'blue', 'yellow', 'green', 'white'];
  function addTerminals(prefix, owner, terms) {
    for (const [n, t] of Object.entries(terms || {})) {
      const id = `${prefix}.${n}`;
      terminals[id] = { id, owner, local: t.local, label: t.label, screw: t.screw };
      if (t.screw) t.screw.traverse((o) => { o.userData.term = id; });
    }
  }
  for (const [key, it] of Object.entries(ITEMS)) if (it.app.terminals) addTerminals(key, it.group, it.app.terminals);
  const termWorld = (id) => {
    const t = terminals[id];
    t.owner.updateMatrixWorld(true);
    return t.owner.localToWorld(t.local.clone());
  };
  function pickColor(a) {
    if (state.leadColor !== 'auto') return state.leadColor;
    if (spec.leadColor) { const c = spec.leadColor(a, lab); if (c) return c; }
    return COLORS[leads.length % COLORS.length];
  }
  const inRect = (p, r, m = 0) => p.x > r.x0 - m && p.x < r.x1 + m && p.z > r.z0 - m && p.z < r.z1 + m;
  function leadObstacles() {
    const list = [];
    const box = new THREE.Box3();
    for (const it of Object.values(ITEMS)) {
      if (!it.group.visible || carried.has(it.key)) continue;
      box.setFromObject(it.group);
      if (box.max.y - TABLE_Y > 40) continue; // tall stands: leads pass under their arms
      list.push({ x0: box.min.x, x1: box.max.x, z0: box.min.z, z1: box.max.z, top: box.max.y + 0.3 });
    }
    return list;
  }
  function routedLeadCurve(a, b, slack = 1) {
    const floor = TABLE_Y + 0.25;
    const obstacles = leadObstacles();
    const up = (p, h) => p.clone().add(V3(0, h, 0));
    const base = S.leadCurve(a, b, { slack });
    const pts = [a.clone(), up(a, 1.3), ...base.points.slice(2, -2), up(b, 1.3), b.clone()];
    const raw = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const N = 40, out = [];
    for (let i = 0; i <= N; i++) {
      const p = raw.getPoint(i / N);
      if (i > 1 && i < N - 1) {
        const dA = Math.hypot(p.x - a.x, p.z - a.z), dB = Math.hypot(p.x - b.x, p.z - b.z);
        let h = floor;
        for (const o of obstacles) {
          if (!inRect(p, o, 0.6)) continue;
          if ((inRect(a, o, 1) && dA < 4) || (inRect(b, o, 1) && dB < 4)) continue;
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
  const spinning = [];
  function spinScrew(id) {
    const t = terminals[id];
    if (t && t.screw && t.screw.userData.cap) spinning.push({ cap: t.screw.userData.cap, left: 0.45 });
  }
  function connect(a, b, color, quiet = false) {
    if (a === b) return null;
    if (leads.some((L) => (L.a === a && L.b === b) || (L.a === b && L.b === a))) { if (!quiet) toast('Those two terminals are already connected.', 'info'); return null; }
    const busy = (t) => leads.filter((L) => L.a === t || L.b === t).length;
    if (busy(a) >= 3 || busy(b) >= 3) { toast('A binding screw can hold at most three leads.', 'warn'); return null; }
    const L = { id: ++leadSeq, a, b, color: color || pickColor(a), slack: 0.8 + Math.random() * 0.5 };
    rebuildLeadMesh(L);
    leads.push(L);
    leadsVersion++;
    spinScrew(a); spinScrew(b);
    if (!quiet) {
      sfx('tick');
      const fault = spec.checkFault ? spec.checkFault(lab, L) : null;
      if (fault) { toast(fault, 'err', 6500); sfx('buzz'); } else toast(`Connected: ${terminals[a]?.label || a} ↔ ${terminals[b]?.label || b}`, 'ok', 2200);
    }
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
  function updateLeads() {
    for (const L of leads) {
      const pa = termWorld(L.a), pb = termWorld(L.b);
      if (pa.distanceToSquared(L.pa) > 1e-4 || pb.distanceToSquared(L.pb) > 1e-4) rebuildLeadMesh(L);
    }
  }
  let pending = null;
  function updatePendingLead(handPoint) {
    if (!pending) return;
    if (pending.mesh) { scene.remove(pending.mesh); S.disposeGroup(pending.mesh); }
    pending.mesh = S.leadMesh(S.leadCurve(termWorld(pending.from), handPoint, { slack: 0.6 }), pending.color);
    scene.add(pending.mesh);
  }
  function startLead(from) { cancelLead(); pending = { from, color: pickColor(from), mesh: null }; spinScrew(from); sfx('tick'); }
  function cancelLead() { if (pending && pending.mesh) { scene.remove(pending.mesh); S.disposeGroup(pending.mesh); } pending = null; }
  function finishLead(to) { if (!pending) return null; const { from, color } = pending; cancelLead(); return connect(from, to, color); }
  // Which terminals are joined by leads (plus any fixed internal links)
  const topology = (extra = []) => P.netClasses([...extra, ...(spec.links || []), ...leads.map((L) => [L.a, L.b])]);
  Object.assign(lab, { terminals, leads, addTerminals, termWorld, connect, disconnect, topology, get leadsVersion() { return leadsVersion; } });

  // ---------------------------------------------------------------------------
  // Sound and toasts
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
      const sp = { tick: [2400, 0.03, 0.08, 'square'], click: [900, 0.05, 0.12, 'triangle'], thud: [140, 0.09, 0.25, 'sine'], buzz: [110, 0.35, 0.12, 'sawtooth'], ok: [880, 0.12, 0.08, 'sine'], drip: [1500, 0.06, 0.06, 'sine'], glass: [2900, 0.08, 0.05, 'sine'] }[kind] || [600, 0.05, 0.1, 'sine'];
      o.type = sp[3]; o.frequency.setValueAtTime(sp[0], t);
      if (kind === 'ok') o.frequency.setValueAtTime(1320, t + 0.06);
      if (kind === 'drip') o.frequency.exponentialRampToValueAtTime(700, t + 0.05);
      g.gain.setValueAtTime(sp[2], t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + sp[1]);
      o.connect(g); o.start(t); o.stop(t + sp[1] + 0.02);
    } catch (e) { /* audio unavailable */ }
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
  Object.assign(lab, { sfx, toast });

  // ---------------------------------------------------------------------------
  // Student body: walking, collisions, reach
  // ---------------------------------------------------------------------------

  let hands = null, handsLoaded = null, avatar = null;
  const SHOULDER = { right: V3(40, 45, 120), left: V3(-40, 45, 120) };
  const LEFT_REST = V3(-60, TABLE_Y + 1.2, 34);
  const bodyMode = () => state.mode === 'auto' || state.mode === 'fp';
  function aimHand(hand, target, pitch = -0.2) {
    const d = target.clone().sub(SHOULDER[hand.side]);
    const base = bodyMode() && avatar ? avatar.state.heading : 0;
    const yaw = Math.atan2(-d.x, -d.z);
    hand.yawGoal = base + THREE.MathUtils.clamp(wrapAngle(yaw - base), -1.1, 1.1);
    hand.pitchGoal = pitch;
  }
  const keys = new Set();
  const walking = { active: false, speed: 0, keys: false };
  const OBSTACLES = [
    [-120, 120, -45, 45],
    [TROLLEY.x - TROLLEY.w / 2 - 6, TROLLEY.x + TROLLEY.w / 2 + 8, TROLLEY.z - TROLLEY.d / 2, TROLLEY.z + TROLLEY.d / 2],
    [-330, -250, -170, 30], [-330, -250, 70, 270], [230, 430, 210, 290],
    [ROOM.x1 - 47, ROOM.x1, -205, -15],
    [-167, -133, 43, 77],
    [ROOM.x1 - 50, ROOM.x1, 20, 160],
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
  async function approach(p) {
    if (!bodyMode() || !avatar || reachable(p)) return;
    await walkTo(standSpot(p));
  }
  function bodyHands() {
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
  }
  Object.assign(lab, { walkTo, approach, reachable });

  // ---- Safety gear ----
  const gearOn = (g) => !!(avatar && avatar.gear[g]);
  const allGear = () => state.mode === 'classic' || GEAR.every(gearOn);
  function wearGear(g, on = true) {
    if (!avatar) return;
    avatar.setGear(g, on);
    ppe.items[g].visible = !on;
    $('gogglesOverlay').classList.toggle('on', state.mode === 'fp' && gearOn('goggles'));
    if (on) { sfx('ok'); toast(`${GEAR_NAMES[g][0].toUpperCase() + GEAR_NAMES[g].slice(1)} on.${allGear() ? ' All safety gear is on — you may start the experiment.' : ''}`, 'ok', 2600); }
  }
  function resetGear() { GEAR.forEach((g) => wearGear(g, false)); }
  async function demoGear(g) {
    if (!avatar || !hands || gearOn(g)) { if (avatar) wearGear(g); return; }
    const R = hands.right;
    const grab = ppe.group.localToWorld(ppe.grab[g].clone());
    await approach(grab);
    await handTo(R, grab, { pose: 'grab', contact: 'palm', dur: 0.8, arc: 6, pitch: g === 'shoes' ? -1.2 : -0.2 });
    const itemObj = ppe.items[g];
    const startW = itemObj.getWorldPosition(new THREE.Vector3());
    const wornAt = { coat: avatar.bodyPoint(0, 140, -14), goggles: avatar.eyeWorld(), gloves: avatar.bodyPoint(0, 105, -30), shoes: avatar.bodyPoint(0, 8, -10) }[g];
    const parent = itemObj.parent;
    scene.attach(itemObj);
    await tween(0.9, (e) => {
      itemObj.position.lerpVectors(startW, wornAt, e);
      R.goal.lerpVectors(grab, wornAt, e);
      if (g === 'coat') itemObj.scale.setScalar(1 + e * 0.1);
    });
    if (g === 'gloves') {
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

  // ---- First person ----
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
  function fpHands() {
    if (!hands || !avatar) return;
    const eye = avatar.eyeWorld();
    const y = fp.yaw;
    const fw = V3(-Math.sin(y), 0, -Math.cos(y)), rt = V3(Math.cos(y), 0, -Math.sin(y));
    const bob = Math.sin(avatar.state.phase * 2) * 1.4 * Math.min(1, avatar.state.speed / 120);
    for (const hand of [hands.right, hands.left]) {
      const sgn = hand.side === 'right' ? 1 : -1;
      hand.speed = 35;
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
  function followCamera(dt = 0.016) {
    if (state.mode !== 'auto' || !avatar || fly) return;
    const chest = avatar.bodyPoint(0, 118, -10);
    const d = chest.sub(controls.target).multiplyScalar(Math.min(1, dt * 3));
    controls.target.add(d);
    camera.position.add(d);
  }

  // ---------------------------------------------------------------------------
  // Tweens, autopilot, hand motions
  // ---------------------------------------------------------------------------

  const vclock = { now: 0, scale: 1, paused: false };
  const tweens = new Set();
  function tween(dur, fn) {
    if (!Number.isFinite(dur)) { console.error('lab: motion with an invalid duration (a target position is not a number)'); dur = 0.3; }
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
  // Wait (in simulation time) until cond() holds, or give up after maxS seconds
  async function waitFor(cond, maxS = 30) {
    const t0 = vclock.now;
    while (!cond() && vclock.now - t0 < maxS * 1000) { await wait(0.1); checkAbort(); }
  }

  let autopilot = 0;
  let demoAbort = false;
  async function withAutopilot(fn) {
    if (autopilot) return;
    autopilot++;
    demoAbort = false;
    document.body.classList.add('demo');
    setDemoButtons(true);
    try { await fn(); } catch (e) { if (e !== 'abort') { console.error(e); toast(`Something went wrong: ${e.message || e}`, 'err'); } } finally {
      autopilot--;
      document.body.classList.remove('demo');
      setDemoButtons(false);
      state.holdSources.delete('auto');
      for (const key of [...carried.keys()]) { carried.delete(key); if (!ITEMS[key].placed) dropCarried(key); }
      if (hands) {
        hands.right.setPose('relaxed', 'index');
        hands.left.setPose('flat', 'palm');
        if (!bodyMode()) hands.right.goal.set(72, TABLE_Y + 6, 42);
        hover = null;
      }
      if (spec.afterDemo) spec.afterDemo(lab);
    }
  }
  function checkAbort() { if (demoAbort) throw 'abort'; }
  // A panel button: performed by the student's hands when there are any
  const act = (fn) => { if (autopilot) return; if (!allGear()) { toast('Safety first: put on your lab coat, goggles, gloves and safety shoes at the PPE station by the door.', 'warn', 4000); return; } withAutopilot(fn); };

  // Stand-in "hands" for the no-human mode: objects move by themselves
  const ghost = {
    right: { side: 'right', goal: V3(72, TABLE_Y + 6, 42), setPose() {}, speed: 14 },
    left: { side: 'left', goal: V3(-60, TABLE_Y + 6, 42), setPose() {}, speed: 14 },
  };
  ghost.right.pos = ghost.right.goal; ghost.left.pos = ghost.left.goal;
  const handR = () => hands ? hands.right : ghost.right;
  const handL = () => hands ? hands.left : ghost.left;

  async function handTo(hand, to, { pose, contact: contactPt = 'index', dur = 0.7, arc = 8, pitch } = {}) {
    checkAbort();
    const from = hand.goal.clone();
    if (pose) hand.setPose(pose, contactPt);
    hand.speed = 40;
    if (hands) aimHand(hand, to, pitch ?? (pose === 'grab' ? 0 : pose === 'press' ? -0.55 : -0.3));
    if (!hands) dur = Math.min(dur, 0.5);
    await tween(dur, (e) => {
      hand.goal.lerpVectors(from, to, e);
      hand.goal.y += Math.sin(Math.PI * e) * arc;
    });
    hand.speed = 14;
  }

  // Carrying: the item follows the hand; its grip point stays in the palm
  // even while the item is turned (tilted to pour, for instance)
  const carried = new Map();
  function attach(key, hand) {
    const it = ITEMS[key];
    const gw = it.group.localToWorld(it.app.grip.clone());
    if (hand.pos && hands) hand.pos.copy(gw);
    if (!hands) hand.goal.copy(gw);
    carried.set(key, { hand });
    it.pickedFrom = { pos: it.group.position.clone(), euler: it.group.rotation.clone(), placed: it.placed };
    it.placed = false;
    sfx('click');
  }
  const gripOffset = (it) => it.app.grip.clone().multiply(it.group.scale).applyQuaternion(it.group.quaternion);
  function updateCarried() {
    for (const [key, c] of carried) {
      const it = ITEMS[key];
      it.group.position.copy(hands && c.hand.pos ? c.hand.pos : c.hand.goal).sub(gripOffset(it));
    }
  }
  const gripWorld = (key) => { const it = ITEMS[key]; it.group.updateMatrixWorld(true); return it.group.localToWorld(it.app.grip.clone()); };
  // Pick an item up with the right hand (or the left)
  async function pickUp(key, { hand = handR(), dur = 0.8 } = {}) {
    const it = ITEMS[key];
    await approach(gripWorld(key));
    const pose = it.pose || 'grab';
    await handTo(hand, gripWorld(key), { pose: pose === 'pinch' ? 'pinch' : 'point', contact: pose === 'pinch' ? 'pinch' : 'palm', dur, arc: 10 });
    hand.setPose(pose, pose === 'pinch' ? 'pinch' : 'palm');
    await wait(0.2);
    attach(key, hand);
  }
  // Carry a held item so that its base lands at world point `dest` (turned to rot)
  async function carryTo(key, dest, { rot, dur = 1.0, arc = 14, hand } = {}) {
    const it = ITEMS[key];
    const c = carried.get(key);
    const h = hand || (c ? c.hand : handR());
    const r0 = it.group.rotation.y, r1 = rot ?? r0;
    const gripAt = (r) => dest.clone().add(it.app.grip.clone().multiply(it.group.scale).applyAxisAngle(V3(0, 1, 0), r));
    await approach(gripAt(r1));
    tween(dur, (e) => { it.group.rotation.y = THREE.MathUtils.lerp(r0, r1, e); });
    await handTo(h, gripAt(r1).add(V3(0, 3, 0)), { pose: it.pose || 'grab', contact: it.pose === 'pinch' ? 'pinch' : 'palm', dur, arc, pitch: 0 });
    await handTo(h, gripAt(r1), { dur: 0.3, arc: 0, pitch: 0 });
  }
  // Put a held item down at dest; `slot` marks it as placed in its slot
  // Move a held item so that it sits at pos with orientation euler (it stays in the hand)
  async function holdAt(key, pos, euler, { dur = 1.0, arc = 10 } = {}) {
    const it = ITEMS[key];
    const h = carried.get(key)?.hand || handR();
    const q = new THREE.Quaternion().setFromEuler(euler || it.group.rotation);
    const gripAt = pos.clone().add(it.app.grip.clone().multiply(it.group.scale).applyQuaternion(q));
    await approach(gripAt);
    checkAbort();
    const q0 = it.group.quaternion.clone();
    const from = h.goal.clone();
    h.speed = 40;
    if (hands) aimHand(h, gripAt, 0);
    await tween(dur, (e) => {
      it.group.quaternion.slerpQuaternions(q0, q, e);
      h.goal.lerpVectors(from, gripAt, e);
      h.goal.y += Math.sin(Math.PI * e) * arc;
    });
    h.speed = 14;
    if (!hands) h.goal.copy(gripAt);
  }
  // Put a held item down at dest (turned to rot, or to a full euler)
  async function putDown(key, dest, { rot, euler, slot = false, dur = 1.0 } = {}) {
    const it = ITEMS[key];
    const h = carried.get(key)?.hand || handR();
    const e = euler || new THREE.Euler(0, rot ?? it.group.rotation.y, 0);
    await holdAt(key, dest.clone().add(V3(0, 3, 0)), e, { dur, arc: 14 });
    await holdAt(key, dest, e, { dur: 0.3, arc: 0 });
    carried.delete(key);
    it.group.position.copy(dest);
    it.group.rotation.copy(e);
    if (slot) placeAtSlot(key);
    sfx('thud');
    h.setPose('relaxed', 'index');
    await handTo(h, h.goal.clone().add(V3(0, 10, 10)), { dur: 0.35, arc: 0 });
  }
  async function demoPlace(key) {
    const it = ITEMS[key];
    await pickUp(key);
    await putDown(key, V3(it.slot[0], it.slotY + (it.restLift || 0), it.slot[1]), { euler: restEuler(it, it.slot[2] || 0), slot: true });
  }
  // Put a held item back where it was picked up from
  async function putBack(key) {
    const it = ITEMS[key];
    const from = it.pickedFrom;
    if (!from) { await putDown(key, it.group.position.clone().setY(TABLE_Y)); return; }
    await putDown(key, from.pos.clone(), { euler: from.euler.clone() });
    it.placed = from.placed;
  }
  // Carry an item to its slot on the bench
  async function toSlot(key) {
    const it = ITEMS[key];
    if (it.placed) return;
    await pickUp(key);
    await putDown(key, V3(it.slot[0], it.slotY + (it.restLift || 0), it.slot[1]), { euler: restEuler(it, it.slot[2] || 0), slot: true });
  }
  // Reach to an object (or a world point) and do something there
  async function touch(target, fn, { pose = 'pinch', dur = 0.7, pitch = -0.4, lift = 2.2, hand } = {}) {
    const p = target.isVector3 ? target.clone() : target.getWorldPosition(new THREE.Vector3()).add(V3(0, lift, 0));
    const h = hand || handR();
    await approach(p);
    await handTo(h, p, { pose, contact: pose === 'pinch' ? 'pinch' : pose === 'grab' || pose === 'flat' ? 'palm' : 'index', dur, arc: 8, pitch });
    if (fn) await fn();
    await wait(0.3);
  }
  // Run a lead between two terminals with the hand
  async function demoConnect(a, b) {
    const R = handR();
    if (!hands) { connect(a, b); await wait(0.15); return; }
    await approach(termWorld(a));
    await handTo(R, termWorld(a).add(V3(0, 0.6, 0)), { pose: 'pinch', contact: 'pinch', dur: 0.8, arc: 10, pitch: -0.4 });
    startLead(a);
    await wait(0.2);
    await approach(termWorld(b));
    await handTo(R, termWorld(b).add(V3(0, 0.6, 0)), { pose: 'pinch', contact: 'pinch', dur: 1.0, arc: 12, pitch: -0.4 });
    finishLead(b);
    await wait(0.15);
  }
  Object.assign(lab, {
    tween, wait, waitFor, vclock, withAutopilot, act, checkAbort, handTo, handR, handL, attach, carried, gripWorld,
    pickUp, carryTo, holdAt, putDown, putBack, toSlot, demoPlace, touch, demoConnect, gearOn, allGear,
    // demonstrations only move the camera in the no-human mode (the watch camera follows the student)
    flyTo: (n) => { if (state.mode === 'classic') flyTo(n); },
    releaseCarried: (key) => carried.delete(key),
  });

  // ---------------------------------------------------------------------------
  // Pointer interaction
  // ---------------------------------------------------------------------------

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tablePlane = new THREE.Plane(V3(0, 1, 0), -TABLE_Y);
  let pointer = null, hover = null, lastMouse = null;
  function setNdc(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  const pickRoots = () => [ppe.group, ...Object.values(ITEMS).map((it) => it.group), ...extraPickRoots, ...leads.map((L) => L.mesh)];
  function classify(o) {
    for (let x = o; x; x = x.parent) {
      if (x.userData.term) return { kind: 'term', id: x.userData.term };
      if (x.userData.lead) return { kind: 'lead', lead: x.userData.lead };
      if (x.userData.pick) {
        const p = x.userData.pick;
        if (p.userData.kind === 'ppe') return { kind: 'ppe', obj: p };
        if (p.userData.action && (!p.userData.action.enabled || p.userData.action.enabled())) return { kind: 'action', obj: p, action: p.userData.action };
      }
      if (x.userData.item != null && !ITEMS[x.userData.item].fixed && !ITEMS[x.userData.item].noCarry) return { kind: 'item', key: x.userData.item };
    }
    return null;
  }
  function pick(e) {
    setNdc(e);
    const hits = raycaster.intersectObjects(pickRoots(), true);
    for (const h of hits) {
      if (!h.object.visible || h.object.userData.noPick) continue;
      if (carried.size && h.object.userData.item != null && carried.has(h.object.userData.item)) continue;
      const c = classify(h.object);
      if (c) return { ...c, point: h.point };
      return { kind: 'surface', point: h.point };
    }
    const p = V3();
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
      canvas.setPointerCapture(e.pointerId);
      pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, look: true, hit: { kind: 'look' } };
      return;
    }
    if (e.button !== 0 || !h) { if (pending && e.button === 0) cancelLead(); return; }
    if (h.kind === 'surface' || h.kind === 'lead') { if (pending) cancelLead(); return; }
    if (h.kind === 'ppe') {
      if (state.mode !== 'fp') return;
      e.preventDefault();
      const g = h.obj.userData.gear;
      if (!gearOn(g)) withAutopilot(() => demoGear(g));
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
    if (h.kind === 'action' && h.action.run && !h.action.drag) {
      // A click performs the action with the student's hands
      withAutopilot(() => h.action.run(h.point));
      return;
    }
    controls.enabled = false;
    canvas.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, t0: performance.now(), hit: h };
    state.actionHold = { point: h.point.clone(), until: performance.now() + 900, pose: h.kind === 'term' ? 'pinch' : 'press' };
    if (h.kind === 'term') {
      if (pending) { if (pending.from === h.id) cancelLead(); else finishLead(h.id); } else startLead(h.id);
    } else if (h.kind === 'action' && h.action.drag) {
      const d = h.action.drag;
      pointer.plane = d.plane === 'v' ? new THREE.Plane().setFromNormalAndCoplanarPoint(V3(0, 0, 1), h.point) : new THREE.Plane(V3(0, 1, 0), -h.point.y);
      pointer.start = h.point.clone();
      if (d.start) d.start(h.point);
    } else if (h.kind === 'item') {
      const it = ITEMS[h.key];
      pointer.carry = h.key;
      const carrier = hands ? hands.right : ghost.right;
      carrier.goal.copy(gripWorld(h.key));
      if (hands) hands.right.setPose(it.pose || 'grab', 'palm');
      attach(h.key, carrier);
      if (it.onPick) it.onPick(lab);
    }
  });
  canvas.addEventListener('pointerleave', () => { lastMouse = null; });
  canvas.addEventListener('pointermove', (e) => {
    lastMouse = { clientX: e.clientX, clientY: e.clientY };
    if (!state.started) return;
    const h = pick(e);
    hover = h;
    updateTip(e, h);
    if (!pointer) {
      canvas.style.cursor = h && h.kind !== 'surface' ? (h.kind === 'item' || h.action?.drag ? 'grab' : 'pointer') : '';
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
    if (pointer.plane) {
      const p = V3();
      if (raycaster.ray.intersectPlane(pointer.plane, p)) pointer.hit.action.drag.move(p, pointer.start);
      canvas.style.cursor = 'grabbing';
    }
    if (pointer.carry) {
      const p = V3();
      if (raycaster.ray.intersectPlane(tablePlane, p)) {
        const it = ITEMS[pointer.carry];
        (hands ? hands.right : ghost.right).goal.copy(V3(p.x, TABLE_Y + it.app.grip.y * it.group.scale.y + 5, p.z));
      }
      canvas.style.cursor = 'grabbing';
    }
  });
  function endPointer(e) {
    if (!pointer || e.pointerId !== pointer.id) return;
    if (pointer.plane && pointer.hit.action.drag.end) pointer.hit.action.drag.end(pointer.moved);
    if (pointer.carry) dropCarried(pointer.carry);
    pointer = null;
    controls.enabled = state.mode !== 'fp';
    canvas.style.cursor = '';
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  function dropCarried(key) {
    const it = ITEMS[key];
    carried.delete(key);
    const pos = it.group.position;
    it.group.rotation.x = 0; it.group.rotation.z = 0;
    if (it.slot) {
      const d = Math.hypot(pos.x - it.slot[0], pos.z - it.slot[1]);
      if (d < 16) { placeAtSlot(key); toast(`${it.name} placed.`, 'ok', 1800); sfx('thud'); return; }
    }
    if (spec.onDrop && spec.onDrop(lab, key, pos)) { sfx('thud'); return; }
    if (onSurface(pos)) { pos.y = TABLE_Y; it.placed = false; } else sendHome(key);
    sfx('thud');
  }
  const tipEl = $('tip');
  function updateTip(e, h) {
    let text = '';
    if (h) {
      if (h.kind === 'term') text = terminals[h.id]?.label || h.id;
      else if (h.kind === 'item') text = `${ITEMS[h.key].name} — drag to ${ITEMS[h.key].placed ? 'move' : 'carry it to the bench'}`;
      else if (h.kind === 'lead') text = 'Lead — right-click to remove';
      else if (h.kind === 'action') text = typeof h.action.tip === 'function' ? h.action.tip() : h.action.tip || '';
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
    if (spec.onKey) spec.onKey(lab, e, true);
  });
  window.addEventListener('keyup', (e) => { keys.delete(e.code); if (spec.onKey && state.started) spec.onKey(lab, e, false); });
  window.addEventListener('blur', () => { state.holdSources.clear(); keys.clear(); });

  // ---------------------------------------------------------------------------
  // Hands follow the mouse
  // ---------------------------------------------------------------------------

  const armReach = () => (avatar ? avatar.armLen.upper + avatar.armLen.fore + avatar.armLen.hand - 2 : 88);
  function clampReach(p) {
    state.reachTarget = p.clone();
    const d = p.clone().sub(SHOULDER.right);
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
    const dragging = pointer && (pointer.carry || pointer.plane);
    if (student && hold && !dragging) {
      R.setPose(hold.pose, hold.pose === 'pinch' ? 'pinch' : 'index');
      R.speed = 22;
      R.goal.copy(clampReach(hold.point.clone().add(V3(0, 1.2, 0))));
      aimHand(R, R.goal, -0.4);
      return;
    }
    const usable = hover && hover.point && hover.kind !== 'surface' && hover.kind !== 'lead';
    if (student && state.mode === 'fp' && !usable && !dragging && !pending) { fpHands(); return; }
    if (student && (!hover || !hover.point || (!reachable(hover.point) && !dragging) || (hover.kind === 'surface' && !pointer)) && !pending && !dragging) {
      if (hover && hover.point && hover.kind !== 'surface') {
        R.setPose('point', 'index');
        R.goal.copy(clampReach(hover.point.clone().add(V3(0, 4, 0))));
        aimHand(R, hover.point, -0.2);
      } else if (state.mode === 'fp') fpHands(); else bodyHands();
      return;
    }
    R.speed = 22;
    if (pointer && pointer.carry) {
      R.setPose(ITEMS[pointer.carry].pose || 'grab', 'palm');
      if (student) clampReach(R.goal);
      aimHand(R, R.goal, 0);
    } else if (pointer && pointer.plane) {
      const d = pointer.hit.action.drag;
      R.setPose('pinch', 'pinch');
      R.goal.copy(d.hand ? d.hand() : pointer.hit.point);
      aimHand(R, R.goal, -0.3);
    } else if (hover && hover.point) {
      if (pending) { R.setPose('pinch', 'pinch'); R.goal.copy(hover.point).add(V3(0, 2.2, 0)); aimHand(R, R.goal, -0.4); } else { R.setPose('point', 'index'); R.goal.copy(hover.point).add(V3(0, 1.4, 0)); aimHand(R, R.goal, -0.35); }
    }
    if (student) clampReach(R.goal);
    R.goal.y = Math.max(R.goal.y, TABLE_Y + 1);
    if (student) {
      const a = avatar.state.pos;
      const atBench = Math.abs(a.x) < 118 && a.z < 80;
      if (atBench) { Lh.setPose('flat', 'palm'); Lh.goal.set(a.x - 20, TABLE_Y + 1.2, 40); Lh.yawGoal = 0.3; Lh.pitchGoal = 0; } else { Lh.setPose('relaxed', 'index'); Lh.goal.copy(avatar.bodyPoint(-23, 80, -3)); Lh.yawGoal = avatar.state.heading - 0.1; Lh.pitchGoal = -1.35; }
      return;
    }
    Lh.setPose('flat', 'palm'); Lh.goal.copy(LEFT_REST); Lh.yawGoal = 0.35; Lh.pitchGoal = 0;
  }

  // ---------------------------------------------------------------------------
  // Camera views, labels, close-up insets
  // ---------------------------------------------------------------------------

  function fitView(x0, x1, target) {
    const dir = V3(0, 0.66, 0.75).normalize();
    return {
      target: () => target,
      pos: () => {
        const vf = THREE.MathUtils.degToRad(camera.fov);
        const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
        const d = Math.max(((x1 - x0) / 2) * 1.08 / Math.tan(hf / 2), 60);
        return V3(...target).addScaledVector(dir, d).toArray();
      },
    };
  }
  lab.fitView = fitView;
  const VIEWS = {
    room: { pos: [-40, 150, 330], target: [40, -20, -40] },
    setup: fitView(-80, 242, [80, -10, -6]),
    bench: fitView(-70, 70, [0, 2, -4]),
    top: { pos: [30, 190, 20], target: [30, 0, 0] },
    // a view may be given as fit: [x0, x1, target] to frame that width of the bench
    ...Object.fromEntries(Object.entries(spec.views || {}).map(([k, v]) => [k, v.fit ? fitView(...v.fit) : v])),
  };
  let fly = null;
  function flyTo(name) {
    const v = VIEWS[name];
    if (!v) return;
    const val = (x) => (typeof x === 'function' ? x(lab) : x);
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

  const labelsEl = $('labels');
  const LABELS = [
    ...Object.values(ITEMS).map((it) => [it.label || it.name, () => {
      const s = it.app.size || [10, 8, 10];
      return it.group.position.clone().add(V3(0, (it.labelY ?? s[1]) + 4, 0));
    }]),
    ...(spec.labels || []).map(([t, f]) => [t, () => f(lab)]),
    ['Apparatus trolley', () => V3(TROLLEY.x, TABLE_Y + 16, TROLLEY.z - 30)],
    ['PPE station — safety gear', () => ppe.group.localToWorld(V3(0, 214, 6))],
  ];
  const labelEls = LABELS.map(([t]) => { const d = document.createElement('div'); d.className = 'tag'; d.textContent = t; labelsEl.appendChild(d); return d; });
  const projV = V3();
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
  function setupPip(el) {
    const key = `labPip:${spec.id}:${el.id}`;
    const bar = el.querySelector('.pipbar'), btn = el.querySelector('.pipmin');
    const clampPos = (x, y) => [THREE.MathUtils.clamp(x, 0, Math.max(0, stage.clientWidth - el.offsetWidth)), THREE.MathUtils.clamp(y, 0, Math.max(0, stage.clientHeight - 22))];
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
  const pips = (spec.pips || []).map((p) => {
    const el = $(`pip_${p.id}`);
    setupPip(el);
    return { ...p, el, cam: new THREE.PerspectiveCamera(p.fov || 28, 250 / 150, 0.2, 400) };
  });
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
  // Observations, result, Observation tab
  // ---------------------------------------------------------------------------

  const cols = spec.table?.columns || [];
  function renderTable() {
    if (!spec.table) return;
    const tb = $('obsTable').querySelector('tbody');
    tb.innerHTML = '';
    state.rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td>${cols.map((c) => `<td>${esc(c.fmt ? c.fmt(r[c.key], r) : r[c.key] ?? '—')}</td>`).join('')}<td><button title="Delete">✕</button></td>`;
      tr.querySelector('button').onclick = () => { state.rows.splice(i, 1); renderTable(); if (spec.onRowsChanged) spec.onRowsChanged(lab); };
      tb.appendChild(tr);
    });
  }
  function addRow(row) { state.rows.push(row); renderTable(); sfx('ok'); if (spec.onRowsChanged) spec.onRowsChanged(lab); return row; }
  lab.addRow = addRow;
  lab.renderTable = renderTable;
  Object.defineProperty(lab, 'rows', { get: () => state.rows });
  function updateResult() {
    const r = spec.result ? spec.result(lab) : { items: [], note: '' };
    const el = $('resultMeters');
    const html = (r.items || []).map(([l, v]) => `<div class="m"><i>${esc(l)}</i><b>${esc(v)}</b></div>`).join('');
    if (el.innerHTML !== html) el.innerHTML = html;
    $('rNote').textContent = r.note || '';
  }
  function sendToObservation() {
    const o = spec.observation ? spec.observation(lab) : null;
    if (!o || !o.rows || !o.rows.some((r) => Object.values(r).some((v) => v !== '' && v != null))) { toast('Record some observations first.', 'err'); return false; }
    const n = spec.obsRows || o.rows.length;
    const keysList = spec.obsKeys || Object.keys(o.rows[0] || {});
    const rows = o.rows.slice(0, n).map((r) => Object.fromEntries(keysList.map((k) => [k, r[k] == null ? '' : String(r[k])])));
    while (rows.length < n) rows.push(Object.fromEntries(keysList.map((k) => [k, ''])));
    const payload = { rows, metricInputs: o.metricInputs || {}, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(`experimentObservations:${spec.id}`, JSON.stringify(payload));
      state.sent = true;
      toast(`Saved. Open the Observation tab to see your readings${o.rows.length > n ? ` (the first ${n} are used)` : ''}.`, 'ok');
      return true;
    } catch (e) {
      toast('Could not save to this browser (storage is blocked). Use Export CSV instead.', 'err');
      return false;
    }
  }
  function exportCsv() {
    const q = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [['#', ...cols.map((c) => c.label)]];
    state.rows.forEach((r, i) => lines.push([i + 1, ...cols.map((c) => (c.fmt ? c.fmt(r[c.key], r) : r[c.key]))]));
    const res = spec.result ? spec.result(lab) : { items: [] };
    if (res.items?.length) { lines.push([]); res.items.forEach(([l, v]) => lines.push([l, v])); }
    const blob = new Blob([lines.map((l) => l.map(q).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${spec.id}-observations.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  lab.sendToObservation = sendToObservation;

  // ---------------------------------------------------------------------------
  // Guided procedure
  // ---------------------------------------------------------------------------

  const hl = { slots: [], terms: [], rings: [] };
  const PHASES = [];
  const STEPS = [];
  const phaseIndex = (name) => { let i = PHASES.indexOf(name); if (i < 0) { PHASES.push(name); i = PHASES.length - 1; } return i; };
  GEAR.forEach((g) => STEPS.push({
    phase: phaseIndex('Safety gear'),
    text: { coat: 'Go to the PPE station by the door and put on a lab coat.', goggles: 'Put on the safety goggles.', gloves: 'Put on nitrile gloves.', shoes: 'Change into safety shoes.' }[g],
    why: {
      coat: 'A buttoned lab coat protects your clothes and skin from spills, hot apparatus and chemicals.',
      goggles: spec.lab === 'Chemistry Lab' ? 'Goggles protect your eyes from splashes of acids, alkalis and hot liquids.' : 'Goggles protect your eyes from flying parts, snapping wires and sparks.',
      gloves: spec.lab === 'Chemistry Lab' ? 'Nitrile gloves protect your skin from corrosive and staining reagents.' : 'Gloves keep sweat and grease off the apparatus and protect your hands.',
      shoes: 'Closed safety shoes protect your feet from dropped apparatus and spills.',
    }[g],
    check: () => state.mode === 'classic' || gearOn(g),
    demo: () => demoGear(g),
  }));
  const setupOrder = spec.setupOrder || movable;
  setupOrder.forEach((k) => {
    const it = ITEMS[k];
    STEPS.push({
      phase: phaseIndex('Set up the apparatus'),
      text: it.setupText || `Carry the ${/^[A-Z][a-z]+(\s|$)/.test(it.name) ? it.name[0].toLowerCase() + it.name.slice(1) : it.name} from the trolley to its place on the bench.`,
      why: it.why || '',
      check: () => it.placed,
      demo: () => demoPlace(k),
      slots: [k],
    });
  });
  (spec.steps ? spec.steps(lab) : []).forEach((s) => STEPS.push({ ...s, phase: phaseIndex(s.phase) }));
  STEPS.push({ phase: phaseIndex('Result'), text: 'Check your result, then send your readings to the Observation tab.', check: () => !!state.sent, demo: async () => { sendToObservation(); } });
  STEPS.forEach((s, i) => { s.i = i; if (s.sticky == null) s.sticky = true; });
  function isDone(s) {
    if (s.latched) return true;
    const ok = !!s.check();
    if (ok && s.sticky && state.started) s.latched = true;
    return ok;
  }
  const currentStep = () => STEPS.find((s) => !isDone(s));
  const currentPhase = () => { const s = currentStep(); return s ? s.phase : PHASES.length; };
  lab.currentStep = currentStep;
  let stepsBuilt = false, lastStepIndex = -1;
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
    $('guideBar').style.width = `${(STEPS.filter((s) => isDone(s)).length / STEPS.length) * 100}%`;
    if (cur) {
      $('guidePhase').textContent = `Phase ${cur.phase + 1} of ${PHASES.length} · ${PHASES[cur.phase]}`;
      $('guideText').textContent = cur.text;
      $('guideWhy').textContent = cur.why || '';
      $('bannerPhase').textContent = `Step ${cur.i + 1} of ${STEPS.length} · ${PHASES[cur.phase]}`;
      $('bannerText').textContent = cur.text;
      $('stepBanner').classList.remove('done');
      $('chipPhase').textContent = PHASES[cur.phase];
      hl.slots = cur.slots || []; hl.terms = cur.terms || [];
      hl.rings = cur.rings ? cur.rings(lab) : [];
      if (cur.i !== lastStepIndex && lastStepIndex >= 0 && state.started) sfx('ok');
      lastStepIndex = cur.i;
    } else {
      $('guidePhase').textContent = 'Experiment complete';
      $('guideText').textContent = 'Well done! Every step is complete. Keep experimenting or repeat with new values.';
      $('guideWhy').textContent = '';
      $('bannerPhase').textContent = 'Complete';
      $('bannerText').textContent = 'Experiment complete — great work.';
      $('stepBanner').classList.add('done');
      $('chipPhase').textContent = 'Complete';
      hl.slots = []; hl.terms = []; hl.rings = [];
    }
  }
  const ringPool = [];
  function updateHighlights(t) {
    for (const [k, m] of Object.entries(slotMarkers)) {
      m.visible = state.started && hl.slots.includes(k) && !ITEMS[k].placed;
      if (m.visible) m.userData.plane.material.opacity = 0.14 + 0.12 * Math.sin(t * 5);
    }
    const pts = state.started ? hl.terms.filter((id) => terminals[id] && !leads.some((L) => L.a === id || L.b === id)).map((id) => termWorld(id)) : [];
    if (pending) pts.push(termWorld(pending.from));
    if (state.started) pts.push(...hl.rings);
    while (ringPool.length < pts.length) {
      const r = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.35, 32), M.ring.clone());
      r.rotation.x = -Math.PI / 2;
      r.userData.noPick = true;
      scene.add(r); ringPool.push(r);
    }
    ringPool.forEach((r, i) => {
      r.visible = i < pts.length;
      if (!r.visible) return;
      r.position.copy(pts[i]).add(V3(0, 0.3, 0));
      const s = (i >= pts.length - hl.rings.length ? 2.2 : 1) * (1 + 0.25 * Math.sin(t * 6 + i));
      r.scale.set(s, s, s);
      r.material.color.setHex(pending && i === pts.length - hl.rings.length - 1 ? 0x22d3ee : 0xfde047);
    });
  }

  // ---------------------------------------------------------------------------
  // Panel wiring
  // ---------------------------------------------------------------------------

  function setDemoButtons(busy) {
    document.querySelectorAll('#panel .act, #btnDemo, #btnDoPhase').forEach((b) => { b.disabled = busy; });
    $('btnDemo').textContent = busy ? 'Working… (Esc stops)' : state.mode === 'classic' ? '▶ Do this step' : '▶ Show me';
  }
  $('btnDemo').onclick = () => { const s = currentStep(); if (s && s.demo) withAutopilot(s.demo); };
  $('btnDoPhase').onclick = () => withAutopilot(async () => {
    const ph = currentPhase();
    for (let guard = 0; guard < 60; guard++) {
      const s = currentStep();
      if (!s || s.phase !== ph || !s.demo) break;
      await s.demo();
      await wait(0.2);
      if (!isDone(s)) break;
    }
  });
  if (spec.record) $('btnRecord').onclick = () => spec.record(lab);
  $('btnSend').onclick = sendToObservation;
  $('btnCsv').onclick = exportCsv;
  $('optLabels').onchange = (e) => { state.labels = e.target.checked; labelsEl.classList.toggle('hidden', !state.labels); };
  if ($('optPip')) $('optPip').onchange = (e) => { state.pip = e.target.checked; };
  if ($('optFlow')) $('optFlow').onchange = (e) => { state.flow = e.target.checked; };
  $('optSound').onchange = (e) => { state.sound = e.target.checked; };
  $('optQuality').onchange = (e) => applyQuality(!e.target.checked);
  $('optHands').onchange = (e) => { if (avatar) avatar.setVisible(e.target.checked && bodyMode()); };
  if (spec.wiring) {
    $('btnUndoLead').onclick = () => { if (leads.length) disconnect(leads[leads.length - 1]); };
    $('btnClearLeads').onclick = () => { [...leads].forEach(disconnect); };
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) b.blur(); });
  document.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => flyTo(b.dataset.view)));

  // ---------------------------------------------------------------------------
  // Frame loop
  // ---------------------------------------------------------------------------

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  // Fixed-step simulation, independent of the frame rate
  function advance(seconds) {
    let t = seconds;
    while (t > 1e-9) { const h = Math.min(t, 1 / 60); if (spec.simulate) spec.simulate(lab, h); t -= h; }
  }
  lab.advance = advance;
  const clock = new THREE.Clock();
  let uiTimer = 0, elapsed = 0;
  const fpsProbe = { frames: 0, t: 0, done: false };
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.5);
    elapsed += dt;
    if (state.started && !fpsProbe.done) {
      fpsProbe.frames++; fpsProbe.t += dt;
      if (fpsProbe.t > 5) {
        fpsProbe.done = true;
        if (!lowGfx && fpsProbe.frames / fpsProbe.t < 22) toast('Motion looks slow on this computer. Untick “High-quality graphics” under “View” for smoother motion.', 'info', 8000);
      }
    }
    runTweens(dt);
    // The experiment runs on the demonstration clock, so pausing or speeding the
    // watch mode pauses or speeds the physics and chemistry too
    advance(vclock.paused ? 0 : dt * (autopilot ? vclock.scale : 1));
    driveStudent(dt);
    if (state.started && lastMouse && hands && !(pointer && (pointer.look || pointer.carry))) hover = pick(lastMouse);
    driveHands();
    updateCarried();
    if (spec.update) spec.update(lab, dt, elapsed);
    if (hands) hands.update(dt);
    if (avatar && bodyMode() && hands) {
      const a = avatar.state;
      const tgt = autopilot ? hands.right.goal : state.reachTarget;
      if (tgt && tgt.y < 30) {
        const deficit = tgt.distanceTo(SHOULDER.right) - (armReach() - 9);
        a.leanGoal = THREE.MathUtils.clamp(a.lean + deficit / 45, 0, 0.95);
      } else a.leanGoal = 0;
      avatar.update(dt, { moving: walking.speed > 1, speed: walking.speed, handL: hands.left, handR: hands.right });
    }
    updateFPCamera();
    if (pending) updatePendingLead(hands ? hands.right.goal.clone() : (hover && hover.point ? hover.point.clone().add(V3(0, 2, 0)) : termWorld(pending.from).add(V3(0, 4, 4))));
    if (leads.length) updateLeads();
    for (const s of [...spinning]) { s.cap.rotation.y += dt * 14; s.left -= dt; if (s.left <= 0) spinning.splice(spinning.indexOf(s), 1); }
    room.update();
    updateHighlights(elapsed);
    updateFly();
    followCamera(dt);
    if (state.mode !== 'fp') controls.update();
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, ROOM.x0 + 15, ROOM.x1 - 15);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, ROOM.z0 + 15, ROOM.z1 - 15);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, FLOOR_Y + 20, FLOOR_Y + 290);

    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
    renderer.render(scene, camera);
    const atBench = !avatar || state.mode !== 'fp' || (Math.abs(avatar.state.pos.x) < 125 && avatar.state.pos.z < 95);
    let any = false;
    for (const p of pips) {
      const show = state.started && state.pip && w > 360 && atBench && (!p.show || p.show(lab));
      p.el.classList.toggle('hidden', !show);
      if (!show) continue;
      p.update(p.cam, lab);
      if (!any) { renderer.setScissorTest(true); any = true; }
      renderPip(p.el, p.cam);
    }
    if (any) renderer.setScissorTest(false);
    updateLabels(w, h);
    uiTimer += dt;
    if (uiTimer > 0.1) { uiTimer = 0; updateUi(); }
    requestAnimationFrame(frame);
  }
  function updateUi() {
    const chips = spec.chips ? spec.chips(lab) : [];
    const box = $('chips');
    while (box.children.length < chips.length + 1) { const s = document.createElement('span'); s.className = 'chip'; box.appendChild(s); }
    chips.forEach(([text, cls], i) => { const el = box.children[i + 1]; el.textContent = text; el.className = `chip ${cls || ''}`; });
    for (let i = chips.length + 1; i < box.children.length; i++) box.children[i].style.display = 'none';
    if (spec.ui) spec.ui(lab);
    updateResult();
    updateGuide();
  }

  // ---------------------------------------------------------------------------
  // Modes, start and boot
  // ---------------------------------------------------------------------------

  function resetBench() {
    STEPS.forEach((st) => { st.latched = false; });
    [...leads].forEach(disconnect);
    cancelLead();
    carried.clear();
    Object.keys(ITEMS).forEach(sendHome);
    state.rows = []; state.sent = false;
    lab.x = spec.state ? spec.state(lab) : {};
    if (spec.reset) spec.reset(lab);
    renderTable();
  }
  function quickSetup() {
    Object.keys(ITEMS).forEach(placeAtSlot);
    if (spec.quickSetup) spec.quickSetup(lab);
    toast('The bench is set up. Continue with the experiment.', 'info', 5000);
  }
  lab.quickSetup = quickSetup;
  const MODE_HINTS = {
    auto: '<b>Watch</b>: the student performs the whole experiment. <b>Drag</b> to move the camera around them, <b>scroll</b> to zoom · <b>Pause</b> / speed in the Guide panel',
    fp: `<b>W A S D</b> walk · <b>Q/E</b> turn · <b>drag</b> empty space to look · <b>click</b> things to use them · <b>drag</b> apparatus to carry${spec.wiring ? ' · <b>click</b> terminal → terminal for a lead · <b>right-click</b> a lead to remove' : ''}${spec.hintExtra ? ` · ${spec.hintExtra}` : ''}`,
    classic: `<b>Click</b> or <b>drag</b> the apparatus to use it · use the panel buttons · <b>drag</b> empty space to look around${spec.hintExtra ? ` · ${spec.hintExtra}` : ''}`,
  };
  function studentView() {
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
    if (avatar) {
      avatar.setVisible(mode !== 'classic' && $('optHands').checked);
      avatar.setHeadVisible(mode !== 'fp');
      fp.yaw = avatar.state.heading; fp.pitch = -0.3;
    }
    controls.enabled = mode !== 'fp';
    camera.near = mode === 'fp' ? 2.5 : 0.5;
    camera.fov = mode === 'fp' ? 70 : 40;
    camera.updateProjectionMatrix();
    $('gogglesOverlay').classList.toggle('on', mode === 'fp' && gearOn('goggles'));
    if (mode === 'classic' && Object.values(ITEMS).some((it) => !it.placed && it.slot)) {
      [...leads].forEach(disconnect);
      carried.clear();
      quickSetup();
    }
    $('mode').value = mode;
    $('hint').innerHTML = MODE_HINTS[mode];
    document.body.dataset.mode = mode;
    if (state.started) {
      if (mode === 'auto') { fly = null; const v = studentView(); camera.position.set(...v.pos); controls.target.set(...v.target); } else if (mode === 'classic') flyTo(spec.classicView || 'bench');
      else controls.target.copy(avatar.eyeWorld());
    }
    setDemoButtons(false);
    if (mode === 'auto' && state.started && !autopilot) setTimeout(runAuto, 400);
  }
  async function runAuto() {
    if (state.mode !== 'auto' || autopilot || !avatar) return;
    $('autoPause').textContent = '⏸ Pause';
    await withAutopilot(async () => {
      let last = -1, tries = 0;
      for (let guard = 0; guard < 150; guard++) {
        const st = currentStep();
        if (!st || state.mode !== 'auto') break;
        if (st.i === last) { if (++tries > 2) { toast('The student could not finish this step. Press Restart to try again.', 'err', 6000); break; } } else { last = st.i; tries = 0; }
        await st.demo();
        await wait(0.35);
      }
    });
    if (pendingAuto) { pendingAuto = false; if (state.mode === 'auto') setTimeout(runAuto, 200); return; }
    if (state.mode === 'auto' && !currentStep()) { toast('The student has completed the experiment — every observation is recorded.', 'ok', 8000); $('autoPause').textContent = '↻ Watch again'; }
  }
  function start(mode, ready) {
    $('startScreen').classList.add('hidden');
    state.started = true;
    demoAbort = true;
    resetBench();
    resetGear();
    vclock.paused = false;
    if (avatar) { avatar.state.pos.set(470, FLOOR_Y, 300); avatar.state.heading = Math.PI / 2; }
    if (mode === 'classic' || ready) quickSetup();
    setMode(mode);
    if (mode === 'fp') toast('You are the student. First go to the PPE station on your left and put on a lab coat, goggles, gloves and safety shoes (click each one).', 'info', 9000);
    else if (mode === 'auto') toast('Watch the student gear up, set up the bench and perform the experiment. Drag to move the camera.', 'info', 7000);
    sfx('ok');
  }

  // Panel sections provided by the experiment
  document.querySelectorAll('details[data-sec]').forEach((el) => {
    const s = spec.panel[+el.dataset.sec];
    if (s.bind) s.bind(lab, el);
  });

  new ResizeObserver(resize).observe(stage);
  resize();
  if (lowGfx) applyQuality(true);
  if (spec.init) spec.init(lab);
  resetBench();
  updateGuide();
  frame();

  const START_BTNS = ['startAuto', 'startFP', 'startClassic'];
  START_BTNS.forEach((id) => { $(id).disabled = true; });
  loadAvatar(scene).then((a) => {
    avatar = a;
    avatar.state.pos.set(470, FLOOR_Y, 300);
    avatar.state.heading = Math.PI / 2;
    avatar.setVisible(false);
    handsLoaded = a.hands;
    handsLoaded.right.goal.copy(a.bodyPoint(23, 80, -3)); handsLoaded.right.pos.copy(handsLoaded.right.goal);
    handsLoaded.left.goal.copy(a.bodyPoint(-23, 80, -3)); handsLoaded.left.pos.copy(handsLoaded.left.goal);
  }).catch((e) => {
    console.warn('The student model could not be loaded; only the no-human mode is available.', e);
  }).finally(() => {
    $('loadNote').textContent = handsLoaded ? 'Ready. Choose how you want to work.' : 'Ready (student model unavailable — no-human mode only).';
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
  window.lab = Object.assign(lab, { start, setMode, runAuto, STEPS, PHASES, wearGear, keys, fp, walking, pickAt: (x, y) => { const h = pick({ clientX: x, clientY: y }); return h && { kind: h.kind, key: h.key }; } });
  return lab;
}
