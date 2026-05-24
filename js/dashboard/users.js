import { auth, db } from "../../firebase-init.js";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { initial, fmtDate, avatarColor } from "../../js/dashboard/utils.js";
import { I } from "../../js/dashboard/icons.js";
import "../../utils/components/nav-builder.js";

const listEl = document.getElementById("users-list");
const statsEl = document.getElementById("admin-user-stats");
const searchInput = document.getElementById("user-search");
const roleFilter = document.getElementById("role-filter");

let allUsers = [];

// 1. Admin Guard
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.replace("/");
    return;
  }
  // Hardcoded Admin Email or you can check Firestore user doc for role === 'admin'
  if (user.email !== "eemadanyel@gmail.com") {
    window.location.replace("/dashboard.html");
    return;
  }
  init();
});

function init() {
  const q = query(collection(db, "users"));
  onSnapshot(q, (snapshot) => {
    allUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    updateUI();
  });

  searchInput.addEventListener("input", updateUI);
  roleFilter.addEventListener("change", updateUI);
}

function updateUI() {
  const term = searchInput.value.toLowerCase();
  const role = roleFilter.value;

  const filtered = allUsers.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term);
    const matchesRole = role === "all" || u.role === role;
    return matchesSearch && matchesRole;
  });

  renderStats(allUsers);
  renderList(filtered);
}

function renderStats(users) {
  const counts = {
    total: users.length,
    teachers: users.filter((u) => u.role === "teacher").length,
    premium: users.filter((u) => u.isPremium).length,
  };
  statsEl.innerHTML = `
    <div class="stat-chip"><strong>${counts.total}</strong><span>Users</span></div>
    <div class="stat-chip"><strong>${counts.teachers}</strong><span>Teachers</span></div>
    <div class="stat-chip"><strong>${counts.premium}</strong><span>Premium</span></div>
  `;
}

function renderList(users) {
  if (!users.length) {
    listEl.innerHTML = `<div style="padding:4rem;text-align:center;font-family:var(--font-mono)">No users found.</div>`;
    return;
  }

  listEl.innerHTML = users
    .map(
      (u) => `
    <div class="user-row">
      <div class="user-cell-info">
        <div class="user-avatar" style="${avatarColor(u.role)}">${initial(u.name)}</div>
        <div class="user-meta-main">
          <strong>${u.name || "User"}</strong>
          <span>${u.email}</span>
        </div>
      </div>
      <div>
        <select class="role-select" data-id="${u.id}">
            <option value="student" ${u.role === "student" ? "selected" : ""}>Student</option>
            <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>Teacher</option>
            <option value="parent" ${u.role === "parent" ? "selected" : ""}>Parent</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
      </div>
      <div>
        <button class="plan-toggle ${u.isPremium ? "is-premium" : ""}" data-id="${u.id}">
            ${u.isPremium ? "Premium" : "Free Plan"}
        </button>
      </div>
      <div class="user-joined">${fmtDate(u.createdAt)}</div>
      <button class="action-btn btn-delete" data-id="${u.id}">${I.logout}</button>
    </div>
  `,
    )
    .join("");

  // Events
  listEl
    .querySelectorAll(".role-select")
    .forEach(
      (el) =>
        (el.onchange = (e) =>
          updateDoc(doc(db, "users", e.target.dataset.id), {
            role: e.target.value,
          })),
    );

  listEl
    .querySelectorAll(".plan-toggle")
    .forEach(
      (el) =>
        (el.onclick = (e) =>
          updateDoc(doc(db, "users", el.dataset.id), {
            isPremium: !el.classList.contains("is-premium"),
          })),
    );

  listEl
    .querySelectorAll(".btn-delete")
    .forEach(
      (el) =>
        (el.onclick = () =>
          confirm("Delete record?") &&
          deleteDoc(doc(db, "users", el.dataset.id))),
    );
}
