// Asset loading and the finger poses used by the student's hands.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Curl angles in degrees: [proximal, intermediate, distal] per finger,
// thumb [metacarpal, proximal, distal], plus finger spread.
export const POSES = {
  relaxed: { index: [18, 22, 10], middle: [24, 28, 12], ring: [28, 30, 14], pinky: [32, 32, 16], thumb: [12, 14, 8], spread: 4 },
  point: { index: [2, 4, 2], middle: [78, 95, 55], ring: [82, 95, 55], pinky: [86, 95, 55], thumb: [30, 30, 20], spread: 0 },
  press: { index: [14, 12, 6], middle: [78, 95, 55], ring: [82, 95, 55], pinky: [86, 95, 55], thumb: [30, 30, 20], spread: 0 },
  pinch: { index: [38, 48, 28], middle: [48, 60, 34], ring: [58, 70, 40], pinky: [66, 76, 44], thumb: [34, 30, 26], spread: 0 },
  grab: { index: [48, 44, 22], middle: [50, 46, 24], ring: [52, 48, 24], pinky: [54, 50, 26], thumb: [26, 18, 12], spread: 6 },
  flat: { index: [4, 4, 2], middle: [4, 4, 2], ring: [5, 5, 3], pinky: [6, 6, 3], thumb: [8, 6, 4], spread: 8 },
};

export const ASSET_BASE = './meter-bridge/assets/';
const gltfLoader = new GLTFLoader();
// Loads a .glb from the assets folder (the single place asset loading happens)
export function loadGLB(f, base = ASSET_BASE) {
  return new Promise((res, rej) => gltfLoader.load(base + f, res, undefined, rej));
}
