/* ============================================================================
   PrepBot Board — the board
   ----------------------------------------------------------------------------
   Holds the pages, and plays a beat: every op of the beat is built (placed,
   measured) first, then drawn on along ONE GSAP timeline that lasts as long as
   the sentence being spoken. A board is just the ops applied to it in order,
   so a page can be drawn again instantly (resize, history, tests).

     const board = createBoard(svg, { gsap, orient })
     await board.play(beat, seconds)   draws the beat over `seconds`
     board.finishNow()                 jump the current beat to its end (interrupt)
     board.summary()                   what is on this page, for the next turn
   ========================================================================== */

import { createLayout } from "./layout.js";
import { cleanOp, boardSummary } from "../protocol/ops.js";
import { el, buildWrite, buildGraph, buildPlot, buildPoint, buildArrow, buildMark, gridMapper, createPen, setPen } from "./render.js";

export function createBoard(svg, { gsap, orient = "landscape" } = {}) {
  const layout = createLayout(orient);
  const C = layout.canvas;
  svg.setAttribute("viewBox", `0 0 ${C.w} ${C.h}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("pb-board", `pb-board--${layout.orient}`);
  svg.innerHTML = "";
  const defs = el("defs", {}, svg);
  /* user-space region: a filter sized to a perfectly straight line's bounding box
     (height 0) would clip the whole line away */
  const rough = el("filter", { id: "pb-rough", filterUnits: "userSpaceOnUse", x: -20, y: -20, width: C.w + 40, height: C.h + 40 }, defs);
  el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: 2, seed: 7, result: "n" }, rough);
  el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: 2.2 }, rough);
  el("rect", { class: "pb-paper", x: 0, y: 0, width: C.w, height: C.h }, svg);
  const measure = el("g", { class: "pb-measure", opacity: 0 }, svg);

  let page = el("g", { class: "pb-page" }, svg);
  /* the pencil rides on its own top layer; new pages go in underneath it */
  const penLayer = el("g", { class: "pb-penlayer" }, svg);
  const pen = createPen(penLayer, gsap);
  const newPage = () => { const g = el("g", { class: "pb-page" }); svg.insertBefore(g, penLayer); return g; };
  const history = [];            // earlier pages: their op lists
  let ops = [];                  // ops applied to this page
  const items = new Map();       // id → built thing (box, mapper…)
  let graph = null;              // the graph on this page, if any
  let tl = null;

  function turnPage(animated = true) {
    if (ops.length) history.push(ops);
    const old = page;
    page = newPage();
    if (animated && gsap && old.childNodes.length) {
      gsap.to(old, { opacity: 0, y: -40, duration: 0.45, ease: "power2.in", onComplete: () => old.remove() });
    } else old.remove();
    ops = [];
    items.clear();
    graph = null;
    layout.reset();
  }

  /* Build one op on the page; returns the built thing or null (skipped). */
  function build(op) {
    switch (op.op) {
      case "clear":
        turnPage(true);
        return null;
      case "write": {
        let w = buildWrite(op, page, measure, layout);
        if (w.turn) {
          w.cleanup();
          turnPage(true);
          w = buildWrite(op, page, measure, layout);
          if (w.turn) { w.cleanup(); return null; }
        }
        return w;
      }
      case "graph": {
        /* one graph to a page: a second one turns the page */
        if (graph) turnPage(true);
        const g = buildGraph(op, page, layout);
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
        const mapper = g?.mapper || gridMapper(layout.canvas.figure);
        return buildArrow(op, page, mapper);
      }
      case "underline":
      case "circle": {
        const t = items.get(op.target);
        if (!t?.box) return null;
        return buildMark(op, page, t);
      }
      default:
        return null;
    }
  }

  /** Apply ops to the board; returns the built things in order. */
  function apply(list) {
    const built = [];
    for (const raw of list) {
      const op = cleanOp(raw);
      if (!op) continue;
      let b = null;
      try { b = build(op); } catch (e) { console.warn("[board] op skipped", op, e); b = null; }
      if (op.op === "clear") { continue; }
      if (!b) continue;
      ops.push(op);
      items.set(op.id, b);
      built.push(b);
    }
    return built;
  }

  return {
    layout,
    get orient() { return layout.orient; },

    /**
     * Draw a beat's ops over `seconds`. Resolves when the drawing is finished
     * (or when finishNow() jumps it there). With no gsap, or seconds = 0, the
     * ops appear at once.
     */
    play(beat, seconds = 2) {
      setPen(gsap && seconds > 0 ? pen : null); // instant drawing: no pencil
      const built = apply(beat?.do || []);
      if (!built.length) { pen.rest(); return Promise.resolve(); }
      if (!gsap || seconds <= 0) return Promise.resolve();
      return new Promise((resolve) => {
        const timeline = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
        const weight = built.reduce((s, b) => s + (b.weight || 1), 0);
        /* the strokes fill the sentence, but never draw faster than a hand can */
        const span = Math.max(seconds * 0.9, weight * 0.5);
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

    /** Jump whatever is being drawn to its end — the board stays as said. */
    finishNow() {
      if (tl) { const t = tl; tl = null; t.progress(1); }
      pen.rest(0.2);
    },

    /** What is on this page, for the model's next turn. */
    summary() {
      return boardSummary(ops);
    },

    /** Every page so far, this one last (each a list of ops). */
    pages() {
      return [...history, ops];
    },

    /** Start again with an empty board. */
    reset() {
      this.finishNow();
      history.length = 0;
      ops = [];
      items.clear();
      graph = null;
      page.remove();
      page = newPage();
      pen.rest(0);
      layout.reset();
    },
  };
}
