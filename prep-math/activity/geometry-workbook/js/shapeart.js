/* ============================================================================
   Geometry Workbook — the drawings for CHAPTER 11, properties of polygons
   ----------------------------------------------------------------------------
   One function draws every shape in the chapter from its corners, in the
   question's own units (centimetres, y upwards), with the marks a textbook
   puts on a shape:

     ticks     a short stroke across a side: sides with the same number of
               ticks are the same length
     arrows    a chevron on a side: sides with the same number of chevrons
               are parallel (always pointing the same way, or they would say
               the opposite)
     rights    the small square in a corner
     angles    an arc in a corner, with its size or its letter
     lines     dashed lines across the shape: a height (red, with its square
               at the foot), a diagonal, a line of symmetry, or a line that
               is only a candidate — each can carry a label

   and two things for the screen:

     snap      the points a ruled line clicks onto (data-pts): corners, or
               corners + the middle of every side + the centre (every line of
               symmetry of a polygon goes through two of those), or the dots
               of a grid
     fold      the outline goes on the figure (data-fold), and the dashed
               lines that are to be folded along say so (data-foldline) — the
               workbook's fold.js does the rest

   Drawn at TRUE SIZE (scale 10: 1 cm on the question is 1 cm on the paper)
   when a ruler or protractor is to be used on it, on CENTIMETRE SQUARES when
   squares are to be counted, and fitted to a box otherwise. The box always
   grows to take in every label, so nothing is cut off and true size stays true.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8f887c";
const RED = "#c0453f";
const BLUE = "#2f6ea8";
const FILL = "#fff3a8";
const GRID = "#d9d3c7";

const f = (n) => (Math.abs(n) < 5e-3 ? 0 : +n).toFixed(2);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const centreOf = (pts) => mul(pts.reduce(add, [0, 0]), 1 / pts.length);

/** Corners, then the middle of every side, then the centre — in that order. */
export function symSnaps(poly) {
  return [...poly, ...poly.map((p, i) => mid(p, poly[(i + 1) % poly.length])), centreOf(poly)];
}

/** Every whole-number point from (x0, y0) to (x1, y1), row by row. */
export function gridSnaps(x0, y0, x1, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}

/** A shape turned about its centre by `deg`, and mirrored if asked. */
export function turn(poly, deg, flip = false) {
  const c = centreOf(poly);
  const t = (deg * Math.PI) / 180;
  const [cs, sn] = [Math.cos(t), Math.sin(t)];
  const out = poly.map(([x, y]) => {
    const X = (flip ? -(x - c[0]) : x - c[0]);
    const Y = y - c[1];
    return [+(X * cs - Y * sn).toFixed(4), +(X * sn + Y * cs).toFixed(4)];
  });
  return flip ? out.reverse() : out;
}

/** Interior angle at each corner, in degrees (the shape anticlockwise). */
export function anglesOf(poly) {
  const n = poly.length;
  return poly.map((V, i) => {
    const P = poly[(i + n - 1) % n];
    const N = poly[(i + 1) % n];
    const a = Math.atan2(P[1] - V[1], P[0] - V[0]);
    const b = Math.atan2(N[1] - V[1], N[0] - V[0]);
    let d = ((a - b) * 180) / Math.PI;
    while (d < 0) d += 360;
    while (d >= 360) d -= 360;
    return d;
  });
}

export const sideLens = (poly) => poly.map((p, i) => len(sub(poly[(i + 1) % poly.length], p)));

const text = (p, t, { size = 3.4, col = INK, weight = 700, anchor = "middle" } = {}) =>
  `<text x="${f(p[0])}" y="${f(p[1] + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}" paint-order="stroke" stroke="#fffdf8" stroke-width="1.1">${t}</text>`;

const seg = (p, q, { w = 0.5, col = INK, dash = null, extra = "" } = {}) =>
  `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}${extra}/>`;

function rightMark(v, a, b, size = 2.4, col = INK) {
  const u = mul(unit(sub(a, v)), size);
  const w = mul(unit(sub(b, v)), size);
  const c = add(add(v, u), w);
  return `<path d="M${f(v[0] + u[0])} ${f(v[1] + u[1])}L${f(c[0])} ${f(c[1])}L${f(v[0] + w[0])} ${f(v[1] + w[1])}" fill="none" stroke="${col}" stroke-width="0.4"/>`;
}

/** The finished figure: the box grown to take in every word on it. */
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
  return `<svg class="gw-shape" viewBox="${f(x0)} ${f(y0)} ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" role="img" aria-label="${label}"${attrs}>${body}</svg>`;
}

/**
 * One polygon.
 *
 *   poly      corners, anticlockwise, in the question's units (y up)
 *   scale     mm per unit — 10 is TRUE SIZE; leave out to fit `box`
 *   grid      true: on centimetre squares (scale 10 unless given)
 *   letters   a letter for each corner, set outside it
 *   sides     words beside each side (side i runs from corner i to i + 1)
 *   ticks     equal-side ticks per side;  arrows  parallel chevrons per side
 *   rights    corners to mark with the square
 *   angles    [{ at: i, label }] — an arc in that corner, and its words
 *   lines     [{ a, b, kind: "height" | "diag" | "fold" | "plain", label, fold }]
 *             a height gets its square at b (its foot) against the side `along`
 *   solid     [[a, b], …] extra solid segments (a half-shape's outline on a grid)
 *   outline   false: do not draw the polygon (a grid question drawing its own)
 *   snap      points a ruled line clicks onto, in the question's units
 *   fold      true: the shape can be folded (data-fold); fold lines are tappable
 *   note      a line under the drawing
 */
export function polySvg(poly, {
  scale = null, box = { w: 64, h: 50 }, grid = false, letters = null, sides = [], ticks = [], arrows = [],
  rights = [], angles = [], lines = [], solid = [], outline = true, snap = null, fold = false, note = "",
  fill = FILL, pad = 7, gridBox = null, label = "A shape",
} = {}) {
  const pts = [...poly, ...lines.flatMap((l) => [l.a, l.b]), ...solid.flat(), ...(snap || [])];
  let minX = Math.min(...pts.map((p) => p[0]));
  let maxX = Math.max(...pts.map((p) => p[0]));
  let minY = Math.min(...pts.map((p) => p[1]));
  let maxY = Math.max(...pts.map((p) => p[1]));
  if (grid) {
    [minX, minY, maxX, maxY] = gridBox || [Math.floor(minX) - 1, Math.floor(minY) - 1, Math.ceil(maxX) + 1, Math.ceil(maxY) + 1];
  }
  const s = grid ? scale || 10 : scale || Math.min((box.w - 2 * pad) / Math.max(maxX - minX, 1e-6), (box.h - 2 * pad) / Math.max(maxY - minY, 1e-6));
  const P0 = grid ? 1.5 : pad;
  const T = ([x, y]) => [P0 + (x - minX) * s, P0 + (maxY - y) * s];
  const W = 2 * P0 + (maxX - minX) * s;
  const H = 2 * P0 + (maxY - minY) * s;
  const M = poly.map(T);
  const C = centreOf(M);
  let body = "";

  if (grid) {
    for (let x = minX; x <= maxX + 1e-9; x++) body += seg(T([x, minY]), T([x, maxY]), { w: 0.2, col: GRID });
    for (let y = minY; y <= maxY + 1e-9; y++) body += seg(T([minX, y]), T([maxX, y]), { w: 0.2, col: GRID });
  }

  if (outline && poly.length) {
    body += `<path d="M${M.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}Z" fill="${fill}" fill-opacity="${grid ? 0.6 : 1}" stroke="${INK}" stroke-width="0.55" stroke-linejoin="round"/>`;
  }
  solid.forEach(([a, b]) => { body += seg(T(a), T(b), { w: 0.6 }); });

  const n = poly.length;
  /* ticks and parallel chevrons, at the middle of each side */
  for (let i = 0; i < n && outline; i++) {
    const p = M[i];
    const q = M[(i + 1) % n];
    const d = unit(sub(q, p));
    const nrm = [-d[1], d[0]];
    const m = mid(p, q);
    const k = ticks[i] || 0;
    const a = arrows[i] || 0;
    /* a chevron points the same way on both of a pair of parallel sides:
       rightwards, or upwards when the side is upright — and the ticks sit
       behind it, so the two marks never land on each other */
    const dir = Math.abs(d[0]) > 1e-6 ? (d[0] > 0 ? d : mul(d, -1)) : d[1] < 0 ? d : mul(d, -1);
    const dn = [-dir[1], dir[0]];
    for (let j = 0; j < k; j++) {
      const c = add(m, mul(dir, (j - (k - 1) / 2) * 1.3 + (a ? -2.4 : 0)));
      body += seg(add(c, mul(nrm, 1.5)), add(c, mul(nrm, -1.5)), { w: 0.45 });
    }
    for (let j = 0; j < a; j++) {
      const tip = add(m, mul(dir, (j - (a - 1) / 2) * 1.5 + (k ? 1.4 : 0) + 0.6));
      const b1 = add(add(tip, mul(dir, -1.3)), mul(dn, 1.1));
      const b2 = add(add(tip, mul(dir, -1.3)), mul(dn, -1.1));
      body += `<path d="M${f(b1[0])} ${f(b1[1])}L${f(tip[0])} ${f(tip[1])}L${f(b2[0])} ${f(b2[1])}" fill="none" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>`;
    }
    if (sides[i] != null && sides[i] !== "") {
      let out = nrm;
      if (len(sub(add(m, out), C)) < len(sub(add(m, mul(out, -1)), C))) out = mul(out, -1);
      body += text(add(m, mul(out, 3.2)), sides[i]);
    }
  }

  rights.forEach((i) => { body += rightMark(M[i], M[(i + 1) % n], M[(i + n - 1) % n]); });

  angles.forEach(({ at, label: t = "", col = RED }) => {
    const V = M[at];
    const u = unit(sub(M[(at + 1) % n], V));
    const w = unit(sub(M[(at + n - 1) % n], V));
    const r = 4.2;
    const a0 = add(V, mul(u, r));
    const a1 = add(V, mul(w, r));
    /* y is down on the paper, so anticlockwise on the question is clockwise here */
    const crossZ = u[0] * w[1] - u[1] * w[0];
    body += `<path d="M${f(a0[0])} ${f(a0[1])}A${r} ${r} 0 0 ${crossZ > 0 ? 1 : 0} ${f(a1[0])} ${f(a1[1])}" fill="none" stroke="${col}" stroke-width="0.55"/>`;
    if (t !== "") {
      const bis = unit(add(u, w));
      body += text(add(V, mul(bis, String(t).length > 2 ? 8.4 : 7)), t, { size: 3.1 });
    }
  });

  lines.forEach((l) => {
    const a = T(l.a);
    const b = T(l.b);
    const col = l.kind === "height" ? RED : l.kind === "fold" ? BLUE : l.kind === "diag" ? INK : GREY;
    const dash = l.kind === "diag" && !l.dash ? null : "1.6 1.1";
    const extra = l.fold || l.kind === "fold" ? ` data-foldline="1"` : "";
    body += seg(a, b, { w: l.kind === "fold" ? 0.6 : 0.5, col, dash, extra });
    if (l.kind === "height" && l.along) body += rightMark(b, a, T(l.along), 2.2, RED);
    if (l.label != null && l.label !== "") {
      const at = add(b, mul(sub(a, b), l.at ?? 0.5));
      const d = unit(sub(a, b));
      let nrm = [-d[1], d[0]];
      if (l.side === "in" ? len(sub(add(at, nrm), C)) > len(sub(add(at, mul(nrm, -1)), C)) : false) nrm = mul(nrm, -1);
      body += text(add(at, mul(nrm, 2.4)), l.label, { col: l.kind === "height" ? RED : l.kind === "fold" ? BLUE : INK });
    }
  });

  if (letters) {
    M.forEach((p, i) => {
      if (!letters[i]) return;
      const away = unit(sub(p, C));
      body += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="0.6" fill="${INK}"/>` + text(add(p, mul(away, 3.4)), letters[i], { size: 3.5 });
    });
  }

  let h = H;
  if (note) {
    body += text([W / 2, H + 3.2], note, { size: 2.8, col: GREY, weight: 500 });
    h += 5;
  }
  let attrs = "";
  if (snap) attrs += ` data-pts="${snap.map((p) => T(p).map(f).join(",")).join(" ")}"`;
  if (grid) attrs += ` data-grid="1"`;
  if (fold) attrs += ` data-fold="${M.map((p) => p.map(f).join(",")).join(" ")}"`;
  if (s === 10) attrs += ` data-true-size="1"`;
  return wrap(W, h, body, label, attrs);
}
