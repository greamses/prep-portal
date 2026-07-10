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

// Times tables 1–12 only. `tables` is the set of fact families in play (one
// of the two operands is always drawn from it, mirroring the flashcards
// Facts picker); the other operand is free, 1–12. `operation` is
// 'multiply' | 'divide' | 'mixed' (mixed coin-flips per question). Division
// always divides evenly (built from a product, then presented as
// dividend ÷ divisor) — never a non-integer result.
export function questionAt(seed, index, { operation = 'mixed', tables = ALL_TABLES } = {}) {
  const rng = mulberry32(hashSeed(seed, QUESTION_NS + index));
  const pool = tables.length ? tables : ALL_TABLES;
  const table = pool[Math.floor(rng() * pool.length)];
  const other = 1 + Math.floor(rng() * 12);
  const isDivide = operation === 'divide' ? true : operation === 'multiply' ? false : rng() < 0.5;
  if (isDivide) {
    const dividend = table * other;
    return { text: `${dividend} ÷ ${table}`, answer: other };
  }
  return { text: `${table} × ${other}`, answer: table * other };
}
