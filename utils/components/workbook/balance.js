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

/* A piece may be turned round: a bag of −x, a weight of −3. It is the same
   piece with a minus badge on it, so "take 3 off both pans" and "that 3 is
   now a −3" are plainly the same block, told apart at a glance. */
/* A piece turned round is a different STATE of the same thing, so it is a
   different colour: the sky weight, the butter x bag and the leaf y bag all go
   rose when they are minus, and come back to their own colour when they are
   turned back. The shape, the letter and the number never change — it is the
   same block, owed rather than held. */
const MINUS_FILL = "#f2b7ae";
const BODY_FILLS = new Set(["#bfe3ff", "#fff3a8", "#c8f0c0"]);
const rosy = (g) => g.querySelectorAll("[fill]").forEach((el) => {
  if (BODY_FILLS.has((el.getAttribute("fill") || "").toLowerCase())) el.setAttribute("fill", MINUS_FILL);
});

const MINUS_BADGE =
  '<g class="ab-neg" pointer-events="none">' +
  '<circle cx="1.8" cy="1.6" r="2" fill="#c0453f" stroke="#2a2723" stroke-width="0.35"/>' +
  '<rect x="0.7" y="1.15" width="2.2" height="0.9" rx="0.45" fill="#fffdf8"/></g>';

/* the handle that turns a piece round, in its top right corner */
const flipHandle = (w) =>
  `<g class="ab-flip" data-flip="1" transform="translate(${(w - 1.6).toFixed(2)} 0)">` +
  '<circle cx="0" cy="1.6" r="2.1" fill="#fff3a8" stroke="#2a2723" stroke-width="0.35"/>' +
  '<rect x="-1.2" y="0.35" width="2.4" height="0.62" rx="0.31" fill="#2a2723"/>' +
  '<rect x="-0.31" y="-0.54" width="0.62" height="2.4" rx="0.31" fill="#2a2723"/>' +
  '<rect x="-1.2" y="2.25" width="2.4" height="0.62" rx="0.31" fill="#2a2723"/></g>';

/* The two weights a pan can hold, drawn exactly as balanceart.js draws them —
   a cube for 1 and a classroom weight for the rest. A piece BROKEN into ones,
   or ones JOINED back into a weight, is made here, on screen, after the paper
   was printed, so the drawing has to be made here too. */
const CUBE = 4.2;
const BLOCK_H = 8.4;
const blockW = (n) => 8 + String(n).length * 2.6;

const cubeArt = () =>
  `<rect x="0" y="0" width="${CUBE}" height="${CUBE}" rx="0.6" fill="#bfe3ff" stroke="#2a2723" stroke-width="0.35"/>` +
  `<rect x="0.6" y="0.6" width="${(CUBE - 1.2).toFixed(2)}" height="1" rx="0.5" fill="#fffdf8" opacity="0.75"/>`;

const blockArt = (n) => {
  const w = blockW(n);
  const h = BLOCK_H;
  return `<path d="M${(w * 0.36).toFixed(2)} 2v-1.1a0.9 0.9 0 0 1 0.9-0.9h${(w * 0.28).toFixed(2)}a0.9 0.9 0 0 1 0.9 0.9v1.1" fill="none" stroke="#2a2723" stroke-width="0.5" stroke-linejoin="round"/>` +
    `<path d="M1.6 2H${(w - 1.6).toFixed(2)}L${w.toFixed(2)} ${h}H0Z" fill="#bfe3ff" stroke="#2a2723" stroke-width="0.45" stroke-linejoin="round"/>` +
    `<path d="M2 2.7H${(w - 2).toFixed(2)}" stroke="#fffdf8" stroke-width="0.7" stroke-linecap="round" opacity="0.8"/>` +
    `<text x="${(w / 2).toFixed(2)}" y="${(h - 1.8).toFixed(2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.8" font-weight="700" fill="#2a2723">${n}</text>`;
};

/** A weight made on screen: one cube, or a block worth n. */
const madePiece = (n) => (n === 1
  ? { kind: "cube", letter: "x", v: 1, w: CUBE, h: CUBE, html: `<g class="ab-piece" data-kind="cube" data-v="1" data-w="${CUBE}" data-h="${CUBE}">${cubeArt()}</g>` }
  : { kind: "block", letter: "x", v: n, w: blockW(n), h: BLOCK_H, html: `<g class="ab-piece" data-kind="block" data-v="${n}" data-w="${blockW(n)}" data-h="${BLOCK_H}">${blockArt(n)}</g>` });

/* the handle that BREAKS a weight into ones, in its top left corner */
const breakHandle = () =>
  '<g class="ab-break" data-break="1" transform="translate(1.6 0)">' +
  '<circle cx="0" cy="1.6" r="2.1" fill="#dcefff" stroke="#2a2723" stroke-width="0.35"/>' +
  '<rect x="-1.3" y="0.35" width="1.1" height="1.1" rx="0.25" fill="#2a2723"/>' +
  '<rect x="0.2" y="0.35" width="1.1" height="1.1" rx="0.25" fill="#2a2723"/>' +
  '<rect x="-1.3" y="1.75" width="1.1" height="1.1" rx="0.25" fill="#2a2723"/>' +
  '<rect x="0.2" y="1.75" width="1.1" height="1.1" rx="0.25" fill="#2a2723"/></g>';

const MAX_TILT = 8;          // degrees: a scale that tips over is a toy, not a balance
const LEAVE_MM = 3;          // let go this far outside the drawing and the piece is gone

const num = (s) => String(s || "").split(",").map(Number);

/* Every scale that is live just now. Two scales in one question are two
   equations, and solving a pair means carrying what ONE of them works out
   onto the other — so a scale has to be able to see its neighbour. */
const LIVE = new Set();

/**
 * The weight of one bag, from the level equation the scale was printed with:
 * left = [bags, ybags, n]. A scale with a second letter on it cannot say (two
 * unknowns, one equation) — the question writes data-worth instead.
 */
export function bagWeight(left, right) {
  const [lb, , ln] = left.length > 2 ? left : [left[0], 0, left[1]];
  const [rb, , rn] = right.length > 2 ? right : [right[0], 0, right[1]];
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
  /* what each letter is worth: said by the question when there are two of
     them, worked out from the equation when there is only one */
  /* an empty attribute is NOT a worth of nothing: num("") gives [0], which
     would make every bag weigh nothing and no scale ever look level */
  const told = svg.dataset.worth ? num(svg.dataset.worth) : [];
  const x = told.length && Number.isFinite(told[0])
    ? told[0]
    : bagWeight(num(svg.dataset.left), num(svg.dataset.right));
  const worth = { x, y: told.length > 1 && Number.isFinite(told[1]) ? told[1] : x };

  /* the pieces the question was printed with, each by its number */
  const printed = [...svg.querySelectorAll(".ab-piece")].map((g, id) => ({
    id,
    side: g.closest(".ab-load")?.dataset.side || "L",
    kind: g.dataset.kind,
    letter: g.dataset.letter || "x",
    v: Number(g.dataset.v) || 1,
    w: Number(g.dataset.w),
    h: Number(g.dataset.h),
    html: g.outerHTML,
  }));
  const start = () => printed.map(({ id, side }) => ({ id, side, sign: 1 }));
  /* a state kept from before this piece knew about signs has none: it is a plus */
  let state = saved && Array.isArray(saved) ? saved.map((s) => ({ sign: 1, ...s })) : start();

  svg.dataset.balLive = "1";
  svg.style.overflow = "visible";

  const beam = svg.querySelector(".ab-beam");
  const groups = (cls, side) => svg.querySelector(`.${cls}[data-side="${side}"]`);

  function draw() {
    for (const side of ["L", "R"]) {
      const load = groups("ab-load", side);
      if (!load) continue;
      load.replaceChildren();
      const mine = state.filter((s) => s.side === side);
      const here = mine.map((s) => ({ ...printed[s.id], __sign: s.sign ?? 1 }));
      const at = layoutPan(here, side === "L" ? panL : panR, floor, flow, gap);
      here.forEach((p, j) => {
        const box = document.createElementNS(NS, "g");
        box.innerHTML = p.html;
        const g = box.firstElementChild;
        g.setAttribute("transform", `translate(${at[j][0].toFixed(2)} ${at[j][1].toFixed(2)})`);
        g.dataset.id = p.id;
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        const sign = here[j].__sign;
        const named = p.kind === "bag" ? `a ${p.letter} bag` : p.kind === "cube" ? "a cube, 1" : `a weight, ${p.v}`;
        /* rosy() first, then the badges: the ± handle is butter itself, and
           would be caught by the recolouring */
        if (sign < 0) { g.classList.add("is-minus"); rosy(g); g.insertAdjacentHTML("beforeend", MINUS_BADGE); }
        /* a cube is barely wider than the handle itself: on those, turning
           round is shift-click (or the − key), and the corner stays grabbable */
        if (p.w >= 7) g.insertAdjacentHTML("beforeend", flipHandle(p.w));
        /* and a weight worth more than 1 can be broken into that many ones */
        if (p.kind === "block" && Math.abs(p.v) > 1) g.insertAdjacentHTML("beforeend", breakHandle());
        g.setAttribute("aria-label", `${sign < 0 ? "Minus " : ""}${named} on the ${side === "L" ? "left" : "right"} pan`);
        load.appendChild(g);
      });
    }
    tip();
  }

  function weights() {
    const w = { L: 0, R: 0 };
    state.forEach((s) => {
      const p = printed[s.id];
      w[s.side] += (s.sign ?? 1) * (p.kind === "bag" ? (worth[p.letter] ?? x) : p.v);
    });
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
  /**
   * Break a weight into ones: a 5 becomes five 1s, on the same pan and the
   * same way round. Nothing is added or taken away, so the beam does not move
   * — which is the point: 5 and 1+1+1+1+1 are the same weight.
   */
  const breakUp = (id) => {
    const was = state.find((s) => s.id === id);
    if (!was) return;
    const p = printed[id];
    const many = Math.abs(p.v);
    if (p.kind === "bag" || many < 2) return;
    const made = [];
    for (let i = 0; i < many; i++) {
      const one = { ...madePiece(1), id: printed.length };
      printed.push(one);
      made.push({ id: one.id, side: was.side, sign: was.sign ?? 1 });
    }
    commit([...state.filter((s) => s.id !== id), ...made], `Broken into ${many} ones.`);
  };

  /**
   * Join one piece to its neighbour in the same pan:
   *   two weights        one weight worth both together (1 and 1 make 2)
   *   a piece and its opposite   nothing at all: they cancel
   * Bags of the same letter cancel the same way; two of the same bag stay two
   * bags, because 2x is not a thing to stand on a pan.
   */
  const join = (id, onto) => {
    const a = state.find((s) => s.id === id);
    const b = state.find((s) => s.id === onto);
    /* a piece let go on one in the OTHER pan is not a joining: it is a move,
       and the caller does that. Joining is between neighbours. */
    if (!a || !b || a.side !== b.side) return false;
    const pa = printed[a.id];
    const pb = printed[b.id];
    const sa = (a.sign ?? 1) * (pa.kind === "bag" ? 1 : pa.v);
    const sb = (b.sign ?? 1) * (pb.kind === "bag" ? 1 : pb.v);
    const rest = state.filter((s) => s.id !== id && s.id !== onto);
    if (pa.kind === "bag" || pb.kind === "bag") {
      if (pa.kind !== pb.kind || pa.letter !== pb.letter) {
        say("Only the same kind of thing goes together — a bag with the same bag, a weight with a weight.");
        draw();
        return true;
      }
      if (sa + sb !== 0) {
        say(`Two ${pa.letter} bags stay two bags — there is no one bag worth two of them.`);
        draw();
        return true;
      }
      commit(rest, `An ${pa.letter} bag and a minus ${pa.letter} bag cancel: nothing left.`);
      return true;
    }
    const total = sa + sb;
    if (total === 0) { commit(rest, `${Math.abs(sa)} and −${Math.abs(sa)} cancel: nothing left.`); return true; }
    const made = { ...madePiece(Math.abs(total)), id: printed.length };
    printed.push(made);
    commit([...rest, { id: made.id, side: a.side, sign: Math.sign(total) }],
      `Joined: that is ${total < 0 ? "−" : ""}${Math.abs(total)}.`);
    return true;
  };

  /** Turn a piece round: +3 becomes −3, an x bag becomes a minus x bag. */
  const flip = (id) => {
    const was = state.find((s) => s.id === id);
    if (!was) return;
    const p = printed[id];
    const now = -(was.sign ?? 1);
    commit(state.map((s) => (s.id === id ? { ...s, sign: now } : s)),
      `Turned round: that is ${now < 0 ? "now" : "back to"} ${now < 0 ? "−" : ""}${p.kind === "bag" ? p.letter : p.v}.`);
  };
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

  /* Every mount binds its own handlers and takes the last mount's away: they
     close over THIS pile of pieces, and an old one would be moving things that
     are no longer on the scale (leaving interactive mode and coming back keeps
     the same drawing, so the listeners must be replaced, not doubled). */
  svg.__wbBalOff?.();
  {
    const bound = [];
    const on = (name, fn) => { svg.addEventListener(name, fn); bound.push([name, fn]); };
    svg.__wbBalOff = () => { bound.forEach(([name, fn]) => svg.removeEventListener(name, fn)); svg.__wbBalOff = null; };
    on("pointerdown", (e) => {
      if (!svg.dataset.balLive) return;
      const g = e.target.closest?.(".ab-piece");
      if (!g) return;
      e.preventDefault();
      /* the pen draws on this same picture: a press on a piece is not a line */
      e.stopPropagation();
      const id = Number(g.dataset.id);
      /* the ± handle, or shift-click anywhere on it: the piece turns round */
      if (e.target.closest?.(".ab-flip") || e.shiftKey || e.altKey) { flip(id); return; }
      /* the other handle breaks a weight into ones */
      if (e.target.closest?.(".ab-break")) { breakUp(id); return; }
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
    on("pointermove", (e) => {
      if (!drag) return;
      const [x1, y1] = toSvg(e.clientX, e.clientY);
      if (!drag.moved) {
        if (Math.hypot(x1 - drag.sx, y1 - drag.sy) < 1.2) return;
        lift(drag);
      }
      drag.g.setAttribute("transform", `translate(${(x1 - drag.dx).toFixed(2)} ${(y1 - drag.dy).toFixed(2)})`);
      /* say where it will go: off the drawing, it is about to be taken away */
      /* over a bag on the other scale it is not leaving, it is arriving */
      const over = [...LIVE].some((o) => o !== svg.__wbBalApi && o.holds(e.clientX, e.clientY));
      drag.g.classList.toggle("is-leaving", !over && outside(e.clientX, e.clientY));
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
      /* Let go over ANOTHER scale. Nothing is ever lost there: either it is a
         swap — substitution — or the piece goes straight back where it was.

         Both ways round work, because both are the same thought:
           · carry what a solved scale weighs onto a bag over there, or
           · carry a bag over to the scale that has worked that letter out. */
      const mine = svg.__wbBalApi;
      const onOther = [...LIVE].find((o) => o !== mine && o.holds(e.clientX, e.clientY));
      if (onOther) {
        const worked = mine?.solved();
        const bag = onOther.bagAt(e.clientX, e.clientY);
        const carried = printed[d.id];
        const theirs = onOther.solved();
        if (worked && bag && bag.letter === worked.letter) {
          onOther.swapBag(bag.id, worked.pieces, mine.name());
        } else if (carried.kind === "bag" && theirs && theirs.letter === carried.letter) {
          /* a bag taken to the scale that knows it: it is swapped HERE */
          const me = state.find((q) => q.id === d.id);
          swapBag(d.id, theirs.pieces, onOther.name(), me?.sign ?? 1);
          return;
        } else if (worked && bag) {
          say(`That is a ${bag.letter} bag, and this scale says what ${worked.letter} is worth.`);
        } else if (carried.kind === "bag") {
          say(`That scale has not worked out what ${carried.letter} is worth yet.`);
        } else {
          say("Let a weight go on a bag over there to swap it — once this scale has a bag on its own.");
        }
        draw();
        return;
      }
      if (outside(e.clientX, e.clientY)) { remove(d.id); return; }
      /* let go ON a neighbour in the same pan: they go together (or cancel) */
      const neighbour = mine?.pieceAt(e.clientX, e.clientY, d.id);
      if (neighbour !== null && neighbour !== undefined && join(d.id, neighbour)) return;
      const [x1] = toSvg(e.clientX, e.clientY);
      moveTo(d.id, x1 < px ? "L" : "R");
    };
    on("pointerup", drop);
    on("pointercancel", () => {
      if (drag?.moved) { drag.g.remove(); draw(); }
      drag = null;
    });
    on("dblclick", (e) => {
      if (!svg.dataset.balLive) return;
      const g = e.target.closest?.(".ab-piece");
      if (g && g.dataset.id !== undefined) { e.preventDefault(); remove(Number(g.dataset.id)); }
    });
    on("keydown", (e) => {
      if (!svg.dataset.balLive) return;
      const g = e.target.closest?.(".ab-piece");
      if (!g || g.dataset.id === undefined) return;
      const id = Number(g.dataset.id);
      if (e.key === "-" || e.key === "+" || e.key === "s") { e.preventDefault(); flip(id); }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(id); }
      if (e.key === "ArrowLeft") { e.preventDefault(); moveTo(id, "L"); }
      if (e.key === "ArrowRight") { e.preventDefault(); moveTo(id, "R"); }
    });
  }

  /* ── one scale to another: substitution ───────────────────────────────
     A scale is SOLVED for a letter when one pan holds that one bag and
     nothing else; what the other pan holds is then what the bag is worth. A
     bag of that letter on ANOTHER scale may be swapped for it — which is
     what substitution is, done with the hands. */
  const solved = () => {
    for (const side of ["L", "R"]) {
      const mineHere = state.filter((s) => s.side === side);
      const here = mineHere.map((s) => printed[s.id]);
      const there = state.filter((s) => s.side !== side).map((s) => ({ ...printed[s.id], sign: s.sign ?? 1 }));
      /* a MINUS bag alone says what −x is, which is not what we are after */
      if (here.length !== 1 || here[0].kind !== "bag" || (mineHere[0].sign ?? 1) !== 1) continue;
      const letter = here[0].letter;
      /* what the other pan holds is what the bag is worth — weights, or
         another letter's bag and some weights, which is just as good to
         carry across ("y is worth an x and 2") */
      if (!there.length || there.some((p) => p.kind === "bag" && p.letter === letter)) continue;
      return { letter, pieces: there };
    }
    return null;
  };

  /** The bag under a point, if this scale has one there. */
  /** Is this point on this scale's drawing at all? */
  const holds = (cx, cy) => {
    const r = svg.getBoundingClientRect();
    return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  };

  /** Any piece under a point, other than the one being carried. */
  const pieceAt = (cx, cy, not = null) => {
    if (!holds(cx, cy)) return null;
    for (const g of svg.querySelectorAll(".ab-piece")) {
      if (g.dataset.id === undefined) continue;
      const id = Number(g.dataset.id);
      if (id === not) continue;
      const b = g.getBoundingClientRect();
      if (cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom) return id;
    }
    return null;
  };

  const bagAt = (cx, cy) => {
    if (!holds(cx, cy)) return null;
    for (const g of svg.querySelectorAll(".ab-piece")) {
      if (g.dataset.id === undefined) continue;
      const b = g.getBoundingClientRect();
      if (cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom) {
        const p = printed[Number(g.dataset.id)];
        if (p?.kind === "bag") return { id: Number(g.dataset.id), letter: p.letter };
      }
    }
    return null;
  };

  /** Swap a bag for what the other scale says it is worth: its very pieces. */
  const swapBag = (id, pieces, from, sign = null) => {
    const was = state.find((s) => s.id === id);
    if (!was) return false;
    const bag = printed[id];
    /* a minus bag is swapped for minus what it is worth */
    const turn = (sign ?? was.sign ?? 1);
    const made = pieces.map((p) => {
      const copy = { ...p, id: printed.length };
      printed.push(copy);
      return { id: copy.id, side: was.side, sign: turn * (p.sign ?? 1) };
    });
    /* "an x bag", but "a y bag": the letter is read aloud, not spelled */
    const worthWords = pieces.map((p) => (p.kind === "bag" ? `${"aefhilmnorsx".includes(p.letter) ? "an" : "a"} ${p.letter} bag` : String(p.v))).join(" and ");
    commit([...state.filter((s) => s.id !== id), ...made],
      `The ${bag.letter} bag swapped for ${worthWords} — what ${from} says it is worth.`);
    return true;
  };

  const api = {
    solved,
    bagAt,
    pieceAt,
    holds,
    swapBag,
    name: () => svg.dataset.name || "the other scale",
    set(next) { state = next.map((s) => ({ ...s })); draw(); return state.map((s) => ({ ...s })); },
    reset() { state = start(); draw(); },
    dispose() {
      svg.__wbBalOff?.();
      LIVE.delete(api);
      svg.__wbBalApi = null;
      svg.innerHTML = svg.__wbBalOrig;
      svg.removeAttribute("data-bal-live");
      svg.removeAttribute("data-level");
      svg.removeAttribute("data-tip");
      svg.style.overflow = "";
    },
  };

  svg.__wbBalApi = api;
  LIVE.add(api);
  draw();
  return api;
}
