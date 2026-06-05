// Exam types configuration
// Exam types — labelled by the exam name (the board id is kept internal so the
// data folders + JAMB-specific logic keep working).
const EXAM_TYPES = [
  { id: 'WAEC', name: 'WASSCE', live: true },
  { id: 'NECO', name: 'SSCE', live: false },
  { id: 'JAMB', name: 'UTME', live: true }
];

// Years configuration
const YEARS = Array.from({ length: 16 }, (_, i) => 2010 + i);
const LIVE_YEARS = [2024];

// Subject pools per stream
const BASE_SUBJECTS = {
  science: ['Physics', 'Chemistry', 'Biology', 'Further Mathematics', 'Geography', 'Agricultural Science', 'Technical Drawing'],
  arts: ['Literature in English', 'Government', 'History', 'Christian Religious Studies', 'Yoruba', 'Fine Art', 'Economics'],
  commercial: ['Commerce', 'Financial Accounting', 'Economics', 'Marketing', 'Insurance', 'Business Management', 'Office Practice']
};

const COMPULSORY_CORE = ['Chemistry'];

// Application state
let state = {
  examType: null,
  year: null,
  stream: '',
  subjects: [],
  types: [],
  compulsoryEnabled: true
};

// DOM elements
const examContainer = document.getElementById('exam-chips');
const yearContainer = document.getElementById('year-chips');
const doneExam = document.getElementById('done-exam');
const doneYear = document.getElementById('done-year');
const doneStream = document.getElementById('done-stream');
const doneSubject = document.getElementById('done-subject');
const doneType = document.getElementById('done-type');
const subjectRow = document.getElementById('subject-row');
const subjectChipsDiv = document.getElementById('subject-chips');
const subjectCountSpan = document.getElementById('subject-count');
const beginBtn = document.getElementById('begin-btn');
const setupStatusSpan = document.getElementById('setup-status');
const streamLabelSpan = document.getElementById('stream-label');
const streamBtn = document.getElementById('streamBtn');
const compulsoryToggle = document.getElementById('compulsoryToggle');
const compulsoryHint = document.getElementById('compulsoryHint');

// Helper: get full subject list
function getFullSubjectList(streamKey, compulsoryEnabled) {
  if (!streamKey || !BASE_SUBJECTS[streamKey]) return [];
  const base = [...BASE_SUBJECTS[streamKey]];
  
  if (compulsoryEnabled) {
    // Combine compulsory subjects with base, avoiding duplicates
    const combined = [...COMPULSORY_CORE];
    base.forEach(sub => {
      if (!combined.includes(sub)) combined.push(sub);
    });
    return combined;
  } else {
    const optionalMode = [...COMPULSORY_CORE, ...base];
    const unique = [];
    optionalMode.forEach(sub => {
      if (!unique.includes(sub)) unique.push(sub);
    });
    return unique;
  }
}

function updateReadyState() {
  const examOk = state.examType !== null;
  const yearOk = state.year !== null;
  const streamOk = state.stream !== '';
  const subjectsOk = state.subjects.length > 0;
  const typesOk = state.types.length > 0;
  const ready = examOk && yearOk && streamOk && subjectsOk && typesOk;
  beginBtn.disabled = !ready;
  if (ready) {
    setupStatusSpan.innerHTML = '✓ All set. Ready to generate practice paper.';
    setupStatusSpan.classList.add('ready');
  } else {
    let msg = 'Incomplete: ';
    if (!examOk) msg += 'select exam type • ';
    if (!yearOk) msg += 'select year • ';
    if (!streamOk) msg += 'choose stream • ';
    if (!subjectsOk) msg += 'pick subjects • ';
    if (!typesOk) msg += 'select format';
    setupStatusSpan.innerHTML = msg;
    setupStatusSpan.classList.remove('ready');
  }
}

function renderSubjects() {
  if (!state.stream) return;
  const fullList = getFullSubjectList(state.stream, state.compulsoryEnabled);
  if (!fullList.length) return;
  
  subjectChipsDiv.innerHTML = '';
  let autoSelected = [];
  if (state.compulsoryEnabled) {
    autoSelected = [...COMPULSORY_CORE];
  }
  
  let newSelected = [];
  if (state.compulsoryEnabled) {
    newSelected = [...autoSelected];
    state.subjects.forEach(sub => {
      if (!autoSelected.includes(sub) && fullList.includes(sub) && !newSelected.includes(sub)) {
        newSelected.push(sub);
      }
    });
  } else {
    newSelected = state.subjects.filter(sub => fullList.includes(sub));
  }
  if (newSelected.length > 9) newSelected = newSelected.slice(0, 9);
  state.subjects = newSelected;
  
  fullList.forEach(sub => {
    const isCompulsory = state.compulsoryEnabled && COMPULSORY_CORE.includes(sub);
    const isSelected = state.subjects.includes(sub);
    const chip = document.createElement('div');
    chip.className = `custom-chip ${isCompulsory ? 'compulsory' : ''} ${isSelected ? 'checked' : ''}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${sub}</span>`;
    
    if (!isCompulsory) {
      chip.onclick = () => {
        const idx = state.subjects.indexOf(sub);
        if (idx !== -1) {
          state.subjects.splice(idx, 1);
          chip.classList.remove('checked');
        } else {
          if (state.subjects.length < 9) {
            state.subjects.push(sub);
            chip.classList.add('checked');
          } else {
            setupStatusSpan.innerHTML = 'Max 9 subjects allowed';
            setTimeout(() => updateReadyState(), 700);
            return;
          }
        }
        subjectCountSpan.innerText = state.subjects.length;
        if (state.subjects.length > 0) doneSubject.classList.add('show');
        else doneSubject.classList.remove('show');
        updateReadyState();
      };
    } else {
      chip.style.cursor = 'default';
    }
    subjectChipsDiv.appendChild(chip);
  });
  
  subjectCountSpan.innerText = state.subjects.length;
  if (state.subjects.length > 0) doneSubject.classList.add('show');
  else doneSubject.classList.remove('show');
  
  updateReadyState();
}

function onStreamChange(streamVal, streamText) {
  state.stream = streamVal;
  streamLabelSpan.innerText = streamText;
  doneStream.classList.add('show');
  state.subjects = [];
  doneSubject.classList.remove('show');
  renderSubjects();
  subjectRow.style.display = 'flex';
  updateReadyState();
}

function handleCompulsoryToggle() {
  state.compulsoryEnabled = compulsoryToggle.checked;
  if (state.stream) {
    renderSubjects();
    if (state.compulsoryEnabled) {
      compulsoryHint.innerText = 'English Language & Mathematics are mandatory and always included.';
    } else {
      compulsoryHint.innerText = 'Compulsory mode OFF: English & Mathematics can be selected manually.';
    }
  } else {
    if (state.compulsoryEnabled) compulsoryHint.innerText = 'English & Math are compulsory (will apply after stream selection).';
    else compulsoryHint.innerText = 'Compulsory mode OFF: you may select English & Math from subject list.';
  }
  updateReadyState();
}

function buildExamGrid() {
  examContainer.innerHTML = '';
  EXAM_TYPES.forEach(exam => {
    const chip = document.createElement('div');
    chip.className = `custom-chip exam-chip ${!exam.live ? 'disabled' : ''}`;
    chip.innerHTML = `<div class="status-dot ${exam.live ? 'live' : 'offline'}"></div><span>${exam.name}</span>`;
    if (exam.live) {
      chip.onclick = () => {
        document.querySelectorAll('.exam-chip').forEach(c => c.classList.remove('checked'));
        chip.classList.add('checked');
        state.examType = exam.id;
        doneExam.classList.add('show');
        updateReadyState();
      };
    } else {
      chip.style.pointerEvents = 'none';
      chip.style.opacity = '0.5';
    }
    examContainer.appendChild(chip);
  });
}

function buildYearGrid() {
  yearContainer.innerHTML = '';
  YEARS.forEach(yr => {
    const isLive = LIVE_YEARS.includes(yr);
    const chip = document.createElement('div');
    chip.className = `custom-chip year-chip ${!isLive ? 'disabled' : ''}`;
    chip.innerHTML = `<div class="status-dot ${isLive ? 'live' : 'offline'}"></div><span>${yr}</span>`;
    if (isLive) {
      chip.onclick = () => {
        document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('checked'));
        chip.classList.add('checked');
        state.year = yr;
        doneYear.classList.add('show');
        updateReadyState();
      };
    } else {
      chip.style.pointerEvents = 'none';
    }
    yearContainer.appendChild(chip);
  });
}

function initTypeToggles() {
  const typeChips = document.querySelectorAll('#type-chips .custom-chip');
  
  // Function to update visibility based on exam type
  function updateTypeVisibility() {
    const isJamb = state.examType === 'JAMB'; // Match your exam type ID
    typeChips.forEach(chip => {
      const type = chip.getAttribute('data-type');
      if (type === 'theory' || type === 'essay') {
        if (isJamb) {
          chip.style.display = 'none';
          // If JAMB and theory was selected, deselect it
          const idx = state.types.indexOf(type);
          if (idx !== -1) {
            state.types.splice(idx, 1);
            chip.classList.remove('checked');
          }
        } else {
          chip.style.display = 'flex';
        }
      }
    });
    doneType.classList.toggle('show', state.types.length > 0);
    updateReadyState();
  }
  
  // Initial setup
  typeChips.forEach(chip => {
    chip.onclick = (e) => {
      e.stopPropagation();
      const tVal = chip.getAttribute('data-type');
      const idx = state.types.indexOf(tVal);
      if (idx !== -1) {
        state.types.splice(idx, 1);
        chip.classList.remove('checked');
      } else {
        state.types.push(tVal);
        chip.classList.add('checked');
      }
      doneType.classList.toggle('show', state.types.length > 0);
      updateReadyState();
    };
  });
  
  // Also call this when exam type changes
  // Add this to your exam chip click handler
  const originalExamHandler = null;
  document.querySelectorAll('.exam-chip').forEach(chip => {
    const originalClick = chip.onclick;
    chip.onclick = (e) => {
      if (originalClick) originalClick.call(chip, e);
      updateTypeVisibility();
    };
  });
  
  updateTypeVisibility();
}

function setupDropdown() {
  const wrapper = document.getElementById('csel-stream');
  const btn = streamBtn;
  const items = wrapper.querySelectorAll('.csel-item');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = wrapper.classList.contains('open');
    document.querySelectorAll('.csel.open').forEach(el => {
      if (el !== wrapper) el.classList.remove('open');
    });
    if (isOpen) wrapper.classList.remove('open');
    else wrapper.classList.add('open');
  });
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const streamVal = item.getAttribute('data-val');
      const streamText = item.innerText.trim();
      onStreamChange(streamVal, streamText);
      wrapper.classList.remove('open');
    });
  });
  document.addEventListener('click', function close(e) {
    if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
  });
}

// Generate button handler - REDIRECT to question page with exam type
beginBtn.onclick = () => {
  // Validate all selections before redirect
  if (!state.examType || !state.year || !state.stream || state.subjects.length === 0 || state.types.length === 0) {
    setupStatusSpan.innerHTML = 'Please complete all selections before generating.';
    return;
  }
  
  // Build URL parameters including exam type + the timed-exam preference
  const timerOn = document.getElementById('exam-timer-switch')?.checked ? 'on' : 'off';
  const params = new URLSearchParams({
    examType: state.examType,
    year: state.year,
    stream: state.stream,
    subjects: state.subjects.join(','),
    types: state.types.join(','),
    timer: timerOn
  });
  
  window.location.href = `../question/question.html?${params.toString()}`;
};

function init() {
  buildExamGrid();
  buildYearGrid();
  setupDropdown();
  initTypeToggles();
  compulsoryToggle.addEventListener('change', handleCompulsoryToggle);
  handleCompulsoryToggle();
  
  state = { examType: null, year: null, stream: '', subjects: [], types: [], compulsoryEnabled: true };
  doneExam.classList.remove('show');
  doneYear.classList.remove('show');
  doneStream.classList.remove('show');
  doneSubject.classList.remove('show');
  doneType.classList.remove('show');
  subjectRow.style.display = 'none';
  updateReadyState();
}

init();