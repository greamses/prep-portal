/* ============================================================================
   THE WRITTEN BOARDS — numbers, written and read back
   ----------------------------------------------------------------------------
   The three boards (long division, column addition, column multiplication) all
   work in whatever base they are set to, and all of them now take numbers with
   a point in them. Both of those are the same idea and this is where it lives.

   ── a number is a whole count and a number of places ──────────────────────
   Nothing here is ever a floating-point number. `2.75` is kept as `{ n: 275,
   dp: 2 }`: two hundred and seventy-five of the things that two places after
   the point counts in. Every sum is then done in whole numbers — which is the
   whole trick of decimal arithmetic on paper, and the thing a child is being
   shown: line the points up, forget the point, put it back at the end.

   It is also the only way this can stay base-agnostic. In base five, 2.3₅ is
   two and three fifths; as `{ n: 13, dp: 1 }` it is thirteen fifths, and every
   rule below is the same rule it is in base ten.
   ========================================================================== */

export const DIGITS = "0123456789AB";

/** Write a whole count in the working base. */
export function toBase(n, base) {
  if (n === 0) return "0";
  let s = "";
  let v = Math.abs(Math.round(n));
  while (v > 0) {
    s = DIGITS[v % base] + s;
    v = Math.floor(v / base);
  }
  return s;
}

/**
 * Read a whole number WRITTEN in the working base back into a plain count.
 *
 * Strict on purpose: null for anything that is not a whole number in this base,
 * so typing 8 into a base-five sum is refused rather than quietly taken as
 * eight. A slip of the finger looks the same as the misunderstanding, and the
 * boards that use this exist to catch the misunderstanding.
 */
export function fromBase(text, base) {
  const s = String(text ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!s) return null;
  let n = 0;
  for (const ch of s) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) return null;
    n = n * base + d;
  }
  return n;
}

/** Spoken name of a base, for labels like "base five". */
const BASE_WORDS = [
  "", "", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve",
];
export function baseWord(base) {
  return BASE_WORDS[base] || String(base);
}

/* ── numbers with a point in them ─────────────────────────────────────────── */

/** base to the power p, as a whole count. */
export function pow(base, p) {
  let v = 1;
  for (let k = 0; k < p; k++) v *= base;
  return v;
}

/**
 * Read a number that may have a point in it: "2.75", ".5", "40".
 * Returns `{ n, dp }` — the value is n / base^dp — or null if it is not a
 * number in this base.
 */
export function readNum(text, base) {
  const s = String(text ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!s) return null;
  const bits = s.split(".");
  if (bits.length > 2) return null;
  const whole = bits[0] === "" ? "0" : bits[0];
  const part = bits.length === 2 ? bits[1] : "";
  if (bits.length === 2 && part === "") return null;   // "2." is half a number
  const a = fromBase(whole, base);
  if (a === null) return null;
  if (!part) return { n: a, dp: 0 };
  const b = fromBase(part, base);
  if (b === null) return null;
  return { n: a * pow(base, part.length) + b, dp: part.length };
}

/**
 * How a number is written on a board. A number with places always shows a
 * figure before the point — 0.25, never .25 — because the column the 0 stands
 * in is a column of the sum and leaving it blank loses it.
 */
export function writeNum(n, dp = 0, base = 10) {
  if (!dp) return toBase(n, base);
  const s = toBase(n, base).padStart(dp + 1, "0");
  return `${s.slice(0, s.length - dp)}.${s.slice(s.length - dp)}`;
}

/** The same value written to `dp` places — only ever used to ADD places. */
export function scale(n, dp, to, base) {
  return to >= dp ? n * pow(base, to - dp) : Math.round(n / pow(base, dp - to));
}

/** The same value with any noughts on the end of the point taken off. */
export function trim(n, dp, base) {
  let v = n;
  let p = dp;
  while (p > 0 && v % base === 0) { v /= base; p -= 1; }
  return { n: v, dp: p };
}

/** The digits of a whole count in `base`, biggest place first. */
export function digitsOf(n, base) {
  return [...toBase(n, base)].map((d) => DIGITS.indexOf(d));
}
