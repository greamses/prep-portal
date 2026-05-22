import { auth, db } from "./firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { SUBSCRIPTION_PLANS } from "./payment-manager.js";

// ══════════════════════════════════════════════════════
//  DOM REFERENCES
// ══════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════
//  UTILITY HELPERS
// ══════════════════════════════════════════════════════
const setText = (el, v) => {
  if (el) el.textContent = v;
};
const pct = (v, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fb;
};
const firstName = (u) =>
  (u?.displayName || u?.email?.split("@")[0] || "there").split(" ")[0];
const initial = (name = "U") => String(name).charAt(0).toUpperCase();

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = d?.toDate ? d.toDate() : new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const scoreColor = (s) =>
  s >= 80 ? "fill-green" : s >= 60 ? "fill-blue" : "fill-red";
const pillColor = (s) =>
  s >= 80 ? "pill-green" : s >= 60 ? "pill-blue" : "pill-red";
const avatarColor = (role) =>
  role === "teacher"
    ? "background:var(--green);color:#fff"
    : role === "parent"
      ? "background:var(--blue);color:#fff"
      : role === "admin"
        ? "background:var(--red);color:#fff"
        : "background:var(--yellow);color:var(--ink)";

// ══════════════════════════════════════════════════════
//  SVG ICON LIBRARY
// ══════════════════════════════════════════════════════
const I = {
  papers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M4 17h16"/><path d="M8 3v18"/><path d="M16 3v18"/></svg>`,
  writing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3 7 7 .6-5.3 4.6 1.6 6.8L12 17.4 5.7 21l1.6-6.8L2 9.6 9 9z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  trendUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  child: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

// ══════════════════════════════════════════════════════
//  HEADER + TOOLBAR
// ══════════════════════════════════════════════════════
const ROLE_LABELS = {
  student: "Student Workspace",
  teacher: "Teacher Portal",
  parent: "Parent Dashboard",
  admin: "Admin Console",
};

const ROLE_SUBTITLES = {
  student:
    "Your workspace is ready. Keep your practice focused and consistent.",
  teacher: "Monitor your students, assign tasks, and track class performance.",
  parent: "Stay close to your child's learning journey and progress.",
  admin:
    "Platform management: users, classes, subscriptions, and system health.",
};

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

function buildToolbar(role, isPremium) {
  const logoutBtn = `<button class="dashboard-command cmd-red" type="button" data-action="logout">${I.logout}<span>Logout</span></button>`;

  const byRole = {
    student: `
      ${!isPremium ? `<button class="dashboard-command cmd-yellow" type="button" data-action="upgrade">${I.star}<span>Go Premium</span></button>` : ""}
      <a class="dashboard-command" href="/exam-archive/national/exams/index.html">${I.papers}<span>Past Papers</span></a>
      <a class="dashboard-command" href="/prep-math/activity/equivalent-fractions/index.html">${I.activity}<span>Activities</span></a>
      <a class="dashboard-command" href="/writing/index.html">${I.writing}<span>Writing Lab</span></a>`,
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

  toolbar.innerHTML = (byRole[role] || "") + logoutBtn;

  toolbar
    .querySelector("[data-action='logout']")
    ?.addEventListener("click", doLogout);
  toolbar
    .querySelector("[data-action='upgrade']")
    ?.addEventListener("click", doUpgrade);
  toolbar
    .querySelector("[data-action='new-assignment']")
    ?.addEventListener("click", showAssignmentModal);
  toolbar
    .querySelector("[data-action='new-class']")
    ?.addEventListener("click", showClassModal);
  toolbar
    .querySelector("[data-action='link-child']")
    ?.addEventListener("click", showLinkChildModal);
}

// ══════════════════════════════════════════════════════
//  SHARED COMPONENT BUILDERS
// ══════════════════════════════════════════════════════
function assignmentItemHTML(t, showProgress = true) {
  const STATUS = {
    pending: { label: "Pending", cls: "pill-grey" },
    "in-progress": { label: "In Progress", cls: "pill-blue" },
    completed: { label: "Done", cls: "pill-green" },
    overdue: { label: "Overdue", cls: "pill-red" },
  };
  const s = STATUS[t.status] || STATUS.pending;
  const progress = pct(t.progress, t.status === "completed" ? 100 : 0);

  return `
    <div class="db-assign-item">
      <div class="db-assign-top">
        <div>
          <div class="db-assign-title">${t.title}</div>
          <div class="db-assign-meta">${t.subject || "General"} &bull; Due ${fmtDate(t.dueDate)}</div>
        </div>
        <span class="db-pill ${s.cls}">${s.label}</span>
      </div>
      ${
        showProgress
          ? `
        <div class="db-assign-progress-row">
          <div class="db-assign-track">
            <div class="db-assign-fill" style="width:${progress}%"></div>
          </div>
          <span class="db-assign-pct">${progress}%</span>
        </div>`
          : ""
      }
    </div>`;
}

function perfBarHTML(label, score, color = "var(--blue)") {
  return `
    <div class="db-perf-row">
      <span class="db-perf-label">${label}</span>
      <div class="db-perf-track">
        <div class="db-perf-fill" style="width:${pct(score)}%;background:${color}"></div>
      </div>
      <span class="db-perf-val">${pct(score)}%</span>
    </div>`;
}

// ══════════════════════════════════════════════════════
//  STUDENT PANELS
// ══════════════════════════════════════════════════════
function buildStudentPanels(user, data) {
  const progress = pct(data.weeklyProgress, 72);
  const accuracy = pct(data.accuracy, 84);
  const streak = Math.max(0, Number(data.streakDays) || 3);
  const focus = data.currentFocus || "Mathematics";
  const tasks = data.assignedTasks || MOCK.studentTasks;
  const results = data.recentResults || MOCK.studentResults;
  const subjPerf = data.subjectPerf || MOCK.subjectPerf;
  const qCount = Number(data.questionsAnswered) || 0;
  const qBarWidth = Math.min(100, Math.round(qCount / 5));

  layout.dataset.role = "student";
  layout.innerHTML = `

    <!-- ── Panel: Progress ── -->
    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Current Focus</p>
          <h2 class="db-panel-title">${focus}</h2>
        </div>
        <span class="db-pill pill-yellow">${streak}d streak</span>
      </div>

      <div class="db-ring" style="--ring-progress:${progress}">
        <div class="db-ring-inner">
          <strong class="db-ring-value">${progress}%</strong>
          <span class="db-ring-label">weekly<br>goal</span>
        </div>
      </div>

      <div class="db-meter">
        <div class="db-meter-top">
          <span>Question Accuracy</span>
          <strong>${accuracy}%</strong>
        </div>
        <div class="db-meter-track">
          <div class="db-meter-fill ${scoreColor(accuracy)}" style="width:${accuracy}%"></div>
        </div>
      </div>

      <div class="db-meter">
        <div class="db-meter-top">
          <span>Questions Answered</span>
          <strong>${qCount.toLocaleString()}</strong>
        </div>
        <div class="db-meter-track">
          <div class="db-meter-fill fill-blue" style="width:${qBarWidth}%"></div>
        </div>
      </div>

      <div class="db-divider"></div>
      <div class="db-perf-list">
        ${subjPerf.map((s) => perfBarHTML(s.subject, s.score)).join("")}
      </div>
    </div>

    <!-- ── Panel: Assignments ── -->
    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">From Your Teacher</p>
          <h2 class="db-panel-title">Assignments</h2>
        </div>
        <a href="/assignments/index.html" class="db-icon-btn" title="View all assignments">${I.arrow}</a>
      </div>
      <div class="db-assign-list">
        ${
          tasks.length
            ? tasks.map((t) => assignmentItemHTML(t)).join("")
            : `<div class="db-empty">No active assignments.<br>Your teacher has not assigned any tasks yet.</div>`
        }
      </div>
    </div>

    <!-- ── Panel: Results ── -->
    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Performance</p>
          <h2 class="db-panel-title">Recent Results</h2>
        </div>
      </div>
      <div class="db-assign-list">
        ${
          results.length
            ? results
                .map(
                  (r) => `
              <div class="db-assign-item">
                <div class="db-assign-top">
                  <div>
                    <div class="db-assign-title">${r.title}</div>
                    <div class="db-assign-meta">${r.subject} &bull; ${fmtDate(r.date)}</div>
                  </div>
                  <span class="db-pill ${pillColor(pct(r.score))}">${pct(r.score)}%</span>
                </div>
              </div>`,
                )
                .join("")
            : `<div class="db-empty">No results yet.<br>Complete an activity to see scores here.</div>`
        }
      </div>
    </div>

    <!-- ── Panel: Quick Actions (full width) ── -->
    <div class="db-panel span-full">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Quick Start</p>
          <h2 class="db-panel-title">Jump In</h2>
        </div>
      </div>
      <div class="db-action-grid">
        <a href="/exam-archive/national/exams/index.html" class="db-action act-yellow">
          ${I.papers}<span>Past Papers</span>
        </a>
        <a href="/prep-math/activity/equivalent-fractions/index.html" class="db-action act-blue">
          ${I.activity}<span>Activities</span>
        </a>
        <a href="/writing/index.html" class="db-action act-green">
          ${I.writing}<span>Writing Lab</span>
        </a>
        <a href="/algebra/index.html" class="db-action">
          ${I.book}<span>Algebra Lab</span>
        </a>
        ${
          !data.isPremium
            ? `
        <button class="db-action act-red" type="button" data-action="upgrade">
          ${I.star}<span>Go Premium</span>
        </button>`
            : ""
        }
      </div>
    </div>`;

  layout
    .querySelector("[data-action='upgrade']")
    ?.addEventListener("click", doUpgrade);
}

// ══════════════════════════════════════════════════════
//  TEACHER PANELS
// ══════════════════════════════════════════════════════
function buildTeacherPanels(user, data) {
  const students = data.students || MOCK.teacherStudents;
  const assignments = data.assignments || MOCK.teacherAssignments;
  const className = data.activeClass || "My Class";
  const activeCount = students.filter((s) => s.status === "active").length;
  const avgAcc = students.length
    ? Math.round(
        students.reduce((a, s) => a + (Number(s.accuracy) || 0), 0) /
          students.length,
      )
    : 0;
  const needsHelp = students
    .filter((s) => (Number(s.accuracy) || 0) < 60 || !s.activeThisWeek)
    .slice(0, 6);
  const completionRate = assignments.length
    ? Math.round(
        assignments.reduce(
          (a, t) => a + pct((t.completedCount / (t.totalCount || 1)) * 100),
          0,
        ) / assignments.length,
      )
    : 0;

  layout.dataset.role = "teacher";
  layout.innerHTML = `

    <!-- ── Stat: Students ── -->
    <div class="db-stat">
      <div class="db-stat-icon" style="background:var(--blue);color:#fff">${I.users}</div>
      <div class="db-stat-value">${students.length}</div>
      <div class="db-stat-label">Students Enrolled</div>
      <div class="db-stat-trend trend-up">${I.trendUp} ${activeCount} active today</div>
    </div>

    <!-- ── Stat: Assignments ── -->
    <div class="db-stat">
      <div class="db-stat-icon" style="background:var(--green);color:#fff">${I.check}</div>
      <div class="db-stat-value">${assignments.length}</div>
      <div class="db-stat-label">Active Assignments</div>
      <div class="db-stat-trend">${completionRate}% avg completion</div>
    </div>

    <!-- ── Stat: Class Accuracy ── -->
    <div class="db-stat">
      <div class="db-stat-icon" style="background:var(--yellow)">${I.chart}</div>
      <div class="db-stat-value">${avgAcc}%</div>
      <div class="db-stat-label">Class Avg Accuracy</div>
      <div class="db-stat-trend ${avgAcc >= 70 ? "trend-up" : "trend-down"}">
        ${avgAcc >= 70 ? I.trendUp + " Above target" : I.alert + " Below target"}
      </div>
    </div>

    <!-- ── Panel: Student Roster ── -->
    <div class="db-panel span-2">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Class Roster</p>
          <h2 class="db-panel-title">${className}</h2>
        </div>
        <button class="db-icon-btn ib-blue" type="button" data-action="add-student" title="Add student">${I.plus}</button>
      </div>
      <ul class="db-roster">
        ${students
          .map((s) => {
            const dotCls =
              s.status === "active"
                ? "dot-green"
                : s.status === "idle"
                  ? "dot-yellow"
                  : "dot-grey";
            const acc = pct(s.accuracy);
            return `
            <li class="db-roster-item">
              <div class="db-roster-avatar">${initial(s.name)}</div>
              <div>
                <div class="db-roster-name">${s.name}</div>
                <div class="db-roster-sub">${s.class || className} &bull; Last active: ${s.lastActive || "never"}</div>
              </div>
              <div class="db-roster-meta">
                <span class="db-dot ${dotCls}" title="${s.status}"></span>
                <span class="db-pill ${pillColor(acc)}">${acc}%</span>
                ${s.streak ? `<span class="db-pill pill-yellow">${s.streak}d</span>` : ""}
              </div>
            </li>`;
          })
          .join("")}
      </ul>
    </div>

    <!-- ── Panel: Assignments ── -->
    <div class="db-panel">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Task Manager</p>
          <h2 class="db-panel-title">Assignments</h2>
        </div>
        <button class="db-icon-btn ib-blue" type="button" data-action="new-assignment" title="Create assignment">${I.plus}</button>
      </div>
      <div class="db-assign-list">
        ${
          assignments.length
            ? assignments
                .map((a) => {
                  const done = pct(
                    (a.completedCount / (a.totalCount || 1)) * 100,
                  );
                  return `
                <div class="db-assign-item">
                  <div class="db-assign-top">
                    <div>
                      <div class="db-assign-title">${a.title}</div>
                      <div class="db-assign-meta">${a.subject || "General"} &bull; Due ${fmtDate(a.dueDate)}</div>
                    </div>
                    <span class="db-pill pill-blue">${a.completedCount || 0}/${a.totalCount || 0}</span>
                  </div>
                  <div class="db-assign-progress-row">
                    <div class="db-assign-track">
                      <div class="db-assign-fill" style="width:${done}%"></div>
                    </div>
                    <span class="db-assign-pct">${done}% done</span>
                  </div>
                </div>`;
                })
                .join("")
            : `<div class="db-empty">No active assignments.<br>Create one to assign to your class.</div>`
        }
      </div>
    </div>

    <!-- ── Panel: Needs Attention (full width) ── -->
    <div class="db-panel span-full">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker" style="color:var(--red)">Intervention Alert</p>
          <h2 class="db-panel-title">Students Needing Attention</h2>
        </div>
        <span class="db-pill pill-red">${needsHelp.length} flagged</span>
      </div>
      ${
        needsHelp.length
          ? `<div class="db-perf-list">
            ${needsHelp
              .map((s) => {
                const acc = pct(s.accuracy);
                const reason = !s.activeThisWeek
                  ? "Inactive this week"
                  : "Low accuracy";
                return perfBarHTML(
                  `${s.name} (${reason})`,
                  acc,
                  acc < 40
                    ? "var(--red)"
                    : acc < 60
                      ? "var(--yellow)"
                      : "var(--blue)",
                );
              })
              .join("")}
           </div>`
          : `<div class="db-empty">All students are on track. Keep it up.</div>`
      }
    </div>`;

  layout
    .querySelector("[data-action='new-assignment']")
    ?.addEventListener("click", showAssignmentModal);
}

// ══════════════════════════════════════════════════════
//  PARENT PANELS
// ══════════════════════════════════════════════════════
let activeChildIdx = 0;

function buildParentPanels(user, data) {
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

    <!-- ── Panel: Child Switcher (full width) ── -->
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

    <!-- ── Panel: Child Progress ── -->
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
          <span>Question Accuracy</span>
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
            <strong style="font-family:var(--font-display);font-size:0.9rem">${child.activeClass || "Not assigned"}</strong>
          </div>
        </div>
        <div class="db-meter">
          <div class="db-meter-top" style="flex-direction:column;align-items:flex-start;gap:0.15rem">
            <span style="font-size:0.65rem">Teacher</span>
            <strong style="font-family:var(--font-display);font-size:0.9rem">${child.teacher || "—"}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right column ── -->
    <div style="display:grid;gap:${`clamp(1rem, 2vw, 1.4rem)`};align-content:start">

      <!-- Activity Feed -->
      <div class="db-panel">
        <div class="db-panel-head">
          <div>
            <p class="db-kicker">Latest Activity</p>
            <h2 class="db-panel-title">What ${child.name} Did</h2>
          </div>
        </div>
        <div class="db-feed">
          ${
            feed.length
              ? feed
                  .map((a) => {
                    const TYPE_MAP = {
                      quiz: { icon: I.papers, bg: "var(--blue)", c: "#fff" },
                      activity: {
                        icon: I.activity,
                        bg: "var(--green)",
                        c: "#fff",
                      },
                      writing: {
                        icon: I.writing,
                        bg: "var(--yellow)",
                        c: "var(--ink)",
                      },
                    };
                    const m = TYPE_MAP[a.type] || {
                      icon: I.book,
                      bg: "#e7e7e7",
                      c: "var(--ink)",
                    };
                    return `
                  <div class="db-feed-item">
                    <div class="db-feed-icon" style="background:${m.bg};color:${m.c}">${m.icon}</div>
                    <div>
                      <div class="db-feed-title">${a.title}</div>
                      <div class="db-feed-sub">
                        ${a.subject ? a.subject + " &bull; " : ""}${fmtDate(a.date)}
                        ${a.score !== undefined ? ` &bull; Score: ${pct(a.score)}%` : ""}
                      </div>
                    </div>
                  </div>`;
                  })
                  .join("")
              : `<div class="db-empty">No recent activity recorded yet.</div>`
          }
        </div>
      </div>

      <!-- Assignments -->
      <div class="db-panel">
        <div class="db-panel-head">
          <div>
            <p class="db-kicker">Schoolwork</p>
            <h2 class="db-panel-title">Assignments</h2>
          </div>
        </div>
        <div class="db-assign-list">
          ${
            tasks.length
              ? tasks.map((t) => assignmentItemHTML(t)).join("")
              : `<div class="db-empty">No active assignments for ${child.name} right now.</div>`
          }
        </div>
      </div>

    </div>`;

  // Child tab switching
  layout.querySelectorAll(".db-child-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeChildIdx = Number(btn.dataset.childIdx);
      buildParentPanels(user, data);
    });
  });

  layout
    .querySelector("[data-action='link-child']")
    ?.addEventListener("click", showLinkChildModal);
}

// ══════════════════════════════════════════════════════
//  ADMIN PANELS
// ══════════════════════════════════════════════════════
function buildAdminPanels(user, data) {
  const totalUsers = Number(data.totalUsers) || 0;
  const activeToday = Number(data.activeToday) || 0;
  const premiumCount = Number(data.premiumCount) || 0;
  const totalClasses = Number(data.totalClasses) || 0;
  const signups = data.recentSignups || MOCK.adminSignups;
  const classes = data.classes || MOCK.adminClasses;
  const roleDist = data.roleDistribution || MOCK.roleDist;

  layout.dataset.role = "admin";
  layout.innerHTML = `

    <!-- ── 4 Stat Cards ── -->
    <div class="db-stat">
      <div class="db-stat-icon" style="background:var(--blue);color:#fff">${I.users}</div>
      <div class="db-stat-value">${totalUsers.toLocaleString()}</div>
      <div class="db-stat-label">Total Users</div>
      <div class="db-stat-trend trend-up">${I.trendUp} +${data.newSignupsToday || 0} today</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon" style="background:var(--green);color:#fff">${I.trendUp}</div>
      <div class="db-stat-value">${activeToday.toLocaleString()}</div>
      <div class="db-stat-label">Active Today</div>
      <div class="db-stat-trend">${totalUsers ? Math.round((activeToday / totalUsers) * 100) : 0}% of users</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon" style="background:var(--yellow)">${I.star}</div>
      <div class="db-stat-value">${premiumCount.toLocaleString()}</div>
      <div class="db-stat-label">Premium Users</div>
      <div class="db-stat-trend">${totalUsers ? Math.round((premiumCount / totalUsers) * 100) : 0}% conversion</div>
    </div>

    <div class="db-stat">
      <div class="db-stat-icon" style="background:var(--ink);color:var(--paper)">${I.book}</div>
      <div class="db-stat-value">${totalClasses.toLocaleString()}</div>
      <div class="db-stat-label">Active Classes</div>
      <div class="db-stat-trend">${data.unassignedClasses || 0} unassigned</div>
    </div>

    <!-- ── Panel: Recent Signups ── -->
    <div class="db-panel span-2">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">User Management</p>
          <h2 class="db-panel-title">Recent Signups</h2>
        </div>
        <a href="/admin/users/index.html" class="db-icon-btn" title="View all users">${I.arrow}</a>
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

    <!-- ── Panel: Class Management ── -->
    <div class="db-panel span-2">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Class Management</p>
          <h2 class="db-panel-title">Classes</h2>
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
                  Teacher: ${c.teacher || "Unassigned"} &bull; ${c.studentCount || 0} students
                </div>
              </div>
              <span class="db-pill ${c.teacher ? "pill-green" : "pill-grey"}">${c.teacher ? "Active" : "No Teacher"}</span>
            </div>
          </div>`,
          )
          .join("")}
      </div>
    </div>

    <!-- ── Panel: Role Distribution (full width) ── -->
    <div class="db-panel span-full">
      <div class="db-panel-head">
        <div>
          <p class="db-kicker">Platform Health</p>
          <h2 class="db-panel-title">User Role Distribution</h2>
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

// ══════════════════════════════════════════════════════
//  MOCK DATA (fallbacks until Firestore is populated)
// ══════════════════════════════════════════════════════
const MOCK = {
  studentTasks: [
    {
      title: "Algebra: Equations Practice",
      subject: "Mathematics",
      dueDate: "2026-05-28",
      status: "in-progress",
      progress: 45,
    },
    {
      title: "English Comprehension Set B",
      subject: "English",
      dueDate: "2026-05-26",
      status: "pending",
      progress: 0,
    },
    {
      title: "Basic Science Chapter 4 Quiz",
      subject: "Science",
      dueDate: "2026-05-25",
      status: "overdue",
      progress: 20,
    },
    {
      title: "Nigerian History Essay Review",
      subject: "Social Std",
      dueDate: "2026-05-30",
      status: "pending",
      progress: 0,
    },
  ],

  studentResults: [
    {
      title: "Fractions and Decimals",
      subject: "Mathematics",
      date: "2026-05-21",
      score: 85,
    },
    {
      title: "Vocabulary Exercise C",
      subject: "English",
      date: "2026-05-20",
      score: 72,
    },
    {
      title: "Forces and Motion Quiz",
      subject: "Science",
      date: "2026-05-18",
      score: 91,
    },
    {
      title: "Nigerian History — Chapter 3",
      subject: "Social Studies",
      date: "2026-05-16",
      score: 63,
    },
  ],

  subjectPerf: [
    { subject: "Mathematics", score: 84 },
    { subject: "English", score: 72 },
    { subject: "Science", score: 91 },
    { subject: "Social Std", score: 63 },
  ],

  teacherStudents: [
    {
      name: "Alice Obi",
      class: "Grade 9A",
      lastActive: "2h ago",
      accuracy: 91,
      streak: 7,
      status: "active",
      activeThisWeek: true,
    },
    {
      name: "Bayo Adeyemi",
      class: "Grade 9A",
      lastActive: "Yesterday",
      accuracy: 78,
      streak: 3,
      status: "idle",
      activeThisWeek: true,
    },
    {
      name: "Chisom Eze",
      class: "Grade 9A",
      lastActive: "5h ago",
      accuracy: 85,
      streak: 12,
      status: "active",
      activeThisWeek: true,
    },
    {
      name: "David Nwosu",
      class: "Grade 9A",
      lastActive: "3 days ago",
      accuracy: 42,
      streak: 0,
      status: "inactive",
      activeThisWeek: false,
    },
    {
      name: "Emeka Okonkwo",
      class: "Grade 9A",
      lastActive: "Today",
      accuracy: 67,
      streak: 2,
      status: "active",
      activeThisWeek: true,
    },
    {
      name: "Fatima Bello",
      class: "Grade 9A",
      lastActive: "4 days ago",
      accuracy: 55,
      streak: 0,
      status: "inactive",
      activeThisWeek: false,
    },
    {
      name: "Grace Afolabi",
      class: "Grade 9A",
      lastActive: "1h ago",
      accuracy: 88,
      streak: 9,
      status: "active",
      activeThisWeek: true,
    },
    {
      name: "Hassan Ibrahim",
      class: "Grade 9A",
      lastActive: "Today",
      accuracy: 73,
      streak: 5,
      status: "active",
      activeThisWeek: true,
    },
  ],

  teacherAssignments: [
    {
      title: "Algebra: Equations Practice",
      subject: "Mathematics",
      dueDate: "2026-05-28",
      completedCount: 18,
      totalCount: 32,
    },
    {
      title: "Reading Comprehension Set B",
      subject: "English",
      dueDate: "2026-05-26",
      completedCount: 25,
      totalCount: 32,
    },
    {
      title: "Basic Science Chapter Quiz",
      subject: "Science",
      dueDate: "2026-05-30",
      completedCount: 5,
      totalCount: 32,
    },
  ],

  parentChildren: [
    {
      name: "Sarah",
      streakDays: 5,
      accuracy: 82,
      weeklyProgress: 60,
      activeClass: "Grade 7B",
      teacher: "Ms. Kemi Adio",
      subjectPerformance: [
        { subject: "Mathematics", score: 82 },
        { subject: "English", score: 74 },
        { subject: "Science", score: 89 },
      ],
      recentActivity: [
        {
          type: "quiz",
          title: "Fractions Quiz",
          subject: "Mathematics",
          date: "2026-05-21",
          score: 85,
        },
        {
          type: "activity",
          title: "Reading Exercise",
          subject: "English",
          date: "2026-05-20",
          score: 72,
        },
        {
          type: "quiz",
          title: "Science MCQ Set 3",
          subject: "Science",
          date: "2026-05-18",
          score: 91,
        },
        {
          type: "writing",
          title: "Creative Writing Task",
          subject: "English",
          date: "2026-05-16",
        },
      ],
      pendingAssignments: [
        {
          title: "Algebra Practice Set",
          subject: "Mathematics",
          dueDate: "2026-05-28",
          status: "in-progress",
          progress: 45,
        },
        {
          title: "English Comprehension",
          subject: "English",
          dueDate: "2026-05-26",
          status: "pending",
          progress: 0,
        },
      ],
    },
  ],

  adminSignups: [
    {
      name: "Ngozi Adeleke",
      email: "ngozi@example.com",
      role: "student",
      joinedAt: "2026-05-22",
    },
    {
      name: "Mr Tunde Lawal",
      email: "tunde@example.com",
      role: "teacher",
      joinedAt: "2026-05-22",
    },
    {
      name: "Mrs Amaka Eze",
      email: "amaka@example.com",
      role: "parent",
      joinedAt: "2026-05-21",
    },
    {
      name: "Chidi Okafor",
      email: "chidi@example.com",
      role: "student",
      joinedAt: "2026-05-21",
    },
    {
      name: "Halima Bello",
      email: "halima@example.com",
      role: "student",
      joinedAt: "2026-05-20",
    },
    {
      name: "Mr Segun Aina",
      email: "segun@example.com",
      role: "teacher",
      joinedAt: "2026-05-20",
    },
  ],

  adminClasses: [
    {
      name: "Grade 9 Mathematics",
      teacher: "Mr Tunde Lawal",
      studentCount: 32,
    },
    { name: "Grade 8 English", teacher: "Ms Kemi Adio", studentCount: 28 },
    { name: "Grade 10 Science", teacher: null, studentCount: 0 },
    {
      name: "JSS 3 Social Studies",
      teacher: "Mr Emeka Chukwu",
      studentCount: 24,
    },
    { name: "Grade 7 Mathematics", teacher: "Ms Ify Nzelu", studentCount: 30 },
  ],

  roleDist: [
    { role: "Students", count: 2150, pct: 76, color: "var(--blue)" },
    { role: "Parents", count: 420, pct: 15, color: "var(--green)" },
    { role: "Teachers", count: 240, pct: 8, color: "var(--yellow)" },
    { role: "Admins", count: 37, pct: 1, color: "var(--red)" },
  ],
};

// ══════════════════════════════════════════════════════
//  MODAL STUBS  (expand to full implementations)
// ══════════════════════════════════════════════════════
function showAssignmentModal() {
  // TODO: wire to your assignment creation UI / Firestore write
  alert("Assignment creator — implement your modal here.");
}

function showClassModal() {
  // TODO: wire to your class creation UI / Firestore write
  alert("Class creator — implement your modal here.");
}

function showLinkChildModal() {
  // TODO: let parents enter a student code or email
  alert("Link child — enter a student account code or email.");
}

// ══════════════════════════════════════════════════════
//  AUTH ACTIONS
// ══════════════════════════════════════════════════════
function doLogout() {
  signOut(auth)
    .then(() => {
      window.location.href = "/";
    })
    .catch(console.error);
}

function doUpgrade() {
  if (!auth.currentUser) {
    window.openAuthModal?.("login");
    return;
  }
  window.PaymentPortal?.open(SUBSCRIPTION_PLANS.PREMIUM);
}

// ══════════════════════════════════════════════════════
//  MAIN FIRESTORE LISTENER
// ══════════════════════════════════════════════════════
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

  // Optimistic header render while Firestore loads
  updateHeader(user, {});
  buildToolbar("student", false);

  unsubUser = onSnapshot(
    doc(db, "users", user.uid),
    (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const role = data.role || "student";

      updateHeader(user, data);
      buildToolbar(role, Boolean(data.isPremium));

      if (role === "teacher") buildTeacherPanels(user, data);
      else if (role === "parent") buildParentPanels(user, data);
      else if (role === "admin") buildAdminPanels(user, data);
      else buildStudentPanels(user, data);
    },
    (err) => {
      console.error("Firestore snapshot error:", err);
      buildStudentPanels(user, {});
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
