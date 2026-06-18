import NAV_CONFIG from "/utils/components/nav-config.js";
import {
  NAV_ICONS,
  paintLayer,
  paintBlob,
  planEmblem,
  SVG_ROSE,
  SVG_PERSON,
  SVG_CAMERA,
  SVG_SUN,
  SVG_MOON,
} from "/utils/components/nav-icons.js";
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

/* =============================================
   THEME TOGGLE
   ---------------------------------------------
   A single global light/dark switch. The chosen theme is stored in
   localStorage (`pp-theme`) and applied to <html data-theme>. loader.js
   restores it before first paint; this keeps every mounted nav's button
   icon in sync. The button shows the *target* state (moon → go dark,
   sun → go light).
============================================= */
const THEME_KEY = "pp-theme";

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function themeToggleIcon(theme) {
  return theme === "dark" ? SVG_SUN : SVG_MOON;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {}
  document.querySelectorAll(".nav-theme-toggle").forEach((btn) => {
    btn.innerHTML = themeToggleIcon(theme);
    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  });
}

function buildThemeToggle() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-theme-toggle";
  const theme = currentTheme();
  btn.innerHTML = themeToggleIcon(theme);
  btn.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
  );
  btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  });
  return btn;
}

// The single designated admin — controls visibility of `adminOnly` nav items.
const ADMIN_EMAIL = "eemadanyel@gmail.com";

/* =============================================
   GSAP (loaded from CDN, progressive enhancement)
   ---------------------------------------------
   Pulled from a full URL so the ~15 pages that include this nav don't need
   GSAP in their import map. If the load fails (offline/blocked) or the user
   prefers reduced motion, the nav still works — CSS owns the entrance instead.
   The `gsap-anim` class on the bar tells nav.css to step aside for GSAP.
============================================= */
let gsap = null;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const isDesktop = () => window.matchMedia("(min-width: 769px)").matches;

if (!prefersReducedMotion) {
  import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
    .then((m) => {
      gsap = m.gsap || m.default || null;
      if (gsap) {
        document
          .querySelectorAll('.site-nav[data-nav="main"]')
          .forEach((nav) => nav.classList.add("gsap-anim"));
      }
    })
    .catch(() => {
      gsap = null;
    });
}

// Rotating accent palette applied to each top-level section (mirrors the
// `theme-*` tokens in nav.css that drive the sticker tiles + soft tints).
const SECTION_THEMES = ["theme-yellow", "theme-blue", "theme-green", "theme-red"];

/* Staggered entrance for a freshly-opened mega panel (desktop only). */
function playOpenAnimation(li) {
  if (!gsap || prefersReducedMotion || !isDesktop()) return;

  const panel = li.querySelector(".mega-panel");
  if (!panel) return;

  const branches = panel.querySelectorAll(".mega-branch");
  const image = panel.querySelector(".mega-image");
  const paint = panel.querySelector(".mega-panel__paint");
  gsap.killTweensOf([...branches, image, paint].filter(Boolean));

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Paint drifts/scales in — opacity is left to CSS so it stays a faint wash.
  if (paint) {
    tl.fromTo(
      paint,
      { scale: 0.9, rotate: -3 },
      {
        scale: 1,
        rotate: 0,
        duration: 0.6,
        ease: "power2.out",
        transformOrigin: "50% 50%",
        clearProps: "transform",
      },
      0,
    );
  }

  tl.fromTo(
    branches,
    { y: 16, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.34,
      stagger: 0.08,
      ease: "back.out(1.5)",
      clearProps: "transform,opacity,visibility",
    },
    0.04,
  ).fromTo(
    panel.querySelectorAll(".nav-leaf"),
    { x: -8, autoAlpha: 0 },
    {
      x: 0,
      autoAlpha: 1,
      duration: 0.24,
      stagger: 0.025,
      ease: "power3.out",
      clearProps: "transform,opacity,visibility",
    },
    "-=0.18",
  );

  if (image) {
    tl.fromTo(
      image,
      { scale: 0.92, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.42,
        ease: "back.out(1.4)",
        clearProps: "transform,opacity,visibility",
      },
      "<",
    );
  }
}

/* =============================================
   ICON RENDERER
   ---------------------------------------------
   A sticker tile = an organic blob (filled with the accent) behind the glyph.
   Each blob gets its own seed so neighbouring tiles never share a silhouette.
============================================= */
let blobSeed = 0;
function renderIcon(icon, seed) {
  if (!icon) return null;

  const s = seed ?? ++blobSeed;
  const glyph = icon.trim().startsWith("<svg")
    ? icon
    : `<img src="${icon}" alt="">`;

  const wrapper = document.createElement("span");
  wrapper.className = "nav-icon";
  wrapper.innerHTML = `<span class="nav-icon__glyph">${glyph}</span>`;
  return wrapper;
}

/* Plan emblem wrapped on the shared blob tile (markup form, for innerHTML). */
function wrapEmblem(emblem) {
  return `<span class="nav-icon"><span class="nav-icon__glyph">${emblem}</span></span>`;
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
   LEAF (a clickable sublink)
============================================= */
function buildLeaf(item) {
  const link = document.createElement("a");
  link.href = item.href || "#";
  link.className = "nav-leaf";
  link.setAttribute("data-nav-href", item.href || "#");

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

  return link;
}

/* =============================================
   BRANCHES (columns of sub-groups → sublinks)
   ---------------------------------------------
   Each second-level group becomes its own column: a header (sticker icon +
   title + sublink count) over the list of sublinks, all visible at once. The
   columns flow in a responsive grid. Hovering a column (desktop) drives the
   right-hand preview stage.
============================================= */
function buildBranches(groups, hooks = {}) {
  const wrap = document.createElement("div");
  wrap.className = "mega-branches";

  groups.forEach((group, i) => {
    const hasKids = group.children && group.children.length > 0;

    const branch = document.createElement("div");
    branch.className = "mega-branch";
    branch.classList.add(SECTION_THEMES[i % SECTION_THEMES.length]);

    // ── Column header (a link if it's a direct group, else a static label) ──
    const head = document.createElement(hasKids ? "div" : "a");
    head.className = "mega-branch__head";
    if (!hasKids) {
      head.href = group.href || "#";
      head.setAttribute("data-nav-href", group.href || "#");
    }

    const icon = renderIcon(group.icon);
    if (icon) head.appendChild(icon);

    const txt = document.createElement("span");
    txt.className = "mega-branch__text";
    txt.innerHTML =
      `<span class="mega-branch__title">${group.text}</span>` +
      (group.description
        ? `<span class="mega-branch__desc">${group.description}</span>`
        : "");
    head.appendChild(txt);

    if (hasKids) {
      const count = document.createElement("span");
      count.className = "mega-branch__count";
      count.textContent = group.children.length;
      head.appendChild(count);
    }
    branch.appendChild(head);

    // ── Sublinks (always visible within the column) ───────
    if (hasKids) {
      const body = document.createElement("div");
      body.className = "mega-branch__body";
      group.children.forEach((leaf) => body.appendChild(buildLeaf(leaf)));
      branch.appendChild(body);
    }

    // Hovering the column drives the right-hand preview (desktop only).
    branch.addEventListener("mouseenter", () => {
      if (isDesktop()) hooks.onPreview?.(group, i);
    });

    wrap.appendChild(branch);
  });

  // Leaving the columns crossfades the stage back to the section scene.
  wrap.addEventListener("mouseleave", () => hooks.onPreviewEnd?.());

  return wrap;
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
    link.closest(".mega-branch")?.classList.remove("active");
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
  bestMatch.closest(".nav-links > li")?.classList.add("active");
  bestMatch.closest(".mega-branch")?.classList.add("active");
}

/* =============================================
   MEGA MENU BUILDER
============================================= */
function buildMegaMenu() {
  const ul = document.createElement("ul");
  ul.className = "nav-links";

  NAV_CONFIG.forEach((item, index) => {
    const li = document.createElement("li");
    const hasChildren = item.children && item.children.length > 0;

    // Give each section its own accent (sticker tile + soft tints).
    li.classList.add(SECTION_THEMES[index % SECTION_THEMES.length]);

    // Admin-only entries are hidden until the designated admin signs in
    // (revealed by the `is-admin` class toggled in updateAuthUI).
    if (item.adminOnly) li.classList.add("admin-only");

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
          li.querySelector(".mega-image")?.classList.remove("is-previewing");
          playOpenAnimation(li);
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

      // Faint paint-print wash, tinted by the section accent (seeded per section).
      panel.insertAdjacentHTML("afterbegin", paintLayer(index * 5 + 2));

      const inner = document.createElement("div");
      inner.className = "mega-panel-content";

      const tree = document.createElement("div");
      tree.className = "mega-tree";

      // Small editorial intro above the branches.
      const intro = document.createElement("div");
      intro.className = "mega-panel__intro";
      intro.innerHTML =
        `<span class="mega-panel__eyebrow">${item.text}</span>` +
        (item.description
          ? `<span class="mega-panel__tag">${item.description}</span>`
          : "");
      tree.appendChild(intro);

      // ── Right-hand preview stage: a blob "paint" background showing the
      //    section scene by default, crossfading to a hovered branch's icon ──
      let stage = null;
      let preview = null;
      if (item.image) {
        stage = document.createElement("div");
        stage.className = "mega-image";
        stage.insertAdjacentHTML("afterbegin", paintBlob(index * 5 + 6));

        const scene = document.createElement("div");
        scene.className = "mega-image__scene";
        if (item.image.trim().startsWith("<svg")) {
          scene.innerHTML = item.image;
        } else {
          const img = document.createElement("img");
          img.src = item.image;
          img.alt = item.text;
          scene.appendChild(img);
        }
        stage.appendChild(scene);

        preview = document.createElement("div");
        preview.className = "mega-image__preview";
        stage.appendChild(preview);
      }

      const showPreview = (group, i) => {
        if (!stage || !preview || !isDesktop() || !group.icon) return;
        preview.className =
          "mega-image__preview " + SECTION_THEMES[i % SECTION_THEMES.length];
        preview.innerHTML = `<span class="mega-image__glyph">${group.icon}</span>`;
        stage.classList.add("is-previewing");
      };
      const endPreview = () => stage?.classList.remove("is-previewing");

      tree.appendChild(
        buildBranches(item.children, {
          onPreview: showPreview,
          onPreviewEnd: endPreview,
        }),
      );
      inner.appendChild(tree);
      if (stage) inner.appendChild(stage);

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

  // Builds a menu row's contents: a blob icon (same as the nav) + a label.
  const fillItem = (el, iconKey, label) => {
    const ic = renderIcon(NAV_ICONS[iconKey]);
    if (ic) el.appendChild(ic);
    const span = document.createElement("span");
    span.textContent = label;
    el.appendChild(span);
  };

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
  planBadge.innerHTML = wrapEmblem(SVG_ROSE);

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
  dashboardLink.className = "neo-dropdown-item nd-blue auth-only";
  fillItem(dashboardLink, "home", "Dashboard");
  items.appendChild(dashboardLink);

  const subscriptionLink = document.createElement("a");
  subscriptionLink.href = "/subscribe.html";
  subscriptionLink.className = "neo-dropdown-item nd-gold auth-only";
  fillItem(subscriptionLink, "star", "Subscription");
  items.appendChild(subscriptionLink);

  const loginBtn = document.createElement("button");
  loginBtn.type = "button";
  loginBtn.className = "neo-dropdown-item nd-green guest-only";
  fillItem(loginBtn, "signin", "Sign In");
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
  fillItem(logoutBtn, "signout", "Sign Out");
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
  rightWrap.appendChild(buildThemeToggle());
  rightWrap.appendChild(buildUserMenu());

  const toggle = document.createElement("button");
  toggle.className = "nav-toggle";
  toggle.id = "nav-toggle";

  for (let i = 0; i < 3; i++) {
    toggle.appendChild(document.createElement("span"));
  }

  rightWrap.appendChild(toggle);
  siteNav.appendChild(rightWrap);

  // If GSAP already loaded, let it own the entrance on this instance too.
  if (gsap) siteNav.classList.add("gsap-anim");

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

  // Reveal/hide admin-only nav entries based on the signed-in account.
  const isAdmin = Boolean(user && user.email === ADMIN_EMAIL);
  document
    .querySelectorAll('.site-nav[data-nav="main"]')
    .forEach((nav) => nav.classList.toggle("is-admin", isAdmin));

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
      planBadge.innerHTML = wrapEmblem(planEmblem(isPremium, planName));
      const tier = !isPremium ? "plan-free" : (planName.toLowerCase().includes("monthly") ? "plan-premium" : "plan-pro");
      planBadge.className = "user-plan-badge " + tier;

      const ddPlan = document.getElementById("dropdown-plan-badge");
      if (ddPlan) {
        ddPlan.innerHTML = wrapEmblem(planEmblem(isPremium, planName));
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
      planBadge.innerHTML = wrapEmblem(SVG_ROSE);
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

  // Restore the saved theme if loader.js didn't already (pages without it).
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && document.documentElement.dataset.theme !== saved) {
      document.documentElement.dataset.theme = saved;
    }
  } catch (e) {}

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
