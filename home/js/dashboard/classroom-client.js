/* ════════════════════════════════════════════════════
   classroom-client.js
   Dashboard glue for the activities/classroom feature: fills the teacher
   roster + activities panels and the student "assigned to me" panel from the
   server API. Kept self-contained so the panels just call mount*() after they
   render their shell.
   ════════════════════════════════════════════════════ */
import { auth } from "/firebase-init.js";

const API = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";

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

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ── tiny on-brand modal ── */
function modal(html) {
  const root = document.createElement("div");
  root.className = "cc-modal";
  root.innerHTML = `<div class="cc-modal__bd"></div><div class="cc-modal__card">${html}</div>`;
  document.body.appendChild(root);
  injectStyles();
  const close = () => root.remove();
  root.querySelector(".cc-modal__bd").onclick = close;
  return { root, close };
}
function injectStyles() {
  if (document.getElementById("cc-modal-styles")) return;
  const s = document.createElement("style");
  s.id = "cc-modal-styles";
  s.textContent = `
    .cc-modal { position: fixed; inset: 0; z-index: 100001; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .cc-modal__bd { position: absolute; inset: 0; background: rgba(42,39,35,.5); }
    .cc-modal__card { position: relative; width: min(420px,100%); background: var(--surface-primary,#fffdf8);
      color: var(--ink,#2a2723); border: 2px solid color-mix(in srgb, var(--ink) 14%, transparent); border-radius: 18px;
      box-shadow: var(--shadow-xl,0 18px 40px rgba(42,39,35,.18)); padding: 1.4rem; font-family: var(--font-mono,monospace); }
    .cc-modal__card h3 { font-family: var(--font-display,sans-serif); font-size: 1.05rem; margin: 0 0 .6rem; }
    .cc-code { font-family: var(--font-display,sans-serif); font-weight: 900; font-size: 1.8rem; letter-spacing: .14em;
      color: var(--accent-secondary,#6fb7e8); text-align: center; padding: .6rem; background: var(--surface-secondary,#f4f0e8); border-radius: 12px; }
    .cc-modal__card input { width:100%; box-sizing:border-box; padding:.6rem .75rem; border-radius:10px; font-family:inherit;
      font-size:.9rem; border:2px solid color-mix(in srgb, var(--ink) 14%, transparent); background: var(--surface-secondary,#f4f0e8); color: var(--ink,#2a2723); text-transform: uppercase; letter-spacing:.1em; }
    .cc-row { display:flex; gap:.6rem; margin-top:1rem; }
    .cc-msg { font-size:.74rem; margin-top:.6rem; min-height:1em; color: var(--text-secondary,#6b655c); }
    .cc-msg--err { color: var(--accent-danger,#e07a5f); }
    .cc-msg--ok { color: var(--accent-success,#6db58f); }`;
  document.head.appendChild(s);
}

/* ════════════ STUDENT ════════════ */
export async function mountStudentClassroom(layout) {
  const joinBtn = layout.querySelector('[data-action="join-class"]');
  if (joinBtn) joinBtn.onclick = openJoin;
  const list = layout.querySelector("#db-asg-list");
  if (!list) return;
  try {
    const { assignments } = await api("/api/classroom/assignments");
    list.innerHTML = assignments.length ? assignments.map(asgItem).join("")
      : `<div class="db-empty">No assignments yet. Join your teacher's class with a code.</div>`;
  } catch (e) {
    list.innerHTML = `<div class="db-empty">Couldn't load assignments.</div>`;
  }
}

function asgItem(a) {
  const done = a.status === "submitted";
  const pill = done
    ? `<span class="db-pill pill-green">${a.score != null ? `${a.score}/${a.totalMarks}` : "Done"}</span>`
    : `<span class="db-pill pill-yellow">To do</span>`;
  return `<a class="db-assign-item" href="/activity.html?a=${encodeURIComponent(a.shareSlug || a.id)}" style="text-decoration:none;color:inherit">
      <div class="db-assign-top">
        <div><div class="db-assign-title">${esc(a.activityTitle || "Activity")}</div>
        <div class="db-assign-meta">${esc([a.subject, a.teacherName].filter(Boolean).join(" · "))}</div></div>
        ${pill}
      </div>
    </a>`;
}

function openJoin() {
  const { root, close } = modal(`
    <h3>Join a class</h3>
    <p class="cc-msg">Enter the code your teacher gave you.</p>
    <input id="cc-join-code" type="text" maxlength="8" placeholder="e.g. JLUHN9" />
    <div class="cc-row">
      <button class="btn btn-yellow" id="cc-join-go" type="button">Join</button>
      <button class="btn btn-ghost" id="cc-join-cancel" type="button">Cancel</button>
    </div>
    <p id="cc-join-msg" class="cc-msg"></p>`);
  root.querySelector("#cc-join-cancel").onclick = close;
  root.querySelector("#cc-join-go").onclick = async () => {
    const code = root.querySelector("#cc-join-code").value.trim().toUpperCase();
    const msg = root.querySelector("#cc-join-msg");
    if (!code) { msg.textContent = "Enter a code."; msg.className = "cc-msg cc-msg--err"; return; }
    msg.textContent = "Joining…"; msg.className = "cc-msg";
    try {
      const d = await api("/api/classroom/join", { method: "POST", body: JSON.stringify({ code }) });
      msg.textContent = `Joined ${d.teacherName}'s class!`; msg.className = "cc-msg cc-msg--ok";
      const list = document.querySelector("#db-asg-list");
      if (list) { const { assignments } = await api("/api/classroom/assignments"); list.innerHTML = assignments.length ? assignments.map(asgItem).join("") : `<div class="db-empty">No assignments yet.</div>`; }
      setTimeout(close, 1100);
    } catch (e) { msg.textContent = e.message; msg.className = "cc-msg cc-msg--err"; }
  };
}

/* ════════════ TEACHER ════════════ */
export async function mountTeacherClassroom(layout) {
  const addBtn = layout.querySelector('[data-action="add-student"]');
  if (addBtn) addBtn.onclick = showClassCode;

  // Roster
  const roster = layout.querySelector("#db-roster");
  if (roster) {
    try {
      const { code, students } = await api("/api/classroom/roster");
      window.__ccRoster = students || [];
      const codeEl = layout.querySelector("#db-class-code");
      if (codeEl) codeEl.textContent = code ? `Code: ${code}` : "No code yet — tap +";
      roster.innerHTML = students.length ? students.map(rosterItem).join("")
        : `<div class="db-empty">No students yet. Share your class code (tap +).</div>`;
    } catch (e) {
      roster.innerHTML = `<div class="db-empty">Couldn't load roster.</div>`;
    }
  }

  // Activities
  const acts = layout.querySelector("#db-activities");
  if (acts) {
    try {
      const { activities } = await api("/api/activities/mine");
      acts.innerHTML = activities.length ? activities.map(actItem).join("")
        : `<div class="db-empty">No activities yet. Build one on the Theory page and "Save &amp; assign".</div>`;
      acts.querySelectorAll('[data-assign]').forEach((b) => b.onclick = () => assignActivity(b.dataset.assign, b));
      acts.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => { navigator.clipboard.writeText(`${location.origin}/activity.html?a=${b.dataset.copy}`); b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy link"), 1400); });
    } catch (e) {
      acts.innerHTML = `<div class="db-empty">Couldn't load activities.</div>`;
    }
  }
}

function rosterItem(s) {
  return `<li class="db-roster-item">
      <div class="db-roster-avatar">${(s.name || "S").slice(0, 1).toUpperCase()}</div>
      <div><div class="db-roster-name">${esc(s.name || "Student")}</div>
      <div class="db-roster-sub">${esc(s.email || "")}</div></div>
    </li>`;
}

function actItem(a) {
  return `<div class="db-assign-item">
      <div class="db-assign-top">
        <div><div class="db-assign-title">${esc(a.title)}</div>
        <div class="db-assign-meta">${a.questionCount} Q · ${a.submissionCount || 0} submitted</div></div>
      </div>
      <div class="db-assign-progress-row" style="gap:.5rem;flex-wrap:wrap">
        <button class="db-pill pill-blue" type="button" data-assign="${a.id}" style="border:none;cursor:pointer">Assign to class</button>
        <button class="db-pill pill-grey" type="button" data-copy="${esc(a.shareSlug)}" style="border:none;cursor:pointer">Copy link</button>
      </div>
    </div>`;
}

async function assignActivity(activityId, btn) {
  const roster = window.__ccRoster || [];
  if (!roster.length) { showClassCode(); return; }
  btn.disabled = true; const orig = btn.textContent; btn.textContent = "Assigning…";
  try {
    const d = await api("/api/classroom/assign", { method: "POST", body: JSON.stringify({ activityId, all: true }) });
    btn.textContent = `Assigned to ${d.assigned}`;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1600);
  } catch (e) { btn.textContent = "Failed"; setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1600); }
}

async function showClassCode() {
  const { root, close } = modal(`<h3>Your class code</h3>
    <p class="cc-msg">Share this with students so they can join your class and receive your activities.</p>
    <div class="cc-code" id="cc-code-val">…</div>
    <div class="cc-row"><button class="btn btn-yellow" id="cc-code-copy" type="button">Copy code</button>
      <button class="btn btn-ghost" id="cc-code-done" type="button">Done</button></div>
    <p id="cc-code-msg" class="cc-msg"></p>`);
  root.querySelector("#cc-code-done").onclick = close;
  const val = root.querySelector("#cc-code-val");
  try {
    const d = await api("/api/classroom/class-code", { method: "POST", body: "{}" });
    val.textContent = d.code;
    root.querySelector("#cc-code-copy").onclick = async () => {
      try { await navigator.clipboard.writeText(d.code); root.querySelector("#cc-code-msg").textContent = "Copied!"; root.querySelector("#cc-code-msg").className = "cc-msg cc-msg--ok"; } catch (_) {}
    };
  } catch (e) {
    val.textContent = "—"; root.querySelector("#cc-code-msg").textContent = e.message; root.querySelector("#cc-code-msg").className = "cc-msg cc-msg--err";
  }
}
