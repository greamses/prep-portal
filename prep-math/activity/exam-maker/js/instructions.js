/* ============================================================================
   The instructions page, shown before the exam begins
   ----------------------------------------------------------------------------
   The instructions are a PAPER, like the one a candidate finds on the desk: the first page of the
   exam paper (paper.js instructionsPage), with the school's header and logo, the structure of the
   paper, the numbered instructions and a declaration. It prints with the paper. Here it is shown on its
   own, in a sheet the same width as every other page of the paper, and the student presses Begin;
   nothing of the questions is drawn and no clock starts until they do.

   The teacher turns it on or off in the setup (head.instructions) and adds their own lines there
   (head.instrText). A preview is shown to the teacher, who closes it.
   ========================================================================== */

import { makeCover } from "/utils/components/pp-cover.js";
import { instructionsArticle } from "./paper.js";

export { instructionSections, structureRows } from "./instructions-data.js";

/** Make a sheet fit the window: shown larger than its printed size on a wide screen, never smaller (a narrow one scrolls). */
function fit(sheet) {
  sheet.style.zoom = "";
  /* the same room the exam paper itself is given (paper-play: the page less the tool rail's margin, up to 1400px, and at most 1.6 times), so every sheet is the same width */
  const room = (innerWidth >= 760 ? Math.min(innerWidth - 208, 1400) : innerWidth) - 24;
  const z = Math.max(1, Math.min(1.6, room / sheet.offsetWidth));
  sheet.style.zoom = z > 1.02 ? z.toFixed(3) : "";
}

/**
 * Show the page over everything and resolve when the student presses Begin (or the teacher, in a preview,
 * presses Close).
 */
export function showInstructions({ head, questions, preview = false }) {
  return new Promise((resolve) => {
    document.querySelector(".pp-instr")?.remove();
    const { root, paper, close } = makeCover({ label: "Instructions", bare: true });
    root.classList.add("pp-instr");
    paper.innerHTML = `<div class="xm-sheet pp-instr__sheet" data-paper="${head.paper === "letter" ? "letter" : "a4"}">${instructionsArticle(head, questions)}</div>`;
    const go = document.createElement("div");
    go.className = "pp-instr__go";
    go.innerHTML = `<button type="button" class="pp-btn">${preview ? "Close the preview" : "Begin the exam"}</button>`;
    root.appendChild(go);
    const sheet = paper.firstElementChild;
    fit(sheet);
    const onSize = () => fit(sheet);
    addEventListener("resize", onSize);
    const btn = go.querySelector("button");
    btn.focus({ preventScroll: true });
    const done = () => { removeEventListener("resize", onSize); document.removeEventListener("keydown", onKey); close(); resolve(); };
    const onKey = (e) => { if (preview && e.key === "Escape") done(); };
    btn.addEventListener("click", done);
    if (preview) document.addEventListener("keydown", onKey);
  });
}
