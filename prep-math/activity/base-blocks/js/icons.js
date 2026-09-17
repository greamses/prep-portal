/* ============================================================================
   Base Blocks — our own inline SVG glyphs (no icon fonts, no emoji)
   ----------------------------------------------------------------------------
   The house style and the loud/quiet rule come from
   /utils/components/workbook/icons.js — 24×24, filled shapes in the theme's
   accent tokens, white only where a coloured shape encloses it, and the thing
   that tells a glyph from its neighbour drawn loud.

   TWO RULES ARE THIS CANVAS'S OWN, and they beat prettiness:

   NO TWO PRESSABLE THINGS SHARE A GLYPH. Split and merge are one drawing read
   two ways; so are undo and redo, and lift and lower. That is deliberate and
   it is not sharing — each pair is one idea and its reverse, and the arrows
   point opposite ways. Everything else draws the thing it does.

   A GLYPH THAT STANDS FOR A PIECE IS PAINTED THE PIECE'S OWN COLOUR. On the
   canvas a rod and the ten units it breaks into are the SAME colour, because
   that is how a child sees the quantity has not changed. So `regroup` draws
   both in butter and puts the loud mark on the link between them — colouring
   them differently would have the glyph contradict the manipulative.
   ========================================================================== */

import {
  svg, bar, LOUD, QUIET, PAPER, GOLD, LEAF, WARM,
} from "/utils/components/workbook/icons.js";

/** A dashed run, drawn as real dashes so it survives at 22px. */
function dashes(x1, y1, x2, y2, n = 4, w = 1.8, fill = LOUD) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const a = (i * 2) / (n * 2 - 1);
    const b = (i * 2 + 1) / (n * 2 - 1);
    out += bar(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b, w, fill);
  }
  return out;
}

/** A block arrowhead pointing along (dx,dy) from (x,y). */
function head(x, y, dx, dy, s = 4.4, fill = LOUD) {
  const n = Math.hypot(dx, dy);
  const ux = dx / n;
  const uy = dy / n;
  const f = (v) => v.toFixed(2);
  return (
    `<path d="M${f(x + ux * s)} ${f(y + uy * s)}` +
    `L${f(x + uy * s * 0.66)} ${f(y - ux * s * 0.66)}` +
    `L${f(x - uy * s * 0.66)} ${f(y + ux * s * 0.66)}z" fill="${fill}"/>`
  );
}

const rect = (x, y, w, h, fill, r = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

const plus = (cx, cy, s = 12, w = 2.8, fill = LOUD) =>
  rect(cx - w / 2, cy - s / 2, w, s, fill, w / 2) + rect(cx - s / 2, cy - w / 2, s, w, fill, w / 2);

export const ICON = {
  /* split and merge are opposites, so they are the same drawing read the two
     ways: one piece cut apart, and two pieces pushed together. Both halves are
     the SAME colour — it is one piece halved, not two different pieces. */
  split: svg(
    rect(2.4, 5.6, 7.6, 12.8, PAPER, 1.4) +
      rect(14, 5.6, 7.6, 12.8, PAPER, 1.4) +
      dashes(12, 2.6, 12, 21.4, 4, 1.8)
  ),
  merge: svg(
    rect(1.6, 5.6, 6.4, 12.8, PAPER, 1.4) +
      rect(16, 5.6, 6.4, 12.8, PAPER, 1.4) +
      head(9.2, 12, 1, 0, 3.6) +
      head(14.8, 12, -1, 0, 3.6)
  ),
  /* one ten becoming ten ones: both are butter, because both are the same
     amount — the loud part is the link, which is the move being made */
  regroup: svg(
    rect(5.4, 3, 13.2, 6.6, GOLD, 1.4) +
      rect(2.4, 14.2, 5.6, 7, GOLD, 1.2) +
      rect(9.2, 14.2, 5.6, 7, GOLD, 1.2) +
      rect(16, 14.2, 5.6, 7, GOLD, 1.2) +
      rect(11.1, 10.4, 1.8, 3, LOUD, 0.9)
  ),
  /* many little ones, loose */
  crumbs: svg(
    [0, 1, 2].map((r) => [0, 1, 2].map((c) =>
      rect(2.8 + c * 6.6, 2.8 + r * 6.6, 5.2, 5.2, (r + c) % 2 ? GOLD : PAPER, 1)
    ).join("")).join("")
  ),
  /* laid out in rows, longest first */
  rows: svg(
    rect(2.6, 3.6, 18.8, 4.6, PAPER, 2.3) +
      rect(2.6, 9.7, 12.6, 4.6, GOLD, 2.3) +
      rect(2.6, 15.8, 7, 4.6, LEAF, 2.3)
  ),
  trash: svg(
    rect(8.6, 2.4, 6.8, 2.6, LOUD, 1.3) +
      rect(3, 5, 18, 3.2, LOUD, 1.6) +
      `<path d="M5.4 9.4h13.2l-1.1 10.4a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z" fill="${PAPER}"/>` +
      rect(9.1, 11.9, 1.9, 6.2, "#fff", 0.95) +
      rect(13, 11.9, 1.9, 6.2, "#fff", 0.95)
  ),
  /* redo is undo read the other way — the same arrow, mirrored, the way split
     and merge are one drawing read two ways */
  undo: svg(
    `<path d="M7.6 8.6h6a5.9 5.9 0 0 1 0 11.8H9.4" fill="none" stroke="${PAPER}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M3 8.6 9.4 4.4v8.4z" fill="${LOUD}"/>`
  ),
  redo: svg(
    `<path d="M16.4 8.6h-6a5.9 5.9 0 0 0 0 11.8h4.2" fill="none" stroke="${PAPER}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M21 8.6 14.6 4.4v8.4z" fill="${LOUD}"/>`
  ),
  /* a ring thrown round whatever is inside it */
  lasso: svg(
    dashes(3.4, 3.4, 20.6, 3.4, 4, 1.8) +
      dashes(20.6, 3.4, 20.6, 20.6, 4, 1.8) +
      dashes(20.6, 20.6, 3.4, 20.6, 4, 1.8) +
      dashes(3.4, 20.6, 3.4, 3.4, 4, 1.8) +
      `<circle cx="12" cy="12" r="2.6" fill="${PAPER}"/>`
  ),
  /* "pick every one this size": one piece in hand and two more of the same
     answering to it — not two rectangles side by side, which read as merge */
  match: svg(
    rect(2.4, 8.2, 7.6, 9.6, LOUD, 1.2) +
      rect(12.4, 3.2, 7.6, 9.6, PAPER, 1.2) +
      dashes(12.4, 15.4, 20, 15.4, 3, 1.8, PAPER) +
      dashes(12.4, 20.6, 20, 20.6, 3, 1.8, PAPER) +
      bar(12.4, 15.4, 12.4, 20.6, 1.8, PAPER) +
      bar(20, 15.4, 20, 20.6, 1.8, PAPER)
  ),
  plus: svg(plus(12, 12, 14, 3)),
  eraser: svg(
    `<path d="M6.6 16.8 14.6 8.8a2.2 2.2 0 0 1 3.1 0l2.4 2.4a2.2 2.2 0 0 1 0 3.1l-4.4 4.4H8.4z" fill="${LOUD}"/>` +
      `<path d="M11.2 12.2 16.6 17.6l-1.1 1.1H8.4l-1.8-1.9z" fill="${PAPER}"/>` +
      rect(2.6, 19.8, 18.8, 2.2, QUIET, 1.1)
  ),
  brush: svg(
    `<path d="M13.4 6.6 17 3a2.8 2.8 0 0 1 4 4l-3.6 3.6z" fill="${GOLD}"/>` +
      `<path d="M6.4 14.6 13.4 7.6l3 3-7 7z" fill="${WARM}"/>` +
      `<path d="M6.4 14.6 9.4 17.6 4 19.4z" fill="${LOUD}"/>`
  ),
  /* the place-value columns, each one ten times the last */
  base: svg(
    rect(2.6, 15.4, 3.8, 5.4, PAPER, 1) +
      rect(8, 11.4, 3.8, 9.4, GOLD, 1) +
      rect(13.4, 7.4, 3.8, 13.4, LEAF, 1) +
      rect(18.8, 3.4, 3.8, 17.4, LOUD, 1)
  ),
  ruler: svg(
    rect(2.4, 7.6, 19.2, 8.8, WARM, 2) +
      rect(6, 7.6, 1.5, 3.4, "#fff", 0.75) +
      rect(9.6, 7.6, 1.5, 4.8, "#fff", 0.75) +
      rect(13.2, 7.6, 1.5, 3.4, "#fff", 0.75) +
      rect(16.8, 7.6, 1.5, 4.8, "#fff", 0.75)
  ),
  expand: svg(
    `<path d="M3 9.4V4.6a1.6 1.6 0 0 1 1.6-1.6h4.8v2.8H5.8v3.6zM21 9.4V4.6A1.6 1.6 0 0 0 19.4 3h-4.8v2.8h3.6v3.6zM3 14.6v4.8A1.6 1.6 0 0 0 4.6 21h4.8v-2.8H5.8v-3.6zM21 14.6v4.8a1.6 1.6 0 0 1-1.6 1.6h-4.8v-2.8h3.6v-3.6z" fill="${PAPER}"/>`
  ),
  fit: svg(
    rect(3.4, 3.4, 17.2, 17.2, PAPER, 1.8) +
      rect(8.4, 8.4, 7.2, 7.2, GOLD, 1.2)
  ),
  zoomIn: svg(
    bar(15.4, 15.4, 20.6, 20.6, 3.4, GOLD) +
      `<circle cx="10.6" cy="10.6" r="7.6" fill="${PAPER}"/>` +
      `<circle cx="10.6" cy="10.6" r="4.7" fill="#fff"/>` +
      plus(10.6, 10.6, 5.6, 1.7, PAPER)
  ),
  zoomOut: svg(
    bar(15.4, 15.4, 20.6, 20.6, 3.4, GOLD) +
      `<circle cx="10.6" cy="10.6" r="7.6" fill="${PAPER}"/>` +
      `<circle cx="10.6" cy="10.6" r="4.7" fill="#fff"/>` +
      rect(7.8, 9.75, 5.6, 1.7, PAPER, 0.85)
  ),
  /* A chevron folding down onto a line: the panel goes away into its own edge.
     Turned over by CSS when it is already folded, which is one pressable thing
     in two states and not two things sharing a glyph. */
  fold: svg(
    rect(4.6, 18.6, 14.8, 2.4, QUIET, 1.2) +
      rect(10.8, 3.4, 2.4, 9.6, PAPER, 1.2) +
      head(12, 12.4, 0, 1, 4.4)
  ),
  /* Something said, with a line through it. */
  quiet: svg(
    `<path d="M3.4 6.6a2.2 2.2 0 0 1 2.2-2.2h12.8a2.2 2.2 0 0 1 2.2 2.2v7.2a2.2 2.2 0 0 1-2.2 2.2H9.6L5 20v-4z" fill="${PAPER}"/>` +
      bar(3, 3, 21, 21, 2.6, LOUD)
  ),
  pick: svg(
    `<path d="M4.6 3 11.4 19.8l2.4-6.2 6.2-2.4z" fill="${PAPER}"/>` +
      `<path d="M13.8 13.6 20 11.2l-1.6 4.2-4.6-1.8z" fill="${LOUD}"/>`
  ),
  hand: svg(
    `<path d="M8.4 11.6V5.9a1.6 1.6 0 0 1 3.2 0v4.6a1.6 1.6 0 0 1 3.1 0v.8a1.6 1.6 0 0 1 3.1 0v3.9a5.8 5.8 0 0 1-5.8 5.8h-.8a5.2 5.2 0 0 1-4.5-2.6l-2.3-3.9a1.6 1.6 0 0 1 2.6-1.8z" fill="${PAPER}"/>`
  ),
  turn: svg(
    `<path d="M19.6 11.4a7.8 7.8 0 1 1-2.4-5.6" fill="none" stroke="${PAPER}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M13.6 6.4 20.2 3l.6 7z" fill="${LOUD}"/>`
  ),
  chevron: svg(
    `<path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="${PAPER}"/>`
  ),
  close: svg(bar(6, 6, 18, 18, 3, LOUD) + bar(18, 6, 6, 18, 3, LOUD)),
  info: svg(
    `<circle cx="12" cy="12" r="9.2" fill="${PAPER}"/>` +
      rect(10.7, 10.6, 2.6, 6.4, "#fff", 1.3) +
      `<circle cx="12" cy="7.6" r="1.5" fill="#fff"/>`
  ),
  check: svg(
    `<circle cx="12" cy="12" r="9.6" fill="${LEAF}"/>` +
      `<path d="M7.4 12.4l3 3 6.2-6.7" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  back: svg(rect(6.6, 10.6, 14.8, 2.8, PAPER, 1.4) + head(7, 12, -1, 0, 4.6)),
  /* 2D is not "a grid" — the Charts tab and To-units are grids too. It is
     LOOKING STRAIGHT DOWN at the paper, so it is an arrow dropping onto a sheet. */
  flat: svg(
    rect(3.4, 12.4, 17.2, 8.2, PAPER, 1.6) +
      rect(10.8, 2.4, 2.4, 6.4, GOLD, 1.2) +
      head(12, 8.2, 0, 1, 4.4)
  ),
  solid: svg(
    `<path d="M12 12.6 20.8 7.8V16L12 20.8z" fill="${WARM}"/>` +
      `<path d="M12 12.6 3.2 7.8V16L12 20.8z" fill="${PAPER}"/>` +
      `<path d="M12 3.2 20.8 7.8 12 12.6 3.2 7.8z" fill="${GOLD}"/>`
  ),
  /* the readout: what the canvas comes to, as a number. An "=" in a card —
     Tidy already owns the stack of bars, and no two keys may share a glyph. */
  reading: svg(
    rect(2.8, 4.2, 18.4, 15.6, PAPER, 1.8) +
      rect(7.2, 9.4, 9.6, 2.2, "#fff", 1.1) +
      rect(7.2, 13.4, 9.6, 2.2, "#fff", 1.1)
  ),
  /* sync: two links of a chain, because that is what it does to the tools */
  sync: svg(
    `<path d="M11.4 7.4 13.2 5.6a3.9 3.9 0 0 1 5.5 5.5l-1.8 1.8-2-2 1.8-1.8a1.1 1.1 0 0 0-1.5-1.5l-1.8 1.8z" fill="${PAPER}"/>` +
      `<path d="M12.6 16.6 10.8 18.4a3.9 3.9 0 0 1-5.5-5.5l1.8-1.8 2 2-1.8 1.8a1.1 1.1 0 0 0 1.5 1.5l1.8-1.8z" fill="${PAPER}"/>` +
      bar(9.4, 14.6, 14.6, 9.4, 2.6, LOUD)
  ),
  /* type a number: a field with a caret waiting in it */
  keyin: svg(
    rect(2.4, 6.6, 19.2, 10.8, PAPER, 1.8) +
      rect(11.1, 8.8, 1.8, 6.4, LOUD, 0.9) +
      rect(9.4, 8.8, 5.2, 1.6, LOUD, 0.8) +
      rect(9.4, 13.6, 5.2, 1.6, LOUD, 0.8)
  ),
  /* build it: courses of brickwork — what pressing it makes, not "confirm",
     which is the own-size button's tick */
  bricks: svg(
    rect(2.6, 5, 18.8, 14, PAPER, 1.6) +
      rect(9.2, 5, 1.4, 7, "#fff") +
      rect(2.6, 11.3, 18.8, 1.4, "#fff") +
      rect(14.2, 12.7, 1.4, 6.3, "#fff")
  ),
  /* a sticky note: the paper, the strip of tape it is stuck on by, and a couple
     of lines of writing. The tape is what tells it from Reading, which is a card
     of ruled lines and nothing else. */
  note: svg(
    rect(4, 5.4, 16, 15.2, GOLD, 1.4) +
      bar(7.2, 2.8, 16.8, 5.4, 2.6, LOUD) +
      rect(7.4, 10.4, 9.2, 1.8, "#fff", 0.9) +
      rect(7.4, 14, 5.6, 1.8, "#fff", 0.9)
  ),
  /* work it out: a play triangle, because that is what it does — it runs the
     addition through the frame a move at a time instead of landing on it */
  play: svg(`<path d="M7.6 4.8 19.6 12 7.6 19.2z" fill="${LEAF}"/>`),

  /* the three families, for the dock's tabs */
  blocks: svg(
    `<path d="M8 9.2 14.2 6v6.4L8 15.6z" fill="${WARM}"/>` +
      `<path d="M8 9.2 1.8 6v6.4L8 15.6z" fill="${PAPER}"/>` +
      `<path d="M8 2.8 14.2 6 8 9.2 1.8 6z" fill="${GOLD}"/>` +
      rect(14, 14, 7.6, 7.6, LOUD, 1)
  ),
  abacus: svg(
    rect(2.4, 3.4, 19.2, 17.2, WARM, 1.8) +
      rect(2.4, 7.8, 19.2, 1.6, "#fff") +
      rect(2.4, 14.6, 19.2, 1.6, "#fff") +
      `<circle cx="7.4" cy="8.6" r="2.6" fill="${LOUD}"/>` +
      `<circle cx="14" cy="8.6" r="2.6" fill="${LOUD}"/>` +
      `<circle cx="10.2" cy="15.4" r="2.6" fill="${PAPER}"/>` +
      `<circle cx="16.8" cy="15.4" r="2.6" fill="${PAPER}"/>`
  ),
  /* algebra tiles: a big square, a long tile and a small one — the three sizes
     the family is made of, which no other key here draws */
  algebra: svg(
    rect(2.6, 2.8, 10, 10, PAPER, 1) +
      rect(14.8, 2.8, 6.6, 10, GOLD, 1) +
      rect(2.6, 15.4, 5.4, 5.4, LOUD, 1) +
      rect(10.4, 15.4, 5.4, 5.4, LEAF, 1)
  ),

  /* ── the third dimension, and how a piece lands ──────────────────────────
     No two pressable things on this canvas may share a glyph, so each of these
     draws the thing it does and not a generic arrow. */

  /* lift: a piece held above the paper, with the paper drawn as the line it is
     no longer touching */
  lift: svg(
    rect(3.2, 7.4, 10, 6.6, PAPER, 1.2) +
      dashes(2.6, 20.2, 21.4, 20.2, 5, 2.2, QUIET) +
      rect(16.4, 9.4, 2.4, 7.6, GOLD, 1.2) +
      head(17.6, 9.4, 0, -1, 4.2)
  ),
  /* let it down: the same drawing read the other way, the way merge is split
     backwards — the piece on its way onto a paper that is solid again because
     it is about to be touched */
  lower: svg(
    rect(3.2, 9.4, 10, 6.6, PAPER, 1.2) +
      rect(2.6, 19.2, 18.8, 2.2, QUIET, 1.1) +
      rect(16.4, 6.6, 2.4, 7.6, GOLD, 1.2) +
      head(17.6, 14.2, 0, 1, 4.2)
  ),
  /* tip: the same piece lying down and standing up, and the little arc that
     takes it from one to the other */
  tip: svg(
    rect(2.4, 19.4, 19.2, 2.2, QUIET, 1.1) +
      rect(3.2, 14.6, 8.6, 4.4, PAPER, 1) +
      rect(15.2, 5.8, 4.4, 13.2, GOLD, 1) +
      `<path d="M12.6 12.8a6 6 0 0 1 2.2-4" fill="none" stroke="${LOUD}" stroke-width="2.4" stroke-linecap="round"/>`
  ),
  /* snap to the squares: a piece sitting exactly on a ruling, and the other
     crossings of that ruling waiting for one */
  grid: svg(
    rect(2.8, 2.8, 7.6, 7.6, LOUD, 1) +
      [[15.9, 6.6], [15.9, 16.4], [6.3, 16.4]]
        .map(([x, y]) => plus(x, y, 5.6, 1.8, QUIET)).join("")
  ),
  /* flush: a magnet, which is what an edge that pulls another edge level with
     itself actually is */
  flush: svg(
    `<path d="M4.8 3.4h4.2v9.4a3 3 0 0 0 6 0V3.4h4.2v9.4a7.2 7.2 0 0 1-14.4 0z" fill="${LOUD}"/>` +
      rect(4.8, 3.4, 4.2, 4, PAPER, 0.6) +
      rect(15, 3.4, 4.2, 4, PAPER, 0.6)
  ),
  /* the keys: a keyboard, with a space bar nothing else here has */
  keys: svg(
    rect(2.2, 5.8, 19.6, 12.4, PAPER, 2) +
      [6.2, 9.8, 13.4, 17].map((x) => rect(x - 1, 8.6, 2, 2, "#fff", 0.5)).join("") +
      [6.2, 9.8, 13.4, 17].map((x) => rect(x - 1, 12, 2, 2, "#fff", 0.5)).join("") +
      rect(8, 15.2, 8, 2, "#fff", 1)
  ),
  /* the number card: a piece of paper with a number on it and the same number
     written out underneath — which is the whole of what the card does */
  card: svg(
    rect(2.6, 3.6, 18.8, 16.8, PAPER, 2) +
      rect(14, 6.6, 4.6, 5.4, LOUD, 0.8) +
      rect(6, 8.4, 5.4, 1.9, "#fff", 0.95) +
      rect(6, 14.4, 12, 1.9, "#fff", 0.95) +
      rect(6, 17.4, 8, 1.9, "#fff", 0.95)
  ),
  table: svg(
    rect(2.8, 3.4, 18.4, 17.2, PAPER, 1.8) +
      `<path d="M2.8 5.2a1.8 1.8 0 0 1 1.8-1.8h14.8a1.8 1.8 0 0 1 1.8 1.8v3.6H2.8z" fill="${GOLD}"/>` +
      rect(2.8, 14, 18.4, 1.4, "#fff") +
      rect(8.4, 8.8, 1.4, 11.8, "#fff") +
      rect(14.4, 8.8, 1.4, 11.8, "#fff")
  ),
};
