/* ============================================================================
   Algebra Workbook — CHAPTER 3, after the two scales: THE DETERMINANT METHOD
   ----------------------------------------------------------------------------
   The two scales solve a pair of equations by swapping what one knows into the
   other. The determinant method (Cramer's rule) solves the same pair with no
   swapping at all — three small squares of numbers and two divisions:

       ax + by = e            D  = | a  b |    Dx = | e  b |    Dy = | a  e |
       cx + dy = f                 | c  d |         | f  d |         | c  f |

       x = Dx ÷ D,   y = Dy ÷ D,   and a square |p q; r s| is worth ps − qr.

   So the sections go: work one square out; build the three squares from a pair
   of equations (the lesson is WHICH column the answers replace); solve with
   them; and what it means when D is 0 — the only time the method has nothing
   to divide by, and exactly the time the pair has no single answer.

   Every pair is made from its answer, so x and y are whole numbers and D
   divides both Dx and Dy exactly. The squares are drawn as a grid between two
   bars (`.dt-det`, style.css) and kept out of MathJax's way (`wb-nomath`), so
   each number stays in its corner.
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;

/** A number as it is printed: a real minus sign. */
const num = (n) => (n < 0 ? `−${-n}` : String(n));
/** A number as it sits inside a product: negatives in brackets. */
const factor = (n) => (n < 0 ? `(−${-n})` : String(n));
/** The value of the square |p q; r s|. */
const value = ([[p, q], [r, s]]) => p * s - q * r;

/** The square of four numbers (or four boxes) between two bars. */
function square(rows, name = "") {
  const cells = rows.flat().map((v) => `<span class="dt-det__c">${typeof v === "number" ? num(v) : v}</span>`).join("");
  const label = name ? `${name} = ` : "";
  return `<span class="dt-sq">${label}<span class="dt-det wb-nomath">${cells}</span></span>`;
}

/** One term of an equation: 3x, −x, + 2y, − 5y … */
function term(k, letter, first) {
  const size = Math.abs(k) === 1 ? "" : String(Math.abs(k));
  if (first) return `${k < 0 ? "−" : ""}${size}${letter}`;
  return `${k < 0 ? "−" : "+"} ${size}${letter}`;
}
/** The pair, one equation under the other. */
const pairOf = ({ a, b, c, d, e, f }) =>
  `<div class="dt-pair">${eq(`${term(a, "x", true)} ${term(b, "y", false)} = ${num(e)}`)}${eq(`${term(c, "x", true)} ${term(d, "y", false)} = ${num(f)}`)}</div>`;

/* D, Dx and Dy, written one way everywhere: a serif italic D with its letter
   below, kept out of MathJax's way (it would set "Dx" as D times x). */
const name = (sub) => `<span class="dt-name wb-nomath">D${sub ? `<sub>${sub}</sub>` : ""}</span>`;
const D = name("");
const Dx = name("x");
const Dy = name("y");

/** A coefficient: never 0, and from 1 up at the gentlest level. */
function coef(r, t, max) {
  const n = r.int(1, max);
  return t === "stretch" && r.int(0, 2) === 0 ? -n : n;
}

/** A pair of equations with whole-number answers and D not 0. */
function makePair(r, o) {
  const t = tier(o);
  const max = t === "gentle" ? 5 : t === "middle" ? 7 : 9;
  for (let g = 0; g < 400; g++) {
    const x = t === "stretch" ? r.int(-6, 8) : r.int(1, t === "gentle" ? 6 : 9);
    const y = t === "stretch" ? r.int(-6, 8) : r.int(1, t === "gentle" ? 6 : 9);
    const a = coef(r, t, max), b = coef(r, t, max), c = coef(r, t, max), d = coef(r, t, max);
    const D = a * d - b * c;
    if (D === 0) continue;
    // Gentle keeps D positive and every number on the paper below 60.
    if (t === "gentle" && D < 0) continue;
    const e = a * x + b * y, f = c * x + d * y;
    if (t !== "stretch" && (e < 0 || f < 0)) continue;
    if (Math.max(Math.abs(e), Math.abs(f)) > (t === "gentle" ? 60 : 99)) continue;
    return { a, b, c, d, e, f, x, y, D, Dx: e * d - b * f, Dy: a * f - e * c };
  }
  return { a: 2, b: 1, c: 1, d: 3, e: 7, f: 11, x: 2, y: 3, D: 5, Dx: 10, Dy: 15 };
}

export const DT_GROUPS = [
  { id: "dt-det", label: "The determinant method", blurb: "The same pairs again, solved with three squares of numbers and two divisions." },
];

/* ═══ one square ═══════════════════════════════════════════════════════════*/

const dtValue = {
  id: "dt-value",
  group: "dt-det",
  label: "Work out a determinant",
  blurb: "Top-left times bottom-right, take away top-right times bottom-left.",
  heading: "What a square of numbers is worth",
  instruction: () =>
    `A square of four numbers between two bars is a determinant. It is worth one number: multiply down the ` +
    `diagonal from top-left to bottom-right, multiply the other diagonal, and take the second away from the ` +
    `first. Watch the order — it is always top-left × bottom-right FIRST.`,
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const max = t === "gentle" ? 6 : 9;
    for (let g = 0; g < 200; g++) {
      const pick = () => (t === "stretch" && r.int(0, 2) === 0 ? -r.int(1, max) : r.int(1, max));
      const rows = [[pick(), pick()], [pick(), pick()]];
      const v = value(rows);
      if (t === "gentle" && v < 0) continue; // negatives answers wait for Middle
      return { rows, v };
    }
    return { rows: [[3, 2], [1, 4]], v: 10 };
  },
  render(item) {
    return ask(`${square(item.rows)} = ${box()}`);
  },
  worked() {
    return worked(ask(`${square([[3, 2], [1, 4]])} = 3 × 4 − 2 × 1 = 12 − 2 = 10`) +
      say("Down the main diagonal: 3 × 4 is 12. Up the other: 2 × 1 is 2. Take the second from the first: 10."));
  },
  key(item) {
    return [want.num(item.v)];
  },
  answer(item) {
    const [[p, q], [r, s]] = item.rows;
    return [`${factor(p)} × ${factor(s)} − ${factor(q)} × ${factor(r)} = ${num(item.v)}`];
  },
};

/* ═══ the three squares of a pair ══════════════════════════════════════════*/

const blank = [[box(), box()], [box(), box()]];

const dtBuild = {
  id: "dt-build",
  group: "dt-det",
  label: "Build D, Dx and Dy",
  blurb: "Which column do the answers replace?",
  heading: "Three squares from one pair",
  instruction: () =>
    `Write the pair so the x terms are in one column and the y terms in the next. ${D} is the square of the ` +
    `numbers in front of x and y, just as they stand. For ${Dx}, keep ${D} but put the right-hand answers in the x ` +
    `column. For ${Dy}, put them in the y column instead. Fill in every corner.`,
  cols: 1,
  defaultCount: 2,
  make: (r, o) => makePair(r, o),
  render(item) {
    return pairOf(item) + `<div class="dt-row">${square(blank, D)}${square(blank, Dx)}${square(blank, Dy)}</div>`;
  },
  worked() {
    const p = { a: 2, b: 1, c: 1, d: 3, e: 7, f: 11 };
    return worked(pairOf(p) +
      `<div class="dt-row">${square([[2, 1], [1, 3]], D)}${square([[7, 1], [11, 3]], Dx)}${square([[2, 7], [1, 11]], Dy)}</div>` +
      say(`${D} is the numbers in front of x and y: 2 and 1 on top, 1 and 3 underneath. The answers are 7 and 11. ` +
        `In ${Dx} they replace the x column (2 and 1); in ${Dy} they replace the y column (1 and 3).`));
  },
  key(item) {
    const { a, b, c, d, e, f } = item;
    return [a, b, c, d, e, b, f, d, a, e, c, f].map((v) => want.num(v));
  },
  answer(item) {
    const { a, b, c, d, e, f } = item;
    return [`D: ${num(a)} ${num(b)} / ${num(c)} ${num(d)}`, `Dx: ${num(e)} ${num(b)} / ${num(f)} ${num(d)}`, `Dy: ${num(a)} ${num(e)} / ${num(c)} ${num(f)}`];
  },
};

/* ═══ solving with them ════════════════════════════════════════════════════*/

const dtSolve = {
  id: "dt-solve",
  group: "dt-det",
  label: "Solve by determinants",
  blurb: "Work out D, Dx and Dy; then x = Dx ÷ D and y = Dy ÷ D.",
  heading: "Solve the pair with determinants",
  instruction: () =>
    `Build the three squares (you need not draw them all if you can see them), work each one out, then ` +
    `divide: x is ${Dx} ÷ ${D} and y is ${Dy} ÷ ${D}. Check by putting x and y back into BOTH equations — each side must ` +
    `come out the same.`,
  cols: 1,
  defaultCount: 3,
  make: (r, o) => makePair(r, o),
  render(item) {
    return pairOf(item) + eq(`${D} = ${box()} &nbsp;&nbsp; ${Dx} = ${box()} &nbsp;&nbsp; ${Dy} = ${box()}`) +
      eq(`x = ${box()} &nbsp;&nbsp; y = ${box()}`);
  },
  worked() {
    const p = { a: 2, b: 1, c: 1, d: 3, e: 7, f: 11 };
    return worked(pairOf(p) +
      `<div class="dt-row">${square([[2, 1], [1, 3]], D)}${square([[7, 1], [11, 3]], Dx)}${square([[2, 7], [1, 11]], Dy)}</div>` +
      say(`${D} = 2 × 3 − 1 × 1 = 5. ${Dx} = 7 × 3 − 1 × 11 = 10. ${Dy} = 2 × 11 − 7 × 1 = 15. So x = 10 ÷ 5 = 2 and ` +
        "y = 15 ÷ 5 = 3. Check: 2 × 2 + 3 = 7 and 2 + 3 × 3 = 11 — both right."));
  },
  key(item) {
    return [want.num(item.D), want.num(item.Dx), want.num(item.Dy), want.num(item.x), want.num(item.y)];
  },
  answer(item) {
    return [`D = ${num(item.D)}, Dx = ${num(item.Dx)}, Dy = ${num(item.Dy)}`, `x = ${num(item.x)}, y = ${num(item.y)}`];
  },
};

/* ═══ when D is 0 ══════════════════════════════════════════════════════════*/

const SAYS = ["one answer for x and y", "no answer — the lines never meet", "every point of one line — the two equations say the same"];

const dtZero = {
  id: "dt-zero",
  group: "dt-det",
  label: "When D is 0",
  blurb: "Nothing to divide by — and the pair has no single answer.",
  heading: "When the method has nothing to divide by",
  hardest: true,
  instruction: () =>
    `Work out ${D} first. If it is not 0 the pair has exactly one answer. If ${D} is 0, x = ${Dx} ÷ ${D} cannot be done, ` +
    `and the pair has no single answer: either the equations contradict each other (the lines are parallel ` +
    `and never meet), or one is just the other multiplied up (the same line twice, so every point of it ` +
    `works). Tick what this pair has.`,
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const kind = r.int(0, 2); // 0 one answer · 1 none · 2 the same line
    if (kind === 0) return { ...makePair(r, o), kind };
    const a = r.int(1, 6), b = r.int(1, 6), e = r.int(2, 30);
    const m = r.int(2, 4);
    const f = kind === 2 ? m * e : m * e + (r.int(0, 1) ? r.int(1, 9) : -r.int(1, Math.min(9, m * e - 1)));
    return { a, b, c: m * a, d: m * b, e, f, D: 0, kind };
  },
  render(item) {
    return pairOf(item) + eq(`${D} = ${box()}`) + ask(`This pair has ${tick(...SAYS)}`);
  },
  worked() {
    const p = { a: 1, b: 2, c: 2, d: 4, e: 5, f: 12 };
    return worked(pairOf(p) +
      say(`${D} = 1 × 4 − 2 × 2 = 0, so there is nothing to divide by. Doubling the first equation gives ` +
        "2x + 4y = 10 — but the second says 2x + 4y = 12. Both cannot be true: the lines are parallel, and the " +
        "pair has no answer."));
  },
  key(item) {
    return [want.num(item.D), want.tick(item.kind)];
  },
  answer(item) {
    return [`D = ${num(item.D)}`, SAYS[item.kind]];
  },
};

export const DT_EXERCISES = [dtValue, dtBuild, dtSolve, dtZero];
