/* ============================================================================
   Geometry Workbook — the figures
   ----------------------------------------------------------------------------
   Triangles and polygons, drawn for paper: the shape, an arc at every corner a
   question is about, the angle written inside it, the corner letters outside,
   and — when the question needs them — the diagonals that cut a shape into
   triangles, or the side carried on past a corner to make an exterior angle.

   THE TRIANGLES ARE BUILT FROM THEIR ANGLES, NOT DRAWN AND THEN MEASURED. Give
   the three angles and the law of sines places the third corner, so a triangle
   printed with 50°, 60° and 70° really HAS those angles and a child who
   measures it with a protractor gets the numbers on the answer key. A
   worksheet whose "measure this" triangle is five degrees out teaches that the
   protractor is wrong.

   POLYGONS WITH A MISSING ANGLE ARE ALLOWED TO BE APPROXIMATE, AND SAY SO. A
   random convex shape is drawn first and its angles read off it, then rounded
   to the numbers a question can use. The unknown is worked out from the
   rounded ones — so the arithmetic is exact — and the figure carries the note
   every exam paper carries: not drawn accurately.

   Everything is millimetres and fixed hexes, like the rest of the paper.
   ========================================================================== */

const INK = "#2a2723";
const ARC = "#c0453f";
const EXT = "#2f6ea8";

/* The six note pastels, for shading the triangles a shape is cut into. Pale
   enough that the angle numbers written over them stay easy to read. */
const FILLS = ["#fff3a8", "#bfe3ff", "#c8f0c0", "#ffd7a3", "#e8c8ff", "#b8ece2"];

export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;

const unit = ([x, y]) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const f = (n) => n.toFixed(2);

/* ── building a shape ──────────────────────────────────────────────────────*/

/**
 * A triangle with angles A, B, C at corners 0, 1, 2 — seated on its LONGEST
 * side, with the widest angle at the top, then turned by `tilt`.
 *
 * Seated that way because a triangle balanced on one of its corners is a
 * harder picture than the question it illustrates, and because the longest
 * side is the one a protractor's flat edge lies along most easily. The corner
 * letters and the angles stay attached to their corners whatever order the
 * geometry is built in, so A is still the 50° corner after the triangle has
 * been sat down.
 */
export function trianglePoints(A, B, C, { tilt = 0, flip = false } = {}) {
  const angles = [A, B, C];
  /* the widest angle goes to the top, which puts the longest side along the
     bottom — the side opposite the widest angle is always the longest */
  const top = angles.indexOf(Math.max(A, B, C));
  const [i0, i1] = [0, 1, 2].filter((i) => i !== top);
  const L = 100;
  const a0 = angles[i0];
  const a1 = angles[i1];
  const at = angles[top];
  const side = (L * Math.sin(rad(a1))) / Math.sin(rad(at)); // from corner i0 to the top
  const built = {};
  built[i0] = [0, 0];
  built[i1] = [L, 0];
  built[top] = [side * Math.cos(rad(a0)), -side * Math.sin(rad(a0))];
  let pts = [built[0], built[1], built[2]];
  if (flip) pts = pts.map(([x, y]) => [x, -y]);
  return rotate(pts, tilt);
}

/** A regular polygon with a flat bottom edge. */
export function regularPoints(n, { tilt = 0 } = {}) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = rad(90 + 180 / n + (k * 360) / n);
    pts.push([50 * Math.cos(a), 50 * Math.sin(a)]);
  }
  return rotate(pts, tilt);
}

/**
 * A random convex polygon: corners on an ellipse, each nudged off the regular
 * spacing. Convex because every corner is on the ellipse and they go round in
 * order; never nearly-straight at a corner because the nudge is capped.
 */
export function irregularPoints(r, n) {
  const step = 360 / n;
  const ry = 34 + r.raw() * 16;
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = rad(90 + step / 2 + k * step + (r.raw() - 0.5) * step * 0.55);
    pts.push([50 * Math.cos(a), ry * Math.sin(a)]);
  }
  return pts;
}

function rotate(pts, tiltDeg) {
  if (!tiltDeg) return pts;
  const c = pts.reduce((s, p) => add(s, p), [0, 0]).map((v) => v / pts.length);
  const t = rad(tiltDeg);
  return pts.map((p) => {
    const [x, y] = sub(p, c);
    return [c[0] + x * Math.cos(t) - y * Math.sin(t), c[1] + x * Math.sin(t) + y * Math.cos(t)];
  });
}

/** The interior angle at every corner of a convex polygon, in degrees. */
export function interiorAngles(pts) {
  const n = pts.length;
  return pts.map((p, i) => {
    const u = unit(sub(pts[(i - 1 + n) % n], p));
    const v = unit(sub(pts[(i + 1) % n], p));
    return deg(Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))));
  });
}

/**
 * The angles of a drawn polygon rounded to `step` so a question can use them,
 * with their total forced back to exactly (n − 2) × 180. The correction goes
 * on the corner whose rounding was furthest out, which keeps every printed
 * number as close to the drawing as the step allows.
 */
export function roundedAngles(pts, step) {
  const exact = interiorAngles(pts);
  const target = (pts.length - 2) * 180;
  const out = exact.map((a) => Math.round(a / step) * step);
  let diff = target - out.reduce((s, a) => s + a, 0);
  while (diff !== 0) {
    const dir = Math.sign(diff);
    let best = 0;
    let err = -Infinity;
    exact.forEach((a, i) => {
      const e = (a - out[i]) * dir;
      if (e > err) { err = e; best = i; }
    });
    out[best] += dir * step;
    diff -= dir * step;
  }
  return out;
}

/* ── drawing one ───────────────────────────────────────────────────────────*/

/**
 * The picture.
 *
 *   labels[i]    what to write in corner i — "52°", "x", "?" — or null for no
 *                arc at all. A corner with an arc and no text gets "" .
 *   letters      write A, B, C … outside the corners
 *   right        corner indices that get the square mark instead of an arc
 *   fan          draw the diagonals from this corner and shade the triangles
 *   centre       cut from a point in the middle instead, and mark the 360°
 *   mark         put a dot on this corner — "start here"
 *   ext          [{ at, label }] carry the side INTO corner `at` on past it,
 *                and mark the exterior angle that makes
 *   ticks        mark every side as equal (a regular polygon, or [i, j] sides)
 *   box          { w, h } in millimetres the figure must fit
 */
export function figureSvg(pts0, opts = {}) {
  const {
    labels = [], letters = false, right = [], fan = null, centre = false,
    mark = null, ext = [], ticks = null, box = { w: 70, h: 52 }, note = "",
    pad: padOpt = 7, thin = false,
  } = opts;
  const n = pts0.length;

  /* Everything that must fit — corners and the ends of any extended sides — is
     scaled together, so an exterior angle never runs off the paper. */
  const EXT_LEN = 34;
  const extEnds = ext.map(({ at }) => {
    const prev = pts0[(at - 1 + n) % n];
    return add(pts0[at], mul(unit(sub(pts0[at], prev)), EXT_LEN));
  });
  const all = [...pts0, ...extEnds];
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  /* Room round the shape for the corner letters and the angle labels. A
     thumbnail — the shapes in the pattern table — has neither, so it asks for
     almost none, and thinner lines: at that size a 0.7mm outline is a blob. */
  const pad = padOpt;
  const spanX = Math.max(...xs) - Math.min(...xs) || 1;
  const spanY = Math.max(...ys) - Math.min(...ys) || 1;
  const s = Math.min((box.w - 2 * pad) / spanX, (box.h - 2 * pad) / spanY);
  const tx = (p) => [(p[0] - Math.min(...xs)) * s + pad, (p[1] - Math.min(...ys)) * s + pad];
  const pts = pts0.map(tx);
  const ends = extEnds.map(tx);
  const W = spanX * s + 2 * pad;
  const H = spanY * s + 2 * pad + (note ? 4 : 0);
  const centroid = pts.reduce((a, p) => add(a, p), [0, 0]).map((v) => v / n);

  let body = "";

  /* the triangles a shape is cut into, shaded first so everything else is
     drawn on top of them */
  if (fan !== null) {
    for (let k = 1; k < n - 1; k++) {
      const tri = [pts[fan], pts[(fan + k) % n], pts[(fan + k + 1) % n]];
      body += `<polygon points="${tri.map((p) => p.map(f).join(",")).join(" ")}" fill="${FILLS[(k - 1) % 6]}" stroke="none"/>`;
    }
  }
  if (centre) {
    for (let k = 0; k < n; k++) {
      const tri = [centroid, pts[k], pts[(k + 1) % n]];
      body += `<polygon points="${tri.map((p) => p.map(f).join(",")).join(" ")}" fill="${FILLS[k % 6]}" stroke="none"/>`;
    }
  }

  /* the outline */
  body += `<polygon points="${pts.map((p) => p.map(f).join(",")).join(" ")}" fill="${fan === null && !centre ? "#fffdf8" : "none"}" stroke="${INK}" stroke-width="${thin ? 0.35 : 0.7}" stroke-linejoin="round"/>`;

  /* the cuts */
  if (fan !== null) {
    for (let k = 2; k < n - 1; k++) {
      const q = pts[(fan + k) % n];
      body += `<line x1="${f(pts[fan][0])}" y1="${f(pts[fan][1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${INK}" stroke-width="${thin ? 0.25 : 0.45}" stroke-dasharray="${thin ? "0.8 0.6" : "1.6 1.1"}"/>`;
    }
  }
  if (centre) {
    pts.forEach((q) => {
      body += `<line x1="${f(centroid[0])}" y1="${f(centroid[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${INK}" stroke-width="0.45" stroke-dasharray="1.6 1.1"/>`;
    });
    body += `<circle cx="${f(centroid[0])}" cy="${f(centroid[1])}" r="3.4" fill="none" stroke="${ARC}" stroke-width="0.5"/>`;
  }

  /* equal-side ticks */
  if (ticks) {
    const sides = ticks === true ? [...Array(n).keys()] : ticks;
    sides.forEach((i) => {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const m = mul(add(a, b), 0.5);
      const d = unit(sub(b, a));
      const nrm = [-d[1], d[0]];
      const p1 = add(m, mul(nrm, 1.6));
      const p2 = add(m, mul(nrm, -1.6));
      body += `<line x1="${f(p1[0])}" y1="${f(p1[1])}" x2="${f(p2[0])}" y2="${f(p2[1])}" stroke="${INK}" stroke-width="0.5"/>`;
    });
  }

  /* the extended sides and their exterior angles */
  ext.forEach(({ at, label }, j) => {
    const V = pts[at];
    const E = ends[j];
    body += `<line x1="${f(V[0])}" y1="${f(V[1])}" x2="${f(E[0])}" y2="${f(E[1])}" stroke="${INK}" stroke-width="0.7" stroke-dasharray="2.2 1.2"/>`;
    const u = unit(sub(E, V));
    const v = unit(sub(pts[(at + 1) % n], V));
    body += arc(V, u, v, 6.5, EXT);
    /* The outside arc is drawn bigger than an inside one so the two never
       overlap at a shared corner — so its label has to sit further out too,
       or it lands on its own arc. */
    if (label !== undefined && label !== null) body += angleText(V, u, v, label, EXT, 10.5);
  });

  /* the interior angles. A corner that IS a right angle gets the square it is
     entitled to even if the caller did not ask — an arc on a 90° corner is a
     small lie about what kind of corner it is. Only exact right angles: the
     approximate shapes marked "not drawn accurately" never qualify. */
  const actual = interiorAngles(pts0);
  pts.forEach((V, i) => {
    const text = labels[i];
    if (text === undefined || text === null) return;
    const u = unit(sub(pts[(i - 1 + n) % n], V));
    const v = unit(sub(pts[(i + 1) % n], V));
    const isRight = right.includes(i) || (!note && Math.abs(actual[i] - 90) < 1e-6);
    body += isRight ? square(V, u, v) : arc(V, u, v, 5, ARC);
    if (text !== "") body += angleText(V, u, v, text, INK);
  });

  /* corner letters, outside the shape */
  if (letters) {
    pts.forEach((V, i) => {
      const u = unit(sub(pts[(i - 1 + n) % n], V));
      const v = unit(sub(pts[(i + 1) % n], V));
      const out = unit(mul(add(u, v), -1));
      const p = add(V, mul(out, 4.2));
      body += `<text x="${f(p[0])}" y="${f(p[1] + 1.3)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.8" font-weight="700" fill="${INK}">${String.fromCharCode(65 + i)}</text>`;
    });
  }

  if (mark !== null) {
    const V = pts[mark];
    body += `<circle cx="${f(V[0])}" cy="${f(V[1])}" r="1.5" fill="${ARC}"/>`;
  }

  if (note) {
    body += `<text x="${f(W / 2)}" y="${f(H - 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.6" fill="#8f887c" font-style="italic">${note}</text>`;
  }

  return (
    `<svg viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" class="gw-fig" role="img" ` +
    /* the corners, for the on-screen layer to snap lines and the protractor to */
    `data-pts="${pts.map((p) => p.map(f).join(",")).join(" ")}"${mark !== null ? ` data-mark="${mark}"` : ""} ` +
    `aria-label="A shape with ${n} sides">${body}</svg>`
  );
}

/* ── the little pieces ─────────────────────────────────────────────────────*/

/** An arc in the corner between directions u and v, on the inside. */
function arc(V, u, v, r, col) {
  const a = add(V, mul(u, r));
  const b = add(V, mul(v, r));
  const cross = u[0] * v[1] - u[1] * v[0];
  return `<path d="M${f(a[0])} ${f(a[1])} A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${f(b[0])} ${f(b[1])}" fill="none" stroke="${col}" stroke-width="0.55"/>`;
}

/** The square a right angle is entitled to instead of an arc. */
function square(V, u, v) {
  const s = 3.6;
  const a = add(V, mul(u, s));
  const b = add(add(V, mul(u, s)), mul(v, s));
  const c = add(V, mul(v, s));
  return `<polyline points="${f(a[0])},${f(a[1])} ${f(b[0])},${f(b[1])} ${f(c[0])},${f(c[1])}" fill="none" stroke="${ARC}" stroke-width="0.55"/>`;
}

/**
 * The angle written inside its corner, along the bisector. Further in for a
 * narrow corner — a 25° angle has no room for "25°" close to its point.
 */
function angleText(V, u, v, text, col, min = 0) {
  const bis = unit(add(u, v));
  const half = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))) / 2;
  /* A label four characters wide ("110°") needs to sit further in than a
     single "x" does, or its ends reach the two sides of a wide corner. */
  const floor = Math.max(min, String(text).length > 2 ? 9.6 : 7.4);
  const d = Math.min(15, Math.max(floor, 4.4 / Math.max(Math.sin(half), 0.05)));
  const p = add(V, mul(bis, d));
  return `<text x="${f(p[0])}" y="${f(p[1] + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.4" font-weight="700" fill="${col}">${text}</text>`;
}

/* ── the three torn corners, fitted together on a line ────────────────────*/

/**
 * The picture that IS the proof: three wedges of the three corners laid side
 * by side along a straight line, meeting at a point. Used in the worked
 * example of the tearing activity, so the child knows what they are aiming
 * for before they pick up the scissors.
 */
export function cornersOnLine(A, B, C) {
  const R = 16;
  const O = [R + 4, R + 4];
  const cols = ["#f4c95d", "#6fb7e8", "#7cc47c"];
  let start = 0;
  let body = `<line x1="1" y1="${O[1]}" x2="${2 * R + 7}" y2="${O[1]}" stroke="${INK}" stroke-width="0.7"/>`;
  [A, B, C].forEach((a, i) => {
    const p0 = [O[0] + R * Math.cos(rad(180 + start)), O[1] + R * Math.sin(rad(180 + start))];
    const p1 = [O[0] + R * Math.cos(rad(180 + start + a)), O[1] + R * Math.sin(rad(180 + start + a))];
    body += `<path d="M${f(O[0])} ${f(O[1])} L${f(p0[0])} ${f(p0[1])} A${R} ${R} 0 0 1 ${f(p1[0])} ${f(p1[1])} Z" fill="${cols[i]}" stroke="${INK}" stroke-width="0.45"/>`;
    const m = rad(180 + start + a / 2);
    const t = [O[0] + R * 0.62 * Math.cos(m), O[1] + R * 0.62 * Math.sin(m)];
    body += `<text x="${f(t[0])}" y="${f(t[1] + 1.1)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3" font-weight="700" fill="${INK}">${a}°</text>`;
    start += a;
  });
  body += `<circle cx="${f(O[0])}" cy="${f(O[1])}" r="0.9" fill="${INK}"/>`;
  const W = 2 * R + 8;
  const H = R + 8;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W * 1.4}mm" height="${H * 1.4}mm" class="gw-fig" role="img" aria-label="Three corners making a straight line">${body}</svg>`;
}

/**
 * A triangle to cut out, each corner shaded its own colour with a dashed tear
 * line across it, so the three pieces are unmistakable once they are loose.
 */
export function tearTriangle(A, B, C, { tilt = 0 } = {}) {
  const pts0 = trianglePoints(A, B, C, { tilt });
  const box = { w: 110, h: 64 };
  const xs = pts0.map((p) => p[0]);
  const ys = pts0.map((p) => p[1]);
  const pad = 6;
  const s = Math.min((box.w - 2 * pad) / (Math.max(...xs) - Math.min(...xs)), (box.h - 2 * pad) / (Math.max(...ys) - Math.min(...ys)));
  const pts = pts0.map((p) => [(p[0] - Math.min(...xs)) * s + pad, (p[1] - Math.min(...ys)) * s + pad]);
  const W = (Math.max(...xs) - Math.min(...xs)) * s + 2 * pad;
  const H = (Math.max(...ys) - Math.min(...ys)) * s + 2 * pad;
  const cols = ["#f4c95d", "#6fb7e8", "#7cc47c"];

  let body = `<polygon points="${pts.map((p) => p.map(f).join(",")).join(" ")}" fill="#fffdf8" stroke="${INK}" stroke-width="0.7" stroke-dasharray="2 1"/>`;
  pts.forEach((V, i) => {
    const u = unit(sub(pts[(i + 2) % 3], V));
    const v = unit(sub(pts[(i + 1) % 3], V));
    const r = 13;
    const a = add(V, mul(u, r));
    const b = add(V, mul(v, r));
    const cross = u[0] * v[1] - u[1] * v[0];
    body += `<path d="M${f(V[0])} ${f(V[1])} L${f(a[0])} ${f(a[1])} A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${f(b[0])} ${f(b[1])} Z" fill="${cols[i]}" fill-opacity="0.75" stroke="none"/>`;
    body += `<path d="M${f(a[0])} ${f(a[1])} A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${f(b[0])} ${f(b[1])}" fill="none" stroke="${INK}" stroke-width="0.4" stroke-dasharray="1.2 0.9"/>`;
    const bis = unit(add(u, v));
    const t = add(V, mul(bis, 7));
    body += `<text x="${f(t[0])}" y="${f(t[1] + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="700" fill="${INK}">${String.fromCharCode(65 + i)}</text>`;
  });
  return `<svg viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" class="gw-fig" role="img" aria-label="A triangle to cut out, with its corners marked">${body}</svg>`;
}

/** A straight line with a dot in the middle, to stick the three corners on. */
export function pasteLine() {
  return (
    `<svg viewBox="0 0 90 16" width="90mm" height="16mm" class="gw-fig" role="img" aria-label="A straight line to stick the corners on">` +
    `<line x1="2" y1="13" x2="88" y2="13" stroke="${INK}" stroke-width="0.7"/>` +
    `<circle cx="45" cy="13" r="1.1" fill="${ARC}"/>` +
    `<text x="45" y="5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3" fill="#6b655c">stick the three points on this dot</text>` +
    `</svg>`
  );
}

/* ── names ─────────────────────────────────────────────────────────────────*/

export const NAMES = {
  3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon", 7: "heptagon",
  8: "octagon", 9: "nonagon", 10: "decagon", 11: "hendecagon", 12: "dodecagon",
};

/** "an octagon", "a hexagon" — the article follows the sound. */
export const aName = (n) => (/^[aeiou]/.test(NAMES[n]) ? "an " : "a ") + NAMES[n];
