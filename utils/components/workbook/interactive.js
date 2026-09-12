/* ============================================================================
   PRINTABLE WORKBOOK — the same paper, done on screen
   ----------------------------------------------------------------------------
   "Make interactive" turns the preview into the thing itself. Nothing is
   re-laid out: the answer boxes on the page become places to type, the tick
   boxes can be ticked, a figure that asks for lines to be ruled can have them
   ruled — dragged from corner to corner, snapping to the corners — and a
   protractor can be picked up, laid on any angle and turned. "Check my
   answers" marks every place against the exercise's key (want.js), colours
   each one, and gives the score; "Show the answers" writes the right one
   under each that was wrong.

   The page is the same page that prints, so a question looks exactly as it
   does on paper and a child who has done it on screen recognises it printed.

   What is typed is kept in this browser against the workbook's fingerprint
   (the same one the print pass uses), so closing the tab does not lose a
   half-finished page — and a different workbook starts blank.
   ========================================================================== */

import { judge, placesOf, sayWant } from "./want.js";
import { instruments, TOOL_ICONS } from "./instruments.js";
import { needCss, openPanel } from "./panels.js";
import { BOARDS } from "/utils/components/boards/index.js";
import { mountBoard } from "/utils/components/boards/sheet.js";

const SLOTS = ".wb-answer, .wb-line, .wb-cell, .wb-tick";
const MM = 96 / 25.4;               // CSS px in a millimetre
const SNAP_MM = 4.5;                // how close to a corner counts as on it

const svgPoint = (svg, clientX, clientY) => {
  const m = svg.getScreenCTM();
  if (!m) return [0, 0];
  const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
};
const parsePts = (s) => (s ? s.trim().split(/\s+/).map((q) => q.split(",").map(Number)) : []);
const parseSegs = (s) => (s ? s.trim().split(";").filter(Boolean).map((q) => q.split(/[ ,]+/).map(Number)) : []);

const COLOUR = "#6fb7e8";            // the paper's own shading blue
const SVGNS = "http://www.w3.org/2000/svg";

/**
 *   mountInteractive({ sheet, viewport, scaler, toolbar, refit, protractor, places })
 *     protractor   the workbook's protractor SVG (mm-sized), or none — it
 *                  joins the ruler and set square in the toolbox
 *     places       this workbook's own answer boxes, as a selector, added to
 *                  the shared ones (".rw-answer, .rw-fill" …)
 *     onCheck      called with { right, total } after every "Check my answers"
 *                  (the assignment player sends it to the teacher)
 *     locked       interactive for good: no "Back to paper" (the player)
 *   → { afterRender(key) }   call after every rebuild of the paper
 */
export function mountInteractive({ sheet, viewport, scaler, toolbar, refit, protractor, places = "", onCheck = null, locked = false }) {
  let live = false;
  let key = null;
  let store = {};                     // itemIndex -> { v: [...], lines: [...] }
  let checked = false;
  let showing = false;

  /* ── the controls ──────────────────────────────────────────────────────*/

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pp-btn wb-tint-1 wb-live-toggle";
  toggle.textContent = "Make interactive";
  toolbar.querySelector(".wb-toolbar__spacer")?.after(toggle);
  if (locked) toggle.hidden = true;

  const bar = document.createElement("div");
  bar.className = "wb-livebar";
  bar.hidden = true;
  bar.innerHTML = `
    <span class="wb-livebar__say">Type in the boxes, tick, draw on the shapes.</span>
    <button type="button" class="pp-btn wb-tint-4" data-act="clear">Clear</button>
    <button type="button" class="pp-btn wb-tint-2" data-act="show" hidden>Show the answers</button>
    <span class="wb-livebar__score" role="status"></span>
    <button type="button" class="pp-btn" data-act="check">Check my answers</button>`;
  toolbar.after(bar);
  const score = bar.querySelector(".wb-livebar__score");
  const showBtn = bar.querySelector('[data-act="show"]');

  toggle.addEventListener("click", () => (live ? leave() : enter()));
  bar.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "check") check();
    if (act === "show") { showing = !showing; paintWants(); showBtn.textContent = showing ? "Hide the answers" : "Show the answers"; }
    if (act === "clear") clearAll();
  });

  /* ── the questions on the paper ────────────────────────────────────────*/

  const items = () => [...sheet.querySelectorAll(".wb-item")].filter((n) => n.__wb);
  const ALL = [SLOTS, places].filter(Boolean).join(", ").split(/\s*,\s*/);
  const SELECT = ALL.map((q) => `.wb-item__body ${q}`).join(", ");
  /* Every answer place in the question, in page order — but not the little
     boxes INSIDE a tick row, which belong to the row. */
  const slotsOf = (node) => [...node.querySelectorAll(SELECT)]
    .filter((el) => el.classList.contains("wb-tick") || !el.parentElement.closest(".wb-tick"));
  const keyOf = (node) => (node.__wb.ex.key ? node.__wb.ex.key(node.__wb.item, node.__wb.opts) : null);
  const drawSvg = (node, e) => node.querySelector(e.on || (e.free ? "svg[data-par]" : "svg[data-pts]"));
  const colourSvgs = (node) => [...node.querySelectorAll(".wb-item__body svg")].filter((v) => v.querySelector("[data-part]"));
  const rec = (i) => {
    const r = (store[i] ||= {});
    r.v ||= []; r.lines ||= []; r.colours ||= {}; r.pens ||= {}; r.pairs ||= [];
    return r;
  };
  const MARKED = (e) => !["free", "pen", "stick"].includes(e.kind);

  let saving = 0;
  const save = () => {
    clearTimeout(saving);
    saving = setTimeout(() => { try { localStorage.setItem(`wb-live:${key}`, JSON.stringify(store)); } catch { /* private window */ } }, 250);
  };
  const load = () => {
    try { return JSON.parse(localStorage.getItem(`wb-live:${key}`) || "{}") || {}; } catch { return {}; }
  };

  function valueOf(slot) {
    if (slot.classList.contains("wb-tick")) {
      return [...slot.querySelectorAll(".wb-tick__one")].findIndex((o) => o.classList.contains("is-on"));
    }
    /* A pad is a textarea, not an input — a number written out in words needs
       a paragraph to write in. Both are `.wb-in`, and both are read here: a
       marker that only knew about inputs would mark every written-out number
       wrong however carefully it was written. */
    return slot.querySelector("input, textarea")?.value ?? "";
  }

  function enliven(node, idx) {
    const r = rec(idx);
    slotsOf(node).forEach((slot, k) => {
      slot.classList.add("is-live");
      if (slot.classList.contains("wb-tick")) {
        const opts = [...slot.querySelectorAll(".wb-tick__one")];
        const set = (j) => {
          opts.forEach((o, m) => { o.classList.toggle("is-on", m === j); o.setAttribute("aria-checked", m === j ? "true" : "false"); });
          r.v[k] = j;
          dirty(node);
          save();
        };
        opts.forEach((o, j) => {
          o.setAttribute("role", "radio");
          o.tabIndex = 0;
          o.onclick = () => set(j);
          o.onkeydown = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); set(j); } };
        });
        if (Number.isInteger(r.v[k]) && r.v[k] >= 0) {
          opts.forEach((o, m) => o.classList.toggle("is-on", m === r.v[k]));
        }
        return;
      }
      /* A place ruled for a paragraph — a number written out in words — is
         written on rather than filled in, so it gets a pad and not a line.
         Same class, so it is read, saved and marked like any other answer. */
      const roomy = slot.classList.contains("wb-line--write");
      const input = document.createElement(roomy ? "textarea" : "input");
      input.className = "wb-in";
      if (roomy) input.rows = 2; else input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.setAttribute("aria-label", "answer");
      input.value = r.v[k] ?? "";
      input.addEventListener("input", () => { r.v[k] = input.value; dirty(node); save(); });
      /* Enter is a new line on a pad everywhere else on this site; here the
         answer is one number, so it ends the answer instead of growing it. */
      if (roomy) input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); input.blur(); } });
      slot.appendChild(input);
    });

    (keyOf(node) || []).forEach((e) => {
      if (e.kind === "draw") { const svg = drawSvg(node, e); if (svg) makeDrawable(node, idx, svg, e); }
      if (e.kind === "colour") makeColourable(node, idx, e);
      if (e.kind === "match") makeMatchable(node, idx, e);
      if (e.kind === "pen") makePen(node, idx, e);
      if (e.kind === "stick") makeStickable(node, idx);
    });
  }

  function deaden(node) {
    node.querySelectorAll("[data-part][data-fill0]").forEach((p) => p.setAttribute("fill", p.dataset.fill0));
    node.querySelectorAll("[data-colourable]").forEach((v) => v.removeAttribute("data-colourable"));
    node.querySelectorAll("[data-pen]").forEach((v) => v.removeAttribute("data-pen"));
    node.querySelectorAll(".wb-match li").forEach((li) => { li.onclick = null; li.classList.remove("is-picked"); });
    node.querySelectorAll(".wb-in, .wb-want, .wb-drawbar, .wb-draw, .wb-cross, .wb-pen, .wb-matchlines, .wb-stuck").forEach((n) => n.remove());
    node.querySelectorAll("svg[data-stickable]").forEach((s) => s.removeAttribute("data-stickable"));
    node.querySelectorAll("svg[data-paste]").forEach((s) => s.classList.remove("has-stuck", "is-fitted"));
    node.querySelectorAll("[data-corner]").forEach((p) => {
      p.classList.remove("is-torn"); p.removeAttribute("tabindex"); p.removeAttribute("role"); p.removeAttribute("transform");
    });
    node.querySelectorAll(".is-live, .is-right, .is-wrong, .is-on, .is-want").forEach((n) =>
      n.classList.remove("is-live", "is-right", "is-wrong", "is-on", "is-want"));
    node.querySelectorAll(".wb-tick__one").forEach((o) => { o.onclick = null; o.onkeydown = null; o.removeAttribute("role"); o.removeAttribute("tabindex"); });
    node.querySelectorAll("svg[data-drawable]").forEach((s) => s.removeAttribute("data-drawable"));
    node.classList.remove("is-marked-right", "is-marked-wrong");
  }

  /* A changed answer is no longer the one that was marked. */
  function dirty(node) {
    if (!checked) return;
    node.querySelectorAll(".is-right, .is-wrong").forEach((n) => n.classList.remove("is-right", "is-wrong"));
    node.querySelectorAll(".wb-want").forEach((n) => n.remove());
    node.querySelectorAll(".wb-match").forEach((m) => { m.__wbJudge = null; m.__wbPaint?.(); });
  }

  /* ── ruling lines on a figure ──────────────────────────────────────────*/

  function makeDrawable(node, idx, svg, draw) {
    const pts = parsePts(svg.dataset.pts);
    const NS = "http://www.w3.org/2000/svg";
    svg.dataset.drawable = "1";
    const layer = () => {
      let g = svg.querySelector(":scope > .wb-draw");
      if (!g) {
        g = document.createElementNS(NS, "g");
        g.setAttribute("class", "wb-draw");
        svg.appendChild(g);
      }
      return g;
    };
    const at = (line) => (draw.free ? line : [pts[line[0]], pts[line[1]]]);
    const paint = () => {
      const g = layer();
      g.innerHTML = "";
      rec(idx).lines.forEach((ln) => {
        const [a, b] = at(ln);
        if (!a || !b) return;
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", a[0]); l.setAttribute("y1", a[1]);
        l.setAttribute("x2", b[0]); l.setAttribute("y2", b[1]);
        /* a clock face: a line to the inner ring is the hour hand, to the
           outer ring the minute hand */
        const hand = draw.hands ? (Math.max(ln[0], ln[1]) > 12 ? " wb-draw__line--minute" : " wb-draw__line--hour") : "";
        l.setAttribute("class", `wb-draw__line${hand}`);
        g.appendChild(l);
      });
      if (!draw.free) pts.forEach((p) => {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 1.6);
        c.setAttribute("class", "wb-draw__spot");
        g.appendChild(c);
      });
    };
    paint();

    /* Bound once per figure: leaving and re-entering interactive mode keeps the
       same SVG, and a second set of listeners would rule every line twice. */
    if (!svg.__wbBound) {
      svg.__wbBound = true;
      const nearest = (p) => {
        let best = -1;
        let d = SNAP_MM;
        pts.forEach((q, i) => {
          const e = Math.hypot(q[0] - p[0], q[1] - p[1]);
          if (e < d) { d = e; best = i; }
        });
        return best;
      };
      let from = null;
      let ghost = null;
      svg.addEventListener("pointerdown", (e) => {
        if (!svg.dataset.drawable) return;
        const p = svgPoint(svg, e.clientX, e.clientY);
        const near = nearest(p);
        const i = draw.free ? (near >= 0 ? pts[near].slice() : p) : near;
        if (!draw.free && i < 0) return;
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        from = i;
        ghost = document.createElementNS(NS, "line");
        ghost.setAttribute("class", "wb-draw__ghost");
        const s0 = draw.free ? i : pts[i];
        ghost.setAttribute("x1", s0[0]); ghost.setAttribute("y1", s0[1]);
        ghost.setAttribute("x2", s0[0]); ghost.setAttribute("y2", s0[1]);
        layer().appendChild(ghost);
      });
      svg.addEventListener("pointermove", (e) => {
        if (from === null || !ghost) return;
        const p = svgPoint(svg, e.clientX, e.clientY);
        const j = draw.free ? -1 : nearest(p);
        const q = j >= 0 ? pts[j] : p;
        ghost.setAttribute("x2", q[0]); ghost.setAttribute("y2", q[1]);
      });
      svg.addEventListener("pointerup", (e) => {
        if (from === null) return;
        const lines = rec(idx).lines;
        const p = svgPoint(svg, e.clientX, e.clientY);
        if (draw.free) {
          if (Math.hypot(p[0] - from[0], p[1] - from[1]) > 3) {
            lines.push([from.map((v) => +v.toFixed(2)), p.map((v) => +v.toFixed(2))]);
          }
        } else {
          const j = nearest(p);
          const dup = (ln) => (ln[0] === from && ln[1] === j) || (ln[0] === j && ln[1] === from);
          if (j >= 0 && j !== from && !lines.some(dup)) lines.push([from, j]);
        }
        from = null;
        ghost?.remove();
        ghost = null;
        svg.__wbPaint();
        dirty(node);
        save();
      });
      svg.addEventListener("pointercancel", () => { from = null; ghost?.remove(); ghost = null; });
    }
    svg.__wbPaint = paint;

    /* Undo and clear sit over the figure's corner, so the question keeps the
       exact height it was paginated at. */
    drawbar(hostOf(svg), (d) => {
      const lines = rec(idx).lines;
      if (d === "undo") lines.pop();
      if (d === "wipe") lines.length = 0;
      svg.__wbPaint();
      dirty(node);
      save();
    });
  }

  /* Where the Undo / Clear buttons and the marks for a figure go: the element
     that holds the figure, shrunk to it. */
  function hostOf(svg) {
    const host = svg.closest(".gw-art, .wb-art, .rw-art, .pv-art, .mt-art, .mf-art, .ma-art") || svg.parentElement;
    host.classList.add("wb-drawhost");
    return host;
  }

  function drawbar(host, act) {
    if (host.querySelector(":scope > .wb-drawbar")) return;
    const tools = document.createElement("span");
    tools.className = "wb-drawbar";
    tools.innerHTML =
      `<button type="button" class="pp-btn wb-tint-3" data-d="undo">Undo</button>` +
      `<button type="button" class="pp-btn wb-tint-4" data-d="wipe">Clear</button>`;
    tools.addEventListener("click", (e) => { if (e.target.dataset.d) act(e.target.dataset.d); });
    host.appendChild(tools);
  }

  /* ── colouring parts in (or crossing them out) ─────────────────────────
     Shapes cut into parts carry data-part on each part; a part printed
     already coloured carries data-shaded. Colouring fills the empty parts;
     crossing out (taking away) marks the coloured ones with an X. */
  function makeColourable(node, idx, e) {
    const k = e.nth || 0;
    const svg = colourSvgs(node)[k];
    if (!svg) return;
    const mode = e.mode || "fill";
    svg.dataset.colourable = mode;
    const paint = () => {
      const on = new Set(rec(idx).colours[k] || []);
      svg.querySelector(":scope > .wb-cross")?.remove();
      const cross = document.createElementNS(SVGNS, "g");
      cross.setAttribute("class", "wb-cross");
      svg.querySelectorAll("[data-part]").forEach((p) => {
        if (p.dataset.fill0 === undefined) p.dataset.fill0 = p.getAttribute("fill") || "";
        const hit = on.has(p.dataset.part);
        if (mode === "fill") p.setAttribute("fill", hit ? COLOUR : p.dataset.fill0);
        else if (hit) {
          const b = p.getBBox();
          const m = Math.min(b.width, b.height) * 0.22;
          [[b.x + m, b.y + m, b.x + b.width - m, b.y + b.height - m], [b.x + b.width - m, b.y + m, b.x + m, b.y + b.height - m]]
            .forEach(([x1, y1, x2, y2]) => {
              const l = document.createElementNS(SVGNS, "line");
              l.setAttribute("x1", x1); l.setAttribute("y1", y1); l.setAttribute("x2", x2); l.setAttribute("y2", y2);
              cross.appendChild(l);
            });
        }
      });
      svg.appendChild(cross);
    };
    svg.__wbColourPaint = paint;
    paint();
    if (!svg.__wbColourBound) {
      svg.__wbColourBound = true;
      svg.addEventListener("click", (ev) => {
        const m = svg.dataset.colourable;
        if (!m) return;
        const part = ev.target.closest("[data-part]");
        if (!part) return;
        const given = part.dataset.shaded === "1";
        if ((m === "fill" && given) || (m === "cross" && !given)) return;
        const list = (rec(idx).colours[k] ||= []);
        const at = list.indexOf(part.dataset.part);
        if (at >= 0) list.splice(at, 1); else list.push(part.dataset.part);
        svg.__wbColourPaint();
        dirty(node);
        save();
      });
    }
  }

  /* ── joining two columns ───────────────────────────────────────────────
     Tap something on the left, then what it goes with on the right; the line
     is drawn between their dots. Tapping a left one again starts it over. */
  function makeMatchable(node, idx, e) {
    const box = node.querySelector(".wb-match");
    if (!box) return;
    box.classList.add("is-live");
    const lefts = [...box.querySelectorAll(".wb-match__side:not(.wb-match__side--right) > li")];
    const rights = [...box.querySelectorAll(".wb-match__side--right > li")];
    let picked = null;
    const dot = (li) => li.querySelector(".wb-match__dot") || li;
    const paint = () => {
      box.querySelector(":scope > .wb-matchlines")?.remove();
      const svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("class", "wb-matchlines");
      const br = box.getBoundingClientRect();
      const z = br.width / (box.offsetWidth || 1) || 1;
      svg.setAttribute("viewBox", `0 0 ${box.offsetWidth} ${box.offsetHeight}`);
      const at = (el) => { const r = el.getBoundingClientRect(); return [(r.left + r.width / 2 - br.left) / z, (r.top + r.height / 2 - br.top) / z]; };
      rec(idx).pairs.forEach(([l, r]) => {
        if (!lefts[l] || !rights[r]) return;
        const [x1, y1] = at(dot(lefts[l]));
        const [x2, y2] = at(dot(rights[r]));
        const ln = document.createElementNS(SVGNS, "line");
        ln.setAttribute("x1", x1); ln.setAttribute("y1", y1); ln.setAttribute("x2", x2); ln.setAttribute("y2", y2);
        const judged = box.__wbJudge ? (box.__wbJudge(l, r) ? " is-right" : " is-wrong") : "";
        ln.setAttribute("class", `wb-matchline${judged}`);
        svg.appendChild(ln);
      });
      box.appendChild(svg);
      lefts.forEach((li, i) => li.classList.toggle("is-picked", i === picked));
    };
    box.__wbPaint = paint;
    lefts.forEach((li, i) => {
      li.onclick = () => { picked = picked === i ? null : i; paint(); };
    });
    rights.forEach((li, j) => {
      li.onclick = () => {
        if (picked === null) return;
        const r = rec(idx);
        r.pairs = r.pairs.filter(([l, rr]) => l !== picked && rr !== j);
        r.pairs.push([picked, j]);
        picked = null;
        paint();
        dirty(node);
        save();
      };
    });
    paint();
  }

  /* ── tearing corners off and fitting them on a line ──────────────────────
     The experiment, done by hand. Tap a coloured corner of the triangle — or
     drag it across — and it comes away, leaving a pale gap, and lies loose
     on the line's figure, the size it was and facing the way it faced. From
     there the child does the rest:
       · drag a corner to move it; let go with its point near the dot and the
         point goes onto the dot;
       · turn it by the knob at the edge of its arc (or the arrow keys);
       · drag from the dot to draw a line out of it; drag a line's end to turn
         it and make it longer or shorter;
       · turn the corners to fit between the lines.
     An edge that comes within 3° of the straight line, a drawn line, or the
     edge of a corner already on the dot clicks onto it, so small hands can
     line things up. When the three corners fill the straight line exactly,
     the line goes green — it does not say "a straight line": that is the
     question's to ask. The figure says each corner's angle, colour, size and
     facing (svg[data-tear], [data-start]); the line's figure says where its
     dot is (svg[data-paste]). Nothing here is marked. */
  function makeStickable(node, idx) {
    const tear = node.querySelector("svg[data-tear]");
    const paste = node.querySelector("svg[data-paste]");
    if (!tear || !paste) return;
    tear.dataset.stickable = "1";
    paste.dataset.stickable = "1";
    const angles = tear.dataset.tear.split(",").map(Number);
    const cols = (tear.dataset.tearCols || "").split(",");
    const R = Number(tear.dataset.tearR) || 13;
    const [ox, oy] = paste.dataset.paste.split(",").map(Number);
    const corners = [...tear.querySelectorAll("[data-corner]")];
    const startOf = (i) => Number(corners[i]?.dataset.start) || 0;
    const vertexOf = (i) => (corners[i]?.getAttribute("d").match(/-?\d+(\.\d+)?/g) || [0, 0]).slice(0, 2).map(Number);
    const SNAP_DEG = 3;
    const DOT_MM = 3.5;
    const rad = (d) => (d * Math.PI) / 180;
    const degOf = (x, y) => (Math.atan2(y, x) * 180) / Math.PI;
    const norm = (d) => ((d % 360) + 360) % 360;
    const diff = (a, b) => ((((a - b) % 360) + 540) % 360) - 180; // a − b, in (−180, 180]
    const f = (n) => n.toFixed(2);
    const S = () => {
      const r = rec(idx);
      r.tear ||= { pieces: {}, rays: [], log: [] };
      return r.tear;
    };
    const atDot = (p) => p && Math.hypot(p.x - ox, p.y - oy) < 0.01;
    /* the two edges of a laid corner, as directions out of its point */
    const edges = (i, p) => [norm(startOf(i) + p.rot), norm(startOf(i) + p.rot + angles[i])];

    /* Do the corners on the dot fill one side of the line, edge to edge? */
    function fitted() {
      const st = S();
      const on = Object.keys(st.pieces).map(Number).filter((i) => atDot(st.pieces[i]));
      if (on.length !== 3) return false;
      return [180, 0].some((base) => {
        const spans = on.map((i) => norm(edges(i, st.pieces[i])[0] - base)).map((s, k) => [s, angles[on[k]]]);
        spans.sort((a, b) => a[0] - b[0]);
        let at = 0;
        return spans.every(([s, a]) => {
          const ok = Math.abs(diff(s, at)) < 2.5;
          at = s + a;
          return ok;
        }) && Math.abs(at - 180) < 2.5;
      });
    }

    const el = (tag, attrs, parent) => {
      const n = document.createElementNS(SVGNS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      parent?.appendChild(n);
      return n;
    };

    const paint = () => {
      const st = S();
      corners.forEach((p, i) => {
        const torn = i in st.pieces;
        p.classList.toggle("is-torn", torn);
        p.setAttribute("role", "button");
        p.setAttribute("tabindex", torn ? "-1" : "0");
        p.setAttribute("aria-label", `Tear off corner ${String.fromCharCode(65 + i)}`);
      });
      paste.querySelector(":scope > .wb-stuck")?.remove();
      const g = el("g", { class: "wb-stuck" }, paste);
      st.rays.forEach((ray, k) => {
        const ex = ox + ray.len * Math.cos(rad(ray.ang));
        const ey = oy + ray.len * Math.sin(rad(ray.ang));
        el("line", { class: "wb-ray", x1: f(ox), y1: f(oy), x2: f(ex), y2: f(ey) }, g);
        el("circle", { class: "wb-ray__end", "data-ray": k, cx: f(ex), cy: f(ey), r: 1.7 }, g);
      });
      st.log.filter((t) => t[0] === "p").map((t) => Number(t.slice(1))).forEach((i) => {
        const p = st.pieces[i];
        if (!p) return;
        const s = startOf(i);
        const a = angles[i];
        const pg = el("g", {
          class: "wb-piece", "data-piece": i, tabindex: 0, role: "img",
          "aria-label": `Corner ${String.fromCharCode(65 + i)}. Drag to move; turn with the knob or the arrow keys.`,
          transform: `translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.rot)})`,
        }, g);
        const x0 = R * Math.cos(rad(s)), y0 = R * Math.sin(rad(s));
        const x1 = R * Math.cos(rad(s + a)), y1 = R * Math.sin(rad(s + a));
        el("path", { d: `M0 0 L${f(x0)} ${f(y0)} A${R} ${R} 0 ${a > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)} Z`, fill: cols[i] || "#f4c95d" }, pg);
        const m = rad(s + a / 2);
        const t = el("text", { class: "wb-piece__name", x: f(R * 0.55 * Math.cos(m)), y: f(R * 0.55 * Math.sin(m) + 1.2) }, pg);
        t.textContent = String.fromCharCode(65 + i);
        el("circle", { class: "wb-piece__knob", "data-knob": i, cx: f((R + 2.6) * Math.cos(m)), cy: f((R + 2.6) * Math.sin(m)), r: 1.9 }, pg);
      });
      el("circle", { class: "wb-stuck__dot", cx: ox, cy: oy, r: 1.1 }, g);
      paste.classList.toggle("has-stuck", st.log.length > 0);
      paste.classList.toggle("is-fitted", fitted());
    };
    const changed = () => { tear.__wbStickPaint(); dirty(node); save(); };

    /* Lay corner i on the line's figure: its point at (x, y), or — tapped —
       in the next free place along the top. */
    const tearOff = (i, at = null) => {
      const st = S();
      if (i in st.pieces) return;
      /* loose, clear of the dot: left, right, then between */
      const n = Object.keys(st.pieces).length;
      const [x, y] = at || [ox + [-44, 44, -22][n % 3], oy - 12];
      st.pieces[i] = { x, y, rot: 0 };
      st.log.push(`p${i}`);
      changed();
    };

    /* Turn corner i so that an edge within SNAP_DEG of something to line up
       with lies on it — only once its point is on the dot. */
    const snapTurn = (i) => {
      const st = S();
      const p = st.pieces[i];
      if (!atDot(p)) return;
      const targets = [0, 180, ...st.rays.map((r) => r.ang)];
      Object.keys(st.pieces).map(Number).forEach((j) => { if (j !== i && atDot(st.pieces[j])) targets.push(...edges(j, st.pieces[j])); });
      let best = null;
      edges(i, p).forEach((e) => targets.forEach((t) => {
        const d = diff(t, e);
        if (Math.abs(d) < SNAP_DEG && (best === null || Math.abs(d) < Math.abs(best))) best = d;
      }));
      if (best !== null) p.rot += best;
    };
    const snapRay = (ray) => {
      const st = S();
      const targets = [0, 180];
      Object.keys(st.pieces).map(Number).forEach((j) => { if (atDot(st.pieces[j])) targets.push(...edges(j, st.pieces[j])); });
      let best = null;
      targets.forEach((t) => {
        const d = diff(t, ray.ang);
        if (Math.abs(d) < SNAP_DEG && (best === null || Math.abs(d) < Math.abs(best))) best = d;
      });
      ray.ang = norm(ray.ang + (best ?? 0));
    };

    tear.__wbStickPaint = paint;
    paint();

    /* Bound once per figure, like the ruled lines. */
    if (!tear.__wbStickBound) {
      tear.__wbStickBound = true;

      /* ── off the triangle ── */
      let drag = null;
      /* Which corner is under the pointer, by its shape — the corner's letter
         and its tear line are drawn over it, right where a finger lands. */
      const cornerAt = (e) => {
        const [x, y] = svgPoint(tear, e.clientX, e.clientY);
        const pt = new DOMPoint(x, y);
        return corners.find((p) => !p.classList.contains("is-torn") && p.isPointInFill?.(pt))
          || e.target.closest?.("[data-corner]");
      };
      tear.addEventListener("pointerdown", (e) => {
        const p = cornerAt(e);
        if (!tear.dataset.stickable || !p || p.classList.contains("is-torn")) return;
        e.preventDefault();
        tear.setPointerCapture(e.pointerId);
        const m = tear.getScreenCTM();
        drag = { p, x: e.clientX, y: e.clientY, k: m ? m.a : 1, moved: false };
        tear.classList.add("is-dragging");
      });
      tear.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > 6) drag.moved = true;
        drag.p.setAttribute("transform", `translate(${f(dx / drag.k)} ${f(dy / drag.k)})`);
      });
      const drop = (e, cancelled) => {
        if (!drag) return;
        const { p, moved, x, y } = drag;
        drag = null;
        p.removeAttribute("transform");
        tear.classList.remove("is-dragging");
        if (cancelled) return;
        const i = Number(p.dataset.corner);
        if (!moved) { tearOff(i); return; }
        const r = paste.getBoundingClientRect();
        const over = e.clientX >= r.left - 12 && e.clientX <= r.right + 12 && e.clientY >= r.top - 12 && e.clientY <= r.bottom + 12;
        if (!over) return;
        /* its point lands where the dragged corner's point was let go */
        const m = tear.getScreenCTM();
        const [vx, vy] = vertexOf(i);
        const sp = m ? new DOMPoint(vx, vy).matrixTransform(m) : { x: e.clientX, y: e.clientY };
        tearOff(i, svgPoint(paste, sp.x + (e.clientX - x), sp.y + (e.clientY - y)));
      };
      tear.addEventListener("pointerup", (e) => drop(e, false));
      tear.addEventListener("pointercancel", (e) => drop(e, true));
      tear.addEventListener("keydown", (e) => {
        const p = e.target.closest?.("[data-corner]");
        if (!tear.dataset.stickable || !p || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        tearOff(Number(p.dataset.corner));
      });

      /* ── on the line's figure ──
         What is under the pointer is worked out from the geometry, not from
         the element hit: a corner turned past the figure's edge is still
         drawn (overflow) but the browser does not deliver presses there. So
         the press is caught for the whole page, early, and only kept when it
         lands on something of this figure's — in this order: a corner's
         knob, a line's end, the dot (a new line, even with corners on it),
         then the body of a corner, the one on top first. */
      let op = null;
      /* a handle is at least 14 screen pixels to grab, however small the
         paper is drawn — on a phone a millimetre is barely two pixels */
      let grab = 1;
      const within = (d, r) => d <= Math.max(r, grab);
      const hitAt = (x, y) => {
        const m0 = paste.getScreenCTM();
        grab = m0 ? 14 / m0.a : 1;
        const st = S();
        const laid = st.log.filter((t) => t[0] === "p").map((t) => Number(t.slice(1))).filter((i) => st.pieces[i]);
        for (const i of [...laid].reverse()) {
          const p = st.pieces[i];
          const m = rad(startOf(i) + angles[i] / 2 + p.rot);
          if (within(Math.hypot(x - (p.x + (R + 2.6) * Math.cos(m)), y - (p.y + (R + 2.6) * Math.sin(m))), 2.8)) return { kind: "turn", i };
        }
        for (let k = st.rays.length - 1; k >= 0; k--) {
          const r = st.rays[k];
          if (within(Math.hypot(x - (ox + r.len * Math.cos(rad(r.ang))), y - (oy + r.len * Math.sin(rad(r.ang)))), 2.8)) return { kind: "ray", k };
        }
        if (within(Math.hypot(x - ox, y - oy), 2.6)) return { kind: "new-ray" };
        for (const i of [...laid].reverse()) {
          const p = st.pieces[i];
          const d = Math.hypot(x - p.x, y - p.y);
          const into = norm(degOf(x - p.x, y - p.y) - (startOf(i) + p.rot));
          if (d <= R + 0.5 && into <= angles[i]) return { kind: "move", i };
        }
        return null;
      };
      const press = (e) => {
        if (!paste.isConnected) { document.removeEventListener("pointerdown", press, true); return; }
        if (!paste.dataset.stickable || e.button > 0) return;
        const [x, y] = svgPoint(paste, e.clientX, e.clientY);
        const hit = hitAt(x, y);
        if (!hit) return;
        const st = S();
        if (hit.kind === "new-ray") {
          st.rays.push({ ang: 270, len: 0 });
          st.log.push("r");
          op = { kind: "ray", k: st.rays.length - 1 };
        } else if (hit.kind === "move") {
          const p = st.pieces[hit.i];
          op = { kind: "move", i: hit.i, x, y, px: p.x, py: p.y };
        } else op = hit;
        e.preventDefault();
        e.stopPropagation();
        paste.setPointerCapture(e.pointerId);
        if (op.i !== undefined) paste.querySelector(`[data-piece="${op.i}"]`)?.focus({ preventScroll: true });
      };
      document.addEventListener("pointerdown", press, true);
      paste.addEventListener("pointermove", (e) => {
        if (!op) return;
        const st = S();
        const [x, y] = svgPoint(paste, e.clientX, e.clientY);
        if (op.kind === "move") {
          const p = st.pieces[op.i];
          p.x = op.px + (x - op.x);
          p.y = op.py + (y - op.y);
        } else if (op.kind === "turn") {
          const p = st.pieces[op.i];
          /* the knob sits on the middle of the arc: point it at the pointer */
          p.rot = norm(degOf(x - p.x, y - p.y) - (startOf(op.i) + angles[op.i] / 2));
          snapTurn(op.i);
        } else {
          const ray = st.rays[op.k];
          ray.ang = norm(degOf(x - ox, y - oy));
          ray.len = Math.min(70, Math.hypot(x - ox, y - oy));
          snapRay(ray);
        }
        tear.__wbStickPaint();
      });
      const up = () => {
        if (!op) return;
        const st = S();
        if (op.kind === "move") {
          const p = st.pieces[op.i];
          if (Math.hypot(p.x - ox, p.y - oy) < DOT_MM) { p.x = ox; p.y = oy; snapTurn(op.i); }
        }
        if (op.kind === "ray" && st.rays[op.k].len < 4) {
          /* a tap on the dot, not a line: nothing drawn (a line made shorter
             than that is taken away) */
          st.rays.splice(op.k, 1);
          const at = st.log.lastIndexOf("r");
          if (at >= 0) st.log.splice(at, 1);
        }
        op = null;
        changed();
      };
      paste.addEventListener("pointerup", up);
      paste.addEventListener("pointercancel", up);
      paste.addEventListener("keydown", (e) => {
        const piece = e.target.closest?.("[data-piece]");
        if (!paste.dataset.stickable || !piece) return;
        const step = e.shiftKey ? 5 : 1;
        const p = S().pieces[piece.dataset.piece];
        if (e.key === "ArrowLeft") p.rot = norm(p.rot - step);
        else if (e.key === "ArrowRight") p.rot = norm(p.rot + step);
        else return;
        e.preventDefault();
        changed();
        paste.querySelector(`[data-piece="${piece.dataset.piece}"]`)?.focus({ preventScroll: true });
      });
    }

    /* Undo takes back the last corner laid or line drawn; Clear, everything. */
    drawbar(hostOf(paste), (d) => {
      const st = S();
      if (d === "undo") {
        const t = st.log.pop();
        if (t === "r") st.rays.pop();
        else if (t) delete st.pieces[t.slice(1)];
      }
      if (d === "wipe") { st.pieces = {}; st.rays = []; st.log = []; }
      changed();
    });
  }

  /* ── a pencil ──────────────────────────────────────────────────────────
     For the things a child does to a picture that are not marked — ringing
     groups, drawing counters into trays, drawing blocks. Strokes are kept
     like everything else, but no key looks at them. */
  function makePen(node, idx, e) {
    [...node.querySelectorAll(e.on || ".wb-item__body svg")].forEach((svg, k) => {
      svg.dataset.pen = "1";
      const layer = () => {
        let g = svg.querySelector(":scope > .wb-pen");
        if (!g) { g = document.createElementNS(SVGNS, "g"); g.setAttribute("class", "wb-pen"); svg.appendChild(g); }
        return g;
      };
      const strokes = () => (rec(idx).pens[k] ||= []);
      const paint = () => {
        const g = layer();
        g.innerHTML = "";
        strokes().forEach((pts) => {
          const pl = document.createElementNS(SVGNS, "polyline");
          pl.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
          g.appendChild(pl);
        });
      };
      svg.__wbPenPaint = paint;
      paint();
      if (!svg.__wbPenBound) {
        svg.__wbPenBound = true;
        let cur = null;
        let line = null;
        svg.addEventListener("pointerdown", (ev) => {
          if (!svg.dataset.pen) return;
          ev.preventDefault();
          svg.setPointerCapture(ev.pointerId);
          cur = [svgPoint(svg, ev.clientX, ev.clientY).map((v) => +v.toFixed(1))];
          line = document.createElementNS(SVGNS, "polyline");
          layer().appendChild(line);
        });
        svg.addEventListener("pointermove", (ev) => {
          if (!cur) return;
          const p = svgPoint(svg, ev.clientX, ev.clientY).map((v) => +v.toFixed(1));
          const q = cur[cur.length - 1];
          if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.6) return;
          cur.push(p);
          line.setAttribute("points", cur.map((c) => c.join(",")).join(" "));
        });
        const end = () => {
          if (!cur) return;
          if (cur.length > 1) strokes().push(cur);
          cur = null;
          svg.__wbPenPaint();
          save();
        };
        svg.addEventListener("pointerup", end);
        svg.addEventListener("pointercancel", end);
      }
      const penHost = hostOf(svg);
      penHost.classList.add("is-pen-host");
      drawbar(penHost, (d) => {
        if (d === "undo") strokes().pop();
        if (d === "wipe") strokes().length = 0;
        svg.__wbPenPaint();
        save();
      });
    });
  }

  /* ── marking ───────────────────────────────────────────────────────────*/

  function check() {
    let right = 0;
    let total = 0;
    let unmarked = 0;
    items().forEach((node, idx) => {
      const entries = keyOf(node);
      node.querySelectorAll(".wb-want").forEach((n) => n.remove());
      if (!entries || !entries.some(MARKED)) { unmarked++; return; }
      const slots = slotsOf(node);
      let s = 0;
      let allRight = true;
      entries.forEach((entry) => {
        if (entry.kind === "colour") {
          const svg = colourSvgs(node)[entry.nth || 0];
          const got = (rec(idx).colours[entry.nth || 0] || []).length;
          const ok = got === entry.count;
          const host = svg && hostOf(svg);
          host?.classList.add("is-colour-host");
          host?.classList.remove("is-right", "is-wrong");
          host?.classList.add(ok ? "is-right" : "is-wrong");
          if (host) host.dataset.want = sayWant(entry);
          total++; if (ok) right++; else allRight = false;
          return;
        }
        if (entry.kind === "match") {
          const box = node.querySelector(".wb-match");
          const good = new Set(entry.pairs.map(([l, r]) => `${l}:${r}`));
          const pairs = rec(idx).pairs;
          const n = entry.pairs.length;
          let hits = 0;
          pairs.forEach(([l, r]) => { if (good.has(`${l}:${r}`)) hits++; });
          if (box) { box.__wbJudge = (l, r) => good.has(`${l}:${r}`); box.__wbPaint?.(); }
          right += hits; total += n;
          if (hits < n) allRight = false;
          box?.classList.remove("is-right", "is-wrong");
          box?.classList.add(hits === n ? "is-right" : "is-wrong");
          if (box) box.dataset.want = sayWant(entry);
          return;
        }
        if (entry.kind === "pen" || entry.kind === "stick") return;
        if (entry.kind === "draw") {
          const svg = drawSvg(node, entry);
          const fig = svg ? { pts: parsePts(svg.dataset.pts), par: parseSegs(svg.dataset.par) } : { pts: [], par: [] };
          const ok = !!entry.check(rec(idx).lines, fig);
          svg?.closest(".wb-drawhost")?.classList.remove("is-right", "is-wrong");
          svg?.closest(".wb-drawhost")?.classList.add(ok ? "is-right" : "is-wrong");
          if (svg) svg.closest(".wb-drawhost").dataset.want = sayWant(entry);
          total++; if (ok) right++; else allRight = false;
          return;
        }
        const n = placesOf(entry);
        const group = slots.slice(s, s + n);
        s += n;
        if (entry.kind === "free" || !group.length) return;
        const res = judge(entry, group.map(valueOf));
        group.forEach((slot, k) => {
          slot.classList.remove("is-right", "is-wrong");
          slot.classList.add(res[k] ? "is-right" : "is-wrong");
          const labels = [...slot.querySelectorAll(".wb-tick__one")].map((o) => o.textContent.trim());
          slot.dataset.want = entry.kind === "set" ? sayWant(entry) : sayWant(entry, labels);
          if (entry.kind === "tick") slot.dataset.wantIndex = entry.i;
          total++; if (res[k]) right++; else allRight = false;
        });
      });
      node.classList.toggle("is-marked-right", allRight);
      node.classList.toggle("is-marked-wrong", !allRight);
    });
    checked = true;
    showBtn.hidden = false;
    const pct = total ? Math.round((100 * right) / total) : 0;
    score.textContent = total ? `${right} / ${total} right · ${pct}%` : "Nothing to mark yet";
    if (unmarked) score.textContent += ` · ${unmarked} to check yourself`;
    paintWants();
    if (onCheck && total) { try { onCheck({ right, total }); } catch { /* the page's business */ } }
  }

  /* Under each wrong place, the right answer — only when asked for. A child
     who got it wrong should get a go at it first. */
  function paintWants() {
    sheet.querySelectorAll(".wb-want").forEach((n) => n.remove());
    sheet.querySelectorAll(".is-want").forEach((n) => n.classList.remove("is-want"));
    if (!showing) return;
    sheet.querySelectorAll(".is-wrong").forEach((slot) => {
      if (slot.classList.contains("wb-tick")) {
        const i = Number(slot.dataset.wantIndex);
        slot.querySelectorAll(".wb-tick__one")[i]?.classList.add("is-want");
        return;
      }
      if (!slot.dataset.want) return;
      const w = document.createElement("span");
      w.className = "wb-want";
      w.textContent = slot.dataset.want;
      slot.appendChild(w);
    });
  }

  function clearAll() {
    store = {};
    try { localStorage.removeItem(`wb-live:${key}`); } catch { /* ignore */ }
    checked = false;
    showing = false;
    showBtn.hidden = true;
    showBtn.textContent = "Show the answers";
    score.textContent = "";
    items().forEach((node, i) => { deaden(node); enliven(node, i); });
  }

  /* ── the sidebar: everything there is to reach for ───────────────────────
     One rail down the side of the window, in reach wherever the child has
     scrolled to. It holds two kinds of thing, and the difference matters.

     INSTRUMENTS — ruler, protractor, set square — live in the scaler, so they
     are drawn at the paper's own scale and MEASURE what the paper measures.
     Drag one by its body; turn it by the knob (or the arrow keys once it has
     been touched). Let go with its pivot — the ruler's 0, the protractor's
     centre, the set square's square corner — near a corner of a figure and the
     pivot goes onto the corner; and while it sits on a corner, an edge turned
     to within a few degrees of a side from that corner lies along it. So a
     ruler dropped on A and turned towards B reads the length of AB, and a
     protractor's baseline lies down along an arm. See instruments.js.

     SHEETS — the long division, the table addition, the table multiplication,
     the fraction board and the algebra canvas — are working paper instead. They are not laid on
     the figure, they sit beside the question in a panel that can be dragged
     out of the way while the answer is typed on the page. The written boards
     are the same boards the manipulatives canvas uses (utils/components/
     boards), so a sum worked here is worked the way it is worked there. */

  const TOOLS = instruments({ protractor });
  const out = {};                     // id -> { el, st, spec }
  const TURN_SNAP = 4;                // degrees

  /* the working paper, in the order a child would reach for it */
  const SHEETS = [
    ...["longdiv", "column", "times", "fraction"].map((id) => ({
      id,
      label: BOARDS[id].name,
      icon: TOOL_ICONS[id],
      size: { w: 460, h: 430 },
      open: (body) => {
        needCss("/utils/components/boards.css");
        mountBoard(body, { variant: id, base: 10 });
      },
    })),
    {
      id: "gm",
      label: "Algebra moves",
      icon: TOOL_ICONS.gm,
      size: { w: 880, h: 620 },
      /* The whole Algebra Moves workspace, mounted here rather than copied:
         one canvas, one set of moves, one verifier. It is fetched the first
         time it is asked for, because most workbooks never open it. */
      open: async (body) => {
        needCss("/prep-math/activity/algebra-moves/style.css");
        body.classList.add("wb-panel__body--bare");
        const frame = document.createElement("div");
        frame.className = "am-frame am-frame--in";
        body.appendChild(frame);
        const { mountAlgebraMoves } = await import("/prep-math/activity/algebra-moves/js/workspace.js");
        await mountAlgebraMoves(frame, { drawer: false });
      },
    },
  ];

  const side = document.createElement("aside");
  side.className = "wb-side";
  side.hidden = true;
  side.setAttribute("aria-label", "Tools");
  side.innerHTML = `
    <span class="wb-side__cap">Tools</span>
    ${TOOLS.map((t) => (
      `<button type="button" class="wb-side__btn" data-tool="${t.id}" aria-pressed="false" title="${t.label}">`
      + `${TOOL_ICONS[t.id] || ""}<em>${t.label}</em></button>`)).join("")}
    <span class="wb-side__rule" role="presentation"></span>
    ${SHEETS.map((t) => (
      `<button type="button" class="wb-side__btn" data-sheet="${t.id}" aria-pressed="false" title="${t.label}">`
      + `${t.icon || ""}<em>${t.label}</em></button>`)).join("")}`;
  document.body.appendChild(side);
  side.addEventListener("click", (e) => {
    const hit = e.target.closest("[data-tool], [data-sheet]");
    if (!hit) return;
    if (hit.dataset.tool) toggleTool(hit.dataset.tool);
    else togglePanel(hit.dataset.sheet);
  });

  const panels = {};                  // id -> the panel that is open

  function togglePanel(id) {
    const btn = side.querySelector(`[data-sheet="${id}"]`);
    if (panels[id]) {
      panels[id].close();
      return;
    }
    const spec = SHEETS.find((t) => t.id === id);
    if (!spec) return;
    const panel = openPanel({
      title: spec.label,
      size: spec.size,
      onClose: () => {
        delete panels[id];
        btn?.classList.remove("is-on");
        btn?.setAttribute("aria-pressed", "false");
      },
    });
    panels[id] = panel;
    btn?.classList.add("is-on");
    btn?.setAttribute("aria-pressed", "true");
    Promise.resolve(spec.open(panel.body)).catch(() => {
      panel.body.textContent = "That tool could not be fetched — check the connection and try again.";
    });
  }

  function putSheetsAway() {
    Object.values(panels).forEach((p) => p.close());
  }

  function zoom() {
    const r = scaler.getBoundingClientRect();
    return r.width / (scaler.offsetWidth || 1) || 1;
  }

  /* Every corner of every figure (not the dot grids: every dot is a point
     there, and a tool that jumps to the nearest dot cannot be put down),
     with the other corners of the same figure, in the scaler's pixels. */
  function corners() {
    const sr = scaler.getBoundingClientRect();
    const z = zoom();
    const all = [];
    sheet.querySelectorAll("svg[data-pts]:not([data-grid])").forEach((svg) => {
      const m = svg.getScreenCTM();
      if (!m) return;
      const here = parsePts(svg.dataset.pts).map(([x, y]) => {
        const p = new DOMPoint(x, y).matrixTransform(m);
        return [(p.x - sr.left) / z, (p.y - sr.top) / z];
      });
      here.forEach((p) => all.push({ p, others: here.filter((q) => q !== p) }));
    });
    return all;
  }

  const angleDiff = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;

  /* Turn a tool sitting on corner `c` so that an edge within TURN_SNAP of a
     side from that corner lies along it. */
  function lineUp(t, c) {
    if (!c) return;
    let best = null;
    c.others.forEach((q) => {
      const dir = (Math.atan2(q[1] - c.p[1], q[0] - c.p[0]) * 180) / Math.PI;
      t.spec.edges.forEach((e) => {
        [0, ...(e.both ? [180] : [])].forEach((flip) => {
          const d = angleDiff(dir, t.st.rot + e.deg + flip);
          if (Math.abs(d) < TURN_SNAP && (best === null || Math.abs(d) < Math.abs(best))) best = d;
        });
      });
    });
    if (best !== null) t.st.rot += best;
  }

  function openTool(spec, k) {
    const el = document.createElement("div");
    el.className = `wb-tool wb-tool--${spec.id}`;
    el.tabIndex = 0;
    el.setAttribute("aria-label", `${spec.label}. Drag to move, drag the round knob to turn; the arrow keys turn it by a degree.`);
    el.innerHTML = spec.svg +
      `<span class="wb-tool__knob" title="Turn"></span>` +
      `<button type="button" class="wb-tool__close" title="Put it away" aria-label="Put the ${spec.label.toLowerCase()} away">${TOOL_ICONS.close}</button>` +
      (spec.readout ? `<span class="wb-tool__deg"></span>` : "");
    scaler.appendChild(el);
    /* the × puts it back in the box */
    const close = el.querySelector(".wb-tool__close");
    const at = spec.close || [2, 2];
    close.style.left = `${at[0] * MM}px`;
    close.style.top = `${at[1] * MM}px`;
    close.addEventListener("click", (e) => { e.stopPropagation(); toggleTool(spec.id); });
    const px = spec.pivot.map((v) => v * MM);
    /* the direction the knob lies in from the pivot, on the tool itself */
    const knobAt = (Math.atan2(spec.knob[1] - spec.pivot[1], spec.knob[0] - spec.pivot[0]) * 180) / Math.PI;
    const knob = el.querySelector(".wb-tool__knob");
    knob.style.left = `${spec.knob[0] * MM}px`;
    knob.style.top = `${spec.knob[1] * MM}px`;
    el.style.transformOrigin = `${px[0]}px ${px[1]}px`;

    /* Out where the reader is looking — under the pinned tools at the top of
       what is on screen — each one a little lower than the last. */
    const vr = viewport.getBoundingClientRect();
    const sr = scaler.getBoundingClientRect();
    const z = zoom();
    const head = document.querySelector(".wb-modal.is-open .wb-modal__head, .wb-livebar");
    const top = Math.max(vr.top, head ? head.getBoundingClientRect().bottom : 90);
    const st = {
      x: (Math.max(vr.left, 0) - sr.left) / z + scaler.offsetWidth * 0.18 + px[0],
      y: (top - sr.top) / z + 40 + k * 70 + px[1],
      rot: 0,
      on: null,
    };
    const t = { el, st, spec };
    const place = () => {
      el.style.left = `${st.x - px[0]}px`;
      el.style.top = `${st.y - px[1]}px`;
      el.style.transform = `rotate(${st.rot}deg)`;
      const deg = el.querySelector(".wb-tool__deg");
      if (deg) {
        const d = ((st.rot % 360) + 360) % 360;
        deg.textContent = `${Math.round(d > 180 ? d - 360 : d)}°`;
      }
    };
    t.place = place;
    place();

    let mode = null;
    let from = null;
    el.addEventListener("pointerdown", (e) => {
      /* a press on the × is a click on the ×, not the start of a drag */
      if (e.target.closest(".wb-tool__close")) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.focus({ preventScroll: true });
      /* the one picked up goes on top */
      Object.values(out).forEach((o) => o.el.classList.toggle("is-top", o === t));
      mode = e.target.classList.contains("wb-tool__knob") ? "turn" : "move";
      from = { px: e.clientX, py: e.clientY, x: st.x, y: st.y };
    });
    el.addEventListener("pointermove", (e) => {
      if (!mode) return;
      const z2 = zoom();
      if (mode === "move") {
        st.x = from.x + (e.clientX - from.px) / z2;
        st.y = from.y + (e.clientY - from.py) / z2;
        st.on = null;
      } else {
        const s2 = scaler.getBoundingClientRect();
        /* point the knob at the pointer */
        st.rot = (Math.atan2(e.clientY - (s2.top + st.y * z2), e.clientX - (s2.left + st.x * z2)) * 180) / Math.PI - knobAt;
      }
      place();
    });
    el.addEventListener("pointerup", () => {
      if (mode === "move") {
        let d = SNAP_MM * MM * 1.4;
        st.on = null;
        corners().forEach((c) => {
          const e2 = Math.hypot(c.p[0] - st.x, c.p[1] - st.y);
          if (e2 < d) { d = e2; st.on = c; }
        });
        if (st.on) { st.x = st.on.p[0]; st.y = st.on.p[1]; }
      }
      if (mode) lineUp(t, st.on);
      place();
      mode = null;
    });
    el.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 5 : 1;
      if (e.key === "ArrowLeft") { st.rot -= step; place(); e.preventDefault(); }
      if (e.key === "ArrowRight") { st.rot += step; place(); e.preventDefault(); }
      if (e.key === "Delete" || e.key === "Backspace") { toggleTool(spec.id); e.preventDefault(); }
    });
    return t;
  }

  function toggleTool(id) {
    const btn = side.querySelector(`[data-tool="${id}"]`);
    if (out[id]) {
      out[id].el.remove();
      delete out[id];
      btn?.classList.remove("is-on");
      btn?.setAttribute("aria-pressed", "false");
      return;
    }
    const k = TOOLS.findIndex((s) => s.id === id);
    out[id] = openTool(TOOLS[k], k);
    btn?.classList.add("is-on");
    btn?.setAttribute("aria-pressed", "true");
  }

  function putToolsAway() {
    Object.keys(out).forEach(toggleTool);
  }

  /* ── in and out ────────────────────────────────────────────────────────*/

  function keyPages(on) {
    /* The answer key is on the paper; on screen it would be the answers
       sitting under the questions. Hidden while interactive. */
    sheet.querySelectorAll(".wb-page").forEach((p) => {
      const isKey = !!p.querySelector(".wb-answers, .wb-sec--key") && !p.querySelector(".wb-item");
      p.hidden = on && isKey;
    });
    refit();
  }

  function enter() {
    live = true;
    sheet.classList.add("wb-live");
    toggle.textContent = "Back to paper";
    toggle.classList.add("is-on");
    bar.hidden = false;
    side.hidden = false;
    document.documentElement.classList.add("wb-side-on");
    store = load();
    items().forEach((node, i) => enliven(node, i));
    keyPages(true);
  }

  function leave() {
    live = false;
    sheet.classList.remove("wb-live");
    toggle.textContent = "Make interactive";
    toggle.classList.remove("is-on");
    bar.hidden = true;
    side.hidden = true;
    document.documentElement.classList.remove("wb-side-on");
    putToolsAway();
    putSheetsAway();
    items().forEach(deaden);
    checked = false;
    showing = false;
    showBtn.hidden = true;
    score.textContent = "";
    keyPages(false);
  }

  return {
    afterRender(k) {
      const changed = k !== key;
      key = k;
      if (!live) return;
      if (changed) { store = load(); checked = false; showBtn.hidden = true; score.textContent = ""; }
      sheet.classList.add("wb-live");
      items().forEach((node, i) => enliven(node, i));
      keyPages(true);
    },
    isLive: () => live,
    enter: () => { if (!live) enter(); },
  };
}
