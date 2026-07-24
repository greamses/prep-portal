/* ═══════════════════════════════════════════════════════
   DRILLS — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays. Multiplayer uses
   anonymous pool matching; Versus is always a private 1v1 via a shared
   room code (create-and-share, or join-with-code).
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { UNIT_NUMBERS } from './rng.js';
import { COMPOUND_SETS, ALL_COMPOUND_SETS } from '/data/chem/rmm.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound } from './leaderboard.js';
import {
  createCarousel, createSectionFlow,
  renderChoiceStep, renderMultiStep, renderCustomStep, renderComingSoon,
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

const NAME_KEY = 'drillGameName';

const OPERATION_LABELS = {
  add: '+ Addition', multiply: '× Multiply', divide: '÷ Divide',
  square: 'x² Square', sqrt: '√x Root',
  cube: 'x³ Cube', cuberoot: '∛x Cube Root',
  power4: 'x⁴ Power 4', fourthroot: '⁴√x Fourth Root',
  fracAdd: '+ Addition', fracSub: '− Subtraction', fracMul: '× Multiplication', fracDiv: '÷ Division',
  rmm: 'Σ Molecular Mass',
};

// Category filters which operations are on offer. Basic keeps the default
// (multiply + divide ticked, addition opt-in — mirrors the old flat list's
// defaults); Exponent and Fractions start fully opt-in, same as square/sqrt
// used to be. Chemistry has exactly one thing to do — find the relative
// molecular mass — so it is ticked for the player and its step is skipped.
const CATEGORY_OPERATIONS = {
  basic: ['add', 'multiply', 'divide'],
  exponent: ['square', 'cube', 'power4', 'sqrt', 'cuberoot', 'fourthroot'],
  fractions: ['fracAdd', 'fracSub', 'fracMul', 'fracDiv'],
  chemistry: ['rmm'],
};
const CATEGORY_DEFAULT_OPS = {
  basic: ['multiply', 'divide'],
  exponent: [],
  fractions: [],
  chemistry: ['rmm'],
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

// Chemistry has no number pool at all — a question is a compound drawn from
// the shared bank (/data/chem/rmm.js, the same compounds Vocab names), so the
// only thing to pick is which sets of it are in play.
const COMPOUND_SET_LABELS = Object.fromEntries(COMPOUND_SETS.map((s) => [s.key, s.label]));

// Dark ink fill (not accent-primary) — the winner's note is already gold,
// so a same-hue trophy would nearly vanish against it.
const TROPHY_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" fill="var(--ink)"/>
  <path d="M7 5H4a3 3 0 0 0 3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M17 5h3a3 3 0 0 1-3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="10.5" y="12" width="3" height="4" fill="var(--ink)"/>
  <rect x="8" y="16.4" width="8" height="2.4" rx="1" fill="var(--ink)"/>
</svg>`;

const nameInput = $('drill-name-input');
const avatarGrid = $('drill-avatar-grid');
const avatarUploadInput = $('drill-avatar-upload-input');
const playerMount = $('drill-player-carousel');
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
const lobbyStartNow = $('drill-lobby-start-now');

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
// The host's "start now" action for the current lobby snapshot — swapped out on
// every waiting tick so the button always promotes the latest player count.
let startNowFn = null;

// ── Setup state ─────────────────────────────────────────────────────────
// Owned in JS, not read back out of `input:checked` — a carousel only renders
// the step you're on, so a DOM-query getter would throw for any step the
// player never opened.
// Every field starts from the player's LAST game (setup-memory.js) so
// nothing has to be re-picked visit after visit.
const mem = createSetupMemory('drills');
let mode = mem.get('mode', 'multiplayer', ['multiplayer', 'versus']);
let roomSize = mem.get('roomSize', 5, [5, 10]);
let timeLimit = mem.get('timeLimit', 60, [30, 60, 90, 120]);
let roomAction = mem.get('roomAction', 'quickfill', ['quickfill', 'create', 'join']); // multiplayer: quickfill|create|join · versus: create|join
if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create'; // Versus has no Quick Fill

let categoryValue = mem.get('category', 'basic', ['basic', 'exponent', 'fractions', 'chemistry']);
let range = mem.get('range', 'all', RANGES.map((r) => r.key));
// The multi-pick sets restore from saved arrays, dropping anything that's no
// longer a valid member of its list.
const tables = new Set(mem.get('tables', [], Array.isArray).filter((n) => UNIT_NUMBERS.includes(n))); // Basic + 1-9 only — the cherry-picked number set
const operations = new Set(
  mem.get('operations', CATEGORY_DEFAULT_OPS[categoryValue], Array.isArray)
    .filter((op) => CATEGORY_OPERATIONS[categoryValue].includes(op)),
);
const fractionTypes = new Set(mem.get('fractionTypes', [], Array.isArray).filter((t) => FRACTION_TYPES.includes(t))); // Fractions only — opt-in
const savedDenoms = mem.get('denominators', DENOMINATORS, Array.isArray).filter((n) => DENOMINATORS.includes(n));
const denominators = new Set(savedDenoms.length ? savedDenoms : DENOMINATORS); // Fractions only — tick-all default
const savedSets = mem.get('compounds', ALL_COMPOUND_SETS, Array.isArray).filter((k) => ALL_COMPOUND_SETS.includes(k));
const compounds = new Set(savedSets.length ? savedSets : ALL_COMPOUND_SETS); // Chemistry only — tick-all default
// Chemistry's single operation is never offered as a step, so a remembered
// setup that somehow lost it would leave the player unable to start.
if (categoryValue === 'chemistry') operations.add('rmm');

// One save covers this section's whole branch — called wherever it exits.
const saveContent = () => mem.save({
  category: categoryValue, range,
  tables: [...tables], operations: [...operations],
  fractionTypes: [...fractionTypes], denominators: [...denominators],
  compounds: [...compounds],
});

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
// that pool IS the denominator set — there is no range to expand. Chemistry
// draws from the compound bank instead and never touches this pool, but the
// room doc's `tables` still has to be a non-empty list of numbers.
function getTablesPool() {
  if (categoryValue === 'chemistry') return [1];
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
  const needsCompounds = categoryValue === 'chemistry' && compounds.size === 0;
  startBtn.disabled = operations.size === 0
    || needsNumbers || needsFractionType || needsDenominators || needsCompounds;
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

/* ── SECTION 2 — What to drill ─────────────────────────────────
   Category → the settings that category actually uses. The three categories
   need different things, so none shows a step whose value the generator would
   ignore:

     Basic     → Operations → Number Range (1–100) → [1–9 only: pick numbers]
     Exponent  → Operations → Number Range (1–100)
     Fractions → Fraction Type → Operations → Denominators (2–12)
     Chemistry → Compounds (inorganic / organic)

   Fractions has NO number range on purpose: in rng.js that same pool supplies
   the denominators, so "90–100" would mean fractions over ninety-somethings.
   Chemistry has neither range nor operations step: there is one thing to work
   out (the relative molecular mass) and the numbers are the compound's own.
   Switching category resets the whole branch, so nothing stale carries over. */
const topic = createCarousel(topicMount);
topic.addSlide('category', 'Category', () => {});
topic.addSlide('fraction-type', 'Fraction Type', () => {});
topic.addSlide('operations', 'Operations', () => {});
topic.addSlide('range', 'Number Range', () => {});
topic.addSlide('numbers', 'Numbers', () => {});
topic.addSlide('denominators', 'Denominators', () => {});
topic.addSlide('compounds', 'Compounds', () => {});

function renderOperationsPick() {
  const isFractions = categoryValue === 'fractions';
  renderMultiStep(topic, 'operations', {
    title: `Which ${categoryValue} operations?`,
    colorOffset: 3,
    options: CATEGORY_OPERATIONS[categoryValue].map((op) => ({ value: op, label: OPERATION_LABELS[op] })),
    isChecked: (v) => operations.has(v),
    onToggle: (v, checked) => {
      if (checked) operations.add(v); else operations.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => {
      if (isFractions) { renderDenominatorsPick(); topic.goTo('denominators'); return; }
      renderRangePick();
      topic.goTo('range');
    },
  });
}


function renderFractionTypePick() {
  renderMultiStep(topic, 'fraction-type', {
    title: 'Which fraction type?',
    colorOffset: 9,
    options: FRACTION_TYPES.map((t) => ({ value: t, label: FRACTION_TYPE_LABELS[t] })),
    isChecked: (v) => fractionTypes.has(v),
    onToggle: (v, checked) => {
      if (checked) fractionTypes.add(v); else fractionTypes.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => { renderOperationsPick(); topic.goTo('operations'); },
  });
}

function renderDenominatorsPick() {
  renderMultiStep(topic, 'denominators', {
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
    nextLabel: 'Next',
    onNext: () => { saveContent(); flow.next(); }, // last step of this section
  });
}

function renderCompoundsPick() {
  renderMultiStep(topic, 'compounds', {
    title: 'Which compounds?',
    subtitle: 'You are given the atomic masses under each formula — the drill is adding them up.',
    colorOffset: 9,
    options: COMPOUND_SETS.map((s) => ({
      value: s.key,
      label: `${s.label} · ${s.compounds.length}`,
    })),
    isChecked: (v) => compounds.has(v),
    onToggle: (v, checked) => {
      if (checked) compounds.add(v); else compounds.delete(v);
      updateStartDisabled();
    },
    nextLabel: 'Next',
    onNext: () => { saveContent(); flow.next(); }, // last step of this section
  });
}

function renderRangePick() {
  renderChoiceStep(topic, 'range', {
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
      else { saveContent(); flow.next(); }
    },
  });
}

function renderNumbersPick() {
  renderMultiStep(topic, 'numbers', {
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
    nextLabel: 'Next',
    onNext: () => { saveContent(); flow.next(); }, // last step of this section
  });
}

renderChoiceStep(topic, 'category', {
  title: 'What category?',
  name: 'drill-category',
  options: [
    { value: 'basic', label: 'Basic', checked: categoryValue === 'basic' },
    { value: 'exponent', label: 'Exponent', checked: categoryValue === 'exponent' },
    { value: 'fractions', label: 'Fractions', checked: categoryValue === 'fractions' },
    { value: 'chemistry', label: 'Chemistry', checked: categoryValue === 'chemistry' },
  ],
  onPick: (v) => {
    if (v !== categoryValue) {
      // Reset the whole branch — a range picked under Basic must not survive
      // into Fractions (which has no range at all). Re-picking the SAME
      // category keeps the remembered picks.
      categoryValue = v;
      operations.clear();
      CATEGORY_DEFAULT_OPS[v].forEach((op) => operations.add(op));
      fractionTypes.clear();
      tables.clear();
      range = 'all';
      denominators.clear();
      DENOMINATORS.forEach((n) => denominators.add(n));
      compounds.clear();
      ALL_COMPOUND_SETS.forEach((k) => compounds.add(k));
      updateStartDisabled();
    }

    if (v === 'chemistry') { renderCompoundsPick(); topic.goTo('compounds'); }
    else if (v === 'fractions') { renderFractionTypePick(); topic.goTo('fraction-type'); }
    else { renderOperationsPick(); topic.goTo('operations'); }
  },
});

topic.start('category');

/* ── SECTION 3 — Game Options ─────────────────────────────────
   Mode → Room Size → Time Limit. Versus skips Room Size — it's always 1v1. */
const options = createCarousel(optionsMount);
options.addSlide('mode', 'Mode', () => {});
options.addSlide('size', 'Room Size', () => {});
options.addSlide('time', 'Time Limit', () => {});

renderChoiceStep(options, 'mode', {
  title: 'How do you want to play?',
  name: 'drill-mode',
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
  name: 'drill-size',
  colorOffset: 2,
  options: [
    { value: '5', label: '5 players', checked: roomSize === 5 },
    { value: '10', label: '10 players', checked: roomSize === 10 },
  ],
  onPick: (v) => { roomSize = Number(v); mem.save({ roomSize }); options.goTo('time'); },
});
renderChoiceStep(options, 'time', {
  title: 'How long is the round?',
  name: 'drill-time',
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
    name: 'drill-room-action',
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
const opName = (o) => (OPERATION_LABELS[o] || o).split(' ').slice(1).join(' ') || o;
const flow = createSectionFlow([
  {
    el: $('drill-section-player'),
    chips: () => [{ label: myName(), avatar: avatarUrl(getAvatarSeed()) }],
  },
  {
    el: $('drill-section-topic'),
    chips: () => {
      const cat = categoryValue[0].toUpperCase() + categoryValue.slice(1);
      // Chemistry's one operation IS the category — "Chemistry · Molecular
      // Mass · Inorganic" says it without repeating itself.
      if (categoryValue === 'chemistry') {
        return [
          { label: cat }, { label: opName('rmm') },
          ...[...compounds].map((k) => ({ label: COMPOUND_SET_LABELS[k] })),
        ];
      }
      const out = [{ label: cat }, ...[...operations].map((o) => ({ label: opName(o) }))];
      if (categoryValue === 'fractions') out.push({ label: `${denominators.size} denominators` });
      else if (isNumbersMode()) out.push({ label: `${tables.size} numbers` });
      else {
        const r = RANGES.find((x) => x.key === range);
        out.push({ label: r ? r.label : range });
      }
      return out;
    },
  },
  {
    el: $('drill-section-options'),
    chips: () =>
      mode === 'versus'
        ? [{ label: 'Versus 1v1' }, { label: `${timeLimit}s` }]
        : [{ label: 'Multiplayer' }, { label: `${roomSize} players` }, { label: `${timeLimit}s` }],
  },
  {
    el: $('drill-section-room'),
    chips: () => [{
      label: roomAction === 'quickfill' ? 'Quick Fill' : roomAction === 'create' ? 'Create Room' : 'Join with Code',
    }],
  },
], {
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
  radioName: 'drill-avatar',
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
  document.body.classList.add('drill-nav-hidden'); // game mode starts at the lobby
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
/* `settled` is false while the room is still finishing. The board is painted
   live from the moment YOU submit — finishers ranked, everyone still playing
   shown as pending — so nobody watches a spinner wondering if it broke. Until
   it settles there is no winner, no trophy and no confetti: leading a race
   half the room hasn't finished isn't winning it. */
function renderResults(ranked, settled = true) {
  // A repaint of a board that's already up must not replay the deal-in
  // animation, or every straggler's score restarts the whole stack.
  const repaint = resultsBd.classList.contains('open');
  leaderboardEl.innerHTML = '';
  const total = ranked.length;
  // Competition ranking with ties: everyone ahead of you on score ranks above
  // you, and players on the SAME score share a place. A score shared with anyone
  // shows a tie marker instead of a number, and a tie for the top has NO winner
  // — nobody is crowned, and no confetti flies, on a draw. Players who haven't
  // submitted are ranked on nothing at all — they're excluded until their
  // score actually exists.
  const done = ranked.filter((r) => !r.pending);
  const topScore = done.length ? done[0].score : 0;
  const topTie = done.filter((r) => r.score === topScore).length > 1;
  ranked.forEach((row, i) => {
    const rankNum = 1 + done.filter((r) => r.score > row.score).length;
    const tiedHere = done.filter((r) => r.score === row.score).length > 1;
    const isWinner = settled && !row.pending && rankNum === 1 && !topTie;
    const tilt = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3));
    const li = document.createElement('li');
    li.className = [
      'drill-lb-row', 'pp-sticky', 'pp-sticky--tape',
      isWinner ? '' : stickyColor(i),
      row.isSelf ? 'is-self' : '',
      isWinner ? 'is-winner' : '',
      row.pending ? 'is-pending' : '',
    ].filter(Boolean).join(' ');
    li.style.setProperty('--delay', repaint ? '0ms' : `${(total - 1 - i) * 130}ms`);
    li.style.setProperty('--pp-note-tilt', `${tilt}deg`);

    const avatar = document.createElement('span');
    avatar.className = 'drill-lb-avatar';
    avatar.innerHTML = `<img src="${avatarUrl(row.avatarSeed || row.name)}" alt="" loading="lazy" />`;

    const rank = document.createElement('span');
    rank.className = 'drill-lb-rank';
    if (row.pending) rank.textContent = '·'; // no place until there's a score
    else if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = tiedHere ? '=' : String(rankNum);

    const name = document.createElement('span');
    name.className = 'drill-lb-name';
    name.textContent = row.name;
    if (row.pending) {
      const t = document.createElement('small');
      t.className = 'drill-lb-pending';
      // On the settled board they are not still playing — they never finished.
      t.textContent = settled ? 'no score' : 'still playing…';
      name.append(' ', t);
    }

    const scoreEl = document.createElement('span');
    scoreEl.className = 'drill-lb-score';
    scoreEl.textContent = row.pending ? '–' : String(row.score);

    li.append(avatar, rank, name, scoreEl);
    leaderboardEl.appendChild(li);
  });
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drill-nav-hidden');

  // The winner's note is revealed last (delay = (total-1)*130ms) — fire the
  // confetti right as it lands, only when the signed-in player won.
  // Only on the settled board, so a lead held while half the room is still
  // playing never fires it — but it must still fire on a board that was
  // painted live, which is why this can't key off the first paint.
  if (settled && ranked[0] && ranked[0].isSelf && !ranked[0].pending && !topTie) {
    const winnerRevealMs = repaint ? 400 : (total - 1) * 130 + 400;
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
    compounds: room.compounds,
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
      // Ranking waits for the ROUND's clock, not for our own submit — see
      // deadlineFor() in /utils/games/leaderboard.js.
      startAt: room.startAt,
      botsNeeded: room.botsNeeded,
      // A bot's pace depends on what the room is drilling — see js/bots.js.
      // Read off the ROOM, so a joiner scores the host's bots the same way.
      operations: room.operations,
      // The board goes up straight away and fills in as the room finishes,
      // instead of holding everyone behind the awaiting overlay.
      onUpdate: (rows) => {
        hideAwaiting();
        // Same avatar override the settled board applies, or your own face
        // would swap out from under you when the last player lands.
        const me = rows.find((r) => r.isSelf);
        if (me) me.avatarSeed = getAvatarSeed();
        renderResults(rows, false);
      },
      myScore,
    });
  } catch (e) {
    // Silent here meant a broken leaderboard looked like a working one.
    console.error('[drills] finishRound failed — showing a local-only board:', e);
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

async function runMultiplayer({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName }) {
  const size = roomSize;
  showLobby(size);
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, compounds: compoundsList, displayName: myName },
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

async function runMultiplayerCreate({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName }) {
  const size = roomSize;
  showLobby(size);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'multiplayer', size, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, compounds: compoundsList, displayName: myName },
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

async function runVersusCreate({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName }) {
  showLobby(2);
  lobbyStatus.textContent = 'Creating your room…';
  let created;
  try {
    created = await createCodeRoom(
      { mode: 'versus', size: 2, timeLimit, operations: operationsList, tables: tablesList, fractionTypes: fractionTypesList, compounds: compoundsList, displayName: myName },
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

async function runDrill() {
  startBtn.disabled = true;
  // The setup is proven good the moment a round starts with it — next visit
  // jumps straight to the last section with these picks as chips.
  saveContent();
  mem.save({ done: true });
  await getCurrentUser();

  const operationsList = [...operations];
  const tablesList = getTablesPool(); // for Fractions this IS the denominator set
  const fractionTypesList = categoryValue === 'fractions' ? [...fractionTypes] : [];
  const compoundsList = categoryValue === 'chemistry' ? [...compounds] : [];
  const myName = (nameInput.value || '').trim() || auth.currentUser.displayName || 'Player';

  if (mode === 'versus') {
    if (roomAction === 'join') await runVersusJoin({ timeLimit, myName });
    else await runVersusCreate({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName });
    return;
  }

  if (roomAction === 'join') await runMultiplayerJoin({ timeLimit, myName });
  else if (roomAction === 'create') await runMultiplayerCreate({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName });
  else await runMultiplayer({ timeLimit, operationsList, tablesList, fractionTypesList, compoundsList, myName });
}

startBtn.addEventListener('click', runDrill);

/* ── Quick join ─────────────────────────────────────────────────
   Somebody arriving with a friend's code has nothing to set up: the room's
   content, size and clock all come from the host, and every answer they'd give
   in the sections below would be thrown away. So the code box sits at the top
   of the page and goes straight to the lobby, wearing the name and avatar from
   the last game they played. */
const quickJoinInput = $('drill-quickjoin-input');
const quickJoinBtn = $('drill-quickjoin-btn');

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
  document.body.classList.remove('drill-nav-hidden'); // back out of game mode
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
