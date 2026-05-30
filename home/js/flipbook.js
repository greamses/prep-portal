// ============================================================================
// DIGITAL MAGAZINE FLIPBOOK  —  powered by StPageFlip (page-flip)
// "Who We Are & What We Do" — a fashion/travel-style editorial issue with
// full-bleed photography, an embedded YouTube feature and a per-page logo
// watermark. All imagery lives in ./flipbook-assets.js for easy updating.
// ============================================================================

import { IMG, VOICES, VIDEO, STATS, REACH } from "/home/js/flipbook-assets.js";

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

// A right-hand page (the recto of a spread) carries the data-right flag so its
// folio sits on the outer edge. With showCover, page 1 is the cover (alone on
// the right) and spreads then run (left,right): folios 3,5,7… are right pages.
const RIGHT = new Set([3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]);

// Generic page shell: watermark + padded inner. `n` drives the data-right side.
function shell(inner, { n, cls = "", wm = true } = {}) {
  const right = RIGHT.has(n) ? " data-right" : "";
  return `
  <div class="fb-page ${cls}"${right}>
    ${wm ? watermark() : ""}
    <div class="fb-page__inner">${inner}</div>
  </div>`;
}

// ── Reusable editorial layouts ──────────────────────────────────────────────
function sectionOpener({ n, cap, section, title, image, paras }) {
  const cols = paras
    .map((p, i) => `<p class="fb-body${i === 0 ? " fb-dropcap" : ""}">${p}</p>`)
    .join("");
  return shell(
    `<span class="fb-kicker">${section}</span>
     <h2 class="fb-h1">${title}</h2>
     ${figure(image, "fb-article__img")}
     <div class="fb-cols">${cols}</div>
     ${folio(pad(n), cap)}`,
    { n }
  );
}

function featurePage({ n, cap, kicker, title, image, paras }) {
  const body = paras.map((p) => `<p class="fb-body">${p}</p>`).join("");
  return shell(
    `<span class="fb-kicker">${kicker}</span>
     <h2 class="fb-h1 fb-h1--sm">${title}</h2>
     ${figure(image, "fb-article__img")}
     ${body}
     ${folio(pad(n), cap)}`,
    { n }
  );
}

function deckPage({ n, cap, kicker, title, images, items }) {
  const grid = images ? `<div class="fb-grid4">${images.map((o) => figure(o)).join("")}</div>` : "";
  const deck = items
    .map(([t, d]) => `<div class="fb-deck__item"><h3 class="fb-deck__title">${t}</h3><p class="fb-deck__text">${d}</p></div>`)
    .join("");
  return shell(
    `<span class="fb-kicker">${kicker}</span>
     <h2 class="fb-h1 fb-h1--sm">${title}</h2>
     ${grid}
     <div class="fb-deck">${deck}</div>
     ${folio(pad(n), cap)}`,
    { n }
  );
}

function essayFull({ n, cap, kicker, quoteHTML, image }) {
  const right = RIGHT.has(n) ? " data-right" : "";
  return `
  <div class="fb-page fb-essay"${right}>
    <div class="fb-essay__img">${img(image)}</div>
    <div class="fb-page__inner">
      <div class="fb-essay__cap">
        <p class="fb-essay__kicker">${kicker}</p>
        <p class="fb-essay__quote">${quoteHTML}</p>
      </div>
      ${folio(pad(n), cap)}
    </div>
  </div>`;
}

const pad = (n) => String(n).padStart(2, "0");

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
    ["05", "Who We Are"],
    ["07", "In the Field"],
    ["09", "By the Numbers"],
    ["11", "What We Do"],
    ["16", "The Film"],
    ["18", "Voices"],
    ["22", "Gallery"],
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
      ${folio("05", "Who We Are")}
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
  <div class="fb-page" data-right>
    ${watermark()}
    <div class="fb-page__inner">
      <span class="fb-kicker">Section 02</span>
      <h2 class="fb-h1 fb-h1--sm">What we <em>do</em>.</h2>
      <div class="fb-grid4">${IMG.what.map((o) => figure(o)).join("")}</div>
      <div class="fb-deck">${deck}</div>
      ${folio("11", "What We Do")}
    </div>
  </div>`;
}

function videoPage() {
  return `
  <div class="fb-page">
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
      ${folio("16", "The Film")}
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
      ${folio("18", "Voices")}
    </div>
  </div>`;
}

function galleryPage() {
  return `
  <div class="fb-page">
    ${watermark()}
    <div class="fb-page__inner">
      <span class="fb-kicker">Closing</span>
      <h2 class="fb-h1 fb-h1--sm">The whole<br /><em>picture</em>.</h2>
      <div class="fb-grid4">${IMG.gallery.map((o) => figure(o)).join("")}</div>
      <p class="fb-body">
        One platform, one promise: every child deserves a tutor who believes in
        them — and the tools to prove it. This is what we do, every day.
      </p>
      ${folio("22", "Gallery")}
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
      <span>25 Pages</span><i></i><span>Digital Edition</span><i></i><span>Featuring Video</span>
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
          <span class="fb-counter"><b data-cur>1</b> <span>/</span> <span data-total>25</span></span>
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

// ── The 25-page issue, in reading order ─────────────────────────────────────
function PAGES() {
  return [
    coverPage(),                                                       // 01 cover
    contentsPage(),                                                    // 02
    editorPage(),                                                      // 03
    deckPage({                                                        // 04 masthead
      n: 4, cap: "Masthead", kicker: "Masthead", title: "The people behind the page.",
      items: [
        ["Editorial", "Written by the Prep Portal learning team, Lagos."],
        ["Photography", "Our students, tutors and classrooms across Nigeria."],
        ["Design &amp; Build", "The Prep Portal product studio."],
        ["Published", "Prep Portal &middot; Vol. I &middot; 2026"],
      ],
    }),
    whoPage(),                                                        // 05
    featurePage({                                                     // 06 our story
      n: 6, cap: "Our Story", kicker: "Section 01 &mdash; Our Story",
      title: "How we <em>began</em>.", image: IMG.story,
      paras: [
        "Prep Portal started with a simple frustration: brilliant Nigerian students were being held back not by ability, but by access &mdash; to good tutors, to honest feedback, to past questions that mirrored the real thing.",
        "So we built the platform we wished we&rsquo;d had: human tutoring at scale, exam-accurate practice, and parents kept in the loop every step of the way.",
      ],
    }),
    essayFull({                                                       // 07 in the field
      n: 7, cap: "Photo Essay", kicker: "In the Field",
      quoteHTML: "Learning that <em>travels</em> &mdash; from the classroom to the kitchen table.",
      image: IMG.essay,
    }),
    featurePage({                                                     // 08 mission
      n: 8, cap: "Mission", kicker: "Our Mission",
      title: "One <em>promise</em>.", image: IMG.mission,
      paras: [
        "Every child deserves a tutor who believes in them &mdash; and the tools to prove that belief on exam day.",
        "We measure ourselves by one number that matters: the grade a student walks away with, and the confidence they carry into it.",
      ],
    }),
    deckPage({                                                       // 09 by the numbers
      n: 9, cap: "By the Numbers", kicker: "By the Numbers",
      title: "The work, <em>measured</em>.",
      items: STATS.map((s) => [s.num, s.label]),
    }),
    deckPage({                                                       // 10 values
      n: 10, cap: "What We Believe", kicker: "Our Values",
      title: "What we <em>believe</em>.",
      items: [
        ["Human first", "Technology amplifies great teaching &mdash; it never replaces it."],
        ["Proof, not promises", "Every claim we make is one a student can feel in their results."],
        ["Access for all", "World-class prep should not depend on a postcode or a price tag."],
        ["Honest feedback", "Kind, specific and on time &mdash; for students and parents alike."],
      ],
    }),
    whatPage(),                                                       // 11
    featurePage({                                                     // 12 smart practice
      n: 12, cap: "Smart Practice", kicker: "What We Do &mdash; 01",
      title: "Smart <em>practice</em>.", image: IMG.features[0],
      paras: [
        "A CBT-accurate question bank across JAMB, WAEC, NECO and IGCSE &mdash; with instant, explained feedback on every answer.",
        "Adaptive sets focus each session on exactly what a student hasn&rsquo;t mastered yet, so practice time is never wasted.",
      ],
    }),
    featurePage({                                                     // 13 tutoring
      n: 13, cap: "Matched Tutoring", kicker: "What We Do &mdash; 02",
      title: "Matched <em>tutoring</em>.", image: IMG.features[1],
      paras: [
        "Each learner is paired with a tutor chosen for their subject, style and schedule &mdash; not assigned at random.",
        "Parents get updates they actually read: short, clear notes on progress, effort and the next milestone.",
      ],
    }),
    featurePage({                                                     // 14 archive
      n: 14, cap: "Exam Archive", kicker: "What We Do &mdash; 03",
      title: "The <em>archive</em>.", image: IMG.features[2],
      paras: [
        "Years of past papers &mdash; national and international &mdash; solved, searchable and organised by topic.",
        "When a student meets a hard question, the worked solution and a matching practice set are one tap away.",
      ],
    }),
    featurePage({                                                     // 15 community
      n: 15, cap: "Community", kicker: "What We Do &mdash; 04",
      title: "The <em>community</em>.", image: IMG.features[3],
      paras: [
        "A nationwide network of learners and mentors who push each other forward, swap notes and celebrate wins.",
        "Nobody revises alone. Study groups, challenges and mentors turn a lonely grind into a shared climb.",
      ],
    }),
    videoPage(),                                                      // 16
    essayFull({                                                       // 17 a day in the life
      n: 17, cap: "Photo Essay", kicker: "A Day in the Life",
      quoteHTML: "The small daily <em>wins</em> that add up to a different result.",
      image: IMG.day,
    }),
    voicesPage(),                                                     // 18
    essayFull({                                                       // 19 pull quote
      n: 19, cap: "In Their Words", kicker: "In Their Words",
      quoteHTML: "&ldquo;He went from a <em>D7</em> to an A1 &mdash; and finally believes he&rsquo;s good at this.&rdquo;",
      image: IMG.quote,
    }),
    deckPage({                                                       // 20 results
      n: 20, cap: "Results", kicker: "The Results",
      title: "What changes.",
      items: [
        ["Grades", "The average matched student climbs two grade bands before their exam."],
        ["Confidence", "Mock-to-final anxiety drops once the CBT practice feels routine."],
        ["Consistency", "Weekly tutor check-ins keep momentum through the long term."],
        ["Trust", "Parents see the plan, the progress and the proof &mdash; in one place."],
      ],
    }),
    deckPage({                                                       // 21 our reach
      n: 21, cap: "Our Reach", kicker: "Across Nigeria",
      title: "Where we <em>are</em>.",
      items: REACH.map((r) => [r.city, r.note]),
    }),
    galleryPage(),                                                    // 22
    shell(                                                            // 23 gallery 2
      `<span class="fb-kicker">Gallery</span>
       <h2 class="fb-h1 fb-h1--sm">In <em>frame</em>.</h2>
       <div class="fb-grid4">${IMG.gallery2.map((o) => figure(o)).join("")}</div>
       <p class="fb-body">
         Faces from the work &mdash; the late-night revisions, the breakthroughs and
         the quiet focus that grades are really made of.
       </p>
       ${folio("23", "Gallery")}`,
      { n: 23 }
    ),
    deckPage({                                                       // 24 join us
      n: 24, cap: "Join Us", kicker: "Get Started",
      title: "Start in <em>minutes</em>.",
      items: [
        ["1 &middot; Create a free account", "Tell us the exam, the subjects and the timeline."],
        ["2 &middot; Get matched", "We pair your child with the right tutor and a starting plan."],
        ["3 &middot; Practise &amp; track", "Daily CBT practice with progress you can both follow."],
      ],
    }),
    backPage(),                                                       // 25 back cover
  ];
}

// Build the StPageFlip book inside the (already visible) modal — runs once.
function buildBook(modal) {
  const PageFlip = window.St && window.St.PageFlip;
  const bookEl = modal.querySelector("#fb-book");
  if (typeof PageFlip !== "function") {
    bookEl.innerHTML = `<div class="fb-error">Flipbook engine failed to load. Please refresh.</div>`;
    return null;
  }

  bookEl.innerHTML = PAGES().join("");

  // Size the spread from the viewport (like grammar-police): a single page is
  // ~0.72 of its height, so a spread needs ~1.44×. usePortrait lets the library
  // drop to one page when the viewport can't fit two side by side (mobile).
  // Leave room under the spread for the controls + hint row.
  const maxH = Math.round(Math.min(window.innerHeight * 0.82, 880));
  const maxW = Math.round(maxH * 0.72);

  const pageFlip = new PageFlip(bookEl, {
    width: 460,
    height: 640,
    size: "stretch",
    minWidth: 300,
    maxWidth: maxW,
    minHeight: 380,
    maxHeight: maxH,
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
