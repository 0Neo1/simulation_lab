// Convex lens on an optical bench (phy122: focal length by the u–v method;
// phy103: nature of the image for different object distances). The image on
// the screen is computed from the thin-lens equation, and blurred by the
// real defocus of a lens of finite aperture.
import * as THREE from 'three';
import * as PH from '../lab-engine/phys.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const BENCH_Z = -8, RAIL_TOP = 6, AXIS = RAIL_TOP + 16, LEN = 150, APERTURE = 2.4;
const markToX = (m) => -LEN / 2 + m;
const xToMark = (x) => x + LEN / 2;
const WORLD_Y = (y) => -3 + y;

function buildBench(M) {
  const g = new THREE.Group();
  const iron = PH.PM.castIron;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(LEN + 6, 3, 8), iron); rail.position.y = RAIL_TOP - 1.5; rail.castShadow = true;
  const top = new THREE.Mesh(new THREE.BoxGeometry(LEN + 6, 0.4, 8.4), PH.PM.darkSteel); top.position.y = RAIL_TOP + 0.2;
  [-LEN / 2 + 2, LEN / 2 - 2].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(4, RAIL_TOP - 3, 14), iron); leg.position.set(x, (RAIL_TOP - 3) / 2, 0); leg.castShadow = true; g.add(leg);
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1, 10), PH.PM.brass); screw.position.set(x, 0.5, 6); g.add(screw);
  });
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 2.6), new THREE.MeshStandardMaterial({ map: PH.scaleTexture(LEN, { vertical: false, bg: '#f2e8cc' }), roughness: 0.6 }));
  scale.rotation.x = -0.35; scale.position.set(0, RAIL_TOP - 0.4, 4.6);
  g.add(rail, top, scale);
  return { group: g, size: [LEN + 6, RAIL_TOP, 14], grip: V3(0, RAIL_TOP, 4) };
}

// An upright on a carriage that slides on the bench, with an index mark
function carriage(g) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, 9.6), PH.PM.darkSteel); base.position.y = 1.2; base.castShadow = true;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, AXIS - RAIL_TOP - 4, 12), PH.PM.steel); rod.position.y = (AXIS - RAIL_TOP - 4) / 2 + 2.4;
  const idx = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 1.6), new THREE.MeshBasicMaterial({ color: 0xdc2626 })); idx.position.set(0, 0.2, 5.4);
  g.add(base, rod, idx);
}
function buildLamp() {
  const g = new THREE.Group();
  carriage(g);
  const h = AXIS - RAIL_TOP;
  const box = new THREE.Mesh(new THREE.BoxGeometry(7, 8, 7), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 })); box.position.set(-1.5, h, 0); box.castShadow = true;
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.2, 14), PH.PM.darkSteel); vent.position.set(-1.5, h + 4.6, 0);
  // front plate with an illuminated arrow-shaped aperture (the object)
  const objTex = PH.tex(128, 128, (c, w) => { c.fillStyle = '#111'; c.fillRect(0, 0, w, w); drawObject(c, w / 2, w / 2, 96, '#fff6c8'); });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ map: objTex, emissiveMap: objTex, emissive: 0xfff2b0, emissiveIntensity: 0, roughness: 0.6 }));
  plate.rotation.y = Math.PI / 2; plate.position.set(2.05, h, 0);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.6), PH.PM.red); sw.position.set(-1.5, h - 4.4, 3.2);
  const cable = new THREE.Mesh(new THREE.TorusGeometry(6, 0.25, 6, 20, Math.PI * 0.8), new THREE.MeshStandardMaterial({ color: 0x111111 })); cable.position.set(-5, h - 8, 0); cable.rotation.y = Math.PI / 2;
  const light = new THREE.PointLight(0xfff0c0, 0, 90, 2); light.position.set(3.5, h, 0);
  g.add(box, vent, plate, sw, cable, light);
  return { group: g, plate, sw, light, size: [7, h + 5, 10], grip: V3(-1.5, h + 4, 3.6) };
}
function buildLens() {
  const g = new THREE.Group();
  carriage(g);
  const h = AXIS - RAIL_TOP;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 10, 32), PH.PM.darkSteel); ring.rotation.y = Math.PI / 2; ring.position.y = h;
  const cap = (s) => { const m = new THREE.Mesh(new THREE.SphereGeometry(12, 32, 12, 0, Math.PI * 2, 0, 0.26), new THREE.MeshPhysicalMaterial({ color: 0xe8f6ff, roughness: 0.02, transparent: true, opacity: 0.35, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide })); m.rotation.z = s * Math.PI / 2; m.position.set(-s * 11.6, h, 0); return m; };
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 0.6), PH.PM.darkSteel); stem.position.y = h - 4.5;
  g.add(ring, cap(1), cap(-1), stem);
  return { group: g, size: [3, h + 4, 10], grip: V3(0, h - 5, 0.8), pose: 'pinch' };
}
function buildScreen() {
  const g = new THREE.Group();
  carriage(g);
  const h = AXIS - RAIL_TOP;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 21, 21), new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6 })); frame.position.set(1.2, h, 0); frame.castShadow = true;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.35 }));
  face.rotation.y = -Math.PI / 2; face.position.set(0.75, h, 0);
  g.add(frame, face);
  return { group: g, canvas, texture: t, face, size: [1, h + 11, 21], grip: V3(0.5, h + 10.5, 0) };
}
// The illuminated object: an upright arrow with a flag, so inversion and left–right reversal show
function drawObject(c, cx, cy, s, col) {
  c.fillStyle = col;
  c.fillRect(cx - s * 0.06, cy - s * 0.5, s * 0.12, s * 0.9);
  c.beginPath(); c.moveTo(cx, cy - s * 0.62); c.lineTo(cx - s * 0.2, cy - s * 0.36); c.lineTo(cx + s * 0.2, cy - s * 0.36); c.fill();
  c.fillRect(cx, cy - s * 0.3, s * 0.28, s * 0.16);
}

export function optics(cfg) {
  let bench = null;
  const pos = (lab, k) => xToMark(lab.items[k].group.position.x);
  const optic = (lab) => {
    const o = pos(lab, 'lamp'), l = pos(lab, 'lens'), s = pos(lab, 'screen');
    const u = l - o, d = s - l, f = lab.x.f;
    const v = u !== f ? (u * f) / (u - f) : Infinity;
    return { o, l, s, u, d, v, f, m: v / u };
  };
  function renderScreen(lab) {
    const sc = lab.items.screen.app;
    const c = sc.canvas.getContext('2d');
    const on = lab.x.lampOn && lab.items.lamp.placed && lab.items.screen.placed;
    const key = on ? `${pos(lab, 'lamp').toFixed(2)}|${pos(lab, 'lens').toFixed(2)}|${pos(lab, 'screen').toFixed(2)}|${lab.items.lens.placed}` : 'off';
    if (key === lab.x.screenKey) return;
    lab.x.screenKey = key;
    c.filter = 'none';
    c.fillStyle = '#b4b1a8'; c.fillRect(0, 0, 256, 256);
    if (!on) { sc.texture.needsUpdate = true; return; }
    const px = 256 / 20; // pixels per cm on the screen
    const o = optic(lab);
    const lensIn = lab.items.lens.placed && o.u > 0 && o.d > 0;
    if (!lensIn) {
      // no lens: a faint, uniform patch of lamplight
      c.fillStyle = 'rgba(255,240,190,0.25)'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill();
    } else if (o.v > 0 && Number.isFinite(o.v)) {
      const m = -o.v / o.u; // inverted
      const blurCm = (2 * APERTURE * Math.abs(o.d - o.v)) / o.v;
      const scale = Math.abs(m);
      const bright = (0.55 + 0.45 / Math.max(0.6, scale)) / (1 + blurCm * 0.6);
      c.save();
      c.filter = `blur(${Math.min(40, blurCm * px * 0.5).toFixed(1)}px)`;
      c.translate(128, 128); c.scale(-1, -1); // real image: inverted, and reversed left to right
      c.globalCompositeOperation = 'lighter';
      drawObject(c, 0, 0, 4.5 * scale * px, `rgba(255,236,160,${Math.min(1, bright * 1.6).toFixed(3)})`);
      c.restore();
      // a disc of scattered light from the lens
      c.filter = 'none';
      c.fillStyle = `rgba(255,240,200,${(0.06 + 0.12 / (1 + scale)).toFixed(3)})`;
      c.beginPath(); c.arc(128, 128, Math.min(125, (APERTURE * px * o.d) / Math.max(1, o.u) * 2 + 20), 0, 7); c.fill();
    } else {
      // object inside F: rays diverge — only a blurred, wide patch of light
      c.fillStyle = 'rgba(255,240,190,0.3)'; c.beginPath(); c.arc(128, 128, 110, 0, 7); c.fill();
    }
    sc.texture.needsUpdate = true;
  }
  const sharpness = (lab) => { const o = optic(lab); return o.v > 0 && Number.isFinite(o.v) ? (2 * APERTURE * Math.abs(o.d - o.v)) / o.v : Infinity; };

  async function slideTo(lab, key, mark) {
    const it = lab.items[key];
    const R = lab.handR();
    const grip = () => it.group.localToWorld(V3(0, 1.8, 4.6));
    await lab.touch(grip(), null, { pose: 'pinch' });
    const x0 = it.group.position.x, x1 = markToX(THREE.MathUtils.clamp(mark, 2, LEN - 2));
    await lab.tween(0.4 + Math.abs(x1 - x0) / 60, (e) => { it.group.position.x = x0 + (x1 - x0) * e; R.goal.copy(grip()); });
  }
  // Move the screen back and forth, narrowing in on the sharpest image
  async function focusScreen(lab) {
    const o = optic(lab);
    if (!(o.v > 0 && Number.isFinite(o.v))) { lab.toast('No sharp image can be caught on the screen for this object position.', 'warn', 5000); return false; }
    const best = o.l + o.v + (Math.random() - 0.5) * 0.4; // depth of focus: the eye judges within a few mm
    const far = Math.min(LEN - 2, best + 8), near = Math.max(o.l + 2, best - 6);
    if (best > LEN - 2) { lab.toast('The image would form beyond the end of the bench — move the object farther from the lens.', 'warn'); return false; }
    await slideTo(lab, 'screen', near);
    await slideTo(lab, 'screen', far);
    await slideTo(lab, 'screen', best - 1.2);
    await slideTo(lab, 'screen', best);
    return true;
  }
  async function toggleLamp(lab) {
    await lab.touch(lab.items.lamp.app.sw, () => { lab.x.lampOn = !lab.x.lampOn; lab.sfx('click'); });
  }
  function natureOf(u, f) {
    const r = u / f;
    if (Math.abs(r - 1) < 0.03) return 'At infinity (highly magnified)';
    if (r < 1) return 'Virtual, erect, magnified';
    if (Math.abs(r - 2) < 0.04) return 'Real, inverted, same size';
    if (r > 2) return 'Real, inverted, diminished';
    return 'Real, inverted, magnified';
  }
  async function takeReading(lab, u) {
    const x = lab.x;
    if (!x.lampOn) await toggleLamp(lab);
    const lensMark = pos(lab, 'lens');
    await slideTo(lab, 'lamp', lensMark - u);
    const f = x.f;
    const uu = pos(lab, 'lens') - pos(lab, 'lamp');
    if (uu / f > 1.03) {
      const ok = await focusScreen(lab);
      if (!ok) return;
    } else {
      // image at infinity or virtual: look through the lens from the far side
      if (lab.items.screen.placed) await slideTo(lab, 'screen', LEN - 3);
      lab.toast(uu / f < 0.97 ? 'No image on the screen: looking through the lens, an erect, magnified (virtual) image is seen on the same side as the object.' : 'At F the refracted rays are parallel — the image is at infinity.', 'info', 6000);
    }
    await record(lab);
  }
  async function record(lab) {
    const x = lab.x, o = optic(lab);
    if (!lab.items.lens.placed || !lab.items.lamp.placed || !lab.items.screen.placed) { lab.toast('Mount the lamp, lens and screen on the bench first.', 'err'); return; }
    if (!x.lampOn) { lab.toast('Switch on the lamp first.', 'err'); return; }
    const u = Math.round(o.u * 10) / 10;
    const ratio = o.u / o.f;
    let v = null;
    if (ratio > 1.03) {
      const blur = sharpness(lab);
      if (blur > 0.25) { lab.toast('The image on the screen is not sharp — move the screen until it is sharpest.', 'err'); return; }
      v = Math.round(o.d * 10) / 10;
    } else if (!cfg.allowVirtual) { lab.toast('No real image forms: the object is at or inside the focus. Move it farther from the lens.', 'err'); return; }
    if (lab.rows.some((r) => Math.abs(r.u - u) < 0.5)) { lab.toast('You already have a reading at this object distance — choose another.', 'warn'); return; }
    const row = { u, v, nature: natureOf(o.u, o.f) };
    if (v != null) { row.f = (u * v) / (u + v); row.m = v / u; } else if (ratio < 0.97) { const vv = (o.u * o.f) / (o.u - o.f); row.vVirtual = Math.round(vv * 10) / 10; row.m = Math.abs(vv / o.u); }
    lab.addRow(row);
    lab.toast(v != null ? `u = ${u.toFixed(1)} cm, v = ${v.toFixed(1)} cm → f = ${row.f.toFixed(2)} cm` : `u = ${u.toFixed(1)} cm: ${row.nature}`, 'ok', 5000);
  }

  const readings = (f) => cfg.uFactors.map((k) => Math.round(k * f));
  return {
    id: cfg.id,
    lab: 'Physics Lab',
    title: cfg.title,
    intro: cfg.intro,
    board: cfg.board,
    items: {
      bench: { name: 'Optical bench', label: 'Optical bench (150 cm)', build: (lab) => { bench = buildBench(lab.M); return bench; }, slot: [0, BENCH_Z, 0], fixed: true, labelY: 2 },
      lamp: { name: 'Illuminated object (lamp)', label: 'Illuminated object', build: () => buildLamp(), slot: [markToX(20), BENCH_Z, 0], slotY: WORLD_Y(RAIL_TOP + 0.4), setupText: 'Mount the illuminated object (lamp with an arrow-shaped opening) on the bench near the left end.' },
      lens: { name: 'Convex lens in holder', label: 'Convex lens', build: () => buildLens(), slot: [markToX(cfg.lensMark), BENCH_Z, 0], slotY: WORLD_Y(RAIL_TOP + 0.4), setupText: `Mount the convex lens at the ${cfg.lensMark} cm mark.`, why: 'Keep the lens fixed; move only the object and the screen.' },
      screen: { name: 'White screen', label: 'Screen', build: () => buildScreen(), slot: [markToX(cfg.lensMark + 40), BENCH_Z, 0], slotY: WORLD_Y(RAIL_TOP + 0.4), setupText: 'Mount the white screen on the other side of the lens.', why: 'Lamp, lens centre and screen centre must be at the same height and in a line (the optical axis).' },
    },
    setupOrder: ['lamp', 'lens', 'screen'],
    views: {
      screen: { label: 'Screen', pos: (lab) => { const p = lab.items.screen.group.position; return [p.x - 30, WORLD_Y(AXIS + 6), p.z + 22]; }, target: (lab) => { const p = lab.items.screen.group.position; return [p.x, WORLD_Y(AXIS), p.z]; } },
      optbench: { label: 'Optical bench', fit: [-80, 80, [0, 10, BENCH_Z]] },
    },
    classicView: 'optbench',
    pips: [
      { id: 'img', title: 'Image on the screen', fov: 40, update: (cam, lab) => { const p = lab.items.screen.group.position; cam.position.set(p.x - 22, WORLD_Y(AXIS) + 2, p.z + 9); cam.lookAt(p.x, WORLD_Y(AXIS), p.z); }, show: (lab) => lab.items.screen.placed },
      { id: 'scale', title: 'Bench scale at the screen', fov: 26, update: (cam, lab) => { const p = lab.items.screen.group.position; cam.position.set(p.x, WORLD_Y(RAIL_TOP + 9), p.z + 13); cam.lookAt(p.x, WORLD_Y(RAIL_TOP), p.z + 4.6); }, show: (lab) => lab.items.screen.placed },
    ],
    overlay: '<b>Optical bench</b><div id="oPos"></div><span class="big" id="oUV">u = —</span><div id="oSharp"></div>',
    hintExtra: 'drag the <b>uprights</b> along the bench · click the lamp <b>switch</b>',
    panel: [{
      title: 'Optical bench',
      html: `
        <div class="row"><button class="btn act" id="oLamp">Switch on lamp</button><button class="btn ghost act" id="oFocus">Focus the screen (demo)</button></div>
        <label class="lbl">Object position <span class="big" id="oObjV">—</span></label>
        <input type="range" id="oObj" min="2" max="${cfg.lensMark - 3}" step="0.1" value="20" />
        <label class="lbl">Screen position <span class="big" id="oScrV">—</span></label>
        <input type="range" id="oScr" min="${cfg.lensMark + 3}" max="${LEN - 2}" step="0.1" value="${cfg.lensMark + 40}" />
        <div class="meters">
          <div class="m"><i>Object distance u</i><b id="oU">—</b></div>
          <div class="m"><i>Screen distance</i><b id="oD">—</b></div>
          <div class="m"><i>Image</i><b id="oImg">—</b></div>
          <div class="m"><i>Rough focal length</i><b id="oRough">—</b></div>
        </div>`,
      bind: (lab, root) => {
        const $ = (id) => root.querySelector(`#${id}`);
        $('oLamp').onclick = () => lab.act(() => toggleLamp(lab));
        $('oFocus').onclick = () => lab.act(() => focusScreen(lab));
        $('oObj').oninput = (e) => { if (!lab.autopilot && lab.items.lamp.placed) lab.items.lamp.group.position.x = markToX(+e.target.value); };
        $('oScr').oninput = (e) => { if (!lab.autopilot && lab.items.screen.placed) lab.items.screen.group.position.x = markToX(+e.target.value); };
      },
    }],
    table: {
      columns: cfg.columns,
      recordLabel: 'Record u and v',
      note: cfg.tableNote,
    },
    record: (lab) => lab.act(() => record(lab)),
    steps: (lab) => {
      const list = [
        { phase: 'Rough focal length', text: 'Point the lens at the window and catch a sharp image of the distant trees on the screen: the lens–screen distance is the rough focal length.', why: 'Rays from a very distant object are parallel, so they meet at the focus.', check: () => lab.x.rough != null, demo: async () => { await lab.touch(lab.items.lens.group.localToWorld(V3(0, AXIS - RAIL_TOP, 0)), null, { pose: 'pinch' }); await lab.wait(0.8); lab.x.rough = Math.round(lab.x.f + (Math.random() - 0.5) * 1.5); lab.toast(`Rough focal length ≈ ${lab.x.rough} cm. Choose object distances between about 1.5f and 3f.`, 'info', 6000); } },
        { phase: 'Rough focal length', text: 'Switch on the lamp. Check that the lamp opening, lens centre and screen centre are at the same height.', check: () => lab.x.lampOn, demo: () => toggleLamp(lab), rings: () => [lab.items.lamp.app.sw.getWorldPosition(V3())] },
      ];
      cfg.uFactors.forEach((k, i) => list.push({
        phase: 'Readings',
        text: cfg.stepText(i, k),
        why: i === 0 ? cfg.firstWhy : cfg.whys?.[i] || '',
        check: () => lab.rows.length > i,
        demo: () => takeReading(lab, readings(lab.x.f)[i]),
      }));
      return list;
    },
    state: () => ({ f: cfg.f ? cfg.f() : 15 + Math.random() * 5, lampOn: false, rough: null, screenKey: '' }),
    init: (lab) => {
      ['lamp', 'lens', 'screen'].forEach((k) => {
        const it = lab.items[k];
        let x0 = 0;
        lab.actionable(it.group, {
          tip: () => `${it.name} at ${pos(lab, k).toFixed(1)} cm — drag along the bench`,
          enabled: () => it.placed && !lab.carried.has(k),
          drag: {
            start: () => { x0 = it.group.position.x; },
            move: (p, s) => { const lo = k === 'screen' ? lab.items.lens.group.position.x + 3 : -LEN / 2 + 2, hi = k === 'lamp' ? lab.items.lens.group.position.x - 3 : LEN / 2 - 2; it.group.position.x = THREE.MathUtils.clamp(x0 + p.x - s.x, lo, hi); },
            hand: () => it.group.localToWorld(V3(0, 1.8, 4.6)),
          },
        });
      });
      lab.actionable(lab.items.lamp.app.sw, { tip: () => `Lamp switch — click to switch ${lab.x.lampOn ? 'off' : 'on'}`, run: () => toggleLamp(lab), enabled: () => lab.items.lamp.placed });
    },
    reset: (lab) => { lab.x.screenKey = ''; },
    quickSetup: (lab) => { lab.x.rough = Math.round(lab.x.f); },
    update: (lab) => {
      const x = lab.x;
      if (x.f == null) return;
      const lamp = lab.items.lamp.app;
      lamp.plate.material.emissiveIntensity = x.lampOn ? 2.2 : 0;
      lamp.light.intensity = x.lampOn ? 60 : 0;
      renderScreen(lab);
    },
    chips: (lab) => [[`Lamp: ${lab.x.lampOn ? 'on' : 'off'}`, lab.x.lampOn ? 'ok' : ''], [`Readings: ${lab.rows.length} of ${cfg.uFactors.length}`, '']],
    ui: (lab) => {
      const $ = (id) => document.getElementById(id);
      const o = optic(lab);
      $('oPos').textContent = `object ${o.o.toFixed(1)} · lens ${o.l.toFixed(1)} · screen ${o.s.toFixed(1)} cm`;
      $('oUV').textContent = `u = ${o.u.toFixed(1)} cm`;
      const b = sharpness(lab);
      const img = !lab.x.lampOn ? 'lamp off' : !(o.v > 0 && Number.isFinite(o.v)) ? 'no real image' : b < 0.25 ? 'sharp' : b < 1 ? 'slightly blurred' : 'blurred';
      $('oSharp').textContent = `Image on screen: ${img}`;
      $('oU').textContent = `${o.u.toFixed(1)} cm`; $('oD').textContent = `${o.d.toFixed(1)} cm`; $('oImg').textContent = img;
      $('oImg').className = img === 'sharp' ? 'ok' : '';
      $('oRough').textContent = lab.x.rough ? `≈ ${lab.x.rough} cm` : '—';
      $('oObjV').textContent = `${o.o.toFixed(1)} cm`; $('oScrV').textContent = `${o.s.toFixed(1)} cm`;
      $('oObj').value = o.o; $('oScr').value = o.s;
      $('oLamp').textContent = lab.x.lampOn ? 'Switch off lamp' : 'Switch on lamp';
    },
    result: (lab) => cfg.result(lab),
    obsRows: cfg.obsRows,
    obsKeys: cfg.obsKeys,
    observation: (lab) => ({ rows: lab.rows.map(cfg.obsRow) }),
  };
}
