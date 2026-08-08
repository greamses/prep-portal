/* ═══════════════════════════════════════════════════════
   PREPBOT — RENDER LAYER
═══════════════════════════════════════════════════════ */

import {
  ERROR_TYPES, safe,
  commentCounter, setCommentCounter, commentStore, resetCommentStore
} from './config.js';
import { attachAnnotationListeners, showComment } from './popover.js';
import { makeAccordion } from './ui.js';
import { isSummaryMode } from './summary.js';

/* ── A summary is scored on grammar and mechanics ALONE ──
   Its other three categories are commented on and deliberately not marked, so
   the number comes straight off the red pen: 100, less the losses on the
   grammatical/mechanical marks actually made. Computed here rather than taken
   on trust from the model, because "add up your own deductions" is exactly the
   arithmetic a language model is worst at — and a rubric that quietly capped
   every summary in the seventies is what sent us looking.

   `lift` is the one mark that never costs anything: carrying six words out of
   the passage is a summary-craft failure, not a mechanical error. It is still
   marked, still explained, just not charged for. */
const UNCHARGED_MARKS = new Set(['lift']);

export function grammarScoreFrom(annotatedText) {
  let deducted = 0;
  let counted = 0;
  // Attribute order varies (fix= may precede loss=), so scan opening tags and
  // pull each attribute out on its own rather than assuming a fixed shape.
  for (const tag of String(annotatedText || '').match(/<mark\b[^>]*>/gi) || []) {
    const type = (tag.match(/type=['"]([^'"]+)['"]/i) || [])[1] || '';
    const loss = parseInt((tag.match(/loss=['"]\s*(-?\d+)/i) || [])[1] || '0', 10);
    if (!loss || UNCHARGED_MARKS.has(type)) continue;
    deducted += Math.abs(loss);
    counted += 1;
  }
  return { score: Math.max(0, Math.min(100, 100 - deducted)), deducted, counted };
}

// Module state
let paragraphChunks = [];
let currentParagraphIdx = 0;
let paraNavShowAll = false;

// DOM refs
let elRubric = null;
let elAnnotated = null;
let elStamp = null;
let elLoading = null;
let elEditorSec = null;
let elResultsSec = null;

// ── Init ───────────────────────────────────────────────
export function initRender(rubric, annotated, stamp, loading, editorSec, resultsSec) {
  elRubric = rubric;
  elAnnotated = annotated;
  elStamp = stamp;
  elLoading = loading;
  elEditorSec = editorSec;
  elResultsSec = resultsSec;
}

// ── Parse Annotated HTML ───────────────────────────────
function parseAnnotatedHtml(raw) {
  let html = raw
    .replace(/\\n\\n/g, '\n\n')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
  
  html = html.replace(
    /<mark\s+type=['"]([^'"]+)['"]\s*(?:fix=['"]([^'"]*?)['"])?\s*(?:loss=['"]([^'"]*?)['"])?>([\s\S]*?)<\/mark>/gi,
    (_, type, fix, loss, content) => {
      const fixAttr = fix ? ` data-fix="${safe(fix)}"` : '';
      const lossAttr = loss ? ` data-loss="${safe(loss)}"` : '';
      const deduction = loss ? `<span class="deduction">${safe(loss)}</span>` : '';
      const label = (ERROR_TYPES[type] || { name: type }).name;
      return `<span class="doodle doodle-${safe(type)}"${fixAttr}${lossAttr} tabindex="0" role="button" aria-label="${label}: click for options">${content}${deduction}</span>`;
    }
  );
  
  html = html.replace(/<hl\s+cat=['"]([^'"]+)['"]>([\s\S]*?)<\/hl>/gi,
    (_, cat, content) => `<span class="hl-${safe(cat)}">${content}</span>`);
  
  html = html.replace(/<good\s+reason=['"]([^'"]+)['"]>([\s\S]*?)<\/good>/gi,
    (_, reason, content) => `<span class="hl-good" title="${safe(reason)}">${content}</span>`);
  
  html = html.replace(/<comment\s+text=['"]([^'"]+)['"]>([\s\S]*?)<\/comment>/gi,
    (_, text) => {
      const id = ++commentCounter;
      setCommentCounter(commentCounter);
      commentStore[id] = text;
      return `<button class="margin-comment-marker" data-cid="${id}">${id}</button>`;
    });
  
  html = html.replace(/<sub\s+opts=['"]([^'"]+)['"]>([^<]+)<\/sub>/gi,
    (_, opts, word) => `<span class="sub-word" data-opts="${safe(opts)}" data-type="word">${word}</span>`);
  
  html = html.replace(/<sent\s+opts=['"]([^'"]+)['"]>([\s\S]*?)<\/sent>/gi,
    (_, opts, sentence) => `<span class="sent-sub" data-opts="${safe(opts)}" data-type="sent">${sentence}</span>`);
  
  return html;
}

// ── Paragraph Navigation ───────────────────────────────
function buildParagraphNav() {
  document.getElementById('para-nav')?.remove();
  if (paragraphChunks.length <= 1) return;
  
  const nav = document.createElement('div');
  nav.id = 'para-nav';
  nav.innerHTML = `
    <button class="para-nav-btn" id="para-prev" ${currentParagraphIdx === 0 ? 'disabled' : ''}>← Prev</button>
    <span id="para-nav-label">Paragraph ${currentParagraphIdx + 1} of ${paragraphChunks.length}</span>
    <button class="para-nav-btn" id="para-next" ${currentParagraphIdx === paragraphChunks.length - 1 ? 'disabled' : ''}>Next →</button>
    <button class="para-nav-btn show-all" id="para-showall">${paraNavShowAll ? 'Collapse' : 'Show All'}</button>`;
  
  const paper = elAnnotated.closest('.annotated-paper') || elAnnotated.parentNode;
  paper.parentNode.insertBefore(nav, paper);
  
  document.getElementById('para-prev').addEventListener('click', () => {
    if (currentParagraphIdx > 0) showParagraph(currentParagraphIdx - 1);
  });
  
  document.getElementById('para-next').addEventListener('click', () => {
    if (currentParagraphIdx < paragraphChunks.length - 1) showParagraph(currentParagraphIdx + 1);
  });
  
  document.getElementById('para-showall').addEventListener('click', () => {
    paraNavShowAll = !paraNavShowAll;
    if (paraNavShowAll) {
      elAnnotated.innerHTML = paragraphChunks.join('<br><br>');
      attachAnnotationListeners(elAnnotated);
    } else {
      showParagraph(currentParagraphIdx);
    }
    buildParagraphNav();
  });
}

function showParagraph(index) {
  currentParagraphIdx = index;
  paraNavShowAll = false;
  elAnnotated.innerHTML = paragraphChunks[index];
  attachAnnotationListeners(elAnnotated);
  buildParagraphNav();
  elAnnotated.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Clear Results ──────────────────────────────────────
export function clearResultsAccordions() {
  document.getElementById('acc-suggestions')?.remove();
  document.getElementById('acc-studytips')?.remove();
}

export function resetParagraphState() {
  paragraphChunks = [];
  currentParagraphIdx = 0;
  paraNavShowAll = false;
}

// ── Rewrite Stamp ──────────────────────────────────────
function showRewriteStamp(reason) {
  elRubric.innerHTML = '';
  elAnnotated.innerHTML = '';
  clearResultsAccordions();
  document.getElementById('para-nav')?.remove();
  
  elStamp.textContent = 'REWRITE';
  elStamp.className = 'score-stamp rewrite-stamp';
  
  document.getElementById('rewrite-info-btn')?.remove();
  document.getElementById('rewrite-info-note')?.remove();
  
  const infoBtn = document.createElement('button');
  infoBtn.id = 'rewrite-info-btn';
  infoBtn.textContent = 'i';
  infoBtn.setAttribute('aria-label', 'Why REWRITE?');
  infoBtn.title = 'Tap to see why';
  
  const infoNote = document.createElement('div');
  infoNote.id = 'rewrite-info-note';
  infoNote.textContent = reason || 'Your essay does not address the given writing prompt.';
  infoNote.hidden = true;
  
  infoBtn.addEventListener('click', e => {
    e.stopPropagation();
    infoNote.hidden = !infoNote.hidden;
  });
  
  const stampParent = elStamp.parentNode;
  stampParent.appendChild(infoBtn);
  stampParent.appendChild(infoNote);
}

// ── Suggestions Panel ──────────────────────────────────
function renderSuggestions(suggestions) {
  let container = document.getElementById('results-accordions');
  if (!container) {
    container = document.createElement('div');
    container.id = 'results-accordions';
    const anchor = document.querySelector('.paper-scroll-wrap') || elAnnotated.parentNode;
    anchor.parentNode.insertBefore(container, anchor.nextSibling);
  }
  
  document.getElementById('acc-suggestions')?.remove();
  if (!suggestions.length) return;
  
  const bodyHtml = `
    <div class="sugg-list">
      ${suggestions.map((s, i) => `
        <div class="suggestion-item" style="animation-delay:${(i * 0.07).toFixed(2)}s">
          <div class="suggestion-num">${i + 1}</div>
          <div class="suggestion-text">${safe(s)}</div>
        </div>`).join('')}
    </div>`;
  
  container.appendChild(makeAccordion({
    id: 'suggestions', title: "Examiner's Suggestions", bodyHtml,
    startOpen: true, extraClass: 'sugg-acc', count: suggestions.length
  }));
}

// ── Study Tips Panel ───────────────────────────────────
function renderStudyTips(tips) {
  let container = document.getElementById('results-accordions');
  if (!container) {
    container = document.createElement('div');
    container.id = 'results-accordions';
    elResultsSec.appendChild(container);
  }
  
  document.getElementById('acc-studytips')?.remove();
  if (!tips.length) return;
  
  const bodyHtml = `
    <div class="tips-body-grid">
      ${tips.map((t, i) => `
        <div class="study-tip-card" style="animation-delay:${(i * 0.08).toFixed(2)}s">
          <div class="study-tip-title">${safe(t.title || '')}</div>
          <div class="study-tip-text">${safe(t.tip || '')}</div>
        </div>`).join('')}
    </div>`;
  
  container.appendChild(makeAccordion({
    id: 'studytips', title: 'Study Tips For You', bodyHtml,
    startOpen: false, extraClass: 'tips-acc'
  }));
}

// ── Main Render ────────────────────────────────────────
export function renderResults(data, originalText) {
  if (data.offTopic) {
    showRewriteStamp(data.offTopicReason || '');
    elLoading.classList.remove('active');
    elEditorSec.style.display = 'none';
    elResultsSec.classList.add('active');
    return;
  }
  
  document.getElementById('rewrite-info-btn')?.remove();
  document.getElementById('rewrite-info-note')?.remove();
  
  const summaryMode = isSummaryMode();
  const marks = summaryMode ? grammarScoreFrom(data.annotatedText) : null;

  const score = summaryMode
    ? marks.score
    : Math.min(100, Math.max(0, data.totalScore || 0));
  elStamp.textContent = `${score}%`;
  elStamp.className = `score-stamp${score < 55 ? ' fail' : score < 70 ? ' avg' : ''}`;

  // In summary mode the marked category is re-stated from what the pen actually
  // found, so the number on the stamp and the number in the rubric can never
  // disagree, and the feedback says where it went.
  const rubric = (data.rubric || []).map((item) => {
    if (!summaryMode || item.outOf !== 100) return item;
    const detail = marks.counted
      ? `${marks.counted} grammatical or mechanical error${marks.counted === 1 ? '' : 's'} marked, costing ${marks.deducted}.`
      : 'No grammatical or mechanical errors found.';
    return { ...item, score: marks.score, feedback: `${detail} ${item.feedback || ''}`.trim() };
  });

  elRubric.innerHTML = '';
  const frag = document.createDocumentFragment();
  rubric.forEach((item, i) => {
    const row = document.createElement('div');
    row.style.animationDelay = `${i * 0.06}s`;

    // outOf 0 = commented on, not marked (every summary category except grammar).
    // It gets no score, no bar and says so, rather than showing a bogus "0 / 0".
    if (!item.outOf) {
      row.className = 'rubric-row rubric-row--note';
      row.innerHTML = `
        <div class="rubric-cat">${safe(item.category)}</div>
        <div class="rubric-score rubric-score--note">not marked</div>
        <p class="rubric-fb">${safe(item.feedback)}</p>`;
      frag.appendChild(row);
      return;
    }

    const pct = Math.round((item.score / item.outOf) * 100);
    const col = pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
    row.className = 'rubric-row';
    row.innerHTML = `
      <div class="rubric-cat">${safe(item.category)}</div>
      <div class="rubric-score" style="color:${col}">${item.score} / ${item.outOf}</div>
      <p class="rubric-fb">${safe(item.feedback)}</p>
      <div class="rubric-bar-track">
        <div class="rubric-bar-fill" data-pct="${pct}" style="background:${col}"></div>
      </div>`;
    frag.appendChild(row);
  });
  elRubric.appendChild(frag);
  
  requestAnimationFrame(() => requestAnimationFrame(() => {
    elRubric.querySelectorAll('.rubric-bar-fill').forEach(bar => bar.style.width = bar.dataset.pct + '%');
  }));
  
  setCommentCounter(0);
  resetCommentStore();
  
  const annotatedHtml = parseAnnotatedHtml(data.annotatedText || originalText);
  paragraphChunks = annotatedHtml.split('<br><br>').filter(p => p.trim());
  currentParagraphIdx = 0;
  paraNavShowAll = false;
  
  document.getElementById('para-nav')?.remove();
  
  if (paragraphChunks.length > 1) {
    elAnnotated.innerHTML = paragraphChunks[0];
    attachAnnotationListeners(elAnnotated);
    buildParagraphNav();
  } else {
    elAnnotated.innerHTML = annotatedHtml;
    attachAnnotationListeners(elAnnotated);
  }
  
  renderSuggestions(data.suggestions || []);
  renderStudyTips(data.studyTips || []);
  
  elLoading.classList.remove('active');
  elEditorSec.style.display = 'none';
  elResultsSec.classList.add('active');
}