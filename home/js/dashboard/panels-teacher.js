import { I } from "./icons.js";
import { mountTeacherClassroom } from "./classroom-client.js";

export function buildTeacherPanels(user, data, layout) {
  const className = data.activeClass || "My Class";

  layout.dataset.role = "teacher";
  layout.innerHTML = `
    <div class="db-stat">
      <div class="db-stat-icon">${I.users}</div>
      <div class="db-stat-value" id="db-stat-students">—</div>
      <div class="db-stat-label">Students in class</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon">${I.papers}</div>
      <div class="db-stat-value" id="db-stat-activities">—</div>
      <div class="db-stat-label">Activities</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon">${I.check}</div>
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
`;

  mountTeacherClassroom(layout);
}
