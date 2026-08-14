/* ═══════════════════════════════════════════════════════
   HANDING IT IN — what happens to a marking after it is shown.

   Until now, nothing. The red pen was drawn on the screen and lived until the
   tab closed. That is fine for practice and no use to a class: the teacher who
   set the task never saw what came back, and the machine's number was the last
   word on a student's writing, which it should not be.

   So a finished marking is filed against the TASK it answers
   (server/routes/writing.js), where the teacher who owns that task can read it,
   approve it, change the score and write comments.

   Three rules this file exists to keep:

     1. IT NEVER BLOCKS THE RESULT. The marking is already on screen before this
        runs. A student whose network drops still has their marking; they simply
        do not have a receipt. Every failure here is a line of text on the
        results page, never an alert and never a thrown error.

     2. IT FILES AGAINST THE RIGHT TASK. A piece written for a teacher's task
        must land under THAT task's id (config.currentTaskId, set when the link
        was opened), not under a fresh copy of the same prompt filed in the
        student's own name — otherwise it never reaches the class list it was
        meant for. Only a prompt with no filed task behind it is filed here.

     3. IT SAYS SO. A student who has just handed work to a teacher is told,
        on the page, in one line. Silent transmission of a child's essay to
        anybody is not something to do quietly.
   ═══════════════════════════════════════════════════════ */

import {
  $, currentTopic, currentWritingType, currentLevel, currentTaskId,
  currentPassage, customTask, setCurrentTaskId,
} from './config.js';
import { auth } from '/firebase-init.js';
import { formLabel, familyOf, isSummaryForm } from './forms.js';
import { savePrompt } from './library.js';

const API_BASE =
  (typeof window !== 'undefined' && window.location.port === '5500')
    ? 'http://127.0.0.1:5000'
    : '';

/* The task this piece answers, filing it first if it has never been filed.
   A generated prompt has no library row until somebody shares or assigns it —
   handing work in is a third reason for one to exist. */
async function taskIdForSubmission() {
  if (currentTaskId) return currentTaskId;
  const id = await savePrompt({
    prompt: currentTopic,
    form: currentWritingType,
    formLabel: formLabel(currentWritingType),
    family: familyOf(currentWritingType),
    level: currentLevel,
    passage: (isSummaryForm(currentWritingType) && !customTask.usePrompt) ? currentPassage : null,
  });
  if (!id || id === true) return '';
  setCurrentTaskId(id);
  return id;
}

/** File a marked piece. Resolves { ok, reason } and never throws. */
export async function fileSubmission(data, text) {
  const user = auth.currentUser;
  if (!user) return { ok: false, reason: 'signed-out' };
  // An off-topic piece was not marked — there is nothing to hand in but a
  // refusal, and a teacher's list should not fill up with them.
  if (data && data.offTopic) return { ok: false, reason: 'off-topic' };

  try {
    const taskId = await taskIdForSubmission();
    if (!taskId) return { ok: false, reason: 'no-task' };

    const token = await user.getIdToken();
    const res = await fetch(`${API_BASE}/api/writing/task/${encodeURIComponent(taskId)}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        text,
        words: String(text || '').trim().split(/\s+/).filter(Boolean).length,
        marking: {
          totalScore: data.totalScore,
          rubric: data.rubric,
          annotatedText: data.annotatedText,
          offTopic: !!data.offTopic,
          passes: data.passes || 0,
        },
      }),
    });
    if (!res.ok) return { ok: false, reason: 'rejected' };
    const out = await res.json().catch(() => ({}));
    return { ok: true, teacher: !!out.teacher };
  } catch (_) {
    return { ok: false, reason: 'unreachable' };
  }
}

/* The line on the results page. It is written into the stamp row rather than
   into an accordion because it is a fact about what just happened to their
   work, and it should be readable without opening anything. */
export function sayFiled(result) {
  const row = $('stamp-row');
  if (!row) return;
  let el = $('submit-receipt');
  if (!el) {
    el = document.createElement('p');
    el.id = 'submit-receipt';
    el.className = 'submit-receipt';
    row.appendChild(el);
  }
  const messages = {
    'signed-out': 'Not saved — you are not signed in.',
    'off-topic': '',
    'no-task': 'Marked, but this piece could not be saved.',
    rejected: 'Marked, but this piece could not be saved.',
    unreachable: 'Marked. Saving failed — check your connection.',
  };
  el.textContent = result.ok
    ? 'Saved. Your teacher can see this and may change the mark.'
    : (messages[result.reason] ?? '');
  el.hidden = !el.textContent;
  el.classList.toggle('is-bad', !result.ok);
}
