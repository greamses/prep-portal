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
    .cc-msg--ok { color: var(--accent-success,#6db58f); }
    .cc-modal__card.cc-rev { width: min(680px,100%); max-height: 86vh; display:flex; flex-direction:column; padding:0; }
    .cc-rev__hd { display:flex; align-items:center; gap:.6rem; padding:1rem 1.2rem; border-bottom:1px dashed color-mix(in srgb, var(--ink) 14%, transparent); }
    .cc-rev__hd strong { font-family: var(--font-display,sans-serif); font-size:.95rem; flex:1; }
    .cc-rev__x { border:none; background:var(--surface-secondary,#f4f0e8); width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:1.2rem; line-height:1; color:var(--text-secondary); }
    .cc-rev__body { overflow-y:auto; padding:.8rem 1.2rem 1.2rem; }
    .cc-rev__sub { border:2px solid color-mix(in srgb, var(--ink) 12%, transparent); border-radius:12px; padding:.6rem .8rem; margin-bottom:.7rem; background:var(--surface-secondary,#f4f0e8); }
    .cc-rev__sub > summary { display:flex; align-items:center; gap:.6rem; cursor:pointer; list-style:none; font-size:.82rem; }
    .cc-rev__sub > summary::-webkit-details-marker { display:none; }
    .cc-rev__name { font-weight:700; flex:1; }
    .cc-rev__date { font-size:.66rem; color:var(--text-tertiary,#9a948a); }
    .cc-rev__q { border-top:1px dashed color-mix(in srgb, var(--ink) 12%, transparent); margin-top:.6rem; padding-top:.6rem; }
    .cc-rev__qh { display:flex; align-items:center; gap:.5rem; font-family:var(--font-display,sans-serif); font-weight:700; font-size:.74rem; }
    .cc-rev__qt { font-size:.82rem; margin:.3rem 0; }
    .cc-rev__lbl { font-size:.58rem; text-transform:uppercase; letter-spacing:.06em; color:var(--text-secondary); margin-top:.5rem; }
    .cc-rev__ans { font-family:"Caveat",cursive; font-size:1.05rem; background:var(--surface-primary,#fffdf8); border-radius:8px; padding:.4rem .6rem; margin-top:.2rem; }
    .cc-rev__fb { font-size:.78rem; line-height:1.5; color:var(--ink); }
    .cc-rev__missed { margin:.2rem 0 0; padding-left:1.1rem; font-size:.76rem; color:var(--text-secondary); }`;
  document.head.appendChild(s);
}

/* ════════════ STUDENT ════════════ */
export async function mountStudentClassroom(layout) {
  const joinBtn = layout.querySelector('[data-action="join-class"]');
  if (joinBtn) joinBtn.onclick = openJoin;
  const list = layout.querySelector("#db-asg-list");

  let assignments = [];
  if (list) {
    try {
      ({ assignments } = await api("/api/classroom/assignments"));
      list.innerHTML = assignments.length ? assignments.map(asgItem).join("")
        : `<div class="db-empty">No assignments yet. Join your teacher's class with a code.</div>`;
    } catch (e) {
      list.innerHTML = `<div class="db-empty">Couldn't load assignments.</div>`;
    }
  }
  fillStudentStats(layout, assignments);
}

async function fillStudentStats(layout, assignments) {
  if (!layout.querySelector("#db-st-ring")) return; // not the student progress panel
  const set = (id, v) => { const el = layout.querySelector("#" + id); if (el) el.textContent = v; };
  const setBar = (id, w) => { const el = layout.querySelector("#" + id); if (el) el.style.width = Math.max(0, Math.min(100, w)) + "%"; };

  // Completion ring from the assignment list.
  const assigned = assignments.length;
  const done = assignments.filter((a) => a.status === "submitted").length;
  const completion = assigned ? Math.round((done / assigned) * 100) : 0;
  const ring = layout.querySelector("#db-st-ring");
  if (ring) ring.style.setProperty("--ring-progress", completion);
  set("db-st-ring-val", completion + "%");
  set("db-st-done", `${done}/${assigned} done`);
  if (assignments[0]) set("db-st-focus", assignments[0].activityTitle || "Your activities");

  // Score / questions / subjects from the aggregate stats doc.
  try {
    const s = await api("/api/classroom/my-stats");
    set("db-st-acc-val", s.submissions ? s.accuracyPct + "%" : "—");
    setBar("db-st-acc-bar", s.accuracyPct);
    set("db-st-prob-val", Number(s.problemsSolved || 0).toLocaleString());
    setBar("db-st-prob-bar", Math.min(100, (s.problemsSolved || 0) * 4));
    const perf = layout.querySelector("#db-st-perf");
    if (perf && s.subjects && s.subjects.length) {
      perf.innerHTML = s.subjects.map((x) => `
        <div style="margin:.45rem 0">
          <div style="display:flex;justify-content:space-between;font-size:.72rem"><span>${esc(x.name)}</span><span>${x.pct}%</span></div>
          <div style="height:8px;background:var(--surface-secondary);border-radius:999px;overflow:hidden;margin-top:.25rem">
            <div style="height:100%;width:${x.pct}%;background:var(--accent-success)"></div>
          </div>
        </div>`).join("");
    }
  } catch (_) {}
}

function asgItem(a) {
  const isCbt = a.kind === "cbt";
  const done = a.status === "submitted";
  // CBT practice has no submission hook yet, so it just launches the test.
  const pill = isCbt
    ? `<span class="db-pill pill-blue">Practice</span>`
    : done
      ? `<span class="db-pill pill-green">${a.score != null ? `${a.score}/${a.totalMarks}` : "Done"}</span>`
      : `<span class="db-pill pill-yellow">To do</span>`;
  const href = isCbt ? a.cbtUrl : `/activity.html?a=${encodeURIComponent(a.shareSlug || a.id)}`;
  return `<a class="db-assign-item" href="${esc(href)}" style="text-decoration:none;color:inherit">
      <div class="db-assign-top">
        <div><div class="db-assign-title">${esc(a.activityTitle || (isCbt ? "Practice test" : "Activity"))}</div>
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
      setStat(layout, "db-stat-students", students.length);
    } catch (e) {
      roster.innerHTML = `<div class="db-empty">Couldn't load roster.</div>`;
    }
  }

  // Activities + real stat cards
  const acts = layout.querySelector("#db-activities");
  if (acts) {
    try {
      const { activities } = await api("/api/activities/mine");
      acts.innerHTML = activities.length ? activities.map(actItem).join("")
        : `<div class="db-empty">No activities yet. Build one on the Theory page and "Save &amp; assign".</div>`;
      acts.querySelectorAll('[data-assign]').forEach((b) => b.onclick = () => assignActivity(b.dataset.assign, b));
      acts.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => { navigator.clipboard.writeText(`${location.origin}/activity.html?a=${b.dataset.copy}`); b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy link"), 1400); });
      acts.querySelectorAll('[data-review]').forEach((b) => b.onclick = () => reviewActivity(b.dataset.review));
      const subs = activities.reduce((n, a) => n + (a.submissionCount || 0), 0);
      setStat(layout, "db-stat-activities", activities.length);
      setStat(layout, "db-stat-subs", subs);
    } catch (e) {
      acts.innerHTML = `<div class="db-empty">Couldn't load activities.</div>`;
    }
  }
}

function setStat(layout, id, val) { const el = layout.querySelector("#" + id); if (el) el.textContent = val; }

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
        ${(a.submissionCount || 0) > 0 ? `<button class="db-pill pill-green" type="button" data-review="${a.id}" style="border:none;cursor:pointer">Review ${a.submissionCount}</button>` : ""}
        <button class="db-pill pill-grey" type="button" data-copy="${esc(a.shareSlug)}" style="border:none;cursor:pointer">Copy link</button>
      </div>
    </div>`;
}

/* ── Submission review (teacher) ── */
async function reviewActivity(activityId) {
  const { root, close } = reviewModal(`<div class="cc-rev__hd"><strong>Loading submissions…</strong>
    <button class="cc-rev__x" type="button" aria-label="Close">&times;</button></div><div class="cc-rev__body"></div>`);
  root.querySelector(".cc-rev__x").onclick = close;
  try {
    const { activity, submissions } = await api(`/api/activities/${encodeURIComponent(activityId)}/submissions`);
    root.querySelector(".cc-rev__hd strong").textContent = `${activity.title} — ${submissions.length} submission${submissions.length === 1 ? "" : "s"}`;
    root.querySelector(".cc-rev__body").innerHTML = submissions.length
      ? submissions.map((s) => subCard(s, activity)).join("")
      : `<div class="db-empty">No submissions yet.</div>`;
  } catch (e) {
    root.querySelector(".cc-rev__body").innerHTML = `<div class="db-empty">Couldn't load: ${esc(e.message)}</div>`;
  }
}

function subCard(s, activity) {
  const m = s.marked || {};
  const qs = Array.isArray(m.questions) ? m.questions : [];
  const score = (s.score != null ? s.score : m.totalScore);
  const total = (s.totalMarks != null ? s.totalMarks : m.totalMax);
  const when = s.submittedAt && s.submittedAt._seconds ? new Date(s.submittedAt._seconds * 1000).toLocaleDateString("en-NG") : "";
  const perQ = (activity.questions || []).map((q, i) => {
    const md = qs[i] || {};
    const ans = (s.answers && s.answers[i] && s.answers[i].text) || "";
    const missed = (md.missedPoints || []).filter(Boolean);
    return `<div class="cc-rev__q">
        <div class="cc-rev__qh"><span>Q${i + 1}</span>${md.maxMarks != null ? `<span class="db-pill pill-blue">${md.totalScore ?? 0}/${md.maxMarks}</span>` : ""}</div>
        <div class="cc-rev__qt">${q.text}</div>
        <div class="cc-rev__lbl">Answer</div><div class="cc-rev__ans">${ans || "<em>(blank)</em>"}</div>
        ${md.feedback ? `<div class="cc-rev__lbl">Feedback</div><div class="cc-rev__fb">${esc(md.feedback)}</div>` : ""}
        ${missed.length ? `<div class="cc-rev__lbl">Missed</div><ul class="cc-rev__missed">${missed.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      </div>`;
  }).join("");
  return `<details class="cc-rev__sub">
      <summary><span class="cc-rev__name">${esc(s.studentName || "Student")}</span>
        <span class="db-pill ${total && score / total >= 0.5 ? "pill-green" : "pill-yellow"}">${score != null ? `${score}/${total}` : "—"}</span>
        <span class="cc-rev__date">${when}</span></summary>
      ${m.overallFeedback ? `<div class="cc-rev__fb" style="margin:.5rem 0">${esc(m.overallFeedback)}</div>` : ""}
      ${perQ}
    </details>`;
}

function reviewModal(html) {
  injectStyles();
  const root = document.createElement("div");
  root.className = "cc-modal";
  root.innerHTML = `<div class="cc-modal__bd"></div><div class="cc-modal__card cc-rev">${html}</div>`;
  document.body.appendChild(root);
  const close = () => root.remove();
  root.querySelector(".cc-modal__bd").onclick = close;
  return { root, close };
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
