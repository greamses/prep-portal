/* ============================================================================
   Competition Word Problems — chapters 1 to 4
   ----------------------------------------------------------------------------
     1  Ages                  ratios of ages, ages shifted in time, families
     2  Alligation & mixture  the rule of alligation, how much to add, water
                              added and liquid replaced
     3  HCF and LCM           the greatest that divides, the least that is
                              divided, and the two with remainders
     4  Ratio                 compound ratios, squared and cubed (duplicate
                              and triplicate) ratios, sharing in linked ratios

   Every problem is made from its answer (common.js).
   ========================================================================== */

import { bank, P, gcd, lcm, low, naira, names, plural } from "./common.js";

const RATIOS = [[2, 3], [3, 4], [3, 5], [4, 5], [2, 5], [5, 7], [3, 7], [4, 7], [5, 8], [1, 3], [2, 7]];

export const A_GROUPS = [
  { id: "wp-ages", chapter: "Chapter 1 · Ages", label: "Ages", blurb: "Ratios of ages, years ago and years to come, and families." },
  { id: "wp-mix", chapter: "Chapter 2 · Alligation and mixture", label: "Alligation and mixture", blurb: "Two kinds mixed to a mean: the rule of alligation." },
  { id: "wp-hcf", chapter: "Chapter 3 · HCF and LCM", label: "HCF and LCM", blurb: "The greatest that divides; the least that is divided." },
  { id: "wp-ratio", chapter: "Chapter 4 · Ratio", label: "Ratio", blurb: "Compound, squared and cubed ratios, and sharing." },
];

/* ═══ 1 · AGES ═════════════════════════════════════════════════════════════*/

const agRatio = bank("wp-ag-ratio", "wp-ages", {
  label: "Ages in a ratio",
  blurb: "The ratio gives units; the sum or the difference gives one unit.",
  heading: "Ages given as a ratio",
  instruction: "A ratio p : q means the ages are p UNITS and q units. A sum is p + q units; a difference is q − p units. " +
    "Find ONE unit, then multiply up. “k times as old” is the ratio k : 1.",
  example: "The ages of Ada and Bola are in the ratio 3 : 5, and Bola is 8 years older. How old is each?",
  solution: "The difference is 5 − 3 = 2 units = 8 years, so 1 unit is 4 years. Ada is 3 × 4 = 12 and Bola is 5 × 4 = 20.",
  board: true,
}, [
  (r, t) => { const [p, q] = r.pick(RATIOS); const u = r.int(2, t === "gentle" ? 6 : 9); const [A, B] = names(r, 2);
    return P(`The ages of ${A} and ${B} are in the ratio ${p} : ${q}, and together they are ${(p + q) * u} years old. How old is each?`, [[`${A}:`, p * u], [`${B}:`, q * u]], `${p + q} units = ${(p + q) * u}, 1 unit = ${u}`); },
  (r, t) => { const [p, q] = r.pick(RATIOS); const u = r.int(2, t === "gentle" ? 6 : 9); const [A, B] = names(r, 2);
    return P(`The ages of ${A} and ${B} are in the ratio ${p} : ${q}. ${B} is ${(q - p) * u} years older than ${A}. How old is each?`, [[`${A}:`, p * u], [`${B}:`, q * u]], `${q - p} ${plural(q - p, "unit")} = ${(q - p) * u}, 1 unit = ${u}`); },
  (r) => { const k = r.int(3, 6), s = r.int(5, 12); if ((k - 1) * s < 18 || k * s > 75) return null; return P(`A father is ${k} times as old as his son, and the sum of their ages is ${(k + 1) * s} years. How old is each?`, [["father:", k * s], ["son:", s]], `${k + 1} units = ${(k + 1) * s}`); },
  (r, t) => { if (t === "gentle") return null; const [p, q] = r.pick(RATIOS), c = r.int(1, 4); const u = r.int(2, 6); const [A, B, C] = names(r, 3);
    return P(`The ages of ${A}, ${B} and ${C} are in the ratio ${p} : ${q} : ${q + c}, and they add up to ${(p + q + q + c) * u} years. How old is the eldest, and how old is the youngest?`, [["eldest:", (q + c) * u], ["youngest:", p * u]], `${p + q + q + c} units = ${(p + q + q + c) * u}, 1 unit = ${u}`); },
]);

const agShift = bank("wp-ag-shift", "wp-ages", {
  label: "Years ago and years to come",
  blurb: "Move BOTH ages by the same number of years.",
  heading: "Ages shifted in time",
  instruction: "Let the present ages be the unknowns. A statement about another time is about BOTH ages moved by the same " +
    "number of years — take the years off both, or add them to both, before using the statement. The DIFFERENCE of two " +
    "ages never changes.",
  example: "Six years ago a man was three times as old as his son. Now he is twice as old. Find their present ages.",
  solution: "Let the son be s now, so the man is 2s. Six years ago: 2s − 6 = 3(s − 6), so 2s − 6 = 3s − 18 and s = 12. The son is 12 and the man 24.",
  board: true,
}, [
  (r) => { const m = r.int(2, 3), n = m === 3 ? r.int(3, 7) : r.int(9, 16); const s = n * m, f = m * s; if (f - s < 18 || f > 70) return null;
    return P(`${n} years ago a man was ${m + 1} times as old as his son. Now he is ${m === 2 ? "twice" : "three times"} as old as his son. Find their present ages.`, [["man:", f], ["son:", s]], `${m}s − ${n} = ${m + 1}(s − ${n})`); },
  (r, t) => { const [p, q] = r.pick(RATIOS); const u = r.int(2, 8), n = r.int(2, t === "gentle" ? 6 : 12); const a = p * u, b = q * u; const [x, y] = low(a + n, b + n);
    if (x > 12 || y > 12 || (x === p && y === q)) return null; const [A, B] = names(r, 2);
    return P(`The ages of ${A} and ${B} are now in the ratio ${p} : ${q}. In ${n} years' time the ratio will be ${x} : ${y}. Find their present ages.`, [[`${A}:`, a], [`${B}:`, b]], `${y}(${p}u + ${n}) = ${x}(${q}u + ${n}), u = ${u}`); },
  (r, t) => { if (t === "gentle") return null; const s = r.int(8, 24), n = r.int(2, 10); const f = 2 * s + n; if (f - s < 18) return null;
    for (const n2 of [2, 3, 4, 5, 6]) { if (n2 >= s) continue; const k = (f - n2) / (s - n2); if (Number.isInteger(k) && k >= 3 && k <= 7 && f <= 70) return P(`In ${n} years' time a woman will be twice as old as her daughter. ${n2} years ago she was ${k} times as old. Find their present ages.`, [["woman:", f], ["daughter:", s]], `w + ${n} = 2(d + ${n}); w − ${n2} = ${k}(d − ${n2})`); }
    return null; },
  (r) => { const [p, q] = r.pick(RATIOS); const u = r.int(3, 8), n = r.int(2, 5); const a = p * u, b = q * u; if (a - n < 2) return null; const [x, y] = low(a - n, b - n);
    if (x > 12 || y > 12 || (x === p && y === q)) return null; const [A, B] = names(r, 2);
    return P(`${n} years ago the ages of ${A} and ${B} were in the ratio ${x} : ${y}. Now they are in the ratio ${p} : ${q}. Find their present ages.`, [[`${A}:`, a], [`${B}:`, b]], `${y}(${p}u − ${n}) = ${x}(${q}u − ${n}), u = ${u}`); },
]);

const agFamily = bank("wp-ag-family", "wp-ages", {
  label: "Families and averages",
  blurb: "Born when …, averages that move, three people at once.",
  heading: "Ages in a family",
  instruction: "“She was 24 when her son was born” gives the DIFFERENCE of their ages, for ever. An AVERAGE age times the " +
    "number of people is the TOTAL of their ages: find the totals before and after, and take one from the other.",
  example: "The average age of 9 pupils is 12 years. When their teacher is counted too, the average rises to 14. How old is the teacher?",
  solution: "Nine pupils total 9 × 12 = 108 years. Ten people total 10 × 14 = 140 years. The teacher is 140 − 108 = 32.",
}, [
  (r) => { const k = r.int(3, 5), d = r.int(5, 12); const m = d * (k - 1); if (m < 20 || m > 38) return null;
    return P(`A mother was ${m} years old when her daughter was born. She is now ${k} times as old as her daughter. How old is each now?`, [["mother:", k * d], ["daughter:", d]], `difference ${m} = ${k - 1} units`); },
  (r) => { const n = r.int(8, 30), A = r.int(9, 15), up = r.int(1, 2); const T = (n + 1) * (A + up) - n * A; if (T < 24 || T > 62) return null;
    return P(`The average age of ${n} pupils is ${A} years. When their teacher's age is counted too, the average rises by ${up} ${plural(up, "year")}. How old is the teacher?`, [["teacher:", (n + 1) * (A + up) - n * A]], `${n + 1} × ${A + up} − ${n} × ${A}`); },
  (r) => { const x = r.int(3, 9), k = r.int(3, 6), n = r.int(2, 6); const son = x + n, f = k * x + n; if (f - son < 18 || f > 75) return null;
    return P(`The sum of the ages of a father and his son is ${f + son} years. ${n} years ago the father was ${k} times as old as his son. Find their present ages.`, [["father:", f], ["son:", son]], `${f + son} − ${2 * n} = ${k + 1} units`); },
  (r, t) => { if (t === "gentle") return null; const c = r.int(4, 12), d = r.int(2, 6); const b = c + d, a = 2 * b; const [A, B, C] = names(r, 3);
    return P(`${A} is twice as old as ${B}, and ${B} is ${d} years older than ${C}. The three ages add up to ${a + b + c}. How old is each?`, [[`${A}:`, a], [`${B}:`, b], [`${C}:`, c]], `2(c + ${d}) + (c + ${d}) + c = ${a + b + c}`); },
]);

/* ═══ 2 · ALLIGATION AND MIXTURE ═══════════════════════════════════════════*/

const alRule = bank("wp-al-rule", "wp-mix", {
  label: "The rule of alligation",
  blurb: "cheaper : dearer = (dearer − mean) : (mean − cheaper).",
  heading: "The rule of alligation",
  instruction: "Two kinds, one cheap and one dear, are mixed to give a MEAN price between them. Write the mean in the " +
    "middle and take the differences crosswise: the amount of the CHEAPER is to the amount of the DEARER as (dearer − " +
    "mean) is to (mean − cheaper). Give the ratio in its lowest terms.",
  example: "In what ratio must tea at ₦600 a kg be mixed with tea at ₦900 a kg so that the mixture is worth ₦700 a kg?",
  solution: "Cheaper : dearer = (900 − 700) : (700 − 600) = 200 : 100 = 2 : 1.",
  board: true,
}, [
  (r) => { const [p, q] = r.pick(RATIOS.concat([[1, 2], [3, 2], [5, 3], [2, 1]])); const k = r.int(1, 4) * 10, c1 = r.int(3, 12) * 50; const c2 = c1 + (p + q) * k, m = c1 + q * k;
    const what = r.pick(["tea", "rice", "beans", "sugar", "garri"]);
    return P(`In what ratio must ${what} at ${naira(c1)} a kg be mixed with ${what} at ${naira(c2)} a kg so that the mixture is worth ${naira(m)} a kg?`, [["cheaper:", p], ["dearer:", q]], `(${c2} − ${m}) : (${m} − ${c1})`); },
  (r) => { const [p, q] = r.pick(RATIOS.concat([[1, 2], [2, 1], [3, 2], [1, 4]])); const k = r.int(1, 4), c1 = r.int(1, 5) * 10; const c2 = c1 + (p + q) * k, m = c1 + q * k; if (c2 > 95) return null;
    return P(`A ${c1}% salt solution is mixed with a ${c2}% salt solution to make a ${m}% solution. In what ratio are they mixed (weaker to stronger)?`, [["weaker:", p], ["stronger:", q]], `(${c2} − ${m}) : (${m} − ${c1})`); },
  (r, t) => { if (t === "gentle") return null; const m = r.int(4, 12) * 10, k = r.int(1, 4) * 10; const c = m + k; const [a, b] = low(c - m, m);
    return P(`In what ratio must water (which costs nothing) be mixed with milk costing ${naira(c)} a litre so that the mixture is worth ${naira(m)} a litre?`, [["water:", a], ["milk:", b]], `(${c} − ${m}) : (${m} − 0)`); },
]);

const alQuantity = bank("wp-al-qty", "wp-mix", {
  label: "How much must be added",
  blurb: "Find the ratio first; then scale it to the quantity given.",
  heading: "Mixtures: how much of one kind",
  instruction: "Use the rule of alligation to find the RATIO of the two kinds. One of the two quantities is given: see " +
    "how many times its share of the ratio goes into it, and multiply the other share by the same number.",
  example: "How many kg of rice at ₦800 a kg must be mixed with 30 kg of rice at ₦1,100 a kg so that the mixture is worth ₦900 a kg?",
  solution: "Cheaper : dearer = (1100 − 900) : (900 − 800) = 2 : 1. The dearer is 30 kg = 1 share, so the cheaper is 2 × 30 = 60 kg.",
  board: true,
}, [
  (r) => { const [p, q] = r.pick(RATIOS.concat([[2, 1], [3, 2], [1, 2]])); const k = r.int(1, 3) * 50, c1 = r.int(6, 16) * 50; const c2 = c1 + (p + q) * k, m = c1 + q * k; const n = r.int(2, 8);
    return P(`How many kg of rice at ${naira(c1)} a kg must be mixed with ${q * n} kg of rice at ${naira(c2)} a kg so that the mixture is worth ${naira(m)} a kg?`, [["kg:", p * n]], `cheaper : dearer = ${p} : ${q}`); },
  (r) => { const [p, q] = r.pick([[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [1, 4]]); const k = r.int(1, 4) * 2, c1 = r.int(1, 4) * 10; const c2 = c1 + (p + q) * k, m = c1 + q * k; const n = r.int(2, 10);
    return P(`A chemist has ${p * n} litres of a ${c1}% acid solution. How many litres of a ${c2}% solution must be added to make a ${m}% solution?`, [["litres:", q * n]], `weaker : stronger = ${p} : ${q}`); },
  (r, t) => { if (t === "gentle") return null; const [p, q] = r.pick([[1, 2], [2, 3], [1, 3], [3, 4], [2, 5]]); const k = r.int(1, 3) * 50, c1 = r.int(6, 14) * 50; const c2 = c1 + (p + q) * k, m = c1 + q * k; const n = r.int(2, 8);
    return P(`A trader mixes two kinds of beans, at ${naira(c1)} and ${naira(c2)} a kg, to make ${(p + q) * n} kg worth ${naira(m)} a kg. How many kg of each does she use?`, [["cheaper (kg):", p * n], ["dearer (kg):", q * n]], `ratio ${p} : ${q}, ${p + q} shares = ${(p + q) * n} kg`); },
]);

const alReplace = bank("wp-al-water", "wp-mix", {
  label: "Water added, liquid replaced",
  blurb: "What does NOT change is the thing to hold on to.",
  heading: "Mixtures: adding and replacing",
  instruction: "When water is ADDED, the amount of milk does not change — work out the milk, and find what water the new " +
    "ratio needs with it. When some mixture is DRAWN OFF and replaced with water, the same FRACTION of the milk is " +
    "left each time: multiply by that fraction once for every time it is done.",
  example: "60 litres of a mixture has milk and water in the ratio 2 : 1. How much water must be added to make the ratio 1 : 2?",
  solution: "Milk is 2/3 of 60 = 40 litres and water 20. For 1 : 2 the water must be twice the milk: 80 litres. So 80 − 20 = 60 litres must be added.",
}, [
  (r) => { const [p, q] = r.pick([[2, 1], [3, 1], [3, 2], [4, 1], [5, 2], [5, 3], [7, 3]]); const [rr, s] = r.pick([[1, 1], [1, 2], [2, 3], [3, 2], [2, 1], [3, 4]]);
    if (p * s - q * rr <= 0) return null; const k = r.int(1, 4);
    return P(`${(p + q) * rr * k} litres of a mixture has milk and water in the ratio ${p} : ${q}. How many litres of water must be added to make the ratio ${rr} : ${s}?`, [["litres:", k * (p * s - q * rr)]], `milk stays ${p * rr * k} litres; water needed ${p * s * k}`); },
  (r, t) => { if (t === "gentle") return null; const m = r.int(3, 6), u = r.int(1, 3); const N = m * m * u, x = m * u;
    return P(`A vessel holds ${N} litres of milk. ${x} litres are drawn off and replaced with water, and this is done a second time. How many litres of milk are now in the vessel?`, [["litres:", u * (m - 1) * (m - 1)]], `${N} × (${m - 1}/${m})²`); },
  (r) => { const tot = r.int(4, 16) * 10, pc = r.pick([10, 20, 25, 30, 40]); const water = (tot * pc) / 100; const want = r.pick([40, 50, 60].filter((v) => v > pc)); const add = (want * tot - 100 * water) / (100 - want);
    if (!Number.isInteger(add) || !Number.isInteger(water)) return null;
    return P(`A ${tot}-litre mixture is ${pc}% water. How many litres of water must be added so that water makes up ${want}% of the new mixture?`, [["litres:", add]], `(${water} + x) = ${want}% of (${tot} + x)`); },
]);

/* ═══ 3 · HCF AND LCM ══════════════════════════════════════════════════════*/

const coprime3 = (r) => { for (;;) { const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9); if (a !== b && b !== c && a !== c && gcd(gcd(a, b), c) === 1) return [a, b, c]; } };
const coprime2 = (r, hi = 12) => { for (;;) { const a = r.int(2, hi), b = r.int(2, hi); if (a !== b && gcd(a, b) === 1) return [a, b]; } };

const hlHcf = bank("wp-hl-hcf", "wp-hcf", {
  label: "The greatest that divides",
  blurb: "Longest equal pieces, biggest tile, most equal shares: HCF.",
  heading: "HCF in stories",
  instruction: "When things are to be cut, tiled or shared into EQUAL parts that are AS BIG AS POSSIBLE, with nothing " +
    "left over, the size is the HIGHEST COMMON FACTOR. The number of parts is each amount divided by it.",
  example: "Two ropes, 36 m and 48 m long, are cut into equal pieces as long as possible. How long is each piece, and how many pieces are there?",
  solution: "The HCF of 36 and 48 is 12, so each piece is 12 m. There are 36 ÷ 12 + 48 ÷ 12 = 3 + 4 = 7 pieces.",
}, [
  (r, t) => { const h = r.int(3, t === "gentle" ? 9 : 18), [m, n] = coprime2(r, 9);
    return P(`Two ropes, ${h * m} m and ${h * n} m long, are to be cut into equal pieces as long as possible, with none left over. How long is each piece, and how many pieces are there altogether?`, [["length (m):", h], ["pieces:", m + n]], `HCF(${h * m}, ${h * n}) = ${h}`); },
  (r) => { const h = r.int(2, 9) * 10, [m, n] = coprime2(r, 9);
    return P(`A wall panel ${h * m} cm long and ${h * n} cm wide is to be covered with square tiles, all the same and as large as possible, without cutting any. What is the side of a tile, and how many tiles are needed?`, [["side (cm):", h], ["tiles:", m * n]], `HCF(${h * m}, ${h * n}) = ${h}`); },
  (r) => { const h = r.int(4, 16), [a, b, c] = coprime3(r);
    return P(`${h * a} pens, ${h * b} pencils and ${h * c} erasers are to be shared equally among some pupils, each getting the same number of each. What is the greatest number of pupils?`, [["pupils:", h]], `HCF(${h * a}, ${h * b}, ${h * c})`); },
]);

const hlLcm = bank("wp-hl-lcm", "wp-hcf", {
  label: "The least that is divided",
  blurb: "Together again: bells, runners, lights — LCM.",
  heading: "LCM in stories",
  instruction: "When things happen at regular intervals and you want the FIRST TIME they all happen together again, the " +
    "answer is the LOWEST COMMON MULTIPLE of the intervals. The smallest amount that shares exactly among several " +
    "group sizes is an LCM too.",
  example: "Three bells ring every 6, 8 and 12 minutes. They ring together at 9 o'clock. After how many minutes will they next ring together?",
  solution: "The LCM of 6, 8 and 12 is 24, so they ring together again after 24 minutes.",
}, [
  (r, t) => { const g = r.int(2, t === "gentle" ? 3 : 6), [a, b, c] = coprime3(r); const L = lcm(lcm(g * a, g * b), g * c); if (L > 720) return null;
    return P(`Three bells ring at intervals of ${g * a}, ${g * b} and ${g * c} minutes. They all ring together at noon. After how many minutes will they next ring together?`, [["minutes:", L]], `LCM(${g * a}, ${g * b}, ${g * c})`); },
  (r) => { const g = r.int(2, 6) * 5, [a, b] = coprime2(r, 7); const L = g * a * b; const [A, B] = names(r, 2);
    return P(`${A} runs round a track in ${g * a} seconds and ${B} in ${g * b} seconds. They start together. After how many seconds are they next together at the start, and how many laps has ${A} run by then?`, [["seconds:", L], ["laps:", b]], `LCM(${g * a}, ${g * b}) = ${L}`); },
  (r) => { const [a, b, c] = coprime3(r); const g = r.int(1, 3); const L = lcm(lcm(g * a, g * b), g * c); if (L > 900) return null;
    return P(`What is the smallest number of sweets that can be shared equally among ${g * a}, ${g * b} or ${g * c} children with none left over?`, [["sweets:", L]], `LCM(${g * a}, ${g * b}, ${g * c})`); },
]);

const hlMixed = bank("wp-hl-rem", "wp-hcf", {
  label: "With remainders, and the two together",
  blurb: "LCM + remainder; HCF of what is left; HCF × LCM = the product.",
  heading: "HCF and LCM with a twist",
  instruction: "The LEAST number leaving remainder r when divided by several numbers is their LCM plus r. The GREATEST " +
    "number that divides two numbers leaving given remainders is the HCF of the numbers WITH THE REMAINDERS TAKEN " +
    "OFF. And for any two numbers, HCF × LCM = the product of the two numbers.",
  example: "Find the least number which, when divided by 4, 6 and 9, leaves a remainder of 3 each time.",
  solution: "The LCM of 4, 6 and 9 is 36. Add the remainder: 36 + 3 = 39.",
}, [
  (r) => { const g = r.int(1, 3), [a, b, c] = coprime3(r); const L = lcm(lcm(g * a, g * b), g * c); const rem = r.int(1, Math.min(g * a, g * b, g * c) - 1); if (L > 900 || rem < 1) return null;
    return P(`Find the least number which, when divided by ${g * a}, ${g * b} and ${g * c}, leaves a remainder of ${rem} in each case.`, [["number:", L + rem]], `LCM ${L} + ${rem}`); },
  (r) => { const h = r.int(6, 20), [m, n] = coprime2(r, 9); const r1 = r.int(1, h - 1), r2 = r.int(1, h - 1);
    return P(`Find the greatest number that divides ${h * m + r1} and ${h * n + r2}, leaving remainders ${r1} and ${r2}.`, [["number:", h]], `HCF(${h * m}, ${h * n})`); },
  (r) => { const h = r.int(2, 12), [m, n] = coprime2(r, 9);
    return P(`The HCF of two numbers is ${h} and their LCM is ${h * m * n}. One of the numbers is ${h * m}. What is the other?`, [["number:", h * n]], `${h} × ${h * m * n} ÷ ${h * m}`); },
  (r, t) => { if (t === "gentle") return null; const [a, b, c] = coprime3(r); const k = r.int(1, Math.min(a, b, c) - 1); const L = lcm(lcm(a, b), c); if (k < 1 || L > 600) return null;
    return P(`Find the least number which leaves remainders ${a - k}, ${b - k} and ${c - k} when divided by ${a}, ${b} and ${c}.`, [["number:", L - k]], `each remainder is ${k} short: LCM ${L} − ${k}`); },
]);

/* ═══ 4 · RATIO ════════════════════════════════════════════════════════════*/

const SMALL = [[2, 3], [3, 4], [3, 5], [4, 5], [2, 5], [1, 2], [1, 3], [5, 6], [2, 7], [3, 7]];

const rtCompound = bank("wp-rt-compound", "wp-ratio", {
  label: "Compound ratio",
  blurb: "Multiply the first terms; multiply the second terms.",
  heading: "Compound ratios",
  instruction: "To COMPOUND two ratios a : b and c : d, multiply the first terms together and the second terms together: " +
    "ac : bd — then put it in its lowest terms. It is what happens when two things each change a quantity: pay per " +
    "day AND days worked, length AND width.",
  example: "The daily wages of two workers are in the ratio 2 : 3, and the days they worked are in the ratio 5 : 4. In what ratio were they paid?",
  solution: "Pay = wage × days, so compound the ratios: (2 × 5) : (3 × 4) = 10 : 12 = 5 : 6.",
  board: true,
}, [
  (r) => { const [a, b] = r.pick(SMALL), [c, d] = r.pick(SMALL); const [x, y] = low(a * c, b * d);
    return P(`Find the compound ratio of ${a} : ${b} and ${c} : ${d}, in its lowest terms.`, [["first term:", x], ["second term:", y]], `${a * c} : ${b * d}`); },
  (r) => { const [a, b] = r.pick(SMALL), [c, d] = r.pick(SMALL.map(([p, q]) => [q, p])); const [x, y] = low(a * c, b * d); const [A, B] = names(r, 2);
    return P(`The daily wages of ${A} and ${B} are in the ratio ${a} : ${b}, and the numbers of days they worked are in the ratio ${c} : ${d}. In what ratio are their total earnings?`, [[`${A}:`, x], [`${B}:`, y]], `${a * c} : ${b * d}`); },
  (r, t) => { if (t === "gentle") return null; const [a, b] = r.pick(SMALL), [c, d] = r.pick(SMALL), [e, f2] = r.pick(SMALL); const [x, y] = low(a * c * e, b * d * f2);
    return P(`Find the compound ratio of ${a} : ${b}, ${c} : ${d} and ${e} : ${f2}, in its lowest terms.`, [["first term:", x], ["second term:", y]], `${a * c * e} : ${b * d * f2}`); },
  (r) => { const [a, b] = r.pick(SMALL), [c, d] = r.pick(SMALL); const [x, y] = low(a * c, b * d);
    return P(`The lengths of two rectangles are in the ratio ${a} : ${b} and their widths in the ratio ${c} : ${d}. In what ratio are their areas?`, [["first:", x], ["second:", y]], `${a * c} : ${b * d}`); },
]);

const rtPowers = bank("wp-rt-powers", "wp-ratio", {
  label: "Squared and cubed ratios",
  blurb: "Duplicate a² : b²; triplicate a³ : b³ — areas and volumes.",
  heading: "Duplicate and triplicate ratios",
  instruction: "The DUPLICATE ratio of a : b is a² : b² — the ratio of the AREAS of two similar shapes whose sides are as " +
    "a : b. The TRIPLICATE ratio is a³ : b³ — the ratio of their VOLUMES. Going back from areas to sides is the " +
    "SUB-DUPLICATE ratio: the square roots.",
  example: "The edges of two cubes are in the ratio 2 : 3. In what ratio are their volumes?",
  solution: "Volumes go as the cubes: 2³ : 3³ = 8 : 27.",
}, [
  (r) => { const [a, b] = r.pick(SMALL); return P(`Find the duplicate ratio of ${a} : ${b}.`, [["first term:", a * a], ["second term:", b * b]], `${a}² : ${b}²`); },
  (r) => { const [a, b] = r.pick(SMALL.filter(([p, q]) => q <= 5)); return P(`Find the triplicate ratio of ${a} : ${b}.`, [["first term:", a ** 3], ["second term:", b ** 3]], `${a}³ : ${b}³`); },
  (r) => { const [a, b] = r.pick(SMALL); return P(`The sides of two squares are in the ratio ${a} : ${b}. In what ratio are their areas?`, [["first:", a * a], ["second:", b * b]], `${a}² : ${b}²`); },
  (r) => { const [a, b] = r.pick(SMALL.filter(([p, q]) => q <= 5)); return P(`The radii of two spheres are in the ratio ${a} : ${b}. In what ratio are their volumes?`, [["first:", a ** 3], ["second:", b ** 3]], `${a}³ : ${b}³`); },
  (r) => { const [a, b] = r.pick(SMALL); const k = r.int(1, 3); return P(`The areas of two similar triangles are ${a * a * k} cm² and ${b * b * k} cm². In what ratio are their matching sides?`, [["first:", a], ["second:", b]], `√(${a * a} : ${b * b})`); },
  (r, t) => { if (t === "gentle") return null; const [a, b] = r.pick(SMALL.filter(([p, q]) => q <= 5)); const k = r.int(1, 4); const [x, y] = [a ** 3 * k, b ** 3 * k];
    return P(`Two similar jugs have heights in the ratio ${a} : ${b}. The smaller holds ${Math.min(x, y)} ml. How much does the larger hold?`, [["ml:", Math.max(x, y)]], `volumes ${a ** 3} : ${b ** 3}`); },
]);

const rtShare = bank("wp-rt-share", "wp-ratio", {
  label: "Sharing in linked ratios",
  blurb: "A : B and B : C joined through B; incomes and savings.",
  heading: "Sharing: ratios that share a term",
  instruction: "Given A : B and B : C, make the two B's the SAME number (their LCM) by multiplying each ratio up; then " +
    "A : B : C can be read straight off. Add the three terms for the number of shares, find one share, and multiply.",
  example: "₦1,800 is shared so that A : B = 2 : 3 and B : C = 3 : 4. How much does each get?",
  solution: "B is 3 in both, so A : B : C = 2 : 3 : 4 — 9 shares. One share is 1800 ÷ 9 = ₦200. A gets ₦400, B ₦600, C ₦800.",
  board: true,
}, [
  (r, t) => { const [p, q] = r.pick(SMALL), [rr, s] = r.pick(SMALL); const L = lcm(q, rr); const a = p * (L / q), b = L, c = s * (L / rr); const [g] = [gcd(gcd(a, b), c)]; const k = r.int(1, t === "gentle" ? 4 : 9) * 100;
    const [A, B, C] = names(r, 3); const [x, y, z] = [a / g, b / g, c / g]; if (x + y + z > 40) return null;
    return P(`${naira((x + y + z) * k)} is shared among ${A}, ${B} and ${C} so that ${A} : ${B} = ${p} : ${q} and ${B} : ${C} = ${rr} : ${s}. How much does each get?`, [[`${A} (₦):`, x * k], [`${B} (₦):`, y * k], [`${C} (₦):`, z * k]], `${A} : ${B} : ${C} = ${x} : ${y} : ${z}`); },
  (r) => { const [a, b, c, d, sv] = r.pick([[5, 4, 3, 2, 2], [7, 5, 3, 2, 1], [9, 7, 4, 3, 1], [4, 3, 3, 2, 1], [8, 5, 3, 1, 0]]); if (!sv) return null; const x = r.int(2, 9) * 1000; const [A, B] = names(r, 2);
    return P(`The incomes of ${A} and ${B} are in the ratio ${a} : ${b}, and what they spend in the ratio ${c} : ${d}. Each saves ${naira(sv * x)}. Find their incomes.`, [[`${A} (₦):`, a * x], [`${B} (₦):`, b * x]], `${a}x − ${c}y = ${b}x − ${d}y = ${sv * x}`); },
  (r) => { const [p, q] = r.pick(SMALL); const u = r.int(3, 12), add = r.int(1, 6) * (q - p) || 0; if (!add) return null; const a = p * u, b = q * u; const [x, y] = low(a + add, b + add); if (x > 12 || y > 12) return null;
    return P(`Two numbers are in the ratio ${p} : ${q}. When ${add} is added to each, the ratio becomes ${x} : ${y}. Find the two numbers.`, [["smaller:", a], ["larger:", b]], `${y}(${p}u + ${add}) = ${x}(${q}u + ${add}), u = ${u}`); },
]);

export const A_EXERCISES = [agRatio, agShift, agFamily, alRule, alQuantity, alReplace, hlHcf, hlLcm, hlMixed, rtCompound, rtPowers, rtShare];
