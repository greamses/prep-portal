/* ═══════════════════════════════════════════════════════
   PUZZLES — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays. Same structure as
   Drills' js/main.js — Multiplayer uses anonymous pool matching; Versus is
   always a private 1v1 via a shared room code (create-and-share, or
   join-with-code). Sudoku and Slider are both live; the "Puzzle" field is
   a radiogroup so more can be added later the same way — just extend
   GRID_SIZES_BY_TYPE and let game.js dispatch on puzzleType.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound } from './leaderboard.js';
import {
  createCarousel, createSectionFlow,
  renderChoiceStep, renderCustomStep, renderComingSoon,
} from '/utils/components/setup-carousel.js';
import { avatarUrl, getAvatarSeed, mountAvatarPicker } from '/utils/components/avatar-picker.js';
import { createSetupMemory } from '/utils/games/setup-memory.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

// The avatar picker (drawn faces + the player's own photos) lives in
// /utils/components/avatar-picker.js, shared by every game — one player, one
// face, everywhere. Avatar choice is never synced to other players in a room
// (see leaderboard.js: other real players' rows always render a uid-derived
// DiceBear face, not their actual pick).

const NAME_KEY = 'puzzleGameName';

// Grid Size options depend on which puzzle is selected — Sudoku's boxes
// only divide evenly at 4/6/9, Slider is conventionally 3/4/5 (the classic
// 8-/15-/24-puzzle). Difficulty (Easy/Medium/Hard) is the same three
// labels for every puzzle type, just reinterpreted by that puzzle's own
// generator (see sudoku.js/slider.js).
const GRID_SIZES_BY_TYPE = {
  sudoku: [{ value: 4, label: '4×4' }, { value: 6, label: '6×6' }, { value: 9, label: '9×9', default: true }],
  slider: [{ value: 3, label: '3×3' }, { value: 4, label: '4×4', default: true }, { value: 5, label: '5×5' }],
};

// Dark ink fill (not accent-primary) — the winner's note is already gold,
// so a same-hue trophy would nearly vanish against it.
const TROPHY_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" fill="var(--ink)"/>
  <path d="M7 5H4a3 3 0 0 0 3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M17 5h3a3 3 0 0 1-3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="10.5" y="12" width="3" height="4" fill="var(--ink)"/>
  <rect x="8" y="16.4" width="8" height="2.4" rx="1" fill="var(--ink)"/>
</svg>`;

const nameInput = $('puzzle-name-input');
const avatarGrid = $('puzzle-avatar-grid');
const avatarUploadInput = $('puzzle-avatar-upload-input');
const playerMount = $('puzzle-player-carousel');
const topicMount = $('puzzle-topic-carousel');
const optionsMount = $('puzzle-options-carousel');
const roomMount = $('puzzle-room-carousel');
const codeInput = $('puzzle-code-input');
const startBtn = $('puzzle-start-btn');
const startLabel = $('puzzle-start-label');

const lobbyBd = $('puzzle-lobby-bd');
const lobbyStatus = $('puzzle-lobby-status');
const lobbyCode = $('puzzle-lobby-code');
const lobbyCodeText = $('puzzle-lobby-code-text');
const lobbyCodeCopy = $('puzzle-lobby-code-copy');
const lobbySeats = $('puzzle-lobby-seats');
const lobbyCount = $('puzzle-lobby-count');
const lobbyCancel = $('puzzle-lobby-cancel');
const lobbyStartNow = $('puzzle-lobby-start-now');

const awaitingBd = $('puzzle-awaiting-bd');

const resultsBd = $('puzzle-results-bd');
const leaderboardEl = $('puzzle-leaderboard');
const againBtn = $('puzzle-again-btn');

function showAwaiting() {
  awaitingBd.classList.add('open');
  awaitingBd.setAttribute('aria-hidden', 'false');
}
function hideAwaiting() {
  awaitingBd.classList.remove('open');
  awaitingBd.setAttribute('aria-hidden', 'true');
}

let cancelled = false;
// The host's "start now" action for the current lobby snapshot — swapped out on
// every waiting tick so the button always promotes the latest player count.
let startNowFn = null;

// ── Setup state ─────────────────────────────────────────────────────────
// Owned in JS, not read back out of `input:checked` — a carousel only renders
// the step you're on, so a DOM-query getter would throw for any step the
// player never opened. Every field starts from the player's LAST game
// (setup-memory.js) so nothing has to be re-picked visit after visit.
const defaultGridFor = (type) => (GRID_SIZES_BY_TYPE[type].find((o) => o.default) || GRID_SIZES_BY_TYPE[type][0]).value;

const mem = createSetupMemory('puzzles');
let mode = mem.get('mode', 'multiplayer', ['multiplayer', 'versus']);
let roomSize = mem.get('roomSize', 5, [5, 10]);
let timeLimit = mem.get('timeLimit', 300, [180, 300, 600, 900]);
let roomAction = mem.get('roomAction', 'quickfill', ['quickfill', 'create', 'join']); // multiplayer: quickfill|create|join · versus: create|join
if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create'; // Versus has no Quick Fill

let puzzleType = mem.get('puzzleType', 'sudoku', ['sudoku', 'slider']);
let gridSize = mem.get('gridSize', defaultGridFor(puzzleType), GRID_SIZES_BY_TYPE[puzzleType].map((o) => o.value));
let tileSet = mem.get('tileSet', 'picture', ['numbers', 'fractions', 'picture']); // slider only — what the tiles wear
let difficulty = mem.get('difficulty', 'easy', ['easy', 'medium', 'hard']);

const TILE_SET_LABELS = { numbers: 'Numbers', fractions: 'Fractions', picture: 'Picture' };

// What this room plays — handed to matchmaking and written into the room
// doc. Sudoku always carries tiles:'numbers' so the bucket key stays fixed.
const contentCfg = () => ({
  puzzleType, difficulty, gridSize,
  tiles: puzzleType === 'slider' ? tileSet : 'numbers',
});

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

function myName() {
  return (nameInput.value || '').trim() || (auth.currentUser && auth.currentUser.displayName) || 'Player';
}

/* ── SECTION 1 — Player ─────────────────────────────────────────
   Name → Avatar. The name input and avatar grid are MOVED into the slides
   rather than re-created, so all their existing wiring still applies. */
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
  onNext: () => flow.next(), // last step of this section
});

player.start('name');

/* ── SECTION 2 — Puzzle ─────────────────────────────────────────
   Puzzle → Grid Size → Difficulty. Grid Size is genuinely puzzle-specific:
   Sudoku's boxes only divide evenly at 4/6/9, Slider is the classic 3/4/5 — so
   the step is rebuilt per puzzle rather than offering sizes the chosen puzzle
   can't use. Switching puzzle resets the grid to that puzzle's own default, so
   a 9×9 pick can't survive into Slider. */
const topic = createCarousel(topicMount);
topic.addSlide('type', 'Puzzle', () => {});
topic.addSlide('tiles', 'Tiles', () => {});
topic.addSlide('grid-size', 'Grid Size', () => {});
topic.addSlide('difficulty', 'Difficulty', () => {});

function renderGridSizePick() {
  renderChoiceStep(topic, 'grid-size', {
    title: 'Grid size?',
    name: 'puzzle-grid-size',
    colorOffset: 4,
    options: GRID_SIZES_BY_TYPE[puzzleType].map((opt) => ({
      value: String(opt.value), label: opt.label, checked: opt.value === gridSize,
    })),
    onPick: (v) => { gridSize = Number(v); mem.save({ gridSize }); topic.goTo('difficulty'); },
  });
}

// Slider only — what the tiles wear. Picture splits one seeded scene across
// the tiles; Fractions borrows the fraction slider's bar tiles (arrange
// smallest → largest); Numbers is the classic 15-puzzle.
function renderTilesPick() {
  renderChoiceStep(topic, 'tiles', {
    title: 'What kind of tiles?',
    name: 'puzzle-tiles',
    colorOffset: 3,
    options: [
      { value: 'picture', label: 'Picture', note: 'rebuild the image', checked: tileSet === 'picture' },
      { value: 'fractions', label: 'Fractions', note: 'smallest to largest', checked: tileSet === 'fractions' },
      { value: 'numbers', label: 'Numbers', note: 'classic 15-puzzle', checked: tileSet === 'numbers' },
    ],
    onPick: (v) => { tileSet = v; mem.save({ tileSet }); renderGridSizePick(); topic.goTo('grid-size'); },
  });
}

renderChoiceStep(topic, 'type', {
  title: 'Which puzzle?',
  name: 'puzzle-type',
  options: [
    { value: 'sudoku', label: 'Sudoku', checked: puzzleType === 'sudoku' },
    { value: 'slider', label: 'Slider', checked: puzzleType === 'slider' },
  ],
  onPick: (v) => {
    if (v !== puzzleType) gridSize = defaultGridFor(v); // a Sudoku 9×9 is not a valid Slider size
    puzzleType = v;
    mem.save({ puzzleType, gridSize });
    if (v === 'slider') { renderTilesPick(); topic.goTo('tiles'); return; }
    renderGridSizePick();
    topic.goTo('grid-size');
  },
});

renderTilesPick();
renderGridSizePick();

renderChoiceStep(topic, 'difficulty', {
  title: 'Difficulty?',
  name: 'puzzle-difficulty',
  colorOffset: 1,
  options: [
    { value: 'easy', label: 'Easy', checked: difficulty === 'easy' },
    { value: 'medium', label: 'Medium', checked: difficulty === 'medium' },
    { value: 'hard', label: 'Hard', checked: difficulty === 'hard' },
  ],
  onPick: (v) => { difficulty = v; mem.save({ difficulty }); flow.next(); }, // last step of this section
});

topic.start('type');

/* ── SECTION 3 — Game Options ─────────────────────────────────
   Mode → Room Size → Time Limit. Versus skips Room Size — it's always 1v1. */
const options = createCarousel(optionsMount);
options.addSlide('mode', 'Mode', () => {});
options.addSlide('size', 'Room Size', () => {});
options.addSlide('time', 'Time Limit', () => {});

renderChoiceStep(options, 'mode', {
  title: 'How do you want to play?',
  name: 'puzzle-mode',
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
  name: 'puzzle-size',
  colorOffset: 2,
  options: [
    { value: '5', label: '5 players', checked: roomSize === 5 },
    { value: '10', label: '10 players', checked: roomSize === 10 },
  ],
  onPick: (v) => { roomSize = Number(v); mem.save({ roomSize }); options.goTo('time'); },
});
renderChoiceStep(options, 'time', {
  title: 'How long is the round?',
  name: 'puzzle-time',
  colorOffset: 4,
  options: [
    { value: '180', label: '3 min', checked: timeLimit === 180 },
    { value: '300', label: '5 min', checked: timeLimit === 300 },
    { value: '600', label: '10 min', checked: timeLimit === 600 },
    { value: '900', label: '15 min', checked: timeLimit === 900 },
  ],
  onPick: (v) => { timeLimit = Number(v); mem.save({ timeLimit }); flow.next(); }, // last step of this section
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
    name: 'puzzle-room-action',
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
    el: $('puzzle-section-player'),
    chips: () => [{ label: myName(), avatar: avatarUrl(getAvatarSeed()) }],
  },
  {
    el: $('puzzle-section-topic'),
    chips: () => [
      { label: puzzleType[0].toUpperCase() + puzzleType.slice(1) },
      ...(puzzleType === 'slider' ? [{ label: TILE_SET_LABELS[tileSet] }] : []),
      { label: `${gridSize}×${gridSize}` },
      { label: difficulty[0].toUpperCase() + difficulty.slice(1) },
    ],
  },
  {
    el: $('puzzle-section-options'),
    chips: () =>
      mode === 'versus'
        ? [{ label: 'Versus 1v1' }, { label: `${timeLimit / 60} min` }]
        : [{ label: 'Multiplayer' }, { label: `${roomSize} players` }, { label: `${timeLimit / 60} min` }],
  },
  {
    el: $('puzzle-section-room'),
    chips: () => [{
      label: roomAction === 'quickfill' ? 'Quick Fill' : roomAction === 'create' ? 'Create Room' : 'Join with Code',
    }],
  },
], {
  onChange: (_i, isLast) => { startBtn.hidden = !isLast; },
});

updateStartLabel();

// ── Game name ──────────────────────────────────────────────────────────
nameInput.value = localStorage.getItem(NAME_KEY) || '';
nameInput.addEventListener('input', () => localStorage.setItem(NAME_KEY, nameInput.value));
getCurrentUser().then((user) => {
  if (!nameInput.value && user.displayName) nameInput.value = user.displayName;
});

// ── Avatar picker ────────────────────────────────────────────────────────
// Drawn faces plus the player's own photos, kept as a list they can pick
// between and delete from. Shared with every other game — same module, same
// storage, so one player wears one face everywhere.
mountAvatarPicker({
  grid: avatarGrid,
  uploadInput: avatarUploadInput,
  radioName: 'puzzle-avatar',
});

// ── Lobby ────────────────────────────────────────────────────────────────
// Each seat is its own small sticky note carrying an avatar — filled seats
// (you, then any other real joiners) pop in as playerCount changes; empty
// seats stay blank placeholders until either a real player or a bot claims
// them.
let lobbyRevealTimers = [];
function clearLobbyReveal() {
  lobbyRevealTimers.forEach((t) => clearTimeout(t));
  lobbyRevealTimers = [];
}

function seatSticker(i, avatarSeed, label) {
  const el = document.createElement('span');
  const empty = !avatarSeed;
  el.className = `pp-sticky pp-sticky--tape puzzle-lobby-seat ${empty ? 'is-empty' : stickyColor(i)}`;
  el.innerHTML = empty
    ? '<span class="puzzle-lobby-seat-mark">?</span>'
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

// Bots don't land all at once — they claim the remaining empty seats one at
// a time over `revealMs`, at randomized intervals, so the lobby reads like
// people actually trickling in rather than an instant bulk-fill.
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
  document.body.classList.add('puzzle-nav-hidden'); // game mode starts at the lobby
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
  }).catch(() => {}); // clipboard permission can be denied by the browser — the code is still visible to copy by hand
});

// Builds the room-entry roster shown during the "get ready" beat: you,
// other real players (names aren't known until the round-end read, so they
// show generically), and bots — who get real names, indistinguishable from
// a human opponent at a glance.
function buildRoster({ size, botsNeeded, seed }, myName) {
  const realOthers = Math.max(0, size - botsNeeded - 1);
  const roster = [{ name: myName, isSelf: true }];
  for (let i = 0; i < realOthers; i++) roster.push({ name: 'Player', isSelf: false });
  for (let i = 0; i < botsNeeded; i++) roster.push({ name: botName(seed, i), isSelf: false });
  return roster;
}

// ── Results ──────────────────────────────────────────────────────────────
// Reveals from last place up to the winner, one row at a time, for a bit of
// suspense — each row is its own sticky note (same component as the setup
// screen's selectors), and the winner's note is gold, upright and carries
// a trophy instead of a rank number.
function renderResults(ranked) {
  leaderboardEl.innerHTML = '';
  const total = ranked.length;
  // Competition ranking with ties: everyone ahead of you on score ranks above
  // you, and players on the SAME score share a place. A score shared with anyone
  // shows a tie marker instead of a number, and a tie for the top has NO winner
  // — nobody is crowned, and no confetti flies, on a draw.
  const topScore = total ? ranked[0].score : 0;
  const topTie = ranked.filter((r) => r.score === topScore).length > 1;
  ranked.forEach((row, i) => {
    const rankNum = 1 + ranked.filter((r) => r.score > row.score).length;
    const tiedHere = ranked.filter((r) => r.score === row.score).length > 1;
    const isWinner = rankNum === 1 && !topTie;
    const tilt = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3));
    const li = document.createElement('li');
    li.className = [
      'puzzle-lb-row', 'pp-sticky', 'pp-sticky--tape',
      isWinner ? '' : stickyColor(i),
      row.isSelf ? 'is-self' : '',
      isWinner ? 'is-winner' : '',
    ].filter(Boolean).join(' ');
    li.style.setProperty('--delay', `${(total - 1 - i) * 130}ms`);
    li.style.setProperty('--pp-note-tilt', `${tilt}deg`);

    const avatar = document.createElement('span');
    avatar.className = 'puzzle-lb-avatar';
    avatar.innerHTML = `<img src="${avatarUrl(row.avatarSeed || row.name)}" alt="" loading="lazy" />`;

    const rank = document.createElement('span');
    rank.className = 'puzzle-lb-rank';
    if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = tiedHere ? '=' : String(rankNum);

    const name = document.createElement('span');
    name.className = 'puzzle-lb-name';
    name.textContent = row.name;

    const scoreEl = document.createElement('span');
    scoreEl.className = 'puzzle-lb-score';
    scoreEl.textContent = String(row.score);

    li.append(avatar, rank, name, scoreEl);
    leaderboardEl.appendChild(li);
  });
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('puzzle-nav-hidden');

  // The winner's note is revealed last (delay = (total-1)*130ms) — fire the
  // confetti right as it lands, only when the signed-in player won.
  if (ranked[0] && ranked[0].isSelf && !topTie) {
    const winnerRevealMs = (total - 1) * 130 + 400;
    setTimeout(launchConfetti, winnerRevealMs);
  }
}
function hideResults() {
  resultsBd.classList.remove('open');
  resultsBd.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('puzzle-nav-hidden');
}

// A short vanilla confetti burst — no library, just falling/rotating divs
// — fired once when the signed-in player takes first place.
function launchConfetti() {
  const colors = ['#f4c95d', '#6fb7e8', '#7cc47c', '#f07a7a', '#e8c8ff', '#ffd7a3'];
  const container = document.createElement('div');
  container.className = 'puzzle-confetti';
  document.body.appendChild(container);
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('span');
    piece.className = 'puzzle-confetti-piece';
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

// ── Round orchestration (shared by all three matchmaking paths) ─────────
async function playRoundAndShowResults(room, myName) {
  const roster = buildRoster(room, myName);
  const { score: myScore, totalUnits } = await startRound({
    seed: room.seed,
    timeLimit: room.timeLimit,
    startAt: room.startAt,
    puzzleType: room.puzzleType,
    difficulty: room.difficulty,
    gridSize: room.gridSize,
    tiles: room.tiles,
    roster,
  });

  // The round overlay just closed but the leaderboard read (grace delay +
  // one getDocs) hasn't landed yet — show a small "tallying" modal instead
  // of letting the bare setup page show through in between.
  showAwaiting();

  let ranked;
  try {
    ranked = await finishRound({
      roomId: room.roomId,
      seed: room.seed,
      timeLimit: room.timeLimit,
      botsNeeded: room.botsNeeded,
      totalUnits,
      myScore,
    });
  } catch (e) {
    ranked = [{ name: myName, score: myScore, isBot: false, isSelf: true, avatarSeed: getAvatarSeed() }];
  }
  // Show the player's own chosen avatar on the leaderboard, not the
  // uid-derived one leaderboard.js falls back to.
  const selfRow = ranked.find((r) => r.isSelf);
  if (selfRow) selfRow.avatarSeed = getAvatarSeed();

  hideAwaiting();

  startBtn.disabled = false;
  renderResults(ranked);
}

// Shared onWaiting handler for every matchmaking path: updates the count +
// seat stickers while real players trickle in, then hands off to the
// staggered bot reveal the instant the room activates.
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
    // Only the host is handed a startNow, and only once a real second player is
    // here — no point offering "start now" for a room that's just you and bots
    // (the wait fills those seats anyway). The empty seats become bots on click.
    startNowFn = state.startNow || null;
    lobbyStartNow.hidden = !(startNowFn && state.playerCount >= 2 && state.playerCount < state.size);
  };
}

async function runMultiplayer({ timeLimit, puzzleType, difficulty, gridSize, myName }) {
  const size = roomSize;
  showLobby(size);
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size, timeLimit, ...contentCfg(), displayName: myName },
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
  await playRoundAndShowResults(room, myName);
}

async function runMultiplayerCreate({ timeLimit, puzzleType, difficulty, gridSize, myName }) {
  const size = roomSize;
  showLobby(size);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'multiplayer', size, timeLimit, ...contentCfg(), displayName: myName },
      { onWaiting: makeOnWaiting('Waiting for other players…') },
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
  await playRoundAndShowResults(room, myName);
}

// Joining is the same act however you got here — Versus, Multiplayer or the
// quick-join box at the top of the page. You bring a code; the host's room
// brings everything else. `fallbackSize` only sizes the lobby's empty seats
// until the room's real size arrives with the first snapshot.
async function joinWithCode(code, fallbackSize, myName) {
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
      displayName: myName,
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
  await playRoundAndShowResults(room, myName);
}

const codeFromInput = () => (codeInput.value || '').trim().toUpperCase();

async function runMultiplayerJoin({ myName }) {
  await joinWithCode(codeFromInput(), roomSize, myName);
}

async function runVersusCreate({ timeLimit, puzzleType, difficulty, gridSize, myName }) {
  showLobby(2);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'versus', size: 2, timeLimit, ...contentCfg(), displayName: myName },
      { onWaiting: makeOnWaiting('Waiting for your opponent…') },
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
    alert("Something went wrong waiting for your opponent — please try again.");
    return;
  }
  if (cancelled) return;
  hideLobby();
  await playRoundAndShowResults(room, myName);
}

async function runVersusJoin({ myName }) {
  await joinWithCode(codeFromInput(), 2, myName);
}

async function runPuzzle() {
  startBtn.disabled = true;
  // The setup is proven good the moment a round starts with it — next visit
  // jumps straight to the last section with these picks as chips.
  mem.save({ done: true });
  await getCurrentUser();

  const myName = (nameInput.value || '').trim() || auth.currentUser.displayName || 'Player';

  if (mode === 'versus') {
    if (roomAction === 'join') await runVersusJoin({ myName });
    else await runVersusCreate({ timeLimit, puzzleType, difficulty, gridSize, myName });
    return;
  }

  if (roomAction === 'join') await runMultiplayerJoin({ myName });
  else if (roomAction === 'create') await runMultiplayerCreate({ timeLimit, puzzleType, difficulty, gridSize, myName });
  else await runMultiplayer({ timeLimit, puzzleType, difficulty, gridSize, myName });
}

startBtn.addEventListener('click', runPuzzle);

/* ── Quick join ─────────────────────────────────────────────────
   Somebody arriving with a friend's code has nothing to set up: the room's
   content, size and clock all come from the host, and every answer they'd give
   in the sections below would be thrown away. So the code box sits at the top
   of the page and goes straight to the lobby, wearing the name and avatar from
   the last game they played. */
const quickJoinInput = $('puzzle-quickjoin-input');
const quickJoinBtn = $('puzzle-quickjoin-btn');

quickJoinInput.addEventListener('input', () => {
  quickJoinInput.value = quickJoinInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
});
quickJoinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); quickJoinBtn.click(); }
});
quickJoinBtn.addEventListener('click', async () => {
  const code = quickJoinInput.value.trim();
  if (code.length !== 6) { quickJoinInput.focus(); return; }
  quickJoinBtn.disabled = true;
  startBtn.disabled = true;
  await getCurrentUser();
  await joinWithCode(code, 2, myName()); // 2 only seeds the lobby; the room's real size arrives with it
  quickJoinBtn.disabled = false;
});
lobbyStartNow.addEventListener('click', () => {
  if (!startNowFn) return;
  lobbyStartNow.disabled = true;
  lobbyStartNow.hidden = true;
  lobbyStatus.textContent = 'Starting…';
  startNowFn(); // promotes the room now; the onSnapshot picks up 'active' and plays
});
lobbyCancel.addEventListener('click', () => {
  // v1 doesn't retract the Firestore join/room-create on cancel — the
  // abandon-fallback timers on other clients (or a solo bot-fill) resolve
  // an orphaned room naturally, and unread docs aren't billed.
  cancelled = true;
  hideLobby();
  document.body.classList.remove('puzzle-nav-hidden'); // back out of game mode
  startBtn.disabled = false;
});
againBtn.addEventListener('click', hideResults);

// Preselect mode from nav links like ?mode=versus
const initialMode = new URLSearchParams(location.search).get('mode');
if (initialMode === 'versus') {
  mode = 'versus';
  if (roomAction === 'quickfill') roomAction = 'create'; // Versus has no Quick Fill
  renderRoomEntry();
  updateStartLabel();
}

// A returning player's whole setup is already restored — skip the wizard and
// land on the final section, previous picks shown as chips (tap any to change).
if (mem.isReturning()) {
  codeInput.hidden = roomAction !== 'join';
  flow.goTo(3);
}
