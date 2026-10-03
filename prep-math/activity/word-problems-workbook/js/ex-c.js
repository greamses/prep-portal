/* ============================================================================
   Competition Word Problems — chapters 9 to 11
   ----------------------------------------------------------------------------
     9  Probability trees   two draws with and without replacement; events
                            that do not affect each other
     10 Percentages         one change after another and changes undone;
                            profit and loss; marks, votes and populations
     11 Remainders          where in a cycle: the day of the week after so
                            many days, the colour picked after so many turns,
                            and the units digit of a power

   Probabilities are fractions, and any equal fraction is right. Every
   problem is made from its answer (common.js).
   ========================================================================== */

import { bank, P, gcd, naira, names } from "./common.js";

export const C_GROUPS = [
  { id: "wp-prob", chapter: "Chapter 9 · Probability trees", label: "Probability trees", blurb: "Multiply along a path; add the paths you want." },
  { id: "wp-pct", chapter: "Chapter 10 · Percentages", label: "Percentages", blurb: "Changes one after another, profit and loss, marks and votes." },
  { id: "wp-rem", chapter: "Chapter 11 · Remainders", label: "Remainders", blurb: "The remainder says where in a cycle you are: days, patterns, units digits." },
];

/* ═══ 9 · PROBABILITY TREES ════════════════════════════════════════════════*/

const COLOURS = [["red", "blue"], ["green", "yellow"], ["black", "white"]];
const bag = (r, t) => { const n = r.int(t === "gentle" ? 4 : 5, t === "gentle" ? 7 : 12); const a = r.int(2, n - 2); const [c1, c2] = r.pick(COLOURS); return { a, b: n - a, n, c1, c2 }; };

const pbWith = bank("wp-pb-with", "wp-prob", {
  label: "Two draws, put back",
  blurb: "The bag is the same for the second draw.",
  heading: "Probability trees: with replacement",
  instruction: "Draw the tree: two branches for the first draw, and two more from the end of each for the second. " +
    "Because the first is PUT BACK, the second draw has the same chances. MULTIPLY along a path for the chance of " +
    "that path; ADD the paths that give what is asked. Answer as a fraction.",
  example: "A bag has 3 red and 2 blue balls. One is drawn, put back, and another drawn. Find the probability that both are red, and that they are different colours.",
  solution: "P(red) = 3/5 and P(blue) = 2/5 each time. Both red: 3/5 × 3/5 = 9/25. Different: red-blue + blue-red = 6/25 + 6/25 = 12/25.",
}, [
  (r, t) => { const { a, b, n, c1, c2 } = bag(r, t); return P(`A bag has ${a} ${c1} and ${b} ${c2} balls. One is drawn, its colour noted, and it is put back; then a second is drawn. Find the probability that both are ${c1}, and the probability that they are different colours.`, [[`both ${c1}:`, [a * a, n * n]], ["different:", [2 * a * b, n * n]]], `${a}/${n} × ${a}/${n}; 2 × ${a}/${n} × ${b}/${n}`); },
  (r, t) => { const { a, b, n, c1, c2 } = bag(r, t); return P(`A box has ${a} ${c1} and ${b} ${c2} counters. One is taken, replaced, and another taken. Find the probability that both are the same colour, and that at least one is ${c2}.`, [["same colour:", [a * a + b * b, n * n]], [`at least one ${c2}:`, [n * n - a * a, n * n]]], `(${a}² + ${b}²) ÷ ${n}²; 1 − (${a}/${n})²`); },
  (r, t) => { if (t === "gentle") return null; return P(`A fair coin is tossed three times. Find the probability of exactly two heads, and of at least one head.`, [["exactly two:", [3, 8]], ["at least one:", [7, 8]]], `3 paths of 1/8; 1 − 1/8`); },
  (r) => { const f = r.pick([[1, 6, "a six"], [1, 2, "an even number"], [1, 3, "a number greater than 4"]]); return P(`A fair die is thrown twice. Find the probability of ${f[2]} both times, and of ${f[2]} on neither throw.`, [["both:", [f[0] * f[0], f[1] * f[1]]], ["neither:", [(f[1] - f[0]) ** 2, f[1] * f[1]]]], `(${f[0]}/${f[1]})²; (${f[1] - f[0]}/${f[1]})²`); },
]);

const pbWithout = bank("wp-pb-without", "wp-prob", {
  label: "Two draws, not put back",
  blurb: "One fewer in the bag — and one fewer of what came out.",
  heading: "Probability trees: without replacement",
  instruction: "When the first is NOT put back, the second draw is from a different bag: one fewer altogether, and one " +
    "fewer of the colour already drawn. So the second branches depend on the first. Multiply along paths and add " +
    "paths, as before.",
  example: "A bag has 3 red and 2 blue balls. Two are drawn one after the other, without replacement. Find the probability that both are red.",
  solution: "First red: 3/5. Then 2 reds are left among 4: 2/4. Both red: 3/5 × 2/4 = 6/20 = 3/10.",
}, [
  (r, t) => { const { a, b, n, c1, c2 } = bag(r, t); return P(`A bag has ${a} ${c1} and ${b} ${c2} balls. Two are drawn one after the other, without replacement. Find the probability that both are ${c1}, and that they are different colours.`, [[`both ${c1}:`, [a * (a - 1), n * (n - 1)]], ["different:", [2 * a * b, n * (n - 1)]]], `${a}/${n} × ${a - 1}/${n - 1}; 2 × ${a}/${n} × ${b}/${n - 1}`); },
  (r, t) => { const { a, b, n, c1, c2 } = bag(r, t); return P(`From ${a} ${c1} and ${b} ${c2} sweets, two are picked at random and eaten. Find the probability that they are the same colour.`, [["same colour:", [a * (a - 1) + b * (b - 1), n * (n - 1)]]], `(${a} × ${a - 1} + ${b} × ${b - 1}) ÷ (${n} × ${n - 1})`); },
  (r) => { const g = r.int(3, 8), b = r.int(3, 8); const n = g + b; return P(`A class has ${g} girls and ${b} boys. Two pupils are chosen at random. Find the probability that both are girls, and that at least one is a boy.`, [["both girls:", [g * (g - 1), n * (n - 1)]], ["at least one boy:", [n * (n - 1) - g * (g - 1), n * (n - 1)]]], `${g}/${n} × ${g - 1}/${n - 1}`); },
  (r, t) => { if (t === "gentle") return null; const d = r.int(2, 4), n = r.int(8, 12); return P(`A box of ${n} bulbs has ${d} that are faulty. Two are taken without replacement. Find the probability that neither is faulty, and that exactly one is.`, [["neither:", [(n - d) * (n - d - 1), n * (n - 1)]], ["exactly one:", [2 * d * (n - d), n * (n - 1)]]], `${n - d}/${n} × ${n - d - 1}/${n - 1}`); },
]);

const FRACS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [1, 5], [4, 5]];

const pbIndep = bank("wp-pb-indep", "wp-prob", {
  label: "Two events that do not affect each other",
  blurb: "Both, exactly one, at least one.",
  heading: "Probability trees: independent events",
  instruction: "Two events that do not affect each other are INDEPENDENT. The tree has “happens” and “does not happen” " +
    "for each. BOTH happen: multiply. EXACTLY ONE: the two paths with one of each, added. AT LEAST ONE: 1 take away " +
    "the path where neither happens.",
  example: "A hits a target with probability 1/2 and B with probability 2/3. Find the probability that both hit, and that at least one hits.",
  solution: "Both: 1/2 × 2/3 = 1/3. Neither: 1/2 × 1/3 = 1/6, so at least one: 1 − 1/6 = 5/6.",
}, [
  (r) => { const [a, b] = r.pick(FRACS), [c, d] = r.pick(FRACS); const [A, B] = names(r, 2);
    return P(`${A} hits a target with probability ${a}/${b}, and ${B} with probability ${c}/${d}. Each shoots once. Find the probability that both hit, and that at least one hits.`, [["both:", [a * c, b * d]], ["at least one:", [b * d - (b - a) * (d - c), b * d]]], `${a}/${b} × ${c}/${d}; 1 − ${b - a}/${b} × ${d - c}/${d}`); },
  (r) => { const [a, b] = r.pick(FRACS), [c, d] = r.pick(FRACS); const [A, B] = names(r, 2);
    return P(`The probability that ${A} passes an examination is ${a}/${b}, and that ${B} passes is ${c}/${d}. Find the probability that exactly one of them passes.`, [["exactly one:", [a * (d - c) + (b - a) * c, b * d]]], `${a}/${b} × ${d - c}/${d} + ${b - a}/${b} × ${c}/${d}`); },
  (r, t) => { if (t === "gentle") return null; const [a, b] = r.pick(FRACS), [c, d] = r.pick(FRACS), [e, f] = r.pick(FRACS);
    return P(`Three people solve a problem independently with probabilities ${a}/${b}, ${c}/${d} and ${e}/${f}. Find the probability that the problem is solved by at least one of them.`, [["solved:", [b * d * f - (b - a) * (d - c) * (f - e), b * d * f]]], `1 − ${b - a}/${b} × ${d - c}/${d} × ${f - e}/${f}`); },
  (r) => { const [a, b] = r.pick(FRACS), [c, d] = r.pick(FRACS);
    return P(`The probability of rain on Saturday is ${a}/${b}, and on Sunday ${c}/${d}. Find the probability that it rains on neither day, and on both days.`, [["neither:", [(b - a) * (d - c), b * d]], ["both:", [a * c, b * d]]], `${b - a}/${b} × ${d - c}/${d}`); },
]);

/* ═══ 10 · PERCENTAGES ═════════════════════════════════════════════════════*/

const pcChange = bank("wp-pc-change", "wp-pct", {
  label: "One change after another, and changes undone",
  blurb: "Multiply the multipliers; divide to go back.",
  heading: "Successive and reversed changes",
  instruction: "A rise of 20% multiplies by 1.2; a fall of 10% multiplies by 0.9. Changes one after another MULTIPLY — " +
    "they do not add. To go BACK to the amount before a change, DIVIDE by the multiplier: after a 20% rise the new " +
    "amount is 120% of the old one.",
  example: "After a discount of 20% a radio costs ₦6,400. What was the marked price?",
  solution: "₦6,400 is 80% of the marked price, so the marked price is 6400 ÷ 0.8 = ₦8,000.",
}, [
  (r) => { const P0 = r.int(2, 40) * 1000, a = r.pick([10, 20, 25, 50]), b = r.pick([10, 20, 25, 50]); const f = (P0 * (100 + a) * (100 - b)) / 10000; if (!Number.isInteger(f)) return null;
    return P(`The price of a phone, ${naira(P0)}, is raised by ${a}% and later reduced by ${b}%. What is the final price?`, [["₦:", f]], `${P0} × ${(100 + a) / 100} × ${(100 - b) / 100}`); },
  (r) => { const d = r.pick([10, 20, 25, 30, 40]), m = r.int(2, 60) * 1000; const s = (m * (100 - d)) / 100; if (!Number.isInteger(s)) return null;
    return P(`After a discount of ${d}%, a television costs ${naira(s)}. What was its marked price?`, [["₦:", m]], `${s} ÷ ${(100 - d) / 100}`); },
  (r) => { const a = r.pick([10, 20, 30, 40, 50]); return P(`A salary is raised by ${a}% and then cut by ${a}%. By what percentage is it finally less than at first?`, [["%:", (a * a) / 100]], `${(100 + a) / 100} × ${(100 - a) / 100} = ${((100 + a) * (100 - a)) / 10000}`); },
  (r, t) => { if (t === "gentle") return null; const sp = r.pick([60, 70, 75, 80, 85, 90]), inc = r.int(2, 40) * 1000; const save = (inc * (100 - sp)) / 100; if (!Number.isInteger(save)) return null;
    return P(`A man spends ${sp}% of his income and saves ${naira(save)} a month. What is his income?`, [["₦:", inc]], `${save} is ${100 - sp}%`); },
  (r, t) => { if (t === "gentle") return null; const p0 = r.int(2, 30) * 1000, g = r.pick([10, 20]); const f = (p0 * (100 + g) * (100 + g)) / 10000; if (!Number.isInteger(f)) return null;
    return P(`The population of a town was ${p0.toLocaleString("en-NG")} and grows by ${g}% every year. What is it after 2 years?`, [["people:", f]], `${p0} × ${(100 + g) / 100}²`); },
]);

const pcProfit = bank("wp-pc-profit", "wp-pct", {
  label: "Profit and loss",
  blurb: "Always a percentage of the COST price.",
  heading: "Profit and loss",
  instruction: "Profit and loss are always worked as a percentage of the COST price. A gain of 25% means selling at " +
    "125% of cost; a loss of 10% means selling at 90% of cost. When one selling price loses and another gains, the " +
    "DIFFERENCE between the two selling prices is (loss% + gain%) of the cost.",
  example: "A trader sells a bag at a loss of 10%. If he had sold it for ₦600 more he would have gained 5%. Find the cost price.",
  solution: "From a 10% loss to a 5% gain is 15% of the cost, and that is ₦600. So the cost is 600 ÷ 0.15 = ₦4,000.",
}, [
  (r) => { const c = r.int(2, 60) * 500, g = r.pick([10, 20, 25, 30, 40, 50]); const s = (c * (100 + g)) / 100;
    return P(`A trader buys a bicycle for ${naira(c)} and sells it for ${naira(s)}. What is her profit per cent?`, [["%:", g]], `${s - c} ÷ ${c} × 100`); },
  (r) => { const l = r.pick([5, 10, 15, 20]), g = r.pick([5, 10, 15, 20, 25]), c = r.int(2, 40) * 1000; const more = (c * (l + g)) / 100; if (!Number.isInteger(more)) return null;
    return P(`By selling a goat a farmer loses ${l}%. Had he sold it for ${naira(more)} more, he would have gained ${g}%. Find the cost price.`, [["₦:", c]], `${l + g}% of cost = ${more}`); },
  (r) => { const l = r.pick([10, 20, 25]), g = r.pick([10, 20, 25, 50]), c = r.int(2, 30) * 1000; const s = (c * (100 - l)) / 100, s2 = (c * (100 + g)) / 100; if (!Number.isInteger(s) || !Number.isInteger(s2)) return null;
    return P(`A man sells a radio for ${naira(s)} and loses ${l}%. At what price must he sell it to gain ${g}%?`, [["₦:", s2]], `cost ${c}; × ${(100 + g) / 100}`); },
  (r, t) => { if (t === "gentle") return null; const c = r.int(2, 20) * 1000, up = r.pick([20, 25, 40, 50, 60]), d = r.pick([10, 20, 25]); const net = ((100 + up) * (100 - d)) / 100 - 100; if (!Number.isInteger(net) || net <= 0) return null;
    return P(`A shopkeeper marks his goods ${up}% above cost and then allows a discount of ${d}%. What is his profit per cent?`, [["%:", net]], `${(100 + up) / 100} × ${(100 - d) / 100} = ${(100 + net) / 100}`); },
  (r, t) => { if (t === "gentle") return null; const n = r.pick([10, 12, 15, 20]), m = r.pick([8, 9, 10, 12, 16]); if (m >= n) return null; const g = ((n - m) * 100) / m; if (!Number.isInteger(g)) return null;
    return P(`The cost price of ${n} articles is equal to the selling price of ${m} of them. Find the gain per cent.`, [["%:", g]], `(${n} − ${m}) ÷ ${m} × 100`); },
]);

const pcMarks = bank("wp-pc-marks", "wp-pct", {
  label: "Marks, votes and shares",
  blurb: "Two percentages of the same total: their difference is a known number.",
  heading: "Percentages of an unknown total",
  instruction: "When two percentages of the SAME unknown total are compared, their difference is a percentage of the " +
    "total too — and the story tells you what number that difference is. Find 1%, then the total.",
  example: "A candidate who scores 30% fails by 20 marks; one who scores 45% gets 10 marks more than the pass mark. Find the maximum mark.",
  solution: "From 30% to 45% is 15% of the total, and that covers 20 + 10 = 30 marks. So 1% is 2 marks and the maximum is 200.",
}, [
  (r) => { const M = r.int(2, 12) * 100, p = r.pick([20, 25, 30, 35]), q = p + r.pick([10, 15, 20]); const lo = (p * M) / 100, hi = (q * M) / 100; const pass = r.int(lo + 5, hi - 5);
    return P(`A candidate who scores ${p}% of the marks fails by ${pass - lo} marks. Another who scores ${q}% gets ${hi - pass} marks more than the pass mark. Find the maximum mark and the pass mark.`, [["maximum:", M], ["pass mark:", pass]], `${q - p}% = ${hi - lo} marks`); },
  (r) => { const w = r.pick([55, 60, 65, 70, 75]), T = r.int(2, 60) * 1000; const maj = (T * (2 * w - 100)) / 100; if (!Number.isInteger(maj)) return null;
    return P(`In an election between two candidates, the winner received ${w}% of the votes and won by ${maj.toLocaleString("en-NG")} votes. How many votes were cast?`, [["votes:", T]], `${2 * w - 100}% = ${maj}`); },
  (r) => { const boys = r.pick([40, 45, 55, 60, 65]), T = r.int(2, 30) * 100; const diff = Math.abs((T * (2 * boys - 100)) / 100); if (!Number.isInteger(diff)) return null;
    return P(`${boys}% of the pupils in a school are boys, and there are ${diff} ${boys > 50 ? "more boys than girls" : "more girls than boys"}. How many pupils are in the school?`, [["pupils:", T]], `${Math.abs(2 * boys - 100)}% = ${diff}`); },
  (r, t) => { if (t === "gentle") return null; const x = r.int(2, 12) * 100; const a = r.pick([20, 25, 40]), b = r.pick([50, 60, 75]); const v = (x * a * b) / 10000; if (!Number.isInteger(v)) return null;
    return P(`${b}% of ${a}% of a number is ${v}. Find the number.`, [["number:", x]], `${v} ÷ ${(a * b) / 10000}`); },
  (r, t) => { if (t === "gentle") return null; const [A, B] = names(r, 2); const p = r.pick([20, 25, 50]); const [n, d] = [100 * p, 100 + p]; const g = gcd(n, d);
    return P(`${A}'s income is ${p}% more than ${B}'s. By what percentage is ${B}'s income less than ${A}'s? (Give a fraction if it is not whole.)`, [["%:", [n / g, d / g]]], `${p} ÷ ${100 + p} × 100`); },
]);

/* ═══ 11 · REMAINDERS ══════════════════════════════════════════════════════
   Not the algebra theorem: the remainder as the thing that says WHERE IN A
   CYCLE you are. Days of the week go round in 7, a pattern of colours in as
   many as there are colours, the last digit of a power in 1, 2 or 4. Divide
   by the length of the cycle, throw the whole turns away, and count on by
   what is left. */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const mod = (a, m) => ((a % m) + m) % m;
const powmod = (a, n, m) => { let x = 1; for (let i = 0; i < n; i++) x = (x * a) % m; return x; };
/** How long the last digits of a's powers take to come round again. */
const cycleOf = (a, m = 10) => { const first = a % m; let x = first, k = 1; while ((x = (x * a) % m) !== first) k++; return k; };
/** 1st, 2nd, 3rd, 24th. */
const nth = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
/** A count that is NOT a whole number of turns, so there is a remainder to use. */
const count = (r, lo, hi, cycle) => { for (;;) { const n = r.int(lo, hi); if (n % cycle) return n; } };

const rmDays = bank("wp-rm-days", "wp-rem", {
  label: "Days, months and the clock",
  blurb: "Seven days make a week: only the remainder moves the day on.",
  heading: "Remainders: the calendar and the clock",
  instruction: "The days of the week come round every 7 days, so a whole number of weeks changes nothing. Divide the " +
    "number of days by 7 and keep only the REMAINDER: count on that many days (or back, for days ago). The same " +
    "works for months (12 in a cycle) and for a 12-hour clock.",
  example: "Today is Tuesday. What day of the week will it be 765 days from now?",
  solution: "765 ÷ 7 = 109 remainder 2. The 109 weeks bring us back to Tuesday; 2 days on is Thursday.",
}, [
  (r, t) => { const d = r.int(0, 6), n = count(r, t === "gentle" ? 20 : 100, t === "gentle" ? 100 : 1000, 7);
    return P(`Today is ${DAYS[d]}. What day of the week will it be ${n} days from now?`, [["day:", DAYS[mod(d + n, 7)]]], `${n} ÷ 7 leaves ${n % 7}: count on ${n % 7}`); },
  (r, t) => { if (t === "gentle") return null; const d = r.int(0, 6), n = count(r, 100, 1000, 7);
    return P(`Today is ${DAYS[d]}. What day of the week was it ${n} days ago?`, [["day:", DAYS[mod(d - n, 7)]]], `${n} ÷ 7 leaves ${n % 7}: count back ${n % 7}`); },
  (r) => { const m = r.int(0, 11), n = count(r, 20, 200, 12);
    return P(`It is ${MONTHS[m]} now. Which month will it be ${n} months from now?`, [["month:", MONTHS[mod(m + n, 12)]]], `${n} ÷ 12 leaves ${n % 12}: count on ${n % 12}`); },
  (r) => { const h = r.int(1, 12), n = count(r, 30, 500, 12); const now = mod(h + n, 12) || 12;
    return P(`A 12-hour clock shows ${h} o'clock. What hour will it show ${n} hours from now?`, [["o'clock:", now]], `${n} ÷ 12 leaves ${n % 12}: count on ${n % 12}`); },
  (r, t) => { if (t === "gentle") return null; const d = r.int(0, 6), leap = r.chance(0.4);
    return P(`${leap ? "A leap year (366 days)" : "A year of 365 days"} begins on a ${DAYS[d]}. On what day of the week does the NEXT year begin?`, [["day:", DAYS[mod(d + (leap ? 366 : 365), 7)]]], `${leap ? 366 : 365} ÷ 7 leaves ${leap ? 2 : 1}`); },
  (r, t) => { if (t !== "stretch") return null; const d = r.int(0, 6), a = r.pick([2, 3, 10]), k = r.int(5, 12); const left = powmod(a, k, 7);
    return P(`Today is ${DAYS[d]}. What day of the week will it be ${a}^${k} days from now? (Find the remainder without working the power out: the remainders of the powers of ${a} repeat.)`, [["day:", DAYS[mod(d + left, 7)]]], `${a}^${k} leaves ${left} on dividing by 7`); },
]);

const COLOURS3 = ["red", "yellow", "blue", "white", "pink", "purple"];
const WORDS = ["LAGOS", "KANO", "ABUJA", "MATHS", "PRIZE", "SCHOOL", "NIGERIA"];

const rmCycle = bank("wp-rm-cycle", "wp-rem", {
  label: "Patterns that repeat",
  blurb: "Whose turn, which colour, which letter — after a great many.",
  heading: "Remainders: where in the pattern?",
  instruction: "A pattern that repeats is a cycle. Count how many things are in ONE turn of it, divide the position " +
    "you are asked about by that number, and keep the REMAINDER: a remainder of 1 is the first thing in the " +
    "pattern, 2 the second, and so on. A remainder of 0 means a turn has just finished — it is the LAST thing.",
  example: "Three friends pick flowers in turn, and the colours go red, yellow, blue, red, yellow, blue, … What colour is the 100th flower picked?",
  solution: "The pattern is 3 long. 100 ÷ 3 = 33 remainder 1, so the 100th flower is the 1st colour of the pattern: red.",
  signed: true,
}, [
  (r, t) => { const k = t === "gentle" ? 3 : r.int(3, 5); const cols = COLOURS3.slice(0, k); const who = names(r, 3); const n = r.int(t === "gentle" ? 20 : 50, t === "gentle" ? 80 : 400);
    return P(`${who[0]}, ${who[1]} and ${who[2]} pick flowers one after another, and the colours picked go ${cols.join(", ")}, in that order, again and again. What colour is the ${nth(n)} flower picked?`, [["colour:", cols[mod(n - 1, k)]]], `${n} ÷ ${k} leaves ${n % k}`); },
  (r, t) => { const who = names(r, t === "gentle" ? 3 : r.int(3, 5)); const k = who.length; const n = r.int(30, 300);
    return P(`${who.slice(0, -1).join(", ")} and ${who[k - 1]} take turns, in that order, to pick a flower from a basket. Who picks the ${nth(n)} flower?`, [["name:", who[mod(n - 1, k)]]], `${n} ÷ ${k} leaves ${n % k}`); },
  (r) => { const w = r.pick(WORDS); const n = r.int(30, 500);
    return P(`The word ${w} is written again and again without a break: ${w}${w}${w}… What is the ${nth(n)} letter written?`, [["letter:", w[mod(n - 1, w.length)]]], `${n} ÷ ${w.length} leaves ${n % w.length}`); },
  (r, t) => { if (t === "gentle") return null; const c = r.int(5, 12), n = r.int(50, 500);
    return P(`${c} children sit in a circle, numbered 1 to ${c}. A count starts at child 1 and goes round and round the circle. Which child is counted ${nth(n)}?`, [["child:", mod(n - 1, c) + 1]], `${n} ÷ ${c} leaves ${n % c}${n % c ? "" : ": the last child"}`); },
  (r, t) => { if (t === "gentle") return null; const n = r.int(20, 200);
    return P(`1/7 = 0.142857142857…, the six digits 142857 repeating for ever. What is the ${nth(n)} digit after the decimal point?`, [["digit:", Number("142857"[mod(n - 1, 6)])]], `${n} ÷ 6 leaves ${n % 6}`); },
  (r, t) => { if (t !== "stretch") return null; const a = r.int(2, 3), b = r.int(1, 2), k = a + b; const n = count(r, 40, 300, k); const full = Math.floor(n / k), left = n % k;
    return P(`Beads are threaded in the pattern ${a} red, ${b} blue, ${a} red, ${b} blue, … How many of the first ${n} beads are red?`, [["red beads:", full * a + Math.min(left, a)]], `${full} whole turns and ${left} more beads`); },
]);

const rmUnits = bank("wp-rm-units", "wp-rem", {
  label: "The units digit of a power",
  blurb: "Last digits go round in a cycle of 1, 2 or 4.",
  heading: "Remainders: units digits",
  instruction: "The UNITS digit of a product depends only on the units digits multiplied. So the units digits of the " +
    "powers of a number go round in a short cycle: for 2 it is 2, 4, 8, 6, 2, 4, 8, 6, … — four long. Divide the " +
    "power by the length of the cycle and use the REMAINDER to pick the digit (a remainder of 0 is the last of " +
    "the cycle). For a product of powers, find each units digit and multiply them.",
  example: "What is the units digit of 7^83?",
  solution: "The units digits of the powers of 7 go 7, 9, 3, 1 and repeat: a cycle of 4. 83 ÷ 4 leaves 3, so it is the 3rd in the cycle: 3.",
  signed: true,
}, [
  (r, t) => { if (t !== "gentle") return null; const a = r.int(11, 99), b = r.int(11, 99), c = r.int(11, 99);
    return P(`Without multiplying out, what is the units digit of ${a} × ${b} × ${c}?`, [["units digit:", ((a % 10) * (b % 10) * (c % 10)) % 10]], `${a % 10} × ${b % 10} × ${c % 10}`); },
  (r, t) => { const a = r.pick(t === "gentle" ? [2, 3, 4, 7, 8, 9] : [2, 3, 7, 8, 12, 13, 17, 18, 23, 27]); const n = r.int(t === "gentle" ? 10 : 30, t === "gentle" ? 40 : 300);
    return P(`What is the units digit of ${a}^${n}?`, [["units digit:", powmod(a, n, 10)]], `cycle of ${cycleOf(a)}; ${n} ÷ ${cycleOf(a)} leaves ${n % cycleOf(a)}`); },
  (r, t) => { if (t === "gentle") return null; const [a, b] = [r.pick([2, 3, 7, 8]), r.pick([3, 4, 7, 9])]; if (a === b) return null; const m = r.int(15, 120), n = r.int(15, 120);
    return P(`What is the units digit of ${a}^${m} × ${b}^${n}?`, [["units digit:", (powmod(a, m, 10) * powmod(b, n, 10)) % 10]], `${powmod(a, m, 10)} × ${powmod(b, n, 10)}`); },
  (r, t) => { if (t === "gentle") return null; const a = r.pick([2, 3, 7, 8]), n = r.int(20, 200);
    return P(`What is the remainder when ${a}^${n} is divided by 5?`, [["remainder:", powmod(a, n, 5)]], `the remainders go round in ${cycleOf(a, 5)}; ${n} ÷ ${cycleOf(a, 5)} leaves ${n % cycleOf(a, 5)}`); },
  (r, t) => { if (t !== "stretch") return null; const [a, b] = [r.pick([2, 3, 7, 8]), r.pick([4, 9, 3, 7])]; if (a === b) return null; const m = r.int(30, 200), n = r.int(30, 200);
    return P(`What is the units digit of ${a}^${m} + ${b}^${n}?`, [["units digit:", (powmod(a, m, 10) + powmod(b, n, 10)) % 10]], `${powmod(a, m, 10)} + ${powmod(b, n, 10)}`); },
  (r, t) => { if (t !== "stretch") return null; const a = r.pick([2, 3, 4, 5]), n = r.int(20, 150);
    return P(`What is the remainder when ${a}^${n} is divided by 7?`, [["remainder:", powmod(a, n, 7)]], `the remainders go round in ${cycleOf(a, 7)}; ${n} ÷ ${cycleOf(a, 7)} leaves ${n % cycleOf(a, 7)}`); },
]);

export const C_EXERCISES = [pbWith, pbWithout, pbIndep, pcChange, pcProfit, pcMarks, rmDays, rmCycle, rmUnits];
