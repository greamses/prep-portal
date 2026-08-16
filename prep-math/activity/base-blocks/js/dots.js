/* ============================================================================
   Manipulatives — the counter you are dragging
   ----------------------------------------------------------------------------
   While a counter is being moved across the place-value chart, the thing under
   the finger is a plain DOM circle over the stage — not a repaint of the board's
   texture. The chart's face is up to 2048px of canvas; redrawing it on every
   pointermove would stutter, and a div follows the finger for nothing.

   The board is only repainted once, when the counter lands.
   ========================================================================== */

export function createDotGhost(stage) {
  let el = null;

  function show(hex) {
    if (!el) {
      el = document.createElement("span");
      el.className = "bb-dotghost";
      el.setAttribute("aria-hidden", "true");
      stage.appendChild(el);
    }
    el.style.background = hex;
    el.hidden = false;
  }

  function move(clientX, clientY) {
    if (!el) return;
    const r = stage.getBoundingClientRect();
    el.style.left = clientX - r.left + "px";
    el.style.top = clientY - r.top + "px";
  }

  function hide() {
    if (el) el.hidden = true;
  }

  return { show, move, hide };
}
