import { I } from "/home/js/dashboard/icons.js";
import { doUpgrade } from "/home/js/dashboard/toolbar.js";
import { mountStudentClassroom } from "/home/js/dashboard/classroom-client.js";
import { mountCalendar } from "/home/js/dashboard/calendar-client.js";
import { ROUTES } from "/home/js/routing.js";

export function buildStudentPanels(user, data, layout) {
  layout.dataset.role = "student";
  layout.innerHTML = `
    <div class="db-panel bento-feature">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Your progress</p>
          <h2 class="db-panel-title" id="db-st-focus">Your activities</h2>
        </div>
        <span class="db-pill pill-yellow" id="db-st-done">— done</span>
      </div>

      <div class="db-ring" id="db-st-ring" style="--ring-progress:0">
        <div class="db-ring-inner">
          <strong class="db-ring-value" id="db-st-ring-val">0%</strong>
          <span class="db-ring-label">assignments<br>done</span>
        </div>
      </div>

      <div class="db-meter">
        <div class="db-meter-top">
          <span>Average score</span>
          <strong id="db-st-acc-val">—</strong>
        </div>
        <div class="db-meter-track">
          <div class="db-meter-fill fill-green" id="db-st-acc-bar" style="width:0%"></div>
        </div>
      </div>

      <div class="db-meter">
        <div class="db-meter-top">
          <span>Questions answered</span>
          <strong id="db-st-prob-val">0</strong>
        </div>
        <div class="db-meter-track">
          <div class="db-meter-fill fill-blue" id="db-st-prob-bar" style="width:0%"></div>
        </div>
      </div>

      <div class="db-divider"></div>
      <div class="db-perf-list" id="db-st-perf">
        <div class="db-empty">Answer an activity to see your subject scores.</div>
      </div>
    </div>

    <div class="db-panel bento-tall">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">From Your Teacher</p>
          <h2 class="db-panel-title">Assigned to me</h2>
        </div>
        <button class="db-icon-btn ib-blue" type="button" data-action="join-class" title="Join a class">${I.plus}</button>
      </div>
      <div class="db-assign-list" id="db-asg-list">
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

    <div class="db-panel span-full">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Quick Start</p>
          <h2 class="db-panel-title">Enter Math Labs</h2>
        </div>
      </div>
      <div class="db-action-grid">
        <a href="${ROUTES.EXAM_ARCHIVE}" class="db-action act-yellow">
          ${I.papers}<span>Past Papers</span>
        </a>
        <a href="${ROUTES.EQUIVALENT_FRACTIONS}" class="db-action act-blue">
          ${I.activity}<span>Interactive Labs</span>
        </a>
        <a href="${ROUTES.MATH_LAB}" class="db-action act-green">
          ${I.writing}<span>Scratchpad</span>
        </a>
        ${!data.isPremium ? `<button class="db-action act-red" type="button" data-action="upgrade">${I.star}<span>Go Premium</span></button>` : ""}
      </div>
    </div>`;

  layout
    .querySelector("[data-action='upgrade']")
    ?.addEventListener("click", doUpgrade);

  mountStudentClassroom(layout);
  mountCalendar(layout);
}
