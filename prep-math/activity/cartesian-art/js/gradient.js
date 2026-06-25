/* ============================================================================
   Cartesian Art — gradient fill customizer
   ----------------------------------------------------------------------------
   Fill the ACTIVE shape with a multi-stop linear or radial gradient — for rich
   "complex art". Each stop has a colour, a position and an opacity (so a colour
   can fade to transparent). Templates seed common looks (monochrome, colour →
   transparent, sunset, …). Each apply mints a <linearGradient>/<radialGradient>
   in a persistent <defs> inside the stage SVG and sets the shape's fill to
   url(#id); points.js writes fills inline so url() just works, and the def lives
   in the same SVG so it survives redraws and is cloned on export.
   ========================================================================== */

import { setFill, activeShape } from "./state.js";

const SVGNS = "http://www.w3.org/2000/svg";
const $ = (s) => document.querySelector(s);
let gradId = 0;

/* The editable list of stops: { color:'#rrggbb', pos:0..100, alpha:0..1 }. */
let stops = [
  { color: "#f0a868", pos: 0, alpha: 1 },
  { color: "#b89ae8", pos: 100, alpha: 1 },
];

/* ── colour helpers ──────────────────────────────────────────────────────── */
function hexToRgb(hex) {
  const h = (hex || "#000000").replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
}
function rgba(color, alpha) {
  const [r, g, b] = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

/* ── templates ───────────────────────────────────────────────────────────── */
function applyTemplate(name) {
  const base = stops[0]?.color || "#6fb7e8";
  switch (name) {
    case "monochrome":
      stops = [
        { color: mix(base, "#ffffff", 0.55), pos: 0, alpha: 1 },
        { color: base, pos: 50, alpha: 1 },
        { color: mix(base, "#000000", 0.45), pos: 100, alpha: 1 },
      ];
      break;
    case "transparent":
      stops = [
        { color: base, pos: 0, alpha: 1 },
        { color: base, pos: 100, alpha: 0 },
      ];
      break;
    case "sunset":
      stops = [
        { color: "#f4c95d", pos: 0, alpha: 1 },
        { color: "#f0a868", pos: 45, alpha: 1 },
        { color: "#f07a7a", pos: 75, alpha: 1 },
        { color: "#b89ae8", pos: 100, alpha: 1 },
      ];
      break;
    case "ocean":
      stops = [
        { color: "#a7d4f2", pos: 0, alpha: 1 },
        { color: "#6fb7e8", pos: 50, alpha: 1 },
        { color: "#8aa0e8", pos: 100, alpha: 1 },
      ];
      break;
    case "forest":
      stops = [
        { color: "#aedcae", pos: 0, alpha: 1 },
        { color: "#7cc47c", pos: 55, alpha: 1 },
        { color: "#6fd0c0", pos: 100, alpha: 1 },
      ];
      break;
    case "rainbow":
      stops = [
        { color: "#f07a7a", pos: 0, alpha: 1 },
        { color: "#f0a868", pos: 20, alpha: 1 },
        { color: "#f4c95d", pos: 40, alpha: 1 },
        { color: "#7cc47c", pos: 60, alpha: 1 },
        { color: "#6fb7e8", pos: 80, alpha: 1 },
        { color: "#b89ae8", pos: 100, alpha: 1 },
      ];
      break;
    default:
      return;
  }
  renderStops();
  updatePreview();
}

/* ── stop editor rows ────────────────────────────────────────────────────── */
function renderStops() {
  const host = $("#grad-stops");
  if (!host) return;
  host.innerHTML = "";
  stops.forEach((stop, i) => {
    const row = document.createElement("div");
    row.className = "ca-grad-stop";

    const color = document.createElement("input");
    color.type = "color";
    color.className = "ca-color-input gs-color";
    color.value = stop.color;
    color.title = "Stop colour";
    color.addEventListener("input", () => { stop.color = color.value; updatePreview(); });

    const pos = document.createElement("input");
    pos.type = "range"; pos.min = 0; pos.max = 100; pos.value = stop.pos;
    pos.className = "gs-pos"; pos.title = "Position";
    pos.addEventListener("input", () => { stop.pos = Number(pos.value); updatePreview(); });

    const alpha = document.createElement("input");
    alpha.type = "range"; alpha.min = 0; alpha.max = 100; alpha.value = Math.round(stop.alpha * 100);
    alpha.className = "gs-alpha"; alpha.title = "Opacity (slide to 0 for transparent)";
    alpha.addEventListener("input", () => { stop.alpha = Number(alpha.value) / 100; updatePreview(); });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "ca-icon-btn ca-icon-btn--sm gs-del";
    del.title = "Remove stop";
    del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
    del.disabled = stops.length <= 2;
    del.addEventListener("click", () => { stops.splice(i, 1); renderStops(); updatePreview(); });

    row.append(color, pos, alpha, del);
    host.appendChild(row);
  });
}

function sorted() {
  return [...stops].sort((a, b) => a.pos - b.pos);
}

/** CSS preview string for the current stops. */
function updatePreview() {
  const p = $("#grad-preview");
  if (!p) return;
  const type = $("#grad-type")?.value || "linear";
  const angle = Number($("#grad-angle")?.value || 90);
  const list = sorted().map((s) => `${rgba(s.color, s.alpha)} ${s.pos}%`).join(", ");
  p.style.background =
    type === "radial"
      ? `radial-gradient(circle at 50% 50%, ${list})`
      : `linear-gradient(${angle}deg, ${list})`;
}

/* ── apply to shape (SVG gradient def) ───────────────────────────────────── */
function ensureDefs() {
  const svg = $("#ca-stage svg");
  if (!svg) return null;
  let defs = svg.querySelector("#ca-grad-defs");
  if (!defs) {
    defs = document.createElementNS(SVGNS, "defs");
    defs.id = "ca-grad-defs";
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs;
}

function mintGradient() {
  const defs = ensureDefs();
  if (!defs) return stops[0]?.color || "#000";
  const id = `ca-grad-${++gradId}`;
  const type = $("#grad-type")?.value || "linear";
  let node;
  if (type === "radial") {
    node = document.createElementNS(SVGNS, "radialGradient");
    node.setAttribute("cx", "50%");
    node.setAttribute("cy", "50%");
    node.setAttribute("r", "65%");
  } else {
    node = document.createElementNS(SVGNS, "linearGradient");
    const a = (Number($("#grad-angle")?.value || 90) * Math.PI) / 180;
    const dx = Math.cos(a), dy = Math.sin(a);
    node.setAttribute("x1", `${(0.5 - dx / 2) * 100}%`);
    node.setAttribute("y1", `${(0.5 - dy / 2) * 100}%`);
    node.setAttribute("x2", `${(0.5 + dx / 2) * 100}%`);
    node.setAttribute("y2", `${(0.5 + dy / 2) * 100}%`);
  }
  node.id = id;
  for (const s of sorted()) {
    const st = document.createElementNS(SVGNS, "stop");
    st.setAttribute("offset", `${s.pos}%`);
    st.setAttribute("stop-color", s.color);
    st.setAttribute("stop-opacity", String(s.alpha));
    node.appendChild(st);
  }
  defs.appendChild(node);
  return `url(#${id})`;
}

function apply() {
  const status = $("#grad-status");
  const s = activeShape();
  if (!s || s.points.length < 3) {
    if (status) status.textContent = "Select a shape with at least 3 points first.";
    return;
  }
  if (!s.closed) s.closed = true;
  setFill(mintGradient());
  if (status) status.textContent = "Gradient applied to the selected shape.";
}

export function initGradient() {
  if (!$("#grad-apply")) return;
  $("#grad-type")?.addEventListener("input", updatePreview);
  $("#grad-angle")?.addEventListener("input", updatePreview);
  $("#grad-template")?.addEventListener("change", (e) => {
    applyTemplate(e.target.value);
    e.target.value = ""; // reset to placeholder so the same template can re-fire
  });
  $("#grad-add-stop")?.addEventListener("click", () => {
    stops.push({ color: stops[stops.length - 1]?.color || "#6fb7e8", pos: 100, alpha: 1 });
    renderStops();
    updatePreview();
  });
  $("#grad-apply").addEventListener("click", apply);
  renderStops();
  updatePreview();
}
