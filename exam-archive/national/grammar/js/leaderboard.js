/* ═══════════════════════════════════════════════════════
   GRAMMAR — end-of-round leaderboard

   One write + one read per player, no polling, bots free — the contract lives
   in /utils/games/leaderboard.js and is shared by every game. All this file
   decides is how a bot's result is worked out (js/bots.js) and what order the
   round ranks in.
═══════════════════════════════════════════════════════ */
import { createLeaderboard } from '/utils/games/leaderboard.js';
import { simulateBotScore } from './bots.js';

// Rank order:
//   1. highest score        — errors caught PLUS errors correctly named (C/U/P/S)
//   2. fastest to submit    — timeMs, low → high
//   3. fewest false edits   — clean words the player "corrected" anyway
//
// The third key is what stops this being a typing race. Two editors who caught
// the same errors in the same time are split by who left the correct prose
// alone — which is the actual skill a proof-reader is being taught.
//
// A player with no metric (an unfinished / legacy row) sorts last on that key.
const num = (v, fallback) => (typeof v === 'number' ? v : fallback);
export const rankGrammar = (a, b) =>
  (b.score - a.score)
  || (num(a.timeMs, Infinity) - num(b.timeMs, Infinity))
  || (num(a.falseEdits, Infinity) - num(b.falseEdits, Infinity));

export const finishRound = createLeaderboard({
  rooms: 'grammarRooms',
  metricKeys: ['timeMs', 'falseEdits', 'caught', 'tagged'],
  scoreBot: (seed, slot, a) => simulateBotScore(seed, slot, a.timeLimit, a.errorTotal),
  compare: rankGrammar,
});
