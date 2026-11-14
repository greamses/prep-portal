/* ═══════════════════════════════════════════════════════
   DRILLS — end-of-round leaderboard

   One write + one read per player, no polling, bots free — the contract lives in
   /utils/games/leaderboard.js and is shared by every game. All this file decides
   is how a bot's score is worked out, which is genuinely this game's own tuning
   (see js/bots.js), and the order of the board.
═══════════════════════════════════════════════════════ */
import { createLeaderboard } from '/utils/games/leaderboard.js';
import { simulateBotScore, botPaceFor, BARS_PACE, simulateSpellingBot } from './bots.js';
import { wordsInSets } from './spelling.js';

const isSpellingRoom = (a) => (a.operations || []).some((o) => /^spell/.test(o));

/* Words right first; then, for spelling, who got there first (`timeMs`, the
   time taken). Rounds without a time keep the old order: score alone. A Focus
   drop-out is handed in as -1, which sorts last (and the page leaves it off). */
export const rankDrill = (a, b) =>
  (b.score - a.score) || ((a.timeMs ?? Infinity) - (b.timeMs ?? Infinity)) || 0;

export const finishRound = createLeaderboard({
  rooms: 'drillRooms',
  metricKeys: ['timeMs'],
  compare: rankDrill,
  // `a.*` is the ROOM's content (main.js passes it through). A grid cell is just
  // a times-table product, so a grid room scores bots at plain arithmetic pace
  // (uncapped — grids stream forever); every other room slows the bot to the
  // pace of what it is actually drilling. A bars room is slowest of all: one
  // point there is a whole line of bars carried across. A spelling room has a
  // fixed list of words and a time, so its bots work through that list.
  scoreBot: (seed, slot, a) => (isSpellingRoom(a)
    ? simulateSpellingBot(seed, slot, a.timeLimit, wordsInSets(a.tables), !!a.spellFocus)
    : a.activity === 'grid'
    ? simulateBotScore(seed, slot, a.timeLimit, 1)
    : a.activity === 'bars'
    ? simulateBotScore(seed, slot, a.timeLimit, BARS_PACE)
    : simulateBotScore(seed, slot, a.timeLimit, botPaceFor(a.operations))),
});
