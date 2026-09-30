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
/* how tall each kind of row is */
const HEIGHT = { tag: "5mm", carry: "6.6mm", figures: "9mm", slot: "9.4mm", answer: "12.4mm" };

/**
 * Start a sheet `cols` places wide. `places` is how many of them are places the
 * question is ABOUT — an addition gets one column more than that, to spill into,
 * and a spill column is left untagged because it is not a place the question
 * names, it is room to be surprised.
 *
 * Every method below takes a row number and a PLACE (0 is the ones, counting
 * left), never a grid column: the sheet does that arithmetic once.
 */
export function colSheet({ cols, places = cols, steps = "rtl", heights = null }) {
  /* A sheet may ask for shorter rows. One kind does: the flag written out
     long, which takes four rows for every figure of the answer — two
     subtractions, each with what it leaves — and at the ordinary answer height
     a six-figure one would be taller than the paper. */
  const tall = heights ? { ...HEIGHT, ...heights } : HEIGHT;
  const bits = [];
  const kinds = [];                       // row number → what kind of row it is
  const arrows = [];                      // which figures a step multiplies

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
    /**
     * A figure that is printed: part of the question, or the worked answer.
     *
     * `attrs` is for a figure the page has to be able to find again — the ones
     * a long division brings DOWN, which are dragged rather than written.
     */
    mark(row, place, text, cls = "", attrs = "") {
      put(`ms-col__mark${cls ? ` ${cls}` : ""}`, `${grow(row)}${gcol(place)}`, text, attrs);
      return this;
    },
    /** The +, − or × in front of the row. */
    sign(row, ch) {
      put("ms-col__sign", `${grow(row)}grid-column:1;`, ch);
      return this;
    },
    /**
     * A BOX where the sign stands, for the one method that asks the child what
     * to divide by rather than telling them: the ladder of table factoring,
     * whose whole question is "what is the smallest prime that goes into this".
     */
    signBox(row, { step = null, tone = "" } = {}) {
      put(`ms-col__slot ms-col__slot--sign wb-answer${tone ? ` ${tone}` : ""}`,
        `${grow(row)}grid-column:1;`, "",
        ` data-row="${row}" data-col="sign"${step == null ? "" : ` data-step="${step}"`}`);
      return this;
    },
    /**
     * A carry box. `figure` null leaves it empty — a place to write, which the
     * page counts as one — and a figure written in makes it print instead, so a
     * worked example is not counted as work the child has left undone.
     *
     * `under` is the row whose figures this carry belongs to: the screen brings
     * the box out only once a named column has been written there.
     *
     * `after` is WHICH column that is, and it is the column to the right by
     * default because that is the way a column sum runs. A division runs the
     * other way — you divide the hundreds and carry what is left into the tens
     * — so it says so instead of the page guessing from the geometry.
     */
    /**
     * `strike` says: when this carry has been used, cross it out rather than
     * take it away. A long multiplication is a page of working a child reads
     * back over, and a carry that vanishes from the middle of it leaves them
     * wondering what they wrote; struck through, it says "counted" and stays.
     */
    carry(row, place, figure = null, under = row + 1, after = place - 1, { beside = false, strike = false } = {}) {
      /* BESIDE means: drawn in the gap in front of the figure it joins — in the
         cell one place to its LEFT, hugging that cell's right edge — instead of
         in a row of its own above the column. Short division writes its
         left-overs this way, and it matters: a little 1 written OVER the tens
         is read as one more ten to add, and the same 1 written in front of the
         2 is read as what it is, the ten that makes twelve.

         The place it NAMES is unchanged either way, because that is what says
         which column it belongs to and when it has been used up. */
      if (!beside) grow(row, "carry"); else grow(row);
      const where = beside ? gcol(place + 1) : gcol(place);
      const cls = beside ? "ms-col__carry ms-col__carry--beside" : "ms-col__carry";
      if (figure == null) {
        put(`${cls} ms-down__carrybox`, `${grow(row)}${where}`, "",
          ` data-carry="${place}" data-crow="${under}" data-cafter="${after}"`
          + (strike ? ` data-for="${under}.${place}"` : ""));
      } else {
        put(`${cls} ms-down__carrywrote`, `${grow(row)}${where}`, String(figure));
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
    box(row, place, { step = null, bring = null } = {}) {
      /* `bring` is the box a figure is brought DOWN into: it says which figure
         of the number being divided belongs in it, so the figure can be
         dragged there instead of copied out by hand. It is still an ordinary
         box — it can be typed into, and it is marked like any other. */
      put(`ms-col__cell wb-cell${bring == null ? "" : " ms-col__cell--bring"}`,
        `${grow(row, "answer")}${gcol(place)}`, "",
        ` data-col="${place}" data-row="${row}"${step == null ? "" : ` data-step="${step}"`}`
        + (bring == null ? "" : ` data-bring="${bring}"`));
      return this;
    },
    /**
     * A SLOT — a box for a WORKING number rather than a figure of the answer:
     * what stands there to be divided, or a crossing taken off it. Wider than
     * a cell, because it is a number and not a figure, and it says which STEP
     * it belongs to rather than which place.
     */
    slot(row, place, { step = null, span = 1, tone = "" } = {}) {
      put(`ms-col__slot wb-answer${tone ? ` ${tone}` : ""}`,
        `${grow(row, "slot")}${gcol(place, span)}`, "",
        ` data-col="${place}" data-row="${row}"${step == null ? "" : ` data-step="${step}"`}`);
      return this;
    },
    /** The boxes of a whole row: places `top` down to 0, highest first. */
    boxes(row, top) {
      for (let p = top; p >= 0; p--) this.box(row, p);
      return this;
    },
    /**
     * The carry boxes of a row, highest place first, as the key lists them.
     *
     * ONE BOX PER CARRY THE SUM ACTUALLY MAKES — `where` is the carrying worked
     * out, and a column it says nothing about gets no box. A row of boxes over
     * every column is a row of questions the sum never asked, and most of them
     * get a dutiful 0.
     *
     * `show` is whether to write the figures in (the one done for the child) or
     * leave the boxes to be written in.
     */
    carries(row, where = [], { under = row + 1, show = false, strike = false } = {}) {
      for (let p = where.length - 1; p >= 0; p--) {
        if (where[p] == null) continue;
        this.carry(row, p, show ? where[p] : null, under, p - 1, { strike });
      }
      return this;
    },
    /**
     * THE BUS STOP, for a division: a line over what is being divided and one
     * down its left-hand side. It runs from `row` to the bottom of the sheet,
     * because everything under it is still part of the same division, and it
     * covers the places `from`..`to` — never the answer above it, and never the
     * remainder written past the end of it.
     *
     * Called LAST: it is sized from the rows that exist by then.
     */
    stop(row, { from, to }) {
      grow(row, "carry");
      put("ms-col__stop",
        `grid-row:${row + 1} / -1;grid-column:${2 + (cols - 1 - to)} / span ${to - from + 1};`);
      return this;
    },
    /**
     * AN ARROW FROM ONE FIGURE TO ANOTHER — which two the step being asked for
     * multiplies. `tie` is the box it belongs to (its row and place), so the
     * screen draws it when that box is the one being asked for and no other.
     */
    arrow(from, to, { tie = null } = {}) {
      arrows.push({ from, to, tie });
      return this;
    },
    /**
     * The line under a row — the heavy one under the last thing being added.
     *
     * `from`..`to` are places, when the line is only under PART of the row: a
     * long division takes away a different piece of the number at every step,
     * and a line right across the page would say it was taking away all of it.
     */
    rule(row, { heavy = false, from = null, to = null } = {}) {
      const where = from == null
        ? `grid-column:1 / span ${cols + 1};`
        : `grid-column:${2 + (cols - 1 - to)} / span ${to - from + 1};`;
      put(`ms-col__rule${heavy ? " is-heavy" : ""}`, `${grow(row)}${where}`);
      return this;
    },
    /** The sheet itself. */
    html(extra = "") {
      const rows = kinds.map((k) => tall[k] || tall.figures).join(" ");
      const drawn = arrows.length ? arrowLayer(arrows, kinds, cols, tall) : "";
      /* `data-nomath`: the figures of a written sum are not an expression to be
         typeset, they are figures that have to stay in their columns
         (mathify.js keeps out of anything that says so). */
      return `<div class="ms-col${extra ? ` ${extra}` : ""}" data-nomath${steps ? ` data-steps="${steps}"` : ""}`
        + ` style="--ms-cols:${cols};grid-template-rows:${rows}">${bits.join("")}${drawn}</div>`;
    },
  };
}

/* ── the arrows, in millimetres ─────────────────────────────────────────────
   The grid is measured: 7mm for the sign, then 11mm per place, and every row's
   height is in HEIGHT. So where a figure stands is arithmetic, and an arrow
   between two of them is drawn over the whole sheet without asking the browser
   where anything ended up. */

const MM = (h) => parseFloat(h);
const CW = 11;                            // one place across
const SIGN = 7;                           // the column the sign stands in

function arrowLayer(arrows, kinds, cols, tall = HEIGHT) {
  const heights = kinds.map((k) => MM(tall[k] || tall.figures));
  const top = (row) => heights.slice(0, row).reduce((t, h) => t + h, 0);
  const midY = (row) => top(row) + heights[row] / 2;
  /* `place` is a place of the sum; "sign" is the column in front of it, where
     the +, the × or the divisor stands */
  const midX = (place) => (place === "sign" ? SIGN / 2 : SIGN + (cols - 1 - place) * CW + CW / 2);
  const W = SIGN + cols * CW;
  const H = heights.reduce((t, h) => t + h, 0);

  const paths = arrows.map(({ from, to, tie }) => {
    const x1 = midX(from.place);
    const y1 = midY(from.row) + 2.8;      // just under the figure it starts at
    const x2 = midX(to.place);
    const y2 = midY(to.row) - 2.8;        // and just over the one it ends at
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"`
      + ` fill="none" stroke="#2a6ca8" stroke-width="0.5" stroke-linecap="round"`
      + ` marker-end="url(#ms-tip)"${tie == null ? "" : ` data-pass="${tie}"`}/>`;
  }).join("");

  return `<svg class="ms-col__cross" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm"`
    + ` aria-hidden="true"><defs><marker id="ms-tip" viewBox="0 0 6 6" refX="4.8" refY="3"`
    + ` markerWidth="3.6" markerHeight="3.6" orient="auto">`
    + `<path d="M0.8 1 5 3 0.8 5z" fill="#2a6ca8"/></marker></defs>${paths}</svg>`;
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
