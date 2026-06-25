/* ============================================================================
   Cartesian Art — left tool rail (Photoshop-style)
   ----------------------------------------------------------------------------
   A fixed vertical rail of tool icons on the left. Each icon opens its panel
   (the old floating docks: Position / Shapes / Steer / Paint / Transform) as a
   flyout beside the rail. One panel is open at a time; clicking the active tool
   (or the panel's chevron) collapses it, giving the canvas back. Replaces the
   draggable-dock behaviour.
   ========================================================================== */

import { makeDraggable } from "./draggable.js";

const OPEN_KEY = "ca-rail-open-v1";

export function initToolRail(scope = document) {
  const rail = scope.querySelector("#ca-toolrail");
  if (!rail) return;

  const btns = [...rail.querySelectorAll(".ca-toolrail-btn")];

  // only docks that have a rail button are part of the accordion (the steering
  // pad is extracted and toggled separately — see main.js initSteer)
  const docks = {};
  btns.forEach((b) => {
    const d = scope.querySelector(`.ca-dock[data-dock="${b.dataset.panel}"]`);
    if (d) docks[b.dataset.panel] = d;
  });

  let open = "shapes"; // first visit: show a useful panel
  try {
    const saved = localStorage.getItem(OPEN_KEY);
    if (saved !== null) open = saved || null; // "" = deliberately all-closed
  } catch {}
  if (open && !docks[open]) open = null;

  const apply = () => {
    for (const k in docks) docks[k].classList.toggle("is-open", k === open);
    btns.forEach((b) => b.classList.toggle("is-active", b.dataset.panel === open));
    try { localStorage.setItem(OPEN_KEY, open || ""); } catch {}
  };

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      open = open === b.dataset.panel ? null : b.dataset.panel;
      apply();
    });
  });

  // the panel's chevron closes it; each panel is draggable by its header
  for (const k in docks) {
    docks[k].querySelector(".ca-dock-toggle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      open = null;
      apply();
    });
    makeDraggable(docks[k], docks[k].querySelector(".ca-dock-head"), `ca-dockpos-${k}`);
  }

  // the rail itself is draggable by its grip
  makeDraggable(rail, scope.querySelector("#ca-toolrail-grip"), "ca-rail-pos");

  apply();
}
