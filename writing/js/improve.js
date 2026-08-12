/* ═══════════════════════════════════════════════════════
   THE HIGHLIGHT BAR — replacements for a word or a sentence you have selected.

   The results page has offered these for as long as it has existed: a blue
   underline under a weak word opens three alternatives, an amber one under a
   flat sentence opens two rewrites. This is the same offer moved to where a
   student actually wants it — mid-draft, on whatever they have just
   highlighted, before anything has been marked.

   IT IS A TOOLTIP, pointing at the words it is about — see js/tip.js for how
   a <textarea> is made to give up the geometry it does not have. A panel
   underneath would make the reader find the thing it refers to; a tooltip
   sits over it.

   HOW IT SURVIVES BEING CLICKED. Selecting text and then clicking a button
   normally destroys the selection, which is the whole input to this feature.
   The tooltip takes `mousedown` and preventDefault()s it (js/tip.js), so the
   click never moves focus out of the textarea. The offsets are also captured
   the moment the selection is made, so even a stolen focus cannot lose them.

   IT SPENDS CREDITS (js/credits.js) and it never touches the marking — see
   that file's header. Replacing a word is the student's edit, made by the
   student, in their own draft.
═══════════════════════════════════════════════════════ */

import { currentTopic } from './config.js';
import { fetchReplacements } from './api.js';
import { COST, spend, canAfford, creditState } from './credits.js';
import { splitSentences } from './rules.js';
import { showTip, hideTip, tipEl, tipIsMenu } from './tip.js';

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

const hide = () => { hideTip(); target = null; range = null; };

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

/* The first thing you see: a small offer, pointing at what you highlighted.
   It says the price before it is spent, never after. */
function paintIdle(sel) {
  const cost = COST[sel.kind];
  const { balance, unlimited, loaded } = creditState();
  const broke = loaded && !unlimited && balance !== null && balance < cost;

  const html = broke
    ? '<span class="pptip__note">No suggestion credits left — and that costs you no marks.</span>'
    : `<button type="button" class="pptip__go">${SWAP}<span>${sel.kind === 'word' ? 'Better word' : 'Rewrite it'}</span>
         <em>${cost} credit${cost === 1 ? '' : 's'}</em></button>`;

  const el = showTip({
    el: target, start: sel.start, end: sel.end, html,
    kind: 'menu',
    onGone: () => { target = null; range = null; },
  });
  el?.querySelector('.pptip__go')?.addEventListener('click', () => run(sel));
}

function show(el, sel) {
  target = el;
  range = { start: sel.start, end: sel.end, text: sel.text, kind: sel.kind };
  paintIdle(sel);
}

async function run(sel) {
  if (busy || !target) return;
  if (!canAfford(sel.kind)) { paintIdle(sel); return; }

  busy = true;
  const say = (html, kind = 'menu') => showTip({
    el: target, start: sel.start, end: sel.end, html, kind,
    ms: kind === 'warn' ? 4000 : 0,
    onGone: () => { target = null; range = null; },
  });

  say('<span class="pptip__wait">Looking for a better one…</span>');

  // Reserved before the call, not after — two clicks on a slow connection
  // would otherwise both pass the affordability check. See js/credits.js.
  const paid = await spend(sel.kind);
  if (!paid.ok) {
    busy = false;
    say(`<span class="pptip__note is-bad">${
      paid.out ? 'That was the last of your suggestion credits — it costs you nothing in marks.'
      : paid.signedOut ? 'Sign in to use suggestions.'
      : 'Could not reach the suggester just then.'}</span>`, 'warn');
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
    say('<span class="pptip__note is-bad">Nothing better came back. Try highlighting a bit more.</span>', 'warn');
    return;
  }
  paintOptions(sel, options);
}

function paintOptions(sel, options) {
  const shown = sel.text.length > 38 ? `${sel.text.slice(0, 38)}…` : sel.text;
  const html = `
    <p class="pptip__hdr">
      <span class="pptip__lbl">instead of</span>
      <span class="pptip__was">${esc(shown)}</span>
      <button type="button" class="pptip__x" aria-label="Close">×</button>
    </p>
    <div class="pptip__opts">
      ${options.map((o, i) => `
        <button type="button" class="pptip__opt" data-i="${i}">${esc(o)}</button>`).join('')}
    </div>
    <p class="pptip__foot">Pick one to swap it in. None of this changes your marks.</p>`;

  const el = showTip({
    el: target, start: sel.start, end: sel.end, html,
    kind: 'menu',
    onGone: () => { target = null; range = null; },
  });
  if (!el) return;

  el.querySelector('.pptip__x')?.addEventListener('click', hide);
  el.querySelectorAll('.pptip__opt').forEach((btn) => {
    btn.addEventListener('click', () => applyReplacement(options[Number(btn.dataset.i)]));
  });
}

/* The student's own edit, made in their own draft. Not a paste — the
   clipboard lock (js/rules.js) is about text arriving from OUTSIDE the sheet,
   and this text was generated for this selection and inserted by a click on
   it. The caret is left holding the replacement so it can be typed over. */
function applyReplacement(text) {
  if (!target || !range) return;
  /* Everything needed is copied out FIRST. Dispatching `input` runs this
     module's own listener synchronously, which calls hide() and nulls both
     `target` and `range` — reading them back afterwards throws, and the caret
     is left wherever the browser put it. */
  const el = target;
  const at = range.start;
  const before = el.value.slice(0, at);
  const after = el.value.slice(range.end);

  el.value = before + text + after;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  hide();
  el.focus();
  /* Caret AFTER the new words, not around them. Leaving them selected fires
     `select`, which opens a fresh tooltip on the word that was just chosen —
     which reads as the tool refusing the choice. Collapsed, the student is
     simply back where they were, ready to keep writing. */
  el.setSelectionRange(at + text.length, at + text.length);
}

/* ── Wiring ────────────────────────────────────────────
   Attach to any writing surface: the sheet and every planner box. The tooltip
   is a single shared element (js/tip.js) that points at whichever field holds
   the selection, so nothing here needs to know either layout. */
export function attachImprove(el) {
  if (!el || el.dataset.ppImprove) return;
  el.dataset.ppImprove = '1';

  /* A call in flight is the only thing that must not be interrupted. A NEW
     selection made while options are on screen should replace them — that is
     a student moving on to the next word — and a click inside the tooltip
     never reaches here, because js/tip.js swallows its mousedown. */
  const check = () => {
    if (busy) return;
    const sel = readSelection(el);
    if (sel) show(el, sel);
    else if (target === el) hide();
  };

  el.addEventListener('mouseup', check);
  el.addEventListener('keyup', (e) => { if (e.shiftKey || e.key === 'Shift' || e.ctrlKey || e.metaKey) check(); });
  el.addEventListener('select', check);
  // Typing over a selection ends it, and the tooltip goes with it.
  el.addEventListener('input', () => { if (!busy && target === el) hide(); });
}
