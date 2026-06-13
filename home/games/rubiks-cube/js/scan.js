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
    if (window.cv && window.cv.Mat) {
      if (typeof window.cv.then === "function") {
        try {
          delete window.cv.then;
        } catch (e) {
          window.cv.then = undefined;
        }
      }
      return resolve(window.cv);
    }

    let s = document.querySelector(`script[src="${OPENCV_URL}"]`);

    const handleLoad = () => {
      const cv = window.cv;
      if (!cv) return reject(new Error("OpenCV missing"));

      // Wrap Emscripten custom thenables in a native Promise to prevent .catch() missing errors
      if (typeof cv === "function") {
        Promise.resolve(cv())
          .then((instance) => {
            if (instance && typeof instance.then === "function") {
              try {
                delete instance.then;
              } catch (e) {
                instance.then = undefined;
              }
            }
            window.cv = instance;
            resolve(instance);
          })
          .catch(reject);
        return;
      }

      if (cv.Mat) {
        if (typeof cv.then === "function") {
          try {
            delete cv.then;
          } catch (e) {
            cv.then = undefined;
          }
        }
        resolve(cv);
        return;
      }

      if (typeof cv.then === "function") {
        Promise.resolve(cv)
          .then((instance) => {
            const target = instance || cv;
            if (target && typeof target.then === "function") {
              try {
                delete target.then;
              } catch (e) {
                target.then = undefined;
              }
            }
            resolve(target);
          })
          .catch(reject);
        return;
      }

      cv.onRuntimeInitialized = () => {
        if (typeof cv.then === "function") {
          try {
            delete cv.then;
          } catch (e) {
            cv.then = undefined;
          }
        }
        resolve(cv);
      };
    };

    if (window.cv) {
      handleLoad();
      return;
    }

    if (!s) {
      s = document.createElement("script");
      s.src = OPENCV_URL;
      s.async = true;
      document.head.appendChild(s);
    }

    s.addEventListener("load", handleLoad);
    s.addEventListener("error", () =>
      reject(new Error("Could not load OpenCV")),
    );
  });
  return cvReady;
}

// Reference sticker colours in OpenCV HSV (H 0-179, S/V 0-255), derived from
// the game palette. White is detected by low saturation; the rest by hue.
const HUE = { D: 21, R: 0, L: 14, F: 60, B: 102 };
function classify(h, s, v) {
  if (s < 70 && v > 110) return "U"; // washed-out cream → white
  let best = "D",
    bd = 1e9;
  for (const f of Object.keys(HUE)) {
    // 180 is used as distance cap because OpenCV's 8-bit hue maxes at 180 (0-179)
    const d = Math.min(Math.abs(h - HUE[f]), 180 - Math.abs(h - HUE[f]));
    if (d < bd) {
      bd = d;
      best = f;
    }
  }
  return best;
}

// On-screen swatch colours for live feedback.
const SWATCH = {
  U: "#f7f4ec",
  D: "#f4c95d",
  R: "#f07a7a",
  L: "#f0a868",
  F: "#7cc47c",
  B: "#6fb7e8",
};
const FACE_NAMES = {
  U: "White",
  D: "Yellow",
  R: "Red",
  L: "Orange",
  F: "Green",
  B: "Blue",
};
const FACE_ORDER = ["U", "D", "R", "L", "F", "B"];

export function createScanner({
  onApply,
  onCancel,
  onSolveReady,
  onPlaySolve,
  onStepSolve,
}) {
  const $ = (id) => document.getElementById(id);

  let video = null;
  let overlay = null;
  let statusEl = null;
  let manualStatusEl = null;
  let facesEl = null;
  let manualFacesEl = null;
  let manualModalEl = null;
  let loadingEl = null;
  let editorEl = null;

  let stream = null;
  let raf = 0;
  let cv = null;
  let face = 0;
  let selectedFace = 0;
  let selectedColor = "U";
  const grids = [];
  let pending = null;
  let solveMoves = null;
  let solveIndex = 0;

  function initElements() {
    video = $("scan-video");
    overlay = $("scan-overlay");
    statusEl = $("scan-status");
    manualStatusEl = $("scan-manual-status");
    facesEl = $("scan-faces");
    manualFacesEl = $("scan-manual-faces");
    manualModalEl = $("scan-manual-modal");
    loadingEl = $("scan-loading");
    editorEl = $("scan-editor");
  }

  const btn = (a) => document.querySelector(`[data-scan="${a}"]`);

  function gridRect() {
    if (!overlay) return { x: 0, y: 0, side: 0, cell: 0 };
    const w = overlay.width,
      h = overlay.height;
    const side = Math.min(w, h) * 0.74;
    return { x: (w - side) / 2, y: (h - side) / 2, side, cell: side / 3 };
  }

  function sampleCell(ctx, g, row, col) {
    const cx = g.x + (col + 0.5) * g.cell;
    const cy = g.y + (row + 0.5) * g.cell;
    const p = Math.max(6, g.cell * 0.28);
    const sx = Math.round(cx - p / 2);
    const sy = Math.round(cy - p / 2);
    const sp = Math.round(p);
    const d = ctx.getImageData(sx, sy, sp, sp).data;
    let r = 0,
      gr = 0,
      b = 0,
      n = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i];
      gr += d[i + 1];
      b += d[i + 2];
      n++;
    }
    return [r / n, gr / n, b / n];
  }

  const rgbToHsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      df = mx - mn;
    let h = 0;
    if (df) {
      // Prevents negative modulos causing logic failure in JS
      if (mx === r) h = (g - b) / df + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / df + 2;
      else h = (r - g) / df + 4;
      h *= 60;
    }
    return [h / 2, (mx ? df / mx : 0) * 255, mx * 255];
  };

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    if (manualStatusEl) manualStatusEl.textContent = msg;
  }

  function showButtons(state) {
    const bStart = btn("start");
    const bManual = btn("manual");
    const bCapture = btn("capture");
    const bRetake = btn("retake");
    const bApply = btn("apply");
    const bManualApply = btn("manual-apply");
    const bPlay = btn("play");
    const bStep = btn("step");

    if (bStart) bStart.hidden = state !== "idle";
    if (bManual) bManual.hidden = false;
    if (bCapture) bCapture.hidden = state !== "capturing" || !stream;
    if (bRetake)
      bRetake.hidden = !(stream && (grids[selectedFace] || face > 0));
    if (bApply) bApply.hidden = state !== "review" || !pending;
    if (bManualApply) bManualApply.hidden = state !== "review" || !pending;
    if (bPlay) bPlay.hidden = state !== "solved";
    if (bStep) bStep.hidden = state !== "solved";
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!video || !video.videoWidth || !overlay) return;

    const ctx = overlay.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, overlay.width, overlay.height);
    const g = gridRect();
    ctx.lineWidth = Math.max(2, g.side * 0.012);
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(g.x + i * g.cell, g.y);
      ctx.lineTo(g.x + i * g.cell, g.y + g.side);
      ctx.moveTo(g.x, g.y + i * g.cell);
      ctx.lineTo(g.x + g.side, g.y + i * g.cell);
      ctx.stroke();
    }

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const [r, gr, b] = sampleCell(ctx, g, row, col);
        const [h, s, v] = rgbToHsv(r, gr, b);
        const lab = classify(h, s, v);
        ctx.fillStyle = SWATCH[lab];
        const rad = g.cell * 0.16;
        ctx.beginPath();
        ctx.arc(
          g.x + (col + 0.5) * g.cell,
          g.y + (row + 0.5) * g.cell,
          rad,
          0,
          2 * Math.PI,
        );
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.stroke();
      }
    }
  }

  function readFace() {
    if (!video || !overlay || !cv) return [];
    const ctx = overlay.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];

    ctx.drawImage(video, 0, 0, overlay.width, overlay.height);
    const g = gridRect();
    const src = cv.imread(overlay);
    const rgb = new cv.Mat();
    const hsv = new cv.Mat();

    try {
      cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
      cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
      const out = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const p = Math.round(g.cell * 0.34);
          let x = Math.round(g.x + (col + 0.5) * g.cell - p / 2);
          let y = Math.round(g.y + (row + 0.5) * g.cell - p / 2);

          // Clamp to ensure coordinate stays within canvas
          x = Math.max(0, Math.min(x, overlay.width - p));
          y = Math.max(0, Math.min(y, overlay.height - p));

          const roi = hsv.roi(new cv.Rect(x, y, p, p));
          const m = cv.mean(roi);
          out.push(classify(m[0], m[1], m[2]));
          roi.delete();
        }
      }
      return out;
    } finally {
      src.delete();
      rgb.delete();
      hsv.delete();
    }
  }

  function renderFaceStripInto(container, { editable = false } = {}) {
    if (!container) return;
    container.innerHTML = "";
    HOLDS.forEach((hold, i) => {
      const isComplete = isFaceComplete(i);
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className =
        "scan-face" +
        (i === face ? " active" : "") +
        (i === selectedFace ? " selected" : "") +
        (isComplete ? " done" : grids[i] ? " partial" : "");
      slot.setAttribute("aria-label", `Edit ${hold.center} face`);
      if (grids[i]) {
        slot.innerHTML = grids[i]
          .map(
            (l) =>
              `<span style="background:${l ? SWATCH[l] : "transparent"}"></span>`,
          )
          .join("");
      } else {
        slot.innerHTML = `<b>${hold.center}</b>`;
      }
      slot.onclick = () => selectFace(i, { openManual: editable });
      container.appendChild(slot);
    });
  }

  function renderFaceStrip() {
    renderFaceStripInto(facesEl, { editable: true });
    renderFaceStripInto(manualFacesEl, { editable: true });
    renderEditor();
  }

  function promptFace() {
    selectedFace = face;
    setStatus(`Face ${face + 1} of 6 — ${HOLDS[face].instr}`);
    renderFaceStrip();
  }

  function ensureGrid(i) {
    if (!grids[i]) grids[i] = Array(9).fill(null);
    grids[i][4] = HOLDS[i].center;
    return grids[i];
  }

  function isFaceComplete(i) {
    return (
      !!grids[i] && grids[i].every(Boolean) && grids[i][4] === HOLDS[i].center
    );
  }

  function allFacesComplete() {
    return HOLDS.every((_, i) => isFaceComplete(i));
  }

  function nextMissingFace() {
    const missing = HOLDS.findIndex((_, i) => !isFaceComplete(i));
    return missing === -1 ? HOLDS.length : missing;
  }

  function setManualOpen(open) {
    if (!manualModalEl) return;
    manualModalEl.hidden = !open;
  }

  function selectFace(i, { create = false, openManual = false } = {}) {
    selectedFace = i;
    if (create) ensureGrid(i);
    if (i < HOLDS.length) face = i;
    const prefix = grids[i] ? "Editing" : "Ready for";
    setStatus(`${prefix} face ${i + 1} of 6 - ${HOLDS[i].instr}`);
    if (openManual) setManualOpen(true);
    renderFaceStrip();
    showButtons(stream ? "capturing" : allFacesComplete() ? "review" : "idle");
  }

  function setSticker(cell, label) {
    const grid = ensureGrid(selectedFace);
    if (cell === 4) return;
    grid[cell] = label;
    pending = null;
    renderFaceStrip();
    finishIfComplete();
  }

  function finishIfComplete() {
    if (allFacesComplete()) {
      if (manualModalEl && !manualModalEl.hidden) {
        setManualOpen(false);
      }
      finish();
      return;
    }

    // Auto-advance logic for manual entries to reduce friction
    if (isFaceComplete(selectedFace)) {
      const next = nextMissingFace();
      if (manualModalEl && !manualModalEl.hidden) {
        selectFace(next, { create: true, openManual: true });
      } else {
        face = next;
        promptFace();
        showButtons(stream ? "capturing" : "idle");
      }
    }
  }

  function renderEditor() {
    if (!editorEl) return;
    const hold = HOLDS[selectedFace];
    if (!hold) {
      editorEl.hidden = true;
      return;
    }

    const grid = grids[selectedFace];
    editorEl.hidden = false;
    editorEl.innerHTML = `
      <div class="scan-editor-head">
        <strong>${hold.center} face</strong>
        <span>${hold.instr}</span>
      </div>
      <div class="scan-palette" aria-label="Sticker colour">
        ${FACE_ORDER.map(
          (l) => `
            <button type="button" class="scan-swatch${l === selectedColor ? " selected" : ""}"
              data-color="${l}" style="--swatch:${SWATCH[l]}" aria-label="${FACE_NAMES[l]}"></button>
          `,
        ).join("")}
      </div>
      <div class="scan-edit-grid" aria-label="Edit selected face">
        ${(grid || Array(9).fill(null))
          .map((l, i) => {
            const label = i === 4 ? hold.center : l;
            return `
              <button type="button" class="scan-cell${i === 4 ? " locked" : ""}"
                data-cell="${i}" style="--swatch:${label ? SWATCH[label] : "transparent"}"
                aria-label="Sticker ${i + 1}${label ? ` ${FACE_NAMES[label]}` : ""}">
                ${label ? "" : "+"}
              </button>
            `;
          })
          .join("")}
      </div>
    `;

    editorEl.querySelectorAll("[data-color]").forEach((b) => {
      b.addEventListener("click", () => {
        selectedColor = b.dataset.color;
        renderEditor();
      });
    });
    editorEl.querySelectorAll("[data-cell]").forEach((b) => {
      b.addEventListener("click", () => {
        const cell = Number(b.dataset.cell);
        if (cell !== 4) setSticker(cell, selectedColor);
      });
    });
  }

  function capture() {
    const labels = readFace();
    if (labels.length !== 9) {
      setStatus(
        "Could not read this face yet. Try again or enter it manually.",
      );
      return;
    }

    // Force set the intended center to prevent minor misclassification halting progression
    labels[4] = HOLDS[face].center;

    grids[face] = labels;
    selectedFace = face;
    face = nextMissingFace();

    if (face < HOLDS.length) {
      promptFace();
      showButtons("capturing");
    } else {
      finish();
    }
  }

  function finish() {
    renderFaceStrip();
    if (!allFacesComplete()) {
      face = nextMissingFace();
      setStatus(`Add face ${face + 1} of 6 - ${HOLDS[face].instr}`);
      showButtons(stream ? "capturing" : "idle");
      return;
    }
    const v = validate(grids);
    if (!v.ok) {
      setStatus("⚠ " + v.error);
      showButtons("review");
      return;
    }
    const r = reconstruct(grids);
    if (!r.ok) {
      setStatus("⚠ " + r.error);
      showButtons("review");
      return;
    }
    pending = r.targets;
    setStatus("Looks good! Tap “Apply to cube” to mirror your cube.");
    showButtons("review");
  }

  function retake() {
    pending = null;
    if (!grids[selectedFace] && face > 0) {
      selectedFace = face - 1;
    }
    delete grids[selectedFace];
    face = selectedFace;
    promptFace();
    showButtons(stream ? "capturing" : "idle");
  }

  function clearSelectedFace() {
    pending = null;
    delete grids[selectedFace];
    face = selectedFace;
    setStatus(`Cleared face ${face + 1} of 6 - ${HOLDS[face].instr}`);
    renderFaceStrip();
    showButtons(stream ? "capturing" : "idle");
  }

  function manualEntry() {
    pending = null;
    if (isFaceComplete(selectedFace) && !allFacesComplete()) {
      selectedFace = nextMissingFace();
    }
    selectFace(selectedFace, { create: true, openManual: true });
  }

  function clearSolveState() {
    solveMoves = null;
    solveIndex = 0;
  }

  function setSolveState(moves) {
    solveMoves = moves || null;
    solveIndex = 0;
    if (solveMoves && solveMoves.length) {
      setStatus(
        "Scan complete. Play the solve or click Step to follow one move at a time.",
      );
      showButtons("solved");
    } else {
      clearSolveState();
      showButtons("idle");
    }
  }

  function playSolve() {
    if (!solveMoves || !onPlaySolve) return;
    onPlaySolve();
  }

  function stepSolve() {
    if (!solveMoves || !onStepSolve) return;
    if (solveIndex >= solveMoves.length) {
      setStatus("Solve complete.");
      return;
    }
    const move = solveMoves[solveIndex];
    const advanced = onStepSolve(move);
    if (advanced) {
      solveIndex += 1;
      if (solveIndex >= solveMoves.length) setStatus("Solve complete.");
      else
        setStatus(
          `Step ${solveIndex} of ${solveMoves.length}. Click Step for the next move.`,
        );
    } else {
      setStatus("Wait for the current move to finish.");
    }
  }

  function applyPending() {
    if (!pending) return;
    const moves = onSolveReady ? onSolveReady(pending) : null;
    stop();
    onApply(pending, moves);
    setSolveState(moves);
  }

  async function startCamera() {
    initElements();
    if (!video) {
      setStatus("Camera elements could not be initialized.");
      return;
    }

    setStatus("Starting camera…");
    if (loadingEl) loadingEl.hidden = false;
    try {
      cv = await loadOpenCV();
    } catch (e) {
      setStatus("Couldn't load the vision library — check your connection.");
      if (loadingEl) loadingEl.hidden = true;
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (e) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (e2) {
        setStatus("Camera access was blocked. Allow the camera and try again.");
        if (loadingEl) loadingEl.hidden = true;
        return;
      }
    }
    if (loadingEl) loadingEl.hidden = true;

    video.setAttribute("playsinline", "true");
    video.setAttribute("muted", "true");
    video.muted = true;
    video.srcObject = stream;

    video.play().catch((err) => {
      console.warn("Video playback deferred:", err);
    });

    cancelAnimationFrame(raf);
    loop();
    const targetFace = nextMissingFace();
    face = targetFace < HOLDS.length ? targetFace : selectedFace;
    selectedFace = face;
    pending = null;
    promptFace();
    showButtons("capturing");
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (video) video.srcObject = null;
    setManualOpen(false);
  }

  function bind() {
    if (btn("start")) btn("start").onclick = startCamera;
    if (btn("manual")) btn("manual").onclick = manualEntry;
    if (btn("manual-close")) {
      btn("manual-close").onclick = () => {
        setManualOpen(false);
        if (allFacesComplete()) finish();
      };
    }
    if (btn("manual-clear")) btn("manual-clear").onclick = clearSelectedFace;
    if (btn("capture")) btn("capture").onclick = capture;
    if (btn("retake")) btn("retake").onclick = retake;
    if (btn("apply")) btn("apply").onclick = applyPending;
    if (btn("manual-apply")) btn("manual-apply").onclick = applyPending;
    if (btn("play")) btn("play").onclick = playSolve;
    if (btn("step")) btn("step").onclick = stepSolve;
    if (btn("cancel")) {
      btn("cancel").onclick = () => {
        stop();
        if (onCancel) onCancel();
      };
    }
  }

  function start() {
    initElements();
    bind();
    face = 0;
    selectedFace = 0;
    selectedColor = "U";
    grids.length = 0;
    pending = null;
    clearSolveState();
    setManualOpen(false);
    setStatus("Tap “Start camera”, then hold each face up to the dotted grid.");
    if (loadingEl) loadingEl.hidden = true;
    renderFaceStrip();
    showButtons("idle");
  }

  return { start, stop };
}
