/* ============================================================================
   BLOCK STUDIOS — the chrome the two studios share
   ----------------------------------------------------------------------------
   Both studios are the same shape: a rail of categories, a canvas of blocks,
   a bar of modes above and a row of panels below. This file adds the two
   things that shape was missing, once for both:

     FULL SCREEN   the canvas is where the work happens, and on a laptop it
                   was getting a third of the window. A note in the mode bar
                   (or F) hands the whole screen to the blocks: nav, header,
                   mode bar and tabs all step out, and Esc brings them back.
                   Uses the real Fullscreen API where the browser allows it,
                   and falls back to a fixed full-window dress where it does
                   not (an iframe without allowfullscreen, mostly — the
                   workbook opens these studios in a panel).

     PANELS        the writing/code panel and the preview are receipts, the
                   way every other sheet of paper on this site is.

   Blockly measures itself against its container, so every change of size ends
   with Blockly.svgResize on the visible workspace — without it the blocks
   keep the old size and the drag maths goes wrong.
   ========================================================================== */

(function (global) {
  "use strict";

  const doc = global.document;
  if (!doc) return;

  const FULL = "pp-studio-full";

  /* our own icons, same language as the rest of the site */
  const ICON_OPEN = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">'
    + '<path d="M3.6 9.4V3.6h5.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M20.4 14.6v5.8h-5.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M3.6 3.6 10 10M20.4 20.4 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const ICON_SHUT = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">'
    + '<path d="M9.4 3.6v5.8H3.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M14.6 20.4v-5.8h5.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M3.6 20.4 9.4 14.6M20.4 3.6 14.6 9.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  /** Blockly only knows it has changed size if it is told. */
  function remeasure() {
    const B = global.Blockly;
    if (!B || !B.svgResize) return;
    const all = (B.Workspace && B.Workspace.getAll && B.Workspace.getAll()) || [];
    all.forEach((ws) => {
      const div = ws.getInjectionDiv && ws.getInjectionDiv();
      if (!div || !div.offsetParent) return;      // the hidden modes can wait
      try { B.svgResize(ws); } catch (e) { /* a workspace mid-teardown */ }
    });
  }

  const isFull = () => doc.documentElement.classList.contains(FULL);

  function setFull(on) {
    doc.documentElement.classList.toggle(FULL, on);
    const btn = doc.getElementById("pp-studio-fs");
    if (btn) {
      btn.innerHTML = (on ? ICON_SHUT : ICON_OPEN) + `<b>${on ? "Close" : "Full screen"}</b>`;
      btn.setAttribute("data-tip", on ? "Leave full screen (Esc)" : "Give the whole screen to the blocks (F)");
      btn.setAttribute("aria-pressed", String(on));
    }
    /* twice: once for the layout change, once after the transition */
    remeasure();
    setTimeout(remeasure, 260);
  }

  async function toggle() {
    const want = !isFull();
    const el = doc.documentElement;
    try {
      if (want && el.requestFullscreen) await el.requestFullscreen();
      else if (!want && doc.fullscreenElement && doc.exitFullscreen) await doc.exitFullscreen();
    } catch (e) {
      /* refused (an iframe with no allowfullscreen): the CSS dress alone
         still fills the window, which is the point of it */
    }
    setFull(want);
  }

  function addButton() {
    const bar = doc.querySelector(".editor-header");
    if (!bar || doc.getElementById("pp-studio-fs")) return;
    const btn = doc.createElement("button");
    btn.id = "pp-studio-fs";
    btn.type = "button";
    btn.className = "pp-studio-fs";
    btn.innerHTML = ICON_OPEN + "<b>Full screen</b>";
    btn.setAttribute("data-tip", "Give the whole screen to the blocks (F)");
    btn.addEventListener("click", toggle);
    bar.appendChild(btn);
  }

  /** The two overlay panels are sheets of paper, like every other one here. */
  function asReceipts() {
    doc.querySelectorAll(".overlay-panel").forEach((panel) => {
      if (panel.classList.contains("pp-receipt")) return;
      panel.classList.add("pp-receipt");
      const paper = doc.createElement("div");
      paper.className = "pp-receipt__paper";
      while (panel.firstChild) paper.appendChild(panel.firstChild);
      panel.appendChild(paper);
    });
  }

  function start() {
    addButton();
    asReceipts();
    /* F for full screen, Esc to come back — but never while typing */
    doc.addEventListener("keydown", (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); toggle(); }
      if (e.key === "Escape" && isFull()) { e.preventDefault(); toggle(); }
    });
    /* leaving full screen by the browser's own means (Esc in Chrome) */
    doc.addEventListener("fullscreenchange", () => {
      if (!doc.fullscreenElement && isFull()) setFull(false);
    });
    global.addEventListener("resize", remeasure, { passive: true });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();

  global.BlockStudioUI = { toggle, remeasure, isFull };
})(typeof window !== "undefined" ? window : globalThis);
