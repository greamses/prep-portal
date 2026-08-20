/* ============================================================================
   Manipulatives — the shelf and the canvas it opens
   ----------------------------------------------------------------------------
   The landing page is a shelf: one card per family, drawn from the one
   registry in tools.js. Picking a card opens the canvas over the whole viewport
   and puts that tool on it. The dock inside the canvas is the same families
   again, so nothing has to be learnt twice.

   Babylon is not loaded until the first card is pressed — the shelf is plain
   HTML and should cost nothing.
   ========================================================================== */

import { GROUPS, TOOLS, toolById } from "./tools.js";
import { ICON } from "./icons.js";
import { worksInBase } from "./abacus.js";
import { TILES } from "./tiles.js";

/* Which tool the canvas opens on. The dock has every one of them, so the shelf
   does not need to: one card is the door, and choosing happens inside. */
const DOOR = "base-blocks";

/* The card counts the tools out loud, so a family added to the registry is
   announced instead of leaving the copy a number behind. Prose on this page is
   written, not numbered — the digits are for the canvas. */
const COUNTS = ["no", "one", "two", "three", "four", "five", "six", "seven",
                "eight", "nine", "ten", "eleven", "twelve"];
const spell = (n) => COUNTS[n] || String(n);

export function buildShelf(root, onOpen) {
  /* One picture from each family — taken from the registry, so a family added
     to tools.js shows up here instead of being quietly left off the door. The
     face of a family is its first tool unless it names another. */
  const strip = GROUPS.map((g) => toolById(g.face || g.tools[0]?.id))
    .filter(Boolean)
    .map((t) => `<span class="bb-card__pic">${t.art()}</span>`)
    .join("");

  root.innerHTML = `
    <button class="bb-card bb-card--solo" type="button" data-tool="${DOOR}">
      <span class="bb-card__art bb-card__art--strip">${strip}</span>
      <span class="bb-card__body">
        <span class="bb-card__title">Open the workbench</span>
        <span class="bb-card__blurb">
          ${GROUPS.map((g) => g.label).join(" · ")} — ${spell(TOOLS.length)} things on
          one endless sheet of squared paper. Blocks to split and trade in any base,
          three counting frames, algebra tiles and cubes, and charts to stand the
          blocks on. Everything is in the rail down the side once you are in.
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

/** The Add panel's tabs — one per family — and what each of them offers. */
export function buildDock(tabsEl, panelEl, { onPlace, onPiece, onTile, onOwn, onPaint, base }) {
  /* The tabs are icons: the family names written across the panel cost a strip
     of canvas, and what is under each of them says the same thing in the things
     it holds. */
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
    } else if (g.id === "tiles") {
      /* Ten pieces and a red one of each — the cubes first, then the flats and
         the rods, the way an expression is written. The negatives are a SECOND
         ROW of the same ten rather than a separate list, because that is what
         they are: the same pieces turned over. */
      /* The frame goes at the head of the family's panel: it is the board the
         pieces are laid on, so it is offered before the pieces are. */
      const frame = g.tools.find((t) => t.kind === "board");
      panelEl.innerHTML = (frame ? `
        <button class="bb-piece bb-piece--wide" type="button" data-tool="${frame.id}"
                title="${frame.blurb}">
          <i class="bb-piece__swatch bb-swatch--flat"></i>
          <span>${frame.label}</span>
        </button>` : "")
        + TILES.map((t) => `
        <button class="bb-piece bb-piece--tile" type="button"
                data-tile="${t.id}" data-sign="1" title="One ${t.label} tile">
          <i class="bb-piece__swatch" style="background:var(${t.token}, ${t.fallback})"></i>
          <span>${t.label}</span>
        </button>`).join("")
        + TILES.map((t) => `
        <button class="bb-piece bb-piece--tile bb-piece--minus" type="button"
                data-tile="${t.id}" data-sign="-1" title="One negative ${t.label} tile">
          <i class="bb-piece__swatch" style="background:#d2544a"></i>
          <span>−${t.label}</span>
        </button>`).join("");
    } else {
      panelEl.innerHTML = `
        ${g.tools
          .map((t) => {
            /* A soroban keeps a bead worth five above its bar, which is a fact
               about ten and not about the frame — so away from base ten it is
               offered but not pressable, with the reason on it. */
            const off = t.kind === "abacus" && !worksInBase(t.variant, base());
            return `
          <button class="bb-piece" type="button" data-tool="${t.id}"
            ${off ? `disabled title="A ${t.short.toLowerCase()} only counts in base ten. Change the base back, or use the schoty."` : ""}>
            <i class="bb-piece__swatch bb-swatch--${t.kind === "abacus" ? "rod" : "flat"}"></i>
            <span>${t.short}</span>
          </button>`;
          })
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
    const tile = e.target.closest("[data-tile]");
    if (tile) return onTile(tile.dataset.tile, Number(tile.dataset.sign));
    const own = e.target.closest("#bb-own-btn");
    if (own) return onOwn(own);
    const tool = e.target.closest("[data-tool]");
    if (tool) return onPlace(toolById(tool.dataset.tool));
  });

  return { paint };
}
