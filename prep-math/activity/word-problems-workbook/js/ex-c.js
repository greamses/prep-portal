/* ============================================================================
   Competition Word Problems — chapters 9 to 11
   ----------------------------------------------------------------------------
     9  Probability trees   two draws with and without replacement; events
                            that do not affect each other
     10 Percentages         one change after another and changes undone;
                            profit and loss; marks, votes and populations
     11 Remainder theorem   the remainder itself; an unknown coefficient; two
                            unknowns, and the remainder on dividing by a
                            quadratic

   Probabilities are fractions, and any equal fraction is right. Every
   problem is made from its answer (common.js).
   ========================================================================== */

import { bank, P, gcd, naira, names } from "./common.js";

export const C_GROUPS = [
  { id: "wp-prob", chapter: "Chapter 9 · Probability trees", label: "Probability trees", blurb: "Multiply along a path; add the paths you want." },
  { id: "wp-pct", chapter: "Chapter 10 · Percentages", label: "Percentages", blurb: "Changes one after another, profit and loss, marks and votes." },
  { id: "wp-rem", chapter: "Chapter 11 · Remainder theorem", label: "Remainder theorem", blurb: "The remainder on dividing by (x − a) is f(a)." },
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

/* ═══ 11 · REMAINDER THEOREM ═══════════════════════════════════════════════*/

/** A letter or a short expression said outright to the typesetter. */
const M = (tex) => `<span data-tex="${tex}">${tex}</span>`;
const sg = (v) => (v < 0 ? `−${-v}` : String(v));
/** x³ + ax² + bx + c as written. */
function cubic([p, a, b, c], names2 = {}) {
  const t = (k, pw, nm) => {
    if (nm) return ` + ${nm}x${pw === 2 ? "²" : ""}`.replace("x", pw === 0 ? "" : "x");
    if (k === 0) return "";
    const size = Math.abs(k) === 1 && pw > 0 ? "" : String(Math.abs(k));
    return ` ${k < 0 ? "−" : "+"} ${size}${pw === 2 ? "x²" : pw === 1 ? "x" : ""}`;
  };
  return `${p === 1 ? "" : p}x³${t(a, 2, names2.a)}${t(b, 1, names2.b)}${t(c, 0, names2.c)}`;
}
const at = ([p, a, b, c], x) => p * x ** 3 + a * x * x + b * x + c;
/** (x − a) as written: (x − 2), (x + 3). */
const div = (a) => `(x ${a < 0 ? "+" : "−"} ${Math.abs(a)})`;
const coefs = (r, t) => [1, r.int(-4, 5), r.int(-6, 7), r.int(-9, 9)].map((v, i) => (i && t === "gentle" ? Math.abs(v) : v));
const roots = (r, t) => r.pick(t === "gentle" ? [1, 2, 3] : [-3, -2, -1, 1, 2, 3]);

const rmFind = bank("wp-rm-find", "wp-rem", {
  label: "The remainder",
  blurb: "Dividing by (x − a) leaves f(a): put a in for x.",
  heading: "The remainder theorem",
  instruction: "When a polynomial f(x) is divided by (x − a), the remainder is f(a): put a in for x and work it out. " +
    "Mind the sign — dividing by (x + 2) means a is −2. If the remainder is 0, (x − a) is a FACTOR.",
  example: "Find the remainder when x³ − 2x² + 3x − 4 is divided by (x − 2).",
  solution: "f(2) = 8 − 8 + 6 − 4 = 2. The remainder is 2.",
  signed: true,
}, [
  (r, t) => { const f = coefs(r, t), a = roots(r, t); return P(`Find the remainder when ${cubic(f)} is divided by ${div(a)}.`, [["remainder:", at(f, a)]], `f(${sg(a)})`); },
  (r, t) => { const a = roots(r, t), b = r.int(-3, 4), c = r.int(-4, 5); /* (x − a)(x² + bx + c) + R */ const R = r.int(1, 9);
    const f = [1, b - a, c - a * b, -a * c + R]; return P(`${M("f(x)")} = ${cubic(f)}. Find ${M(`f(${a})`)}, the remainder when ${M("f(x)")} is divided by ${div(a)}.`, [["remainder:", R]], `f(${sg(a)}) = ${R}`); },
  (r, t) => { if (t === "gentle") return null; const f = [2, r.int(-4, 5), r.int(-6, 7), r.int(-9, 9)], a = roots(r, t); return P(`Find the remainder when ${cubic(f)} is divided by ${div(a)}.`, [["remainder:", at(f, a)]], `f(${sg(a)})`); },
]);

const rmK = bank("wp-rm-k", "wp-rem", {
  label: "An unknown coefficient",
  blurb: "The remainder is given: f(a) = remainder is an equation in k.",
  heading: "Finding an unknown coefficient",
  instruction: "The polynomial has an unknown number k in it. Put a in for x: f(a) is an expression in k, and it must " +
    "equal the remainder you are told (0 if (x − a) is a factor). Solve that equation for k.",
  example: "(x − 2) is a factor of x³ + kx² − 4x + 4. Find k.",
  solution: "f(2) = 8 + 4k − 8 + 4 = 4k + 4, and it must be 0. So k = −1.",
  signed: true,
}, [
  (r, t) => { const a = roots(r, t), k = r.int(-5, 6), b = r.int(-6, 7), c0 = r.int(-9, 9); const f = [1, k, b, c0]; const R = at(f, a);
    /* make it a factor: move R into the constant */ const f2 = [1, k, b, c0 - R];
    return P(`${div(a)} is a factor of ${cubic(f2, { a: "k" })}. Find ${M("k")}.`, [[`${M("k")} =`, k]], `f(${sg(a)}) = 0`); },
  (r, t) => { const a = roots(r, t), k = r.int(-5, 6), b0 = r.int(-4, 5), c = r.int(-9, 9); const f = [1, b0, k, c];
    return P(`When ${cubic(f, { b: "k" })} is divided by ${div(a)} the remainder is ${sg(at(f, a))}. Find ${M("k")}.`, [[`${M("k")} =`, k]], `f(${sg(a)}) = ${sg(at(f, a))}`); },
  (r, t) => { if (t === "gentle") return null; const a = roots(r, t), k = r.int(-9, 9), a0 = r.int(-4, 5), b = r.int(-6, 7); const f = [1, a0, b, k];
    return P(`When ${cubic(f, { c: "k" })} is divided by ${div(a)} the remainder is ${sg(at(f, a))}. Find ${M("k")}.`, [[`${M("k")} =`, k]], `f(${sg(a)}) = ${sg(at(f, a))}`); },
]);

const rmTwo = bank("wp-rm-two", "wp-rem", {
  label: "Two unknowns, and dividing by a quadratic",
  blurb: "Two remainders give two equations.",
  heading: "Two conditions at once",
  instruction: "Two remainders are two equations: put each a in for x. Solve the pair for the two unknowns. And when a " +
    "polynomial is divided by a QUADRATIC (x − a)(x − b), the remainder is linear, px + q: it must give the right " +
    "remainders at x = a and at x = b, which again is two equations.",
  example: "f(x) leaves remainder 5 when divided by (x − 1) and 2 when divided by (x + 2). Find the remainder when f(x) is divided by (x − 1)(x + 2).",
  solution: "Let it be px + q. At x = 1: p + q = 5. At x = −2: −2p + q = 2. Subtracting: 3p = 3, p = 1, and q = 4. The remainder is x + 4.",
  signed: true,
  count: 2,
}, [
  (r) => { const a1 = r.pick([1, 2]), a2 = r.pick([-1, -2]); const p = r.int(-4, 5), q = r.int(-6, 7), c = r.int(-6, 6); const f = [1, p, q, c];
    return P(`${cubic(f, { a: "p", b: "q" })} leaves remainder ${sg(at(f, a1))} when divided by ${div(a1)} and ${sg(at(f, a2))} when divided by ${div(a2)}. Find ${M("p")} and ${M("q")}.`, [[`${M("p")} =`, p], [`${M("q")} =`, q]], `f(${a1}) and f(${sg(a2)})`); },
  (r) => { const a1 = r.pick([1, 2, 3]), a2 = r.pick([-1, -2, -3]); const p = r.int(-4, 5), q = r.int(-9, 9); if (p === 0) return null;
    return P(`${M("f(x)")} leaves remainder ${sg(p * a1 + q)} when divided by ${div(a1)} and ${sg(p * a2 + q)} when divided by ${div(a2)}. The remainder when ${M("f(x)")} is divided by ${div(a1)}${div(a2)} is ${M("px + q")}. Find ${M("p")} and ${M("q")}.`, [[`${M("p")} =`, p], [`${M("q")} =`, q]], `${a1 === 1 ? "" : a1}p + q = ${sg(p * a1 + q)}; ${a2 === -1 ? "−" : sg(a2)}p + q = ${sg(p * a2 + q)}`); },
  (r) => { const a1 = r.pick([1, 2]), a2 = r.pick([-1, -2, 3]); if (a1 === a2) return null; const m = r.int(-3, 4); /* (x − a1)(x − a2)(x − m): both factors */
    const s1 = a1 + a2 + m, s2 = a1 * a2 + a1 * m + a2 * m, s3 = a1 * a2 * m; const f = [1, -s1, s2, -s3];
    return P(`${div(a1)} and ${div(a2)} are both factors of ${cubic(f, { a: "p", b: "q" })}. Find ${M("p")} and ${M("q")}.`, [[`${M("p")} =`, -s1], [`${M("q")} =`, s2]], `f(${a1}) = 0 and f(${sg(a2)}) = 0`); },
]);

export const C_EXERCISES = [pbWith, pbWithout, pbIndep, pcChange, pcProfit, pcMarks, rmFind, rmK, rmTwo];
