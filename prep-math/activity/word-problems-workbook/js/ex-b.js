/* ============================================================================
   Competition Word Problems — chapters 5 to 8
   ----------------------------------------------------------------------------
     5  Algebraic fractions      work and pipes, numbers in parts, speed and time
     6  Systems of equations     two unknowns from two facts; three from three
     7  Sequence and series      arithmetic and geometric: a term, a sum, a count
     8  Arrangements, selections orders that matter and orders that do not

   Every problem is made from its answer (common.js).
   ========================================================================== */

import { bank, P, gcd, naira, names, plural } from "./common.js";

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const nPr = (n, r) => fact(n) / fact(n - r);
const nCr = (n, r) => nPr(n, r) / fact(r);

export const B_GROUPS = [
  { id: "wp-frac", chapter: "Chapter 5 · Algebraic fractions", label: "Algebraic fractions", blurb: "Work done together, parts of a number, speed and time." },
  { id: "wp-sys", chapter: "Chapter 6 · Systems of equations", label: "Systems of equations", blurb: "Two facts, two unknowns — and three of each." },
  { id: "wp-seq", chapter: "Chapter 7 · Sequence and series", label: "Sequence and series", blurb: "Arithmetic and geometric: a term, a sum, a count." },
  { id: "wp-arr", chapter: "Chapter 8 · Arrangements and selections", label: "Arrangements and selections", blurb: "Does the order matter? Then count." },
];

/* ═══ 5 · ALGEBRAIC FRACTIONS ══════════════════════════════════════════════*/

/* a, b and the time together, all whole: 1/a + 1/b = 1/t */
const TOGETHER = [[3, 6, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [12, 24, 8], [20, 30, 12], [6, 30, 5], [12, 36, 9], [10, 40, 8], [15, 30, 10], [8, 24, 6], [14, 35, 10], [18, 36, 12], [9, 18, 6], [21, 28, 12]];

const frWork = bank("wp-fr-work", "wp-frac", {
  label: "Work, pipes and taps",
  blurb: "Someone who takes a days does 1/a of the job in a day.",
  heading: "Work done together",
  instruction: "Turn TIMES into RATES: a worker who takes a days does 1/a of the job each day. Rates add (and a leak or " +
    "a pipe emptying takes away). The time for the whole job is 1 ÷ the total rate — so 1/a + 1/b = 1/t.",
  example: "A can do a job in 10 days and B in 15 days. How long do they take working together?",
  solution: "In a day A does 1/10 and B 1/15: together 1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6 of the job. So they take 6 days.",
}, [
  (r) => { const [a, b, t] = r.pick(TOGETHER); const [A, B] = names(r, 2); return P(`${A} can do a piece of work in ${a} days and ${B} in ${b} days. How many days will they take working together?`, [["days:", t]], `1/${a} + 1/${b} = 1/${t}`); },
  (r) => { const [a, b, t] = r.pick(TOGETHER); const [A, B] = names(r, 2); return P(`${A} and ${B} together finish a job in ${t} days. ${A} alone would take ${a} days. How many days would ${B} take alone?`, [["days:", b]], `1/${t} − 1/${a} = 1/${b}`); },
  (r) => { const [a, b, t] = r.pick(TOGETHER); return P(`One pipe fills a tank in ${a} hours and another in ${b} hours. If both are opened, how many hours does the tank take to fill?`, [["hours:", t]], `1/${a} + 1/${b} = 1/${t}`); },
  (r, t0) => { if (t0 === "gentle") return null; const [a, b, t] = r.pick(TOGETHER);
    /* 1/t − 1/a = 1/b: the tap alone takes t, the leak alone would empty it in a, and so filling takes b */
    return P(`A tap fills a tank in ${t} hours, but because of a leak in the bottom it takes ${b} hours. How long would the leak take to empty the full tank?`, [["hours:", a]], `1/${t} − 1/${b} = 1/${a}`); },
  (r, t0) => { if (t0 !== "stretch") return null; const [a, b, t] = r.pick(TOGETHER); const d = r.int(1, a - 1);
    /* A alone for d days leaves (a − d)/a of the job, done together at 1/t a day */
    const days = ((a - d) * t) / a; if (!Number.isInteger(days)) return null; const [A, B] = names(r, 2);
    return P(`${A} can do a job in ${a} days and ${B} in ${b} days. ${A} works alone for ${d} ${plural(d, "day")}, then ${B} joins. How many MORE days do they take to finish?`, [["days:", days]], `${a - d}/${a} of the job left, at 1/${t} a day`); },
]);

const frNumber = bank("wp-fr-number", "wp-frac", {
  label: "Numbers in parts",
  blurb: "A third of it, a quarter of it — clear the fractions.",
  heading: "Fractions of an unknown number",
  instruction: "Call the number x. Write each part as a fraction of x — a third of it is x/3 — and make the equation the " +
    "story tells. Then multiply every term by the lowest common denominator and the fractions are gone.",
  example: "A third of a number is 5 more than a quarter of it. Find the number.",
  solution: "x/3 − x/4 = 5. Multiply by 12: 4x − 3x = 60, so x = 60.",
}, [
  (r) => { const x = 12 * r.int(1, 12); return P(`A third of a number is ${x / 12} more than a quarter of it. Find the number.`, [["number:", x]], `x/3 − x/4 = ${x / 12}`); },
  (r) => { const x = 6 * r.int(2, 15); return P(`A number, half of it and a third of it add up to ${(11 * x) / 6}. Find the number.`, [["number:", x]], `x + x/2 + x/3 = ${(11 * x) / 6}`); },
  (r) => { const k = r.int(2, 7), m = r.int(1, 4); if (k <= m) return null; const d = 2 * k - m;
    return P(`The numerator of a fraction is ${k} less than its denominator. If ${m} is added to both, the fraction becomes 1/2. Find the original fraction.`, [["fraction:", [d - k, d]]], `(d − ${k} + ${m})/(d + ${m}) = 1/2`); },
  (r, t) => { if (t === "gentle") return null; const x = 20 * r.int(2, 12); const a = x / 4, b = x / 5; const left = x - a - b;
    return P(`A man spends a quarter of his money on food and a fifth on transport, and has ${naira(left * 100)} left. How much did he have?`, [["₦:", x * 100]], `x − x/4 − x/5 = ${left * 100}`); },
  (r, t) => { if (t === "gentle") return null; const n = r.int(3, 9), c = r.int(2, 8) * 100; const more = r.int(1, 3); /* T shared among n gets c; with `more` more each gets less by d */
    const T = n * (n + more) * (c / 100) * 100; const each1 = T / n, each2 = T / (n + more);
    return P(`${naira(T)} is shared equally among some children. If there were ${more} more ${plural(more, "child", "children")}, each would get ${naira(each1 - each2)} less. How many children are there?`, [["children:", n]], `${T}/x − ${T}/(x + ${more}) = ${each1 - each2}`); },
]);

const frSpeed = bank("wp-fr-speed", "wp-frac", {
  label: "Speed, distance and time",
  blurb: "Time = distance ÷ speed: the unknown is underneath.",
  heading: "Speed and time",
  instruction: "Time = distance ÷ speed, so when the SPEED is the unknown it sits underneath a fraction. Write the time " +
    "for each way of doing the journey, and make the equation from how the times compare. AVERAGE speed is the WHOLE " +
    "distance ÷ the WHOLE time — never the average of the speeds.",
  example: "A journey of 120 km takes 1 hour less when the speed is raised by 10 km/h. Find the original speed.",
  solution: "120/v − 120/(v + 10) = 1. Trying v = 30: 4 hours against 3 hours — 1 hour less. So v = 30 km/h.",
}, [
  (r, t) => { const v = r.int(1, t === "gentle" ? 3 : 5) * 5, tt = r.int(3, 7); const s = v * (tt - 1), D = s * tt;
    return P(`A journey of ${D} km takes 1 hour less when the speed is raised by ${v} km/h. Find the original speed.`, [["km/h:", s]], `${D}/v − ${D}/(v + ${v}) = 1`); },
  (r) => { const [a, b] = r.pick([[30, 60], [40, 60], [20, 30], [60, 90], [40, 120], [24, 40], [30, 45], [48, 80]]); const avg = (2 * a * b) / (a + b);
    return P(`A driver goes from A to B at ${a} km/h and returns at ${b} km/h. What is the average speed for the whole journey?`, [["km/h:", avg]], `2 × ${a} × ${b} ÷ (${a} + ${b})`); },
  (r) => { const c = r.int(1, 4), b = c + r.int(3, 10); const t1 = r.int(2, 4), t2 = r.int(2, 5);
    return P(`A boat travels ${(b + c) * t1} km downstream in ${t1} hours and ${(b - c) * t2} km upstream in ${t2} hours. Find the speed of the boat in still water and the speed of the stream.`, [["boat (km/h):", b], ["stream (km/h):", c]], `b + c = ${b + c}, b − c = ${b - c}`); },
  (r, t) => { if (t === "gentle") return null; const v1 = r.int(4, 8) * 10, d = r.int(1, 3) * 10; const v2 = v1 + d; const head = r.int(1, 3); const tt = (v1 * head) / d; if (!Number.isInteger(tt)) return null;
    return P(`A lorry leaves a town at ${v1} km/h. ${head} ${plural(head, "hour")} later a car follows at ${v2} km/h. How many hours does the car take to catch the lorry?`, [["hours:", tt]], `${v2}t = ${v1}(t + ${head})`); },
  (r) => { const L1 = r.int(1, 4) * 50, L2 = r.int(1, 4) * 50, s = r.int(2, 6) * 5; const tt = (L1 + L2) / s; if (!Number.isInteger(tt)) return null;
    return P(`A train ${L1} m long passes completely over a bridge ${L2} m long at ${s} m/s. How many seconds does it take?`, [["seconds:", tt]], `(${L1} + ${L2}) ÷ ${s}`); },
]);

/* ═══ 6 · SYSTEMS OF EQUATIONS ═════════════════════════════════════════════*/

const sysItems = bank("wp-sy-items", "wp-sys", {
  label: "Two purchases",
  blurb: "Two bills for the same two things.",
  heading: "Two unknown prices",
  instruction: "Each bill is one equation in the two prices. Make the number of ONE item the same in both — multiply a " +
    "bill up if you must — then take one bill from the other and that item is gone.",
  example: "3 pens and 2 books cost ₦1,300. 2 pens and 3 books cost ₦1,700. Find the cost of a pen and of a book.",
  solution: "3p + 2b = 1300 and 2p + 3b = 1700. Adding: 5p + 5b = 3000, so p + b = 600. Then (3p + 2b) − 2(p + b) = p = 100, and b = 500.",
}, [
  (r, t) => { const p = r.int(2, t === "gentle" ? 9 : 20) * 50, b = r.int(2, t === "gentle" ? 9 : 24) * 50; const a1 = r.int(1, 4), b1 = r.int(1, 4), a2 = r.int(1, 4), b2 = r.int(1, 4);
    if (a1 * b2 === a2 * b1) return null; const [[x1, x], [y1, y]] = r.pick([[["pen", "pens"], ["book", "books"]], [["mango", "mangoes"], ["pineapple", "pineapples"]], [["cup", "cups"], ["plate", "plates"]], [["ruler", "rulers"], ["eraser", "erasers"]]]);
    return P(`${a1} ${plural(a1, x1, x)} and ${b1} ${plural(b1, y1, y)} cost ${naira(a1 * p + b1 * b)}. ${a2} ${plural(a2, x1, x)} and ${b2} ${plural(b2, y1, y)} cost ${naira(a2 * p + b2 * b)}. Find the cost of one of each.`, [[`${x1} (₦):`, p], [`${y1} (₦):`, b]], `${a1}x + ${b1}y = ${a1 * p + b1 * b}; ${a2}x + ${b2}y = ${a2 * p + b2 * b}`); },
  (r) => { const a = r.int(4, 12) * 100, c = r.int(1, 3) * 100; const x = r.int(20, 150), y = r.int(20, 200);
    return P(`${x + y} tickets were sold, adults' at ${naira(a)} and children's at ${naira(c)}, for ${naira(a * x + c * y)} in all. How many of each were sold?`, [["adults':", x], ["children's:", y]], `x + y = ${x + y}; ${a}x + ${c}y = ${a * x + c * y}`); },
  (r) => { const legs = r.pick([[2, 4, "hens", "goats"], [2, 4, "ducks", "cows"]]); const x = r.int(5, 40), y = r.int(5, 40);
    return P(`A farmer keeps ${legs[2]} and ${legs[3]}. They have ${x + y} heads and ${2 * x + 4 * y} legs between them. How many of each are there?`, [[`${legs[2]}:`, x], [`${legs[3]}:`, y]], `x + y = ${x + y}; 2x + 4y = ${2 * x + 4 * y}`); },
]);

const sysNumbers = bank("wp-sy-digits", "wp-sys", {
  label: "Numbers and digits",
  blurb: "Sum and difference; a two-digit number turned round.",
  heading: "Unknown numbers",
  instruction: "Two numbers from their sum and difference: ADD the two equations for twice the larger. A two-digit number " +
    "with tens digit x and ones digit y is 10x + y, and reversed it is 10y + x — the difference between a number and " +
    "its reverse is always 9 × (the difference of its digits).",
  example: "A two-digit number is 4 times the sum of its digits, and reversing its digits adds 27. Find the number.",
  solution: "Reversing adds 9(y − x) = 27, so y − x = 3. And 10x + y = 4(x + y) gives 6x = 3y, y = 2x. So x = 3, y = 6: the number is 36.",
}, [
  (r, t) => { const b = r.int(3, t === "gentle" ? 30 : 90), d = r.int(2, 40); return P(`Two numbers add up to ${2 * b + d} and differ by ${d}. Find them.`, [["larger:", b + d], ["smaller:", b]], `2 × larger = ${2 * b + d} + ${d}`); },
  (r) => { const x = r.int(1, 8), y = r.int(x + 1, 9); return P(`The digits of a two-digit number add up to ${x + y}. When the digits are reversed the number increases by ${9 * (y - x)}. Find the number.`, [["number:", 10 * x + y]], `x + y = ${x + y}; y − x = ${y - x}`); },
  (r, t) => { if (t === "gentle") return null; const a = r.int(2, 9), b = r.int(2, 9), k = r.int(2, 4), m = r.int(2, 4); if (k === m && a === b) return null;
    return P(`${k} times one number added to ${m} times another gives ${k * a + m * b}; ${m} times the first added to ${k} times the second gives ${m * a + k * b}. Find the two numbers.`, [["first:", a], ["second:", b]], `add the equations: ${k + m}(x + y) = ${(k + m) * (a + b)}`); },
  (r, t) => { if (t === "gentle") return null; const top = r.int(2, 7), bot = top + r.int(1, 7); if (gcd(top, bot) !== 1) return null;
    const g1 = gcd(top + 1, bot + 1), g2 = gcd(top - 1, bot - 1);
    return P(`If 1 is added to both the top and the bottom of a fraction it becomes ${(top + 1) / g1}/${(bot + 1) / g1}. If 1 is taken from both it becomes ${(top - 1) / g2}/${(bot - 1) / g2}. Find the fraction.`, [["fraction:", [top, bot]]], `two equations in the top and the bottom`); },
]);

const sysThree = bank("wp-sy-three", "wp-sys", {
  label: "Three unknowns",
  blurb: "Pairs added: add all three and halve.",
  heading: "Three unknowns from three facts",
  instruction: "When you are told A + B, B + C and A + C, ADD all three: that is twice (A + B + C). Halve it for the " +
    "total, then take each pair's sum away to find the one left out.",
  example: "A and B together have ₦70, B and C ₦90, and A and C ₦80. How much has each?",
  solution: "Adding: 2(A + B + C) = 240, so A + B + C = 120. Then C = 120 − 70 = 50, A = 120 − 90 = 30, and B = 120 − 80 = 40.",
}, [
  (r, t) => { const k = t === "gentle" ? 10 : 100; const a = r.int(2, 30) * k, b = r.int(2, 30) * k, c = r.int(2, 30) * k; const [A, B, C] = names(r, 3);
    return P(`${A} and ${B} together have ${naira(a + b)}, ${B} and ${C} have ${naira(b + c)}, and ${A} and ${C} have ${naira(a + c)}. How much has each?`, [[`${A} (₦):`, a], [`${B} (₦):`, b], [`${C} (₦):`, c]], `total ${(2 * (a + b + c)) / 2}`); },
  (r) => { const a = r.int(20, 70), b = r.int(20, 70), c = r.int(20, 70); const [A, B, C] = names(r, 3);
    return P(`${A} and ${B} together weigh ${a + b} kg, ${B} and ${C} weigh ${b + c} kg, and ${A} and ${C} weigh ${a + c} kg. What does each weigh?`, [[`${A}:`, a], [`${B}:`, b], [`${C}:`, c]], `total ${a + b + c} kg`); },
  (r, t) => { if (t === "gentle") return null; const x = r.int(1, 9), y = r.int(1, 9), z = r.int(1, 9);
    const sg = (v) => (v < 0 ? `−${-v}` : String(v));
    return P(`Three numbers x, y and z satisfy x + y + z = ${x + y + z}, x − y + z = ${sg(x - y + z)} and x + y − z = ${sg(x + y - z)}. Find them.`, [["x:", x], ["y:", y], ["z:", z]], `subtract to get 2y = ${2 * y} and 2z = ${2 * z}`); },
]);

/* ═══ 7 · SEQUENCE AND SERIES ══════════════════════════════════════════════*/

const sqAp = bank("wp-sq-ap", "wp-seq", {
  label: "Arithmetic: a term and a sum",
  blurb: "nth term a + (n − 1)d; sum n/2 × (first + last).",
  heading: "Arithmetic progressions in stories",
  instruction: "Something that goes up by the SAME amount each time is an arithmetic progression. The nth term is the " +
    "first term plus (n − 1) of the steps: a + (n − 1)d. The sum of n terms is n/2 × (first + last).",
  example: "A boy saves ₦50 in the first week and ₦20 more each week than the week before. How much does he save in the 10th week, and in the 10 weeks altogether?",
  solution: "10th term: 50 + 9 × 20 = ₦230. Sum: 10/2 × (50 + 230) = 5 × 280 = ₦1,400.",
}, [
  (r, t) => { const a = r.int(2, 12) * 10, d = r.int(1, 6) * 5, n = r.int(6, t === "gentle" ? 10 : 20); const l = a + (n - 1) * d;
    return P(`A girl saves ${naira(a)} in the first week and ${naira(d)} more each week than the week before. How much does she save in week ${n}, and how much in the ${n} weeks altogether?`, [[`week ${n} (₦):`, l], ["altogether (₦):", (n * (a + l)) / 2]], `${a} + ${n - 1} × ${d} = ${l}`); },
  (r) => { const a = r.int(8, 20), d = r.int(1, 4), n = r.int(8, 25); const l = a + (n - 1) * d;
    return P(`A hall has ${a} seats in its front row, and each row has ${d} more ${plural(d, "seat")} than the row in front. There are ${n} rows. How many seats are in the last row, and how many in the hall?`, [["last row:", l], ["in the hall:", (n * (a + l)) / 2]], `${a} + ${n - 1} × ${d} = ${l}`); },
  (r, t) => { if (t === "gentle") return null; const a = r.int(3, 20), d = r.int(2, 9), p = r.int(3, 6), q = p + r.int(3, 8);
    return P(`The ${p}th term of an arithmetic progression is ${a + (p - 1) * d} and the ${q}th term is ${a + (q - 1) * d}. Find the first term and the common difference.`, [["first term:", a], ["common difference:", d]], `${q - p}d = ${(q - p) * d}`); },
  (r) => { const n = r.int(10, 50); return P(`Find the sum of the first ${n} counting numbers, 1 + 2 + 3 + … + ${n}.`, [["sum:", (n * (n + 1)) / 2]], `${n} × ${n + 1} ÷ 2`); },
]);

const sqGp = bank("wp-sq-gp", "wp-seq", {
  label: "Geometric: doubling and halving",
  blurb: "nth term a × rⁿ⁻¹: multiply by the same number each time.",
  heading: "Geometric progressions in stories",
  instruction: "Something MULTIPLIED by the same number each time is a geometric progression. The nth term is the first " +
    "term × the ratio (n − 1) times: a × rⁿ⁻¹. For a short series, the sum is quickest by adding the terms; in " +
    "general it is a(rⁿ − 1) ÷ (r − 1).",
  example: "A culture starts with 5 bacteria and doubles every hour. How many are there after 6 hours?",
  solution: "After 6 hours it has doubled 6 times: 5 × 2⁶ = 5 × 64 = 320.",
}, [
  (r, t) => { const a = r.int(2, 9), rr = r.pick([2, 3]), n = r.int(3, rr === 2 ? (t === "gentle" ? 6 : 9) : 5);
    return P(`A colony starts with ${a} bacteria and ${rr === 2 ? "doubles" : "trebles"} every hour. How many are there after ${n} hours?`, [["bacteria:", a * rr ** n]], `${a} × ${rr}^${n}`); },
  (r) => { const a = r.int(1, 6), rr = r.pick([2, 3]), n = r.int(4, rr === 2 ? 8 : 5); const s = (a * (rr ** n - 1)) / (rr - 1);
    return P(`Find the ${n}th term and the sum of the first ${n} terms of the geometric progression ${a}, ${a * rr}, ${a * rr * rr}, …`, [[`${n}th term:`, a * rr ** (n - 1)], ["sum:", s]], `${a} × ${rr}^${n - 1}; ${a}(${rr}^${n} − 1) ÷ ${rr - 1}`); },
  (r, t) => { if (t === "gentle") return null; const h = 2 ** r.int(4, 7), n = r.int(2, 4);
    return P(`A ball is dropped from ${h} m and each time bounces to half the height it fell from. How high does it rise after the ${n === 2 ? "2nd" : n === 3 ? "3rd" : "4th"} bounce?`, [["m:", h / 2 ** n]], `${h} × (1/2)^${n}`); },
  (r, t) => { if (t === "gentle") return null; const a = r.int(1, 5), rr = r.pick([2, 3]), p = r.int(2, 3), q = p + 2;
    return P(`The ${p === 2 ? "2nd" : "3rd"} term of a geometric progression of positive terms is ${a * rr ** (p - 1)} and the ${q}th term is ${a * rr ** (q - 1)}. Find the common ratio and the first term.`, [["ratio:", rr], ["first term:", a]], `r² = ${rr * rr}`); },
]);

const sqCount = bank("wp-sq-count", "wp-seq", {
  label: "How many terms, and special sums",
  blurb: "Multiples in a range; odd numbers; the term that reaches a value.",
  heading: "Counting terms",
  instruction: "The multiples of k from one number to another are an arithmetic progression with difference k: the " +
    "number of terms is (last − first) ÷ k + 1. The first n ODD numbers add up to n². To find WHICH term has a given " +
    "value, solve a + (n − 1)d = value for n.",
  example: "How many multiples of 7 are there between 20 and 100?",
  solution: "The first is 21 and the last is 98: (98 − 21) ÷ 7 + 1 = 11 + 1 = 12 multiples.",
}, [
  (r) => { const k = r.int(3, 9), lo = r.int(10, 60), hi = lo + r.int(40, 150); const first = Math.ceil(lo / k) * k, last = Math.floor(hi / k) * k; const n = (last - first) / k + 1;
    return P(`How many multiples of ${k} are there from ${lo} to ${hi}, and what do they add up to?`, [["how many:", n], ["sum:", (n * (first + last)) / 2]], `${first}, …, ${last}`); },
  (r) => { const n = r.int(6, 30); return P(`Find the sum of the first ${n} odd numbers, 1 + 3 + 5 + …`, [["sum:", n * n]], `${n}²`); },
  (r) => { const a = r.int(2, 15), d = r.int(2, 9), n = r.int(8, 30);
    return P(`Which term of the arithmetic progression ${a}, ${a + d}, ${a + 2 * d}, … is ${a + (n - 1) * d}?`, [["term number:", n]], `${a} + (n − 1) × ${d} = ${a + (n - 1) * d}`); },
  (r, t) => { if (t === "gentle") return null; const a = r.int(3, 9), d = r.int(2, 5), n = r.int(6, 15); const s = (n * (2 * a + (n - 1) * d)) / 2;
    return P(`Logs are stacked with ${a + (n - 1) * d} in the bottom row and ${d} fewer in each row above, down to ${a} in the top row. How many rows are there, and how many logs?`, [["rows:", n], ["logs:", s]], `(${a + (n - 1) * d} − ${a}) ÷ ${d} + 1 = ${n}`); },
]);

/* ═══ 8 · ARRANGEMENTS AND SELECTIONS ══════════════════════════════════════*/

const WORDS = [["LAGOS", 5, []], ["KANO", 4, []], ["ABUJA", 5, [2]], ["LEVEL", 5, [2, 2]], ["BANANA", 6, [3, 2]], ["LETTER", 6, [2, 2]], ["SCHOOL", 6, [2]], ["PEPPER", 6, [3, 2]], ["DELTA", 5, []], ["BENUE", 5, [2]], ["IBADAN", 6, [2]], ["ENUGU", 5, [2]], ["OGUN", 4, []], ["KADUNA", 6, [2]]];

const arArrange = bank("wp-ar-arrange", "wp-arr", {
  label: "Arrangements",
  blurb: "In a row, with letters repeated, with two kept together.",
  heading: "Arrangements: the order matters",
  instruction: "n different things in a row can be arranged in n! ways. If some are ALIKE, divide by the factorial of " +
    "how many of each are alike. If two must stay TOGETHER, tie them into one (arrange, then × 2 for their own two " +
    "orders); if they must be APART, take the together ways from all the ways.",
  example: "In how many ways can the letters of LEVEL be arranged?",
  solution: "5 letters with two L's and two E's: 5! ÷ (2! × 2!) = 120 ÷ 4 = 30.",
}, [
  (r) => { const [w, n, reps] = r.pick(WORDS); return P(`In how many different ways can the letters of the word ${w} be arranged?`, [["ways:", fact(n) / reps.reduce((p, v) => p * fact(v), 1)]], `${n}!${reps.length ? ` ÷ (${reps.map((v) => `${v}!`).join(" × ")})` : ""}`); },
  (r) => { const n = r.int(4, 7); const [A, B] = names(r, 2); return P(`${n} people, among them ${A} and ${B}, stand in a row. In how many ways can they stand if ${A} and ${B} must be next to each other?`, [["ways:", fact(n - 1) * 2]], `${n - 1}! × 2`); },
  (r, t) => { if (t === "gentle") return null; const n = r.int(4, 7); const [A, B] = names(r, 2); return P(`${n} people, among them ${A} and ${B}, stand in a row. In how many ways can they stand if ${A} and ${B} must NOT be next to each other?`, [["ways:", fact(n) - fact(n - 1) * 2]], `${n}! − ${n - 1}! × 2`); },
  (r) => { const n = r.int(5, 8), k = r.int(2, 3); return P(`In how many ways can a president${k === 3 ? ", a secretary and a treasurer" : " and a secretary"} be chosen from ${n} people, no one holding two posts?`, [["ways:", nPr(n, k)]], `${Array.from({ length: k }, (_, i) => n - i).join(" × ")}`); },
  (r, t) => { if (t === "gentle") return null; const n = r.int(5, 8); return P(`In how many ways can ${n} people sit round a round table?`, [["ways:", fact(n - 1)]], `(${n} − 1)!`); },
]);

const arSelect = bank("wp-ar-select", "wp-arr", {
  label: "Selections",
  blurb: "A committee is the same committee in any order.",
  heading: "Selections: the order does not matter",
  instruction: "Choosing r from n when the order does not matter is ⁿCᵣ = n! ÷ (r! × (n − r)!). When the choice must have " +
    "so many of each kind, choose each kind SEPARATELY and MULTIPLY. “At least one” is quickest as all the ways take " +
    "away the ways with none.",
  example: "A committee of 2 men and 2 women is to be chosen from 5 men and 4 women. In how many ways?",
  solution: "Men: ⁵C₂ = 10. Women: ⁴C₂ = 6. Together: 10 × 6 = 60 ways.",
}, [
  (r) => { const n = r.int(5, 10), k = r.int(2, 4); return P(`In how many ways can a committee of ${k} be chosen from ${n} people?`, [["ways:", nCr(n, k)]], `${n}C${k}`); },
  (r) => { const m = r.int(4, 7), w = r.int(4, 6), a = r.int(1, 3), b = r.int(1, 2); return P(`A committee of ${a} ${plural(a, "man", "men")} and ${b} ${plural(b, "woman", "women")} is to be chosen from ${m} men and ${w} women. In how many ways can it be done?`, [["ways:", nCr(m, a) * nCr(w, b)]], `${m}C${a} × ${w}C${b}`); },
  (r) => { const n = r.int(5, 20); return P(`${n} people at a meeting each shake hands once with every other. How many handshakes are there?`, [["handshakes:", (n * (n - 1)) / 2]], `${n}C2`); },
  (r, t) => { if (t === "gentle") return null; const m = r.int(4, 6), w = r.int(3, 5), k = 3; return P(`A committee of ${k} is chosen from ${m} men and ${w} women. In how many ways can it be chosen so that it has at least one woman?`, [["ways:", nCr(m + w, k) - nCr(m, k)]], `${m + w}C${k} − ${m}C${k}`); },
  (r, t) => { if (t === "gentle") return null; const n = r.int(8, 12), k = r.int(5, 7); if (k >= n) return null; return P(`A pupil must answer ${k} of the ${n} questions on a paper, and question 1 is compulsory. In how many ways can the questions be chosen?`, [["ways:", nCr(n - 1, k - 1)]], `${n - 1}C${k - 1}`); },
]);

const arDigits = bank("wp-ar-digits", "wp-arr", {
  label: "Numbers from digits",
  blurb: "Fill the place with a rule first.",
  heading: "Counting numbers",
  instruction: "Think of the number as places to fill. Fill the place that has a RULE first — the last digit of an even " +
    "number, the first digit of a number that must not start with 0 — then the others, counting how many digits " +
    "are still free each time, and multiply.",
  example: "How many 3-digit numbers can be made from the digits 1, 2, 3, 4, 5 if no digit is used twice?",
  solution: "5 choices for the first place, then 4, then 3: 5 × 4 × 3 = 60.",
}, [
  (r) => { const n = r.int(4, 7), k = r.int(2, 3); return P(`How many ${k}-digit numbers can be made from the digits 1 to ${n} if no digit is used twice?`, [["numbers:", nPr(n, k)]], `${Array.from({ length: k }, (_, i) => n - i).join(" × ")}`); },
  (r) => { const n = r.int(4, 7); return P(`How many 3-digit numbers can be made from the digits 1 to ${n} if a digit may be used more than once?`, [["numbers:", n ** 3]], `${n} × ${n} × ${n}`); },
  (r, t) => { if (t === "gentle") return null; const n = r.int(5, 8); return P(`How many EVEN 3-digit numbers can be made from the digits 1 to ${n} if no digit is used twice?`, [["numbers:", Math.floor(n / 2) * (n - 1) * (n - 2)]], `${Math.floor(n / 2)} for the last place × ${n - 1} × ${n - 2}`); },
  (r, t) => { if (t === "gentle") return null; const n = r.int(4, 6); /* digits 0..n: 3-digit, no repeats, first not 0 */ return P(`How many 3-digit numbers can be made from the digits 0 to ${n} if no digit is used twice? (A number cannot begin with 0.)`, [["numbers:", n * n * (n - 1)]], `${n} for the first place × ${n} × ${n - 1}`); },
]);

export const B_EXERCISES = [frWork, frNumber, frSpeed, sysItems, sysNumbers, sysThree, sqAp, sqGp, sqCount, arArrange, arSelect, arDigits];
