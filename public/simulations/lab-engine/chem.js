// Chemistry apparatus for the 3D lab: glassware that holds real volumes of
// liquid (levels follow the vessel's shape), burette, pipette, droppers,
// burners with flames, bubbles, precipitates, fumes, and the hand motions
// used with them (pouring, pipetting, adding drops, titrating, heating).
// Units: 1 unit = 1 cm, so 1 mL = 1 unit³.
import * as THREE from 'three';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const V2 = (x, y) => new THREE.Vector2(x, y);
const live = new Set(); // things animated every frame (bubbles, flames, drops…)

export function update(dt, t) { for (const o of live) o.update(dt, t); }

// ---------------------------------------------------------------------------
// Materials and textures
// ---------------------------------------------------------------------------

export const MAT = {
  glass: new THREE.MeshPhysicalMaterial({ color: 0xd7e6ee, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.13, clearcoat: 0.6, clearcoatRoughness: 0.1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 0.7 }),
  glassRim: new THREE.MeshPhysicalMaterial({ color: 0xcfe2ec, roughness: 0.08, transparent: true, opacity: 0.5, clearcoat: 0.6, depthWrite: false, envMapIntensity: 0.8 }),
  amber: new THREE.MeshPhysicalMaterial({ color: 0x8a4a12, roughness: 0.08, transparent: true, opacity: 0.72, clearcoat: 1, depthWrite: false }),
  porcelain: new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.28 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x9b2d20, roughness: 0.6 }),
  blackRubber: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xb9c0c7, metalness: 1, roughness: 0.3 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: 0x4b5058, metalness: 0.9, roughness: 0.4 }),
  castIron: new THREE.MeshStandardMaterial({ color: 0x2d3136, metalness: 0.6, roughness: 0.55 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 1, roughness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x9b6b3d, roughness: 0.6 }),
  cork: new THREE.MeshStandardMaterial({ color: 0xb98a55, roughness: 0.9 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf8f8f6, roughness: 0.5 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0xeef2f5, roughness: 0.35, transparent: true, opacity: 0.85 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.9, side: THREE.DoubleSide }),
  gauze: new THREE.MeshStandardMaterial({ color: 0x666b70, metalness: 0.7, roughness: 0.5 }),
};

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function labelTex(title, sub = '', color = '#1d4ed8', w = 256, h = 128) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, w, h);
    g.fillStyle = color; g.fillRect(0, 0, w, h * 0.22); g.fillRect(0, h * 0.9, w, h * 0.1);
    g.fillStyle = '#111'; g.textAlign = 'center';
    let fs = Math.round(h * 0.28);
    g.font = `bold ${fs}px Arial`;
    while (g.measureText(title).width > w * 0.92 && fs > 10) { fs -= 2; g.font = `bold ${fs}px Arial`; }
    g.fillText(title, w / 2, h * 0.55);
    g.font = `${Math.round(h * 0.15)}px Arial`;
    g.fillText(sub, w / 2, h * 0.8);
  });
}
const mesh = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };
export const color = (c) => new THREE.Color(c);

// ---------------------------------------------------------------------------
// Vessels with liquid
// ---------------------------------------------------------------------------

// profile: outer radius r at height y, from the bottom up [[r, y], …]
// Returns a group with .setLiquid(vol, color, opacity), .vol, .level, .lip
export function vessel({ profile, wall = 0.16, glassMat = MAT.glass, capacity = 100, name = 'vessel', segments = 36, bottom = 0.25, grad = null }) {
  const group = new THREE.Group();
  const pts = profile.map(([r, y]) => V2(r, y));
  const glass = mesh(new THREE.LatheGeometry(pts, segments), glassMat, false);
  glass.renderOrder = 3;
  group.add(glass);
  // a closed glass bottom disc
  const baseDisc = mesh(new THREE.CircleGeometry(Math.max(0.1, profile[0][0] - 0.02), segments), glassMat, false);
  baseDisc.rotation.x = -Math.PI / 2; baseDisc.position.y = profile[0][1] + 0.02; baseDisc.renderOrder = 3;
  if (profile[0][0] > 0.3) group.add(baseDisc);
  const top = profile[profile.length - 1];
  const rim = mesh(new THREE.TorusGeometry(top[0], Math.max(0.06, wall * 0.6), 6, segments), MAT.glassRim, false);
  rim.rotation.x = Math.PI / 2; rim.position.y = top[1]; rim.renderOrder = 4;
  group.add(rim);
  // Inner radius as a function of height
  const y0 = profile[0][1] + bottom, yTop = top[1];
  const innerR = (y) => {
    for (let i = 1; i < profile.length; i++) {
      const [r0, a] = profile[i - 1], [r1, b] = profile[i];
      if (y <= b || i === profile.length - 1) {
        const t = b === a ? 0 : THREE.MathUtils.clamp((y - a) / (b - a), 0, 1);
        return Math.max(0.02, r0 + (r1 - r0) * t - wall);
      }
    }
    return 0.02;
  };
  // Volume table
  const dy = 0.02;
  const tableY = [y0], tableV = [0];
  for (let y = y0 + dy; y <= yTop; y += dy) {
    const r = innerR(y - dy / 2);
    tableY.push(y); tableV.push(tableV[tableV.length - 1] + Math.PI * r * r * dy);
  }
  const maxVol = tableV[tableV.length - 1];
  const levelOf = (v) => {
    if (v <= 0) return y0;
    let lo = 0, hi = tableV.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tableV[m] < v) lo = m; else hi = m; }
    return tableY[hi];
  };
  const liqMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.12, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  const liquid = mesh(new THREE.BufferGeometry(), liqMat, false);
  liquid.renderOrder = 1;
  group.add(liquid);
  const sedMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const sediment = mesh(new THREE.BufferGeometry(), sedMat, false);
  sediment.renderOrder = 2;
  group.add(sediment);
  if (grad) group.add(grad(innerR, y0, yTop));
  let built = { level: -1, sed: -1 };
  const api = {
    group, glass, name, capacity, maxVol, innerR, y0, yTop,
    vol: 0, color: color(0xffffff), opacity: 0.5, ppt: 0, pptColor: color(0xffffff), turbid: 0,
    lip: V3(top[0], top[1], 0),
    get level() { return levelOf(api.vol); },
    levelOf,
    setLiquid(vol, col, opacity) {
      api.vol = THREE.MathUtils.clamp(vol, 0, maxVol);
      if (col != null) api.color.set(col);
      if (opacity != null) api.opacity = opacity;
      api.refresh();
    },
    add(vol, col, opacity) {
      // mixing: colour weighted by volume
      const v0 = api.vol;
      if (col != null && v0 + vol > 0) api.color.lerp(color(col), vol / (v0 + vol));
      if (opacity != null && v0 + vol > 0) api.opacity += (opacity - api.opacity) * (vol / (v0 + vol));
      api.setLiquid(v0 + vol);
    },
    setPpt(amount, col, turbid) { api.ppt = amount; if (col != null) api.pptColor.set(col); if (turbid != null) api.turbid = turbid; api.refresh(true); },
    refresh(force = false) {
      const level = levelOf(api.vol);
      liquid.visible = api.vol > 0.01;
      const turb = api.turbid;
      liqMat.color.copy(api.color).lerp(api.pptColor, turb * 0.7);
      liqMat.opacity = Math.min(0.97, api.opacity + turb * 0.4);
      if (liquid.visible && (force || Math.abs(level - built.level) > 0.004)) {
        const lp = [V2(0, y0)];
        const n = 24;
        for (let i = 0; i <= n; i++) { const y = y0 + ((level - y0) * i) / n; lp.push(V2(innerR(y) - 0.01, y)); }
        lp.push(V2(0, level));
        liquid.geometry.dispose();
        liquid.geometry = new THREE.LatheGeometry(lp, segments);
        built.level = level;
      }
      const sedH = api.ppt * Math.min(1.2, (level - y0) * 0.35);
      sediment.visible = api.ppt > 0.01 && api.vol > 0.01;
      sedMat.color.copy(api.pptColor);
      if (sediment.visible && Math.abs(sedH - built.sed) > 0.005) {
        const sp = [V2(0, y0), V2(innerR(y0) - 0.03, y0), V2(innerR(y0 + sedH) * 0.95, y0 + sedH * 0.6), V2(0, y0 + sedH)];
        sediment.geometry.dispose();
        sediment.geometry = new THREE.LatheGeometry(sp, segments);
        built.sed = sedH;
      }
    },
    // A point on the liquid surface (local) — for drops, strips, pipette tips
    surfaceLocal() { return V3(0, levelOf(api.vol), 0); },
  };
  group.userData.vessel = api;
  return api;
}

// Graduation marks drawn on a cylinder (measuring cylinder, burette-like)
function gradShell(innerR, y0, yTop, { from, to, every, major, label, volAt }) {
  // volAt(v) → height of mark for volume v
  const h = yTop - y0;
  const tex = canvasTex(128, 1024, (g, w, H) => {
    g.clearRect(0, 0, w, H);
    g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff';
    for (let v = from; v <= to + 1e-9; v += every) {
      const y = volAt(v);
      const py = H - ((y - y0) / h) * H;
      const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
      g.lineWidth = isMaj ? 3 : 2;
      g.beginPath(); g.moveTo(0, py); g.lineTo(isMaj ? 60 : 34, py); g.stroke();
      if (isMaj && label) { g.font = 'bold 26px Arial'; g.fillText(String(Math.round(v)), 66, py + 9); }
    }
  });
  const r = innerR((y0 + yTop) / 2) + 0.2;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true, -0.55, 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: 0x1d3557, side: THREE.DoubleSide }));
  m.position.y = y0 + h / 2;
  m.rotation.y = Math.PI; // marks face the student (+z)
  m.renderOrder = 5;
  return m;
}

export function beaker(capacity = 250) {
  const r = capacity >= 250 ? 3.5 : capacity >= 100 ? 2.6 : 2.0;
  const h = capacity >= 250 ? 9.5 : capacity >= 100 ? 7.0 : 5.5;
  const v = vessel({ capacity, name: `${capacity} mL beaker`, profile: [[r - 0.15, 0], [r, 0.2], [r, h - 0.3], [r + 0.25, h]] });
  // spout
  const spout = mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 12, Math.PI), MAT.glassRim, false);
  spout.position.set(r + 0.15, h, 0); spout.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  v.group.add(spout);
  v.lip.set(r + 0.5, h, 0);
  // printed graduations (white enamel)
  const marks = canvasTex(64, 256, (g, w, H) => {
    g.fillStyle = '#ffffff'; g.font = 'bold 18px Arial';
    for (let i = 1; i <= 4; i++) { const y = H - (i / 5) * H; g.fillRect(4, y, 22, 3); g.fillText(String((capacity / 5) * i), 28, y + 7); }
  });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.02, r + 0.02, h * 0.8, 20, 1, true, -0.3, 0.6), new THREE.MeshBasicMaterial({ map: marks, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  plate.position.y = h * 0.45; plate.rotation.y = Math.PI; plate.renderOrder = 5;
  v.group.add(plate);
  return Object.assign(v, { app: { group: v.group, size: [r * 2, h, r * 2], grip: V3(0, h * 0.5, r + 0.4) }, height: h, radius: r });
}

export function conicalFlask(capacity = 250) {
  const s = capacity >= 250 ? 1 : 0.8;
  const prof = [[4.1, 0], [4.3, 0.3], [4.2, 1.2], [1.7, 10.2], [1.5, 11], [1.5, 14], [1.75, 14.2]].map(([r, y]) => [r * s, y * s]);
  const v = vessel({ capacity, name: `${capacity} mL conical flask`, profile: prof });
  return Object.assign(v, { app: { group: v.group, size: [8.6 * s, 14.2 * s, 8.6 * s], grip: V3(0, 12 * s, 1.7 * s) }, height: 14.2 * s, radius: 4.3 * s, lip: V3(1.6 * s, 14.2 * s, 0) });
}

export function testTube(len = 15, r = 0.8) {
  const prof = [[0.05, 0]];
  for (let i = 1; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); prof.push([Math.sin(a) * r, r - Math.cos(a) * r]); }
  prof.push([r, len], [r + 0.12, len + 0.1]);
  const v = vessel({ capacity: 20, name: 'test tube', profile: prof, wall: 0.08, bottom: 0.05, segments: 24 });
  return Object.assign(v, { app: { group: v.group, size: [2, len, 2], grip: V3(0, len * 0.8, r + 0.2) }, height: len, radius: r, lip: V3(r, len, 0) });
}

export function measuringCylinder(capacity = 100) {
  const r = capacity >= 100 ? 1.75 : 1.2, h = capacity >= 100 ? 26 : 18;
  const prof = [[r, 0.8], [r, h - 0.3], [r + 0.3, h]];
  const v = vessel({
    capacity, name: `${capacity} mL measuring cylinder`, profile: prof, bottom: 0.3,
    grad: (innerR, y0, yTop) => gradShell(innerR, y0, yTop, { from: 0, to: capacity, every: capacity / 50, major: capacity / 10, label: true, volAt: (vv) => y0 + vv / (Math.PI * innerR(y0 + 1) ** 2) }),
  });
  const foot = mesh(new THREE.CylinderGeometry(r + 1.6, r + 1.9, 0.8, 6), MAT.plastic);
  foot.position.y = 0.4;
  v.group.add(foot);
  return Object.assign(v, { app: { group: v.group, size: [2 * r + 3.8, h, 2 * r + 3.8], grip: V3(0, h * 0.6, r + 0.3) }, height: h, radius: r, lip: V3(r + 0.3, h, 0) });
}

// Reagent bottle with a printed label and a stopper; holds liquid (or solid)
export function reagentBottle(title, sub = '', { labelColor = '#1d4ed8', amber = false, liquid = null, liquidColor = 0xffffff, opacity = 0.35, capacity = 250 } = {}) {
  const r = capacity >= 250 ? 3.2 : 2.3, h = capacity >= 250 ? 11 : 8;
  const prof = [[r - 0.2, 0], [r, 0.3], [r, h * 0.72], [r * 0.45, h * 0.9], [r * 0.38, h * 0.93], [r * 0.38, h]];
  const v = vessel({ capacity, name: title, profile: prof, glassMat: amber ? MAT.amber : MAT.glass, wall: 0.2 });
  const lbl = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.03, r + 0.03, h * 0.38, 24, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: labelTex(title, sub, labelColor), roughness: 0.7, side: THREE.DoubleSide }));
  lbl.position.y = h * 0.38; lbl.rotation.y = Math.PI;
  v.group.add(lbl);
  const stopper = new THREE.Group();
  const plug = mesh(new THREE.CylinderGeometry(r * 0.38, r * 0.3, 1.2, 16), MAT.glassRim);
  const knob = mesh(new THREE.SphereGeometry(r * 0.45, 16, 10), MAT.glassRim);
  knob.scale.y = 0.6; knob.position.y = 1.0;
  stopper.add(plug, knob);
  stopper.position.y = h + 0.1;
  v.group.add(stopper);
  if (liquid != null) v.setLiquid(liquid, liquidColor, opacity);
  return Object.assign(v, { stopper, app: { group: v.group, size: [2 * r, h + 1.5, 2 * r], grip: V3(0, h * 0.45, r + 0.3) }, height: h, radius: r, lip: V3(r * 0.4, h, 0) });
}

// Small bottle with a rubber-teat dropper (indicators, reagents added drop-wise)
export function dropperBottle(title, { labelColor = '#be185d', liquidColor = 0xffffff, opacity = 0.4, dropColor = null } = {}) {
  const r = 1.6, h = 6.2;
  const prof = [[r - 0.1, 0], [r, 0.2], [r, h * 0.7], [0.7, h * 0.88], [0.6, h]];
  const v = vessel({ capacity: 30, name: title, profile: prof, glassMat: MAT.amber, wall: 0.14 });
  v.setLiquid(20, liquidColor, opacity);
  const lbl = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.03, r + 0.03, h * 0.4, 20, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: labelTex(title, '', labelColor, 256, 110), roughness: 0.7, side: THREE.DoubleSide }));
  lbl.position.y = h * 0.36; lbl.rotation.y = Math.PI;
  v.group.add(lbl);
  const dropper = new THREE.Group();
  const tube = mesh(new THREE.CylinderGeometry(0.22, 0.12, 6, 10), MAT.glassRim, false);
  tube.position.y = -2.2; tube.renderOrder = 4;
  const collar = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.7, 16), MAT.blackRubber);
  collar.position.y = 0.6;
  const teat = mesh(new THREE.SphereGeometry(0.62, 14, 10), MAT.rubber);
  teat.scale.y = 1.9; teat.position.y = 1.9;
  dropper.add(tube, collar, teat);
  dropper.position.y = h + 0.2;
  v.group.add(dropper);
  return Object.assign(v, { dropper, teat, dropColor: color(dropColor ?? liquidColor), app: { group: v.group, size: [2 * r, h + 3, 2 * r], grip: V3(0, h * 0.4, r + 0.2) }, height: h, radius: r, pose: 'grab' });
}

// Wash bottle with distilled water
export function washBottle() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(2.9, 3.1, 12, 24), new THREE.MeshPhysicalMaterial({ color: 0xf2f6f8, roughness: 0.35, transparent: true, opacity: 0.8, depthWrite: false }));
  body.position.y = 6;
  const cap = mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }));
  cap.position.y = 12.8;
  const nozzle = mesh(new THREE.CylinderGeometry(0.2, 0.25, 7, 8), new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.4 }));
  nozzle.position.set(0, 15, 1.6); nozzle.rotation.x = 0.9;
  const water = mesh(new THREE.CylinderGeometry(2.7, 2.9, 8, 20), new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35, depthWrite: false }));
  water.position.y = 4.1;
  const lbl = new THREE.Mesh(new THREE.CylinderGeometry(3.12, 3.12, 3.2, 24, 1, true, -0.8, 1.6), new THREE.MeshStandardMaterial({ map: labelTex('Distilled water', 'H₂O', '#0284c7'), side: THREE.DoubleSide }));
  lbl.position.y = 7; lbl.rotation.y = Math.PI;
  g.add(body, cap, nozzle, water, lbl);
  return { group: g, app: { group: g, size: [6.2, 16, 6.2], grip: V3(0, 7, 3.2) } };
}

// ---------------------------------------------------------------------------
// Burette on a stand, pipette, funnel, glass rod
// ---------------------------------------------------------------------------

// Retort stand: heavy base, rod, and a burette clamp (or ring) at clampY
export function retortStand({ clampY = 58, ringY = null, reach = 11 } = {}) {
  const g = new THREE.Group();
  const base = mesh(new THREE.BoxGeometry(16, 1.4, 24), MAT.castIron);
  base.position.set(0, 0.7, 0);
  const rod = mesh(new THREE.CylinderGeometry(0.6, 0.6, 72, 14), MAT.steel);
  rod.position.set(0, 36, -8);
  g.add(base, rod);
  const boss = mesh(new THREE.BoxGeometry(2.4, 2.6, 2.4), MAT.darkSteel);
  boss.position.set(0, clampY, -8);
  const arm = mesh(new THREE.CylinderGeometry(0.35, 0.35, reach, 10), MAT.steel);
  arm.rotation.x = Math.PI / 2; arm.position.set(0, clampY, -8 + reach / 2);
  const jaws = mesh(new THREE.TorusGeometry(1.05, 0.3, 8, 18), MAT.darkSteel);
  jaws.rotation.x = Math.PI / 2; jaws.position.set(0, clampY, -8 + reach + 0.4);
  g.add(boss, arm, jaws);
  if (ringY != null) {
    const b2 = boss.clone(); b2.position.y = ringY;
    const a2 = arm.clone(); a2.position.y = ringY;
    const ring = mesh(new THREE.TorusGeometry(4, 0.3, 8, 28), MAT.darkSteel);
    ring.rotation.x = Math.PI / 2; ring.position.set(0, ringY, -8 + reach + 3.6);
    g.add(b2, a2, ring);
  }
  // clamp centre (local) where the burette axis goes
  return { group: g, clampAt: V3(0, clampY, -8 + reach + 0.4), app: { group: g, size: [16, 72, 24], grip: V3(0, 40, -7.4) } };
}

// 50 mL burette. Local origin at the tip; reading 0 at the top mark.
export function burette() {
  const g = new THREE.Group();
  const rIn = 0.56, area = Math.PI * rIn * rIn; // ≈ 0.985 cm² per cm
  const tipLen = 5, cockY = 5.5, y50 = 9, y0 = y50 + 50 / area; // 0-mark height
  const top = y0 + 5;
  const tube = mesh(new THREE.CylinderGeometry(rIn + 0.14, rIn + 0.14, top - cockY - 1, 20, 1, true), MAT.glass, false);
  tube.position.y = (top + cockY + 1) / 2; tube.renderOrder = 3;
  const lip = mesh(new THREE.TorusGeometry(rIn + 0.2, 0.1, 6, 20), MAT.glassRim, false);
  lip.rotation.x = Math.PI / 2; lip.position.y = top;
  const tip = mesh(new THREE.CylinderGeometry(0.3, 0.08, tipLen, 10), MAT.glassRim, false);
  tip.position.y = tipLen / 2 - 0.3; tip.renderOrder = 3;
  const cockBody = mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.4, 12), MAT.glassRim, false);
  cockBody.rotation.z = Math.PI / 2; cockBody.position.y = cockY;
  const cock = new THREE.Group();
  const key = mesh(new THREE.BoxGeometry(0.4, 2.6, 0.5), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 }));
  key.position.set(-1.7, 0, 0); // on the left: worked by the left hand
  const keyStem = mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 10), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 }));
  keyStem.rotation.z = Math.PI / 2; keyStem.position.x = -1.0;
  cock.add(key, keyStem);
  cock.position.y = cockY;
  g.add(tube, lip, tip, cockBody, cock);
  // Graduations 0 (top) … 50 (bottom), every 0.1 mL
  const H = y0 - y50;
  const tex = canvasTex(128, 4096, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#ffffff'; c.strokeStyle = '#ffffff';
    for (let i = 0; i <= 500; i++) {
      const py = 20 + ((h - 40) * i) / 500;
      const major = i % 10 === 0, half = i % 5 === 0;
      c.lineWidth = major ? 3 : 2;
      c.beginPath(); c.moveTo(0, py); c.lineTo(major ? 64 : half ? 44 : 26, py); c.stroke();
      if (major) { c.font = 'bold 30px Arial'; c.fillText(String(i / 10), 70, py + 10); }
    }
  });
  const grad = new THREE.Mesh(new THREE.CylinderGeometry(rIn + 0.16, rIn + 0.16, H * (4096 / (4096 - 40)), 20, 1, true, -0.6, 1.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: 0x172554, side: THREE.DoubleSide }));
  grad.position.y = (y0 + y50) / 2; grad.rotation.y = Math.PI; grad.renderOrder = 5;
  g.add(grad);
  const liqMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0.1, depthWrite: false });
  const liq = mesh(new THREE.CylinderGeometry(rIn - 0.02, rIn - 0.02, 1, 16), liqMat, false);
  liq.renderOrder = 1;
  const tipLiq = mesh(new THREE.CylinderGeometry(0.2, 0.06, cockY - 0.5, 8), liqMat, false);
  tipLiq.position.y = (cockY - 0.5) / 2; tipLiq.renderOrder = 1;
  const meniscus = mesh(new THREE.SphereGeometry(rIn - 0.02, 16, 6, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), liqMat, false);
  meniscus.renderOrder = 1;
  g.add(liq, tipLiq, meniscus);
  const api = {
    group: g, cock, area, y0, y50, cockY, top,
    reading: 50, // what the scale shows at the bottom of the meniscus
    color: color(0xffffff), filled: false, open: 0,
    // volume inside the graduated part, from the reading
    setReading(r, col, opacity) {
      api.reading = r;
      if (col != null) liqMat.color.set(col);
      if (opacity != null) liqMat.opacity = opacity;
      api.filled = r < 50.5;
      const level = y0 - (r / 50) * (y0 - y50);
      const bottom = cockY + 0.6;
      liq.visible = api.filled && r > -6;
      const lvl = Math.min(level, top - 0.3);
      liq.scale.y = Math.max(0.01, lvl - bottom);
      liq.position.y = (lvl + bottom) / 2;
      meniscus.visible = liq.visible;
      meniscus.position.y = lvl + (rIn - 0.02) * 0.62;
      tipLiq.visible = api.filled && api.tipFilled !== false;
    },
    setCock(open) { api.open = open; cock.rotation.x = open * (Math.PI / 2); },
    tipWorld() { g.updateMatrixWorld(true); return g.localToWorld(V3(0, -0.4, 0)); },
    cockWorld() { g.updateMatrixWorld(true); return g.localToWorld(V3(-1.8, cockY, 0)); },
    readWorld() { g.updateMatrixWorld(true); return g.localToWorld(V3(0, y0 - (api.reading / 50) * (y0 - y50), 0)); },
    funnelWorld() { g.updateMatrixWorld(true); return g.localToWorld(V3(0, top + 2, 0)); },
    liqMat,
  };
  api.setReading(51);
  api.setCock(0);
  return Object.assign(api, { app: { group: g, size: [2, top, 2], grip: V3(0, y0 - 12, 0.8) }, pose: 'grab' });
}

// 20 mL volumetric pipette with a rubber filler bulb. Local origin at the tip.
export function pipette(capacity = 20) {
  const g = new THREE.Group();
  const stemLo = mesh(new THREE.CylinderGeometry(0.28, 0.1, 12, 10), MAT.glassRim, false);
  stemLo.position.y = 6;
  const bulb = mesh(new THREE.SphereGeometry(1.25, 18, 12), MAT.glass, false);
  bulb.scale.y = 2.6; bulb.position.y = 15.2;
  const stemHi = mesh(new THREE.CylinderGeometry(0.28, 0.28, 14, 10), MAT.glassRim, false);
  stemHi.position.y = 25.5;
  const mark = mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 12), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  mark.position.y = 26;
  const filler = mesh(new THREE.SphereGeometry(1.4, 16, 12), MAT.rubber);
  filler.scale.y = 1.3; filler.position.y = 34;
  [stemLo, bulb, stemHi].forEach((m) => { m.renderOrder = 3; });
  const liqMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false });
  const lLo = mesh(new THREE.CylinderGeometry(0.18, 0.06, 12, 8), liqMat, false); lLo.position.y = 6;
  const lBulb = mesh(new THREE.SphereGeometry(1.12, 14, 10), liqMat, false); lBulb.scale.y = 2.5; lBulb.position.y = 15.2;
  const lHi = mesh(new THREE.CylinderGeometry(0.18, 0.18, 1, 8), liqMat, false);
  [lLo, lBulb, lHi].forEach((m) => { m.renderOrder = 1; m.visible = false; });
  g.add(stemLo, bulb, stemHi, mark, filler, lLo, lBulb, lHi);
  const api = {
    group: g, capacity, fill: 0, liqMat,
    // fill: 0 … 1 (1 = up to the mark)
    setFill(f, col) {
      api.fill = f;
      if (col != null) liqMat.color.set(col);
      lLo.visible = f > 0.01;
      lBulb.visible = f > 0.12;
      lBulb.scale.y = 2.5 * THREE.MathUtils.clamp((f - 0.12) / 0.7, 0.05, 1);
      lHi.visible = f > 0.85;
      const top = 18.6 + (26 - 18.6) * THREE.MathUtils.clamp((f - 0.85) / 0.15, 0, 1);
      lHi.scale.y = Math.max(0.01, top - 18.6); lHi.position.y = (top + 18.6) / 2;
    },
  };
  return Object.assign(api, { app: { group: g, size: [3, 36, 3], grip: V3(0, 30, 0.4) }, pose: 'pinch' });
}

export function funnel(r = 3.5) {
  const v = vessel({ capacity: 60, name: 'funnel', profile: [[0.35, -6], [0.35, 0], [r, r * 1.1]], wall: 0.1, bottom: 0 });
  return Object.assign(v, { app: { group: v.group, size: [2 * r, r * 1.1 + 6, 2 * r], grip: V3(0, 1.5, 1.2) } });
}

export function glassRod(len = 20) {
  const g = new THREE.Group();
  const rod = mesh(new THREE.CylinderGeometry(0.25, 0.25, len, 10), MAT.glassRim, false);
  rod.rotation.z = Math.PI / 2; rod.position.y = 0.3;
  g.add(rod);
  return { group: g, app: { group: g, size: [len, 0.6, 0.6], grip: V3(len * 0.3, 0.4, 0) }, pose: 'pinch' };
}

// ---------------------------------------------------------------------------
// Heating: bunsen burner, spirit lamp, tripod, china dish
// ---------------------------------------------------------------------------

function flameMesh() {
  const g = new THREE.Group();
  const outerMat = new THREE.MeshBasicMaterial({ color: 0x5aa0ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x2f5bff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.9, 7, 16, 1, true), outerMat);
  outer.position.y = 3.5;
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.8, 16, 1, true), innerMat);
  inner.position.y = 1.4;
  const tint = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  tint.position.y = 4;
  [outer, inner, tint].forEach((m) => { m.renderOrder = 6; m.userData.noPick = true; });
  g.add(outer, inner, tint);
  const light = new THREE.PointLight(0x6b8cff, 0, 60, 2);
  light.position.y = 4;
  g.add(light);
  const api = {
    group: g, on: false, tintColor: color(0xffcc33), tintAmt: 0, size: 1, yellow: 0,
    update(dt, t) {
      g.visible = api.on;
      if (!api.on) return;
      const f = 1 + Math.sin(t * 31) * 0.05 + Math.sin(t * 17.3) * 0.04;
      g.scale.set(api.size, api.size * f, api.size);
      tint.material.color.copy(api.tintColor);
      tint.material.opacity = api.tintAmt * (0.75 + Math.sin(t * 23) * 0.1);
      outerMat.color.setHex(0x5aa0ff).lerp(color(0xffb340), api.yellow);
      outerMat.opacity = 0.35 + api.yellow * 0.3;
      light.intensity = 40 + api.tintAmt * 80;
      light.color.copy(api.tintAmt > 0.1 ? api.tintColor : outerMat.color);
    },
  };
  live.add(api);
  return api;
}

export function bunsenBurner() {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(3.4, 3.8, 1.2, 24), MAT.castIron);
  base.position.y = 0.6;
  const barrel = mesh(new THREE.CylinderGeometry(0.75, 0.8, 12, 16), MAT.brass);
  barrel.position.y = 7;
  const collar = mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.6, 16), MAT.brass);
  collar.position.y = 2.6;
  const inlet = mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.5, 10), MAT.brass);
  inlet.rotation.z = Math.PI / 2; inlet.position.set(2.2, 1.8, 0);
  const hose = mesh(new THREE.TorusGeometry(6, 0.45, 8, 24, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }));
  hose.position.set(3.8, 7.8, 0); hose.rotation.set(0, 0, -Math.PI / 2);
  const knob = mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.7, 12), MAT.darkSteel);
  knob.rotation.x = Math.PI / 2; knob.position.set(0, 1.3, 3.3);
  g.add(base, barrel, collar, inlet, hose, knob);
  const flame = flameMesh();
  flame.group.position.y = 13;
  g.add(flame.group);
  return { group: g, flame, knob, collar, topWorld: () => g.localToWorld(V3(0, 13, 0)), app: { group: g, size: [7.6, 13, 7.6], grip: V3(0, 7, 0.9) } };
}

export function spiritLamp() {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(3, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), MAT.glass, false);
  body.scale.y = 0.9; body.rotation.x = Math.PI; body.position.y = 2.7; body.renderOrder = 3;
  const spirit = mesh(new THREE.CylinderGeometry(2.5, 2.1, 1.8, 18), new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.4, depthWrite: false }));
  spirit.position.y = 1.2;
  const neck = mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.5, 14), MAT.brass);
  neck.position.y = 3.6;
  const wick = mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 8), MAT.white);
  wick.position.y = 4.6;
  g.add(body, spirit, neck, wick);
  const flame = flameMesh();
  flame.group.position.y = 5; flame.size = 0.7; flame.yellow = 0.7;
  g.add(flame.group);
  return { group: g, flame, topWorld: () => g.localToWorld(V3(0, 5, 0)), app: { group: g, size: [6, 5, 6], grip: V3(0, 3.6, 1) } };
}

export function tripod(h = 18) {
  const g = new THREE.Group();
  const ring = mesh(new THREE.TorusGeometry(6, 0.35, 8, 28), MAT.castIron);
  ring.rotation.x = Math.PI / 2; ring.position.y = h;
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = mesh(new THREE.CylinderGeometry(0.3, 0.3, h + 1, 8), MAT.castIron);
    leg.position.set(Math.cos(a) * 6.6, h / 2, Math.sin(a) * 6.6);
    leg.rotation.set(Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1);
    g.add(leg);
  }
  const gauze = mesh(new THREE.BoxGeometry(13, 0.2, 13), MAT.gauze);
  gauze.position.y = h + 0.45;
  const centre = mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.24, 20), new THREE.MeshStandardMaterial({ color: 0xe5e0d6, roughness: 0.95 }));
  centre.position.y = h + 0.47;
  g.add(gauze, centre);
  return { group: g, top: h + 0.6, app: { group: g, size: [14, h + 1, 14], grip: V3(5.5, h, 2) } };
}

export function chinaDish(r = 4.2) {
  const prof = [[0.1, 0], [r * 0.5, 0.15], [r * 0.85, 0.8], [r, 1.9], [r + 0.15, 2.1]];
  const v = vessel({ capacity: 60, name: 'china dish', profile: prof, glassMat: MAT.porcelain, wall: 0.2, bottom: 0.1 });
  v.glass.material = MAT.porcelain; v.glass.renderOrder = 0;
  return Object.assign(v, { app: { group: v.group, size: [2 * r, 2.1, 2 * r], grip: V3(r, 1.8, 0) } });
}
export function watchGlass(r = 3.6) {
  const g = new THREE.Group();
  const m = mesh(new THREE.SphereGeometry(r * 1.6, 24, 8, 0, Math.PI * 2, Math.PI - 0.72, 0.72), MAT.glass, false);
  m.position.y = r * 1.6; m.renderOrder = 3;
  g.add(m);
  return { group: g, app: { group: g, size: [2 * r, 1, 2 * r], grip: V3(r, 0.8, 0) } };
}

// ---------------------------------------------------------------------------
// Racks, holders, papers, small tools, instruments
// ---------------------------------------------------------------------------

export function testTubeRack(n = 6) {
  const g = new THREE.Group();
  const w = n * 3.6 + 2;
  const top = mesh(new THREE.BoxGeometry(w, 0.6, 5), MAT.wood); top.position.y = 7;
  const mid = mesh(new THREE.BoxGeometry(w, 0.6, 5), MAT.wood); mid.position.y = 1.4;
  const base = mesh(new THREE.BoxGeometry(w, 0.8, 6), MAT.wood); base.position.y = 0.4;
  const e1 = mesh(new THREE.BoxGeometry(0.8, 7.4, 6), MAT.wood); e1.position.set(-w / 2, 3.7, 0);
  const e2 = e1.clone(); e2.position.x = w / 2;
  g.add(top, mid, base, e1, e2);
  const holes = [];
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 2.8 + i * 3.6;
    const ring = mesh(new THREE.TorusGeometry(1.0, 0.18, 6, 16), new THREE.MeshStandardMaterial({ color: 0x3b2413, roughness: 0.8 }));
    ring.rotation.x = Math.PI / 2; ring.position.set(x, 7.32, 0);
    g.add(ring);
    holes.push(V3(x, 1.8, 0));
  }
  return { group: g, holes, app: { group: g, size: [w, 7.5, 6], grip: V3(w / 2, 6, 0) } };
}

export function testTubeHolder() {
  const g = new THREE.Group();
  const a = mesh(new THREE.BoxGeometry(18, 0.6, 1.2), MAT.wood); a.position.set(0, 0.6, 0.5);
  const b = a.clone(); b.position.z = -0.5;
  const spring = mesh(new THREE.TorusGeometry(0.6, 0.12, 6, 12), MAT.steel); spring.position.set(-3, 0.6, 0); spring.rotation.y = Math.PI / 2;
  g.add(a, b, spring);
  return { group: g, app: { group: g, size: [18, 1.2, 2], grip: V3(-6, 0.8, 0) }, pose: 'grab' };
}

export function whiteTile(w = 12) {
  const g = new THREE.Group();
  const t = mesh(new THREE.BoxGeometry(w, 0.5, w), MAT.porcelain); t.position.y = 0.25;
  g.add(t);
  return { group: g, app: { group: g, size: [w, 0.5, w], grip: V3(w / 2 - 1, 0.4, 0) } };
}

// A strip of paper (litmus, pH, filter) — changes colour with setColor
export function paperStrip(col = 0xd6453d, w = 0.9, len = 6) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, side: THREE.DoubleSide });
  const s = mesh(new THREE.BoxGeometry(w, 0.04, len), mat);
  s.position.set(0, 0.05, 0);
  g.add(s);
  const api = { group: g, mat, strip: s, setColor(c) { mat.color.set(c); } };
  return Object.assign(api, { app: { group: g, size: [w, 0.1, len], grip: V3(0, 0.1, len / 2 - 0.5) }, pose: 'pinch' });
}

// Vial of litmus papers (red and blue)
export function litmusVial(kind = 'blue') {
  const g = new THREE.Group();
  const v = mesh(new THREE.CylinderGeometry(1.4, 1.4, 5, 16), MAT.plastic); v.position.y = 2.5;
  const cap = mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16), new THREE.MeshStandardMaterial({ color: kind === 'blue' ? 0x1d4ed8 : 0xb91c1c })); cap.position.y = 5.3;
  g.add(v, cap);
  for (let i = 0; i < 5; i++) {
    const s = mesh(new THREE.BoxGeometry(0.7, 5.5, 0.04), new THREE.MeshStandardMaterial({ color: kind === 'blue' ? 0x3b6fd8 : 0xd6453d, roughness: 0.9 }));
    s.position.set(-0.6 + i * 0.3, 3, 0.2 * Math.sin(i)); s.rotation.z = (i - 2) * 0.04;
    g.add(s);
  }
  const lbl = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 2, 16, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: labelTex(`${kind} litmus`, 'paper', kind === 'blue' ? '#1d4ed8' : '#b91c1c', 200, 100), side: THREE.DoubleSide }));
  lbl.position.y = 2.2; lbl.rotation.y = Math.PI;
  g.add(lbl);
  return { group: g, app: { group: g, size: [3, 6, 3], grip: V3(0, 3, 1.5) }, pose: 'pinch' };
}

// Universal indicator (pH) colours
export const PH_COLORS = ['#b3001b', '#e5261f', '#f15a24', '#f7931e', '#fbb03b', '#fcee21', '#d9e021', '#8cc63f', '#39b54a', '#009245', '#00a99d', '#29abe2', '#0071bc', '#2e3192', '#662d91'];
export function phColor(pH) { return PH_COLORS[THREE.MathUtils.clamp(Math.round(pH), 0, 14)]; }
export function phChart() {
  const g = new THREE.Group();
  const tex = canvasTex(512, 128, (c, w, h) => {
    c.fillStyle = '#fbfaf3'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#111'; c.font = 'bold 18px Arial'; c.fillText('Universal indicator — pH colour chart', 10, 22);
    PH_COLORS.forEach((col, i) => { c.fillStyle = col; c.fillRect(8 + i * 33, 36, 30, 52); c.fillStyle = '#111'; c.font = '16px Arial'; c.fillText(String(i), 16 + i * 33 - (i > 9 ? 4 : 0), 110); });
  });
  const card = mesh(new THREE.BoxGeometry(16, 0.1, 4), [MAT.white, MAT.white, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), MAT.white, MAT.white, MAT.white]);
  card.position.y = 0.05;
  g.add(card);
  return { group: g, app: { group: g, size: [16, 0.2, 4], grip: V3(7, 0.2, 1) } };
}

export function spatula() {
  const g = new THREE.Group();
  const h = mesh(new THREE.BoxGeometry(14, 0.12, 0.8), MAT.steel); h.position.y = 0.3;
  const s = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 12), MAT.steel); s.position.set(7.2, 0.3, 0);
  g.add(h, s);
  return { group: g, app: { group: g, size: [15, 0.4, 1.2], grip: V3(-4, 0.4, 0) }, pose: 'pinch', scoop: V3(7.2, 0.4, 0) };
}

// Heap of a solid (powder/crystals) sitting in a dish or on a watch glass
export function heap(col = 0xffffff, r = 1.5, h = 0.9, rough = 0.95) {
  const m = mesh(new THREE.ConeGeometry(r, h, 18), new THREE.MeshStandardMaterial({ color: col, roughness: rough }));
  m.position.y = h / 2;
  return m;
}

// Digital balance with a readout
export function balance() {
  const g = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(18, 4, 22), new THREE.MeshStandardMaterial({ color: 0xe8eaed, roughness: 0.4 }));
  body.position.y = 2;
  const pan = mesh(new THREE.CylinderGeometry(6, 6, 0.4, 32), MAT.steel);
  pan.position.set(0, 4.3, -2);
  const panel = mesh(new THREE.BoxGeometry(16, 3, 0.6), new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5 }));
  panel.position.set(0, 2.4, 11.2); panel.rotation.x = -0.35;
  let text = '0.00 g';
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const x = c.getContext('2d');
    x.fillStyle = '#0f2a12'; x.fillRect(0, 0, 256, 64);
    x.fillStyle = '#7CFF7C'; x.font = 'bold 44px monospace'; x.textAlign = 'right'; x.fillText(text, 246, 48);
    tex.needsUpdate = true;
  };
  draw();
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: tex }));
  disp.position.set(-2.5, 2.5, 11.55); disp.rotation.x = -0.35;
  const tare = mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
  tare.rotation.x = Math.PI / 2 - 0.35; tare.position.set(5, 2.4, 11.6);
  g.add(body, pan, panel, disp, tare);
  const api = { group: g, pan, tare, panTop: V3(0, 4.5, -2), show(t) { if (t !== text) { text = t; draw(); } } };
  return Object.assign(api, { app: { group: g, size: [18, 4.5, 22], grip: V3(8, 3, 6) } });
}

export function stopwatch() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(2.6, 2.6, 1, 28), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 }));
  body.rotation.x = Math.PI / 2 - 1.2; body.position.y = 2;
  const btn = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 10), MAT.steel);
  btn.position.set(0, 4.5, -0.9); btn.rotation.x = -0.37;
  let text = '00:00.0';
  const c = document.createElement('canvas'); c.width = 256; c.height = 96;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const x = c.getContext('2d');
    x.fillStyle = '#c8d3b8'; x.fillRect(0, 0, 256, 96);
    x.fillStyle = '#111'; x.font = 'bold 50px monospace'; x.textAlign = 'center'; x.fillText(text, 128, 66);
    tex.needsUpdate = true;
  };
  draw();
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.35), new THREE.MeshBasicMaterial({ map: tex }));
  disp.position.set(0, 2.2, 0.55); disp.rotation.x = -1.2 + Math.PI / 2 - Math.PI / 2;
  disp.rotation.x = -(Math.PI / 2 - (Math.PI / 2 - 1.2));
  g.add(body, btn, disp);
  const api = {
    group: g, btn, t: 0, running: false,
    show(sec) { const m = Math.floor(sec / 60), s = sec - m * 60; const t = `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`; if (t !== text) { text = t; draw(); } },
    update(dt) { if (api.running) { api.t += dt; api.show(api.t); } },
  };
  live.add(api);
  return Object.assign(api, { app: { group: g, size: [5.2, 4.5, 3], grip: V3(0, 3, 0.6) }, pose: 'pinch' });
}

export function thermometer(len = 30) {
  const g = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(0.3, 0.3, len, 10), MAT.glassRim, false);
  stem.position.y = len / 2; stem.renderOrder = 3;
  const bulb = mesh(new THREE.SphereGeometry(0.45, 12, 8), new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.3 }));
  const col = mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 6), new THREE.MeshStandardMaterial({ color: 0xc81e1e }));
  g.add(stem, bulb, col);
  const api = { group: g, set(T) { const h = 2 + (T / 110) * (len - 4); col.scale.y = h; col.position.y = h / 2; } };
  api.set(25);
  return Object.assign(api, { app: { group: g, size: [1, len, 1], grip: V3(0, len - 4, 0.3) }, pose: 'pinch' });
}

// Glass jar with lid (chromatography tank, gas jar)
export function jar(r = 4, h = 18, lid = true) {
  const v = vessel({ capacity: Math.PI * r * r * h, name: 'jar', profile: [[r - 0.1, 0], [r, 0.3], [r, h]], wall: 0.2 });
  let lidMesh = null;
  if (lid) {
    lidMesh = mesh(new THREE.CylinderGeometry(r + 0.4, r + 0.4, 0.6, 28), MAT.glassRim, false);
    lidMesh.position.y = h + 0.3; lidMesh.renderOrder = 4;
    v.group.add(lidMesh);
  }
  return Object.assign(v, { lid: lidMesh, app: { group: v.group, size: [2 * r, h, 2 * r], grip: V3(0, h * 0.5, r + 0.2) }, height: h, radius: r });
}

// Cork with a bent delivery tube (for gases into lime water)
export function deliveryTube(span = 16, drop = 12) {
  const g = new THREE.Group();
  const cork = mesh(new THREE.CylinderGeometry(0.95, 0.75, 1.6, 14), MAT.cork);
  g.add(cork);
  const path = new THREE.CatmullRomCurve3([V3(0, -1, 0), V3(0, 3, 0), V3(0.5, 5, 0), V3(span * 0.5, 5.6, 0), V3(span - 0.5, 5, 0), V3(span, 3, 0), V3(span, 3 - drop, 0)]);
  const tube = mesh(new THREE.TubeGeometry(path, 60, 0.28, 8, false), MAT.glassRim, false);
  tube.renderOrder = 4;
  g.add(tube);
  return { group: g, outlet: V3(span, 3 - drop, 0), app: { group: g, size: [span, 6, 2], grip: V3(span * 0.5, 5.6, 0) }, pose: 'pinch' };
}

// Nichrome / platinum wire loop in a glass handle (flame tests)
export function wireLoop() {
  const g = new THREE.Group();
  const handle = mesh(new THREE.CylinderGeometry(0.35, 0.35, 10, 10), MAT.glassRim, false);
  handle.rotation.z = Math.PI / 2; handle.position.set(-5, 0.4, 0);
  const wire = mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 6), new THREE.MeshStandardMaterial({ color: 0xcfcfcf, metalness: 1, roughness: 0.3 }));
  wire.rotation.z = Math.PI / 2; wire.position.set(3, 0.4, 0);
  const loop = mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 14), wire.material);
  loop.position.set(6.3, 0.4, 0);
  const bead = mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, transparent: true, opacity: 0 }));
  bead.position.copy(loop.position);
  g.add(handle, wire, loop, bead);
  return { group: g, loop, bead, tipLocal: loop.position.clone(), app: { group: g, size: [16, 0.8, 0.8], grip: V3(-6, 0.5, 0) }, pose: 'pinch' };
}

// Watch glass with a solid sample and a paper label on the tile under it
export function sampleDish(label, col, { heapCol = col } = {}) {
  const g = new THREE.Group();
  const wg = watchGlass(3);
  g.add(wg.group);
  const h = heap(heapCol, 1.3, 0.7);
  h.position.y += 0.3;
  g.add(h);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.6), new THREE.MeshStandardMaterial({ map: labelTex(label, '', '#475569', 240, 80), roughness: 0.8 }));
  tag.rotation.x = -Math.PI / 2; tag.position.set(0, 0.05, 4.2);
  g.add(tag);
  return { group: g, heap: h, app: { group: g, size: [6, 1.2, 8], grip: V3(3, 0.8, 0) }, pose: 'pinch' };
}

// ---------------------------------------------------------------------------
// Effects: bubbles, drops, pouring stream, fumes
// ---------------------------------------------------------------------------

// Bubbles rising through a vessel's liquid (rate 0 … 1)
export function bubbles(v, { col = 0xffffff, size = 0.12, max = 60 } = {}) {
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshPhysicalMaterial({ color: col, transparent: true, opacity: 0.6, roughness: 0.05, depthWrite: false }), max);
  im.frustumCulled = false; im.renderOrder = 2; im.userData.noPick = true;
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  v.group.add(im);
  const B = Array.from({ length: max }, () => ({ alive: false }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V3(), p = V3();
  const api = {
    rate: 0,
    update(dt) {
      const level = v.level;
      const spawn = api.rate * max * 1.2 * dt;
      let toSpawn = spawn + (Math.random() < spawn % 1 ? 1 : 0);
      let n = 0;
      for (const b of B) {
        if (!b.alive && toSpawn >= 1 && v.vol > 0.1) {
          const r = v.innerR(v.y0) * 0.7 * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
          Object.assign(b, { alive: true, x: Math.cos(a) * r, z: Math.sin(a) * r, y: v.y0 + 0.1, sz: size * (0.5 + Math.random()), vy: 2 + Math.random() * 3 });
          toSpawn--;
        }
        if (!b.alive) continue;
        b.y += b.vy * dt; b.vy += dt * 3;
        b.x += Math.sin(b.y * 7 + b.sz * 50) * dt * 0.3;
        if (b.y > level - 0.05) { b.alive = false; continue; }
        const rr = v.innerR(b.y) - b.sz;
        const d = Math.hypot(b.x, b.z);
        if (d > rr) { b.x *= rr / d; b.z *= rr / d; }
        p.set(b.x, b.y, b.z); s.setScalar(b.sz);
        m4.compose(p, q, s); im.setMatrixAt(n++, m4);
      }
      im.count = n;
      im.instanceMatrix.needsUpdate = true;
    },
  };
  live.add(api);
  return api;
}

// Fumes / vapour rising from a world point (rate 0 … 1)
export function fumes(scene, { col = 0xffffff, opacity = 0.25, max = 40, spread = 1.2, rise = 6 } = {}) {
  const tex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const P = Array.from({ length: max }, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: 0, depthWrite: false }));
    sp.visible = false; sp.userData.noPick = true; sp.renderOrder = 7;
    scene.add(sp);
    return { sp, alive: false };
  });
  const api = {
    rate: 0, origin: V3(),
    update(dt) {
      let toSpawn = api.rate * max * 0.6 * dt;
      for (const p of P) {
        if (!p.alive && (toSpawn >= 1 || Math.random() < toSpawn)) {
          toSpawn--;
          Object.assign(p, { alive: true, age: 0, life: 2 + Math.random() * 1.5, vx: (Math.random() - 0.5) * spread, vz: (Math.random() - 0.5) * spread });
          p.sp.position.copy(api.origin);
          p.sp.visible = true;
        }
        if (!p.alive) continue;
        p.age += dt;
        const k = p.age / p.life;
        if (k >= 1) { p.alive = false; p.sp.visible = false; continue; }
        p.sp.position.x += p.vx * dt; p.sp.position.z += p.vz * dt; p.sp.position.y += rise * dt * (1 - k * 0.5);
        p.sp.scale.setScalar(1 + k * 5);
        p.sp.material.opacity = opacity * Math.sin(Math.PI * k);
      }
    },
  };
  live.add(api);
  return api;
}

// Falling drops (world space); onLand called when each reaches `toY`
export function dropper(scene) {
  const pool = [];
  const geo = new THREE.SphereGeometry(0.16, 10, 8);
  const api = {
    drop(from, toY, col, onLand) {
      let d = pool.find((x) => !x.alive);
      if (!d) { d = { m: new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.8, roughness: 0.05, depthWrite: false })) }; d.m.userData.noPick = true; d.m.renderOrder = 2; scene.add(d.m); pool.push(d); }
      Object.assign(d, { alive: true, vy: 0, toY, onLand });
      d.m.material.color.set(col);
      d.m.scale.set(1, 1.3, 1);
      d.m.position.copy(from);
      d.m.visible = true;
    },
    update(dt) {
      for (const d of pool) {
        if (!d.alive) continue;
        d.vy -= 980 * dt;
        d.m.position.y += d.vy * dt;
        if (d.m.position.y <= d.toY) { d.alive = false; d.m.visible = false; if (d.onLand) d.onLand(); }
      }
    },
  };
  live.add(api);
  return api;
}

// A pouring stream from a lip to a target point (world), shown while active
export function stream(scene) {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, roughness: 0.05, depthWrite: false });
  const m = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  m.visible = false; m.userData.noPick = true; m.renderOrder = 2;
  scene.add(m);
  return {
    show(a, b, col, width = 0.22) {
      mat.color.set(col);
      const mid = a.clone().lerp(b, 0.3); mid.y = a.y - (a.y - b.y) * 0.15;
      const c = new THREE.QuadraticBezierCurve3(a, mid, b);
      m.geometry.dispose();
      m.geometry = new THREE.TubeGeometry(c, 16, width, 6, false);
      m.visible = true;
    },
    hide() { m.visible = false; },
  };
}

// ---------------------------------------------------------------------------
// Hand motions used in chemistry (work in every mode; see engine lab API)
// ---------------------------------------------------------------------------

// A pour target: a vessel item key, or { topW(), surfW(), add(mL, col, op) }
function target(lab, dst) {
  if (typeof dst !== 'string') return dst;
  const it = lab.items[dst], v = it.app.v;
  return {
    topW: () => it.group.localToWorld(V3(0, v.yTop, 0)),
    surfW: () => it.group.localToWorld(V3(0, v.level + 0.05, 0)),
    add: (mL, col, op) => v.add(mL, col, op),
  };
}

// Pour `mL` from a vessel item into a vessel item (or any pour target).
export async function pour(lab, fx, srcKey, dst, mL, { dur = 1.6, onFlow, tilt = 1.35 } = {}) {
  const src = lab.items[srcKey];
  const sv = src.app.v;
  const T = target(lab, dst);
  if (src.app.stopper) src.app.stopper.visible = false;
  if (!lab.carried.has(srcKey)) await lab.pickUp(srcKey);
  // Hold the source beside the destination's mouth, spout toward it
  const mouth = T.topW();
  const side = Math.sign(src.group.position.x - mouth.x) || 1;
  const rot = side > 0 ? Math.PI : 0; // spout (local +x) faces the target
  const pos = mouth.clone().add(V3(side * (sv.lip.x + 0.8), 1.5 - sv.lip.y * 0.55, 0));
  await lab.holdAt(srcKey, pos, new THREE.Euler(0, rot, 0), { dur: 1.1, arc: 10 });
  const g = src.group;
  const E = (a) => new THREE.Euler(0, rot, -a);
  let poured = 0;
  const lipW = () => g.localToWorld(sv.lip.clone().add(V3(0.25, 0, 0)));
  // tilt about the lip so it stays over the mouth
  const lip0 = () => mouth.clone().add(V3(side * 0.9, 1.2, 0));
  const tiltTo = async (a0, a1, d, during) => {
    await lab.tween(d, (e, k) => {
      const a = a0 + (a1 - a0) * e;
      const q = new THREE.Quaternion().setFromEuler(E(a));
      const lipOff = sv.lip.clone().applyQuaternion(q);
      const base = lip0().sub(lipOff);
      const grip = base.clone().add(src.app.grip.clone().applyQuaternion(q));
      g.quaternion.copy(q);
      const h = lab.carried.get(srcKey)?.hand || lab.handR();
      h.goal.copy(grip);
      if (!lab.hands) g.position.copy(base);
      if (during) during(e, k);
    });
  };
  await tiltTo(0, tilt * 0.55, 0.7);
  await tiltTo(tilt * 0.55, tilt, dur, (e) => {
    const want = mL * e;
    const d = Math.min(want - poured, sv.vol);
    if (d > 0) {
      sv.setLiquid(sv.vol - d);
      T.add(d, sv.color, sv.opacity);
      poured += d;
      if (onFlow) onFlow(d, poured);
    }
    if (sv.vol > 0.05 && e < 0.97) fx.stream.show(lipW(), T.surfW(), sv.color); else fx.stream.hide();
  });
  fx.stream.hide();
  await tiltTo(tilt, 0, 0.6);
  await lab.putBack(srcKey);
  if (src.app.stopper) src.app.stopper.visible = true;
  lab.sfx('glass');
  return poured;
}

// Add n drops from a dropper bottle item into a vessel item (or world point)
export async function addDrops(lab, fx, bottleKey, dstKey, n, { onDrop, interval = 0.45 } = {}) {
  const b = lab.items[bottleKey];
  const dst = lab.items[dstKey];
  const dv = dst.app.v;
  const R = lab.handR();
  const dr = b.app.dropper;
  const home = dr.position.clone();
  const parent = dr.parent;
  const topW = dst.group.localToWorld(V3(0, (dv.yTop ?? 10) + 3.5, 0));
  // Take the dropper out of its bottle and hold it over the vessel
  await lab.touch(parent.localToWorld(home.clone().add(V3(0, 2, 0))), null, { pose: 'pinch', dur: 0.7 });
  lab.scene.attach(dr);
  const start = dr.position.clone();
  const holdAt = topW.clone().add(V3(0, 2.2, 0));
  await lab.tween(0.9, (e) => { dr.position.lerpVectors(start, holdAt, e); dr.position.y += Math.sin(Math.PI * e) * 5; R.goal.copy(dr.position).add(V3(0, 2, 0)); });
  const teat = dr.children[2];
  for (let i = 0; i < n; i++) {
    await lab.tween(interval * 0.5, (e) => { teat.scale.set(1 - 0.25 * e, 1.9 - 0.4 * e, 1 - 0.25 * e); });
    const from = dr.localToWorld(V3(0, -5.2, 0));
    const landY = dst.group.localToWorld(V3(0, dv.level, 0)).y;
    await new Promise((res) => fx.drops.drop(from, landY, b.app.dropColor || 0xffffff, () => { lab.sfx('drip'); if (onDrop) onDrop(i); res(); }));
    await lab.tween(interval * 0.5, (e) => { teat.scale.set(0.75 + 0.25 * e, 1.5 + 0.4 * e, 0.75 + 0.25 * e); });
    lab.checkAbort();
  }
  const back = parent.localToWorld(home.clone());
  const s2 = dr.position.clone();
  await lab.tween(0.9, (e) => { dr.position.lerpVectors(s2, back, e); dr.position.y += Math.sin(Math.PI * e) * 5; R.goal.copy(dr.position).add(V3(0, 2, 0)); });
  parent.attach(dr);
  dr.position.copy(home); dr.rotation.set(0, 0, 0);
}

// Transfer with a pipette: draw up from src vessel item, deliver into dst
export async function pipetteTransfer(lab, pipKey, srcKey, dstKey, { col } = {}) {
  const pip = lab.items[pipKey], src = lab.items[srcKey], dst = lab.items[dstKey];
  const sv = src.app.v, dv = dst.app.v;
  const up = new THREE.Euler(0, 0, 0);
  await lab.pickUp(pipKey);
  const srcIn = src.group.localToWorld(V3(0, sv.y0 + 0.6, 0));
  await lab.holdAt(pipKey, srcIn.clone().add(V3(0, 14, 0)), up, { dur: 1.0, arc: 12 });
  await lab.holdAt(pipKey, srcIn, up, { dur: 0.7, arc: 0 });
  const need = pip.app.capacity || 20;
  const c = col ?? sv.color.getHex();
  const v0 = sv.vol;
  // squeeze the filler bulb: liquid rises a little above the mark
  await lab.tween(1.6, (e) => { pip.app.setFill(e * 1.08, c); sv.setLiquid(v0 - need * 1.08 * e); });
  await lab.holdAt(pipKey, srcIn.clone().add(V3(0, 16, 0)), up, { dur: 0.6, arc: 0 });
  // let it fall back to the mark, draining the excess into the beaker
  await lab.tween(0.7, (e) => { pip.app.setFill(1.08 - 0.08 * e, c); });
  sv.add(need * 0.08);
  const dstIn = dst.group.localToWorld(V3(0, dv.yTop - 4, 0));
  await lab.holdAt(pipKey, dstIn.clone().add(V3(0, 5, 0)), up, { dur: 1.0, arc: 10 });
  const sc = sv.color.clone(), so = sv.opacity;
  let given = 0;
  await lab.tween(2.2, (e) => {
    const d = need * e - given;
    if (d > 0) { dv.add(d, sc, so); given += d; }
    pip.app.setFill(1 - e, c);
  });
  pip.app.setFill(0);
  await lab.wait(0.4); // touch the tip to the side for a moment; the last drop stays in the tip
  await lab.putBack(pipKey);
  return need;
}

// Swirl a held flask a few times (mixing)
export async function swirl(lab, key, turns = 3, dur = 1.4) {
  const it = lab.items[key];
  const g = it.group;
  const c0 = g.position.clone();
  const R = lab.handR();
  await lab.tween(dur, (e, k) => {
    const a = k * turns * Math.PI * 2;
    g.rotation.z = Math.sin(a) * 0.12; g.rotation.x = Math.cos(a) * 0.12;
    void c0; void R;
  });
  g.rotation.x = 0; g.rotation.z = 0;
}
