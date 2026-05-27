/* ════════════════════════════════════════
   ui-helpers.js (Rich Text & Math)
════════════════════════════════════════ */

/**
 * Handles standard textarea resizing (legacy support)
 */
export function autoResize(ta) {
  if (CSS.supports('field-sizing', 'content')) return;
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}

/**
 * Custom Select Component
 */
export class CSelect {
  constructor(id, { onSelect } = {}) {
    this.el = document.getElementById(id);
    this.btn = this.el.querySelector('.csel-btn');
    this.valEl = this.el.querySelector('.csel-placeholder');
    this.panel = this.el.querySelector('.csel-panel');
    this.cb = onSelect;
    this.value = null;
    this._dis = false;
    
    this.btn.addEventListener('click', e => {
      e.stopPropagation();
      if (!this._dis) this.toggle();
    });
    this.panel.addEventListener('click', e => {
      const item = e.target.closest('.csel-item');
      if (!item) return;
      this.pick(item.dataset.val, item.querySelector('span')?.textContent);
    });
    document.addEventListener('click', e => {
      if (!this.el.contains(e.target)) this.close();
    });
    this.btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!this._dis) this.toggle(); }
      if (e.key === 'Escape') this.close();
    });
  }
  
  toggle() {
    document.querySelectorAll('.csel.open').forEach(el => {
      if (el !== this.el) el.classList.remove('open');
    });
    const o = !this.el.classList.contains('open');
    this.el.classList.toggle('open', o);
    this.btn.setAttribute('aria-expanded', o);
  }
  
  close() {
    this.el.classList.remove('open');
    this.btn.setAttribute('aria-expanded', 'false');
  }
  
  pick(val, label) {
    this.value = val;
    this.valEl.textContent = label || val;
    this.btn.classList.add('has-val');
    this.panel.querySelectorAll('.csel-item').forEach(i =>
      i.classList.toggle('selected', i.dataset.val === val));
    this.close();
    if (this.cb) this.cb(val, label || val);
  }
  
  reset(placeholder) {
    this.value = null;
    this.valEl.textContent = placeholder || '— Select —';
    this.btn.classList.remove('has-val');
    this.panel.querySelectorAll('.csel-item').forEach(i => i.classList.remove('selected'));
  }
  
  setItems(groups) {
    let html = '';
    for (const g of groups) {
      if (g.label) html += `<div class="csel-group">${g.label}</div>`;
      for (const item of (g.items || [g])) {
        html += `<div class="csel-item" data-val="${item.val}"><span>${item.label}</span></div>`;
      }
    }
    this.panel.innerHTML = html;
  }
  
  enable() {
    this._dis = false;
    this.btn.disabled = false;
    this.el.classList.remove('csel--dis');
  }
  disable() {
    this._dis = true;
    this.btn.disabled = true;
    this.close();
  }
}

/**
 * Animated Ticker in the background
 */
export function initTicker() {
  const items = [
    'Government', 'Biology', 'Chemistry', 'Physics', 'Economics',
    'Literature', 'History', 'Mathematics', 'Further Maths',
    'Geography', 'Commerce', 'Accounts', 'Computer Science',
    'Agricultural Science', 'English Language',
  ];
  const doubled = [...items, ...items];
  const track = document.getElementById('ticker-track');
  if (track) {
    track.innerHTML = doubled
      .map(i => `<span class="ticker-item">${i}<span class="ticker-dot">◆</span></span>`)
      .join('');
  }
}

// ============================================
// UNIFIED RICH TEXT & MATH SUPPORT
// ============================================

let toolbarInitialized = false;
let mathModalInitialized = false;
let savedRange = null;

/**
 * Initialize the rich text formatting toolbar
 */
export function initTextFormatting() {
  if (toolbarInitialized) return;
  toolbarInitialized = true;
  
  let toolbar = document.getElementById('text-format-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'text-format-toolbar';
    toolbar.innerHTML = `
      <button data-cmd="bold" title="Bold (Ctrl+B)">B</button>
      <button data-cmd="italic" title="Italic (Ctrl+I)">I</button>
      <button data-cmd="underline" title="Underline (Ctrl+U)">U</button>
      <button data-cmd="double" title="Double Underline">U2</button>
      <button data-cmd="circle" title="Circle Point">◯</button>
      <button data-cmd="box" title="Box Point">▢</button>
      <button data-cmd="math" title="Insert Math Equation (∑)">∑</button>
      <button data-cmd="fontSize" data-val="5" title="Increase Font Size">+A</button>
      <button data-cmd="fontSize" data-val="3" title="Decrease Font Size">-A</button>
    `;
    document.body.appendChild(toolbar);
  }
  
  // Toolbar event handler
  toolbar.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    e.preventDefault();
    
    const cmd = btn.dataset.cmd;
    const val = btn.dataset.val;
    
    const activeEditor = document.activeElement;
    const isInEditor = activeEditor && activeEditor.classList && activeEditor.classList.contains('paper-editable');
    
    if (!isInEditor) return;
    
    // Execute command based on type
    if (cmd === 'math') {
      openMathModal(activeEditor);
    } else if (cmd === 'double') {
      wrapSelection('u-double');
    } else if (cmd === 'circle') {
      wrapSelection('f-circle');
    } else if (cmd === 'box') {
      wrapSelection('f-box');
    } else if (cmd === 'fontSize') {
      document.execCommand('fontSize', false, val);
    } else {
      document.execCommand(cmd, false, null);
    }
    
    // Trigger events
    activeEditor.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Re-render MathJax if present
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([activeEditor]).catch(console.warn);
    }
  });
  
  // Position toolbar on selection
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
      toolbar.style.display = 'none';
      return;
    }
    
    const editor = sel.anchorNode?.parentElement?.closest?.('.paper-editable');
    if (!editor) {
      toolbar.style.display = 'none';
      return;
    }
    
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    toolbar.style.display = 'flex';
    toolbar.style.position = 'fixed';
    toolbar.style.left = `${rect.left + rect.width / 2 - toolbar.offsetWidth / 2}px`;
    toolbar.style.top = `${rect.bottom + 10}px`;
  });
}

/**
 * Wrap selected text with a span class
 */
function wrapSelection(className) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  
  const range = sel.getRangeAt(0);
  const parent = sel.anchorNode.parentElement;
  
  // Check if already wrapped
  if (parent && parent.classList && parent.classList.contains(className)) {
    // Unwrap
    const text = document.createTextNode(parent.textContent);
    parent.parentNode.replaceChild(text, parent);
    // Select the text
    const newRange = document.createRange();
    newRange.selectNodeContents(text);
    sel.removeAllRanges();
    sel.addRange(newRange);
  } else {
    // Wrap
    const span = document.createElement('span');
    span.className = className;
    range.surroundContents(span);
    // Select inside the span
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}

/**
 * Open math equation modal
 */
function openMathModal(editor) {
  if (!mathModalInitialized) {
    initMathModal();
  }
  
  // Save current selection
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedRange = sel.getRangeAt(0).cloneRange();
  }
  
  const modal = document.getElementById('math-modal');
  if (modal) {
    modal.style.display = 'flex';
    const input = document.getElementById('math-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    // Clear preview
    const preview = document.getElementById('math-preview');
    if (preview) {
      preview.innerHTML = 'Preview: <span class="math-preview-content">$...$</span>';
    }
  }
}

/**
 * Initialize math modal (using your existing CSS structure)
 */
function initMathModal() {
  if (mathModalInitialized) return;
  mathModalInitialized = true;
  
  // Check if modal already exists
  let modal = document.getElementById('math-modal');
  if (modal) return;
  
  modal = document.createElement('div');
  modal.id = 'math-modal';
  modal.innerHTML = `
    <div class="math-kb-wrap">
      <div class="math-kb-header">
        <span>MATH EQUATION</span>
        <button id="math-close">✕</button>
      </div>
      <div class="math-kb-preview" id="math-preview">Preview: <span class="math-preview-content">$...$</span></div>
      <textarea id="math-input" placeholder="Type LaTeX: \\frac{x}{y}, \\sqrt{x}, ^{2}, \\pi"></textarea>
      <div class="math-kb-grid">
        <button data-latex="\\frac{x}{y}">x/y</button>
        <button data-latex="\\sqrt{x}">√x</button>
        <button data-latex="^{2}">x²</button>
        <button data-latex="_{n}">xₙ</button>
        <button data-latex="\\pi">π</button>
        <button data-latex="\\theta">θ</button>
        <button data-latex="\\alpha">α</button>
        <button data-latex="\\beta">β</button>
        <button data-latex="\\sum">∑</button>
        <button data-latex="\\int">∫</button>
        <button data-latex="\\infty">∞</button>
        <button data-latex="\\pm">±</button>
        <button data-latex="\\leq">≤</button>
        <button data-latex="\\geq">≥</button>
        <button data-latex="\\times">×</button>
        <button data-latex="\\div">÷</button>
      </div>
      <button id="math-insert">INSERT EQUATION</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Event handlers
  const closeBtn = document.getElementById('math-close');
  const insertBtn = document.getElementById('math-insert');
  const input = document.getElementById('math-input');
  const preview = document.getElementById('math-preview');
  const previewContent = preview?.querySelector('.math-preview-content');
  
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }
  
  if (insertBtn) {
    insertBtn.onclick = () => {
      const latex = input?.value?.trim();
      if (!latex) {
        modal.style.display = 'none';
        return;
      }
      
      const mathText = `$${latex}$`;
      const mathNode = document.createTextNode(mathText);
      
      if (savedRange) {
        savedRange.deleteContents();
        savedRange.insertNode(mathNode);
        savedRange.collapse(false);
      } else {
        const active = document.activeElement;
        if (active && active.classList?.contains('paper-editable')) {
          const sel = window.getSelection();
          if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(mathNode);
            range.collapse(false);
          } else {
            active.appendChild(mathNode);
          }
        }
      }
      
      // Re-render MathJax
      const editor = document.activeElement;
      if (editor && window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([editor]).catch(console.warn);
      }
      
      modal.style.display = 'none';
      if (input) input.value = '';
    };
  }
  
  if (input) {
    input.oninput = () => {
      if (previewContent) {
        const latex = input.value.trim();
        if (latex) {
          previewContent.innerHTML = `$${latex}$`;
        } else {
          previewContent.innerHTML = '$...$';
        }
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([preview]).catch(console.warn);
        }
      }
    };
  }
  
  // Add button handlers
  modal.querySelectorAll('.math-kb-grid button').forEach(btn => {
    btn.onclick = () => {
      if (input) {
        input.value += btn.dataset.latex;
        input.dispatchEvent(new Event('input'));
        input.focus();
      }
    };
  });
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  });
  
  // Close on click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Initialize MathJax
 */
let mathJaxInitialized = false;

export function initMathJax() {
  if (mathJaxInitialized) return;
  mathJaxInitialized = true;
  
  if (window.MathJax) {
    console.log('MathJax already loaded');
    return;
  }
  
  window.MathJax = {
    tex: {
      inlineMath: [
        ['$', '$']
      ], // Only use $ for inline math
      displayMath: [
        ['$$', '$$']
      ],
      processEscapes: true
    },
    options: {
      ignoreHtmlClass: 'ignore-math',
      processHtmlClass: 'math'
    },
    startup: {
      typeset: false,
      ready: () => {
        console.log('MathJax ready');
        MathJax.startup.defaultReady();
      }
    }
  };
  
  const script = document.createElement('script');
  script.src = '/node_modules/mathjax/tex-chtml.js';
  script.async = true;
  script.onload = () => {
    console.log('MathJax script loaded');
  };
  document.head.appendChild(script);
}