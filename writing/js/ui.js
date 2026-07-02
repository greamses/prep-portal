/* ═══════════════════════════════════════════════════════
   PREPBOT — UI UTILITIES
═══════════════════════════════════════════════════════ */

import { $, currentTopic, currentWritingType } from './config.js';
import { fetchGeneratedTopic } from './api.js';

// ── Accordion Factory ──────────────────────────────────
export function makeAccordion({ id, title, bodyHtml, startOpen = false, extraClass = '', count = null }) {
  const panel = document.createElement('div');
  panel.className = `acc-panel${extraClass ? ' ' + extraClass : ''}`;
  panel.id = `acc-${id}`;

  const countSpan = count !== null ? ` <span class="acc-count">(${count})</span>` : '';

  panel.innerHTML = `
    <button class="acc-header">
      <span class="acc-header-label">${title}${countSpan}</span>
      <svg class="acc-chevron${startOpen ? ' open' : ''}" viewBox="0 0 24 24">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <div class="acc-body" id="acc-body-${id}" style="${startOpen ? '' : 'display:none'}">
      ${bodyHtml}
    </div>`;

  panel.querySelector('.acc-header').addEventListener('click', function() {
    const body = document.getElementById(`acc-body-${id}`);
    const opening = body.style.display === 'none';
    body.style.display = opening ? '' : 'none';
    this.querySelector('.acc-chevron').classList.toggle('open', opening);
  });

  return panel;
}

// ── Color Key HTML ─────────────────────────────────────
function buildColorKeyHtml() {
  const marks = [
    { code: 'del', name: 'Delete Word', color: '#dc2626', loss: '-2' },
    { code: 'ins', name: 'Insert Missing Word', color: '#16a34a', loss: '-2' },
    { code: 'cap', name: 'Capitalise', color: '#ea580c', loss: '-2' },
    { code: 'lc', name: 'Make Lowercase', color: '#0284c7', loss: '-2' },
    { code: 'trans', name: 'Transpose / Swap', color: '#7c3aed', loss: '-2' },
    { code: 'para', name: 'New Paragraph', color: '#0a0a0a', loss: '-2' },
    { code: 'spell', name: 'Spell Out Abbreviation', color: '#666', loss: '-1' },
    { code: 'sp', name: 'Misspelling', color: '#dc2626', loss: '-2' },
    { code: 'run', name: 'Run-on Sentence', color: '#b91c1c', loss: '-3' },
    { code: 'frag', name: 'Sentence Fragment', color: '#dc2626', loss: '-3' },
    { code: 'punct', name: 'Wrong Punctuation', color: '#dc2626', loss: '-2' },
    { code: 'ww', name: 'Wrong Word', color: '#dc2626', loss: '-2' },
    { code: 'agr', name: 'Subject-Verb Agreement', color: '#ea580c', loss: '-3' },
    { code: 'vt', name: 'Wrong Verb Tense', color: '#7c3aed', loss: '-2' },
    { code: 'art', name: 'Article Error', color: '#0284c7', loss: '-2' },
    { code: 'prep', name: 'Wrong Preposition', color: '#db2777', loss: '-2' },
    { code: 'rep', name: 'Unnecessary Repetition', color: '#b45309', loss: '-1' },
    { code: 'ref', name: 'Unclear Pronoun Reference', color: '#0f766e', loss: '-2' },
    { code: 'cs', name: 'Comma Splice', color: '#b91c1c', loss: '-3' },
    { code: 'wo', name: 'Word Order Error', color: '#6366f1', loss: '-2' },
    { code: 'par', name: 'Faulty Parallel Structure', color: '#059669', loss: '-2' },
  ];

  const highlights = [
    { name: 'Grammar Cluster', bg: 'rgba(253,224,71,.55)' },
    { name: 'Vocabulary Issue', bg: 'rgba(96,165,250,.3)' },
    { name: 'Structure Issue', bg: 'rgba(251,146,60,.3)' },
    { name: 'Style Issue', bg: 'rgba(196,181,253,.45)' },
    { name: 'Good Writing', bg: 'rgba(74,222,128,.3)' },
  ];

  return `
    <p class="ck-section-title">Pen Marks — click any marked word to see options</p>
    <div class="ck-grid">
      ${marks.map(m => `
        <div class="ck-item">
          <span class="ck-code" style="color:${m.color}">${m.code}</span>
          <span class="ck-name">${m.name}</span>
          <span class="ck-loss" style="color:${m.color}">${m.loss}</span>
        </div>`).join('')}
    </div>
    <p class="ck-section-title" style="margin-top:4px">Highlights</p>
    <div class="ck-hl-grid">
      ${highlights.map(h => `
        <div class="ck-hl-item">
          <span class="ck-swatch" style="background:${h.bg}"></span>
          <span>${h.name}</span>
        </div>`).join('')}
    </div>
    <div class="ck-other">
      <div><span class="ck-marker">1</span> Red circle = Examiner margin comment — click to read</div>
      <div><span class="ck-sub-demo">word</span> Blue underline = Click to substitute this word</div>
      <div><span class="ck-sent-demo">sentence</span> Amber underline = Click to rewrite this sentence</div>
    </div>`;
}

// ── Color Key Accordion (lives inside the results phase) ──
export function initColorKeyAccordion(container) {
  if (!container || document.getElementById('acc-colorkey')) return;
  container.appendChild(makeAccordion({
    id: 'colorkey', title: 'Annotation Color Key', bodyHtml: buildColorKeyHtml(), startOpen: false
  }));
}

// ── Landing Type Picker ────────────────────────────────
export function initTypePicker({ onGenerated } = {}) {
  const row = $('type-chip-row');
  const beginBtn = $('begin-writing-btn');
  const refreshBtn = $('topic-refresh-btn');
  if (!row) return;

  function generate(type, chipEl) {
    row.querySelectorAll('.topic-chip').forEach(c => c.classList.remove('checked'));
    chipEl?.classList.add('checked');
    row.querySelectorAll('.topic-chip').forEach(c => c.disabled = true);
    if (beginBtn) beginBtn.disabled = true;

    fetchGeneratedTopic(type, {
      onStart: () => {
        const topicDisplay = $('topic-display');
        if (topicDisplay) topicDisplay.textContent = `Generating a ${type} prompt...`;
      },
      onSuccess: () => {
        row.querySelectorAll('.topic-chip').forEach(c => c.disabled = false);
        syncTopicDisplay();
        if (beginBtn) beginBtn.disabled = false;
        if (refreshBtn) refreshBtn.style.display = '';
        onGenerated?.(type);
      },
      onError: () => {
        row.querySelectorAll('.topic-chip').forEach(c => c.disabled = false);
        const topicDisplay = $('topic-display');
        if (topicDisplay) topicDisplay.textContent = 'Error generating topic. Please try again.';
      }
    });
  }

  row.querySelectorAll('.topic-chip').forEach(chip => {
    chip.addEventListener('click', () => generate(chip.dataset.type, chip));
  });

  refreshBtn?.addEventListener('click', () => {
    const active = row.querySelector('.topic-chip.checked') || row.querySelector('.topic-chip');
    if (active) generate(active.dataset.type, active);
  });
}

// ── Sync Topic Display ─────────────────────────────────
export function syncTopicDisplay() {
  const topicDisplay = $('topic-display');
  if (topicDisplay && currentTopic) topicDisplay.textContent = currentTopic;
  const mhdrType = $('mhdr-type');
  if (mhdrType) mhdrType.textContent = currentWritingType.toUpperCase();
}

// ── Modal ──────────────────────────────────────────────
export function openWritingModal() {
  const modal = $('modal');
  if (!modal) return;
  syncTopicDisplay();
  showPhase('write');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('writing-area')?.focus(), 260);
}

export function closeWritingModal() {
  const modal = $('modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

export function showPhase(phase) {
  const editorSec = $('editor-section');
  const resultsSec = $('results-section');
  const ftrWrite = $('ftr-write');
  const ftrResults = $('ftr-results');
  const mhdrPhase = $('mhdr-phase');

  if (phase === 'write') {
    if (editorSec) editorSec.style.display = 'block';
    resultsSec?.classList.remove('active');
    if (ftrWrite) ftrWrite.style.display = 'flex';
    if (ftrResults) ftrResults.style.display = 'none';
    if (mhdrPhase) mhdrPhase.textContent = 'Write';
  } else {
    if (editorSec) editorSec.style.display = 'none';
    resultsSec?.classList.add('active');
    if (ftrWrite) ftrWrite.style.display = 'none';
    if (ftrResults) ftrResults.style.display = 'flex';
    if (mhdrPhase) mhdrPhase.textContent = 'Results';
    $('modal-body')?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ── Inject Rewrite Styles ──────────────────────────────
export function injectRewriteStyles() {
  if (document.getElementById('rewrite-injected-css')) return;
  const s = document.createElement('style');
  s.id = 'rewrite-injected-css';
  s.textContent = `
    .score-stamp.rewrite-stamp {
      background: #0a0a0a; color: #fff;
      font-size: clamp(1.4rem, 5vw, 2rem);
      letter-spacing: .04em; padding: .4em .7em;
    }
    .rewrite-stamp-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    #rewrite-info-btn {
      width: 26px; height: 26px; border-radius: 50%;
      border: 2px solid #0a0a0a; background: #fff; color: #0a0a0a;
      font-weight: 800; font-size: .85rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 2px 2px 0 #0a0a0a;
      transition: background .15s, color .15s;
    }
    #rewrite-info-btn:hover { background: #0a0a0a; color: #fff; }
    #rewrite-info-note {
      margin-top: 10px; padding: 12px 14px; background: #fffbe6;
      border: 2px solid #0a0a0a; box-shadow: 3px 3px 0 #0a0a0a;
      font-size: .875rem; line-height: 1.5; max-width: 480px;
    }
  `;
  document.head.appendChild(s);
}
