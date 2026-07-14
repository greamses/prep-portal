/* ═══════════════════════════════════════════════════════
   VOCAB — deterministic bot simulation
   A bot's final score is derived purely from (seed, botSlot, timeLimit,
   letterCount) — never written to or read from Firestore. Every client in
   a room computes the same number locally, so bots are free (zero
   reads/writes) and identical on every real participant's screen.
═══════════════════════════════════════════════════════ */
import { botRng, botName } from '/utils/games/bots.js';

// Naming is shared (bots should feel like one population of kids across every
// game); SCORING is not — see below.
export { botName };

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
  const rng = botRng(seed, botSlot);
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
