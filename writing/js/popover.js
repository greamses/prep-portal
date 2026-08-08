/* ═══════════════════════════════════════════════════════
   PREPBOT — POPOVER & INTERACTION LAYER
═══════════════════════════════════════════════════════ */

import { ERROR_TYPES, ERROR_ACTIONS, safe, commentStore, setCommentCounter } from './config.js';

// Module state
let activeEl = null;
let moveSourceEl = null;
let moveHandler = null;

// DOM refs (set by init)
let elPopover = null;
let elCommentPop = null;
let elAnnotated = null;

// ── Init ───────────────────────────────────────────────
export function initPopover(popoverEl, commentPopEl, annotatedEl) {
  elPopover = popoverEl;
  elCommentPop = commentPopEl;
  elAnnotated = annotatedEl;
}

// ── Position Popover ───────────────────────────────────
function positionPopover(el) {
  if (!elPopover) return;
  const rect = el.getBoundingClientRect();
  const pw = 340, ph = 360;
  let left = rect.left;
  let top = rect.bottom + 10;
  if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
  if (left < 8) left = 8;
  if (top + ph > window.innerHeight - 8) top = rect.top - ph - 8;
  if (top < 8) top = 8;
  elPopover.style.left = left + 'px';
  elPopover.style.top = top + 'px';
}

// ── Build Red Pen Correction Block ─────────────────────
function buildRedPenHtml(originalText, fix, optsStr, dataType, type) {
  const original = originalText.replace(/<[^>]+>/g, '').trim();
  
  if (fix) {
    return `
      <div class="pop-redpen">
        <span class="pop-redpen-original">${safe(original)}</span>
        <span class="pop-redpen-arrow">→</span>
        <button class="pop-redpen-fix" data-val="${safe(fix)}">${safe(fix)}</button>
      </div>`;
  }
  
  if (optsStr) {
    const separator = dataType === 'sent' ? '|||' : ',';
    const opts = optsStr.split(separator).map(s => s.trim()).filter(Boolean);
    if (!opts.length) return '';
    
    const isSent = dataType === 'sent';
    const btns = opts.map(o =>
      `<button class="pop-redpen-opt ${isSent ? 'sent' : ''}" data-val="${safe(o)}">${safe(o)}</button>`
    ).join('');
    
    return `
      <div class="pop-redpen ${isSent ? 'pop-redpen--sent' : ''}">
        ${!isSent ? `<span class="pop-redpen-original">${safe(original)}</span><span class="pop-redpen-arrow">→</span>` : ''}
        <div class="pop-redpen-opts">${btns}</div>
      </div>`;
  }
  
  if (type === 'del') {
    return `
      <div class="pop-redpen pop-redpen--del">
        <span class="pop-redpen-original">${safe(original)}</span>
        <span class="pop-redpen-arrow">→</span>
        <span class="pop-redpen-delete">delete</span>
      </div>`;
  }
  
  return '';
}

// ── Apply Replacement ──────────────────────────────────
function applyOpt(chosen) {
  if (!activeEl) return;
  activeEl.querySelector('.deduction')?.remove();
  activeEl.textContent = chosen;
  activeEl.style.textDecoration = 'none';
  activeEl.style.background = 'color-mix(in srgb, var(--green) 25%, transparent)';
  activeEl.style.color = 'var(--green)';
  activeEl.style.fontWeight = '600';
  activeEl.style.outline = 'none';
  activeEl.style.borderBottom = 'none';
  [...activeEl.classList]
    .filter(c => c.startsWith('doodle') || c === 'sub-word' || c === 'sent-sub')
    .forEach(c => activeEl.classList.remove(c));
  elPopover?.classList.remove('visible');
  activeEl = null;
}

// ── Delete Annotation ──────────────────────────────────
function deleteAnnotation(el) {
  el.style.transition = 'opacity .35s, text-decoration .35s';
  el.style.textDecoration = 'line-through';
  el.style.opacity = '0.3';
  setTimeout(() => el.remove(), 380);
}

// ── Move Mode ──────────────────────────────────────────
function startMoveMode(el) {
  cancelMoveMode();
  
  moveSourceEl = el;
  el.classList.add('move-source');
  
  const preview = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 45) +
    (el.textContent.trim().length > 45 ? '...' : '');
  
  const instr = document.createElement('div');
  instr.id = 'move-instruction';
  instr.innerHTML = `Click where to place <em>"${preview}"</em> <button id="cancel-move">Cancel</button>`;
  document.body.appendChild(instr);
  
  if (elAnnotated) elAnnotated.style.cursor = 'crosshair';
  
  moveHandler = (e) => {
    if (e.target.id === 'cancel-move' || e.target.closest?.('#cancel-move')) {
      cancelMoveMode();
      return;
    }
    if (e.target.closest?.('#move-instruction')) return;
    if (!elAnnotated?.contains(e.target) && e.target !== elAnnotated) {
      cancelMoveMode();
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    let range = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }
    
    if (range && moveSourceEl) {
      const src = moveSourceEl;
      src.remove();
      src.classList.remove('move-source');
      range.insertNode(src);
      src.addEventListener('click', ev => { ev.stopPropagation(); openAnnotationPopover(src); });
    }
    
    cancelMoveMode();
  };
  
  document.addEventListener('click', moveHandler, { capture: true });
}

function cancelMoveMode() {
  if (moveSourceEl) { moveSourceEl.classList.remove('move-source'); moveSourceEl = null; }
  document.getElementById('move-instruction')?.remove();
  if (elAnnotated) elAnnotated.style.cursor = '';
  if (moveHandler) { document.removeEventListener('click', moveHandler, { capture: true }); moveHandler = null; }
}

// ── Open Annotation Popover ────────────────────────────
export function openAnnotationPopover(el) {
  if (!elPopover) return;
  activeEl = el;
  
  const classes = [...el.classList];
  const doodleClass = classes.find(c => c.startsWith('doodle-') && c !== 'doodle');
  const type = doodleClass ? doodleClass.replace('doodle-', '') : '';
  const fix = el.dataset.fix || '';
  const optsStr = el.dataset.opts || '';
  const dataType = el.dataset.type || (optsStr && !type ? 'word' : '');
  const lossAttr = el.dataset.loss || el.querySelector?.('.deduction')?.textContent || '';
  
  const actionKey = type || dataType || 'word';
  const actions = ERROR_ACTIONS[actionKey] || { d: false, m: false, c: true };
  
  const info = ERROR_TYPES[type] || {
    name: dataType === 'sent' ? 'Sentence Rewrite' : 'Word Substitute',
    desc: dataType === 'sent'
      ? 'This sentence could be more effective. Click a rewrite option below to replace it.'
      : 'This word could be stronger. Click a replacement option to upgrade it.'
  };
  
  const badgeBg = (() => {
    const tmp = document.querySelector(`.doodle-${type}`);
    if (tmp) {
      const s = getComputedStyle(tmp);
      return s.borderBottomColor !== 'rgba(0, 0, 0, 0)' ? s.borderBottomColor
        : s.outlineColor !== 'rgba(0, 0, 0, 0)' ? s.outlineColor : 'var(--ink)';
    }
    // Theme tokens, not the old hardcoded ink/orange/blue — a badge painted
    // #0055ff on soft paper is exactly the sort of thing that "dips in".
    return type ? 'var(--ink)' : (dataType === 'sent' ? 'var(--amber)' : 'var(--blue)');
  })();
  
  const redPenHtml = buildRedPenHtml(el.textContent, fix, optsStr, dataType, type);
  
  const actionBtns = [
    actions.d ? `<button class="pop-action-btn danger" id="pop-act-delete">Delete</button>` : '',
    actions.m ? `<button class="pop-action-btn move" id="pop-act-move">Move</button>` : '',
    actions.c ? `<button class="pop-action-btn success" id="pop-act-custom">Custom Replace</button>` : '',
  ].filter(Boolean).join('');
  
  const actionsSection = actionBtns ? `
    <div class="pop-divider"></div>
    <div class="pop-section-label">More actions</div>
    <div class="pop-action-row">${actionBtns}</div>` : '';
  
  elPopover.innerHTML = `
    <div class="pop-header">
      <span class="pop-badge" style="background:${badgeBg}">${type || (dataType === 'sent' ? 'sent' : 'sub')}</span>
      <span class="pop-error-name">${info.name}</span>
      ${lossAttr ? `<span class="pop-loss">${safe(lossAttr)}</span>` : ''}
    </div>
    <div class="pop-desc">${info.desc}</div>
    ${redPenHtml}
    ${actionsSection}
    <div class="pop-custom-wrap" id="pop-custom-area" style="display:none">
      <input class="pop-custom-input" id="pop-custom-text" placeholder="Type replacement text..." />
      <button class="pop-custom-apply" id="pop-custom-go">Apply</button>
    </div>`;
  
  elPopover.classList.add('visible');
  positionPopover(el);
  
  document.getElementById('pop-act-delete')?.addEventListener('click', () => {
    deleteAnnotation(el);
    elPopover.classList.remove('visible');
    activeEl = null;
  });
  
  document.getElementById('pop-act-move')?.addEventListener('click', () => {
    elPopover.classList.remove('visible');
    startMoveMode(el);
  });
  
  document.getElementById('pop-act-custom')?.addEventListener('click', () => {
    const area = document.getElementById('pop-custom-area');
    if (!area) return;
    const opening = area.style.display === 'none';
    area.style.display = opening ? 'flex' : 'none';
    if (opening) document.getElementById('pop-custom-text')?.focus();
  });
  
  document.getElementById('pop-custom-go')?.addEventListener('click', () => {
    const val = document.getElementById('pop-custom-text')?.value.trim();
    if (val) applyOpt(val);
  });
  
  document.getElementById('pop-custom-text')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const val = e.target.value.trim(); if (val) applyOpt(val); }
  });
  
  elPopover.querySelectorAll('.pop-redpen-fix, .pop-redpen-opt').forEach(btn => {
    btn.addEventListener('click', () => applyOpt(btn.dataset.val || btn.textContent.trim()));
  });
}

// ── Show Comment Popover ───────────────────────────────
export function showComment(marker) {
  if (!elCommentPop) return;
  const id = parseInt(marker.dataset.cid, 10);
  const text = commentStore[id];
  if (!text) return;
  
  if (elCommentPop.classList.contains('visible') && elCommentPop.dataset.activeCid == id) {
    elCommentPop.classList.remove('visible');
    marker.classList.remove('active');
    elCommentPop.dataset.activeCid = '';
    return;
  }
  
  document.querySelectorAll('.margin-comment-marker.active').forEach(m => m.classList.remove('active'));
  marker.classList.add('active');
  elCommentPop.dataset.activeCid = id;
  
  elCommentPop.innerHTML = `
    <div class="comment-pop-label"> Examiner's Note ${id}</div>
    <div class="comment-pop-text">${safe(text)}</div>`;
  elCommentPop.classList.add('visible');
  
  const rect = marker.getBoundingClientRect();
  const pw = 284, ph = 120;
  let left = rect.right + 10, top = rect.top - 8;
  if (left + pw > window.innerWidth - 8) left = rect.left - pw - 10;
  if (left < 8) left = 8;
  if (top + ph > window.innerHeight - 8) top = window.innerHeight - ph - 8;
  if (top < 8) top = 8;
  elCommentPop.style.left = left + 'px';
  elCommentPop.style.top = top + 'px';
}

// ── Setup Global Listeners ─────────────────────────────
export function setupPopoverListeners() {
  document.addEventListener('click', e => {
    if (!elCommentPop) return;
    if (elCommentPop.contains(e.target)) return;
    if (e.target.classList.contains('margin-comment-marker')) return;
    elCommentPop.classList.remove('visible');
    elCommentPop.dataset.activeCid = '';
    document.querySelectorAll('.margin-comment-marker.active').forEach(m => m.classList.remove('active'));
  });

  document.addEventListener('click', e => {
    if (!elPopover) return;
    if (elPopover.contains(e.target)) return;
    elPopover.classList.remove('visible');
  });
}

// ── Attach Listeners to Container ──────────────────────
export function attachAnnotationListeners(container) {
  container.querySelectorAll('.doodle').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openAnnotationPopover(el); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAnnotationPopover(el); }
    });
  });
  
  container.querySelectorAll('.sub-word, .sent-sub').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openAnnotationPopover(el); });
  });
  
  container.querySelectorAll('.margin-comment-marker').forEach(marker => {
    marker.addEventListener('click', e => { e.stopPropagation(); showComment(marker); });
  });
}