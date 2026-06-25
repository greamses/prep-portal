/* ============================================================================
   Cartesian Art — plotted points + outline
   ----------------------------------------------------------------------------
   Draws the vertices the player has registered and the polyline connecting them
   (closed into a polygon once the loop is finished). Markers carry their point
   id so a double-click can delete them. Repaints on every points/close change
   and after each grid render (resize / window change).
   ========================================================================== */

import { state, subscribe, deletePointById, activeShape } from "./state.js";
import { layers, toPx, onRender } from "./grid.js";
import { isAnimatingActive } from "./transform-mode.js";

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

export function redrawPoints() {
  const S = layers.shape;
  const P = layers.points;
  clear(S);
  clear(P);

  const active = activeShape();

  for (const shape of state.shapes) {
    const pts = shape.points;
    if (!pts.length) continue;
    const isActive = shape.id === active.id;
    // while the active shape is mid-transform, its outline is drawn (animated)
    // in the anim layer instead, so skip the static copy here
    if (isActive && isAnimatingActive(shape.id)) continue;
    const px = pts.map((p) => toPx(p.x, p.y));

    // ── connecting outline ──────────────────────────────────────────────
    if (px.length >= 2) {
      const d =
        "M " + px.map((p) => `${p.x} ${p.y}`).join(" L ") + (shape.closed ? " Z" : "");
      if (shape.closed) {
        const f = el("path", { d, class: "ca-shape-fill" }, S); // faint pre-paint fill
        if (shape.fillColor) f.setAttribute("style", `fill:${shape.fillColor}`);
      }
      const line = el("path", {
        d,
        class: `ca-shape-line${isActive ? "" : " ca-shape-line--idle"}`,
      }, S);
      if (shape.strokeColor) line.setAttribute("style", `stroke:${shape.strokeColor}`);
    }

    // ── vertex markers ──────────────────────────────────────────────────
    px.forEach((p, i) => {
      const isFirst = i === 0;
      const m = el("g", {
        class: `ca-point${isFirst ? " ca-point--first" : ""}${isActive ? "" : " ca-point--idle"}`,
        "data-id": pts[i].id,
        tabindex: "-1",
      }, P);
      el("circle", { cx: p.x, cy: p.y, r: isActive ? 7 : 5, class: "ca-point-dot" }, m);
      if (isActive) {
        el("text", { x: p.x, y: p.y - 12, class: "ca-point-label" }, m).textContent =
          `${pts[i].x},${pts[i].y}`;
      }
    });
  }
}

export function initPoints() {
  // double-click a marker to delete it
  layers.points.addEventListener("dblclick", (e) => {
    const host = e.target.closest(".ca-point");
    if (!host) return;
    e.preventDefault();
    deletePointById(Number(host.getAttribute("data-id")));
  });

  redrawPoints();
  subscribe((reason) => {
    if (reason === "points" || reason === "close" || reason === "grid" ||
        reason === "shapes" || reason === "puzzle") redrawPoints();
  });
  onRender(redrawPoints);
}
