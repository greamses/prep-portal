/* ============================================================================
   Vedic Maths Workbook — CHAPTER 3 · Checking an answer
   ----------------------------------------------------------------------------
   A trick that is fast is only worth having if a slip can be caught. The digit
   sum (keep adding the digits until one is left) survives every + and ×: the
   digit sum of a product is the digit sum of the two digit sums multiplied.
   So a product can be checked in a few seconds — casting out nines.

   It can say an answer is WRONG for certain. It cannot say one is right — two
   digits swapped keep the same digit sum — so the tick says "could be right",
   never "is right". The wrong answers here are always off by an amount the
   check CAN see (never a multiple of 9), so the lesson is the check, not a
   trap the check cannot see.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, tier, step, steps, tick, root, digits } from "./common.js";

export const CK_GROUPS = [
  { id: "vm-check", chapter: "Chapter 3 · Checking an answer", label: "Digit sums", blurb: "Add the digits until one is left — then check a product with it." },
];

/* ═══ the digit sum ════════════════════════════════════════════════════════*/

const sum = {
  id: "vm-root",
  group: "vm-check",
  label: "Digit sums",
  blurb: "Add the digits, and again, until one digit is left.",
  heading: "The digit sum of a number",
  instruction: () =>
    "Add the digits of the number. If the total has more than one digit, add ITS digits — and again, until one digit is left. That is the digit sum. A shortcut: any 9, or any digits that add to 9, can be crossed out first, because they change nothing.",
  cols: 3,
  defaultCount: 9,
  make(r, o) {
    const t = tier(o);
    const n = t === "gentle" ? r.int(23, 989) : t === "middle" ? r.int(1234, 98765) : r.int(123456, 9876543);
    return { n };
  },
  render(item) {
    return ask(`${item.n} → <span class="wb-answer"></span>`);
  },
  worked() {
    return worked(ask("4738: 4 + 7 + 3 + 8 = 22, and 2 + 2 = 4. The digit sum is 4.") +
      say("Quicker: cross out anything that makes 9 first, because it changes nothing. In 6375 the 6 and the 3 make 9 — cross them out — and 7 + 5 is 12, then 1 + 2 is 3. If every digit crosses out, the digit sum is 9."));
  },
  key(item) {
    return [want.num(root(item.n))];
  },
  answer(item) {
    return [`${item.n} → ${digits(item.n).join(" + ")} → ${root(item.n)}`];
  },
};

/* ═══ checking a product ═══════════════════════════════════════════════════*/

const SAYS = ["could be right", "is wrong"];

const check = {
  id: "vm-check9",
  group: "vm-check",
  label: "Check a product",
  blurb: "Casting out nines: do the digit sums agree?",
  heading: "Checking a product by casting out nines",
  instruction: () =>
    "Find the digit sum of each number being multiplied. Multiply those two digit sums and find the digit sum of THAT. Then find the digit sum of the answer given. If the two do not match, the answer is wrong. If they match, it could be right (the check cannot catch two digits swapped).",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const a = t === "gentle" ? r.int(12, 98) : t === "middle" ? r.int(23, 98) : r.int(123, 987);
    const b = t === "gentle" ? r.int(3, 9) : t === "middle" ? r.int(12, 98) : r.int(23, 98);
    const truth = a * b;
    const wrong = r.int(0, 1) === 1;
    let shown = truth;
    if (wrong) {
      for (;;) {
        const off = r.pick([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 20, 30, 100]) * r.pick([1, -1]);
        if (off % 9 !== 0 && truth + off > 0) { shown = truth + off; break; }
      }
    }
    return { a, b, shown, kind: shown === truth ? 0 : 1 };
  },
  render(item) {
    const { a, b, shown } = item;
    return big(`${a} × ${b} = ${shown} ?`) + steps(
      step(`digit sum of ${a}:`),
      step(`digit sum of ${b}:`),
      step("their product, digit-summed:"),
      step(`digit sum of ${shown}:`),
    ) + ask(`So the answer ${tick(...SAYS)}`);
  },
  worked() {
    return worked(big("43 × 27 = 1161 ?") +
      ask("43 → 7. 27 → 9. 7 × 9 = 63 → 9. And 1161 → 1 + 1 + 6 + 1 = 9. They match: it could be right (it is — 43 × 27 is 1161).") +
      say("Had the answer been 1171, its digit sum would be 1, not 9 — wrong for certain."));
  },
  key(item) {
    const { a, b, shown, kind } = item;
    return [want.num(root(a)), want.num(root(b)), want.num(root(root(a) * root(b))), want.num(root(shown)), want.tick(kind)];
  },
  answer(item) {
    const { a, b, shown, kind } = item;
    return [`${root(a)} × ${root(b)} → ${root(root(a) * root(b))}; ${shown} → ${root(shown)}`, `${SAYS[kind]}${kind ? ` (it is ${a * b})` : ""}`];
  },
};

export const CK_EXERCISES = [sum, check];
