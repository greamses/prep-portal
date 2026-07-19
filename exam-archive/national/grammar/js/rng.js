/* ═══════════════════════════════════════════════════════
   GRAMMAR — seeded PRNG + the round's passage.

   Every client in a room shares one `seed`, so buildRound() picks the identical
   passage on every device with zero network traffic. Same primitives as the
   Drills and Vocab pages — the seeded-room contract is the whole reason bots
   and content cost nothing.

   ONE PASSAGE PER ROUND. Vocab deals a run of words because a word is a small
   unit; an edited passage is not. The round is a single sustained read, and the
   single Submit at the end is the point of the game — you are deciding, once,
   that you are finished. Dealing three passages back to back would turn a
   proof-reading task into a sprint through three of them.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS, BOT_NS } from '/utils/games/rng.js';
import { passagePool, buildPassage } from '/data/grammar/index.js';

export { mulberry32, hashSeed, BOT_NS };

/**
 * The round's passage, chosen from everything the grade can be dealt in the
 * chosen theme. Pure function of (seed, passages, grade) — which is what keeps
 * every player in the room editing the same prose.
 *
 * Returns the passage record itself; the tokens are built from it separately
 * (buildRoundTokens) because the FOCUS is a room setting that the passage
 * choice must not depend on: two players on the same seed get the same passage
 * whether they are hunting all four CUPS letters or only punctuation.
 */
export function buildRound({ seed, passages, grade }) {
  const pool = passagePool(passages, grade);
  if (!pool.length) return null;
  const rng = mulberry32(hashSeed(seed, CONTENT_NS));
  return pool[Math.floor(rng() * pool.length)];
}

/** The chosen passage as scoring tokens under the room's CUPS focus. */
export function buildRoundTokens(passage, focus) {
  return passage ? buildPassage(passage, focus) : [];
}
