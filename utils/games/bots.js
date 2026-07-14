/* ═══════════════════════════════════════════════════════
   GAMES — bot naming (shared by Drills, Puzzles, Geometry, Vocab)

   A bot is never written to Firestore: its name and its score are both derived
   from the room's seed, so every client sees the same opponents with the same
   results, for free.

   Naming is shared because it must be — two games' bots should feel like the
   same population of kids. SCORING is deliberately NOT shared: a hangman word is
   a much slower unit than a times-table sum, and a sudoku cell is different
   again, so each game keeps its own simulateBotScore() tuned to what a point
   actually costs there.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, NAME_NS, BOT_NS } from './rng.js';
import { BOT_NAMES } from './bot-names.js';

// A seeded Fisher-Yates shuffle of the whole name pool, so up to 10 bots in one
// room never collide — same seed/room -> same shuffle on every client.
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

/** The PRNG stream belonging to one bot — the basis of every game's score model. */
export function botRng(seed, botSlot) {
  return mulberry32(hashSeed(seed, BOT_NS + botSlot));
}
