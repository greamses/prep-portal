/* ============================================================================
   Geometry Workbook — the figures for Pythagoras' rule (chapter 4)
   ----------------------------------------------------------------------------
   Two pictures, and everything in the chapter is one of them.

   A RIGHT-ANGLED TRIANGLE drawn from its sides: the two short sides meet at
   the right angle, and the third is whatever it comes to — so a triangle
   labelled 6, 8 and 10 really is 6 by 8 by 10, and one printed at true size
   (`scale`: millimetres per unit) can be measured with a ruler and give the
   numbers on the answer key. It can carry a square on each side, drawn
   outward, ruled into unit squares when the sides are whole numbers — the
   3-4-5 picture with its 9, 16 and 25 little squares is the whole chapter in
   one figure. Given an `angle` other than 90 it draws the triangle those
   three sides really make, for "is the corner a right angle?".

   A RIGHT-ANGLED TRIANGLE ON A DOT GRID, its corners on dots, for ruling
   squares onto. A right angle between two grid directions (p, q) and (−q, p)
   is still a right angle when the triangle is tilted, and the square on every
   side — the tilted hypotenuse included — has its corners on dots, so the
   squares can be drawn dot to dot with a ruler and checked on screen.

   Millimetres and fixed hexes, like the rest of the paper.
   ========================================================================== */

const INK = "#2a2723";
const ARC = "#c0453f";
const GREY = "#8f887c";
/* the squares on the two short sides and on the long one */
const SQ_FILL = ["#fff3a8", "#bfe3ff", "#c8f0c0"];

const f = (n) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
const rad = (d) => (d * Math.PI) / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const pts = (list) => list.map((p) => p.map(f).join(",")).join(" ");
const text = (p, s, { size = 3.4, weight = 700, col = INK, halo = false } = {}) =>
  `<text x="${f(p[0])}" y="${f(p[1] + size * 0.36)}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}"` +
  (halo ? ` stroke="#fffdf8" stroke-width="0.9" stroke-linejoin="round" paint-order="stroke"` : "") + `>${s}</text>`;

/**
 * The square on side X→Y, on the side away from Z: [X, Y, Y′, X′].
 * Works in any units; on a grid of whole numbers it stays on the dots.
 */
export function outSquare(X, Y, Z) {
  const d = sub(Y, X);
  let n = [-d[1], d[0]];
  if (dot(n, sub(Z, X)) > 0) n = mul(n, -1);
  return [X, Y, add(Y, n), add(X, n)];
}

/* The three sides of a triangle [R, A, B], with the corner opposite each:
   "a" is R→A, "b" is R→B, "c" (the hypotenuse, opposite R) is A→B. */
const SIDES = { a: [0, 1, 2], b: [0, 2, 1], c: [1, 2, 0] };

/**
 * A right-angled triangle, the short sides a (along) and b (up) meeting at
 * the right angle — turned by `turn` degrees, mirrored by `flip`.
 *
 *   sides     { a, b, c } text on each side ("6 cm", "x", "p")
 *   squares   false | "plain" | "grid" — a square on each side, outward;
 *             "grid" rules each into unit squares (whole-number sides only)
 *   areas     { a, b, c } text in the middle of each square
 *   corner    "right" (the square mark), "ask" (an arc and a "?"), or "none"
 *   angle     the angle between a and b; 90 unless the question is whether
 *   letters   [atRight, atA, atB] corner letters, or none
 *   scale     millimetres per unit (true size), or none to fit `box`
 *   note      a line under the figure ("not drawn accurately")
 */
export function rightTriSvg({
  a, b, angle = 90, turn = 0, flip = false, sides = {}, squares = false, areas = {},
  corner = "right", letters = null, scale = null, box = { w: 70, h: 56 }, note = "",
}) {
  let tri = [[0, 0], [a, 0], [b * Math.cos(rad(angle)), -b * Math.sin(rad(angle))]];
  if (flip) tri = tri.map(([x, y]) => [-x, y]);
  if (turn) {
    const t = rad(turn);
    tri = tri.map(([x, y]) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)]);
  }
  const sq = squares ? Object.fromEntries(Object.entries(SIDES).map(([k, [x, y, z]]) => [k, outSquare(tri[x], tri[y], tri[z])])) : {};
  const all = [...tri, ...Object.values(sq).flat()];

  const pad = 7;
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const spanX = Math.max(...xs) - Math.min(...xs) || 1;
  const spanY = Math.max(...ys) - Math.min(...ys) || 1;
  const s = scale || Math.min((box.w - 2 * pad) / spanX, (box.h - 2 * pad) / spanY);
  const T = (p) => [(p[0] - Math.min(...xs)) * s + pad, (p[1] - Math.min(...ys)) * s + pad];
  const P = tri.map(T);
  const centroid = mul(add(add(P[0], P[1]), P[2]), 1 / 3);

  /* Everything drawn is tracked, labels included, and the drawing's box is
     grown round it at the end — a "12 cm" beside an upright side never runs
     off the edge of the figure. */
  const ext = { x0: 0, y0: 0, x1: spanX * s + 2 * pad, y1: spanY * s + 2 * pad };
  const grow = (x0, y0, x1, y1) => {
    ext.x0 = Math.min(ext.x0, x0); ext.y0 = Math.min(ext.y0, y0);
    ext.x1 = Math.max(ext.x1, x1); ext.y1 = Math.max(ext.y1, y1);
  };
  const label = (p, s0, opts = {}) => {
    const size = opts.size || 3.4;
    const hw = String(s0).length * size * 0.31;
    grow(p[0] - hw - 1, p[1] - size * 0.7 - 1, p[0] + hw + 1, p[1] + size * 0.7 + 1);
    return text(p, s0, opts);
  };

  let body = "";
  /* the squares first, so the triangle sits on top of them */
  Object.entries(sq).forEach(([k, corners]) => {
    const Q = corners.map(T);
    body += `<polygon points="${pts(Q)}" fill="${SQ_FILL["abc".indexOf(k)]}" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>`;
    const L = Math.round(Math.hypot(...sub(corners[1], corners[0])));
    if (squares === "grid" && L > 1 && Math.abs(Math.hypot(...sub(corners[1], corners[0])) - L) < 1e-6) {
      const d = sub(Q[1], Q[0]);
      const n = sub(Q[3], Q[0]);
      for (let j = 1; j < L; j++) {
        const u = add(Q[0], mul(d, j / L));
        const v = add(Q[0], mul(n, j / L));
        body += `<line x1="${f(u[0])}" y1="${f(u[1])}" x2="${f(u[0] + n[0])}" y2="${f(u[1] + n[1])}" stroke="${GREY}" stroke-width="0.25"/>`;
        body += `<line x1="${f(v[0])}" y1="${f(v[1])}" x2="${f(v[0] + d[0])}" y2="${f(v[1] + d[1])}" stroke="${GREY}" stroke-width="0.25"/>`;
      }
    }
    if (areas[k] !== undefined) {
      /* in the middle of its square — or, when the square is too small to
         hold it (the short side of a long thin triangle), just beyond it */
      const side = Math.hypot(...sub(Q[1], Q[0]));
      const hw = String(areas[k]).length * 3.6 * 0.31;
      const n = unit(sub(Q[3], Q[0]));
      const at = side >= 2 * hw + 2
        ? mul(add(Q[0], Q[2]), 0.5)
        : add(mul(add(Q[3], Q[2]), 0.5), mul(n, 3 + hw * Math.abs(n[0])));
      body += label(at, areas[k], { size: 3.6, halo: side < 2 * hw + 2 });
    }
  });
  const sqSide = (k) => (sq[k] ? Math.hypot(...sub(T(sq[k][1]), T(sq[k][0]))) : 0);

  body += `<polygon points="${pts(P)}" fill="#fffdf8" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>`;

  /* the corner between the two short sides */
  const u = unit(sub(P[1], P[0]));
  const v = unit(sub(P[2], P[0]));
  if (corner === "right") {
    const k = 3.2;
    const q = [add(P[0], mul(u, k)), add(add(P[0], mul(u, k)), mul(v, k)), add(P[0], mul(v, k))];
    body += `<polyline points="${pts(q)}" fill="none" stroke="${ARC}" stroke-width="0.55"/>`;
  } else if (corner === "ask") {
    const r = 5;
    const p0 = add(P[0], mul(u, r));
    const p1 = add(P[0], mul(v, r));
    const cross = u[0] * v[1] - u[1] * v[0];
    body += `<path d="M${f(p0[0])} ${f(p0[1])} A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${f(p1[0])} ${f(p1[1])}" fill="none" stroke="${ARC}" stroke-width="0.55"/>`;
    body += label(add(P[0], mul(unit(add(u, v)), 8.5)), "?", { col: ARC });
  }

  /* The side labels, always on the far side of the side from the triangle:
     out in the open, or — when a square is there — just inside the square,
     with a halo of paper so the little squares' lines do not run through
     them. Pushed off the side by half the label's width as the side turns
     upright, so a long "12 cm" never sits on its own line. */
  Object.entries(SIDES).forEach(([k, [x, y]]) => {
    const t = sides[k];
    if (t === undefined || t === null || t === "") return;
    const X = P[x];
    const Y = P[y];
    const mid = mul(add(X, Y), 0.5);
    const d = unit(sub(Y, X));
    let n = [-d[1], d[0]];
    if (dot(n, sub(centroid, mid)) > 0) n = mul(n, -1);
    const half = String(t).length * 3.4 * 0.31;
    /* a square too small to hold the label has it beyond its far edge */
    const room = !squares || sqSide(k) >= 2 * half + 5;
    const off = (squares ? (room ? 3.4 : sqSide(k) + 3.2) : 3.2) + half * Math.abs(n[0]);
    body += label(add(mid, mul(n, off)), t, squares ? { halo: true } : {});
  });

  if (letters) {
    P.forEach((V, i) => {
      if (!letters[i]) return;
      const out = unit(sub(V, centroid));
      body += label(add(V, mul(out, 4.4)), letters[i], { size: 3.8 });
    });
  }

  if (note) {
    body += `<text x="${f((ext.x0 + ext.x1) / 2)}" y="${f(ext.y1 + 2.4)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.6" fill="${GREY}" font-style="italic">${note}</text>`;
    ext.y1 += 3.6;
  }

  const W = ext.x1 - ext.x0;
  const H = ext.y1 - ext.y0;
  return (
    `<svg viewBox="${f(ext.x0)} ${f(ext.y0)} ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" class="gw-fig" role="img" ` +
    `data-pts="${pts(P)}" aria-label="A right-angled triangle">${body}</svg>`
  );
}

/* ── on a dot grid ─────────────────────────────────────────────────────────*/

const G_S = 6; // mm between dots — the same grid as chapter 2's
const G_M = 5; // mm round the dots

/** Dot (column, row) → millimetres on the figure; and back. */
export const gridMm = ([c, r]) => [c * G_S + G_M, r * G_S + G_M];
export const mmGrid = ([x, y]) => [(x - G_M) / G_S, (y - G_M) / G_S];

/**
 * Put a triangle [R, A, B] (in dot steps) on a grid just big enough for it —
 * and, with `room`, for the square on each of its sides. Returns the triangle
 * moved onto the grid, and the grid's size.
 */
export function fitGrid(tri, { room = false } = {}) {
  const all = [...tri];
  if (room) Object.values(SIDES).forEach(([x, y, z]) => all.push(...outSquare(tri[x], tri[y], tri[z])));
  const minX = Math.min(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const moved = tri.map(([x, y]) => [x - minX, y - minY]);
  const cols = Math.max(...all.map((p) => p[0])) - minX + 1;
  const rows = Math.max(...all.map((p) => p[1])) - minY + 1;
  return { tri: moved, cols, rows };
}

/**
 * The dot grid with the triangle on it. `squares` draws the three squares
 * (the worked example); `letters` names the corners.
 */
export function gridTriSvg({ tri, cols, rows, letters = null, squares = false, corner = false }) {
  const W = (cols - 1) * G_S + 2 * G_M;
  const H = (rows - 1) * G_S + 2 * G_M;
  let body = "";
  if (squares) {
    Object.entries(SIDES).forEach(([k, [x, y, z]]) => {
      const Q = outSquare(tri[x], tri[y], tri[z]).map(gridMm);
      body += `<polygon points="${pts(Q)}" fill="${SQ_FILL["abc".indexOf(k)]}" stroke="${INK}" stroke-width="0.5"/>`;
    });
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) body += `<circle cx="${c * G_S + G_M}" cy="${r * G_S + G_M}" r="0.45" fill="${GREY}"/>`;
  }
  const P = tri.map(gridMm);
  body += `<polygon points="${pts(P)}" fill="${squares ? "#fffdf8" : "none"}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`;
  P.forEach((V) => { body += `<circle cx="${f(V[0])}" cy="${f(V[1])}" r="0.9" fill="${INK}"/>`; });
  if (corner) {
    const u = unit(sub(P[1], P[0]));
    const v = unit(sub(P[2], P[0]));
    const k = 2.6;
    const q = [add(P[0], mul(u, k)), add(add(P[0], mul(u, k)), mul(v, k)), add(P[0], mul(v, k))];
    body += `<polyline points="${pts(q)}" fill="none" stroke="${ARC}" stroke-width="0.5"/>`;
  }
  if (letters) {
    const c0 = mul(add(add(P[0], P[1]), P[2]), 1 / 3);
    P.forEach((V, i) => { body += text(add(V, mul(unit(sub(V, c0)), 3.8)), letters[i], { size: 3.6 }); });
  }
  const dots = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dots.push(`${c * G_S + G_M},${r * G_S + G_M}`);
  return (
    `<svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" class="gw-fig" role="img" ` +
    `data-grid="${cols},${rows}" data-pts="${dots.join(" ")}" aria-label="A right-angled triangle on a dot grid">${body}</svg>`
  );
}

/**
 * Has a square been ruled on every side of the triangle, outward? `lines` are
 * pairs of dot indices (interactive.js), `fig.pts` the dots in millimetres.
 * A side of a square may be ruled in one go or dot by dot — what counts is
 * that every bit of it is covered by something ruled along it.
 */
export function squaresRuled(tri, lines, fig) {
  const G = fig.pts.map(mmGrid);
  const segs = lines.map(([i, j]) => [G[i], G[j]]).filter(([p, q]) => p && q);
  const onSeg = (p) => segs.some(([a, b]) => {
    const d = sub(b, a);
    const L2 = dot(d, d);
    if (!L2) return false;
    const t = dot(sub(p, a), d) / L2;
    if (t < -1e-6 || t > 1 + 1e-6) return false;
    return Math.hypot(...sub(p, add(a, mul(d, t)))) < 0.02;
  });
  const covered = (A, B) => {
    for (let k = 1; k < 24; k++) if (!onSeg(add(A, mul(sub(B, A), k / 24)))) return false;
    return true;
  };
  return Object.values(SIDES).every(([x, y, z]) => {
    const [X, Y, Y2, X2] = outSquare(tri[x], tri[y], tri[z]);
    return covered(Y, Y2) && covered(Y2, X2) && covered(X2, X);
  });
}
