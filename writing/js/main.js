/* ═══════════════════════════════════════════════════════
   PREPBOT — MAIN ENTRY POINT
═══════════════════════════════════════════════════════ */

import { $, setCommentCounter, resetCommentStore } from './config.js';
import { gradeEssay } from './api.js';
import { initPopover, setupPopoverListeners } from './popover.js';
import { initRender, renderResults, clearResultsAccordions, resetParagraphState } from './render.js';
import {
  initTypePicker, initColorKeyAccordion, syncTopicDisplay,
  openWritingModal, closeWritingModal, showPhase, injectRewriteStyles
} from './ui.js';

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

// ── Word Count ─────────────────────────────────────────
elTextarea.addEventListener('input', () => {
  const words = elTextarea.value.trim() ? elTextarea.value.trim().split(/\s+/).length : 0;
  elWordCount.textContent = words;
  elSubmitBtn.disabled = words < 20;
});

// ── Submit ─────────────────────────────────────────────
elSubmitBtn.addEventListener('click', async () => {
  const userText = elTextarea.value.trim();
  if (!userText) return;

  elLoading.classList.add('active');

  try {
    const data = await gradeEssay(userText);
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
  showPhase('write');
  elTextarea.value = '';
  elWordCount.textContent = '0';
  elSubmitBtn.disabled = true;

  setCommentCounter(0);
  resetCommentStore();

  document.getElementById('para-nav')?.remove();
  document.getElementById('rewrite-info-btn')?.remove();
  document.getElementById('rewrite-info-note')?.remove();

  resetParagraphState();
  clearResultsAccordions();

  syncTopicDisplay();

  $('modal-body')?.scrollTo({ top: 0, behavior: 'smooth' });
  elTextarea.focus();
});

// ── Begin Writing (landing → modal) ────────────────────
$('begin-writing-btn')?.addEventListener('click', () => openWritingModal());

// ── Change Topic (modal → landing) ─────────────────────
$('new-topic-btn')?.addEventListener('click', () => closeWritingModal());
$('new-topic-results-btn')?.addEventListener('click', () => closeWritingModal());

// ── Modal Close ────────────────────────────────────────
$('modal-close')?.addEventListener('click', () => closeWritingModal());
elModal?.addEventListener('click', e => {
  if (e.target === elModal && elEditorSec.style.display !== 'none') closeWritingModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && elModal?.classList.contains('open')) closeWritingModal();
});

// ── Init ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  injectRewriteStyles();
  initColorKeyAccordion(elResultsSec);
  initTypePicker();
});
