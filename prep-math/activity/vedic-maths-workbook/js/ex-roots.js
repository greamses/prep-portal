/* ============================================================================
   Vedic Maths Workbook — CHAPTER 4 · Square roots and cube roots
   ----------------------------------------------------------------------------
   Of a number that is a perfect square (or cube), the root can be read off in
   two looks, never worked out:

     the LAST digit of the root comes from the last digit of the number;
     the FRONT of the root comes from the front of the number — drop the last
     two digits (three, for a cube) and find the biggest number whose square
     (cube) fits under what is left.

   For a cube the last digit settles it — every ending belongs to one digit.
   For a square every ending but 0 and 5 belongs to TWO digits (a 6 comes from
   4 or 6), and one more look settles it: if the front is at least front ×
   (front + 1), take the bigger.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, tier, step, steps } from "./common.js";

export const RT_GROUPS = [
  { id: "vm-roots", chapter: "Chapter 4 · Square roots and cube roots", label: "Roots at a glance", blurb: "The last digit from the last digit; the front from the front." },
];

const SQ_ENDS = "1 → 1 or 9 · 4 → 2 or 8 · 9 → 3 or 7 · 6 → 4 or 6 · 5 → 5 · 0 → 0";
const CUBE_ENDS = "1 → 1 · 8 → 2 · 7 → 3 · 4 → 4 · 5 → 5 · 6 → 6 · 3 → 7 · 2 → 8 · 9 → 9 · 0 → 0";

const sqrt = {
  id: "vm-sqrt",
  group: "vm-roots",
  label: "Square roots",
  blurb: "The front from the front, the last digit from the last digit.",
  heading: "Square roots of perfect squares",
  instruction: () =>
    `Drop the last two digits: of what is left, find the biggest number whose square fits — that is the FRONT of the root. The last digit of the root comes from the last digit of the number (${SQ_ENDS}). When there are two choices, look again: if what was left is at least front × (front + 1), take the bigger.`,
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const root = t === "gentle" ? r.int(11, 31) : t === "middle" ? r.int(32, 99) : r.int(101, 316);
    const N = root * root;
    return { root, N, front: Math.floor(N / 100), a: Math.floor(root / 10), u: root % 10 };
  },
  render(item) {
    const { N, front } = item;
    return big(`√${N}`) + steps(
      step(`front: the biggest number whose square fits in ${front}:`),
      step(`last digit (${N} ends in ${N % 10}):`),
      step(`√${N} =`),
    );
  },
  worked() {
    return worked(big("√2304") + ask("Drop the last two digits: 23. The biggest square that fits is 4² = 16, so the front is 4. 2304 ends in 4, so the root ends in 2 or 8. Is 23 at least 4 × 5 = 20? Yes — take the bigger: 48.") +
      say("Check: 48² is 2304. Had it been 1764 — front 17, 4² = 16 fits, ends in 4 — 17 is less than 4 × 5, so the smaller: 42."));
  },
  key(item) {
    return [want.num(item.a), want.num(item.u), want.num(item.root)];
  },
  answer(item) {
    return [`front ${item.a}, last digit ${item.u}`, `√${item.N} = ${item.root}`];
  },
};

const cbrt = {
  id: "vm-cbrt",
  group: "vm-roots",
  label: "Cube roots",
  blurb: "Every last digit belongs to exactly one digit.",
  heading: "Cube roots of perfect cubes",
  instruction: () =>
    `Drop the last three digits: of what is left, find the biggest number whose cube fits — that is the FRONT of the root. The last digit of the root comes from the last digit of the number, and for cubes there is only ever one choice (${CUBE_ENDS}).`,
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const root = t === "gentle" ? r.int(11, 29) : t === "middle" ? r.int(30, 99) : r.int(101, 215);
    const N = root ** 3;
    return { root, N, front: Math.floor(N / 1000), a: Math.floor(root / 10), u: root % 10 };
  },
  render(item) {
    const { N, front } = item;
    return big(`∛${N}`) + steps(
      step(`front: the biggest number whose cube fits in ${front}:`),
      step(`last digit (${N} ends in ${N % 10}):`),
      step(`∛${N} =`),
    );
  },
  worked() {
    return worked(big("∛262144") + ask("Drop the last three digits: 262. The biggest cube that fits is 6³ = 216, so the front is 6. 262144 ends in 4, and only 4 × 4 × 4 ends in 4 — the root ends in 4. So 64.") +
      say(`The endings to know: ${CUBE_ENDS}. 2 and 8 swap, 3 and 7 swap, every other digit keeps its own.`));
  },
  key(item) {
    return [want.num(item.a), want.num(item.u), want.num(item.root)];
  },
  answer(item) {
    return [`front ${item.a}, last digit ${item.u}`, `∛${item.N} = ${item.root}`];
  },
};

export const RT_EXERCISES = [sqrt, cbrt];

void ask;
