/* ═══════════════════════════════════════════════════════
   PLANNER — page orchestrator

   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby / play / results / review overlays. Same shape as
   the other games' pages — what changes is the content section (just a
   Difficulty pick) and that a "point" here is an event placed in the right slot
   OR given the right time. See js/game.js for the round itself.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { eventCount, DIFFICULTY_KEYS } from '/data/planner/scenarios.js';
import { weekCellCount, weekScored } from '/data/planner/routines.js';
import { createSetupMemory } from '/utils/games/setup-memory.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startPlanRound } from './game.js';
import { finishRound } from './leaderboard.js';
import { renderLeaderboard } from '/utils/games/leaderboard-view.js';
import {
  createCarousel, createSectionFlow, renderChoiceStep, renderCustomStep,
  playerChips, optionsChips, roomChips,
} from '/utils/components/setup-carousel.js';
import { avatarUrl, getAvatarSeed, mountAvatarPicker } from '/utils/components/avatar-picker.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;
const NAME_KEY = 'drillGameName';

/* The clock is derived, not typed: reading the clues scales with how many there
   are, and working out each event's time scales with the event count. */
const PACES = [
  { value: 45, label: 'Relaxed' },
  { value: 32, label: 'Normal', checked: true },
  { value: 22, label: 'Fast' },
];
const READ_PER_CLUE = 6; // seconds a clue takes to read
const MIN_ROUND_SEC = 90;
const MAX_ROUND_SEC = 900;

const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const nameInput = $('planner-name-input');
const avatarGrid = $('planner-avatar-grid');
const avatarUploadInput = $('planner-avatar-upload-input');
const playerMount = $('planner-player-carousel');
const topicMount = $('planner-topic-carousel');
const optionsMount = $('planner-options-carousel');
const roomMount = $('planner-room-carousel');
const codeInput = $('planner-code-input');
const quickJoinInput = $('planner-quickjoin-input');
const quickJoinBtn = $('planner-quickjoin-btn');
const startBtn = $('planner-start-btn');
const startLabel = $('planner-start-label');

const lobbyBd = $('planner-lobby-bd');
const lobbyStatus = $('planner-lobby-status');
const lobbyCode = $('planner-lobby-code');
const lobbyCodeText = $('planner-lobby-code-text');
const lobbyCodeCopy = $('planner-lobby-code-copy');
const lobbySeats = $('planner-lobby-seats');
const lobbyCount = $('planner-lobby-count');
const lobbyCancel = $('planner-lobby-cancel');
const lobbyStartNow = $('planner-lobby-start-now');

const awaitingBd = $('planner-awaiting-bd');
const resultsBd = $('planner-results-bd');
const leaderboardEl = $('planner-leaderboard');
const breakdownEl = $('planner-breakdown');
const reviewBtn = $('planner-review-btn');
const againBtn = $('planner-again-btn');

const reviewBd = $('planner-review-bd');
const reviewTitle = $('planner-review-title');
const reviewSub = $('planner-review-sub');
const reviewBody = $('planner-review-body');
const reviewClose = $('planner-review-close');

let cancelled = false;
let startNowFn = null;
let lastReview = null;

// ── Setup state ──────────────────────────────────────────────────────────
const mem = createSetupMemory('planner');
let mode = mem.get('mode', 'multiplayer', ['multiplayer', 'versus']);
let roomSize = mem.get('roomSize', 5, [5, 10]);
let pace = mem.get('pace', 32, PACES.map((p) => p.value));
let roomAction = mem.get('roomAction', 'quickfill', ['quickfill', 'create', 'join']);
if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create';
let difficulty = mem.get('difficulty', 'medium', DIFFICULTY_KEYS);
let format = mem.get('format', 'events', ['events', 'week']);

// Content count + word, per format (events schedule N events; a week times N cells).
const contentCount = (f, k) => (f === 'week' ? weekCellCount(k) : eventCount(k));
const countWord = (f) => (f === 'week' ? 'activities' : 'events');

function getCurrentUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = auth.onAuthStateChanged((user) => { if (user) { unsub(); resolve(user); } });
  });
}

function updateStartLabel() {
  if (mode === 'multiplayer') {
    startLabel.textContent =
      roomAction === 'join' ? 'Join Room' : roomAction === 'create' ? 'Create Room' : 'Find a Room';
    return;
  }
  startLabel.textContent = roomAction === 'join' ? 'Join Room' : 'Create Room';
}

// ── Game name ──────────────────────────────────
nameInput.value = localStorage.getItem(NAME_KEY) || '';
nameInput.addEventListener('input', () => localStorage.setItem(NAME_KEY, nameInput.value));
getCurrentUser().then((user) => { if (!nameInput.value && user.displayName) nameInput.value = user.displayName; });
function myName() {
  return (nameInput.value || '').trim() || (auth.currentUser && auth.currentUser.displayName) || 'Player';
}

/* ── SECTION 1 — Player ───────────────────────────────────────── */
const player = createCarousel(playerMount);
player.addSlide('name', 'Name', () => {});
player.addSlide('avatar', 'Avatar', () => {});
renderCustomStep(player, 'name', {
  title: 'What should we call you?', content: nameInput, nextLabel: 'Next',
  onNext: () => player.goTo('avatar'),
});
renderCustomStep(player, 'avatar', {
  title: 'Pick your avatar', content: avatarGrid, nextLabel: 'Next',
  onNext: () => flow.next(),
});
player.start('name');

/* ── SECTION 2 — Format + Difficulty ──────────────────────────── */
const content = createCarousel(topicMount);
content.addSlide('format', 'Planner', () => {});
content.addSlide('difficulty', 'Difficulty', () => {});
function renderDifficultyStep() {
  renderChoiceStep(content, 'difficulty', {
    title: format === 'week' ? 'How full a week?' : 'How big a day to plan?',
    subtitle: format === 'week'
      ? 'More activities means more of the timetable to time — the clock grows to match.'
      : 'More events means a longer chain of clues to work through — the clock grows to match.',
    name: 'planner-difficulty', colorOffset: 2,
    options: DIFFICULTY_KEYS.map((k) => ({
      value: k, label: `${DIFF_LABEL[k]} · ${contentCount(format, k)} ${countWord(format)}`, checked: k === difficulty,
    })),
    onPick: (v) => { difficulty = v; mem.save({ difficulty }); flow.next(); },
  });
}
renderChoiceStep(content, 'format', {
  title: 'Which planner?',
  subtitle: 'Schedule one day’s events, or fill in a whole week’s routine.',
  name: 'planner-format',
  options: [
    { value: 'events', label: 'Events', checked: format === 'events' },
    { value: 'week', label: 'Weekly routine', checked: format === 'week' },
  ],
  onPick: (v) => { format = v; mem.save({ format }); renderDifficultyStep(); content.goTo('difficulty'); },
});
renderDifficultyStep();
content.start('format');

/* ── SECTION 3 — Game Options ───────────────────────────────── */
const options = createCarousel(optionsMount);
options.addSlide('mode', 'Mode', () => {});
options.addSlide('size', 'Room Size', () => {});
options.addSlide('time', 'Time Limit', () => {});
renderChoiceStep(options, 'mode', {
  title: 'How do you want to play?',
  name: 'planner-mode',
  options: [
    { value: 'multiplayer', label: 'Multiplayer', checked: mode === 'multiplayer' },
    { value: 'versus', label: 'Versus', checked: mode === 'versus' },
  ],
  onPick: (v) => {
    mode = v;
    if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create';
    mem.save({ mode, roomAction });
    renderRoomEntry();
    roomCarousel.start('entry');
    codeInput.hidden = roomAction !== 'join';
    updateStartLabel();
    options.goTo(mode === 'versus' ? 'time' : 'size');
  },
});
renderChoiceStep(options, 'size', {
  title: 'How many players?',
  name: 'planner-size', colorOffset: 2,
  options: [
    { value: '5', label: '5 players', checked: roomSize === 5 },
    { value: '10', label: '10 players', checked: roomSize === 10 },
  ],
  onPick: (v) => { roomSize = Number(v); mem.save({ roomSize }); options.goTo('time'); },
});
renderChoiceStep(options, 'time', {
  title: 'How long on the clock?',
  subtitle: 'Set from the number of events and clues, so every difficulty is equally tight.',
  name: 'planner-time', colorOffset: 4,
  options: PACES.map((p) => ({ value: String(p.value), label: p.label, checked: p.value === pace })),
  onPick: (v) => { pace = Number(v); mem.save({ pace }); flow.next(); },
});
options.start('mode');

/* ── SECTION 4 — Room ─────────────────────────────────────── */
const roomCarousel = createCarousel(roomMount);
roomCarousel.addSlide('entry', 'Room', () => {});
roomCarousel.addSlide('code', 'Code', () => {});
function renderRoomEntry() {
  const choices = mode === 'multiplayer'
    ? [
        { value: 'quickfill', label: 'Quickfill', checked: roomAction === 'quickfill' },
        { value: 'create', label: 'Create', checked: roomAction === 'create' },
        { value: 'join', label: 'Join', checked: roomAction === 'join' },
      ]
    : [
        { value: 'create', label: 'Create', checked: roomAction === 'create' },
        { value: 'join', label: 'Join', checked: roomAction === 'join' },
      ];
  renderChoiceStep(roomCarousel, 'entry', {
    title: mode === 'multiplayer' ? 'How do you want to join?' : 'Create or join the 1v1?',
    name: 'planner-room-action', colorOffset: 2, options: choices,
    onPick: (v) => {
      roomAction = v;
      mem.save({ roomAction });
      codeInput.hidden = v !== 'join';
      updateStartLabel();
      if (v === 'join') roomCarousel.goTo('code');
    },
  });
}
renderCustomStep(roomCarousel, 'code', {
  title: 'Enter the room code',
  subtitle: 'The 6-character code your friend shared.',
  content: codeInput,
});
renderRoomEntry();
roomCarousel.start('entry');

/* ── One selector on screen at a time ───────────────────────── */
const flow = createSectionFlow([
  { el: $('planner-section-player'), chips: () => playerChips(myName(), avatarUrl(getAvatarSeed())) },
  {
    el: $('planner-section-topic'),
    chips: () => [
      { label: format === 'week' ? 'Weekly routine' : 'Events' },
      { label: DIFF_LABEL[difficulty] },
      { label: `${contentCount(format, difficulty)} ${countWord(format)}` },
    ],
  },
  {
    el: $('planner-section-options'),
    chips: () => {
      const p = PACES.find((x) => x.value === pace) || PACES[1];
      return optionsChips({ mode, roomSize, timeLabel: `${p.label} clock` });
    },
  },
  { el: $('planner-section-room'), chips: () => roomChips(roomAction) },
], {
  onChange: (_i, isLast) => { startBtn.hidden = !isLast; },
});

updateStartLabel();
mountAvatarPicker({ grid: avatarGrid, uploadInput: avatarUploadInput, radioName: 'planner-avatar' });

// ── Lobby ────────────────────────────────────────────────────────────────
let lobbyRevealTimers = [];
function clearLobbyReveal() { lobbyRevealTimers.forEach((t) => clearTimeout(t)); lobbyRevealTimers = []; }
function seatSticker(i, avatarSeed, label) {
  const s = document.createElement('span');
  const empty = !avatarSeed;
  s.className = `pp-sticky pp-sticky--tape pp-lobby-seat ${empty ? 'is-empty' : stickyColor(i)}`;
  s.innerHTML = empty
    ? '<span class="pp-lobby-seat-mark">?</span>'
    : `<img src="${avatarUrl(avatarSeed)}" alt="" loading="lazy" /><span>${label}</span>`;
  return s;
}
function renderLobbySeats(playerCount, size) {
  lobbySeats.innerHTML = '';
  for (let i = 0; i < size; i++) {
    if (i === 0) lobbySeats.appendChild(seatSticker(i, getAvatarSeed(), 'You'));
    else if (i < playerCount) lobbySeats.appendChild(seatSticker(i, `Guest${i}`, 'Player'));
    else lobbySeats.appendChild(seatSticker(i, null));
  }
}
function revealBotsStaggered(size, botsNeeded, seed, revealMs) {
  clearLobbyReveal();
  if (!botsNeeded) return;
  const realFilled = size - botsNeeded;
  const weights = Array.from({ length: botsNeeded }, () => 0.5 + Math.random());
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const budget = Math.max(300, revealMs - 150);
  let elapsed = 0;
  weights.forEach((w, i) => {
    elapsed += (w / weightSum) * budget;
    const seatIndex = realFilled + i;
    lobbyRevealTimers.push(setTimeout(() => {
      const seatEl = lobbySeats.children[seatIndex];
      if (!seatEl) return;
      const name = botName(seed, i);
      seatEl.replaceWith(seatSticker(seatIndex, name, name));
    }, elapsed));
  });
}
function showLobby(size) {
  cancelled = false;
  clearLobbyReveal();
  startNowFn = null;
  lobbyStartNow.hidden = true;
  lobbyStartNow.disabled = false;
  lobbyCode.hidden = true;
  lobbyStatus.textContent = 'Waiting for other players…';
  lobbyCount.textContent = `1 / ${size}`;
  renderLobbySeats(1, size);
  lobbyBd.classList.add('open');
  lobbyBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('planner-nav-hidden');
}
function hideLobby() {
  clearLobbyReveal();
  lobbyBd.classList.remove('open');
  lobbyBd.setAttribute('aria-hidden', 'true');
}
function showLobbyCode(code) { lobbyCode.hidden = false; lobbyCodeText.textContent = code; }
lobbyCodeCopy.addEventListener('click', () => {
  const code = lobbyCodeText.textContent || '';
  if (!code || !navigator.clipboard) return;
  navigator.clipboard.writeText(code).then(() => {
    lobbyCodeCopy.textContent = 'Copied!';
    setTimeout(() => { lobbyCodeCopy.textContent = 'Copy'; }, 1500);
  }).catch(() => {});
});

function showAwaiting() { awaitingBd.classList.add('open'); awaitingBd.setAttribute('aria-hidden', 'false'); }
function hideAwaiting() { awaitingBd.classList.remove('open'); awaitingBd.setAttribute('aria-hidden', 'true'); }

function buildRoster({ size, botsNeeded, seed }, name) {
  const realOthers = Math.max(0, size - botsNeeded - 1);
  const roster = [{ name, isSelf: true }];
  for (let i = 0; i < realOthers; i++) roster.push({ name: 'Player', isSelf: false });
  for (let i = 0; i < botsNeeded; i++) roster.push({ name: botName(seed, i), isSelf: false });
  return roster;
}

// ── Results ──────────────────────────────────────────────────────────────
function fmtTime(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function renderResults(ranked, settled = true) {
  const repaint = resultsBd.classList.contains('open');
  renderLeaderboard(leaderboardEl, ranked, {
    settled, repaint,
    meta: (row) => `${row.score} points`,
    pendingLabel: (s) => (s ? 'no score' : 'still planning…'),
  });
  renderBreakdown();
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('planner-nav-hidden');
}

function renderBreakdown() {
  breakdownEl.innerHTML = '';
  if (!lastReview) { breakdownEl.hidden = true; return; }
  if (lastReview.format === 'week') {
    const { timesCorrect, timeCount, coreDays, dayCount, othersOk, otherCount } = lastReview;
    const p = document.createElement('p');
    p.className = 'pp-breakdown-title'; p.textContent = 'How you did';
    breakdownEl.appendChild(p);
    const row = document.createElement('div');
    row.className = 'pp-breakdown-row';
    [['Times', `${timesCorrect}/${timeCount}`], ['Cores lead', `${coreDays}/${dayCount}`], ['Others ×2', `${othersOk}/${otherCount}`]]
      .forEach(([label, val], i) => {
        const cell = document.createElement('span');
        cell.className = `pp-sticky pp-sticky--tape pp-bd-cell ${stickyColor(i + 1)}`;
        cell.innerHTML = `<span class="pp-bd-label">${label}</span><span class="pp-bd-score">${val}</span>`;
        row.appendChild(cell);
      });
    breakdownEl.appendChild(row);
    breakdownEl.hidden = false;
    return;
  }
  const { sequenceCorrect, timeCorrect, N } = lastReview;
  const p = document.createElement('p');
  p.className = 'pp-breakdown-title';
  p.textContent = 'How you did';
  breakdownEl.appendChild(p);
  const row = document.createElement('div');
  row.className = 'pp-breakdown-row';
  [['Sequence', sequenceCorrect], ['Timing', timeCorrect]].forEach(([label, val], i) => {
    const cell = document.createElement('span');
    cell.className = `pp-sticky pp-sticky--tape pp-bd-cell ${stickyColor(i + 1)}`;
    cell.innerHTML = `<span class="pp-bd-label">${label}</span><span class="pp-bd-score">${val}/${N}</span>`;
    row.appendChild(cell);
  });
  breakdownEl.appendChild(row);
  breakdownEl.hidden = false;
}

function hideResults() {
  resultsBd.classList.remove('open');
  resultsBd.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('planner-nav-hidden');
}

// ── Review — the correct schedule vs what you set ─────────────────────────
function renderReview() {
  if (!lastReview) return;
  if (lastReview.format === 'week') { renderWeekReview(); return; }
  const { review, sequenceCorrect, timeCorrect, N } = lastReview;
  reviewTitle.textContent = 'The correct schedule';
  reviewSub.textContent = `${sequenceCorrect}/${N} in order · ${timeCorrect}/${N} on time`;
  reviewBody.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'planner-review-table';
  const rows = review.slice().sort((a, b) => a.trueRank - b.trueRank);
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    const seqOk = r.placedRank === r.trueRank;
    const timeOk = r.chosenTime === r.trueTime;
    tr.innerHTML =
      `<td class="planner-rev-time">${fmtClock(r.trueTime)}</td>` +
      `<td class="planner-rev-name">${esc(r.name)}</td>` +
      `<td class="planner-rev-mark is-${seqOk ? 'ok' : 'no'}">${seqOk ? 'in order' : 'out of order'}</td>` +
      `<td class="planner-rev-mark is-${timeOk ? 'ok' : 'no'}">${timeOk ? 'on time' : (r.chosenTime != null ? `you: ${fmtClock(r.chosenTime)}` : 'no time set')}</td>`;
    reviewBody.appendChild(tr);
  });
  reviewBd.classList.add('open');
  reviewBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('planner-nav-hidden');
}
// One valid Mon–Fri timetable — the column times marked against what you set, the
// day rows marked by whether YOUR week led with the three cores, and a rule tally.
function renderWeekReview() {
  const { timeReview, columns, grid, dayReview, timesCorrect, timeCount, coreDays, dayCount, othersOk, otherCount } = lastReview;
  const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  reviewTitle.textContent = 'One correct timetable';
  reviewSub.textContent = `Cores led ${coreDays}/${dayCount} · each other ≥2× ${othersOk}/${otherCount} · times ${timesCorrect}/${timeCount}`;
  reviewBody.innerHTML = '';
  const scroll = document.createElement('div');
  scroll.className = 'planner-week-scroll';
  const table = document.createElement('table');
  table.className = 'planner-week planner-week--review';

  let head = '<th class="planner-week-corner"></th>';
  columns.forEach((col, c) => {
    const t = timeReview.find((x) => x.col === c) || {};
    const ok = t.chosen === t.trueTime;
    head += `<th class="planner-week-colh is-rev is-${ok ? 'ok' : 'no'}${col.kind === 'break' ? ' is-break' : ''}">`
      + `<span class="planner-colh-ord">${col.kind === 'break' ? esc(col.label) : (ORD[col.ord - 1] || '#' + col.ord)}</span>`
      + `<span class="planner-rev-time">${fmtClock(t.trueTime)}</span>`
      + (ok ? '' : `<span class="planner-rev-you">${t.chosen != null ? 'you: ' + fmtClock(t.chosen) : '—'}</span>`)
      + '</th>';
  });
  const thead = document.createElement('thead');
  const htr = document.createElement('tr'); htr.className = 'planner-week-row'; htr.innerHTML = head;
  thead.appendChild(htr); table.appendChild(thead);

  const tbody = document.createElement('tbody');
  grid.forEach((row, di) => {
    const dOk = dayReview[di] ? dayReview[di].ok : true;
    let html = `<th class="planner-week-day is-rev is-${dOk ? 'ok' : 'no'}">${esc(row.name.slice(0, 3))}</th>`;
    row.cells.forEach((cell) => {
      if (cell.kind === 'break') { html += `<td class="planner-week-cell is-break"><span class="planner-break-label">${esc(cell.label)}</span></td>`; return; }
      html += `<td class="planner-week-cell"><span class="planner-cell-act">${esc(cell.subject)}</span></td>`;
    });
    const tr = document.createElement('tr'); tr.className = 'planner-week-row'; tr.innerHTML = html;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scroll.appendChild(table);
  reviewBody.appendChild(scroll);
  reviewBd.classList.add('open');
  reviewBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('planner-nav-hidden');
}

function fmtClock(min) {
  if (min == null) return '—';
  const h24 = Math.floor(min / 60); const m = min % 60; const ap = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
function esc(s) { const d = document.createElement('span'); d.textContent = s == null ? '' : s; return d.innerHTML; }
function hideReview() { reviewBd.classList.remove('open'); reviewBd.setAttribute('aria-hidden', 'true'); }

// ── Round orchestration ───────────────────────────────────────────────────
async function playRoundAndShowResults(room, name) {
  const roster = buildRoster(room, name);
  const out = await startPlanRound({
    seed: room.seed, timeLimit: room.timeLimit, startAt: room.startAt,
    difficulty: room.difficulty || 'medium', format: room.format || 'events', roster,
  });
  lastReview = out;
  showAwaiting();

  let ranked;
  try {
    ranked = await finishRound({
      roomId: room.roomId, seed: room.seed, timeLimit: room.timeLimit, startAt: room.startAt,
      botsNeeded: room.botsNeeded, difficulty: room.difficulty, format: room.format,
      onUpdate: (rows) => {
        hideAwaiting();
        const me = rows.find((r) => r.isSelf);
        if (me) me.avatarSeed = getAvatarSeed();
        renderResults(rows, false);
      },
      myScore: out.score,
    });
  } catch (e) {
    console.error('[planner] finishRound failed — local-only board:', e);
    ranked = [{ name, score: out.score, isBot: false, isSelf: true, avatarSeed: getAvatarSeed() }];
  }
  const selfRow = ranked.find((r) => r.isSelf);
  if (selfRow) selfRow.avatarSeed = getAvatarSeed();
  hideAwaiting();
  startBtn.disabled = false;
  renderResults(ranked);
}

function makeOnWaiting(waitingStatusText) {
  return (state) => {
    if (state.phase === 'activated') {
      startNowFn = null;
      lobbyStartNow.hidden = true;
      lobbyStatus.textContent = 'Room ready!';
      lobbyCount.textContent = `${state.size} / ${state.size}`;
      revealBotsStaggered(state.size, state.botsNeeded, state.seed, state.revealMs);
      return;
    }
    if (waitingStatusText) lobbyStatus.textContent = waitingStatusText;
    lobbyCount.textContent = `${state.playerCount} / ${state.size}`;
    renderLobbySeats(state.playerCount, state.size);
    startNowFn = state.startNow || null;
    lobbyStartNow.hidden = !(startNowFn && state.playerCount >= 2 && state.playerCount < state.size);
  };
}

function computeTimeLimit() {
  let secs;
  if (format === 'week') {
    // ~6 clued rules to read, then set each column time + place each cell.
    const items = weekScored(difficulty);
    secs = items * (pace * 0.5) + 6 * READ_PER_CLUE + 30;
  } else {
    const N = eventCount(difficulty);
    secs = N * pace + (N + 1) * READ_PER_CLUE;
  }
  return Math.max(MIN_ROUND_SEC, Math.min(MAX_ROUND_SEC, Math.round(secs)));
}

async function runMultiplayer(name) {
  showLobby(roomSize);
  const timeLimit = computeTimeLimit();
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size: roomSize, timeLimit, difficulty, format, displayName: name },
      { onWaiting: makeOnWaiting() },
    );
  } catch (e) {
    hideLobby(); startBtn.disabled = false;
    alert(e && e.quotaBlocked ? e.message : "Couldn't start a room — please try again.");
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, name);
}

async function runCreate(name, size, roomMode) {
  showLobby(size);
  lobbyStatus.textContent = 'Creating your room…';
  const timeLimit = computeTimeLimit();
  let created;
  try {
    created = await createCodeRoom(
      { mode: roomMode, size, timeLimit, difficulty, format, displayName: name },
      { onWaiting: makeOnWaiting(roomMode === 'versus' ? 'Waiting for your opponent…' : 'Waiting for other players…') },
    );
  } catch (e) {
    hideLobby(); startBtn.disabled = false;
    alert(e && e.quotaBlocked ? e.message : "Couldn't create a room — please try again.");
    return;
  }
  showLobbyCode(created.code);
  let room;
  try { room = await created.roundReady; } catch (e) {
    hideLobby(); startBtn.disabled = false;
    alert('Something went wrong waiting for other players — please try again.');
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, name);
}

async function runJoin(name, fallbackSize, rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (code.length !== 6) { alert('Enter the 6-character room code your friend shared.'); startBtn.disabled = false; return; }
  showLobby(fallbackSize);
  lobbyStatus.textContent = 'Joining room…';
  let room;
  try {
    room = await joinRoomByCode(code, { displayName: name, onWaiting: makeOnWaiting('Waiting for the round to start…') });
  } catch (e) {
    hideLobby(); startBtn.disabled = false;
    alert((e && e.message) || "Couldn't join that room.");
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, name);
}

async function runPlanner() {
  startBtn.disabled = true;
  mem.save({ difficulty, format, done: true });
  await getCurrentUser();
  const name = myName();
  if (mode === 'versus') {
    if (roomAction === 'join') await runJoin(name, 2, codeInput.value);
    else await runCreate(name, 2, 'versus');
    return;
  }
  if (roomAction === 'join') await runJoin(name, roomSize, codeInput.value);
  else if (roomAction === 'create') await runCreate(name, roomSize, 'multiplayer');
  else await runMultiplayer(name);
}

// ── Wiring ───────────────────────────────────────────────────────────────
reviewBtn.addEventListener('click', renderReview);
reviewClose.addEventListener('click', hideReview);
reviewBd.addEventListener('click', (e) => { if (e.target === reviewBd) hideReview(); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (reviewBd.classList.contains('open')) hideReview();
});
startBtn.addEventListener('click', runPlanner);

quickJoinInput.addEventListener('input', () => {
  quickJoinInput.value = quickJoinInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
});
quickJoinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); quickJoinBtn.click(); } });
quickJoinBtn.addEventListener('click', async () => {
  const code = quickJoinInput.value.trim();
  if (code.length !== 6) { quickJoinInput.focus(); return; }
  quickJoinBtn.disabled = true;
  startBtn.disabled = true;
  await getCurrentUser();
  await runJoin(myName(), 2, code);
  quickJoinBtn.disabled = false;
});
lobbyStartNow.addEventListener('click', () => {
  if (!startNowFn) return;
  lobbyStartNow.disabled = true;
  lobbyStartNow.hidden = true;
  lobbyStatus.textContent = 'Starting…';
  startNowFn();
});
lobbyCancel.addEventListener('click', () => {
  cancelled = true;
  hideLobby();
  document.body.classList.remove('planner-nav-hidden');
  startBtn.disabled = false;
});
againBtn.addEventListener('click', hideResults);

if (new URLSearchParams(location.search).get('mode') === 'versus') {
  mode = 'versus';
  if (roomAction === 'quickfill') roomAction = 'create';
  renderRoomEntry();
  updateStartLabel();
}

if (mem.isReturning()) {
  codeInput.hidden = roomAction !== 'join';
  flow.goTo(3);
}
