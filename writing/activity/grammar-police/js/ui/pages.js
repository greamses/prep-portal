import { EXPLANATIONS, PASSAGES, WORD_GROUPS } from "../data/grammarData.js";
import { PP_EXPLANATIONS, PP_EXERCISES } from "../data/punctuationData.js";
import { state } from "../utils/state.js";
import { playFlipSound } from "../utils/audio.js";
import { renderParas, updateProgress } from "./grammar.js";
import { buildSentences, buildToken, updatePPProgress } from "./punctuation.js";

// ── Helpers ───────────────────────────────────────────────────
function makePage(extraClass = "", density = null) {
  const div = document.createElement("div");
  div.className = `page${extraClass ? " " + extraClass : ""}`;
  if (density) div.dataset.density = density;
  return div;
}

function coverPattern() {
  return `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <pattern id="diag" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.05)" stroke-width="6"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#diag)"/>
  </svg>`;
}

// ── Front Cover ───────────────────────────────────────────────
function makeCoverPage() {
  const page = makePage("", "hard");
  page.innerHTML = `
    <div class="pc pc--cover">
      <div class="pc-cover-bg" aria-hidden="true">${coverPattern()}</div>
      <div class="pc-cover-content">
        <div class="pc-cover-badge" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
            <path d="M32 4L6 17V38C6 51 17 62 32 64C47 62 58 51 58 38V17L32 4Z"
                  fill="rgba(255,229,0,0.18)" stroke="#ffe500" stroke-width="2.5"/>
            <path d="M22 33L29 40L42 26" stroke="#ffe500" stroke-width="3.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="pc-cover-title">Grammar<br>Police</h1>
        <p class="pc-cover-pp-sub">+ Punctuation Patrol</p>
        <p class="pc-cover-sub">English · Prep Portal</p>
        <div class="pc-cover-divider"></div>
        <ul class="pc-cover-chips" aria-label="Activity details">
          <li>3 Passages</li>
          <li>3 Exercises</li>
          <li>60+ Blanks</li>
          <li>Drag &amp; Drop</li>
        </ul>
        <p class="pc-cover-hint">Open to start &rarr;</p>
      </div>
      <div class="pc-cover-footer">prepportal.com</div>
    </div>`;
  return page;
}

// ── TOC Left ──────────────────────────────────────────────────
function makeTOCLeftPage() {
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--toc">
      <div class="pc-header">Table of Contents</div>
      <ul class="pc-toc-list" id="pcTocList">
        <li class="pc-toc-section-header">
          <span class="pc-toc-section-label">Grammar Police</span>
        </li>
        ${PASSAGES.map((p, i) => `
          <li class="pc-toc-item" data-goto-explanation="${i}">
            <span class="pc-toc-num">0${i + 1}</span>
            <span class="pc-toc-info">
              <strong class="pc-toc-title">${p.title}</strong>
              <span class="pc-toc-focus">${p.focus}</span>
              <span class="pc-toc-badge">Learn + Practise</span>
            </span>
            <span class="pc-toc-arrow">&rarr;</span>
          </li>`).join("")}
        <li class="pc-toc-section-header">
          <span class="pc-toc-section-label">Punctuation Patrol</span>
        </li>
        ${PP_EXERCISES.map((ex, i) => `
          <li class="pc-toc-item" data-goto-pp-explanation="${i}">
            <span class="pc-toc-num">0${i + 4}</span>
            <span class="pc-toc-info">
              <strong class="pc-toc-title">${ex.title}</strong>
              <span class="pc-toc-focus">${ex.focus}</span>
              <span class="pc-toc-badge">Learn + Practise</span>
            </span>
            <span class="pc-toc-arrow">&rarr;</span>
          </li>`).join("")}
      </ul>
      <p class="pc-toc-tip">Click a title to go straight to that lesson.</p>
    </div>`;
  return page;
}

// ── TOC Right ─────────────────────────────────────────────────
function makeTOCRightPage() {
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--ref">
      <div class="pc-header">How This Book Works</div>
      <div class="pc-howto">
        <div class="pc-howto-step">
          <span class="pc-howto-num">1</span>
          <div>
            <strong>Read the lesson</strong>
            <p>Each chapter opens with a friendly explanation of the words or punctuation marks and when to use them.</p>
          </div>
        </div>
        <div class="pc-howto-step">
          <span class="pc-howto-num">2</span>
          <div>
            <strong>Try the trick</strong>
            <p>Use the Detective's Trick to decide which word or mark fits — before flipping to the activity.</p>
          </div>
        </div>
        <div class="pc-howto-step">
          <span class="pc-howto-num">3</span>
          <div>
            <strong>Do the activity</strong>
            <p>Grammar chapters: tap the blank and pick from the menu. Punctuation chapters: drag a mark from the yellow strip or tap to select then tap a position in the sentence.</p>
          </div>
        </div>
        <div class="pc-howto-step">
          <span class="pc-howto-num">4</span>
          <div>
            <strong>Check &amp; learn</strong>
            <p>Press <em>Check</em> to see your score instantly. Review the lesson and try again!</p>
          </div>
        </div>
      </div>
      <p class="pc-ref-foot">Word groups: ${Object.values(WORD_GROUPS).map((g) => g.label).join(" · ")}</p>
    </div>`;
  return page;
}

// ── Explanation Pages ─────────────────────────────────────────
function makeExplanationLeftPage(idx) {
  const exp  = EXPLANATIONS[idx];
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--explanation pc--explanation-left">
      <div class="pc-exp-header">
        <span class="pc-exp-case">Case File #0${idx + 1}</span>
        <span class="pc-exp-focus">${exp.focus}</span>
      </div>
      <div class="pc-exp-body">${exp.leftHTML}</div>
    </div>`;
  return page;
}

function makeExplanationRightPage(idx) {
  const exp  = EXPLANATIONS[idx];
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--explanation pc--explanation-right">
      <div class="pc-exp-header pc-exp-header--right">
        <span class="pc-exp-subtitle">${exp.title}</span>
        <span class="pc-exp-badge">Lesson</span>
      </div>
      <div class="pc-exp-body">${exp.rightHTML}</div>
      <div class="pc-exp-cta">
        <i data-lucide="chevron-right" style="width:14px;height:14px;display:block;flex-shrink:0"></i>
        Flip to practise &rarr;
      </div>
    </div>`;
  return page;
}

// ── Passage Pages ─────────────────────────────────────────────
function makePassageLeftPage(passageIdx) {
  const passage = PASSAGES[passageIdx];
  const page    = makePage();
  page.dataset.passage = passageIdx;

  const pc = document.createElement("div");
  pc.className = "pc pc--passage";
  pc.innerHTML = `
    <div class="pc-passage-header">
      <span class="pc-passage-label">Passage ${passageIdx + 1} of ${PASSAGES.length}</span>
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

function makePassageRightPage(passageIdx) {
  const passage = PASSAGES[passageIdx];
  const page    = makePage();
  page.dataset.passage = passageIdx;

  const pc = document.createElement("div");
  pc.className = "pc pc--passage pc--passage-right";

  const body = document.createElement("div");
  body.className = "pc-passage-body";
  renderParas(passage.paragraphs.slice(2), passageIdx, body);
  pc.appendChild(body);

  const check = document.createElement("div");
  check.className = "pc-check-section";
  check.innerHTML = `
    <div class="pc-progress">
      <div class="pc-progress-track"><div class="pc-progress-fill" id="prog-${passageIdx}"></div></div>
      <span class="pc-progress-text" id="prog-text-${passageIdx}">0 / 0 filled</span>
    </div>
    <div class="pc-check-actions">
      <button class="pc-btn pc-btn--ghost" data-gp-reset="${passageIdx}">Reset</button>
      <button class="pc-btn pc-btn--check" data-gp-check="${passageIdx}">
        <i data-lucide="check" style="width:13px;height:13px;display:block;flex-shrink:0"></i>
        Check
      </button>
    </div>
    <div class="pc-score" id="score-${passageIdx}"></div>`;
  pc.appendChild(check);
  page.appendChild(pc);
  return page;
}

// ── Chapter Divider ───────────────────────────────────────────
function makeChapterDividerLeft() {
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--divider pc--divider-left">
      <div class="pc-div-stamp">Grammar Police</div>
      <div class="pc-div-check">
        <i data-lucide="circle-check" style="width:40px;height:40px;color:#1a7f37;display:block;flex-shrink:0"></i>
        <p>Section Complete</p>
      </div>
      <div class="pc-div-recap">
        <p class="pc-div-recap-label">Confusables covered</p>
        <div class="pc-div-tags">
          <span>they're · their · there</span>
          <span>we're · were · where</span>
          <span>you're · your · it's · its</span>
        </div>
      </div>
      <p class="pc-div-turn">Turn the page to continue &rarr;</p>
    </div>`;
  return page;
}

function makeChapterDividerRight() {
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--divider pc--divider-right">
      <div class="pc-div-badge" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
          <path d="M32 4L6 17V38C6 51 17 62 32 64C47 62 58 51 58 38V17L32 4Z"
                fill="rgba(255,229,0,0.18)" stroke="#ffe500" stroke-width="2.5"/>
          <text x="32" y="46" text-anchor="middle" font-size="30" font-family="serif"
                fill="#ffe500" font-weight="900">?</text>
        </svg>
      </div>
      <h2 class="pc-div-chapter-title">Punctuation<br>Patrol</h2>
      <p class="pc-div-chapter-sub">English · Prep Portal</p>
      <ul class="pc-div-chapter-list">
        <li>Question marks &amp; Full stops</li>
        <li>Commas in lists &amp; phrases</li>
        <li>Mixed punctuation</li>
      </ul>
      <p class="pc-div-method">Drag punctuation marks into sentences</p>
    </div>`;
  return page;
}

// ── Back Cover ────────────────────────────────────────────────
function makeBackCoverPage() {
  const page = makePage("", "hard");
  page.innerHTML = `
    <div class="pc pc--back-cover">
      <div class="pc-back-inner">
        <svg viewBox="0 0 60 60" fill="none" width="52" height="52" aria-hidden="true">
          <path d="M30 56L6 42V18L30 4L54 18V42L30 56Z" fill="#ffe500" stroke="#0a0a0a" stroke-width="3"/>
          <text x="30" y="37" text-anchor="middle" font-size="22" font-family="sans-serif"
                fill="#0a0a0a" font-weight="900">P</text>
        </svg>
        <p class="pc-back-msg">Keep practising.<br>Words matter.</p>
        <p class="pc-back-site">prepportal.com</p>
      </div>
    </div>`;
  return page;
}

// ── PP Explanation Pages ──────────────────────────────────────
function makePPExplLeftPage(idx) {
  const exp  = PP_EXPLANATIONS[idx];
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--explanation pc--explanation-left">
      <div class="pc-exp-header">
        <span class="pc-exp-case">Case File #0${idx + 1}</span>
        <span class="pc-exp-focus">${exp.focus}</span>
      </div>
      <div class="pc-exp-body">${exp.leftHTML}</div>
    </div>`;
  return page;
}

function makePPExplRightPage(idx) {
  const exp  = PP_EXPLANATIONS[idx];
  const page = makePage();
  page.innerHTML = `
    <div class="pc pc--explanation pc--explanation-right">
      <div class="pc-exp-header pc-exp-header--right">
        <span class="pc-exp-subtitle">${exp.title}</span>
        <span class="pc-exp-badge">Lesson</span>
      </div>
      <div class="pc-exp-body">${exp.rightHTML}</div>
      <div class="pc-exp-cta">
        <i data-lucide="chevron-right" style="width:14px;height:14px;display:block;flex-shrink:0"></i>
        Flip to practise &rarr;
      </div>
    </div>`;
  return page;
}

// ── PP Exercise Pages ─────────────────────────────────────────
function makeExerLeftPage(idx) {
  const ex   = PP_EXERCISES[idx];
  const half = Math.ceil(ex.items.length / 2);
  const page = makePage();

  const pc = document.createElement("div");
  pc.className = "pc pc--practice";
  pc.innerHTML = `
    <div class="pc-practice-header">
      <span class="pc-practice-label">Exercise ${idx + 1} of ${PP_EXERCISES.length}</span>
      <strong class="pc-practice-title">${ex.title}</strong>
      <span class="pc-focus-badge">${ex.focus}</span>
    </div>`;

  const items = document.createElement("div");
  items.className = "pp-items";
  buildSentences(ex.items, 0, half, idx, items);
  pc.appendChild(items);

  page.appendChild(pc);
  return page;
}

function makeExerRightPage(idx) {
  const ex   = PP_EXERCISES[idx];
  const half = Math.ceil(ex.items.length / 2);
  const page = makePage();

  const pc = document.createElement("div");
  pc.className = "pc pc--practice";

  const items = document.createElement("div");
  items.className = "pp-items";
  buildSentences(ex.items, half, ex.items.length, idx, items);
  pc.appendChild(items);

  const pool = document.createElement("div");
  pool.className = "pp-pool-strip";
  pool.innerHTML = `<span class="pp-pool-label">Drag:</span><span class="pp-pool-tokens"></span>`;
  ex.pool.forEach((char) => pool.querySelector(".pp-pool-tokens").appendChild(buildToken(char)));
  pc.appendChild(pool);

  const check = document.createElement("div");
  check.className = "pc-check-section";
  check.innerHTML = `
    <div class="pc-progress">
      <div class="pc-progress-track"><div class="pc-progress-fill" id="ppProg-${idx}"></div></div>
      <span class="pc-progress-text" id="ppProgText-${idx}">0 / 0 placed</span>
    </div>
    <div class="pc-check-actions">
      <button class="pc-btn pc-btn--ghost" data-pp-reset="${idx}">Reset</button>
      <button class="pc-btn pc-btn--check" data-pp-check="${idx}">
        <i data-lucide="check" style="width:13px;height:13px;display:block;flex-shrink:0"></i>
        Check
      </button>
    </div>
    <div class="pc-score" id="ppScore-${idx}"></div>`;
  pc.appendChild(check);

  page.appendChild(pc);
  return page;
}

// ── Book Assembly ─────────────────────────────────────────────
export function buildBookPages() {
  const book = document.getElementById("gpBook");
  book.innerHTML = "";
  const pages = [];

  pages.push(makeCoverPage());
  pages.push(makeTOCLeftPage());
  pages.push(makeTOCRightPage());

  PASSAGES.forEach((_, i) => {
    state.EXPLANATION_START_PAGE[i] = pages.length;
    pages.push(makeExplanationLeftPage(i));
    pages.push(makeExplanationRightPage(i));
    state.PASSAGE_START_PAGE[i] = pages.length;
    pages.push(makePassageLeftPage(i));
    pages.push(makePassageRightPage(i));
  });

  pages.push(makeChapterDividerLeft());
  pages.push(makeChapterDividerRight());

  PP_EXERCISES.forEach((_, i) => {
    state.PP_EXPL_START[i] = pages.length;
    pages.push(makePPExplLeftPage(i));
    pages.push(makePPExplRightPage(i));
    state.PP_EXER_START[i] = pages.length;
    pages.push(makeExerLeftPage(i));
    pages.push(makeExerRightPage(i));
  });

  pages.push(makeBackCoverPage());
  pages.forEach((p) => book.appendChild(p));

  PASSAGES.forEach((_, i) => updateProgress(i));
  PP_EXERCISES.forEach((_, i) => updatePPProgress(i));

  if (window.lucide) lucide.createIcons();

  state.bookBuilt = true;
}

export function initPageFlip(onFlip) {
  const book = document.getElementById("gpBook");
  const W    = book.offsetWidth;
  const H    = book.offsetHeight;

  state.pageFlip = new St.PageFlip(book, {
    width:               Math.floor(W / 2),
    height:              H,
    size:                "fixed",
    showCover:           true,
    usePortrait:         true,
    maxShadowOpacity:    0.55,
    mobileScrollSupport: false,
    clickEventForward:   false,
    swipeDistance:       9999,
  });

  state.pageFlip.loadFromHTML(book.querySelectorAll(".page"));
  state.pageFlip.on("flip", () => { playFlipSound(); onFlip(); });
  state.pageFlip.on("changeOrientation", onFlip);
}
