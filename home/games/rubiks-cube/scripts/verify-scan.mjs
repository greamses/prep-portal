/* Round-trip test for cube-state.js: scramble a cubie model, read its faces
   through the HOLDS scan mapping, reconstruct, and confirm the reconstruction
   reproduces the scramble exactly. Also checks solved scans as solved.
   Run:  node home/games/rubiks-cube/scripts/verify-scan.mjs                */
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
// Import cube-state.js (an ES module .js) via a temp .mjs copy.
const tmp = join(tmpdir(), `cube-state.${Date.now()}.mjs`);
writeFileSync(tmp, readFileSync(join(here, "..", "js", "cube-state.js")));
const CS = await import(pathToFileURL(tmp));
rmSync(tmp);

const { DIR, FACES, HOLDS, cellTargets, reconstruct, applyM } = CS;

/* ---- minimal cubie model (same algebra as verify-algs) ---- */
const V = DIR;
const TURN = {
  U: { d: V.U, l: [1] }, D: { d: V.D, l: [1] }, L: { d: V.L, l: [1] },
  R: { d: V.R, l: [1] }, F: { d: V.F, l: [1] }, B: { d: V.B, l: [1] },
};
const mul = (A, B) => A.map((r) => B[0].map((_, j) => Math.round(r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])));
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
function rot(a, qt) {
  const th = (qt * Math.PI) / 2, c = Math.round(Math.cos(th)), s = Math.round(Math.sin(th));
  const [x, y, z] = a;
  return [
    [c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s],
    [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s],
    [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)],
  ].map((r) => r.map(Math.round));
}
const dot = (p, d) => p[0] * d[0] + p[1] * d[1] + p[2] * d[2];
const eq = (a, b) => a.every((v, i) => v === b[i]);
const dirFace = (v) => FACES.find((f) => eq(DIR[f], v));

function solved() {
  const cs = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (!x && !y && !z) continue;
    const stickers = [x, y, z].map((c, i) => (c ? { d: [0, 0, 0].map((_, j) => (j === i ? c : 0)) } : null)).filter(Boolean);
    cs.push({ home: [x, y, z], pos: [x, y, z], O: I3, stickers });
  }
  return cs;
}
function move(cs, base, prime, double) {
  const t = TURN[base], qt = double ? 2 : prime ? 1 : -1, Rm = rot(t.d, qt);
  for (const c of cs) { if (!t.l.includes(dot(c.pos, t.d))) continue; c.pos = applyM(Rm, c.pos); c.O = mul(Rm, c.O); }
}
function scramble(cs, n) {
  const seq = [];
  for (let i = 0; i < n; i++) {
    const base = FACES[(Math.random() * 6) | 0];
    const prime = Math.random() < 0.5, double = Math.random() < 0.3;
    seq.push({ base, prime, double }); move(cs, base, prime, double);
  }
  return seq;
}
// colour label seen at world position `pos` facing world direction `dir`
function labelAt(cs, pos, dir) {
  const c = cs.find((c) => eq(c.pos, pos));
  for (const s of c.stickers) if (eq(applyM(c.O, s.d), dir)) return dirFace(s.d);
  return null;
}
// produce the 6 scan grids by reading the model through the HOLDS mapping
function scan(cs) {
  return HOLDS.map((hold) => cellTargets(hold).map((cell) => labelAt(cs, cell.pos, cell.dir)));
}
// state fingerprint: colour at every (pos,outward-dir)
function fingerprint(cs) {
  const out = [];
  for (const c of cs) for (const s of c.stickers) out.push(c.pos.join() + ":" + applyM(c.O, s.d).join() + "=" + dirFace(s.d));
  return out.sort().join("|");
}
// rebuild a model from reconstruct() targets, then fingerprint it
function fromTargets(targets) {
  const base = solved();
  const byHome = new Map(base.map((c) => [c.home.join(), c]));
  for (const t of targets) { const c = byHome.get(t.home.join()); c.pos = t.pos.slice(); c.O = t.rot; }
  return fingerprint(base);
}

let fails = 0;
// solved scan must reconstruct as solved
{
  const s = solved();
  const r = reconstruct(scan(s));
  if (!r.ok || fromTargets(r.targets) !== fingerprint(s)) { console.log("✗ solved scan failed", r.error || ""); fails++; }
}
// random scrambles must round-trip
const N = 300;
for (let i = 0; i < N; i++) {
  const s = solved();
  scramble(s, 25);
  const want = fingerprint(s);
  const r = reconstruct(scan(s));
  if (!r.ok) { console.log(`✗ scramble ${i}: reconstruct rejected: ${r.error}`); fails++; continue; }
  if (fromTargets(r.targets) !== want) { console.log(`✗ scramble ${i}: reconstruction differs from original`); fails++; }
}
console.log(`\nscan round-trip: ${N} scrambles + solved · ${fails} failure(s)`);

/* ---- solvability guard must REJECT corrupted (misread) states ---- */
const { isSolvable } = CS;
function reconstructedTargets() {
  const s = solved(); scramble(s, 20);
  const r = reconstruct(scan(s));
  return r.targets;
}
let guardFails = 0;
// valid states must pass
for (let i = 0; i < 50; i++) if (!isSolvable(reconstructedTargets())) { console.log("✗ guard rejected a valid state"); guardFails++; }
// flip a single edge -> unsolvable
{
  const t = reconstructedTargets();
  const e = t.find((x) => x.home.filter((c) => c).length === 2);
  // rotate 180° about an in-slot axis to swap its two stickers (flip)
  const flipAxis = e.pos.map((c) => (c ? 1 : 0)); // a face the edge touches
  e.rot = mul(rot(flipAxis, 2), e.rot);
  if (isSolvable(t)) { console.log("✗ guard missed a flipped edge"); guardFails++; }
}
// twist a single corner -> unsolvable
{
  const t = reconstructedTargets();
  const c = t.find((x) => x.home.filter((v) => v).length === 3);
  c.rot = mul(rot(c.pos, 1), c.rot); // 120° about its body diagonal? approximate via face axis below
  // use a proper 120° body-diagonal twist:
  const d = c.pos;
  const C = [
    [0, -d[2], d[1]], [d[2], 0, -d[0]], [-d[1], d[0], 0],
  ].map((row, i) => row.map((v, j) => ((i === j ? -1 : 0) + v + d[i] * d[j]) / 2));
  c.rot = mul(C, t.find((x) => x === c).rot); // extra twist
  if (isSolvable(t)) { console.log("✗ guard missed a twisted corner"); guardFails++; }
}
// swap two corners -> unsolvable (odd permutation)
{
  const t = reconstructedTargets();
  const cs = t.filter((x) => x.home.filter((v) => v).length === 3);
  const a = cs[0], b = cs[1];
  const tmp = a.home; a.home = b.home; b.home = tmp; // swap identities
  if (isSolvable(t)) { console.log("✗ guard missed a single corner swap"); guardFails++; }
}
console.log(`solvability guard · ${guardFails} failure(s)`);
process.exit(fails || guardFails ? 1 : 0);
