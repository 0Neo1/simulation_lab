// Measuring the weight of objects with a spring balance hung from a stand.
// The balance has a zero-adjusting screw; loads oscillate briefly before
// the pointer comes to rest.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const HOOK = V3(0, 64, -12), G = 9.8, K = 100; // N/m: 10 N stretches the spring 10 cm
const OBJECTS = [
  { key: 'stone', name: 'Stone', m: 0.32 + Math.random() * 0.08 },
  { key: 'block', name: 'Wooden block', m: 0.16 + Math.random() * 0.05 },
  { key: 'cyl', name: 'Iron cylinder', m: 0.48 + Math.random() * 0.06 },
  { key: 'sand', name: 'Packet of sand', m: 0.72 + Math.random() * 0.1 },
];

function buildStand() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(18, 1.6, 26), PH.PM.castIron); base.position.set(0, 0.8, -18); base.castShadow = true;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 74, 14), PH.PM.steel); rod.position.set(0, 37, -27);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 16, 10), PH.PM.steel); arm.rotation.x = Math.PI / 2; arm.position.set(0, HOOK.y + 2, -19.5);
  const boss = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 2.6), PH.PM.darkSteel); boss.position.set(0, HOOK.y + 2, -27);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.14, 6, 14, Math.PI * 1.5), PH.PM.darkSteel); hook.position.set(0, HOOK.y + 1, HOOK.z); hook.rotation.y = Math.PI / 2;
  g.add(base, rod, arm, boss, hook);
  return { group: g, size: [18, 74, 26], grip: V3(0, 44, -26.3) };
}
// Tubular spring balance, 0–10 N in 0.1 N divisions. Local origin at the top ring.
function buildBalance() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 22, 1.4), new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.7, roughness: 0.3 })); body.position.y = -12.5; body.castShadow = true;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 20.5), new THREE.MeshStandardMaterial({ map: PH.tex(128, 1024, (c, w, h) => {
    c.fillStyle = '#f7f4ea'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#111'; c.strokeStyle = '#111';
    const top = 40, bot = h - 40;
    for (let i = 0; i <= 100; i++) {
      const y = top + ((bot - top) * i) / 100;
      const L = i % 10 === 0 ? 50 : i % 5 === 0 ? 36 : 22;
      c.lineWidth = i % 10 === 0 ? 3 : 1.5;
      c.beginPath(); c.moveTo(w - L, y); c.lineTo(w, y); c.stroke();
      if (i % 10 === 0) { c.font = 'bold 30px Arial'; c.fillText(String(i / 10), 6, y + 10); }
    }
    c.font = 'bold 26px Arial'; c.fillText('N', 10, 30);
  }), roughness: 0.6 }));
  face.position.set(0, -12.5, 0.72);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 20, 0.1), new THREE.MeshBasicMaterial({ color: 0x222222 })); slot.position.set(1.05, -12.5, 0.74);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.15, 8, 18), PH.PM.steel); ring.position.y = 0.2;
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.8, 12), PH.PM.brass); screw.position.y = -1.2;
  const indicator = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.5), new THREE.MeshStandardMaterial({ color: 0xdc2626 })); indicator.position.set(0.5, -3.1, 0.9);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 12, 8), PH.PM.steel);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.13, 6, 14, Math.PI * 1.4), PH.PM.steel); hook.rotation.z = 0.8;
  g.add(body, face, slot, ring, screw, indicator, rod, hook);
  const api = {
    group: g, indicator, rod, hook, screw, size: [3.4, 24, 1.4], grip: V3(0, -8, 0.8), pose: 'grab',
    // extension e (cm) of the internal spring moves the indicator and the hook
    set(e) {
      const top = -3.1 + (20.5 * 40) / 1024; // 0 N line
      indicator.position.y = top - e * (20.5 * (1024 - 80) / 1024) / 10;
      rod.position.y = -23.5 - e + 6 - 6; rod.position.y = -29.5 - e;
      hook.position.set(0, -36 - e, 0);
    },
    hookWorld() { g.updateMatrixWorld(true); return hook.getWorldPosition(V3()); },
  };
  api.set(0);
  return api;
}
function objectMesh(o) {
  const g = new THREE.Group();
  let body, h;
  if (o.key === 'stone') { body = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 1), new THREE.MeshStandardMaterial({ color: 0x7b766e, roughness: 0.95, flatShading: true })); body.scale.set(1.2, 0.9, 1); h = 5.8; }
  else if (o.key === 'block') { body = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 5), PH.PM.wood); h = 5; }
  else if (o.key === 'cyl') { body = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5.5, 24), new THREE.MeshStandardMaterial({ color: 0x5f6368, metalness: 0.8, roughness: 0.4 })); h = 5.5; }
  else { body = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 1 })); body.scale.set(1.1, 0.8, 0.9); h = 6.4; }
  body.position.y = h / 2; body.castShadow = true;
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.12, 6, 14), new THREE.MeshStandardMaterial({ color: 0x3b3b3b })); loop.position.y = h + 0.8;
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 5), loop.material); string.position.y = h + 0.1; string.scale.y = 0.4;
  g.add(body, loop, string);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.4), new THREE.MeshStandardMaterial({ map: PH.label(o.name, { bg: '#f1ead8', fg: '#111', w: 256, h: 72, font: 'bold 30px Arial' }) }));
  tag.rotation.x = -Math.PI / 2; tag.position.set(0, 0.05, 5.4);
  g.add(tag);
  return { group: g, size: [8, h + 2, 8], grip: V3(0, h + 0.8, 0.3), pose: 'pinch', top: h + 1.6 };
}

export default {
  id: 'phy091',
  lab: 'Physics Lab',
  title: 'Measuring force with a spring balance',
  intro: 'Use a spring balance to measure the weight (the force of gravity) of different objects in newtons.',
  board: {
    title: 'Spring balance: weight W = m g',
    formulas: ['W = m g   (g = 9.8 m/s²)', 'Least count = 0.1 N'],
    steps: ['Hang the balance vertically from the stand', 'Check the pointer is at zero; adjust the screw', 'Hang the object gently from the hook', 'Wait until the pointer stops, read at eye level', 'Record the weight in newtons'],
    note: 'Never load beyond the maximum of the scale',
  },
  items: {
    stand: { name: 'Stand with hook', label: 'Stand', build: () => buildStand(), slot: [0, 0, 0], home: [176, 14, 0] },
    bal: { name: 'Spring balance (0–10 N)', label: 'Spring balance', build: () => buildBalance(), slot: [HOOK.x, HOOK.z, 0], slotY: -3 + HOOK.y, homeY: -3 + 0.8, homeRot: [Math.PI / 2, 0, 0], setupText: 'Hang the spring balance vertically from the hook.', why: 'The balance must hang freely and vertically so the spring is not rubbing.' },
    ...Object.fromEntries(OBJECTS.map((o, i) => [o.key, { name: o.name, build: () => objectMesh(o), slot: [30 + (i % 2) * 16, -8 + Math.floor(i / 2) * 18, 0] }])),
  },
  setupOrder: ['stand', 'bal', ...OBJECTS.map((o) => o.key)],
  views: { balance: { label: 'Balance', pos: [18, 44, 40], target: [0, 38, -12] } },
  classicView: 'balance',
  pips: [{ id: 'scale', title: 'Balance scale (eye level)', fov: 24, update: (cam, lab) => { const b = lab.items.bal.app; b.group.updateMatrixWorld(true); const p = b.indicator.getWorldPosition(V3()); cam.position.set(p.x, p.y, p.z + 11); cam.lookAt(p.x, p.y, p.z); }, show: (lab) => lab.items.bal.placed }],
  overlay: '<b>Spring balance</b><span class="big" id="bRead">—</span><div id="bOn"></div>',
  hintExtra: 'click an <b>object</b> to hang it on the balance · click the <b>zero screw</b> to adjust',
  panel: [{
    title: 'Weighing',
    html: `
      <div class="row"><button class="btn ghost act" id="bZero">Adjust zero</button><button class="btn ghost act" id="bOff">Take object off</button></div>
      <div class="row small">Hang: ${OBJECTS.map((o) => `<button class="mini act" data-o="${o.key}">${o.name}</button>`).join('')}</div>
      <div class="meters"><div class="m"><i>Reading</i><b id="bR">—</b></div><div class="m"><i>Zero error</i><b id="bZ">—</b></div></div>`,
    bind: (lab, root) => {
      root.querySelector('#bZero').onclick = () => lab.act(() => adjustZero(lab));
      root.querySelector('#bOff').onclick = () => lab.act(() => unhang(lab));
      root.querySelectorAll('[data-o]').forEach((b) => { b.onclick = () => lab.act(() => hang(lab, b.dataset.o)); });
    },
  }],
  table: { columns: [{ key: 'object', label: 'Object' }, { key: 'F', label: 'Weight F (N)', fmt: (v) => v.toFixed(1) }, { key: 'm', label: 'Mass m = F/g (kg)', fmt: (v) => v.toFixed(3) }], recordLabel: 'Record the reading', note: 'Mass is found from the weight: m = F / g.' },
  record: (lab) => lab.act(() => record(lab)),
  steps: (lab) => [
    { phase: 'Zero check', text: 'Look at the pointer with no load: it is not on zero. Turn the zero-adjusting screw until it is.', why: 'A zero error would be added to every reading.', check: () => Math.abs(lab.x.zero) < 1e-6, demo: () => adjustZero(lab), rings: () => [lab.items.bal.app.screw.getWorldPosition(V3())] },
    ...OBJECTS.map((o, i) => ({ phase: 'Weighing', text: `Hang the ${o.name.toLowerCase()} on the hook, wait until the pointer is at rest, and record its weight.`, why: i === 0 ? 'Lower the object gently: a sudden jerk makes the spring overshoot.' : '', check: () => lab.rows.some((r) => r.key === o.key), demo: async () => { await hang(lab, o.key); await lab.waitFor(() => Math.abs(lab.x.v) < 0.3, 15); await record(lab); await unhang(lab); } })),
  ],
  state: () => ({ zero: 0.3, e: 0.3, v: 0, on: null }),
  init: (lab) => {
    OBJECTS.forEach((o) => lab.actionable(lab.items[o.key].group, { tip: () => (lab.x.on === o.key ? `${o.name} — hanging on the balance` : `${o.name} — click to hang it on the balance`), run: () => hang(lab, o.key), enabled: () => lab.items[o.key].placed && lab.items.bal.placed && lab.x.on !== o.key }));
    lab.actionable(lab.items.bal.app.screw, { tip: 'Zero-adjusting screw — click to set the pointer to zero', run: () => adjustZero(lab), enabled: () => lab.items.bal.placed });
  },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.zero == null) return;
    const m = x.on ? OBJECTS.find((o) => o.key === x.on).m : 0;
    const eq = x.zero + (m * G) / K * 100;
    const M = m + 0.03, w = Math.sqrt(K / M), z = 0.06;
    const n = Math.max(1, Math.ceil(dt / 0.002)), h = dt / n;
    for (let i = 0; i < n; i++) { x.v += (-w * w * (x.e - eq) - 2 * z * w * x.v) * h; x.e += x.v * h; }
    x.e = Math.max(0, x.e);
  },
  update: (lab) => {
    const x = lab.x, b = lab.items.bal.app;
    if (x.zero == null) return;
    b.set(lab.items.bal.placed ? x.e : 0);
    if (x.on && !lab.carried.has(x.on)) {
      const it = lab.items[x.on];
      const hk = b.hookWorld();
      it.group.position.set(hk.x, hk.y - it.app.top - 0.3, hk.z);
    }
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const r = x.e; // 1 cm per newton
    $('bRead').textContent = `${r.toFixed(2)} N`;
    $('bR').textContent = `${r.toFixed(2)} N`;
    $('bZ').textContent = `${x.zero >= 0 ? '+' : ''}${x.zero.toFixed(1)} N`;
    $('bOn').textContent = x.on ? `On the hook: ${OBJECTS.find((o) => o.key === x.on).name}${Math.abs(x.v) > 0.3 ? ' (oscillating)' : ''}` : 'No load';
  },
  chips: (lab) => [[`Zero error: ${lab.x.zero.toFixed(1)} N`, Math.abs(lab.x.zero) < 1e-6 ? 'ok' : 'hot'], [lab.x.on ? 'Loaded' : 'No load', '']],
  result: (lab) => {
    const r = lab.rows;
    return { items: [['Objects weighed', `${r.length} of 4`], ['Heaviest', r.length ? r.reduce((a, b) => (b.F > a.F ? b : a)).object : '—'], ['Total weight', r.length ? `${r.reduce((s, q) => s + q.F, 0).toFixed(1)} N` : '—']], note: r.length >= 4 ? `Actual masses: ${OBJECTS.map((o) => `${o.name} ${o.m.toFixed(3)} kg`).join(', ')}.` : 'A spring balance measures weight (a force). A mass of 1 kg weighs about 9.8 N.' };
  },
  obsRows: 4,
  obsKeys: ['object', 'F'],
  observation: (lab) => ({ rows: lab.rows.map((r) => ({ object: r.object, F: r.F.toFixed(1) })) }),
};

async function adjustZero(lab) {
  const b = lab.items.bal.app;
  await lab.touch(b.screw, async () => {
    const z0 = lab.x.zero;
    await lab.tween(1.0, (e) => { lab.x.zero = z0 * (1 - e); b.screw.rotation.y = e * 6; });
    lab.x.zero = 0;
  });
  lab.toast('Zero adjusted: the pointer now reads 0.0 N with no load.', 'ok');
}
async function hang(lab, key) {
  const x = lab.x;
  if (!lab.items.bal.placed) { lab.toast('Hang the spring balance on the stand first.', 'err'); return; }
  if (x.on === key) return;
  if (x.on) await unhang(lab);
  const it = lab.items[key];
  const from = it.group.position.clone();
  await lab.pickUp(key);
  const hk = lab.items.bal.app.hookWorld();
  await lab.holdAt(key, V3(hk.x, hk.y - it.app.top - 0.3, hk.z), new THREE.Euler(0, 0, 0), { dur: 1.2, arc: 10 });
  lab.releaseCarried(key);
  it.homeSpot = from;
  x.on = key;
  x.v -= 8;
  lab.sfx('tick');
  const R = lab.handR();
  R.setPose('relaxed', 'index');
  await lab.handTo(R, R.goal.clone().add(V3(0, 4, 10)), { dur: 0.4, arc: 0 });
}
async function unhang(lab) {
  const x = lab.x;
  if (!x.on) return;
  const key = x.on, it = lab.items[key];
  await lab.pickUp(key);
  x.on = null;
  x.v += 5;
  const spot = it.slot;
  await lab.putDown(key, V3(spot[0], -3, spot[1]), { rot: 0, slot: true });
}
async function record(lab) {
  const x = lab.x;
  if (!x.on) { lab.toast('Hang an object on the balance first.', 'err'); return; }
  if (Math.abs(x.v) > 0.3) { lab.toast('Wait until the pointer is at rest.', 'warn'); return; }
  const o = OBJECTS.find((q) => q.key === x.on);
  if (lab.rows.some((r) => r.key === o.key)) { lab.toast('Already recorded — hang another object.', 'warn'); return; }
  const b = lab.items.bal.app;
  await lab.touch(b.indicator.getWorldPosition(V3()).add(V3(0, 0, 1.4)), null, { pose: 'point', pitch: -0.1 });
  const F = Math.round(x.e * 10) / 10;
  lab.addRow({ key: o.key, object: o.name, F, m: F / G });
  lab.toast(`${o.name}: ${F.toFixed(1)} N`, 'ok');
  if (Math.abs(x.zero) > 1e-6) lab.toast(`Remember the zero error of ${x.zero.toFixed(1)} N!`, 'warn');
}
