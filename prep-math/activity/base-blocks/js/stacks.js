/* ============================================================================
   MANIPULATIVES — tools inside tools
   ----------------------------------------------------------------------------
   The rail had every key on show at once, which is a wall to read before any
   of it can be used. Some of those keys are ALTERNATIVES — four ways of
   changing a block, two ways of choosing one — and alternatives belong in a
   stack: one showing, a small corner arrow saying there is more, and the rest
   a press away. The same slot a photo editor's toolbar uses.

   What is NOT stacked matters as much. Undo and Redo are opposites pressed in
   quick succession, and so are Closer and Further, and Lift and Down: hiding
   one behind the other would cost a press every time the direction changed.
   A stack is for picking a tool, never for firing one repeatedly.

   The rail wires itself by delegation on [data-act], so moving the buttons
   about changes nothing about what they do — the keys still work, they are
   just kept somewhere tidier.
   ========================================================================== */

/** One showing, the rest a press away. The first is what shows to begin with. */
export const STACKS = [
  { id: "change", label: "ways to change the blocks", acts: ["regroup", "split", "merge", "break"] },
  { id: "choose", label: "ways to choose blocks", acts: ["match", "lasso"] },
  { id: "turn", label: "ways to turn a thing", acts: ["turn", "tip"] },
  { id: "snap", label: "what a thing snaps to", acts: ["snapSide", "snapGrid"] },
];

const ARROW =
  '<svg viewBox="0 0 8 8" width="7" height="7" aria-hidden="true">'
  + '<path d="M8 8H2.6L8 2.6Z" fill="currentColor"/></svg>';

const HOLD_MS = 420;   // a press this long opens the stack instead of firing

/**
 * Fold the rail's alternatives into stacks.
 *
 * Safe to call on a rail that has already been folded — it looks for the
 * buttons by their action, and a button already in a stack is left alone.
 */
export function stackRail(rail) {
  if (!rail || rail.dataset.stacked === "1") return;
  rail.dataset.stacked = "1";

  for (const spec of STACKS) {
    const keys = spec.acts
      .map((a) => rail.querySelector(`[data-act="${a}"]`))
      .filter(Boolean);
    if (keys.length < 2) continue;      // nothing to stack

    const box = document.createElement("div");
    box.className = "bb-stack";
    box.dataset.stack = spec.id;
    keys[0].before(box);

    /* The flyout hangs off the RAIL, not off the key. The kits are a grid
       several keys wide, so "just past the key" lands on its neighbour — the
       flyout has to clear the whole rail, and only the rail knows how wide
       that is. It stays inside the rail, so a press on it still reaches the
       rail's delegation and fires the tool. */
    const fly = document.createElement("div");
    fly.className = "bb-stack__fly";
    fly.dataset.stack = spec.id;
    fly.hidden = true;

    const more = document.createElement("button");
    more.type = "button";
    more.className = "bb-stack__more";
    more.setAttribute("aria-expanded", "false");
    more.setAttribute("aria-label", `More ${spec.label}`);
    more.title = `More ${spec.label}`;
    more.innerHTML = ARROW;

    box.append(keys[0], more);
    rail.append(fly);
    keys.slice(1).forEach((k) => fly.append(k));

    /* ── opening ─────────────────────────────────────────────────────────*/
    const shut = () => { fly.hidden = true; more.setAttribute("aria-expanded", "false"); };
    const open = () => {
      /* only one stack open at a time, or the rail is a thicket */
      rail.querySelectorAll(".bb-stack__fly").forEach((f) => { if (f !== fly) f.hidden = true; });
      rail.querySelectorAll(".bb-stack__more").forEach((m) => {
        if (m !== more) m.setAttribute("aria-expanded", "false");
      });
      /* Put it beside the rail and level with its own key. Measured when it
         opens, because the rail is a different width on the page and in a
         workbook panel, and it moves when the window does. */
      const railBox = rail.getBoundingClientRect();
      const faceBox = box.getBoundingClientRect();
      fly.style.top = `${Math.round(faceBox.top - railBox.top)}px`;
      fly.style.left = `${Math.round(railBox.width + 8)}px`;
      fly.hidden = false;
      more.setAttribute("aria-expanded", "true");
    };

    more.addEventListener("click", (e) => {
      e.stopPropagation();          // the arrow opens; it never fires a tool
      if (fly.hidden) open(); else shut();
    });

    /* A long press on the face opens the stack too — the way the same slot
       behaves in a photo editor. A short press is just the tool. */
    let held = null;
    box.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".bb-stack__more, .bb-stack__fly")) return;
      held = setTimeout(() => { held = null; open(); }, HOLD_MS);
    });
    const letGo = () => { if (held) { clearTimeout(held); held = null; } };
    box.addEventListener("pointerup", letGo);
    box.addEventListener("pointercancel", letGo);
    box.addEventListener("pointerleave", letGo);

    /* ── picking one out of the stack ────────────────────────────────────
       The chosen tool becomes the one on show, as it does in a photo editor:
       the slot remembers what you last reached for. The click goes on up to
       the rail and fires the tool as usual — the swap is put off to the next
       turn of the loop so the DOM is not rearranged mid-dispatch. */
    fly.addEventListener("click", (e) => {
      const picked = e.target.closest("[data-act]");
      if (!picked) return;
      shut();
      setTimeout(() => {
        const face = box.querySelector(":scope > [data-act]");
        if (!face || face === picked) return;
        fly.append(face);
        box.insertBefore(picked, more);
      }, 0);
    });
  }

  /* A press anywhere else puts an open stack away — but NOT a press inside the
     flyout itself, which now hangs off the rail rather than off the key: this
     guard used to name only .bb-stack, so pressing a tool in the flyout shut it
     before the click could land and the tool never fired. */
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".bb-stack, .bb-stack__fly")) return;
    rail.querySelectorAll(".bb-stack__fly").forEach((f) => { f.hidden = true; });
    rail.querySelectorAll(".bb-stack__more").forEach((m) => m.setAttribute("aria-expanded", "false"));
  });
  rail.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    rail.querySelectorAll(".bb-stack__fly").forEach((f) => { f.hidden = true; });
    rail.querySelectorAll(".bb-stack__more").forEach((m) => m.setAttribute("aria-expanded", "false"));
  });
}
