/* ============================================================================
   EVERY DROPDOWN IS A RECEIPT
   ----------------------------------------------------------------------------
   One rule for the whole site, kept in one place, so a page does not have to
   remember it:

     1. a native <select> is swapped for the site's own dropdown (pp-select.js)
        — the trigger, and the list as a receipt. The <select> stays in the
        page as the source of truth: `sel.value` and its `change` event work as
        they always did.
     2. a dropdown list a page built BY HAND (the pp-dropdown of the activity
        pages and Snakes and Ladders, the grapher's list, the theory page's
        panels, the blog filters, the dashboard forms, grammar police) is made
        a receipt where it stands: its choices are moved into the receipt's
        paper, and its own box — background, border, shadow, corners — is put
        away. Nothing about how the page opens, closes or reads it changes.

   This module is imported by the nav (nav-builder.js), so every page with a
   nav has it; the few pages without a nav load it themselves. It watches the
   page, so a dropdown that arrives later — a form opened in a modal, a panel
   fetched on demand — is dealt with when it arrives.

   OPTING OUT: `data-native` on a <select> (or on anything around it) leaves it
   alone. A <select multiple> or a list box (`size` over 1) is not a dropdown
   and is always left alone. So is anything inside Blockly.
   ========================================================================== */

import { enhanceSelect } from "./pp-select.js";

const HAND_BUILT = [
  ".pp-select-menu:not(.pp-receipt)",   // lists written out by hand rather than by pp-select.js
  ".pp-dropdown-list",
  ".gp-custom-dropdown-list",
  ".csel-panel",
].join(",");

function css(href) {
  if (document.querySelector(`link[href*="${href}"]`)) return;
  if ([...document.styleSheets].some((s) => (s.href || "").includes(href))) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

const skip = (sel) =>
  sel.multiple || Number(sel.getAttribute("size") || 0) > 1 || sel.dataset.ppEnhanced ||
  sel.closest("[data-native], [class*='blockly'], .blocklyWidgetDiv, template, [contenteditable='true']");

function dressSelect(sel) {
  if (skip(sel)) return;
  const small = sel.offsetHeight && sel.offsetHeight < 34;
  const box = enhanceSelect(sel, { className: `pp-select--auto${small ? " pp-select--sm" : ""}` });
  if (!box) return;
  /* a select a page hides or disables by its own means takes its dropdown with it */
  const sync = () => { box.hidden = sel.hidden; box.classList.toggle("is-disabled", sel.disabled); };
  new MutationObserver(sync).observe(sel, { attributes: true, attributeFilter: ["hidden", "disabled"] });
  sync();
}

/**
 * Make a hand-built list a receipt. The list keeps its place, its id and its
 * open-and-shut; the choices go into the receipt's paper (in a part of their
 * own that scrolls, so the punched holes stay put).
 */
function dressMenu(menu) {
  if (menu.__ppReceipt || menu.closest("[data-native]")) return;
  menu.__ppReceipt = true;
  menu.classList.add("pp-menu-receipt");
  const paper = document.createElement("div");
  paper.className = "pp-receipt__paper pp-menu-receipt__paper";
  const list = document.createElement("div");
  list.className = "pp-menu-receipt__list";
  paper.appendChild(list);
  const gather = () => {
    if (paper.parentNode !== menu) menu.appendChild(paper);
    [...menu.childNodes].forEach((n) => { if (n !== paper) list.appendChild(n); });
  };
  /* a page that fills its list again (innerHTML, appendChild) puts the choices
     outside the paper, or throws the paper away: gather them back in */
  let busy = false;
  const watch = new MutationObserver(() => {
    if (busy) return;
    const loose = [...menu.childNodes].some((n) => n !== paper);
    if (!loose && paper.parentNode === menu) return;
    busy = true;
    if (paper.parentNode !== menu) list.replaceChildren();   // the old choices went with the old paper
    gather();
    busy = false;
  });
  gather();
  watch.observe(menu, { childList: true });
}

function sweep(root) {
  if (!root || !root.querySelectorAll) return;
  if (root.matches?.("select")) dressSelect(root);
  root.querySelectorAll("select").forEach(dressSelect);
  if (root.matches?.(HAND_BUILT)) dressMenu(root);
  root.querySelectorAll(HAND_BUILT).forEach(dressMenu);
}

function start() {
  css("/utils/components/components.css");
  css("/utils/components/select.css");
  sweep(document.body);
  new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => { if (n.nodeType === 1) sweep(n); });
  }).observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== "undefined" && !document.__ppReceiptDropdowns) {
  document.__ppReceiptDropdowns = true;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
