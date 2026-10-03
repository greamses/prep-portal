/* ============================================================================
   Maths Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per family in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js, and so does
   the house style and the loud/quiet rule the drawings follow.

   Three of these families are the SAME written sum with a different operation
   in it: `plus`, `minus` and `times`. The rule says the operation is the loud
   part and the rule and the answer line under it are quiet, so at 22px what a
   child sees first is the + or the − or the ×, which is the only thing that
   tells those three sections apart.

   The blocks, the bar and the pie keep the colours the paper itself prints
   them in — butter, sky, leaf — so the glyph on the rail and the thing on the
   page are recognisably the same object.
   ========================================================================== */

import {
  ICON as BASE, svg, bar, LOUD, QUIET, PAPER, GOLD, LEAF, WARM, INK,
} from "/utils/components/workbook/icons.js";

/* A written sum: the rule across the page and the short answer line under it.
   Quiet, in every one of them, so the sign on top is what carries. */
const written =
  `<rect x="2.6" y="15.4" width="18.8" height="1.9" rx="0.95" fill="${QUIET}"/>` +
  `<rect x="13.4" y="19.4" width="8" height="1.9" rx="0.95" fill="${QUIET}"/>`;

const plusSign = (cx, cy, s = 7.4, w = 2.4, fill = LOUD) =>
  `<rect x="${cx - w / 2}" y="${cy - s / 2}" width="${w}" height="${s}" rx="${w / 2}" fill="${fill}"/>` +
  `<rect x="${cx - s / 2}" y="${cy - w / 2}" width="${s}" height="${w}" rx="${w / 2}" fill="${fill}"/>`;

const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

export const ICON = {
  ...BASE,
  /* The four blocks in their sizes — unit, rod, flat — painted the colours the
     paper paints them. */
  blocks: svg(
    `<rect x="2.4" y="15.8" width="4.6" height="4.6" rx="0.8" fill="${LOUD}"/>` +
      `<rect x="8.2" y="7.6" width="4.6" height="12.8" rx="0.8" fill="${GOLD}"/>` +
      `<rect x="14" y="7.6" width="7.6" height="12.8" rx="0.8" fill="${PAPER}"/>` +
      `<path d="M14 7.6 16.4 4.4h7.2l-2.4 3.2z" fill="${LEAF}"/>`
  ),
  /* The place-value chart: a heading row and its columns. */
  table: svg(
    `<rect x="2.6" y="4.4" width="18.8" height="15.2" rx="1.8" fill="${PAPER}"/>` +
      `<path d="M2.6 6.2a1.8 1.8 0 0 1 1.8-1.8h15.2a1.8 1.8 0 0 1 1.8 1.8v3.4H2.6z" fill="${GOLD}"/>` +
      `<rect x="8.4" y="10.6" width="1.4" height="9" fill="#fff"/>` +
      `<rect x="14.2" y="10.6" width="1.4" height="9" fill="#fff"/>`
  ),
  /* A figure with rules over and under it: the number on its own, written. */
  figures: svg(
    `<rect x="3" y="8.4" width="18" height="2.2" rx="1.1" fill="${QUIET}"/>` +
      `<rect x="3" y="14.2" width="18" height="2.2" rx="1.1" fill="${QUIET}"/>` +
      bar(9.6, 4.2, 7.2, 19.8, 2.6, LOUD) +
      bar(17.2, 4.2, 14.8, 19.8, 2.6, GOLD)
  ),
  /* A plus over a written sum. */
  plus: svg(written + plusSign(7.4, 9.4)),
  /* The same drawing with a minus in it. */
  minus: svg(
    written + `<rect x="3.7" y="8.2" width="7.4" height="2.4" rx="1.2" fill="${LOUD}"/>`
  ),
  /* Equal rows of things: what multiplying is before it is a sum. */
  array: svg(
    [6, 12, 18]
      .map((y, r) => [5.4, 12, 18.6].map((x) => dot(x, y, 2.1, [PAPER, GOLD, LEAF][r])).join(""))
      .join("")
  ),
  /* A times sign over a written sum. */
  times: svg(
    written +
      bar(4.4, 6.4, 10.4, 12.4, 2.4, LOUD) +
      bar(10.4, 6.4, 4.4, 12.4, 2.4, LOUD)
  ),
  /* A square cut by its diagonals into cells: the lattice. */
  lattice: svg(
    `<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="1.4" fill="${PAPER}"/>` +
      `<path d="M3.4 3.4h8.6v8.6z" fill="${GOLD}"/>` +
      `<path d="M20.6 12v8.6H12z" fill="${GOLD}"/>` +
      bar(3.4, 20.6, 20.6, 3.4, 1.7, LOUD) +
      `<rect x="11.2" y="3.4" width="1.6" height="17.2" fill="#fff"/>` +
      `<rect x="3.4" y="11.2" width="17.2" height="1.6" fill="#fff"/>`
  ),
  /* Things with a ring drawn round a group of them: sharing into groups. */
  ring: svg(
    `<ellipse cx="9.8" cy="7.8" rx="7.6" ry="4.6" fill="${GOLD}"/>` +
      dot(6.8, 7.8, 2.1, "#fff") + dot(12.8, 7.8, 2.1, "#fff") +
      dot(6.8, 15.8, 2.1, PAPER) + dot(12.8, 15.8, 2.1, PAPER) + dot(18.4, 15.8, 2.1, LOUD)
  ),
  /* A sum said as a sentence: this, and this, make that. */
  sentence: svg(
    `<rect x="2.6" y="10.8" width="5.4" height="2.4" rx="1.2" fill="${PAPER}"/>` +
      plusSign(11.4, 12, 6.4, 2.2, LOUD) +
      `<rect x="15.8" y="9.4" width="5.6" height="1.9" rx="0.95" fill="${LEAF}"/>` +
      `<rect x="15.8" y="12.7" width="5.6" height="1.9" rx="0.95" fill="${LEAF}"/>`
  ),
  /* A whole bar, and a piece of one: what a fraction is along a strip. */
  bar: svg(
    `<rect x="2.6" y="6.2" width="18.8" height="5.4" rx="1.1" fill="${PAPER}"/>` +
      `<path d="M3.7 6.2h5.9v5.4H3.7a1.1 1.1 0 0 1-1.1-1.1V7.3a1.1 1.1 0 0 1 1.1-1.1z" fill="${LOUD}"/>` +
      `<rect x="9.2" y="6.2" width="1.3" height="5.4" fill="#fff"/>` +
      `<rect x="15.5" y="6.2" width="1.3" height="5.4" fill="#fff"/>` +
      `<rect x="2.6" y="13.8" width="18.8" height="5.4" rx="1.1" fill="${GOLD}"/>` +
      `<rect x="9.2" y="13.8" width="1.3" height="5.4" fill="#fff"/>` +
      `<rect x="15.5" y="13.8" width="1.3" height="5.4" fill="#fff"/>`
  ),
  /* A pie with one slice coloured. */
  pie: svg(
    `<circle cx="12" cy="12" r="8.8" fill="${PAPER}"/>` +
      `<path d="M12 3.2A8.8 8.8 0 0 1 20.8 12H12z" fill="${LOUD}"/>` +
      `<rect x="11.3" y="3.2" width="1.4" height="17.6" fill="#fff"/>` +
      `<rect x="3.2" y="11.3" width="17.6" height="1.4" fill="#fff"/>`
  ),
  /* A number over a number: the fraction itself. */
  frac: svg(
    `<rect x="4.2" y="10.9" width="15.6" height="2.2" rx="1.1" fill="${LOUD}"/>` +
      `<rect x="6.6" y="4" width="6.4" height="4.4" rx="1.4" fill="${PAPER}"/>` +
      `<rect x="11" y="15.6" width="6.4" height="4.4" rx="1.4" fill="${GOLD}"/>`
  ),
  /* Five marks, the fifth struck through: counting in fives. */
  fives: svg(
    [5, 8.8, 12.6, 16.4].map((x) => bar(x, 6.4, x, 17.6, 2, PAPER)).join("") +
      bar(3.4, 17.6, 18.2, 6.4, 2.2, LOUD)
  ),
  /* A clock, at a time nothing else on this page shows. */
  clock: svg(
    `<circle cx="12" cy="12" r="9" fill="${WARM}"/>` +
      `<circle cx="12" cy="12" r="6.6" fill="#fff"/>` +
      bar(12, 12, 12, 7.4, 1.9, LOUD) +
      bar(12, 12, 15.8, 14.2, 1.9, LOUD)
  ),

  /* ── chapter 5's new sections ────────────────────────────────────────── */
  /* One bar over another with twice the cuts: the same amount, another name. */
  equal: svg(
    `<rect x="2.6" y="4.4" width="18.8" height="5.6" rx="1" fill="#fffdf8" stroke="${QUIET}" stroke-width="1.2"/>` +
      `<rect x="2.6" y="4.4" width="9.4" height="5.6" fill="${PAPER}"/>` +
      `<rect x="2.6" y="14" width="18.8" height="5.6" rx="1" fill="#fffdf8" stroke="${QUIET}" stroke-width="1.2"/>` +
      `<rect x="2.6" y="14" width="9.4" height="5.6" fill="${PAPER}"/>` +
      `<path d="M7.3 14v5.6M12 14v5.6M16.7 14v5.6" stroke="${QUIET}" stroke-width="0.9"/>`
  ),
  /* A whole bar and a part bar: mixed numbers. */
  mixed: svg(
    `<rect x="2.6" y="5" width="18.8" height="5.2" rx="1" fill="${PAPER}" stroke="${QUIET}" stroke-width="1.2"/>` +
      `<rect x="2.6" y="13.4" width="18.8" height="5.2" rx="1" fill="#fffdf8" stroke="${QUIET}" stroke-width="1.2"/>` +
      `<rect x="2.6" y="13.4" width="6.2" height="5.2" fill="${PAPER}"/>` +
      `<path d="M8.8 13.4v5.2M15 13.4v5.2" stroke="${QUIET}" stroke-width="0.9"/>`
  ),
  /* ── chapter 8: prime factors ──────────────────────────────────────────
     The chapter is about what a number is MADE of, so every glyph here is a
     number taken apart in a different way. */

  /* Blocks pushed into equal rows — and one that would not go. */
  pfGroup: svg(
    `<rect x="2.6" y="5" width="8.4" height="3.6" rx="0.7" fill="${PAPER}"/>` +
      `<rect x="2.6" y="9.8" width="8.4" height="3.6" rx="0.7" fill="${PAPER}"/>` +
      `<rect x="2.6" y="14.6" width="8.4" height="3.6" rx="0.7" fill="${PAPER}"/>` +
      `<rect x="13.8" y="5" width="3.6" height="13.2" rx="0.7" fill="${LOUD}"/>`
  ),
  /* A number that is only itself: one brick, ringed. */
  pfPrime: svg(
    `<circle cx="12" cy="12" r="8.4" fill="none" stroke="${LOUD}" stroke-width="2.2"/>` +
      `<rect x="9.4" y="9.4" width="5.2" height="5.2" rx="0.9" fill="${GOLD}"/>`
  ),
  /* A grid with some of it struck through. */
  pfStrike: svg(
    `<rect x="2.6" y="4.6" width="18.8" height="14.8" rx="1.6" fill="${PAPER}"/>` +
      `<path d="M8.4 4.6v14.8M14.2 4.6v14.8M2.6 12h18.8" stroke="#fff" stroke-width="1.1"/>` +
      bar(3.6, 8.6, 7.6, 8.6, 1.8, LOUD) + bar(15.2, 8.6, 19.2, 8.6, 1.8, LOUD) +
      bar(9.4, 16, 13.4, 16, 1.8, LOUD)
  ),
  /* The factors in pairs, meeting in the middle. */
  pfFactors: svg(
    dot(5, 7.4, 2.2, PAPER) + dot(19, 7.4, 2.2, PAPER) +
      dot(5, 12, 2.2, GOLD) + dot(19, 12, 2.2, GOLD) +
      dot(5, 16.6, 2.2, LEAF) + dot(19, 16.6, 2.2, LEAF) +
      bar(7.8, 7.4, 16.2, 7.4, 1.1, QUIET) +
      bar(7.8, 12, 16.2, 12, 1.1, QUIET) +
      bar(7.8, 16.6, 16.2, 16.6, 1.1, QUIET)
  ),
  /* The tree itself. */
  pfTree: svg(
    bar(12, 6.4, 6.4, 13.4, 1.4, QUIET) + bar(12, 6.4, 17.6, 13.4, 1.4, QUIET) +
      bar(17.6, 15.4, 13.6, 20.4, 1.4, QUIET) + bar(17.6, 15.4, 21, 20.4, 1.4, QUIET) +
      dot(12, 5.4, 3.2, GOLD) + dot(6.4, 14.4, 2.8, LOUD) + dot(17.6, 14.4, 2.8, PAPER) +
      dot(13.4, 20.6, 2.4, LOUD) + dot(21, 20.6, 2.4, LOUD)
  ),
  /* The ladder: the divisor outside the rule, and what is left under it. */
  pfLadder: svg(
    `<path d="M9 3.6v16.8" stroke="${QUIET}" stroke-width="1.6" stroke-linecap="round"/>` +
      bar(9, 4.4, 21, 4.4, 1.6, QUIET) +
      `<rect x="11" y="6.6" width="8.4" height="2.6" rx="1.1" fill="${PAPER}"/>` +
      `<rect x="11" y="11.2" width="6.4" height="2.6" rx="1.1" fill="${PAPER}"/>` +
      `<rect x="11" y="15.8" width="4.4" height="2.6" rx="1.1" fill="${PAPER}"/>` +
      dot(5.2, 7.9, 1.8, LOUD) + dot(5.2, 12.5, 1.8, LOUD) + dot(5.2, 17.1, 1.8, LOUD)
  ),
  /* Primes multiplied together. */
  pfProduct: svg(
    dot(4.6, 12, 2.6, LOUD) + dot(12, 12, 2.6, GOLD) + dot(19.4, 12, 2.6, PAPER) +
      `<path d="M7.6 10.4 9.6 12.4M9.6 10.4 7.6 12.4M15 10.4 17 12.4M17 10.4 15 12.4" stroke="${QUIET}" stroke-width="1.5" stroke-linecap="round"/>`
  ),
  /* A base with its index up in the corner. */
  pfIndex: svg(
    `<text x="8.6" y="19" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="15" font-weight="800" fill="${QUIET}">2</text>` +
      `<text x="17.4" y="10.6" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" font-weight="800" fill="${LOUD}">3</text>`
  ),
  /* Counting them: a row of marks and a ring round the count. */
  pfCount: svg(
    bar(4, 6.2, 4, 13.4, 1.8, QUIET) + bar(8, 6.2, 8, 13.4, 1.8, QUIET) +
      bar(12, 6.2, 12, 13.4, 1.8, QUIET) + bar(16, 6.2, 16, 13.4, 1.8, QUIET) +
      `<circle cx="17.4" cy="17.4" r="5" fill="${LOUD}"/>` +
      `<text x="17.4" y="20.4" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" font-weight="800" fill="#fff">n</text>`
  ),

  /* Two rings overlapping, and the part that belongs to both. */
  /* ── chapter 9: the bar model ── */
  /* one bar cut into two parts, the whole bracketed under it */
  mbWhole: svg(
    `<rect x="2.6" y="5" width="11" height="7" rx="1" fill="${PAPER}"/><rect x="13.6" y="5" width="7.8" height="7" rx="1" fill="${LEAF}"/>` +
      bar(2.6, 17, 21.4, 17, 1.6, QUIET) + bar(2.6, 14.6, 2.6, 17, 1.4, QUIET) + bar(21.4, 14.6, 21.4, 17, 1.4, QUIET)
  ),
  /* two bars lined up, the longer one's extra loud */
  mbCompare: svg(
    `<rect x="2.6" y="4" width="11" height="6.4" rx="1" fill="${PAPER}"/>` +
      `<rect x="2.6" y="13.6" width="11" height="6.4" rx="1" fill="${PAPER}"/><rect x="13.6" y="13.6" width="7.8" height="6.4" rx="1" fill="${LOUD}"/>`
  ),
  /* three equal units against one */
  mbUnits: svg(
    [2.6, 9, 15.4].map((x) => `<rect x="${x}" y="4" width="6" height="6.4" rx="1" fill="${GOLD}"/>`).join("") +
      `<rect x="2.6" y="13.6" width="6" height="6.4" rx="1" fill="${GOLD}"/>`
  ),
  /* a bar of five units, three of them shaded */
  mbFraction: svg(
    [2.6, 6.4, 10.2].map((x) => `<rect x="${x}" y="8.6" width="3.6" height="6.8" rx="0.8" fill="${LOUD}"/>`).join("") +
      [14, 17.8].map((x) => `<rect x="${x}" y="8.6" width="3.6" height="6.8" rx="0.8" fill="${PAPER}"/>`).join("")
  ),
  /* a pencil over an empty dashed strip: draw your own */
  mbWord: svg(
    `<rect x="2.6" y="12.4" width="18.8" height="7" rx="1.2" fill="none" stroke="${QUIET}" stroke-width="1.2" stroke-dasharray="2 1.6"/>` +
      `<path d="M5 9.8 15.8 2.6l2.6 2.6L7.6 12.4H5z" fill="${GOLD}"/><path d="M15.8 2.6l2.6 2.6 1.4-1.4-2.6-2.6z" fill="${LOUD}"/>`
  ),
  pfHcf: svg(
    `<circle cx="9" cy="12" r="7.4" fill="${PAPER}" opacity="0.55"/>` +
      `<circle cx="15" cy="12" r="7.4" fill="${LEAF}" opacity="0.55"/>` +
      `<path d="M12 5.4a7.4 7.4 0 0 0 0 13.2 7.4 7.4 0 0 0 0-13.2z" fill="${LOUD}"/>`
  ),
  /* The same two rings, with the WHOLE of them picked out. */
  pfLcm: svg(
    `<circle cx="9" cy="12" r="7.4" fill="${LOUD}" opacity="0.75"/>` +
      `<circle cx="15" cy="12" r="7.4" fill="${LOUD}" opacity="0.75"/>` +
      `<circle cx="9" cy="12" r="7.4" fill="none" stroke="${INK}" stroke-width="1"/>` +
      `<circle cx="15" cy="12" r="7.4" fill="none" stroke="${INK}" stroke-width="1"/>`
  ),
  /* Both answers off one picture: the rings with a mark in each part. */
  pfVenn: svg(
    `<circle cx="9" cy="12" r="7.4" fill="none" stroke="${QUIET}" stroke-width="1.4"/>` +
      `<circle cx="15" cy="12" r="7.4" fill="none" stroke="${QUIET}" stroke-width="1.4"/>` +
      dot(5.8, 12, 1.9, PAPER) + dot(12, 12, 2.2, LOUD) + dot(18.2, 12, 1.9, LEAF)
  ),

  /* Two lists side by side with the same thing struck in each. */
  pfList: svg(
    `<rect x="2.6" y="4" width="8" height="16" rx="1.4" fill="${PAPER}" opacity="0.5"/>` +
      `<rect x="13.4" y="4" width="8" height="16" rx="1.4" fill="${LEAF}" opacity="0.5"/>` +
      bar(3.6, 8, 9.6, 8, 1.4, QUIET) + bar(14.4, 8, 20.4, 8, 1.4, QUIET) +
      bar(3.6, 12.4, 9.6, 12.4, 1.8, LOUD) + bar(14.4, 12.4, 20.4, 12.4, 1.8, LOUD) +
      bar(3.6, 16.6, 9.6, 16.6, 1.4, QUIET) + bar(14.4, 16.6, 20.4, 16.6, 1.4, QUIET)
  ),
  /* The ladder with two numbers in it. */
  pfTable: svg(
    `<path d="M8 3.6v16.8" stroke="${QUIET}" stroke-width="1.6" stroke-linecap="round"/>` +
      bar(8, 4.4, 21.4, 4.4, 1.6, QUIET) +
      dot(5, 8.4, 1.8, LOUD) + dot(5, 13.4, 1.8, LOUD) +
      `<rect x="10" y="6.8" width="4.4" height="3.2" rx="1" fill="${PAPER}"/>` +
      `<rect x="16.2" y="6.8" width="4.4" height="3.2" rx="1" fill="${LEAF}"/>` +
      `<rect x="10" y="11.8" width="4.4" height="3.2" rx="1" fill="${PAPER}"/>` +
      `<rect x="16.2" y="11.8" width="4.4" height="3.2" rx="1" fill="${LEAF}"/>` +
      `<rect x="10" y="16.8" width="4.4" height="3.2" rx="1" fill="${GOLD}"/>` +
      `<rect x="16.2" y="16.8" width="4.4" height="3.2" rx="1" fill="${GOLD}"/>`
  ),

  /* A square and a cube side by side: the shape tells you which root. */
  pfRootWords: svg(
    `<rect x="2.6" y="11.4" width="8.4" height="8.4" rx="1" fill="${PAPER}"/>` +
      `<rect x="13.6" y="11.4" width="7.4" height="7.4" rx="1" fill="${LEAF}"/>` +
      `<path d="M13.6 11.4 16.4 8.2h7.4v7.4l-2.8 3.2z" fill="${LEAF}" opacity="0.55"/>` +
      `<path d="M16.4 8.2h7.4v7.4" fill="none" stroke="${INK}" stroke-width="0.9"/>` +
      bar(2.6, 8.2, 11, 8.2, 1.6, LOUD)
  ),

  /* Steps going down: each line smaller than the one before it. */
  pfEuclid: svg(
    `<rect x="2.6" y="5" width="18.8" height="3.2" rx="1" fill="${PAPER}"/>` +
      `<rect x="2.6" y="10.4" width="13.2" height="3.2" rx="1" fill="${PAPER}"/>` +
      `<rect x="2.6" y="15.8" width="7.4" height="3.2" rx="1" fill="${LOUD}"/>` +
      dot(19.4, 17.4, 1.9, LEAF)
  ),
  /* Three numbers over one rule. */
  pfMany: svg(
    `<path d="M4 7.4v13" stroke="${QUIET}" stroke-width="1.6" stroke-linecap="round"/>` +
      bar(4, 8.2, 21.4, 8.2, 1.6, QUIET) +
      `<rect x="6.2" y="11" width="4" height="3.2" rx="1" fill="${PAPER}"/>` +
      `<rect x="11.4" y="11" width="4" height="3.2" rx="1" fill="${LEAF}"/>` +
      `<rect x="16.6" y="11" width="4" height="3.2" rx="1" fill="${GOLD}"/>` +
      `<rect x="6.2" y="16" width="4" height="3.2" rx="1" fill="${PAPER}" opacity="0.5"/>` +
      `<rect x="11.4" y="16" width="4" height="3.2" rx="1" fill="${LEAF}" opacity="0.5"/>` +
      `<rect x="16.6" y="16" width="4" height="3.2" rx="1" fill="${GOLD}" opacity="0.5"/>`
  ),

  /* Rows cut out of one number, and the same number counted up. */
  pfFmWords: svg(
    `<rect x="2.6" y="4.6" width="8.4" height="4" rx="1" fill="${PAPER}"/>` +
      `<rect x="2.6" y="9.8" width="8.4" height="4" rx="1" fill="${PAPER}"/>` +
      `<rect x="2.6" y="15" width="8.4" height="4" rx="1" fill="${PAPER}"/>` +
      dot(15.4, 6.6, 2.2, LOUD) + dot(19.8, 6.6, 2.2, LOUD) +
      dot(15.4, 11.8, 2.2, LOUD) + dot(19.8, 11.8, 2.2, LOUD) +
      dot(15.4, 17, 2.2, LOUD) + dot(19.8, 17, 2.2, LOUD)
  ),

  /* A till receipt: the two of them in the words a question is asked in. */
  pfWords: svg(
    `<rect x="4.6" y="3.4" width="14.8" height="17.2" rx="1.6" fill="${PAPER}"/>` +
      `<rect x="7" y="7" width="10" height="1.8" rx="0.9" fill="#fff"/>` +
      `<rect x="7" y="10.6" width="10" height="1.8" rx="0.9" fill="#fff"/>` +
      `<rect x="7" y="14.2" width="6" height="1.8" rx="0.9" fill="${LOUD}"/>`
  ),
  /* A number, and the same number twice over: what squaring does. */
  pfWhy: svg(
    `<rect x="3" y="9.6" width="5.6" height="5.6" rx="1.2" fill="${QUIET}"/>` +
      bar(9.6, 12.4, 12.6, 12.4, 1.6, QUIET) +
      `<rect x="13.8" y="5.6" width="5.6" height="5.6" rx="1.2" fill="${LOUD}"/>` +
      `<rect x="13.8" y="13.6" width="5.6" height="5.6" rx="1.2" fill="${LOUD}"/>`
  ),
  /* Primes paired off, and the one taken out of each pair. */
  pfSqRoot: svg(
    dot(5.4, 8.2, 2.4, LOUD) + dot(10.6, 8.2, 2.4, LOUD) +
      dot(5.4, 15.4, 2.4, PAPER) + dot(10.6, 15.4, 2.4, PAPER) +
      `<path d="M15.4 11.8h5.2M18 9.2v5.2" stroke="${QUIET}" stroke-width="1.6" stroke-linecap="round"/>`
  ),
  /* The same, in threes. */
  pfCubeRoot: svg(
    dot(4.6, 7.4, 2, LOUD) + dot(9.4, 7.4, 2, LOUD) + dot(14.2, 7.4, 2, LOUD) +
      dot(4.6, 13.4, 2, PAPER) + dot(9.4, 13.4, 2, PAPER) + dot(14.2, 13.4, 2, PAPER) +
      `<path d="M4.6 19.4h12.8" stroke="${QUIET}" stroke-width="1.6" stroke-linecap="round"/>`
  ),

  /* Scissors over two bars cut differently: the unlike denominators. */
  cut: svg(
    `<rect x="2.6" y="4" width="18.8" height="5" rx="1" fill="#fffdf8" stroke="${QUIET}" stroke-width="1.2"/>` +
      `<rect x="2.6" y="4" width="9.4" height="5" fill="${PAPER}"/>` +
      `<rect x="2.6" y="15" width="18.8" height="5" rx="1" fill="#fffdf8" stroke="${QUIET}" stroke-width="1.2"/>` +
      `<rect x="2.6" y="15" width="6.2" height="5" fill="${LEAF}"/>` +
      `<path d="M7 10.6 17 13.4M17 10.6 7 13.4" stroke="${LOUD}" stroke-width="1.6" stroke-linecap="round"/>`
  ),
  /* Number bases: groups of two — a pair, a pair of pairs — and the ones. */
  nbBases: svg(
    `<rect x="2.4" y="5" width="9" height="14" rx="1.6" fill="${PAPER}"/>` +
      `<rect x="13.4" y="5" width="4.4" height="14" rx="1.4" fill="${LEAF}"/>` +
      `<rect x="19.6" y="13" width="2.6" height="6" rx="1" fill="${LOUD}"/>` +
      `<path d="M2.4 12h9M6.9 5v14" stroke="#fffdf8" stroke-width="1"/>`
  ),
};
