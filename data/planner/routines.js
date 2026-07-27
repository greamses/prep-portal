/* ═══════════════════════════════════════════════════════
   PLANNER — the weekly-routine bank

   The Planner's WEEKLY-ROUTINE format briefs a player to fill a Monday–Saturday
   timetable: every cell holds an activity, and the player types the start time
   into each one, deduced from a handful of clued rules (see js/week.js). This
   file is the pure content it draws from — a couple of culture-neutral themes and
   the difficulty dials (how many periods a day runs). The GENERATION lives in
   js/week.js, seeded so every client in a room derives the identical timetable.

   Keep themes generic and worldwide-readable. Adding a theme or an activity just
   widens the variety; the timetable maths doesn't care what the cells are called.
═══════════════════════════════════════════════════════ */

// A theme names the columns' "unit" (period / block) and supplies the pool of
// activity labels that fill the grid. Repeats across the week are fine and read
// as realistic (a subject recurs; a routine task recurs).
export const THEMES = [
  {
    id: 'school',
    name: 'School week',
    unit: 'period',
    firstLabel: 'the first bell',
    activities: [
      'Maths', 'English', 'Science', 'Geography', 'History', 'Reading',
      'Spelling', 'Art', 'Music', 'P.E.', 'Computing', 'Library',
      'Project', 'Study Hall', 'Handwriting', 'Nature', 'Drama',
    ],
  },
  {
    id: 'office',
    name: 'Office week',
    unit: 'block',
    firstLabel: 'the doors opening',
    activities: [
      'Stand-up', 'Client Calls', 'Planning', 'Review', 'Design', 'Reports',
      'Support', 'Testing', 'Admin', 'Research', 'One-to-ones', 'Backlog',
      'Emails', 'Deep Work', 'Wrap-up', 'Handover', 'Training',
    ],
  },
  {
    id: 'clinic',
    name: 'Clinic week',
    unit: 'session',
    firstLabel: 'the front desk opening',
    activities: [
      'Check-in', 'Consults', 'Rounds', 'Dressings', 'Paperwork', 'Follow-ups',
      'Vaccinations', 'Screening', 'Referrals', 'Restock', 'Records', 'Triage',
      'Home Visits', 'Lab Drop', 'Debrief', 'Cleaning', 'Handover',
    ],
  },
];

// The dials, by difficulty. `periods` is how many timed cells a weekday runs;
// `satPeriods` is Saturday's shorter day; `wednesdayShift` toggles the midweek
// delay exception. Cell counts (Mon–Fri full + Sat): easy 22, medium 28, hard 33.
export const WEEK_DIFFICULTY = {
  easy: { periods: 4, satPeriods: 2, wednesdayShift: false },
  medium: { periods: 5, satPeriods: 3, wednesdayShift: true },
  hard: { periods: 6, satPeriods: 3, wednesdayShift: true },
};

export const WEEK_DIFFICULTY_KEYS = ['easy', 'medium', 'hard'];

/** Total fillable cells for a difficulty — Monday–Friday full + Saturday. */
export function weekCellCount(difficulty) {
  const d = WEEK_DIFFICULTY[difficulty] || WEEK_DIFFICULTY.medium;
  return d.periods * 5 + d.satPeriods;
}
