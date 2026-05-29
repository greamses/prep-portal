// ════════════════════════════════════════════════════════════════════════
// PAGE BUILDER — editorial, McGraw-Hill / Glencoe–style flipbook.
// Consumes the unified book model (state.book, loaded from /api/grammar/book)
// and renders, per unit: a colour-banded chapter opener (Main Idea + Key
// Vocabulary + guide mascot), a Real-World Link photo card with a Study Tip,
// the two-page lesson, the two-page practice (with an H.O.T. Problems box),
// plus a closing AI "Check My Writing" tool and a feature video.
// All grammar/punctuation INTERACTIONS are unchanged — they are wired by
// grammar.js / punctuation.js exactly as before.
// ════════════════════════════════════════════════════════════════════════

import { state } from "../utils/state.js";
import { playFlipSound } from "../utils/audio.js";
import { renderParas, updateProgress } from "./grammar.js";
import { buildSentences, buildToken, updatePPProgress } from "./punctuation.js";
import { initMascot, heroCharacter, spotIcon, mascotName } from "./mascot.js";
import { photo, fetchFeaturedVideo } from "../data/assets.js";

// ── Helpers ───────────────────────────────────────────────────
function makePage(extraClass = "", density = null) {
  const div = document.createElement("div");
  div.className = `page${extraClass ? " " + extraClass : ""}`;
  if (density) div.dataset.density = density;
  return div;
}

function html(el, markup) {
  el.innerHTML = markup;
  return el;
}

const sideTab = (label, color = "blue") =>
  `<span class="gp-tab gp-tab--${color}">${label}</span>`;

const mainIdea = (text) => `
  <aside class="gp-side gp-side--idea">
    <p class="gp-side__title">${spotIcon("idea")} Main <em>Idea</em></p>
    <p class="gp-side__text">${text}</p>
  </aside>`;

const vocabBox = (items = []) => `
  <aside class="gp-side gp-side--vocab">
    <p class="gp-side__title">${spotIcon("books")} Key Vocabulary</p>
    <dl class="gp-vocab">
      ${items.map((v) => `<div><dt>${v.term}</dt><dd>${v.def}</dd></div>`).join("")}
    </dl>
  </aside>`;

const studyTip = (text) => `
  <aside class="gp-side gp-side--tip">
    <p class="gp-side__title gp-side__title--torn">${spotIcon("pencil")} Study Tip</p>
    <p class="gp-side__text">${text}</p>
  </aside>`;

const hotBox = (items = []) => `
  <aside class="gp-hot">
    <p class="gp-hot__title">${spotIcon("rocket")} H.O.T. Problems <span>Higher-Order Thinking</span></p>
    <ol class="gp-hot__list">${items.map((q) => `<li>${q}</li>`).join("")}</ol>
    <p class="gp-hot__note">Try these in your notebook.</p>
  </aside>`;

// ── Front cover — Glencoe / McGraw-Hill illustrated style ─────
function makeCoverPage(book) {
  const m = book.meta;
  const g = book.units.filter((u) => u.kind === "grammar").length;
  const p = book.units.filter((u) => u.kind === "punctuation").length;
  const page = makePage("", "hard");
  return html(
    page,
    `<div class="pc gp-cover">
      <div class="gp-cover__rings" aria-hidden="true"></div>
      <div class="gp-cover__swoosh" aria-hidden="true"></div>
      <header class="gp-cover__masthead">
        <span class="gp-cover__edition">Student Edition</span>
        <span class="gp-cover__brand">Prep&nbsp;Portal&nbsp;<i>English</i></span>
      </header>

      <div class="gp-cover__titlewrap">
        <h1 class="gp-cover__title gp-3d">${m.title}</h1>
        <span class="gp-cover__grade">5–9</span>
      </div>
      <p class="gp-cover__sub">${m.subtitle}</p>

      <div class="gp-cover__scene">
        <div class="gp-cover__photo">${photo(book.media.cover, "", { w: 1000, seed: "gp-cover" })}</div>
        <div class="gp-cover__photo-overlay"></div>
        ${heroCharacter("detective", { tag: "", cls: "gp-cover__char" })}
      </div>

      <footer class="gp-cover__footer">
        <ul class="gp-cover__chips">
          <li>${g} Grammar</li><li>${p} Punctuation</li><li>AI Checker</li>
        </ul>
        <span class="gp-cover__vol">Vol. 1</span>
      </footer>
      <span class="gp-cover__hint">Open to begin &rarr;</span>
    </div>`
  );
}

// ── Contents (dotted-leader TOC with page numbers) ────────────
function makeContentsPage(book) {
  const grammar = [];
  const punct = [];
  book.units.forEach((u, i) => (u.kind === "grammar" ? grammar : punct).push([u, i]));

  const row = ([u, i]) => `
    <li class="gp-toc__item" data-goto-unit="${i}">
      <span class="gp-toc__num">${String(u.number).padStart(2, "0")}</span>
      <span class="gp-toc__title">${u.title}</span>
      <span class="gp-toc__dots"></span>
      <span class="gp-toc__page">${(state.UNIT_START_PAGE[i] ?? 0) + 1}</span>
    </li>`;

  const section = (label, rows) => `
    <p class="gp-toc__section">${label}</p>
    <ul class="gp-toc__list">${rows.map(row).join("")}</ul>`;

  const page = makePage();
  return html(
    page,
    `<div class="pc gp-contents">
      ${sideTab("Contents", "blue")}
      <header class="gp-contents__head">
        <span class="gp-kicker">Field Manual</span>
        <h2>Table of Contents</h2>
      </header>
      ${section("Grammar Police", grammar)}
      ${section("Punctuation Patrol", punct)}
      <li class="gp-toc__item gp-toc__item--special" data-goto-checker>
        <span class="gp-toc__num">★</span>
        <span class="gp-toc__title">Check My Writing — AI tool</span>
        <span class="gp-toc__dots"></span>
        <span class="gp-toc__page">${(state.CHECKER_PAGE ?? 0) + 1}</span>
      </li>
      <p class="gp-contents__tip">Tap any title to jump straight there.</p>
    </div>`
  );
}

// ── How this book works ───────────────────────────────────────
function makeHowToPage() {
  const steps = [
    ["Read the lesson", "Each unit opens with the Main Idea, Key Vocabulary and a friendly explanation from your guide."],
    ["Use the trick", "Try the Detective's Trick to decide which word or mark fits before you practise."],
    ["Do the activity", "Grammar: tap a blank and choose. Punctuation: drag a mark from the strip into the sentence."],
    ["Check & learn", "Press Check for an instant score, review the Study Tip, then beat your best."],
  ];
  const page = makePage();
  return html(
    page,
    `<div class="pc gp-howto-page">
      ${sideTab("Start Here", "green")}
      <header class="gp-howto-page__head">
        <span class="gp-kicker">Before you begin</span>
        <h2>How this book works</h2>
      </header>
      <ol class="gp-howto">
        ${steps.map(([t, d], i) => `
          <li class="gp-howto__step">
            <span class="gp-howto__num">${i + 1}</span>
            <div><strong>${t}</strong><p>${d}</p></div>
          </li>`).join("")}
      </ol>
      <aside class="gp-howto-note">
        ${spotIcon("magnifier", "gp-howto-note__ico")}
        <p>New! Finish with the <strong>Check&nbsp;My&nbsp;Writing</strong> AI tool — paste your own work and ${mascotName()} marks it instantly.</p>
      </aside>
    </div>`
  );
}

// ── Chapter opener (banner + Main Idea + Key Vocab + mascot) ───
function makeOpenerPage(unit) {
  const page = makePage();
  return html(
    page,
    `<div class="pc gp-opener gp-c-${unit.color}">
      ${sideTab(`Unit ${unit.number}`, unit.color)}
      <header class="gp-banner gp-banner--${unit.color}">
        <span class="gp-banner__tech" aria-hidden="true"></span>
        <span class="gp-banner__chapter">Unit ${unit.number} · ${unit.kind === "grammar" ? "Grammar Police" : "Punctuation Patrol"}</span>
        <h2 class="gp-banner__title gp-3d gp-3d--${unit.color}">${unit.title}</h2>
        <span class="gp-banner__focus">${unit.focus}</span>
      </header>
      <div class="gp-cream gp-opener__body">
        ${mainIdea(unit.mainIdea)}
        ${vocabBox(unit.keyVocab)}
      </div>
    </div>`
  );
}

// ── Real-World Link folder card + Study Tip ───────────────────
function makeRealWorldPage(unit) {
  const rw = unit.realWorld || {};
  const page = makePage();
  return html(
    page,
    `<div class="pc gp-realworld gp-c-${unit.color}">
      <header class="gp-realworld__head">
        <span class="gp-realworld__ico">${spotIcon("target")}</span>
        <div><span class="gp-kicker">Unit ${unit.number}</span><h3>Real-World <em>Link</em></h3></div>
      </header>
      <figure class="gp-realcard">
        <span class="gp-realcard__tab">${spotIcon("target")} Real-World Link</span>
        <div class="gp-realcard__photo">
          ${photo(rw.image, rw.title || "", { w: 800, seed: unit.id })}
          <span class="gp-realcard__caption">${rw.title || "Why it matters"}</span>
        </div>
        <figcaption class="gp-realcard__body"><p>${rw.text || ""}</p></figcaption>
      </figure>
      ${studyTip(unit.studyTip)}
    </div>`
  );
}

// ── Lesson pages (reuse the rich exp- explanation HTML) ───────
function makeLessonLeftPage(unit) {
  const page = makePage();
  return html(
    page,
    `<div class="pc pc--explanation gp-lesson">
      <div class="pc-exp-header">
        <span class="pc-exp-case">Lesson · Unit ${unit.number}</span>
        <span class="pc-exp-focus">${unit.focus}</span>
      </div>
      <div class="pc-exp-body">${unit.lesson.leftHTML}</div>
    </div>`
  );
}

function makeLessonRightPage(unit) {
  const page = makePage();
  return html(
    page,
    `<div class="pc pc--explanation gp-lesson">
      <div class="pc-exp-header pc-exp-header--right">
        <span class="pc-exp-subtitle">${unit.title}</span>
        <span class="pc-exp-badge">Lesson</span>
      </div>
      <div class="pc-exp-body">${unit.lesson.rightHTML}</div>
      <div class="pc-exp-cta">
        <i data-lucide="chevron-right" style="width:14px;height:14px;display:block;flex-shrink:0"></i>
        Flip to practise &rarr;
      </div>
    </div>`
  );
}

// ── Grammar practice (choose-the-word) ────────────────────────
function makeGrammarPracticeLeft(unit, passageIdx) {
  const passage = unit.passage;
  const page = makePage();
  page.dataset.passage = passageIdx;

  const pc = document.createElement("div");
  pc.className = "pc pc--passage";
  pc.innerHTML = `
    <div class="pc-passage-header">
      <span class="pc-passage-label">Practice · Passage ${passageIdx + 1}</span>
      <strong class="pc-passage-title">${passage.title}</strong>
      <span class="pc-focus-badge">${passage.focus}</span>
    </div>`;

  const body = document.createElement("div");
  body.className = "pc-passage-body";
  renderParas(passage.paragraphs.slice(0, 2), passageIdx, body);
  pc.appendChild(body);
  page.appendChild(pc);
  return page;
}

function makeGrammarPracticeRight(unit, passageIdx) {
  const passage = unit.passage;
  const page = makePage();
  page.dataset.passage = passageIdx;

  const pc = document.createElement("div");
  pc.className = "pc pc--passage pc--passage-right";

  const body = document.createElement("div");
  body.className = "pc-passage-body";
  renderParas(passage.paragraphs.slice(2), passageIdx, body);
  pc.appendChild(body);

  pc.appendChild(checkSection({ check: `data-gp-check="${passageIdx}"`, reset: `data-gp-reset="${passageIdx}"`, progId: `prog-${passageIdx}`, progText: `prog-text-${passageIdx}`, scoreId: `score-${passageIdx}`, unit: "filled" }));
  appendHot(pc, unit);
  page.appendChild(pc);
  return page;
}

// ── Punctuation practice (drag-the-mark) ──────────────────────
function makePunctPracticeLeft(unit, exerIdx) {
  const ex = unit.exercise;
  const half = Math.ceil(ex.items.length / 2);
  const page = makePage();

  const pc = document.createElement("div");
  pc.className = "pc pc--practice";
  pc.innerHTML = `
    <div class="pc-practice-header">
      <span class="pc-practice-label">Practice · Exercise ${exerIdx + 1}</span>
      <strong class="pc-practice-title">${ex.title}</strong>
      <span class="pc-focus-badge">${ex.focus}</span>
    </div>`;

  const items = document.createElement("div");
  items.className = "pp-items";
  buildSentences(ex.items, 0, half, exerIdx, items);
  pc.appendChild(items);
  page.appendChild(pc);
  return page;
}

function makePunctPracticeRight(unit, exerIdx) {
  const ex = unit.exercise;
  const half = Math.ceil(ex.items.length / 2);
  const page = makePage();

  const pc = document.createElement("div");
  pc.className = "pc pc--practice";

  const items = document.createElement("div");
  items.className = "pp-items";
  buildSentences(ex.items, half, ex.items.length, exerIdx, items);
  pc.appendChild(items);

  const pool = document.createElement("div");
  pool.className = "pp-pool-strip";
  pool.innerHTML = `<span class="pp-pool-label">Drag:</span><span class="pp-pool-tokens"></span>`;
  ex.pool.forEach((char) => pool.querySelector(".pp-pool-tokens").appendChild(buildToken(char)));
  pc.appendChild(pool);

  pc.appendChild(checkSection({ check: `data-pp-check="${exerIdx}"`, reset: `data-pp-reset="${exerIdx}"`, progId: `ppProg-${exerIdx}`, progText: `ppProgText-${exerIdx}`, scoreId: `ppScore-${exerIdx}`, unit: "placed" }));
  appendHot(pc, unit);
  page.appendChild(pc);
  return page;
}

function checkSection({ check, reset, progId, progText, scoreId, unit }) {
  const el = document.createElement("div");
  el.className = "pc-check-section";
  el.innerHTML = `
    <div class="pc-progress">
      <div class="pc-progress-track"><div class="pc-progress-fill" id="${progId}"></div></div>
      <span class="pc-progress-text" id="${progText}">0 / 0 ${unit}</span>
    </div>
    <div class="pc-check-actions">
      <button class="pc-btn pc-btn--ghost" ${reset}>Reset</button>
      <button class="pc-btn pc-btn--check" ${check}>
        <i data-lucide="check" style="width:13px;height:13px;display:block;flex-shrink:0"></i>
        Check
      </button>
    </div>
    <div class="pc-score" id="${scoreId}"></div>`;
  return el;
}

function appendHot(pc, unit) {
  if (!unit.hot?.length) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = hotBox(unit.hot);
  pc.appendChild(wrap.firstElementChild);
}

// ── Section divider (Grammar → Punctuation) ───────────────────
function makeDividerPage() {
  const page = makePage();
  return html(
    page,
    `<div class="pc gp-divider">
      <div class="gp-divider__rings" aria-hidden="true"></div>
      <span class="gp-divider__kicker">Section Two</span>
      <h2 class="gp-divider__title gp-3d gp-3d--teal">Punctuation<br>Patrol</h2>
      ${heroCharacter("police", { tag: "", cls: "gp-divider__char" })}
      <p class="gp-divider__sub">Now drag the marks into place — full stops, question marks, commas and apostrophes.</p>
    </div>`
  );
}

// ── AI "Check My Writing" tool (wired by checker.js) ──────────
function makeCheckerPage(book) {
  const page = makePage();
  return html(
    page,
    `<div class="pc gp-checker" data-gp-checker>
      ${sideTab("AI Tool", "purple")}
      <header class="gp-banner gp-banner--purple">
        <span class="gp-banner__tech" aria-hidden="true"></span>
        <span class="gp-banner__chapter">${spotIcon("magnifier")} Field Tool</span>
        <h2 class="gp-banner__title gp-3d gp-3d--purple">Check My Writing</h2>
        <span class="gp-banner__focus">powered by AI</span>
      </header>
      <p class="gp-checker__intro">Paste a sentence or two of your own writing. ${book.mascot?.name || "Your guide"} will spot confusable words, punctuation and capital-letter slips — and explain each fix.</p>
      <textarea class="gp-checker__input" id="gpCheckerInput" maxlength="4000"
        placeholder="e.g. me and my freind went too the shop, their was alot of people."></textarea>
      <div class="gp-checker__actions">
        <button class="pc-btn pc-btn--check" id="gpCheckerRun">
          <i data-lucide="wand-sparkles" style="width:14px;height:14px;display:block;flex-shrink:0"></i>
          Check my writing
        </button>
        <button class="pc-btn pc-btn--ghost" id="gpCheckerClear">Clear</button>
      </div>
      <div class="gp-checker__result" id="gpCheckerResult" aria-live="polite"></div>
    </div>`
  );
}

// ── Closing feature video ─────────────────────────────────────
function makeVideoPage(book) {
  const v = book.media?.video || {};
  const page = makePage();
  return html(
    page,
    `<div class="pc gp-video">
      <header class="gp-video__head">
        <span class="gp-kicker">Feature</span>
        <h3>Why grammar matters</h3>
      </header>
      <figure class="gp-video__figure" data-gp-video>
        <button type="button" class="gp-video__poster" data-yt="${v.id || ""}"
          aria-label="Play video">
          <span class="gp-video__play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>
          <span class="gp-video__cap">${v.title || "Watch"}</span>
        </button>
        <div class="gp-video__frame"></div>
      </figure>
      <p class="gp-video__text">Three minutes on how small grammar wins add up to a sharper, clearer writer — in exams and beyond.</p>
    </div>`
  );
}

// ── Back cover ────────────────────────────────────────────────
function makeBackCoverPage() {
  const page = makePage("", "hard");
  return html(
    page,
    `<div class="pc gp-back" data-density="hard">
      <div class="gp-back__rings" aria-hidden="true"></div>
      <div class="gp-back__inner">
        ${heroCharacter("detective", { tag: "", cls: "gp-back__char" })}
        <p class="gp-back__msg gp-3d gp-3d--green">Keep practising.<br>Words matter.</p>
        <a class="gp-back__cta" href="/writing/">Try the Writing Assistant &rarr;</a>
        <p class="gp-back__site">Prep Portal · prepportal.com</p>
      </div>
    </div>`
  );
}

// ── Media + video wiring (called after build) ─────────────────
function wireVideo(root, fallback) {
  const fig = root.querySelector("[data-gp-video]");
  if (!fig) return;
  const poster = fig.querySelector(".gp-video__poster");
  const frame = fig.querySelector(".gp-video__frame");

  fetchFeaturedVideo(fallback).then((v) => {
    poster.dataset.yt = v.id;
    poster.style.backgroundImage = `url('${v.thumbnail}')`;
    const cap = poster.querySelector(".gp-video__cap");
    if (cap && v.title) cap.textContent = v.title;
  });

  poster.addEventListener("click", (e) => {
    e.stopPropagation();
    const id = poster.dataset.yt;
    if (!id) return;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = "Feature video";
    iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "");
    frame.appendChild(iframe);
    poster.style.display = "none";
  });
}

export function stopVideo(root) {
  const frame = root?.querySelector(".gp-video__frame");
  const poster = root?.querySelector(".gp-video__poster");
  if (frame) frame.innerHTML = "";
  if (poster) poster.style.display = "";
}

// ── Book assembly ─────────────────────────────────────────────
export function buildBookPages() {
  const book = state.book;
  const bookEl = document.getElementById("gpBook");
  bookEl.innerHTML = "";

  initMascot(book.mascot);

  // Reset jump tables
  state.UNIT_START_PAGE = [];

  const pages = [];
  pages.push(makeCoverPage(book));     // 0
  const contentsIdx = pages.length;    // 1 (filled after indices are known)
  pages.push(null);
  pages.push(makeHowToPage());         // 2

  let passageIdx = 0;
  let exerIdx = 0;
  let dividerDone = false;

  book.units.forEach((unit, ui) => {
    if (unit.kind === "punctuation" && !dividerDone) {
      pages.push(makeDividerPage());
      dividerDone = true;
    }
    state.UNIT_START_PAGE[ui] = pages.length;
    pages.push(makeOpenerPage(unit));
    pages.push(makeRealWorldPage(unit));
    pages.push(makeLessonLeftPage(unit));
    pages.push(makeLessonRightPage(unit));

    if (unit.kind === "grammar") {
      pages.push(makeGrammarPracticeLeft(unit, passageIdx));
      pages.push(makeGrammarPracticeRight(unit, passageIdx));
      passageIdx++;
    } else {
      pages.push(makePunctPracticeLeft(unit, exerIdx));
      pages.push(makePunctPracticeRight(unit, exerIdx));
      exerIdx++;
    }
  });

  state.CHECKER_PAGE = pages.length;
  pages.push(makeCheckerPage(book));
  pages.push(makeVideoPage(book));
  pages.push(makeBackCoverPage());

  // Now that every index is known, build the contents page in place.
  pages[contentsIdx] = makeContentsPage(book);

  pages.forEach((p) => bookEl.appendChild(p));

  // Initial progress meters
  for (let i = 0; i < passageIdx; i++) updateProgress(i);
  for (let i = 0; i < exerIdx; i++) updatePPProgress(i);

  // Wire the feature video.
  wireVideo(bookEl, book.media?.video);

  if (window.lucide) lucide.createIcons();
  state.bookBuilt = true;
}

export function initPageFlip(onFlip) {
  const book = document.getElementById("gpBook");

  // Responsive like the homepage magazine (home/js/flipbook.js): "stretch"
  // + usePortrait lets StPageFlip render a TWO-page spread on wide screens and
  // automatically fold to a SINGLE page on small screens — no manual hacks.
  // swipeDistance is kept high so dragging punctuation marks / picking blanks
  // never accidentally turns the page; navigation is via the arrow buttons.
  state.pageFlip = new St.PageFlip(book, {
    width: 470,
    height: 650,
    size: "stretch",
    minWidth: 300,
    maxWidth: 560,
    minHeight: 420,
    maxHeight: 780,
    drawShadow: true,
    flippingTime: 800,
    maxShadowOpacity: 0.5,
    showCover: true,
    usePortrait: true,
    mobileScrollSupport: false,
    clickEventForward: false,
    useMouseEvents: true,
    swipeDistance: 9999,
  });

  state.pageFlip.loadFromHTML(book.querySelectorAll(".page"));
  state.pageFlip.on("flip", () => { playFlipSound(); onFlip(); });
  state.pageFlip.on("changeOrientation", onFlip);
}
