/* ═══════════════════════════════════════════════════════════════════════════
   A CARD

   One problem, and the working under it. Every move writes a NEW line rather
   than replacing the one above, so the card grows downward and the whole
   derivation stays on the paper — which is the thing a single-equation stage
   could never show and the reason the canvas was worth building.

   Rows are lined up on their equals signs, the way working is lined up by hand.
   Only the last row is live; the ones above it are what you already did.
   ═══════════════════════════════════════════════════════════════════════════ */

import { UI } from "/utils/components/ui-icons.js";
import { buildRow, paintRow, flipInto } from "./render.js";
import { plain } from "./layout.js";
import { preservesSolutions } from "./verify.js";
import { isSolved, solvedLetterValue } from "./solve.js";
import { asNumbers, hasSubstitutions, offerTo, substitute, EQUALS, atomOffers, atomTerm, isEqualsKey } from "./ops.js";
import * as A from "./ast.js";
import * as R from "./rational.js";

const SIZE = 34;
const ROW_GAP = 10;
const PAD = 18;
const NOTE_GAP = 12;   // matches .am-work__why margin-left

/* The six papers of .pp-sticky (components.css), taken in turn so a canvas of
   problems reads as a pad of notes rather than a stack of windows. Tilts are
   fixed rather than random: a tilt that changes every reload makes the canvas
   feel unstable, and past about two degrees the working stops sitting level
   enough to read down. */
/** The moves that are done to both sides, and so are written in the margin. */
const MARGIN = new Set(["across", "divide", "times", "flip"]);

const PAPERS = 6;
const TILTS = [-1.7, 1.2, -0.9, 1.8, -1.4, 0.8];

let seq = 0;

/** A single value as it is written on the card: 5, 1/2, −3. */
const fmt = (v) => R.toText(v).replace(/-/g, "−");

/** A given value as it is written on the card: v = 5, t = 1/2, a = −3. */
const said = (given) =>
  Object.entries(given).map(([k, v]) => `${k} = ${fmt(v)}`);

export function createCard(eq, { x, y, given = null, title = "", find = "", onPick, onChange, onGesture, onRemove }) {
  const id = `card${++seq}`;
  const rows = [];        // { row, offset, note, from }
  // The GLYPH that is picked — its atom key (nodeId#slot), so the 3 and the x
  // of 3x, the + between terms and the = are each a thing of their own.
  let picked = null;
  let undone = [];        // lines stepped back off the bottom, newest last

  const el = document.createElement("div");
  el.className = `am-card pp-sticky--c${seq % PAPERS}`;
  el.dataset.card = id;
  el.style.setProperty("--am-tilt", `${TILTS[seq % TILTS.length]}deg`);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  // The letters this card was handed values for, and the number each stands
  // for. Held as exact rationals; the verifier wants them as plain numbers, and
  // converting once here keeps that conversion out of every move.
  const values = given && Object.keys(given).length ? given : null;
  const pinned = values ? asNumbers(values) : null;

  const grip = document.createElement("div");
  grip.className = "am-card__grip";
  grip.innerHTML = `<span class="am-card__dots" aria-hidden="true"></span>`;
  if (title) {
    const name = document.createElement("b");
    name.className = "am-card__name";
    name.textContent = title;
    grip.appendChild(name);
  }

  const tools = document.createElement("div");
  tools.className = "am-card__tools";
  tools.innerHTML = `
    <button type="button" class="am-card__btn" data-act="back" title="Step back" aria-label="Step back" disabled>
      ${UI.undo(15)}
    </button>
    <button type="button" class="am-card__btn" data-act="forward" title="Step forward again" aria-label="Step forward again" disabled>
      ${UI.redo(15)}
    </button>
    <button type="button" class="am-card__btn" data-act="close" title="Take it off the canvas" aria-label="Take it off the canvas">
      ${UI.close(15)}
    </button>`;
  grip.appendChild(tools);

  const sheet = document.createElement("div");
  sheet.className = "am-card__sheet";

  /* The question, written above the working the way it is written above the
     working on paper. It stays there after every number has gone in, because
     what the letters stood for is most of what the answer means. */
  let ask = null;
  if (values) {
    ask = document.createElement("p");
    ask.className = "am-card__given";
    ask.innerHTML = `<span>given</span> ${said(values).join(", ")}${find ? ` &middot; <span>find</span> ${find}` : ""}`;
  }

  const flag = document.createElement("div");
  flag.className = "am-card__done";
  flag.hidden = true;

  el.append(grip, ...(ask ? [ask] : []), sheet, flag);

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
    // The card says whether something is picked up, because the equals sign is
    // only a place to put things while something is in hand.
    if (live) el.classList.toggle("has-pick", !!picked);
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

    // `from` is kept with the row: stepping forward again replays the same
    // travel rather than fading the writing in from nowhere.
    const entry = { row: buildRow(nextEq, SIZE), note, from };
    rows.push(entry);

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

    done(nextEq);
    arrows();
    onChange?.(api);
  }

  /* An equation finishes at an answer and an expression finishes when there is
     nothing left to do to it, so the flag says which of the two happened. */
  function done(nextEq) {
    const over = isSolved(nextEq, { given: values });
    flag.hidden = !over;
    if (over) {
      flag.dataset.tag = nextEq.kind === "expr" ? "as tidy as it goes" : "solved";
      flag.textContent = plain(nextEq);
    }
  }

  /** The two arrows only offer what there is: a step to take back, a step to
      put back. A greyed arrow says where you are in the working. */
  function arrows() {
    tools.querySelector("[data-act='back']").disabled = rows.length < 2;
    tools.querySelector("[data-act='forward']").disabled = undone.length === 0;
  }

  function stepBack() {
    if (rows.length < 2) return;
    // Keep the whole row, not just its equation: put back the same reason and
    // the same travel when the forward arrow is pressed.
    undone.push(rows.pop());
    sheet.removeChild(sheet.lastElementChild);
    picked = null;
    const last = rows[rows.length - 1];
    const fresh = paint(last, true);
    sheet.replaceChild(fresh, sheet.lastElementChild);
    relayout();
    done(last.row.eq);
    arrows();
    onPick?.(null, api);
    onChange?.(api);
  }

  function stepForward() {
    const back = undone.pop();
    if (!back) return;
    picked = null;
    push(back.row.eq, { from: back.from, note: back.note });
    onPick?.(null, api);
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

    const key = hit?.dataset.key || null;

    /* A second tap, somewhere else, is a DESTINATION: put the term the first
       glyph belongs to there — over the =, or onto a like term. If that reads
       as a move, it is the move; if it does not, the tap simply picks up the
       glyph that was tapped, which is what a tap always does. */
    if (picked && key && key !== picked) {
      const eq = api.equation;
      const from = atomTerm(eq, picked);
      const to = isEqualsKey(key) ? EQUALS : atomTerm(eq, key)?.id;
      if (from && to && to !== from.id) {
        const offer = offerTo(eq, from.id, to);
        if (offer) { onGesture?.(offer, api); return; }
      }
    }

    const next = key && key !== picked ? key : null;
    if (next === picked && !hit) return;
    picked = next;
    repaintLive();
    onPick?.(picked, api);
  });

  tools.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "back") stepBack();
    if (act === "forward") stepForward();
    if (act === "close") { el.remove(); onRemove?.(api); }
  });

  const api = {
    id,
    el,
    grip,
    get equation() { return rows[rows.length - 1].row.eq; },
    get picked() { return picked; },
    get depth() { return rows.length; },
    get solved() { return isSolved(rows[rows.length - 1].row.eq, { given: values }); },
    get given() { return values; },

    /** Is there still a number waiting to go into this line? */
    get waiting() { return hasSubstitutions(rows[rows.length - 1].row.eq, values); },

    /** x = 5, once this card is finished there — what another card's
        substitution can reach across for. */
    get solvedValue() {
      const sv = solvedLetterValue(rows[rows.length - 1].row.eq, { given: values });
      return sv ? { ...sv, text: fmt(sv.value) } : null;
    },

    /** What to call this card in another card's menu. */
    get title() { return title || plain(rows[0].row.eq); },

    /** Letters in the term the picked glyph belongs to that THIS card was
        never given a value for — candidates for pulling one in from another. */
    get freeLettersInPick() {
      const term = atomTerm(rows[rows.length - 1].row.eq, picked);
      if (!term) return [];
      return A.varsIn(term).filter((n) => !(values && n in values));
    },

    /** Where a glyph sits on screen, so a menu can be put beside it. */
    rectFor(key) {
      const last = rows[rows.length - 1];
      const node = last.svg?.querySelector(`.am-hit[data-key="${key}"]`);
      return node ? node.getBoundingClientRect() : null;
    },

    /* Every move the picked glyph means — see atomOffers in ops.js. The 3 of
       3x offers ÷3, the + between two like terms offers to fold them, the =
       offers the both-sides moves. Short marks, so a row of them still reads
       faster than doing the algebra. */
    movesForPicked() {
      if (!picked) return [];
      return atomOffers(this.equation, picked, { given: values });
    },

    /** Make a move. Returns null when it was refused, with the reason. */
    apply(offer) {
      const result = offer.run();
      if (result.error) return { refused: result.error };
      const verdict = preservesSolutions(this.equation, result.eq, { given: pinned, scaledBy: result.scaledBy });
      if (!verdict.ok) return { refused: verdict.why };
      picked = null;
      // A move made here is a new branch of the working: whatever was stepped
      // back off the bottom is not on the way to it any more.
      undone = [];
      // Only the moves that do something to BOTH sides get a margin mark, the
      // way working is annotated by hand: +5, ÷3. A tidying step's mark is the
      // answer it produced, which is already written on the line.
      push(result.eq, { from: result.from, note: MARGIN.has(offer.key) ? offer.mark : "" });
      return { ok: true, note: result.note };
    },

    /** Reach into another card: substitute a value IT solved for, into
        whatever letter in the picked term matches it. This is why `apply`
        will not do: this card was never given that letter, so the verifier
        has to be told about it just for this one check, the same way a
        formula's own given values are. */
    useFromElsewhere(letter, value) {
      if (!picked) return { refused: "Nothing is picked." };
      const extended = { ...(values || {}), [letter]: value };
      const eq = rows[rows.length - 1].row.eq;
      const term = atomTerm(eq, picked);
      if (!term) return { refused: "There is no letter there to put a number into." };
      const result = substitute(eq, term.id, extended);
      if (result.error) return { refused: result.error };
      const verdict = preservesSolutions(eq, result.eq, { given: asNumbers(extended) });
      if (!verdict.ok) return { refused: verdict.why };
      picked = null;
      undone = [];
      push(result.eq, { from: result.from, note: result.note });
      return { ok: true, note: result.note };
    },

    clearPick() { if (picked) { picked = null; repaintLive(); } },
    stepBack,
    stepForward,
    working: () => rows.map((r) => ({ equation: plain(r.row.eq), note: r.note })),
    remove() { el.remove(); onRemove?.(api); },
  };

  push(eq, { animate: false, note: "" });
  return api;
}
