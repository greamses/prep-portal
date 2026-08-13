/* ════════════════════════════════════════════════════
   admin-library.js
   THE ACTIVITY LIBRARY, and putting one in front of a class.

   A teacher's dashboard shows the activities that teacher built, and the
   Assign button on each one means "to my class" — there is only one class it
   could mean. An admin has neither: they did not build the activities and
   they do not have a class. What they have is the whole shelf, and the reason
   to look at it is to hand something on it to somebody else's students. A
   library you can only read is a catalogue.

   So this panel lists EVERY teacher's activities (GET /api/activities/library,
   admin-only) and the Assign button asks which class first
   (GET /api/classroom/teachers), then posts /api/classroom/assign with that
   teacher's uid. The server is where that permission actually lives: only an
   admin may name a teacher other than themselves, and a teacher who tries
   gets a 403 rather than a silent fallback to their own class.

   The assignment is filed under the OWNING teacher's name, not the admin's —
   the student's list answers "who set me this", and the site administrator is
   not the answer. Who pressed the button is kept as assignedByUid.
   ════════════════════════════════════════════════════ */
import { api, esc, modal } from "/home/js/dashboard/classroom-client.js";

let teachers = null;   // cached for the session: it is a picker, not a feed

export async function mountAdminLibrary(layout) {
  const host = layout.querySelector("#db-library");
  if (!host) return;
  injectStyles();

  let activities = [];
  try {
    ({ activities } = await api("/api/activities/library"));
  } catch (e) {
    host.innerHTML = `<div class="db-empty">Couldn't load the library: ${esc(e.message)}</div>`;
    return;
  }

  if (!activities.length) {
    host.innerHTML = `<div class="db-empty">No activities have been built yet. Teachers make them on the Theory page with "Save &amp; assign".</div>`;
    return;
  }

  host.innerHTML = activities.map(item).join("");
  host.querySelectorAll("[data-assign]").forEach((b) => {
    b.onclick = () => openClassPicker(b.dataset.assign, b.dataset.title);
  });
  host.querySelectorAll("[data-copy]").forEach((b) => {
    b.onclick = async () => {
      try {
        await navigator.clipboard.writeText(`${location.origin}/activity.html?a=${b.dataset.copy}`);
        b.textContent = "Copied";
        setTimeout(() => (b.textContent = "Copy link"), 1400);
      } catch (_) { /* clipboard refused — the link is still on the activity page */ }
    };
  });
}

function item(a) {
  const meta = [
    a.ownerName ? `by ${a.ownerName}` : null,
    a.subject,
    `${a.questionCount} Q`,
    `${a.submissionCount || 0} submitted`,
  ].filter(Boolean).join(" · ");
  return `<div class="db-assign-item">
      <div class="db-assign-top">
        <div>
          <div class="db-assign-title">${esc(a.title)}</div>
          <div class="db-assign-meta">${esc(meta)}</div>
        </div>
      </div>
      <div class="db-assign-progress-row" style="gap:.5rem;flex-wrap:wrap">
        <button class="db-pill pill-blue" type="button" style="border:none;cursor:pointer"
                data-assign="${esc(a.id)}" data-title="${esc(a.title)}">Assign to a class</button>
        <button class="db-pill pill-grey" type="button" style="border:none;cursor:pointer"
                data-copy="${esc(a.shareSlug)}">Copy link</button>
      </div>
    </div>`;
}

/* ── Which class? ────────────────────────────────────
   Whole classes only. Picking individual students would mean reading another
   teacher's roster into this page, and "give 9B this activity" is the thing
   an admin actually wants to do — a class is the unit the library hands out
   in. A teacher who wants a subset already has that on their own dashboard. */
async function openClassPicker(activityId, title) {
  const { root, close } = modal(`
    <h3>Assign to a class</h3>
    <p class="al-sub">${esc(title || "This activity")}</p>
    <div class="al-list" id="al-list"><p class="cc-msg">Loading classes…</p></div>
    <p class="cc-msg" id="al-msg"></p>
    <div class="cc-row">
      <button class="btn btn-yellow" id="al-go" type="button" disabled>Assign</button>
      <button class="btn btn-ghost" id="al-cancel" type="button">Cancel</button>
    </div>`);

  const list = root.querySelector("#al-list");
  const msg = root.querySelector("#al-msg");
  const go = root.querySelector("#al-go");
  root.querySelector("#al-cancel").onclick = close;

  try {
    if (!teachers) ({ teachers } = await api("/api/classroom/teachers"));
  } catch (e) {
    list.innerHTML = `<p class="cc-msg cc-msg--err">Couldn't load the classes: ${esc(e.message)}</p>`;
    return;
  }

  const withStudents = teachers.filter((t) => t.students > 0);
  if (!withStudents.length) {
    list.innerHTML = `<p class="cc-msg">No class has any students in it yet. A class fills up when students join with its code.</p>`;
    return;
  }

  list.innerHTML = withStudents.map((t) => `
    <label class="al-teacher">
      <input type="radio" name="al-teacher" value="${esc(t.uid)}" />
      <span class="al-teacher__name">${esc(t.name)}</span>
      <span class="al-teacher__meta">${t.students} student${t.students === 1 ? "" : "s"}${t.code ? ` · ${esc(t.code)}` : ""}</span>
    </label>`).join("");

  // Empty classes are listed after the pickable ones rather than hidden, so an
  // admin looking for a class that is not there can see it exists and is empty.
  const empties = teachers.filter((t) => !t.students);
  if (empties.length) {
    list.insertAdjacentHTML("beforeend",
      `<p class="cc-msg">${empties.length} other class${empties.length === 1 ? " has" : "es have"} no students yet.</p>`);
  }

  list.querySelectorAll('input[name="al-teacher"]').forEach((r) => {
    r.onchange = () => { go.disabled = false; };
  });

  go.onclick = async () => {
    const uid = list.querySelector('input[name="al-teacher"]:checked')?.value;
    if (!uid) return;
    go.disabled = true;
    msg.className = "cc-msg";
    msg.textContent = "Assigning…";
    try {
      const d = await api("/api/classroom/assign", {
        method: "POST",
        body: JSON.stringify({ activityId, teacherUid: uid, all: true }),
      });
      msg.className = "cc-msg cc-msg--ok";
      msg.textContent = `Assigned to ${d.assigned} student${d.assigned === 1 ? "" : "s"} in ${d.teacherName || "that class"}.`;
      setTimeout(close, 1800);
    } catch (e) {
      msg.className = "cc-msg cc-msg--err";
      msg.textContent = e.message;
      go.disabled = false;
    }
  };
}

function injectStyles() {
  if (document.getElementById("al-styles")) return;
  const s = document.createElement("style");
  s.id = "al-styles";
  s.textContent = `
    .al-sub { font-size:.76rem; color: var(--text-secondary,#6b655c); margin:0 0 .9rem; line-height:1.5; }
    .al-list { max-height: 46vh; overflow-y: auto; display:flex; flex-direction:column; gap:.35rem; }
    .al-teacher { display:flex; align-items:center; gap:.55rem; padding:.5rem .6rem; border-radius:10px;
      cursor:pointer; background: var(--surface-secondary,#f4f0e8);
      border:2px solid color-mix(in srgb, var(--ink) 10%, transparent); }
    .al-teacher:hover { border-color: color-mix(in srgb, var(--ink) 24%, transparent); }
    .al-teacher__name { font-weight:700; font-size:.82rem; flex:1; }
    .al-teacher__meta { font-size:.66rem; color: var(--text-secondary,#6b655c); white-space:nowrap; }`;
  document.head.appendChild(s);
}
