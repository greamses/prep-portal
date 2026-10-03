/* ============================================================================
   Vedic Maths Workbook — CHAPTER 1 · Adding and taking away with complements
   ----------------------------------------------------------------------------
   A number's COMPLEMENT is how far it is short of the next 10, 100 or 1000.
   Round numbers are easy to add and take away, so a number just under one is
   handled as the round number and the little bit it is short:

     the complement       all from 9 and the last from 10 (Nikhilam)
     adding with it       + 98 is + 100 − 2
     taking away with it  − 98 is − 100 + 2

   doubles and near doubles, seen as a bar model: two bars the same length
   (47 + 47 is double 40 and double 7), or one bar a little longer than the
   other (36 + 38 is double 36 and the extra 2)

   and then two ways to take away with NO regrouping at all, however many
   noughts are in the way:

     same difference      slide both numbers along the number line by the
                          same amount until the one taken away is round —
                          the NEAREST round number, up or down (21 → 20, not
                          30) — and the difference does not move:
                          503 − 278 = 525 − 300, 503 − 213 = 490 − 200
     easy regroupers      split the top number into one made of 9s and the
                          rest: 503 = 499 + 4, and 499 − 278 never borrows

   These come first in the book because the rest of it leans on them: every
   "near a base" trick later starts by finding a complement.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { sameDiffFigure, borrows } from "/utils/components/workbook/samediff.js";
import { modelSvg, boardUnder } from "/prep-math/activity/maths-workbook/js/modelart.js";
import { ask, big, worked, say, tier, step, steps, strip } from "./common.js";

export const CM_GROUPS = [
  { id: "vm-comp", chapter: "Chapter 1 · Adding and taking away", label: "Complements", blurb: "How far short of 10, 100 or 1000 — then the round number does the work." },
  { id: "vm-double", label: "Doubles and near doubles", blurb: "Two bars the same, or one a little longer — double, then add the extra." },
  { id: "vm-regroup", label: "Taking away without regrouping", blurb: "Slide to a round number, or split off the nines — and nothing borrows." },
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

/* ═══ doubles and near doubles, as bar models ═══════════════════════════════*/

/* the picture, and on screen a folded board under it to build the model on
   ("From the picture" copies it there) — utils/components/workbook/barmodel.js */
const model = (html) => `<div class="mb-art vm-model">${html}</div>`;
/** n split into its front place and the rest: 47 → 40 and 7, 236 → 200 and 36. */
function front(n) {
  const unit = 10 ** (String(n).length - 1);
  const top = Math.floor(n / unit) * unit;
  return { top, rest: n - top };
}

const dbl = {
  id: "vm-dbl",
  group: "vm-double",
  label: "Doubles",
  blurb: "47 + 47: double 40, double 7, put them together.",
  heading: "Doubles: two bars the same",
  instruction: () =>
    "Adding a number to itself is DOUBLING it: two bars exactly the same. Cut each bar where its front place ends — 47 is 40 and 7 — and double each piece. Doubling a round number and a small one is easy; put the two together.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const n = t === "gentle" ? r.int(13, 49) : t === "middle" ? r.pick([r.int(26, 99), r.int(112, 499)]) : r.int(126, 4999);
      const { top, rest } = front(n);
      if (rest && rest % 10 !== 0 || (rest && n < 100)) return { n, top, rest };
    }
  },
  render(item) {
    const { n, top, rest } = item;
    const row = () => ({ parts: [{ text: String(top), value: top, tone: "a" }, { text: String(rest), value: rest, tone: "c" }] });
    return big(`${n} + ${n}`) + model(modelSvg([row(), row()], { total: "?", cap: 7 }) + boardUnder([row(), row()], { total: "?", cap: 7 })) +
      steps(step(`double ${top} =`), step(`double ${rest} =`), step("together ="));
  },
  worked() {
    const row = () => ({ parts: [{ text: "40", value: 40, tone: "a" }, { text: "7", value: 7, tone: "c" }] });
    return worked(big("47 + 47") + model(modelSvg([row(), row()], { total: "?", cap: 7 })) +
      ask(strip("double 40", "double 7") + " → " + strip("80", "14") + " = 94") +
      say("Both bars are 40 and 7. The two forties make 80, the two sevens make 14, and 80 + 14 is 94."));
  },
  key(item) {
    return [want.num(2 * item.top), want.num(2 * item.rest), want.num(2 * item.n)];
  },
  answer(item) {
    return [`${2 * item.top} + ${2 * item.rest} = ${2 * item.n}`];
  },
};

const ndbl = {
  id: "vm-ndbl",
  group: "vm-double",
  label: "Near doubles",
  blurb: "36 + 38: double 36, and the extra 2.",
  heading: "Near doubles: one bar a little longer",
  instruction: () =>
    "Two numbers close together are NEARLY a double. Draw them as bars: the longer one is the shorter one and a little extra. So double the SMALLER number, then add the extra on. 36 + 38 is double 36, and 2 more.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const small = t === "gentle" ? r.int(11, 45) : t === "middle" ? r.pick([r.int(24, 95), r.int(105, 480)]) : r.int(120, 4800);
    const d = t === "gentle" ? r.int(1, 3) : t === "middle" ? r.int(1, 9) : r.pick([r.int(1, 9), r.int(11, 30)]);
    const flip = r.chance(0.5);
    return { small, d, a: flip ? small + d : small, b: flip ? small : small + d };
  },
  render(item) {
    const { small, d, a, b } = item;
    const rows = [
      { parts: [{ text: String(small), value: small, tone: "a" }] },
      { parts: [{ text: String(small), value: small, tone: "a" }, { text: "", value: d, tone: "c" }], below: [{ from: 1, to: 2, text: `+${d}` }] },
    ];
    return big(`${a} + ${b}`) + model(modelSvg(rows, { total: "?", cap: 7 }) + boardUnder(rows, { total: "?", cap: 7 })) +
      steps(step(`double ${small} =`), step(`and the extra ${d}: total =`));
  },
  worked() {
    const rows = [
      { parts: [{ text: "36", value: 36, tone: "a" }] },
      { parts: [{ text: "36", value: 36, tone: "a" }, { text: "", value: 2, tone: "c" }], below: [{ from: 1, to: 2, text: "+2" }] },
    ];
    return worked(big("36 + 38") + model(modelSvg(rows, { total: "?", cap: 7 })) +
      ask(strip("double 36", "+ 2") + " → " + strip("72", "+ 2") + " = 74") +
      say("38 is 36 and 2 more, so the bars are 36 twice and a little extra: 72 and 2 more is 74."));
  },
  key(item) {
    return [want.num(2 * item.small), want.num(item.a + item.b)];
  },
  answer(item) {
    return [`double ${item.small} = ${2 * item.small}, + ${item.d} = ${item.a + item.b}`];
  },
};

/* ═══ taking away with no regrouping ═══════════════════════════════════════*/

const lenOf = (o) => ({ gentle: 2, middle: 3, stretch: 4 })[tier(o)];
const owes = (a, b) => borrows(a, b).filter(Boolean).length;

const same = {
  id: "vm-same",
  group: "vm-regroup",
  label: "Same difference",
  blurb: "Slide both numbers together to the nearest round number — up or down.",
  heading: "Same difference: slide to a round number",
  instruction: () =>
    "A take-away is the DISTANCE between two numbers on the number line. Move both numbers by the same amount and the distance stays the same. So slide them until the number being taken away is a round number — the NEAREST one, up or down: 21 goes down 1 to 20, not up 9 to 30 — and nothing needs regrouping. On screen, drag the difference bar and watch the column sum change.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const n = lenOf(o);
    const unit = 10 ** (n - 1);
    const need = n === 2 ? 1 : 2;
    for (;;) {
      const b = r.int(unit + 1, 7 * unit);
      if (b % unit === 0) continue;
      const a = r.int(b + 2, 10 ** n - 1);
      if (owes(a, b) < need) continue;
      /* the NEAREST round number, up or down — the shorter slide */
      const R = Math.round(b / unit) * unit;
      if (String(a + (R - b)).length > n) continue;
      return { a, b, R, goal: R - b };
    }
  },
  render(item) {
    const { a, b, R, goal } = item;
    return big(`${a} − ${b}`) + sameDiffFigure(a, b, { goal }) +
      steps(step(`slide both ${goal > 0 ? "up" : "down"} until ${b} is ${R}: ${goal > 0 ? "up" : "down"} by`), step(`then ${a} becomes`), step(`and that − ${R} =`));
  },
  worked() {
    return worked(big("503 − 278") + sameDiffFigure(503, 278, { goal: 22 }) +
      ask("278 is 22 short of 300, so slide both up 22: " + strip("503 + 22", "278 + 22") + " → " + strip("525", "300") + ", and 525 − 300 = 225") +
      say("503 − 278 borrows twice. 525 − 300 borrows never — and it is the same distance, so the same answer: 225.") +
      say("Slide to the NEAREST round number. For 503 − 213, 200 is nearer than 300: slide both DOWN 13, and 490 − 200 = 290."));
  },
  key(item) {
    return [want.num(Math.abs(item.goal)), want.num(item.a + item.goal), want.num(item.a - item.b)];
  },
  answer(item) {
    const { a, b, R, goal } = item;
    return [`${goal > 0 ? "up" : "down"} ${Math.abs(goal)}: ${a + goal} − ${R} = ${a - b}`];
  },
};

const split = {
  id: "vm-split",
  group: "vm-regroup",
  label: "Split into easy regroupers",
  blurb: "503 = 499 + 4: take from the nines, then add the rest back.",
  heading: "Easy regroupers: split off the nines",
  instruction: () =>
    "Noughts in the top number make a take-away borrow again and again. Split the top number instead: the number just under its round hundreds (or tens, or thousands), which ends in nines, and what is left over. Take away from the nines number — a 9 never needs to borrow — then add the left-over back on.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const n = lenOf(o);
    const unit = 10 ** (n - 1);
    const tail = n === 2 ? 4 : n === 3 ? 19 : 39;
    for (;;) {
      const L = r.int(2, 9);
      const a = L * unit + r.int(0, tail);
      const b = r.int(unit + 1, L * unit - 2);
      if (owes(a, b) < 1 || b % 10 === 0) continue;
      const nines = L * unit - 1;
      return { a, b, nines, rest: a - nines };
    }
  },
  render(item) {
    const { a, b } = item;
    return big(`${a} − ${b}`) +
      steps(step(`${a} splits into a nines number`), step("and the rest"), step(`the nines number − ${b} =`), step("+ the rest ="));
  },
  worked() {
    return worked(big("503 − 278") +
      ask("503 = " + strip("499", "+ 4") + "; " + strip("499 − 278", "+ 4") + " → " + strip("221", "+ 4") + " = 225") +
      say("499 is the nines number just under 500, and 503 is 4 more. 499 − 278 is 221 with no borrowing at all. Then the 4 goes back on: 225."));
  },
  key(item) {
    return [want.num(item.nines), want.num(item.rest), want.num(item.nines - item.b), want.num(item.a - item.b)];
  },
  answer(item) {
    const { a, b, nines, rest } = item;
    return [`${a} = ${nines} + ${rest}; ${nines} − ${b} = ${nines - b}, + ${rest} = ${a - b}`];
  },
};

export const CM_EXERCISES = [nine, addc, subc, dbl, ndbl, same, split];
