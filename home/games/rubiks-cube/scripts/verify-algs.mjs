/* Verifies every algorithm in js/algs.js:
   1. parses fully in the game's move notation (no dropped tokens), and
   2. is a genuine last-layer algorithm — applied to a solved cube it leaves
      the bottom two layers (every cubie with original y <= 0) untouched,
      accounting for any net whole-cube rotation in the algorithm.
   Pure integer cubie model — mirrors js/game.js's TURN algebra, no three.js.
   Run:  node home/games/rubiks-cube/scripts/verify-algs.mjs            */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/* ---- move algebra (must match game.js) ---- */
const V = {
  U: [0, 1, 0], D: [0, -1, 0], L: [-1, 0, 0],
  R: [1, 0, 0], F: [0, 0, 1], B: [0, 0, -1],
};
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

function parse(str) {
  const out = [];
  let consumed = 0;
  MOVE_RE.lastIndex = 0;
  let m;
  while ((m = MOVE_RE.exec(str))) {
    consumed += m[0].length;
    out.push({ t: TURN[m[1]], prime: m[2] === "'", double: m[2] === "2" });
  }
  const stripped = str.replace(/\s+/g, "").length;
  return { out, ok: consumed === stripped };
}

/* ---- integer matrix helpers ---- */
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const mul = (A, B) =>
  A.map((row) => B[0].map((_, j) => Math.round(row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j])));
const apply = (M, v) => M.map((row) => Math.round(row[0] * v[0] + row[1] * v[1] + row[2] * v[2]));
const T = (M) => M[0].map((_, j) => M.map((row) => row[j])); // transpose = inverse for rotations
const eq = (a, b) => a.every((v, i) => (Array.isArray(v) ? eq(v, b[i]) : v === b[i]));

// Rotation matrix: angle θ about unit axis a (Rodrigues, integer for 90° steps).
function rot(a, qt) {
  const th = (qt * Math.PI) / 2, c = Math.round(Math.cos(th)), s = Math.round(Math.sin(th));
  const [x, y, z] = a;
  return [
    [c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s],
    [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s],
    [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)],
  ].map((r) => r.map(Math.round));
}

/* ---- cubie model ---- */
function solvedCube() {
  const cubies = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (!x && !y && !z) continue;
        cubies.push({ home: [x, y, z], pos: [x, y, z], O: I3 });
      }
  return cubies;
}
const dot = (p, d) => p[0] * d[0] + p[1] * d[1] + p[2] * d[2];

function move(cubies, { t, prime, double }) {
  // Match game.js handedness: a non-prime turn is clockwise seen from outside
  // = a NEGATIVE rotation about the outward normal (right-hand rule).
  const qt = double ? 2 : prime ? 1 : -1;
  const Rm = rot(t.d, qt);
  for (const c of cubies) {
    if (!t.l.includes(dot(c.pos, t.d))) continue;
    c.pos = apply(Rm, c.pos);
    c.O = mul(Rm, c.O);
  }
}

function run(alg) {
  const cubies = solvedCube();
  for (const mv of parse(alg).out) move(cubies, mv);
  return cubies;
}

// The 24 proper rotations of the cube (integer matrices), built from x,y gens.
const ROT24 = (() => {
  const seen = new Map(), out = [];
  const gens = [rot([1, 0, 0], 1), rot([0, 1, 0], 1)];
  const stack = [I3];
  while (stack.length) {
    const M = stack.pop(), k = M.flat().join();
    if (seen.has(k)) continue;
    seen.set(k, 1); out.push(M);
    for (const g of gens) stack.push(mul(g, M));
  }
  return out;
})();
const isCentre = (h) => h.filter((v) => v !== 0).length === 1;

// De-rotate by the net whole-cube rotation (read from centre POSITIONS — face
// turns spin centres in place but never move them; centre orientation is
// invisible/symmetric so it's ignored). Returns LL cubies + an F2L-preserved
// flag. null if no single rotation explains the centre positions.
function analyse(cubies) {
  const centres = cubies.filter((c) => isCentre(c.home));
  const Rnet = ROT24.find((R) => centres.every((c) => eq(apply(R, c.home), c.pos)));
  if (!Rnet) return null;
  const Inv = T(Rnet);
  const dr = cubies.map((c) => ({
    home: c.home, centre: isCentre(c.home),
    pos: apply(Inv, c.pos), O: mul(Inv, c.O),
  }));
  // bottom two layers solved: non-centre pieces home in pos+orientation;
  // centre pieces just home in position (their twist doesn't matter).
  const f2l = dr.every(
    (c) => c.home[1] > 0 || (eq(c.pos, c.home) && (c.centre || eq(c.O, I3)))
  );
  const ll = dr.filter((c) => c.home[1] > 0);
  return { f2l, ll };
}
// pure orientation = every LL piece is in its home slot (only twisted)
const isOrientationOnly = (ll) => ll.every((c) => c.centre || eq(c.pos, c.home));
// pure permutation = every LL piece keeps identity orientation (only moved)
const isPermutationOnly = (ll) => ll.every((c) => c.centre || eq(c.O, I3));
// canonical signature of an LL state, minimised over the 4 U rotations
function llSig(ll) {
  let best = null;
  for (let qt = 0; qt < 4; qt++) {
    const R = rot([0, 1, 0], qt), Inv = T(R);
    const sig = ll
      .filter((c) => !c.centre)
      .map((c) => ({ h: apply(R, c.home), pos: apply(R, c.pos), O: mul(mul(R, c.O), Inv) }))
      .sort((a, b) => a.h.join().localeCompare(b.h.join()))
      .map((c) => `${c.h.join()}|${c.pos.join()}|${c.O.flat().join()}`)
      .join(";");
    if (best === null || sig < best) best = sig;
  }
  return best;
}

/* ---- read algs.js, extract modules → { name, moves } ---- */
const src = readFileSync(join(here, "..", "js", "algs.js"), "utf8");
const cases = [];
const MOD_RE = /id:\s*"([^"]*)"/g;
const mods = [];
let mm;
while ((mm = MOD_RE.exec(src))) mods.push({ id: mm[1], at: mm.index });
const modAt = (i) => (mods.filter((x) => x.at < i).pop() || { id: "?" }).id;
const RE = /name:\s*"([^"]*)"\s*,\s*moves:\s*"([^"]*)"/g;
let m;
while ((m = RE.exec(src))) cases.push({ name: m[1], moves: m[2], mod: modAt(m.index) });

let bad = 0;
const sigs = {}; // per-module signature → first case name (duplicate detection)
for (const c of cases) {
  const p = parse(c.moves);
  if (!p.ok) { console.log(`PARSE  ✗  ${c.name.padEnd(20)} "${c.moves}"`); bad++; continue; }
  // Basics / Patterns aren't last-layer algorithms — only parse-check them.
  if (c.mod !== "oll" && c.mod !== "pll") continue;
  const a = analyse(run(c.moves));
  // F2L-preservation is the real correctness guarantee: a genuine last-layer
  // algorithm leaves the bottom two layers solved (allowing any net rotation).
  if (!a || !a.f2l) { console.log(`F2L  ✗  ${c.name.padEnd(20)} "${c.moves}"`); bad++; continue; }
  // No two cases in a module may resolve to the identical last-layer state.
  const key = c.mod + ":" + llSig(a.ll);
  if (sigs[key]) { console.log(`DUP  ✗  ${c.name.padEnd(20)} same effect as ${sigs[key]}`); bad++; continue; }
  sigs[key] = c.name;
}
const olln = cases.filter((c) => c.mod === "oll").length;
const plln = cases.filter((c) => c.mod === "pll").length;
console.log(`\n${cases.length} algorithms · OLL ${olln}/57 · PLL ${plln}/21 · ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
