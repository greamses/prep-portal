/* ============================================================================
   Geometry Workbook — drawing for CONSTRUCTIONS (chapter 8)
   ----------------------------------------------------------------------------
   Everything here is drawn at TRUE SIZE: one unit of the drawing is one
   millimetre of paper. A construction is checked by measuring it, so a line
   printed "6 cm" has to BE six centimetres under a ruler, and an angle printed
   as 70° has to be 70° under a protractor. Nothing is fitted to a box.

   Angles are in degrees, 0 along the page to the right and counting ANTI-
   clockwise, the way a protractor is read — the drawing turns that into the
   page's downward y.

   The labelled points are written into `data-pts`, which is what the
   workbook's instruments snap to: a compass needle let go near A lands ON A.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8a837a";
const RED = "#c0453f";
const f = (n) => (+n).toFixed(2);

export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;

/** The point r mm from c in direction d (degrees, anticlockwise from the right). */
export const at = (c, r, d) => [c[0] + r * Math.cos(rad(d)), c[1] - r * Math.sin(rad(d))];

/** The direction from p to q, in the same degrees. */
export const dirTo = (p, q) => (deg(Math.atan2(p[1] - q[1], q[0] - p[0])) + 360) % 360;

export const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);

/**
 * Where two circles cross. `upper` picks the crossing higher on the page
 * (smaller y); otherwise the lower one. Null when they do not meet.
 */
export function crossing(c1, r1, c2, r2, upper = true) {
  const d = dist(c1, c2);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null;
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const ux = (c2[0] - c1[0]) / d;
  const uy = (c2[1] - c1[1]) / d;
  const m = [c1[0] + a * ux, c1[1] + a * uy];
  const p = [m[0] - h * uy, m[1] + h * ux];
  const q = [m[0] + h * uy, m[1] - h * ux];
  return (p[1] < q[1]) === upper ? p : q;
}

/* ── the pieces ────────────────────────────────────────────────────────────*/

const seg = (p, q, { w = 0.5, col = INK, dash = "" } = {}) =>
  `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

/** An arc about c, radius r, from direction a0 turning anticlockwise to a1. */
function arcPath(c, r, a0, a1, { w = 0.35, col = GREY } = {}) {
  const sweep = (((a1 - a0) % 360) + 360) % 360;
  if (sweep === 0 || sweep >= 359.9) {
    return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
  }
  const s = at(c, r, a0);
  const e = at(c, r, a1);
  return `<path d="M${f(s[0])} ${f(s[1])}A${f(r)} ${f(r)} 0 ${sweep > 180 ? 1 : 0} 0 ${f(e[0])} ${f(e[1])}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
}

const SIDE = { above: [0, -2.6], below: [0, 5.2], left: [-3.2, 1.3], right: [3.2, 1.3] };

function dot(p, label = "", where = "below") {
  const [dx, dy] = SIDE[where] || SIDE.below;
  const anchor = where === "left" ? "end" : where === "right" ? "start" : "middle";
  return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="0.75" fill="${INK}"/>` +
    (label
      ? `<text x="${f(p[0] + dx)}" y="${f(p[1] + dy)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="700" fill="${INK}">${label}</text>`
      : "");
}

/** A small red angle mark at v between directions a0 and a1, with its size written by it. */
function mark(v, a0, a1, label = "", r = 7) {
  const sweep = (((a1 - a0) % 360) + 360) % 360;
  const mid = a0 + sweep / 2;
  const t = at(v, r + 4.2, mid);
  return arcPath(v, r, a0, a1, { w: 0.45, col: RED }) +
    (label
      ? `<text x="${f(t[0])}" y="${f(t[1] + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3" fill="${RED}">${label}</text>`
      : "");
}

/**
 * A construction space: a box of paper w × h mm with a dotted edge, and what
 * is given already drawn in it.
 *
 *   parts   { seg: [p, q, opts] } · { arc: [c, r, a0, a1, opts] } ·
 *           { dot: [p, label, where] } · { mark: [v, a0, a1, label] }
 *   snap    points the instruments may snap to
 */
export function space({ w = 150, h = 80, parts = [], snap = [], label = "Construction space" }) {
  let body = `<rect x="0.3" y="0.3" width="${f(w - 0.6)}" height="${f(h - 0.6)}" rx="1.5" fill="none" stroke="${GREY}" stroke-width="0.3" stroke-dasharray="1 1.4"/>`;
  parts.forEach((pt) => {
    if (pt.seg) body += seg(...pt.seg);
    if (pt.arc) body += arcPath(...pt.arc);
    if (pt.mark) body += mark(...pt.mark);
  });
  /* the dots last, over every line that meets them */
  parts.forEach((pt) => { if (pt.dot) body += dot(...pt.dot); });
  const pts = snap.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
  return `<svg class="co-space" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" role="img" aria-label="${label}"${pts ? ` data-pts="${pts}"` : ""}>${body}</svg>`;
}

/** Centimetres as they are written on the paper: 6 cm, 6.5 cm. */
export const cm = (mm) => {
  const v = Math.round(mm) / 10;
  return `${Number.isInteger(v) ? v : v.toFixed(1)} cm`;
};
