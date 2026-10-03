/* ============================================================================
   Vedic Maths Workbook — CHAPTER 2 · Working from a base
   ----------------------------------------------------------------------------
   10, 100 and 1000 are easy to multiply by and to take away from, so a number
   NEAR one of them is easy too, once you know how far from it it is. Four
   tricks built on that one idea (the sutra Nikhilam — "all from 9 and the last
   from 10" — is the first of them, and finds how far is far):

     taking from a base   all from 9 and the last from 10
     multiplying near a   cross-subtract, then multiply how far each is
     base                 from the base
     squares near a base  go down (or up) by the gap, then square the gap
                          (Yāvadūnam)
     dividing by 9        the first digit, then running totals

   The right-hand part always has as many digits as the base has noughts —
   100 means two, so 3 × 4 is written 12 and 2 × 3 is written 06. That is the
   one rule children forget, and the strips show it every time.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, tier, step, steps, strip, pad } from "./common.js";

export const BS_GROUPS = [
  { id: "vm-base", chapter: "Chapter 2 · Working from a base", label: "Near 10, 100 and 1000", blurb: "How far from the base — then the base does the work." },
  { id: "vm-divide", label: "Dividing by 9", blurb: "The first digit, then running totals." },
];

/* ═══ all from 9 and the last from 10 ══════════════════════════════════════*/

const nine = {
  id: "vm-nine",
  group: "vm-base",
  label: "Take away from 100, 1000, 10 000",
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

/* ═══ multiplying near a base ══════════════════════════════════════════════*/

function nearPair(r, t) {
  if (t === "gentle") {
    // base 10, both below, the product of the gaps a single digit
    for (;;) { const x = r.int(6, 9), y = r.int(6, 9); if ((10 - x) * (10 - y) <= 9) return { B: 10, x, y }; }
  }
  if (t === "middle") return { B: 100, x: r.int(88, 99), y: r.int(88, 99) };
  return r.int(0, 1)
    ? { B: 100, x: r.int(101, 112), y: r.int(101, 109) }
    : { B: 1000, x: r.int(988, 999), y: r.int(985, 999) };
}

const near = {
  id: "vm-near",
  group: "vm-base",
  label: "Multiply near a base",
  blurb: "97 × 96: how far below 100 each is, then cross-subtract.",
  heading: "Multiplying numbers near a base",
  instruction: (o) =>
    "Write how far each number is from the base (10, 100 or 1000). Left part: take one number's gap from the OTHER number (cross-subtract)" +
    (tier(o) === "stretch" ? " — or add it, when both are above the base." : ".") +
    " Right part: multiply the two gaps, and write it with as many digits as the base has noughts. Join the parts.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const { B, x, y } = nearPair(r, tier(o));
    const dx = x - B, dy = y - B; // negative when below the base
    const places = String(B).length - 1;
    return { B, x, y, dx, dy, left: x + dy, right: dx * dy, places };
  },
  render(item) {
    const { B, x, y, dx, dy } = item;
    const how = (n, d) => `${n} is ${Math.abs(d)} ${d < 0 ? "below" : "above"} ${B}`;
    return big(`${x} × ${y}`) + ask(`${how(x, dx)}; ${how(y, dy)}.`) + steps(
      step(`left: ${x} ${dy < 0 ? "−" : "+"} ${Math.abs(dy)} =`),
      step(`right: ${Math.abs(dx)} × ${Math.abs(dy)} =`),
      step("the answer:"),
    );
  },
  worked(o) {
    if (tier(o) === "gentle") return worked(big("8 × 7") + ask("8 is 2 below 10; 7 is 3 below 10. " + strip("8 − 3", "2 × 3") + " → " + strip("5", "6") + " = 56") +
      say("Cross-subtract: 8 − 3 (or 7 − 2) is 5. Multiply the gaps: 2 × 3 is 6. Join them: 56."));
    return worked(big("97 × 96") + ask("97 is 3 below 100; 96 is 4 below. " + strip("97 − 4", "3 × 4") + " → " + strip("93", "12") + " = 9312") +
      say("Cross-subtract: 97 − 4 is 93. Multiply the gaps: 3 × 4 is 12 — two digits, because 100 has two noughts. Join them: 9312."));
  },
  key(item) {
    return [want.num(item.left), want.num(item.right), want.num(item.x * item.y)];
  },
  answer(item) {
    return [`${item.left} | ${pad(item.right, item.places)}`, `${item.x} × ${item.y} = ${item.x * item.y}`];
  },
};

/* ═══ squares near a base ══════════════════════════════════════════════════*/

const yava = {
  id: "vm-yava",
  group: "vm-base",
  label: "Squares near a base",
  blurb: "96²: down by the gap, then the gap squared (Yāvadūnam).",
  heading: "Squares near a base — as much as it is short",
  instruction: () =>
    "Find how far the number is from the base. Left part: go DOWN from the number by that much (or UP, when it is above the base). Right part: square the gap, written with as many digits as the base has noughts — anything more carries to the left.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const B = t === "stretch" && r.int(0, 2) === 0 ? 1000 : 100;
    let gap;
    if (t === "gentle") gap = -r.int(1, 9);
    else if (t === "middle") gap = r.pick([-1, 1]) * r.int(1, 9);
    else gap = B === 1000 ? r.pick([-1, 1]) * r.int(3, 30) : r.pick([-1, 1]) * r.int(10, 15);
    const x = B + gap;
    return { B, x, gap, left: x + gap, right: gap * gap, places: String(B).length - 1 };
  },
  render(item) {
    const { B, x, gap } = item;
    return big(`${x}²`) + ask(`${x} is ${Math.abs(gap)} ${gap < 0 ? "below" : "above"} ${B}.`) + steps(
      step(`left: ${x} ${gap < 0 ? "−" : "+"} ${Math.abs(gap)} =`),
      step(`right: ${Math.abs(gap)}² =`),
      step(`so ${x}² =`),
    );
  },
  worked() {
    return worked(big("96²") + ask("96 is 4 below 100. " + strip("96 − 4", "4²") + " → " + strip("92", "16") + " = 9216") +
      big("104²") + ask("104 is 4 above 100. " + strip("104 + 4", "4²") + " → " + strip("108", "16") + " = 10816") +
      say("Down (or up) by the gap, then the gap squared in two digits. If the square of the gap has more digits than that — 12² is 144 — the extra 1 carries onto the left part."));
  },
  key(item) {
    return [want.num(item.left), want.num(item.right), want.num(item.x * item.x)];
  },
  answer(item) {
    return [`${item.left} | ${pad(item.right, item.places)}`, `${item.x}² = ${item.x * item.x}`];
  },
};

/* ═══ dividing by 9 ═════════════════════════════════════════════════════════*/

const div9 = {
  id: "vm-div9",
  group: "vm-divide",
  label: "Divide by 9",
  blurb: "The first digit starts the answer; the running total is the remainder.",
  heading: "Dividing by 9 with running totals",
  instruction: () =>
    "Write the first digit: it starts the answer. Add it to the next digit and write that, and so on — each new digit of the answer is the running total so far. The last running total (adding in the last digit) is the remainder. If the remainder is 9 or more, take 9 off it and add 1 to the answer.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const n = t === "gentle" ? r.int(11, 88) : t === "middle" ? r.int(101, 499) : r.int(1001, 3999);
      const sum = String(n).split("").reduce((s, d) => s + Number(d), 0);
      if (t === "gentle" && sum >= 9) continue; // the remainder never needs fixing
      if (n % 9 === 0 && t !== "stretch") continue;
      return { n };
    }
  },
  render(item) {
    return big(`${item.n} ÷ 9`) + steps(step("answer:"), step("remainder:"));
  },
  worked(o) {
    if (tier(o) === "gentle") return worked(big("23 ÷ 9") + ask("The first digit 2 is the answer; 2 + 3 = 5 is the remainder: 2 remainder 5.") +
      say("Check: 9 × 2 is 18, and 18 + 5 is 23."));
    return worked(big("132 ÷ 9") + ask(strip("1", "1 + 3", "1 + 3 + 2") + " → " + strip("1", "4", "6") + " → 14 remainder 6") +
      say("Running totals: 1, then 1 + 3 = 4, then 4 + 2 = 6. The last one is the remainder, so 132 ÷ 9 is 14 remainder 6. Check: 9 × 14 is 126, and 126 + 6 is 132."));
  },
  key(item) {
    return [want.num(Math.floor(item.n / 9)), want.num(item.n % 9)];
  },
  answer(item) {
    return [`${item.n} ÷ 9 = ${Math.floor(item.n / 9)} remainder ${item.n % 9}`];
  },
};

export const BS_EXERCISES = [nine, near, yava, div9];
