/* ═══════════════════════════════════════════════════════
   VOCAB — seeded PRNG + word selection
   Every client in a room shares one `seed`, so wordAt(seed, i) draws the
   identical word for the identical letter on every device, with zero
   network traffic. Same primitives as the Drills page — the seeded-room
   contract is the whole reason bots and questions cost nothing.
═══════════════════════════════════════════════════════ */
import { poolFor, lettersFor } from '/data/vocab/index.js';

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

// Mixes a room seed with a namespace/index into one well-distributed 32-bit
// int, so independent draw streams (word picks vs. bot profiles, and each
// bot's own stream) never overlap or correlate.
export function hashSeed(seed, ns) {
  let h = (seed ^ Math.imul(ns + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export const WORD_NS = 0;
export const BOT_NS = 1_000_000;

export const MAX_WRONG = 6; // head, body, two arms, two legs

// The alphabet this room actually marches through (see lettersFor: a letter
// with no word at this subject/grade is skipped rather than faked).
export function roundLetters(subject, grade) {
  return lettersFor(subject, grade);
}

// The i-th stop on the march: which letter, which word, and its clue.
// Deterministic in (seed, i) — so every player in the room is staring at
// the same board.
export function wordAt(seed, index, { subject, grade }) {
  const letters = roundLetters(subject, grade);
  if (!letters.length || index >= letters.length) return null;
  const letter = letters[index];
  const pool = poolFor(subject, letter, grade);
  const rng = mulberry32(hashSeed(seed, WORD_NS + index));
  const pick = pool[Math.floor(rng() * pool.length)];
  return { letter, word: pick.w, clue: pick.d };
}

// Only A–Z is guessable. A hyphen or space ("x-axis") is scenery: shown from
// the start, never guessed, never counted towards solving the word.
export const isGuessable = (ch) => /[a-z]/i.test(ch);

// The letters still hidden on the board. A word is solved when this is empty.
export function hiddenLetters(word, revealed) {
  return [...word.toUpperCase()].filter((ch) => isGuessable(ch) && !revealed.has(ch));
}
