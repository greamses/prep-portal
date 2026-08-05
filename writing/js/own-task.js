/* ═══════════════════════════════════════════════════════
   YOUR OWN TASK — the student supplies the prompt and the video.

   The generated prompt covers the case where you want practice. This covers
   the other one: a prompt you were actually set, and the video your teacher
   told you to watch. Either half works alone — a prompt with no video, or a
   video over a generated prompt.

   THE FORM COMES FIRST. This box stays shut until a writing form has been
   picked above, for both our sake and theirs: a prompt is marked by its form,
   and a prompt with no form has no shelf in the library to be filed on
   (js/library.js). So the order is always family → form → your prompt.

   The rule everywhere is LAST ACTION WINS: applying your own prompt replaces
   the generated one, and generating a new one (picking a form, or the reroll
   button) hands the receipt back to the generator. The typed text is never
   thrown away by that — it stays in the box, one click from being used again.
   Only the video survives regeneration, because it is not a prompt.

   The same three things travel in a LINK — ?prompt=…&video=…&form=… — so a
   teacher can set one task for a whole class without anybody retyping it.
   Opening such a link applies the task exactly as if it had been typed here.
═══════════════════════════════════════════════════════ */

import {
  $, customTask, setCustomTask, setCurrentTopic, generatedTopic,
  currentTopic, currentWritingType, setCurrentWritingType,
} from './config.js';
import { getForm, isSummaryForm, familyOf, formLabel } from './forms.js';
import { savePrompt, listPrompts } from './library.js';

const STORE_KEY = 'pp-writing-own-task';
// A prompt is a sentence or two. Anything past this is someone pasting an
// essay into the query string, and it would break the URL long before it
// broke the page — so it is cut rather than trusted.
const MAX_PROMPT = 2000;

/* ── YouTube link → video id ────────────────────────────
   Accepts everything a student is plausibly holding: a watch URL, a share
   link, a Shorts link, an embed src, a bare id — with or without the scheme.
   Returns null rather than guessing, so a typo is reported instead of
   embedding some other video. */
export function parseYouTube(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return { videoId: s, start: 0 };

  let url;
  try { url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  let id = '';
  if (host === 'youtu.be') {
    id = url.pathname.slice(1);
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m ? m[1] : '';
    }
  }

  id = id.split(/[/?#&]/)[0];
  if (!/^[\w-]{11}$/.test(id)) return null;
  return { videoId: id, start: parseStart(url.searchParams.get('t') || url.searchParams.get('start')) };
}

// "90", "90s", "1m30s", "1h2m3s" — the forms YouTube itself hands out.
function parseStart(t) {
  if (!t) return 0;
  const plain = String(t).trim();
  if (/^\d+s?$/.test(plain)) return parseInt(plain, 10) || 0;
  const m = plain.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!m || !(m[1] || m[2] || m[3])) return 0;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}

// ── Persistence — a set task should survive a reload ───
// The form travels with it: coming back to a saved prompt without the form it
// was written for would put it back on the page uncategorised.
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      prompt: customTask.prompt, video: customTask.video, usePrompt: customTask.usePrompt,
      form: getForm(currentWritingType) ? currentWritingType : '',
    }));
  } catch { /* private mode — the task just won't outlive the tab */ }
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
}

// ── Wiring ─────────────────────────────────────────────
let syncLockFn = null;

export function initOwnTask({ onChange, onFormRestored } = {}) {
  const box = $('own-box');
  const toggle = $('own-toggle');
  const toggleLabel = $('own-toggle-label');
  const panel = $('own-panel');
  const lockEl = $('own-lock');
  const promptEl = $('own-prompt');
  const videoEl = $('own-video');
  const noteEl = $('own-note');
  const applyBtn = $('own-apply');
  const clearBtn = $('own-clear');
  const shelfEl = $('own-shelf');
  if (!box || !panel || !promptEl || !videoEl) return;

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle?.setAttribute('aria-expanded', String(open));
    box.classList.toggle('is-open', open);
  };
  const note = (msg, bad = false) => {
    if (!noteEl) return;
    noteEl.textContent = msg || '';
    noteEl.classList.toggle('is-bad', !!(msg && bad));
  };

  /* ── The lock ──────────────────────────────────────────
     No form, no prompt. The box still opens when it is locked — being told
     why is more use than a dead button — but the fields stay out of reach
     until the picker above has been answered.

     A task that is already in play unlocks it too, because by then the
     question has been answered: an old shared link that carries a prompt but
     no form is still a task somebody was set, and refusing to show it would
     help nobody. The lock guards TYPING a prompt, not holding one. */
  const isLocked = () => !getForm(currentWritingType) && !customTask.usePrompt;

  function syncLock() {
    const locked = isLocked();
    box.classList.toggle('is-locked', locked);
    if (lockEl) lockEl.hidden = !locked;
    [promptEl, videoEl, applyBtn, clearBtn].forEach((el) => { if (el) el.disabled = locked; });
    if (toggleLabel) {
      toggleLabel.textContent = locked
        ? 'Pick a writing form first to use your own prompt'
        : getForm(currentWritingType)
          ? `Use my own prompt or video — ${formLabel(currentWritingType)}`
          : 'Use my own prompt or video';
    }
    if (locked) { if (shelfEl) { shelfEl.hidden = true; shelfEl.innerHTML = ''; } }
    else renderShelf();
  }
  // Picking a form upstairs is what unlocks this box, so the lock has to be
  // re-checkable from outside as well as from in here.
  syncLockFn = syncLock;

  /* ── The shelf ─────────────────────────────────────────
     Prompts already filed under this form — the caller's own, plus any that
     have been published to everyone. Clicking one drops it into the box; it
     still has to be applied, so nothing changes behind the student's back. */
  let shelfForm = null;
  async function renderShelf() {
    if (!shelfEl) return;
    const form = currentWritingType;
    if (shelfForm === form) return;      // already showing this form's shelf
    shelfForm = form;
    shelfEl.hidden = true;
    shelfEl.innerHTML = '';

    const prompts = await listPrompts(form);
    if (shelfForm !== form || !prompts.length) return;   // form moved on, or bare shelf

    shelfEl.innerHTML = `
      <p class="own-shelf-label">Already in the library for this form</p>
      <div class="own-shelf-row">
        ${prompts.map((p) => `
          <button class="own-shelf-item" type="button" data-prompt="${attr(p.prompt)}" data-video="${attr(p.video)}">
            ${esc(p.prompt)}
          </button>`).join('')}
      </div>`;
    shelfEl.hidden = false;

    shelfEl.querySelectorAll('.own-shelf-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        promptEl.value = btn.dataset.prompt || '';
        if (btn.dataset.video && !videoEl.value.trim()) videoEl.value = btn.dataset.video;
        note('Taken from the library — press "Use these" to set it.');
        promptEl.focus();
      });
    });
  }

  toggle?.addEventListener('click', () => setOpen(panel.hidden));

  function apply({ silent = false, shared = false, startFallback = 0, file = false } = {}) {
    // Only a hand-typed prompt is gated — a restore or a shared link is a task
    // that was already set, arriving a second time.
    if (!silent && !shared && isLocked()) {
      setOpen(true);
      note('Choose the family and the form above first — a prompt is marked, and filed, by its form.', true);
      return false;
    }

    const prompt = promptEl.value.trim().slice(0, MAX_PROMPT);
    const video = videoEl.value.trim();

    const parsed = video ? parseYouTube(video) : null;
    if (video && !parsed) {
      note('That does not look like a YouTube link. Paste the whole address, or just the video id.', true);
      videoEl.focus();
      return false;
    }
    if (!prompt && !parsed) {
      note('Add a prompt, a video link, or both.', true);
      return false;
    }

    // Every prompt somebody types goes on the shelf for its form. Fire and
    // forget — a busy library must never hold up the writing.
    if (file && prompt) {
      savePrompt({
        prompt,
        form: currentWritingType,
        formLabel: formLabel(currentWritingType),
        family: familyOf(currentWritingType),
        videoId: parsed ? parsed.videoId : '',
        videoStart: parsed ? parsed.start : 0,
      }).then((ok) => { if (ok) { shelfForm = null; renderShelf(); } });
    }

    setCustomTask({
      prompt,
      video,
      videoId: parsed ? parsed.videoId : '',
      // A shared link carries the id and the offset apart, so a bare id there
      // still starts where the sharer meant it to.
      videoStart: parsed ? (parsed.start || startFallback) : 0,
      usePrompt: !!prompt,
    });
    if (prompt) setCurrentTopic(prompt);
    save();

    note(
      shared ? 'This task was shared with you — press Start when you are ready.'
        : silent ? 'Restored from last time.'
        : prompt && parsed ? 'Using your prompt and your video.'
        : prompt ? 'Using your prompt.'
        : 'Using your video — the prompt above stays as it is.'
    );
    syncLock();
    onChange?.();
    return true;
  }

  // Only a prompt somebody actually typed is filed — a restore or a shared
  // link is the same prompt arriving a second time, not a new one.
  applyBtn?.addEventListener('click', () => apply({ file: true }));

  clearBtn?.addEventListener('click', () => {
    const wasUsingOwn = customTask.usePrompt;
    promptEl.value = '';
    videoEl.value = '';
    setCustomTask(null);
    save();
    // Hand the slip back to whatever the generator last wrote. If it never ran,
    // that is the empty string and the page returns to "pick a form".
    if (wasUsingOwn) setCurrentTopic(generatedTopic || '');
    note(generatedTopic || !wasUsingOwn
      ? 'Cleared. Back to the generated prompt.'
      : 'Cleared. Pick a form above to be set a prompt.');
    syncLock();
    onChange?.();
  });

  // ── Copy a link to this task ─────────────────────────
  const shareBtn = $('topic-share-btn');
  shareBtn?.addEventListener('click', async () => {
    const url = buildShareUrl();
    if (!url) return;
    const copied = await copyText(url);
    if (copied) {
      flashShared('Link copied');
    } else {
      // Clipboard refused (permissions, or an insecure context) — then the
      // link has to be visible somewhere it can be selected by hand.
      setOpen(true);
      note(`Copy this link: ${url}`);
      flashShared('Link below');
    }
  });

  // ── What the page opens with ─────────────────────────
  // A link beats storage: someone who follows a shared task means to do THAT
  // task, not the one they left half-finished yesterday. Either way the FORM
  // is restored first, so the box is already unlocked by the time the prompt
  // lands in it and the picker above shows what it is set to.
  const restoreForm = (formId) => {
    if (!getForm(formId)) return;
    setCurrentWritingType(formId);
    onFormRestored?.(formId);
  };

  const shared = readSharedTask();
  if (shared) {
    promptEl.value = shared.prompt;
    videoEl.value = shared.video;
    restoreForm(shared.form);
    setOpen(true);
    syncLock();
    apply({ shared: true, startFallback: shared.start });
    return;
  }

  // Restore — fields first, then re-apply so the receipt shows what it showed
  // when they left. The panel is opened so it is obvious where it came from.
  const saved = load();
  if (saved && (saved.prompt || saved.video)) {
    promptEl.value = saved.prompt || '';
    videoEl.value = saved.video || '';
    restoreForm(saved.form);
    setOpen(true);
    syncLock();
    if (saved.usePrompt && saved.prompt) apply({ silent: true });
    else if (saved.video) apply({ silent: true });
    return;
  }

  syncLock();
}

/* Called by the setup carousel the moment a form is chosen — that is the event
   that unlocks the box, and there is no other way in. */
export function refreshOwnTaskLock() {
  syncLockFn?.();
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');

/* ── Sharing ────────────────────────────────────────────
   The link carries the prompt as plain readable text on purpose: a teacher
   pasting it into a class group can see what they are sending, and can edit
   it in the address bar without any encoding ceremony. */
export function readSharedTask() {
  const q = new URLSearchParams(location.search);
  const prompt = (q.get('prompt') || '').trim().slice(0, MAX_PROMPT);
  const video = (q.get('video') || '').trim();
  const form = (q.get('form') || '').trim();
  if (!prompt && !video) return null;
  return {
    prompt,
    video,
    form: getForm(form) ? form : '',
    start: parseInt(q.get('t') || '0', 10) || 0,
  };
}

export function buildShareUrl() {
  if (!canShareTask()) return '';
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set('prompt', currentTopic);
  // The id rather than the pasted address: it is 11 characters instead of
  // sixty, and parseYouTube takes a bare id back.
  if (customTask.videoId) {
    url.searchParams.set('video', customTask.videoId);
    if (customTask.videoStart) url.searchParams.set('t', String(customTask.videoStart));
  }
  if (getForm(currentWritingType)) url.searchParams.set('form', currentWritingType);
  return url.toString();
}

/* A summary is set from a whole generated PASSAGE, not a prompt line, and a
   passage does not fit in a query string — so that one form is not shareable
   and says so rather than sending a link that arrives empty. */
export function canShareTask() {
  if (!currentTopic) return false;
  if (isSummaryForm(currentWritingType) && !customTask.usePrompt) return false;
  return true;
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the old way */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

function flashShared(msg) {
  const el = $('topic-share-msg');
  if (!el) return;
  el.textContent = msg;
  el.style.display = '';
  clearTimeout(flashShared._t);
  flashShared._t = setTimeout(() => { el.style.display = 'none'; }, 2200);
}

/* The generator has just put its own prompt on the receipt. Their text stays
   in the box (and in storage) so "Use these" puts it straight back; only the
   claim on the receipt is dropped. */
export function releaseCustomPrompt() {
  if (!customTask.usePrompt) return;
  setCustomTask({ ...customTask, usePrompt: false });
  save();
  const noteEl = $('own-note');
  if (noteEl) {
    noteEl.classList.remove('is-bad');
    noteEl.textContent = 'Showing a generated prompt now — press "Use these" to go back to yours.';
  }
}
