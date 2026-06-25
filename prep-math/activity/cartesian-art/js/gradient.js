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
import { paintRange } from "./range-fill.js";

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
  sel = 0;
  renderBar();
}

/* ── Photoshop-style gradient bar ────────────────────────────────────────── */
let sel = 0; // index of the selected stop

function sorted() {
  return [...stops].sort((a, b) => a.pos - b.pos);
}

/** The colour of the ramp at position p (0..100) — used when adding a stop. */
function colorAt(p) {
  const s = sorted();
  if (p <= s[0].pos) return s[0].color;
  if (p >= s[s.length - 1].pos) return s[s.length - 1].color;
  for (let i = 0; i < s.length - 1; i++) {
    if (p >= s[i].pos && p <= s[i + 1].pos) {
      const t = (p - s[i].pos) / ((s[i + 1].pos - s[i].pos) || 1);
      return mix(s[i].color, s[i + 1].color, t);
    }
  }
  return s[0].color;
}

/** Paint the ramp swatch (always a left→right preview, like Photoshop). */
function updateRamp() {
  const grad = $("#grad-bar-grad");
  if (!grad) return;
  const list = sorted().map((s) => `${rgba(s.color, s.alpha)} ${s.pos}%`).join(", ");
  grad.style.backgroundImage = `linear-gradient(90deg, ${list})`;
}

/** Reflect the selected stop into the little editor controls. */
function syncStopCtl() {
  const c = $("#grad-stop-color"), a = $("#grad-stop-alpha"), p = $("#grad-stop-pos"), d = $("#grad-stop-del");
  const s = stops[sel];
  if (!s) return;
  if (c) c.value = s.color;
  if (a) { a.value = Math.round(s.alpha * 100); paintRange(a); }
  if (p) p.value = Math.round(s.pos);
  if (d) d.disabled = stops.length <= 2;
}

/** Rebuild the draggable stop markers under the ramp. */
function renderBar() {
  updateRamp();
  const host = $("#grad-stops");
  if (!host) return;
  host.innerHTML = "";
  stops.forEach((s, i) => {
    const m = document.createElement("button");
    m.type = "button";
    m.className = "ca-grad-stop" + (i === sel ? " is-sel" : "");
    m.style.left = s.pos + "%";
    m.style.setProperty("--c", s.color);
    m.title = "Drag to move · click to select";
    m.addEventListener("pointerdown", (e) => startDrag(e, i, m));
    host.appendChild(m);
  });
  syncStopCtl();
}

function selectStop(i) {
  sel = i;
  document.querySelectorAll("#grad-stops .ca-grad-stop").forEach((m, j) =>
    m.classList.toggle("is-sel", j === i)
  );
  syncStopCtl();
}

/** Drag a marker along the ramp (no full re-render mid-drag, to keep capture). */
function startDrag(e, i, m) {
  e.preventDefault();
  e.stopPropagation();
  selectStop(i);
  m.setPointerCapture?.(e.pointerId);
  const bar = $("#grad-bar-grad");
  const move = (ev) => {
    const r = bar.getBoundingClientRect();
    let pos = Math.round(((ev.clientX - r.left) / r.width) * 100);
    pos = Math.max(0, Math.min(100, pos));
    stops[i].pos = pos;
    m.style.left = pos + "%";
    updateRamp();
    syncStopCtl();
  };
  const up = (ev) => {
    m.releasePointerCapture?.(ev.pointerId);
    m.removeEventListener("pointermove", move);
    m.removeEventListener("pointerup", up);
    m.removeEventListener("pointercancel", up);
  };
  m.addEventListener("pointermove", move);
  m.addEventListener("pointerup", up);
  m.addEventListener("pointercancel", up);
}

/** Click the ramp itself → add a new stop at that position. */
function addStopAt(e) {
  const bar = $("#grad-bar-grad");
  const r = bar.getBoundingClientRect();
  let pos = Math.round(((e.clientX - r.left) / r.width) * 100);
  pos = Math.max(0, Math.min(100, pos));
  stops.push({ color: colorAt(pos), pos, alpha: 1 });
  sel = stops.length - 1;
  renderBar();
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

  $("#grad-template")?.addEventListener("change", (e) => {
    applyTemplate(e.target.value);
    e.target.value = ""; // reset to placeholder so the same template can re-fire
  });

  // click the ramp (not a marker) to add a stop there
  $("#grad-bar-grad")?.addEventListener("pointerdown", addStopAt);

  // selected-stop editor controls
  $("#grad-stop-color")?.addEventListener("input", (e) => {
    if (stops[sel]) { stops[sel].color = e.target.value; renderBar(); }
  });
  $("#grad-stop-alpha")?.addEventListener("input", (e) => {
    if (stops[sel]) { stops[sel].alpha = Number(e.target.value) / 100; updateRamp(); }
  });
  $("#grad-stop-pos")?.addEventListener("input", (e) => {
    if (stops[sel]) {
      stops[sel].pos = Math.max(0, Math.min(100, Number(e.target.value) || 0));
      renderBar();
    }
  });
  $("#grad-stop-del")?.addEventListener("click", () => {
    if (stops.length <= 2) return;
    stops.splice(sel, 1);
    sel = Math.max(0, sel - 1);
    renderBar();
  });

  $("#grad-apply").addEventListener("click", apply);
  renderBar();
}
