/* ═══════════════════════════════════════════════════════
   PLANNER — weekly-routine generation (timetable construction)

   weekAt(seed, difficulty) builds a Monday–Friday timetable the player rebuilds
   from clues: the column start times (set across the top) and the subject in every
   cell (dragged in from a palette). Seeded off the shared room seed via
   /utils/games/rng.js, so every client in a room derives the identical timetable.

   Uniqueness is by CONSTRUCTION. The base timetable is UNIFORM per column — the
   same subject in a period every day — pinned by one ordering rule. The only
   day-to-day variation is the weekly DOUBLES: each core subject takes a double
   period on a named day, shifting that day's later periods one along (the last
   filler drops off). Every one of those is spelled out as a clue, so the whole
   grid + the column times resolve uniquely from the anchor and the rules.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS } from '/utils/games/rng.js';
import { THEMES, WEEK_DIFFICULTY, WEEK_DAYS } from '/data/planner/routines.js';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const BREAK_AFTER = 2; // the morning break falls after the 2nd period (1-indexed)
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];

function shuffled(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// minutes-since-midnight → "8:50 AM"
export function fmtClock(min) {
  if (min == null) return '—';
  const h24 = Math.floor(min / 60), m = min % 60, ap = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
// minutes → "08:50" (24h, for <input type="time">) and back.
export function toInputValue(min) {
  return min == null ? '' : `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
export function fromInputValue(v) {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function listWords(arr) {
  if (arr.length <= 1) return arr[0] || '';
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

export function weekAt(seed, difficulty) {
  const rng = mulberry32(hashSeed(seed, CONTENT_NS));
  const d = WEEK_DIFFICULTY[difficulty] || WEEK_DIFFICULTY.medium;
  const theme = THEMES[Math.floor(rng() * THEMES.length)];
  const P = d.periods;
  const [coreA, coreB] = theme.core;

  // Base timetable, uniform per column: coreA, coreB, then fillers.
  const fillers = shuffled(theme.fillers, rng).slice(0, P - 2);
  const base = [coreA, coreB, ...fillers]; // length P

  // Uniform column start times: anchor + cadence (lesson + change-over, one break).
  const anchor = 8 * 60 + (rng() < 0.5 ? 0 : 30);
  const lesson = rng() < 0.5 ? 40 : 45;
  const change = rng() < 0.5 ? 5 : 10;
  const brk = rng() < 0.5 ? 15 : 20;
  const times = [anchor];
  for (let p = 1; p < P; p++) times.push(times[p - 1] + (p === BREAK_AFTER ? lesson + brk : lesson + change));

  // Weekly doubles on distinct days: coreA over cols 0–1, coreB over cols 1–2.
  const dayOrder = shuffled([0, 1, 2, 3, 4], rng);
  const dayA = dayOrder[0];
  const dayB = d.doubles >= 2 ? dayOrder[1] : -1;

  const grid = DAYS.map((name, day) => {
    let row;
    if (day === dayA) row = [coreA, coreA, ...base.slice(1, P - 1)]; // coreA doubles cols 0–1
    else if (day === dayB) row = [base[0], coreB, coreB, ...base.slice(2, P - 1)]; // coreB doubles cols 1–2
    else row = base.slice();
    return { day, name, cells: row.map((subject, col) => ({ col, subject })) };
  });

  const answerPlace = {}; // "day:col" -> subject
  grid.forEach((r) => r.cells.forEach((c) => { answerPlace[`${r.day}:${c.col}`] = c.subject; }));
  const answerTime = {}; // col -> minutes
  times.forEach((t, col) => { answerTime[col] = t; });

  const u = theme.unit;
  const clues = [];
  clues.push(`On weekdays ${theme.firstLabel} is at ${fmtClock(anchor)} — the ${ORD[1]} ${u} of the day.`);
  clues.push(`Each ${u} runs ${lesson} minutes with ${change} to change over, and a ${brk}-minute break follows the ${ORD[BREAK_AFTER]} ${u}.`);
  clues.push(`Every day opens with ${coreA} then ${coreB}, followed by ${listWords(fillers)} in that order.`);
  clues.push(`${coreA} and ${coreB} run every single day.`);
  clues.push(`Once a week ${coreA} takes a double — on ${DAYS[dayA]} it fills the ${ORD[1]} and ${ORD[2]} ${u}s, pushing the rest of that day one later.`);
  if (dayB >= 0) clues.push(`Once a week ${coreB} takes a double — on ${DAYS[dayB]} it fills the ${ORD[2]} and ${ORD[3]} ${u}s.`);

  return {
    format: 'week',
    theme: { name: theme.name, unit: theme.unit },
    days: DAYS,
    periods: P,
    subjects: base.slice(), // the palette — every distinct subject in the week
    grid,
    clues,
    answerPlace,
    answerTime,
    cellCount: WEEK_DAYS * P,
    timeCount: P,
  };
}
