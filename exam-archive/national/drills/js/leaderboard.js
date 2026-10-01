/* ═══════════════════════════════════════════════════════
   DRILLS — end-of-round leaderboard

   One write + one read per player, no polling, bots free — the contract lives in
   /utils/games/leaderboard.js and is shared by every game. All this file decides
   is how a bot's score is worked out, which is genuinely this game's own tuning
   (see js/bots.js).
═══════════════════════════════════════════════════════ */
import { createLeaderboard } from '/utils/games/leaderboard.js';
import { simulateBotScore, botPaceFor, BARS_PACE } from './bots.js';

export const finishRound = createLeaderboard({
  rooms: 'drillRooms',
  // `a.*` is the ROOM's content (main.js passes it through). A grid cell is just
  // a times-table product, so a grid room scores bots at plain arithmetic pace
  // (uncapped — grids stream forever); every other room slows the bot to the
  // pace of what it is actually drilling. A bars room is slowest of all: one
  // point there is a whole line of bars carried across.
  scoreBot: (seed, slot, a) => (a.activity === 'grid'
    ? simulateBotScore(seed, slot, a.timeLimit, 1)
    : a.activity === 'bars'
    ? simulateBotScore(seed, slot, a.timeLimit, BARS_PACE)
    : simulateBotScore(seed, slot, a.timeLimit, botPaceFor(a.operations))),
});
