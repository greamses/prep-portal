import { I } from "./icons.js";
import { PERSON_SVG, pillColor, fmtDate, pct } from "./utils.js";
import { perfBarHTML } from "./components.js";
import { MOCK } from "./mock-data.js";
import { renderCalendar } from "./calendar.js";
import { showAssignmentModal } from "./dashboard-modals.js";

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
          <p class="db-kicker">Class Roster</p>
          <h2 class="db-panel-title">${className}</h2>
        </div>
        <button class="db-icon-btn ib-blue" type="button" data-action="add-student" title="Add student">${I.plus}</button>
      </div>
      <ul class="db-roster">
        ${students
          .map((s) => {
            const dotCls =
              s.status === "active"
                ? "dot-green"
                : s.status === "idle"
                  ? "dot-yellow"
                  : "dot-grey";
            const acc = pct(s.accuracy);
            return `
            <li class="db-roster-item">
              <div class="db-roster-avatar">${PERSON_SVG}</div>
              <div>
                <div class="db-roster-name">${s.name}</div>
                <div class="db-roster-sub">${s.class || className} &bull; Last active: ${s.lastActive || "never"}</div>
              </div>
              <div class="db-roster-meta">
                <span class="db-dot ${dotCls}" title="${s.status}"></span>
                <span class="db-pill ${pillColor(acc)}">${acc}%</span>
              </div>
            </li>`;
          })
          .join("")}
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
          <h2 class="db-panel-title">Math Assignments</h2>
        </div>
        <button class="db-icon-btn ib-blue" type="button" data-action="new-assignment" title="Create assignment">${I.plus}</button>
      </div>
      <div class="db-assign-list">
        ${
          assignments.length
            ? assignments
                .map((a) => {
                  const done = pct(
                    (a.completedCount / (a.totalCount || 1)) * 100,
                  );
                  return `
            <div class="db-assign-item">
              <div class="db-assign-top">
                <div>
                  <div class="db-assign-title">${a.title}</div>
                  <div class="db-assign-meta">Due ${fmtDate(a.dueDate)}</div>
                </div>
                <span class="db-pill pill-blue">${a.completedCount || 0}/${a.totalCount || 0}</span>
              </div>
              <div class="db-assign-progress-row">
                <div class="db-assign-track"><div class="db-assign-fill" style="width:${done}%"></div></div>
                <span class="db-assign-pct">${done}% done</span>
              </div>
            </div>`;
                })
                .join("")
            : `<div class="db-empty">No active assignments.</div>`
        }
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

  layout
    .querySelector("[data-action='new-assignment']")
    ?.addEventListener("click", showAssignmentModal);
}
