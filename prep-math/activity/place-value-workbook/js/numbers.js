/* ============================================================================
   Place Value Workbook — numbers, and the names of the places
   ----------------------------------------------------------------------------
   Everything the workbook needs to TALK about a number: how to draw one out of
   a seeded stream (the stream itself is shared —
   /utils/components/workbook/seed.js), how to break it into places, what each
   place is called, and how to write it in figures and in words.

   The place NAMES are the one thing here that is not shared with the
   manipulatives canvas, and deliberately so. Over there a place is a shape you
   can pick up — a rod, a flat, a cube — and that naming holds in every base,
   which is exactly why it is the right naming for a board you stand blocks on.
   On a worksheet in base ten a child is being taught the words "hundreds" and
   "thousands", and printing "Flats" in the header of a place-value chart would
   teach them the wrong word. So: base ten gets the English place names, every
   other base gets the block names from the canvas (placeAt), and a chart in
   base five says "Flats" honestly, because there is no English word for
   twenty-five.
   ========================================================================== */

import { placeAt, toBase, DIGITS } from "../../base-blocks/js/config.js";

/* ── the places ───────────────────────────────────────────────────────────── */

/* Rising order, as far as any worksheet on this site reaches. */
const TEN_NAMES = [
  "Ones", "Tens", "Hundreds",
  "Thousands", "Ten Thousands", "Hundred Thousands",
  "Millions", "Ten Millions", "Hundred Millions",
];

/**
 * What the column at this power is called, in this base.
 * See the note at the top of the file for why base ten is special-cased.
 */
export function placeName(power, base) {
  if (base === 10 && power < TEN_NAMES.length) return TEN_NAMES[power];
  const p = placeAt(power);
  return power === 0 ? "Units" : p.plural;
}

/** The same, lower case, for a sentence: "the 3 is in the hundreds place". */
export function placeNameLower(power, base) {
  return placeName(power, base).toLowerCase();
}

/**
 * "1 hundred and 6 tens", not "1 hundreds and 6 tens".
 *
 * Asked about any place the paper says out loud — "3 hundreds" under a pile of
 * blocks, "to the nearest ten thousand" over in the rounding exercise — and
 * every place name here, English or block, ends in a plain s, so dropping the s
 * is the whole rule.
 */
export function placeNameFor(count, power, base) {
  const name = placeNameLower(power, base);
  return count === 1 ? name.replace(/s$/, "") : name;
}

/** What one of that place is worth, written in the working base. */
export function placeWorth(power, base) {
  return toBase(Math.pow(base, power), base);
}

/* ── writing a number down ────────────────────────────────────────────────── */

/**
 * The digits of n in the working base, LOWEST place first, padded out to
 * `places` columns. Lowest-first because that is the order the places run in —
 * index 2 is always the hundreds — and every caller that wants it printed
 * reverses it once, at the point of printing.
 */
export function digitsOf(n, base, places) {
  const out = [];
  let v = Math.max(0, Math.round(n));
  for (let i = 0; i < places; i++) {
    out.push(v % base);
    v = Math.floor(v / base);
  }
  return out;
}

/**
 * n written in the working base, with a space every three places — the
 * grouping that makes a period visible without committing to a comma or a full
 * stop, which are the decimal point in half the world each.
 */
export function figures(n, base, { group = true } = {}) {
  const s = toBase(n, base);
  if (!group || s.length < 5) return s;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += " ";
    out += s[i];
  }
  return out;
}

/* ── writing a number out in words (base ten only) ────────────────────────── */

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
  "eighty", "ninety",
];

function under1000(n) {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)];
    return n % 10 ? t + "-" + ONES[n % 10] : t;
  }
  const h = ONES[Math.floor(n / 100)] + " hundred";
  return n % 100 ? h + " and " + under1000(n % 100) : h;
}

/**
 * n in English words. Only ever asked in base ten — English has no word for
 * "one two-five" — and the exercise that asks for words says so.
 */
export function inWords(n) {
  if (n === 0) return "zero";
  const parts = [];
  const millions = Math.floor(n / 1e6);
  const thousands = Math.floor(n / 1e3) % 1000;
  const rest = n % 1000;
  if (millions) parts.push(under1000(millions) + " million");
  if (thousands) parts.push(under1000(thousands) + " thousand");
  if (rest) {
    /* "one thousand and six", not "one thousand six" — the rule that puts an
       "and" in front of a bare tens-and-ones tail after a bigger part. */
    parts.push(parts.length && rest < 100 ? "and " + under1000(rest) : under1000(rest));
  }
  return parts.join(" ");
}

/* ── drawing a number to a shape ──────────────────────────────────────────── */

/**
 * A number that fills exactly `places` columns.
 *
 * `zeros` says how willing we are to put a 0 in an inside column: at 0 the
 * number has no interior zeros at all (kindest for a first sheet), at 1 they
 * fall wherever they fall. An interior zero is the single hardest thing about
 * place value, so it is a dial and not an accident.
 *
 * Takes the whole options object and an override, so an exercise that needs a
 * zero more (or less) often than the sheet's setting can say so at the one
 * call site rather than by copying the options.
 */
export function drawNumber(r, o, over = {}) {
  const { base, places, zeros = 0.25 } = { ...o, ...over };
  const d = [];
  for (let i = 0; i < places; i++) {
    if (i === places - 1) d.push(r.int(1, base - 1)); // the leading digit is never 0
    else if (r.chance(zeros)) d.push(0);
    else d.push(r.int(1, base - 1));
  }
  let n = 0;
  for (let i = places - 1; i >= 0; i--) n = n * base + d[i];
  return n;
}

/** The digit characters of a base, for "use these digits once each". */
export function digitChars(base) {
  return DIGITS.slice(0, base).split("");
}

/** A digit as it is written in the working base (10 reads as A). */
export function digitChar(d) {
  return DIGITS[d];
}
