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

export function evaluate(keys, { deg = true, ans = 0 } = {}) {
  const k = deg ? Math.PI / 180 : 1;
  let i = 0;
  const peek = () => keys[i];
  const startsValue = (t) => t !== undefined && (isDigit(t) || t in CONSTANTS || t === "Ans" || t in FUNCS);

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
