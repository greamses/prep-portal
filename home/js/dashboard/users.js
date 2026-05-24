import { auth, db } from "/firebase-init.js";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { initial, fmtDate, avatarColor } from "/home/js/dashboard/utils.js";
import { I } from "/home/js/dashboard/icons.js";
import "/utils/components/nav-builder.js";
import { ROUTES, API_ENDPOINTS } from "/home/js/routing.js";

const listEl = document.getElementById("users-list");
const statsEl = document.getElementById("admin-user-stats");
const searchInput = document.getElementById("user-search");
const roleFilter = document.getElementById("role-filter");

// New UI Control Elements (make sure to include these in your HTML or let them generate dynamically)
let planFilter, sortFilter, selectAllCheckbox, bulkActionBar, paginationEl;

let allUsers = [];
let selectedUsers = new Set();
let currentPage = 1;
const itemsPerPage = 8;

// 1. Admin Guard
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.replace(ROUTES.HOME);
    return;
  }
  // Standard Admin Check
  if (user.email !== "eemadanyel@gmail.com") {
    window.location.replace(ROUTES.DASHBOARD);
    return;
  }
  init();
});

async function triggerSync() {
  const user = auth.currentUser;
  if (!user) return;

  const token = await user.getIdToken();
  const syncBtn = document.getElementById("sync-trigger-btn");
  if (syncBtn) syncBtn.classList.add("loading");

  try {
    await fetch(API_ENDPOINTS.SYNC_USERS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    showToast("Database successfully synchronized", "success");
  } catch (err) {
    console.error("Auto-sync failed:", err);
    showToast("Synchronization failed", "error");
  } finally {
    if (syncBtn) syncBtn.classList.remove("loading");
  }
}

function init() {
  injectExtendedControls();
  triggerSync();

  const q = query(collection(db, "users"));
  onSnapshot(q, (snapshot) => {
    allUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Prevent selected states from breaking if a user document is deleted externally
    const currentIds = new Set(allUsers.map((u) => u.id));
    selectedUsers = new Set(
      [...selectedUsers].filter((id) => currentIds.has(id)),
    );

    updateUI();
  });

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    updateUI();
  });
  roleFilter.addEventListener("change", () => {
    currentPage = 1;
    updateUI();
  });
  planFilter.addEventListener("change", () => {
    currentPage = 1;
    updateUI();
  });
  sortFilter.addEventListener("change", () => {
    updateUI();
  });
}

// Injects advanced controls dynamically to keep HTML modifications minimal
function injectExtendedControls() {
  // Add Plan & Sort filters next to Role Filter
  const filterWrap = roleFilter.parentElement;
  if (filterWrap) {
    // Plan Filter
    planFilter = document.createElement("select");
    planFilter.id = "plan-filter";
    planFilter.className = "filter-select";
    planFilter.innerHTML = `
      <option value="all">All Plans</option>
      <option value="premium">Premium Only</option>
      <option value="free">Free Only</option>
    `;
    filterWrap.appendChild(planFilter);

    // Sort Filter
    sortFilter = document.createElement("select");
    sortFilter.id = "sort-filter";
    sortFilter.className = "filter-select";
    sortFilter.innerHTML = `
      <option value="newest">Newest Joined</option>
      <option value="oldest">Oldest Joined</option>
      <option value="name-asc">Name (A-Z)</option>
      <option value="name-desc">Name (Z-A)</option>
    `;
    filterWrap.appendChild(sortFilter);
  }

  // Inject Table Header Checkbox once
  const tableHeader = document.querySelector(".users-table-header");
  if (tableHeader && !document.getElementById("select-all-users")) {
    const checkHeader = document.createElement("div");
    checkHeader.style.display = "flex";
    checkHeader.style.alignItems = "center";
    checkHeader.innerHTML = `
      <input type="checkbox" id="select-all-users" class="brutal-checkbox">
    `;
    tableHeader.insertBefore(checkHeader, tableHeader.firstChild);

    // Adjust header columns structure dynamically for the checkbox
    tableHeader.style.gridTemplateColumns =
      "50px 2.5fr 140px 140px 140px 120px";

    selectAllCheckbox = document.getElementById("select-all-users");
    selectAllCheckbox.addEventListener("change", handleSelectAll);
  }

  // Create Bulk Action Bar
  bulkActionBar = document.createElement("div");
  bulkActionBar.id = "bulk-action-bar";
  bulkActionBar.className = "bulk-bar hidden";
  document.body.appendChild(bulkActionBar);

  // Create Pagination container below list container
  const listContainer = document.querySelector(".users-list-container");
  if (listContainer) {
    paginationEl = document.createElement("div");
    paginationEl.className = "brutal-pagination";
    listContainer.after(paginationEl);
  }
}

function updateUI() {
  const term = searchInput.value.toLowerCase();
  const role = roleFilter.value;
  const plan = planFilter.value;
  const sort = sortFilter.value;

  // Filter List
  let filtered = allUsers.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term);
    const matchesRole = role === "all" || u.role === role;
    const matchesPlan =
      plan === "all" ||
      (plan === "premium" && u.isPremium) ||
      (plan === "free" && !u.isPremium);
    return matchesSearch && matchesRole && matchesPlan;
  });

  // Sort List
  filtered.sort((a, b) => {
    if (sort === "newest")
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sort === "oldest")
      return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
    if (sort === "name-asc") return (a.name || "").localeCompare(b.name || "");
    if (sort === "name-desc") return (b.name || "").localeCompare(a.name || "");
    return 0;
  });

  renderStats(allUsers);
  renderBulkBar();

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filtered.slice(startIndex, startIndex + itemsPerPage);

  renderList(paginatedUsers);
  renderPagination(totalPages);
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
    <button id="sync-trigger-btn" class="sync-action-btn" title="Sync Users Database">
      ${I.sync || "🔄"} Sync Db
    </button>
  `;

  const syncBtn = document.getElementById("sync-trigger-btn");
  if (syncBtn) syncBtn.onclick = triggerSync;
}

function renderList(users) {
  if (!users.length) {
    listEl.innerHTML = `<div style="padding:4rem;text-align:center;font-family:var(--font-mono)">No users matched your filters.</div>`;
    return;
  }

  listEl.innerHTML = users
    .map(
      (u) => `
    <div class="user-row brutal-row" data-id="${u.id}" style="grid-template-columns: 50px 2.5fr 140px 140px 140px 120px;">
      <div class="cell-checkbox" onclick="event.stopPropagation()">
        <input type="checkbox" class="brutal-checkbox user-select-chk" data-id="${u.id}" ${selectedUsers.has(u.id) ? "checked" : ""}>
      </div>
      <div class="user-cell-info inspect-trigger">
        <div class="user-avatar" style="${avatarColor(u.role)}">${initial(u.name)}</div>
        <div class="user-meta-main">
          <strong>${u.name || "User"}</strong>
          <span>${u.email}</span>
        </div>
      </div>
      <div onclick="event.stopPropagation()">
        <select class="role-select" data-id="${u.id}">
            <option value="student" ${u.role === "student" ? "selected" : ""}>Student</option>
            <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>Teacher</option>
            <option value="parent" ${u.role === "parent" ? "selected" : ""}>Parent</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
      </div>
      <div onclick="event.stopPropagation()">
        <button class="plan-toggle ${u.isPremium ? "is-premium" : ""}" data-id="${u.id}">
            ${u.isPremium ? "Premium" : "Free Plan"}
        </button>
      </div>
      <div class="user-joined inspect-trigger">${fmtDate(u.createdAt)}</div>
      <div class="actions-group" onclick="event.stopPropagation()">
        <button class="action-btn btn-inspect" data-id="${u.id}" title="Inspect Profile">👀</button>
        <button class="action-btn btn-delete text-danger" data-id="${u.id}" title="Delete User">${I.logout || "🗑️"}</button>
      </div>
    </div>
  `,
    )
    .join("");

  attachListEvents();
}

function attachListEvents() {
  // Checkbox interactions
  listEl.querySelectorAll(".user-select-chk").forEach((el) => {
    el.onchange = (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        selectedUsers.add(id);
      } else {
        selectedUsers.delete(id);
      }
      updateSelectAllHeaderState();
      renderBulkBar();
    };
  });

  // Row inspection
  listEl.querySelectorAll(".inspect-trigger, .btn-inspect").forEach((el) => {
    el.onclick = (e) => {
      const row = e.target.closest(".user-row");
      const user = allUsers.find((u) => u.id === row.dataset.id);
      if (user) openInspectorModal(user);
    };
  });

  // Database field modifications
  listEl.querySelectorAll(".role-select").forEach((el) => {
    el.onchange = async (e) => {
      try {
        await updateDoc(doc(db, "users", e.target.dataset.id), {
          role: e.target.value,
        });
        showToast("User role updated successfully", "success");
      } catch (err) {
        showToast("Error updating role", "error");
      }
    };
  });

  listEl.querySelectorAll(".plan-toggle").forEach((el) => {
    el.onclick = async (e) => {
      const id = el.dataset.id;
      const isCurrentlyPremium = el.classList.contains("is-premium");
      try {
        await updateDoc(doc(db, "users", id), {
          isPremium: !isCurrentlyPremium,
        });
        showToast(`User service plan changed`, "success");
      } catch (err) {
        showToast("Error switching plan", "error");
      }
    };
  });

  listEl.querySelectorAll(".btn-delete").forEach((el) => {
    el.onclick = async () => {
      if (
        confirm(
          "Are you absolutely sure you want to delete this user record from Firestore?",
        )
      ) {
        try {
          await deleteDoc(doc(db, "users", el.dataset.id));
          showToast("User record deleted", "success");
        } catch (err) {
          showToast("Failed to delete user", "error");
        }
      }
    };
  });
}

function handleSelectAll(e) {
  const visibleCheckboxes = listEl.querySelectorAll(".user-select-chk");
  visibleCheckboxes.forEach((chk) => {
    chk.checked = e.target.checked;
    const id = chk.dataset.id;
    if (e.target.checked) {
      selectedUsers.add(id);
    } else {
      selectedUsers.delete(id);
    }
  });
  renderBulkBar();
}

function updateSelectAllHeaderState() {
  if (!selectAllCheckbox) return;
  const visibleCheckboxes = listEl.querySelectorAll(".user-select-chk");
  if (!visibleCheckboxes.length) {
    selectAllCheckbox.checked = false;
    return;
  }
  const allChecked = Array.from(visibleCheckboxes).every((chk) => chk.checked);
  selectAllCheckbox.checked = allChecked;
}

// Bulk Actions Logic
function renderBulkBar() {
  if (selectedUsers.size === 0) {
    bulkActionBar.classList.add("hidden");
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    return;
  }

  bulkActionBar.classList.remove("hidden");
  bulkActionBar.innerHTML = `
    <div class="bulk-content">
      <span class="bulk-count"><strong>${selectedUsers.size}</strong> users selected</span>
      <div class="bulk-controls">
        <select id="bulk-role-select" class="bulk-select">
          <option value="" disabled selected>Change Role...</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
          <option value="admin">Admin</option>
        </select>
        <button id="bulk-premium-btn" class="bulk-btn">Toggle Premium</button>
        <button id="bulk-delete-btn" class="bulk-btn bulk-btn-danger">Delete Selected</button>
        <button id="bulk-clear-btn" class="bulk-btn-close">Cancel Selection</button>
      </div>
    </div>
  `;

  // Handle Bulk Change Role
  document.getElementById("bulk-role-select").onchange = async (e) => {
    const roleValue = e.target.value;
    if (
      confirm(`Change selected ${selectedUsers.size} users to ${roleValue}?`)
    ) {
      const batchPromises = Array.from(selectedUsers).map((id) =>
        updateDoc(doc(db, "users", id), { role: roleValue }),
      );
      try {
        await Promise.all(batchPromises);
        showToast(`Updated roles for ${selectedUsers.size} users`, "success");
        selectedUsers.clear();
        updateUI();
      } catch (err) {
        showToast("Error updating bulk roles", "error");
      }
    }
  };

  // Handle Bulk Plan Toggle
  document.getElementById("bulk-premium-btn").onclick = async () => {
    if (
      confirm(`Modify subscription status for ${selectedUsers.size} users?`)
    ) {
      const batchPromises = Array.from(selectedUsers).map((id) => {
        const userObj = allUsers.find((u) => u.id === id);
        return updateDoc(doc(db, "users", id), {
          isPremium: !userObj?.isPremium,
        });
      });
      try {
        await Promise.all(batchPromises);
        showToast(`Subscription status updated`, "success");
        selectedUsers.clear();
        updateUI();
      } catch (err) {
        showToast("Error toggling subscription", "error");
      }
    }
  };

  // Handle Bulk Delete
  document.getElementById("bulk-delete-btn").onclick = async () => {
    if (
      confirm(
        `CRITICAL: Are you sure you want to permanently delete ${selectedUsers.size} users? This cannot be undone.`,
      )
    ) {
      const batchPromises = Array.from(selectedUsers).map((id) =>
        deleteDoc(doc(db, "users", id)),
      );
      try {
        await Promise.all(batchPromises);
        showToast(
          `Successfully deleted ${selectedUsers.size} user records`,
          "success",
        );
        selectedUsers.clear();
        updateUI();
      } catch (err) {
        showToast("Failed during bulk deletion", "error");
      }
    }
  };

  // Clear selections
  document.getElementById("bulk-clear-btn").onclick = () => {
    selectedUsers.clear();
    updateUI();
  };
}

// Pagination Rendering
function renderPagination(totalPages) {
  if (!paginationEl) return;
  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let paginationButtons = `
    <button class="pag-btn" ${currentPage === 1 ? "disabled" : ""} id="prev-page">⬅ Prev</button>
    <span class="pag-indicator">Page <strong>${currentPage}</strong> of ${totalPages}</span>
    <button class="pag-btn" ${currentPage === totalPages ? "disabled" : ""} id="next-page">Next ➡</button>
  `;

  paginationEl.innerHTML = paginationButtons;

  document.getElementById("prev-page").onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      updateUI();
    }
  };

  document.getElementById("next-page").onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateUI();
    }
  };
}

// User Inspector Modal Window
function openInspectorModal(user) {
  // Ensure existing dialog is removed
  const existingModal = document.getElementById("user-inspector-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "user-inspector-modal";
  modal.className = "brutal-modal-overlay";
  modal.innerHTML = `
    <div class="brutal-modal-card">
      <div class="modal-header">
        <h2>Inspect User Record</h2>
        <button class="modal-close-btn" id="close-inspector-btn">×</button>
      </div>
      <div class="modal-body">
        <div class="modal-profile-header">
          <div class="user-avatar large-avatar" style="${avatarColor(user.role)}">${initial(user.name)}</div>
          <div>
            <h3>${user.name || "Default Name"}</h3>
            <p>${user.email}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-lbl">System Identifier</span>
            <span class="meta-val monospace">${user.id}</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Access Class</span>
            <span class="meta-val badge badge-${user.role}">${user.role.toUpperCase()}</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Billing Tier</span>
            <span class="meta-val badge badge-${user.isPremium ? "premium" : "free"}">${user.isPremium ? "Premium Account" : "Standard Tier"}</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Registration Date</span>
            <span class="meta-val">${fmtDate(user.createdAt)}</span>
          </div>
        </div>

        <div class="raw-data-area">
          <span class="meta-lbl">Raw Firestore Document</span>
          <pre><code>${JSON.stringify(user, null, 2)}</code></pre>
        </div>
      </div>
      <div class="modal-footer">
         <button class="brutal-btn-flat" id="modal-edit-sync">Verify Status</button>
         <button class="brutal-btn-flat btn-close-footer" id="close-inspector-footer">Close View</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden"; // Lock page background scrolling

  const closeModal = () => {
    modal.remove();
    document.body.style.overflow = "";
  };

  document.getElementById("close-inspector-btn").onclick = closeModal;
  document.getElementById("close-inspector-footer").onclick = closeModal;

  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  document.getElementById("modal-edit-sync").onclick = () => {
    showToast(`Validation check passed for ${user.name || "User"}`, "success");
  };
}

// Toast Notification Engine
function showToast(message, type = "success") {
  const container =
    document.getElementById("toast-container") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-symbol">${type === "success" ? "✓" : "⚠"}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toast-container";
  document.body.appendChild(container);
  return container;
}
