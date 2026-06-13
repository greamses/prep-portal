/* Validates all three auto-solve methods. For each random scramble, solve it
   with the beginner (LBL), F2L (CFOP) and fast (Kociemba) methods, replay the
   returned moves with an INDEPENDENT engine, and confirm the cube ends solved.
   Also checks that each explained phase's moves concatenate to the flat list.
   Run: node home/games/rubiks-cube/scripts/verify-methods.mjs [N]            */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const jsdir = join(here, "..", "js");
const imp = (f) => import(pathToFileURL(join(jsdir, f)));

const { solveExplained, _t } = await imp("solve.js");
const { solveFast } = await imp("min2phase.js");
const { toFacelets } = await imp("cube-state.js");
const DIR = _t.DIR;

const FACES = ["U", "D", "R", "L", "F", "B"];
const FACE_OF = {};
for (const f of FACES) FACE_OF[DIR[f].join(",")] = f;

const mul = (A, B) =>
  A.map((r) => B[0].map((_, j) => Math.round(r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])));
const apply = (M, v) => M.map((r) => Math.round(r[0] * v[0] + r[1] * v[1] + r[2] * v[2]));
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

function solvedCubies() {
  const cs = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (!x && !y && !z) continue;
    cs.push({ home: [x, y, z], pos: [x, y, z], O: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] });
  }
  return cs;
}
function move(cs, tok) {
  const t = TURN[tok[0]], mod = tok.slice(1);
  const qt = mod === "2" ? 2 : mod === "'" ? 1 : -1;
  const Rm = rotM(t.d, qt);
  for (const c of cs)
    if (t.l.includes(c.pos[0] * t.d[0] + c.pos[1] * t.d[1] + c.pos[2] * t.d[2])) {
      c.pos = apply(Rm, c.pos); c.O = mul(Rm, c.O);
    }
}
function solvedFaces(cs) {
  for (const f of FACES) {
    const wd = DIR[f]; let col = null;
    for (const c of cs) for (let i = 0; i < 3; i++) if (c.home[i]) {
      const d = [0, 0, 0]; d[i] = c.home[i];
      if (eqv(apply(c.O, d), wd)) { const lab = FACE_OF[d.join(",")]; if (col === null) col = lab; else if (col !== lab) return false; }
    }
  }
  return true;
}
function scramble(cs) {
  const seq = [];
  const n = 20 + ((Math.random() * 15) | 0);
  for (let i = 0; i < n; i++) {
    const tok = FACES[(Math.random() * 6) | 0] + ["", "'", "2"][(Math.random() * 3) | 0];
    seq.push(tok); move(cs, tok);
  }
  return seq;
}
const targetsOf = (cs) => cs.map((c) => ({ home: c.home.slice(), pos: c.pos.slice(), rot: c.O.map((r) => r.slice()) }));
const tokens = (s) => s.split(/\s+/).filter(Boolean);

// Solver adapters: each returns a flat move-token array (or null).
const METHODS = {
  beginner: (t) => { const r = solveExplained(t, "beginner"); return r && checkPhases(r); },
  f2l: (t) => { const r = solveExplained(t, "f2l"); return r && checkPhases(r); },
  roux: (t) => { const r = solveExplained(t, "roux"); return r && checkPhases(r); },
  zz: (t) => { const r = solveExplained(t, "zz"); return r && checkPhases(r); },
  petrus: (t) => { const r = solveExplained(t, "petrus"); return r && checkPhases(r); },
  fast: (t) => { const s = solveFast(toFacelets(t)); return s == null ? null : tokens(s); },
};
// Confirm phase moves concatenate exactly to the flat move list.
function checkPhases(r) {
  const flat = r.phases.flatMap((p) => p.moves);
  if (flat.length !== r.moves.length || flat.some((m, i) => m !== r.moves[i]))
    throw new Error("phase moves do not match flat list");
  return r.moves;
}

// fail = a CORRECTNESS error (returned moves that don't solve, or a throw).
// fallback = the layer-by-layer solver couldn't crack this state; the app
// silently uses the Fast route instead, so it's tracked but not a hard fail.
// Fast must never fall back — a null from Fast IS a hard fail.
const N = +(process.argv[2] || 50);
const stats = {};
for (const m of Object.keys(METHODS)) stats[m] = { fail: 0, fallback: 0, solved: 0, total: 0, max: 0, ms: 0, maxMs: 0 };

for (let i = 0; i < N; i++) {
  const base = solvedCubies();
  const seq = scramble(base);
  const targets = targetsOf(base);
  for (const [name, fn] of Object.entries(METHODS)) {
    const t0 = Date.now();
    let moves;
    try { moves = fn(targets); }
    catch (e) { console.log(`✗ ${name} ${i}: threw ${e.message}  scramble=[${seq.join(" ")}]`); stats[name].fail++; continue; }
    const dt = Date.now() - t0;
    stats[name].ms += dt; stats[name].maxMs = Math.max(stats[name].maxMs, dt);
    if (moves == null) {
      if (name === "fast") { console.log(`✗ fast ${i}: returned null  scramble=[${seq.join(" ")}]`); stats[name].fail++; }
      else stats[name].fallback++;
      continue;
    }
    const cs = solvedCubies();
    for (const tok of seq) move(cs, tok); // re-create the scrambled state
    for (const tok of moves) move(cs, tok); // apply the solution
    stats[name].total += moves.length; stats[name].max = Math.max(stats[name].max, moves.length);
    if (!solvedFaces(cs)) { console.log(`✗ ${name} ${i}: NOT solved (${moves.length} moves)  scramble=[${seq.join(" ")}]`); stats[name].fail++; }
    else stats[name].solved++;
  }
}

let fails = 0;
console.log(`\n${N} scrambles:`);
for (const [m, s] of Object.entries(stats)) {
  fails += s.fail;
  const avg = s.solved ? (s.total / s.solved).toFixed(0) : "—";
  const fb = s.fallback ? ` · ${s.fallback} →Fast (${((s.fallback / N) * 100).toFixed(0)}%)` : "";
  console.log(`  ${m.padEnd(9)} ${s.fail} fail${fb} · avg ${avg} / max ${s.max} moves · ${(s.ms / 1000).toFixed(1)}s total · ${s.maxMs}ms worst`);
}
process.exit(fails ? 1 : 0);
