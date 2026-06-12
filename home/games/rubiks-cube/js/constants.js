/* =====================================================================
   Shared constants — lattice geometry, colours, and the move algebra
   tables. Pure data (plus a few THREE vectors); no game state lives here.
   ===================================================================== */
import * as THREE from "three";

/* ---------- lattice / timing ---------------------------------------- */
export const SP = 1.0; // lattice spacing
export const HALF = SP / 2;
export const TURN_MS = 160; // face-turn duration
export const ROT_MS = 220; // whole-cube rotation duration
export const SCRAMBLE_MS = 95; // per-turn duration while shuffling (snappier)
export const SCRAMBLE_LEN = 22;
export const LONG_MS = 280; // hold threshold for a "double" (prime-less) turn

/* ---------- colours -------------------------------------------------- */
// Solved-state sticker colours, keyed by the cubie-local outward face.
export const FACE_COLORS = {
  "0,1,0": 0xf7f4ec, // up      — white
  "0,-1,0": 0xf4c95d, // down    — yellow
  "1,0,0": 0xf07a7a, // right   — red
  "-1,0,0": 0xf0a868, // left    — orange
  "0,0,1": 0x7cc47c, // front   — green
  "0,0,-1": 0x6fb7e8, // back    — blue
};

export const WHITE = 0xf7f4ec; // cross colour (the "up" face in the solved state)
export const YELLOW = 0xf4c95d; // opposite of white — never part of the white cross
export const BLACKOUT = 0x1b1916; // dimmed sticker colour in learning mode

/* ---------- viewer-frame directions (camera never moves) ------------ */
export const VIEW = {
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
};

export const AXIS_X = new THREE.Vector3(1, 0, 0);
export const AXIS_Y = new THREE.Vector3(0, 1, 0);

export const DIRS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

/* ---------- move algebra (faces · slices · wide turns · rotations) ----
   Every twist = "rotate the cubies whose coordinate ALONG `dir` is in
   `layers`, about `dir`". Outer face = layer 1, middle = 0, far side = -1.
   Wide moves grab the outer face + the adjacent middle (two layers, same
   direction); whole-cube rotations grab all three layers. This is what lets
   real OLL/PLL algorithms (which use r, f, x, y, …) play back faithfully. */
export const TURN = {
  U: { dir: VIEW.U, layers: [1] },
  D: { dir: VIEW.D, layers: [1] },
  L: { dir: VIEW.L, layers: [1] },
  R: { dir: VIEW.R, layers: [1] },
  F: { dir: VIEW.F, layers: [1] },
  B: { dir: VIEW.B, layers: [1] },
  // middle slices follow L / D / F respectively
  M: { dir: VIEW.L, layers: [0] },
  E: { dir: VIEW.D, layers: [0] },
  S: { dir: VIEW.F, layers: [0] },
  // wide (two-layer) turns — outer face + adjacent middle, same direction
  u: { dir: VIEW.U, layers: [1, 0] },
  d: { dir: VIEW.D, layers: [1, 0] },
  l: { dir: VIEW.L, layers: [1, 0] },
  r: { dir: VIEW.R, layers: [1, 0] },
  f: { dir: VIEW.F, layers: [1, 0] },
  b: { dir: VIEW.B, layers: [1, 0] },
  // whole-cube rotations (x follows R, y follows U, z follows F)
  x: { dir: VIEW.R, layers: [1, 0, -1] },
  y: { dir: VIEW.U, layers: [1, 0, -1] },
  z: { dir: VIEW.F, layers: [1, 0, -1] },
};
// "Rw" wide notation is an alias for lowercase "r", etc.
for (const fc of ["U", "D", "L", "R", "F", "B"])
  TURN[fc + "w"] = TURN[fc.toLowerCase()];

// Middle slices and the face whose direction they follow.
export const SLICES = { M: "L", E: "D", S: "F" };

// The six face letters, in viewer-frame order (used by the scrambler).
export const LETTERS = Object.keys(VIEW);
