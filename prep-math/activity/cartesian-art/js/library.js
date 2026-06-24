/* ============================================================================
   Cartesian Art — puzzle library + admin authoring
   ----------------------------------------------------------------------------
   • Picker (everyone): browse saved puzzles and play one.
   • Authoring (admin only): turn the shape currently on the grid into a saved
     puzzle, or load an existing one back onto the grid to edit + re-save.
   Admin-only controls are revealed by the auth listener; writes are still
   enforced server-side by firestore.rules.
   ========================================================================== */

import { state, enterPuzzle, loadShape } from "./state.js";
import {
  listPuzzles,
  savePuzzle,
  deletePuzzle,
  isAdminUser,
} from "./puzzles.js";
import { auth } from "/firebase-init.js";
import { onAuthStateChanged } from "firebase/auth";

const $ = (s) => document.querySelector(s);
let editId = null;
let admin = false;

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
    closed: doc.closed,
  };
}

/* ── picker ────────────────────────────────────────────────────────────── */
async function openPicker() {
  const ov = $("#ca-picker");
  ov.classList.add("is-open");
  const list = $("#picker-list");
  const empty = $("#picker-empty");
  list.innerHTML = `<p class="ca-modal-loading">Loading puzzles…</p>`;
  empty.hidden = true;
  try {
    const puzzles = await listPuzzles();
    if (!puzzles.length) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }
    list.innerHTML = "";
    puzzles.forEach((p) => list.appendChild(card(p)));
  } catch (e) {
    list.innerHTML = `<p class="ca-modal-loading">Couldn't load puzzles (${e.code || e.message}).</p>`;
  }
}
function closePicker() { $("#ca-picker").classList.remove("is-open"); }

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
  const actions = wrap.querySelector(".ca-puzzle-actions");

  const play = document.createElement("button");
  play.className = "pp-btn ca-act";
  play.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg> Play`;
  play.addEventListener("click", () => { enterPuzzle(toPuzzle(doc)); closePicker(); });
  actions.appendChild(play);

  if (admin) {
    const edit = document.createElement("button");
    edit.className = "pp-btn pp-btn--ghost ca-act";
    edit.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg> Edit`;
    edit.addEventListener("click", () => {
      loadShape({ points: doc.points, closed: doc.closed, grid: doc.grid });
      editId = doc.id;
      closePicker();
      openAuthor(doc);
    });
    actions.appendChild(edit);

    const del = document.createElement("button");
    del.className = "pp-btn pp-btn--ghost ca-act ca-act--danger";
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
  if (state.points.length < 2) {
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
  const n = state.points.length;
  $("#author-shapeinfo").textContent =
    `${n} point${n === 1 ? "" : "s"}${state.closed ? " · closed loop" : " · open path"}`;
}

async function submitAuthor(e) {
  e.preventDefault();
  const btn = $("#author-save");
  btn.disabled = true;
  $("#author-status").textContent = "Saving…";
  try {
    const id = await savePuzzle(
      {
        title: $("#author-title").value.trim() || "Untitled",
        prompt: $("#author-prompt").value.trim(),
        difficulty: $("#author-difficulty").value,
        grid: gridWindow(),
        points: state.points.map((p) => ({ x: p.x, y: p.y })),
        closed: state.closed,
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
  $("#ca-picker")?.addEventListener("click", (e) => { if (e.target.id === "ca-picker") closePicker(); });
  $("#picker-new")?.addEventListener("click", () => { editId = null; closePicker(); openAuthor(); });

  $("#ca-author-btn")?.addEventListener("click", () => { editId = null; openAuthor(); });
  $("#author-close")?.addEventListener("click", closeAuthor);
  $("#ca-author")?.addEventListener("click", (e) => { if (e.target.id === "ca-author") closeAuthor(); });
  $("#author-form")?.addEventListener("submit", submitAuthor);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
