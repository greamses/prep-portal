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
import { makeCover } from "/utils/components/pp-cover.js";

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

/* Only the PLACEMENT of the self-view is ours: it is a .pp-sticky (paper, tape-free, soft shadow) with a
   .pp-pill under the video, so the look is the site's own. Two classes, because .pp-sticky sets
   `position: relative` and ties and loses to a single one. */
const CSS = `
.pp-watch.pp-sticky { position: fixed; right: 0.9rem; top: 5.6rem; z-index: 10050; width: 9rem; padding: 0.45rem 0.45rem 0.5rem; pointer-events: none; --pp-note-tilt: 2deg; }
.pp-watch video { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; background: var(--surface-secondary, #f4f0e8); transform: scaleX(-1); }
.pp-watch .pp-pill { margin-top: 0.4rem; width: 100%; justify-content: center; font-size: 0.56rem; padding: 0.25rem 0.3rem; white-space: normal; text-align: center; line-height: 1.2; }
@media print { .pp-watch { display: none !important; } }`;

function ensureCss() {
  if (document.getElementById("pp-watch-css")) return;
  const el = document.createElement("style");
  el.id = "pp-watch-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/**
 * @param code    the paper's code (only used to key the kept notes)
 * @param send    async ({ events, secs, checks, state, name }) → the notes go to the teacher
 * @param name    () → the name typed on the paper, if any
 * @param camera  false: no camera at all, only the page-left notes (every shared paper is guarded against leaving the page)
 * @param onWarn  (kind, info) a warning is due: the voice says it, and a page left is shown to the student
 * @param test    a test run for the teacher: the same consent and self-view, nothing sent, nothing kept
 * @param hold    seconds each kind of note must last (tests make these short)
 * @param every   ms between looks at the camera
 * @param load    () → Promise<(video) → Promise<number>>   the face counter (tests give a fake)
 */
export function createWatch({ code, send, name = () => "", hold, every = 1000, load = loadDetector, test = false, camera = true, onWarn = () => {} }) {
  const tracker = createTracker({ ...(hold ? { hold } : {}), onWarn: (k, info) => { if (active) onWarn(k, info); } });
  let active = true;               // false once the paper is checked: nothing is warned or noted until it is sat again
  let t0 = 0, stream = null, video = null, box = null, timer = 0, saveTimer = 0, detect = null, stopped = false;
  let state = "starting";        // starting | on | unavailable | stopped
  let lastSent = "";
  const t = () => (performance.now() - t0) / 1000;
  const away = () => document.hidden || !document.hasFocus();

  function paint(s, words) {
    if (!box) return;
    box.dataset.s = s;
    const pill = box.querySelector(".pp-pill");
    pill.classList.remove("pp-pill--ok", "pp-pill--warn", "pp-pill--danger");
    pill.classList.add(s === "ok" ? "pp-pill--ok" : s === "bad" ? "pp-pill--danger" : "pp-pill--warn");
    pill.textContent = words;
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
    if (looking || stopped || !active || !video || video.readyState < 2) return;
    if (away()) return;
    looking = true;
    let n;
    try { n = await detect(video); } catch { return; } finally { looking = false; }
    tracker.see(n, t());
    paint(n === 1 ? "ok" : n === 0 ? "warn" : "bad", n === 1 ? "Camera check on" : n === 0 ? "No face in view" : "More than one face");
  }

  function wire() {
    const pageAway = () => { if (active) tracker.hidden(away(), t()); };
    document.addEventListener("visibilitychange", pageAway);
    addEventListener("blur", pageAway);
    addEventListener("focus", pageAway);
    const track = stream && stream.getVideoTracks()[0];
    if (track) {
      track.addEventListener("ended", () => active && tracker.camera(false, t()));
      track.addEventListener("mute", () => active && tracker.camera(false, t()));
      track.addEventListener("unmute", () => active && tracker.camera(true, t()));
    }
    addEventListener("pagehide", () => { tracker.tick(t()); flush(true); });
  }

  /** The consent cover, then the camera. Resolves when the check is running. */
  function begin() {
    /* no camera on this paper: only the page is watched (left, or not); nothing to ask for */
    if (!camera) {
      t0 = performance.now();
      state = "on";
      wire();
      saveTimer = setInterval(() => flush(false), 60000);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      ensureCss();
      const { root: cover, paper } = makeCover({ label: "This exam has a camera check", tag: test ? "Test run" : "Camera check", colour: test ? 4 : 3 });
      paper.innerHTML = `<h2 class="pp-cover__title">${test ? "Camera check: a test run" : "This exam has a camera check"}</h2>
        <p class="pp-cover__text">${test ? "This is what your students see and what runs on their device. While you test, nothing is recorded and nothing is sent to anyone." : "Your teacher has asked for one. Here is exactly what it does:"}</p>
        <ul class="pp-cover__list">
          <li>Your camera is looked at <b>on this device only</b>.</li>
          <li><b>No picture, video or sound</b> is sent or saved, by us or by your teacher.</li>
          <li>Your teacher gets a short list of notes, such as "face not in view for 14 seconds" or "left the exam page".</li>
          <li>It only looks for a face, or more than one. It does not judge where your eyes go.</li>
        </ul>
        <p class="pp-cover__text">Sit where your face is lit and in view, with nobody else in the picture.</p>
        <p class="pp-cover__err" role="alert"></p>
        <div class="pp-cover__go"><button type="button" class="pp-btn">${test ? "Allow the camera and test" : "Allow the camera and begin"}</button></div>`;
      const btn = cover.querySelector("button"), err = cover.querySelector(".pp-cover__err");
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
        box.className = "pp-watch pp-sticky pp-sticky--c3";
        box.setAttribute("aria-live", "polite");
        box.innerHTML = `<video muted playsinline autoplay></video><span class="pp-pill pp-pill--static pp-pill--warn">Starting the check…</span>`;
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

  return {
    begin, flush, stop, tracker, state: () => state,
    /** Pause (the paper was checked) or resume (it is being sat again): while paused nothing is warned or noted. */
    setActive(v) { active = !!v; },
    leaves: () => tracker.leaves(),
  };
}
