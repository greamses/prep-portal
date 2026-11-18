/* ═══════════════════════════════════════════════════════
   DRILLS — a diagram for a geometry question (geometry.js), as an SVG string.
   Read from the question itself: the hint says what it is, the text carries
   the numbers. NOT to scale, but looking as it should (the user): proportions
   follow the numbers, softened so nothing is a sliver or a square that should
   not be; the labels carry the true values, the unknown marked x or ?. Light strokes for a dark screen (the Math Bee's TV);
   colours come from --geo-line / --geo-fill / --geo-label if a page sets them.
   geoFigure(q) -> '<svg …>' or '' when the question has no figure.
═══════════════════════════════════════════════════════ */

const R = Math.PI / 180;
const LINE = 'var(--geo-line, #d8e8ff)', FILL = 'var(--geo-fill, rgba(140, 200, 255, 0.10))', LABEL = 'var(--geo-label, #f6dc85)';
const nums = (s) => (String(s).replace(/[−–]/g, '-').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
function varsOf(t) {
  const v = {};
  for (const m of String(t).matchAll(/\b([a-zA-Z])\s*=\s*(\d+(?:\.\d+)?)/g)) v[m[1]] = Number(m[2]);
  return v;
}
const f1 = (n) => Math.round(n * 10) / 10;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
/* the drawing's width : height from the real ones, kept between lo and hi, and visibly unequal when they are */
function shape(w, h, lo, hi) {
  let r = clamp(w / (h || 1), lo, hi);
  if (w !== h && Math.abs(r - 1) < 0.25) r = w > h ? 1.25 : 0.8;
  return [r, 1];
}
/* angles that add up to `total`, drawn no smaller than `min` (bigger ones still look bigger) */
function softAngles(list, min, total) {
  const a = list.map((x) => Math.max(min, x));
  const k = total / a.reduce((s, x) => s + x, 0);
  return a.map((x) => x * k);
}

/* ── drawing pieces (viewBox 0 0 160 110) ── */
const svg = (body) => `<svg class="geo-fig" viewBox="-22 -8 204 126" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="font-family: var(--font-mono)">${body}</svg>`;
const poly = (pts, extra = '') => `<polygon points="${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ')}" fill="${FILL}" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round" ${extra}/>`;
const line = (a, b, extra = '') => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${LINE}" stroke-width="1.6" stroke-linecap="round" ${extra}/>`;
const dashed = (a, b) => line(a, b, 'stroke-dasharray="3 3" stroke-width="1.2"');
const label = (p, text, size = 10, anchor = 'middle') => `<text x="${f1(p[0])}" y="${f1(p[1])}" font-size="${f1(size * 1.25)}" font-weight="700" text-anchor="${anchor}" dominant-baseline="middle" fill="${LABEL}">${text}</text>`;
const dot = (p) => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="1.8" fill="${LINE}"/>`;
// a small right-angle box at corner c, between the directions to a and to b
function rightMark(c, a, b, s = 7) {
  const u = unit(c, a), v = unit(c, b);
  const p1 = [c[0] + u[0] * s, c[1] + u[1] * s], p3 = [c[0] + v[0] * s, c[1] + v[1] * s];
  const p2 = [p1[0] + v[0] * s, p1[1] + v[1] * s];
  return `<polyline points="${f1(p1[0])},${f1(p1[1])} ${f1(p2[0])},${f1(p2[1])} ${f1(p3[0])},${f1(p3[1])}" fill="none" stroke="${LINE}" stroke-width="1.1"/>`;
}
function unit(a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }
// an arc at c from direction angle a1 to a2 (degrees, measured anticlockwise on screen)
function arc(c, r, a1, a2) {
  const p = (a) => [c[0] + r * Math.cos(a * R), c[1] - r * Math.sin(a * R)];
  const [s, e] = [p(a1), p(a2)];
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `<path d="M${f1(s[0])} ${f1(s[1])} A${r} ${r} 0 ${large} 0 ${f1(e[0])} ${f1(e[1])}" fill="none" stroke="${LABEL}" stroke-width="1.1" opacity="0.85"/>`;
}
const at = (c, r, a) => [c[0] + r * Math.cos(a * R), c[1] - r * Math.sin(a * R)];
// fit points into the box (keeping the shape), returning a mapper
function fitter(pts, box = [14, 12, 146, 96]) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs) || 1, h = Math.max(...ys) - Math.min(...ys) || 1;
  const k = Math.min((box[2] - box[0]) / w, (box[3] - box[1]) / h);
  const ox = box[0] + ((box[2] - box[0]) - w * k) / 2 - Math.min(...xs) * k;
  const oy = box[1] + ((box[3] - box[1]) - h * k) / 2 - Math.min(...ys) * k;
  return (p) => [p[0] * k + ox, p[1] * k + oy];
}
// a label pushed out from the middle of a side, away from the shape's centre
function sideLabel(a, b, centre, text, off = 8) {
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const u = unit(centre, m);
  return label([m[0] + u[0] * off, m[1] + u[1] * off], text);
}
// a label inside the corner at v (towards the centre)
function cornerLabel(v, centre, text, off = 14) {
  const u = unit(v, centre);
  return label([v[0] + u[0] * off, v[1] + u[1] * off], text);
}

/** The diagram for a geometry question, or '' if it is not one. */
export function geoFigure(q) {
  const h = String(q?.hint || ''), t = String(q?.text || ''), v = varsOf(t);
  try {
    /* angles on a straight line: rays from one point, each angle at its size */
    if (/straight line/.test(h)) {
      const given = nums(t).filter((n) => n !== 180);
      const angs = [...given, 180 - given.reduce((s, n) => s + n, 0)];
      const names = [...given.map((n) => `${n}°`), 'x'];
      const O = [80, 84];
      const drawn = softAngles(angs, 24, 180);
      let out = line([10, 84], [150, 84]), from = 0;
      drawn.forEach((a, i) => {
        if (i) out += line(O, at(O, 62, from));
        out += arc(O, 12 + (i % 2) * 4, from, from + a);
        out += label(at(O, a < 30 ? 40 : 30, from + a / 2), names[i], 9.5);
        from += a;
      });
      return svg(out + dot(O));
    }
    /* angles in a triangle: drawn with its angles, x at the top */
    if (/in a triangle/.test(h)) {
      const [a0, b0] = nums(t).filter((n) => n !== 180);
      const [a, b, c] = softAngles([a0, b0, 180 - a0 - b0], 30, 180);
      const A = [0, 0], B = [100, 0];
      const AC = (100 * Math.sin(b * R)) / Math.sin(c * R);
      const C = [AC * Math.cos(a * R), -AC * Math.sin(a * R)];
      const m = fitter([A, B, C]);
      const [pA, pB, pC] = [m(A), m(B), m(C)];
      const g = [(pA[0] + pB[0] + pC[0]) / 3, (pA[1] + pB[1] + pC[1]) / 3];
      return svg(poly([pA, pB, pC]) + cornerLabel(pA, g, `${a0}°`, 20) + cornerLabel(pB, g, `${b0}°`, 20) + cornerLabel(pC, g, 'x', 16));
    }
    /* a regular polygon of n sides */
    if (/n-sided polygon/.test(h)) {
      const n = v.n || 6, C = [80, 54], r = 40;
      const pts = Array.from({ length: n }, (_, i) => at(C, r, 90 + (360 * i) / n));
      let out = poly(pts) + label(C, `n = ${n}`, 11);
      if (/exterior/.test(h)) {
        const [p0, p1] = [pts[0], pts[1]];
        const u = unit(p1, p0);
        out += dashed(p0, [p0[0] + u[0] * 22, p0[1] + u[1] * 22]) + cornerLabel(p0, [p0[0] + u[0] * 22 + (pts[n - 1][0] - p0[0]) * 0.4, p0[1] + u[1] * 22 + (pts[n - 1][1] - p0[1]) * 0.4], 'x', 9);
      } else if (/One interior/.test(h)) out += cornerLabel(pts[0], C, 'x', 11);
      return svg(out);
    }
    /* parallel lines cut by a transversal: a° at the top crossing, x where the rule puts it */
    if (/angles: find x/.test(h)) {
      const a = nums(t)[0], kind = (/([\w-]+) angles/.exec(h) || [])[1] || 'Corresponding';
      const th = Math.max(35, Math.min(80, a < 90 ? a : 180 - a));
      const T = [70, 34], Bt = [70 + 46 / Math.tan(th * R), 80];
      const mid = { UR: th / 2, UL: (th + 180) / 2, LL: 180 + th / 2, LR: (180 + th + 360) / 2 };
      const acute = a < 90;
      let top, bot;
      if (kind === 'Corresponding') { top = acute ? 'UR' : 'UL'; bot = top; }
      else if (kind === 'Alternate') { top = acute ? 'LL' : 'LR'; bot = top === 'LL' ? 'UR' : 'UL'; }
      else { top = acute ? 'LL' : 'LR'; bot = top === 'LL' ? 'UL' : 'UR'; }
      const dir = unit(T, Bt);
      let out = line([8, 34], [152, 34]) + line([8, 80], [152, 80]);
      out += line([T[0] - dir[0] * 26, T[1] - dir[1] * 26], [Bt[0] + dir[0] * 26, Bt[1] + dir[1] * 26]);
      out += `<path d="M118 31 l4 3 l-4 3 M118 77 l4 3 l-4 3" fill="none" stroke="${LINE}" stroke-width="1.2"/>`;   // the parallel marks
      out += label(at(T, 13, mid[top]), `${a}°`, 9) + label(at(Bt, 13, mid[bot]), 'x', 10);
      return svg(out);
    }
    /* rectangle */
    if (/rectangle/.test(h)) {
      const l = v.l || 2, w = v.w || 1;
      const [L, W] = shape(l, w, 0.55, 2.2);
      const m = fitter([[0, 0], [L, W]], [30, 18, 130, 88]);
      const [p, q2] = [m([0, 0]), m([L, W])];
      const pts = [p, [q2[0], p[1]], q2, [p[0], q2[1]]];
      return svg(poly(pts) + label([(p[0] + q2[0]) / 2, q2[1] + 9], `l = ${l}`) + label([q2[0] + 6, (p[1] + q2[1]) / 2], `w = ${w}`, 10, 'start'));
    }
    /* triangle by base and height */
    if (/Area of a triangle/.test(h)) {
      const b = v.b || 2, ht = v.h || 1;
      const [B0, H0] = shape(b, ht, 0.9, 2.4);
      const m = fitter([[0, 0], [B0, 0], [B0 * 0.35, -H0]], [24, 14, 136, 88]);
      const [A, B, C] = [m([0, 0]), m([B0, 0]), m([B0 * 0.35, -H0])];
      const F = [C[0], A[1]];
      return svg(poly([A, B, C]) + dashed(C, F) + rightMark(F, C, B, 5) + label([(A[0] + B[0]) / 2, A[1] + 9], `b = ${b}`) + label([C[0] + 4, (C[1] + F[1]) / 2], `h = ${ht}`, 10, 'start'));
    }
    /* trapezium: the parallel sides top and bottom */
    if (/trapezium/.test(h)) {
      const top = Math.min(v.a, v.b), bottom = Math.max(v.a, v.b), ht = v.h || 1;
      const topName = v.a <= v.b ? 'a' : 'b', botName = topName === 'a' ? 'b' : 'a';
      const BOT = 1, TOP = clamp(top / bottom, 0.4, 0.75), HT = clamp(ht / bottom, 0.4, 0.75), off = (BOT - TOP) * 0.3;
      const m = fitter([[0, 0], [BOT, 0], [off + TOP, -HT], [off, -HT]], [22, 16, 138, 88]);
      const [A, B, C, D] = [m([0, 0]), m([BOT, 0]), m([off + TOP, -HT]), m([off, -HT])];
      const F = [D[0], A[1]];
      return svg(poly([A, B, C, D]) + dashed(D, F) + rightMark(F, D, B, 5)
        + label([(A[0] + B[0]) / 2, A[1] + 9], `${botName} = ${bottom}`) + label([(C[0] + D[0]) / 2, D[1] - 7], `${topName} = ${top}`) + label([D[0] - 4, (D[1] + F[1]) / 2], `h = ${ht}`, 10, 'end'));
    }
    /* parallelogram */
    if (/parallelogram/.test(h)) {
      const b = v.b || 2, ht = v.h || 1;
      const [B0, H0] = shape(b, ht, 1.2, 2.6), s = B0 * 0.3;
      const m = fitter([[0, 0], [B0, 0], [B0 + s, -H0], [s, -H0]], [20, 16, 140, 88]);
      const [A, B, C, D] = [m([0, 0]), m([B0, 0]), m([B0 + s, -H0]), m([s, -H0])];
      const F = [D[0], A[1]];
      return svg(poly([A, B, C, D]) + dashed(D, F) + rightMark(F, D, B, 5) + label([(A[0] + B[0]) / 2, A[1] + 9], `b = ${b}`) + label([D[0] + 4, (D[1] + F[1]) / 2], `h = ${ht}`, 10, 'start'));
    }
    /* right-angled triangle: legs a (up) and b (across), hypotenuse c */
    if (/Right-angled triangle/.test(h)) {
      let { a, b, c } = v;
      if (a == null) a = Math.sqrt(c * c - b * b);
      if (b == null) b = Math.sqrt(c * c - a * a);
      const [Bw, Ah] = shape(b, a, 0.6, 2.0);
      const m = fitter([[0, 0], [Bw, 0], [0, -Ah]], [30, 14, 130, 88]);
      const [C, A, B] = [m([0, 0]), m([Bw, 0]), m([0, -Ah])];
      const g = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
      const ask = /hypotenuse$/.test(h) ? 'c' : (/find ([ab])$/.exec(h) || [])[1];
      const nm = (k, val) => (k === ask ? `${k} = ?` : `${k} = ${val}`);
      return svg(poly([C, A, B]) + rightMark(C, A, B) + sideLabel(C, B, g, nm('a', v.a), 14) + sideLabel(C, A, g, nm('b', v.b)) + sideLabel(A, B, g, nm('c', v.c), 10));
    }
    /* trigonometry: angle A, the sides named from it */
    if (/^Opposite/.test(h)) {
      const [o, ad] = nums(h);
      const [Aw, Oh] = shape(ad, o, 0.6, 2.0);
      const m = fitter([[0, 0], [Aw, 0], [0, -Oh]], [34, 14, 130, 88]);
      const [C, A, B] = [m([0, 0]), m([Aw, 0]), m([0, -Oh])];
      const g = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
      const toB = Math.atan2(-(B[1] - A[1]), B[0] - A[0]) / R;      // the hypotenuse's direction from A
      return svg(poly([C, A, B]) + rightMark(C, A, B) + arc(A, 12, toB, 180)
        + label([A[0] + 7, A[1] + 2], 'A', 10, 'start') + sideLabel(C, B, g, `${o}`, 9) + sideLabel(C, A, g, `${ad}`) + sideLabel(A, B, g, `${Math.round(Math.hypot(o, ad))}`, 9));
    }
    /* circle */
    if (/of a circle/.test(h)) {
      const C = [80, 54];
      return svg(`<circle cx="80" cy="54" r="40" fill="${FILL}" stroke="${LINE}" stroke-width="1.6"/>` + line(C, at(C, 40, 20)) + dot(C) + label(at(C, 22, 34), `r = ${v.r}`, 10));
    }
    /* cuboid */
    if (/cuboid/.test(h)) {
      const big = Math.max(v.l, v.w, v.h), sz = (x) => clamp(x / big, 0.45, 1);
      const l = sz(v.l) * (v.l >= v.w ? 1.3 : 1), w = sz(v.w), ht = sz(v.h);
      const m = fitter([[0, 0], [l, 0], [l + w * 0.5, -w * 0.35 - ht], [0, -ht]], [22, 14, 138, 90]);
      const P = (x, y) => m([x, y]);
      const dx = w * 0.5, dy = -w * 0.35;
      const f = [P(0, 0), P(l, 0), P(l, -ht), P(0, -ht)];
      const top = [P(0, -ht), P(l, -ht), P(l + dx, -ht + dy), P(dx, -ht + dy)];
      const side = [P(l, 0), P(l + dx, dy), P(l + dx, -ht + dy), P(l, -ht)];
      return svg(poly(side) + poly(top) + poly(f) + label([(f[0][0] + f[1][0]) / 2, f[0][1] + 9], `l = ${v.l}`) + label([(f[0][0]) - 4, (f[0][1] + f[3][1]) / 2], `h = ${v.h}`, 10, 'end') + label([(side[0][0] + side[1][0]) / 2 + 6, (side[0][1] + side[1][1]) / 2 + 4], `w = ${v.w}`, 10, 'start'));
    }
    /* cylinder and cone */
    if (/cylinder|cone/.test(h)) {
      const r = v.r, ht = v.h, cone = /cone/.test(h);
      const rx = 40, ry = rx * 0.32, H = rx * 2 * clamp(ht / (2 * r), 0.55, 1.2);   // looks like one, not to scale
      const cx = 84, by = 100, ty = by - H;
      let out = '';
      if (cone) {
        out += `<path d="M${f1(cx - rx)} ${by} L${cx} ${f1(ty)} L${f1(cx + rx)} ${by}" fill="${FILL}" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>`;
        out += `<ellipse cx="${cx}" cy="${by}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${FILL}" stroke="${LINE}" stroke-width="1.6"/>`;
        out += dashed([cx, ty], [cx, by]) + rightMark([cx, by], [cx, ty], [cx + rx, by], 5);
      } else {
        out += `<path d="M${f1(cx - rx)} ${f1(ty)} L${f1(cx - rx)} ${by} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(cx + rx)} ${by} L${f1(cx + rx)} ${f1(ty)}" fill="${FILL}" stroke="${LINE}" stroke-width="1.6"/>`;
        out += `<ellipse cx="${cx}" cy="${f1(ty)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${FILL}" stroke="${LINE}" stroke-width="1.6"/>`;
      }
      const ry0 = cone ? by : ty;
      out += line([cx, ry0], [cx + rx, ry0]) + dot([cx, ry0]) + label([cx + rx / 2, ry0 - 6], `r = ${r}`, 9.5);
      out += label([cx - rx - 4, (ty + by) / 2], `h = ${ht}`, 10, 'end');
      return svg(out);
    }
  } catch { /* no figure: the question still reads on its own */ }
  return '';
}
