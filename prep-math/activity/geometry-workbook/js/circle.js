/* ============================================================================
   Geometry Workbook — the figures for circle theorems (chapter 6)
   ----------------------------------------------------------------------------
   One picture: a circle, centre O, radius 1, with named points on it (and
   outside it, for tangents), the lines between them, the angles marked, and
   whatever a question is about picked out in red.

   THE FIGURE IS BUILT FROM ITS NUMBERS. A question that says the angle at the
   centre is 110° places its two points 110° apart round O, so the angle at
   the circumference really is 55° and a protractor — on paper, or the one in
   the toolbox on screen — finds what the question says. The points are the
   figure's data-pts, so the on-screen protractor's centre clicks onto them
   and its baseline lies along the lines.

   Coordinates are the maths book's: y up. Positions round the circle are
   given as angles, 0° to the right, anticlockwise.
   ========================================================================== */

const INK = "#2a2723";
const RED = "#c0453f";
const BLUE = "#2f6ea8";
const SHADE = "#f6c9c4";

const f = (n) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };

/** The point on the circle (radius 1, centre the origin) at `d` degrees. */
export const on = (d) => [Math.cos(rad(d)), Math.sin(rad(d))];

/** The angle, in degrees, at V between the lines to P and Q (0–180). */
export function angleAt(V, P, Q) {
  const u = unit(sub(P, V));
  const v = unit(sub(Q, V));
  return deg(Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))));
}

const text = (p, s, { size = 3.4, col = INK, weight = 700, halo = true } = {}) =>
  `<text x="${f(p[0])}" y="${f(p[1] + size * 0.36)}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}"` +
  (halo ? ` stroke="#fffdf8" stroke-width="0.8" stroke-linejoin="round" paint-order="stroke"` : "") + `>${s}</text>`;

/**
 * A circle with things on it.
 *
 *   P        { name: [x, y] } — points, on the circle (use `on`) or anywhere;
 *            "O" is the centre. A name starting with "_" is drawn but not
 *            lettered (the far end of a tangent).
 *   segs     [["A", "B"], …] or [{ a, b, col, w, dash }] — straight lines
 *   angles   [{ at, from, to, label, right, col }] — an arc (or the square of
 *            a right angle) at `at`, between the lines to `from` and `to`;
 *            right: false keeps an arc on a 90° corner that is to be found
 *   ticks    [["P", "A"], …] — equal-length marks on those lines
 *   lens     [{ a, b, text, at }] — a length written beside a line, `at`
 *            of the way along it (a half, unless something else is there)
 *   sector   ["A", "B"] — shade the sector from A anticlockwise to B
 *   segment  ["A", "B"] — shade the segment cut off by chord AB, on the
 *            side from A anticlockwise to B
 *   arc      ["A", "B"] — the arc from A anticlockwise to B, in red
 *   ring     true: draw the whole circle in red (the circumference)
 *   dots     which points get a dot (default: all lettered ones)
 */
export function circleSvg({
  P = {}, segs = [], angles = [], ticks = [], lens = [], sector = null, segment = null, arc = null, ring = false,
  box = { w: 60, h: 56 }, hideO = false,
}) {
  /* kept for the checks, which measure every figure they are given */
  circleSvg.last = { P, angles, lens, segs };
  const names = Object.keys(P);
  const all = [...names.map((n) => P[n]), [-1, -1], [1, 1]];
  const pad = 7;
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const s = Math.min((box.w - 2 * pad) / spanX, (box.h - 2 * pad) / spanY);
  const T = (p) => [(p[0] - Math.min(...xs)) * s + pad, (Math.max(...ys) - p[1]) * s + pad];
  const M = Object.fromEntries(names.map((n) => [n, T(P[n])]));
  const O = T([0, 0]);
  const R = s;
  /* Every label is tracked and the figure's box grows round them at the end,
     so a length written beside a line near the edge is never cut off. */
  const ext = { x0: 0, y0: 0, x1: spanX * s + 2 * pad, y1: spanY * s + 2 * pad };
  const lab = (p, str, opts = {}) => {
    const size = opts.size || 3.4;
    const hw = String(str).length * size * 0.31;
    ext.x0 = Math.min(ext.x0, p[0] - hw - 1); ext.x1 = Math.max(ext.x1, p[0] + hw + 1);
    ext.y0 = Math.min(ext.y0, p[1] - size * 0.7 - 1); ext.y1 = Math.max(ext.y1, p[1] + size * 0.7 + 1);
    return text(p, str, opts);
  };
  const angOf = (n) => deg(Math.atan2(P[n][1], P[n][0]));
  const at = (d) => T(on(d));

  let body = "";

  /* shading first, under everything */
  if (sector) {
    const [a, b] = sector;
    let d0 = angOf(a); let d1 = angOf(b);
    if (d1 <= d0) d1 += 360;
    const big = d1 - d0 > 180 ? 1 : 0;
    const p0 = at(d0); const p1 = at(d1);
    body += `<path d="M${f(O[0])} ${f(O[1])} L${f(p0[0])} ${f(p0[1])} A${f(R)} ${f(R)} 0 ${big} 0 ${f(p1[0])} ${f(p1[1])} Z" fill="${SHADE}" stroke="none"/>`;
  }
  if (segment) {
    const [a, b] = segment;
    let d0 = angOf(a); let d1 = angOf(b);
    if (d1 <= d0) d1 += 360;
    const big = d1 - d0 > 180 ? 1 : 0;
    const p0 = at(d0); const p1 = at(d1);
    body += `<path d="M${f(p0[0])} ${f(p0[1])} A${f(R)} ${f(R)} 0 ${big} 0 ${f(p1[0])} ${f(p1[1])} Z" fill="${SHADE}" stroke="none"/>`;
  }

  body += `<circle cx="${f(O[0])}" cy="${f(O[1])}" r="${f(R)}" fill="none" stroke="${ring ? RED : INK}" stroke-width="${ring ? 1.1 : 0.7}"/>`;

  if (arc) {
    const [a, b] = arc;
    let d0 = angOf(a); let d1 = angOf(b);
    if (d1 <= d0) d1 += 360;
    const big = d1 - d0 > 180 ? 1 : 0;
    const p0 = at(d0); const p1 = at(d1);
    body += `<path d="M${f(p0[0])} ${f(p0[1])} A${f(R)} ${f(R)} 0 ${big} 0 ${f(p1[0])} ${f(p1[1])}" fill="none" stroke="${RED}" stroke-width="1.3" stroke-linecap="round"/>`;
  }

  /* lines */
  segs.forEach((sg) => {
    const { a, b, col = INK, w = 0.6, dash = "" } = Array.isArray(sg) ? { a: sg[0], b: sg[1] } : sg;
    const A = M[a]; const B = M[b];
    body += `<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(B[0])}" y2="${f(B[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  });

  /* equal-length ticks */
  ticks.forEach(([a, b], k) => {
    const A = M[a]; const B = M[b];
    const mid = mul(add(A, B), 0.5);
    const d = unit(sub(B, A));
    const n = [-d[1], d[0]];
    const p1 = add(mid, mul(n, 1.5)); const p2 = add(mid, mul(n, -1.5));
    body += `<line x1="${f(p1[0])}" y1="${f(p1[1])}" x2="${f(p2[0])}" y2="${f(p2[1])}" stroke="${INK}" stroke-width="0.5"/>`;
  });

  /* angles: arcs and right-angle squares, with their labels */
  angles.forEach(({ at: v, from, to, label = "", right = false, col = RED }) => {
    const V = M[v];
    const u = unit(sub(M[from], V));
    const w = unit(sub(M[to], V));
    const size = angleAt(P[v], P[from], P[to]);
    /* a right angle gets its square — unless the question is to find it
       (right: false), when the square would be the answer */
    if (right === true || (right !== false && Math.abs(size - 90) < 1e-6)) {
      const k = 2.8;
      const q = [add(V, mul(u, k)), add(add(V, mul(u, k)), mul(w, k)), add(V, mul(w, k))];
      body += `<polyline points="${q.map((p) => p.map(f).join(",")).join(" ")}" fill="none" stroke="${col}" stroke-width="0.5"/>`;
    } else {
      const r = size < 35 ? 6 : 4.6;
      const a0 = add(V, mul(u, r)); const a1 = add(V, mul(w, r));
      const cross = u[0] * w[1] - u[1] * w[0];
      body += `<path d="M${f(a0[0])} ${f(a0[1])} A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${f(a1[0])} ${f(a1[1])}" fill="none" stroke="${col}" stroke-width="0.55"/>`;
    }
    if (label !== "") {
      const bis = unit(add(u, w));
      const half = rad(size / 2);
      const far = Math.min(14, Math.max(String(label).length > 2 ? 8.6 : 6.8, 4 / Math.max(Math.sin(half), 0.08)));
      body += lab(add(V, mul(bis, far)), label, { size: 3.1, col: col === RED ? INK : col });
    }
  });

  /* lengths beside lines, on the side away from the centre */
  lens.forEach(({ a, b, text: t, at: along = 0.5 }) => {
    const A = M[a]; const B = M[b];
    const mid = add(A, mul(sub(B, A), along));
    const d = unit(sub(B, A));
    let n = [-d[1], d[0]];
    if ((mid[0] - O[0]) * n[0] + (mid[1] - O[1]) * n[1] < 0 && !(a === "O" || b === "O")) n = mul(n, -1);
    const half = String(t).length * 3 * 0.31;
    body += lab(add(mid, mul(n, 3 + half * Math.abs(n[0]))), t, { size: 3 });
  });

  /* points: a dot, and the letter outside the circle (or away from it) */
  names.forEach((n) => {
    if (n === "O" && hideO) return;
    const p = M[n];
    const lettered = !n.startsWith("_");
    if (lettered) body += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${n === "O" ? 0.9 : 0.75}" fill="${INK}"/>`;
    if (!lettered) return;
    let dir;
    if (n === "O") dir = [-0.7, 0.7];
    else {
      const away = sub(p, O);
      dir = len(away) < 1e-6 ? [0, -1] : unit(away);
    }
    body += lab(add(p, mul(dir, 3.8)), n, { size: 3.6 });
  });

  const pts = names.filter((n) => !n.startsWith("_")).map((n) => M[n].map(f).join(",")).join(" ");
  const W = ext.x1 - ext.x0;
  const H = ext.y1 - ext.y0;
  return (
    `<svg viewBox="${f(ext.x0)} ${f(ext.y0)} ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" class="gw-fig gw-circle" role="img" ` +
    `data-pts="${pts}" aria-label="A circle with centre O">${body}</svg>`
  );
}

/** The point where the tangent at circle point `d`° reaches, `t` along it
    (positive: anticlockwise side). */
export function alongTangent(d, t) {
  const p = on(d);
  const u = [-p[1], p[0]];
  return add(p, mul(u, t));
}
