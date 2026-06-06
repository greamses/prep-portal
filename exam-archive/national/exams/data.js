// Exam builder — data-driven from the Firestore question bank (/api/questions).
// Flow: Exam Type → Subjects (with counts) → Year (with counts) → Format.
'use strict';

const API_BASE = window.location.port === '5500' ? 'http://127.0.0.1:5000' : '';

// Exam board → ALOC queryType (the clean type stored on each question).
const EXAM_TYPES = [
  { id: 'WAEC', name: 'WASSCE', queryType: 'wassce', live: true },
  { id: 'NECO', name: 'SSCE', queryType: 'wassce', live: false },
  { id: 'JAMB', name: 'UTME', queryType: 'utme', live: true }
];

const COMPULSORY = ['English Language']; // English is the only compulsory subject
const MAX_SUBJECTS = 9;
const PER_SUBJECT = 15; // questions fetched per subject

// Class/stream → subject keys (plus CORE, shown in every class). The subject
// list is the intersection of this and what actually has data for the exam type.
const CORE_SUBJECTS = ['english', 'mathematics'];
const STREAM_SUBJECTS = {
  science: ['physics', 'chemistry', 'biology', 'geography'],
  commercial: ['commerce', 'accounting', 'economics', 'insurance'],
  arts: ['englishlit', 'government', 'history', 'crk', 'irk', 'civiledu', 'currentaffairs', 'economics']
};
const STREAMS = [
  { id: 'science', name: 'Science' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'arts', name: 'Arts / Humanities' }
];

let state = {
  examType: null,   // WAEC / JAMB
  queryType: null,  // utme / wassce
  stream: null,     // science / commercial / arts
  subjects: [],     // selected subject LABELS
  year: null,       // 'all' or a 4-digit year
  types: ['objective']
};

let facets = null;                 // { subjects:[{key,label,count}], yearsBySubject:{key:[{year,count}]} }
let countByKey = {}, keyByLabel = {};

// ── DOM ──
const examContainer = document.getElementById('exam-chips');
const streamContainer = document.getElementById('stream-chips');
const yearContainer = document.getElementById('year-chips');
const subjectChipsDiv = document.getElementById('subject-chips');
const subjectCountSpan = document.getElementById('subject-count');
const subjectRow = document.getElementById('subject-row');
const beginBtn = document.getElementById('begin-btn');
const setupStatusSpan = document.getElementById('setup-status');
const doneExam = document.getElementById('done-exam');
const doneStream = document.getElementById('done-stream');
const doneYear = document.getElementById('done-year');
const doneSubject = document.getElementById('done-subject');
const doneType = document.getElementById('done-type');

function setStatus(msg, ready) {
  setupStatusSpan.textContent = msg;
  setupStatusSpan.classList.toggle('ready', !!ready);
}

function updateReadyState() {
  const ready = state.examType && state.stream && state.subjects.length > 0 && state.year && state.types.length > 0;
  beginBtn.disabled = !ready;
  if (ready) { setStatus('✓ All set. Ready to generate practice paper.', true); return; }
  const need = [];
  if (!state.examType) need.push('exam type');
  if (!state.stream) need.push('class');
  if (state.subjects.length === 0) need.push('subjects');
  if (!state.year) need.push('year');
  if (state.types.length === 0) need.push('format');
  setStatus('Select: ' + need.join(' • '), false);
}

// ── 1 · Exam type ──
function buildExamGrid() {
  examContainer.innerHTML = '';
  EXAM_TYPES.forEach(exam => {
    const chip = document.createElement('div');
    chip.className = `custom-chip exam-chip ${!exam.live ? 'disabled' : ''}`;
    chip.innerHTML = `<div class="status-dot ${exam.live ? 'live' : 'offline'}"></div><span>${exam.name}</span>`;
    if (exam.live) {
      chip.onclick = () => selectExam(exam, chip);
    } else {
      chip.style.pointerEvents = 'none';
      chip.style.opacity = '0.5';
    }
    examContainer.appendChild(chip);
  });
}

async function selectExam(exam, chip) {
  document.querySelectorAll('.exam-chip').forEach(c => c.classList.remove('checked'));
  chip.classList.add('checked');
  state.examType = exam.id;
  state.queryType = exam.queryType;
  state.subjects = [];
  state.year = null;
  doneExam.classList.add('show');
  doneSubject.classList.remove('show');
  doneYear.classList.remove('show');
  yearContainer.innerHTML = '<span class="picker-hint">Choose subjects to see available years</span>';
  subjectRow.style.display = 'flex';
  subjectChipsDiv.innerHTML = '<span class="picker-hint">Loading subjects…</span>';
  updateReadyState();
  updateTypeVisibility();

  try {
    const res = await fetch(`${API_BASE}/api/questions/facets?type=${state.queryType}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    facets = await res.json();
    countByKey = {}; keyByLabel = {};
    facets.subjects.forEach(s => { countByKey[s.key] = s.count; keyByLabel[s.label] = s.key; });
    maybeRenderSubjects();
  } catch (e) {
    subjectChipsDiv.innerHTML = '<span class="picker-error">Could not load subjects. Is the server running?</span>';
  }
}

// ── 2 · Class / stream ──
function buildStreamGrid() {
  streamContainer.innerHTML = '';
  STREAMS.forEach(st => {
    const chip = document.createElement('div');
    chip.className = 'custom-chip stream-chip';
    chip.innerHTML = `<div class="chip-check-box"></div><span>${st.name}</span>`;
    chip.onclick = () => {
      document.querySelectorAll('.stream-chip').forEach(c => c.classList.remove('checked'));
      chip.classList.add('checked');
      state.stream = st.id;
      state.subjects = [];
      state.year = null;
      doneStream.classList.add('show');
      doneSubject.classList.remove('show');
      doneYear.classList.remove('show');
      yearContainer.innerHTML = '<span class="picker-hint">Choose subjects to see available years</span>';
      maybeRenderSubjects();
      updateReadyState();
    };
    streamContainer.appendChild(chip);
  });
}

const allowedKeys = (stream) => new Set([...CORE_SUBJECTS, ...(STREAM_SUBJECTS[stream] || [])]);

function maybeRenderSubjects() {
  if (!state.examType) { subjectChipsDiv.innerHTML = '<span class="picker-hint">Select an exam type first.</span>'; return; }
  if (!facets) { subjectChipsDiv.innerHTML = '<span class="picker-hint">Loading subjects…</span>'; return; }
  if (!state.stream) { subjectChipsDiv.innerHTML = '<span class="picker-hint">Select your class to see its subjects.</span>'; return; }
  renderSubjects();
}

// ── 3 · Subjects (filtered by class) ──
function renderSubjects() {
  subjectChipsDiv.innerHTML = '';
  const allowed = allowedKeys(state.stream);
  const list = (facets ? facets.subjects : []).filter(s => allowed.has(s.key));
  if (!list.length) {
    subjectChipsDiv.innerHTML = '<span class="picker-error">No questions yet for this class &amp; exam — try another class.</span>';
    state.subjects = [];
    onSubjectsChanged();
    return;
  }
  // Drop any prior selections no longer in this class, then auto-include English.
  state.subjects = state.subjects.filter(lbl => list.some(s => s.label === lbl));
  list.forEach(s => {
    if (COMPULSORY.includes(s.label) && !state.subjects.includes(s.label)) state.subjects.push(s.label);
  });

  list.forEach(s => {
    const isComp = COMPULSORY.includes(s.label);
    const selected = state.subjects.includes(s.label);
    const chip = document.createElement('div');
    chip.className = `custom-chip ${isComp ? 'compulsory' : ''} ${selected ? 'checked' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${s.label}</span><span class="chip-count">${s.count}</span>`;
    if (!isComp) {
      chip.onclick = () => {
        const i = state.subjects.indexOf(s.label);
        if (i !== -1) { state.subjects.splice(i, 1); chip.classList.remove('checked'); }
        else {
          if (state.subjects.length >= MAX_SUBJECTS) { setStatus(`Max ${MAX_SUBJECTS} subjects`, false); return; }
          state.subjects.push(s.label); chip.classList.add('checked');
        }
        onSubjectsChanged();
      };
    } else {
      chip.style.cursor = 'default';
      chip.title = 'Compulsory';
    }
    subjectChipsDiv.appendChild(chip);
  });
  onSubjectsChanged();
}

function onSubjectsChanged() {
  subjectCountSpan.textContent = state.subjects.length;
  doneSubject.classList.toggle('show', state.subjects.length > 0);
  renderYears();
  updateReadyState();
}

// ── 3 · Years (per selected subjects) ──
function renderYears() {
  yearContainer.innerHTML = '';
  if (state.subjects.length === 0) {
    yearContainer.innerHTML = '<span class="picker-hint">Choose subjects to see available years</span>';
    state.year = null;
    doneYear.classList.remove('show');
    return;
  }

  // Merge per-year counts across the selected subjects.
  const merged = {};
  let allCount = 0;
  state.subjects.forEach(label => {
    const key = keyByLabel[label];
    if (!key) return;
    allCount += countByKey[key] || 0;
    (facets.yearsBySubject[key] || []).forEach(({ year, count }) => {
      merged[year] = (merged[year] || 0) + count;
    });
  });
  const years = Object.entries(merged)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year.localeCompare(a.year));

  // Keep any prior selection if still valid, else default to "All Years".
  if (state.year !== 'all' && !years.some(y => y.year === state.year)) state.year = 'all';

  const addChip = (label, value, count) => {
    const chip = document.createElement('div');
    chip.className = `custom-chip year-chip ${state.year === value ? 'checked' : ''}`;
    chip.innerHTML = `<div class="status-dot live"></div><span>${label}</span><span class="chip-count">${count}</span>`;
    chip.onclick = () => {
      document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('checked'));
      chip.classList.add('checked');
      state.year = value;
      doneYear.classList.add('show');
      updateReadyState();
    };
    yearContainer.appendChild(chip);
  };

  addChip('All Years', 'all', allCount);
  years.forEach(y => addChip(y.year, y.year, y.count));
  doneYear.classList.toggle('show', !!state.year);
}

// ── 4 · Format (objective is what past questions provide) ──
function updateTypeVisibility() {
  const isJamb = state.examType === 'JAMB';
  document.querySelectorAll('#type-chips .custom-chip').forEach(chip => {
    const type = chip.getAttribute('data-type');
    if (type === 'theory' || type === 'essay') {
      chip.style.display = isJamb ? 'none' : 'flex';
      if (isJamb) {
        const i = state.types.indexOf(type);
        if (i !== -1) { state.types.splice(i, 1); chip.classList.remove('checked'); }
      }
    }
  });
  doneType.classList.toggle('show', state.types.length > 0);
}

function initTypeToggles() {
  document.querySelectorAll('#type-chips .custom-chip').forEach(chip => {
    const tVal = chip.getAttribute('data-type');
    if (state.types.includes(tVal)) chip.classList.add('checked');
    chip.onclick = (e) => {
      e.stopPropagation();
      const i = state.types.indexOf(tVal);
      if (i !== -1) { state.types.splice(i, 1); chip.classList.remove('checked'); }
      else { state.types.push(tVal); chip.classList.add('checked'); }
      doneType.classList.toggle('show', state.types.length > 0);
      updateReadyState();
    };
  });
  updateTypeVisibility();
}

// ── Generate ──
beginBtn.onclick = () => {
  if (beginBtn.disabled) return;
  const timerOn = document.getElementById('exam-timer-switch')?.checked ? 'on' : 'off';
  const params = new URLSearchParams({
    examType: state.examType,
    subjects: state.subjects.join(','),
    types: state.types.join(','),
    timer: timerOn,
    source: 'aloc',
    n: String(PER_SUBJECT)
  });
  if (state.year && state.year !== 'all') params.set('year', state.year);
  window.location.href = `../question/question.html?${params.toString()}`;
};

function init() {
  buildExamGrid();
  buildStreamGrid();
  initTypeToggles();
  doneExam.classList.remove('show');
  doneStream.classList.remove('show');
  doneYear.classList.remove('show');
  doneSubject.classList.remove('show');
  subjectRow.style.display = 'none';
  updateReadyState();
}

init();
