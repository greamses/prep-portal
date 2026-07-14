/* ═══════════════════════════════════════════════════════
   VOCAB — seeded PRNG + the round's word list

   Every client in a room shares one `seed`, so buildRound() produces the
   identical list of words in the identical order on every device, with zero
   network traffic. Same primitives as the Drills page — the seeded-room
   contract is the whole reason bots and content cost nothing.

   Two shapes of round:
     az     — one word per letter, A through Z, drawn from everything the
              chosen grade can meet. The letter is the ONLY thing the player
              knows in advance; it is not filled in for them.
     topic  — that topic's ~50 words, seeded-shuffled. No alphabet at all.
═══════════════════════════════════════════════════════ */
import { gradePool, topicPool, LETTERS } from '/data/vocab/index.js';

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

/**
 * The whole round, in order: [{ word, clue, letter }]. `letter` is set only in
 * A–Z mode, where it labels the stop ("D · word 4 of 26"); it is NOT revealed
 * on the board. Pure function of (seed, mode, content) — which is what keeps
 * every player in the room staring at the same board.
 */
export function buildRound({ seed, words, subject, grade, mode, topic }) {
  if (mode === 'topic') {
    const list = topicPool(words, topic);
    const rng = mulberry32(hashSeed(seed, WORD_NS));
    // Fisher-Yates off the shared seed: same room, same order, no sync.
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.map((x) => ({ word: x.w, clue: x.d, letter: null }));
  }

  // A–Z: one word per letter, from every topic this grade is offered. A letter
  // the subject can't field a word for is skipped rather than faked, so the
  // march bends around a gap instead of breaking on it.
  const buckets = new Map();
  for (const entry of gradePool(words, subject, grade)) {
    const L = entry.w[0].toUpperCase();
    if (!buckets.has(L)) buckets.set(L, []);
    buckets.get(L).push(entry);
  }

  const round = [];
  LETTERS.forEach((L, i) => {
    const bucket = buckets.get(L);
    if (!bucket || !bucket.length) return;
    const rng = mulberry32(hashSeed(seed, WORD_NS + i));
    const pick = bucket[Math.floor(rng() * bucket.length)];
    round.push({ word: pick.w, clue: pick.d, letter: L });
  });
  return round;
}

// Only A–Z is guessable. A hyphen ("x-axis") is scenery: shown from the start,
// never guessed, never counted towards solving the word.
export const isGuessable = (ch) => /[a-z]/i.test(ch);

// The letters still hidden on the board. A word is solved when this is empty.
export function hiddenLetters(word, revealed) {
  return [...word.toUpperCase()].filter((ch) => isGuessable(ch) && !revealed.has(ch));
}
