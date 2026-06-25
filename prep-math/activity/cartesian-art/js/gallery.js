/* ============================================================================
   Cartesian Art — My Gallery (free studio)
   ----------------------------------------------------------------------------
   A personal gallery of saved creations. Save the current drawing (its shapes +
   grid window, like the share link — vector, no brush), browse them as
   thumbnails, reopen one onto the grid, or delete. Stored in localStorage so it
   works for everyone with no backend (cloud sync would need a firestore rule for
   a per-user subcollection — not enabled yet).
   ========================================================================== */

import { state, loadShape, allPoints } from "./state.js";
import { buildThumb, normalizeShapes } from "./thumb.js";

const KEY = "ca-gallery-v1";
const CAP = 60;
const $ = (s) => document.querySelector(s);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function persist(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP))); } catch {}
}

function currentArtwork(title) {
  const shapes = state.shapes
    .filter((s) => s.points.length)
    .map((s) => ({
      points: s.points.map((p) => ({ x: p.x, y: p.y })),
      closed: s.closed,
      fillColor: s.fillColor || null,
      strokeColor: s.strokeColor || null,
    }));
  const g = state.grid;
  return {
    id: "g" + Date.now().toString(36),
    title: (title || "Untitled").slice(0, 80),
    shapes,
    grid: { xMin: g.xMin, xMax: g.xMax, yMin: g.yMin, yMax: g.yMax },
    createdAt: Date.now(),
  };
}

/* ── sidebar ─────────────────────────────────────────────────────────────── */
function open() {
  $("#ca-gallery")?.classList.add("is-open");
  $("#gallery-backdrop")?.classList.add("is-open");
  render();
}
function close() {
  $("#ca-gallery")?.classList.remove("is-open");
  $("#gallery-backdrop")?.classList.remove("is-open");
}

function render() {
  const list = $("#gallery-list");
  const empty = $("#gallery-empty");
  if (!list) return;
  const items = load();
  list.innerHTML = "";
  if (!items.length) { if (empty) empty.hidden = false; return; }
  if (empty) empty.hidden = true;
  items.forEach((item) => list.appendChild(card(item)));
}

function card(item) {
  const wrap = document.createElement("div");
  wrap.className = "ca-gallery-card";

  const thumb = document.createElement("button");
  thumb.type = "button";
  thumb.className = "ca-gallery-thumb";
  thumb.title = "Open";
  thumb.appendChild(buildThumb(normalizeShapes(item)));
  thumb.addEventListener("click", () => {
    loadShape({ shapes: normalizeShapes(item), grid: item.grid || null });
    close();
  });
  wrap.appendChild(thumb);

  const foot = document.createElement("div");
  foot.className = "ca-gallery-foot";
  const name = document.createElement("span");
  name.className = "ca-gallery-name";
  name.textContent = item.title || "Untitled";
  foot.appendChild(name);

  const del = document.createElement("button");
  del.type = "button";
  del.className = "ca-icon-btn ca-icon-btn--sm";
  del.title = "Delete";
  del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>`;
  del.addEventListener("click", () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    persist(load().filter((e) => e.id !== item.id));
    render();
  });
  foot.appendChild(del);

  wrap.appendChild(foot);
  return wrap;
}

function saveCurrent() {
  const status = $("#gallery-status");
  if (!allPoints().length) { if (status) status.textContent = "Draw something first."; return; }
  const titleEl = $("#gallery-title");
  const list = load();
  list.unshift(currentArtwork(titleEl?.value.trim()));
  persist(list);
  if (titleEl) titleEl.value = "";
  if (status) {
    status.textContent = "Saved to your gallery!";
    setTimeout(() => (status.textContent = ""), 1600);
  }
  render();
}

export function initGallery() {
  if (!$("#ca-gallery")) return;
  $("#ca-gallery-btn")?.addEventListener("click", open);
  $("#gallery-close")?.addEventListener("click", close);
  $("#gallery-backdrop")?.addEventListener("click", close);
  $("#gallery-save")?.addEventListener("click", saveCurrent);
  $("#gallery-title")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveCurrent();
  });
}
