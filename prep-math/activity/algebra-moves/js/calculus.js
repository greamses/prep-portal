/* ═══════════════════════════════════════════════════════════════════════════
   CALCULUS AND TRIGONOMETRY

   One rule per step, the way it is written out by hand. d/dx of a sum is
   taken term by term first, and only then is each term differentiated; a
   number in front comes out before the power rule is used; the chain rule
   leaves its d/dx(inside) on the line for the next tap. Each function here
   takes ONE node (a d/dx, an ∫, a lim, a sin) and returns what replaces it,
   or null when its rule does not apply. ops.js turns them into moves, and
   every move still goes through the verifier: a derivative is checked as a
   central difference, an integral by Simpson's rule, a limit from both sides.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as A from "./ast.js";
import * as R from "./rational.js";
import { numericValue } from "./verify.js";

const n = (k) => A.num(R.rat(BigInt(k)));
const ONE = () => n(1);
const bare = (x) => (x && x.paren ? { ...x, paren: false } : x);
const isNum = (x, v) => { const e = A.exactValue(x); return !!e && R.same(e, R.rat(BigInt(v))); };

/** A copy with fresh ids, so one node can be written in two places. */
export function copy(node) {
  return JSON.parse(JSON.stringify(node, (k, v) => (typeof v === "bigint" ? `__big${v}` : v)), (k, v) => {
    if (typeof v === "string" && v.startsWith("__big")) return BigInt(v.slice(5));
    if (k === "id") return A.freshId();
    return v;
  });
}

/** Does `node` change when `x` does? The letter of a definite integral or a
    limit is used up inside it, so ∫ from 0 to 1 of x² dx does not. */
export function freeOf(node, x) {
  let hit = false;
  const visit = (m) => {
    if (hit || !m) return;
    if (m.kind === "var" && m.name === x) { hit = true; return; }
    if ((m.kind === "int" && m.lo && m.x === x) || (m.kind === "lim" && m.x === x)) {
      if (m.kind === "int") { visit(m.lo); visit(m.hi); } else visit(m.to);
      return;
    }
    for (const k of A.kidsOf(m)) visit(k);
  };
  visit(node);
  return !hit;
}

/** Every x in `node` swapped for a copy of `by`. */
export const substVar = (node, x, by) => copy(swapVar(node, x, by));
function swapVar(node, x, by) {
  const visit = (m) => {
    if (m.kind === "var" && m.name === x) return { ...copy(by), paren: by.kind === "sum" || by.kind === "neg" };
    const out = { ...m };
    for (const key of ["k", "a", "b", "e", "l", "r", "lo", "hi", "to"]) if (m[key]) out[key] = visit(m[key]);
    if (m.kids) out.kids = m.kids.map(visit);
    return out;
  };
  return visit(node);
}

const isX = (u, x) => { const b = bare(u); return b.kind === "var" && b.name === x; };
/** c·x for a plain number c: the one inner function the integrals undo by dividing. */
function linearCoef(u, x) {
  const b = bare(u);
  if (isX(b, x)) return R.ONE;
  if (b.kind === "prod" && b.kids.length === 2) {
    const [p, q] = b.kids;
    const c = A.exactValue(p);
    if (c && isX(q, x) && !R.isZero(c)) return c;
  }
  return null;
}

/** n·x^(n−1), written the way a person would: 3x², 2x, 1. */
function powerDown(base, e) {
  const m = R.sub(e, R.ONE);
  if (R.isZero(m)) return A.numberNode(e);
  const p = R.isOne(m) ? copy(base) : A.pow(copy(base), A.numberNode(m));
  return R.isOne(e) ? p : A.prod([A.numberNode(e), p]);
}

/* ── d/dx ───────────────────────────────────────────────────────────────── */

/** One step of differentiating `D` (a deriv node). { node, rule } or null. */
export function diffStep(D) {
  const x = D.x;
  const k = bare(D.k);
  const d = (u) => A.deriv(copy(bare(u)), x);
  const chain = (outer, u) => (isX(u, x) ? outer : A.prod([outer, d(u)]));

  if (freeOf(k, x)) return { node: n(0), rule: "The slope of a constant is 0" };
  if (isX(k, x)) return { node: ONE(), rule: `The slope of ${x} is 1` };

  if (k.kind === "sum") {
    const kids = k.kids.map((t) => (t.kind === "neg" && !t.paren ? A.neg(d(t.k)) : d(t)));
    return { node: A.sum(kids), rule: "Differentiate term by term" };
  }
  if (k.kind === "neg") return { node: A.neg(d(k.k)), rule: "The minus sign waits outside" };

  if (k.kind === "prod") {
    const fixed = k.kids.filter((f) => freeOf(f, x));
    const moving = k.kids.filter((f) => !freeOf(f, x));
    const pack = (fs) => (fs.length === 1 ? copy(fs[0]) : A.prod(fs.map(copy)));
    if (fixed.length) return { node: A.prod([...fixed.map(copy), d(pack(moving))]), rule: "A number in front waits outside" };
    // The product rule: u·v′ + v·u′.
    const u = moving[0], v = pack(moving.slice(1));
    return { node: A.sum([A.prod([copy(u), d(v)]), A.prod([copy(v), d(u)])]), rule: "The product rule: u·dv/dx + v·du/dx" };
  }

  if (k.kind === "frac") {
    if (freeOf(k.b, x)) return { node: A.frac(d(k.a), copy(k.b)), rule: "The bottom is a number, so it waits outside" };
    // The quotient rule: (v·u′ − u·v′)/v².
    const u = k.a, v = k.b;
    return {
      node: A.frac(A.sum([A.prod([copy(v), d(u)]), A.neg(A.prod([copy(u), d(v)]))]), A.pow(copy(v), n(2))),
      rule: "The quotient rule: (v·du/dx − u·dv/dx)/v²",
    };
  }

  if (k.kind === "pow") {
    const e = A.exactValue(k.e);
    if (e && !freeOf(k.b, x)) {
      const outer = powerDown(k.b, e);
      return { node: chain(outer, k.b), rule: isX(k.b, x) ? "The power rule: bring the power down, take one off" : "The chain rule, with the power rule outside" };
    }
    // e to the u.
    if (bare(k.b).kind === "const" && bare(k.b).name === "e" && freeOf(k.b, x)) {
      return { node: chain(copy(k), k.e), rule: isX(k.e, x) ? "eˣ is its own slope" : "The chain rule: eᵘ times du/dx" };
    }
    return null;
  }

  if (k.kind === "root") {
    const outer = A.frac(ONE(), A.prod([n(2), A.root(copy(k.k))]));
    return { node: isX(k.k, x) ? outer : A.frac(d(k.k), A.prod([n(2), A.root(copy(k.k))])), rule: "√u is u to the half: 1/(2√u) times du/dx" };
  }

  if (k.kind === "fn") {
    const u = k.k;
    const f = (name) => A.fn(name, copy(u));
    let outer;
    switch (k.name) {
      case "sin": outer = f("cos"); break;
      case "cos": outer = A.neg(f("sin")); break;
      case "tan": outer = A.frac(ONE(), A.pow(f("cos"), n(2))); break;
      case "ln":  return { node: isX(u, x) ? A.frac(ONE(), copy(u)) : A.frac(d(u), copy(bare(u))), rule: "The slope of ln u is 1/u times du/dx" };
      case "log": return { node: A.frac(isX(u, x) ? ONE() : d(u), A.prod([copy(bare(u)), A.fn("ln", n(10))])), rule: "log u is ln u ÷ ln 10" };
      default:    return null;
    }
    const rule = { sin: "The slope of sin is cos", cos: "The slope of cos is −sin", tan: "The slope of tan is 1/cos²" }[k.name];
    if (isX(u, x)) return { node: outer, rule };
    // −sin(u)·u′ keeps its minus in front.
    return { node: outer.kind === "neg" ? A.neg(A.prod([outer.k, d(u)])) : A.prod([outer, d(u)]), rule: `${rule}, then the chain rule` };
  }
  return null;
}

/* ── ∫ dx ───────────────────────────────────────────────────────────────── */

/** An antiderivative of `k` in `x` in ONE rule, or null — what the last step
    of an integral is (and what a definite integral needs before its limits
    go in). */
function antiderivative(k0, x) {
  const k = bare(k0);
  if (freeOf(k, x)) return { node: isNum(k, 1) ? A.vr(x) : A.prod([copy(k), A.vr(x)]), rule: "A constant integrates to itself times " + x };
  if (isX(k, x)) return { node: A.frac(A.pow(A.vr(x), n(2)), n(2)), rule: `${x} integrates to ${x}²/2` };
  if (k.kind === "pow" && isX(k.b, x)) {
    const e = A.exactValue(k.e);
    if (!e) return null;
    if (R.same(e, R.rat(-1n))) return { node: A.fn("ln", A.vr(x)), rule: "x to the −1 integrates to ln x" };
    const up = R.add(e, R.ONE);
    // x^(p/q)/(p/q) is written q·x^(p/q)/p.
    const top = A.pow(A.vr(x), A.numberNode(up));
    const node = R.isInt(up) ? A.frac(top, A.numberNode(up))
      : A.frac(A.prod([A.num(R.rat(up.d)), top]), A.num(R.rat(up.n)));
    return { node, rule: "The power rule backwards: add one to the power, divide by the new power" };
  }
  if (k.kind === "frac" && isNum(k.a, 1) && isX(k.b, x)) return { node: A.fn("ln", A.vr(x)), rule: "1/x integrates to ln x" };
  if (k.kind === "pow" && bare(k.b).kind === "const" && bare(k.b).name === "e") {
    const c = linearCoef(k.e, x);
    if (!c) return null;
    return { node: R.isOne(c) ? copy(k) : A.frac(copy(k), A.numberNode(c)), rule: "eᵘ integrates to itself (divided by what multiplies x)" };
  }
  if (k.kind === "fn" && (k.name === "sin" || k.name === "cos")) {
    const c = linearCoef(k.k, x);
    if (!c) return null;
    const F = k.name === "sin" ? A.neg(A.fn("cos", copy(k.k))) : A.fn("sin", copy(k.k));
    const scaled = R.isOne(c) ? F : F.kind === "neg" ? A.neg(A.frac(F.k, A.numberNode(c))) : A.frac(F, A.numberNode(c));
    return { node: scaled, rule: k.name === "sin" ? "sin integrates to −cos" : "cos integrates to sin" };
  }
  return null;
}

/** One step of integrating `I` (an int node): split a sum, take a number out,
    rewrite √x or 1/xⁿ as a power, or — when the inside is one rule away —
    integrate. { node, rule, done } where `done` means an ∫ has gone. */
export function intStep(I) {
  const x = I.x;
  const k = bare(I.k);
  const again = (body) => A.integ(copy(bare(body)), x, I.lo && copy(I.lo), I.hi && copy(I.hi));

  if (k.kind === "sum") {
    const kids = k.kids.map((t) => (t.kind === "neg" && !t.paren ? A.neg(again(t.k)) : again(t)));
    return { node: A.sum(kids), rule: "Integrate term by term" };
  }
  if (k.kind === "neg") return { node: A.neg(again(k.k)), rule: "The minus sign waits outside" };
  if (k.kind === "prod") {
    const fixed = k.kids.filter((f) => freeOf(f, x));
    const moving = k.kids.filter((f) => !freeOf(f, x));
    if (fixed.length && moving.length) {
      const body = moving.length === 1 ? moving[0] : A.prod(moving.map(copy));
      return { node: A.prod([...fixed.map(copy), again(body)]), rule: "A number in front waits outside" };
    }
  }
  if (k.kind === "frac" && freeOf(k.b, x) && !isNum(k.a, 1)) {
    return { node: A.frac(again(k.a), copy(k.b)), rule: "The bottom is a number, so it waits outside" };
  }
  if (k.kind === "root" && isX(k.k, x)) {
    return { node: again(A.pow(A.vr(x), A.numberNode(R.rat(1n, 2n)))), rule: "√x is x to the power ½" };
  }
  if (k.kind === "frac" && isNum(k.a, 1) && bare(k.b).kind === "pow" && isX(bare(k.b).b, x)) {
    const e = A.exactValue(bare(k.b).e);
    if (e) return { node: again(A.pow(A.vr(x), A.numberNode(R.neg(e)))), rule: "1 over xⁿ is x to the −n" };
  }

  const F = antiderivative(k, x);
  if (!F) return null;
  if (!I.lo) return { node: F.node, rule: F.rule, done: true };
  // A definite integral: F(top) − F(bottom), written out for the next tap.
  const at = (lim) => {
    const v = substVar(F.node, x, lim);
    return v.kind === "sum" || v.kind === "neg" ? { ...v, paren: true } : v;
  };
  const lower = at(I.lo);
  return {
    node: A.sum([at(I.hi), A.neg(lower.kind === "neg" ? { ...lower, paren: true } : lower)]),
    rule: `${F.rule}, then the top limit take the bottom one`,
    definite: true,
  };
}

/* ── lim ────────────────────────────────────────────────────────────────── */

/** Let h go to where it is going: only when that gives a number, which is
    exactly what the 0/0 of first principles does not. */
export function limitStep(L) {
  const put = substVar(bare(L.k), L.x, L.to);
  // Checked at made-up values of every other letter: a 0 on the bottom is NaN.
  const probe = A.varsIn(put).reduce((acc, v) => substVar(acc, v, A.numberNode(R.rat(7n, 5n))), put);
  if (!Number.isFinite(numericValue(probe))) return null;
  return { node: put, rule: `Now ${L.x} can go to ${A.exactValue(L.to) ? R.toText(A.exactValue(L.to)) : "its value"}` };
}

/* ── Exact trig ─────────────────────────────────────────────────────────── */

const HALF = () => A.frac(ONE(), n(2));
const SURD_HALF = (k) => A.frac(A.root(n(k)), n(2));
const SIN = [() => n(0), HALF, () => SURD_HALF(2), () => SURD_HALF(3), ONE];      // 0, 30, 45, 60, 90
const TAN = [() => n(0), () => A.frac(A.root(n(3)), n(3)), ONE, () => A.root(n(3)), null];
const REF = { 0: 0, 30: 1, 45: 2, 60: 3, 90: 4 };

/** The angle a trig function's argument names, in whole degrees, or null. */
function degreesOf(u) {
  const v = numericValue(u);
  if (!Number.isFinite(v)) return null;
  const d = (v * 180) / Math.PI;
  const r = Math.round(d);
  return Math.abs(d - r) < 1e-9 && r % 15 === 0 ? r : null;
}

/** sin 30° is ½, cos 45° is √2/2, tan 60° is √3 — from the special triangles,
    with the sign from the quadrant. */
export function exactTrig(F) {
  if (F.kind !== "fn" || !["sin", "cos", "tan"].includes(F.name)) return null;
  const a0 = degreesOf(F.k);
  if (a0 === null) return null;
  const a = ((a0 % 360) + 360) % 360;
  const quad = a <= 90 ? 1 : a <= 180 ? 2 : a <= 270 ? 3 : 4;
  const ref = quad === 1 ? a : quad === 2 ? 180 - a : quad === 3 ? a - 180 : 360 - a;
  if (!(ref in REF)) return null;
  const i = REF[ref];
  let make, positive;
  if (F.name === "sin") { make = SIN[i]; positive = quad <= 2; }
  else if (F.name === "cos") { make = SIN[4 - i]; positive = quad === 1 || quad === 4; }
  else { make = TAN[i]; positive = quad === 1 || quad === 3; }
  if (!make) return null;               // tan 90° has no value
  let node = make();
  const zero = isNum(node, 0);
  if (!positive && !zero) node = A.neg(node);
  return { node, rule: `${F.name} ${a0}° from the special triangles` };
}

/** tan u = sin u / cos u. */
export const tanAsRatio = (F) =>
  F.kind === "fn" && F.name === "tan"
    ? { node: A.frac(A.fn("sin", copy(F.k)), A.fn("cos", copy(F.k))), rule: "tan is sin over cos" }
    : null;

/** sin²u and cos²u of the same u, both in one list of terms: the indexes of the pair, or null. */
export function pythagoreanPair(terms) {
  const sq = (t, name) => {
    const b = bare(t);
    return b.kind === "pow" && isNum(b.e, 2) && bare(b.b).kind === "fn" && bare(b.b).name === name ? A.shapeKey(bare(b.b).k) : null;
  };
  for (let i = 0; i < terms.length; i++) {
    const s = sq(terms[i], "sin");
    if (!s) continue;
    const j = terms.findIndex((t) => sq(t, "cos") === s);
    if (j >= 0) return [i, j];
  }
  return null;
}

/** sin⁻¹(½) is 30° (or π/6 when the working is in radians): the special
    triangles read backwards. */
export function exactInverse(F, degrees) {
  const f = { arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan }[F.kind === "fn" ? F.name : ""];
  if (!f) return null;
  const v = numericValue(F.k);
  if (!Number.isFinite(v)) return null;
  const d = (f(v) * 180) / Math.PI;
  const a = Math.round(d);
  if (Math.abs(d - a) > 1e-9 || a % 15 !== 0) return null;
  const face = { arcsin: "sin⁻¹", arccos: "cos⁻¹", arctan: "tan⁻¹" }[F.name];
  if (degrees) return { node: A.deg(A.numberNode(R.rat(BigInt(a)))), rule: `${face} from the special triangles: ${a}°` };
  if (a === 0) return { node: n(0), rule: `${face} from the special triangles: 0` };
  const q = R.rat(BigInt(a), 180n);
  const p = q.n < 0n ? -q.n : q.n;
  const top = p === 1n ? A.cnst("π") : A.prod([A.num(R.rat(p)), A.cnst("π")]);
  const body = q.d === 1n ? top : A.frac(top, A.num(R.rat(q.d)));
  return { node: q.n < 0n ? A.neg(body) : body, rule: `${face} from the special triangles` };
}
