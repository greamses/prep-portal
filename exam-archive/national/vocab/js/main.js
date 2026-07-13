/* ═══════════════════════════════════════════════════════
   VOCAB — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays. Multiplayer uses
   anonymous pool matching; Versus is a private 1v1 via a shared room code.
   Same shape as the Drills page — what changes is the topic section
   (Subject -> Grade) and that a "point" here is a word solved.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { SUBJECTS, GRADES } from '/data/vocab/index.js';
import { roundLetters } from './rng.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound } from './leaderboard.js';
import {
  createCarousel, createSectionFlow, renderChoiceStep, renderCustomStep,
} from '/utils/components/setup-carousel.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

const AVATAR_SEEDS = ['Explorer', 'Astro', 'Ranger', 'Comet', 'Nova', 'Pixel', 'Quokka', 'Robo', 'Sunny', 'Turbo', 'Breezy', 'Sparkle'];
const AVATAR_SEED_KEY = 'drillAvatarSeed';   // shared with Drills/Puzzles on purpose —
const CUSTOM_AVATAR_KEY = 'drillAvatarCustom'; // one player, one face, across every game
const CUSTOM_AVATAR_VALUE = 'custom';
const NAME_KEY = 'drillGameName';

let selectedAvatarSeed = localStorage.getItem(AVATAR_SEED_KEY) || AVATAR_SEEDS[0];
let customAvatarDataUrl = localStorage.getItem(CUSTOM_AVATAR_KEY) || null;

const avatarUrl = (seed) => {
  if (seed === CUSTOM_AVATAR_VALUE && customAvatarDataUrl) return customAvatarDataUrl;
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&size=64`;
};

// A hangman word is a far slower unit than a times-table sum, so the rounds
// run in minutes, not seconds — 60s would barely fit four words.
const TIME_LIMITS = [
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min', checked: true },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
];

const TROPHY_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" fill="var(--ink)"/>
  <path d="M7 5H4a3 3 0 0 0 3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M17 5h3a3 3 0 0 1-3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="10.5" y="12" width="3" height="4" fill="var(--ink)"/>
  <rect x="8" y="16.4" width="8" height="2.4" rx="1" fill="var(--ink)"/>
</svg>`;

const UPLOAD_ICON_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1-1.6A1.5 1.5 0 0 1 10.4 3.6h3.2a1.5 1.5 0 0 1 1.3.8l1 1.6h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" fill="none" stroke="var(--text-tertiary)" stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="12" cy="12.5" r="3.4" fill="none" stroke="var(--text-tertiary)" stroke-width="1.6"/>
</svg>`;

const nameInput = $('vocab-name-input');
const avatarGrid = $('vocab-avatar-grid');
const avatarUploadInput = $('vocab-avatar-upload-input');
const playerMount = $('vocab-player-carousel');
const topicMount = $('vocab-topic-carousel');
const optionsMount = $('vocab-options-carousel');
const roomMount = $('vocab-room-carousel');
const codeInput = $('vocab-code-input');
const startBtn = $('vocab-start-btn');
const startLabel = $('vocab-start-label');

const lobbyBd = $('vocab-lobby-bd');
const lobbyStatus = $('vocab-lobby-status');
const lobbyCode = $('vocab-lobby-code');
const lobbyCodeText = $('vocab-lobby-code-text');
const lobbyCodeCopy = $('vocab-lobby-code-copy');
const lobbySeats = $('vocab-lobby-seats');
const lobbyCount = $('vocab-lobby-count');
const lobbyCancel = $('vocab-lobby-cancel');

const awaitingBd = $('vocab-awaiting-bd');
const resultsBd = $('vocab-results-bd');
const leaderboardEl = $('vocab-leaderboard');
const againBtn = $('vocab-again-btn');

let cancelled = false;

// ── Setup state ─────────────────────────────────────────────────────────
// Owned in JS, not read back out of `input:checked` — a carousel only renders
// the step you're on, so a DOM-query getter would throw for any step the
// player never opened.
let mode = 'multiplayer';
let roomSize = 5;
let timeLimit = 120;
let roomAction = 'quickfill'; // multiplayer: quickfill|create|join · versus: create|join
let subject = 'science';
let grade = 5;

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

/* ── SECTION 2 — What to spell ─────────────────────────────────
   Subject → Grade. The grade decides how hard the words are, not which
   letters appear: the march always covers every letter the subject has a
   word for (see data/vocab/index.js). */
const topic = createCarousel(topicMount);
topic.addSlide('subject', 'Subject', () => {});
topic.addSlide('grade', 'Grade', () => {});

renderChoiceStep(topic, 'subject', {
  title: 'Which subject?',
  name: 'vocab-subject',
  options: Object.entries(SUBJECTS).map(([key, s], i) => ({
    value: key, label: s.label, checked: i === 0,
  })),
  onPick: (v) => { subject = v; topic.goTo('grade'); },
});
renderChoiceStep(topic, 'grade', {
  title: 'Which grade?',
  subtitle: 'Sets how hard the words are — the alphabet march is the same either way.',
  name: 'vocab-grade',
  colorOffset: 3,
  options: GRADES.map((g) => ({ value: String(g), label: `Grade ${g}`, checked: g === grade })),
  onPick: (v) => { grade = Number(v); flow.next(); }, // last step of this section
});
topic.start('subject');

/* ── SECTION 3 — Game Options ─────────────────────────────────
   Mode → Room Size → Time Limit. Versus skips Room Size — it's always 1v1. */
const options = createCarousel(optionsMount);
options.addSlide('mode', 'Mode', () => {});
options.addSlide('size', 'Room Size', () => {});
options.addSlide('time', 'Time Limit', () => {});

renderChoiceStep(options, 'mode', {
  title: 'How do you want to play?',
  name: 'vocab-mode',
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
renderChoiceStep(options, 'size', {
  title: 'How many players?',
  name: 'vocab-size',
  colorOffset: 2,
  options: [
    { value: '5', label: '5 players', checked: true },
    { value: '10', label: '10 players' },
  ],
  onPick: (v) => { roomSize = Number(v); options.goTo('time'); },
});
renderChoiceStep(options, 'time', {
  title: 'How long is the round?',
  name: 'vocab-time',
  colorOffset: 4,
  options: TIME_LIMITS.map((t) => ({ value: String(t.value), label: t.label, checked: !!t.checked })),
  onPick: (v) => { timeLimit = Number(v); flow.next(); }, // last step of this section
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
    name: 'vocab-room-action',
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
    el: $('vocab-section-player'),
    chips: () => [{ label: myName(), avatar: avatarUrl(selectedAvatarSeed) }],
  },
  {
    el: $('vocab-section-topic'),
    chips: () => [
      { label: SUBJECTS[subject].label },
      { label: `Grade ${grade}` },
      { label: `${roundLetters(subject, grade).length} letters` },
    ],
  },
  {
    el: $('vocab-section-options'),
    chips: () => {
      const t = TIME_LIMITS.find((x) => x.value === timeLimit);
      return mode === 'versus'
        ? [{ label: 'Versus 1v1' }, { label: t.label }]
        : [{ label: 'Multiplayer' }, { label: `${roomSize} players` }, { label: t.label }];
    },
  },
  {
    el: $('vocab-section-room'),
    chips: () => [{
      label: roomAction === 'quickfill' ? 'Quick Fill' : roomAction === 'create' ? 'Create Room' : 'Join with Code',
    }],
  },
], {
  onChange: (_i, isLast) => { startBtn.hidden = !isLast; },
});

updateStartLabel();

// ── Avatar picker ────────────────────────────────────────────────────────
// Downscales + crops to a centered square, then compresses to a small JPEG
// data URL — comfortably inside localStorage limits, no server upload.
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
    <input type="radio" name="vocab-avatar" value="${CUSTOM_AVATAR_VALUE}" ${selectedAvatarSeed === CUSTOM_AVATAR_VALUE ? 'checked' : ''} />
    ${customAvatarDataUrl ? `<img src="${customAvatarDataUrl}" alt="Your photo" loading="lazy" />` : UPLOAD_ICON_SVG}
  `;
  uploadLabel.addEventListener('click', () => avatarUploadInput.click());
  avatarGrid.appendChild(uploadLabel);

  AVATAR_SEEDS.forEach((seed, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice ${stickyColor(i + 1)}`;
    label.innerHTML = `<input type="radio" name="vocab-avatar" value="${seed}" ${seed === selectedAvatarSeed ? 'checked' : ''} /><img src="${avatarUrl(seed)}" alt="${seed} avatar" loading="lazy" />`;
    avatarGrid.appendChild(label);
  });
}
renderAvatarGrid();

avatarGrid.addEventListener('change', (e) => {
  const input = e.target.closest('input[name="vocab-avatar"]');
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
let lobbyRevealTimers = [];
function clearLobbyReveal() {
  lobbyRevealTimers.forEach((t) => clearTimeout(t));
  lobbyRevealTimers = [];
}

function seatSticker(i, avatarSeed, label) {
  const el = document.createElement('span');
  const empty = !avatarSeed;
  el.className = `pp-sticky pp-sticky--tape vocab-lobby-seat ${empty ? 'is-empty' : stickyColor(i)}`;
  el.innerHTML = empty
    ? '<span class="vocab-lobby-seat-mark">?</span>'
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
  }).catch(() => {}); // clipboard permission can be denied — the code is still there to read
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
function renderResults(ranked) {
  leaderboardEl.innerHTML = '';
  const total = ranked.length;
  ranked.forEach((row, i) => {
    const isWinner = i === 0;
    const tilt = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3));
    const li = document.createElement('li');
    li.className = [
      'vocab-lb-row', 'pp-sticky', 'pp-sticky--tape',
      isWinner ? '' : stickyColor(i),
      row.isSelf ? 'is-self' : '',
      isWinner ? 'is-winner' : '',
    ].filter(Boolean).join(' ');
    li.style.setProperty('--delay', `${(total - 1 - i) * 130}ms`);
    li.style.setProperty('--pp-note-tilt', `${tilt}deg`);

    const avatar = document.createElement('span');
    avatar.className = 'vocab-lb-avatar';
    avatar.innerHTML = `<img src="${avatarUrl(row.avatarSeed || row.name)}" alt="" loading="lazy" />`;

    const rank = document.createElement('span');
    rank.className = 'vocab-lb-rank';
    if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = String(i + 1);

    const name = document.createElement('span');
    name.className = 'vocab-lb-name';
    name.textContent = row.name;

    const scoreEl = document.createElement('span');
    scoreEl.className = 'vocab-lb-score';
    scoreEl.textContent = String(row.score);

    li.append(avatar, rank, name, scoreEl);
    leaderboardEl.appendChild(li);
  });
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('vocab-nav-hidden');

  if (ranked[0] && ranked[0].isSelf) {
    setTimeout(launchConfetti, (total - 1) * 130 + 400);
  }
}
function hideResults() {
  resultsBd.classList.remove('open');
  resultsBd.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('vocab-nav-hidden');
}

function launchConfetti() {
  const colors = ['#f4c95d', '#6fb7e8', '#7cc47c', '#f07a7a', '#e8c8ff', '#ffd7a3'];
  const container = document.createElement('div');
  container.className = 'vocab-confetti';
  document.body.appendChild(container);
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('span');
    piece.className = 'vocab-confetti-piece';
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

// ── Round orchestration (shared by all matchmaking paths) ───────────────
async function playRoundAndShowResults(room, name) {
  const roster = buildRoster(room, name);
  const myScore = await startRound({
    seed: room.seed,
    timeLimit: room.timeLimit,
    startAt: room.startAt,
    subject: room.subject,
    grade: room.grade,
    roster,
  });

  showAwaiting();

  // The bots raced the same alphabet the player did — the room's, not the
  // one this client's setup screen happens to be showing.
  const letterCount = roundLetters(room.subject, room.grade).length;

  let ranked;
  try {
    ranked = await finishRound({
      roomId: room.roomId,
      seed: room.seed,
      timeLimit: room.timeLimit,
      botsNeeded: room.botsNeeded,
      letterCount,
      myScore,
    });
  } catch (e) {
    ranked = [{ name, score: myScore, isBot: false, isSelf: true, avatarSeed: selectedAvatarSeed }];
  }
  const selfRow = ranked.find((r) => r.isSelf);
  if (selfRow) selfRow.avatarSeed = selectedAvatarSeed;

  hideAwaiting();
  startBtn.disabled = false;
  renderResults(ranked);
}

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

async function runMultiplayer(name) {
  showLobby(roomSize);
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size: roomSize, timeLimit, subject, grade, displayName: name },
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
  let created;
  try {
    created = await createCodeRoom(
      { mode: roomMode, size, timeLimit, subject, grade, displayName: name },
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

async function runJoin(name, fallbackSize) {
  const code = (codeInput.value || '').trim().toUpperCase();
  if (code.length !== 6) {
    alert('Enter the 6-character room code your friend shared.');
    startBtn.disabled = false;
    return;
  }
  showLobby(fallbackSize); // best guess until the joined room's real size arrives
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

async function runVocab() {
  startBtn.disabled = true;
  await getCurrentUser();
  const name = myName();

  if (mode === 'versus') {
    if (roomAction === 'join') await runJoin(name, 2);
    else await runCreate(name, 2, 'versus');
    return;
  }

  if (roomAction === 'join') await runJoin(name, roomSize);
  else if (roomAction === 'create') await runCreate(name, roomSize, 'multiplayer');
  else await runMultiplayer(name);
}

startBtn.addEventListener('click', runVocab);
lobbyCancel.addEventListener('click', () => {
  // v1 doesn't retract the Firestore join/room-create on cancel — the
  // abandon-fallback timers on other clients (or a solo bot-fill) resolve an
  // orphaned room naturally, and unread docs aren't billed.
  cancelled = true;
  hideLobby();
  startBtn.disabled = false;
});
againBtn.addEventListener('click', hideResults);

// Preselect mode from nav links like ?mode=versus
if (new URLSearchParams(location.search).get('mode') === 'versus') {
  mode = 'versus';
  roomAction = 'create'; // Versus has no Quick Fill
  renderRoomEntry();
  updateStartLabel();
}
