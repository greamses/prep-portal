// ============================================================================
// DIGITAL MAGAZINE FLIPBOOK  —  powered by StPageFlip (page-flip)
// "Who We Are & What We Do" — a fashion/travel-style editorial issue with
// full-bleed photography, an embedded YouTube feature and a per-page logo
// watermark. All imagery lives in ./flipbook-assets.js for easy updating.
// ============================================================================

import { IMG, VOICES, VIDEO } from "/home/js/flipbook-assets.js";

// Same convention as utils/prepbot: hit localhost:5000 from Live Server
// (:5500), otherwise same-origin /api on Vercel.
const API_BASE = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";

// Brand glyph — kept inline so the faint page watermark works offline.
const LOGO_SVG = `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M50 50L10 27V73L50 96V50Z" fill="#0055ff" stroke="#0a0a0a" stroke-width="2.5"/>
  <path d="M50 50L90 27V73L50 96V50Z" fill="#003db3" stroke="#0a0a0a" stroke-width="2.5"/>
  <path d="M50 50L90 27L50 4L10 27L50 50Z" fill="#ffffff" stroke="#0a0a0a" stroke-width="2.5"/>
  <path d="M50 35L65 43V58L50 66L35 58V43L50 35Z" fill="#ffe500" stroke="#0a0a0a" stroke-width="2"/>
  <circle cx="50" cy="50.5" r="4" fill="#0a0a0a"/>
</svg>`;

// ── Tiny render helpers ─────────────────────────────────────────────────────
const img = (o) =>
  `<img src="${o.src}" alt="${o.alt}" loading="lazy" onerror="this.onerror=null;this.src='${o.fallback}'">`;
const figure = (o, cls = "") => `<div class="fb-figure ${cls}">${img(o)}</div>`;
const watermark = () => `<div class="fb-watermark">${LOGO_SVG}</div>`;
const folio = (n, cap) =>
  `<div class="fb-folio"><span class="fb-folio__num">${n}</span><span class="fb-folio__cap">${cap}</span></div>`;

// ── Pages ───────────────────────────────────────────────────────────────────
function coverPage() {
  return `
  <div class="fb-page fb-cover" data-density="hard">
    <div class="fb-page__inner">
      <div class="fb-cover__issue"><span>Vol. I</span><span>2026</span></div>
      <h1 class="fb-cover__title">Prep&nbsp;Portal</h1>
      <p class="fb-cover__sub">Who We Are &amp; What We Do</p>
      <div class="fb-cover__figure">
        ${img(IMG.cover)}
        <p class="fb-cover__caption">The people, the mission and the tools behind Nigeria&rsquo;s most personal exam-prep platform.</p>
      </div>
    </div>
  </div>`;
}

function contentsPage() {
  const items = [
    ["04", "Who We Are"],
    ["05", "In the Field"],
    ["06", "What We Do"],
    ["07", "The Film"],
    ["08", "Voices"],
    ["09", "Gallery"],
  ]
    .map(([n, c]) => `<li><span class="fb-toc__num">${n}</span><span class="fb-toc__cap">${c}</span></li>`)
    .join("");
  return `
  <div class="fb-page">
    ${watermark()}
    <div class="fb-page__inner">
      <div class="fb-contents__thumbs">${IMG.contents.map((o) => figure(o)).join("")}</div>
      <h2 class="fb-contents__head">Contents</h2>
      <ol class="fb-toc">${items}</ol>
      ${folio("02", "Issue Map")}
    </div>
  </div>`;
}

function editorPage() {
  return `
  <div class="fb-page" data-right>
    ${watermark()}
    <div class="fb-page__inner">
      <span class="fb-kicker">Editor&rsquo;s Letter</span>
      <h2 class="fb-h1 fb-h1--sm">A note to<br />every parent.</h2>
      <p class="fb-body fb-dropcap">
        Every great result starts with one believer in a child&rsquo;s potential.
        We built Prep Portal to be that believer — at scale — pairing the warmth
        of a great teacher with the precision of modern tools.
      </p>
      <p class="fb-body">
        In this issue we open our doors: who we are, what we do, and the families
        whose stories keep us going. Welcome in.
      </p>
      <p class="fb-sign">— The Prep Portal Team</p>
      <div class="fb-editor__thumbs">${IMG.editor.map((o) => figure(o)).join("")}</div>
      ${folio("03", "Editor")}
    </div>
  </div>`;
}

function whoPage() {
  return `
  <div class="fb-page">
    ${watermark()}
    <div class="fb-page__inner">
      <span class="fb-kicker">Section 01</span>
      <h2 class="fb-h1">Who <em>we</em><br />are.</h2>
      ${figure(IMG.who, "fb-article__img")}
      <div class="fb-cols">
        <p class="fb-body fb-dropcap">
          We are educators, engineers and parents on a single mission: to make
          world-class exam preparation personal, affordable and within reach for
          every Nigerian family.
        </p>
        <p class="fb-body">
          From Lagos to Maiduguri, we pair each learner with people who believe in
          them — and back that belief with technology that proves it on exam day.
          Human first, always.
        </p>
      </div>
      ${folio("04", "Who We Are")}
    </div>
  </div>`;
}

function essayPage() {
  return `
  <div class="fb-page fb-essay" data-right>
    <div class="fb-essay__img">${img(IMG.essay)}</div>
    <div class="fb-page__inner">
      <div class="fb-essay__cap">
        <p class="fb-essay__kicker">In the Field</p>
        <p class="fb-essay__quote">Learning that <em>travels</em> — from the classroom to the kitchen table.</p>
      </div>
      ${folio("05", "Photo Essay")}
    </div>
  </div>`;
}

function whatPage() {
  const deck = [
    ["Smart Practice", "A CBT-accurate question bank across JAMB, WAEC, NECO &amp; IGCSE with instant feedback."],
    ["Matched Tutoring", "One-to-one tutors paired to each child, with updates parents actually read."],
    ["Exam Archive", "Years of past papers — solved, searchable, national and international."],
    ["Community", "A nationwide network of learners and mentors who push each other forward."],
  ]
    .map(([t, d]) => `<div class="fb-deck__item"><h3 class="fb-deck__title">${t}</h3><p class="fb-deck__text">${d}</p></div>`)
    .join("");
  return `
  <div class="fb-page">
    ${watermark()}
    <div class="fb-page__inner">
      <span class="fb-kicker">Section 02</span>
      <h2 class="fb-h1 fb-h1--sm">What we <em>do</em>.</h2>
      <div class="fb-grid4">${IMG.what.map((o) => figure(o)).join("")}</div>
      <div class="fb-deck">${deck}</div>
      ${folio("06", "What We Do")}
    </div>
  </div>`;
}

function videoPage() {
  return `
  <div class="fb-page" data-right>
    ${watermark()}
    <div class="fb-page__inner">
      <span class="fb-kicker">Feature Film</span>
      <h2 class="fb-h1 fb-h1--sm">Watch.</h2>
      <figure class="fb-video-figure" data-video>
        <button type="button" class="fb-video__poster" data-yt="${VIDEO.id}" data-title="${VIDEO.title}"
                style="background-image:url('${VIDEO.poster}');"
                aria-label="Play video: ${VIDEO.title}">
          <span class="fb-video__play">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </span>
          <span class="fb-video__cap">${VIDEO.title}</span>
        </button>
        <div class="fb-video__frame"></div>
      </figure>
      <p class="fb-body">
        Three minutes inside Prep Portal — the tutors, the students and the small
        daily wins that add up to a different result.
      </p>
      ${folio("07", "The Film")}
    </div>
  </div>`;
}

function voicesPage() {
  const slides = VOICES.map(
    (v, i) => `
    <div class="fb-slide${i === 0 ? " is-active" : ""}" data-slide="${i}">
      ${figure(v.portrait)}
      <div>
        <p class="fb-slide__quote">&ldquo;${v.quote}&rdquo;</p>
        <p class="fb-slide__name">${v.name}</p>
        <p class="fb-slide__role">${v.role}</p>
      </div>
    </div>`
  ).join("");
  const dots = VOICES.map(
    (_, i) => `<button type="button" class="${i === 0 ? "is-active" : ""}" data-dot="${i}" aria-label="Voice ${i + 1}"></button>`
  ).join("");
  return `
  <div class="fb-page">
    ${watermark()}
    <div class="fb-page__inner">
      <span class="fb-kicker">Section 03</span>
      <h2 class="fb-h1 fb-h1--sm">Voices.</h2>
      <div class="fb-carousel" data-carousel>
        <div class="fb-carousel__track">${slides}</div>
        <div class="fb-dots">${dots}</div>
      </div>
      ${folio("08", "Voices")}
    </div>
  </div>`;
}

function galleryPage() {
  return `
  <div class="fb-page" data-right>
    ${watermark()}
    <div class="fb-page__inner">
      <span class="fb-kicker">Closing</span>
      <h2 class="fb-h1 fb-h1--sm">The whole<br /><em>picture</em>.</h2>
      <div class="fb-grid4">${IMG.gallery.map((o) => figure(o)).join("")}</div>
      <p class="fb-body">
        One platform, one promise: every child deserves a tutor who believes in
        them — and the tools to prove it. This is what we do, every day.
      </p>
      ${folio("09", "Gallery")}
    </div>
  </div>`;
}

function backPage() {
  return `
  <div class="fb-page fb-back" data-density="hard">
    <div class="fb-back__bg">${img(IMG.back)}</div>
    <div class="fb-page__inner">
      <p class="fb-back__mast">Prep Portal &middot; 2026</p>
      <h2 class="fb-back__title">Your child&rsquo;s<br /><em>grade</em> is next.</h2>
      <p class="fb-back__text">
        Join thousands of Nigerian families turning exam stress into results.
        Start free today.
      </p>
      <a class="fb-cta" href="/subscribe.html">Start Free Revision</a>
      <p class="fb-back__url">prepportal.com.ng</p>
    </div>
  </div>`;
}

// ── Behaviours wired after the book is built ────────────────────────────────
function wireVideo(root) {
  const fig = root.querySelector("[data-video]");
  if (!fig) return;
  const poster = fig.querySelector(".fb-video__poster");
  const frame = fig.querySelector(".fb-video__frame");
  poster.addEventListener("click", (e) => {
    e.stopPropagation();
    const id = poster.dataset.yt;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = poster.dataset.title || VIDEO.title;
    iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "");
    frame.appendChild(iframe);
    poster.style.display = "none";
  });
}

// Stop any playing video (called when the modal closes).
function stopVideo(root) {
  const fig = root.querySelector("[data-video]");
  if (!fig) return;
  const frame = fig.querySelector(".fb-video__frame");
  const poster = fig.querySelector(".fb-video__poster");
  if (frame) frame.innerHTML = "";
  if (poster) poster.style.display = "";
}

// Pull the real featured video from the backend and patch the video page.
async function patchFeaturedVideo(root) {
  const poster = root.querySelector(".fb-video__poster");
  if (!poster) return;
  try {
    const res = await fetch(`${API_BASE}/api/youtube/featured`);
    if (!res.ok) return;
    const v = await res.json();
    if (!v?.videoId) return;
    poster.dataset.yt = v.videoId;
    if (v.title) {
      poster.dataset.title = v.title;
      poster.setAttribute("aria-label", `Play video: ${v.title}`);
      const cap = poster.querySelector(".fb-video__cap");
      if (cap) cap.textContent = v.title;
    }
    const thumb = v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`;
    poster.style.backgroundImage = `url('${thumb}'), url('https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg')`;
  } catch {
    /* offline / not configured → keep fallback */
  }
}

function wireCarousel(root) {
  const carousel = root.querySelector("[data-carousel]");
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll(".fb-slide")];
  const dots = [...carousel.querySelectorAll("[data-dot]")];
  if (slides.length < 2) return;

  let i = 0;
  let timer = null;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
  };
  const start = () => { stop(); timer = setInterval(() => show(i + 1), 5000); };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };

  dots.forEach((d) =>
    d.addEventListener("click", (e) => { e.stopPropagation(); show(Number(d.dataset.dot)); start(); })
  );
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  start();
}

// ── Teaser + modal markup ────────────────────────────────────────────────────
function teaserHTML() {
  return `
  <div class="fb-teaser">
    <button type="button" class="fb-teaser__cover" data-open aria-label="Open the digital magazine">
      ${img(IMG.cover)}
      <span class="fb-teaser__veil"></span>
      <span class="fb-teaser__top">
        <span class="fb-teaser__issue">Vol. I — 2026</span>
        <span class="fb-teaser__title">Prep&nbsp;Portal</span>
        <span class="fb-teaser__sub">Who We Are &amp; What We Do</span>
      </span>
      <span class="fb-teaser__play">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
      </span>
      <span class="fb-teaser__cta">Read the issue</span>
    </button>
    <div class="fb-teaser__meta">
      <span>10 Pages</span><i></i><span>Digital Edition</span><i></i><span>Featuring Video</span>
    </div>
  </div>`;
}

function modalHTML() {
  return `
  <div class="fb-modal" data-modal role="dialog" aria-modal="true" aria-label="Prep Portal digital magazine">
    <div class="fb-modal__backdrop" data-backdrop></div>
    <span class="fb-modal__label">Prep Portal — The Portal Edition</span>
    <button type="button" class="fb-modal__close" data-close aria-label="Close magazine">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
    </button>
    <div class="fb-modal__dialog">
      <div class="fb-stage">
        <div class="fb-book" id="fb-book"></div>
        <div class="fb-controls">
          <button type="button" class="fb-nav-btn" data-prev disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Prev
          </button>
          <span class="fb-counter"><b data-cur>1</b> <span>/</span> <span data-total>10</span></span>
          <button type="button" class="fb-nav-btn" data-next>
            Next
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <p class="fb-hint">Drag a page corner, swipe, or use the arrows</p>
      </div>
    </div>
  </div>`;
}

// Build the StPageFlip book inside the (already visible) modal — runs once.
function buildBook(modal) {
  const PageFlip = window.St && window.St.PageFlip;
  const bookEl = modal.querySelector("#fb-book");
  if (typeof PageFlip !== "function") {
    bookEl.innerHTML = `<div class="fb-error">Flipbook engine failed to load. Please refresh.</div>`;
    return null;
  }

  bookEl.innerHTML = [
    coverPage(), contentsPage(), editorPage(), whoPage(), essayPage(),
    whatPage(), videoPage(), voicesPage(), galleryPage(), backPage(),
  ].join("");

  const pageFlip = new PageFlip(bookEl, {
    width: 460,
    height: 640,
    size: "stretch",
    minWidth: 300,
    maxWidth: 600,
    minHeight: 400,
    maxHeight: 900,
    drawShadow: true,
    flippingTime: 850,
    maxShadowOpacity: 0.35,
    showCover: true,
    usePortrait: true,
    mobileScrollSupport: false,
    clickEventForward: true,
    useMouseEvents: true,
    swipeDistance: 30,
  });

  pageFlip.loadFromHTML(bookEl.querySelectorAll(".fb-page"));

  const total = pageFlip.getPageCount();
  const $cur = modal.querySelector("[data-cur]");
  const $total = modal.querySelector("[data-total]");
  const $prev = modal.querySelector("[data-prev]");
  const $next = modal.querySelector("[data-next]");
  if ($total) $total.textContent = total;

  const sync = (idx) => {
    if ($cur) $cur.textContent = idx + 1;
    if ($prev) $prev.disabled = idx <= 0;
    if ($next) $next.disabled = idx >= total - 1;
  };
  pageFlip.on("flip", (e) => sync(e.data));
  $prev?.addEventListener("click", () => pageFlip.flipPrev());
  $next?.addEventListener("click", () => pageFlip.flipNext());
  sync(0);

  wireVideo(bookEl);
  wireCarousel(bookEl);
  patchFeaturedVideo(bookEl);
  return pageFlip;
}

// ── Public API ──────────────────────────────────────────────────────────────
export function initFlipbook({ containerId }) {
  const host = document.getElementById(containerId);
  if (!host) {
    console.error(`[flipbook] container "#${containerId}" not found.`);
    return;
  }

  // Lightweight homepage footprint: just the cover teaser.
  host.innerHTML = teaserHTML();

  // Full-screen modal lives on <body> so no ancestor can clip it.
  const modal = document.createElement("div");
  modal.innerHTML = modalHTML();
  const modalEl = modal.firstElementChild;
  document.body.appendChild(modalEl);

  let pageFlip = null;
  let built = false;
  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    modalEl.classList.add("is-open");
    document.body.classList.add("fb-modal-open");
    // Build (or re-measure) only once the modal is visible so sizing is correct.
    requestAnimationFrame(() => {
      if (!built) {
        pageFlip = buildBook(modalEl);
        built = true;
      } else {
        pageFlip?.update?.();
      }
      modalEl.querySelector("[data-close]")?.focus();
    });
  };

  const close = () => {
    modalEl.classList.remove("is-open");
    document.body.classList.remove("fb-modal-open");
    stopVideo(modalEl);
    lastFocus?.focus?.();
  };

  host.querySelector("[data-open]")?.addEventListener("click", open);
  modalEl.querySelector("[data-close]")?.addEventListener("click", close);
  modalEl.querySelector("[data-backdrop]")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("is-open")) close();
  });
}
