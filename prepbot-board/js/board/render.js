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
    lineBoxes.push({ g, box, w: line.w, h: size.h, atoms: line.atoms, up, down });
  }
  const box = union(lineBoxes.map((l) => l.box));
  /* where a WORD or a PHRASE of this line is, on the board (for marking just it) */
  const norm = (w) => String(w || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const words = [];
  for (const l of lineBoxes) {
    for (const a of l.atoms) {
      const x0 = +a.node.getAttribute("x") || 0;
      words.push({ w: a.kind === "text" ? norm(a.node.textContent) : "", box: { x: l.box.x + x0 * l.box.scale, y: l.box.y, w: a.w * l.box.scale, h: l.box.h } });
    }
  }
  const wordBox = (phrase) => {
    const want = String(phrase || "").split(/\s+/).map(norm).filter(Boolean);
    if (!want.length) return null;
    for (let i = 0; i + want.length <= words.length; i++) {
      if (want.every((w, j) => words[i + j].w === w)) return union(words.slice(i, i + want.length).map((x) => x.box));
    }
    /* one word that only starts the same (plural, "the cell's") */
    const hit = want.length === 1 && words.find((x) => x.w && (x.w.startsWith(want[0]) || want[0].startsWith(x.w)));
    return hit ? hit.box : null;
  };
  return {
    node: group,
    box,
    wordBox,
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
        /* the pencil goes THROUGH the letters: up into an ascender, down into a
           tail, a little loop over each small letter, a zigzag across maths */
        const track = letterTrack(l);
        const lb = l.box;
        PEN?.follow(tl, t, d, (p) => {
          const xl = p * l.w;
          return [lb.x + xl * lb.scale, lb.y + yOnTrack(track, xl) * lb.scale];
        });
        t += d;
      }
    },
  };
}

/* ── the pencil's way through a line of writing ─────────────────────────────
   A list of [x, y] in the line's own units, x always increasing, so the lead
   can be put at any x as the line is uncovered. Each letter gets a stroke of
   its own shape: tall letters reach up to the top of the line, letters with a
   tail dip below it, the rest loop round the middle of the small letters. */
const TALL = /[bdfhklt]|[A-Z0-9?!]/;
const TAIL = /[gjpqyz]/;
function letterTrack(line) {
  const up = line.up, h = line.h;
  const xMid = up - h * 0.18, xTop = up - h * 0.42, top = up - h * 0.62, base = up, low = up + h * 0.22;
  const pts = [[0, xMid]];
  for (const a of line.atoms) {
    const x0 = +a.node.getAttribute("x") || 0;
    if (a.kind === "text") {
      const s = a.node.textContent || "";
      for (let i = 0; i < s.length; i++) {
        let ex;
        try { ex = a.node.getExtentOfChar(i); } catch { ex = null; }
        if (!ex || !ex.width) continue;
        const cx = ex.x, w = ex.width, ch = s[i];
        if (TALL.test(ch)) pts.push([cx + w * 0.2, base], [cx + w * 0.45, top], [cx + w * 0.7, base], [cx + w, xMid]);
        else if (TAIL.test(ch)) pts.push([cx + w * 0.25, xTop], [cx + w * 0.55, low], [cx + w * 0.8, base], [cx + w, xMid]);
        else if (ch === " ") pts.push([cx + w, xMid]);
        else pts.push([cx + w * 0.3, xTop], [cx + w * 0.65, base], [cx + w, xMid]);
      }
    } else {
      /* maths: across the set expression, high and low over its parts */
      const n = Math.max(2, Math.round(a.w / 14));
      for (let i = 1; i <= n; i++) pts.push([x0 + (a.w * i) / n, i % 2 ? up - a.up * 0.7 : up - a.up * 0.15]);
    }
  }
  pts.push([line.w, xMid]);
  /* keep x increasing, so a position along the line has one height */
  const out = [pts[0]];
  for (const q of pts.slice(1)) if (q[0] > out[out.length - 1][0] + 0.01) out.push(q);
  return out;
}
function yOnTrack(track, x) {
  if (x <= track[0][0]) return track[0][1];
  for (let i = 1; i < track.length; i++) {
    const [x1, y1] = track[i];
    if (x <= x1) {
      const [x0, y0] = track[i - 1];
      const k = (x - x0) / (x1 - x0 || 1);
      return y0 + (y1 - y0) * k;
    }
  }
  return track[track.length - 1][1];
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
/**
 * A highlighter BRUSH STROKE behind something already on the board: a band of
 * ink with ragged, uneven edges and a tapered start and finish, as one sweep
 * of a broad brush leaves it — uncovered left to right with the pencil.
 */
export function buildHighlight(op, page, target) {
  const b = target.box;
  const padX = 10, padY = Math.max(4, b.h * 0.12);
  const x0 = b.x - padX, x1 = b.x + b.w + padX;
  const y0 = b.y + padY * 0.4, y1 = b.y + b.h - padY * 0.2;
  /* a seeded wobble, so a stroke is the same every time it is drawn back */
  let seed = [...String(op.id)].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const steps = Math.max(6, Math.round((x1 - x0) / 34));
  const top = [], bot = [];
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const lift = i === 0 || i === steps ? (y1 - y0) * 0.22 : 0; // the brush lands and lifts: thinner at the ends
    top.push([x, y0 + lift + (rnd() - 0.5) * (y1 - y0) * 0.16]);
    bot.push([x, y1 - lift + (rnd() - 0.5) * (y1 - y0) * 0.16]);
  }
  const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const d = `M${f(top[0])}` + top.slice(1).map((p) => `L${f(p)}`).join("")
    + `Q${(x1 + 8).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)} ${f(bot[bot.length - 1])}`
    + bot.slice(0, -1).reverse().map((p) => `L${f(p)}`).join("")
    + `Q${(x0 - 10).toFixed(1)} ${((y0 + y1) / 2 + 3).toFixed(1)} ${f(top[0])}Z`;
  const g = el("g", { class: "pb-hlg" });
  const clipId = `hlc-${op.id}-${Math.random().toString(36).slice(2, 6)}`;
  const cp = el("clipPath", { id: clipId }, g);
  const r = el("rect", { x: x0 - 14, y: b.y - 20, width: 0, height: b.h + 40 }, cp);
  el("path", { d, class: `pb-hl pb-ink-${op.tone}-fill`, "clip-path": `url(#${clipId})` }, g);
  /* under the writing, so the ink stays on top of the brush */
  const under = target.node && target.node.parentNode === page ? target.node : page.firstChild;
  page.insertBefore(g, under || null);
  const w = x1 - x0 + 28;
  return {
    node: g, box: b, weight: 0.4 + b.w / 1400,
    draw(tl, at, dur) {
      tl.to(r, { attr: { width: w }, duration: dur, ease: "power1.inOut" }, at);
      PEN?.follow(tl, at, dur, (p) => [x0 - 14 + p * w, (y0 + y1) / 2 + Math.sin(p * 9) * (y1 - y0) * 0.18], "power1.inOut");
    },
    instant() { r.setAttribute("width", w); },
  };
}

/* ── free sketches ────────────────────────────────────────────────────────── */

/** Absolute M/L/C/Q/Z path data in grid (or graph) units → board units. */
function mapPath(d, mapper) {
  const toks = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [];
  let out = "", nums = [];
  const flush = () => {
    for (let i = 0; i + 1 < nums.length; i += 2) out += `${mapper.toX(nums[i]).toFixed(1)} ${mapper.toY(nums[i + 1]).toFixed(1)} `;
    nums = [];
  };
  for (const t of toks) {
    if (/^[MLCQZ]$/i.test(t)) { flush(); out += t.toUpperCase(); }
    else nums.push(Number(t));
  }
  flush();
  return out.trim();
}

/** PrepBot's own drawing: each line traced by the pencil, fills laid in after. */
export function buildSketch(op, page, mapper) {
  const g = el("g", { class: "pb-sketch", "data-id": op.id }, page);
  const strokes = [], fills = [];
  for (const p of op.paths) {
    const d = mapPath(p.d, mapper);
    if (!d) continue;
    if (p.fill) fills.push(el("path", { d, class: `pb-fill pb-ink-${p.fill}-fill` }, g));
    strokes.push(el("path", { d, class: `pb-stroke pb-ink-${p.tone}-stroke` }, g));
  }
  let box = null;
  try { const b = g.getBBox(); box = { x: b.x, y: b.y, w: b.width, h: b.height }; } catch { box = { ...mapper.box }; }
  let t = null;
  if (op.label) {
    t = el("text", { x: box.x + box.w / 2, y: box.y + box.h + 32, "text-anchor": "middle", "font-family": FONT, "font-weight": HAND.text, "font-size": 26, class: "pb-ink-blue-fill" }, g);
    t.textContent = op.label;
  }
  return {
    node: g, box, weight: 0.5 + strokes.length * 0.35,
    draw(tl, at, dur) {
      const each = (dur * 0.85) / Math.max(1, strokes.length);
      strokes.forEach((s, i) => drawStroke(tl, s, at + i * each, each));
      fills.forEach((f) => tl.from(f, { opacity: 0, duration: dur * 0.15 }, at + dur * 0.85));
      if (t) tl.from(t, { opacity: 0, duration: 0.25 }, at + dur * 0.9);
    },
  };
}

/* ── generated pictures ───────────────────────────────────────────────────── */

/**
 * A picture from the image generator, in the figure panel. A frame is drawn at
 * once with "PrepBot is drawing…"; when the picture arrives (seconds later) it
 * is brushed in with the pencil, and any labels asked for are drawn on it,
 * where the vision model found each part.
 */
export function buildPicture(op, page, layout, gsapRef) {
  const F = layout.canvas.figure;
  const g = el("g", { class: "pb-picture", "data-id": op.id }, page);
  const frame = el("rect", { x: F.x + 10, y: F.y + 10, width: F.w - 20, height: F.h - 60, class: "pb-picture__frame" }, g);
  const wait = el("text", { x: F.x + F.w / 2, y: F.y + F.h / 2, "text-anchor": "middle", class: "pb-picture__wait" }, g);
  wait.textContent = "PrepBot is drawing…";
  const item = {
    node: g, box: { x: F.x, y: F.y, w: F.w, h: F.h - 40 }, weight: 0.4,
    picture: { ready: false, queue: [], data: null, toBoard: null, box: null },
    draw(tl, at, dur) {
      drawStroke(tl, frame, at, dur * 0.8, true);
      tl.from(wait, { opacity: 0, duration: 0.3 }, at);
      if (gsapRef) gsapRef.to(wait, { opacity: 0.35, duration: 0.8, repeat: -1, yoyo: true, delay: at + 0.3 });
    },
    /** The picture has come: put it in, brushed on; then the labels. */
    show(src, natural, animate) {
      gsapRef?.killTweensOf(wait);
      wait.remove();
      frame.classList.add("is-done");
      const k = Math.min((F.w - 30) / natural.w, (F.h - 80) / natural.h);
      const w = natural.w * k, h = natural.h * k;
      const x = F.x + (F.w - w) / 2, y = F.y + 15 + (F.h - 80 - h) / 2;
      const clipId = `pcc-${op.id}-${Math.random().toString(36).slice(2, 6)}`;
      const cp = el("clipPath", { id: clipId }, g);
      const r = el("rect", { x: x - 6, y: y - 6, width: animate ? 0 : w + 12, height: h + 12 }, cp);
      const img = el("image", { href: src, x, y, width: w, height: h, "clip-path": `url(#${clipId})`, preserveAspectRatio: "xMidYMid meet" }, g);
      void img;
      item.picture.toBoard = (u, v) => [x + u * w, y + v * h];
      item.picture.box = { x, y, w, h };
      item.box = { x, y, w, h };
      if (animate && gsapRef) {
        const o = { p: 0 };
        gsapRef.to(r, { attr: { width: w + 12 }, duration: 1.4, ease: "power1.inOut" });
        if (PEN) {
          PEN.show();
          gsapRef.to(o, { p: 1, duration: 1.4, ease: "power1.inOut", onUpdate: () => PEN?.to(x - 6 + o.p * (w + 12), y + h * (0.5 + 0.42 * Math.sin(o.p * Math.PI * 7))), onComplete: () => PEN?.rest() });
        }
      }
    },
  };
  return item;
}

/* ── the drawn diagrams (diagrams.js) ─────────────────────────────────────── */

/** A diagram drawn into the figure panel: uncovered as the pencil sweeps over it. */
export function buildDiagram(op, page, layout, data) {
  const F = layout.canvas.figure;
  /* a drawing whose labels come in from the sides is drawn smaller, leaving
     room for the names beside it inside the panel */
  const sideLabels = !data.parts.some((p) => p.arrow);
  const k = Math.min(F.w / data.w, (F.h - 34) / data.h) * (sideLabels ? (data.steps ? 0.74 : 0.62) : 0.94);
  const ox = F.x + (F.w - data.w * k) / 2, oy = F.y + (F.h - 34 - data.h * k) / 2;
  const g = el("g", { class: "pb-diagram", "data-id": op.id }, page);
  const clipId = `dgc-${op.id}-${Math.random().toString(36).slice(2, 6)}`;
  const cp = el("clipPath", { id: clipId }, g);
  const r = el("rect", { x: ox - 10, y: oy - 10, width: 0, height: data.h * k + 20 }, cp);
  const art = el("g", { "clip-path": `url(#${clipId})` }, g);
  const inner = el("g", { transform: `translate(${ox.toFixed(1)} ${oy.toFixed(1)}) scale(${k.toFixed(4)})` }, art);
  inner.innerHTML = data.art;
  let credit = null;
  if (data.credit) {
    credit = el("text", { x: F.x + F.w, y: F.y + F.h - 6, "text-anchor": "end", class: "pb-credit" }, g);
    credit.textContent = data.credit;
  }
  const toBoard = (x, y) => [ox + x * k, oy + y * k];
  const W = data.w * k + 20, H = data.h * k;
  if (data.steps) {
    /* drawn in steps: only the outline (if any) now; the parts come as they are named */
    r.setAttribute("width", W);
    const lines = [...inner.querySelectorAll(".k-line")];
    return {
      node: g, box: { x: ox, y: oy, w: data.w * k, h: H }, weight: lines.length ? 1.2 : 0.15,
      diagram: { data, toBoard, inner, k, drawn: new Set(), box: { x: ox, y: oy, w: data.w * k, h: H } },
      draw(tl, at, dur) {
        lines.forEach((ln) => traceLine(tl, ln, at, dur, toBoard));
        if (credit) tl.from(credit, { opacity: 0, duration: 0.3 }, at + dur);
      },
    };
  }
  return {
    node: g, box: { x: ox, y: oy, w: data.w * k, h: H }, weight: 1.6,
    diagram: { data, toBoard, box: { x: ox, y: oy, w: data.w * k, h: H } },
    draw(tl, at, dur) {
      tl.to(r, { attr: { width: W }, duration: dur, ease: "power1.inOut" }, at);
      /* the pencil sketches down and up the drawing as it is uncovered */
      PEN?.follow(tl, at, dur, (p) => [ox - 10 + p * W, oy + H * (0.5 + 0.42 * Math.sin(p * Math.PI * 7))], "power1.inOut");
      if (credit) tl.from(credit, { opacity: 0, duration: 0.3 }, at + dur);
    },
    instant() { r.setAttribute("width", W); },
  };
}

/** One part of a step-by-step diagram, drawn into it: outlines traced by the
    pencil, then the colour laid in. */
export function buildPart(op, d, part) {
  const g = el("g", { class: "pb-part", "data-part": part.name }, d.inner);
  g.innerHTML = part.svg;
  const lines = [...g.querySelectorAll(".k-line")];
  const fills = [...g.querySelectorAll(".k-fill")];
  /* the colour sits under the outline, as a pen drawing coloured in */
  fills.forEach((f) => g.insertBefore(f, g.firstChild));
  return {
    node: g, box: d.box, weight: 0.5 + Math.min(1.3, lines.length * 0.3),
    draw(tl, at, dur) {
      const each = (dur * 0.75) / Math.max(1, lines.length);
      lines.forEach((ln, i) => traceLine(tl, ln, at + i * each, each, d.toBoard));
      fills.forEach((f) => tl.from(f, { opacity: 0, duration: dur * 0.3 }, at + dur * 0.7));
    },
  };
}

/* trace one outline inside a scaled diagram, the pencil on its point */
function traceLine(tl, ln, at, dur, toBoard) {
  let len = 0;
  try { len = ln.getTotalLength(); } catch { len = 0; }
  if (!len) { tl.from(ln, { opacity: 0, duration: dur }, at); return; }
  tl.fromTo(ln, { attr: { "stroke-dasharray": `${len} ${len}`, "stroke-dashoffset": len } },
    { attr: { "stroke-dashoffset": 0 }, duration: dur, ease: "none", onComplete: () => { ln.removeAttribute("stroke-dasharray"); ln.removeAttribute("stroke-dashoffset"); } }, at);
  PEN?.follow(tl, at, dur, (p) => { const q = ln.getPointAtLength(len * p); return toBoard(q.x, q.y); }, "none");
}

/** An arrow to a named part of a diagram, and its name at the tail — both drawn. */
export function buildLabel(op, page, d, part, maxX = Infinity) {
  const B = d.box;
  const [tipX, tipY] = d.toBoard(part.cx, part.cy);
  let tailX, tailY;
  if (part.arrow) {
    [tailX, tailY] = d.toBoard(part.arrow[0], part.arrow[1]);
    const t2 = d.toBoard(part.arrow[2], part.arrow[3]);
    /* the library's own arrow, pulled out a little past the drawing's edge */
    const dx = tailX - t2[0], dy = tailY - t2[1], len = Math.hypot(dx, dy) || 1;
    tailX += (dx / len) * 40; tailY += (dy / len) * 40;
  } else {
    /* no arrow given: come in from the nearer side, outside the drawing */
    let left = tipX < B.x + B.w / 2;
    /* never off the edge of the section: no room on the right means the left */
    if (!left && B.x + B.w + 30 + op.text.length * 14 + 16 > maxX) left = true;
    tailX = left ? B.x - 30 : B.x + B.w + 30;
    tailY = tipY;
  }
  /* names never sit on one another: a name that would land on an earlier one
     slides down (then up) the side of the drawing until it is clear */
  const taken = d.labels || (d.labels = []);
  const anchorSide = tailX < tipX ? "end" : "start";
  const estW = op.text.length * 14 + 16;
  const boxAt = (y) => ({ x: anchorSide === "end" ? tailX - estW : tailX, y: y - 24, w: estW, h: 38 });
  const clash = (y) => taken.some((t) => { const a = boxAt(y); return a.x < t.x + t.w && t.x < a.x + a.w && a.y < t.y + t.h && t.y < a.y + a.h; });
  if (clash(tailY)) {
    for (let k = 1; k <= 10; k++) {
      const y = tailY + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 44;
      if (!clash(y)) { tailY = y; break; }
    }
  }
  taken.push(boxAt(tailY));
  const g = el("g", { class: "pb-label", "data-id": op.id }, page);
  const line = el("path", { d: `M${tailX.toFixed(1)} ${tailY.toFixed(1)}L${tipX.toFixed(1)} ${tipY.toFixed(1)}`, class: `pb-stroke pb-ink-${op.tone}-stroke` }, g);
  const dot = el("circle", { cx: tipX, cy: tipY, r: 6, class: `pb-ink-${op.tone}-fill` }, g);
  const anchor = tailX < tipX ? "end" : "start";
  const t = el("text", { x: tailX + (anchor === "end" ? -8 : 8), y: tailY + 8, "text-anchor": anchor, "font-family": FONT, "font-weight": HAND.title, "font-size": 26, class: `pb-ink-${op.tone}-fill pb-label__text` }, g);
  t.textContent = op.text;
  const tw = (() => { try { return t.getComputedTextLength(); } catch { return op.text.length * 12; } })();
  const tx = anchor === "end" ? tailX - 8 - tw : tailX + 8;
  return {
    node: g, box: { x: tx, y: tailY - 22, w: tw, h: 36 }, weight: 0.75,
    draw(tl, at, dur) {
      drawStroke(tl, line, at, dur * 0.55);
      tl.from(dot, { attr: { r: 0 }, duration: 0.2 }, at + dur * 0.5);
      tl.from(t, { opacity: 0, duration: dur * 0.35 }, at + dur * 0.6);
      PEN?.follow(tl, at + dur * 0.6, dur * 0.4, (p) => [tx + p * tw, tailY]);
    },
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
