/* ============================================================================
   Cartesian Art — gradient fill customizer
   ----------------------------------------------------------------------------
   Lets you fill the ACTIVE shape with a two-stop linear or radial gradient
   instead of a flat colour — for richer, "complex art" pieces. Each apply mints
   a <linearGradient>/<radialGradient> in a persistent <defs> inside the stage
   SVG and sets the shape's fill to url(#id). Because points.js writes the fill
   as inline `fill:<value>`, a url(...) value just works; the def lives in the
   same SVG so it survives every redraw (and is cloned on export).
   ========================================================================== */

import { setFill, activeShape } from "./state.js";

const SVGNS = "http://www.w3.org/2000/svg";
const $ = (s) => document.querySelector(s);
let gradId = 0;

/** The persistent <defs> that holds every minted gradient. */
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

function stops(node, c1, c2) {
  const s1 = document.createElementNS(SVGNS, "stop");
  s1.setAttribute("offset", "0%");
  s1.setAttribute("stop-color", c1);
  const s2 = document.createElementNS(SVGNS, "stop");
  s2.setAttribute("offset", "100%");
  s2.setAttribute("stop-color", c2);
  node.appendChild(s1);
  node.appendChild(s2);
}

/** Mint a gradient def from a config and return its url(#id) reference. */
function mintGradient({ type, c1, c2, angle }) {
  const defs = ensureDefs();
  if (!defs) return c1;
  const id = `ca-grad-${++gradId}`;
  let node;
  if (type === "radial") {
    node = document.createElementNS(SVGNS, "radialGradient");
    node.setAttribute("cx", "50%");
    node.setAttribute("cy", "50%");
    node.setAttribute("r", "65%");
  } else {
    node = document.createElementNS(SVGNS, "linearGradient");
    const a = (angle * Math.PI) / 180;
    const dx = Math.cos(a), dy = Math.sin(a);
    node.setAttribute("x1", `${(0.5 - dx / 2) * 100}%`);
    node.setAttribute("y1", `${(0.5 - dy / 2) * 100}%`);
    node.setAttribute("x2", `${(0.5 + dx / 2) * 100}%`);
    node.setAttribute("y2", `${(0.5 + dy / 2) * 100}%`);
  }
  node.id = id;
  stops(node, c1, c2);
  defs.appendChild(node);
  return `url(#${id})`;
}

function readConfig() {
  return {
    type: $("#grad-type")?.value || "linear",
    c1: $("#grad-c1")?.value || "#f0a868",
    c2: $("#grad-c2")?.value || "#b89ae8",
    angle: Number($("#grad-angle")?.value || 90),
  };
}

/** Refresh the little CSS preview swatch. */
function updatePreview() {
  const p = $("#grad-preview");
  if (!p) return;
  const { type, c1, c2, angle } = readConfig();
  p.style.background =
    type === "radial"
      ? `radial-gradient(circle at 50% 50%, ${c1}, ${c2})`
      : `linear-gradient(${angle}deg, ${c1}, ${c2})`;
}

function apply() {
  const status = $("#grad-status");
  const s = activeShape();
  if (!s || s.points.length < 3) {
    if (status) status.textContent = "Select a shape with at least 3 points first.";
    return;
  }
  if (!s.closed) s.closed = true; // a gradient only shows on a filled (closed) shape
  setFill(mintGradient(readConfig()));
  if (status) status.textContent = "Gradient applied to the selected shape.";
}

export function initGradient() {
  if (!$("#grad-apply")) return;
  ["grad-c1", "grad-c2", "grad-angle", "grad-type"].forEach((id) =>
    $("#" + id)?.addEventListener("input", updatePreview)
  );
  $("#grad-apply").addEventListener("click", apply);
  updatePreview();
}
