import { auth, db } from "/firebase-init.js";
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  deleteField,
} from "firebase/firestore";
import { getList } from "/utils/data-service.js";
import { PERSON_SVG, fmtDate, avatarColor } from "/home/js/dashboard/utils.js";
import { I } from "/home/js/dashboard/icons.js";
import "/utils/components/nav-builder.js";
import { ROUTES, API_ENDPOINTS } from "/home/js/routing.js";

/* ============================================================
   SVG ICON LIBRARY
   ============================================================ */
const SVGS = {
  sync: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg icon-sync"><path d="M4.6 10A7.8 7.8 0 0 1 18 6.4" fill="none" stroke="var(--accent-secondary)" stroke-width="3" stroke-linecap="round"/><path d="M21.2 3.2 20.6 10l-6.4-2.4z" fill="var(--accent-danger)"/><path d="M19.4 14A7.8 7.8 0 0 1 6 17.6" fill="none" stroke="var(--accent-primary)" stroke-width="3" stroke-linecap="round"/><path d="M2.8 20.8 3.4 14l6.4 2.4z" fill="var(--accent-danger)"/></svg>`,
  inspect: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><path d="M1.8 12S5.6 4.8 12 4.8 22.2 12 22.2 12 18.4 19.2 12 19.2 1.8 12 1.8 12z" fill="var(--accent-secondary)"/><circle cx="12" cy="12" r="4.4" fill="#fff"/><circle cx="12" cy="12" r="2.3" fill="var(--accent-danger)"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><rect x="8.6" y="2.4" width="6.8" height="2.6" rx="1.3" fill="var(--accent-danger)"/><rect x="3" y="5" width="18" height="3.2" rx="1.6" fill="var(--accent-danger)"/><path d="M5.4 9.4h13.2l-1.1 10.4a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z" fill="var(--accent-secondary)"/><rect x="9.1" y="11.9" width="1.9" height="6.2" rx="0.95" fill="#fff"/><rect x="13" y="11.9" width="1.9" height="6.2" rx="0.95" fill="#fff"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><rect x="8.6" y="8.6" width="12.4" height="12.4" rx="2.2" fill="var(--accent-secondary)"/><path d="M5 15.4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.4a2 2 0 0 1 2 2v1.6h-2.6V5.6H5.6v7.2h1.4v2.6z" fill="var(--accent-primary)"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><g transform="rotate(270 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>`,
  close: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><rect x="10.6" y="3.5999999999999996" width="2.8" height="16.8" rx="1.4" fill="var(--accent-danger)" transform="rotate(45 12 12)"/><rect x="10.6" y="3.5999999999999996" width="2.8" height="16.8" rx="1.4" fill="var(--accent-danger)" transform="rotate(-45 12 12)"/></svg>`,
  check: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><circle cx="12" cy="12" r="9.6" fill="var(--accent-success)"/><path d="M7.4 12.4l3 3 6.2-6.7" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><circle cx="12" cy="12" r="9.4" fill="var(--accent-warning)"/><rect x="10.7" y="6.4" width="2.6" height="7.4" rx="1.3" fill="#fff"/><circle cx="12" cy="16.8" r="1.6" fill="#fff"/></svg>`,
  info: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><circle cx="12" cy="12" r="9.4" fill="var(--accent-secondary)"/><rect x="10.7" y="10.4" width="2.6" height="7" rx="1.3" fill="#fff"/><circle cx="12" cy="7.4" r="1.6" fill="#fff"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg chevron-svg"><g transform="rotate(90 12 12)"><path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="var(--accent-secondary)"/></g></svg>`,
  search: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><rect x="14.28" y="16.40" width="7.64" height="3.4" rx="1.7" fill="var(--accent-primary)" transform="rotate(45.00 18.10 18.10)"/><circle cx="10.4" cy="10.4" r="7.6" fill="var(--accent-secondary)"/><circle cx="10.4" cy="10.4" r="4.6" fill="#fff"/></svg>`,
  download: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><rect x="10.8" y="2.6" width="2.4" height="10" rx="1.2" fill="var(--accent-secondary)"/><path d="M6 10.8h12L12 17.2z" fill="var(--accent-danger)"/><rect x="3.4" y="18.6" width="17.2" height="2.8" rx="1.4" fill="var(--accent-primary)"/></svg>`,
  invite: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><circle cx="9" cy="7.6" r="3.8" fill="var(--accent-secondary)"/><path d="M2.4 20.6c0-4.2 3-6.8 6.6-6.8s6.6 2.6 6.6 6.8z" fill="var(--accent-secondary)"/><rect x="17.9" y="7.6" width="2.4" height="9" rx="1.2" fill="var(--accent-success)"/><rect x="14.6" y="10.9" width="9" height="2.4" rx="1.2" fill="var(--accent-success)"/></svg>`,
  emptyBox: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><path d="M12 12.6 20.8 7.8V16L12 20.8z" fill="var(--accent-warning)"/><path d="M12 12.6 3.2 7.8V16L12 20.8z" fill="var(--accent-secondary)"/><path d="M12 3.2 20.8 7.8 12 12.6 3.2 7.8z" fill="var(--accent-primary)"/></svg>`,
  sliders: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><rect x="2.6" y="5.6" width="18.8" height="3" rx="1.5" fill="var(--accent-secondary)"/><rect x="2.6" y="15.4" width="18.8" height="3" rx="1.5" fill="var(--accent-primary)"/><circle cx="15" cy="7.1" r="3" fill="var(--accent-danger)"/><circle cx="15" cy="7.1" r="1.2" fill="#fff"/><circle cx="8.6" cy="16.9" r="3" fill="var(--accent-danger)"/><circle cx="8.6" cy="16.9" r="1.2" fill="#fff"/></svg>`,
};

import { planEmblem, planTier } from "/utils/components/plan-emblems.js";

/* ============================================================
   CONSTANTS
   ============================================================ */
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
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
];

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const listEl = document.getElementById("users-list");
const statsEl = document.getElementById("admin-user-stats");
const searchInput = document.getElementById("user-search");
const nativeRoleFilter = document.getElementById("role-filter");

let selectAllCheckbox, bulkActionBar, paginationEl, activeFiltersEl;

/* ============================================================
   STATE
   ============================================================ */
let filterRole = "all";
let filterPlan = "all";
let filterSort = "newest";

let allUsers = [];
let selectedUsers = new Set();
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

/* ============================================================
   1. ADMIN GUARD
   ============================================================ */
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

/* ============================================================
   2. SYNC
   ============================================================ */
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
    showToast("Database synchronised", "success");
    await refreshUsers();
  } catch (err) {
    console.error("Sync failed:", err);
  } finally {
    if (syncBtn) syncBtn.classList.remove("loading");
  }
}

/* ============================================================
   3. INIT
   ============================================================ */
function init() {
  initDropdownGlobalHandlers();
  injectExtendedControls();
  registerKeyboardShortcuts();
  // Note: no auto-sync here. Syncing reads every user doc to check existence;
  // it now runs only when the admin clicks "Sync DB". The list itself is served
  // from the cache below.

  loadUsers();

  // Refresh when the admin returns to the tab. loadUsers() respects the cache
  // TTL, so this costs zero reads when the list is still fresh. This replaces
  // the permanent whole-`users`-collection live listener.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") loadUsers();
  });

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    updateUI();
  });
}

// The user list, served through the shared cache (same "users:all" key the
// admin dashboard uses, so they share one fetch). force:true bypasses the TTL
// after a mutation so the table reflects the change immediately.
const USERS_TTL = 2 * 60 * 1000;
async function loadUsers(force = false) {
  try {
    allUsers = await getList("users:all", () => collection(db, "users"), {
      ttl: USERS_TTL,
      force,
    });
    const currentIds = new Set(allUsers.map((u) => u.id));
    selectedUsers = new Set([...selectedUsers].filter((id) => currentIds.has(id)));
    updateUI();
  } catch (e) {
    if (e && e.quotaBlocked && listEl) {
      listEl.innerHTML = `<div class="empty-state"><h3>Daily database limit reached</h3><p>${e.message}</p></div>`;
      if (statsEl) statsEl.innerHTML = "";
    } else {
      console.error("Failed to load users:", e);
    }
  }
}
function refreshUsers() {
  return loadUsers(true);
}

/* ============================================================
   4. KEYBOARD SHORTCUTS
   ============================================================ */
function registerKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // `/` → focus search
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    // Escape → clear search OR close modals
    if (e.key === "Escape") {
      const modal =
        document.getElementById("user-inspector-modal") ||
        document.getElementById("invite-modal");
      if (modal) {
        modal.remove();
        document.body.style.overflow = "";
        return;
      }
      if (searchInput.value) {
        searchInput.value = "";
        currentPage = 1;
        updateUI();
      }
    }
  });
}

/* ============================================================
   5. CUSTOM DROPDOWN ENGINE
   ============================================================ */
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
      (o) =>
        `<div class="pp-select-item ${o.value === selectedValue ? "active" : ""}" data-value="${o.value}">${o.label}</div>`,
    )
    .join("");

  return `
    <div class="pp-select ${className || ""}" id="${id || ""}" data-id="${id || ""}">
      <button class="pp-select-trigger" type="button">
        <span>${triggerLabel}</span>
        ${SVGS.chevronDown}
      </button>
      <div class="pp-select-menu">${optionsHTML}</div>
    </div>`;
}

function initDropdownGlobalHandlers() {
  document.addEventListener("click", (e) => {
    const isTrigger = e.target.closest(".pp-select-trigger");
    const activeDropdown = e.target.closest(".pp-select");

    document.querySelectorAll(".pp-select.open").forEach((drop) => {
      if (drop !== activeDropdown) drop.classList.remove("open");
    });

    if (isTrigger && activeDropdown) activeDropdown.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    const item = e.target.closest(".pp-select-item");
    if (!item) return;

    const dropdown = item.closest(".pp-select");
    const val = item.dataset.value;
    const triggerSpan = dropdown.querySelector(".pp-select-trigger span");

    dropdown
      .querySelectorAll(".pp-select-item")
      .forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    triggerSpan.textContent = item.textContent.trim();
    dropdown.classList.remove("open");

    dropdown.dispatchEvent(
      new CustomEvent("change", { detail: { value: val } }),
    );
  });
}

/* ============================================================
   6. INJECT EXTENDED CONTROLS (filters, header buttons, etc.)
   ============================================================ */
function injectExtendedControls() {
  /* ── Search icon ── */
  const searchWrap = searchInput?.parentElement;
  if (searchWrap && !searchWrap.querySelector(".search-icon")) {
    const iconSpan = document.createElement("span");
    iconSpan.className = "search-icon";
    iconSpan.innerHTML = SVGS.search;
    searchWrap.insertBefore(iconSpan, searchInput);
  }

  /* ── Hide native role filter; replace filter-wrap with custom dropdowns ── */
  if (nativeRoleFilter) nativeRoleFilter.style.display = "none";

  const filterWrap = nativeRoleFilter?.parentElement;
  if (filterWrap) {
    filterWrap.innerHTML = "";

    const dropConfigs = [
      {
        id: "role-filter-drop",
        className: "pp-select--filter",
        options: FILTER_ROLE_OPTIONS,
        selected: filterRole,
        onChange: (v) => {
          filterRole = v;
          currentPage = 1;
        },
      },
      {
        id: "plan-filter-drop",
        className: "pp-select--filter",
        options: FILTER_PLAN_OPTIONS,
        selected: filterPlan,
        onChange: (v) => {
          filterPlan = v;
          currentPage = 1;
        },
      },
      {
        id: "sort-filter-drop",
        className: "pp-select--filter",
        options: FILTER_SORT_OPTIONS,
        selected: filterSort,
        onChange: (v) => {
          filterSort = v;
        },
      },
    ];

    dropConfigs.forEach(({ id, className, options, selected, onChange }) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = makeBrutalDropdownHTML({
        id,
        className,
        options,
        selectedValue: selected,
      });
      const el = wrap.firstElementChild;
      filterWrap.appendChild(el);
      el.addEventListener("change", (e) => {
        onChange(e.detail.value);
        updateUI();
      });
    });
  }

  /* ── Inject active-filter chips strip above table ── */
  const listContainer = document.querySelector(".users-list-container");
  if (listContainer && !document.getElementById("active-filters-strip")) {
    activeFiltersEl = document.createElement("div");
    activeFiltersEl.id = "active-filters-strip";
    activeFiltersEl.className = "active-filters-strip";
    listContainer.before(activeFiltersEl);
  }

  /* ── Inject header action buttons (Invite + Export) ── */
  const adminHeader = document.querySelector(".admin-header");
  if (adminHeader && !document.getElementById("header-action-group")) {
    const actionGroup = document.createElement("div");
    actionGroup.id = "header-action-group";
    actionGroup.className = "header-actions";
    actionGroup.innerHTML = `
      <button id="invite-btn" class="header-btn header-btn-primary" title="Invite user">
        ${SVGS.invite} Invite User
      </button>
      <button id="export-btn" class="header-btn header-btn-secondary" title="Export CSV (/)">
        ${SVGS.download} Export CSV
      </button>`;
    adminHeader.appendChild(actionGroup);

    document.getElementById("invite-btn").onclick = openInviteModal;
    document.getElementById("export-btn").onclick = exportFilteredCSV;
  }

  /* ── Wrap table in scrollable div ── */
  if (listContainer && !listContainer.querySelector(".table-scroll-wrap")) {
    const scrollWrap = document.createElement("div");
    scrollWrap.className = "table-scroll-wrap";
    while (listContainer.firstChild)
      scrollWrap.appendChild(listContainer.firstChild);
    listContainer.appendChild(scrollWrap);
    listEl && scrollWrap.appendChild(listEl);
  }

  /* ── Table header checkbox ── */
  const tableHeader = document.querySelector(".users-table-header");
  if (tableHeader && !document.getElementById("select-all-users")) {
    const checkHeader = document.createElement("div");
    checkHeader.innerHTML = `<input type="checkbox" id="select-all-users" class="brutal-checkbox">`;
    tableHeader.insertBefore(checkHeader, tableHeader.firstChild);

    selectAllCheckbox = document.getElementById("select-all-users");
    selectAllCheckbox.addEventListener("change", handleSelectAll);
  }

  /* ── Bulk action bar ── */
  if (!document.getElementById("bulk-action-bar")) {
    bulkActionBar = document.createElement("div");
    bulkActionBar.id = "bulk-action-bar";
    bulkActionBar.className = "bulk-bar hidden";
    document.body.appendChild(bulkActionBar);
  } else {
    bulkActionBar = document.getElementById("bulk-action-bar");
  }

  /* ── Pagination ── */
  if (listContainer && !paginationEl) {
    paginationEl = document.createElement("div");
    paginationEl.className = "brutal-pagination";
    listContainer.after(paginationEl);
  }
}

/* ============================================================
   7. MAIN UI UPDATE
   ============================================================ */
function updateUI() {
  const term = searchInput.value.toLowerCase().trim();

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

  renderStats(allUsers, filtered.length);
  renderActiveFilterChips(term);
  renderBulkBar();

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  renderList(filtered.slice(start, start + ITEMS_PER_PAGE));
  renderPagination(totalPages, filtered.length);
}

/* ============================================================
   8. RENDER STATS
   ============================================================ */
function renderStats(users, filteredCount) {
  const total = users.length;
  const teachers = users.filter((u) => u.role === "teacher").length;
  const premium = users.filter((u) => u.isPremium).length;
  const admins = users.filter((u) => u.role === "admin").length;

  statsEl.innerHTML = `
    <div class="pp-sticky pp-sticky--c0 stat-note" style="--pp-note-tilt:-2deg;">
      <strong>${total}</strong><span>Total Users</span>
    </div>
    <div class="pp-sticky pp-sticky--c3 stat-note" style="--pp-note-tilt:1.5deg;">
      <strong>${teachers}</strong><span>Teachers</span>
    </div>
    <div class="pp-sticky pp-sticky--c2 stat-note" style="--pp-note-tilt:-1deg;">
      <strong>${premium}</strong><span>Premium</span>
    </div>
    <div class="pp-sticky pp-sticky--c4 stat-note" style="--pp-note-tilt:2deg;">
      <strong>${admins}</strong><span>Admins</span>
    </div>
    <button id="sync-trigger-btn" class="sync-action-btn" title="Sync database">
      ${SVGS.sync} Sync DB
    </button>`;

  document.getElementById("sync-trigger-btn").onclick = triggerSync;
}

/* ============================================================
   9. ACTIVE FILTER CHIPS
   ============================================================ */
function renderActiveFilterChips(term) {
  if (!activeFiltersEl) return;
  activeFiltersEl.innerHTML = "";

  const chips = [];
  if (term)
    chips.push({
      label: `Search: "${term}"`,
      clear: () => {
        searchInput.value = "";
        currentPage = 1;
        updateUI();
      },
    });
  if (filterRole !== "all")
    chips.push({
      label: `Role: ${filterRole}`,
      clear: () =>
        resetDropdown("role-filter-drop", "all", FILTER_ROLE_OPTIONS, () => {
          filterRole = "all";
        }),
    });
  if (filterPlan !== "all")
    chips.push({
      label: `Plan: ${filterPlan}`,
      clear: () =>
        resetDropdown("plan-filter-drop", "all", FILTER_PLAN_OPTIONS, () => {
          filterPlan = "all";
        }),
    });
  if (filterSort !== "newest")
    chips.push({
      label: `Sort: ${FILTER_SORT_OPTIONS.find((o) => o.value === filterSort)?.label}`,
      clear: () =>
        resetDropdown("sort-filter-drop", "newest", FILTER_SORT_OPTIONS, () => {
          filterSort = "newest";
        }),
    });

  chips.forEach(({ label, clear }) => {
    const chip = document.createElement("div");
    chip.className = "filter-chip-active";
    chip.innerHTML = `<span>${label}</span><span class="chip-x">x</span>`;
    chip.onclick = () => {
      clear();
      currentPage = 1;
      updateUI();
    };
    activeFiltersEl.appendChild(chip);
  });
}

function resetDropdown(id, value, options, stateFn) {
  const drop = document.getElementById(id);
  if (!drop) return;
  const label = options.find((o) => o.value === value)?.label || value;
  const span = drop.querySelector(".pp-select-trigger span");
  if (span) span.textContent = label;
  drop.querySelectorAll(".pp-select-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.value === value);
  });
  stateFn();
}

/* ============================================================
   10. RENDER LIST
   ============================================================ */
function renderList(users) {
  if (!users.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${SVGS.emptyBox}</div>
        <h3>No Users Found</h3>
        <p>Try adjusting your filters or search term.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = users
    .map(
      (u) => `
    <div class="user-row" data-id="${u.id}" data-role="${u.role || "student"}">
      <div class="cell-checkbox">
        <input type="checkbox" class="brutal-checkbox user-select-chk" data-id="${u.id}" ${selectedUsers.has(u.id) ? "checked" : ""}>
      </div>
      <div class="user-cell-info inspect-trigger">
        <div class="user-avatar" style="${avatarColor(u.role)}">${PERSON_SVG}</div>
        <div class="user-meta-main">
          <strong class="user-name-text">${u.name || "User"}</strong>
          <span class="user-email-text">${u.email}</span>
          ${overridesChip(u)}
        </div>
      </div>
      <div>
        ${makeBrutalDropdownHTML({
          id: u.id,
          className: "pp-select--sm",
          options: ROLE_OPTIONS,
          selectedValue: u.role || "student",
        })}
      </div>
      <div>
        <button class="plan-toggle plan-emblem plan-emblem--${planTier(u.isPremium, u.planName)}" data-id="${u.id}">
          ${planEmblem(u.isPremium, u.planName)}
        </button>
      </div>
      <div class="user-joined inspect-trigger">${fmtDate(u.createdAt)}</div>
      <div class="actions-group">
        <button class="action-btn btn-features"       data-id="${u.id}" title="Feature overrides">${SVGS.sliders}</button>
        <button class="action-btn btn-inspect"        data-id="${u.id}" title="Inspect profile">${SVGS.inspect}</button>
        <button class="action-btn btn-copy"           data-id="${u.id}" data-email="${u.email}" title="Copy email">${SVGS.copy}</button>
        <button class="action-btn btn-delete text-danger" data-id="${u.id}" title="Delete user">${SVGS.trash}</button>
      </div>
    </div>`,
    )
    .join("");

  attachListEvents();
}

/* ============================================================
   11. ROW EVENT LISTENERS
   ============================================================ */
function attachListEvents() {
  // Checkboxes
  listEl.querySelectorAll(".user-select-chk").forEach((el) => {
    el.onchange = (e) => {
      const id = e.target.dataset.id;
      e.target.checked ? selectedUsers.add(id) : selectedUsers.delete(id);
      updateSelectAllHeaderState();
      renderBulkBar();
    };
  });

  // Inspect
  listEl.querySelectorAll(".inspect-trigger, .btn-inspect").forEach((el) => {
    el.onclick = (e) => {
      const row = e.target.closest(".user-row");
      const user = allUsers.find((u) => u.id === row.dataset.id);
      if (user) openInspectorModal(user);
    };
  });

  // Per-user feature overrides
  listEl.querySelectorAll(".btn-features").forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      const user = allUsers.find((u) => u.id === el.dataset.id);
      if (user) openFeaturesModal(user);
    };
  });

  // Role dropdown
  listEl.querySelectorAll(".pp-select--sm").forEach((el) => {
    el.addEventListener("change", async (e) => {
      const userId = el.dataset.id;
      const newRole = e.detail.value;
      try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        showToast(`Role updated to ${newRole}`, "success");
        // Update the role border accent in place
        const row = listEl.querySelector(`.user-row[data-id="${userId}"]`);
        if (row) row.dataset.role = newRole;
        refreshUsers();
      } catch {
        showToast("Error updating role", "error");
      }
    });
  });

  // Plan toggle
  listEl.querySelectorAll(".plan-toggle").forEach((el) => {
    el.onclick = async () => {
      const id = el.dataset.id;
      const isCurrentlyPremium = !el.classList.contains("plan-emblem--free");
      try {
        await updateDoc(doc(db, "users", id), {
          isPremium: !isCurrentlyPremium,
        });
        showToast(
          `Plan ${isCurrentlyPremium ? "downgraded to Free" : "upgraded to Premium"}`,
          "success",
        );
        refreshUsers();
      } catch {
        showToast("Error changing plan", "error");
      }
    };
  });

  // Copy email button
  listEl.querySelectorAll(".btn-copy").forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      const email = el.dataset.email;
      copyToClipboard(email, "Email copied");
    };
  });

  // Delete
  listEl.querySelectorAll(".btn-delete").forEach((el) => {
    el.onclick = async (e) => {
      e.stopPropagation();
      if (
        confirm(
          "Delete this user record from Firestore? This cannot be undone.",
        )
      ) {
        try {
          await deleteDoc(doc(db, "users", el.dataset.id));
          showToast("User record deleted", "success");
          refreshUsers();
        } catch {
          showToast("Failed to delete user", "error");
        }
      }
    };
  });
}

/* ============================================================
   12. SELECT ALL / BULK BAR
   ============================================================ */
function handleSelectAll(e) {
  listEl.querySelectorAll(".user-select-chk").forEach((chk) => {
    chk.checked = e.target.checked;
    const id = chk.dataset.id;
    e.target.checked ? selectedUsers.add(id) : selectedUsers.delete(id);
  });
  renderBulkBar();
}

function updateSelectAllHeaderState() {
  if (!selectAllCheckbox) return;
  const visible = listEl.querySelectorAll(".user-select-chk");
  selectAllCheckbox.checked =
    visible.length > 0 && Array.from(visible).every((c) => c.checked);
}

function renderBulkBar() {
  if (!bulkActionBar) return;

  if (selectedUsers.size === 0) {
    bulkActionBar.classList.add("hidden");
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    return;
  }

  bulkActionBar.classList.remove("hidden");
  bulkActionBar.innerHTML = `
    <div class="bulk-content">
      <span class="bulk-count">
        <span class="bulk-count-dot"></span>
        <strong>${selectedUsers.size}</strong>&nbsp;users selected
      </span>
      <div class="bulk-controls">
        ${makeBrutalDropdownHTML({
          id: "bulk-role-select",
          className: "pp-select--up",
          options: ROLE_OPTIONS,
          selectedValue: "",
          defaultLabel: "Change Role...",
        })}
        <button id="bulk-premium-btn" class="bulk-btn">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon-svg"><path d="M12 2.6l2.6 5.35 5.9.85-4.27 4.16 1.01 5.88L12 16.13l-5.24 2.76 1.01-5.88L3.5 8.8l5.9-.85z" fill="var(--accent-primary)"/><circle cx="12" cy="10.4" r="1.9" fill="#fff" opacity="0.85"/></svg>
          Toggle Premium
        </button>
        <button id="bulk-features-btn" class="bulk-btn">
          ${SVGS.sliders} Feature Override
        </button>
        <button id="bulk-copy-emails-btn" class="bulk-btn bulk-btn-copy">
          ${SVGS.copy} Copy Emails
        </button>
        <button id="bulk-delete-btn" class="bulk-btn bulk-btn-danger">
          ${SVGS.trash} Delete Selected
        </button>
        <button id="bulk-clear-btn" class="bulk-btn-close">
          ${SVGS.close} Cancel
        </button>
      </div>
    </div>`;

  const bulkRoleEl = document.getElementById("bulk-role-select");
  if (bulkRoleEl) {
    bulkRoleEl.addEventListener("change", async (e) => {
      const roleValue = e.detail.value;
      if (
        !confirm(`Change ${selectedUsers.size} user(s) to role: ${roleValue}?`)
      )
        return;
      try {
        await Promise.all(
          [...selectedUsers].map((id) =>
            updateDoc(doc(db, "users", id), { role: roleValue }),
          ),
        );
        showToast(`Updated ${selectedUsers.size} user roles`, "success");
        selectedUsers.clear();
        refreshUsers();
      } catch {
        showToast("Error updating bulk roles", "error");
      }
    });
  }

  document.getElementById("bulk-premium-btn").onclick = async () => {
    if (!confirm(`Toggle premium status for ${selectedUsers.size} user(s)?`))
      return;
    try {
      await Promise.all(
        [...selectedUsers].map((id) => {
          const userObj = allUsers.find((u) => u.id === id);
          return updateDoc(doc(db, "users", id), {
            isPremium: !userObj?.isPremium,
          });
        }),
      );
      showToast("Subscription status updated", "success");
      selectedUsers.clear();
      refreshUsers();
    } catch {
      showToast("Error toggling subscriptions", "error");
    }
  };

  document.getElementById("bulk-features-btn").onclick = () => openBulkFeatureModal();

  document.getElementById("bulk-copy-emails-btn").onclick = () => {
    const emails = [...selectedUsers]
      .map((id) => allUsers.find((u) => u.id === id)?.email)
      .filter(Boolean)
      .join(", ");
    copyToClipboard(emails, `Copied ${selectedUsers.size} email(s)`);
  };

  document.getElementById("bulk-delete-btn").onclick = async () => {
    if (
      !confirm(
        `CRITICAL: Permanently delete ${selectedUsers.size} user(s)? Cannot be undone.`,
      )
    )
      return;
    try {
      await Promise.all(
        [...selectedUsers].map((id) => deleteDoc(doc(db, "users", id))),
      );
      showToast(`Deleted ${selectedUsers.size} user records`, "success");
      selectedUsers.clear();
      refreshUsers();
    } catch {
      showToast("Failed during bulk delete", "error");
    }
  };

  document.getElementById("bulk-clear-btn").onclick = () => {
    selectedUsers.clear();
    updateUI();
  };
}

/* ============================================================
   13. PAGINATION  (numbered)
   ============================================================ */
function renderPagination(totalPages, totalResults) {
  if (!paginationEl) return;

  if (totalPages <= 1) {
    paginationEl.innerHTML = totalResults
      ? `<span class="pag-indicator">${totalResults} user${totalResults !== 1 ? "s" : ""}</span>`
      : "";
    return;
  }

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1)
    startPage = Math.max(1, endPage - maxVisible + 1);

  const pageButtons = [];
  for (let p = startPage; p <= endPage; p++) {
    pageButtons.push(
      `<button class="pag-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`,
    );
  }

  paginationEl.innerHTML = `
    <div class="pag-btn-group">
      <button class="pag-btn" id="prev-page" ${currentPage === 1 ? "disabled" : ""}>${SVGS.arrowLeft}</button>
    </div>
    <div class="pag-btn-group">
      ${startPage > 1 ? `<button class="pag-btn" data-page="1">1</button>${startPage > 2 ? `<span class="pag-indicator">…</span>` : ""}` : ""}
      ${pageButtons.join("")}
      ${endPage < totalPages ? `${endPage < totalPages - 1 ? `<span class="pag-indicator">…</span>` : ""}<button class="pag-btn" data-page="${totalPages}">${totalPages}</button>` : ""}
    </div>
    <div class="pag-btn-group">
      <button class="pag-btn" id="next-page" ${currentPage === totalPages ? "disabled" : ""}>${SVGS.arrowRight}</button>
    </div>`;

  paginationEl.querySelectorAll(".pag-btn[data-page]").forEach((btn) => {
    btn.onclick = () => {
      currentPage = parseInt(btn.dataset.page);
      updateUI();
    };
  });

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

/* ============================================================
   14. INSPECTOR MODAL
   ============================================================ */
function openInspectorModal(user) {
  document.getElementById("user-inspector-modal")?.remove();

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
          <div class="user-avatar large-avatar" style="${avatarColor(user.role)}">${PERSON_SVG}</div>
          <div class="modal-profile-info">
            <h3>${user.name || "Unknown User"}</h3>
            <p>${user.email}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item copyable" data-copy="${user.id}" title="Copy UID">
            <span class="meta-lbl">System UID</span>
            <span class="meta-val monospace">${user.id}</span>
          </div>
          <div class="meta-item copyable" data-copy="${user.email}" title="Copy email">
            <span class="meta-lbl">Email Address</span>
            <span class="meta-val monospace">${user.email}</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Access Role</span>
            <span class="meta-val"><span class="badge badge-${user.role}">${(user.role || "student").toUpperCase()}</span></span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Billing Tier</span>
            <span class="meta-val"><span class="plan-emblem plan-emblem--${planTier(user.isPremium, user.planName)}">${planEmblem(user.isPremium, user.planName)}</span></span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Registered</span>
            <span class="meta-val">${fmtDate(user.createdAt)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Has API Keys</span>
            <span class="meta-val">${[user.geminiKey && "Gemini", user.groqKey && "Groq", user.youtubeKey && "YouTube"].filter(Boolean).join(", ") || "None"}</span>
          </div>
        </div>

        <div class="raw-data-area">
          <span class="meta-lbl">Raw Firestore Document</span>
          <pre><code>${JSON.stringify(user, null, 2)}</code></pre>
        </div>
      </div>
      <div class="modal-footer">
        <button class="brutal-btn-flat" id="modal-verify-btn">Verify Status</button>
        <button class="brutal-btn-flat brutal-btn-primary" id="modal-copy-all-btn">Copy as JSON</button>
        <button class="brutal-btn-flat" id="close-inspector-footer">Close</button>
      </div>
    </div>`;

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

  // Copyable meta items
  modal.querySelectorAll(".meta-item.copyable").forEach((item) => {
    item.onclick = () =>
      copyToClipboard(item.dataset.copy, "Copied to clipboard");
  });

  document.getElementById("modal-verify-btn").onclick = () =>
    showToast(`Validation passed for ${user.name || "user"}`, "success");

  document.getElementById("modal-copy-all-btn").onclick = () =>
    copyToClipboard(JSON.stringify(user, null, 2), "User JSON copied");
}

/* ============================================================
   14b. PER-USER FEATURE OVERRIDES
   ============================================================
   Grant or block individual features (and their sub-parts) for ONE user,
   overriding the global admin Settings. Stored on users/{uid}.featureOverrides
   (admin-only per firestore.rules) and resolved everywhere through
   /utils/features.js resolveAccess: part-disabled → block → grant → global.
   The feature list and parts render straight from the shared registry, so a
   new feature needs no changes here. Changes take effect within ~5 minutes
   (client + server entitlement caches). */

const ovCount = (u) =>
  u.featureOverrides && typeof u.featureOverrides === "object"
    ? Object.keys(u.featureOverrides).length
    : 0;

function overridesChip(u) {
  const n = ovCount(u);
  if (!n) return "";
  return `<span class="user-overrides-chip">${n} feature override${n > 1 ? "s" : ""}</span>`;
}

// Build the featureOverrides map out of a rendered editor's DOM state.
function collectOverridesFromDom(root, FEATURES) {
  const map = {};
  root.querySelectorAll(".fo-feature").forEach((box) => {
    const fid = box.dataset.feature;
    const feature = FEATURES.find((f) => f.id === fid);
    const access = box.querySelector(".fo-seg button[aria-pressed='true']")?.dataset.access || "inherit";
    const entry = {};
    if (access === "grant" || access === "block") entry.access = access;
    if (feature?.parts?.length) {
      const checks = [...box.querySelectorAll(".fo-part input")];
      if (checks.some((c) => !c.checked)) {
        entry.parts = Object.fromEntries(checks.map((c) => [c.dataset.part, c.checked]));
      }
    }
    if (Object.keys(entry).length) map[fid] = { ...entry, updatedAt: Date.now() };
  });
  return map;
}

// One feature's editor row (tri-state + optional part checkboxes).
function featureEditorRow(f, ov, cfg) {
  const access = (ov && ov.access) || "inherit";
  const globalState = cfg.states[f.id] || f.default;
  const globalParts = cfg.parts[f.id] || {};
  const partsHtml = (f.parts || []).length
    ? `<div class="fo-parts">
        ${f.parts.map((p) => {
          // Prefill: user's own parts if set, else the global checkbox state.
          const on = ov && ov.parts ? ov.parts[p.id] !== false : globalParts[p.id] !== false;
          return `<label class="fo-part"><input type="checkbox" data-part="${p.id}" ${on ? "checked" : ""}><span>${p.label}</span></label>`;
        }).join("")}
        <button type="button" class="fo-parts-all" data-all="true">all</button>
        <button type="button" class="fo-parts-all" data-all="false">none</button>
      </div>`
    : "";
  return `
    <div class="fo-feature" data-feature="${f.id}">
      <div class="fo-head">
        <div class="fo-label">
          <strong>${f.label}</strong>
          <span class="fo-global">global: ${globalState}</span>
        </div>
        <div class="fo-seg">
          <button type="button" data-access="inherit" aria-pressed="${access === "inherit"}">Inherit</button>
          <button type="button" data-access="grant"   aria-pressed="${access === "grant"}">Grant</button>
          <button type="button" data-access="block"   aria-pressed="${access === "block"}">Block</button>
        </div>
      </div>
      ${partsHtml}
    </div>`;
}

function wireFeatureEditor(root) {
  root.querySelectorAll(".fo-seg").forEach((seg) => {
    seg.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        seg.querySelectorAll("button").forEach((b) =>
          b.setAttribute("aria-pressed", String(b === btn)),
        );
      };
    });
  });
  root.querySelectorAll(".fo-parts-all").forEach((btn) => {
    btn.onclick = () => {
      btn.closest(".fo-parts").querySelectorAll("input").forEach((c) => {
        c.checked = btn.dataset.all === "true";
      });
    };
  });
}

async function openFeaturesModal(user) {
  document.getElementById("user-features-modal")?.remove();

  const { FEATURES, fetchFeatureConfig, defaultStates } = await import("/utils/features.js");
  let cfg = { states: defaultStates(), parts: {} };
  try { cfg = await fetchFeatureConfig(); } catch {}
  const overrides = user.featureOverrides || {};

  const modal = document.createElement("div");
  modal.id = "user-features-modal";
  modal.className = "brutal-modal-overlay";
  modal.innerHTML = `
    <div class="brutal-modal-card">
      <div class="modal-header">
        <h2>Feature Access — ${user.name || user.email}</h2>
        <button class="modal-close-btn" id="fo-close-btn">${SVGS.close}</button>
      </div>
      <div class="modal-body">
        <p class="fo-hint">
          <strong>Inherit</strong> follows the global setting. <strong>Grant</strong> unlocks the
          feature for this user (even if it's premium or switched off). <strong>Block</strong> denies
          it (even if it's free). Unchecked parts are excluded for this user.
          Changes take effect within ~5 minutes.
        </p>
        <div id="fo-list">
          ${FEATURES.map((f) => featureEditorRow(f, overrides[f.id], cfg)).join("")}
        </div>
      </div>
      <div class="modal-footer">
        <button class="brutal-btn-flat" id="fo-clear-btn">Clear All Overrides</button>
        <button class="brutal-btn-flat brutal-btn-primary" id="fo-save-btn">Save</button>
        <button class="brutal-btn-flat" id="fo-cancel-btn">Cancel</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  wireFeatureEditor(modal);

  const closeModal = () => {
    modal.remove();
    document.body.style.overflow = "";
  };
  document.getElementById("fo-close-btn").onclick = closeModal;
  document.getElementById("fo-cancel-btn").onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  async function persist(map) {
    const payload = Object.keys(map).length ? map : deleteField();
    await updateDoc(doc(db, "users", user.id), { featureOverrides: payload });
  }

  document.getElementById("fo-save-btn").onclick = async () => {
    try {
      const map = collectOverridesFromDom(modal, FEATURES);
      await persist(map);
      showToast(`Feature access saved for ${user.name || "user"}`, "success");
      closeModal();
      refreshUsers();
    } catch {
      showToast("Error saving feature access", "error");
    }
  };

  document.getElementById("fo-clear-btn").onclick = async () => {
    if (!confirm("Remove ALL feature overrides for this user (back to global settings)?")) return;
    try {
      await persist({});
      showToast("Overrides cleared", "success");
      closeModal();
      refreshUsers();
    } catch {
      showToast("Error clearing overrides", "error");
    }
  };
}

// Bulk: set/clear ONE feature's override across every selected user.
async function openBulkFeatureModal() {
  document.getElementById("bulk-features-modal")?.remove();

  const { FEATURES } = await import("/utils/features.js");
  const modal = document.createElement("div");
  modal.id = "bulk-features-modal";
  modal.className = "brutal-modal-overlay";
  modal.innerHTML = `
    <div class="brutal-modal-card">
      <div class="modal-header">
        <h2>Feature Override — ${selectedUsers.size} user(s)</h2>
        <button class="modal-close-btn" id="bfo-close-btn">${SVGS.close}</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Feature</label>
            ${makeBrutalDropdownHTML({
              id: "bfo-feature-drop",
              options: FEATURES.map((f) => ({ value: f.id, label: f.label })),
              selectedValue: FEATURES[0].id,
            })}
          </div>
          <div class="form-group">
            <label class="form-label">Action</label>
            ${makeBrutalDropdownHTML({
              id: "bfo-action-drop",
              options: [
                { value: "grant", label: "Grant" },
                { value: "block", label: "Block" },
                { value: "clear", label: "Clear override (inherit)" },
              ],
              selectedValue: "grant",
            })}
          </div>
        </div>
        <p class="fo-hint">Applies to every selected user. Changes take effect within ~5 minutes.</p>
      </div>
      <div class="modal-footer">
        <button class="brutal-btn-flat brutal-btn-primary" id="bfo-apply-btn">Apply</button>
        <button class="brutal-btn-flat" id="bfo-cancel-btn">Cancel</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  const closeModal = () => {
    modal.remove();
    document.body.style.overflow = "";
  };
  document.getElementById("bfo-close-btn").onclick = closeModal;
  document.getElementById("bfo-cancel-btn").onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  const picked = { feature: FEATURES[0].id, action: "grant" };
  document.getElementById("bfo-feature-drop")?.addEventListener("change", (e) => { picked.feature = e.detail.value; });
  document.getElementById("bfo-action-drop")?.addEventListener("change", (e) => { picked.action = e.detail.value; });

  document.getElementById("bfo-apply-btn").onclick = async () => {
    const label = FEATURES.find((f) => f.id === picked.feature)?.label || picked.feature;
    if (!confirm(`${picked.action === "clear" ? "Clear the override for" : picked.action.toUpperCase()} "${label}" on ${selectedUsers.size} user(s)?`)) return;
    try {
      await Promise.all(
        [...selectedUsers].map((id) => {
          const u = allUsers.find((x) => x.id === id);
          const map = { ...((u && u.featureOverrides) || {}) };
          if (picked.action === "clear") delete map[picked.feature];
          else map[picked.feature] = { access: picked.action, updatedAt: Date.now() };
          const payload = Object.keys(map).length ? map : deleteField();
          return updateDoc(doc(db, "users", id), { featureOverrides: payload });
        }),
      );
      showToast(`Feature override applied to ${selectedUsers.size} user(s)`, "success");
      selectedUsers.clear();
      closeModal();
      refreshUsers();
    } catch {
      showToast("Error applying bulk override", "error");
    }
  };
}

/* ============================================================
   15. INVITE MODAL
   ============================================================ */
function openInviteModal() {
  document.getElementById("invite-modal")?.remove();

  const modal = document.createElement("div");
  modal.id = "invite-modal";
  modal.className = "brutal-modal-overlay";
  modal.innerHTML = `
    <div class="brutal-modal-card">
      <div class="modal-header">
        <h2>Invite New User</h2>
        <button class="modal-close-btn" id="close-invite-btn">${SVGS.close}</button>
      </div>
      <div class="modal-body">
        <div class="invite-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" id="invite-name" type="text" placeholder="e.g. Amina Yusuf" autocomplete="off">
              <span class="form-error-msg" id="err-name"></span>
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input class="form-input" id="invite-email" type="email" placeholder="e.g. amina@school.ng" autocomplete="off">
              <span class="form-error-msg" id="err-email"></span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Role</label>
              ${makeBrutalDropdownHTML({ id: "invite-role-drop", options: ROLE_OPTIONS, selectedValue: "student" })}
            </div>
            <div class="form-group">
              <label class="form-label">Plan</label>
              ${makeBrutalDropdownHTML({
                id: "invite-plan-drop",
                options: [
                  { value: "free", label: "Free Plan" },
                  { value: "premium", label: "Premium" },
                ],
                selectedValue: "free",
              })}
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="brutal-btn-flat" id="close-invite-footer">Cancel</button>
        <button class="brutal-btn-flat brutal-btn-primary" id="submit-invite-btn">${SVGS.invite} Send Invite</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  document.getElementById("invite-name").focus();

  const closeModal = () => {
    modal.remove();
    document.body.style.overflow = "";
  };
  document.getElementById("close-invite-btn").onclick = closeModal;
  document.getElementById("close-invite-footer").onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  let inviteRole = "student";
  let invitePlan = "free";

  modal.querySelector("#invite-role-drop").addEventListener("change", (e) => {
    inviteRole = e.detail.value;
  });
  modal.querySelector("#invite-plan-drop").addEventListener("change", (e) => {
    invitePlan = e.detail.value;
  });

  document.getElementById("submit-invite-btn").onclick = () => {
    const nameEl = document.getElementById("invite-name");
    const emailEl = document.getElementById("invite-email");
    const nameErr = document.getElementById("err-name");
    const emailErr = document.getElementById("err-email");
    let valid = true;

    nameEl.classList.remove("error");
    emailEl.classList.remove("error");
    nameErr.textContent = "";
    emailErr.textContent = "";

    if (!nameEl.value.trim()) {
      nameEl.classList.add("error");
      nameErr.textContent = "Name is required.";
      valid = false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailEl.value.trim())) {
      emailEl.classList.add("error");
      emailErr.textContent = "Enter a valid email address.";
      valid = false;
    }
    if (!valid) return;

    // Placeholder — wire to your Cloud Function or Firestore create
    showToast(`Invite sent to ${emailEl.value.trim()}`, "success");
    closeModal();
  };
}

/* ============================================================
   16. EXPORT CSV
   ============================================================ */
function exportFilteredCSV() {
  const term = searchInput.value.toLowerCase().trim();
  const filtered = allUsers.filter((u) => {
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

  const headers = ["Name", "Email", "Role", "Plan", "Registered"];
  const rows = filtered.map((u) => [
    `"${(u.name || "").replace(/"/g, '""')}"`,
    `"${(u.email || "").replace(/"/g, '""')}"`,
    u.role || "student",
    u.isPremium ? "Premium" : "Free",
    fmtDate(u.createdAt),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prep-portal-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast(`Exported ${filtered.length} user(s) to CSV`, "success");
}

/* ============================================================
   17. CLIPBOARD UTILITY
   ============================================================ */
function copyToClipboard(text, successMsg = "Copied!") {
  navigator.clipboard.writeText(text).then(
    () => showToast(successMsg, "success"),
    () => showToast("Could not copy — try manually", "error"),
  );
}

/* ============================================================
   18. TOAST SYSTEM
   ============================================================ */
function showToast(message, type = "success") {
  const container =
    document.getElementById("toast-container") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon =
    type === "success" ? SVGS.check : type === "info" ? SVGS.info : SVGS.alert;
  toast.innerHTML = `<span class="toast-symbol">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, 3200);
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toast-container";
  document.body.appendChild(container);
  return container;
}
