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
  /* Inside whatever fills the screen, or the tip opens behind it, unseen. */
  const home = document.fullscreenElement || document.webkitFullscreenElement || document.body;
  if (tip.parentNode !== home) home.appendChild(tip);
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

/* ── adopting `title` ──────────────────────────────────────────────────────
   A `title` on a control draws the browser's own tooltip: late, unstyled, in another face. Rather
   than chase every one by hand (dozens of pages, and more set from script), the component takes
   them over: each `title` on the page, now or added later, becomes a `data-tip` and is removed, so
   the house chip is the only tooltip there is. The words stay available to a screen reader:
   an icon with no text takes them as its label, a control with text keeps its own name and gets
   them as its description.

   Left alone, because their `title` is not a tooltip: an iframe's (its accessible name), <abbr>
   (the expansion), <link>/<style>/<meta>/<html>, and anything in SVG (a `title` there is an element,
   not an attribute that draws a tip). Opt out of one with `data-native-title`. */
const KEEP_TITLE = new Set(["IFRAME", "ABBR", "LINK", "STYLE", "META", "HTML", "TITLE", "OBJECT", "EMBED", "FRAME"]);
function adopt(el) {
  if (!el || el.nodeType !== 1 || !el.hasAttribute("title")) return;
  if (KEEP_TITLE.has(el.tagName) || el instanceof SVGElement || "nativeTitle" in el.dataset) return;
  const words = (el.getAttribute("title") || "").trim();
  el.removeAttribute("title");
  if (!words) return;
  if (!el.dataset.tip) el.dataset.tip = words;
  const hasText = (el.textContent || "").trim().length > 0;
  if (!hasText) { if (!el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) el.setAttribute("aria-label", words); }
  else if (!el.getAttribute("aria-description") && el.dataset.tip === words && !el.getAttribute("aria-label")) el.setAttribute("aria-description", words);
  if (target === el && tip && !tip.hidden) show(el);
}
function adoptTree(root) {
  if (!root || root.nodeType !== 1) return;
  adopt(root);
  root.querySelectorAll("[title]").forEach(adopt);
}

/** Start the site's tooltip on this page. Idempotent. */
export function mountTooltips() {
  if (tip || document.getElementById("pp-tip")) return; // once per page, even if the module was loaded twice
  adoptTree(document.body);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "attributes") adopt(m.target);
      else m.addedNodes.forEach(adoptTree);
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["title"] });
  tip = document.createElement("span");
  tip.className = "pp-tip";
  tip.id = "pp-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);
  /* Its dress is in components.css; a page that does not load that sheet
     (the exam paper) still gets the same chip rather than bare words. */
  if (getComputedStyle(tip).position !== "fixed" && !document.getElementById("pp-tip-css")) {
    const css = document.createElement("style");
    css.id = "pp-tip-css";
    css.textContent = `
.pp-tip { position: fixed; z-index: 100000; width: max-content; max-width: 16rem; padding: 0.3rem 0.55rem;
  font: 600 0.66rem/1.3 var(--font-mono, ui-monospace, monospace); letter-spacing: 0.02em;
  color: var(--surface-primary, #fffdf8); background: var(--ink, #2a2723); border-radius: 0;
  box-shadow: 0 4px 12px -4px rgba(42, 39, 35, 0.4); pointer-events: none; }
.pp-tip[hidden] { display: none; }
.pp-tip::after { content: ""; position: absolute; width: 7px; height: 7px; background: inherit; transform: rotate(45deg); }
.pp-tip[data-side="top"]::after { bottom: -3px; left: calc(50% - 3.5px); }
.pp-tip[data-side="bottom"]::after { top: -3px; left: calc(50% - 3.5px); }
.pp-tip[data-side="right"]::after { left: -3px; top: calc(50% - 3.5px); }
.pp-tip[data-side="left"]::after { right: -3px; top: calc(50% - 3.5px); }
@media print { .pp-tip { display: none !important; } }`;
    document.head.appendChild(css);
  }

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
