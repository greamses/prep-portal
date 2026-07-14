/* ═══════════════════════════════════════════════════════
   VOCAB — deterministic bot simulation
   A bot's final score is derived purely from (seed, botSlot, timeLimit,
   letterCount) — never written to or read from Firestore. Every client in
   a room computes the same number locally, so bots are free (zero
   reads/writes) and identical on every real participant's screen.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, BOT_NS } from './rng.js';
import { BOT_NAMES } from './bot-names.js';

const NAME_NS = 2_000_000;

// A seeded Fisher-Yates shuffle of the whole name pool, so up to 10 bots in
// one room never collide — same seed/room -> same shuffle on every client.
function shuffledNameIndices(seed) {
  const order = BOT_NAMES.map((_, i) => i);
  const rng = mulberry32(hashSeed(seed, NAME_NS));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function botName(seed, botSlot) {
  const order = shuffledNameIndices(seed);
  return BOT_NAMES[order[botSlot % order.length]];
}

// Scoring here counts WORDS SOLVED, not questions answered — a hangman word
// is a much slower unit than a times-table sum, so the numbers are small
// (roughly 4-9 solved in a two-minute round) and the tuning is its own.
// A bot that runs out of lives on a word still burns the time it spent
// there and scores nothing for it, exactly like a human.
//
// `wordCount` is however many words the round actually holds — 26-ish for an
// A-Z march, up to 50 for a topic. It caps the bot the same way it caps a
// human: you cannot solve words that were never dealt.
export function simulateBotScore(seed, botSlot, timeLimitSec, wordCount = 26) {
  const rng = mulberry32(hashSeed(seed, BOT_NS + botSlot));
  const secsPerWord = 8 + rng() * 12; // 8-20s to crack a word (skill)
  const failRate = 0.05 + rng() * 0.28; // chance the bot hangs on a word instead

  let elapsed = 0;
  let solved = 0;
  for (let i = 0; i < wordCount; i++) {
    const hung = rng() < failRate;
    // A word it loses is a word it spent all six lives on — dearer than one
    // it gets.
    const t = secsPerWord * (0.7 + rng() * 0.6) * (hung ? 1.45 : 1);
    elapsed += t;
    if (elapsed > timeLimitSec) break;
    if (!hung) solved += 1;
  }
  return solved;
}
