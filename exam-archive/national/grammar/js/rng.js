/* ═══════════════════════════════════════════════════════
   GRAMMAR — seeded PRNG + the round's passage.

   Every client in a room shares one `seed`, so buildRound() picks the identical
   passage on every device with zero network traffic. Same primitives as the
   Drills and Vocab pages — the seeded-room contract is the whole reason bots
   and content cost nothing.

   SEVERAL PASSAGES, ONE AT A TIME. The round deals `count` passages, but the
   play surface only ever shows one of them: you edit it, press Next, and the
   following one takes its place. That paging is what makes a multi-passage
   round a proof-reading task rather than a sprint — handed three passages at
   once, a player skims all three for the easy spelling errors and never reads
   any of them properly.

   There is still exactly ONE Submit, at the end, over everything dealt. The
   decision the game is actually about — "am I finished?" — is not worth making
   three times in a row, and asking for it per passage would rank players on how
   fast they gave up on each one.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS, BOT_NS } from '/utils/games/rng.js';
import { passagePool, buildPassage } from '/data/grammar/index.js';

export { mulberry32, hashSeed, BOT_NS };

/**
 * The round's passages, in the order they will be paged through, drawn from
 * everything the grade can be dealt in the chosen theme. Pure function of
 * (seed, passages, grade, count) — which is what keeps every player in the room
 * editing the same prose in the same order.
 *
 * Drawn WITHOUT replacement: the same passage twice in one round is the same
 * errors twice, which tests memory rather than editing. A pool smaller than
 * `count` therefore deals short rather than repeating — a Grade 4 theme with
 * two passages written for it is a two-passage round, not a padded three.
 *
 * Returns the passage records themselves; the tokens are built from each one
 * separately (buildRoundTokens) because the FOCUS is a room setting that the
 * passage choice must not depend on: two players on the same seed get the same
 * passages whether they are hunting all four CUPS letters or only punctuation.
 */
export function buildRound({ seed, passages, grade, count = 1 }) {
  const pool = passagePool(passages, grade);
  if (!pool.length) return [];
  const rng = mulberry32(hashSeed(seed, CONTENT_NS));
  // Seeded Fisher–Yates, then take from the top. Shuffling the whole pool
  // rather than drawing one at a time keeps the draw a single pure expression
  // of the seed, so client A's passage 2 is always client B's passage 2.
  const deck = pool.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, Math.max(1, Math.min(count, deck.length)));
}

/** The chosen passage as scoring tokens under the room's CUPS focus. */
export function buildRoundTokens(passage, focus) {
  return passage ? buildPassage(passage, focus) : [];
}
