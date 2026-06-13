/* =====================================================================
   Scan mode glue — apply a scanned cube state onto the 3D cube, then offer
   three auto-solve methods and drive the step/auto playback.

     • Beginner  — layer-by-layer, explained phase by phase
     • F2L       — CFOP first-two-layers (cross + paired slots), explained
     • Fast      — Kociemba two-phase (min2phase), fewest moves, no commentary

   The chosen method's solution is grouped into named phases; the step-list
   panel highlights the phase currently playing.
   ===================================================================== */
import * as THREE from "three";
import { SP, TURN_MS, BLACKOUT } from "./constants.js";
import { cubies, resize, cubeGroup } from "./scene.js";
import { S } from "./state.js";
import { queue, enqueue } from "./engine.js";
import { parseMoves } from "./moves.js";
import { solveExplained, _t } from "./solve.js";
import Cube, { solveFast } from "./min2phase.js";
import { toFacelets, faceletsToTargets } from "./cube-state.js";
import { createScanner } from "./scan.js";
import { buildSolveThumbs } from "./thumbs.js";
import { setStatus } from "./ui.js";
import { modal, movesEl } from "./dom.js";
import { closeModal } from "./modal.js";
import { phaseComplete } from "./phase-check.js";

const METHOD_LABELS = {
  beginner: "Beginner",
  f2l: "F2L (CFOP)",
  roux: "Roux",
  zz: "ZZ",
  petrus: "Petrus",
  fast: "Fast",
};

// Each solve phase → the stage diagram that best pictures it. F2L pairs all
// build the first two layers; Fast shows the finished cube.
const PHASE_THUMB = {
  cross: "cross",
  corners: "first",
  middle: "second",
  f2l1: "second", f2l2: "second", f2l3: "second", f2l4: "second",
  llcross: "llcross",
  lledges: "lledges",
  llcorners: "full",
  oll: "oll",
  pll: "pll",
  fast: "full",
  // ZZ
  eoline: "cross", zzedges: "cross", zzleft: "second", zzright: "second",
  // Petrus
  p222: "first", p223: "second", pright: "second",
  // Roux
  fb1: "first", fb2: "first", sb1: "second", sb2: "second",
  cmll: "oll", lse: "full",
};
let _solveThumbs = null;
const solveThumbs = () => (_solveThumbs ||= buildSolveThumbs());

/* ---------- apply a scanned state onto the cube --------------------- */
function applyCubieState(targets) {
  const byHome = new Map(targets.map((t) => [t.home.join(","), t]));
  const m = new THREE.Matrix4();
  let idx = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const c = cubies[idx++];
        const t = byHome.get([x, y, z].join(","));
        if (!t) continue;
        c.position.set(t.pos[0] * SP, t.pos[1] * SP, t.pos[2] * SP);
        const R = t.rot;
        m.set(
          R[0][0], R[0][1], R[0][2], 0,
          R[1][0], R[1][1], R[1][2], 0,
          R[2][0], R[2][1], R[2][2], 0,
          0, 0, 0, 1,
        );
        c.quaternion.setFromRotationMatrix(m);
      }
  cubeGroup.quaternion.identity();
}

// Convert a solve.js internal state back to an applyCubieState-compatible targets array.
function stateToTargets(st) {
  return st.m.map((p) => ({
    home: p.home.slice(),
    pos:  p.pos.slice(),
    rot:  p.O.map((r) => r.slice()),
  }));
}

// Compute the cube targets at the START of each phase by virtually applying
// moves using the solve.js state engine (no Three.js involved).
function computePhaseTargets(initialTargets, phases) {
  const { makeState, alg: algSolve } = _t;
  const pts = [initialTargets]; // pts[i] = cube state at start of phase i
  const st = makeState(initialTargets);
  for (const ph of phases) {
    algSolve(st, ph.moves.join(" "));
    pts.push(stateToTargets(st));
  }
  return pts; // pts[phases.length] = solved state
}

let scanner = null;
const scanState = {
  method: "beginner",
  targets: null,       // the scanned state (for re-solving with another method)
  phases: [],          // [{ id, label, detail, algo, why, moves:[tok,…] }]
  phaseTargets: [],    // cube targets at the start of each phase (+ solved end)
  moves: [],           // flat list of parsed move objects
  movePhase: [],       // phase index for each flat move
  index: 0,
  attemptMode: false,  // false = watch, true = attempt
  watchPhase: -1,      // if ≥ 0, playback stops at end of this phase (single-stage watch)
  focusMode: false,    // if true, dim stickers not relevant to the active phase
};
export { scanState };

// Wipe all solve state safely (manual interruption, mode change, close).
export function clearSolution() {
  scanState.method = "beginner";
  scanState.targets = null;
  scanState.phases = [];
  scanState.phaseTargets = [];
  scanState.moves = [];
  scanState.movePhase = [];
  scanState.index = 0;
  scanState.watchPhase = -1;
  scanState.attemptMode = false;
  scanState.focusMode = false;
  S.playingSolve = false;

  const playBtn = document.querySelector('[data-act="play-solve"]');
  if (playBtn) playBtn.setAttribute("aria-pressed", "false");
  const controls = document.getElementById("solve-controls");
  if (controls) {
    controls.hidden = true;
    resetDragPosition(controls);
  }
  const list = document.getElementById("solve-steps");
  if (list) list.innerHTML = "";
  const cap = document.getElementById("solve-caption");
  if (cap) {
    cap.hidden = true;
    resetDragPosition(cap);
    cap.style.background = "";
  }
  _stopFlash();
  _lastFlashPhase = -2;
  _setAttemptUI(false);
  _clearFocusColors();
  _setFocusUI(false);
  if (modal) modal.classList.remove("has-solution", "states-open");
}

/* ---------- compute a solution for a given method ------------------- */
// Stores the result in scanState and returns the flat parsed-move list, or
// null if the method couldn't solve this state.
function computeScanSolution(targets, method) {
  scanState.targets = targets;
  let phases;
  if (method === "fast") {
    const sol = solveFast(toFacelets(targets));
    if (sol == null) return null;
    const toks = sol.split(/\s+/).filter(Boolean);
    phases = [{ id: "fast", label: "Fastest solve", detail: "", moves: toks }];
  } else {
    const res = solveExplained(targets, method);
    if (!res) return null;
    phases = res.phases;
  }

  scanState.method = method;
  scanState.phases = phases;
  scanState.phaseTargets = computePhaseTargets(targets, phases);
  scanState.moves = [];
  scanState.movePhase = [];
  phases.forEach((ph, pi) => {
    for (const tok of ph.moves) {
      const parsed = parseMoves(tok)[0];
      if (!parsed) continue;
      scanState.moves.push(parsed);
      scanState.movePhase.push(pi);
    }
  });
  scanState.index = 0;
  scanState.watchPhase = -1;
  return scanState.moves;
}

// Compute `method`, but fall back to Fast (Kociemba — always solvable) for the
// rare states the layer-by-layer solver can't crack. Returns true if the
// resulting method differs from the one asked for (i.e. a fallback happened).
function computeWithFallback(targets, method) {
  if (computeScanSolution(targets, method)) return false;
  if (method !== "fast" && computeScanSolution(targets, "fast")) return true;
  return false;
}

/* ---------- jump to a specific phase -------------------------------- */
// Teleport the cube to the start of phase `i` and set the play-head there.
export function jumpToPhase(i) {
  if (S.animating) return;
  if (S.playingSolve) togglePlaySolve(); // pause first
  queue.length = 0;
  const pt = scanState.phaseTargets[i];
  if (!pt) return;
  applyCubieState(pt);
  // Set index to the first move of phase i
  scanState.index = scanState.movePhase.findIndex((pi) => pi === i);
  if (scanState.index < 0) scanState.index = scanState.moves.length; // last/only phase
  updateActivePhase();
}

// Jump to the phase before/after the current active one.
export function prevPhase() {
  const cur = activePhaseIndex();
  jumpToPhase(Math.max(0, cur - 1));
}
export function nextPhase() {
  const cur = activePhaseIndex();
  const next = Math.min(scanState.phases.length - 1, cur + 1);
  jumpToPhase(next);
}

/* ---------- step-list panel ----------------------------------------- */
function renderSolvePanel() {
  const methodsWrap = document.getElementById("solve-methods");
  if (methodsWrap)
    methodsWrap
      .querySelectorAll("[data-method]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.method === scanState.method)),
      );

  const panel = document.getElementById("solve-panel");
  if (panel) panel.classList.toggle("method-fast", scanState.method === "fast");

  const list = document.getElementById("solve-steps");
  if (!list) return;
  list.innerHTML = "";
  const thumbs = solveThumbs();
  scanState.phases.forEach((ph, i) => {
    const src = thumbs[PHASE_THUMB[ph.id]] || thumbs.full || "";
    // Each step is a button — clicking jumps to that phase
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "solve-step";
    btn.dataset.phase = String(i);
    btn.setAttribute("aria-label", `Jump to: ${ph.label}`);
    btn.innerHTML =
      `<span class="solve-step-thumb"><img alt="" src="${src}" /></span>` +
      '<div class="solve-step-body">' +
      '<div class="solve-step-head">' +
      `<span class="solve-step-label">${ph.label}</span>` +
      `<span class="solve-step-count">${ph.moves.length}</span>` +
      "</div>" +
      "</div>";
    btn.addEventListener("click", () => {
      jumpToPhase(i);
      scanState.watchPhase = i; // single-stage watch mode
      if (scanState.attemptMode) startAttempt(i);
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
  updateActivePhase();
}

// Phase index of the move about to play (phases.length once finished).
function activePhaseIndex() {
  if (scanState.index >= scanState.moves.length) return scanState.phases.length;
  return scanState.movePhase[scanState.index];
}

// Paper colours cycle per phase (warm receipt palette)
const PAPER_COLORS = ["#ffe7a6", "#bce0fb", "#ffc6c6", "#c2ecbb", "#ffd5a6", "#e3c9fb"];

// On-screen caption: receipt-paper ticket with thumbnail, shown over the cube
// so the learner can read along. Draggable; fades while the cube is turning.
let capRaf = 0;
function watchCaption(cap) {
  cancelAnimationFrame(capRaf);
  const tickFn = () => {
    cap.classList.toggle("faded", S.animating || queue.length > 0);
    if (!cap.hidden) capRaf = requestAnimationFrame(tickFn);
  };
  capRaf = requestAnimationFrame(tickFn);
}

// Make a floating block draggable. CSS centres these blocks with
// left:50% + translateX; the first drag converts that to pixel top/left.
// `ignoreButtons` lets the playback controls keep their buttons clickable.
function makeDraggable(el, { ignoreButtons = false } = {}) {
  let dragging = false, ox = 0, oy = 0;
  el.addEventListener("pointerdown", (e) => {
    if (ignoreButtons && e.target.closest("button")) return;
    if (!el.dataset.dragged) {
      const r = el.getBoundingClientRect();
      el.style.left = r.left + "px";
      el.style.top = r.top + "px";
      el.style.bottom = "auto";
      el.style.transform = "none";
      el.dataset.dragged = "1";
    }
    dragging = true;
    ox = e.clientX - parseFloat(el.style.left);
    oy = e.clientY - parseFloat(el.style.top);
    el.classList.add("dragging");
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    el.style.left = e.clientX - ox + "px";
    el.style.top = e.clientY - oy + "px";
  });
  ["pointerup", "pointercancel"].forEach((ev) =>
    el.addEventListener(ev, () => {
      dragging = false;
      el.classList.remove("dragging");
    }),
  );
}

// reset a dragged block back to its CSS-defined position
function resetDragPosition(el) {
  if (!el) return;
  el.style.left = "";
  el.style.top = "";
  el.style.bottom = "";
  el.style.transform = "";
  delete el.dataset.dragged;
}

let _dragInit = false;
function initCaptionDrag() {
  if (_dragInit) return;
  _dragInit = true;
  const cap = document.getElementById("solve-caption");
  if (cap) makeDraggable(cap);
  const controls = document.getElementById("solve-controls");
  if (controls) makeDraggable(controls, { ignoreButtons: true });
}

// The phase's moves as tokens, with the move about to play highlighted.
// Long sequences (beginner LL) show a sliding window around the current move.
function movesTokensHTML(ph, phaseIdx) {
  const toks = ph.moves;
  if (!toks.length) return "";
  const first = scanState.movePhase.findIndex((pi) => pi === phaseIdx);
  const cur = first < 0 ? -1 : scanState.index - first;
  let lo = 0, hi = toks.length;
  if (toks.length > 16) {
    lo = Math.max(0, Math.min(cur - 6, toks.length - 14));
    hi = Math.min(toks.length, lo + 14);
  }
  const parts = [];
  if (lo > 0) parts.push('<span class="tok-gap">…</span>');
  for (let i = lo; i < hi; i++)
    parts.push(
      `<span class="tok${i === cur ? " cur" : i < cur ? " done" : ""}">${toks[i]}</span>`,
    );
  if (hi < toks.length) parts.push('<span class="tok-gap">…</span>');
  return `<code class="cap-alg">${parts.join("")}</code>`;
}

function updateCaption() {
  const cap = document.getElementById("solve-caption");
  if (!cap) return;
  initCaptionDrag();
  // the caption lives in camera (scan) mode only
  if (
    !scanState.phases.length ||
    S.gameMode !== "scan" ||
    !modal?.classList.contains("has-solution")
  ) {
    cap.hidden = true;
    cancelAnimationFrame(capRaf);
    return;
  }
  const i = activePhaseIndex();
  const ph = scanState.phases[i];
  cap.style.background = PAPER_COLORS[i % PAPER_COLORS.length];
  if (!ph) {
    cap.innerHTML =
      '<div class="cap-body" style="width:100%">' +
      "<strong>Solved! 🎉</strong>" +
      "<span>Every layer is done — scramble it and try the steps yourself.</span>" +
      "</div>";
  } else {
    const stepNo =
      scanState.phases.length > 1
        ? `<em>Step ${i + 1} of ${scanState.phases.length}</em>`
        : "";
    const thumbs = solveThumbs();
    const src = thumbs[PHASE_THUMB[ph.id]] || thumbs.full || "";
    cap.innerHTML =
      `<img class="cap-thumb" alt="" src="${src}" />` +
      '<div class="cap-body">' +
      stepNo +
      `<strong>${ph.label}</strong>` +
      (ph.caseName ? `<span class="cap-case">Case: ${ph.caseName}</span>` : "") +
      (ph.detail ? `<span>${ph.detail}</span>` : "") +
      movesTokensHTML(ph, i) +
      (ph.why ? `<span class="cap-why">${ph.why}</span>` : "") +
      "</div>";
  }
  cap.hidden = false;
  watchCaption(cap);
}

function updateActivePhase() {
  const list = document.getElementById("solve-steps");
  updateCaption();
  if (!list) return;
  const active = activePhaseIndex();
  const items = list.querySelectorAll(".solve-step");
  items.forEach((el, i) => {
    el.classList.toggle("done", i < active);
    el.classList.toggle("active", i === active);
  });
  const el = list.querySelector(".solve-step.active");
  if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });

  // Update the stage label in the control bar
  const lbl = document.getElementById("phase-label");
  if (lbl) {
    const ph = scanState.phases[active];
    lbl.textContent = ph ? ph.label : active >= scanState.phases.length ? "Done" : "Stage";
  }

  // Reapply focus colouring for the new active phase
  if (scanState.focusMode) {
    const ph = scanState.phases[active];
    if (ph) _applyFocusToPhase(ph.id);
    else _clearFocusColors();
  }

  // Entering a new stage: flash its target pieces three times
  if (active !== _lastFlashPhase) {
    _lastFlashPhase = active;
    if (active < scanState.phases.length) flashPhasePieces(active);
  }
}

/* ---------- attempt mode -------------------------------------------- */
// Update the attempt/watch icon button to match current state.
function _setAttemptUI(on) {
  const btn = document.getElementById("attempt-toggle");
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(on));
  btn.title = on ? "Switch to Watch mode" : "Switch to Attempt mode";
  const eye  = btn.querySelector(".icon-watch");
  const hand = btn.querySelector(".icon-attempt");
  if (eye)  eye.style.display  = on ? "none" : "";
  if (hand) hand.style.display = on ? "" : "none";
}

/* ---------- focus mode ---------------------------------------------- */
function _setFocusUI(on) {
  const btn = document.getElementById("focus-toggle");
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(on));
  btn.title = on ? "Focus ON — dim distracting pieces" : "Focus mode: dim non-relevant pieces";
  const off = btn.querySelector(".icon-focus-off");
  const onEl = btn.querySelector(".icon-focus-on");
  if (off) off.style.display = on ? "none" : "";
  if (onEl) onEl.style.display = on ? "" : "none";
}

function _focusShowFor(phaseId, c) {
  const n = c.userData.stickers?.length ?? 0;
  switch (phaseId) {
    case "cross":   return c.userData.crossPiece;
    case "corners": return c.userData.firstLayerPiece;
    case "middle":
    case "f2l1":
    case "f2l2":
    case "f2l3":
    case "f2l4":    return c.userData.secondLayerPiece;
    case "llcross":
    case "lledges": return c.userData.secondLayerPiece || (c.userData.lastLayerPiece && n <= 2);
    case "llcorners":
    case "oll":
    case "pll":     return c.userData.lastLayerPiece;
    default:        return true;
  }
}

function _applyFocusToPhase(phaseId) {
  for (const c of cubies) {
    const show = _focusShowFor(phaseId, c);
    for (const sticker of c.children)
      sticker.material.color.setHex(show ? sticker.userData.baseColor : BLACKOUT);
  }
}

function _clearFocusColors() {
  for (const c of cubies)
    for (const sticker of c.children)
      sticker.material.color.setHex(sticker.userData.baseColor);
}

/* ---------- target-piece flash ---------------------------------------
   When a stage becomes active, the pieces it is about to solve flash three
   times (emissive glow — works on every sticker colour and doesn't fight
   the focus-mode colour overrides). The target set is computed by diffing
   piece solvedness between the stage's start and end states. */

// tiny integer matrix helpers for the targets format ({home, pos, rot})
const _mApply = (M, v) => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
];
const _vEq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const _mEq = (A, B) => _vEq(A[0], B[0]) && _vEq(A[1], B[1]) && _vEq(A[2], B[2]);

// the 24 proper rotations of the cube, from x/y 90° generators
const _ROT24 = (() => {
  const rx = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
  const ry = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
  const mul = (A, B) =>
    A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const out = [], seen = new Set();
  const stack = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]];
  while (stack.length) {
    const M = stack.pop();
    const k = M.flat().join();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(M);
    stack.push(mul(rx, M), mul(ry, M));
  }
  return out;
})();

const _isCentre = (h) => h.filter((v) => v !== 0).length === 1;

// Whole-cube frame of a targets snapshot, read from the centre positions.
function _frameOf(targets) {
  const centres = targets.filter((t) => _isCentre(t.home));
  return _ROT24.find((R) => centres.every((t) => _vEq(_mApply(R, t.home), t.pos))) || null;
}

// home-keys of the non-centre pieces that are fully solved in this snapshot
function _solvedSet(targets) {
  const R = _frameOf(targets);
  const set = new Set();
  if (!R) return set;
  for (const t of targets)
    if (!_isCentre(t.home) && _vEq(t.pos, _mApply(R, t.home)) && _mEq(t.rot, R))
      set.add(t.home.join(","));
  return set;
}

// home key → THREE cubie (same construction order as applyCubieState)
let _homeMap = null;
function _cubieHomeMap() {
  if (_homeMap) return _homeMap;
  _homeMap = new Map();
  let idx = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        _homeMap.set(`${x},${y},${z}`, cubies[idx++]);
      }
  return _homeMap;
}

// The cubies phase `i` will solve. Orientation-only phases (OLL, LL cross)
// solve nothing permanently, so fall back to the focus-mode piece set.
function _flashSetFor(i) {
  const a = scanState.phaseTargets[i];
  const b = scanState.phaseTargets[i + 1];
  let set = [];
  if (a && b) {
    const sa = _solvedSet(a);
    const map = _cubieHomeMap();
    set = [..._solvedSet(b)].filter((k) => !sa.has(k)).map((k) => map.get(k)).filter(Boolean);
  }
  if (!set.length) {
    const ph = scanState.phases[i];
    if (ph)
      set = cubies.filter(
        (c) => c.userData.stickers.length > 1 && _focusShowFor(ph.id, c),
      );
  }
  return set;
}

let _flashTimer = 0;
let _flashSet = [];
let _lastFlashPhase = -2;
function _stopFlash() {
  if (_flashTimer) clearInterval(_flashTimer);
  _flashTimer = 0;
  for (const c of _flashSet)
    for (const s of c.children) s.material.emissive?.setHex(0x000000);
  _flashSet = [];
}

export function flashPhasePieces(i) {
  _stopFlash();
  const set = _flashSetFor(i);
  if (!set.length) return;
  _flashSet = set;
  let n = 0;
  _flashTimer = setInterval(() => {
    const on = n % 2 === 0;
    for (const c of _flashSet)
      for (const s of c.children)
        s.material.emissive?.setHex(on ? 0x8a6a1e : 0x000000);
    n++;
    if (n >= 6) _stopFlash(); // three on/off cycles
  }, 170);
}

export function toggleFocusMode() {
  scanState.focusMode = !scanState.focusMode;
  _setFocusUI(scanState.focusMode);
  if (scanState.focusMode) {
    const ph = scanState.phases[activePhaseIndex()];
    if (ph) _applyFocusToPhase(ph.id);
    else _clearFocusColors();
  } else {
    _clearFocusColors();
  }
}

// Put the cube at the start of phase `i` and tell the user to try it.
export function startAttempt(i) {
  if (S.animating) return;
  if (S.playingSolve) togglePlaySolve();
  queue.length = 0;
  const pt = scanState.phaseTargets[i];
  if (!pt) return;
  applyCubieState(pt);
  scanState.index = scanState.movePhase.findIndex((pi) => pi === i);
  if (scanState.index < 0) scanState.index = scanState.moves.length;
  const ph = scanState.phases[i];
  setStatus(ph ? `Attempt: ${ph.label} — try it yourself!` : "Attempt phase");
  updateActivePhase();
}

// Toggle between watch and attempt modes.
export function toggleAttemptMode() {
  if (!scanState.phases.length) return;
  scanState.attemptMode = !scanState.attemptMode;
  _setAttemptUI(scanState.attemptMode);
  if (scanState.attemptMode) {
    if (S.playingSolve) togglePlaySolve();
    startAttempt(activePhaseIndex());
  } else {
    // Back to watch: restore the phase start state so play works from here
    jumpToPhase(activePhaseIndex());
    setStatus("Watch mode — press play or step through the moves.");
  }
}

// Called after every user-initiated move in attempt mode; checks completion.
export function checkAttemptProgress() {
  if (!scanState.attemptMode || !scanState.phases.length) return;
  const i = activePhaseIndex();
  const ph = scanState.phases[i];
  if (!ph) return;
  if (phaseComplete(ph.id)) {
    setStatus(`✓ Got it! "${ph.label}" done — tap the next stage or toggle Watch to see the answer.`);
    // Visually highlight the finished step
    const list = document.getElementById("solve-steps");
    if (list) {
      const el = list.querySelectorAll(".solve-step")[i];
      if (el) el.classList.add("got-it");
    }
  }
}

// Switch method: reset the cube to the scanned state, re-solve, re-render.
export function selectSolveMethod(method) {
  if (!scanState.targets || S.animating) return;
  if (S.playingSolve) togglePlaySolve(); // pause first
  queue.length = 0;
  applyCubieState(scanState.targets); // back to the scanned start position
  const fellBack = computeWithFallback(scanState.targets, method);
  renderSolvePanel();
  if (!scanState.moves.length) {
    setStatus(`Couldn't build the ${METHOD_LABELS[method] || method} solve — try another.`);
    return;
  }
  if (fellBack) {
    setStatus(
      `That cube is tricky to teach step-by-step — showing the Fast route (${scanState.moves.length} moves) instead.`,
    );
    return;
  }
  const n = scanState.moves.length;
  setStatus(
    scanState.method === "fast"
      ? `Fast: ${n} moves, fewest of the three. Play or step through.`
      : `${METHOD_LABELS[scanState.method]}: ${n} moves across ${scanState.phases.length} steps. Play or step through.`,
  );
}

/* ---------- learn-without-a-cube: a random Kociemba scramble -------- */
// No physical cube to scan? Drop a uniformly random (solvable) state onto the
// 3D cube and open the auto-solve menu, so the user can still learn a method.
export function startTemplateSolve() {
  if (S.animating) return;
  if (S.playingSolve) togglePlaySolve();
  queue.length = 0;
  const r = faceletsToTargets(Cube.random().asString());
  if (!r.ok || !r.targets) {
    setStatus("Couldn't make a practice cube — tap to try again.");
    return;
  }
  if (scanner) scanner.stop(); // shut the camera off — no cube to scan
  applyCubieState(r.targets);
  modal.classList.remove("scanning"); // leave the camera view, show the cube
  resize();
  computeWithFallback(r.targets, scanState.method || "beginner");
  if (!scanState.moves.length) {
    setStatus("Couldn't make a practice cube — tap to try again.");
    return;
  }
  modal.classList.add("has-solution", "states-open"); // open the auto-solve menu
  const controls = document.getElementById("solve-controls");
  if (controls) controls.hidden = false;
  renderSolvePanel();
  setStatus(
    `Practice cube ready — ${scanState.moves.length} moves to solve. Pick a method, then play or step.`,
  );
  S.started = false;
  S.solved = false;
  S.moveCount = 0;
  movesEl.textContent = "0";
}

/* ---------- playback ------------------------------------------------ */
function enqueueParsedMove(move) {
  enqueue({
    type: "face",
    dir: move.turn.dir,
    layers: move.turn.layers,
    prime: move.prime,
    double: move.double,
    notation: move.base + (move.prime ? "'" : "") + (move.double ? "2" : ""),
    dur: TURN_MS,
  });
}

function atSinglePhaseEnd() {
  if (scanState.watchPhase < 0) return false;
  const cur = activePhaseIndex();
  // Finished the watched phase when we've moved past it
  return cur !== scanState.watchPhase;
}

function pollPlayback() {
  if (!S.playingSolve) return;
  if (scanState.index >= scanState.moves.length) {
    togglePlaySolve();
    setStatus("Solve complete! 🎉");
    return;
  }
  if (atSinglePhaseEnd()) {
    togglePlaySolve();
    const ph = scanState.phases[scanState.watchPhase];
    setStatus(ph ? `"${ph.label}" done — click another stage or press play to continue.` : "Stage done.");
    return;
  }
  if (!S.animating && queue.length === 0) stepScanSolve(1);
  requestAnimationFrame(pollPlayback);
}

export function togglePlaySolve() {
  if (!scanState.moves.length) return;
  // If at end of a single-stage clip, restart that stage
  if (scanState.watchPhase >= 0 && atSinglePhaseEnd()) {
    jumpToPhase(scanState.watchPhase);
  } else if (scanState.index >= scanState.moves.length) {
    scanState.index = 0;
  }
  S.playingSolve = !S.playingSolve;
  const playBtn = document.querySelector('[data-act="play-solve"]');
  if (playBtn) playBtn.setAttribute("aria-pressed", String(S.playingSolve));

  if (S.playingSolve) {
    setStatus("Playing…");
    pollPlayback();
  } else {
    setStatus(`Paused at move ${scanState.index} of ${scanState.moves.length}`);
  }
}

export function stepScanSolve(dir = 1) {
  if (!scanState.moves.length || S.animating || queue.length) return false;

  if (dir === 1) {
    if (scanState.index >= scanState.moves.length) return false;
    enqueueParsedMove(scanState.moves[scanState.index]);
    scanState.index++;
  } else {
    if (scanState.index <= 0) return false;
    scanState.index--;
    const move = scanState.moves[scanState.index];
    enqueueParsedMove({
      ...move,
      prime: !move.prime,
      notation: move.base + (!move.prime ? "'" : "") + (move.double ? "2" : ""),
    });
  }

  updateActivePhase();
  setStatus(`Step ${scanState.index} of ${scanState.moves.length}`);
  return true;
}

/* ---------- scanner lifecycle --------------------------------------- */
export function getScanner() {
  if (scanner) return scanner;
  scanner = createScanner({
    onApply(targets, moves) {
      applyCubieState(targets);
      modal.classList.remove("scanning"); // removes the camera overlay
      resize();
      if (moves && moves.length) {
        modal.classList.add("has-solution", "states-open"); // open the auto-solve menu
        const controls = document.getElementById("solve-controls");
        if (controls) controls.hidden = false;
        renderSolvePanel();
        setStatus(
          `Scanned! ${moves.length} moves to solve. Pick a method, then play or step.`,
        );
      } else {
        setStatus("Scanned! It now matches your cube — turn it freely.");
        clearSolution();
      }
      S.started = false;
      S.solved = false;
      S.moveCount = 0;
      movesEl.textContent = "0";
    },
    onCancel() {
      closeModal();
    },
    onSolveReady(targets) {
      computeWithFallback(targets, scanState.method || "beginner");
      return scanState.moves;
    },
  });
  return scanner;
}

export function stopScanner() {
  if (scanner) scanner.stop();
}
