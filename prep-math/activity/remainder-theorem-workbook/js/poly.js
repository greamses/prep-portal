/* ============================================================================
   Remainder Theorem Workbook — the polynomials, and how they are said
   ----------------------------------------------------------------------------
   A polynomial here is an array of coefficients, LOWEST power first — c[0] is
   the number on its own, c[1] is what multiplies x, c[2] what multiplies x².
   The same order the place-value workbook writes a number's digits in, and for
   the same reason: index 2 always means the same thing, and the one place that
   cares which end is which is the code that prints it.

   Everything below is about SAYING a polynomial rather than computing with it,
   because the arithmetic here is trivial and the saying is not. Three ways of
   writing the same term matter to this workbook:

     termText   2x³        what is written in the question
     swapText   2×3×3×3    what goes in the middle of the swap ladder
     shortText  2×3³       the same thing for the answer key, where space is short

   swapText is spelled out as repeated multiplication ON PURPOSE. A child who
   is still learning what an index means cannot use a scaffold that assumes it,
   and the whole point of the ladder is that every row is arithmetic they can
   already do. The index notation comes back the moment the scaffold is taken
   away — see the "how much help" dial.
   ========================================================================== */

const MINUS = "−"; // U+2212, not a hyphen: it has to look like a minus sign
const TIMES = "×";
const SUPS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶"];

/** x, x², x³ — or nothing at all for the constant term. */
function power(p) {
  if (p === 0) return "";
  if (p === 1) return "x";
  return `x<sup>${p}</sup>`;
}

/** A number written for paper: a real minus sign, never a hyphen. */
export function num(n) {
  return n < 0 ? MINUS + Math.abs(n) : String(n);
}

/** A number that is about to be multiplied — negatives get their brackets. */
export function factor(n) {
  return n < 0 ? `(${MINUS}${Math.abs(n)})` : String(n);
}

/** One term as it is written in the polynomial: 2x³, −x, 5. */
export function termText(coef, p) {
  if (p === 0) return num(coef);
  const sign = coef < 0 ? MINUS : "";
  const mag = Math.abs(coef) === 1 ? "" : String(Math.abs(coef));
  return sign + mag + power(p);
}

/**
 * The whole polynomial: 2x³ − 4x + 5.
 *
 * `letter` replaces the coefficient at one power with a letter — "+ kx" where
 * the 4 would have been — which is the only thing the find-the-missing-number
 * questions need that plain printing cannot do.
 */
export function polyText(c, { letter = null } = {}) {
  let out = "";
  for (let p = c.length - 1; p >= 0; p--) {
    const isLetter = letter && letter.at === p;
    if (!isLetter) {
      if (!c[p] && p > 0) continue; // a missing power is simply not written
      if (!c[p] && p === 0 && out) continue; // …and neither is a zero constant
    }
    const body = isLetter
      ? letter.as + power(p)
      : p === 0
        ? String(Math.abs(c[p]))
        : (Math.abs(c[p]) === 1 ? "" : String(Math.abs(c[p]))) + power(p);
    if (!out) {
      out = (!isLetter && c[p] < 0 ? MINUS : "") + body;
    } else {
      out += (!isLetter && c[p] < 0 ? ` ${MINUS} ` : " + ") + body;
    }
  }
  return out || "0";
}

/** The name a polynomial is given on the paper — always P, never f or g. */
export const NAME = "P";

/** P(x) = 2x³ − 4x + 5 */
export function statement(c) {
  return `${NAME}(x) = ${polyText(c)}`;
}

/* ── working with one ──────────────────────────────────────────────────────*/

/** The value of the polynomial at x = a. */
export function valueAt(c, a) {
  let v = 0;
  for (let p = c.length - 1; p >= 0; p--) v = v * a + c[p];
  return v;
}

/** The terms that are actually written, highest power first. */
export function termsOf(c) {
  const out = [];
  for (let p = c.length - 1; p >= 0; p--) {
    if (!c[p]) continue;
    out.push({ p, coef: c[p] });
  }
  if (!out.length) out.push({ p: 0, coef: 0 });
  return out;
}

/** 2 × 3 × 3 × 3 — the term with x swapped, spelled all the way out. */
export function swapText(coef, p, a) {
  const A = factor(a);
  if (p === 0) return num(coef);
  const chain = Array(p).fill(A).join(` ${TIMES} `);
  if (coef === 1) return chain;
  if (coef === -1) return `${MINUS}${chain}`;
  return `${num(coef)} ${TIMES} ${chain}`;
}

/** 2 × 3³ — the same thing where there is no room to spell it out. */
export function shortText(coef, p, a) {
  const A = factor(a);
  if (p === 0) return num(coef);
  const body = p === 1 ? A : `${A}${SUPS[p] || "^" + p}`;
  if (coef === 1) return body;
  if (coef === -1) return `${MINUS}${body}`;
  return `${num(coef)} ${TIMES} ${body}`;
}

/** What that term comes to. */
export function termValue(coef, p, a) {
  return coef * Math.pow(a, p);
}

/* ── the divisor ───────────────────────────────────────────────────────────*/

/**
 * The bracket, written from its ROOT rather than from its sign, because that
 * is the swap the whole method turns on: the bracket that reads "x + 2" is the
 * one whose zero is −2, and a child who writes 2 there has made the one
 * mistake this workbook exists to prevent.
 */
export function divisorText(a) {
  return a < 0 ? `x + ${Math.abs(a)}` : `x ${MINUS} ${a}`;
}

/** "(x − 3)" — the same, in the brackets it is always written in. */
export function divisor(a) {
  return `(${divisorText(a)})`;
}

/** The line a child solves in the zero box: x − 3 = 0. */
export function zeroEquation(a) {
  return `${divisorText(a)} = 0`;
}

/* ── drawing one ───────────────────────────────────────────────────────────*/

/**
 * The three levels the "how hard" dial sets. Everything is kept small on
 * purpose: this workbook is about a METHOD, and a child who loses the method
 * in the middle of multiplying 7 by 64 has not been taught the method.
 *
 *   gentle   a quadratic, everything positive to swap in, small numbers
 *   middle   a cubic, and the bracket may be (x + 2), whose zero is negative
 *   stretch  bigger coefficients, and a power may be missing from the middle
 */
export const LEVELS = {
  gentle: {
    id: "gentle", label: "Gentle — squares, and x is swapped for a positive number",
    degree: 2, coef: 3, constant: 6, roots: [1, 2, 3, 4, 5], gaps: false, cap: 45,
  },
  middle: {
    id: "middle", label: "Middle — cubes, and brackets like (x + 2)",
    degree: 3, coef: 4, constant: 9, roots: [-3, -2, -1, 1, 2, 3, 4], gaps: false, cap: 75,
  },
  stretch: {
    id: "stretch", label: "Stretch — bigger numbers, and a power may be missing",
    degree: 3, coef: 5, constant: 12,
    roots: [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5], gaps: true, cap: 110,
  },
};

export function levelOf(o) {
  return LEVELS[o.level] || LEVELS.gentle;
}

/** A polynomial at this level. */
export function drawPoly(r, o, { degree } = {}) {
  const L = levelOf(o);
  const d = degree || L.degree;
  const c = new Array(d + 1).fill(0);
  c[d] = r.int(1, L.coef); // the leading coefficient is never 0, and never negative
  for (let p = 1; p < d; p++) {
    if (L.gaps && r.chance(0.3)) { c[p] = 0; continue; }
    const m = r.int(1, L.coef);
    c[p] = r.chance(0.4) ? -m : m;
  }
  c[0] = r.int(-L.constant, L.constant);
  if (c[0] === 0) c[0] = r.int(1, L.constant); // "+ 0" is a term nobody writes
  return c;
}

/** A bracket at this level. */
export function drawRoot(r, o) {
  return r.pick(levelOf(o).roots);
}

/**
 * Brackets DEALT rather than drawn.
 *
 * There are only a handful of brackets at any level, so drawing one per
 * question independently puts (x - 2) on six questions out of eight — and a
 * page of the same bracket over and over does not practise finding the zero,
 * it practises copying the answer above. A dealer shuffles the brackets once
 * and then goes round them in order.
 *
 * `make` is always called from index 0 upwards for a given exercise (see the
 * engine), so the shuffle happens on the first question and the whole section
 * is settled by the seed — which is what the answer key depends on.
 */
export function rootDealer() {
  let order = null;
  return (r, o, i = 0) => {
    if (i === 0 || !order || !order.length) order = r.shuffle(levelOf(o).roots.slice());
    return order[i % order.length];
  };
}

/**
 * A polynomial and a bracket that go together, with the remainder kept small
 * enough to work out in a head that is busy remembering four steps. Redrawn
 * rather than repaired: a polynomial trimmed to fit an answer stops looking
 * like the ones in the book.
 */
export function drawQuestion(r, o, opts = {}) {
  const cap = opts.cap ?? levelOf(o).cap;
  let c;
  let a;
  let guard = 0;
  do {
    c = drawPoly(r, o, opts);
    a = opts.root ?? drawRoot(r, o);
    guard++;
  } while (Math.abs(valueAt(c, a)) > cap && guard < 40);
  return { c, a, value: valueAt(c, a) };
}

/**
 * A question whose remainder is exactly zero — so the bracket really is a
 * factor. Built by choosing the bracket first and bending the constant to fit,
 * which is the only term that can be changed without changing anything else.
 */
export function drawFactor(r, o, wanted = 0, root = null) {
  const L = levelOf(o);
  let c;
  let a;
  let guard = 0;
  do {
    c = drawPoly(r, o);
    a = root ?? drawRoot(r, o);
    const without = valueAt(c, a) - c[0];
    c[0] = wanted - without;
    guard++;
    /* The bent constant has to stay a number a child would meet. Redrawn
       rather than trimmed: a polynomial with 320 on the end of it does not
       look like the ones in the book, however correct it is. */
  } while (Math.abs(c[0]) > L.constant * 2 && guard < 60);
  return { c, a, value: wanted };
}
