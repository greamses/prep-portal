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
    note: "Practise by class — pick your class, subject, topic & paper for an instant, marked set.",
    stats: `
      <span class="hero-stat theme-blue"><strong>By</strong> class</span>
      <span class="hero-stat theme-green"><strong>By</strong> topic</span>
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

// ── CBT picker: a generic Class/Exam → Subject → Topic → Paper cascade ──────
// Drives three tabs from ONE flow, served from the static manifest
// (/data/cbt/manifest.js) → 0 Firestore reads:
//   • National  tab → axis "exam",  region "national"      (UTME/WASSCE/…)
//   • International →  axis "exam",  region "international"  (SAT/IGCSE/A-Level)
//   • Class     tab → axis "class"                          (JSS1/SSS2/…)
let cbtState = {
  axis: "class", region: null,
  top: null, topLabel: null,        // class key or exam(scheme) key
  subject: null, subjectLabel: null,
  topic: null, paper: null,
  format: "",                       // "" | "mcq" | "short" | "theory"
  _subjects: null, _topics: null, _papers: 1, _topicCount: 0,
};

// Premium gate for the MCQ filter — resolved once, from the CACHED profile
// (data-service: 0 extra reads when the nav already warmed it). null = unknown.
let _pickerPremium = null;
async function isPickerPremium() {
  if (_pickerPremium !== null) return _pickerPremium;
  try {
    const u = await ppCurrentUser();
    if (!u) return (_pickerPremium = false);
    const { getProfile } = await import("/utils/data-service.js");
    const p = await getProfile(u.uid);
    _pickerPremium = !!(p && p.isPremium);
  } catch (_) { _pickerPremium = false; }
  return _pickerPremium;
}

let CBT_BANK = null;       // the /utils/cbt-bank.js module (lazy)
let CBT_MANIFEST = null;   // the navigation index (lazy)
async function cbtManifest() {
  if (CBT_MANIFEST) return CBT_MANIFEST;
  try {
    CBT_BANK = CBT_BANK || (await import("/utils/cbt-bank.js"));
    CBT_MANIFEST = (await CBT_BANK.manifest()) || { classes: [], exams: { national: [], international: [] }, paperSize: 60 };
  } catch (e) {
    CBT_MANIFEST = { classes: [], exams: { national: [], international: [] }, paperSize: 60 };
  }
  return CBT_MANIFEST;
}

// Step-cards, repurposed: 1=Top (Class/Exam) 2=Subject 3=Topic 4=Paper.
const cTopBox = () => document.getElementById("exam-chips");
const cSubjectBox = () => document.getElementById("stream-chips");
const cTopicBox = () => document.getElementById("subject-chips");
const cPaperBox = () => document.getElementById("year-chips");
const cTopDone = () => document.getElementById("done-exam");
const cSubjectDone = () => document.getElementById("done-stream");
const cTopicDone = () => document.getElementById("done-subject");
const cPaperDone = () => document.getElementById("done-year");
const cTopicCard = () => document.getElementById("subject-row");
const cPaperCard = () => document.querySelector(".step-card-4");
const cFormatWrap = () => document.getElementById("cbt-format-wrap");
const cFormatChips = () => document.getElementById("cbt-format-chips");
const cFormatLockNote = () => document.getElementById("fmt-lock-note");

// Render the "What to answer" filter (All / MCQs / Short Answer / Theory).
// MCQs are Premium-only: for free users the chip is locked and clicking it shows
// an upgrade prompt instead of selecting it.
async function renderCbtFormat() {
  const wrap = cFormatWrap(), chips = cFormatChips(), note = cFormatLockNote();
  if (!wrap || !chips) return;
  wrap.style.display = "";
  const premium = await isPickerPremium();
  chips.querySelectorAll(".fmt-chip").forEach((chip) => {
    const fmt = chip.dataset.fmt || "";
    const locked = fmt === "mcq" && !premium;
    chip.classList.toggle("locked", locked);
    let lock = chip.querySelector(".fmt-lock");
    if (locked && !lock) {
      lock = document.createElement("span");
      lock.className = "fmt-lock";
      lock.textContent = "PRO";
      chip.appendChild(lock);
    } else if (!locked && lock) { lock.remove(); }
    chip.classList.toggle("checked", fmt === (cbtState.format || ""));
    chip.onclick = () => {
      if (chip.classList.contains("locked")) {
        if (note) note.style.display = "";
        return; // don't select — prompt upgrade
      }
      if (note) note.style.display = "none";
      chips.querySelectorAll(".fmt-chip").forEach((c) => c.classList.remove("checked"));
      chip.classList.add("checked");
      cbtState.format = fmt;
    };
  });
}

function natUpdateReadyState() {
  const ready = cbtState.top && cbtState.subject && cbtState.topic && cbtState.paper;
  beginBtn.disabled = !ready;
  if (ready) { setStatus("All set. Ready — start your test.", true); return; }
  const need = [];
  if (!cbtState.top) need.push(cbtState.axis === "class" ? "class" : "exam");
  else if (!cbtState.subject) need.push("subject");
  else if (!cbtState.topic) need.push("topic");
  else need.push("paper");
  setStatus("Select: " + need.join(" • "), false);
}

function cbtChips(box, items, selectedId, onPick, { dot = false, empty = "Nothing here yet." } = {}) {
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

// The "top" list (classes, or the exams for the active region).
function cbtTops(M) {
  if (cbtState.axis === "class") return (M.classes || []).map((c) => ({ id: c.key, label: c.label, _subjects: c.subjects }));
  const list = (M.exams && M.exams[cbtState.region]) || [];
  return list.map((e) => ({ id: e.key, label: e.label, _subjects: e.subjects }));
}

async function buildTops() {
  const box = cTopBox();
  box.innerHTML = '<span class="picker-hint">Loading…</span>';
  const M = await cbtManifest();
  const tops = cbtTops(M);
  const empty = cbtState.axis === "class" ? "No class questions yet." : "No exam questions yet.";
  cbtChips(box, tops.map((t) => ({ id: t.id, label: t.label })), cbtState.top,
    (it) => selectTop(tops.find((t) => t.id === it.id)), { dot: true, empty });
}

function selectTop(top) {
  cbtState.top = top.id; cbtState.topLabel = top.label; cbtState._subjects = top._subjects || [];
  cbtState.subject = cbtState.subjectLabel = cbtState.topic = cbtState.paper = null;
  cbtState.format = "";
  cTopDone().classList.add("show");
  [cSubjectDone(), cTopicDone(), cPaperDone()].forEach((d) => d && d.classList.remove("show"));
  cTopicCard().style.display = "none";
  if (cPaperCard()) cPaperCard().style.display = "none";
  if (cFormatWrap()) cFormatWrap().style.display = "none";
  renderCbtSubjects();
  natUpdateReadyState();
}

function renderCbtSubjects() {
  const subs = cbtState._subjects || [];
  cbtChips(cSubjectBox(), subs.map((s) => ({ id: s.key, label: s.label, count: s.count })), cbtState.subject,
    (it) => selectCbtSubject(subs.find((s) => s.key === it.id)), { empty: "No subjects yet." });
}

function selectCbtSubject(sub) {
  cbtState.subject = sub.key; cbtState.subjectLabel = sub.label; cbtState._topics = sub.topics || [];
  cbtState.topic = cbtState.paper = null;
  cbtState.format = "";
  cSubjectDone().classList.add("show");
  [cTopicDone(), cPaperDone()].forEach((d) => d && d.classList.remove("show"));
  cTopicCard().style.display = "";
  if (cPaperCard()) cPaperCard().style.display = "none";
  if (cFormatWrap()) cFormatWrap().style.display = "none";
  renderCbtTopics();
  natUpdateReadyState();
}

function renderCbtTopics() {
  const topics = cbtState._topics || [];
  cbtChips(cTopicBox(), topics.map((t) => ({ id: t.name, label: t.name, count: t.count })), cbtState.topic,
    (it) => selectCbtTopic(topics.find((t) => t.name === it.id)), { empty: "No topics yet." });
}

function selectCbtTopic(t) {
  cbtState.topic = t.name; cbtState._papers = t.papers || 1; cbtState._topicCount = t.count || 0;
  cbtState.paper = null;
  cTopicDone().classList.add("show");
  if (cPaperDone()) cPaperDone().classList.remove("show");
  if (cPaperCard()) cPaperCard().style.display = "";
  renderCbtPapers();
  renderCbtFormat();
  natUpdateReadyState();
}

function renderCbtPapers() {
  const n = cbtState._papers || 1, cnt = cbtState._topicCount || 0;
  const items = Array.from({ length: n }, (_, i) => ({ id: String(i + 1), label: `Paper ${i + 1}`, count: Math.min(60, cnt - i * 60) }));
  cbtChips(cPaperBox(), items, cbtState.paper, (it) => {
    cbtState.paper = it.id;
    cPaperDone().classList.add("show");
    natUpdateReadyState();
  }, { dot: true, empty: "No papers yet." });
}

// Relabel the national step-cards for the active axis; hide the count step.
function relabelCbtSteps() {
  const set = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
  const isClass = cbtState.axis === "class";
  set('.step-card-1 .step-title[data-cat="national"]', isClass ? "Class" : "Exam");
  set('.step-card-1 .step-sub[data-cat="national"]', isClass ? "Pick your class" : "Pick an exam style");
  set('.step-card-2 .step-title[data-cat="national"]', "Subject");
  set('.step-card-2 .step-sub[data-cat="national"]', "Pick a subject");
  set('#subject-row .step-title', "Topic");
  set('#compulsoryHint', "Pick a topic");
  set('.step-card-4 .step-title[data-cat="national"]', "Paper");
  set('.step-card-4 .step-sub[data-cat="national"]', "Each paper has up to 60 questions");
  const countCard = document.querySelector(".step-card-5");
  if (countCard) countCard.style.display = "none";
}

// Entry point for the National / International / Class tabs.
function initCbt(axis, region) {
  cbtState = {
    axis, region: region || null,
    top: null, topLabel: null, subject: null, subjectLabel: null, topic: null, paper: null,
    format: "",
    _subjects: null, _topics: null, _papers: 1, _topicCount: 0,
  };
  relabelCbtSteps();
  ["done-exam", "done-stream", "done-subject", "done-year"].forEach((id) => document.getElementById(id)?.classList.remove("show"));
  cTopicCard().style.display = "none";
  if (cPaperCard()) cPaperCard().style.display = "none";
  if (cFormatWrap()) cFormatWrap().style.display = "none";
  buildTops();
  natUpdateReadyState();
}

// Back-compat shim: initMode() still calls initNational().
function initNational() { initCbt(cbtState.axis || "class", cbtState.region); }

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
  // National / International / Class all run the CBT cascade and serve from the
  // local bank (source=cbtlocal). The chosen paper IS the test (up to 60 Qs).
  if (activeCat !== "competition") {
    if (!cbtState.top || !cbtState.subject || !cbtState.topic || !cbtState.paper) return null;
    const params = new URLSearchParams({
      source: "cbtlocal",
      axis: cbtState.axis,
      // axis=class → class key; axis=exam → scheme key (both in `top`).
      [cbtState.axis === "class" ? "class" : "scheme"]: cbtState.top,
      // `subjects` (plural) so the quiz engine's subject loop reads it; single value.
      subjects: cbtState.subject,
      topic: cbtState.topic,
      paper: String(cbtState.paper),
    });
    if (cbtState.format) params.set("format", cbtState.format);
    return `../question/question.html?${params.toString()}`;
  }

  // Competition tab keeps its existing static-paper flow.
  const { competition, division, year, round, section } = compState;
  const params = new URLSearchParams({
    source: "competition", comp: competition, div: division, year, round, section,
  });
  return `../question/question.html?${params.toString()}`;
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
    const defTitle = `${cbtState.topLabel || "Practice"} • ${cbtState.subjectLabel || cbtState.subject || ""} • ${cbtState.topic || ""} (Paper ${cbtState.paper || ""})`.slice(0, 120);
    const title = (window.prompt("Title for this assignment:", defTitle) || "").trim();
    if (!title) return; // cancelled or empty
    const token = await ppAuthToken();
    if (!token) { setAssign("Sign in first"); return; }
    setAssign("Assigning…");
    try {
      const r = await fetch(`${API_BASE}/api/classroom/assign-cbt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ url, title, subject: cbtState.subject || "", all: true }),
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
  // Map each tab to the CBT cascade's axis/region:
  //   national → exam/national   international → exam/international   else → class
  if (cat === "national") initCbt("exam", "national");
  else if (cat === "international") initCbt("exam", "international");
  else initCbt("class", null); // the "practice" tab is now Class
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
// Tabs: National (exam) · International (exam) · Class (the old "practice" tab,
// relabelled). Competition (third-party papers) stays hidden until licensed.
document.querySelectorAll(".cat-tab").forEach((b) => {
  if (b.dataset.tab === "competition") b.style.display = "none";
  if (b.dataset.tab === "practice") b.textContent = "Class"; // the per-class practice tab
});
const startCat = initialCat === "practice" ? "practice" : "national";
activeCat = startCat;
applyCat(startCat);
updateHeaderContent(startCat);
initMode(startCat);
