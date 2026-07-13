/* ═══════════════════════════════════════════════════════
   DRILLS — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays. Multiplayer uses
   anonymous pool matching; Versus is always a private 1v1 via a shared
   room code (create-and-share, or join-with-code).
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { UNIT_NUMBERS } from './rng.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound } from './leaderboard.js';
import { createCarousel, createSectionFlow, renderChoiceStep, renderMultiStep, renderComingSoon } from '/utils/components/setup-carousel.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

// Curated seeds for the player's own avatar picker — any string works with
// DiceBear, these are just a fun fixed set to choose between.
const AVATAR_SEEDS = ['Explorer', 'Astro', 'Ranger', 'Comet', 'Nova', 'Pixel', 'Quokka', 'Robo', 'Sunny', 'Turbo', 'Breezy', 'Sparkle'];
const AVATAR_SEED_KEY = 'drillAvatarSeed';
let selectedAvatarSeed = localStorage.getItem(AVATAR_SEED_KEY) || AVATAR_SEEDS[0];

// A user-uploaded photo (resized + compressed to a small data URL, see
// resizeAvatarFile()) — stored locally only, same as every other avatar
// choice; avatar choice was never synced to other players in a room to
// begin with (see leaderboard.js: other real players' rows always render
// a uid-derived DiceBear face, not their actual pick).
const CUSTOM_AVATAR_VALUE = 'custom';
const CUSTOM_AVATAR_KEY = 'drillAvatarCustom';
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

const NAME_KEY = 'drillGameName';

const OPERATION_LABELS = {
  add: '+ Addition', multiply: '× Multiply', divide: '÷ Divide',
  square: 'x² Square', sqrt: '√x Root',
  cube: 'x³ Cube', cuberoot: '∛x Cube Root',
  power4: 'x⁴ Power 4', fourthroot: '⁴√x Fourth Root',
  fracAdd: '+ Addition', fracSub: '− Subtraction', fracMul: '× Multiplication', fracDiv: '÷ Division',
};

// Category filters which operations are on offer. Basic keeps the default
// (multiply + divide ticked, addition opt-in — mirrors the old flat list's
// defaults); Exponent and Fractions start fully opt-in, same as square/sqrt
// used to be.
const CATEGORY_OPERATIONS = {
  basic: ['add', 'multiply', 'divide'],
  exponent: ['square', 'cube', 'power4', 'sqrt', 'cuberoot', 'fourthroot'],
  fractions: ['fracAdd', 'fracSub', 'fracMul', 'fracDiv'],
};
const CATEGORY_DEFAULT_OPS = {
  basic: ['multiply', 'divide'],
  exponent: [],
  fractions: [],
};

// Fractions gets a second selector dimension — which shape of fraction
// question to draw (independent of which operation is ticked above).
const FRACTION_TYPES = ['like', 'unlike', 'wholeFraction'];
const FRACTION_TYPE_LABELS = { like: 'Like', unlike: 'Unlike', wholeFraction: 'Whole vs Fraction' };

// A question's "base" number is drawn from whichever pool these describe:
// hand-picked 1-9 numbers, or a whole decade practiced as one block ("higher
// numbers require practice through the range", not cherry-picked).
const RANGES = [
  { key: 'all', label: 'All', min: 1, max: 100 },
  { key: '1-9', label: '1–9', min: 1, max: 9 },
  { key: '10-19', label: '10–19', min: 10, max: 19 },
  { key: '20-29', label: '20–29', min: 20, max: 29 },
  { key: '30-39', label: '30–39', min: 30, max: 39 },
  { key: '40-49', label: '40–49', min: 40, max: 49 },
  { key: '50-59', label: '50–59', min: 50, max: 59 },
  { key: '60-69', label: '60–69', min: 60, max: 69 },
  { key: '70-79', label: '70–79', min: 70, max: 79 },
  { key: '80-89', label: '80–89', min: 80, max: 89 },
  { key: '90-100', label: '90–100', min: 90, max: 100 },
];

// Fractions don't use a "number range" at all — in rng.js the same pool feeds
// the DENOMINATORS (like/unlike/wholeFraction all draw from it). A range of
// 90–100 would generate ⁴⁷⁄₉₃ + ⁸⁸⁄₉₇, which is not a fraction drill. Small
// denominators are the whole point, so Fractions gets this instead.
const DENOMINATORS = Array.from({ length: 11 }, (_, i) => i + 2); // 2..12

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

const nameInput = $('drill-name-input');
const avatarGrid = $('drill-avatar-grid');
const avatarUploadInput = $('drill-avatar-upload-input');
const topicMount = $('drill-topic-carousel');
const optionsMount = $('drill-options-carousel');
const roomMount = $('drill-room-carousel');
const codeInput = $('drill-code-input');
const startBtn = $('drill-start-btn');
const startLabel = $('drill-start-label');

const lobbyBd = $('drill-lobby-bd');
const lobbyStatus = $('drill-lobby-status');
const lobbyCode = $('drill-lobby-code');
const lobbyCodeText = $('drill-lobby-code-text');
const lobbyCodeCopy = $('drill-lobby-code-copy');
const lobbySeats = $('drill-lobby-seats');
const lobbyCount = $('drill-lobby-count');
const lobbyCancel = $('drill-lobby-cancel');

const awaitingBd = $('drill-awaiting-bd');

const resultsBd = $('drill-results-bd');
const leaderboardEl = $('drill-leaderboard');
const againBtn = $('drill-again-btn');

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
let timeLimit = 60;
let roomAction = 'quickfill'; // multiplayer: quickfill|create|join · versus: create|join

let categoryValue = 'basic';
let range = 'all';
const tables = new Set(); // Basic + 1-9 only — the cherry-picked number set
const operations = new Set(CATEGORY_DEFAULT_OPS.basic);
const fractionTypes = new Set(); // Fractions only — opt-in
const denominators = new Set(DENOMINATORS); // Fractions only — tick-all default

function getCurrentUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) { unsub(); resolve(user); }
    });
  });
}

// Basic and Exponent both drill the full 1–100 range. Fractions has no range
// at all — its pool is the denominator set (see DENOMINATORS above).
function rangesFor() { return RANGES; }

// Only the 1-9 bucket is fine enough to cherry-pick individual numbers from
// (and only for Basic — Exponent just sticks with its ranges). Every other
// bucket is drilled as a whole block.
function isNumbersMode() { return categoryValue === 'basic' && range === '1-9'; }

// The actual pool of "base" numbers handed to questionAt(). For Fractions
// that pool IS the denominator set — there is no range to expand.
function getTablesPool() {
  if (categoryValue === 'fractions') return [...denominators];
  if (isNumbersMode()) return [...tables];
  const list = rangesFor(categoryValue);
  const r = list.find((x) => x.key === range) || list[0];
  return Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i);
}

function updateStartDisabled() {
  const needsNumbers = isNumbersMode() && tables.size === 0;
  const isFractions = categoryValue === 'fractions';
  const needsFractionType = isFractions && fractionTypes.size === 0;
  const needsDenominators = isFractions && denominators.size === 0;
  startBtn.disabled = operations.size === 0 || needsNumbers || needsFractionType || needsDenominators;
}

function updateStartLabel() {
  if (mode === 'multiplayer') {
    startLabel.textContent =
      roomAction === 'join' ? 'Join Room' : roomAction === 'create' ? 'Create Room' : 'Find a Room';
    return;
  }
  startLabel.textContent = roomAction === 'join' ? 'Join Room' : 'Create Room';
}

// ── Game name ──────────────────────────────────────────────────────────
nameInput.value = localStorage.getItem(NAME_KEY) || '';
nameInput.addEventListener('input', () => localStorage.setItem(NAME_KEY, nameInput.value));
getCurrentUser().then((user) => {
  if (!nameInput.value && user.displayName) nameInput.value = user.displayName;
});

/* ── SECTION 1 — What to drill ────────────────────────────────────────────
   Category → the settings that category actually uses. The three categories
   genuinely need different things, so none of them shows a step whose value
   the question generator would ignore:

     Basic     → Operations → Number Range (1–100) → [1–9 only: pick numbers]
     Exponent  → Operations → Number Range (1–100)
     Fractions → Fraction Type → Operations → Denominators (2–12)

   Fractions has NO number range on purpose: in rng.js that same pool supplies
   the denominators, so "90–100" would mean fractions over ninety-somethings.
   Switching category resets the whole branch, so nothing stale carries over. */
const topic = createCarousel(topicMount);
let operationsEl = null;
let fractionTypeEl = null;
let denominatorsEl = null;
let numbersEl = null;
let rangeEl = null;

function renderOperationsPick() {
  const isFractions = categoryValue === 'fractions';
  renderMultiStep(operationsEl, {
    title: `Which ${categoryValue} operations?`,
    colorOffset: 3,
    options: CATEGORY_OPERATIONS[categoryValue].map((op) => ({ value: op, label: OPERATION_LABELS[op] })),
    isChecked: (v) => operations.has(v),
    onToggle: (v, checked) => {
      if (checked) operations.add(v); else operations.delete(v);
      updateStartDisabled();
    },
    nextLabel: isFractions ? 'Next: Denominators →' : 'Next: Number Range →',
    onNext: () => {
      if (isFractions) { renderDenominatorsPick(); topic.goTo('denominators'); return; }
      renderRangePick();
      topic.goTo('range');
    },
  });
}

function renderFractionTypePick() {
  renderMultiStep(fractionTypeEl, {
    title: 'Which fraction type?',
    colorOffset: 9,
    options: FRACTION_TYPES.map((t) => ({ value: t, label: FRACTION_TYPE_LABELS[t] })),
    isChecked: (v) => fractionTypes.has(v),
    onToggle: (v, checked) => {
      if (checked) fractionTypes.add(v); else fractionTypes.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next: Operations →',
    onNext: () => { renderOperationsPick(); topic.goTo('operations'); },
  });
}

function renderDenominatorsPick() {
  renderMultiStep(denominatorsEl, {
    title: 'Which denominators?',
    subtitle: 'Fractions are built from these — keep them small and they stay drillable.',
    grid: true,
    colorOffset: 0,
    options: DENOMINATORS.map((n) => ({ value: String(n), label: String(n) })),
    isChecked: (v) => denominators.has(Number(v)),
    onToggle: (v, checked) => {
      const n = Number(v);
      if (checked) denominators.add(n); else denominators.delete(n);
      updateStartDisabled();
    },
    nextLabel: 'Next: Game Options →',
    onNext: () => flow.next(), // last step of this section
  });
}

function renderRangePick() {
  renderChoiceStep(rangeEl, {
    title: 'Which number range?',
    name: 'drill-range',
    colorOffset: 6,
    options: rangesFor().map((r) => ({ value: r.key, label: r.label, checked: r.key === range })),
    onPick: (v) => {
      range = v;
      updateStartDisabled();
      // 1–9 is the one bucket you can cherry-pick from; every other range is
      // drilled whole, so the range IS the last step of this section.
      if (isNumbersMode()) { renderNumbersPick(); topic.goTo('numbers'); }
      else flow.next();
    },
  });
}

function renderNumbersPick() {
  renderMultiStep(numbersEl, {
    title: 'Which numbers (1–9)?',
    grid: true,
    colorOffset: 0,
    options: UNIT_NUMBERS.map((n) => ({ value: String(n), label: String(n) })),
    isChecked: (v) => tables.has(Number(v)),
    onToggle: (v, checked) => {
      const n = Number(v);
      if (checked) tables.add(n); else tables.delete(n);
      updateStartDisabled();
    },
    nextLabel: 'Next: Game Options →',
    onNext: () => flow.next(), // last step of this section
  });
}

topic.addSlide('category', 'Category', (el) => {
  renderChoiceStep(el, {
    title: 'What category?',
    name: 'drill-category',
    options: [
      { value: 'basic', label: 'Basic', checked: true },
      { value: 'exponent', label: 'Exponent' },
      { value: 'fractions', label: 'Fractions' },
    ],
    onPick: (v) => {
      categoryValue = v;
      // Reset the whole branch — a range picked under Basic must not survive
      // into Exponent (whose ranges only go to 20) or Fractions (no range).
      operations.clear();
      CATEGORY_DEFAULT_OPS[v].forEach((op) => operations.add(op));
      fractionTypes.clear();
      tables.clear();
      range = 'all';
      denominators.clear();
      DENOMINATORS.forEach((n) => denominators.add(n));
      updateStartDisabled();

      if (v === 'fractions') {
        renderFractionTypePick();
        topic.goTo('fraction-type');
      } else {
        renderOperationsPick();
        topic.goTo('operations');
      }
    },
  });
});

topic.addSlide('fraction-type', 'Fraction Type', (el) => { fractionTypeEl = el; });
topic.addSlide('operations', 'Operations', (el) => { operationsEl = el; });
topic.addSlide('range', 'Number Range', (el) => { rangeEl = el; });
topic.addSlide('numbers', 'Numbers', (el) => { numbersEl = el; });
topic.addSlide('denominators', 'Denominators', (el) => { denominatorsEl = el; });

topic.start('category');

/* ── SECTION 2 — Game Options ─────────────────────────────────────────────
   Mode → Room Size → Time Limit. Versus skips Room Size — it's always 1v1. */
const options = createCarousel(optionsMount);

options.addSlide('mode', 'Mode', (el) => {
  renderChoiceStep(el, {
    title: 'How do you want to play?',
    name: 'drill-mode',
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
    name: 'drill-size',
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
    name: 'drill-time',
    colorOffset: 4,
    options: [
      { value: '30', label: '30s' },
      { value: '60', label: '60s', checked: true },
      { value: '90', label: '90s' },
      { value: '120', label: '120s' },
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
    name: 'drill-room-action',
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
    el: $('drill-section-topic'),
    summary: () => {
      const ops = [...operations].map((o) => (OPERATION_LABELS[o] || o).split(' ').slice(1).join(' ')).join(', ');
      const cat = categoryValue[0].toUpperCase() + categoryValue.slice(1);
      if (categoryValue === 'fractions') return `${cat} · ${ops || 'no ops'} · ${denominators.size} denominators`;
      const r = RANGES.find((x) => x.key === range);
      const scope = isNumbersMode() ? `${tables.size} numbers` : (r ? r.label : range);
      return `${cat} · ${ops || 'no ops'} · ${scope}`;
    },
  },
  {
    el: $('drill-section-options'),
    summary: () =>
      mode === 'versus' ? `Versus 1v1 · ${timeLimit}s` : `Multiplayer · ${roomSize} players · ${timeLimit}s`,
  },
  {
    el: $('drill-section-room'),
    summary: () =>
      roomAction === 'quickfill' ? 'Quick Fill' : roomAction === 'create' ? 'Create Room' : 'Join with Code',
  },
]);

updateStartDisabled();
updateStartLabel();

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
    <input type="radio" name="drill-avatar" value="${CUSTOM_AVATAR_VALUE}" ${selectedAvatarSeed === CUSTOM_AVATAR_VALUE ? 'checked' : ''} />
    ${customAvatarDataUrl ? `<img src="${customAvatarDataUrl}" alt="Your photo" loading="lazy" />` : UPLOAD_ICON_SVG}
  `;
  uploadLabel.addEventListener('click', () => avatarUploadInput.click());
  avatarGrid.appendChild(uploadLabel);

  AVATAR_SEEDS.forEach((seed, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice ${stickyColor(i + 1)}`;
    label.innerHTML = `<input type="radio" name="drill-avatar" value="${seed}" ${seed === selectedAvatarSeed ? 'checked' : ''} /><img src="${avatarUrl(seed)}" alt="${seed} avatar" loading="lazy" />`;
    avatarGrid.appendChild(label);
  });
}
renderAvatarGrid();

avatarGrid.addEventListener('change', (e) => {
  const input = e.target.closest('input[name="drill-avatar"]');
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
  el.className = `pp-sticky pp-sticky--tape drill-lobby-seat ${empty ? 'is-empty' : stickyColor(i)}`;
  el.innerHTML = empty
    ? '<span class="drill-lobby-seat-mark">?</span>'
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
      'drill-lb-row', 'pp-sticky', 'pp-sticky--tape',
      isWinner ? '' : stickyColor(i),
      row.isSelf ? 'is-self' : '',
      isWinner ? 'is-winner' : '',
    ].filter(Boolean).join(' ');
    li.style.setProperty('--delay', `${(total - 1 - i) * 130}ms`);
    li.style.setProperty('--pp-note-tilt', `${tilt}deg`);

    const avatar = document.createElement('span');
    avatar.className = 'drill-lb-avatar';
    avatar.innerHTML = `<img src="${avatarUrl(row.avatarSeed || row.name)}" alt="" loading="lazy" />`;

    const rank = document.createElement('span');
    rank.className = 'drill-lb-rank';
    if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = String(i + 1);

    const name = document.createElement('span');
    name.className = 'drill-lb-name';
    name.textContent = row.name;

    const scoreEl = document.createElement('span');
    scoreEl.className = 'drill-lb-score';
    scoreEl.textContent = String(row.score);

    li.append(avatar, rank, name, scoreEl);
    leaderboardEl.appendChild(li);
  });
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drill-nav-hidden');

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
  document.body.classList.remove('drill-nav-hidden');
}

// A short vanilla confetti burst — no library, just falling/rotating divs
// — fired once when the signed-in player takes first place.
function launchConfetti() {
  const colors = ['#f4c95d', '#6fb7e8', '#7cc47c', '#f07a7a', '#e8c8ff', '#ffd7a3'];
  const container = document.createElement('div');
  container.className = 'drill-confetti';
  document.body.appendChild(container);
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('span');
    piece.className = 'drill-confetti-piece';
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
  const myScore = await startRound({
    seed: room.seed,
    timeLimit: room.timeLimit,
    startAt: room.startAt,
    operations: room.operations,
    tables: room.tables,
    fractionTypes: room.fractionTypes,
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

async function runMultiplayer({ timeLimit, operationsList, tablesList, fractionTypesList, myName }) {
  const size = roomSize;
  showLobby(size);
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, displayName: myName },
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

async function runMultiplayerCreate({ timeLimit, operationsList, tablesList, fractionTypesList, myName }) {
  const size = roomSize;
  showLobby(size);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'multiplayer', size, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, displayName: myName },
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

async function runMultiplayerJoin({ timeLimit, myName }) {
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

async function runVersusCreate({ timeLimit, operationsList, tablesList, fractionTypesList, myName }) {
  showLobby(2);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'versus', size: 2, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, displayName: myName },
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

async function runVersusJoin({ timeLimit, myName }) {
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

async function runDrill() {
  startBtn.disabled = true;
  await getCurrentUser();

  const operationsList = [...operations];
  const tablesList = getTablesPool(); // for Fractions this IS the denominator set
  const fractionTypesList = categoryValue === 'fractions' ? [...fractionTypes] : [];
  const myName = (nameInput.value || '').trim() || auth.currentUser.displayName || 'Player';

  if (mode === 'versus') {
    if (roomAction === 'join') await runVersusJoin({ timeLimit, myName });
    else await runVersusCreate({ timeLimit, operationsList, tablesList, fractionTypesList, myName });
    return;
  }

  if (roomAction === 'join') await runMultiplayerJoin({ timeLimit, myName });
  else if (roomAction === 'create') await runMultiplayerCreate({ timeLimit, operationsList, tablesList, fractionTypesList, myName });
  else await runMultiplayer({ timeLimit, operationsList, tablesList, fractionTypesList, myName });
}

startBtn.addEventListener('click', runDrill);
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
