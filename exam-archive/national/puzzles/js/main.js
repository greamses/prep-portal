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
import { createCarousel, createSectionFlow, renderChoiceStep, renderComingSoon } from '/utils/components/setup-carousel.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

// Curated seeds for the player's own avatar picker — any string works with
// DiceBear, these are just a fun fixed set to choose between.
const AVATAR_SEEDS = ['Explorer', 'Astro', 'Ranger', 'Comet', 'Nova', 'Pixel', 'Quokka', 'Robo', 'Sunny', 'Turbo', 'Breezy', 'Sparkle'];
const AVATAR_SEED_KEY = 'puzzleAvatarSeed';
let selectedAvatarSeed = localStorage.getItem(AVATAR_SEED_KEY) || AVATAR_SEEDS[0];

// A user-uploaded photo (resized + compressed to a small data URL, see
// resizeAvatarFile()) — stored locally only, same as every other avatar
// choice; avatar choice was never synced to other players in a room to
// begin with (see leaderboard.js: other real players' rows always render
// a uid-derived DiceBear face, not their actual pick).
const CUSTOM_AVATAR_VALUE = 'custom';
const CUSTOM_AVATAR_KEY = 'puzzleAvatarCustom';
let customAvatarDataUrl = localStorage.getItem(CUSTOM_AVATAR_KEY) || null;

// Seeded cartoon avatars (DiceBear's open "adventurer" mascot set) — same
// seed always draws the same face, so a bot's avatar stays consistent with
// its real name and a real player's avatar stays consistent with their
// pick. The one exception is the "upload your own" choice, which resolves
// to the locally-stored photo instead of a generated face.
const avatarUrl = (seed) => {
  if (seed === CUSTOM_AVATAR_VALUE && customAvatarDataUrl) return customAvatarDataUrl;
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&size=64`;
};

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

// Shown on the "upload your own" avatar tile until a photo is chosen.
const UPLOAD_ICON_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1-1.6A1.5 1.5 0 0 1 10.4 3.6h3.2a1.5 1.5 0 0 1 1.3.8l1 1.6h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" fill="none" stroke="var(--text-tertiary)" stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="12" cy="12.5" r="3.4" fill="none" stroke="var(--text-tertiary)" stroke-width="1.6"/>
</svg>`;

const nameInput = $('puzzle-name-input');
const avatarGrid = $('puzzle-avatar-grid');
const avatarUploadInput = $('puzzle-avatar-upload-input');
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

// ── Setup state ─────────────────────────────────────────────────────────
// Owned in JS, not read back out of `input:checked` — a carousel only renders
// the step you're on, so a DOM-query getter would throw for any step the
// player never opened.
let mode = 'multiplayer';
let roomSize = 5;
let timeLimit = 300;
let roomAction = 'quickfill'; // multiplayer: quickfill|create|join · versus: create|join

let puzzleType = 'sudoku';
let gridSize = 9; // Sudoku's default — kept in step with puzzleType below
let difficulty = 'easy';

const defaultGridFor = (type) => (GRID_SIZES_BY_TYPE[type].find((o) => o.default) || GRID_SIZES_BY_TYPE[type][0]).value;

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

/* ── SECTION 1 — Puzzle ───────────────────────────────────────────────────
   Puzzle → Grid Size → Difficulty. Grid Size is genuinely puzzle-specific:
   Sudoku's boxes only divide evenly at 4/6/9, Slider is the classic 3/4/5 —
   so the step is rebuilt per puzzle rather than offering sizes the chosen
   puzzle can't even use. Switching puzzle resets the grid to that puzzle's
   own default, so a 9×9 pick can't survive into Slider. ─────────────────── */
const topic = createCarousel(topicMount);
let gridSizeEl = null;

function renderGridSizePick() {
  renderChoiceStep(gridSizeEl, {
    title: 'Grid size?',
    name: 'puzzle-grid-size',
    colorOffset: 4,
    options: GRID_SIZES_BY_TYPE[puzzleType].map((opt) => ({
      value: String(opt.value), label: opt.label, checked: opt.value === gridSize,
    })),
    onPick: (v) => { gridSize = Number(v); topic.goTo('difficulty'); },
  });
}

topic.addSlide('type', 'Puzzle', (el) => {
  renderChoiceStep(el, {
    title: 'Which puzzle?',
    name: 'puzzle-type',
    options: [
      { value: 'sudoku', label: 'Sudoku', checked: true },
      { value: 'slider', label: 'Slider' },
    ],
    onPick: (v) => {
      puzzleType = v;
      gridSize = defaultGridFor(v); // a Sudoku 9×9 is not a valid Slider size
      renderGridSizePick();
      topic.goTo('grid-size');
    },
  });
});

topic.addSlide('grid-size', 'Grid Size', (el) => { gridSizeEl = el; });
renderGridSizePick();

topic.addSlide('difficulty', 'Difficulty', (el) => {
  renderChoiceStep(el, {
    title: 'Difficulty?',
    name: 'puzzle-difficulty',
    colorOffset: 1,
    options: [
      { value: 'easy', label: 'Easy', checked: true },
      { value: 'medium', label: 'Medium' },
      { value: 'hard', label: 'Hard' },
    ],
    onPick: (v) => { difficulty = v; flow.next(); }, // last step of this section
  });
});

topic.start('type');

/* ── SECTION 2 — Game Options ─────────────────────────────────────────────
   Mode → Room Size → Time Limit. Versus skips Room Size — it's always 1v1. */
const options = createCarousel(optionsMount);

options.addSlide('mode', 'Mode', (el) => {
  renderChoiceStep(el, {
    title: 'How do you want to play?',
    name: 'puzzle-mode',
    options: [
      { value: 'multiplayer', label: 'Multiplayer', checked: true },
      { value: 'versus', label: 'Versus (1v1)' },
    ],
    onPick: (v) => {
      mode = v;
      if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create';
      renderRoomEntry();
      roomCarousel.start('entry');
      codeInput.hidden = roomAction !== 'join';
      updateStartLabel();
      options.goTo(mode === 'versus' ? 'time' : 'size');
    },
  });
});

options.addSlide('size', 'Room Size', (el) => {
  renderChoiceStep(el, {
    title: 'How many players?',
    name: 'puzzle-size',
    colorOffset: 2,
    options: [
      { value: '5', label: '5 players', checked: true },
      { value: '10', label: '10 players' },
    ],
    onPick: (v) => { roomSize = Number(v); options.goTo('time'); },
  });
});

options.addSlide('time', 'Time Limit', (el) => {
  renderChoiceStep(el, {
    title: 'How long is the round?',
    name: 'puzzle-time',
    colorOffset: 4,
    options: [
      { value: '180', label: '3 min' },
      { value: '300', label: '5 min', checked: true },
      { value: '600', label: '10 min' },
      { value: '900', label: '15 min' },
    ],
    onPick: (v) => { timeLimit = Number(v); flow.next(); }, // last step of this section
  });
});

options.start('mode');

/* ── SECTION 3 — Room ─────────────────────────────────────────────────── */
const roomCarousel = createCarousel(roomMount);
let roomEntryEl = null;

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

  renderChoiceStep(roomEntryEl, {
    title: mode === 'multiplayer' ? 'How do you want to join?' : 'Create or join the 1v1?',
    name: 'puzzle-room-action',
    colorOffset: 2,
    options: choices,
    onPick: (v) => {
      roomAction = v;
      codeInput.hidden = v !== 'join';
      updateStartLabel();
      if (v === 'join') roomCarousel.goTo('code');
    },
  });
}

roomCarousel.addSlide('entry', 'Room', (el) => { roomEntryEl = el; });
roomCarousel.addSlide('code', 'Code', (el) =>
  renderComingSoon(el, { title: 'Enter the room code', message: 'Type the 6-character code your friend shared into the box below.' }));

renderRoomEntry();
roomCarousel.start('entry');

/* ── One selector on screen at a time ─────────────────────────────────── */
const flow = createSectionFlow([
  {
    el: $('puzzle-section-topic'),
    summary: () => {
      const name = puzzleType[0].toUpperCase() + puzzleType.slice(1);
      const diff = difficulty[0].toUpperCase() + difficulty.slice(1);
      return `${name} · ${gridSize}×${gridSize} · ${diff}`;
    },
  },
  {
    el: $('puzzle-section-options'),
    summary: () => {
      const mins = timeLimit / 60;
      return mode === 'versus'
        ? `Versus 1v1 · ${mins} min`
        : `Multiplayer · ${roomSize} players · ${mins} min`;
    },
  },
  {
    el: $('puzzle-section-room'),
    summary: () =>
      roomAction === 'quickfill' ? 'Quick Fill' : roomAction === 'create' ? 'Create Room' : 'Join with Code',
  },
]);

updateStartLabel();

// ── Game name ──────────────────────────────────────────────────────────
nameInput.value = localStorage.getItem(NAME_KEY) || '';
nameInput.addEventListener('input', () => localStorage.setItem(NAME_KEY, nameInput.value));
getCurrentUser().then((user) => {
  if (!nameInput.value && user.displayName) nameInput.value = user.displayName;
});

// ── Avatar picker ────────────────────────────────────────────────────────
// Downscales + crops to a centered square, then compresses to a small JPEG
// data URL — keeps it comfortably inside localStorage limits (typically a
// few KB) without needing any server-side upload/storage.
function resizeAvatarFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const crop = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - crop) / 2;
      const sy = (img.naturalHeight - crop) / 2;
      ctx.drawImage(img, sx, sy, crop, crop, 0, 0, size, size);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not read that image.')); };
    img.src = objectUrl;
  });
}

function renderAvatarGrid() {
  avatarGrid.innerHTML = '';

  const uploadLabel = document.createElement('label');
  uploadLabel.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice avatar-choice--upload ${stickyColor(0)}`;
  uploadLabel.innerHTML = `
    <input type="radio" name="puzzle-avatar" value="${CUSTOM_AVATAR_VALUE}" ${selectedAvatarSeed === CUSTOM_AVATAR_VALUE ? 'checked' : ''} />
    ${customAvatarDataUrl ? `<img src="${customAvatarDataUrl}" alt="Your photo" loading="lazy" />` : UPLOAD_ICON_SVG}
  `;
  uploadLabel.addEventListener('click', () => avatarUploadInput.click());
  avatarGrid.appendChild(uploadLabel);

  AVATAR_SEEDS.forEach((seed, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice ${stickyColor(i + 1)}`;
    label.innerHTML = `<input type="radio" name="puzzle-avatar" value="${seed}" ${seed === selectedAvatarSeed ? 'checked' : ''} /><img src="${avatarUrl(seed)}" alt="${seed} avatar" loading="lazy" />`;
    avatarGrid.appendChild(label);
  });
}
renderAvatarGrid();

avatarGrid.addEventListener('change', (e) => {
  const input = e.target.closest('input[name="puzzle-avatar"]');
  if (!input) return;
  selectedAvatarSeed = input.value;
  localStorage.setItem(AVATAR_SEED_KEY, selectedAvatarSeed);
});

avatarUploadInput.addEventListener('change', async () => {
  const file = avatarUploadInput.files && avatarUploadInput.files[0];
  avatarUploadInput.value = ''; // allow re-picking the same file later
  if (!file) return;
  try {
    customAvatarDataUrl = await resizeAvatarFile(file);
    localStorage.setItem(CUSTOM_AVATAR_KEY, customAvatarDataUrl);
    selectedAvatarSeed = CUSTOM_AVATAR_VALUE;
    localStorage.setItem(AVATAR_SEED_KEY, selectedAvatarSeed);
    renderAvatarGrid();
  } catch (e) {
    alert("Couldn't use that photo — please try a different image.");
  }
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
    if (i === 0) lobbySeats.appendChild(seatSticker(i, selectedAvatarSeed, 'You'));
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
  lobbyCode.hidden = true;
  lobbyStatus.textContent = 'Waiting for other players…';
  lobbyCount.textContent = `1 / ${size}`;
  renderLobbySeats(1, size);
  lobbyBd.classList.add('open');
  lobbyBd.setAttribute('aria-hidden', 'false');
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
  ranked.forEach((row, i) => {
    const isWinner = i === 0;
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
    else rank.textContent = String(i + 1);

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
  if (ranked[0] && ranked[0].isSelf) {
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
    ranked = [{ name: myName, score: myScore, isBot: false, isSelf: true, avatarSeed: selectedAvatarSeed }];
  }
  // Show the player's own chosen avatar on the leaderboard, not the
  // uid-derived one leaderboard.js falls back to.
  const selfRow = ranked.find((r) => r.isSelf);
  if (selfRow) selfRow.avatarSeed = selectedAvatarSeed;

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
      lobbyStatus.textContent = 'Room ready!';
      lobbyCount.textContent = `${state.size} / ${state.size}`;
      revealBotsStaggered(state.size, state.botsNeeded, state.seed, state.revealMs);
      return;
    }
    if (waitingStatusText) lobbyStatus.textContent = waitingStatusText;
    lobbyCount.textContent = `${state.playerCount} / ${state.size}`;
    renderLobbySeats(state.playerCount, state.size);
  };
}

async function runMultiplayer({ timeLimit, puzzleType, difficulty, gridSize, myName }) {
  const size = roomSize;
  showLobby(size);
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size, timeLimit, puzzleType, difficulty, gridSize, displayName: myName },
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
      { mode: 'multiplayer', size, timeLimit, puzzleType, difficulty, gridSize, displayName: myName },
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

async function runMultiplayerJoin({ myName }) {
  const code = (codeInput.value || '').trim().toUpperCase();
  if (code.length !== 6) {
    alert('Enter the 6-character room code your friend shared.');
    startBtn.disabled = false;
    return;
  }
  showLobby(roomSize); // best guess until the joined room's real size arrives below
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

async function runVersusCreate({ timeLimit, puzzleType, difficulty, gridSize, myName }) {
  showLobby(2);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'versus', size: 2, timeLimit, puzzleType, difficulty, gridSize, displayName: myName },
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
  const code = (codeInput.value || '').trim().toUpperCase();
  if (code.length !== 6) {
    alert('Enter the 6-character room code your friend shared.');
    startBtn.disabled = false;
    return;
  }
  showLobby(2);
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

async function runPuzzle() {
  startBtn.disabled = true;
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
lobbyCancel.addEventListener('click', () => {
  // v1 doesn't retract the Firestore join/room-create on cancel — the
  // abandon-fallback timers on other clients (or a solo bot-fill) resolve
  // an orphaned room naturally, and unread docs aren't billed.
  cancelled = true;
  hideLobby();
  startBtn.disabled = false;
});
againBtn.addEventListener('click', hideResults);

// Preselect mode from nav links like ?mode=versus
const initialMode = new URLSearchParams(location.search).get('mode');
if (initialMode === 'versus') {
  mode = 'versus';
  roomAction = 'create'; // Versus has no Quick Fill
  renderRoomEntry();
  updateStartLabel();
}
