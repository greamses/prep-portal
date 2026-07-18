/* ═══════════════════════════════════════════════════════
   VOCAB — end-of-round leaderboard

   One write + one read per player, no polling, bots free — the contract lives in
   /utils/games/leaderboard.js and is shared by every game. All this file decides
   is how a bot's score is worked out, which is genuinely this game's own tuning
   (see js/bots.js).
═══════════════════════════════════════════════════════ */
import { createLeaderboard } from '/utils/games/leaderboard.js';
import { simulateBotScore } from './bots.js';

// Rank order, in the order the user asked for:
//   1. most words correct        (score, high → low)
//   2. fastest to complete       (timeMs, low → high)
//   3. fewest wrong guesses       (wrong, low → high)
// A player with no metric (an unfinished / legacy row) sorts last on that key.
const num = (v, fallback) => (typeof v === 'number' ? v : fallback);
export const rankVocab = (a, b) =>
  (b.score - a.score)
  || (num(a.timeMs, Infinity) - num(b.timeMs, Infinity))
  || (num(a.wrong, Infinity) - num(b.wrong, Infinity));

export const finishRound = createLeaderboard({
  rooms: 'vocabRooms',
  scoreBot: (seed, slot, a) => simulateBotScore(seed, slot, a.timeLimit, a.wordCount),
  compare: rankVocab,
});
