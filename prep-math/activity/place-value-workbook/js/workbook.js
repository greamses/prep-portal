/* ============================================================================
   Place Value Workbook — building the paper, and cutting it into pages
   ----------------------------------------------------------------------------
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
   ========================================================================== */

import { exerciseById, unavailable, placesFor } from "./exercises.js";
import { blocksKey } from "./blocks.js";
import { ICON } from "./icons.js";
import { stream, seedFrom, placeName, placeWorth, seedCode } from "./numbers.js";
import { baseWord } from "../../base-blocks/js/config.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* Paper, in millimetres, with the margins the pages are actually laid out to. */
export const PAPERS = {
  a4: { id: "a4", label: "A4", w: 210, h: 297 },
  letter: { id: "letter", label: "US Letter", w: 216, h: 279 },
};

/* ── build ─────────────────────────────────────────────────────────────────*/

/**
 * Draw every question the options ask for.
 *
 * Each exercise gets its OWN stream, mixed from the seed and the exercise's
 * ID — so turning section C from four questions to six leaves sections A, B and
 * D exactly as they were. A worksheet you cannot adjust without reprinting the
 * whole thing is a worksheet nobody adjusts.
 *
 * The ID rather than the position in the registry, because a new exercise
 * slotted in between two old ones would otherwise reshuffle the questions of
 * every exercise below it, and a seed code printed last term would rebuild a
 * different paper this term. The registry is meant to be added to.
 */
export function buildSections(o) {
  const out = [];
  o.chosen.forEach((choice) => {
    const ex = exerciseById(choice.id);
    if (!ex || !choice.count) return;
    if (unavailable(ex, o)) return;

    const r = stream(o.seed, seedFrom(ex.id));
    const opts = { ...o, places: placesFor(ex, o) };

    const groupSize = ex.groupSize || 1;
    const items = [];
    let made = 0;
    let guard = 0;
    while (made < choice.count && guard++ < 200) {
      const k = Math.min(groupSize, choice.count - made);
      items.push({ item: ex.make(r, opts, k), first: made + 1, k });
      made += k;
    }
    out.push({ ex, opts, items, count: made });
  });
  return out;
}

/* ── the DOM of one workbook ───────────────────────────────────────────────*/

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

/** The title block that stands at the head of page one. */
function coverBlock(o) {
  const rule = (label) =>
    `<span class="pv-cover__field"><em>${label}</em><span class="pv-line pv-line--fill"></span></span>`;
  const sub =
    o.base === 10
      ? `${o.places} places · ${placeName(o.places - 1, 10).toLowerCase()} to ones`
      : `base ${baseWord(o.base)} · ${o.places} places · ${placeWorth(o.places - 1, o.base)} to 1`;
  return el(
    "header",
    "pv-cover",
    `<p class="pv-cover__eyebrow">Mathematics · Place value</p>
     <h1 class="pv-cover__title">${escape(o.title)}</h1>
     <p class="pv-cover__sub">${sub}</p>
     ${o.nameLine ? `<div class="pv-cover__rules">${rule("Name")}${rule("Class")}${rule("Date")}</div>` : ""}`
  );
}

/** The heading that opens a section, and the blocks key when one is due. */
function headBlock(section, letter, withKey, o) {
  const node = el("div", "pv-sec");
  node.innerHTML =
    `<h2 class="pv-sec__title"><span class="pv-sec__letter">${letter}</span>${section.ex.heading}</h2>` +
    `<p class="pv-sec__say">${section.ex.instruction(section.opts)}</p>`;
  if (withKey) {
    const names = Array.from({ length: 4 }, (_, p) => placeName(p, o.base));
    const worths = Array.from({ length: 4 }, (_, p) => placeWorth(p, o.base));
    node.insertAdjacentHTML("beforeend", blocksKey(o.base, names, worths));
  }
  return node;
}

/** One question, numbered. */
function itemNode(section, entry) {
  const node = el("div", "pv-item");
  const no =
    entry.k > 1
      ? `${entry.first}–${entry.first + entry.k - 1}`
      : `${entry.first}`;
  node.innerHTML =
    `<span class="pv-item__no">${no}</span>` +
    `<div class="pv-item__body">${section.ex.render(entry.item, section.opts)}</div>`;
  return node;
}

/**
 * The flat list of blocks the whole workbook is made of. Rows of two are made
 * HERE, so that pagination never has to reason about columns.
 */
export function blocksOf(sections, o) {
  const blocks = [];
  blocks.push({ kind: "cover", node: coverBlock(o) });

  let keyDone = false;
  sections.forEach((section, i) => {
    const wantsKey = section.ex.group === "blocks" && !keyDone && o.blocksKey;
    if (wantsKey) keyDone = true;
    blocks.push({ kind: "head", node: headBlock(section, LETTERS[i] || "•", wantsKey, o) });

    const cols = section.ex.cols || 1;
    for (let k = 0; k < section.items.length; k += cols) {
      const row = el("div", `pv-row pv-row--${cols}`);
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
  const out = [{ kind: "break", node: el("div", "pv-break") }];
  out.push({
    kind: "head",
    node: el(
      "div",
      "pv-sec pv-sec--key",
      `<h2 class="pv-sec__title"><span class="pv-sec__letter pv-sec__letter--key">${ICON.check}</span>Answers</h2>
       <p class="pv-sec__say">Workbook ${seedCode(o.seed)} — every copy printed with this code has these answers.</p>`
    ),
  });

  sections.forEach((section, i) => {
    const rows = [];
    let n = 1;
    section.items.forEach((entry) => {
      const answers = section.ex.answer(entry.item, section.opts) || [];
      answers.forEach((a) => {
        rows.push(`<li><span class="pv-key__no">${n++}</span><span>${a}</span></li>`);
      });
    });
    out.push({
      kind: "row",
      node: el(
        "div",
        "pv-answers",
        `<h3 class="pv-answers__title">${LETTERS[i] || "•"} · ${section.ex.heading}</h3>` +
          `<ol class="pv-answers__list">${rows.join("")}</ol>`
      ),
    });
  });
  return out;
}

/* ── paginate ──────────────────────────────────────────────────────────────*/

function newPage(sheet, paper) {
  const page = el("section", "pv-page");
  page.innerHTML =
    `<div class="pv-page__inner"></div>` +
    `<footer class="pv-page__foot"><span class="pv-page__mark"></span><span class="pv-page__no"></span></footer>`;
  sheet.appendChild(page);
  void paper;
  return page.querySelector(".pv-page__inner");
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
  sheet.style.setProperty("--pv-w", paper.w + "mm");
  sheet.style.setProperty("--pv-h", paper.h + "mm");

  let inner = newPage(sheet, paper);

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];

    if (b.kind === "break") {
      if (inner.childElementCount) inner = newPage(sheet, paper);
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
      inner = newPage(sheet, paper);
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
        inner = newPage(sheet, paper);
        inner.appendChild(b.node);
      }
    }
  }

  /* Number the pages, and stamp each one so a sheet that gets separated from
     the others can still be matched back to its workbook and its answers. */
  const pages = [...sheet.querySelectorAll(".pv-page")];
  pages.forEach((p, i) => {
    p.querySelector(".pv-page__no").textContent = `${i + 1} / ${pages.length}`;
    p.querySelector(".pv-page__mark").textContent =
      `${o.title} · ${seedCode(o.seed)}`;
  });
  return pages.length;
}

/* ── odds and ends ─────────────────────────────────────────────────────────*/

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}
