/* ═══════════════════════════════════════════════════════
   PLANNER — end-of-round leaderboard

   One write + one read per player, no polling, bots free — the contract lives in
   /utils/games/leaderboard.js and is shared by every game. All this file decides
   is how a bot's score is worked out (see js/bots.js).
═══════════════════════════════════════════════════════ */
import { createLeaderboard } from '/utils/games/leaderboard.js';
import { simulateBotScore } from './bots.js';

export const finishRound = createLeaderboard({
  rooms: 'plannerRooms',
  // `a.difficulty` is the ROOM's content (main.js passes it through), so a
  // joiner scores the host's bots on the same brief size.
  scoreBot: (seed, slot, a) => simulateBotScore(seed, slot, a.timeLimit, a.difficulty),
});
