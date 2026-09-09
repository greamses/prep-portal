/* ============================================================================
   PRINTABLE WORKBOOK — building the paper, and cutting it into pages
   ----------------------------------------------------------------------------
   The half of a workbook generator that has nothing to do with what is being
   taught. Give it a SUBJECT — a registry of exercises and a few words about
   what the workbook is called — and it produces printed pages.

   Two jobs, in this order.

   BUILD turns the options into a flat list of BLOCKS: a section heading, a row
   of questions, another row, the next heading. Flat and full-width on purpose —
   two questions that sit side by side are paired into one block here, so that
   by the time anything is measured every block is a single thing that either
   fits on the page or does not.

   PAGINATE then fills real pages with them. It measures rather than estimates:
   a block goes into the page, the page is asked whether it has overflowed, and
   if it has, the block is lifted onto a fresh page. That costs a layout pass
   per block and buys a preview that is exactly what comes out of the printer,
   which is the only thing that matters here — a workbook whose preview lies is
   worse than no preview.

   The one rule beyond "does it fit": a heading never ends a page. A section
   heading is only placed if the first row under it fits too, because a heading
   alone at the foot of a page is how a worksheet comes back with a whole
   section missed.

   ── THE SUBJECT ────────────────────────────────────────────────────────────
   {
     eyebrow      "Mathematics · Place value" — the small line above the title
     subtitle(o)  the line under it, saying what this paper is set to
     exercises    the registry: [{ id, group, heading, instruction(o), cols,
                  groupSize, make(r,o,k), render(item,o), answer(item,o) }]
     unavailable(ex, o)   why this exercise cannot run here, or null
     optionsFor(ex, o)    the options THIS exercise should see (a cap, usually)
     sectionHead(section, o, state)   extra HTML under a section's instruction,
                  called once per section with a scratch object it may mark, so
                  a key or a worked example can print on its first section only
   }
   ========================================================================== */

import { stream, seedFrom, seedCode } from "./seed.js";
import { ICON } from "./icons.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* Paper, in millimetres. The margins the pages are laid out to live in the
   stylesheet, because they are a look and not a fact about the paper. */
export const PAPERS = {
  a4: { id: "a4", label: "A4", w: 210, h: 297 },
  letter: { id: "letter", label: "US Letter", w: 216, h: 279 },
};

export const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

/* ── build ─────────────────────────────────────────────────────────────────*/

/**
 * Draw every question the options ask for.
 *
 * Each exercise gets its OWN stream, mixed from the seed and the exercise's ID
 * — so turning section C from four questions to six leaves sections A, B and D
 * exactly as they were. A worksheet you cannot adjust without reprinting the
 * whole thing is a worksheet nobody adjusts. See seed.js for why it is the ID
 * and not the position.
 */
export function buildSections(o, subject) {
  const out = [];
  const byId = (id) => subject.exercises.find((e) => e.id === id) || null;

  o.chosen.forEach((choice) => {
    const ex = byId(choice.id);
    if (!ex || !choice.count) return;
    if (subject.unavailable?.(ex, o)) return;

    const r = stream(o.seed, seedFrom(ex.id));
    const opts = subject.optionsFor ? subject.optionsFor(ex, o) : o;

    const groupSize = ex.groupSize || 1;
    const items = [];
    let made = 0;
    let guard = 0;
    while (made < choice.count && guard++ < 200) {
      const k = Math.min(groupSize, choice.count - made);
      /* `made` is how many questions this exercise has already produced. An
         exercise that draws from a fixed bank of sentences needs it, so that a
         section of five is five different ones rather than five draws that may
         repeat. Everything else ignores it. */
      items.push({ item: ex.make(r, opts, k, made), first: made + 1, k });
      made += k;
    }
    out.push({ ex, opts, items, count: made });
  });
  return out;
}

/* ── the DOM of one workbook ───────────────────────────────────────────────*/

/** The title block that stands at the head of page one. */
function coverBlock(o, subject) {
  const rule = (label) =>
    `<span class="wb-cover__field"><em>${label}</em><span class="wb-line wb-line--fill"></span></span>`;
  return el(
    "header",
    "wb-cover",
    `<p class="wb-cover__eyebrow">${subject.eyebrow}</p>
     <h1 class="wb-cover__title">${escapeHtml(o.title)}</h1>
     <p class="wb-cover__sub">${subject.subtitle(o)}</p>
     ${o.nameLine ? `<div class="wb-cover__rules">${rule("Name")}${rule("Class")}${rule("Date")}</div>` : ""}`
  );
}

/** The heading that opens a section, and whatever the subject hangs under it. */
function headBlock(section, letter, o, subject, state, i = 0) {
  const node = el("div", "wb-sec");
  /* Each section's letter is the next note in the pack of six, so the sections
     are told apart by colour as well as by letter. */
  node.innerHTML =
    `<h2 class="wb-sec__title">` +
    `<span class="wb-sec__letter wb-sec__letter--c${i % 6}">${letter}</span>` +
    `${section.ex.heading}</h2>` +
    `<p class="wb-sec__say">${section.ex.instruction(section.opts)}</p>`;
  const extra = subject.sectionHead ? subject.sectionHead(section, o, state) : "";
  if (extra) node.insertAdjacentHTML("beforeend", extra);
  return node;
}

/** One question, numbered. */
function itemNode(section, entry) {
  const node = el("div", "wb-item");
  const no = entry.k > 1 ? `${entry.first}–${entry.first + entry.k - 1}` : `${entry.first}`;
  node.innerHTML =
    `<span class="wb-item__no">${no}</span>` +
    `<div class="wb-item__body">${section.ex.render(entry.item, section.opts)}</div>`;
  return node;
}

/**
 * The flat list of blocks the whole workbook is made of. Rows of two are made
 * HERE, so that pagination never has to reason about columns.
 */
export function blocksOf(sections, o, subject) {
  const blocks = [{ kind: "cover", node: coverBlock(o, subject) }];
  const state = {}; // scratch for sectionHead — "have I printed the key yet?"

  sections.forEach((section, i) => {
    blocks.push({
      kind: "head",
      node: headBlock(section, LETTERS[i] || "•", o, subject, state, i),
    });

    const cols = section.ex.cols || 1;
    for (let k = 0; k < section.items.length; k += cols) {
      const row = el("div", `wb-row wb-row--${cols}`);
      section.items.slice(k, k + cols).forEach((entry) => row.appendChild(itemNode(section, entry)));
      /* A lone question in a two-column row keeps its half width rather than
         stretching across, so the column edge stays straight down the page. */
      blocks.push({ kind: "row", node: row });
    }
  });

  if (o.answers) blocks.push(...answerBlocks(sections, o));
  return blocks;
}

/** The key, as its own section that always starts on a fresh page. */
function answerBlocks(sections, o) {
  const out = [{ kind: "break", node: el("div", "wb-break") }];
  out.push({
    kind: "head",
    node: el(
      "div",
      "wb-sec wb-sec--key",
      `<h2 class="wb-sec__title"><span class="wb-sec__letter wb-sec__letter--key">${ICON.check}</span>Answers</h2>
       <p class="wb-sec__say">Workbook ${seedCode(o.seed)} — every copy printed with this code has these answers.</p>`
    ),
  });

  sections.forEach((section, i) => {
    const rows = [];
    let n = 1;
    section.items.forEach((entry) => {
      (section.ex.answer(entry.item, section.opts) || []).forEach((a) => {
        rows.push(`<li><span class="wb-answers__no">${n++}</span><span>${a}</span></li>`);
      });
    });
    out.push({
      kind: "row",
      node: el(
        "div",
        "wb-answers",
        `<h3 class="wb-answers__title">${LETTERS[i] || "•"} · ${section.ex.heading}</h3>` +
          `<ol class="wb-answers__list">${rows.join("")}</ol>`
      ),
    });
  });
  return out;
}

/* ── paginate ──────────────────────────────────────────────────────────────*/

function newPage(sheet) {
  const page = el("section", "wb-page");
  page.innerHTML =
    `<div class="wb-page__inner"></div>` +
    `<footer class="wb-page__foot"><span class="wb-page__mark"></span><span class="wb-page__no"></span></footer>`;
  sheet.appendChild(page);
  return page.querySelector(".wb-page__inner");
}

const overflows = (inner) => inner.scrollHeight > inner.clientHeight + 1;

/**
 * Fill pages until the blocks run out. Returns the number of pages.
 *
 * The lookahead is the whole reason this is a loop with an index rather than a
 * forEach: placing a heading has to know whether the thing after it fits.
 */
export function paginate(sheet, blocks, o) {
  sheet.replaceChildren();
  const paper = PAPERS[o.paper] || PAPERS.a4;
  sheet.style.setProperty("--wb-w", paper.w + "mm");
  sheet.style.setProperty("--wb-h", paper.h + "mm");

  let inner = newPage(sheet);

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];

    if (b.kind === "break") {
      if (inner.childElementCount) inner = newPage(sheet);
      continue;
    }

    inner.appendChild(b.node);
    if (overflows(inner)) {
      if (inner.childElementCount === 1) {
        /* Nothing else on the page and it still spills: the block is simply
           taller than the paper. Leave it — clipping one over-long question is
           better than an empty page followed by the same clipped question. */
        continue;
      }
      inner.removeChild(b.node);
      inner = newPage(sheet);
      inner.appendChild(b.node);
    }

    /* A heading must not be the last thing on a page. Try the next block; if it
       will not go, take the heading with it. */
    if (b.kind === "head" && blocks[i + 1] && blocks[i + 1].kind === "row") {
      const next = blocks[i + 1].node;
      inner.appendChild(next);
      const spills = overflows(inner);
      inner.removeChild(next);
      if (spills && inner.childElementCount > 1) {
        inner.removeChild(b.node);
        inner = newPage(sheet);
        inner.appendChild(b.node);
      }
    }
  }

  /* Number the pages, and stamp each one so a sheet that gets separated from
     the others can still be matched back to its workbook and its answers. */
  const pages = [...sheet.querySelectorAll(".wb-page")];
  pages.forEach((p, i) => {
    p.querySelector(".wb-page__no").textContent = `${i + 1} / ${pages.length}`;
    p.querySelector(".wb-page__mark").textContent = `${o.title} · ${seedCode(o.seed)}`;
  });
  return pages.length;
}

/** Build and paginate in one call — what a page's rail actually wants. */
export function renderWorkbook(sheet, o, subject) {
  const sections = buildSections(o, subject);
  return paginate(sheet, blocksOf(sections, o, subject), o);
}
