/* ============================================================================
   PrepBoard — Kokoro, running on THIS device (a module worker)
   ----------------------------------------------------------------------------
   Kokoro-82M (Apache 2.0) through kokoro-js / Transformers.js, on the CPU
   (WebAssembly), quantised to 8 bits: about 90 MB, downloaded ONCE into the
   browser's own cache and spoken from there after — no server, no bill.
   Off the main thread, so the board keeps drawing smoothly while it talks.

     → { type: "load" }                       ← { type: "progress", pct } … { type: "ready" } | { type: "error", message }
     → { type: "say", id, text, voice }       ← { type: "audio", id, wav: ArrayBuffer } | { type: "error", id, message }
   ========================================================================== */

import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
let tts = null;
let loading = null;

/* a graphics chip (WebGPU) speaks many times faster than the processor:
   use it where there is one (the full-precision model it needs is bigger) */
async function pickDevice() {
  try {
    if (self.navigator?.gpu && (await self.navigator.gpu.requestAdapter())) return { device: "webgpu", dtype: "fp32" };
  } catch {}
  return { device: "wasm", dtype: "q8" };
}

function load() {
  if (loading) return loading;
  const files = new Map(); // file → [loaded, total]
  loading = pickDevice().then((how) => KokoroTTS.from_pretrained(MODEL, {
    ...how,
    progress_callback: (p) => {
      if (p?.status !== "progress" || !p.file) return;
      files.set(p.file, [p.loaded || 0, p.total || 0]);
      let got = 0, all = 0;
      for (const [l, t] of files.values()) { got += l; all += t; }
      if (all) self.postMessage({ type: "progress", pct: Math.min(99, Math.round((got / all) * 100)) });
    },
  })).then(async (m) => {
    tts = m;
    /* how fast is this device? seconds to make one second of speech */
    const t = performance.now();
    const a = await m.generate("Hello there, let us begin the lesson.", { voice: "af_heart" });
    const secs = (a.audio?.length || 1) / (a.sampling_rate || 24000);
    const rtf = (performance.now() - t) / 1000 / secs;
    self.postMessage({ type: "ready", rtf });
    return m;
  })
    .catch((e) => { loading = null; self.postMessage({ type: "error", message: String(e?.message || e) }); throw e; });
  return loading;
}

/* one sentence at a time, in order */
let queue = Promise.resolve();
self.onmessage = (e) => {
  const m = e.data || {};
  if (m.type === "load") { load().catch(() => {}); return; }
  if (m.type !== "say") return;
  queue = queue.then(async () => {
    try {
      const model = await load();
      const audio = await model.generate(String(m.text || "").slice(0, 1200), { voice: m.voice || "af_heart" });
      const blob = audio.toBlob();
      const wav = await blob.arrayBuffer();
      self.postMessage({ type: "audio", id: m.id, wav }, [wav]);
    } catch (err) {
      self.postMessage({ type: "error", id: m.id, message: String(err?.message || err) });
    }
  });
};
