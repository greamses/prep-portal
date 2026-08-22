/* ═══════════════════════════════════════════════════════════════════════════
   A CARD

   One problem, and the working under it. Every move writes a NEW line rather
   than replacing the one above, so the card grows downward and the whole
   derivation stays on the paper — which is the thing a single-equation stage
   could never show and the reason the canvas was worth building.

   Rows are lined up on their equals signs, the way working is lined up by hand.
   Only the last row is live; the ones above it are what you already did.
   ═══════════════════════════════════════════════════════════════════════════ */

import { buildRow, paintRow, flipInto } from "./render.js";
import { plain } from "./layout.js";
import { offers } from "./ops.js";
import { preservesSolutions } from "./verify.js";
import { isSolved } from "./solve.js";

const SIZE = 34;
const ROW_GAP = 10;
const PAD = 18;
const NOTE_GAP = 12;   // matches .am-work__why margin-left

let seq = 0;

export function createCard(eq, { x, y, onPick, onChange, onRemove }) {
  const id = `card${++seq}`;
  const rows = [];        // { row, offset, note }
  let picked = null;
  let stack = [];         // the equations, for stepping back

  const el = document.createElement("div");
  el.className = "am-card";
  el.dataset.card = id;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  const grip = document.createElement("div");
  grip.className = "am-card__grip";
  grip.innerHTML = `<span class="am-card__dots" aria-hidden="true"></span>`;

  const tools = document.createElement("div");
  tools.className = "am-card__tools";
  tools.innerHTML = `
    <button type="button" class="am-card__btn" data-act="back" title="Step back" aria-label="Step back">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1"
           stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>
    </button>
    <button type="button" class="am-card__btn" data-act="close" title="Take it off the canvas" aria-label="Take it off the canvas">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1"
           stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>`;
  grip.appendChild(tools);

  const sheet = document.createElement("div");
  sheet.className = "am-card__sheet";

  const flag = document.createElement("div");
  flag.className = "am-card__done";
  flag.hidden = true;

  el.append(grip, sheet, flag);

  /* ── Laying the rows out ─────────────────────────────────────────────────
     Every row is nudged right so all the equals signs sit on one line. */
  function relayout() {
    const gutter = Math.max(...rows.map((r) => r.row.eqX));
    let top = 0;
    for (const entry of rows) {
      entry.offset = { x: gutter - entry.row.eqX, y: top };
      top += entry.row.h + ROW_GAP;
    }
    for (const entry of rows) {
      if (!entry.el) continue;
      entry.el.style.left = `${PAD + entry.offset.x}px`;
      entry.el.style.top = `${PAD + entry.offset.y}px`;
    }

    // The reason sits in a margin to the right of its line, so the paper has to
    // be wide enough to hold it — otherwise it writes itself onto the canvas.
    let width = 0;
    for (const entry of rows) {
      const note = entry.el?.querySelector(".am-work__why");
      const margin = note ? NOTE_GAP + note.offsetWidth : 0;
      width = Math.max(width, entry.offset.x + entry.row.w + margin);
    }

    sheet.style.width = `${width + PAD * 2}px`;
    sheet.style.height = `${Math.max(0, top - ROW_GAP) + PAD * 2}px`;
  }

  function paint(entry, live) {
    const svg = paintRow(entry.row, { live, picked: live ? picked : null });
    const holder = document.createElement("div");
    holder.className = `am-work${live ? " is-live" : ""}`;
    holder.appendChild(svg);
    if (entry.note) {
      const why = document.createElement("i");
      why.className = "am-work__why";
      why.textContent = entry.note;
      holder.appendChild(why);
    }
    entry.el = holder;
    entry.svg = svg;
    return holder;
  }

  /** Redraw only the last row — the only one whose selection can change. */
  function repaintLive() {
    const last = rows[rows.length - 1];
    if (!last || !last.el) return;
    const fresh = paint(last, true);
    sheet.replaceChild(fresh, sheet.lastElementChild);
    relayout();
  }

  function push(nextEq, { from = new Map(), note = "", animate = true } = {}) {
    const prev = rows[rows.length - 1];
    if (prev && prev.el) {
      // The row above stops being live the moment a new one lands under it.
      const stale = paint(prev, false);
      sheet.replaceChild(stale, sheet.lastElementChild);
    }

    const entry = { row: buildRow(nextEq, SIZE), note };
    rows.push(entry);
    stack.push(nextEq);

    const holder = paint(entry, true);
    sheet.appendChild(holder);
    relayout();

    if (animate && prev) {
      flipInto({
        prevRow: prev.row, prevOffset: { x: PAD + prev.offset.x, y: PAD + prev.offset.y },
        newRow: entry.row, newOffset: { x: PAD + entry.offset.x, y: PAD + entry.offset.y },
        newSvg: entry.svg, from,
      });
      holder.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 260, easing: "ease", fill: "backwards" }
      );
    }

    flag.hidden = !isSolved(nextEq);
    if (!flag.hidden) flag.textContent = plain(nextEq);
    onChange?.(api);
  }

  function stepBack() {
    if (rows.length < 2) return;
    rows.pop();
    stack.pop();
    sheet.removeChild(sheet.lastElementChild);
    picked = null;
    const last = rows[rows.length - 1];
    const fresh = paint(last, true);
    sheet.replaceChild(fresh, sheet.lastElementChild);
    relayout();
    flag.hidden = !isSolved(last.row.eq);
    onPick?.(null, api);
    onChange?.(api);
  }

  /* ── Tapping a term ──────────────────────────────────────────────────── */
  sheet.addEventListener("pointerdown", (e) => {
    const hit = e.target.closest?.(".am-hit");
    if (hit) e.stopPropagation();      // a term is not a handle for the card
  });

  sheet.addEventListener("click", (e) => {
    const hit = e.target.closest?.(".am-hit");
    // Handled here, so the canvas below must not also treat it as a tap on bare
    // paper. It cannot work that out for itself: repainting the row detaches
    // this very target, and by the time the click reaches the canvas its
    // e.target has no ancestors left to recognise.
    if (hit) e.stopPropagation();
    const next = hit ? (hit.dataset.node === picked ? null : hit.dataset.node) : null;
    if (next === picked && !hit) return;
    picked = next;
    repaintLive();
    onPick?.(picked, api);
  });

  tools.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "back") stepBack();
    if (act === "close") { el.remove(); onRemove?.(api); }
  });

  const api = {
    id,
    el,
    grip,
    get equation() { return rows[rows.length - 1].row.eq; },
    get picked() { return picked; },
    get depth() { return rows.length; },
    get solved() { return isSolved(rows[rows.length - 1].row.eq); },

    /** Where a term sits on screen, so a menu can be put beside it. */
    rectFor(nodeId) {
      const last = rows[rows.length - 1];
      const node = last.svg?.querySelector(`.am-hit[data-node="${nodeId}"]`);
      return node ? node.getBoundingClientRect() : null;
    },

    /** The offers for whatever is picked, each already checked. */
    movesForPicked() {
      if (!picked) return [];
      return offers(this.equation, picked);
    },

    /** Make a move. Returns null when it was refused, with the reason. */
    apply(offer) {
      const result = offer.run();
      if (result.error) return { refused: result.error };
      const verdict = preservesSolutions(this.equation, result.eq);
      if (!verdict.ok) return { refused: verdict.why };
      picked = null;
      push(result.eq, { from: result.from, note: result.note });
      return { ok: true, note: result.note };
    },

    clearPick() { if (picked) { picked = null; repaintLive(); } },
    stepBack,
    working: () => rows.map((r) => ({ equation: plain(r.row.eq), note: r.note })),
    remove() { el.remove(); onRemove?.(api); },
  };

  push(eq, { animate: false, note: "" });
  return api;
}
