/* ============================================================================
   Algebra Workbook — CHAPTER 3, last section: TWO scales at once
   ----------------------------------------------------------------------------
   One balance is one equation. Two balances are two, and a pair of equations
   with two letters in them is solved the way the rest of this chapter works —
   the SAME move on both pans — with one move more:

     what one scale knows, the other may use. When a scale has ONE bag on a pan
     by itself, that scale has said what the bag is worth. A bag of the same
     letter on the OTHER scale may then be swapped for exactly that — which is
     what "substitution" means, done with the hands.

   On screen: drag what a solved scale weighs against onto a bag on the other
   scale, and that bag becomes it. Everything else is the chapter's own
   (utils/components/workbook/balance.js) — take the same off both pans, move a
   piece across, watch the beam.

   The scales are the EXPERIMENT; the boxes underneath carry the marks. Both
   bags are the same sack whatever they weigh, as everywhere else in this
   chapter — x in butter, y in leaf, so two unknowns read apart.
   ========================================================================== */

import { balanceSvg, balanceText } from "./balanceart.js";
import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const art = (html) => `<div class="ab-art">${html}</div>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const side = (bags, ybags, n) => ({ bags, ybags, n });
/** The two scales, one above the other: 150mm each is the paper's whole width. */
const pair = (A, B) => art(A) + art(B);
const answers = () => eq(`x = ${box()} &nbsp;&nbsp; y = ${box()}`);

export const TW_GROUPS = [
  { id: "bs-two", label: "Two scales at once", blurb: "Two equations: solve one scale, then swap what it knows into the other." },
];

/* ═══ what one scale already knows ═════════════════════════════════════════*/

const twEval = {
  id: "tw-eval",
  group: "bs-two",
  label: "Swap it into the other scale",
  blurb: "The first scale already says what the x bag weighs.",
  heading: "Use what one scale knows",
  instruction: () =>
    "Scale A has one x bag on a pan by itself, so it has said what an x bag weighs. Scale B has a y bag " +
    "against some x bags and a weight: every x bag there may be swapped for what Scale A says. Then add up " +
    "that pan — that is what the y bag weighs. On screen, drag Scale A's weight onto an x bag on Scale B.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    const x = r.int(2, t === "gentle" ? 6 : 9);
    const a = r.int(2, t === "stretch" ? 3 : 2);
    const b = r.int(1, 9);
    return { x, a, b, y: a * x + b };
  },
  render(item) {
    const { x, a, b, y } = item;
    const worth = { x, y };
    const A = balanceSvg(side(1, 0, 0), side(0, 0, x), { worth, name: "Scale A", label: `Scale A: x = ${x}` });
    const B = balanceSvg(side(0, 1, 0), side(a, 0, b), { worth, name: "Scale B", label: "Scale B" });
    return pair(A, B) + answers();
  },
  worked() {
    const worth = { x: 4, y: 11 };
    return worked(pair(
      balanceSvg(side(1, 0, 0), side(0, 0, 4), { worth, name: "Scale A", label: "Scale A" }),
      balanceSvg(side(0, 1, 0), side(2, 0, 3), { worth, name: "Scale B", label: "Scale B" }),
    ) + say("Scale A says an x bag weighs 4. On Scale B, swap each x bag for a 4: that pan is then 4, 4 and 3 " +
      "— 11 in all. So the y bag weighs 11, and Scale B is still level, because nothing was added or taken " +
      "away: each bag was swapped for something that weighs the same."));
  },
  key(item) {
    return [want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`x = ${item.x}, y = ${item.y}`];
  },
};

/* ═══ solve one scale first ════════════════════════════════════════════════*/

const twSolve = {
  id: "tw-solve",
  group: "bs-two",
  label: "Solve one scale, then swap",
  blurb: "Scale A must be solved before it can say anything.",
  heading: "Solve one scale, then use it",
  instruction: () =>
    "Scale A is not solved yet. Take the same off BOTH pans until only the bags are left, then take the same " +
    "share off both — half off each side, or a third — until one x bag stands alone. NOW Scale A says what an " +
    "x bag weighs: swap it into Scale B and read off the y bag.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    const x = r.int(2, t === "gentle" ? 4 : 6);
    const k = r.int(2, t === "gentle" ? 2 : 3);
    const b = r.int(1, 6);
    const a = r.int(1, t === "gentle" ? 1 : 2);
    const c = r.int(1, 9);
    return { x, k, b, a, c, total: k * x + b, y: a * x + c };
  },
  render(item) {
    const { x, k, b, a, c, total, y } = item;
    const worth = { x, y };
    /* cubes on the scale to be solved, so the SAME can be taken off both pans */
    const A = balanceSvg(side(k, 0, b), side(0, 0, total), { worth, cubes: true, name: "Scale A", label: "Scale A" });
    const B = balanceSvg(side(0, 1, 0), side(a, 0, c), { worth, name: "Scale B", label: "Scale B" });
    return pair(A, B) + answers();
  },
  worked() {
    const worth = { x: 4, y: 9 };
    return worked(pair(
      balanceSvg(side(2, 0, 3), side(0, 0, 11), { worth, cubes: true, name: "Scale A", label: "Scale A" }),
      balanceSvg(side(0, 1, 0), side(1, 0, 5), { worth, name: "Scale B", label: "Scale B" }),
    ) + say("Scale A: take 3 cubes off both pans and it stays level — two bags against 8. Now take one bag off " +
      "the left and 4 cubes off the right: still level, and one bag stands against 4. So x is 4. Swap it into " +
      "Scale B: the y bag is against 4 and 5, so y is 9."));
  },
  key(item) {
    return [want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`x = ${item.x}, y = ${item.y}`];
  },
};

/* ═══ two unknowns ═════════════════════════════════════════════════════════*/

const twSystem = {
  id: "tw-system",
  group: "bs-two",
  label: "Two unknowns",
  blurb: "Neither scale is solved — but one says what a y bag is worth in x.",
  heading: "Two scales, two unknowns",
  hardest: true,
  instruction: () =>
    "Scale B has a y bag alone on a pan: it says a y bag weighs the same as what is on the other pan — an x " +
    "bag and a weight. Swap the y bag on Scale A for exactly that, and Scale A is all x bags and weights. " +
    "Solve it the way the chapter does, then go back to Scale B for y.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    for (let g = 0; g < 200; g++) {
      const x = r.int(2, t === "gentle" ? 4 : 6);
      const d = r.int(1, t === "gentle" ? 3 : 5);
      const k = r.int(1, t === "stretch" ? 2 : 1);
      const y = x + d;
      const s = k * x + y;
      if (s <= 24) return { x, y, d, k, s };
    }
    return { x: 3, y: 5, d: 2, k: 1, s: 8 };
  },
  render(item) {
    const { x, y, d, k, s } = item;
    const worth = { x, y };
    const A = balanceSvg(side(k, 1, 0), side(0, 0, s), { worth, cubes: true, name: "Scale A", label: "Scale A" });
    const B = balanceSvg(side(0, 1, 0), side(1, 0, d), { worth, name: "Scale B", label: "Scale B" });
    return pair(A, B) + answers();
  },
  worked() {
    const worth = { x: 4, y: 6 };
    return worked(pair(
      balanceSvg(side(2, 1, 0), side(0, 0, 14), { worth, cubes: true, name: "Scale A", label: "Scale A" }),
      balanceSvg(side(0, 1, 0), side(1, 0, 2), { worth, name: "Scale B", label: "Scale B" }),
    ) + say("Scale B says a y bag weighs the same as an x bag and 2. Swap the y bag on Scale A for those: " +
      "three x bags and 2 against 14. Take the 2 off both pans — three bags against 12 — then take two bags " +
      "off the left and 8 off the right: one bag against 4, so x is 4. Back on Scale B: y is 4 and 2, which " +
      "is 6."));
  },
  key(item) {
    return [want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`x = ${item.x}, y = ${item.y}`];
  },
};

export const TW_EXERCISES = [twEval, twSolve, twSystem];

void balanceText;
