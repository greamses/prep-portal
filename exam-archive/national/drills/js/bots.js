/* ═══════════════════════════════════════════════════════
   DRILLS — deterministic bot simulation
   A bot's final score is derived purely from (seed, botSlot, timeLimit) —
   never written to or read from Firestore. Every client in a room computes
   the same number locally, so bot results are "free" (zero reads/writes)
   and identical across every real participant's screen.
═══════════════════════════════════════════════════════ */
import { botRng, botName } from '/utils/games/bots.js';

// Naming is shared (bots should feel like one population of kids across every
// game); SCORING is not — see below.
export { botName };

export function simulateBotScore(seed, botSlot, timeLimitSec) {
  const rng = botRng(seed, botSlot);
  // Tuned so the best bot in a typical room (9 rolls) lands ~38-49 correct
  // over a 60s round: median ~39, p90 ~46, occasional outliers to ~52.
  const speed = 1.15 + rng() * 2.6; // baseline seconds per question (skill)
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
