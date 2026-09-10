/* ============================================================================
   Maths Workbook — angles, and a protractor to measure them with
   ----------------------------------------------------------------------------
   BOTH SCALES, ALWAYS. A real protractor carries two rings of numbers running
   opposite ways, and choosing the right one is most of the skill — it is where
   "I measured it and got 130 but the answer is 50" comes from. A teaching
   protractor printed with one scale removes the difficulty instead of teaching
   it, and then the plastic one in the pencil case is a different instrument.

   THE PROTRACTOR IS PRINTED WITH ITS CENTRE ON THE VERTEX and its baseline
   along the bottom arm, already lined up, in the exercise that is about
   READING a scale. In the exercise that is about USING a protractor it is
   printed to one side, to be cut out and laid on — because lining it up IS the
   thing being practised, and a protractor that arrives already in position has
   done it for you.

   The angle's arms always run past the rim. An arm that stops short of the
   scale asks a child to imagine where it would have crossed, which is a
   different and harder question than the one being asked.
   ========================================================================== */

const INK = "#2a2723";
const ARM = "#2a2723";
const ARC = "#c0453f";
const GLASS = "rgba(111, 183, 232, 0.16)";

const pt = (deg, r, cx, cy) => {
  const a = (-deg * Math.PI) / 180; // 0° to the right, anticlockwise like a protractor
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

/* ── one angle ─────────────────────────────────────────────────────────────*/

const ARM_MM = 25;

/**
 * An angle of `deg`, opening anticlockwise from a base arm rotated by `tilt`.
 *
 * `tilt` exists so the page is not a column of angles all sitting on a
 * horizontal line: a child who has only measured angles with one arm along the
 * bottom of the page has learned to read a protractor in one position.
 */
export function angleSvg(deg, { tilt = 0, mark = true, protractor = false, label = "", mm = 0 } = {}) {
  const R = protractor ? 26 : ARM_MM;
  const pad = protractor ? 6 : 5;
  const w = (R + pad) * 2;
  const cx = R + pad;
  const cy = R + pad;

  let body = "";

  if (protractor) body += protractorBody(cx, cy, R, tilt);

  /* the two arms, drawn over the scale so the number each points at is the
     thing being read rather than something to estimate */
  const [ax, ay] = pt(tilt, R + 3, cx, cy);
  const [bx, by] = pt(tilt + deg, R + 3, cx, cy);
  body +=
    `<line x1="${cx}" y1="${cy}" x2="${ax.toFixed(2)}" y2="${ay.toFixed(2)}" ` +
    `stroke="${ARM}" stroke-width="0.9" stroke-linecap="round"/>` +
    `<line x1="${cx}" y1="${cy}" x2="${bx.toFixed(2)}" y2="${by.toFixed(2)}" ` +
    `stroke="${ARM}" stroke-width="0.9" stroke-linecap="round"/>`;

  /* the arc that says WHICH angle is meant — the inside one, always, and a
     right angle gets the square it is entitled to */
  if (mark) {
    if (Math.abs(deg - 90) < 0.01) {
      const s = 4.2;
      const [p1x, p1y] = pt(tilt, s, cx, cy);
      const [p2x, p2y] = pt(tilt + 45, s * Math.SQRT2, cx, cy);
      const [p3x, p3y] = pt(tilt + 90, s, cx, cy);
      body +=
        `<polyline points="${p1x.toFixed(2)},${p1y.toFixed(2)} ${p2x.toFixed(2)},${p2y.toFixed(2)} ` +
        `${p3x.toFixed(2)},${p3y.toFixed(2)}" fill="none" stroke="${ARC}" stroke-width="0.8"/>`;
    } else {
      const ar = 8;
      const [sx, sy] = pt(tilt, ar, cx, cy);
      const [ex, ey] = pt(tilt + deg, ar, cx, cy);
      const big = deg > 180 ? 1 : 0;
      body +=
        `<path d="M${sx.toFixed(2)} ${sy.toFixed(2)} A${ar} ${ar} 0 ${big} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}" ` +
        `fill="none" stroke="${ARC}" stroke-width="0.8"/>`;
    }
  }

  body += `<circle cx="${cx}" cy="${cy}" r="0.9" fill="${INK}"/>`;

  /* The drawing is always the same drawing; `mm` only says how big to print
     it. The key of five named angles is a key and not five questions, so it is
     drawn at a size that fits across one line. */
  const out = mm || w;
  return (
    `<svg viewBox="0 0 ${w} ${w}" width="${out}mm" height="${out}mm" class="ma-angle" ` +
    `role="img" aria-label="${label || `An angle of ${deg} degrees`}">${body}</svg>`
  );
}

/* ── the instrument ────────────────────────────────────────────────────────*/

/** The half disc, its ticks and its two rings of numbers. */
function protractorBody(cx, cy, R, tilt) {
  const [lx, ly] = pt(tilt + 180, R, cx, cy);
  const [rx, ry] = pt(tilt, R, cx, cy);
  /* Sweep flag 1. The scale is drawn anticlockwise from the baseline (see pt),
     and in SVG's y-down coordinates that is the clockwise sweep — so flag 0
     fills the half the numbers are NOT on, which is a protractor with its
     glass on the wrong side of its own scale. */
  let body =
    `<path d="M${lx.toFixed(2)} ${ly.toFixed(2)} A${R} ${R} 0 0 1 ${rx.toFixed(2)} ${ry.toFixed(2)} Z" ` +
    `fill="${GLASS}" stroke="${INK}" stroke-width="0.6"/>`;

  for (let d = 0; d <= 180; d += 1) {
    const long = d % 10 === 0;
    const mid = d % 5 === 0;
    const inner = R - (long ? 4 : mid ? 2.6 : 1.5);
    const [x1, y1] = pt(tilt + d, R, cx, cy);
    const [x2, y2] = pt(tilt + d, inner, cx, cy);
    body +=
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" ` +
      `stroke="${INK}" stroke-width="${long ? 0.45 : 0.25}" opacity="${long ? 0.85 : 0.5}"/>`;

    if (d % 30) continue;
    /* Both rings. Outer counts up from the right, inner counts up from the
       left, exactly as the plastic one does. */
    const put = (value, radius, size) => {
      const [x, y] = pt(tilt + d, radius, cx, cy);
      return (
        `<text x="${x.toFixed(2)}" y="${(y + size * 0.34).toFixed(2)}" text-anchor="middle" ` +
        `font-family="JetBrains Mono, monospace" font-size="${size}" fill="${INK}" ` +
        `opacity="0.85">${value}</text>`
      );
    };
    /* At the two ends of the baseline both rings point along the same ray, so
       0 and 180 would sit on top of each other. Pushed further apart there. */
    const spread = d === 0 || d === 180 ? 4 : 0;
    body += put(d, R - 6.8 + spread * 0.4, 2.6);
    body += put(180 - d, R - 11 - spread, 2.3);
  }

  /* the baseline and the centre cross-hair a protractor is lined up by */
  body +=
    `<line x1="${lx.toFixed(2)}" y1="${ly.toFixed(2)}" x2="${rx.toFixed(2)}" y2="${ry.toFixed(2)}" ` +
    `stroke="${INK}" stroke-width="0.6"/>`;
  const [ux, uy] = pt(tilt + 90, 3, cx, cy);
  body += `<line x1="${cx}" y1="${cy}" x2="${ux.toFixed(2)}" y2="${uy.toFixed(2)}" stroke="${INK}" stroke-width="0.4"/>`;
  return body;
}

/**
 * A protractor on its own, to be cut out and used.
 *
 * Printed at a size that is a real instrument rather than a diagram of one —
 * a child who cuts this out can lay it on the angles on the same page.
 */
export function protractorSvg() {
  /* Big enough to be an instrument and not a diagram of one, and small enough
     that the heading carrying it still leaves room for the first question
     underneath — a page that is nothing but a heading and a protractor reads
     as a mistake even when it is not one. */
  const R = 33;
  const pad = 4;
  const w = (R + pad) * 2;
  const cx = R + pad;
  const cy = R + pad + 2;
  const body =
    protractorBody(cx, cy, R, 0) +
    `<circle cx="${cx}" cy="${cy}" r="1" fill="${INK}"/>` +
    `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
    `font-size="3" fill="${INK}" opacity="0.6">put this dot on the corner</text>`;
  return (
    `<svg viewBox="0 0 ${w} ${cy + 6}" width="${w}mm" height="${cy + 6}mm" class="ma-protractor" ` +
    `role="img" aria-label="A protractor to cut out">${body}</svg>`
  );
}

/* ── what an angle is called ───────────────────────────────────────────────*/

/**
 * The four names, by the boundaries a child is taught them with. The wording
 * is the wording: "less than a right angle", not "less than 90 degrees",
 * because the right angle is the thing they can see and the number is not.
 */
export const KINDS = [
  { id: "acute", name: "acute", says: "smaller than a right angle" },
  { id: "right", name: "right", says: "exactly a right angle — a square corner" },
  { id: "obtuse", name: "obtuse", says: "bigger than a right angle but less than a straight line" },
  { id: "straight", name: "straight", says: "exactly a straight line" },
  { id: "reflex", name: "reflex", says: "bigger than a straight line" },
];

export function kindOf(deg) {
  if (deg === 90) return "right";
  if (deg === 180) return "straight";
  if (deg < 90) return "acute";
  if (deg < 180) return "obtuse";
  return "reflex";
}

export const kindNamed = (id) => KINDS.find((k) => k.id === id);
