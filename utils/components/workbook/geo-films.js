/* ============================================================================
   GEOMETRY FILMS — circles, tangents and the angles between them (topic "geometry")
   ----------------------------------------------------------------------------
     geo-two-circles   Two touching circles (radius 3 and 12) wedged in an angle
                       θ: find θ to the nearest tenth. Two ways:
                       1. the right triangle between the centres: the line from
                          the small centre parallel to the tangent leaves 12 − 3
                          = 9 on the big radius, the centres are 3 + 12 = 15
                          apart, so sin(θ/2) = 9/15 = 3/5
                       2. similar triangles from the vertex: 3/x = 12/(x + 15),
                          x = 5, sin(θ/2) = 3/5
                       θ/2 = 36.87°, θ = 73.74° ≈ 73.7°
   The drawing is ONE picture that holds every mark it will show (the film kit
   hides them and the steps draw them): lines, circles, the bisector, radii with
   right-angle marks, the helper line, the triangle, angle arcs. What is talked
   about is lit or swells where it stands; the working is a column of lines on
   the right, one idea a line.
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";

const INK = "#2a2723", RED = "#c0453f", GREEN = "#2f7d4a", BLUE = "#2f6f8f", PURPLE = "#6b4fa0";
const SKY = "#bfe3ff", BUTTER = "#fff3a8", LEAF = "#c8f0c0";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const mark = (s, k) => (s ? s.querySelector(`[data-mb-key="${k}"]`) : null);
const isInstant = (H) => H.show === H.grow;
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const f = (n) => n.toFixed(2);

/* ── the figure, in millimetres of the 150mm paper ───────────────────────── */
const K = 3.1;                                  // mm to one unit of the question
const SA = 0.6, CA = 0.8;                       // sin and cos of half the angle (3/5, 4/5)
const V = [8, 40];
const along = (d) => [V[0] + d * CA * K, V[1] - d * SA * K];         // a point d units from V along the upper line
const axis = (d) => [V[0] + d * K, V[1]];                              // d units from V along the bisector
const O1 = axis(5), O2 = axis(20), R1 = 3 * K, R2 = 12 * K;
const T1 = along(4), T2 = along(16);                                   // where each radius meets the upper line (VT = VO cos)
const P = [O1[0] + (T2[0] - T1[0]), O1[1] + (T2[1] - T1[1])];          // O1 carried parallel to the line, onto the big radius
const C = axis(8);                                                     // where the circles touch
const lineEnd = (sign) => [V[0] + 64 * CA, V[1] - sign * 64 * SA];

const brace = (k, d, { stroke = INK, w = 0.6, dash = "", text = "", tx = 0, ty = 0, tc = INK, size = 4.2 } = {}) =>
  `<g data-mb="brace" data-mb-key="${k}"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`
  + (text ? `<text x="${f(tx)}" y="${f(ty)}" text-anchor="middle" font-family="STIX Two Text, serif" font-style="italic" font-size="${size}" fill="${tc}">${text}</text>` : "") + `</g>`;
const seg = (a, b) => `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`;
const circ = (c, r) => `M${f(c[0] - r)} ${f(c[1])} a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0`;
/** an arc about c from angle a0 to a1 (degrees, y down) */
const arcD = (c, r, a0, a1) => {
  const p = (a) => [c[0] + r * Math.cos((a * Math.PI) / 180), c[1] + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${f(x0)} ${f(y0)} A${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${f(x1)} ${f(y1)}`;
};
/** the little square of a right angle at q, along the unit directions u and v */
const square = (q, u, v, s = 2.2) => `M${f(q[0] + u[0] * s)} ${f(q[1] + u[1] * s)} L${f(q[0] + (u[0] + v[0]) * s)} ${f(q[1] + (u[1] + v[1]) * s)} L${f(q[0] + v[0] * s)} ${f(q[1] + v[1] * s)}`;
const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
const HALF = (Math.asin(SA) * 180) / Math.PI;   // 36.87

function figure() {
  let o = "";
  /* shaded shapes first, under the lines */
  o += `<g data-mb="cell" data-k="tri"><polygon points="${f(O1[0])},${f(O1[1])} ${f(P[0])},${f(P[1])} ${f(O2[0])},${f(O2[1])}" fill="${BUTTER}" fill-opacity="0.85"/></g>`;
  o += `<g data-mb="cell" data-k="sim1"><polygon points="${f(V[0])},${f(V[1])} ${f(T1[0])},${f(T1[1])} ${f(O1[0])},${f(O1[1])}" fill="${SKY}" fill-opacity="0.9"/></g>`;
  o += `<g data-mb="cell" data-k="sim2"><polygon points="${f(V[0])},${f(V[1])} ${f(T2[0])},${f(T2[1])} ${f(O2[0])},${f(O2[1])}" fill="${LEAF}" fill-opacity="0.6"/></g>`;
  /* the circles, filled as in the question, drawn as strokes */
  o += `<g data-mb="cell" data-k="fill1"><circle cx="${f(O1[0])}" cy="${f(O1[1])}" r="${f(R1)}" fill="#bcd3f5" fill-opacity="0.55"/></g>`;
  o += `<g data-mb="cell" data-k="fill2"><circle cx="${f(O2[0])}" cy="${f(O2[1])}" r="${f(R2)}" fill="#f7dc8f" fill-opacity="0.5"/></g>`;
  o += brace("c1", circ(O1, R1), { w: 0.6 });
  o += brace("c2", circ(O2, R2), { w: 0.6 });
  /* the two lines */
  o += brace("l1", seg(V, lineEnd(1)), { w: 0.6 });
  o += brace("l2", seg(V, lineEnd(-1)), { w: 0.6 });
  /* θ at the vertex, and its two halves */
  o += brace("th", arcD(V, 3.6, -HALF, HALF), { stroke: RED, w: 0.55, text: "θ", tx: V[0] + 5, ty: V[1] + 1.3, tc: RED, size: 3.4 });
  o += brace("bis", seg(V, axis(33)), { stroke: PURPLE, w: 0.45, dash: "1.6 1.2" });
  o += brace("hv", arcD(V, 5, -HALF, 0), { stroke: GREEN, w: 0.6, text: "θ/2", tx: V[0] + 4.6, ty: V[1] - 5.6, tc: GREEN, size: 3 });
  /* the centres */
  o += `<g data-mb="num" data-k="o1"><circle cx="${f(O1[0])}" cy="${f(O1[1])}" r="0.8" fill="${INK}"/><text x="${f(O1[0] - 0.8)}" y="${f(O1[1] + 4.4)}" text-anchor="end" font-family="STIX Two Text, serif" font-style="italic" font-size="3.4" fill="${INK}">O₁</text></g>`;
  o += `<g data-mb="num" data-k="o2"><circle cx="${f(O2[0])}" cy="${f(O2[1])}" r="0.9" fill="${INK}"/><text x="${f(O2[0] + 1)}" y="${f(O2[1] + 4.8)}" font-family="STIX Two Text, serif" font-style="italic" font-size="3.6" fill="${INK}">O₂</text></g>`;
  /* radii to the upper line, with their right angles */
  const lineDir = [CA, -SA], downDir = unit(T1, O1);
  o += brace("r1", seg(O1, T1), { stroke: BLUE, w: 0.6, text: "3", tx: (O1[0] + T1[0]) / 2 + 2.2, ty: (O1[1] + T1[1]) / 2 + 1.2, tc: BLUE, size: 3.4 });
  o += brace("r2", seg(O2, T2), { stroke: BLUE, w: 0.6, text: "12", tx: (O2[0] + T2[0]) / 2 + 3.6, ty: (O2[1] + T2[1]) / 2 + 0.4, tc: BLUE, size: 3.6 });
  o += brace("q1", square(T1, lineDir, downDir, 1.6), { w: 0.4 });
  o += brace("q2", square(T2, lineDir, downDir, 2.2), { w: 0.4 });
  /* the line of centres: 3 + 12 = 15 */
  o += brace("cc", seg(O1, O2), { stroke: RED, w: 0.9 });
  o += `<g data-mb="num" data-k="cc3"><text x="${f((O1[0] + C[0]) / 2)}" y="${f(O1[1] + 4.2)}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="3.4" fill="${RED}">3</text></g>`;
  o += `<g data-mb="num" data-k="cc12"><text x="${f((C[0] + O2[0]) / 2)}" y="${f(O2[1] - 1.6)}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="3.4" fill="${RED}">12</text></g>`;
  o += `<g data-mb="num" data-k="cc15"><text x="${f((O1[0] + O2[0]) / 2 + 2)}" y="${f(O1[1] + 9.4)}" text-anchor="middle" font-family="STIX Two Text, serif" font-weight="700" font-size="4.4" fill="${RED}">15</text></g>`;
  /* the helper: O1 parallel to the line, to P on the big radius */
  o += brace("hp", seg(O1, P), { stroke: GREEN, w: 0.7, dash: "2 1.2" });
  o += brace("qp", square(P, unit(P, O1), unit(P, O2), 1.8), { w: 0.4 });
  o += `<g data-mb="num" data-k="pl"><text x="${f(P[0] - 3.6)}" y="${f(P[1] - 1)}" font-family="STIX Two Text, serif" font-style="italic" font-size="3.6" fill="${GREEN}">P</text></g>`;
  o += brace("pt", seg(P, T2), { stroke: BLUE, w: 1, text: "3", tx: (P[0] + T2[0]) / 2 + 2.4, ty: (P[1] + T2[1]) / 2 - 0.2, tc: BLUE, size: 3.4 });
  o += brace("po", seg(P, O2), { stroke: RED, w: 1, text: "9", tx: (P[0] + O2[0]) / 2 + 3, ty: (P[1] + O2[1]) / 2 + 1, tc: RED, size: 4.4 });
  o += brace("ho", arcD(O1, 7, -HALF, 0), { stroke: GREEN, w: 0.6, text: "θ/2", tx: O1[0] + 12, ty: O1[1] - 1.6, tc: GREEN, size: 3.2 });
  /* method 2: x and x + 15 along the bisector */
  o += brace("vx", seg([V[0], V[1] + 7], [O1[0], O1[1] + 7]), { stroke: PURPLE, w: 0.5, text: "x", tx: (V[0] + O1[0]) / 2, ty: V[1] + 11.4, tc: PURPLE, size: 4 });
  o += brace("vx15", seg([V[0], V[1] + 15], [O2[0], O2[1] + 15]), { stroke: PURPLE, w: 0.5, text: "x + 15", tx: (V[0] + O2[0]) / 2, ty: V[1] + 19.6, tc: PURPLE, size: 4 });
  return svgBox(150, 80, o);
}

/* the working, a column on the right: one idea a line */
const COL_X = 132;
const wline = (pieces, em = 4.6) => () => svgBox(150, 14, mathRow(pieces, { cx: COL_X, y: 9, em }).svg);
const WY = (i) => 11 + i * 6;

const appear = (s, k, H, delay = 0) => { const n = key(s, k); if (!n) return; if (isInstant(H)) { n.style.opacity = "1"; return; } n.style.transition = "none"; n.style.opacity = "0"; setTimeout(() => { n.style.transition = "opacity .6s"; n.style.opacity = "1"; }, delay * 1000); };
const draw = (s, H, ks, start = 0, gap = 0.45) => ks.forEach((k, i) => H.draw(mark(s, k), start + i * gap));
const write = (s, H, ks, start = 0, gap = 0.35) => ks.forEach((k, i) => H.write(key(s, k), start + i * gap));
const lit = (s, H, k, delay, hold = 1.8, ink = RED) => { const n = mark(s, k) || key(s, k); if (n && !isInstant(H)) H.lit(n, delay, hold, ink); };
const swell = (s, H, k, delay, hold = 1.6, to = 1.25) => { const n = mark(s, k) || key(s, k); if (n && !isInstant(H)) H.focus(n, delay, hold, to); };

export function geoTwoCircles() {
  const W = {
    w1: [L("a", "O_1O_2 = 3 + 12"), L("b", "= 15", RED)],
    w2: [L("a", "PO_2 = 12 - 3"), L("b", "= 9", RED)],
    w3: [L("a", "\\sin\\tfrac{\\theta}{2} = \\tfrac{\\text{opp}}{\\text{hyp}}")],
    w4: [L("a", "\\sin\\tfrac{\\theta}{2} = \\tfrac{9}{15}"), L("b", "= \\tfrac{3}{5}", GREEN)],
    w5: [L("a", "\\tfrac{\\theta}{2} = \\sin^{-1}\\tfrac{3}{5}"), L("b", "= 36.87^\\circ", GREEN)],
    w6: [L("a", "\\theta = 2 \\times 36.87^\\circ"), L("b", "= 73.74^\\circ", GREEN)],
    w7: [L("a", "\\boxed{\\theta \\approx 73.7^\\circ}", GREEN)],
    m1: [L("a", "\\tfrac{3}{x} = \\tfrac{12}{x + 15}")],
    m2: [L("a", "3(x + 15) = 12x")],
    m3: [L("a", "3x + 45 = 12x")],
    m4: [L("a", "45 = 9x,\\ "), L("b", "x = 5", RED)],
    m5: [L("a", "\\sin\\tfrac{\\theta}{2} = \\tfrac{3}{5}", GREEN)],
    m6: [L("a", "\\boxed{\\theta \\approx 73.7^\\circ}", GREEN)],
  };
  /* one idea a line: "45 = 9x" and "x = 5" are two lines */
  W.m4 = [L("a", "45 = 9x")];
  W.m4b = [L("a", "x = 5", RED)];
  const pics = { fg: figure };
  const picAt = { fg: centred(150, 10) };
  const stages = {};
  const order1 = ["w1", "w2", "w3", "w4", "w5", "w6", "w7"], order2 = ["m1", "m2", "m3", "m4", "m4b", "m5", "m6"];
  [...order1, ...order2].forEach((k) => {
    pics[k] = wline(W[k]);
    const i = (order1.includes(k) ? order1 : order2).indexOf(k);
    picAt[k] = centred(150, WY(i));
    stages[`${k}.all`] = (s, H) => { W[k].forEach((p, j) => H.write(key(s, p.k), j * 1.1)); };
  });

  Object.assign(stages, {
    "fg.base": (s, H) => {
      draw(s, H, ["l1", "l2"], 0.4, 0.5);
      appear(s, "fill1", H, 1.5); appear(s, "fill2", H, 1.8);
      draw(s, H, ["c1", "c2"], 1.4, 0.6);
      H.draw(mark(s, "th"), 2.8);
    },
    "fg.focusTh": (s, H) => { swell(s, H, "th", 0.2, 2, 1.4); },
    "fg.bis": (s, H) => { H.draw(mark(s, "bis"), 0.3); write(s, H, ["o1", "o2"], 1.6, 0.6); lit(s, H, "bis", 0.5, 2.4, PURPLE); },
    "fg.radii": (s, H) => {
      H.draw(mark(s, "r1"), 0.4); H.draw(mark(s, "q1"), 1.1);
      H.draw(mark(s, "r2"), 1.8); H.draw(mark(s, "q2"), 2.5);
      lit(s, H, "q1", 3.2, 1.6); lit(s, H, "q2", 3.2, 1.6);
    },
    "fg.cc": (s, H) => {
      H.draw(mark(s, "cc"), 0.3);
      write(s, H, ["cc3"], 1.4); write(s, H, ["cc12"], 2.6); write(s, H, ["cc15"], 4.4);
      swell(s, H, "cc15", 5, 1.6, 1.4);
    },
    "fg.helper": (s, H) => { H.draw(mark(s, "hp"), 0.5); write(s, H, ["pl"], 1.6); lit(s, H, "hp", 1.2, 2.2, GREEN); },
    "fg.qp": (s, H) => { H.draw(mark(s, "qp"), 0.2); lit(s, H, "qp", 0.4, 1.8); },
    "fg.pt": (s, H) => { H.draw(mark(s, "pt"), 0.3); lit(s, H, "r1", 0.6, 2.2, BLUE); lit(s, H, "pt", 0.6, 2.2, BLUE); },
    "fg.po": (s, H) => { H.draw(mark(s, "po"), 0.3); swell(s, H, "po", 1.4, 1.6, 1.3); },
    "fg.tri": (s, H) => { H.write(key(s, "tri"), 0.2); lit(s, H, "cc", 1, 1.6); lit(s, H, "hp", 1, 1.6, GREEN); lit(s, H, "po", 1, 1.6); },
    "fg.half": (s, H) => { H.draw(mark(s, "hv"), 0.4); lit(s, H, "bis", 0.6, 1.8, PURPLE); lit(s, H, "l1", 0.6, 1.8); H.draw(mark(s, "ho"), 3); lit(s, H, "hp", 3.2, 1.8, GREEN); },
    "fg.oppHyp": (s, H) => { swell(s, H, "po", 0.8, 1.6, 1.35); lit(s, H, "cc", 2.6, 2, RED); swell(s, H, "cc15", 2.6, 1.6, 1.4); swell(s, H, "ho", 4.4, 1.4, 1.3); },
    "fg.double": (s, H) => { swell(s, H, "th", 0.4, 2, 1.4); lit(s, H, "hv", 0.4, 2, GREEN); },
    /* method 2: clear the helper, shade the two similar triangles */
    "fg.m2": (s, H) => {
      ["tri", "hp", "qp", "pt", "po", "pl", "ho", "cc", "cc3", "cc12", "cc15"].forEach((k) => { const n = key(s, k) || mark(s, k); if (n) n.style.opacity = "0"; });
      H.write(key(s, "sim2"), 0.4); H.write(key(s, "sim1"), 1.6);
      lit(s, H, "r1", 1.8, 1.6, BLUE); lit(s, H, "r2", 0.6, 1.6, BLUE);
    },
    "fg.vx": (s, H) => { H.draw(mark(s, "vx"), 0.4); H.draw(mark(s, "vx15"), 2.2); swell(s, H, "vx15", 3.4, 1.4, 1.2); },
  });

  const STEP = (say, o = {}) => ({ say, ...o });
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "Circles of radius 3 and 12 touch, and touch both lines. Find θ to the nearest tenth." }],
    pics, picAt,
    lines: [],
    stages,
    steps: ({ push }) => {
      push("Two circles, one with radius three, one with radius twelve. They touch each other, and they both touch the two lines. We want the angle between the lines, theta, to the nearest tenth of a degree.",
        { on: ["a1", "fg"], add: ["fg.base"], transition: "iris", pause: 0.8 });
      push("Look at the angle at the point where the lines meet. That's theta. Everything we draw now is to find it.",
        { add: ["fg.focusTh"], pause: 0.6 });
      push("First thing to notice. Each centre is the same distance from both lines. So both centres sit on the line that cuts theta exactly in half. Call the centres O one and O two.",
        { add: ["fg.bis"], cue: { "fg.bis": "both centres" }, transition: card("What we know", "the centres sit on the half-way line"), pause: 0.7 });
      push("Second thing. A radius meets a tangent at a right angle. So draw the radius of each circle to the top line: three for the small one, twelve for the big one. Both make right angles.",
        { add: ["fg.radii"], cue: { "fg.radii": "draw the radius" }, pause: 0.8 });
      push("Now the longest side. The circles touch, so the distance between the centres is one radius plus the other.",
        { add: ["fg.cc"], cue: { "fg.cc": "the distance" }, transition: card("Method 1", "a right triangle between the centres"), pause: 0.4 });
      push("Three, plus twelve. Fifteen.",
        { on: ["w1"], add: ["w1.all"], pause: 0.9 });
      push("Here's the clever line. From O one, draw a line parallel to the top line, until it hits the big radius. Call that point P.",
        { add: ["fg.helper"], cue: { "fg.helper": "draw a line parallel" }, pause: 0.7 });
      push("It's parallel to the tangent, so it meets the big radius at a right angle too.",
        { add: ["fg.qp"], pause: 0.6 });
      push("Look at the strip between the two radii. It's a rectangle. So the bit of the big radius from P up to the line is the same as the small radius: three.",
        { add: ["fg.pt"], cue: { "fg.pt": "It's a rectangle" }, pause: 0.7 });
      push("That leaves twelve take away three for the rest of the big radius. Nine.",
        { on: ["w2"], add: ["fg.po", "w2.all"], cue: { "fg.po": "Nine", "w2.all": "twelve take away" }, pause: 0.9 });
      push("And there's our right triangle: O one, P, O two. Fifteen on the long side, the hypotenuse. Nine on the side opposite O one.",
        { add: ["fg.tri"], transition: card("The right triangle", "hypotenuse 15, opposite 9"), pause: 0.7 });
      push("Which angle is at O one? Here's the key. The line O one P is parallel to the top line, and the half-way line crosses both. So the angle at O one is the same as the angle between the half-way line and the top line. Half of theta.",
        { add: ["fg.half"], cue: { "fg.half": "the half-way line crosses" }, pause: 1.2 });
      push("Opposite and hypotenuse. SOH: sine is opposite over hypotenuse.",
        { on: ["w3"], add: ["w3.all", "fg.oppHyp"], cue: { "w3.all": "sine is", "fg.oppHyp": "Opposite and" }, transition: card("SOH CAH TOA", "opposite and hypotenuse: sine"), pause: 0.7 });
      push("So sine of half theta is nine over fifteen. Divide both by three: three fifths.",
        { on: ["w4"], add: ["w4.all"], cue: { "w4.all": "nine over" }, pause: 0.9 });
      push("Undo the sine with inverse sine. Half theta is thirty six point eight seven degrees.",
        { on: ["w5"], add: ["w5.all"], cue: { "w5.all": "inverse sine" }, pause: 0.9 });
      push("Here's the trap. Thirty six point eight seven is only half the angle. Double it. Theta is seventy three point seven four degrees.",
        { on: ["w6"], add: ["w6.all", "fg.double"], cue: { "w6.all": "Double it" }, pause: 0.9 });
      push("To the nearest tenth, theta is seventy three point seven degrees.",
        { on: ["w7"], add: ["w7.all"], pause: 1.2 });
      /* method 2 */
      push("Now a second way, from the point where the lines meet. Look at the two shaded triangles: each has a right angle at the line, and they share the angle at the point. Same shape, different size. Similar triangles.",
        { off: ["w1", "w2", "w3", "w4", "w5", "w6", "w7"], add: ["fg.m2"], cue: { "fg.m2": "two shaded triangles" }, transition: card("Method 2", "similar triangles from the point"), pause: 0.8 });
      push("Call the distance from the point to O one, x. Then the distance to O two is x plus fifteen, because the centres are fifteen apart.",
        { add: ["fg.vx"], cue: { "fg.vx": "Call the distance" }, pause: 0.8 });
      push("Similar triangles keep their ratios. Radius over the distance to the centre: three over x equals twelve over x plus fifteen.",
        { on: ["m1"], add: ["m1.all"], cue: { "m1.all": "three over" }, pause: 0.9 });
      push("Cross multiply. Three lots of x plus fifteen equals twelve x.",
        { on: ["m2"], add: ["m2.all"], pause: 0.6 });
      push("Open the bracket. Three x plus forty five equals twelve x.",
        { on: ["m3"], add: ["m3.all"], pause: 0.6 });
      push("Take three x from both sides. Forty five equals nine x.",
        { on: ["m4"], add: ["m4.all"], pause: 0.6 });
      push("So x is five.",
        { on: ["m4b"], add: ["m4b.all"], pause: 0.8 });
      push("Now in the small triangle, sine of half theta is the radius over the distance: three over five. The same three fifths as before.",
        { on: ["m5"], add: ["m5.all"], cue: { "m5.all": "three over five" }, pause: 0.9 });
      push("So half theta is thirty six point eight seven, and theta, to the nearest tenth, is seventy three point seven degrees. Two ways, one answer.",
        { on: ["m6"], add: ["m6.all", "fg.double"], cue: { "m6.all": "to the nearest tenth" }, pause: 1.2 });
    },
  });
}
