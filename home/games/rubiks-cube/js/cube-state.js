/* =====================================================================
   cube-state.js — turn six scanned faces into an exact cube state.

   Pure logic (no three.js) so it can be unit-tested in Node
   (scripts/verify-scan.mjs). Facelets are labelled by face letter
   (U D R L F B) — the colour the scanner classified each sticker as.

   Coordinate frame matches game.js: +y = U(white), -y = D(yellow),
   +x = R(red), -x = L(orange), +z = F(green), -z = B(blue).
   ===================================================================== */

export const FACES = ["U", "D", "R", "L", "F", "B"];

// Face letter -> outward unit direction (solved frame).
export const DIR = {
  U: [0, 1, 0], D: [0, -1, 0],
  R: [1, 0, 0], L: [-1, 0, 0],
  F: [0, 0, 1], B: [0, 0, -1],
};
// Sticker colours (hex) used by the game — the scanner classifies to these.
export const FACE_HEX = {
  U: 0xf7f4ec, D: 0xf4c95d, R: 0xf07a7a,
  L: 0xf0a868, F: 0x7cc47c, B: 0x6fb7e8,
};

const dirFace = (v) => FACES.find((f) => DIR[f].every((c, i) => c === v[i]));
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const key = (v) => v.join(",");

/* ---- integer 3x3 matrices + the 24 cube rotations ------------------ */
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const mul = (A, B) =>
  A.map((r) => B[0].map((_, j) => Math.round(r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])));
export const applyM = (M, v) =>
  M.map((r) => Math.round(r[0] * v[0] + r[1] * v[1] + r[2] * v[2]));
function rot(a, qt) {
  const th = (qt * Math.PI) / 2, c = Math.round(Math.cos(th)), s = Math.round(Math.sin(th));
  const [x, y, z] = a;
  return [
    [c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s],
    [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s],
    [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)],
  ].map((r) => r.map(Math.round));
}
export const ROT24 = (() => {
  const seen = new Set(), out = [], stack = [I3];
  const gens = [rot([1, 0, 0], 1), rot([0, 1, 0], 1)];
  while (stack.length) {
    const M = stack.pop(), k = M.flat().join();
    if (seen.has(k)) continue;
    seen.add(k); out.push(M);
    for (const g of gens) stack.push(mul(g, M));
  }
  return out;
})();

/* ---- the guided six-face scan ------------------------------------- */
// Each capture: which centre faces the camera, and which colour points to
// the TOP of the frame. (n,u) fully fix the orientation, so the 3×3 grid
// maps deterministically to cube positions. Pick a natural "white up,
// green front" grip that the user rotates through.
export const HOLDS = [
  { center: "F", up: "U", instr: "Green centre facing you, White on top." },
  { center: "R", up: "U", instr: "Turn left: Red centre facing you, White on top." },
  { center: "B", up: "U", instr: "Turn left: Blue centre facing you, White on top." },
  { center: "L", up: "U", instr: "Turn left: Orange centre facing you, White on top." },
  { center: "U", up: "B", instr: "Tilt down: White (top) facing you, Blue on top." },
  { center: "D", up: "F", instr: "Tilt up twice: Yellow (bottom) facing you, Green on top." },
];

// For a capture, the 9 grid cells (row 0=top→2=bottom, col 0=left→2=right)
// map to { pos, dir }. Camera looks along -n; image-right r = u × n.
export function cellTargets(hold) {
  const n = DIR[hold.center], u = DIR[hold.up], r = cross(u, n);
  const cells = [];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const pos = [0, 1, 2].map(
        (i) => n[i] + (1 - row) * u[i] + (col - 1) * r[i]
      );
      cells.push({ pos, dir: n.slice() });
    }
  return cells;
}

/* ---- assemble + validate ------------------------------------------ */
// grids: array of 6 arrays of 9 face-letter labels (row-major), aligned to
// HOLDS. Returns observed: Map posKey -> { dirKey -> label }.
export function gridsToObserved(grids) {
  const observed = new Map();
  HOLDS.forEach((hold, gi) => {
    const cells = cellTargets(hold);
    cells.forEach((cell, ci) => {
      const pk = key(cell.pos);
      if (!observed.has(pk)) observed.set(pk, {});
      observed.get(pk)[key(cell.dir)] = grids[gi][ci];
    });
  });
  return observed;
}

// All 26 outer positions in the canonical order game.js builds them.
export function outerPositions() {
  const out = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (!x && !y && !z) continue;
        out.push([x, y, z]);
      }
  return out;
}
const solvedStickers = (home) =>
  home.map((c, i) => (c !== 0 ? { dir: [0, 0, 0].map((_, j) => (j === i ? c : 0)), face: dirFace([0, 0, 0].map((_, j) => (j === i ? c : 0))) } : null)).filter(Boolean);

/* ---- facelet string (Kociemba/cubejs order: U R F D L B) -------------
   Each face is read top→bottom, left→right as in the standard unfolded net.
   `up`/`right` are the world directions of the reading's up and right axes;
   cell (row,col) → cubie position = n + (1-row)*up + (col-1)*right, dir = n. */
const FACE_READ = {
  U: { n: DIR.U, up: DIR.B, right: DIR.R }, // looking down, back at top
  R: { n: DIR.R, up: DIR.U, right: DIR.B },
  F: { n: DIR.F, up: DIR.U, right: DIR.R },
  D: { n: DIR.D, up: DIR.F, right: DIR.R }, // looking up, front at top
  L: { n: DIR.L, up: DIR.U, right: DIR.F },
  B: { n: DIR.B, up: DIR.U, right: DIR.L },
};
const add3 = (...vs) => [0, 1, 2].map((i) => vs.reduce((s, v) => s + v[i], 0));
const scale = (v, k) => v.map((c) => c * k);

// Build the 54-char facelet string from reconstruct-style targets.
export function toFacelets(targets) {
  // colour label at (position, outward-dir)
  const at = new Map();
  for (const t of targets)
    for (const s of solvedStickers(t.home)) {
      const wdir = applyM(t.rot, s.dir);
      at.set(key(t.pos) + "|" + key(wdir), s.face);
    }
  let out = "";
  for (const f of ["U", "R", "F", "D", "L", "B"]) {
    const { n, up, right } = FACE_READ[f];
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        const pos = add3(n, scale(up, 1 - row), scale(right, col - 1));
        out += at.get(key(pos) + "|" + key(n)) || "?";
      }
  }
  return out;
}

// Validate a finished scan. Returns { ok, error }.
export function validate(grids) {
  const counts = {};
  for (const g of grids) for (const lab of g) counts[lab] = (counts[lab] || 0) + 1;
  for (const f of FACES)
    if (counts[f] !== 9)
      return { ok: false, error: `Saw ${counts[f] || 0} ${f} stickers (need 9). Re-scan.` };
  // centres (index 4 of each grid) must read as their own face
  for (let i = 0; i < HOLDS.length; i++)
    if (grids[i][4] !== HOLDS[i].center)
      return { ok: false, error: `Centre of the ${HOLDS[i].center} face misread. Re-scan that face.` };
  return { ok: true };
}

// Reconstruct the cube: for every outer slot, identify which solved piece
// sits there and its orientation. Returns { ok, error, targets } where each
// target = { home:[x,y,z], pos:[x,y,z], rot: 3x3 matrix }. `home` is the
// piece's solved slot (so game.js can match it to the right cubie); `pos`+`rot`
// place it as scanned.
export function reconstruct(grids) {
  const v = validate(grids);
  if (!v.ok) return v;
  const observed = gridsToObserved(grids);
  const targets = [];
  const usedHome = new Set();
  for (const pos of outerPositions()) {
    const obs = observed.get(key(pos));
    if (!obs) return { ok: false, error: "Scan is missing a sticker — re-scan." };
    const obsList = Object.entries(obs).map(([dk, label]) => ({
      dir: dk.split(",").map(Number),
      label,
    }));
    // the solved piece with this colour set
    const labelSet = obsList.map((o) => o.label).sort().join("");
    const home = outerPositions().find(
      (h) => solvedStickers(h).map((s) => s.face).sort().join("") === labelSet
    );
    if (!home || usedHome.has(key(home)))
      return { ok: false, error: "Scanned colours don't form a real cube — re-scan." };
    // rotation R mapping each solved sticker dir to the observed dir of the
    // same colour
    const solved = solvedStickers(home);
    const R = ROT24.find((M) =>
      solved.every((s) => {
        const want = obsList.find((o) => o.label === s.face);
        return want && key(applyM(M, s.dir)) === key(want.dir);
      })
    );
    if (!R) return { ok: false, error: "A piece is twisted impossibly — re-scan." };
    usedHome.add(key(home));
    targets.push({ home, pos: pos.slice(), rot: R });
  }
  // parity / solvability: a real scramble has even total permutation parity
  if (!isSolvable(targets))
    return { ok: false, error: "That state isn't solvable — a sticker was misread. Re-scan.", targets };
  return { ok: true, targets };
}

// A scanned cube is solvable iff corner-twist sums to 0 (mod 3), edge-flip
// sums to 0 (mod 2), and corner/edge permutation parities agree.
export function isSolvable(targets) {
  const corners = targets.filter((t) => nz(t.home) === 3);
  const edges = targets.filter((t) => nz(t.home) === 2);
  for (const t of [...corners, ...edges]) if (det(t.rot) !== 1) return false;
  let twist = 0;
  for (const t of corners) twist += cornerTwist(t);
  if (twist % 3 !== 0) return false;
  let flip = 0;
  for (const t of edges) flip += edgeFlip(t);
  if (flip % 2 !== 0) return false;
  return permParity(corners, 3) === permParity(edges, 2);
}
const nz = (h) => h.filter((c) => c !== 0).length;
const det = (M) =>
  M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
  M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
  M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
const axisOf = (v) => v.findIndex((c) => c !== 0);

// 120° right-hand rotation about the outward body diagonal d=(±1,±1,±1)
// (integer octahedral rotation). Used to measure corner twist consistently.
function diagRot(d) {
  // R_ij = (-δ_ij + [d]×_ij + d_i d_j) / 2
  const cx = [
    [0, -d[2], d[1]],
    [d[2], 0, -d[0]],
    [-d[1], d[0], 0],
  ];
  return [0, 1, 2].map((i) =>
    [0, 1, 2].map((j) => ((i === j ? -1 : 0) + cx[i][j] + d[i] * d[j]) / 2)
  );
}
// twist 0/1/2: how many diagonal turns bring the U/D sticker back to the y axis
function cornerTwist(t) {
  const s = solvedStickers(t.home).find((x) => x.face === "U" || x.face === "D");
  let w = applyM(t.rot, s.dir);
  const C = diagRot(t.pos);
  for (let k = 0; k < 3; k++) {
    if (axisOf(w) === 1) return k;
    w = applyM(C, w);
  }
  return 0;
}
// flip 0/1 (R,L,U,D,F2,B2 scheme): the piece's reference sticker is its U/D
// colour (or F/B colour for an E-slice piece). The edge is "good" when that
// reference sticker lies on the slot's reference axis — y for a U/D-layer
// slot, z for an E-slice slot. This parity is invariant under every move.
function edgeFlip(t) {
  const sts = solvedStickers(t.home);
  const ref =
    sts.find((s) => s.face === "U" || s.face === "D") ||
    sts.find((s) => s.face === "F" || s.face === "B");
  const w = applyM(t.rot, ref.dir);
  const slotAxis = t.pos[1] !== 0 ? 1 : 2;
  return w[slotAxis] !== 0 ? 0 : 1;
}
// parity of the slot→piece permutation for pieces of a given type
function permParity(group, n) {
  const homes = outerPositions().filter((h) => nz(h) === n);
  const idx = new Map(homes.map((h, i) => [key(h), i]));
  const sigma = new Array(homes.length);
  for (const t of group) sigma[idx.get(key(t.pos))] = idx.get(key(t.home));
  const seen = new Array(sigma.length).fill(false);
  let par = 0;
  for (let i = 0; i < sigma.length; i++) {
    if (seen[i]) continue;
    let len = 0, j = i;
    while (!seen[j]) { seen[j] = true; j = sigma[j]; len++; }
    if (len % 2 === 0) par ^= 1;
  }
  return par;
}
