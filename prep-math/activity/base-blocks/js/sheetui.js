/* ============================================================================
   Manipulatives — the strip you work a written sum from
   ----------------------------------------------------------------------------
   The board holds the page; this asks the questions. Pick a long division or a
   column addition up and a strip appears by it: the sum it is set to, the
   question it is waiting on, and the two keys that write a line for you or rub
   the working out.

   THE ANSWER IS NOT TYPED HERE. It is typed into the cells of the page itself
   (js/cells.js) — one box for one figure, standing in the column that figure
   belongs to. This strip holds the words; the page holds the writing.

   It is DOM over the canvas rather than anything drawn into the board's face,
   for the reason cardui.js is: this is a text box and three buttons, and every
   phone keyboard and every screen reader already knows what to do with those.
   A keypad painted into a texture knows none of it.

   The question is said here and the CELLS IT GOES IN are outlined over on the
   board, so the sentence and the place on the page are the same fact seen
   twice. Neither works alone: a question with no place is a riddle, and a
   flashing box with no question is a form.

   One strip for both methods — see sheets.js. The only thing that differs is
   the sum row, which is built from the method's own list of boxes, so the
   division gets two with a ÷ between them and the addition gets one wide one
   holding "269 + 182".

   Pinned by projecting the corners of the board's patch of paper, and re-pinned
   after every render, because the camera can orbit without the store changing.
   ========================================================================== */

import { selectedItems } from "./state.js";
import { footprint } from "./layout.js";
import { baseWord, DIGITS } from "./config.js";
import { sheetFor } from "./sheets.js";
import { ICON } from "./icons.js";

const B = () => window.BABYLON;

export function createSheetPanel(ctx, view, stage, {
  onShow = () => {}, onReset = () => {}, onSum = () => {},
} = {}) {
  const { scene, camera } = ctx;

  const panel = document.createElement("div");
  panel.className = "bb-sheetpanel";
  panel.hidden = true;
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Working the sum");
  /* Wrapped in the shared receipt's paper — see style.css. The outer element
     positions the strip and carries the drop-shadow; the paper carries the torn
     edge, because a filter under a mask gets clipped. */
  panel.innerHTML = `
    <div class="pp-receipt__paper bb-paper bb-sheetpanel__paper">
    <form class="bb-sheetpanel__sum" data-form="sum"></form>
    <p class="bb-sheetpanel__ask" data-ask aria-live="polite"></p>
    <div class="bb-sheetpanel__work">
      <span class="bb-sheetpanel__where" data-where></span>
      <button class="bb-sheetpanel__key" type="button" data-do="show"
              title="Write this one for me" aria-label="Write this one for me">
        ${ICON.info}
      </button>
      <button class="bb-sheetpanel__key" type="button" data-do="again"
              title="Rub the working out and start again" aria-label="Rub the working out and start again">
        ${ICON.eraser}
      </button>
    </div>
    </div>`;
  stage.appendChild(panel);

  const askEl = panel.querySelector("[data-ask]");
  const whereEl = panel.querySelector("[data-where]");
  const sumEl = panel.querySelector('[data-form="sum"]');

  /* Which method's boxes are standing in the sum row. Rebuilt only when it
     changes, because rebuilding it on every refresh would take the caret out of
     a box in the middle of typing a sum into it. */
  let built = null;

  function buildSum(variant, sheet) {
    const boxes = sheet.fields.map((f) => `
      <input class="bb-sheetpanel__num${f.wide ? " bb-sheetpanel__num--wide" : ""}"
             data-n="${f.n}" inputmode="numeric" autocomplete="off"
             spellcheck="false" aria-label="${f.aria}" />`);
    const sep = sheet.sep
      ? `<span class="bb-sheetpanel__op" aria-hidden="true">${sheet.sep}</span>`
      : "";
    sumEl.innerHTML = boxes.join(sep) + `
      <button class="bb-sheetpanel__key" type="submit" data-do="sum"
              title="Put this sum on the board" aria-label="Put this sum on the board">
        ${ICON.keyin}
      </button>
      <span class="bb-sheetpanel__base" data-base hidden></span>`;
    built = variant;
  }

  /* The strip belongs to the board, not to the paper under it: a press on it
     must not also be a press on the canvas, which would put the board down and
     take the strip away from under the finger aiming at it. */
  panel.addEventListener("pointerdown", (e) => e.stopPropagation());

  /** The one worked sheet that is picked up, if that is what is picked up. */
  function only() {
    const picked = selectedItems();
    if (picked.length !== 1) return null;
    return sheetFor(picked[0]) ? picked[0] : null;
  }

  /** What is typed in the sum row, by the names the method asked for. */
  function typed() {
    const out = {};
    for (const el of sumEl.querySelectorAll("[data-n]")) out[el.dataset.n] = el.value;
    return out;
  }

  panel.addEventListener("submit", (e) => {
    e.preventDefault();
    const board = only();
    if (!board) return;
    onSum(board, typed());
  });

  panel.addEventListener("click", (e) => {
    const key = e.target.closest("[data-do]");
    if (!key || key.dataset.do === "sum") return;
    const board = only();
    if (!board) return;
    if (key.dataset.do === "show") onShow(board);
    if (key.dataset.do === "again") onReset(board);
  });

  function project(x, y, z) {
    const BJS = B();
    const engine = scene.getEngine();
    const rect = stage.getBoundingClientRect();
    const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const p = BJS.Vector3.Project(
      new BJS.Vector3(x, y, z), BJS.Matrix.Identity(), scene.getTransformMatrix(), vp);
    return {
      x: p.x * (rect.width / engine.getRenderWidth()),
      y: p.y * (rect.height / engine.getRenderHeight()),
    };
  }

  function place() {
    const board = only();
    if (!board) { panel.hidden = true; return; }
    /* Put somewhere by hand with the pick tool — leave it there. */
    if (panel.classList.contains("is-put")) return;
    const f = footprint(board);
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const x of [board.x, board.x + f.l]) {
      for (const z of [board.z, board.z + f.w]) {
        const p = project(x, board.y || 0, z);
        left = Math.min(left, p.x);
        right = Math.max(right, p.x);
        top = Math.min(top, p.y);
        bottom = Math.max(bottom, p.y);
      }
    }
    if (!isFinite(left)) { panel.hidden = true; return; }

    const rect = stage.getBoundingClientRect();
    const w = panel.offsetWidth || 260;
    const h = panel.offsetHeight || 96;
    const x = Math.max(8, Math.min(rect.width - w - 8, (left + right) / 2 - w / 2));

    /* Above the board if there is room, UNDER it if there is not, and pinned to
       the FOOT of the stage when the board is bigger than the screen.

       Never clamped to the top: the top of one of these pages is the row the
       carries go in and the line the answer is written on, and the strip must
       not cover the working it is asking about. The foot is the safest corner
       left — and the boxes are stacked above the strip as well (style.css), so
       even where they do meet, the figure you are reaching for wins the press. */
    const above = top - h - 10;
    const below = bottom + 10;
    const y = above >= 8 ? above
      : below + h <= rect.height - 8 ? below
        : rect.height - h - 8;
    panel.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function refresh() {
    const board = only();
    panel.hidden = !board;
    if (!board) return;
    const sheet = sheetFor(board);
    if (built !== board.variant) buildSum(board.variant, sheet);

    const b = board.base;
    const showing = sheet.read(board);
    /* Never written over while it is being typed in — a box that rewrites
       itself under the caret cannot be edited. */
    for (const el of sumEl.querySelectorAll("[data-n]")) {
      if (document.activeElement !== el) el.value = showing[el.dataset.n] ?? "";
      el.maxLength = 24;
    }
    const baseEl = sumEl.querySelector("[data-base]");
    baseEl.hidden = b === 10;
    baseEl.textContent = b === 10 ? "" : `base ${baseWord(b)}`;
    baseEl.title = b === 10 ? "" : `Write every number in base ${baseWord(b)} — digits 0 to ${DIGITS[b - 1]}.`;

    const q = sheet.ask(board);
    askEl.textContent = q.text;
    /* Where it goes is said apart from what it is, because the two are answered
       in different places: the question is read here, and the answer is written
       over there in the outlined cells. */
    whereEl.textContent = q.done ? ""
      /* The gesture as well as the place, because a figure you drag rather than
         type is the one thing on either board nobody expects. */
      : q.kind === "b" ? `Drag it ${q.where || "into place"}`
        : q.where ? `Write it ${q.where}` : "";
    panel.dataset.state = q.done ? "done" : "asking";

    place();
  }

  // the camera can orbit without the store changing, so it is placed every frame
  const obs = scene.onAfterRenderObservable.add(() => { if (!panel.hidden) place(); });

  return {
    refresh,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      panel.remove();
    },
  };
}
