// 3D engine for the interactive concept simulations. Each simulation page
// passes a spec; the engine gives it a lit 3D stage (the lab bench, an
// outdoor field, deep space or a studio), an orbit camera, a control panel
// built from the spec (sliders, selects, buttons), readouts, a live graph,
// 3D labels, arrows and trails, and a fixed-step simulation clock with
// play / pause / speed / reset.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

export { THREE };
export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------------------
// Shared materials and small builders
// ---------------------------------------------------------------------------

export const MAT = {
  steel: new THREE.MeshStandardMaterial({ color: 0xc3cad1, metalness: 1, roughness: 0.25 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: 0x4b5058, metalness: 0.9, roughness: 0.4 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xd9a948, metalness: 1, roughness: 0.28 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xc27a4a, metalness: 1, roughness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x9b6b3d, roughness: 0.6 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x5a3418, roughness: 0.55 }),
  black: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.45 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }),
  red: new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.35 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xd7e6ee, roughness: 0.05, transparent: true, opacity: 0.18, clearcoat: 0.6, depthWrite: false, side: THREE.DoubleSide }),
};
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, ...o });
export const glow = (color, o = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
export function mesh(geo, mat, cast = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; }
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
// A glowing sprite (light points, photons, charges)
const glowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
export function glowSprite(color, size = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  s.scale.setScalar(size);
  return s;
}
// A text label that lives in 3D (a sprite with a canvas texture)
export function textSprite(text, { color = '#ffffff', bg = 'rgba(15,23,42,0.75)', size = 1, font = 'bold 44px Arial' } = {}) {
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  g.font = font; const w = Math.ceil(g.measureText(text).width) + 36;
  c.width = w; c.height = 72;
  g.font = font; g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(0, 0, w, 72, 16) : g.rect(0, 0, w, 72); g.fill();
  g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 18, 38);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false }));
  s.scale.set((w / 72) * size, size, 1); s.renderOrder = 10;
  return s;
}

// An arrow built from a cylinder and a cone; set(origin, vector, scale)
export function arrow(color, { radius = 0.06, head = 0.25 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: color, emissiveIntensity: 0.25 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), mat);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius * 2.6, 1, 16), mat);
  g.add(shaft, cone);
  const up = V3(0, 1, 0), q = new THREE.Quaternion();
  g.set = (origin, vec, scale = 1) => {
    const len = vec.length() * scale;
    g.visible = len > 1e-4;
    if (!g.visible) return g;
    const h = Math.min(head, len * 0.45);
    g.position.copy(origin);
    q.setFromUnitVectors(up, vec.clone().normalize());
    g.quaternion.copy(q);
    shaft.scale.set(1, Math.max(1e-4, len - h), 1); shaft.position.y = (len - h) / 2;
    cone.scale.set(1, h, 1); cone.position.y = len - h / 2;
    return g;
  };
  g.material = mat;
  return g;
}
// A fading line of recent positions
export function trail(color, max = 400) {
  const pos = new Float32Array(max * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setDrawRange(0, 0);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
  line.frustumCulled = false;
  let n = 0;
  line.push = (v) => {
    if (n < max) n++; else pos.copyWithin(0, 3);
    pos[(n - 1) * 3] = v.x; pos[(n - 1) * 3 + 1] = v.y; pos[(n - 1) * 3 + 2] = v.z;
    geo.attributes.position.needsUpdate = true; geo.setDrawRange(0, n);
  };
  line.clear = () => { n = 0; geo.setDrawRange(0, 0); };
  return line;
}
// A helical spring between two points (radius r, turns)
export function spring(color = 0xb8bec5, { r = 0.3, turns = 14, wire = 0.035 } = {}) {
  const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.3 }));
  m.castShadow = true;
  const up = V3(0, 1, 0);
  m.set = (a, b) => {
    const d = b.clone().sub(a), L = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(up, d.clone().normalize());
    const pts = [];
    const N = turns * 14;
    for (let i = 0; i <= N; i++) { const t = i / N, ang = t * turns * Math.PI * 2; const e = t < 0.04 || t > 0.96 ? 0 : 1; pts.push(V3(Math.cos(ang) * r * e, t * L, Math.sin(ang) * r * e).applyQuaternion(q).add(a)); }
    m.geometry.dispose();
    m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, wire, 6, false);
  };
  return m;
}

// ---------------------------------------------------------------------------
// Page markup
// ---------------------------------------------------------------------------

function buildDom(spec) {
  const ctrl = (spec.controls || []).map((c) => {
    if (c.type === 'select') return `<div class="cc-row"><label>${esc(c.label)}</label><select id="c_${c.id}">${c.options.map((o) => `<option value="${esc(o.value ?? o)}" ${String(o.value ?? o) === String(c.value) ? 'selected' : ''}>${esc(o.label ?? o)}</option>`).join('')}</select></div>`;
    if (c.type === 'check') return `<div class="cc-row"><label class="cc-check"><input type="checkbox" id="c_${c.id}" ${c.value ? 'checked' : ''}/> ${esc(c.label)}</label></div>`;
    return `<div class="cc-row"><label>${esc(c.label)} <span class="cc-val" id="cv_${c.id}"></span></label><input type="range" id="c_${c.id}" min="${c.min}" max="${c.max}" step="${c.step ?? (c.max - c.min) / 100}" value="${c.value}"/></div>`;
  }).join('');
  const btns = (spec.buttons || []).map((b) => `<button class="cc-btn ${b.kind || ''}" id="b_${b.id}">${esc(b.label)}</button>`).join('');
  const reads = (spec.readouts || []).map((r) => `<div class="cc-read"><i>${esc(r.label)}</i><b id="r_${r.id}">—</b></div>`).join('');
  document.body.innerHTML = `
<div class="cc-app">
  <header class="cc-head"><a class="cc-back" href="../index.html">&larr; All simulations</a><div><h1>${esc(spec.title)}</h1><p>${esc(spec.subtitle || '')}</p></div><span class="cc-badge">3D</span></header>
  <div class="cc-main">
    <section class="cc-stage" id="stage"><canvas id="gl"></canvas><div id="tags"></div>
      <div class="cc-hint">Drag to orbit · right-drag to pan · scroll to zoom${spec.hint ? ` · ${spec.hint}` : ''}</div>
      <div class="cc-play"><button id="pPlay" class="cc-btn">▶ Play</button><button id="pReset" class="cc-btn ghost">↺ Reset</button>
        <select id="pSpeed" title="Speed"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></div>
    </section>
    <aside class="cc-panel">
      ${ctrl ? `<div class="cc-box"><h3>Controls</h3>${ctrl}${btns ? `<div class="cc-btns">${btns}</div>` : ''}</div>` : btns ? `<div class="cc-box"><div class="cc-btns">${btns}</div></div>` : ''}
      ${reads ? `<div class="cc-box"><h3>Readouts</h3><div class="cc-reads">${reads}</div></div>` : ''}
      ${spec.graph ? `<div class="cc-box"><h3>${esc(spec.graph.title || 'Graph')}</h3><canvas id="graph" width="320" height="170"></canvas><div class="cc-legend" id="legend"></div></div>` : ''}
      ${spec.extraHtml ? `<div class="cc-box">${spec.extraHtml}</div>` : ''}
      <div class="cc-box cc-info"><h3>The science</h3><p>${spec.info || ''}</p>${(spec.formulas || []).map((f) => `<div class="cc-formula">${f}</div>`).join('')}</div>
    </aside>
  </div>
</div>`;
  document.title = `${spec.title} — 3D simulation`;
}

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------

async function buildStage(ctx, kind, opts) {
  const { scene } = ctx;
  if (kind === 'bench') {
    // the real lab room and bench from the 3D lab (units: cm, bench top at y = -3)
    const { buildRoom } = await import('../../simulations/meter-bridge/room.js');
    ctx.room = buildRoom(scene, -3, { board: opts.board || { title: ctx.spec.title, formulas: ctx.spec.formulasPlain || [] } });
    scene.background = new THREE.Color(0xd9d4c8);
    [[0, 190, -110], [0, 190, 110], [220, 190, 0]].forEach(([x, y, z]) => { const l = new THREE.PointLight(0xfff6e5, 26000, 0, 2); l.position.set(x, y, z); scene.add(l); });
    return;
  }
  if (kind === 'field') {
    scene.background = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5b9bd5'); gr.addColorStop(0.6, '#bcdcf2'); gr.addColorStop(1, '#e8f1f6'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    scene.fog = new THREE.Fog(0xcfe3ef, opts.fogNear ?? 200, opts.fogFar ?? 900);
    const grass = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#5f8f3e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `hsl(${90 + Math.random() * 25},${35 + Math.random() * 20}%,${25 + Math.random() * 18}%)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2 + Math.random() * 3); } });
    grass.wrapS = grass.wrapT = THREE.RepeatWrapping; grass.repeat.set(80, 80);
    const ground = mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 }), false);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);
    ctx.ground = ground;
    return;
  }
  if (kind === 'space') {
    scene.background = new THREE.Color(0x020409);
    const N = 2500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = V3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(opts.starRadius || 400);
      pos.set([v.x, v.y, v.z], i * 3);
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.5, 0.6 + Math.random() * 0.4);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.4, vertexColors: true, sizeAttenuation: false })));
    return;
  }
  // studio: soft gradient backdrop and a reflective floor
  scene.background = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0e1726'); gr.addColorStop(1, '#27364d'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  if (opts.floor !== false) {
    const floor = mesh(new THREE.CircleGeometry(opts.floorSize || 60, 64), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.2 }), false);
    floor.rotation.x = -Math.PI / 2; floor.position.y = opts.floorY ?? 0; floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(opts.floorSize ? opts.floorSize * 2 : 120, opts.gridDiv || 60, 0x475569, 0x334155);
    grid.position.y = (opts.floorY ?? 0) + 0.01; grid.material.transparent = true; grid.material.opacity = 0.35;
    scene.add(grid);
  }
}

// ---------------------------------------------------------------------------
// The simulation runner
// ---------------------------------------------------------------------------

export async function runSim(spec) {
  buildDom(spec);
  const stage = $('stage'), canvas = $('gl');
  const low = new URLSearchParams(location.search).has('lowgfx');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { stage.insertAdjacentHTML('beforeend', '<div class="cc-err">WebGL is not available, so the 3D simulation cannot be shown.</div>'); throw e; }
  renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !low;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = spec.envIntensity ?? 0.6;
  const cam = spec.camera || {};
  const camera = new THREE.PerspectiveCamera(cam.fov || 42, 1, cam.near || 0.05, cam.far || 5000);
  camera.position.set(...(cam.pos || [0, 3, 8]));
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(...(cam.target || [0, 1, 0]));
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  if (cam.maxPolar != null) controls.maxPolarAngle = cam.maxPolar;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, spec.stage === 'space' ? 0.35 : 0.9));
  const sun = new THREE.DirectionalLight(0xfff4e0, spec.stage === 'space' ? 1.2 : 2.2);
  const sp = spec.sun || {};
  sun.position.set(...(sp.pos || [8, 14, 6]));
  sun.target.position.set(...(cam.target || [0, 0, 0]));
  sun.castShadow = !low;
  sun.shadow.mapSize.set(2048, 2048);
  const ss = sp.size || 12;
  Object.assign(sun.shadow.camera, { left: -ss, right: ss, top: ss, bottom: -ss, near: 0.1, far: sp.far || 200 });
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  const ctx = {
    THREE, V3, scene, camera, controls, renderer, spec, MAT, arrow, trail, spring, mesh, std, glow, glowSprite, textSprite, canvasTex,
    v: {}, t: 0, running: !!spec.autoplay, speed: 1, data: {},
    readout(id, text) { const el = $(`r_${id}`); if (el && el.textContent !== text) el.textContent = text; },
    setControl(id, val) { const el = $(`c_${id}`); if (!el) return; if (el.type === 'checkbox') el.checked = !!val; else el.value = val; readControls(); },
    tags: [],
    label(text, fn, cls = '') { const d = document.createElement('div'); d.className = `cc-tag ${cls}`; d.textContent = text; $('tags').appendChild(d); const t = { el: d, fn, set(tx) { if (d.textContent !== tx) d.textContent = tx; } }; ctx.tags.push(t); return t; },
    play() { ctx.running = true; $('pPlay').textContent = '⏸ Pause'; },
    pause() { ctx.running = false; $('pPlay').textContent = '▶ Play'; },
  };
  window.sim = ctx;
  await buildStage(ctx, spec.stage || 'studio', spec.stageOpts || {});

  // ---- controls ----
  function fmtVal(c, v) { if (c.fmt) return c.fmt(v); const d = c.dec ?? (c.step && c.step < 1 ? Math.max(0, -Math.floor(Math.log10(c.step))) : 0); return `${(+v).toFixed(d)}${c.unit ? ` ${c.unit}` : ''}`; }
  function readControls() {
    for (const c of spec.controls || []) {
      const el = $(`c_${c.id}`);
      const val = c.type === 'select' ? (isNaN(+el.value) ? el.value : +el.value) : c.type === 'check' ? el.checked : +el.value;
      ctx.v[c.id] = val;
      const lab = $(`cv_${c.id}`); if (lab) lab.textContent = fmtVal(c, val);
    }
  }
  readControls();
  for (const c of spec.controls || []) {
    $(`c_${c.id}`).addEventListener(c.type === 'range' || !c.type ? 'input' : 'change', () => { readControls(); if (spec.onControl) spec.onControl(ctx, c.id, ctx.v[c.id]); if (c.reset) doReset(); });
  }
  for (const b of spec.buttons || []) $(`b_${b.id}`).onclick = () => b.run(ctx);
  $('pPlay').onclick = () => (ctx.running ? ctx.pause() : ctx.play());
  $('pSpeed').onchange = (e) => { ctx.speed = +e.target.value; };
  $('pReset').onclick = () => doReset();
  function doReset() { ctx.t = 0; graph.clear(); if (spec.reset) spec.reset(ctx); if (!spec.autoplay) ctx.pause(); }
  ctx.reset = doReset;

  // ---- live graph ----
  const graph = (() => {
    const gs = spec.graph;
    const cv = $('graph');
    const series = gs ? gs.series.map((s) => ({ ...s, pts: [] })) : [];
    if (gs) $('legend').innerHTML = series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
    let xs = [];
    const api = {
      add(x, ys) {
        if (!gs) return;
        xs.push(x); ys.forEach((y, i) => series[i].pts.push(y));
        const max = gs.max || 600;
        if (xs.length > max) { xs = xs.slice(-max); series.forEach((s) => { s.pts = s.pts.slice(-max); }); }
      },
      clear() { xs = []; series.forEach((s) => { s.pts = []; }); },
      draw() {
        if (!gs) return;
        const g = cv.getContext('2d'), W = cv.width, H = cv.height;
        g.clearRect(0, 0, W, H);
        const x0 = 36, y0 = H - 20, w = W - 44, h = H - 30;
        let lo = typeof gs.ymin === 'function' ? gs.ymin(ctx) : gs.ymin, hi = typeof gs.ymax === 'function' ? gs.ymax(ctx) : gs.ymax;
        if (lo == null || hi == null) { const all = series.flatMap((s) => s.pts).filter(Number.isFinite); const mn = all.length ? Math.min(...all) : 0, mx = all.length ? Math.max(...all) : 1; if (lo == null) lo = Math.min(0, mn); if (hi == null) hi = mx === lo ? lo + 1 : mx * 1.08; }
        const xa = gs.xmin ?? (xs.length ? xs[0] : 0), xb = gs.xmax ?? (xs.length ? Math.max(xs[xs.length - 1], xa + (gs.window || 1)) : 1);
        g.strokeStyle = '#475569'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, 6); g.lineTo(x0, y0); g.lineTo(x0 + w, y0); g.stroke();
        if (lo < 0 && hi > 0) { const yz = y0 - ((0 - lo) / (hi - lo)) * h; g.strokeStyle = '#334155'; g.beginPath(); g.moveTo(x0, yz); g.lineTo(x0 + w, yz); g.stroke(); }
        g.fillStyle = '#94a3b8'; g.font = '10px sans-serif';
        g.fillText(fmt3(hi), 2, 12); g.fillText(fmt3(lo), 2, y0);
        g.fillText(gs.xlabel || 't (s)', x0 + w - 34, H - 5); if (gs.ylabel) g.fillText(gs.ylabel, x0 + 4, 12);
        const X = (x) => x0 + ((x - xa) / Math.max(1e-9, xb - xa)) * w, Y = (y) => y0 - ((y - lo) / Math.max(1e-9, hi - lo)) * h;
        series.forEach((s) => {
          g.strokeStyle = s.color; g.lineWidth = 1.8; g.beginPath();
          let started = false;
          s.pts.forEach((y, i) => { if (!Number.isFinite(y)) { started = false; return; } const px = X(xs[i]), py = Y(y); if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py); });
          g.stroke();
          if (gs.dots) { g.fillStyle = s.color; s.pts.forEach((y, i) => { if (Number.isFinite(y)) { g.beginPath(); g.arc(X(xs[i]), Y(y), 2.6, 0, 7); g.fill(); } }); }
        });
        if (spec.graphOverlay) spec.graphOverlay(ctx, g, { X, Y, x0, y0, w, h });
      },
    };
    return api;
  })();
  ctx.plot = (x, ys) => graph.add(x, ys);
  ctx.clearGraph = () => graph.clear();
  const fmt3 = (v) => (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0) ? v.toExponential(1) : (+v.toFixed(2)).toString());

  // ---- picking (optional: spec.pickables returns objects; spec.onPick / onDrag) ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let drag = null;
  const hit = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray; };
  canvas.addEventListener('pointerdown', (e) => {
    if (!spec.pickables || e.button !== 0) return;
    const hits = hit(e).intersectObjects(spec.pickables(ctx), true);
    if (!hits.length) return;
    let o = hits[0].object; while (o && !o.userData.pickId && o.parent) o = o.parent;
    if (!o || !o.userData.pickId) return;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(spec.dragPlaneNormal ? V3(...spec.dragPlaneNormal) : V3(0, 0, 1), hits[0].point);
    drag = { id: o.userData.pickId, obj: o, plane, moved: false };
    controls.enabled = false; canvas.setPointerCapture(e.pointerId);
    if (spec.onPick) spec.onPick(ctx, o.userData.pickId, hits[0].point);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = V3(); if (hit(e).ray.intersectPlane(drag.plane, p)) { drag.moved = true; if (spec.onDrag) spec.onDrag(ctx, drag.id, p); }
  });
  const end = () => { if (drag && spec.onDrop) spec.onDrop(ctx, drag.id); drag = null; controls.enabled = true; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  // ---- loop ----
  function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();
  if (spec.setup) await spec.setup(ctx);
  if (spec.reset) spec.reset(ctx);
  if (ctx.running) ctx.play();
  const clock = new THREE.Clock();
  const H = spec.dt || 1 / 240;
  let acc = 0, uiT = 0;
  const proj = V3();
  function frame() {
    const real = Math.min(clock.getDelta(), 0.1);
    if (ctx.running) {
      acc += real * ctx.speed * (spec.timeScale || 1);
      let n = 0;
      while (acc >= H && n < 4000) { if (spec.step) spec.step(ctx, H); ctx.t += H; acc -= H; n++; }
    } else acc = 0;
    if (spec.frame) spec.frame(ctx, real);
    if (ctx.room) ctx.room.update();
    controls.update();
    renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    for (const t of ctx.tags) {
      const p = t.fn(ctx);
      if (!p) { t.el.style.display = 'none'; continue; }
      proj.copy(p).project(camera);
      const vis = proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1;
      t.el.style.display = vis ? '' : 'none';
      if (vis) t.el.style.transform = `translate(${((proj.x + 1) / 2) * w}px, ${((1 - proj.y) / 2) * h}px) translate(-50%, -100%)`;
    }
    uiT += real;
    if (uiT > 0.08) { uiT = 0; if (spec.ui) spec.ui(ctx); graph.draw(); }
    requestAnimationFrame(frame);
  }
  frame();
  return ctx;
}
