// Acid–base and redox titrations (che121, che122, che123) share this lab:
// burette on a stand, pipette, conical flask on a white tile, indicator, and
// three titrations recorded to concordance. The solution chemistry decides
// the colour of the flask from the excess of titrant added.
import * as THREE from 'three';
import * as C from '../lab-engine/chem.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const round1 = (v) => Math.round(v * 10) / 10;

export function titration(cfg) {
  const T = cfg.titrant, A = cfg.analyte, I = cfg.indicator;
  const ALIQUOT = 20;
  const BURETTE_AT = [0, -16.6]; // burette axis (x, z) on the bench
  const TILE_Y = 1.4; // the tile sits on the stand's base plate
  const FLASK_Y = TILE_Y + 0.5;
  let fx = null, bur = null, funnel = null;

  const items = {
    stand: { name: 'Retort stand with burette clamp', label: 'Retort stand', build: () => C.retortStand({ clampY: 14.4 + FLASK_Y + 40 }), slot: [0, -20, 0], setupText: 'Carry the retort stand with the burette clamp to the back of the bench.', why: 'A heavy stand keeps the burette vertical and steady.' },
    tile: { name: 'White tile', build: () => C.whiteTile(11), slot: [0, -16.6, 0], slotY: -3 + TILE_Y, setupText: 'Put the white tile on the base of the stand, under the clamp.', why: 'A white background makes the faintest colour change at the end point easy to see.' },
    burette: {
      name: '50 mL burette', label: 'Burette',
      build: () => {
        const b = C.burette();
        bur = b;
        funnel = C.funnel(2.2);
        funnel.group.position.y = b.top + 3.2;
        funnel.group.visible = false;
        b.group.add(funnel.group);
        return b.app ? Object.assign(b.app, { api: b }) : b;
      },
      slot: [BURETTE_AT[0], BURETTE_AT[1], 0], slotY: -3 + FLASK_Y + 14.4 - 1.9,
      setupText: 'Fix the burette vertically in the clamp, stopcock closed.', why: 'A tilted burette gives wrong readings and a stream that misses the flask.',
    },
    flask: { name: '250 mL conical flask', label: 'Conical flask', build: () => { const f = C.conicalFlask(250); f.setLiquid(0, A.color, A.opacity); return Object.assign(f.app, { v: f }); }, slot: [-26, 14, 0], setupText: 'Place a clean conical flask at the front of the bench.' },
    beaker: { name: '100 mL beaker', label: `Beaker (${A.short})`, build: () => { const b = C.beaker(100); return Object.assign(b.app, { v: b }); }, slot: [-54, 2, 0], setupText: `Place a clean, dry 100 mL beaker for the ${A.name.toLowerCase()}.` },
    acid: { name: `${A.name} bottle`, label: A.name, build: () => { const b = C.reagentBottle(A.name, A.sub, { labelColor: A.labelColor || '#b45309', liquid: 200, liquidColor: A.color, opacity: A.opacity }); return Object.assign(b.app, { v: b, stopper: b.stopper }); }, slot: [-82, -14, 0] },
    titrant: { name: `${T.name} bottle`, label: T.name, build: () => { const b = C.reagentBottle(T.name, T.sub, { labelColor: T.labelColor || '#1d4ed8', liquid: 200, liquidColor: T.color, opacity: T.opacity, amber: !!T.amber }); return Object.assign(b.app, { v: b, stopper: b.stopper }); }, slot: [36, -14, 0] },
    pipette: { name: '20 mL pipette with filler', label: 'Pipette', build: () => { const p = C.pipette(20); return Object.assign(p.app, { setFill: p.setFill, get fill() { return p.fill; }, capacity: 20 }); }, slot: [-58, 30, 0], home: [176, 28, 0], restRot: [0, 0, Math.PI / 2], restLift: 0.5, pose: 'pinch' },
    waste: { name: 'Waste beaker', label: 'Waste beaker', build: () => { const b = C.beaker(250); return Object.assign(b.app, { v: b }); }, slot: [62, 14, 0] },
    ...(I ? { indicator: { name: `${I.name} dropper bottle`, label: I.name, build: () => { const d = C.dropperBottle(I.name, { liquidColor: I.bottleColor, opacity: 0.5, dropColor: I.dropColor ?? I.bottleColor }); return Object.assign(d.app, { v: d, dropper: d.dropper, dropColor: d.dropColor }); }, slot: [24, 12, 0] } } : {}),
    ...(cfg.acidify ? {
      acidBottle: { name: `${cfg.acidify.name} bottle`, label: cfg.acidify.name, build: () => { const b = C.reagentBottle(cfg.acidify.name, cfg.acidify.sub, { labelColor: '#dc2626', liquid: 200, liquidColor: 0xf6f8fa, opacity: 0.2, capacity: 100 }); return Object.assign(b.app, { v: b, stopper: b.stopper }); }, slot: [24, 12, 0] },
      cylinder: { name: '25 mL measuring cylinder', label: 'Measuring cylinder', build: () => { const m = C.measuringCylinder(25); return Object.assign(m.app, { v: m }); }, slot: [44, 16, 0] },
    } : {}),
  };
  const setupOrder = ['stand', 'tile', 'burette', 'flask', 'beaker', 'pipette', 'acid', 'titrant', ...(I ? ['indicator'] : ['acidBottle', 'cylinder']), 'waste'];

  // ---- helpers ----
  const flaskV = (lab) => lab.items.flask.app.v;
  const cur = (lab) => lab.x.c[Math.min(lab.x.c.length - 1, lab.rows.length)];
  const excess = (lab) => lab.x.added - lab.x.Veq;
  const underTip = (lab) => {
    const tip = bur.tipWorld();
    for (const k of ['flask', 'waste', 'beaker']) {
      const it = lab.items[k];
      if (lab.carried.has(k)) continue;
      const p = it.group.position;
      if (Math.hypot(p.x - tip.x, p.z - tip.z) < 3 && p.y + it.app.v.yTop > tip.y - 4) return k;
    }
    return null;
  };
  const flaskUnder = (lab) => underTip(lab) === 'flask';
  const setBurette = (lab, r) => { lab.x.bur = r; bur.setReading(r, T.color, T.buretteOpacity ?? Math.max(0.35, T.opacity)); };

  // Colour of the flask from the chemistry
  function flaskColour(lab) {
    const x = lab.x, v = flaskV(lab);
    if (v.vol < 0.5) return;
    const ex = excess(lab);
    const col = new THREE.Color(A.color);
    let op = A.opacity;
    const shows = cfg.selfIndicator || x.ind;
    if (shows && x.inFlask > 0) {
      const perm = ex > 0 ? clamp01(0.4 + ex / 0.8) : 0;
      const k = Math.max(perm, x.flash * 0.85);
      col.lerp(new THREE.Color(ex > 0 ? cfg.endColor : cfg.flashColor), k);
      op += (cfg.endOpacity - op) * k;
      if (!cfg.selfIndicator && x.ind && ex <= 0 && I.baseColor != null) { col.lerp(new THREE.Color(I.baseColor), (1 - k) * 0.85); op = Math.max(op, I.baseOpacity || op); }
    }
    v.color.copy(col); v.opacity = op; v.refresh();
  }
  // Titrant reaching the flask (or whatever is under the tip)
  function deliver(lab, mL, into) {
    const x = lab.x;
    if (!x.tipFilled) { x.tipFill += mL; if (x.tipFill >= 0.6) { x.tipFilled = true; bur.tipFilled = true; lab.toast('The air bubble has been driven out of the burette tip.', 'info', 3500); } return; }
    if (!into) { if (!x.spillWarned) { x.spillWarned = true; lab.toast('Liquid is running onto the tile! Keep a flask or beaker under the burette.', 'warn'); } return; }
    const v = lab.items[into].app.v;
    if (into === 'flask') {
      x.added += mL; x.inFlask += mL;
      if (excess(lab) < 0) x.flash = Math.min(1, x.flash + mL * (cfg.selfIndicator ? 14 : 9));
      v.setLiquid(v.vol + mL);
      flaskColour(lab);
    } else v.add(mL, T.color, T.opacity);
  }
  // stop: { added } or { reading } closes the stopcock exactly there (checked every simulation step)
  function openCock(lab, level, stop = null) {
    const x = lab.x;
    x.cock = level; x.stop = level > 0 ? stop : null;
    if (level === 0) x.dropBudget = null;
    bur.setCock(level >= 0.6 ? 1 : level > 0 ? 0.35 : 0);
    lab.sfx('click');
  }

  // ---- motions (work with or without hands) ----
  async function fillBurette(lab, toReading = -1.5) {
    const x = lab.x;
    await lab.touch(bur.funnelWorld().add(V3(0, 2, 0)), () => { funnel.group.visible = true; }, { pose: 'pinch' });
    const need = x.bur - toReading + (x.tipFilled ? 0 : 0.6);
    const tgt = {
      topW: () => funnel.group.localToWorld(V3(0, 2.4, 0)),
      surfW: () => funnel.group.localToWorld(V3(0, 0.2, 0)),
      add: (mL) => setBurette(lab, lab.x.bur - mL),
    };
    await C.pour(lab, fx, 'titrant', tgt, need, { dur: Math.min(3.2, 1 + need / 12) });
    await lab.wait(0.3);
  }
  async function removeFunnel(lab) {
    if (!funnel.group.visible) return;
    await lab.touch(bur.funnelWorld().add(V3(0, 2, 0)), () => { funnel.group.visible = false; lab.sfx('glass'); }, { pose: 'pinch' });
  }
  // Run out through the tip into the waste beaker until the reading is `to`
  async function drainTo(lab, to) {
    const x = lab.x;
    await removeFunnel(lab);
    const tip = bur.tipWorld();
    await lab.pickUp('waste');
    const wv = lab.items.waste.app.v;
    await lab.holdAt('waste', V3(tip.x, tip.y - wv.yTop + 0.5, tip.z), new THREE.Euler(0, 0, 0), { dur: 1.0 });
    const L = lab.handL();
    await lab.handTo(L, bur.cockWorld(), { pose: 'pinch', contact: 'pinch', dur: 0.7, arc: 4, pitch: -0.2 });
    openCock(lab, 1, { reading: to });
    await lab.waitFor(() => x.cock === 0, 60);
    openCock(lab, 0);
    await lab.wait(0.3);
    await lab.putBack('waste');
    lab.handL().setPose('flat', 'palm');
  }
  async function noteInitial(lab) {
    const x = lab.x, c = cur(lab);
    // top up if there is not enough titrant for another titration
    if (x.bur > 50 - (x.Veq + 4)) {
      lab.toast('Not enough titrant left for a full titration — refilling the burette.', 'info', 3500);
      await fillBurette(lab, -1.2);
      await drainTo(lab, 0);
    }
    if (!flaskUnder(lab)) {
      await lab.pickUp('flask');
      await lab.putDown('flask', V3(BURETTE_AT[0], -3 + FLASK_Y, BURETTE_AT[1]), { rot: 0 });
    }
    lab.flyTo('burette');
    await lab.touch(bur.readWorld().add(V3(0, 0, 3)), null, { pose: 'point', pitch: -0.1 });
    c.init = round1(x.bur);
    c.initNoted = true;
    lab.toast(`Initial burette reading (bottom of the meniscus${cfg.readTop ? ' — for KMnO₄ read the upper meniscus' : ''}): ${c.init.toFixed(1)} mL`, 'info', 4500);
  }
  async function swirlFlask(lab, turns = 2, dur = 1.0) {
    const f = lab.items.flask.group;
    const R = lab.handR();
    const neck = () => f.localToWorld(V3(0, 12.5, 1.6));
    if (lab.hands && R.goal.distanceTo(neck()) > 3) await lab.handTo(R, neck(), { pose: 'grab', contact: 'palm', dur: 0.5, arc: 3, pitch: 0 });
    lab.x.swirling = true;
    await lab.tween(dur, (e, k) => {
      const a = k * turns * Math.PI * 2;
      f.rotation.z = Math.sin(a) * 0.1; f.rotation.x = Math.cos(a) * 0.1 - 0.1 * (1 - Math.abs(Math.cos(a)));
      R.goal.copy(neck());
    });
    f.rotation.set(0, 0, 0);
    lab.x.swirling = false;
  }
  async function titrate(lab) {
    const x = lab.x, c = cur(lab);
    if (!flaskUnder(lab)) { lab.toast('Put the flask under the burette first.', 'err'); return; }
    lab.flyTo('titrate');
    const L = lab.handL();
    await lab.handTo(L, bur.cockWorld(), { pose: 'pinch', contact: 'pinch', dur: 0.8, arc: 4, pitch: -0.2 });
    await swirlFlask(lab, 1, 0.6);
    // Run quickly to about a millilitre short (the student learnt the rough value
    // from the first titration's persisting flashes), swirling all the time
    const fastTo = x.Veq - (lab.rows.length === 0 ? 1.4 + Math.random() * 0.6 : 0.7 + Math.random() * 0.3);
    if (x.added < fastTo) {
      openCock(lab, 1, { added: fastTo });
      for (let i = 0; i < 200 && x.cock > 0 && x.bur < 49.9; i++) { await swirlFlask(lab, 1, 0.7); lab.checkAbort(); }
      openCock(lab, 0);
    }
    // Now drop by drop, swirling after each, until the colour stays
    for (let i = 0; i < 80 && excess(lab) < 0 && x.bur < 49.9; i++) {
      await addDrop(lab);
      await swirlFlask(lab, 1, 0.55);
      lab.checkAbort();
    }
    await swirlFlask(lab, 2, 1.0);
    c.endpoint = true;
    L.setPose('flat', 'palm');
    lab.toast(`End point: the ${cfg.endName} colour persists after swirling.`, 'ok', 4000);
  }
  async function addDrop(lab) {
    const x = lab.x;
    const n0 = x.dropsOut;
    openCock(lab, 0.3);
    x.dropBudget = 1;
    await lab.waitFor(() => x.dropsOut > n0 && x.pendingDrops === 0, 4);
    openCock(lab, 0);
    await lab.wait(0.1);
  }
  async function recordFinal(lab) {
    const x = lab.x, c = cur(lab);
    if (!c.initNoted) { lab.toast('Note the initial burette reading first.', 'err'); return; }
    const ex = excess(lab);
    if (ex < 0) { lab.toast('The end point has not been reached — the colour does not persist yet.', 'err'); return; }
    lab.flyTo('burette');
    await lab.touch(bur.readWorld().add(V3(0, 0, 3)), null, { pose: 'point', pitch: -0.1 });
    const final = round1(x.bur);
    const used = round1(final - c.init);
    lab.addRow({ n: lab.rows.length + 1, aliquot: ALIQUOT, init: c.init, final, used, over: ex });
    c.recorded = true;
    lab.toast(`Final reading ${final.toFixed(1)} mL → ${T.short} used = ${used.toFixed(1)} mL${ex > 0.3 ? ' (overshot — the colour is too dark; this value is high)' : ''}`, ex > 0.3 ? 'warn' : 'ok', 5500);
  }
  async function emptyFlask(lab) {
    const f = flaskV(lab);
    if (f.vol < 0.2) return;
    await C.pour(lab, fx, 'flask', 'waste', f.vol + 1, { dur: 1.4 });
    f.setLiquid(0, A.color, A.opacity);
    lab.x.added = 0; lab.x.inFlask = 0; lab.x.flash = 0; lab.x.ind = false;
    lab.toast('Flask emptied into the waste beaker and rinsed with distilled water.', 'info', 3000);
  }
  async function pipetteAliquot(lab) {
    const x = lab.x;
    if (flaskV(lab).vol > 0.5) await emptyFlask(lab);
    await lab.toSlot('flask');
    if (lab.items.beaker.app.v.vol < 25) await C.pour(lab, fx, 'acid', 'beaker', 70 - lab.items.beaker.app.v.vol, { dur: 1.8 });
    await C.pipetteTransfer(lab, 'pipette', 'beaker', 'flask');
    x.added = 0; x.inFlask = 0; x.flash = 0;
    flaskV(lab).color.set(A.color); flaskV(lab).opacity = A.opacity; flaskV(lab).refresh();
    cur(lab).pipetted = true;
  }
  async function addIndicator(lab) {
    const c = cur(lab);
    if (I) {
      await C.addDrops(lab, fx, 'indicator', 'flask', I.drops, { onDrop: () => { flaskV(lab).add(0.05); } });
      c.indicator = true;
      lab.x.ind = true;
      flaskColour(lab);
      lab.toast(I.note, 'info', 4000);
    } else {
      await C.pour(lab, fx, 'acidBottle', 'cylinder', cfg.acidify.mL, { dur: 1.2 });
      await C.pour(lab, fx, 'cylinder', 'flask', cfg.acidify.mL, { dur: 1.2 });
      c.indicator = true;
      flaskColour(lab);
      lab.toast(cfg.acidify.note, 'info', 4500);
    }
  }

  // ---- steps ----
  function steps(lab) {
    const x = () => lab.x;
    const list = [
      { phase: 'Prepare the burette', text: `Rinse the burette with a little ${T.name}, then fill it through a funnel to just above the zero mark.`, why: 'Rinsing with the titrant itself stops water left inside from diluting it.', check: () => x().bur < 0.5 || x().prepared, demo: () => fillBurette(lab), rings: () => [bur.funnelWorld()] },
      { phase: 'Prepare the burette', text: 'Remove the funnel, then open the stopcock to fill the tip (no air bubble) and bring the level to the zero mark.', why: 'A funnel left in drips extra liquid in; an air bubble in the tip makes the first reading wrong.', check: () => x().prepared, demo: async () => { await drainTo(lab, 0); x().prepared = true; } },
    ];
    for (let k = 0; k < 3; k++) {
      const c = () => lab.x.c[k];
      const ph = `Titration ${k + 1}${k === 0 ? '' : ''}`;
      list.push(
        { phase: ph, text: `Pipette ${ALIQUOT}.0 mL of ${A.name.toLowerCase()} into the conical flask.`, why: k === 0 ? 'Rinse the pipette with the solution first. Fill above the mark with the filler, let it fall to the mark, then let it drain — never blow out the last drop.' : '', check: () => c().pipetted, demo: () => pipetteAliquot(lab) },
        { phase: ph, text: I ? `Add ${I.drops} drops of ${I.name.toLowerCase()} indicator.` : cfg.acidify.text, why: I ? I.why : cfg.acidify.why, check: () => c().indicator, demo: () => addIndicator(lab) },
        { phase: ph, text: 'Place the flask on the white tile under the burette and note the initial reading.', why: cfg.readTop ? 'KMnO₄ is so dark that the bottom of the meniscus cannot be seen: read the upper meniscus, with your eye level with it.' : 'Keep your eye level with the bottom of the meniscus to avoid parallax.', check: () => c().initNoted, demo: () => noteInitial(lab), rings: () => [bur.readWorld()] },
        { phase: ph, text: k === 0 ? 'Titrate: run the titrant in while swirling; near the end add it drop by drop until the colour just persists.' : 'Titrate again, quickly to about 1 mL short of the first value, then drop by drop to the end point.', why: `End point: ${cfg.endText}`, check: () => c().endpoint, demo: () => titrate(lab), rings: () => [bur.cockWorld()] },
        { phase: ph, text: 'Note the final burette reading and record the titration.', check: () => c().recorded, demo: () => recordFinal(lab) },
      );
    }
    return list;
  }

  const fmt1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : '—');
  const concordant = (lab) => {
    const v = lab.rows.map((r) => r.used);
    if (v.length < 2) return null;
    return Math.max(...v) - Math.min(...v) <= 0.2;
  };
  const meanUsed = (lab) => (lab.rows.length ? lab.rows.reduce((s, r) => s + r.used, 0) / lab.rows.length : null);

  return {
    id: cfg.id,
    lab: 'Chemistry Lab',
    title: cfg.title,
    intro: cfg.intro,
    poster: 'chemsafety',
    board: cfg.board,
    items, setupOrder,
    views: {
      burette: { label: 'Burette scale', pos: (lab) => { const p = bur.readWorld(); return [p.x, p.y, p.z + 26]; }, target: () => { const p = bur.readWorld(); return [p.x, p.y, p.z]; } },
      titrate: { label: 'Titration', pos: [18, 30, 40], target: [0, 4, -16] },
    },
    classicView: 'titrate',
    pips: [
      { id: 'meniscus', title: cfg.readTop ? 'Burette — read the upper meniscus' : 'Burette — read the bottom of the meniscus', fov: 18, update: (cam) => { const p = bur.readWorld(); cam.position.set(p.x, p.y, p.z + 9); cam.lookAt(p.x, p.y, p.z); }, show: (lab) => lab.items.burette.placed && lab.x.bur < 50.5 },
      { id: 'flask', title: 'Flask on the white tile', fov: 30, update: (cam, lab) => { const p = lab.items.flask.group.position; cam.position.set(p.x + 4, p.y + 12, p.z + 26); cam.lookAt(p.x, p.y + 4, p.z); }, show: (lab) => flaskV(lab).vol > 1 },
    ],
    overlay: '<b>Burette reading</b><span class="big" id="dReading">—</span><div id="dAdded"></div><div id="dState"></div>',
    hintExtra: 'click the <b>stopcock</b> to open or close it · panel buttons pipette, add indicator, swirl and record',
    panel: [{
      title: 'Titration',
      html: `
        <div class="row"><button class="btn ghost act" id="tFill">Fill burette</button><button class="btn ghost act" id="tZero">Remove bubble, set zero</button></div>
        <div class="row"><button class="btn ghost act" id="tPip">Pipette ${ALIQUOT} mL</button><button class="btn ghost act" id="tInd">${I ? `Add ${I.name.toLowerCase()}` : `Add ${cfg.acidify.name}`}</button></div>
        <div class="row"><button class="btn ghost act" id="tUnder">Flask under burette, note initial</button></div>
        <label class="lbl">Stopcock</label>
        <div class="row"><button class="btn act" id="tFast">Open (fast)</button><button class="btn ghost act" id="tDrop">One drop</button><button class="btn ghost act" id="tClose">Close</button><button class="btn ghost act" id="tSwirl">Swirl</button></div>
        <div class="row"><button class="btn ghost act" id="tAuto">Titrate to end point (demo)</button><button class="btn ghost act" id="tEmpty">Empty flask</button></div>
        <div class="meters">
          <div class="m"><i>Burette reading</i><b id="mRead">—</b></div>
          <div class="m"><i>Added this titration</i><b id="mAdd">—</b></div>
          <div class="m"><i>Flask colour</i><b id="mCol">—</b></div>
          <div class="m"><i>Stopcock</i><b id="mCock">closed</b></div>
        </div>`,
      bind: (lab, root) => {
        const $ = (id) => root.querySelector(`#${id}`);
        $('tFill').onclick = () => lab.act(() => fillBurette(lab));
        $('tZero').onclick = () => lab.act(async () => { await drainTo(lab, 0); lab.x.prepared = true; });
        $('tPip').onclick = () => lab.act(() => pipetteAliquot(lab));
        $('tInd').onclick = () => lab.act(() => addIndicator(lab));
        $('tUnder').onclick = () => lab.act(() => noteInitial(lab));
        $('tFast').onclick = () => { if (!lab.autopilot) openCock(lab, 1); };
        $('tClose').onclick = () => { if (!lab.autopilot) openCock(lab, 0); };
        $('tDrop').onclick = () => lab.act(() => addDrop(lab));
        $('tSwirl').onclick = () => lab.act(() => swirlFlask(lab, 3, 1.4));
        $('tAuto').onclick = () => lab.act(() => titrate(lab));
        $('tEmpty').onclick = () => lab.act(() => emptyFlask(lab));
      },
    }],
    table: {
      columns: [
        { key: 'aliquot', label: `V ${A.short} (mL)`, fmt: fmt1 },
        { key: 'init', label: 'Initial (mL)', fmt: fmt1 },
        { key: 'final', label: 'Final (mL)', fmt: fmt1 },
        { key: 'used', label: `V ${T.short} (mL)`, fmt: fmt1 },
      ],
      recordLabel: 'Record final reading',
      note: 'Three titrations; concordant values agree within 0.1–0.2 mL.',
    },
    record: (lab) => lab.act(() => recordFinal(lab)),
    steps,
    state: (lab) => {
      const M = cfg.unknownM();
      return {
        M, Veq: cfg.equivalence(M, ALIQUOT),
        bur: 51, cock: 0, tipFilled: false, tipFill: 0, prepared: false,
        added: 0, inFlask: 0, flash: 0, ind: false, dropT: 0, dropsOut: 0, pendingDrops: 0, dropBudget: null, stop: null, swirling: false, spillWarned: false,
        c: [0, 1, 2].map(() => ({ pipetted: false, indicator: false, initNoted: false, init: null, endpoint: false, recorded: false })),
      };
    },
    init: (lab) => {
      fx = { stream: C.stream(lab.scene), bstream: C.stream(lab.scene), drops: C.dropper(lab.scene) };
      lab.actionable(bur.cock, {
        tip: () => `Stopcock — ${lab.x.cock >= 0.6 ? 'open: click to close' : lab.x.cock > 0 ? 'dripping: click to close' : 'closed: click to open'}`,
        run: async () => {
          const L = lab.handL();
          await lab.handTo(L, bur.cockWorld(), { pose: 'pinch', contact: 'pinch', dur: 0.6, arc: 3, pitch: -0.2 });
          openCock(lab, lab.x.cock > 0 ? 0 : 1);
          await lab.wait(0.3);
        },
      });
      lab.actionable(funnel.group, { tip: 'Funnel — click to remove it', run: () => removeFunnel(lab), enabled: () => funnel.group.visible });
    },
    reset: (lab) => {
      setBurette(lab, 51);
      bur.tipFilled = false;
      bur.setCock(0);
      funnel.group.visible = false;
      flaskV(lab).setLiquid(0, A.color, A.opacity);
      lab.items.beaker.app.v.setLiquid(0);
      lab.items.waste.app.v.setLiquid(0);
      lab.items.acid.app.v.setLiquid(200, A.color, A.opacity);
      lab.items.titrant.app.v.setLiquid(200, T.color, T.opacity);
      lab.items.pipette.app.setFill(0);
      if (lab.items.cylinder) lab.items.cylinder.app.v.setLiquid(0);
    },
    quickSetup: (lab) => {
      // The ready bench: burette filled and set to zero, acid in its beaker
      const x = lab.x;
      x.tipFilled = true; bur.tipFilled = true; x.prepared = true;
      setBurette(lab, 0);
      lab.items.beaker.app.v.setLiquid(70, A.color, A.opacity);
    },
    simulate: (lab, dt) => {
      const x = lab.x;
      if (!x.c) return;
      const into = underTip(lab);
      if (x.cock >= 0.6 && x.bur < 50) {
        let d = Math.min(1.6 * dt, 50 - x.bur);
        if (x.stop?.added != null) d = Math.min(d, Math.max(0, x.stop.added - x.added));
        if (x.stop?.reading != null) d = Math.min(d, Math.max(0, x.stop.reading - x.bur));
        setBurette(lab, x.bur + d);
        deliver(lab, d, into);
        if (x.stop && ((x.stop.added != null && x.added >= x.stop.added - 1e-9) || (x.stop.reading != null && x.bur >= x.stop.reading - 1e-9))) openCock(lab, 0);
      } else if (x.cock > 0 && x.bur < 50) {
        x.dropT += dt;
        if (x.dropT > 0.45 || x.dropBudget === 1) {
          x.dropT = 0;
          setBurette(lab, x.bur + 0.05);
          x.dropsOut++;
          if (x.dropBudget != null && --x.dropBudget <= 0) openCock(lab, 0);
          const tip = bur.tipWorld();
          if (!x.tipFilled) deliver(lab, 0.05, into);
          else {
            const surf = into ? lab.items[into].group.localToWorld(V3(0, lab.items[into].app.v.level, 0)).y : -3 + TILE_Y + 0.5;
            x.pendingDrops++;
            fx.drops.drop(tip, surf, T.color, () => { x.pendingDrops--; deliver(lab, 0.05, into); lab.sfx('drip'); });
          }
        }
      }
      // Transient colour fades as it mixes; slower near the end point, faster when swirled
      const ex = excess(lab);
      if (x.flash > 0) {
        const rate = ex < 0 ? (0.35 + 2.5 * Math.min(1, -ex / 1.5)) * (x.swirling ? 3 : 1) : 0;
        x.flash *= Math.exp(-dt * rate);
        if (x.flash < 0.005) x.flash = 0;
        flaskColour(lab);
      }
    },
    update: (lab, dt, t) => {
      C.update(dt, t);
      const x = lab.x;
      if (!x.c || !bur) return;
      if (x.cock >= 0.6 && x.bur < 50) {
        const into = underTip(lab);
        const tip = bur.tipWorld();
        const surf = into ? lab.items[into].group.localToWorld(V3(0, lab.items[into].app.v.level, 0)) : V3(tip.x, -3 + TILE_Y + 0.5, tip.z);
        if (!x.tipFilled) fx.bstream.hide(); else fx.bstream.show(tip, surf, T.color, 0.09);
      } else fx.bstream.hide();
    },
    chips: (lab) => {
      const x = lab.x;
      const ex = excess(lab);
      const shows = cfg.selfIndicator || x.ind;
      return [
        [`Burette: ${x.bur > 50 ? 'empty' : `${x.bur.toFixed(2)} mL`}`, ''],
        [`Stopcock: ${x.cock >= 0.6 ? 'open' : x.cock > 0 ? 'drop-wise' : 'closed'}`, x.cock > 0 ? 'hot' : ''],
        [flaskV(lab).vol < 1 ? 'Flask: empty' : !shows ? 'Flask: no indicator yet' : x.inFlask > 0 && ex >= 0 ? `End point (${cfg.endName})` : 'Before end point', ex >= 0 && x.inFlask > 0 ? 'ok' : ''],
      ];
    },
    ui: (lab) => {
      const x = lab.x;
      const $ = (id) => document.getElementById(id);
      const ex = excess(lab);
      const r = x.bur > 50 ? '—' : `${x.bur.toFixed(2)} mL`;
      $('mRead').textContent = r; $('dReading').textContent = r;
      $('mAdd').textContent = `${x.added.toFixed(2)} mL`;
      $('dAdded').textContent = `Added this titration: ${x.added.toFixed(2)} mL`;
      const colName = flaskV(lab).vol < 1 ? 'empty' : !(cfg.selfIndicator || x.ind) ? A.colourName : ex >= 0 ? (ex > 0.4 ? `deep ${cfg.endName}` : `faint ${cfg.endName}`) : x.flash > 0.15 ? `${cfg.endName} flashes, fading` : cfg.beforeName;
      $('mCol').textContent = colName;
      $('dState').textContent = `Flask: ${colName}`;
      $('mCock').textContent = x.cock >= 0.6 ? 'open' : x.cock > 0 ? 'drop-wise' : 'closed';
    },
    result: (lab) => {
      const m = meanUsed(lab);
      const n = lab.rows.length;
      const Mcalc = m ? cfg.molarity(m, ALIQUOT) : null;
      const reveal = n >= 3;
      const items2 = [
        ['Mean titre', m ? `${m.toFixed(2)} mL` : '—'],
        [cfg.resultLabel, Mcalc ? `${Mcalc.toFixed(3)} M` : '—'],
        ['Actual (revealed after 3)', reveal ? `${lab.x.M.toFixed(3)} M` : 'hidden'],
        ['Error', reveal && Mcalc ? `${(((Mcalc - lab.x.M) / lab.x.M) * 100).toFixed(2)} %` : '—'],
      ];
      if (cfg.extraResult && Mcalc) items2.push(...cfg.extraResult(Mcalc));
      const cc = concordant(lab);
      return { items: items2, note: n ? `${cfg.equation} ${cc == null ? '' : cc ? 'Readings are concordant.' : 'Readings are not concordant — repeat a titration.'}` : cfg.equation };
    },
    obsRows: 3,
    obsKeys: [cfg.keys.aliquot, 'init', 'final', cfg.keys.titrant],
    observation: (lab) => ({
      rows: lab.rows.map((r) => ({ [cfg.keys.aliquot]: r.aliquot.toFixed(1), init: r.init.toFixed(1), final: r.final.toFixed(1), [cfg.keys.titrant]: r.used.toFixed(1) })),
      metricInputs: cfg.metricInputs || {},
    }),
  };
}
