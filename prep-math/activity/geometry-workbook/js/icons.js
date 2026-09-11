/* ============================================================================
   Geometry Workbook — the glyphs this workbook adds
   ----------------------------------------------------------------------------
   One per section in the rail. Everything else on the bench — the printer, the
   die, the tick — comes from /utils/components/workbook/icons.js.
   ========================================================================== */

import { ICON as BASE, line } from "/utils/components/workbook/icons.js";

export const ICON = {
  ...BASE,
  /* A triangle with an arc in one corner: an angle inside a triangle. */
  triangle: line(`<path d="M3.5 19.5h17L12 4.5z"/><path d="M8.2 19.5a4.6 4.6 0 0 0-2.1-3.9"/>`),
  /* A hexagon with two cuts from one corner — the whole idea of the chapter. */
  cut: line(
    `<path d="M7.5 3.8h9l4.5 8.2-4.5 8.2h-9L3 12z"/>` +
      `<path d="M7.5 3.8 16.5 20.2M7.5 3.8 21 12" stroke-dasharray="2 1.6"/>`
  ),
  /* A triangle with a "?" where one corner would be read. */
  missing: line(`<path d="M3.5 19.5h17L12 4.5z"/><path d="M11 13.2a1.6 1.6 0 1 1 2.2 1.5c-.5.2-.8.6-.8 1.1"/><path d="M12.4 17.6v0"/>`),
  /* A pentagon: any shape. */
  polygon: line(`<path d="M12 3.2 20.8 9.6 17.4 20H6.6L3.2 9.6z"/>`),
  /* A regular shape with an arc in every corner — each angle. */
  each: line(
    `<path d="M7.5 3.8h9l4.5 8.2-4.5 8.2h-9L3 12z"/>` +
      `<path d="M9.8 3.8a2.3 2.3 0 0 1-1.1 2M14.2 3.8a2.3 2.3 0 0 0 1.1 2"/>`
  ),
  /* Lines of writing: a word problem. */
  words: line(`<path d="M4 6.5h16M4 11h16M4 15.5h10"/>`),
  /* A triangle with its base carried on and the outside angle marked. */
  exterior: line(`<path d="M3 19.5h12L9 6.5z"/><path d="M15 19.5h6" stroke-dasharray="1.8 1.4"/><path d="M18.4 19.5a3.4 3.4 0 0 0-2.5-3.1"/>`),

  /* ── chapter 2 ── */
  /* Two lines with the arrow marks that say they are parallel. */
  parallel: line(`<path d="M3 8h18M3 16h18"/><path d="M11 6.2l1.8 1.8-1.8 1.8M11 14.2l1.8 1.8-1.8 1.8"/>`),
  /* Two parallels and a line across them. */
  transversal: line(`<path d="M3 8h18M3 16h18M8 21 16 3"/>`),
  /* The four angles at a crossing, one dot in each. */
  trAngles: line(
    `<path d="M3 8h18M3 16h18M8 21 16 3"/>` +
      `<circle cx="16.5" cy="6.3" r=".6"/><circle cx="12" cy="5.3" r=".6"/><circle cx="11.1" cy="9.7" r=".6"/><circle cx="15.5" cy="10.7" r=".6"/>`
  ),
  /* A small arc and a wide one at the same crossing. */
  acuteObtuse: line(`<path d="M3 14h18M7 21 17 3"/><path d="M13.9 14A3 3 0 0 0 12.3 11.4M11.9 12.2A2 2 0 0 0 8.9 14"/>`),
  /* Two lines crossing, the opposite pair marked. */
  vertOpp: line(`<path d="M4 6 20 18M4 18 20 6"/><path d="M9.2 9.9A3.5 3.5 0 0 0 9.2 14.1M14.8 14.1A3.5 3.5 0 0 0 14.8 9.9"/>`),
  /* The same corner marked at both crossings. */
  corresponding: line(`<path d="M3 8h18M3 16h18M8 21 16 3"/><path d="M16.3 8A2.5 2.5 0 0 0 14.8 5.7M12.7 16A2.5 2.5 0 0 0 11.2 13.7"/>`),
  /* The Z. */
  alternate: line(`<path d="M3 6h18M3 18h18M7 20 15 4"/><path d="M11.5 6A2.5 2.5 0 0 0 12.9 8.2M10.5 18A2.5 2.5 0 0 0 9.1 15.8"/>`),
  /* The C: both inside, the same side. */
  coInterior: line(`<path d="M3 6h18M3 18h18M7 20 15 4"/><path d="M11.5 6A2.5 2.5 0 0 0 12.9 8.2M9.1 15.8A2.5 2.5 0 0 0 5.5 18"/>`),
  /* Both outside, the same side. */
  coExterior: line(`<path d="M3 6h18M3 18h18M7 20 15 4"/><path d="M15.1 3.8A2.5 2.5 0 0 0 11.5 6M5.5 18A2.5 2.5 0 0 0 6.9 20.2"/>`),
  /* Two lines across the same parallels. */
  multiTrans: line(`<path d="M3 8h18M3 16h18M5 20 10 4M13 20 20 4"/>`),
  /* A triangle standing between two parallels. */
  triTrans: line(`<path d="M3 5h18M3 19h18"/><path d="M12 5 6 19M12 5 18 19"/>`),

  /* ── chapter 3 ── */
  /* A cube: the front square, the top and the side. */
  cube: line(`<path d="M4 9h11v11H4zM4 9l5-5h11l-5 5M15 20l5-5V4"/>`),
  /* A skeleton: sticks and blobs. */
  sticks: line(`<path d="M5 9h10v10H5zM5 9l4-4h10l-4 4M15 19l4-4V5"/><circle cx="5" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="5" cy="19" r="1"/><circle cx="15" cy="19" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="19" cy="15" r="1"/>`),
  /* A cylinder: a curved surface and two flat faces. */
  cylinder: line(`<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/>`),
  /* A triangular prism, its two ends. */
  prismBase: line(`<path d="M4 18 8 10l4 8zM12 18h8M8 10h8l4 8M4 18l0 0"/>`),
  /* A square pyramid. */
  pyramid: line(`<path d="M12 3 4 17l6 3 10-4zM12 3l-2 17M12 3l8 13"/>`),
  /* A net: a cross of squares. */
  net: line(`<path d="M9 3h6v18H9zM3 9h18v6H3z"/>`),
  /* A rule: n + 2. */
  rule: line(`<path d="M4 7h16M4 12h10M4 17h13"/>`),
  /* An open box: no lid. */
  openBox: line(`<path d="M4 9v11h11V9M15 20l5-5V4M4 9l5-5M9 4h11M9 4v5"/>`),
  /* A tube, open at both ends. */
  tube: line(`<ellipse cx="6" cy="12" rx="2.5" ry="6"/><path d="M6 6h12M6 18h12"/><ellipse cx="18" cy="12" rx="2.5" ry="6"/>`),
  /* A frustum: a pyramid with its top cut off. */
  frustum: line(`<path d="M8 6h8l4 13H4zM8 6l-1 13M16 6l1 13"/>`),

  /* ── chapter 4 ── */
  /* A right-angled triangle with its square corner. */
  rightTri: line(`<path d="M5 19.5V5l14.5 14.5z"/><path d="M5 16h3.5v3.5"/>`),
  /* The same, its long side drawn twice: the hypotenuse. */
  hyp: line(`<path d="M5 19.5V5l14.5 14.5z"/><path d="M7.5 4.2 20.3 17" stroke-dasharray="1.6 1.3"/><path d="M5 16h3.5v3.5"/>`),
  /* A triangle with a square on each short side. */
  pySquares: line(`<path d="M9 15V9l6 6z"/><path d="M9 15h6v6H9zM9 9H3v6h6"/><path d="m9 9 3-3 6 6-3 3"/>`),
  /* Two small squares and a plus: they make the big one. */
  pySum: line(`<path d="M3 13h5v5H3zM11 11h7v7h-7z"/><path d="M8.2 7.5h3M9.7 6v3"/><path d="M19 5.5h2.5M20.25 4.2v2.6"/>`),
  /* A big square with a small one taken out of its corner. */
  pyDiff: line(`<path d="M4 4h16v16H4z"/><path d="M4 12h8v8" stroke-dasharray="1.6 1.3"/><path d="M14.5 8h3"/>`),
  /* Short, short, long: the rule as three bars and an equals sign. */
  pyFormula: line(`<path d="M3.5 7h5M3.5 12h7M13 9.5h2.5M13 11.5h2.5M18 6v8"/><path d="M3.5 17h17"/>`),
  /* ── chapter 5 ── */
  /* A shape and a blue copy of it: object and image. */
  tfIntro: line(`<path d="M3 17l4-8 4 8z"/><path d="M13 17l4-8 4 8z" stroke-dasharray="1.6 1.2"/>`),
  /* A triangle and the same triangle slid along: an arrow between them. */
  tfTranslate: line(`<path d="M3 13l3-6 3 6z"/><path d="M15 19l3-6 3 6z"/><path d="M8 15.5l6 2.2M11.6 18.4l2.4-.7-1.5-2"/>`),
  /* A triangle, a dashed mirror, its reflection. */
  tfReflect: line(`<path d="M12 3v18" stroke-dasharray="1.8 1.4"/><path d="M9.5 7 4 16h5.5zM14.5 7 20 16h-5.5z"/>`),
  /* A curved arrow round a centre. */
  tfRotate: line(`<circle cx="12" cy="12" r=".9"/><path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M17.5 3.5v3.8h-3.8"/>`),
  /* A small square and a big one from the same corner. */
  tfScale: line(`<path d="M4 20V14h6v6zM4 20V6h14v14z"/><path d="M4 20 18 6" stroke-dasharray="1.4 1.2"/>`),
  /* Lines of writing beside a shape: say it in full. */
  tfDescribe: line(`<path d="M3 17l4-8 4 8z"/><path d="M14 8h7M14 12h7M14 16h5"/>`),

  /* ── chapter 6 ── */
  /* A circle with its centre and a radius. */
  ciParts: line(`<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r=".9"/><path d="M12 12l6-6"/>`),
  /* Two radii and the chord between them: an isosceles triangle. */
  ciIso: line(`<circle cx="12" cy="12" r="8.5"/><path d="M12 12 5 17M12 12l7 5M5 17h14"/>`),
  /* The angle at the centre and at the edge on the same arc. */
  ciCentre: line(`<circle cx="12" cy="12" r="8.5"/><path d="M6 18l6-6 6 6M6 18 12 3.5 18 18"/>`),
  /* A diameter and a point on the circle: the right angle. */
  ciSemi: line(`<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M3.5 12 16 5.2 20.5 12"/>`),
  /* Two angles on the same chord. */
  ciSame: line(`<circle cx="12" cy="12" r="8.5"/><path d="M5 16h14M5 16 8 5M19 16 8 5M5 16l11-11M19 16 16 5"/>`),
  /* A quadrilateral with its corners on the circle. */
  ciCyclic: line(`<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12-1 1.5 9-11 5z"/>`),
  /* A circle and a line touching it. */
  ciTangent: line(`<circle cx="11" cy="11" r="7.5"/><path d="M2 18.5h20"/><path d="M11 11v7.5"/>`),
  /* A chord and the line from the centre halving it. */
  ciChord: line(`<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r=".9"/><path d="M5 16h14M12 12v4"/>`),
  /* A tangent, a chord, and the angle in the other segment. */
  ciAlt: line(`<circle cx="12" cy="11" r="7.5"/><path d="M2 18.5h20M12 18.5 18.5 7.3M12 18.5 7 5.5M7 5.5l11.5 1.8"/>`),
  /* A circle and lines of writing: the reason. */
  ciReason: line(`<circle cx="7.5" cy="12" r="5"/><path d="M15 8h6M15 12h6M15 16h4"/>`),

  /* ── chapter 7 ── */
  /* A line, a ray, a segment. */
  laPaths: line(`<path d="M3 6h18M19 4.5 21 6l-2 1.5M5 4.5 3 6l2 1.5"/><path d="M4 12h16M18 10.5l2 1.5-2 1.5"/><circle cx="4" cy="12" r=".9"/><path d="M4 18h12"/><circle cx="4" cy="18" r=".9"/><circle cx="16" cy="18" r=".9"/>`),
  /* An angle with its three letters' points. */
  laName: line(`<path d="M5 19 19 19M5 19 15 6"/><path d="M9.5 19a4.5 4.5 0 0 0-1.7-3.5"/><circle cx="19" cy="19" r=".9"/><circle cx="15" cy="6" r=".9"/><circle cx="5" cy="19" r=".9"/>`),
  /* An acute arm and a reflex arc. */
  laKinds: line(`<path d="M12 12h9M12 12l6-6"/><path d="M8.5 12a3.5 3.5 0 1 0 1-2.5"/>`),
  /* A straight line with a ray off it: 180. */
  laLine: line(`<path d="M3 16h18M12 16 17 6"/><path d="M15 16a3 3 0 0 0-1.6-2.7M9 16a3 3 0 0 1 3.3-3"/>`),
  /* Rays all the way round a point: 360. */
  laPoint: line(`<path d="M12 12h9M12 12 6 5M12 12l-2 9"/><circle cx="12" cy="12" r="3"/>`),
  /* Two lines crossing, the opposite pair marked. */
  laVo: line(`<path d="M4 6 20 18M4 18 20 6"/><path d="M8.5 9.4a3.5 3.5 0 0 0 0 5.2M15.5 14.6a3.5 3.5 0 0 0 0-5.2"/>`),
  /* A right angle cut in two. */
  laComp: line(`<path d="M5 19h15M5 19V4M5 19l10-9"/><path d="M5 15.5h3.5V19"/>`),
  /* Two lines at right angles, two side by side. */
  laPerp: line(`<path d="M4 20 12 12M12 12l-6-6M14 20l7-7M14 13l7 0" /><path d="M9.2 14.8l2.8-2.8"/>`),
  /* Angles on a line written with x. */
  laAlgebra: line(`<path d="M3 17h18M12 17l4-9"/><path d="M5 11l3 3M8 11l-3 3M17 12l3 3M20 12l-3 3"/>`),
  /* Lines of writing: the reason. */
  laReason: line(`<path d="M3 17h8M7 17l3-6"/><path d="M14 8h7M14 12h7M14 16h5"/>`),

  /* Three, four and five dots in a row: a triple. */
  triples: line(`<circle cx="5" cy="6" r=".8"/><circle cx="8" cy="6" r=".8"/><circle cx="11" cy="6" r=".8"/>` +
    `<circle cx="5" cy="12" r=".8"/><circle cx="8" cy="12" r=".8"/><circle cx="11" cy="12" r=".8"/><circle cx="14" cy="12" r=".8"/>` +
    `<circle cx="5" cy="18" r=".8"/><circle cx="8" cy="18" r=".8"/><circle cx="11" cy="18" r=".8"/><circle cx="14" cy="18" r=".8"/><circle cx="17" cy="18" r=".8"/>`),
};
