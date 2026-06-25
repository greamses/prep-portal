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

import { state, setFill, setActiveShape, subscribe } from "./state.js";
import { clientToMath, onRender } from "./grid.js";
import { registerCanvas, commit as historyCommit } from "./history.js";

export const PALETTE = [
  "#f07a7a", "#f0a868", "#f4c95d", "#7cc47c", "#6fd0c0",
  "#6fb7e8", "#8aa0e8", "#b89ae8", "#f29ec4", "#b08968",
  "#2a2723", "#fffdf8",
];
const SIZES = { small: 7, medium: 16, large: 34 };

const tool = { name: "move", color: "#6fb7e8", size: SIZES.medium };

let canvas, ctx, svg, stage;
let drawing = false;
let didDraw = false;
let last = null;

const $ = (s) => document.querySelector(s);

/* Match the canvas bitmap to the stage's pixel size so brush dabs stay round
   and aligned; rescale existing strokes so the artwork survives a resize. */
function resizeCanvas() {
  if (!canvas || !stage) return;
  const r = stage.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width));
  const h = Math.max(1, Math.round(r.height));
  if (canvas.width === w && canvas.height === h) return;
  let prev = null;
  if (canvas.width && canvas.height) {
    prev = document.createElement("canvas");
    prev.width = canvas.width;
    prev.height = canvas.height;
    prev.getContext("2d").drawImage(canvas, 0, 0);
  }
  canvas.width = w;
  canvas.height = h;
  if (prev) ctx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, w, h);
}

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
  didDraw = true;
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
    const m = clientToMath(e.clientX, e.clientY);
    // topmost closed shape whose interior contains the click wins
    for (let i = state.shapes.length - 1; i >= 0; i--) {
      const sh = state.shapes[i];
      if (sh.closed && sh.points.length > 2 && pointInPolygon(m.x, m.y, sh.points)) {
        setActiveShape(sh.id);
        setFill(tool.color);
        return;
      }
    }
    return;
  }
  drawing = true;
  didDraw = false;
  last = toCanvas(e);
  strokeTo(last); // a dot on click
}
function onMove(e) {
  if (!drawing) return;
  strokeTo(toCanvas(e));
}
function onUp(e) {
  if (drawing && didDraw) historyCommit(); // record the finished stroke
  drawing = false;
  didDraw = false;
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

/** Colours used by the currently loaded task / artwork — these are the ONLY
 *  swatches shown (so learners paint with exactly the colours the picture needs).
 *  Reads the puzzle's target shapes in puzzle mode, otherwise the grid shapes. */
function artColors() {
  const src = (state.puzzle && state.puzzle.shapes) || state.shapes || [];
  const cols = [];
  for (const s of src) {
    for (const c of [s.strokeColor, s.fillColor]) {
      if (c && /^#|^rgb/i.test(c) && !cols.includes(c)) cols.push(c);
    }
  }
  return cols;
}

function clearActive() {
  document.querySelectorAll("#paint-swatches .ca-swatch").forEach((s) => s.classList.remove("is-active"));
}

/** A colour swatch button. */
function swatch(host, c) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ca-swatch";
  b.style.setProperty("--sw", c);
  b.title = c;
  b.addEventListener("click", () => {
    tool.color = c;
    clearActive();
    b.classList.add("is-active");
    if (tool.name === "move") setTool("brush"); // picking on Move jumps to brush
  });
  if (c === tool.color) b.classList.add("is-active");
  host.appendChild(b);
  return b;
}

/** The extra swatch that toggles open the custom colour wheel (native picker). */
function wheelSwatch(host) {
  const lab = document.createElement("label");
  lab.className = "ca-swatch ca-swatch--wheel";
  lab.title = "Custom colour";
  const inp = document.createElement("input");
  inp.type = "color";
  inp.className = "ca-swatch-wheel-input";
  inp.value = normHex(tool.color) || "#6fb7e8";
  inp.addEventListener("input", () => {
    tool.color = inp.value;
    lab.style.setProperty("--sw", inp.value);
    lab.classList.add("has-color");
    clearActive();
    lab.classList.add("is-active");
    if (tool.name === "move") setTool("brush");
  });
  lab.appendChild(inp);
  host.appendChild(lab);
  return lab;
}

/** Rebuild the swatch row: just this task's colours + the custom-wheel toggle. */
function refreshSwatches() {
  const host = $("#paint-swatches");
  if (!host) return;
  host.innerHTML = "";
  artColors().forEach((c) => swatch(host, c));
  wheelSwatch(host);
}

function normHex(c) {
  if (!c) return null;
  const m = String(c).trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  return "#" + h.toLowerCase();
}

export function initPaint() {
  stage = $("#ca-stage");
  if (!stage) return;
  svg = stage.querySelector("svg");

  canvas = document.createElement("canvas");
  canvas.className = "ca-paint-canvas";
  stage.insertBefore(canvas, stage.firstChild); // behind the svg
  ctx = canvas.getContext("2d");
  resizeCanvas();
  // keep the canvas matched to the (now non-square) stage; preserve the artwork
  onRender(resizeCanvas);

  // let undo/redo capture + restore the brush layer
  registerCanvas(
    () => (canvas.width && canvas.height ? canvas.toDataURL() : null),
    (url) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!url) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = url;
    }
  );

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
  refreshSwatches();

  $("#paint-clear")?.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.paint.fillColor) setFill(null); // emits "points" → history commits
    else historyCommit(); // brush-only clear still records a step
  });

  // a fresh puzzle / loaded shape starts with a clean canvas + task-coloured palette
  subscribe((reason) => {
    if (reason === "puzzle") ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (reason === "puzzle" || reason === "shapes") refreshSwatches();
  });

  setTool("move");
}

/** Exposed for export/print later: the brush canvas. */
export function getPaintCanvas() {
  return canvas;
}
