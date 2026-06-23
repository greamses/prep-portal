import { I } from "./icons.js";
import { mountTeacherClassroom } from "./classroom-client.js";
import { mountCalendar } from "./calendar-client.js";

export function buildTeacherPanels(user, data, layout) {
  const className = data.activeClass || "My Class";

  layout.dataset.role = "teacher";
  layout.innerHTML = `
    <div class="db-stat pp-sticky pp-sticky--c2" style="--pp-note-tilt:-2deg;">
      <div class="db-stat-value" id="db-stat-students">—</div>
      <div class="db-stat-label">Students in class</div>
    </div>

    <div class="db-stat pp-sticky pp-sticky--c4" style="--pp-note-tilt:1.5deg;">
      <div class="db-stat-value" id="db-stat-activities">—</div>
      <div class="db-stat-label">Activities</div>
    </div>

    <div class="db-stat pp-sticky pp-sticky--c0" style="--pp-note-tilt:-1.5deg;">
      <div class="db-stat-value" id="db-stat-subs">—</div>
      <div class="db-stat-label">Submissions</div>
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
          <p class="db-kicker">Task Manager</p>
          <h2 class="db-panel-title">My Activities</h2>
        </div>
        <a class="db-icon-btn ib-blue" href="/theory-page/" title="Build a new activity">${I.plus}</a>
      </div>
      <div class="db-assign-list" id="db-activities">
        <div class="db-empty">Loading…</div>
      </div>
    </div>

    <div class="db-panel span-full db-calendar-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Schedule</p>
          <h2 class="db-panel-title">Class Calendar</h2>
        </div>
      </div>
      <div id="db-calendar-mount"><div class="db-empty">Loading…</div></div>
    </div>
`;

  mountTeacherClassroom(layout);
  mountCalendar(layout);
}
