/* ═══════════════════════════════════════════════════════
   DRILLS — end-of-round leaderboard

   One write + one read per player, no polling, bots free — the contract lives in
   /utils/games/leaderboard.js and is shared by every game. All this file decides
   is how a bot's score is worked out, which is genuinely this game's own tuning
   (see js/bots.js).
═══════════════════════════════════════════════════════ */
import { createLeaderboard } from '/utils/games/leaderboard.js';
import { simulateBotScore, botPaceFor, simulateGridScore } from './bots.js';

export const finishRound = createLeaderboard({
  rooms: 'drillRooms',
  // `a.*` is the ROOM's content (main.js passes it through). A grid room scores
  // bots on cells filled (capped at the grid's blank count); every other room
  // slows the bot to the pace of what it is actually drilling.
  scoreBot: (seed, slot, a) => (a.activity === 'grid'
    ? simulateGridScore(seed, slot, a.timeLimit, a.gridSize, a.gridBlanks)
    : simulateBotScore(seed, slot, a.timeLimit, botPaceFor(a.operations))),
});
