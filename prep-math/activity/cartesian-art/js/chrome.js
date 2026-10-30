/* ============================================================================
   Cartesian Art — the studio's chrome: tooltips and sticky-note buttons
   ----------------------------------------------------------------------------
   Two house rules, applied once here so no panel has to remember them:

   TOOLTIPS. The site has ONE tooltip (utils/components/tooltip.js, read from
   `data-tip`). A browser `title` draws its own chip on top of it, so every
   `title` in the studio is moved onto `data-tip` — the ones written in the page,
   the ones a panel builds later (puzzle cards, equation rows, swatches) and the
   ones a script sets after the fact. A tip opens beside its control: to the
   right of the rail, to the left of the menu that hugs the right edge, above
   everything else.

   STICKY NOTES. A button with WORDS on it is a note (the same .pp-sticky paper
   as the rest of the site); a button that is only a picture stays a plain
   glyph. A button with BOTH a picture and words keeps only the picture: its
   words move onto the tooltip (and stay in the page for screen readers, hidden
   visually, so scripts that write to them keep working). This page keeps `data-plain-buttons`, so the site-wide catch-all does
   not decide it — this does, by class, for every button now and later.
   ========================================================================== */

import { mountTooltips, setTip } from "/utils/components/tooltip.js";

/* Buttons that are pictures, keys or other tools' own — never notes. */
const NOT_NOTES = [
  ".ca-fab", ".ca-toolrail-btn", ".ca-dpad-btn", ".ca-icon-btn", ".ca-steer-toggle", ".ca-modal-close",
  ".ca-dock-toggle", ".ca-dock-btn", ".ca-eq-dot", ".ca-eq-del", ".ca-eq-play", ".ca-eq-col", ".ca-swatch", ".ca-size",
  ".am-key", ".ca-eq-ineq button", ".pp-sticky", ".mm-prepbot-menu-btn", ".ca-grad-stop", ".ca-wheel-swatch",
].join(",");

const TILTS = [-1.6, 1.3, -0.9, 1.7, -1.2, 0.8];
const PAPERS = [0, 3, 2, 1, 4, 5]; // pp-sticky--c0…c5
let n = 0;

const hasWords = (b) => {
  // the words on a button, ignoring anything inside a drawing
  let t = "";
  for (const node of b.childNodes) {
    if (node.nodeType === 3) t += node.nodeValue;
    else if (node.nodeType === 1 && node.tagName.toLowerCase() !== "svg") t += node.textContent;
  }
  return t.trim().length > 0;
};

/** Picture + words → picture only; the words become the tooltip. */
function iconise(b) {
  if (b.classList.contains("ca-iconised") || b.matches(".am-key, .pp-sticky:not(.ca-note)")) return false;
  if (!b.querySelector(":scope > svg") || !hasWords(b)) return false;
  let words = "";
  for (const node of [...b.childNodes]) {
    if (node.nodeType === 3 && node.nodeValue.trim()) {
      const span = document.createElement("span");
      span.className = "ca-btn-words";
      span.textContent = node.nodeValue.trim();
      b.replaceChild(span, node);
      words += " " + span.textContent;
    } else if (node.nodeType === 1 && node.tagName.toLowerCase() !== "svg") {
      node.classList.add("ca-btn-words");
      words += " " + node.textContent;
    }
  }
  words = words.trim();
  if (!b.getAttribute("title") && !b.dataset.tip) b.setAttribute("title", words);
  if (!b.getAttribute("aria-label")) b.setAttribute("aria-label", b.getAttribute("title") || b.dataset.tip || words);
  b.classList.add("ca-iconised");
  return true;
}

function dress(b) {
  if (iconise(b)) return;
  if (b.classList.contains("ca-note") || b.classList.contains("ca-iconised") || b.matches(NOT_NOTES) || !hasWords(b)) return;
  const accent = b.matches(".ca-soft-btn--accent, .is-go");
  b.classList.add("pp-sticky", "pp-note-btn", "ca-note", `pp-sticky--c${accent ? 0 : PAPERS[n++ % PAPERS.length]}`);
  b.style.setProperty("--pp-note-tilt", `${TILTS[n % TILTS.length]}deg`);
}

/** A title becomes a tip, on the side that has room. */
function tipOf(node) {
  const text = node.getAttribute("title");
  if (!text) return;
  const side = node.closest(".ca-toolrail") ? "right"
    : node.closest(".ca-menu-items, #ca-menu") ? "left"
    : "top";
  setTip(node, text, side);
}

function sweep(root) {
  root.querySelectorAll("button").forEach(dress);
  root.querySelectorAll("[title]").forEach((el) => {
    if (el.tagName.toLowerCase() === "iframe" || el instanceof SVGElement) return;
    tipOf(el);
  });
}

export function initChrome() {
  mountTooltips();
  const studio = document.querySelector("#ca-studio") || document.body;
  sweep(studio);

  let queued = false;
  const again = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sweep(studio); });
  };
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "attributes") { tipOf(m.target); continue; }
      if (m.addedNodes.length) { again(); return; }
    }
  }).observe(studio, { childList: true, subtree: true, attributes: true, attributeFilter: ["title"] });
}
