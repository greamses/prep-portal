import NAV_CONFIG from "/utils/components/nav-config.js";
import "/home/js/auth-modal.js";
import { auth, db } from "/firebase-init.js";
import { signOut, updateProfile } from "firebase/auth";
import {
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const LOGO_PATH = "/logo/logo-light.svg";
const SVG_PERSON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`;
const SVG_CAMERA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
const SVG_HOME = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const SVG_STAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const SVG_LOGOUT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`;
const SVG_LOGIN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;

import { planEmblem, SVG_ROSE } from "/utils/components/plan-emblems.js";

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
   PHOTO UPLOAD HELPERS
============================================= */
function setAvatarPhoto(photoURL) {
  const img = `<img src="${photoURL}" alt="Profile photo" class="user-avatar-photo">`;
  const triggerAvatar = document.getElementById("user-avatar");
  if (triggerAvatar) triggerAvatar.innerHTML = img;
  const avatarLg = document.getElementById("dropdown-avatar-lg");
  if (avatarLg) avatarLg.innerHTML = img;
}

async function handlePhotoUpload(file, user) {
  const avatarLg = document.getElementById("dropdown-avatar-lg");
  if (avatarLg) avatarLg.style.opacity = "0.4";
  try {
    const storage = getStorage();
    const sRef = storageRef(storage, `profilePhotos/${user.uid}`);
    await uploadBytes(sRef, file);
    const photoURL = await getDownloadURL(sRef);
    await updateProfile(user, { photoURL });
    await updateDoc(doc(db, "users", user.uid), { photoURL });
    setAvatarPhoto(photoURL);
  } catch (err) {
    console.error("Photo upload failed:", err);
  } finally {
    if (avatarLg) avatarLg.style.opacity = "1";
  }
}

/* =============================================
   USER MENU (WITH DROPDOWN)
============================================= */
function buildUserMenu() {
  const menuDiv = document.createElement("div");
  menuDiv.className = "user-menu";
  menuDiv.id = "user-menu";

  // ── Nav trigger ──────────────────────────────────────────
  const profileDiv = document.createElement("div");
  profileDiv.className = "user-profile";

  const avatar = document.createElement("div");
  avatar.className = "user-avatar";
  avatar.id = "user-avatar";
  avatar.innerHTML = SVG_PERSON;

  const details = document.createElement("div");
  details.className = "user-details";

  const nameSpan = document.createElement("span");
  nameSpan.className = "user-name";
  nameSpan.id = "user-name";
  nameSpan.textContent = "Guest";

  const planBadge = document.createElement("span");
  planBadge.className = "user-plan-badge plan-free";
  planBadge.id = "user-plan-badge";
  planBadge.innerHTML = SVG_ROSE;

  details.appendChild(nameSpan);
  details.appendChild(planBadge);
  profileDiv.appendChild(avatar);
  profileDiv.appendChild(details);
  menuDiv.appendChild(profileDiv);

  // ── Dropdown card ─────────────────────────────────────────
  const dropdown = document.createElement("div");
  dropdown.className = "neo-dropdown profile-dropdown";

  // Profile header
  const header = document.createElement("div");
  header.className = "profile-dropdown-header";

  const avatarWrap = document.createElement("div");
  avatarWrap.className = "profile-avatar-wrap";

  const avatarLg = document.createElement("div");
  avatarLg.className = "profile-avatar-lg";
  avatarLg.id = "dropdown-avatar-lg";
  avatarLg.innerHTML = SVG_PERSON;

  const cameraOverlay = document.createElement("div");
  cameraOverlay.className = "profile-avatar-camera auth-only";
  cameraOverlay.innerHTML = SVG_CAMERA;
  cameraOverlay.title = "Change profile photo";

  const photoInput = document.createElement("input");
  photoInput.type = "file";
  photoInput.accept = "image/*";
  photoInput.style.display = "none";
  photoInput.id = "profile-photo-input";

  avatarWrap.appendChild(avatarLg);
  avatarWrap.appendChild(cameraOverlay);
  avatarWrap.appendChild(photoInput);

  const profileInfo = document.createElement("div");
  profileInfo.className = "profile-dropdown-info";

  const ddName = document.createElement("span");
  ddName.className = "profile-dropdown-name";
  ddName.id = "dropdown-user-name";
  ddName.textContent = "Guest";

  const ddEmail = document.createElement("span");
  ddEmail.className = "profile-dropdown-email";
  ddEmail.id = "dropdown-user-email";

  const ddPlan = document.createElement("span");
  ddPlan.className = "user-plan-badge";
  ddPlan.id = "dropdown-plan-badge";

  profileInfo.appendChild(ddName);
  profileInfo.appendChild(ddEmail);
  profileInfo.appendChild(ddPlan);
  header.appendChild(avatarWrap);
  header.appendChild(profileInfo);
  dropdown.appendChild(header);

  // Menu items
  const items = document.createElement("div");
  items.className = "profile-dropdown-items";

  const dashboardLink = document.createElement("a");
  dashboardLink.href = "/dashboard.html";
  dashboardLink.className = "neo-dropdown-item auth-only";
  dashboardLink.innerHTML = `${SVG_HOME}<span>Dashboard</span>`;
  items.appendChild(dashboardLink);

  const subscriptionLink = document.createElement("button");
  subscriptionLink.type = "button";
  subscriptionLink.className = "neo-dropdown-item auth-only";
  subscriptionLink.innerHTML = `${SVG_STAR}<span>Subscription</span>`;
  subscriptionLink.addEventListener("click", (e) => {
    e.preventDefault();
    menuDiv.classList.remove("open");
    window.PaymentPortal?.open("premium");
  });
  items.appendChild(subscriptionLink);

  const loginBtn = document.createElement("button");
  loginBtn.type = "button";
  loginBtn.className = "neo-dropdown-item guest-only";
  loginBtn.innerHTML = `${SVG_LOGIN_ICON}<span>Sign In</span>`;
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    menuDiv.classList.remove("open");
    window.openAuthModal?.("login");
  });
  items.appendChild(loginBtn);

  dropdown.appendChild(items);

  // Footer (sign out)
  const footer = document.createElement("div");
  footer.className = "profile-dropdown-footer auth-only";

  const logoutBtn = document.createElement("button");
  logoutBtn.className = "neo-dropdown-item neo-dropdown-item--danger";
  logoutBtn.type = "button";
  logoutBtn.innerHTML = `${SVG_LOGOUT}<span>Sign Out</span>`;
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    menuDiv.classList.remove("open");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  });
  footer.appendChild(logoutBtn);
  dropdown.appendChild(footer);

  menuDiv.appendChild(dropdown);

  // Photo upload click
  avatarWrap.addEventListener("click", (e) => {
    e.stopPropagation();
    if (auth.currentUser) photoInput.click();
  });

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && auth.currentUser) handlePhotoUpload(file, auth.currentUser);
    e.target.value = "";
  });

  // Toggle dropdown on trigger click
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

  if (subListener) {
    subListener();
    subListener = null;
  }

  if (user) {
    if (userMenu) userMenu.classList.remove("is-guest");

    const displayName = user.displayName || user.email.split("@")[0];
    if (nameSpan) nameSpan.textContent = displayName;

    const photoURL = user.photoURL;
    if (photoURL) {
      setAvatarPhoto(photoURL);
    } else {
      if (avatar) avatar.innerHTML = SVG_PERSON;
      const avatarLg = document.getElementById("dropdown-avatar-lg");
      if (avatarLg) avatarLg.innerHTML = SVG_PERSON;
    }

    const ddName = document.getElementById("dropdown-user-name");
    if (ddName) ddName.textContent = displayName;
    const ddEmail = document.getElementById("dropdown-user-email");
    if (ddEmail) ddEmail.textContent = user.email;

    subListener = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const d = snap.exists() ? snap.data() : {};
      const isPremium = Boolean(d.isPremium);
      const planName = d.planName || "";
      planBadge.innerHTML = planEmblem(isPremium, planName);
      const tier = !isPremium ? "plan-free" : (planName.toLowerCase().includes("monthly") ? "plan-premium" : "plan-pro");
      planBadge.className = "user-plan-badge " + tier;

      const ddPlan = document.getElementById("dropdown-plan-badge");
      if (ddPlan) {
        ddPlan.innerHTML = planEmblem(isPremium, planName);
        ddPlan.className = "user-plan-badge " + tier;
      }

      if (d.photoURL && d.photoURL !== user.photoURL) {
        setAvatarPhoto(d.photoURL);
      }
    });
  } else {
    if (userMenu) userMenu.classList.add("is-guest");

    if (avatar) avatar.innerHTML = SVG_PERSON;
    const avatarLg = document.getElementById("dropdown-avatar-lg");
    if (avatarLg) avatarLg.innerHTML = SVG_PERSON;
    if (nameSpan) nameSpan.textContent = "Guest";
    const ddName = document.getElementById("dropdown-user-name");
    if (ddName) ddName.textContent = "Guest";
    const ddEmail = document.getElementById("dropdown-user-email");
    if (ddEmail) ddEmail.textContent = "";
    if (planBadge) {
      planBadge.innerHTML = SVG_ROSE;
      planBadge.className = "user-plan-badge plan-free";
    }
    const ddPlan = document.getElementById("dropdown-plan-badge");
    if (ddPlan) { ddPlan.innerHTML = ""; ddPlan.className = "user-plan-badge"; }
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
