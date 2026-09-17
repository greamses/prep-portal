// blog.js - Central dynamic blog viewer engine
import { auth, db } from "/firebase-init.js";
import { getList, getProfile } from "/utils/data-service.js";
import { getSubjectData, resolveSubjectKey } from "/blogs/js/data.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

// The single designated admin (matches firestore.rules + nav-builder.js).
const ADMIN_EMAIL = "eemadanyel@gmail.com";

// ─── ASSET LOADING WITH PATH DETECTION ─────────────────────
function getBasePath() {
  const scripts = document.getElementsByTagName("script");
  for (const script of scripts) {
    if (script.src && script.src.includes("blog.js")) {
      const url = new URL(script.src);
      const path = url.pathname.substring(0, url.pathname.lastIndexOf("/"));
      return path || ".";
    }
  }
  return ".";
}

const BASE_PATH = getBasePath();

function ensureLessonNoteStyles() {
  if (document.querySelector('link[href*="render.css"]')) return true;

  const paths = [
    `${BASE_PATH}/render.css`,
    `./render.css`,
    `../render.css`,
    `/render.css`,
    `${BASE_PATH}/css/render.css`,
  ];

  for (const path of paths) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = path;
    link.onerror = () => console.warn(`Failed to load: ${path}`);
    link.onload = () => {
      document.head.appendChild(link);
      return true;
    };
    document.head.appendChild(link);
    if (link.sheet) return true;
  }
  return false;
}

function ensureThemeStyles() {
  if (document.querySelector('link[href*="theme.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `/utils/theme/theme.css`;
  link.onerror = () => console.warn("Failed to load theme.css");
  document.head.appendChild(link);
}

function ensureThemeScript() {
  if (document.querySelector('script[src*="theme.js"]')) return;
  const script = document.createElement("script");
  script.src = `/utils/theme/theme.js`;
  script.async = true;
  script.defer = true;
  script.onerror = () => console.warn("Failed to load theme.js");
  document.head.appendChild(script);
}

function ensureLessonAssets() {
  ensureLessonNoteStyles();
  ensureThemeStyles();
  ensureThemeScript();
}

// ─── RUNTIME CONFIGURATION (LOADED DYNAMICALLY) ─────────────
let COLLECTION_NAME;
let SUBJECT_NAME;
let SUBJECT_KEY;
let SUBJECT_LABELS;
let SUBJECT_STYLES;
let CLASS_LABELS;
let CLASS_STYLES;

let allPosts = [];
let currentSubject = "all";
let currentClass = "all";
let currentSearch = "";
let currentUser = null;
let isAdmin = false;
let activePost = null;
let groqApiKeyPublic = null;
let geminiApiKeyPublic = null;

// DOM Element references mapped globally
let scienceGrid,
  singlePostView,
  singlePostContent,
  closePostBtn,
  searchInput,
  scrollTopBtn,
  toastEl,
  embedOverlay,
  embedFrame,
  embedFrameWrap,
  embedTitle,
  embedOpenLink,
  embedCloseBtn,
  embedSpinner;

function assignDomElements() {
  scienceGrid = document.getElementById("scienceGrid");
  singlePostView = document.getElementById("singlePostView");
  singlePostContent = document.getElementById("singlePostContent");
  closePostBtn = document.getElementById("closePostBtn");
  searchInput = document.getElementById("searchInput");
  scrollTopBtn = document.getElementById("scrollTop");
  toastEl = document.getElementById("toast");
  embedOverlay = document.getElementById("embedOverlay");
  embedFrame = document.getElementById("embedFrame");
  embedFrameWrap = document.getElementById("embedFrameWrap");
  embedTitle = document.getElementById("embedTitle");
  embedOpenLink = document.getElementById("embedOpenLink");
  embedCloseBtn = document.getElementById("embedCloseBtn");
  embedSpinner = document.getElementById("embedSpinner");
}

async function initBlog() {
  assignDomElements();
  ensureLessonAssets();

  // Extract key parameter from active browser URI
  const params = new URLSearchParams(window.location.search);
  const subjectKey = params.get("s") || params.get("subject") || "plants";

  // All subject data now lives in one place: /blogs/js/data.js
  const subjectData = getSubjectData(subjectKey);
  SUBJECT_KEY = resolveSubjectKey(subjectKey);

  // Bind parameters globally
  COLLECTION_NAME =
    subjectData.SUBJECT_CONFIG?.collectionName || "science-posts";
  SUBJECT_NAME = subjectData.SUBJECT_CONFIG?.name || "Science";
  SUBJECT_LABELS = subjectData.SUBJECT_LABELS || {};
  SUBJECT_STYLES = subjectData.SUBJECT_STYLES || {};
  CLASS_LABELS = subjectData.CLASS_LABELS || {
    primary: (n) => `P${n}`,
    jss: (n) => `JSS ${n}`,
    ss: (n) => `SS ${n}`,
  };
  CLASS_STYLES = subjectData.CLASS_STYLES || {
    primary: "cls-primary",
    jss: "cls-jss",
    ss: "cls-ss",
  };

  // Modify titles & heroes
  document.title = `${SUBJECT_NAME} | Prep Portal 2026`;
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle) heroTitle.innerHTML = `${SUBJECT_NAME}.`;

  const heroTagline = document.querySelector(".hero-tagline");
  if (heroTagline && subjectData.SUBJECT_CONFIG?.description) {
    heroTagline.textContent = subjectData.SUBJECT_CONFIG.description;
  }

  const tickerTrack = document.querySelector(".ticker-track");
  if (tickerTrack && subjectData.SUBJECT_CONFIG?.tickerItems) {
    tickerTrack.innerHTML = subjectData.SUBJECT_CONFIG.tickerItems
      .map(
        (item) =>
          `<span class="ticker-item">${item}</span><span class="ticker-item">✧</span>`,
      )
      .join("");
  }

  // Populate Dropdowns
  const subjectMenu = document.getElementById("subjectDropdownMenu");
  const classMenu = document.getElementById("classDropdownMenu");
  if (subjectMenu) subjectMenu.innerHTML = buildSubjectDropdownItems();
  if (classMenu) classMenu.innerHTML = buildClassDropdownItems();

  wireDropdown(
    "subjectDropdown",
    "subjectDropdownBtn",
    "subjectFilterText",
    (f) => {
      currentSubject = f;
      renderPosts();
    },
  );
  wireDropdown("classDropdown", "classDropdownBtn", "classFilterText", (f) => {
    currentClass = f;
    renderPosts();
  });

  // Attach search bar listener
  let st;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(st);
    st = setTimeout(() => {
      currentSearch = e.target.value;
      renderPosts();
    }, 280);
  });

  // Connect close modal events
  closePostBtn.addEventListener("click", closePostView);

  // Begin fetching data (served from the local cache when fresh — see loadPosts).
  await loadPosts();

  // Refresh when the learner returns to the tab, NOT on a timer. loadPosts()
  // respects the cache TTL, so this costs zero reads if the cache is still fresh
  // and only re-fetches once it has actually gone stale. This replaces the old
  // 60-second poll that re-read the entire collection every minute, forever.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") loadPosts();
  });
}

document.addEventListener("DOMContentLoaded", initBlog);

onAuthStateChanged(auth, async (u) => {
  currentUser = u;
  isAdmin = !!(u && u.email === ADMIN_EMAIL);
  if (u) {
    try {
      // Shared cached profile — reuses nav-builder's read instead of its own.
      const d = await getProfile(u.uid);
      if (d) {
        if (d.role === "admin") isAdmin = true;
        groqApiKeyPublic = d.groqKey || d.groqApiKey || null;
        geminiApiKeyPublic = d.geminiKey || d.geminiApiKey || d.apiKey || null;
      }
    } catch (_) {}
  }
  // If a post is open, re-render comments so delete controls reflect auth.
  if (activePost) loadComments(activePost.id);
});

// ─── MARKDOWN → HTML ──────────────────────────────────────
function markdownToHtml(text) {
  if (!text) return text;
  const tagCount = (
    text.match(/<(h[1-6]|p|ul|ol|li|blockquote|table|pre|div)\b/gi) || []
  ).length;
  if (tagCount >= 6) return text;

  let html = text;
  html = html.replace(/```[\w]*\n?/g, "").replace(/```/g, "");
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^[-*_]{3,}\s*$/gm, "<hr>");
  html = html.replace(/\*\*\*(.+?)\*\*\*/gs, "<strong><em>$1</em></strong>");
  html = html.replace(/___(.+?)___/gs, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/gs, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/gs, "<em>$1</em>");
  html = html.replace(/_(.+?)_/gs, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^[-*+]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[^]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<oli>$1</oli>");
  html = html.replace(
    /(<oli>[^]*?<\/oli>\n?)+/g,
    (m) =>
      "<ol>" +
      m.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>") +
      "</ol>",
  );
  html = html.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>");

  const BLOCK = /^<(h[1-6]|p|ul|ol|blockquote|hr|table|pre|div|figure)/i;
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (BLOCK.test(block)) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}

// ─── UTILS ────────────────────────────────────────────────
const showToast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2800);
};

const escHtml = (s) => {
  if (!s) return "";
  return s.replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );
};

const stripHtml = (h) => {
  const d = document.createElement("div");
  d.innerHTML = h;
  return d.textContent || d.innerText || "";
};

const formatDate = (ts) => {
  if (!ts) return "Just now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const calcReadTime = (c) => {
  if (!c) return 1;
  return Math.max(
    1,
    Math.ceil(
      c
        .replace(/<[^>]*>/g, " ")
        .trim()
        .split(/\s+/).length / 200,
    ),
  );
};

const getSubjectLabel = (subject) => SUBJECT_LABELS[subject] || subject;
const getSubjectStyle = (subject) => SUBJECT_STYLES[subject] || "sci-default";
const CLASS_THEME = { "cls-primary": "theme-yellow", "cls-jss": "theme-blue", "cls-ss": "theme-green" };
const getClassLabel = (classLevel) => {
  if (!classLevel) return "--";
  const [type, num] = classLevel.split("-");
  if (CLASS_LABELS[type]) return CLASS_LABELS[type](num);
  return classLevel;
};
const getClassShort = (classLevel) => {
  if (!classLevel) return "--";
  const [type, num] = classLevel.split("-");
  if (type === "primary") return `P${num}`;
  if (type === "jss") return `JSS ${num}`;
  if (type === "ss") return `SS ${num}`;
  return classLevel;
};
const getClassStyle = (classLevel) => {
  if (!classLevel) return CLASS_STYLES.primary;
  if (classLevel.startsWith("primary")) return CLASS_STYLES.primary;
  if (classLevel.startsWith("jss")) return CLASS_STYLES.jss;
  return CLASS_STYLES.ss;
};

function getYouTubeThumbnail(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  );
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {
    return url;
  }
}

function getEmbedUrl(url, type) {
  if (!url) return "";
  if (url.includes("<iframe")) {
    const srcMatch = url.match(/src=["']([^"']+)["']/);
    url = srcMatch ? srcMatch[1] : url;
  }
  if (
    type === "video" ||
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  ) {
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/,
    );
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
  }
  return url;
}

const I = {
  calendar: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="meta-icon"><rect x="3" y="4.4" width="18" height="16.6" rx="2.4" fill="var(--accent-secondary)"/><path d="M3 6.8a2.4 2.4 0 0 1 2.4-2.4h13.2A2.4 2.4 0 0 1 21 6.8v3H3z" fill="var(--accent-danger)"/><rect x="7" y="2.2" width="2.4" height="4.6" rx="1.2" fill="var(--accent-primary)"/><rect x="14.6" y="2.2" width="2.4" height="4.6" rx="1.2" fill="var(--accent-primary)"/><rect x="6.4" y="12.4" width="3.2" height="3" rx="0.6" fill="#fff"/><rect x="10.4" y="12.4" width="3.2" height="3" rx="0.6" fill="#fff"/><rect x="14.4" y="12.4" width="3.2" height="3" rx="0.6" fill="#fff"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="meta-icon"><circle cx="12" cy="12" r="9.5" fill="var(--accent-warning)"/><circle cx="12" cy="12" r="6.8" fill="#fff"/><path d="M12 7.5v4.8l3.4 2" fill="none" stroke="var(--accent-warning)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="meta-icon"><path d="M1.8 12S5.6 4.8 12 4.8 22.2 12 22.2 12 18.4 19.2 12 19.2 1.8 12 1.8 12z" fill="var(--accent-secondary)"/><circle cx="12" cy="12" r="4.4" fill="#fff"/><circle cx="12" cy="12" r="2.3" fill="var(--accent-danger)"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="meta-icon"><rect x="5.4" y="1.8" width="2" height="4" rx="1" fill="var(--text-tertiary)"/><rect x="5.4" y="18.2" width="2" height="4" rx="1" fill="var(--text-tertiary)"/><rect x="11" y="1.8" width="2" height="4" rx="1" fill="var(--text-tertiary)"/><rect x="11" y="18.2" width="2" height="4" rx="1" fill="var(--text-tertiary)"/><rect x="16.6" y="1.8" width="2" height="4" rx="1" fill="var(--text-tertiary)"/><rect x="16.6" y="18.2" width="2" height="4" rx="1" fill="var(--text-tertiary)"/><rect x="1.8" y="5.4" width="4" height="2" rx="1" fill="var(--text-tertiary)"/><rect x="18.2" y="5.4" width="4" height="2" rx="1" fill="var(--text-tertiary)"/><rect x="1.8" y="11" width="4" height="2" rx="1" fill="var(--text-tertiary)"/><rect x="18.2" y="11" width="4" height="2" rx="1" fill="var(--text-tertiary)"/><rect x="1.8" y="16.6" width="4" height="2" rx="1" fill="var(--text-tertiary)"/><rect x="18.2" y="16.6" width="4" height="2" rx="1" fill="var(--text-tertiary)"/><rect x="4.6" y="4.6" width="14.8" height="14.8" rx="2.4" fill="var(--accent-secondary)"/><rect x="8.6" y="8.6" width="6.8" height="6.8" rx="1.2" fill="var(--accent-primary)"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:12px;height:12px;flex-shrink:0"><path d="M12 20.6 3.9 12.8a5.1 5.1 0 0 1 7.2-7.2l.9.9.9-.9a5.1 5.1 0 0 1 7.2 7.2z" fill="var(--text-tertiary)"/><path d="M12 17.8 5.7 11.6a2.6 2.6 0 0 1 3.7-3.7l2.6 2.6 2.6-2.6a2.6 2.6 0 0 1 3.7 3.7z" fill="#fff"/></svg>`,
  heartFill: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:12px;height:12px;flex-shrink:0"><path d="M12 20.6 3.9 12.8a5.1 5.1 0 0 1 7.2-7.2l.9.9.9-.9a5.1 5.1 0 0 1 7.2 7.2z" fill="var(--accent-danger)"/><circle cx="8.2" cy="9.2" r="1.6" fill="#fff"/></svg>`,
  share: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0"><rect x="10.8" y="7" width="2.4" height="10" rx="1.2" fill="var(--accent-secondary)"/><path d="M6 8.6h12L12 2.2z" fill="var(--accent-danger)"/><path d="M3.4 14.4h2.8v4.2h11.6v-4.2h2.8v5.4a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z" fill="var(--accent-primary)"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:18px;height:18px;flex-shrink:0"><path d="M3.4 5.6a2 2 0 0 1 2-2h13.2a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2h-8l-4.8 4v-4h-.4a2 2 0 0 1-2-2z" fill="var(--accent-secondary)"/><rect x="6.2" y="7.2" width="11.6" height="1.8" rx="0.9" fill="#fff"/><rect x="6.2" y="10.6" width="7.2" height="1.8" rx="0.9" fill="#fff"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>`,
  reply: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:11px;height:11px;flex-shrink:0"><path d="M9.6 4.4v4.4h4.2a7.4 7.4 0 0 1 7.4 7.4v3.4h-2.8v-3.4a4.6 4.6 0 0 0-4.6-4.6H9.6v4.4L2.6 10.2z" fill="var(--accent-secondary)"/></svg>`,
  link: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0"><path d="M11.4 7.4 13.2 5.6a3.9 3.9 0 0 1 5.5 5.5l-1.8 1.8-2-2 1.8-1.8a1.1 1.1 0 0 0-1.5-1.5l-1.8 1.8z" fill="var(--accent-secondary)"/><path d="M12.6 16.6 10.8 18.4a3.9 3.9 0 0 1-5.5-5.5l1.8-1.8 2 2-1.8 1.8a1.1 1.1 0 0 0 1.5 1.5l1.8-1.8z" fill="var(--accent-secondary)"/><rect x="8.32" y="10.70" width="7.35" height="2.6" rx="1.3" fill="var(--accent-danger)" transform="rotate(-45.00 12.00 12.00)"/></svg>`,
  video: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0"><rect x="2.2" y="4.6" width="19.6" height="14.8" rx="2.4" fill="var(--accent-secondary)"/><path d="M9.6 8.4v7.2l6-3.6z" fill="#fff"/></svg>`,
  practice: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0"><rect x="2.4" y="3.4" width="19.2" height="13.4" rx="2" fill="var(--accent-secondary)"/><path d="M10 7v6l5-3z" fill="#fff"/><rect x="10.8" y="16.8" width="2.4" height="2.8" rx="0" fill="var(--text-tertiary)"/><rect x="7" y="19.2" width="10" height="2.4" rx="1.2" fill="var(--accent-primary)"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:11px;height:11px;flex-shrink:0"><rect x="8.6" y="2.4" width="6.8" height="2.6" rx="1.3" fill="var(--accent-danger)"/><rect x="3" y="5" width="18" height="3.2" rx="1.6" fill="var(--accent-danger)"/><path d="M5.4 9.4h13.2l-1.1 10.4a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z" fill="var(--accent-secondary)"/><rect x="9.1" y="11.9" width="1.9" height="6.2" rx="0.95" fill="#fff"/><rect x="13" y="11.9" width="1.9" height="6.2" rx="0.95" fill="#fff"/></svg>`,
};

// ─── CARD RENDER ──────────────────────────────────────────
function renderCard(post, idx) {
  const subj = post.subject || Object.keys(SUBJECT_LABELS)[0] || "default";
  const cls = post.classLevel || "ss-1";
  const clsCls = getClassStyle(cls);
  const subjLbl = getSubjectLabel(subj);
  const clsLbl = getClassShort(cls);
  const date = formatDate(post.publishedAt);
  const rt = calcReadTime(post.content);
  const excerpt =
    post.excerpt || stripHtml(post.content || "").substring(0, 110);
  const hasVideo = !!post.videoLink;
  const hasPractice = !!post.practiceLink;
  const videoThumb = getYouTubeThumbnail(post.videoLink);
  const cardImage = post.featuredImage
    ? post.featuredImage
    : videoThumb
      ? videoThumb
      : null;

  const colorIdx = idx % 6;
  const clsTheme = CLASS_THEME[clsCls] || "theme-yellow";
  // A real, crawlable permalink once the post has been exported to a static
  // page (see server/scripts/export-blog-posts.js). The click handler below
  // still preventDefault()s so signed-in users get the instant SPA reader;
  // crawlers and no-JS visitors follow the href to the real page.
  const permalink = post.slug ? `/blogs/${SUBJECT_KEY}/${post.slug}/` : null;
  const tag = permalink ? "a" : "div";
  const hrefAttr = permalink ? ` href="${escHtml(permalink)}"` : "";

  return `
    <${tag} class="science-card pp-receipt science-card--p${colorIdx}" data-post-id="${post.id}"${hrefAttr}>
      <div class="card-inner pp-receipt__paper">
        ${cardImage ? `<img class="card-featured-img" src="${escHtml(cardImage)}" alt="${escHtml(post.title)}" loading="lazy">` : ""}
        <div class="card-badges">
          <span class="pp-sticky pp-sticky--c${colorIdx}">${subjLbl}</span>
          <span class="pp-pill pp-pill--static ${clsTheme}">${clsLbl}</span>
        </div>
        <div class="card-meta">
          <span>${I.calendar} ${date}</span>
          <span>${I.clock} ${rt} min</span>
        </div>
        <h2 class="card-title">${escHtml(post.title)}</h2>
        <div class="card-resource-row">
          <span class="pp-pill pp-pill--static${hasVideo ? " theme-red" : ""}">${I.video}<span>Video</span></span>
          <span class="pp-pill pp-pill--static${hasPractice ? " theme-blue" : ""}">${I.practice}<span>Practice</span></span>
        </div>
        <p class="card-excerpt">${escHtml(excerpt)}...</p>
        <div class="read-more">Open topic ${I.arrow}</div>
      </div>
    </${tag}>`;
}

function filterPosts() {
  let f = [...allPosts];
  if (currentSubject !== "all")
    f = f.filter((p) => p.subject === currentSubject);
  if (currentClass !== "all")
    f = f.filter((p) => p.classLevel === currentClass);
  if (currentSearch) {
    const s = currentSearch.toLowerCase();
    f = f.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        stripHtml(p.content || "")
          .toLowerCase()
          .includes(s),
    );
  }
  return f;
}

function renderPosts() {
  const f = filterPosts();
  if (!f.length) {
    scienceGrid.innerHTML =
      '<div class="no-posts">No posts found for this filter.</div>';
    return;
  }
  scienceGrid.innerHTML = f.map(renderCard).join("");
  scienceGrid.querySelectorAll(".science-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const post = allPosts.find((p) => p.id === card.dataset.postId);
      if (post) showSinglePost(post);
    });
  });

  // Offer the full archive on demand — only when the cheap feed page was capped
  // and we aren't already showing everything (and no filter is narrowing it).
  const existing = scienceGrid.parentElement?.querySelector(".load-all-btn");
  if (existing) existing.remove();
  if (feedCapped && !feedShowingAll && !currentSearch) {
    const more = document.createElement("button");
    more.className = "load-all-btn";
    more.type = "button";
    more.textContent = "Show all posts";
    more.addEventListener("click", () => {
      more.disabled = true;
      more.textContent = "Loading…";
      loadPosts({ full: true });
    });
    scienceGrid.insertAdjacentElement("afterend", more);
  }
}

// ─── DYNAMIC FILTER DROPDOWNS ─────────────────────────────
function buildSubjectDropdownItems() {
  let html =
    '<div class="pp-select-item active" data-filter="all" role="option">All Subjects</div>';
  for (const [key, label] of Object.entries(SUBJECT_LABELS)) {
    html += `<div class="pp-select-item" data-filter="${key}" role="option">${label}</div>`;
  }
  return html;
}

function buildClassDropdownItems() {
  const classLevels = [
    "primary-1",
    "primary-2",
    "primary-3",
    "primary-4",
    "primary-5",
    "primary-6",
    "jss-1",
    "jss-2",
    "jss-3",
    "ss-1",
    "ss-2",
    "ss-3",
  ];
  let html =
    '<div class="pp-select-item active" data-filter="all">All Classes</div>';
  for (const level of classLevels) {
    const label = getClassShort(level);
    html += `<div class="pp-select-item" data-filter="${level}">${label}</div>`;
  }
  return html;
}

function wireDropdown(dropdownId, btnId, textId, onSelect) {
  const dropdown = document.getElementById(dropdownId);
  const btn = document.getElementById(btnId);
  const textEl = document.getElementById(textId);
  if (!dropdown || !btn) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const o = dropdown.classList.toggle("open");
    btn.setAttribute("aria-expanded", o);
  });
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
  dropdown.querySelectorAll(".pp-select-item").forEach((item) => {
    item.addEventListener("click", () => {
      dropdown
        .querySelectorAll(".pp-select-item")
        .forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      textEl.textContent = item.textContent.trim();
      dropdown.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      onSelect(item.dataset.filter);
    });
  });
}

// ─── SINGLE POST VIEW ─────────────────────────────────────
async function incViews(id) {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), { views: increment(1) });
  } catch (_) {}
}

function showSinglePost(post) {
  ensureLessonAssets();

  activePost = post;
  const subj = post.subject || Object.keys(SUBJECT_LABELS)[0] || "default";
  const cls = post.classLevel || "ss-1";
  const sciCls = getSubjectStyle(subj);
  const clsCls = getClassStyle(cls);
  const subjLbl = getSubjectLabel(subj);
  const clsLbl = getClassLabel(cls);
  const date = formatDate(post.publishedAt);
  const rt = calcReadTime(post.content);
  const views = (post.views || 0) + 1;
  const likes = post.likes || [];
  const liked = currentUser && likes.includes(currentUser.uid);
  const videoThumb = getYouTubeThumbnail(post.videoLink);
  const practiceDomain = post.practiceLink
    ? getDomain(post.practiceLink)
    : null;

  const postBody = markdownToHtml(
    post.content || "<p>Content not available.</p>",
  );

  incViews(post.id);
  history.pushState(
    { postId: post.id },
    post.title,
    `${window.location.pathname}${window.location.search}#${post.id}`,
  );
  document.title = `${post.title} | ${SUBJECT_NAME}`;

  singlePostContent.innerHTML = `
    <h1 class="post-title">${escHtml(post.title)}</h1>
    <div class="post-badges">
      <span class="sci-badge ${sciCls}">${subjLbl}</span>
      <span class="cls-badge ${clsCls}">${clsLbl}</span>
    </div>
    <div class="post-meta">
      <span>${I.calendar} ${date}</span>
      <span>${I.clock} ${rt} min read</span>
      <span>${I.eye} ${views} views</span>
      ${post.modelUsed ? `<span>${I.cpu} ${escHtml(post.modelUsed.split(" ").slice(0, 2).join(" "))}</span>` : ""}
    </div>
    <div class="reader-actions">
      <button class="action-btn like-btn${liked ? " liked" : ""}" id="likeBtn">
        ${liked ? I.heartFill : I.heart} <span id="likeCount">${likes.length}</span>
      </button>
      <button class="action-btn share-btn" id="shareBtn">${I.share} Share</button>
      <button class="action-btn" id="copyLinkBtn">${I.link} Copy Link</button>
    </div>

    ${post.featuredImage ? `<img class="post-featured-img" src="${escHtml(post.featuredImage)}" alt="${escHtml(post.title)}" loading="lazy">` : ""}

    ${
      post.videoLink || post.practiceLink
        ? `
    <div class="resource-links-section">
      <div class="resource-links-heading">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M11.4 7.4 13.2 5.6a3.9 3.9 0 0 1 5.5 5.5l-1.8 1.8-2-2 1.8-1.8a1.1 1.1 0 0 0-1.5-1.5l-1.8 1.8z" fill="var(--accent-secondary)"/><path d="M12.6 16.6 10.8 18.4a3.9 3.9 0 0 1-5.5-5.5l1.8-1.8 2 2-1.8 1.8a1.1 1.1 0 0 0 1.5 1.5l1.8-1.8z" fill="var(--accent-secondary)"/><rect x="8.32" y="10.70" width="7.35" height="2.6" rx="1.3" fill="var(--accent-danger)" transform="rotate(-45.00 12.00 12.00)"/></svg>
        Learning Resources
      </div>
      <div class="resource-links-grid">
        ${
          post.videoLink
            ? `
        <div class="resource-card video-resource" role="button" tabindex="0"
          data-embed-url="${escHtml(getEmbedUrl(post.videoLink, "video"))}"
          data-raw-url="${escHtml(post.videoLink)}"
          data-embed-type="video"
          data-embed-title="Video: ${escHtml(post.title)}">
          <div class="video-thumb-area">
            ${
              videoThumb
                ? `<img src="${escHtml(videoThumb)}" alt="Video thumbnail" loading="lazy" onerror="this.parentElement.style.background='#222'">`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#111"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:40px;height:40px;color:#fff"><rect x="2.2" y="4.6" width="19.6" height="14.8" rx="2.4" fill="var(--accent-secondary)"/><path d="M9.6 8.4v7.2l6-3.6z" fill="#fff"/></svg></div>`
            }
            <div class="video-play-overlay">
              <svg viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="25" fill="rgba(0,0,0,0.5)"></circle>
                <polygon points="20,15 20,35 38,25" fill="white"></polygon>
              </svg>
            </div>
          </div>
          <div class="resource-card-footer">
            <span class="resource-type-label">Watch Video</span>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="resource-open-arrow"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>
          </div>
        </div>`
            : ""
        }

        ${
          post.practiceLink
            ? `
        <div class="resource-card practice-resource" role="button" tabindex="0"
          data-embed-url="${escHtml(post.practiceLink)}"
          data-raw-url="${escHtml(post.practiceLink)}"
          data-embed-type="practice"
          data-embed-title="Practice: ${escHtml(practiceDomain)}">
          <div class="practice-thumb-area sci-${subj}-bg">
            <img class="practice-large-icon" 
              style="width:100%;height:100%;object-fit:cover;opacity:0.85;"
              src="https://image.thum.io/get/width/600/crop/600/${escHtml(post.practiceLink)}" 
              alt="${escHtml(practiceDomain)}"
              onerror="this.src='https://www.google.com/s2/favicons?domain=${escHtml(practiceDomain)}&sz=128'; this.onerror=null;">
            <div class="practice-platform-tag">${escHtml(practiceDomain)}</div>
            <div class="video-play-overlay">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:40px;height:40px;color:rgba(255, 255, 255, 0.9)"><rect x="2.4" y="3.4" width="19.2" height="13.4" rx="2" fill="var(--accent-secondary)"/><path d="M10 7v6l5-3z" fill="#fff"/><rect x="10.8" y="16.8" width="2.4" height="2.8" rx="0" fill="var(--text-tertiary)"/><rect x="7" y="19.2" width="10" height="2.4" rx="1.2" fill="var(--accent-primary)"/></svg>
            </div>
          </div>
          <div class="practice-card-body">
            <div class="practice-site-row">
              <span class="practice-site-name">Interactive Activity</span>
            </div>
            <p class="practice-desc">Explore this topic on ${escHtml(practiceDomain)}.</p>
          </div>
          <div class="resource-card-footer">
            <span class="resource-type-label">Open Lab</span>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="resource-open-arrow"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>
          </div>
        </div>`
            : ""
        }
      </div>
    </div>`
        : ""
    }

    <div class="single-post-body">${postBody}</div>

    <section class="comments-section" aria-label="Comments">
      <h3 class="comments-title">${I.chat} Comments (<span id="commentCount">0</span>)</h3>
      <div id="commentsList"></div>
      ${
        currentUser
          ? `<div class="add-comment-form">
            <h4>Leave a comment</h4>
            <textarea class="comment-textarea" id="commentInput" placeholder="Share your thoughts or ask a question..." maxlength="1000"></textarea>
            <button class="comment-submit-btn" id="submitCommentBtn">Post Comment</button>
           </div>`
          : `<p class="login-to-comment">Sign in to leave a comment.</p>`
      }
    </section>`;

  singlePostView.classList.add("active");
  singlePostView.scrollTop = 0;
  document.body.style.overflow = "hidden";

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([singlePostContent]).catch((e) =>
      console.warn("MathJax:", e),
    );
  }

  document
    .getElementById("likeBtn")
    ?.addEventListener("click", () => toggleLike(post));
  singlePostContent.querySelectorAll(".resource-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      const { embedUrl, embedType, embedTitle, rawUrl } = card.dataset;
      openEmbedModal(embedUrl, embedType, embedTitle, rawUrl);
    });
  });

  document
    .getElementById("shareBtn")
    ?.addEventListener("click", () => sharePost(post));
  document
    .getElementById("copyLinkBtn")
    ?.addEventListener("click", copyPostLink);
  document
    .getElementById("submitCommentBtn")
    ?.addEventListener("click", () => submitComment(post.id));
  loadComments(post.id);
}

function closePostView() {
  singlePostView.classList.remove("active");
  document.body.style.overflow = "";
  history.pushState(
    "",
    document.title,
    window.location.pathname + window.location.search,
  );
  document.title = `${SUBJECT_NAME} | Prep Portal 2026`;
  activePost = null;
}

async function openEmbedModal(url, type, title, rawUrl) {
  const targetUrl = rawUrl || url;
  embedOverlay.classList.add("active");
  embedSpinner.style.display = "flex";

  embedFrame.setAttribute(
    "allow",
    "fullscreen; autoplay; encrypted-media; picture-in-picture",
  );
  embedFrame.setAttribute("allowfullscreen", "true");

  embedTitle.textContent = title;
  embedOpenLink.href = targetUrl;
  embedFrame.src = url;
  embedFrameWrap.className =
    "embed-frame-wrap " + (type === "video" ? "video-mode" : "practice-mode");

  embedFrame.onload = () => {
    embedSpinner.style.display = "none";
  };
}

function closeEmbedModal() {
  embedOverlay.classList.remove("active");
  embedFrame.src = "";
}

// ─── LIKE, SHARE, COMMENTS ────────────────────────────────
async function toggleLike(post) {
  if (!currentUser) {
    showToast("Sign in to like");
    return;
  }
  const ref = doc(db, COLLECTION_NAME, post.id);
  const likes = post.likes || [];
  const had = likes.includes(currentUser.uid);
  try {
    if (had) {
      await updateDoc(ref, { likes: arrayRemove(currentUser.uid) });
      post.likes = likes.filter((u) => u !== currentUser.uid);
    } else {
      await updateDoc(ref, { likes: arrayUnion(currentUser.uid) });
      post.likes = [...likes, currentUser.uid];
    }
    const now = post.likes.includes(currentUser.uid);
    const btn = document.getElementById("likeBtn");
    if (btn) {
      btn.className = `action-btn like-btn${now ? " liked" : ""}`;
      btn.innerHTML = `${now ? I.heartFill : I.heart} <span id="likeCount">${post.likes.length}</span>`;
    }
    const idx = allPosts.findIndex((p) => p.id === post.id);
    if (idx !== -1) allPosts[idx].likes = post.likes;
  } catch (_) {
    showToast("Could not update like");
  }
}

function sharePost(post) {
  const url = `${location.origin}${location.pathname}${location.search}#${post.id}`;
  if (navigator.share)
    navigator.share({ title: post.title, url }).catch(() => {});
  else copyToClipboard(url);
}

function copyPostLink() {
  const url = `${location.origin}${location.pathname}${location.search}#${activePost?.id || ""}`;
  copyToClipboard(url);
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast("Link copied!"));
  } else {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    showToast("Link copied!");
  }
}

// ─── COMMENTS ─────────────────────────────────────────────
async function loadComments(postId) {
  const list = document.getElementById("commentsList");
  const cnt = document.getElementById("commentCount");
  if (!list) return;
  list.innerHTML = `<div class="loading-spinner" style="grid-column:unset;padding:1.5rem"><div class="spinner-ring"></div></div>`;
  try {
    const snap = await getDocs(
      query(
        collection(db, COLLECTION_NAME, postId, "comments"),
        orderBy("createdAt", "asc"),
      ),
    );
    if (cnt) cnt.textContent = snap.size;
    if (snap.empty) {
      list.innerHTML =
        '<p class="no-comments">No comments yet. Be the first!</p>';
      return;
    }
    list.innerHTML = "";
    for (const d of snap.docs) {
      const c = d.data();
      const date = c.createdAt?.toDate
        ? c.createdAt.toDate().toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Just now";
      const name =
        c.authorName ||
        (c.authorEmail ? c.authorEmail.split("@")[0] : "Anonymous");
      const cLikes = c.likes || [];
      const cLiked = currentUser && cLikes.includes(currentUser.uid);
      const canDelete =
        currentUser && (isAdmin || c.authorId === currentUser.uid);
      // Denormalised count — kept on the comment doc (incremented on reply).
      // Avoids an N+1 getDocs-per-comment just to show a number (read spike).
      const replyCount = c.replyCount || 0;
      const el = document.createElement("div");
      el.className = "comment-item";
      el.dataset.commentId = d.id;
      el.innerHTML = `
        <div class="comment-main">
          <div class="comment-author-row"><span class="comment-author">${escHtml(name)}</span><span class="comment-time">${date}</span></div>
          <p class="comment-text">${escHtml(c.text)}</p>
          <div class="comment-actions">
            <button class="comment-action-btn comment-like-btn${cLiked ? " liked" : ""}" data-comment-id="${d.id}" data-post-id="${postId}">${cLiked ? I.heartFill : I.heart}<span class="clikes">${cLikes.length || ""}</span></button>
            <button class="comment-action-btn reply-toggle-btn" data-comment-id="${d.id}" data-post-id="${postId}">${I.reply} ${replyCount > 0 ? `${replyCount} Repl${replyCount === 1 ? "y" : "ies"}` : "Reply"}</button>
            ${canDelete ? `<button class="comment-action-btn comment-delete-btn" data-comment-id="${d.id}" data-post-id="${postId}" title="Delete comment">${I.trash} Delete</button>` : ""}
          </div>
        </div>
        <div class="replies-section" id="replies-${d.id}" style="display:none">
          <div class="replies-list" id="replies-list-${d.id}"></div>
          ${currentUser ? `<div class="reply-form-area" id="reply-form-${d.id}"><textarea class="reply-textarea" id="reply-input-${d.id}" placeholder="Write a reply..." maxlength="500"></textarea><div class="reply-form-actions"><button class="reply-submit-btn" data-comment-id="${d.id}" data-post-id="${postId}">Post Reply</button><button class="reply-cancel-btn" data-comment-id="${d.id}">Cancel</button></div></div>` : ""}
        </div>`;
      list.appendChild(el);
    }
    list
      .querySelectorAll(".comment-like-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          toggleCommentLike(btn.dataset.postId, btn.dataset.commentId, btn),
        ),
      );
    list
      .querySelectorAll(".reply-toggle-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          toggleReplies(btn.dataset.postId, btn.dataset.commentId),
        ),
      );
    list
      .querySelectorAll(".reply-submit-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          submitReply(btn.dataset.postId, btn.dataset.commentId),
        ),
      );
    list.querySelectorAll(".reply-cancel-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const s = document.getElementById(`replies-${btn.dataset.commentId}`);
        if (s) s.style.display = "none";
      }),
    );
    list
      .querySelectorAll(".comment-delete-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          deleteComment(btn.dataset.postId, btn.dataset.commentId),
        ),
      );
  } catch (_) {
    list.innerHTML = '<p class="no-comments">Could not load comments.</p>';
  }
}

async function toggleCommentLike(postId, commentId, btn) {
  if (!currentUser) {
    showToast("Sign in to like");
    return;
  }
  const ref = doc(db, COLLECTION_NAME, postId, "comments", commentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const likes = snap.data().likes || [];
  const had = likes.includes(currentUser.uid);
  if (had) {
    await updateDoc(ref, { likes: arrayRemove(currentUser.uid) });
    btn.classList.remove("liked");
    btn.innerHTML = `${I.heart}<span class="clikes">${Math.max(0, likes.length - 1) || ""}</span>`;
  } else {
    await updateDoc(ref, { likes: arrayUnion(currentUser.uid) });
    btn.classList.add("liked");
    btn.innerHTML = `${I.heartFill}<span class="clikes">${likes.length + 1}</span>`;
  }
}

async function deleteComment(postId, commentId) {
  if (!currentUser) {
    showToast("Sign in to delete");
    return;
  }
  if (!confirm("Delete this comment? This cannot be undone.")) return;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, postId, "comments", commentId));
    loadedReplies.delete(commentId);
    await loadComments(postId);
    showToast("Comment deleted");
  } catch (e) {
    showToast("Could not delete comment");
  }
}

async function deleteReply(postId, commentId, replyId) {
  if (!currentUser) {
    showToast("Sign in to delete");
    return;
  }
  if (!confirm("Delete this reply?")) return;
  try {
    await deleteDoc(
      doc(db, COLLECTION_NAME, postId, "comments", commentId, "replies", replyId),
    );
    loadedReplies.delete(commentId);
    await loadReplies(postId, commentId);
    showToast("Reply deleted");
  } catch (e) {
    showToast("Could not delete reply");
  }
}

const loadedReplies = new Set();
async function toggleReplies(postId, commentId) {
  const s = document.getElementById(`replies-${commentId}`);
  if (!s) return;
  if (s.style.display !== "none") {
    s.style.display = "none";
    return;
  }
  s.style.display = "block";
  if (!loadedReplies.has(commentId)) {
    await loadReplies(postId, commentId);
    loadedReplies.add(commentId);
  }
}

async function loadReplies(postId, commentId) {
  const listEl = document.getElementById(`replies-list-${commentId}`);
  if (!listEl) return;
  listEl.innerHTML = "";
  try {
    const snap = await getDocs(
      query(
        collection(
          db,
          COLLECTION_NAME,
          postId,
          "comments",
          commentId,
          "replies",
        ),
        orderBy("createdAt", "asc"),
      ),
    );
    if (snap.empty) return;
    snap.forEach((d) => {
      const r = d.data();
      const date = r.createdAt?.toDate
        ? r.createdAt.toDate().toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Just now";
      const name =
        r.authorName ||
        (r.authorEmail ? r.authorEmail.split("@")[0] : "Anonymous");
      const rLikes = r.likes || [];
      const rLiked = currentUser && rLikes.includes(currentUser.uid);
      const canDeleteReply =
        currentUser && (isAdmin || r.authorId === currentUser.uid);
      const el = document.createElement("div");
      el.className = "reply-item";
      el.dataset.replyId = d.id;
      el.innerHTML = `<div class="reply-author-row"><span class="reply-author">${escHtml(name)}</span><span class="reply-time">${date}</span></div><p class="reply-text">${escHtml(r.text)}</p><div class="reply-actions"><button class="reply-like-btn${rLiked ? " liked" : ""}" data-reply-id="${d.id}" data-comment-id="${commentId}" data-post-id="${postId}">${rLiked ? I.heartFill : I.heart}<span class="rlikes">${rLikes.length || ""}</span></button>${canDeleteReply ? `<button class="reply-delete-btn" data-reply-id="${d.id}" data-comment-id="${commentId}" data-post-id="${postId}" title="Delete reply">${I.trash}</button>` : ""}</div>`;
      listEl.appendChild(el);
    });
    listEl
      .querySelectorAll(".reply-like-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          toggleReplyLike(
            btn.dataset.postId,
            btn.dataset.commentId,
            btn.dataset.replyId,
            btn,
          ),
        ),
      );
    listEl
      .querySelectorAll(".reply-delete-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          deleteReply(
            btn.dataset.postId,
            btn.dataset.commentId,
            btn.dataset.replyId,
          ),
        ),
      );
  } catch (_) {}
}

async function toggleReplyLike(postId, commentId, replyId, btn) {
  if (!currentUser) {
    showToast("Sign in to like");
    return;
  }
  const ref = doc(
    db,
    COLLECTION_NAME,
    postId,
    "comments",
    commentId,
    "replies",
    replyId,
  );
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const likes = snap.data().likes || [];
  const had = likes.includes(currentUser.uid);
  if (had) {
    await updateDoc(ref, { likes: arrayRemove(currentUser.uid) });
    btn.classList.remove("liked");
    btn.innerHTML = `${I.heart}<span class="rlikes">${Math.max(0, likes.length - 1) || ""}</span>`;
  } else {
    await updateDoc(ref, { likes: arrayUnion(currentUser.uid) });
    btn.classList.add("liked");
    btn.innerHTML = `${I.heartFill}<span class="rlikes">${likes.length + 1}</span>`;
  }
}

async function submitReply(postId, commentId) {
  if (!currentUser) {
    showToast("Sign in to reply");
    return;
  }
  const input = document.getElementById(`reply-input-${commentId}`);
  const btn = document.querySelector(
    `[data-comment-id="${commentId}"].reply-submit-btn`,
  );
  const text = input?.value.trim();
  if (!text || text.length < 2) {
    showToast("Reply too short");
    return;
  }
  btn.disabled = true;
  btn.textContent = "Posting...";
  try {
    await addDoc(
      collection(db, COLLECTION_NAME, postId, "comments", commentId, "replies"),
      {
        text,
        authorId: currentUser.uid,
        authorEmail: currentUser.email,
        authorName: currentUser.displayName || currentUser.email.split("@")[0],
        likes: [],
        createdAt: serverTimestamp(),
      },
    );
    // Keep the denormalised reply count current (read by loadComments, so the
    // "N Replies" label needs no per-comment query).
    try {
      await updateDoc(doc(db, COLLECTION_NAME, postId, "comments", commentId), {
        replyCount: increment(1),
      });
    } catch (_) {}
    input.value = "";
    loadedReplies.delete(commentId);
    await loadReplies(postId, commentId);
    showToast("Reply posted!");
  } catch (e) {
    showToast("Error: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Post Reply";
  }
}

async function submitComment(postId) {
  if (!currentUser) {
    showToast("Sign in to comment");
    return;
  }
  const input = document.getElementById("commentInput");
  const btn = document.getElementById("submitCommentBtn");
  const text = input?.value.trim();
  if (!text || text.length < 3) {
    showToast("Comment too short");
    return;
  }
  btn.disabled = true;
  btn.textContent = "Posting...";
  try {
    await addDoc(collection(db, COLLECTION_NAME, postId, "comments"), {
      text,
      authorId: currentUser.uid,
      authorEmail: currentUser.email,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
      likes: [],
      createdAt: serverTimestamp(),
    });
    input.value = "";
    await loadComments(postId);
    showToast("Comment posted!");
  } catch (e) {
    showToast("Error: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Post Comment";
  }
}

// ─── LOAD POSTS ───────────────────────────────────────────
// Firestore Timestamps lose their prototype when cached to localStorage (JSON
// turns them into {seconds,nanoseconds}). Collapse to a millisecond number so the
// value survives the cache round-trip and formatDate() still renders it.
function tsToMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") {
    const n = Date.parse(ts);
    return isNaN(n) ? 0 : n;
  }
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
}

// Normalise a raw Firestore post doc into the shape the UI renders.
function normalizePost(data) {
  return {
    id: data.id,
    title: data.title || "Untitled",
    content: data.content || "",
    excerpt: data.excerpt || "",
    featuredImage: data.featuredImage || "",
    videoLink: data.videoLink || "",
    practiceLink: data.practiceLink || "",
    subject: data.subject || Object.keys(SUBJECT_LABELS)[0] || "default",
    classLevel: data.classLevel || "ss-1",
    publishedAt: tsToMillis(data.publishedAt),
    modelUsed: data.modelUsed || "",
    views: data.views || 0,
    likes: data.likes || [],
  };
}

// Posts are served from the local TTL cache: a repeat visit (or a tab regaining
// focus) inside the window costs ZERO Firestore reads. Pass { force:true } to
// bypass the cache for an explicit "refresh". The whole list is re-rendered,
// preserving scroll position so a background refresh isn't jarring.
// The feed reads only the latest FEED_PAGE_SIZE posts (cached) instead of the
// whole collection — that's the single biggest client-side read on the site.
// "Show all" (loadPosts({ full:true })) fetches everything on demand for search.
const FEED_PAGE_SIZE = 48;
let feedShowingAll = false;
let feedCapped = false;

async function loadPosts({ force = false, full = false } = {}) {
  try {
    feedShowingAll = full;
    const raw = await getList(
      full ? `blog:${COLLECTION_NAME}:all` : `blog:${COLLECTION_NAME}`,
      () =>
        full
          ? query(collection(db, COLLECTION_NAME), orderBy("publishedAt", "desc"))
          : query(collection(db, COLLECTION_NAME), orderBy("publishedAt", "desc"), limit(FEED_PAGE_SIZE)),
      { ttl: 15 * 60 * 1000, force },
    );
    feedCapped = !full && raw.length >= FEED_PAGE_SIZE;
    const next = raw.map(normalizePost);
    const changed = next.map((p) => p.id).join(",") !== allPosts.map((p) => p.id).join(",");
    const scrollY = window.scrollY;
    allPosts = next;

    if (!allPosts.length) {
      scienceGrid.innerHTML = `<div class="no-posts">No ${SUBJECT_NAME} posts yet. Check back soon!</div>`;
      return;
    }
    renderPosts();
    if (changed) window.scrollTo(0, scrollY);
    if (window.location.hash) openPostFromHash();
  } catch (err) {
    if (!allPosts.length)
      scienceGrid.innerHTML = `<div class="no-posts">Error: ${escHtml(err.message)}</div>`;
  }
}

async function openPostFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const cached = allPosts.find((p) => p.id === hash);
  if (cached) {
    showSinglePost(cached);
    return;
  }
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, hash));
    if (!snap.exists()) return;
    const d = snap.data();
    showSinglePost({
      id: snap.id,
      title: d.title || "Untitled",
      content: d.content || "",
      excerpt: d.excerpt || "",
      featuredImage: d.featuredImage || "",
      videoLink: d.videoLink || "",
      practiceLink: d.practiceLink || "",
      subject: d.subject || Object.keys(SUBJECT_LABELS)[0] || "default",
      classLevel: d.classLevel || "ss-1",
      publishedAt: d.publishedAt,
      modelUsed: d.modelUsed || "",
      views: d.views || 0,
      likes: d.likes || [],
    });
  } catch (_) {}
}

// Global window event listeners
window.addEventListener("scroll", () =>
  scrollTopBtn.classList.toggle("show", window.scrollY > 300),
);
scrollTopBtn.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && singlePostView.classList.contains("active"))
    closePostView();
});
embedCloseBtn.addEventListener("click", closeEmbedModal);
embedOverlay.addEventListener("click", (e) => {
  if (e.target === embedOverlay) closeEmbedModal();
});
