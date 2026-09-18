/* ============================================================================
   Geometry Workbook — the drawings for CHAPTER 12, parts of a circle
   ----------------------------------------------------------------------------
   One circle, centre O, drawn from its radius in centimetres, and on it
   whatever the question is about:

     points    named points on the circumference, by the angle round from O
               (0° to the right, anticlockwise), or anywhere by [x, y]
     lines     between named points or coordinates — a radius, a diameter, a
               chord, a tangent — in red when it is the thing asked about, or
               dashed and tappable when the circle is to be folded along it
     regions   a shaded sector (between two radii) or segment (cut off by a
               chord), either way round, so a major sector is a sector like
               any other that happens to go the long way
     arcs      part of the circumference picked out in red; `ring` is all of it
     callouts  a letter beside a part, for "name the part lettered B"

   Drawn at TRUE SIZE (scale 10) when a ruler is to go on it, fitted to a box
   otherwise, and its box always grows to take in every label. A circle that
   folds carries its outline as a many-sided polygon (data-fold), close enough
   that folding along a diameter lands every point of it back on itself.
   ========================================================================== */

const INK = "#2a2723";
const RED = "#c0453f";
const BLUE = "#2f6ea8";
const GREY = "#8f887c";
const SHADE = "#f6c9c4";
const FILL = "#fff9d8";

const f = (n) => (Math.abs(n) < 5e-3 ? 0 : +n).toFixed(2);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const rad = (d) => (d * Math.PI) / 180;
export const on = (deg, r = 1) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];

const text = (p, t, { size = 3.4, col = INK, weight = 700, anchor = "middle" } = {}) =>
  `<text x="${f(p[0])}" y="${f(p[1] + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}" paint-order="stroke" stroke="#fffdf8" stroke-width="1.1">${t}</text>`;

function wrap(w0, h0, body, label, attrs) {
  let [x0, y0, x1, y1] = [0, 0, w0, h0];
  for (const m of body.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)) {
    const [x, y, anchor, size, t] = [+m[1], +m[2], m[3], +m[4], m[5]];
    const w = t.length * size * 0.6 + 0.8;
    const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
    x0 = Math.min(x0, left - 0.6);
    x1 = Math.max(x1, left + w + 0.6);
    y0 = Math.min(y0, y - size - 0.4);
    y1 = Math.max(y1, y + 0.8);
  }
  const W = x1 - x0;
  const H = y1 - y0;
  return `<svg class="gw-ring" viewBox="${f(x0)} ${f(y0)} ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" role="img" aria-label="${label}"${attrs}>${body}</svg>`;
}

/**
 *   r         radius, in centimetres (the drawing is to scale with it)
 *   scale     10 for true size; leave out to fit `box`
 *   centre    true: a dot at O (and the letter, unless `centre === "dot"`)
 *   points    { A: 40, B: [x, y], … } — an angle on the circumference, or a place
 *   lines     [{ a, b, col, w, dash, label, fold }] — a, b: point names, "O", or [x, y]
 *   regions   [{ kind: "sector" | "segment", from, to }] — from `from`° anticlockwise to `to`°
 *   arcs      [{ from, to, col }];  ring: true for the whole circumference in red
 *   angles    [{ at: "O", from: deg, to: deg, label }] — an angle at the centre
 *   callouts  [{ at: [x, y], text }] — words anywhere (x, y in the circle's units)
 *   snap      names of the points a ruled line clicks onto (data-pts)
 *   fold      true: the circle can be folded along its dashed lines
 */
export function ringSvg({
  r = 2.5, scale = null, box = { w: 56, h: 52 }, centre = true, points = {}, lines = [], regions = [], arcs = [],
  ring = false, angles = [], callouts = [], snap = null, fold = false, note = "", label = "A circle", pad = 7, extent = [],
  bare = false,
} = {}) {
  const P = { O: [0, 0] };
  Object.entries(points).forEach(([k, v]) => { P[k] = Array.isArray(v) ? v : on(v, r); });
  const where = (v) => (Array.isArray(v) ? v : P[v]);
  const all = [[-r, -r], [r, r], ...Object.values(P), ...lines.flatMap((l) => [where(l.a), where(l.b)]), ...extent];
  const minX = Math.min(...all.map((p) => p[0]));
  const maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const maxY = Math.max(...all.map((p) => p[1]));
  const s = scale || Math.min((box.w - 2 * pad) / (maxX - minX), (box.h - 2 * pad) / (maxY - minY));
  const T = ([x, y]) => [pad + (x - minX) * s, pad + (maxY - y) * s];
  const W = 2 * pad + (maxX - minX) * s;
  const H = 2 * pad + (maxY - minY) * s;
  const O = T([0, 0]);
  const R = r * s;
  const at = (d) => T(on(d, r));
  /* bare: no whole circle — a semicircle or quadrant drawn from its own parts */
  let body = bare ? "" : `<circle cx="${f(O[0])}" cy="${f(O[1])}" r="${f(R)}" fill="${FILL}" stroke="none"/>`;

  regions.forEach(({ kind, from, to, col = SHADE }) => {
    let d1 = to;
    while (d1 <= from) d1 += 360;
    const big = d1 - from > 180 ? 1 : 0;
    const p0 = at(from);
    const p1 = at(d1);
    /* anticlockwise on the question is clockwise on the paper: sweep flag 0 */
    const arc = `A${f(R)} ${f(R)} 0 ${big} 0 ${f(p1[0])} ${f(p1[1])}`;
    body += kind === "sector"
      ? `<path d="M${f(O[0])} ${f(O[1])}L${f(p0[0])} ${f(p0[1])}${arc}Z" fill="${col}" stroke="none"/>`
      : `<path d="M${f(p0[0])} ${f(p0[1])}${arc}Z" fill="${col}" stroke="none"/>`;
  });

  if (!bare) body += `<circle cx="${f(O[0])}" cy="${f(O[1])}" r="${f(R)}" fill="none" stroke="${ring ? RED : INK}" stroke-width="${ring ? 1.1 : 0.6}"/>`;

  arcs.forEach(({ from, to, col = RED }) => {
    let d1 = to;
    while (d1 <= from) d1 += 360;
    const big = d1 - from > 180 ? 1 : 0;
    const p0 = at(from);
    const p1 = at(d1);
    body += `<path d="M${f(p0[0])} ${f(p0[1])}A${f(R)} ${f(R)} 0 ${big} 0 ${f(p1[0])} ${f(p1[1])}" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/>`;
  });

  lines.forEach((l) => {
    const a = T(where(l.a));
    const b = T(where(l.b));
    const dash = l.dash || (l.fold ? "1.6 1.1" : "");
    const col = l.col || (l.fold ? BLUE : INK);
    body += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${col}" stroke-width="${l.w || (l.fold ? 0.6 : 0.6)}" stroke-linecap="round"` +
      `${dash ? ` stroke-dasharray="${dash}"` : ""}${l.fold ? ` data-foldline="1"` : ""}/>`;
    if (l.label) {
      const m = add(a, mul(sub(b, a), l.at ?? 0.5));
      const d = unit(sub(b, a));
      let n = [-d[1], d[0]];
      if (l.away !== false && len(sub(add(m, n), O)) < len(sub(add(m, mul(n, -1)), O))) n = mul(n, -1);
      body += text(add(m, mul(n, 2.6)), l.label, { col: l.labelCol || INK });
    }
  });

  angles.forEach(({ from, to, label: t = "" }) => {
    let d1 = to;
    while (d1 <= from) d1 += 360;
    const rr = Math.min(5, R * 0.35);
    const a0 = add(O, mul(unit(sub(at(from), O)), rr));
    const a1 = add(O, mul(unit(sub(at(d1), O)), rr));
    body += `<path d="M${f(a0[0])} ${f(a0[1])}A${f(rr)} ${f(rr)} 0 ${d1 - from > 180 ? 1 : 0} 0 ${f(a1[0])} ${f(a1[1])}" fill="none" stroke="${RED}" stroke-width="0.55"/>`;
    if (t) body += text(T(on((from + d1) / 2, (rr + 4.2) / s)), t, { size: 3.1 });
  });

  Object.entries(P).forEach(([k, v]) => {
    if (k === "O") return;
    if (k.startsWith("_")) return;
    const p = T(v);
    body += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="0.7" fill="${INK}"/>`;
    body += text(add(p, mul(unit(sub(p, O)), 3.6)), k, { size: 3.5 });
  });
  if (centre) {
    body += `<circle cx="${f(O[0])}" cy="${f(O[1])}" r="0.85" fill="${INK}"/>`;
    if (centre !== "dot") body += text(add(O, [-2.6, 2.6]), "O", { size: 3.5 });
  }

  callouts.forEach(({ at: p, text: t, col = BLUE }) => { body += text(T(p), t, { size: 3.6, col }); });

  let h = H;
  if (note) { body += text([W / 2, H + 3.2], note, { size: 2.8, col: GREY, weight: 500 }); h += 5; }

  let attrs = "";
  if (snap) attrs += ` data-pts="${snap.map((k) => T(where(k)).map(f).join(",")).join(" ")}"`;
  if (fold) {
    const outline = [...Array(96)].map((_, i) => at((360 * i) / 96));
    attrs += ` data-fold="${outline.map((p) => p.map(f).join(",")).join(" ")}" data-fold-fill="${FILL}"`;
  }
  if (s === 10) attrs += ` data-true-size="1"`;
  return wrap(W, h, body, label, attrs);
}
