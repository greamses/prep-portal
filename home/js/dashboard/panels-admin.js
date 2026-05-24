import { I } from "/home/js/dashboard/icons.js";
import {
  initial,
  fmtDate,
  avatarColor,
  pct,
} from "/home/js/dashboard/utils.js";
import {
  assignmentItemHTML,
  perfBarHTML,
} from "/home/js/dashboard/components.js";
import { MOCK } from "/home/js/dashboard/mock-data.js";
import { showClassModal } from "/home/js/dashboard/dashboard-modals.js";
import { ROUTES } from "/home/js/routing.js";

export function buildAdminPanels(user, data, layout) {
  const totalUsers = Number(data.totalUsers) || 0;
  const activeToday = Number(data.activeToday) || 0;
  const premiumCount = Number(data.premiumCount) || 0;
  const totalClasses = Number(data.totalClasses) || 0;
  const signups = data.recentSignups || MOCK.adminSignups;
  const classes = data.classes || MOCK.adminClasses;
  const roleDist = data.roleDistribution || MOCK.roleDist;

  layout.dataset.role = "admin";
  layout.innerHTML = `
    <div class="db-stat">
      <div class="db-stat-icon">${I.users}</div>
      <div class="db-stat-value">${totalUsers.toLocaleString()}</div>
      <div class="db-stat-label">Total Users</div>
      <div class="db-stat-trend trend-up">${I.trendUp} +${data.newSignupsToday || 0} today</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon">${I.trendUp}</div>
      <div class="db-stat-value">${activeToday.toLocaleString()}</div>
      <div class="db-stat-label">Solving Math Today</div>
      <div class="db-stat-trend">${totalUsers ? Math.round((activeToday / totalUsers) * 100) : 0}% active</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon">${I.star}</div>
      <div class="db-stat-value">${premiumCount.toLocaleString()}</div>
      <div class="db-stat-label">Premium Plans</div>
      <div class="db-stat-trend">${totalUsers ? Math.round((premiumCount / totalUsers) * 100) : 0}% conversion</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon">${I.book}</div>
      <div class="db-stat-value">${totalClasses.toLocaleString()}</div>
      <div class="db-stat-label">Active Classes</div>
      <div class="db-stat-trend">${data.unassignedClasses || 0} unassigned</div>
    </div>

    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">User Management</p>
          <h2 class="db-panel-title">Recent Registrations</h2>
        </div>
        <a href="${ROUTES.MANAGE_USERS}" class="db-icon-btn" title="View all users">${I.arrow}</a>
      </div>
      <ul class="db-roster">
        ${signups
          .map((u) => {
            const roleLabels = {
              student: "pill-blue",
              teacher: "pill-green",
              parent: "pill-yellow",
              admin: "pill-red",
            };
            return `
            <li class="db-roster-item">
              <div class="db-roster-avatar" style="${avatarColor(u.role)}">${initial(u.name)}</div>
              <div>
                <div class="db-roster-name">${u.name}</div>
                <div class="db-roster-sub">${u.email} &bull; Joined ${fmtDate(u.joinedAt)}</div>
              </div>
              <div class="db-roster-meta">
                <span class="db-pill ${roleLabels[u.role] || "pill-grey"}">${u.role}</span>
              </div>
            </li>`;
          })
          .join("")}
      </ul>
    </div>

    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Class Hub</p>
          <h2 class="db-panel-title">Math Classrooms</h2>
        </div>
        <button class="db-icon-btn ib-blue" type="button" data-action="new-class" title="Create class">${I.plus}</button>
      </div>
      <div class="db-assign-list">
        ${classes
          .map(
            (c) => `
          <div class="db-assign-item">
            <div class="db-assign-top">
              <div>
                <div class="db-assign-title">${c.name}</div>
                <div class="db-assign-meta">
                  Instructor: ${c.teacher || "Unassigned"} &bull; ${c.studentCount || 0} students
                </div>
              </div>
              <span class="db-pill ${c.teacher ? "pill-green" : "pill-grey"}">${c.teacher ? "Active" : "No Instructor"}</span>
            </div>
          </div>`,
          )
          .join("")}
      </div>
    </div>

    <div class="db-panel span-full">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Platform Health</p>
          <h2 class="db-panel-title">User Base Breakdown</h2>
        </div>
      </div>
      <div class="db-perf-list">
        ${roleDist.map((r) => perfBarHTML(`${r.role} (${r.count.toLocaleString()})`, r.pct, r.color)).join("")}
      </div>
    </div>`;

  layout
    .querySelector("[data-action='new-class']")
    ?.addEventListener("click", showClassModal);
}
