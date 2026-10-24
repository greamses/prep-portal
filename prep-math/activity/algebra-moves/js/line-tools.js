/* ═══════════════════════════════════════════════════════════════════════════
   THE TOOLS ON A CARD'S LINES

   Each line of working has two small controls to its left: an arrow that folds
   the line down to a one-line stub (and back), and a tick box. Ticking lines
   brings up a bar over the card — bigger or smaller writing, a paper colour for
   the lines, copy them out as a new equation, or cut them out. The tick box in
   the card's own corner ticks every line at once.

   This file only builds the little pieces of page; what they DO to the working
   is card.js's, because the lines are its.
   ═══════════════════════════════════════════════════════════════════════════ */

import { UI } from "/utils/components/ui-icons.js";
import { TONES } from "/utils/components/tones.js";

export const GUT = 34;          // the strip to the left of the lines, in card pixels
export const FOLD_H = 30;       // a folded line
export const FONT_MIN = 18;
export const FONT_MAX = 72;
export const FONT_STEP = 4;

/* Scissors, filled like the rest of the site's icons. */
const SCISSORS = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">`
  + `<circle cx="6.5" cy="6.5" r="3.4" fill="currentColor"/><circle cx="6.5" cy="17.5" r="3.4" fill="currentColor"/>`
  + `<circle cx="6.5" cy="6.5" r="1.4" fill="#fff"/><circle cx="6.5" cy="17.5" r="1.4" fill="#fff"/>`
  + `<path d="M8.8 8.6 21 18.6v1.8L7.6 10.4zM8.8 15.4 21 5.4V3.6L7.6 13.6z" fill="currentColor"/></svg>`;

const SWATCH_OFF = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="#fff"/>`
  + `<rect x="10.8" y="2.4" width="2.4" height="19.2" fill="#b3261e" transform="rotate(45 12 12)"/></svg>`;

/** The strip beside one line: its fold arrow and its tick box. */
export function gutterFor(entry, n, { onFold, onTick }) {
  const gut = document.createElement("div");
  gut.className = "am-gut";
  const fold = document.createElement("button");
  fold.type = "button";
  fold.className = "pp-plain am-gut__fold";
  fold.setAttribute("aria-expanded", String(!entry.folded));
  fold.setAttribute("aria-label", `${entry.folded ? "Open" : "Fold"} line ${n}`);
  fold.dataset.tip = entry.folded ? "Open this line" : "Fold this line";
  fold.innerHTML = entry.folded ? UI.chevronRight(14) : UI.chevronDown(14);
  fold.addEventListener("click", (e) => { e.stopPropagation(); onFold(entry); });

  const tick = document.createElement("label");
  tick.className = "am-gut__tick";
  tick.dataset.tip = "Tick to change this line's size or colour, or to copy or cut it";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = !!entry.ticked;
  box.setAttribute("aria-label", `Tick line ${n}`);
  box.addEventListener("change", () => onTick(entry, box.checked));
  tick.append(box, document.createElement("span"));

  for (const piece of [gut, fold, tick]) {
    piece.addEventListener("pointerdown", (e) => e.stopPropagation());
    piece.addEventListener("click", (e) => e.stopPropagation());
  }
  gut.append(fold, tick);
  return gut;
}

/** What a folded line shows in its place. */
export function stubFor(text, onOpen) {
  const stub = document.createElement("button");
  stub.type = "button";
  stub.className = "pp-plain am-fold-stub";
  stub.textContent = text;
  stub.setAttribute("aria-label", `Open the folded line ${text}`);
  stub.addEventListener("click", (e) => { e.stopPropagation(); onOpen(); });
  stub.addEventListener("pointerdown", (e) => e.stopPropagation());
  return stub;
}

/** The bar that appears over a card while lines are ticked. `act` is told
    what was pressed: ("smaller"), ("bigger"), ("tone", hex|null), ("copy"),
    ("cut"), ("clear"). */
export function selectionBar(act) {
  const bar = document.createElement("div");
  bar.className = "am-selbar";
  bar.hidden = true;
  const btn = (name, label, inner) =>
    `<button type="button" class="pp-plain am-selbar__btn" data-sel="${name}" data-tip="${label}" aria-label="${label}">${inner}</button>`;
  bar.innerHTML = `<span class="am-selbar__count" aria-live="polite"></span>`
    + btn("smaller", "Smaller writing", `<b>A</b><i>−</i>`)
    + btn("bigger", "Bigger writing", `<b>A</b><i>+</i>`)
    + btn("colour", "Colour the lines", `<span class="am-selbar__chip"></span>`)
    + btn("copy", "Copy these lines as a new equation", UI.copy(15))
    + btn("cut", "Cut these lines out into a new equation", SCISSORS)
    + btn("clear", "Untick the lines", UI.close(13));
  const palette = document.createElement("div");
  palette.className = "am-selbar__palette";
  palette.hidden = true;
  palette.innerHTML = `<button type="button" class="pp-plain am-tone am-tone--none" data-tone="" aria-label="No colour" data-tip="No colour">${SWATCH_OFF}</button>`
    + TONES.map((hex, i) => `<button type="button" class="pp-plain am-tone" data-tone="${hex}" style="background:${hex}" aria-label="Colour ${i + 1}"></button>`).join("");
  bar.appendChild(palette);

  bar.addEventListener("pointerdown", (e) => e.stopPropagation());
  bar.addEventListener("click", (e) => {
    e.stopPropagation();
    const tone = e.target.closest("[data-tone]");
    if (tone) { palette.hidden = true; return act("tone", tone.dataset.tone || null); }
    const which = e.target.closest("[data-sel]")?.dataset.sel;
    if (!which) return;
    if (which === "colour") { palette.hidden = !palette.hidden; return; }
    palette.hidden = true;
    act(which);
  });
  return {
    el: bar,
    show(count, tone) {
      bar.hidden = count === 0;
      bar.querySelector(".am-selbar__count").textContent = `${count} ${count === 1 ? "line" : "lines"}`;
      bar.querySelector(".am-selbar__chip").style.background = tone || "transparent";
      if (!count) palette.hidden = true;
    },
  };
}
