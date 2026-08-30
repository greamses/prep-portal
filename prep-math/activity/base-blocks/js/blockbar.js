/* ============================================================================
   Manipulatives — the keys that belong to the block in your hand
   ----------------------------------------------------------------------------
   Everything you can do TO A BLOCK — split it, merge it, regroup it, break it
   to units, pick every one like it — is in the rail down the side, and it
   always will be. But the rail is the far side of the canvas from the block you
   are looking at, and the whole of this workbench is meant to be worked with
   your hands: pick a block up and the same keys appear in a strip UNDER IT, the
   way the turn and lift handles appear at its corner.

   The strip is the rail's keys, not a second set of them: it dispatches the
   same actions by name, and it greys out the same keys the rail greys out, so
   there is exactly one answer to "can I merge this" and both places give it.

   Pinned by projecting the corners of the block's CELL-SPACE box, the way
   turn.js pins its handles — and re-pinned after every render, because the
   camera can orbit without the store changing.
   ========================================================================== */

import { selected } from "./state.js";
import { footprint, topOf } from "./layout.js";
import { ICON } from "./icons.js";

const B = () => window.BABYLON;

/* The block keys, in the order the rail has them. Regroup first: it is the one
   that answers "sort this out for me", and the others are the hand-worked ways
   of getting to the same place. */
const KEYS = [
  { act: "regroup", icon: "regroup", name: "Regroup", hint: "Regroup into the best grouping for this base (R)" },
  { act: "split", icon: "split", name: "Split", hint: "Split (S)" },
  { act: "merge", icon: "merge", name: "Merge", hint: "Merge (M)" },
  { act: "break", icon: "crumbs", name: "To units", hint: "Break it all the way down to units (B)" },
  { act: "match", icon: "match", name: "Match", hint: "Pick every block this size" },
];

export function createBlockBar(ctx, view, stage, { onAct = () => {}, enabled = () => true } = {}) {
  const { scene, camera } = ctx;

  const bar = document.createElement("div");
  bar.className = "bb-blockbar";
  bar.hidden = true;
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "What to do with the block you are holding");
  /* On the shared receipt's paper like every other panel here — see style.css.
     Two elements because a filter under a mask gets clipped. */
  bar.innerHTML = `<div class="pp-receipt__paper bb-paper bb-blockbar__paper">`
    + KEYS.map((k) => `
    <button class="bb-blockbar__key" type="button" data-act="${k.act}"
            title="${k.hint}" aria-label="${k.hint}">
      <span>${ICON[k.icon]}</span><em>${k.name}</em>
    </button>`).join("")
    + `</div>`;
  stage.appendChild(bar);

  /* A press on the strip is a press on the strip and not on the paper under it:
     without this the canvas takes it as a press on bare paper, puts the block
     down, and the strip vanishes from under the finger that was aiming at it. */
  bar.addEventListener("pointerdown", (e) => e.stopPropagation());
  bar.addEventListener("click", (e) => {
    const key = e.target.closest("[data-act]");
    if (!key || key.disabled) return;
    onAct(key.dataset.act);
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

  /**
   * Under the LOWEST edge of the BLOCKS picked up, and centred on them.
   *
   * The blocks and not the whole selection, because the blocks are what these
   * keys act on: sweep a box round a block and a chart and the strip belongs
   * over the block, not halfway across the chart it cannot do anything to.
   */
  function place() {
    const picked = selected();
    if (!picked.length) { bar.hidden = true; return; }

    let left = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const b of picked) {
      const f = footprint(b);
      for (const x of [b.x, b.x + f.l]) {
        for (const z of [b.z, b.z + f.w]) {
          for (const y of [b.y || 0, topOf(b)]) {
            const p = project(x, y, z);
            left = Math.min(left, p.x);
            right = Math.max(right, p.x);
            bottom = Math.max(bottom, p.y);
          }
        }
      }
    }
    if (!isFinite(bottom)) { bar.hidden = true; return; }

    const rect = stage.getBoundingClientRect();
    const w = bar.offsetWidth || 200;
    const h = bar.offsetHeight || 40;

    /* Centred under the block — but never reaching PAST its right-hand edge,
       because that is where the turn and lift handles hang, and they sit above
       the strip. A wide block is wider than the strip and gets it centred; a
       unit is not, and gets it tucked to its left so the handles stay clear. */
    const middle = (left + right) / 2 - w / 2;
    const clear = right - w;
    const x = Math.max(8, Math.min(rect.width - w - 8, Math.min(middle, clear)));
    const y = Math.max(8, Math.min(rect.height - h - 8, bottom + 12));
    bar.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  /**
   * Show it only when there is a BLOCK in hand, and grey out the keys the rail
   * greys out. A frame, a chart, a tile or a note has nothing in this strip to
   * offer, so it does not get one.
   */
  function refresh() {
    const blocks = selected();
    const on = blocks.length > 0;
    bar.hidden = !on;
    if (!on) return;
    for (const key of bar.querySelectorAll("[data-act]")) {
      key.disabled = !enabled(key.dataset.act);
    }
    place();
  }

  const obs = scene.onAfterRenderObservable.add(() => { if (!bar.hidden) place(); });

  return {
    refresh,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      bar.remove();
    },
  };
}
