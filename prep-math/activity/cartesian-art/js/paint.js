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
import { paintRange } from "./range-fill.js";

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

/** The extra swatch that toggles open the in-app custom colour WHEEL. */
function wheelSwatch(host) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ca-swatch ca-swatch--wheel";
  b.title = "Custom colour wheel";
  b.addEventListener("click", () => {
    const pop = $("#ca-wheel");
    if (!pop) return;
    pop.hidden = !pop.hidden;
    b.classList.toggle("is-active", !pop.hidden);
    if (!pop.hidden) drawWheel();
  });
  host.appendChild(b);
  return b;
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

/* ── custom colour wheel (HSV: hue = angle, saturation = radius, value slider) ── */
let wheelCanvas, wheelCtx;
const hsv = { h: 205, s: 0.55, v: 0.91 }; // ≈ #6fb7e8 to start

function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360 / 60;
  const i = Math.floor(h), f = h - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const [r, g, b] = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q],
  ][i % 6];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}
function hexToHsv(hex) {
  const h = normHex(hex);
  if (!h) return null;
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let hue = 0;
  if (d) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60; if (hue < 0) hue += 360;
  }
  return { h: hue, s: max ? d / max : 0, v: max };
}

/** Repaint the wheel for the current brightness + draw the selection marker. */
function drawWheel() {
  if (!wheelCanvas || !wheelCtx) return;
  const size = wheelCanvas.width, r = size / 2;
  const img = wheelCtx.createImageData(size, size), d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - r, dy = y - r, dist = Math.hypot(dx, dy), i = (y * size + x) * 4;
      if (dist > r) { d[i + 3] = 0; continue; }
      let hue = (Math.atan2(dy, dx) * 180) / Math.PI; if (hue < 0) hue += 360;
      const [R, G, B] = hsvToRgb(hue, Math.min(1, dist / r), hsv.v);
      d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255;
    }
  }
  wheelCtx.putImageData(img, 0, 0);
  // selection marker
  const a = (hsv.h * Math.PI) / 180, mr = hsv.s * r;
  const mx = r + Math.cos(a) * mr, my = r + Math.sin(a) * mr;
  wheelCtx.beginPath();
  wheelCtx.arc(mx, my, 6, 0, Math.PI * 2);
  wheelCtx.strokeStyle = hsv.v > 0.6 ? "#1c1a16" : "#fff";
  wheelCtx.lineWidth = 2.5;
  wheelCtx.stroke();
}

/** Push the current HSV out: live preview, hex box, the wheel swatch, tool.color. */
function applyWheelColor(updateHex = true) {
  const hex = rgbToHex(hsvToRgb(hsv.h, hsv.s, hsv.v));
  tool.color = hex;
  const prev = $("#ca-wheel-preview");
  if (prev) prev.style.background = hex;
  if (updateHex) { const hx = $("#ca-wheel-hex"); if (hx) hx.value = hex; }
  document.querySelectorAll(".ca-swatch--wheel").forEach((s) => {
    s.style.setProperty("--sw", hex);
    s.classList.add("has-color");
  });
}

function pickFromEvent(e) {
  const rect = wheelCanvas.getBoundingClientRect();
  const r = wheelCanvas.width / 2;
  const x = ((e.clientX - rect.left) / rect.width) * wheelCanvas.width - r;
  const y = ((e.clientY - rect.top) / rect.height) * wheelCanvas.height - r;
  let hue = (Math.atan2(y, x) * 180) / Math.PI; if (hue < 0) hue += 360;
  hsv.h = hue;
  hsv.s = Math.min(1, Math.hypot(x, y) / r);
  drawWheel();
  applyWheelColor();
  if (tool.name === "move") setTool("brush");
}

function initWheel() {
  wheelCanvas = $("#ca-wheel-canvas");
  if (!wheelCanvas) return;
  wheelCtx = wheelCanvas.getContext("2d");

  let dragging = false;
  wheelCanvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    wheelCanvas.setPointerCapture?.(e.pointerId);
    pickFromEvent(e);
  });
  wheelCanvas.addEventListener("pointermove", (e) => { if (dragging) pickFromEvent(e); });
  const stop = () => (dragging = false);
  wheelCanvas.addEventListener("pointerup", stop);
  wheelCanvas.addEventListener("pointercancel", stop);

  $("#ca-wheel-val")?.addEventListener("input", (e) => {
    hsv.v = Number(e.target.value) / 100;
    drawWheel();
    applyWheelColor();
    if (tool.name === "move") setTool("brush");
  });

  $("#ca-wheel-hex")?.addEventListener("change", (e) => {
    const next = hexToHsv(e.target.value);
    if (!next) { e.target.value = rgbToHex(hsvToRgb(hsv.h, hsv.s, hsv.v)); return; }
    Object.assign(hsv, next);
    const vs = $("#ca-wheel-val"); if (vs) { vs.value = Math.round(hsv.v * 100); paintRange(vs); }
    drawWheel();
    applyWheelColor(false);
    if (tool.name === "move") setTool("brush");
  });

  drawWheel();
  applyWheelColor();
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
  initWheel();

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
