/* ═══════════════════════════════════════════════════════
   ASSIGN — a teacher hands this task to their class.

   Sharing gives you a link to paste somewhere. Assigning puts the task in a
   student's own "assigned to me" list, which is the difference between hoping
   they see it and knowing it is there. Both ride on the same filed task: the
   library id from js/library.js is what /api/classroom/assign-writing points
   at, so a task is written once and can then be shared, assigned, or both.

   Teachers only, and the button is not merely hidden from students — the
   roster call is a teachers-only endpoint, so a student who unhides it gets a
   403 from the server rather than a class list.
═══════════════════════════════════════════════════════ */

import { $, currentTopic, currentWritingType, currentPassage, customTask } from './config.js';
import { auth } from '/firebase-init.js';
import { formLabel, familyOf, isSummaryForm } from './forms.js';
import { savePrompt, mintShortCode } from './library.js';

const API_BASE =
  (typeof window !== 'undefined' && window.location.port === '5500')
    ? 'http://127.0.0.1:5000'
    : '';

async function api(path, opts = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in.');
  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let roster = null;      // null = not asked yet, [] = asked and empty
let isTeacher = false;

/* The task has to exist in the library before it can be assigned — an
   assignment points at an id, not at a sentence. This is the same filing the
   Share button does, so assigning a task you already shared re-uses its row
   rather than making a second one. */
async function fileCurrentTask() {
  const id = await savePrompt({
    prompt: currentTopic,
    form: currentWritingType,
    formLabel: formLabel(currentWritingType),
    family: familyOf(currentWritingType),
    passage: (isSummaryForm(currentWritingType) && !customTask.usePrompt) ? currentPassage : null,
    videoId: customTask.videoId,
    videoStart: customTask.videoStart,
  });
  if (!id || id === true) return '';
  /* Give it a short code on the way past. The assignment lands in the
     student's list as a link they click, so the length does not matter there
     — but half of them will be reading it on a phone and doing the work on a
     school computer, and /w/K7M2Q is a thing you can carry between the two.
     Minting is idempotent, so this costs nothing when the task already has
     one. Fire-and-forget: no assignment should fail for want of a nicer URL. */
  await mintShortCode(id);
  return id;
}

export async function initAssign() {
  const btn = $('topic-assign-btn');
  if (!btn) return;

  // Ask once, quietly. A student (or a signed-out visitor) gets a 403/401 and
  // the button simply never appears.
  try {
    const data = await api('/api/classroom/roster');
    roster = data.students || [];
    isTeacher = true;
  } catch {
    isTeacher = false;
    return;
  }

  btn.addEventListener('click', () => openPicker(btn));
  syncAssignBtn();
}

/** Shown only to a teacher, and only once there is a task worth assigning. */
export function syncAssignBtn() {
  const btn = $('topic-assign-btn');
  if (!btn) return;
  btn.style.display = (isTeacher && currentTopic) ? '' : 'none';
}

function openPicker(btn) {
  const students = roster || [];
  const list = students.length
    ? students.map((s) => `
        <label class="assign-student">
          <input type="checkbox" value="${esc(s.studentUid)}" />
          <span class="assign-student-name">${esc(s.name || 'Student')}</span>
          <span class="assign-student-mail">${esc(s.email || '')}</span>
        </label>`).join('')
    : `<p class="assign-empty">No students have joined your class yet. Share your class code from the dashboard first.</p>`;

  const root = document.createElement('div');
  root.className = 'assign-modal';
  root.innerHTML = `
    <div class="assign-bd"></div>
    <div class="assign-card pp-receipt">
      <div class="assign-paper pp-receipt__paper">
        <p class="assign-eyebrow">Assign this task</p>
        <p class="assign-task">${esc(currentTopic)}</p>

        <div class="assign-who">
          <label class="assign-mode">
            <input type="radio" name="assign-mode" value="all" checked />
            <span>My whole class${students.length ? ` <em>(${students.length})</em>` : ''}</span>
          </label>
          <label class="assign-mode">
            <input type="radio" name="assign-mode" value="some" ${students.length ? '' : 'disabled'} />
            <span>Only the students I pick</span>
          </label>
        </div>

        <div class="assign-list" id="assign-list" hidden>${list}</div>

        <p class="assign-msg" id="assign-msg" role="status" aria-live="polite"></p>

        <div class="assign-actions">
          <button class="btn btn-primary" id="assign-go" type="button">Assign</button>
          <button class="btn btn-ghost" id="assign-cancel" type="button">Cancel</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(root);

  const close = () => root.remove();
  root.querySelector('.assign-bd').addEventListener('click', close);
  root.querySelector('#assign-cancel').addEventListener('click', close);

  const listEl = root.querySelector('#assign-list');
  root.querySelectorAll('input[name="assign-mode"]').forEach((r) => {
    r.addEventListener('change', () => { listEl.hidden = r.value !== 'some' || !r.checked; });
  });

  const msg = root.querySelector('#assign-msg');
  const go = root.querySelector('#assign-go');
  go.addEventListener('click', async () => {
    const mode = root.querySelector('input[name="assign-mode"]:checked')?.value;
    const picked = [...listEl.querySelectorAll('input:checked')].map((i) => i.value);
    if (mode === 'some' && !picked.length) {
      msg.textContent = 'Tick at least one student, or choose the whole class.';
      msg.className = 'assign-msg is-bad';
      return;
    }

    go.disabled = true;
    msg.className = 'assign-msg';
    msg.textContent = 'Filing the task…';
    try {
      const taskId = await fileCurrentTask();
      if (!taskId) throw new Error('Could not file this task — check your connection and try again.');
      msg.textContent = 'Assigning…';
      const body = mode === 'all' ? { taskId, all: true } : { taskId, studentUids: picked };
      const data = await api('/api/classroom/assign-writing', { method: 'POST', body: JSON.stringify(body) });
      msg.textContent = `Assigned to ${data.assigned} student${data.assigned === 1 ? '' : 's'}.`;
      msg.className = 'assign-msg is-ok';
      setTimeout(close, 1600);
    } catch (e) {
      msg.textContent = e.message;
      msg.className = 'assign-msg is-bad';
      go.disabled = false;
    }
  });
}
