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
import { createAwaitingProgress } from '/utils/games/leaderboard.js';
import {
  createCarousel, createSectionFlow,
  renderChoiceStep, renderMultiStep, renderCustomStep, renderComingSoon,
} from '/utils/components/setup-carousel.js';
import { avatarUrl, getAvatarSeed, mountAvatarPicker } from '/utils/components/avatar-picker.js';
import { createSetupMemory } from '/utils/games/setup-memory.js';

const REGULAR_SHAPES = ['triangle', 'square', 'rectangle'];

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

// The avatar picker (drawn faces + the player's own photos) lives in
// /utils/components/avatar-picker.js, shared by every game — one player, one
// face, everywhere. Avatar choice is never synced to other players in a room
// (see leaderboard.js: other real players' rows always render a uid-derived
// DiceBear face, not their actual pick).

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

const nameInput = $('geo-name-input');
const avatarGrid = $('geo-avatar-grid');
const avatarUploadInput = $('geo-avatar-upload-input');
const playerMount = $('geo-player-carousel');
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
const lobbyStartNow = $('geo-lobby-start-now');

const awaitingBd = $('geo-awaiting-bd');
const awaitingProgress = createAwaitingProgress(awaitingBd.querySelector('p'));

const resultsBd = $('geo-results-bd');
const leaderboardEl = $('geo-leaderboard');
const againBtn = $('geo-again-btn');

function showAwaiting() {
  awaitingProgress.reset();
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
// Owned in JS rather than read back out of `input:checked` — a carousel only
// renders the step you're on, so a DOM-query getter would throw (or silently
// read a stale value) for any step the player never opened. These carry the
// defaults, and the carousels below just keep them in sync.
// Every field starts from the player's LAST game (setup-memory.js) so
// nothing has to be re-picked visit after visit.
const mem = createSetupMemory('geometry');
let mode = mem.get('mode', 'multiplayer', ['multiplayer', 'versus']);
let roomSize = mem.get('roomSize', 5, [5, 10]);
let timeLimit = mem.get('timeLimit', 60, [30, 60, 90, 120]);
let roomAction = mem.get('roomAction', 'quickfill', ['quickfill', 'create', 'join']); // multiplayer: quickfill|create|join · versus: create|join
if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create'; // Versus has no Quick Fill

// `shapes`/`given`/`lengths` are filled in when the topic tree reaches a real
// leaf — see the topic carousel below, which resets them to that branch's own
// defaults on entry. They start empty so Start stays disabled until a topic is
// actually chosen — unless a saved branch restores them below.
const shapes = new Set();
const given = new Set();
const lengths = new Set();
// Which pool the Lengths step is offering — the two shape families need
// different numbers (see rng.js), so this tracks whichever branch we're in.
let lengthPool = RADIUS_NUMBERS;

// Restore the saved branch, if any — every member is re-checked against its
// current list so a renamed shape or number silently drops out.
const savedBranch = mem.get('branch', '', ['curved', 'polygons']);
if (savedBranch) {
  const shapeList = savedBranch === 'curved' ? CIRCULAR_SHAPES : REGULAR_SHAPES;
  lengthPool = savedBranch === 'curved' ? RADIUS_NUMBERS : SIDE_NUMBERS;
  mem.get('shapes', shapeList, Array.isArray).filter((s) => shapeList.includes(s)).forEach((s) => shapes.add(s));
  if (savedBranch === 'curved') {
    mem.get('given', GIVEN_TYPES, Array.isArray).filter((g) => GIVEN_TYPES.includes(g)).forEach((g) => given.add(g));
    if (!given.size) GIVEN_TYPES.forEach((g) => given.add(g));
  }
  mem.get('lengths', [...lengthPool], Array.isArray).filter((n) => lengthPool.includes(n)).forEach((n) => lengths.add(n));
  if (!shapes.size) shapeList.forEach((s) => shapes.add(s));
  if (!lengths.size) lengthPool.forEach((n) => lengths.add(n));
}

// One save covers this section's whole branch — called wherever it exits.
const saveContent = () => mem.save({
  branch: [...shapes].some((s) => CIRCULAR_SHAPES.includes(s)) ? 'curved' : 'polygons',
  shapes: [...shapes], given: [...given], lengths: [...lengths],
});

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

/* ── SECTION 2 — Topic ─────────────────────────────────────────
   Lines/Angles/Shapes → 2D/3D → Polygons/Curved Shapes → the leaf pickers.
   Only the Shapes → 2D branch has real content today; every other branch is a
   "coming soon" leaf so the tree is honest about what's actually gradeable.

   The two branches genuinely need DIFFERENT settings, so neither one shows a
   step the other's questions would ignore:
     curved   → Given (radius/diameter) → Radius, multiples of 7 (pi = 22/7)
     polygons → no Given at all         → Side lengths, plain 3–20
   Entering a branch resets shapes/given/lengths to that branch's own defaults,
   so a setting picked on one branch can never leak into the other. */
const topic = createCarousel(topicMount);
['topic', 'soon-lines', 'soon-angles', 'shapes-dim', 'soon-3d', 'kind-2d',
 'regularity', 'soon-irregular', 'regular-pick', 'curved-pick', 'given', 'lengths']
  .forEach((id) => topic.addSlide(id, {
    topic: 'Topic', 'soon-lines': 'Lines', 'soon-angles': 'Angles', 'shapes-dim': '2D/3D',
    'soon-3d': '3D Shapes', 'kind-2d': 'Polygons/Curved', regularity: 'Regular/Irregular',
    'soon-irregular': 'Irregular', 'regular-pick': 'Regular Shapes',
    'curved-pick': 'Curved Shapes', given: 'Given', lengths: 'Lengths',
  }[id], () => {}));

function renderLengthsPick() {
  const curved = isCurvedBranch();
  renderMultiStep(topic, 'lengths', {
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
    nextLabel: 'Next',
    onNext: () => { saveContent(); flow.next(); }, // last step of this section
  });
}

// Switch the whole branch's settings over in one place, so nothing stale can
// survive a hop from Curved to Polygons (or back). Re-entering the SAME
// branch keeps the current (possibly remembered) picks.
function enterBranch(kind) {
  const alreadyHere = shapes.size > 0 &&
    (kind === 'curved') === [...shapes].some((s) => CIRCULAR_SHAPES.includes(s));
  if (!alreadyHere) {
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
  }

  if (kind === 'curved') { renderCurvedPick(); renderGivenPick(); }
  else renderRegularPick();
  renderLengthsPick();
  updateStartDisabled();
}

function renderRegularPick() {
  renderMultiStep(topic, 'regular-pick', {
    title: 'Which regular shapes?',
    colorOffset: 0,
    options: REGULAR_SHAPES.map((s) => ({ value: s, label: SHAPE_LABELS[s] })),
    isChecked: (v) => shapes.has(v),
    onToggle: (v, checked) => {
      if (checked) shapes.add(v); else shapes.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => topic.goTo('lengths'),
  });
}

function renderCurvedPick() {
  renderMultiStep(topic, 'curved-pick', {
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
    nextLabel: 'Next',
    onNext: () => topic.goTo('given'),
  });
}

function renderGivenPick() {
  renderMultiStep(topic, 'given', {
    title: 'Given the radius, diameter, or both?',
    colorOffset: 3,
    options: GIVEN_TYPES.map((g) => ({ value: g, label: GIVEN_LABELS[g] })),
    isChecked: (v) => given.has(v),
    onToggle: (v, checked) => {
      if (checked) given.add(v); else given.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => topic.goTo('lengths'),
  });
}

renderChoiceStep(topic, 'topic', {
  title: 'What do you want to practice?',
  name: 'geo-topic',
  options: [
    { value: 'lines', label: 'Lines' },
    { value: 'angles', label: 'Angles' },
    { value: 'shapes', label: 'Shapes', checked: true },
  ],
  onPick: (v) => {
    if (v === 'lines') topic.goTo('soon-lines');
    else if (v === 'angles') topic.goTo('soon-angles');
    else topic.goTo('shapes-dim');
  },
});
renderComingSoon(topic, 'soon-lines', {
  title: 'Lines', message: 'Line practice is coming soon — go back and pick Shapes for now.',
});
renderComingSoon(topic, 'soon-angles', {
  title: 'Angles', message: 'Angle practice is coming soon — go back and pick Shapes for now.',
});
renderChoiceStep(topic, 'shapes-dim', {
  title: '2D or 3D shapes?',
  name: 'geo-dim',
  colorOffset: 2,
  options: [
    { value: '2d', label: '2D Shapes', checked: true },
    { value: '3d', label: '3D Shapes' },
  ],
  onPick: (v) => (v === '3d' ? topic.goTo('soon-3d') : topic.goTo('kind-2d')),
});
renderComingSoon(topic, 'soon-3d', {
  title: '3D Shapes', message: '3D shape practice is coming soon — go back and pick 2D Shapes for now.',
});
renderChoiceStep(topic, 'kind-2d', {
  title: 'Polygons or curved shapes?',
  name: 'geo-kind',
  colorOffset: 4,
  options: [
    { value: 'polygons', label: 'Polygons', checked: true },
    { value: 'curved', label: 'Curved Shapes' },
  ],
  onPick: (v) => {
    if (v === 'polygons') { topic.goTo('regularity'); return; }
    enterBranch('curved');
    topic.goTo('curved-pick');
  },
});
renderChoiceStep(topic, 'regularity', {
  title: 'Regular or irregular polygons?',
  name: 'geo-regularity',
  options: [
    { value: 'regular', label: 'Regular', checked: true },
    { value: 'irregular', label: 'Irregular' },
  ],
  onPick: (v) => {
    if (v === 'irregular') { topic.goTo('soon-irregular'); return; }
    enterBranch('polygons');
    topic.goTo('regular-pick');
  },
});
renderComingSoon(topic, 'soon-irregular', {
  title: 'Irregular Polygons', message: 'Nets of a cube/cuboid are coming soon — go back and pick Regular for now.',
});

topic.start('topic');

/* ── SECTION 3 — Game Options ─────────────────────────────────
   Mode → Room Size → Time Limit. Room Size is skipped entirely for Versus,
   which is always 1v1 — asking "5 or 10 players?" for a 2-player game would be
   a setting the room ignores. */
const options = createCarousel(optionsMount);
options.addSlide('mode', 'Mode', () => {});
options.addSlide('size', 'Room Size', () => {});
options.addSlide('time', 'Time Limit', () => {});

renderChoiceStep(options, 'mode', {
  title: 'How do you want to play?',
  name: 'geo-mode',
  options: [
    { value: 'multiplayer', label: 'Multiplayer', checked: mode === 'multiplayer' },
    { value: 'versus', label: 'Versus (1v1)', checked: mode === 'versus' },
  ],
  onPick: (v) => {
    mode = v;
    // Versus has no Quick Fill — a private 1v1 is always create-or-join.
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
  name: 'geo-size',
  colorOffset: 2,
  options: [
    { value: '5', label: '5 players', checked: roomSize === 5 },
    { value: '10', label: '10 players', checked: roomSize === 10 },
  ],
  onPick: (v) => { roomSize = Number(v); mem.save({ roomSize }); options.goTo('time'); },
});
renderChoiceStep(options, 'time', {
  title: 'How long is the round?',
  name: 'geo-time',
  colorOffset: 4,
  options: [
    { value: '30', label: '30s', checked: timeLimit === 30 },
    { value: '60', label: '60s', checked: timeLimit === 60 },
    { value: '90', label: '90s', checked: timeLimit === 90 },
    { value: '120', label: '120s', checked: timeLimit === 120 },
  ],
  onPick: (v) => { timeLimit = Number(v); mem.save({ timeLimit }); flow.next(); }, // last step of this section
});

options.start('mode');

/* ── SECTION 4 — Room ───────────────────────────────────────
   Which entry options exist depends on Mode, so this is re-rendered whenever
   Mode changes. Picking "Join with Code" steps on to the code entry. */
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
    name: 'geo-room-action',
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

/* ── One selector on screen at a time ─────────────────────────────
   The four sections stay independent carousels; this shows one at a time and
   collapses finished ones to their picks as sticky notes. Start only appears
   on the final section. */
const flow = createSectionFlow([
  {
    el: $('geo-section-player'),
    chips: () => [{ label: myName(), avatar: avatarUrl(getAvatarSeed()) }],
  },
  {
    el: $('geo-section-topic'),
    chips: () => {
      if (!shapes.size) return [{ label: 'No topic' }];
      return [
        ...[...shapes].map((s) => ({ label: SHAPE_LABELS[s] || s })),
        { label: `${lengths.size} ${isCurvedBranch() ? 'radii' : 'sides'}` },
      ];
    },
  },
  {
    el: $('geo-section-options'),
    chips: () =>
      mode === 'versus'
        ? [{ label: 'Versus 1v1' }, { label: `${timeLimit}s` }]
        : [{ label: 'Multiplayer' }, { label: `${roomSize} players` }, { label: `${timeLimit}s` }],
  },
  {
    el: $('geo-section-room'),
    chips: () => [{
      label: roomAction === 'quickfill' ? 'Quick Fill' : roomAction === 'create' ? 'Create Room' : 'Join with Code',
    }],
  },
], {
  // Start belongs at the end of the flow, not floating under every step.
  onChange: (_i, isLast) => { startBtn.hidden = !isLast; },
});

updateStartDisabled();
updateStartLabel();

// ── Avatar picker ────────────────────────────────────────────────────────
// Drawn faces plus the player's own photos, kept as a list they can pick
// between and delete from. Shared with every other game — same module, same
// storage, so one player wears one face everywhere.
mountAvatarPicker({
  grid: avatarGrid,
  uploadInput: avatarUploadInput,
  radioName: 'geo-avatar',
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
  document.body.classList.add('geo-nav-hidden'); // game mode starts at the lobby
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
    else rank.textContent = tiedHere ? '=' : String(rankNum);

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

  if (ranked[0] && ranked[0].isSelf && !topTie) {
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
      onAwaiting: awaitingProgress.onAwaiting,
      myScore,
    });
  } catch (e) {
    ranked = [{ name: myName, score: myScore, isBot: false, isSelf: true, avatarSeed: getAvatarSeed() }];
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
    // Only the host is handed a startNow, and only once a real second player is
    // here — no point offering "start now" for a room that's just you and bots
    // (the wait fills those seats anyway). The empty seats become bots on click.
    startNowFn = state.startNow || null;
    lobbyStartNow.hidden = !(startNowFn && state.playerCount >= 2 && state.playerCount < state.size);
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
  await joinWithCode(codeFromInput(), 2, myName);
}

async function runGeometry() {
  startBtn.disabled = true;
  // The setup is proven good the moment a round starts with it — next visit
  // jumps straight to the last section with these picks as chips.
  saveContent();
  mem.save({ done: true });
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

/* ── Quick join ─────────────────────────────────────────────────
   Somebody arriving with a friend's code has nothing to set up: the room's
   content, size and clock all come from the host, and every answer they'd give
   in the sections below would be thrown away. So the code box sits at the top
   of the page and goes straight to the lobby, wearing the name and avatar from
   the last game they played. */
const quickJoinInput = $('geo-quickjoin-input');
const quickJoinBtn = $('geo-quickjoin-btn');

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
  cancelled = true;
  hideLobby();
  document.body.classList.remove('geo-nav-hidden'); // back out of game mode
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
// Geometry only jumps when a real branch was restored; without one, Start
// would sit disabled with nothing visibly missing.
if (mem.isReturning() && shapes.size && lengths.size) {
  codeInput.hidden = roomAction !== 'join';
  flow.goTo(3);
}
