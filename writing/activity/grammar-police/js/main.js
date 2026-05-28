import { state } from "./utils/state.js";
import { initAudio } from "./utils/audio.js";
import { buildBookPages, initPageFlip } from "./ui/pages.js";
import { checkPassage, resetPassage } from "./ui/grammar.js";
import { checkExercise, resetExercise, deselectToken } from "./ui/punctuation.js";
import { PASSAGES } from "./data/grammarData.js";
import { PP_EXERCISES } from "./data/punctuationData.js";

// ── Modal ─────────────────────────────────────────────────────
function openModal() {
  const modal = document.getElementById("gpModal");
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  initAudio();
  if (!state.bookBuilt) {
    buildBookPages();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initPageFlip(syncUI);
        wireBookEvents();
        syncUI();
      });
    });
  }
}

function closeModal() {
  document.getElementById("gpModal").hidden = true;
  document.body.style.overflow = "";
  deselectToken();
  if (state.drag.ghost) { state.drag.ghost.remove(); state.drag.ghost = null; }
}

function syncUI() {
  const cur   = state.pageFlip.getCurrentPageIndex();
  const total = state.pageFlip.getPageCount();
  document.getElementById("gpPageNum").textContent = `${cur + 1} / ${total}`;
  document.getElementById("gpPrev").disabled = cur === 0;
  document.getElementById("gpNext").disabled = cur >= total - 1;
}

// ── Navigation ────────────────────────────────────────────────
function jumpToPage(targetPage) {
  const book = document.getElementById("gpBook");
  book.classList.add("gp-book--jumping");
  setTimeout(() => {
    state.pageFlip.turnToPage(targetPage);
    syncUI();
    requestAnimationFrame(() => book.classList.remove("gp-book--jumping"));
  }, 220);
}

// ── Event Wiring ──────────────────────────────────────────────
function wireBookEvents() {
  document.getElementById("gpPrev").addEventListener("click", () => state.pageFlip.flipPrev());
  document.getElementById("gpNext").addEventListener("click", () => state.pageFlip.flipNext());

  document.getElementById("pcTocList").addEventListener("click", (e) => {
    const gpItem = e.target.closest("[data-goto-explanation]");
    if (gpItem) {
      const idx  = parseInt(gpItem.dataset.gotoExplanation, 10);
      const page = state.EXPLANATION_START_PAGE[idx];
      if (page !== undefined) jumpToPage(page);
      return;
    }
    const ppItem = e.target.closest("[data-goto-pp-explanation]");
    if (ppItem) {
      const idx  = parseInt(ppItem.dataset.gotoPpExplanation, 10);
      const page = state.PP_EXPL_START[idx];
      if (page !== undefined) jumpToPage(page);
    }
  });

  document.getElementById("gpBook").addEventListener("click", (e) => {
    const gpCheck = e.target.closest("[data-gp-check]");
    const gpReset = e.target.closest("[data-gp-reset]");
    const ppCheck = e.target.closest("[data-pp-check]");
    const ppReset = e.target.closest("[data-pp-reset]");
    if (gpCheck) checkPassage(parseInt(gpCheck.dataset.gpCheck, 10));
    if (gpReset) resetPassage(parseInt(gpReset.dataset.gpReset, 10));
    if (ppCheck) checkExercise(parseInt(ppCheck.dataset.ppCheck, 10));
    if (ppReset) resetExercise(parseInt(ppReset.dataset.ppReset, 10));
  });

  document.addEventListener("keydown", (e) => {
    if (document.getElementById("gpModal").hidden) return;
    if (e.key === "Escape")     closeModal();
    if (e.key === "ArrowLeft")  state.pageFlip.flipPrev();
    if (e.key === "ArrowRight") state.pageFlip.flipNext();
  });
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("gpOpen").addEventListener("click",  openModal);
  document.getElementById("gpClose").addEventListener("click", closeModal);
  document.getElementById("gpModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!state.pageFlip) return;
      const book = document.getElementById("gpBook");
      state.pageFlip.updateState({
        width:  Math.floor(book.offsetWidth / 2),
        height: book.offsetHeight,
      });
    }, 250);
  });
});
