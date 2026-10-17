/* ============================================================================
   TRACING A CODED FILM INTO A DOCUMENT
   ----------------------------------------------------------------------------
   The films were written as JavaScript, and the editor edits documents
   (./filmdoc.js). Laying twenty lessons out again by hand would be the whole
   point of the editor thrown away before it started — so this reads a coded
   film and writes the document down from what it actually does.

   IT CAN DO THAT BECAUSE THE KIT IS HONEST. Every mark a film puts on the
   stage is a `[data-t]` tile with its place in `style.left` and `style.top`
   and its state in `style.opacity` — the drawing kit never hides anything in
   a closure. So the film is run, step by step, into a stage that is not on
   the screen, and after each step the stage is READ:

     a tile that was not there before   → a new element, where it stands
     one that was invisible and is not  → it comes on  (pop)
     one that has moved                 → it moves     (move)
     one whose words changed            → it turns over (flip)
     one that has gone faint            → it dims
     one that has gone                  → it goes off  (hide)

   WHAT IT CANNOT KNOW is intent. A trace says a thing came on; it cannot say
   it was meant to FLY on from the left, because both finish in the same
   place and the kit's instant path — the only one that can be read without
   waiting for animations — draws the end state of either. So a trace is a
   faithful starting point and not a finished film: the words, the layout and
   the order are all correct, and the entrances are plain ones to be chosen
   again by hand. That is the right way round. A wrong guess about intent is
   worse than no guess, because you have to notice it before you can fix it.
   ========================================================================== */

import { blankEl, newId } from "./filmdoc.js";

/** The ink a tile is set in, read back off the class the kit gave it. */
const inkOf = (node) => {
  const m = /vm-t__in--c(\d)/.exec(node.className || "");
  return m ? Number(m[1]) : 0;
};
const sizeOf = (box) => (box.classList.contains("vm-t--l") ? "l" : box.classList.contains("vm-t--s") ? "s" : "m");
/** `calc(var(--u) * 30)` → 30, which is the width the kit was asked for. */
const widthOf = (node) => {
  const m = /\*\s*([\d.]+)\s*\)/.exec(node.style.width || "");
  return m ? Number(m[1]) : 30;
};
const pct = (v) => Math.round((parseFloat(v) || 0) * 10) / 10;

/** What every mark on the stage looks like at this moment. */
function readStage(stage) {
  const seen = new Map();
  stage.querySelectorAll("[data-t]").forEach((box) => {
    const inner = box.firstChild;
    if (!inner) return;
    const art = inner.classList.contains("vm-t__art");
    seen.set(box.dataset.t, {
      x: pct(box.style.left),
      y: pct(box.style.top),
      on: Number(inner.style.opacity || "1"),
      text: art ? "" : inner.textContent || "",
      html: art ? inner.innerHTML : "",
      art,
      c: art ? 0 : inkOf(inner),
      size: sizeOf(box),
      w: art ? widthOf(inner) : 30,
    });
  });
  return seen;
}

const moved = (a, b) => Math.abs(a.x - b.x) > 0.2 || Math.abs(a.y - b.y) > 0.2;

/**
 * Trace a coded film.
 *
 *   coded   { build, steps } — what tv-lessons.js hands back for a film id
 *   title   what to call the document
 * → a document, ready for the editor
 *
 * The film is run into a stage of the right SHAPE but off the screen: the kit
 * measures in `--u`, a hundredth of the stage's width, so a stage of no width
 * would put everything at nought. It is 1000px across and 16:9 down, which is
 * the television's own shape, and taken away again at the end.
 */
export function traceFilm(coded, title = "") {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-20000px;top:0;width:1000px;height:562.5px;pointer-events:none;";
  document.body.appendChild(host);

  const els = [];
  const byTile = new Map();     // the tile's own id → our element
  const steps = [];
  try {
    const run = (upTo) => {
      host.innerHTML = "";
      coded.build(host);
      host.querySelector(".vm-tv")?.style.setProperty("--u", "10px");
      for (let k = 0; k <= upTo; k++) coded.steps[k].show?.(host, { gsap: null, instant: true });
      return readStage(host);
    };

    /* what the stage looks like before a word is said */
    host.innerHTML = "";
    coded.build(host);
    host.querySelector(".vm-tv")?.style.setProperty("--u", "10px");
    let was = readStage(host);
    /* everything the build itself puts up becomes an element, hidden until a
       step asks for it — which is exactly what the kit does */
    was.forEach((m, tileId) => { byTile.set(tileId, make(m, tileId, els)); });

    coded.steps.forEach((s, i) => {
      const now = run(i);
      const acts = [];
      now.forEach((m, tileId) => {
        const before = was.get(tileId);
        if (!before) {
          /* a mark the film draws part-way through: it joins the stage here */
          const el = make(m, tileId, els);
          byTile.set(tileId, el);
          if (m.on > 0.02) acts.push({ el: el.id, do: "pop", delay: 0 });
          return;
        }
        const el = byTile.get(tileId);
        if (!el) return;
        if (before.on <= 0.02 && m.on > 0.02) acts.push({ el: el.id, do: "pop", delay: 0 });
        else if (before.on > 0.02 && m.on <= 0.02) acts.push({ el: el.id, do: "hide", delay: 0 });
        else if (m.on > 0.02 && Math.abs(before.on - m.on) > 0.08) acts.push({ el: el.id, do: "dim", amount: m.on, delay: 0 });
        if (moved(before, m)) acts.push({ el: el.id, do: "move", tx: m.x, ty: m.y, delay: 0 });
        if (!m.art && before.text !== m.text && m.text) acts.push({ el: el.id, do: "flip", text: m.text, c: m.c, delay: 0 });
      });
      was.forEach((before, tileId) => {
        if (now.has(tileId) || before.on <= 0.02) return;
        const el = byTile.get(tileId);
        if (el) acts.push({ el: el.id, do: "hide", delay: 0 });
      });
      steps.push({ say: s.say || "", hold: Number(s.hold) || 0, acts });
      was = now;
    });
  } finally {
    host.remove();
  }

  return { v: 1, title, els, steps: steps.length ? steps : [{ say: "", hold: 0, acts: [] }] };
}

/** One mark, as an element of a document. */
function make(m, tileId, els) {
  const el = blankEl(m.art ? "svg" : "text");
  el.id = newId();
  /* the tile's own name is what the film called it, which is almost always
     the most useful label there is — "bar", "whole", "ans" */
  el.name = tileId;
  el.x = m.x;
  el.y = m.y;
  if (m.art) { el.svg = m.html; el.w = m.w; } else { el.text = m.text; el.c = m.c; el.size = m.size; }
  els.push(el);
  return el;
}
