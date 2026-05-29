// ════════════════════════════════════════════════════════════════════════
// CHECK MY WRITING — the interactive AI tool on the closing pages.
// Sends the student's own text to POST /api/grammar/check and renders the
// returned mistakes, fixes and a corrected version. Wired once after the book
// is built.
// ════════════════════════════════════════════════════════════════════════

import { checkWriting } from "../services/book-service.js";

const TYPE_LABEL = {
  confusable: "Confusable word",
  punctuation: "Punctuation",
  capital: "Capital letter",
  spelling: "Spelling",
  agreement: "Agreement",
  grammar: "Grammar",
};

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function renderResult(box, data) {
  const errors = data.errors || [];
  const provider = data.provider ? `<span class="gp-checker__by">checked by ${esc(data.provider)}</span>` : "";

  if (!errors.length) {
    box.innerHTML = `
      <div class="gp-checker__clean">
        <p class="gp-checker__summary">✨ ${esc(data.summary || "Looks clean — no mistakes spotted. Great work!")}</p>
        ${provider}
      </div>`;
    return;
  }

  const list = errors
    .map(
      (e) => `
      <li class="gp-err gp-err--${esc(e.type)}">
        <span class="gp-err__chip">${esc(TYPE_LABEL[e.type] || e.type)}</span>
        <p class="gp-err__fix"><span class="gp-err__wrong">${esc(e.wrong)}</span>
          <i data-lucide="arrow-right" style="width:13px;height:13px;display:inline-block;vertical-align:-2px"></i>
          <span class="gp-err__right">${esc(e.fix)}</span></p>
        ${e.why ? `<p class="gp-err__why">${esc(e.why)}</p>` : ""}
      </li>`
    )
    .join("");

  box.innerHTML = `
    <p class="gp-checker__summary">${esc(data.summary || `Found ${errors.length} thing${errors.length === 1 ? "" : "s"} to fix.`)}</p>
    ${provider}
    <ol class="gp-checker__errors">${list}</ol>
    ${
      data.corrected
        ? `<div class="gp-checker__corrected">
             <p class="gp-checker__corrected-label">Corrected version</p>
             <p class="gp-checker__corrected-text">${esc(data.corrected)}</p>
           </div>`
        : ""
    }`;
  if (window.lucide) lucide.createIcons();
}

export function initChecker() {
  const input = document.getElementById("gpCheckerInput");
  const run = document.getElementById("gpCheckerRun");
  const clear = document.getElementById("gpCheckerClear");
  const box = document.getElementById("gpCheckerResult");
  if (!input || !run || !box) return;
  if (run.dataset.wired) return; // guard against double-wiring
  run.dataset.wired = "1";

  // Don't let clicks inside the tool flip the page.
  [input, run, clear].forEach((el) =>
    el?.addEventListener("mousedown", (e) => e.stopPropagation())
  );

  const setBusy = (busy) => {
    run.disabled = busy;
    run.classList.toggle("is-busy", busy);
  };

  run.addEventListener("click", async (e) => {
    e.stopPropagation();
    const text = input.value.trim();
    if (!text) {
      box.innerHTML = `<p class="gp-checker__hint">Type or paste some writing first.</p>`;
      return;
    }
    setBusy(true);
    box.innerHTML = `<p class="gp-checker__loading">Sergeant Sentence is reading your writing…</p>`;
    try {
      const data = await checkWriting(text);
      renderResult(box, data);
    } catch (err) {
      box.innerHTML = `<p class="gp-checker__error">${esc(err.message || "Something went wrong. Please try again.")}</p>`;
    } finally {
      setBusy(false);
    }
  });

  clear?.addEventListener("click", (e) => {
    e.stopPropagation();
    input.value = "";
    box.innerHTML = "";
    input.focus();
  });
}
