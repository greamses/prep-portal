// ============================================================================
// PAGE BUILDER - McGraw-Hill / Glencoe editorial flipbook.
//
// Sizing: StPageFlip "stretch" + usePortrait shows a two-page spread on wide
// screens and a single page on small screens, capped to ~96% of the viewport
// height (set in initPageFlip). Lesson content uses CSS two-column layout in
// tall pages so a page holds plenty before the spread turns.
//
// Each unit (topic) carries a Gemini-powered "Watch a lesson video" card; a
// page-flip stops any playing video, and clicks inside a video never flip.
// ============================================================================

import { state } from "../utils/state.js";
import { playFlipSound } from "../utils/audio.js";
import { renderParas, updateProgress } from "./grammar.js";
import { buildSentences, buildToken, updatePPProgress } from "./punctuation.js";
import { photo } from "../data/assets.js";
import { wireTopicVideo, stopAllVideos } from "./video.js";
import { frontCoverInner, backCoverInner } from "./cover.js";

let PAGE = { w: 600, h: 860 };
function computePageSize() {
  const h = Math.round(window.innerHeight * 0.96);
  PAGE = { w: Math.round(h * 0.7), h };
  return PAGE;
}

// ── DOM helpers ──────────────────────────────────────────────────────────────
function makePage(extraClass = "", density = null) {
  const div = document.createElement("div");
  div.className = `page${extraClass ? " " + extraClass : ""}`;
  if (density) div.dataset.density = density;
  return div;
}
function htmlPage(markup, density = null) {
  const p = makePage("", density);
  p.innerHTML = markup;
  return p;
}
const sideTab = (label, color = "blue") => `<span class="gp-tab gp-tab--${color}">${label}</span>`;

// ── Tiny corner asides ───────────────────────────────────────────────────────
const asideMini = (kind, title, bodyHTML, icon) => `
  <aside class="gp-mini gp-mini--${kind}">
    <p class="gp-mini__title">${title}</p>
    <div class="gp-mini__body">${bodyHTML}</div>
  </aside>`;
const mainIdeaMini = (t) => asideMini("idea", "Main Idea", `<p>${t}</p>`, "idea");
const studyTipMini = (t) => asideMini("tip", "Study Tip", `<p>${t}</p>`, "pencil");
const vocabMini = (items = []) =>
  asideMini("vocab", "Key Vocabulary", `<dl class="gp-vocab">${items.map((v) => `<div><dt>${v.term}</dt><dd>${v.def}</dd></div>`).join("")}</dl>`, "books");
const hotMini = (items = []) =>
  asideMini("hot", "H.O.T. Problems", `<ol>${items.map((q) => `<li>${q}</li>`).join("")}</ol>`, "rocket");
// H.O.T. as an absolute note pinned bottom-right of the page (not in the flow).
const hotNote = (items = []) =>
  !items.length ? "" : `
  <aside class="gp-hotnote">
    <p class="gp-hotnote__title">H.O.T. Problems</p>
    <ol>${items.map((q) => `<li>${q}</li>`).join("")}</ol>
  </aside>`;
const realWorldMini = (unit) => {
  const rw = unit.realWorld || {};
  return `
    <aside class="gp-mini gp-mini--rw">
      <p class="gp-mini__title">Real-World Link</p>
      <div class="gp-rw__photo">${photo(rw.image, rw.title || "", { w: 420, seed: unit.id })}<span class="gp-rw__cap">${rw.title || ""}</span></div>
      <div class="gp-mini__body"><p>${rw.text || ""}</p></div>
    </aside>`;
};

// ── Per-topic learning video card ────────────────────────────────────────────
function videoCard(unit) {
  const topic = `${unit.title} (${unit.focus})`.replace(/"/g, "&quot;");
  return `
    <div class="gp-tvid" data-gp-topic-video data-topic="${topic}">
      <p class="gp-tvid__label">Learning Video</p>
      <div class="gp-tvid__stage">
        <button type="button" class="gp-tvid__btn" data-gp-vid-play>Watch a lesson video</button>
      </div>
      <p class="gp-tvid__hint">Found for you with AI - tap to load.</p>
    </div>`;
}

// ── Front cover (reusable component, see cover.js) ───────────────────────────
function makeCoverPage(book) {
  return htmlPage(`<div class="pc gp-cover">${frontCoverInner(book)}</div>`, "hard");
}

// ── Contents ─────────────────────────────────────────────────────────────────
function makeContentsPage(book) {
  const grammar = [], punct = [];
  book.units.forEach((u, i) => (u.kind === "grammar" ? grammar : punct).push([u, i]));
  const row = ([u, i]) => `
    <li class="gp-toc__item" data-goto-unit="${i}">
      <span class="gp-toc__num">${String(u.number).padStart(2, "0")}</span>
      <span class="gp-toc__title">${u.title}</span>
      <span class="gp-toc__dots"></span>
      <span class="gp-toc__page">${(state.UNIT_START_PAGE[i] ?? 0) + 1}</span>
    </li>`;
  const section = (label, rows) => `<p class="gp-toc__section">${label}</p><ul class="gp-toc__list">${rows.map(row).join("")}</ul>`;
  return htmlPage(
    `<div class="pc gp-contents">
      ${sideTab("Contents", "blue")}
      <header class="gp-contents__head"><span class="gp-kicker">Field Manual</span><h2>Table of Contents</h2></header>
      ${section("Grammar Police", grammar)}
      ${section("Punctuation Patrol", punct)}
      <ul class="gp-toc__list"><li class="gp-toc__item gp-toc__item--special" data-goto-checker>
        <span class="gp-toc__num">AI</span><span class="gp-toc__title">Check My Writing - AI tool</span>
        <span class="gp-toc__dots"></span><span class="gp-toc__page">${(state.CHECKER_PAGE ?? 0) + 1}</span>
      </li></ul>
      <p class="gp-contents__tip">Tap any title to jump straight there.</p>
    </div>`
  );
}

// ── How this book works ──────────────────────────────────────────────────────
function makeHowToPage() {
  const steps = [
    ["Read & watch", "Each unit opens with the Main Idea, Key Vocabulary and a Learning Video found for you by AI."],
    ["Use the trick", "Try the Detective's Trick to decide which word or mark fits before you practise."],
    ["Do the activity", "Grammar: tap a blank and choose. Punctuation: drag a mark into the sentence."],
    ["Check & learn", "Press Check for an instant score, review the Study Tip, then beat your best."],
  ];
  return htmlPage(
    `<div class="pc gp-howto-page">
      ${sideTab("Start Here", "green")}
      <header class="gp-howto-page__head"><span class="gp-kicker">Before you begin</span><h2>How this book works</h2></header>
      <ol class="gp-howto">
        ${steps.map(([t, d], i) => `<li class="gp-howto__step"><span class="gp-howto__num">${i + 1}</span><div><strong>${t}</strong><p>${d}</p></div></li>`).join("")}
      </ol>
      <aside class="gp-howto-note"><p>Finish with the <strong>Check&nbsp;My&nbsp;Writing</strong> AI tool - paste your own work and the checker marks it instantly.</p></aside>
    </div>`
  );
}

// ── Chapter opener (banner + video + tiny corner asides) ─────────────────────
function makeOpenerPage(unit) {
  return htmlPage(
    `<div class="pc gp-opener gp-c-${unit.color}">
      ${sideTab(`Unit ${unit.number}`, unit.color)}
      <header class="gp-banner gp-banner--${unit.color}">
        <span class="gp-banner__tech" aria-hidden="true"></span>
        <span class="gp-banner__chapter">Unit ${unit.number} &middot; ${unit.kind === "grammar" ? "Grammar Police" : "Punctuation Patrol"}</span>
        <h2 class="gp-banner__title gp-3d gp-3d--${unit.color}">${unit.title}</h2>
        <span class="gp-banner__focus">${unit.focus}</span>
      </header>
      ${videoCard(unit)}
      <div class="gp-opener__corners">${mainIdeaMini(unit.mainIdea)}${vocabMini(unit.keyVocab)}</div>
    </div>`
  );
}

// ── Lesson pages: left = explanation (2 CSS columns), right = trick/test +
//    Study Tip / Real-World / H.O.T. corner asides ───────────────────────────
function makeLessonLeft(unit) {
  return htmlPage(
    `<div class="pc gp-lesson gp-c-${unit.color}">
      <div class="gp-lesson__head"><span class="gp-lesson__tab gp-tab--${unit.color}">Lesson ${unit.number}</span><span class="gp-lesson__focus">${unit.focus}</span></div>
      <div class="gp-cols2">${unit.lesson.leftHTML}${unit.teach || ""}</div>
    </div>`
  );
}
function makeLessonRight(unit) {
  // Study Tip + Real-World flow inside the two columns; H.O.T. is an absolute
  // note pinned to the bottom-right of the page.
  return htmlPage(
    `<div class="pc gp-lesson gp-lesson--right gp-c-${unit.color}">
      <div class="gp-lesson__head"><span class="gp-lesson__focus">${unit.title}</span><span class="gp-lesson__tab gp-tab--${unit.color}">Trick &amp; Test</span></div>
      <div class="gp-cols2">${unit.lesson.rightHTML}${studyTipMini(unit.studyTip)}${realWorldMini(unit)}</div>
      ${hotNote(unit.hot || [])}
    </div>`
  );
}

// ── Practice (grammar: choose word; punctuation: drag mark) ──────────────────
function makeGrammarPractice(unit, idx, side) {
  const passage = unit.passage;
  const page = makePage();
  page.dataset.passage = idx;
  const half = Math.ceil(passage.paragraphs.length / 2);
  const slice = side === "left" ? passage.paragraphs.slice(0, half) : passage.paragraphs.slice(half);
  const pc = document.createElement("div");
  pc.className = `pc pc--passage gp-c-${unit.color}`;
  if (side === "left") {
    pc.innerHTML = `<div class="pc-passage-header"><span class="pc-passage-label">Passage ${idx + 1}</span><strong class="pc-passage-title">${passage.title}</strong><span class="pc-focus-badge">${passage.focus}</span></div>`;
  }
  const body = document.createElement("div");
  body.className = "pc-passage-body";
  renderParas(slice, idx, body);
  pc.appendChild(body);
  if (side === "right") {
    pc.appendChild(checkSection({ check: `data-gp-check="${idx}"`, reset: `data-gp-reset="${idx}"`, progId: `prog-${idx}`, progText: `prog-text-${idx}`, scoreId: `score-${idx}`, unit: "filled" }));
  }
  page.appendChild(pc);
  return page;
}
function makePunctPractice(unit, idx, side) {
  const ex = unit.exercise;
  const page = makePage();
  const half = Math.ceil(ex.items.length / 2);
  const start = side === "left" ? 0 : half;
  const end = side === "left" ? half : ex.items.length;
  const pc = document.createElement("div");
  pc.className = `pc pc--practice gp-c-${unit.color}`;
  if (side === "left") {
    pc.innerHTML = `<div class="pc-practice-header"><span class="pc-practice-label">Exercise ${idx + 1}</span><strong class="pc-practice-title">${ex.title}</strong><span class="pc-focus-badge">${ex.focus}</span></div>`;
  }
  const items = document.createElement("div");
  items.className = "pp-items";
  buildSentences(ex.items, start, end, idx, items);
  pc.appendChild(items);

  // Drag pool on EVERY page that shows sentences (so marks are always to hand).
  const pool = document.createElement("div");
  pool.className = "pp-pool-strip";
  pool.innerHTML = `<span class="pp-pool-label">Drag:</span><span class="pp-pool-tokens"></span>`;
  ex.pool.forEach((c) => pool.querySelector(".pp-pool-tokens").appendChild(buildToken(c)));
  pc.appendChild(pool);

  if (side === "right") {
    pc.appendChild(checkSection({ check: `data-pp-check="${idx}"`, reset: `data-pp-reset="${idx}"`, progId: `ppProg-${idx}`, progText: `ppProgText-${idx}`, scoreId: `ppScore-${idx}`, unit: "placed" }));
  }
  page.appendChild(pc);
  return page;
}

function checkSection({ check, reset, progId, progText, scoreId, unit }) {
  const d = document.createElement("div");
  d.className = "pc-check-section";
  d.innerHTML = `
    <div class="pc-progress"><div class="pc-progress-track"><div class="pc-progress-fill" id="${progId}"></div></div><span class="pc-progress-text" id="${progText}">0 / 0 ${unit}</span></div>
    <div class="pc-check-actions">
      <button class="pc-btn pc-btn--ghost" ${reset}>Reset</button>
      <button class="pc-btn pc-btn--check" ${check}><i data-lucide="check" style="width:13px;height:13px;display:block;flex-shrink:0"></i>Check</button>
    </div>
    <div class="pc-score" id="${scoreId}"></div>`;
  return d;
}

function makeDividerPage() {
  return htmlPage(
    `<div class="pc gp-divider">
      <div class="gp-divider__rings" aria-hidden="true"></div>
      <span class="gp-divider__kicker">Section Two</span>
      <h2 class="gp-divider__title gp-3d gp-3d--teal">Punctuation<br>Patrol</h2>
      <p class="gp-divider__sub">Now drag the marks into place - full stops, question marks, commas and apostrophes.</p>
    </div>`
  );
}

function makeCheckerPage(book) {
  return htmlPage(
    `<div class="pc gp-checker" data-gp-checker>
      ${sideTab("AI Tool", "purple")}
      <header class="gp-banner gp-banner--purple">
        <span class="gp-banner__tech" aria-hidden="true"></span>
        <span class="gp-banner__chapter">Field Tool</span>
        <h2 class="gp-banner__title gp-3d gp-3d--purple">Check My Writing</h2>
        <span class="gp-banner__focus">powered by AI</span>
      </header>
      <p class="gp-checker__intro">Paste a sentence or two of your own writing. The checker will spot confusable words, punctuation and capital-letter slips - and explain each fix.</p>
      <textarea class="gp-checker__input" id="gpCheckerInput" maxlength="4000" placeholder="e.g. me and my freind went too the shop, their was alot of people."></textarea>
      <div class="gp-checker__actions">
        <button class="pc-btn pc-btn--check" id="gpCheckerRun"><i data-lucide="wand-sparkles" style="width:14px;height:14px;display:block;flex-shrink:0"></i>Check my writing</button>
        <button class="pc-btn pc-btn--ghost" id="gpCheckerClear">Clear</button>
      </div>
      <div class="gp-checker__result" id="gpCheckerResult" aria-live="polite"></div>
    </div>`
  );
}

function makeBackCoverPage() {
  return htmlPage(`<div class="pc gp-back" data-density="hard">${backCoverInner(state.book)}</div>`, "hard");
}

// ── Book assembly ────────────────────────────────────────────────────────────
export function buildBookPages() {
  const book = state.book;
  const bookEl = document.getElementById("gpBook");
  bookEl.innerHTML = "";
  computePageSize();
  state.UNIT_START_PAGE = [];

  const pages = [];
  pages.push(makeCoverPage(book));
  const contentsIdx = pages.length;
  pages.push(null);
  pages.push(makeHowToPage());

  let passageIdx = 0, exerIdx = 0, dividerDone = false;
  book.units.forEach((unit, ui) => {
    if (unit.kind === "punctuation" && !dividerDone) { pages.push(makeDividerPage()); dividerDone = true; }
    state.UNIT_START_PAGE[ui] = pages.length;
    pages.push(makeOpenerPage(unit));
    pages.push(makeLessonLeft(unit));
    pages.push(makeLessonRight(unit));
    if (unit.kind === "grammar") {
      pages.push(makeGrammarPractice(unit, passageIdx, "left"));
      pages.push(makeGrammarPractice(unit, passageIdx, "right"));
      passageIdx++;
    } else {
      pages.push(makePunctPractice(unit, exerIdx, "left"));
      pages.push(makePunctPractice(unit, exerIdx, "right"));
      exerIdx++;
    }
  });

  state.CHECKER_PAGE = pages.length;
  pages.push(makeCheckerPage(book));
  pages.push(makeBackCoverPage());
  pages[contentsIdx] = makeContentsPage(book);

  pages.filter(Boolean).forEach((p) => bookEl.appendChild(p));

  for (let i = 0; i < passageIdx; i++) updateProgress(i);
  for (let i = 0; i < exerIdx; i++) updatePPProgress(i);

  bookEl.querySelectorAll("[data-gp-topic-video]").forEach(wireTopicVideo);
  if (window.lucide) lucide.createIcons();
  state.bookBuilt = true;
}

export function initPageFlip(onFlip) {
  const book = document.getElementById("gpBook");
  const maxH = Math.round(window.innerHeight * 0.96);
  const maxW = Math.round(maxH * 0.74);
  state.pageFlip = new St.PageFlip(book, {
    width: PAGE.w,
    height: PAGE.h,
    size: "stretch",
    minWidth: 280,
    maxWidth: maxW,
    minHeight: 360,
    maxHeight: maxH,
    drawShadow: true,
    flippingTime: 700,
    maxShadowOpacity: 0.5,
    showCover: true,
    usePortrait: true,
    mobileScrollSupport: false,
    clickEventForward: false,
    // No pointer-driven flipping: StPageFlip's own mouse/touch handlers swallow
    // taps on mobile (video, slot delete, textarea focus). Turning them off lets
    // native taps/clicks/focus through; flipping is via the arrow buttons.
    useMouseEvents: false,
  });
  state.pageFlip.loadFromHTML(book.querySelectorAll(".page"));
  state.pageFlip.on("flip", () => { playFlipSound(); stopAllVideos(book); onFlip(); });
  state.pageFlip.on("changeState", (e) => { if (e.data === "flipping") stopAllVideos(book); });
  state.pageFlip.on("changeOrientation", onFlip);
}

export { stopAllVideos, computePageSize };
