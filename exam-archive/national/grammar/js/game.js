/* ═══════════════════════════════════════════════════════
   GRAMMAR — the editing round

   A 3-2-1 "get ready" beat off the shared startAt, then ONE passage, riddled
   with planted mistakes, that the player edits in place and submits.

   HOW THE EDITING SURFACE IS BUILT — and why it is not one contenteditable
   The passage LOOKS like a single editable paragraph, and to a player it
   behaves like one: click anywhere, type, arrow across word boundaries. It is
   actually a row of per-word contenteditable spans inside an inert container.

   That is the load-bearing decision of the whole page. A single editable blob
   loses the anchors: the first time a child backspaces across a word boundary
   or pastes, the browser merges away whatever markup said "this span is error
   #7", and scoring is reduced to guessing which free-text edit was aimed at
   which planted mistake. Per-token editing makes that impossible — token 4 is
   token 4 from first paint to submit — at the cost of the caret handling in
   onTokenKey() below, which is the price of admission.

   SPELLCHECK IS OFF, EVERYWHERE. Not a nicety: the browser's own red underline
   would hand the player every S error in the passage for free, and half the U
   ones too.

   Score is errors CAUGHT plus errors correctly NAMED (the C/U/P/S tag) — see
   /data/grammar/index.js's scorePassage. Timing after activation is entirely
   local (startAt/timeLimit) — no further server dependency during play.
═══════════════════════════════════════════════════════ */
import { buildRound, buildRoundTokens } from './rng.js';
import {
  loadPassages, scorePassage, sameToken,
  CUPS, themeMeta, focusLabel,
} from '/data/grammar/index.js';

const $ = (id) => document.getElementById(id);
// Mirrors seeded-room.js's START_BUFFER_MS. Used only to sanity-check the
// startAt we're handed against our own clock — never to schedule anything.
const START_BUFFER_MS = 3000;

const playBd = $('grammar-play-bd');
const cardEl = $('grammar-card');
const countdownEl = $('grammar-countdown');
const rosterEl = $('grammar-roster');
const timeRemainingEl = $('grammar-time-remaining');
const boardEl = $('grammar-board');
const titleEl = $('grammar-passage-title');
const passageEl = $('grammar-passage');
const sideEl = $('grammar-play-side');
const tagbarEl = $('grammar-tagbar');
const submitBtn = $('grammar-submit-btn');
const errorNote = $('grammar-error-note');
const editNote = $('grammar-edit-note');
const timerNote = $('grammar-timer-note');
const modeNote = $('grammar-mode-note');
const hintEl = $('grammar-hint');

let active = false;    // the round is running (clock ticking)
let editing = false;   // …and the passage is live (not counting down, not submitted)
let tokens = [];       // [{ i, shown, answer, cat }] — identical on every client
let passage = null;
let activeIndex = -1;  // the token the tag buttons will act on
const tags = [];       // index -> 'C' | 'U' | 'P' | 'S' | null
let errorTotal = 0;
let playStartMs = 0;
let submitMs = null;   // ms taken to submit, or null if the clock ran out
let timeLimitMs = 0;
let endAt = 0;
let rafId = null;
let resolveRound = null;

// The room-entry animation: everyone in the room (you, other real players,
// bots with real names) pops in one at a time during the "get ready" beat.
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

/* ── The CUPS tag bar ─────────────────────────────────────────────────────
   Naming the error is worth the same as fixing it, so this is not decoration.
   A button applies its letter to whichever word the caret is in; pressing the
   same letter again clears it. Alt+C/U/P/S does the same from the keyboard, so
   a fluent player never has to leave the passage — Alt because the bare letters
   are, obviously, being typed into the words. */
function buildTagbar() {
  tagbarEl.innerHTML = '';
  CUPS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pp-sticky pp-sticky--tape grammar-tagbtn pp-sticky--c${i % 6}`;
    btn.dataset.tag = c.key;
    btn.title = `${c.label} — Alt+${c.key}`;
    btn.innerHTML = `<span class="grammar-tagbtn-key">${c.key}</span><span class="grammar-tagbtn-label">${c.short}</span>`;
    btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep the caret in the word
    btn.addEventListener('click', () => applyTag(c.key));
    tagbarEl.appendChild(btn);
  });
}

function applyTag(key) {
  if (!editing || activeIndex < 0) return;
  tags[activeIndex] = tags[activeIndex] === key ? null : key;
  paintToken(activeIndex);
  syncTagbar();
  updateNotes();
}

// The bar reflects the tag on the word the caret is in.
function syncTagbar() {
  const cur = activeIndex >= 0 ? tags[activeIndex] : null;
  tagbarEl.querySelectorAll('.grammar-tagbtn').forEach((b) => {
    b.classList.toggle('is-on', b.dataset.tag === cur);
  });
  tagbarEl.classList.toggle('is-idle', activeIndex < 0);
}

const tokenEl = (i) => passageEl.querySelector(`[data-i="${i}"]`);

// A word's look is driven entirely by two facts we are allowed to know without
// giving anything away: has it been changed, and has it been tagged. Nothing
// here can hint at whether the change was RIGHT — that is the whole game.
function paintToken(i) {
  const el = tokenEl(i);
  if (!el) return;
  const changed = !sameToken(el.textContent, tokens[i].shown);
  el.classList.toggle('is-edited', changed);
  el.classList.toggle('is-tagged', !!tags[i]);
  el.dataset.tag = tags[i] || '';
}

function renderPassage() {
  passageEl.innerHTML = '';
  tokens.forEach((t, i) => {
    const span = document.createElement('span');
    span.className = 'grammar-tok';
    span.dataset.i = String(i);
    span.contentEditable = 'true';
    span.spellcheck = false;              // never underline the planted errors
    span.autocapitalize = 'off';          // a phone keyboard would fix the C errors for them
    span.autocorrect = 'off';
    span.setAttribute('autocomplete', 'off');
    span.textContent = t.shown;
    passageEl.appendChild(span);
    // A real space between words, outside any editable span, so the line wraps
    // naturally and no token can ever swallow its neighbour's separator.
    passageEl.appendChild(document.createTextNode(' '));
  });
}

// Delegated from the container, and bound ONCE at module load — not per round.
// renderPassage() replaces the spans on every replay but the container itself
// survives, so binding in there would stack a second set of handlers on the
// second round and fire everything twice.
passageEl.addEventListener('input', onTokenInput);
passageEl.addEventListener('keydown', onTokenKey);
passageEl.addEventListener('focusin', onTokenFocus);
passageEl.addEventListener('paste', onTokenPaste);

function onTokenFocus(e) {
  const el = e.target.closest('.grammar-tok');
  if (!el) return;
  activeIndex = Number(el.dataset.i);
  syncTagbar();
}

function onTokenInput(e) {
  const el = e.target.closest('.grammar-tok');
  if (!el) return;
  paintToken(Number(el.dataset.i));
  updateNotes();
}

// Paste arrives as whatever the clipboard holds — markup, newlines, several
// words. Flatten it to a single word's worth of plain text so one paste can
// never restructure the passage.
function onTokenPaste(e) {
  const el = e.target.closest('.grammar-tok');
  if (!el) return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text') || '';
  document.execCommand('insertText', false, text.replace(/\s+/g, ''));
}

/* Caret handling across word boundaries. Each word is its own editing surface,
   so the browser will not walk the caret between them for us — these five keys
   are what make the row of spans feel like one paragraph. */
function caretAtStart(el) {
  const s = window.getSelection();
  if (!s.rangeCount) return false;
  const r = s.getRangeAt(0);
  return r.collapsed && r.startOffset === 0;
}
function caretAtEnd(el) {
  const s = window.getSelection();
  if (!s.rangeCount) return false;
  const r = s.getRangeAt(0);
  return r.collapsed && r.startOffset === (el.textContent || '').length;
}
function focusToken(i, atEnd) {
  const el = tokenEl(i);
  if (!el) return;
  el.focus();
  const range = document.createRange();
  const node = el.firstChild || el;
  const len = el.textContent.length;
  range.setStart(node, atEnd ? len : 0);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  activeIndex = i;
  syncTagbar();
}

function onTokenKey(e) {
  const el = e.target.closest('.grammar-tok');
  if (!el) return;
  const i = Number(el.dataset.i);

  // Alt+C/U/P/S tags the current word without leaving the keyboard.
  if (e.altKey && /^[cups]$/i.test(e.key)) {
    e.preventDefault();
    applyTag(e.key.toUpperCase());
    return;
  }
  if (e.key === 'Enter') { e.preventDefault(); return; } // one paragraph, no newlines
  if (e.key === ' ' || e.key === 'Tab') {
    // Space moves on rather than splitting a word in two — the passage's word
    // count is fixed, and a token that swallowed a space would break the
    // one-token-one-error contract scoring depends on.
    e.preventDefault();
    focusToken(e.shiftKey && e.key === 'Tab' ? i - 1 : i + 1, false);
    return;
  }
  if (e.key === 'ArrowRight' && caretAtEnd(el)) { e.preventDefault(); focusToken(i + 1, false); return; }
  if (e.key === 'ArrowLeft' && caretAtStart(el)) { e.preventDefault(); focusToken(i - 1, true); return; }
  if (e.key === 'Backspace' && caretAtStart(el)) { e.preventDefault(); focusToken(i - 1, true); return; }
  if (e.key === 'Delete' && caretAtEnd(el)) { e.preventDefault(); focusToken(i + 1, false); return; }
}

/* ── The live notes ───────────────────────────────────────────────────────
   The error COUNT is given away on purpose. Without it a player has no way to
   know whether to keep hunting or submit, and the honest answer to "am I
   finished?" becomes "when you get bored" — which is not a decision worth
   making. Told there are twelve, a player with nine found and two minutes left
   has a real choice: keep reading, or bank the time.

   What is never shown is whether any individual edit was RIGHT. */
function editCounts() {
  let edited = 0, tagged = 0;
  tokens.forEach((t, i) => {
    const el = tokenEl(i);
    if (el && !sameToken(el.textContent, t.shown)) edited += 1;
    if (tags[i]) tagged += 1;
  });
  return { edited, tagged };
}

function updateNotes() {
  const { edited, tagged } = editCounts();
  editNote.textContent = `${edited} edited · ${tagged} named`;
}

function tick() {
  if (!active) return;
  const remainingMs = endAt - Date.now();
  if (remainingMs <= 0) { endRound(); return; }
  const secs = Math.ceil(remainingMs / 1000);
  timeRemainingEl.textContent = `${secs}s left`;
  // The last thirty seconds go red — a proof-reader who has lost track of the
  // clock submits nothing at all, which is the worst possible outcome.
  timeRemainingEl.classList.toggle('is-urgent', secs <= 30);
  rafId = requestAnimationFrame(tick);
}

function endRound() {
  if (!active) return;
  active = false;
  editing = false;
  if (rafId) cancelAnimationFrame(rafId);
  document.removeEventListener('keydown', onGlobalKey);

  // Read the surface once, at the end. Everything before this was presentation.
  const edits = tokens.map((t, i) => {
    const el = tokenEl(i);
    return el ? el.textContent : t.shown;
  });
  const result = scorePassage(tokens, edits, tags);

  playBd.classList.remove('open');
  playBd.setAttribute('aria-hidden', 'true');

  if (resolveRound) {
    resolveRound({
      score: result.score,
      errorTotal: result.errorTotal,
      // Finishers are ranked on how fast they submitted; anyone who ran the
      // clock out is recorded at the full limit.
      timeMs: submitMs != null ? submitMs : timeLimitMs,
      falseEdits: result.falseEdits,
      caught: result.caught,
      tagged: result.tagged,
      // Carried through to the review overlay (see main.js) — the round is only
      // worth playing if you get to see what you missed.
      result,
      tokens,
      passage,
    });
  }
  resolveRound = null;
}

function onGlobalKey(e) {
  if (!active) return;
  // Ctrl/Cmd+Enter submits from anywhere in the passage.
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    doSubmit();
  }
}

function doSubmit() {
  if (!active || !editing) return;
  const { edited } = editCounts();
  // A submit with nothing changed is almost always a misclick, not a claim that
  // the passage was already perfect — and it costs the player the whole round.
  if (edited === 0 && !window.confirm('You have not changed anything yet. Submit anyway?')) return;
  submitMs = Date.now() - playStartMs;
  endRound();
}

buildTagbar();
if (submitBtn) submitBtn.addEventListener('click', doSubmit);

/**
 * Resolves once the player submits or the local clock hits zero, with the
 * score, the ranking metrics, and the full per-token breakdown for the review.
 */
export async function startRound({
  seed, timeLimit, startAt, grade, theme, focus, roster,
}) {
  // The bank loads on demand, so the round's passage must be in hand before the
  // countdown ends. It resolves from cache on a replay.
  const passages = await loadPassages(theme);
  passage = buildRound({ seed, passages, grade });
  tokens = buildRoundTokens(passage, focus);
  errorTotal = tokens.filter((t) => t.cat).length;

  return new Promise((resolve) => {
    resolveRound = resolve;
    tags.length = 0;
    tokens.forEach(() => tags.push(null));
    activeIndex = -1;
    submitMs = null;
    timeLimitMs = timeLimit * 1000;

    const meta = themeMeta(theme);
    titleEl.textContent = passage ? passage.title : 'Passage';
    modeNote.textContent = `${meta ? meta.label : 'Passage'} · ${focusLabel(focus)}`;
    timerNote.textContent = `${Math.round(timeLimit / 60)} min round`;
    errorNote.textContent = `${errorTotal} ${errorTotal === 1 ? 'error' : 'errors'} planted`;
    editNote.textContent = '0 edited · 0 named';
    hintEl.textContent = 'Click any word to correct it, then tap C, U, P or S to name the mistake.';

    renderPassage();
    syncTagbar();

    cardEl.hidden = false;
    countdownEl.hidden = false;
    boardEl.hidden = true;
    sideEl.hidden = true;
    if (submitBtn) { submitBtn.hidden = true; submitBtn.disabled = false; }
    timeRemainingEl.textContent = '';
    timeRemainingEl.classList.remove('is-urgent');
    if (roster) renderRoster(roster);

    playBd.classList.add('open');
    playBd.setAttribute('aria-hidden', 'false');
    // Game mode: the nav goes away. A round is timed and full-screen — a stray
    // click on the menu mid-round costs the player the round.
    document.body.classList.add('grammar-nav-hidden');
    active = true;

    // startAt is the ACTIVATOR's local clock, and we schedule against our OWN
    // Date.now() — which only agrees if the two devices share a wall clock.
    // Join-by-code routinely puts two different phones in a room, and a phone
    // whose clock is minutes off would compute an endAt already behind it: the
    // countdown clears and the player is dumped straight onto the results
    // screen. So trust startAt only when it lands in the plausible window;
    // otherwise anchor to THIS device's clock, so a skewed player still gets a
    // full round — just offset from everyone else, which the leaderboard's
    // grace window tolerates.
    const lead = startAt - Date.now();
    const anchorAt = (lead > -2000 && lead <= START_BUFFER_MS + 2000)
      ? startAt
      : Date.now() + 800;

    (function tickCountdown() {
      const msLeft = anchorAt - Date.now();
      if (msLeft <= 0) {
        countdownEl.hidden = true;
        rosterEl.hidden = true;
        boardEl.hidden = false;
        sideEl.hidden = false;
        if (submitBtn) submitBtn.hidden = false;
        endAt = anchorAt + timeLimit * 1000;
        playStartMs = Date.now();
        editing = true;
        focusToken(0, false); // straight into the passage — the clock is running
        document.addEventListener('keydown', onGlobalKey);
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}

