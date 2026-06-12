/* =====================================================================
   All player input + DOM wiring: keyboard, the analog thumbstick (with
   whole-cube orientation snapping), pointer swipes / box dragging / pinch
   zoom, the on-screen keypad, and every button in the modal.
   ===================================================================== */
import * as THREE from "three";
import { VIEW, SLICES, AXIS_X, AXIS_Y } from "./constants.js";
import { S } from "./state.js";
import { canvas, carton, analog, knob } from "./dom.js";
import { camera, cubeGroup, dollyCamera, resize } from "./scene.js";
import { cartonOn, getCartonMesh, boxDraggable } from "./carton.js";
import {
  pressMove,
  releaseMove,
  rotateCube,
  ensureSolveStarted,
  openCover,
  reset,
  newScramble,
} from "./game-flow.js";
import { openModal, closeModal } from "./modal.js";
import { togglePad } from "./ui.js";
import { toggleStates, selectState } from "./practice.js";
import {
  togglePlaySolve,
  stepScanSolve,
  selectSolveMethod,
  startTemplateSolve,
  jumpToPhase,
  prevPhase,
  nextPhase,
  toggleAttemptMode,
  toggleFocusMode,
  scanState,
} from "./scan-play.js";

/* ---------- prime / front-back toggles ------------------------------ */
const primeBtn = document.querySelector('[data-act="prime"]');
let prime = false;
function setPrime(on) {
  prime = on;
  if (primeBtn) primeBtn.setAttribute("aria-pressed", String(on));
}

const faceGroup = document.querySelector(".pad-face-group");
const fbBtn = document.querySelector('[data-act="fb-toggle"]');
let faceBack = false;
function setFaceBack(on) {
  faceBack = on;
  if (faceGroup) faceGroup.classList.toggle("fb-back", on);
  if (fbBtn) {
    fbBtn.setAttribute("aria-pressed", String(on));
    const lbl = fbBtn.querySelector(".fb-toggle-label");
    if (lbl) lbl.textContent = "Centre: " + (on ? "B" : "F");
  }
}

/* ---------- keyboard ------------------------------------------------- */
const ARROW_FACES = {
  ArrowLeft: "L",
  ArrowRight: "R",
  ArrowUp: "U",
  ArrowDown: "D",
};

window.addEventListener("keydown", (e) => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  if (!S.modalOpen) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal("challenge");
    }
    return;
  }

  if (!e.key) return;
  const upper = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  const rotateKeys = {
    W: "up",
    A: "left",
    S: "down",
    D: "right",
  };

  if (ARROW_FACES[e.key]) {
    e.preventDefault();
    // In scan/solve mode: Up/Down navigate stages; Left/Right step moves.
    // In attempt mode arrows fall through to normal face-turn behavior.
    if (scanState.phases.length && !scanState.attemptMode) {
      if (!e.repeat) {
        if (e.key === "ArrowLeft")  { stepScanSolve(-1); return; }
        if (e.key === "ArrowRight") { stepScanSolve(1);  return; }
        if (e.key === "ArrowUp")    { prevPhase(); return; }
        if (e.key === "ArrowDown")  { nextPhase(); return; }
      }
      return;
    }
    if (!e.repeat)
      pressMove(ARROW_FACES[e.key], ARROW_FACES[e.key], 1, e.shiftKey);
    return;
  }
  if (e.key === " ") {
    e.preventDefault();
    const letter = e.altKey ? "B" : "F";
    if (!e.repeat) pressMove(letter, letter, 1, e.shiftKey);
    return;
  }
  if (rotateKeys[upper]) {
    e.preventDefault();
    if (!e.repeat) rotateCube(rotateKeys[upper]);
    return;
  }

  if (VIEW[upper]) {
    e.preventDefault();
    if (!e.repeat) pressMove(upper, upper, 1, e.shiftKey);
    return;
  }
  if (SLICES[upper]) {
    e.preventDefault();
    if (!e.repeat) pressMove(upper, SLICES[upper], 0, e.shiftKey);
    return;
  }

  if (e.repeat) return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      openCover();
      break;
    case "Enter":
      e.preventDefault();
      reset();
      break;
    case "Escape":
      closeModal();
      break;
  }
});

window.addEventListener("keyup", (e) => {
  if (!e.key) return;
  const upper = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (ARROW_FACES[e.key] || VIEW[upper] || SLICES[upper] || e.key === " ") releaseMove();
});
window.addEventListener("blur", () => {
  releaseMove();
});

/* ---------- analog thumbstick (whole-cube rotation) ----------------- */
const rotModeBtn = document.querySelector('[data-act="rot-mode"]');

let stickPointer = null;
let stickCx = 0;
let stickCy = 0;
let stickMax = 30;
let stepLatchDir = null;
let stepRepeat = null;

function quatKey(q) {
  const a = [q.w, q.x, q.y, q.z];
  let s = 1;
  for (const v of a)
    if (Math.abs(v) > 1e-4) {
      s = v < 0 ? -1 : 1;
      break;
    }
  return a.map((v) => Math.round(v * s * 1000)).join(",");
}
function buildCubeOrientations() {
  const gens = [
    new THREE.Quaternion().setFromAxisAngle(AXIS_X, Math.PI / 2),
    new THREE.Quaternion().setFromAxisAngle(AXIS_Y, Math.PI / 2),
  ];
  const out = [new THREE.Quaternion()];
  const seen = new Set([quatKey(out[0])]);
  for (let i = 0; i < out.length; i++) {
    for (const g of gens) {
      const q = new THREE.Quaternion().multiplyQuaternions(g, out[i]);
      const k = quatKey(q);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(q);
      }
    }
  }
  return out;
}
const CUBE_ORIENTATIONS = buildCubeOrientations();

function nearestOrientation(q) {
  let best = CUBE_ORIENTATIONS[0];
  let bestDot = -1;
  for (const o of CUBE_ORIENTATIONS) {
    const d = Math.abs(q.dot(o));
    if (d > bestDot) {
      bestDot = d;
      best = o;
    }
  }
  return best;
}

const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

let snapTweenId = null;
function snapCubeOrientation() {
  if (snapTweenId) cancelAnimationFrame(snapTweenId);
  const fromQ = cubeGroup.quaternion.clone();
  const target = nearestOrientation(fromQ).clone();
  if (fromQ.dot(target) < 0)
    target.set(-target.x, -target.y, -target.z, -target.w);
  const start = performance.now();
  const dur = 280;
  (function step(now) {
    const t = Math.min((now - start) / dur, 1);
    cubeGroup.quaternion.copy(fromQ).slerp(target, easeOutBack(t));
    if (t < 1) {
      snapTweenId = requestAnimationFrame(step);
    } else {
      cubeGroup.quaternion.copy(target);
      snapTweenId = null;
    }
  })(start);
}

function setRotMode(mode) {
  if (mode === "step" && S.rotMode === "free") snapCubeOrientation();
  S.rotMode = mode;
  if (rotModeBtn) {
    rotModeBtn.setAttribute("aria-pressed", String(mode === "free"));
    const lbl = rotModeBtn.querySelector(".rot-mode-label");
    if (lbl) lbl.textContent = mode === "free" ? "FREE SPIN" : "STEP 90°";
  }
}

function fireStep(dir) {
  rotateCube(dir);
  clearTimeout(stepRepeat);
  stepRepeat = setTimeout(function rep() {
    if (stepLatchDir === dir) {
      rotateCube(dir);
      stepRepeat = setTimeout(rep, 320);
    }
  }, 360);
}

function stickStart(e) {
  if (S.scrambling || cartonOn()) return;
  if (snapTweenId) {
    cancelAnimationFrame(snapTweenId);
    snapTweenId = null;
  }
  stickPointer = e.pointerId;
  const r = analog.getBoundingClientRect();
  stickCx = r.left + r.width / 2;
  stickCy = r.top + r.height / 2;
  stickMax = r.width * 0.32;
  S.stickEngaged = true;
  analog.classList.add("dragging");
  if (analog.setPointerCapture) analog.setPointerCapture(e.pointerId);
  if (S.rotMode === "free" && S.gameMode === "challenge" && !S.inspecting)
    ensureSolveStarted();
  stickMove(e);
}

function stickMove(e) {
  if (stickPointer !== e.pointerId) return;
  const dx = e.clientX - stickCx;
  const dy = e.clientY - stickCy;
  const len = Math.hypot(dx, dy) || 1;
  const cl = Math.min(len, stickMax);
  const ux = dx / len;
  const uy = dy / len;
  knob.style.transform = `translate(${ux * cl}px, ${uy * cl}px)`;
  const mag = cl / stickMax;
  S.stickNX = ux * mag;
  S.stickNY = -uy * mag;

  if (S.rotMode === "step") {
    if (mag > 0.55) {
      const dir =
        Math.abs(S.stickNX) > Math.abs(S.stickNY)
          ? S.stickNX > 0
            ? "right"
            : "left"
          : S.stickNY > 0
            ? "up"
            : "down";
      if (dir !== stepLatchDir) {
        stepLatchDir = dir;
        fireStep(dir);
      }
    } else {
      stepLatchDir = null;
      clearTimeout(stepRepeat);
      stepRepeat = null;
    }
  }
}

function stickEnd(e) {
  if (stickPointer !== e.pointerId) return;
  stickPointer = null;
  S.stickEngaged = false;
  S.stickNX = 0;
  S.stickNY = 0;
  stepLatchDir = null;
  clearTimeout(stepRepeat);
  stepRepeat = null;
  analog.classList.remove("dragging");
  knob.style.transform = "translate(0px, 0px)";
  if (S.rotMode === "free") snapCubeOrientation();
}

if (analog) {
  analog.addEventListener("pointerdown", stickStart);
  analog.addEventListener("pointermove", stickMove);
  ["pointerup", "pointercancel"].forEach((ev) =>
    analog.addEventListener(ev, stickEnd),
  );
}
if (rotModeBtn)
  rotModeBtn.addEventListener("click", () =>
    setRotMode(S.rotMode === "step" ? "free" : "step"),
  );

/* ---------- pointer + wheel ----------------------------------------- */
const SWIPE = 42;
let downX = 0;
let downY = 0;
let swiping = false;

const touchPts = new Map();
let pinching = false;
let pinchDist = 0;

const raycaster = new THREE.Raycaster();
const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const ndc = new THREE.Vector2();
const camDir = new THREE.Vector3();
let draggingBox = false;

function setNDC(e) {
  const r = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

canvas.addEventListener("pointerdown", (e) => {
  touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (touchPts.size === 2) {
    pinching = true;
    swiping = false;
    draggingBox = false;
    const p = [...touchPts.values()];
    pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    return;
  }
  if (boxDraggable()) {
    const cartonMesh = getCartonMesh();
    setNDC(e);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(cartonMesh, false);
    if (hit.length) {
      draggingBox = true;
      camera.getWorldDirection(camDir);
      dragPlane.setFromNormalAndCoplanarPoint(camDir, cartonMesh.position);
      dragOffset.copy(hit[0].point).sub(cartonMesh.position);
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }
  swiping = true;
  downX = e.clientX;
  downY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (touchPts.has(e.pointerId))
    touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinching && touchPts.size >= 2) {
    const p = [...touchPts.values()];
    const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    if (pinchDist) dollyCamera(-(d - pinchDist) * 0.02);
    pinchDist = d;
    return;
  }
  if (!draggingBox) return;
  const cartonMesh = getCartonMesh();
  setNDC(e);
  raycaster.setFromCamera(ndc, camera);
  const pt = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(dragPlane, pt)) {
    pt.sub(dragOffset);
    const behindZ = -1.9;
    if (pt.z > behindZ) pt.z = behindZ;
    cartonMesh.position.copy(pt);
  }
});
function endCanvasPointer(e) {
  touchPts.delete(e.pointerId);
  if (touchPts.size < 2) {
    pinching = false;
    pinchDist = 0;
  }
}
canvas.addEventListener("pointerup", (e) => {
  endCanvasPointer(e);
  if (draggingBox) {
    draggingBox = false;
    return;
  }
  if (pinching || !swiping) {
    swiping = false;
    return;
  }
  swiping = false;
  const dx = e.clientX - downX;
  const dy = e.clientY - downY;
  if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
  if (Math.abs(dx) > Math.abs(dy)) rotateCube(dx > 0 ? "left" : "right");
  else rotateCube(dy > 0 ? "up" : "down");
});
canvas.addEventListener("pointercancel", (e) => {
  endCanvasPointer(e);
  swiping = false;
  draggingBox = false;
});
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    dollyCamera(e.deltaY * 0.006);
  },
  { passive: false },
);

/* ---------- on-screen keypad + buttons ------------------------------ */
function wirePress(b, notation, letter, layer) {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pressMove(notation, letter, layer, prime);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
    b.addEventListener(ev, releaseMove),
  );
}
document
  .querySelectorAll("[data-face]")
  .forEach((b) => wirePress(b, b.dataset.face, b.dataset.face, 1));
document
  .querySelectorAll("[data-slice]")
  .forEach((b) => wirePress(b, b.dataset.slice, SLICES[b.dataset.slice], 0));

const startBtns = document.querySelectorAll('[data-act="start"]');
startBtns.forEach((b) =>
  b.addEventListener("click", () => {
    if (b.classList.contains("mode-switch-btn")) {
      startBtns.forEach((o) =>
        o.classList.toggle("mode-switch-btn--active", o === b),
      );
    }
    setTimeout(() => openModal(b.dataset.mode || "challenge"), 320);
  }),
);
document
  .querySelectorAll('[data-act="exit"]')
  .forEach((b) => b.addEventListener("click", closeModal));
document
  .querySelectorAll('[data-act="scramble"]')
  .forEach((b) => b.addEventListener("click", newScramble));
document
  .querySelectorAll('[data-act="reset"]')
  .forEach((b) => b.addEventListener("click", reset));
if (carton) carton.addEventListener("click", openCover);
if (primeBtn) primeBtn.addEventListener("click", () => setPrime(!prime));
if (fbBtn) fbBtn.addEventListener("click", () => setFaceBack(!faceBack));
const padFabBtn = document.querySelector('[data-act="pad-toggle"]');
if (padFabBtn) padFabBtn.addEventListener("click", togglePad);
document
  .querySelectorAll('[data-act="states"]')
  .forEach((b) => b.addEventListener("click", toggleStates));
document
  .querySelectorAll("[data-state]")
  .forEach((b) =>
    b.addEventListener("click", () => selectState(b.dataset.state)),
  );

// --- SCANNER UI: learn without a cube (random Kociemba scramble) ---
document.querySelectorAll('[data-scan="template"]').forEach((b) => {
  b.addEventListener("click", () => {
    if (S.gameMode === "scan") startTemplateSolve();
  });
});

// --- SCANNER UI: method picker ---
document.querySelectorAll('[data-act="solve-method"]').forEach((b) => {
  b.addEventListener("click", () => {
    if (S.gameMode === "scan") selectSolveMethod(b.dataset.method);
  });
});

// --- SCANNER UI PLAYBACK CONTROLS ---
document.querySelectorAll('[data-act="play-solve"]').forEach((b) => {
  b.addEventListener("click", () => {
    if (S.gameMode === "scan") togglePlaySolve();
  });
});

document
  .querySelectorAll('[data-act="next-solve"], [data-act="step-solve"]')
  .forEach((b) => {
    b.addEventListener("click", () => {
      if (S.gameMode !== "scan" || !scanState.moves) return;
      if (S.playingSolve) togglePlaySolve(); // Auto-pause if user manually clicks next
      stepScanSolve(1);
    });
  });

document.querySelectorAll('[data-act="prev-solve"]').forEach((b) => {
  b.addEventListener("click", () => {
    if (S.gameMode !== "scan" || !scanState.moves) return;
    if (S.playingSolve) togglePlaySolve();
    stepScanSolve(-1);
  });
});

document.querySelectorAll('[data-act="prev-phase"]').forEach((b) => {
  b.addEventListener("click", () => {
    if (S.gameMode === "scan") prevPhase();
  });
});

document.querySelectorAll('[data-act="next-phase"]').forEach((b) => {
  b.addEventListener("click", () => {
    if (S.gameMode === "scan") nextPhase();
  });
});

document.getElementById("attempt-toggle")?.addEventListener("click", () => {
  if (S.gameMode === "scan") toggleAttemptMode();
});

document.getElementById("focus-toggle")?.addEventListener("click", () => {
  if (S.gameMode === "scan") toggleFocusMode();
});

window.addEventListener("resize", resize);
