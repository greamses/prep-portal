/* ============================================================================
   Shared 3D-game viewport
   ----------------------------------------------------------------------------
   Drop-in helper for every 3D game. It:
     • locks the play area to a 16:9 box (letter-boxed inside a dark frame),
     • adds a fullscreen toggle button,
     • on touch devices, encourages / locks LANDSCAPE — locking the orientation
       when fullscreen is available, and showing a "rotate your device" overlay
       as a fallback when it isn't (e.g. iOS Safari).

   Usage (after the engine exists):
     import { initGameViewport } from "/utils/components/game-viewport.js";
     initGameViewport({ stage: ".drone-stage", onResize: () => engine.resize() });

   The `stage` element becomes the 16:9 box; its parent becomes the frame that
   fills the space below the nav (or the whole screen in fullscreen). Requires
   /utils/components/game-viewport.css.
   ========================================================================== */

const SVG_EXPAND =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/></svg>';
const SVG_COMPRESS =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v4a1 1 0 0 1-1 1H4M15 4v4a1 1 0 0 0 1 1h4M9 20v-4a1 1 0 0 0-1-1H4M15 20v-4a1 1 0 0 1 1-1h4"/></svg>';
const SVG_ROTATE =
  '<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="13" height="10" rx="2"/><path d="M18 8a6 6 0 0 1 3 5M21 13l-1.6-1.2M21 13l1.4-1.4"/></svg>';

export function initGameViewport(opts = {}) {
  const stage = document.querySelector(opts.stage || "[data-game-stage]");
  if (!stage) return { destroy() {} };
  const frame = stage.parentElement;
  const onResize = typeof opts.onResize === "function" ? opts.onResize : () => {};
  const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

  frame.classList.add("gv-frame");
  stage.classList.add("gv-stage");

  // ── fullscreen button ─────────────────────────────────────────────────────
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "gv-fs-btn";
  btn.setAttribute("aria-label", "Toggle fullscreen");
  btn.innerHTML = SVG_EXPAND;
  stage.appendChild(btn);

  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  function requestFs(el) {
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    return Promise.reject();
  }
  function exitFs() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    return Promise.reject();
  }
  function lockLandscape() {
    try { screen.orientation?.lock?.("landscape").catch(() => {}); } catch (e) {}
  }

  async function toggle() {
    try {
      if (fsEl()) { await exitFs(); }
      else { await requestFs(frame); lockLandscape(); }
    } catch (e) { /* fullscreen may be blocked; overlay still guides rotation */ }
  }
  btn.addEventListener("click", toggle);

  function onFsChange() {
    btn.innerHTML = fsEl() ? SVG_COMPRESS : SVG_EXPAND;
    if (fsEl() && isTouch) lockLandscape();
    fit();
  }
  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);

  // ── rotate-to-landscape overlay (touch + portrait fallback) ───────────────
  const rotate = document.createElement("div");
  rotate.className = "gv-rotate";
  rotate.innerHTML =
    `<div class="gv-rotate-card">${SVG_ROTATE}<p>Rotate your device</p><span>This game plays in landscape</span></div>`;
  stage.appendChild(rotate);

  const portrait = window.matchMedia("(orientation: portrait)");
  function syncOrientation() {
    const show = isTouch && portrait.matches && !fsEl();
    rotate.classList.toggle("gv-show", show);
  }
  portrait.addEventListener?.("change", () => { syncOrientation(); fit(); });

  // ── 16:9 sizing ───────────────────────────────────────────────────────────
  let raf = 0;
  function fit() {
    const full = !!fsEl();
    const top = full ? 0 : frame.getBoundingClientRect().top;
    const availH = Math.max(240, window.innerHeight - top);
    frame.style.height = availH + "px";

    const availW = frame.clientWidth;
    let w = availW, h = w * 9 / 16;
    if (h > availH) { h = availH; w = h * 16 / 9; }
    stage.style.width = Math.round(w) + "px";
    stage.style.height = Math.round(h) + "px";

    syncOrientation();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(onResize); // let layout settle before engine.resize()
  }

  const onWin = () => fit();
  window.addEventListener("resize", onWin);
  window.addEventListener("orientationchange", onWin);
  fit();

  return {
    toggleFullscreen: toggle,
    isFullscreen: () => !!fsEl(),
    destroy() {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("orientationchange", onWin);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      btn.remove();
      rotate.remove();
    },
  };
}
