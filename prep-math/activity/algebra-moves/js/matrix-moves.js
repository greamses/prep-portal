/* ═══════════════════════════════════════════════════════════════════════════
   MATRIX MOVES — the rules, written the way they are taught

   Each function takes matrices (and numbers) and returns the matrix or
   expression the rule writes, WITHOUT working the entries out: adding two
   matrices writes 1 + 5 in the top-left cell, not 6, because the entry-by-entry
   addition is the lesson and "Work it out" does the sums. Every entry of every
   answer is a fresh copy, so one node never stands in two places.

   Nothing here touches the page or knows about a line of working; ops.js puts
   what these return back into the equation, and the verifier (matrix-eval.js)
   checks it by numbers before it is allowed to show.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as A from "./ast.js";
import * as R from "./rational.js";
import { copy } from "./calculus.js";

const bracketed = (n) => (n.kind === "sum" || n.kind === "neg" ? { ...n, paren: true } : n);
/** A copy of an entry, bracketed when it is made of more than one piece. */
const piece = (n) => bracketed(copy(n));
const times = (a, b) => A.prod([piece(a), piece(b)]);
const plus = (terms) => (terms.length === 1 ? terms[0] : A.sum(terms));
const flatTerms = (n) => (n.kind === "sum" && !n.paren ? n.kids.map(copy) : [copy(n)]);

export const sameSize = (a, b) => a.rows.length === b.rows.length && a.rows[0].length === b.rows[0].length;
export const isSquare = (m) => m.rows.length === m.rows[0].length;

/** A + B, or A − B: the two entries in each place written together. */
export function addMats(a, b, sign = 1) {
  return A.mat(a.rows.map((row, i) => row.map((cell, j) => {
    const other = b.rows[i][j];
    return A.sum([...flatTerms(cell), ...(sign > 0 ? flatTerms(other) : [A.neg(piece(other))])]);
  })));
}

/** k × M: every entry multiplied by k. */
export function scaleMat(k, m) {
  return A.mat(m.rows.map((row) => row.map((cell) => times(k, cell))));
}

/** M ÷ k: every entry divided by k. */
export function divideMat(m, k) {
  return A.mat(m.rows.map((row) => row.map((cell) => A.frac(copy(cell), copy(k)))));
}

/** −M: the minus goes into every entry. */
export function negateMat(m) {
  return A.mat(m.rows.map((row) => row.map((cell) => A.neg(piece(cell)))));
}

/** A × B: row i of A against column j of B, each pair multiplied, the products added. */
export function multiplyMats(a, b) {
  const [r, n] = [a.rows.length, a.rows[0].length];
  const [n2, c] = [b.rows.length, b.rows[0].length];
  if (n !== n2) return null;
  return A.mat(Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => (
    plus(Array.from({ length: n }, (_, k) => times(a.rows[i][k], b.rows[k][j])))
  ))));
}

export function transposeMat(m) {
  return A.mat(m.rows[0].map((_, j) => m.rows.map((row) => copy(row[j]))));
}

/** The 2 × 2 determinant of four entries: ad − bc. */
const det2 = (a, b, c, d) => A.sum([times(a, d), A.neg(times(b, c))]);

/** The minor of entry (i, j): the matrix left when row i and column j go. */
const minorOf = (g, i, j) => A.mat(g.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j)));

/** The determinant of a square matrix up to 4 × 4, as the sum it is taught as:
    along the top row, each entry times the determinant of what is left when its
    row and column go, the signs alternating (+ − + −). A 2 × 2 is ad − bc. */
export function detExpr(m) {
  const g = m.rows;
  if (!isSquare(m) || g.length > 4) return null;
  if (g.length === 1) return copy(g[0][0]);
  if (g.length === 2) return det2(g[0][0], g[0][1], g[1][0], g[1][1]);
  const lead = (j) => A.prod([piece(g[0][j]), { ...detExpr(minorOf(g, 0, j)), paren: true }]);
  return A.sum(g[0].map((_, j) => (j % 2 ? A.neg(lead(j)) : lead(j))));
}

/** The inverse, written as (1 ÷ determinant) × the matrix of cofactors turned on
    its side — up to 4 × 4. Each cofactor is the determinant of a minor, signed. */
export function inverseMat(m) {
  if (!isSquare(m)) return null;
  const g = m.rows, n = g.length;
  if (n < 2 || n > 4) return null;
  let adj;
  if (n === 2) {
    adj = A.mat([[copy(g[1][1]), A.neg(piece(g[0][1]))], [A.neg(piece(g[1][0])), copy(g[0][0])]]);
  } else {
    const cof = (i, j) => {
      const d = detExpr(minorOf(g, i, j));
      return (i + j) % 2 ? A.neg({ ...d, paren: true }) : d;
    };
    adj = A.mat(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => cof(j, i))));   // transposed
  }
  return A.prod([A.frac(A.num(R.ONE), detExpr(m)), adj]);
}

/** M² as M·M, M³ as M·M·M: the power written out, ready to multiply. */
export function powerOut(m, e) {
  return A.prod(Array.from({ length: e }, () => copy(m)));
}

/* ── Beyond 4 × 4 ───────────────────────────────────────────────────────────
   A cofactor sum for 5 × 5 has 120 terms and for 6 × 6, 720: nobody writes
   that out, and a page of it teaches nothing. Past 4 × 4 the matrix is worked
   by row reduction instead — exactly, in fractions — and only when its entries
   are all numbers. */

/** The rational entries of a matrix of plain numbers, or null if any entry
    still holds a letter. */
export function numbersOf(m) {
  const g = m.rows.map((row) => row.map((c) => A.exactValue(c)));
  return g.every((row) => row.every(Boolean)) ? g : null;
}

/** Gauss–Jordan on [A | I] in exact fractions: { det, inv } (inv null when
    singular). */
function reduce(g) {
  const n = g.length;
  const w = g.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? R.ONE : R.ZERO))]);
  let det = R.ONE;
  for (let i = 0; i < n; i++) {
    let p = i;
    while (p < n && R.isZero(w[p][i])) p++;
    if (p === n) return { det: R.ZERO, inv: null };
    if (p !== i) { [w[i], w[p]] = [w[p], w[i]]; det = R.neg(det); }
    const piv = w[i][i];
    det = R.mul(det, piv);
    for (let j = 0; j < 2 * n; j++) w[i][j] = R.div(w[i][j], piv);
    for (let k = 0; k < n; k++) {
      if (k === i || R.isZero(w[k][i])) continue;
      const f = w[k][i];
      for (let j = 0; j < 2 * n; j++) w[k][j] = R.sub(w[k][j], R.mul(f, w[i][j]));
    }
  }
  return { det, inv: w.map((row) => row.slice(n)) };
}

/** The determinant of a numeric square matrix of any size, as a number. */
export function detNumber(m) {
  const g = numbersOf(m);
  return g && isSquare(m) ? A.numberNode(reduce(g).det) : null;
}

/** The inverse of a numeric square matrix of any size: a matrix of numbers. */
export function inverseNumbers(m) {
  const g = numbersOf(m);
  if (!g || !isSquare(m)) return null;
  const { inv } = reduce(g);
  return inv ? A.mat(inv.map((row) => row.map((v) => A.numberNode(v)))) : null;
}
