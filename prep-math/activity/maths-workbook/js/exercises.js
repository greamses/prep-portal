/* ============================================================================
   Maths Workbook — the ONE registry
   ----------------------------------------------------------------------------
   Seven families, one list, and a CHAPTER each — the paper is built and picked
   from a chapter at a time, the way the Geometry Workbook is. The engine, the
   builder and the answer key all read
   this file and nothing else; the families live beside it only because eight
   hundred lines of exercises in one file is a file nobody edits.

     ex-place.js       place value — blocks, charts, the number on its own
     ex-words.js       saying a number, and words ⇄ figures to the quadrillions
     ex-sums.js        adding and taking away, with and without regrouping
     ex-remainder.js   dividing, what is left over, and fraction bars
     ex-fractions.js   what a fraction is, and adding the ones that match
     ex-time.js        counting in fives, and then telling the time
     ex-multiply.js    multiplying, from equal groups up to long multiplication
     ex-bases.js       number bases: place values, to and from base ten,
                       adding and taking away in a base, base to base
     ex-models.js      the Singapore bar model: part–whole, comparison, part
                       to part, part to whole, and word problems drawn by hand
     ex-primes.js      what a number is MADE of: grouping blocks, primes and
                       composites, factors, factor trees, the ladder, and the
                       index form that counts a number's factors for you

   THE GEOMETRY IS NOT HERE. Naming and measuring angles moved to the Geometry
   Workbook — it is geometry, and a child looking for angles should find them in
   one book, not two. Multiplying takes the chapter number it left behind.

   THE ORDER OF THE FAMILIES IS THE ORDER OF THE YEARS. A child works out what
   a number IS before they add two of them; adds before they share out; shares
   out before the leftover becomes a fraction. Counting in fives sits directly
   in front of telling the time because it is the whole of it.
   The letters printed on the paper follow this list, so section A is always
   the earliest thing on the sheet.

   ONE DIAL IS SHARED AND ONE IS NOT. "How much help" and "how hard" mean the
   same thing to every family. The BASE does not: a chart of thousands is a
   real idea in base five, and "three fifths" is not — there is no such word.
   So everything outside place value says `tenOnly`, and switches itself off,
   in writing, the moment the base moves off ten.
   ========================================================================== */

import { PLACE_GROUPS, PLACE_EXERCISES, placesFor } from "./ex-place.js";
import { WORD_GROUPS, WORD_EXERCISES } from "./ex-words.js";
import { SUM_GROUPS, SUM_EXERCISES } from "./ex-sums.js";
import { REM_GROUPS, REM_EXERCISES } from "./ex-remainder.js";
import { PVDIV_EXERCISES } from "./ex-pvdiv.js";
import { FRAC_GROUPS, FRAC_EXERCISES } from "./ex-fractions.js";
import { TIME_GROUPS, TIME_EXERCISES } from "./ex-time.js";
import { MUL_GROUPS, MUL_EXERCISES } from "./ex-multiply.js";
import { PRIME_GROUPS, PRIME_EXERCISES } from "./ex-primes.js";
import { MODEL_GROUPS, MODEL_EXERCISES } from "./ex-models.js";
import { NB_GROUPS, NB_EXERCISES } from "./ex-bases.js";
import { MONEY_GROUPS, MONEY_EXERCISES } from "./ex-money.js";

export { LEVELS, HELP, levelOf, helpOf } from "./ex-remainder.js";
export { placesFor };

/**
 * Which chapter an exercise belongs to, one per family.
 *
 * The rail shows one chapter at a time behind a row of tabs — the first group
 * of each family carries `chapter`, and the rest follow it — and the cover
 * names the chapters the paper was actually built from (subject.js).
 *
 * THIS IS WHERE A CHAPTER'S NUMBER IS DECIDED. Moving a family means changing
 * it here and in the CHAPTERS names in subject.js, and nowhere else.
 */
const CHAPTER = new Map([
  ...WORD_GROUPS.map((g) => [g.id, 2]),
  ...SUM_GROUPS.map((g) => [g.id, 3]),
  ...REM_GROUPS.map((g) => [g.id, 4]),
  ...FRAC_GROUPS.map((g) => [g.id, 5]),
  ...TIME_GROUPS.map((g) => [g.id, 6]),
  ...MUL_GROUPS.map((g) => [g.id, 7]),
  ...PRIME_GROUPS.map((g) => [g.id, 8]),
  ...MODEL_GROUPS.map((g) => [g.id, 9]),
  ...NB_GROUPS.map((g) => [g.id, 10]),
  ...MONEY_GROUPS.map((g) => [g.id, 11]),
]);
/* Place value is the first chapter, so it is what is left over. */
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

/* THE NUMBER IN THE TAB'S NAME IS STAMPED FROM THAT MAP, not typed beside it.
   A family writes "Chapter 8 · Multiplying" on its first group and the map
   says 7, and those are the same fact written twice — which is how multiplying
   came to wear an 8 on its tab while its cover said 7, for a month, with prime
   factors wearing an 8 as well. The map wins and the label is restamped here,
   so a family that moves only has to move in one place. */
const numbered = (g) => (g.chapter
  ? { ...g, chapter: g.chapter.replace(/^Chapter\s+\d+/, `Chapter ${CHAPTER.get(g.id) || 1}`) }
  : g);

/* The families, in teaching order. The place-value groups keep the plain names
   they were written with; the later families carry their letter in the label
   because they were built as separate papers and the letter is how the child
   is told where they are. */
export const GROUPS = [
  ...PLACE_GROUPS,
  ...WORD_GROUPS,
  ...SUM_GROUPS,
  ...REM_GROUPS,
  ...FRAC_GROUPS,
  ...TIME_GROUPS,
  /* Added after the first six so that no chapter already printed on a paper
     changes its number — the map above is what decides it. */
  ...MUL_GROUPS,
  /* and prime factors after that, for the same reason */
  ...PRIME_GROUPS,
  /* and the bar model's word problems after that */
  ...MODEL_GROUPS,
  ...NB_GROUPS,
  /* and money last, where the arithmetic of every chapter before it is put to
     work on sums a grown-up actually does */
  ...MONEY_GROUPS,
].map(numbered);

/* Everything outside place value counts and writes in ordinary numerals, so it
   is base ten whether it says so or not. Marked here rather than on each entry:
   it is a fact about which FAMILY an exercise is in, and marking it thirty
   times is thirty chances to forget once. */
const tenOnly = (list) => list.map((ex) => ({ ...ex, tenOnly: true }));

export const EXERCISES = [
  ...PLACE_EXERCISES,
  /* Already base ten, each of them, and they say so on their own entry:
     English has no word for a base-five number. */
  ...WORD_EXERCISES,
  ...tenOnly(SUM_EXERCISES),
  ...tenOnly(REM_EXERCISES),
  /* place value division and box division: their groups stand inside REM_GROUPS */
  ...tenOnly(PVDIV_EXERCISES),
  ...tenOnly(FRAC_EXERCISES),
  ...tenOnly(TIME_EXERCISES),
  ...tenOnly(MUL_EXERCISES),
  ...tenOnly(PRIME_EXERCISES),
  ...tenOnly(MODEL_EXERCISES),
  /* number bases do their own bases: the base dial (chapter 1) does not touch them */
  ...NB_EXERCISES,
  ...tenOnly(MONEY_EXERCISES),
];

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/**
 * Why an exercise cannot run under these options, or null.
 *
 * Said rather than hidden — see the note in rail.js. A row that stays where it
 * is and reads "base ten only" tells a teacher what they lost and why; a menu
 * that silently gets shorter does not.
 */
export function unavailable(ex, o) {
  if (ex.tenOnly && o.base !== 10) return "base ten only";
  if (ex.hardest && o.level === "gentle") return "needs Middle or Stretch";
  if (ex.minLevel === "stretch" && o.level !== "stretch") return "needs Stretch";
  return null;
}

/** Every group id, so a page can check it has a glyph for each. */
export const GROUP_IDS = GROUPS.map((g) => g.id);
