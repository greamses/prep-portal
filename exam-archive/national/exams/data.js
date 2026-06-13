// Unified exam builder — national, competition, and international modes.
// All three share one HTML page; this file drives them.
'use strict';

const API_BASE = window.location.port === '5500' ? 'http://127.0.0.1:5000' : '';

// ── Category from URL ───────────────────────────────────────────────
const initialCat = (new URLSearchParams(location.search).get('cat') || 'national').toLowerCase();
let activeCat = initialCat;

// ── Shared DOM refs ─────────────────────────────────────────────────
const beginBtn       = document.getElementById('begin-btn');
const setupStatusSpan= document.getElementById('setup-status');
const builderNote    = document.getElementById('builder-note');
const builderStats   = document.getElementById('builder-stats');
const timerLabel     = document.getElementById('timer-label');
const timerSwitch    = document.getElementById('exam-timer-switch');

function setStatus(msg, ready) {
  setupStatusSpan.textContent = msg;
  setupStatusSpan.classList.toggle('ready', !!ready);
}

// ── Category switching ───────────────────────────────────────────────
function applyCat(cat) {
  document.querySelectorAll('.cat-tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === cat)
  );
  // Show only the active category's inline elements.
  // Use style.display so inline style wins over any author CSS (display:grid, flex, etc.)
  document.querySelectorAll('[data-cat]').forEach(el => {
    el.style.display = el.dataset.cat !== cat ? 'none' : '';
  });
  // Step-3 rows are always hidden initially; each mode reveals them at the right time
  document.getElementById('subject-row').style.display       = 'none';
  document.getElementById('year-row').style.display          = 'none';
  document.getElementById('subject-row-intl').style.display  = 'none';

  const u = new URL(location.href);
  u.searchParams.set('cat', cat);
  history.replaceState(null, '', u);
}

const HEADER_CONTENT = {
  national: {
    note: 'Pick a board, a year & your subjects — we\'ll generate a practice paper, marked by AI.',
    stats: `
      <span class="hero-stat theme-blue"><strong>2023&ndash;25</strong> Live exams</span>
      <span class="hero-stat theme-green"><strong>SSCE/JAMB</strong> Standard</span>
      <span class="hero-stat theme-red"><strong>AI</strong> Marking</span>`,
    ctaLabel: 'Generate practice paper →',
    timerLabel: 'Timed exam (auto-submit)'
  },
  competition: {
    note: 'Pick a competition, your level & round — start practising the exact paper.',
    stats: `
      <span class="hero-stat theme-blue"><strong>Scholastic</strong> Awards</span>
      <span class="hero-stat theme-green"><strong>ANMC</strong> Upper Primary</span>
      <span class="hero-stat theme-red"><strong>Olympiad</strong> Coming soon</span>`,
    ctaLabel: 'Start practice →',
    timerLabel: 'Timed practice'
  },
  international: {
    note: 'Pick an exam board, your level & subject — practise the actual paper.',
    stats: `
      <span class="hero-stat theme-blue"><strong>Cambridge</strong> Live</span>
      <span class="hero-stat theme-green"><strong>IGCSE</strong> Coming soon</span>
      <span class="hero-stat theme-red"><strong>SAT</strong> Coming soon</span>`,
    ctaLabel: 'Open paper →',
    timerLabel: 'Timed practice'
  }
};

function updateHeaderContent(cat) {
  const h = HEADER_CONTENT[cat] || HEADER_CONTENT.national;
  builderNote.textContent = h.note;
  builderStats.innerHTML  = h.stats;
  beginBtn.textContent    = h.ctaLabel;
  if (timerLabel) timerLabel.textContent = h.timerLabel;
}

// ════════════════════════════════════════════════════════════════════
//  NATIONAL MODE
// ════════════════════════════════════════════════════════════════════

const EXAM_TYPES = [
  { id: 'WAEC', name: 'WASSCE', queryType: 'wassce', live: true },
  { id: 'NECO', name: 'SSCE',   queryType: 'wassce', live: false },
  { id: 'JAMB', name: 'UTME',   queryType: 'utme',   live: true }
];
const COMPULSORY    = ['English Language'];
const MAX_SUBJECTS  = 9;
const PER_SUBJECT   = 15;
const CORE_SUBJECTS = ['english', 'mathematics'];
const STREAM_SUBJECTS = {
  science:    ['physics', 'chemistry', 'biology', 'geography'],
  commercial: ['commerce', 'accounting', 'economics', 'insurance'],
  arts:       ['englishlit', 'government', 'history', 'crk', 'irk', 'civiledu', 'currentaffairs', 'economics']
};
const STREAMS = [
  { id: 'science',    name: 'Science' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'arts',       name: 'Arts / Humanities' }
];

let natState = {
  examType: null, queryType: null, stream: null,
  subjects: [], year: null, types: ['objective']
};
let facets = null;
let countByKey = {}, keyByLabel = {};

const examContainer    = () => document.getElementById('exam-chips');
const streamContainer  = () => document.getElementById('stream-chips');
const yearContainerNat = () => document.getElementById('year-chips');
const subjectChipsDiv  = () => document.getElementById('subject-chips');
const subjectCountSpan = () => document.getElementById('subject-count');
const subjectRow       = () => document.getElementById('subject-row');
const doneExam    = () => document.getElementById('done-exam');
const doneStream  = () => document.getElementById('done-stream');
const doneYearNat = () => document.getElementById('done-year');
const doneSubject = () => document.getElementById('done-subject');
const doneType    = () => document.getElementById('done-type');

function natUpdateReadyState() {
  const ready = natState.examType && natState.stream && natState.subjects.length > 0
    && natState.year && natState.types.length > 0;
  beginBtn.disabled = !ready;
  if (ready) { setStatus('✓ All set. Ready to generate practice paper.', true); return; }
  const need = [];
  if (!natState.examType)           need.push('exam type');
  if (!natState.stream)             need.push('class');
  if (!natState.subjects.length)    need.push('subjects');
  if (!natState.year)               need.push('year');
  if (!natState.types.length)       need.push('format');
  setStatus('Select: ' + need.join(' • '), false);
}

function buildExamGrid() {
  examContainer().innerHTML = '';
  EXAM_TYPES.forEach(exam => {
    const chip = document.createElement('div');
    chip.className = `custom-chip exam-chip${!exam.live ? ' disabled' : ''}`;
    chip.innerHTML = `<div class="status-dot ${exam.live ? 'live' : 'offline'}"></div><span>${exam.name}</span>`;
    if (exam.live) {
      chip.onclick = () => selectExam(exam, chip);
    } else {
      chip.style.pointerEvents = 'none';
      chip.style.opacity = '0.5';
    }
    examContainer().appendChild(chip);
  });
}

async function selectExam(exam, chip) {
  examContainer().querySelectorAll('.exam-chip').forEach(c => c.classList.remove('checked'));
  chip.classList.add('checked');
  natState.examType = exam.id;
  natState.queryType = exam.queryType;
  natState.subjects = []; natState.year = null;
  doneExam().classList.add('show');
  doneSubject().classList.remove('show');
  doneYearNat().classList.remove('show');
  yearContainerNat().innerHTML = '<span class="picker-hint">Choose subjects to see available years</span>';
  subjectRow().style.display = "flex";
  subjectChipsDiv().innerHTML = '<span class="picker-hint">Loading subjects…</span>';
  natUpdateReadyState();
  natUpdateTypeVisibility();
  try {
    const res = await fetch(`${API_BASE}/api/questions/facets?type=${natState.queryType}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    facets = await res.json();
    countByKey = {}; keyByLabel = {};
    facets.subjects.forEach(s => { countByKey[s.key] = s.count; keyByLabel[s.label] = s.key; });
    maybeRenderSubjects();
  } catch (e) {
    subjectChipsDiv().innerHTML = '<span class="picker-error">Could not load subjects. Is the server running?</span>';
  }
}

function buildStreamGrid() {
  streamContainer().innerHTML = '';
  STREAMS.forEach(st => {
    const chip = document.createElement('div');
    chip.className = 'custom-chip stream-chip';
    chip.innerHTML = `<div class="chip-check-box"></div><span>${st.name}</span>`;
    chip.onclick = () => {
      streamContainer().querySelectorAll('.stream-chip').forEach(c => c.classList.remove('checked'));
      chip.classList.add('checked');
      natState.stream = st.id;
      natState.subjects = []; natState.year = null;
      doneStream().classList.add('show');
      doneSubject().classList.remove('show');
      doneYearNat().classList.remove('show');
      yearContainerNat().innerHTML = '<span class="picker-hint">Choose subjects to see available years</span>';
      maybeRenderSubjects();
      natUpdateReadyState();
    };
    streamContainer().appendChild(chip);
  });
}

function maybeRenderSubjects() {
  if (!natState.examType) { subjectChipsDiv().innerHTML = '<span class="picker-hint">Select an exam type first.</span>'; return; }
  if (!facets)            { subjectChipsDiv().innerHTML = '<span class="picker-hint">Loading subjects…</span>'; return; }
  if (!natState.stream)   { subjectChipsDiv().innerHTML = '<span class="picker-hint">Select your class to see its subjects.</span>'; return; }
  renderNatSubjects();
}

function renderNatSubjects() {
  subjectChipsDiv().innerHTML = '';
  const allowed = new Set([...CORE_SUBJECTS, ...(STREAM_SUBJECTS[natState.stream] || [])]);
  const list = (facets ? facets.subjects : []).filter(s => allowed.has(s.key));
  if (!list.length) {
    subjectChipsDiv().innerHTML = '<span class="picker-error">No questions yet for this class &amp; exam — try another class.</span>';
    natState.subjects = [];
    onNatSubjectsChanged();
    return;
  }
  natState.subjects = natState.subjects.filter(lbl => list.some(s => s.label === lbl));
  list.forEach(s => {
    if (COMPULSORY.includes(s.label) && !natState.subjects.includes(s.label)) natState.subjects.push(s.label);
  });
  list.forEach(s => {
    const isComp = COMPULSORY.includes(s.label);
    const selected = natState.subjects.includes(s.label);
    const chip = document.createElement('div');
    chip.className = `custom-chip ${isComp ? 'compulsory' : ''} ${selected ? 'checked' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${s.label}</span><span class="chip-count">${s.count}</span>`;
    if (!isComp) {
      chip.onclick = () => {
        const i = natState.subjects.indexOf(s.label);
        if (i !== -1) { natState.subjects.splice(i, 1); chip.classList.remove('checked'); }
        else {
          if (natState.subjects.length >= MAX_SUBJECTS) { setStatus(`Max ${MAX_SUBJECTS} subjects`, false); return; }
          natState.subjects.push(s.label); chip.classList.add('checked');
        }
        onNatSubjectsChanged();
      };
    } else {
      chip.style.cursor = 'default';
      chip.title = 'Compulsory';
    }
    subjectChipsDiv().appendChild(chip);
  });
  onNatSubjectsChanged();
}

function onNatSubjectsChanged() {
  subjectCountSpan().textContent = natState.subjects.length;
  doneSubject().classList.toggle('show', natState.subjects.length > 0);
  renderNatYears();
  natUpdateReadyState();
}

function renderNatYears() {
  yearContainerNat().innerHTML = '';
  if (!natState.subjects.length) {
    yearContainerNat().innerHTML = '<span class="picker-hint">Choose subjects to see available years</span>';
    natState.year = null; doneYearNat().classList.remove('show'); return;
  }
  const merged = {};
  let allCount = 0;
  natState.subjects.forEach(label => {
    const key = keyByLabel[label];
    if (!key) return;
    allCount += countByKey[key] || 0;
    (facets.yearsBySubject[key] || []).forEach(({ year, count }) => { merged[year] = (merged[year] || 0) + count; });
  });
  const years = Object.entries(merged).map(([year, count]) => ({ year, count })).sort((a, b) => b.year.localeCompare(a.year));
  if (natState.year !== 'all' && !years.some(y => y.year === natState.year)) natState.year = 'all';
  const addChip = (label, value, count) => {
    const chip = document.createElement('div');
    chip.className = `custom-chip year-chip ${natState.year === value ? 'checked' : ''}`;
    chip.innerHTML = `<div class="status-dot live"></div><span>${label}</span><span class="chip-count">${count}</span>`;
    chip.onclick = () => {
      yearContainerNat().querySelectorAll('.year-chip').forEach(c => c.classList.remove('checked'));
      chip.classList.add('checked');
      natState.year = value; doneYearNat().classList.add('show');
      natUpdateReadyState();
    };
    yearContainerNat().appendChild(chip);
  };
  addChip('All Years', 'all', allCount);
  years.forEach(y => addChip(y.year, y.year, y.count));
  doneYearNat().classList.toggle('show', !!natState.year);
}

function natUpdateTypeVisibility() {
  const isJamb = natState.examType === 'JAMB';
  document.querySelectorAll('#type-chips .custom-chip').forEach(chip => {
    const type = chip.getAttribute('data-type');
    if (type === 'theory' || type === 'essay') {
      chip.style.display = isJamb ? 'none' : 'flex';
      if (isJamb) {
        const i = natState.types.indexOf(type);
        if (i !== -1) { natState.types.splice(i, 1); chip.classList.remove('checked'); }
      }
    }
  });
  doneType().classList.toggle('show', natState.types.length > 0);
}

function initTypeToggles() {
  document.querySelectorAll('#type-chips .custom-chip').forEach(chip => {
    const tVal = chip.getAttribute('data-type');
    if (natState.types.includes(tVal)) chip.classList.add('checked');
    chip.onclick = e => {
      e.stopPropagation();
      const i = natState.types.indexOf(tVal);
      if (i !== -1) { natState.types.splice(i, 1); chip.classList.remove('checked'); }
      else           { natState.types.push(tVal);  chip.classList.add('checked'); }
      doneType().classList.toggle('show', natState.types.length > 0);
      natUpdateReadyState();
    };
  });
  natUpdateTypeVisibility();
}

function initNational() {
  natState = { examType: null, queryType: null, stream: null, subjects: [], year: null, types: ['objective'] };
  facets = null; countByKey = {}; keyByLabel = {};
  buildExamGrid();
  buildStreamGrid();
  initTypeToggles();
  ['done-exam','done-stream','done-year','done-subject'].forEach(id => document.getElementById(id)?.classList.remove('show'));
  subjectRow().style.display = "none";
  yearContainerNat().innerHTML = '<span class="picker-hint">Choose subjects to see available years</span>';
  natUpdateReadyState();
}

// ════════════════════════════════════════════════════════════════════
//  COMPETITION MODE
// ════════════════════════════════════════════════════════════════════

const COMP_REGISTRY = {
  scholastic: {
    name: 'Scholastic Awards', live: true,
    divisions: {
      'upper-primary':    { name: 'Upper Primary',    live: true,  years: { '2025': { rounds: [{ id: 'first-Round', name: 'First Round', live: true }, { id: 'finals', name: 'Finals', live: true }] } } },
      'junior-secondary': { name: 'Junior Secondary', live: false, years: {} },
      'senior-secondary': { name: 'Senior Secondary', live: false, years: {} }
    }
  },
  anmc: {
    name: 'ANMC', live: true,
    divisions: {
      'upper-primary': {
        name: 'Upper Primary', live: true,
        years: {
          '14th': { rounds: [{ id: 'main', name: 'Main Paper', live: true }] },
          '13th': { rounds: [
            { id: 'first-round', name: 'First Round', live: true },
            { id: 'finals', name: 'Finals', live: true }
          ]},
          '12th': { rounds: [{ id: 'main', name: 'Main Paper', live: true }] }
        }
      }
    }
  },
  olympiad:{ name: 'National Olympiad', live: false, divisions: {} },
  tulip:   { name: 'Tulip Contest',     live: false, divisions: {} }
};

const SECTIONS = [
  { id: 'all',     name: 'All Sections' },
  { id: 'math',    name: 'Mathematics' },
  { id: 'english', name: 'English' },
  { id: 'science', name: 'Science' },
  { id: 'general', name: 'General Knowledge' }
];

let compState = { competition: null, division: null, year: null, round: null, section: 'all' };

const compContainer      = () => document.getElementById('comp-chips');
const divisionContainer  = () => document.getElementById('division-chips');
const yearContainerComp  = () => document.getElementById('year-chips-comp');
const roundContainer     = () => document.getElementById('round-chips');
const sectionContainer   = () => document.getElementById('section-chips');
const yearRowEl          = () => document.getElementById('year-row');
const doneComp           = () => document.getElementById('done-comp');
const doneDivision       = () => document.getElementById('done-division');
const doneYearComp       = () => document.getElementById('done-year-comp');
const doneRound          = () => document.getElementById('done-round');
const doneSection        = () => document.getElementById('done-section');

function compUpdateReadyState() {
  const ready = compState.competition && compState.division && compState.year && compState.round;
  beginBtn.disabled = !ready;
  if (ready) { setStatus('✓ All set. Ready to start.', true); return; }
  const need = [];
  if (!compState.competition) need.push('competition');
  if (!compState.division)    need.push('division');
  if (!compState.year)        need.push('year');
  if (!compState.round)       need.push('round');
  setStatus('Select: ' + need.join(' • '), false);
}

function buildCompGrid() {
  compContainer().innerHTML = '';
  Object.entries(COMP_REGISTRY).forEach(([id, comp]) => {
    const chip = document.createElement('div');
    chip.className = `custom-chip comp-chip${!comp.live ? ' disabled' : ''}`;
    chip.innerHTML = `<div class="status-dot ${comp.live ? 'live' : 'offline'}"></div><span>${comp.name}</span>`;
    if (comp.live) chip.onclick = () => selectComp(id, chip);
    else { chip.style.pointerEvents = 'none'; chip.style.opacity = '0.5'; }
    compContainer().appendChild(chip);
  });
}

function selectComp(id, chip) {
  compContainer().querySelectorAll('.comp-chip').forEach(c => c.classList.remove('checked'));
  chip.classList.add('checked');
  compState.competition = id; compState.division = null; compState.year = null; compState.round = null;
  doneComp().classList.add('show');
  ['done-division','done-year-comp','done-round'].forEach(id => document.getElementById(id)?.classList.remove('show'));
  buildDivisionGrid();
  compResetYearRound();
  compUpdateReadyState();
}

function buildDivisionGrid() {
  divisionContainer().innerHTML = '';
  const comp = COMP_REGISTRY[compState.competition];
  if (!comp) { divisionContainer().innerHTML = '<span class="picker-hint">Select a competition first.</span>'; return; }
  Object.entries(comp.divisions).forEach(([id, div]) => {
    const chip = document.createElement('div');
    chip.className = `custom-chip division-chip${!div.live ? ' disabled' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${div.name}</span>`;
    if (div.live) chip.onclick = () => selectDivision(id, chip);
    else { chip.style.pointerEvents = 'none'; chip.style.opacity = '0.5'; }
    divisionContainer().appendChild(chip);
  });
}

function selectDivision(id, chip) {
  divisionContainer().querySelectorAll('.division-chip').forEach(c => c.classList.remove('checked'));
  chip.classList.add('checked');
  compState.division = id; compState.year = null; compState.round = null;
  doneDivision().classList.add('show');
  ['done-year-comp','done-round'].forEach(id => document.getElementById(id)?.classList.remove('show'));
  yearRowEl().style.display = "flex";
  buildCompYearGrid();
  roundContainer().innerHTML = '<span class="picker-hint">Choose a year first</span>';
  compUpdateReadyState();
}

function buildCompYearGrid() {
  yearContainerComp().innerHTML = '';
  const div = COMP_REGISTRY[compState.competition]?.divisions[compState.division];
  if (!div) return;
  const years = Object.keys(div.years).sort((a, b) => b - a);
  if (!years.length) { yearContainerComp().innerHTML = '<span class="picker-hint">No papers available yet for this division.</span>'; return; }
  years.forEach(year => {
    const chip = document.createElement('div');
    chip.className = `custom-chip year-chip${compState.year === year ? ' checked' : ''}`;
    chip.innerHTML = `<div class="status-dot live"></div><span>${year}</span>`;
    chip.onclick = () => {
      yearContainerComp().querySelectorAll('.year-chip').forEach(c => c.classList.remove('checked'));
      chip.classList.add('checked');
      compState.year = year; compState.round = null;
      doneYearComp().classList.add('show');
      document.getElementById('done-round')?.classList.remove('show');
      buildRoundGrid();
      compUpdateReadyState();
    };
    yearContainerComp().appendChild(chip);
  });
}

function buildRoundGrid() {
  roundContainer().innerHTML = '';
  const yearData = COMP_REGISTRY[compState.competition]?.divisions[compState.division]?.years[compState.year];
  if (!yearData?.rounds.length) { roundContainer().innerHTML = '<span class="picker-hint">No rounds available yet.</span>'; return; }
  yearData.rounds.forEach(round => {
    const chip = document.createElement('div');
    chip.className = `custom-chip round-chip${!round.live ? ' disabled' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${round.name}</span>`;
    if (round.live) {
      chip.onclick = () => {
        roundContainer().querySelectorAll('.round-chip').forEach(c => c.classList.remove('checked'));
        chip.classList.add('checked');
        compState.round = round.id;
        doneRound().classList.add('show');
        compUpdateReadyState();
      };
    } else {
      chip.style.pointerEvents = 'none'; chip.style.opacity = '0.5';
    }
    roundContainer().appendChild(chip);
  });
}

function buildSectionGrid() {
  sectionContainer().innerHTML = '';
  SECTIONS.forEach(sec => {
    const chip = document.createElement('div');
    chip.className = `custom-chip section-chip${compState.section === sec.id ? ' checked' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${sec.name}</span>`;
    chip.onclick = () => {
      sectionContainer().querySelectorAll('.section-chip').forEach(c => c.classList.remove('checked'));
      chip.classList.add('checked');
      compState.section = sec.id;
      doneSection().classList.add('show');
    };
    sectionContainer().appendChild(chip);
  });
}

function compResetYearRound() {
  yearRowEl().style.display = "none";
  yearContainerComp().innerHTML = '<span class="picker-hint">Choose a division first</span>';
  roundContainer().innerHTML = '<span class="picker-hint">Choose a year to see rounds</span>';
}

function initCompetition() {
  compState = { competition: null, division: null, year: null, round: null, section: 'all' };
  buildCompGrid();
  divisionContainer().innerHTML = '<span class="picker-hint">Select a competition first.</span>';
  roundContainer().innerHTML = '<span class="picker-hint">Choose a year to see rounds</span>';
  compResetYearRound();
  buildSectionGrid();
  ['done-comp','done-division','done-year-comp','done-round'].forEach(id => document.getElementById(id)?.classList.remove('show'));
  document.getElementById('done-section')?.classList.add('show');
  compUpdateReadyState();
}

// ════════════════════════════════════════════════════════════════════
//  INTERNATIONAL MODE
// ════════════════════════════════════════════════════════════════════

const INTL_REGISTRY = {
  cambridge: {
    name: 'Cambridge', live: true,
    levels: {
      'upper-secondary': {
        name: 'Upper Secondary', live: true,
        subjects: {
          mathematics: { name: 'Mathematics', live: true, years: { '2025': [{ id: 'standard', name: 'Standard Paper', live: true, url: '/exam-archive/international/cambridge/index.html' }] } },
          english:     { name: 'English Language', live: false, years: {} },
          physics:     { name: 'Physics',          live: false, years: {} }
        }
      },
      'lower-secondary': { name: 'Lower Secondary', live: false, subjects: {} },
      'a-level':         { name: 'A-Level',          live: false, subjects: {} }
    }
  },
  igcse: { name: 'IGCSE',     live: false, levels: {} },
  sat:   { name: 'SAT / ACT', live: false, levels: {} },
  ib:    { name: 'IB',        live: false, levels: {} }
};

let intlState = { board: null, level: null, subject: null, year: null, paper: null, paperUrl: null };

const boardContainer      = () => document.getElementById('board-chips');
const levelContainer      = () => document.getElementById('level-chips');
const subjectContainerIntl= () => document.getElementById('subject-chips-intl');
const yearContainerIntl   = () => document.getElementById('year-chips-intl');
const paperContainer      = () => document.getElementById('paper-chips');
const subjectRowIntl      = () => document.getElementById('subject-row-intl');
const doneBoard           = () => document.getElementById('done-board');
const doneLevel           = () => document.getElementById('done-level');
const doneSubjectIntl     = () => document.getElementById('done-subject-intl');
const doneYearIntl        = () => document.getElementById('done-year-intl');
const donePaper           = () => document.getElementById('done-paper');

function intlUpdateReadyState() {
  const ready = intlState.board && intlState.level && intlState.subject && intlState.year && intlState.paper;
  beginBtn.disabled = !ready;
  if (ready) { setStatus('✓ All set. Ready to open paper.', true); return; }
  const need = [];
  if (!intlState.board)   need.push('board');
  if (!intlState.level)   need.push('level');
  if (!intlState.subject) need.push('subject');
  if (!intlState.year)    need.push('year');
  if (!intlState.paper)   need.push('paper');
  setStatus('Select: ' + need.join(' • '), false);
}

function buildBoardGrid() {
  boardContainer().innerHTML = '';
  Object.entries(INTL_REGISTRY).forEach(([id, board]) => {
    const chip = document.createElement('div');
    chip.className = `custom-chip board-chip${!board.live ? ' disabled' : ''}`;
    chip.innerHTML = `<div class="status-dot ${board.live ? 'live' : 'offline'}"></div><span>${board.name}</span>`;
    if (board.live) chip.onclick = () => selectBoard(id, chip);
    else { chip.style.pointerEvents = 'none'; chip.style.opacity = '0.5'; }
    boardContainer().appendChild(chip);
  });
}

function selectBoard(id, chip) {
  boardContainer().querySelectorAll('.board-chip').forEach(c => c.classList.remove('checked'));
  chip.classList.add('checked');
  intlState.board = id; intlState.level = null; intlState.subject = null; intlState.year = null; intlState.paper = null;
  doneBoard().classList.add('show');
  ['done-level','done-subject-intl','done-year-intl','done-paper'].forEach(id => document.getElementById(id)?.classList.remove('show'));
  buildLevelGrid();
  subjectRowIntl().style.display = "none";
  yearContainerIntl().innerHTML = '<span class="picker-hint">Choose a subject to see years</span>';
  paperContainer().innerHTML = '<span class="picker-hint">Choose a year to see papers</span>';
  intlUpdateReadyState();
}

function buildLevelGrid() {
  levelContainer().innerHTML = '';
  const board = INTL_REGISTRY[intlState.board];
  if (!board) { levelContainer().innerHTML = '<span class="picker-hint">Select a board first.</span>'; return; }
  Object.entries(board.levels).forEach(([id, level]) => {
    const chip = document.createElement('div');
    chip.className = `custom-chip level-chip${!level.live ? ' disabled' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${level.name}</span>`;
    if (level.live) chip.onclick = () => selectLevel(id, chip);
    else { chip.style.pointerEvents = 'none'; chip.style.opacity = '0.5'; }
    levelContainer().appendChild(chip);
  });
}

function selectLevel(id, chip) {
  levelContainer().querySelectorAll('.level-chip').forEach(c => c.classList.remove('checked'));
  chip.classList.add('checked');
  intlState.level = id; intlState.subject = null; intlState.year = null; intlState.paper = null;
  doneLevel().classList.add('show');
  ['done-subject-intl','done-year-intl','done-paper'].forEach(id => document.getElementById(id)?.classList.remove('show'));
  subjectRowIntl().style.display = "flex";
  buildIntlSubjectGrid();
  yearContainerIntl().innerHTML = '<span class="picker-hint">Choose a subject to see years</span>';
  paperContainer().innerHTML = '<span class="picker-hint">Choose a year to see papers</span>';
  intlUpdateReadyState();
}

function buildIntlSubjectGrid() {
  subjectContainerIntl().innerHTML = '';
  const subjects = INTL_REGISTRY[intlState.board]?.levels[intlState.level]?.subjects;
  if (!subjects || !Object.keys(subjects).length) {
    subjectContainerIntl().innerHTML = '<span class="picker-hint">No subjects available for this level yet.</span>';
    return;
  }
  Object.entries(subjects).forEach(([id, sub]) => {
    const chip = document.createElement('div');
    chip.className = `custom-chip subject-chip${!sub.live ? ' disabled' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${sub.name}</span>`;
    if (sub.live) chip.onclick = () => selectIntlSubject(id, chip);
    else { chip.style.pointerEvents = 'none'; chip.style.opacity = '0.5'; }
    subjectContainerIntl().appendChild(chip);
  });
}

function selectIntlSubject(id, chip) {
  subjectContainerIntl().querySelectorAll('.subject-chip').forEach(c => c.classList.remove('checked'));
  chip.classList.add('checked');
  intlState.subject = id; intlState.year = null; intlState.paper = null;
  doneSubjectIntl().classList.add('show');
  ['done-year-intl','done-paper'].forEach(id => document.getElementById(id)?.classList.remove('show'));
  buildIntlYearGrid();
  paperContainer().innerHTML = '<span class="picker-hint">Choose a year to see papers</span>';
  intlUpdateReadyState();
}

function buildIntlYearGrid() {
  yearContainerIntl().innerHTML = '';
  const years = INTL_REGISTRY[intlState.board]?.levels[intlState.level]?.subjects[intlState.subject]?.years;
  if (!years || !Object.keys(years).length) { yearContainerIntl().innerHTML = '<span class="picker-hint">No years available yet.</span>'; return; }
  Object.keys(years).sort((a, b) => b - a).forEach(year => {
    const chip = document.createElement('div');
    chip.className = `custom-chip year-chip${intlState.year === year ? ' checked' : ''}`;
    chip.innerHTML = `<div class="status-dot live"></div><span>${year}</span>`;
    chip.onclick = () => {
      yearContainerIntl().querySelectorAll('.year-chip').forEach(c => c.classList.remove('checked'));
      chip.classList.add('checked');
      intlState.year = year; intlState.paper = null;
      doneYearIntl().classList.add('show');
      document.getElementById('done-paper')?.classList.remove('show');
      buildPaperGrid();
      intlUpdateReadyState();
    };
    yearContainerIntl().appendChild(chip);
  });
}

function buildPaperGrid() {
  paperContainer().innerHTML = '';
  const papers = INTL_REGISTRY[intlState.board]?.levels[intlState.level]?.subjects[intlState.subject]?.years[intlState.year];
  if (!papers?.length) { paperContainer().innerHTML = '<span class="picker-hint">No papers available yet.</span>'; return; }
  papers.forEach(paper => {
    const chip = document.createElement('div');
    chip.className = `custom-chip paper-chip${!paper.live ? ' disabled' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${paper.name}</span>`;
    if (paper.live) {
      chip.onclick = () => {
        paperContainer().querySelectorAll('.paper-chip').forEach(c => c.classList.remove('checked'));
        chip.classList.add('checked');
        intlState.paper = paper.id;
        intlState.paperUrl = paper.url;
        donePaper().classList.add('show');
        intlUpdateReadyState();
      };
    } else {
      chip.style.pointerEvents = 'none'; chip.style.opacity = '0.5';
    }
    paperContainer().appendChild(chip);
  });
}

function initInternational() {
  intlState = { board: null, level: null, subject: null, year: null, paper: null, paperUrl: null };
  buildBoardGrid();
  levelContainer().innerHTML    = '<span class="picker-hint">Select a board first.</span>';
  yearContainerIntl().innerHTML = '<span class="picker-hint">Choose a subject to see years</span>';
  paperContainer().innerHTML    = '<span class="picker-hint">Choose a year to see papers</span>';
  subjectRowIntl().style.display = "none";
  ['done-board','done-level','done-subject-intl','done-year-intl','done-paper'].forEach(id =>
    document.getElementById(id)?.classList.remove('show')
  );
  intlUpdateReadyState();
}

// ════════════════════════════════════════════════════════════════════
//  UNIFIED: begin button + category wiring
// ════════════════════════════════════════════════════════════════════

beginBtn.onclick = () => {
  if (beginBtn.disabled) return;
  const timerOn = timerSwitch?.checked ? 'on' : 'off';

  if (activeCat === 'national') {
    const params = new URLSearchParams({
      examType: natState.examType,
      subjects: natState.subjects.join(','),
      types:    natState.types.join(','),
      timer:    timerOn,
      source:   'aloc',
      n:        String(PER_SUBJECT)
    });
    if (natState.year && natState.year !== 'all') params.set('year', natState.year);
    window.location.href = `../question/question.html?${params.toString()}`;
    return;
  }

  if (activeCat === 'competition') {
    const { competition, division, year, round, section } = compState;
    const params = new URLSearchParams({ source: 'competition', comp: competition, div: division, year, round, section, timer: timerOn });
    window.location.href = `../question/question.html?${params.toString()}`;
    return;
  }

  if (activeCat === 'international') {
    if (!intlState.paperUrl) return;
    const url = intlState.paperUrl + (timerOn === 'on' ? '?timer=on' : '');
    window.location.href = url;
  }
};

function initMode(cat) {
  if (cat === 'national')       initNational();
  else if (cat === 'competition')   initCompetition();
  else if (cat === 'international') initInternational();
  setStatus('Awaiting selections...', false);
  beginBtn.disabled = true;
}

// ── Category tab clicks ────────────────────────────────────────────
document.querySelectorAll('.cat-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.tab;
    if (cat === activeCat) return;
    activeCat = cat;
    applyCat(cat);
    updateHeaderContent(cat);
    initMode(cat);
  });
});

// ── Bootstrap ──────────────────────────────────────────────────────
applyCat(initialCat);
updateHeaderContent(initialCat);
initMode(initialCat);
