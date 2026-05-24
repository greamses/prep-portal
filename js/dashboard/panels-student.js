import { I } from "./icons.js";
import { pct, scoreColor, pillColor, fmtDate } from "./utils.js";
import { assignmentItemHTML, perfBarHTML } from "./components.js";
import { MOCK } from "./mock-data.js";
import { renderCalendar } from "./calendar.js";
import { doUpgrade } from "./toolbar.js";

export function buildStudentPanels(user, data, layout) {
  const progress = pct(data.weeklyProgress, 72);
  const accuracy = pct(data.accuracy, 84);
  const streak = Math.max(0, Number(data.streakDays) || 3);
  const focus = data.currentFocus || "Arithmetic Practice";
  const tasks = data.assignedTasks || MOCK.studentTasks;
  const results = data.recentResults || MOCK.studentResults;
  const subjPerf = data.subjectPerf || MOCK.subjectPerf;
  const qCount = Number(data.questionsAnswered) || 0;
  const qBarWidth = Math.min(100, Math.round(qCount / 5));

  layout.dataset.role = "student";
  layout.innerHTML = `
    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Current Focus</p>
          <h2 class="db-panel-title">${focus}</h2>
        </div>
        <span class="db-pill pill-yellow">${streak}d streak</span>
      </div>

      <div class="db-ring" style="--ring-progress:${progress}">
        <div class="db-ring-inner">
          <strong class="db-ring-value">${progress}%</strong>
          <span class="db-ring-label">weekly<br>goal</span>
        </div>
      </div>

      <div class="db-meter">
        <div class="db-meter-top">
          <span>Formula & Step Accuracy</span>
          <strong>${accuracy}%</strong>
        </div>
        <div class="db-meter-track">
          <div class="db-meter-fill ${scoreColor(accuracy)}" style="width:${accuracy}%"></div>
        </div>
      </div>

      <div class="db-meter">
        <div class="db-meter-top">
          <span>Problems Solved</span>
          <strong>${qCount.toLocaleString()}</strong>
        </div>
        <div class="db-meter-track">
          <div class="db-meter-fill fill-blue" style="width:${qBarWidth}%"></div>
        </div>
      </div>

      <div class="db-divider"></div>
      <div class="db-perf-list">
        ${subjPerf.map((s) => perfBarHTML(s.subject, s.score)).join("")}
      </div>
    </div>

    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Live Schedule</p>
          <h2 class="db-panel-title">Class Calendar</h2>
        </div>
        <span class="db-pill pill-blue">Labs</span>
      </div>
      <div id="student-calendar-container"></div>
    </div>

    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">From Your Teacher</p>
          <h2 class="db-panel-title">Active Tasks</h2>
        </div>
        <a href="/assignments/index.html" class="db-icon-btn" title="View all assignments">${I.arrow}</a>
      </div>
      <div class="db-assign-list">
        ${tasks.length ? tasks.map((t) => assignmentItemHTML(t)).join("") : `<div class="db-empty">No active assignments.</div>`}
      </div>
    </div>

    <div class="db-panel span-full">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Quick Start</p>
          <h2 class="db-panel-title">Enter Math Labs</h2>
        </div>
      </div>
      <div class="db-action-grid">
        <a href="/exam-archive/national/exams/index.html" class="db-action act-yellow">
          ${I.papers}<span>Past Papers</span>
        </a>
        <a href="/prep-math/activity/equivalent-fractions/index.html" class="db-action act-blue">
          ${I.activity}<span>Interactive Labs</span>
        </a>
        <a href="/math-lab/index.html" class="db-action act-green">
          ${I.writing}<span>Scratchpad</span>
        </a>
        ${!data.isPremium ? `<button class="db-action act-red" type="button" data-action="upgrade">${I.star}<span>Go Premium</span></button>` : ""}
      </div>
    </div>`;

  const calendarContainer = document.getElementById(
    "student-calendar-container",
  );
  if (calendarContainer) {
    renderCalendar(calendarContainer, MOCK.scheduleEvents);
  }

  layout
    .querySelector("[data-action='upgrade']")
    ?.addEventListener("click", doUpgrade);
}
