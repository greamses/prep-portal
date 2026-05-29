import { state } from "./utils/state.js";
import { initAudio } from "./utils/audio.js";
import { loadBook } from "./services/book-service.js";
import { buildBookPages, initPageFlip, stopAllVideos } from "./ui/pages.js";
import { checkPassage, resetPassage } from "./ui/grammar.js";
import { checkExercise, resetExercise, deselectToken } from "./ui/punctuation.js";
import { initChecker } from "./ui/checker.js";
import { frontCoverInner } from "./ui/cover.js";

let eventsWired = false;

// ── Load content from the API (falls back to the offline mirror) ──────────
async function ensureBook() {
  if (state.book) return;
  const { book } = await loadBook();
  state.book = book;
  state.wordGroups = book.wordGroups || {};
  state.passages = book.units.filter((u) => u.kind === "grammar").map((u) => u.passage);
  state.exercises = book.units.filter((u) => u.kind === "punctuation").map((u) => u.exercise);
}

// (Re)build the book + flip engine. Idempotent — destroys any prior instance.
function mountBook() {
  if (state.pageFlip) { try { state.pageFlip.destroy(); } catch {} state.pageFlip = null; }
  state.bookBuilt = false;
  buildBookPages();
  initPageFlip(syncUI);
  if (!eventsWired) { wireBookEvents(); eventsWired = true; }
  initChecker();
  syncUI();
}

// ── Modal ─────────────────────────────────────────────────────
async function openModal() {
  const modal = document.getElementById("gpModal");
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  initAudio();
  if (state.bookBuilt) return;
  await ensureBook();
  requestAnimationFrame(() => requestAnimationFrame(mountBook));
}

function closeModal() {
  document.getElementById("gpModal").hidden = true;
  document.body.style.overflow = "";
  deselectToken();
  stopAllVideos(document.getElementById("gpBook"));
  if (state.drag.ghost) { state.drag.ghost.remove(); state.drag.ghost = null; }
}

function syncUI() {
  if (!state.pageFlip) return;
  const cur = state.pageFlip.getCurrentPageIndex();
  const total = state.pageFlip.getPageCount();
  document.getElementById("gpPageNum").textContent = `${cur + 1} / ${total}`;
  document.getElementById("gpPrev").disabled = cur === 0;
  document.getElementById("gpNext").disabled = cur >= total - 1;
}

// ── Navigation ────────────────────────────────────────────────
function jumpToPage(targetPage) {
  if (targetPage == null) return;
  const book = document.getElementById("gpBook");
  book.classList.add("gp-book--jumping");
  setTimeout(() => {
    state.pageFlip.turnToPage(targetPage);
    syncUI();
    requestAnimationFrame(() => book.classList.remove("gp-book--jumping"));
  }, 220);
}

// ── Event Wiring (delegated on persistent elements; runs once) ─────────────
function wireBookEvents() {
  document.getElementById("gpPrev").addEventListener("click", () => state.pageFlip.flipPrev());
  document.getElementById("gpNext").addEventListener("click", () => state.pageFlip.flipNext());

  const book = document.getElementById("gpBook");
  book.addEventListener("click", (e) => {
    const unit = e.target.closest("[data-goto-unit]");
    if (unit) { jumpToPage(state.UNIT_START_PAGE[parseInt(unit.dataset.gotoUnit, 10)]); return; }
    if (e.target.closest("[data-goto-checker]")) { jumpToPage(state.CHECKER_PAGE); return; }
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
    const tag = document.activeElement?.tagName;
    if (tag === "TEXTAREA" || tag === "INPUT") { if (e.key === "Escape") document.activeElement.blur(); return; }
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") state.pageFlip.flipPrev();
    if (e.key === "ArrowRight") state.pageFlip.flipNext();
  });
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Render the SAME cover component on the shelf (scaled by container-query CSS).
  const shelfCover = document.getElementById("shelfCoverMount");
  if (shelfCover) shelfCover.innerHTML = `<div class="pc gp-cover">${frontCoverInner()}</div>`;

  document.getElementById("gpOpen").addEventListener("click", openModal);
  document.getElementById("gpClose").addEventListener("click", closeModal);
  document.getElementById("gpModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Pages are sized to the viewport, so a real resize rebuilds the book to keep
  // it ~96% of the new viewport height (debounced; skipped while hidden).
  let resizeTimer, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!state.bookBuilt || document.getElementById("gpModal").hidden) return;
      if (Math.abs(window.innerWidth - lastW) < 60 && Math.abs(window.innerHeight - lastH) < 60) return;
      lastW = window.innerWidth; lastH = window.innerHeight;
      mountBook();
    }, 300);
  });
});
