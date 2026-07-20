/* ═══════════════════════════════════════════════════════
   GRAMMAR — page orchestrator

   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays. Same shape as the Drills
   and Vocab pages — what changes is the content section (Grade -> Theme ->
   CUPS focus) and that a "point" here is an error caught OR correctly named.

   Grade comes FIRST because the themes depend on it: a Grade 4 child is
   offered diary entries and stories, a Grade 11 student formal letters, news
   reports and lab write-ups. The two tiers overlap but never fully collapse.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import {
  GRADES, THEMES, themeMeta, availableThemes,
  CUPS, CUPS_KEYS, CUPS_LABEL, focusKey, focusSet, focusLabel,
  loadPassages, passagePool, buildPassage,
} from '/data/grammar/index.js';
import { createSetupMemory } from '/utils/games/setup-memory.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound, rankGrammar } from './leaderboard.js';
import {
  createCarousel, createSectionFlow, renderChoiceStep, renderCustomStep, renderMultiStep,
} from '/utils/components/setup-carousel.js';
import { avatarUrl, getAvatarSeed, mountAvatarPicker } from '/utils/components/avatar-picker.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

const NAME_KEY = 'drillGameName';

/* The clock. Editing rewards speed AND care, so the round is fixed-length —
   there is no "finish the last word" to end on, only the moment you decide you
   are done. The length itself is derived, not typed in:

       timeLimit = averageWords × READ_SEC_PER_WORD + averageErrors × pace

   Two terms because two things take time: READING the passage at all (which
   scales with its length) and WORKING each error (which scales with how many
   were planted). A flat five minutes would be luxurious on a short diary entry
   and impossible on a lab report.

   It is averaged over the whole pool rather than measured on the actual
   passage, because the clock has to be fixed BEFORE the room exists — and the
   room's seed is what picks the passage. Averaging is seed-free, so every
   client computes the same number and the room shares one clock. */
const PACES = [
  { value: 22, label: 'Relaxed' },
  { value: 16, label: 'Normal', checked: true },
  { value: 11, label: 'Fast' },
];
const READ_SEC_PER_WORD = 0.4; // proof-reading pace, not reading pace
const MIN_ROUND_SEC = 90;
const MAX_ROUND_SEC = 1800;

/* How many passages the round deals. They are paged through one at a time (see
   game.js), so this is a length dial, not a difficulty one — three passages is
   the same work per passage, three times over, on a clock scaled to match.

   Capped at three because the clock is: a Relaxed three-passage round is
   already fifteen minutes, and MAX_ROUND_SEC is the real ceiling on how long a
   child will proof-read carefully before they start guessing. */
const PASSAGE_COUNTS = [1, 2, 3];

const TROPHY_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" fill="var(--ink)"/>
  <path d="M7 5H4a3 3 0 0 0 3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M17 5h3a3 3 0 0 1-3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="10.5" y="12" width="3" height="4" fill="var(--ink)"/>
  <rect x="8" y="16.4" width="8" height="2.4" rx="1" fill="var(--ink)"/>
</svg>`;

const nameInput = $('grammar-name-input');
const avatarGrid = $('grammar-avatar-grid');
const avatarUploadInput = $('grammar-avatar-upload-input');
const playerMount = $('grammar-player-carousel');
const topicMount = $('grammar-topic-carousel');
const optionsMount = $('grammar-options-carousel');
const roomMount = $('grammar-room-carousel');
const codeInput = $('grammar-code-input');
const quickJoinInput = $('grammar-quickjoin-input');
const quickJoinBtn = $('grammar-quickjoin-btn');
const startBtn = $('grammar-start-btn');
const startLabel = $('grammar-start-label');
const studyBtn = $('grammar-study-btn');
const rulesBd = $('grammar-rules-bd');
const rulesList = $('grammar-rules-list');
const rulesClose = $('grammar-rules-close');

const lobbyBd = $('grammar-lobby-bd');
const lobbyStatus = $('grammar-lobby-status');
const lobbyCode = $('grammar-lobby-code');
const lobbyCodeText = $('grammar-lobby-code-text');
const lobbyCodeCopy = $('grammar-lobby-code-copy');
const lobbySeats = $('grammar-lobby-seats');
const lobbyCount = $('grammar-lobby-count');
const lobbyCancel = $('grammar-lobby-cancel');
const lobbyStartNow = $('grammar-lobby-start-now');

const awaitingBd = $('grammar-awaiting-bd');
const resultsBd = $('grammar-results-bd');
const leaderboardEl = $('grammar-leaderboard');
const breakdownEl = $('grammar-breakdown');
const reviewBtn = $('grammar-review-btn');
const againBtn = $('grammar-again-btn');

const reviewBd = $('grammar-review-bd');
const reviewTitle = $('grammar-review-title');
const reviewSub = $('grammar-review-sub');
const reviewBody = $('grammar-review-body');
const reviewClose = $('grammar-review-close');

let cancelled = false;
let startNowFn = null;
// The last round's per-token breakdown, kept so the review overlay can be
// reopened from the results screen without replaying anything.
let lastReview = null;

// ── Setup state ─────────────────────────────────────────────────────────
// Owned in JS, not read back out of `input:checked` — a carousel only renders
// the step you're on, so a DOM-query getter would throw for any step the
// player never opened. Every field starts from the player's LAST game.
const mem = createSetupMemory('grammar');
let mode = mem.get('mode', 'multiplayer', ['multiplayer', 'versus']);
let roomSize = mem.get('roomSize', 5, [5, 10]);
let pace = mem.get('pace', 16, PACES.map((p) => p.value));
let roomAction = mem.get('roomAction', 'quickfill', ['quickfill', 'create', 'join']);
if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create';
let grade = mem.get('grade', 6, GRADES);
let theme = mem.get('theme', 'diary', (t) => availableThemes(grade).includes(t));
let focus = mem.get('focus', 'cups', (f) => typeof f === 'string' && /^[cups]+$/.test(f));
let passageCount = mem.get('count', 1, PASSAGE_COUNTS);
if (!availableThemes(grade).includes(theme)) theme = availableThemes(grade)[0] || 'diary';

function getCurrentUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) { unsub(); resolve(user); }
    });
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
getCurrentUser().then((user) => {
  if (!nameInput.value && user.displayName) nameInput.value = user.displayName;
});

function myName() {
  return (nameInput.value || '').trim() || (auth.currentUser && auth.currentUser.displayName) || 'Player';
}

/* ── SECTION 1 — Player ───────────────────────────────────────── */
const player = createCarousel(playerMount);
player.addSlide('name', 'Name', () => {});
player.addSlide('avatar', 'Avatar', () => {});

renderCustomStep(player, 'name', {
  title: 'What should we call you?',
  content: nameInput,
  nextLabel: 'Next',
  onNext: () => player.goTo('avatar'),
});
renderCustomStep(player, 'avatar', {
  title: 'Pick your avatar',
  content: avatarGrid,
  nextLabel: 'Next',
  onNext: () => flow.next(),
});
player.start('name');

/* ── SECTION 2 — What to edit ──────────────────────────────────
   Grade → Theme → CUPS focus. Grade leads because the theme list depends on
   it. The focus step is last because it narrows what you hunt for, and that
   only makes sense once you know what you are reading. */
const content = createCarousel(topicMount);
content.addSlide('grade', 'Grade', () => {});
content.addSlide('theme', 'Theme', () => {});
content.addSlide('focus', 'CUPS', () => {});
content.addSlide('count', 'Length', () => {});

function renderGradeStep() {
  renderChoiceStep(content, 'grade', {
    title: 'Which grade?',
    name: 'grammar-grade',
    options: GRADES.map((g) => ({ value: String(g), label: `Grade ${g}`, checked: g === grade })),
    onPick: (v) => {
      grade = Number(v);
      // The old theme may not be written for the new grade (a lab report at
      // Grade 4), so fall back to the first one that is.
      const available = availableThemes(grade);
      if (!available.includes(theme)) theme = available[0];
      renderThemeStep();
      content.goTo('theme');
    },
  });
}

function renderThemeStep() {
  const available = availableThemes(grade);
  renderChoiceStep(content, 'theme', {
    title: 'What kind of passage?',
    subtitle: grade >= 9 ? 'Formal writing is where the marks are at this level.' : 'Everyday writing, at your reading level.',
    name: 'grammar-theme',
    colorOffset: 2,
    options: available.map((key) => ({
      value: key, label: THEMES[key].label, note: THEMES[key].blurb ? null : undefined,
    checked: key === theme })),
    onPick: (v) => {
      theme = v;
      // Warm the bank now rather than during the 3-2-1 countdown: startAt is
      // fixed for the whole room, so a slow fetch there would eat into this
      // player's clock while everyone else was already reading.
      loadPassages(theme).catch(() => {});
      renderFocusStep();
      content.goTo('focus');
    },
  });
}

/* The CUPS focus. Ticking nothing (or everything) is the full checklist.
   An unticked category is NOT removed from the passage — those errors are
   handed over already corrected and never scored (see data/grammar/index.js),
   so the prose stays coherent and only the hunt narrows. */
function renderFocusStep() {
  const picked = new Set(focusSet(focus));
  renderMultiStep(content, 'focus', {
    title: 'Which mistakes are you hunting?',
    subtitle: 'Tick the CUPS letters to be scored on — none (or all) plays the full checklist. The rest come pre-corrected.',
    colorOffset: 3,
    options: CUPS.map((c) => ({ value: c.key, label: c.label })),
    isChecked: (v) => picked.has(v),
    onToggle: (v, on) => { if (on) picked.add(v); else picked.delete(v); },
    nextLabel: 'Next',
    onNext: () => {
      focus = focusKey([...picked]);
      mem.save({ grade, theme, focus });
      renderCountStep();
      content.goTo('count');
    },
  });
}

/* How many passages. They arrive one at a time with a Next button between them
   (see game.js's paging), so this buys a longer round rather than a busier
   screen — and the clock scales with it, so three passages is not three times
   the hurry.

   A theme narrower than the count deals short rather than repeating a passage
   (see rng.js), which is why the subtitle promises "up to". */
function renderCountStep() {
  renderChoiceStep(content, 'count', {
    title: 'How many passages?',
    subtitle: 'They come one at a time — edit one, press Next for the following one. One Submit covers them all, and the clock grows to match.',
    name: 'grammar-count',
    colorOffset: 1,
    options: PASSAGE_COUNTS.map((n) => ({
      value: String(n),
      label: n === 1 ? 'One passage' : `Up to ${n} passages`,
      checked: n === passageCount,
    })),
    onPick: (v) => {
      passageCount = Number(v);
      mem.save({ grade, theme, focus, count: passageCount });
      flow.next();
    },
  });
}

renderGradeStep();
renderThemeStep();
renderFocusStep();
renderCountStep();
content.start('grade');

/* ── SECTION 3 — Game Options ───────────────────────────────── */
const options = createCarousel(optionsMount);
options.addSlide('mode', 'Mode', () => {});
options.addSlide('size', 'Room Size', () => {});
options.addSlide('time', 'Time Limit', () => {});

renderChoiceStep(options, 'mode', {
  title: 'How do you want to play?',
  name: 'grammar-mode',
  options: [
    { value: 'multiplayer', label: 'Multiplayer', checked: mode === 'multiplayer' },
    { value: 'versus', label: 'Versus (1v1)', checked: mode === 'versus' },
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
  name: 'grammar-size',
  colorOffset: 2,
  options: [
    { value: '5', label: '5 players', checked: roomSize === 5 },
    { value: '10', label: '10 players', checked: roomSize === 10 },
  ],
  onPick: (v) => { roomSize = Number(v); mem.save({ roomSize }); options.goTo('time'); },
});
renderChoiceStep(options, 'time', {
  title: 'How long on the clock?',
  subtitle: 'Set from how long the passage is and how many errors it holds, so every theme is equally tight.',
  name: 'grammar-time',
  colorOffset: 4,
  options: PACES.map((p) => ({ value: String(p.value), label: p.label, checked: p.value === pace })),
  onPick: (v) => { pace = Number(v); mem.save({ pace }); flow.next(); },
});
options.start('mode');

/* ── SECTION 4 — Room ─────────────────────────────────────── */
const roomCarousel = createCarousel(roomMount);
roomCarousel.addSlide('entry', 'Room', () => {});
roomCarousel.addSlide('code', 'Code', () => {});

function renderRoomEntry() {
  const choices =
    mode === 'multiplayer'
      ? [
          { value: 'quickfill', label: 'Quick Fill', checked: roomAction === 'quickfill' },
          { value: 'create', label: 'Create Room', checked: roomAction === 'create' },
          { value: 'join', label: 'Join with Code', checked: roomAction === 'join' },
        ]
      : [
          { value: 'create', label: 'Create Room', checked: roomAction === 'create' },
          { value: 'join', label: 'Join with Code', checked: roomAction === 'join' },
        ];

  renderChoiceStep(roomCarousel, 'entry', {
    title: mode === 'multiplayer' ? 'How do you want to join?' : 'Create or join the 1v1?',
    name: 'grammar-room-action',
    colorOffset: 2,
    options: choices,
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
  {
    el: $('grammar-section-player'),
    chips: () => [{ label: myName(), avatar: avatarUrl(getAvatarSeed()) }],
  },
  {
    el: $('grammar-section-topic'),
    chips: () => [
      { label: `Grade ${grade}` },
      { label: (themeMeta(theme) || {}).label || 'Passage' },
      { label: focusLabel(focus) },
      { label: passageCount === 1 ? '1 passage' : `${passageCount} passages` },
    ],
  },
  {
    el: $('grammar-section-options'),
    chips: () => {
      const p = PACES.find((x) => x.value === pace) || PACES[1];
      return mode === 'versus'
        ? [{ label: 'Versus 1v1' }, { label: `${p.label} clock` }]
        : [{ label: 'Multiplayer' }, { label: `${roomSize} players` }, { label: `${p.label} clock` }];
    },
  },
  {
    el: $('grammar-section-room'),
    chips: () => [{
      label: roomAction === 'quickfill' ? 'Quick Fill' : roomAction === 'create' ? 'Create Room' : 'Join with Code',
    }],
  },
], {
  onChange: (_i, isLast) => {
    startBtn.hidden = !isLast;
    studyBtn.hidden = !isLast;
  },
});

updateStartLabel();

mountAvatarPicker({
  grid: avatarGrid,
  uploadInput: avatarUploadInput,
  radioName: 'grammar-avatar',
});

// ── Lobby ────────────────────────────────────────────────────────────────
let lobbyRevealTimers = [];
function clearLobbyReveal() {
  lobbyRevealTimers.forEach((t) => clearTimeout(t));
  lobbyRevealTimers = [];
}

function seatSticker(i, avatarSeed, label) {
  const el = document.createElement('span');
  const empty = !avatarSeed;
  el.className = `pp-sticky pp-sticky--tape grammar-lobby-seat ${empty ? 'is-empty' : stickyColor(i)}`;
  el.innerHTML = empty
    ? '<span class="grammar-lobby-seat-mark">?</span>'
    : `<img src="${avatarUrl(avatarSeed)}" alt="" loading="lazy" /><span>${label}</span>`;
  return el;
}

function renderLobbySeats(playerCount, size) {
  lobbySeats.innerHTML = '';
  for (let i = 0; i < size; i++) {
    if (i === 0) lobbySeats.appendChild(seatSticker(i, getAvatarSeed(), 'You'));
    else if (i < playerCount) lobbySeats.appendChild(seatSticker(i, `Guest${i}`, 'Player'));
    else lobbySeats.appendChild(seatSticker(i, null));
  }
}

// Bots claim the remaining empty seats one at a time over `revealMs`, at
// randomized intervals, so the lobby reads like people trickling in.
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
    const timer = setTimeout(() => {
      const seatEl = lobbySeats.children[seatIndex];
      if (!seatEl) return;
      const name = botName(seed, i);
      seatEl.replaceWith(seatSticker(seatIndex, name, name));
    }, elapsed);
    lobbyRevealTimers.push(timer);
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
  document.body.classList.add('grammar-nav-hidden');
}
function hideLobby() {
  clearLobbyReveal();
  lobbyBd.classList.remove('open');
  lobbyBd.setAttribute('aria-hidden', 'true');
}
function showLobbyCode(code) {
  lobbyCode.hidden = false;
  lobbyCodeText.textContent = code;
}
lobbyCodeCopy.addEventListener('click', () => {
  const code = lobbyCodeText.textContent || '';
  if (!code || !navigator.clipboard) return;
  navigator.clipboard.writeText(code).then(() => {
    lobbyCodeCopy.textContent = 'Copied!';
    setTimeout(() => { lobbyCodeCopy.textContent = 'Copy'; }, 1500);
  }).catch(() => {});
});

function showAwaiting() {
  awaitingBd.classList.add('open');
  awaitingBd.setAttribute('aria-hidden', 'false');
}
function hideAwaiting() {
  awaitingBd.classList.remove('open');
  awaitingBd.setAttribute('aria-hidden', 'true');
}

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

/* `settled` is false while the room is still finishing. The board is painted
   live from the moment YOU submit — finishers ranked, everyone still working
   shown as pending — so nobody watches a spinner wondering if it broke. Until
   it settles there is no winner, no trophy and no confetti: leading a race
   half the room hasn't finished isn't winning it. */
function renderResults(ranked, errorTotal, settled = true) {
  // A repaint of a board that's already up must not replay the deal-in
  // animation, or every straggler's score restarts the whole stack.
  const repaint = resultsBd.classList.contains('open');
  leaderboardEl.innerHTML = '';
  const total = ranked.length;
  // Competition ranking over the FULL order — score, then speed, then false
  // edits (see leaderboard.js's rankGrammar). Players level on ALL three share
  // a place; a true tie for the top has no winner — nobody is crowned and no
  // confetti flies on a draw. Players who haven't submitted are ranked on
  // nothing at all — they're excluded until their score actually exists.
  const ahead = (a, b) => rankGrammar(a, b) < 0;
  const level = (a, b) => rankGrammar(a, b) === 0;
  const done = ranked.filter((r) => !r.pending);
  const topTie = done.length ? done.filter((r) => level(r, done[0])).length > 1 : false;
  ranked.forEach((row, i) => {
    const rankNum = 1 + done.filter((r) => ahead(r, row)).length;
    const tiedHere = done.filter((r) => level(r, row)).length > 1;
    const isWinner = settled && !row.pending && rankNum === 1 && !topTie;
    const tilt = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3));
    const li = document.createElement('li');
    li.className = [
      'grammar-lb-row', 'pp-sticky', 'pp-sticky--tape',
      isWinner ? '' : stickyColor(i),
      row.isSelf ? 'is-self' : '',
      isWinner ? 'is-winner' : '',
      row.pending ? 'is-pending' : '',
    ].filter(Boolean).join(' ');
    li.style.setProperty('--delay', repaint ? '0ms' : `${(total - 1 - i) * 130}ms`);
    li.style.setProperty('--pp-note-tilt', `${tilt}deg`);

    const avatar = document.createElement('span');
    avatar.className = 'grammar-lb-avatar';
    avatar.innerHTML = `<img src="${avatarUrl(row.avatarSeed || row.name)}" alt="" loading="lazy" />`;

    const rank = document.createElement('span');
    rank.className = 'grammar-lb-rank';
    if (row.pending) rank.textContent = '·'; // no place until there's a score
    else if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = tiedHere ? '=' : String(rankNum);

    const name = document.createElement('span');
    name.className = 'grammar-lb-name';
    name.textContent = row.name;
    const meta = document.createElement('small');
    meta.className = 'grammar-lb-meta';
    // What actually separated them, spelled out: caught, named, time, and the
    // false edits that cost them the tiebreak.
    const bits = [];
    if (row.pending) {
      // On the settled board they are not still editing — they never finished.
      bits.push(settled ? 'no score' : 'still editing…');
    } else {
      if (typeof row.caught === 'number') bits.push(`${row.caught}/${errorTotal} caught`);
      if (typeof row.tagged === 'number') bits.push(`${row.tagged} named`);
      if (typeof row.timeMs === 'number') bits.push(fmtTime(row.timeMs));
      if (row.falseEdits) bits.push(`${row.falseEdits} false`);
    }
    meta.textContent = bits.join(' · ');
    name.appendChild(meta);

    const scoreEl = document.createElement('span');
    scoreEl.className = 'grammar-lb-score';
    scoreEl.textContent = row.pending ? '–' : String(row.score);

    li.append(avatar, rank, name, scoreEl);
    leaderboardEl.appendChild(li);
  });

  renderBreakdown();

  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('grammar-nav-hidden');

  // Only on the settled board, so a lead held while half the room is still
  // editing never fires it — but it must still fire on a board that was
  // painted live, which is why this can't key off the first paint.
  if (settled && ranked[0] && ranked[0].isSelf && !ranked[0].pending && !topTie) {
    setTimeout(launchConfetti, repaint ? 400 : (total - 1) * 130 + 400);
  }
}

/* Your own CUPS breakdown — the part a student can actually act on. "You
   caught every capital and missed three of four usage errors" is a study
   instruction; a leaderboard position is not. */
function renderBreakdown() {
  breakdownEl.innerHTML = '';
  if (!lastReview) { breakdownEl.hidden = true; return; }
  const { byCat, falseEdits } = lastReview.result;
  const cats = CUPS.filter((c) => byCat[c.key]);
  if (!cats.length) { breakdownEl.hidden = true; return; }

  const title = document.createElement('p');
  title.className = 'grammar-breakdown-title';
  title.textContent = 'How you did, letter by letter';
  breakdownEl.appendChild(title);

  const row = document.createElement('div');
  row.className = 'grammar-breakdown-row';
  cats.forEach((c, i) => {
    const stat = byCat[c.key];
    const cell = document.createElement('span');
    cell.className = `pp-sticky pp-sticky--tape grammar-bd-cell ${stickyColor(i)}`;
    cell.innerHTML = `
      <span class="grammar-bd-key">${c.key}</span>
      <span class="grammar-bd-label">${c.short}</span>
      <span class="grammar-bd-score">${stat.caught}/${stat.total}</span>
      <span class="grammar-bd-tag">${stat.tagged} named</span>`;
    row.appendChild(cell);
  });
  breakdownEl.appendChild(row);

  if (falseEdits) {
    const note = document.createElement('p');
    note.className = 'grammar-breakdown-note';
    note.textContent = falseEdits === 1
      ? 'You also changed 1 word that was already correct.'
      : `You also changed ${falseEdits} words that were already correct.`;
    breakdownEl.appendChild(note);
  }
  breakdownEl.hidden = false;
}

function hideResults() {
  resultsBd.classList.remove('open');
  resultsBd.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('grammar-nav-hidden');
}

function launchConfetti() {
  const colors = ['#f4c95d', '#6fb7e8', '#7cc47c', '#f07a7a', '#e8c8ff', '#ffd7a3'];
  const container = document.createElement('div');
  container.className = 'grammar-confetti';
  document.body.appendChild(container);
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('span');
    piece.className = 'grammar-confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.2}s`;
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
    piece.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3800);
}

/* ── The review ──────────────────────────────────────────────────────────
   The passage again, marked. This is where the round actually teaches: a
   leaderboard tells a child they came fourth, and the marked passage tells
   them WHY — the comma they never saw, the "there" they read straight past,
   the correct word they changed anyway.

   Four outcomes, each rendered differently:
     caught      what they wrote, in the "right" ink
     wrong-fix   what they wrote, struck through, with the answer beside it
     missed      the error as it stood, with the answer beside it
     false-edit  their change, struck through, with the original beside it */
const OUTCOME_LABEL = {
  caught: 'Caught it',
  'wrong-fix': 'Changed, but not right',
  missed: 'Missed',
  'false-edit': 'This word was already correct',
};

function renderReview() {
  if (!lastReview) return;
  const { result, pages } = lastReview;
  reviewTitle.textContent = pages.length > 1
    ? `Your ${pages.length} passages`
    : (pages[0] && pages[0].passage ? pages[0].passage.title : 'Your passage');
  reviewSub.textContent =
    `${result.caught} of ${result.errorTotal} caught · ${result.tagged} named correctly`
    + (result.falseEdits ? ` · ${result.falseEdits} false ${result.falseEdits === 1 ? 'edit' : 'edits'}` : '');

  reviewBody.innerHTML = '';
  // Each passage marked under its own heading, in the order it was dealt. A
  // multi-passage round run together as one wall of marks is unreadable — and
  // the point of the review is that it can be read.
  pages.forEach((pg, n) => renderReviewPage(pg, n, pages.length));

  reviewBd.classList.add('open');
  reviewBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('grammar-nav-hidden');
}

function renderReviewPage(pg, n, total) {
  const { tokens, passage, result } = pg;

  const head = document.createElement('p');
  head.className = 'grammar-review-head';
  head.textContent = total > 1
    ? `${n + 1}. ${passage ? passage.title : 'Passage'}`
    : (passage ? passage.title : 'Passage');
  if (total > 1) {
    const sc = document.createElement('span');
    sc.className = 'grammar-review-head-score';
    sc.textContent = `${result.caught}/${result.errorTotal} caught · ${result.tagged} named`;
    head.appendChild(sc);
  }
  reviewBody.appendChild(head);

  const addBreak = () => {
    const gap = document.createElement('span');
    gap.className = 'grammar-break';
    gap.setAttribute('aria-hidden', 'true');
    reviewBody.appendChild(gap);
  };
  result.detail.forEach((d) => {
    const t = tokens[d.i];
    if (d.outcome === 'clean') {
      reviewBody.appendChild(document.createTextNode(t.answer));
      if (t.br) addBreak();
      else reviewBody.appendChild(document.createTextNode(' '));
      return;
    }
    const mark = document.createElement('span');
    mark.className = `grammar-mark is-${d.outcome}`;
    mark.title = OUTCOME_LABEL[d.outcome] + (d.cat ? ` — ${CUPS_LABEL[d.cat]}` : '');

    if (d.outcome === 'caught') {
      mark.innerHTML = `<span class="grammar-mark-good">${esc(d.submitted)}</span>`;
      // Did they name it as well as fix it?
      const badge = document.createElement('span');
      badge.className = `grammar-mark-cat${d.tag === d.cat ? ' is-right' : ''}`;
      badge.textContent = d.cat;
      mark.appendChild(badge);
    } else if (d.outcome === 'missed') {
      mark.innerHTML = `<span class="grammar-mark-bad">${esc(d.shown)}</span><span class="grammar-mark-fix">${esc(d.answer)}</span>`;
      const badge = document.createElement('span');
      badge.className = 'grammar-mark-cat';
      badge.textContent = d.cat;
      mark.appendChild(badge);
    } else if (d.outcome === 'wrong-fix') {
      mark.innerHTML = `<span class="grammar-mark-struck">${esc(d.submitted)}</span><span class="grammar-mark-fix">${esc(d.answer)}</span>`;
      const badge = document.createElement('span');
      badge.className = 'grammar-mark-cat';
      badge.textContent = d.cat;
      mark.appendChild(badge);
    } else {
      mark.innerHTML = `<span class="grammar-mark-struck">${esc(d.submitted)}</span><span class="grammar-mark-fix">${esc(d.answer)}</span>`;
    }
    reviewBody.appendChild(mark);
    if (t.br) addBreak();
    else reviewBody.appendChild(document.createTextNode(' '));
  });
}

function esc(s) {
  const d = document.createElement('span');
  d.textContent = s == null ? '' : s;
  return d.innerHTML;
}

function hideReview() {
  reviewBd.classList.remove('open');
  reviewBd.setAttribute('aria-hidden', 'true');
}

/* ── The CUPS rules card ─────────────────────────────────────────────────
   Read before you race. Hunting errors you have never been taught to name is
   a guessing game; hunting them with the checklist fresh in mind is editing.
   Built from the same registry the round scores against, so what you revise is
   exactly what you can be asked. */
function renderRules() {
  rulesList.innerHTML = '';
  const inFocus = focusSet(focus);
  CUPS.forEach((c, i) => {
    const card = document.createElement('article');
    card.className = `grammar-rule-card pp-sticky pp-sticky--tape ${stickyColor(i)}${inFocus.has(c.key) ? '' : ' is-out'}`;
    const paper = document.createElement('div');
    paper.className = 'grammar-rule-paper';
    paper.innerHTML = `
      <h3 class="grammar-rule-name"><span class="grammar-rule-key">${c.key}</span>${c.label}</h3>
      <p class="grammar-rule-hint">${c.hint}</p>`;
    const ex = document.createElement('div');
    ex.className = 'grammar-rule-examples';
    c.examples.forEach(([bad, good]) => {
      const row = document.createElement('p');
      row.className = 'grammar-rule-ex';
      row.innerHTML = `<span class="grammar-ex-bad">${esc(bad)}</span><span class="grammar-ex-good">${esc(good)}</span>`;
      ex.appendChild(row);
    });
    paper.appendChild(ex);
    card.appendChild(paper);
    rulesList.appendChild(card);
  });
}

function openRules() {
  renderRules();
  rulesBd.classList.add('open');
  rulesBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('grammar-nav-hidden');
}
function closeRules() {
  rulesBd.classList.remove('open');
  rulesBd.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('grammar-nav-hidden');
}

// ── Round orchestration (shared by all matchmaking paths) ───────────────
async function playRoundAndShowResults(room, name) {
  const roster = buildRoster(room, name);
  // The ROOM's settings, never this client's setup screen — a joiner who came
  // in by code never picked any of them.
  const out = await startRound({
    seed: room.seed,
    timeLimit: room.timeLimit,
    startAt: room.startAt,
    grade: room.grade,
    theme: room.theme,
    focus: room.focus,
    // Rooms made before paging shipped carry no count — those are one-passage
    // rounds, exactly as they were played.
    count: room.count || 1,
    roster,
  });

  lastReview = { result: out.result, pages: out.pages };
  showAwaiting();

  let ranked;
  try {
    ranked = await finishRound({
      roomId: room.roomId,
      seed: room.seed,
      timeLimit: room.timeLimit,
      // Ranking waits for the ROUND's clock, not for our own submit — see
      // deadlineFor() in /utils/games/leaderboard.js.
      startAt: room.startAt,
      botsNeeded: room.botsNeeded,
      // The board goes up straight away and fills in as the room finishes,
      // instead of holding everyone behind the awaiting overlay.
      onUpdate: (rows) => {
        hideAwaiting();
        // Same avatar override the settled board applies, or your own face
        // would swap out from under you when the last player lands.
        const me = rows.find((r) => r.isSelf);
        if (me) me.avatarSeed = getAvatarSeed();
        renderResults(rows, out.errorTotal, false);
      },
      errorTotal: out.errorTotal,
      myScore: out.score,
      // Ranked on speed then false edits after the score (see leaderboard.js).
      myMetrics: {
        timeMs: out.timeMs,
        falseEdits: out.falseEdits,
        caught: out.caught,
        tagged: out.tagged,
      },
    });
  } catch (e) {
    // Silent here meant a broken leaderboard looked like a working one.
    console.error('[grammar] finishRound failed — showing a local-only board:', e);
    ranked = [{
      name, score: out.score, timeMs: out.timeMs, falseEdits: out.falseEdits,
      caught: out.caught, tagged: out.tagged,
      isBot: false, isSelf: true, avatarSeed: getAvatarSeed(),
    }];
  }
  const selfRow = ranked.find((r) => r.isSelf);
  if (selfRow) selfRow.avatarSeed = getAvatarSeed();

  hideAwaiting();
  startBtn.disabled = false;
  renderResults(ranked, out.errorTotal);
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

/* The round's clock. See the PACES comment at the top of this file for why it
   is averaged over the pool rather than measured on the passage the seed will
   actually pick. Decided here, before the room is made, so every player in it
   shares one clock.

   It scales with how many passages are dealt — and by the number ACTUALLY
   dealt, not the number asked for, because a theme with two passages written
   for this grade deals two however loudly the setup said three (see rng.js).
   Paying for a third passage that never arrives would just hand that player a
   third more time than everyone else in the room. */
async function computeTimeLimit() {
  const fallback = Math.round((100 * READ_SEC_PER_WORD + 10 * pace) * passageCount);
  try {
    const passages = await loadPassages(theme);
    const pool = passagePool(passages, grade);
    if (!pool.length) return fallback;
    let words = 0, errors = 0;
    for (const p of pool) {
      const tokens = buildPassage(p, focus);
      words += tokens.length;
      errors += tokens.filter((t) => t.cat).length;
    }
    const avgWords = words / pool.length;
    const avgErrors = errors / pool.length;
    const dealt = Math.min(passageCount, pool.length);
    const secs = (avgWords * READ_SEC_PER_WORD + avgErrors * pace) * dealt;
    return Math.max(MIN_ROUND_SEC, Math.min(MAX_ROUND_SEC, Math.round(secs)));
  } catch {
    return fallback;
  }
}

async function runMultiplayer(name) {
  showLobby(roomSize);
  const timeLimit = await computeTimeLimit();
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size: roomSize, timeLimit, grade, theme, focus, count: passageCount, displayName: name },
      { onWaiting: makeOnWaiting() },
    );
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
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
  const timeLimit = await computeTimeLimit();
  let created;
  try {
    created = await createCodeRoom(
      { mode: roomMode, size, timeLimit, grade, theme, focus, count: passageCount, displayName: name },
      { onWaiting: makeOnWaiting(roomMode === 'versus' ? 'Waiting for your opponent…' : 'Waiting for other players…') },
    );
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert(e && e.quotaBlocked ? e.message : "Couldn't create a room — please try again.");
    return;
  }
  showLobbyCode(created.code);

  let room;
  try {
    room = await created.roundReady;
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert('Something went wrong waiting for other players — please try again.');
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, name);
}

async function runJoin(name, fallbackSize, rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (code.length !== 6) {
    alert('Enter the 6-character room code your friend shared.');
    startBtn.disabled = false;
    return;
  }
  showLobby(fallbackSize);
  lobbyStatus.textContent = 'Joining room…';
  let room;
  try {
    room = await joinRoomByCode(code, {
      displayName: name,
      onWaiting: makeOnWaiting('Waiting for the round to start…'),
    });
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert((e && e.message) || "Couldn't join that room.");
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, name);
}

async function runGrammar() {
  startBtn.disabled = true;
  // The setup is proven good the moment a round starts with it — next visit
  // jumps straight to the last section with these picks as chips.
  mem.save({ grade, theme, focus, count: passageCount, done: true });
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
studyBtn.addEventListener('click', openRules);
rulesClose.addEventListener('click', closeRules);
rulesBd.addEventListener('click', (e) => { if (e.target === rulesBd) closeRules(); });

reviewBtn.addEventListener('click', renderReview);
reviewClose.addEventListener('click', hideReview);
reviewBd.addEventListener('click', (e) => { if (e.target === reviewBd) hideReview(); });

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (reviewBd.classList.contains('open')) { hideReview(); return; }
  if (rulesBd.classList.contains('open')) closeRules();
});

startBtn.addEventListener('click', runGrammar);

/* ── Quick join ─────────────────────────────────────────────────
   Somebody arriving with a friend's code has nothing to set up: the room's
   grade, theme, focus, size and clock all come from the host. */
quickJoinInput.addEventListener('input', () => {
  quickJoinInput.value = quickJoinInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
});
quickJoinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); quickJoinBtn.click(); }
});
quickJoinBtn.addEventListener('click', async () => {
  const code = quickJoinInput.value.trim();
  if (code.length !== 6) {
    quickJoinInput.focus();
    return;
  }
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
  document.body.classList.remove('grammar-nav-hidden');
  startBtn.disabled = false;
});
againBtn.addEventListener('click', hideResults);

// Preselect mode from nav links like ?mode=versus
if (new URLSearchParams(location.search).get('mode') === 'versus') {
  mode = 'versus';
  if (roomAction === 'quickfill') roomAction = 'create';
  renderRoomEntry();
  updateStartLabel();
}

// A returning player's whole setup is already restored — skip the wizard and
// land on the final section, previous picks shown as chips (tap any to change).
if (mem.isReturning()) {
  codeInput.hidden = roomAction !== 'join';
  flow.goTo(3);
}
