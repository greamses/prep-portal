/* ═══════════════════════════════════════════════════════
   PREPBOT — MAIN ENTRY POINT
═══════════════════════════════════════════════════════ */

import { $, setCommentCounter, resetCommentStore } from './config.js';
import { gradeEssay } from './api.js';
import { initPopover, setupPopoverListeners } from './popover.js';
import { initRender, renderResults, clearResultsAccordions, resetParagraphState } from './render.js';
import {
  initSetup, initColorKeyAccordion, syncTopicDisplay,
  openWritingModal, closeWritingModal, showPhase, injectRewriteStyles,
  loadLessonVideo
} from './ui.js';
import {
  isSummaryMode, buildOrganizer, buildSheetAids, assembleParagraph,
  getPlan, organizerProgress, resetOrganizer
} from './summary.js';
import { checkDraft, renderRules, lockWriting } from './rules.js';

// ── DOM Refs ───────────────────────────────────────────
const elTextarea = $('writing-area');
const elWordCount = $('word-count');
const elSubmitBtn = $('submit-btn');
const elEditorSec = $('editor-section');
const elResultsSec = $('results-section');
const elLoading = $('loading-overlay');
const elRubric = $('rubric-content');
const elAnnotated = $('annotated-text');
const elStamp = $('score-stamp');
const elRetryBtn = $('retry-btn');
const elPopover = $('mark-popover');
const elModal = $('modal');

// ── Comment Popover ────────────────────────────────────
const elCommentPop = document.createElement('div');
elCommentPop.id = 'comment-popover';
document.body.appendChild(elCommentPop);

// ── Init Modules ───────────────────────────────────────
initRender(elRubric, elAnnotated, elStamp, elLoading, elEditorSec, elResultsSec);
initPopover(elPopover, elCommentPop, elAnnotated);
setupPopoverListeners();

/* ── The gate ───────────────────────────────────────────
   Words, paragraphs and sentences (js/rules.js). The old gate was "twenty
   words and you may submit", which let a student spend a marking on three
   lines; the checklist under the sheet now says exactly what is still missing
   and Submit stays disabled until none of it is. The sheet is also locked
   against the clipboard — nothing pasted in, nothing copied out. */
const elRules = $('write-rules');
const elGate = $('rules-gate');

function syncRules() {
  const result = checkDraft(elTextarea.value, { summary: isSummaryMode() });
  elWordCount.textContent = result.words;
  renderRules(elRules, result);
  if (elGate) {
    elGate.textContent = result.ok ? 'Rules met'
      : result.empty ? 'Nothing written yet'
      : `${result.broken} rule${result.broken === 1 ? '' : 's'} to go`;
    elGate.classList.toggle('is-open', result.ok);
  }
  elSubmitBtn.disabled = !result.ok;
  return result;
}

elTextarea.addEventListener('input', syncRules);
lockWriting(elTextarea);

/* ═══════════════════════════════════════════════════════
   SUMMARY — the organiser step (js/summary.js)

   The boxes are only ever poured onto the sheet by an explicit press of the
   assemble button, which is what makes going back to the organiser safe: a
   draft the student has since edited by hand is never silently overwritten,
   and when one exists the button says "Rebuild" and offers the way back that
   keeps it instead.
   ═══════════════════════════════════════════════════════ */
let lastAssembled = '';

const draftIsEdited = () => {
  const draft = elTextarea.value.trim();
  return !!draft && draft !== lastAssembled.trim();
};

function syncOrganizeFooter() {
  const btn = $('to-paragraph-btn');
  const label = $('to-paragraph-label');
  const tally = $('organize-tally');
  const keepBtn = $('keep-paragraph-btn');
  const { filled, total, complete } = organizerProgress();
  const edited = draftIsEdited();

  if (btn) {
    btn.disabled = !complete;
    // The warning lives on the button rather than in the tally: three notes and
    // a sentence do not fit on one footer row, and the pair of buttons already
    // says what the choice is.
    btn.title = edited
      ? 'Replaces the paragraph on your sheet with a fresh build from these boxes'
      : '';
  }
  if (label) label.textContent = edited ? 'Rebuild the paragraph →' : 'Turn into a paragraph →';
  if (keepBtn) keepBtn.style.display = edited ? '' : 'none';
  if (tally) {
    tally.textContent = complete
      ? `All ${total} paragraphs covered`
      : `${filled} of ${total} paragraphs covered`;
    tally.classList.toggle('is-open', complete && !edited);
  }
}

function openOrganizer() {
  buildOrganizer({ onChange: syncOrganizeFooter });
  syncOrganizeFooter();
  showPhase('organize');
}

function openSheet({ rebuild }) {
  if (rebuild) {
    lastAssembled = assembleParagraph();
    elTextarea.value = lastAssembled;
    elTextarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  buildSheetAids();
  const back = $('back-to-organizer-btn');
  if (back) back.style.display = '';
  syncRules();
  showPhase('write');
  setTimeout(() => elTextarea.focus(), 120);
}

$('to-paragraph-btn')?.addEventListener('click', () => openSheet({ rebuild: true }));
$('keep-paragraph-btn')?.addEventListener('click', () => openSheet({ rebuild: false }));
$('back-to-organizer-btn')?.addEventListener('click', () => openOrganizer());
$('organize-topic-btn')?.addEventListener('click', () => closeWritingModal());

// ── Submit ─────────────────────────────────────────────
elSubmitBtn.addEventListener('click', async () => {
  const userText = elTextarea.value.trim();
  if (!userText) return;
  // The button is disabled while a rule is unmet, so this only catches the
  // paths that bypass it — but a marking is expensive and the check is free.
  if (!syncRules().ok) { elRules?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }

  elLoading.classList.add('active');

  try {
    // The plan is only sent for a summary, and only as a coverage check — the
    // paragraph is still what gets marked (js/api.js).
    const data = await gradeEssay(userText, isSummaryMode() ? { plan: getPlan() } : {});
    renderResults(data, userText);
    showPhase('results');
  } catch (err) {
    console.error("Grading failed:", err);
    alert(err.message.includes('API Error') ?
      "API Connection Error: We've hit a rate limit or key error. Wait a moment and try again." :
      "Grading error — the AI returned unexpected data. Please try again.");
    elLoading.classList.remove('active');
  }
});

// ── Retry ──────────────────────────────────────────────
elRetryBtn?.addEventListener('click', () => {
  elTextarea.value = '';
  syncRules();
  lastAssembled = '';

  // A second attempt at a summary starts where the thinking was done — the
  // organiser, with the sentences they already worked out still in it.
  if (isSummaryMode()) openOrganizer(); else showPhase('write');

  setCommentCounter(0);
  resetCommentStore();

  document.getElementById('para-nav')?.remove();
  document.getElementById('rewrite-info-btn')?.remove();
  document.getElementById('rewrite-info-note')?.remove();

  resetParagraphState();
  clearResultsAccordions();

  syncTopicDisplay();

  $('modal-body')?.scrollTo({ top: 0, behavior: 'smooth' });
  if (!isSummaryMode()) elTextarea.focus();
});

// ── Landing → the lesson, and only then the sheet ──────
$('begin-writing-btn')?.addEventListener('click', () => openWritingModal());
$('lesson-video-btn')?.addEventListener('click', () => loadLessonVideo());
// A summary is planned before it is written, so the lesson opens the organiser
// rather than a blank sheet; every other form goes straight to the paper.
$('start-writing-btn')?.addEventListener('click', () => {
  if (isSummaryMode()) { openOrganizer(); return; }
  syncRules();
  showPhase('write');
  setTimeout(() => elTextarea.focus(), 120);
});

// ── Change Topic (modal → landing) ─────────────────────
$('new-topic-btn')?.addEventListener('click', () => closeWritingModal());
$('new-topic-results-btn')?.addEventListener('click', () => closeWritingModal());

// ── Modal Close ────────────────────────────────────────
$('modal-close')?.addEventListener('click', () => closeWritingModal());
// Click-outside closes while learning or writing, but never on the results —
// a stray click must not throw away marking the student just waited for.
elModal?.addEventListener('click', e => {
  if (e.target === elModal && !elResultsSec.classList.contains('active')) closeWritingModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && elModal?.classList.contains('open')) closeWritingModal();
});

// ── Init ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  injectRewriteStyles();
  initColorKeyAccordion(elResultsSec);
  syncRules();
  // A new passage (or a form that has none) invalidates the boxes — the
  // organiser would otherwise offer sentences written about something else,
  // and the sheet would still be carrying the paragraph they assembled from
  // them. Only an UNEDITED assembly is cleared: anything the student has since
  // typed themselves is theirs, and a new prompt is not a reason to bin it.
  initSetup({
    onGenerated: () => {
      if (lastAssembled && elTextarea.value.trim() === lastAssembled.trim()) {
        elTextarea.value = '';
        elTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      resetOrganizer();
      lastAssembled = '';
      buildSheetAids();
      const back = $('back-to-organizer-btn');
      if (back) back.style.display = 'none';
    },
  });
});
