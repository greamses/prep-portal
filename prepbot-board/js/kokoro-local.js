/* ============================================================================
   PrepBoard — the on-device Kokoro voice, seen from the page
   ----------------------------------------------------------------------------
     local.ready          true once the model is in this browser and loaded
     local.load(onPct)    start the one-time download (or load it from cache)
     local.say(text, v)   → Promise<objectURL of a WAV>
   The download is remembered (localStorage "pb-kokoro-local"), so a returning
   learner's voice loads straight from the browser's cache.
   ========================================================================== */

const KEY = "pb-kokoro-local";
let worker = null, ready = false, loadP = null, seq = 0, rtf = Infinity;
const waiting = new Map();
const pctListeners = new Set();

function boot() {
  if (worker) return worker;
  worker = new Worker(new URL("./kokoro-worker.js", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    const m = e.data || {};
    if (m.type === "progress") pctListeners.forEach((f) => f(m.pct));
    else if (m.type === "ready") { ready = true; rtf = m.rtf ?? Infinity; try { localStorage.setItem(KEY, "1"); } catch {} pctListeners.forEach((f) => f(100)); }
    else if (m.type === "audio") {
      const w = waiting.get(m.id);
      if (w) { waiting.delete(m.id); w.ok(URL.createObjectURL(new Blob([m.wav], { type: "audio/wav" }))); }
    } else if (m.type === "error") {
      if (m.id != null) { const w = waiting.get(m.id); if (w) { waiting.delete(m.id); w.no(new Error(m.message)); } }
      else { loadP?.fail?.(new Error(m.message)); loadP = null; }
    }
  };
  return worker;
}

export const local = {
  get ready() { return ready; },
  /** Fast enough to keep up with a lesson (makes speech quicker than it is spoken)? */
  get fast() { return ready && rtf < 0.9; },
  get speed() { return rtf; },
  /** Was it downloaded on this browser before? (then loading is quick) */
  get downloaded() { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } },
  supported: typeof Worker !== "undefined" && typeof WebAssembly !== "undefined",
  load(onPct) {
    if (onPct) pctListeners.add(onPct);
    if (ready) { onPct?.(100); return Promise.resolve(true); }
    if (!loadP) {
      let fail;
      const p = new Promise((res, rej) => {
        fail = rej;
        const done = (pct) => { if (pct >= 100 && ready) { pctListeners.delete(done); res(true); } };
        pctListeners.add(done);
      });
      loadP = p; p.fail = fail;
      boot().postMessage({ type: "load" });
    }
    return loadP;
  },
  say(text, voice) {
    const id = ++seq;
    return new Promise((ok, no) => {
      waiting.set(id, { ok, no });
      boot().postMessage({ type: "say", id, text, voice });
    });
  },
};
