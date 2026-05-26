/* ════════════════════════════════════════
   setup-form.js
════════════════════════════════════════ */

import { state } from '../state.js';
import { SUBJECTS, CURRICULUM } from '../curriculum-data.js';
import { autoResize, CSelect } from './ui-helpers.js';

/* ── Topic state (module-private) ── */
const MAX_TOPICS = 5;
let _selectedTopics = [];

/* ── Clean malformed math function ── */
function cleanMalformedMath(text) {
  if (!text) return text;
  
  // Fix \cdot 1x -> just x (or proper math)
  let cleaned = text.replace(/\\cdot\s*1([a-zA-Z])/g, '$1');
  cleaned = cleaned.replace(/\\cdot\s*1/g, '');
  
  // Fix \cdot x -> x
  cleaned = cleaned.replace(/\\cdot\s*([a-zA-Z])/g, '$1');
  
  // Fix malformed multiplication like )x or ) x
  cleaned = cleaned.replace(/\)\s*([a-zA-Z])/g, ')$1');
  
  // Remove stray 1x patterns
  cleaned = cleaned.replace(/(\d)1([a-zA-Z])/g, '$1$2');
  
  // Fix \cdot without space
  cleaned = cleaned.replace(/\\cdot([a-zA-Z])/g, '$1');
  
  // Fix \ [ \] to $$ for display math
  cleaned = cleaned.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
  
  return cleaned;
}

// Clean math delimiters for display
function cleanMathForDisplay(text) {
  if (!text) return text;
  
  // Replace \( and \) with $
  let cleaned = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  
  // Fix cases like $(2x + 5)$ -> $2x + 5$
  cleaned = cleaned.replace(/\$\(([^)]+)\)\$/g, '$$1$');
  
  // Fix cases like $ (2x + 5) $ -> $2x + 5$
  cleaned = cleaned.replace(/\$\s*\(([^)]+)\)\s*\$/g, '$$1$');
  
  // Fix cases like \ [ \] to $$ for display math
  cleaned = cleaned.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
  
  return cleaned;
}

/* ── Helper to ensure Gemini key is ready ── */
async function ensureGeminiKey() {
  return state.KEY_VERIFIED;
}

/* ── Exported helpers ── */
export function getSelectedTopicLabels() {
  return _selectedTopics.map(key => {
    const [sub, top] = key.split('::');
    return `${sub}: ${top}`;
  });
}

export function getSlotData() {
  const slots = [];
  document.querySelectorAll('.q-slot').forEach(slot => {
    slots.push({
      text: slot.querySelector('.q-slot-editor').innerHTML.trim(),
      marks: parseInt(slot.querySelector('.marks-input').value) || null,
      compulsory: slot.querySelector('input[type=checkbox]').checked,
    });
  });
  return slots;
}

export function checkReady() {
  const qPanelVisible = document.getElementById('question-panel-row').style.display !== 'none';
  const slots = qPanelVisible ? getSlotData() : [];
  const needsTrack = state.st.level === 'ss' && !state.st.track;
  const allQsFilled = qPanelVisible && slots.length > 0 && slots.every(s => s.text.length >= 6);
  const ok = state.KEY_VERIFIED && state.st.name && state.st.cls && state.st.subject && !needsTrack && allQsFilled;
  
  document.getElementById('begin-btn').disabled = !ok;
  
  const s = document.getElementById('setup-status');
  if (!state.st.name) {
    s.textContent = 'Enter your name to continue';
    s.className = 'setup-status';
  }
  else if (!state.st.cls) {
    s.textContent = 'Select your class';
    s.className = 'setup-status';
  }
  else if (needsTrack) {
    s.textContent = 'Select your SS track (Science / Arts / Commercial)';
    s.className = 'setup-status';
  }
  else if (!state.st.subject) {
    s.textContent = 'Choose a subject';
    s.className = 'setup-status';
  }
  else if (!qPanelVisible) {
    s.textContent = 'Select topics or skip, then proceed to questions';
    s.className = 'setup-status';
  }
  else if (!allQsFilled) {
    s.textContent = `Enter or auto-gen all ${state.st.count} question(s)`;
    s.className = 'setup-status';
  }
  else {
    s.textContent = '✓ Ready — click Begin Practice';
    s.className = 'setup-status ready';
  }
}

export function rebuildSlots() {
  const container = document.getElementById('slots-container');
  const agBtn = document.getElementById('autogen-all-btn');
  const existing = [];
  container.querySelectorAll('.q-slot').forEach((slot, i) => {
    existing[i] = {
      text: slot.querySelector('.q-slot-editor')?.innerHTML || '',
      marks: slot.querySelector('.marks-input')?.value || '',
      compulsory: slot.querySelector('input[type=checkbox]')?.checked ?? (i === 0),
    };
  });
  container.innerHTML = '';
  for (let i = 0; i < state.st.count; i++)
    container.appendChild(_buildSlot(i, existing[i] || { text: '', marks: '', compulsory: i === 0 }));
  agBtn.disabled = !(state.st.cls && state.st.subject);
  checkReady();
}

/* ── Private helpers ── */
function _populateSubjects(key) {
  const list = SUBJECTS[key] || [];
  if (!list.length) { subjectSel.disable(); return; }
  subjectSel.setItems(list.map(s => ({ val: s, label: s })));
  subjectSel.reset('— Choose subject —');
  state.st.subject = '';
  document.getElementById('done-subject').classList.remove('show');
  subjectSel.enable();
  document.getElementById('subject-sub').textContent = `${list.length} subjects available`;
}

function _buildTopicPicker(classKey, subject) {
  const pickerRow = document.getElementById('topic-picker-row');
  const groupsEl = document.getElementById('topic-groups');
  const subEl = document.getElementById('topic-picker-sub');
  _selectedTopics = [];
  groupsEl.innerHTML = '';
  
  const classData = CURRICULUM[classKey];
  if (!classData) { pickerRow.style.display = 'none'; return; }
  const subjectData = classData[subject];
  if (!subjectData) { pickerRow.style.display = 'none'; return; }
  
  // Check if subject is a calculation link
  if (subjectData === '__CALCULATION_LINK__') {
    groupsEl.innerHTML = `
      <div class="topic-group">
        <div class="topic-group-label calculation-link-lbl">Calculation Skills</div>
        <div class="topic-chips">
          <a class="topic-chip calculation-link" href="/calculation" target="_blank">
            <span>  Open Calculation Practice Page ↗</span>
          </a>
        </div>
      </div>`;
    pickerRow.style.display = '';
    subEl.textContent = `${subject} — Calculation skills module (linked)`;
    return;
  }
  
  const subTopics = Object.keys(subjectData);
  subTopics.forEach(subTopic => {
    const items = subjectData[subTopic];
    const grpEl = document.createElement('div');
    grpEl.className = 'topic-group';
    
    if (items === '__WRITING_LINK__') {
      grpEl.innerHTML = `
        <div class="topic-group-label writing-link-lbl">Writing Practice</div>
        <div class="topic-chips">
          <a class="topic-chip writing-link" href="/writing" target="_blank">
            <span> Open Writing Practice Page ↗</span>
          </a>
        </div>`;
      groupsEl.appendChild(grpEl);
      return;
    }
    
    grpEl.innerHTML = `<div class="topic-group-label">${subTopic}</div><div class="topic-chips" data-subtopic="${subTopic}"></div>`;
    const chipsEl = grpEl.querySelector('.topic-chips');
    items.forEach(topic => {
      const key = `${subTopic}::${topic}`;
      const chip = document.createElement('div');
      chip.className = 'topic-chip';
      chip.dataset.key = key;
      chip.innerHTML = `<div class="topic-chip-check"></div><span>${topic}</span>`;
      chip.addEventListener('click', () => {
        if (chip.classList.contains('disabled-max')) return;
        const idx = _selectedTopics.indexOf(key);
        if (idx >= 0) {
          _selectedTopics.splice(idx, 1);
          chip.classList.remove('checked');
        }
        else {
          if (_selectedTopics.length >= MAX_TOPICS) return;
          _selectedTopics.push(key);
          chip.classList.add('checked');
        }
        _updateTopicUI();
        _updateQcountTiles();
        checkReady();
      });
      chipsEl.appendChild(chip);
    });
    groupsEl.appendChild(grpEl);
  });
  
  _updateTopicUI();
  pickerRow.style.display = '';
  subEl.textContent = `${subject} — ${subTopics.filter(s => subjectData[s] !== '__WRITING_LINK__').length} sub-topics available`;
}

function _updateTopicUI() {
  const count = _selectedTopics.length;
  document.getElementById('topic-count').textContent = count;
  document.getElementById('topic-count-badge').style.borderColor = count === MAX_TOPICS ? 'var(--red)' : '';
  document.querySelectorAll('.topic-chip').forEach(chip => {
    // Skip calculation and writing link chips (they don't have dataset.key)
    if (!chip.dataset.key) return;
    const checked = _selectedTopics.includes(chip.dataset.key);
    chip.classList.toggle('checked', checked);
    chip.classList.toggle('disabled-max', !checked && count >= MAX_TOPICS);
  });
  const hint = document.getElementById('topic-footer-hint');
  if (count === 0) hint.textContent = 'Select topics or skip to cover the full subject';
  else if (count < MAX_TOPICS) hint.textContent = `${count} topic${count > 1 ? 's' : ''} selected — ${MAX_TOPICS - count} more allowed`;
  else hint.textContent = `Maximum ${MAX_TOPICS} topics reached`;
}

function _updateQcountTiles() {
  const minCount = _selectedTopics.length || 1;
  if (state.st.count < minCount) state.st.count = minCount;
  document.querySelectorAll('.qcount-tile').forEach(tile => {
    const n = parseInt(tile.dataset.n);
    const disabled = n < minCount;
    tile.classList.toggle('tile-disabled', disabled);
    tile.style.opacity = disabled ? '0.3' : '';
    tile.style.cursor = disabled ? 'not-allowed' : '';
    tile.style.pointerEvents = disabled ? 'none' : '';
    if (n === state.st.count) tile.classList.add('active');
    else if (!disabled) tile.classList.remove('active');
  });
  const activeTile = document.querySelector(`.qcount-tile[data-n="${state.st.count}"]`);
  if (activeTile) {
    document.querySelectorAll('.qcount-tile').forEach(t => t.classList.remove('active'));
    activeTile.classList.add('active');
  }
}

function _showQuestionPanel() {
  const qPanel = document.getElementById('question-panel-row');
  qPanel.style.display = '';
  qPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  _updateQcountTiles();
  rebuildSlots();
  checkReady();
}

function _buildSlot(i, { text = '', marks = '', compulsory = false } = {}) {
  const div = document.createElement('div');
  div.className = 'q-slot';
  div.dataset.idx = i;
  
  // Clean the text for display
  let cleanText = cleanMathForDisplay(text);
  cleanText = cleanMalformedMath(cleanText);
  
  div.innerHTML = `
    <div class="q-slot-hd">
      <div class="q-slot-num">${i + 1}</div>
      <label class="compulsory-label">
        <input type="checkbox" ${compulsory ? 'checked' : ''}>
        <div class="compulsory-star">★</div>
        <span class="compulsory-text">Compulsory</span>
      </label>
      <button class="q-autogen-btn" type="button" data-idx="${i}" ${!(state.st.cls && state.st.subject) ? 'disabled' : ''}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Auto-gen
      </button>
    </div>
    <div class="q-slot-body">
      <div class="q-slot-editor" 
           contenteditable="true" 
           data-placeholder="Type your question here (supports $math$ syntax)…"
           spellcheck="true">${cleanText || ''}</div>
    </div>
    <div class="q-slot-ft">
      <div class="marks-wrap">
        <span class="marks-label">Marks:</span>
        <input class="marks-input" type="number" min="1" max="10" value="${marks}" placeholder="Auto" title="Leave blank to auto-award (max 10)">
        <span class="marks-max">/ 10 max</span>
      </div>
      <span class="marks-hint">Leave blank — AI awards based on question type</span>
    </div>`;
  
  const editor = div.querySelector('.q-slot-editor');
  
  // Update when editor changes
  editor.addEventListener('input', () => {
    checkReady();
  });
  
  // Re-render MathJax when editor loses focus
  editor.addEventListener('blur', () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([editor]).catch(console.warn);
    }
  });
  
  // Handle placeholder
  editor.addEventListener('focus', () => {
    if (editor.innerText.trim() === '') {
      // Clear placeholder
    }
    editor.classList.add('focused');
  });
  
  editor.addEventListener('blur', () => {
    editor.classList.remove('focused');
  });
  
  // Initial MathJax rendering
  if (cleanText) {
    setTimeout(() => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([editor]).catch(console.warn);
      }
    }, 100);
  }
  
  div.querySelector('.marks-input').addEventListener('input', checkReady);
  div.querySelector('input[type=checkbox]').addEventListener('change', checkReady);
  div.querySelector('.q-autogen-btn').addEventListener('click', () => _autoGenOne(i));
  return div;
}

async function _autoGenOne(idx) {
  // Ensure Gemini key is ready before proceeding
  const keyReady = await ensureGeminiKey();
  if (!keyReady) {
    alert('Gemini key not ready. Please wait a moment and try again.');
    return;
  }
  
  if (!state.st.cls || !state.st.subject) {
    alert('Please select a class and subject first');
    return;
  }
  
  const slot = document.querySelector(`.q-slot[data-idx="${idx}"]`);
  if (!slot) return;
  
  const btn = slot.querySelector('.q-autogen-btn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = '⚡ Generating…';
  
  const existing = [];
  document.querySelectorAll('.q-slot-editor').forEach(ed => {
    const text = ed.innerText.trim();
    if (text) existing.push(text.slice(0, 80));
  });
  
  TheoryAnalyser.init({
    subject: state.st.subject,
    level: state.st.cls + (state.st.track ? ` (${state.st.track})` : ''),
    topics: getSelectedTopicLabels(),
    mountId: 'theory-results',
  });
  
  try {
    const [q] = await TheoryAnalyser.generateQuestions(1, existing);
    if (q) {
      const editor = slot.querySelector('.q-slot-editor');
      const mi = slot.querySelector('.marks-input');
      
      // Clean the question text for display
      let cleanQuestion = cleanMathForDisplay(q.text);
      cleanQuestion = cleanMalformedMath(cleanQuestion);
      editor.innerHTML = cleanQuestion;
      editor.classList.add('autofilled');
      
      // Render MathJax
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([editor]).catch(console.warn);
      }
      
      if (q.suggestedMarks) mi.value = q.suggestedMarks;
      checkReady();
      console.log('Question generated successfully');
    } else {
      throw new Error('No question generated');
    }
  } catch (err) {
    console.error('Auto-gen error:', err);
    alert('Auto-gen failed: ' + err.message);
  }
  
  btn.disabled = false;
  btn.classList.remove('loading');
  btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Auto-gen`;
}

/* ── Select instances ── */
let trackSel, subjectSel;

export function initSetupForm() {
  /* Name */
  document.getElementById('name-input').addEventListener('input', function() {
    state.st.name = this.value.trim();
    document.getElementById('done-name').classList.toggle('show', !!state.st.name);
    checkReady();
  });
  
  /* Class */
  const clsSel = new CSelect('csel-class', {
    onSelect(val) {
      const [label, level] = val.split('|');
      state.st.cls = label;
      state.st.level = level;
      state.st.track = '';
      state.st.subject = '';
      document.getElementById('done-class').classList.add('show');
      document.getElementById('class-sub').textContent = `Selected: ${label}`;
      const isss = level === 'ss';
      document.getElementById('track-row').classList.toggle('show', isss);
      if (isss) {
        trackSel.reset('— Choose track —');
        subjectSel.reset('— Select track first —');
        subjectSel.disable();
        document.getElementById('subject-sub').textContent = 'Choose your SS track first';
      } else {
        document.getElementById('track-row').classList.remove('show');
        state.st.subjectKey = level;
        _populateSubjects(level);
      }
      _selectedTopics = [];
      document.getElementById('topic-picker-row').style.display = 'none';
      document.getElementById('question-panel-row').style.display = 'none';
      document.getElementById('done-subject').classList.remove('show');
      rebuildSlots();
      checkReady();
    },
  });
  clsSel.setItems([
    { label: 'Primary (Lower)', items: [{ val: 'Primary 1|primary-lower', label: 'Primary 1' }, { val: 'Primary 2|primary-lower', label: 'Primary 2' }, { val: 'Primary 3|primary-lower', label: 'Primary 3' }] },
    { label: 'Primary (Upper)', items: [{ val: 'Primary 4|primary-upper', label: 'Primary 4' }, { val: 'Primary 5|primary-upper', label: 'Primary 5' }, { val: 'Primary 6|primary-upper', label: 'Primary 6' }] },
    { label: 'Junior Secondary', items: [{ val: 'JSS 1|jss', label: 'JSS 1' }, { val: 'JSS 2|jss', label: 'JSS 2' }, { val: 'JSS 3|jss', label: 'JSS 3' }] },
    { label: 'Senior Secondary', items: [{ val: 'SS 1|ss', label: 'SS 1' }, { val: 'SS 2|ss', label: 'SS 2' }, { val: 'SS 3|ss', label: 'SS 3' }] },
  ]);
  
  /* Track */
  trackSel = new CSelect('csel-track', {
    onSelect(val) {
      state.st.track = val;
      state.st.subjectKey = `ss-${val}`;
      _populateSubjects(`ss-${val}`);
      _selectedTopics = [];
      document.getElementById('topic-picker-row').style.display = 'none';
      document.getElementById('question-panel-row').style.display = 'none';
      checkReady();
    },
  });
  
  /* Subject */
  subjectSel = new CSelect('csel-subject', {
    onSelect(val) {
      state.st.subject = val;
      document.getElementById('done-subject').classList.add('show');
      _selectedTopics = [];
      document.getElementById('question-panel-row').style.display = 'none';
      _buildTopicPicker(state.st.subjectKey, val);
      checkReady();
    },
  });
  subjectSel.disable();
  
  /* Topic actions */
  document.getElementById('topic-clear-btn').addEventListener('click', () => {
    _selectedTopics = [];
    _updateTopicUI();
    _updateQcountTiles();
    checkReady();
  });
  document.getElementById('proceed-to-questions-btn').addEventListener('click', _showQuestionPanel);
  document.getElementById('skip-topics-btn').addEventListener('click', () => {
    _selectedTopics = [];
    _updateTopicUI();
    _showQuestionPanel();
  });
  
  /* Q-count tiles */
  document.getElementById('qcount-row').addEventListener('click', e => {
    const tile = e.target.closest('.qcount-tile');
    if (!tile || tile.classList.contains('tile-disabled')) return;
    document.querySelectorAll('.qcount-tile').forEach(t => t.classList.remove('active'));
    tile.classList.add('active');
    state.st.count = parseInt(tile.dataset.n);
    document.getElementById('done-count').classList.add('show');
    rebuildSlots();
    checkReady();
  });
  
  /* Auto-gen all */
  document.getElementById('autogen-all-btn').addEventListener('click', async () => {
    // Ensure Gemini key is ready before proceeding
    const keyReady = await ensureGeminiKey();
    if (!keyReady) {
      alert('Gemini key not ready. Please wait a moment and try again.');
      return;
    }
    
    if (!state.st.cls || !state.st.subject) {
      alert('Please select a class and subject first');
      return;
    }
    
    const btn = document.getElementById('autogen-all-btn');
    btn.disabled = true;
    btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg> Generating all questions…`;
    
    TheoryAnalyser.init({
      subject: state.st.subject,
      level: state.st.cls + (state.st.track ? ` (${state.st.track})` : ''),
      topics: getSelectedTopicLabels(),
      mountId: 'theory-results',
    });
    
    try {
      const questions = await TheoryAnalyser.generateQuestions(state.st.count);
      
      if (!questions || questions.length === 0) {
        throw new Error('No questions generated');
      }
      
      questions.forEach((q, i) => {
        const slot = document.querySelector(`.q-slot[data-idx="${i}"]`);
        if (!slot) return;
        const editor = slot.querySelector('.q-slot-editor');
        const mi = slot.querySelector('.marks-input');
        
        // Clean the question text
        let cleanQuestion = cleanMathForDisplay(q.text);
        cleanQuestion = cleanMalformedMath(cleanQuestion);
        editor.innerHTML = cleanQuestion;
        editor.classList.add('autofilled');
        
        // Render MathJax
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([editor]).catch(console.warn);
        }
        
        if (q.suggestedMarks) mi.value = q.suggestedMarks;
      });
      
      checkReady();
      console.log(`Generated ${questions.length} questions successfully`);
      
    } catch (err) {
      console.error('Auto-gen all error:', err);
      alert('Auto-generate failed: ' + err.message);
    }
    
    btn.disabled = false;
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Auto-generate All`;
  });
}