/* ============================================================================
   PRINTABLE WORKBOOK — the COUNTING GRID for dividing by one digit
   ----------------------------------------------------------------------------
   A place-value chart with two rows, worked with the same counters as the mat
   (counters.js: a hundred, a ten and a one).

     THE NUMBER     the top row. The child takes the counters that make the
                    number being divided — 4 hundreds, 7 tens and 2 ones for
                    472 — and each lands in its own column.
     SHARED INTO d  the bottom row. Each column is cut into as many groups as
                    the divisor, and the counters above are shared out among
                    them. What cannot be shared stays in the top row.

   A counter that cannot be shared is BROKEN into ten of the next place: one
   hundred becomes ten tens, one ten becomes ten ones, and they stand in the
   next column's top row with what was already there. What is left in the ONES'
   top row when the sharing is done is the remainder.

   WHAT THE CHILD DOES:
     take        tap a counter in the tray, or drag it onto the grid
     share       drag a counter down into a group; or tap a group and one is
                 dealt into it; or press "one each" for a whole round
     break       drag a counter into the next column's top row, or press
                 "break 1": it becomes ten of the next place
     take back   drag a counter from a group back up to the top row
     put away    drag a counter off the grid
     undo        the page's own Undo and Clear buttons stand in the grid's corner
                 (interactive.js `drawbar`): Undo takes back one move, Clear
                 empties the grid

   IT IS NEVER MARKED. It is working: what the child reads off it is written
   in the input grid beside it, and that is what is marked. The grid itself is
   saved, so a page picked up again is the grid the child left.

   THE STATE is counts, not pieces — the counters in one cell are all alike:
     { top: [h, t, u], groups: [[…d], […d], […d]] }
   ========================================================================== */

const FILL = { 100: "#8fd39a", 10: "#6fb7e8", 1: "#f4c95d" };
const EDGE = { 100: "#3f8f4f", 10: "#2a6ca8", 1: "#c9922f" };
const PLACES = [{ v: 100, name: "Hundreds" }, { v: 10, name: "Tens" }, { v: 1, name: "Ones" }];

/* the divisor in words: a figure in a label is typeset as a sum, and pulls the label apart */
const WORDS = ["", "", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

/** the places a number of k figures has, biggest first */
export const placesFor = (k) => PLACES.slice(3 - Math.max(1, Math.min(3, k)));

/** One counter, drawn: the face is what it is worth. */
function disc(v) {
  const size = v === 100 ? 9 : v === 10 ? 11 : 13;
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="${FILL[v]}" stroke="${EDGE[v]}" stroke-width="2"/>`
    + `<text x="16" y="16" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace" font-size="${size}" font-weight="700" fill="#14130f">${v}</text></svg>`;
}

/**
 * The counting grid, for the paper. On screen mountDivMat takes it over;
 * printed, it is the chart and a key of the counters to draw in it.
 *
 *   n   the number being divided (two or three figures)
 *   d   the divisor (one figure): how many groups each column is cut into
 */
export function divMat({ n, d }) {
  const places = placesFor(String(n).length);
  const across = d <= 3 ? d : d === 4 ? 2 : Math.ceil(d / 2);
  /* an odd number of groups in two rows leaves a gap at the end: the last group is made wide, so no
     empty space looks like one more group */
  const odd = d > 3 && d % 2 === 1;
  return `<div class="dm-wrap" data-divmat data-d="${d}" data-k="${places.length}">`
    + `<div class="dm-tray">`
    + places.map((p) => `<button type="button" class="dm-take pp-plain" data-take="${p.v}" aria-label="Take a ${p.v}">${disc(p.v)}</button>`).join("")
    + `<span class="dm-tray__say">Take the counters that make ${n}. Share them into ${d} groups.</span>`
    + `</div>`
    + `<div class="dm-grid" style="--dm-cols:${places.length}">`
    + `<span class="dm-corner"></span>`
    + places.map((p) => `<span class="dm-head" data-kind="${p.v}">${p.name}</span>`).join("")
    + `<span class="dm-rowname">The number</span>`
    + places.map((p, c) => `<div class="dm-top" data-col="${c}"></div>`).join("")
    + `<span class="dm-rowname">Shared into ${WORDS[d] || d} groups</span>`
    + places.map((p, c) => `<div class="dm-share" data-col="${c}" style="--dm-across:${across}">`
      + Array.from({ length: d }, (_, g) => `<div class="dm-group" data-col="${c}" data-g="${g}"${odd && g === d - 1 ? ' style="grid-column:span 2"' : ""}></div>`).join("") + `</div>`).join("")
    + `</div>`
    + `<p class="dm-read" data-read></p>`
    + `</div>`;
}

/**
 * Bring a printed counting grid to life.
 *
 *   saved     the grid from last time: { top, groups }
 *   onChange  (now, before) → for the page to save and to undo
 */
export function mountDivMat(wrap, { saved = null, onChange = null } = {}) {
  const d = Number(wrap.dataset.d) || 2;
  const k = Number(wrap.dataset.k) || 2;
  const places = placesFor(k);
  const grid = wrap.querySelector(".dm-grid");
  const read = wrap.querySelector("[data-read]");
  const empty = () => ({ top: Array(k).fill(0), groups: Array.from({ length: k }, () => Array(d).fill(0)) });
  const clean = (s) => {
    const out = empty();
    if (!s || !Array.isArray(s.top)) return out;
    for (let c = 0; c < k; c++) {
      out.top[c] = Math.max(0, Math.min(120, Number(s.top[c]) || 0));
      for (let g = 0; g < d; g++) out.groups[c][g] = Math.max(0, Math.min(60, Number(s.groups?.[c]?.[g]) || 0));
    }
    return out;
  };
  let state = clean(saved);
  const snapshot = () => ({ top: [...state.top], groups: state.groups.map((g) => [...g]) });
  const tell = (before) => { if (onChange) onChange(snapshot(), before); };
  const act = (fn) => { const before = snapshot(); if (fn() === false) return; draw(); tell(before); };

  /* the buttons of each column: made here, so the paper has none */
  const tools = document.createElement("div");
  tools.className = "dm-tools";
  tools.style.setProperty("--dm-cols", String(k));
  tools.innerHTML = `<span></span>` + places.map((p, c) => `<span class="dm-toolcell">`
    + `<button type="button" class="dm-btn" data-deal="${c}">one each</button>`
    + (c < k - 1 ? `<button type="button" class="dm-btn" data-break="${c}" title="Break one into ten ${places[c + 1].v}s">break 1</button>` : "")
    + `</span>`).join("");
  grid.after(tools);

  const many = (n, html) => Array.from({ length: n }, () => html).join("");
  function draw() {
    for (let c = 0; c < k; c++) {
      const top = grid.querySelector(`.dm-top[data-col="${c}"]`);
      const n = state.top[c];
      top.dataset.size = n > 30 ? "s" : n > 12 ? "m" : "l";
      top.innerHTML = many(n, `<span class="dm-disc" data-from="top" data-col="${c}">${disc(places[c].v)}</span>`);
      for (let g = 0; g < d; g++) {
        grid.querySelector(`.dm-group[data-col="${c}"][data-g="${g}"]`).innerHTML =
          many(state.groups[c][g], `<span class="dm-disc" data-from="group" data-col="${c}" data-g="${g}">${disc(places[c].v)}</span>`);
      }
      const deal = tools.querySelector(`[data-deal="${c}"]`); if (deal) deal.disabled = n < d;
      const brk = tools.querySelector(`[data-break="${c}"]`); if (brk) brk.disabled = n < 1;
    }
    read.textContent = say();
  }

  /* what the grid is showing, a column at a time, in a child's words */
  function say() {
    const bits = [];
    for (let c = 0; c < k; c++) {
      const g = state.groups[c], left = state.top[c];
      const any = g.some((x) => x > 0);
      if (!any && !left) continue;
      const even = g.every((x) => x === g[0]);
      const name = places[c].name.toLowerCase();
      if (!any) bits.push(`${left} ${left === 1 ? name.slice(0, -1) : name} to share`);
      else if (!even) bits.push(`${name}: the groups are not equal yet`);
      else bits.push(`${name}: ${g[0]} in each group${left ? `, ${left} left over` : ""}`);
    }
    return bits.join("  ·  ");
  }

  const moves = {
    take: (c) => { state.top[c] += 1; },
    share: (c, g) => { if (state.top[c] < 1) return false; state.top[c] -= 1; state.groups[c][g] += 1; return true; },
    back: (c, g) => { if (state.groups[c][g] < 1) return false; state.groups[c][g] -= 1; state.top[c] += 1; return true; },
    across: (c, g, g2) => { if (state.groups[c][g] < 1 || g === g2) return false; state.groups[c][g] -= 1; state.groups[c][g2] += 1; return true; },
    round: (c) => { if (state.top[c] < d) return false; state.top[c] -= d; for (let g = 0; g < d; g++) state.groups[c][g] += 1; return true; },
    /* one counter becomes ten of the next place */
    smash: (c) => { if (c >= k - 1 || state.top[c] < 1) return false; state.top[c] -= 1; state.top[c + 1] += 10; return true; },
    away: (c) => { if (state.top[c] < 1) return false; state.top[c] -= 1; return true; },
  };

  tools.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.deal != null) act(() => moves.round(Number(b.dataset.deal)));
    else if (b.dataset.break != null) act(() => moves.smash(Number(b.dataset.break)));
  });

  /* ── taking, sharing, breaking: one drag, wherever it starts ──────────────*/
  let drag = null;
  const colOfKind = (v) => places.findIndex((p) => p.v === v);

  const down = (e) => {
    const take = e.target.closest(".dm-take");
    const piece = e.target.closest(".dm-disc");
    const group = e.target.closest(".dm-group");
    if (!take && !piece && !group) return;
    const src = take ? { from: "tray", col: colOfKind(Number(take.dataset.take)) }
      : piece ? { from: piece.dataset.from, col: Number(piece.dataset.col), g: Number(piece.dataset.g) }
        : { from: "cell", col: Number(group.dataset.col), g: Number(group.dataset.g) };
    drag = { src, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, v: places[src.col]?.v };
    if (src.from !== "cell") e.preventDefault();
  };
  const move = (e) => {
    if (!drag || drag.src.from === "cell") return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return;
    drag.moved = true;
    if (!drag.ghost) {
      drag.ghost = document.createElement("span");
      drag.ghost.className = "dm-ghost";
      drag.ghost.innerHTML = disc(drag.v);
      document.body.appendChild(drag.ghost);
    }
    drag.ghost.style.left = `${e.clientX}px`;
    drag.ghost.style.top = `${e.clientY}px`;
  };
  const up = (e) => {
    if (!drag) return;
    const { src, moved, ghost } = drag;
    drag = null;
    ghost?.remove();
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const onGroup = under?.closest?.(".dm-group");
    const onTop = under?.closest?.(".dm-top");
    const inside = !!under?.closest?.(".dm-wrap") && under.closest(".dm-wrap") === wrap;
    const tg = onGroup && wrap.contains(onGroup) ? { col: Number(onGroup.dataset.col), g: Number(onGroup.dataset.g) } : null;
    const tt = onTop && wrap.contains(onTop) ? Number(onTop.dataset.col) : null;

    if (src.from === "tray") {
      /* tapped, or dropped anywhere on the grid: it stands in its own column */
      if (!moved || inside) act(() => moves.take(src.col));
      return;
    }
    if (!moved) {
      /* a tap on a group — on the space or on a counter in it — deals one into it */
      if (src.from === "cell" || src.from === "group") act(() => moves.share(src.col, src.g));
      return;
    }
    if (src.from === "top") {
      if (tg && tg.col === src.col) act(() => moves.share(src.col, tg.g));
      else if (tt === src.col + 1 || (tg && tg.col === src.col + 1)) act(() => moves.smash(src.col));
      else if (!inside) act(() => moves.away(src.col));
      return;
    }
    if (src.from === "group") {
      if (tg && tg.col === src.col) act(() => moves.across(src.col, src.g, tg.g));
      else act(() => moves.back(src.col, src.g));
    }
  };
  wrap.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);

  draw();

  return {
    get state() { return snapshot(); },
    set(s) { state = clean(s); draw(); },
    clear() { state = empty(); draw(); },
    dispose() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      wrap.removeEventListener("pointerdown", down);
      tools.remove();
      wrap.querySelectorAll(".dm-top, .dm-group").forEach((el) => { el.innerHTML = ""; });
      read.textContent = "";
    },
  };
}
