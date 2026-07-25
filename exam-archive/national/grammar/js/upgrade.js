/* ═══════════════════════════════════════════════════════
   GRAMMAR — Word Upgrade round (the substitution activity)

   The second activity. A 3-2-1 beat off the shared startAt, then a worksheet
   of sentences — each carrying a tired word ("said", "walked", "big") in a
   slot — and a palette of twenty vivid words to swap in. One Submit at the end.

   It shares the play overlay's shell with the proof-reading round (js/game.js):
   the same backdrop, roster, countdown, timer/mode sticky notes and the same
   30-second red clock. What is its own is the BOARD — a list of sentence slots
   instead of one editable passage — and the SIDE, a word bank instead of the
   CUPS tag bar. Both rounds resolve with the identical metric shape
   { score, caught, tagged, falseEdits, timeMs, errorTotal, result, pages }, so
   the bots, the leaderboard and the results board never learn which activity
   was played (see js/leaderboard.js).

   THE SCORE maps onto proof-reading's: an acceptable vivid word is a "caught",
   the single BEST word is the bonus "tagged", a wrong guess is a "falseEdit",
   the tired word left alone is a miss (see data/grammar/substitution.js).
═══════════════════════════════════════════════════════ */
import { BOT_NS } from './rng.js';
import { SETS, setMeta, parsePassage, slotsOf, scoreUpgrade, normWord } from '/data/grammar/substitution.js';

export { BOT_NS };

const $ = (id) => document.getElementById(id);
const START_BUFFER_MS = 3000;

// Shared shell (also referenced by game.js — only one round runs at a time).
const playBd = $('grammar-play-bd');
const cardEl = $('grammar-card');
const countdownEl = $('grammar-countdown');
const rosterEl = $('grammar-roster');
const timeRemainingEl = $('grammar-time-remaining');
const timerNote = $('grammar-timer-note');
const errorNote = $('grammar-error-note');
const modeNote = $('grammar-mode-note');
// Proof-reading's own board + side — hidden while an upgrade round is on.
const pfBoard = $('grammar-board');
const pfSide = $('grammar-play-side');
// This activity's own surface.
const upBoard = $('grammar-up-board');
const sheetEl = $('grammar-up-sheet');
const upSide = $('grammar-up-side');
const paletteEl = $('grammar-up-palette');
const bankToggle = $('grammar-up-bank-toggle');
const hintEl = $('grammar-up-hint');
const filledNote = $('grammar-up-filled-note');
const submitBtn = $('grammar-up-submit-btn');

let active = false;
let editing = false;
let parsed = null;       // the parsed passage { title, parts, count }
let slots = [];          // the scorable appearances, in order (index === slot.idx)
let answers = [];        // answers[slotIdx] → the word the player has typed
let picked = null;       // the palette word currently "in hand", or null
let set = null;
let playStartMs = 0;
let submitMs = null;
let timeLimitMs = 0;
let endAt = 0;
let rafId = null;
let resolveRound = null;

// The set's passage, parsed. There is one passage per set, so the seed is not
// used to pick between them — every client works the identical passage anyway.
export function buildUpgradePassage(setKey) {
  const s = setMeta(setKey) || SETS[0];
  return { set: s, parsed: parsePassage(s) };
}

function renderRoster(roster) {
  rosterEl.innerHTML = '';
  roster.forEach((p, i) => {
    const pill = document.createElement('span');
    pill.className = `grammar-roster-item${p.isSelf ? ' is-self' : ''}`;
    pill.style.setProperty('--delay', `${i * 90}ms`);
    pill.textContent = p.isSelf ? `${p.name} (You)` : p.name;
    rosterEl.appendChild(pill);
  });
  rosterEl.hidden = false;
}

// ── The word bank ──────────────────────────────────────────────────────────
// Twenty vivid words, each with its use-case to READ. Tapping a word puts it
// "in hand" (picked); the next slot tapped takes it. Tapping it again drops it.
function renderPalette() {
  paletteEl.innerHTML = '';
  set.words.forEach((word) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'grammar-up-word';
    chip.dataset.word = word.w;
    chip.innerHTML = `<span class="grammar-up-word-w">${word.w}</span><span class="grammar-up-word-use">${escapeHtml(word.use)}</span>`;
    chip.addEventListener('mousedown', (e) => e.preventDefault());
    chip.addEventListener('click', () => pickWord(word.w));
    paletteEl.appendChild(chip);
  });
}

function pickWord(w) {
  if (!editing) return;
  picked = picked === w ? null : w;
  paletteEl.querySelectorAll('.grammar-up-word').forEach((el) => {
    el.classList.toggle('is-picked', el.dataset.word === picked);
  });
  // With a word in hand the sheet invites a slot; without one, the slots are
  // just type-in boxes.
  sheetEl.classList.toggle('is-armed', !!picked);
}

// ── The passage ─────────────────────────────────────────────────────────────
// The whole passage as flowing prose, with an inline input at each appearance
// of the tired word. `white-space: pre-wrap` on the container keeps the
// authored paragraph breaks (see the CSS). The plain prose is NOT editable —
// only the slots are — so the passage reads as writing being improved in place.
function renderPassage() {
  sheetEl.innerHTML = '';
  const title = document.createElement('p');
  title.className = 'grammar-up-title';
  title.textContent = parsed.title;
  sheetEl.appendChild(title);

  const body = document.createElement('div');
  body.className = 'grammar-up-passage';
  parsed.parts.forEach((part) => {
    if (part.type === 'text') {
      body.appendChild(document.createTextNode(part.s));
      return;
    }
    const slot = document.createElement('input');
    slot.type = 'text';
    slot.className = 'grammar-up-slot';
    slot.dataset.i = String(part.idx);
    slot.value = answers[part.idx] || '';
    slot.placeholder = part.dull;   // the tired word, shown as the prompt
    slot.spellcheck = false;
    slot.autocapitalize = 'off';
    slot.setAttribute('autocomplete', 'off');
    slot.style.width = `${Math.max(6, part.dull.length + 2)}ch`;
    body.appendChild(slot);
    paintSlot(part.idx, slot);
  });
  sheetEl.appendChild(body);
}

const slotEl = (i) => sheetEl.querySelector(`.grammar-up-slot[data-i="${i}"]`);
const slotDull = (i) => normWord(String(slots.find((s) => s.idx === i).dull).split(' ')[0]);

// A slot's only tell is whether it has been filled with something other than
// the tired word — never whether the choice was RIGHT (that is the game).
function paintSlot(i, el = slotEl(i)) {
  if (!el) return;
  const a = normWord(el.value);
  el.classList.toggle('is-filled', a !== '' && a !== slotDull(i));
  el.style.width = `${Math.max(6, (el.value || el.placeholder).length + 2)}ch`;
}

function onSheetClick(e) {
  const el = e.target.closest('.grammar-up-slot');
  if (!el || !editing) return;
  // A word in hand drops into the clicked slot; otherwise the click just puts
  // the caret in the box to type.
  if (picked) {
    const i = Number(el.dataset.i);
    el.value = picked;
    answers[i] = picked;
    paintSlot(i, el);
    updateNotes();
    pickWord(picked); // clears the hand
    focusNextEmpty(i);
  }
}

function onSheetInput(e) {
  const el = e.target.closest('.grammar-up-slot');
  if (!el) return;
  const i = Number(el.dataset.i);
  answers[i] = el.value;
  paintSlot(i, el);
  updateNotes();
}

function onSheetKey(e) {
  const el = e.target.closest('.grammar-up-slot');
  if (!el) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    focusNextEmpty(Number(el.dataset.i));
  }
}

function focusNextEmpty(from) {
  const order = slots.map((s) => s.idx);
  const pos = order.indexOf(from);
  for (let k = 1; k <= order.length; k++) {
    const i = order[(pos + k) % order.length];
    const a = normWord(answers[i]);
    if (a === '' || a === slotDull(i)) { const el = slotEl(i); if (el) { el.focus(); el.select(); } return; }
  }
}

function filledCount() {
  let n = 0;
  slots.forEach((s) => {
    const a = normWord(answers[s.idx]);
    if (a !== '' && a !== normWord(String(s.dull).split(' ')[0])) n += 1;
  });
  return n;
}

function updateNotes() {
  filledNote.textContent = `${filledCount()} of ${slots.length} upgraded`;
}

function escapeHtml(s) {
  const d = document.createElement('span');
  d.textContent = s == null ? '' : s;
  return d.innerHTML;
}

// ── Clock ──────────────────────────────────────────────────────────────────
function tick() {
  if (!active) return;
  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) { endRound(); return; }
  const secs = Math.ceil(remainingMs / 1000);
  timeRemainingEl.textContent = `${secs}s left`;
  timeRemainingEl.classList.toggle('is-urgent', secs <= 30);
  rafId = requestAnimationFrame(tick);
}

function endRound() {
  if (!active) return;
  active = false;
  editing = false;
  if (rafId) cancelAnimationFrame(rafId);
  document.removeEventListener('keydown', onGlobalKey);

  const result = scoreUpgrade(slots, slots.map((s) => answers[s.idx] || ''));

  playBd.classList.remove('open');
  playBd.setAttribute('aria-hidden', 'true');
  upBoard.hidden = true;
  upSide.hidden = true;

  if (resolveRound) {
    resolveRound({
      score: result.score,
      errorTotal: result.errorTotal,
      timeMs: submitMs != null ? submitMs : timeLimitMs,
      falseEdits: result.falseEdits,
      caught: result.caught,
      tagged: result.tagged,
      // The review overlay reads these — the whole passage, marked.
      activity: 'upgrade',
      result,
      pages: [{ set, parsed, result }],
    });
  }
  resolveRound = null;
}

function onGlobalKey(e) {
  if (!active) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doSubmit(); }
}

function doSubmit() {
  if (!active || !editing) return;
  const filled = filledCount();
  if (filled === 0 && !window.confirm('You have not upgraded any word yet. Submit anyway?')) return;
  if (filled < slots.length && !window.confirm(`You have left ${slots.length - filled} of ${slots.length} unchanged. Submit anyway?`)) return;
  submitMs = Date.now() - playStartMs;
  endRound();
}

sheetEl && sheetEl.addEventListener('click', onSheetClick);
sheetEl && sheetEl.addEventListener('input', onSheetInput);
sheetEl && sheetEl.addEventListener('keydown', onSheetKey);
submitBtn && submitBtn.addEventListener('click', doSubmit);
bankToggle && bankToggle.addEventListener('click', () => {
  const open = upSide.classList.toggle('bank-open');
  bankToggle.setAttribute('aria-expanded', String(open));
});

/**
 * Resolves once the player submits or the local clock hits zero, with the same
 * metric shape proof-reading's startRound returns.
 */
export function startUpgradeRound({ seed, timeLimit, startAt, wordset, roster }) {
  const built = buildUpgradePassage(wordset);
  set = built.set;
  parsed = built.parsed;
  slots = slotsOf(parsed);
  answers = new Array(slots.length).fill('');

  return new Promise((resolve) => {
    resolveRound = resolve;
    picked = null;
    submitMs = null;
    timeLimitMs = timeLimit * 1000;

    modeNote.textContent = `Word Upgrade · ${set.label}`;
    timerNote.textContent = `${Math.round(timeLimit / 60)} min round`;
    errorNote.textContent = `${slots.length} to upgrade`;
    filledNote.textContent = `0 of ${slots.length} upgraded`;
    hintEl.textContent = 'Read the passage, then swap each tired word for the most vivid one that fits — type it, or tap a word from the bank then tap the box.';

    renderPalette();
    renderPassage();
    upSide.classList.add('bank-open'); // the bank is open to start, so the words are read first
    if (bankToggle) bankToggle.setAttribute('aria-expanded', 'true');

    // Show the shell; hide proof-reading's board/side, show ours.
    cardEl.hidden = false;
    countdownEl.hidden = false;
    pfBoard.hidden = true;
    pfSide.hidden = true;
    upBoard.hidden = true;   // appears when the countdown ends
    upSide.hidden = true;
    if (submitBtn) { submitBtn.hidden = true; submitBtn.disabled = false; }
    timeRemainingEl.textContent = '';
    timeRemainingEl.classList.remove('is-urgent');
    if (roster) renderRoster(roster);

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    document.body.classList.add('grammar-nav-hidden');
    active = true;

    const lead = startAt - Date.now();
    const anchorAt = (lead > -2000 && lead <= START_BUFFER_MS + 2000) ? startAt : Date.now() + 800;

    (function tickCountdown() {
      const msLeft = anchorAt - Date.now();
      if (msLeft <= 0) {
        countdownEl.hidden = true;
        rosterEl.hidden = true;
        upBoard.hidden = false;
        upSide.hidden = false;
        if (submitBtn) submitBtn.hidden = false;
        endAt = anchorAt + timeLimit * 1000;
        playStartMs = Date.now();
        editing = true;
        const first = slotEl(0);
        if (first) first.focus();
        document.addEventListener('keydown', onGlobalKey);
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}
