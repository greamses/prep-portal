/* ═══════════════════════════════════════════════════════
   PLANNER — round loop

   3-2-1 "get ready" from a shared startAt, then the brief: a receipt of clues on
   the left, and on the right a schedule table the player fills by (a) dragging
   the event sticky notes into rows to set the SEQUENCE, and (b) setting each
   row's TIME from a dropdown. Both are scored — sequence point if the event in a
   row is the one whose true time ranks there, timing point if the row's chosen
   time matches that event's true time. Score is out of 2N.

   All timing after activation is local (startAt/timeLimit); no server dependency
   during play. Same shell/contract as game.js in the other games.
═══════════════════════════════════════════════════════ */
import { planAt, fmtTime } from './rng.js';
import { weekAt, fromInputValue } from './week.js';
import { enhanceSelect } from '/utils/components/pp-select.js';

const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const $ = (id) => document.getElementById(id);
const START_BUFFER_MS = 3000; // mirrors seeded-room.js; see the other game.js's note

const playBd = $('planner-play-bd');
const stageEl = $('planner-stage');
const rosterEl = $('planner-roster');
const countdownEl = $('planner-countdown');
const timeRemainingEl = $('planner-time-remaining');

let active = false;
let endAt = 0;
let rafId = null;
let resolveRound = null;
let brief = null; // the current planAt()/weekAt() result
let currentFormat = 'events'; // 'events' | 'week'
let slotSelects = []; // per-row time <select> (index = row)
let submitBtn = null;
let progressEl = null;
let timerNote = null;

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

// ── Build ──────────────────────────────────────────────────────────────────
function buildStage() {
  if (currentFormat === 'week') { buildWeekStage(); return; }
  buildEventStage();
}

function buildEventStage() {
  stageEl.innerHTML = '';
  slotSelects = [];

  // Left: the event request — the clues, read-only, on receipt paper.
  const request = el('div', 'planner-request pp-receipt');
  const rpaper = el('div', 'planner-request-paper pp-receipt__paper');
  timerNote = el('span', 'pp-sticky pp-sticky--tape planner-note-tag');
  rpaper.append(timerNote);
  rpaper.append(el('p', 'planner-request-title', 'Event Request'));
  rpaper.append(el('p', 'planner-request-sub', 'Work out each event’s time and order from the clues, then build the schedule.'));
  const clues = el('ul', 'planner-clues');
  brief.clues.forEach((c) => clues.append(el('li', 'planner-clue', c)));
  rpaper.append(clues);
  request.append(rpaper);

  // Right: the schedule table + the bank of event notes + submit.
  const side = el('div', 'planner-side');

  const table = el('table', 'planner-schedule');
  const tbody = el('tbody');
  const times = brief.slots; // [{min,label}]
  for (let i = 0; i < brief.N; i++) {
    const tr = el('tr', 'planner-row');
    tr.append(el('td', 'planner-row-num', String(i + 1)));

    const slotTd = el('td', 'planner-slot-cell');
    const slot = el('div', 'planner-slot');
    slot.dataset.drop = `row:${i}`;
    slot.dataset.row = String(i);
    slotTd.append(slot);
    tr.append(slotTd);

    const timeTd = el('td', 'planner-time-cell');
    const sel = document.createElement('select');
    sel.className = 'planner-time-select';
    sel.append(new Option('— : —', ''));
    times.forEach((t) => sel.append(new Option(t.label, String(t.min))));
    sel.addEventListener('change', refreshProgress);
    timeTd.append(sel);
    tr.append(timeTd);
    tbody.append(tr);
    slotSelects.push(sel);
  }
  table.append(tbody);

  const bank = el('div', 'planner-bank');
  bank.dataset.drop = 'bank';
  brief.bank.forEach((e) => bank.append(makeNote(e.id, e.name)));

  const bankLabel = el('p', 'planner-bank-label', 'Events — drag each into its place');
  progressEl = el('p', 'planner-progress');
  submitBtn = el('button', 'planner-submit-btn pp-sticky pp-sticky--tape pp-note-btn pp-sticky--c1');
  submitBtn.type = 'button';
  submitBtn.textContent = 'Submit & rank';
  submitBtn.addEventListener('click', () => endRound());

  side.append(table, bankLabel, bank, progressEl, submitBtn);
  stageEl.append(request, side);

  // Enhance the time dropdowns into the app's custom select.
  slotSelects.forEach((s) => enhanceSelect(s, { className: 'pp-select--sm' }));
  refreshProgress();
}

// The weekly-routine stage: a Mon–Fri TIMETABLE the player rebuilds from clues.
// The time is set once per COLUMN in the header row; the days are typed down the
// left; the subject stickers are dragged from the bank into the cells. Both the
// column times and the placements are scored. A subject's colour is fixed (all
// "Maths" notes share a colour) so the bank reads as a palette.
function buildWeekStage() {
  stageEl.innerHTML = '';

  const request = el('div', 'planner-request pp-receipt');
  const rpaper = el('div', 'planner-request-paper pp-receipt__paper');
  timerNote = el('span', 'pp-sticky pp-sticky--tape planner-note-tag');
  rpaper.append(timerNote);
  rpaper.append(el('p', 'planner-request-title', brief.theme.name));
  rpaper.append(el('p', 'planner-request-sub', `From the clues: set each column’s time across the top, then drag every ${brief.theme.unit} into its cell.`));
  const clues = el('ul', 'planner-clues');
  brief.clues.forEach((c) => clues.append(el('li', 'planner-clue', c)));
  rpaper.append(clues);
  request.append(rpaper);

  const side = el('div', 'planner-side');
  const scroll = el('div', 'planner-week-scroll');
  const table = el('table', 'planner-week planner-week--build');

  // Header — an ordinal + a time input the player sets, per column.
  const thead = document.createElement('thead');
  const htr = el('tr', 'planner-week-row');
  htr.append(el('th', 'planner-week-corner', ''));
  for (let c = 0; c < brief.periods; c++) {
    const th = el('th', 'planner-week-colh');
    th.append(el('span', 'planner-colh-ord', ORD[c] || `#${c + 1}`));
    const ti = document.createElement('input');
    ti.type = 'time';
    ti.className = 'planner-col-time';
    ti.dataset.col = String(c);
    ti.addEventListener('input', refreshWeekProgress);
    th.append(ti);
    htr.append(th);
  }
  thead.append(htr);
  table.append(thead);

  // Body — a typed day label + a drop cell per column.
  const tbody = document.createElement('tbody');
  brief.grid.forEach((row) => {
    const tr = el('tr', 'planner-week-row');
    const dth = el('th', 'planner-week-day');
    const di = document.createElement('input');
    di.type = 'text';
    di.className = 'planner-day-label';
    di.value = row.name.slice(0, 3);
    di.setAttribute('aria-label', `Day ${row.day + 1}`);
    dth.append(di);
    tr.append(dth);
    for (let c = 0; c < brief.periods; c++) {
      const td = el('td', 'planner-week-cell');
      const drop = el('div', 'planner-week-drop');
      drop.dataset.drop = `cell:${row.day}:${c}`;
      td.append(drop);
      tr.append(td);
    }
    tbody.append(tr);
  });
  table.append(tbody);
  scroll.append(table);

  // Bank — the exact multiset of the week's subjects, coloured by subject.
  const colourOf = {};
  brief.subjects.forEach((s, i) => { colourOf[s] = i % 6; });
  const all = [];
  brief.grid.forEach((row) => row.cells.forEach((c) => all.push(c.subject)));
  const bank = el('div', 'planner-bank planner-week-bank');
  bank.dataset.drop = 'bank';
  shuffleLocal(all).forEach((s) => bank.append(makeWeekNote(s, colourOf[s])));

  const bankLabel = el('p', 'planner-bank-label', `${brief.theme.unit === 'period' ? 'Subjects' : 'Items'} — drag each into its cell`);
  progressEl = el('p', 'planner-progress');
  submitBtn = el('button', 'planner-submit-btn pp-sticky pp-sticky--tape pp-note-btn pp-sticky--c1');
  submitBtn.type = 'button';
  submitBtn.textContent = 'Submit & rank';
  submitBtn.addEventListener('click', () => endRound());

  side.append(scroll, bankLabel, bank, progressEl, submitBtn);
  stageEl.append(request, side);
  refreshWeekProgress();
}

// Bank ORDER only — placement is scored but the shuffle just sets the pile order,
// which the seeded answer doesn't depend on, so a per-client shuffle is harmless.
function shuffleLocal(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeWeekNote(subject, colour) {
  const note = el('div', `planner-note pp-sticky pp-sticky--tape pp-sticky--c${colour}`, subject);
  note.dataset.subject = subject;
  note.addEventListener('pointerdown', (ev) => startDrag(ev, note));
  return note;
}

function refreshWeekProgress() {
  if (!progressEl) return;
  let placed = 0;
  let timed = 0;
  stageEl.querySelectorAll('.planner-week-drop').forEach((d) => { if (d.querySelector('.planner-note')) placed += 1; });
  stageEl.querySelectorAll('.planner-col-time').forEach((i) => { if (i.value) timed += 1; });
  progressEl.textContent = `${placed}/${brief.cellCount} placed · ${timed}/${brief.periods} times set`;
  if (submitBtn) submitBtn.hidden = false;
}

function makeNote(id, name) {
  const note = el('div', 'planner-note pp-sticky pp-sticky--tape');
  note.dataset.id = id;
  note.textContent = name;
  note.addEventListener('pointerdown', (ev) => startDrag(ev, note));
  return note;
}

// ── Drag (pointer-based, same idea as the puzzles pieces) ───────────────────
let ghost = null;
let dragNote = null;
let originDrop = null;

function startDrag(ev, note) {
  if (!active) return;
  ev.preventDefault();
  dragNote = note;
  originDrop = note.parentElement; // the slot or the bank it came from
  const r = note.getBoundingClientRect();
  ghost = note.cloneNode(true);
  ghost.classList.add('planner-note--ghost');
  ghost.style.width = `${r.width}px`;
  ghost.style.left = `${ev.clientX - r.width / 2}px`;
  ghost.style.top = `${ev.clientY - r.height / 2}px`;
  document.body.append(ghost);
  note.classList.add('is-dragging');
  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragUp, { once: true });
}

function dropTargetAt(x, y) {
  if (ghost) ghost.style.pointerEvents = 'none';
  const under = document.elementFromPoint(x, y);
  const drop = under && under.closest('[data-drop]');
  return drop;
}

function onDragMove(ev) {
  if (!ghost) return;
  const r = ghost.getBoundingClientRect();
  ghost.style.left = `${ev.clientX - r.width / 2}px`;
  ghost.style.top = `${ev.clientY - r.height / 2}px`;
  const drop = dropTargetAt(ev.clientX, ev.clientY);
  stageEl.querySelectorAll('.is-drop-hover').forEach((n) => n.classList.remove('is-drop-hover'));
  if (drop && drop !== originDrop) drop.classList.add('is-drop-hover');
}

function onDragUp(ev) {
  document.removeEventListener('pointermove', onDragMove);
  const drop = dropTargetAt(ev.clientX, ev.clientY);
  stageEl.querySelectorAll('.is-drop-hover').forEach((n) => n.classList.remove('is-drop-hover'));
  if (ghost) { ghost.remove(); ghost = null; }
  if (dragNote) dragNote.classList.remove('is-dragging');

  const target = (drop && drop.dataset.drop) ? drop : null;
  if (target) placeNote(dragNote, target);
  dragNote = null;
  originDrop = null;
  refreshStage();
}

function refreshStage() {
  if (currentFormat === 'week') refreshWeekProgress();
  else refreshProgress();
}

// A single slot (an event row, or a weekly-timetable cell) holds one note;
// dropping onto an occupied slot swaps the occupant back to where the dragged
// note came from. The bank holds any number.
function placeNote(note, target) {
  const drop = target.dataset.drop;
  const isSlot = drop.startsWith('row:') || drop.startsWith('cell:');
  if (isSlot) {
    const occupant = target.querySelector('.planner-note');
    if (occupant && occupant !== note) originDrop.append(occupant);
    target.append(note);
  } else {
    target.append(note); // bank
  }
}

function refreshProgress() {
  if (!progressEl) return;
  let placed = 0;
  let timed = 0;
  for (let i = 0; i < brief.N; i++) {
    const slot = stageEl.querySelector(`.planner-slot[data-row="${i}"]`);
    const note = slot && slot.querySelector('.planner-note');
    if (note) placed += 1;
    if (note && slotSelects[i] && slotSelects[i].value !== '') timed += 1;
  }
  progressEl.textContent = `${placed} of ${brief.N} placed · ${timed} timed`;
  if (submitBtn) submitBtn.hidden = false;
}

// ── Grade ───────────────────────────────────────────────────────────────────
function grade() {
  return currentFormat === 'week' ? gradeWeek() : gradeEvents();
}

// Weekly timetable: a point for every column time set right AND every cell whose
// dragged-in subject matches the true one.
function gradeWeek() {
  let timesCorrect = 0;
  let placesCorrect = 0;
  const timeReview = [];
  for (let c = 0; c < brief.periods; c++) {
    const ti = stageEl.querySelector(`.planner-col-time[data-col="${c}"]`);
    const chosen = ti ? fromInputValue(ti.value) : null;
    if (chosen != null && chosen === brief.answerTime[c]) timesCorrect += 1;
    timeReview.push({ col: c, chosen, trueTime: brief.answerTime[c] });
  }
  const placeReview = [];
  brief.grid.forEach((row) => {
    row.cells.forEach((c) => {
      const drop = stageEl.querySelector(`.planner-week-drop[data-drop="cell:${row.day}:${c.col}"]`);
      const note = drop && drop.querySelector('.planner-note');
      const placed = note ? note.dataset.subject : null;
      if (placed != null && placed === c.subject) placesCorrect += 1;
      placeReview.push({ day: row.day, name: row.name, col: c.col, subject: c.subject, placed });
    });
  });
  return {
    format: 'week', score: timesCorrect + placesCorrect,
    timesCorrect, placesCorrect, timeCount: brief.periods, cellCount: brief.cellCount,
    N: brief.periods + brief.cellCount, periods: brief.periods, theme: brief.theme,
    timeReview, placeReview, answerTime: brief.answerTime,
  };
}

function gradeEvents() {
  let sequenceCorrect = 0;
  let timeCorrect = 0;
  const review = brief.order.map((e) => ({
    name: e.name, trueRank: e.rank, trueTime: e.time, placedRank: null, chosenTime: null,
  }));
  const byId = Object.fromEntries(brief.order.map((e, i) => [e.id, i]));
  for (let i = 0; i < brief.N; i++) {
    const slot = stageEl.querySelector(`.planner-slot[data-row="${i}"]`);
    const note = slot && slot.querySelector('.planner-note');
    if (!note) continue;
    const id = note.dataset.id;
    const ans = brief.answer[id];
    const rev = review[byId[id]];
    rev.placedRank = i;
    if (ans.rank === i) sequenceCorrect += 1;
    const raw = slotSelects[i] ? slotSelects[i].value : '';
    if (raw !== '') {
      const ts = Number(raw);
      rev.chosenTime = ts;
      if (ts === ans.time) timeCorrect += 1;
    }
  }
  return { sequenceCorrect, timeCorrect, score: sequenceCorrect + timeCorrect, N: brief.N, review };
}

// ── Timer / lifecycle ───────────────────────────────────────────────────────
function renderRoster(roster) {
  rosterEl.innerHTML = '';
  roster.forEach((p, i) => {
    const pill = el('span', `pp-roster-item${p.isSelf ? ' is-self' : ''}`, p.isSelf ? `${p.name} (You)` : p.name);
    pill.style.setProperty('--delay', `${i * 90}ms`);
    rosterEl.append(pill);
  });
  rosterEl.hidden = false;
}

function tick() {
  if (!active) return;
  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) { endRound(); return; }
  timeRemainingEl.textContent = `${Math.ceil(remainingMs / 1000)}s left`;
  rafId = requestAnimationFrame(tick);
}

function endRound() {
  if (!active) return;
  active = false;
  if (rafId) cancelAnimationFrame(rafId);
  const out = grade();
  playBd.classList.remove('open');
  playBd.setAttribute('aria-hidden', 'true');
  stageEl.hidden = true;
  if (resolveRound) resolveRound(out);
  resolveRound = null;
}

// Resolves with { score, sequenceCorrect, timeCorrect, N, review } once the
// player submits or the local timer hits zero.
export function startPlanRound({ seed, timeLimit, startAt, difficulty, roster, format }) {
  return new Promise((resolve) => {
    currentFormat = format === 'week' ? 'week' : 'events';
    brief = currentFormat === 'week' ? weekAt(seed, difficulty) : planAt(seed, difficulty);
    resolveRound = resolve;

    stageEl.hidden = true;
    countdownEl.hidden = false;
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    document.body.classList.add('planner-nav-hidden');
    active = true;

    // Same clock-skew guard as the other games: trust the shared startAt only
    // when it lands in the plausible window, else anchor to this device's clock.
    const lead = startAt - Date.now();
    const anchorAt = (lead > -2000 && lead <= START_BUFFER_MS + 2000) ? startAt : Date.now() + 800;

    (function tickCountdown() {
      const msLeft = anchorAt - Date.now();
      if (msLeft <= 0) {
        countdownEl.hidden = true;
        rosterEl.hidden = true;
        buildStage();
        stageEl.hidden = false;
        timerNote.textContent = `${timeLimit}s round`;
        endAt = anchorAt + timeLimit * 1000;
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
