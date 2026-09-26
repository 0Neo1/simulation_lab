// Asset loading and the finger poses used by the student's hands.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Curl angles in degrees: [proximal, intermediate, distal] per finger,
// thumb [metacarpal, proximal, distal], plus finger spread.
export const POSES = {
  // A resting hand: fingers gently flexed, more toward the little finger, thumb relaxed alongside
  relaxed: { index: [14, 20, 10], middle: [20, 26, 14], ring: [26, 30, 16], pinky: [32, 34, 18], thumb: [10, 14, 10], spread: 4 },
  // Index extended, the others folded into the palm, thumb resting over the middle finger
  point: { index: [4, 6, 4], middle: [70, 92, 55], ring: [76, 95, 58], pinky: [82, 95, 60], thumb: [34, 26, 20], spread: 0 },
  // Pressing down with the index fingertip: slightly bent index, others folded
  press: { index: [16, 18, 10], middle: [70, 92, 55], ring: [76, 95, 58], pinky: [82, 95, 60], thumb: [34, 26, 20], spread: 0 },
  // Precision pinch: index and thumb tips meet, the other fingers curl progressively
  pinch: { index: [36, 46, 28], middle: [40, 52, 32], ring: [50, 60, 36], pinky: [58, 66, 40], thumb: [38, 26, 24], spread: 2 },
  // Power grip round a box edge or handle
  grab: { index: [44, 52, 30], middle: [48, 56, 32], ring: [52, 58, 34], pinky: [56, 60, 36], thumb: [30, 22, 16], spread: 4 },
  // Open hand resting on the bench
  flat: { index: [4, 5, 3], middle: [4, 5, 3], ring: [6, 6, 3], pinky: [8, 7, 4], thumb: [8, 6, 4], spread: 8 },
};

export const ASSET_BASE = './meter-bridge/assets/';
const gltfLoader = new GLTFLoader();
// Loads a .glb from the assets folder (the single place asset loading happens)
export function loadGLB(f, base = ASSET_BASE) {
  return new Promise((res, rej) => gltfLoader.load(base + f, res, undefined, rej));
}
