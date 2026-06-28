import { auth, db } from "/firebase-init.js";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
} from "firebase/firestore";
import { watchProfile, getList, saveDoc } from "/utils/data-service.js";

import { setText, firstName, PERSON_SVG } from "/home/js/dashboard/utils.js";
import { ROLE_LABELS, ROLE_SUBTITLES } from "/home/js/dashboard/constants.js";
import { ROUTES } from "/home/js/routing.js";
import { buildToolbar } from "/home/js/dashboard/toolbar.js";
import { buildStudentPanels } from "/home/js/dashboard/panels-student.js";
import { buildTeacherPanels } from "/home/js/dashboard/panels-teacher.js";
import { buildParentPanels } from "/home/js/dashboard/panels-parent.js";
import { buildAdminPanels } from "/home/js/dashboard/panels-admin.js";

import { planEmblem } from "/utils/components/plan-emblems.js";

const layout = document.getElementById("dashboard-layout");
const toolbar = document.getElementById("dashboard-toolbar");
const kicker = document.getElementById("dashboard-role-kicker");
const fields = {
  name: document.querySelector("[data-dashboard-name]"),
  subtitle: document.querySelector("[data-dashboard-subtitle]"),
  avatar: document.querySelector("[data-dashboard-avatar]"),
  plan: document.querySelector("[data-dashboard-plan]"),
  status: document.querySelector("[data-dashboard-status]"),
};

let unsubProfile = null; // single shared profile listener
let lastRole = null; // only rebuild role panels when the role actually changes

// Focus + rail: after a role builder fills the layout with a flat list of tiles,
// reflow them into a wide MAIN column (hero + lists) and a narrow RAIL (the
// compact "bento-tall"/"db-rail-tile" side widgets). Listeners survive the move.
function applyFocusRail(el) {
  const role = el.dataset.role;
  if (!role || role === "loading") return;
  const kids = [...el.children];
  if (!kids.length || kids[0].classList?.contains("db-main")) return;
  const main = document.createElement("div");
  main.className = "db-main";
  const rail = document.createElement("div");
  rail.className = "db-rail";
  let strip = null; // groups consecutive small stat cards into one compact row
  kids.forEach((node) => {
    const cl = node.classList;
    if (cl?.contains("db-stat")) {
      if (!strip) { strip = document.createElement("div"); strip.className = "db-stat-strip"; main.appendChild(strip); }
      strip.appendChild(node);
      return;
    }
    strip = null;
    const railTile = cl?.contains("db-panel") &&
      (cl.contains("bento-tall") || cl.contains("db-rail-tile"));
    (railTile ? rail : main).appendChild(node);
  });
  el.appendChild(main);
  if (rail.childElementCount) el.appendChild(rail);
}

const isDashboardPage = window.location.pathname.includes(ROUTES.DASHBOARD);

function updateHeader(user, data = {}) {
  const role = data.role || "student";
  const name = firstName(user);
  setText(fields.name, name);
  if (fields.avatar) fields.avatar.innerHTML = PERSON_SVG;
  if (fields.plan) {
    const isPremium = Boolean(data.isPremium);
    const planName = data.planName || "";
    fields.plan.innerHTML = planEmblem(isPremium, planName);
    const tier = !isPremium ? "free" : (planName.toLowerCase().includes("monthly") ? "premium" : "pro");
    fields.plan.className = "plan-badge--" + tier;
  }
  setText(fields.status, ROLE_LABELS[role] || "Workspace");
  setText(fields.subtitle, ROLE_SUBTITLES[role] || ROLE_SUBTITLES.student);
  if (kicker) kicker.textContent = ROLE_LABELS[role] || "My Workspace";
}

function cleanupListeners() {
  if (unsubProfile) {
    unsubProfile();
    unsubProfile = null;
  }
  lastRole = null;
}

function handleUser(user) {
  cleanupListeners();

  if (!user) {
    if (isDashboardPage) {
      window.location.replace(ROUTES.HOME);
    }
    return;
  }

  // 1. Initial UI state
  updateHeader(user, {});
  buildToolbar(toolbar, "student", false);

  // 2. ONE shared profile listener (cache-backed, app-wide). It fires immediately
  //    with the cached profile for instant paint, then on every live change.
  unsubProfile = watchProfile(user.uid, (data) => {
    data = data || {};

    // First-time users have no role — default to 'student' and persist. The
    // write is skipped if the cache already holds these exact values.
    if (!data.role) {
      saveDoc(
        `users/${user.uid}`,
        {
          role: "student",
          email: user.email,
          name: user.displayName || user.email.split("@")[0],
          createdAt: data.createdAt || new Date().toISOString(),
        },
        { merge: true, skipIfUnchanged: true },
      );
      return;
    }

    updateHeader(user, data);
    buildToolbar(toolbar, data.role, Boolean(data.isPremium));

    // 3. Build the role panels — but only when the role actually changes, so a
    //    routine profile tick (e.g. a plan toggle) doesn't re-fetch everything.
    if (data.role !== lastRole) {
      lastRole = data.role;
      setupRoleData(user, data.role, data).catch((err) => {
        console.error("Dashboard role data failed:", err);
        buildStudentPanels(user, {}, layout);
        applyFocusRail(layout);
      });
    }
  });
}

// Role-specific data, fetched THROUGH the cache (TTL). No permanent whole-
// collection listeners — a dashboard visit inside the TTL window costs zero
// reads, and there is no listener to leak.
const ROLE_TTL = 2 * 60 * 1000;

async function setupRoleData(user, role, userData) {
  if (role === "admin") {
    // --- ADMIN: Global stats from users and classes collections ---
    const [users, classes] = await Promise.all([
      getList("users:all", () => collection(db, "users"), { ttl: ROLE_TTL }),
      getList("classes:all", () => collection(db, "classes"), { ttl: ROLE_TTL }),
    ]);

    const totalUsers = users.length;
    const premiumCount = users.filter((u) => u.isPremium).length;
    const roleCounts = users.reduce((acc, u) => {
      const r = (u.role || "student") + "s";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
    const roleDist = [
      { role: "Students", count: roleCounts.students || 0, color: "var(--blue)" },
      { role: "Parents", count: roleCounts.parents || 0, color: "var(--green)" },
      { role: "Teachers", count: roleCounts.teachers || 0, color: "var(--yellow)" },
      { role: "Admins", count: roleCounts.admins || 0, color: "var(--red)" },
    ].map((r) => ({
      ...r,
      pct: totalUsers ? Math.round((r.count / totalUsers) * 100) : 0,
    }));
    const recentSignups = users
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .map((u) => ({ ...u, joinedAt: u.createdAt }));

    buildAdminPanels(
      user,
      {
        ...userData,
        totalUsers,
        premiumCount,
        roleDistribution: roleDist,
        recentSignups,
        activeToday: Math.round(totalUsers * 0.35),
        newSignupsToday: users.filter(
          (u) => new Date(u.createdAt).toDateString() === new Date().toDateString(),
        ).length,
        totalClasses: classes.length,
        unassignedClasses: classes.filter((c) => !c.teacherEmail).length,
        classes: classes.map((c) => ({
          name: c.name,
          teacher: c.teacherEmail,
          studentCount: c.studentCount || 0,
        })),
      },
      layout,
    );
    applyFocusRail(layout);
  } else if (role === "teacher") {
    // --- TEACHER: Owned assignments and assigned classes ---
    const [classes, assignments] = await Promise.all([
      getList(
        `classes:teacher:${user.uid}`,
        () => query(collection(db, "classes"), where("teacherEmail", "==", user.email)),
        { ttl: ROLE_TTL },
      ),
      getList(
        `assignments:teacher:${user.uid}`,
        () => query(collection(db, "assignments"), where("teacherId", "==", user.uid)),
        { ttl: ROLE_TTL },
      ),
    ]);
    buildTeacherPanels(
      user,
      { ...userData, assignments, activeClass: classes[0]?.name || "My Classroom" },
      layout,
    );
    applyFocusRail(layout);
  } else {
    // --- STUDENT: Global task stream (simplified) ---
    const tasks = await getList(
      "assignments:all",
      () => collection(db, "assignments"),
      { ttl: ROLE_TTL },
    );
    buildStudentPanels(user, { ...userData, assignedTasks: tasks }, layout);
    applyFocusRail(layout);
  }
}

function initDashboard() {
  if (!document.getElementById("dashboard")) return;
  auth.onAuthStateChanged(handleUser);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
