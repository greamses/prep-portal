/* ============================================================================
   Cartesian Art — task panel (puzzle mode)
   ----------------------------------------------------------------------------
   When a task (puzzle) is loaded, this draggable, toggleable panel shows the
   worksheet the learner works from: the object name, and for each "Line" its
   colour and the list of coordinates to plot. It does NOT plot the points —
   that's the exercise. A "Show dots" switch can reveal the numbered targets on
   the grid as a hint (puzzle-mode.setShowTargets).
   ========================================================================== */

import { state, subscribe } from "./state.js";
import { makeDraggable } from "./draggable.js";
import { setShowTargets } from "./puzzle-mode.js";

const $ = (s) => document.querySelector(s);

/** Lines to display: prefer saved shapes (with colours), else the flat points. */
function taskLines() {
  const p = state.puzzle;
  if (!p) return [];
  if (Array.isArray(p.shapes) && p.shapes.length) {
    return p.shapes.map((s) => ({
      points: s.points || [],
      fill: s.fillColor || null,
      stroke: s.strokeColor || null,
    }));
  }
  return [{ points: p.targets || [], fill: null, stroke: null }];
}

function coordText(points) {
  return points.map((pt) => `(${pt.x}, ${pt.y})`).join(", ");
}

function render() {
  const obj = $("#task-object");
  const host = $("#task-lines");
  if (!host) return;
  if (obj) obj.textContent = state.puzzle?.title || "Mystery picture";
  host.innerHTML = "";
  taskLines().forEach((ln, i) => {
    if (!ln.points.length) return;
    const row = document.createElement("div");
    row.className = "ca-task-line";

    const sw = document.createElement("span");
    sw.className = "ca-task-swatch";
    sw.style.background = ln.fill || "transparent";
    sw.style.borderColor = ln.stroke || ln.fill || "var(--ink)";
    row.appendChild(sw);

    const body = document.createElement("div");
    body.className = "ca-task-line-body";
    body.innerHTML =
      `<span class="ca-task-line-name">Line ${i + 1}</span>` +
      `<span class="ca-task-coords">${coordText(ln.points)}</span>`;
    row.appendChild(body);

    host.appendChild(row);
  });
}

function show(on) {
  $("#dock-task")?.classList.toggle("is-open", on);
  $("#mission-coords")?.classList.toggle("is-active", on);
}

export function initTaskPanel() {
  const dock = $("#dock-task");
  if (!dock) return;

  $("#mission-coords")?.addEventListener("click", () =>
    show(!dock.classList.contains("is-open"))
  );
  $("#task-close")?.addEventListener("click", () => show(false));
  $("#task-show-dots")?.addEventListener("change", (e) => setShowTargets(e.target.checked));
  makeDraggable(dock, dock.querySelector(".ca-dock-head"), "ca-taskpos");

  subscribe((reason) => {
    if (reason !== "puzzle") return;
    if (state.mode === "puzzle" && state.puzzle) {
      render();
      const dots = $("#task-show-dots");
      if (dots) dots.checked = false; // each task starts coordinates-only
      show(true);
    } else {
      show(false);
    }
  });
}
