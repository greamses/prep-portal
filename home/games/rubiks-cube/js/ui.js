/* =====================================================================
   Lightweight HUD: the transient move label, the status line, the
   15-second inspection countdown, and the on-screen control pad toggle.
   ===================================================================== */
import { moveLabel, statusLabel, modal } from "./dom.js";
import { S } from "./state.js";
import { resize } from "./scene.js";
import { gsapRef } from "./gsap.js";

/* ---------- move label / status ------------------------------------- */
let moveLabelTimer = null;
export function showMove(note) {
  if (!moveLabel) return;
  moveLabel.textContent = note;
  moveLabel.classList.remove("show");
  void moveLabel.offsetWidth;
  moveLabel.classList.add("show");
  if (moveLabelTimer) clearTimeout(moveLabelTimer);
  moveLabelTimer = setTimeout(() => moveLabel.classList.remove("show"), 750);
}

export function setStatus(text) {
  if (!statusLabel) return;
  statusLabel.textContent = text || "";
  statusLabel.classList.toggle("show", !!text);
}

/* ---------- inspection countdown ------------------------------------ */
let inspectTimer = null;
export function stopInspection() {
  if (inspectTimer) clearInterval(inspectTimer);
  inspectTimer = null;
  S.inspecting = false;
}
export function startInspection() {
  stopInspection();
  S.inspecting = true;
  let left = 15;
  setStatus("Inspect (rotate only): " + left);
  inspectTimer = setInterval(() => {
    left -= 1;
    if (left > 0) setStatus("Inspect (rotate only): " + left);
    else {
      stopInspection();
      setStatus("Go! Turn or rotate to start");
    }
  }, 1000);
}

/* ---------- on-screen pad -------------------------------------------- */
export const padFab = document.querySelector('[data-act="pad-toggle"]');

export function setPad(open) {
  modal.classList.toggle("pad-open", open);
  if (padFab) {
    padFab.setAttribute("aria-pressed", String(open));
    padFab.setAttribute(
      "aria-label",
      open ? "Hide on-screen controls" : "Show on-screen controls",
    );
  }
  resize();
}

export function togglePad() {
  setPad(!modal.classList.contains("pad-open"));
}

/* ---------- side-menu reveal ---------------------------------------- */
export function animateSideMenu() {
  const gsap = gsapRef.current;
  if (!gsap) return;
  const items = modal.querySelectorAll(
    S.gameMode === "scan"
      ? ".solve-panel .solve-method-btn, .solve-panel .solve-step"
      : S.gameMode === "algo"
        ? ".mode-algos .algo-cat"
        : ".mode-states .state-card",
  );
  gsap.from(items, {
    x: -36,
    autoAlpha: 0,
    stagger: 0.06,
    duration: 0.45,
    ease: "back.out(1.7)",
    overwrite: true,
  });
}
