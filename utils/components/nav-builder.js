import NAV_CONFIG from "/utils/components/nav-config.js";
import "/home/js/auth-modal.js";
import { auth, db } from "/firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const LOGO_PATH = "/logo/logo-light.svg";

/* =============================================
   ICON RENDERER
============================================= */
function renderIcon(icon) {
  if (!icon) return null;

  if (icon.trim().startsWith("<svg")) {
    const wrapper = document.createElement("span");
    wrapper.className = "nav-icon";
    wrapper.innerHTML = icon;
    return wrapper;
  }

  const img = document.createElement("img");
  img.src = icon;
  img.alt = "";
  img.className = "nav-icon";
  return img;
}

/* =============================================
   ROBUST PATH MATCHING HELPER
============================================= */
function matchPath(currentPath, href) {
  if (!href || href === "#") return false;

  // Normalize by removing trailing slashes for clean comparison
  const normPath = currentPath.replace(/\/$/, "");
  const normHref = href.replace(/\/$/, "");

  if (normPath === normHref) return true;

  // Match subpaths cleanly (e.g. /courses/math starts with /courses/)
  if (normHref !== "" && normHref !== "/") {
    return normPath.startsWith(normHref + "/");
  }

  return false;
}

/* =============================================
   RECURSIVE TREE RENDERER
============================================= */
function buildTree(items, level = 1) {
  const container = document.createElement("div");
  container.className = `nav-level nav-level-${level}`;

  items.forEach((item, index) => {
    const block = document.createElement("div");
    block.className = "nav-block";

    // Distribute playful theme colors based on index
    const colorClasses = [
      "theme-yellow",
      "theme-blue",
      "theme-green",
      "theme-red",
    ];
    block.classList.add(colorClasses[index % colorClasses.length]);

    /* =========================
       HEADER (NON-CLICKABLE GROUP)
    ========================= */
    if (item.children && item.children.length > 0) {
      const header = document.createElement("div");
      header.className = "nav-header";

      const icon = renderIcon(item.icon);
      if (icon) header.appendChild(icon);

      const title = document.createElement("span");
      title.textContent = item.text;
      header.appendChild(title);

      block.appendChild(header);
      block.appendChild(buildTree(item.children, level + 1));
    }

    /* =========================
       LEAF NODE (CLICKABLE ITEMS)
    ========================= */
    if (!item.children || item.children.length === 0) {
      const link = document.createElement("a");
      link.href = item.href || "#";
      link.className = "nav-leaf";
      link.setAttribute("data-nav-href", item.href || "#");

      const icon = renderIcon(item.icon);
      if (icon) {
        link.appendChild(icon);
      }

      const textWrap = document.createElement("div");
      textWrap.className = "nav-leaf-text";

      const text = document.createElement("span");
      text.className = "nav-leaf-title";
      text.textContent = item.text;
      textWrap.appendChild(text);

      if (item.description) {
        const desc = document.createElement("small");
        desc.textContent = item.description;
        textWrap.appendChild(desc);
      }

      link.appendChild(textWrap);

      const arrow = document.createElement("span");
      arrow.className = "nav-leaf-arrow";
      arrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      link.appendChild(arrow);

      block.appendChild(link);
    }

    container.appendChild(block);
  });

  return container;
}

/* =============================================
   🔥 ACTIVE NAV DETECTION (SCOPED)
============================================= */
function setActiveNav(siteNav) {
  const currentPath = window.location.pathname;

  const allLinks = siteNav.querySelectorAll("[data-nav-href]");
  let bestMatch = null;
  let bestScore = -1;

  allLinks.forEach((link) => {
    link.classList.remove("active");
    link.closest(".nav-block")?.classList.remove("active");
    link.closest(".nav-links > li")?.classList.remove("active");

    const href = link.getAttribute("data-nav-href");
    if (matchPath(currentPath, href)) {
      const normalizedHref = href.replace(/\/$/, "");
      const score =
        currentPath.replace(/\/$/, "") === normalizedHref
          ? normalizedHref.length + 1000
          : normalizedHref.length;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = link;
      }
    }
  });

  if (!bestMatch) return;

  bestMatch.classList.add("active");
  bestMatch.closest(".nav-block")?.classList.add("active");
  bestMatch.closest(".nav-links > li")?.classList.add("active");
}

/* =============================================
   MEGA MENU BUILDER
============================================= */
function buildMegaMenu() {
  const ul = document.createElement("ul");
  ul.className = "nav-links";

  NAV_CONFIG.forEach((item) => {
    const li = document.createElement("li");
    const hasChildren = item.children && item.children.length > 0;

    /* =========================
       MAIN LABEL (DIV for dropdowns, A for single links)
    ========================= */
    const label = document.createElement(hasChildren ? "div" : "a");
    label.className = "nav-main-label";

    if (!hasChildren) {
      label.href = item.href || "#";
      label.setAttribute("data-nav-href", item.href || "#");
    }

    const icon = renderIcon(item.icon);
    if (icon) label.appendChild(icon);

    const text = document.createElement("span");
    text.textContent = item.text;
    label.appendChild(text);

    // Apply toggle logic ONLY if it's a dropdown container
    if (hasChildren) {
      label.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = li.classList.contains("open");
        Array.from(ul.children).forEach((child) =>
          child.classList.remove("open"),
        );
        if (!isOpen) {
          li.classList.add("open");
        }
      });
    }

    li.appendChild(label);

    /* =========================
       MEGA PANEL
    ========================= */
    if (hasChildren) {
      const panel = document.createElement("div");
      panel.className = "mega-panel";

      const inner = document.createElement("div");
      inner.className = "mega-panel-content";

      const tree = document.createElement("div");
      tree.className = "mega-tree";
      tree.appendChild(buildTree(item.children, 1));
      inner.appendChild(tree);

      if (item.image) {
        const imageWrap = document.createElement("div");
        imageWrap.className = "mega-image";

        if (item.image.trim().startsWith("<svg")) {
          imageWrap.innerHTML = item.image;
        } else {
          const img = document.createElement("img");
          img.src = item.image;
          img.alt = item.text;
          imageWrap.appendChild(img);
        }

        inner.appendChild(imageWrap);
      }

      panel.appendChild(inner);
      li.appendChild(panel);
    }

    ul.appendChild(li);
  });

  return ul;
}

/* =============================================
   USER MENU (WITH DROPDOWN)
============================================= */
function buildUserMenu() {
  const menuDiv = document.createElement("div");
  menuDiv.className = "user-menu";
  menuDiv.id = "user-menu";

  const profileDiv = document.createElement("div");
  profileDiv.className = "user-profile";

  const avatar = document.createElement("div");
  avatar.className = "user-avatar";
  avatar.id = "user-avatar";
  avatar.textContent = "U";

  const details = document.createElement("div");
  details.className = "user-details";

  const nameSpan = document.createElement("span");
  nameSpan.className = "user-name";
  nameSpan.id = "user-name";
  nameSpan.textContent = "Guest";

  const planBadge = document.createElement("span");
  planBadge.className = "user-plan-badge";
  planBadge.id = "user-plan-badge";
  planBadge.textContent = "Free Plan";

  details.appendChild(nameSpan);
  details.appendChild(planBadge);

  profileDiv.appendChild(avatar);
  profileDiv.appendChild(details);

  menuDiv.appendChild(profileDiv);

  /* =============================================
     USER DROPDOWN
  ============================================= */
  const dropdown = document.createElement("div");
  dropdown.className = "user-dropdown";

  // 1. Dashboard
  const dashboardLink = document.createElement("a");
  dashboardLink.href = "/dashboard.html";
  dashboardLink.className = "dropdown-item auth-only";
  dashboardLink.textContent = "Dashboard";
  dropdown.appendChild(dashboardLink);

  // 2. Subscription
  const subscriptionLink = document.createElement("a");
  subscriptionLink.href = "/subscription.html";
  subscriptionLink.className = "dropdown-item auth-only";
  subscriptionLink.textContent = "Subscription";
  dropdown.appendChild(subscriptionLink);

  // 3. Login / Sign In (for guests)
  const loginBtn = document.createElement("button");
  loginBtn.type = "button";
  loginBtn.className = "dropdown-item guest-only";
  loginBtn.textContent = "Sign In";
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.openAuthModal?.("login");
  });
  dropdown.appendChild(loginBtn);

  // Divider line before Logout
  const divider = document.createElement("div");
  divider.className = "dropdown-divider auth-only";
  dropdown.appendChild(divider);

  // 4. Logout (with Firebase handler)
  const logoutBtn = document.createElement("button");
  logoutBtn.className = "dropdown-item logout-btn auth-only";
  logoutBtn.textContent = "Logout";
  logoutBtn.type = "button";
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  });
  dropdown.appendChild(logoutBtn);

  menuDiv.appendChild(dropdown);

  // Handle clicking the profile card to toggle dropdown
  profileDiv.addEventListener("click", (e) => {
    e.stopPropagation();
    menuDiv.classList.toggle("open");
  });

  return menuDiv;
}

/* =============================================
   BUILD NAV
============================================= */
function buildNav(siteNav) {
  const brandWrap = document.createElement("div");
  brandWrap.className = "nav-brand-wrap";

  const logo = document.createElement("a");
  logo.href = "/";
  logo.className = "nav-logo";

  const img = document.createElement("img");
  img.src = LOGO_PATH;
  img.alt = "logo";

  const textWrap = document.createElement("div");
  textWrap.className = "nav-logo-text";
  textWrap.innerHTML = `<span class="brand-top">Prep</span><span class="brand-bottom">portal</span>`;

  logo.appendChild(img);
  logo.appendChild(textWrap);
  brandWrap.appendChild(logo);

  siteNav.appendChild(brandWrap);
  siteNav.appendChild(buildMegaMenu());

  const rightWrap = document.createElement("div");
  rightWrap.className = "nav-right-wrap";
  rightWrap.appendChild(buildUserMenu());

  const toggle = document.createElement("button");
  toggle.className = "nav-toggle";
  toggle.id = "nav-toggle";

  for (let i = 0; i < 3; i++) {
    toggle.appendChild(document.createElement("span"));
  }

  rightWrap.appendChild(toggle);
  siteNav.appendChild(rightWrap);

  // Set active state specifically on this navigation instance
  setActiveNav(siteNav);
}

/* =============================================
   ENSURE AUTH STYLES
============================================= */
function ensureAuthStyles() {
  if (document.getElementById("auth-modal-styles")) return;
  const link = document.createElement("link");
  link.id = "auth-modal-styles";
  link.rel = "stylesheet";
  link.href = "/home/css/login.css";
  document.head.appendChild(link);
}

/* =============================================
   EVENTS
============================================= */
function attachEvents() {
  ensureAuthStyles();

  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  toggle?.addEventListener("click", () => {
    toggle.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".site-nav");
    if (!nav) return;
    if (window.scrollY > 10) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  });

  // Unified click listener to close all menus when clicking outside
  document.addEventListener("click", (e) => {
    // 1. Close mega menus
    const openMegaMenus = document.querySelectorAll(".nav-links > li.open");
    openMegaMenus.forEach((li) => {
      if (!li.contains(e.target)) {
        li.classList.remove("open");
      }
    });

    // 2. Close user profile dropdown
    const userMenu = document.getElementById("user-menu");
    if (userMenu && !userMenu.contains(e.target)) {
      userMenu.classList.remove("open");
    }
  });
}

let subListener = null;

function updateAuthUI(user) {
  const avatar = document.getElementById("user-avatar");
  const nameSpan = document.getElementById("user-name");
  const planBadge = document.getElementById("user-plan-badge");
  const userMenu = document.getElementById("user-menu");

  // Cleanup previous listener
  if (subListener) {
    subListener();
    subListener = null;
  }

  if (user) {
    // Show logged-in items in dropdown
    if (userMenu) userMenu.classList.remove("is-guest");

    const initial = (user.displayName || user.email || "U")
      .charAt(0)
      .toUpperCase();
    if (avatar) avatar.textContent = initial;
    if (nameSpan)
      nameSpan.textContent = user.displayName || user.email.split("@")[0];

    // Real-time Subscription Listener
    subListener = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists() && snap.data().isPremium) {
        planBadge.textContent = snap.data().planName || "Pro Plan";
        planBadge.classList.add("premium");
      } else {
        planBadge.textContent = "Free Plan";
        planBadge.classList.remove("premium");
      }
    });
  } else {
    // Show guest-friendly items in dropdown
    if (userMenu) userMenu.classList.add("is-guest");

    if (avatar) avatar.textContent = "U";
    if (nameSpan) nameSpan.textContent = "Guest";
    if (planBadge) {
      planBadge.textContent = "Free Plan";
      planBadge.classList.remove("premium");
    }
  }
}

/* =============================================
   INIT
============================================= */
function init() {
  const navs = document.querySelectorAll('.site-nav[data-nav="main"]');
  if (!navs.length) return;

  navs.forEach(buildNav);
  attachEvents();

  if (typeof auth !== "undefined" && auth.onAuthStateChanged) {
    auth.onAuthStateChanged(updateAuthUI);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
