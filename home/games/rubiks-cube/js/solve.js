/* =====================================================================
   solve.js — dependency-free beginner (layer-by-layer) solver.

   Input: cube-state.reconstruct() targets. Output: a move list a learner can
   follow on their real cube. Method:
     z2 (white centre to the bottom) → white cross → first-layer corners →
     middle edges → last layer (orient, then permute).

   The first two layers are solved DETERMINISTICALLY — the same case logic a
   human uses (bring the piece to the top, line it up, insert it with a short
   known algorithm), so every state solves in milliseconds. The last layer is
   solved by whole verified algorithms (beginner 3-step or OLL/PLL).
   Validated in scripts/verify-methods.mjs and scripts/test-ll.mjs.
   ===================================================================== */

import { DIR, FACES, applyM } from "./cube-state.js";
import { ALGO_MODULES } from "./algs.js";

const FACE_OF = {};
for (const f of FACES) FACE_OF[DIR[f].join(",")] = f;

// face letter → sticker colour name (matches constants.js FACE_COLORS)
const COLOR_NAME = { U: "white", D: "yellow", R: "red", L: "orange", F: "green", B: "blue" };

const mul = (A, B) =>
  A.map((r) => B[0].map((_, j) => Math.round(r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])));
function rotM(a, qt) {
  const th = (qt * Math.PI) / 2, c = Math.round(Math.cos(th)), s = Math.round(Math.sin(th));
  const [x, y, z] = a;
  return [
    [c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s],
    [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s],
    [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)],
  ].map((r) => r.map(Math.round));
}
const eqv = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const meq = (A, B) => eqv(A[0], B[0]) && eqv(A[1], B[1]) && eqv(A[2], B[2]);
const Z2 = rotM([0, 0, 1], 2);

/* ---- move algebra: faces, slices, wide turns, rotations ---- */
const V = DIR;
const TURN = {
  U: { d: V.U, l: [1] }, D: { d: V.D, l: [1] }, L: { d: V.L, l: [1] },
  R: { d: V.R, l: [1] }, F: { d: V.F, l: [1] }, B: { d: V.B, l: [1] },
  M: { d: V.L, l: [0] }, E: { d: V.D, l: [0] }, S: { d: V.F, l: [0] },
  u: { d: V.U, l: [1, 0] }, d: { d: V.D, l: [1, 0] }, l: { d: V.L, l: [1, 0] },
  r: { d: V.R, l: [1, 0] }, f: { d: V.F, l: [1, 0] }, b: { d: V.B, l: [1, 0] },
  x: { d: V.R, l: [1, 0, -1] }, y: { d: V.U, l: [1, 0, -1] }, z: { d: V.F, l: [1, 0, -1] },
};
for (const fc of ["U", "D", "L", "R", "F", "B"]) TURN[fc + "w"] = TURN[fc.toLowerCase()];
const MOVE_RE = /(Uw|Dw|Lw|Rw|Fw|Bw|[UDLRFBMESxyzudlrfb])(['2]?)/g;

/* ---- solve-time budget (safety net) ----
   The solver is deterministic and bounded, so this should never fire. It's
   kept as a guard: if a malformed state ever sends a routine spinning, the
   ABORT throw turns it into a clean null and the UI falls back to the Fast
   (Kociemba) route instead of freezing the click handler. */
const ABORT = Symbol("solve-abort");
const SOLVE_BUDGET_MS = 4000;
let DEADLINE = 0;
let _tickN = 0;
function tick() {
  if ((++_tickN & 4095) === 0 && DEADLINE && Date.now() > DEADLINE) throw ABORT;
}

function makeState(targets) {
  return {
    m: targets.map((t) => ({ home: t.home.slice(), pos: t.pos.slice(), O: t.rot.map((r) => r.slice()) })),
    sol: [],
    // G — the cube's orientation frame. Whole-cube rotations (x/y/z) update
    // it, so "solved" can be judged in whatever frame the cube is held.
    G: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  };
}
function turn(st, base, mod = "") {
  const t = TURN[base];
  const prime = mod === "'", double = mod === "2";
  const qt = double ? 2 : prime ? 1 : -1;
  const Rm = rotM(t.d, qt);
  for (const p of st.m)
    if (t.l.includes(p.pos[0] * t.d[0] + p.pos[1] * t.d[1] + p.pos[2] * t.d[2])) {
      p.pos = applyM(Rm, p.pos);
      p.O = mul(Rm, p.O);
    }
  if (t.l.length === 3) st.G = mul(Rm, st.G); // whole-cube rotation
  st.sol.push(base + mod);
}
function alg(st, str) {
  MOVE_RE.lastIndex = 0;
  let m;
  while ((m = MOVE_RE.exec(str))) turn(st, m[1], m[2]);
}
const cloneState = (st) => ({
  m: st.m.map((p) => ({ home: p.home, pos: p.pos.slice(), O: p.O.map((r) => r.slice()) })),
  sol: [],
  G: st.G, // replaced (never mutated) on rotation, so sharing is safe
});

/* ---- queries (frame: after z2, white centre on -y / bottom) ---- */
function colorsOf(p) {
  const c = [];
  for (let i = 0; i < 3; i++)
    if (p.home[i] !== 0) { const d = [0, 0, 0]; d[i] = p.home[i]; c.push(FACE_OF[d.join(",")]); }
  return c;
}
const nz = (p) => p.home.filter((v) => v !== 0).length;
const isWhite = (p) => colorsOf(p).includes("U");
// solved (post-z2) position/orientation of a piece — fixed-frame versions,
// kept for the test exports
const solPos = (home) => applyM(Z2, home);
const solved1 = (p) => eqv(p.pos, solPos(p.home)) && meq(p.O, Z2);
// frame-aware versions: judge "solved" in the cube's current orientation, so
// the solver may rotate the cube (y) to keep every algorithm on the front
const solPosIn = (st, home) => applyM(st.G, home);
const solvedIn = (st, p) => eqv(p.pos, solPosIn(st, p.home)) && meq(p.O, st.G);
function isSolvedFaces(st) {
  for (const f of FACES) {
    const wd = DIR[f]; let col = null;
    for (const p of st.m)
      for (let i = 0; i < 3; i++)
        if (p.home[i]) {
          const d = [0, 0, 0]; d[i] = p.home[i];
          if (eqv(applyM(p.O, d), wd)) {
            const lab = FACE_OF[d.join(",")];
            if (col === null) col = lab; else if (col !== lab) return false;
          }
        }
  }
  return true;
}

/* ---- deterministic first two layers ----
   No brute-force search: each piece is handled with the same case logic a
   human uses — bring it to the top layer, line it up, insert it with a short
   known algorithm. Every branch is bounded, so a full solve is always a few
   milliseconds and never falls back to the Fast route. */

const homeKey = (p) => p.home.join();
const byHome = (st, hk) => st.m.find((p) => p.home.join() === hk);
const INV = { "": "'", "'": "", "2": "2" };

// world direction of a piece's white (home-U) sticker
function whiteDir(p) {
  for (let i = 0; i < 3; i++)
    if (p.home[i]) {
      const d = [0, 0, 0]; d[i] = p.home[i];
      if (FACE_OF[d.join(",")] === "U") return applyM(p.O, d);
    }
  return null;
}
// the face whose direction is the horizontal part of pos (one nonzero axis)
const sideFaceOf = (v) => FACE_OF[[v[0], 0, v[2]].join(",")];

// Self-checking move chooser: try mods in order on a clone, keep the first
// whose outcome satisfies pred(cloneState, trackedPiece). Returns the mod
// used (so callers can undo it) or null.
function pickTurn(st, face, mods, hk, pred) {
  for (const mod of mods) {
    const c = cloneState(st);
    turn(c, face, mod);
    if (pred(c, byHome(c, hk))) { turn(st, face, mod); return mod; }
  }
  return null;
}

/* Whole-cube y rotations bring the working piece to the FRONT, so a learner
   following along always watches the same front-face algorithms — exactly how
   the beginner method is taught ("hold the cube so the piece faces you"). */
const Y_ROT = rotM(DIR.U, -1); // matches turn(st, "y")
function yRotateUntil(st, v0, want) {
  let v = v0;
  for (let r = 0; r < 4; r++) {
    if (v[0] === want[0] && v[2] === want[2]) {
      if (r) turn(st, "y", r === 2 ? "2" : r === 3 ? "'" : "");
      return true;
    }
    v = applyM(Y_ROT, v);
  }
  return false;
}
// rotate the cube so this column sits at front-right / this face faces you
const bringColToFR = (st, v) => yRotateUntil(st, [v[0], 0, v[2]], [1, 0, 1]);
const bringFaceFront = (st, f) => yRotateUntil(st, DIR[f], [0, 0, 1]);

/* ---- cross (CFOP): place each white edge case by case ---- */
function placeCrossEdge(st, hk) {
  for (let guard = 0; guard < 5; guard++) {
    const p = byHome(st, hk);
    if (solvedIn(st, p)) return true;
    const w = whiteDir(p);
    if (p.pos[1] === -1) {
      // bottom (wrong slot or flipped): a double turn lifts it to the top
      turn(st, sideFaceOf(p.pos), "2");
    } else if (p.pos[1] === 0) {
      // E slice: turn the side face the white sticker does NOT touch so the
      // edge lands on top white-up, park it with U2, restore that face
      const A = FACE_OF[w.join(",")];
      const B = FACE_OF[p.pos.map((c, i) => (DIR[A][i] !== 0 ? 0 : c)).join(",")];
      const d = pickTurn(st, B, ["", "'"], hk,
        (c, q) => q.pos[1] === 1 && whiteDir(q)[1] === 1);
      if (d == null) return false;
      turn(st, "U", "2");
      turn(st, B, INV[d]);
    } else if (w[1] === 1) {
      // top, white up: line it up over its slot, drop it with a double turn
      const t = solPosIn(st, p.home);
      if (p.pos[0] !== t[0] || p.pos[2] !== t[2]) {
        if (pickTurn(st, "U", ["", "'", "2"], hk,
          (c, q) => q.pos[0] === t[0] && q.pos[2] === t[2]) == null) return false;
      }
      turn(st, sideFaceOf(t), "2");
    } else {
      // top, white sideways: borrow the face it's stuck on to reach the E
      // slice, lift white-up from there, then restore the borrowed face
      const A = FACE_OF[w.join(",")];
      turn(st, A);
      const q1 = byHome(st, hk);
      const B = FACE_OF[q1.pos.map((c, i) => (DIR[A][i] !== 0 ? 0 : c)).join(",")];
      const d = pickTurn(st, B, ["", "'"], hk,
        (c, q) => q.pos[1] === 1 && whiteDir(q)[1] === 1);
      if (d == null) return false;
      turn(st, "U", "2"); // off both borrowed columns
      turn(st, B, INV[d]);
      turn(st, A, "'");
    }
  }
  return solvedIn(st, byHome(st, hk));
}

/* ---- CFOP cross: BFS over the 4 white-edge state space (≤ 8 moves) ----
   State = 4-tuple of (slotIndex, whiteDirIndex) per edge, packed as ints.
   A precomputed move table maps each (edgeCode, moveIndex) → newEdgeCode so
   each BFS transition is just 4 array lookups — no Three.js / clone overhead.
   Visiting ≤ 331,776 unique states at ~200 ops each stays well under 50 ms. */

const _CROSS_SLOTS = [
  [0,1,1],[0,1,-1],[-1,1,0],[1,1,0],
  [0,-1,1],[0,-1,-1],[-1,-1,0],[1,-1,0],
  [-1,0,1],[1,0,1],[-1,0,-1],[1,0,-1],
];
const _CROSS_DIRS = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const _SLOT_IDX = new Map(_CROSS_SLOTS.map((s, i) => [s.join(), i]));
const _DIR_IDX  = new Map(_CROSS_DIRS.map((d, i) => [d.join(), i]));

// 18 face moves used in the cross BFS
const _CROSS_MOVE_LIST = [
  ["U",""],["U","'"],["U","2"],
  ["D",""],["D","'"],["D","2"],
  ["F",""],["F","'"],["F","2"],
  ["B",""],["B","'"],["B","2"],
  ["L",""],["L","'"],["L","2"],
  ["R",""],["R","'"],["R","2"],
];

// Lazy-built move table: _edgeTbl[moveIdx][edgeCode] = newEdgeCode.
// edgeCode = slotIdx*6 + dirIdx (0..71).
let _edgeTbl = null;
function _buildEdgeTbl() {
  if (_edgeTbl) return _edgeTbl;
  _edgeTbl = _CROSS_MOVE_LIST.map(([base, mod]) => {
    const t = TURN[base];
    const qt = mod === "2" ? 2 : mod === "'" ? 1 : -1;
    const Rm = rotM(t.d, qt);
    return Array.from({ length: 72 }, (_, code) => {
      const si = (code / 6) | 0, di = code % 6;
      const s = _CROSS_SLOTS[si];
      if (!t.l.includes(s[0]*t.d[0] + s[1]*t.d[1] + s[2]*t.d[2])) return code;
      const nsi = _SLOT_IDX.get(applyM(Rm, s).join());
      const ndi = _DIR_IDX.get(applyM(Rm, _CROSS_DIRS[di]).join());
      return nsi * 6 + ndi;
    });
  });
  return _edgeTbl;
}

function _edgeCode(p) {
  const si = _SLOT_IDX.get(p.pos.join());
  const wd = whiteDir(p);
  const di = wd ? _DIR_IDX.get(wd.join()) : undefined;
  return (si ?? 0) * 6 + (di ?? 0);
}

// pack 4 edge codes (0..71 each) into one int — fast Map key, no strings
const _packCodes = (c) => ((c[0] * 72 + c[1]) * 72 + c[2]) * 72 + c[3];
// inverse move index: list is [X, X', X2] triplets → swap the first two
const _invMove = (mi) => (mi % 3 === 0 ? mi + 1 : mi % 3 === 1 ? mi - 1 : mi);
// face index of a move; faces are ordered U,D,F,B,L,R → opposites pair up 2k/2k+1
const _moveFace = (mi) => (mi / 3) | 0;
// prune: never repeat a face, and force commuting opposite faces (U D vs D U)
// into one canonical order — both cut the tree without losing any optimum
const _prunedMove = (lastFace, mi) => {
  const f = _moveFace(mi);
  if (f === lastFace) return true;
  return (f ^ 1) === lastFace && lastFace > f; // opposite pair, wrong order
};
const _CROSS_NODE_CAP = 250000; // bail to the greedy fallback past this

// greedy case-by-case fallback (the original method) — instant, 8-14 moves
function solveCrossGreedy(st) {
  const edges = st.m.filter((q) => nz(q) === 2 && isWhite(q));
  for (let pass = 0; pass < 6; pass++) {
    const open = edges.find((q) => !solvedIn(st, q));
    if (!open) return true;
    if (!placeCrossEdge(st, homeKey(open))) return false;
  }
  return edges.every((q) => solvedIn(st, q));
}

function solveCross(st) {
  const edges = st.m.filter((q) => nz(q) === 2 && isWhite(q));
  if (edges.every((q) => solvedIn(st, q))) return true;

  const tbl = _buildEdgeTbl();
  const sorted = edges.slice().sort((a, b) => homeKey(a).localeCompare(homeKey(b)));
  const startCodes = sorted.map((e) => _edgeCode(byHome(st, homeKey(e))));
  // Goal: each edge at its post-z2 solved slot, white sticker facing -y (dirIdx 3)
  const goalCodes = sorted.map((e) => {
    const sp = solPosIn(st, e.home);
    return (_SLOT_IDX.get(sp.join()) ?? 0) * 6 + 3;
  });

  const startKey = _packCodes(startCodes);
  const goalKey = _packCodes(goalCodes);
  if (startKey === goalKey) return true;

  // Bidirectional BFS — an optimal cross is ≤ 8 HTM, so ≤ 4 levels per side.
  // visited maps packedKey → { parent: packedKey, mi: moveIdx } (null at roots).
  const visF = new Map([[startKey, null]]);
  const visB = new Map([[goalKey, null]]);
  let frontF = [[startCodes, startKey, -1]];
  let frontB = [[goalCodes, goalKey, -1]];
  let expanded = 0;

  // moves start→meet (walk the forward tree up, prepending)
  const forwardPath = (key) => {
    const path = [];
    for (let e = visF.get(key); e; e = visF.get(key)) {
      path.unshift(e.mi);
      key = e.parent;
    }
    return path;
  };
  // moves meet→goal (walk the backward tree up, inverting each move)
  const backwardPath = (key) => {
    const path = [];
    for (let e = visB.get(key); e; e = visB.get(key)) {
      path.push(_invMove(e.mi));
      key = e.parent;
    }
    return path;
  };
  const applyPath = (mis) => {
    for (const mi of mis) {
      const [b, m] = _CROSS_MOVE_LIST[mi];
      turn(st, b, m);
    }
    return true;
  };

  for (let depth = 0; depth < 8; depth++) {
    tick();
    // expand the smaller frontier — keeps both trees balanced and tiny
    const fwd = frontF.length <= frontB.length;
    const [front, mine, other] = fwd ? [frontF, visF, visB] : [frontB, visB, visF];
    const next = [];
    for (const [codes, curKey, lastFace] of front)
      for (let mi = 0; mi < 18; mi++) {
        if (_prunedMove(lastFace, mi)) continue;
        if (++expanded > _CROSS_NODE_CAP) return solveCrossGreedy(st);
        const nc = [tbl[mi][codes[0]], tbl[mi][codes[1]], tbl[mi][codes[2]], tbl[mi][codes[3]]];
        const k = _packCodes(nc);
        if (mine.has(k)) continue;
        mine.set(k, { parent: curKey, mi });
        if (other.has(k)) return applyPath([...forwardPath(k), ...backwardPath(k)]);
        next.push([nc, k, _moveFace(mi)]);
      }
    if (fwd) frontF = next; else frontB = next;
  }
  return solveCrossGreedy(st); // unreachable on a legal cube (crosses are ≤ 8)
}

/* ---- beginner cross: the DAISY method ----
   1) Gather all four white edges on top with white facing up, around the
      yellow centre — the "daisy". 2) Turn the top until each petal sits over
      its matching centre, then drop it with F2. The cube is y-rotated first
      each time, so every move is made on the FRONT face. */
const isPetal = (q) => q.pos[1] === 1 && whiteDir(q)[1] === 1;
const atTopFront = (q) => q.pos[0] === 0 && q.pos[1] === 1 && q.pos[2] === 1;

// turn the top so no white edge occupies U-F (possible while petals ≤ 3)
function freeTopFront(st) {
  const blocked = (cs) =>
    cs.m.some((q) => nz(q) === 2 && isWhite(q) && atTopFront(q));
  if (!blocked(st)) return true;
  for (const mod of ["", "'", "2"]) {
    const c = cloneState(st);
    turn(c, "U", mod);
    if (!blocked(c)) { turn(st, "U", mod); return true; }
  }
  return false;
}

// bring one white edge up into the daisy (front-face moves only)
function daisyLift(st, hk) {
  for (let guard = 0; guard < 6; guard++) {
    const p = byHome(st, hk);
    if (isPetal(p)) return true;
    const w = whiteDir(p);
    if (p.pos[1] === -1) {
      // bottom: face it, clear the landing spot, F2 lifts it to the top
      bringFaceFront(st, sideFaceOf(p.pos));
      if (!freeTopFront(st)) return false;
      turn(st, "F", "2");
    } else if (p.pos[1] === 0) {
      // E slice: face the side the white sticker does NOT touch — one F turn
      // then lands it on top with white up
      const A = FACE_OF[w.join(",")];
      const B = FACE_OF[p.pos.map((c, i) => (DIR[A][i] !== 0 ? 0 : c)).join(",")];
      bringFaceFront(st, B);
      if (!freeTopFront(st)) return false;
      if (pickTurn(st, "F", ["", "'"], hk,
        (c, q) => q.pos[1] === 1 && whiteDir(q)[1] === 1) == null) return false;
    } else {
      // top but white sideways: face it and drop it into the E slice first
      bringFaceFront(st, FACE_OF[w.join(",")]);
      turn(st, "F");
    }
  }
  return isPetal(byHome(st, hk));
}

// spin a petal over its matching centre and drop it home with F2
function daisyDrop(st, hk) {
  const t0 = solPosIn(st, byHome(st, hk).home);
  bringFaceFront(st, sideFaceOf(t0));
  const p = byHome(st, hk);
  if (!atTopFront(p)) {
    if (pickTurn(st, "U", ["", "'", "2"], hk, (c, q) => atTopFront(q)) == null)
      return false;
  }
  turn(st, "F", "2");
  return solvedIn(st, byHome(st, hk));
}

function solveCrossDaisy(st) {
  const edges = st.m.filter((q) => nz(q) === 2 && isWhite(q));
  // 1) the daisy — lift every white edge (even pre-solved ones, so no lift
  //    can disturb a kept edge below)
  for (let pass = 0; pass < 10; pass++) {
    const open = edges.find((q) => !isPetal(q));
    if (!open) break;
    if (!daisyLift(st, homeKey(open))) return false;
  }
  if (edges.some((q) => !isPetal(q))) return false;
  // 2) drop each petal down onto its matching centre
  for (const e of edges) if (!daisyDrop(st, homeKey(e))) return false;
  return edges.every((q) => solvedIn(st, q));
}

/* ---- first-layer corners: park above the slot, repeat the trigger ----
   Exactly as taught: turn the top until the corner floats directly above its
   home, hold it at the front-right, then repeat R U R' U' until it drops in
   solved (1–5 repeats depending on how it's twisted). */

// lift a buried corner to the top layer, restoring everything else
function liftCorner(st, hk) {
  let p = byHome(st, hk);
  if (p.pos[1] !== -1) return true;
  if (!bringColToFR(st, p.pos)) return false; // hold it at the front-right
  const d = pickTurn(st, "R", ["", "'"], hk, (c, q) => q.pos[1] === 1);
  if (d == null) return false;
  if (pickTurn(st, "U", ["2", "", "'"], hk, (c, q) => q.pos[0] !== 1) == null)
    return false;
  turn(st, "R", INV[d]);
  return true;
}

function placeCorner(st, hk) {
  if (solvedIn(st, byHome(st, hk))) return true;
  if (!liftCorner(st, hk)) return false;
  // hold the cube so the corner's slot is at the front-right…
  if (!bringColToFR(st, solPosIn(st, byHome(st, hk).home))) return false;
  // …turn the top until the corner sits directly above its slot…
  const p0 = byHome(st, hk);
  if (!(p0.pos[0] === 1 && p0.pos[2] === 1)) {
    if (pickTurn(st, "U", ["", "'", "2"], hk,
      (c, q) => q.pos[0] === 1 && q.pos[2] === 1) == null) return false;
  }
  // …and repeat the trigger until it clicks in solved
  for (let g = 0; g < 6; g++) {
    if (solvedIn(st, byHome(st, hk))) return true;
    alg(st, "R U R' U'");
  }
  return solvedIn(st, byHome(st, hk));
}

function solveCorners(st) {
  const corners = st.m.filter((q) => nz(q) === 3 && isWhite(q));
  for (const c of corners) if (!placeCorner(st, homeKey(c))) return false;
  return corners.every((q) => solvedIn(st, q));
}

/* ---- middle-layer edges: the right insert and its left mirror ----
   The edge goes to the FRONT, then drops right or left, exactly as taught:
     slot to the right →  U R U' R' U' F' U F
     slot to the left  →  U' L' U L U F U' F'
   Both open the slot, drop the edge in, and close it — the first layer
   always comes back untouched. */
const MID_RIGHT = "U R U' R' U' F' U F"; // working slot at the front-right
const MID_LEFT = "U' L' U L U F U' F'"; // mirror — slot at the front-left

// pop an edge stuck in a slot (wrong slot, or right slot flipped) to the top
function popMidEdge(st, hk) {
  const p = byHome(st, hk);
  if (p.pos[1] === 0 && !solvedIn(st, p)) {
    bringColToFR(st, p.pos);
    alg(st, MID_RIGHT);
  }
}

function placeMidEdge(st, hk) {
  if (solvedIn(st, byHome(st, hk))) return true;
  popMidEdge(st, hk);
  // hold the slot at the front-right and try the right insert; if the edge
  // is flipped the other way, hold the slot at the front-LEFT and mirror it
  if (!bringColToFR(st, solPosIn(st, byHome(st, hk).home))) return false;
  let seq = reachBy(st, [MID_RIGHT], (c) => solvedIn(c, byHome(c, hk)), 1);
  if (!seq) {
    turn(st, "y"); // same slot, now at the front-left
    seq = reachBy(st, [MID_LEFT], (c) => solvedIn(c, byHome(c, hk)), 1);
  }
  if (!seq) return false;
  applySeq(st, seq);
  return true;
}

function solveMiddle(st) {
  const mids = st.m.filter((q) => nz(q) === 2 && !isWhite(q) && !colorsOf(q).includes("D"));
  for (const e of mids) if (!placeMidEdge(st, homeKey(e))) return false;
  return mids.every((q) => solvedIn(st, q));
}

/* ---- last layer: try the verified OLL/PLL algorithms ---- */
const OLL_ALGS = [], PLL_ALGS = [];
for (const mod of ALGO_MODULES) {
  if (mod.id === "oll") for (const g of mod.groups) for (const it of g.items) OLL_ALGS.push(it);
  if (mod.id === "pll") for (const g of mod.groups) for (const it of g.items) PLL_ALGS.push(it);
}
// LL is on +y (yellow, after z2). Oriented = every top piece shows yellow (D) up.
function llOriented(st) {
  for (const p of st.m)
    if (p.pos[1] === 1 && nz(p) > 1) {
      let up = null;
      for (let i = 0; i < 3; i++)
        if (p.home[i]) { const d = [0, 0, 0]; d[i] = p.home[i]; if (eqv(applyM(p.O, d), [0, 1, 0])) up = FACE_OF[d.join(",")]; }
      if (up !== "D") return false;
    }
  return true;
}
function applyOLL(st) {
  if (llOriented(st)) { st.ollCase = "OLL skip"; return true; }
  for (let auf = 0; auf < 4; auf++)
    for (const A of OLL_ALGS) {
      const c = cloneState(st);
      for (let k = 0; k < auf; k++) turn(c, "U");
      alg(c, A.moves);
      if (llOriented(c)) {
        for (let k = 0; k < auf; k++) turn(st, "U");
        alg(st, A.moves);
        st.ollCase = A.name;
        return true;
      }
    }
  return false;
}
function applyPLL(st) {
  // "PLL skip": the top may already be permuted — just line it up
  for (let auf = 0; auf < 4; auf++) {
    const c = cloneState(st);
    for (let k = 0; k < auf; k++) turn(c, "U");
    if (isSolvedFaces(c)) {
      for (let k = 0; k < auf; k++) turn(st, "U");
      st.pllCase = "PLL skip";
      return true;
    }
  }
  for (let auf = 0; auf < 4; auf++)
    for (const P of PLL_ALGS)
      for (let auf2 = 0; auf2 < 4; auf2++) {
        const c = cloneState(st);
        for (let k = 0; k < auf; k++) turn(c, "U");
        alg(c, P.moves);
        for (let k = 0; k < auf2; k++) turn(c, "U");
        if (isSolvedFaces(c)) {
          for (let k = 0; k < auf; k++) turn(st, "U");
          alg(st, P.moves);
          for (let k = 0; k < auf2; k++) turn(st, "U");
          st.pllCase = P.name;
          return true;
        }
      }
  return false;
}

/* ---- beginner last layer: cross · edges · corners, taught as 3 steps ----
   Each step uses only whole algorithms (or the R' D' R D commutator loop) that
   restore the finished layers below, so a learner can stop and check the cube
   between phases. The user's beginner order is: yellow cross (orient the LL
   edges) → place the LL edges → place then twist the LL corners. */
function topLabel(p) {
  for (let i = 0; i < 3; i++)
    if (p.home[i]) {
      const d = [0, 0, 0]; d[i] = p.home[i];
      if (eqv(applyM(p.O, d), [0, 1, 0])) return FACE_OF[d.join(",")];
    }
  return null; // centre / non-up sticker
}
const cornerAt = (st, v) => st.m.find((p) => eqv(p.pos, v));
const llEdgePieces = (st) => st.m.filter((p) => p.pos[1] === 1 && nz(p) === 2);
const llCrossDone = (st) => llEdgePieces(st).every((p) => topLabel(p) === "D");
const llEdgesDone = (st) => llEdgePieces(st).every((p) => solvedIn(st, p));
// Corners home AND the edges still solved: the placement search uses AUF to set
// up its 3-cycles, and an unbalanced AUF would rotate the finished edges out of
// place — so we only accept sequences that leave the edges intact too.
const llCornersPlaced = (st) =>
  llEdgesDone(st) &&
  st.m
    .filter((p) => p.pos[1] === 1 && nz(p) === 3)
    .every((p) => eqv(p.pos, solPosIn(st, p.home)));

// BFS the shortest sequence of (AUF, then a whole alg) steps reaching `done`.
// An empty prim "" means "just the AUF" — used so a trailing U can align a layer.
const REACH_MAX_NODES = 200000; // hard cap so an unreachable goal can't OOM
function reachBy(st, prims, done, maxLen) {
  if (done(st)) return [];
  let frontier = [{ c: cloneState(st), seq: [] }];
  let expanded = 0;
  for (let len = 0; len < maxLen; len++) {
    const next = [];
    for (const node of frontier)
      for (let auf = 0; auf < 4; auf++)
        for (const pr of prims) {
          tick();
          if (++expanded > REACH_MAX_NODES) return null;
          const c = cloneState(node.c);
          for (let k = 0; k < auf; k++) turn(c, "U");
          if (pr) alg(c, pr);
          const seq = node.seq.concat([{ auf, pr }]);
          if (done(c)) return seq;
          next.push({ c, seq });
        }
    frontier = next;
  }
  return null;
}
function applySeq(st, seq) {
  for (const s of seq) {
    if (s.auf) turn(st, "U", s.auf === 2 ? "2" : s.auf === 3 ? "'" : "");
    if (s.pr) alg(st, s.pr);
  }
}

const LL_EDGE_FLIP = "F R U R' U' F'"; // turns dot/L/line into the yellow cross
const LL_EDGE_CYCLE = "R U R' U R U2 R'"; // cycles the top edges (yellow stays up)
// cycles 3 top corners around the front-right one; edges and layers stay put
const LL_CORNER_CYCLE = "U R U' L' U R' U' L";
const LL_CORNER_CYCLE_INV = "L' U R U' L U R' U'"; // same cycle, other way

function llCross(st) {
  const seq = reachBy(st, [LL_EDGE_FLIP], llCrossDone, 3);
  if (!seq) return false;
  applySeq(st, seq);
  return true;
}
function llEdges(st) {
  const seq = reachBy(st, ["", LL_EDGE_CYCLE], llEdgesDone, 4);
  if (!seq) return false;
  applySeq(st, seq);
  return true;
}
// Cycle every last-layer corner into its slot (orientation handled next). A
// legal cube with the edges solved leaves an even corner permutation, so
// 3-cycles can always finish it.
function llPlaceCorners(st) {
  const seq = reachBy(st, ["", LL_CORNER_CYCLE, LL_CORNER_CYCLE_INV], llCornersPlaced, 4);
  if (!seq) return false;
  applySeq(st, seq);
  return true;
}
// the face-letter label of the sticker pointing straight DOWN
function downLabel(p) {
  for (let i = 0; i < 3; i++)
    if (p.home[i]) {
      const d = [0, 0, 0]; d[i] = p.home[i];
      if (eqv(applyM(p.O, d), [0, -1, 0])) return FACE_OF[d.join(",")];
    }
  return null;
}
// Twist the (already placed) corners with the SAME trigger the learner used
// for the first layer: flip the cube over (x2) so the yellow corners sit at
// the bottom, hold each wrong corner at the front-right, and repeat
// R U R' U' (in pairs — each pair twists one notch) until its yellow faces
// down. Turn the bottom to bring the next corner. The trigger appears to
// scramble the cube, but the damage cancels exactly as the last corner
// twists home; a final bottom turn lines everything up.
function llOrientCorners(st) {
  // already just an AUF away? (the four U probes cancel in the tidier)
  for (let auf = 0; auf < 4; auf++) {
    if (isSolvedFaces(st)) return true;
    turn(st, "U");
  }
  turn(st, "x", "2"); // flip — yellow face to the bottom
  for (let i = 0; i < 4; i++) {
    let g = 0;
    while (downLabel(cornerAt(st, [1, -1, 1])) !== "D" && g < 3) {
      alg(st, "R U R' U'"); alg(st, "R U R' U'"); g++;
    }
    if (downLabel(cornerAt(st, [1, -1, 1])) !== "D") return false;
    turn(st, "D");
  }
  for (let auf = 0; auf < 4; auf++) { if (isSolvedFaces(st)) return true; turn(st, "D"); }
  return false;
}
function llCorners(st) {
  return llPlaceCorners(st) && llOrientCorners(st);
}

/* ---- F2L: solve each slot as a corner+edge pair (CFOP) ---- */
// Front-right slot F2L primitives. Covering all 41 standard F2L cases as
// single sequences (after AUF) lets reachBy find the right insert at depth 1
// (≤ 80 nodes) instead of grinding 64 k clones at depth 3. Depth 2 catches
// any edge case that genuinely needs a second short move.
const PAIR_PRIMS_FR = [
  // basic half-triggers
  "R U R'", "R U' R'", "R U2 R'",
  "F' U F", "F' U' F", "F' U2 F",
  // white-up cases (7-9 moves, always single-step with AUF)
  "R U' R' U R U2 R'",
  "R U' R' U2 R U' R'",
  "R U2 R' U' R U R'",
  "R U2 R' U2 R U' R'",
  "F' U F U' F' U2 F",
  "F' U F U2 F' U F",
  "F' U2 F U F' U' F",
  "F' U2 F U2 F' U F",
  // separated-pair / tricky-orientation cases
  "R U R' U' R U' R'",
  "R U' R' U' R U' R'",
  "F' U' F U F' U F",
  "F' U F U' F' U F",
  "R U R' U2 F' U' F",
  "F' U' F U2 R U R'",
  "R U' R' U2 F' U F",
  "F' U F U2 R U' R'",
];
// fallback half-trigger set for the rare case no single sequence above fits
const PAIR_PRIMS_BASIC = PAIR_PRIMS_FR.slice(0, 6);

// Solve ONE slot (corner ck + its middle edge) in place: lift/pop strays to
// the top, hold the slot front-right, insert both together (true CFOP pairing).
// The rare pair the case list can't reach is finished corner-then-edge.
function solveOneSlot(st, ck) {
  const c = byHome(st, ck);
  const sp = solPos(c.home); // slot identity (frame-independent home slot)
  const edge = st.m.find(
    (q) =>
      nz(q) === 2 &&
      !isWhite(q) &&
      !colorsOf(q).includes("D") &&
      eqv(solPos(q.home), [sp[0], 0, sp[2]]),
  );
  const ek = edge ? homeKey(edge) : null;
  const pairDone = (cs) =>
    solvedIn(cs, byHome(cs, ck)) && (!ek || solvedIn(cs, byHome(cs, ek)));

  if (pairDone(st)) return true;
  if (!solvedIn(st, byHome(st, ck)) && !liftCorner(st, ck)) return false;
  // Methods without a full cross (ZZ blocks, Roux, Petrus) can leave the mid
  // edge stranded in an UNSOLVED bottom slot. Hoist it out: M slice for the
  // DF/DB slots (those are only free when nothing solved lives there), a
  // quarter turn of the slot's own face for DL/DR (that face is unsolved too).
  if (ek) {
    const ep = byHome(st, ek);
    if (ep.pos[1] === -1) {
      const face = ep.pos[0] === 0 ? "M" : sideFaceOf(ep.pos);
      if (pickTurn(st, face, ["", "'", "2"], ek, (c, q) => q.pos[1] !== -1) == null)
        return false;
    }
  }
  if (ek) popMidEdge(st, ek);
  if (!bringColToFR(st, solPosIn(st, c.home))) return false;
  // depth 1 over the full case list (≈ 90 nodes), then depth 2 over the
  // six half-triggers (≈ 600 nodes) — never the depth-2 full blow-up
  const seq =
    reachBy(st, PAIR_PRIMS_FR, pairDone, 1) ||
    reachBy(st, PAIR_PRIMS_BASIC, pairDone, 2);
  if (seq) applySeq(st, seq);
  if (!pairDone(st)) {
    if (!placeCorner(st, ck)) return false;
    if (ek && !placeMidEdge(st, ek)) return false;
  }
  return true;
}

// Solve the four slots in the CHEAPEST order: each round, try every remaining
// slot on a clone and commit the one that solves in the fewest moves. A good
// slot order regularly saves 5-10 moves over a fixed order.
function solveF2LPhases(st, phases) {
  let remaining = st.m.filter((q) => nz(q) === 3 && isWhite(q)).map(homeKey);
  let slot = 0;
  while (remaining.length) {
    tick();
    let bestKey = null, bestC = null;
    for (const ck of remaining) {
      const c = cloneState(st); // clone records only this slot's moves
      if (!solveOneSlot(c, ck)) continue;
      if (!bestC || c.sol.length < bestC.sol.length) { bestC = c; bestKey = ck; }
    }
    if (!bestC) return false;
    // the slot's two side colours name the case, e.g. "green–red pair"
    const sideColors = colorsOf(byHome(st, bestKey))
      .filter((f) => f !== "U")
      .map((f) => COLOR_NAME[f])
      .join("–");
    st.m = bestC.m;
    st.G = bestC.G;
    st.sol.push(...bestC.sol);
    slot += 1;
    phases.push({
      id: "f2l" + slot,
      label: "F2L pair " + slot,
      caseName: sideColors + " pair",
      detail: PHASE_TEXT.f2l.text,
      algo: PHASE_TEXT.f2l.algo || "",
      why: PHASE_TEXT.f2l.why || "",
      moves: bestC.sol,
    });
    remaining = remaining.filter((k) => k !== bestKey);
  }
  return true;
}

/* =====================================================================
   Generic piece BFS — the engine behind the Roux / ZZ / Petrus openings.
   A piece state is (position, direction of its primary home axis): faithful
   for corners (3 orientations), edges (2) and centres (1). A set of pieces
   is solved by bidirectional BFS over packed codes with per-move tables.
   ===================================================================== */

// the 26 lattice positions, in construction order
const LATTICE = [];
const POS_IDX = new Map();
for (let x = -1; x <= 1; x++)
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++) {
      if (x === 0 && y === 0 && z === 0) continue;
      POS_IDX.set([x, y, z].join(","), LATTICE.length);
      LATTICE.push([x, y, z]);
    }
const DIR6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const DIR6_IDX = new Map(DIR6.map((d, i) => [d.join(","), i]));

// first nonzero home axis = the tracked sticker direction
function primaryAxis(home) {
  for (let i = 0; i < 3; i++)
    if (home[i]) { const v = [0, 0, 0]; v[i] = home[i]; return v; }
  return [0, 1, 0];
}

// move catalogue for the piece BFS: faces + slices, base-major triplets
const PBFS_BASES = ["U", "D", "L", "R", "F", "B", "M", "E", "S"];
const PBFS_MOVES = [];
for (const b of PBFS_BASES) for (const mod of ["", "'", "2"]) PBFS_MOVES.push(b + mod);
const PBFS_INV = (mi) => (mi % 3 === 0 ? mi + 1 : mi % 3 === 1 ? mi - 1 : mi);
// commuting-move pruning: same-axis moves in non-canonical order are skipped
const PBFS_AXIS = { U: 0, D: 0, E: 0, L: 1, R: 1, M: 1, F: 2, B: 2, S: 2 };
const PBFS_ORD = { U: 0, D: 1, E: 2, L: 0, R: 1, M: 2, F: 0, B: 1, S: 2 };
function pbfsPruned(lastMi, mi) {
  if (lastMi < 0) return false;
  const a = PBFS_BASES[(lastMi / 3) | 0], b = PBFS_BASES[(mi / 3) | 0];
  return PBFS_AXIS[a] === PBFS_AXIS[b] && PBFS_ORD[b] <= PBFS_ORD[a];
}

// tbl[moveIdx][code] → newCode, over 26·6 = 156 universal codes
let _pieceTbl = null;
function pieceTbl() {
  if (_pieceTbl) return _pieceTbl;
  _pieceTbl = PBFS_MOVES.map((tok) => {
    const t = TURN[tok.replace(/['2]/g, "")];
    const qt = tok.endsWith("2") ? 2 : tok.endsWith("'") ? 1 : -1;
    const Rm = rotM(t.d, qt);
    return Array.from({ length: 156 }, (_, code) => {
      const pos = LATTICE[(code / 6) | 0];
      const dir = DIR6[code % 6];
      if (!t.l.includes(pos[0] * t.d[0] + pos[1] * t.d[1] + pos[2] * t.d[2])) return code;
      return POS_IDX.get(applyM(Rm, pos).join(",")) * 6 + DIR6_IDX.get(applyM(Rm, dir).join(","));
    });
  });
  return _pieceTbl;
}

const pieceCode = (p) =>
  POS_IDX.get(p.pos.join(",")) * 6 +
  DIR6_IDX.get(applyM(p.O, primaryAxis(p.home)).join(","));
const goalCode = (st, p) =>
  POS_IDX.get(solPosIn(st, p.home).join(",")) * 6 +
  DIR6_IDX.get(applyM(st.G, primaryAxis(p.home)).join(","));

// piece in z2-frame solved position v (frame-independent slot identity)
const bySolvedPos = (st, v) => st.m.find((p) => eqv(solPos(p.home), v));

// closure of reachable codes from the seeds under the move subset — used to
// pack each piece into the smallest radix
function codeClosure(seeds, moveIdxs, tbl) {
  const seen = new Set(seeds);
  const stack = [...seeds];
  while (stack.length) {
    const c = stack.pop();
    for (const mi of moveIdxs) {
      const n = tbl[mi][c];
      if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
  }
  return [...seen];
}

/* Solve `pieces` together with the allowed moves, shortest first (bidirectional
   BFS). Applies the moves to st and returns true, or false if unreachable
   within maxDepth / node cap (callers fall back to the Fast route). */
function bfsPieces(st, pieces, moveNames, { maxDepth = 16, cap = 700000 } = {}) {
  const tbl = pieceTbl();
  const moveIdxs = moveNames.map((n) => PBFS_MOVES.indexOf(n));
  const starts = pieces.map(pieceCode);
  const goals = pieces.map((p) => goalCode(st, p));
  if (starts.every((c, i) => c === goals[i])) return true;

  // per-piece dictionaries: universal code → small index, for tight packing
  const dicts = pieces.map((p, i) => {
    const cl = codeClosure([starts[i], goals[i]], moveIdxs, tbl);
    return new Map(cl.map((c, k) => [c, k]));
  });
  const radix = dicts.map((d) => d.size);
  const mult = radix.map((_, i) => radix.slice(0, i).reduce((a, b) => a * b, 1));
  const pack = (codes) => {
    let k = 0;
    for (let i = 0; i < codes.length; i++) k += dicts[i].get(codes[i]) * mult[i];
    return k;
  };

  const startKey = pack(starts);
  const goalKey = pack(goals);
  const visF = new Map([[startKey, null]]);
  const visB = new Map([[goalKey, null]]);
  let frontF = [[starts, startKey, -1]];
  let frontB = [[goals, goalKey, -1]];
  let expanded = 0;

  const walk = (vis, key, invert) => {
    const path = [];
    for (let e = vis.get(key); e; e = vis.get(key)) {
      if (invert) path.push(PBFS_INV(e.mi));
      else path.unshift(e.mi);
      key = e.parent;
    }
    return path;
  };
  const applyPath = (mis) => {
    for (const mi of mis) {
      const tok = PBFS_MOVES[mi];
      const mod = tok.endsWith("'") ? "'" : tok.endsWith("2") ? "2" : "";
      turn(st, tok.replace(/['2]/g, ""), mod);
    }
    return true;
  };

  for (let depth = 0; depth < maxDepth; depth++) {
    tick();
    const fwd = frontF.length <= frontB.length;
    const [front, mine, other] = fwd ? [frontF, visF, visB] : [frontB, visB, visF];
    const next = [];
    for (const [codes, curKey, lastMi] of front)
      for (const mi of moveIdxs) {
        if (pbfsPruned(lastMi, mi)) continue;
        if (++expanded > cap) return false;
        const nc = codes.map((c) => tbl[mi][c]);
        if (nc.some((c, i) => !dicts[i].has(c))) continue; // outside closure (can't happen, safety)
        const k = pack(nc);
        if (mine.has(k)) continue;
        mine.set(k, { parent: curKey, mi });
        if (other.has(k))
          return applyPath([...walk(visF, k), ...walk(visB, k, true)]);
        next.push([nc, k, mi]);
      }
    if (fwd) frontF = next;
    else frontB = next;
  }
  return false;
}

const MOVES18 = PBFS_MOVES.slice(0, 18); // faces only
const MOVES_RUF = ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2"];
const MOVES_RUM = ["R", "R'", "R2", "U", "U'", "U2", "M", "M'", "M2"];
const MOVES_RUFM = [...MOVES_RUF, "M", "M'", "M2"];
const MOVES_MU = ["M", "M'", "M2", "U", "U'", "U2"];
const MOVES_LRU = ["L", "L'", "L2", "R", "R'", "R2", "U", "U'", "U2"];

/* =====================================================================
   ZZ — EOLine: orient ALL edges + place the DF/DB line edges, by
   bidirectional BFS over (slot-eo bitmask, DF code, DB code).
   ===================================================================== */
const EDGE_SLOTS = LATTICE.filter((v) => v.filter((c) => c !== 0).length === 2);
const EDGE_SLOT_IDX = new Map(EDGE_SLOTS.map((s, i) => [s.join(","), i]));

// per-move slot permutation + eo flip mask (F/B quarter turns flip their face)
let _eoTbls = null;
function eoTbls() {
  if (_eoTbls) return _eoTbls;
  const perms = [], flips = [];
  for (let mi = 0; mi < 18; mi++) {
    const tok = PBFS_MOVES[mi];
    const base = tok.replace(/['2]/g, "");
    const t = TURN[base];
    const qt = tok.endsWith("2") ? 2 : tok.endsWith("'") ? 1 : -1;
    const Rm = rotM(t.d, qt);
    perms.push(
      EDGE_SLOTS.map((s, si) =>
        t.l.includes(s[0] * t.d[0] + s[1] * t.d[1] + s[2] * t.d[2])
          ? EDGE_SLOT_IDX.get(applyM(Rm, s).join(","))
          : si,
      ),
    );
    let mask = 0;
    if ((base === "F" || base === "B") && !tok.endsWith("2"))
      EDGE_SLOTS.forEach((s, si) => {
        if (s[2] === (base === "F" ? 1 : -1)) mask |= 1 << EDGE_SLOT_IDX.get(applyM(Rm, s).join(","));
      });
    flips.push(mask);
  }
  return (_eoTbls = { perms, flips });
}

// codes an edge can hold without ever needing an F/B quarter turn ("good EO")
const _goodSets = new Map();
function eoGoodSet(st, p) {
  const hk = p.home.join(",");
  if (_goodSets.has(hk)) return _goodSets.get(hk);
  const tbl = pieceTbl();
  const eoMoves = [];
  PBFS_MOVES.forEach((tok, mi) => {
    if (mi >= 18) return;
    const base = tok.replace(/['2]/g, "");
    if ((base === "F" || base === "B") && !tok.endsWith("2")) return;
    eoMoves.push(mi);
  });
  const set = new Set(codeClosure([goalCode(st, p)], eoMoves, tbl));
  _goodSets.set(hk, set);
  return set;
}

function solveEOLine(st) {
  const tbl = pieceTbl();
  const { perms, flips } = eoTbls();
  const edges = st.m.filter((p) => nz(p) === 2);
  // current eo bitmask, indexed by slot
  let eo0 = 0;
  for (const p of edges) {
    const si = EDGE_SLOT_IDX.get(p.pos.join(","));
    if (!eoGoodSet(st, p).has(pieceCode(p))) eo0 |= 1 << si;
  }
  const df = bySolvedPos(st, [0, -1, 1]);
  const db = bySolvedPos(st, [0, -1, -1]);
  const s0 = [eo0, pieceCode(df), pieceCode(db)];
  const g0 = [0, goalCode(st, df), goalCode(st, db)];
  const pk = (s) => s[0] * 156 * 156 + s[1] * 156 + s[2];
  const startKey = pk(s0), goalKey = pk(g0);
  if (startKey === goalKey) return true;

  const step = (s, mi) => {
    let eo = 0;
    for (let si = 0; si < 12; si++) if (s[0] & (1 << si)) eo |= 1 << perms[mi][si];
    return [eo ^ flips[mi], tbl[mi][s[1]], tbl[mi][s[2]]];
  };

  const visF = new Map([[startKey, null]]);
  const visB = new Map([[goalKey, null]]);
  let frontF = [[s0, startKey, -1]];
  let frontB = [[g0, goalKey, -1]];
  let expanded = 0;
  const walk = (vis, key, invert) => {
    const path = [];
    for (let e = vis.get(key); e; e = vis.get(key)) {
      if (invert) path.push(PBFS_INV(e.mi));
      else path.unshift(e.mi);
      key = e.parent;
    }
    return path;
  };
  for (let depth = 0; depth < 10; depth++) {
    tick();
    const fwd = frontF.length <= frontB.length;
    const [front, mine, other] = fwd ? [frontF, visF, visB] : [frontB, visB, visF];
    const next = [];
    for (const [s, curKey, lastMi] of front)
      for (let mi = 0; mi < 18; mi++) {
        if (pbfsPruned(lastMi, mi)) continue;
        if (++expanded > 900000) return false;
        const ns = step(s, mi);
        const k = pk(ns);
        if (mine.has(k)) continue;
        mine.set(k, { parent: curKey, mi });
        if (other.has(k)) {
          for (const pmi of [...walk(visF, k), ...walk(visB, k, true)]) {
            const tok = PBFS_MOVES[pmi];
            turn(st, tok.replace(/['2]/g, ""), tok.endsWith("'") ? "'" : tok.endsWith("2") ? "2" : "");
          }
          return true;
        }
        next.push([ns, k, mi]);
      }
    if (fwd) frontF = next;
    else frontB = next;
  }
  return false;
}

/* ---- shared block helpers for the new methods ---- */

// y-rotate the cube back to the canonical post-z2 frame
function realignFrame(st) {
  for (let k = 0; k < 4; k++) {
    if (meq(st.G, Z2)) return true;
    turn(st, "y");
  }
  return meq(st.G, Z2);
}

// the two corner-edge slots on side x (the bottom edges are placed earlier
// by BFS — placeCrossEdge's borrowed-face tricks aren't safe once blocks exist)
function solvePairsOnSide(st, x) {
  for (const z of [1, -1]) {
    const c = bySolvedPos(st, [x, -1, z]);
    if (!solveOneSlot(st, homeKey(c))) return false;
  }
  return true;
}

/* ---- Roux specifics ---- */
const CMLL_ITEMS = (() => {
  const mod = ALGO_MODULES.find((m) => m.id === "roux");
  const grp = mod && mod.groups.find((g) => g.cat.startsWith("CMLL"));
  return grp ? grp.items : [];
})();
const CMLL_NAME = new Map(CMLL_ITEMS.map((it) => [it.moves, it.name]));

// Orient + permute the four top corners, ignoring every edge (Roux CMLL).
// Solved up to a whole-U rotation — the LSE search tracks a corner and
// absorbs the final alignment, so no trailing AUF is needed here.
function solveCMLL(st) {
  const done = (cs) => {
    const tc = cs.m.filter((p) => nz(p) === 3 && solPosIn(cs, p.home)[1] === 1);
    for (let k = 0; k < 4; k++) {
      const c = cloneState(cs);
      for (let j = 0; j < k; j++) turn(c, "U");
      if (tc.every((p) => solvedIn(c, byHome(c, homeKey(p))))) return true;
    }
    return false;
  };
  const seq = reachBy(st, ["", ...CMLL_ITEMS.map((it) => it.moves)], done, 2);
  if (!seq) return false;
  applySeq(st, seq);
  st.cmllCase =
    seq.map((s) => CMLL_NAME.get(s.pr)).filter(Boolean).join(" + ") || "CMLL skip";
  return true;
}

// front pair of the second block (solveOneSlot hoists any buried edge itself)
function rouxSB2(st) {
  return solveOneSlot(st, homeKey(bySolvedPos(st, [1, -1, 1])));
}
const TOK_RE = /^(Uw|Dw|Lw|Rw|Fw|Bw|[UDLRFBMESxyzudlrfb])(['2]?)$/;
const QT = { "": 1, "2": 2, "'": 3 };
const QTOK = { 1: "", 2: "2", 3: "'" };
function simplifyMoves(toks) {
  let list = toks, changed = true;
  while (changed) {
    changed = false;
    const out = [];
    for (const t of list) {
      const prev = out[out.length - 1];
      const a = prev && TOK_RE.exec(prev);
      const b = a && TOK_RE.exec(t);
      if (b && a[1] === b[1]) {
        const q = (QT[a[2]] + QT[b[2]]) % 4;
        out.pop();
        if (q) out.push(b[1] + QTOK[q]);
        changed = true;
      } else out.push(t);
    }
    list = out;
  }
  return list;
}

/* ---- public solve ---- */
export function solve(targets) {
  DEADLINE = Date.now() + SOLVE_BUDGET_MS;
  try {
    const st = makeState(targets);
    turn(st, "z", "2"); // white centre to the bottom
    if (!solveCross(st)) return null;
    if (!solveCorners(st)) return null;
    if (!solveMiddle(st)) return null;
    if (!applyOLL(st)) return null;
    if (!applyPLL(st)) return null;
    if (!isSolvedFaces(st)) return null;
    return simplifyMoves(st.sol);
  } catch (e) {
    if (e === ABORT) return null; // over budget → caller falls back to Fast
    throw e;
  } finally {
    DEADLINE = 0;
  }
}

// What to do · the algorithm · why it works — shown on the step cards and in
// the on-screen caption, so a learner can follow the reasoning, not just the
// moves.
const PHASE_TEXT = {
  daisy: {
    text: "Float all four white edges to the top, white up — the daisy. Line each petal over its matching centre and drop it.",
    algo: "F2",
    why: "Drops a lined-up petal straight down into the white cross.",
  },
  cross: {
    text: "Place the four white edges, white facing down.",
    algo: "shortest route — 8 moves or fewer",
    why: "Computed optimally: no fixed algorithm, just the fewest face turns.",
  },
  corners: {
    text: "Float the corner above its slot, hold it front-right, repeat the trigger.",
    algo: "(R U R' U') ×1–5",
    why: "Each repeat re-drops the corner twisted one notch — stop when white faces down.",
  },
  middle: {
    text: "Match a top edge to its centre, then insert right or left.",
    algo: "right: U R U' R' U' F' U F · left: U' L' U L U F U' F'",
    why: "Opens the slot, drops the edge in, closes it — the first layer stays intact.",
  },
  llcross: {
    text: "Make the yellow cross: dot → L → line → cross. Hold the L top-left.",
    algo: "F R U R' U' F'",
    why: "Each pass flips two top edges in place; nothing below changes.",
  },
  lledges: {
    text: "Turn the top until cross edges match their centres, then cycle the rest.",
    algo: "R U R' U R U2 R'",
    why: "Cycles three top edges around, keeping yellow up.",
  },
  llcorners: {
    text: "Place each corner in its spot, then twist them down.",
    algo: "place: U R U' L' U R' U' L · twist: (R U R' U') ×2/×4",
    why: "The cycle swaps three corners around the one you hold; the trigger twists them home — it looks broken mid-way, but the damage cancels on the last corner.",
  },
  f2l: {
    text: "Pair the white corner with its matching edge and insert them together.",
    algo: "R U R' · F' U F triggers",
    why: "Two pieces per insertion — the heart of CFOP.",
  },
  oll: {
    text: "Orient the last layer — make the whole top yellow.",
    why: "One algorithm flips the top stickers up without moving the layers below.",
  },
  pll: {
    text: "Permute the last layer — slide the final pieces home.",
    why: "One algorithm cycles the top pieces into place; the cube is solved.",
  },
  /* ZZ */
  eoline: {
    text: "Orient every edge and place the DF/DB edges — the line.",
    algo: "computed shortest — about 6 moves",
    why: "With all edges good, the rest solves with R, L and U turns only.",
  },
  zzedges: {
    text: "Place the DL and DR bottom edges with L, R and U turns.",
    algo: "computed shortest in ⟨L, R, U⟩",
    why: "Possible without F or B precisely because every edge is oriented.",
  },
  zzleft: {
    text: "Build the left side onto the line: both corner-edge pairs.",
    algo: "L/U block building",
    why: "Rotationless: the line and oriented edges guide every insert.",
  },
  zzright: {
    text: "Mirror it on the right: bottom edge plus both pairs.",
    algo: "R/U block building",
    why: "Finishing this completes the first two layers.",
  },
  /* Petrus */
  p222: {
    text: "Build a 2×2×2 block in the down-back-left corner.",
    algo: "computed shortest",
    why: "The Petrus start: one corner and three edges, no constraints yet.",
  },
  p223: {
    text: "Extend the block to 2×2×3 using only R, U and F.",
    algo: "R · U · F only",
    why: "Those three faces never cut through the finished block.",
  },
  pright: {
    text: "Finish the right side: the last bottom edge and both pairs.",
    algo: "R U R' · F' U F triggers",
    why: "Completes the first two layers around the Petrus block.",
  },
  /* Roux */
  fb1: {
    text: "First block, back half: the DL edge, back corner and its edge.",
    algo: "computed shortest",
    why: "Roux starts with a 1×2×3 block on the left — no cross.",
  },
  fb2: {
    text: "First block, front half: the front pair.",
    algo: "R · U · F · M only",
    why: "Those moves never touch the back half you just built.",
  },
  sb1: {
    text: "Second block, back half — using only R, U and M.",
    algo: "R · U · M only",
    why: "M and R turns never disturb the finished left block.",
  },
  sb2: {
    text: "Second block, front pair.",
    algo: "R U R' triggers (M to hoist a buried edge)",
    why: "Both blocks done — only corners and six edges remain.",
  },
  cmll: {
    text: "Solve the four top corners — ignore all edges.",
    algo: "CMLL",
    why: "After this, only M and U turns remain — the Roux signature.",
  },
  lse: {
    text: "Last six edges, with M and U turns only.",
    algo: "computed shortest in ⟨M, U⟩",
    why: "Orient, place and finish the edges without breaking anything.",
  },
};

/* ---- explained solve: same engine, grouped into named phases ----
   method "beginner" → cross · first-layer corners · middle edges · OLL · PLL
   method "f2l"      → cross · 4 F2L pairs · OLL · PLL
   Returns { phases:[{id,label,detail,moves:[tok,…]}], moves:[tok,…] } or null
   (`moves` is the flat list, identical to what solve() would play). */
export function solveExplained(targets, method = "beginner") {
  DEADLINE = Date.now() + SOLVE_BUDGET_MS;
  try {
    const st = makeState(targets);
    const phases = [];
    const phase = (id, label, t, fn) => {
      const start = st.sol.length;
      if (!fn()) return false;
      phases.push({
        id, label,
        detail: t.text, algo: t.algo || "", why: t.why || "",
        moves: st.sol.slice(start),
      });
      return true;
    };
    const llPhases = (ollLabel = "Orient top (OLL)", pllLabel = "Permute top (PLL)") => {
      if (!phase("oll", ollLabel, PHASE_TEXT.oll, () => applyOLL(st))) return false;
      phases[phases.length - 1].caseName = st.ollCase || "";
      if (!phase("pll", pllLabel, PHASE_TEXT.pll, () => applyPLL(st))) return false;
      phases[phases.length - 1].caseName = st.pllCase || "";
      return true;
    };

    if (method === "zz") {
      if (!phase("eoline", "EO Line", PHASE_TEXT.eoline, () => {
        turn(st, "z", "2");
        return solveEOLine(st);
      })) return null;
      // every edge is oriented, so DL/DR are reachable with L, R and U only
      if (!phase("zzedges", "Bottom edges", PHASE_TEXT.zzedges, () =>
        bfsPieces(
          st,
          [[-1, -1, 0], [1, -1, 0]].map((v) => bySolvedPos(st, v)),
          MOVES_LRU,
          { maxDepth: 12 },
        ),
      )) return null;
      if (!phase("zzleft", "Left block", PHASE_TEXT.zzleft, () => solvePairsOnSide(st, -1)))
        return null;
      if (!phase("zzright", "Right block", PHASE_TEXT.zzright, () => solvePairsOnSide(st, 1)))
        return null;
      if (!llPhases("Orient top", "Permute top")) return null;
    } else if (method === "petrus") {
      if (!phase("p222", "2×2×2 block", PHASE_TEXT.p222, () => {
        turn(st, "z", "2");
        return bfsPieces(
          st,
          [[-1, -1, -1], [-1, -1, 0], [0, -1, -1], [-1, 0, -1]].map((v) => bySolvedPos(st, v)),
          MOVES18,
          { maxDepth: 12 },
        );
      })) return null;
      // the DR edge rides along here — R/U/F can still flip it if needed,
      // which is impossible later once only R and U remain free
      if (!phase("p223", "Extend to 2×2×3", PHASE_TEXT.p223, () =>
        bfsPieces(
          st,
          [[-1, -1, 1], [0, -1, 1], [-1, 0, 1], [1, -1, 0]].map((v) => bySolvedPos(st, v)),
          MOVES_RUF,
          { maxDepth: 18 },
        ),
      )) return null;
      if (!phase("pright", "Right side", PHASE_TEXT.pright, () => solvePairsOnSide(st, 1)))
        return null;
      if (!llPhases()) return null;
    } else if (method === "roux") {
      if (!phase("fb1", "First block · back", PHASE_TEXT.fb1, () => {
        turn(st, "z", "2");
        return bfsPieces(
          st,
          [[-1, -1, -1], [-1, -1, 0], [-1, 0, -1]].map((v) => bySolvedPos(st, v)),
          MOVES18,
          { maxDepth: 12 },
        );
      })) return null;
      if (!phase("fb2", "First block · front", PHASE_TEXT.fb2, () =>
        bfsPieces(
          st,
          [[-1, -1, 1], [-1, 0, 1]].map((v) => bySolvedPos(st, v)),
          MOVES_RUFM,
          { maxDepth: 16 },
        ),
      )) return null;
      if (!phase("sb1", "Second block · back", PHASE_TEXT.sb1, () =>
        bfsPieces(
          st,
          [[1, -1, 0], [1, -1, -1], [1, 0, -1]].map((v) => bySolvedPos(st, v)),
          MOVES_RUM,
          { maxDepth: 16 },
        ),
      )) return null;
      if (!phase("sb2", "Second block · front", PHASE_TEXT.sb2, () => rouxSB2(st)))
        return null;
      if (!phase("cmll", "Top corners (CMLL)", PHASE_TEXT.cmll, () => {
        realignFrame(st);
        return solveCMLL(st);
      })) return null;
      phases[phases.length - 1].caseName = st.cmllCase || "";
      // LSE: the six edges + the top centre + ONE top corner — tracking a
      // corner pins the net U rotation so CMLL's relative placement lands.
      if (!phase("lse", "Last six edges", PHASE_TEXT.lse, () =>
        bfsPieces(
          st,
          [
            [0, 1, 1], [0, 1, -1], [-1, 1, 0], [1, 1, 0],
            [0, -1, 1], [0, -1, -1], [0, 1, 0], [1, 1, 1],
          ].map((v) => bySolvedPos(st, v)),
          MOVES_MU,
          { maxDepth: 22 },
        ),
      )) return null;
      if (!isSolvedFaces(st)) return null;
      for (const ph of phases) ph.moves = simplifyMoves(ph.moves);
      return { phases, moves: phases.flatMap((ph) => ph.moves) };
    }

    if (method === "zz" || method === "petrus") {
      if (!isSolvedFaces(st)) return null;
      for (const ph of phases) ph.moves = simplifyMoves(ph.moves);
      return { phases, moves: phases.flatMap((ph) => ph.moves) };
    }

    if (
      !phase(
        "cross",
        method === "f2l" ? "Cross" : "First-layer cross",
        method === "f2l" ? PHASE_TEXT.cross : PHASE_TEXT.daisy,
        () => {
          turn(st, "z", "2"); // white centre to the bottom
          return method === "f2l" ? solveCross(st) : solveCrossDaisy(st);
        },
      )
    )
      return null;

    if (method === "f2l") {
      if (!solveF2LPhases(st, phases)) return null;
      if (!phase("oll", "Orient top (OLL)", PHASE_TEXT.oll, () => applyOLL(st)))
        return null;
      phases[phases.length - 1].caseName = st.ollCase || "";
      if (!phase("pll", "Permute top (PLL)", PHASE_TEXT.pll, () => applyPLL(st)))
        return null;
      phases[phases.length - 1].caseName = st.pllCase || "";
    } else {
      if (!phase("corners", "First-layer corners", PHASE_TEXT.corners, () => solveCorners(st)))
        return null;
      if (!phase("middle", "Second-layer edges", PHASE_TEXT.middle, () => solveMiddle(st)))
        return null;
      if (!phase("llcross", "Last-layer cross", PHASE_TEXT.llcross, () => llCross(st)))
        return null;
      if (!phase("lledges", "Last-layer edges", PHASE_TEXT.lledges, () => llEdges(st)))
        return null;
      if (!phase("llcorners", "Last-layer corners", PHASE_TEXT.llcorners, () => llCorners(st)))
        return null;
    }
    if (!isSolvedFaces(st)) return null;

    for (const ph of phases) {
      ph.moves = simplifyMoves(ph.moves);
      // OLL/PLL apply one whole algorithm — show the actual moves as the algo
      if ((ph.id === "oll" || ph.id === "pll") && !ph.algo && ph.moves.length)
        ph.algo = ph.moves.join(" ");
    }
    return { phases, moves: phases.flatMap((ph) => ph.moves) };
  } catch (e) {
    if (e === ABORT) return null; // over budget → caller falls back to Fast
    throw e;
  } finally {
    DEADLINE = 0;
  }
}

export const _t = {
  makeState, turn, alg, colorsOf, isSolvedFaces, nz, DIR,
  solveCross, solveCrossDaisy, solveCorners, solveMiddle, applyOLL, applyPLL,
  solved1, solPos, solvedIn, solPosIn, Z2,
  solveExplained, solveF2LPhases, llCross, llEdges, llCorners,
  llPlaceCorners, llOrientCorners, llCornersPlaced,
  bfsPieces, solveEOLine, solvePairsOnSide, solveCMLL, rouxSB2, bySolvedPos,
  realignFrame, solveOneSlot, homeKey,
  MOVES18, MOVES_RUF, MOVES_RUM, MOVES_RUFM, MOVES_MU,
};
