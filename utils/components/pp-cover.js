/* ============================================================================
   Cover: one receipt on the paint blob
   ----------------------------------------------------------------------------
   Anything that must take the whole screen for a moment (the instructions page, a camera
   consent, "turn your screen sideways") or ask over a live page (a notice) is a receipt in the
   middle of the screen, built from the site's own parts: .pp-receipt (wrapper = soft shadow,
   __paper = torn edge and punched holes), .pp-sticky for a tag, .pp-pill for a status and
   .pp-btn for the key. Its dress is in components.css; this builds the markup and makes sure the
   page has that dress.

     const { root, paper, close } = makeCover({ label: "Instructions", tag: "Exam" });
     paper.innerHTML = `<h2 class="pp-cover__title">…</h2>…`;
   ========================================================================== */

import { heroPaint } from "/utils/components/nav-icons.js";

/** A page that did not load the shared sheets (the loader does it on most) gets them now. */
function needComponents() {
  const probe = document.createElement("div");
  probe.className = "pp-receipt";
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const styled = getComputedStyle(probe).filter !== "none";
  probe.remove();
  if (styled) return;
  for (const href of ["/utils/components/theme.css", "/utils/components/components.css", "/utils/components/sticky-ui.css"]) {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = href;
      document.head.appendChild(l);
    }
  }
}

/**
 * @param label   what a screen reader calls it
 * @param wide    the roomy receipt (the instructions page)
 * @param scrim   over the live page, not in place of it
 * @param tag     the words on the sticky tag at the receipt's corner ("" for none)
 * @param colour  that tag's paper, 0..5 (.pp-sticky--cN)
 * → { root, paper, close }
 */
export function makeCover({ label, wide = false, scrim = false, tag = "", colour = 0 }) {
  needComponents();
  const root = document.createElement("div");
  root.className = `pp-cover${scrim ? " pp-cover--scrim" : ""}`;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", label);
  root.innerHTML = `${scrim ? "" : `<div class="pp-cover__paint" aria-hidden="true"></div>`}
    <div class="pp-receipt pp-cover__card${wide ? " pp-cover__card--wide" : ""}">
      ${tag ? `<span class="pp-sticky pp-sticky--c${colour} pp-sticky--tape" style="position:absolute;top:-14px;left:26px;z-index:2;--pp-note-tilt:-3deg"></span>` : ""}
      <div class="pp-receipt__paper"></div>
    </div>`;
  if (tag) root.querySelector(".pp-sticky").textContent = tag;
  const paint = root.querySelector(".pp-cover__paint");
  if (paint) { try { paint.innerHTML = heroPaint(); } catch { /* the blob is a wash, never a need */ } }
  document.body.appendChild(root);
  return { root, paper: root.querySelector(".pp-receipt__paper"), close: () => root.remove() };
}
