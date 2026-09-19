/* ============================================================================
   Statistics Workbook — the drawings for CHAPTER 4, pie charts and proportion
   ----------------------------------------------------------------------------
     sliceSvg     a circle cut into equal slices, each a part to colour — the
                  concrete start: a share of a whole
     hundredSvg   a hundred-square coloured in blocks — a share out of 100 is a
                  percentage
     pieSvg       a pie chart: each slice drawn at its angle (clockwise from
                  twelve o'clock), with a key beside it; a slice can say its
                  angle, its percentage or its fraction. With `build`, an empty
                  circle with its first radius ruled and a snap point on the rim
                  every few degrees, so on screen a child rules each radius with
                  the workbook's own ruler (want.draw) — point 0 is the centre,
                  point j the rim at j × step degrees

   Millimetres at the paper's own size.
   ========================================================================== */

import { FILLS } from "./barart.js";

const INK = "#2a2723";
const GREY = "#8a837a";

const f = (n) => (+n).toFixed(2);
const text = (x, y, t, { size = 3.1, col = INK, weight = 700, anchor = "middle" } = {}) =>
  `<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}">${t}</text>`;
const svg = (w, h, body, aria, extra = "") =>
  `<svg class="sw-fig" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}mm" height="${f(h)}mm" role="img" aria-label="${aria}"${extra}>${body}</svg>`;

/** The point on a circle at `deg` degrees clockwise from twelve o'clock. */
const rim = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

/** A slice from `a` to `b` degrees. */
function sector(cx, cy, r, a, b) {
  if (b - a >= 359.999) return `M${f(cx)} ${f(cy - r)}A${f(r)} ${f(r)} 0 1 1 ${f(cx - 0.001)} ${f(cy - r)}Z`;
  const [x1, y1] = rim(cx, cy, r, a);
  const [x2, y2] = rim(cx, cy, r, b);
  return `M${f(cx)} ${f(cy)}L${f(x1)} ${f(y1)}A${f(r)} ${f(r)} 0 ${b - a > 180 ? 1 : 0} 1 ${f(x2)} ${f(y2)}Z`;
}

/* ── a circle cut into equal slices ─────────────────────────────────────── */

/** `n` equal slices, blank, each one a part to colour; `shaded` of them already coloured. */
export function sliceSvg(n, { r = 15, shaded = 0 } = {}) {
  const c = r + 1.5;
  let body = "";
  for (let i = 0; i < n; i++) {
    const on = i < shaded;
    body += `<path d="${sector(c, c, r, (i * 360) / n, ((i + 1) * 360) / n)}" fill="${on ? FILLS[0] : "#ffffff"}" stroke="${INK}" stroke-width="0.4"${on ? "" : ` data-part="${i}"`}/>`;
  }
  return svg(2 * c, 2 * c, body, `A circle cut into ${n} equal slices`);
}

/* ── a hundred-square ───────────────────────────────────────────────────── */

/** 10 × 10 squares coloured row by row: `counts` squares of each colour, the rest white. */
export function hundredSvg(counts, { size = 4.2 } = {}) {
  const x0 = 1;
  let body = "";
  let k = 0;
  const colourAt = [];
  counts.forEach((c, j) => { for (let i = 0; i < c; i++) colourAt.push(FILLS[j % FILLS.length]); });
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      body += `<rect x="${f(x0 + col * size)}" y="${f(x0 + row * size)}" width="${f(size)}" height="${f(size)}" fill="${colourAt[k] || "#ffffff"}" stroke="${INK}" stroke-width="0.25"/>`;
      k++;
    }
  }
  body += `<rect x="${x0}" y="${x0}" width="${f(10 * size)}" height="${f(10 * size)}" fill="none" stroke="${INK}" stroke-width="0.5"/>`;
  return svg(10 * size + 2, 10 * size + 2, body, "A hundred-square");
}

/** A swatch of a slice's colour, for a key written in the text. */
export const swatch = (j) =>
  `<svg class="sw-icon" viewBox="0 0 4 4" width="4mm" height="4mm" aria-hidden="true"><rect x="0.3" y="0.3" width="3.4" height="3.4" rx="0.5" fill="${FILLS[j % FILLS.length]}" stroke="${INK}" stroke-width="0.3"/></svg>`;

/* ── a pie chart ────────────────────────────────────────────────────────── */

/** The rim points of a pie to BUILD: the centre, then every `step` degrees. */
export const pieBuildCount = (step) => Math.round(360 / step);

/**
 *   angles    each slice's angle, in order clockwise from twelve o'clock
 *   names     for the key (none: no key)
 *   show      what each slice says on it: "angle", "percent", "fraction", or
 *             an array of labels, or "" for nothing
 *   title
 *   build     { step } — an empty circle to rule the radii on
 *   r         the radius
 */
export function pieSvg({ angles = [], names = [], show = "", title = "", build = null, r = 20, key = true }) {
  const T = title ? 7 : 1.5;
  const cx = r + 3;
  const cy = T + r + 1.5;
  const keyW = key && names.length ? 6 + Math.max(...names.map((n) => n.length)) * 1.85 + 6 : 0;
  const W = 2 * r + 6 + keyW;
  const H = Math.max(cy + r + 3, T + names.length * 6 + 2);
  /* the title over the circle, not the middle of circle-and-key: on screen the
     drawing bar sits top right */
  let body = title ? text(Math.max(cx, title.length * 1.05 + 1), 3.2, title, { size: 3.4 }) : "";

  if (build) {
    const n = pieBuildCount(build.step);
    body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#ffffff" stroke="${INK}" stroke-width="0.5"/>`;
    for (let j = 0; j < n; j++) {
      /* a short tick on the rim at every snap point, a longer one at each quarter */
      const a = rim(cx, cy, r, j * build.step);
      const inner = rim(cx, cy, (j * build.step) % 90 === 0 ? r - 2.2 : r - 1.2, j * build.step);
      body += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(inner[0])}" y2="${f(inner[1])}" stroke="${GREY}" stroke-width="0.25"/>`;
    }
    body += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(cx)}" y2="${f(cy - r)}" stroke="${INK}" stroke-width="0.5"/>`;
    body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="0.7" fill="${INK}"/>`;
  } else {
    let a = 0;
    angles.forEach((ang, j) => {
      body += `<path d="${sector(cx, cy, r, a, a + ang)}" fill="${FILLS[j % FILLS.length]}" stroke="${INK}" stroke-width="0.4"/>`;
      a += ang;
    });
    a = 0;
    angles.forEach((ang, j) => {
      const label = Array.isArray(show) ? show[j]
        : show === "angle" ? `${+ang.toFixed(1)}°`
          : show === "percent" ? `${+((ang / 360) * 100).toFixed(1)}%`
            : show === "fraction" ? fracOf(ang / 360) : "";
      if (label) {
        const inside = ang >= 34;
        const [lx, ly] = rim(cx, cy, inside ? r * 0.6 : r + 4.2, a + ang / 2);
        body += text(lx, ly, label, { size: inside ? 3.1 : 2.8 });
      }
      a += ang;
    });
  }

  if (key && names.length) {
    const kx = 2 * r + 8;
    names.forEach((n, j) => {
      const y = T + 3 + j * 6;
      body += build ? "" : `<rect x="${f(kx)}" y="${f(y - 1.8)}" width="3.6" height="3.6" rx="0.5" fill="${FILLS[j % FILLS.length]}" stroke="${INK}" stroke-width="0.3"/>`;
      body += text(kx + (build ? 0 : 5.2), y, n, { size: 3, weight: 600, anchor: "start" });
    });
  }

  let attrs = "";
  if (build) {
    const pts = [[cx, cy], ...Array.from({ length: pieBuildCount(build.step) }, (_, j) => rim(cx, cy, r, j * build.step))];
    attrs = ` data-pts="${pts.map((p) => p.map(f).join(",")).join(" ")}"`;
  }
  return svg(W, H, body, title || "A pie chart", attrs);
}

/** A share of a whole as a fraction in its lowest terms: 0.25 → 1/4. */
export function fracOf(x) {
  for (let d = 1; d <= 360; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-9) return n === d ? "1" : `${n}/${d}`;
  }
  return String(x);
}
