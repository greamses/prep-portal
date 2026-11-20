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

export function buildShelf(root, onOpen) {
  /* A CARD FOR EVERY THING ON THE CANVAS, under its family ("Make the canvas entry cards separate
     and use the items in the canvas as the image", 2026-11-20). The picture on each card is that
     thing as the canvas draws it — a capture kept in img/<tool>.jpg — and pressing the card opens
     the canvas with that thing already on it. Dressed as every other card the site offers a thing
     on: the receipt paper, the sticky tag, the read-more (/blogs/css/blog.css). */
  const ROTATE = ["--p1", "--p2", "--p3", "--p4", "--p5"];
  root.innerHTML = GROUPS.map((g, gi) => `
    <section class="bb-shelf__group" aria-label="${g.label}">
      <h2 class="bb-shelf__head">${g.label}</h2>
      <p class="bb-shelf__blurb">${g.blurb || ""}</p>
      <div class="bb-shelf__grid">${g.tools.map((t) => `
        <button class="science-card pp-receipt science-card${ROTATE[gi % ROTATE.length]} bb-shelf__card" type="button" data-tool="${t.id}">
          <span class="card-inner pp-receipt__paper">
            <span class="bb-shelf__shot"><img src="/prep-math/activity/base-blocks/img/${t.id}.jpg" alt="${t.label} on the canvas" loading="lazy" width="640" height="400"></span>
            <span class="card-badges"><span class="pp-sticky pp-sticky--c${gi % 6}">${g.label}</span></span>
            <span class="card-title">${t.label}</span>
            <span class="card-excerpt">${t.blurb || ""}</span>
            <span class="read-more">Open on the canvas ${ICON.chevron}</span>
          </span>
        </button>`).join("")}
      </div>
    </section>`).join("");
  root.classList.add("bb-shelf");
  return bindShelf(root, onOpen);

}

function bindShelf(root, onOpen) {
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
      /* The balance scale is a thing you put blocks ON, so it is offered after
         the pieces, across the whole panel the way the area frame is. */
      const scale = g.tools.find((t) => t.kind === "scale");
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
        </button>` + (scale ? `
        <button class="bb-piece bb-piece--wide" type="button" data-tool="${scale.id}"
                title="${scale.blurb}">
          <i class="bb-piece__swatch bb-swatch--rod"></i>
          <span>${scale.label}</span>
        </button>` : "");
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
            <i class="bb-piece__swatch bb-swatch--${
              t.kind === "abacus" ? "rod" : t.kind === "card" || t.kind === "note" ? "card" : "flat"
            }"></i>
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
