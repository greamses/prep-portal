/* ═══════════════════════════════════════════════════════
   RECALL PRESS — CLASS / SUBJECT / TOPIC / COUNT PICKER
   Reuses the curated subject lists from theory-page (pure
   data, no side effects) so the picker matches the rest of
   the site's curriculum instead of drifting free-text.
═══════════════════════════════════════════════════════ */
import { SUBJECTS } from '/theory-page/curriculum-data.js';
import { $, state } from './config.js';

const clsSelect = $('cls-select');
const trackField = $('track-field');
const trackSelect = $('track-select');
const subjectSelect = $('subject-select');
const topicInput = $('topic-input');
const countTiles = $('count-tiles');
const runBtn = $('run-press-btn');

function populateSubjects(levelKey) {
  const list = SUBJECTS[levelKey] || [];
  subjectSelect.innerHTML = '<option value="" disabled selected>— Select subject —</option>';
  list.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    subjectSelect.appendChild(opt);
  });
  subjectSelect.disabled = list.length === 0;
  state.subject = '';
}

function checkReady(onReady) {
  const ready = !!(state.cls && state.subject && topicInput.value.trim());
  runBtn.disabled = !ready;
  onReady?.(ready);
}

export function initTopicPicker({ onReady } = {}) {
  clsSelect.addEventListener('change', () => {
    const [label, level] = clsSelect.value.split('|');
    state.clsLabel = label;
    const isSS = level === 'ss';
    trackField.hidden = !isSS;
    if (isSS) {
      trackSelect.value = '';
      state.cls = '';
      subjectSelect.innerHTML = '<option value="" disabled selected>— Select track first —</option>';
      subjectSelect.disabled = true;
    } else {
      state.cls = level;
      populateSubjects(level);
    }
    checkReady(onReady);
  });

  trackSelect.addEventListener('change', () => {
    state.cls = `ss-${trackSelect.value}`;
    populateSubjects(state.cls);
    checkReady(onReady);
  });

  subjectSelect.addEventListener('change', () => {
    state.subject = subjectSelect.value;
    checkReady(onReady);
  });

  topicInput.addEventListener('input', () => {
    state.topic = topicInput.value.trim();
    checkReady(onReady);
  });

  countTiles.addEventListener('click', (e) => {
    const tile = e.target.closest('.count-tile');
    if (!tile) return;
    countTiles.querySelectorAll('.count-tile').forEach((t) => t.classList.remove('active'));
    tile.classList.add('active');
    state.count = parseInt(tile.dataset.n, 10);
  });

  runBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('recall-press:run'));
  });
}
