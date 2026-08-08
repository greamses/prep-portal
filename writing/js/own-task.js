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
  currentPassage, setCurrentPassage,
} from './config.js';
import { getForm, isSummaryForm, familyOf, formLabel } from './forms.js';
import { savePrompt, listPrompts, fetchTask } from './library.js';

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
// The panel and the shelf are staged in the page and MOVED into the last two
// steps of the setup carousel by js/ui.js. That is the whole gate: there is no
// way to reach either of them before the form has been picked, so nothing here
// has to police the order.
let els = null;

export function initOwnTask({ onChange, onFormRestored, onLibraryPick } = {}) {
  const panel = $('own-panel');
  const promptEl = $('own-prompt');
  const videoEl = $('own-video');
  const noteEl = $('own-note');
  const applyBtn = $('own-apply');
  const clearBtn = $('own-clear');
  const shelfEl = $('own-shelf');
  if (!panel || !promptEl || !videoEl) return;

  const note = (msg, bad = false) => {
    if (!noteEl) return;
    noteEl.textContent = msg || '';
    noteEl.classList.toggle('is-bad', !!(msg && bad));
  };

  /* ── The shelf ─────────────────────────────────────────
     Prompts already filed under this form — the caller's own, plus any that
     have been published to everyone. Picking one fills the box and sets it in
     one move, then hands back to the carousel so they land on the box holding
     their task and can still change or clear it. */
  let shelfForm = null;
  async function renderShelf({ force = false } = {}) {
    if (!shelfEl) return;
    const form = currentWritingType;
    if (!force && shelfForm === form) return;   // already showing this shelf
    shelfForm = form;
    shelfEl.innerHTML = '<p class="own-shelf-label">Looking on the shelf…</p>';

    const result = await listPrompts(form);
    if (shelfForm !== form) return;             // they moved on while we asked

    // An empty shelf and a shelf we could not reach are different things, and
    // saying the wrong one sends somebody off to retype a prompt they already
    // have filed. Only the first is an invitation.
    if (!result.ok || !result.prompts.length) {
      const label = esc(formLabel(form));
      const msg = result.ok
        ? `Nothing filed under ${label} yet. Paste one in and it will be the first —
           every prompt typed here is kept under the form it was set for.`
        : result.reason === 'signed-out'
          ? 'Sign in to keep your prompts and to see the ones already on the shelf.'
          : `Could not reach the library just then — you may be offline. Your own
             prompt still works; paste it in and it will be filed when you are back.`;
      shelfEl.innerHTML = `
        <p class="own-shelf-empty">${msg}</p>
        ${result.ok || result.reason === 'signed-out' ? '' : `
          <div class="own-shelf-row">
            <button class="pp-sticky pp-sticky--tape pp-note-btn pp-sticky--c3" type="button" id="own-shelf-retry">
              Try again
            </button>
          </div>`}`;
      shelfEl.querySelector('#own-shelf-retry')
        ?.addEventListener('click', () => renderShelf({ force: true }));
      return;
    }
    const prompts = result.prompts;

    // Sticky notes, like every other choice on this carousel — see
    // [[ui-reuse-shared-components]]: a slip you pick is a note, not a card.
    shelfEl.innerHTML = `
      <p class="own-shelf-label">${esc(formLabel(form))} — pick one to use it</p>
      <div class="own-shelf-row">
        ${prompts.map((p, i) => `
          <button class="pp-sticky pp-sticky--tape pp-note-btn own-shelf-item pp-sticky--c${i % 6}"
                  type="button" data-prompt="${attr(p.prompt)}" data-video="${attr(p.video)}"
                  title="${attr(p.prompt)}">
            <span>${esc(p.prompt)}</span>
          </button>`).join('')}
      </div>`;

    shelfEl.querySelectorAll('.own-shelf-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        promptEl.value = btn.dataset.prompt || '';
        if (btn.dataset.video && !videoEl.value.trim()) videoEl.value = btn.dataset.video;
        if (apply()) {
          note('Taken from the library. Edit it here if you want to, or press Start.');
          onLibraryPick?.();
        }
      });
    });
  }

  // What ui.js needs to hang these on the carousel, and to refresh the shelf
  // when the form changes underneath it.
  els = { panel, shelf: shelfEl, refreshShelf: renderShelf, focusPrompt: () => promptEl.focus() };

  function apply({ silent = false, shared = false, startFallback = 0, file = false } = {}) {
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
      }).then((ok) => { if (ok) renderShelf({ force: true }); });
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
    onChange?.();
    return true;
  }

  // Only a prompt somebody actually typed is filed — a restore, a shared link
  // or a slip taken off the shelf is the same prompt arriving a second time.
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
      : 'Cleared. Step back and ask for one, or take one off the shelf.');
    onChange?.();
  });

  // ── Copy a link to this task ─────────────────────────
  const shareBtn = $('topic-share-btn');
  shareBtn?.addEventListener('click', async () => {
    shareBtn.disabled = true;
    try {
      const url = await buildShareUrl();
      if (!url) {
        flashShared('Nothing to share');
        return;
      }
      const copied = await copyText(url);
      if (copied) {
        flashShared('Link copied');
      } else {
        // Clipboard refused (permissions, or an insecure context) — then the
        // link has to be visible somewhere it can be selected by hand.
        note(`Copy this link: ${url}`);
        flashShared('Link below');
      }
    } finally {
      shareBtn.disabled = false;
    }
  });

  // ── What the page opens with ─────────────────────────
  // A link beats storage: someone who follows a shared task means to do THAT
  // task, not the one they left half-finished yesterday. Either way the FORM
  // is restored first, and ui.js walks the carousel to the step holding the
  // task — so the page they come back to is the page they left.
  const restore = (task, applyOpts) => {
    promptEl.value = task.prompt || '';
    videoEl.value = task.video || '';
    if (getForm(task.form)) setCurrentWritingType(task.form);
    onFormRestored?.(task.form || '');
    apply(applyOpts);
  };

  // A ?task=<id> link is a summary (or any task filed by reference): the passage
  // has to come back from the library before anything can be applied, so this
  // one path is async. The saved task is NOT restored underneath it — a followed
  // link means that task, and swapping it out mid-fetch would be a flicker and a
  // lie about what they opened.
  const sharedId = readSharedTaskId();
  if (sharedId) {
    note('Opening the task you were sent…');
    fetchTask(sharedId).then((task) => {
      if (!task) {
        note('That shared task could not be found. It may have been removed.', true);
        return;
      }
      const video = task.videoId ? `https://youtu.be/${task.videoId}` : '';

      /* A passage arrives as a PASSAGE, not as a custom prompt. isSummaryMode()
         is `!customTask.usePrompt && currentPassage`, so pushing a summary
         through apply() — which sets usePrompt — would hand the receiver a
         blank essay sheet instead of the organiser, with the passage sitting
         there unused. So this path sets the task directly and leaves the
         custom-prompt claim alone; only the video rides along. */
      if (task.passage) {
        if (getForm(task.form)) setCurrentWritingType(task.form);
        setCurrentPassage(task.passage);
        setCurrentTopic(task.prompt || '');
        videoEl.value = video;
        const parsed = video ? parseYouTube(video) : null;
        if (parsed) {
          setCustomTask({
            video,
            videoId: parsed.videoId,
            videoStart: parsed.start || task.videoStart || 0,
            usePrompt: false,
          });
        }
        onFormRestored?.(task.form || '');
        note('This reading was shared with you — press Start when you are ready.');
        onChange?.();
        return;
      }

      restore(
        { prompt: task.prompt, video, form: task.form },
        { shared: true, startFallback: task.videoStart || 0 },
      );
    });
    return;
  }

  const shared = readSharedTask();
  if (shared) {
    restore(shared, { shared: true, startFallback: shared.start });
    return;
  }

  const saved = load();
  if (saved && (saved.prompt || saved.video)) restore(saved, { silent: true });
}

/** The id on a ?task= link, or ''. Ids are hashes, so the shape is checkable. */
export function readSharedTaskId() {
  const id = (new URLSearchParams(location.search).get('task') || '').trim();
  return /^[a-z0-9_-]{3,120}$/i.test(id) ? id : '';
}

/* The panel and the shelf, for js/ui.js to hang on the setup carousel. */
export function ownTaskEls() {
  return els;
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

/* A SUMMARY's task is a whole reading, which will not go in a query string. So
   that one shares by REFERENCE: the passage is filed in the library and the link
   carries ?task=<id>. Everything else still shares by value, because a readable
   ?prompt= is worth keeping — a teacher can see what they are sending, and edit
   it in the address bar without any encoding ceremony. */
export async function buildShareUrl() {
  if (!canShareTask()) return '';
  const url = new URL(location.origin + location.pathname);

  if (needsPassageShare()) {
    const id = await savePrompt({
      prompt: currentTopic,
      form: currentWritingType,
      formLabel: formLabel(currentWritingType),
      family: familyOf(currentWritingType),
      passage: currentPassage,
      videoId: customTask.videoId,
      videoStart: customTask.videoStart,
    });
    if (!id || id === true) return '';   // could not file it — no link to give
    url.searchParams.set('task', id);
    return url.toString();
  }

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

// A summary whose task is the generated passage rather than a typed prompt.
const needsPassageShare = () =>
  isSummaryForm(currentWritingType) && !customTask.usePrompt && !!currentPassage;

export function canShareTask() {
  if (!currentTopic) return false;
  // A summary is shareable now — but only once it actually has a passage to
  // file. Before that there is nothing on the other end of the link.
  if (isSummaryForm(currentWritingType) && !customTask.usePrompt) return !!currentPassage;
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
