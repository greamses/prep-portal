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
    note: "Pick a scheme, your class & subjects — we'll build an original practice test, marked instantly.",
    stats: `
      <span class="hero-stat theme-blue"><strong>UTME</strong>-style</span>
      <span class="hero-stat theme-green"><strong>WASSCE</strong>-style</span>
      <span class="hero-stat theme-red"><strong>AI</strong> Written</span>`,
    ctaLabel: "Start practice test →",
  },
  competition: {
    note: "Pick a competition, your level & round — start practising the exact paper.",
    stats: `
      <span class="hero-stat theme-blue"><strong>Scholastic</strong> Awards</span>
      <span class="hero-stat theme-green"><strong>ANMC</strong> Upper Primary</span>
      <span class="hero-stat theme-red"><strong>Olympiad</strong> Coming soon</span>`,
    ctaLabel: "Start practice →",
  },
  international: {
    note: "Pick a scheme, your level & subjects — we'll build an original practice test, marked instantly.",
    stats: `
      <span class="hero-stat theme-blue"><strong>SAT</strong>-style</span>
      <span class="hero-stat theme-green"><strong>IGCSE</strong>-style</span>
      <span class="hero-stat theme-red"><strong>A-Level</strong>-style</span>`,
    ctaLabel: "Start practice test →",
  },
};

function updateHeaderContent(cat) {
  const h = HEADER_CONTENT[cat] || HEADER_CONTENT.national;
  builderNote.textContent = h.note;
  builderStats.innerHTML = h.stats;
  beginBtn.textContent = h.ctaLabel;
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

let natState = {
  examType: null,
  queryType: null,
  stream: null,
  subjects: [],
  year: null,
  count: null,
};
let facets = null;
let countByKey = {},
  keyByLabel = {};

const examContainer = () => document.getElementById("exam-chips");
const streamContainer = () => document.getElementById("stream-chips");
const yearContainerNat = () => document.getElementById("year-chips");
const subjectChipsDiv = () => document.getElementById("subject-chips");
const subjectCountSpan = () => document.getElementById("subject-count");
const subjectRow = () => document.getElementById("subject-row");
const doneExam = () => document.getElementById("done-exam");
const doneStream = () => document.getElementById("done-stream");
const doneYearNat = () => document.getElementById("done-year");
const doneSubject = () => document.getElementById("done-subject");
const doneCount = () => document.getElementById("done-count");

function natUpdateReadyState() {
  const ready =
    natState.examType &&
    natState.stream &&
    natState.subjects.length > 0 &&
    natState.year &&
    natState.count;
  beginBtn.disabled = !ready;
  if (ready) {
    setStatus("✓ All set. Ready — start your test.", true);
    return;
  }
  const need = [];
  if (!natState.examType) need.push("scheme");
  if (!natState.stream) need.push("class");
  if (!natState.subjects.length) need.push("subjects");
  if (!natState.year) need.push("year");
  if (!natState.count) need.push("number of questions");
  setStatus("Select: " + need.join(" • "), false);
}

function buildExamGrid() {
  examContainer().innerHTML = "";
  activeExamTypes.forEach((exam) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip exam-chip${!exam.live ? " disabled" : ""}`;
    chip.innerHTML = `<div class="status-dot ${exam.live ? "live" : "offline"}"></div><span>${exam.name}</span>`;
    if (exam.live) {
      chip.onclick = () => selectExam(exam, chip);
    } else {
      chip.style.pointerEvents = "none";
      chip.style.opacity = "0.5";
    }
    examContainer().appendChild(chip);
  });
}

// Fold the locally-hosted question bank into the ALOC facets so years/subjects
// we curate ourselves (e.g. WAEC 2020/2021) show up as pickable chips even when
// ALOC has no questions for them. The loader then prefers our files for those
// years and falls back to ALOC for the rest.
function mergeLocalFacets(examId) {
  if (!facets || typeof LOCAL_QUESTION_BANK === "undefined") return;
  const board = localBoardKey(examId);
  const bank = LOCAL_QUESTION_BANK[board];
  if (!bank) return;
  facets.subjects = facets.subjects || [];
  facets.yearsBySubject = facets.yearsBySubject || {};
  const labels = window.LOCAL_SUBJECT_LABELS || {};

  Object.keys(bank).forEach((subKey) => {
    const yearCounts = {};
    let subjTotal = 0;
    Object.keys(bank[subKey]).forEach((year) => {
      Object.keys(bank[subKey][year]).forEach((type) => {
        const c = bank[subKey][year][type].count || 0;
        yearCounts[year] = (yearCounts[year] || 0) + c;
        subjTotal += c;
      });
    });

    let subj = facets.subjects.find((s) => s.key === subKey);
    if (!subj) {
      subj = { key: subKey, label: labels[subKey] || subKey, count: 0 };
      facets.subjects.push(subj);
    }
    subj.count += subjTotal;

    const arr = (facets.yearsBySubject[subKey] =
      facets.yearsBySubject[subKey] || []);
    Object.keys(yearCounts).forEach((year) => {
      const existing = arr.find((y) => y.year === year);
      if (existing) existing.count += yearCounts[year];
      else arr.push({ year, count: yearCounts[year] });
    });
    arr.sort((a, b) => b.year.localeCompare(a.year));
  });

  facets.subjects.sort((a, b) => a.label.localeCompare(b.label));
}

async function selectExam(exam, chip) {
  examContainer()
    .querySelectorAll(".exam-chip")
    .forEach((c) => c.classList.remove("checked"));
  chip.classList.add("checked");
  natState.examType = exam.id;
  natState.queryType = exam.queryType;
  natState.subjects = [];
  natState.year = null;
  doneExam().classList.add("show");
  doneSubject().classList.remove("show");
  doneYearNat().classList.remove("show");
  yearContainerNat().innerHTML =
    '<span class="picker-hint">Choose subjects to see available years</span>';
  subjectRow().style.display = "flex";
  subjectChipsDiv().innerHTML =
    '<span class="picker-hint">Loading subjects…</span>';
  natUpdateReadyState();
  try {
    // Our own AI-generated bank, by scheme. No years — questions aren't dated.
    const res = await fetch(
      `${API_BASE}/api/cbt/facets?scheme=${natState.queryType}`,
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    facets = await res.json();
    facets.subjects = facets.subjects || [];
    facets.yearsBySubject = facets.yearsBySubject || {}; // engine expects this map
    countByKey = {};
    keyByLabel = {};
    facets.subjects.forEach((s) => {
      countByKey[s.key] = s.count;
      keyByLabel[s.label] = s.key;
    });
    if (facets.subjects.length) maybeRenderSubjects();
    else
      subjectChipsDiv().innerHTML =
        '<span class="picker-hint">No questions in the bank for this scheme yet.</span>';
  } catch (e) {
    facets = { subjects: [], yearsBySubject: {} };
    countByKey = {};
    keyByLabel = {};
    subjectChipsDiv().innerHTML =
      '<span class="picker-error">Could not load subjects. Is the server running?</span>';
  }
}

function buildStreamGrid() {
  streamContainer().innerHTML = "";
  STREAMS.forEach((st) => {
    const chip = document.createElement("div");
    chip.className = "custom-chip stream-chip";
    chip.innerHTML = `<div class="chip-check-box"></div><span>${st.name}</span>`;
    chip.onclick = () => {
      streamContainer()
        .querySelectorAll(".stream-chip")
        .forEach((c) => c.classList.remove("checked"));
      chip.classList.add("checked");
      natState.stream = st.id;
      natState.subjects = [];
      natState.year = null;
      doneStream().classList.add("show");
      doneSubject().classList.remove("show");
      doneYearNat().classList.remove("show");
      yearContainerNat().innerHTML =
        '<span class="picker-hint">Choose subjects to see available years</span>';
      maybeRenderSubjects();
      natUpdateReadyState();
    };
    streamContainer().appendChild(chip);
  });
}

function maybeRenderSubjects() {
  if (!natState.examType) {
    subjectChipsDiv().innerHTML =
      '<span class="picker-hint">Select an exam type first.</span>';
    return;
  }
  if (!facets) {
    subjectChipsDiv().innerHTML =
      '<span class="picker-hint">Loading subjects…</span>';
    return;
  }
  if (!natState.stream) {
    subjectChipsDiv().innerHTML =
      '<span class="picker-hint">Select your class to see its subjects.</span>';
    return;
  }
  renderNatSubjects();
}

function renderNatSubjects() {
  subjectChipsDiv().innerHTML = "";
  const allowed = new Set([
    ...CORE_SUBJECTS,
    ...(STREAM_SUBJECTS[natState.stream] || []),
  ]);
  const list = (facets ? facets.subjects : []).filter((s) =>
    allowed.has(s.key),
  );
  if (!list.length) {
    subjectChipsDiv().innerHTML =
      '<span class="picker-error">No questions yet for this class &amp; exam — try another class.</span>';
    natState.subjects = [];
    onNatSubjectsChanged();
    return;
  }
  natState.subjects = natState.subjects.filter((lbl) =>
    list.some((s) => s.label === lbl),
  );
  list.forEach((s) => {
    if (COMPULSORY.includes(s.label) && !natState.subjects.includes(s.label))
      natState.subjects.push(s.label);
  });
  list.forEach((s) => {
    const isComp = COMPULSORY.includes(s.label);
    const selected = natState.subjects.includes(s.label);
    const chip = document.createElement("div");
    chip.className = `custom-chip ${isComp ? "compulsory" : ""} ${selected ? "checked" : ""}`;
    chip.innerHTML = `<div class="chip-check-box"></div><span>${s.label}</span><span class="chip-count">${s.count}</span>`;
    if (!isComp) {
      chip.onclick = () => {
        const i = natState.subjects.indexOf(s.label);
        if (i !== -1) {
          natState.subjects.splice(i, 1);
          chip.classList.remove("checked");
        } else {
          if (natState.subjects.length >= MAX_SUBJECTS) {
            setStatus(`Max ${MAX_SUBJECTS} subjects`, false);
            return;
          }
          natState.subjects.push(s.label);
          chip.classList.add("checked");
        }
        onNatSubjectsChanged();
      };
    } else {
      chip.style.cursor = "default";
      chip.title = "Compulsory";
    }
    subjectChipsDiv().appendChild(chip);
  });
  onNatSubjectsChanged();
}

function onNatSubjectsChanged() {
  subjectCountSpan().textContent = natState.subjects.length;
  doneSubject().classList.toggle("show", natState.subjects.length > 0);
  renderNatYears();
  natUpdateReadyState();
}

function renderNatYears() {
  yearContainerNat().innerHTML = "";
  if (!natState.subjects.length) {
    yearContainerNat().innerHTML =
      '<span class="picker-hint">Choose subjects to see available years</span>';
    natState.year = null;
    doneYearNat().classList.remove("show");
    return;
  }
  const merged = {};
  let allCount = 0;
  natState.subjects.forEach((label) => {
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
  if (natState.year !== "all" && !years.some((y) => y.year === natState.year))
    natState.year = "all";
  const addChip = (label, value, count) => {
    const chip = document.createElement("div");
    chip.className = `custom-chip year-chip ${natState.year === value ? "checked" : ""}`;
    chip.innerHTML = `<div class="status-dot live"></div><span>${label}</span><span class="chip-count">${count}</span>`;
    chip.onclick = () => {
      yearContainerNat()
        .querySelectorAll(".year-chip")
        .forEach((c) => c.classList.remove("checked"));
      chip.classList.add("checked");
      natState.year = value;
      doneYearNat().classList.add("show");
      natUpdateReadyState();
    };
    yearContainerNat().appendChild(chip);
  };
  addChip("All Years", "all", allCount);
  years.forEach((y) => addChip(y.year, y.year, y.count));
  doneYearNat().classList.toggle("show", !!natState.year);
}

function initCountChips() {
  document.querySelectorAll("#count-chips .count-chip").forEach((chip) => {
    const val = parseInt(chip.getAttribute("data-count"), 10);
    if (natState.count === val) chip.classList.add("checked");
    chip.onclick = () => {
      document
        .querySelectorAll("#count-chips .count-chip")
        .forEach((c) => c.classList.remove("checked"));
      chip.classList.add("checked");
      natState.count = val;
      doneCount().classList.add("show");
      natUpdateReadyState();
    };
  });
}

function initNational() {
  natState = {
    examType: null,
    queryType: null,
    stream: null,
    subjects: [],
    year: null,
    count: null,
  };
  facets = null;
  countByKey = {};
  keyByLabel = {};
  buildExamGrid();
  buildStreamGrid();
  initCountChips();
  ["done-exam", "done-stream", "done-year", "done-subject", "done-count"].forEach((id) =>
    document.getElementById(id)?.classList.remove("show"),
  );
  subjectRow().style.display = "none";
  yearContainerNat().innerHTML =
    '<span class="picker-hint">Choose subjects to see available years</span>';
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
    setStatus("✓ All set. Ready to start.", true);
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
    setStatus("✓ All set. Ready to open paper.", true);
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

beginBtn.onclick = () => {
  if (beginBtn.disabled) return;

  if (activeCat === "national" || activeCat === "international") {
    // Spread the chosen total across the selected subjects.
    const total = natState.count || 40;
    const per = Math.max(1, Math.ceil(total / Math.max(1, natState.subjects.length)));
    const params = new URLSearchParams({
      source: "cbt",
      scheme: natState.queryType,
      // pass subject KEYS (the bank is keyed by subject key, not label)
      subjects: natState.subjects.map((l) => keyByLabel[l] || l).join(","),
      n: String(per),
    });
    window.location.href = `../question/question.html?${params.toString()}`;
    return;
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
    window.location.href = `../question/question.html?${params.toString()}`;
    return;
  }

  if (activeCat === "international") {
    if (!intlState.paperUrl) return;
    window.location.href = intlState.paperUrl;
  }
};

function initMode(cat) {
  // Both National and International run the CBT builder; only the scheme set differs.
  activeExamTypes = cat === "international" ? INTL_EXAM_TYPES : NAT_EXAM_TYPES;
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
  if (b.dataset.tab === "competition") b.style.display = "none";
});
const startCat = initialCat === "international" ? "international" : "national";
activeCat = startCat;
applyCat(startCat);
updateHeaderContent(startCat);
initMode(startCat);
