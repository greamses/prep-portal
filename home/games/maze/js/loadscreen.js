/* ============================================================================
   3D Maze — load screen (percentage)
   ----------------------------------------------------------------------------
   Drives the dungeon-style load overlay: a progress bar + percentage that
   reflects the real Babylon download (streamed in main.js) and the scene build.
   Progress only moves forward so it never visually jumps backwards.
   ========================================================================== */

const $ = (s) => document.querySelector(s);
let cur = 0;

export function initLoader() {
  cur = 0;
  paint(0);
}

/** frac is 0..1. */
export function setProgress(frac) {
  const pct = Math.max(0, Math.min(100, Math.round(frac * 100)));
  if (pct <= cur) return;
  cur = pct;
  paint(cur);
}

function paint(pct) {
  const fill = $("#maze-loader-fill");
  if (fill) fill.style.width = pct + "%";
  const t = $("#maze-loader-pct");
  if (t) t.textContent = pct + "%";
}

export function finishLoader() {
  cur = 100;
  paint(100);
  const el = $("#maze-loader");
  if (!el) return;
  setTimeout(() => {
    el.classList.add("is-hidden");
    setTimeout(() => (el.hidden = true), 450);
  }, 220);
}

export function loaderError(msg) {
  $("#maze-loader")?.classList.add("is-error");
  const title = $("#maze-loader-title");
  if (title) title.textContent = msg;
  const t = $("#maze-loader-pct");
  if (t) t.textContent = "—";
}
