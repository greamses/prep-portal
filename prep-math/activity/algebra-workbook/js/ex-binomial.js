/* ============================================================================
   Algebra Workbook — CHAPTER 10: THE BINOMIAL EXPANSION
   ----------------------------------------------------------------------------
   (a + b)² = a² + 2ab + b² is chapter 5's square. Multiply by (a + b) again
   and again and the numbers in front — 1 2 1, 1 3 3 1, 1 4 6 4 1 — are the
   rows of PASCAL'S TRIANGLE, where every number is the two above it added.

     Pascal's triangle     fill the gaps: each number is the two above it
     the coefficients      (a + b)ⁿ: row n of the triangle, the powers of a
                           going down as the powers of b go up
     expand (x + k)ⁿ       each term is the row's number × a power of k: the
                           numbers in front, worked out
     one term by ⁿCᵣ       (Middle+) the term in xʳ without writing them all:
                           ⁿCᵣ = n! ÷ (r! (n − r)!), the r-th number of row n

   Every answer is a whole number. Powers are written with raised figures
   (x³), never TeX — the workbook's own way (mathify.js leaves them be).
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
/* the expansions are kept out of MathJax: raised figures (x³) and boxes sit
   evenly in plain text, where typeset maths squeezes them together */
const eq = (html) => `<p class="wb-ask ap-eq bn-eq wb-nomath">${html}</p>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;
const num = (n) => (n < 0 ? `−${-n}` : String(n));

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((d) => SUP[d]).join("");
/** x to a power as written: 1, x, x², x³ … */
const pow = (letter, n) => (n === 0 ? "" : n === 1 ? letter : `${letter}${sup(n)}`);

/** Row n of Pascal's triangle. */
export function row(n) {
  const out = [1];
  for (let r = 1; r <= n; r++) out.push((out[r - 1] * (n - r + 1)) / r);
  return out;
}
const choose = (n, r) => row(n)[r];
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

export const BN_GROUPS = [
  { id: "bn-binomial", chapter: "Chapter 10 · The binomial expansion", label: "The binomial expansion", blurb: "(a + b)ⁿ: Pascal's triangle gives the numbers in front." },
];

/* ═══ Pascal's triangle ════════════════════════════════════════════════════*/

/** The triangle down to row n, with some numbers left as boxes. */
function pascalHtml(n, gaps) {
  let out = "";
  for (let k = 0; k <= n; k++) {
    out += `<div class="bn-row">${row(k).map((v, j) => `<span class="bn-c">${gaps.has(`${k},${j}`) ? box() : v}</span>`).join("")}</div>`;
  }
  return `<div class="bn-pascal wb-nomath">${out}</div>`;
}

const bnPascal = {
  id: "bn-pascal",
  group: "bn-binomial",
  label: "Pascal's triangle",
  blurb: "Each number is the two above it added.",
  heading: "Pascal's triangle",
  instruction: () =>
    "Every row starts and ends with 1. Every other number is the TWO numbers just above it added together. " +
    "Fill in the gaps — a gap may need the row above it filled first.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    const n = t === "gentle" ? r.int(4, 5) : t === "middle" ? r.int(5, 7) : r.int(6, 8);
    const gaps = new Set();
    const want = t === "gentle" ? 3 : t === "middle" ? 5 : 7;
    while (gaps.size < want) {
      const k = r.int(2, n), j = r.int(1, k - 1);
      gaps.add(`${k},${j}`);
    }
    return { n, gaps: [...gaps].sort((p, q) => { const [a, b] = p.split(",").map(Number); const [c, d] = q.split(",").map(Number); return a - c || b - d; }) };
  },
  render(item) {
    return pascalHtml(item.n, new Set(item.gaps));
  },
  worked() {
    return worked(pascalHtml(4, new Set()) +
      say("Row 4: 1, then 1 + 3 = 4, 3 + 3 = 6, 3 + 1 = 4, and 1. The triangle is the same read from either side."));
  },
  key(item) {
    return item.gaps.map((g) => { const [k, j] = g.split(",").map(Number); return want.num(row(k)[j]); });
  },
  answer(item) {
    return [item.gaps.map((g) => { const [k, j] = g.split(",").map(Number); return row(k)[j]; }).join(", ")];
  },
};

/* ═══ the coefficients of (a + b)ⁿ ═════════════════════════════════════════*/

const bnCoef = {
  id: "bn-coef",
  group: "bn-binomial",
  label: "The coefficients of (a + b)ⁿ",
  blurb: "Row n of the triangle, powers of a down, powers of b up.",
  heading: "Expanding (a + b)ⁿ",
  instruction: () =>
    "(a + b)ⁿ has n + 1 terms. The powers of a go DOWN from n to 0 while the powers of b go UP from 0 to n — in " +
    "every term they add up to n. The numbers in front are row n of Pascal's triangle. Fill them in.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    return { n: t === "gentle" ? r.int(2, 4) : t === "middle" ? r.int(3, 5) : r.int(4, 7) };
  },
  render(item) {
    const { n } = item;
    const terms = row(n).map((_, j) => `${j === 0 || j === n ? "" : box()}${pow("a", n - j)}${pow("b", j)}`);
    return eq(`(a + b)${sup(n)} = ${terms.join(" + ")}`);
  },
  worked() {
    return worked(eq("(a + b)⁴ = a⁴ + 4a³b + 6a²b² + 4ab³ + b⁴") +
      say("Row 4 is 1 4 6 4 1. The powers of a count down 4, 3, 2, 1, 0 and the powers of b count up 0, 1, 2, 3, 4."));
  },
  key(item) {
    return row(item.n).slice(1, -1).map((v) => want.num(v));
  },
  answer(item) {
    return [row(item.n).join(", ")];
  },
};

/* ═══ expand (x + k)ⁿ ══════════════════════════════════════════════════════*/

const bnExpand = {
  id: "bn-expand",
  group: "bn-binomial",
  label: "Expand (x + k)ⁿ",
  blurb: "Each term: the row's number × a power of k.",
  heading: "Expanding (x + k)ⁿ",
  instruction: () =>
    "Write it as (a + b)ⁿ with a = x and b = k. Each term is the row's number × xᵖ × k to the power that makes " +
    "them add up to n. Work out the number in front of each power of x — watch the signs when k is negative: " +
    "an odd power of a minus is minus.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const n = t === "gentle" ? r.int(2, 3) : t === "middle" ? r.int(3, 4) : r.int(3, 5);
    const k = t === "gentle" ? r.int(1, 3) : t === "middle" ? r.int(1, 4) : r.pick([-3, -2, -1, 2, 3, 4]);
    return { n, k, coefs: row(n).map((c, j) => c * k ** j) };
  },
  render(item) {
    const { n, k } = item;
    const terms = item.coefs.map((_, j) => (j === 0 ? pow("x", n) : `${box()}${pow("x", n - j)}`));
    return eq(`(x ${k < 0 ? "−" : "+"} ${Math.abs(k)})${sup(n)} = ${terms.join(" + ")}`);
  },
  worked() {
    return worked(eq("(x + 2)³ = x³ + 6x² + 12x + 8") +
      say("Row 3 is 1 3 3 1. The terms are 1 × x³, 3 × x² × 2 = 6x², 3 × x × 2² = 12x, and 1 × 2³ = 8."));
  },
  key(item) {
    return item.coefs.slice(1).map((v) => want.num(v));
  },
  answer(item) {
    const { n } = item;
    return [item.coefs.map((c, j) => `${j ? num(c) : ""}${pow("x", n - j)}`).join(" + ")];
  },
};

/* ═══ one term by nCr ══════════════════════════════════════════════════════*/

const bnTerm = {
  id: "bn-term",
  group: "bn-binomial",
  label: "One term by ⁿCᵣ",
  blurb: "ⁿCᵣ = n! ÷ (r! (n − r)!), without writing them all out.",
  heading: "One term of the expansion",
  hardest: true,
  instruction: () =>
    "The number in row n, place r (counting the first 1 as place 0) is ⁿCᵣ = n! ÷ (r! × (n − r)!), where n! is " +
    "n × (n − 1) × … × 1. In (x + k)ⁿ the term with xⁿ⁻ʳ is ⁿCᵣ × kʳ × xⁿ⁻ʳ. Find ⁿCᵣ, then the number in front of " +
    "the term asked for.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const n = t === "stretch" ? r.int(5, 9) : r.int(4, 7);
    const rr = r.int(1, n - 1);
    const k = t === "stretch" ? r.pick([-2, -1, 2, 3]) : r.pick([1, 2, 3]);
    return { n, r: rr, k, C: choose(n, rr), coef: choose(n, rr) * k ** rr };
  },
  render(item) {
    const { n, r: rr, k } = item;
    return eq(`In (x ${k < 0 ? "−" : "+"} ${Math.abs(k)})${sup(n)}: &nbsp; ${sup(n)}C<sub>${rr}</sub> = ${box()} &nbsp;&nbsp; the term in ${pow("x", n - rr) || "x⁰"} is ${box()}${pow("x", n - rr)}`);
  },
  worked() {
    return worked(eq("In (x + 2)⁵, the term in x³") +
      say(`Here r = 2 (x³ is x⁵⁻²). ⁵C₂ = 5! ÷ (2! × 3!) = 120 ÷ (2 × 6) = 10. The term is 10 × 2² × x³ = 40x³.`));
  },
  key(item) {
    return [want.num(item.C), want.num(item.coef)];
  },
  answer(item) {
    return [`C = ${item.C} (= ${fact(item.n)} ÷ (${fact(item.r)} × ${fact(item.n - item.r)})); ${num(item.coef)}${pow("x", item.n - item.r)}`];
  },
};

export const BN_EXERCISES = [bnPascal, bnCoef, bnExpand, bnTerm];
