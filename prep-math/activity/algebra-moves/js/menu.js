/* ═══════════════════════════════════════════════════════════════════════════
   THE MENU OF MOVES

   A small sheet of offers that opens beside whatever term was tapped. On a
   canvas it has to follow the term rather than live in a side panel, or you
   lose your place every time you look away from what you are working on.

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
        btn.className = "am-move";
        btn.innerHTML = `<em></em><i></i>`;
        btn.querySelector("em").textContent = offer.label;
        btn.querySelector("i").textContent = offer.hint;
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
