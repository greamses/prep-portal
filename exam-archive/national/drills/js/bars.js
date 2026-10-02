/* ═══════════════════════════════════════════════════════
   DRILLS — Fraction Bars (bars) activity

   Two sets of unlike fraction bars are laid end to end on the top line —
   3/4 + 1/6 is three quarter-bars and then one sixth-bar. Underneath is an
   empty line and a tray of unit bars. The player drags unit bars off the tray
   (dragging COPIES, so a bar can be taken as often as it is wanted) and lines
   them up under the sum until the two lines are the same length. A
   double-click takes a bar back off. Line it up and a FRESH sum takes its
   place, on and on until the clock runs out; the score is the number of sums
   lined up.

   Subtraction is the same surface with one more line: 3/4 − 1/6 puts the three
   quarter-bars on top and the sixth-bar under their far end, hatched, as the
   part taken away. What the player lines up is what is LEFT — from the start
   of the line to where the hatched bar begins.

   No denominator is prime, anywhere: not in the sums, and so not on the tray
   (the common denominator of two composites is composite, so a prime bar
   could never be the one that fits). The tray is every composite from 1/4 to
   1/50.

   Two levels. Basic: one denominator is a multiple of the other, so the bar
   that fits is already on the top line (1/4 + 1/8 → eighths). Advanced: the
   denominators share a factor but neither divides the other (1/4 + 1/6 →
   twelfths) — the common denominator is neither of them, nor their product,
   and has to be worked out.

   The line has to be built from ONE size of bar. Without that rule the answer
   to 3/4 + 1/6 is to copy the top line, which drills nothing; with it the only
   bars that fit are twelfths — the player has found the common denominator
   with their hands.

   The two lines are drawn to one scale, and that scale is set per sum: a
   fiftieth is a sliver beside a quarter, so each sum is zoomed until its top
   line nearly fills the paper. The tray is therefore NOT to scale — its bars
   are equal chips, and a bar takes its true width as it is lifted off.

   Two halves live here, the same split as grid.js:
     · the SEEDED GENERATOR (barsAt) — pure and deterministic, so every client
       in a room draws the identical stream of sums with zero network.
     · the ROUND RUNNER (startBarsRound) — the play surface, structured like
       game.js's startRound.

   Solvable by construction: every sum's common denominator is 50 or less, so
   the bar that fits is always on the tray.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS } from '/utils/games/rng.js';

const $ = (id) => document.getElementById(id);
const START_BUFFER_MS = 3000; // mirrors seeded-room.js; see game.js's note

const MAX_D = 50; // the smallest bar on the tray is 1/50
const MIN_BARS = 2; // fewest — a one-bar answer is a lucky tap, not a line-up
const MAX_BARS = 15; // most bars one sum can need — past this it is a dragging test
const MAX_SHOWN = 16; // most bars one LINE of the question may be drawn with — more are slivers on a phone
const MAX_SUM = 1.25; // longest top line, in wholes
const ZOOM_ROOM = 1.25; // a line is this many times its sum's top line — room to overshoot

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const isPrime = (n) => { for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return n > 1; };

// Every denominator in play: the composites up to MAX_D. They are the tray,
// and the only denominators a sum is built from.
const DENOMINATORS = [];
for (let d = 4; d <= MAX_D; d++) if (!isPrime(d)) DENOMINATORS.push(d);

// Every length is counted in 1/UNITS of a whole. UNITS is the lowest common
// multiple of those denominators (about 1.1e12 — well inside exact integers),
// so each bar is a whole number of them and "the same length" is an exact
// integer comparison, never a float one.
const UNITS = DENOMINATORS.reduce((l, d) => (l * d) / gcd(l, d), 1);

/* ── GENERATOR ──────────────────────────────────────────────────────────── */

// Every sum one (operation, level) can deal, grouped by common denominator.
// Each is two proper fractions in lowest terms with DIFFERENT, composite
// denominators, and:
//   · their common denominator is on the tray (MAX_D or less);
//   · basic: that common denominator IS one of the two denominators;
//     advanced: it is neither of them, and the two share a factor (4 and 6,
//     not 4 and 9) — so it is not simply their product either;
//   · the answer does not simplify — 1/4 + 1/12 is 2/6, which two sixth-bars
//     would match in length without lining up under either fraction;
//   · the answer is a reasonable number of bars, on a line that fits, and so
//     is the question — 41/48 would be forty-one slivers;
//   · a subtraction leaves at least two bars over — one bar is no line-up.
function buildPool(op, level) {
  const sign = op === 'fracSub' ? -1 : 1;
  const groups = new Map();
  for (const d1 of DENOMINATORS) {
    for (const d2 of DENOMINATORS) {
      if (d1 === d2) continue;
      const hcf = gcd(d1, d2);
      const lcm = (d1 * d2) / hcf;
      if (lcm > MAX_D) continue;
      const isOneOfThem = lcm === d1 || lcm === d2;
      if (level === 'advanced' ? (isOneOfThem || hcf === 1) : !isOneOfThem) continue;
      for (let n1 = 1; n1 < d1; n1++) {
        if (gcd(n1, d1) > 1) continue;
        for (let n2 = 1; n2 < d2; n2++) {
          if (gcd(n2, d2) > 1) continue;
          const count = (n1 * lcm) / d1 + sign * ((n2 * lcm) / d2);
          if ((sign > 0 ? n1 + n2 : Math.max(n1, n2)) > MAX_SHOWN) continue;
          if (count < MIN_BARS || gcd(count, lcm) > 1 || count > MAX_BARS || count / lcm > MAX_SUM) continue;
          if (!groups.has(lcm)) groups.set(lcm, []);
          groups.get(lcm).push({ a: { n: n1, d: d1 }, b: { n: n2, d: d2 } });
        }
      }
    }
  }
  return [...groups.values()];
}

const pools = new Map(); // built on first use, one per (operation, level)
function poolFor(op, level) {
  const key = `${op}_${level}`;
  if (!pools.has(key)) pools.set(key, buildPool(op, level));
  return pools.get(key);
}

const BAR_OPS = ['fracAdd', 'fracSub'];

// The index-th sum of the room's stream — deterministic per (seed, index) and
// the room's own dials, exactly like rng.js's questionAt(seed, i, opts). The
// common denominator is drawn before the sum: drawn flat, the stream would be
// mostly the big denominators, simply because those have the most numerators
// to choose from. A room from before the dials existed has neither
// field and plays what it always played first: basic addition.
export function barsAt(seed, index, { operations, level } = {}) {
  const rng = mulberry32(hashSeed(seed, CONTENT_NS + index));
  const ops = BAR_OPS.filter((op) => (operations || []).includes(op));
  if (!ops.length) ops.push('fracAdd');
  const op = ops[Math.floor(rng() * ops.length)];
  const pool = poolFor(op, level === 'advanced' ? 'advanced' : 'basic');
  const group = pool[Math.floor(rng() * pool.length)];
  const { a, b } = group[Math.floor(rng() * group.length)];
  const sign = op === 'fracSub' ? -1 : 1;
  return { a, b, op, units: (a.n * UNITS) / a.d + sign * ((b.n * UNITS) / b.d) };
}

/* ── ROUND RUNNER ───────────────────────────────────────────────────────── */

const playBd = $('drill-play-bd');
const barsStage = $('drill-bars');
const cardEl = $('drill-card');
const rosterEl = $('drill-roster');
const timeRemainingEl = $('drill-time-remaining');

const NEXT_DELAY_MS = 450; // long enough to SEE the two lines agree
const DOUBLE_TAP_MS = 350;
const DRAG_SLOP_PX = 6; // under this a press is a tap, not a drag
const DROP_REACH_PX = 30; // how far outside the lines a drop still counts
const THIN_PX = 17; // narrower than this, a bar's fraction is written up its side

// A finger double-taps; a mouse double-clicks. The instruction says whichever
// the player is holding.
const TAKE_OFF = window.matchMedia('(pointer: coarse)').matches ? 'Double-tap' : 'Double-click';
const HINT = `Line up one size of bar underneath. ${TAKE_OFF} a bar to take it off.`;
const HINT_SUB = `Line up one size of bar under what is left. ${TAKE_OFF} a bar to take it off.`;
const HINT_MIXED = 'Same length — now do it with one size of bar.';

let active = false;
let locked = false; // true for the beat between a line-up and the next sum
let score = 0;
let endAt = 0;
let rafId = null;
let resolveRound = null;
let curSeed = 0;
let curOpts = {}; // the room's dials: { operations, level }
let sumIndex = 0;
let current = null; // the sum on the top line
let placed = []; // denominators of the bars on the bottom line, left to right
let drag = null; // { d, id, x0, y0, ghost } while a tray bar is held
let suppressClick = false; // a drag ends in a click on the bar it started on
let trackUnits = UNITS; // how long a line is for the CURRENT sum — its zoom

// Mount elements built once and reused across rounds.
let headEl = null;
let scoreNote = null;
let timerNote = null;
let countdownEl = null;
let receiptEl = null;
let sumEl = null;
let boardEl = null;
let targetRow = null;
let takeRow = null; // subtraction only — the bars taken away, under the far end
let answerRow = null;
let markEl = null; // where the top line ends, ruled down through the bottom one
let hintEl = null;
let trayEl = null;

const fracHtml = (n, d) => `<span class="drill-bar-frac"><i>${n}</i><i>${d}</i></span>`;

// One unit bar on a line, 1/d of a whole wide at the current sum's zoom.
function barEl(d, tag = 'span') {
  const el = document.createElement(tag);
  if (tag === 'button') el.type = 'button';
  el.className = 'drill-bar';
  el.dataset.d = String(d);
  el.style.width = `${(UNITS / d / trackUnits) * 100}%`;
  // Golden-angle steps, so neighbouring sizes never share a colour.
  el.style.setProperty('--bar-hue', String(Math.round((d * 137.5) % 360)));
  el.innerHTML = fracHtml(1, d);
  return el;
}

// A bar too narrow for an upright fraction carries it written up its side.
// Which ones are depends on the screen and on the sum's zoom, so it is read
// off the page: called whenever bars are laid, added or the window resizes.
function measure() {
  if (!boardEl) return;
  boardEl.querySelectorAll('.drill-bar').forEach((bar) => {
    bar.classList.toggle('is-thin', bar.getBoundingClientRect().width < THIN_PX);
  });
}

function ensureMount() {
  if (headEl) return;
  headEl = document.createElement('div');
  headEl.className = 'drill-grid-head';
  timerNote = document.createElement('span');
  timerNote.className = 'pp-sticky pp-sticky--tape drill-grid-note';
  scoreNote = document.createElement('span');
  scoreNote.className = 'pp-sticky pp-sticky--tape drill-grid-note';
  headEl.append(timerNote, scoreNote);

  countdownEl = document.createElement('p');
  countdownEl.className = 'pp-countdown';
  countdownEl.hidden = true;

  // Everything is printed on one receipt (the same torn cream stock the card,
  // the grid and the leaderboard use): the sum, the two lines, then the tray.
  receiptEl = document.createElement('div');
  receiptEl.className = 'pp-receipt drill-bars-receipt';
  const paper = document.createElement('div');
  paper.className = 'pp-receipt__paper drill-bars-paper';

  sumEl = document.createElement('p');
  sumEl.className = 'drill-bars-sum';

  boardEl = document.createElement('div');
  boardEl.className = 'drill-bars-board';
  targetRow = document.createElement('div');
  targetRow.className = 'drill-bars-row drill-bars-target';
  takeRow = document.createElement('div');
  takeRow.className = 'drill-bars-row drill-bars-take';
  answerRow = document.createElement('div');
  answerRow.className = 'drill-bars-row drill-bars-answer';
  answerRow.setAttribute('aria-label', 'Your line of bars');
  markEl = document.createElement('span');
  markEl.className = 'drill-bars-mark';
  markEl.setAttribute('aria-hidden', 'true');
  boardEl.append(targetRow, takeRow, answerRow, markEl);

  hintEl = document.createElement('p');
  hintEl.className = 'drill-bars-hint';

  trayEl = document.createElement('div');
  trayEl.className = 'drill-bars-tray';
  trayEl.setAttribute('aria-label', 'Unit fraction bars');
  // Equal chips, not to scale (see the header) — one per composite denominator.
  DENOMINATORS.forEach((d) => {
    const bar = barEl(d, 'button');
    bar.style.width = '';
    bar.setAttribute('aria-label', `Add a 1/${d} bar`);
    trayEl.appendChild(bar);
  });
  trayEl.addEventListener('pointerdown', onTrayDown);
  trayEl.addEventListener('pointermove', onTrayMove);
  trayEl.addEventListener('pointerup', onTrayUp);
  trayEl.addEventListener('pointercancel', dropDrag);
  trayEl.addEventListener('click', onTrayClick);
  answerRow.addEventListener('click', onPlacedClick);
  answerRow.addEventListener('keydown', onPlacedKey);
  window.addEventListener('resize', () => { if (active) measure(); });

  paper.append(sumEl, boardEl, hintEl, trayEl);
  receiptEl.appendChild(paper);
  barsStage.append(headEl, countdownEl, receiptEl);
}

/* ── Dragging a copy off the tray ───────────────────────────────────────── */

function onTrayDown(e) {
  const bar = e.target.closest('.drill-bar');
  if (!bar || !active || locked || e.button > 0) return;
  suppressClick = false;
  dropDrag();
  drag = { d: Number(bar.dataset.d), id: e.pointerId, x0: e.clientX, y0: e.clientY, ghost: null };
  bar.setPointerCapture(e.pointerId);
}

// The bar on the tray never moves — what follows the pointer is a copy, cut
// to the line's scale, so the tray is never short of a size. (A bar longer
// than the whole line is shown at the line's length; it will be refused.)
function makeGhost(d) {
  const ghost = barEl(d);
  ghost.classList.add('drill-bar--ghost');
  const px = boardEl.clientWidth * Math.min(1, UNITS / d / trackUnits);
  ghost.style.width = `${px}px`;
  ghost.classList.toggle('is-thin', px < THIN_PX);
  ghost.style.height = `${targetRow.clientHeight}px`;
  // On the body, not in the overlay: the overlay's backdrop-filter would make
  // itself the containing block and the copy would drift as the overlay scrolls.
  document.body.appendChild(ghost);
  return ghost;
}

function overBoard(e) {
  const r = boardEl.getBoundingClientRect();
  return e.clientX >= r.left - DROP_REACH_PX && e.clientX <= r.right + DROP_REACH_PX
    && e.clientY >= r.top - DROP_REACH_PX && e.clientY <= r.bottom + DROP_REACH_PX;
}

function onTrayMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < DRAG_SLOP_PX) return;
    drag.ghost = makeGhost(drag.d);
  }
  const g = drag.ghost;
  g.style.left = `${e.clientX - g.offsetWidth / 2}px`;
  g.style.top = `${e.clientY - g.offsetHeight / 2}px`;
  answerRow.classList.toggle('is-hot', overBoard(e));
}

function onTrayUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { d, ghost } = drag;
  dropDrag();
  if (!ghost) return; // a tap — the click that follows adds the bar
  suppressClick = true;
  if (overBoard(e)) place(d);
}

function dropDrag() {
  if (drag && drag.ghost) drag.ghost.remove();
  drag = null;
  if (answerRow) answerRow.classList.remove('is-hot');
}

// A plain tap (or Enter on a focused bar) adds one too — thirteen twelfths is
// a lot of dragging on a phone.
function onTrayClick(e) {
  const bar = e.target.closest('.drill-bar');
  if (!bar) return;
  if (suppressClick) { suppressClick = false; return; }
  place(Number(bar.dataset.d));
}

/* ── The bottom line ────────────────────────────────────────────────────── */

const placedUnits = () => placed.reduce((sum, d) => sum + UNITS / d, 0);

function place(d) {
  if (!active || locked) return;
  // The line is full — a bar that would run off the paper is refused.
  if (placedUnits() + UNITS / d > trackUnits) {
    answerRow.classList.remove('is-full');
    void answerRow.offsetWidth; // restart the shake
    answerRow.classList.add('is-full');
    return;
  }
  placed.push(d);
  const bar = barEl(d, 'button');
  bar.classList.add('is-placed');
  bar.setAttribute('aria-label', `1/${d} bar — ${TAKE_OFF.toLowerCase()} to take it off`);
  answerRow.appendChild(bar);
  measure();
  check();
}

function takeOff(bar) {
  if (!active || locked) return;
  const at = [...answerRow.children].indexOf(bar);
  if (at === -1) return;
  placed.splice(at, 1);
  bar.remove();
  check();
}

// One handler covers the mouse's double-click and the finger's double-tap
// (which never raises a dblclick on iOS): two clicks on the same bar, close
// together.
function onPlacedClick(e) {
  const bar = e.target.closest('.drill-bar');
  if (!bar) return;
  const now = Date.now();
  if (now - Number(bar.dataset.tap || 0) < DOUBLE_TAP_MS) takeOff(bar);
  else bar.dataset.tap = String(now);
}

function onPlacedKey(e) {
  const bar = e.target.closest('.drill-bar');
  if (bar && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); takeOff(bar); }
}

function check() {
  const sameLength = placedUnits() === current.units;
  const oneSize = placed.every((d) => d === placed[0]);
  hintEl.textContent = sameLength && !oneSize ? HINT_MIXED : hintFor(current);
  hintEl.classList.toggle('is-nudge', sameLength && !oneSize);
  if (!sameLength || !oneSize) return;

  locked = true;
  score += 1;
  scoreNote.textContent = `${score} correct`;
  answerRow.classList.add('is-correct');
  // Lined up — hold it for a beat, then deal the next sum.
  setTimeout(() => {
    if (!active) return;
    sumIndex += 1;
    renderSum();
    locked = false;
  }, NEXT_DELAY_MS);
}

const hintFor = (sum) => (sum.op === 'fracSub' ? HINT_SUB : HINT);

// Lay out the top line for the current sum and clear the bottom one.
function renderSum() {
  current = barsAt(curSeed, sumIndex, curOpts);
  const { a, b } = current;
  const isSub = current.op === 'fracSub';
  // Zoom: the top line (the whole sum, or the fraction being taken from)
  // fills most of the paper, whatever the size of its bars.
  trackUnits = Math.round((isSub ? (a.n * UNITS) / a.d : current.units) * ZOOM_ROOM);
  placed = [];
  dropDrag();

  sumEl.innerHTML = `${fracHtml(a.n, a.d)}<span class="drill-bars-plus">${isSub ? '−' : '+'}</span>${fracHtml(b.n, b.d)}`;
  sumEl.setAttribute('aria-label', `${a.n}/${a.d} ${isSub ? '−' : '+'} ${b.n}/${b.d}`);

  // Addition lays both sets end to end on the top line. Subtraction keeps the
  // first set there and hangs the second under its far end — pushed along by
  // exactly what is left, which is the gap the player has to fill.
  targetRow.innerHTML = '';
  takeRow.innerHTML = '';
  takeRow.hidden = !isSub;
  if (isSub) {
    const gap = document.createElement('span');
    gap.className = 'drill-bars-gap';
    gap.style.width = `${(current.units / trackUnits) * 100}%`;
    takeRow.appendChild(gap);
  }
  [a, b].forEach((f, set) => {
    for (let i = 0; i < f.n; i++) {
      const bar = barEl(f.d);
      // A heavier rule where the second fraction's bars begin.
      if (set === 1 && i === 0 && !isSub) bar.classList.add('is-set-start');
      (set === 1 && isSub ? takeRow : targetRow).appendChild(bar);
    }
  });
  markEl.style.left = `${(current.units / trackUnits) * 100}%`;

  answerRow.innerHTML = '';
  answerRow.classList.remove('is-correct', 'is-full');
  measure();
  hintEl.textContent = hintFor(current);
  hintEl.classList.remove('is-nudge');
}

function renderRoster(roster) {
  rosterEl.innerHTML = '';
  roster.forEach((p, i) => {
    const pill = document.createElement('span');
    pill.className = `pp-roster-item${p.isSelf ? ' is-self' : ''}`;
    pill.style.setProperty('--delay', `${i * 90}ms`);
    pill.textContent = p.isSelf ? `${p.name} (You)` : p.name;
    rosterEl.appendChild(pill);
  });
  rosterEl.hidden = false;
}

function tick() {
  if (!active) return;
  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) { endRound(); return; }
  timeRemainingEl.textContent = `${Math.ceil(remainingMs / 1000)}s left`;
  rafId = requestAnimationFrame(tick);
}

function endRound() {
  active = false;
  if (rafId) cancelAnimationFrame(rafId);
  dropDrag();
  playBd.classList.remove('open', 'is-bars');
  playBd.setAttribute('aria-hidden', 'true');
  barsStage.hidden = true;
  const finalScore = score;
  if (resolveRound) resolveRound(finalScore);
  resolveRound = null;
}

// Resolves with the number of sums lined up once the local timer hits zero.
// Same shape/contract as game.js's startRound so main.js can dispatch on it.
export function startBarsRound({ seed, timeLimit, startAt, operations, level, roster }) {
  return new Promise((resolve) => {
    ensureMount();
    score = 0;
    sumIndex = 0;
    curSeed = seed;
    curOpts = { operations, level };
    resolveRound = resolve;
    placed = [];
    locked = false;

    // Card is the arithmetic surface; hide it, show the bars.
    cardEl.hidden = true;
    barsStage.hidden = false;
    receiptEl.hidden = true;
    timerNote.textContent = `${timeLimit}s round`;
    scoreNote.textContent = '0 correct';
    countdownEl.hidden = false;
    timeRemainingEl.textContent = '';
    if (roster) renderRoster(roster);

    // The lines need more width than the card's column gives them.
    playBd.classList.add('open', 'is-bars');
    playBd.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drill-nav-hidden');
    active = true;

    // Same clock-skew guard as game.js: trust the shared startAt only when it
    // lands in the plausible window, else anchor to THIS device's clock so a
    // player with a skewed clock still gets a full round.
    const lead = startAt - Date.now();
    const anchorAt = (lead > -2000 && lead <= START_BUFFER_MS + 2000) ? startAt : Date.now() + 800;

    (function tickCountdown() {
      const msLeft = anchorAt - Date.now();
      if (msLeft <= 0) {
        countdownEl.hidden = true;
        rosterEl.hidden = true;
        receiptEl.hidden = false;
        renderSum();
        endAt = anchorAt + timeLimit * 1000;
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
