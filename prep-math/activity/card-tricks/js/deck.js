/* ============================================================================
   CARD TRICKS — the pack, and the arithmetic under the two tricks
   ----------------------------------------------------------------------------
   Nothing in here touches the page, so node can run it: the shuffle, the deal,
   and the two facts the tricks stand on are all checked in a test rather than
   trusted.

   A PACK is an array of card ids, written TOP FIRST when it lies face down —
   pack[0] is the card you would deal next.

   THE 27-CARD TRICK (Gergonne, 1813). Deal the pack face up into three piles
   of nine, one card to each in turn. Gather the piles, turn the pack face
   down. If k piles ended up ON TOP of the pile holding the card, the card —
   which was at place p, counting from 0 — is now at

       9k + floor(p / 3)

   Do it three times with k₁, k₂, k₃ and the card is at 9k₃ + 3k₂ + k₁,
   whatever p was: the three choices ARE the three figures of a number written
   in base 3, ones first.

   THE ELEVEN TRICK (in Gardner). Turn cards face up counting 10, 9, 8 … 1 and
   stop when the card says the number you said. A pile that stopped on c holds
   11 − c cards; a pile that never stopped gets one more card and holds 11.
   So every pile, PLUS the number it stopped on, is 11 — four piles and their
   numbers are 44, and counting the numbers off the pack lands on the 44th
   card every time.
   ========================================================================== */

export const SUITS = ["S", "H", "D", "C"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const SUIT_NAME = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" };
const RANK_NAME = { A: "ace", J: "jack", Q: "queen", K: "king" };

/** Every card in a pack, as ids like "7H" and "QS". */
export const fullDeck = () => SUITS.flatMap((s) => RANKS.map((r) => r + s));

export const rankOf = (id) => id.slice(0, -1);
export const suitOf = (id) => id.slice(-1);
export const isRed = (id) => suitOf(id) === "H" || suitOf(id) === "D";

/** What a card counts for: ace 1, the figures themselves, every picture 10. */
export function valueOf(id) {
  const r = rankOf(id);
  if (r === "A") return 1;
  if (r === "J" || r === "Q" || r === "K") return 10;
  return Number(r);
}

/** "the seven of hearts" */
export function nameOf(id) {
  const r = rankOf(id);
  const words = ["", "", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return `the ${RANK_NAME[r] || words[Number(r)]} of ${SUIT_NAME[suitOf(id)]}`;
}

/** A small seeded random stream, so a shuffle can be replayed in a test. */
export function seeded(n) {
  let a = n >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One riffle, the way hands do it (the Gilbert–Shannon–Reeds model).
 *
 * The pack is cut roughly in half — each card falls to the left hand or the
 * right on the toss of a coin, so the cut is usually near the middle and
 * sometimes not. Then the halves are let fall together, a card dropping from
 * a half as often as that half is thick. One riffle leaves long runs of the
 * old order in it, which is exactly why real packs want several.
 *
 * `cards` is bottom first or top first — a riffle does not care. Returns the
 * new order and `from`: which half (0 or 1) each card of it fell from, for the
 * page to animate.
 */
export function riffle(cards, rnd = Math.random) {
  const n = cards.length;
  let cut = 0;
  for (let i = 0; i < n; i++) if (rnd() < 0.5) cut += 1;
  /* a "half" of nothing is not a riffle */
  if (n > 1) cut = Math.max(1, Math.min(n - 1, cut));
  const halves = [cards.slice(0, cut), cards.slice(cut)];
  const at = [0, 0];
  const order = [];
  const from = [];
  while (order.length < n) {
    const left = halves[0].length - at[0];
    const right = halves[1].length - at[1];
    const side = rnd() * (left + right) < left ? 0 : 1;
    order.push(halves[side][at[side]++]);
    from.push(side);
  }
  return { order, from, cut };
}

/** Lift a packet off and put it underneath. */
export function cut(cards, rnd = Math.random) {
  const n = cards.length;
  if (n < 2) return cards.slice();
  const at = 1 + Math.floor(rnd() * (n - 1));
  return cards.slice(at).concat(cards.slice(0, at));
}

/* ── the 27-card trick ────────────────────────────────────────────────────*/

/**
 * Deal a face-down pack (top first) into `piles` piles, one card to each in
 * turn. Each pile comes back in the order it was DEALT, first card first.
 */
export function dealRound(pack, piles = 3) {
  const out = Array.from({ length: piles }, () => []);
  pack.forEach((id, i) => out[i % piles].push(id));
  return out;
}

/**
 * Gather dealt piles into one face-down pack. `order` lists the piles from
 * the TOP of the face-down pack downward.
 *
 * A pile dealt face up has its first card at the bottom; turned over with the
 * rest of the pack that card is on top again — so a pile goes back into the
 * pack in the order it was dealt.
 */
export const gather = (piles, order) => order.flatMap((i) => piles[i]);

/** The figures of n − 1 in base 3, ONES FIRST: the three choices to make. */
export function base3(n) {
  const m = n - 1;
  return [m % 3, Math.floor(m / 3) % 3, Math.floor(m / 9) % 3];
}

/** Where a card at place p (from 0) goes when k piles are put on top of its own. */
export const afterRound = (p, k) => 9 * k + Math.floor(p / 3);

/**
 * Were these piles dealt properly from this pack — one card to each in turn?
 * Any pile may have been the "first" one; what matters is that each took every
 * third card, in order. `piles` are in dealt order, first card first.
 */
export function dealtInTurn(pack, piles) {
  const want = dealRound(pack, piles.length).map((p) => p.join(","));
  const got = piles.map((p) => p.join(","));
  return got.length === want.length && got.every((g) => want.includes(g))
    && new Set(got).size === got.length;
}

/* ── the eleven trick ─────────────────────────────────────────────────────*/

/**
 * How one countdown pile stands. `cards` are in the order they were turned.
 *
 *   count    the number to SAY for the next card (10 down to 1), or null
 *   match    the number it stopped on, or 0
 *   state    "open"    still counting
 *            "match"   stopped on a card that says its own number
 *            "over"    carried on PAST a match — the extra cards come back
 *            "cover"   counted to 1 with no match: one more card, to make 11
 *            "dead"    eleven cards, no match — worth nothing
 *            "long"    more than eleven
 */
export function pileState(cards) {
  const hit = cards.slice(0, 10).findIndex((id, j) => valueOf(id) === 10 - j);
  if (hit >= 0) {
    return {
      state: cards.length === hit + 1 ? "match" : "over",
      match: 10 - hit, count: null, extra: cards.length - hit - 1,
    };
  }
  if (cards.length < 10) return { state: "open", match: 0, count: 10 - cards.length, extra: 0 };
  if (cards.length === 10) return { state: "cover", match: 0, count: null, extra: 0 };
  if (cards.length === 11) return { state: "dead", match: 0, count: null, extra: 0 };
  return { state: "long", match: 0, count: null, extra: cards.length - 11 };
}

/**
 * Play the whole countdown on a pack (top first), for the test: four piles,
 * then the sum. Returns the piles, the sum and how many cards were used.
 */
export function playEleven(pack) {
  let at = 0;
  const piles = [];
  for (let i = 0; i < 4; i++) {
    const cards = [];
    for (;;) {
      const st = pileState(cards);
      if (st.state === "match" || st.state === "dead") { piles.push({ cards, match: st.match }); break; }
      cards.push(pack[at++]);
    }
  }
  const sum = piles.reduce((s, p) => s + p.match, 0);
  return { piles, sum, used: at };
}
