/* ═══════════════════════════════════════════════════════
   GAMES — the seeded-room primitives (Drills, Puzzles, Geometry, Vocab)

   Every multiplayer round on this site rests on one idea: a room shares a single
   `seed`, and every client derives the SAME content and the SAME bot scores from
   it locally. Nothing about the round is ever synced. That is why a round costs
   exactly one Firestore write and one read per real player, and why bots cost
   nothing at all.

   These two functions are the whole foundation of that, so they live in one
   place. Each game still generates its own content on top of them (a times-table
   sum, a sudoku grid, a hangman word) — that part is genuinely different.
═══════════════════════════════════════════════════════ */

/**
 * mulberry32 — small, fast, good-enough distribution for game content (NOT
 * cryptographic). Returns a function yielding floats in [0,1).
 */
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

/**
 * Mixes a room seed with a namespace/index into one well-distributed 32-bit int,
 * so independent draw streams (content vs. bot profiles, and each bot's own
 * stream) never overlap or correlate.
 */
export function hashSeed(seed, ns) {
  let h = (seed ^ Math.imul(ns + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

// The namespaces every game shares. Content draws start at 0 and run upwards by
// question/word index, so bots and names are pushed far out of the way.
export const CONTENT_NS = 0;
export const BOT_NS = 1_000_000;
export const NAME_NS = 2_000_000;
