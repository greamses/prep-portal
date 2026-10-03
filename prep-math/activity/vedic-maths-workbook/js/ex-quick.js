/* ============================================================================
   Vedic Maths Workbook — CHAPTER 1 · Multiplying in your head
   ----------------------------------------------------------------------------
   Five tricks, easiest first. Each one is a pattern the answer ALWAYS has, so
   every question is set out as the trick's own steps — the parts it makes,
   then the answer they join into — and the steps are marked as well as the
   answer: a child who gets the parts right and joins them wrongly has learnt
   something different from one who never found the parts.

     × 11                 the neighbours added, set between the ends
     × 5, × 25, × 50      a nought or two on, then halve or quarter
     squares ending in 5  by one more than the one before (Ekādhikena Pūrvena)
     same tens, units     the tens digit times one more, then the units
     making 10            multiplied — the same sutra again
     vertically and       two-digit times two-digit in three small products
     crosswise            (Ūrdhva-Tiryagbhyām)
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { ask, big, worked, say, tier, step, steps, strip, pad } from "./common.js";

export const QK_GROUPS = [
  { id: "vm-quick", chapter: "Chapter 1 · Multiplying in your head", label: "Quick multipliers", blurb: "× 11, × 5 and × 25 — a pattern instead of a sum." },
  { id: "vm-pattern", label: "Patterns in products", blurb: "Squares ending in 5, units that make 10, and vertically and crosswise." },
];

/* ═══ × 11 ═════════════════════════════════════════════════════════════════*/

const eleven = {
  id: "vm-eleven",
  group: "vm-quick",
  label: "Multiply by 11",
  blurb: "Add the two digits and put the total between them.",
  heading: "Times 11 — the neighbours go in the middle",
  instruction: (o) => tier(o) === "stretch"
    ? "For a three-digit number abc, the answer is a, then a + b, then b + c, then c. When a pair adds to 10 or more, keep the units digit there and carry the 1 to the digit on its left."
    : "Write the first digit and the last digit with a gap between them. Add the two digits: the total goes in the gap. If the total is 10 or more, put down its units digit and carry the 1 onto the first digit.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    if (t === "stretch") return { n: r.int(112, 989) };
    if (t === "gentle") { const a = r.int(1, 8); return { n: 10 * a + r.int(1, 9 - a) }; }
    for (;;) { const n = r.int(19, 98); const [a, b] = [Math.floor(n / 10), n % 10]; if (a + b >= 10 && b) return { n }; }
  },
  render(item) {
    const { n } = item;
    if (n >= 100) return big(`${n} × 11`) + steps(step("the answer:"));
    const a = Math.floor(n / 10), b = n % 10;
    return big(`${n} × 11`) + steps(step(`${a} + ${b} =`), step("the answer:"));
  },
  worked(o) {
    if (tier(o) === "stretch") return worked(big("243 × 11") + ask(strip("2", "2 + 4", "4 + 3", "3") + " → " + strip("2", "6", "7", "3") + " = 2673") +
      say("First digit 2, last digit 3. In between, each pair of neighbours added: 2 + 4 is 6, 4 + 3 is 7. So 2673."));
    if (tier(o) === "gentle") return worked(big("52 × 11") + ask(strip("5", "5 + 2", "2") + " → " + strip("5", "7", "2") + " = 572") +
      say("5 and 2 with a gap; 5 + 2 is 7, and it goes in the gap: 572."));
    return worked(big("68 × 11") + ask(strip("6", "6 + 8", "8") + " → " + strip("6 + 1", "4", "8") + " = 748") +
      say("6 + 8 is 14: the 4 goes in the gap and the 1 is carried onto the 6, which becomes 7. So 748."));
  },
  key(item) {
    const { n } = item;
    if (n >= 100) return [want.num(n * 11)];
    return [want.num(Math.floor(n / 10) + (n % 10)), want.num(n * 11)];
  },
  answer(item) {
    const { n } = item;
    if (n >= 100) return [`${n} × 11 = ${n * 11}`];
    return [`${Math.floor(n / 10)} + ${n % 10} = ${Math.floor(n / 10) + (n % 10)}`, `${n} × 11 = ${n * 11}`];
  },
};

/* ═══ × 5, × 25, × 50 ══════════════════════════════════════════════════════*/

const BY = {
  5: { up: 10, share: 2, says: "times 10, then halve" },
  25: { up: 100, share: 4, says: "times 100, then quarter" },
  50: { up: 100, share: 2, says: "times 100, then halve" },
};

const fives = {
  id: "vm-five",
  group: "vm-quick",
  label: "Multiply by 5, 25 or 50",
  blurb: "5 is half of 10, 25 is a quarter of 100, 50 is half of 100.",
  heading: "Times 5, 25 and 50 — a nought on, then share",
  instruction: () =>
    "5 is half of 10, so × 5 is the same as × 10 and then halving. 25 is a quarter of 100: × 100, then halve twice. 50 is half of 100: × 100, then halve once. Write the first step, then the answer.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const m = t === "gentle" ? 5 : t === "middle" ? r.pick([5, 25]) : r.pick([5, 25, 50]);
    const n = t === "gentle" ? 2 * r.int(6, 49) : m === 5 ? r.int(t === "middle" ? 23 : 123, t === "middle" ? 99 : 989) : r.int(t === "middle" ? 12 : 23, t === "middle" ? 48 : 96);
    return { n, m };
  },
  render(item) {
    const { n, m } = item;
    const b = BY[m];
    return big(`${n} × ${m}`) + steps(step(`${n} × ${b.up} =`), step(`÷ ${b.share} =`));
  },
  worked() {
    return worked(big("46 × 5") + ask("46 × 10 = 460, and half of 460 is 230.") +
      big("32 × 25") + ask("32 × 100 = 3200, and a quarter of 3200 is 800 — halve it, 1600, and halve again, 800.") +
      say("A nought on, then share: much quicker than multiplying by 5 or 25 the long way."));
  },
  key(item) {
    const b = BY[item.m];
    return [want.num(item.n * b.up), want.num(item.n * item.m)];
  },
  answer(item) {
    const b = BY[item.m];
    return [`${item.n} × ${b.up} = ${item.n * b.up}`, `${item.n} × ${item.m} = ${item.n * item.m}`];
  },
};

/* ═══ squares ending in 5 ══════════════════════════════════════════════════*/

const sq5 = {
  id: "vm-sq5",
  group: "vm-pattern",
  label: "Squares ending in 5",
  blurb: "By one more than the one before (Ekādhikena Pūrvena).",
  heading: "Squares ending in 5 — by one more than the one before",
  instruction: () =>
    "To square a number ending in 5, take the number in front of the 5 and multiply it by ONE MORE than itself. Then write 25 after it. That is the whole trick — the sutra is called Ekādhikena Pūrvena, “by one more than the one before”.",
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

/* ═══ same tens, units that make 10 ════════════════════════════════════════*/

const tens = {
  id: "vm-tens",
  group: "vm-pattern",
  label: "Same front, units that make 10",
  blurb: "43 × 47: the front times one more, then the units multiplied.",
  heading: "Same front, units that add to 10",
  instruction: () =>
    "When two numbers start the same and their last digits add up to 10 — like 43 and 47 — multiply the front by one more than itself, then multiply the two last digits. Write the second answer after the first, always as TWO digits: 1 × 9 is written 09.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const front = t === "gentle" ? r.int(1, 5) : t === "middle" ? r.int(2, 9) : r.int(10, 14);
    let u = r.int(1, 9);
    if (u === 5) u = r.pick([1, 2, 3, 4, 6, 7, 8, 9]);
    return { front, u, x: front * 10 + u, y: front * 10 + (10 - u) };
  },
  render(item) {
    const { front, u, x, y } = item;
    return big(`${x} × ${y}`) + steps(step(`${front} × ${front + 1} =`), step(`${u} × ${10 - u} =`), step("the answer:"));
  },
  worked() {
    return worked(big("43 × 47") + ask(strip("4 × 5", "3 × 7") + " → " + strip("20", "21") + " = 2021") +
      say("Both start with 4, and 3 + 7 is 10. 4 × 5 is 20; 3 × 7 is 21. Join them: 2021. With 61 × 69 the units give 1 × 9 = 9, written 09: 4209."));
  },
  key(item) {
    const { front, u, x, y } = item;
    return [want.num(front * (front + 1)), want.num(u * (10 - u)), want.num(x * y)];
  },
  answer(item) {
    const { front, u, x, y } = item;
    return [`${front * (front + 1)} | ${pad(u * (10 - u), 2)}`, `${x} × ${y} = ${x * y}`];
  },
};

/* ═══ vertically and crosswise ═════════════════════════════════════════════*/

const cross = {
  id: "vm-cross",
  group: "vm-pattern",
  label: "Vertically and crosswise",
  blurb: "Any two-digit × two-digit in three small products (Ūrdhva-Tiryagbhyām).",
  heading: "Vertically and crosswise",
  instruction: () =>
    "Write one number under the other. Multiply the right-hand digits (vertically): that is the units. Multiply crosswise — left-top by right-bottom, right-top by left-bottom — and add: that is the tens. Multiply the left-hand digits (vertically): that is the hundreds. Then join them, carrying anything over 9 to the left.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const lo = t === "stretch" ? 5 : 1;
      const a = r.int(Math.max(1, lo), t === "gentle" ? 4 : 9), b = r.int(lo, t === "gentle" ? 4 : 9);
      const c = r.int(Math.max(1, lo), t === "gentle" ? 4 : 9), d = r.int(lo, t === "gentle" ? 4 : 9);
      const L = a * c, C = a * d + b * c, R = b * d;
      if (t === "gentle" && (L > 9 || C > 9 || R > 9)) continue;
      if (t !== "gentle" && C < 10 && R < 10) continue; // Middle and Stretch carry
      return { a, b, c, d, L, C, R, x: 10 * a + b, y: 10 * c + d };
    }
  },
  render(item) {
    const { a, b, c, d, x, y } = item;
    return big(`${x} × ${y}`) + steps(
      step(`right, vertically: ${b} × ${d} =`),
      step(`crosswise: ${a} × ${d} + ${b} × ${c} =`),
      step(`left, vertically: ${a} × ${c} =`),
      step("the answer:"),
    );
  },
  worked(o) {
    if (tier(o) === "gentle") return worked(big("21 × 13") + ask(strip("2 × 1", "2 × 3 + 1 × 1", "1 × 3") + " → " + strip("2", "7", "3") + " = 273") +
      say("Right: 1 × 3 is 3. Crosswise: 2 × 3 + 1 × 1 is 7. Left: 2 × 1 is 2. Join them: 273."));
    return worked(big("47 × 36") + ask(strip("4 × 3", "4 × 6 + 7 × 3", "7 × 6") + " → " + strip("12", "45", "42") + " = 1692") +
      say("Right: 7 × 6 is 42 — keep the 2, carry 4. Crosswise: 4 × 6 + 7 × 3 is 45, and 45 + 4 is 49 — keep the 9, carry 4. Left: 4 × 3 is 12, and 12 + 4 is 16. So 1692."));
  },
  key(item) {
    return [want.num(item.R), want.num(item.C), want.num(item.L), want.num(item.x * item.y)];
  },
  answer(item) {
    return [`${item.L} | ${item.C} | ${item.R}`, `${item.x} × ${item.y} = ${item.x * item.y}`];
  },
};

export const QK_EXERCISES = [eleven, fives, sq5, tens, cross];
