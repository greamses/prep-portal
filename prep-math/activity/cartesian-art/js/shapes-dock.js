/* ============================================================================
   Cartesian Art — shapes & coordinates dock
   ----------------------------------------------------------------------------
   A picture is made of many shapes (the worksheet's "Lines"). This floating dock
   lists them, lets you pick which one you're drawing, add or remove shapes, set
   each shape's line + fill colour, and read or type its coordinates directly —
   so admins can build a shape by clicking OR by pasting points. It lives over
   the graph and is draggable like the other docks (so it never covers the top).
   ========================================================================== */

import {
  state, subscribe, activeShape, setActiveShape, deleteShape,
  startNewShape, setActivePoints, setStroke, setFill,
} from "./state.js";
import { PALETTE } from "./paint.js";
import { parsePoints } from "./parse.js";
import { fmtCoord } from "./scale.js";

const $ = (s) => document.querySelector(s);

function shapeColor(s) {
  return s.strokeColor || s.fillColor || "var(--ink)";
}

function ptsToText(pts) {
  return pts.map((p) => `(${fmtCoord(p.x)}, ${fmtCoord(p.y)})`).join(", ");
}

/* ── shape list ──────────────────────────────────────────────────────────── */
function renderList() {
  const host = $("#shapes-list");
  if (!host) return;
  host.innerHTML = "";
  const activeIdNow = activeShape().id;

  state.shapes.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = `ca-shape-row${s.id === activeIdNow ? " is-active" : ""}`;
    row.setAttribute("role", "listitem");

    const dot = document.createElement("span");
    dot.className = "ca-shape-dot";
    dot.style.setProperty("--sw", shapeColor(s));
    if (s.fillColor) dot.style.background = s.fillColor;
    row.appendChild(dot);

    const label = document.createElement("button");
    label.type = "button";
    label.className = "ca-shape-pick";
    const n = s.points.length;
    label.innerHTML = `<span class="ca-shape-name">Shape ${i + 1}</span>` +
      `<span class="ca-shape-meta">${n} pt${n === 1 ? "" : "s"}${s.closed ? " · closed" : ""}</span>`;
    label.addEventListener("click", () => setActiveShape(s.id));
    row.appendChild(label);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "ca-icon-btn ca-icon-btn--sm";
    del.title = "Delete shape";
    del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>`;
    del.addEventListener("click", () => {
      if (state.shapes.length === 1 && !s.points.length) return;
      deleteShape(s.id);
    });
    row.appendChild(del);

    host.appendChild(row);
  });
}

/* ── coordinate text box ─────────────────────────────────────────────────── */
function syncCoords() {
  const ta = $("#shapes-coord-input");
  const closed = $("#shapes-coord-closed");
  if (!ta) return;
  if (document.activeElement === ta) return; // don't clobber mid-edit
  ta.value = ptsToText(activeShape().points);
  if (closed) closed.checked = activeShape().closed;
}

function applyCoords() {
  const ta = $("#shapes-coord-input");
  const closed = $("#shapes-coord-closed");
  const status = $("#shapes-coord-status");
  if (!ta) return;
  const pts = parsePoints(ta.value);
  if (!pts.length) {
    if (status) status.textContent = "No coordinates found.";
    return;
  }
  setActivePoints(pts, closed?.checked);
  if (status) {
    status.textContent = `${pts.length} point${pts.length === 1 ? "" : "s"} set.`;
    setTimeout(() => (status.textContent = ""), 1500);
  }
}

/* ── colour swatch rows ──────────────────────────────────────────────────── */
function buildSwatchRow(hostSel, onPick, withNone) {
  const host = $(hostSel);
  if (!host) return;
  host.innerHTML = "";
  if (withNone) {
    const none = document.createElement("button");
    none.type = "button";
    none.className = "ca-swatch ca-swatch--none";
    none.title = "No fill";
    none.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14"/></svg>`;
    none.addEventListener("click", () => onPick(null));
    host.appendChild(none);
  }
  PALETTE.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ca-swatch";
    b.style.setProperty("--sw", c);
    b.title = c;
    b.addEventListener("click", () => onPick(c));
    host.appendChild(b);
  });
}

function markActiveSwatches() {
  const s = activeShape();
  $("#shapes-stroke")?.querySelectorAll(".ca-swatch").forEach((b) =>
    b.classList.toggle("is-active", b.style.getPropertyValue("--sw") === s.strokeColor)
  );
  $("#shapes-fill")?.querySelectorAll(".ca-swatch").forEach((b) => {
    const none = b.classList.contains("ca-swatch--none");
    b.classList.toggle("is-active", none ? !s.fillColor : b.style.getPropertyValue("--sw") === s.fillColor);
  });
}

function refresh() {
  renderList();
  syncCoords();
  markActiveSwatches();
}

/* ── collapsible sections (so shapes/coords/colours don't all squeeze together) ── */
const SECT_KEY = "ca-shapes-sects-v1";
function loadSectState() {
  try { return JSON.parse(localStorage.getItem(SECT_KEY)) || {}; } catch { return {}; }
}
function saveSectState(st) {
  try { localStorage.setItem(SECT_KEY, JSON.stringify(st)); } catch {}
}
function initSections() {
  const st = loadSectState();
  document.querySelectorAll("#dock-shapes .ca-dock-sect").forEach((sect) => {
    const key = sect.dataset.sect;
    const head = sect.querySelector(".ca-sect-head");
    if (!head) return;
    const setOpen = (open) => {
      sect.classList.toggle("is-collapsed", !open);
      head.setAttribute("aria-expanded", open ? "true" : "false");
    };
    if (st[key] === false) setOpen(false);
    head.addEventListener("click", () => {
      const open = sect.classList.contains("is-collapsed"); // opening now
      setOpen(open);
      const cur = loadSectState();
      cur[key] = open;
      saveSectState(cur);
    });
  });
}

export function initShapesDock() {
  if (!$("#dock-shapes")) return;

  buildSwatchRow("#shapes-stroke", (c) => setStroke(c), false);
  buildSwatchRow("#shapes-fill", (c) => setFill(c), true);
  initSections();

  $("#shapes-add")?.addEventListener("click", () => startNewShape());
  $("#shapes-coord-apply")?.addEventListener("click", applyCoords);

  refresh();
  subscribe((reason) => {
    if (reason === "shapes" || reason === "points" || reason === "close" || reason === "puzzle") {
      refresh();
    }
  });
}
