/* ============================================================================
   Cartesian Art — task panel (puzzle HUD)
   ----------------------------------------------------------------------------
   When a task (puzzle) is loaded, a "Task" icon appears on the tool rail and
   opens this draggable panel — the studio's puzzle HUD. It shows the object
   name, the worksheet (each "Line": its colour + the coordinates to plot), live
   progress, and Check / Exit. It does NOT plot the points — that's the exercise;
   a "Show dots" switch can reveal the numbered targets as a hint.
   ========================================================================== */

import { state, subscribe, scoreAttempt, exitPuzzle } from "./state.js";
import { makeDraggable } from "./draggable.js";
import { setShowTargets, showResult } from "./puzzle-mode.js";
import { fmtCoord } from "./scale.js";

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

const coordText = (pts) => pts.map((p) => `(${fmtCoord(p.x)}, ${fmtCoord(p.y)})`).join(", ");

function updateProgress() {
  const el = $("#task-progress");
  if (!el || state.mode !== "puzzle") return;
  const s = scoreAttempt();
  el.textContent = `${s.correct}/${s.total} points`;
}

function render() {
  const obj = $("#task-object");
  const prompt = $("#task-prompt");
  const host = $("#task-lines");
  if (!host) return;
  if (obj) obj.textContent = state.puzzle?.title || "Mystery picture";
  if (prompt) {
    prompt.textContent = state.puzzle?.prompt ||
      "Plot these points in order and join them with line segments. Use the colours shown.";
  }
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
  updateProgress();
}

/* show/hide the panel + its rail icon */
function showPanel(on) {
  $("#dock-task")?.classList.toggle("is-open", on);
  $("#rail-task")?.classList.toggle("is-active", on);
}
function revealTool(on) {
  const btn = $("#rail-task");
  if (btn) btn.hidden = !on;
  if (!on) showPanel(false);
}

export function initTaskPanel() {
  const dock = $("#dock-task");
  if (!dock) return;

  $("#rail-task")?.addEventListener("click", () => showPanel(!dock.classList.contains("is-open")));
  $("#task-close")?.addEventListener("click", () => showPanel(false));
  $("#task-show-dots")?.addEventListener("change", (e) => setShowTargets(e.target.checked));
  $("#task-check")?.addEventListener("click", showResult);
  $("#task-exit")?.addEventListener("click", () => exitPuzzle());
  makeDraggable(dock, dock.querySelector(".ca-dock-head"), "ca-taskpos");

  subscribe((reason) => {
    if (reason === "puzzle") {
      const inPuzzle = state.mode === "puzzle" && !!state.puzzle;
      if (inPuzzle) {
        render();
        const dots = $("#task-show-dots");
        if (dots) dots.checked = false; // each task starts coordinates-only
        revealTool(true);
        showPanel(true);
      } else {
        revealTool(false);
      }
    } else if (reason === "points" || reason === "close" || reason === "shapes") {
      updateProgress();
    }
  });
}
