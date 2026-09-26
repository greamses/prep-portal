/* ============================================================================
   Maths Workbook — a sum written down the page
   ----------------------------------------------------------------------------
   THE SAME SHEET THE WRITTEN BOARDS USE (utils/components/boards/sheet.js): a
   grid with a cell per place, figures laid into it, a rule drawn under a row,
   and a box where the next figure goes. Not a table.

   A table was the obvious thing and the wrong one. A table cell is sized by
   what is in it and by every other cell in its column, so the box a child types
   into was whatever width the row above happened to leave — which cut the
   typing off. Here every cell is the same measured size, set once at the top,
   and the box is exactly the cell. The columns line up because they are grid
   columns, not because three rows happened to agree.

   The one thing this adds to the board is the PLACE TAGS along the top — O, T,
   H, Th in the same butter/sky/leaf as the blocks and the place-value chart,
   because the single thing that goes wrong in a written sum is a figure in the
   wrong column, and a column here should be visibly the same column as a
   column there.

   It is measured in millimetres rather than the board's rem, because this sheet
   is also a piece of paper that comes out of a printer.
   ========================================================================== */

import { placeFill } from "./blocks.js";

const NAMES = ["O", "T", "H", "Th", "TTh", "HTh", "M"];

/* how tall each kind of row is */
const HEIGHT = { tag: "5mm", carry: "6mm", figures: "9mm", answer: "9.6mm" };

/**
 * Start a sheet `cols` places wide. `places` is how many of them are places the
 * question is ABOUT — an addition gets one column more than that, to spill into,
 * and a spill column is left untagged because it is not a place the question
 * names, it is room to be surprised.
 *
 * Every method below takes a row number and a PLACE (0 is the ones, counting
 * left), never a grid column: the sheet does that arithmetic once.
 */
export function colSheet({ cols, places = cols, steps = "rtl" }) {
  const bits = [];
  const kinds = [];                       // row number → what kind of row it is

  const grow = (row, kind) => {
    while (kinds.length <= row) kinds.push("figures");
    if (kind) kinds[row] = kind;
    return `grid-row:${row + 1};`;
  };
  /* column 1 is the sign, then the places from the left */
  const gcol = (place, span = 1) =>
    `grid-column:${2 + (cols - 1 - place)}${span > 1 ? ` / span ${span}` : ""};`;
  const put = (cls, style, text = "", attrs = "") =>
    bits.push(`<span class="${cls}"${attrs} style="${style}">${text}</span>`);

  return {
    /** The place tags across the top. Always row 0. */
    tags() {
      for (let p = 0; p < places; p++) {
        put("ms-col__tag", `${grow(0, "tag")}${gcol(p)}--ms-fill:${placeFill(p)}`, NAMES[p] || "");
      }
      return this;
    },
    /** A figure that is printed: part of the question, or the worked answer. */
    mark(row, place, text, cls = "") {
      put(`ms-col__mark${cls ? ` ${cls}` : ""}`, `${grow(row)}${gcol(place)}`, text);
      return this;
    },
    /** The +, − or × in front of the row. */
    sign(row, ch) {
      put("ms-col__sign", `${grow(row)}grid-column:1;`, ch);
      return this;
    },
    /**
     * A carry box. `figure` null leaves it empty — a place to write, which the
     * page counts as one — and a figure written in makes it print instead, so a
     * worked example is not counted as work the child has left undone.
     *
     * `under` is the row whose figures this carry belongs to: the screen brings
     * the box out only once the column to its right has been written there.
     */
    carry(row, place, figure = null, under = row + 1) {
      grow(row, "carry");
      if (figure == null) {
        put("ms-col__carry ms-down__carrybox", `${grow(row)}${gcol(place)}`, "",
          ` data-carry="${place}" data-crow="${under}"`);
      } else {
        put("ms-col__carry ms-down__carrywrote", `${grow(row)}${gcol(place)}`, String(figure));
      }
      return this;
    },
    /**
     * A box for the child to write a figure in.
     *
     * ONLY THE FIGURES THE ANSWER HAS get a box: a column the answer never
     * reaches is not a box left empty, it is not there.
     *
     * The order they are PUT in is the order the page lists them, which is the
     * order the answers are read off the key — highest place first, the way a
     * number is written. Where each one sits is decided by its grid column, so
     * the order they are written in (from the right, see stepwise) has nothing
     * to do with it.
     */
    box(row, place) {
      put("ms-col__cell wb-cell", `${grow(row, "answer")}${gcol(place)}`, "",
        ` data-col="${place}" data-row="${row}"`);
      return this;
    },
    /** The boxes of a whole row: places `top` down to 0, highest first. */
    boxes(row, top) {
      for (let p = top; p >= 0; p--) this.box(row, p);
      return this;
    },
    /** The carry boxes of a row, highest place first, as the key lists them. */
    carries(row, from, figures = [], under = row + 1) {
      for (let p = from; p >= 1; p--) this.carry(row, p, figures[p] ?? null, under);
      return this;
    },
    /** The line under a row — the heavy one under the last thing being added. */
    rule(row, { heavy = false } = {}) {
      put(`ms-col__rule${heavy ? " is-heavy" : ""}`,
        `${grow(row)}grid-column:1 / span ${cols + 1};`);
      return this;
    },
    /** The sheet itself. */
    html(extra = "") {
      const rows = kinds.map((k) => HEIGHT[k] || HEIGHT.figures).join(" ");
      /* `data-nomath`: the figures of a written sum are not an expression to be
         typeset, they are figures that have to stay in their columns
         (mathify.js keeps out of anything that says so). */
      return `<div class="ms-col${extra ? ` ${extra}` : ""}" data-nomath${steps ? ` data-steps="${steps}"` : ""}`
        + ` style="--ms-cols:${cols};grid-template-rows:${rows}">${bits.join("")}</div>`;
    },
  };
}

/** A number as its figures, lowest place first — the order everything here uses. */
export const figuresOf = (n, places) => {
  const out = [];
  let v = Math.abs(n);
  for (let i = 0; i < places; i++) { out.push(v % 10); v = Math.floor(v / 10); }
  return out;
};

/** The highest place a number reaches. */
export const topOf = (n) => String(Math.abs(n)).length - 1;
