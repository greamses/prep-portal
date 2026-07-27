/* ═══════════════════════════════════════════════════════
   PLANNER — the weekly-routine bank (rule-based timetable)

   The Planner's WEEKLY-ROUTINE format briefs a player to BUILD a Monday–Friday
   timetable that obeys a set of RULES (many timetables are valid), while working
   out the column times exactly from the clues. This file is the pure content —
   the theme's core + other subjects and the difficulty dials. Generation lives in
   js/week.js. Keep subjects worldwide-readable.

   Rules the timetable must obey (scored):
   - the 3 CORE subjects lead every day, in any order (any may start, the others
     follow);
   - every OTHER subject appears at least twice across the week;
   - two breaks — one short, one long (lunch).
═══════════════════════════════════════════════════════ */

export const THEMES = [
  {
    id: 'school', name: 'School week', unit: 'period', firstLabel: 'the first bell',
    cores: ['Numeracy', 'Reading', 'Writing'],
    others: ['Science', 'History', 'Geography', 'Art', 'Music', 'P.E.', 'Computing', 'Nature', 'Drama'],
  },
];

// `others` = how many non-core subjects the week uses; `otherCols` = how many
// non-core period columns each day runs (so other-slots = otherCols × 5 days,
// shared among the others so each lands at least twice). Cores are always 3.
export const WEEK_DIFFICULTY = {
  easy: { others: 4, otherCols: 2 },
  medium: { others: 5, otherCols: 2 },
  hard: { others: 6, otherCols: 3 },
};

export const WEEK_DAYS = 5; // Monday–Friday
export const WEEK_DIFFICULTY_KEYS = ['easy', 'medium', 'hard'];

/** Subject period-columns per day (3 cores + the difficulty's other columns). */
export function weekSubjectCols(difficulty) {
  const d = WEEK_DIFFICULTY[difficulty] || WEEK_DIFFICULTY.medium;
  return 3 + d.otherCols;
}
/** All columns including the 2 breaks. */
export function weekColCount(difficulty) {
  return weekSubjectCols(difficulty) + 2;
}
/** Draggable subject cells (days × subject columns). */
export function weekCellCount(difficulty) {
  return WEEK_DAYS * weekSubjectCols(difficulty);
}
/** Scored items — every column time + the core-lead day checks + the other-subject
    "appears ≥ twice" checks. */
export function weekScored(difficulty) {
  const d = WEEK_DIFFICULTY[difficulty] || WEEK_DIFFICULTY.medium;
  return weekColCount(difficulty) + WEEK_DAYS + d.others;
}
