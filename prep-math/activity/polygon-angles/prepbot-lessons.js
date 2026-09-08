/* ============================================================================
   POLYGON ANGLES — the guided lessons
   ----------------------------------------------------------------------------
   This page used to carry a mascot of its own: a hand-drawn robot in the old
   neon palette, with its own bubble, its own typewriter, its own microphone and
   its own model call. That is against the house rule twice over — one mascot
   (prep-math/mental-math/shared/prepbot-teacher.js) and one AI layer — and it
   never even ran: the file was an ES module, so it was deferred, while the page
   called `RobotTeacher.init(...)` from a plain inline script that executed
   first. Every load threw "RobotTeacher is not defined" and the lessons were
   dead on arrival.

   So the character is now the shared PrepBot: same avatar, bubble, beep/talk
   voice and idle impulses as Mental Math ×11 and Cartesian Art, and its "Ask"
   button opens the site's real chat rather than a private model call.

   What stays here is the part that IS this page's: the lesson scripts in
   modules/*.js, stepping through them, and watching what the learner does to
   the polygon to decide whether a step is done.

   `window.RobotTeacher` is kept as the name of the public surface because
   script.js calls it from a dozen places; only the thing behind it changed.
   ========================================================================== */

import { PrepbotTeacher } from "/prep-math/mental-math/shared/prepbot-teacher.js";
import { auth } from "/firebase-init.js";

const PROGRESS_KEY = "pa-lesson-progress";
const REMINDER_MS = 15000;

const S = {
  currentModuleId: null,
  currentLessonId: null,
  steps: [],
  onLessonComplete: null,
};

let teacher = null;
let stepIndex = 0;
let stepDone = false;
let reminderTimer = null;
let highlighted = null;
let lastObservation = { key: "", at: 0 };
let progress = { completedLessons: {}, currentModule: null, currentLesson: null, currentStep: 0 };

/* ── progress ─────────────────────────────────────────────────────────────
   Local only. It is a "where was I" convenience, not a record worth a
   round-trip, and the old file's Firestore write was never reached anyway. */
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) progress = { ...progress, ...JSON.parse(raw) };
  } catch { /* private mode, or nothing saved yet */ }
}
function saveProgress() {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch { /* ignore */ }
}

/* ── highlighting the control a step is about ─────────────────────────── */
function clearHighlight() {
  if (!highlighted) return;
  highlighted.classList.remove("pa-lesson-target");
  if (highlighted.dataset.paAddedPosition) {
    highlighted.style.position = "";
    delete highlighted.dataset.paAddedPosition;
  }
  highlighted = null;
}

function highlight(selector) {
  clearHighlight();
  if (!selector) return;
  const el = document.querySelector(selector);
  if (!el) return;
  /* Point at the whole control, not the bare input: a range or a checkbox is
     a sliver on its own and the ring reads as pointing at nothing. */
  highlighted =
    el.type === "range" ? el.closest(".slider-wrap") || el
    : el.type === "checkbox" ? el.closest(".toggle") || el
    : el;
  if (getComputedStyle(highlighted).position === "static") {
    highlighted.style.position = "relative";
    highlighted.dataset.paAddedPosition = "true";
  }
  highlighted.classList.add("pa-lesson-target");
}

/* ── stepping ─────────────────────────────────────────────────────────── */
const currentStep = () => S.steps[stepIndex] || null;

function say(text, mode = "speech") {
  return teacher ? teacher.speak([{ text, mode }], { colorSeed: stepIndex }) : Promise.resolve();
}

function startReminder() {
  clearTimeout(reminderTimer);
  reminderTimer = setTimeout(() => {
    const step = currentStep();
    if (step && !stepDone && !teacher?.asleep) {
      say(step.reminder || "Have a go at this step, then tap Next.", "thinking");
    }
    startReminder();
  }, REMINDER_MS);
}

function showStep() {
  const step = currentStep();
  if (!step || step.action === "return_to_map") { finishLesson(); return; }

  clearHighlight();
  clearTimeout(reminderTimer);
  stepDone = isCompleted(stepIndex);
  syncNav();
  teacher?.show();
  say(step.instruction);
  highlight(step.target);
  startReminder();
}

function goto(index) {
  if (index < 0 || index > S.steps.length) return;
  stepIndex = index;
  progress.currentStep = stepIndex;
  saveProgress();
  showStep();
}

const completedKey = () => `${S.currentModuleId}_${S.currentLessonId}`;
function isCompleted(i) {
  return Boolean(progress.completedSteps?.[completedKey()]?.[i]);
}
function markCompleted(i) {
  progress.completedSteps = progress.completedSteps || {};
  progress.completedSteps[completedKey()] = progress.completedSteps[completedKey()] || {};
  progress.completedSteps[completedKey()][i] = true;
}

function finishLesson() {
  clearHighlight();
  clearTimeout(reminderTimer);
  teacher?.hide();
  const { currentModuleId: m, currentLessonId: l } = S;
  if (m && l) {
    progress.completedLessons[`${m}_${l}`] = true;
    progress.currentModule = null;
    progress.currentLesson = null;
    progress.currentStep = 0;
    saveProgress();
  }
  S.steps = [];
  S.currentModuleId = null;
  S.currentLessonId = null;
  if (typeof S.onLessonComplete === "function") S.onLessonComplete(m, l);
}

/* ── watching what the learner does ───────────────────────────────────── */
function dataMatches(expected, actual) {
  if (!expected) return true;
  for (const [k, v] of Object.entries(expected)) {
    if (!(k in actual)) return false;
    if (String(actual[k]) === String(v)) continue;
    if (typeof v === "boolean" && Boolean(actual[k]) === v) continue;
    return false;
  }
  return true;
}

function observe(action, data = {}) {
  if (!teacher || teacher.asleep) return;
  /* The controls fire in bursts while a slider is dragged; one identical
     observation inside 800ms is the same event as far as a lesson cares. */
  const key = action + JSON.stringify(data);
  const now = Date.now();
  if (key === lastObservation.key && now - lastObservation.at < 800) return;
  lastObservation = { key, at: now };

  const step = currentStep();
  if (!step || step.action === "return_to_map") return;
  if (action !== step.action) return;
  if (step.expectedData && !dataMatches(step.expectedData, data)) return;

  clearTimeout(reminderTimer);
  clearHighlight();
  stepDone = true;
  markCompleted(stepIndex);
  saveProgress();
  syncNav();
  say(step.success || "That's it. Tap Next when you're ready.");
}

/* ── the Next / Back strip ────────────────────────────────────────────── */
let navBar = null;
let btnBack = null;
let btnNext = null;

function syncNav() {
  if (!navBar) return;
  btnBack.disabled = stepIndex === 0;
  btnNext.textContent = stepIndex >= S.steps.length - 1 ? "Finish" : "Next";
  navBar.classList.toggle("pa-lesson-nav--ready", stepDone);
}

function buildBot() {
  const root = document.createElement("div");
  /* Keeps the id script.js already shows and hides it by. */
  root.id = "rt-guide-wrapper";
  root.className = "mm-prepbot pa-prepbot";
  root.innerHTML = `
    <div class="mm-prepbot-bubble mm-prepbot-bubble--speech mm-prepbot-bubble--hidden" id="paBotBubble" aria-hidden="true">
      <p id="paBotText"></p>
    </div>
    <div class="pa-lesson-nav" id="paBotNav">
      <button class="pp-btn pa-lesson-back" id="paBotBack" type="button">Back</button>
      <button class="pp-btn pa-lesson-next" id="paBotNext" type="button">Next</button>
    </div>
    <div class="mm-prepbot-avatar-wrap">
      <div class="mm-prepbot-menu" id="paBotMenu">
        <button class="mm-prepbot-menu-btn" id="paBotAsk" type="button" title="Ask PrepBot a question" aria-label="Ask PrepBot a question"></button>
        <button class="mm-prepbot-menu-btn" id="paBotVoice" type="button" title="Beep or talking voice" aria-label="Toggle beep or talking voice"></button>
        <button class="mm-prepbot-menu-btn" id="paBotSleep" type="button" title="Sleep" aria-label="Sleep PrepBot"></button>
        <button class="mm-prepbot-menu-btn" id="paBotPoke" type="button" title="Wiggle" aria-label="Wiggle PrepBot"></button>
      </div>
      <div class="mm-prepbot-avatar" id="paBotAvatar" aria-hidden="true"></div>
    </div>`;
  document.body.appendChild(root);

  navBar = root.querySelector("#paBotNav");
  btnBack = root.querySelector("#paBotBack");
  btnNext = root.querySelector("#paBotNext");
  btnBack.addEventListener("click", () => goto(stepIndex - 1));
  btnNext.addEventListener("click", () => goto(stepIndex + 1));

  teacher = new PrepbotTeacher({
    root,
    boundsEl: document.body,
    auth,
    menu: {
      ask: root.querySelector("#paBotAsk"),
      voice: root.querySelector("#paBotVoice"),
      sleep: root.querySelector("#paBotSleep"),
      poke: root.querySelector("#paBotPoke"),
    },
  });

  /* GSAP only drives the idle impulses, so the bot is usable the moment it
     mounts and simply becomes livelier once this resolves. */
  import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
    .then((m) => { teacher.gsap = m.default || m.gsap || m; teacher.scheduleIdle(); })
    .catch(() => { /* no idle animation; everything else still works */ });

  return root;
}

/* ── public surface (what script.js calls) ────────────────────────────── */
let mounted = false;

function mount() {
  if (mounted) return;
  mounted = true;
  loadProgress();
  buildBot();
  teacher.hide();
  document.getElementById("rt-guide-wrapper").style.display = "none";
}

window.RobotTeacher = {
  /* Called more than once — the inline bootstrap and again from script.js to
     hand over onLessonComplete — so it merges rather than replaces. */
  init(config = {}) {
    Object.assign(S, config);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount, { once: true });
    } else {
      mount();
    }
    return this;
  },

  observe,

  loadModuleLesson(moduleId, lessonId) {
    if (!mounted) { mount(); }
    const mod = window.PolygonModules?.[moduleId];
    const lesson = mod?.lessons?.[lessonId - 1];
    if (!lesson) {
      teacher?.show();
      say("That lesson isn't ready yet — try another one.", "thinking");
      return;
    }
    S.currentModuleId = moduleId;
    S.currentLessonId = lessonId;
    S.steps = [...lesson.steps];
    progress.currentModule = moduleId;
    progress.currentLesson = lessonId;
    /* Pick up where this lesson was left, unless it was already finished. */
    const resume = progress.currentStep || 0;
    stepIndex = progress.completedLessons[`${moduleId}_${lessonId}`] ? 0
      : Math.min(resume, S.steps.length - 1);
    showStep();
  },

  startTutorial() {
    if (progress.currentModule && progress.currentLesson) {
      this.loadModuleLesson(progress.currentModule, progress.currentLesson);
    }
  },

  disable() { teacher?.sleep(true); },
};

/* The page's own bootstrap used to be an inline classic script, which is the
   whole reason this never ran. Booting from the module itself removes the
   ordering question entirely. */
window.RobotTeacher.init({ grade: "JSS2" });
