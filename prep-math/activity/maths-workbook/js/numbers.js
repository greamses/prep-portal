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

/* ── periods, and numbers too big to be numbers ────────────────────────────
   English reads a long number in PERIODS of three figures: it says the three
   figures, then the period's name, and moves on. That is the whole of reading
   a big number, and it is why this file works in DIGIT STRINGS from here down.

   It has to. The quadrillions period ends at eighteen figures, and a plain
   JavaScript number stops being exact at 9 007 199 254 740 991 — sixteen. A
   number past that would come back off the page as a different number, which
   on a place-value sheet is the one mistake that cannot be allowed. A string
   of digits is exact however long it is. */

export const PERIODS = ["", "thousand", "million", "billion", "trillion", "quadrillion"];

/** As many figures as this workbook will write: six periods of three. */
export const MAX_FIGURES = PERIODS.length * 3;

/** Just the figures, with any leading noughts taken off. */
export function onlyDigits(s) {
  const t = String(s ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return t || "0";
}

/** A digit string cut into its periods, biggest first: "1234567" → ["1","234","567"]. */
export function periodsOf(s) {
  const t = onlyDigits(s);
  const out = [];
  for (let end = t.length; end > 0; end -= 3) out.unshift(t.slice(Math.max(0, end - 3), end));
  return out;
}

/** A digit string with a space every three figures, counted from the right. */
export function groupDigits(s) {
  return periodsOf(s).join(" ");
}

/** The name of the period a place belongs to — place 0 is the ones. */
export function periodName(power) {
  return PERIODS[Math.floor(power / 3)] || "";
}

/**
 * A digit string in English words, exact at any length up to the quadrillions.
 *
 * One rule per period and one rule at the end: a period whose three figures are
 * all noughts is not said at all (that is what makes "two million and six" so
 * much harder to read than it looks), and a bare tens-and-ones tail after
 * anything bigger takes an "and" in front of it.
 */
export function wordsOf(s) {
  const t = onlyDigits(s);
  if (t === "0") return "zero";
  const chunks = periodsOf(t);
  const top = chunks.length - 1;
  const parts = [];
  chunks.forEach((c, i) => {
    const v = Number(c);
    const p = top - i;                     // which period this chunk is
    if (!v) return;                        // an empty period is not said
    if (p) parts.push(`${under1000(v)} ${PERIODS[p]}`);
    else parts.push(parts.length && v < 100 ? "and " + under1000(v) : under1000(v));
  });
  return parts.join(" ");
}

/**
 * n in English words. Only ever asked in base ten — English has no word for
 * "one two-five" — and the exercise that asks for words says so.
 */
export function inWords(n) {
  return wordsOf(String(Math.round(n)));
}

/**
 * A digit string of exactly `figures` figures, drawn off the seeded stream.
 *
 * The same two dials `drawNumber` has — the leading figure is never a nought,
 * and `zeros` says how willing we are to put one inside — plus one this needs
 * and that does not: `hole` empties a whole period, which is the shape that
 * makes a long number hard to read and hard to write down.
 */
export function drawDigits(r, figures, { zeros = 0.25, hole = 0 } = {}) {
  const d = [];
  for (let i = 0; i < figures; i++) {
    if (i === 0) d.push(r.int(1, 9));
    else d.push(r.chance(zeros) ? 0 : r.int(1, 9));
  }
  if (hole && figures > 6) {
    /* A whole period of noughts, never the biggest one (that would just make
       a shorter number) and never the ones (that is an easier shape). */
    const periods = Math.ceil(figures / 3);
    const which = r.int(1, periods - 2);            // counted from the ones end
    const end = figures - which * 3;
    for (let i = Math.max(0, end - 3); i < end; i++) d[i] = 0;
  }
  return d.join("");
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
