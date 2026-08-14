/* ============================================================================
   Manipulatives — the shelf and the canvas it opens
   ----------------------------------------------------------------------------
   The landing page is a shelf: three families of cards, drawn from the one
   registry in tools.js. Picking a card opens the canvas over the whole viewport
   and puts that tool on it. The dock inside the canvas is the same three
   families again, so nothing has to be learnt twice.

   Babylon is not loaded until the first card is pressed — the shelf is plain
   HTML and should cost nothing.
   ========================================================================== */

import { GROUPS, toolById } from "./tools.js";
import { ICON } from "./icons.js";

export function buildShelf(root, onOpen) {
  root.innerHTML = GROUPS.map(
    (g) => `
    <section class="bb-family" aria-labelledby="grp-${g.id}">
      <div class="bb-family__head">
        <h2 class="bb-family__title" id="grp-${g.id}">${g.label}</h2>
        <p class="bb-family__blurb">${g.blurb}</p>
      </div>
      <div class="bb-cards">
        ${g.tools
          .map(
            (t) => `
          <button class="bb-card" type="button" data-tool="${t.id}">
            <span class="bb-card__art">${t.art()}</span>
            <span class="bb-card__body">
              <span class="bb-card__title">${t.label}</span>
              <span class="bb-card__blurb">${t.blurb}</span>
            </span>
            <span class="bb-card__go">Open ${ICON.chevron}</span>
          </button>`
          )
          .join("")}
      </div>
    </section>`
  ).join("");

  root.addEventListener("click", (e) => {
    const card = e.target.closest("[data-tool]");
    if (!card) return;
    const tool = toolById(card.dataset.tool);
    if (tool) onOpen(tool);
  });
}

/** Open and close the full-screen canvas without losing the page behind it. */
export function createCanvasView(el, { onOpen, onClose } = {}) {
  let open = false;
  let scrollY = 0;

  function show() {
    if (open) return;
    open = true;
    scrollY = window.scrollY;
    document.body.classList.add("bb-locked");
    el.hidden = false;
    onOpen?.();
  }

  function hide() {
    if (!open) return;
    open = false;
    el.hidden = true;
    document.body.classList.remove("bb-locked");
    window.scrollTo(0, scrollY);
    onClose?.();
  }

  /* Escape is spoken for inside the canvas — it closes a popover and clears the
     selection — so leaving is only ever the Shelf button. Nobody loses a canvas
     full of work to a stray key. */

  return { show, hide, get isOpen() { return open; } };
}

/** The dock's three tabs, and what each of them offers. */
export function buildDock(tabsEl, panelEl, { onPlace, onPiece, onOwn, onPaint }) {
  tabsEl.innerHTML = GROUPS.map(
    (g, i) => `
    <button class="bb-dock__tab" type="button" role="tab" data-group="${g.id}"
      aria-selected="${i === 0}">${g.label}</button>`
  ).join("");

  function paint(groupId) {
    const g = GROUPS.find((x) => x.id === groupId) || GROUPS[0];
    [...tabsEl.children].forEach((b) =>
      b.setAttribute("aria-selected", String(b.dataset.group === g.id))
    );

    if (g.id === "blocks") {
      panelEl.innerHTML = `
        <span class="bb-dock__label">Add</span>
        ${["unit", "rod", "flat", "cube"]
          .map(
            (p) => `
          <button class="bb-piece bb-piece--num" type="button" data-place="${p}">
            <i class="bb-piece__swatch bb-swatch--${p}"></i>
            <span>${p[0].toUpperCase() + p.slice(1)}</span><em data-size="${p}">1</em>
          </button>`
          )
          .join("")}
        <button class="bb-piece bb-piece--own" type="button" id="bb-own-btn"
                aria-haspopup="dialog" aria-expanded="false">
          <i class="bb-piece__swatch bb-swatch--custom"></i>
          <span>Own size</span><em data-size="own">3×2×2</em>
        </button>`;
    } else {
      panelEl.innerHTML = `
        <span class="bb-dock__label">Add</span>
        ${g.tools
          .map(
            (t) => `
          <button class="bb-piece" type="button" data-tool="${t.id}">
            <i class="bb-piece__swatch bb-swatch--${t.kind === "abacus" ? "rod" : "flat"}"></i>
            <span>${t.short}</span>
          </button>`
          )
          .join("")}`;
    }
    // the panel was just replaced, so its icons and its live labels (a rod is
    // worth ten in base ten and five in base five) have to be filled in again
    onPaint?.();
  }

  tabsEl.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-group]");
    if (tab) paint(tab.dataset.group);
  });

  panelEl.addEventListener("click", (e) => {
    const piece = e.target.closest("[data-place]");
    if (piece) return onPiece(piece.dataset.place);
    const own = e.target.closest("#bb-own-btn");
    if (own) return onOwn(own);
    const tool = e.target.closest("[data-tool]");
    if (tool) return onPlace(toolById(tool.dataset.tool));
  });

  return { paint };
}
