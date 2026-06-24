/* ============================================================================
   Cartesian Art — painting
   ----------------------------------------------------------------------------
   Two ways to colour:
     • Bucket fill — tints the closed outline's interior (SVG path fill), so it
       stays crisp and prints cleanly.
     • Brush / eraser — freehand strokes on a <canvas> that sits BEHIND the SVG,
       so the grid, outline, points and mascot stay on top (a colouring-book
       feel). The canvas has a fixed internal resolution and is stretched by CSS,
       so resizing the page never wipes the artwork.
   The tool toggles whether the SVG (plotting) or the canvas (painting) receives
   pointer events, so plotting and painting never fight.
   ========================================================================== */

import { state, setFill, subscribe } from "./state.js";
import { clientToMath } from "./grid.js";

const RES = 900; // canvas internal resolution (square)

export const PALETTE = [
  "#f07a7a", "#f0a868", "#f4c95d", "#7cc47c", "#6fd0c0",
  "#6fb7e8", "#8aa0e8", "#b89ae8", "#f29ec4", "#b08968",
  "#2a2723", "#fffdf8",
];
const SIZES = { small: 7, medium: 16, large: 34 };

const tool = { name: "move", color: "#6fb7e8", size: SIZES.medium };

let canvas, ctx, svg, stage;
let drawing = false;
let last = null;

const $ = (s) => document.querySelector(s);

/* ── canvas helpers ────────────────────────────────────────────────────── */
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
    scale: canvas.width / r.width,
  };
}

function strokeTo(p) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = tool.size * (canvas.width / canvas.getBoundingClientRect().width);
  if (tool.name === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = tool.color;
  }
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  // round dab so single taps leave a dot
  ctx.beginPath();
  ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = tool.name === "eraser" ? "rgba(0,0,0,1)" : tool.color;
  ctx.fill();
  last = p;
}

/* ── interaction ───────────────────────────────────────────────────────── */
function onDown(e) {
  if (tool.name === "move") return;
  e.preventDefault();
  canvas.setPointerCapture?.(e.pointerId);

  if (tool.name === "fill") {
    if (!state.closed) return;
    const m = clientToMath(e.clientX, e.clientY);
    if (pointInPolygon(m.x, m.y, state.points)) setFill(tool.color);
    return;
  }
  drawing = true;
  last = toCanvas(e);
  strokeTo(last); // a dot on click
}
function onMove(e) {
  if (!drawing) return;
  strokeTo(toCanvas(e));
}
function onUp(e) {
  drawing = false;
  canvas.releasePointerCapture?.(e.pointerId);
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

/* ── tool selection + pointer routing ──────────────────────────────────── */
function setTool(name) {
  tool.name = name;
  const painting = name !== "move";
  // route events: painting → canvas, plotting → svg
  if (svg) svg.style.pointerEvents = painting ? "none" : "";
  canvas.style.pointerEvents = painting ? "auto" : "none";
  // tell the rest of the app to ignore stage taps while painting
  stage?.classList.toggle("ca-painting", painting);
  canvas.style.cursor = name === "fill" ? "cell" : painting ? "crosshair" : "";
  document.querySelectorAll(".ca-tool[data-tool]").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.tool === name)
  );
}

function buildSwatches() {
  const host = $("#paint-swatches");
  if (!host) return;
  PALETTE.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ca-swatch";
    b.style.setProperty("--sw", c);
    b.title = c;
    b.addEventListener("click", () => {
      tool.color = c;
      host.querySelectorAll(".ca-swatch").forEach((s) => s.classList.remove("is-active"));
      b.classList.add("is-active");
      // picking a colour while on Move jumps to the brush so it does something
      if (tool.name === "move" || tool.name === "fill") setTool(tool.name === "fill" ? "fill" : "brush");
    });
    if (c === tool.color) b.classList.add("is-active");
    host.appendChild(b);
  });
}

export function initPaint() {
  stage = $("#ca-stage");
  if (!stage) return;
  svg = stage.querySelector("svg");

  canvas = document.createElement("canvas");
  canvas.className = "ca-paint-canvas";
  canvas.width = RES;
  canvas.height = RES;
  stage.insertBefore(canvas, stage.firstChild); // behind the svg
  ctx = canvas.getContext("2d");

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  // tool buttons
  document.querySelectorAll(".ca-tool[data-tool]").forEach((b) =>
    b.addEventListener("click", () => setTool(b.dataset.tool))
  );
  // size buttons
  document.querySelectorAll(".ca-size[data-size]").forEach((b) =>
    b.addEventListener("click", () => {
      tool.size = SIZES[b.dataset.size] || SIZES.medium;
      document.querySelectorAll(".ca-size").forEach((s) => s.classList.remove("is-active"));
      b.classList.add("is-active");
      if (tool.name === "move" || tool.name === "fill") setTool("brush");
    })
  );
  buildSwatches();

  $("#paint-clear")?.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.paint.fillColor) setFill(null);
  });

  // a fresh puzzle / loaded shape starts with a clean canvas
  subscribe((reason) => {
    if (reason === "puzzle") ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  setTool("move");
}

/** Exposed for export/print later: the brush canvas. */
export function getPaintCanvas() {
  return canvas;
}
