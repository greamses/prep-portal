import { auth, db } from "/firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

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

let unsubUser = null;
let unsubRoleData = []; // Store multiple listeners for role-specific data

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
  if (unsubUser) {
    unsubUser();
    unsubUser = null;
  }
  unsubRoleData.forEach((unsub) => unsub());
  unsubRoleData = [];
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

  // 2. Real-time User Profile Listener
  unsubUser = onSnapshot(
    doc(db, "users", user.uid),
    (snap) => {
      const data = snap.exists() ? snap.data() : {};

      // If role is missing, assign 'student' by default and persist to Firestore
      if (!data.role) {
        setDoc(
          doc(db, "users", user.uid),
          {
            role: "student",
            email: user.email,
            name: user.displayName || user.email.split("@")[0],
            createdAt: data.createdAt || new Date().toISOString(),
          },
          { merge: true },
        );
        return;
      }

      const role = data.role;

      updateHeader(user, data);
      buildToolbar(toolbar, role, Boolean(data.isPremium));

      // 3. Setup/Refresh role-specific listeners
      setupRoleDataListeners(user, role, data);
    },
    (err) => {
      console.error("Firestore snapshot error:", err);
      buildStudentPanels(user, {}, layout);
    },
  );
}

function setupRoleDataListeners(user, role, userData) {
  unsubRoleData.forEach((unsub) => unsub());
  unsubRoleData = [];

  if (role === "admin") {
    // --- ADMIN: Global stats from users and classes collections ---
    const uUnsub = onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const totalUsers = users.length;
      const premiumCount = users.filter((u) => u.isPremium).length;

      const roleCounts = users.reduce((acc, u) => {
        const r = (u.role || "student") + "s";
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});

      const roleDist = [
        {
          role: "Students",
          count: roleCounts.students || 0,
          color: "var(--blue)",
        },
        {
          role: "Parents",
          count: roleCounts.parents || 0,
          color: "var(--green)",
        },
        {
          role: "Teachers",
          count: roleCounts.teachers || 0,
          color: "var(--yellow)",
        },
        { role: "Admins", count: roleCounts.admins || 0, color: "var(--red)" },
      ].map((r) => ({
        ...r,
        pct: totalUsers ? Math.round((r.count / totalUsers) * 100) : 0,
      }));

      const recentSignups = users
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((u) => ({ ...u, joinedAt: u.createdAt }));

      const adminData = {
        ...userData,
        totalUsers,
        premiumCount,
        roleDistribution: roleDist,
        recentSignups,
        activeToday: Math.round(totalUsers * 0.35),
        newSignupsToday: users.filter(
          (u) =>
            new Date(u.createdAt).toDateString() === new Date().toDateString(),
        ).length,
      };

      const cUnsub = onSnapshot(collection(db, "classes"), (cSnap) => {
        const classes = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        buildAdminPanels(
          user,
          {
            ...adminData,
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
      });
      unsubRoleData.push(cUnsub);
    });
    unsubRoleData.push(uUnsub);
  } else if (role === "teacher") {
    // --- TEACHER: Owned assignments and assigned classes ---
    const qClasses = query(
      collection(db, "classes"),
      where("teacherEmail", "==", user.email),
    );
    const cUnsub = onSnapshot(qClasses, (snap) => {
      const classes = snap.docs.map((d) => d.data());

      const qAssign = query(
        collection(db, "assignments"),
        where("teacherId", "==", user.uid),
      );
      const aUnsub = onSnapshot(qAssign, (aSnap) => {
        const assignments = aSnap.docs.map((d) => d.data());
        buildTeacherPanels(
          user,
          {
            ...userData,
            assignments,
            activeClass: classes[0]?.name || "My Classroom",
          },
          layout,
        );
      });
      unsubRoleData.push(aUnsub);
    });
    unsubRoleData.push(cUnsub);
  } else {
    // --- STUDENT: Global task stream (simplified) ---
    const qTasks = query(collection(db, "assignments"));
    const tUnsub = onSnapshot(qTasks, (snap) => {
      const tasks = snap.docs.map((d) => d.data());
      buildStudentPanels(user, { ...userData, assignedTasks: tasks }, layout);
    });
    unsubRoleData.push(tUnsub);
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
