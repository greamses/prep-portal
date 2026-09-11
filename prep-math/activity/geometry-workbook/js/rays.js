/* ============================================================================
   Geometry Workbook — the figures for lines and angles (chapter 7)
   ----------------------------------------------------------------------------
   One picture: lines and rays out of a single point, with the angles between
   them marked. Every direction is an angle — 0° to the right, anticlockwise,
   as a protractor reads — so a figure that says an angle is 35° has its two
   rays 35° apart, and a protractor (on paper or in the toolbox) agrees.

   And a small one for the four ways a straight path can be drawn between
   two points: a line, a ray one way, a ray the other way, a segment.
   ========================================================================== */

const INK = "#2a2723";
const RED = "#c0453f";
const BLUE = "#2f6ea8";

const f = (n) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
const rad = (d) => (d * Math.PI) / 180;
const norm = (d) => ((d % 360) + 360) % 360;

const text = (p, s, { size = 3.3, col = INK, weight = 700 } = {}) =>
  `<text x="${f(p[0])}" y="${f(p[1] + size * 0.36)}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
  `font-size="${size}" font-weight="${weight}" fill="${col}" stroke="#fffdf8" stroke-width="0.8" stroke-linejoin="round" paint-order="stroke">${s}</text>`;

/**
 * Rays and lines out of one point V.
 *
 *   rays     [deg, …] — rays out of V in these directions
 *   lines    [deg, …] — whole lines through V (a ray each way)
 *   ends     { deg: "A" } — a lettered point at the end of the ray that way
 *   vertex   the letter at V ("" for none)
 *   arcs     [{ from, to, label, big, right, col }] — the angle turning
 *            anticlockwise from direction `from` to direction `to`; `right`
 *            forces the square (true) or an arc on a 90° to be found (false)
 *   box      the space it has, in mm
 */
export function raysSvg({ rays = [], lines = [], ends = {}, vertex = "", arcs = [], box = { w: 58, h: 46 }, len = 1 }) {
  /* kept for the checks, which measure every figure they are given */
  raysSvg.last = { rays, lines, ends, arcs };
  const dirs = [...rays, ...lines.flatMap((d) => [d, d + 180])].map(norm);
  const L = len;
  const pts = dirs.map((d) => [Math.cos(rad(d)) * L, Math.sin(rad(d)) * L]);
  const all = [[0, 0], ...pts];
  const pad = 8;
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const spanX = Math.max(...xs) - Math.min(...xs) || 1;
  const spanY = Math.max(...ys) - Math.min(...ys) || 1;
  const s = Math.min((box.w - 2 * pad) / spanX, (box.h - 2 * pad) / Math.max(spanY, 0.35));
  const T = ([x, y]) => [(x - Math.min(...xs)) * s + pad, (Math.max(...ys) - y) * s + pad];
  const V = T([0, 0]);
  let W = spanX * s + 2 * pad;
  let H = Math.max(spanY, 0.35) * s + 2 * pad;
  const at = (d, r) => [V[0] + Math.cos(rad(d)) * r, V[1] - Math.sin(rad(d)) * r];

  let body = "";
  /* arcs first, under the lines */
  arcs.forEach(({ from, to, label = "", big = false, right, col = RED }, k) => {
    const sweep = norm(to - from) || 360;
    const r = sweep < 30 ? 9.5 : sweep > 180 ? 5.6 : 6 + (k % 2) * 1.6;
    const isRight = right === true || (right !== false && Math.abs(sweep - 90) < 1e-6);
    if (isRight) {
      const k2 = 3.2;
      const a = at(from, k2); const b = at(from + 45, k2 * Math.SQRT2); const c = at(to, k2);
      body += `<polyline points="${[a, b, c].map((p) => p.map(f).join(",")).join(" ")}" fill="none" stroke="${col}" stroke-width="0.55"/>`;
    } else {
      const p0 = at(from, r); const p1 = at(from + sweep, r);
      body += `<path d="M${f(p0[0])} ${f(p0[1])} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${f(p1[0])} ${f(p1[1])}" fill="none" stroke="${col}" stroke-width="0.6"/>`;
    }
    if (label !== "") {
      /* out along the middle of the angle until the wedge is wide enough to
         hold the label — "3x − 30" needs to sit further out than "x" does —
         but never past the ends of the lines */
      const mid = from + sweep / 2;
      const hw = String(label).length * 3.3 * 0.31;
      const room = L * s * 0.86;
      const far = sweep > 180 ? 8.5 : Math.min(room, Math.max(String(label).length > 2 ? 9.5 : 7.5, (hw + 1.2) / Math.max(Math.sin(rad(sweep / 2)), 0.08)));
      body += text(at(mid, far), label, { col: col === RED ? INK : col });
    }
  });

  /* lines and rays */
  dirs.forEach((d) => {
    const E = at(d, L * s);
    body += `<line x1="${f(V[0])}" y1="${f(V[1])}" x2="${f(E[0])}" y2="${f(E[1])}" stroke="${INK}" stroke-width="0.7" stroke-linecap="round"/>`;
  });
  body += `<circle cx="${f(V[0])}" cy="${f(V[1])}" r="0.9" fill="${INK}"/>`;

  /* letters at the ends of the rays, and at V */
  const labelled = [];
  Object.entries(ends).forEach(([d, name]) => {
    const E = at(Number(d), L * s);
    body += `<circle cx="${f(E[0])}" cy="${f(E[1])}" r="0.75" fill="${INK}"/>`;
    const Lp = at(Number(d), L * s + 3.6);
    labelled.push(Lp);
    body += text(Lp, name, { size: 3.6 });
  });
  if (vertex) {
    /* the letter at V goes in the widest gap between the lines */
    const sorted = [...new Set(dirs.map((d) => Math.round(d * 100) / 100))].sort((a, b) => a - b);
    let best = 270;
    let gap = -1;
    sorted.forEach((d, i) => {
      const nxt = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 360;
      if (nxt - d > gap) { gap = nxt - d; best = d + (nxt - d) / 2; }
    });
    const P = at(best, 4.4);
    labelled.push(P);
    body += text(P, vertex, { size: 3.6 });
  }
  /* grow the box round anything lettered past the edge */
  let x0 = 0; let y0 = 0;
  labelled.forEach(([x, y]) => { x0 = Math.min(x0, x - 3); y0 = Math.min(y0, y - 3); W = Math.max(W, x + 3); H = Math.max(H, y + 3); });

  const data = [V, ...Object.keys(ends).map((d) => at(Number(d), L * s))];
  return (
    `<svg viewBox="${f(x0)} ${f(y0)} ${f(W - x0)} ${f(H - y0)}" width="${f(W - x0)}mm" height="${f(H - y0)}mm" class="gw-fig" role="img" ` +
    `data-pts="${data.map((p) => p.map(f).join(",")).join(" ")}" aria-label="Lines and angles at a point">${body}</svg>`
  );
}

/**
 * A straight path between two points A and B, drawn as a line (arrows both
 * ends), a ray (one arrow, from its starting point through the other), or a
 * segment (stopping at both).
 */
export function pathSvg(kind, { turn = 0, a = "A", b = "B" } = {}) {
  const W = 58; const H = 22;
  const c = [W / 2, H / 2];
  const u = [Math.cos(rad(turn)), -Math.sin(rad(turn))];
  const P = (t) => [c[0] + u[0] * t, c[1] + u[1] * t];
  const A = P(-12); const B = P(12);
  const lo = kind === "line" || kind === "rayBA" ? -24 : -12;
  const hi = kind === "line" || kind === "rayAB" ? 24 : 12;
  const s = P(lo); const e = P(hi);
  let body = `<line x1="${f(s[0])}" y1="${f(s[1])}" x2="${f(e[0])}" y2="${f(e[1])}" stroke="${INK}" stroke-width="0.7"/>`;
  const head = (p, dir) => {
    const q = [p[0] - u[0] * dir * 2.6, p[1] - u[1] * dir * 2.6];
    const n = [-u[1] * 1.4, u[0] * 1.4];
    return `<path d="M${f(p[0])} ${f(p[1])} L${f(q[0] + n[0])} ${f(q[1] + n[1])} L${f(q[0] - n[0])} ${f(q[1] - n[1])} Z" fill="${INK}"/>`;
  };
  if (hi === 24) body += head(e, 1);
  if (lo === -24) body += head(s, -1);
  [[A, a], [B, b]].forEach(([p, n]) => {
    body += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="0.9" fill="${INK}"/>`;
    body += text([p[0] - u[1] * 3.6, p[1] + u[0] * 3.6], n, { size: 3.6 });
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" class="gw-fig" role="img" aria-label="A straight path through two points">${body}</svg>`;
}
