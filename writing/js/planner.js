/* ═══════════════════════════════════════════════════════
   THE PLANNER — the same idea as the summary organiser, for every other form.

   A summary has never been written on a blank sheet here: js/summary.js puts
   one box under each paragraph of the source, because "what is THIS paragraph
   saying?" is a question a student can answer and "summarise this" is not.
   Every other form was still getting the blank sheet, and it fails the same
   way — the student writes the introduction, keeps writing, and stops when
   they run out, which is how you get one long paragraph that does two of the
   four things the form needed.

   So the plan is the MNEMONIC. One box per letter (js/forms.js MNEMONICS), in
   the tile's own colour, with the move named above it — the third view of the
   same four steps, after the wall chart in the lesson and the tagged blocks
   of the model text. A student who has read the lesson arrives here and finds
   the chart again, this time with somewhere to write.

   TWO THINGS IT DELIBERATELY IS NOT:

   It is not a gate. The summary organiser has to be walked through because a
   summary without coverage is not a summary; an essay written straight onto
   the sheet is just an essay written confidently, so "Straight to the sheet"
   is always there and never nags.

   It is not a form with four fields. A box may hold more than one paragraph —
   it usually must, since the sheet wants five paragraphs and a mnemonic has
   four letters — so the boxes are sized for prose, blank lines inside them
   are kept, and the foot counts the paragraphs the SHEET will see rather than
   the boxes it came from.
═══════════════════════════════════════════════════════ */

import { $, currentTopic, currentWritingType, safe } from './config.js';
import { getMnemonic, keyColorClass } from './forms.js';
import { suggestForMove } from './api.js';
import { checkDraft, lockWriting, MIN_SENTENCE_WORDS, splitSentences } from './rules.js';
import { attachImprove } from './improve.js';
import { COST, spend, canAfford, renderCreditBadge } from './credits.js';

// One box per mnemonic key. Kept here rather than in config because nothing
// outside this step needs it — what leaves is the assembled piece.
let boxes = [];
let planKey = '';
const tips = new Map();      // key index → the suggestions already fetched
const pending = new Set();   // key indexes with a call in flight

const words = (s) => String(s || '').trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
const wordCount = (s) => words(s).length;
const paraCount = (s) => String(s || '').split(/\n+/).map((p) => p.trim()).filter(Boolean).length;

const CHEVRON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
  stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
const BULB = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
  stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M9 18h6"/><path d="M10 21.5h4"/>
  <path d="M12 2.5a6 6 0 0 0-3.5 10.9c.6.5.9 1.1 1 1.8h5c.1-.7.4-1.3 1-1.8A6 6 0 0 0 12 2.5Z"/></svg>`;

/* THE flag for "is there a planner for this task?". A form the student
   brought themselves has no mnemonic, so there is nothing to plan against and
   the lesson goes straight to the sheet as it always did. Summaries have
   their own organiser and never come here. */
export const hasPlanner = (formId = currentWritingType) => !!getMnemonic(formId);

// Identity of the plan, so a new prompt clears the boxes but a Retry on the
// same one keeps everything the student already worked out.
const keyOf = () => `${currentWritingType}::${currentTopic}`;

export function resetPlanner() {
  boxes = [];
  planKey = '';
  tips.clear();
  pending.clear();
}

export function plannerProgress() {
  const mn = getMnemonic(currentWritingType);
  const total = mn ? mn.keys.length : 0;
  let filled = 0;
  for (let i = 0; i < total; i += 1) if ((boxes[i] || '').trim()) filled += 1;
  return { filled, total, complete: total > 0 && filled === total };
}

/* Boxes become paragraphs. A blank line inside a box is kept, because a box
   that holds two paragraphs is the normal case rather than a mistake, and the
   sheet's paragraph rule counts what comes out of here. */
export function assemblePlan() {
  const mn = getMnemonic(currentWritingType);
  if (!mn) return '';
  return mn.keys
    .map((_, i) => String(boxes[i] || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

/* ── The planner ───────────────────────────────────────── */

export function buildPlanner({ onChange } = {}) {
  const host = $('plan-section');
  const mn = getMnemonic(currentWritingType);
  if (!host || !mn) return;

  const key = keyOf();
  if (key !== planKey) {
    planKey = key;
    boxes = new Array(mn.keys.length).fill('');
    tips.clear();
  }

  host.innerHTML = `
    <p class="sec-label">The Plan</p>
    <p class="org-intro">
      One box per move of <strong>${safe(mn.word)}</strong> — the same four steps as the chart in the
      lesson. Write them in any order you like; they go onto the sheet top to bottom.
      A box can hold more than one paragraph, and most pieces need at least one that does.
    </p>
    <p class="wcredits" id="plan-credits" hidden></p>

    <div class="org-flow plan-flow">
      ${mn.keys.map((k, i) => `
        ${i ? `<div class="org-arrow" aria-hidden="true">${CHEVRON}</div>` : ''}
        <div class="org-card plan-card" data-card="${i}">
          <div class="org-card__hdr plan-card__hdr">
            <span class="plan-num pp-sticky ${keyColorClass(i)}">${safe(k.k)}</span>
            <span class="org-card__ttl">${safe(k.name)}<em>${safe(k.what)}</em></span>
            <button type="button" class="plan-tipbtn" data-tip="${i}"
              aria-label="Suggestions for ${safe(k.name)}">${BULB}<span>Ideas</span>
              <em>${COST.ideas}</em></button>
          </div>
          <div class="org-card__body plan-card__body">
            <div class="org-in" data-improve-host>
              <textarea class="org-field plan-field" data-i="${i}" rows="5"
                placeholder="${safe(k.what)}"></textarea>
              <div class="org-meta" data-meta="${i}"></div>
              <div class="plan-tips" data-tips="${i}" hidden></div>
            </div>
          </div>
        </div>`).join('')}

      <div class="org-arrow" aria-hidden="true">${CHEVRON}</div>
      <div class="org-foot">
        <p class="org-foot__hdr">What the sheet will see</p>
        <p class="org-foot__meta" id="plan-foot-meta"></p>
        <ul class="plan-foot__rules" id="plan-foot-rules"></ul>
      </div>
    </div>`;

  host.querySelectorAll('.plan-field').forEach((field) => {
    const i = Number(field.dataset.i);
    field.value = boxes[i] || '';
    // The clipboard is shut here for the same reason it is shut on the sheet
    // (js/rules.js) — this IS the sheet, one box at a time.
    lockWriting(field);
    // …and highlighting a word here offers replacements exactly as it does
    // there, because it is the same writing (js/improve.js).
    attachImprove(field);
    field.addEventListener('input', () => {
      boxes[i] = field.value;
      refreshMeta(i);
      refreshFoot();
      onChange?.();
    });
    refreshMeta(i);
  });

  host.querySelectorAll('.plan-tipbtn').forEach((btn) => {
    btn.addEventListener('click', () => loadTips(Number(btn.dataset.tip)));
  });

  // Anything already fetched survives a rebuild — going back to the plan must
  // not silently throw away three suggestions and bill for them again.
  tips.forEach((list, i) => paintTips(i, list));

  renderCreditBadge($('plan-credits'));
  refreshFoot();
}

/* The line under each box. Advice, never a gate — the sheet is where the
   rules are enforced, and saying no twice in two places is nagging. */
function refreshMeta(i) {
  const el = document.querySelector(`.org-meta[data-meta="${i}"]`);
  if (!el) return;
  const value = boxes[i] || '';
  const n = wordCount(value);

  if (!n) {
    el.className = 'org-meta';
    el.textContent = 'Empty';
    return;
  }

  const notes = [];
  const paras = paraCount(value);
  if (paras > 1) notes.push(`${paras} paragraphs`);

  const short = splitSentences(value).filter((s) => wordCount(s) < MIN_SENTENCE_WORDS).length;
  if (short) notes.push(`${short} sentence${short === 1 ? '' : 's'} under ${MIN_SENTENCE_WORDS} words`);

  el.className = `org-meta${short ? ' is-bad' : ' is-ok'}`;
  el.textContent = `${n} words${notes.length ? ` · ${notes.join(' · ')}` : ''}`;
}

/* The foot is the SHEET's own verdict, not a second opinion: it runs the same
   checkDraft the sheet runs, on the same assembled text, so nobody is told
   "all four covered" here and "two rules to go" one screen later. */
function refreshFoot() {
  const meta = $('plan-foot-meta');
  const list = $('plan-foot-rules');
  if (!meta || !list) return;

  const text = assemblePlan();
  const { filled, total } = plannerProgress();
  const result = checkDraft(text);

  const missing = total - filled;
  meta.textContent = missing
    ? `${filled} of ${total} boxes filled — ${missing} still to do.`
    : `All ${total} boxes filled · ${result.words} words · ${result.paragraphs} paragraphs.`;
  meta.className = missing ? 'org-foot__meta' : 'org-foot__meta is-ok';

  list.innerHTML = result.rows.map((r) => `
    <li class="plan-rule${r.exempt ? ' is-exempt' : r.ok ? ' is-ok' : ''}">
      ${safe(r.label)}${r.detail && !r.ok ? ` — <em>${safe(r.detail)}</em>` : ''}
    </li>`).join('');
}

/* ── Suggestions ───────────────────────────────────────
   Groq, because the student is mid-paragraph and a slow answer is no answer
   (js/api.js suggestForMove). Fetched on CLICK rather than on the hover that
   reveals the button: a panel of four boxes would otherwise fire four billed
   calls as the mouse crossed them on its way to the scrollbar. */
async function loadTips(i) {
  if (pending.has(i)) return;
  const box = document.querySelector(`.plan-tips[data-tips="${i}"]`);
  const btn = document.querySelector(`.plan-tipbtn[data-tip="${i}"]`);
  if (!box) return;

  // Already have them? Second press folds them away again — and re-opening
  // what has already been paid for must never be charged twice.
  if (tips.has(i) && !box.hidden) { box.hidden = true; btn?.classList.remove('is-on'); return; }
  if (tips.has(i)) { paintTips(i, tips.get(i)); return; }

  if (!canAfford('ideas')) {
    box.hidden = false;
    box.innerHTML = '<p class="plan-tips__wait is-bad">No suggestion credits left — and that costs you nothing in marks. Keep writing.</p>';
    return;
  }

  pending.add(i);
  btn?.classList.add('is-on');
  box.hidden = false;
  box.innerHTML = '<p class="plan-tips__wait">Thinking of three things you could add…</p>';

  // Reserved before the call (js/credits.js) so two clicks cannot both pass
  // the affordability check on a slow connection.
  const paid = await spend('ideas');
  if (!paid.ok) {
    pending.delete(i);
    box.innerHTML = `<p class="plan-tips__wait is-bad">${
      paid.out ? 'That was the last of your suggestion credits — it costs you nothing in marks.'
      : paid.signedOut ? 'Sign in to use suggestions.'
      : 'Could not reach the suggester just then.'}</p>`;
    return;
  }

  const list = await suggestForMove(currentWritingType, i, {
    topic: currentTopic,
    draft: boxes[i] || '',
  });
  pending.delete(i);

  if (!list.length) {
    box.innerHTML = '<p class="plan-tips__wait is-bad">No suggestions just now — try again in a moment.</p>';
    return;
  }
  tips.set(i, list);
  paintTips(i, list);
}

function paintTips(i, list) {
  const box = document.querySelector(`.plan-tips[data-tips="${i}"]`);
  const btn = document.querySelector(`.plan-tipbtn[data-tip="${i}"]`);
  if (!box || !list?.length) return;
  box.hidden = false;
  btn?.classList.add('is-on');
  box.innerHTML = `
    <p class="plan-tips__hdr">Things you could add — answer them in your own words</p>
    <ul class="plan-tips__list">${list.map((t) => `<li>${safe(t)}</li>`).join('')}</ul>
    <p class="plan-tips__foot">These are questions, not sentences. Nothing here is meant to be copied.</p>`;
}
