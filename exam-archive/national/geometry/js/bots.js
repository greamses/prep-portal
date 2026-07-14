/* ═══════════════════════════════════════════════════════
   GEOMETRY — deterministic bot simulation
   A bot's final score is derived purely from (seed, botSlot, timeLimit) —
   never written to or read from Firestore. Every client in a room computes
   the same number locally, so bot results are "free" (zero reads/writes)
   and identical across every real participant's screen. Same
   answer-and-advance pacing model as Drills' js/bots.js.
═══════════════════════════════════════════════════════ */
import { botRng, botName } from '/utils/games/bots.js';

// Naming is shared (bots should feel like one population of kids across every
// game); SCORING is not — see below.
export { botName };

// A geometry question takes longer to reason through than an arithmetic
// fact, so bots are tuned slower than Drills' — a strong bot answers
// roughly one question every 4-9s, a weak one 10-20s, with occasional
// wasted time double-checking a wrong guess.
export function simulateBotScore(seed, botSlot, timeLimitSec) {
  const rng = botRng(seed, botSlot);
  const speed = 4 + rng() * 5;
  const errorRate = 0.04 + rng() * 0.2;
  let elapsed = 0;
  let correct = 0;
  while (true) {
    let t = speed * (0.6 + rng() * 0.8);
    if (rng() < errorRate) t += speed * (0.8 + rng() * 0.8);
    elapsed += t;
    if (elapsed > timeLimitSec) break;
    correct += 1;
  }
  return correct;
}
