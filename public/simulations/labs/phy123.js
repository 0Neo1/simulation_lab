// Potentiometer: compare the e.m.f.s of a Leclanché and a Daniell cell.
// A 10-wire (1000 cm) potentiometer with a driver battery, key and rheostat;
// the cells, two-way key, galvanometer and jockey form the secondary circuit.
// Everything the student wires is solved by nodal analysis.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const NW = 10, Z0 = -32, DZ = 4, TOP = 0, WIRE_Y = 0.55, K_WIRE = 0.004; // Ω per cm
const lToXZ = (l) => {
  const i = Math.min(NW - 1, Math.max(0, Math.floor(l / 100 - 1e-9)));
  const s = l - i * 100;
  return { x: i % 2 === 0 ? -50 + s : 50 - s, z: Z0 + i * DZ, i, s };
};
const xzToL = (x, z) => {
  const i = THREE.MathUtils.clamp(Math.round((z - Z0) / DZ), 0, NW - 1);
  const s = THREE.MathUtils.clamp(i % 2 === 0 ? x + 50 : 50 - x, 0, 100);
  return i * 100 + s;
};

function buildBoard(M) {
  const group = new THREE.Group();
  const terms = {};
  const base = new THREE.Mesh(new THREE.BoxGeometry(112, 3, 48), [M.boardSide, M.boardSide, M.board, M.boardSide, M.boardSide, M.boardSide]);
  base.position.set(0, -1.5, Z0 + 18);
  base.receiveShadow = true; base.castShadow = true;
  group.add(base);
  const scaleTex = PH.scaleTexture(100, { vertical: false, bg: '#efe2bf' });
  const scaleMat = new THREE.MeshStandardMaterial({ map: scaleTex, roughness: 0.6 });
  const wireMat = new THREE.MeshStandardMaterial({ color: 0xd4b28a, metalness: 1, roughness: 0.25 });
  for (let i = 0; i < NW; i++) {
    const z = Z0 + i * DZ;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 100, 6), wireMat);
    w.rotation.z = Math.PI / 2; w.position.set(0, WIRE_Y, z);
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(100, 1.5), scaleMat);
    strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.02, z + 1.4);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshStandardMaterial({ map: PH.label(String(i + 1), { bg: '#1f2937', fg: '#fde68a', w: 96, h: 64, font: 'bold 44px Arial' }) }));
    num.rotation.x = -Math.PI / 2; num.position.set(-54.5, 0.03, z + 1.2);
    group.add(w, strip, num);
  }
  const copper = new THREE.MeshStandardMaterial({ color: 0xc27a4a, metalness: 1, roughness: 0.3 });
  for (let i = 0; i < NW - 1; i++) {
    const right = i % 2 === 0;
    const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, DZ + 1.4), copper);
    s.position.set(right ? 51.5 : -51.5, 0.3, Z0 + i * DZ + DZ / 2);
    s.castShadow = true;
    group.add(s);
  }
  const pad = (x, z) => { const p = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 2.4), copper); p.position.set(x, 0.3, z); group.add(p); };
  pad(-52.5, Z0); pad(-52.5, Z0 + (NW - 1) * DZ);
  PH.terminal(M, group, terms, 'A', V3(-53.5, 0.5, Z0 - 2.2), 'Potentiometer end A (0 cm)');
  PH.terminal(M, group, terms, 'B', V3(-53.5, 0.5, Z0 + (NW - 1) * DZ + 2.2), 'Potentiometer end B (1000 cm)');
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  spark.userData.noPick = true;
  group.add(spark);
  return { group, terminals: terms, spark, size: [112, 3, 48], grip: V3(0, 1, 10) };
}

const RH_SETS = [3, 4.5, 6];

export default {
  id: 'phy123',
  lab: 'Physics Lab',
  title: 'Potentiometer — comparing the e.m.f.s of two cells',
  intro: 'Compare the e.m.f.s of a Leclanché cell and a Daniell cell with a ten-wire potentiometer: E₁/E₂ = l₁/l₂.',
  wiring: true,
  board: {
    title: 'Potentiometer: E₁ / E₂ = l₁ / l₂',
    formulas: ['E = k l   (k = potential gradient)', 'E₁ / E₂ = l₁ / l₂'],
    steps: ['Driver: battery → key → A … B → rheostat → battery', '+ of both cells to A (same as driver +)', '− of cells to the two-way key; common → G → jockey', 'Opposite deflections at the two ends', 'Find null for E₁ (l₁) and for E₂ (l₂)', 'Repeat for 3 rheostat settings'],
    note: 'Driver e.m.f. must exceed both cell e.m.f.s',
  },
  items: {
    board: { name: 'Ten-wire potentiometer', label: 'Potentiometer (1000 cm)', build: (lab) => buildBoard(lab.M), slot: [0, 0, 0], slotY: 0, fixed: true, labelY: 2 },
    bat: { name: 'Driver battery (4.5 V)', label: 'Driver battery', build: (lab) => PH.battery(lab.M, { cells: 3, name: 'Driver battery' }), slot: [-98, -22, 0] },
    key: { name: 'Plug key K', label: 'Key K', build: (lab) => PH.plugKey(lab.M), slot: [-80, -2, 0] },
    rh: { name: 'Rheostat (20 Ω)', label: 'Rheostat', build: (lab) => PH.rheostat(lab.M, { Rmax: 20 }), slot: [-86, 26, 0] },
    e1: { name: 'Leclanché cell E₁', label: 'Leclanché E₁', build: (lab) => PH.wetCell(lab.M, 'leclanche', 'Leclanché cell E₁'), slot: [72, -26, 0] },
    e2: { name: 'Daniell cell E₂', label: 'Daniell E₂', build: (lab) => PH.wetCell(lab.M, 'daniell', 'Daniell cell E₂'), slot: [96, -26, 0] },
    k2: { name: 'Two-way key', label: 'Two-way key', build: (lab) => PH.twoWayKey(lab.M), slot: [84, -2, 0] },
    galv: { name: 'Galvanometer', label: 'Galvanometer', build: (lab) => lab.S.buildGalvanometer(lab.M), slot: [84, 24, 0] },
    jockey: { name: 'Jockey', build: (lab) => lab.S.buildJockey(lab.M), slot: [-45, Z0, 0], slotY: WIRE_Y + 1.2, pose: 'pinch', setupText: 'Stand the jockey on the first wire of the potentiometer.', why: 'The knife-edge touches the wire only while pressed; never slide it while pressed.' },
  },
  setupOrder: ['bat', 'key', 'rh', 'e1', 'e2', 'k2', 'galv', 'jockey'],
  leadColor: (a) => (a === 'bat.+' ? 'red' : a === 'bat.-' ? 'black' : a.startsWith('e1') || a.startsWith('e2') ? 'yellow' : a.startsWith('galv') || a === 'jockey.T' ? 'green' : 'blue'),
  views: {
    board: { label: 'Potentiometer', pos: [0, 60, 50], target: [0, -2, -14] },
    cells: { label: 'Cells & keys', pos: [86, 30, 44], target: [86, 0, -4] },
  },
  classicView: 'setup',
  pips: [
    { id: 'loupe', title: 'Jockey on the wire · read l here', fov: 26, update: (cam, lab) => { const p = lToXZ(lab.x.l); cam.position.set(p.x, 11, p.z + 11); cam.lookAt(p.x, 0.5, p.z + 1.2); }, show: (lab) => lab.items.jockey.placed },
    { id: 'galv', title: 'Galvanometer', fov: 30, update: (cam, lab) => { const g = lab.items.galv.group.position; cam.position.set(g.x, g.y + 6.5 + 17, g.z + 9); cam.lookAt(g.x, g.y + 6.5, g.z - 0.4); }, show: (lab) => lab.items.galv.placed },
  ],
  overlay: '<b>Balance lengths</b><span class="big" id="dL">l = 0.0 cm</span><div id="dCell"></div><div id="dPend"></div>',
  hintExtra: 'drag the <b>jockey</b> across the wires, click it (or <b>Space</b>) to press · click the <b>key</b> plugs and the <b>HR</b> knob',
  panel: [{
    title: 'Circuit',
    html: `
      <div class="row"><button class="btn act" id="pKey">Insert key K</button><button class="btn ghost act" id="pHR">Remove HR</button></div>
      <div class="row"><button class="btn ghost act" id="pE1">E₁ into circuit</button><button class="btn ghost act" id="pE2">E₂ into circuit</button></div>
      <label class="lbl">Rheostat <span class="big" id="pRh">—</span></label>
      <input type="range" id="pSlider" min="0" max="1" step="0.005" value="0.2" />
      <label class="lbl">Jockey position <span class="big" id="pL">0.0 cm</span></label>
      <input type="range" id="pLS" min="0" max="1000" step="0.1" value="0" />
      <div class="row"><button class="btn press" id="pPress">Hold to press</button><button class="btn ghost act" id="pHunt">Find null (demo)</button></div>
      <div class="meters">
        <div class="m"><i>Deflection</i><b id="pDiv">0.0 div</b></div>
        <div class="m"><i>Galv. current</i><b id="pIg">0 μA</b></div>
        <div class="m"><i>Driver current</i><b id="pId">0 mA</b></div>
        <div class="m"><i>Potential gradient</i><b id="pK">—</b></div>
      </div>`,
    bind: (lab, root) => {
      const $ = (id) => root.querySelector(`#${id}`);
      $('pKey').onclick = () => lab.act(() => pressKey(lab));
      $('pHR').onclick = () => lab.act(() => toggleHR(lab));
      $('pE1').onclick = () => lab.act(() => selectCell(lab, 0));
      $('pE2').onclick = () => lab.act(() => selectCell(lab, 1));
      $('pSlider').oninput = (e) => { if (!lab.autopilot) lab.items.rh.app.set(+e.target.value); };
      $('pLS').oninput = (e) => { if (!lab.autopilot) setL(lab, +e.target.value); };
      $('pHunt').onclick = () => lab.act(() => huntNull(lab));
      const b = $('pPress');
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); lab.state.holdSources.add('button'); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => lab.state.holdSources.delete('button')));
    },
  }],
  table: {
    columns: [
      { key: 'Rh', label: 'Rheostat (Ω)', fmt: (v) => v.toFixed(1) },
      { key: 'l1', label: 'l₁ (cm)', fmt: (v) => v.toFixed(1) },
      { key: 'l2', label: 'l₂ (cm)', fmt: (v) => v.toFixed(1) },
      { key: 'ratio', label: 'l₁/l₂', fmt: (v) => v.toFixed(3) },
    ],
    recordLabel: 'Record balance length for the cell in circuit',
    note: 'Record l₁ (E₁ in circuit) and l₂ (E₂ in circuit) for each rheostat setting; three sets in all.',
  },
  record: (lab) => recordLength(lab),
  steps: (lab) => {
    const W = () => wiring(lab);
    const conn = (text, check, pairs, why, phase = 'Primary circuit') => ({ phase, text, why, check, terms: pairs.flat(), demo: async () => { for (const [a, b] of pairs) if (!joined(lab, a, b)) await lab.demoConnect(a, b); } });
    const list = [
      conn('Connect the driver battery (+) to one terminal of key K.', () => W().batKey, [['bat.+', 'key.1']], 'The driver circuit maintains a steady current, and so a steady potential gradient, along the wire.'),
      conn('Connect the other terminal of key K to end A of the potentiometer.', () => W().keyA, [['key.2', 'board.A']]),
      conn('Connect end B of the potentiometer to end A of the rheostat.', () => W().bRh, [['board.B', 'rh.A']]),
      conn('Connect the rheostat slider C to the battery (−).', () => W().rhBat, [['rh.C', 'bat.-']], 'The rheostat sets the current, and so the potential gradient, in the wire.'),
      conn('Connect the (+) terminals of both cells to end A.', () => W().cellsA, [['e1.+', 'board.A'], ['e2.+', 'board.A']], 'Positive terminals of the cells go to the point where the driver battery’s positive terminal is connected — otherwise no null point exists.', 'Secondary circuit'),
      conn('Connect E₁ (−) to terminal 1 and E₂ (−) to terminal 2 of the two-way key.', () => W().cellsK, [['e1.-', 'k2.1'], ['e2.-', 'k2.2']], 'The two-way key lets you put either cell into the galvanometer circuit.', 'Secondary circuit'),
      conn('Connect the common terminal C of the two-way key to the galvanometer, and the galvanometer to the jockey.', () => W().galv, [['k2.C', 'galv.+'], ['galv.-', 'jockey.T']], '', 'Secondary circuit'),
      { phase: 'Check the circuit', text: 'Insert key K and set the rheostat to about 3 Ω.', why: 'A small rheostat resistance gives a large current, so both null points lie well on the wire.', check: () => lab.x.keyIn && Math.abs(lab.items.rh.app.f * 20 - RH_SETS[0]) < 0.8, demo: async () => { if (!lab.x.keyIn) await pressKey(lab); await slideRh(lab, RH_SETS[0] / 20); } },
      { phase: 'Check the circuit', text: 'Put E₁ in circuit and, with HR in, press the jockey near end A and then near end B: the deflections must be opposite.', why: 'Opposite deflections prove that the null point for E₁ lies on the wire.', check: () => endsOk(lab, 0), demo: async () => { if (lab.x.cell !== 0) await selectCell(lab, 0); if (!lab.x.hr) await toggleHR(lab); await probe(lab, 5); await probe(lab, 995); } },
      { phase: 'Check the circuit', text: 'Do the same with E₂ in circuit.', check: () => endsOk(lab, 1), demo: async () => { if (lab.x.cell !== 1) await selectCell(lab, 1); if (!lab.x.hr) await toggleHR(lab); await probe(lab, 5); await probe(lab, 995); } },
    ];
    RH_SETS.forEach((rh, k) => {
      const ph = `Set ${k + 1}: rheostat ${rh} Ω`;
      list.push(
        { phase: ph, text: k === 0 ? 'With E₁ in circuit, remove HR and find the null point; record l₁.' : `Set the rheostat to ${rh} Ω, put E₁ in circuit, find the null point and record l₁.`, why: 'Tap the jockey — do not slide it while pressed. Remove HR near the null for full sensitivity.', check: () => lab.rows.length > k || (lab.x.pend.l1 != null && lab.rows.length === k), demo: async () => { if (Math.abs(lab.items.rh.app.f * 20 - rh) > 0.05) await slideRh(lab, rh / 20); if (lab.x.cell !== 0) await selectCell(lab, 0); await huntNull(lab); await recordLength(lab); } },
        { phase: ph, text: 'Switch the two-way key to E₂, find its null point and record l₂.', why: 'Do not touch the rheostat between l₁ and l₂: the potential gradient must stay the same.', check: () => lab.rows.length > k, demo: async () => { if (lab.x.cell !== 1) await selectCell(lab, 1); await huntNull(lab); await recordLength(lab); } },
      );
    });
    return list;
  },
  state: () => ({
    l: 0, lift: 1.2, keyIn: false, cell: -1, hr: true, needle: { theta: 0, omega: 0 }, probe: null, ends: [{}, {}],
    pend: { l1: null, l2: null, Rh: null }, E1: 1.40 + Math.random() * 0.1, E2: 1.05 + Math.random() * 0.05, sol: {}, settle: 0, prev: false, warned: 0,
  }),
  init: (lab) => {
    const j = lab.items.jockey;
    let l0 = 0;
    lab.actionable(j.group, {
      tip: () => (j.placed ? `Jockey at ${lab.x.l.toFixed(1)} cm — drag to move, click to press` : 'Jockey — drag onto the potentiometer'),
      enabled: () => j.placed,
      drag: {
        start: () => { l0 = lab.x.l; },
        move: (p) => { setL(lab, xzToL(p.x, p.z)); },
        end: (moved) => { if (!moved) { lab.state.holdSources.add('tap'); setTimeout(() => lab.state.holdSources.delete('tap'), 700); } void l0; },
        hand: () => j.group.localToWorld(j.app.grip.clone()),
      },
    });
    const key = lab.items.key.app.plug;
    lab.actionable(key, { tip: () => `Key K — click to ${lab.x.keyIn ? 'remove' : 'insert'} the plug`, run: () => pressKey(lab) });
    lab.items.k2.app.plugs.forEach((p, i) => lab.actionable(p, { tip: () => `Two-way key — put ${i ? 'E₂' : 'E₁'} in circuit`, run: () => selectCell(lab, i) }));
    lab.actionable(lab.items.galv.app.knob, { tip: () => `High resistance — click to ${lab.x.hr ? 'remove' : 'put in'}`, run: () => toggleHR(lab) });
    const rh = lab.items.rh.app;
    let f0 = 0;
    lab.actionable(rh.slider, {
      tip: () => `Rheostat slider — ${(rh.f * 20).toFixed(1)} Ω in circuit, drag to change`,
      drag: { start: () => { f0 = rh.f; }, move: (p, s) => { rh.set(f0 + (rh.group.worldToLocal(p.clone()).x - rh.group.worldToLocal(s.clone()).x) / rh.length); }, hand: () => rh.knobWorld() },
    });
  },
  reset: (lab) => {
    lab.items.key.app.plug.userData.inserted = false;
    lab.items.k2.app.plugs.forEach((p) => { p.userData.inserted = false; });
    lab.items.rh.app.set(0.5);
  },
  onPlace: null,
  quickSetup: (lab) => {
    [['bat.+', 'key.1'], ['key.2', 'board.A'], ['board.B', 'rh.A'], ['rh.C', 'bat.-'], ['e1.+', 'board.A'], ['e2.+', 'board.A'], ['e1.-', 'k2.1'], ['e2.-', 'k2.2'], ['k2.C', 'galv.+'], ['galv.-', 'jockey.T']]
      .forEach(([a, b]) => lab.connect(a, b, null, true));
    lab.x.ends = [{ lo: -1, hi: 1 }, { lo: -1, hi: 1 }];
  },
  onKey: (lab, e, down) => {
    if (e.code === 'Space') { if (down) lab.state.holdSources.add('space'); else lab.state.holdSources.delete('space'); e.preventDefault(); }
    if (down && (e.code === 'ArrowLeft' || e.code === 'ArrowRight') && e.target.type !== 'range') { setL(lab, lab.x.l + (e.code === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 0.1)); e.preventDefault(); }
  },
  simulate: (lab, dt) => {
    const x = lab.x;
    if (x.l == null) return;
    const hold = lab.state.holdSources.size > 0 && lab.items.jockey.placed && !lab.carried.has('jockey');
    x.lift = THREE.MathUtils.damp(x.lift, hold ? 0 : 1.2, hold ? 22 : 12, dt);
    if (hold && x.lift < 0.04) x.lift = 0;
    PH.animatePlug(lab.items.key.app.plug, dt);
    lab.items.k2.app.plugs.forEach((p) => PH.animatePlug(p, dt));
    const contact = x.lift < 0.04 && lab.items.jockey.placed;
    const sol = solve(lab, contact);
    x.sol = sol;
    x.needle = lab.P.stepNeedle(x.needle, lab.P.deflection(sol.Ig) + (contact ? (Math.random() - 0.5) * 0.06 : 0), dt);
    if (contact && sol.driverOk) {
      x.settle = x.prev ? x.settle + dt : 0;
      if (x.settle > 0.6 && (Math.abs(x.needle.omega) < 3 || Math.abs(x.needle.theta) > lab.P.GALV.maxDiv)) {
        x.probe = { l: x.l, div: x.needle.theta, hr: x.hr, cell: x.cell, seq: (x.probe?.seq || 0) + 1 };
        if (x.cell >= 0 && x.hr) { if (x.l < 50) x.ends[x.cell].lo = x.needle.theta; if (x.l > 950) x.ends[x.cell].hi = x.needle.theta; }
      }
    }
    x.prev = contact;
    if (Math.abs(sol.Ibat) > 3 && performance.now() - x.warned > 6000) { x.warned = performance.now(); lab.toast('Short circuit in the driver circuit! Remove key K and check the leads.', 'err'); lab.sfx('buzz'); }
  },
  update: (lab) => {
    const x = lab.x, j = lab.items.jockey;
    if (x.l == null) return;
    if (j.placed && !lab.carried.has('jockey')) {
      const p = lToXZ(x.l);
      j.group.position.set(p.x, WIRE_Y + x.lift, p.z);
      j.group.rotation.set(0, 0, -0.08);
    }
    lab.items.galv.app.pivot.rotation.y = -(x.needle.theta / lab.P.GALV.maxDiv) * THREE.MathUtils.degToRad(48);
    lab.items.galv.app.knob.rotation.y = x.hr ? 0.8 : -0.8;
  },
  onDrop: (lab, key, pos) => {
    if (key !== 'jockey') return false;
    if (Math.abs(pos.x) < 52 && pos.z > Z0 - 3 && pos.z < Z0 + NW * DZ) { lab.x.l = xzToL(pos.x, pos.z); lab.placeAtSlot('jockey'); return true; }
    return false;
  },
  chips: (lab) => {
    const x = lab.x, w = wiring(lab);
    return [
      [`Key K: ${x.keyIn ? 'in' : 'out'}`, x.keyIn ? 'ok' : ''],
      [`In circuit: ${x.cell === 0 ? 'E₁ (Leclanché)' : x.cell === 1 ? 'E₂ (Daniell)' : 'no cell'}`, x.cell >= 0 ? 'ok' : ''],
      [`HR: ${x.hr ? 'in' : 'out (sensitive)'}`, x.hr ? '' : 'hot'],
      [`Circuit: ${w.complete ? 'complete' : `${lab.leads.length} leads`}`, w.complete ? 'ok' : ''],
    ];
  },
  ui: (lab) => {
    const x = lab.x, $ = (id) => document.getElementById(id);
    const s = x.sol || {};
    $('pKey').textContent = x.keyIn ? 'Remove key K' : 'Insert key K';
    $('pKey').classList.toggle('on', x.keyIn);
    $('pHR').textContent = x.hr ? 'Remove HR (fine null)' : 'Put HR back in';
    $('pRh').textContent = `${(lab.items.rh.app.f * 20).toFixed(1)} Ω`;
    $('pSlider').value = lab.items.rh.app.f;
    $('pL').textContent = `${x.l.toFixed(1)} cm`; $('pLS').value = x.l;
    const p = lToXZ(x.l);
    $('dL').textContent = `l = ${x.l.toFixed(1)} cm`;
    $('dCell').textContent = `wire ${p.i + 1}, scale ${(p.i % 2 === 0 ? p.s : 100 - p.s).toFixed(1)} cm${p.i % 2 ? ' (reads right→left)' : ''}`;
    $('dPend').textContent = `this set: l₁ = ${x.pend.l1 != null ? x.pend.l1.toFixed(1) : '—'}, l₂ = ${x.pend.l2 != null ? x.pend.l2.toFixed(1) : '—'}`;
    $('pDiv').textContent = `${x.needle.theta >= 0 ? '+' : ''}${x.needle.theta.toFixed(1)} div`;
    $('pIg').textContent = `${((s.Ig || 0) * 1e6).toFixed(1)} μA`;
    $('pId').textContent = `${((s.Iwire || 0) * 1000).toFixed(0)} mA`;
    $('pK').textContent = s.Iwire ? `${(s.Iwire * K_WIRE * 1000).toFixed(3)} mV/cm` : '—';
    $('pPress').classList.toggle('active', x.lift < 0.04);
  },
  result: (lab) => {
    const r = lab.rows;
    if (!r.length) return { items: [['Mean E₁/E₂', '—'], ['Actual', 'hidden']], note: 'Record l₁ and l₂ for three rheostat settings.' };
    const m = r.reduce((s, x) => s + x.ratio, 0) / r.length;
    const act = lab.x.E1 / lab.x.E2;
    const reveal = r.length >= 3;
    return { items: [['Mean E₁/E₂ = l₁/l₂', m.toFixed(3)], ['Actual (after 3 sets)', reveal ? act.toFixed(3) : 'hidden'], ['Error', reveal ? `${(((m - act) / act) * 100).toFixed(2)} %` : '—'], ['E₁ if E₂ = 1.08 V', `${(m * 1.08).toFixed(3)} V`]], note: 'l₁ and l₂ change with the rheostat setting, but their ratio stays the same — it depends only on the cells.' };
  },
  obsRows: 3,
  obsKeys: ['l1', 'l2', 'ratio'],
  observation: (lab) => ({ rows: lab.rows.map((r) => ({ l1: r.l1.toFixed(1), l2: r.l2.toFixed(1), ratio: r.ratio.toFixed(3) })) }),
  checkFault: (lab) => {
    const f = lab.topology(), same = (a, b) => f(a) === f(b);
    if (same('bat.+', 'bat.-')) return 'That lead short-circuits the driver battery!';
    if (same('e1.+', 'e1.-') || same('e2.+', 'e2.-')) return 'That lead short-circuits a cell!';
    if (same('board.A', 'board.B')) return 'Ends A and B are joined — the potentiometer wire is shorted.';
    if (same('e1.-', 'board.A') || same('e2.-', 'board.A')) return 'A cell’s negative terminal is at A: its positive terminal must go to A instead.';
    return null;
  },
};

// ---------------------------------------------------------------------------

function joined(lab, a, b) { const f = lab.topology(); return f(a) === f(b); }
function wiring(lab) {
  const f = lab.topology(), s = (a, b) => f(a) === f(b);
  const ko = s('bat.+', 'key.1') ? 'key.2' : s('bat.+', 'key.2') ? 'key.1' : null;
  const batKey = !!ko, keyA = !!ko && s(ko, 'board.A');
  const bRh = s('board.B', 'rh.A') || s('board.B', 'rh.B');
  const rhBat = s('rh.C', 'bat.-');
  const cellsA = s('e1.+', 'board.A') && s('e2.+', 'board.A');
  const cellsK = s('e1.-', 'k2.1') && s('e2.-', 'k2.2');
  const g = s('k2.C', 'galv.+') ? 'galv.-' : s('k2.C', 'galv.-') ? 'galv.+' : null;
  const galv = !!g && s(g, 'jockey.T');
  return { batKey, keyA, bRh, rhBat, cellsA, cellsK, galv, complete: batKey && keyA && bRh && rhBat && cellsA && cellsK && galv };
}
function solve(lab, pressed, { l = lab.x.l, hr = lab.x.hr, cell = lab.x.cell, keyIn = lab.x.keyIn } = {}) {
  const x = lab.x, rh = lab.items.rh.app;
  const el = [], add = (e) => { el.push(e); return e; };
  const bat = add({ a: 'bat.+', b: 'bat.-', emf: 4.5, r: 0.3 });
  if (keyIn) add({ a: 'key.1', b: 'key.2', R: 0.002 });
  add({ a: 'rh.A', b: 'rh.C', R: rh.f * rh.Rmax + 0.02 });
  add({ a: 'rh.C', b: 'rh.B', R: (1 - rh.f) * rh.Rmax + 0.02 });
  const lc = THREE.MathUtils.clamp(l, 0, 1000);
  const wa = add({ a: 'board.A', b: 'D', R: K_WIRE * lc + 1e-4 });
  add({ a: 'D', b: 'board.B', R: K_WIRE * (1000 - lc) + 1e-4 });
  if (pressed) add({ a: 'jockey.T', b: 'D', R: 0.05 });
  add({ a: 'e1.+', b: 'e1.-', emf: x.E1, r: 1.2 });
  add({ a: 'e2.+', b: 'e2.-', emf: x.E2, r: 2.0 });
  if (cell === 0) add({ a: 'k2.1', b: 'k2.C', R: 0.002 });
  if (cell === 1) add({ a: 'k2.2', b: 'k2.C', R: 0.002 });
  const g = add({ a: 'galv.+', b: 'galv.-', R: lab.P.GALV.resistance + (hr ? lab.P.GALV.protection : 0) });
  for (const L of lab.leads) add({ a: L.a, b: L.b, R: 0.015 });
  const net = lab.P.solveNetwork(el, 'bat.-');
  const Iwire = Math.abs(net.current(wa));
  return { Ig: net.current(g), Ibat: net.current(bat), Iwire, driverOk: Iwire > 0.01 };
}
function findNull(lab) {
  const f = (l) => solve(lab, true, { l, hr: false }).Ig;
  let lo = 0.5, hi = 999.5, flo = f(lo);
  if (Math.sign(flo) === Math.sign(f(hi))) return null;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2, fm = f(m); if (Math.sign(fm) === Math.sign(flo)) { lo = m; flo = fm; } else hi = m; }
  return (lo + hi) / 2;
}
const endsOk = (lab, c) => { const e = lab.x.ends[c]; return e.lo != null && e.hi != null && Math.sign(e.lo) !== Math.sign(e.hi); };
function setL(lab, l) { lab.x.l = Math.round(THREE.MathUtils.clamp(l, 0, 1000) * 10) / 10; }

async function pressKey(lab) {
  const p = lab.items.key.app.plug;
  await lab.touch(p, () => { lab.x.keyIn = !lab.x.keyIn; p.userData.inserted = lab.x.keyIn; lab.sfx('click'); });
}
async function selectCell(lab, i) {
  const plugs = lab.items.k2.app.plugs;
  const cur = lab.x.cell;
  if (cur >= 0 && cur !== i) await lab.touch(plugs[cur], () => { plugs[cur].userData.inserted = false; lab.sfx('click'); });
  await lab.touch(plugs[i], () => { const on = lab.x.cell !== i; plugs[i].userData.inserted = on; lab.x.cell = on ? i : -1; lab.x.probe = null; lab.sfx('click'); });
}
async function toggleHR(lab) {
  await lab.touch(lab.items.galv.app.knob, () => { lab.x.hr = !lab.x.hr; lab.x.probe = null; lab.sfx('click'); });
}
async function slideRh(lab, f) {
  const rh = lab.items.rh.app, R = lab.handR();
  await lab.touch(rh.knobWorld().add(V3(0, 0.8, 0)), null);
  const f0 = rh.f;
  await lab.tween(0.5 + Math.abs(f - f0) * 1.5, (e) => { rh.set(f0 + (f - f0) * e); R.goal.copy(rh.knobWorld()).add(V3(0, 0.8, 0)); });
  lab.x.probe = null;
}
// Slide the (lifted) jockey to l, then press it until the galvanometer settles
async function probe(lab, l) {
  const x = lab.x, j = lab.items.jockey, R = lab.handR();
  const grip = () => j.group.localToWorld(j.app.grip.clone());
  await lab.approach(grip());
  await lab.handTo(R, grip(), { pose: 'pinch', contact: 'pinch', dur: 0.5, arc: 4, pitch: -0.25 });
  const l0 = x.l;
  const a = lToXZ(l0), b = lToXZ(l);
  const hop = a.i !== b.i;
  await lab.tween(Math.min(1.6, 0.3 + Math.abs(l - l0) / 400 + (hop ? 0.4 : 0)), (e) => {
    if (hop) { const p = V3(a.x + (b.x - a.x) * e, 0, a.z + (b.z - a.z) * e); x.l = xzToL(p.x, p.z); x.lift = 1.2 + Math.sin(Math.PI * e) * 3; } else setL(lab, l0 + (l - l0) * e);
    R.goal.copy(grip());
  });
  setL(lab, l);
  const cap = () => j.group.localToWorld(V3(0, 9.75, 0));
  await lab.handTo(R, cap(), { pose: 'press', contact: 'index', dur: 0.3, arc: 2, pitch: -0.32 });
  lab.state.holdSources.add('auto');
  const seq0 = x.probe?.seq || 0;
  await lab.waitFor(() => (x.probe?.seq || 0) > seq0 + 1 && x.probe.l === x.l, 12);
  const d = x.probe && x.probe.l === x.l ? x.probe.div : x.needle.theta;
  lab.state.holdSources.delete('auto');
  await lab.tween(0.25, () => { R.goal.copy(cap()).add(V3(0, 1.5, 0)); });
  return d;
}
async function huntNull(lab) {
  const x = lab.x;
  if (!x.keyIn) await pressKey(lab);
  const nul = findNull(lab);
  if (nul == null) { lab.toast('No null point on the wire — check that the + terminals of the cells go to A and that the driver current is large enough.', 'err', 6000); return; }
  if (x.hr) {
    // bracket roughly with HR in, then remove it
    await probe(lab, Math.max(1, Math.round(nul - 30)));
    await probe(lab, Math.min(999, Math.round(nul + 30)));
    await toggleHR(lab);
  }
  let l = Math.round(nul * 10) / 10;
  await probe(lab, Math.round(nul));
  let d = await probe(lab, l);
  for (let i = 0; i < 6 && Math.abs(d) > 0.45; i++) {
    const s = Math.sign(solve(lab, true, { l: l + 1, hr: false }).Ig - solve(lab, true, { l, hr: false }).Ig);
    l = Math.round((l - Math.sign(d) * s * 0.1) * 10) / 10;
    d = await probe(lab, l);
  }
}
async function recordLength(lab) {
  const x = lab.x;
  if (!wiring(lab).complete) { lab.toast('Complete the circuit first.', 'err'); return; }
  if (x.cell < 0) { lab.toast('Put a cell in circuit with the two-way key.', 'err'); return; }
  const pr = x.probe;
  if (!pr || Math.abs(pr.l - x.l) > 0.05 || pr.cell !== x.cell) { lab.toast('Press the jockey here and watch the galvanometer first.', 'err'); return; }
  if (pr.hr) { lab.toast('Remove the high resistance (HR) to locate the null point precisely.', 'warn'); return; }
  if (Math.abs(pr.div) > 0.5) { lab.toast(`The galvanometer still deflects ${pr.div.toFixed(1)} div — this is not the null point.`, 'err'); return; }
  const Rh = Math.round(lab.items.rh.app.f * 20 * 10) / 10;
  if (x.pend.Rh != null && Math.abs(x.pend.Rh - Rh) > 0.05) { x.pend = { l1: null, l2: null, Rh: null }; lab.toast('The rheostat was changed — starting a new set.', 'info'); }
  x.pend.Rh = Rh;
  if (x.cell === 0) x.pend.l1 = x.l; else x.pend.l2 = x.l;
  lab.toast(`Recorded ${x.cell === 0 ? 'l₁' : 'l₂'} = ${x.l.toFixed(1)} cm`, 'ok');
  if (x.pend.l1 != null && x.pend.l2 != null) {
    lab.addRow({ Rh, l1: x.pend.l1, l2: x.pend.l2, ratio: x.pend.l1 / x.pend.l2 });
    x.pend = { l1: null, l2: null, Rh: null };
  }
  await lab.wait(0.2);
}
