/* ═══════════════════════════════════════════════════════
   PLANNER — the weekly-routine bank (timetable construction)

   The Planner's WEEKLY-ROUTINE format briefs a player to BUILD a Monday–Friday
   timetable from clues: set each column's start time across the top, and drag the
   subject stickers into the right cells. Both the times and the placements are
   scored, so the clues must pin the whole grid.

   To stay uniquely solvable from a few rules, the timetable is UNIFORM per column
   (the same subject sits in a period every day) with two clued exceptions: the two
   "core" subjects each take a weekly DOUBLE period on a named day, shifting that
   day's later periods along. This file is the pure content — themes (core + filler
   subjects) and the difficulty dials. The generation lives in js/week.js.
═══════════════════════════════════════════════════════ */

// `core` are the two subjects that lead every day (early) and each take a weekly
// double; `fillers` supply the rest of the columns. Keep worldwide-readable.
export const THEMES = [
  {
    id: 'school', name: 'School week', unit: 'period', firstLabel: 'the first bell',
    core: ['Maths', 'English'],
    fillers: ['Science', 'Geography', 'History', 'Art', 'Music', 'P.E.', 'Computing', 'Reading', 'Nature', 'Drama'],
  },
  {
    id: 'academy', name: 'Academy week', unit: 'block', firstLabel: 'the first block',
    core: ['Reading', 'Numeracy'],
    fillers: ['Science', 'Coding', 'Robotics', 'Design', 'Debate', 'Music', 'Fitness', 'Language', 'Ethics'],
  },
];

// `periods` = columns per day; `doubles` = how many core subjects take a weekly
// double (1 = just the first core, 2 = both). Days are always Mon–Fri.
export const WEEK_DIFFICULTY = {
  easy: { periods: 4, doubles: 1 },
  medium: { periods: 5, doubles: 2 },
  hard: { periods: 6, doubles: 2 },
};

export const WEEK_DAYS = 5; // Monday–Friday
export const WEEK_DIFFICULTY_KEYS = ['easy', 'medium', 'hard'];

/** Placement cells (days × periods). */
export function weekCellCount(difficulty) {
  const d = WEEK_DIFFICULTY[difficulty] || WEEK_DIFFICULTY.medium;
  return WEEK_DAYS * d.periods;
}
/** Column times to set (one per period). */
export function weekTimeCount(difficulty) {
  const d = WEEK_DIFFICULTY[difficulty] || WEEK_DIFFICULTY.medium;
  return d.periods;
}
/** Total scored items — placements + column times. */
export function weekScored(difficulty) {
  return weekCellCount(difficulty) + weekTimeCount(difficulty);
}
