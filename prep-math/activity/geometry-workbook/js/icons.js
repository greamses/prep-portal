/* ============================================================================
   Geometry Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js, and so does
   the house style: 24×24, filled shapes in the theme's accent tokens, white
   only where a coloured shape encloses it.

   THIS IS THE FILE THE LOUD/QUIET RULE WAS WRITTEN FOR. Eleven of these
   sections are the same two parallels and the same transversal; four of them
   are the same drawing differing only in WHICH pair of angles is marked. Drawn
   evenly they are one smudge at the 22px they live at on the rail. So:

     · the scaffold every one of them shares — the parallels, the transversal,
       the arms of an angle — is a thin bar in QUIET, and
     · the thing that makes this section this section — which angles are
       marked — is a filled wedge in LOUD, six units across.

   Read `corresponding`, `alternate`, `coInterior` and `coExterior` below in
   that order. The lines are identical in all four; the two coral wedges move,
   and moving them is the whole definition of each pair. It is the reverse of
   how the line-art set drew them, where the lines were bold and the marks were
   hairline arcs that vanished.
   ========================================================================== */

import {
  ICON as BASE, svg, bar, wedge,
  LOUD, QUIET, PAPER, GOLD, LEAF, WARM,
} from "/utils/components/workbook/icons.js";

/* ── the shared transversal scaffold ───────────────────────────────────────
   Two parallels and one line across them, at a fixed lean, so that every glyph
   built on it is the SAME drawing and only the marks differ. A child comparing
   two sections on the rail is then comparing the marks, which is the point. */

const LEAN = (24 * Math.PI) / 180;
const UP = [Math.sin(LEAN), -Math.cos(LEAN)];
const DOWN = [-UP[0], -UP[1]];
const RIGHT = [1, 0];
const LEFT = [-1, 0];

const TOP_Y = 7.6;
const BOT_Y = 16.4;
/** Where the transversal crosses a horizontal at height y. */
const crossAt = (y) => [12 + UP[0] * ((12 - y) / Math.cos(LEAN)), y];
const TOP = crossAt(TOP_Y);
const BOT = crossAt(BOT_Y);

/** The quiet drawing all eleven transversal glyphs stand on. */
const rails = (withCross = true) =>
  bar(2, TOP_Y, 22, TOP_Y, 1.7, QUIET) +
  bar(2, BOT_Y, 22, BOT_Y, 1.7, QUIET) +
  (withCross ? bar(12 - UP[0] * 11, 12 + 10.05, 12 + UP[0] * 11, 12 - 10.05, 1.7, QUIET) : "");

/** Arrow marks: the thing that says two lines are parallel, not just apart. */
const tick = (x, y) => `<path d="M${x - 2} ${y - 2.6}L${x + 1.8} ${y}L${x - 2} ${y + 2.6}z" fill="${LOUD}"/>`;

/** A solid dot, for a named point or a counted thing. */
const dot = (x, y, r = 1.6, fill = LOUD) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

/** A block arrowhead pointing along (dx,dy) from (x,y). */
function head(x, y, dx, dy, s = 4.2, fill = LOUD) {
  const n = Math.hypot(dx, dy);
  const ux = dx / n;
  const uy = dy / n;
  const px = -uy;
  const py = ux;
  const f = (v) => v.toFixed(2);
  return (
    `<path d="M${f(x + ux * s)} ${f(y + uy * s)}` +
    `L${f(x - px * s * 0.62)} ${f(y - py * s * 0.62)}` +
    `L${f(x + px * s * 0.62)} ${f(y + py * s * 0.62)}z" fill="${fill}"/>`
  );
}

/** Lines of writing — a reason, a description, a word problem. */
const writing = (x, w) =>
  `<rect x="${x}" y="6.8" width="${w}" height="2.6" rx="1.3" fill="${PAPER}"/>` +
  `<rect x="${x}" y="11.2" width="${w}" height="2.6" rx="1.3" fill="${PAPER}"/>` +
  `<rect x="${x}" y="15.6" width="${(w * 0.68).toFixed(1)}" height="2.6" rx="1.3" fill="${GOLD}"/>`;

/** A right-angle mark: the small square, filled so it survives small. */
const sq = (x, y, s = 2.8, fill = LOUD) =>
  `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="0.5" fill="${fill}"/>`;

/* the disc every circle-theorem glyph is drawn on */
const disc = (cx = 12, cy = 12, r = 9) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PAPER}"/>`;

export const ICON = {
  ...BASE,

  /* ── polygon angles ── */
  /* A triangle with one corner marked: an angle inside a triangle. */
  triangle: svg(
    `<path d="M12 3.6 21.6 20.4H2.4z" fill="${PAPER}"/>` +
      wedge([2.4, 20.4], RIGHT, [0.496, -0.868], 5.6)
  ),
  /* A hexagon with two cuts from one corner — the whole idea of the chapter. */
  cut: svg(
    `<path d="M7.5 3.6h9L21.4 12l-4.9 8.4h-9L2.6 12z" fill="${PAPER}"/>` +
      bar(7.5, 3.6, 16.5, 20.4, 1.9, LOUD) +
      bar(7.5, 3.6, 21.4, 12, 1.9, LOUD)
  ),
  /* The same triangle, but the corner we are looking for is the loud one. */
  missing: svg(
    `<path d="M12 3.6 21.6 20.4H2.4z" fill="${PAPER}"/>` +
      wedge([12, 3.6], [-0.496, 0.868], [0.496, 0.868], 6.4) +
      dot(12, 7.6, 1.5, "#fff")
  ),
  /* A pentagon: any shape at all. */
  polygon: svg(`<path d="M12 2.8 21.4 9.6 17.8 20.6H6.2L2.6 9.6z" fill="${PAPER}"/>`),
  /* Every corner marked, because the question is about each of them. */
  each: svg(
    `<path d="M7.5 3.6h9L21.4 12l-4.9 8.4h-9L2.6 12z" fill="${PAPER}"/>` +
      [[9.14, 6.78], [14.86, 6.78], [17.6, 12], [14.86, 17.22], [9.14, 17.22], [6.4, 12]]
        .map(([x, y]) => dot(x, y, 1.6)).join("")
  ),
  /* Lines of writing: a word problem. */
  words: svg(writing(2.6, 18.8)),
  /* The base carried on, and the angle that opens outside the triangle. */
  exterior: svg(
    `<path d="M2.6 20 14.6 20 9 5.6z" fill="${PAPER}"/>` +
      bar(14.6, 20, 21.8, 20, 1.7, QUIET) +
      wedge([14.6, 20], RIGHT, [-0.362, -0.932], 6)
  ),

  /* ── transversal angles ── */
  /* Two lines, and the marks that say they will never meet. */
  parallel: svg(
    bar(2, TOP_Y, 22, TOP_Y, 1.7, QUIET) +
      bar(2, BOT_Y, 22, BOT_Y, 1.7, QUIET) +
      tick(12, TOP_Y) +
      tick(12, BOT_Y)
  ),
  /* The line that cuts across them — here it is the loud one, because it is
     the only thing this section adds to the one before. */
  transversal: svg(
    bar(2, TOP_Y, 22, TOP_Y, 1.7, QUIET) +
      bar(2, BOT_Y, 22, BOT_Y, 1.7, QUIET) +
      bar(12 - UP[0] * 11, 22.05, 12 + UP[0] * 11, 1.95, 2.6, LOUD)
  ),
  /* The four angles at one crossing. They alternate colour, or four wedges
     meeting at a point are one disc. */
  trAngles: svg(
    rails() +
      wedge(TOP, RIGHT, UP, 4.6, LOUD) +
      wedge(TOP, UP, LEFT, 4.6, GOLD) +
      wedge(TOP, LEFT, DOWN, 4.6, LOUD) +
      wedge(TOP, DOWN, RIGHT, 4.6, GOLD)
  ),
  /* A sharp one and a wide one at the same crossing. */
  acuteObtuse: svg(
    bar(2, 12, 22, 12, 1.7, QUIET) +
      bar(12 - UP[0] * 10, 21.1, 12 + UP[0] * 10, 2.9, 1.7, QUIET) +
      wedge([12, 12], RIGHT, UP, 4.6, LOUD) +
      wedge([12, 12], RIGHT, DOWN, 7, GOLD)
  ),
  /* Two lines crossing: the pair facing each other, left and right. */
  vertOpp: svg(
    bar(4, 6, 20, 18, 1.7, QUIET) +
      bar(4, 18, 20, 6, 1.7, QUIET) +
      wedge([12, 12], [-0.8, -0.6], [-0.8, 0.6], 5.6) +
      wedge([12, 12], [0.8, 0.6], [0.8, -0.6], 5.6)
  ),
  /* SAME corner at both crossings. */
  corresponding: svg(rails() + wedge(TOP, RIGHT, UP) + wedge(BOT, RIGHT, UP)),
  /* The Z: inside the parallels, opposite sides of the transversal. */
  alternate: svg(rails() + wedge(TOP, LEFT, DOWN) + wedge(BOT, RIGHT, UP)),
  /* The C: inside the parallels, the same side. */
  coInterior: svg(rails() + wedge(TOP, RIGHT, DOWN) + wedge(BOT, RIGHT, UP)),
  /* Outside the parallels, the same side. */
  coExterior: svg(rails() + wedge(TOP, RIGHT, UP) + wedge(BOT, RIGHT, DOWN)),
  /* Two lines across the same parallels — so both of them are loud. */
  multiTrans: svg(
    bar(2, TOP_Y, 22, TOP_Y, 1.7, QUIET) +
      bar(2, BOT_Y, 22, BOT_Y, 1.7, QUIET) +
      bar(4.6, 21, 9.4, 3, 2.2, LOUD) +
      bar(13.4, 21, 19.6, 3, 2.2, GOLD)
  ),
  /* A triangle standing between two parallels. */
  triTrans: svg(
    bar(2, 5, 22, 5, 1.7, QUIET) +
      bar(2, 19, 22, 19, 1.7, QUIET) +
      `<path d="M12 5 18.4 19H5.6z" fill="${PAPER}"/>`
  ),

  /* ── solids ── */
  /* A cube: three faces, three tints, so it reads as a solid and not a net. */
  cube: svg(
    `<path d="M15 9l5-5v11l-5 5z" fill="${WARM}"/>` +
      `<path d="M4 9 9 4h11l-5 5z" fill="${GOLD}"/>` +
      `<rect x="4" y="9" width="11" height="11" fill="${PAPER}"/>`
  ),
  /* The skeleton: the edges and the corners, and the corners are the point. */
  sticks: svg(
    [[5, 9, 15, 9], [15, 9, 15, 19], [5, 19, 15, 19], [5, 9, 5, 19],
     [5, 9, 9, 4], [9, 4, 20, 4], [15, 9, 20, 4], [20, 4, 20, 15], [15, 19, 20, 15]]
      .map(([a, b, c, d]) => bar(a, b, c, d, 1.6, QUIET)).join("") +
      [[5, 9], [15, 9], [5, 19], [15, 19], [9, 4], [20, 4], [20, 15]]
        .map(([x, y]) => dot(x, y, 1.7)).join("")
  ),
  /* A cylinder: the curved surface, and the flat face on top of it. */
  cylinder: svg(
    `<path d="M5 6h14v12c0 1.5-3.1 2.6-7 2.6S5 19.5 5 18z" fill="${PAPER}"/>` +
      `<ellipse cx="12" cy="6" rx="7" ry="2.6" fill="${GOLD}"/>`
  ),
  /* A triangular prism: the end face is what the section is about, so the end
     face is the loud one. */
  prismBase: svg(
    `<path d="M8 9.4h8l4 8.6h-8z" fill="${PAPER}"/>` +
      `<path d="M4 18 8 9.4 12 18z" fill="${GOLD}"/>`
  ),
  /* A square pyramid, two faces. */
  pyramid: svg(
    `<path d="M12 3 10 20.4l10-4.4z" fill="${WARM}"/>` +
      `<path d="M12 3 3.6 17.2l6.4 3.2z" fill="${PAPER}"/>`
  ),
  /* A net: the solid opened out flat, so the faces separate. */
  net: svg(
    `<rect x="9.7" y="1.4" width="4.6" height="4.6" rx="0.6" fill="${PAPER}"/>` +
      `<rect x="9.7" y="6.6" width="4.6" height="4.6" rx="0.6" fill="${GOLD}"/>` +
      `<rect x="9.7" y="11.8" width="4.6" height="4.6" rx="0.6" fill="${PAPER}"/>` +
      `<rect x="9.7" y="17" width="4.6" height="4.6" rx="0.6" fill="${GOLD}"/>` +
      `<rect x="4.5" y="6.6" width="4.6" height="4.6" rx="0.6" fill="${LOUD}"/>` +
      `<rect x="14.9" y="6.6" width="4.6" height="4.6" rx="0.6" fill="${LOUD}"/>`
  ),
  /* The rule itself: two things put together make a third. */
  rule: svg(
    `<rect x="2.4" y="5" width="6.2" height="3.4" rx="1.7" fill="${PAPER}"/>` +
      `<rect x="11.1" y="5" width="1.8" height="3.4" rx="0.9" fill="${LOUD}"/>` +
      `<rect x="10.2" y="5.8" width="3.6" height="1.8" rx="0.9" fill="${LOUD}"/>` +
      `<rect x="15.4" y="5" width="6.2" height="3.4" rx="1.7" fill="${GOLD}"/>` +
      `<rect x="8.6" y="11" width="6.8" height="1.7" rx="0.85" fill="${LOUD}"/>` +
      `<rect x="8.6" y="13.8" width="6.8" height="1.7" rx="0.85" fill="${LOUD}"/>` +
      `<rect x="2.4" y="17.8" width="19.2" height="3.4" rx="1.7" fill="${LEAF}"/>`
  ),
  /* A box with no lid: the open rim is what makes it open. */
  openBox: svg(
    `<path d="M15 9l5-5v11l-5 5z" fill="${WARM}"/>` +
      `<rect x="4" y="9" width="11" height="11" fill="${PAPER}"/>` +
      bar(4, 9, 9, 4, 1.8, LOUD) + bar(9, 4, 20, 4, 1.8, LOUD) +
      bar(20, 4, 15, 9, 1.8, LOUD) + bar(15, 9, 4, 9, 1.8, LOUD)
  ),
  /* A tube: open at both ends, and the holes say so. */
  tube: svg(
    `<rect x="6" y="6" width="12" height="12" fill="${PAPER}"/>` +
      `<ellipse cx="18" cy="12" rx="2.6" ry="6" fill="${GOLD}"/>` +
      `<ellipse cx="6" cy="12" rx="2.6" ry="6" fill="${GOLD}"/>` +
      `<ellipse cx="6" cy="12" rx="1.3" ry="3.4" fill="#fff"/>`
  ),
  /* A frustum: a pyramid with its top cut off, and the cut is the point. */
  frustum: svg(
    `<path d="M8 6.4h8l4.4 13.2H3.6z" fill="${PAPER}"/>` +
      bar(8, 6.4, 16, 6.4, 2.2, LOUD)
  ),

  /* ── Pythagoras ── */
  /* A right-angled triangle, and the corner that makes it one. */
  rightTri: svg(
    `<path d="M4.6 20V4.6L20 20z" fill="${PAPER}"/>` + sq(4.9, 16.3, 3.2)
  ),
  /* The same triangle, its longest side picked out. */
  hyp: svg(
    `<path d="M4.6 20V4.6L20 20z" fill="${PAPER}"/>` +
      sq(4.9, 16.3, 3.2, QUIET) +
      bar(4.6, 4.6, 20, 20, 2.6, LOUD)
  ),
  /* A square built on every side: the picture the rule comes from. */
  pySquares: svg(
    `<path d="M8.6 8.6 14.6 14.6 20.6 8.6 14.6 2.6z" fill="${LOUD}"/>` +
      `<rect x="2.6" y="8.6" width="6" height="6" fill="${LEAF}"/>` +
      `<rect x="8.6" y="14.6" width="6" height="6" fill="${PAPER}"/>` +
      `<path d="M8.6 8.6v6h6z" fill="${GOLD}"/>`
  ),
  /* Two squares make the third. */
  pySum: svg(
    `<rect x="2.4" y="2.8" width="7" height="7" rx="0.6" fill="${PAPER}"/>` +
      `<rect x="2.4" y="14.2" width="7" height="7" rx="0.6" fill="${LEAF}"/>` +
      `<rect x="5.05" y="10.4" width="1.7" height="3.2" rx="0.85" fill="${LOUD}"/>` +
      `<rect x="4.3" y="11.15" width="3.2" height="1.7" rx="0.85" fill="${LOUD}"/>` +
      `<rect x="12.6" y="7.5" width="9" height="9" rx="0.6" fill="${GOLD}"/>`
  ),
  /* The big square with a piece taken out of its corner. */
  pyDiff: svg(
    `<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="0.8" fill="${GOLD}"/>` +
      `<rect x="3.4" y="12.6" width="8" height="8" fill="${LOUD}"/>`
  ),
  /* Short plus short makes long: the rule as three bars. */
  pyFormula: svg(
    `<rect x="2.4" y="4.6" width="6" height="3.2" rx="1.6" fill="${PAPER}"/>` +
      `<rect x="10.55" y="4.6" width="1.7" height="3.2" rx="0.85" fill="${LOUD}"/>` +
      `<rect x="9.8" y="5.35" width="3.2" height="1.7" rx="0.85" fill="${LOUD}"/>` +
      `<rect x="14.6" y="4.6" width="7" height="3.2" rx="1.6" fill="${LEAF}"/>` +
      `<rect x="9.2" y="11" width="5.6" height="1.7" rx="0.85" fill="${LOUD}"/>` +
      `<rect x="9.2" y="13.8" width="5.6" height="1.7" rx="0.85" fill="${LOUD}"/>` +
      `<rect x="2.4" y="17.6" width="19.2" height="3.4" rx="1.7" fill="${GOLD}"/>`
  ),

  /* ── transformations ── */
  /* A shape, and its image: two of the same thing. */
  tfIntro: svg(
    `<path d="M2.4 17.4 6.8 8.6l4.4 8.8z" fill="${PAPER}"/>` +
      `<path d="M12.8 17.4 17.2 8.6l4.4 8.8z" fill="${GOLD}"/>`
  ),
  /* The same shape slid along: the arrow is the move. */
  tfTranslate: svg(
    `<path d="M2.4 18 6 10l3.6 8z" fill="${PAPER}"/>` +
      `<path d="M14.4 18 18 10l3.6 8z" fill="${GOLD}"/>` +
      `<path d="M10.2 12.9h2.4v-1.9l3.1 2.8-3.1 2.8v-1.9h-2.4z" fill="${LOUD}"/>`
  ),
  /* A shape, the mirror, and what came back. */
  tfReflect: svg(
    `<path d="M9.4 6.6 3.4 17h6z" fill="${PAPER}"/>` +
      `<path d="M14.6 6.6 20.6 17h-6z" fill="${GOLD}"/>` +
      `<rect x="11.1" y="2" width="1.8" height="20" rx="0.9" fill="${LOUD}"/>`
  ),
  /* Turned about a point: the point, and the way round. */
  tfRotate: svg(
    `<path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.4" fill="none" stroke="${PAPER}" stroke-width="3.4" stroke-linecap="round"/>` +
      `<path d="M13.6 7.2l5.8-3.2.6 6.6z" fill="${LOUD}"/>` +
      dot(12, 12, 2.2)
  ),
  /* Bigger, from the same corner. */
  tfScale: svg(
    `<rect x="3.4" y="5.4" width="15.2" height="15.2" rx="0.8" fill="${GOLD}"/>` +
      bar(3.4, 20.6, 18.6, 5.4, 1.7, LOUD) +
      `<rect x="3.4" y="14.6" width="6" height="6" rx="0.6" fill="${PAPER}"/>`
  ),
  /* Say the move in full: the shape, and the words for it. */
  tfDescribe: svg(
    `<path d="M2.4 17 6 9l3.6 8z" fill="${LOUD}"/>` + writing(12.2, 9.4)
  ),

  /* ── circles ── */
  /* The centre, and the way out to the edge. */
  ciParts: svg(disc() + bar(12, 12, 18.4, 5.6, 2.2, LOUD) + dot(12, 12, 2)),
  /* Two radii and the chord: the triangle that is always isosceles. */
  ciIso: svg(disc() + `<path d="M12 12 5.1 17.7h13.8z" fill="${LOUD}"/>`),
  /* The angle at the middle, and the one at the edge on the same arc. */
  ciCentre: svg(
    disc() +
      `<path d="M12 3.2 6 18.2h12z" fill="${GOLD}"/>` +
      `<path d="M12 12 6 18.2h12z" fill="${LOUD}"/>`
  ),
  /* A diameter, a point on the circle, and the right angle it always makes. */
  ciSemi: svg(
    disc() +
      `<path d="M3.2 12 16 5.2 20.8 12z" fill="${GOLD}"/>` +
      bar(3.2, 12, 20.8, 12, 2.2, LOUD) +
      sq(14.6, 5.4, 2.6, "#fff")
  ),
  /* Two angles standing on the same chord. */
  ciSame: svg(
    disc() +
      `<path d="M5.2 16.4 8 5.6l11 10.8z" fill="${GOLD}"/>` +
      `<path d="M5.2 16.4 15.6 5.4l3.2 11z" fill="${LEAF}" opacity="0.85"/>` +
      bar(5.2, 16.4, 18.8, 16.4, 2.2, LOUD)
  ),
  /* Four corners, all on the circle. */
  ciCyclic: svg(disc() + `<path d="M6.2 6.6 18 5.4l1.6 9-11 5z" fill="${LOUD}"/>`),
  /* A line that touches the circle once, and the radius it meets squarely. */
  ciTangent: svg(
    disc(11, 11, 7.8) +
      bar(11, 11, 11, 18.8, 2, GOLD) +
      bar(2, 18.8, 22, 18.8, 2.4, LOUD) +
      sq(11.4, 15.8, 2.6, "#fff")
  ),
  /* The line from the centre that cuts a chord in half. */
  ciChord: svg(
    disc() +
      bar(5.2, 16.2, 18.8, 16.2, 2.4, LOUD) +
      bar(12, 12, 12, 16.2, 2, GOLD) +
      dot(12, 12, 2)
  ),
  /* A tangent, a chord off it, and the angle waiting in the other segment. */
  ciAlt: svg(
    disc(12, 11, 7.8) +
      `<path d="M12 18.8 18.6 7.6 7 5.8z" fill="${GOLD}"/>` +
      bar(2, 18.8, 22, 18.8, 2.4, LOUD)
  ),
  /* A circle and the words: say why. */
  ciReason: svg(disc(6.8, 12, 5.2) + writing(14, 7.6)),

  /* ── lines and angles ── */
  /* A line, a ray and a segment — told apart by their ends, so the ends are
     what is drawn loud. */
  laPaths: svg(
    bar(4, 5.4, 20, 5.4, 1.7, QUIET) + head(20, 5.4, 1, 0, 3.4) + head(4, 5.4, -1, 0, 3.4) +
      bar(4.6, 12, 20, 12, 1.7, QUIET) + head(20, 12, 1, 0, 3.4) + dot(4.6, 12, 1.9) +
      bar(4.6, 18.6, 16, 18.6, 1.7, QUIET) + dot(4.6, 18.6, 1.9) + dot(16, 18.6, 1.9)
  ),
  /* Three points, and the angle they name between them. */
  laName: svg(
    bar(4.6, 19.4, 19.4, 19.4, 1.7, QUIET) +
      bar(4.6, 19.4, 15, 6, 1.7, QUIET) +
      wedge([4.6, 19.4], RIGHT, [0.613, -0.79], 5.4) +
      dot(4.6, 19.4, 1.8, GOLD) + dot(19.4, 19.4, 1.8, GOLD) + dot(15, 6, 1.8, GOLD)
  ),
  /* A small angle, and the big one going the long way round: reflex. The ring
     IS the reflex angle, and the white notch is what it is not. */
  laKinds: svg(
    `<circle cx="12" cy="12" r="6.4" fill="${LOUD}"/>` +
      wedge([12, 12], RIGHT, [0.707, -0.707], 6.4, "#fff") +
      bar(12, 12, 21, 12, 1.7, QUIET) +
      bar(12, 12, 18.4, 5.6, 1.7, QUIET)
  ),
  /* Two angles filling a straight line. */
  laLine: svg(
    bar(2.6, 16, 21.4, 16, 1.7, QUIET) +
      bar(12, 16, 17, 6, 1.7, QUIET) +
      wedge([12, 16], LEFT, [0.447, -0.894], 5.6, LOUD) +
      wedge([12, 16], [0.447, -0.894], RIGHT, 5.6, GOLD)
  ),
  /* Angles filling the whole turn at a point. */
  laPoint: svg(
    `<circle cx="12" cy="12" r="6.4" fill="${LOUD}"/>` +
      `<circle cx="12" cy="12" r="3" fill="#fff"/>` +
      bar(12, 12, 21.4, 12, 1.7, QUIET) +
      bar(12, 12, 5.4, 5, 1.7, QUIET) +
      bar(12, 12, 9.6, 21, 1.7, QUIET)
  ),
  /* Two lines crossing: the pair facing each other, top and bottom — the other
     pair is `vertOpp` in the transversal chapter, and they must not be the
     same picture. */
  laVo: svg(
    bar(4, 6, 20, 18, 1.7, QUIET) +
      bar(4, 18, 20, 6, 1.7, QUIET) +
      wedge([12, 12], [-0.8, -0.6], [0.8, -0.6], 5.6) +
      wedge([12, 12], [0.8, 0.6], [-0.8, 0.6], 5.6)
  ),
  /* A right angle cut into two. */
  laComp: svg(
    bar(4.6, 19.4, 20, 19.4, 1.7, QUIET) +
      bar(4.6, 19.4, 4.6, 4, 1.7, QUIET) +
      bar(4.6, 19.4, 15, 10, 1.7, QUIET) +
      wedge([4.6, 19.4], RIGHT, [0.742, -0.67], 5.6, LOUD) +
      wedge([4.6, 19.4], [0.742, -0.67], [0, -1], 5.6, GOLD)
  ),
  /* Square to each other on the left; side by side on the right. */
  laPerp: svg(
    bar(2.4, 12, 11, 12, 1.7, QUIET) +
      bar(6.8, 6.6, 6.8, 17.4, 1.7, QUIET) +
      sq(7.3, 9.1, 2.6) +
      bar(13.6, 8, 21.6, 8, 1.7, QUIET) +
      bar(13.6, 16, 21.6, 16, 1.7, QUIET) +
      tick(17.8, 8) + tick(17.8, 16)
  ),
  /* Angles on a line, written with a letter instead of a number. */
  laAlgebra: svg(
    bar(2.6, 17, 21.4, 17, 1.7, QUIET) +
      bar(12, 17, 16.4, 8, 1.7, QUIET) +
      bar(5, 10.6, 9, 14.6, 1.8, LOUD) + bar(9, 10.6, 5, 14.6, 1.8, LOUD) +
      bar(16.4, 11.4, 19.6, 14.6, 1.8, GOLD) + bar(19.6, 11.4, 16.4, 14.6, 1.8, GOLD)
  ),
  /* An angle and the words: say why. */
  laReason: svg(
    bar(2.4, 17.4, 10.4, 17.4, 1.7, QUIET) +
      bar(2.4, 17.4, 8.6, 9.4, 1.7, QUIET) +
      wedge([2.4, 17.4], RIGHT, [0.61, -0.79], 4.2) +
      writing(13.4, 8.2)
  ),

  /* Three, four and five in a row: the sides of a triple, counted. */
  triples: svg(
    [3, 4, 5]
      .map((n, r) =>
        Array.from({ length: n }, (_, i) =>
          dot(4.4 + i * 3.8, 5.6 + r * 6.4, 1.6, [PAPER, GOLD, LOUD][r])
        ).join("")
      )
      .join("")
  ),

  /* ── measuring angles ── */
  /* Two arms, and the angle between them. */
  angle: svg(
    bar(4, 19.4, 20, 19.4, 1.7, QUIET) +
      bar(4, 19.4, 16.5, 5.5, 1.7, QUIET) +
      wedge([4, 19.4], RIGHT, [0.668, -0.744], 6.4)
  ),
  /* The half disc, its ticks, and the straight edge you line up. */
  protractor: svg(
    `<path d="M3 16.6a9 9 0 0 1 18 0z" fill="${PAPER}"/>` +
      `<rect x="6.4" y="11.4" width="1.4" height="4.4" rx="0.7" fill="#fff"/>` +
      `<rect x="11.3" y="9.6" width="1.4" height="6.2" rx="0.7" fill="#fff"/>` +
      `<rect x="16.2" y="11.4" width="1.4" height="4.4" rx="0.7" fill="#fff"/>` +
      `<rect x="2.4" y="15.6" width="19.2" height="2.6" rx="1.3" fill="${LOUD}"/>`
  ),
};
