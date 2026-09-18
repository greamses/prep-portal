/* ============================================================================
   Manipulatives — the balance key that stands over every scale
   ----------------------------------------------------------------------------
   Press the balance and the scale is made level: x becomes whatever the blocks
   on the pans say it must weigh. It is THE thing a scale is for, so the key is
   always there over the scale's pillar, not only while the scale is picked up —
   a learner who has just loaded a pan should not have to find the scale's frame
   and pick it up before they can ask it the question.

   Beside it, a key to tip the pans out. Both are DOM keys pinned by projecting
   a point over the pillar, the way turn.js pins its handles, and re-pinned
   after every render because the camera moves without the store changing.
   ========================================================================== */

import { store } from "./state.js";
import { footprint } from "./layout.js";
import { ICON } from "./icons.js";
import { scales, weigh, SCALE_TOP } from "./scale.js";

const B = () => window.BABYLON;

export function createScaleBar(ctx, stage, { onBalance = () => {}, onEmpty = () => {} } = {}) {
  const { scene, camera } = ctx;
  const bars = new Map(); // scale id → element

  function make(id) {
    const bar = document.createElement("div");
    bar.className = "bb-scalebar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "The balance scale");
    bar.innerHTML = `<div class="pp-receipt__paper bb-paper bb-scalebar__paper">
      <button class="bb-scalebar__key bb-scalebar__key--balance" type="button" data-act="balance"
              aria-label="Balance the scale: x becomes what the blocks weigh">
        <span>${ICON.balance}</span><em>Balance</em>
      </button>
      <button class="bb-scalebar__key" type="button" data-act="empty"
              aria-label="Empty both pans">
        <span>${ICON.unload}</span><em>Empty</em>
      </button>
    </div>`;
    /* A press on the key is not a press on the paper under it. */
    bar.addEventListener("pointerdown", (e) => e.stopPropagation());
    bar.addEventListener("click", (e) => {
      const key = e.target.closest("[data-act]");
      const thing = store.things.find((t) => t.id === id);
      if (!key || key.disabled || !thing) return;
      if (key.dataset.act === "balance") onBalance(thing);
      else onEmpty(thing);
    });
    stage.appendChild(bar);
    return bar;
  }

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
      z: p.z,
    };
  }

  /* Over the top of the pillar, clear of the needle. */
  function place() {
    const rect = stage.getBoundingClientRect();
    for (const [id, bar] of bars) {
      const t = store.things.find((s) => s.id === id);
      if (!t) continue;
      const f = footprint(t);
      const p = project(t.x + f.l / 2, SCALE_TOP, t.z + f.w / 2 + 1);
      const off = !isFinite(p.x) || p.z < 0 || p.z > 1
        || p.x < -40 || p.y < -40 || p.x > rect.width + 40 || p.y > rect.height + 40;
      bar.style.visibility = off ? "hidden" : "";
      if (off) continue;
      const w = bar.offsetWidth || 90;
      const h = bar.offsetHeight || 40;
      const x = Math.max(8, Math.min(rect.width - w - 8, p.x - w / 2));
      const y = Math.max(8, Math.min(rect.height - h - 8, p.y - h));
      bar.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }
  }

  function refresh() {
    const live = scales(store.things);
    const ids = new Set(live.map((t) => t.id));
    for (const [id, bar] of bars) {
      if (!ids.has(id)) { bar.remove(); bars.delete(id); }
    }
    for (const t of live) {
      if (!bars.has(t.id)) bars.set(t.id, make(t.id));
      const bar = bars.get(t.id);
      const w = weigh(t, store.xValue);
      const loaded = t.left.length + t.right.length > 0;
      bar.classList.toggle("is-level", w.level);
      const bal = bar.querySelector('[data-act="balance"]');
      bal.setAttribute("aria-pressed", String(w.level));
      bar.querySelector('[data-act="empty"]').disabled = !loaded;
    }
    place();
  }

  const obs = scene.onAfterRenderObservable.add(() => { if (bars.size) place(); });

  return {
    refresh,
    destroy() {
      scene.onAfterRenderObservable.remove(obs);
      bars.forEach((b) => b.remove());
      bars.clear();
    },
  };
}
