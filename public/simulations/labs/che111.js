// Flame tests for metal ions: a nichrome wire loop is cleaned in
// concentrated HCl and the flame, dipped in a salt and held in the
// non-luminous flame. Potassium's lilac is viewed through cobalt-blue glass.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SALTS = [
  { key: 'nacl', name: 'NaCl', ion: 'Na⁺', colour: 'Golden yellow', hex: 0xffb000, amt: 0.95 },
  { key: 'kcl', name: 'KCl', ion: 'K⁺', colour: 'Lilac (crimson through blue glass)', hex: 0xb07cff, amt: 0.6 },
  { key: 'cacl2', name: 'CaCl₂', ion: 'Ca²⁺', colour: 'Brick red', hex: 0xff4a1c, amt: 0.8 },
  { key: 'srcl2', name: 'SrCl₂', ion: 'Sr²⁺', colour: 'Crimson red', hex: 0xff1030, amt: 0.85 },
  { key: 'cucl2', name: 'CuCl₂', ion: 'Cu²⁺', colour: 'Blue-green', hex: 0x19d7a8, amt: 0.8 },
];
const BURNER = [0, -6];

export default {
  id: 'che111',
  lab: 'Chemistry Lab',
  title: 'Flame test for metal ions',
  intro: 'Identify metal ions from the colours their salts give to a non-luminous Bunsen flame.',
  poster: 'chemsafety',
  board: {
    title: 'Flame tests',
    formulas: ['Na⁺ golden yellow · K⁺ lilac', 'Ca²⁺ brick red · Sr²⁺ crimson', 'Cu²⁺ blue-green · Ba²⁺ apple green'],
    steps: ['Clean the wire: dip in conc. HCl, heat', 'Repeat until the flame shows no colour', 'Dip in HCl, then touch the salt', 'Hold at the edge of the non-luminous flame', 'View K⁺ through cobalt-blue glass'],
    note: 'Clean the loop between every salt!',
  },
  items: {
    burner: { name: 'Bunsen burner', label: 'Bunsen burner', build: () => { const b = C.bunsenBurner(); return Object.assign(b.app, { flame: b.flame, knob: b.knob, collar: b.collar, topWorld: b.topWorld }); }, slot: [BURNER[0], BURNER[1], 0] },
    loop: { name: 'Nichrome wire loop', label: 'Wire loop', build: () => { const w = C.wireLoop(); return Object.assign(w.app, { bead: w.bead, tipLocal: w.tipLocal }); }, slot: [-26, 20, 0], pose: 'pinch' },
    hcl: { name: 'Conc. HCl in a watch glass', label: 'Conc. HCl', build: () => { const g = C.watchGlass(3); const m = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), new THREE.MeshPhysicalMaterial({ color: 0xf1f5f4, transparent: true, opacity: 0.5, roughness: 0.05, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.45; g.group.add(m); return g.app; }, slot: [-44, 6, 0] },
    ...Object.fromEntries(SALTS.map((s, i) => [s.key, { name: `${s.name} (solid)`, label: s.name, build: () => { const d = C.sampleDish(s.name, 0xf4f4f0); return d.app; }, slot: [28 + (i % 3) * 13, -18 + Math.floor(i / 3) * 18, 0], pose: 'pinch' }])),
    glass: { name: 'Cobalt-blue glass', label: 'Blue glass', build: () => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 0.3), new THREE.MeshPhysicalMaterial({ color: 0x1e3aff, transparent: true, opacity: 0.6, roughness: 0.05 })); m.position.y = 0.2; m.rotation.x = -Math.PI / 2; g.add(m); return { group: g, size: [6, 0.4, 4.5], grip: V3(2.8, 0.3, 0), pose: 'pinch', pane: m }; }, slot: [-44, 24, 0] },
  },
  setupOrder: ['burner', 'loop', 'hcl', ...SALTS.map((s) => s.key), 'glass'],
  views: { flame: { label: 'Flame', pos: [BURNER[0] + 14, 22, BURNER[1] + 34], target: [BURNER[0], 12, BURNER[1]] } },
  classicView: 'flame',
  pips: [{ id: 'flame', title: 'The flame', fov: 30, update: (cam, lab) => { const p = lab.items.burner.app.topWorld(); cam.position.set(p.x + 3, p.y + 4, p.z + 20); cam.lookAt(p.x, p.y + 4, p.z); }, show: (lab) => lab.items.burner.placed }],
  overlay: '<b>Flame</b><span class="big" id="fCol">—</span><div id="fLoop"></div>',
  hintExtra: 'click the <b>burner</b> knob to light it · click a <b>salt</b> to test it',
  panel: [{
    title: 'Flame test',
    html: `
      <div class="row"><button class="btn act" id="fLight">Light burner</button><button class="btn ghost act" id="fClean">Clean the loop</button></div>
      <div class="row small">Test: ${SALTS.map((s) => `<button class="mini act" data-s="${s.key}">${s.name}</button>`).join('')}</div>
      <div class="meters"><div class="m"><i>Loop</i><b id="fL">clean?</b></div><div class="m"><i>Flame</i><b id="fF">off</b></div></div>`,
    bind: (lab, root) => {
      root.querySelector('#fLight').onclick = () => lab.act(() => light(lab));
      root.querySelector('#fClean').onclick = () => lab.act(() => clean(lab));
      root.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => lab.act(() => test(lab, b.dataset.s)); });
    },
  }],
  table: { columns: [{ key: 'sample', label: 'Sample' }, { key: 'colour', label: 'Flame colour' }, { key: 'ion', label: 'Metal ion' }], note: 'The loop must give no colour of its own before each test.' },
  steps: (lab) => [
    { phase: 'Prepare', text: 'Open the air hole and light the burner to get a blue, non-luminous flame.', why: 'A luminous (yellow, sooty) flame would hide the colours.', check: () => lab.items.burner.app.flame.on, demo: () => light(lab), rings: () => [lab.items.burner.app.knob.getWorldPosition(V3())] },
    { phase: 'Prepare', text: 'Clean the wire loop: dip it in concentrated HCl and heat it in the flame until it gives no colour.', why: 'HCl turns traces of old salts into volatile chlorides that burn off.', check: () => lab.x.clean && lab.x.cleanedOnce, demo: () => clean(lab) },
    ...SALTS.map((s, i) => ({ phase: 'Salts', text: `${i ? 'Clean the loop again, then d' : 'D'}ip it in HCl and touch it to the ${s.name}; hold it in the edge of the flame and note the colour.`, why: s.key === 'kcl' ? 'Look at the potassium flame through cobalt-blue glass: it absorbs the yellow of any sodium impurity.' : s.key === 'nacl' ? 'The sodium flame is so intense that the tiniest trace of sodium colours every flame yellow.' : '', check: () => lab.rows.some((r) => r.key === s.key), demo: () => test(lab, s.key) })),
  ],
  state: () => ({ clean: false, cleanedOnce: false, on: null, glassUp: false }),
  init: (lab) => {
    const b = lab.items.burner.app;
    lab.actionable(b.knob, { tip: () => `Gas tap — click to ${b.flame.on ? 'turn off' : 'light the burner'}`, run: () => light(lab) });
    SALTS.forEach((s) => lab.actionable(lab.items[s.key].group, { tip: `${s.name} — click to do its flame test`, run: () => test(lab, s.key), enabled: () => lab.items[s.key].placed && lab.items.loop.placed }));
  },
  reset: (lab) => { const f = lab.items.burner.app.flame; f.on = false; f.tintAmt = 0; },
  simulate: (lab, dt) => {
    const x = lab.x, f = lab.items.burner.app.flame;
    if (x.clean == null) return;
    // colour fades as the salt on the loop burns off; the loop glows when hot
    if (x.inFlame && x.salt) { x.saltLeft = Math.max(0, (x.saltLeft ?? 1) - dt / 3.5); } else if (!x.inFlame) x.saltLeft = x.saltLeft ?? 0;
    const s = SALTS.find((q) => q.key === x.salt);
    const target = x.inFlame && s ? s.amt * Math.min(1, (x.saltLeft ?? 0) * 3) : x.inFlame && x.dirty ? 0.35 : 0;
    f.tintAmt += (target - f.tintAmt) * (1 - Math.exp(-dt * 8));
    if (s) f.tintColor.set(x.glassUp && s.key === 'kcl' ? 0xd6004f : s.hex); else if (x.dirty) f.tintColor.set(0xffb000);
  },
  update: (lab, dt, t) => {
    C.update(dt, t);
    const loop = lab.items.loop.app;
    loop.bead.material.opacity = lab.x.salt && (lab.x.saltLeft ?? 0) > 0.05 ? 0.9 : 0;
  },
  chips: (lab) => [[`Burner: ${lab.items.burner.app.flame.on ? 'lit' : 'off'}`, lab.items.burner.app.flame.on ? 'ok' : ''], [`Loop: ${lab.x.clean ? 'clean' : 'not clean'}`, lab.x.clean ? 'ok' : 'hot']],
  ui: (lab) => {
    const $ = (id) => document.getElementById(id), x = lab.x, f = lab.items.burner.app.flame;
    const s = SALTS.find((q) => q.key === x.salt);
    $('fCol').textContent = !f.on ? 'burner off' : f.tintAmt > 0.2 && s ? (x.glassUp && s.key === 'kcl' ? 'crimson (through blue glass)' : s.colour.split(' (')[0].toLowerCase()) : f.tintAmt > 0.2 ? 'yellow (dirty loop)' : 'pale blue';
    $('fLoop').textContent = `Loop: ${x.clean ? 'clean' : x.salt ? `carrying ${s.name}` : 'not cleaned'}`;
    $('fL').textContent = x.clean ? 'clean' : 'not clean'; $('fL').className = x.clean ? 'ok' : 'warn';
    $('fF').textContent = f.on ? 'lit' : 'off';
    $('fLight').textContent = f.on ? 'Turn off burner' : 'Light burner';
  },
  result: (lab) => ({ items: [['Salts tested', `${lab.rows.length} of ${SALTS.length}`]], note: 'Heated metal ions give out light of particular colours as excited electrons fall back to lower energy levels.' }),
  obsRows: 5,
  obsKeys: ['sample', 'colour', 'ion'],
  observation: (lab) => ({ rows: lab.rows.map((r) => ({ sample: r.sample, colour: r.colour, ion: r.ion })) }),
};

// ---------------------------------------------------------------------------

async function light(lab) {
  const f = lab.items.burner.app.flame;
  await lab.touch(lab.items.burner.app.knob, () => { f.on = !f.on; lab.sfx('click'); }, { pose: 'pinch' });
  if (f.on) lab.toast('Burner lit — air hole open: a pale blue, non-luminous flame.', 'info', 3000);
}
// Hold the loop so that its tip is at world point p, pointing in from the right
async function loopTo(lab, p, dur = 1.0) {
  const it = lab.items.loop;
  const e = new THREE.Euler(0, Math.PI, 0.25);
  const q = new THREE.Quaternion().setFromEuler(e);
  const pos = p.clone().sub(it.app.tipLocal.clone().applyQuaternion(q));
  await lab.holdAt('loop', pos, e, { dur, arc: 6 });
}
async function intoFlame(lab, secs) {
  const f = lab.items.burner.app.topWorld().add(V3(0, 3, 0));
  await loopTo(lab, f.clone().add(V3(0.6, 0, 0)), 0.9);
  lab.x.inFlame = true;
  await lab.wait(secs);
  lab.x.inFlame = false;
}
async function dip(lab, key) {
  const g = lab.items[key].group;
  await loopTo(lab, g.localToWorld(V3(0, 0.6, 0)), 1.0);
  await lab.wait(0.35);
}
async function clean(lab) {
  const x = lab.x;
  if (!lab.items.burner.app.flame.on) await light(lab);
  if (!lab.carried.has('loop')) await lab.pickUp('loop');
  x.dirty = !x.cleanedOnce; // a new loop still shows a yellow sodium flame at first
  for (let i = 0; i < 2; i++) {
    await dip(lab, 'hcl');
    x.salt = null;
    await intoFlame(lab, 1.4);
    x.dirty = false;
  }
  x.clean = true; x.cleanedOnce = true;
  lab.toast('The loop gives no colour to the flame: it is clean.', 'info', 3000);
}
async function test(lab, key) {
  const x = lab.x, s = SALTS.find((q) => q.key === key);
  if (!x.clean) await clean(lab);
  if (!lab.carried.has('loop')) await lab.pickUp('loop');
  await dip(lab, 'hcl');
  await dip(lab, key);
  x.salt = key; x.saltLeft = 1; x.clean = false;
  if (key === 'kcl') await blueGlass(lab, true);
  await intoFlame(lab, 2.2);
  const row = { key, sample: s.name, colour: s.colour, ion: s.ion };
  if (!lab.rows.some((r) => r.key === key)) lab.addRow(row);
  lab.toast(`${s.name}: ${s.colour.toLowerCase()} flame → ${s.ion}`, 'ok', 4500);
  if (key === 'kcl') await blueGlass(lab, false);
  await lab.putBack('loop');
}
async function blueGlass(lab, up) {
  const g = lab.items.glass, L = lab.handL();
  if (up) {
    const eye = lab.avatar && lab.mode !== 'classic' ? lab.avatar.eyeWorld() : lab.camera.position.clone();
    const f = lab.items.burner.app.topWorld().add(V3(0, 4, 0));
    const pos = f.clone().lerp(eye, 0.35);
    await lab.handTo(L, g.group.localToWorld(V3(2.8, 0.4, 0)), { pose: 'pinch', contact: 'pinch', dur: 0.6 });
    lab.scene.attach(g.group);
    const s0 = g.group.position.clone();
    await lab.tween(0.9, (e) => { g.group.position.lerpVectors(s0, pos, e); g.group.rotation.set(Math.PI / 2 * e, 0, 0); L.goal.copy(g.group.position).add(V3(2.8, 0, 0)); });
    lab.x.glassUp = true;
  } else {
    lab.x.glassUp = false;
    lab.placeAtSlot('glass');
    L.setPose('flat', 'palm');
  }
}
