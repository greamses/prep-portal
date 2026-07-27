/* ═══════════════════════════════════════════════════════
   PLANNER — weekly-routine generation (rule-based timetable)

   weekAt(seed, difficulty) builds a Monday–Friday timetable brief: the columns
   (subject periods + two breaks), the exact column start times, ONE valid
   reference arrangement (to seed the sticker bank and the review), and the RULES
   the player's timetable must obey. Seeded off the shared room seed so every
   client derives the identical brief.

   Scoring is rule-based (NOT an exact hidden grid): the column times are exact
   and deducible from the cadence, but placement is graded against the rules —
   the 3 cores lead every day (any order), and every other subject appears ≥ twice.
   That's why "any core may start" and "at least twice" work: many timetables are
   valid, and the reference is just one of them.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS } from '/utils/games/rng.js';
import { THEMES, WEEK_DIFFICULTY, WEEK_DAYS } from '/data/planner/routines.js';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

function shuffled(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function fmtClock(min) {
  if (min == null) return '—';
  const h24 = Math.floor(min / 60), m = min % 60, ap = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
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
  const cores = theme.cores.slice(); // 3
  const others = shuffled(theme.others, rng).slice(0, d.others);

  // ── Columns: 3 core periods, short break, some others, lunch, the rest. ──
  const firstHalf = Math.ceil(d.otherCols / 2);
  const secondHalf = d.otherCols - firstHalf;
  const columns = [];
  let subjOrd = 0;
  for (let i = 0; i < 3; i++) columns.push({ kind: 'subject', role: 'core', ord: ++subjOrd });
  columns.push({ kind: 'break', brk: 'short', label: 'Break' });
  for (let i = 0; i < firstHalf; i++) columns.push({ kind: 'subject', role: 'other', ord: ++subjOrd });
  columns.push({ kind: 'break', brk: 'long', label: 'Lunch' });
  for (let i = 0; i < secondHalf; i++) columns.push({ kind: 'subject', role: 'other', ord: ++subjOrd });
  const subjectCols = columns.map((c, i) => (c.kind === 'subject' ? i : -1)).filter((i) => i >= 0);
  const coreCols = subjectCols.slice(0, 3);
  const otherCols = subjectCols.slice(3);

  // ── Exact column start times: walk lesson + change-over, break durations. ──
  const anchor = 8 * 60 + (rng() < 0.5 ? 0 : 30);
  const lesson = rng() < 0.5 ? 40 : 45;
  const change = rng() < 0.5 ? 5 : 10;
  const shortBrk = rng() < 0.5 ? 15 : 20;
  const longBrk = rng() < 0.5 ? 40 : 45;
  const times = [anchor];
  for (let i = 1; i < columns.length; i++) {
    const prev = columns[i - 1];
    const prevDur = prev.kind === 'break' ? (prev.brk === 'short' ? shortBrk : longBrk) : lesson;
    const gap = (prev.kind === 'subject' && columns[i].kind === 'subject') ? change : 0;
    times.push(times[i - 1] + prevDur + gap);
  }
  const answerTime = {};
  times.forEach((t, i) => { answerTime[i] = t; });

  // ── One valid reference arrangement (seeds the bank + the review). Cores fill
  //    the 3 core columns each day (rotated for variety); others fill the other
  //    columns so each appears at least twice. ──
  const otherSlots = otherCols.length * WEEK_DAYS;
  const bag = [];
  others.forEach((s) => { bag.push(s, s); }); // two of each first
  let k = 0;
  while (bag.length < otherSlots) { bag.push(others[k % others.length]); k += 1; }
  const otherFill = shuffled(bag, rng); // length === otherSlots

  const grid = DAYS.map((name, day) => {
    const cells = [];
    const dayCores = [];
    for (let i = 0; i < 3; i++) dayCores.push(cores[(i + day) % 3]); // rotate the order
    columns.forEach((col, ci) => {
      if (col.kind === 'break') { cells.push({ col: ci, kind: 'break', label: col.label }); return; }
      let subject;
      if (col.role === 'core') subject = dayCores[coreCols.indexOf(ci)];
      else subject = otherFill[otherCols.indexOf(ci) * WEEK_DAYS + day];
      cells.push({ col: ci, kind: 'subject', role: col.role, subject });
    });
    return { day, name, cells };
  });

  // sticker bank = the reference multiset of subjects, coloured per subject.
  const palette = [...cores, ...others];
  const bank = [];
  grid.forEach((row) => row.cells.forEach((c) => { if (c.kind === 'subject') bank.push(c.subject); }));

  // ── Clues ──
  const u = theme.unit;
  const shortCol = columns.findIndex((c) => c.brk === 'short');
  const lunchCol = columns.findIndex((c) => c.brk === 'long');
  const clues = [];
  clues.push(`On weekdays ${theme.firstLabel} is at ${fmtClock(anchor)}. Each ${u} runs ${lesson} minutes with ${change} to change over.`);
  clues.push(`There are two breaks: a ${shortBrk}-minute one after the ${ORD[3]} ${u}, and a ${longBrk}-minute lunch after the ${ORD[3 + firstHalf]} ${u}.`);
  clues.push(`${listWords(cores)} lead every day — any of the three may start, but all three come before anything else.`);
  clues.push(`The rest of the week is ${listWords(others)}; every one of them appears at least twice across the week.`);

  return {
    format: 'week',
    theme: { name: theme.name, unit: theme.unit },
    days: DAYS,
    columns, // {kind, role/brk, ord/label}
    subjectCols, coreCols, otherCols,
    cores, others, palette,
    grid, bank,
    clues,
    answerTime,
    colCount: columns.length,
    cellCount: WEEK_DAYS * subjectCols.length,
  };
}
