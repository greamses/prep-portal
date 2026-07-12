/* ═══════════════════════════════════════════════════════
   GEOMETRY — deterministic bot simulation
   A bot's final score is derived purely from (seed, botSlot, timeLimit) —
   never written to or read from Firestore. Every client in a room computes
   the same number locally, so bot results are "free" (zero reads/writes)
   and identical across every real participant's screen. Same
   answer-and-advance pacing model as Drills' js/bots.js.
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

// A geometry question takes longer to reason through than an arithmetic
// fact, so bots are tuned slower than Drills' — a strong bot answers
// roughly one question every 4-9s, a weak one 10-20s, with occasional
// wasted time double-checking a wrong guess.
export function simulateBotScore(seed, botSlot, timeLimitSec) {
  const rng = mulberry32(hashSeed(seed, BOT_NS + botSlot));
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
