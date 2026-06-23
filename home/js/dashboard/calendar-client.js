/* ════════════════════════════════════════════════════
   calendar-client.js
   A sticky-note month calendar for the dashboard. Students and teachers see
   the class sessions an admin has pinned; the admin can drag a teacher onto a
   day to pin a class (which fans out to that teacher + their students).
   Mounts into #db-calendar-mount that the panel builders drop in.
   ════════════════════════════════════════════════════ */
import { auth } from "/firebase-init.js";

const API = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad2 = (n) => String(n).padStart(2, "0");
const ymd = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

async function api(path, opts = {}) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function mountCalendar(layout) {
  const mount = layout.querySelector("#db-calendar-mount");
  if (!mount) return;
  injectStyles();

  const today = new Date();
  const state = {
    y: today.getFullYear(),
    m: today.getMonth(),
    events: [],
    byDate: {},
    admin: false,
    teachers: [],
  };

  function indexEvents() {
    state.byDate = {};
    state.events.forEach((e) => { (state.byDate[e.date] = state.byDate[e.date] || []).push(e); });
  }

  try {
    const { events, admin } = await api("/api/calendar");
    state.events = events || [];
    state.admin = !!admin;
    indexEvents();
    if (state.admin) {
      try { state.teachers = (await api("/api/calendar/teachers")).teachers || []; } catch (_) {}
    }
  } catch (e) {
    mount.innerHTML = `<div class="db-empty">Couldn't load the calendar.</div>`;
    return;
  }

  render();

  function render() {
    const first = new Date(state.y, state.m, 1);
    const startDow = first.getDay();
    const daysIn = new Date(state.y, state.m + 1, 0).getDate();
    const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

    let cells = "";
    for (let i = 0; i < startDow; i++) cells += `<div class="dbc-day dbc-pad"></div>`;
    for (let d = 1; d <= daysIn; d++) {
      const ds = ymd(state.y, state.m, d);
      const evs = state.byDate[ds] || [];
      const chips = evs.slice(0, 2).map((e) => eventChip(e)).join("");
      const more = evs.length > 2 ? `<span class="dbc-more">+${evs.length - 2}</span>` : "";
      cells += `<div class="dbc-day${ds === todayStr ? " dbc-today" : ""}${state.admin ? " dbc-drop" : ""}" data-date="${ds}">
          <span class="dbc-num">${d}</span>${chips}${more}</div>`;
    }

    const palette = state.admin
      ? `<div class="dbc-palette">
           <span class="dbc-palette-lbl">Drag a teacher onto a day to pin a class:</span>
           <div class="dbc-chips">${
             state.teachers.length
               ? state.teachers.map((t) => `<span class="dbc-teacher" draggable="true" data-uid="${esc(t.uid)}" data-name="${esc(t.name)}">${esc(t.name)}</span>`).join("")
               : `<span class="dbc-palette-empty">No teachers yet.</span>`
           }</div>
         </div>`
      : "";

    mount.innerHTML = `
      <div class="dbc">
        <div class="dbc-head">
          <button class="dbc-nav" type="button" data-dir="-1" aria-label="Previous month">&lsaquo;</button>
          <strong class="dbc-title">${MONTHS[state.m]} ${state.y}</strong>
          <button class="dbc-nav" type="button" data-dir="1" aria-label="Next month">&rsaquo;</button>
        </div>
        <div class="dbc-grid">
          ${DOW.map((d) => `<span class="dbc-dow">${d}</span>`).join("")}
          ${cells}
        </div>
        ${palette}
      </div>`;

    mount.querySelectorAll(".dbc-nav").forEach((b) => b.onclick = () => {
      state.m += +b.dataset.dir;
      if (state.m < 0) { state.m = 11; state.y--; }
      else if (state.m > 11) { state.m = 0; state.y++; }
      render();
    });

    if (state.admin) wireAdmin();
  }

  function eventChip(e) {
    const del = state.admin ? `<button class="dbc-x" type="button" data-del="${esc(e.id)}" title="Remove">&times;</button>` : "";
    const t = e.time ? `${esc(e.time)} ` : "";
    const who = e.teacherName ? ` · ${esc(e.teacherName)}` : "";
    return `<span class="dbc-ev" style="background:${esc(e.color || "#bfe3ff")}" title="${esc((e.title || "") + (e.time ? " · " + e.time : "") + (e.teacherName ? " · " + e.teacherName : ""))}">${t}${esc(e.title || "Class")}${who}${del}</span>`;
  }

  function wireAdmin() {
    // Delete pinned events.
    mount.querySelectorAll("[data-del]").forEach((b) => b.onclick = async (ev) => {
      ev.stopPropagation();
      if (!confirm("Remove this pinned class?")) return;
      try {
        await api(`/api/calendar/${encodeURIComponent(b.dataset.del)}`, { method: "DELETE" });
        state.events = state.events.filter((x) => x.id !== b.dataset.del);
        indexEvents();
        render();
      } catch (e) { alert(e.message); }
    });

    // Drag teachers onto day cells.
    mount.querySelectorAll(".dbc-teacher").forEach((chip) => {
      chip.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/uid", chip.dataset.uid);
        e.dataTransfer.setData("text/name", chip.dataset.name);
        e.dataTransfer.effectAllowed = "copy";
      });
    });
    mount.querySelectorAll(".dbc-drop").forEach((cell) => {
      cell.addEventListener("dragover", (e) => { e.preventDefault(); cell.classList.add("dbc-over"); });
      cell.addEventListener("dragleave", () => cell.classList.remove("dbc-over"));
      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        cell.classList.remove("dbc-over");
        const uid = e.dataTransfer.getData("text/uid");
        const name = e.dataTransfer.getData("text/name");
        if (uid) openPin(cell.dataset.date, uid, name);
      });
      // Tapping a day also opens the pin dialog (touch / no-drag fallback).
      cell.addEventListener("click", () => {
        if (state.teachers.length) openPin(cell.dataset.date, "", "");
      });
    });
  }

  function openPin(date, teacherUid, teacherName) {
    const teacherOpts = state.teachers
      .map((t) => `<option value="${esc(t.uid)}"${t.uid === teacherUid ? " selected" : ""}>${esc(t.name)}</option>`)
      .join("");
    const root = document.createElement("div");
    root.className = "dbc-modal";
    root.innerHTML = `
      <div class="dbc-modal__bd"></div>
      <div class="dbc-modal__card">
        <h3>Pin a class</h3>
        <p class="dbc-modal__sub">${esc(date)}${teacherName ? " · " + esc(teacherName) : ""}</p>
        <label class="dbc-field">Teacher
          <select id="dbc-teacher">${teacherOpts}</select></label>
        <label class="dbc-field">Class / title
          <input id="dbc-title" type="text" maxlength="120" placeholder="e.g. Maths — Algebra" value="Class" /></label>
        <label class="dbc-field">Time (optional)
          <input id="dbc-time" type="time" /></label>
        <div class="dbc-modal__row">
          <button class="btn btn-yellow" id="dbc-pin" type="button">Pin to calendar</button>
          <button class="btn btn-ghost" id="dbc-cancel" type="button">Cancel</button>
        </div>
        <p class="dbc-msg" id="dbc-msg"></p>
      </div>`;
    document.body.appendChild(root);
    const close = () => root.remove();
    root.querySelector(".dbc-modal__bd").onclick = close;
    root.querySelector("#dbc-cancel").onclick = close;
    const titleEl = root.querySelector("#dbc-title");
    titleEl.focus();
    titleEl.select();

    root.querySelector("#dbc-pin").onclick = async () => {
      const teacher = root.querySelector("#dbc-teacher").value;
      const title = titleEl.value.trim() || "Class";
      const time = root.querySelector("#dbc-time").value || "";
      const msg = root.querySelector("#dbc-msg");
      if (!teacher) { msg.textContent = "Pick a teacher."; return; }
      msg.textContent = "Pinning…";
      try {
        const d = await api("/api/calendar/pin", {
          method: "POST",
          body: JSON.stringify({ teacherUid: teacher, title, className: title, date, time }),
        });
        state.events.push(d.event);
        indexEvents();
        render();
        close();
      } catch (e) { msg.textContent = e.message; }
    };
  }
}

function injectStyles() {
  if (document.getElementById("dbc-styles")) return;
  const s = document.createElement("style");
  s.id = "dbc-styles";
  s.textContent = `
    /* The whole panel reads as a sticky note: pastel paper, tape, a little tilt. */
    .db-calendar-panel { position: relative; background: #bfe3ff; border: 0; border-radius: 4px;
      box-shadow: 0 1px 1px rgba(20,19,15,.1), 5px 10px 16px -6px rgba(20,19,15,.28);
      transform: rotate(-0.7deg); overflow: visible; }
    .db-calendar-panel::before { content:""; position:absolute; top:-10px; left:50%; width:84px; height:20px;
      transform: translateX(-50%) rotate(-2.5deg); background: rgba(255,255,255,.5); box-shadow:0 1px 2px rgba(0,0,0,.14); }
    .db-calendar-panel .db-kicker { color: rgba(20,19,15,.6); }
    .db-calendar-panel .db-panel-title { color:#14130f; }
    .dbc { font-family: var(--font-mono, monospace); }
    .dbc-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:.6rem; }
    .dbc-title { font-family: var(--font-display, sans-serif); font-size:1rem; }
    .dbc-nav { width:30px; height:30px; border-radius:9px; cursor:pointer; font-size:1.1rem; line-height:1;
      border: var(--border-subtle, 1px solid rgba(42,39,35,.14)); background: var(--surface-secondary, #f4f0e8); color: var(--ink, #2a2723); }
    .dbc-nav:hover { background: var(--surface-tertiary, #e9e2d4); }
    .dbc-grid { display:grid; grid-template-columns: repeat(7, 1fr); gap:5px; }
    .dbc-dow { text-align:center; font-size:.6rem; text-transform:uppercase; letter-spacing:.05em; color: var(--text-secondary, #6b655c); padding:.2rem 0; }
    .dbc-day { min-height:62px; border-radius:10px; padding:4px; position:relative; display:flex; flex-direction:column; gap:3px;
      background: var(--surface-primary, #fffdf8); border: var(--border-subtle, 1px solid rgba(42,39,35,.1)); overflow:hidden; }
    .dbc-pad { background:transparent; border:none; }
    .dbc-num { font-size:.66rem; color: var(--text-secondary, #6b655c); font-weight:700; }
    .dbc-today { outline:2px solid var(--accent-secondary, #6fb7e8); outline-offset:-1px; }
    .dbc-drop { cursor:pointer; }
    .dbc-over { background: var(--surface-tertiary, #e9e2d4); border-color: var(--accent-secondary, #6fb7e8); }
    .dbc-ev { display:flex; align-items:center; gap:3px; font-size:.58rem; line-height:1.25; color:#14130f;
      border-radius:6px; padding:2px 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; box-shadow:0 1px 2px rgba(20,19,15,.12); }
    .dbc-x { margin-left:auto; border:none; background:transparent; color:rgba(20,19,15,.6); cursor:pointer; font-size:.8rem; line-height:1; padding:0 1px; }
    .dbc-x:hover { color:#14130f; }
    .dbc-more { font-size:.56rem; color: var(--text-secondary, #6b655c); }
    .dbc-palette { margin-top:.8rem; padding-top:.7rem; border-top:1px dashed color-mix(in srgb, var(--ink) 14%, transparent); }
    .dbc-palette-lbl { font-size:.62rem; color: var(--text-secondary, #6b655c); display:block; margin-bottom:.4rem; }
    .dbc-chips { display:flex; flex-wrap:wrap; gap:.4rem; }
    .dbc-teacher { font-size:.66rem; padding:.25rem .6rem; border-radius:999px; cursor:grab; user-select:none;
      background: var(--accent-secondary, #6fb7e8); color: var(--text-on-accent, #fff); box-shadow: var(--shadow-sm, 0 1px 3px rgba(42,39,35,.16)); }
    .dbc-teacher:active { cursor:grabbing; }
    .dbc-palette-empty { font-size:.66rem; color: var(--text-tertiary, #9a948a); }
    .dbc-modal { position:fixed; inset:0; z-index:100002; display:flex; align-items:center; justify-content:center; padding:1rem; }
    .dbc-modal__bd { position:absolute; inset:0; background: rgba(42,39,35,.5); }
    .dbc-modal__card { position:relative; width:min(380px,100%); background: var(--surface-primary,#fffdf8); color: var(--ink,#2a2723);
      border: var(--border-subtle, 1px solid rgba(42,39,35,.14)); border-radius:16px; box-shadow: var(--shadow-xl, 0 18px 40px rgba(42,39,35,.2));
      padding:1.3rem; font-family: var(--font-mono, monospace); }
    .dbc-modal__card h3 { font-family: var(--font-display, sans-serif); font-size:1.05rem; margin:0 0 .2rem; }
    .dbc-modal__sub { font-size:.68rem; color: var(--text-secondary,#6b655c); margin:0 0 .9rem; }
    .dbc-field { display:block; font-size:.66rem; color: var(--text-secondary,#6b655c); margin-bottom:.7rem; }
    .dbc-field select, .dbc-field input { width:100%; box-sizing:border-box; margin-top:.25rem; padding:.5rem .6rem; border-radius:10px; font-family:inherit;
      font-size:.85rem; border: var(--border-subtle, 1px solid rgba(42,39,35,.16)); background: var(--surface-secondary,#f4f0e8); color: var(--ink,#2a2723); }
    .dbc-modal__row { display:flex; gap:.6rem; margin-top:.3rem; }
    .dbc-msg { font-size:.7rem; min-height:1em; margin:.6rem 0 0; color: var(--accent-danger,#e07a5f); }`;
  document.head.appendChild(s);
}
