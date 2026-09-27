// Qualitative test-tube chemistry shared by several labs: a rack of test
// tubes, bottles of samples, dropper bottles of reagents, and a reaction
// model that decides what each tube shows (colour, precipitate, bubbles,
// fumes) from what has actually been put into it. Labs describe their
// samples, reagents, the reaction rules and the list of tests; the student
// can also mix things freely.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const RACK_AT = [0, -4];
const N_TUBES = 6;

// A tube's visible state follows its target state smoothly (colour changes,
// precipitates forming and settling, effervescence dying away)
function applyVisual(t, dt) {
  const v = t.v, g = t.goal;
  if (!g) return;
  const k = 1 - Math.exp(-dt * (g.rate || 1.2));
  v.color.lerp(new THREE.Color(g.color), k);
  v.opacity += ((g.opacity ?? v.opacity) - v.opacity) * k;
  v.ppt += ((g.ppt || 0) - v.ppt) * k * 0.6;
  if (g.pptColor != null) v.pptColor.lerp(new THREE.Color(g.pptColor), k);
  v.turbid += ((g.turbid || 0) - v.turbid) * k;
  v.refresh(true);
  t.bub.rate += ((g.bubbles || 0) - t.bub.rate) * k;
  t.fume.rate = (g.fumes || 0) * (t.heat > 0.2 || g.fumesCold ? 1 : 0);
}

export function tubeTests(cfg) {
  let fx = null;
  const samples = cfg.samples, reagents = cfg.reagents;
  const sampleKey = (k) => `s_${k}`, reagentKey = (k) => `r_${k}`;
  const items = {
    rack: { name: 'Test-tube rack with test tubes', label: 'Test tubes', build: () => buildRack(), slot: [RACK_AT[0], RACK_AT[1], 0], setupText: 'Carry the rack of clean test tubes to the middle of the bench.' },
  };
  samples.forEach((s, i) => {
    items[sampleKey(s.key)] = {
      name: s.bottleName || `${s.name} bottle`, label: s.name,
      build: () => {
        if (s.solid) { const d = C.sampleDish(s.name, s.color); return Object.assign(d.app, { solid: true, heap: d.heap }); }
        const b = C.reagentBottle(s.name, s.sub || '', { labelColor: s.labelColor || '#0f766e', liquid: 150, liquidColor: s.color, opacity: s.opacity ?? 0.3, capacity: 100, amber: !!s.amber });
        return Object.assign(b.app, { v: b, stopper: b.stopper });
      },
      slot: s.slot || [-96 + i * 14 + (i >= 3 ? 20 : 0), -26, 0],
    };
  });
  reagents.forEach((r, i) => {
    items[reagentKey(r.key)] = {
      name: `${r.name} ${r.bottle ? 'bottle' : 'dropper bottle'}`, label: r.name,
      build: () => {
        if (r.bottle) { const b = C.reagentBottle(r.name, r.sub || '', { labelColor: r.labelColor || '#b91c1c', liquid: 150, liquidColor: r.color, opacity: r.opacity ?? 0.3, capacity: 100 }); return Object.assign(b.app, { v: b, stopper: b.stopper }); }
        const d = C.dropperBottle(r.name, { liquidColor: r.color, opacity: r.opacity ?? 0.45, labelColor: r.labelColor || '#be185d', dropColor: r.dropColor ?? r.color });
        return Object.assign(d.app, { v: d, dropper: d.dropper, dropColor: d.dropColor });
      },
      slot: r.slot || [30 + (i % 4) * 13, -24 + Math.floor(i / 4) * 16, 0],
    };
  });
  Object.assign(items, cfg.extraItems || {});
  const setupOrder = ['rack', ...samples.map((s) => sampleKey(s.key)), ...reagents.map((r) => reagentKey(r.key)), ...Object.keys(cfg.extraItems || {})];

  // ---- the tubes ----
  function buildRack() {
    const r = C.testTubeRack(N_TUBES);
    const tubes = r.holes.map((h, i) => {
      const t = C.testTube(15, 0.8);
      t.group.position.copy(h);
      r.group.add(t.group);
      return { i, v: t, group: t.group, home: h.clone(), contents: { sample: null, reag: {} }, heat: 0, used: false };
    });
    return Object.assign(r.app, { tubes });
  }
  const tubes = (lab) => lab.items.rack.app.tubes;
  const target = (t) => ({
    topW: () => t.group.localToWorld(V3(0, 15, 0)),
    surfW: () => t.group.localToWorld(V3(0, t.v.level + 0.05, 0)),
    add: (mL, col, op) => { t.v.add(mL, col, op); },
  });
  function react(lab, t) {
    t.goal = cfg.react(lab, t.contents, t) || null;
    if (t.goal && t.goal.gasTo != null) lab.x.gas = { from: t.i, kind: t.goal.gasTo };
  }
  const cur = (lab) => (lab.x.cur != null ? tubes(lab)[lab.x.cur] : null);
  function freshTube(lab) {
    const t = tubes(lab).find((q) => !q.used);
    if (!t) { lab.toast('All the test tubes are used — clean them first.', 'warn'); return null; }
    lab.x.cur = t.i;
    return t;
  }

  // ---- motions ----
  async function addSample(lab, key, t = null) {
    const s = samples.find((q) => q.key === key);
    t = t || (cur(lab) && !cur(lab).contents.sample && !Object.keys(cur(lab).contents.reag).length ? cur(lab) : freshTube(lab));
    if (!t) return null;
    t.used = true;
    lab.x.cur = t.i;
    if (s.solid) {
      // a spatula-full of the solid
      const dish = lab.items[sampleKey(key)];
      await lab.touch(dish.group.position.clone().add(V3(0, 2, 0)), null, { pose: 'pinch' });
      await lab.touch(target(t).topW().add(V3(0, 2, 0)), () => { t.v.setPpt(0.5, s.color, 0); lab.sfx('tick'); }, { pose: 'pinch' });
    } else {
      await C.pour(lab, fx, sampleKey(key), target(t), s.mL || 2, { dur: 1.0, tilt: 1.2 });
    }
    t.contents.sample = key;
    react(lab, t);
    return t;
  }
  async function addReagent(lab, key, amount = null, t = null) {
    const r = reagents.find((q) => q.key === key);
    t = t || cur(lab);
    if (!t || !t.used) { lab.toast('Put a sample into a test tube first.', 'err'); return; }
    if (r.bottle) await C.pour(lab, fx, reagentKey(key), target(t), amount || r.mL || 2, { dur: 1.0, tilt: 1.2 });
    else await C.addDrops(lab, fx, reagentKey(key), target(t), amount || r.drops || 3, { interval: 0.35 });
    t.contents.reag[key] = (t.contents.reag[key] || 0) + (amount || (r.bottle ? r.mL || 2 : r.drops || 3));
    react(lab, t);
  }
  async function shake(lab, t = cur(lab)) {
    if (!t) return;
    const R = lab.handR();
    const g = t.group;
    await lab.touch(g.localToWorld(V3(0, 14, 0.9)), null, { pose: 'pinch', lift: 0 });
    const y0 = g.position.y;
    await lab.tween(0.5, (e) => { g.position.y = y0 + e * 7; R.goal.copy(g.localToWorld(V3(0, 13, 0.9))); });
    await lab.tween(1.0, (e, k) => { g.rotation.z = Math.sin(k * Math.PI * 8) * 0.25 * (1 - k); R.goal.copy(g.localToWorld(V3(0, 13, 0.9))); });
    await lab.tween(0.5, (e) => { g.position.y = y0 + (1 - e) * 7; R.goal.copy(g.localToWorld(V3(0, 13, 0.9))); });
    g.rotation.z = 0;
    if (t.goal) t.goal.rate = (t.goal.rate || 1.2) * 1.5;
  }
  async function observe(lab, t = cur(lab), secs = 1.5) {
    if (!t) return;
    lab.flyTo('tube');
    await lab.touch(t.group.localToWorld(V3(0, 18, 3)), null, { pose: 'relaxed', lift: 0 });
    await lab.wait(secs);
  }
  function record(lab, t = cur(lab)) {
    if (!t || !t.goal || !t.goal.obs) { lab.toast('Nothing to record yet — carry out the test first.', 'err'); return false; }
    const row = cfg.row(lab, t);
    if (!row) return false;
    if (lab.rows.some((q) => q._tube === t.i && q._key === row._key)) { lab.toast('Already recorded.', 'info'); return false; }
    lab.addRow({ ...row, _tube: t.i });
    lab.toast(`Recorded: ${t.goal.obs}`, 'ok', 5000);
    return true;
  }
  async function cleanAll(lab) {
    for (const t of tubes(lab)) resetTube(t);
    (lab.stripMeshes || []).forEach((m) => m.removeFromParent()); lab.stripMeshes = []; lab.x.strips = 0;
    lab.x.cur = null; lab.x.gas = null;
    lab.toast('Test tubes emptied, washed with water and put back in the rack.', 'info', 3000);
    await lab.wait(0.3);
  }
  function resetTube(t) {
    t.v.setLiquid(0, 0xffffff, 0.3); t.v.setPpt(0, 0xffffff, 0);
    t.contents = { sample: null, reag: {} }; t.goal = null; t.used = false; t.heat = 0; t.warmed = false; t.paper = null; t.heated = false; t.co2 = 0; t.chips = 1; if (t.delivery) { t.delivery.group.removeFromParent(); t.delivery = null; t.limeTube = null; }
    t.bub.rate = 0; t.fume.rate = 0;
    t.group.position.copy(t.home); t.group.rotation.set(0, 0, 0);
    if (t.group.parent !== t.rackGroup) t.rackGroup.add(t.group);
  }
  // Paper tests: a glass rod dipped in the tube is touched on strips of blue
  // litmus, red litmus and universal indicator paper laid on a white tile
  async function paperTest(lab, t = cur(lab), { litmus = true, ph = true } = {}) {
    const tile = lab.items.tile;
    if (!tile || !t || !t.goal) return null;
    const pH = t.goal.pH ?? 7;
    const row = lab.x.strips++;
    const make = (col, dz) => {
      const s = C.paperStrip(col, 0.9, 3.2);
      s.group.position.set(-4 + (row % 6) * 1.5, 0.5, dz);
      tile.group.add(s.group);
      lab.stripMeshes.push(s.group);
      return s;
    };
    const R = lab.handR();
    await lab.touch(t.group.localToWorld(V3(0, 16, 0)), null, { pose: 'pinch', lift: 0 }); // dip the rod
    await lab.wait(0.3);
    const res = {};
    const dab = async (strip, to) => {
      await lab.touch(strip.group.localToWorld(V3(0, 0.6, 0)), null, { pose: 'pinch', lift: 0 });
      const c0 = strip.mat.color.clone(), c1 = new THREE.Color(to);
      await lab.tween(0.8, (e) => { strip.mat.color.copy(c0).lerp(c1, e); R.goal.y += 0; });
    };
    if (litmus) {
      const b = make(0x3b6fd8, -3), r = make(0xd6453d, 0);
      await dab(b, pH < 6.5 ? 0xd6453d : 0x3b6fd8);
      await dab(r, pH > 7.5 ? 0x3b6fd8 : 0xd6453d);
      res.litmus = pH < 6.5 ? 'Blue → Red' : pH > 7.5 ? 'Red → Blue' : 'No change';
    }
    if (ph) {
      const u = make(0xe8d27a, 3);
      await dab(u, C.phColor(pH));
      res.pH = Math.round(pH);
      await lab.touch(lab.items.chart.group.localToWorld(V3(-8 + 1.07 * Math.round(pH), 0.4, 0)), null, { pose: 'point', lift: 0 });
    }
    res.cls = pH < 6.5 ? 'Acidic' : pH > 7.5 ? 'Basic' : 'Neutral';
    t.paper = res;
    return res;
  }
  const api = { addSample, addReagent, shake, observe, record, cleanAll, paperTest, tubes, cur, target, freshTube, react, get fx() { return fx; }, sampleKey, reagentKey };

  // ---- steps: one per test ----
  function steps(lab) {
    return cfg.tests.map((ts, i) => ({
      phase: ts.phase || 'Tests',
      text: ts.text,
      why: ts.why || '',
      check: () => lab.rows.length > i || (ts.check && ts.check(lab)),
      demo: async () => {
        if (ts.demo) { await ts.demo(lab, api); return; }
        const t = await addSample(lab, ts.sample);
        if (!t) return;
        for (const r of ts.reagents || []) { await addReagent(lab, r.key, r.amount, t); if (ts.shake !== false) await shake(lab, t); }
        await observe(lab, t, ts.wait || 1.5);
        record(lab, t);
      },
    }));
  }

  return {
    id: cfg.id,
    lab: 'Chemistry Lab',
    title: cfg.title,
    intro: cfg.intro,
    poster: 'chemsafety',
    board: cfg.board,
    items, setupOrder,
    views: {
      tube: { label: 'Current test tube', pos: (lab) => { const t = cur(lab) || tubes(lab)[0]; const p = t.group.localToWorld(V3(0, 8, 0)); return [p.x + 6, p.y + 8, p.z + 26]; }, target: (lab) => { const t = cur(lab) || tubes(lab)[0]; return t.group.localToWorld(V3(0, 6, 0)).toArray(); } },
      rackv: { label: 'Rack', fit: [-100, 100, [0, 4, -8]] },
      ...(cfg.views || {}),
    },
    classicView: 'rackv',
    pips: [{ id: 'tube', title: 'Close-up of the test tube', fov: 26, update: (cam, lab) => { const t = cur(lab) || tubes(lab)[0]; const p = t.group.localToWorld(V3(0, 5, 0)); cam.position.set(p.x + 3, p.y + 3, p.z + 17); cam.lookAt(p); }, show: (lab) => lab.x.cur != null }, ...(cfg.pips || [])],
    overlay: '<b>Observation</b><div id="ttObs" style="margin:4px 0;color:#e2e8f0">—</div><div id="ttInf" style="color:#67e8f9"></div>',
    hintExtra: 'click a <b>bottle</b> to add it to the current tube · click a <b>tube</b> to select and shake it',
    panel: [{
      title: 'Tests',
      html: `
        <label class="lbl">Add sample to a clean tube</label>
        <div class="row small">${samples.map((s) => `<button class="mini act" data-s="${s.key}">${s.name}</button>`).join('')}</div>
        <label class="lbl">Add reagent to the current tube</label>
        <div class="row small">${reagents.map((r) => `<button class="mini act" data-r="${r.key}">${r.name}</button>`).join('')}</div>
        <div class="row"><button class="btn ghost act" id="ttShake">Shake</button><button class="btn ghost act" id="ttClean">Clean all tubes</button>${(cfg.actions || []).map((a, i) => `<button class="btn ghost act" data-a="${i}">${a.label}</button>`).join('')}</div>
        <div class="meters"><div class="m"><i>Current tube</i><b id="ttCur">—</b></div><div class="m"><i>Contents</i><b id="ttCon">—</b></div></div>`,
      bind: (lab, root) => {
        root.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => lab.act(() => addSample(lab, b.dataset.s)); });
        root.querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => lab.act(() => addReagent(lab, b.dataset.r)); });
        root.querySelector('#ttShake').onclick = () => lab.act(() => shake(lab));
        root.querySelector('#ttClean').onclick = () => lab.act(() => cleanAll(lab));
        root.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => lab.act(() => cfg.actions[+b.dataset.a].run(lab, api)); });
      },
    }, ...(cfg.panel || [])],
    table: { columns: cfg.columns, recordLabel: 'Record observation', note: cfg.tableNote },
    record: (lab) => record(lab),
    steps,
    state: () => ({ cur: null, gas: null, strips: 0, ...(cfg.state ? cfg.state() : {}) }),
    init: (lab) => {
      fx = { stream: C.stream(lab.scene), drops: C.dropper(lab.scene) };
      lab.fx = fx;
      lab.stripMeshes = [];
      tubes(lab).forEach((t) => {
        t.rackGroup = lab.items.rack.group;
        t.bub = C.bubbles(t.v, { size: 0.07, max: 40 });
        t.fume = C.fumes(lab.scene, { col: 0xf1f5f9, opacity: 0.3, spread: 1.4, rise: 7 });
        lab.actionable(t.group, { tip: () => `Test tube ${t.i + 1}${t.contents.sample ? ` (${samples.find((q) => q.key === t.contents.sample)?.name})` : ' (clean)'} — click to select and shake`, run: async () => { lab.x.cur = t.i; await shake(lab, t); }, enabled: () => lab.items.rack.placed });
      });
      samples.forEach((s) => lab.actionable(lab.items[sampleKey(s.key)].group, { tip: `${s.name} — click to put some in a clean test tube`, run: () => addSample(lab, s.key), enabled: () => lab.items[sampleKey(s.key)].placed && lab.items.rack.placed }));
      reagents.forEach((r) => lab.actionable(lab.items[reagentKey(r.key)].group, { tip: `${r.name} — click to add ${r.bottle ? 'some' : 'a few drops'} to the current tube`, run: () => addReagent(lab, r.key), enabled: () => lab.items[reagentKey(r.key)].placed && lab.x.cur != null }));
      if (cfg.init) cfg.init(lab, api);
    },
    reset: (lab) => { tubes(lab).forEach(resetTube); (lab.stripMeshes || []).forEach((m) => m.removeFromParent()); lab.stripMeshes = []; if (cfg.reset) cfg.reset(lab, api); },
    simulate: (lab, dt) => {
      if (!lab.items.rack.app.tubes[0].bub) return;
      tubes(lab).forEach((t) => {
        if (cfg.tick) cfg.tick(lab, t, dt, api);
        applyVisual(t, dt);
        t.fume.origin.copy(t.group.localToWorld(V3(0, 15.5, 0)));
      });
      if (cfg.simulate) cfg.simulate(lab, dt, api);
    },
    update: (lab, dt, t) => { C.update(dt, t); if (cfg.update) cfg.update(lab, dt, t, api); },
    chips: (lab) => [[`Tubes used: ${tubes(lab).filter((q) => q.used).length} of ${N_TUBES}`, ''], [`Recorded: ${lab.rows.length}`, lab.rows.length ? 'ok' : '']],
    ui: (lab) => {
      const $ = (id) => document.getElementById(id);
      const t = cur(lab);
      $('ttCur').textContent = t ? `Tube ${t.i + 1}` : '—';
      $('ttCon').textContent = t ? [t.contents.sample && samples.find((q) => q.key === t.contents.sample)?.name, ...Object.entries(t.contents.reag).map(([k, n]) => `${reagents.find((q) => q.key === k)?.name} ×${n}`)].filter(Boolean).join(' + ') || 'clean' : '—';
      $('ttObs').textContent = t && t.goal ? t.goal.obs : '—';
      $('ttInf').textContent = t && t.goal && t.goal.inf ? `→ ${t.goal.inf}` : '';
      if (cfg.ui) cfg.ui(lab, api);
    },
    result: (lab) => cfg.result ? cfg.result(lab) : { items: [['Tests recorded', `${lab.rows.length} of ${cfg.tests.length}`]], note: cfg.resultNote || '' },
    obsRows: cfg.obsRows,
    obsKeys: cfg.obsKeys,
    observation: (lab) => ({ rows: lab.rows.map((r) => Object.fromEntries(cfg.obsKeys.map((k) => [k, r[k] ?? '']))) }),
  };
}
