import { auth, db } from "/firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { setText, firstName, initial } from "./utils.js";
import { ROLE_LABELS, ROLE_SUBTITLES } from "./constants.js";
import { buildToolbar } from "./toolbar.js";
import { buildStudentPanels } from "./panels-student.js";
import { buildTeacherPanels } from "./panels-teacher.js";
import { buildParentPanels } from "./panels-parent.js";
import { buildAdminPanels } from "./panels-admin.js";

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
const isDashboardPage = window.location.pathname.includes("dashboard");

function updateHeader(user, data = {}) {
  const role = data.role || "student";
  const name = firstName(user);
  setText(fields.name, name);
  setText(fields.avatar, initial(name));
  setText(
    fields.plan,
    data.planName || (data.isPremium ? "Pro Plan" : "Free Plan"),
  );
  setText(fields.status, ROLE_LABELS[role] || "Workspace");
  setText(fields.subtitle, ROLE_SUBTITLES[role] || ROLE_SUBTITLES.student);
  if (kicker) kicker.textContent = ROLE_LABELS[role] || "My Workspace";
}

function handleUser(user) {
  if (unsubUser) {
    unsubUser();
    unsubUser = null;
  }

  if (!user) {
    if (isDashboardPage) {
      window.location.replace("/");
    }
    return;
  }

  updateHeader(user, {});
  buildToolbar(toolbar, "student", false);

  unsubUser = onSnapshot(
    doc(db, "users", user.uid),
    (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const role = data.role || "student";

      updateHeader(user, data);
      buildToolbar(toolbar, role, Boolean(data.isPremium));

      if (role === "teacher") buildTeacherPanels(user, data, layout);
      else if (role === "parent") buildParentPanels(user, data, layout);
      else if (role === "admin") buildAdminPanels(user, data, layout);
      else buildStudentPanels(user, data, layout);
    },
    (err) => {
      console.error("Firestore snapshot error:", err);
      buildStudentPanels(user, {}, layout);
    },
  );
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
