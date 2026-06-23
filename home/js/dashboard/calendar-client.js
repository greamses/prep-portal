/* ════════════════════════════════════════════════════
   calendar-client.js
   A Google-Calendar-style month grid for the dashboard. Pinned class sessions
   show as little push-pinned sticky notes; hover or click a note to see the
   full details. Students and teachers see what an admin has pinned; the admin
   can drag a teacher onto a day to pin a class (fans out to that teacher + their
   students). Mounts into #db-calendar-mount that the panel builders drop in.
   ════════════════════════════════════════════════════ */
import { auth } from "/firebase-init.js";

const API = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

/* A round-head thumbtack, viewed front-on — the "real pin" that holds a note. */
const PIN = `<svg class="dbc-pin-svg" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
  <circle cx="12" cy="12" r="7" fill="#e07a5f"/>
  <circle cx="12" cy="12" r="7" fill="none" stroke="#b9543c" stroke-width="1.2"/>
  <circle cx="9.6" cy="9.6" r="2" fill="rgba(255,255,255,.75)"/></svg>`;

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

const row = (k, v) => `<div class="dbc-pop-row"><dt>${k}</dt><dd>${v}</dd></div>`;

function fmtLong(ds) {
  const [y, m, d] = ds.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dt.getDay()]}, ${MONTHS[m - 1]} ${d}`;
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
    byId: {},
    admin: false,
    teachers: [],
  };

  let pop = null;          // shared details popover (one at a time)
  let popPinned = false;   // true after a click — stays open until dismissed
  let studentsCache = null; // admin: lazily-loaded pool of all students

  function indexEvents() {
    state.byDate = {};
    state.byId = {};
    state.events.forEach((e) => {
      (state.byDate[e.date] = state.byDate[e.date] || []).push(e);
      state.byId[e.id] = e;
    });
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

  // Dismiss a click-pinned popover when clicking anywhere off it.
  document.addEventListener("click", (e) => {
    if (!pop || pop.style.display === "none") return;
    if (pop.contains(e.target) || e.target.closest(".dbc-note")) return;
    hidePop();
  });
  window.addEventListener("scroll", () => { if (!popPinned) hidePop(); }, true);

  render();

  function render() {
    hidePop();
    const first = new Date(state.y, state.m, 1);
    const startDow = first.getDay();
    const daysIn = new Date(state.y, state.m + 1, 0).getDate();
    const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

    let cells = "";
    for (let i = 0; i < startDow; i++) cells += `<div class="dbc-day dbc-pad"></div>`;
    for (let d = 1; d <= daysIn; d++) {
      const ds = ymd(state.y, state.m, d);
      const evs = state.byDate[ds] || [];
      const notes = evs.slice(0, 3).map((e, i) => eventNote(e, i)).join("");
      const more = evs.length > 3 ? `<span class="dbc-more">+${evs.length - 3} more</span>` : "";
      const isToday = ds === todayStr;
      cells += `<div class="dbc-day${isToday ? " dbc-today" : ""}${state.admin ? " dbc-drop" : ""}" data-date="${ds}">
          <span class="dbc-num">${d}</span><div class="dbc-notes">${notes}${more}</div></div>`;
    }

    const palette = state.admin
      ? `<div class="dbc-palette">
           <div class="dbc-palette-top">
             <span class="dbc-palette-lbl">Drag a teacher onto a day to pin a class:</span>
             <button class="dbc-roster-btn" type="button" data-roster>Class lists</button>
           </div>
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
        <div class="dbc-grid-head">${DOW.map((d) => `<span class="dbc-dow">${d}</span>`).join("")}</div>
        <div class="dbc-grid">${cells}</div>
        ${palette}
      </div>`;

    mount.querySelectorAll(".dbc-nav").forEach((b) => b.onclick = () => {
      state.m += +b.dataset.dir;
      if (state.m < 0) { state.m = 11; state.y--; }
      else if (state.m > 11) { state.m = 0; state.y++; }
      render();
    });

    wireNotes();
    if (state.admin) wireAdmin();
  }

  function eventNote(e, i) {
    const tilt = i % 2 ? 1.4 : -1.4;
    const t = e.time ? `<span class="dbc-note-time">${esc(e.time)}</span>` : "";
    return `<span class="dbc-note" data-evid="${esc(e.id)}" tabindex="0" role="button"
        style="--n:${esc(e.color || "#ffe27a")}; --tilt:${tilt}deg"
        aria-label="${esc((e.title || "Class") + (e.time ? " at " + e.time : ""))}">
        <span class="dbc-pin">${PIN}</span>${t}<span class="dbc-note-t">${esc(e.title || "Class")}</span></span>`;
  }

  // ── Details popover ───────────────────────────────────────────────
  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement("div");
    pop.className = "dbc-pop";
    pop.style.display = "none";
    document.body.appendChild(pop);
    return pop;
  }

  function showPop(target, e) {
    const p = ensurePop();
    const remove = state.admin
      ? `<button class="dbc-pop-del" type="button" data-del="${esc(e.id)}">Remove from calendar</button>`
      : "";
    const when = esc(fmtLong(e.date)) +
      (e.time ? " · " + esc(e.time) + (e.endTime ? "–" + esc(e.endTime) : "") : "");
    const rows = [
      e.subject ? row("Subject", esc(e.subject)) : "",
      e.teacherName ? row("Instructor", esc(e.teacherName)) : "",
      e.location ? row("Where", esc(e.location)) : "",
      // The reach — how many children this class is assigned to (teacher/admin only).
      (state.admin && typeof e.studentCount === "number")
        ? row("Class", `${e.studentCount} student${e.studentCount === 1 ? "" : "s"}`) : "",
    ].join("");
    p.innerHTML = `
      <span class="dbc-pop-pin">${PIN}</span>
      <div class="dbc-pop-bar" style="background:${esc(e.color || "#ffe27a")}"></div>
      <h4 class="dbc-pop-title">${esc(e.title || "Class")}</h4>
      <p class="dbc-pop-when">${when}</p>
      ${rows ? `<dl class="dbc-pop-list">${rows}</dl>` : ""}
      ${e.notes ? `<p class="dbc-pop-notes">${esc(e.notes)}</p>` : ""}
      ${remove}`;
    p.style.display = "block";

    if (state.admin) {
      p.querySelector("[data-del]").onclick = async (ev) => {
        ev.stopPropagation();
        if (!confirm("Remove this pinned class?")) return;
        try {
          await api(`/api/calendar/${encodeURIComponent(e.id)}`, { method: "DELETE" });
          state.events = state.events.filter((x) => x.id !== e.id);
          indexEvents();
          render();
        } catch (err) { alert(err.message); }
      };
    }

    const r = target.getBoundingClientRect();
    const pr = p.getBoundingClientRect();
    let left = r.left + r.width / 2 - pr.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - pr.width - 8));
    let top = r.bottom + 10;
    if (top + pr.height > window.innerHeight - 8) top = r.top - pr.height - 10;
    p.style.left = `${left}px`;
    p.style.top = `${Math.max(8, top)}px`;
  }

  function hidePop() {
    popPinned = false;
    if (pop) pop.style.display = "none";
  }

  function wireNotes() {
    mount.querySelectorAll(".dbc-note").forEach((n) => {
      const ev = state.byId[n.dataset.evid];
      if (!ev) return;
      n.addEventListener("mouseenter", () => { if (!popPinned) showPop(n, ev); });
      n.addEventListener("mouseleave", () => { if (!popPinned) hidePop(); });
      n.addEventListener("focus", () => { if (!popPinned) showPop(n, ev); });
      n.addEventListener("blur", () => { if (!popPinned) hidePop(); });
      n.addEventListener("click", (e) => {
        e.stopPropagation();
        popPinned = true;
        showPop(n, ev);
      });
    });
  }

  function wireAdmin() {
    mount.querySelector("[data-roster]")?.addEventListener("click", openRoster);

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
      // Tapping an empty day also opens the pin dialog (touch / no-drag fallback).
      cell.addEventListener("click", (e) => {
        if (e.target.closest(".dbc-note")) return;
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
        <p class="dbc-modal__sub">${esc(fmtLong(date))}${teacherName ? " · " + esc(teacherName) : ""}</p>
        <label class="dbc-field">Teacher
          <select id="dbc-teacher">${teacherOpts}</select></label>
        <label class="dbc-field">Class / title
          <input id="dbc-title" type="text" maxlength="120" placeholder="e.g. Maths — Algebra" value="Class" /></label>
        <label class="dbc-field">Subject (optional)
          <input id="dbc-subject" type="text" maxlength="80" placeholder="e.g. Mathematics" /></label>
        <div class="dbc-field-2">
          <label class="dbc-field">Starts
            <input id="dbc-time" type="time" /></label>
          <label class="dbc-field">Ends (optional)
            <input id="dbc-endtime" type="time" /></label>
        </div>
        <label class="dbc-field">Where (optional)
          <input id="dbc-location" type="text" maxlength="160" placeholder="e.g. Room 3 / Zoom link" /></label>
        <label class="dbc-field">Notes (optional)
          <textarea id="dbc-notes" maxlength="600" rows="2" placeholder="What to bring, topics, prep…"></textarea></label>
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
      const subject = root.querySelector("#dbc-subject").value.trim();
      const time = root.querySelector("#dbc-time").value || "";
      const endTime = root.querySelector("#dbc-endtime").value || "";
      const location = root.querySelector("#dbc-location").value.trim();
      const notes = root.querySelector("#dbc-notes").value.trim();
      const msg = root.querySelector("#dbc-msg");
      if (!teacher) { msg.textContent = "Pick a teacher."; return; }
      if (endTime && time && endTime < time) { msg.textContent = "End time is before the start time."; return; }
      msg.textContent = "Pinning…";
      try {
        const d = await api("/api/calendar/pin", {
          method: "POST",
          body: JSON.stringify({ teacherUid: teacher, title, className: title, subject, date, time, endTime, location, notes }),
        });
        state.events.push(d.event);
        indexEvents();
        render();
        close();
      } catch (e) { msg.textContent = e.message; }
    };
  }

  // ── Class lists: assign students to a teacher's roster ────────────
  async function openRoster() {
    if (!state.teachers.length) { alert("Add a teacher first."); return; }
    const root = document.createElement("div");
    root.className = "dbc-modal";
    root.innerHTML = `
      <div class="dbc-modal__bd"></div>
      <div class="dbc-modal__card">
        <h3>Class lists</h3>
        <p class="dbc-modal__sub">Assign students to a teacher. They'll get every class pinned to that teacher.</p>
        <label class="dbc-field">Teacher
          <select id="dbc-rt">${state.teachers.map((t) => `<option value="${esc(t.uid)}">${esc(t.name)}</option>`).join("")}</select></label>
        <div class="dbc-roster-body"><div class="db-empty">Loading…</div></div>
        <div class="dbc-modal__row">
          <button class="btn btn-ghost" id="dbc-rclose" type="button">Done</button>
        </div>
        <p class="dbc-msg" id="dbc-rmsg"></p>
      </div>`;
    document.body.appendChild(root);
    let touched = false;
    const close = () => {
      root.remove();
      // Roster sizes changed → refresh events so "Class: N students" stays accurate.
      if (touched) refreshEvents();
    };
    root.querySelector(".dbc-modal__bd").onclick = close;
    root.querySelector("#dbc-rclose").onclick = close;

    const sel = root.querySelector("#dbc-rt");
    const body = root.querySelector(".dbc-roster-body");
    const msg = root.querySelector("#dbc-rmsg");

    if (!studentsCache) {
      try { studentsCache = (await api("/api/calendar/students")).students || []; }
      catch (e) { body.innerHTML = `<div class="db-empty">${esc(e.message)}</div>`; return; }
    }

    async function loadRoster() {
      const teacherUid = sel.value;
      body.innerHTML = `<div class="db-empty">Loading…</div>`;
      let roster = [];
      try { roster = (await api(`/api/calendar/roster/${encodeURIComponent(teacherUid)}`)).students || []; }
      catch (e) { body.innerHTML = `<div class="db-empty">${esc(e.message)}</div>`; return; }
      renderRoster(teacherUid, roster);
    }

    function renderRoster(teacherUid, roster) {
      const inClass = new Set(roster.map((s) => s.uid));
      const avail = studentsCache.filter((s) => !inClass.has(s.uid));
      const list = roster.length
        ? roster.map((s) => `<div class="dbc-rrow">
             <span class="dbc-rname">${esc(s.name)}</span>
             <button class="dbc-rx" type="button" data-rm="${esc(s.uid)}" title="Remove">&times;</button>
           </div>`).join("")
        : `<div class="db-empty">No students yet.</div>`;
      body.innerHTML = `
        <div class="dbc-rlist">${list}</div>
        <div class="dbc-radd">
          <select id="dbc-rs"${avail.length ? "" : " disabled"}>
            ${avail.length
              ? avail.map((s) => `<option value="${esc(s.uid)}">${esc(s.name)}${s.email ? " — " + esc(s.email) : ""}</option>`).join("")
              : `<option>All students assigned</option>`}
          </select>
          <button class="btn btn-yellow" id="dbc-radd-btn" type="button"${avail.length ? "" : " disabled"}>Add</button>
        </div>`;

      body.querySelector("#dbc-radd-btn")?.addEventListener("click", async () => {
        const studentUid = body.querySelector("#dbc-rs").value;
        if (!studentUid) return;
        msg.textContent = "Adding…";
        try {
          await api("/api/calendar/assign-student", {
            method: "POST",
            body: JSON.stringify({ teacherUid, studentUid }),
          });
          touched = true;
          msg.textContent = "";
          loadRoster();
        } catch (e) { msg.textContent = e.message; }
      });

      body.querySelectorAll("[data-rm]").forEach((b) => b.onclick = async () => {
        if (!confirm("Remove this student from the class?")) return;
        msg.textContent = "Removing…";
        try {
          await api(`/api/calendar/roster/${encodeURIComponent(teacherUid)}/${encodeURIComponent(b.dataset.rm)}`, { method: "DELETE" });
          touched = true;
          msg.textContent = "";
          loadRoster();
        } catch (e) { msg.textContent = e.message; }
      });
    }

    sel.onchange = loadRoster;
    loadRoster();
  }

  async function refreshEvents() {
    try {
      const { events } = await api("/api/calendar");
      state.events = events || [];
      indexEvents();
      render();
    } catch (_) {}
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
    .dbc-title { font-family: var(--font-display, sans-serif); font-size:1rem; color:#14130f; }
    .dbc-nav { width:30px; height:30px; border-radius:9px; cursor:pointer; font-size:1.1rem; line-height:1;
      border: 1px solid rgba(20,19,15,.18); background: rgba(255,255,255,.55); color:#14130f; }
    .dbc-nav:hover { background: rgba(255,255,255,.85); }

    /* Google-style grid: no per-day boxes — just clean hairlines. */
    .dbc-grid-head { display:grid; grid-template-columns: repeat(7, 1fr); margin-bottom:2px; }
    .dbc-dow { text-align:center; font-size:.58rem; text-transform:uppercase; letter-spacing:.06em;
      color: rgba(20,19,15,.55); padding:.2rem 0; font-weight:700; }
    .dbc-grid { display:grid; grid-template-columns: repeat(7, 1fr);
      border-right:1px solid rgba(20,19,15,.12); border-bottom:1px solid rgba(20,19,15,.12); }
    .dbc-day { min-height:76px; padding:3px 3px 5px; position:relative; display:flex; flex-direction:column;
      background:transparent; border-top:1px solid rgba(20,19,15,.12); border-left:1px solid rgba(20,19,15,.12); }
    .dbc-pad { background: rgba(20,19,15,.025); }
    .dbc-num { font-size:.64rem; color: rgba(20,19,15,.6); font-weight:700; align-self:flex-end;
      padding:1px 2px; line-height:1; }
    .dbc-today .dbc-num { background:#e07a5f; color:#fff; border-radius:999px; min-width:17px; height:17px;
      display:inline-flex; align-items:center; justify-content:center; padding:0; }
    .dbc-drop { cursor:pointer; }
    .dbc-over { background: rgba(255,255,255,.5); box-shadow: inset 0 0 0 2px #6fb7e8; }
    .dbc-notes { display:flex; flex-direction:column; gap:5px; margin-top:2px; }

    /* Each event is a little push-pinned sticky note. */
    .dbc-note { position:relative; display:block; background:var(--n,#ffe27a); color:#14130f;
      border-radius:3px; padding:10px 5px 4px; font-size:.56rem; line-height:1.2; cursor:pointer;
      transform: rotate(var(--tilt,0deg)); transform-origin:50% 0;
      box-shadow: 0 1px 2px rgba(20,19,15,.22), inset 0 0 0 .5px rgba(255,255,255,.25);
      transition: transform .12s ease, box-shadow .12s ease; }
    .dbc-note:hover, .dbc-note:focus-visible { transform: rotate(0deg) scale(1.04); outline:none;
      box-shadow: 0 4px 10px rgba(20,19,15,.28); z-index:3; }
    .dbc-pin { position:absolute; top:-5px; left:50%; transform:translateX(-50%); line-height:0;
      filter: drop-shadow(0 1px 1px rgba(20,19,15,.3)); }
    .dbc-note-time { display:block; font-weight:700; font-size:.5rem; opacity:.75; }
    .dbc-note-t { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dbc-more { font-size:.54rem; color: rgba(20,19,15,.6); padding-left:2px; }

    /* Hover / click details popover (its own little pinned note). */
    .dbc-pop { position:fixed; z-index:100003; width:210px; background:#fffdf8; color:#2a2723;
      border-radius:8px; padding:16px 14px 13px; font-family: var(--font-mono, monospace);
      box-shadow: 0 12px 32px rgba(20,19,15,.3); }
    .dbc-pop-pin { position:absolute; top:-7px; left:50%; transform:translateX(-50%); line-height:0;
      filter: drop-shadow(0 1px 1px rgba(20,19,15,.3)); }
    .dbc-pop-bar { height:5px; border-radius:999px; margin:0 0 9px; }
    .dbc-pop-title { font-family: var(--font-display, sans-serif); font-size:.95rem; margin:0 0 .25rem; color:#14130f; }
    .dbc-pop-when { font-size:.68rem; color: var(--text-secondary,#6b655c); margin:0 0 .55rem; font-weight:700; }
    .dbc-pop-list { margin:0; display:grid; gap:.3rem; }
    .dbc-pop-row { display:grid; grid-template-columns: 64px 1fr; gap:.4rem; align-items:baseline; }
    .dbc-pop-row dt { font-size:.6rem; text-transform:uppercase; letter-spacing:.04em; color: var(--text-tertiary,#9a948a); margin:0; }
    .dbc-pop-row dd { font-size:.72rem; color:#2a2723; margin:0; word-break:break-word; }
    .dbc-pop-notes { font-size:.7rem; color: var(--text-secondary,#6b655c); margin:.6rem 0 0; line-height:1.4;
      border-top:1px dashed rgba(20,19,15,.16); padding-top:.5rem; white-space:pre-wrap; }
    .dbc-pop-del { margin-top:.7rem; width:100%; padding:.4rem; border-radius:8px; cursor:pointer;
      font-family:inherit; font-size:.66rem; border:1px solid rgba(224,122,95,.5);
      background: rgba(224,122,95,.12); color:#b9543c; }
    .dbc-pop-del:hover { background: rgba(224,122,95,.2); }

    /* Admin teacher palette. */
    .dbc-palette { margin-top:.8rem; padding-top:.7rem; border-top:1px dashed rgba(20,19,15,.2); }
    .dbc-palette-top { display:flex; align-items:center; justify-content:space-between; gap:.6rem; margin-bottom:.4rem; }
    .dbc-roster-btn { font-size:.62rem; padding:.28rem .7rem; border-radius:999px; cursor:pointer; white-space:nowrap;
      border:1px solid rgba(20,19,15,.25); background: rgba(255,255,255,.6); color:#14130f; font-family:inherit; }
    .dbc-roster-btn:hover { background: rgba(255,255,255,.9); }
    .dbc-palette-lbl { font-size:.62rem; color: rgba(20,19,15,.6); display:block; }
    .dbc-chips { display:flex; flex-wrap:wrap; gap:.4rem; }
    .dbc-teacher { font-size:.66rem; padding:.25rem .6rem; border-radius:999px; cursor:grab; user-select:none;
      background: var(--accent-secondary, #6fb7e8); color: var(--text-on-accent, #fff); box-shadow: var(--shadow-sm, 0 1px 3px rgba(42,39,35,.16)); }
    .dbc-teacher:active { cursor:grabbing; }
    .dbc-palette-empty { font-size:.66rem; color: rgba(20,19,15,.5); }

    /* Pin dialog. */
    .dbc-modal { position:fixed; inset:0; z-index:100002; display:flex; align-items:center; justify-content:center; padding:1rem; }
    .dbc-modal__bd { position:absolute; inset:0; background: rgba(42,39,35,.5); }
    .dbc-modal__card { position:relative; width:min(380px,100%); background: var(--surface-primary,#fffdf8); color: var(--ink,#2a2723);
      border: var(--border-subtle, 1px solid rgba(42,39,35,.14)); border-radius:16px; box-shadow: var(--shadow-xl, 0 18px 40px rgba(42,39,35,.2));
      padding:1.3rem; font-family: var(--font-mono, monospace); max-height:90vh; overflow:auto; }
    .dbc-modal__card h3 { font-family: var(--font-display, sans-serif); font-size:1.05rem; margin:0 0 .2rem; }
    .dbc-modal__sub { font-size:.68rem; color: var(--text-secondary,#6b655c); margin:0 0 .9rem; }
    .dbc-field { display:block; font-size:.66rem; color: var(--text-secondary,#6b655c); margin-bottom:.7rem; }
    .dbc-field-2 { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
    .dbc-field select, .dbc-field input, .dbc-field textarea { width:100%; box-sizing:border-box; margin-top:.25rem; padding:.5rem .6rem; border-radius:10px; font-family:inherit;
      font-size:.85rem; border: var(--border-subtle, 1px solid rgba(42,39,35,.16)); background: var(--surface-secondary,#f4f0e8); color: var(--ink,#2a2723); }
    .dbc-field textarea { resize:vertical; min-height:2.4em; }
    .dbc-roster-body { margin:.2rem 0 .9rem; }
    .dbc-rlist { display:flex; flex-direction:column; gap:.35rem; max-height:200px; overflow:auto; margin-bottom:.7rem; }
    .dbc-rrow { display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.4rem .6rem;
      border-radius:10px; background: var(--surface-secondary,#f4f0e8); font-size:.78rem; }
    .dbc-rname { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dbc-rx { border:none; background:transparent; color: var(--text-tertiary,#9a948a); cursor:pointer; font-size:1.1rem; line-height:1; padding:0 .2rem; }
    .dbc-rx:hover { color: var(--accent-danger,#e07a5f); }
    .dbc-radd { display:flex; gap:.5rem; }
    .dbc-radd select { flex:1; min-width:0; padding:.5rem .6rem; border-radius:10px; font-family:inherit; font-size:.8rem;
      border: var(--border-subtle, 1px solid rgba(42,39,35,.16)); background: var(--surface-secondary,#f4f0e8); color: var(--ink,#2a2723); }
    .dbc-radd .btn { white-space:nowrap; }
    .dbc-modal__row { display:flex; gap:.6rem; margin-top:.3rem; }
    .dbc-msg { font-size:.7rem; min-height:1em; margin:.6rem 0 0; color: var(--accent-danger,#e07a5f); }`;
  document.head.appendChild(s);
}
