/* ============================================================================
   UI ICONS — the everyday controls every activity page needs
   ----------------------------------------------------------------------------
   Close, delete, undo, zoom, settings: the buttons that are not about the
   subject of a page but about working on it. They used to be drawn inline on
   each page as single-stroke line art; they are now one set, in the site's one
   icon language (utils/components/nav-icons.js): 24×24, chunky filled shapes in
   the theme's accent tokens, white only where a coloured shape encloses it, no
   hard outlines. See utils/components/workbook/icons.js for the loud/quiet rule.

   Every glyph is a function of an optional pixel size, because the pages that
   use them size their buttons differently and some size the svg by attribute.

     import { UI } from "/utils/components/ui-icons.js";
     btn.innerHTML = UI.close(15);
   ========================================================================== */

const LOUD = "var(--accent-danger)";
const QUIET = "var(--text-tertiary)";
const PAPER = "var(--accent-secondary)";
const GOLD = "var(--accent-primary)";
const LEAF = "var(--accent-success)";
const WARM = "var(--accent-warning)";

const svg = (inner) => (size) =>
  `<svg viewBox="0 0 24 24"${size ? ` width="${size}" height="${size}"` : ""} ` +
  `xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

const r = (x, y, w, h, fill, rx = 1, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${extra}/>`;

const cross = (fill = LOUD, len = 16.8, w = 2.8) =>
  r(12 - w / 2, 12 - len / 2, w, len, fill, w / 2, ` transform="rotate(45 12 12)"`) +
  r(12 - w / 2, 12 - len / 2, w, len, fill, w / 2, ` transform="rotate(-45 12 12)"`);

const lens = (inner) =>
  r(14.2, 16.4, 8, 3.4, GOLD, 1.7, ` transform="rotate(45 18.2 18.1)"`) +
  `<circle cx="10.4" cy="10.4" r="7.6" fill="${PAPER}"/>` +
  `<circle cx="10.4" cy="10.4" r="4.7" fill="#fff"/>` + inner;

export const UI = {
  close: svg(cross()),
  plus: svg(r(10.5, 4, 3, 16, LEAF, 1.5) + r(4, 10.5, 16, 3, LEAF, 1.5)),
  trash: svg(
    r(8.6, 2.4, 6.8, 2.6, LOUD, 1.3) + r(3, 5, 18, 3.2, LOUD, 1.6) +
      `<path d="M5.4 9.4h13.2l-1.1 10.4a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z" fill="${PAPER}"/>` +
      r(9.1, 11.9, 1.9, 6.2, "#fff", 0.95) + r(13, 11.9, 1.9, 6.2, "#fff", 0.95)
  ),
  undo: svg(
    `<path d="M7.6 8.6h6a5.9 5.9 0 0 1 0 11.8H9.4" fill="none" stroke="${PAPER}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M3 8.6 9.4 4.4v8.4z" fill="${LOUD}"/>`
  ),
  redo: svg(
    `<path d="M16.4 8.6h-6a5.9 5.9 0 0 0 0 11.8h4.2" fill="none" stroke="${PAPER}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M21 8.6 14.6 4.4v8.4z" fill="${LOUD}"/>`
  ),
  again: svg(
    `<path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.4" fill="none" stroke="${PAPER}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M13.6 7.2l6.4-3.4.4 6.8z" fill="${LOUD}"/>`
  ),
  zoomIn: svg(lens(r(7.6, 9.55, 5.6, 1.7, PAPER, 0.85) + r(9.55, 7.6, 1.7, 5.6, PAPER, 0.85))),
  zoomOut: svg(lens(r(7.6, 9.55, 5.6, 1.7, PAPER, 0.85))),
  /* back to the middle: a target */
  recentre: svg(
    `<circle cx="12" cy="12" r="8" fill="${PAPER}"/><circle cx="12" cy="12" r="4.6" fill="#fff"/>` +
      `<circle cx="12" cy="12" r="2.3" fill="${LOUD}"/>` +
      r(10.9, 1.6, 2.2, 3.6, PAPER, 1.1) + r(10.9, 18.8, 2.2, 3.6, PAPER, 1.1) +
      r(1.6, 10.9, 3.6, 2.2, PAPER, 1.1) + r(18.8, 10.9, 3.6, 2.2, PAPER, 1.1)
  ),
  expand: svg(
    `<path d="M3 9.4V4.6A1.6 1.6 0 0 1 4.6 3h4.8v2.8H5.8v3.6zM21 9.4V4.6A1.6 1.6 0 0 0 19.4 3h-4.8v2.8h3.6v3.6zM3 14.6v4.8A1.6 1.6 0 0 0 4.6 21h4.8v-2.8H5.8v-3.6zM21 14.6v4.8a1.6 1.6 0 0 1-1.6 1.6h-4.8v-2.8h3.6v-3.6z" fill="${PAPER}"/>`
  ),
  /* steps left: a list getting shorter */
  steps: svg(r(2.6, 4.2, 18.8, 3.6, PAPER, 1.8) + r(2.6, 10.2, 12.4, 3.6, GOLD, 1.8) + r(2.6, 16.2, 6.8, 3.6, LOUD, 1.8)),
  settings: svg(
    r(2.6, 5.6, 18.8, 3, PAPER, 1.5) + r(2.6, 15.4, 18.8, 3, GOLD, 1.5) +
      `<circle cx="15" cy="7.1" r="3" fill="${LOUD}"/><circle cx="15" cy="7.1" r="1.2" fill="#fff"/>` +
      `<circle cx="8.6" cy="16.9" r="3" fill="${LOUD}"/><circle cx="8.6" cy="16.9" r="1.2" fill="#fff"/>`
  ),
  /* a deck: one card fanned behind another */
  cards: svg(
    r(9.6, 2.6, 11.6, 15, GOLD, 1.8, ` transform="rotate(10 15.4 10.1)"`) +
      r(3, 6, 11.6, 15.4, PAPER, 1.8) + r(5.6, 9.6, 6.4, 1.8, "#fff", 0.9) + r(5.6, 13, 4.2, 1.8, "#fff", 0.9)
  ),
  edit: svg(
    `<path d="M14.6 6.2 17.8 9.4 8.4 18.8 5.2 15.6z" fill="${GOLD}"/>` +
      `<path d="M16 4.8a2.2 2.2 0 0 1 3.2 3.2l-1.4 1.4-3.2-3.2z" fill="${LOUD}"/>` +
      `<path d="M5.2 15.6 8.4 18.8 3.6 20.4z" fill="${WARM}"/>`
  ),
  /* draw this: a pen held to the page */
  draw: svg(
    r(3.4, 8, 17.2, 12, PAPER, 3) + r(7.2, 12.2, 9.6, 1.8, "#fff", 0.9) + r(7.2, 15.4, 6, 1.8, "#fff", 0.9) +
      r(10.9, 3.4, 2.2, 5.2, QUIET, 1.1) + `<circle cx="12" cy="3" r="1.8" fill="${LOUD}"/>`
  ),
  /* the swatch that means "no colour": a slash across an empty well */
  noFill: svg(`<circle cx="12" cy="12" r="8.4" fill="#fff"/>` + r(10.8, 2.4, 2.4, 19.2, LOUD, 1.2, ` transform="rotate(45 12 12)"`)),
  /* two arrows passing: swap the order */
  upDown: svg(
    r(6.8, 7, 2.4, 13.4, PAPER, 1.2) + `<path d="M3.2 9.2 8 3.4l4.8 5.8z" fill="${LOUD}"/>` +
      r(14.8, 3.6, 2.4, 13.4, GOLD, 1.2) + `<path d="M11.2 14.8h9.6L16 20.6z" fill="${LOUD}"/>`
  ),
  /* a star, lit or not — for a rating, so both states must read */
  star: (on) => svg(
    `<path d="M12 2.6l2.6 5.35 5.9.85-4.27 4.16 1.01 5.88L12 16.13l-5.24 2.76 1.01-5.88L3.5 8.8l5.9-.85z" fill="${on ? GOLD : QUIET}"${on ? "" : ' opacity="0.45"'}/>` +
      (on ? `<circle cx="12" cy="10.4" r="1.9" fill="#fff" opacity="0.85"/>` : "")
  ),
};

/* ── the Learning Tools' own controls ─────────────────────────────────────
   Cartesian Art, the Writing Evaluator, Theory Practice and the flashcards.
   Named by what the button DOES, so two tools pressing the same kind of
   button get the same glyph. */

const tri = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
const dot = (x, y, rr, fill) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${fill}"/>`;
function bar(x1, y1, x2, y2, w, fill) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    `<rect x="${(cx - len / 2).toFixed(2)}" y="${(cy - w / 2).toFixed(2)}" width="${len.toFixed(2)}" ` +
    `height="${w}" rx="${w / 2}" fill="${fill}" transform="rotate(${ang.toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)})"/>`
  );
}
/* a block arrow drawn pointing up, then turned to face its way */
const arrow = (turn) =>
  `<g transform="rotate(${turn} 12 12)">${r(10.6, 9, 2.8, 12, PAPER, 1.4)}${tri("M12 2.6 19.4 11H4.6z", LOUD)}</g>`;
/* a filled chevron drawn pointing right, then turned */
const chevron = (turn) =>
  `<g transform="rotate(${turn} 12 12)"><path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="${PAPER}"/></g>`;
const axes = () => r(3, 3, 2.4, 18.4, QUIET, 1.2) + r(3, 19, 18.4, 2.4, QUIET, 1.2);
const circleArrow = (mirror) =>
  `<g${mirror ? ' transform="matrix(-1 0 0 1 24 0)"' : ""}>` +
  `<path d="M5 13.4a7.4 7.4 0 1 0 2.4-6.2" fill="none" stroke="${PAPER}" stroke-width="3.2" stroke-linecap="round"/>` +
  tri("M2.8 3.4 9.4 5.2 4.2 10.4z", LOUD) + `</g>`;
const spokes = (fill, y = 1.6, h = 4.4, w = 2.8) =>
  [0, 45, 90, 135, 180, 225, 270, 315]
    .map((d) => r(12 - w / 2, y, w, h, fill, 1.2, ` transform="rotate(${d} 12 12)"`)).join("");

Object.assign(UI, {
  /* moving about */
  arrowUp: svg(arrow(0)),
  arrowRight: svg(arrow(90)),
  arrowDown: svg(arrow(180)),
  arrowLeft: svg(arrow(270)),
  chevronRight: svg(chevron(0)),
  chevronDown: svg(chevron(90)),
  chevronLeft: svg(chevron(180)),
  chevronUp: svg(chevron(270)),
  /* four ways at once */
  move: svg(
    r(10.8, 5, 2.4, 14, PAPER, 1.2) + r(5, 10.8, 14, 2.4, PAPER, 1.2) +
      tri("M12 1.6 15.6 6H8.4z", LOUD) + tri("M12 22.4 8.4 18h7.2z", LOUD) +
      tri("M1.6 12 6 8.4v7.2z", LOUD) + tri("M22.4 12 18 15.6V8.4z", LOUD)
  ),
  hand: svg(
    tri("M8.4 11.6V5.9a1.6 1.6 0 0 1 3.2 0v4.6a1.6 1.6 0 0 1 3.1 0v.8a1.6 1.6 0 0 1 3.1 0v3.9a5.8 5.8 0 0 1-5.8 5.8h-.8a5.2 5.2 0 0 1-4.5-2.6l-2.3-3.9a1.6 1.6 0 0 1 2.6-1.8z", PAPER)
  ),
  shrink: svg(
    tri("M9.4 3v4.8A1.6 1.6 0 0 1 7.8 9.4H3V6.6h3.6V3zM14.6 3v4.8a1.6 1.6 0 0 0 1.6 1.6H21V6.6h-3.6V3zM9.4 21v-4.8a1.6 1.6 0 0 0-1.6-1.6H3v2.8h3.6V21zM14.6 21v-4.8a1.6 1.6 0 0 1 1.6-1.6H21v2.8h-3.6V21z", LOUD)
  ),
  menu: svg(r(3, 4.6, 18, 3.2, PAPER, 1.6) + r(3, 10.4, 18, 3.2, GOLD, 1.6) + r(3, 16.2, 18, 3.2, LEAF, 1.6)),

  /* the plane */
  plot: svg(axes() + dot(9, 14.6, 2.2, LOUD) + dot(14, 9.6, 2.2, GOLD) + dot(19, 6, 2.2, PAPER)),
  plotPlus: svg(axes() + r(12.8, 5, 2.8, 11.4, LOUD, 1.4) + r(8.5, 9.3, 11.4, 2.8, LOUD, 1.4)),
  quadrant: svg(r(6.4, 3, 14.6, 15.6, PAPER, 1.6) + r(4, 3, 2.4, 18, QUIET, 1.2) + r(4, 18.6, 17, 2.4, QUIET, 1.2) + dot(13.4, 10.8, 2.2, LOUD)),
  gridlines: svg(
    r(3, 3, 18, 18, PAPER, 2) + r(8.4, 3, 1.4, 18, "#fff", 0) + r(14.2, 3, 1.4, 18, "#fff", 0) +
      r(3, 8.4, 18, 1.4, "#fff", 0) + r(3, 14.2, 18, 1.4, "#fff", 0)
  ),
  crosshair: svg(
    dot(12, 12, 6.4, PAPER) + dot(12, 12, 3.2, "#fff") + dot(12, 12, 1.6, LOUD) +
      r(10.8, 1.6, 2.4, 4.4, LOUD, 1.2) + r(10.8, 18, 2.4, 4.4, LOUD, 1.2) +
      r(1.6, 10.8, 4.4, 2.4, LOUD, 1.2) + r(18, 10.8, 4.4, 2.4, LOUD, 1.2)
  ),
  /* put a point down: a dot in a ring */
  dropPoint: svg(dot(12, 12, 8.6, PAPER) + dot(12, 12, 5.6, "#fff") + dot(12, 12, 3.4, LOUD)),
  /* the analogue stick */
  stick: svg(dot(12, 12, 9, PAPER) + dot(12, 12, 4, GOLD) + dot(12, 12, 1.6, "#fff")),
  /* steering: the pad and its cross */
  steer: svg(dot(12, 12, 9.4, PAPER) + r(10.8, 5.6, 2.4, 12.8, "#fff", 1.2) + r(5.6, 10.8, 12.8, 2.4, "#fff", 1.2) + dot(12, 12, 2.6, LOUD)),
  layers: svg(tri("M12 11.6 21.4 16.4 12 21.2 2.6 16.4z", GOLD) + tri("M12 2.8 21.4 7.6 12 12.4 2.6 7.6z", PAPER)),
  shapes: svg(r(3, 3.4, 8, 8, GOLD, 1.8) + dot(17, 7.4, 4, PAPER) + tri("M7.5 12.5l4.5 8h-9z", LOUD) + r(13.4, 13, 7.6, 7.6, LEAF, 1.8)),
  lineColour: svg(bar(4.6, 19.4, 19.4, 4.6, 2.8, PAPER) + dot(4.6, 19.4, 2.8, LOUD) + dot(19.4, 4.6, 2.8, LOUD)),
  bucket: svg(
    tri("M9.2 3.2 18.4 12.4 11.6 19.2a2.8 2.8 0 0 1-4 0L2.8 14.4a2.8 2.8 0 0 1 0-4z", PAPER) +
      tri("M4.4 12.4h14L11.6 19.2a2.8 2.8 0 0 1-4 0z", GOLD) +
      tri("M20.2 14.6s2.2 2.8 2.2 4.4a2.2 2.2 0 0 1-4.4 0c0-1.6 2.2-4.4 2.2-4.4z", LOUD)
  ),
  brush: svg(
    tri("M13.4 6.6 17 3a2.8 2.8 0 0 1 4 4l-3.6 3.6z", GOLD) + tri("M6.4 14.6 13.4 7.6l3 3-7 7z", WARM) + tri("M6.4 14.6 9.4 17.6 3 20.6z", LOUD)
  ),
  eraser: svg(
    tri("M4.2 13.4 11.6 6a1.8 1.8 0 0 1 2.5 0l4.9 4.9a1.8 1.8 0 0 1 0 2.5L14 18.4H9.2z", LOUD) +
      tri("M8 9.6 14.4 16 12 18.4H9.2l-5-5z", PAPER) + r(9.2, 19.4, 11.6, 2, QUIET, 1)
  ),
  /* a shape joined back to where it began */
  loop: svg(tri("M12 2.8 20 7.6v7.2L12 21.2 4 14.8V7.6z", PAPER) + dot(12, 2.8, 2.2, LOUD) + dot(20, 7.6, 2, GOLD) + dot(4, 7.6, 2, GOLD)),
  transform: svg(
    r(3, 3, 8.2, 8.2, PAPER, 1.6) +
      r(15.2, 3.4, 2.4, 8, GOLD, 1.2) + r(12.4, 6.2, 8, 2.4, GOLD, 1.2) +
      r(15.2, 13.4, 2.4, 6, LOUD, 1.2) + tri("M12.6 18.4h7.6L16.4 22z", LOUD) +
      r(4.4, 13.4, 2.4, 8, LEAF, 1.2) + r(1.6, 16.2, 8, 2.4, LEAF, 1.2)
  ),
  slide: svg(
    r(8.6, 8.6, 6.8, 6.8, GOLD, 1.4) +
      r(10.8, 1.6, 2.4, 4.4, PAPER, 1.2) + r(10.8, 18, 2.4, 4.4, PAPER, 1.2) +
      r(1.6, 10.8, 4.4, 2.4, PAPER, 1.2) + r(18, 10.8, 4.4, 2.4, PAPER, 1.2)
  ),
  reflectY: svg(r(10.9, 2, 2.2, 20, LOUD, 1.1) + tri("M2.4 12 8.4 6.8v10.4z", PAPER) + tri("M21.6 12 15.6 17.2V6.8z", GOLD)),
  reflectX: svg(r(2, 10.9, 20, 2.2, LOUD, 1.1) + tri("M12 2.4 17.2 8.4H6.8z", PAPER) + tri("M12 21.6 6.8 15.6h10.4z", GOLD)),
  rotateLeft: svg(circleArrow(false)),
  rotateRight: svg(circleArrow(true)),
  half: svg(r(3.4, 3.4, 17.2, 17.2, PAPER, 3) + r(7, 10.6, 10, 2.8, "#fff", 1.4)),
  double: svg(r(3.4, 3.4, 17.2, 17.2, GOLD, 3) + r(7, 10.6, 10, 2.8, "#fff", 1.4) + r(10.6, 7, 2.8, 10, "#fff", 1.4)),
  brightness: svg(spokes(GOLD, 1.4, 3.8, 2.2) + dot(12, 12, 5.4, GOLD) + dot(12, 12, 2.4, "#fff")),
  droplet: svg(
    tri("M12 2.4s7.4 7.4 7.4 12.6a7.4 7.4 0 0 1-14.8 0C4.6 9.8 12 2.4 12 2.4z", PAPER) +
      `<path d="M8.4 14.6a3.6 3.6 0 0 0 3.6 3.6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`
  ),
  /* drawing on from where the last point landed, or from the origin each time */
  relative: svg(bar(5, 19, 11, 11, 2.2, QUIET) + bar(11, 11, 19, 5, 2.2, QUIET) + dot(5, 19, 2.2, PAPER) + dot(11, 11, 2.4, GOLD) + dot(19, 5, 2.4, LOUD)),
  absolute: svg(bar(5, 19, 11, 11, 2.2, QUIET) + bar(5, 19, 19, 5, 2.2, QUIET) + dot(5, 19, 2.8, LOUD) + dot(11, 11, 2.2, GOLD) + dot(19, 5, 2.2, GOLD)),

  /* files and sharing */
  print: svg(
    r(6.8, 2.6, 10.4, 5.8, PAPER, 1.3) + r(2.6, 8.2, 18.8, 7.8, GOLD, 2.2) + dot(18.2, 12, 1.2, "#fff") +
      r(6.8, 13.6, 10.4, 7.8, WARM, 1.3) + r(8.6, 16.2, 6.8, 1.3, "#fff", 0.65) + r(8.6, 18.5, 4.4, 1.3, "#fff", 0.65)
  ),
  save: svg(
    tri("M3.4 5.4a2 2 0 0 1 2-2h11l4.2 4.2v11a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2z", PAPER) +
      r(7, 3.4, 8.4, 5.6, "#fff", 0.8) + r(12.4, 4.4, 2, 3.6, PAPER, 0.5) + r(6.6, 13, 10.8, 7.6, GOLD, 1)
  ),
  download: svg(r(10.8, 2.6, 2.4, 10, PAPER, 1.2) + tri("M6 10.8h12L12 17.2z", LOUD) + r(3.4, 18.6, 17.2, 2.8, GOLD, 1.4)),
  share: svg(
    r(10.8, 7, 2.4, 10, PAPER, 1.2) + tri("M6 8.6h12L12 2.2z", LOUD) +
      tri("M3.4 14.4h2.8v4.2h11.6v-4.2h2.8v5.4a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z", GOLD)
  ),
  copy: svg(
    r(8.6, 8.6, 12.4, 12.4, PAPER, 2.2) +
      tri("M5 15.4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.4a2 2 0 0 1 2 2v1.6h-2.6V5.6H5.6v7.2h1.4v2.6z", GOLD)
  ),
  link: svg(
    tri("M11.4 7.4 13.2 5.6a3.9 3.9 0 0 1 5.5 5.5l-1.8 1.8-2-2 1.8-1.8a1.1 1.1 0 0 0-1.5-1.5l-1.8 1.8z", PAPER) +
      tri("M12.6 16.6 10.8 18.4a3.9 3.9 0 0 1-5.5-5.5l1.8-1.8 2 2-1.8 1.8a1.1 1.1 0 0 0 1.5 1.5l1.8-1.8z", PAPER) +
      bar(9.4, 14.6, 14.6, 9.4, 2.6, LOUD)
  ),
  image: svg(
    r(2.6, 3.4, 18.8, 17.2, PAPER, 2) + dot(8.2, 9, 2.2, GOLD) +
      tri("M2.6 18.6 9.2 12l3.6 3.6 3.2-3.2 5.4 5.4v.8a1.6 1.6 0 0 1-1.6 1.6H4.2a1.6 1.6 0 0 1-1.6-1.6z", LEAF)
  ),
  puzzles: svg(r(3, 3, 8, 8, PAPER, 1.6) + r(13, 3, 8, 8, GOLD, 1.6) + r(3, 13, 8, 8, LEAF, 1.6) + r(13, 13, 8, 8, LOUD, 1.6)),
  video: svg(r(2.2, 4.6, 19.6, 14.8, PAPER, 2.4) + tri("M9.6 8.4v7.2l6-3.6z", "#fff")),

  /* the AI and PrepBot */
  sparkle: svg(tri("M11 2.4l1.9 5 5 1.9-5 1.9-1.9 5-1.9-5-5-1.9 5-1.9z", GOLD) + tri("M18 13.4l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z", LOUD)),
  bot: svg(
    r(3.4, 8, 17.2, 12, PAPER, 3) + dot(9, 13.4, 1.8, "#fff") + dot(15, 13.4, 1.8, "#fff") +
      r(9, 16.6, 6, 1.6, "#fff", 0.8) + r(10.9, 3.4, 2.2, 5.2, QUIET, 1.1) + dot(12, 3, 1.8, LOUD)
  ),
  gear: svg(spokes(PAPER) + dot(12, 12, 6.6, PAPER) + dot(12, 12, 3.4, "#fff") + dot(12, 12, 1.7, LOUD)),
  bolt: svg(tri("M13.6 1.8 4.2 13.8h6.4l-1.2 8.4 10.4-12.4h-6.4z", GOLD)),
  play: svg(tri("M6.6 3.8 20.4 12 6.6 20.2z", LEAF)),
  /* a sheet with lines: coach, notes */
  doc: svg(
    tri("M4 4.4a2 2 0 0 1 2-2h8.4L20 8v11.6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z", PAPER) +
      tri("M14.4 2.4 20 8h-4.4a1.2 1.2 0 0 1-1.2-1.2z", GOLD) +
      r(7.4, 11.4, 9, 1.8, "#fff", 0.9) + r(7.4, 15, 6, 1.8, "#fff", 0.9)
  ),

  /* marking and states */
  check: svg(
    dot(12, 12, 9.6, LEAF) +
      `<path d="M7.4 12.4l3 3 6.2-6.7" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  /* a checklist item not yet done: the same badge, empty */
  open: svg(`<circle cx="12" cy="12" r="8.6" fill="${QUIET}" opacity="0.35"/>` + dot(12, 12, 5.6, "#fff")),
  task: svg(
    r(3, 3.4, 17.6, 17.6, PAPER, 3) +
      `<path d="M7.4 12.4l3 3 6.8-7.4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      dot(19.4, 4.6, 2.8, LOUD)
  ),
  /* busy: a ring with a coloured arc (the page spins it) */
  busy: svg(
    `<circle cx="12" cy="12" r="8.4" fill="none" stroke="${QUIET}" stroke-width="3.2" opacity="0.35"/>` +
      `<path d="M12 3.6a8.4 8.4 0 0 1 8.4 8.4" fill="none" stroke="${LOUD}" stroke-width="3.2" stroke-linecap="round"/>`
  ),
  bulb: svg(
    tri("M12 2.4a6.6 6.6 0 0 1 3.9 11.9c-.5.4-.8.9-.8 1.5H8.9c0-.6-.3-1.1-.8-1.5A6.6 6.6 0 0 1 12 2.4z", GOLD) +
      `<path d="M10.3 6.1A3.4 3.4 0 0 1 13 5.4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none"/>` +
      r(9.1, 16.4, 5.8, 1.9, WARM, 0.95) + tri("M9.9 18.7h4.2v.5a1.5 1.5 0 0 1-1.5 1.5h-1.2a1.5 1.5 0 0 1-1.5-1.5z", WARM)
  ),
  swap: svg(r(3.4, 6.6, 14.4, 2.6, PAPER, 1.3) + tri("M14.6 4.2 20.6 7.9l-6 3.7z", LOUD) + r(6.2, 14.8, 14.4, 2.6, GOLD, 1.3) + tri("M9.4 12.4 3.4 16.1l6 3.7z", LOUD)),
  refresh: svg(
    `<path d="M4.6 10A7.8 7.8 0 0 1 18 6.4" fill="none" stroke="${PAPER}" stroke-width="3" stroke-linecap="round"/>` + tri("M21.2 3.2 20.6 10l-6.4-2.4z", LOUD) +
      `<path d="M19.4 14A7.8 7.8 0 0 1 6 17.6" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` + tri("M2.8 20.8 3.4 14l6.4 2.4z", LOUD)
  ),
  /* writing */
  pen: svg(
    tri("M14.6 6.2 17.8 9.4 8.4 18.8 5.2 15.6z", GOLD) + tri("M16 4.8a2.2 2.2 0 0 1 3.2 3.2l-1.4 1.4-3.2-3.2z", LOUD) +
      tri("M5.2 15.6 8.4 18.8 3.6 20.4z", WARM) + r(12, 19, 9.4, 2.4, QUIET, 1.2)
  ),
  lines: svg(r(3, 4.6, 12, 3, PAPER, 1.5) + r(3, 10.5, 18, 3, PAPER, 1.5) + r(3, 16.4, 14.6, 3, GOLD, 1.5)),
  /* a model answer: lines, and the pen writing them */
  model: svg(r(2.6, 3.8, 11, 2.8, PAPER, 1.4) + r(2.6, 9, 17, 2.8, PAPER, 1.4) + r(2.6, 14.2, 8.4, 2.8, GOLD, 1.4) + bar(14.4, 20.6, 20.6, 14.4, 2.8, LOUD)),
  /* submit and grade: the letter mark, and the tick */
  grade: svg(
    tri("M2.6 18.4 6.6 5.4h2.8l4 13h-2.8l-.9-3H6.3l-.9 3zM7 13h2.9L8.5 8.2z", PAPER) + dot(17.4, 16.4, 5.2, LEAF) +
      `<path d="M15 16.6l1.6 1.6 3.2-3.4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
  ),
  book: svg(
    tri("M2.4 4.4a1.4 1.4 0 0 1 1.4-1.4H9a3 3 0 0 1 3 3V21a2.4 2.4 0 0 0-2.4-2.4H3.8a1.4 1.4 0 0 1-1.4-1.4z", PAPER) +
      tri("M21.6 4.4A1.4 1.4 0 0 0 20.2 3H15a3 3 0 0 0-3 3V21a2.4 2.4 0 0 1 2.4-2.4h5.8a1.4 1.4 0 0 0 1.4-1.4z", GOLD)
  ),
  userPlus: svg(
    dot(9, 7.6, 3.8, PAPER) + tri("M2.4 20.6c0-4.2 3-6.8 6.6-6.8s6.6 2.6 6.6 6.8z", PAPER) +
      r(17.9, 7.6, 2.4, 9, LEAF, 1.2) + r(14.6, 10.9, 9, 2.4, LEAF, 1.2)
  ),
  anchor: svg(dot(12, 5, 3.2, PAPER) + dot(12, 5, 1.3, "#fff") + r(10.8, 7.6, 2.4, 14, PAPER, 1.2) + tri("M2.4 12.4h3a6.6 6.6 0 0 0 13.2 0h3a9.6 9.6 0 0 1-19.2 0z", GOLD)),
  speech: svg(
    tri("M3.4 5.6a2 2 0 0 1 2-2h13.2a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2h-8l-4.8 4v-4h-.4a2 2 0 0 1-2-2z", PAPER) +
      r(6.2, 7.2, 11.6, 1.8, "#fff", 0.9) + r(6.2, 10.6, 7.2, 1.8, "#fff", 0.9)
  ),
  eye: svg(tri("M1.8 12S5.6 4.8 12 4.8 22.2 12 22.2 12 18.4 19.2 12 19.2 1.8 12 1.8 12z", PAPER) + dot(12, 12, 4.4, "#fff") + dot(12, 12, 2.3, LOUD)),
  target: svg(dot(12, 12, 9.6, LOUD) + dot(12, 12, 6.6, "#fff") + dot(12, 12, 3.6, LOUD) + dot(12, 12, 1.4, "#fff")),
});

export default UI;
