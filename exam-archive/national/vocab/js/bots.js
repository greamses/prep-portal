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

// A bot's result is { score (words solved), timeMs (how long it took), wrong
// (total wrong guesses) } — the three things the round ranks on, in that order
// (see leaderboard.js). Everything is derived from (seed, slot), so every client
// computes the same bot locally, for free.
//
// `wordCount` is however many words the round holds — 26-ish for an A-Z march,
// up to 50 for a topic. It caps a bot the same way it caps a human: you cannot
// solve words that were never dealt.
//
// SLOT 0 is the "ACE": a benchmark that solves EVERY word with NO wrong guesses,
// so on score and accuracy it cannot be out-done — it can only be beaten on
// SPEED. Its time is a hard-but-possible fraction of the round, so to win you
// must both finish everything AND finish faster than the ace. Lower ACE_FRACTION
// = harder to beat.
const ACE_FRACTION = 0.55;

export function simulateBotScore(seed, botSlot, timeLimitSec, wordCount = 26) {
  if (botSlot === 0) {
    // The ace: a clean sweep, finished at ACE_FRACTION of the clock.
    return { score: wordCount, wrong: 0, timeMs: Math.round(timeLimitSec * ACE_FRACTION * 1000) };
  }

  const rng = botRng(seed, botSlot);
  const secsPerWord = 8 + rng() * 12;   // 8-20s to crack a word (skill)
  const failRate = 0.06 + rng() * 0.30; // chance it hangs on a word instead
  const wrongPerWord = 0.5 + rng() * 1.8; // avg wrong guesses on a word it solves

  let elapsed = 0, solved = 0, wrong = 0;
  for (let i = 0; i < wordCount; i++) {
    const hung = rng() < failRate;
    // A word it loses is a word it spent all six lives on — dearer than one it gets.
    const t = secsPerWord * (0.7 + rng() * 0.6) * (hung ? 1.45 : 1);
    if (elapsed + t > timeLimitSec) break; // out of time mid-word
    elapsed += t;
    if (hung) wrong += 6;                  // all six lives spent
    else { solved += 1; wrong += Math.round(rng() * wrongPerWord); }
  }
  const finishedAll = solved === wordCount;
  return { score: solved, wrong, timeMs: Math.round((finishedAll ? elapsed : timeLimitSec) * 1000) };
}
