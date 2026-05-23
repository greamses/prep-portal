import { I } from "./icons.js";
import {
  showAssignmentModal,
  showClassModal,
  showLinkChildModal,
} from "./dashboard-modals.js";
import { doLogout, doUpgrade } from "../auth-actions.js";

export function buildToolbar(toolbarElement, role, isPremium) {
  const logoutBtn = `<button class="dashboard-command cmd-red" type="button" data-action="logout">${I.logout}<span>Logout</span></button>`;

  const byRole = {
    student: `
      ${!isPremium ? `<button class="dashboard-command cmd-yellow" type="button" data-action="upgrade">${I.star}<span>Go Premium</span></button>` : ""}
      <a class="dashboard-command" href="/exam-archive/national/exams/index.html">${I.papers}<span>Math Past Papers</span></a>
      <a class="dashboard-command" href="/prep-math/activity/equivalent-fractions/index.html">${I.activity}<span>Math Activities</span></a>
      <a class="dashboard-command" href="/math-lab/index.html">${I.writing}<span>Math Lab</span></a>`,
    teacher: `
      <button class="dashboard-command cmd-blue" type="button" data-action="new-assignment">${I.plus}<span>New Assignment</span></button>
      <button class="dashboard-command cmd-green" type="button" data-action="view-classes">${I.users}<span>My Classes</span></button>
      <a class="dashboard-command" href="/teacher/reports/index.html">${I.chart}<span>Reports</span></a>`,
    parent: `
      <button class="dashboard-command cmd-blue" type="button" data-action="link-child">${I.child}<span>Link Child</span></button>
      <a class="dashboard-command" href="/reports/index.html">${I.chart}<span>Full Report</span></a>`,
    admin: `
      <button class="dashboard-command cmd-blue" type="button" data-action="new-class">${I.plus}<span>New Class</span></button>
      <a class="dashboard-command" href="/admin/users/index.html">${I.users}<span>Manage Users</span></a>
      <a class="dashboard-command" href="/admin/settings/index.html">${I.settings}<span>Settings</span></a>`,
  };

  toolbarElement.innerHTML = (byRole[role] || "") + logoutBtn;

  toolbarElement
    .querySelector("[data-action='logout']")
    ?.addEventListener("click", doLogout);
  toolbarElement
    .querySelector("[data-action='upgrade']")
    ?.addEventListener("click", doUpgrade);
  toolbarElement
    .querySelector("[data-action='new-assignment']")
    ?.addEventListener("click", showAssignmentModal);
  toolbarElement
    .querySelector("[data-action='new-class']")
    ?.addEventListener("click", showClassModal);
  toolbarElement
    .querySelector("[data-action='link-child']")
    ?.addEventListener("click", showLinkChildModal);
}
