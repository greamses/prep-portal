import { I } from "./icons.js";
import { auth } from "/firebase-init.js";
import { signOut } from "firebase/auth";
import { ROUTES } from "/home/js/routing.js";
import {
  showAssignmentModal,
  showClassModal,
  showLinkChildModal,
} from "/home/js/dashboard/dashboard-modals.js";

function doLogout() {
  signOut(auth)
    .then(() => {
      window.location.href = ROUTES.HOME;
    })
    .catch(console.error);
}

export function doUpgrade() {
  if (!auth.currentUser) {
    window.openAuthModal?.("login");
    return;
  }
  window.location.href = "/subscribe.html#plans";
}

export function buildToolbar(container, role, isPremium) {
  const logoutBtn = `<button class="pp-pill pp-pill--danger" type="button" data-action="logout">${I.logout}<span>Logout</span></button>`;
  const byRole = {
    student: `
      ${!isPremium ? `<button class="pp-pill" style="--tile: var(--accent-primary)" type="button" data-action="upgrade">${I.star}<span>Go Premium</span></button>` : ""}
      <a class="pp-pill" href="${ROUTES.EXAM_ARCHIVE}">${I.papers}<span>Math Past Papers</span></a>
      <a class="pp-pill" href="${ROUTES.EQUIVALENT_FRACTIONS}">${I.activity}<span>Math Activities</span></a>
      <a class="pp-pill" href="${ROUTES.MATH_LAB}">${I.writing}<span>Math Lab</span></a>`,
    teacher: `
      <button class="pp-pill" style="--tile: var(--accent-secondary)" type="button" data-action="new-assignment">${I.plus}<span>New Assignment</span></button>
      <button class="pp-pill" style="--tile: var(--accent-success)" type="button" data-action="view-classes">${I.users}<span>My Classes</span></button>
      <a class="pp-pill" href="${ROUTES.TEACHER_REPORTS}">${I.chart}<span>Reports</span></a>`,
    parent: `
      <button class="pp-pill" style="--tile: var(--accent-secondary)" type="button" data-action="link-child">${I.child}<span>Link Child</span></button>
      <a class="pp-pill" href="${ROUTES.PARENT_REPORTS}">${I.chart}<span>Full Report</span></a>`,
    admin: `
      <button class="pp-pill" style="--tile: var(--accent-secondary)" type="button" data-action="new-class">${I.plus}<span>New Class</span></button>
      <a class="pp-pill" href="${ROUTES.MANAGE_USERS}">${I.users}<span>Manage Users</span></a>
      <a class="pp-pill" style="--tile: var(--accent-primary)" href="/admin-partners.html">${I.star}<span>Partner Program</span></a>
      <a class="pp-pill" style="--tile: var(--accent-secondary)" href="/admin-cbt.html">${I.papers}<span>CBT Bank</span></a>
      <a class="pp-pill" href="${ROUTES.SETTINGS}">${I.settings}<span>Settings</span></a>`,
  };

  container.innerHTML = (byRole[role] || "") + logoutBtn;

  container
    .querySelector("[data-action='logout']")
    ?.addEventListener("click", doLogout);
  container
    .querySelector("[data-action='upgrade']")
    ?.addEventListener("click", doUpgrade);
  container
    .querySelector("[data-action='new-assignment']")
    ?.addEventListener("click", showAssignmentModal);
  container
    .querySelector("[data-action='new-class']")
    ?.addEventListener("click", showClassModal);
  container
    .querySelector("[data-action='link-child']")
    ?.addEventListener("click", showLinkChildModal);
}
