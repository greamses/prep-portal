/* ═══════════════════════════════════════════════════════════════════════════
   MATRICES, BY NUMBERS

   The verifier checks a rewrite by putting numbers in for the letters and
   comparing before and after (verify.js). That works for a line of ordinary
   algebra because every piece of it comes to a number. A matrix comes to a
   grid of them, so a line with a matrix in it is evaluated here instead:
   `evalM` returns a number or { m: [[…]] }, and adds, takes away, multiplies
   (scalar × matrix, matrix × matrix), raises to a whole power, divides by a
   number, takes the determinant, the transpose and the inverse — the same
   rules a person would use, so a move that gets one wrong is caught.

   Floats are fine HERE and nowhere else: this is a check, not an answer.
   ═══════════════════════════════════════════════════════════════════════════ */

import { walk } from "./ast.js";

export const hasMatrix = (root) => { let yes = false; walk(root, (n) => { if (n.kind === "mat") yes = true; }); return yes; };

const isM = (v) => v !== null && typeof v === "object";
const map = (a, f) => ({ m: a.m.map((r) => r.map(f)) });
const dims = (a) => [a.m.length, a.m[0].length];

function add(a, b) {
  if (!isM(a) && !isM(b)) return a + b;
  if (!isM(a) || !isM(b)) return NaN;                       // a number and a matrix do not add
  const [r, c] = dims(a), [r2, c2] = dims(b);
  if (r !== r2 || c !== c2) return NaN;
  return { m: a.m.map((row, i) => row.map((x, j) => x + b.m[i][j])) };
}

function mul(a, b) {
  if (!isM(a) && !isM(b)) return a * b;
  if (!isM(a)) return map(b, (x) => a * x);
  if (!isM(b)) return map(a, (x) => x * b);
  const [r, n] = dims(a), [n2, c] = dims(b);
  if (n !== n2) return NaN;                                 // columns must match rows
  const m = Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => {
    let s = 0;
    for (let k = 0; k < n; k++) s += a.m[i][k] * b.m[k][j];
    return s;
  }));
  return { m };
}

export function det(a) {
  if (!isM(a)) return NaN;
  const [r, c] = dims(a);
  if (r !== c) return NaN;
  const go = (m) => {
    const n = m.length;
    if (n === 1) return m[0][0];
    if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    let s = 0;
    for (let j = 0; j < n; j++) {
      const minor = m.slice(1).map((row) => row.filter((_, k) => k !== j));
      s += (j % 2 ? -1 : 1) * m[0][j] * go(minor);
    }
    return s;
  };
  return go(a.m);
}

function inverse(a) {
  if (!isM(a)) return NaN;
  const [r, c] = dims(a);
  if (r !== c) return NaN;
  const d = det(a);
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return NaN;
  // Gauss–Jordan on [A | I]
  const n = r;
  const w = a.m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(w[k][i]) > Math.abs(w[p][i])) p = k;
    [w[i], w[p]] = [w[p], w[i]];
    const piv = w[i][i];
    for (let j = 0; j < 2 * n; j++) w[i][j] /= piv;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const f = w[k][i];
      for (let j = 0; j < 2 * n; j++) w[k][j] -= f * w[i][j];
    }
  }
  return { m: w.map((row) => row.slice(n)) };
}

const transpose = (a) => (isM(a) ? { m: a.m[0].map((_, j) => a.m.map((row) => row[j])) } : a);

/** The value of a node, matrices and all. `scalar` is verify.js's evalAt. */
export function evalM(node, env, scalar) {
  const go = (n) => evalM(n, env, scalar);
  switch (node.kind) {
    case "mat": return { m: node.rows.map((r) => r.map((c) => scalar(c, env))) };
    case "neg": { const v = go(node.k); return isM(v) ? map(v, (x) => -x) : -v; }
    case "sum": {
      let acc = go(node.kids[0]);
      for (const k of node.kids.slice(1)) acc = add(acc, go(k));
      return acc;
    }
    case "prod": {
      let acc = 1;
      for (const k of node.kids) acc = mul(acc, go(k));
      return acc;
    }
    case "frac": {
      const a = go(node.a), b = go(node.b);
      if (isM(b)) return NaN;
      return isM(a) ? map(a, (x) => x / b) : a / b;
    }
    case "pow": {
      const b = go(node.b);
      if (!isM(b)) return Math.pow(b, scalar(node.e, env));
      const e = scalar(node.e, env);
      if (!Number.isInteger(e)) return NaN;
      if (e === -1) return inverse(b);
      if (e < 0) { const inv = inverse(b); return isM(inv) ? powM(inv, -e) : NaN; }
      return powM(b, e);
    }
    case "fn":
      if (node.name === "det") return det(go(node.k));
      if (node.name === "transpose") return transpose(go(node.k));
      return scalar(node, env);
    default: return scalar(node, env);
  }
}

function powM(a, e) {
  if (e === 0) { const n = dims(a)[0]; return { m: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))) }; }
  let acc = a;
  for (let i = 1; i < e; i++) acc = mul(acc, a);
  return acc;
}

/** Every number in a value, in a row — a scalar is a row of one. */
export const flat = (v) => (isM(v) ? v.m.flat() : [v]);
export const subtract = (a, b) => add(a, isM(b) ? map(b, (x) => -x) : -b);
