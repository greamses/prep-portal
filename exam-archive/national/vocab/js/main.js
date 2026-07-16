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
  ELEMENTS, CATEGORY_LABELS, TABLE_COLUMNS, TABLE_ROWS, GROUP_NAMES,
  baseTopic, topicScope, inScope,
} from '/data/vocab/index.js';
import { botName } from './bots.js';
import { matchmake, createCodeRoom, joinRoomByCode } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound } from './leaderboard.js';
import {
  createCarousel, createSectionFlow, renderChoiceStep, renderCustomStep,
} from '/utils/components/setup-carousel.js';
import { avatarUrl, getAvatarSeed, mountAvatarPicker } from '/utils/components/avatar-picker.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

const NAME_KEY = 'drillGameName';

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
// player never opened.
let mode = 'multiplayer';
let roomSize = 5;
let timeLimit = 120;
let roomAction = 'quickfill'; // multiplayer: quickfill|create|join · versus: create|join
let grade = 5;
let subject = 'life-science';
let playMode = 'az';    // az | topic — which words the round deals
let topic = '';         // only meaningful when playMode === 'topic'
let spelling = 'classic'; // classic | spell — how each word is played

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
  onPick: (v) => { spelling = v; flow.next(); }, // last step of this section
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
      // The periodic table can be played whole, or one group / one period —
      // that choice is its own step, and it lands back in `topic` as a scope
      // suffix ('periodic-table:g17') so the room's bucket carries it.
      if (v === 'periodic-table') {
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

/* The periodic table's scope: whole table, or drill one slice of it. A slice
   quizzes EVERY element in that group/period (you chose it; the library shows
   it), while the whole table sticks to the common, examinable elements. */
function renderScopeStep() {
  const kind = topicScope(topic).charAt(0); // '' | 'g' | 'p'
  renderChoiceStep(content, 'scope', {
    title: 'The whole table, or one part?',
    subtitle: 'A group or a period asks every element in it — study it in the library first.',
    name: 'vocab-pt-scope',
    colorOffset: 3,
    options: [
      { value: 'all', label: 'Whole table', checked: kind === '' },
      { value: 'g', label: 'One group', checked: kind === 'g' },
      { value: 'p', label: 'One period', checked: kind === 'p' },
    ],
    onPick: (v) => {
      if (v === 'all') { topic = 'periodic-table'; content.goTo('spelling'); return; }
      renderScopeNStep(v);
      content.goTo('scope-n');
    },
  });
}

function renderScopeNStep(kind) {
  const current = topicScope(topic);
  const picked = current.charAt(0) === kind ? Number(current.slice(1)) : 0;
  const options = kind === 'g'
    ? Array.from({ length: 18 }, (_, i) => {
        const n = i + 1;
        const named = GROUP_NAMES[n];
        return { value: String(n), label: named ? `Group ${n} — ${named}` : `Group ${n}`, checked: n === picked };
      })
    : Array.from({ length: 7 }, (_, i) => {
        const n = i + 1;
        return { value: String(n), label: `Period ${n}`, checked: n === picked };
      });
  renderChoiceStep(content, 'scope-n', {
    title: kind === 'g' ? 'Which group?' : 'Which period?',
    subtitle: kind === 'g'
      ? 'A group is one column of the table — elements that behave alike.'
      : 'A period is one row of the table, left to right.',
    name: 'vocab-pt-scope-n',
    colorOffset: 5,
    options,
    onPick: (v) => { topic = `periodic-table:${kind}${v}`; content.goTo('spelling'); },
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
    else rank.textContent = tiedHere ? '=' : String(rankNum);

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

  if (ranked[0] && ranked[0].isSelf && !topTie) {
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
  // startRound resolves with the score AND how many words the round actually
  // held — the bots have to race the same number, and it's the ROOM's content
  // that decides it, not whatever this client's setup screen happens to show.
  const { score: myScore, wordCount } = await startRound({
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
      botsNeeded: room.botsNeeded,
      wordCount,
      myScore,
    });
  } catch (e) {
    ranked = [{ name, score: myScore, isBot: false, isSelf: true, avatarSeed: getAvatarSeed() }];
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

async function runMultiplayer(name) {
  showLobby(roomSize);
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
    cell.className = 'vocab-el' + (inScope(el, scope) ? '' : ' is-out');
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

async function openDictionary() {
  dictList.innerHTML = '<p class="vocab-dict-loading">Fetching the words…</p>';
  dictBd.classList.add('open');
  dictBd.setAttribute('aria-hidden', 'false');
  document.body.classList.add('vocab-nav-hidden');

  const meta = playMode === 'topic' ? topicMeta(subject, topic) : null;
  dictTitle.textContent = meta ? meta.label : `${SUBJECTS[subject].label}, A to Z`;

  const dictBox = dictBd.querySelector('.vocab-dict');
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
  roomAction = 'create'; // Versus has no Quick Fill
  renderRoomEntry();
  updateStartLabel();
}
