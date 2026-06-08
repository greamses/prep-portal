/* =====================================================================
   solve.js — dependency-free beginner (layer-by-layer) solver.

   Input: cube-state.reconstruct() targets. Output: a move list a learner can
   follow on their real cube. Method:
     z2 (white centre to the bottom) → white cross → first-layer corners →
     middle edges → last layer (orient, then permute).

   The first two layers are solved by IDA* over a small, slot-local move set
   (O(depth) memory — no blow-up). The last layer is solved by trying the
   project's Node-verified OLL/PLL algorithms (algs.js) until one fits.
   Validated in scripts/verify-solve.mjs.
   ===================================================================== */

import { DIR, FACES, applyM } from "./cube-state.js";
import { ALGO_MODULES } from "./algs.js";

const FACE_OF = {};
for (const f of FACES) FACE_OF[DIR[f].join(",")] = f;

const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
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

function makeState(targets) {
  return {
    m: targets.map((t) => ({ home: t.home.slice(), pos: t.pos.slice(), O: t.rot.map((r) => r.slice()) })),
    sol: [],
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
// solved (post-z2) position/orientation of a piece
const solPos = (home) => applyM(Z2, home);
const solved1 = (p) => eqv(p.pos, solPos(p.home)) && meq(p.O, Z2);
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

/* ---- cross: BFS the 4 white edges to their solved spots ---- */
const FACE_MOVES = [];
for (const f of ["U", "D", "L", "R", "F", "B"]) for (const mo of ["", "'", "2"]) FACE_MOVES.push(f + mo);
function applySub(sub, mv) {
  const t = TURN[mv[0]], mod = mv.slice(1);
  const qt = mod === "2" ? 2 : mod === "'" ? 1 : -1;
  const Rm = rotM(t.d, qt);
  for (const p of sub)
    if (t.l.includes(p.pos[0] * t.d[0] + p.pos[1] * t.d[1] + p.pos[2] * t.d[2])) {
      p.pos = applyM(Rm, p.pos); p.O = mul(Rm, p.O);
    }
}
const cloneSub = (sub) => sub.map((p) => ({ home: p.home, pos: p.pos.slice(), O: p.O.map((r) => r.slice()) }));
const subKey = (sub) => sub.map((p) => p.pos.join("") + "." + p.O.flat().join("")).join("|");

function solveCross(st) {
  const sub = cloneSub(st.m.filter((p) => nz(p) === 2 && isWhite(p)));
  const goal = (s) => s.every(solved1);
  if (goal(sub)) return true;
  const visited = new Set([subKey(sub)]);
  let frontier = [{ s: sub, path: [] }];
  for (let depth = 0; depth < 8; depth++) {
    const next = [];
    for (const node of frontier) {
      const lf = node.path.length ? node.path[node.path.length - 1][0] : "";
      for (const mv of FACE_MOVES) {
        if (mv[0] === lf) continue;
        const ns = cloneSub(node.s);
        applySub(ns, mv);
        const k = subKey(ns);
        if (visited.has(k)) continue;
        visited.add(k);
        const path = node.path.concat(mv);
        if (goal(ns)) { for (const t of path) turn(st, t[0], t.slice(1)); return true; }
        next.push({ s: ns, path });
      }
    }
    frontier = next;
  }
  return false;
}

/* ---- IDA* slot insertion over a slot-local move set ---- */
function idaSlot(st, filter, moveSet, maxDepth) {
  const sub = cloneSub(st.m.filter(filter));
  if (sub.every(solved1)) return true;
  function dfs(s, depth, lastFace, path) {
    if (depth === 0) return s.every(solved1) ? path : null;
    for (const mv of moveSet) {
      if (mv[0] === lastFace) continue;
      const ns = cloneSub(s);
      applySub(ns, mv);
      const r = dfs(ns, depth - 1, mv[0], path.concat(mv));
      if (r) return r;
    }
    return null;
  }
  for (let d = 1; d <= maxDepth; d++) {
    const path = dfs(sub, d, "", []);
    if (path) { for (const t of path) turn(st, t[0], t.slice(1)); return true; }
  }
  return false;
}
const movesFor = (faces) => {
  const out = [];
  for (const f of faces) for (const mo of ["", "'", "2"]) out.push(f + mo);
  return out;
};

function solveCorners(st) {
  const tracked = st.m.filter((p) => nz(p) === 2 && isWhite(p)).map((p) => p.home.join());
  const corners = st.m.filter((p) => nz(p) === 3 && isWhite(p));
  for (const c of corners) {
    tracked.push(c.home.join());
    const set = new Set(tracked);
    const sp = solPos(c.home); // (sx,-1,sz)
    const faces = ["U", sp[0] > 0 ? "R" : "L", sp[2] > 0 ? "F" : "B"];
    if (!idaSlot(st, (p) => set.has(p.home.join()), movesFor(faces), 8)) return false;
  }
  return true;
}

function solveMiddle(st) {
  const tracked = st.m
    .filter((p) => (nz(p) === 2 && isWhite(p)) || (nz(p) === 3 && isWhite(p)))
    .map((p) => p.home.join());
  const mids = st.m.filter((p) => nz(p) === 2 && !isWhite(p) && !colorsOf(p).includes("D"));
  for (const e of mids) {
    tracked.push(e.home.join());
    const set = new Set(tracked);
    const sp = solPos(e.home); // (sx,0,sz)
    const faces = ["U", sp[0] > 0 ? "R" : "L", sp[2] > 0 ? "F" : "B"];
    if (!idaSlot(st, (p) => set.has(p.home.join()), movesFor(faces), 8)) return false;
  }
  return true;
}

/* ---- last layer: try the verified OLL/PLL algorithms ---- */
const OLL_ALGS = [], PLL_ALGS = [];
for (const mod of ALGO_MODULES) {
  if (mod.id === "oll") for (const g of mod.groups) for (const it of g.items) OLL_ALGS.push(it.moves);
  if (mod.id === "pll") for (const g of mod.groups) for (const it of g.items) PLL_ALGS.push(it.moves);
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
  if (llOriented(st)) return true;
  for (let auf = 0; auf < 4; auf++)
    for (const A of OLL_ALGS) {
      const c = cloneState(st);
      for (let k = 0; k < auf; k++) turn(c, "U");
      alg(c, A);
      if (llOriented(c)) {
        for (let k = 0; k < auf; k++) turn(st, "U");
        alg(st, A);
        return true;
      }
    }
  return false;
}
function applyPLL(st) {
  for (let auf = 0; auf < 4; auf++)
    for (const P of PLL_ALGS)
      for (let auf2 = 0; auf2 < 4; auf2++) {
        const c = cloneState(st);
        for (let k = 0; k < auf; k++) turn(c, "U");
        alg(c, P);
        for (let k = 0; k < auf2; k++) turn(c, "U");
        if (isSolvedFaces(c)) {
          for (let k = 0; k < auf; k++) turn(st, "U");
          alg(st, P);
          for (let k = 0; k < auf2; k++) turn(st, "U");
          return true;
        }
      }
  return false;
}

/* ---- public solve ---- */
export function solve(targets) {
  const st = makeState(targets);
  turn(st, "z", "2"); // white centre to the bottom
  if (!solveCross(st)) return null;
  if (!solveCorners(st)) return null;
  if (!solveMiddle(st)) return null;
  if (!applyOLL(st)) return null;
  if (!applyPLL(st)) return null;
  if (!isSolvedFaces(st)) return null;
  return st.sol;
}

export const _t = {
  makeState, turn, alg, colorsOf, isSolvedFaces, nz, DIR,
  solveCross, solveCorners, solveMiddle, applyOLL, applyPLL, solved1, solPos, Z2,
};
