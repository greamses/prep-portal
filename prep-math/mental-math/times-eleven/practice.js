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
const problemCard = document.querySelector(".mm-problem-card");
const siteNav = document.querySelector(".site-nav");

let streak = 0;
let answered = false;
let autoAdvanceTimer = null;

function randomProblem() {
  const k = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4 digits
  const min = 10 ** (k - 1);
  const max = 10 ** k - 1;
  const n = min + Math.floor(Math.random() * (max - min + 1));
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
}

function closePractice() {
  bd.classList.remove("open");
  bd.setAttribute("aria-hidden", "true");
  if (siteNav) siteNav.style.display = "";
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
