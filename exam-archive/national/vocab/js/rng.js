/* ═══════════════════════════════════════════════════════
   VOCAB — seeded PRNG + the round's word list

   Every client in a room shares one `seed`, so buildRound() produces the
   identical list of words in the identical order on every device, with zero
   network traffic. Same primitives as the Drills page — the seeded-room
   contract is the whole reason bots and content cost nothing.

   Two shapes of round:
     az     — one word per letter, A through Z, drawn from everything the
              chosen grade can meet. The letter is the ONLY thing the player
              knows in advance; it is not filled in for them.
     topic  — that topic's ~50 words, seeded-shuffled. No alphabet at all.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS, BOT_NS } from '/utils/games/rng.js';

export { mulberry32, hashSeed, BOT_NS };

import { gradePool, topicPool, LETTERS } from '/data/vocab/index.js';

// The seeded-room primitives are shared by every game (see /utils/games/rng.js):
// one seed, one identical round on every client, with nothing synced.

export const MAX_WRONG = 6; // head, body, two arms, two legs

/**
 * The whole round, in order: [{ word, clue, letter }]. `letter` is set only in
 * A–Z mode, where it labels the stop ("D · word 4 of 26"); it is NOT revealed
 * on the board. Pure function of (seed, mode, content) — which is what keeps
 * every player in the room staring at the same board.
 */
export function buildRound({ seed, words, subject, grade, mode, topic }) {
  if (mode === 'topic') {
    // grade is passed so a drawn topic that tiers its entries by difficulty
    // (the body map) deals only what this grade is meant to meet.
    const list = topicPool(words, topic, grade);
    const rng = mulberry32(hashSeed(seed, CONTENT_NS));
    // Fisher-Yates off the shared seed: same room, same order, no sync.
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    // `element` (periodic table), `country` (world map), `state` (Nigeria map),
    // `organ` (body map) and `part` (a single-organ map) are present only for
    // the drawn topics — the game renders the drawn table/map/figure in place
    // of a text clue. `structure` (the IUPAC naming topics) carries a SMILES so
    // the game can draw the compound.
    return list.map((x) => ({
      word: x.w, clue: x.d, letter: null,
      element: x.element || null, country: x.country || null, state: x.state || null,
      organ: x.organ || null, part: x.part || null,
      structure: x.smiles ? { smiles: x.smiles, formula: x.formula || null } : null,
    }));
  }

  // A–Z: one word per letter, from every topic this grade is offered. A letter
  // the subject can't field a word for is skipped rather than faked, so the
  // march bends around a gap instead of breaking on it.
  const buckets = new Map();
  for (const entry of gradePool(words, subject, grade)) {
    const L = entry.w[0].toUpperCase();
    if (!buckets.has(L)) buckets.set(L, []);
    buckets.get(L).push(entry);
  }

  const round = [];
  LETTERS.forEach((L, i) => {
    const bucket = buckets.get(L);
    if (!bucket || !bucket.length) return;
    const rng = mulberry32(hashSeed(seed, CONTENT_NS + i));
    const pick = bucket[Math.floor(rng() * bucket.length)];
    round.push({ word: pick.w, clue: pick.d, letter: L });
  });
  return round;
}

// Only A–Z is guessable. A hyphen ("x-axis") is scenery: shown from the start,
// never guessed, never counted towards solving the word.
export const isGuessable = (ch) => /[a-z]/i.test(ch);

// The letters still hidden on the board. A word is solved when this is empty.
export function hiddenLetters(word, revealed) {
  return [...word.toUpperCase()].filter((ch) => isGuessable(ch) && !revealed.has(ch));
}
