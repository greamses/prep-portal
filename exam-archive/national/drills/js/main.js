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
  fracAdd: '+ Addition', fracSub: '− Subtraction', fracMul: '× Multiplication', fracDiv: '÷ Division',
};

// Category filters which operations are on offer. Basic keeps the default
// (multiply + divide ticked, addition opt-in — mirrors the old flat list's
// defaults); Exponent and Fractions start fully opt-in, same as square/sqrt
// used to be.
const CATEGORY_OPERATIONS = {
  basic: ['add', 'multiply', 'divide'],
  exponent: ['square', 'cube', 'sqrt', 'cuberoot'],
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
const modeToggle = $('drill-mode-toggle');
const sizeField = $('drill-size-field');
const categoryToggle = $('drill-category-toggle');
const operationsRow = $('drill-operations-row');
const fractionTypeRow = $('drill-fraction-type-row');
const rangeRow = $('drill-range-row');
const numbersField = $('drill-numbers-field');
const numbersGrid = $('drill-numbers-grid');
const mpField = $('drill-mp-field');
const mpToggle = $('drill-mp-toggle');
const mpCodeInput = $('drill-mp-code-input');
const versusField = $('drill-versus-field');
const versusToggle = $('drill-versus-toggle');
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
let range = 'all';
const tables = new Set(); // 1-9 numbers only — nothing checked by default, user ticks which to drill
const operations = new Set(CATEGORY_DEFAULT_OPS.basic);
const fractionTypes = new Set(); // Fractions category only — opt-in, like the operations above

function getCurrentUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) { unsub(); resolve(user); }
    });
  });
}

function getMode() { return document.querySelector('input[name="drill-mode"]:checked').value; }
function getSize() { return parseInt(document.querySelector('input[name="drill-size"]:checked').value, 10); }
function getTimeLimit() { return parseInt(document.querySelector('input[name="drill-time"]:checked').value, 10); }
function getVersusAction() { return document.querySelector('input[name="drill-versus-action"]:checked').value; }
function getMpAction() { return document.querySelector('input[name="drill-mp-action"]:checked').value; }
function getCategory() { return document.querySelector('input[name="drill-category"]:checked').value; }

// Only the 1-9 bucket is fine enough to cherry-pick individual numbers from
// (and only for Basic — Exponent "just sticks with the ranges"). Every
// other bucket is drilled as a whole block.
function isNumbersMode() { return getCategory() === 'basic' && range === '1-9'; }

// The actual pool of "base" numbers handed to questionAt(): either the
// hand-picked 1-9 set, or every integer in the selected decade range.
function getTablesPool() {
  if (isNumbersMode()) return [...tables];
  const r = RANGES.find((x) => x.key === range) || RANGES[0];
  return Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i);
}

function updateStartDisabled() {
  const needsNumbers = isNumbersMode() && tables.size === 0;
  const needsFractionType = getCategory() === 'fractions' && fractionTypes.size === 0;
  startBtn.disabled = operations.size === 0 || needsNumbers || needsFractionType;
}

function updateStartLabel() {
  const mode = getMode();
  if (mode === 'multiplayer') {
    const action = getMpAction();
    startLabel.textContent = action === 'join' ? 'Join Room' : action === 'create' ? 'Create Room' : 'Find a Room';
    return;
  }
  startLabel.textContent = getVersusAction() === 'join' ? 'Join Room' : 'Create Room';
}

function onModeChange() {
  const mode = getMode();
  sizeField.hidden = mode === 'versus';
  mpField.hidden = mode !== 'multiplayer';
  versusField.hidden = mode !== 'versus';
  updateStartLabel();
}
modeToggle.addEventListener('change', onModeChange);

mpToggle.addEventListener('change', () => {
  mpCodeInput.hidden = getMpAction() !== 'join';
  updateStartLabel();
});

versusToggle.addEventListener('change', () => {
  codeInput.hidden = getVersusAction() !== 'join';
  updateStartLabel();
});

// ── Game name ──────────────────────────────────────────────────────────
nameInput.value = localStorage.getItem(NAME_KEY) || '';
nameInput.addEventListener('input', () => localStorage.setItem(NAME_KEY, nameInput.value));
getCurrentUser().then((user) => {
  if (!nameInput.value && user.displayName) nameInput.value = user.displayName;
});

// ── Numbers (1-9 only — every higher bucket is drilled as a whole range) ─
function renderNumbersGrid() {
  numbersGrid.innerHTML = '';
  UNIT_NUMBERS.forEach((n, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice ${stickyColor(i)}`;
    label.innerHTML = `<input type="checkbox" value="${n}" ${tables.has(n) ? 'checked' : ''} /><span>${n}</span>`;
    numbersGrid.appendChild(label);
  });
}
renderNumbersGrid();

numbersGrid.addEventListener('change', (e) => {
  const cb = e.target.closest('input[type="checkbox"]');
  if (!cb) return;
  const n = parseInt(cb.value, 10);
  if (cb.checked) tables.add(n);
  else tables.delete(n);
  updateStartDisabled();
});

// ── Range (All / 1-9 / decade buckets up to 100) ────────────────────────
function renderRangeRow() {
  rangeRow.innerHTML = '';
  RANGES.forEach((r, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice ${stickyColor(i + 6)}`;
    label.innerHTML = `<input type="radio" name="drill-range" value="${r.key}" ${r.key === range ? 'checked' : ''} /><span>${r.label}</span>`;
    rangeRow.appendChild(label);
  });
}
renderRangeRow();

function updateNumbersVisibility() {
  numbersField.hidden = !isNumbersMode();
}

rangeRow.addEventListener('change', (e) => {
  const radio = e.target.closest('input[name="drill-range"]');
  if (!radio) return;
  range = radio.value;
  updateNumbersVisibility();
  updateStartDisabled();
});

// ── Operations — the set on offer depends on Category (Basic: add/×/÷,
// Exponent: square/cube/√x/∛x, Fractions: +/−/×/÷); switching category
// resets to that category's own sensible default rather than carrying over
// a stale pick. ────────────────────────────────────────────────────────
function renderOperationsGrid() {
  operationsRow.innerHTML = '';
  CATEGORY_OPERATIONS[getCategory()].forEach((op, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice ${stickyColor(i + 3)}`;
    label.innerHTML = `<input type="checkbox" value="${op}" ${operations.has(op) ? 'checked' : ''} /><span>${OPERATION_LABELS[op]}</span>`;
    operationsRow.appendChild(label);
  });
}
renderOperationsGrid();

operationsRow.addEventListener('change', (e) => {
  const cb = e.target.closest('input[type="checkbox"]');
  if (!cb) return;
  if (cb.checked) operations.add(cb.value);
  else operations.delete(cb.value);
  updateStartDisabled();
});

// ── Fraction type — Fractions only, a second independent dimension
// (which shape of fraction) alongside the operation (which arithmetic). ──
function renderFractionTypeRow() {
  fractionTypeRow.innerHTML = '';
  FRACTION_TYPES.forEach((t, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice ${stickyColor(i + 9)}`;
    label.innerHTML = `<input type="checkbox" value="${t}" ${fractionTypes.has(t) ? 'checked' : ''} /><span>${FRACTION_TYPE_LABELS[t]}</span>`;
    fractionTypeRow.appendChild(label);
  });
}
renderFractionTypeRow();

fractionTypeRow.addEventListener('change', (e) => {
  const cb = e.target.closest('input[type="checkbox"]');
  if (!cb) return;
  if (cb.checked) fractionTypes.add(cb.value);
  else fractionTypes.delete(cb.value);
  updateStartDisabled();
});

function updateFractionTypeVisibility() {
  fractionTypeRow.hidden = getCategory() !== 'fractions';
}

categoryToggle.addEventListener('change', () => {
  operations.clear();
  CATEGORY_DEFAULT_OPS[getCategory()].forEach((op) => operations.add(op));
  fractionTypes.clear();
  renderOperationsGrid();
  renderFractionTypeRow();
  updateFractionTypeVisibility();
  updateNumbersVisibility();
  updateStartDisabled();
});

updateFractionTypeVisibility();
updateNumbersVisibility();
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
  const size = getSize();
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
  const size = getSize();
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
  const code = (mpCodeInput.value || '').trim().toUpperCase();
  if (code.length !== 6) {
    alert('Enter the 6-character room code your friend shared.');
    startBtn.disabled = false;
    return;
  }
  showLobby(getSize()); // best guess until the joined room's real size arrives below
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

  const mode = getMode();
  const timeLimit = getTimeLimit();
  const operationsList = [...operations];
  const tablesList = getTablesPool();
  const fractionTypesList = getCategory() === 'fractions' ? [...fractionTypes] : [];
  const myName = (nameInput.value || '').trim() || auth.currentUser.displayName || 'Player';

  if (mode === 'versus') {
    if (getVersusAction() === 'join') await runVersusJoin({ timeLimit, myName });
    else await runVersusCreate({ timeLimit, operationsList, tablesList, fractionTypesList, myName });
    return;
  }

  const mpAction = getMpAction();
  if (mpAction === 'join') await runMultiplayerJoin({ timeLimit, myName });
  else if (mpAction === 'create') await runMultiplayerCreate({ timeLimit, operationsList, tablesList, fractionTypesList, myName });
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
if (initialMode === 'versus' || initialMode === 'multiplayer') {
  const radio = document.querySelector(`input[name="drill-mode"][value="${initialMode}"]`);
  if (radio) radio.checked = true;
}
onModeChange();
