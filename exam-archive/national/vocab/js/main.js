/* ═══════════════════════════════════════════════════════
   VOCAB — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays. Multiplayer uses
   anonymous pool matching; Versus is a private 1v1 via a shared room code.
   Same shape as the Drills page — what changes is the content section
   (Grade -> Subject -> Play mode -> Topic) and that a "point" here is a word
   solved. Grade comes FIRST because the subjects depend on it: a Grade 3 child
   is offered Life/Earth/Physical Science, a Grade 11 student Biology/Chemistry/
   Physics. The two tiers never mix.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import {
  SUBJECTS, GRADES, MODES, SPELL_MODES, subjectsForGrade, topicsFor, topicMeta,
  loadWords, gradePool, topicPool,
  ELEMENTS, CATEGORY_LABELS, TABLE_COLUMNS, TABLE_ROWS, GROUP_NAMES, PERIOD_ROW_LABELS,
  CONTINENTS, CONTINENT_LABELS, ZONES, ZONE_LABELS, SYSTEMS, SYSTEM_LABELS,
  ORGAN_FIGURES, isBundledSubject,
  baseTopic, topicScope, inScope, scopeInfo, regionSet, regionSetLabel, structureSvg,
} from '/data/vocab/index.js';
import { createSetupMemory } from '/utils/games/setup-memory.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound } from './game.js';
import { buildRound } from './rng.js';
import { finishRound, rankVocab } from './leaderboard.js';
import {
  createCarousel, createSectionFlow, renderChoiceStep, renderCustomStep, renderMultiStep,
} from '/utils/components/setup-carousel.js';
import { avatarUrl, getAvatarSeed, mountAvatarPicker } from '/utils/components/avatar-picker.js';
import { imageOverride, attachImageAdmin } from '/utils/components/admin-images.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

const NAME_KEY = 'drillGameName';

// A hangman word is a far slower unit than a times-table sum — and a flat minute
// count is a giveaway on a 6-word group and impossible on a 65-word topic. So the
// clock is DERIVED from how many words the round holds:
//     timeLimit = wordCount × secondsPerWord
// Every topic is then equally tight, and the ace bot (which finishes at 55% of
// the clock — see bots.js) is equally hard to beat everywhere. The player picks
// the PACE, not the minutes.
const PACES = [
  { value: 11, label: 'Relaxed' },
  { value: 8, label: 'Normal', checked: true },
  { value: 6, label: 'Fast' },
];
const MIN_ROUND_SEC = 45;  // even a 3-word slice gets a usable clock
const MAX_ROUND_SEC = 900; // …and a 100-word topic doesn't run all afternoon

const TROPHY_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" fill="var(--ink)"/>
  <path d="M7 5H4a3 3 0 0 0 3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M17 5h3a3 3 0 0 1-3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="10.5" y="12" width="3" height="4" fill="var(--ink)"/>
  <rect x="8" y="16.4" width="8" height="2.4" rx="1" fill="var(--ink)"/>
</svg>`;

const nameInput = $('vocab-name-input');
const avatarGrid = $('vocab-avatar-grid');
const avatarUploadInput = $('vocab-avatar-upload-input');
const playerMount = $('vocab-player-carousel');
const topicMount = $('vocab-topic-carousel');
const optionsMount = $('vocab-options-carousel');
const roomMount = $('vocab-room-carousel');
const codeInput = $('vocab-code-input');
const quickJoinInput = $('vocab-quickjoin-input');
const quickJoinBtn = $('vocab-quickjoin-btn');
const startBtn = $('vocab-start-btn');
const startLabel = $('vocab-start-label');
const studyBtn = $('vocab-study-btn');
const dictBd = $('vocab-dict-bd');
const dictTitle = $('vocab-dict-title');
const dictSub = $('vocab-dict-sub');
const dictList = $('vocab-dict-list');
const dictClose = $('vocab-dict-close');

const lobbyBd = $('vocab-lobby-bd');
const lobbyStatus = $('vocab-lobby-status');
const lobbyCode = $('vocab-lobby-code');
const lobbyCodeText = $('vocab-lobby-code-text');
const lobbyCodeCopy = $('vocab-lobby-code-copy');
const lobbySeats = $('vocab-lobby-seats');
const lobbyCount = $('vocab-lobby-count');
const lobbyCancel = $('vocab-lobby-cancel');
const lobbyStartNow = $('vocab-lobby-start-now');

const awaitingBd = $('vocab-awaiting-bd');
const resultsBd = $('vocab-results-bd');
const leaderboardEl = $('vocab-leaderboard');
const againBtn = $('vocab-again-btn');

let cancelled = false;
// The host's "start now" action for the current lobby snapshot — swapped out on
// every waiting tick so the button always promotes the latest player count.
let startNowFn = null;

// ── Setup state ─────────────────────────────────────────────────────────
// Owned in JS, not read back out of `input:checked` — a carousel only renders
// the step you're on, so a DOM-query getter would throw for any step the
// player never opened. Every field starts from the player's LAST game
// (setup-memory.js) so nothing has to be re-picked visit after visit.
const mem = createSetupMemory('vocab');
let mode = mem.get('mode', 'multiplayer', ['multiplayer', 'versus']);
let roomSize = mem.get('roomSize', 5, [5, 10]);
let pace = mem.get('pace', 8, PACES.map((p) => p.value)); // seconds per word
let roomAction = mem.get('roomAction', 'quickfill', ['quickfill', 'create', 'join']); // multiplayer: quickfill|create|join · versus: create|join
if (mode === 'versus' && roomAction === 'quickfill') roomAction = 'create'; // Versus has no Quick Fill
let grade = mem.get('grade', 5, GRADES);
let subject = mem.get('subject', 'life-science', (s) => subjectsForGrade(grade).includes(s));
let playMode = mem.get('playMode', 'az', ['az', 'topic']);    // az | topic — which words the round deals
// A saved topic is only kept if it's still offered for this subject+grade
// (the scope suffix rides along with its base).
let topic = mem.get('topic', '', (t) => topicsFor(subject, grade).some((x) => x.key === baseTopic(t)));
let spelling = mem.get('spelling', 'classic', SPELL_MODES.map((m) => m.key)); // classic | spell — how each word is played
if (isBundledSubject(subject)) playMode = 'topic'; // all-drawn subjects: no A–Z
if (playMode === 'topic' && !topic) {
  const ts = topicsFor(subject, grade);
  topic = ts[0] ? ts[0].key : '';
  if (!topic) playMode = 'az';
}

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

/* ── SECTION 2 — What to play ──────────────────────────────────
   Grade → Subject → A-Z or Topic → (Topic). Grade leads because the subject
   list depends on it, and the two tiers never mix: pick 3 and you choose
   between Life/Earth/Physical Science and General Maths; pick 11 and you
   choose between Biology/Chemistry/Physics and Algebra/Geometry/Statistics.

   The steps after Grade are re-rendered whenever an earlier choice changes —
   a carousel only builds the slide you're on, so rebuilding is how a dependent
   step stays honest. */
const content = createCarousel(topicMount);
content.addSlide('grade', 'Grade', () => {});
content.addSlide('subject', 'Subject', () => {});
content.addSlide('play', 'Play', () => {});
content.addSlide('topic', 'Topic', () => {});
// Visited only for drawn topics (the periodic table): whole table, or one
// group/period — and if a slice, which one. The carousel's crumb trail is the
// stack of steps actually visited, so these stay invisible everywhere else.
content.addSlide('scope', 'Part', () => {});
content.addSlide('scope-n', 'Which', () => {});
content.addSlide('spelling', 'Spelling', () => {});

function renderGradeStep() {
  renderChoiceStep(content, 'grade', {
    title: 'Which grade?',
    name: 'vocab-grade',
    options: GRADES.map((g) => ({ value: String(g), label: `Grade ${g}`, checked: g === grade })),
    onPick: (v) => {
      grade = Number(v);
      // The old subject may not exist at the new grade (Chemistry at Grade 3),
      // so fall back to the first one that does.
      const available = subjectsForGrade(grade);
      if (!available.includes(subject)) subject = available[0];
      renderSubjectStep();
      content.goTo('subject');
    },
  });
}

function renderSubjectStep() {
  const available = subjectsForGrade(grade);
  renderChoiceStep(content, 'subject', {
    title: `Which subject?`,
    subtitle: grade >= 10 ? 'Senior subjects.' : 'Junior subjects.',
    name: 'vocab-subject',
    colorOffset: 2,
    options: available.map((key) => ({
      value: key, label: SUBJECTS[key].label, checked: key === subject,
    })),
    onPick: (v) => {
      subject = v;
      // Warm the bank now rather than during the 3-2-1 countdown: startAt is
      // fixed for the whole room, so a slow fetch there would eat into this
      // player's clock while everyone else was already guessing.
      loadWords(subject).catch(() => {}); // a failure here just means we fetch again at kick-off
      const topics = topicsFor(subject, grade);
      // Compare on the BASE key — a scoped pick ('periodic-table:g17') is
      // still valid wherever its topic is offered.
      if (!topics.some((t) => t.key === baseTopic(topic))) topic = topics[0] ? topics[0].key : '';
      renderTopicStep();
      // An all-drawn subject (Geography, The Human Body) has no A–Z alphabet to
      // walk, so the A-Z/Topic step is skipped and the round is by topic.
      if (isBundledSubject(subject)) {
        playMode = 'topic';
        content.goTo('topic');
        return;
      }
      content.goTo('play');
    },
  });
}

renderChoiceStep(content, 'play', {
  title: 'How do you want the words?',
  subtitle: 'A to Z walks the alphabet. By Topic plays one topic’s words in any order.',
  name: 'vocab-playmode',
  colorOffset: 4,
  options: MODES.map((m) => ({ value: m.key, label: m.label, checked: m.key === playMode })),
  onPick: (v) => {
    playMode = v;
    if (playMode === 'topic') { renderTopicStep(); content.goTo('topic'); return; }
    content.goTo('spelling'); // A-Z has no topic to pick, but still needs a way to play
  },
});

renderChoiceStep(content, 'spelling', {
  title: 'How do you play each word?',
  subtitle: 'Classic is hangman. A spelling bee makes you write the word out.',
  name: 'vocab-spelling',
  colorOffset: 5,
  options: SPELL_MODES.map((m) => ({ value: m.key, label: m.label, checked: m.key === spelling })),
  onPick: (v) => {
    spelling = v;
    // Every path through this section ends here, so one save covers the lot.
    mem.save({ grade, subject, playMode, topic, spelling });
    flow.next(); // last step of this section
  },
});

function renderTopicStep() {
  const topics = topicsFor(subject, grade);
  renderChoiceStep(content, 'topic', {
    title: 'Which topic?',
    subtitle: `${SUBJECTS[subject].label}, Grade ${grade}.`,
    name: 'vocab-topic',
    colorOffset: 1,
    options: topics.map((t) => ({ value: t.key, label: t.label, checked: t.key === baseTopic(topic) })),
    onPick: (v) => {
      // A drawn topic can be played whole, or one slice — a group/period of
      // the table, a continent of the world, a zone of Nigeria. That choice
      // is its own step, and it lands back in `topic` as a scope suffix
      // ('periodic-table:g17', 'world-map:africa', 'nigeria-map:n-west') so
      // the room's bucket carries it.
      if (v === 'periodic-table' || v === 'world-map' || v === 'nigeria-map' || v === 'body-map') {
        if (baseTopic(topic) !== v) topic = v; // keep an existing scope on re-visit
        renderScopeStep();
        content.goTo('scope');
        return;
      }
      topic = v;
      content.goTo('spelling');
    },
  });
}

/* A drawn topic's scope: play it whole, or tick the slices to drill.
   Periodic table — slices are groups or periods, and they quiz EVERY element
   in them (you chose them; the library shows them), while the whole table
   sticks to the common, examinable elements.
   Maps — slices are continents of the world or geopolitical zones of
   Nigeria; one checkbox step each, since there are only six of either.
   Selections are encoded as a bitmask scope ('cm5', 'gm20001') — compact
   enough for the rules' 40-char topic cap, and canonical, so two players
   ticking the same combination land in the same matchmaking bucket. */
function renderMapScopeStep({ base, regions, maskPrefix, title, subtitle }) {
  const picked = new Set(regionSet(topic) || []);
  renderMultiStep(content, 'scope', {
    title,
    subtitle,
    colorOffset: 3,
    options: regions.map((r) => ({ value: r.key, label: r.label })),
    isChecked: (v) => picked.has(v),
    onToggle: (v, on) => { if (on) picked.add(v); else picked.delete(v); },
    nextLabel: 'Next',
    onNext: () => {
      const mask = regions.reduce((m, r, i) => (picked.has(r.key) ? m | (1 << i) : m), 0);
      // Nothing ticked — or everything — is just the whole map.
      topic = (mask === 0 || picked.size === regions.length)
        ? base
        : `${base}:${maskPrefix}${mask.toString(16)}`;
      content.goTo('spelling');
    },
  });
}

function renderScopeStep() {
  if (baseTopic(topic) === 'world-map') {
    renderMapScopeStep({
      base: 'world-map',
      regions: CONTINENTS,
      maskPrefix: 'cm',
      title: 'Which continents?',
      subtitle: 'Tick the continents to be asked — none (or all) plays the whole world.',
    });
    return;
  }
  if (baseTopic(topic) === 'nigeria-map') {
    renderMapScopeStep({
      base: 'nigeria-map',
      regions: ZONES,
      maskPrefix: 'zm',
      title: 'Which geopolitical zones?',
      subtitle: 'Tick the zones to be asked — none (or all) plays the whole country.',
    });
    return;
  }
  if (baseTopic(topic) === 'body-map') {
    renderMapScopeStep({
      base: 'body-map',
      regions: SYSTEMS,
      maskPrefix: 'sm',
      title: 'Which body systems?',
      subtitle: 'Tick the systems to be asked — none (or all) plays the whole body.',
    });
    return;
  }

  const kind = topicScope(topic).charAt(0); // '' | 'g' | 'p'
  renderChoiceStep(content, 'scope', {
    title: 'The whole table, or parts of it?',
    subtitle: 'Groups and periods ask every element in them — study them in the library first.',
    name: 'vocab-pt-scope',
    colorOffset: 3,
    options: [
      { value: 'all', label: 'Whole table', checked: kind === '' },
      { value: 'f20', label: 'First 20 elements', checked: kind === 'f' },
      { value: 'g', label: 'Pick groups', checked: kind === 'g' },
      { value: 'p', label: 'Pick periods', checked: kind === 'p' },
    ],
    onPick: (v) => {
      if (v === 'all') { topic = 'periodic-table'; content.goTo('spelling'); return; }
      // The first 20 elements are a fixed set — no further sub-pick.
      if (v === 'f20') { topic = 'periodic-table:f20'; content.goTo('spelling'); return; }
      renderScopeNStep(v);
      content.goTo('scope-n');
    },
  });
}

function renderScopeNStep(kind) {
  const info = scopeInfo(topicScope(topic));
  const picked = new Set(info && info.kind === kind ? info.nums : []);
  // Periods offer rows 8/9 too — the lanthanide/actinide strips, which have
  // names instead of period numbers.
  const max = kind === 'g' ? 18 : 9;
  const options = Array.from({ length: max }, (_, i) => {
    const n = i + 1;
    if (kind === 'p') return { value: String(n), label: PERIOD_ROW_LABELS[n] || `Period ${n}` };
    const named = GROUP_NAMES[n];
    return { value: String(n), label: named ? `Group ${n} — ${named}` : `Group ${n}` };
  });
  renderMultiStep(content, 'scope-n', {
    title: kind === 'g' ? 'Which groups?' : 'Which periods?',
    subtitle: kind === 'g'
      ? 'A group is one column of the table — elements that behave alike. Tick as many as you like.'
      : 'A period is one row of the table, left to right — the Lanthanide and Actinide series are the two strip rows beneath it. Tick as many as you like.',
    colorOffset: 5,
    grid: kind === 'g',
    options,
    isChecked: (v) => picked.has(Number(v)),
    onToggle: (v, on) => { if (on) picked.add(Number(v)); else picked.delete(Number(v)); },
    nextLabel: 'Next',
    onNext: () => {
      const mask = [...picked].reduce((m, n) => m | (1 << (n - 1)), 0);
      // Nothing ticked falls back to the whole table.
      topic = mask === 0 ? 'periodic-table' : `periodic-table:${kind}m${mask.toString(16)}`;
      content.goTo('spelling');
    },
  });
}

renderGradeStep();
renderSubjectStep();
renderTopicStep();
content.start('grade');

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
  name: 'vocab-size',
  colorOffset: 2,
  options: [
    { value: '5', label: '5 players', checked: roomSize === 5 },
    { value: '10', label: '10 players', checked: roomSize === 10 },
  ],
  onPick: (v) => { roomSize = Number(v); mem.save({ roomSize }); options.goTo('time'); },
});
renderChoiceStep(options, 'time', {
  title: 'How fast should the round be?',
  subtitle: 'The clock is set from how many words your pick holds, so every topic is equally tight.',
  name: 'vocab-time',
  colorOffset: 4,
  options: PACES.map((p) => ({ value: String(p.value), label: p.label, checked: p.value === pace })),
  onPick: (v) => { pace = Number(v); mem.save({ pace }); flow.next(); }, // last step of this section
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
    el: $('vocab-section-player'),
    chips: () => [{ label: myName(), avatar: avatarUrl(getAvatarSeed()) }],
  },
  {
    el: $('vocab-section-topic'),
    chips: () => {
      const meta = playMode === 'topic' ? topicMeta(subject, topic) : null;
      const spell = SPELL_MODES.find((m) => m.key === spelling);
      return [
        { label: `Grade ${grade}` },
        { label: SUBJECTS[subject].label },
        { label: meta ? meta.label : 'A to Z' },
        { label: spell.label },
      ];
    },
  },
  {
    el: $('vocab-section-options'),
    chips: () => {
      const p = PACES.find((x) => x.value === pace) || PACES[1];
      return mode === 'versus'
        ? [{ label: 'Versus 1v1' }, { label: `${p.label} pace` }]
        : [{ label: 'Multiplayer' }, { label: `${roomSize} players` }, { label: `${p.label} pace` }];
    },
  },
  {
    el: $('vocab-section-room'),
    chips: () => [{
      label: roomAction === 'quickfill' ? 'Quick Fill' : roomAction === 'create' ? 'Create Room' : 'Join with Code',
    }],
  },
], {
  onChange: (_i, isLast) => {
    startBtn.hidden = !isLast;
    studyBtn.hidden = !isLast; // the words are only knowable once the content is chosen
  },
});

updateStartLabel();

// ── Avatar picker ────────────────────────────────────────────────────────
// Drawn faces plus the player's own photos, kept as a list they can pick
// between and delete from. Shared with every other game — same module, same
// storage, so one player wears one face everywhere.
mountAvatarPicker({
  grid: avatarGrid,
  uploadInput: avatarUploadInput,
  radioName: 'vocab-avatar',
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
  document.body.classList.add('vocab-nav-hidden'); // game mode starts at the lobby
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
function fmtTime(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/* `settled` is false while the room is still finishing. The board is painted
   live from the moment YOU submit — finishers ranked, everyone still playing
   shown as pending — so nobody watches a spinner wondering if it broke. Until
   it settles there is no winner, no trophy and no confetti: leading a race
   half the room hasn't finished isn't winning it. */
function renderResults(ranked, wordCount, settled = true) {
  // A repaint of a board that's already up must not replay the deal-in
  // animation, or every straggler's score restarts the whole stack.
  const repaint = resultsBd.classList.contains('open');
  leaderboardEl.innerHTML = '';
  const total = ranked.length;
  // Competition ranking over the FULL order — most correct, then fastest, then
  // fewest wrong (see leaderboard.js's rankVocab). Players level on ALL three
  // share a place (rare, thanks to the ms-level time tiebreak); a true tie for
  // the top has no winner — nobody is crowned and no confetti flies on a draw.
  // Players who haven't submitted are ranked on nothing at all — they're
  // excluded until their score actually exists.
  const ahead = (a, b) => rankVocab(a, b) < 0;
  const level = (a, b) => rankVocab(a, b) === 0;
  const done = ranked.filter((r) => !r.pending);
  const topTie = done.length ? done.filter((r) => level(r, done[0])).length > 1 : false;
  ranked.forEach((row, i) => {
    const rankNum = 1 + done.filter((r) => ahead(r, row)).length;
    const tiedHere = done.filter((r) => level(r, row)).length > 1;
    const isWinner = settled && !row.pending && rankNum === 1 && !topTie;
    // Only someone who cleared every word has a meaningful finish time to show.
    const finished = !row.pending && typeof row.timeMs === 'number' && row.score === wordCount;
    const tilt = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3));
    const li = document.createElement('li');
    li.className = [
      'vocab-lb-row', 'pp-sticky', 'pp-sticky--tape',
      isWinner ? '' : stickyColor(i),
      row.isSelf ? 'is-self' : '',
      isWinner ? 'is-winner' : '',
      row.pending ? 'is-pending' : '',
    ].filter(Boolean).join(' ');
    li.style.setProperty('--delay', repaint ? '0ms' : `${(total - 1 - i) * 130}ms`);
    li.style.setProperty('--pp-note-tilt', `${tilt}deg`);

    const avatar = document.createElement('span');
    avatar.className = 'vocab-lb-avatar';
    avatar.innerHTML = `<img src="${avatarUrl(row.avatarSeed || row.name)}" alt="" loading="lazy" />`;

    const rank = document.createElement('span');
    rank.className = 'vocab-lb-rank';
    if (row.pending) rank.textContent = '·'; // no place until there's a score
    else if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = tiedHere ? '=' : String(rankNum);

    const name = document.createElement('span');
    name.className = 'vocab-lb-name';
    name.textContent = row.name;
    if (finished) {
      const t = document.createElement('small');
      t.className = 'vocab-lb-time';
      t.textContent = fmtTime(row.timeMs);
      name.append(' ', t); // "Name  1:23"
    } else if (row.pending) {
      const t = document.createElement('small');
      t.className = 'vocab-lb-time';
      // On the settled board they are not still playing — they never finished.
      t.textContent = settled ? 'no score' : 'still playing…';
      name.append(' ', t);
    }

    const scoreEl = document.createElement('span');
    scoreEl.className = 'vocab-lb-score';
    scoreEl.textContent = row.pending ? '–' : String(row.score);

    li.append(avatar, rank, name, scoreEl);
    leaderboardEl.appendChild(li);
  });
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('vocab-nav-hidden');

  // Only on the settled board, so a lead held while half the room is still
  // playing never fires it — but it must still fire on a board that was
  // painted live, which is why this can't key off the first paint.
  if (settled && ranked[0] && ranked[0].isSelf && !ranked[0].pending && !topTie) {
    setTimeout(launchConfetti, repaint ? 400 : (total - 1) * 130 + 400);
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
  // startRound resolves with the score AND how many words the round actually
  // held — the bots have to race the same number, and it's the ROOM's content
  // that decides it, not whatever this client's setup screen happens to show.
  const { score: myScore, wordCount, timeMs, wrong } = await startRound({
    seed: room.seed,
    timeLimit: room.timeLimit,
    startAt: room.startAt,
    subject: room.subject,
    grade: room.grade,
    // The ROOM's play-mode, not this client's setup screen — a joiner who came
    // in by code never picked one.
    mode: room.playMode,
    topic: room.topic,
    spelling: room.spelling, // the ROOM's — a joiner never picked one

    roster,
  });

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
        renderResults(rows, wordCount, false);
      },
      wordCount,
      myScore,
      // Ranked on speed then wrong guesses after the score (see leaderboard.js).
      myMetrics: { timeMs, wrong },
    });
  } catch (e) {
    // Silent here meant a broken leaderboard looked like a working one.
    console.error('[vocab] finishRound failed — showing a local-only board:', e);
    ranked = [{ name, score: myScore, timeMs, wrong, isBot: false, isSelf: true, avatarSeed: getAvatarSeed() }];
  }
  const selfRow = ranked.find((r) => r.isSelf);
  if (selfRow) selfRow.avatarSeed = getAvatarSeed();

  hideAwaiting();
  startBtn.disabled = false;
  renderResults(ranked, wordCount);
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

/* The round's clock, derived from how many words the chosen content actually
   holds: wordCount × pace, clamped. buildRound is the very function the round
   uses, so the count is exact (its LENGTH doesn't depend on the seed). Decided
   here, before the room is made, so every player in it shares one clock. */
async function computeTimeLimit() {
  try {
    const words = await loadWords(subject);
    const n = buildRound({ seed: 1, words, subject, grade, mode: playMode, topic }).length;
    return Math.max(MIN_ROUND_SEC, Math.min(MAX_ROUND_SEC, Math.round(n * pace)));
  } catch {
    return Math.round(26 * pace); // an A–Z-sized fallback
  }
}

async function runMultiplayer(name) {
  showLobby(roomSize);
  const timeLimit = await computeTimeLimit();
  let room;
  try {
    room = await matchmake(
      { mode: 'multiplayer', size: roomSize, timeLimit, subject, grade, playMode, topic, spelling, displayName: name },
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
      { mode: roomMode, size, timeLimit, subject, grade, playMode, topic, spelling, displayName: name },
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
  // The setup is proven good the moment a round starts with it — next visit
  // jumps straight to the last section with these picks as chips.
  mem.save({ grade, subject, playMode, topic, spelling, done: true });
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

/* ── The dictionary ─────────────────────────────────────────────
   Hangman on a word you have never met is a guessing game; hangman on a word
   you read five minutes ago is vocabulary practice. So a child can read the
   whole list first — and it is read from the SAME bank the round is dealt from,
   never a second copy, so what you revise is exactly what you can be asked. */
function dictEntry(word, clue) {
  const row = document.createElement('div');
  row.className = 'vocab-dict-row';
  const w = document.createElement('span');
  w.className = 'vocab-dict-word';
  w.textContent = word;
  const d = document.createElement('span');
  d.className = 'vocab-dict-clue';
  d.textContent = clue;
  row.append(w, d);
  return row;
}

/* ── Law cards ───────────────────────────────────────────────────────────
   The Laws study page was retired — the dictionary IS the library now. For the
   two law topics ('laws' / 'law-scientists') the entries carry a statement,
   optional formula and the scientist, so each becomes a card: name, statement,
   formula (MathJax), and a scientist byline with a monogram avatar. */
const LAW_TOPICS = new Set(['laws', 'law-scientists']);

// A monogram avatar: the scientist's initials on a colour picked deterministically
// from the name, so the same person always looks the same. Stands in for a
// portrait — a real photo set can be dropped in later.
const AVATAR_BG = ['#ffd7a3', '#e8c8ff', '#c8f0c0', '#bfe3ff', '#f7d2e6', '#b8ece2', '#ffe9a8'];
function scientistInitials(name) {
  const parts = name.replace(/[.'']/g, '').split(/[\s-]+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
// Real portraits, resolved by name through Wikipedia's REST summary endpoint
// (CORS-open, returns the current Wikimedia-hosted lead image — public domain
// for the historical majority). Cached in localStorage so it resolves once, and
// the monogram stands in until/unless a portrait actually loads. A few names
// whose article title differs get an override.
const WIKI_TITLE_FIX = {
  'Émile Clapeyron': 'Benoît Paul Émile Clapeyron',
  "Jacobus van 't Hoff": "Jacobus Henricus van 't Hoff",
  'Johannes van der Waals': 'Johannes Diderik van der Waals',
  'Cato Guldberg': 'Cato Maximilian Guldberg',
};
const portraitCache = new Map(); // name -> Promise<url|null>
function resolvePortrait(name) {
  if (portraitCache.has(name)) return portraitCache.get(name);
  const p = (async () => {
    // An admin-set override wins over Wikimedia and the localStorage cache.
    const override = await imageOverride('scientists', name);
    if (override) return override;
    const key = 'sciPortrait:' + name;
    try {
      const cached = localStorage.getItem(key);
      if (cached !== null) return cached || null; // '' = looked, none found
    } catch { /* private mode */ }
    const title = WIKI_TITLE_FIX[name] || name;
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { headers: { accept: 'application/json' } },
      );
      if (!res.ok) return null; // leave uncached so a title fix can help later
      const j = await res.json();
      const url = j.thumbnail?.source || j.originalimage?.source || '';
      try { localStorage.setItem(key, url); } catch { /* ignore */ }
      return url || null;
    } catch { return null; }
  })();
  portraitCache.set(name, p);
  return p;
}

// Paint an avatar as either its monogram or a portrait (kept until the photo
// loads, and restored on a broken image). Never touches the admin pencil.
function paintAvatar(av, name, url) {
  av.querySelectorAll('.vocab-sci-mono, .vocab-sci-photo').forEach((n) => n.remove());
  av.classList.remove('has-photo');
  const mono = document.createElement('span');
  mono.className = 'vocab-sci-mono';
  mono.textContent = scientistInitials(name);
  av.appendChild(mono);
  if (!url) return;
  const img = new Image();
  img.alt = name;
  img.className = 'vocab-sci-photo';
  img.loading = 'lazy';
  img.referrerPolicy = 'no-referrer';
  // Append only once it loads, so the monogram shows until then and a broken
  // image just leaves the monogram in place.
  img.onload = () => { mono.remove(); av.appendChild(img); av.classList.add('has-photo'); };
  img.src = url; // valid servable URL (don't rewrite Wikimedia widths)
}

function scientistAvatar(name) {
  const av = document.createElement('span');
  av.className = 'vocab-sci-avatar';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  av.style.setProperty('--sci-bg', AVATAR_BG[h % AVATAR_BG.length]);
  av.setAttribute('aria-hidden', 'true');
  paintAvatar(av, name, null); // monogram first
  resolvePortrait(name).then((url) => { if (url) paintAvatar(av, name, url); });
  // Admin-only: point this scientist at a URL or an uploaded image.
  attachImageAdmin(av, {
    ns: 'scientists',
    key: name,
    apply: (url) => { portraitCache.delete(name); paintAvatar(av, name, url); },
  });
  return av;
}

function lawDictCard(entry, i = 0) {
  const card = document.createElement('article');
  card.className = `vocab-law-card pp-sticky pp-sticky--tape ${stickyColor(i)}`;
  const paper = document.createElement('div');
  paper.className = 'vocab-law-paper';

  const name = document.createElement('h3');
  name.className = 'vocab-law-name';
  name.textContent = entry.law || entry.w; // law name (both topics carry it)
  paper.appendChild(name);

  const st = document.createElement('p');
  st.className = 'vocab-law-statement';
  st.textContent = entry.d;
  paper.appendChild(st);

  if (entry.formula) {
    const f = document.createElement('div');
    f.className = 'vocab-law-formula';
    f.textContent = `\\[ ${entry.formula} \\]`;
    paper.appendChild(f);
  }

  if (entry.scientist) {
    const by = document.createElement('div');
    by.className = 'vocab-law-by';
    by.appendChild(scientistAvatar(entry.scientist));
    const nm = document.createElement('span');
    nm.className = 'vocab-law-by-name';
    nm.textContent = entry.scientist;
    by.appendChild(nm);
    paper.appendChild(by);
  }

  card.appendChild(paper);
  return card;
}

/* ── IUPAC compound cards ─────────────────────────────────────────────────
   The two Chemistry "IUPAC Names" topics. A card leads with the formula (digit
   runs dropped to <sub>, no MathJax), then the IUPAC name and an everyday hint.
   Read the formula → name it the IUPAC way. */
const IUPAC_TOPICS = new Set(['iupac-inorganic', 'iupac-organic']);

function formulaToNode(f) {
  // The formula rides on a little torn-paper receipt (on the sticky-note card).
  const wrap = document.createElement('span');
  wrap.className = 'vocab-cpd-formula pp-receipt';
  const paper = document.createElement('span');
  paper.className = 'vocab-cpd-headline pp-receipt__paper';
  for (const part of String(f).match(/\d+|\D+/g) || []) {
    if (/^\d+$/.test(part)) {
      const sub = document.createElement('sub');
      sub.textContent = part;
      paper.appendChild(sub);
    } else {
      paper.appendChild(document.createTextNode(part));
    }
  }
  wrap.appendChild(paper);
  return wrap;
}

function compoundDictCard(entry, i = 0) {
  const card = document.createElement('article');
  card.className = `vocab-law-card vocab-cpd-card pp-sticky pp-sticky--tape ${stickyColor(i)}`;
  const paper = document.createElement('div');
  paper.className = 'vocab-law-paper';

  // The headline flips between the formula (equation) and a 2-D structure.
  const head = document.createElement('div');
  head.className = 'vocab-cpd-head';
  head.appendChild(formulaToNode(entry.formula));
  const struct = document.createElement('div');
  struct.className = 'vocab-cpd-structure';
  struct.dataset.smiles = entry.smiles || ''; // key into the pre-rendered SVGs
  head.appendChild(struct);
  paper.appendChild(head);

  const name = document.createElement('h3');
  name.className = 'vocab-law-name vocab-cpd-name';
  name.textContent = entry.w; // the IUPAC name
  paper.appendChild(name);
  if (entry.common) {
    const c = document.createElement('p');
    c.className = 'vocab-law-statement';
    c.textContent = entry.common;
    paper.appendChild(c);
  }
  card.appendChild(paper);
  return card;
}

// Structures are pre-rendered SVGs (data/chem/structures.js), lazy-loaded the
// first time "Structure" is chosen. A miss falls back to the formula for that
// card. Hovering a structure shows a larger view (the SVG scales crisply).
async function loadStructures(grid) {
  const boxes = [...grid.querySelectorAll('.vocab-cpd-structure:not([data-loaded])')];
  for (const box of boxes) {
    box.dataset.loaded = '1';
    const svg = await structureSvg(box.dataset.smiles); // first call loads the bank
    if (svg) {
      box.innerHTML = svg;
      box.addEventListener('mouseenter', () => showCpdZoom(box));
      box.addEventListener('mouseleave', hideCpdZoom);
    } else {
      box.closest('.vocab-cpd-card')?.classList.add('no-structure');
    }
  }
}

// A big floating preview of a structure while the pointer is over it — the card
// thumbnails are small, so hover to read the bonds. The SVG just scales up.
let cpdZoom = null;
function hideCpdZoom() { if (cpdZoom) { cpdZoom.remove(); cpdZoom = null; } }
function showCpdZoom(box) {
  hideCpdZoom();
  const svg = box.querySelector('svg');
  if (!svg) return;
  cpdZoom = document.createElement('div');
  cpdZoom.className = 'vocab-cpd-zoom';
  cpdZoom.innerHTML = box.innerHTML; // a bigger copy of the same crisp SVG
  document.body.appendChild(cpdZoom);
  const r = box.getBoundingClientRect();
  const zw = 260, zh = 260;
  let left = r.right + 12;
  if (left + zw > window.innerWidth - 8) left = r.left - zw - 12;
  if (left < 8) left = Math.max(8, (window.innerWidth - zw) / 2);
  let top = r.top + r.height / 2 - zh / 2;
  top = Math.max(8, Math.min(top, window.innerHeight - zh - 8));
  cpdZoom.style.left = `${left}px`;
  cpdZoom.style.top = `${top}px`;
}

// MathJax loads async from the CDN; gate typesetting on it, but cap the wait so
// a slow/blocked CDN just leaves raw TeX in the cards rather than hanging.
let mjReady = null;
function whenMathJax() {
  if (mjReady) return mjReady;
  mjReady = new Promise((resolve, reject) => {
    let tries = 0;
    (function check() {
      if (window.MathJax?.startup?.promise) window.MathJax.startup.promise.then(resolve);
      else if (tries++ > 250) reject(new Error('MathJax unavailable')); // ~10s
      else setTimeout(check, 40);
    })();
  });
  return mjReady;
}
async function typesetDict() {
  try {
    await whenMathJax();
    await window.MathJax.typesetPromise([dictList]);
    // Readiness race: the first pass can resolve before the TeX input jax is
    // live and convert nothing — if so, try once more.
    if (!dictList.querySelector('mjx-container')) {
      await new Promise((r) => setTimeout(r, 200));
      await window.MathJax.typesetPromise([dictList]);
    }
  } catch { /* cards still show; formulas stay as readable TeX */ }
}

// The periodic table is drawn, not listed: a real 18-column grid of sticky-note
// cells, each hoverable for its details. This is the library view of the same
// data the game deals one cell at a time.
function renderPeriodicTable(scope) {
  dictList.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'vocab-ptable';
  grid.style.setProperty('--cols', TABLE_COLUMNS);
  grid.style.setProperty('--rows', TABLE_ROWS);
  for (const el of ELEMENTS) {
    const cell = document.createElement('span');
    // In a scoped round the slice being drilled stays bright and the rest of
    // the table fades — study exactly what you are about to be asked.
    // Edge cells re-anchor their hover tip so it never clips the dialog:
    // left/right columns pin it to their edge, the top rows open it below.
    cell.className = 'vocab-el' + (inScope(el, scope) ? '' : ' is-out')
      + (el.x <= 3 ? ' vocab-tip-l' : '')
      + (el.x >= 16 ? ' vocab-tip-r' : '')
      + (el.y <= 2 ? ' vocab-tip-b' : '');
    cell.dataset.cat = el.cat;
    cell.style.gridColumn = el.x;
    cell.style.gridRow = el.y;
    cell.tabIndex = 0;
    const cat = CATEGORY_LABELS[el.cat] || '';
    const place = el.group ? `Group ${el.group} · Period ${el.period}` : `Period ${el.period}`;
    const tip = [`${el.name} (${el.sym})`, `Atomic number ${el.z} · Mass ${el.mass}`, cat, place, el.use]
      .filter(Boolean).join('\n');
    cell.setAttribute('aria-label', tip.replace(/\n/g, ', '));
    cell.innerHTML = `
      <span class="vocab-el-z">${el.z}</span>
      <span class="vocab-el-sym">${el.sym}</span>
      <span class="vocab-el-name">${el.name}</span>
      <span class="vocab-el-tip">${tip.replace(/\n/g, '<br>')}</span>`;
    grid.appendChild(cell);
  }
  dictList.appendChild(grid);
}

// A map, drawn for study: every place in position, the quizzed ones hoverable
// for their name, region and capital hint. One floating tip follows the
// pointer — an SVG path can't host the sticky-note tips the table's cells
// use. Serves both maps: the world's countries and Nigeria's states.
async function renderMapLibrary({ mod, rows, set, regionOf, regionLabels, ariaLabel, mapClass = 'vocab-worldmap', credit }) {
  dictList.innerHTML = '';

  const colored = rows.some((c) => c.fill);
  const wrap = document.createElement('div');
  wrap.className = mapClass + (colored ? ' vocab-map--colored' : '');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${mod.MAP_W} ${mod.MAP_H}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', ariaLabel);
  for (const c of rows) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', c.d);
    const out = set && !set.has(regionOf(c));
    p.setAttribute('class', 'vocab-map-c' + (out ? ' is-out' : ''));
    if (c.fill) p.style.fill = c.fill;
    if (c.hint) {
      p.dataset.name = c.name;
      p.dataset.tip = [c.name, regionLabels[regionOf(c)] || '', c.hint].filter(Boolean).join(' — ');
    }
    svg.appendChild(p);
  }
  // The brain's sulci/outline: drawn over the lobes, not hoverable.
  if (mod.DECOR) {
    const dec = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dec.setAttribute('class', 'vocab-map-decor');
    dec.setAttribute('d', mod.DECOR);
    svg.appendChild(dec);
  }
  const tip = document.createElement('span');
  tip.className = 'vocab-map-tip';
  tip.hidden = true;
  wrap.append(svg, tip);

  svg.addEventListener('pointermove', (e) => {
    const path = e.target.closest('path[data-tip]');
    if (!path) { tip.hidden = true; return; }
    tip.textContent = path.dataset.tip;
    tip.hidden = false; // must be visible BEFORE measuring, or offsetWidth is 0
    // Clamp inside the map box so edge places (Alaska, New Zealand, Sokoto…)
    // never have their tip cut off: x pins to the sides, and a pointer too
    // near the top flips the tip below the cursor instead of above it.
    const box = wrap.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const x = Math.min(Math.max(e.clientX - box.left, half + 4), box.width - half - 4);
    const above = e.clientY - box.top - 14 - tip.offsetHeight >= 0;
    tip.style.left = `${x}px`;
    tip.style.top = `${e.clientY - box.top + (above ? -14 : 20)}px`;
    tip.style.transform = above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
  });
  svg.addEventListener('pointerleave', () => { tip.hidden = true; });

  dictList.appendChild(wrap);
  // CC-BY artwork (the body map) owes a visible credit; the public-domain
  // geographic maps pass none and this is skipped.
  if (credit) {
    const cr = document.createElement('p');
    cr.className = 'vocab-map-credit';
    cr.innerHTML = credit;
    dictList.appendChild(cr);
  }
}

async function openDictionary() {
  dictList.innerHTML = '<p class="vocab-dict-loading">Fetching the words…</p>';
  dictBd.classList.add('open');
  dictBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('vocab-nav-hidden');

  const meta = playMode === 'topic' ? topicMeta(subject, topic) : null;
  dictTitle.textContent = meta ? meta.label : `${SUBJECTS[subject].label}, A to Z`;

  const dictBox = dictBd.querySelector('.vocab-dict');
  if (playMode === 'topic' && baseTopic(topic) === 'world-map') {
    dictBox.classList.add('vocab-dict--wide'); // the map wants the room too
    const set = regionSet(topic);
    dictSub.textContent = set
      ? `${regionSetLabel(topic)} stays bright — those are the countries the round will ask. Hover any country for its name and capital.`
      : 'Hover any country for its name and capital. The game lights one up — you name it.';
    dictList.innerHTML = '<p class="vocab-dict-loading">Drawing the map…</p>';
    const wm = await import('/data/vocab/world-map.js');
    await renderMapLibrary({
      mod: wm, rows: wm.COUNTRIES, set,
      regionOf: (c) => c.cont, regionLabels: CONTINENT_LABELS,
      ariaLabel: 'Map of the world — hover a country for its details',
    });
    return;
  }
  if (playMode === 'topic' && baseTopic(topic) === 'nigeria-map') {
    dictBox.classList.add('vocab-dict--wide');
    const set = regionSet(topic);
    dictSub.textContent = set
      ? `${regionSetLabel(topic)} stays bright — those are the states the round will ask. Hover any state for its name and capital.`
      : 'Hover any state for its name and capital. The game lights one up — you name it.';
    dictList.innerHTML = '<p class="vocab-dict-loading">Drawing the map…</p>';
    const nm = await import('/data/vocab/nigeria-map.js');
    await renderMapLibrary({
      mod: nm, rows: nm.STATES, set,
      regionOf: (c) => c.zone, regionLabels: ZONE_LABELS,
      ariaLabel: 'Map of Nigeria — hover a state for its details',
    });
    return;
  }
  if (playMode === 'topic' && baseTopic(topic) === 'body-map') {
    dictBox.classList.add('vocab-dict--wide');
    const set = regionSet(topic);
    dictSub.textContent = set
      ? `${regionSetLabel(topic)} stays bright — those are the organs the round will ask. Hover any organ for its name and system.`
      : 'Hover any organ for its name and body system. The game lights one up — you name it.';
    dictList.innerHTML = '<p class="vocab-dict-loading">Drawing the body…</p>';
    const bm = await import('/data/vocab/body-map.js');
    // Study only what this grade will be asked — the organs are tiered by
    // difficulty, so a Grade 3 body shows the ten everyday organs, not all 37.
    const organs = bm.ORGANS.filter((o) => o.grade == null || o.grade <= grade);
    await renderMapLibrary({
      mod: bm, rows: organs, set,
      regionOf: (c) => c.system, regionLabels: SYSTEM_LABELS,
      ariaLabel: 'Map of the body — hover an organ for its details',
      mapClass: 'vocab-bodymap',
      credit: 'Anatomy © EMBL-EBI · <a href="https://github.com/ebi-gene-expression-group/anatomogram" target="_blank" rel="noopener">CC-BY-4.0</a>',
    });
    return;
  }
  const fig = ORGAN_FIGURES[baseTopic(topic)];
  if (playMode === 'topic' && fig) {
    dictBox.classList.add('vocab-dict--wide');
    dictSub.textContent = `Hover any part of ${fig.label.toLowerCase()} for its name. `
      + 'The game lights one up — you name it.';
    dictList.innerHTML = '<p class="vocab-dict-loading">Drawing the diagram…</p>';
    const fm = await import(fig.module);
    // A sourced organ (the heart) tiers its parts by grade — study only what
    // this grade is asked. Hand-authored organs have no grades, so all show.
    const parts = fm.PARTS.filter((p) => p.grade == null || p.grade <= grade);
    await renderMapLibrary({
      mod: fm, rows: parts, set: null,
      regionOf: () => '', regionLabels: {},
      ariaLabel: `${fig.label} — hover a part for its name`,
      // A portrait figure (the heart) is sized by height, like the body map.
      mapClass: fm.MAP_H > fm.MAP_W * 1.2 ? 'vocab-bodymap' : 'vocab-worldmap',
      credit: fm.CREDIT,
    });
    return;
  }
  if (playMode === 'topic' && baseTopic(topic) === 'periodic-table') {
    dictBox.classList.add('vocab-dict--wide'); // the table wants the room
    const scope = topicScope(topic);
    dictSub.textContent = scope
      ? 'Your slice stays bright — those are the elements the round will ask. Hover any element for its details.'
      : 'Hover any element for its details. The game gives you the number and the mass — you name it.';
    renderPeriodicTable(scope);
    return;
  }
  dictBox.classList.remove('vocab-dict--wide');

  let words;
  try {
    words = await loadWords(subject);
  } catch {
    dictList.innerHTML = '<p class="vocab-dict-loading">Could not fetch the words — try again.</p>';
    return;
  }

  // The two law topics show rich cards (name, statement, formula, scientist),
  // sorted by the LAW name so the same law sits in the same place in both.
  if (playMode === 'topic' && LAW_TOPICS.has(baseTopic(topic))) {
    dictBox.classList.add('vocab-dict--wide');
    const cards = [...topicPool(words, topic)]
      .sort((a, b) => (a.law || a.w).localeCompare(b.law || b.w));
    dictSub.textContent = baseTopic(topic) === 'law-scientists'
      ? `${cards.length} laws · read the statement, then name who it's after`
      : `${cards.length} laws · read each one, and its formula where there is one`;
    dictList.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'vocab-law-grid';
    cards.forEach((entry, i) => grid.appendChild(lawDictCard(entry, i)));
    dictList.appendChild(grid);
    typesetDict();
    return;
  }

  // IUPAC naming topics — compound cards (formula → name), with a Formula ⇄
  // Structure toggle whose structures are pre-rendered SVGs. No MathJax needed.
  if (playMode === 'topic' && IUPAC_TOPICS.has(baseTopic(topic))) {
    dictBox.classList.add('vocab-dict--wide');
    const cards = [...topicPool(words, topic)].sort((a, b) => a.w.localeCompare(b.w));
    dictSub.textContent = `${cards.length} compounds · read the formula, then name it the IUPAC way`;
    dictList.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'vocab-law-grid';
    cards.forEach((entry, i) => grid.appendChild(compoundDictCard(entry, i)));

    const bar = document.createElement('div');
    bar.className = 'vocab-cpd-toggle';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Show formula or structure');
    const bF = document.createElement('button');
    bF.type = 'button';
    bF.className = 'vocab-cpd-tog-btn pp-sticky pp-sticky--tape pp-sticky--c0 is-active';
    bF.textContent = 'Formula';
    const bS = document.createElement('button');
    bS.type = 'button';
    bS.className = 'vocab-cpd-tog-btn pp-sticky pp-sticky--tape pp-sticky--c3';
    bS.textContent = 'Structure';
    const setView = (structures) => {
      grid.classList.toggle('show-structures', structures);
      bF.classList.toggle('is-active', !structures);
      bS.classList.toggle('is-active', structures);
      if (structures) loadStructures(grid); // load the SVG bank on first ask
    };
    bF.addEventListener('click', () => setView(false));
    bS.addEventListener('click', () => setView(true));
    bar.append(bF, bS);

    dictList.append(bar, grid);
    return;
  }
  dictBox.classList.remove('vocab-dict--wide');

  // Exactly the pool the round will draw from: one topic, or every topic this
  // grade is offered.
  const pool = playMode === 'topic'
    ? topicPool(words, topic)
    : gradePool(words, subject, grade);
  const sorted = [...pool].sort((a, b) => a.w.localeCompare(b.w));

  dictSub.textContent = playMode === 'topic'
    ? `${sorted.length} words · Grade ${grade}`
    : `${sorted.length} words across every Grade ${grade} topic — the round asks one per letter.`;

  dictList.innerHTML = '';
  let letter = '';
  for (const entry of sorted) {
    const first = entry.w[0].toUpperCase();
    if (first !== letter) {
      letter = first;
      const head = document.createElement('p');
      head.className = 'vocab-dict-letter';
      head.textContent = letter;
      dictList.appendChild(head);
    }
    dictList.appendChild(dictEntry(entry.w.toUpperCase(), entry.d));
  }
}

function closeDictionary() {
  hideCpdZoom();
  dictBd.classList.remove('open');
  dictBd.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('vocab-nav-hidden');
}

studyBtn.addEventListener('click', openDictionary);
dictClose.addEventListener('click', closeDictionary);
dictBd.addEventListener('click', (e) => { if (e.target === dictBd) closeDictionary(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dictBd.classList.contains('open')) closeDictionary();
});

startBtn.addEventListener('click', runVocab);

/* ── Quick join ─────────────────────────────────────────────────
   Somebody arriving with a friend's code has nothing to set up: the room's
   grade, subject, topic, size and clock all come from the host. Walking them through
   four setup sections only to discard every answer is a waste of their time,
   so the code box sits at the top of the page and skips straight to the lobby.
   Name and avatar come from the last game they played. */
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
  await runJoin(myName(), 2, code); // 2 is only the lobby's guess; the room's real size arrives with it
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
  // abandon-fallback timers on other clients (or a solo bot-fill) resolve an
  // orphaned room naturally, and unread docs aren't billed.
  cancelled = true;
  hideLobby();
  document.body.classList.remove('vocab-nav-hidden'); // back out of game mode
  startBtn.disabled = false;
});
againBtn.addEventListener('click', hideResults);

// Preselect mode from nav links like ?mode=versus
if (new URLSearchParams(location.search).get('mode') === 'versus') {
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
