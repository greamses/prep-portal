/* ═══════════════════════════════════════════════════════
   PLANNER — weekly-routine generation

   weekAt(seed, difficulty) builds the whole brief for a WEEKLY-ROUTINE round: a
   Monday–Saturday timetable whose every cell holds an activity, a HIDDEN true
   start time for each cell, and the handful of clued rules that pin them all.
   Seeded off the shared room seed via /utils/games/rng.js, so every client in a
   room derives the identical timetable with zero network — same contract as the
   event format's planAt() in js/rng.js.

   Uniqueness is by CONSTRUCTION, not search. A weekday runs on one anchor plus a
   fixed cadence: lesson length + change-over between back-to-back periods, one
   morning break, and (from medium up) a lunch gap. Wednesday delays everything
   from the 2nd period on by a fixed amount; Saturday starts later, runs fewer
   periods, and keeps the plain back-to-back spacing. Every one of those rules is
   spelled out as a clue, so a reader can walk the entire grid forward from the
   anchor — there is exactly one solution.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS } from '/utils/games/rng.js';
import { THEMES, WEEK_DIFFICULTY } from '/data/planner/routines.js';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WED = 2; // Wednesday's index
const SAT = 5; // Saturday's index
const BREAK_AFTER = 2; // the morning break falls after the 2nd period (1-indexed)
const LUNCH_AFTER = 4; // lunch falls after the 4th period (only if the day runs that far)

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// minutes-since-midnight → "8:50 AM"
export function fmtClock(min) {
  if (min == null) return '—';
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ap = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

// minutes-since-midnight → "08:50" (24h, for an <input type="time"> value)
export function toInputValue(min) {
  if (min == null) return '';
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

// "08:50" → minutes-since-midnight (null if blank/unparseable)
export function fromInputValue(v) {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const mins = Number(m[1]) * 60 + Number(m[2]);
  return Number.isFinite(mins) ? mins : null;
}

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const fmtDur = (min) => {
  const h = Math.floor(min / 60), m = min % 60, parts = [];
  if (h) parts.push(`${h} hour${h > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} minutes`);
  return parts.join(' ') || '0 minutes';
};

// Walk a weekday forward from the anchor, applying the cadence rules.
function weekdayTimes({ anchor, lesson, change, brk, lunch, periods }) {
  const t = [anchor];
  for (let p = 1; p < periods; p++) {
    let gap = lesson + change; // back-to-back periods
    if (p === BREAK_AFTER) gap = lesson + brk; // the period right after the break
    else if (p === LUNCH_AFTER) gap = lesson + lunch; // the period right after lunch
    t.push(t[p - 1] + gap);
  }
  return t;
}

export function weekAt(seed, difficulty) {
  const rng = mulberry32(hashSeed(seed, CONTENT_NS));
  const d = WEEK_DIFFICULTY[difficulty] || WEEK_DIFFICULTY.medium;
  const theme = THEMES[Math.floor(rng() * THEMES.length)];

  // Seeded cadence — clean enough to clue, varied enough to relearn each round.
  const anchor = 8 * 60 + (rng() < 0.5 ? 0 : 30); // 8:00 or 8:30
  const lesson = rng() < 0.5 ? 40 : 45;
  const change = rng() < 0.5 ? 5 : 10;
  const brk = rng() < 0.5 ? 15 : 20;
  const lunch = rng() < 0.5 ? 40 : 45;
  const wedShift = d.wednesdayShift ? (rng() < 0.5 ? 15 : 30) : 0;
  const satDelay = 2 * 60;

  const base = weekdayTimes({ anchor, lesson, change, brk, lunch, periods: d.periods });
  const wed = base.map((t, i) => (i === 0 ? t : t + wedShift));
  // Saturday: later start, fewer periods, plain back-to-back spacing (no break/lunch).
  const sat = [];
  for (let p = 0; p < d.satPeriods; p++) sat.push(anchor + satDelay + p * (lesson + change));

  const timesFor = (di) => (di === SAT ? sat : di === WED ? wed : base);

  // Fill the grid. Repeats across the week are allowed (a subject recurs); we
  // just avoid the same activity twice in a row within one day.
  const grid = DAYS.map((day, di) => {
    const times = timesFor(di);
    let prev = null;
    const cells = times.map((time, p) => {
      let name = pick(rng, theme.activities);
      let guard = 0;
      while (name === prev && guard++ < 6) name = pick(rng, theme.activities);
      prev = name;
      return { period: p, activity: name, time };
    });
    return { day, dayIndex: di, cells };
  });

  const answer = {};
  let cellCount = 0;
  grid.forEach((row) => row.cells.forEach((c) => { answer[`${row.dayIndex}:${c.period}`] = c.time; cellCount += 1; }));

  // The clues — one per rule, in reading order. Together they pin every cell.
  const u = theme.unit;
  const clues = [];
  clues.push(`On weekdays, ${theme.firstLabel} is at ${fmtClock(anchor)} — the ${ORD[1]} ${u} of the day.`);
  clues.push(`Each ${u} runs ${lesson} minutes, with ${change} minutes to change over, so a back-to-back ${u} starts ${lesson + change} minutes after the one before it.`);
  if (d.periods > BREAK_AFTER) clues.push(`A ${brk}-minute break follows the ${ORD[BREAK_AFTER]} ${u}, pushing the ${ORD[BREAK_AFTER + 1]} ${u} back that much further.`);
  if (d.periods > LUNCH_AFTER) clues.push(`Lunch lasts ${lunch} minutes straight after the ${ORD[LUNCH_AFTER]} ${u}; the ${ORD[LUNCH_AFTER + 1]} ${u} begins the moment it ends.`);
  if (wedShift) clues.push(`On Wednesday everything from the ${ORD[2]} ${u} onward runs ${fmtDur(wedShift)} later than usual.`);
  clues.push(`Saturday is a half day: ${theme.firstLabel} opens ${fmtDur(satDelay)} later than on a weekday, only the first ${d.satPeriods} ${u}s run, and they keep the plain back-to-back spacing with no break.`);

  return {
    format: 'week',
    theme: { name: theme.name, unit: theme.unit },
    days: DAYS,
    periods: d.periods, // widest day (weekday) — drives the column count
    grid,
    clues,
    answer,
    cellCount,
  };
}
