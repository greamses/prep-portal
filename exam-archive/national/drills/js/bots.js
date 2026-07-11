/* ═══════════════════════════════════════════════════════
   DRILLS — deterministic bot simulation
   A bot's final score is derived purely from (seed, botSlot, timeLimit) —
   never written to or read from Firestore. Every client in a room computes
   the same number locally, so bot results are "free" (zero reads/writes)
   and identical across every real participant's screen.
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

export function simulateBotScore(seed, botSlot, timeLimitSec) {
  const rng = mulberry32(hashSeed(seed, BOT_NS + botSlot));
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
