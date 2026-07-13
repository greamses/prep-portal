/* ═══════════════════════════════════════════════════════
   GEOMETRY — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays. Same structure as
   Drills'/Puzzles' js/main.js — Multiplayer uses anonymous pool matching;
   Versus is always a private 1v1 via a shared room code (create-and-share,
   or join-with-code). Content selection (topic -> shapes -> given ->
   lengths) is a step-by-step carousel (see the "Topic carousel" section
   below and utils/components/setup-carousel.js) — Mode/Room Size/Time
   Limit stay a static strip beneath it.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { CIRCULAR_SHAPES, GIVEN_TYPES, RADIUS_NUMBERS, SIDE_NUMBERS } from './rng.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound } from './leaderboard.js';
import { createCarousel, renderChoiceStep, renderMultiStep, renderComingSoon } from '/utils/components/setup-carousel.js';

const REGULAR_SHAPES = ['triangle', 'square', 'rectangle'];

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

// Curated seeds for the player's own avatar picker — any string works with
// DiceBear, these are just a fun fixed set to choose between.
const AVATAR_SEEDS = ['Explorer', 'Astro', 'Ranger', 'Comet', 'Nova', 'Pixel', 'Quokka', 'Robo', 'Sunny', 'Turbo', 'Breezy', 'Sparkle'];
const AVATAR_SEED_KEY = 'geoAvatarSeed';
let selectedAvatarSeed = localStorage.getItem(AVATAR_SEED_KEY) || AVATAR_SEEDS[0];

// A user-uploaded photo (resized + compressed to a small data URL, see
// resizeAvatarFile()) — stored locally only, same as every other avatar
// choice; avatar choice was never synced to other players in a room to
// begin with (see leaderboard.js: other real players' rows always render
// a uid-derived DiceBear face, not their actual pick).
const CUSTOM_AVATAR_VALUE = 'custom';
const CUSTOM_AVATAR_KEY = 'geoAvatarCustom';
let customAvatarDataUrl = localStorage.getItem(CUSTOM_AVATAR_KEY) || null;

const avatarUrl = (seed) => {
  if (seed === CUSTOM_AVATAR_VALUE && customAvatarDataUrl) return customAvatarDataUrl;
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&size=64`;
};

const NAME_KEY = 'geoGameName';

const SHAPE_LABELS = {
  circle: 'Circle', semicircle: 'Semicircle', quadrant: 'Quadrant', sector: 'Sector', chord: 'Chord',
  triangle: 'Triangle', rectangle: 'Rectangle', square: 'Square',
};
const GIVEN_LABELS = { radius: 'Radius', diameter: 'Diameter' };

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

const nameInput = $('geo-name-input');
const avatarGrid = $('geo-avatar-grid');
const avatarUploadInput = $('geo-avatar-upload-input');
const topicMount = $('geo-topic-carousel');
const optionsMount = $('geo-options-carousel');
const roomMount = $('geo-room-carousel');
const codeInput = $('geo-code-input');
const startBtn = $('geo-start-btn');
const startLabel = $('geo-start-label');

const lobbyBd = $('geo-lobby-bd');
const lobbyStatus = $('geo-lobby-status');
const lobbyCode = $('geo-lobby-code');
const lobbyCodeText = $('geo-lobby-code-text');
const lobbyCodeCopy = $('geo-lobby-code-copy');
const lobbySeats = $('geo-lobby-seats');
const lobbyCount = $('geo-lobby-count');
const lobbyCancel = $('geo-lobby-cancel');

const awaitingBd = $('geo-awaiting-bd');

const resultsBd = $('geo-results-bd');
const leaderboardEl = $('geo-leaderboard');
const againBtn = $('geo-again-btn');

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
// Owned in JS rather than read back out of `input:checked` — a carousel only
// renders the step you're on, so a DOM-query getter would throw (or silently
// read a stale value) for any step the player never opened. These carry the
// defaults, and the carousels below just keep them in sync.
let mode = 'multiplayer';
let roomSize = 5;
let timeLimit = 60;
let roomAction = 'quickfill'; // multiplayer: quickfill|create|join · versus: create|join

// `shapes`/`given`/`lengths` are filled in when the topic tree reaches a real
// leaf — see the topic carousel below, which resets them to that branch's own
// defaults on entry. They start empty so Start stays disabled until a topic is
// actually chosen.
const shapes = new Set();
const given = new Set();
const lengths = new Set();
// Which pool the Lengths step is offering — the two shape families need
// different numbers (see rng.js), so this tracks whichever branch we're in.
let lengthPool = RADIUS_NUMBERS;

function isCurvedBranch() {
  return [...shapes].some((s) => CIRCULAR_SHAPES.includes(s));
}

function getCurrentUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) { unsub(); resolve(user); }
    });
  });
}

function updateStartDisabled() {
  // Given is only ever asked for — and only ever required — on the curved
  // branch; polygons label their own side lengths directly.
  const needsGiven = isCurvedBranch() && given.size === 0;
  startBtn.disabled = shapes.size === 0 || lengths.size === 0 || needsGiven;
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

/* ── SECTION 1 — Topic ────────────────────────────────────────────────────
   Lines/Angles/Shapes → 2D/3D → Polygons/Curved Shapes → the leaf pickers.
   Only the Shapes → 2D branch has real content today; every other branch is a
   "coming soon" leaf so the tree is honest about what's actually gradeable
   (see rng.js — Lines/Angles/3D/Nets/Chord have no question generator).

   The two branches genuinely need DIFFERENT settings, so neither one shows a
   step the other's questions would ignore:
     curved   → Given (radius/diameter) → Radius, multiples of 7 (pi = 22/7)
     polygons → no Given at all         → Side lengths, plain 3–20
   Entering a branch resets shapes/given/lengths to that branch's own defaults,
   so a setting picked on one branch can never leak into the other. ────────── */
const topic = createCarousel(topicMount);
let regularPickEl = null;
let curvedPickEl = null;
let givenPickEl = null;
let lengthsPickEl = null;

function renderLengthsPick() {
  const curved = isCurvedBranch();
  renderMultiStep(lengthsPickEl, {
    title: curved ? 'Radius (cm)' : 'Side lengths (cm)',
    subtitle: curved
      ? 'Multiples of 7, so pi = 22/7 always cancels cleanly.'
      : 'Every side is drawn from whichever numbers you tick.',
    grid: true,
    colorOffset: 2,
    options: lengthPool.map((n) => ({ value: String(n), label: String(n) })),
    isChecked: (v) => lengths.has(Number(v)),
    onToggle: (v, checked) => {
      const n = Number(v);
      if (checked) lengths.add(n); else lengths.delete(n);
      updateStartDisabled();
    },
  });
}

// Switch the whole branch's settings over in one place, so nothing stale can
// survive a hop from Curved to Polygons (or back).
function enterBranch(kind) {
  shapes.clear();
  given.clear();
  lengths.clear();

  if (kind === 'curved') {
    CIRCULAR_SHAPES.forEach((s) => shapes.add(s));
    GIVEN_TYPES.forEach((g) => given.add(g));
    lengthPool = RADIUS_NUMBERS;
  } else {
    REGULAR_SHAPES.forEach((s) => shapes.add(s));
    lengthPool = SIDE_NUMBERS; // no Given — polygons label their sides directly
  }
  lengthPool.forEach((n) => lengths.add(n)); // tick-all default

  if (kind === 'curved') { renderCurvedPick(); renderGivenPick(); }
  else renderRegularPick();
  renderLengthsPick();
  updateStartDisabled();
}

function renderRegularPick() {
  renderMultiStep(regularPickEl, {
    title: 'Which regular shapes?',
    colorOffset: 0,
    options: REGULAR_SHAPES.map((s) => ({ value: s, label: SHAPE_LABELS[s] })),
    isChecked: (v) => shapes.has(v),
    onToggle: (v, checked) => {
      if (checked) shapes.add(v); else shapes.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next: Side Lengths →',
    onNext: () => topic.goTo('lengths'),
  });
}

function renderCurvedPick() {
  renderMultiStep(curvedPickEl, {
    title: 'Which curved shapes?',
    colorOffset: 0,
    options: [
      ...CIRCULAR_SHAPES.map((s) => ({ value: s, label: SHAPE_LABELS[s] })),
      { value: 'chord', label: SHAPE_LABELS.chord, disabled: true, note: 'soon' },
    ],
    isChecked: (v) => shapes.has(v),
    onToggle: (v, checked) => {
      if (checked) shapes.add(v); else shapes.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next: Given →',
    onNext: () => topic.goTo('given'),
  });
}

function renderGivenPick() {
  renderMultiStep(givenPickEl, {
    title: 'Given the radius, diameter, or both?',
    colorOffset: 3,
    options: GIVEN_TYPES.map((g) => ({ value: g, label: GIVEN_LABELS[g] })),
    isChecked: (v) => given.has(v),
    onToggle: (v, checked) => {
      if (checked) given.add(v); else given.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next: Radius →',
    onNext: () => topic.goTo('lengths'),
  });
}

topic.addSlide('topic', 'Topic', (el) => {
  renderChoiceStep(el, {
    title: 'What do you want to practice?',
    name: 'geo-topic',
    options: [
      { value: 'lines', label: 'Lines' },
      { value: 'angles', label: 'Angles' },
      { value: 'shapes', label: 'Shapes' },
    ],
    onPick: (v) => {
      if (v === 'lines') topic.goTo('soon-lines');
      else if (v === 'angles') topic.goTo('soon-angles');
      else topic.goTo('shapes-dim');
    },
  });
});
topic.addSlide('soon-lines', 'Lines', (el) => renderComingSoon(el, {
  title: 'Lines', message: 'Line practice is coming soon — go back and pick Shapes for now.',
}));
topic.addSlide('soon-angles', 'Angles', (el) => renderComingSoon(el, {
  title: 'Angles', message: 'Angle practice is coming soon — go back and pick Shapes for now.',
}));

topic.addSlide('shapes-dim', '2D/3D', (el) => {
  renderChoiceStep(el, {
    title: '2D or 3D shapes?',
    name: 'geo-dim',
    colorOffset: 2,
    options: [
      { value: '2d', label: '2D Shapes' },
      { value: '3d', label: '3D Shapes' },
    ],
    onPick: (v) => (v === '3d' ? topic.goTo('soon-3d') : topic.goTo('kind-2d')),
  });
});
topic.addSlide('soon-3d', '3D Shapes', (el) => renderComingSoon(el, {
  title: '3D Shapes', message: '3D shape practice is coming soon — go back and pick 2D Shapes for now.',
}));

topic.addSlide('kind-2d', 'Polygons/Curved', (el) => {
  renderChoiceStep(el, {
    title: 'Polygons or curved shapes?',
    name: 'geo-kind',
    colorOffset: 4,
    options: [
      { value: 'polygons', label: 'Polygons' },
      { value: 'curved', label: 'Curved Shapes' },
    ],
    onPick: (v) => {
      if (v === 'polygons') { topic.goTo('regularity'); return; }
      enterBranch('curved');
      topic.goTo('curved-pick');
    },
  });
});

topic.addSlide('regularity', 'Regular/Irregular', (el) => {
  renderChoiceStep(el, {
    title: 'Regular or irregular polygons?',
    name: 'geo-regularity',
    options: [
      { value: 'regular', label: 'Regular' },
      { value: 'irregular', label: 'Irregular' },
    ],
    onPick: (v) => {
      if (v === 'irregular') { topic.goTo('soon-irregular'); return; }
      enterBranch('polygons');
      topic.goTo('regular-pick');
    },
  });
});
topic.addSlide('soon-irregular', 'Irregular', (el) => renderComingSoon(el, {
  title: 'Irregular Polygons', message: 'Nets of a cube/cuboid are coming soon — go back and pick Regular for now.',
}));

topic.addSlide('regular-pick', 'Regular Shapes', (el) => { regularPickEl = el; });
topic.addSlide('curved-pick', 'Curved Shapes', (el) => { curvedPickEl = el; });
topic.addSlide('given', 'Given', (el) => { givenPickEl = el; });
topic.addSlide('lengths', 'Lengths', (el) => { lengthsPickEl = el; });

topic.start('topic');

/* ── SECTION 2 — Game Options ─────────────────────────────────────────────
   Mode → Room Size → Time Limit. Room Size is skipped entirely for Versus,
   which is always 1v1 — asking "5 or 10 players?" for a 2-player game would
   be a setting the room ignores. ───────────────────────────────────────── */
const options = createCarousel(optionsMount);

options.addSlide('mode', 'Mode', (el) => {
  renderChoiceStep(el, {
    title: 'How do you want to play?',
    name: 'geo-mode',
    options: [
      { value: 'multiplayer', label: 'Multiplayer', checked: true },
      { value: 'versus', label: 'Versus (1v1)' },
    ],
    onPick: (v) => {
      mode = v;
      // Versus has no Quick Fill — a private 1v1 is always create-or-join.
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
    name: 'geo-size',
    colorOffset: 2,
    options: [
      { value: '5', label: '5 players', checked: true },
      { value: '10', label: '10 players' },
    ],
    onPick: (v) => {
      roomSize = Number(v);
      options.goTo('time');
    },
  });
});

options.addSlide('time', 'Time Limit', (el) => {
  renderChoiceStep(el, {
    title: 'How long is the round?',
    name: 'geo-time',
    colorOffset: 4,
    options: [
      { value: '30', label: '30s' },
      { value: '60', label: '60s', checked: true },
      { value: '90', label: '90s' },
      { value: '120', label: '120s' },
    ],
    onPick: (v) => { timeLimit = Number(v); },
  });
});

options.start('mode');

/* ── SECTION 3 — Room ─────────────────────────────────────────────────────
   Which entry options exist depends on Mode, so this is re-rendered whenever
   Mode changes. Picking "Join with Code" steps on to the code entry. ────── */
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
    name: 'geo-room-action',
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
    <input type="radio" name="geo-avatar" value="${CUSTOM_AVATAR_VALUE}" ${selectedAvatarSeed === CUSTOM_AVATAR_VALUE ? 'checked' : ''} />
    ${customAvatarDataUrl ? `<img src="${customAvatarDataUrl}" alt="Your photo" loading="lazy" />` : UPLOAD_ICON_SVG}
  `;
  uploadLabel.addEventListener('click', () => avatarUploadInput.click());
  avatarGrid.appendChild(uploadLabel);

  AVATAR_SEEDS.forEach((seed, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice ${stickyColor(i + 1)}`;
    label.innerHTML = `<input type="radio" name="geo-avatar" value="${seed}" ${seed === selectedAvatarSeed ? 'checked' : ''} /><img src="${avatarUrl(seed)}" alt="${seed} avatar" loading="lazy" />`;
    avatarGrid.appendChild(label);
  });
}
renderAvatarGrid();

avatarGrid.addEventListener('change', (e) => {
  const input = e.target.closest('input[name="geo-avatar"]');
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
  el.className = `pp-sticky pp-sticky--tape geo-lobby-seat ${empty ? 'is-empty' : stickyColor(i)}`;
  el.innerHTML = empty
    ? '<span class="geo-lobby-seat-mark">?</span>'
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
function renderResults(ranked) {
  leaderboardEl.innerHTML = '';
  const total = ranked.length;
  ranked.forEach((row, i) => {
    const isWinner = i === 0;
    const tilt = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3));
    const li = document.createElement('li');
    li.className = [
      'geo-lb-row', 'pp-sticky', 'pp-sticky--tape',
      isWinner ? '' : stickyColor(i),
      row.isSelf ? 'is-self' : '',
      isWinner ? 'is-winner' : '',
    ].filter(Boolean).join(' ');
    li.style.setProperty('--delay', `${(total - 1 - i) * 130}ms`);
    li.style.setProperty('--pp-note-tilt', `${tilt}deg`);

    const avatar = document.createElement('span');
    avatar.className = 'geo-lb-avatar';
    avatar.innerHTML = `<img src="${avatarUrl(row.avatarSeed || row.name)}" alt="" loading="lazy" />`;

    const rank = document.createElement('span');
    rank.className = 'geo-lb-rank';
    if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = String(i + 1);

    const name = document.createElement('span');
    name.className = 'geo-lb-name';
    name.textContent = row.name;

    const scoreEl = document.createElement('span');
    scoreEl.className = 'geo-lb-score';
    scoreEl.textContent = String(row.score);

    li.append(avatar, rank, name, scoreEl);
    leaderboardEl.appendChild(li);
  });
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('geo-nav-hidden');

  if (ranked[0] && ranked[0].isSelf) {
    const winnerRevealMs = (total - 1) * 130 + 400;
    setTimeout(launchConfetti, winnerRevealMs);
  }
}
function hideResults() {
  resultsBd.classList.remove('open');
  resultsBd.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('geo-nav-hidden');
}

function launchConfetti() {
  const colors = ['#f4c95d', '#6fb7e8', '#7cc47c', '#f07a7a', '#e8c8ff', '#ffd7a3'];
  const container = document.createElement('div');
  container.className = 'geo-confetti';
  document.body.appendChild(container);
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('span');
    piece.className = 'geo-confetti-piece';
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
    shapes: room.shapes,
    given: room.given,
    lengths: room.lengths,
    roster,
  });

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

async function runMultiplayer({ timeLimit, shapesList, givenList, lengthsList, myName }) {
  const size = roomSize;
  showLobby(size);
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size, timeLimit, shapes: shapesList, given: givenList, lengths: lengthsList, displayName: myName },
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

async function runMultiplayerCreate({ timeLimit, shapesList, givenList, lengthsList, myName }) {
  const size = roomSize;
  showLobby(size);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'multiplayer', size, timeLimit, shapes: shapesList, given: givenList, lengths: lengthsList, displayName: myName },
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

async function runVersusCreate({ timeLimit, shapesList, givenList, lengthsList, myName }) {
  showLobby(2);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'versus', size: 2, timeLimit, shapes: shapesList, given: givenList, lengths: lengthsList, displayName: myName },
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

async function runGeometry() {
  startBtn.disabled = true;
  await getCurrentUser();

  const shapesList = [...shapes];
  // Given is meaningless for polygons — send it empty rather than shipping a
  // setting the question generator will ignore.
  const givenList = isCurvedBranch() ? [...given] : [];
  const lengthsList = [...lengths];
  const myName = (nameInput.value || '').trim() || auth.currentUser.displayName || 'Player';

  if (mode === 'versus') {
    if (roomAction === 'join') await runVersusJoin({ myName });
    else await runVersusCreate({ timeLimit, shapesList, givenList, lengthsList, myName });
    return;
  }

  if (roomAction === 'join') await runMultiplayerJoin({ myName });
  else if (roomAction === 'create') await runMultiplayerCreate({ timeLimit, shapesList, givenList, lengthsList, myName });
  else await runMultiplayer({ timeLimit, shapesList, givenList, lengthsList, myName });
}

startBtn.addEventListener('click', runGeometry);
lobbyCancel.addEventListener('click', () => {
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
