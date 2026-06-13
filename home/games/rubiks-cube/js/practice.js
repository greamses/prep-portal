/* =====================================================================
   Practice modes — dim every sticker except the pieces relevant to the
   stage being drilled (cross, F2L, last layer …) and wire the state-card
   side menu that switches between them.
   ===================================================================== */
import { BLACKOUT } from "./constants.js";
import { cubies } from "./scene.js";
import { S } from "./state.js";
import { modal } from "./dom.js";
import { setStatus, stopInspection, animateSideMenu } from "./ui.js";
import { cartonHide } from "./carton.js";
import { buildStateThumbs } from "./thumbs.js";
import { newScramble } from "./game-flow.js";

function pieceShown(c) {
  if (S.practiceMode === "cross") return c.userData.crossPiece;
  if (S.practiceMode === "first") return c.userData.firstLayerPiece;
  if (S.practiceMode === "second") return c.userData.secondLayerPiece;
  if (S.practiceMode === "oll" || S.practiceMode === "pll")
    return c.userData.lastLayerPiece;
  return true;
}

function applyPractice() {
  for (const c of cubies) {
    const show = pieceShown(c);
    c.children.forEach((sticker) => {
      sticker.material.color.setHex(
        show ? sticker.userData.baseColor : BLACKOUT,
      );
    });
  }
}

export function setPractice(mode) {
  S.practiceMode = mode;
  applyPractice();
}

/* ---------- state-card side menu ------------------------------------ */
let statesReady = false;
export function ensureStateThumbs() {
  if (statesReady) return;
  statesReady = true;
  const thumbs = buildStateThumbs();
  document.querySelectorAll("[data-state]").forEach((card) => {
    const img = card.querySelector("img");
    if (img) img.src = thumbs[card.dataset.state] || "";
  });
}

export function selectState(state) {
  setPractice(state);
  document
    .querySelectorAll("[data-state]")
    .forEach((card) =>
      card.setAttribute("aria-pressed", String(card.dataset.state === state)),
    );
  if (state === "full") newScramble();
  else {
    cartonHide();
    stopInspection();
    setStatus("");
  }
}

export function toggleStates() {
  if (S.gameMode === "challenge") ensureStateThumbs();
  modal.classList.toggle("states-open");
  if (modal.classList.contains("states-open")) animateSideMenu();
}
