/* ============================================================================
   Exam camera check: events only
   ----------------------------------------------------------------------------
   The student's camera is read on THEIR OWN device. No picture, no video, no sound
   is sent or stored: the only thing that leaves is a short list of notes (see
   exam-watch-core.js), a few hundred bytes for a whole exam.

     const w = createWatch({ code, send, name });
     await w.begin();     // consent cover → camera → starts looking; resolves when it is running
     w.flush(true);       // send the notes now (when the paper is checked)
     w.stop();            // exam over

   What it looks for: no face in view, more than one face, the page left, the camera
   stopped. It does NOT judge where the eyes are looking: that is too easy to get
   wrong, and a student reading their own paper looks down.

   The face finder is the TINY detector of face-api (TensorFlow.js): about 0.5 MB
   once, then kept by the browser. If it cannot be loaded (no connection to the
   library's host) the camera still opens, the page-left and camera-stopped notes
   still work, and one note says the face check could not run.

   Honest limits, which the setup page also states: this is on the student's own device, so it
   is a deterrent and a prompt for the teacher to look, not proof. Notes are "worth a look".
   ========================================================================== */

import { createTracker } from "./exam-watch-core.js";

const LIB = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.esm.js";
const MODELS = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/";

/** The default face counter: video element in, number of faces out. */
export async function loadDetector() {
  const faceapi = await import(/* @vite-ignore */ LIB);
  try { await faceapi.tf.setBackend("webgl"); await faceapi.tf.ready(); }
  catch { await faceapi.tf.setBackend("cpu"); await faceapi.tf.ready(); }
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS);
  const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 });
  return async (video) => (await faceapi.detectAllFaces(video, opts)).length;
}

const CSS = `
.pp-watch-cover { position: fixed; inset: 0; z-index: 2147482000; display: grid; place-items: center; padding: 1.2rem; background: #fbf8f1; color: #2a2723; font-family: "JetBrains Mono", ui-monospace, monospace; }
.pp-watch-cover__card { max-width: 34rem; padding: 1.6rem 1.5rem; border: 2px solid #2a2723; background: #fffdf7; box-shadow: 5px 5px 0 rgba(42, 39, 35, 0.3); }
.pp-watch-cover h2 { margin: 0 0 0.8rem; font: 800 1.1rem/1.25 "Unbounded", sans-serif; }
.pp-watch-cover p { margin: 0 0 0.7rem; font-size: 0.84rem; line-height: 1.55; }
.pp-watch-cover ul { margin: 0 0 1rem; padding-left: 1.1rem; font-size: 0.82rem; line-height: 1.6; }
.pp-watch-cover button { font: 700 0.82rem "JetBrains Mono", monospace; padding: 0.6rem 1.3rem; border: 2px solid #2a2723; background: #f4c95d; color: #2a2723; cursor: pointer; }
.pp-watch-cover button:disabled { opacity: 0.6; cursor: progress; }
.pp-watch-cover .pp-watch-cover__err { color: #b0453d; font-weight: 700; min-height: 1.2em; }
.pp-watch { position: fixed; right: 0.8rem; top: 5.4rem; z-index: 10050; width: 8rem; padding: 0.3rem; background: #fffdf7; border: 2px solid #2a2723; box-shadow: 3px 3px 0 rgba(42, 39, 35, 0.3); font: 700 0.6rem/1.3 "JetBrains Mono", monospace; color: #2a2723; pointer-events: none; }
.pp-watch video { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; background: #2a2723; transform: scaleX(-1); }
.pp-watch__row { display: flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem; }
.pp-watch__dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; background: #a39b8c; flex: none; }
.pp-watch[data-s="ok"] .pp-watch__dot { background: #5aa86a; }
.pp-watch[data-s="warn"] .pp-watch__dot { background: #e0a030; }
.pp-watch[data-s="bad"] .pp-watch__dot { background: #c9544a; }
@media print { .pp-watch, .pp-watch-cover { display: none !important; } }`;

function ensureCss() {
  if (document.getElementById("pp-watch-css")) return;
  const s = document.createElement("style");
  s.id = "pp-watch-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * @param code    the paper's code (only used to key the kept notes)
 * @param send    async ({ events, secs, checks, state, name }) → the notes go to the teacher
 * @param name    () → the name typed on the paper, if any
 * @param hold    seconds each kind of note must last (tests make these short)
 * @param every   ms between looks at the camera
 * @param load    () → Promise<(video) → Promise<number>>   the face counter (tests give a fake)
 */
export function createWatch({ code, send, name = () => "", hold, every = 1000, load = loadDetector }) {
  const tracker = createTracker(hold ? { hold } : undefined);
  let t0 = 0, stream = null, video = null, box = null, timer = 0, saveTimer = 0, detect = null, stopped = false;
  let state = "starting";        // starting | on | unavailable | stopped
  let lastSent = "";
  const t = () => (performance.now() - t0) / 1000;
  const away = () => document.hidden || !document.hasFocus();

  function paint(s, words) {
    if (!box) return;
    box.dataset.s = s;
    box.querySelector(".pp-watch__say").textContent = words;
  }

  function payload() {
    tracker.tick(t());
    return { events: tracker.notes(), secs: Math.round(t()), checks: tracker.seen(), state, name: String(name() || "").slice(0, 60) };
  }
  /** Send the notes if they have changed (or `force`). Never throws: the paper must work without it. */
  async function flush(force = false) {
    if (!t0) return;
    const p = payload();
    const key = JSON.stringify([p.events, p.state, p.name]);
    if (!force && key === lastSent) return;
    lastSent = key;
    try { await send(p); } catch { lastSent = ""; /* tried again at the next flush */ }
  }

  let looking = false;
  async function look() {
    /* one look at a time: on a slow device the next one waits rather than piling up behind this one */
    if (looking || stopped || !video || video.readyState < 2) return;
    if (away()) return;
    looking = true;
    let n;
    try { n = await detect(video); } catch { return; } finally { looking = false; }
    tracker.see(n, t());
    paint(n === 1 ? "ok" : n === 0 ? "warn" : "bad", n === 1 ? "Camera check on" : n === 0 ? "No face in view" : "More than one face");
  }

  function wire() {
    const pageAway = () => tracker.hidden(away(), t());
    document.addEventListener("visibilitychange", pageAway);
    addEventListener("blur", pageAway);
    addEventListener("focus", pageAway);
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.addEventListener("ended", () => tracker.camera(false, t()));
      track.addEventListener("mute", () => tracker.camera(false, t()));
      track.addEventListener("unmute", () => tracker.camera(true, t()));
    }
    addEventListener("pagehide", () => { tracker.tick(t()); flush(true); });
  }

  /** The consent cover, then the camera. Resolves when the check is running. */
  function begin() {
    return new Promise((resolve) => {
      ensureCss();
      const cover = document.createElement("div");
      cover.className = "pp-watch-cover";
      cover.setAttribute("role", "dialog");
      cover.setAttribute("aria-modal", "true");
      cover.setAttribute("aria-label", "This exam has a camera check");
      cover.innerHTML = `<div class="pp-watch-cover__card">
        <h2>This exam has a camera check</h2>
        <p>Your teacher has asked for one. Here is exactly what it does:</p>
        <ul>
          <li>Your camera is looked at <b>on this device only</b>.</li>
          <li><b>No picture, video or sound</b> is sent or saved, by us or by your teacher.</li>
          <li>Your teacher gets a short list of notes, such as "face not in view for 14 seconds" or "left the exam page".</li>
          <li>It only looks for a face, or more than one. It does not judge where your eyes go.</li>
        </ul>
        <p>Sit where your face is lit and in view, with nobody else in the picture.</p>
        <p class="pp-watch-cover__err" role="alert"></p>
        <button type="button">Allow the camera and begin</button></div>`;
      document.body.appendChild(cover);
      const btn = cover.querySelector("button"), err = cover.querySelector(".pp-watch-cover__err");
      btn.addEventListener("click", async () => {
        btn.disabled = true; err.textContent = "";
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error("no-camera-api"), { name: "NotSupportedError" });
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" }, audio: false });
        } catch (e) {
          btn.disabled = false;
          err.textContent = e && e.name === "NotAllowedError"
            ? "The camera was refused. Allow it from the camera icon in your browser's address bar, then press the button again."
            : e && (e.name === "NotFoundError" || e.name === "OverconstrainedError")
              ? "No camera was found on this device. This exam needs one."
              : "The camera could not be opened. Close any other app using it, then try again.";
          return;
        }
        cover.remove();
        t0 = performance.now();
        box = document.createElement("div");
        box.className = "pp-watch";
        box.setAttribute("aria-live", "polite");
        box.innerHTML = `<video muted playsinline autoplay></video><div class="pp-watch__row"><i class="pp-watch__dot"></i><span class="pp-watch__say">Starting the check…</span></div>`;
        document.body.appendChild(box);
        video = box.querySelector("video");
        video.srcObject = stream;
        video.play().catch(() => {});
        wire();
        resolve();
        /* the face finder loads after the paper is open, so the student is not kept waiting for it */
        try { detect = await load(); state = "on"; paint("ok", "Camera check on"); }
        catch { state = "unavailable"; tracker.note("no_detector", t()); paint("warn", "Face check unavailable"); }
        if (detect) timer = setInterval(look, every);
        saveTimer = setInterval(() => flush(false), 60000);
        flush(true);
      });
    });
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer); clearInterval(saveTimer);
    tracker.stop(t());
    state = "stopped";
    flush(true);
    if (stream) stream.getTracks().forEach((k) => k.stop());
    box && box.remove();
  }

  return { begin, flush, stop, tracker, state: () => state };
}
