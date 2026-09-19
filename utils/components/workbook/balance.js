/* ============================================================================
   PRINTABLE WORKBOOK — a balance scale you can take things off, on screen
   ----------------------------------------------------------------------------
   On paper the balance scale is a picture: "take 3 off both pans" is something
   a child does in their head, or crosses out. On screen they can DO it. Every
   bag, cube and weight on a pan can be

     dragged to the other pan           it lands on whichever pan it is let go over
     dragged off the scale              it is taken away
     double-clicked (or Delete)         taken away
     moved with ← and →                 to the pan on that side

   and the beam answers: level while the two pans weigh the same, tipping
   towards the heavier pan as soon as they do not. That is the lesson the
   chapter is built on — the only move that keeps it level is the SAME move on
   both sides — and here a wrong move shows itself.

   What a bag weighs is never printed (a bag is not drawn to its weight — see
   balanceart.js). It is worked out from the equation the drawing says it
   is: the printed scale is level, so left.bags·x + left.n = right.bags·x + right.n.

   The drawing tells this file everything it needs (balanceart.js writes it):

     svg[data-balance="panL,panR,floor,flow,gap"]  where the pans are
     svg[data-pivot="x,y"]                          where the beam turns
     g.ab-beam, g.ab-pan[data-side], g.ab-load[data-side]
     g.ab-piece[data-kind][data-v][data-w][data-h]  each thing on a pan

   so the engine never reaches into the Algebra Workbook's own modules. Undo,
   Clear and keeping the work are the interactive layer's, as for every other
   thing that moves on the paper.
   ========================================================================== */

const MAX_TILT = 8;          // degrees: a scale that tips over is a toy, not a balance
const LEAVE_MM = 3;          // let go this far outside the drawing and the piece is gone

const num = (s) => String(s || "").split(",").map(Number);

/** The weight of one bag, from the level equation the scale was printed with. */
export function bagWeight(left, right) {
  const [lb, ln] = left;
  const [rb, rn] = right;
  if (lb === rb) return 1;                  // bags that cancel: any weight keeps it level
  const x = (rn - ln) / (lb - rb);
  return Number.isFinite(x) && x > 0 ? x : 1;
}

/** How far the beam turns, clockwise (right pan down), for these two loads. */
export function tiltOf(wl, wr) {
  const d = wr - wl;
  if (Math.abs(d) < 1e-9) return 0;
  const most = Math.max(wl, wr, 1);
  return Math.sign(d) * Math.min(MAX_TILT, 2.5 + (5.5 * Math.abs(d)) / most);
}

/** Pieces laid out on a pan as balanceart.js lays them: rows from the floor
    up, side by side while there is room. Returns [x, y] (top-left) for each. */
export function layoutPan(list, cx, floor, flow, gap) {
  const rows = [];
  let row = null;
  for (const it of list) {
    if (!row || row.w + gap + it.w > flow) {
      row = { items: [], w: -gap, h: 0 };
      rows.push(row);
    }
    row.w += gap + it.w;
    row.h = Math.max(row.h, it.h);
    row.items.push(it);
  }
  const at = [];
  let y = floor;
  for (const r of rows) {
    let x = cx - r.w / 2;
    for (const it of r.items) {
      at.push([x, y - it.h]);
      x += it.w + gap;
    }
    y -= r.h + gap;
  }
  return at;
}

const NS = "http://www.w3.org/2000/svg";

/**
 *   mountBalance(svg, { saved, onMove, say })
 *     saved     a state from before ([{ id, side }], in pan order), or null
 *     onMove(state, before)   after every move — before is the state to undo to
 *     say(text)               a word about what just happened
 *   → { set(state), reset(), dispose() }
 */
export function mountBalance(svg, { saved = null, onMove = () => {}, say = () => {} } = {}) {
  if (!svg.__wbBalOrig) svg.__wbBalOrig = svg.innerHTML;
  const [panL, panR, floor, flow, gap] = num(svg.dataset.balance);
  const [px, py] = num(svg.dataset.pivot);
  const x = bagWeight(num(svg.dataset.left), num(svg.dataset.right));

  /* the pieces the question was printed with, each by its number */
  const printed = [...svg.querySelectorAll(".ab-piece")].map((g, id) => ({
    id,
    side: g.closest(".ab-load")?.dataset.side || "L",
    kind: g.dataset.kind,
    v: Number(g.dataset.v) || 1,
    w: Number(g.dataset.w),
    h: Number(g.dataset.h),
    html: g.outerHTML,
  }));
  const start = () => printed.map(({ id, side }) => ({ id, side }));
  let state = saved && Array.isArray(saved) ? saved.map((s) => ({ ...s })) : start();

  svg.dataset.balLive = "1";
  svg.style.overflow = "visible";
  svg.setAttribute("data-tip", "Drag a piece to the other pan, or off the scale to take it away");

  const beam = svg.querySelector(".ab-beam");
  const groups = (cls, side) => svg.querySelector(`.${cls}[data-side="${side}"]`);

  function draw() {
    for (const side of ["L", "R"]) {
      const load = groups("ab-load", side);
      if (!load) continue;
      load.replaceChildren();
      const here = state.filter((s) => s.side === side).map((s) => printed[s.id]);
      const at = layoutPan(here, side === "L" ? panL : panR, floor, flow, gap);
      here.forEach((p, j) => {
        const box = document.createElementNS(NS, "g");
        box.innerHTML = p.html;
        const g = box.firstElementChild;
        g.setAttribute("transform", `translate(${at[j][0].toFixed(2)} ${at[j][1].toFixed(2)})`);
        g.dataset.id = p.id;
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `${p.kind === "bag" ? "A bag" : p.kind === "cube" ? "A cube, 1" : `A weight, ${p.v}`} on the ${side === "L" ? "left" : "right"} pan`);
        load.appendChild(g);
      });
    }
    tip();
  }

  function weights() {
    const w = { L: 0, R: 0 };
    state.forEach((s) => { const p = printed[s.id]; w[s.side] += p.kind === "bag" ? x : p.v; });
    return w;
  }

  function tip() {
    const w = weights();
    const a = tiltOf(w.L, w.R);
    const t = (a * Math.PI) / 180;
    const ease = "transform 0.55s cubic-bezier(.3,1.4,.5,1)";
    if (beam) {
      Object.assign(beam.style, { transformBox: "view-box", transformOrigin: `${px}px ${py}px`, transform: `rotate(${a}deg)`, transition: ease });
    }
    /* each pan hangs from its end of the beam, so it goes up or down with it
       and stays upright; what is on it goes with it */
    for (const [side, cx] of [["L", panL], ["R", panR]]) {
      const dx = cx - px;
      const move = `translate(${(dx * Math.cos(t) - dx).toFixed(2)}px, ${(dx * Math.sin(t)).toFixed(2)}px)`;
      for (const cls of ["ab-pan", "ab-load"]) {
        const g = groups(cls, side);
        if (g) Object.assign(g.style, { transformBox: "view-box", transform: move, transition: ease });
      }
    }
    svg.dataset.level = a === 0 ? "1" : "0";
  }

  function commit(next, words) {
    const before = state.map((s) => ({ ...s }));
    state = next;
    draw();
    const w = weights();
    say(`${words} ${Math.abs(w.L - w.R) < 1e-9 ? "Still level." : "Not level any more."}`);
    onMove(state.map((s) => ({ ...s })), before);
  }

  const remove = (id) => commit(state.filter((s) => s.id !== id), "Taken off.");
  const moveTo = (id, side) => {
    const was = state.find((s) => s.id === id);
    if (!was) return;
    commit([...state.filter((s) => s.id !== id), { id, side }], was.side === side ? "Moved." : "Moved to the other pan.");
  };

  /* ── dragging ─────────────────────────────────────────────────────────── */
  const toSvg = (cx, cy) => {
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return [p.x, p.y];
  };
  let drag = null;

  if (!svg.__wbBalBound) {
    svg.__wbBalBound = true;
    svg.addEventListener("pointerdown", (e) => {
      if (!svg.dataset.balLive) return;
      const g = e.target.closest?.(".ab-piece");
      if (!g) return;
      e.preventDefault();
      /* the pen draws on this same picture: a press on a piece is not a line */
      e.stopPropagation();
      const id = Number(g.dataset.id);
      const [sx, sy] = toSvg(e.clientX, e.clientY);
      drag = { g, id, moved: false, sx, sy, pointer: e.pointerId };
    });
    /* A press is not yet a carry: the piece is only lifted once the pointer
       has really moved. Lifting it at once took it out from under the second
       click of a double-click, and the browser then sends no double-click. */
    const lift = (d) => {
      const g = d.g;
      /* out of its pan into the top of the drawing, so it is not tipped with
         the pan while it is carried, and is drawn over everything */
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.getAttribute("transform")) || [0, 0, 0];
      const load = g.closest(".ab-load");
      const t = load ? getComputedStyle(load).transform : "none";
      const shift = t && t !== "none" ? new DOMMatrix(t) : new DOMMatrix();
      const x0 = Number(m[1]) + shift.e;
      const y0 = Number(m[2]) + shift.f;
      svg.appendChild(g);
      g.classList.add("is-carried");
      g.setAttribute("transform", `translate(${x0} ${y0})`);
      d.dx = d.sx - x0;
      d.dy = d.sy - y0;
      d.moved = true;
      svg.setPointerCapture?.(d.pointer);
    };
    svg.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const [x1, y1] = toSvg(e.clientX, e.clientY);
      if (!drag.moved) {
        if (Math.hypot(x1 - drag.sx, y1 - drag.sy) < 1.2) return;
        lift(drag);
      }
      drag.g.setAttribute("transform", `translate(${(x1 - drag.dx).toFixed(2)} ${(y1 - drag.dy).toFixed(2)})`);
      /* say where it will go: off the drawing, it is about to be taken away */
      drag.g.classList.toggle("is-leaving", outside(e.clientX, e.clientY));
    });
    const outside = (cx, cy) => {
      const r = svg.getBoundingClientRect();
      const mm = r.width / (svg.viewBox.baseVal.width || r.width);
      const pad = LEAVE_MM * mm;
      return cx < r.left - pad || cx > r.right + pad || cy < r.top - pad || cy > r.bottom + pad;
    };
    const drop = (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.moved) return;               // a press, or half of a double-click
      svg.releasePointerCapture?.(e.pointerId);
      d.g.remove();
      if (outside(e.clientX, e.clientY)) { remove(d.id); return; }
      const [x1] = toSvg(e.clientX, e.clientY);
      moveTo(d.id, x1 < px ? "L" : "R");
    };
    svg.addEventListener("pointerup", drop);
    svg.addEventListener("pointercancel", () => {
      if (drag?.moved) { drag.g.remove(); draw(); }
      drag = null;
    });
    svg.addEventListener("dblclick", (e) => {
      if (!svg.dataset.balLive) return;
      const g = e.target.closest?.(".ab-piece");
      if (g && g.dataset.id !== undefined) { e.preventDefault(); remove(Number(g.dataset.id)); }
    });
    svg.addEventListener("keydown", (e) => {
      if (!svg.dataset.balLive) return;
      const g = e.target.closest?.(".ab-piece");
      if (!g || g.dataset.id === undefined) return;
      const id = Number(g.dataset.id);
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(id); }
      if (e.key === "ArrowLeft") { e.preventDefault(); moveTo(id, "L"); }
      if (e.key === "ArrowRight") { e.preventDefault(); moveTo(id, "R"); }
    });
  }

  draw();

  return {
    set(next) { state = next.map((s) => ({ ...s })); draw(); return state.map((s) => ({ ...s })); },
    reset() { state = start(); draw(); },
    dispose() {
      svg.innerHTML = svg.__wbBalOrig;
      svg.removeAttribute("data-bal-live");
      svg.removeAttribute("data-level");
      svg.removeAttribute("data-tip");
      svg.style.overflow = "";
    },
  };
}
