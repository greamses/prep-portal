/* ═══════════════════════════════════════════════════════
   THE HIGHLIGHT BAR — replacements for a word or a sentence you have selected.

   The results page has offered these for as long as it has existed: a blue
   underline under a weak word opens three alternatives, an amber one under a
   flat sentence opens two rewrites. This is the same offer moved to where a
   student actually wants it — mid-draft, on whatever they have just
   highlighted, before anything has been marked.

   WHY A BAR AND NOT A POPOVER AT THE CARET. A <textarea> has no selection
   geometry: there is no Range to measure, and the usual workaround (a mirror
   div rendered behind the field with identical metrics) breaks on every soft
   wrap, every font fallback and every resize. The bar appears immediately
   under whichever field the selection is in, which is one line away from the
   highlight, always in the right place, and works the same on a phone.

   HOW IT SURVIVES BEING CLICKED. Selecting text and then clicking a button
   normally destroys the selection, which is the whole input to this feature.
   The bar takes `mousedown` and preventDefault()s it, so the click never
   moves focus out of the textarea and `selectionStart/End` are still there
   when the handler runs. The offsets are also captured the moment the
   selection is made, so even a stolen focus cannot lose them.

   IT SPENDS CREDITS (js/credits.js) and it never touches the marking — see
   that file's header. Replacing a word is the student's edit, made by the
   student, in their own draft.
═══════════════════════════════════════════════════════ */

import { currentTopic } from './config.js';
import { fetchReplacements } from './api.js';
import { COST, spend, canAfford, creditState } from './credits.js';
import { splitSentences } from './rules.js';

// One bar for the whole page: only one field can hold a selection at a time,
// so it is built once and moved to whichever field has it.
let bar = null;
let target = null;          // the textarea the selection is in
let range = null;           // { start, end } captured when the selection was made
let busy = false;

const WORD_MAX = 4;         // this many words or fewer is a "word" swap
const wordsIn = (s) => String(s || '').trim().split(/\s+/).filter(Boolean);

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SWAP = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
  stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/></svg>`;

function ensureBar() {
  if (bar) return bar;
  bar = document.createElement('div');
  bar.className = 'wsel';
  bar.hidden = true;
  // THE line that makes the whole thing work: the click must not take focus
  // off the textarea, or the selection it is about to act on is gone.
  bar.addEventListener('mousedown', (e) => e.preventDefault());
  return bar;
}

/* `is-open` is what stops a new selection yanking the bar out from under
   somebody reading their options, so hiding MUST clear it — leaving it on a
   detached bar makes the whole feature work exactly once per page. */
const hide = () => {
  if (bar) { bar.hidden = true; bar.className = 'wsel'; bar.innerHTML = ''; bar.remove(); }
  target = null;
  range = null;
};

/* What is selected, and is it worth offering anything for? A single letter is
   not a word and half a page is not a sentence, so both ends are refused
   rather than billed for. */
function readSelection(el) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (end <= start) return null;
  const raw = el.value.slice(start, end);
  const text = raw.trim();
  if (text.length < 2) return null;

  const n = wordsIn(text).length;
  if (!n) return null;
  if (n > 60) return null;

  return {
    start: start + (raw.length - raw.trimStart().length),
    end: end - (raw.length - raw.trimEnd().length),
    text,
    kind: n <= WORD_MAX ? 'word' : 'sentence',
  };
}

/* The sentence a highlighted WORD sits in. The model cannot pick a
   replacement that drops in grammatically without seeing the sentence around
   the hole, and this is free to work out here rather than paying for a
   guess. Walks the paragraph's sentences by cumulative length until it passes
   the caret — index arithmetic rather than indexOf, so a sentence that
   repeats earlier in the paragraph cannot match the wrong copy. */
function sentenceAround(el, start) {
  const text = el.value;
  const paraStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  let paraEnd = text.indexOf('\n', start);
  if (paraEnd === -1) paraEnd = text.length;

  const para = text.slice(paraStart, paraEnd);
  const offset = start - paraStart;

  let cursor = 0;
  for (const s of splitSentences(para)) {
    // splitSentences trims, so find where this one actually begins.
    const at = para.indexOf(s, cursor);
    if (at === -1) continue;
    cursor = at + s.length;
    if (offset < cursor) return s;
  }
  return para.slice(0, 300);
}

function paintIdle(sel) {
  const cost = COST[sel.kind];
  const { balance, unlimited, loaded } = creditState();
  const broke = loaded && !unlimited && balance !== null && balance < cost;
  const label = sel.kind === 'word' ? 'word' : 'sentence';

  bar.className = 'wsel';
  bar.innerHTML = `
    <span class="wsel__kind">${label}</span>
    <span class="wsel__txt">${esc(sel.text.length > 64 ? `${sel.text.slice(0, 64)}…` : sel.text)}</span>
    <span class="wsel__space"></span>
    ${broke
      ? '<span class="wsel__note">No credits left — this costs you no marks.</span>'
      : `<button type="button" class="wsel__go">${SWAP}<span>${sel.kind === 'word' ? 'Better word' : 'Rewrite it'}</span>
           <em>${cost} credit${cost === 1 ? '' : 's'}</em></button>`}`;

  bar.querySelector('.wsel__go')?.addEventListener('click', () => run(sel));
}

/* Show the bar under the field holding the selection. It is inserted into the
   DOM next to that field rather than positioned over the page, so it moves
   with the layout and never floats over the wrong thing. */
function show(el, sel) {
  ensureBar();
  target = el;
  range = { start: sel.start, end: sel.end, text: sel.text, kind: sel.kind };
  const host = el.closest('[data-improve-host]') || el.parentElement;
  if (host && bar.parentElement !== host) host.appendChild(bar);
  bar.hidden = false;
  paintIdle(sel);
}

async function run(sel) {
  if (busy || !target) return;
  if (!canAfford(sel.kind)) { paintIdle(sel); return; }

  busy = true;
  bar.innerHTML = `<span class="wsel__kind">${sel.kind === 'word' ? 'word' : 'sentence'}</span>
    <span class="wsel__wait">Looking for a better one…</span>`;

  // Reserved before the call, not after — two clicks on a slow connection
  // would otherwise both pass the affordability check. See js/credits.js.
  const paid = await spend(sel.kind);
  if (!paid.ok) {
    busy = false;
    bar.innerHTML = `<span class="wsel__note is-bad">${
      paid.out ? 'That is the last of your suggestion credits — and it costs you nothing in marks.'
      : paid.signedOut ? 'Sign in to use suggestions.'
      : 'Could not reach the suggester just then.'}</span>`;
    return;
  }

  const options = await fetchReplacements({
    kind: sel.kind,
    selection: sel.text,
    sentence: sel.kind === 'word' ? sentenceAround(target, sel.start) : '',
    topic: currentTopic,
  });
  busy = false;

  if (!options.length) {
    bar.innerHTML = '<span class="wsel__note is-bad">Nothing better came back for that one. Try highlighting a bit more.</span>';
    return;
  }
  paintOptions(sel, options);
}

function paintOptions(sel, options) {
  bar.className = 'wsel is-open';
  bar.innerHTML = `
    <div class="wsel__row">
      <span class="wsel__kind">${sel.kind === 'word' ? 'instead of' : 'instead of'}</span>
      <span class="wsel__txt">${esc(sel.text.length > 64 ? `${sel.text.slice(0, 64)}…` : sel.text)}</span>
      <span class="wsel__space"></span>
      <button type="button" class="wsel__x" aria-label="Close">×</button>
    </div>
    <div class="wsel__opts">
      ${options.map((o, i) => `
        <button type="button" class="wsel__opt" data-i="${i}">${esc(o)}</button>`).join('')}
    </div>
    <p class="wsel__foot">Pick one and it replaces what you highlighted. None of this changes how the piece is marked.</p>`;

  bar.querySelector('.wsel__x')?.addEventListener('click', hide);
  bar.querySelectorAll('.wsel__opt').forEach((btn) => {
    btn.addEventListener('click', () => applyReplacement(options[Number(btn.dataset.i)]));
  });
}

/* The student's own edit, made in their own draft. Not a paste — the
   clipboard lock (js/rules.js) is about text arriving from OUTSIDE the sheet,
   and this text was generated for this selection and inserted by a click on
   it. The caret is left holding the replacement so it can be typed over. */
function applyReplacement(text) {
  if (!target || !range) return;
  const el = target;
  const before = el.value.slice(0, range.start);
  const after = el.value.slice(range.end);
  el.value = before + text + after;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.focus();
  el.setSelectionRange(range.start, range.start + text.length);
  hide();
}

/* ── Wiring ────────────────────────────────────────────
   Attach to any writing surface: the sheet and every planner box. The host is
   the element the bar is dropped into, marked in the DOM with
   data-improve-host so this module never has to know either layout. */
export function attachImprove(el) {
  if (!el || el.dataset.ppImprove) return;
  el.dataset.ppImprove = '1';

  const check = () => {
    // Never yank the bar out from under a student reading their options.
    if (busy || bar?.classList.contains('is-open')) return;
    const sel = readSelection(el);
    if (sel) show(el, sel); else if (target === el) hide();
  };

  el.addEventListener('mouseup', check);
  el.addEventListener('keyup', (e) => { if (e.shiftKey || e.key === 'Shift' || e.ctrlKey || e.metaKey) check(); });
  el.addEventListener('select', check);
  // Typing over a selection ends it, and the bar must go with it.
  el.addEventListener('input', () => { if (!busy && !bar?.classList.contains('is-open') && target === el) hide(); });
}
