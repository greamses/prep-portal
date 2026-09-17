/* ============================================================================
   PRINTABLE WORKBOOK — the toolbox: a ruler, a protractor, a set square
   ----------------------------------------------------------------------------
   The instruments a child would take out of a pencil case, drawn in real
   millimetres so that on screen, laid on the paper, they measure what the
   paper measures: the ruler's centimetres are the paper's centimetres at any
   zoom, because both are drawn at the same scale inside the same scaler.

   Each instrument says, in its own millimetres:
     pivot   the point that is placed — the ruler's zero, the protractor's
             centre, the set square's square corner. It turns about this
             point and it is this point that clicks onto a corner.
     knob    where the handle that turns it sits — anywhere on the tool that
             stays in reach; turning is "point the knob", measured from the
             direction the knob already lies in from the pivot.
     edges   the directions, from the pivot, that line up with a side: the
             ruler's measuring edge, the protractor's baseline (either way),
             the set square's two square edges.
     close   where the × that puts it back in the box sits — clear of the
             scale and of the knob.

   The protractor is the workbook's own (it is also printed, to cut out), so
   it is passed in; the ruler and the set square are the same everywhere.
   ========================================================================== */

import { bar, wedge, LOUD, QUIET, PAPER, GOLD, LEAF, WARM, INK as LEAD } from "./icons.js";

const INK = "#2a2723";
const f = (n) => n.toFixed(2);

/* Our own glyphs for the tool rail. They are in the site's one icon language —
   see utils/components/workbook/icons.js, which also states the loud/quiet rule
   they follow. An instrument is painted the colour the instrument itself is on
   the paper: the ruler butter, the set square sky with its cut-out parallel to
   its edges, the compass carrying its own pencil. */
const glyph = (inner) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
const r = (x, y, w, h, fill, rx = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
/* a written board: three rows of figures and the rule under the sum */
const board = (sign) =>
  r(11, 3.6, 10, 3.2, GOLD, 1.6) + r(11, 8.8, 10, 3.2, GOLD, 1.6) + sign +
  r(2.6, 14.2, 18.8, 1.9, QUIET, 0.95) + r(9, 17.8, 12, 3.2, LEAF, 1.6);

export const TOOL_ICONS = {
  box: glyph(
    r(3, 9, 18, 11.6, WARM, 2) + r(3, 9, 18, 3.4, GOLD, 1.6) +
      `<path d="M8.4 9V6.6a1.6 1.6 0 0 1 1.6-1.6h4a1.6 1.6 0 0 1 1.6 1.6V9h-2.4V7.4h-2.4V9z" fill="${PAPER}"/>` +
      r(10.6, 11.4, 2.8, 2.6, "#fff", 0.6)
  ),
  ruler: glyph(
    r(2.2, 7.6, 19.6, 8.8, GOLD, 2) +
      [5.6, 9, 12.4, 15.8, 19.2].map((x, i) => r(x - 0.7, 7.6, 1.4, i % 2 ? 3 : 4.6, "#fff", 0.7)).join("")
  ),
  protractor: glyph(
    `<path d="M3 17a9 9 0 0 1 18 0z" fill="${PAPER}"/>` +
      r(11.3, 10.2, 1.4, 5.2, "#fff", 0.7) +
      bar(7.4, 12.4, 8.8, 13.8, 1.4, "#fff") + bar(16.6, 12.4, 15.2, 13.8, 1.4, "#fff") +
      r(2.4, 16, 19.2, 2.6, LOUD, 1.3)
  ),
  setsquare: glyph(
    `<path d="M4 20V4l16 16z" fill="${PAPER}"/>` +
      `<path d="M7.4 16.6V12.2l4.4 4.4z" fill="#fff"/>`
  ),
  close: glyph(bar(6.4, 6.4, 17.6, 17.6, 2.8, LOUD) + bar(17.6, 6.4, 6.4, 17.6, 2.8, LOUD)),
  /* the compass carries its own pencil: the needle leg is quiet, the pencil
     leg is the loud one, because it is the leg that draws */
  compass: glyph(
    bar(11.2, 6.6, 6.2, 20.4, 2.2, QUIET) +
      bar(12.8, 6.6, 16.6, 17, 2.6, WARM) +
      `<path d="M15.4 16.2 18.2 17.2 18.4 21.4z" fill="${LOUD}"/>` +
      bar(8.4, 14.4, 15.4, 14.4, 1.6, QUIET) +
      `<circle cx="12" cy="5" r="2.6" fill="${GOLD}"/>`
  ),
  pencil: glyph(
    `<path d="M14.6 6.2 17.8 9.4 8.4 18.8 5.2 15.6z" fill="${GOLD}"/>` +
      `<path d="M16 4.8a2.2 2.2 0 0 1 3.2 3.2l-1.4 1.4-3.2-3.2z" fill="${LOUD}"/>` +
      `<path d="M5.2 15.6 8.4 18.8 3.6 20.4z" fill="${WARM}"/>` +
      `<path d="M3.6 20.4 4.1 18.9 5.1 19.9z" fill="${LEAD}"/>`
  ),
  eraser: glyph(
    `<path d="M4.2 13.4 11.6 6a1.8 1.8 0 0 1 2.5 0l4.9 4.9a1.8 1.8 0 0 1 0 2.5L14 18.4H9.2z" fill="${LOUD}"/>` +
      `<path d="M8 9.6 14.4 16 12 18.4H9.2l-5-5z" fill="${PAPER}"/>` +
      r(9.2, 19.4, 11.6, 2, QUIET, 1)
  ),
  chart: glyph(
    r(2.8, 4.4, 18.4, 15.2, PAPER, 1.8) +
      `<path d="M2.8 6.2a1.8 1.8 0 0 1 1.8-1.8h14.8a1.8 1.8 0 0 1 1.8 1.8v3.2H2.8z" fill="${GOLD}"/>` +
      r(8.4, 9.4, 1.4, 10.2, "#fff", 0) + r(14.2, 9.4, 1.4, 10.2, "#fff", 0)
  ),
  /* blocks: a flat, a rod and a unit — painted as the blocks are painted */
  bench: glyph(
    r(2.6, 9.6, 8.4, 10.8, PAPER, 1) + r(6.1, 9.6, 1.2, 10.8, "#fff", 0) + r(2.6, 14.4, 8.4, 1.2, "#fff", 0) +
      r(12.8, 5.6, 3.2, 14.8, GOLD, 1) +
      r(17.8, 16.8, 3.6, 3.6, LOUD, 0.8)
  ),
  shapes: glyph(
    r(2.8, 3.2, 8, 8, GOLD, 1.8) + `<circle cx="17" cy="7.2" r="4" fill="${PAPER}"/>` +
      `<path d="M7 12.8l4.4 8H2.6z" fill="${LOUD}"/>` + r(13.2, 13, 7.8, 7.8, LEAF, 1.8)
  ),
  angles: glyph(
    bar(4, 19.4, 20.4, 19.4, 1.8, QUIET) + bar(4, 19.4, 17, 6, 1.8, QUIET) +
      wedge([4, 19.4], [1, 0], [0.696, -0.718], 6.6)
  ),
  transversal: glyph(
    bar(2.4, 8.4, 21.6, 8.4, 1.8, QUIET) + bar(2.4, 15.6, 21.6, 15.6, 1.8, QUIET) +
      bar(7.6, 21, 16.4, 3, 2.8, LOUD)
  ),
  pythagoras: glyph(
    `<path d="M4.6 19.6h14.2V5.4z" fill="${PAPER}"/>` + r(14.6, 15.4, 3.4, 3.4, LOUD, 0.5)
  ),
  surface: glyph(
    `<path d="M12 12.4 20.4 8v8.4L12 20.8z" fill="${WARM}"/>` +
      `<path d="M12 12.4 3.6 8v8.4l8.4 4.4z" fill="${PAPER}"/>` +
      `<path d="M12 3.4 20.4 8 12 12.4 3.6 8z" fill="${GOLD}"/>`
  ),
  graph: glyph(
    r(3.2, 3.2, 2, 17.6, QUIET, 1) + r(3.2, 18.8, 17.6, 2, QUIET, 1) +
      `<path d="M5.6 16c4-1.2 4.6-8.4 8-8.4s4 4.8 6 5.6" fill="none" stroke="${LOUD}" stroke-width="2.6" stroke-linecap="round"/>`
  ),
  /* the written boards and the algebra sheet — working paper, not instruments */
  longdiv: glyph(
    r(10.2, 3, 10.4, 3, GOLD, 1.5) +
      `<path d="M7.2 8.2h14.2v2.4H9.8c.6 1.2.9 2.6.9 4.2s-.3 3-.9 4.2H7.2c.8-1.2 1.2-2.6 1.2-4.2s-.4-3-1.2-4.2z" fill="${LOUD}"/>` +
      r(11.4, 12.6, 9, 2.6, PAPER, 1.3) + r(11.4, 17, 6.4, 2.6, PAPER, 1.3) +
      r(2.4, 12.8, 3.6, 3, PAPER, 1.2)
  ),
  column: glyph(board(r(4.2, 5.9, 5.2, 2.2, LOUD, 1.1) + r(5.7, 4.4, 2.2, 5.2, LOUD, 1.1))),
  times: glyph(board(bar(4, 5, 8.6, 9.6, 2.2, LOUD) + bar(8.6, 5, 4, 9.6, 2.2, LOUD))),
  fraction: glyph(
    r(7.4, 3, 9.2, 6, GOLD, 1.6) + r(3.4, 10.9, 17.2, 2.2, LOUD, 1.1) + r(7.4, 15, 9.2, 6, PAPER, 1.6)
  ),
  /* Algebra Moves: an unknown box, and the move that keeps both sides level */
  gm: glyph(
    r(2.6, 6.4, 8, 11.2, GOLD, 1.6) +
      bar(4.6, 9.4, 8.6, 14.6, 1.8, LOUD) + bar(8.6, 9.4, 4.6, 14.6, 1.8, LOUD) +
      r(12.4, 9.4, 3.4, 1.8, QUIET, 0.9) + r(12.4, 12.8, 3.4, 1.8, QUIET, 0.9) +
      r(17.4, 8.2, 4, 7.6, PAPER, 1.4)
  ),
  side: glyph(
    r(2.8, 4.2, 18.4, 15.6, PAPER, 1.8) +
      `<path d="M4.6 4.2h4.2v15.6H4.6a1.8 1.8 0 0 1-1.8-1.8V6a1.8 1.8 0 0 1 1.8-1.8z" fill="${GOLD}"/>`
  ),
};

/* ── the ruler ─────────────────────────────────────────────────────────────*/

const RULER_CM = 15;
const RULER_END = 5; // mm of ruler before the 0 and after the 15

/** A 15 cm ruler: millimetres, half centimetres, centimetres numbered. The
    measuring edge is the top one, and the 0 is where the pivot is. */
function rulerSvg() {
  const len = RULER_CM * 10;
  const W = len + 2 * RULER_END;
  const H = 15;
  let body = `<rect x="0.25" y="0.25" width="${f(W - 0.5)}" height="${f(H - 0.5)}" rx="1" fill="#fff3a8" fill-opacity="0.82" stroke="${INK}" stroke-width="0.5"/>`;
  for (let mm = 0; mm <= len; mm++) {
    const x = RULER_END + mm;
    const cm = mm % 10 === 0;
    const half = mm % 5 === 0;
    body += `<line x1="${f(x)}" y1="0.25" x2="${f(x)}" y2="${cm ? 5 : half ? 3.6 : 2.3}" stroke="${INK}" stroke-width="${cm ? 0.32 : 0.2}"/>`;
    if (cm) {
      body += `<text x="${f(x)}" y="8.4" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.7" font-weight="700" fill="${INK}">${mm / 10}</text>`;
    }
  }
  body += `<text x="${f(W - 3)}" y="${f(H - 2)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="2.4" fill="${INK}" opacity="0.7">cm</text>`;
  return `<svg viewBox="0 0 ${f(W)} ${H}" width="${f(W)}mm" height="${H}mm" role="img" aria-label="A 15 centimetre ruler">${body}</svg>`;
}

/* ── the set square ────────────────────────────────────────────────────────*/

const SQ_LEG = 75;
const SQ_PAD = 1;

/** A 45° set square, its square corner at the bottom left, a millimetre
    scale along the bottom edge from that corner, and the cut-out in the
    middle a real one has. */
function setSquareSvg() {
  const C = [SQ_PAD, SQ_PAD + SQ_LEG];          // the square corner
  const A = [SQ_PAD + SQ_LEG, SQ_PAD + SQ_LEG]; // along the bottom
  const B = [SQ_PAD, SQ_PAD];                   // up the side
  const W = SQ_LEG + 2 * SQ_PAD;
  const H = SQ_LEG + 2 * SQ_PAD;
  let body = `<path d="M${f(C[0])} ${f(C[1])} L${f(A[0])} ${f(A[1])} L${f(B[0])} ${f(B[1])} Z" fill="#c8f0c0" fill-opacity="0.6" stroke="${INK}" stroke-width="0.5" stroke-linejoin="round"/>`;
  /* The cut-out: the same triangle, smaller, every side parallel to the
     outside and the same distance g in from it. The two square edges move in
     by g; the long edge moves in by g too, which along a square edge is
     g × √2 — so each inner square edge is g(2 + √2) shorter. */
  const g = 14;
  const inner = SQ_LEG - g * (2 + Math.SQRT2);
  const c2 = [C[0] + g, C[1] - g];
  const a2 = [c2[0] + inner, c2[1]];
  const b2 = [c2[0], c2[1] - inner];
  body += `<path d="M${f(c2[0])} ${f(c2[1])} L${f(a2[0])} ${f(a2[1])} L${f(b2[0])} ${f(b2[1])} Z" fill="#fffdf8" fill-opacity="0.55" stroke="${INK}" stroke-width="0.35" stroke-linejoin="round"/>`;
  /* the scale, along the bottom edge from the square corner */
  for (let mm = 0; mm <= SQ_LEG - 8; mm++) {
    const x = C[0] + mm;
    const cm = mm % 10 === 0;
    const half = mm % 5 === 0;
    body += `<line x1="${f(x)}" y1="${f(C[1])}" x2="${f(x)}" y2="${f(C[1] - (cm ? 4.4 : half ? 3.2 : 2))}" stroke="${INK}" stroke-width="${cm ? 0.3 : 0.18}"/>`;
    if (cm && mm) {
      body += `<text x="${f(x)}" y="${f(C[1] - 5.8)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.4" font-weight="700" fill="${INK}">${mm / 10}</text>`;
    }
  }
  /* the square corner, marked */
  body += `<polyline points="${f(C[0] + 5)},${f(C[1])} ${f(C[0] + 5)},${f(C[1] - 5)} ${f(C[0])},${f(C[1] - 5)}" fill="none" stroke="#c0453f" stroke-width="0.4"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" role="img" aria-label="A 45 degree set square">${body}</svg>`;
}

/* ── the compass ───────────────────────────────────────────────────────────
   Two legs hinged at the top: a needle on one, a pencil on the other. It
   draws with its OWN pencil — nothing has to be picked up off the rail first —
   because that is what a compass is: set the opening, put the needle down,
   twist the top, and the circle is the compass's doing, not the child's hand.

   Drawn from above and a little in front, so the hinge stands up between the
   two points. The picture is redrawn whenever the opening changes, which is
   why this one is a function of the radius and not a fixed drawing. */

export const COMPASS = {
  PAD: 8,            // mm of room round the two points
  LEG: 70,           // mm, each leg
  MIN: 5,            // mm, the narrowest it will close to
  MAX: 130,          // mm, the widest it will open
  START: 40,         // mm, how wide it comes out of the box
  RISE: 0.3,         // how much of the hinge's height shows from this angle
};

/** How high the hinge stands, in the drawing, for an opening of r mm. */
export function hingeRise(r) {
  const half = Math.min(r / 2, COMPASS.LEG - 1);
  return COMPASS.RISE * Math.sqrt(COMPASS.LEG * COMPASS.LEG - half * half);
}

/** The compass opened to r millimetres: needle at the pivot, pencil r to its right. */
export function compassSvg(r) {
  const { PAD, MAX } = COMPASS;
  const top = PAD + hingeRise(0);          // the pivot sits under the tallest hinge
  const W = PAD + MAX + PAD + 4;
  const H = top + PAD;
  const N = [PAD, top];
  const P = [PAD + r, top];
  const Hg = [PAD + r / 2, top - hingeRise(r)];
  /* the pencil: the last 13 mm of the right leg, butter yellow with a dark tip */
  const len = Math.hypot(P[0] - Hg[0], P[1] - Hg[1]) || 1;
  const back = Math.min(13, len * 0.45);
  const B = [P[0] - ((P[0] - Hg[0]) / len) * back, P[1] - ((P[1] - Hg[1]) / len) * back];
  const T = [P[0] - ((P[0] - Hg[0]) / len) * 2.2, P[1] - ((P[1] - Hg[1]) / len) * 2.2];
  const leg = (a, b, w, c) =>
    `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const body =
    /* needle leg */
    leg(Hg, N, 2.6, INK) + leg(Hg, N, 1.6, "#9aa6b4") +
    `<circle cx="${f(N[0])}" cy="${f(N[1])}" r="1.1" fill="#fffdf8" stroke="${INK}" stroke-width="0.4"/>` +
    `<circle cx="${f(N[0])}" cy="${f(N[1])}" r="0.35" fill="#c0453f"/>` +
    /* pencil leg */
    leg(Hg, B, 2.6, INK) + leg(Hg, B, 1.6, "#9aa6b4") +
    leg(B, T, 3.2, INK) + leg(B, T, 2.3, "#f4c95d") +
    leg(T, P, 1.2, INK) +
    /* the hinge and the handle on top of it */
    `<circle cx="${f(Hg[0])}" cy="${f(Hg[1])}" r="3.1" fill="#c0453f" stroke="${INK}" stroke-width="0.5"/>` +
    `<circle cx="${f(Hg[0])}" cy="${f(Hg[1])}" r="1" fill="#fffdf8"/>`;
  return `<svg viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" role="img" aria-label="A pair of compasses opened to ${f(r / 10)} centimetres">${body}</svg>`;
}

/* ── the protractor, whatever the workbook printed ─────────────────────────*/

function protractorSpec(svg) {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1]?.split(/\s+/).map(Number) || [0, 0, 74, 47];
  const dot = svg.match(/<circle cx="([\d.]+)" cy="([\d.]+)" r="1"/);
  const pivot = dot ? [Number(dot[1]), Number(dot[2])] : [vb[2] / 2, vb[3] - 6];
  return {
    id: "protractor",
    label: "Protractor",
    svg,
    pivot,
    knob: [vb[2] + 1, pivot[1]],
    /* top right: the angle it is turned to is shown top left */
    close: [vb[2] - 4, 4],
    edges: [{ deg: 0, both: true }],
    /* the straight edges a pencil can be run along, in mm from the pivot */
    rules: [{ deg: 0, from: -pivot[0], to: vb[2] - pivot[0] }],
    readout: true,
  };
}

/**
 * The toolbox: every instrument this workbook has, in the order a child
 * would reach for them.
 */
export function instruments({ protractor = null } = {}) {
  const len = RULER_CM * 10;
  const out = [{
    id: "ruler",
    label: "Ruler",
    svg: rulerSvg(),
    pivot: [RULER_END, 0],
    /* halfway along, on the plain lower edge: a knob past the 15 is off the
       paper as often as not */
    knob: [RULER_END + len / 2, 12],
    /* just past the far end of the ruler */
    close: [RULER_END * 2 + len + 4, 7.5],
    edges: [{ deg: 0, both: false }],
    rules: [{ deg: 0, from: -RULER_END, to: len + RULER_END }],
    readout: false,
  }];
  if (protractor) out.push(protractorSpec(protractor));
  out.push({
    id: "setsquare",
    label: "Set square",
    svg: setSquareSvg(),
    pivot: [SQ_PAD, SQ_PAD + SQ_LEG],
    knob: [SQ_PAD + SQ_LEG + 4, SQ_PAD + SQ_LEG],
    /* up by the top corner, where the triangle is narrow and nothing is printed */
    close: [SQ_PAD + 6, SQ_PAD + 16],
    edges: [{ deg: 0, both: false }, { deg: -90, both: false }],
    rules: [{ deg: 0, from: 0, to: SQ_LEG }, { deg: -90, from: 0, to: SQ_LEG }],
    readout: false,
  });
  const top = COMPASS.PAD + hingeRise(0);
  out.push({
    id: "compass",
    label: "Compass",
    svg: compassSvg(COMPASS.START),
    pivot: [COMPASS.PAD, top],
    knob: null,
    close: [COMPASS.PAD, top + 5.5],
    edges: [],
    rules: [],
    readout: false,
    compass: true,
  });
  return out;
}
