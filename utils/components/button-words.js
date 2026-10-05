/* ============================================================================
   A BUTTON WITH WORDS ON IT IS A NOTE — even with an icon beside the words
   ----------------------------------------------------------------------------
   sticky-ui.css leaves an ICON-ONLY button on receipt paper plain (the x of a
   panel, a gear): paper dressed in paper reads as clutter. It finds one with
   `:has(> svg:only-child)` — and that is where it went wrong, because CSS
   cannot see TEXT: a button holding an icon AND the words "Show me one" has
   an svg that is its only child ELEMENT, so it was taken for an icon and
   undressed. Every worded button in the workbook's tool panels lost its note
   that way.

   So the words are looked for here, where they can be seen: a button on
   receipt paper with one icon and some writing is marked `pp-worded`, and the
   rule in sticky-ui.css stands aside for it. Brought to every page by the nav.
   ========================================================================== */

const SCOPE = ".pp-receipt__paper";
const BUTTONS = "button, .pp-btn, [role='button']";

function mark(btn) {
  if (!btn.closest(SCOPE)) return;
  const kids = btn.children;
  const icon = kids.length === 1 && (kids[0].matches("svg") || kids[0].hasAttribute("data-icon"));
  const words = icon && [...btn.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  btn.classList.toggle("pp-worded", !!words);
}

function sweep(root) {
  if (!root || !root.querySelectorAll) return;
  if (root.matches?.(BUTTONS)) mark(root);
  root.querySelectorAll(BUTTONS).forEach(mark);
  /* writing put into a button that is already there */
  const own = root.closest?.(BUTTONS);
  if (own) mark(own);
}

function start() {
  sweep(document.body);
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") { const b = r.target.parentElement?.closest(BUTTONS); if (b) mark(b); continue; }
      const b = r.target.nodeType === 1 && r.target.closest?.(BUTTONS);
      if (b) mark(b);
      r.addedNodes.forEach((n) => { if (n.nodeType === 1) sweep(n); });
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}

if (typeof document !== "undefined" && !document.__ppButtonWords) {
  document.__ppButtonWords = true;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
