// blog.js - Central dynamic blog viewer engine
import { auth, db } from "/firebase-init.js";
import { onAuthStateChanged } from "/node_modules/firebase/firebase-auth.js";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "/node_modules/firebase/firebase-firestore.js";

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
let SUBJECT_LABELS;
let SUBJECT_STYLES;
let CLASS_LABELS;
let CLASS_STYLES;

let allPosts = [];
let currentSubject = "all";
let currentClass = "all";
let currentSearch = "";
let currentUser = null;
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

// Map parameters to their specific configuration module paths
const CONFIG_PATH_MAP = {
  plants: "/blogs/science/biology/plants/auto/data.js",
  animal: "/blogs/science/biology/animal/auto/data.js",
};

async function initBlog() {
  assignDomElements();
  ensureLessonAssets();

  // Extract key parameter from active browser URI
  const params = new URLSearchParams(window.location.search);
  const subjectKey = params.get("s") || params.get("subject") || "plants";

  // Determine configuration location
  const configPath =
    CONFIG_PATH_MAP[subjectKey] ||
    `/blogs/science/biology/${subjectKey}/auto/data.js`;

  let subjectData = {};
  try {
    subjectData = await import(configPath);
  } catch (err) {
    console.error(
      `Unable to dynamically import subject configuration at: ${configPath}`,
      err,
    );
  }

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

  // Begin fetching data
  await loadPosts();
  setInterval(silentUpdatePosts, 60000);
}

document.addEventListener("DOMContentLoaded", initBlog);

onAuthStateChanged(auth, async (u) => {
  currentUser = u;
  if (u) {
    try {
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const d = snap.data();
        groqApiKeyPublic = d.groqKey || d.groqApiKey || null;
        geminiApiKeyPublic = d.geminiKey || d.geminiApiKey || d.apiKey || null;
      }
    } catch (_) {}
  }
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
  calendar: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="16" height="18" rx="2"></rect><line x1="8" y1="2" x2="8" y2="6"></line><line x1="16" y1="2" x2="16" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  clock: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  eye: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  cpu: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`,
  heart: `<svg style="width:12px;height:12px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  heartFill: `<svg style="width:12px;height:12px;flex-shrink:0" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  share: `<svg style="width:13px;height:13px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  chat: `<svg style="width:18px;height:18px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  arrow: `<svg style="width:13px;height:13px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  reply: `<svg style="width:11px;height:11px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>`,
  link: `<svg style="width:13px;height:13px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
  video: `<svg style="width:13px;height:13px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
  practice: `<svg style="width:13px;height:13px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
};

// ─── CARD RENDER ──────────────────────────────────────────
function renderCard(post) {
  const subj = post.subject || Object.keys(SUBJECT_LABELS)[0] || "default";
  const cls = post.classLevel || "ss-1";
  const sciCls = getSubjectStyle(subj);
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

  return `
    <div class="science-card" data-post-id="${post.id}">
      ${cardImage ? `<img class="card-featured-img" src="${escHtml(cardImage)}" alt="${escHtml(post.title)}" loading="lazy">` : ""}
      <div class="card-inner">
        <div class="card-badges">
          <span class="sci-badge ${sciCls}">${subjLbl}</span>
          <span class="cls-badge ${clsCls}">${clsLbl}</span>
        </div>
        <div class="card-meta">
          <span>${I.calendar} ${date}</span>
          <span>${I.clock} ${rt} min</span>
        </div>
        <h2 class="card-title">${escHtml(post.title)}</h2>
        <div class="card-resource-row">
          <span class="card-resource-chip${hasVideo ? " has-link" : ""}">${I.video} Video</span>
          <span class="card-resource-chip${hasPractice ? " has-link" : ""}">${I.practice} Practice</span>
        </div>
        <p class="card-excerpt">${escHtml(excerpt)}...</p>
        <div class="read-more">Open topic ${I.arrow}</div>
      </div>
    </div>`;
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
    card.addEventListener("click", () => {
      const post = allPosts.find((p) => p.id === card.dataset.postId);
      if (post) showSinglePost(post);
    });
  });
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
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
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#111"><svg style="width:40px;height:40px;color:#fff" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2"></rect></svg></div>`
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
            <svg class="resource-open-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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
              <svg style="width:40px;height:40px;color:rgba(255, 255, 255, 0.9)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
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
            <svg class="resource-open-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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
      let replyCount = 0;
      try {
        const rs = await getDocs(
          query(
            collection(
              db,
              COLLECTION_NAME,
              postId,
              "comments",
              d.id,
              "replies",
            ),
            orderBy("createdAt", "asc"),
          ),
        );
        replyCount = rs.size;
      } catch (_) {}
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
      const el = document.createElement("div");
      el.className = "reply-item";
      el.dataset.replyId = d.id;
      el.innerHTML = `<div class="reply-author-row"><span class="reply-author">${escHtml(name)}</span><span class="reply-time">${date}</span></div><p class="reply-text">${escHtml(r.text)}</p><button class="reply-like-btn${rLiked ? " liked" : ""}" data-reply-id="${d.id}" data-comment-id="${commentId}" data-post-id="${postId}">${rLiked ? I.heartFill : I.heart}<span class="rlikes">${rLikes.length || ""}</span></button>`;
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
async function loadPosts() {
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTION_NAME), orderBy("publishedAt", "desc")),
    );
    allPosts = [];
    snap.forEach((d) => {
      const data = d.data();
      allPosts.push({
        id: d.id,
        title: data.title || "Untitled",
        content: data.content || "",
        excerpt: data.excerpt || "",
        featuredImage: data.featuredImage || "",
        videoLink: data.videoLink || "",
        practiceLink: data.practiceLink || "",
        subject: data.subject || Object.keys(SUBJECT_LABELS)[0] || "default",
        classLevel: data.classLevel || "ss-1",
        publishedAt: data.publishedAt,
        modelUsed: data.modelUsed || "",
        views: data.views || 0,
        likes: data.likes || [],
      });
    });
    if (!allPosts.length) {
      scienceGrid.innerHTML = `<div class="no-posts">No ${SUBJECT_NAME} posts yet. Check back soon!</div>`;
      return;
    }
    renderPosts();
    if (window.location.hash) openPostFromHash();
  } catch (err) {
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

// ─── SILENT BACKGROUND REFRESH ────────────────────────────
async function silentUpdatePosts() {
  const snap = await getDocs(
    query(collection(db, COLLECTION_NAME), orderBy("publishedAt", "desc")),
  );
  const newPosts = [];
  snap.forEach((d) => {
    const data = d.data();
    newPosts.push({
      id: d.id,
      title: data.title || "Untitled",
      content: data.content || "",
      excerpt: data.excerpt || "",
      featuredImage: data.featuredImage || "",
      videoLink: data.videoLink || "",
      practiceLink: data.practiceLink || "",
      subject: data.subject || Object.keys(SUBJECT_LABELS)[0] || "default",
      classLevel: data.classLevel || "ss-1",
      publishedAt: data.publishedAt,
      modelUsed: data.modelUsed || "",
      views: data.views || 0,
      likes: data.likes || [],
    });
  });

  const oldIds = allPosts.map((p) => p.id).join(",");
  const newIds = newPosts.map((p) => p.id).join(",");

  if (oldIds !== newIds) {
    const scrollY = window.scrollY;
    allPosts = newPosts;
    renderPosts();
    window.scrollTo(0, scrollY);
  } else {
    allPosts = newPosts;
    const visiblePosts = filterPosts();
    document.querySelectorAll(".science-card").forEach((card) => {
      const postId = card.dataset.postId;
      const post = allPosts.find((p) => p.id === postId);
      if (post && visiblePosts.some((vp) => vp.id === postId)) {
        const newCardHtml = renderCard(post);
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = newCardHtml;
        const newCard = tempDiv.firstElementChild;
        if (newCard) {
          card.replaceWith(newCard);
          newCard.addEventListener("click", () => {
            const p = allPosts.find((p) => p.id === newCard.dataset.postId);
            if (p) showSinglePost(p);
          });
        }
      } else if (post && !visiblePosts.some((vp) => vp.id === postId)) {
        card.remove();
      }
    });
  }
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
