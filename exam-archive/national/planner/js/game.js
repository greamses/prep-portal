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
import { enhanceSelect } from '/utils/components/pp-select.js';

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
let brief = null; // the current planAt() result
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
  refreshProgress();
}

// A row slot holds one note; dropping onto an occupied slot swaps the occupant
// back to where the dragged note came from. The bank holds any number.
function placeNote(note, target) {
  const isRow = target.dataset.drop.startsWith('row:');
  if (isRow) {
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
export function startPlanRound({ seed, timeLimit, startAt, difficulty, roster }) {
  return new Promise((resolve) => {
    brief = planAt(seed, difficulty);
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
