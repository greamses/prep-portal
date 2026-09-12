/* ============================================================================
   NUMBER MATCH — a round
   ----------------------------------------------------------------------------
   A round is: a stretch of the number line laid out as a grid of numerals, a
   handful of TARGETS drawn from it, and every chosen form of every target
   shuffled into a deck of notes. The player puts each note on the numeral it
   belongs to; a target is done when all of its notes are home, which is the
   "group all the cards that mean the same value" the activity is for.

   Pure, and seeded, so a round can be rebuilt exactly in a test.
   ========================================================================== */

import { formsFor, cardFor, FORM_IDS } from "./forms.js";

export const RANGES = [
  { id: "1-20", label: "1 to 20", lo: 1, hi: 20, cols: 5 },
  { id: "20-50", label: "20 to 50", lo: 20, hi: 50, cols: 6 },
  { id: "50-100", label: "50 to 100", lo: 50, hi: 100, cols: 10 },
];

export const rangeById = (id) => RANGES.find((r) => r.id === id) || RANGES[0];

/** The numerals the grid shows, in order. */
export function gridOf(range) {
  const out = [];
  for (let n = range.lo; n <= range.hi; n++) out.push(n);
  return out;
}

/* A small seeded stream, so a round is reproducible. */
export function makeRng(seed = 1) {
  let s = (seed >>> 0) || 1;
  const next = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
  return {
    float: next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
  };
}

export function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng.float() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw the targets for a round.
 *
 * A number is only worth drawing if at least two of the chosen forms can carry
 * it — one lone note is a matching exercise with nothing to group.
 */
export function pickTargets(rng, range, forms, count) {
  const able = gridOf(range).filter((n) => formsFor(n, forms).length >= 2);
  const bag = shuffle(rng, able);
  return bag.slice(0, Math.min(count, bag.length)).sort((a, b) => a - b);
}

/**
 * Build a round.
 *
 *   range   one of RANGES, or its id
 *   forms   which representations to use (never the numeral — see forms.js)
 *   count   how many numbers to find at once
 *   seed    the stream this round is drawn from
 *
 * → { range, grid, targets, cards, perTarget }
 */
export function buildRound({ range = RANGES[0], forms = FORM_IDS, count = 4, seed = 1 } = {}) {
  const r = typeof range === "string" ? rangeById(range) : range;
  const use = FORM_IDS.filter((id) => forms.includes(id));
  const rng = makeRng(seed);
  const targets = pickTargets(rng, r, use, count);

  const cards = [];
  const perTarget = new Map();
  for (const n of targets) {
    const mine = formsFor(n, use).map((f) => cardFor(n, f.id)).filter(Boolean);
    perTarget.set(n, mine.length);
    cards.push(...mine);
  }

  return { range: r, grid: gridOf(r), targets, cards: shuffle(rng, cards), perTarget };
}

/** Is this round finished — every note home on its numeral? */
export function isDone(round, placed) {
  return round.cards.every((c) => placed.get(c.id) === c.n);
}
