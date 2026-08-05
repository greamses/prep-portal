/* ═══════════════════════════════════════════════════════
   YOUR OWN TASK — the student supplies the prompt and the video.

   The generated prompt covers the case where you want practice. This covers
   the other one: a prompt you were actually set, and the video your teacher
   told you to watch. Either half works alone — a prompt with no video, or a
   video over a generated prompt.

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
import { getForm, isSummaryForm } from './forms.js';

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
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      prompt: customTask.prompt, video: customTask.video, usePrompt: customTask.usePrompt,
    }));
  } catch { /* private mode — the task just won't outlive the tab */ }
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
}

// ── Wiring ─────────────────────────────────────────────
export function initOwnTask({ onChange } = {}) {
  const box = $('own-box');
  const toggle = $('own-toggle');
  const panel = $('own-panel');
  const promptEl = $('own-prompt');
  const videoEl = $('own-video');
  const noteEl = $('own-note');
  const applyBtn = $('own-apply');
  const clearBtn = $('own-clear');
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

  toggle?.addEventListener('click', () => setOpen(panel.hidden));

  function apply({ silent = false, shared = false, startFallback = 0 } = {}) {
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

  applyBtn?.addEventListener('click', () => apply());

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
  // task, not the one they left half-finished yesterday.
  const shared = readSharedTask();
  if (shared) {
    promptEl.value = shared.prompt;
    videoEl.value = shared.video;
    if (shared.form) setCurrentWritingType(shared.form);
    setOpen(true);
    apply({ shared: true, startFallback: shared.start });
    return;
  }

  // Restore — fields first, then re-apply so the receipt shows what it showed
  // when they left. The panel is opened so it is obvious where it came from.
  const saved = load();
  if (saved && (saved.prompt || saved.video)) {
    promptEl.value = saved.prompt || '';
    videoEl.value = saved.video || '';
    setOpen(true);
    if (saved.usePrompt && saved.prompt) apply({ silent: true });
    else if (saved.video) apply({ silent: true });
  }
}

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
