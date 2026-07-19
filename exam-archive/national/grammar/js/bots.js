/* ═══════════════════════════════════════════════════════
   GRAMMAR — deterministic bot simulation

   A bot's final result is derived purely from (seed, botSlot, timeLimit,
   errorTotal) — never written to or read from Firestore. Every client in a
   room computes the same numbers locally, so bots are free (zero reads/writes)
   and identical on every real participant's screen.

   A bot's result is { score, timeMs, falseEdits } — the three things the round
   ranks on, in that order (see leaderboard.js).

   `score` is caught + correctly-tagged, exactly as a human's is, so it runs
   0 … errorTotal × 2. `errorTotal` caps a bot the same way it caps a human:
   you cannot catch errors that were never planted.

   SLOT 0 is the "ACE": a benchmark that catches AND correctly names every
   error with no false edits, so on score and accuracy it cannot be out-done —
   it can only be beaten on SPEED. Its time is a hard-but-possible fraction of
   the round, so to win you must both sweep the passage AND submit faster than
   the ace. Lower ACE_FRACTION = harder to beat.

   The tuning below is deliberately harsher than Vocab's. Proof-reading rewards
   a specific and uncommon habit — reading what is actually on the page instead
   of what you expect to be there — so a mid-table bot misses a fair few, and
   the ones it does catch it often cannot NAME. Tagging is the harder half, and
   the bots reflect that.
═══════════════════════════════════════════════════════ */
import { botRng, botName } from '/utils/games/bots.js';

// Naming is shared (bots should feel like one population of kids across every
// game); SCORING is not — see below.
export { botName };

const ACE_FRACTION = 0.55;

export function simulateBotScore(seed, botSlot, timeLimitSec, errorTotal = 10) {
  if (botSlot === 0) {
    // The ace: a clean sweep, every error named, submitted at 55% of the clock.
    return {
      score: errorTotal * 2,
      caught: errorTotal,
      tagged: errorTotal,
      falseEdits: 0,
      timeMs: Math.round(timeLimitSec * ACE_FRACTION * 1000),
    };
  }

  const rng = botRng(seed, botSlot);
  const catchRate = 0.30 + rng() * 0.55;  // 30-85% of the errors spotted
  const tagRate = 0.35 + rng() * 0.50;    // …and 35-85% of THOSE named right
  const falseRate = rng() * 0.16;         // some readers "correct" clean words
  const secsPerToken = 0.9 + rng() * 1.6; // reading pace over the whole passage

  let caught = 0, tagged = 0, falseEdits = 0;
  for (let i = 0; i < errorTotal; i++) {
    if (rng() < catchRate) {
      caught += 1;
      if (rng() < tagRate) tagged += 1;
    }
    if (rng() < falseRate) falseEdits += 1;
  }

  // How long the read took. A bot that catches more is a bot that read more
  // carefully, so thoroughness costs time — which is exactly the trade the
  // human player is making. Anything over the clock means it never submitted
  // early and simply ran out of time.
  const passSecs = errorTotal * secsPerToken * (3 + catchRate * 5);
  const finishedEarly = passSecs < timeLimitSec;

  return {
    score: caught + tagged,
    caught,
    tagged,
    falseEdits,
    timeMs: Math.round((finishedEarly ? passSecs : timeLimitSec) * 1000),
  };
}
