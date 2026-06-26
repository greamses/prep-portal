/* ============================================================================
   3D Maze — bootstrap
   ----------------------------------------------------------------------------
   Streams the Babylon engine from the CDN with real download progress (so the
   load screen shows a true percentage), then dynamically imports the game once
   BABYLON exists on window. Falls back to a plain <script> tag if streaming
   isn't possible (CORS/CSP), and shows an error if the engine can't load.
   ========================================================================== */

import { initLoader, setProgress, finishLoader, loaderError, logStep } from "./loadscreen.js";

const BABYLON_URL = "https://cdn.jsdelivr.net/npm/babylonjs@7/babylon.js";

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/** Download Babylon while reporting progress (0..1), then execute it. */
async function loadBabylon(onProgress) {
  if (window.BABYLON) { onProgress(1); return; }
  try {
    const res = await fetch(BABYLON_URL);
    if (!res.ok || !res.body) throw new Error("no-stream");
    const total = +res.headers.get("content-length") || 0;
    const reader = res.body.getReader();
    let received = 0;
    const chunks = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress(total ? Math.min(0.98, received / total) : 0.5);
    }
    const blob = new Blob(chunks, { type: "text/javascript" });
    await injectScript(URL.createObjectURL(blob));
    if (!window.BABYLON) throw new Error("no-global");
    onProgress(1);
  } catch (e) {
    // Fallback: plain script tag (no progress, but reliable).
    await injectScript(BABYLON_URL);
    if (!window.BABYLON) throw e;
    onProgress(1);
  }
}

const LOADERS_URL = "https://cdn.jsdelivr.net/npm/babylonjs-loaders@7/babylonjs.loaders.min.js";

async function boot() {
  initLoader();
  logStep("link established");
  try {
    await loadBabylon((f) => setProgress(f * 0.86)); // download → 0–86%
    logStep("engine loaded");
    setProgress(0.9);
    await injectScript(LOADERS_URL); // glTF loader (for the character)
    logStep("loading character");
    setProgress(0.93);
    const { startGame } = await import("./game.js"); // BABYLON now exists
    await startGame(); // resolves when the scene + character are ready
    logStep("hunters online");
    finishLoader();
  } catch (e) {
    loaderError("Couldn't load the game. Check your connection and refresh.");
  }
}

boot();
