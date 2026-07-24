/* ═══════════════════════════════════════════════════════
   DRILLS — end-of-round leaderboard

   One write + one read per player, no polling, bots free — the contract lives in
   /utils/games/leaderboard.js and is shared by every game. All this file decides
   is how a bot's score is worked out, which is genuinely this game's own tuning
   (see js/bots.js).
═══════════════════════════════════════════════════════ */
import { createLeaderboard } from '/utils/games/leaderboard.js';
import { simulateBotScore, botPaceFor } from './bots.js';

export const finishRound = createLeaderboard({
  rooms: 'drillRooms',
  // `a.operations` is the ROOM's content (main.js passes it through), so a bot
  // is slowed to the pace of what this room is actually drilling.
  scoreBot: (seed, slot, a) => simulateBotScore(seed, slot, a.timeLimit, botPaceFor(a.operations)),
});
