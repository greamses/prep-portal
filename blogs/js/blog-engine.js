// blog-engine.js - Centralized logic for all blog subjects
import { auth, db } from "/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
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
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

export function initBlogEngine(subjectData) {
  // ─── ASSET LOADING ────────────────────────────────────────
  function ensureLessonAssets() {
    const assets = [
      { type: "link", href: "/blogs/css/render.css" },
      { type: "link", href: "/utils/theme/theme.css" },
      { type: "script", src: "/utils/theme/theme.js" },
    ];

    assets.forEach((asset) => {
      const selector =
        asset.type === "link"
          ? `link[href*="${asset.href}"]`
          : `script[src*="${asset.src}"]`;
      if (document.querySelector(selector)) return;

      const el = document.createElement(asset.type);
      if (asset.type === "link") {
        el.rel = "stylesheet";
        el.href = asset.href;
      } else {
        el.src = asset.src;
        el.async = true;
      }
      document.head.appendChild(el);
    });
  }

  ensureLessonAssets();

  // ─── SUBJECT CONFIGURATION ─────────────────────────────────
  const CONFIG = subjectData.SUBJECT_CONFIG || {};
  const COLLECTION_NAME = CONFIG.collectionName || "science-posts";
  const SUBJECT_NAME = CONFIG.name || "Science";
  const SUBJECT_LABELS = subjectData.SUBJECT_LABELS || {};
  const SUBJECT_STYLES = subjectData.SUBJECT_STYLES || {};
  const CLASS_LABELS = subjectData.CLASS_LABELS || {
    primary: (n) => `P${n}`,
    jss: (n) => `JSS ${n}`,
    ss: (n) => `SS ${n}`,
  };
  const CLASS_STYLES = subjectData.CLASS_STYLES || {
    primary: "cls-primary",
    jss: "cls-jss",
    ss: "cls-ss",
  };

  // Update UI Elements
  document.title = `${SUBJECT_NAME} | Prep Portal`;
  const heroTitle = document.getElementById("heroTitle");
  const heroTagline = document.getElementById("heroTagline");
  const loaderSubject = document.getElementById("loaderSubject");

  if (heroTitle) heroTitle.innerHTML = `${SUBJECT_NAME}.`;
  if (heroTagline)
    heroTagline.textContent =
      CONFIG.description || "Scientific facts at a glance.";
  if (loaderSubject) loaderSubject.textContent = SUBJECT_NAME;

  // State
  let allPosts = [];
  let currentSubject = "all";
  let currentClass = "all";
  let currentSearch = "";
  let currentUser = null;
  let activePost = null;

  // Elements
  const scienceGrid = document.getElementById("scienceGrid");
  const singlePostView = document.getElementById("singlePostView");
  const singlePostContent = document.getElementById("singlePostContent");
  const closePostBtn = document.getElementById("closePostBtn");
  const searchInput = document.getElementById("searchInput");
  const scrollTopBtn = document.getElementById("scrollTop");
  const toastEl = document.getElementById("toast");
  const embedOverlay = document.getElementById("embedOverlay");
  const embedFrame = document.getElementById("embedFrame");
  const embedFrameWrap = document.getElementById("embedFrameWrap");
  const embedTitle = document.getElementById("embedTitle");
  const embedOpenLink = document.getElementById("embedOpenLink");
  const embedCloseBtn = document.getElementById("embedCloseBtn");
  const embedSpinner = document.getElementById("embedSpinner");

  onAuthStateChanged(auth, (u) => {
    currentUser = u;
  });

  // ─── HELPERS ──────────────────────────────────────────────
  function markdownToHtml(text) {
    if (!text) return text;
    const tagCount = (
      text.match(/<(h[1-6]|p|ul|ol|li|blockquote|table|pre|div)\b/gi) || []
    ).length;
    if (tagCount >= 6) return text;
    let html = text.replace(/```[\w]*\n?/g, "").replace(/```/g, "");
    html = html
      .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
      .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
      .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/gs, "<em>$1</em>");
    return html
      .split(/\n{2,}/)
      .map((b) => `<p>${b.trim().replace(/\n/g, "<br>")}</p>`)
      .join("\n");
  }

  const showToast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2800);
  };

  const escHtml = (s) =>
    (s || "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
  const stripHtml = (h) => {
    const d = document.createElement("div");
    d.innerHTML = h;
    return d.textContent || "";
  };
  const formatDate = (ts) =>
    ts
      ? (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString("en-NG")
      : "Just now";
  const calcReadTime = (c) =>
    Math.max(1, Math.ceil((c || "").split(/\s+/).length / 200));
  const getSubjectStyle = (s) => SUBJECT_STYLES[s] || "sci-default";
  const getClassShort = (c) => {
    if (!c) return "--";
    const [t, n] = c.split("-");
    return t === "primary" ? `P${n}` : `${t.toUpperCase()} ${n}`;
  };
  const getClassStyle = (c) =>
    (c || "").startsWith("primary")
      ? CLASS_STYLES.primary
      : (c || "").startsWith("jss")
        ? CLASS_STYLES.jss
        : CLASS_STYLES.ss;

  const I = {
    calendar: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="16" height="18" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    clock: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    eye: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    heart: `<svg style="width:12px;height:12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    heartFill: `<svg style="width:12px;height:12px" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    chat: `<svg style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    arrow: `<svg style="width:13px;height:13px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    reply: `<svg style="width:11px;height:11px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>`,
    video: `<svg style="width:13px;height:13px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2"></rect></svg>`,
    practice: `<svg style="width:13px;height:13px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line></svg>`,
  };

  // ─── RENDERING ─────────────────────────────────────────────
  function renderCard(post) {
    const subj = post.subject || Object.keys(SUBJECT_LABELS)[0] || "default";
    const sciCls = getSubjectStyle(subj);
    const clsCls = getClassStyle(post.classLevel);
    const cardImage =
      post.featuredImage ||
      (post.videoLink
        ? `https://img.youtube.com/vi/${post.videoLink.match(/(?:v=|be\/|embed\/)([^&\n?#]+)/)?.[1]}/mqdefault.jpg`
        : null);

    return `
      <div class="science-card" data-post-id="${post.id}">
        ${cardImage ? `<img class="card-featured-img" src="${escHtml(cardImage)}" loading="lazy">` : ""}
        <div class="card-inner">
          <div class="card-badges">
            <span class="sci-badge ${sciCls}">${SUBJECT_LABELS[subj] || subj}</span>
            <span class="cls-badge ${clsCls}">${getClassShort(post.classLevel)}</span>
          </div>
          <h2 class="card-title">${escHtml(post.title)}</h2>
          <div class="card-meta"><span>${I.calendar} ${formatDate(post.publishedAt)}</span><span>${I.clock} ${calcReadTime(post.content)} min</span></div>
          <p class="card-excerpt">${escHtml(stripHtml(post.content).substring(0, 100))}...</p>
          <div class="read-more">Open topic ${I.arrow}</div>
        </div>
      </div>`;
  }

  function renderPosts() {
    let f = allPosts.filter(
      (p) =>
        (currentSubject === "all" || p.subject === currentSubject) &&
        (currentClass === "all" || p.classLevel === currentClass),
    );
    if (currentSearch) {
      const s = currentSearch.toLowerCase();
      f = f.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          stripHtml(p.content).toLowerCase().includes(s),
      );
    }
    if (!scienceGrid) return;
    scienceGrid.innerHTML = f.length
      ? f.map(renderCard).join("")
      : '<div class="no-posts">No posts found.</div>';
    scienceGrid
      .querySelectorAll(".science-card")
      .forEach((card) =>
        card.addEventListener("click", () =>
          showSinglePost(allPosts.find((p) => p.id === card.dataset.postId)),
        ),
      );
  }

  // ─── SINGLE POST VIEW ──────────────────────────────────────
  async function showSinglePost(post) {
    if (!post) return;
    activePost = post;
    await updateDoc(doc(db, COLLECTION_NAME, post.id), { views: increment(1) });

    const likes = post.likes || [];
    const liked = currentUser && likes.includes(currentUser.uid);

    singlePostContent.innerHTML = `
      <h1 class="post-title">${escHtml(post.title)}</h1>
      <div class="post-meta">
        <span>${I.calendar} ${formatDate(post.publishedAt)}</span>
        <span>${I.eye} ${(post.views || 0) + 1} views</span>
      </div>
      <div class="reader-actions">
        <button class="action-btn like-btn${liked ? " liked" : ""}" id="likeBtn">
          ${liked ? I.heartFill : I.heart} <span id="likeCount">${likes.length}</span>
        </button>
      </div>
      <div class="single-post-body">${markdownToHtml(post.content)}</div>
      <section class="comments-section">
        <h3 class="comments-title">${I.chat} Comments (<span id="commentCount">0</span>)</h3>
        <div id="commentsList"></div>
        ${
          currentUser
            ? `<div class="add-comment-form">
            <textarea class="comment-textarea" id="commentInput" placeholder="Share your thoughts..." maxlength="1000"></textarea>
            <button class="comment-submit-btn" id="submitCommentBtn">Post Comment</button>
           </div>`
            : `<p class="login-to-comment">Sign in to comment.</p>`
        }
      </section>`;

    singlePostView.classList.add("active");
    document.body.style.overflow = "hidden";

    document
      .getElementById("likeBtn")
      ?.addEventListener("click", () => toggleLike(post));
    document
      .getElementById("submitCommentBtn")
      ?.addEventListener("click", () => submitComment(post.id));
    loadComments(post.id);
  }

  function closePostView() {
    singlePostView.classList.remove("active");
    document.body.style.overflow = "";
    activePost = null;
  }

  // ─── LIKE & COMMENTS ──────────────────────────────────────
  async function toggleLike(post) {
    if (!currentUser) return showToast("Sign in to like");
    const ref = doc(db, COLLECTION_NAME, post.id);
    const had = (post.likes || []).includes(currentUser.uid);
    await updateDoc(ref, {
      likes: had ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
    post.likes = had
      ? post.likes.filter((u) => u !== currentUser.uid)
      : [...(post.likes || []), currentUser.uid];

    const btn = document.getElementById("likeBtn");
    if (btn) {
      btn.classList.toggle("liked", !had);
      btn.innerHTML = `${!had ? I.heartFill : I.heart} <span id="likeCount">${post.likes.length}</span>`;
    }
  }

  async function loadComments(postId) {
    const list = document.getElementById("commentsList");
    if (!list) return;
    const snap = await getDocs(
      query(
        collection(db, COLLECTION_NAME, postId, "comments"),
        orderBy("createdAt", "asc"),
      ),
    );
    document.getElementById("commentCount").textContent = snap.size;
    list.innerHTML = snap.empty
      ? '<p class="no-comments">Be the first to comment!</p>'
      : "";
    snap.forEach((d) => {
      const c = d.data();
      const el = document.createElement("div");
      el.className = "comment-item";
      el.innerHTML = `
        <div class="comment-main">
          <div class="comment-author-row"><strong>${escHtml(c.authorName)}</strong></div>
          <p class="comment-text">${escHtml(c.text)}</p>
        </div>`;
      list.appendChild(el);
    });
  }

  async function submitComment(postId) {
    const input = document.getElementById("commentInput");
    const text = input?.value.trim();
    if (!text) return;
    await addDoc(collection(db, COLLECTION_NAME, postId, "comments"), {
      text,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
      createdAt: serverTimestamp(),
    });
    input.value = "";
    loadComments(postId);
  }

  // ─── INITIALIZATION ───────────────────────────────────────
  async function loadPosts() {
    const snap = await getDocs(
      query(collection(db, COLLECTION_NAME), orderBy("publishedAt", "desc")),
    );
    allPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderPosts();
  }

  // Wire up filter UI
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      renderPosts();
    });
  }

  if (closePostBtn) closePostBtn.addEventListener("click", closePostView);

  loadPosts();
}
