/* ============================================================================
   My classes — a teacher's (or the administrator's) class manager
   ----------------------------------------------------------------------------
   Groups, and the students in them: add one by email, move some to another
   group, take some out. The administrator picks whose class to manage, and
   also sees every task so the old ones can be deleted.

   Everything is the server's decision (/api/classes): this page only asks.
   ========================================================================== */

import { api } from "/utils/components/workbook/account.js";
import { faceOf } from "/utils/components/workbook/icons.js";
import { UI } from "/utils/components/ui-icons.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let ov = null;            // the overview
let teacherUid = "";      // the class being managed (the administrator may change it)
let filter = "all";       // "all" | "none" | a group id
const picked = new Set();
const pickedTasks = new Set();
let tasks = [];

const say = (t, bad = false) => { const m = $("cl-msg"); m.textContent = t; m.classList.toggle("is-bad", bad); };
const who = () => (teacherUid ? { teacherUid } : {});
const query = () => (teacherUid ? `?teacherUid=${encodeURIComponent(teacherUid)}` : "");
const groupName = (id) => (ov.groups.find((g) => g.id === id) || {}).name || "";

/* two presses to do something that cannot be undone: the first arms the button (its tooltip says so) */
const armed = new WeakMap();
function twice(btn, label, armedLabel, run) {
  btn.addEventListener("click", () => {
    if (!armed.get(btn)) {
      armed.set(btn, setTimeout(() => { armed.delete(btn); btn.classList.remove("is-armed"); faceOf(btn, btn.__glyph, label); }, 4000));
      btn.classList.add("is-armed"); faceOf(btn, btn.__glyph, armedLabel);
      return;
    }
    clearTimeout(armed.get(btn)); armed.delete(btn); btn.classList.remove("is-armed"); faceOf(btn, btn.__glyph, label);
    run();
  });
}

/* ── draw ──────────────────────────────────────────────────────────────── */

function groupOptions(withNone, noneLabel) {
  return (withNone ? `<option value="">${noneLabel}</option>` : "") + ov.groups.map((g) => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join("");
}

function drawChips() {
  const ungrouped = ov.students.filter((s) => !s.groupId).length;
  const chip = (id, label, n) => `<button type="button" class="cl-chip${filter === id ? " is-on" : ""}" data-f="${esc(id)}" role="tab" aria-selected="${filter === id}">${esc(label)} <b>${n}</b></button>`;
  $("cl-chips").innerHTML = chip("all", "Everyone", ov.students.length)
    + ov.groups.map((g) => chip(g.id, g.name, g.count)).join("")
    + (ov.groups.length ? chip("none", "No group", ungrouped) : "");
  const real = ov.groups.some((g) => g.id === filter);
  $("cl-rename").hidden = !real; $("cl-delgroup").hidden = !real;
  $("cl-addto").innerHTML = groupOptions(true, "No group");
  $("cl-moveto").innerHTML = groupOptions(true, "No group");
  if (real) $("cl-addto").value = filter;
}

function shown() {
  return ov.students.filter((s) => filter === "all" || (filter === "none" ? !s.groupId : s.groupId === filter));
}

function drawStudents() {
  const list = shown();
  $("cl-rows").innerHTML = list.map((s) => `<tr data-u="${esc(s.uid)}">`
    + `<td><input type="checkbox" class="cl-pick" ${picked.has(s.uid) ? "checked" : ""} aria-label="Select ${esc(s.name)}" /></td>`
    + `<th scope="row">${esc(s.name)}</th><td class="cl-mail">${esc(s.email || "")}</td>`
    + `<td><select class="cl-grp" aria-label="Group for ${esc(s.name)}">${groupOptions(true, "No group")}</select></td>`
    + `<td><button type="button" class="pp-btn cl-x" data-u="${esc(s.uid)}"></button></td></tr>`).join("");
  $("cl-rows").querySelectorAll("tr").forEach((tr) => {
    const s = ov.students.find((x) => x.uid === tr.dataset.u);
    tr.querySelector(".cl-grp").value = s.groupId || "";
    const x = tr.querySelector(".cl-x");
    faceOf(x, UI.trash(16), `Take ${s.name} out of the class`);
  });
  $("cl-none").hidden = list.length > 0;
  $("cl-all").checked = list.length > 0 && list.every((s) => picked.has(s.uid));
  const n = [...picked].filter((u) => ov.students.some((s) => s.uid === u)).length;
  $("cl-bulk").hidden = !n;
  $("cl-picked").textContent = `${n} selected`;
}

function drawTasks() {
  $("cl-trows").innerHTML = tasks.map((t) => `<tr>`
    + `<td><input type="checkbox" class="cl-tpick" data-k="${esc(t.kind)}:${esc(t.code)}" ${pickedTasks.has(`${t.kind}:${t.code}`) ? "checked" : ""} aria-label="Select ${esc(t.title)}" /></td>`
    + `<th scope="row">${esc(t.title)}</th><td>${t.kind === "paper" ? "Paper" : "Workbook"}</td><td>${esc(t.owner)}</td><td>${t.students}</td>`
    + `<td>${t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "long ago"}</td></tr>`).join("");
  $("cl-tnone").hidden = tasks.length > 0;
  $("cl-tdel").hidden = !tasks.length;
  $("cl-tall").checked = tasks.length > 0 && tasks.every((t) => pickedTasks.has(`${t.kind}:${t.code}`));
  const n = pickedTasks.size;
  faceOf($("cl-tdel"), UI.trash(18), n ? `Delete the ${n} selected` : "Delete the selected tasks");
  $("cl-tdel").__glyph = UI.trash(18);
  $("cl-tdel").disabled = !n;
}

function draw() {
  drawChips(); drawStudents();
  if (ov.code) { $("cl-code").hidden = false; $("cl-code-v").textContent = ov.code; } else $("cl-code").hidden = true;
}

/* ── load ──────────────────────────────────────────────────────────────── */

async function load(keep = true) {
  try {
    ov = await api(`/api/classes/overview${query()}`);
  } catch (e) {
    $("cl-body").hidden = true;
    say(/teacher|class/i.test(String((e && e.message) || "")) ? "This page is for teachers." : String((e && e.message) || "Could not load the class."), true);
    return;
  }
  teacherUid = teacherUid || ov.teacherUid;
  if (!keep) { picked.clear(); filter = "all"; }
  if (!ov.groups.some((g) => g.id === filter) && filter !== "all" && filter !== "none") filter = "all";
  [...picked].forEach((u) => { if (!ov.students.some((s) => s.uid === u)) picked.delete(u); });
  $("cl-body").hidden = false;
  say(ov.students.length ? "" : "Your class is empty.");
  if (ov.admin && ov.teachers) {
    $("cl-admin").hidden = false;
    const mine = ov.teachers.some((t) => t.uid === teacherUid) ? "" : `<option value="${esc(teacherUid)}">${esc(ov.teacherName || "This class")}</option>`;
    $("cl-teacher").innerHTML = mine + ov.teachers.map((t) => `<option value="${esc(t.uid)}">${esc(t.name)}</option>`).join("");
    $("cl-teacher").value = teacherUid;
    $("cl-tasks").hidden = false;
    loadTasks();
  }
  draw();
}

async function loadTasks() {
  try {
    const d = await api(`/api/classes/tasks?older=${encodeURIComponent($("cl-older").value)}`);
    tasks = d.tasks;
    [...pickedTasks].forEach((k) => { if (!tasks.some((t) => `${t.kind}:${t.code}` === k)) pickedTasks.delete(k); });
    drawTasks();
  } catch (e) { say(String((e && e.message) || "Could not list the tasks."), true); }
}

async function act(path, body, method = "POST", done = "") {
  try {
    const r = await api(path, { ...who(), ...body }, method);
    if (done) say(typeof done === "function" ? done(r) : done);
    await load();
    return r;
  } catch (e) { say(String((e && e.message) || e).slice(0, 200), true); return null; }
}

/* ── events ────────────────────────────────────────────────────────────── */

faceOf($("cl-addgroup"), UI.plus(18), "Make the group");
faceOf($("cl-rename"), UI.edit(18), "Rename this group");
faceOf($("cl-delgroup"), UI.trash(18), "Delete this group (its students stay in the class)");
faceOf($("cl-add"), UI.userPlus(18), "Add the student");
faceOf($("cl-move"), UI.arrowRight(18), "Move the selected students");
faceOf($("cl-remove"), UI.trash(18), "Take the selected students out of the class");
$("cl-delgroup").__glyph = UI.trash(18); $("cl-remove").__glyph = UI.trash(18);

$("cl-chips").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; filter = b.dataset.f; draw(); });
$("cl-teacher").addEventListener("change", (e) => { teacherUid = e.target.value; picked.clear(); filter = "all"; load(false); });
$("cl-older").addEventListener("change", loadTasks);

$("cl-addgroup").addEventListener("click", async () => {
  const name = $("cl-newgroup").value.trim();
  if (!name) { say("Give the group a name.", true); return; }
  const r = await act("/api/classes/groups", { name }, "POST", `Made ${name}.`);
  if (r) { $("cl-newgroup").value = ""; filter = r.id; draw(); }
});
$("cl-newgroup").addEventListener("keydown", (e) => { if (e.key === "Enter") $("cl-addgroup").click(); });
$("cl-rename").addEventListener("click", async () => {
  const name = $("cl-newgroup").value.trim();
  if (!name) { say("Type the new name in the box first, then press rename.", true); return; }
  if ($("cl-newgroup").value && (await act(`/api/classes/groups/${encodeURIComponent(filter)}`, { name }, "PATCH", "Renamed."))) $("cl-newgroup").value = "";
});
twice($("cl-delgroup"), "Delete this group (its students stay in the class)", "Press again to delete the group",
  () => act(`/api/classes/groups/${encodeURIComponent(filter)}`, {}, "DELETE", (r) => `Group deleted. ${r.ungrouped} student${r.ungrouped === 1 ? "" : "s"} now have no group.`));

$("cl-add").addEventListener("click", async () => {
  const email = $("cl-email").value.trim();
  if (!email) { say("Type the student's email address.", true); return; }
  if (await act("/api/classes/students/add", { email, groupId: $("cl-addto").value || null }, "POST", "Added to the class.")) $("cl-email").value = "";
});
$("cl-email").addEventListener("keydown", (e) => { if (e.key === "Enter") $("cl-add").click(); });

$("cl-rows").addEventListener("change", (e) => {
  const tr = e.target.closest("tr"); if (!tr) return;
  if (e.target.classList.contains("cl-pick")) { e.target.checked ? picked.add(tr.dataset.u) : picked.delete(tr.dataset.u); drawStudents(); return; }
  if (e.target.classList.contains("cl-grp")) act("/api/classes/students/move", { uids: [tr.dataset.u], groupId: e.target.value || null }, "POST", "Moved.");
});
$("cl-rows").addEventListener("click", (e) => {
  const x = e.target.closest(".cl-x"); if (!x) return;
  if (!x.classList.contains("is-armed")) {
    x.classList.add("is-armed"); const name = ov.students.find((s) => s.uid === x.dataset.u).name; faceOf(x, UI.trash(16), `Press again to take ${name} out`);
    setTimeout(() => { if (x.isConnected) { x.classList.remove("is-armed"); faceOf(x, UI.trash(16), `Take ${name} out of the class`); } }, 4000);
    return;
  }
  act("/api/classes/students/remove", { uids: [x.dataset.u] }, "POST", "Taken out of the class.");
});
$("cl-all").addEventListener("change", (e) => { shown().forEach((s) => (e.target.checked ? picked.add(s.uid) : picked.delete(s.uid))); drawStudents(); });
$("cl-move").addEventListener("click", () => act("/api/classes/students/move", { uids: [...picked], groupId: $("cl-moveto").value || null }, "POST", (r) => `Moved ${r.moved}.`));
twice($("cl-remove"), "Take the selected students out of the class", "Press again to take them out",
  () => act("/api/classes/students/remove", { uids: [...picked] }, "POST", (r) => { picked.clear(); return `Took ${r.removed} out of the class.`; }));

$("cl-trows").addEventListener("change", (e) => {
  const k = e.target.dataset.k; if (!k) return;
  e.target.checked ? pickedTasks.add(k) : pickedTasks.delete(k); drawTasks();
});
$("cl-tall").addEventListener("change", (e) => { tasks.forEach((t) => (e.target.checked ? pickedTasks.add(`${t.kind}:${t.code}`) : pickedTasks.delete(`${t.kind}:${t.code}`))); drawTasks(); });
$("cl-tdel").__glyph = UI.trash(18);
twice($("cl-tdel"), "Delete the selected tasks", "Press again to delete them for good", async () => {
  const list = [...pickedTasks].map((k) => { const [kind, code] = k.split(":"); return { kind, code }; });
  try {
    const r = await api("/api/classes/tasks", { tasks: list }, "DELETE");
    pickedTasks.clear();
    say(`Deleted ${r.removed} task${r.removed === 1 ? "" : "s"}.`);
    await loadTasks();
  } catch (e) { say(String((e && e.message) || e).slice(0, 200), true); }
});

load();
