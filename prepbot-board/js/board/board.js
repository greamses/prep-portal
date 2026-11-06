/* ============================================================================
   PrepBot Board — the board: an endless canvas of SECTIONS
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
import { el, buildWrite, buildGraph, buildPlot, buildPoint, buildArrow, buildMark, buildShape, buildHighlight, gridMapper, createPen, setPen } from "./render.js";

const GAP = 140;               // canvas between two sections
const FOLLOW_AFTER_MS = 6000;  // a learner who looked away is brought back after this, when PrepBot draws

export function createBoard(svg, { gsap, orient = "landscape", canvas = null, onTap = null } = {}) {
  const layout = createLayout(canvas || orient);
  const C = layout.canvas;
  const across = layout.orient !== "portrait"; // sections run to the right, or downwards
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("pb-board", `pb-board--${layout.orient}`);
  svg.innerHTML = "";
  const defs = el("defs", {}, svg);
  /* user-space region: a filter sized to a perfectly straight line's bounding box
     (height 0) would clip the whole line away */
  const rough = el("filter", { id: "pb-rough", filterUnits: "userSpaceOnUse", x: -20, y: -20, width: C.w + 40, height: C.h + 40 }, defs);
  el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: 2, seed: 7, result: "n" }, rough);
  el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: 2.2 }, rough);
  const world = el("g", { class: "pb-world" }, svg);
  const measure = el("g", { class: "pb-measure", opacity: 0 }, svg);

  /* ── sections ──────────────────────────────────────────────────────────── */
  const sections = [];       // { g, page, ops, x, y }
  let cur = null;
  const items = new Map();   // id → built thing, in the CURRENT section
  let graph = null;          // the graph in the current section, if any
  let tl = null;
  let thinkTw = null;

  const penLayer = el("g", { class: "pb-penlayer" });
  const pen = createPen(penLayer, gsap);

  function addSection() {
    const i = sections.length;
    const x = across ? i * (C.w + GAP) : 0;
    const y = across ? 0 : i * (C.h + GAP);
    const g = el("g", { class: "pb-section", transform: `translate(${x} ${y})` }, world);
    el("rect", { class: "pb-paper", x: 0, y: 0, width: C.w, height: C.h }, g);
    if (i > 0 || sections.length) {
      const tag = el("text", { class: "pb-section__no", x: C.w - 34, y: 44, "text-anchor": "end" }, g);
      tag.textContent = String(i + 1);
    }
    const page = el("g", { class: "pb-page" }, g);
    g.appendChild(penLayer); // the pencil works in the live section
    const s = { g, page, ops: [], x, y };
    sections.push(s);
    cur = s;
    items.clear();
    graph = null;
    layout.reset();
    /* the first section's number appears once there is a second */
    if (sections.length === 2) {
      const t0 = el("text", { class: "pb-section__no", x: C.w - 34, y: 44, "text-anchor": "end" }, sections[0].g);
      t0.textContent = "1";
    }
    return s;
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
    if (cur) glide(sectionView(cur), dur);
  }
  function viewAll(dur = 0.8) {
    following = false;
    lookedAt = Date.now();
    const last = sections[sections.length - 1];
    const W = last.x + C.w, H = last.y + C.h;
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
        if (cur.ops.length) nextSection(animated);
        return null;
      case "write": {
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
        return buildMark(op, page, t);
      }
      case "shape": {
        const g = op.on === "grid" ? null : items.get(op.on);
        return buildShape(op, page, g?.mapper || gridMapper(layout.canvas.figure));
      }
      case "highlight": {
        const t = items.get(op.target);
        if (!t?.box) return null;
        return buildHighlight(op, page, t);
      }
      default:
        return null;
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
      if (op.op === "clear" || !b) continue;
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
    play(beat, seconds = 2) {
      const live = !!gsap && seconds > 0;
      setPen(live ? pen : null); // instant drawing: no pencil
      /* a learner who looked away a while ago is brought back to where PrepBot is drawing */
      if (live && !following && Date.now() - lookedAt > FOLLOW_AFTER_MS && (beat?.do || []).length) focusLive(0.7);
      const built = apply(beat?.do || [], live);
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
    restore(pages = []) {
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

    /** What is in the live section, for the model's next turn. */
    summary() {
      return boardSummary(cur.ops);
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
