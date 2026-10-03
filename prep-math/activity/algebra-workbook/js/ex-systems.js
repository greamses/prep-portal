/* ============================================================================
   Algebra Workbook — CHAPTER 9: simultaneous equations, the three methods
   ----------------------------------------------------------------------------
   Two equations, two letters, one pair (x, y) that makes both true. The
   chapter opens with the two balance scales (ex-two.js) — substitution done
   with the hands — and then the three ways it is done on paper:

     substitution   one equation already SAYS what a letter is (y = 2x + 1),
                    or is made to say it; put that into the other equation and
                    it has one letter left
     elimination    make one letter's numbers match in both equations, then add
                    them (opposite signs) or take one from the other (same
                    signs) and that letter is gone — straight away, after
                    multiplying one equation, or after multiplying both
     graphical      every equation is a straight line; the answer is the point
                    on BOTH — tables of both, reading the crossing, ruling both
                    lines yourself, and when lines never meet (or are one line)

   After this the determinant method (ex-det.js) and, for three and four
   letters, Cramer's rule and Gaussian elimination (ex-matrix.js).

   Every pair is made from its answer, so every step is a whole number.
   ========================================================================== */

import { planeSvg, pointOf } from "./gridart.js";
import { grCross, gridFor, cellFor, yEq } from "./ex-graphs.js";
import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const art = (html) => `<div class="ab-art">${html}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const side = (a, b) => `<div class="fn-side">${a}<div class="fn-lines">${b}</div></div>`;

const tier = (o) => levelOf(o).id;
const num = (n) => (n < 0 ? `−${-n}` : String(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const at = (l, x) => l.m * x + l.c;

/** One term: 3x, −x, + 2y, − 5y … (first term carries its own sign). */
function term(k, letter, first) {
  const size = Math.abs(k) === 1 ? "" : String(Math.abs(k));
  if (first) return `${k < 0 ? "−" : ""}${size}${letter}`;
  return `${k < 0 ? "−" : "+"} ${size}${letter}`;
}
const line2 = (a, b, e) => `${term(a, "x", true)} ${term(b, "y", false)} = ${num(e)}`;
/** The pair, numbered, one under the other. */
const pairOf = (one, two) => `<div class="dt-pair">${eq(`(1) &nbsp; ${one}`)}${eq(`(2) &nbsp; ${two}`)}</div>`;
const xy = () => eq(`x = ${box()} &nbsp;&nbsp; y = ${box()}`);

/** x and y by level: small and positive, then bigger, then either sign. */
function answerOf(r, t) {
  if (t === "stretch") return { x: r.int(-5, 8), y: r.int(-5, 8) };
  return { x: r.int(1, t === "gentle" ? 6 : 9), y: r.int(1, t === "gentle" ? 6 : 9) };
}
/** A coefficient that is never 0: negative sometimes at Stretch. */
const coef = (r, t, lo, hi) => { const n = r.int(lo, hi); return t === "stretch" && r.chance(0.3) ? -n : n; };

export const SY_GROUPS = [
  { id: "sy-sub", label: "Substitution", blurb: "One equation says what a letter is — put it into the other." },
  { id: "sy-elim", label: "Elimination", blurb: "Match one letter's numbers, then add or take away and it is gone." },
  { id: "sy-graph", label: "The graphical method", blurb: "Each equation is a line; the answer is where they cross." },
];

/* ═══ SUBSTITUTION ═════════════════════════════════════════════════════════*/

const subReady = {
  id: "sy-sub-ready",
  group: "sy-sub",
  label: "y is already alone",
  blurb: "y = 2x + 1 says what y is: swap it into the other equation.",
  heading: "Substitution: one equation already says what y is",
  instruction: () =>
    "Equation (1) says exactly what y is. So in equation (2), wherever there is a y, put that instead — in a " +
    "bracket. Multiply the bracket out and collect the x's: now there is only one letter, so solve it. Then put " +
    "x back into (1) to find y.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    for (let g = 0; g < 400; g++) {
      const { x, y: _ } = answerOf(r, t);
      const m = t === "gentle" ? r.int(1, 3) : coef(r, t, 1, 4);
      const c = t === "gentle" ? r.int(0, 5) : r.int(-5, 6);
      const y = m * x + c;
      const a = coef(r, t, 1, 5), b = t === "gentle" ? r.int(1, 3) : coef(r, t, 1, 4);
      const k = a + b * m;            // the x's after substituting
      const rhs = a * x + b * y - b * c;
      if (k === 0) continue;
      if (t !== "stretch" && (y < 0 || k < 0 || rhs < 0)) continue;
      if (Math.abs(a * x + b * y) > 99) continue;
      void _;
      return { x, y, m, c, a, b, e: a * x + b * y, k, rhs };
    }
    return { x: 2, y: 5, m: 2, c: 1, a: 3, b: 1, e: 11, k: 5, rhs: 10 };
  },
  render(item) {
    const { m, c, a, b, e } = item;
    return pairOf(yEq({ m, c }), line2(a, b, e)) +
      eq(`put (1) into (2): ${box()} x = ${box()}`) + xy();
  },
  worked() {
    return worked(pairOf("y = 2x + 1", "3x + y = 11") +
      say("(1) says y is 2x + 1, so (2) becomes 3x + (2x + 1) = 11. That is 5x + 1 = 11, so 5x = 10 and x = 2. " +
        "Back in (1): y = 2 × 2 + 1 = 5. Check in (2): 3 × 2 + 5 = 11."));
  },
  key(item) {
    return [want.num(item.k), want.num(item.rhs), want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`${num(item.k)}x = ${num(item.rhs)}, so x = ${num(item.x)}, y = ${num(item.y)}`];
  },
};

const subMake = {
  id: "sy-sub-make",
  group: "sy-sub",
  label: "Make a letter the subject first",
  blurb: "x + 2y = 7 becomes x = 7 − 2y, then substitute.",
  heading: "Substitution: make one letter the subject",
  instruction: () =>
    "Neither equation says what a letter is yet — but equation (1) has an x on its own (no number in front). " +
    "Move everything else to the other side so it reads x = …, then put that into (2) in a bracket and solve " +
    "for y. Finally put y back to find x.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    for (let g = 0; g < 400; g++) {
      const { x, y } = answerOf(r, t);
      const p = t === "gentle" ? r.int(1, 3) : r.int(1, 5);
      const q = x + p * y;
      const c = coef(r, t, 1, 5), d = coef(r, t, 1, 5);
      const f = c * x + d * y;
      if (d - c * p === 0) continue;
      if (t !== "stretch" && f < 0) continue;
      if (Math.abs(f) > 99 || q > 60) continue;
      return { x, y, p, q, c, d, f };
    }
    return { x: 3, y: 2, p: 2, q: 7, c: 2, d: 3, f: 12 };
  },
  render(item) {
    const { p, q, c, d, f } = item;
    return pairOf(line2(1, p, q), line2(c, d, f)) +
      eq(`from (1): x = ${box()} − ${box()}y`) + xy();
  },
  worked() {
    return worked(pairOf("x + 2y = 7", "2x + 3y = 12") +
      say("From (1): x = 7 − 2y. Into (2): 2(7 − 2y) + 3y = 12, so 14 − 4y + 3y = 12, so 14 − y = 12 and y = 2. " +
        "Then x = 7 − 2 × 2 = 3. Check in (2): 2 × 3 + 3 × 2 = 12."));
  },
  key(item) {
    return [want.num(item.q), want.num(item.p), want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`x = ${item.q} − ${item.p}y; x = ${num(item.x)}, y = ${num(item.y)}`];
  },
};

/* word problems where one sentence says what one thing is in terms of the other */
const STORIES = [
  (r, t) => {
    const pencil = r.int(t === "gentle" ? 20 : 30, t === "gentle" ? 80 : 150) * (t === "gentle" ? 1 : 5);
    const d = r.int(2, 12) * (t === "gentle" ? 5 : 10);
    const p = r.int(2, 4), q = r.int(1, 4);
    const pen = pencil + d;
    return {
      text: `A pen costs ₦${d} more than a pencil. ${p} pens and ${q} pencil${q > 1 ? "s" : ""} cost ₦${p * pen + q * pencil} altogether. How much is a pencil, and how much is a pen?`,
      labels: ["pencil (₦):", "pen (₦):"], vals: [pencil, pen],
      steps: `pen = pencil + ${d}; ${p}(pencil + ${d}) + ${q} × pencil = ${p * pen + q * pencil}`,
    };
  },
  (r, t) => {
    const tunde = r.int(4, t === "gentle" ? 12 : 30);
    const d = r.int(2, 9);
    const k = r.int(2, 3);
    const ada = tunde + d;
    return {
      text: `Ada is ${d} years older than Tunde. ${k === 2 ? "Twice" : "Three times"} Ada's age added to Tunde's age makes ${k * ada + tunde}. How old is each of them?`,
      labels: ["Tunde:", "Ada:"], vals: [tunde, ada],
      steps: `Ada = Tunde + ${d}; ${k}(Tunde + ${d}) + Tunde = ${k * ada + tunde}`,
    };
  },
  (r, t) => {
    const child = r.int(2, t === "gentle" ? 10 : 30) * 50;
    const k = r.int(2, 3);
    const a = r.int(1, 4), c = r.int(2, 6);
    const adult = k * child;
    return {
      text: `An adult's ticket costs ${k === 2 ? "twice" : "three times"} as much as a child's. ${a} adult ticket${a > 1 ? "s" : ""} and ${c} children's tickets cost ₦${a * adult + c * child}. What does each ticket cost?`,
      labels: ["child (₦):", "adult (₦):"], vals: [child, adult],
      steps: `adult = ${k} × child; ${a} × ${k} × child + ${c} × child = ${a * adult + c * child}`,
    };
  },
];

const subWord = {
  id: "sy-sub-word",
  group: "sy-sub",
  label: "Word problems by substitution",
  blurb: "One sentence says what one thing is in terms of the other.",
  heading: "Substitution in a story",
  instruction: () =>
    "Give each unknown a letter. One sentence tells you what one of them is in terms of the other — that is " +
    "your y = …. The other sentence is the second equation. Substitute, solve, and answer in the story's own " +
    "words.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    return STORIES[r.int(0, STORIES.length - 1)](r, t);
  },
  render(item) {
    return ask(item.text) + eq(item.labels.map((l) => `${l} ${box()}`).join(" &nbsp;&nbsp; "));
  },
  worked() {
    return worked(ask("A pen costs ₦20 more than a pencil. 2 pens and 3 pencils cost ₦290. How much is each?") +
      say("Let a pencil be p. Then a pen is p + 20. So 2(p + 20) + 3p = 290: 5p + 40 = 290, 5p = 250, p = 50. " +
        "A pencil is ₦50 and a pen ₦70. Check: 2 × 70 + 3 × 50 = 290."));
  },
  key(item) {
    return item.vals.map((v) => want.num(v));
  },
  answer(item) {
    return [`${item.steps}: ${item.labels.map((l, i) => `${l} ${item.vals[i]}`).join(", ")}`];
  },
};

/* ═══ ELIMINATION ══════════════════════════════════════════════════════════*/

const ADD_OR_TAKE = ["add the equations", "take one from the other"];

const elDirect = {
  id: "sy-el-direct",
  group: "sy-elim",
  label: "Add or take away",
  blurb: "The y numbers already match: opposite signs add, same signs take away.",
  heading: "Elimination: the numbers already match",
  instruction: () =>
    "Look at the y terms: they have the same number in front. If their signs are OPPOSITE (+3y and −3y), " +
    "ADD the equations and the y's cancel. If the signs are the SAME, take one equation from the other. " +
    "Either way only x is left: solve it, then put x back into either equation for y.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    for (let g = 0; g < 400; g++) {
      const { x, y } = answerOf(r, t);
      const b = r.int(1, t === "gentle" ? 4 : 6);
      const plus = r.chance(0.5);            // 0: add (opposite signs) · 1: take away
      const a = r.int(1, 6), c = r.int(1, 6);
      if (!plus && a === c) continue;
      const b2 = plus ? -b : b;
      const e = a * x + b * y, f = c * x + b2 * y;
      const k = plus ? a + c : a - c;
      const rhs = plus ? e + f : e - f;
      if (t === "gentle" && (k < 0 || f < 0)) continue;
      if (t !== "stretch" && f < 0) continue;
      if (Math.abs(e) > 99 || Math.abs(f) > 99) continue;
      return { x, y, a, b, c, b2, e, f, kind: plus ? 0 : 1, k, rhs };
    }
    return { x: 3, y: 1, a: 2, b: 1, c: 1, b2: -1, e: 7, f: 2, kind: 0, k: 3, rhs: 9 };
  },
  render(item) {
    const { a, b, c, b2, e, f } = item;
    return pairOf(line2(a, b, e), line2(c, b2, f)) +
      ask(`To get rid of y, ${tick(...ADD_OR_TAKE)}`) +
      eq(`which leaves ${box()} x = ${box()}`) + xy();
  },
  worked() {
    return worked(pairOf("2x + y = 7", "x − y = 2") +
      say("+y and −y have opposite signs, so ADD: (2x + x) + (y − y) = 7 + 2, which is 3x = 9, so x = 3. " +
        "Into (1): 6 + y = 7, so y = 1."));
  },
  key(item) {
    return [want.tick(item.kind), want.num(item.k), want.num(item.rhs), want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`${ADD_OR_TAKE[item.kind]}: ${num(item.k)}x = ${num(item.rhs)}; x = ${num(item.x)}, y = ${num(item.y)}`];
  },
};

const elOne = {
  id: "sy-el-one",
  group: "sy-elim",
  label: "Multiply one equation first",
  blurb: "2y and 6y: three lots of equation (1) make the y's match.",
  heading: "Elimination: multiply one equation first",
  instruction: () =>
    "The y numbers do not match yet — but one is a multiple of the other. Multiply EVERY term of equation (1), " +
    "both sides, by the number that makes its y match equation (2)'s. Now add or take away, as before, solve " +
    "for x, and put it back for y.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    for (let g = 0; g < 400; g++) {
      const { x, y } = answerOf(r, t);
      const b = r.int(1, 3), k = r.int(2, t === "gentle" ? 3 : 4);
      const a = r.int(1, 5), c = r.int(1, 7);
      const sign = r.chance(0.5) ? 1 : -1;
      const d = sign * k * b;
      if (sign === 1 && k * a === c) continue;
      const e = a * x + b * y, f = c * x + d * y;
      if (t !== "stretch" && (f < 0 || e < 0)) continue;
      if (Math.abs(e) > 60 || Math.abs(f) > 99) continue;
      return { x, y, a, b, c, d, e, f, k };
    }
    return { x: 2, y: 3, a: 1, b: 1, c: 2, d: 3, e: 5, f: 13, k: 3 };
  },
  render(item) {
    const { a, b, c, d, e, f } = item;
    return pairOf(line2(a, b, e), line2(c, d, f)) +
      eq(`multiply (1) by ${box()}`) + xy();
  },
  worked() {
    return worked(pairOf("x + y = 5", "2x + 3y = 13") +
      say("Multiply (1) by 3: 3x + 3y = 15. Now both have +3y, so take (2) away from it: (3x − 2x) = 15 − 13, " +
        "so x = 2. Into (1): 2 + y = 5, so y = 3."));
  },
  key(item) {
    return [want.num(item.k), want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`× ${item.k}; x = ${num(item.x)}, y = ${num(item.y)}`];
  },
};

const elBoth = {
  id: "sy-el-both",
  group: "sy-elim",
  label: "Multiply both equations",
  blurb: "3x and 2x: × 2 and × 3 make both 6x.",
  heading: "Elimination: multiply both equations",
  instruction: () =>
    "Neither x number is a multiple of the other, so multiply BOTH equations: each by the other's x number " +
    "(divided by any number they share), so both x terms become their lowest common multiple. Then take " +
    "away, solve for y, and put it back for x. Get rid of x every time here.",
  cols: 1,
  defaultCount: 3,
  hardest: true,
  make(r, o) {
    const t = tier(o);
    for (let g = 0; g < 600; g++) {
      const { x, y } = answerOf(r, t);
      const a = r.int(2, 7), c = r.int(2, 7);
      if (a === c || a % c === 0 || c % a === 0) continue;
      const b = coef(r, t, 1, 6), d = coef(r, t, 1, 6);
      if (a * d - b * c === 0) continue;
      const e = a * x + b * y, f = c * x + d * y;
      if (t !== "stretch" && (e < 0 || f < 0)) continue;
      if (Math.abs(e) > 99 || Math.abs(f) > 99) continue;
      const G = gcd(a, c);
      return { x, y, a, b, c, d, e, f, p: c / G, q: a / G };
    }
    return { x: 2, y: 1, a: 3, b: 2, c: 2, d: 3, e: 8, f: 7, p: 2, q: 3 };
  },
  render(item) {
    const { a, b, c, d, e, f } = item;
    return pairOf(line2(a, b, e), line2(c, d, f)) +
      eq(`multiply (1) by ${box()} and (2) by ${box()}`) + xy();
  },
  worked() {
    return worked(pairOf("3x + 2y = 8", "2x + 3y = 7") +
      say("Make the x's 6x: (1) × 2 gives 6x + 4y = 16, and (2) × 3 gives 6x + 9y = 21. Take the first from the " +
        "second: 5y = 5, so y = 1. Into (1): 3x + 2 = 8, so x = 2."));
  },
  key(item) {
    return [want.num(item.p), want.num(item.q), want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`(1) × ${item.p}, (2) × ${item.q}; x = ${num(item.x)}, y = ${num(item.y)}`];
  },
};

/* ═══ THE GRAPHICAL METHOD ═════════════════════════════════════════════════*/

/** Two lines y = mx + c that cross at a whole-number point on a small grid. */
function crossing(r, o, xs) {
  const t = tier(o);
  for (let g = 0; g < 600; g++) {
    const A = t === "gentle" ? { m: r.int(1, 2), c: r.int(0, 3) } : { m: r.pick([-2, -1, 1, 2, 3]), c: r.int(-3, 5) };
    const B = t === "gentle" ? { m: r.pick([-1, 0, 1]), c: r.int(1, 8) } : { m: r.pick([-3, -2, -1, 0, 1, 2]), c: r.int(-3, 6) };
    if (A.m === B.m) continue;
    const x = (B.c - A.c) / (A.m - B.m);
    if (!Number.isInteger(x) || !xs.includes(x)) continue;
    const ys = xs.flatMap((v) => [at(A, v), at(B, v)]);
    if (Math.max(...ys) > 12 || Math.min(...ys) < -8) continue;
    if (t === "gentle" && Math.min(...ys) < 0) continue;
    return { A, B, x, y: at(A, x) };
  }
  return { A: { m: 1, c: 1 }, B: { m: -1, c: 5 }, x: 2, y: 3 };
}
const xsFor = (o) => (tier(o) === "gentle" ? [0, 1, 2, 3, 4] : [-2, -1, 0, 1, 2, 3]);
const table2 = (xs, rowA, rowB) =>
  `<table class="fn-table gr-table"><tbody><tr><th>x</th>${xs.map((x) => `<td>${num(x)}</td>`).join("")}</tr>` +
  `<tr><th>A</th>${rowA.map((v) => `<td>${v}</td>`).join("")}</tr>` +
  `<tr><th>B</th>${rowB.map((v) => `<td>${v}</td>`).join("")}</tr></tbody></table>`;

const grTables = {
  id: "sy-gr-table",
  group: "sy-graph",
  label: "Tables for both lines",
  blurb: "Fill a table for each line; where the y's agree is the answer.",
  heading: "Graphical method: tables of both lines",
  instruction: () =>
    "Work out y for every x in the table, once for line A and once for line B. Look along the two rows for the " +
    "x where they give the SAME y: that point is on both lines, so it is the answer to both equations.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const xs = xsFor(o);
    return { ...crossing(r, o, xs), xs };
  },
  render(item) {
    const { A, B, xs } = item;
    return eq(`A: ${yEq(A)} &nbsp;&nbsp; B: ${yEq(B)}`) + table2(xs, xs.map(() => box()), xs.map(() => box())) +
      eq(`the same y at x = ${box()}, y = ${box()}`);
  },
  worked() {
    return worked(eq("A: y = x + 1 &nbsp;&nbsp; B: y = −x + 5") +
      table2([0, 1, 2, 3, 4], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1]) +
      say("At x = 2 both lines give y = 3, so (2, 3) is on both: x = 2, y = 3."));
  },
  key(item) {
    const { A, B, xs } = item;
    return [...xs.map((x) => want.num(at(A, x))), ...xs.map((x) => want.num(at(B, x))), want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`(${num(item.x)}, ${num(item.y)})`];
  },
};

/* the crossing read off two lines already drawn — chapter 7's own section,
   moved here because it IS the graphical method (its id kept) */
const grRead = { ...grCross, group: "sy-graph", heading: "Graphical method: read where they cross", label: "Read the crossing point" };

/** Are the ruled lines exactly line A and line B, each across the table? */
function bothRuled(lines, A, B, g, lo, hi) {
  const pt = (k) => pointOf(k, g.x[0], g.x[1], g.y[0], g.y[1]);
  const real = lines.filter(([p, q]) => p !== q).map(([p, q]) => [pt(p), pt(q)]);
  const onL = (l) => ([P, Q]) => at(l, P[0]) === P[1] && at(l, Q[0]) === Q[1];
  const span = (segs) => segs.length && Math.min(...segs.flat().map((p) => p[0])) <= lo && Math.max(...segs.flat().map((p) => p[0])) >= hi;
  const a = real.filter(onL(A)), b = real.filter(onL(B));
  return real.length > 0 && real.every((s) => onL(A)(s) || onL(B)(s)) && span(a) && span(b);
}

const grDrawBoth = {
  id: "sy-gr-draw",
  group: "sy-graph",
  label: "Draw both lines",
  blurb: "Rule each line from its table, then read where they cross.",
  heading: "Graphical method: draw both lines",
  instruction: () =>
    "Work out a few points of each line (x = the first and last in the table, and one between is plenty), " +
    "then rule each line straight through its points across the whole grid. Where they cross is the answer. " +
    "On screen, drag the ruler from one end of a line to the other; it snaps to the corners of the squares.",
  cols: 1,
  defaultCount: 2,
  hardest: true,
  make(r, o) {
    const xs = xsFor(o);
    return { ...crossing(r, o, xs), xs };
  },
  render(item) {
    const { A, B, xs } = item;
    const pts = xs.flatMap((x) => [[x, at(A, x)], [x, at(B, x)]]);
    const g = gridFor(pts);
    return side(art(planeSvg({ ...g, cell: cellFor(g), rule: true })),
      eq(`A: ${yEq(A)}`) + eq(`B: ${yEq(B)}`) + eq(`they cross at (${box()}, ${box()})`));
  },
  key(item) {
    const { A, B, xs } = item;
    const pts = xs.flatMap((x) => [[x, at(A, x)], [x, at(B, x)]]);
    const g = gridFor(pts);
    return [
      want.draw({
        says: `line A (${yEq(A)}) and line B (${yEq(B)}), each ruled from x = ${num(xs[0])} to x = ${num(xs[xs.length - 1])}`,
        check: (lines) => bothRuled(lines, A, B, g, xs[0], xs[xs.length - 1]),
      }),
      want.num(item.x), want.num(item.y),
    ];
  },
  answer(item) {
    return [`(${num(item.x)}, ${num(item.y)})`];
  },
};

const HOW_MANY = ["one answer — they cross", "no answer — parallel", "every point — the same line"];

const grHowMany = {
  id: "sy-gr-many",
  group: "sy-graph",
  label: "One, none or every point",
  blurb: "Same gradient: parallel (no answer) or the same line (every point).",
  heading: "Graphical method: how many answers?",
  instruction: () =>
    "Write each equation as y = mx + c (divide through if it starts 2y = …) and compare the gradients m. " +
    "Different gradients: the lines cross once — one answer. The same gradient but a different c: parallel " +
    "lines that never meet — no answer. The same m AND the same c: one line drawn twice — every point on it " +
    "is an answer.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const kind = r.int(0, 2);
    const m = r.pick(t === "gentle" ? [1, 2, 3] : [-2, -1, 1, 2, 3]);
    const c = r.int(t === "gentle" ? 0 : -3, 4);
    const A = { m, c };
    let B;
    if (kind === 0) { do { B = { m: r.pick([-2, -1, 1, 2, 3]), c: r.int(-2, 5) }; } while (B.m === m); }
    else if (kind === 1) { let c2 = c; while (c2 === c) c2 = r.int(t === "gentle" ? 0 : -3, 5); B = { m, c: c2 }; }
    else B = { m, c };
    const k = r.int(2, 3);   // line B is written k times over
    return { A, B, kind, k };
  },
  render(item) {
    const { A, B, k } = item;
    const scaled = `${k}y = ${yEq({ m: k * B.m, c: k * B.c }).replace("y = ", "")}`;
    const pts = [-2, 0, 2, 3].flatMap((x) => [[x, at(A, x)], [x, at(B, x)]]);
    const g = gridFor(pts);
    const clampG = { x: [Math.max(g.x[0], -5), Math.min(g.x[1], 6)], y: [Math.max(g.y[0], -8), Math.min(g.y[1], 12)] };
    return side(art(planeSvg({ ...clampG, cell: cellFor(clampG), lines: [{ ...A, name: "A" }, { ...B, name: "B", dash: true }] })),
      eq(`A: ${yEq(A)}`) + eq(`B: ${scaled}`) +
      eq(`gradient of A = ${box()} &nbsp; of B = ${box()}`) + ask(`So the pair has ${tick(...HOW_MANY)}`));
  },
  worked() {
    return worked(eq("A: y = 2x + 1 &nbsp;&nbsp; B: 3y = 6x + 9") +
      say("Divide B by 3: y = 2x + 3. Both gradients are 2, but A crosses the y axis at 1 and B at 3 — parallel " +
        "lines, so they never meet and the pair has no answer."));
  },
  key(item) {
    return [want.num(item.A.m), want.num(item.B.m), want.tick(item.kind)];
  },
  answer(item) {
    return [`gradients ${num(item.A.m)} and ${num(item.B.m)}: ${HOW_MANY[item.kind]}`];
  },
};

export const SY_EXERCISES = [subReady, subMake, subWord, elDirect, elOne, elBoth, grTables, grRead, grDrawBoth, grHowMany];
