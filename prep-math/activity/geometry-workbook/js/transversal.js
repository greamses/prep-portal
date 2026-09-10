/* ============================================================================
   Geometry Workbook — parallel lines and the lines that cross them
   ----------------------------------------------------------------------------
   Every figure in chapter two is built here: parallel lines with their arrow
   marks, a transversal (or two) crossing them, the eight angles that makes,
   and the triangles that sit between a pair of parallels.

   THE NUMBERING IS THE STUDIO'S. At each crossing, 1 is top-left, 2 top-right,
   3 bottom-left and 4 bottom-right; the second crossing carries on 5 to 8 in
   the same positions. That is the numbering on the Transversals studio's
   figure, so a child who has watched corresponding angles slide down the
   transversal on screen meets the same ∠1 and ∠5 on paper.

   THE WHOLE CHAPTER RESTS ON ONE FACT, and the drawing makes it checkable:
   across parallel lines every angle is either THE acute one or THE obtuse one.
   Angles 1, 4, 5, 8 are one family and 2, 3, 6, 7 the other — same family
   means equal, different family means they add to 180°. So the figure is
   built from a single number, φ, the angle the transversal makes with the
   parallels, and every one of the eight angles is φ or 180 − φ exactly.

   Everything is millimetres and fixed hexes, like the rest of the paper.
   ========================================================================== */

const INK = "#2a2723";
const ARC = "#c0453f";
const SHADE = "#f4c95d";
const TRANS = "#2f6ea8";
const PARA = "#2a2723";

const rad = (d) => (d * Math.PI) / 180;
const f = (n) => n.toFixed(2);

/* Screen direction of a maths angle (anticlockwise from "right", y down). */
const dir = (a) => [Math.cos(rad(a)), -Math.sin(rad(a))];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];

/* ── the eight angles ──────────────────────────────────────────────────────*/

/**
 * Position 1..4 at a crossing, as the maths angles it runs between, for a
 * transversal at φ to the parallels. TL = 1, TR = 2, BL = 3, BR = 4. `base`
 * is the direction of the line being crossed — 0 for a parallel, the skew for
 * a line that has been turned so it is not parallel any more.
 */
function sector(pos, phi, base = 0) {
  return {
    1: [phi, 180 + base],
    2: [base, phi],
    3: [180 + base, 180 + phi],
    4: [180 + phi, 360 + base],
  }[pos];
}

/** The true size of angle n in a figure whose second line is turned by skew. */
export function drawnSize(n, phi, skew = 0) {
  const c = Math.floor((n - 1) / 4);
  const [a0, a1] = sector(((n - 1) % 4) + 1, phi, c === 1 ? skew : 0);
  return a1 - a0;
}

/** The size of angle n (1..4 at the first crossing, 5..8 at the second …). */
export function angleSize(n, phi) {
  const pos = ((n - 1) % 4) + 1;
  return pos === 1 || pos === 4 ? 180 - phi : phi;
}

/** Which family an angle is in: A = {1,4,5,8…}, B = {2,3,6,7…}. */
export const familyOf = (n) => ([1, 4].includes(((n - 1) % 4) + 1) ? "A" : "B");

/* The named pairs, exactly as the studio names them. */
export const PAIRS = {
  vert: [[1, 4], [2, 3], [5, 8], [6, 7]],
  corr: [[1, 5], [2, 6], [3, 7], [4, 8]],
  altInt: [[3, 6], [4, 5]],
  altExt: [[1, 8], [2, 7]],
  coInt: [[3, 5], [4, 6]],
  coExt: [[1, 7], [2, 8]],
};

/** The partner of angle n in a relationship, or null. */
export function partner(rel, n) {
  for (const [a, b] of PAIRS[rel]) {
    if (a === n) return b;
    if (b === n) return a;
  }
  return null;
}

export const INTERIOR = [3, 4, 5, 6];
export const isInterior = (n) => INTERIOR.includes(n);
/* Left of the transversal: the two left-hand positions at each crossing. */
export const isLeft = (n) => [1, 3].includes(((n - 1) % 4) + 1);

/* ── a tiny scene graph, scaled to fit at the end ──────────────────────────
   Lines are collected in figure units and everything that is a MARK — a
   wedge, a number, an arrow — is anchored to a figure point but sized in
   millimetres, so a figure squeezed into half a column keeps readable labels. */

function scene() {
  /* pts: the points a line can be ruled to or a protractor dropped on — the
     crossings, the corners — written onto the SVG for interactive.js */
  return { lines: [], marks: [], pts: [] };
}

/* Roughly where a mark reaches, in mm round its anchor: [left, top, right, bottom]. */
function reach(m, p, rot) {
  if (m.kind === "text") {
    const q = add(p, mul(dir(m.a - rot), m.d));
    const hw = String(m.text).length * m.size * 0.31;
    return [q[0] - hw, q[1] - m.size * 0.55, q[0] + hw, q[1] + m.size * 0.55];
  }
  if (m.kind === "dot") p = dotAt(m, p, rot);
  const r = m.kind === "wedge" ? m.r : m.kind === "arrow" ? 2.2 : m.r || 1;
  return [p[0] - r, p[1] - r, p[0] + r, p[1] + r];
}

/* A dot may sit a set distance (mm) out along a direction from its anchor. */
const dotAt = (m, p, rot) => (m.off ? add(p, mul(dir(m.off.a - rot), m.off.d)) : p);

/*
 * The lines are scaled to fill the box; the labels are not scaled at all. So
 * a label can stick out past the lines — a long "3x + 10°" in an angle at the
 * edge — and a viewBox cut to the lines would crop it. The padding on each
 * side is grown until every mark is inside, and the lines shrink to make room.
 */
function render(sc, box, { rot = 0, pad = 3 } = {}) {
  const t = rad(rot);
  const R = ([x, y]) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)];
  const pts = sc.lines.flatMap((l) => [R(l.a), R(l.b)]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX || 1;
  const spanY = Math.max(...ys) - minY || 1;

  const P = { l: pad, r: pad, t: pad, b: pad };
  let s = 1;
  let T = null;
  let W = 0;
  let H = 0;
  for (let k = 0; k < 5; k++) {
    s = Math.min((box.w - P.l - P.r) / spanX, (box.h - P.t - P.b) / spanY);
    const at = { ...P };
    T = (p) => {
      const [x, y] = R(p);
      return [(x - minX) * s + at.l, (y - minY) * s + at.t];
    };
    W = spanX * s + P.l + P.r;
    H = spanY * s + P.t + P.b;
    const ext = sc.marks.map((m) => reach(m, T(m.at), rot));
    const need = {
      l: Math.max(0, 1 - Math.min(...ext.map((e) => e[0]))),
      t: Math.max(0, 1 - Math.min(...ext.map((e) => e[1]))),
      r: Math.max(0, Math.max(...ext.map((e) => e[2])) - (W - 1)),
      b: Math.max(0, Math.max(...ext.map((e) => e[3])) - (H - 1)),
    };
    if (!sc.marks.length || Object.values(need).every((v) => v < 0.05)) break;
    Object.keys(need).forEach((side) => { P[side] += need[side]; });
  }

  /* Two arcs side by side at one crossing would run into each other and read
     as one circle; with more than one arc at a point each is drawn a little
     short of the lines, so every angle is its own mark. */
  const arcsAt = {};
  sc.marks.forEach((m) => { if (m.kind === "wedge" && m.arc) arcsAt[m.at.join()] = (arcsAt[m.at.join()] || 0) + 1; });

  let body = "";
  /* shaded wedges first, so the lines are drawn over them */
  sc.marks.filter((m) => m.kind === "wedge" && m.fill).forEach((m) => { body += wedge(T(m.at), m.a0 - rot, m.a1 - rot, m.r, m.fill, null); });
  sc.lines.forEach((l) => {
    const a = T(l.a);
    const b = T(l.b);
    body += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${l.col || INK}" stroke-width="${l.w || 0.7}" stroke-linecap="round"${l.dash ? ` stroke-dasharray="${l.dash}"` : ""}/>`;
  });
  sc.marks.forEach((m) => {
    const p = T(m.at);
    if (m.kind === "wedge" && m.arc) {
      const trim = arcsAt[m.at.join()] > 1 && m.a1 - m.a0 >= 24 ? 6 : 0;
      body += wedge(p, m.a0 - rot + trim, m.a1 - rot - trim, m.r, null, m.arc);
    }
    if (m.kind === "text") {
      const q = add(p, mul(dir(m.a - rot), m.d));
      body += `<text x="${f(q[0])}" y="${f(q[1] + m.size * 0.36)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="${m.size}" font-weight="700" fill="${m.col || INK}">${m.text}</text>`;
    }
    if (m.kind === "arrow") body += chevron(p, m.a - rot, m.count || 1);
    if (m.kind === "dot") {
      const q = dotAt(m, p, rot);
      body += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${m.r || 1}" fill="${m.col || INK}"/>`;
    }
  });
  /* The rotation is applied to the marks by turning their ANGLES back the other
     way: `dir()` works in screen space after the points are rotated, and a
     rotation of the figure by rot turns every direction by −rot on screen. */
  const ptsAttr = sc.pts.length ? ` data-pts="${sc.pts.map((p) => T(p).map(f).join(",")).join(" ")}"` : "";
  const par = sc.lines.filter((l) => l.par);
  const parAttr = par.length ? ` data-par="${par.map((l) => [...T(l.a), ...T(l.b)].map(f).join(",")).join(";")}"` : "";
  return (
    `<svg viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" class="gw-fig" role="img"${ptsAttr}${parAttr} ` +
    `aria-label="Lines and the angles between them">${body}</svg>`
  );
}

function wedge(c, a0, a1, r, fill, stroke) {
  const p0 = add(c, mul(dir(a0), r));
  const p1 = add(c, mul(dir(a1), r));
  const large = a1 - a0 > 180 ? 1 : 0;
  if (fill) {
    return `<path d="M${f(c[0])} ${f(c[1])} L${f(p0[0])} ${f(p0[1])} A${r} ${r} 0 ${large} 0 ${f(p1[0])} ${f(p1[1])} Z" fill="${fill}" fill-opacity="0.85" stroke="none"/>`;
  }
  return `<path d="M${f(p0[0])} ${f(p0[1])} A${r} ${r} 0 ${large} 0 ${f(p1[0])} ${f(p1[1])}" fill="none" stroke="${stroke}" stroke-width="0.5"/>`;
}

/**
 * How far out along its bisector an angle's label sits, in mm. A narrow angle
 * pushes its label further out, where the wedge has widened enough to hold
 * it, and a long label ("3x + 10°") goes further still.
 */
function labelDist(size, text, font = 3.3) {
  const n = String(text).length;
  const base = (size < 45 ? 8.5 : size < 70 ? 7.4 : 6.6) + Math.max(0, n - 2) * (size < 70 ? 1.3 : 0.8);
  /* and far enough out that the wedge is wider than the label there */
  const half = n * font * 0.31 + 0.7;
  return Math.min(18, Math.max(base, half / Math.tan(rad(Math.min(size, 170) / 2))));
}

/** The arrow marks that say two lines are parallel — ">" drawn on the line. */
function chevron(p, a, count) {
  const d = dir(a);
  const n = [-d[1], d[0]];
  let out = "";
  for (let k = 0; k < count; k++) {
    const tip = add(p, mul(d, 1.6 + k * 1.8));
    const b1 = add(add(tip, mul(d, -2.2)), mul(n, 1.5));
    const b2 = add(add(tip, mul(d, -2.2)), mul(n, -1.5));
    out += `<polyline points="${f(b1[0])},${f(b1[1])} ${f(tip[0])},${f(tip[1])} ${f(b2[0])},${f(b2[1])}" fill="none" stroke="${INK}" stroke-width="0.55" stroke-linejoin="round"/>`;
  }
  return out;
}

/* ── the figures ───────────────────────────────────────────────────────────*/

/**
 * `lines` parallel lines crossed by one transversal at φ.
 *
 *   numbers   write 1..8 (or 1..12) in every angle
 *   labels    { angleNumber: "55°" | "x" | "" } — an arc and a label
 *   shade     angle numbers to fill in (a pair to name, one to sort)
 *   arrows    the parallel marks (off when "are these parallel?" is the question)
 *   skew      degrees to turn the SECOND line — for lines that are not parallel
 *   names     letters for the lines, for "which line is the transversal?"
 *   bare      the parallels only, for a child to draw the transversal on
 *   plain     the transversal in ink, not blue — when finding it is the question
 *   dots      a dot in every angle, for "count the angles"
 */
export function transversalSvg({
  phi = 55, lines = 2, numbers = false, labels = {}, shade = [], arrows = true,
  skew = 0, rot = 0, names = null, box = { w: 80, h: 58 }, bare = false, plain = false,
  dots = false,
} = {}) {
  const gap = 30;
  const cot = Math.cos(rad(phi)) / Math.sin(rad(phi));
  const xs = Array.from({ length: lines }, (_, c) => (-c + (lines - 1) / 2) * gap * cot);
  const sc = scene();
  const span = 24;
  const lo = Math.min(...xs) - span;
  const hi = Math.max(...xs) + span;

  /* the parallels */
  for (let c = 0; c < lines; c++) {
    const y = c * gap;
    let a = [lo, y];
    let b = [hi, y];
    if (c === 1 && skew) {
      /* turned about its crossing point, so the transversal still crosses it
         at the same place — only the line's direction changes */
      const cx = xs[c];
      const t = rad(skew);
      a = [cx + (lo - cx) * Math.cos(t), y - (lo - cx) * Math.sin(t)];
      b = [cx + (hi - cx) * Math.cos(t), y - (hi - cx) * Math.sin(t)];
    }
    sc.lines.push({ a, b, col: PARA, par: true });
    if (!bare) sc.pts.push([xs[c], y]);
    if (arrows && !skew) sc.marks.push({ kind: "arrow", at: [hi - 10, y], a: 0, count: 1 });
    if (names) sc.marks.push({ kind: "text", at: [hi, y], a: 0, d: 3.2, text: names[c], size: 3.6, col: INK });
  }

  /* the transversal, running on past the first and last lines so each
     crossing has four whole angles round it. Left off altogether when the
     question is "draw your own". */
  if (!bare) {
    const up = dir(phi);
    const last = lines - 1;
    const top = [xs[0] + up[0] * 15, up[1] * 15];
    const bottom = [xs[last] - up[0] * 15, last * gap - up[1] * 15];
    /* plain: in ink like the others, when picking it out IS the question */
    const col = plain ? INK : TRANS;
    sc.lines.push({ a: top, b: bottom, col, w: plain ? 0.7 : 0.8 });
    if (names) sc.marks.push({ kind: "text", at: top, a: phi, d: 3.4, text: names[lines], size: 3.6, col });
  }

  /* the angles */
  for (let c = 0; c < lines; c++) {
    const at = [xs[c], c * gap];
    for (let pos = 1; pos <= 4; pos++) {
      const n = c * 4 + pos;
      const [a0, a1] = sector(pos, phi, c === 1 ? skew : 0);
      const mid = (a0 + a1) / 2;
      const size = a1 - a0;
      if (shade.includes(n)) sc.marks.push({ kind: "wedge", at, a0, a1, r: 6.5, fill: SHADE });
      if (dots) {
        /* one dot inside every angle, to be counted */
        sc.marks.push({ kind: "dot", at, r: 1.1, col: ARC, off: { a: mid, d: size < 45 ? 6.5 : 4.5 } });
      } else if (numbers) {
        sc.marks.push({ kind: "text", at, a: mid, d: size < 45 ? 7.8 : 5.4, text: String(n), size: 3.3 });
      } else if (labels[n] !== undefined) {
        sc.marks.push({ kind: "wedge", at, a0, a1, r: 4.2, arc: ARC });
        if (labels[n] !== "") {
          sc.marks.push({ kind: "text", at, a: mid, d: labelDist(size, labels[n]), text: labels[n], size: 3.3 });
        }
      }
    }
  }
  return render(sc, box, { rot });
}

/**
 * Two lines crossing at a point — the only figure vertically opposite angles
 * need. `a` is one of the four angles; the rest follow.
 */
export function crossingSvg(a, { labels = {}, rot = 0, box = { w: 62, h: 46 } } = {}) {
  const sc = scene();
  const L = 30;
  sc.lines.push({ a: mul(dir(0), -L), b: mul(dir(0), L) });
  sc.lines.push({ a: mul(dir(a), -L), b: mul(dir(a), L), col: TRANS, w: 0.8 });
  sc.pts.push([0, 0]);
  /* positions round the point, anticlockwise from the right: 1 = [0,a],
     2 = [a,180], 3 = [180,180+a], 4 = [180+a,360] */
  const sectors = { 1: [0, a], 2: [a, 180], 3: [180, 180 + a], 4: [180 + a, 360] };
  Object.entries(labels).forEach(([k, text]) => {
    const [a0, a1] = sectors[k];
    sc.marks.push({ kind: "wedge", at: [0, 0], a0, a1, r: 4.4, arc: ARC });
    sc.marks.push({ kind: "text", at: [0, 0], a: (a0 + a1) / 2, d: labelDist(a1 - a0, text) + 0.4, text, size: 3.4 });
  });
  return render(sc, box, { rot });
}

/**
 * Two transversals across two parallels — the "multiple transversals" figure.
 * Angles are keyed "t.n": transversal t (0 or 1), angle n (1..8) in the usual
 * numbering for that transversal.
 */
export function twoTransversalsSvg(phis, { labels = {}, box = { w: 118, h: 58 } } = {}) {
  const gap = 28;
  const sc = scene();
  const starts = [-28, 28];
  const xsOf = (t) => [0, 1].map((c) => starts[t] - c * gap * (Math.cos(rad(phis[t])) / Math.sin(rad(phis[t]))));
  const allX = [...xsOf(0), ...xsOf(1)];
  const lo = Math.min(...allX) - 22;
  const hi = Math.max(...allX) + 22;
  for (let c = 0; c < 2; c++) {
    sc.lines.push({ a: [lo, c * gap], b: [hi, c * gap] });
    sc.marks.push({ kind: "arrow", at: [hi - 8, c * gap], a: 0, count: 1 });
  }
  [0, 1].forEach((t) => {
    const xs = xsOf(t);
    const up = dir(phis[t]);
    sc.lines.push({ a: [xs[0] + up[0] * 16, up[1] * 16], b: [xs[1] - up[0] * 16, gap - up[1] * 16], col: TRANS, w: 0.8 });
    sc.pts.push([xs[0], 0], [xs[1], gap]);
    for (let c = 0; c < 2; c++) {
      for (let pos = 1; pos <= 4; pos++) {
        const n = c * 4 + pos;
        const text = labels[`${t}.${n}`];
        if (text === undefined) continue;
        const [a0, a1] = sector(pos, phis[t]);
        sc.marks.push({ kind: "wedge", at: [xs[c], c * gap], a0, a1, r: 4.2, arc: ARC });
        sc.marks.push({ kind: "text", at: [xs[c], c * gap], a: (a0 + a1) / 2, d: labelDist(a1 - a0, text), text, size: 3.3 });
      }
    }
  });
  return render(sc, box);
}

/**
 * A triangle between two parallels: its top corner on the upper line, its
 * base along the lower one. `p` and `q` are the angles the two sides make
 * with the UPPER line, left and right of the top corner.
 *
 * Labels are keyed by where they sit: "pL" / "pR" the two angles outside the
 * triangle at the top, "top" the triangle's own top angle, "bL" / "bR" its
 * two base angles. Drawn this way round it is also the picture that proves a
 * triangle's angles make 180° — the three at the top lie on a straight line,
 * and the two outer ones are alternate to the two at the base.
 */
export function triangleBetweenSvg(p, q, { labels = {}, box = { w: 70, h: 50 } } = {}) {
  const h = 40;
  const apex = [0, 0];
  const cotp = Math.cos(rad(p)) / Math.sin(rad(p));
  const cotq = Math.cos(rad(q)) / Math.sin(rad(q));
  const bL = [-h * cotp, h];
  const bR = [h * cotq, h];
  const lo = Math.min(bL[0], -30) - 16;
  const hi = Math.max(bR[0], 30) + 16;
  const sc = scene();
  sc.lines.push({ a: [lo, 0], b: [hi, 0] });
  sc.lines.push({ a: [lo, h], b: [hi, h] });
  sc.marks.push({ kind: "arrow", at: [hi - 8, 0], a: 0 });
  sc.marks.push({ kind: "arrow", at: [hi - 8, h], a: 0 });
  sc.lines.push({ a: apex, b: bL, col: TRANS, w: 0.8 });
  sc.lines.push({ a: apex, b: bR, col: TRANS, w: 0.8 });
  sc.lines.push({ a: bL, b: bR, w: 0.9 });
  sc.pts.push(apex, bL, bR);

  const put = (key, at, a0, a1) => {
    const text = labels[key];
    if (text === undefined) return;
    sc.marks.push({ kind: "wedge", at, a0, a1, r: 4.2, arc: ARC });
    if (text === "") return;
    sc.marks.push({ kind: "text", at, a: (a0 + a1) / 2, d: labelDist(a1 - a0, text), text, size: 3.3 });
  };
  /* at the top corner, anticlockwise: the right side leaves at 360 − q, the
     left side at 180 + p */
  put("pL", apex, 180, 180 + p);
  put("top", apex, 180 + p, 360 - q);
  put("pR", apex, 360 - q, 360);
  put("bL", bL, 0, p);
  put("bR", bR, 180 - q, 180);
  return render(sc, box);
}

/**
 * A square dot grid with one segment drawn on it and a dot P — "draw a line
 * through P parallel to this one". The grid is the ruler: going across three
 * and up two from P is the same direction as the segment, and a child who
 * counts the dots does not have to judge "the same slope" by eye.
 */
export function dotGridSvg({ cols = 11, rows = 8, segs = [], names = [], P = null }) {
  const s = 6;
  const m = 5; // room round the dots for a name or a P at the edge
  const W = (cols - 1) * s + 2 * m;
  const H = (rows - 1) * s + 2 * m;
  let body = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) body += `<circle cx="${c * s + m}" cy="${r * s + m}" r="0.45" fill="#8f887c"/>`;
  }
  const q = (p) => [p[0] * s + m, p[1] * s + m];
  const drawn = segs.map(([a, b]) => [q(a), q(b)]);
  /* How close a point comes to any drawn segment — a label is placed where
     this is largest, so it never sits on a line. */
  const clear = (pt) => Math.min(...drawn.map(([a, b]) => {
    const d = [b[0] - a[0], b[1] - a[1]];
    const t = Math.max(0, Math.min(1, ((pt[0] - a[0]) * d[0] + (pt[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2 || 1)));
    return Math.hypot(pt[0] - a[0] - t * d[0], pt[1] - a[1] - t * d[1]);
  }), 99);
  const inside = (pt) => pt[0] > 2 && pt[0] < W - 2 && pt[1] > 2.5 && pt[1] < H - 2;
  const best = (cands) => cands.filter(inside).sort((u, v) => clear(v) - clear(u))[0] || cands[0];
  const label = (pt, text, col) =>
    `<text x="${f(pt[0])}" y="${f(pt[1] + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.4" font-weight="700" fill="${col}">${text}</text>`;

  drawn.forEach(([a, b], k) => {
    const col = k ? TRANS : INK;
    body += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${col}" stroke-width="0.8" stroke-linecap="round"/>`;
    [a, b].forEach((e) => { body += `<circle cx="${e[0]}" cy="${e[1]}" r="0.9" fill="${col}"/>`; });
  });
  drawn.forEach(([a, b], k) => {
    if (!names[k]) return;
    /* off the middle of the segment, square to it, on whichever side is clear */
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nrm = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const at = best([1, -1].map((sg) => [mid[0] + sg * nrm[0] * 3.6, mid[1] + sg * nrm[1] * 3.6]));
    body += label(at, names[k], k ? TRANS : INK);
  });
  if (P) {
    const pp = q(P);
    body += `<circle cx="${pp[0]}" cy="${pp[1]}" r="1.2" fill="${ARC}"/>`;
    const at = best([[3, -2.6], [-3, -2.6], [3, 3], [-3, 3]].map(([dx, dy]) => [pp[0] + dx, pp[1] + dy]));
    body += label(at, "P", ARC);
  }
  const dots = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dots.push(`${c * s + m},${r * s + m}`);
  return (
    `<svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" class="gw-fig" role="img" ` +
    `data-grid="${cols},${rows}" data-pts="${dots.join(" ")}" ` +
    `aria-label="A dot grid with a line and a point P">${body}</svg>`
  );
}
