/* ============================================================================
   Cartesian Art — puzzle library + admin authoring
   ----------------------------------------------------------------------------
   • Picker (everyone): browse saved puzzles and play one.
   • Authoring (admin only): turn the shape currently on the grid into a saved
     puzzle, or load an existing one back onto the grid to edit + re-save.
   Admin-only controls are revealed by the auth listener; writes are still
   enforced server-side by firestore.rules.
   ========================================================================== */

import { state, enterPuzzle, loadShape, setShapes, allPoints } from "./state.js";
import {
  listPuzzles,
  savePuzzle,
  deletePuzzle,
  isAdminUser,
} from "./puzzles.js";
import { parseWorksheet } from "./parse.js";
import { buildThumb, normalizeShapes } from "./thumb.js";
import { BUILTIN_PUZZLES } from "./builtin-puzzles.js";
import { auth } from "/firebase-init.js";
import { onAuthStateChanged } from "firebase/auth";

const $ = (s) => document.querySelector(s);
let editId = null;
let admin = false;

/* ── PrepBot picker mode ───────────────────────────────────────────────────
   prepbot.js wants the SAME sidebar (all builtins + saved puzzles, real
   thumbnails) but as a single-purpose picker: every card shows one "Draw
   this" action instead of Play/Edit/Delete, and picking one hands the
   normalised shapes back instead of entering puzzle-mode. */
let prepbotPick = null; // (doc) => void, or null when picking normally

/** Open the puzzles sidebar in "PrepBot" mode: cards show "Draw this" only,
 *  and picking one calls `onPick(doc)` then closes the sidebar. */
export function openPickerForPrepbot(onPick) {
  prepbotPick = onPick;
  openPicker();
}

const DIFF_TILE = {
  easy: "var(--accent-success)",
  medium: "var(--accent-warning)",
  hard: "var(--accent-danger)",
};

function gridWindow() {
  const g = state.grid;
  return { xMin: g.xMin, xMax: g.xMax, yMin: g.yMin, yMax: g.yMax };
}

function toPuzzle(doc) {
  return {
    id: doc.id,
    title: doc.title,
    prompt: doc.prompt,
    difficulty: doc.difficulty,
    grid: doc.grid,
    targets: doc.points || [],
    shapes: Array.isArray(doc.shapes) ? doc.shapes : null,
    closed: doc.closed,
  };
}

/* ── picker ────────────────────────────────────────────────────────────── */
async function openPicker() {
  $("#ca-picker").classList.add("is-open");
  $("#picker-backdrop")?.classList.add("is-open");
  const title = $("#picker-title");
  if (title) title.textContent = prepbotPick ? "Pick a picture for PrepBot" : "Puzzles";
  $("#picker-new")?.toggleAttribute("hidden", !!prepbotPick || !admin);
  const list = $("#picker-list");
  const empty = $("#picker-empty");
  list.innerHTML = `<p class="ca-modal-loading">Loading puzzles…</p>`;
  empty.hidden = true;
  try {
    const saved = await listPuzzles();
    // Built-in hard arts always lead the list; saved puzzles follow.
    const puzzles = [...BUILTIN_PUZZLES, ...saved];
    list.innerHTML = "";
    puzzles.forEach((p) => list.appendChild(card(p)));
  } catch (e) {
    // Even if Firestore fails, still show the built-in arts.
    list.innerHTML = "";
    BUILTIN_PUZZLES.forEach((p) => list.appendChild(card(p)));
    const note = document.createElement("p");
    note.className = "ca-modal-loading";
    note.textContent = `Couldn't load saved puzzles (${e.code || e.message}).`;
    list.appendChild(note);
  }
}
function closePicker() {
  $("#ca-picker").classList.remove("is-open");
  $("#picker-backdrop")?.classList.remove("is-open");
  prepbotPick = null;
}

function card(doc) {
  const tile = DIFF_TILE[doc.difficulty] || "var(--accent-secondary)";
  const n = (doc.points || []).length;
  const wrap = document.createElement("div");
  wrap.className = "ca-puzzle-card";
  wrap.innerHTML = `
    <div class="ca-puzzle-main">
      <span class="ca-puzzle-name">${escapeHtml(doc.title || "Untitled")}</span>
      <span class="ca-puzzle-meta">
        <span class="pp-pill pp-pill--static" style="--tile:${tile}">${escapeHtml(doc.difficulty || "easy")}</span>
        <span class="ca-puzzle-pts">${n} points</span>
      </span>
    </div>
    <div class="ca-puzzle-actions"></div>`;

  // visual preview of the puzzle's outline
  const shapes = normalizeShapes(doc);
  if (shapes.length) {
    const thumb = document.createElement("div");
    thumb.className = "ca-puzzle-thumb";
    thumb.appendChild(buildThumb(shapes, 116, 88));
    wrap.prepend(thumb);
  }

  const actions = wrap.querySelector(".ca-puzzle-actions");

  // PrepBot picking a picture to draw: a single "Draw this" action, no
  // Play/Edit/Delete (this isn't entering puzzle-mode).
  if (prepbotPick) {
    const draw = document.createElement("button");
    draw.className = "ca-soft-btn ca-soft-btn--sm ca-soft-btn--accent";
    draw.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1.4" fill="currentColor" stroke="none"/></svg> Draw this`;
    draw.addEventListener("click", () => { const fn = prepbotPick; closePicker(); fn?.(doc); });
    actions.appendChild(draw);
    return wrap;
  }

  const play = document.createElement("button");
  play.className = "ca-soft-btn ca-soft-btn--sm ca-soft-btn--accent";
  play.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg> Play`;
  play.addEventListener("click", () => { enterPuzzle(toPuzzle(doc)); closePicker(); });
  actions.appendChild(play);

  if (admin && !doc.builtin) {
    const edit = document.createElement("button");
    edit.className = "ca-soft-btn ca-soft-btn--sm";
    edit.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg> Edit`;
    edit.addEventListener("click", () => {
      if (Array.isArray(doc.shapes) && doc.shapes.length) {
        loadShape({ shapes: doc.shapes, grid: doc.grid });
      } else {
        loadShape({ points: doc.points, closed: doc.closed, grid: doc.grid });
      }
      editId = doc.id;
      closePicker();
      openAuthor(doc);
    });
    actions.appendChild(edit);

    const del = document.createElement("button");
    del.className = "ca-soft-btn ca-soft-btn--sm ca-soft-btn--danger ca-soft-btn--icon";
    del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>`;
    del.title = "Delete puzzle";
    del.addEventListener("click", async () => {
      if (!confirm(`Delete "${doc.title}"?`)) return;
      await deletePuzzle(doc.id);
      openPicker();
    });
    actions.appendChild(del);
  }
  return wrap;
}

/* ── authoring (admin) ─────────────────────────────────────────────────── */
function openAuthor(doc = null) {
  if (allPoints().length < 2) {
    alert("Plot at least 2 points on the grid first, then save them as a puzzle.");
    return;
  }
  $("#author-title").value = doc?.title || "";
  $("#author-prompt").value = doc?.prompt || "";
  $("#author-difficulty").value = doc?.difficulty || "easy";
  updateShapeInfo();
  $("#author-status").textContent = editId ? "Editing existing puzzle" : "";
  $("#ca-author").classList.add("is-open");
}
function closeAuthor() { $("#ca-author").classList.remove("is-open"); editId = null; }

function updateShapeInfo() {
  const shapes = state.shapes.filter((s) => s.points.length);
  const n = allPoints().length;
  const k = shapes.length;
  $("#author-shapeinfo").textContent =
    `${k} shape${k === 1 ? "" : "s"} · ${n} point${n === 1 ? "" : "s"}`;
}

async function submitAuthor(e) {
  e.preventDefault();
  const btn = $("#author-save");
  btn.disabled = true;
  $("#author-status").textContent = "Saving…";
  try {
    const shapes = state.shapes
      .filter((s) => s.points.length)
      .map((s) => ({
        points: s.points.map((p) => ({ x: p.x, y: p.y })),
        closed: s.closed,
        fillColor: s.fillColor || null,
        strokeColor: s.strokeColor || null,
      }));
    const id = await savePuzzle(
      {
        title: $("#author-title").value.trim() || "Untitled",
        prompt: $("#author-prompt").value.trim(),
        difficulty: $("#author-difficulty").value,
        grid: gridWindow(),
        shapes,
        // flattened union of every vertex — used as the connect-the-dots targets
        points: allPoints().map((p) => ({ x: p.x, y: p.y })),
        closed: shapes.some((s) => s.closed),
      },
      editId
    );
    $("#author-status").textContent = "Saved!";
    setTimeout(() => { closeAuthor(); }, 600);
  } catch (err) {
    $("#author-status").textContent = `Save failed: ${err.code || err.message}`;
  } finally {
    btn.disabled = false;
  }
}

/* ── admin UI reveal ───────────────────────────────────────────────────── */
function applyAdmin(on) {
  admin = on;
  document.querySelectorAll(".ca-admin-only").forEach((el) => (el.hidden = !on));
}

export function initLibrary() {
  applyAdmin(isAdminUser());
  onAuthStateChanged(auth, (u) => applyAdmin(isAdminUser(u)));

  $("#ca-puzzles-btn")?.addEventListener("click", openPicker);
  $("#picker-close")?.addEventListener("click", closePicker);
  $("#picker-backdrop")?.addEventListener("click", closePicker);
  $("#picker-new")?.addEventListener("click", () => { editId = null; closePicker(); openAuthor(); });

  $("#ca-author-btn")?.addEventListener("click", () => { editId = null; openAuthor(); });
  $("#author-close")?.addEventListener("click", closeAuthor);
  $("#ca-author")?.addEventListener("click", (e) => { if (e.target.id === "ca-author") closeAuthor(); });
  $("#author-form")?.addEventListener("submit", submitAuthor);

  $("#author-paste-load")?.addEventListener("click", loadPaste);
}

/* Parse pasted worksheet text and lay the shapes onto the grid. */
function loadPaste() {
  const ta = $("#author-paste-input");
  const status = $("#author-paste-status");
  if (!ta) return;
  const shapes = parseWorksheet(ta.value);
  if (!shapes.length) {
    if (status) status.textContent = "No coordinates found.";
    return;
  }
  setShapes(shapes);
  updateShapeInfo();
  if (status) {
    const pts = shapes.reduce((n, s) => n + s.points.length, 0);
    status.textContent = `Loaded ${shapes.length} shape${shapes.length === 1 ? "" : "s"} · ${pts} points.`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
