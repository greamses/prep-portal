/* ═══════════════════════════════════════════════════════
   PUZZLES — deterministic bot simulation
   A bot's final score is derived purely from (seed, botSlot, timeLimit,
   totalUnits) — never written to or read from Firestore. Every client in
   a room computes the same number locally, so bot results are "free"
   (zero reads/writes) and identical across every real participant's
   screen. Same approach as Drills' js/bots.js, retuned for these puzzles'
   much slower per-move pace. `totalUnits` is generic — Sudoku's editable
   cell count, Slider's tile count, whatever the active puzzle counts as
   "correct" — bots don't need to know which.
═══════════════════════════════════════════════════════ */
import { botRng, botName } from '/utils/games/bots.js';

// Naming is shared (bots should feel like one population of kids across every
// game); SCORING is not — see below.
export { botName };

// Correct units (cells/tiles) achieved by the round's end. `speed` is
// seconds-per-unit (skill), tuned for these puzzles' much slower
// deliberate pace than Drills' arithmetic — a strong bot lands roughly one
// correct unit every 6-12s, a weak one 15-30s, with occasional wasted time
// on a wrong guess. Never exceeds `totalUnits`.
export function simulateBotScore(seed, botSlot, timeLimitSec, totalUnits) {
  const rng = botRng(seed, botSlot);
  const speed = 6 + rng() * 22; // baseline seconds per correct unit (skill)
  const errorRate = 0.08 + rng() * 0.3; // chance a unit costs a wasted guess
  let elapsed = 0;
  let correct = 0;
  while (correct < totalUnits) {
    let t = speed * (0.6 + rng() * 0.8); // per-unit jitter
    if (rng() < errorRate) t += speed * (0.5 + rng() * 0.7); // wasted-guess penalty
    elapsed += t;
    if (elapsed > timeLimitSec) break;
    correct += 1;
  }
  return correct;
}
