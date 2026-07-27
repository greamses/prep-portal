/* ═══════════════════════════════════════════════════════
   PLANNER — deterministic bot simulation

   A bot's final score is derived purely from (seed, botSlot, timeLimit,
   difficulty) — never written to or read from Firestore. Every client in a room
   computes the same number locally, so bots cost nothing and read identically on
   every screen (same contract as the other games' bots.js).

   The score is out of 2N (N sequence points + N timing points, N = event count).
   A bot rolls a skill level, then how much of the brief it works out in the time
   is that skill scaled by how much clock it had — harder briefs (more events,
   longer clue chains) get proportionally less finished.
═══════════════════════════════════════════════════════ */
import { botRng, botName } from '/utils/games/bots.js';
import { eventCount } from '/data/planner/scenarios.js';
import { weekCellCount } from '/data/planner/routines.js';

export { botName };

export function simulateBotScore(seed, botSlot, timeLimitSec, difficulty, format) {
  const rng = botRng(seed, botSlot);

  // Weekly routine: one point per correctly-timed cell, out of the grid's cell
  // count. A bot deduces the cadence to some skill, scaled by the clock.
  if (format === 'week') {
    const max = weekCellCount(difficulty);
    const skill = 0.4 + rng() * 0.55; // 0.40–0.95
    const pace = 0.8 + rng() * 0.45;
    return Math.max(0, Math.min(max, Math.round(max * Math.min(1, skill * pace))));
  }

  const N = eventCount(difficulty);
  const max = 2 * N;
  // Skill: the fraction of the brief this bot would finish given ample time.
  const skill = 0.45 + rng() * 0.5; // 0.45–0.95
  // Time pressure: the clock is scaled to the brief (see main.js), so a bot that
  // reads/works at an average pace lands near `skill`; a slow one falls short.
  const pace = 0.8 + rng() * 0.45; // 0.8–1.25 of the "expected" solving speed
  const done = Math.min(1, skill * pace);
  // A small independent slip on timing vs sequence so scores aren't always even.
  const seq = Math.round(N * Math.min(1, done * (0.9 + rng() * 0.2)));
  const timing = Math.round(N * Math.min(1, done * (0.85 + rng() * 0.2)));
  return Math.max(0, Math.min(max, seq + timing));
}
