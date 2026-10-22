/* ============================================================================
   PRINTABLE WORKBOOK — a bar model you BUILD
   ----------------------------------------------------------------------------
   On paper a word problem leaves an empty strip to draw its bar model in. On
   screen the strip becomes a board of bars, and the child builds the model
   the way a Singapore class does with paper strips:

     New bar        a bar on the next free row
     drag           move a bar anywhere; it settles on a row (so bars STACK,
                    lined up at the left) and its ends catch other bars' ends
     stretch        drag a bar's right edge — longer or shorter
     Units + / −    cut the bar into equal units (fifths, ten 10 % units …)
     Cut            tap a bar where it should break: it comes apart in two
     Over / Under   a curly brace over or under the picked bars, with words
     Beside         a curly brace down the right of the picked bars — the
                    total of two or more STACKED bars, which no one row can
                    carry over or under it
     Colour         the bar's colour, round the four
     Delete         the picked bars, and the braces that hung on them

   and every word is written by DOUBLE-CLICKING it: a unit's own label (a
   number, a "?", "10 %"), or a brace's words. Tap picks a bar; with "Pick
   several" on (or Shift held) taps add to the picking, so one brace can span
   two bars.

   It is working, never marked — what the model shows goes in the answer
   boxes beside it. The engine keeps it with the question and makes every
   change one Undo step (interactive.js).

     [data-barmodel]   the strip to build in; what was printed in it comes back
                       on dispose()
     [data-start]      a model to begin from (JSON) — the printed picture, so
                       "From the picture" puts it on the board to be broken,
                       labelled and moved about
     [data-fold]       a board under a printed picture: it waits folded to one
                       button until it is wanted (or already has work on it)

   The model is plain data — { bars: [{ id, x, row, w, n, tone, labels }],
   braces: [{ id, ids, at, text }] } in board units, 600 across.
   ========================================================================== */

import { MARK_CHAR, markLayout, markPath } from "./purse.js";
import { mountTooltips } from "/utils/components/tooltip.js";

const W = 600;         // how far a bar may reach
const VIEW = 680;      // and the board, with room at the right for a total beside
const BAR = 26;
const GAP = 8;         // between two stacked bars with nothing between them
const ROOM = 30;       // what a brace and its words need over or under a bar
const LEVEL = 22;      // and each further brace stacked on the same side
const SNAP = 5;
const CATCH = 9;       // how near an end must come to catch another
/**
 * TWENTY PAPERS TO CUT A BAR OUT OF.
 *
 * The board began with five, cycled by a button, which is enough for a
 * part-whole model and not enough for anything a teacher actually builds: six
 * rows of a comparison want six colours that are telling them apart, not the
 * same five going round again. The FIRST FIVE ARE THE ORIGINAL FIVE and in
 * their original order, because a bar's colour is stored as a number into
 * this list and every model built before today is still pointing into it.
 *
 * They are paper colours, not screen colours: a bar model is printed as often
 * as it is looked at, and a saturated fill eats a laser cartridge and makes
 * the number inside it hard to read.
 */
const TONES = [
  "#bfe3ff", "#fff3a8", "#d6f0cf", "#ffd9cf", "#fffdf8",
  "#ffd0e0", "#e2d6f8", "#cdeeea", "#ffe6b8", "#dfe6ef",
  "#c9e9c2", "#ffc9c2", "#d8e8ff", "#f6e2c0", "#e8f0b8",
  "#f0d4ef", "#c6e7f5", "#ffdfa8", "#d4dcc4", "#eadfd2",
];
const INK = "#2a2723";
const GREY = "#6f685f";

/* ── the keys, drawn ──────────────────────────────────────────────────────
   Fifteen tools is a row of words a board's width and more, and the board is
   the thing being used. So each one is its own filled glyph in the site's
   icon language (see utils/components/workbook/icons.js for the rule), with
   its name in the site's tooltip (tooltip.js) — the same bargain the workbook
   rail and the film editor make. */
const G = (inner) => `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">${inner}</svg>`;
const BX = (x, y, w, h, f, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${extra}/>`;
const SKY = "var(--accent-secondary,#bfe3ff)";
const SUN = "var(--accent-primary,#f4c95d)";
const LEAF = "var(--accent-success,#2e8b46)";
const RED = "var(--accent-danger,#c0453f)";
/** a bar with `cuts` division lines in it, as the body of most of these keys */
const barGlyph = (cuts = 0, fill = SKY, y = 8, h = 8) =>
  BX(2.5, y, 19, h, fill, ` stroke="${INK}" stroke-width="1.3"`)
  + Array.from({ length: cuts }, (_, i) => BX(2.5 + (19 / (cuts + 1)) * (i + 1) - 0.55, y, 1.1, h, INK)).join("");
const plus = (x, y) => BX(x - 3.6, y - 1.1, 7.2, 2.2, LEAF) + BX(x - 1.1, y - 3.6, 2.2, 7.2, LEAF);
const minus = (x, y) => BX(x - 3.6, y - 1.1, 7.2, 2.2, RED);

const ICON = {
  copy: G(barGlyph(1, SUN, 3, 7) + barGlyph(1, SKY, 14, 7)),
  new: G(barGlyph(0, SKY, 9, 7) + plus(12, 19.5)),
  more: G(barGlyph(3, SKY, 4, 8) + plus(12, 18.5)),
  less: G(barGlyph(1, SKY, 4, 8) + minus(12, 18.5)),
  uup: G(barGlyph(1, SUN, 3, 7) + barGlyph(3, SKY, 13, 7) + BX(10.8, 10.4, 2.4, 2.4, LEAF)),
  udn: G(barGlyph(3, SKY, 3, 7) + barGlyph(1, SUN, 13, 7) + BX(10.8, 10.4, 2.4, 2.4, RED)),
  /* one bar coming apart into the boxes it was cut into */
  split: G(BX(1.5, 8, 5.6, 8, SKY, ` stroke="${INK}" stroke-width="1.3"`)
    + BX(9.2, 8, 5.6, 8, SUN, ` stroke="${INK}" stroke-width="1.3"`)
    + BX(16.9, 8, 5.6, 8, LEAF, ` stroke="${INK}" stroke-width="1.3"`)),
  cut: G(barGlyph(0, SKY, 9, 8) + BX(11, 2.5, 2, 19, RED)),
  /* two pieces pushed back together, the join still showing as a unit line */
  join: G(BX(2.5, 8, 8.4, 8, SKY, ` stroke="${INK}" stroke-width="1.3"`)
    + BX(13.1, 8, 8.4, 8, SUN, ` stroke="${INK}" stroke-width="1.3"`)
    + `<path d="M11.6 12h1.2" stroke="${INK}" stroke-width="1.2"/>`
    + `<path d="M8.4 4.6 11.4 7.6 8.4 10.6" fill="${LEAF}"/>`
    + `<path d="M15.6 4.6 12.6 7.6l3 3" fill="${LEAF}"/>`),
  /* a figure written in one box and carried into the rest */
  fill: G(barGlyph(2, "none", 8, 8) + BX(3.6, 9.1, 4.8, 5.8, SUN)
    + `<path d="M11 12h7.4" stroke="${LEAF}" stroke-width="2" stroke-linecap="round"/>`
    + `<path d="M18.8 12 15.6 9.6v4.8Z" fill="${LEAF}"/>`),
  above: G(brace(true) + barGlyph(1, SKY, 12, 8)),
  below: G(barGlyph(1, SKY, 4, 8) + brace(false)),
  side: G(BX(2.5, 4, 13, 6, SKY, ` stroke="${INK}" stroke-width="1.2"`)
    + BX(2.5, 13, 13, 6, SUN, ` stroke="${INK}" stroke-width="1.2"`)
    + `<path d="M17.4 4.6q2 0 2 2.6v2.4q0 1.6 2 1.6-2 0-2 1.6v2.4q0 2.6-2 2.6" fill="none" stroke="${GREY}" stroke-width="1.5"/>`),
  tone: G(`<circle cx="12" cy="12" r="9.4" fill="${SUN}"/>`
    + `<path d="M12 2.6A9.4 9.4 0 0 1 12 21.4Z" fill="${SKY}"/>`
    + `<path d="M12 2.6A9.4 9.4 0 0 0 3.4 15.6Z" fill="${LEAF}"/>`
    + `<circle cx="12" cy="12" r="3" fill="#fffdf8"/>`),
  many: G(BX(2.4, 4, 8.6, 7, SKY, ` stroke="${INK}" stroke-width="1.2"`)
    + BX(2.4, 13, 8.6, 7, SKY, ` stroke="${INK}" stroke-width="1.2"`)
    + BX(13.4, 4, 8.2, 16, "none", ` stroke="${RED}" stroke-width="1.6" stroke-dasharray="2.6 2"`)),
  del: G(BX(8.6, 2.4, 6.8, 2.6, RED) + BX(3, 5, 18, 3.2, RED)
    + BX(5.2, 9.4, 13.6, 12, SUN, ` stroke="${INK}" stroke-width="1.2"`)),
  undo: G(`<path d="M12 6.4a7.6 7.6 0 1 1-7.1 10.2" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M4.2 3.4v6.2h6.2Z" fill="${RED}"/>`),
  fold: G(BX(3, 10.8, 18, 2.4, GREY) + `<path d="M12 20.4 7.4 15h9.2Z" fill="${SUN}"/>`
    + `<path d="M12 3.6 16.6 9H7.4Z" fill="${SUN}"/>`),
};

/** the curly over or under a bar, for the two brace keys */
function brace(up) {
  return up
    ? `<path d="M3.4 10.4q0-2.4 2.6-2.4h4q2 0 2-2 0 2 2 2h4q2.6 0 2.6 2.4" fill="none" stroke="${GREY}" stroke-width="1.6"/>`
    : `<path d="M3.4 13.6q0 2.4 2.6 2.4h4q2 0 2 2 0-2 2-2h4q2.6 0 2.6-2.4" fill="none" stroke="${GREY}" stroke-width="1.6"/>`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/**
 * A WORD ON THE BOARD, WITH ITS MARK IF IT HAS ONE. A sum of money carries the
 * prepbill mark, and the mark is in no font (purse.js): a label holding the
 * stand-in is set in the monospace face, where the mark takes exactly one
 * character's room, and the mark is struck in beside it.
 */
function label(x, y, s, { size = 13, anchor = "middle", fill = INK, extra = "" } = {}) {
  const str = String(s);
  const tag = (tx, an, face) => `<text x="${tx}" y="${y}" text-anchor="${an}"${face}`
    + ` font-size="${size}" font-weight="700" fill="${fill}"${extra}>`;
  if (!str.startsWith(MARK_CHAR)) return `${tag(x, anchor, "")}${esc(str)}</text>`;
  const at = markLayout(x, size, str.length, anchor);
  return markPath(at.mark, y, size, { fill })
    + `${tag(at.text.toFixed(2), "start", ' font-family="JetBrains Mono, monospace"')}${esc(str.slice(MARK_CHAR.length))}</text>`;
}

/** What a money label keeps when it is written over: its mark. */
const keepMark = (was, now) =>
  (String(was).startsWith(MARK_CHAR) && now && !now.startsWith(MARK_CHAR) && /^[\d.,]/.test(now) ? MARK_CHAR + now : now);

const clone = (m) => JSON.parse(JSON.stringify(m));
const blank = () => ({ bars: [], braces: [] });

/** A brace standing up at x from y0 to y1, its point to the right. */
function curlySide(x, y0, y1) {
  const h = 9;
  const m = (y0 + y1) / 2;
  const r = Math.min(6, (y1 - y0) / 5);
  return `M${x} ${y0}Q${x + h / 2} ${y0} ${x + h / 2} ${y0 + r}V${m - r}Q${x + h / 2} ${m} ${x + h} ${m}` +
    `Q${x + h / 2} ${m} ${x + h / 2} ${m + r}V${y1 - r}Q${x + h / 2} ${y1} ${x} ${y1}`;
}

function curly(x0, x1, y, dir) {
  const h = 9 * dir;
  const m = (x0 + x1) / 2;
  const r = Math.min(6, (x1 - x0) / 5);
  return `M${x0} ${y}Q${x0} ${y + h / 2} ${x0 + r} ${y + h / 2}H${m - r}Q${m} ${y + h / 2} ${m} ${y + h}` +
    `Q${m} ${y + h / 2} ${m + r} ${y + h / 2}H${x1 - r}Q${x1} ${y + h / 2} ${x1} ${y}`;
}

/** Where a brace is drawn: its span, its row, and how high it stacks. */
function braceSpots(model) {
  const byId = new Map(model.bars.map((b) => [b.id, b]));
  const spots = [];
  model.braces.forEach((br) => {
    const bars = br.ids.map((id) => byId.get(id)).filter(Boolean);
    if (!bars.length) return;
    const x0 = Math.min(...bars.map((b) => b.x));
    const x1 = Math.max(...bars.map((b) => b.x + b.w));
    if (br.at === "side") {
      const r0 = Math.min(...bars.map((b) => b.row)), r1 = Math.max(...bars.map((b) => b.row));
      const level = spots.filter((s) => s.at === "side" && s.r0 <= r1 && r0 <= s.r1).length;
      /* clear of EVERY bar in the rows it spans, not just the picked ones */
      const end = Math.max(x1, ...model.bars.filter((b) => b.row >= r0 && b.row <= r1).map((b) => b.x + b.w));
      spots.push({ br, x0, x1: end, r0, r1, at: "side", level });
      return;
    }
    const row = br.at === "above" ? Math.min(...bars.map((b) => b.row)) : Math.max(...bars.map((b) => b.row));
    /* a second brace on the same side of the same row, overlapping, goes a
       step further out */
    const level = spots.filter((s) => s.row === row && s.at === br.at && s.x0 < x1 && x0 < s.x1).length;
    spots.push({ br, x0, x1, row, at: br.at, level });
  });
  return spots;
}

/**
 *   mountBarModel(el, { saved, onChange })
 *     saved                 a model from before, or null
 *     onChange(now, before) after every change, for Undo
 *   → { get(), set(model), clear(), dispose() }
 */
export function mountBarModel(el, { saved = null, onChange = () => {} } = {}) {
  const printed = el.innerHTML;
  let model = saved ? clone(saved) : blank();
  let picked = new Set();
  let pickedBraces = new Set();
  let several = false;
  let cutting = false;
  let seq = 1 + Math.max(0, ...model.bars.map((b) => b.id), ...model.braces.map((b) => b.id));

  let start = null;
  try { start = el.dataset.start ? JSON.parse(el.dataset.start) : null; } catch { start = null; }
  const foldable = el.hasAttribute("data-fold");

  el.classList.add("is-building");
  el.classList.toggle("is-folded", foldable && !model.bars.length);
  /* a key: its glyph, and its name in the site's own tooltip */
  const key = (t, tint, name, extra = "") =>
    `<button type="button" class="pp-btn wb-tint-${tint} mbb-key" data-t="${t}"${extra}`
    + ` aria-label="${esc(name)}" data-tip="${esc(name)}" data-tip-side="down">${ICON[t]}</button>`;

  el.innerHTML =
    (foldable ? `<button type="button" class="pp-btn wb-tint-2 mbb-open">Build the model on a board</button>` : "") +
    `<div class="mbb-tools" role="toolbar" aria-label="Bar model tools">` +
    (start ? key("copy", 3, "Put the printed model on the board") : "") +
    key("new", 2, "A new bar") +
    key("more", 1, "Cut into one more equal unit") +
    key("less", 1, "One equal unit fewer") +
    key("uup", 1, "Halve every unit — units of units") +
    key("udn", 1, "Put every pair of units back together") +
    key("split", 2, "Split the picked bars into their units") +
    key("join", 2, "Join the picked pieces into one bar, keeping their lines") +
    key("cut", 3, "Cut: tap a bar where it should break", ' aria-pressed="false"') +
    key("fill", 2, "Write the same figure in every box of the picked bars") +
    key("above", 4, "A brace over the picked bars") +
    key("below", 4, "A brace under the picked bars") +
    key("side", 4, "A total down the right of the picked (stacked) bars") +
    key("tone", 2, "The colour of the picked bars") +
    key("many", 3, "Pick several: taps add to the picking", ' aria-pressed="false"') +
    key("undo", 1, "Step back", " disabled") +
    key("del", 4, "Take the picked bars and braces off") +
    (foldable ? key("fold", 1, "Fold the board away") : "") +
    `<div class="mbb-pot" data-pot hidden>` +
    `<div class="pp-receipt"><div class="pp-receipt__paper"><div class="mbb-pot__in">` +
    TONES.map((hex, i) => `<button type="button" class="pp-plain mbb-chip" data-tone="${i}"`
      + ` style="background:${hex}" aria-label="Colour ${i + 1}"></button>`).join("") +
    `</div></div></div></div>` +
    `</div>` +
    `<div class="mbb-board"><svg class="mbb-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>` +
    `<p class="mbb-hint">Double-click a bar or a brace to write on it. Drag a bar to move it, its right edge to stretch it — ends and unit lines catch.</p>`;
  const board = el.querySelector(".mbb-board");
  const svg = el.querySelector(".mbb-svg");
  const tools = el.querySelector(".mbb-tools");

  const rows = () => Math.max(3, ...model.bars.map((b) => b.row + 2));

  /* Rows STACK CLOSE: a row only makes room over or under its bar for the
     braces it actually has, so plain bars sit one just under the other, the
     way they are drawn on paper. */
  let tops = [];
  let height = 0;
  function layout() {
    const spots = braceSpots(model);
    tops = [];
    let y = 8;
    for (let r = 0; r < rows(); r++) {
      const room = (at) => {
        const mine = spots.filter((s) => s.row === r && s.at === at);
        return mine.length ? ROOM + LEVEL * Math.max(...mine.map((s) => s.level)) : 0;
      };
      y += room("above");
      tops[r] = y;
      y += BAR + room("below") + GAP;
    }
    height = y + 4;
  }
  const yOf = (row) => (row < tops.length ? tops[row] : tops[tops.length - 1] + (row - tops.length + 1) * (BAR + GAP));
  /** The row whose bar is nearest to a bar top at y — or the next empty one. */
  const rowAt = (y) => {
    let best = 0;
    for (let r = 0; r <= tops.length; r++) if (Math.abs(yOf(r) - y) < Math.abs(yOf(best) - y)) best = r;
    return best;
  };

  /* ── drawing ─────────────────────────────────────────────────────────── */
  function paint() {
    layout();
    const H = height;
    svg.setAttribute("viewBox", `0 0 ${VIEW} ${H}`);
    let out = "";
    for (let r = 0; r < rows(); r++) {
      out += `<line x1="0" x2="${VIEW}" y1="${yOf(r) + BAR}" y2="${yOf(r) + BAR}" stroke="${GREY}" stroke-width="0.6" stroke-dasharray="2 6" opacity="0.35"/>`;
    }
    model.bars.forEach((b) => {
      const y = yOf(b.row);
      const on = picked.has(b.id);
      const unit = b.w / b.n;
      out += `<g class="mbb-bar${on ? " is-picked" : ""}" data-id="${b.id}">` +
        `<rect class="mbb-body" x="${b.x}" y="${y}" width="${b.w}" height="${BAR}" fill="${TONES[b.tone % TONES.length]}" stroke="${on ? "#d1495b" : INK}" stroke-width="${on ? 2.4 : 1.2}"/>`;
      for (let i = 1; i < b.n; i++) out += `<line x1="${b.x + i * unit}" x2="${b.x + i * unit}" y1="${y}" y2="${y + BAR}" stroke="${INK}" stroke-width="1"/>`;
      for (let i = 0; i < b.n; i++) {
        const t = b.labels[i];
        if (t) out += label(b.x + (i + 0.5) * unit, y + BAR / 2 + 5, t, { size: unit < 34 ? 11 : 14, extra: ' pointer-events="none"' });
      }
      out += `<rect class="mbb-grip" data-grip="${b.id}" x="${b.x + b.w - 7}" y="${y - 3}" width="14" height="${BAR + 6}" fill="transparent"/>` +
        `<rect x="${b.x + b.w - 2}" y="${y + 7}" width="4" height="${BAR - 14}" rx="2" fill="${INK}" opacity="${on ? 0.7 : 0.25}" pointer-events="none"/>` +
        `</g>`;
    });
    braceSpots(model).forEach((s) => {
      if (s.at === "side") {
        const x = s.x1 + 6 + s.level * 46;
        const y0 = yOf(s.r0), y1 = yOf(s.r1) + BAR;
        const m = (y0 + y1) / 2;
        const on = pickedBraces.has(s.br.id);
        out += `<g class="mbb-brace${on ? " is-picked" : ""}" data-brace="${s.br.id}">` +
          `<path d="${curlySide(x, y0, y1)}" fill="none" stroke="${on ? "#d1495b" : GREY}" stroke-width="${on ? 2.4 : 1.4}"/>` +
          `<rect x="${x + 8}" y="${m - 12}" width="70" height="22" fill="transparent"/>` +
          label(x + 13, m + 5, s.br.text || "…", { anchor: "start", fill: s.br.text ? INK : GREY }) + `</g>`;
        return;
      }
      const y = s.at === "above" ? yOf(s.row) - 3 - s.level * 22 : yOf(s.row) + BAR + 3 + s.level * 22;
      const dir = s.at === "above" ? -1 : 1;
      const ty = s.at === "above" ? y - 12 : y + 21;
      const words = s.br.text || "…";
      const on = pickedBraces.has(s.br.id);
      out += `<g class="mbb-brace${on ? " is-picked" : ""}" data-brace="${s.br.id}">` +
        `<path d="${curly(s.x0, s.x1, y, dir)}" fill="none" stroke="${on ? "#d1495b" : GREY}" stroke-width="${on ? 2.4 : 1.4}"/>` +
        `<rect x="${(s.x0 + s.x1) / 2 - 40}" y="${ty - 14}" width="80" height="19" fill="transparent"/>` +
        label((s.x0 + s.x1) / 2, ty, words, { fill: s.br.text ? INK : GREY }) + `</g>`;
    });
    svg.innerHTML = out;
    tools.querySelector('[data-t="cut"]').setAttribute("aria-pressed", String(cutting));
    tools.querySelector('[data-t="undo"]').disabled = !history.length;
    tools.querySelector('[data-t="many"]').setAttribute("aria-pressed", String(several));
    board.classList.toggle("is-cutting", cutting);
  }

  /* ── changes, each one Undo step ─────────────────────────────────────── */
  /* THE BOARD'S OWN STEP BACK. On a workbook page every change is already an
     Undo step of the sheet's (interactive.js); opened as a TOOL from the rail
     there is no sheet to undo, and a mis-aimed Delete took the afternoon with
     it. The document is small, so the honest undo is a stack of whole models,
     kept before each change. */
  const history = [];
  function stepBack() {
    const was = history.pop();
    if (!was) return;
    const before = clone(model);
    model = JSON.parse(was);
    picked.clear();
    pickedBraces.clear();
    paint();
    onChange(clone(model), before);
  }

  function change(fn) {
    const before = clone(model);
    history.push(JSON.stringify(before));
    if (history.length > 60) history.shift();
    fn();
    model.braces = model.braces.filter((br) => br.ids.some((id) => model.bars.some((b) => b.id === id)));
    paint();
    if (JSON.stringify(before) !== JSON.stringify(model)) onChange(clone(model), before);
  }

  const pickedBars = () => model.bars.filter((b) => picked.has(b.id));
  const snap = (v) => Math.round(v / SNAP) * SNAP;
  /**
   * An end near a line of another bar catches it.
   *
   * ITS UNIT LINES COUNT, NOT ONLY ITS ENDS. A bar model is read by what
   * lines up with what: the point of laying a shorter bar under a longer one
   * is to show that it reaches exactly as far as three of the units above
   * it. Catching only the ends made that the one thing the board would not
   * help you do — you lined it up by eye, printed it, and it was two units
   * and a whisker.
   */
  function caught(v, self) {
    let best = v, gap = CATCH;
    const lines = [0];
    model.bars.filter((b) => b.id !== self).forEach((b) => {
      lines.push(b.x, b.x + b.w);
      for (let i = 1; i < b.n; i++) lines.push(b.x + (b.w / b.n) * i);
    });
    lines.forEach((e) => {
      if (Math.abs(e - v) < gap) { gap = Math.abs(e - v); best = e; }
    });
    return gap < CATCH ? best : snap(v);
  }

  /** The point under the pointer, in board units. */
  function at(e) {
    const r = svg.getBoundingClientRect();
    const k = VIEW / r.width;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
  }

  /* ── tools ───────────────────────────────────────────────────────────── */
  el.querySelector(".mbb-open")?.addEventListener("click", () => { el.classList.remove("is-folded"); paint(); });

  const pot = el.querySelector("[data-pot]");
  pot.addEventListener("click", (e) => {
    const tone = e.target.closest("[data-tone]")?.dataset.tone;
    if (tone == null) return;
    const bars = pickedBars();
    if (bars.length) change(() => bars.forEach((b) => { b.tone = Number(tone); }));
    pot.hidden = true;
  });
  /* a press anywhere else puts the pot away, the way every other sheet of
     choices on the bench behaves */
  const shutPot = (e) => { if (!pot.hidden && !e.target.closest("[data-pot], [data-t=\"tone\"]")) pot.hidden = true; };
  document.addEventListener("pointerdown", shutPot, true);

  tools.addEventListener("click", (e) => {
    const t = e.target.closest("[data-t]")?.dataset.t;
    if (!t) return;
    if (t === "fold") { el.classList.add("is-folded"); return; }
    if (t === "copy") {
      change(() => {
        /* fresh ids after whatever is already there, so Undo can take it off */
        const map = new Map();
        const at = model.bars.length ? Math.max(...model.bars.map((b) => b.row)) + 1 : 0;
        start.bars.forEach((b) => { const id = seq++; map.set(b.id, id); model.bars.push({ ...clone(b), id, row: b.row + at }); });
        start.braces.forEach((br) => model.braces.push({ ...clone(br), id: seq++, ids: br.ids.map((i) => map.get(i)) }));
        picked.clear();
      });
      return;
    }
    if (t === "cut") { cutting = !cutting; paint(); return; }
    if (t === "many") { several = !several; paint(); return; }
    if (t === "new") {
      change(() => {
        const row = model.bars.length ? Math.max(...model.bars.map((b) => b.row)) + 1 : 0;
        const b = { id: seq++, x: 0, row, w: 200, n: 1, tone: model.bars.length % TONES.length, labels: [""] };
        model.bars.push(b);
        picked = new Set([b.id]);
      });
      return;
    }
    if (t === "undo") { stepBack(); return; }
    if (t === "tone") {
      /* the pot opens under the key rather than the colour stepping on by one:
         twenty papers is a thing you choose from, not a thing you cycle */
      if (!pickedBars().length) { flash("Tap a bar first to pick it."); return; }
      pot.hidden = !pot.hidden;
      return;
    }
    if (t === "del") {
      if (!picked.size && !pickedBraces.size) { flash("Tap a bar or a brace first to pick it."); return; }
      change(() => {
        model.bars = model.bars.filter((b) => !picked.has(b.id));
        /* A BRACE IS A THING, and can be taken off on its own. It used to go
           only when the last bar under it went, so a brace put over the wrong
           stretch could not be removed without removing the bars. */
        model.braces = model.braces.filter((br) => !pickedBraces.has(br.id));
        picked.clear();
        pickedBraces.clear();
      });
      return;
    }
    const bars = pickedBars();
    if (!bars.length) { flash("Tap a bar first to pick it."); return; }
    if (t === "more" || t === "less") {
      change(() => bars.forEach((b) => {
        b.n = Math.max(1, Math.min(20, b.n + (t === "more" ? 1 : -1)));
        b.labels = Array.from({ length: b.n }, (_, i) => b.labels[i] || "");
      }));
    } else if (t === "uup" || t === "udn") {
      /* UNITS OF UNITS. Halving every unit at once is how a bar model
         actually grows — thirds into sixths, quarters into eighths — and
         getting there by pressing Units + three times is both slow and wrong,
         because it passes through fifths and sevenths on the way. */
      change(() => bars.forEach((b) => {
        if (t === "uup") {
          const n = Math.min(20, b.n * 2);
          if (n === b.n) return;
          b.labels = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? b.labels[i / 2] || "" : ""));
          b.n = n;
        } else {
          const n = Math.max(1, Math.floor(b.n / 2));
          b.labels = Array.from({ length: n }, (_, i) => b.labels[i * 2] || "");
          b.n = n;
        }
      }));
    } else if (t === "split") {
      /* EVERY UNIT BECOMES A BAR OF ITS OWN, so the pieces can be dragged
         apart, shared out and lined up under something else. A brace that
         hung on the bar hangs on all of its pieces, which is the same stretch
         of the picture it was drawn over. */
      change(() => {
        bars.forEach((b) => {
          if (b.n < 2) return;
          const unit = b.w / b.n;
          const made = [];
          for (let i = 0; i < b.n; i++) {
            made.push({
              id: i === 0 ? b.id : seq++, x: Math.round(b.x + i * unit), row: b.row,
              w: Math.round(unit), n: 1, tone: b.tone, labels: [b.labels[i] || ""],
            });
          }
          const at = model.bars.indexOf(b);
          model.bars.splice(at, 1, ...made);
          model.braces.forEach((br) => {
            if (!br.ids.includes(b.id)) return;
            br.ids = [...new Set([...br.ids.filter((x) => x !== b.id), ...made.map((m) => m.id)])];
          });
          made.forEach((m) => picked.add(m.id));
        });
      });
    } else if (t === "join") {
      /* AND BACK AGAIN — but the cuts are kept as unit lines. Pieces that have
         been dealt out and brought back together are not one plain bar again:
         what they were cut into is the whole point of the picture. */
      const row = bars[0].row;
      const mine = bars.filter((b) => b.row === row).sort((a, b) => a.x - b.x);
      if (mine.length < 2) { flash("Pick two or more pieces on the same row to join."); return; }
      change(() => {
        const first = mine[0];
        const right = Math.max(...mine.map((b) => b.x + b.w));
        const labels = mine.flatMap((b) => Array.from({ length: b.n }, (_, i) => b.labels[i] || ""));
        const gone = new Set(mine.slice(1).map((b) => b.id));
        first.w = right - first.x;
        first.n = Math.min(20, labels.length);
        first.labels = labels.slice(0, first.n);
        model.bars = model.bars.filter((b) => !gone.has(b.id));
        model.braces.forEach((br) => {
          if (!br.ids.some((id) => gone.has(id))) return;
          br.ids = [...new Set([...br.ids.filter((id) => !gone.has(id)), first.id])];
        });
        picked = new Set([first.id]);
      });
    } else if (t === "fill") {
      /* ONE FIGURE, WRITTEN ONCE. Equal units say the same thing by
         definition, and typing "₱250" into eight boxes is eight chances to
         mistype it. The first figure already written is the one that spreads. */
      const from = bars.flatMap((b) => b.labels).find((x) => x && x.trim());
      if (!from) { flash("Write the figure in one box first, then press this."); return; }
      change(() => bars.forEach((b) => { b.labels = b.labels.map(() => from); }));
    } else if (t === "above" || t === "below" || t === "side") {
      const br = { id: seq++, ids: bars.map((b) => b.id), at: t, text: "" };
      change(() => model.braces.push(br));
      editBrace(br.id);
    }
  });

  let flashing = 0;
  function flash(text) {
    const hint = el.querySelector(".mbb-hint");
    hint.textContent = text;
    hint.classList.add("is-loud");
    clearTimeout(flashing);
    flashing = setTimeout(() => {
      hint.classList.remove("is-loud");
      hint.textContent = "Double-click a bar or a brace to write on it. Drag a bar to move it, its right edge to stretch it — ends and unit lines catch.";
    }, 2200);
  }

  /* ── moving, stretching, picking, cutting ────────────────────────────── */
  let drag = null;
  let tapped = null;      // a brace waiting to see whether this is its second tap
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const grip = e.target.closest("[data-grip]");
    const g = e.target.closest(".mbb-bar");
    if (!g) {
      const braceG = e.target.closest(".mbb-brace");
      if (braceG) {
        const id = Number(braceG.dataset.brace);
        if (!several && !e.shiftKey) pickedBraces.clear();
        if (pickedBraces.has(id)) pickedBraces.delete(id); else pickedBraces.add(id);
        if (!several && !e.shiftKey) picked.clear();
        paint();
        /* THE WORDS ARE OPENED ON POINTER-UP, NEVER HERE. An input made and
           focused during pointerdown is blurred again by the press's own
           default — the browser moves focus off it the moment the handler
           returns — and the blur takes the box away before a key is hit,
           which is what "the question mark cannot be written on" was.
           preventDefault keeps the focus where it is; pointerup opens the box,
           the same way a bar's own label is opened. */
        e.preventDefault();
        tapped = Number(braceG.dataset.brace);
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (!several && !e.shiftKey) { picked.clear(); pickedBraces.clear(); paint(); }
      return;
    }
    const b = model.bars.find((x) => x.id === Number(g.dataset.id));
    const p = at(e);
    if (cutting && !grip) {
      cutAt(b, p.x);
      return;
    }
    e.preventDefault();
    tapped = null;
    if (!several && !e.shiftKey) pickedBraces.clear();
    drag = { b, from: p, x: b.x, row: b.row, top: yOf(b.row), w: b.w, grip: !!grip, before: clone(model), moved: false, add: several || e.shiftKey };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = at(e);
    const dx = p.x - drag.from.x, dy = p.y - drag.from.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const b = drag.b;
    if (drag.grip) {
      b.w = Math.max(20, Math.min(W - b.x, caught(b.x + drag.w + dx, b.id) - b.x));
    } else {
      b.x = Math.max(0, Math.min(W - b.w, caught(drag.x + dx, b.id)));
      /* the right end can catch too, when the left has nothing near it */
      const right = caught(b.x + b.w, b.id);
      if (right !== snap(b.x + b.w) && Math.abs(right - (b.x + b.w)) < CATCH) b.x = Math.max(0, right - b.w);
      b.row = Math.min(rows(), rowAt(drag.top + dy));
    }
    paint();
  });
  const up = (e) => {
    if (tapped != null) {
      const id = tapped;
      tapped = null;
      /* a pointer taken away from us is not a tap */
      if (e?.type !== "pointercancel" && twice(`brace${id}`)) editBrace(id);
      return;
    }
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) {
      /* a second tap on the same bar writes on it; a first one picks it */
      if (twice(`bar${d.b.id}`)) { editBar(d.b, d.from.x); return; }
      if (d.add) { if (picked.has(d.b.id)) picked.delete(d.b.id); else picked.add(d.b.id); } else picked = new Set([d.b.id]);
      paint();
      return;
    }
    picked = new Set(d.add ? [...picked, d.b.id] : [d.b.id]);
    paint();
    if (JSON.stringify(d.before) !== JSON.stringify(model)) onChange(clone(model), d.before);
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);

  /** Break a bar in two where it was tapped — on a unit line if it has units. */
  function cutAt(b, x) {
    const unit = b.w / b.n;
    let k, cutX;
    if (b.n > 1) {
      k = Math.round((x - b.x) / unit);
      if (k <= 0 || k >= b.n) { flash("Tap between two units to cut there."); return; }
      cutX = b.x + k * unit;
    } else {
      cutX = snap(x);
      if (cutX - b.x < 10 || b.x + b.w - cutX < 10) { flash("Too near the end to cut."); return; }
    }
    change(() => {
      const right = { id: seq++, x: cutX, row: b.row, w: b.x + b.w - cutX, n: b.n > 1 ? b.n - k : 1, tone: b.tone, labels: b.n > 1 ? b.labels.slice(k) : [""] };
      b.w = cutX - b.x;
      if (b.n > 1) { b.n = k; b.labels = b.labels.slice(0, k); }
      model.bars.push(right);
      picked = new Set([b.id, right.id]);
    });
    cutting = false;
    paint();
  }

  /* ── writing on it ───────────────────────────────────────────────────── */
  function inputAt(x, y, w, value, done) {
    el.querySelector(".mbb-write")?.remove();
    const r = svg.getBoundingClientRect();
    const br = board.getBoundingClientRect();
    const k = r.width / VIEW;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "mbb-write";
    input.value = value;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "write on the bar model");
    const width = Math.max(70, w * k);
    input.style.left = `${r.left - br.left + x * k - width / 2}px`;
    input.style.top = `${r.top - br.top + y * k - 14}px`;
    input.style.width = `${width}px`;
    board.appendChild(input);
    input.focus();
    input.select();
    let over = false;
    const finish = (keep) => {
      if (over) return;
      over = true;
      const v = input.value.trim().slice(0, 24);
      input.remove();
      if (keep) done(v);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  }

  /* WHAT IS TYPED IS JUST THE WORDS. A label that says a sum of money holds
     the prepbill stand-in, which is no use to anybody in a text box: the box
     opens on the words alone, and if what comes back is a number the mark goes
     straight back on the front of it. */
  const bare = (t) => String(t || "").replace(MARK_CHAR, "");

  function editBrace(id) {
    const s = braceSpots(model).find((x) => x.br.id === id);
    if (!s) return;
    const write = (v) => change(() => {
      const br = model.braces.find((b) => b.id === id);
      if (br) br.text = keepMark(br.text, v);
    });
    if (s.at === "side") {
      const x = s.x1 + 6 + s.level * 46;
      inputAt(Math.min(VIEW - 40, x + 48), (yOf(s.r0) + yOf(s.r1) + BAR) / 2, 80, bare(s.br.text), write);
      return;
    }
    const y = s.at === "above" ? yOf(s.row) - 3 - s.level * 22 - 16 : yOf(s.row) + BAR + 3 + s.level * 22 + 16;
    inputAt((s.x0 + s.x1) / 2, y, Math.min(160, s.x1 - s.x0), bare(s.br.text), write);
  }

  /* A DOUBLE tap is counted here, not left to the browser's dblclick: the
     first tap picks the bar and the board is drawn afresh, and a dblclick
     whose two clicks land on two different elements never fires. Counting
     taps also makes it work with a finger. */
  let lastTap = null;
  function twice(what) {
    const now = Date.now();
    const yes = lastTap && lastTap.what === what && now - lastTap.at < 450;
    lastTap = yes ? null : { what, at: now };
    return yes;
  }

  function editBar(b, x) {
    const unit = b.w / b.n;
    const i = Math.max(0, Math.min(b.n - 1, Math.floor((x - b.x) / unit)));
    inputAt(b.x + (i + 0.5) * unit, yOf(b.row) + BAR / 2, unit, bare(b.labels[i]), (v) => change(() => {
      const bar = model.bars.find((x) => x.id === b.id);
      if (bar) bar.labels[i] = keepMark(bar.labels[i], v);
    }));
  }

  paint();
  /* the keys say what they are the way everything else on the bench does */
  mountTooltips();

  return {
    get: () => clone(model),
    set(m) { model = m ? clone(m) : blank(); picked.clear(); pickedBraces.clear(); paint(); return clone(model); },
    clear() { model = blank(); picked.clear(); pickedBraces.clear(); paint(); },
    dispose() {
      document.removeEventListener("pointerdown", shutPot, true);
      el.classList.remove("is-building");
      el.innerHTML = printed;
    },
  };
}
