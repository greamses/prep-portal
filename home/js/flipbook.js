// ============================================================================
// DIGITAL MAGAZINE FLIPBOOK  —  powered by StPageFlip (page-flip)
// "Who We Are & What We Do" — a fashion/travel-style editorial issue with
// full-bleed photography, an embedded YouTube feature and a per-page logo
// watermark. All imagery lives in ./flipbook-assets.js for easy updating.
// ============================================================================

import {
  IMG,
  VOICES,
  VIDEO,
  STATS,
  REACH,
  DEFAULT_EDITION,
  YEARBOOKS,
} from "/home/js/flipbook-assets.js";

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

// Generic page shell: optional decoration + watermark + padded inner. `n` drives
// the data-right side; `deco` injects a behind-content layer (e.g. doodles).
function shell(inner, { n, cls = "", wm = true, deco = "" } = {}) {
  const right = RIGHT.has(n) ? " data-right" : "";
  return `
  <div class="fb-page ${cls}"${right}>
    ${deco}
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

function featurePage({ n, cap, kicker, title, image, lede, paras }) {
  const body = paras.map((p) => `<p class="fb-body">${p}</p>`).join("");
  return shell(
    `<span class="fb-kicker">${kicker}</span>
     <h2 class="fb-h1 fb-h1--sm">${title}</h2>
     ${lede ? `<p class="fb-lede">${lede}</p>` : ""}
     ${figure(image, "fb-article__img fb-article__img--wide")}
     <div class="fb-cols">${body}</div>
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
function coverPage(ed) {
  return `
  <div class="fb-page fb-cover" data-density="hard">
    <div class="fb-page__inner">
      <div class="fb-cover__issue"><span>${ed.volume}</span><span>${ed.year}</span></div>
      <h1 class="fb-cover__title">Prep&nbsp;Portal</h1>
      <p class="fb-cover__sub">${ed.sub}</p>
      <div class="fb-cover__figure">
        ${img(ed.cover)}
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
      <div class="fb-cols">
        <p class="fb-body fb-dropcap">
          Every great result starts with one believer in a child&rsquo;s
          potential &mdash; one person who looks past a bad term or a hard subject
          and says, &ldquo;you can do this.&rdquo; We built Prep Portal to be that
          believer at scale, pairing the warmth of a great teacher with the
          precision of tools that never tire and never lose patience.
        </p>
        <p class="fb-body">
          We know the weight you carry. School fees, lesson teachers, the quiet
          worry before every results day. We built this for the parent checking
          a phone at midnight, hoping the next exam goes differently &mdash; and
          for the student who just needs to be shown, clearly and kindly, how.
        </p>
        <p class="fb-body">
          In this issue we open our doors: who we are, what we do, the people who
          make it work and the families whose stories keep us going. No jargon,
          no theatre &mdash; just an honest look at how we turn effort into
          outcomes. Thank you for trusting us with the thing that matters most.
          Welcome in.
        </p>
      </div>
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
          every Nigerian family &mdash; not just the lucky few who can afford a
          house full of lesson teachers.
        </p>
        <p class="fb-body">
          Some of us spent years in classrooms and know exactly where students
          lose marks. Some of us build the software that turns those hard-won
          lessons into practice a child can do on a phone, after school, anywhere.
          Together we obsess over one question: what actually moves a grade?
        </p>
        <p class="fb-body">
          From Lagos to Maiduguri, we pair each learner with people who believe in
          them &mdash; and back that belief with technology that proves it on exam
          day. We are not a faceless app. We are a team that celebrates every
          distinction like it is our own, because in a real sense it is. Human
          first, always.
        </p>
      </div>
      ${folio("05", "Who We Are")}
    </div>
  </div>`;
}

function whatPage() {
  const deck = [
    ["Smart Practice", "A CBT-accurate question bank across JAMB, WAEC, NECO &amp; IGCSE &mdash; with instant, explained feedback so every wrong answer becomes the next thing learned."],
    ["Matched Tutoring", "One-to-one tutors paired to each child by subject and style, with weekly progress notes parents actually read and trust."],
    ["Exam Archive", "Years of past papers, national and international, fully solved and searchable by topic &mdash; the real questions, the real way they are asked."],
    ["Community", "A nationwide network of learners and mentors who push each other forward, swap notes and turn a lonely revision grind into a shared climb."],
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
        Three minutes inside Prep Portal &mdash; the tutors who stay late, the
        students who finally get it, and the small daily wins that quietly add up
        to a different result. Press play and meet the people behind the platform.
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
        them &mdash; and the tools to prove it. Behind each photograph is a real
        learner somewhere in Nigeria, a little closer to the grade they came for.
        This is what we do, every single day.
      </p>
      ${folio("22", "Gallery")}
    </div>
  </div>`;
}

function backPage(ed) {
  return `
  <div class="fb-page fb-back" data-density="hard">
    <div class="fb-back__bg">${img(ed.back)}</div>
    <div class="fb-page__inner">
      <p class="fb-back__mast">Prep Portal &middot; ${ed.yearShort}</p>
      <h2 class="fb-back__title">Your child&rsquo;s<br /><em>grade</em> is next.</h2>
      <p class="fb-back__text">
        Join thousands of Nigerian families turning exam stress into real results
        &mdash; with a tutor who believes in your child and the tools to prove it.
        It costs nothing to begin, and the next grade starts the moment you do.
      </p>
      <a class="fb-cta" href="/subscribe.html">Start Free Revision</a>
      <p class="fb-back__url">prepportal.com.ng</p>
    </div>
  </div>`;
}

// ── Yearbook pages ──────────────────────────────────────────────────────────
// A different artifact from the magazine: cover → Head's foreword → the
// graduating SETS (each a divider + a card grid) → highlights → farewell. Each
// year carries its own colour + doodle motif (set via ed.themeClass on the
// book) so the three editions read as distinct designs.

// Hand-drawn background doodles, tinted by the year's accent (currentColor).
const DOODLE = {
  stars: `
    <path d="M60 70 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6z"/>
    <path d="M330 120 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4z"/>
    <path d="M280 430 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5z"/>
    <circle cx="100" cy="300" r="9"/><circle cx="350" cy="320" r="6"/>
    <circle cx="50" cy="470" r="7"/><circle cx="200" cy="60" r="6"/>
    <path d="M150 500 q12 -18 24 0" fill="none" stroke-width="5"/>
    <path d="M300 230 q12 -18 24 0" fill="none" stroke-width="5"/>`,
  waves: `
    <path d="M30 90 q20 -22 40 0 t40 0 t40 0" fill="none" stroke-width="6"/>
    <path d="M250 150 q20 -22 40 0 t40 0" fill="none" stroke-width="6"/>
    <path d="M40 470 q20 -22 40 0 t40 0 t40 0" fill="none" stroke-width="6"/>
    <circle cx="320" cy="380" r="26" fill="none" stroke-width="6"/>
    <circle cx="320" cy="380" r="13"/>
    <circle cx="90" cy="250" r="20" fill="none" stroke-width="6"/>
    <path d="M280 60 l26 0 -13 22z"/><path d="M150 320 l24 0 -12 20z"/>`,
  loops: `
    <path d="M40 100 c0 -30 44 -30 44 0 c0 30 -44 30 -44 60" fill="none" stroke-width="6"/>
    <path d="M300 200 c0 -26 38 -26 38 0 c0 26 -38 26 -38 52" fill="none" stroke-width="6"/>
    <path d="M70 360 c20 -16 40 16 60 0" fill="none" stroke-width="6"/>
    <path d="M250 430 c0 -14 22 -14 22 0 c0 14 -22 14 -22 0z"/>
    <path d="M110 470 c0 -12 18 -12 18 0 c0 12 -18 12 -18 0z"/>
    <path d="M330 90 v26 M317 103 h26"/><path d="M180 280 v22 M169 291 h22"/>`,
};
function ybDoodles(motif) {
  const shapes = DOODLE[motif] || DOODLE.stars;
  return `<div class="yb-doodles" aria-hidden="true"><svg viewBox="0 0 400 560" fill="currentColor" stroke="currentColor" stroke-width="0">${shapes}</svg></div>`;
}

// Smooth, organic "amoeba" blob path — its lumps vary by seed so the paint
// morphs differently on each page.
const rnd = (s) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function amoebaPath(cx, cy, r, seed, n = 9) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.58 + 0.6 * rnd(seed * 7.3 + i));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const f = (v) => v.toFixed(1);
  const start = mid(pts[n - 1], pts[0]);
  let d = `M ${f(start[0])} ${f(start[1])} `;
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const m = mid(cur, pts[(i + 1) % n]);
    d += `Q ${f(cur[0])} ${f(cur[1])} ${f(m[0])} ${f(m[1])} `;
  }
  return d + "Z";
}

// "Paint print" decor — amoebic blobs in alternating accents, morphing per page.
function ybPaint(seed = 1) {
  let drops = "";
  for (let i = 0; i < 6; i++) {
    const dx = 30 + rnd(seed * 3.1 + i) * 340;
    const dy = 30 + rnd(seed * 5.7 + i * 2) * 500;
    const dr = 3 + rnd(seed + i * 1.7) * 5;
    const fill = i % 2 ? "var(--yb-accent-2)" : "var(--yb-accent)";
    drops += `<circle cx="${dx.toFixed(0)}" cy="${dy.toFixed(0)}" r="${dr.toFixed(1)}" fill="${fill}"/>`;
  }
  return `<div class="yb-paint" aria-hidden="true"><svg viewBox="0 0 400 560">
    <path d="${amoebaPath(118, 150, 126, seed)}" fill="var(--yb-accent)"/>
    <path d="${amoebaPath(300, 410, 152, seed + 3, 10)}" fill="var(--yb-accent-2)"/>
    <path d="${amoebaPath(330, 116, 76, seed + 7, 8)}" fill="var(--yb-accent)"/>
    ${drops}
  </svg></div>`;
}

// Per-book background decor: doodles or paint print (seeded so paint morphs).
function ybDecor(ed, seed = 1) {
  return ed.decor === "paint" ? ybPaint(seed) : ybDoodles(ed.motif);
}

// Split an array into fixed-size chunks (for paginating big sets across pages).
const chunkArr = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

function ybCover(ed) {
  return `
  <div class="fb-page yb-cover" data-density="hard">
    <div class="yb-cover__bg">${img(ed.cover)}</div>
    ${ybDecor(ed, 1)}
    <div class="fb-page__inner yb-cover__inner">
      <p class="yb-cover__school">Prep Portal Academy</p>
      <p class="yb-cover__word">The Yearbook</p>
      <p class="yb-cover__year">${ed.year}</p>
      <span class="yb-cover__rule"></span>
      <p class="yb-cover__class">Class of ${ed.classOf}</p>
    </div>
  </div>`;
}

function ybForeword(ed, n) {
  const body = ed.foreword.map((p) => `<p class="fb-body">${p}</p>`).join("");
  return shell(
    `<span class="fb-kicker">From the Head of School</span>
     <h2 class="fb-h1 fb-h1--sm">A word of <em>farewell</em>.</h2>
     <div class="fb-cols">${body}</div>
     <p class="fb-sign">— ${ed.headName}, Head of School</p>
     ${folio(pad(n), "Foreword")}`,
    { n, cls: "yb-page", wm: false, deco: ybDecor(ed, n) }
  );
}

function ybContents(ed, n) {
  const items = ed.cohorts
    .map(
      (c) => `
      <li class="yb-sets__item">
        <span class="yb-sets__stage">${c.stage}</span>
        <span class="yb-sets__name">${c.name}</span>
        <span class="yb-sets__count">${c.students.length} graduands</span>
      </li>`
    )
    .join("");
  return shell(
    `<span class="fb-kicker">The Graduating Sets</span>
     <h2 class="fb-h1 fb-h1--sm">Class of <em>${ed.classOf}</em>.</h2>
     <ol class="yb-sets">${items}</ol>
     ${folio(pad(n), "Contents")}`,
    { n, cls: "yb-page", wm: false, deco: ybDecor(ed, n) }
  );
}

// Set divider ("split page"). A sticky note is pinned on, holding the class's
// own one-paragraph summary of their journey.
function ybDivider(c, ed, n, ci = 0) {
  return `
  <div class="fb-page yb-divider">
    <div class="yb-divider__img">${img(c.photo)}</div>
    ${ybDecor(ed, n)}
    <div class="fb-page__inner yb-divider__inner">
      <span class="yb-divider__stage">${c.stage}</span>
      <h2 class="yb-divider__name">${c.name}</h2>
      <p class="yb-divider__class">Class of ${ed.classOf}</p>
    </div>
    <figure class="yb-note yb-note--c${(ci % 5) + 1} yb-divider__sticky">
      <p class="yb-note__msg">${c.summary}</p>
      <figcaption class="yb-note__by">— ${c.name}</figcaption>
    </figure>
  </div>`;
}

// One graduand card. Two per-book styles:
//   • "side"    — details on the left, photo on the right
//   • "beneath" — photo on top (jagged edge), name beneath, long shadow
// Irregular torn-paper clip-path — varied spacing & depth around the perimeter,
// seeded so each card tears differently (no repeating sawtooth).
function tearPath(seed) {
  let k = seed * 13.7 + 1;
  const step = () => 3.5 + rnd(k++) * 6.5; // 3.5–10% spacing (irregular)
  const depth = () => rnd(k++) * 4.2; // 0–4.2% inset
  const cl = (v) => Math.max(0, Math.min(100, v));
  const pts = [];
  const push = (x, y) => pts.push(`${cl(x).toFixed(1)}% ${cl(y).toFixed(1)}%`);
  let x = 0, y = 0;
  push(0, depth());
  while (x < 100) { x = Math.min(100, x + step()); push(x, depth()); }     // top →
  while (y < 100) { y = Math.min(100, y + step()); push(100 - depth(), y); } // right ↓
  x = 100;
  while (x > 0) { x = Math.max(0, x - step()); push(x, 100 - depth()); }    // bottom ←
  y = 100;
  while (y > 0) { y = Math.max(0, y - step()); push(depth(), y); }          // left ↑
  return `polygon(${pts.join(", ")})`;
}

function ybCard(s, c, ed, seed = 0) {
  const photo = `<div class="yb-card__photo">${img(s.portrait)}</div>`;
  if (ed.cardStyle === "beneath") {
    // Outer figure carries the (unclipped) triple shadow; inner body carries the
    // torn-paper clip-path. They must be separate elements — clip-path applies
    // after filter, so a shared element would clip the drop-shadows away.
    const tear = tearPath(seed);
    return `
      <figure class="yb-card yb-card--beneath">
        <div class="yb-card__body" style="clip-path:${tear};-webkit-clip-path:${tear}">
          ${photo}
          <figcaption class="yb-card__detail">
            <span class="yb-card__name">${s.name}</span>
            <span class="yb-card__tag">${c.name}</span>
          </figcaption>
        </div>
      </figure>`;
  }
  return `
    <figure class="yb-card">
      <figcaption class="yb-card__detail">
        <span class="yb-card__tag">${c.name}</span>
        <span class="yb-card__name">${s.name}</span>
        <span class="yb-card__meta">Class of ${ed.classOf}</span>
      </figcaption>
      ${photo}
    </figure>`;
}

// Card grid — 2 columns × 3 rows. Big sets paginate; every page of a book
// carries that book's own decor (doodles or paint print).
function ybGrid(c, ed, n, part = 0, total = 1) {
  const cards = c.students.map((s, i) => ybCard(s, c, ed, n * 31 + i + 1)).join("");
  const partLabel =
    total > 1 ? `<span class="yb-grid__part">Part ${part + 1} of ${total}</span>` : "";
  const gridCls = ed.cardStyle === "beneath" ? "yb-grid yb-grid--beneath" : "yb-grid";
  return shell(
    `<div class="yb-grid__head">
       <span class="fb-kicker">${c.stage}</span>
       <h3 class="yb-grid__title">${c.name}</h3>
       ${partLabel}
     </div>
     <div class="${gridCls}">${cards}</div>
     ${folio(pad(n), c.name)}`,
    { n, cls: "yb-page", wm: false, deco: ybDecor(ed, n) }
  );
}

function ybHighlights(ed, n) {
  const photos = IMG[ed.highlightSet] || IMG.gallery;
  const grid = `<div class="fb-grid4">${photos.map((o) => figure(o)).join("")}</div>`;
  const deck = ed.highlights
    .map(
      ([t, d]) =>
        `<div class="fb-deck__item"><h3 class="fb-deck__title">${t}</h3><p class="fb-deck__text">${d}</p></div>`
    )
    .join("");
  return shell(
    `<span class="fb-kicker">The Year in Review</span>
     <h2 class="fb-h1 fb-h1--sm">Moments we&rsquo;ll <em>keep</em>.</h2>
     ${grid}
     <div class="fb-deck fb-deck--aside">${deck}</div>
     ${folio(pad(n), "Highlights")}`,
    { n, cls: "yb-page", wm: false, deco: ybDecor(ed, n) }
  );
}

function ybSignoff(ed, n) {
  return shell(
    `<span class="fb-kicker">Until We Meet Again</span>
     <h2 class="fb-h1">Go <em>shine</em>.</h2>
     <p class="fb-lede">${ed.signoff}</p>
     <p class="fb-sign">— Prep Portal Academy, Class of ${ed.classOf}</p>
     ${folio(pad(n), "Farewell")}`,
    { n, cls: "yb-page", wm: false, deco: ybDecor(ed, n) }
  );
}

function ybBack(ed) {
  return `
  <div class="fb-page fb-back yb-back" data-density="hard">
    <div class="fb-back__bg">${img(ed.back)}</div>
    ${ybDecor(ed, 7)}
    <div class="fb-page__inner">
      <p class="fb-back__mast">Prep Portal Academy &middot; ${ed.yearShort}</p>
      <h2 class="fb-back__title">Class of<br /><em>${ed.classOf}</em>.</h2>
      <p class="fb-back__text">
        Congratulations to every graduand of the Sunbeams, the Trailblazers and
        the Luminaries. Wherever you go next, you carry us with you.
      </p>
      <p class="fb-back__url">prepportal.com.ng</p>
    </div>
  </div>`;
}

// A yearbook in reading order. The cover is alone, then spreads run in pairs,
// then the back cover. Each set gets a divider followed by one or more card
// pages (a big set such as Nursery spills onto two or three pages). Page numbers
// are assigned sequentially so the folios and spread parity stay correct.
function YEARBOOK_PAGES(ed) {
  const pages = [];
  let n = 0;
  const push = (html) => pages.push(html);

  push(ybCover(ed)); n++;             // 01 cover
  push(ybForeword(ed, ++n));          // 02 foreword
  push(ybContents(ed, ++n));          // 03 contents

  // Beneath-style cards use a 2-row grid (4/page) so faces aren't cut by the
  // jagged edge; side cards use 3 rows (6/page).
  const per = ed.cardStyle === "beneath" ? 4 : 6;
  ed.cohorts.forEach((c, ci) => {
    push(ybDivider(c, ed, ++n, ci));  // split page + journey sticky note
    const parts = chunkArr(c.students, per);
    parts.forEach((students, i) => {
      push(ybGrid({ ...c, students }, ed, ++n, i, parts.length));
    });
  });

  push(ybHighlights(ed, ++n));        // year in review
  push(ybSignoff(ed, ++n));           // farewell
  push(ybBack(ed)); n++;              // back cover
  return pages;
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
function teaserHTML(ed) {
  return `
  <div class="fb-teaser" data-edition="${ed.id}">
    <button type="button" class="fb-teaser__cover" data-open aria-label="Open ${ed.editionName}">
      ${img(ed.cover)}
      <span class="fb-teaser__veil"></span>
      <span class="fb-teaser__top">
        <span class="fb-teaser__issue">${ed.volume} — ${ed.year}</span>
        <span class="fb-teaser__title">Prep&nbsp;Portal</span>
        <span class="fb-teaser__sub">${ed.sub}</span>
      </span>
      <span class="fb-teaser__play">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
      </span>
      <span class="fb-teaser__cta">Read the issue</span>
    </button>
    <div class="fb-teaser__meta">${metaHTML(ed.meta)}</div>
  </div>`;
}

// Render the teaser meta row (dot-separated), defaulting to the magazine line.
function metaHTML(meta = ["25 Pages", "Digital Edition", "Featuring Video"]) {
  return meta.map((m) => `<span>${m}</span>`).join("<i></i>");
}

function modalHTML(ed) {
  return `
  <div class="fb-modal" data-modal role="dialog" aria-modal="true" aria-label="Prep Portal — ${ed.editionName}">
    <div class="fb-modal__backdrop" data-backdrop></div>
    <span class="fb-modal__label">Prep Portal — ${ed.editionName}</span>
    <button type="button" class="fb-modal__close" data-close aria-label="Close magazine">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
    </button>
    <div class="fb-modal__dialog">
      <div class="fb-stage">
        <div class="fb-book" data-book></div>
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
function PAGES(ed) {
  return [
    coverPage(ed),                                                    // 01 cover
    contentsPage(),                                                    // 02
    editorPage(),                                                      // 03
    deckPage({                                                        // 04 masthead
      n: 4, cap: "Masthead", kicker: "Masthead", title: "The people behind the page.",
      items: [
        ["Editorial", "Written by the Prep Portal learning team in Lagos &mdash; tutors and educators who spend their days where the marks are won and lost."],
        ["Photography", "Drawn from our own students, tutors and classrooms across Nigeria &mdash; real faces from real revision, not stock pretending to be."],
        ["Design &amp; Build", "Crafted by the Prep Portal product studio, the people who turn hard-won teaching into software a child can use on a phone."],
        ["Published", "Prep Portal &middot; Volume I &middot; 2026. An open look at who we are, what we do and the families who make the work worth it."],
      ],
    }),
    whoPage(),                                                        // 05
    featurePage({                                                     // 06 our story
      n: 6, cap: "Our Story", kicker: "Section 01 &mdash; Our Story",
      title: "How we <em>began</em>.", image: IMG.story,
      lede: "It started with a frustration we couldn&rsquo;t shake.",
      paras: [
        "Brilliant Nigerian students were being held back not by ability, but by access &mdash; to good tutors, to honest feedback, to past questions that actually mirrored the real exam. Talent was everywhere; the support to prove it was not.",
        "We had watched it up close. A capable child stuck on the same topic for a term because no one had the time to sit with them. A parent paying for lessons with no way to know if any of it was working. A whole generation judged by an exam they were never properly prepared for.",
        "So we built the platform we wished we&rsquo;d had: human tutoring at scale, exam-accurate practice that feels exactly like the real thing, and parents kept genuinely in the loop at every step. Not a shortcut &mdash; a fair shot. That first idea still drives every decision we make today.",
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
      lede: "Every child deserves a believer &mdash; and the tools to prove the belief right.",
      paras: [
        "Our mission is simple to say and hard to do: make world-class exam preparation personal and affordable for every Nigerian family, and keep it that way as we grow. Not a premium product for a few, but a fair standard for all.",
        "We measure ourselves by one number that matters &mdash; the grade a student walks away with, and the confidence they carry into the hall on the day. Everything else, every feature and every tutor match, exists to move that one number.",
        "It is a promise we make deliberately, because it is one we intend to keep. When a student succeeds, the credit is theirs. Our job is to make sure nothing outside of effort and ability ever stands between them and the result they earned.",
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
        ["Human first", "Technology amplifies great teaching &mdash; it never replaces it. A warm tutor and a smart tool, working together, beat either one alone."],
        ["Proof, not promises", "Every claim we make is one a student can feel in their own results. We would rather show you a grade than sell you a slogan."],
        ["Access for all", "World-class preparation should not depend on a postcode or a price tag. Talent is everywhere; we work to make sure opportunity is too."],
        ["Honest feedback", "Kind, specific and on time &mdash; for students and parents alike. Real progress needs the truth, delivered gently and early enough to act on."],
      ],
    }),
    whatPage(),                                                       // 11
    featurePage({                                                     // 12 smart practice
      n: 12, cap: "Smart Practice", kicker: "What We Do &mdash; 01",
      title: "Smart <em>practice</em>.", image: IMG.features[0],
      lede: "Practice that feels exactly like the real exam &mdash; minus the surprises.",
      paras: [
        "Our question bank is CBT-accurate across JAMB, WAEC, NECO and IGCSE: the same formats, the same timing, the same way questions are phrased on the day. By the time a student sits the real thing, nothing about it feels unfamiliar.",
        "Every answer comes with instant, explained feedback, so a wrong attempt is never a dead end &mdash; it is the next thing learned. Students see not just that they missed a mark, but precisely why, and how to get it next time.",
        "Adaptive sets then focus each session on exactly what a learner hasn&rsquo;t mastered yet, quietly steering them toward their weak spots. Practice time is never wasted on what they can already do. Every minute is spent where it changes the score.",
      ],
    }),
    featurePage({                                                     // 13 tutoring
      n: 13, cap: "Matched Tutoring", kicker: "What We Do &mdash; 02",
      title: "Matched <em>tutoring</em>.", image: IMG.features[1],
      lede: "The right tutor, chosen on purpose &mdash; never assigned at random.",
      paras: [
        "Each learner is paired with a tutor selected for their subject, their learning style and their schedule. A shy student gets patience; a fast one gets a challenge. The match matters as much as the material, and we treat it that way.",
        "Sessions are one-to-one and built around a plan, not a script. Tutors know where the student started, what they&rsquo;re aiming for and exactly which topics are standing between the two &mdash; so every hour spent together moves the needle.",
        "And parents are never left guessing. They get short, clear updates they actually read: honest notes on progress, effort and the next milestone. No jargon, no inflated praise &mdash; just a real picture of how things are going, week by week.",
      ],
    }),
    featurePage({                                                     // 14 archive
      n: 14, cap: "Exam Archive", kicker: "What We Do &mdash; 03",
      title: "The <em>archive</em>.", image: IMG.features[2],
      lede: "Every past question, solved &mdash; the real ones, asked the real way.",
      paras: [
        "We&rsquo;ve gathered years of past papers, national and international, and done the hard part: every one is fully worked, searchable and organised by topic. The questions that actually come up, in the exact form examiners favour.",
        "When a student meets a hard question, they don&rsquo;t stall. The worked solution and a matching set of practice questions are one tap away, turning a moment of stuck into a small lesson and then into mastery of that whole question type.",
        "Patterns reveal themselves quickly. Students learn to recognise the handful of ways a topic is tested, and to answer on sight. Familiarity becomes confidence, and confidence is what carries a learner calmly through a three-hour paper.",
      ],
    }),
    featurePage({                                                     // 15 community
      n: 15, cap: "Community", kicker: "What We Do &mdash; 04",
      title: "The <em>community</em>.", image: IMG.features[3],
      lede: "Because nobody should have to revise alone.",
      paras: [
        "Prep Portal is a nationwide network of learners and mentors who push each other forward &mdash; sharing notes, comparing methods and celebrating each other&rsquo;s wins. The energy of a great study group, scaled across the whole country.",
        "Study groups, challenges and friendly competition turn a lonely grind into a shared climb. A student stuck at 11pm can find someone who cracked the same problem yesterday, and a small win posted today can lift a dozen others tomorrow.",
        "Mentors who have walked the same path show up to remind everyone it is possible. The result is momentum: a culture where working hard is normal, asking for help is easy, and every learner is carried by the ones around them.",
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
      title: "What <em>changes</em>.",
      items: [
        ["Grades", "The average matched student climbs two grade bands before their exam &mdash; the difference between scraping by and standing out."],
        ["Confidence", "Mock-to-final anxiety drops sharply once the CBT practice feels routine. Students walk in expecting the paper instead of fearing it."],
        ["Consistency", "Weekly tutor check-ins keep momentum through the long, hard middle of the term, when good intentions usually quietly fade away."],
        ["Trust", "Parents see the plan, the progress and the proof in one place &mdash; and finally stop wondering whether the money is doing anything."],
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
         Faces from the work &mdash; the late-night revisions, the breakthroughs at
         the kitchen table, and the quiet, ordinary focus that grades are really
         made of. No two journeys here look the same, and that is exactly the
         point: personal preparation, one determined student at a time.
       </p>
       ${folio("23", "Gallery")}`,
      { n: 23 }
    ),
    deckPage({                                                       // 24 join us
      n: 24, cap: "Join Us", kicker: "Get Started",
      title: "Start in <em>minutes</em>.",
      items: [
        ["1 &middot; Create a free account", "Tell us the exam, the subjects and the timeline. It takes a few minutes and costs nothing to begin."],
        ["2 &middot; Get matched", "We pair your child with the right tutor and a starting plan built around where they are and where they need to be."],
        ["3 &middot; Practise &amp; track", "Daily CBT practice and weekly check-ins, with clear progress you and your child can both follow all the way to the exam."],
      ],
    }),
    backPage(ed),                                                     // 25 back cover
  ];
}

// Build the StPageFlip book inside the (already visible) modal — runs once.
function buildBook(modal, ed) {
  const PageFlip = window.St && window.St.PageFlip;
  const bookEl = modal.querySelector("[data-book]");
  if (typeof PageFlip !== "function") {
    bookEl.innerHTML = `<div class="fb-error">Flipbook engine failed to load. Please refresh.</div>`;
    return null;
  }

  const pages = ed.kind === "yearbook" ? YEARBOOK_PAGES(ed) : PAGES(ed);
  bookEl.classList.toggle("fb-book--yearbook", ed.kind === "yearbook");
  if (ed.themeClass) bookEl.classList.add(ed.themeClass);
  bookEl.innerHTML = pages.join("");

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

// Create the full-screen modal for one edition (on <body> so no ancestor can
// clip it) and wire its open/close behaviour. Returns an `open` handler that a
// teaser/card click can call. Building is lazy — it runs the first time the
// modal is opened, when sizing can be measured correctly.
function attachModal(ed) {
  const modal = document.createElement("div");
  modal.innerHTML = modalHTML(ed);
  const modalEl = modal.firstElementChild;
  document.body.appendChild(modalEl);

  let pageFlip = null;
  let built = false;
  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    modalEl.classList.add("is-open");
    document.body.classList.add("fb-modal-open");
    requestAnimationFrame(() => {
      if (!built) {
        pageFlip = buildBook(modalEl, ed);
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

  modalEl.querySelector("[data-close]")?.addEventListener("click", close);
  modalEl.querySelector("[data-backdrop]")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("is-open")) close();
  });

  return open;
}

// ── Public API ──────────────────────────────────────────────────────────────
// Single flagship issue (homepage): one cover teaser → one flipbook modal.
export function initFlipbook({ containerId, edition = DEFAULT_EDITION }) {
  const host = document.getElementById(containerId);
  if (!host) {
    console.error(`[flipbook] container "#${containerId}" not found.`);
    return;
  }

  host.innerHTML = teaserHTML(edition);
  const open = attachModal(edition);
  host.querySelector("[data-open]")?.addEventListener("click", open);
}

// Yearbook shelf (Editorials page): a row of cover teasers, each opening its
// own full flipbook edition.
export function initYearbookShelf({ containerId, editions = YEARBOOKS }) {
  const host = document.getElementById(containerId);
  if (!host) {
    console.error(`[flipbook] container "#${containerId}" not found.`);
    return;
  }

  host.innerHTML = `<div class="fb-shelf">${editions.map(teaserHTML).join("")}</div>`;

  editions.forEach((ed) => {
    const card = host.querySelector(`[data-edition="${ed.id}"]`);
    if (!card) return;
    const open = attachModal(ed);
    card.querySelector("[data-open]")?.addEventListener("click", open);
  });
}
