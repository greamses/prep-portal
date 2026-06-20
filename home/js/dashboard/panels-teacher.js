import { I } from "./icons.js";
import { PERSON_SVG, pillColor, fmtDate, pct } from "./utils.js";
import { perfBarHTML } from "./components.js";
import { MOCK } from "./mock-data.js";
import { renderCalendar } from "./calendar.js";
import { mountTeacherClassroom } from "./classroom-client.js";

export function buildTeacherPanels(user, data, layout) {
  const students = data.students || MOCK.teacherStudents;
  const assignments = data.assignments || MOCK.teacherAssignments;
  const className = data.activeClass || "My Math Class";
  const activeCount = students.filter((s) => s.status === "active").length;
  const avgAcc = students.length
    ? Math.round(
        students.reduce((a, s) => a + (Number(s.accuracy) || 0), 0) /
          students.length,
      )
    : 0;
  const needsHelp = students
    .filter((s) => (Number(s.accuracy) || 0) < 60 || !s.activeThisWeek)
    .slice(0, 6);
  const completionRate = assignments.length
    ? Math.round(
        assignments.reduce(
          (a, t) => a + pct((t.completedCount / (t.totalCount || 1)) * 100),
          0,
        ) / assignments.length,
      )
    : 0;

  layout.dataset.role = "teacher";
  layout.innerHTML = `
    <div class="db-stat">
      <div class="db-stat-icon">${I.users}</div>
      <div class="db-stat-value">${students.length}</div>
      <div class="db-stat-label">Math Students</div>
      <div class="db-stat-trend trend-up">${I.trendUp} ${activeCount} active today</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon">${I.check}</div>
      <div class="db-stat-value">${assignments.length}</div>
      <div class="db-stat-label">Active Math Tasks</div>
      <div class="db-stat-trend">${completionRate}% completion</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon">${I.chart}</div>
      <div class="db-stat-value">${avgAcc}%</div>
      <div class="db-stat-label">Formula Accuracy</div>
      <div class="db-stat-trend ${avgAcc >= 70 ? "trend-up" : "trend-down"}">
        ${avgAcc >= 70 ? I.trendUp + " Above target" : I.alert + " Below target"}
      </div>
    </div>

    <div class="db-panel bento-feature">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker" id="db-class-code">Class roster</p>
          <h2 class="db-panel-title">${className}</h2>
        </div>
        <button class="db-icon-btn ib-blue" type="button" data-action="add-student" title="Show class code">${I.plus}</button>
      </div>
      <ul class="db-roster" id="db-roster">
        <div class="db-empty">Loading…</div>
      </ul>
    </div>

    <div class="db-panel bento-tall">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Planning</p>
          <h2 class="db-panel-title">My Class Calendar</h2>
        </div>
      </div>
      <div id="teacher-calendar-container"></div>
    </div>

    <div class="db-panel bento-tall">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Task Manager</p>
          <h2 class="db-panel-title">My Activities</h2>
        </div>
        <a class="db-icon-btn ib-blue" href="/theory-page/" title="Build a new activity">${I.plus}</a>
      </div>
      <div class="db-assign-list" id="db-activities">
        <div class="db-empty">Loading…</div>
      </div>
    </div>

    <div class="db-panel span-full">
      <div class="db-panel-head">
        <div><p class="db-kicker" style="color:var(--red)">Intervention Alert</p><h2 class="db-panel-title">Students Struggling</h2></div>
      </div>
      ${needsHelp.length ? `<div class="db-perf-list">${needsHelp.map((s) => perfBarHTML(s.name, pct(s.accuracy), "var(--red)")).join("")}</div>` : `<div class="db-empty">All students are current on benchmarks.</div>`}
    </div>`;

  const calendarContainer = document.getElementById(
    "teacher-calendar-container",
  );
  if (calendarContainer) renderCalendar(calendarContainer, MOCK.scheduleEvents);

  mountTeacherClassroom(layout);
}
