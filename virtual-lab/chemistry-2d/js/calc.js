/* ============================================================================
   CHEMISTRY BENCH — the calculator's arithmetic
   ----------------------------------------------------------------------------
   Pure, and testable in node: no page, no eval(). An expression is a list of
   KEYS as they were pressed ("sin(", "3", "0", ")", "*", "2", "^2" …); it is
   read by a small recursive-descent parser with the precedence a scientific
   calculator has:

     postfix   x!  x%  x²  x³  x⁻¹        tightest
     power     x ^ y   (right to left, and  -2² = -4)
     sign      -x
     product   ×  ÷  nCr  nPr, and multiplication left unwritten: 2π, 3(4+1), 2sin(30)
     sum       +  −                        loosest

   evaluate(keys, { deg, ans, mem }) → a number, or throws CalcError("Math ERROR")
   or CalcError("Syntax ERROR"), the two things a calculator says.
   ========================================================================== */

export class CalcError extends Error {}
const math = () => new CalcError("Math ERROR");
const syntax = () => new CalcError("Syntax ERROR");

/** What each key is called inside an expression, and how the display writes it. */
export const SHOW = {
  "*": "×", "/": "÷", "-": "−", neg: "−", "^": "^", "^2": "²", "^3": "³", "^-1": "⁻¹",
  "sqrt(": "√(", "cbrt(": "∛(", pi: "π", e: "e", "10^(": "10^(", "e^(": "e^(", EXP: "×10^", C: "C", P: "P",
  "asin(": "sin⁻¹(", "acos(": "cos⁻¹(", "atan(": "tan⁻¹(", "abs(": "Abs(",
  NA: "Nₐ", R: "R", F: "F", Vm: "Vₘ", Vr: "Vᵣ",
};
export const show = (keys) => keys.map((k) => SHOW[k] ?? k).join("");

/** Constants a chemist reaches for. */
export const CONSTANTS = {
  pi: Math.PI, e: Math.E,
  NA: 6.02214076e23,      // Avogadro constant, per mole
  R: 8.314462618,         // molar gas constant, J/(mol K)
  F: 96485.33212,         // Faraday constant, C/mol
  Vm: 22.4,               // molar volume of a gas at s.t.p., dm3/mol
  Vr: 24,                 // … and at room temperature and pressure
};

const FUNCS = {
  "sin(": (x, k) => Math.sin(x * k), "cos(": (x, k) => Math.cos(x * k),
  "tan(": (x, k) => { const c = Math.cos(x * k); if (Math.abs(c) < 1e-15) throw math(); return Math.sin(x * k) / c; },
  "asin(": (x, k) => { if (x < -1 || x > 1) throw math(); return Math.asin(x) / k; },
  "acos(": (x, k) => { if (x < -1 || x > 1) throw math(); return Math.acos(x) / k; },
  "atan(": (x, k) => Math.atan(x) / k,
  "log(": (x) => { if (x <= 0) throw math(); return Math.log10(x); },
  "ln(": (x) => { if (x <= 0) throw math(); return Math.log(x); },
  "sqrt(": (x) => { if (x < 0) throw math(); return Math.sqrt(x); },
  "cbrt(": (x) => Math.cbrt(x),
  "abs(": (x) => Math.abs(x),
  "10^(": (x) => 10 ** x,
  "e^(": (x) => Math.exp(x),
  "(": (x) => x,
};
const isDigit = (k) => k.length === 1 && ((k >= "0" && k <= "9") || k === ".");
const whole = (x) => Math.abs(x - Math.round(x)) < 1e-9;
function factorial(x) {
  if (x < 0 || !whole(x) || x > 170) throw math();
  let f = 1;
  for (let i = 2; i <= Math.round(x); i++) f *= i;
  return f;
}
function choose(n, r, ordered) {
  if (!whole(n) || !whole(r) || r < 0 || n < r) throw math();
  n = Math.round(n); r = Math.round(r);
  let out = 1;
  if (ordered) { for (let i = 0; i < r; i++) out *= n - i; return out; }
  r = Math.min(r, n - r);
  for (let i = 1; i <= r; i++) out = (out * (n - r + i)) / i;
  return Math.round(out);
}
const ok = (x) => { if (!Number.isFinite(x)) throw math(); return x; };
/** sin(180°) should be 0, not 1.2e-16. */
const tidy = (x) => (Math.abs(x) < 1e-14 ? 0 : x);

export function evaluate(keys, { deg = true, ans = 0, vars = null } = {}) {
  const k = deg ? Math.PI / 180 : 1;
  let i = 0;
  const peek = () => keys[i];
  /* a bound variable (x, for graphing/calculus/solving) reads exactly like a
     constant while it has a value, and is a Syntax ERROR when it does not —
     typing "x" outside of GRAPH/CALC/EQN is a mistake worth saying so, not
     a silent zero */
  const startsValue = (t) => t !== undefined && (isDigit(t) || t in CONSTANTS || t === "Ans" || t in FUNCS || (vars && t in vars));

  function number() {
    let s = "";
    while (i < keys.length && isDigit(keys[i])) s += keys[i++];
    if (s === "." || (s.match(/\./g) || []).length > 1) throw syntax();
    let v = Number(s);
    if (peek() === "EXP") {
      i++;
      let sign = 1;
      if (peek() === "neg" || peek() === "-") { sign = -1; i++; } else if (peek() === "+") i++;
      let ex = "";
      while (i < keys.length && isDigit(keys[i]) && keys[i] !== ".") ex += keys[i++];
      if (!ex) throw syntax();
      v *= 10 ** (sign * Number(ex));
    }
    return v;
  }
  function primary() {
    const t = peek();
    if (t === undefined) throw syntax();
    if (isDigit(t)) return number();
    if (t in CONSTANTS) { i++; return CONSTANTS[t]; }
    if (t === "Ans") { i++; return ans; }
    if (vars && t in vars) { i++; return vars[t]; }
    if (t in FUNCS) {
      i++;
      const x = sum();
      if (peek() === ")") i++;            // a calculator closes brackets left open at the end
      else if (peek() !== undefined) throw syntax();
      return ok(tidy(FUNCS[t](x, k)));
    }
    throw syntax();
  }
  function postfix() {
    let v = primary();
    for (;;) {
      const t = peek();
      if (t === "!") { i++; v = factorial(v); }
      else if (t === "%") { i++; v /= 100; }
      else if (t === "^2") { i++; v *= v; }
      else if (t === "^3") { i++; v = v * v * v; }
      else if (t === "^-1") { i++; if (v === 0) throw math(); v = 1 / v; }
      else return ok(v);
    }
  }
  function power() {
    const base = postfix();
    if (peek() !== "^") return base;
    i++;
    const ex = signed();
    if (base < 0 && !whole(ex)) throw math();
    if (base === 0 && ex < 0) throw math();
    return ok(base ** ex);
  }
  function signed() {
    if (peek() === "neg" || peek() === "-") { i++; return -signed(); }
    if (peek() === "+") { i++; return signed(); }
    return power();
  }
  function product() {
    let v = signed();
    for (;;) {
      const t = peek();
      if (t === "*") { i++; v *= signed(); }
      else if (t === "/") { i++; const d = signed(); if (d === 0) throw math(); v /= d; }
      else if (t === "C") { i++; v = choose(v, signed(), false); }
      else if (t === "P") { i++; v = choose(v, signed(), true); }
      else if (startsValue(t)) v *= power();          // 2π, 3(4 + 1), 2sin(30)
      else return ok(v);
    }
  }
  function sum() {
    let v = product();
    for (;;) {
      const t = peek();
      if (t === "+") { i++; v += product(); }
      else if (t === "-") { i++; v -= product(); }
      else return ok(v);
    }
  }
  if (!keys.length) throw syntax();
  const out = sum();
  if (i < keys.length) throw syntax();
  return tidy(out);
}

/* ── CALCULUS AND SOLVE — all numeric, nothing symbolic ─────────────────────
   The calculator does not know what a derivative IS, only how fast a
   function is changing at a point, which is a thing it can always find by
   asking twice more, very close together — and that works on ANY `x => y`
   function, not just one built from typed keys. The same honesty runs
   through all three: an integral is a lot of thin strips added up
   (Simpson's rule), and SOLVE is the oldest trick there is — Newton's
   method from wherever the cursor already was, falling back to a scan for
   a sign change if the slope is flat or it wanders off.

   `f` is a plain `(x) => number`. A typed expression becomes one of those
   with exprFn(keys, opts); the calculator's coefficient-only modes (no
   expression ever typed — see calculator.js) write their own, straight off
   a family's formula, and call these exactly the same way. */

/** A typed expression, as the `(x) => number` the three below take. */
export const exprFn = (keys, opts) => (xv) => evaluate(keys, { ...opts, vars: { ...(opts?.vars), x: xv } });

/** d/dx at x0 — central difference, the step scaled to x0 so it works
    whether x0 is 0.0001 or 100000. */
export function derivative(f, x0) {
  const h = Math.max(1e-7, Math.abs(x0) * 1e-6);
  return ok2(tidy((f(x0 + h) - f(x0 - h)) / (2 * h)));
}

/** The definite integral from a to b — composite Simpson's rule, 200 strips
    (an even number; Simpson needs pairs of them). */
export function integral(f, a, b) {
  if (a === b) return 0;
  const N = 200;
  const h = (b - a) / N;
  let s = f(a) + f(b);
  for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return ok2(tidy((s * h) / 3));
}

/** Where f(x) = 0, starting from `guess` — Newton's method first (fast, and
    finds the root nearest the cursor, the way a real SOLVE key does), a
    scan across a wide bracket for a sign change if that does not settle. */
export function solve(f, guess) {
  let x = Number.isFinite(guess) ? guess : 0;
  for (let iter = 0; iter < 60; iter++) {
    const fx = f(x);
    if (!Number.isFinite(fx)) break;
    if (Math.abs(fx) < 1e-10) return tidy(x);
    const h = Math.max(1e-7, Math.abs(x) * 1e-6);
    const df = (f(x + h) - f(x - h)) / (2 * h);
    if (!Number.isFinite(df) || Math.abs(df) < 1e-12) break;
    const nx = x - fx / df;
    if (!Number.isFinite(nx)) break;
    if (Math.abs(nx - x) < 1e-12) return tidy(nx);
    x = nx;
  }
  const span = Math.max(50, Math.abs(guess) * 4 || 50);
  const lo = (Number.isFinite(guess) ? guess : 0) - span, hi = (Number.isFinite(guess) ? guess : 0) + span;
  const steps = 800;
  let px = lo, pf = f(lo);
  for (let i = 1; i <= steps; i++) {
    const xv = lo + ((hi - lo) * i) / steps;
    const fv = f(xv);
    if (Number.isFinite(pf) && Math.abs(pf) < 1e-10) return tidy(px);
    if (Number.isFinite(pf) && Number.isFinite(fv) && pf * fv < 0) {
      let a = px, b = xv, fa = pf;
      for (let k2 = 0; k2 < 80; k2++) {
        const m = (a + b) / 2, fm = f(m);
        if (Math.abs(fm) < 1e-12) return tidy(m);
        if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m;
      }
      return tidy((a + b) / 2);
    }
    px = xv; pf = fv;
  }
  throw new CalcError("No Solution");
}
const ok2 = (x) => { if (!Number.isFinite(x)) throw math(); return x; };

/* ── MATRICES — up to 3×3, the sizes a scientific calculator actually does ─ */

const sameSize = (A, B) => A.length === B.length && A[0].length === B[0].length;
export const matAdd = (A, B) => { if (!sameSize(A, B)) throw new CalcError("Dim ERROR"); return A.map((row, i) => row.map((v, j) => v + B[i][j])); };
export const matSub = (A, B) => { if (!sameSize(A, B)) throw new CalcError("Dim ERROR"); return A.map((row, i) => row.map((v, j) => v - B[i][j])); };
export const matScale = (A, s) => A.map((row) => row.map((v) => v * s));
export const matTranspose = (A) => A[0].map((_, j) => A.map((row) => row[j]));

export function matMul(A, B) {
  const r = A.length, k = A[0].length, c = B[0].length;
  if (k !== B.length) throw new CalcError("Dim ERROR");
  const out = Array.from({ length: r }, () => Array(c).fill(0));
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) for (let t = 0; t < k; t++) out[i][j] += A[i][t] * B[t][j];
  return out;
}

export function matDet(A) {
  const n = A.length;
  if (n !== A[0].length) throw new CalcError("Dim ERROR");
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  if (n === 3) {
    const [[a, b, c], [d, e, f], [g, h, j]] = A;
    return a * (e * j - f * h) - b * (d * j - f * g) + c * (d * h - e * g);
  }
  throw new CalcError("Dim ERROR");
}

export function matInverse(A) {
  const n = A.length;
  const det = matDet(A);
  if (Math.abs(det) < 1e-12) throw math();
  if (n === 1) return [[1 / A[0][0]]];
  if (n === 2) {
    const [[a, b], [c, d]] = A;
    return [[d / det, -b / det], [-c / det, a / det]];
  }
  const [[a, b, c], [d, e, f], [g, h, j]] = A;
  /* the matrix of cofactors, transposed (the adjugate), each divided by
     the determinant — written out rather than looped, at 3×3 it reads
     straighter than a generalised cofactor-expansion would */
  const cof = [
    [(e * j - f * h), -(b * j - c * h), (b * f - c * e)],
    [-(d * j - f * g), (a * j - c * g), -(a * f - c * d)],
    [(d * h - e * g), -(a * h - b * g), (a * e - b * d)],
  ];
  return cof.map((row) => row.map((v) => v / det));
}

/* ── ALGEBRAIC FRACTIONS — exact, never rounded to a decimal and back ──────
   A fraction kept as a numerator and a denominator stays exactly what it
   was asked to be; a decimal is already a rounding the moment it is typed.
   Every result below is reduced to its lowest terms the same way a child
   is taught to — the greatest common divisor, Euclid's algorithm — and the
   sign always lives on the numerator, never the denominator. */
const gcdInt = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { [a, b] = [b, a % b]; } return a || 1; };

/** n/d, reduced to its lowest terms with the sign on top. */
export function fracSimplify(n, d) {
  if (d === 0) throw math();
  if (n === 0) return { n: 0, d: 1 };
  const sign = d < 0 ? -1 : 1;
  n *= sign; d *= sign;
  const g = gcdInt(n, d);
  return { n: n / g, d: d / g };
}
export const fracAdd = (a, b) => fracSimplify(a.n * b.d + b.n * a.d, a.d * b.d);
export const fracSub = (a, b) => fracSimplify(a.n * b.d - b.n * a.d, a.d * b.d);
export const fracMul = (a, b) => fracSimplify(a.n * b.n, a.d * b.d);
export function fracDiv(a, b) { if (b.n === 0) throw math(); return fracSimplify(a.n * b.d, a.d * b.n); }

/** A number as a ten-digit display writes it. */
export function format(x) {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e10 || a < 1e-9) {
    let [m, ex] = x.toExponential(9).split("e");
    m = m.replace(/\.?0+$/, "");
    return `${m}×10^${Number(ex)}`.replace("-", "−").replace("^-", "^−");
  }
  let s = Number(x.toPrecision(10)).toString();
  if (s.includes("e")) s = x.toFixed(12).replace(/\.?0+$/, "");
  return s.replace("-", "−");
}

/** The S⇔D key: the nearest simple fraction, if there is one (continued fractions). */
export function fraction(x, maxDen = 9999) {
  if (!Number.isFinite(x) || whole(x) || Math.abs(x) > 1e9) return null;
  const sign = x < 0 ? -1 : 1;
  let v = Math.abs(x), h1 = 1, h0 = 0, k1 = 0, k0 = 1;
  for (let n = 0; n < 24; n++) {
    const a = Math.floor(v);
    [h1, h0] = [a * h1 + h0, h1];
    [k1, k0] = [a * k1 + k0, k1];
    if (k1 > maxDen) return null;
    if (Math.abs(Math.abs(x) - h1 / k1) < 1e-11 * Math.max(1, Math.abs(x))) return { n: sign * h1, d: k1 };
    const frac = v - a;
    if (frac < 1e-13) break;
    v = 1 / frac;
  }
  return null;
}

/** Least squares: the straight line of best fit through points [[x, y], …]. */
export function bestFit(points) {
  const n = points.length;
  if (n < 2) return null;
  const sx = points.reduce((a, p) => a + p[0], 0), sy = points.reduce((a, p) => a + p[1], 0);
  const sxx = points.reduce((a, p) => a + p[0] * p[0], 0), sxy = points.reduce((a, p) => a + p[0] * p[1], 0);
  const den = n * sxx - sx * sx;
  if (Math.abs(den) < 1e-12) return null;
  const m = (n * sxy - sx * sy) / den;
  return { m, c: (sy - m * sx) / n };
}

/** Round tick marks for an axis that has to show lo … hi. */
export function niceTicks(lo, hi, about = 6) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const raw = (hi - lo) / about, mag = 10 ** Math.floor(Math.log10(raw)), r = raw / mag;
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const out = [];
  for (let v = a; v <= b + step * 1e-6; v += step) out.push(Number(v.toPrecision(12)));
  return { ticks: out, lo: a, hi: out[out.length - 1], step };
}
