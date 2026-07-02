/* ============================================================================
   Bearing Courier — load screen (progress percentage)
   ----------------------------------------------------------------------------
   Segmented progress bar + status text driven by real load progress (Babylon is
   streamed in main.js, then the scene builds). Progress only moves forward.
   ========================================================================== */

const $ = (s) => document.querySelector(s);
const SEGMENTS = 24;
let cur = 0;

export function initLoader() {
  cur = 0;
  const bar = $("#dr-bar");
  if (bar && !bar.childElementCount) {
    for (let i = 0; i < SEGMENTS; i++) {
      const seg = document.createElement("span");
      seg.className = "dr-seg";
      bar.appendChild(seg);
    }
  }
  paint(0);
  setStatus("booting…");
}

export function setProgress(frac) {
  const pct = Math.max(0, Math.min(100, Math.round(frac * 100)));
  if (pct <= cur) return;
  cur = pct;
  paint(cur);
  if (cur < 88) setStatus("loading engine…");
  else if (cur < 96) setStatus("building airspace…");
  else setStatus("spinning up rotors…");
}

function paint(pct) {
  const segs = document.querySelectorAll("#dr-bar .dr-seg");
  const on = Math.round((pct / 100) * segs.length);
  segs.forEach((s, i) => s.classList.toggle("on", i < on));
  const t = $("#dr-loader-pct");
  if (t) t.textContent = String(pct).padStart(2, "0") + "%";
}

function setStatus(msg) {
  const s = $("#dr-loader-status");
  if (s) s.textContent = msg;
}

export function logStep(msg) {
  const log = $("#dr-log");
  if (!log) return;
  const line = document.createElement("div");
  line.className = "dr-log-line";
  line.textContent = "» " + msg;
  log.appendChild(line);
  while (log.childElementCount > 4) log.removeChild(log.firstChild);
}

export function finishLoader() {
  cur = 100;
  paint(100);
  setStatus("ready");
  const el = $("#dr-loader");
  if (!el) return;
  setTimeout(() => {
    el.classList.add("is-hidden");
    setTimeout(() => (el.hidden = true), 450);
  }, 300);
}

export function loaderError(msg) {
  $("#dr-loader")?.classList.add("is-error");
  setStatus(msg);
  const t = $("#dr-loader-pct");
  if (t) t.textContent = "ERR";
}
