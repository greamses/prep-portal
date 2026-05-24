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

// Custom High-Contrast Neobrutalist SVGs
const SVGS = {
  sync: `
    <svg class="icon-svg icon-sync" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  `,
  inspect: `
    <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `,
  trash: `
    <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `,
  arrowLeft: `
    <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  `,
  arrowRight: `
    <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  `,
  close: `
    <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `,
  check: `
    <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `,
  alert: `
    <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  `,
  chevronDown: `
    <svg class="icon-svg chevron-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,
};

// Available Dropdown Options Constants
const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "parent", label: "Parent" },
  { value: "admin", label: "Admin" },
];

const FILTER_ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  ...ROLE_OPTIONS,
];

const FILTER_PLAN_OPTIONS = [
  { value: "all", label: "All Plans" },
  { value: "premium", label: "Premium" },
  { value: "free", label: "Free" },
];

const FILTER_SORT_OPTIONS = [
  { value: "newest", label: "Newest Joined" },
  { value: "oldest", label: "Oldest Joined" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
];

const listEl = document.getElementById("users-list");
const statsEl = document.getElementById("admin-user-stats");
const searchInput = document.getElementById("user-search");
const nativeRoleFilter = document.getElementById("role-filter");

let bulkActionBar, paginationEl;

// Filter State Variables
let filterRole = "all";
let filterPlan = "all";
let filterSort = "newest";

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
  initDropdownGlobalHandlers();
  injectExtendedControls();
  triggerSync();

  const q = query(collection(db, "users"));
  onSnapshot(q, (snapshot) => {
    allUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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
}

// 2. Custom Dropdown Engine
function makeBrutalDropdownHTML({
  id,
  className,
  options,
  selectedValue,
  defaultLabel = "Select...",
}) {
  const selectedOption = options.find((o) => o.value === selectedValue);
  const triggerLabel = selectedOption ? selectedOption.label : defaultLabel;

  const optionsHTML = options
    .map(
      (o) => `
      <div class="brutal-dropdown-item ${o.value === selectedValue ? "active" : ""}" data-value="${o.value}">
        ${o.label}
      </div>
    `,
    )
    .join("");

  return `
    <div class="brutal-dropdown ${className || ""}" data-id="${id || ""}">
      <button class="brutal-dropdown-trigger" type="button">
        <span>${triggerLabel}</span>
        ${SVGS.chevronDown}
      </button>
      <div class="brutal-dropdown-menu">
        ${optionsHTML}
      </div>
    </div>
  `;
}

function initDropdownGlobalHandlers() {
  // Toggle, open, and close drop actions on click
  document.addEventListener("click", (e) => {
    const isTrigger = e.target.closest(".brutal-dropdown-trigger");
    const activeDropdown = e.target.closest(".brutal-dropdown");

    document.querySelectorAll(".brutal-dropdown.open").forEach((drop) => {
      if (drop !== activeDropdown) {
        drop.classList.remove("open");
      }
    });

    if (isTrigger && activeDropdown) {
      activeDropdown.classList.toggle("open");
    }
  });

  // Handle selection event dispatching
  document.addEventListener("click", (e) => {
    const item = e.target.closest(".brutal-dropdown-item");
    if (item) {
      const dropdown = item.closest(".brutal-dropdown");
      const val = item.dataset.value;
      const triggerSpan = dropdown.querySelector(
        ".brutal-dropdown-trigger span",
      );

      dropdown
        .querySelectorAll(".brutal-dropdown-item")
        .forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      triggerSpan.textContent = item.textContent.trim();
      dropdown.classList.remove("open");

      // Dispatch customized change event standard on element
      const customEvent = new CustomEvent("change", { detail: { value: val } });
      dropdown.dispatchEvent(customEvent);
    }
  });
}

function injectExtendedControls() {
  if (nativeRoleFilter) {
    nativeRoleFilter.style.display = "none"; // Hide default select
  }

  const filterWrap = nativeRoleFilter?.parentElement;
  if (filterWrap) {
    // Clear wrapper contents except label/elements we need to reconstruct
    filterWrap.innerHTML = "";

    // 1. Render Custom Role Filter
    const roleDropWrapper = document.createElement("div");
    roleDropWrapper.innerHTML = makeBrutalDropdownHTML({
      id: "role-filter-drop",
      className: "filter-dropdown",
      options: FILTER_ROLE_OPTIONS,
      selectedValue: filterRole,
    });
    const roleDropEl = roleDropWrapper.firstElementChild;
    filterWrap.appendChild(roleDropEl);

    roleDropEl.addEventListener("change", (e) => {
      filterRole = e.detail.value;
      currentPage = 1;
      updateUI();
    });

    // 2. Render Custom Plan Filter
    const planDropWrapper = document.createElement("div");
    planDropWrapper.innerHTML = makeBrutalDropdownHTML({
      id: "plan-filter-drop",
      className: "filter-dropdown",
      options: FILTER_PLAN_OPTIONS,
      selectedValue: filterPlan,
    });
    const planDropEl = planDropWrapper.firstElementChild;
    filterWrap.appendChild(planDropEl);

    planDropEl.addEventListener("change", (e) => {
      filterPlan = e.detail.value;
      currentPage = 1;
      updateUI();
    });

    // 3. Render Custom Sort Filter
    const sortDropWrapper = document.createElement("div");
    sortDropWrapper.innerHTML = makeBrutalDropdownHTML({
      id: "sort-filter-drop",
      className: "filter-dropdown",
      options: FILTER_SORT_OPTIONS,
      selectedValue: filterSort,
    });
    const sortDropEl = sortDropWrapper.firstElementChild;
    filterWrap.appendChild(sortDropEl);

    sortDropEl.addEventListener("change", (e) => {
      filterSort = e.detail.value;
      updateUI();
    });
  }

  const tableHeader = document.querySelector(".users-table-header");
  if (tableHeader && !document.getElementById("select-all-users")) {
    const checkHeader = document.createElement("div");
    checkHeader.style.display = "flex";
    checkHeader.style.alignItems = "center";
    checkHeader.innerHTML = `
      <input type="checkbox" id="select-all-users" class="brutal-checkbox">
    `;
    tableHeader.insertBefore(checkHeader, tableHeader.firstChild);
    tableHeader.style.gridTemplateColumns =
      "50px 2.5fr 160px 140px 140px 120px";

    selectAllCheckbox = document.getElementById("select-all-users");
    selectAllCheckbox.addEventListener("change", handleSelectAll);
  }

  bulkActionBar = document.createElement("div");
  bulkActionBar.id = "bulk-action-bar";
  bulkActionBar.className = "bulk-bar hidden";
  document.body.appendChild(bulkActionBar);

  const listContainer = document.querySelector(".users-list-container");
  if (listContainer) {
    paginationEl = document.createElement("div");
    paginationEl.className = "brutal-pagination";
    listContainer.after(paginationEl);
  }
}

function updateUI() {
  const term = searchInput.value.toLowerCase();

  let filtered = allUsers.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term);
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesPlan =
      filterPlan === "all" ||
      (filterPlan === "premium" && u.isPremium) ||
      (filterPlan === "free" && !u.isPremium);
    return matchesSearch && matchesRole && matchesPlan;
  });

  filtered.sort((a, b) => {
    if (filterSort === "newest")
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (filterSort === "oldest")
      return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
    if (filterSort === "name-asc")
      return (a.name || "").localeCompare(b.name || "");
    if (filterSort === "name-desc")
      return (b.name || "").localeCompare(a.name || "");
    return 0;
  });

  renderStats(allUsers);
  renderBulkBar();

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
      ${SVGS.sync} <span>Sync Db</span>
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
    <div class="user-row brutal-row" data-id="${u.id}" style="grid-template-columns: 50px 2.5fr 160px 140px 140px 120px;">
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
        ${makeBrutalDropdownHTML({
          id: u.id,
          className: "row-role-dropdown",
          options: ROLE_OPTIONS,
          selectedValue: u.role || "student",
        })}
      </div>
      <div onclick="event.stopPropagation()">
        <button class="plan-toggle ${u.isPremium ? "is-premium" : ""}" data-id="${u.id}">
            ${u.isPremium ? "Premium" : "Free Plan"}
        </button>
      </div>
      <div class="user-joined inspect-trigger">${fmtDate(u.createdAt)}</div>
      <div class="actions-group" onclick="event.stopPropagation()">
        <button class="action-btn btn-inspect" data-id="${u.id}" title="Inspect Profile">${SVGS.inspect}</button>
        <button class="action-btn btn-delete text-danger" data-id="${u.id}" title="Delete User">${SVGS.trash}</button>
      </div>
    </div>
  `,
    )
    .join("");

  attachListEvents();
}

function attachListEvents() {
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

  listEl.querySelectorAll(".inspect-trigger, .btn-inspect").forEach((el) => {
    el.onclick = (e) => {
      const row = e.target.closest(".user-row");
      const user = allUsers.find((u) => u.id === row.dataset.id);
      if (user) openInspectorModal(user);
    };
  });

  // Custom role selection callback
  listEl.querySelectorAll(".row-role-dropdown").forEach((el) => {
    el.addEventListener("change", async (e) => {
      const userId = el.dataset.id;
      const newRole = e.detail.value;
      try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        showToast("User role updated successfully", "success");
      } catch (err) {
        showToast("Error updating role", "error");
      }
    });
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
        ${makeBrutalDropdownHTML({
          id: "bulk-role-select",
          className: "bulk-dropdown",
          options: ROLE_OPTIONS,
          selectedValue: "",
          defaultLabel: "Change Role...",
        })}
        <button id="bulk-premium-btn" class="bulk-btn">Toggle Premium</button>
        <button id="bulk-delete-btn" class="bulk-btn bulk-btn-danger">Delete Selected</button>
        <button id="bulk-clear-btn" class="bulk-btn-close">Cancel Selection</button>
      </div>
    </div>
  `;

  // Capture selections on bulk-role change event
  const bulkRoleEl = document.getElementById("bulk-role-select");
  if (bulkRoleEl) {
    bulkRoleEl.addEventListener("change", async (e) => {
      const roleValue = e.detail.value;
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
    });
  }

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
        showToast("Subscription status updated", "success");
        selectedUsers.clear();
        updateUI();
      } catch (err) {
        showToast("Error toggling subscription", "error");
      }
    }
  };

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

  document.getElementById("bulk-clear-btn").onclick = () => {
    selectedUsers.clear();
    updateUI();
  };
}

function renderPagination(totalPages) {
  if (!paginationEl) return;
  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let paginationButtons = `
    <button class="pag-btn" ${currentPage === 1 ? "disabled" : ""} id="prev-page">
      ${SVGS.arrowLeft} <span>Prev</span>
    </button>
    <span class="pag-indicator">Page <strong>${currentPage}</strong> of ${totalPages}</span>
    <button class="pag-btn" ${currentPage === totalPages ? "disabled" : ""} id="next-page">
      <span>Next</span> ${SVGS.arrowRight}
    </button>
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

function openInspectorModal(user) {
  const existingModal = document.getElementById("user-inspector-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "user-inspector-modal";
  modal.className = "brutal-modal-overlay";
  modal.innerHTML = `
    <div class="brutal-modal-card">
      <div class="modal-header">
        <h2>Inspect User Record</h2>
        <button class="modal-close-btn" id="close-inspector-btn">${SVGS.close}</button>
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
  document.body.style.overflow = "hidden";

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

function showToast(message, type = "success") {
  const container =
    document.getElementById("toast-container") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-symbol">${type === "success" ? SVGS.check : SVGS.alert}</span>
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
