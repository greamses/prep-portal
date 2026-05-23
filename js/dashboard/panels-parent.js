import { I } from "./icons.js";
import { pct, initial, scoreColor, fmtDate } from "./utils.js";
import { assignmentItemHTML, perfBarHTML } from "./components.js";
import { renderCalendar } from "./calendar.js";
import { MOCK } from "./mock-data.js";
import { showLinkChildModal } from "./dashboard-modals.js";

let activeChildIdx = 0;

export function buildParentPanels(user, data, layout) {
  const children = data.children || MOCK.parentChildren;
  activeChildIdx = Math.min(activeChildIdx, Math.max(0, children.length - 1));
  const child = children[activeChildIdx];

  const weekPct = pct(child.weeklyProgress);
  const acc = pct(child.accuracy);
  const streak = Math.max(0, Number(child.streakDays) || 0);
  const subj = child.subjectPerformance || [];
  const feed = child.recentActivity || [];
  const tasks = child.pendingAssignments || [];

  layout.dataset.role = "parent";
  layout.innerHTML = `
    <div class="db-panel span-full" style="padding-bottom:1.1rem">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">My Children</p>
          <h2 class="db-panel-title">Monitoring Dashboard</h2>
        </div>
        <button class="db-icon-btn ib-blue" type="button" data-action="link-child" title="Link a child account">${I.plus}</button>
      </div>
      <div class="db-child-tabs">
        ${children
          .map(
            (c, i) => `
          <button class="db-child-tab${i === activeChildIdx ? " is-active" : ""}" type="button" data-child-idx="${i}">
            <span class="db-child-tab-avatar">${initial(c.name)}</span>
            ${c.name}
            <span class="db-pill ${c.streakDays ? "pill-yellow" : "pill-grey"}" style="pointer-events:none">${c.streakDays || 0}d</span>
          </button>`,
          )
          .join("")}
      </div>
    </div>

    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Progress Overview</p>
          <h2 class="db-panel-title">${child.name}</h2>
        </div>
        <span class="db-pill pill-yellow">${streak} day streak</span>
      </div>

      <div class="db-ring" style="--ring-progress:${weekPct}">
        <div class="db-ring-inner">
          <strong class="db-ring-value">${weekPct}%</strong>
          <span class="db-ring-label">weekly<br>goal</span>
        </div>
      </div>

      <div class="db-meter">
        <div class="db-meter-top">
          <span>Formula & Logic Accuracy</span>
          <strong>${acc}%</strong>
        </div>
        <div class="db-meter-track">
          <div class="db-meter-fill ${scoreColor(acc)}" style="width:${acc}%"></div>
        </div>
      </div>

      ${
        subj.length
          ? `
        <div class="db-divider"></div>
        <div class="db-perf-list">
          ${subj.map((s) => perfBarHTML(s.subject, s.score)).join("")}
        </div>`
          : ""
      }

      <div class="db-divider"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
        <div class="db-meter">
          <div class="db-meter-top" style="flex-direction:column;align-items:flex-start;gap:0.15rem">
            <span style="font-size:0.65rem">Class</span>
            <strong style="font-family:var(--font-display);font-size:0.88rem">${child.activeClass || "Not assigned"}</strong>
          </div>
        </div>
        <div class="db-meter">
          <div class="db-meter-top" style="flex-direction:column;align-items:flex-start;gap:0.15rem">
            <span style="font-size:0.65rem">Math Instructor</span>
            <strong style="font-family:var(--font-display);font-size:0.88rem">${child.teacher || "—"}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Upcoming Classes</p>
          <h2 class="db-panel-title">Lessons & Schedules</h2>
        </div>
      </div>
      <div id="parent-calendar-container"></div>
    </div>

    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Latest Math Activity</p>
          <h2 class="db-panel-title">What ${child.name} Practiced</h2>
        </div>
      </div>
      <div class="db-feed">
        ${
          feed.length
            ? feed
                .map((a) => {
                  const TYPE_MAP = {
                    quiz: { icon: I.papers, bg: "#eaeaea", c: "var(--ink)" },
                    activity: {
                      icon: I.activity,
                      bg: "#eaeaea",
                      c: "var(--ink)",
                    },
                    writing: {
                      icon: I.writing,
                      bg: "#eaeaea",
                      c: "var(--ink)",
                    },
                  };
                  const m = TYPE_MAP[a.type] || {
                    icon: I.book,
                    bg: "#eaeaea",
                    c: "var(--ink)",
                  };
                  return `
                <div class="db-feed-item">
                  <div class="db-feed-icon" style="background:${m.bg};color:${m.c}">${m.icon}</div>
                  <div>
                    <div class="db-feed-title">${a.title}</div>
                    <div class="db-feed-sub">
                      ${a.subject ? a.subject + " &bull; " : ""}${fmtDate(a.date)}
                      ${a.score !== undefined ? ` &bull; Accuracy: ${pct(a.score)}%` : ""}
                    </div>
                  </div>
                </div>`;
                })
                .join("")
            : `<div class="db-empty">No recent math practice recorded yet.</div>`
        }
      </div>
    </div>

    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Homework & Quizzes</p>
          <h2 class="db-panel-title">Assigned Tasks</h2>
        </div>
      </div>
      <div class="db-assign-list">
        ${
          tasks.length
            ? tasks.map((t) => assignmentItemHTML(t)).join("")
            : `<div class="db-empty">No pending assignments for ${child.name} right now.</div>`
        }
      </div>
    </div>`;

  const calendarContainer = document.getElementById(
    "parent-calendar-container",
  );
  if (calendarContainer) {
    renderCalendar(calendarContainer, MOCK.scheduleEvents);
  }

  layout.querySelectorAll(".db-child-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeChildIdx = Number(btn.dataset.childIdx);
      buildParentPanels(user, data, layout);
    });
  });

  layout
    .querySelector("[data-action='link-child']")
    ?.addEventListener("click", showLinkChildModal);
}
