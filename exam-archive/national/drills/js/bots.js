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

// How much longer one question takes than a times-table sum. Working out the
// relative molecular mass of Na₂CO₃ is not 7 × 8: it is four multiplications
// and a sum, so a bot racing at arithmetic pace would finish forty of them
// and beat every human in the room by a factor of five. Read off the room's
// operations, so joiners score the host's bots identically.
const RMM_PACE = 5;

// Fraction Bars is slower again: one point is finding the common denominator
// and then carrying about ten bars across, one at a time. Keyed off the room's
// ACTIVITY (see leaderboard.js) — its operations list is only a placeholder.
const ALG_PACE = 3;
export const BARS_PACE = 6;

export function botPaceFor(operations) {
  const ops = operations || [];
  if (ops.includes('rmm')) return RMM_PACE;
  return ops.some((o) => /^(alg|eq|base|bin|oct|hex|geo|sub|pct|roman|num|spell)/.test(o)) ? ALG_PACE : 1; // working an expression out (or spelling a long word) is not 7 × 8
}

export function simulateBotScore(seed, botSlot, timeLimitSec, pace = 1) {
  const rng = botRng(seed, botSlot);
  // Tuned so the best bot in a typical room (9 rolls) lands ~38-49 correct
  // over a 60s round: median ~39, p90 ~46, occasional outliers to ~52.
  const speed = (1.15 + rng() * 2.6) * pace; // baseline seconds per question (skill)
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

/* ── Spelling bots ────────────────────────────────────────────────────
   A spelling round has a fixed number of words and is ranked on words right,
   then on time (who got through the list first). So a spelling bot works
   through the words one by one: some it skips (no point, time still spent),
   and it stops when the words run out or the clock does. In Focus mode a
   slip puts the bot out, like a player: it is handed in as -1, off the board.
   Seconds per word are drawn around the round's own pace (6 s Normal, 3 s
   Focus), so the best bots finish with a little time to spare. */
export function simulateSpellingBot(seed, botSlot, timeLimitSec, words, focus) {
  const rng = botRng(seed, botSlot);
  const per = words ? timeLimitSec / words : 6;      // the level's seconds a word (the clock is words x that)
  const speed = per * (0.55 + rng() * 0.7);        // this bot's usual seconds per word
  const missRate = 0.04 + rng() * 0.16;            // a word it cannot spell
  let t = 0, score = 0;
  for (let w = 0; w < words; w++) {
    const took = speed * (0.6 + rng() * 0.8);
    if (t + took > timeLimitSec) return { score, timeMs: Math.round(timeLimitSec * 1000) };
    t += took;
    if (rng() < missRate) {
      if (focus) return { score: -1, timeMs: Math.round(t * 1000) };   // out on the first slip
      continue;
    }
    score += 1;
  }
  return { score, timeMs: Math.round(t * 1000) };
}

/* Soroban: a bot answers every sum (it never runs the box out) and gets it right more often with
   fewer digits and plain beads; its time is what it took to type the totals. */
export function simulateSorobanBot(seed, botSlot, cfg) {
  const rng = botRng(seed, botSlot);
  const c = cfg || {};
  const digits = c.digits || 1, count = c.count || 10, big = (c.tests || []).includes('big');
  const sure = Math.max(0.35, 0.95 - 0.07 * (digits - 1) - (big ? 0.06 : 0) - rng() * 0.18);
  const typing = 1.2 + digits * 0.55;
  let score = 0, t = 0;
  for (let i = 0; i < count; i++) {
    if (rng() < sure) score += 1;
    t += typing * (0.7 + rng() * 0.9);
  }
  return { score, timeMs: Math.round(t * 1000) };
}
