/* ============================================================================
   Geometry Workbook — the drawings for CHAPTER 10, area and perimeter of
   triangles
   ----------------------------------------------------------------------------
   Every triangle in the chapter is drawn from its own numbers, never from a
   picture of one, so what is printed is what the question says. Measured in
   millimetres at the paper's own size, like every other figure in this book.

   Three ways a triangle is drawn, and they are the chapter's three stages:

     TRUE SIZE    1 cm on the question is 1 cm on the paper (scale 10). The
                  child puts a ruler on it — the CONCRETE stage. Nothing is
                  labelled that the ruler is supposed to find.
     ON A GRID    the triangle's corners sit on the corners of centimetre
                  squares, and the squares are there to be counted — concrete
                  for area, the way a ruler is concrete for length.
     LABELLED     drawn to fit, with its lengths written on it — the
                  REPRESENTATIONAL stage. A drawing that is not to scale says
                  so, because a child who has just been measuring will measure
                  again.

   The ABSTRACT stage has no picture at all; that is the point of it.

   Marks follow the textbook: a short tick across a side says "this side",
   two ticks say "equal to the other side with two", a small square in a
   corner says "right angle", and a dashed line with a square at its foot is
   a height.

   A composite shape is triangles that share sides. Its OUTSIDE is drawn
   solid and a side two of its triangles share is drawn DASHED — the one
   picture that answers the commonest mistake in the topic, which is to add
   a line that is inside the shape to its perimeter.
   ========================================================================== */

const INK = "#2a2723";
const GREY = "#8f887c";
const RED = "#c0453f";
const FILL = "#fff3a8";          // butter, the same as every shape in this book
const FILLS = ["#fff3a8", "#bfe3ff", "#c8f0c0", "#ffd7a3"];
const GRID = "#d9d3c7";

const f = (n) => (+n).toFixed(2);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const centroid = (pts) => mul(pts.reduce(add, [0, 0]), 1 / pts.length);

/**
 * A triangle with these three sides, as points in the question's own units
 * (y upwards): the side `c` lies along the bottom, from (0, 0) to (c, 0).
 * `a` is the side opposite the first corner, `b` the side opposite the second.
 *   fromSides(5, 4, 3) → [[0,0], [3,0], [0,4]]  a right angle at the first corner
 */
export function fromSides(a, b, c) {
  const x = (b * b + c * c - a * a) / (2 * c);
  const y = Math.sqrt(Math.max(0, b * b - x * x));
  return [[0, 0], [c, 0], [x, y]];
}

/** The side lengths of a triangle, [p0p1, p1p2, p2p0]. */
export const sidesOf = (t) => [len(sub(t[1], t[0])), len(sub(t[2], t[1])), len(sub(t[0], t[2]))];

/** Area of a triangle from its corners. */
export const areaOf = (t) =>
  Math.abs((t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[2][0] - t[0][0]) * (t[1][1] - t[0][1])) / 2;

/* ── the page transform: question units → paper millimetres ───────────── */

function frame(allPts, { scale, box = { w: 70, h: 52 }, pad = 7, grid = false }) {
  const xs = allPts.map((p) => p[0]);
  const ys = allPts.map((p) => p[1]);
  let minX = Math.min(...xs); let maxX = Math.max(...xs);
  let minY = Math.min(...ys); let maxY = Math.max(...ys);
  if (grid) { minX = Math.floor(minX) - 1; maxX = Math.ceil(maxX) + 1; minY = Math.floor(minY) - 1; maxY = Math.ceil(maxY) + 1; }
  const s = scale || Math.min((box.w - 2 * pad) / Math.max(maxX - minX, 1e-6), (box.h - 2 * pad) / Math.max(maxY - minY, 1e-6));
  const P = grid ? 1.5 : pad;
  const at = ([x, y]) => [P + (x - minX) * s, P + (maxY - y) * s];
  return { at, s, w: 2 * P + (maxX - minX) * s, h: 2 * P + (maxY - minY) * s, minX, maxX, minY, maxY, P };
}

/* ── marks ─────────────────────────────────────────────────────────────── */

const seg = (p, q, { w = 0.5, col = INK, dash = null } = {}) =>
  `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

const text = (p, t, { size = 3.6, col = INK, weight = 700, anchor = "middle" } = {}) =>
  `<text x="${f(p[0])}" y="${f(p[1] + size * 0.36)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}" paint-order="stroke" stroke="#fffdf8" stroke-width="1.1">${t}</text>`;

/** n ticks across the side p→q at its middle: "these sides are equal". */
function ticks(p, q, n) {
  if (!n) return "";
  const d = unit(sub(q, p));
  const nrm = [-d[1], d[0]];
  const m = mid(p, q);
  let out = "";
  for (let i = 0; i < n; i++) {
    const c = add(m, mul(d, (i - (n - 1) / 2) * 1.3));
    out += seg(add(c, mul(nrm, 1.5)), add(c, mul(nrm, -1.5)), { w: 0.45 });
  }
  return out;
}

/** The small square in a corner at `v`, between the directions to a and b. */
function rightMark(v, a, b, size = 2.6) {
  const u = mul(unit(sub(a, v)), size);
  const w = mul(unit(sub(b, v)), size);
  const c = add(add(v, u), w);
  return `<path d="M${f(v[0] + u[0])} ${f(v[1] + u[1])}L${f(c[0])} ${f(c[1])}L${f(v[0] + w[0])} ${f(v[1] + w[1])}" fill="none" stroke="${INK}" stroke-width="0.4"/>`;
}

/** A label for the side p→q, set outside the shape (away from `inside`). */
function sideLabel(p, q, inside, t, gap = 3.2) {
  if (t == null || t === "") return "";
  const m = mid(p, q);
  const d = unit(sub(q, p));
  let nrm = [-d[1], d[0]];
  if ((m[0] + nrm[0] - inside[0]) ** 2 + (m[1] + nrm[1] - inside[1]) ** 2 < (m[0] - nrm[0] - inside[0]) ** 2 + (m[1] - nrm[1] - inside[1]) ** 2) {
    nrm = mul(nrm, -1);
  }
  return text(add(m, mul(nrm, gap)), t);
}

function gridLines(F) {
  let out = "";
  for (let x = F.minX; x <= F.maxX + 1e-9; x++) {
    const a = F.at([x, F.minY]); const b = F.at([x, F.maxY]);
    out += seg(a, b, { w: 0.2, col: GRID });
  }
  for (let y = F.minY; y <= F.maxY + 1e-9; y++) {
    const a = F.at([F.minX, y]); const b = F.at([F.maxX, y]);
    out += seg(a, b, { w: 0.2, col: GRID });
  }
  return out;
}

/**
 * The finished figure. Its box is the drawing's box grown to take in every
 * word written on it — a label set outside a side near the edge would
 * otherwise be cut off. Widths are measured the way the monospace font is set
 * (0.6 em a character), and the box is only ever grown, so a true-size figure
 * stays 1 mm to the millimetre.
 */
function svg(F, body, label, extra = "") {
  let [x0, y0, x1, y1] = [0, 0, F.w, F.h];
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
  return `<svg class="ap-fig" viewBox="${f(x0)} ${f(y0)} ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" role="img" aria-label="${label}"${extra}>${body}</svg>`;
}

/**
 * One triangle.
 *
 *   tri       three corners, in the question's units, y upwards
 *   scale     mm per unit: 10 is TRUE SIZE (a centimetre is a centimetre);
 *             leave it out to fit the drawing to `box`
 *   grid      true to put it on centimetre squares (corners on the corners)
 *   labels    [side p0p1, p1p2, p2p0] — the words written beside each side
 *   ticks     [n, n, n] tick marks for equal sides
 *   height    { from: corner index, label } — the dashed height to the side
 *             opposite, with its square at the foot (the side is carried on,
 *             dashed, when the foot lands outside it)
 *   right     index of a corner to mark as a right angle
 *   rect      true to draw the rectangle round it, dashed: "half of this"
 *   note      a line under the drawing, e.g. "not drawn to scale"
 */
export function triSvg(tri, {
  scale = null, box, grid = false, labels = [null, null, null], ticks: tk = [0, 0, 0],
  height = null, right = null, rect = false, note = "", fill = FILL, label = "A triangle",
} = {}) {
  const extraPts = [];
  let foot = null;
  if (height) {
    const v = tri[height.from];
    const a = tri[(height.from + 1) % 3];
    const b = tri[(height.from + 2) % 3];
    const d = unit(sub(b, a));
    const t = (v[0] - a[0]) * d[0] + (v[1] - a[1]) * d[1];
    foot = add(a, mul(d, t));
    extraPts.push(foot);
  }
  const all = [...tri, ...extraPts];
  if (rect) {
    const xs = tri.map((p) => p[0]); const ys = tri.map((p) => p[1]);
    all.push([Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]);
  }
  const F = frame(all, { scale: grid ? (scale || 10) : scale, box, grid });
  const P = tri.map(F.at);
  const inside = centroid(P);
  let body = grid ? gridLines(F) : "";

  if (rect) {
    const xs = tri.map((p) => p[0]); const ys = tri.map((p) => p[1]);
    const r0 = F.at([Math.min(...xs), Math.max(...ys)]);
    const r1 = F.at([Math.max(...xs), Math.min(...ys)]);
    body += `<rect x="${f(r0[0])}" y="${f(r0[1])}" width="${f(r1[0] - r0[0])}" height="${f(r1[1] - r0[1])}" fill="none" stroke="${GREY}" stroke-width="0.45" stroke-dasharray="1.6 1.2"/>`;
  }

  body += `<path d="M${P.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}Z" fill="${fill}" fill-opacity="${grid ? 0.55 : 1}" stroke="${INK}" stroke-width="0.55" stroke-linejoin="round"/>`;

  if (height) {
    const k = height.from;
    const v = P[k];
    const a = P[(k + 1) % 3];
    const b = P[(k + 2) % 3];
    const F2 = F.at(foot);
    /* the base carried on, dashed, when the foot is past the end of it */
    const along = (x) => (x[0] - a[0]) * (b[0] - a[0]) + (x[1] - a[1]) * (b[1] - a[1]);
    const L2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
    const tF = along(F2) / L2;
    if (tF < -0.01) body += seg(a, F2, { w: 0.4, col: GREY, dash: "1.2 1" });
    if (tF > 1.01) body += seg(b, F2, { w: 0.4, col: GREY, dash: "1.2 1" });
    body += seg(v, F2, { w: 0.5, col: RED, dash: "1.6 1.1" });
    const toward = tF > 0.5 ? a : b;
    body += rightMark(F2, v, toward, 2.2);
    if (height.label != null) {
      /* Inside the triangle when the height is, on the roomier side of the
         dashed line and low down where the triangle is widest — the side
         labels are all outside, so the two never meet. When the height is
         outside (or IS a side), the label goes outside too, away from the shape. */
      const within = tF > 0.03 && tF < 0.97;
      /* outside, it goes high up, above the label of the sloping side that
         lies next to the dashed line */
      const at = add(F2, mul(sub(v, F2), within ? 0.3 : 0.84));
      let left;
      if (within) left = len(sub(a, F2)) > len(sub(b, F2)) ? a[0] < F2[0] : b[0] < F2[0];
      else left = inside[0] > F2[0];
      body += text(add(at, [left ? -1.4 : 1.4, 0]), height.label, { col: RED, anchor: left ? "end" : "start" });
    }
  }

  for (let i = 0; i < 3; i++) {
    const p = P[i]; const q = P[(i + 1) % 3];
    body += ticks(p, q, tk[i]);
    body += sideLabel(p, q, inside, labels[i]);
  }
  if (right != null) body += rightMark(P[right], P[(right + 1) % 3], P[(right + 2) % 3]);

  let h = F.h;
  if (note) {
    body += text([F.w / 2, F.h + 3.2], note, { size: 2.8, col: GREY, weight: 500 });
    h += 5;
  }
  return svg({ ...F, h }, body, label, F.s === 10 ? ` data-true-size="1"` : "");
}

/**
 * A shape made only of triangles.
 *
 *   tris     each triangle's three corners, in the question's units
 *   labels   { "x1,y1|x2,y2": "5 cm" } — words for a side, keyed by its two
 *            ends in either order (see `edgeKey`)
 *   grid     true to draw it on centimetre squares, to be counted
 *   split    false to hide the lines inside (the child is asked to find them)
 *
 * A side two triangles share is INSIDE the shape: drawn dashed and pale, never
 * solid, so it cannot be mistaken for part of the outside.
 */
export const edgeKey = (p, q) => [p, q].map((c) => `${+c[0].toFixed(3)},${+c[1].toFixed(3)}`).sort().join("|");

export function compSvg(tris, {
  labels = {}, grid = false, split = true, box, scale = null, note = "", label = "A shape made of triangles",
  tint = true, numbers = false, heights = [],
} = {}) {
  const all = [...tris.flat(), ...heights.flatMap((h) => [h.from, h.to])];
  const F = frame(all, { scale: grid ? (scale || 10) : scale, box: box || { w: 84, h: 60 }, grid });
  const count = new Map();
  tris.forEach((t) => [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]].forEach(([p, q]) => {
    const k = edgeKey(p, q);
    count.set(k, (count.get(k) || 0) + 1);
  }));
  const shapeMid = centroid(all.map(F.at));
  let body = grid ? gridLines(F) : "";
  tris.forEach((t, i) => {
    const P = t.map(F.at);
    body += `<path d="M${P.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}Z" fill="${tint ? FILLS[i % FILLS.length] : FILL}" fill-opacity="${grid ? 0.55 : 1}" stroke="none"/>`;
  });
  const drawn = new Set();
  tris.forEach((t) => [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]].forEach(([p, q]) => {
    const k = edgeKey(p, q);
    if (drawn.has(k)) return;
    drawn.add(k);
    const inside = count.get(k) > 1;
    if (inside && !split) return;
    body += seg(F.at(p), F.at(q), inside ? { w: 0.4, col: GREY, dash: "1.4 1.1" } : { w: 0.55 });
    if (labels[k] != null) {
      if (inside) {
        /* an inside side is labelled ON the line, so it is plainly not outside
           — at a quarter, a half or three quarters along, whichever is
           furthest from where a height meets it and from the part numbers */
        const P0 = F.at(p);
        const P1 = F.at(q);
        const avoid = [...heights.map((ht) => F.at(ht.to)), ...(numbers ? tris.map((t) => centroid(t.map(F.at))) : [])];
        const spot = (t) => add(P0, mul(sub(P1, P0), t));
        const room = (t) => Math.min(99, ...avoid.map((a) => len(sub(spot(t), a))));
        const t = [0.5, 0.3, 0.7].reduce((best, c) => (room(c) > room(best) + 2 ? c : best), 0.5);
        const m = spot(t);
        body += text([m[0], m[1] - 1.8], labels[k], { col: GREY });
      } else {
        const own = centroid(t.map(F.at));
        body += sideLabel(F.at(p), F.at(q), own, labels[k]);
      }
    }
  }));
  /* heights: dashed, red, a square at the foot — the same mark as one triangle */
  heights.forEach((ht) => {
    const a = F.at(ht.from);
    const b = F.at(ht.to);
    body += seg(a, b, { w: 0.5, col: RED, dash: "1.6 1.1" });
    const along = ht.along ? F.at(ht.along) : add(b, [1, 0]);
    body += rightMark(b, a, along, 2.2);
    if (ht.label != null) {
      /* over half way up, clear of a label on the base, on the side facing
         the middle of the shape unless the height is its edge */
      const at = add(b, mul(sub(a, b), 0.58));
      const left = Math.abs(b[0] - shapeMid[0]) < 0.5 ? false : b[0] > shapeMid[0];
      body += text(add(at, [left ? -1.4 : 1.4, 0]), ht.label, { col: RED, anchor: left ? "end" : "start" });
    }
  });
  /* the parts numbered, in the middle of each, for "part 1, part 2 …" */
  if (numbers) {
    tris.forEach((t, i) => {
      const c = centroid(t.map(F.at));
      body += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="2.4" fill="#fffdf8" stroke="${INK}" stroke-width="0.35"/>` +
        text(c, String(i + 1), { size: 3 });
    });
  }
  let h = F.h;
  if (note) {
    body += text([F.w / 2, F.h + 3.2], note, { size: 2.8, col: GREY, weight: 500 });
    h += 5;
  }
  return svg({ ...F, h }, body, label, ` data-parts="${tris.length}"`);
}

/** The outside edges of a shape made of triangles, and the inside ones. */
export function edgesOf(tris) {
  const count = new Map();
  const ends = new Map();
  tris.forEach((t) => [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]].forEach(([p, q]) => {
    const k = edgeKey(p, q);
    count.set(k, (count.get(k) || 0) + 1);
    ends.set(k, [p, q]);
  }));
  const outside = []; const inside = [];
  count.forEach((n, k) => (n > 1 ? inside : outside).push({ key: k, ends: ends.get(k), length: len(sub(ends.get(k)[1], ends.get(k)[0])) }));
  return { outside, inside };
}
