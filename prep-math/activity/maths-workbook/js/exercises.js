/* ============================================================================
   Maths Workbook — the ONE registry
   ----------------------------------------------------------------------------
   Four families, one list. The engine, the builder and the answer key all read
   this file and nothing else; the families live beside it only because eight
   hundred lines of exercises in one file is a file nobody edits.

     ex-place.js       place value — blocks, charts, the number on its own
     ex-sums.js        adding and taking away, with and without regrouping
     ex-remainder.js   dividing, what is left over, and fraction bars
     ex-fractions.js   what a fraction is, and adding the ones that match
     ex-time.js        counting in fives, and then telling the time
     ex-angles.js      naming angles, and a protractor to measure them with

   THE ORDER OF THE FAMILIES IS THE ORDER OF THE YEARS. A child works out what
   a number IS before they add two of them; adds before they share out; shares
   out before the leftover becomes a fraction. Counting in fives sits directly
   in front of telling the time because it is the whole of it, and the angles
   come last because they are the only thing here that needs an instrument.
   The letters printed on the paper follow this list, so section A is always
   the earliest thing on the sheet.

   ONE DIAL IS SHARED AND ONE IS NOT. "How much help" and "how hard" mean the
   same thing to every family. The BASE does not: a chart of thousands is a
   real idea in base five, and "three fifths" is not — there is no such word.
   So everything outside place value says `tenOnly`, and switches itself off,
   in writing, the moment the base moves off ten.
   ========================================================================== */

import { PLACE_GROUPS, PLACE_EXERCISES, placesFor } from "./ex-place.js";
import { SUM_GROUPS, SUM_EXERCISES } from "./ex-sums.js";
import { REM_GROUPS, REM_EXERCISES } from "./ex-remainder.js";
import { FRAC_GROUPS, FRAC_EXERCISES } from "./ex-fractions.js";
import { TIME_GROUPS, TIME_EXERCISES } from "./ex-time.js";
import { ANGLE_GROUPS, ANGLE_EXERCISES } from "./ex-angles.js";

export { LEVELS, HELP, levelOf, helpOf } from "./ex-remainder.js";
export { placesFor };

/* The families, in teaching order. The place-value groups keep the plain names
   they were written with; the later families carry their letter in the label
   because they were built as separate papers and the letter is how the child
   is told where they are. */
export const GROUPS = [
  ...PLACE_GROUPS,
  ...SUM_GROUPS,
  ...REM_GROUPS,
  ...FRAC_GROUPS,
  ...TIME_GROUPS,
  ...ANGLE_GROUPS,
];

/* Everything outside place value counts and writes in ordinary numerals, so it
   is base ten whether it says so or not. Marked here rather than on each entry:
   it is a fact about which FAMILY an exercise is in, and marking it thirty
   times is thirty chances to forget once. */
const tenOnly = (list) => list.map((ex) => ({ ...ex, tenOnly: true }));

export const EXERCISES = [
  ...PLACE_EXERCISES,
  ...tenOnly(SUM_EXERCISES),
  ...tenOnly(REM_EXERCISES),
  ...tenOnly(FRAC_EXERCISES),
  ...tenOnly(TIME_EXERCISES),
  ...tenOnly(ANGLE_EXERCISES),
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
  return null;
}

/** Every group id, so a page can check it has a glyph for each. */
export const GROUP_IDS = GROUPS.map((g) => g.id);
