// Physics apparatus shared by the 3D labs: moving-coil meters, rheostat,
// cells and keys with binding screws (leads connect to them), springs,
// slotted weights, scales and stands. Units: cm.
import * as THREE from 'three';
import * as S from '../meter-bridge/scene.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const mesh = (g, m, cast = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; return o; };
const live = new Set();
export function update(dt, t) { for (const o of live) o.update(dt, t); }

export const PM = {
  bakelite: new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.42 }),
  black: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xefe6d2, roughness: 0.6 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xc3cad1, metalness: 1, roughness: 0.25 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: 0x4b5058, metalness: 0.9, roughness: 0.4 }),
  castIron: new THREE.MeshStandardMaterial({ color: 0x2d3136, metalness: 0.6, roughness: 0.55 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xd9a948, metalness: 1, roughness: 0.28 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xc27a4a, metalness: 1, roughness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ map: S.woodTexture('#8a5a33', '#3b2413', 3), roughness: 0.55 }),
  darkWood: new THREE.MeshStandardMaterial({ map: S.woodTexture('#5a2616', '#2a0f07', 5), roughness: 0.5 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: 0.5 }),
  red: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xf4fbff, roughness: 0.05, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
  glassSolid: new THREE.MeshPhysicalMaterial({ color: 0xdff2fa, roughness: 0.03, transparent: true, opacity: 0.45, clearcoat: 1, depthWrite: false }),
};
export const tex = S.canvasTexture;
export const label = S.labelTexture;
export const terminal = (M, group, terms, name, pos, lbl) => S.terminal(M, group, terms, name, pos, lbl);

// Damped moving-coil needle (natural frequency ~1.2 Hz, lightly damped)
export function needleModel({ w = 2 * Math.PI * 1.2, zeta = 0.45, min = -0.05, max = 1.08 } = {}) {
  const n = { x: 0, v: 0, target: 0 };
  n.step = (dt) => {
    const steps = Math.max(1, Math.ceil(dt / 0.004)), h = dt / steps;
    for (let i = 0; i < steps; i++) {
      n.v += (w * w * (n.target - n.x) - 2 * zeta * w * n.v) * h;
      n.x += n.v * h;
      if (n.x > max) { n.x = max; n.v *= -0.3; }
      if (n.x < min) { n.x = min; n.v *= -0.3; }
    }
  };
  return n;
}

// ---------------------------------------------------------------------------
// Moving-coil meter with an inclined dial (ammeter, voltmeter, galvanometer)
// ---------------------------------------------------------------------------

export function dialMeter(M, { symbol = 'A', max = 1, major = 0.2, minor = 0.02, zeroCentre = false, name = 'Ammeter', range = '', labelDec = 1 } = {}) {
  const group = new THREE.Group();
  const terms = {};
  const W = 13, H = 9, D = 10;
  const body = mesh(new THREE.BoxGeometry(W, H, D), PM.bakelite);
  body.position.y = H / 2;
  group.add(body);
  const A0 = THREE.MathUtils.degToRad(-48), A1 = THREE.MathUtils.degToRad(48);
  const face = tex(512, 360, (g, w, h) => {
    g.fillStyle = '#f3ecd9'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.92, R = h * 0.78;
    g.strokeStyle = '#111'; g.fillStyle = '#111'; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2 + A0, -Math.PI / 2 + A1); g.stroke();
    const lo = zeroCentre ? -max : 0;
    const n = Math.round((max - lo) / minor);
    for (let i = 0; i <= n; i++) {
      const v = lo + i * minor;
      const a = -Math.PI / 2 + A0 + ((v - lo) / (max - lo)) * (A1 - A0);
      const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
      const isMid = !isMaj && Math.abs(v / (major / 2) - Math.round(v / (major / 2))) < 1e-6;
      const L = isMaj ? 26 : isMid ? 18 : 11;
      g.lineWidth = isMaj ? 3 : 1.6;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * (R - L), cy + Math.sin(a) * (R - L)); g.stroke();
      if (isMaj) {
        g.font = 'bold 26px Arial'; g.textAlign = 'center';
        g.fillText(String(Math.abs(v) < 1e-9 ? 0 : +v.toFixed(labelDec)), cx + Math.cos(a) * (R - 46), cy + Math.sin(a) * (R - 46) + 9);
      }
    }
    g.font = 'bold 64px Georgia'; g.textAlign = 'center'; g.fillText(symbol, cx, cy - R * 0.36);
    g.font = '22px Arial'; g.fillText(range, cx, cy - R * 0.16);
    // mirror strip against parallax
    g.fillStyle = '#b8c4cc'; g.beginPath(); g.arc(cx, cy, R - 30, -Math.PI / 2 + A0, -Math.PI / 2 + A1); g.arc(cx, cy, R - 36, -Math.PI / 2 + A1, -Math.PI / 2 + A0, true); g.fill();
  });
  const dial = new THREE.Group();
  dial.position.set(0, H + 0.02, -0.5);
  dial.rotation.x = -Math.PI / 2 + 0.55; // inclined toward the student
  const plate = mesh(new THREE.BoxGeometry(W - 0.6, D - 1, 0.5), PM.black);
  plate.position.z = -0.25;
  dial.add(plate);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(11, 7.7), new THREE.MeshStandardMaterial({ map: face, roughness: 0.6 }));
  card.position.z = 0.02;
  dial.add(card);
  const pivot = new THREE.Group();
  pivot.position.set(0, -7.7 * 0.42, 0.12);
  const needle = mesh(new THREE.BoxGeometry(0.08, 5.6, 0.04), new THREE.MeshStandardMaterial({ color: 0x111111 }), false);
  needle.position.y = 2.8;
  const hub = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), PM.brass);
  hub.rotation.x = Math.PI / 2;
  pivot.add(needle, hub);
  dial.add(pivot);
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(11.2, 7.9), PM.glass);
  cover.position.z = 0.5;
  dial.add(cover);
  // raise the dial so it is on a sloping front
  group.add(dial);
  const sPlus = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.3, 16), PM.red); sPlus.position.set(3.2, H + 0.1, D / 2 - 1.3);
  const sMinus = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.3, 16), PM.black); sMinus.position.set(-3.2, H + 0.1, D / 2 - 1.3);
  group.add(sPlus, sMinus);
  terminal(M, group, terms, '+', V3(3.2, H + 0.2, D / 2 - 1.3), `${name} (+)`);
  terminal(M, group, terms, '-', V3(-3.2, H + 0.2, D / 2 - 1.3), `${name} (−)`);
  const nm = needleModel({ min: zeroCentre ? -1.08 : -0.05 });
  const api = {
    group, terminals: terms, pivot, dial, needle: nm, max, zeroCentre, name,
    size: [W, H + 3, D], grip: V3(0, H * 0.6, D / 2),
    set(value) { nm.target = value / max; },
    reading() { return nm.x * max; },
    faceWorld(off = 6) { group.updateMatrixWorld(true); return { eye: dial.localToWorld(V3(0, -0.6, off)), at: dial.localToWorld(V3(0, -0.6, 0)) }; },
    update(dt) {
      nm.step(dt);
      const lo = zeroCentre ? -1 : 0;
      pivot.rotation.z = -(A0 + ((nm.x - lo) / (1 - lo)) * (A1 - A0));
    },
  };
  return api; // call api.update(dt) from the experiment's simulate step
}

// ---------------------------------------------------------------------------
// Rheostat (sliding contact), resistance coil, cells, keys
// ---------------------------------------------------------------------------

export function rheostat(M, { Rmax = 20, name = 'Rheostat' } = {}) {
  const group = new THREE.Group();
  const terms = {};
  const L = 30;
  const base = mesh(new THREE.BoxGeometry(L + 6, 1, 7), PM.castIron); base.position.y = 0.5;
  const endA = mesh(new THREE.BoxGeometry(1.2, 9, 6), PM.castIron); endA.position.set(-L / 2 - 1.5, 4.5, 0);
  const endB = endA.clone(); endB.position.x = L / 2 + 1.5;
  const wound = tex(1024, 64, (g, w, h) => {
    g.fillStyle = '#8f6b4d'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 5) { g.fillStyle = x % 10 ? '#c89b6a' : '#e0b98a'; g.fillRect(x, 0, 3, h); }
  });
  wound.wrapS = THREE.RepeatWrapping;
  const tube = mesh(new THREE.CylinderGeometry(2.4, 2.4, L, 28), [new THREE.MeshStandardMaterial({ map: wound, metalness: 0.6, roughness: 0.35 }), PM.ceramic, PM.ceramic]);
  tube.rotation.z = Math.PI / 2; tube.position.set(0, 4.2, 0);
  const rod = mesh(new THREE.BoxGeometry(L + 3, 0.7, 0.7), PM.brass); rod.position.set(0, 8.6, 0);
  group.add(base, endA, endB, tube, rod);
  const slider = new THREE.Group();
  const shoe = mesh(new THREE.BoxGeometry(2.2, 1.6, 2.2), PM.black); shoe.position.y = 8.6;
  const spring = mesh(new THREE.BoxGeometry(0.6, 2.4, 0.4), PM.brass); spring.position.set(0, 7.2, 0);
  const knob = mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.4, 16), PM.black); knob.position.y = 10.1;
  slider.add(shoe, spring, knob);
  group.add(slider);
  terminal(M, group, terms, 'A', V3(-L / 2 - 1.5, 1, 3.1), `${name} end A`);
  terminal(M, group, terms, 'B', V3(L / 2 + 1.5, 1, 3.1), `${name} end B`);
  terminal(M, group, terms, 'C', V3(L / 2 + 1.5, 9.4, 0), `${name} slider C`);
  const api = {
    group, terminals: terms, slider, knob, Rmax, f: 0.5, length: L,
    size: [L + 6, 11, 7], grip: V3(0, 5, 3.4),
    // fraction of the winding between end A and the slider
    set(f) { api.f = THREE.MathUtils.clamp(f, 0, 1); slider.position.x = -L / 2 + api.f * L; },
    knobWorld() { group.updateMatrixWorld(true); return knob.getWorldPosition(V3()); },
  };
  api.set(0.5);
  return api;
}

export function resistanceCoil(M, { labelText = 'R' } = {}) {
  const group = new THREE.Group();
  const terms = {};
  const base = mesh(new THREE.BoxGeometry(14, 1.2, 6), PM.darkWood); base.position.y = 0.6;
  const bob = mesh(new THREE.CylinderGeometry(1.6, 1.6, 9, 24), new THREE.MeshStandardMaterial({ map: tex(512, 64, (g, w, h) => { g.fillStyle = '#6d3b1c'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 4) { g.fillStyle = '#c47b3d'; g.fillRect(x, 0, 2, h); } }), metalness: 0.5, roughness: 0.35 }));
  bob.rotation.z = Math.PI / 2; bob.position.set(0, 3.4, -0.5);
  const cheek1 = mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.5, 24), PM.black); cheek1.rotation.z = Math.PI / 2; cheek1.position.set(-4.7, 3.4, -0.5);
  const cheek2 = cheek1.clone(); cheek2.position.x = 4.7;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.2), new THREE.MeshStandardMaterial({ map: label(labelText, { bg: '#e8dcc0', fg: '#111', w: 256, h: 80, font: 'bold 44px Georgia' }) }));
  plate.rotation.x = -Math.PI / 2; plate.position.set(0, 1.22, 2.1);
  group.add(base, bob, cheek1, cheek2, plate);
  terminal(M, group, terms, '1', V3(-5.6, 1.2, 1.8), `Resistance coil ${labelText} terminal 1`);
  terminal(M, group, terms, '2', V3(5.6, 1.2, 1.8), `Resistance coil ${labelText} terminal 2`);
  return { group, terminals: terms, size: [14, 5.5, 6], grip: V3(0, 5.2, 0) };
}

// Battery of dry cells in a holder, or single cells of a given kind
export function battery(M, { cells = 4, emf = 1.5, name = 'Battery' } = {}) {
  const group = new THREE.Group();
  const terms = {};
  const w = cells * 3.6 + 2;
  const box = mesh(new THREE.BoxGeometry(w, 2, 7.4), PM.black); box.position.y = 1;
  group.add(box);
  for (let i = 0; i < cells; i++) {
    const c = mesh(new THREE.CylinderGeometry(1.6, 1.6, 6.4, 20), new THREE.MeshStandardMaterial({ color: 0x1f5132, metalness: 0.3, roughness: 0.4 }));
    c.rotation.x = Math.PI / 2; c.position.set(-w / 2 + 2.8 + i * 3.6, 2.9, 0);
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 3, 20, 1, true), new THREE.MeshStandardMaterial({ map: label('1.5 V', { bg: '#1f5132', fg: '#fde047', w: 128, h: 64, font: 'bold 36px Arial' }), side: THREE.DoubleSide }));
    lb.rotation.x = Math.PI / 2; lb.position.copy(c.position);
    group.add(c, lb);
  }
  terminal(M, group, terms, '+', V3(-w / 2 + 1.2, 2, 3), `${name} (+)`);
  terminal(M, group, terms, '-', V3(w / 2 - 1.2, 2, 3), `${name} (−)`);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: label('+', { bg: '#151515', fg: '#f87171', w: 64, h: 64, font: 'bold 56px Arial' }) }));
  pl.rotation.x = -Math.PI / 2; pl.position.set(-w / 2 + 1.2, 2.02, 1.4);
  group.add(pl);
  return { group, terminals: terms, emf: emf * cells, size: [w, 5, 7.4], grip: V3(0, 5, 0) };
}

// Leclanché cell (glass jar, porous pot, carbon rod, zinc rod) or Daniell cell (copper pot)
export function wetCell(M, kind = 'leclanche', name = kind === 'leclanche' ? 'Leclanché cell' : 'Daniell cell') {
  const group = new THREE.Group();
  const terms = {};
  if (kind === 'leclanche') {
    const jar = mesh(new THREE.CylinderGeometry(3.3, 3.1, 11, 24, 1, true), PM.glass, false); jar.position.y = 5.5;
    const jarBase = mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.4, 24), PM.glassSolid, false); jarBase.position.y = 0.2;
    const sol = mesh(new THREE.CylinderGeometry(3.05, 2.95, 7, 24), new THREE.MeshPhysicalMaterial({ color: 0xe8f1f4, transparent: true, opacity: 0.35, depthWrite: false }), false); sol.position.y = 3.8;
    const pot = mesh(new THREE.CylinderGeometry(1.6, 1.6, 10, 20), new THREE.MeshStandardMaterial({ color: 0xb9794e, roughness: 0.95 })); pot.position.set(0.6, 5.5, 0);
    const carbon = mesh(new THREE.BoxGeometry(1.2, 4, 0.6), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 })); carbon.position.set(0.6, 11.5, 0);
    const zinc = mesh(new THREE.CylinderGeometry(0.4, 0.4, 13, 10), new THREE.MeshStandardMaterial({ color: 0x9aa3ab, metalness: 0.8, roughness: 0.4 })); zinc.position.set(-2.2, 6.6, 0);
    group.add(jar, jarBase, sol, pot, carbon, zinc);
    terminal(M, group, terms, '+', V3(0.6, 13.5, 0), `${name} (+) carbon`);
    terminal(M, group, terms, '-', V3(-2.2, 13.1, 0), `${name} (−) zinc`);
  } else {
    const pot = mesh(new THREE.CylinderGeometry(3.2, 3.2, 11, 24), PM.copper); pot.position.y = 5.5;
    const rim = mesh(new THREE.TorusGeometry(3.2, 0.25, 8, 24), PM.copper); rim.rotation.x = Math.PI / 2; rim.position.y = 11;
    const inner = mesh(new THREE.CylinderGeometry(1.6, 1.6, 1, 20), new THREE.MeshStandardMaterial({ color: 0xb9794e, roughness: 0.95 })); inner.position.y = 11.2;
    const sol = mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.1, 24), new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.2 })); sol.position.y = 10.6;
    const zinc = mesh(new THREE.CylinderGeometry(0.45, 0.45, 5, 10), new THREE.MeshStandardMaterial({ color: 0x9aa3ab, metalness: 0.8, roughness: 0.4 })); zinc.position.set(0, 13, 0);
    const tab = mesh(new THREE.BoxGeometry(1.2, 2.4, 0.3), PM.copper); tab.position.set(2.6, 12.2, 0);
    group.add(pot, rim, inner, sol, zinc, tab);
    terminal(M, group, terms, '+', V3(2.6, 13.4, 0), `${name} (+) copper`);
    terminal(M, group, terms, '-', V3(0, 15.5, 0), `${name} (−) zinc`);
  }
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.4), new THREE.MeshStandardMaterial({ map: label(name, { bg: '#f1ead8', fg: '#111', w: 320, h: 90, font: 'bold 34px Georgia' }) }));
  lb.position.set(0, 2.2, 3.4);
  group.add(lb);
  return { group, terminals: terms, size: [7, 14, 7], grip: V3(0, 8, 3.3) };
}

// Plug key (on/off). The plug is animated with animatePlug each frame.
export function plugKey(M) { return S.buildPlugKey(M); }
export function animatePlug(p, dt) {
  const u = p.userData;
  u.t = THREE.MathUtils.damp(u.t, u.inserted ? 1 : 0, 10, dt);
  const lift = Math.sin(Math.PI * (1 - Math.abs(u.t * 2 - 1))) * 2.2;
  p.position.lerpVectors(u.out, u.home, u.t);
  p.position.y += lift;
  p.rotation.x = -(1 - u.t) * (Math.PI / 2);
}

// Two-way key: common terminal C joined to 1 or 2 by one of two plugs
export function twoWayKey(M) {
  const group = new THREE.Group();
  const terms = {};
  const base = mesh(new THREE.BoxGeometry(10, 1, 8), PM.black); base.position.y = 0.5;
  const c = mesh(new THREE.BoxGeometry(3, 1.2, 6.6), PM.brass); c.position.set(0, 1.6, 0);
  const a = mesh(new THREE.BoxGeometry(3, 1.2, 2.6), PM.brass); a.position.set(-3.4, 1.6, -2);
  const b = a.clone(); b.position.x = 3.4;
  group.add(base, c, a, b);
  const plugs = [];
  [-1, 1].forEach((sx, i) => {
    const p = S.plug(M);
    const home = V3(sx * 1.7, 1.8, -2), out = V3(sx * 1.7 + sx * 3.3, 1.75, 3.6);
    p.position.copy(out); p.rotation.x = -Math.PI / 2;
    p.userData = { kind: 'key2', home, out, inserted: false, t: 0, index: i };
    p.traverse((o) => { o.userData.pick = p; });
    group.add(p); plugs.push(p);
  });
  terminal(M, group, terms, '1', V3(-3.4, 2.2, -2.8), 'Two-way key terminal 1');
  terminal(M, group, terms, '2', V3(3.4, 2.2, -2.8), 'Two-way key terminal 2');
  terminal(M, group, terms, 'C', V3(0, 2.2, 2.6), 'Two-way key common C');
  return { group, terminals: terms, plugs, size: [10, 3, 8], grip: V3(0, 2.4, -3.4) };
}

// ---------------------------------------------------------------------------
// Springs, weights, scales
// ---------------------------------------------------------------------------

// A helical spring hanging down from its top (local origin at top), length L
export function spring({ turns = 26, r = 1.1, wire = 0.12, color = 0xb8bec5 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.3 });
  const m = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  m.castShadow = true;
  let built = -1;
  const api = {
    mesh: m, length: 10,
    setLength(L) {
      if (Math.abs(L - built) < 0.01) return;
      api.length = L;
      const pts = [];
      const N = turns * 16;
      pts.push(V3(0, 0, 0), V3(0, -0.6, 0));
      for (let i = 0; i <= N; i++) { const t = i / N, a = t * turns * Math.PI * 2; pts.push(V3(Math.cos(a) * r, -0.8 - t * (L - 1.6), Math.sin(a) * r)); }
      pts.push(V3(0, -L + 0.6, 0), V3(0, -L, 0));
      m.geometry.dispose();
      m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N + 8, wire, 6, false);
      built = L;
    },
  };
  api.setLength(10);
  return api;
}

// Slotted weight (disc with a slot) of mass in grams
export function slottedWeight(mass = 50) {
  const r = 1.6 + Math.sqrt(mass / 50) * 0.9;
  const h = 0.45 + (mass / 50) * 0.18;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r, 0.18, Math.PI * 2 - 0.18, false);
  shape.lineTo(0.35, -0.3); shape.lineTo(0.35, 0.3);
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.32, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 1, curveSegments: 32 });
  geo.rotateX(-Math.PI / 2);
  const m = mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8b8f93, metalness: 0.85, roughness: 0.35 }));
  const g = new THREE.Group();
  g.add(m);
  g.userData.h = h + 0.1;
  const tx = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ map: label(`${mass} g`, { bg: '#8b8f93', fg: '#111', w: 128, h: 56, font: 'bold 38px Arial' }), transparent: true }));
  tx.rotation.x = -Math.PI / 2; tx.position.set(-r * 0.55, h + 0.12, 0);
  g.add(tx);
  return g;
}

// Weight hanger (a rod with a disc base and hook), mass in grams
export function hanger(mass = 50) {
  const g = new THREE.Group();
  const disc = mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 24), PM.darkSteel); disc.position.y = 0.2;
  const rod = mesh(new THREE.CylinderGeometry(0.28, 0.28, 9, 10), PM.darkSteel); rod.position.y = 4.7;
  const hook = mesh(new THREE.TorusGeometry(0.6, 0.12, 6, 16, Math.PI * 1.4), PM.darkSteel); hook.position.y = 9.6; hook.rotation.z = -0.4;
  g.add(disc, rod, hook);
  g.userData.mass = mass;
  return g;
}

// A vertical or horizontal metre scale strip, cm and mm marks
export function scaleTexture(cm = 30, { vertical = true, from = 0, bg = '#f4ead0' } = {}) {
  const pxPerCm = 60;
  const long = Math.min(8192, cm * pxPerCm);
  const w = vertical ? 128 : long, h = vertical ? long : 128;
  return tex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#111'; g.strokeStyle = '#111';
    const n = cm * 10;
    for (let i = 0; i <= n; i++) {
      const p = (i / n) * (long - 2) + 1;
      const L = i % 10 === 0 ? 46 : i % 5 === 0 ? 32 : 20;
      g.lineWidth = i % 10 === 0 ? 3 : 1.6;
      g.beginPath();
      if (vertical) { g.moveTo(0, p); g.lineTo(L, p); } else { g.moveTo(p, 0); g.lineTo(p, L); }
      g.stroke();
      if (i % 10 === 0) {
        g.font = 'bold 30px Arial';
        const t = String(from + i / 10);
        if (vertical) g.fillText(t, 52, p + 11); else { g.textAlign = 'center'; g.fillText(t, p, 84); }
      }
    }
  });
}

// A stopwatch readout on the panel side: running clock in simulation time
export function makeTimer() {
  return { t: 0, running: false, step(dt) { if (this.running) this.t += dt; } };
}
