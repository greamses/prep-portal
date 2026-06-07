/* =====================================================================
   scan.js — webcam cube scanner (OpenCV.js).

   Guides the user through six face captures, classifies the 9 stickers of
   each face (OpenCV: RGB→HSV + per-cell mean), then reconstructs the exact
   cube state (cube-state.js) and hands it back to the game to mirror.

   Snapshot sync — not live per-twist tracking (unreliable from a webcam).
   ===================================================================== */

import { HOLDS, reconstruct, validate } from "./cube-state.js";

const OPENCV_URL = "https://docs.opencv.org/4.x/opencv.js";

// Lazy-load OpenCV.js once; resolves to the `cv` module when ready.
let cvReady = null;
function loadOpenCV() {
  if (cvReady) return cvReady;
  cvReady = new Promise((resolve, reject) => {
    if (window.cv && window.cv.Mat) return resolve(window.cv);
    const s = document.createElement("script");
    s.src = OPENCV_URL;
    s.async = true;
    s.onload = () => {
      const cv = window.cv;
      if (!cv) return reject(new Error("OpenCV missing"));
      if (typeof cv.then === "function") cv.then(resolve);
      else if (cv.Mat) resolve(cv);
      else cv.onRuntimeInitialized = () => resolve(cv);
    };
    s.onerror = () => reject(new Error("Could not load OpenCV"));
    document.head.appendChild(s);
  });
  return cvReady;
}

// Reference sticker colours in OpenCV HSV (H 0-179, S/V 0-255), derived from
// the game palette. White is detected by low saturation; the rest by hue.
const HUE = { D: 21, R: 0, L: 14, F: 60, B: 102 };
function classify(h, s, v) {
  if (s < 70 && v > 110) return "U"; // washed-out cream → white
  let best = "D", bd = 1e9;
  for (const f of Object.keys(HUE)) {
    const d = Math.min(Math.abs(h - HUE[f]), 179 - Math.abs(h - HUE[f]));
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}
// On-screen swatch colours for live feedback.
const SWATCH = {
  U: "#f7f4ec", D: "#f4c95d", R: "#f07a7a",
  L: "#f0a868", F: "#7cc47c", B: "#6fb7e8",
};

export function createScanner({ onApply, onCancel }) {
  const $ = (id) => document.getElementById(id);
  const video = $("scan-video");
  const overlay = $("scan-overlay");
  const statusEl = $("scan-status");
  const facesEl = $("scan-faces");
  const loadingEl = $("scan-loading");
  const btn = (a) => document.querySelector(`[data-scan="${a}"]`);

  let stream = null;
  let raf = 0;
  let cv = null;
  let face = 0; // which HOLD we're capturing
  const grids = []; // captured face label arrays

  // grid geometry on the overlay (a centred square split 3×3)
  function gridRect() {
    const w = overlay.width, h = overlay.height;
    const side = Math.min(w, h) * 0.74;
    return { x: (w - side) / 2, y: (h - side) / 2, side, cell: side / 3 };
  }

  // average colour of a cell's central patch from the overlay canvas
  function sampleCell(ctx, g, row, col) {
    const cx = g.x + (col + 0.5) * g.cell;
    const cy = g.y + (row + 0.5) * g.cell;
    const p = Math.max(6, g.cell * 0.28);
    const d = ctx.getImageData(cx - p / 2, cy - p / 2, p, p).data;
    let r = 0, gr = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gr += d[i + 1]; b += d[i + 2]; n++; }
    return [r / n, gr / n, b / n];
  }
  const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), df = mx - mn;
    let h = 0;
    if (df) {
      if (mx === r) h = ((g - b) / df) % 6;
      else if (mx === g) h = (b - r) / df + 2;
      else h = (r - g) / df + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h / 2, (mx ? df / mx : 0) * 255, mx * 255]; // OpenCV ranges
  };

  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }
  function showButtons(state) {
    btn("start").hidden = state !== "idle";
    btn("capture").hidden = state !== "capturing";
    btn("retake").hidden = !(state === "capturing" && face > 0) && state !== "review";
    btn("apply").hidden = state !== "review";
  }

  // draw video + grid + live classification each frame
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!video.videoWidth) return;
    const ctx = overlay.getContext("2d", { willReadFrequently: true });
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, overlay.width, overlay.height);
    const g = gridRect();
    ctx.lineWidth = Math.max(2, g.side * 0.012);
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(g.x + i * g.cell, g.y); ctx.lineTo(g.x + i * g.cell, g.y + g.side);
      ctx.moveTo(g.x, g.y + i * g.cell); ctx.lineTo(g.x + g.side, g.y + i * g.cell);
      ctx.stroke();
    }
    // live swatches
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        const [r, gr, b] = sampleCell(ctx, g, row, col);
        const [h, s, v] = rgbToHsv(r, gr, b);
        const lab = classify(h, s, v);
        ctx.fillStyle = SWATCH[lab];
        const rad = g.cell * 0.16;
        ctx.beginPath();
        ctx.arc(g.x + (col + 0.5) * g.cell, g.y + (row + 0.5) * g.cell, rad, 0, 7);
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.stroke();
      }
  }

  // read the 9 cells with OpenCV (RGB→HSV, per-cell mean) and classify
  function readFace() {
    const ctx = overlay.getContext("2d", { willReadFrequently: true });
    // redraw a CLEAN frame first — the live overlay has grid + swatches drawn
    // over each cell centre, which would otherwise corrupt the sample.
    ctx.drawImage(video, 0, 0, overlay.width, overlay.height);
    const g = gridRect();
    const src = cv.imread(overlay); // RGBA
    const hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    const out = [];
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        const p = Math.round(g.cell * 0.34);
        const x = Math.round(g.x + (col + 0.5) * g.cell - p / 2);
        const y = Math.round(g.y + (row + 0.5) * g.cell - p / 2);
        const roi = hsv.roi(new cv.Rect(x, y, p, p));
        const m = cv.mean(roi);
        out.push(classify(m[0], m[1], m[2]));
        roi.delete();
      }
    src.delete(); hsv.delete();
    return out;
  }

  function renderFaceStrip() {
    if (!facesEl) return;
    facesEl.innerHTML = "";
    HOLDS.forEach((hold, i) => {
      const slot = document.createElement("div");
      slot.className = "scan-face" + (i === face ? " active" : "") + (grids[i] ? " done" : "");
      if (grids[i]) {
        slot.innerHTML = grids[i]
          .map((l) => `<span style="background:${SWATCH[l]}"></span>`)
          .join("");
      } else {
        slot.innerHTML = `<b>${hold.center}</b>`;
      }
      facesEl.appendChild(slot);
    });
  }

  function promptFace() {
    setStatus(`Face ${face + 1} of 6 — ${HOLDS[face].instr}`);
    renderFaceStrip();
  }

  function capture() {
    const labels = readFace();
    grids[face] = labels;
    face++;
    if (face < HOLDS.length) { promptFace(); showButtons("capturing"); }
    else finish();
  }

  function finish() {
    renderFaceStrip();
    const v = validate(grids);
    if (!v.ok) { setStatus("⚠ " + v.error); showButtons("review"); return; }
    const r = reconstruct(grids);
    if (!r.ok) { setStatus("⚠ " + r.error); showButtons("review"); return; }
    pending = r.targets;
    setStatus("Looks good! Tap “Apply to cube” to mirror your cube.");
    showButtons("review");
  }
  let pending = null;

  function retake() {
    // drop the most recently captured face and re-shoot it
    pending = null;
    if (face > grids.length) face = grids.length;
    if (face > 0) face--;
    grids.length = face;
    promptFace();
    showButtons("capturing");
  }

  async function startCamera() {
    setStatus("Starting camera…");
    if (loadingEl) loadingEl.hidden = false;
    try {
      cv = await loadOpenCV();
    } catch (e) {
      setStatus("Couldn't load the vision library — check your connection.");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (e) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (e2) {
        setStatus("Camera access was blocked. Allow the camera and try again.");
        return;
      }
    }
    if (loadingEl) loadingEl.hidden = true;
    video.srcObject = stream;
    await video.play().catch(() => {});
    cancelAnimationFrame(raf);
    loop();
    face = 0; grids.length = 0; pending = null;
    promptFace();
    showButtons("capturing");
  }

  function stop() {
    cancelAnimationFrame(raf); raf = 0;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (video) video.srcObject = null;
  }

  function bind() {
    if (btn("start")) btn("start").onclick = startCamera;
    if (btn("capture")) btn("capture").onclick = capture;
    if (btn("retake")) btn("retake").onclick = retake;
    if (btn("apply")) btn("apply").onclick = () => {
      if (!pending) return;
      stop();
      onApply(pending);
    };
  }

  function start() {
    bind();
    face = 0; grids.length = 0; pending = null;
    setStatus("Tap “Start camera”, then hold each face up to the dotted grid.");
    if (loadingEl) loadingEl.hidden = true;
    renderFaceStrip();
    showButtons("idle");
  }

  return { start, stop };
}
