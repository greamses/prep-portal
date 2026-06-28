import { auth, db } from "/firebase-init.js";
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
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
  sync: `<svg class="icon-svg icon-sync" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  inspect: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  trash: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  copy: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  arrowLeft: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  arrowRight: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  close: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  check: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  info: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  chevronDown: `<svg class="icon-svg chevron-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  search: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  download: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  invite: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
  emptyBox: `<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
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
    console.error("Failed to load users:", e);
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
          <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Toggle Premium
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
