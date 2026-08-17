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

/* Which tool the canvas opens on. The dock has all seven, so the shelf does not
   need to: one card is the door, and choosing happens inside. */
const DOOR = "base-blocks";

export function buildShelf(root, onOpen) {
  /* One picture from each family, so the card shows what is behind it without
     turning back into a list of seven. */
  const strip = ["base-blocks", "soroban", "place-value"]
    .map((id) => toolById(id))
    .filter(Boolean)
    .map((t) => `<span class="bb-card__pic">${t.art()}</span>`)
    .join("");

  root.innerHTML = `
    <button class="bb-card bb-card--solo" type="button" data-tool="${DOOR}">
      <span class="bb-card__art bb-card__art--strip">${strip}</span>
      <span class="bb-card__body">
        <span class="bb-card__title">Open the workbench</span>
        <span class="bb-card__blurb">
          ${GROUPS.map((g) => g.label).join(" · ")} — seven things on one endless
          sheet of squared paper. Blocks to split and trade in any base, three
          counting frames, and charts to stand the blocks on. Everything is in
          the dock along the bottom once you are in.
        </span>
      </span>
      <span class="bb-card__go">Open the canvas ${ICON.chevron}</span>
    </button>`;

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

/** The Add panel's three tabs, and what each of them offers. */
export function buildDock(tabsEl, panelEl, { onPlace, onPiece, onOwn, onPaint }) {
  /* The tabs are icons: three words across the panel cost a strip of canvas,
     and what is under each of them says the same thing in the things it holds. */
  tabsEl.innerHTML = GROUPS.map(
    (g, i) => `
    <button class="bb-dock__tab" type="button" role="tab" data-group="${g.id}"
      aria-selected="${i === 0}" aria-label="${g.label}" title="${g.label}">
      <span data-icon="${g.icon}"></span>
    </button>`
  ).join("");

  function paint(groupId) {
    const g = GROUPS.find((x) => x.id === groupId) || GROUPS[0];
    [...tabsEl.children].forEach((b) =>
      b.setAttribute("aria-selected", String(b.dataset.group === g.id))
    );

    if (g.id === "blocks") {
      panelEl.innerHTML = `
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
