/* ═══════════════════════════════════════════════════════
   GRAMMAR — the editing round

   A 3-2-1 "get ready" beat off the shared startAt, then the round's passages —
   riddled with planted mistakes — edited in place, ONE AT A TIME, and submitted
   together at the end.

   PAGING (why the round is not one long scroll)
   A round deals `count` passages but shows exactly one. Next moves on, Back
   returns, and every edit and tag survives the trip because the surface is
   rendered FROM state (each page's `edits` array), never read back off a DOM
   that no longer exists. Handed all three at once a player skims all three for
   the cheap spelling errors; handed one, they read it.

   There is still ONE Submit, over everything dealt — see rng.js. A page the
   player never opened is not a special case: its tokens simply score as missed.

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
   /data/grammar/index.js's scoreRound. Timing after activation is entirely
   local (startAt/timeLimit) — no further server dependency during play.
═══════════════════════════════════════════════════════ */
import { buildRound, buildRoundTokens } from './rng.js';
import {
  loadPassages, scoreRound, sameToken,
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
const pagerEl = $('grammar-pager');
const pageNote = $('grammar-page-note');
const prevBtn = $('grammar-prev-btn');
const nextBtn = $('grammar-next-btn');

let active = false;    // the round is running (clock ticking)
let editing = false;   // …and the passage is live (not counting down, not submitted)

/* The round's pages, in dealt order. Each is
     { passage, tokens, tags[], edits[] }
   where `tokens` is identical on every client (seeded), `tags` is index ->
   'C'|'U'|'P'|'S'|null, and `edits` is index -> the string the player currently
   has in that word.

   `edits` is the load-bearing part of paging. It is kept in sync on every
   keystroke rather than read off the DOM at the end, because the DOM for a page
   you have navigated away from does not exist any more — the spans are replaced
   wholesale. State is the source of truth; the spans are a view of it. */
let pages = [];
let pageIndex = 0;
const visited = new Set(); // pages the player has actually opened

let activeIndex = -1;  // the token on the CURRENT page that the tag buttons act on
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

// The page being edited right now. Everything below reads through this rather
// than through module-level token/tag arrays — that indirection IS the paging.
const page = () => pages[pageIndex] || { passage: null, tokens: [], tags: [], edits: [] };

function applyTag(key) {
  if (!editing || activeIndex < 0) return;
  const p = page();
  p.tags[activeIndex] = p.tags[activeIndex] === key ? null : key;
  paintToken(activeIndex);
  syncTagbar();
  updateNotes();
}

// The bar reflects the tag on the word the caret is in.
function syncTagbar() {
  const cur = activeIndex >= 0 ? page().tags[activeIndex] : null;
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
  const p = page();
  const changed = !sameToken(el.textContent, p.tokens[i].shown);
  el.classList.toggle('is-edited', changed);
  el.classList.toggle('is-tagged', !!p.tags[i]);
  el.dataset.tag = p.tags[i] || '';
}

/* Renders the CURRENT page, from its `edits` — not from `shown`. That is what
   makes Back non-destructive: a word you corrected on passage 1 comes back
   corrected, still marked edited, still carrying its tag. */
function renderPassage() {
  const p = page();
  passageEl.innerHTML = '';
  p.tokens.forEach((t, i) => {
    const span = document.createElement('span');
    span.className = 'grammar-tok';
    span.dataset.i = String(i);
    span.contentEditable = 'true';
    span.spellcheck = false;              // never underline the planted errors
    span.autocapitalize = 'off';          // a phone keyboard would fix the C errors for them
    span.autocorrect = 'off';
    span.setAttribute('autocomplete', 'off');
    span.textContent = p.edits[i];
    passageEl.appendChild(span);
    if (t.br) {
      // End of an authored line — a real paragraph break. A letter whose
      // greeting and sign-off run into the body is not a letter, and the
      // comma after "Dear Bola" only reads as correct on its own line.
      const gap = document.createElement('span');
      gap.className = 'grammar-break';
      gap.setAttribute('aria-hidden', 'true');
      passageEl.appendChild(gap);
      return;
    }
    // A real space between words, outside any editable span, so the line wraps
    // naturally and no token can ever swallow its neighbour's separator.
    passageEl.appendChild(document.createTextNode(' '));
  });
  // Repaint the marks — an edited/tagged word must look edited/tagged the
  // moment it comes back, not only after it is touched again.
  p.tokens.forEach((_t, i) => paintToken(i));
}

/* ── Paging ───────────────────────────────────────────────────────────────
   Next/Back swap the whole surface. The clock does NOT reset, pause or branch:
   it is one round over everything dealt, so time spent on passage 1 is time not
   spent on passage 3, which is exactly the budgeting decision the round is
   supposed to make the player face. */
function showPage(i) {
  if (!pages.length) return;
  pageIndex = Math.max(0, Math.min(i, pages.length - 1));
  visited.add(pageIndex);
  const p = page();
  titleEl.textContent = p.passage ? p.passage.title : 'Passage';
  activeIndex = -1;
  renderPassage();
  syncTagbar();
  updatePager();
  updateNotes();
  passageEl.scrollTop = 0;
  if (editing) focusToken(0, false); // straight in — the clock is still running
}

function updatePager() {
  const many = pages.length > 1;
  if (pagerEl) pagerEl.hidden = !many;
  if (!many) return;
  // The per-page error count, not just the round total. Told this passage holds
  // four and having found three, a player has a real reason to read it once
  // more before pressing Next — which is the whole point of paging it.
  const here = page().tokens.filter((t) => t.cat).length;
  pageNote.textContent =
    `Passage ${pageIndex + 1} of ${pages.length} · ${here} ${here === 1 ? 'error' : 'errors'} here`;
  if (prevBtn) prevBtn.disabled = pageIndex === 0;
  if (nextBtn) nextBtn.disabled = pageIndex >= pages.length - 1;
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
  const i = Number(el.dataset.i);
  // Write through to state on every keystroke. This is the only place the DOM
  // is read, and it has to happen HERE rather than at submit: navigate to the
  // next passage and these spans are gone, along with anything not saved.
  page().edits[i] = el.textContent;
  paintToken(i);
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
  // Ctrl/Cmd+arrow pages the round. Checked before the caret keys below, which
  // would otherwise eat the same arrows at a word's edge.
  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault();
    showPage(pageIndex + (e.key === 'ArrowRight' ? 1 : -1));
    return;
  }
  if (e.ctrlKey || e.metaKey) return; // leave every other shortcut alone

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

   The counts span the WHOLE ROUND, not the page on screen, because that is the
   scale the decision is made at — "nine of twelve, two minutes left" is only
   answerable if the nine includes the passage you already left. The per-page
   count lives in the pager instead (see updatePager).

   What is never shown is whether any individual edit was RIGHT. */
function editCounts() {
  let edited = 0, tagged = 0;
  // Counted from state, so pages that are not on screen still count.
  pages.forEach((p) => {
    p.tokens.forEach((t, i) => {
      if (!sameToken(p.edits[i], t.shown)) edited += 1;
      if (p.tags[i]) tagged += 1;
    });
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

  // The visible page's spans are the one place state can lag — an IME or a
  // paste that never fired `input` would leave the last word unsaved. Sweep it
  // in before scoring; every other page was written through as it was typed.
  const cur = page();
  cur.tokens.forEach((_t, i) => {
    const el = tokenEl(i);
    if (el) cur.edits[i] = el.textContent;
  });

  const result = scoreRound(pages);

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
      // worth playing if you get to see what you missed. Marked per passage,
      // in dealt order, because three passages run together teaches nothing.
      result,
      pages: pages.map((p, i) => ({
        passage: p.passage,
        tokens: p.tokens,
        result: result.pages[i],
      })),
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
  // The failure mode paging introduces: submitting having never opened the last
  // passage, and scoring zero on a third of the round without knowing it. Worth
  // one interruption, since it is unrecoverable and always a mistake.
  const unseen = pages.length - visited.size;
  if (unseen > 0) {
    const what = unseen === 1 ? "There is 1 passage you haven't opened yet."
      : `There are ${unseen} passages you haven't opened yet.`;
    if (!window.confirm(`${what} Submit anyway?`)) return;
  }
  submitMs = Date.now() - playStartMs;
  endRound();
}

buildTagbar();
if (submitBtn) submitBtn.addEventListener('click', doSubmit);
if (prevBtn) prevBtn.addEventListener('click', () => showPage(pageIndex - 1));
if (nextBtn) nextBtn.addEventListener('click', () => showPage(pageIndex + 1));
// Keep the caret in the passage when the pager is clicked, so the tag bar still
// applies to the word the player was on after the page swaps.
[prevBtn, nextBtn].forEach((b) => b && b.addEventListener('mousedown', (e) => e.preventDefault()));

/**
 * Resolves once the player submits or the local clock hits zero, with the
 * score, the ranking metrics, and the full per-token breakdown for the review.
 */
export async function startRound({
  seed, timeLimit, startAt, grade, theme, focus, count = 1, roster,
}) {
  // The bank loads on demand, so the round's passages must all be in hand
  // before the countdown ends — there is no time to fetch page 2 when the
  // player presses Next. It resolves from cache on a replay.
  const passages = await loadPassages(theme);
  const dealt = buildRound({ seed, passages, grade, count });
  pages = dealt.map((p) => {
    const toks = buildRoundTokens(p, focus);
    return {
      passage: p,
      tokens: toks,
      tags: toks.map(() => null),
      edits: toks.map((t) => t.shown),
    };
  });
  errorTotal = pages.reduce((n, p) => n + p.tokens.filter((t) => t.cat).length, 0);

  return new Promise((resolve) => {
    resolveRound = resolve;
    pageIndex = 0;
    visited.clear();
    activeIndex = -1;
    submitMs = null;
    timeLimitMs = timeLimit * 1000;

    const meta = themeMeta(theme);
    const many = pages.length > 1;
    modeNote.textContent = `${meta ? meta.label : 'Passage'} · ${focusLabel(focus)}`
      + (many ? ` · ${pages.length} passages` : '');
    timerNote.textContent = `${Math.round(timeLimit / 60)} min round`;
    errorNote.textContent = `${errorTotal} ${errorTotal === 1 ? 'error' : 'errors'} planted`
      + (many ? ' in all' : '');
    editNote.textContent = '0 edited · 0 named';
    hintEl.textContent = many
      ? 'Click any word to correct it, then tap C, U, P or S to name the mistake. Next moves to the following passage — one Submit covers them all.'
      : 'Click any word to correct it, then tap C, U, P or S to name the mistake.';

    // Page 1 up front, but `visited` is cleared again below: the countdown is
    // still running, so nobody has actually READ it yet.
    showPage(0);
    visited.clear();

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
        visited.add(pageIndex); // now it counts as read
        focusToken(0, false);   // straight into the passage — the clock is running
        document.addEventListener('keydown', onGlobalKey);
        rafId = requestAnimationFrame(tick);
        return;
      }
      countdownEl.textContent = Math.ceil(msLeft / 1000);
      setTimeout(tickCountdown, 100);
    })();
  });
}

