/* ═══════════════════════════════════════════════════════════════════════════
   EXACT RATIONALS

   Floats are banned in the value layer. A third has to stay a third, or the
   whole tool quietly lies to the student two moves later. Everything is
   BigInt over BigInt, always in lowest terms, sign always on the numerator.
   ═══════════════════════════════════════════════════════════════════════════ */

function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) { const t = a % b; a = b; b = t; }
  return a;
}

/** A rational in lowest terms. `d` is always > 0. */
export function rat(n, d = 1n) {
  n = BigInt(n);
  d = BigInt(d);
  if (d === 0n) throw new Error("rational with a zero denominator");
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d);
  return g > 1n ? { n: n / g, d: d / g } : { n, d };
}

export const ZERO = rat(0n);
export const ONE = rat(1n);

export const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => rat(a.n * b.n, a.d * b.d);
export const neg = (a) => ({ n: -a.n, d: a.d });

export function div(a, b) {
  if (b.n === 0n) throw new Error("division by zero");
  return rat(a.n * b.d, a.d * b.n);
}

/** Integer powers only — a fractional power is not a rational. */
export function ipow(a, k) {
  if (k < 0) return ipow(div(ONE, a), -k);
  let out = ONE;
  for (let i = 0; i < k; i++) out = mul(out, a);
  return out;
}

export const isZero = (a) => a.n === 0n;
export const isOne = (a) => a.n === 1n && a.d === 1n;
export const isNegative = (a) => a.n < 0n;
export const isInt = (a) => a.d === 1n;
export const same = (a, b) => a.n === b.n && a.d === b.d;
export const abs = (a) => (a.n < 0n ? neg(a) : a);

/** Only ever for the numeric verifier and for measuring — never for a value. */
export const toNumber = (a) => Number(a.n) / Number(a.d);

export function toText(a) {
  return isInt(a) ? String(a.n) : `${a.n}/${a.d}`;
}

/** "12", "2.5", "0.125" → an exact rational. */
export function fromDecimal(text) {
  const m = /^(\d*)(?:\.(\d+))?$/.exec(text);
  if (!m) throw new Error(`not a number: ${text}`);
  const whole = m[1] || "0";
  const frac = m[2] || "";
  return rat(BigInt(whole + frac), 10n ** BigInt(frac.length));
}
