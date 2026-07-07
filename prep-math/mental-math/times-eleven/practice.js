/* ═══════════════════════════════════════════════════════
   × 11 TRICK — endless practice
   Overlay quiz built on shared/practice-queue.js's growing queue (paging
   back never regenerates a problem you've already seen).
═══════════════════════════════════════════════════════ */
import { createPracticeQueue, attachSwipeNav } from "../shared/practice-queue.js";

const openBtn = document.getElementById("mmPracticeBtn");
const bd = document.getElementById("mmPracticeBd");
const closeBtn = document.getElementById("mmPracticeClose");
const progressEl = document.getElementById("mmPracticeProgress");
const prevBtn = document.getElementById("mmPracPrev");
const nextBtn = document.getElementById("mmPracNext");
const problemText = document.getElementById("mmProblemText");
const answerInput = document.getElementById("mmAnswerInput");
const checkBtn = document.getElementById("mmCheckBtn");
const feedback = document.getElementById("mmFeedback");
const streakEl = document.getElementById("mmStreak");
const timerEl = document.getElementById("mmTimer");
const problemCard = document.querySelector(".mm-problem-card");
const siteNav = document.querySelector(".site-nav");

let streak = 0;
let answered = false;
let autoAdvanceTimer = null;

// Speed-practice stopwatch — runs for the whole session (not per-question),
// so the student can race their own clock across a run of problems.
let timerStart = 0;
let timerInterval = null;
function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function startTimer() {
  timerStart = Date.now();
  timerEl.textContent = `Time: ${formatElapsed(0)}`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerEl.textContent = `Time: ${formatElapsed(Date.now() - timerStart)}`;
  }, 250);
}
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// Practice must drill the same variant the student is currently looking at
// on the demo stage (scene.js keeps ?case= in the URL in sync with the
// active pill), so read it fresh on every generated problem rather than
// once at load — switching pills before reopening Practice should retarget it.
function randomInRange(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function digitsOf(n) {
  return String(n).split("").map(Number);
}
function hasRegroup(digits) {
  for (let i = 0; i < digits.length - 1; i++) {
    if (digits[i] + digits[i + 1] >= 10) return true;
  }
  return false;
}
const MAX_ATTEMPTS = 500;
function randomNIn(min, max, wantRegroup) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const n = randomInRange(min, max);
    if (hasRegroup(digitsOf(n)) === wantRegroup) return n;
  }
  return randomInRange(min, max); // fallback if the constraint proved too rare
}

function randomProblem() {
  const caseKey = new URLSearchParams(location.search).get("case");
  let n;
  if (caseKey === "2-no-regroup") n = randomNIn(10, 99, false);
  else if (caseKey === "2-regroup") n = randomNIn(10, 99, true);
  else if (caseKey === "3plus-no-regroup" || caseKey === "3plus-regroup") {
    const k = Math.random() < 0.5 ? 3 : 4;
    n = randomNIn(10 ** (k - 1), 10 ** k - 1, caseKey === "3plus-regroup");
  } else {
    const k = 2 + Math.floor(Math.random() * 3); // unscoped fallback: 2, 3, or 4 digits
    n = randomInRange(10 ** (k - 1), 10 ** k - 1);
  }
  return { n, answer: n * 11 };
}

const queue = createPracticeQueue({ generate: randomProblem });

function loadProblem(problem) {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  answered = false;
  problemText.textContent = `${problem.n} × 11 = ?`;
  answerInput.value = "";
  feedback.textContent = "";
  feedback.className = "mm-feedback";
  progressEl.textContent = `${queue.index + 1}`;
  prevBtn.disabled = queue.index === 0;
  answerInput.focus();
}

function check() {
  if (answered) return;
  const problem = queue.current();
  const raw = answerInput.value.trim();
  if (!raw) {
    feedback.className = "mm-feedback fb-error";
    feedback.textContent = "Type your answer first.";
    return;
  }
  if (parseInt(raw, 10) === problem.answer) {
    answered = true;
    streak += 1;
    streakEl.textContent = `Streak: ${streak}`;
    feedback.className = "mm-feedback fb-success";
    feedback.textContent = "Correct!";
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      if (bd.classList.contains("open")) loadProblem(queue.goNext());
    }, 700);
  } else {
    streak = 0;
    streakEl.textContent = `Streak: ${streak}`;
    feedback.className = "mm-feedback fb-error";
    feedback.textContent = "Not quite — try again.";
  }
}

function openPractice() {
  queue.reset();
  streak = 0;
  streakEl.textContent = `Streak: ${streak}`;
  loadProblem(queue.goNext());
  bd.classList.add("open");
  bd.setAttribute("aria-hidden", "false");
  if (siteNav) siteNav.style.display = "none";
  startTimer();
}

function closePractice() {
  bd.classList.remove("open");
  bd.setAttribute("aria-hidden", "true");
  if (siteNav) siteNav.style.display = "";
  stopTimer();
}

openBtn.addEventListener("click", openPractice);
closeBtn.addEventListener("click", closePractice);
bd.addEventListener("click", (e) => {
  if (e.target === bd) closePractice();
});

checkBtn.addEventListener("click", check);
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") check();
});

prevBtn.addEventListener("click", () => loadProblem(queue.goPrev()));
nextBtn.addEventListener("click", () => loadProblem(queue.goNext()));
attachSwipeNav(problemCard, {
  onPrev: () => loadProblem(queue.goPrev()),
  onNext: () => loadProblem(queue.goNext()),
});

document.addEventListener("keydown", (e) => {
  if (!bd.classList.contains("open")) return;
  if (e.key === "Escape") closePractice();
});
