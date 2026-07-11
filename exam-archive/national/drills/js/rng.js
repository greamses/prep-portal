/* ═══════════════════════════════════════════════════════
   DRILLS — seeded PRNG + question generation
   Every client in a room shares one `seed`, so questionAt(seed, i)
   produces the identical question sequence on every device with zero
   network traffic. See js/bots.js for the matching bot-score use of
   the same primitives.
═══════════════════════════════════════════════════════ */

// mulberry32 — small, fast, good-enough distribution for game content
// (not cryptographic). Returns a function that yields floats in [0,1).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mixes a room seed with a namespace/index into one well-distributed
// 32-bit int, so independent draw streams (questions vs. bot profiles,
// and each bot's own stream) never overlap or correlate.
export function hashSeed(seed, ns) {
  let h = (seed ^ Math.imul(ns + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export const QUESTION_NS = 0;
export const BOT_NS = 1_000_000;

export const ALL_TABLES = Array.from({ length: 12 }, (_, i) => i + 1);

export const ALL_OPERATIONS = ['multiply', 'divide', 'square', 'sqrt', 'cube', 'cuberoot'];

// Times tables 1–12 only. `tables` is the set of fact families in play — for
// multiply/divide, one of the two operands is always drawn from it
// (mirroring the flashcards Facts picker), the other operand is free, 1–12;
// for square/sqrt, `tables` supplies the number being squared / the root
// being taken. `operations` is a non-empty subset of ALL_OPERATIONS — one is
// drawn at random per question. Division always divides evenly (built from
// a product, then presented as dividend ÷ divisor) — never a non-integer
// result, and square root is always a perfect square for the same reason.
export function questionAt(seed, index, { operations = ['multiply', 'divide'], tables = ALL_TABLES } = {}) {
  const rng = mulberry32(hashSeed(seed, QUESTION_NS + index));
  const ops = operations.length ? operations : ['multiply', 'divide'];
  const op = ops[Math.floor(rng() * ops.length)];
  const pool = tables.length ? tables : ALL_TABLES;
  const n = pool[Math.floor(rng() * pool.length)];

  if (op === 'square') return { text: `${n}²`, answer: n * n };
  if (op === 'sqrt') return { text: `√${n * n}`, answer: n };
  if (op === 'cube') return { text: `${n}³`, answer: n * n * n };
  if (op === 'cuberoot') return { text: `∛${n * n * n}`, answer: n };

  const other = 1 + Math.floor(rng() * 12);
  if (op === 'divide') {
    const dividend = n * other;
    return { text: `${dividend} ÷ ${n}`, answer: other };
  }
  return { text: `${n} × ${other}`, answer: n * other };
}
