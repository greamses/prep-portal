/* ═══════════════════════════════════════════════════════════════════════════
   THE MENU OF MOVES

   A chip that opens beside whatever term was tapped, saying what would be done
   to it: +5, ÷3, 20. On a canvas it has to follow the term rather than live in
   a side panel, or you lose your place every time you look away from what you
   are working on.

   One chip, not a menu. The choosing is done by picking the TERM — the tool
   already knows which move it would play on it (solve.js, bestOffers), and a
   list of sentences to read is slower than the algebra it is there to do.

   It sits in SCREEN coordinates, above the zoom transform, so the type stays
   readable however far out the canvas is zoomed.
   ═══════════════════════════════════════════════════════════════════════════ */

import { parse } from "./parse.js";
import { buildRow, paintRow, el } from "./render.js";

/** The moves that carry something over the equals sign. */
const MOVES = new Set(["across", "divide", "times"]);
const OPS = "+−÷×";
const FACE_SIZE = 20;

/** A curved arrow, drawn rather than typed so it can point either way. */
function arrow(dir) {
  const svg = el("svg", { class: `am-move__arrow am-move__arrow--${dir}`, viewBox: "0 0 28 9", "aria-hidden": "true" });
  svg.append(
    el("path", { d: "M3 8 Q14 -2 25 7", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round" }),
    el("path", { d: "M20.5 6.2 L25 7 L24 2.6", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
  );
  if (dir === "both") {
    svg.append(el("path", { d: "M7.5 6.2 L3 8 L3.6 3.4", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }));
  }
  return svg;
}

/** One piece of a mark, typeset: an operator in front (−, +, ÷, ×) stays a
    glyph, and what follows is drawn by the canvas's own typesetter. Anything
    that will not parse (⇄, ⌫) is shown as it is written. */
function setPiece(holder, op, src) {
  if (op) {
    const o = document.createElement("span");
    o.className = "am-move__op";
    o.textContent = op;
    holder.appendChild(o);
  }
  try {
    const svg = paintRow(buildRow(parse(src), FACE_SIZE), { live: false });
    svg.classList.add("am-move__ink");
    holder.appendChild(svg);
  } catch {
    holder.appendChild(document.createTextNode(src));
  }
}

function face(offer) {
  const holder = document.createElement("span");
  holder.className = "am-move__face";
  holder.setAttribute("aria-hidden", "true");
  if (offer.faces) {
    for (const f of offer.faces) setPiece(holder, f.op, f.src);
    return holder;
  }
  const mark = offer.mark || offer.label;
  if (OPS.includes(mark[0]) && mark.length > 1) setPiece(holder, mark[0], mark.slice(1));
  else setPiece(holder, "", mark);
  return holder;
}

export function createMenu(host) {
  const box = document.createElement("div");
  box.className = "am-menu";
  box.hidden = true;
  host.appendChild(box);

  let anchor = null;     // () => DOMRect | null

  function place() {
    if (box.hidden || !anchor) return;
    const rect = anchor();
    if (!rect) return hide();

    const frame = host.getBoundingClientRect();
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    const gap = 10;

    // Under the term by preference, above it when there is no room below.
    let top = rect.bottom - frame.top + gap;
    if (top + h > frame.height - 8) top = rect.top - frame.top - h - gap;
    top = Math.max(8, Math.min(frame.height - h - 8, top));

    let left = rect.left + rect.width / 2 - frame.left - w / 2;
    left = Math.max(8, Math.min(frame.width - w - 8, left));

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
  }

  function hide() {
    box.hidden = true;
    box.textContent = "";
    anchor = null;
  }

  return {
    el: box,

    /**
     * @param offers  what ops.js is offering for the tapped term
     * @param getRect where that term is, asked again whenever the canvas moves
     * @param onPick  called with the chosen offer
     */
    open(offers, getRect, onPick) {
      box.textContent = "";
      if (!offers.length) return hide();

      anchor = getRect;
      for (const offer of offers) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "am-move";
        // A move that carries something over the = wears an arrow over it,
        // pointing the way it goes.
        if (MOVES.has(offer.key)) {
          btn.classList.add("am-move--across");
          btn.appendChild(arrow(offer.dir || "r"));
        }
        // The button says the move, in the two or three characters a person
        // would write, SET the way the canvas sets it — a fraction stacked, a
        // root with its bar. The sentence goes on the tooltip and on the label
        // a screen reader reads, so nothing is lost by not printing it.
        btn.appendChild(face(offer));
        btn.title = offer.label;
        btn.setAttribute("aria-label", offer.label);
        btn.addEventListener("click", (e) => { e.stopPropagation(); onPick(offer); });
        box.appendChild(btn);
      }

      box.hidden = false;
      place();
    },

    close: hide,
    reposition: place,
    get open$() { return !box.hidden; },
  };
}
