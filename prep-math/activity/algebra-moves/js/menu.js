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
        btn.className = "pp-sticky pp-note-btn am-move";
        // The button says the move, in the two or three characters a person
        // would write. The sentence goes on the tooltip and on the label a
        // screen reader reads, so nothing is lost by not printing it.
        btn.textContent = offer.mark || offer.label;
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
