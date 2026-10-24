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

/** The determinant of a 2 × 2 or 3 × 3, as the sum it is taught as. */
export function detExpr(m) {
  const g = m.rows;
  if (!isSquare(m)) return null;
  if (g.length === 1) return copy(g[0][0]);
  if (g.length === 2) return det2(g[0][0], g[0][1], g[1][0], g[1][1]);
  if (g.length === 3) {
    // Along the top row: a(ei − fh) − b(di − fg) + c(dh − eg)
    const minor = (j) => {
      const cols = [0, 1, 2].filter((k) => k !== j);
      return { ...det2(g[1][cols[0]], g[1][cols[1]], g[2][cols[0]], g[2][cols[1]]), paren: true };
    };
    const lead = (j) => A.prod([piece(g[0][j]), minor(j)]);
    return A.sum([lead(0), A.neg(lead(1)), lead(2)]);
  }
  return null;
}

/** The inverse, written as (1 ÷ determinant) × the matrix of cofactors turned on its side. */
export function inverseMat(m) {
  if (!isSquare(m)) return null;
  const g = m.rows, n = g.length;
  if (n !== 2 && n !== 3) return null;
  let adj;
  if (n === 2) {
    adj = A.mat([[copy(g[1][1]), A.neg(piece(g[0][1]))], [A.neg(piece(g[1][0])), copy(g[0][0])]]);
  } else {
    // Cofactor (i, j) is the 2 × 2 determinant left when row i and column j go, signed.
    const cof = (i, j) => {
      const rs = [0, 1, 2].filter((k) => k !== i), cs = [0, 1, 2].filter((k) => k !== j);
      const d = det2(g[rs[0]][cs[0]], g[rs[0]][cs[1]], g[rs[1]][cs[0]], g[rs[1]][cs[1]]);
      return (i + j) % 2 ? A.neg({ ...d, paren: true }) : d;
    };
    adj = A.mat([0, 1, 2].map((i) => [0, 1, 2].map((j) => cof(j, i))));   // transposed
  }
  return A.prod([A.frac(A.num(R.ONE), detExpr(m)), adj]);
}

/** M² as M·M, M³ as M·M·M: the power written out, ready to multiply. */
export function powerOut(m, e) {
  return A.prod(Array.from({ length: e }, () => copy(m)));
}
