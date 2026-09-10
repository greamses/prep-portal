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
 *     protractor   the instrument's SVG (mm-sized), or none
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
  let tool = null;

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
    <button type="button" class="pp-btn wb-tint-5" data-act="full">Full screen</button>
    ${protractor ? `<button type="button" class="pp-btn wb-tint-3" data-act="protractor">Protractor</button>` : ""}
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
    if (act === "protractor") toggleProtractor();
    if (act === "full") setFull(!full);
  });

  /* ── full screen ───────────────────────────────────────────────────────
     Interactive mode is a workspace: the paper and its tools fill the
     window, the builder rail and the site around it are out of the way. The
     window is filled by the page itself (so it works on a phone, where the
     browser will not make an element full screen) and, where the browser
     allows it, the browser's own full screen hides its bars as well. Esc, or
     the button, puts the window back; "Back to paper" does both. */
  let full = false;
  const preview = toolbar.closest(".wb-preview") || sheet.closest(".wb-preview");
  const fullBtn = bar.querySelector('[data-act="full"]');
  function setFull(on) {
    full = on;
    preview?.classList.toggle("wb-full", on);
    document.documentElement.classList.toggle("wb-full-on", on);
    fullBtn.textContent = on ? "Leave full screen" : "Full screen";
    try {
      if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    } catch { /* a browser that says no is still a full window */ }
    requestAnimationFrame(refit);
  }
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && full) {
      /* Esc left the browser's full screen: the window stays the workspace,
         the button says so */
      fullBtn.textContent = "Full screen";
      full = false;
      preview?.classList.remove("wb-full");
      document.documentElement.classList.remove("wb-full-on");
    }
    requestAnimationFrame(refit);
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
  const MARKED = (e) => !["free", "pen"].includes(e.kind);

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
    return slot.querySelector("input")?.value ?? "";
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
      const input = document.createElement("input");
      input.className = "wb-in";
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.setAttribute("aria-label", "answer");
      input.value = r.v[k] ?? "";
      input.addEventListener("input", () => { r.v[k] = input.value; dirty(node); save(); });
      slot.appendChild(input);
    });

    (keyOf(node) || []).forEach((e) => {
      if (e.kind === "draw") { const svg = drawSvg(node, e); if (svg) makeDrawable(node, idx, svg, e); }
      if (e.kind === "colour") makeColourable(node, idx, e);
      if (e.kind === "match") makeMatchable(node, idx, e);
      if (e.kind === "pen") makePen(node, idx, e);
    });
  }

  function deaden(node) {
    node.querySelectorAll("[data-part][data-fill0]").forEach((p) => p.setAttribute("fill", p.dataset.fill0));
    node.querySelectorAll("[data-colourable]").forEach((v) => v.removeAttribute("data-colourable"));
    node.querySelectorAll("[data-pen]").forEach((v) => v.removeAttribute("data-pen"));
    node.querySelectorAll(".wb-match li").forEach((li) => { li.onclick = null; li.classList.remove("is-picked"); });
    node.querySelectorAll(".wb-in, .wb-want, .wb-drawbar, .wb-draw, .wb-cross, .wb-pen, .wb-matchlines").forEach((n) => n.remove());
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
        if (entry.kind === "pen") return;
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

  /* ── the protractor ────────────────────────────────────────────────────
     It lives in the scaler, so it is drawn at the same scale as the paper and
     measures what the paper measures. Drag it by its body; turn it by the
     knob at its end (or with the arrow keys once it has been touched); let
     go near a corner and its centre dot jumps onto the corner. */

  function zoom() {
    const r = scaler.getBoundingClientRect();
    return r.width / (scaler.offsetWidth || 1) || 1;
  }

  function corners() {
    const sr = scaler.getBoundingClientRect();
    const z = zoom();
    const out = [];
    /* not the dot grids: every dot is a point there, and a protractor that jumps
       to the nearest dot is one that cannot be put down */
    sheet.querySelectorAll("svg[data-pts]:not([data-grid])").forEach((svg) => {
      const m = svg.getScreenCTM();
      if (!m) return;
      parsePts(svg.dataset.pts).forEach(([x, y]) => {
        const p = new DOMPoint(x, y).matrixTransform(m);
        out.push([(p.x - sr.left) / z, (p.y - sr.top) / z]);
      });
    });
    return out;
  }

  function toggleProtractor() {
    const btn = bar.querySelector('[data-act="protractor"]');
    if (tool) { tool.remove(); tool = null; btn?.classList.remove("is-on"); return; }
    btn?.classList.add("is-on");
    tool = document.createElement("div");
    tool.className = "wb-tool";
    tool.tabIndex = 0;
    tool.setAttribute("aria-label", "Protractor. Drag to move, drag the knob to turn, arrow keys turn it by a degree.");
    tool.innerHTML = protractor + `<span class="wb-tool__knob" title="Turn"></span><span class="wb-tool__deg"></span>`;
    scaler.appendChild(tool);

    /* the instrument's own geometry, read off its SVG: centre dot and size */
    const svg = tool.querySelector("svg");
    const vb = svg.viewBox.baseVal;
    const dot = svg.querySelector("circle[r='1']");
    const cx = (dot ? +dot.getAttribute("cx") : vb.width / 2) * MM;
    const cy = (dot ? +dot.getAttribute("cy") : vb.height - 6) * MM;
    tool.style.transformOrigin = `${cx}px ${cy}px`;

    /* start where the reader is looking: the top of the visible paper */
    const vr = viewport.getBoundingClientRect();
    const sr = scaler.getBoundingClientRect();
    const z = zoom();
    const st = {
      x: (vr.left - sr.left) / z + scaler.offsetWidth / 2,
      y: (Math.max(vr.top, 90) - sr.top) / z + 200,
      rot: 0,
    };
    const place = () => {
      tool.style.left = `${st.x - cx}px`;
      tool.style.top = `${st.y - cy}px`;
      tool.style.transform = `rotate(${st.rot}deg)`;
      const d = ((st.rot % 360) + 360) % 360;
      tool.querySelector(".wb-tool__deg").textContent = `${Math.round(d > 180 ? d - 360 : d)}°`;
    };
    place();

    let mode = null;
    let start = null;
    tool.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      tool.setPointerCapture(e.pointerId);
      tool.focus({ preventScroll: true });
      mode = e.target.classList.contains("wb-tool__knob") ? "turn" : "move";
      start = { px: e.clientX, py: e.clientY, x: st.x, y: st.y };
    });
    tool.addEventListener("pointermove", (e) => {
      if (!mode) return;
      const z2 = zoom();
      if (mode === "move") {
        st.x = start.x + (e.clientX - start.px) / z2;
        st.y = start.y + (e.clientY - start.py) / z2;
      } else {
        const s2 = scaler.getBoundingClientRect();
        const ax = s2.left + st.x * z2;
        const ay = s2.top + st.y * z2;
        /* the knob sits at the right-hand end of the flat edge: 0° */
        st.rot = (Math.atan2(e.clientY - ay, e.clientX - ax) * 180) / Math.PI;
      }
      place();
    });
    tool.addEventListener("pointerup", () => {
      if (mode === "move") {
        const snapPx = SNAP_MM * MM * 1.4;
        let best = null;
        let d = snapPx;
        corners().forEach(([x, y]) => {
          const e2 = Math.hypot(x - st.x, y - st.y);
          if (e2 < d) { d = e2; best = [x, y]; }
        });
        if (best) { st.x = best[0]; st.y = best[1]; place(); }
      }
      mode = null;
    });
    tool.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 5 : 1;
      if (e.key === "ArrowLeft") { st.rot -= step; place(); e.preventDefault(); }
      if (e.key === "ArrowRight") { st.rot += step; place(); e.preventDefault(); }
    });
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
    setFull(true);
    sheet.classList.add("wb-live");
    toggle.textContent = "Back to paper";
    toggle.classList.add("is-on");
    bar.hidden = false;
    store = load();
    items().forEach((node, i) => enliven(node, i));
    keyPages(true);
  }

  function leave() {
    live = false;
    setFull(false);
    sheet.classList.remove("wb-live");
    toggle.textContent = "Make interactive";
    toggle.classList.remove("is-on");
    bar.hidden = true;
    if (tool) toggleProtractor();
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
