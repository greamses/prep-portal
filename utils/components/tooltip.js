/* ============================================================================
   TOOLTIP — the one tooltip for the whole site
   ----------------------------------------------------------------------------
   Anything that carries `data-tip` gets its words shown beside it on hover or
   keyboard focus, in one small ink chip that lives on the body:

     <button data-tip="Print" aria-label="Print">…icon…</button>
     <button data-tip="Ruler" data-tip-side="right">…</button>

     import { mountTooltips } from "/utils/components/tooltip.js";
     mountTooltips();          // once per page; calling it again does nothing

   WHY ONE, ON THE BODY. A tip drawn inside the thing it labels is overflow of
   that thing, and anything that scrolls clips it — the workbook's tool rail grew
   a sideways scrollbar exactly that way. A single element fixed to the window
   can go anywhere, and it cannot be cut off by the container it points into.

   WHY `data-tip` AND NOT `title`. `title` makes the browser draw its own
   tooltip — late, unstyled, and ON TOP of this one, so a page using both shows
   two. `title` is left alone wherever a page still uses it; the house tooltip
   is opt-in by `data-tip`.

   WHERE IT GOES. `data-tip-side` = right | left | top | bottom asks for a side;
   without it the tip goes above. If there is no room on the side asked for it
   tries the others in a sensible order, and it is always kept inside the
   window.

   A screen reader: the words are in the button's own aria-label (set it —
   `setTip` does), so the chip is only described-by when it says something the
   label does not, and is never read twice.
   ========================================================================== */

const GAP = 8;        // px between the thing and its tip
const EDGE = 4;       // px the tip keeps from the window's edge
const ORDER = {
  top: ["top", "bottom", "right", "left"],
  bottom: ["bottom", "top", "right", "left"],
  right: ["right", "left", "top", "bottom"],
  left: ["left", "right", "top", "bottom"],
};

let tip = null;
let target = null;

/** Show the words beside `node`. */
function show(node) {
  const text = node.dataset.tip;
  if (!text) return hide();
  if (target && target !== node) unlink(target);
  target = node;
  tip.textContent = text;
  tip.hidden = false;
  place(node, node.dataset.tipSide || "top");
  if (node.getAttribute("aria-label") !== text) node.setAttribute("aria-describedby", tip.id);
}

function unlink(node) {
  if (node.getAttribute("aria-describedby") === tip.id) node.removeAttribute("aria-describedby");
}

/** Put the tip away. Safe to call at any time, from anywhere. */
export function hideTip() {
  if (!tip) return;
  tip.hidden = true;
  if (target) unlink(target);
  target = null;
}
const hide = hideTip;

function place(node, want) {
  const k = node.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const spot = {
    top: [k.left + (k.width - t.width) / 2, k.top - t.height - GAP],
    bottom: [k.left + (k.width - t.width) / 2, k.bottom + GAP],
    right: [k.right + GAP, k.top + (k.height - t.height) / 2],
    left: [k.left - t.width - GAP, k.top + (k.height - t.height) / 2],
  };
  const fits = ([x, y]) => x >= EDGE && y >= EDGE && x + t.width <= W - EDGE && y + t.height <= H - EDGE;
  const side = (ORDER[want] || ORDER.top).find((s) => fits(spot[s])) || want;
  const [x, y] = spot[side] || spot.top;
  tip.dataset.side = side;
  tip.style.left = `${Math.round(Math.min(Math.max(EDGE, x), W - t.width - EDGE))}px`;
  tip.style.top = `${Math.round(Math.min(Math.max(EDGE, y), H - t.height - EDGE))}px`;
}

/** Give a node a tooltip (and, if it has none, the same words as its label). */
export function setTip(node, text, side) {
  if (!node) return node;
  node.dataset.tip = text;
  if (side) node.dataset.tipSide = side;
  if (!node.getAttribute("aria-label")) node.setAttribute("aria-label", text);
  /* a leftover `title` would draw the browser's own tooltip over this one */
  node.removeAttribute("title");
  if (target === node && tip && !tip.hidden) show(node);
  return node;
}

/** Start the site's tooltip on this page. Idempotent. */
export function mountTooltips() {
  if (tip) return;
  tip = document.createElement("span");
  tip.className = "pp-tip";
  tip.id = "pp-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);

  const tipOf = (e) => e.target.closest?.("[data-tip]");
  document.addEventListener("pointerover", (e) => {
    const node = tipOf(e);
    if (node) show(node); else if (target) hide();
  });
  document.addEventListener("pointerout", (e) => {
    /* leaving the thing, and not just moving onto something inside it */
    if (target && !target.contains(e.relatedTarget)) hide();
  });
  document.addEventListener("focusin", (e) => {
    const node = tipOf(e);
    if (node) show(node); else hide();
  });
  document.addEventListener("focusout", hide);
  /* a press means the pointer is busy with the thing, not reading about it */
  document.addEventListener("pointerdown", hide);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
  /* the thing moved out from under its tip */
  window.addEventListener("scroll", hide, { capture: true, passive: true });
  window.addEventListener("resize", hide, { passive: true });
}
