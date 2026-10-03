/* ============================================================================
   Vedic Maths Workbook — CHAPTER 3 · Squares
   ----------------------------------------------------------------------------
   Every squaring trick in one place, because they are one idea seen six ways:
   a square is a LEFT part and a RIGHT part joined, and each family of numbers
   has its own quick way to each part.

     ending in 5          front × one more | 25          (Ekādhikena Pūrvena)
     ending in 1          front² | 2 × front | 1
     starting with 1      the number + its last digit | last digit²
     same digits          77² = 7² × 121,   777² = 7² × 12321
     near 50              25 ± the gap | gap²
     near 100 (or 1000)   the number ± the gap | gap²    (Yāvadūnam)

   Where a right part has more digits than its place, the extra carries left —
   at Gentle the numbers are chosen so nothing does.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, tier, step, steps, strip, pad } from "./common.js";

export const SQ_GROUPS = [
  { id: "vm-squares", chapter: "Chapter 3 · Squares", label: "Squaring tricks", blurb: "Six families of numbers, each with its own quick square." },
];

/* ═══ ending in 5 ═══════════════════════════════════════════════════════════*/

const sq5 = {
  id: "vm-sq5",
  group: "vm-squares",
  label: "Squares ending in 5",
  blurb: "By one more than the one before (Ekādhikena Pūrvena).",
  heading: "Squares ending in 5 — by one more than the one before",
  instruction: () =>
    "To square a number ending in 5, take the number in front of the 5 and multiply it by ONE MORE than itself. Then write 25 after it. The sutra is Ekādhikena Pūrvena, “by one more than the one before”.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const t = tier(o);
    const pool = t === "gentle" ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : t === "middle" ? [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [9, 10, 11, 12, 13, 14, 15, 19, 20, 25];
    const front = pool[(r.int(0, pool.length - 1) + i * 3) % pool.length];
    return { front, n: front * 10 + 5 };
  },
  render(item) {
    const { front, n } = item;
    return big(`${n}²`) + steps(step(`${front} × ${front + 1} =`), step(`so ${n}² =`));
  },
  worked() {
    return worked(big("35²") + ask(strip("3 × 4", "25") + " → " + strip("12", "25") + " = 1225") +
      say("The number in front of the 5 is 3. One more than 3 is 4, and 3 × 4 is 12. Put 25 after it: 1225."));
  },
  key(item) {
    return [want.num(item.front * (item.front + 1)), want.num(item.n * item.n)];
  },
  answer(item) {
    return [`${item.front} × ${item.front + 1} = ${item.front * (item.front + 1)}`, `${item.n}² = ${item.n * item.n}`];
  },
};

/* ═══ ending in 1 ═══════════════════════════════════════════════════════════*/

const sq1 = {
  id: "vm-sq1",
  group: "vm-squares",
  label: "Squares ending in 1",
  blurb: "41²: 4² | 2 × 4 | 1 → 1681.",
  heading: "Squares ending in 1",
  instruction: () =>
    "For a number ending in 1, look at the number in front of the 1. Its square is the left part; twice it is the middle; and the answer ends in 1. If the middle is 10 or more, keep its last digit and carry the rest onto the left part.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const a = t === "gentle" ? r.int(1, 4) : t === "middle" ? r.int(2, 9) : r.int(10, 19);
    return { a, n: 10 * a + 1 };
  },
  render(item) {
    const { a, n } = item;
    return big(`${n}²`) + steps(step(`${a}² =`), step(`2 × ${a} =`), step(`so ${n}² =`));
  },
  worked(o) {
    if (tier(o) === "gentle") return worked(big("31²") + ask(strip("3²", "2 × 3", "1") + " → " + strip("9", "6", "1") + " = 961") +
      say("The number in front of the 1 is 3. 3² is 9, twice 3 is 6, then 1: 961."));
    return worked(big("71²") + ask(strip("7²", "2 × 7", "1") + " → " + strip("49", "14", "1") + " = 5041") +
      say("7² is 49 and twice 7 is 14. The middle can hold one digit: keep the 4, carry 1 onto 49 to make 50. Then 1: 5041."));
  },
  key(item) {
    return [want.num(item.a * item.a), want.num(2 * item.a), want.num(item.n * item.n)];
  },
  answer(item) {
    return [`${item.a * item.a} | ${2 * item.a} | 1`, `${item.n}² = ${item.n * item.n}`];
  },
};

/* ═══ starting with 1 ═══════════════════════════════════════════════════════*/

const sqteen = {
  id: "vm-sqteen",
  group: "vm-squares",
  label: "Squares starting with 1",
  blurb: "13²: 13 + 3 | 3² → 169.",
  heading: "Squares of numbers starting with 1",
  instruction: (o) =>
    tier(o) === "stretch"
      ? "For 101 to 119, add the number and the part after the 1 (108 + 8 = 116) — that is the left part. Square the part after the 1, written as TWO digits (8² is 64; 3² is 09); anything over two digits carries onto the left."
      : "For 11 to 19, add the number and its last digit (13 + 3 = 16) — that is the left part. Square the last digit — that is the right part, ONE digit; if it has two, carry the first onto the left.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    if (t === "stretch") { const b = r.int(2, 19); return { b, n: 100 + b, B: 100 }; }
    const b = t === "gentle" ? r.int(1, 3) : r.int(4, 9);
    return { b, n: 10 + b, B: 10 };
  },
  render(item) {
    const { b, n } = item;
    return big(`${n}²`) + steps(step(`${n} + ${b} =`), step(`${b}² =`), step(`so ${n}² =`));
  },
  worked(o) {
    if (tier(o) === "stretch") return worked(big("108²") + ask(strip("108 + 8", "8²") + " → " + strip("116", "64") + " = 11664") +
      say("108 + 8 is 116; 8² is 64, two digits because the base is 100. Join them: 11664."));
    return worked(big("17²") + ask(strip("17 + 7", "7²") + " → " + strip("24", "49") + " = 289") +
      say("17 + 7 is 24; 7² is 49. The right part holds one digit: keep the 9, carry 4 onto 24 to make 28. So 289."));
  },
  key(item) {
    return [want.num(item.n + item.b), want.num(item.b * item.b), want.num(item.n * item.n)];
  },
  answer(item) {
    return [`${item.n + item.b} | ${item.B === 100 ? pad(item.b * item.b, 2) : item.b * item.b}`, `${item.n}² = ${item.n * item.n}`];
  },
};

/* ═══ same digits ═══════════════════════════════════════════════════════════*/

const sqsame = {
  id: "vm-sqsame",
  group: "vm-squares",
  label: "Squares of same-digit numbers",
  blurb: "77² is 7² × 121; 777² is 7² × 12321.",
  heading: "Squares of numbers with every digit the same",
  instruction: (o) =>
    tier(o) === "stretch"
      ? "A number like 777 is 7 × 111, so its square is 7² × 111², and 111² is 12321. Square the digit, then multiply by 12321."
      : "A number like 77 is 7 × 11, so its square is 7² × 11², and 11² is 121. Square the digit, then multiply by 121 (× 100, + × 20, + × 1).",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const a = t === "gentle" ? r.int(1, 4) : r.int(2, 9);
    const rep = t === "stretch" ? 111 : 11;
    return { a, rep, n: a * rep, times: rep * rep };
  },
  render(item) {
    const { a, n, times } = item;
    return big(`${n}²`) + steps(step(`${a}² =`), step(`× ${times} =`));
  },
  worked(o) {
    if (tier(o) === "stretch") return worked(big("333²") + ask("333 = 3 × 111, so 333² = 3² × 12321 = 9 × 12321 = 110889.") +
      say("9 × 12321: 12321 × 10 is 123210, take away one 12321 — 110889."));
    return worked(big("44²") + ask("44 = 4 × 11, so 44² = 4² × 121 = 16 × 121 = 1936.") +
      say("16 × 121 is 1600 + 320 + 16 — 1936."));
  },
  key(item) {
    return [want.num(item.a * item.a), want.num(item.n * item.n)];
  },
  answer(item) {
    return [`${item.a}² × ${item.times} = ${item.a * item.a} × ${item.times}`, `${item.n}² = ${item.n * item.n}`];
  },
};

/* ═══ near 50 ═══════════════════════════════════════════════════════════════*/

const sq50 = {
  id: "vm-sq50",
  group: "vm-squares",
  label: "Squares near 50",
  blurb: "47²: 25 − 3 | 3² → 2209.",
  heading: "Squares near 50",
  instruction: () =>
    "Find how far the number is from 50. Left part: 25 take away that gap (or add it, above 50). Right part: the gap squared, written as TWO digits (3² is 09). Anything over two digits carries onto the left.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const gap = t === "gentle" ? -r.int(1, 9) : t === "middle" ? r.pick([-1, 1]) * r.int(1, 9) : r.pick([-1, 1]) * r.int(10, 14);
    const x = 50 + gap;
    return { x, gap, left: 25 + gap, right: gap * gap };
  },
  render(item) {
    const { x, gap } = item;
    return big(`${x}²`) + ask(`${x} is ${Math.abs(gap)} ${gap < 0 ? "below" : "above"} 50.`) + steps(
      step(`left: 25 ${gap < 0 ? "−" : "+"} ${Math.abs(gap)} =`),
      step(`right: ${Math.abs(gap)}² =`),
      step(`so ${x}² =`),
    );
  },
  worked() {
    return worked(big("47²") + ask("47 is 3 below 50. " + strip("25 − 3", "3²") + " → " + strip("22", "09") + " = 2209") +
      big("53²") + ask("53 is 3 above 50. " + strip("25 + 3", "3²") + " → " + strip("28", "09") + " = 2809") +
      say("Why 25? 50² is 2500 — 25 hundreds — and each step from 50 moves the square by a hundred."));
  },
  key(item) {
    return [want.num(item.left), want.num(item.right), want.num(item.x * item.x)];
  },
  answer(item) {
    return [`${item.left} | ${pad(item.right, 2)}`, `${item.x}² = ${item.x * item.x}`];
  },
};

/* ═══ near 100 (or 1000) ════════════════════════════════════════════════════*/

const yava = {
  id: "vm-yava",
  group: "vm-squares",
  label: "Squares near 100",
  blurb: "96²: down by the gap, then the gap squared (Yāvadūnam).",
  heading: "Squares near 100 — as much as it is short",
  instruction: () =>
    "Find how far the number is from the base (100, or 1000 at Stretch). Left part: go DOWN from the number by that much (or UP, when it is above the base). Right part: square the gap, written with as many digits as the base has noughts — anything more carries to the left.",
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

export const SQ_EXERCISES = [sq5, sq1, sqteen, sqsame, sq50, yava];
