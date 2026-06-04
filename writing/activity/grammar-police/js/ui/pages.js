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
import { buildSentences, buildToken, updatePPProgress, wireDropZone } from "./punctuation.js";
import { photo } from "../data/assets.js";
import { wireTopicVideo, stopAllVideos } from "./video.js";
import { frontCoverInner, backCoverInner, dividerInner } from "./cover.js";
import { makeCrosswordPage, makeRebusPage } from "./puzzles.js";

let PAGE = { w: 600, h: 860 };
function computePageSize() {
  const h = Math.round(window.innerHeight * 0.96);
  PAGE = { w: Math.round(h * 0.7), h };
  return PAGE;
}

// ── Content pagination ───────────────────────────────────────────────────────
// Pages have a fixed size, so long content is flowed across as many pages as it
// needs (filling each before the next) instead of being clipped or overlapping.
// We measure at the REAL rendered page size in an offscreen host, then hand the
// same nodes (with their listeners) to StPageFlip.
let MEASURE = { w: 420, h: 820 };
function computeMeasureSize() {
  const maxH = Math.round(window.innerHeight * 0.96);
  const maxW = Math.round(maxH * 0.74);
  const clip = document.getElementById("gpBookClip");
  const clipW = clip ? clip.clientWidth : maxW * 2;
  // Landscape shows two pages side by side (each maxW); portrait is one page.
  const perPage = clipW >= maxW * 2 ? maxW : Math.min(maxW, clipW || maxW);
  MEASURE = { w: perPage, h: maxH };
  return MEASURE;
}
function getMeasureHost() {
  let host = document.getElementById("gpMeasureHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "gpMeasureHost";
    document.body.appendChild(host);
  }
  host.setAttribute("style", "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;");
  host.innerHTML = "";
  return host;
}
function htmlToBlocks(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = (html || "").trim();
  return Array.from(tmp.children);
}

// Flow `blocks` into a sequence of pages. `makeShell()` returns { page, mount }
// where `mount` is the multi-column flow container the blocks go into. Returns
// the array of page elements (detached, ready to append to the book).
function paginate(blocks, makeShell) {
  const host = getMeasureHost();
  const sizePage = (p) => { p.style.width = MEASURE.w + "px"; p.style.height = MEASURE.h + "px"; };
  // Force deterministic top-to-bottom fill while measuring (a spilled 3rd column
  // widens scrollWidth past the 2-column box → overflow detected).
  const startShell = () => {
    const s = makeShell();
    sizePage(s.page);
    s.mount.style.columnFill = "auto";
    host.appendChild(s.page);
    return s;
  };
  const overflowed = (mount) => mount.scrollWidth > mount.clientWidth + 2;

  const out = [];
  let shell = startShell();
  for (const block of blocks) {
    if (!block) continue;
    shell.mount.appendChild(block);
    if (overflowed(shell.mount) && shell.mount.childElementCount > 1) {
      shell.mount.removeChild(block);
      out.push(shell);
      shell = startShell();
      shell.mount.appendChild(block);
    }
  }
  out.push(shell);

  // Detach + clear measurement-only styling (render uses balanced columns).
  out.forEach((s) => {
    host.removeChild(s.page);
    s.page.style.width = "";
    s.page.style.height = "";
    s.mount.style.columnFill = "";
  });
  return out;
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
  !items.length ? "" : asideMini("hot", "H.O.T. Problems", `<ol>${items.map((q) => `<li>${q}</li>`).join("")}</ol>`, "rocket");
const realWorldMini = (unit) => {
  const rw = unit.realWorld || {};
  // The photo IS the card: no box/border, text written straight on the image.
  return `
    <aside class="gp-rwlink">
      ${photo(rw.image, rw.title || "", { w: 420, seed: unit.id })}
      <span class="gp-rwlink__label">Real-World Link</span>
      <div class="gp-rwlink__copy">
        ${rw.title ? `<strong class="gp-rwlink__cap">${rw.title}</strong>` : ""}
        <p>${rw.text || ""}</p>
      </div>
    </aside>`;
};

// ── Per-topic learning video card ────────────────────────────────────────────
function videoCard(unit) {
  const topic = `${unit.title} (${unit.focus})`.replace(/"/g, "&quot;");
  return `
    <div class="gp-tvid" data-col-span data-gp-topic-video data-topic="${topic}">
      <div class="gp-tvid__stage">
        <span class="gp-tvid__label">Learning Video</span>
        <button type="button" class="gp-tvid__btn" data-gp-vid-play>Watch a lesson video</button>
      </div>
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

// Two short intro paragraphs shown after Key Vocabulary on the opener.
function overviewParas(unit) {
  const terms = (unit.keyVocab || []).map((v) => v.term).filter(Boolean);
  const list = terms.length ? terms.slice(0, 4).join(", ") : "these words";
  if (unit.kind === "grammar") {
    return [
      `The words in this unit&mdash;${list}&mdash;sound alike or look alike, which is exactly why they trip writers up. The fix is never about spelling; it is about knowing the small job each word does inside a sentence.`,
      `Watch the lesson video, read the examples slowly, and try the Detective's Trick before every answer. Then move on to the practice passage, where you will choose the right word in real sentences and check your score.`,
    ];
  }
  return [
    `Punctuation marks are small but powerful: they tell the reader when to stop, when to ask a question, when to list, and what belongs to whom. This unit focuses on ${unit.focus || "using them correctly"}.`,
    `Study where each mark goes and why it belongs there. Then drag the marks into the exercise sentences and press Check&mdash;every page shows how many you have placed and how many are correct.`,
  ];
}

// ── Chapter opener — banner + video span both columns (video is exempt from
//    the column flow); Main Idea + Key Vocabulary flow in the two columns. ────
function makeOpenerPage(unit) {
  const banner = `
    <header class="gp-banner gp-banner--${unit.color}" data-col-span>
      <span class="gp-banner__tech" aria-hidden="true"></span>
      <span class="gp-banner__chapter">Unit ${unit.number} &middot; ${unit.kind === "grammar" ? "Grammar Police" : "Punctuation Patrol"}</span>
      <h2 class="gp-banner__title gp-3d gp-3d--${unit.color}">${unit.title}</h2>
      <span class="gp-banner__focus">${unit.focus}</span>
    </header>`;
  const blocks = [
    htmlToBlocks(banner)[0],
    htmlToBlocks(videoCard(unit))[0],
    htmlToBlocks(mainIdeaMini(unit.mainIdea))[0],
    htmlToBlocks(vocabMini(unit.keyVocab))[0],
    // Two paragraphs of intro text, right after Key Vocabulary.
    ...overviewParas(unit).map((p) => htmlToBlocks(`<p class="gp-overview">${p}</p>`)[0]),
  ].filter(Boolean);

  const makeShell = () => {
    const page = makePage();
    const pc = document.createElement("div");
    pc.className = `pc gp-opener gp-c-${unit.color}`;
    pc.innerHTML = sideTab(`Unit ${unit.number}`, unit.color);
    const cols = document.createElement("div");
    cols.className = "gp-cols2";
    pc.appendChild(cols);
    page.appendChild(pc);
    return { page, mount: cols };
  };

  return paginate(blocks, makeShell).map((s) => s.page);
}

// ── Lesson pages: explanation + trick/test + Study Tip / Real-World / H.O.T.
//    all flowed across two columns and as many pages as needed (usually 1-2). ─
function makeLessonPages(unit) {
  const blocks = [
    ...htmlToBlocks(unit.lesson.leftHTML),
    ...htmlToBlocks(unit.teach || ""),
    ...htmlToBlocks(unit.lesson.rightHTML),
    htmlToBlocks(studyTipMini(unit.studyTip))[0],
    htmlToBlocks(realWorldMini(unit))[0],
    ...htmlToBlocks(hotMini(unit.hot || [])),
  ].filter(Boolean);

  const makeShell = () => {
    const page = makePage();
    const pc = document.createElement("div");
    pc.className = `pc gp-lesson gp-c-${unit.color}`;
    pc.innerHTML = `<div class="gp-lesson__head"><span class="gp-lesson__tab gp-tab--${unit.color}">Lesson ${unit.number}</span><span class="gp-lesson__focus">${unit.focus}</span></div>`;
    const cols = document.createElement("div");
    cols.className = "gp-cols2";
    pc.appendChild(cols);
    page.appendChild(pc);
    return { page, mount: cols };
  };

  return paginate(blocks, makeShell).map((s) => s.page);
}

// ── Practice (grammar: choose word; punctuation: drag mark) ──────────────────
// All items flow across two columns; extra pages are only created when they
// don't fit. The Check/Reset + progress block flows as the LAST item inside the
// columns. The drag pool repeats on every page (punctuation only).
function makeGrammarPracticePages(unit, idx) {
  const passage = unit.passage;
  const itemsHost = document.createElement("div");
  renderParas(passage.paragraphs, idx, itemsHost);
  const blocks = Array.from(itemsHost.children);
  blocks.push(checkSection({ check: `data-gp-check="${idx}"`, reset: `data-gp-reset="${idx}"`, progId: `prog-${idx}`, progText: `prog-text-${idx}`, scoreId: `score-${idx}`, unit: "filled" }));

  const makeShell = () => {
    const page = makePage();
    page.dataset.passage = idx;
    const pc = document.createElement("div");
    pc.className = `pc pc--passage gp-c-${unit.color}`;
    pc.innerHTML = `<div class="pc-passage-header"><span class="pc-passage-label">Passage ${idx + 1}</span><strong class="pc-passage-title">${passage.title}</strong><span class="pc-focus-badge">${passage.focus}</span></div>`;
    const body = document.createElement("div");
    body.className = "pc-passage-body";
    pc.appendChild(body);
    page.appendChild(pc);
    return { page, mount: body };
  };

  const shells = paginate(blocks, makeShell);
  shells.forEach((s, i) => { if (i > 0) s.page.querySelector(".pc-passage-header")?.remove(); });
  return shells.map((s) => s.page);
}

function makePunctPracticePages(unit, idx) {
  const ex = unit.exercise;
  const itemsHost = document.createElement("div");
  buildSentences(ex.items, 0, ex.items.length, idx, itemsHost);
  const blocks = Array.from(itemsHost.children);
  blocks.push(checkSection({ check: `data-pp-check="${idx}"`, reset: `data-pp-reset="${idx}"`, progId: `ppProg-${idx}`, progText: `ppProgText-${idx}`, scoreId: `ppScore-${idx}`, unit: "placed" }));

  const poolStrip = () => {
    const pool = document.createElement("div");
    pool.className = "pp-pool-strip";
    pool.innerHTML = `<span class="pp-pool-label">Drag:</span><span class="pp-pool-tokens"></span>`;
    const tokens = pool.querySelector(".pp-pool-tokens");
    ex.pool.forEach((c) => tokens.appendChild(buildToken(c)));
    return pool;
  };

  const makeShell = () => {
    const page = makePage();
    const pc = document.createElement("div");
    pc.className = `pc pc--practice gp-c-${unit.color}`;
    pc.innerHTML = `<div class="pc-practice-header"><span class="pc-practice-label">Exercise ${idx + 1}</span><strong class="pc-practice-title">${ex.title}</strong><span class="pc-focus-badge">${ex.focus}</span></div>`;
    const items = document.createElement("div");
    items.className = "pp-items";
    wireDropZone(items);                  // each rendered page is its own drop zone
    pc.appendChild(items);
    pc.appendChild(poolStrip());          // drag pool on every page
    page.appendChild(pc);
    return { page, mount: items };
  };

  const shells = paginate(blocks, makeShell);
  shells.forEach((s, i) => { if (i > 0) s.page.querySelector(".pc-practice-header")?.remove(); });
  return shells.map((s) => s.page);
}

function checkSection({ check, reset, progId, progText, scoreId, unit }) {
  const d = document.createElement("div");
  d.className = "pc-check-section";
  d.innerHTML = `
    <div class="pc-progress"><div class="pc-progress-track"><div class="pc-progress-fill" id="${progId}"></div></div><span class="pc-progress-text" id="${progText}">0 / 0 ${unit}</span></div>
    <div class="pc-check-actions">
      <button class="pc-btn pc-btn--ghost pc-btn--icon" ${reset} aria-label="Reset" title="Reset"><i data-lucide="rotate-ccw" style="width:15px;height:15px;display:block"></i></button>
      <button class="pc-btn pc-btn--check pc-btn--icon" ${check} aria-label="Check" title="Check"><i data-lucide="check" style="width:15px;height:15px;display:block"></i></button>
    </div>
    <div class="pc-score" id="${scoreId}"></div>`;
  return d;
}

function makeDividerPage() {
  // Section divider mirrors the front cover (teal shade) but is a SOFT page —
  // a hard page mid-book breaks the spread and makes pages split when flipping.
  return htmlPage(`<div class="pc gp-cover gp-cover--teal">${dividerInner()}</div>`);
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
  // Back cover mirrors the front cover, in a purple shade.
  return htmlPage(`<div class="pc gp-cover gp-cover--purple" data-density="hard">${backCoverInner(state.book)}</div>`, "hard");
}

// ── Book assembly ────────────────────────────────────────────────────────────
export function buildBookPages() {
  const book = state.book;
  const bookEl = document.getElementById("gpBook");
  bookEl.innerHTML = "";
  computePageSize();
  computeMeasureSize();
  state.UNIT_START_PAGE = [];

  const pages = [];
  pages.push(makeCoverPage(book));
  const contentsIdx = pages.length;
  pages.push(null);
  pages.push(makeHowToPage());

  let passageIdx = 0, exerIdx = 0, dividerDone = false;
  book.units.forEach((unit, ui) => {
    if (unit.kind === "punctuation" && !dividerDone) {
      // Brain-break puzzles, then the section divider.
      pages.push(makeCrosswordPage());
      pages.push(makeRebusPage());
      pages.push(makeDividerPage());
      dividerDone = true;
    }
    state.UNIT_START_PAGE[ui] = pages.length;
    const openerPages = makeOpenerPage(unit);
    if (openerPages[0]) openerPages[0].dataset.page = `unit-${ui}`;
    openerPages.forEach((p) => pages.push(p));
    makeLessonPages(unit).forEach((p) => pages.push(p));
    if (unit.kind === "grammar") {
      makeGrammarPracticePages(unit, passageIdx).forEach((p) => pages.push(p));
      passageIdx++;
    } else {
      makePunctPracticePages(unit, exerIdx).forEach((p) => pages.push(p));
      exerIdx++;
    }
  });

  state.CHECKER_PAGE = pages.length;
  const checkerPage = makeCheckerPage(book);
  checkerPage.dataset.page = "checker";
  pages.push(checkerPage);
  pages.push(makeBackCoverPage());
  pages[contentsIdx] = makeContentsPage(book);
  pages[contentsIdx].dataset.page = "contents";

  pages.filter(Boolean).forEach((p) => bookEl.appendChild(p));

  // Sync the printed TOC page numbers to the ACTUAL rendered page positions, so
  // the number shown is exactly where a TOC tap lands (see main.js jumps).
  const allPages = [...bookEl.querySelectorAll(".page")];
  const pageNumByMarker = (m) => {
    const el = bookEl.querySelector(`.page[data-page="${m}"]`);
    return el ? allPages.indexOf(el) + 1 : null;
  };
  bookEl.querySelectorAll(".gp-toc__item[data-goto-unit]").forEach((li) => {
    const n = pageNumByMarker(`unit-${li.dataset.gotoUnit}`);
    const span = li.querySelector(".gp-toc__page");
    if (n && span) span.textContent = n;
  });
  const ckSpan = bookEl.querySelector(".gp-toc__item--special .gp-toc__page");
  if (ckSpan) {
    const n = pageNumByMarker("checker");
    if (n) ckSpan.textContent = n;
  }

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
