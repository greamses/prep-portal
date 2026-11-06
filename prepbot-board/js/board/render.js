/* ============================================================================
   PrepBot Board — drawing on the board
   ----------------------------------------------------------------------------
   Turns one op into SVG on the current page, and says how to draw it on: a
   stroke is drawn by its dash (the pen travelling along it), writing and
   maths are uncovered left to right (the hand moving across the board), a dot
   pops. Every builder returns { node, box, draw(tl, at, dur) } so the board can
   lay a beat's ops along one GSAP timeline that lasts as long as the sentence.

   Writing is Shantell Sans — the board, like a sticky note, is paper written
   on by hand (DESIGN.md records this one exception). Maths is MathJax SVG with
   its glyphs inside it, so it can sit anywhere in this SVG.
   ========================================================================== */

import { toTeX } from "/utils/components/math-linear.js";
import { SIZES, splitAtEquals } from "./layout.js";
import { makeMapper, gridMapper, compileFn, samplePlot, pathOf } from "./plot.js";

const NS = "http://www.w3.org/2000/svg";
/* THE HANDS the board can write in. American school cursive is the default
   (Playwrite US Trad, a handwriting-teaching face) — the board teaches the
   way a teacher writes on one. Each says how tall its loops reach above and
   below the line, so the lines never touch. */
export const HANDS = {
  trad: { label: "American cursive", family: "Playwrite US Trad", css: "Playwrite+US+Trad:wght@100..400", text: 300, title: 400, up: 0.98, down: 0.42 },
  modern: { label: "American school print", family: "Playwrite US Modern", css: "Playwrite+US+Modern:wght@100..400", text: 300, title: 400, up: 0.98, down: 0.42 },
  joined: { label: "British school hand", family: "Playwrite GB J", css: "Playwrite+GB+J:wght@100..400", text: 300, title: 400, up: 0.98, down: 0.42 },
  caveat: { label: "Quick notes (Caveat)", family: "Caveat", css: "Caveat:wght@500;700", text: 500, title: 700, up: 0.8, down: 0.28, size: 1.18 },
  print: { label: "Neat print (Patrick Hand)", family: "Patrick Hand", css: "Patrick+Hand", text: 400, title: 400, up: 0.82, down: 0.26, size: 1.05 },
  kalam: { label: "Marker (Kalam)", family: "Kalam", css: "Kalam:wght@400;700", text: 400, title: 700, up: 0.9, down: 0.32 },
};
let HAND = HANDS.trad;
export let FONT = `"${HAND.family}", "Segoe Script", cursive`;
/** Write in another hand from now on (the board is redrawn by its owner). */
export function setHand(key) {
  HAND = HANDS[key] || HANDS.trad;
  FONT = `"${HAND.family}", "Segoe Script", cursive`;
  return HAND;
}
const MONO = `"JetBrains Mono", Consolas, monospace`;

export function el(tag, attrs = {}, parent = null) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

/* ── the pencil ──────────────────────────────────────────────────────────── */

let PEN = null;
/** The board hands in its pencil; every drawing below moves it. */
export function setPen(pen) { PEN = pen; }

/**
 * A pencil on the board's top layer, its LEAD at the point being drawn. It
 * travels along a line of writing as the line is uncovered, and along every
 * curve, arrow and underline as it is drawn, so the eye follows the hand.
 */
export function createPen(layer, gsap) {
  const g = el("g", { class: "pb-pen", opacity: 0 }, layer);
  const body = el("g", { transform: "rotate(-38)" }, g);
  el("polygon", { points: "0,0 9,-3.4 9,3.4", fill: "#2a2723" }, body);
  el("polygon", { points: "9,-3.4 30,-10 30,10 9,3.4", fill: "#f0d3a2" }, body);
  el("rect", { x: 30, y: -10, width: 92, height: 20, fill: "#f4c95d" }, body);
  el("rect", { x: 30, y: -2, width: 92, height: 4, fill: "#e0ad3c" }, body);
  el("rect", { x: 122, y: -10, width: 11, height: 20, fill: "#c4bdb2" }, body);
  el("rect", { x: 133, y: -10, width: 13, height: 20, fill: "#f07a7a" }, body);
  let x = null, y = null, restT = null;
  const place = () => g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  return {
    /** Move the lead towards (tx, ty), a little smoothed, like a real hand. */
    to(tx, ty, snap = false) {
      if (x === null || snap) { x = tx; y = ty; }
      else { x += (tx - x) * 0.55; y += (ty - y) * 0.55; }
      place();
    },
    show() {
      clearTimeout(restT);
      if (gsap) gsap.to(g, { opacity: 1, duration: 0.15, overwrite: "auto" }); else g.setAttribute("opacity", 1);
    },
    /** Lift the pencil off the board when there is nothing to draw. */
    rest(after = 0.7) {
      clearTimeout(restT);
      restT = setTimeout(() => { if (gsap) gsap.to(g, { opacity: 0, duration: 0.3 }); else g.setAttribute("opacity", 0); }, after * 1000);
    },
    /** Add a tween that walks the pencil along pointAt(p), p from 0 to 1. */
    follow(tl, at, dur, pointAt, ease = "none") {
      const o = { p: 0 };
      const self = this;
      tl.to(o, {
        p: 1, duration: dur, ease,
        onStart() { self.show(); const [a, b] = pointAt(0); self.to(a, b); },
        onUpdate() { const [a, b] = pointAt(o.p); self.to(a, b); },
      }, at);
    },
  };
}

/* ── maths ───────────────────────────────────────────────────────────────── */

const texCache = new Map();
/** A piece of maths as an SVG element sized in board units at `font`, with
    its glyphs inside it (local font cache, as sticky-math.js does). */
function mathSvg(src, font) {
  const tex = toTeX(src);
  let proto = texCache.get(tex);
  if (proto === undefined) {
    proto = null;
    try {
      const out = window.MathJax.startup?.output;
      const was = out?.options?.fontCache;
      if (out?.options) out.options.fontCache = "local";
      try {
        proto = window.MathJax.tex2svg(tex, { display: false }).querySelector("svg");
      } finally {
        if (out?.options && was !== undefined) out.options.fontCache = was;
      }
    } catch { proto = null; }
    texCache.set(tex, proto);
  }
  if (!proto) return null;
  const svg = proto.cloneNode(true);
  const ex = font * 0.5;
  const w = parseFloat(proto.getAttribute("width")) * ex;
  const h = parseFloat(proto.getAttribute("height")) * ex;
  const va = /vertical-align:\s*(-?[\d.]+)ex/.exec(proto.getAttribute("style") || "");
  const depth = va ? -parseFloat(va[1]) * ex : 0;
  svg.removeAttribute("style");
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("overflow", "visible");
  return { node: svg, w, h, depth };
}

/* ── writing: words and maths on one line ────────────────────────────────── */

/** "Speed $v = d/t$ here" → [{text}, {math}, {text}] */
export function segments(text) {
  const out = [];
  String(text).split(/(\$[^$]+\$)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) out.push({ math: part.slice(1, -1).trim() });
    else if (part.trim()) out.push({ text: part.trim() });
  });
  return out;
}

/**
 * Lay the op's writing out into lines that fit `maxW`: words wrap, a maths
 * piece too wide on its own is broken at its "=" signs. Returns lines of atoms,
 * each atom already built (so it has its true measured width).
 */
function buildAtoms(op, measureLayer, maxW) {
  const font = (SIZES[op.as] || SIZES.step).font;
  const atoms = [];
  const textAtom = (s) => {
    const fs = font * (HAND.size || 1);
    const n = el("text", { "font-size": fs, "font-family": FONT, "font-weight": op.as === "title" ? HAND.title : HAND.text, class: `pb-ink-${op.tone}-fill` }, measureLayer);
    n.textContent = s;
    const w = n.getComputedTextLength();
    return { node: n, w, up: fs * HAND.up, down: fs * HAND.down, kind: "text" };
  };
  const mathAtom = (src) => {
    const m = mathSvg(src, font * 1.05);
    if (!m) return textAtom(src); // MathJax missing: the source still says it
    m.node.setAttribute("class", `pb-math pb-ink-${op.tone}-fill`);
    measureLayer.appendChild(m.node);
    return { node: m.node, w: m.w, up: m.h - m.depth, down: m.depth, kind: "math" };
  };
  for (const seg of segments(op.text)) {
    if (seg.text) {
      for (const word of seg.text.split(" ")) atoms.push(textAtom(word));
    } else {
      const a = mathAtom(seg.math);
      if (a.w > maxW) {
        a.node.remove();
        const parts = splitAtEquals(seg.math);
        parts.forEach((p, i) => atoms.push({ ...mathAtom(p), breakBefore: i > 0 }));
      } else atoms.push(a);
    }
  }
  /* greedy fill */
  const gap = font * 0.32;
  const lines = [];
  let cur = [], w = 0;
  for (const a of atoms) {
    const need = cur.length ? w + gap + a.w : a.w;
    if (cur.length && (need > maxW || a.breakBefore)) {
      lines.push({ atoms: cur, w });
      cur = [a];
      w = a.w;
    } else {
      cur.push(a);
      w = need;
    }
  }
  if (cur.length) lines.push({ atoms: cur, w });
  return { lines, gap, font };
}

/**
 * Build a write op: one group per line, placed by the layout. `placeLine(kind,
 * size)` returns a box or null (null = the board turned a page and placing is
 * done on the new page by the caller's retry). Returns { node, box, draw }.
 */
export function buildWrite(op, page, measureLayer, layout) {
  const C = layout.canvas.main;
  const { lines, gap } = buildAtoms(op, measureLayer, C.w);
  const group = el("g", { class: `pb-write pb-write--${op.as}`, "data-id": op.id }, page);
  const lineBoxes = [];
  for (const line of lines) {
    const up = Math.max(...line.atoms.map((a) => a.up));
    const down = Math.max(...line.atoms.map((a) => a.down));
    const size = { w: line.w, h: up + down };
    let box = layout.place(op.as, size);
    if (box.turn) return { turn: true, cleanup: () => { group.remove(); lines.forEach((l) => l.atoms.forEach((a) => a.node.remove())); } };
    const g = el("g", { transform: `translate(${box.x} ${box.y}) scale(${box.scale})` }, group);
    let x = 0;
    for (const a of line.atoms) {
      g.appendChild(a.node);
      if (a.kind === "text") { a.node.setAttribute("x", x); a.node.setAttribute("y", up); }
      else { a.node.setAttribute("x", x); a.node.setAttribute("y", up - (a.up)); }
      x += a.w + gap;
    }
    lineBoxes.push({ g, box, w: line.w, h: size.h });
  }
  const box = union(lineBoxes.map((l) => l.box));
  return {
    node: group,
    box,
    /* a brisk hand: about fourteen characters a second */
    weight: 0.3 + op.text.replace(/\$/g, "").length / 14,
    draw(tl, at, dur) {
      /* uncover each line left to right, one after another */
      const total = lineBoxes.reduce((s, l) => s + l.w, 0) || 1;
      let t = at;
      for (const l of lineBoxes) {
        const d = (dur * l.w) / total;
        const clipId = `clip-${op.id}-${Math.random().toString(36).slice(2, 7)}`;
        const cp = el("clipPath", { id: clipId }, l.g);
        const r = el("rect", { x: -8, y: -12, width: 0, height: l.h + 24 }, cp);
        l.g.setAttribute("clip-path", `url(#${clipId})`);
        tl.to(r, { attr: { width: l.w + 16 }, duration: d, ease: "none" }, t);
        const lb = l.box;
        PEN?.follow(tl, t, d, (p) => [
          lb.x + p * lb.w,
          lb.y + lb.h * 0.66 + Math.sin((p * lb.w) / 11) * lb.h * 0.14,
        ]);
        t += d;
      }
    },
  };
}

/* ── the figure panel ────────────────────────────────────────────────────── */

const PAD = { left: 62, right: 22, top: 22, bottom: 54 };

export function buildGraph(op, page, layout) {
  const F = layout.canvas.figure;
  const inner = { x: F.x + PAD.left, y: F.y + PAD.top, w: F.w - PAD.left - PAD.right, h: F.h - PAD.top - PAD.bottom };
  const m = makeMapper(op, inner);
  const g = el("g", { class: "pb-graph", "data-id": op.id }, page);
  const grid = el("g", { class: "pb-grid" }, g);
  if (op.grid) {
    for (const v of m.ticks.x) el("line", { x1: m.toX(v), y1: inner.y, x2: m.toX(v), y2: inner.y + inner.h }, grid);
    for (const v of m.ticks.y) el("line", { x1: inner.x, y1: m.toY(v), x2: inner.x + inner.w, y2: m.toY(v) }, grid);
  }
  const ox = m.originX(), oy = m.originY();
  const axes = el("g", { class: "pb-axes pb-ink-ink-stroke" }, g);
  const xAxis = el("path", { d: `M${inner.x} ${oy}L${inner.x + inner.w + 12} ${oy}` }, axes);
  const yAxis = el("path", { d: `M${ox} ${inner.y + inner.h}L${ox} ${inner.y - 12}` }, axes);
  const heads = el("g", { class: "pb-ink-ink-fill" }, g);
  el("path", { d: arrowHead(inner.x + inner.w + 12, oy, 0) }, heads);
  el("path", { d: arrowHead(ox, inner.y - 12, -Math.PI / 2) }, heads);
  const nums = el("g", { class: "pb-ticks" }, g);
  for (const v of m.ticks.x) {
    if (v === 0 && m.ticks.y.includes(0)) continue;
    const t = el("text", { x: m.toX(v), y: oy + 30, "text-anchor": "middle", "font-family": MONO, "font-size": 19 }, nums);
    t.textContent = fmt(v);
  }
  for (const v of m.ticks.y) {
    if (v === 0) continue;
    const t = el("text", { x: ox - 12, y: m.toY(v) + 6, "text-anchor": "end", "font-family": MONO, "font-size": 19 }, nums);
    t.textContent = fmt(v);
  }
  if (m.ticks.x.includes(0) && m.ticks.y.includes(0)) {
    const t = el("text", { x: ox - 12, y: oy + 28, "text-anchor": "end", "font-family": MONO, "font-size": 19 }, nums);
    t.textContent = "0";
  }
  const labels = el("g", { class: "pb-ink-blue-fill", "font-family": FONT, "font-weight": HAND.text, "font-size": 26 }, g);
  if (op.xlabel) { const t = el("text", { x: inner.x + inner.w, y: oy - 14, "text-anchor": "end" }, labels); t.textContent = op.xlabel; }
  if (op.ylabel) { const t = el("text", { x: ox + 14, y: inner.y + 6 }, labels); t.textContent = op.ylabel; }
  return {
    node: g,
    box: F,
    mapper: m,
    weight: 1.0,
    draw(tl, at, dur) {
      tl.from(grid, { opacity: 0, duration: dur * 0.3 }, at);
      drawStroke(tl, xAxis, at, dur * 0.4);
      drawStroke(tl, yAxis, at + dur * 0.3, dur * 0.4);
      tl.from(heads, { opacity: 0, duration: 0.15 }, at + dur * 0.7);
      tl.from([nums, labels], { opacity: 0, duration: dur * 0.3 }, at + dur * 0.7);
    },
  };
}

export function buildPlot(op, page, graph) {
  let f;
  try { f = compileFn(op.expr); } catch { return null; }
  const lines = samplePlot(f, graph.mapper, op.x);
  if (!lines.length) return null;
  const clipId = `gclip-${op.id}`;
  const g = el("g", { class: "pb-plot", "data-id": op.id }, page);
  const cp = el("clipPath", { id: clipId }, g);
  const b = graph.mapper.box;
  el("rect", { x: b.x - 4, y: b.y - 4, width: b.w + 8, height: b.h + 8 }, cp);
  const path = el("path", { d: pathOf(lines), class: `pb-curve pb-ink-${op.tone}-stroke`, "clip-path": `url(#${clipId})` }, g);
  let labelNode = null;
  if (op.label) {
    const last = lines[lines.length - 1];
    const inside = last.filter(([x, y]) => y >= b.y && y <= b.y + b.h);
    const [lx, ly] = (inside.length ? inside : last)[Math.floor((inside.length || last.length) * 0.82)] || last[last.length - 1];
    labelNode = el("text", { x: Math.min(lx + 10, b.x + b.w - 10), y: Math.max(ly - 14, b.y + 24), "font-family": FONT, "font-weight": HAND.text, "font-size": 26, class: `pb-ink-${op.tone}-fill`, "text-anchor": "end" }, g);
    labelNode.textContent = op.label;
  }
  return {
    node: g, box: b, weight: 1.15,
    draw(tl, at, dur) {
      drawStroke(tl, path, at, dur * 0.9);
      if (labelNode) tl.from(labelNode, { opacity: 0, duration: 0.25 }, at + dur * 0.85);
    },
  };
}

export function buildPoint(op, page, mapper) {
  const x = mapper.toX(op.x), y = mapper.toY(op.y);
  const g = el("g", { class: "pb-point", "data-id": op.id }, page);
  const dot = el("circle", { cx: x, cy: y, r: 8, class: `pb-ink-${op.tone}-fill` }, g);
  let t = null;
  if (op.label) {
    t = el("text", { x: x + 14, y: y - 12, "font-family": FONT, "font-weight": HAND.text, "font-size": 26, class: `pb-ink-${op.tone}-fill` }, g);
    t.textContent = op.label;
  }
  return {
    node: g, box: { x: x - 10, y: y - 10, w: 20, h: 20 }, weight: 0.3,
    draw(tl, at, dur) {
      PEN?.follow(tl, at, Math.min(0.3, dur), () => [x, y]);
      tl.from(dot, { attr: { r: 0 }, duration: Math.min(0.35, dur), ease: "back.out(2)" }, at);
      if (t) tl.from(t, { opacity: 0, duration: 0.25 }, at + Math.min(0.3, dur));
    },
  };
}

export function buildArrow(op, page, mapper) {
  const [x1, y1] = [mapper.toX(op.from[0]), mapper.toY(op.from[1])];
  const [x2, y2] = [mapper.toX(op.to[0]), mapper.toY(op.to[1])];
  const g = el("g", { class: "pb-arrow", "data-id": op.id }, page);
  const line = el("path", { d: `M${x1} ${y1}L${x2} ${y2}`, class: `pb-stroke pb-ink-${op.tone}-stroke${op.dashed ? " is-dashed" : ""}` }, g);
  let head = null;
  if (op.head) head = el("path", { d: arrowHead(x2, y2, Math.atan2(y2 - y1, x2 - x1)), class: `pb-ink-${op.tone}-fill` }, g);
  let t = null;
  if (op.label) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len; // the side away from the line
    t = el("text", { x: mx + nx * 30, y: my + ny * 30 + 8, "text-anchor": "middle", "font-family": FONT, "font-weight": HAND.text, "font-size": 26, class: `pb-ink-${op.tone}-fill` }, g);
    t.textContent = op.label;
  }
  return {
    node: g, box: { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) }, weight: 0.5,
    draw(tl, at, dur) {
      drawStroke(tl, line, at, dur * 0.8, op.dashed);
      if (head) tl.from(head, { opacity: 0, duration: 0.12 }, at + dur * 0.78);
      if (t) tl.from(t, { opacity: 0, duration: 0.25 }, at + dur * 0.8);
    },
  };
}

/* ── pictures ─────────────────────────────────────────────────────────────── */

/** A smooth path through points (Catmull-Rom as cubic Béziers). */
function smoothPath(pts) {
  if (pts.length < 3) return "M" + pts.map((p) => p.join(" ")).join("L");
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)},${c2[0].toFixed(1)} ${c2[1].toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
const ring = (cx, cy, rx, ry) => `M${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}Z`;

/**
 * A shape drawn the way a hand draws it: the outline first (the pencil goes
 * round it), then its fill or shading laid in, then its label.
 */
export function buildShape(op, page, mapper) {
  const X = (v) => mapper.toX(v), Y = (v) => mapper.toY(v);
  const sx = Math.abs(X(1) - X(0)), sy = Math.abs(Y(1) - Y(0));
  let d, shadeD = null, box;
  if (op.kind === "circle" || op.kind === "ellipse" || op.kind === "rect" || op.kind === "sector") {
    const cx = X(op.at[0]), cy = Y(op.at[1]);
    if (op.kind === "circle" || op.kind === "sector") {
      const r = op.r * Math.min(sx, sy);
      box = { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r };
      if (op.kind === "circle") {
        d = ring(cx, cy, r, r);
        const half = {
          left: `M${cx} ${cy - r}A${r} ${r} 0 0 0 ${cx} ${cy + r}Z`,
          right: `M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}Z`,
          top: `M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`,
          bottom: `M${cx - r} ${cy}A${r} ${r} 0 0 0 ${cx + r} ${cy}Z`,
          full: ring(cx, cy, r, r),
        };
        shadeD = op.shade ? half[op.shade] : null;
      } else {
        const a0 = (op.from * Math.PI) / 180, a1 = (op.to * Math.PI) / 180;
        const p0 = [cx + r * Math.cos(a0), cy - r * Math.sin(a0)];
        const p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
        const sweep = op.to - op.from;
        const large = Math.abs(sweep) % 360 > 180 ? 1 : 0;
        d = `M${cx} ${cy}L${p0[0].toFixed(1)} ${p0[1].toFixed(1)}A${r} ${r} 0 ${large} ${sweep > 0 ? 0 : 1} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}Z`;
      }
    } else {
      const rx = (op.w / 2) * sx, ry = (op.h / 2) * sy;
      box = { x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry };
      d = op.kind === "ellipse" ? ring(cx, cy, rx, ry) : `M${cx - rx} ${cy - ry}H${cx + rx}V${cy + ry}H${cx - rx}Z`;
    }
  } else {
    const pts = op.points.map(([x, y]) => [X(x), Y(y)]);
    d = op.kind === "polygon" ? "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") + "Z" : smoothPath(pts);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  const g = el("g", { class: "pb-shape", "data-id": op.id }, page);
  const fill = op.fill && op.kind !== "curve" ? el("path", { d, class: `pb-fill pb-ink-${op.fill}-fill` }, g) : null;
  const shade = shadeD ? el("path", { d: shadeD, class: "pb-shade" }, g) : null;
  const line = el("path", { d, class: `pb-stroke pb-ink-${op.tone}-stroke${op.dashed ? " is-dashed" : ""}` }, g);
  let t = null;
  if (op.label) {
    t = el("text", { x: box.x + box.w / 2, y: box.y + box.h + 32, "text-anchor": "middle", "font-family": FONT, "font-weight": HAND.text, "font-size": 26, class: `pb-ink-${op.tone === "ink" ? "blue" : op.tone}-fill` }, g);
    t.textContent = op.label;
  }
  return {
    node: g, box, weight: 0.55 + (op.points ? op.points.length * 0.05 : 0) + (fill || shade ? 0.25 : 0),
    draw(tl, at, dur) {
      const o = dur * (fill || shade ? 0.72 : 0.9);
      drawStroke(tl, line, at, o, op.dashed);
      if (fill) tl.from(fill, { opacity: 0, duration: dur - o }, at + o);
      if (shade) tl.from(shade, { opacity: 0, duration: dur - o }, at + o);
      if (t) tl.from(t, { opacity: 0, duration: 0.25 }, at + dur * 0.85);
    },
  };
}

/** A highlighter swept behind something already on the board. */
export function buildHighlight(op, page, target) {
  const b = target.box;
  const pad = 8;
  const r = el("rect", { x: b.x - pad, y: b.y - pad / 2, width: 0, height: b.h + pad, class: `pb-hl pb-ink-${op.tone}-fill` });
  /* under the writing, so the ink stays on top of the marker */
  page.insertBefore(r, target.node || null);
  const w = b.w + pad * 2;
  return {
    node: r, box: b, weight: 0.4 + b.w / 1400,
    draw(tl, at, dur) {
      tl.to(r, { attr: { width: w }, duration: dur, ease: "power1.inOut" }, at);
      PEN?.follow(tl, at, dur, (p) => [b.x - pad + p * w, b.y + b.h * 0.72], "power1.inOut");
    },
    instant() { r.setAttribute("width", w); },
  };
}

/** Underline or circle round something already on the board. */
export function buildMark(op, page, target) {
  const b = target.box;
  const g = el("g", { class: "pb-mark", "data-id": op.id }, page);
  let d;
  if (op.op === "underline") {
    const y = b.y + b.h + 8, x0 = b.x - 4, x1 = b.x + b.w + 6;
    d = `M${x0} ${y}C${x0 + (x1 - x0) * 0.3} ${y + 5},${x0 + (x1 - x0) * 0.7} ${y - 4},${x1} ${y + 2}`;
  } else {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, rx = b.w / 2 + 22, ry = b.h / 2 + 16;
    /* a hand-drawn ring: starts a little past the top and overshoots */
    d = `M${cx + rx * 0.2} ${cy - ry}` +
      `C${cx + rx * 1.15} ${cy - ry},${cx + rx * 1.1} ${cy + ry},${cx} ${cy + ry}` +
      `C${cx - rx * 1.12} ${cy + ry},${cx - rx * 1.1} ${cy - ry * 1.05},${cx + rx * 0.35} ${cy - ry * 0.92}`;
  }
  const path = el("path", { d, class: `pb-stroke pb-ink-${op.tone}-stroke` }, g);
  return {
    node: g, box: b, weight: 0.42,
    draw(tl, at, dur) { drawStroke(tl, path, at, dur); },
  };
}

/* ── shared ──────────────────────────────────────────────────────────────── */

export { gridMapper };

function drawStroke(tl, path, at, dur, dashed = false) {
  let len = 0;
  try { len = path.getTotalLength(); } catch { len = 0; }
  if (!len) return;
  if (dashed) {
    /* a dashed line keeps its dashes: reveal it under a growing mask instead */
    tl.from(path, { opacity: 0, duration: dur }, at);
    PEN?.follow(tl, at, dur, (p) => { const q = path.getPointAtLength(len * p); return [q.x, q.y]; });
    return;
  }
  path.style.strokeDasharray = `${len} ${len}`;
  path.style.strokeDashoffset = len;
  tl.to(path, { strokeDashoffset: 0, duration: dur, ease: "power1.inOut", onComplete: () => { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; } }, at);
  PEN?.follow(tl, at, dur, (p) => { const q = path.getPointAtLength(len * p); return [q.x, q.y]; }, "power1.inOut");
}

function arrowHead(x, y, angle, size = 18) {
  const a1 = angle + Math.PI - 0.42, a2 = angle + Math.PI + 0.42;
  return `M${x} ${y}L${x + size * Math.cos(a1)} ${y + size * Math.sin(a1)}L${x + size * Math.cos(a2)} ${y + size * Math.sin(a2)}Z`;
}

function fmt(v) {
  const s = Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0) ? v.toExponential(1) : String(+v.toFixed(2));
  return s.replace("-", "−");
}

function union(boxes) {
  const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.w)), btm = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: r - x, h: btm - y };
}
