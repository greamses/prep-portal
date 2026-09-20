/* ============================================================================
   Algebra Workbook — CHAPTER 3, last section: TWO scales at once
   ----------------------------------------------------------------------------
   One balance says one equation. Two balances, side by side, say two — and
   two equations with two letters in them are solved by carrying what one
   scale knows over to the other:

     what x is worth   the first scale already has x on its own: swap it into
                       the second and read off y. Substitution, and nothing
                       else to do
     solve, then swap  now the first scale must be solved first — a block sent
                       across, the pans shared — and only then carried over
     two unknowns      neither scale says a letter's worth outright, but one
                       has y on its own: that is the rule to carry

   The blocks are real things on screen: drag one to the other pan of its own
   scale and its sign turns over, drop one on another to put them together,
   share both pans, and drag the chip a solved scale hands you onto the same
   letter on the other scale (utils/components/workbook/scales.js — the same
   piece the Two Scales bench is built from). On paper the same scales are
   drawn, and the work is done with a pencil.

   The scales are the experiment; the boxes underneath carry the marks.
   ========================================================================== */

import { block, scale, scalesHtml, say as sayScale } from "/utils/components/workbook/scales.js";
import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const ones = (n) => (n ? [block("n", n)] : []);
const vars = (kind, c) => Array.from({ length: Math.abs(c) }, () => block(kind, Math.sign(c)));
const two = (a, b) => scalesHtml([a, b], { names: ["Scale A", "Scale B"] });
const answers = (x, y) => eq(`x = ${box()} &nbsp;&nbsp; y = ${box()}`);

export const TW_GROUPS = [
  { id: "bs-two", label: "Two scales at once", blurb: "Two equations: solve one scale, then carry what it says into the other." },
];

/* ═══ what x is worth ══════════════════════════════════════════════════════*/

const twEval = {
  id: "tw-eval",
  group: "bs-two",
  label: "Swap it into the other scale",
  blurb: "One scale already says what x is worth.",
  heading: "Put what one scale says into the other",
  instruction: () =>
    "Scale A has x on its own, so it says exactly what x is worth. Scale B has y on one pan and some xs and " +
    "numbers on the other: swap every x for what Scale A says, put the numbers together, and Scale B is left " +
    "saying what y is. On screen, drag the chip from Scale A onto an x on Scale B.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    const x = r.int(2, t === "gentle" ? 6 : 9);
    const a = r.int(2, t === "stretch" ? 4 : 3);
    const b = r.int(1, 9);
    return { x, a, b, y: a * x + b };
  },
  render(item) {
    const A = scale([block("x", 1)], ones(item.x));
    const B = scale([block("y", 1)], [...vars("x", item.a), ...ones(item.b)]);
    return two(A, B) + answers();
  },
  worked() {
    const A = scale([block("x", 1)], ones(4));
    const B = scale([block("y", 1)], [...vars("x", 2), ...ones(3)]);
    return worked(two(A, B) +
      say("Scale A says x is 4. On Scale B, swap each x for 4: that pan becomes 4, 4 and 3. Put them together: " +
        "11. So Scale B now says y = 11 — and it is still balanced, because nothing was added or taken away, " +
        "only swapped for something worth the same."));
  },
  key(item) {
    return [want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`x = ${item.x}, y = ${item.y}`];
  },
};

/* ═══ solve, then swap ═════════════════════════════════════════════════════*/

const twSolve = {
  id: "tw-solve",
  group: "bs-two",
  label: "Solve one scale first",
  blurb: "Scale A has to be solved before it can be carried across.",
  heading: "Solve one scale, then use it",
  instruction: () =>
    "Scale A is not solved yet: send the plain number across to the other pan (it changes sign), put the " +
    "numbers together, and share both pans until one x is left on its own. NOW Scale A says what x is worth — " +
    "carry it to Scale B and read off y.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    const x = r.int(2, t === "gentle" ? 5 : 8);
    const k = r.int(2, t === "gentle" ? 3 : 4);
    const b = r.int(1, 9);
    const a = r.int(1, t === "gentle" ? 2 : 3);
    const c = r.int(1, 9);
    return { x, k, b, a, c, total: k * x + b, y: a * x + c };
  },
  render(item) {
    const A = scale([...vars("x", item.k), ...ones(item.b)], ones(item.total));
    const B = scale([block("y", 1)], [...vars("x", item.a), ...ones(item.c)]);
    return two(A, B) + answers();
  },
  worked() {
    const A = scale([...vars("x", 2), ...ones(3)], ones(11));
    return worked(two(A, scale([block("y", 1)], [block("x", 1), ...ones(5)])) +
      say("Scale A: send the 3 across — it becomes −3 beside the 11, and 11 − 3 = 8. Two xs against 8: share " +
        "both pans into 2, and x = 4. Scale B then says y = 4 + 5 = 9."));
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
  blurb: "Neither scale is solved: one says y in terms of x.",
  heading: "Two scales, two unknowns",
  hardest: true,
  instruction: () =>
    "Scale B has y on its own, so it says what y is worth — in xs. Carry that onto Scale A and swap the y " +
    "there: Scale A is then all xs and numbers, and can be solved. Then carry x back to Scale B for y.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    for (let g = 0; g < 200; g++) {
      const x = r.int(2, t === "gentle" ? 5 : 7);
      const d = r.int(1, t === "gentle" ? 4 : 6);
      const k = r.int(1, t === "stretch" ? 3 : 2);
      const y = x + d;
      const s = k * x + y;
      if (s <= 30) return { x, y, d, k, s };
    }
    return { x: 4, y: 5, d: 1, k: 1, s: 9 };
  },
  render(item) {
    const A = scale([...vars("x", item.k), block("y", 1)], ones(item.s));
    const B = scale([block("y", 1)], [block("x", 1), ...ones(item.d)]);
    return two(A, B) + answers();
  },
  worked() {
    const A = scale([...vars("x", 2), block("y", 1)], ones(14));
    const B = scale([block("y", 1)], [block("x", 1), ...ones(2)]);
    return worked(two(A, B) +
      say(`Scale B says y is worth x and 2. Swap the y on Scale A for those: three xs and a 2 against 14. ` +
        `Send the 2 across (14 − 2 = 12), share both pans into 3, and x = 4. Back on Scale B: y = 4 + 2 = 6. ` +
        `Check the first scale: ${sayScale(A)} — two 4s and a 6 make 14.`));
  },
  key(item) {
    return [want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`x = ${item.x}, y = ${item.y}`];
  },
};

export const TW_EXERCISES = [twEval, twSolve, twSystem];
