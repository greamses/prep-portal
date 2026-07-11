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
import { mulberry32, hashSeed } from './rng.js';
import { BOT_NAMES } from './bot-names.js';

const NAME_NS = 2_000_000;
const BOT_NS = 1_000_000;

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

// Correct units (cells/tiles) achieved by the round's end. `speed` is
// seconds-per-unit (skill), tuned for these puzzles' much slower
// deliberate pace than Drills' arithmetic — a strong bot lands roughly one
// correct unit every 6-12s, a weak one 15-30s, with occasional wasted time
// on a wrong guess. Never exceeds `totalUnits`.
export function simulateBotScore(seed, botSlot, timeLimitSec, totalUnits) {
  const rng = mulberry32(hashSeed(seed, BOT_NS + botSlot));
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
