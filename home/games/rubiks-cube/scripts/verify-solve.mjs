/* Validates solve.js: solve random scrambles, apply the returned moves with an
   INDEPENDENT engine, and confirm the cube ends solved.
   Run: node home/games/rubiks-cube/scripts/verify-solve.mjs [N]              */
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const jsdir = join(here, "..", "js");
const tmp = mkdtempSync(join(tmpdir(), "rcube-"));
for (const f of ["cube-state.js", "algs.js", "solve.js"]) writeFileSync(join(tmp, f), readFileSync(join(jsdir, f)));
const SOLVE = await import(pathToFileURL(join(tmp, "solve.js")));
rmSync(tmp, { recursive: true, force: true });
const { solve, _t } = SOLVE;
const DIR = _t.DIR;
const FACES = ["U", "D", "R", "L", "F", "B"];
const FACE_OF = {};
for (const f of FACES) FACE_OF[DIR[f].join(",")] = f;

const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const mul = (A, B) => A.map((r) => B[0].map((_, j) => Math.round(r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])));
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
function solved() {
  const cs = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (!x && !y && !z) continue;
    cs.push({ home: [x, y, z], pos: [x, y, z], O: I3 });
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

const N = +(process.argv[2] || 100);
let fails = 0, moveTotal = 0, maxMoves = 0;
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  const cs = solved();
  const seq = scramble(cs);
  let moves;
  try { moves = solve(targetsOf(cs)); }
  catch (e) { console.log(`✗ ${i}: solve threw ${e.message}`); fails++; continue; }
  if (moves === null) { console.log(`✗ ${i}: solve returned null  scramble=[${seq.join(" ")}]`); fails++; continue; }
  moveTotal += moves.length; maxMoves = Math.max(maxMoves, moves.length);
  for (const tok of moves) move(cs, tok);
  if (!solvedFaces(cs)) { console.log(`✗ ${i}: NOT solved (${moves.length} moves)  scramble=[${seq.join(" ")}]`); fails++; }
}
console.log(`\nsolve test: ${N} scrambles · ${fails} failure(s) · avg ${(moveTotal / N).toFixed(0)} / max ${maxMoves} moves · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
process.exit(fails ? 1 : 0);
