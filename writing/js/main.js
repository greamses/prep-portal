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
import { checkDraft, renderRules, lockWriting, justClosedSentence, say } from './rules.js';
import {
  hasPlanner, buildPlanner, assemblePlan, plannerProgress, resetPlanner
} from './planner.js';
import { attachImprove } from './improve.js';
import { loadCredits, renderCreditBadge } from './credits.js';

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

/* The short-sentence rule is told to the student the moment they close a
   sentence, not at the end when it is eleven sentences and a rewrite. Only on
   GROWTH — deleting back past a full stop is not somebody finishing one — and
   only when the sentence is actually short, which is rare enough that this is
   silent nearly every keystroke. */
let lastLen = 0;
elTextarea.addEventListener('input', () => {
  const grew = elTextarea.value.length > lastLen;
  lastLen = elTextarea.value.length;
  syncRules();
  const short = justClosedSentence(elTextarea.value, { grew });
  if (short) {
    // Pointed AT the sentence, not written in a panel underneath it.
    say(
      `${short.words} word${short.words === 1 ? '' : 's'} — a sentence needs ${short.need}. Say more, or join it to the one before.`,
      { el: elTextarea, start: short.start, end: short.end },
    );
  }
});
lockWriting(elTextarea);
// Highlight a word or a sentence on the sheet and be offered better ones
// (js/improve.js). Spends writing credits; never touches the marking.
attachImprove(elTextarea);

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

const openSheet = ({ rebuild }) => toSheet({ rebuild, text: assembleParagraph() });

$('to-paragraph-btn')?.addEventListener('click', () => openSheet({ rebuild: true }));
$('keep-paragraph-btn')?.addEventListener('click', () => openSheet({ rebuild: false }));
$('organize-topic-btn')?.addEventListener('click', () => closeWritingModal());

/* ═══════════════════════════════════════════════════════
   THE PLAN — the mnemonic planner (js/planner.js)

   Same contract as the summary organiser above, and deliberately the same
   code shape: the boxes are only ever poured onto the sheet by an explicit
   press, so coming back to the plan can never overwrite a draft the student
   has since edited by hand. The one difference is that this step may always
   be skipped — see the header of planner.js for why a summary's organiser
   cannot be.
   ═══════════════════════════════════════════════════════ */
function syncPlanFooter() {
  const btn = $('plan-to-sheet-btn');
  const label = $('plan-to-sheet-label');
  const tally = $('plan-tally');
  const keepBtn = $('plan-keep-btn');
  const skipBtn = $('plan-skip-btn');
  const { filled, total, complete } = plannerProgress();
  const edited = draftIsEdited();

  if (btn) {
    btn.disabled = !filled;
    btn.title = edited
      ? 'Replaces what is on your sheet with a fresh build from these boxes'
      : '';
  }
  if (label) label.textContent = edited ? 'Rebuild the sheet →' : 'Put it on the sheet →';
  if (keepBtn) keepBtn.style.display = edited ? '' : 'none';
  // Once anything is on the sheet, "straight to the sheet" is the same door as
  // "keep my draft" and two of them is one too many.
  if (skipBtn) skipBtn.style.display = edited ? 'none' : '';
  if (tally) {
    tally.textContent = complete
      ? `All ${total} boxes filled`
      : `${filled} of ${total} boxes filled`;
    tally.classList.toggle('is-open', complete && !edited);
  }
}

function openPlanner() {
  buildPlanner({ onChange: syncPlanFooter });
  syncPlanFooter();
  showPhase('plan');
}

/* The one door from a planning step onto the sheet, whichever step it was.
   Both organisers assemble into the same textarea and everything downstream
   is identical, so the only thing that differs is which one built the text
   and which one the back button returns to. */
function toSheet({ rebuild, text }) {
  if (rebuild) {
    lastAssembled = text;
    elTextarea.value = lastAssembled;
    elTextarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  buildSheetAids();
  const back = $('back-to-organizer-btn');
  if (back) { back.style.display = ''; back.textContent = isSummaryMode() ? '← Back to the Organiser' : '← Back to the Plan'; }
  syncRules();
  showPhase('write');
  setTimeout(() => elTextarea.focus(), 120);
}

$('plan-to-sheet-btn')?.addEventListener('click', () => toSheet({ rebuild: true, text: assemblePlan() }));
$('plan-keep-btn')?.addEventListener('click', () => toSheet({ rebuild: false }));
$('plan-skip-btn')?.addEventListener('click', () => toSheet({ rebuild: false }));

// One back button, two planning steps.
$('back-to-organizer-btn')?.addEventListener('click', () => {
  if (isSummaryMode()) openOrganizer(); else openPlanner();
});

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

  // A second attempt starts where the thinking was done — the planning step,
  // with everything they already worked out still in it.
  if (isSummaryMode()) openOrganizer();
  else if (hasPlanner()) openPlanner();
  else showPhase('write');

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
// One video, three doors — Learn, the organiser and the plan. The panel moves
// to whichever phase asked for it (js/ui.js homeTheVideo).
['lesson-video-btn', 'organize-video-btn', 'plan-video-btn']
  .forEach((id) => $(id)?.addEventListener('click', () => loadLessonVideo()));
// A summary is planned before it is written, so the lesson opens the organiser
// rather than a blank sheet; every other form goes straight to the paper.
function startPlanning() {
  if (isSummaryMode()) { openOrganizer(); return; }
  // Every form with a mnemonic gets planned before it is written; a task the
  // student brought themselves has no form and so no plan, and goes straight
  // to the paper as it always did.
  if (hasPlanner()) { openPlanner(); return; }
  syncRules();
  showPhase('write');
  setTimeout(() => elTextarea.focus(), 120);
}
$('start-writing-btn')?.addEventListener('click', startPlanning);

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
  // The suggestion budget (js/credits.js). Read once; the badge follows it.
  renderCreditBadge($('write-credits'));
  loadCredits();
  // A new passage (or a form that has none) invalidates the boxes — the
  // organiser would otherwise offer sentences written about something else,
  // and the sheet would still be carrying the paragraph they assembled from
  // them. Only an UNEDITED assembly is cleared: anything the student has since
  // typed themselves is theirs, and a new prompt is not a reason to bin it.
  initSetup({
    /* A task followed from a short link (/w/<code>) opens itself, on the
       planning sheet, with the video button beside it. Nobody sent a class a
       link so that thirty students could each answer three setup questions
       whose answers were decided by the person who sent it.

       openWritingModal() first, because it is what renders the lesson behind
       this phase and puts the modal in a state the Back buttons can return
       to — the phase it lands on is then immediately swapped. */
    onDeepLink: () => {
      openWritingModal();
      startPlanning();
    },
    onGenerated: () => {
      if (lastAssembled && elTextarea.value.trim() === lastAssembled.trim()) {
        elTextarea.value = '';
        elTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      resetOrganizer();
      resetPlanner();
      lastAssembled = '';
      buildSheetAids();
      const back = $('back-to-organizer-btn');
      if (back) back.style.display = 'none';
    },
  });
});
