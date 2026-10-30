/* ═══════════════════════════════════════════════════════════════════════════
   Quadratic and rational inequalities, by the sign chart.

   x² − 5x + 6 < 0 is negative only between the two places it is zero, 2 and 3.
   (x − 1)/(x + 2) ≥ 0 can only change sign where the top is zero (x = 1) or the
   bottom is (x = −2, which is never allowed). So: find those critical points,
   test one value in each stretch between them, and keep the stretches that
   say what the inequality says.

   Pure and exact: the sides are read as polynomials (or one polynomial over
   another) with rational coefficients, the roots are found by the rational root
   theorem, and every sign is worked out in exact fractions — no decimals, so a
   root at 1/3 is 1/3. It answers with the pieces of the solution as data; ops.js
   turns them into lines and cards. Where a root is not a whole number or a
   fraction (x² − 2 < 0 has ±√2) it says so rather than guessing a decimal.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as R from "./rational.js";
import * as A from "./ast.js";

/* ── polynomials: arrays of rationals, index = power ───────────────────── */
const trim = (p) => { const q = [...p]; while (q.length > 1 && R.isZero(q[q.length - 1])) q.pop(); return q; };
const padd = (a, b) => trim(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => R.add(a[i] || R.ZERO, b[i] || R.ZERO)));
const pneg = (a) => a.map(R.neg);
const pmul = (a, b) => {
  const out = Array.from({ length: a.length + b.length - 1 }, () => R.ZERO);
  a.forEach((x, i) => b.forEach((y, j) => { out[i + j] = R.add(out[i + j], R.mul(x, y)); }));
  return trim(out);
};
const ppow = (a, k) => { let out = [R.ONE]; for (let i = 0; i < k; i++) out = pmul(out, a); return out; };
const pzero = (a) => a.length === 1 && R.isZero(a[0]);
const deg = (a) => a.length - 1;
const peval = (p, x) => p.reduceRight((acc, c) => R.add(R.mul(acc, x), c), R.ZERO);

/* A node as one polynomial over another — n/d — in the letter `v`, or null when it is anything else. */
function rational(node, v) {
  const poly = (p) => ({ n: p, d: [R.ONE] });
  switch (node.kind) {
    case "num": return poly([node.v]);
    case "var": return node.name === v ? poly([R.ZERO, R.ONE]) : null;
    case "neg": { const k = rational(node.k, v); return k && { n: pneg(k.n), d: k.d }; }
    case "sum": {
      let acc = poly([R.ZERO]);
      for (const kid of node.kids) {
        const k = rational(kid, v);
        if (!k) return null;
        acc = { n: padd(pmul(acc.n, k.d), pmul(k.n, acc.d)), d: pmul(acc.d, k.d) };
      }
      return acc;
    }
    case "prod": {
      let acc = poly([R.ONE]);
      for (const kid of node.kids) {
        const k = rational(kid, v);
        if (!k) return null;
        acc = { n: pmul(acc.n, k.n), d: pmul(acc.d, k.d) };
      }
      return acc;
    }
    case "frac": {
      const a = rational(node.a, v), b = rational(node.b, v);
      if (!a || !b || pzero(b.n)) return null;
      return { n: pmul(a.n, b.d), d: pmul(a.d, b.n) };
    }
    case "pow": {
      const e = A.exactValue(node.e);
      if (!e || !R.isInt(e) || e.n < 0n || e.n > 6n) return null;
      const b = rational(node.b, v);
      return b && { n: ppow(b.n, Number(e.n)), d: ppow(b.d, Number(e.n)) };
    }
    default: return null;
  }
}

/* ── rational roots ─────────────────────────────────────────────────────── */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const divisors = (n) => {
  n = n < 0n ? -n : n;
  const out = [];
  for (let i = 1n; i * i <= n && i < 100000n; i++) if (n % i === 0n) { out.push(i); if (i * i !== n) out.push(n / i); }
  return out;
};

/** Divide the polynomial by (x − r): the quotient (the remainder is zero when r is a root). */
function deflate(p, r) {
  const out = new Array(p.length - 1);
  let carry = R.ZERO;
  for (let i = p.length - 1; i >= 1; i--) { carry = R.add(p[i], R.mul(carry, r)); out[i - 1] = carry; }
  return trim(out);
}

/** Every rational root with its multiplicity, and what is left that has none — or null if it is too big to try. */
function rootsOf(p) {
  const roots = [];
  let q = trim(p);
  if (pzero(q)) return { zero: true, roots, rest: q };
  // scale to whole-number coefficients
  let lcm = 1n;
  for (const c of q) lcm = (lcm / gcd(lcm, c.d)) * c.d;
  let ints = q.map((c) => c.n * (lcm / c.d));
  if (ints.some((c) => (c < 0n ? -c : c) > 10n ** 9n)) return null;
  let guard = 0;
  while (ints.length > 1 && guard++ < 12) {
    // x = 0 first
    if (ints[0] === 0n) { roots.push(R.ZERO); ints = ints.slice(1); continue; }
    const a0 = ints[0], an = ints[ints.length - 1];
    let found = null;
    outer: for (const pnum of divisors(a0)) for (const qden of divisors(an)) for (const s of [1n, -1n]) {
      const cand = R.rat(s * pnum, qden);
      if (R.isZero(peval(ints.map((c) => R.rat(c)), cand))) { found = cand; break outer; }
    }
    if (!found) break;
    roots.push(found);
    ints = deflate(ints.map((c) => R.rat(c)), found).map((c) => c.n);   // stays whole: dividing by (x − r) when r is a root
    if (ints.length === 0) break;
  }
  return { zero: false, roots, rest: ints.map((c) => R.rat(c)) };
}

/** What is left (no rational roots) may still be zero somewhere: a quadratic with a positive discriminant
    that is not a perfect square is zero at p ± g√m. Returns those two places, [] when there are none, or null
    when what is left is beyond a quadratic. */
function surdRoots(rest) {
  if (rest.length <= 1) return [];
  if (rest.length !== 3) return null;
  const [c, b, a] = rest;
  const disc = R.sub(R.mul(b, b), R.mul(R.rat(4n), R.mul(a, c)));
  if (R.isNegative(disc) || R.isZero(disc)) return [];                 // no real root (zero would have been a rational one)
  const { out, inside } = R.squareSplit(disc.n * disc.d);               // √(n/d) = √(n·d)/d
  const g = R.div(R.rat(out, disc.d), R.mul(R.rat(2n), R.abs(a)));
  const p = R.div(R.neg(b), R.mul(R.rat(2n), a));
  const m = inside;
  const root = (sign) => ({ surd: { p, g, m, sign }, approx: R.toNumber(p) + sign * R.toNumber(g) * Math.sqrt(Number(m)) });
  return [root(-1), root(1)];
}

/* ── the chart ──────────────────────────────────────────────────────────── */
const signOf = (x) => (x.n > 0n ? 1 : x.n < 0n ? -1 : 0);

/**
 * Solve  left rel right  in one letter. Returns
 *   { error } — and why not —
 *   { all: true } / { none: true } — every number, or none —
 *   { v, pieces: [{ lo, hi, loIn, hiIn }], points: [rational], critical, note }
 * where `lo`/`hi` are rationals or null for unbounded, and a piece with lo === hi is a single point.
 */
export function solveSigns(left, right, rel) {
  const letters = [...new Set([...A.varsIn(left), ...A.varsIn(right)])];
  if (letters.length !== 1) return { error: "Sign charts need exactly one letter." };
  const v = letters[0];
  const L = rational(left, v), Rr = rational(right, v);
  if (!L || !Rr) return { error: "I can only do this when both sides are polynomials, or one polynomial over another." };
  // left − right as one fraction
  const n = padd(pmul(L.n, Rr.d), pneg(pmul(Rr.n, L.d)));
  const d = pmul(L.d, Rr.d);
  if (pzero(d)) return { error: "That has a zero on the bottom everywhere." };
  const top = rootsOf(n), bottom = rootsOf(d);
  if (!top || !bottom) return { error: "Those numbers are too big for me to factor." };
  if (bottom.zero) return { error: "That has a zero on the bottom everywhere." };
  if (top.zero) {                                            // 0 rel 0: true or false for every x
    return rel === "≤" || rel === "≥" ? { all: true } : { none: true };
  }
  const topSurds = surdRoots(top.rest), bottomSurds = surdRoots(bottom.rest);
  if (!topSurds || !bottomSurds) return { error: "That is more than a quadratic once the whole-number and fraction roots are taken out, so I will not guess where it is zero." };
  const uniq = (rs) => rs.filter((r, i) => rs.findIndex((s) => R.same(r, s)) === i);
  const zerosTop = uniq(top.roots), zerosBottom = uniq(bottom.roots);
  // every place it can change sign: { rat } or { surd }, with a number to sort by, and whether it is on the bottom
  const crit = (r, onBottom) => ({ rat: r, approx: R.toNumber(r), onBottom });
  const all = [
    ...uniq([...top.roots, ...bottom.roots]).map((r) => crit(r, zerosBottom.some((z) => R.same(z, r)))),
    ...topSurds.map((s) => ({ ...s, onBottom: false })),
    ...bottomSurds.map((s) => ({ ...s, onBottom: true })),
  ];
  const critical = all.sort((a, b) => a.approx - b.approx);
  const isBottom = (c) => c.onBottom;
  const toRat = (x) => R.rat(BigInt(Math.round(x * 1e6)), 1000000n);
  const valueAt = (x) => {
    const num = peval(n, x), den = peval(d, x);
    return R.isZero(den) ? null : R.div(num, den);
  };
  const strict = rel === "<" || rel === ">";
  const wants = (val) => (rel === "<" ? signOf(val) < 0 : rel === ">" ? signOf(val) > 0 : rel === "≤" ? signOf(val) <= 0 : signOf(val) >= 0);

  // stretches between critical points, each tested at one value inside it
  const cuts = critical;
  const sample = (i) => {
    if (!cuts.length) return R.ZERO;
    if (i === 0) return toRat(cuts[0].approx - 1);
    if (i === cuts.length) return toRat(cuts[cuts.length - 1].approx + 1);
    return toRat((cuts[i - 1].approx + cuts[i].approx) / 2);
  };
  const elements = [];                                      // stretch, point, stretch, point, …
  for (let i = 0; i <= cuts.length; i++) {
    const val = valueAt(sample(i));
    elements.push({ kind: "stretch", lo: i === 0 ? null : cuts[i - 1], hi: i === cuts.length ? null : cuts[i], in: val !== null && wants(val) });
    if (i < cuts.length) {
      const c = cuts[i];
      elements.push({ kind: "point", at: c, in: !isBottom(c) && !strict && wants(R.ZERO) });
    }
  }
  // merge neighbouring kept elements into pieces
  const pieces = [];
  let cur = null;
  for (const el of elements) {
    if (!el.in) { if (cur) { pieces.push(cur); cur = null; } continue; }
    const lo = el.kind === "stretch" ? el.lo : el.at, hi = el.kind === "stretch" ? el.hi : el.at;
    if (!cur) cur = { lo, hi, loIn: el.kind === "point", hiIn: el.kind === "point", single: el.kind === "point" };
    else { cur.hi = hi; cur.hiIn = el.kind === "point"; cur.single = false; }
    if (el.kind === "stretch" && cur.lo === undefined) cur.lo = el.lo;
  }
  if (cur) pieces.push(cur);
  // a stretch that follows a kept point starts at that point; tidy the flags
  for (const p of pieces) {
    if (p.lo === null) p.loIn = false;
    if (p.hi === null) p.hiIn = false;
  }
  if (!pieces.length) return { none: true };
  if (pieces.length === 1 && pieces[0].lo === null && pieces[0].hi === null) return { all: true };

  // the answer, checked against the inequality at many points before it is trusted
  const inPieces = (x) => pieces.some((p) => {
    const xv = R.toNumber(x);
    const aboveLo = p.lo === null || (p.loIn ? xv >= p.lo.approx - 1e-12 : xv > p.lo.approx + 1e-12);
    const belowHi = p.hi === null || (p.hiIn ? xv <= p.hi.approx + 1e-12 : xv < p.hi.approx - 1e-12);
    return aboveLo && belowHi;
  });
  for (let k = -90; k <= 90; k++) {
    const x = R.rat(BigInt(k), 7n);
    const val = valueAt(x);
    const truth = val !== null && wants(val);
    if (truth !== inPieces(x)) return { error: "I could not check that answer, so I will not give it." };
  }
  const word = (c) => (c.rat ? `${v} = ${R.toText(c.rat)}` : `${v} = ${c.approx.toFixed(3)}…`);
  const cuttingText = critical.map(word).join(", ");
  return { v, pieces, critical, zerosTop, zerosBottom, note: critical.length ? `It can only change sign at ${cuttingText}` : "It never changes sign" };
}
