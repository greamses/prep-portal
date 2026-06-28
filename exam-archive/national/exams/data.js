// Unified exam builder — national, competition, and international modes.
// All three share one HTML page; this file drives them.
"use strict";

const API_BASE = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";

// ── Category from URL ───────────────────────────────────────────────
const initialCat = (
  new URLSearchParams(location.search).get("cat") || "national"
).toLowerCase();
let activeCat = initialCat;

// ── Shared DOM refs ─────────────────────────────────────────────────
const beginBtn = document.getElementById("begin-btn");
const setupStatusSpan = document.getElementById("setup-status");
const builderNote = document.getElementById("builder-note");
const builderStats = document.getElementById("builder-stats");

function setStatus(msg, ready) {
  setupStatusSpan.textContent = msg;
  setupStatusSpan.classList.toggle("ready", !!ready);
}

// ── Category switching ───────────────────────────────────────────────
function applyCat(cat) {
  document
    .querySelectorAll(".cat-tab")
    .forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === cat));
  // National and International both run the same CBT builder (our own data), so
  // always show the "national" cards and hide the legacy competition/intl ones.
  document.querySelectorAll('[data-cat="national"]').forEach((el) => { el.style.display = ""; });
  document
    .querySelectorAll('[data-cat="competition"],[data-cat="international"]')
    .forEach((el) => { el.style.display = "none"; });
  document.getElementById("subject-row").style.display = "none";
  document.getElementById("year-row").style.display = "none";
  document.getElementById("subject-row-intl").style.display = "none";

  const u = new URL(location.href);
  u.searchParams.set("cat", cat);
  history.replaceState(null, "", u);
}

const HEADER_CONTENT = {
  national: {
    note: "Pick a scheme, paper & subjects — we'll build an original practice test, marked instantly.",
    stats: `
      <span class="hero-stat theme-blue"><strong>UTME</strong>-style</span>
      <span class="hero-stat theme-green"><strong>WASSCE</strong>-style</span>
      <span class="hero-stat theme-red"><strong>AI</strong> Written</span>`,
    ctaLabel: "Start practice test",
  },
  competition: {
    note: "Pick a competition, your level & round — start practising the exact paper.",
    stats: `
      <span class="hero-stat theme-blue"><strong>Scholastic</strong> Awards</span>
      <span class="hero-stat theme-green"><strong>ANMC</strong> Upper Primary</span>
      <span class="hero-stat theme-red"><strong>Olympiad</strong> Coming soon</span>`,
    ctaLabel: "Start practice",
  },
  international: {
    note: "Pick a scheme, paper & subjects — we'll build an original practice test, marked instantly.",
    stats: `
      <span class="hero-stat theme-blue"><strong>SAT</strong>-style</span>
      <span class="hero-stat theme-green"><strong>IGCSE</strong>-style</span>
      <span class="hero-stat theme-red"><strong>A-Level</strong>-style</span>`,
    ctaLabel: "Start practice test",
  },
  practice: {
    note: "A mixed revision bank — pick subjects & how many questions for an instant, marked practice set (not tied to any exam).",
    stats: `
      <span class="hero-stat theme-blue"><strong>All</strong> subjects</span>
      <span class="hero-stat theme-green"><strong>Mixed</strong> difficulty</span>
      <span class="hero-stat theme-red"><strong>AI</strong> Written</span>`,
    ctaLabel: "Start practice",
  },
};

function updateHeaderContent(cat) {
  const h = HEADER_CONTENT[cat] || HEADER_CONTENT.national;
  builderNote.textContent = h.note;
  builderStats.innerHTML = h.stats;
  const ctaLabelEl = beginBtn.querySelector(".cta-label");
  if (ctaLabelEl) ctaLabelEl.textContent = h.ctaLabel;
  else beginBtn.textContent = h.ctaLabel;
}

// ════════════════════════════════════════════════════════════════════
//  NATIONAL MODE
// ════════════════════════════════════════════════════════════════════

const NAT_EXAM_TYPES = [
  { id: "utme", name: "UTME-style", queryType: "utme", live: true },
  { id: "wassce", name: "WASSCE-style", queryType: "wassce", live: true },
  { id: "postutme", name: "Post-UTME style", queryType: "postutme", live: true },
  { id: "cee", name: "Common Entrance style", queryType: "cee", live: true },
];
const INTL_EXAM_TYPES = [
  { id: "sat", name: "SAT-style", queryType: "sat", live: true },
  { id: "igcse", name: "IGCSE-style", queryType: "igcse", live: true },
  { id: "alevel", name: "A-Level-style", queryType: "alevel", live: true },
];
const PRACTICE_EXAM_TYPES = [
  { id: "practice", name: "Practice", queryType: "practice", live: true },
];
let activeExamTypes = NAT_EXAM_TYPES;
const COMPULSORY = []; // no subject is forced — learners pick freely
const MAX_SUBJECTS = 9;
const PER_SUBJECT = 15;
const CORE_SUBJECTS = ["english", "mathematics"];
const STREAM_SUBJECTS = {
  science: ["physics", "chemistry", "biology", "geography"],
  commercial: ["commerce", "accounting", "economics", "insurance"],
  arts: [
    "englishlit",
    "government",
    "history",
    "crk",
    "irk",
    "civiledu",
    "currentaffairs",
    "economics",
  ],
};
const STREAMS = [
  { id: "science", name: "Science" },
  { id: "commercial", name: "Commercial" },
  { id: "arts", name: "Arts / Humanities" },
];

// ── National / Practice CBT picker: Class → Subject → Topic → Paper ──
// Class is the primary axis. Each step is a single choice; picking a paper
// loads that paper's set (up to 60 questions). The legacy multi-subject /
// scheme / count flow has been replaced by this cascade.
let natState = {
  classLevel: null, classLabel: null,
  subject: null, subjectLabel: null,
  topic: null,
  paper: null,
};

// The national step-cards, repurposed:
//   step 1 (exam-chips)  → Class      step 2 (stream-chips) → Subject
//   step 3 (subject-row) → Topic      step 4 (year-chips)   → Paper
const classBox = () => document.getElementById("exam-chips");
const subjectBox = () => document.getElementById("stream-chips");
const topicBox = () => document.getElementById("subject-chips");
const paperBox = () => document.getElementById("year-chips");
const classDone = () => document.getElementById("done-exam");
const subjectDone = () => document.getElementById("done-stream");
const topicDone = () => document.getElementById("done-subject");
const paperDone = () => document.getElementById("done-year");
const topicCard = () => document.getElementById("subject-row");
const paperCard = () => document.querySelector(".step-card-4");

function natUpdateReadyState() {
  const ready = natState.classLevel && natState.subject && natState.topic && natState.paper;
  beginBtn.disabled = !ready;
  if (ready) { setStatus("All set. Ready — start your test.", true); return; }
  const need = [];
  if (!natState.classLevel) need.push("class");
  else if (!natState.subject) need.push("subject");
  else if (!natState.topic) need.push("topic");
  else need.push("paper");
  setStatus("Select: " + need.join(" • "), false);
}

// Render a single-select row of chips into `box`.
function natChips(box, items, selectedId, onPick, { dot = false, empty = "Nothing here yet." } = {}) {
  box.innerHTML = "";
  if (!items.length) { box.innerHTML = `<span class="picker-hint">${empty}</span>`; return; }
  items.forEach((it) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip ${it.id === selectedId ? "checked" : ""}`;
    const lead = dot ? `<div class="status-dot live"></div>` : `<div class="chip-check-box"></div>`;
    chip.innerHTML = `${lead}<span>${it.label}</span>${it.count != null ? `<span class="chip-count">${it.count}</span>` : ""}`;
    chip.onclick = () => {
      box.querySelectorAll(".custom-chip").forEach((c) => c.classList.remove("checked"));
      chip.classList.add("checked");
      onPick(it);
    };
    box.appendChild(chip);
  });
}

async function buildClassGrid() {
  const box = classBox();
  box.innerHTML = '<span class="picker-hint">Loading classes…</span>';
  try {
    const d = await (await fetch(`${API_BASE}/api/cbt/classes`)).json();
    const classes = (d.classes || []).filter((c) => c.count > 0);
    if (!classes.length) { box.innerHTML = '<span class="picker-hint">No questions in the bank yet.</span>'; return; }
    natChips(box, classes.map((c) => ({ id: c.key, label: c.label, count: c.count })), natState.classLevel, selectClass, { dot: true });
  } catch (e) {
    box.innerHTML = '<span class="picker-error">Could not load classes. Is the server running?</span>';
  }
}

function selectClass(it) {
  natState.classLevel = it.id; natState.classLabel = it.label;
  natState.subject = natState.subjectLabel = natState.topic = natState.paper = null;
  classDone().classList.add("show");
  [subjectDone(), topicDone(), paperDone()].forEach((d) => d && d.classList.remove("show"));
  topicCard().style.display = "none";
  if (paperCard()) paperCard().style.display = "none";
  loadNatSubjects();
  natUpdateReadyState();
}

async function loadNatSubjects() {
  const box = subjectBox();
  box.innerHTML = '<span class="picker-hint">Loading subjects…</span>';
  try {
    const d = await (await fetch(`${API_BASE}/api/cbt/subjects?class=${natState.classLevel}`)).json();
    const subs = (d.subjects || []).filter((s) => s.count > 0);
    natChips(box, subs.map((s) => ({ id: s.key, label: s.label, count: s.count })), natState.subject, selectSubject,
      { empty: "No subjects for this class yet." });
  } catch (e) {
    box.innerHTML = '<span class="picker-error">Could not load subjects.</span>';
  }
}

function selectSubject(it) {
  natState.subject = it.id; natState.subjectLabel = it.label;
  natState.topic = natState.paper = null;
  subjectDone().classList.add("show");
  [topicDone(), paperDone()].forEach((d) => d && d.classList.remove("show"));
  topicCard().style.display = "";
  if (paperCard()) paperCard().style.display = "none";
  loadNatTopics();
  natUpdateReadyState();
}

async function loadNatTopics() {
  const box = topicBox();
  box.innerHTML = '<span class="picker-hint">Loading topics…</span>';
  try {
    const d = await (await fetch(`${API_BASE}/api/cbt/topics?class=${natState.classLevel}&subject=${natState.subject}`)).json();
    const topics = (d.topics || []).filter((t) => t.count > 0);
    natChips(box, topics.map((t) => ({ id: t.topic, label: t.topic, count: t.count })), natState.topic, selectTopic,
      { empty: "No topics for this subject yet." });
  } catch (e) {
    box.innerHTML = '<span class="picker-error">Could not load topics.</span>';
  }
}

function selectTopic(it) {
  natState.topic = it.id;
  natState.paper = null;
  topicDone().classList.add("show");
  if (paperDone()) paperDone().classList.remove("show");
  if (paperCard()) paperCard().style.display = "";
  loadNatPapers();
  natUpdateReadyState();
}

async function loadNatPapers() {
  const box = paperBox();
  box.innerHTML = '<span class="picker-hint">Loading papers…</span>';
  try {
    const params = new URLSearchParams({ class: natState.classLevel, subject: natState.subject, topic: natState.topic });
    const d = await (await fetch(`${API_BASE}/api/cbt/papers?${params}`)).json();
    const list = d.list || [];
    if (!list.length) { box.innerHTML = '<span class="picker-hint">No papers yet for this topic.</span>'; return; }
    const items = list.map((p) => ({ id: String(p.paper), label: p.label, count: Math.min(60, (d.count || 0) - (p.paper - 1) * 60) }));
    natChips(box, items, natState.paper, selectPaper, { dot: true });
  } catch (e) {
    box.innerHTML = '<span class="picker-error">Could not load papers.</span>';
  }
}

function selectPaper(it) {
  natState.paper = it.id;
  paperDone().classList.add("show");
  natUpdateReadyState();
}

// Relabel the national step-cards for Class → Subject → Topic → Paper and hide
// the now-unused "Number of questions" step (a paper is the unit of practice).
function relabelNationalSteps() {
  const set = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
  set('.step-card-1 .step-title[data-cat="national"]', "Class");
  set('.step-card-1 .step-sub[data-cat="national"]', "Pick your class");
  set('.step-card-2 .step-title[data-cat="national"]', "Subject");
  set('.step-card-2 .step-sub[data-cat="national"]', "Pick a subject");
  set('#subject-row .step-title', "Topic");
  set('#compulsoryHint', "Pick a topic");
  set('.step-card-4 .step-title[data-cat="national"]', "Paper");
  set('.step-card-4 .step-sub[data-cat="national"]', "Each paper has up to 60 questions");
  const countCard = document.querySelector(".step-card-5");
  if (countCard) countCard.style.display = "none";
}

function initNational() {
  natState = { classLevel: null, classLabel: null, subject: null, subjectLabel: null, topic: null, paper: null };
  relabelNationalSteps();
  ["done-exam", "done-stream", "done-subject", "done-year"].forEach((id) => document.getElementById(id)?.classList.remove("show"));
  topicCard().style.display = "none";
  if (paperCard()) paperCard().style.display = "none";
  buildClassGrid();
  natUpdateReadyState();
}

// ════════════════════════════════════════════════════════════════════
//  COMPETITION MODE
// ════════════════════════════════════════════════════════════════════

const COMP_REGISTRY = {
  scholastic: {
    name: "Scholastic",
    live: true,
    divisions: {
      "upper-primary": {
        name: "Upper Primary",
        live: true,
        years: {
          2022: {
            rounds: [
              { id: "first-Round", name: "First Round", live: true },
              { id: "finals", name: "Finals", live: true },
            ],
          },
          2025: {
            rounds: [
              { id: "first-Round", name: "First Round", live: true },
              { id: "finals", name: "Finals", live: true },
            ],
          },
        },
      },
      "junior-secondary": { name: "Junior Secondary", live: false, years: {} },
      "senior-secondary": { name: "Senior Secondary", live: false, years: {} },
    },
  },
  anmc: {
    name: "ANMC",
    live: true,
    divisions: {
      "upper-primary": {
        name: "Upper Primary",
        live: true,
        years: {
          "14th": { rounds: [{ id: "main", name: "Main Paper", live: true }] },
          "13th": {
            rounds: [
              { id: "first-round", name: "First Round", live: true },
              { id: "finals", name: "Finals", live: true },
            ],
          },
          "12th": { rounds: [{ id: "main", name: "Main Paper", live: true }] },
        },
      },
    },
  },
  olympiad: { name: "National Olympiad", live: false, divisions: {} },
  tulip: { name: "Tulip Contest", live: false, divisions: {} },
};

const SECTIONS = [
  { id: "all", name: "All Sections" },
  { id: "math", name: "Mathematics" },
  { id: "english", name: "English" },
  { id: "science", name: "Science" },
  { id: "general", name: "General Knowledge" },
];

let compState = {
  competition: null,
  division: null,
  year: null,
  round: null,
  section: "all",
};

const compContainer = () => document.getElementById("comp-chips");
const divisionContainer = () => document.getElementById("division-chips");
const yearContainerComp = () => document.getElementById("year-chips-comp");
const roundContainer = () => document.getElementById("round-chips");
const sectionContainer = () => document.getElementById("section-chips");
const yearRowEl = () => document.getElementById("year-row");
const doneComp = () => document.getElementById("done-comp");
const doneDivision = () => document.getElementById("done-division");
const doneYearComp = () => document.getElementById("done-year-comp");
const doneRound = () => document.getElementById("done-round");
const doneSection = () => document.getElementById("done-section");

function compUpdateReadyState() {
  const ready =
    compState.competition &&
    compState.division &&
    compState.year &&
    compState.round;
  beginBtn.disabled = !ready;
  if (ready) {
    setStatus("All set. Ready to start.", true);
    return;
  }
  const need = [];
  if (!compState.competition) need.push("competition");
  if (!compState.division) need.push("division");
  if (!compState.year) need.push("year");
  if (!compState.round) need.push("round");
  setStatus("Select: " + need.join(" • "), false);
}

function buildCompGrid() {
  compContainer().innerHTML = "";
  Object.entries(COMP_REGISTRY).forEach(([id, comp]) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip comp-chip${!comp.live ? " disabled" : ""}`;
    chip.innerHTML = `<div class="status-dot ${comp.live ? "live" : "offline"}"></div><span>${comp.name}</span>`;
    if (comp.live) chip.onclick = () => selectComp(id, chip);
    else {
      chip.style.pointerEvents = "none";
      chip.style.opacity = "0.5";
    }
    compContainer().appendChild(chip);
  });
}

function selectComp(id, chip) {
  compContainer()
    .querySelectorAll(".comp-chip")
    .forEach((c) => c.classList.remove("checked"));
  chip.classList.add("checked");
  compState.competition = id;
  compState.division = null;
  compState.year = null;
  compState.round = null;
  doneComp().classList.add("show");
  ["done-division", "done-year-comp", "done-round"].forEach((id) =>
    document.getElementById(id)?.classList.remove("show"),
  );
  buildDivisionGrid();
  compResetYearRound();
  compUpdateReadyState();
}

function buildDivisionGrid() {
  divisionContainer().innerHTML = "";
  const comp = COMP_REGISTRY[compState.competition];
  if (!comp) {
    divisionContainer().innerHTML =
      '<span class="picker-hint">Select a competition first.</span>';
    return;
  }
  Object.entries(comp.divisions).forEach(([id, div]) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip division-chip${!div.live ? " disabled" : ""}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${div.name}</span>`;
    if (div.live) chip.onclick = () => selectDivision(id, chip);
    else {
      chip.style.pointerEvents = "none";
      chip.style.opacity = "0.5";
    }
    divisionContainer().appendChild(chip);
  });
}

function selectDivision(id, chip) {
  divisionContainer()
    .querySelectorAll(".division-chip")
    .forEach((c) => c.classList.remove("checked"));
  chip.classList.add("checked");
  compState.division = id;
  compState.year = null;
  compState.round = null;
  doneDivision().classList.add("show");
  ["done-year-comp", "done-round"].forEach((id) =>
    document.getElementById(id)?.classList.remove("show"),
  );
  yearRowEl().style.display = "flex";
  buildCompYearGrid();
  roundContainer().innerHTML =
    '<span class="picker-hint">Choose a year first</span>';
  compUpdateReadyState();
}

function buildCompYearGrid() {
  yearContainerComp().innerHTML = "";
  const div =
    COMP_REGISTRY[compState.competition]?.divisions[compState.division];
  if (!div) return;
  const years = Object.keys(div.years).sort((a, b) => b - a);
  if (!years.length) {
    yearContainerComp().innerHTML =
      '<span class="picker-hint">No papers available yet for this division.</span>';
    return;
  }
  years.forEach((year) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip year-chip${compState.year === year ? " checked" : ""}`;
    chip.innerHTML = `<div class="status-dot live"></div><span>${year}</span>`;
    chip.onclick = () => {
      yearContainerComp()
        .querySelectorAll(".year-chip")
        .forEach((c) => c.classList.remove("checked"));
      chip.classList.add("checked");
      compState.year = year;
      compState.round = null;
      doneYearComp().classList.add("show");
      document.getElementById("done-round")?.classList.remove("show");
      buildRoundGrid();
      compUpdateReadyState();
    };
    yearContainerComp().appendChild(chip);
  });
}

function buildRoundGrid() {
  roundContainer().innerHTML = "";
  const yearData =
    COMP_REGISTRY[compState.competition]?.divisions[compState.division]?.years[
      compState.year
    ];
  if (!yearData?.rounds.length) {
    roundContainer().innerHTML =
      '<span class="picker-hint">No rounds available yet.</span>';
    return;
  }
  yearData.rounds.forEach((round) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip round-chip${!round.live ? " disabled" : ""}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${round.name}</span>`;
    if (round.live) {
      chip.onclick = () => {
        roundContainer()
          .querySelectorAll(".round-chip")
          .forEach((c) => c.classList.remove("checked"));
        chip.classList.add("checked");
        compState.round = round.id;
        doneRound().classList.add("show");
        compUpdateReadyState();
      };
    } else {
      chip.style.pointerEvents = "none";
      chip.style.opacity = "0.5";
    }
    roundContainer().appendChild(chip);
  });
}

function buildSectionGrid() {
  sectionContainer().innerHTML = "";
  SECTIONS.forEach((sec) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip section-chip${compState.section === sec.id ? " checked" : ""}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${sec.name}</span>`;
    chip.onclick = () => {
      sectionContainer()
        .querySelectorAll(".section-chip")
        .forEach((c) => c.classList.remove("checked"));
      chip.classList.add("checked");
      compState.section = sec.id;
      doneSection().classList.add("show");
    };
    sectionContainer().appendChild(chip);
  });
}

function compResetYearRound() {
  yearRowEl().style.display = "none";
  yearContainerComp().innerHTML =
    '<span class="picker-hint">Choose a division first</span>';
  roundContainer().innerHTML =
    '<span class="picker-hint">Choose a year to see rounds</span>';
}

function initCompetition() {
  compState = {
    competition: null,
    division: null,
    year: null,
    round: null,
    section: "all",
  };
  buildCompGrid();
  divisionContainer().innerHTML =
    '<span class="picker-hint">Select a competition first.</span>';
  roundContainer().innerHTML =
    '<span class="picker-hint">Choose a year to see rounds</span>';
  compResetYearRound();
  buildSectionGrid();
  ["done-comp", "done-division", "done-year-comp", "done-round"].forEach((id) =>
    document.getElementById(id)?.classList.remove("show"),
  );
  document.getElementById("done-section")?.classList.add("show");
  compUpdateReadyState();
}

// ════════════════════════════════════════════════════════════════════
//  INTERNATIONAL MODE
// ════════════════════════════════════════════════════════════════════

// SAT papers (length/difficulty presets). Each points at the shared question
// engine with source=sat; the loader reads the self-hosted OpenSAT bank.
function SAT_PAPERS(section) {
  const base = `../question/question.html?source=sat&examType=sat&section=${section}`;
  return [
    { id: "full44", name: "Full · 44 Q", live: true, url: `${base}&n=44` },
    { id: "quick20", name: "Quick · 20 Q", live: true, url: `${base}&n=20` },
    {
      id: "easy20",
      name: "Easy · 20 Q",
      live: true,
      url: `${base}&difficulty=Easy&n=20`,
    },
    {
      id: "medium20",
      name: "Medium · 20 Q",
      live: true,
      url: `${base}&difficulty=Medium&n=20`,
    },
    {
      id: "hard20",
      name: "Hard · 20 Q",
      live: true,
      url: `${base}&difficulty=Hard&n=20`,
    },
  ];
}

const INTL_REGISTRY = {
  cambridge: {
    name: "Cambridge",
    live: true,
    levels: {
      "upper-secondary": {
        name: "Upper Secondary",
        live: true,
        subjects: {
          mathematics: {
            name: "Mathematics",
            live: true,
            years: {
              2025: [
                {
                  id: "standard",
                  name: "Standard Paper",
                  live: true,
                  url: "/exam-archive/international/cambridge/index.html",
                },
              ],
            },
          },
          english: { name: "English Language", live: false, years: {} },
          physics: { name: "Physics", live: false, years: {} },
        },
      },
      "lower-secondary": { name: "Lower Secondary", live: false, subjects: {} },
      "a-level": { name: "A-Level", live: false, subjects: {} },
    },
  },
  igcse: { name: "IGCSE", live: false, levels: {} },
  sat: {
    name: "SAT",
    live: true,
    levels: {
      digital: {
        name: "Digital SAT",
        live: true,
        subjects: {
          math: {
            name: "Math",
            live: true,
            years: { 2025: SAT_PAPERS("math") },
          },
          english: {
            name: "Reading & Writing",
            live: true,
            years: { 2025: SAT_PAPERS("english") },
          },
          mixed: {
            name: "Full (Math + R&W)",
            live: true,
            years: { 2025: SAT_PAPERS("mixed") },
          },
        },
      },
    },
  },
  ib: { name: "IB", live: false, levels: {} },
};

let intlState = {
  board: null,
  level: null,
  subject: null,
  year: null,
  paper: null,
  paperUrl: null,
};

const boardContainer = () => document.getElementById("board-chips");
const levelContainer = () => document.getElementById("level-chips");
const subjectContainerIntl = () =>
  document.getElementById("subject-chips-intl");
const yearContainerIntl = () => document.getElementById("year-chips-intl");
const paperContainer = () => document.getElementById("paper-chips");
const subjectRowIntl = () => document.getElementById("subject-row-intl");
const doneBoard = () => document.getElementById("done-board");
const doneLevel = () => document.getElementById("done-level");
const doneSubjectIntl = () => document.getElementById("done-subject-intl");
const doneYearIntl = () => document.getElementById("done-year-intl");
const donePaper = () => document.getElementById("done-paper");

function intlUpdateReadyState() {
  const ready =
    intlState.board &&
    intlState.level &&
    intlState.subject &&
    intlState.year &&
    intlState.paper;
  beginBtn.disabled = !ready;
  if (ready) {
    setStatus("All set. Ready to open paper.", true);
    return;
  }
  const need = [];
  if (!intlState.board) need.push("board");
  if (!intlState.level) need.push("level");
  if (!intlState.subject) need.push("subject");
  if (!intlState.year) need.push("year");
  if (!intlState.paper) need.push("paper");
  setStatus("Select: " + need.join(" • "), false);
}

function buildBoardGrid() {
  boardContainer().innerHTML = "";
  Object.entries(INTL_REGISTRY).forEach(([id, board]) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip board-chip${!board.live ? " disabled" : ""}`;
    chip.innerHTML = `<div class="status-dot ${board.live ? "live" : "offline"}"></div><span>${board.name}</span>`;
    if (board.live) chip.onclick = () => selectBoard(id, chip);
    else {
      chip.style.pointerEvents = "none";
      chip.style.opacity = "0.5";
    }
    boardContainer().appendChild(chip);
  });
}

function selectBoard(id, chip) {
  boardContainer()
    .querySelectorAll(".board-chip")
    .forEach((c) => c.classList.remove("checked"));
  chip.classList.add("checked");
  intlState.board = id;
  intlState.level = null;
  intlState.subject = null;
  intlState.year = null;
  intlState.paper = null;
  doneBoard().classList.add("show");
  ["done-level", "done-subject-intl", "done-year-intl", "done-paper"].forEach(
    (id) => document.getElementById(id)?.classList.remove("show"),
  );
  buildLevelGrid();
  subjectRowIntl().style.display = "none";
  yearContainerIntl().innerHTML =
    '<span class="picker-hint">Choose a subject to see years</span>';
  paperContainer().innerHTML =
    '<span class="picker-hint">Choose a year to see papers</span>';
  intlUpdateReadyState();
}

function buildLevelGrid() {
  levelContainer().innerHTML = "";
  const board = INTL_REGISTRY[intlState.board];
  if (!board) {
    levelContainer().innerHTML =
      '<span class="picker-hint">Select a board first.</span>';
    return;
  }
  Object.entries(board.levels).forEach(([id, level]) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip level-chip${!level.live ? " disabled" : ""}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${level.name}</span>`;
    if (level.live) chip.onclick = () => selectLevel(id, chip);
    else {
      chip.style.pointerEvents = "none";
      chip.style.opacity = "0.5";
    }
    levelContainer().appendChild(chip);
  });
}

function selectLevel(id, chip) {
  levelContainer()
    .querySelectorAll(".level-chip")
    .forEach((c) => c.classList.remove("checked"));
  chip.classList.add("checked");
  intlState.level = id;
  intlState.subject = null;
  intlState.year = null;
  intlState.paper = null;
  doneLevel().classList.add("show");
  ["done-subject-intl", "done-year-intl", "done-paper"].forEach((id) =>
    document.getElementById(id)?.classList.remove("show"),
  );
  subjectRowIntl().style.display = "flex";
  buildIntlSubjectGrid();
  yearContainerIntl().innerHTML =
    '<span class="picker-hint">Choose a subject to see years</span>';
  paperContainer().innerHTML =
    '<span class="picker-hint">Choose a year to see papers</span>';
  intlUpdateReadyState();
}

function buildIntlSubjectGrid() {
  subjectContainerIntl().innerHTML = "";
  const subjects =
    INTL_REGISTRY[intlState.board]?.levels[intlState.level]?.subjects;
  if (!subjects || !Object.keys(subjects).length) {
    subjectContainerIntl().innerHTML =
      '<span class="picker-hint">No subjects available for this level yet.</span>';
    return;
  }
  Object.entries(subjects).forEach(([id, sub]) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip subject-chip${!sub.live ? " disabled" : ""}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${sub.name}</span>`;
    if (sub.live) chip.onclick = () => selectIntlSubject(id, chip);
    else {
      chip.style.pointerEvents = "none";
      chip.style.opacity = "0.5";
    }
    subjectContainerIntl().appendChild(chip);
  });
}

function selectIntlSubject(id, chip) {
  subjectContainerIntl()
    .querySelectorAll(".subject-chip")
    .forEach((c) => c.classList.remove("checked"));
  chip.classList.add("checked");
  intlState.subject = id;
  intlState.year = null;
  intlState.paper = null;
  doneSubjectIntl().classList.add("show");
  ["done-year-intl", "done-paper"].forEach((id) =>
    document.getElementById(id)?.classList.remove("show"),
  );
  buildIntlYearGrid();
  paperContainer().innerHTML =
    '<span class="picker-hint">Choose a year to see papers</span>';
  intlUpdateReadyState();
}

function buildIntlYearGrid() {
  yearContainerIntl().innerHTML = "";
  const years =
    INTL_REGISTRY[intlState.board]?.levels[intlState.level]?.subjects[
      intlState.subject
    ]?.years;
  if (!years || !Object.keys(years).length) {
    yearContainerIntl().innerHTML =
      '<span class="picker-hint">No years available yet.</span>';
    return;
  }
  Object.keys(years)
    .sort((a, b) => b - a)
    .forEach((year) => {
      const chip = document.createElement("div");
      chip.className = `custom-chip year-chip${intlState.year === year ? " checked" : ""}`;
      chip.innerHTML = `<div class="status-dot live"></div><span>${year}</span>`;
      chip.onclick = () => {
        yearContainerIntl()
          .querySelectorAll(".year-chip")
          .forEach((c) => c.classList.remove("checked"));
        chip.classList.add("checked");
        intlState.year = year;
        intlState.paper = null;
        doneYearIntl().classList.add("show");
        document.getElementById("done-paper")?.classList.remove("show");
        buildPaperGrid();
        intlUpdateReadyState();
      };
      yearContainerIntl().appendChild(chip);
    });
}

function buildPaperGrid() {
  paperContainer().innerHTML = "";
  const papers =
    INTL_REGISTRY[intlState.board]?.levels[intlState.level]?.subjects[
      intlState.subject
    ]?.years[intlState.year];
  if (!papers?.length) {
    paperContainer().innerHTML =
      '<span class="picker-hint">No papers available yet.</span>';
    return;
  }
  papers.forEach((paper) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip paper-chip${!paper.live ? " disabled" : ""}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${paper.name}</span>`;
    if (paper.live) {
      chip.onclick = () => {
        paperContainer()
          .querySelectorAll(".paper-chip")
          .forEach((c) => c.classList.remove("checked"));
        chip.classList.add("checked");
        intlState.paper = paper.id;
        intlState.paperUrl = paper.url;
        donePaper().classList.add("show");
        intlUpdateReadyState();
      };
    } else {
      chip.style.pointerEvents = "none";
      chip.style.opacity = "0.5";
    }
    paperContainer().appendChild(chip);
  });
}

function initInternational() {
  intlState = {
    board: null,
    level: null,
    subject: null,
    year: null,
    paper: null,
    paperUrl: null,
  };
  buildBoardGrid();
  levelContainer().innerHTML =
    '<span class="picker-hint">Select a board first.</span>';
  yearContainerIntl().innerHTML =
    '<span class="picker-hint">Choose a subject to see years</span>';
  paperContainer().innerHTML =
    '<span class="picker-hint">Choose a year to see papers</span>';
  subjectRowIntl().style.display = "none";
  [
    "done-board",
    "done-level",
    "done-subject-intl",
    "done-year-intl",
    "done-paper",
  ].forEach((id) => document.getElementById(id)?.classList.remove("show"));
  intlUpdateReadyState();
}

// ════════════════════════════════════════════════════════════════════
//  UNIFIED: begin button + category wiring
// ════════════════════════════════════════════════════════════════════

// Build the relative URL the current selection would launch — also used to make
// a shareable link. Returns null when the active category has no target yet.
function targetUrl() {
  // Every non-competition tab now runs the Class → Subject → Topic → Paper CBT
  // builder. The chosen paper IS the test (up to 60 questions).
  if (activeCat !== "competition") {
    if (!natState.classLevel || !natState.subject || !natState.topic || !natState.paper) return null;
    const params = new URLSearchParams({
      source: "cbt",
      class: natState.classLevel,
      // `subjects` (plural) so the quiz engine's subject loop reads it; single value.
      subjects: natState.subject,
      topic: natState.topic,
      paper: String(natState.paper),
    });
    return `../question/question.html?${params.toString()}`;
  }

  if (activeCat === "competition") {
    const { competition, division, year, round, section } = compState;
    const params = new URLSearchParams({
      source: "competition",
      comp: competition,
      div: division,
      year,
      round,
      section,
    });
    return `../question/question.html?${params.toString()}`;
  }

  if (activeCat === "international") {
    return intlState.paperUrl || null;
  }

  return null;
}

beginBtn.onclick = () => {
  if (beginBtn.disabled) return;
  const url = targetUrl();
  if (url) window.location.href = url;
};

// ── Copy a shareable link to the configured test ───────────────────────
const shareBtn = document.getElementById("share-btn");
const shareLabel = shareBtn && shareBtn.querySelector(".share-label");
let shareResetTimer = null;

// Keep the share button enabled exactly when "Begin" is (it watches the same
// readiness state, set in many places, via the disabled attribute).
if (shareBtn) {
  const syncShare = () => {
    shareBtn.disabled = beginBtn.disabled;
  };
  new MutationObserver(syncShare).observe(beginBtn, {
    attributes: true,
    attributeFilter: ["disabled"],
  });
  syncShare();

  shareBtn.onclick = async () => {
    if (shareBtn.disabled) return;
    const rel = targetUrl();
    if (!rel) return;
    const abs = new URL(rel, location.href).href;
    const done = (ok) => {
      if (shareLabel) shareLabel.textContent = ok ? "Link copied!" : "Copy failed";
      shareBtn.classList.toggle("copied", ok);
      clearTimeout(shareResetTimer);
      shareResetTimer = setTimeout(() => {
        if (shareLabel) shareLabel.textContent = "Copy link";
        shareBtn.classList.remove("copied");
      }, 2000);
    };
    try {
      await navigator.clipboard.writeText(abs);
      done(true);
    } catch (e) {
      // Fallback for non-secure contexts / older browsers.
      try {
        const ta = document.createElement("textarea");
        ta.value = abs;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        done(true);
      } catch (_) {
        done(false);
      }
    }
  };
}

// ── Teacher-only: assign the configured CBT to the class roster ────────
// The button stays hidden until we confirm the signed-in user is a teacher
// (the roster endpoint answers 200 for teachers/admins, 403 otherwise).
const assignBtn = document.getElementById("assign-btn");

async function ppCurrentUser() {
  let auth = window.firebaseAuth;
  if (!auth) {
    try { auth = (await import("/firebase-init.js")).auth; } catch (_) { return null; }
  }
  if (auth.currentUser) return auth.currentUser;
  try {
    const { onAuthStateChanged } = await import("firebase/auth");
    return await new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u || null); });
      setTimeout(() => resolve(auth.currentUser || null), 4000);
    });
  } catch (_) { return auth.currentUser || null; }
}

async function ppAuthToken() {
  const u = await ppCurrentUser();
  if (!u) return null;
  try { return await u.getIdToken(); } catch (_) { return null; }
}

if (assignBtn) {
  const assignLabel = assignBtn.querySelector(".assign-label");
  let assignResetTimer = null;
  const setAssign = (msg, ok) => {
    if (assignLabel) assignLabel.textContent = msg;
    assignBtn.classList.toggle("copied", !!ok);
    clearTimeout(assignResetTimer);
    assignResetTimer = setTimeout(() => {
      if (assignLabel) assignLabel.textContent = "Assign to class";
      assignBtn.classList.remove("copied");
    }, 2200);
  };

  // Mirror "Begin"'s readiness, and reveal only for teachers.
  const syncAssign = () => { assignBtn.disabled = beginBtn.disabled; };
  new MutationObserver(syncAssign).observe(beginBtn, {
    attributes: true,
    attributeFilter: ["disabled"],
  });
  syncAssign();

  (async () => {
    const token = await ppAuthToken();
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/classroom/roster`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (r.ok) assignBtn.hidden = false;
    } catch (_) {}
  })();

  assignBtn.onclick = async () => {
    if (assignBtn.disabled) return;
    const rel = targetUrl();
    if (!rel) return;
    // Store a site-root path (pathname + search) — what the dashboard links to.
    const u = new URL(rel, location.href);
    const url = u.pathname + u.search;
    const defTitle = `${natState.classLabel || "Practice"} • ${natState.subjectLabel || natState.subject || ""} • ${natState.topic || ""} (Paper ${natState.paper || ""})`.slice(0, 120);
    const title = (window.prompt("Title for this assignment:", defTitle) || "").trim();
    if (!title) return; // cancelled or empty
    const token = await ppAuthToken();
    if (!token) { setAssign("Sign in first"); return; }
    setAssign("Assigning…");
    try {
      const r = await fetch(`${API_BASE}/api/classroom/assign-cbt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ url, title, subject: natState.subject || "", all: true }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Failed");
      setAssign(`Assigned to ${d.assigned}`, true);
    } catch (e) {
      setAssign(String(e.message || "Failed").slice(0, 28));
    }
  };
}

function initMode(cat) {
  // National, International and Practice all run the CBT builder; only the scheme set differs.
  activeExamTypes = cat === "international" ? INTL_EXAM_TYPES : cat === "practice" ? PRACTICE_EXAM_TYPES : NAT_EXAM_TYPES;
  initNational();
  setStatus("Awaiting selections...", false);
  beginBtn.disabled = true;
}

// ── Category tab clicks ────────────────────────────────────────────
document.querySelectorAll(".cat-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.tab;
    if (cat === activeCat) return;
    activeCat = cat;
    applyCat(cat);
    updateHeaderContent(cat);
    initMode(cat);
  });
});

// ── Bootstrap ──────────────────────────────────────────────────────
// National + International are both our own CBT now. Competition (third-party
// papers) stays hidden until licensed.
document.querySelectorAll(".cat-tab").forEach((b) => {
  // Competition (third-party papers) and International (legacy Cambridge flow)
  // are hidden — all CBT now runs through the one Class→Subject→Topic→Paper
  // builder under the National / Practice tabs.
  if (b.dataset.tab === "competition" || b.dataset.tab === "international") b.style.display = "none";
});
const startCat = initialCat === "practice" ? "practice" : "national";
activeCat = startCat;
applyCat(startCat);
updateHeaderContent(startCat);
initMode(startCat);
