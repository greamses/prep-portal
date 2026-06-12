/* =====================================================================
   The fullscreen play modal — opening it picks a game mode (challenge /
   algo / scan) and primes that mode; closing it tears everything down.
   ===================================================================== */
import { S } from "./state.js";
import { modal, movesEl, timeEl } from "./dom.js";
import {
  setPad,
  animateSideMenu,
  stopInspection,
  setStatus,
} from "./ui.js";
import { startRender, stopRender } from "./render.js";
import { resize, rebuildSolved, cubeGroup } from "./scene.js";
import { newScramble, stopTimer } from "./game-flow.js";
import { buildAlgoList } from "./algo-lab.js";
import { cartonHide } from "./carton.js";
import { clearSolution, getScanner, stopScanner } from "./scan-play.js";

export function openModal(mode) {
  if (S.modalOpen) return;
  clearSolution();
  S.gameMode = mode === "algo" ? "algo" : mode === "scan" ? "scan" : "challenge";
  S.modalOpen = true;
  modal.classList.add("open");
  modal.classList.toggle("algo", S.gameMode === "algo");
  modal.classList.toggle("scan-mode", S.gameMode === "scan");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("cube-active");
  setPad(
    S.gameMode !== "scan" && window.matchMedia("(max-width: 760px)").matches,
  );
  if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
  startRender();
  requestAnimationFrame(() => {
    resize();
    if (S.gameMode === "scan") {
      cartonHide();
      stopInspection();
      rebuildSolved();
      cubeGroup.quaternion.identity();
      stopTimer();
      S.started = false;
      S.solved = true;
      S.moveCount = 0;
      movesEl.textContent = "0";
      timeEl.textContent = "0:00";
      modal.classList.add("scanning");
      setStatus("");
      getScanner().start();
    } else if (S.gameMode === "algo") {
      cartonHide();
      stopInspection();
      rebuildSolved();
      cubeGroup.quaternion.identity();
      stopTimer();
      S.started = false;
      S.solved = true;
      S.moveCount = 0;
      movesEl.textContent = "0";
      timeEl.textContent = "0:00";
      buildAlgoList();
      setStatus("Pick an algorithm →");
      modal.classList.add("states-open");
      animateSideMenu();
    } else {
      newScramble();
    }
  });
}

export function closeModal() {
  if (!S.modalOpen) return;
  S.modalOpen = false;
  clearSolution();
  stopScanner();
  modal.classList.remove("open", "algo", "states-open", "scan-mode", "scanning");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cube-active");
  stopTimer();
  stopInspection();
  stopRender();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
