/* ============================================================================
   PrepBoard — the board: an endless canvas of SECTIONS
   ----------------------------------------------------------------------------
   The canvas never runs out. An explanation is laid out in sections, side by
   side (stacked, on a phone): each the size of the screen, with its writing
   column and its figure panel. When a section is full, or PrepBot starts a new
   part of the explanation ({"op":"clear"}), the next section opens beside it
   and the camera glides across; the earlier ones stay on the canvas. The
   learner can drag to look around, zoom (wheel or pinch), or see them all.

   A beat is played the same as ever: every op is built (placed, measured)
   first, then drawn on along ONE GSAP timeline that lasts as long as the
   sentence. A board is just its sections' ops, so it can be drawn again
   instantly (resize, a new hand, tests).

     const board = createBoard(svg, { gsap, canvas, onTap })
     await board.play(beat, seconds)   draw the beat over `seconds`
     board.finishNow()                 jump the current beat to its end (cut in)
     board.summary()                   what is in this section, for the next turn
     board.overview() / board.follow() see every section / back to the live one
   ========================================================================== */

import { createLayout } from "./layout.js";
import { cleanOp, boardSummary } from "../protocol/ops.js";
import { el, buildWrite, buildGraph, buildPlot, buildPoint, buildArrow, buildMark, buildShape, buildHighlight, buildDiagram, buildLabel, buildPart, buildEmphasis, buildObject, buildMove, buildSketch, buildPicture, gridMapper, createPen, setPen } from "./render.js";
import { ensureDiagrams, loadedDiagram, findPart, stepDiagram, needsLoad } from "./diagrams.js";
import { objectNamed } from "./objects.js";

/* the diagram names a list of ops asks for, so they can be loaded first */
const diagramsIn = (list) => (list || []).filter((o) => o && o.op === "diagram" && o.name && needsLoad(String(o.name).toLowerCase().replace(/\s+/g, "-"), o.steps === true || o.steps === "true")).map((o) => String(o.name).toLowerCase().replace(/\s+/g, "-"));
/* a mark on a whole item, or on just some of its words */
const markTarget = (t, words) => {
  const box = words && t.wordBox ? t.wordBox(words) : null;
  return box ? { ...t, box } : t;
};

const GAP = 140;               // canvas between two sections
const COLUMNS = 2;             // sections across, before the next row (landscape)
const FOLLOW_AFTER_MS = 6000;  // a learner who looked away is brought back after this, when PrepBot draws

/* pictures already made this visit, so a redraw (resize, a new hand) needs no new one */
const pictureCache = new Map(); // prompt → Promise<{ src, w, h, spots }>

export function createBoard(svg, { gsap, orient = "landscape", canvas = null, onTap = null, picture = null, autoCam = true } = {}) {
  const shape = canvas || orient;
  let layout = createLayout(shape);   // the LIVE section's layout (each section has its own)
  const C = layout.canvas;
  const across = layout.orient !== "portrait"; // a grid of sections, or one column on a phone
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("pb-board", `pb-board--${layout.orient}`);
  svg.innerHTML = "";
  const defs = el("defs", {}, svg);
  /* user-space region: a filter sized to a perfectly straight line's bounding box
     (height 0) would clip the whole line away */
  const rough = el("filter", { id: "pb-rough", filterUnits: "userSpaceOnUse", x: -20, y: -20, width: C.w + 40, height: C.h + 40 }, defs);
  el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: 2, seed: 7, result: "n" }, rough);
  el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: 2.2 }, rough);
  /* the highlighter's brush: bristly, uneven edges */
  const brush = el("filter", { id: "pb-brush", filterUnits: "userSpaceOnUse", x: -20, y: -20, width: C.w + 40, height: C.h + 40 }, defs);
  el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.06 0.9", numOctaves: 2, seed: 3, result: "b" }, brush);
  el("feDisplacementMap", { in: "SourceGraphic", in2: "b", scale: 7 }, brush);
  const world = el("g", { class: "pb-world" }, svg);
  const measure = el("g", { class: "pb-measure", opacity: 0 }, svg);

  /* ── sections ──────────────────────────────────────────────────────────── */
  const sections = [];       // { g, page, ops, x, y, layout, items, graph }
  let cur = null;
  let items = new Map();     // id → built thing, in the LIVE section
  let graph = null;          // the graph in the live section, if any
  let tl = null;
  let thinkTw = null;

  const penLayer = el("g", { class: "pb-penlayer" });
  const pen = createPen(penLayer, gsap);

  function addSection() {
    const i = sections.length;
    /* a grid, read like a page: across, then the next row */
    const x = across ? (i % COLUMNS) * (C.w + GAP) : 0;
    const y = across ? Math.floor(i / COLUMNS) * (C.h + GAP) : i * (C.h + GAP);
    const g = el("g", { class: "pb-section", transform: `translate(${x} ${y})` }, world);
    el("rect", { class: "pb-paper", x: 0, y: 0, width: C.w, height: C.h }, g);
    if (i > 0 || sections.length) {
      const tag = el("text", { class: "pb-section__no", x: C.w - 34, y: 44, "text-anchor": "end" }, g);
      tag.textContent = String(i + 1);
    }
    const page = el("g", { class: "pb-page" }, g);
    g.appendChild(penLayer); // the pencil works in the live section
    const s = { g, page, ops: [], x, y, layout: createLayout(shape), items: new Map(), graph: null, n: i + 1 };
    sections.push(s);
    enter(s);
    /* the first section's number appears once there is a second */
    if (sections.length === 2) {
      const t0 = el("text", { class: "pb-section__no", x: C.w - 34, y: 44, "text-anchor": "end" }, sections[0].g);
      t0.textContent = "1";
    }
    return s;
  }

  /* make a section the live one: its layout, its items, the pencil */
  function enter(s) {
    if (cur) { cur.graph = graph; }
    cur = s;
    layout = s.layout;
    items = s.items;
    graph = s.graph;
    s.g.appendChild(penLayer);
  }

  /* ── the camera: the SVG viewBox, over the whole canvas ─────────────────── */
  const cam = { x: 0, y: 0, w: C.w, h: C.h };
  let following = true;
  let lookedAt = 0;      // when the learner last moved the view themselves
  let camTw = null;
  const setView = () => svg.setAttribute("viewBox", `${cam.x.toFixed(1)} ${cam.y.toFixed(1)} ${cam.w.toFixed(1)} ${cam.h.toFixed(1)}`);
  function glide(to, dur = 0.8) {
    camTw?.kill?.();
    if (!gsap || dur <= 0) { Object.assign(cam, to); setView(); return; }
    camTw = gsap.to(cam, { ...to, duration: dur, ease: "power2.inOut", onUpdate: setView });
  }
  const sectionView = (s) => ({ x: s.x, y: s.y, w: C.w, h: C.h });
  function focusLive(dur = 0.8) {
    following = true;
    zoomed = false;
    if (cur) glide(sectionView(cur), dur);
  }
  function viewAll(dur = 0.8) {
    following = false;
    lookedAt = Date.now();
    const W = Math.max(...sections.map((s) => s.x)) + C.w;
    const H = Math.max(...sections.map((s) => s.y)) + C.h;
    const k = Math.max(W / C.w, H / C.h) * 1.06;
    glide({ x: W / 2 - (C.w * k) / 2, y: H / 2 - (C.h * k) / 2, w: C.w * k, h: C.h * k }, dur);
  }

  /* drag to look around, wheel or pinch to zoom; a TAP is the learner cutting in */
  const pts = new Map();
  let drag = null;
  const unitsPerPx = () => {
    const r = svg.getBoundingClientRect();
    return Math.max(cam.w / r.width, cam.h / r.height);
  };
  svg.addEventListener("pointerdown", (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false };
    try { svg.setPointerCapture(e.pointerId); } catch {}
  });
  svg.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      /* pinch: zoom about the middle of the two fingers */
      const [a, b] = [...pts.values()];
      const other = [...pts.entries()].find(([id]) => id !== e.pointerId)[1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(a.x - b.x, a.y - b.y);
      if (before > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, before / after);
      if (drag) drag.moved = true;
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 7) return;
    drag.moved = true;
    camTw?.kill?.();
    following = false;
    lookedAt = Date.now();
    const u = unitsPerPx();
    cam.x = drag.cx - dx * u;
    cam.y = drag.cy - dy * u;
    setView();
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    if (drag && !drag.moved && pts.size === 0) onTap?.(e);
    if (pts.size === 0) drag = null;
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);
  function zoomAt(clientX, clientY, factor) {
    const r = svg.getBoundingClientRect();
    const u = unitsPerPx();
    const wx = cam.x + (clientX - r.left - (r.width - cam.w / u) / 2) * u;
    const wy = cam.y + (clientY - r.top - (r.height - cam.h / u) / 2) * u;
    const k = Math.min(6, Math.max(0.35, (cam.w * factor) / C.w)) * C.w / cam.w;
    camTw?.kill?.();
    cam.x = wx - (wx - cam.x) * k;
    cam.y = wy - (wy - cam.y) * k;
    cam.w *= k;
    cam.h *= k;
    following = false;
    lookedAt = Date.now();
    setView();
  }
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * 0.0015));
  }, { passive: false });

  /* ── building ops ──────────────────────────────────────────────────────── */
  function nextSection(animated = true) {
    addSection();
    if (animated && following) focusLive(0.9);
    else if (!animated) { if (following) focusLive(0); }
  }

  /* Build one op in the live section; returns the built thing or null (skipped). */
  function build(op, animated) {
    const page = cur.page;
    switch (op.op) {
      case "clear":
        /* a new section always opens at the END of the canvas */
        if (cur.ops.length || cur !== sections[sections.length - 1]) {
          if (cur !== sections[sections.length - 1]) enter(sections[sections.length - 1]);
          if (cur.ops.length) nextSection(animated);
          else if (animated && following) focusLive(0.9);
        }
        return null;
      case "look": {
        const s = sections[op.section - 1];
        if (s && s !== cur) { enter(s); if (animated) focusLive(0.9); else focusLive(0); }
        return null;
      }
      case "write": {
        if (op.at || op.beside) {
          const spot = writeSpot(op);
          if (spot) {
            const w = buildWrite(op, page, measure, layout, spot);
            layout.block(w.box);
            return w;
          }
        }
        let w = buildWrite(op, page, measure, layout);
        if (w.turn) {
          w.cleanup();
          nextSection(animated);
          w = buildWrite(op, cur.page, measure, layout);
          if (w.turn) { w.cleanup(); return null; }
        }
        return w;
      }
      case "graph": {
        /* one graph to a section: a second one opens the next section */
        if (graph) nextSection(animated);
        const g = buildGraph(op, cur.page, layout);
        graph = g;
        return g;
      }
      case "plot": {
        const g = items.get(op.on);
        if (!g?.mapper) return null;
        return buildPlot(op, page, g);
      }
      case "point": {
        const g = items.get(op.on);
        if (!g?.mapper) return null;
        return buildPoint(op, page, g.mapper);
      }
      case "arrow": {
        const g = op.on === "grid" ? null : items.get(op.on);
        return buildArrow(op, page, g?.mapper || gridMapper(layout.canvas.figure));
      }
      case "underline":
      case "circle": {
        const t = items.get(op.target);
        if (!t?.box) return null;
        return again(markKey(op), () => buildMark(op, page, markTarget(t, op.words)), page);
      }
      case "diagram": {
        /* in steps: an empty panel the parts are drawn into one by one
           (a painting with no parts to take apart is drawn whole instead) */
        const data = (op.steps && stepDiagram(op.name)) || loadedDiagram(op.name);
        if (!data) return null;
        /* a diagram fills the figure panel: one to a section, like a graph */
        if (graph) nextSection(animated);
        const d = buildDiagram(op, cur.page, layout, data);
        graph = d;
        return d;
      }
      case "label": {
        const it = items.get(op.on);
        /* a label on a generated picture waits for the picture (and the spots found on it) */
        if (it?.picture) { queuePictureLabel(it, op, page, layout); return null; }
        return partAndLabel(op, it, page);
      }
      case "part": {
        const it = items.get(op.on);
        if (it?.picture) { if (op.label) queuePictureLabel(it, { ...op, op: "label" }, page, layout); return null; }
        return partAndLabel(op, it, page);
      }
      case "sketch": {
        { const inside = intoDiagram(op, page); if (inside) return inside; }
        const g = op.on === "grid" ? null : items.get(op.on);
        return buildSketch(op, page, g?.mapper || gridMapper(layout.canvas.figure));
      }
      case "picture": {
        if (!picture) return null; // no image service on this page (tests, demos)
        if (graph) nextSection(animated);
        const it = buildPicture(op, cur.page, layout, gsap);
        graph = it;
        startPicture(it, op, animated);
        return it;
      }
      case "object": {
        const obj = objectNamed(op.name);
        if (!obj) return null;
        const g = op.on === "grid" ? null : items.get(op.on);
        return buildObject(op, page, g?.mapper || gridMapper(layout.canvas.figure), obj);
      }
      case "move":
        return buildMove(op, page, moveEnds(op));
      case "shape": {
        { const inside = intoDiagram(op, page); if (inside) return inside; }
        const g = op.on === "grid" ? null : items.get(op.on);
        return buildShape(op, page, g?.mapper || gridMapper(layout.canvas.figure));
      }
      case "highlight": {
        const t = items.get(op.target);
        if (!t?.box) return null;
        /* never a highlight over a highlight: words already (partly) highlighted
           are stressed instead */
        const want = markTarget(t, op.words).box;
        const over = [...(cur.marks || new Map()).entries()].find(([k, m]) => k.startsWith(`hl|${op.target}|`) && m.node.isConnected && m.box && want &&
          m.box.x < want.x + want.w && want.x < m.box.x + m.box.w && m.box.y < want.y + want.h && want.y < m.box.y + m.box.h);
        if (over) return buildEmphasis(over[1], page);
        return again(markKey(op), () => buildHighlight(op, page, markTarget(t, op.words)), page);
      }
      default:
        return null;
    }
  }

  /* A shape or sketch the model drew FOR a part of the step diagram in this
     section (its label names a part: "mitochondria"): drawn as that part, in
     its place inside the drawing, not loose on the grid beside it. */
  function intoDiagram(op, page) {
    const d = graph?.diagram;
    if (!d || !d.data.steps || !op.label) return null;
    const part = findPart(d.data, op.label);
    if (!part) return null;
    return partAndLabel({ op: "part", id: op.id, on: graph.node.dataset.id, part: part.name, text: op.label, tone: "blue", label: true }, items.get(graph.node.dataset.id), page);
  }

  /* Where writing goes when it is not the next line of the column: at a point
     of the figure grid (or a graph's own scale), or beside something already
     drawn ("right", "left", "below", "above" of it). It stays on the section
     and clear of the other writing and drawings. */
  function writeSpot(op) {
    const W = layout.canvas.w, margin = 36;
    let x, y, align = "start", lift = false, maxW;
    if (op.beside) {
      const it = items.get(op.beside);
      let b = it && (it.focus || it.box);
      /* beside one PART of a diagram or object */
      if (it?.diagram && op.part) {
        const part = findPart(it.diagram.data, op.part);
        if (part) { const [px, py] = it.diagram.toBoard(part.cx, part.cy); b = { x: px - 20, y: py - 20, w: 40, h: 40 }; }
      }
      if (!b) return null;
      const gapX = 26, gapY = 18;
      if (op.side === "left") { x = b.x - gapX; align = "end"; y = b.y; maxW = Math.min(520, x - margin); }
      else if (op.side === "below") { x = b.x; y = b.y + b.h + gapY; maxW = W - margin - x; }
      else if (op.side === "above") { x = b.x; y = b.y - gapY; lift = true; maxW = W - margin - x; }
      else { x = b.x + b.w + gapX; y = b.y; maxW = W - margin - x; }
    } else {
      const host = op.on && op.on !== "grid" ? items.get(op.on) : null;
      const m = host?.mapper || gridMapper(layout.canvas.figure);
      x = m.toX(op.at[0]); y = m.toY(op.at[1]);
      maxW = W - margin - x;
    }
    /* too little room on that side: bring it in until a short line fits */
    const least = 240;
    if (maxW < least) {
      if (align === "end") { align = "start"; x = margin; maxW = least; }
      else { x = Math.max(margin, W - margin - least); maxW = least; }
    }
    maxW = Math.min(maxW, 620);
    /* clear of the writing, labels and things drawn in this section */
    const others = [...items.values()].filter((it) => it.box && !it.diagram?.data?.steps && !it.mapper && !it.picture && !(it.diagram && it.box.w > 300));
    const adjust = (box) => {
      const hits = (dy) => others.some((o) => { const b = o.box; return box.x < b.x + b.w && b.x < box.x + box.w && box.y + dy < b.y + b.h && b.y < box.y + box.h + dy; });
      const H = layout.canvas.h;
      for (let k = 0; k <= 16; k++) {
        const dy = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 36;
        if (box.y + dy < 20 || box.y + box.h + dy > H - 20) continue;
        if (!hits(dy)) return { dx: 0, dy };
      }
      return { dx: 0, dy: 0 };
    };
    return { x, y, align, lift, maxW, adjust };
  }

  /* Where a "move" starts, ends, and (blocked) is turned away, in board units.
     Points are on the 0–10 grid of the figure panel (or a graph's own scale);
     "to" may name a part of the diagram or object it is "on"; "from" may be
     an edge: "left", "right", "top", "bottom" (outside the drawing). */
  function moveEnds(op) {
    const host = items.get(op.on);
    const d = host?.diagram || null;
    const m = host?.mapper || gridMapper(layout.canvas.figure);
    const P = (v) => [m.toX(v[0]), m.toY(v[1])];
    const F = layout.canvas.figure;
    const area = d ? d.box : F;
    let to;
    if (typeof op.to === "string") {
      const part = d && findPart(d.data, op.to);
      to = part ? d.toBoard(part.cx, part.cy) : [area.x + area.w / 2, area.y + area.h / 2];
    } else to = P(op.to);
    let from;
    if (typeof op.from === "string") {
      const pad = 70;
      from = {
        left: [area.x - pad, to[1]], right: [area.x + area.w + pad, to[1]],
        top: [to[0], area.y - pad], bottom: [to[0], area.y + area.h + pad],
      }[op.from] || [area.x - pad, to[1]];
    } else from = P(op.from);
    /* blocked: stopped where the path first meets the drawing (its outer edge) */
    let stop = null;
    if (op.blocked) {
      const inset = d ? 0.05 : 0;
      const b = { x: area.x + area.w * inset, y: area.y + area.h * inset, w: area.w * (1 - 2 * inset), h: area.h * (1 - 2 * inset) };
      const inside = (q) => q[0] >= b.x && q[0] <= b.x + b.w && q[1] >= b.y && q[1] <= b.y + b.h;
      for (let i = 1; i <= 100; i++) {
        const q = [from[0] + (to[0] - from[0]) * (i / 100), from[1] + (to[1] - from[1]) * (i / 100)];
        if (inside(q)) { stop = q; break; }
      }
      if (!stop || (stop[0] === to[0] && stop[1] === to[1])) stop = [from[0] + (to[0] - from[0]) * 0.7, from[1] + (to[1] - from[1]) * 0.7];
    }
    const unit = Math.abs(m.toX(1) - m.toX(0));
    return { from, to, stop, r: Math.max(6, Math.min(26, op.size * (host?.mapper ? 12 : unit))) };
  }

  /* A part of a diagram: in a step diagram it is DRAWN first (once), then
     named; in a whole drawing it is only named. */
  function partAndLabel(op, it, page) {
    const d = it?.diagram;
    const part = d && findPart(d.data, op.part);
    if (!part) return null;
    const steps = [];
    if (d.data.steps && part.svg && !d.drawn.has(part.name)) {
      d.drawn.add(part.name);
      steps.push(buildPart(op, d, part));
    }
    if (op.op === "label" || op.label !== false) {
      /* named before: that label is stressed, not written a second time */
      const labels = d.named || (d.named = new Map());
      const had = labels.get(part.name);
      if (had && had.node.isConnected) {
        if (!steps.length) return buildEmphasis(had, page);
      } else {
        const lbl = buildLabel({ ...op, text: op.text || op.part }, page, d, part, layout.canvas.w - 24);
        labels.set(part.name, lbl);
        steps.push(lbl);
      }
    }
    if (!steps.length) return null;
    if (steps.length === 1) return steps[0];
    const weight = steps.reduce((t, b) => t + b.weight, 0);
    const u = union(steps.map((b) => b.focus || b.box));
    return {
      node: steps[1].node, box: steps[1].box, focus: u, weight,
      draw(tl, at, dur) {
        let t = at;
        for (const b of steps) { const each = (dur * b.weight) / weight; b.draw(tl, t, each); t += each; }
      },
    };
  }

  /* The same mark asked for twice (a highlight on the same words, the same
     ring): the one already there is stressed instead of a second laid over it. */
  const markKey = (op) => `${op.op === "highlight" ? "hl" : op.op}|${op.target}|${String(op.words || "").toLowerCase().trim()}`;
  function again(key, make, page) {
    const marks = cur.marks || (cur.marks = new Map());
    const had = marks.get(key);
    if (had && had.node.isConnected) return buildEmphasis(had, page);
    const b = make();
    if (b) marks.set(key, b);
    return b;
  }

  /* ── the camera follows the hand ─────────────────────────────────────────
     While PrepBot draws, the view closes in on what this beat is drawing (a
     part of a cell, a label, a line of working) and pans with it; a beat that
     draws across the whole section, or a question, shows the whole section. */
  function union(boxes) {
    const ok = boxes.filter((b) => b && Number.isFinite(b.x) && Number.isFinite(b.w));
    if (!ok.length) return null;
    const x0 = Math.min(...ok.map((b) => b.x)), y0 = Math.min(...ok.map((b) => b.y));
    const x1 = Math.max(...ok.map((b) => b.x + b.w)), y1 = Math.max(...ok.map((b) => b.y + b.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  let zoomed = false;
  function frame(built, beat) {
    const s = cur;
    const whole = () => { if (zoomed) { zoomed = false; glide(sectionView(s), 0.9); } };
    if (beat?.ask || beat?.end) return whole();
    const u = union(built.map((b) => b.focus || b.box));
    if (!u) return;
    const aspect = C.w / C.h;
    /* room round it, and a little more on the left where the rail sits */
    const pad = 60;
    let w = Math.max((u.w + pad * 2 + 70) * 1.15, (u.h + pad * 2) * 1.15 * aspect, C.w * 0.62);
    if (w >= C.w * 0.82) return whole();
    const h = w / aspect;
    let x = s.x + u.x - 70 + (u.w + 70) / 2 - w / 2, y = s.y + u.y + u.h / 2 - h / 2;
    x = Math.min(Math.max(x, s.x), s.x + C.w - w);
    y = Math.min(Math.max(y, s.y), s.y + C.h - h);
    zoomed = true;
    glide({ x, y, w, h }, 0.9);
  }

  /* ── generated pictures ──────────────────────────────────────────────── */
  function startPicture(it, op, animated) {
    const key = op.prompt + "|" + (op.labels || []).join(",");
    if (!pictureCache.has(key)) {
      pictureCache.set(key, picture.make(op.prompt, op.labels || []).catch((e) => { pictureCache.delete(key); throw e; }));
    }
    const lay = layout, page = cur.page;
    pictureCache.get(key).then((got) => {
      if (!it.node.isConnected) return; // the board was cleared or rebuilt meanwhile
      it.show(got.src, { w: got.w, h: got.h }, animated && !!gsap);
      it.picture.ready = true;
      it.picture.spots = got.spots || {};
      /* the labels named with the picture, then any asked for while it was coming */
      const asked = (op.labels || []).map((part) => ({ op: "label", id: `${op.id}-${part}`.replace(/[^a-z0-9_-]/gi, "").slice(0, 24) || "lbl", on: op.id, part, text: part, tone: "blue" }));
      [...asked, ...it.picture.queue].forEach((lo, i) => setTimeout(() => drawPictureLabel(it, lo, page, lay, animated), animated ? 1500 + i * 450 : 0));
      it.picture.queue = [];
    }).catch(() => {
      if (!it.node.isConnected) return;
      const t = it.node.querySelector(".pb-picture__wait");
      if (t) { gsap?.killTweensOf(t); t.textContent = "The picture could not be drawn just now."; t.style.opacity = 1; }
    });
  }
  function queuePictureLabel(it, op, page, lay) {
    if (it.picture.ready) drawPictureLabel(it, op, page, lay, !!gsap);
    else it.picture.queue.push(op);
  }
  function drawPictureLabel(it, op, page, lay, animated) {
    const spot = it.picture.spots?.[op.part] || Object.entries(it.picture.spots || {}).find(([k]) => k.toLowerCase() === String(op.part).toLowerCase())?.[1];
    if (!spot) return;
    const d = { toBoard: it.picture.toBoard, box: it.picture.box, labels: it.picture.labels || (it.picture.labels = []) };
    const lbl = buildLabel({ ...op, text: op.text || op.part }, page, d, { cx: spot[0], cy: spot[1] }, lay.canvas.w - 24);
    if (animated && gsap) {
      const t = gsap.timeline({ onComplete: () => pen.rest() });
      lbl.draw(t, 0, 0.9);
    }
  }

  /** Apply ops to the board; returns the built things in order. */
  function apply(list, animated = true) {
    const built = [];
    for (const raw of list) {
      const op = cleanOp(raw);
      if (!op) continue;
      let b = null;
      try { b = build(op, animated); } catch (e) { console.warn("[board] op skipped", op, e); b = null; }
      if (op.op === "clear" || op.op === "look" || !b) continue;
      cur.ops.push(op);
      items.set(op.id, b);
      built.push(b);
    }
    return built;
  }

  addSection();
  setView();

  return {
    layout,
    get orient() { return layout.orient; },
    get sections() { return sections.length; },

    /**
     * Draw a beat's ops over `seconds`. Resolves when the drawing is finished
     * (or when finishNow() jumps it there). With no gsap, or seconds = 0, the
     * ops appear at once.
     */
    async play(beat, seconds = 2) {
      const wanted = diagramsIn(beat?.do);
      if (wanted.length) await ensureDiagrams(wanted);
      const live = !!gsap && seconds > 0;
      setPen(live ? pen : null); // instant drawing: no pencil
      /* a learner who looked away a while ago is brought back to where PrepBot is drawing */
      if (live && !following && Date.now() - lookedAt > FOLLOW_AFTER_MS && (beat?.do || []).length) focusLive(0.7);
      const built = apply(beat?.do || [], live);
      if (live && following && autoCam) frame(built, beat);
      if (!built.length) { pen.rest(); return Promise.resolve(); }
      if (!live) { built.forEach((b) => b.instant?.()); return Promise.resolve(); }
      return new Promise((resolve) => {
        const timeline = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
        /* each thing is drawn at a brisk hand's own pace (weight = seconds);
           only when that would outrun the sentence is it squeezed, and never by
           more than 40% — a beat with a lot to draw simply finishes after its words */
        const weight = built.reduce((s, b) => s + (b.weight || 1), 0);
        const span = Math.min(weight, Math.max(seconds * 0.85, weight * 0.6));
        let at = 0;
        for (const b of built) {
          const d = (span * (b.weight || 1)) / weight;
          b.draw(timeline, at, d);
          at += d;
        }
        tl = timeline;
        timeline.eventCallback("onComplete", () => { if (tl === timeline) tl = null; pen.rest(); resolve(); });
      });
    },

    /** Draw back a whole board at once: every section's ops, in order. */
    async restore(pages = []) {
      await ensureDiagrams(pages.flatMap((p) => diagramsIn(p)));
      pages.forEach((ops, i) => {
        if (i > 0 && ops.length) nextSection(false);
        apply(ops, false).forEach((b) => b.instant?.());
      });
      focusLive(0);
    },

    /** PrepBot is thinking: the pencil hovers where the next line will go. */
    think(on) {
      if (!gsap) return;
      if (thinkTw) { thinkTw.kill(); thinkTw = null; }
      if (!on) { pen.rest(0.1); return; }
      const M = layout.canvas.main;
      const y = Math.min(M.y + M.h - 40, M.y + (M.h - layout.room()) + 50);
      pen.to(M.x + 30, y, true);
      pen.show();
      const o = { t: 0 };
      thinkTw = gsap.to(o, {
        t: 1, duration: 1.4, repeat: -1, ease: "sine.inOut",
        onUpdate: () => pen.to(M.x + 30 + Math.sin(o.t * Math.PI * 2) * 18, y - 10 + Math.cos(o.t * Math.PI * 4) * 8, true),
      });
    },

    /** Jump whatever is being drawn to its end — the board stays as said. */
    finishNow() {
      if (tl) { const t = tl; tl = null; t.progress(1); }
      pen.rest(0.2);
    },

    /** See every section at once. */
    overview() { viewAll(); },
    /** Back to the section PrepBot is working in, and keep following it. */
    follow() { focusLive(); },
    get following() { return following; },

    /** What is in the live section, for the model's next turn (with where it is). */
    summary() {
      return [{ kind: "section", n: cur.n, of: sections.length }, ...boardSummary(cur.ops)];
    },

    /** Look at the section before / after the one in view (the learner moving round). */
    step(dir) {
      following = false;
      lookedAt = Date.now();
      const near = sections.map((s, i) => [i, Math.hypot(s.x - cam.x, s.y - cam.y)]).sort((a, b) => a[1] - b[1])[0][0];
      const s = sections[Math.min(sections.length - 1, Math.max(0, near + dir))];
      glide(sectionView(s), 0.7);
      if (s === cur) following = true;
    },

    /** Every section so far, the live one last (each a list of ops). */
    pages() {
      return sections.map((s) => s.ops);
    },

    /** Start again with an empty canvas. */
    reset() {
      this.finishNow();
      sections.splice(0).forEach((s) => s.g.remove());
      addSection();
      pen.rest(0);
      focusLive(0);
    },
  };
}
