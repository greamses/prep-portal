/* ============================================================================
   Cartesian Art — plotted points + outline
   ----------------------------------------------------------------------------
   Draws the vertices the player has registered and the polyline connecting them
   (closed into a polygon once the loop is finished). Markers carry their point
   id so a double-click can delete them. Repaints on every points/close change
   and after each grid render (resize / window change).
   ========================================================================== */

import { state, subscribe, deletePointById } from "./state.js";
import { layers, toPx, onRender } from "./grid.js";

const SVGNS = "http://www.w3.org/2000/svg";

function el(name, attrs = {}, parent = null) {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function clear(g) {
  while (g.firstChild) g.removeChild(g.firstChild);
}

function redraw() {
  const S = layers.shape;
  const P = layers.points;
  clear(S);
  clear(P);

  const pts = state.points;
  if (!pts.length) return;

  const px = pts.map((p) => toPx(p.x, p.y));

  // ── connecting outline ────────────────────────────────────────────────
  if (px.length >= 2) {
    const d =
      "M " + px.map((p) => `${p.x} ${p.y}`).join(" L ") + (state.closed ? " Z" : "");
    if (state.closed) {
      el("path", { d, class: "ca-shape-fill" }, S); // faint pre-paint fill
    }
    el("path", { d, class: "ca-shape-line" }, S);
  }

  // ── vertex markers ────────────────────────────────────────────────────
  px.forEach((p, i) => {
    const isFirst = i === 0;
    const m = el("g", {
      class: `ca-point${isFirst ? " ca-point--first" : ""}`,
      "data-id": pts[i].id,
      tabindex: "-1",
    }, P);
    el("circle", { cx: p.x, cy: p.y, r: 7, class: "ca-point-dot" }, m);
    el("text", { x: p.x, y: p.y - 12, class: "ca-point-label" }, m).textContent =
      `${pts[i].x},${pts[i].y}`;
  });
}

export function initPoints() {
  // double-click a marker to delete it
  layers.points.addEventListener("dblclick", (e) => {
    const host = e.target.closest(".ca-point");
    if (!host) return;
    e.preventDefault();
    deletePointById(Number(host.getAttribute("data-id")));
  });

  redraw();
  subscribe((reason) => {
    if (reason === "points" || reason === "close" || reason === "grid") redraw();
  });
  onRender(redraw);
}
