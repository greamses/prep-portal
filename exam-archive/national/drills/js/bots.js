/* ═══════════════════════════════════════════════════════
   DRILLS — deterministic bot simulation
   A bot's final score is derived purely from (seed, botSlot, timeLimit) —
   never written to or read from Firestore. Every client in a room computes
   the same number locally, so bot results are "free" (zero reads/writes)
   and identical across every real participant's screen.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, BOT_NS } from './rng.js';

export function simulateBotScore(seed, botSlot, timeLimitSec) {
  const rng = mulberry32(hashSeed(seed, BOT_NS + botSlot));
  const speed = 1.8 + rng() * 3.2; // baseline seconds per question (skill)
  const errorRate = 0.02 + rng() * 0.18; // chance a question costs a fumbled retry
  let elapsed = 0;
  let correct = 0;
  while (true) {
    let t = speed * (0.6 + rng() * 0.8); // per-question jitter
    if (rng() < errorRate) t += speed * (0.8 + rng() * 0.8); // retry penalty
    elapsed += t;
    if (elapsed > timeLimitSec) break;
    correct += 1;
  }
  return correct;
}
