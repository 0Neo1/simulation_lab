// The physics laboratory around the student's bench: floor, walls, windows,
// ceiling lights, chalkboard, cabinets, other benches, trolley and posters.
// Units are centimetres; the working bench top is at y = TABLE_Y.
import * as THREE from 'three';

export const FLOOR_Y = -79; // bench tops are 76 cm above the floor
export const CEIL_Y = FLOOR_Y + 300;
export const ROOM = { x0: -420, x1: 540, z0: -260, z1: 420 };
export const TROLLEY = { x: 186, z: 2, w: 110, d: 66 };

function tex(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 8;
  return t;
}

function speckle(g, w, h, n, colors, alpha = 0.08) {
  g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[i % colors.length];
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5);
  }
  g.globalAlpha = 1;
}

function floorTexture() {
  // 30 cm vinyl tiles with grout lines and speckle
  return tex(512, 512, (g, w, h) => {
    const tiles = [['#d9d6cf', '#cfcbc2'], ['#cfcbc2', '#d9d6cf']];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = tiles[i][j]; g.fillRect(i * w / 2, j * h / 2, w / 2, h / 2);
    }
    speckle(g, w, h, 9000, ['#7d776c', '#ffffff', '#9c958a'], 0.18);
    g.strokeStyle = 'rgba(90,85,78,0.55)'; g.lineWidth = 3;
    g.strokeRect(0, 0, w / 2, h / 2); g.strokeRect(w / 2, 0, w / 2, h / 2);
    g.strokeRect(0, h / 2, w / 2, h / 2); g.strokeRect(w / 2, h / 2, w / 2, h / 2);
  }, { repeat: [ (ROOM.x1 - ROOM.x0) / 60, (ROOM.z1 - ROOM.z0) / 60 ] });
}

function plasterTexture(base) {
  return tex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 5000, ['#000', '#fff'], 0.035);
  }, { repeat: [8, 4] });
}

function resinTexture() {
  return tex(512, 256, (g, w, h) => {
    g.fillStyle = '#23262b'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 6000, ['#5b6068', '#0e0f11', '#3a3e45'], 0.3);
  }, { repeat: [3, 1.2] });
}

function woodTex(base, dark, rings = 60) {
  return tex(512, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < rings; i++) {
      const y0 = Math.random() * h, amp = 2 + Math.random() * 6, f = 0.004 + Math.random() * 0.01;
      g.strokeStyle = dark; g.globalAlpha = 0.05 + Math.random() * 0.15; g.lineWidth = 0.5 + Math.random() * 2;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * f) * amp; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 1;
  });
}

// Chalkboard with the circuit diagram, formulae and the outline of the method
function chalkboardTexture() {
  return tex(2048, 820, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#1f3b2d'); bg.addColorStop(1, '#193226');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // faint erased smears
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,255,255,${0.012 + Math.random() * 0.02})`;
      g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 60 + Math.random() * 220, 20 + Math.random() * 60, Math.random(), 0, Math.PI * 2); g.fill();
    }
    const chalk = (c = '#f4f1e8') => { g.strokeStyle = c; g.fillStyle = c; g.lineCap = 'round'; g.lineJoin = 'round'; };
    chalk();
    g.font = 'bold 64px "Comic Sans MS", "Segoe Print", cursive';
    g.fillText('Meter Bridge — specific resistance of a wire', 70, 100);
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(70, 118); g.lineTo(1380, 118); g.stroke();

    // Circuit diagram
    const ox = 110, oy = 220;
    g.lineWidth = 6;
    const line = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y))); g.stroke(); };
    line([[0, 60], [150, 60]]); g.strokeRect(ox + 150, oy + 35, 130, 50); line([[280, 60], [420, 60]]);
    line([[420, 60], [560, 60]]); g.strokeRect(ox + 560, oy + 35, 130, 50); line([[690, 60], [840, 60]]);
    line([[0, 60], [0, 300], [840, 300], [840, 60]]);
    g.beginPath(); g.arc(ox + 420, oy + 170, 42, 0, Math.PI * 2); g.stroke();
    line([[420, 60], [420, 128]]); line([[420, 212], [320, 300]]);
    g.beginPath(); g.moveTo(ox + 405, oy + 190); g.lineTo(ox + 435, oy + 150); g.stroke();
    line([[0, 300], [0, 420], [360, 420]]); line([[390, 395], [390, 445]]); line([[410, 405], [410, 435]]);
    line([[410, 420], [520, 420]]);
    g.beginPath(); g.arc(ox + 540, oy + 420, 12, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(ox + 600, oy + 420, 12, 0, Math.PI * 2); g.stroke();
    line([[612, 420], [840, 420], [840, 300]]);
    g.font = '46px "Comic Sans MS", "Segoe Print", cursive';
    g.fillText('R', ox + 200, oy + 20); g.fillText('X', ox + 610, oy + 20);
    g.fillText('G', ox + 405, oy + 186 - 48); g.fillText('A', ox - 50, oy + 312); g.fillText('C', ox + 856, oy + 312);
    g.fillText('B', ox + 432, oy + 50); g.fillText('D', ox + 300, oy + 350);
    g.fillText('E', ox + 385, oy + 490); g.fillText('K', ox + 555, oy + 480);
    g.font = '36px "Comic Sans MS", "Segoe Print", cursive';
    g.fillText('l', ox + 150, oy + 345); g.fillText('100 − l', ox + 540, oy + 345);
    g.fillText('bridge wire (100 cm)', ox + 520, oy + 280);

    // Formulae and method
    chalk('#fde68a');
    g.font = 'bold 50px "Comic Sans MS", "Segoe Print", cursive';
    g.fillText('X = R (100 − l) / l', 1120, 250);
    g.fillText('ρ = π r² X / L', 1120, 330);
    chalk();
    g.font = '36px "Comic Sans MS", "Segoe Print", cursive';
    ['1. Place apparatus, make neat & tight connections', '2. Insert key K, choose R from the box',
      '3. Tap jockey at both ends → opposite deflections', '4. Remove HR, find null point, note l',
      '5. Repeat for 3 values of R; interchange R and X', '6. Screw gauge → d,   metre scale → L']
      .forEach((t, i) => g.fillText(t, 1120, 420 + i * 58));
    chalk('#93c5fd');
    g.fillText('Remove key between readings!', 1120, 420 + 6 * 58 + 20);
  });
}

function posterTexture(kind) {
  return tex(512, 700, (g, w, h) => {
    g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, h);
    if (kind === 'safety') {
      g.fillStyle = '#b91c1c'; g.fillRect(0, 0, w, 120);
      g.fillStyle = '#fff'; g.font = 'bold 54px Arial'; g.textAlign = 'center';
      g.fillText('ELECTRICAL', w / 2, 60); g.fillText('SAFETY', w / 2, 110);
      g.fillStyle = '#facc15';
      g.beginPath(); g.moveTo(w / 2, 150); g.lineTo(w / 2 + 110, 340); g.lineTo(w / 2 - 110, 340); g.closePath(); g.fill();
      g.strokeStyle = '#111'; g.lineWidth = 10; g.stroke();
      g.fillStyle = '#111'; g.beginPath(); g.moveTo(w / 2 + 10, 190); g.lineTo(w / 2 - 30, 270); g.lineTo(w / 2 + 2, 270); g.lineTo(w / 2 - 14, 320); g.lineTo(w / 2 + 34, 245); g.lineTo(w / 2 + 2, 245); g.closePath(); g.fill();
      g.font = '28px Arial'; g.textAlign = 'left';
      ['• Switch off before wiring', '• Keep the key out when idle', '• Never short the cell', '• Tighten every terminal', '• Report hot wires at once']
        .forEach((t, i) => g.fillText(t, 50, 410 + i * 54));
    } else {
      g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, w, 90);
      g.fillStyle = '#fff'; g.font = 'bold 40px Arial'; g.textAlign = 'center';
      g.fillText('PERIODIC TABLE', w / 2, 60);
      const cols = ['#fca5a5', '#fdba74', '#fde68a', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4'];
      for (let r = 0; r < 7; r++) for (let c = 0; c < 18; c++) {
        if ((r === 0 && c > 0 && c < 17) || (r < 3 && c > 1 && c < 12)) continue;
        g.fillStyle = cols[(c + r) % cols.length];
        g.fillRect(16 + c * 26.6, 120 + r * 62, 24, 58);
      }
      g.fillStyle = '#334155'; g.font = '22px Arial';
      g.fillText('Elements by atomic number', w / 2, 600);
    }
  });
}

function skyTexture() {
  return tex(256, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#9fd3ff'); grd.addColorStop(0.7, '#e4f3ff'); grd.addColorStop(1, '#bfe3b0');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(Math.random() * w, 30 + Math.random() * 90, 40, 12, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#7fae6e'; g.fillRect(0, h * 0.82, w, h);
  });
}

function clockFaceTexture() {
  return tex(256, 256, (g, w, h) => {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, 124, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#111'; g.lineWidth = 8; g.stroke();
    g.fillStyle = '#111'; g.font = 'bold 28px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      g.fillText(String(i), w / 2 + Math.cos(a) * 96, h / 2 + Math.sin(a) * 96);
    }
  });
}

const box = (w, h, d, mat, cast = true) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = cast; m.receiveShadow = true;
  return m;
};

// A lab bench: resin top on a wooden cabinet with drawers and a kick plate
function buildBench(M, w, d) {
  const g = new THREE.Group();
  const top = box(w, 4, d, M.resin);
  top.position.y = -2;
  g.add(top);
  const bodyH = 76 - 4 - 10;
  const body = box(w - 6, bodyH, d - 10, M.cabinet);
  body.position.set(0, -4 - bodyH / 2, -2);
  g.add(body);
  const kick = box(w - 10, 10, d - 16, M.kick);
  kick.position.set(0, -76 + 5, -4);
  g.add(kick);
  const n = Math.max(2, Math.round(w / 60));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 3 + (w - 6) * (i + 0.5) / n;
    const drawer = box((w - 6) / n - 2, 14, 1.2, M.cabinetFront);
    drawer.position.set(x, -4 - 9, d / 2 - 6.4);
    const door = box((w - 6) / n - 2, bodyH - 22, 1.2, M.cabinetFront);
    door.position.set(x, -4 - 18 - (bodyH - 22) / 2, d / 2 - 6.4);
    const h1 = box(10, 1.2, 1.6, M.handleMetal); h1.position.set(x, -4 - 9, d / 2 - 5.2);
    const h2 = box(1.2, 10, 1.6, M.handleMetal); h2.position.set(x + ((w - 6) / n) * 0.35, -4 - 30, d / 2 - 5.2);
    g.add(drawer, door, h1, h2);
  }
  return g;
}

function buildStool(M) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 4, 28), M.stoolSeat);
  seat.position.y = 62; seat.castShadow = true;
  g.add(seat);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 62, 10), M.handleMetal);
    leg.position.set(Math.cos(a) * 12, 31, Math.sin(a) * 12);
    leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
    leg.castShadow = true;
    g.add(leg);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(13, 0.8, 8, 32), M.handleMetal);
  ring.rotation.x = Math.PI / 2; ring.position.y = 22;
  g.add(ring);
  return g;
}

export function buildRoom(scene, tableY) {
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.55, metalness: 0 }),
    wall: new THREE.MeshStandardMaterial({ map: plasterTexture('#e9e4d8'), roughness: 0.95 }),
    wallLow: new THREE.MeshStandardMaterial({ map: plasterTexture('#8aa39a'), roughness: 0.8 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 1 }),
    resin: new THREE.MeshStandardMaterial({ map: resinTexture(), roughness: 0.35, metalness: 0.05 }),
    cabinet: new THREE.MeshStandardMaterial({ map: woodTex('#8b6a4a', '#4a321c'), roughness: 0.7 }),
    cabinetFront: new THREE.MeshStandardMaterial({ map: woodTex('#9a7755', '#553a22', 40), roughness: 0.6 }),
    kick: new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.8 }),
    handleMetal: new THREE.MeshStandardMaterial({ color: 0xb8bec6, metalness: 1, roughness: 0.3 }),
    stoolSeat: new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.5 }),
    board: new THREE.MeshStandardMaterial({ map: chalkboardTexture(), roughness: 0.92 }),
    boardFrame: new THREE.MeshStandardMaterial({ map: woodTex('#7a5230', '#3b2412'), roughness: 0.6 }),
    sky: new THREE.MeshBasicMaterial({ map: skyTexture() }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.25, depthWrite: false }),
    lightPanel: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffbf0, emissiveIntensity: 1.6 }),
    red: new THREE.MeshStandardMaterial({ color: 0xc0171b, roughness: 0.35, metalness: 0.2 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xa9b0b8, metalness: 1, roughness: 0.35 }),
  };
  const room = new THREE.Group();
  scene.add(room);
  const W = ROOM.x1 - ROOM.x0, D = ROOM.z1 - ROOM.z0, H = CEIL_Y - FLOOR_Y;
  const cx = (ROOM.x0 + ROOM.x1) / 2, cz = (ROOM.z0 + ROOM.z1) / 2;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, FLOOR_Y, cz); floor.receiveShadow = true;
  room.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.ceiling);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, CEIL_Y, cz);
  room.add(ceil);

  // Walls: plaster above, painted dado below
  const wall = (w, pos, rotY) => {
    const up = new THREE.Mesh(new THREE.PlaneGeometry(w, H - 100), M.wall);
    up.position.set(pos.x, FLOOR_Y + 100 + (H - 100) / 2, pos.z); up.rotation.y = rotY; up.receiveShadow = true;
    const low = new THREE.Mesh(new THREE.PlaneGeometry(w, 100), M.wallLow);
    low.position.set(pos.x, FLOOR_Y + 50, pos.z); low.rotation.y = rotY; low.receiveShadow = true;
    const rail = box(w, 4, 2, M.frame, false);
    rail.position.set(pos.x, FLOOR_Y + 100, pos.z); rail.rotation.y = rotY;
    room.add(up, low, rail);
  };
  wall(W, new THREE.Vector3(cx, 0, ROOM.z0), 0);
  wall(W, new THREE.Vector3(cx, 0, ROOM.z1), Math.PI);
  wall(D, new THREE.Vector3(ROOM.x0, 0, cz), Math.PI / 2);
  wall(D, new THREE.Vector3(ROOM.x1, 0, cz), -Math.PI / 2);

  // Windows on the left wall with the sky behind them
  [-140, 20, 180].forEach((z) => {
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(130, 150), M.sky);
    sky.position.set(ROOM.x0 - 3, FLOOR_Y + 180, z); sky.rotation.y = Math.PI / 2;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(130, 150), M.glass);
    glass.position.set(ROOM.x0 + 0.6, FLOOR_Y + 180, z); glass.rotation.y = Math.PI / 2;
    room.add(sky, glass);
    [[0, 76, 136, 6], [0, -76, 140, 10], [0, 0, 136, 4]].forEach(([dz, dy, len, t]) => {
      const bar = box(t, t, len, M.frame, false); bar.position.set(ROOM.x0 + 1, FLOOR_Y + 180 + dy, z + dz); room.add(bar);
    });
    [-67, 0, 67].forEach((dz) => { const bar = box(6, 156, dz === 0 ? 4 : 6, M.frame, false); bar.position.set(ROOM.x0 + 1, FLOOR_Y + 180, z + dz); room.add(bar); });
    const sill = box(22, 4, 144, M.frame); sill.position.set(ROOM.x0 + 9, FLOOR_Y + 102, z); room.add(sill);
  });

  // Ceiling light panels
  [[-220, -120], [0, -120], [220, -120], [-220, 120], [0, 120], [220, 120]].forEach(([x, z]) => {
    const p = box(120, 3, 32, M.lightPanel, false);
    p.position.set(x, CEIL_Y - 2, z);
    const rim = box(124, 2, 36, M.steel, false); rim.position.set(x, CEIL_Y - 0.5, z);
    room.add(rim, p);
  });

  // Chalkboard on the back wall
  const boardW = 330, boardH = 132;
  const cb = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), M.board);
  cb.position.set(0, FLOOR_Y + 170, ROOM.z0 + 1.5);
  const bf = box(boardW + 10, boardH + 10, 2, M.boardFrame);
  bf.position.set(0, FLOOR_Y + 170, ROOM.z0 + 0.4);
  const tray = box(boardW, 3, 7, M.boardFrame);
  tray.position.set(0, FLOOR_Y + 170 - boardH / 2 - 5, ROOM.z0 + 4);
  room.add(bf, cb, tray);
  for (let i = 0; i < 3; i++) {
    const chalk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 7, 8), M.frame);
    chalk.rotation.z = Math.PI / 2; chalk.position.set(-120 + i * 14, FLOOR_Y + 170 - boardH / 2 - 2.5, ROOM.z0 + 4);
    room.add(chalk);
  }

  // Posters and a working wall clock
  const poster = (kind, x) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(56, 76), new THREE.MeshStandardMaterial({ map: posterTexture(kind), roughness: 0.8 }));
    p.position.set(x, FLOOR_Y + 170, ROOM.z0 + 1);
    room.add(p);
  };
  poster('safety', -250);
  poster('periodic', 250);
  const clock = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(16, 40), new THREE.MeshStandardMaterial({ map: clockFaceTexture(), roughness: 0.4 }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(16.3, 1.2, 10, 40), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
  const handMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const mkHand = (len, w) => { const h = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.4), handMat); h.geometry.translate(0, len / 2 - 1.5, 0); return h; };
  const hourH = mkHand(9, 1.1), minH = mkHand(13, 0.7), secH = mkHand(14, 0.25);
  secH.material = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
  hourH.position.z = 0.3; minH.position.z = 0.6; secH.position.z = 0.9;
  clock.add(face, rim, hourH, minH, secH);
  clock.position.set(0, FLOOR_Y + 262, ROOM.z0 + 1.2);
  room.add(clock);

  // The student's bench and a trolley holding the apparatus
  const main = buildBench(M, 240, 90);
  main.position.set(0, tableY, 0);
  room.add(main);

  const trolley = new THREE.Group();
  const tt = box(TROLLEY.w, 3, TROLLEY.d, M.cabinetFront);
  tt.position.y = -1.5;
  const lip = (w, d, x, z) => { const l = box(w, 3, d, M.steel); l.position.set(x, 1, z); trolley.add(l); };
  lip(TROLLEY.w + 2, 1.5, 0, TROLLEY.d / 2); lip(TROLLEY.w + 2, 1.5, 0, -TROLLEY.d / 2);
  lip(1.5, TROLLEY.d, TROLLEY.w / 2, 0); lip(1.5, TROLLEY.d, -TROLLEY.w / 2, 0);
  const shelf = box(TROLLEY.w - 4, 2.5, TROLLEY.d - 4, M.cabinetFront);
  shelf.position.y = -52;
  trolley.add(tt, shelf);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 70, 10), M.steel);
    post.position.set(sx * (TROLLEY.w / 2 - 3), -36, sz * (TROLLEY.d / 2 - 3)); post.castShadow = true;
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 2.5, 16), M.kick);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(sx * (TROLLEY.w / 2 - 3), -72.5, sz * (TROLLEY.d / 2 - 3));
    trolley.add(post, wheel);
  });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, TROLLEY.d, 12), M.steel);
  handle.rotation.x = Math.PI / 2; handle.position.set(TROLLEY.w / 2 + 6, 8, 0);
  const hb1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 12, 8), M.steel); hb1.position.set(TROLLEY.w / 2 + 3, 3, TROLLEY.d / 2 - 2); hb1.rotation.z = -0.9;
  const hb2 = hb1.clone(); hb2.position.z = -TROLLEY.d / 2 + 2;
  trolley.add(handle, hb1, hb2);
  trolley.position.set(TROLLEY.x, tableY, TROLLEY.z);
  room.add(trolley);

  // Stools at the working bench
  { const s = buildStool(M); s.position.set(-150, FLOOR_Y, 60); room.add(s); }

  // Other benches in the room, with a stool or two
  [[-290, -70, Math.PI / 2], [-290, 170, Math.PI / 2], [330, 250, 0]].forEach(([x, z, r]) => {
    const b = buildBench(M, 200, 80);
    b.position.set(x, tableY, z); b.rotation.y = r;
    room.add(b);
    const s = buildStool(M);
    s.position.set(x + (r ? 60 : -40), FLOOR_Y, z + (r ? 0 : 60));
    room.add(s);
  });

  // Glass-fronted apparatus cabinet on the right wall with bottles and boxes
  const cab = new THREE.Group();
  const carcass = box(46, 210, 190, M.cabinet); carcass.position.y = 105;
  cab.add(carcass);
  const bottleCols = [0x7dd3fc, 0xfca5a5, 0xfde68a, 0xa7f3d0, 0xc4b5fd];
  [40, 95, 150].forEach((y, row) => {
    const sh = box(44, 2, 186, M.cabinetFront); sh.position.set(-2, y, 0); cab.add(sh);
    for (let i = 0; i < 7; i++) {
      const isBox = (i + row) % 3 === 0;
      const m = isBox
        ? box(20, 12 + (i % 2) * 6, 18, new THREE.MeshStandardMaterial({ color: [0x7c2d12, 0x1e3a8a, 0x365314][i % 3], roughness: 0.6 }))
        : new THREE.Mesh(new THREE.CylinderGeometry(4, 4.5, 16 + (i % 3) * 4, 16), new THREE.MeshPhysicalMaterial({ color: bottleCols[i % 5], roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.85 }));
      m.position.set(-6, y + 1 + (isBox ? 7 : 9), -80 + i * 26);
      cab.add(m);
    }
  });
  const cabGlass = new THREE.Mesh(new THREE.PlaneGeometry(186, 196), M.glass);
  cabGlass.rotation.y = -Math.PI / 2; cabGlass.position.set(-23.5, 108, 0);
  cab.add(cabGlass);
  cab.position.set(ROOM.x1 - 24, FLOOR_Y, -110);
  room.add(cab);

  // Door, fire extinguisher and a bin by the entrance
  const door = box(4, 210, 95, M.cabinetFront);
  door.position.set(ROOM.x1 - 2, FLOOR_Y + 105, 300);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), M.handleMetal);
  knob.position.set(ROOM.x1 - 6, FLOOR_Y + 100, 262);
  room.add(door, knob);
  const ext = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 52, 24), M.red); body.position.y = 26; body.castShadow = true;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(3, 5, 8, 16), M.kick); cap.position.y = 56;
  ext.add(body, cap);
  ext.position.set(ROOM.x1 - 20, FLOOR_Y, 220);
  room.add(ext);

  return {
    group: room,
    update() {
      const d = new Date();
      const s = d.getSeconds() + d.getMilliseconds() / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      secH.rotation.z = -(s / 60) * Math.PI * 2;
      minH.rotation.z = -(m / 60) * Math.PI * 2;
      hourH.rotation.z = -(h / 12) * Math.PI * 2;
    },
  };
}
