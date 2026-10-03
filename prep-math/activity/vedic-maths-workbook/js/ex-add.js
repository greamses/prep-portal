/* ============================================================================
   Vedic Maths Workbook — CHAPTER 1 · Adding and taking away with complements
   ----------------------------------------------------------------------------
   A number's COMPLEMENT is how far it is short of the next 10, 100 or 1000.
   Round numbers are easy to add and take away, so a number just under one is
   handled as the round number and the little bit it is short:

     the complement       all from 9 and the last from 10 (Nikhilam)
     adding with it       + 98 is + 100 − 2
     taking away with it  − 98 is − 100 + 2

   These come first in the book because the rest of it leans on them: every
   "near a base" trick later starts by finding a complement.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, tier, step, steps, strip } from "./common.js";

export const CM_GROUPS = [
  { id: "vm-comp", chapter: "Chapter 1 · Adding and taking away", label: "Complements", blurb: "How far short of 10, 100 or 1000 — then the round number does the work." },
];

/* ═══ the complement: all from 9 and the last from 10 ══════════════════════*/

const nine = {
  id: "vm-nine",
  group: "vm-comp",
  label: "Complements: take from 100, 1000, 10 000",
  blurb: "All from 9 and the last from 10 (Nikhilam).",
  heading: "All from 9 and the last from 10",
  instruction: () =>
    "To take a number away from 100, 1000 or 10 000, take every digit from 9 — except the last one, which you take from 10. If the number has fewer digits than the base has noughts, put noughts in front of it first: 1000 − 47 is 1000 − 047.",
  cols: 2,
  defaultCount: 8,
  make(r, o) {
    const t = tier(o);
    const B = t === "gentle" ? 100 : t === "middle" ? 1000 : r.pick([1000, 10000]);
    for (;;) {
      const n = t === "stretch" && B === 1000 ? r.int(11, 99) : r.int(B / 10 + 1, B - 1);
      if (n % 10) return { B, n };
    }
  },
  render(item) {
    return ask(`${item.B} − ${item.n} = <span class="wb-answer"></span>`);
  },
  worked() {
    return worked(ask("1000 − 368: " + strip("9 − 3", "9 − 6", "10 − 8") + " → " + strip("6", "3", "2") + " = 632") +
      say("Every digit from 9, the last from 10: 6, 3, 2. Check it: 632 + 368 is 1000."));
  },
  key(item) {
    return [want.num(item.B - item.n)];
  },
  answer(item) {
    return [`${item.B} − ${item.n} = ${item.B - item.n}`];
  },
};

/* ═══ a number just under a round one ══════════════════════════════════════*/

/** b just under a round number R: b = R − d. */
function nearRound(r, o) {
  const t = tier(o);
  if (t === "gentle") { const k = r.int(1, 9); const d = r.int(1, 2); return { R: 10 * k, d, b: 10 * k - d }; }
  if (t === "middle") { const k = r.int(1, 5); const d = r.int(1, 5); return { R: 100 * k, d, b: 100 * k - d }; }
  const k = r.int(1, 4); const d = r.int(2, 15); return { R: 1000 * k, d, b: 1000 * k - d };
}

const addc = {
  id: "vm-addc",
  group: "vm-comp",
  label: "Adding with complements",
  blurb: "+ 98 is + 100, then take back the 2.",
  heading: "Adding a number just under a round one",
  instruction: () =>
    "When the number being added is just under a round number — 98, 197, 2995 — add the round number instead, then take back what it was short by. 47 + 98 is 47 + 100 − 2.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const { R, d, b } = nearRound(r, o);
    const a = t === "gentle" ? r.int(12, 89) : t === "middle" ? r.int(105, 899) : r.int(1024, 8999);
    return { a, b, R, d };
  },
  render(item) {
    const { a, b, R, d } = item;
    return big(`${a} + ${b}`) + steps(step(`${b} is ${R} − ${d}, so ${a} + ${R} =`), step(`then − ${d} =`));
  },
  worked() {
    return worked(big("347 + 198") + ask("198 is 200 − 2. " + strip("347 + 200", "− 2") + " → " + strip("547", "− 2") + " = 545") +
      say("Adding 200 is easy: 547. But 198 is 2 less than 200, so take the 2 back off: 545."));
  },
  key(item) {
    return [want.num(item.a + item.R), want.num(item.a + item.b)];
  },
  answer(item) {
    return [`${item.a} + ${item.R} = ${item.a + item.R}, − ${item.d} = ${item.a + item.b}`];
  },
};

const subc = {
  id: "vm-subc",
  group: "vm-comp",
  label: "Taking away with complements",
  blurb: "− 98 is − 100, then give back the 2.",
  heading: "Taking away a number just under a round one",
  instruction: () =>
    "When the number being taken away is just under a round number, take away the round number instead — that took away too much, by exactly what it was short — so give that back. 523 − 298 is 523 − 300 + 2.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const { R, d, b } = nearRound(r, o);
    const lo = R + 1;
    const hi = t === "gentle" ? Math.max(R + 9, 99) : t === "middle" ? Math.max(R + 99, 999) : Math.max(R + 999, 9999);
    const a = r.int(Math.max(lo, t === "gentle" ? 11 : t === "middle" ? 101 : 1001), hi);
    return { a, b, R, d };
  },
  render(item) {
    const { a, b, R, d } = item;
    return big(`${a} − ${b}`) + steps(step(`${b} is ${R} − ${d}, so ${a} − ${R} =`), step(`then + ${d} =`));
  },
  worked() {
    return worked(big("523 − 298") + ask("298 is 300 − 2. " + strip("523 − 300", "+ 2") + " → " + strip("223", "+ 2") + " = 225") +
      say("Taking 300 away is easy: 223. But we were only meant to take 298 — 2 less — so give the 2 back: 225."));
  },
  key(item) {
    return [want.num(item.a - item.R), want.num(item.a - item.b)];
  },
  answer(item) {
    return [`${item.a} − ${item.R} = ${item.a - item.R}, + ${item.d} = ${item.a - item.b}`];
  },
};

export const CM_EXERCISES = [nine, addc, subc];
