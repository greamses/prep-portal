/* ============================================================================
   Base Blocks — the trade offer that floats over the highlight
   ----------------------------------------------------------------------------
   The mat notices. Highlight ten units in base ten and a small card appears
   over them saying "10 units = 1 rod", and pressing it — or Enter — does the
   trade. Highlight the rod instead and the same card says it the other way
   round.

   IT OFFERS, IT DOES NOT ACT. Selection on this mat is also how you colour,
   move and delete blocks, so a highlight that regrouped itself would make
   "pick ten units and paint them blue" impossible. Nothing changes until the
   card is pressed.

   The card is HTML over the canvas rather than a 3D label: it has to be
   readable at any camera angle and legible at any distance, which a billboard
   in the scene is not. It is placed each frame from the projected centroid of
   the highlighted meshes, because the camera can orbit under it.
   ========================================================================== */

import { store, emit, say } from "./state.js";
import { regroupCheck, regroupSentence, regroupSelected } from "./ops.js";
import { ICON } from "./icons.js";

const B = () => window.BABYLON;

const ARROWS = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
  stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M8 4v16"/><path d="m4.5 7.5 3.5-3.5 3.5 3.5"/>
  <path d="M16 20V4"/><path d="m12.5 16.5 3.5 3.5 3.5-3.5"/></svg>`;

/* What the card offers, as a glyph. The sentence above it already says it in
   words; the button only has to say "do it", and an icon does that in a corner
   instead of a line. */
const DEED = {
  split: { icon: "split", say: "Trade down" },
  up: { icon: "merge", say: "Trade up" },
  regroup: { icon: "regroup", say: "Regroup" },
};

export function createRegroupPrompt(ctx, view, stage) {
  const { scene, camera } = ctx;

  const card = document.createElement("button");
  card.type = "button";
  /* A note the canvas sticks on the pile, offering the trade — the same paper
     everything else here says things on. */
  card.className = "bb-trade pp-sticky pp-sticky--c5";
  card.hidden = true;
  /* Two glyphs and no words. The card sits ON the blocks it is about, where a
     sentence covers the very thing it is describing; what it says in words is
     on its tooltip, and the toast says it out loud the moment you press. */
  card.innerHTML = `
    <span class="bb-trade__ico">${ARROWS}</span>
    <span class="bb-trade__go"></span>`;
  stage.appendChild(card);

  const go = card.querySelector(".bb-trade__go");

  let live = null;   // the check the card is currently showing

  function accept() {
    if (!live) return;
    /* The card carries no words, so the sentence it WOULD have shown is said
       here instead — after the trade, when it is a description of what just
       happened rather than a label sitting on top of the blocks. */
    const said = regroupSentence(live, store.base);
    if (regroupSelected()) { say(said, "ok"); emit(); }
  }

  card.addEventListener("click", accept);

  /* Enter accepts. Deliberately not in ui.js's keydown block with the letter
     shortcuts: this one only exists while the card is up, and a key that does
     nothing most of the time should not be listed as if it always works. */
  function onKey(e) {
    if (e.key !== "Enter" || !live) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    accept();
  }
  window.addEventListener("keydown", onKey);

  /** Re-read the store: is there an offer to make, and what does it say? */
  function refresh() {
    /* Quiet means quiet. This is an offer nobody asked for, and the same trade
       is on the Blocks kit the moment it IS wanted. */
    if (store.quiet) { live = null; card.hidden = true; return; }
    const sel = store.blocks.filter((b) => store.selection.has(b.id));
    const check = sel.length ? regroupCheck(sel, store.base) : { ok: false };

    if (!check.ok) { live = null; card.hidden = true; return; }

    live = check;
    const said = regroupSentence(check, store.base);
    const deed = DEED[check.dir !== "merge" ? "split" : check.exact ? "up" : "regroup"];
    go.innerHTML = ICON[deed.icon];
    card.setAttribute("aria-label", `${deed.say} — ${said}`);
    card.title = `${said} — ${deed.say} (Enter)`;
    card.dataset.dir = check.dir;
    card.hidden = false;
    place();
  }

  /* Over the middle of the highlight, lifted clear of the tallest piece in it
     so the card never sits on top of the blocks it is describing. */
  function place() {
    if (card.hidden) return;
    const BJS = B();
    const engine = scene.getEngine();
    const rect = stage.getBoundingClientRect();
    const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const sx = rect.width / engine.getRenderWidth();
    const sy = rect.height / engine.getRenderHeight();

    let n = 0;
    let x = 0;
    let y = 0;
    let top = Infinity;
    for (const id of store.selection) {
      const mesh = view.meshOf(id);
      // abacus frames and boards come back as a transform node, not a mesh —
      // they are never part of a trade, so they are simply not in the average
      if (!mesh || !mesh.getBoundingInfo) continue;
      const bb = mesh.getBoundingInfo().boundingBox;
      // The top-centre of the piece, not its middle — otherwise a tall cube
      // wears the card halfway down its front face.
      const at = new BJS.Vector3(mesh.position.x, bb.maximumWorld.y, mesh.position.z);
      const p = BJS.Vector3.Project(at, BJS.Matrix.Identity(), scene.getTransformMatrix(), vp);
      x += p.x * sx;
      y += p.y * sy;
      top = Math.min(top, p.y * sy);
      n += 1;
    }
    if (!n) { card.hidden = true; return; }

    const w = card.offsetWidth;
    const h = card.offsetHeight;
    // Centred on the group, but pinned to the HIGHEST piece so it clears them
    // all, and kept inside the stage so it is never half off the canvas.
    let cx = x / n - w / 2;
    let cy = top - h - 12;
    cx = Math.max(8, Math.min(rect.width - w - 8, cx));
    cy = Math.max(8, Math.min(rect.height - h - 8, cy));
    card.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy)}px)`;
  }

  // The camera can orbit without the store changing, so the card is placed
  // after every render rather than only when something happens.
  const obs = scene.onAfterRenderObservable.add(place);

  return {
    refresh,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      window.removeEventListener("keydown", onKey);
      card.remove();
    },
  };
}
