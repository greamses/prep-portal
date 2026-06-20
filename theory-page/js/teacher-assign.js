/* ════════════════════════════════════════════════════
   teacher-assign.js
   When a TEACHER (or admin) is signed in, add a "Save & assign"
   action to the setup footer. It packages the questions the teacher
   just built (same getSlotData() the practice flow uses) into an
   activity via POST /api/activities and hands back a shareable link
   that any subscribed student can open at /activity.html?a=<slug>.
   ════════════════════════════════════════════════════ */
import { auth, db } from '/firebase-init.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { state } from '../state.js';
import { getSlotData } from './setup-form.js';

const API = window.location.port === '5500' ? 'http://127.0.0.1:5000' : '';

const ARROW = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

export function initTeacherAssign() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    let role = '';
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      role = snap.exists() ? (snap.data().role || '') : '';
    } catch (_) {}
    if (role === 'teacher' || role === 'admin') injectButton();
  });
}

function injectButton() {
  const footer = document.querySelector('.setup-footer');
  if (!footer || document.getElementById('save-assign-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'save-assign-btn';
  btn.className = 'btn btn-blue';
  btn.type = 'button';
  btn.style.marginLeft = '8px';
  btn.innerHTML = `${ARROW} Save &amp; assign`;
  btn.addEventListener('click', openAssignModal);
  const begin = document.getElementById('begin-btn');
  begin ? begin.insertAdjacentElement('afterend', btn) : footer.appendChild(btn);
}

function currentQuestions() {
  // Same shape the practice flow collects; keep questions with real content.
  return getSlotData()
    .map((q) => ({ text: q.text, marks: q.marks, compulsory: q.compulsory }))
    .filter((q) => String(q.text || '').replace(/<[^>]+>/g, '').trim().length >= 3);
}

function injectStyles() {
  if (document.getElementById('ta-assign-styles')) return;
  const s = document.createElement('style');
  s.id = 'ta-assign-styles';
  s.textContent = `
    #ta-assign { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center;
      justify-content: center; padding: 1rem; background: rgba(42,39,35,.5); }
    .ta-assign__card { width: min(440px, 100%); background: var(--surface-primary, #fffdf8);
      color: var(--ink, #2a2723); border: 2px solid color-mix(in srgb, var(--ink) 14%, transparent);
      border-radius: 18px; box-shadow: var(--shadow-xl, 0 18px 40px rgba(42,39,35,.18));
      padding: 1.5rem 1.4rem; font-family: var(--font-mono, monospace); }
    .ta-assign__card h3 { font-family: var(--font-display, sans-serif); font-size: 1.1rem; margin: 0 0 .3rem; }
    .ta-assign__sub { font-size: .76rem; color: var(--text-secondary, #6b655c); margin: 0 0 1rem; line-height: 1.5; }
    .ta-assign__card label { display:block; font-size:.62rem; font-weight:600; text-transform:uppercase;
      letter-spacing:.06em; color: var(--text-secondary,#6b655c); margin:.3rem 0 .3rem; }
    .ta-assign__card input { width:100%; box-sizing:border-box; padding:.6rem .75rem; border-radius:10px;
      font-family:inherit; font-size:.85rem; border:2px solid color-mix(in srgb, var(--ink) 14%, transparent);
      background: var(--surface-secondary,#f4f0e8); color: var(--ink,#2a2723); }
    .ta-assign__row { display:flex; gap:.6rem; margin-top:1rem; }
    .ta-assign__msg { font-size:.74rem; margin-top:.7rem; min-height:1em; }
    .ta-assign__msg--err { color: var(--accent-danger,#e07a5f); }
    .ta-assign__link { display:flex; gap:.5rem; margin-top:.8rem; }
    .ta-assign__link input { font-size:.78rem; }
    .ta-assign__open { display:inline-block; margin-top:.8rem; font-size:.76rem; color: var(--accent-secondary,#6fb7e8); }`;
  document.head.appendChild(s);
}

function close() { document.getElementById('ta-assign')?.remove(); }

function openAssignModal() {
  const questions = currentQuestions();
  if (!questions.length) {
    alert('Add at least one question (type it or auto-generate) before assigning.');
    return;
  }
  injectStyles();
  const defTitle = [state.st.subject, state.st.cls].filter(Boolean).join(' — ') || 'New activity';
  const root = document.createElement('div');
  root.id = 'ta-assign';
  root.innerHTML = `
    <div class="ta-assign__card" role="dialog" aria-modal="true">
      <h3>Save &amp; assign activity</h3>
      <p class="ta-assign__sub">${questions.length} question${questions.length > 1 ? 's' : ''} · ${state.st.subject || 'Subject'} · ${state.st.cls || 'Class'}. You'll get a link to share with students.</p>
      <div id="ta-assign-form">
        <label for="ta-assign-title">Activity title</label>
        <input id="ta-assign-title" type="text" maxlength="140" value="${defTitle.replace(/"/g, '&quot;')}" />
        <div class="ta-assign__row">
          <button class="btn btn-yellow" id="ta-assign-create" type="button">Create link</button>
          <button class="btn btn-ghost" id="ta-assign-cancel" type="button">Cancel</button>
        </div>
        <p id="ta-assign-msg" class="ta-assign__msg"></p>
      </div>
      <div id="ta-assign-done" style="display:none"></div>
    </div>`;
  document.body.appendChild(root);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  root.querySelector('#ta-assign-cancel').onclick = close;
  root.querySelector('#ta-assign-create').onclick = () => createActivity(questions);
}

async function createActivity(questions) {
  const btn = document.getElementById('ta-assign-create');
  const msg = document.getElementById('ta-assign-msg');
  btn.disabled = true; msg.textContent = 'Creating…'; msg.className = 'ta-assign__msg';
  try {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${API}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: document.getElementById('ta-assign-title').value,
        subject: state.st.subject || null,
        classLevel: state.st.cls || null,
        track: state.st.track || null,
        questions,
      }),
    });
    const d = await res.json();
    if (!res.ok || !d.ok) throw new Error(d.error || 'Could not create the activity.');
    showLink(d.activity.shareSlug);
  } catch (e) {
    msg.textContent = e.message; msg.className = 'ta-assign__msg ta-assign__msg--err';
    btn.disabled = false;
  }
}

function showLink(slug) {
  const link = `${location.origin}/activity.html?a=${slug}`;
  document.getElementById('ta-assign-form').style.display = 'none';
  const done = document.getElementById('ta-assign-done');
  done.style.display = 'block';
  done.innerHTML = `
    <p class="ta-assign__sub" style="margin-top:.2rem">Share this link with your students — anyone with a subscription can open and answer it.</p>
    <div class="ta-assign__link">
      <input id="ta-assign-url" type="text" readonly value="${link}" />
      <button class="btn btn-yellow" id="ta-assign-copy" type="button">Copy</button>
    </div>
    <a class="ta-assign__open" href="/activity.html?a=${slug}&preview=1" target="_blank" rel="noopener">Open as a student (preview) →</a>
    <div class="ta-assign__row"><button class="btn btn-ghost" id="ta-assign-close2" type="button">Done</button></div>`;
  const copy = document.getElementById('ta-assign-copy');
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(link); copy.textContent = 'Copied'; setTimeout(() => (copy.textContent = 'Copy'), 1500); } catch (_) {}
  };
  document.getElementById('ta-assign-close2').onclick = close;
}
