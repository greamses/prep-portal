/* ============================================================================
   3D Maze — load screen (terminal-style percentage)
   ----------------------------------------------------------------------------
   Builds a segmented progress bar + boot status from real load progress (the
   Babylon download is streamed in main.js, then the scene build). Progress only
   moves forward. Controls are listed statically in the markup.
   ========================================================================== */

const $ = (s) => document.querySelector(s);
const SEGMENTS = 24;
let cur = 0;

export function initLoader() {
  cur = 0;
  const bar = $("#mz-bar");
  if (bar && !bar.childElementCount) {
    for (let i = 0; i < SEGMENTS; i++) {
      const seg = document.createElement("span");
      seg.className = "mz-seg";
      bar.appendChild(seg);
    }
  }
  paint(0);
  setStatus("booting…");
}

/** frac is 0..1. */
export function setProgress(frac) {
  const pct = Math.max(0, Math.min(100, Math.round(frac * 100)));
  if (pct <= cur) return;
  cur = pct;
  paint(cur);
  if (cur < 88) setStatus("loading engine…");
  else if (cur < 96) setStatus("building maze…");
  else setStatus("spawning hunters…");
}

function paint(pct) {
  const segs = document.querySelectorAll("#mz-bar .mz-seg");
  const on = Math.round((pct / 100) * segs.length);
  segs.forEach((s, i) => s.classList.toggle("on", i < on));
  const t = $("#maze-loader-pct");
  if (t) t.textContent = String(pct).padStart(2, "0") + "%";
}

function setStatus(msg) {
  const s = $("#maze-loader-status");
  if (s) s.textContent = msg;
}

/** Append a boot-log line (keeps the last few). */
export function logStep(msg) {
  const log = $("#mz-log");
  if (!log) return;
  const line = document.createElement("div");
  line.className = "mz-log-line";
  line.textContent = "» " + msg;
  log.appendChild(line);
  while (log.childElementCount > 4) log.removeChild(log.firstChild);
}

export function finishLoader() {
  cur = 100;
  paint(100);
  setStatus("ready");
  const el = $("#maze-loader");
  if (!el) return;
  setTimeout(() => {
    el.classList.add("is-hidden");
    setTimeout(() => (el.hidden = true), 450);
  }, 300);
}

export function loaderError(msg) {
  $("#maze-loader")?.classList.add("is-error");
  setStatus(msg);
  const t = $("#maze-loader-pct");
  if (t) t.textContent = "ERR";
}
