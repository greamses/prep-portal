/* ============================================================================
   ALGEBRA DERIVATIONS — the quadratic formula, by completing the square
   ----------------------------------------------------------------------------
   *"Add a new video on derivations. Deriving the quadratic formula using
   completing the square and with the geometry visuals (this should be very
   detailed too)."*

   The picture is the one that makes completing the square make sense:
     x²   a square with sides x
     bx   a strip x tall and b wide beside it
   CUT the strip down the middle (two strips b/2 wide), TURN one half and lay
   it along the bottom of the square: an L shape that is nearly a square, with
   one corner missing, (b/2)². ADD that corner (to both sides of the equation,
   to keep it balanced) and the shape IS a square, (x + b/2)².
   Part 1 does it with numbers (x² + 6x = 16); part 2 does it with letters,
   step by step, all the way to x = (−b ± √(b² − 4ac)) / 2a; then a check
   with part 1's numbers, and what b² − 4ac says about the answers.
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad, texAt } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";

const INK = "#2a2723", BLUE = "#2f6f8f", GREEN = "#2f7d4a", RED = "#c0453f", PURPLE = "#6b4fa0";
const SKY = "#bfe3ff", BUTTER = "#fff3a8", LEAF = "#c8f0c0", PEACH = "#ffd7a3";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const main = (pieces, em = 7.4) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
const at = (y) => centred(150, y);
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const isInstant = (H) => H.show === H.grow;
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const tex = (t, x, y, k, { em = 4.6, color = INK, anchor = "middle" } = {}) => texAt(t, x, y, { em, color, anchor, attrs: `data-mb="num" data-k="${k}"` });

/* the square's side, in the drawing's millimetres; the film draws 0.4 screen units to the mm
   (PIC_W 60 across PAPER 150), and anchors a picture by its FIRST box: the x² square */
const GS = 46, MM = 60 / 150;
/** where the square's corner must land so the finished square is centred, its top at `top` */
const geoAt = (bars, top) => { const H2 = (bars ? 24 : 18) / 2; return { x: 50 - ((GS + H2) * MM) / 2, y: top }; };

/* ── THE PICTURE ──────────────────────────────────────────────────────────
   labels: { x, sq, strip, w, half, hw, corner, big } as TeX */
function geo(lab, { bars = 0 } = {}) {
  /* `bars`: with numbers, 6x is drawn as 6 bars (each x long, 1 wide) so it can be counted, and the
     corner fills with 3 x 3 unit squares; with letters, b/a x is one strip */
  /* bigger, and centred: the finished square (S + W/2 across) sits in the middle of the 150 */
  const S = GS, W = bars ? 24 : 18, H2 = W / 2, U = bars ? W / bars : 0, X = 75 - (S + H2) / 2, Y = 9;
  const P = X + S + H2;                  // where the strip is cut
  let o = "";
  /* the x² square */
  o += `<rect data-mb="bar" data-k="sq" x="${X}" y="${Y}" width="${S}" height="${S}" fill="${SKY}" stroke="${INK}" stroke-width="0.7"/>`;
  o += tex(lab.sq, X + S / 2, Y + S / 2 + 2.6, "lsq", { em: 8 });
  o += tex(lab.x, X + S / 2, Y - 2.4, "lxt", { em: 5.6 });
  o += tex(lab.x, X - 3, Y + S / 2 + 2, "lxl", { anchor: "end", em: 5.6 });
  /* the strip, as two halves (one rect each), shown together first */
  const strip = (x0, n, k0) => (bars
    ? Array.from({ length: n }, (_, i) => `<rect data-mb="bar" data-k="bar${k0 + i}" x="${(x0 + i * U).toFixed(2)}" y="${Y}" width="${U.toFixed(2)}" height="${S}" fill="${BUTTER}" stroke="${INK}" stroke-width="0.6"/>`).join("")
    : `<rect data-mb="bar" data-k="s${k0 ? 2 : 1}" x="${x0}" y="${Y}" width="${H2}" height="${S}" fill="${BUTTER}" stroke="${INK}" stroke-width="0.7"/>`);
  o += strip(X + S, bars / 2, 0);
  o += `<g data-k="mv" data-px="${P}" data-py="${Y + S}" data-dx="${-(S + H2)}">` + strip(P, bars / 2, bars ? bars / 2 : 1) + `</g>`;
  /* the strip's own labels (before the cut) */
  o += tex(lab.strip, X + S + H2, Y + S / 2 + 2.4, "lstrip", { em: 6 });
  o += tex(lab.w, X + S + H2, Y - 2.4, "lw", { em: 5.6 });
  /* the cut */
  o += `<g data-mb="brace" data-mb-key="cut"><path d="M${P} ${Y - 1} V${Y + S + 1}" fill="none" stroke="${RED}" stroke-width="0.8" stroke-dasharray="2 1.2"/></g>`;
  /* after the cut: the halves' labels; the moved half's labels sit where it lands */
  o += tex(lab.half, X + S + H2 / 2, Y + S / 2 + 2, "lh1", { em: 4.8 });
  o += tex(lab.hw, X + S + H2 / 2, Y - 2.4, "lhw1", { em: 5 });
  o += tex(lab.half, X + S / 2, Y + S + H2 / 2 + 1.8, "lh2", { em: 4.8 });
  o += tex(lab.hw, X - 3, Y + S + H2 / 2 + 1.8, "lhw2", { em: 5, anchor: "end" });
  /* the missing corner */
  o += `<g data-mb="brace" data-mb-key="corner"><path d="M${X + S} ${Y + S} h${H2} v${H2} h${-H2} z" fill="none" stroke="${PURPLE}" stroke-width="0.7" stroke-dasharray="1.5 1"/></g>`;
  if (bars) {
    /* the corner as unit squares, (bars/2) by (bars/2): 3 x 3 = 9 to count */
    const m = bars / 2;
    for (let r = 0; r < m; r++) for (let q = 0; q < m; q++) {
      o += `<rect data-mb="num" data-k="cu${r * m + q}" x="${(X + S + q * U).toFixed(2)}" y="${(Y + S + r * U).toFixed(2)}" width="${U.toFixed(2)}" height="${U.toFixed(2)}" fill="${PEACH}" stroke="${PURPLE}" stroke-width="0.5"/>`;
    }
  } else {
    o += `<rect data-mb="num" data-k="cfill" x="${X + S}" y="${Y + S}" width="${H2}" height="${H2}" fill="${PEACH}" stroke="${PURPLE}" stroke-width="0.7"/>`;
  }
  o += tex(lab.corner, X + S + H2 + 3, Y + S + H2 / 2 + 1.8, "lc", { em: 5, color: PURPLE, anchor: "start" });
  /* the whole square */
  o += `<g data-mb="brace" data-mb-key="big"><path d="M${X} ${Y} h${S + H2} v${S + H2} h${-(S + H2)} z" fill="none" stroke="${GREEN}" stroke-width="1.3"/></g>`;
  o += tex(lab.big, X + (S + H2) / 2, Y + S + H2 + 7.5, "lbig", { em: 6, color: GREEN });
  return svgBox(150, 78, o);
}
const fadeOut = (s, H, ks) => ks.forEach((k) => { const n = key(s, k); if (!n) return; n.style.transition = isInstant(H) ? "" : "opacity .4s"; n.style.opacity = "0"; });
const geoStages = (p) => ({
  [`${p}.sq`]: (s, H) => { H.grow(key(s, "sq"), 0.1); ["lxt", "lxl", "lsq"].forEach((k, i) => H.write(key(s, k), 0.7 + i * 0.35)); },
  [`${p}.strip`]: (s, H) => {
    const bs = [...(s?.querySelectorAll('[data-k^="bar"]') || [])];
    if (bs.length) bs.forEach((b, i) => H.grow(b, 0.1 + i * 0.35));   // six bars, one after another
    else { H.grow(key(s, "s1"), 0.1); H.grow(key(s, "s2"), 0.1); }
    H.write(key(s, "lstrip"), 0.4 + bs.length * 0.35); H.write(key(s, "lw"), 0.7 + bs.length * 0.35);
  },
  /* the knife comes down the middle of the strip */
  [`${p}.cut`]: (s, H) => {
    H.draw(s?.querySelector('[data-mb-key="cut"]'), 0.1);
    if (!isInstant(H)) H.sound("snip", 0.2);
    fadeOut(s, H, ["lstrip", "lw"]);
    ["lh1", "lhw1"].forEach((k, i) => H.write(key(s, k), 0.9 + i * 0.3));
  },
  /* one half TURNS and slides under the square */
  [`${p}.move`]: (s, H) => {
    /* THE HALF TURNS ABOUT ITS FOOT AND SLIDES UNDER THE SQUARE, in the drawing's own units (an SVG
       transform attribute, so every browser puts it in the same place): it ends lying along the
       square's bottom edge, x long and half the strip deep — one bar beside, one bar under. */
    const g = key(s, "mv");
    if (!g) return;
    const px = Number(g.dataset.px), py = Number(g.dataset.py), dx = Number(g.dataset.dx);
    const set = (k) => g.setAttribute("transform", `translate(${(dx * k).toFixed(3)} 0) rotate(${(90 * k).toFixed(3)} ${px} ${py})`);
    const c = s?.querySelector('[data-mb-key="cut"]'); if (c) { c.style.transition = isInstant(H) ? "" : "opacity .3s"; c.style.opacity = "0"; }
    if (isInstant(H) || typeof requestAnimationFrame !== "function") set(1);
    else {
      const t0 = performance.now() + 150;
      const tick = (now) => {
        if (!g.isConnected) return;
        const t = Math.max(0, Math.min(1, (now - t0) / 1400)), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        set(e);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      H.sound("flip", 0.1);
    }
    ["lh2", "lhw2"].forEach((k, i) => H.write(key(s, k), 1.5 + i * 0.3));
  },
  [`${p}.corner`]: (s, H) => { H.draw(s?.querySelector('[data-mb-key="corner"]'), 0.1); },
  [`${p}.fill`]: (s, H) => {
    const cu = [...(s?.querySelectorAll('[data-k^="cu"]') || [])];
    if (cu.length) { cu.forEach((n, i) => { H.write(n, 0.1 + i * 0.3); if (!isInstant(H)) H.sound("tick", 0.1 + i * 0.3); }); H.write(key(s, "lc"), 0.3 + cu.length * 0.3); }
    else { H.write(key(s, "cfill"), 0.1); H.write(key(s, "lc"), 0.5); if (!isInstant(H)) H.sound("pop", 0.2); }
  },
  [`${p}.big`]: (s, H) => { H.draw(s?.querySelector('[data-mb-key="big"]'), 0.1); H.write(key(s, "lbig"), 0.8); if (!isInstant(H)) H.sound("ding", 0.9); },
});
const ALL = (p) => [`${p}.sq`, `${p}.strip`, `${p}.cut`, `${p}.move`, `${p}.corner`, `${p}.fill`, `${p}.big`];

/* ── THE WORKING, AS IT IS DONE ON A BOARD ────────────────────────────────
   *"Show the quadratic formula at first ... animate the division, the cancel and the transfer. If
   there is no diagram, use the center space and show next steps beneath. You can now hide the
   unneeded steps ... text can also move down when you need to draw, but dont just leave an empty
   space."* So: when there is no picture, the working is a STACK down the middle of the screen, each
   step under the one before; when the picture is needed, the stack goes and the picture takes the
   middle, with the line it explains underneath. Three moves are animated where they happen:
     DIVIDE    "÷ a" is written under every term, one term at a time
     CANCEL    the a's that cancel are struck through, and what is left is written small
     TRANSFER  a term slides across the equals sign and lands with its sign changed */
const SLOT = [12, 19, 26, 33];      // the stack's lines (tops), down the middle
const UNDER = 38.5;                  // the one line under the picture
const TALL = [13, 24, 35];          // the stack when the lines are tall fractions (part 2)
const EMS = 7;

/** One line of working. */
const line1 = (t, color, em = EMS) => svgBox(150, 30, mathRow([{ k: "a", tex: t, ...(color ? { color } : {}) }], { cx: 75, y: 17, em }).svg);

/** DIVIDE AND CANCEL: ax² + bx + c = 0 with every term put over a, then the a's struck */
function divPic() {
  const em = 6.6;
  const r = mathRow([
    { k: "t1", frac: ["ax^{2}", "a"] }, { k: "p1", tex: "+" }, { k: "t2", frac: ["bx", "a"] }, { k: "p2", tex: "+" },
    { k: "t3", frac: ["c", "a"] }, { k: "e", tex: "=" }, { k: "t4", frac: ["0", "a"] },
  ], { cx: 75, y: 17, em });
  const A = r.at;
  const strike = (k, x1, y1, x2, y2) => `<g data-mb="brace" data-mb-key="${k}"><path d="M${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${RED}" stroke-width="0.55" stroke-linecap="round"/></g>`;
  const t1 = A.t1, t4 = A.t4;
  /* the a in "ax²" is the first letter of the top; the a underneath is the whole bottom */
  const aTopL = t1.x - t1.topW / 2, aTopR = aTopL + t1.topW * 0.3;
  let o = r.svg;
  o += strike("k1", aTopL - 0.3, t1.topBase + 0.5, aTopR + 0.3, t1.topBase - t1.topAsc * 0.7);
  o += strike("k2", t1.x - t1.botW / 2 - 0.4, t1.botBase + 0.5, t1.x + t1.botW / 2 + 0.4, t1.botBase - t1.botAsc - 0.3);
  o += strike("k3", t4.x - t4.botW / 2 - 0.4, t4.botBase + 0.5, t4.x + t4.botW / 2 + 0.4, t4.botBase - t4.botAsc - 0.3);
  o += texAt("1", aTopL - 1.6, t1.topBase - t1.topAsc - 0.8, { em: 3.6, color: BLUE, attrs: 'data-mb="num" data-k="k1n"' });
  o += texAt("\\to 0", t4.x + t4.w / 2 + 1.2, t4.botBase - 1, { em: 4, color: BLUE, anchor: "start", attrs: 'data-mb="num" data-k="k3n"' });
  return svgBox(150, 30, o);
}
const divStages = (id) => ({
  /* the equation as it stands: the tops and the signs */
  [`${id}.top`]: (s, H) => ["t1n", "p1", "t2n", "p2", "t3n", "e", "t4n"].forEach((k, i) => H.write(key(s, k), i * 0.12)),
  /* ÷ a under every term, one term at a time */
  [`${id}.div`]: (s, H) => ["t1", "t2", "t3", "t4"].forEach((k, i) => { H.write(key(s, `${k}d`), 0.4 + i * 0.7); if (!isInstant(H)) H.sound("tick", 0.4 + i * 0.7); }),
  /* the a's that cancel, struck through; what is left, written small */
  [`${id}.cancel`]: (s, H) => {
    ["k1", "k2"].forEach((k, i) => H.draw(s?.querySelector(`[data-mb-key="${k}"]`), 0.3 + i * 0.4));
    H.write(key(s, "k1n"), 1.2);
    H.draw(s?.querySelector('[data-mb-key="k3"]'), 1.8);
    H.write(key(s, "k3n"), 2.4);
    if (!isInstant(H)) H.sound("snip", 0.3);
  },
});

/**
 * TRANSFER: a term (and the sign in front of it) leaves one side of the equation and lands on the
 * other with its sign changed. `pieces` as for mathRow; `move` the key of the travelling term, `op`
 * its sign, `to` the key it replaces (else it lands at the right-hand end), `sign` what it becomes.
 */
function transferPic(pieces, { move, op, to = null, sign = "-", em = EMS }) {
  const r = mathRow(pieces, { cx: 75, y: 17, em });
  const A = r.at, m = A[move], pad = em * 0.28;
  const idx = pieces.findIndex((p) => p.k === move);
  const hole = (keep) => pieces.map((p, i) => (keep(p, i) ? p : (p.gap ? p : { gap: A[p.k]?.w ?? 0 })));
  /* before the travelling term (its sign included, which fades) and after it (which closes up) */
  const before = mathRow(hole((p, i) => i < idx), { cx: 75, y: 17, em }).svg;
  const after = mathRow(hole((p, i) => i > idx && p.k !== to), { cx: 75, y: 17, em }).svg;
  const target0 = to ? mathRow(hole((p) => p.k === to), { cx: 75, y: 17, em }).svg : "";
  const piece = pieces.find((p) => p.k === move);
  const moving = mathRow([piece], { cx: m.x, y: 17, em }).svg;
  const negW = em * 0.55;
  let target;
  if (to) target = A[to].x + (m.w - A[to].w) / 2 + negW / 2 + pad / 2;
  else { const right = Math.max(...Object.values(A).map((q) => q.x + q.w / 2)); target = right + pad * 2 + negW + m.w / 2; }
  const negX = target - m.w / 2 - pad - negW / 2;
  const close = (A[op]?.w ?? 0) + m.w + pad * 2;      // the hole the sign and the term leave
  return svgBox(150, 30, before
    + (to ? `<g data-k="tgt">${target0}</g>` : "")
    + `<g data-k="after" data-close="${close.toFixed(2)}">${after}`
    + `<g data-k="mvT" data-dx="${(target - m.x).toFixed(2)}">${moving}</g>`
    + texAt(sign === "-" ? "-" : "+", negX, 17, { em, color: RED, attrs: 'data-mb="num" data-k="neg"' })
    + `</g><g data-k="meta" data-op="${op}"></g>`);
}
const transferStages = (id) => ({
  [`${id}.show`]: (sv, H) => [...(sv?.querySelectorAll('[data-mb="num"]') || [])].filter((n) => n.dataset.k !== "neg").forEach((n, i) => H.write(n, i * 0.1)),
  [`${id}.go`]: (sv, H) => {
    const g = key(sv, "mvT"), meta = key(sv, "meta"), aft = key(sv, "after"), tgt = key(sv, "tgt");
    if (!g || !meta) return;
    const dx = Number(g.dataset.dx), close = Number(aft?.dataset.close || 0), instant = isInstant(H);
    /* the sign in front of the term fades, and so does what the term replaces */
    const opKey = meta.dataset.op;
    const outs = [key(sv, opKey), ...(tgt ? [tgt] : [])].filter(Boolean);
    outs.forEach((n) => { n.style.transition = instant ? "" : "opacity .45s"; n.style.opacity = "0"; });
    const fly = (k) => g.setAttribute("transform", `translate(${(dx * k).toFixed(3)} ${(-6 * Math.sin(Math.PI * k)).toFixed(3)})`);
    const shut = (k) => aft?.setAttribute("transform", `translate(${(-close * k).toFixed(3)} 0)`);
    if (instant || typeof requestAnimationFrame !== "function") { fly(1); shut(1); H.write(key(sv, "neg"), 0); return; }
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const t0 = performance.now() + 300;
    const tick = (now) => {
      if (!g.isConnected) return;
      const t = Math.max(0, Math.min(1, (now - t0) / 1300));
      fly(ease(t));
      /* once it has landed, the line closes up behind it */
      const c = Math.max(0, Math.min(1, (now - t0 - 1700) / 600));
      shut(ease(c));
      if (t < 1 || c < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    H.sound("flip", 0.3);
    H.write(key(sv, "neg"), 1.55);
  },
});

export function quadFormula() {
  const at = (y) => centred(150, y);
  const pics = {
    f0: () => line1("x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}", GREEN, 10),
    gn: () => geo({ x: "x", sq: "x^{2}", strip: "6x", w: "6", half: "3x", hw: "3", corner: "9", big: "(x + 3)^{2}" }, { bars: 6 }),
    gg: () => geo({ x: "x", sq: "x^{2}", strip: "\\tfrac{b}{a}x", w: "\\tfrac{b}{a}", half: "\\tfrac{b}{2a}x", hw: "\\tfrac{b}{2a}", corner: "\\left(\\tfrac{b}{2a}\\right)^{2}", big: "\\left(x + \\tfrac{b}{2a}\\right)^{2}" }),
    /* part 1, under the picture */
    n1u: () => line1("x^{2} + 6x = 16"),
    n2u: () => line1("x^{2} + 6x + 9 = 16 + 9"),
    n3u: () => line1("(x + 3)^{2} = 25", GREEN),
    rule1: () => line1("\\text{we added } \\left(\\tfrac{6}{2}\\right)^{2} = 3^{2} = 9:\\ \\text{half the } x \\text{ number, squared}", PURPLE, 5.6),
    /* part 1, the stack */
    n3s: () => line1("(x + 3)^{2} = 25", GREEN),
    r1: () => line1("\\sqrt{(x + 3)^{2}} = \\sqrt{25}"),
    r2: () => line1("x + 3 = \\pm 5"),
    r3: () => line1("x + 3 = 5\\ \\ \\text{or}\\ \\ x + 3 = -5"),
    r3b: () => line1("x + 3 = 5\\ \\ \\text{or}\\ \\ x + 3 = -5"),
    T1a: () => transferPic([{ k: "x", tex: "x" }, { k: "op", tex: "+" }, { k: "m", tex: "3" }, { k: "e", tex: "=" }, { k: "r", tex: "5" }], { move: "m", op: "op" }),
    T1b: () => transferPic([{ k: "x", tex: "x" }, { k: "op", tex: "+" }, { k: "m", tex: "3" }, { k: "e", tex: "=" }, { k: "r", tex: "-5" }], { move: "m", op: "op" }),
    n5: () => line1("x = 2\\ \\ \\text{or}\\ \\ x = -8", GREEN),
    /* part 2, the stack */
    g1: () => line1("ax^{2} + bx + c = 0"),
    dv: () => divPic(),
    T2: () => transferPic([{ k: "x2", tex: "x^{2}" }, { k: "p1", tex: "+" }, { k: "bx", frac: ["b", "a"] }, { k: "xx", tex: "x" }, { k: "op", tex: "+" },
      { k: "m", frac: ["c", "a"] }, { k: "e", tex: "=" }, { k: "z", tex: "0" }], { move: "m", op: "op", to: "z", em: 6.6 }),
    g3: () => line1("x^{2} + \\dfrac{b}{a}x = -\\dfrac{c}{a}"),
    /* part 2, under the picture */
    g3u: () => line1("x^{2} + \\dfrac{b}{a}x = -\\dfrac{c}{a}"),
    g4u: () => line1("x^{2} + \\dfrac{b}{a}x + \\left(\\dfrac{b}{2a}\\right)^{2} = \\left(\\dfrac{b}{2a}\\right)^{2} - \\dfrac{c}{a}", null, 5.4),
    rule2: () => line1("\\left(\\tfrac{1}{2} \\times \\tfrac{b}{a}\\right)^{2} = \\left(\\tfrac{b}{2a}\\right)^{2}:\\ \\text{half the } x \\text{ number, squared}", PURPLE, 5.6),
    g5u: () => line1("\\left(x + \\dfrac{b}{2a}\\right)^{2} = \\dfrac{b^{2}}{4a^{2}} - \\dfrac{c}{a}", GREEN, 5.6),
    /* part 2, the stack again */
    g5s: () => line1("\\left(x + \\dfrac{b}{2a}\\right)^{2} = \\dfrac{b^{2}}{4a^{2}} - \\dfrac{c}{a}", null, 6.6),
    g6: () => line1("\\left(x + \\dfrac{b}{2a}\\right)^{2} = \\dfrac{b^{2} - 4ac}{4a^{2}}", null, 6.6),
    T3: () => transferPic([{ k: "x", tex: "x" }, { k: "op", tex: "+" }, { k: "m", frac: ["b", "2a"] }, { k: "e", tex: "=" }, { k: "r", tex: "\\pm\\dfrac{\\sqrt{b^{2} - 4ac}}{2a}" }],
      { move: "m", op: "op", em: 6.6 }),
    rs1: () => line1("\\sqrt{\\left(x + \\dfrac{b}{2a}\\right)^{2}} = \\pm\\sqrt{\\dfrac{b^{2} - 4ac}{4a^{2}}}", null, 6.4),
    rs1b: () => line1("\\sqrt{\\left(x + \\dfrac{b}{2a}\\right)^{2}} = \\pm\\sqrt{\\dfrac{b^{2} - 4ac}{4a^{2}}}", null, 6.4),
    rs2: () => line1("x + \\dfrac{b}{2a} = \\pm\\dfrac{\\sqrt{b^{2} - 4ac}}{\\sqrt{4a^{2}}} = \\pm\\dfrac{\\sqrt{b^{2} - 4ac}}{2a}", null, 6.2),
    g8a: () => line1("x = -\\dfrac{b}{2a} \\pm \\dfrac{\\sqrt{b^{2} - 4ac}}{2a}", null, 6.6),
    g8: () => line1("x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}", GREEN, 10),
    /* part 3 */
    c1: () => line1("a = 1,\\ \\ b = 6,\\ \\ c = -16"),
    c2: () => line1("x = \\dfrac{-6 \\pm \\sqrt{36 + 64}}{2} = \\dfrac{-6 \\pm 10}{2}", null, 6.6),
    c3: () => line1("x = 2\\ \\ \\text{or}\\ \\ x = -8\\ \\ \\checkmark", GREEN),
    d1: () => line1("b^{2} - 4ac > 0:\\ \\text{two}\\quad = 0:\\ \\text{one}\\quad < 0:\\ \\text{none}", PURPLE, 6),
  };
  const picAt = {
    f0: at(20), g8: at(20),
    gn: geoAt(6, 13.5), gg: geoAt(0, 13.5),
    n1u: at(UNDER), n2u: at(UNDER), n3u: at(UNDER), g3u: at(UNDER), g4u: at(UNDER), g5u: at(UNDER),
    rule1: at(UNDER), rule2: at(UNDER),
    n3s: at(SLOT[0]), r1: at(SLOT[1]), r2: at(SLOT[2]), r3: at(SLOT[3]),
    r3b: at(SLOT[0]), T1a: at(SLOT[1]), T1b: at(SLOT[2]), n5: at(SLOT[3]),
    g1: at(SLOT[0]), dv: at(SLOT[1]), T2: at(SLOT[2]), g3: at(SLOT[3]),
    g5s: at(TALL[0]), g6: at(TALL[1]), rs1: at(TALL[2]),
    rs1b: at(TALL[0]), rs2: at(TALL[1]),
    T3: at(TALL[0]), g8a: at(TALL[1]),
    c1: at(SLOT[0]), c2: at(SLOT[1]), c3: at(SLOT[2]), d1: at(SLOT[3]),
  };
  const simple = ["f0", "n1u", "n2u", "n3u", "rule1", "rule2", "n3s", "r1", "r2", "r3", "r3b", "rs1", "rs1b", "rs2", "g8a", "n5", "g1", "g3", "g3u", "g4u", "g5u", "g5s", "g6", "g8", "c1", "c2", "c3", "d1"];
  const stages = {
    ...geoStages("gn"), ...geoStages("gg"), ...divStages("dv"), ...transferStages("T1a"), ...transferStages("T1b"), ...transferStages("T2"), ...transferStages("T3"),
    ...Object.fromEntries(simple.map((k) => [`${k}.all`, (s, H) => { H.write(key(s, "a"), 0.1); if (["n3u", "n5", "g5u", "g8", "c3", "f0"].includes(k)) H.sound("ding", 0.6); }])),
  };

  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "Where does the quadratic formula come from? Derive it by completing the square, with a picture." },
      { id: "a2", text: "Solve \\(x^{2} + 6x = 16\\) by completing the square." },
      { id: "a3", text: "Now any quadratic: \\(ax^{2} + bx + c = 0\\). Solve it for \\(x\\)." },
    ],
    pics, picAt,
    lines: [
      { id: "k1", receipt: true, sub: "Part 1", text: "Completing the square, with numbers", y: 50.5 },
      { id: "k2", receipt: true, sub: "Part 2", text: "The same steps, with letters", y: 50.5 },
      { id: "k3", receipt: true, sub: "Part 3", text: "Check it, and read the root", y: 50.5 },
    ],
    stages,
    steps: ({ push }) => {
      push("You've probably met the quadratic formula: x equals minus b, plus or minus the square root of b squared minus four a c, all over two a. It looks like it fell out of the sky. It didn't. Today we'll build it ourselves, with a picture, so you'll never have to just trust it again.",
        { on: ["a1", "f0"], add: ["f0.all"], cue: { "f0.all": "the quadratic formula" }, transition: "iris", pause: 0.8 });
      push("The idea we need is called completing the square. Before we touch any letters, let's see it with ordinary numbers, because the picture is exactly the same.", { pause: 0.6 });

      /* ── PART 1: NUMBERS, with the picture ── */
      push("Here's the equation: x squared plus six x equals sixteen. We don't know x, so we'll draw what each part MEANS. x squared is the area of a square whose sides are x long.",
        { on: ["a2", "gn", "n1u", "k1"], off: ["a1", "f0"], add: ["gn.sq", "n1u.all"], cue: { "gn.sq": "x squared is the area" }, transition: { kind: "card", title: "Part 1", sub: "Completing the square, with numbers", hold: 1.6 }, pause: 0.6 });
      push("And six x is six bars, each x long and one wide: one, two, three, four, five, six. Lay them beside the square. Together, the square and the bars have an area of sixteen. That's all the equation says.",
        { add: ["gn.strip"], cue: { "gn.strip": "six x is" }, pause: 0.8 });
      push("Now the clever part. Split the six bars down the middle: three bars on one side, three on the other. Each group of three bars has an area of three x.",
        { add: ["gn.cut"], cue: { "gn.cut": "split the six" }, pause: 0.6 });
      push("Take one group of three bars, turn it round, and lay it along the bottom of the square. Watch it move. Nothing has been added or lost: the area is still sixteen. But look at the shape now.",
        { add: ["gn.move"], cue: { "gn.move": "take one group" }, pause: 0.8 });
      push("It's ALMOST a square. A big square with sides of x plus three, except for one little corner that's missing: a corner three by three.",
        { add: ["gn.corner"], cue: { "gn.corner": "except for one" }, pause: 0.8 });
      push("So let's fill it in with little unit squares: one, two, three, four, five, six, seven, eight, nine. Adding nine completes the square. But an equation is a balance: whatever we add to one side, we must add to the other. So nine goes on BOTH sides.",
        { on: ["n2u"], off: ["n1u"], add: ["gn.fill", "n2u.all"], cue: { "gn.fill": "fill it in", "n2u.all": "both sides" }, pause: 0.8 });
      push("Now the left side is a perfect square, sides x plus three, so its area is x plus three, squared. And the right side is sixteen plus nine, twenty-five. That's why it's called completing the square: we added the missing corner.",
        { on: ["n3u"], off: ["n2u"], add: ["gn.big", "n3u.all"], cue: { "gn.big": "now the left side", "n3u.all": "twenty-five" }, pause: 0.8 });

      /* THE RULE, BY OBSERVATION */
      push("Before we go on, look at the number we added: nine. Where did it come from? The six x split into two threes, and the corner was three by three. Three is HALF of six, and nine is three squared. So here's the rule: to complete the square, add half the number in front of x, squared. Half of six is three; three squared is nine. Remember that: we'll use it again in a moment.",
        { on: ["rule1"], off: ["n3u"], add: ["rule1.all"], cue: { "rule1.all": "look at the number" }, pause: 1 });

      /* part 1, the stack: no picture needed now, so the working takes the middle */
      push("The picture has done its job, so let's work down the middle. We have x plus three, all squared, equals twenty-five.",
        { on: ["n3s"], off: ["gn", "rule1"], add: ["n3s.all"], cue: { "n3s.all": "we have" }, pause: 0.6 });
      push("To undo a square, we take the square root, and to keep the balance, we take the square root of BOTH sides: the square root of x plus three, squared, and the square root of twenty-five.",
        { on: ["r1"], add: ["r1.all"], cue: { "r1.all": "the square root of" }, pause: 0.8 });
      push("The square root undoes the square on the left, leaving just x plus three. On the right, the square root of twenty-five is five. But careful: minus five, times minus five, is ALSO twenty-five. So the root could be five or minus five. That's why we write plus or minus here, at the moment we take the root: x plus three equals plus or minus five.",
        { on: ["r2"], add: ["r2.all"], cue: { "r2.all": "the square root undoes" }, pause: 1 });
      push("Plus or minus means two equations, and each one is a simple LINEAR equation, with no squares left: x plus three equals five, or x plus three equals minus five.",
        { on: ["r3"], add: ["r3.all"], cue: { "r3.all": "two equations" }, pause: 0.8 });
      push("Solve them one at a time. The first: x plus three equals five. Move the three across the equals sign. It was ADDED on the left, so it lands as TAKE AWAY on the right: x equals five take away three, which is two.",
        { on: ["r3b", "T1a"], off: ["n3s", "r1", "r2", "r3"], add: ["r3b.all", "T1a.show", "T1a.go"], cue: { "T1a.go": "move the three" }, pause: 0.8 });
      push("The second: x plus three equals minus five. Move the three across the same way: x equals minus five take away three, which is minus eight.",
        { on: ["T1b"], add: ["T1b.show", "T1b.go"], cue: { "T1b.go": "move the three" }, pause: 0.8 });
      push("So x is two, or x is minus eight. Two answers. Check the first: two squared is four, plus six twos is twelve, sixteen. It works.",
        { on: ["n5"], add: ["n5.all"], cue: { "n5.all": "so x is two" }, pause: 1 });

      /* ── PART 2: LETTERS ── */
      push("Now the real thing. Any quadratic looks like this: a x squared, plus b x, plus c, equals nought. a, b and c are just numbers we haven't been told. We'll do exactly what we just did, step by step, down the middle of the board.",
        { on: ["a3", "g1", "k2"], off: ["a2", "r3b", "T1a", "T1b", "n5", "k1"], add: ["g1.all"], cue: { "g1.all": "any quadratic" }, transition: { kind: "card", title: "Part 2", sub: "The same steps, with letters", hold: 1.6 }, pause: 0.6 });
      push("Step one. Our picture started with x squared, ONE square, not a lots of them. So divide every term by a. Watch: a x squared over a, b x over a, c over a, and nought over a.",
        { on: ["dv"], add: ["dv.top", "dv.div"], cue: { "dv.div": "watch" }, pause: 0.8 });
      push("Now cancel. In the first term, the a on top and the a underneath cancel: a over a is one, so it's just x squared. And nought divided by a is nought.",
        { add: ["dv.cancel"], cue: { "dv.cancel": "now cancel" }, pause: 0.8 });
      push("So we have x squared, plus b over a x, plus c over a, equals nought.",
        { on: ["T2"], add: ["T2.show"], cue: { "T2.show": "so we have" }, pause: 0.6 });
      push("Step two. The picture needs the number on its own over on the other side. So move c over a across. It was added on the left, so it lands as minus c over a on the right, in place of the nought.",
        { add: ["T2.go"], cue: { "T2.go": "move c over a" }, pause: 0.8 });
      push("x squared plus b over a x equals minus c over a. Now it looks just like x squared plus six x equals sixteen, so now we draw.",
        { on: ["g3"], add: ["g3.all"], cue: { "g3.all": "x squared plus" }, pause: 0.6 });

      /* part 2, the picture: the stack goes, the picture takes the middle, the line goes under it */
      push("A square, x by x. A strip beside it, x tall, and b over a wide.",
        { on: ["gg", "g3u"], off: ["g1", "dv", "T2", "g3"], add: ["gg.sq", "gg.strip", "g3u.all"], cue: { "gg.strip": "a strip" }, pause: 0.8 });
      push("Cut the strip down the middle. Half of b over a is b over two a, so each half is b over two a wide.",
        { add: ["gg.cut"], cue: { "gg.cut": "cut the strip" }, pause: 0.6 });
      push("Turn one half and lay it along the bottom. Again, the same area, and again a big square with one corner missing.",
        { add: ["gg.move", "gg.corner"], cue: { "gg.move": "turn one half", "gg.corner": "one corner" }, pause: 0.8 });
      push("Now the rule we noticed: add half the number in front of x, squared. The number in front of x is b over a. Half of it is b over two a, and that's exactly the side of the missing corner.",
        { on: ["rule2"], off: ["g3u"], add: ["rule2.all"], cue: { "rule2.all": "the rule we noticed" }, pause: 0.8 });
      push("So the corner is b over two a by b over two a: b over two a, squared. Fill it in, and to keep the balance, add it to BOTH sides.",
        { on: ["g4u"], off: ["rule2"], add: ["gg.fill", "g4u.all"], cue: { "gg.fill": "fill it in" }, pause: 0.8 });
      push("The left side is now a complete square with sides x plus b over two a. On the right, b over two a squared is b squared over four a squared, then minus c over a.",
        { on: ["g5u"], off: ["g4u"], add: ["gg.big", "g5u.all"], cue: { "gg.big": "the left side" }, pause: 0.8 });

      /* part 2, the stack again */
      push("The picture's done, so back down the middle. Step three: put the right side over one bottom. Multiply c over a, top and bottom, by four a: four a c over four a squared. Subtract, and it's b squared minus four a c, over four a squared.",
        { on: ["g5s", "g6"], off: ["gg", "g5u"], add: ["g5s.all", "g6.all"], cue: { "g6.all": "subtract" }, pause: 0.8 });
      push("Step four: undo the square, the same way as before. Take the square root of BOTH sides. And as soon as we take a root, the plus or minus comes in, because a negative number squared gives the same positive answer.",
        { on: ["rs1"], add: ["rs1.all"], cue: { "rs1.all": "take the square root" }, pause: 0.8 });
      push("On the left, the root undoes the square: x plus b over two a. On the right, the root of a fraction is the root of the top over the root of the bottom. The bottom is four a squared, and its root is two a, because two a times two a is four a squared. The top, b squared minus four a c, has no neat root, so it stays under the root sign.",
        { on: ["rs1b", "rs2"], off: ["g5s", "g6", "rs1"], add: ["rs1b.all", "rs2.all"], cue: { "rs2.all": "on the left" }, pause: 1 });
      push("So x plus b over two a equals plus or minus the root of b squared minus four a c, over two a. Last step: get x on its own. Move b over two a across the equals sign. It was added, so it lands as a minus.",
        { on: ["T3"], off: ["rs1b", "rs2"], add: ["T3.show", "T3.go"], cue: { "T3.go": "move b over" }, pause: 0.8 });
      push("x equals minus b over two a, plus or minus the root over two a.",
        { on: ["g8a"], add: ["g8a.all"], cue: { "g8a.all": "x equals" }, pause: 0.6 });
      push("Both fractions are over two a, so they join into one. x equals minus b, plus or minus the square root of b squared minus four a c, all over two a. That's the quadratic formula, the one we started with, and we built it from a square and some bars.",
        { on: ["g8"], off: ["T3", "g8a"], add: ["g8.all"], cue: { "g8.all": "both fractions" }, pause: 1.2 });

      /* ── PART 3 ── */
      push("Let's check it against part one. x squared plus six x minus sixteen equals nought. So a is one, b is six, and c is minus sixteen.",
        { on: ["c1", "k3"], off: ["g8", "k2"], add: ["c1.all"], cue: { "c1.all": "so a is one" }, transition: { kind: "card", title: "Part 3", sub: "Check it, and read the root", hold: 1.6 }, pause: 0.6 });
      push("b squared is thirty-six. Minus four a c is minus four times one times minus sixteen, which is plus sixty-four. Thirty-six plus sixty-four is a hundred, and its root is ten. So x is minus six, plus or minus ten, over two.",
        { on: ["c2"], add: ["c2.all"], cue: { "c2.all": "so x is" }, pause: 0.8 });
      push("Minus six plus ten, over two, is two. Minus six minus ten, over two, is minus eight. The same two answers the picture gave us.",
        { on: ["c3"], add: ["c3.all"], cue: { "c3.all": "the same two" }, pause: 1 });
      push("And the part under the root, b squared minus four a c, tells you how many answers there are before you finish. Positive: two answers. Nought: one. Negative: there's no real square root, so no real answer at all.",
        { on: ["d1"], add: ["d1.all"], cue: { "d1.all": "positive" }, pause: 1 });
      push("So the quadratic formula is just completing the square, done once with letters, so you never have to do it again. A square, some bars cut in half, one missing corner, and the same steps every time.");
    },
  });
}
