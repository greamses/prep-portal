/* ═══════════════════════════════════════════════════════
   PREPBOT — UI UTILITIES
═══════════════════════════════════════════════════════ */

import { $, currentTopic, currentWritingType, customTask } from './config.js';
import { fetchGeneratedTopic } from './api.js';
import { FAMILIES, getForm, formLabel, isSummaryForm } from './forms.js';
import { isSummaryMode, passageHtml } from './summary.js';
import { initOwnTask, releaseCustomPrompt, canShareTask } from './own-task.js';
import { createCarousel, renderChoiceStep } from '/utils/components/setup-carousel.js';
import { youtubeSearch } from '/utils/ai-client.js';

// ── Accordion Factory ──────────────────────────────────
export function makeAccordion({ id, title, bodyHtml, startOpen = false, extraClass = '', count = null }) {
  const panel = document.createElement('div');
  panel.className = `acc-panel${extraClass ? ' ' + extraClass : ''}`;
  panel.id = `acc-${id}`;

  const countSpan = count !== null ? ` <span class="acc-count">(${count})</span>` : '';

  panel.innerHTML = `
    <button class="acc-header">
      <span class="acc-header-label">${title}${countSpan}</span>
      <svg class="acc-chevron${startOpen ? ' open' : ''}" viewBox="0 0 24 24">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <div class="acc-body" id="acc-body-${id}" style="${startOpen ? '' : 'display:none'}">
      ${bodyHtml}
    </div>`;

  panel.querySelector('.acc-header').addEventListener('click', function() {
    const body = document.getElementById(`acc-body-${id}`);
    const opening = body.style.display === 'none';
    body.style.display = opening ? '' : 'none';
    this.querySelector('.acc-chevron').classList.toggle('open', opening);
  });

  return panel;
}

// ── Color Key HTML ─────────────────────────────────────
function buildColorKeyHtml() {
  const marks = [
    { code: 'del', name: 'Delete Word', color: '#dc2626', loss: '-2' },
    { code: 'ins', name: 'Insert Missing Word', color: '#16a34a', loss: '-2' },
    { code: 'cap', name: 'Capitalise', color: '#ea580c', loss: '-2' },
    { code: 'lc', name: 'Make Lowercase', color: '#0284c7', loss: '-2' },
    { code: 'trans', name: 'Transpose / Swap', color: '#7c3aed', loss: '-2' },
    { code: 'para', name: 'New Paragraph', color: '#0a0a0a', loss: '-2' },
    { code: 'spell', name: 'Spell Out Abbreviation', color: '#666', loss: '-1' },
    { code: 'sp', name: 'Misspelling', color: '#dc2626', loss: '-2' },
    { code: 'run', name: 'Run-on Sentence', color: '#b91c1c', loss: '-3' },
    { code: 'frag', name: 'Sentence Fragment', color: '#dc2626', loss: '-3' },
    { code: 'punct', name: 'Wrong Punctuation', color: '#dc2626', loss: '-2' },
    { code: 'ww', name: 'Wrong Word', color: '#dc2626', loss: '-2' },
    { code: 'agr', name: 'Subject-Verb Agreement', color: '#ea580c', loss: '-3' },
    { code: 'vt', name: 'Wrong Verb Tense', color: '#7c3aed', loss: '-2' },
    { code: 'art', name: 'Article Error', color: '#0284c7', loss: '-2' },
    { code: 'prep', name: 'Wrong Preposition', color: '#db2777', loss: '-2' },
    { code: 'rep', name: 'Unnecessary Repetition', color: '#b45309', loss: '-1' },
    { code: 'ref', name: 'Unclear Pronoun Reference', color: '#0f766e', loss: '-2' },
    { code: 'cs', name: 'Comma Splice', color: '#b91c1c', loss: '-3' },
    { code: 'wo', name: 'Word Order Error', color: '#6366f1', loss: '-2' },
    { code: 'par', name: 'Faulty Parallel Structure', color: '#059669', loss: '-2' },
    { code: 'lift', name: 'Lifted from the Passage', color: '#be123c', loss: '-3' },
  ];

  const highlights = [
    { name: 'Grammar Cluster', bg: 'rgba(253,224,71,.55)' },
    { name: 'Vocabulary Issue', bg: 'rgba(96,165,250,.3)' },
    { name: 'Structure Issue', bg: 'rgba(251,146,60,.3)' },
    { name: 'Style Issue', bg: 'rgba(196,181,253,.45)' },
    { name: 'Good Writing', bg: 'rgba(74,222,128,.3)' },
  ];

  return `
    <p class="ck-section-title">Pen Marks — click any marked word to see options</p>
    <div class="ck-grid">
      ${marks.map(m => `
        <div class="ck-item">
          <span class="ck-code" style="color:${m.color}">${m.code}</span>
          <span class="ck-name">${m.name}</span>
          <span class="ck-loss" style="color:${m.color}">${m.loss}</span>
        </div>`).join('')}
    </div>
    <p class="ck-section-title" style="margin-top:4px">Highlights</p>
    <div class="ck-hl-grid">
      ${highlights.map(h => `
        <div class="ck-hl-item">
          <span class="ck-swatch" style="background:${h.bg}"></span>
          <span>${h.name}</span>
        </div>`).join('')}
    </div>
    <div class="ck-other">
      <div><span class="ck-marker">1</span> Red circle = Examiner margin comment — click to read</div>
      <div><span class="ck-sub-demo">word</span> Blue underline = Click to substitute this word</div>
      <div><span class="ck-sent-demo">sentence</span> Amber underline = Click to rewrite this sentence</div>
    </div>`;
}

// ── Color Key Accordion (lives inside the results phase) ──
export function initColorKeyAccordion(container) {
  if (!container || document.getElementById('acc-colorkey')) return;
  container.appendChild(makeAccordion({
    id: 'colorkey', title: 'Annotation Color Key', bodyHtml: buildColorKeyHtml(), startOpen: false
  }));
}

// ── Landing Setup — the shared step carousel ───────────
// Step 1 picks the family, step 2 the form inside it, and picking a form
// generates the prompt. "Narrative" alone is not a thing you can be marked
// on, which is why there is a second step at all — see js/forms.js.
let pickedFamily = null;
let pickedForm = null;

export function initSetup({ onGenerated } = {}) {
  const mount = $('writing-setup');
  const beginBtn = $('begin-writing-btn');
  const refreshBtn = $('topic-refresh-btn');
  if (!mount) return;

  const carousel = createCarousel(mount);
  carousel.addSlide('family', 'Form');
  carousel.addSlide('style', 'Style');

  function showFamilyStep() {
    renderChoiceStep(carousel, 'family', {
      title: 'What kind of writing?',
      subtitle: 'Four families. Each one is marked differently.',
      name: 'writing-family',
      options: FAMILIES.map((f) => ({
        value: f.id,
        label: f.label,
        note: f.blurb,
        checked: f.id === pickedFamily,
      })),
      onPick: (famId) => { pickedFamily = famId; showStyleStep(); carousel.goTo('style'); },
    });
  }

  function showStyleStep() {
    const fam = FAMILIES.find((f) => f.id === pickedFamily) || FAMILIES[0];
    renderChoiceStep(carousel, 'style', {
      title: `${fam.label} — which form?`,
      subtitle: 'Pick one and we\'ll write you a prompt for it.',
      name: 'writing-form',
      colorOffset: 2,
      options: fam.forms.map((f) => ({
        value: f.id,
        label: f.label,
        note: f.blurb,
        checked: f.id === pickedForm,
      })),
      skipLabel: 'Use this',
      onPick: (formId) => generate(formId),
    });
  }

  function generate(formId) {
    pickedForm = formId;
    const form = getForm(formId);
    // Last action wins: asking for a prompt means you want the generated one.
    releaseCustomPrompt();
    if (beginBtn) beginBtn.disabled = true;
    if (refreshBtn) refreshBtn.disabled = true;

    fetchGeneratedTopic(formId, {
      onStart: () => {
        const topicDisplay = $('topic-display');
        if (topicDisplay) {
          // A summary form is having a whole passage written for it, which takes
          // noticeably longer than a one-line prompt — so it says so.
          topicDisplay.textContent = isSummaryForm(formId)
            ? `Writing you a ${(form ? form.label : 'reading').toLowerCase()} to summarise…`
            : `Writing you a ${(form ? form.label : 'writing').toLowerCase()} prompt…`;
        }
      },
      onSuccess: () => {
        syncTopicDisplay();
        if (beginBtn) beginBtn.disabled = false;
        if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.style.display = ''; }
        onGenerated?.(formId);
      },
      onError: () => {
        if (refreshBtn) refreshBtn.disabled = false;
        const topicDisplay = $('topic-display');
        if (topicDisplay) topicDisplay.textContent = 'Could not write a prompt just then. Try again.';
      },
    });
  }

  showFamilyStep();
  showStyleStep();
  carousel.start('family');

  // Another prompt for the SAME form — the point of the refresh is to reroll
  // the topic, not to send you back through the picker.
  refreshBtn?.addEventListener('click', () => { if (pickedForm) generate(pickedForm); });

  // Their own prompt/video. It needs no form: a task you were set is already
  // a task, so the Learn phase falls back to the prompt on its own.
  initOwnTask({
    onChange: () => {
      syncTopicDisplay();
      if (beginBtn) beginBtn.disabled = !currentTopic;
    },
  });
}

// ── Sync Topic Display ─────────────────────────────────
export function syncTopicDisplay() {
  const topicDisplay = $('topic-display');
  if (topicDisplay) {
    topicDisplay.textContent = currentTopic
      || 'Select a writing type above to generate a prompt.';
  }
  const flag = $('topic-own-flag');
  if (flag) flag.hidden = !customTask.usePrompt;
  // Nothing to share until there is a task; a summary can never be shared as a
  // link (see canShareTask), so the button leaves rather than lying.
  const shareBtn = $('topic-share-btn');
  if (shareBtn) shareBtn.style.display = canShareTask() ? '' : 'none';
  const hasForm = !!getForm(currentWritingType);
  const mhdrType = $('mhdr-type');
  if (mhdrType) mhdrType.textContent = hasForm ? formLabel(currentWritingType).toUpperCase() : 'YOUR OWN TASK';
  // Nothing is being taught when the task is their own, so don't promise it —
  // but with nothing set at all, the button is still the front door to a form.
  const beginBtn = $('begin-writing-btn');
  if (beginBtn) {
    beginBtn.textContent = isSummaryMode() ? 'Read the Passage →'
      : (hasForm || !currentTopic) ? 'Learn the Form →'
      : 'Read the Task →';
  }
}

/* ═══════════════════════════════════════════════════════
   THE LESSON — you read (or watch) the form before you write it.

   The gate is deliberately mild: reaching the end of the lesson unlocks the
   writing, and so does playing a video. It is a speed bump against opening a
   form you have never been taught and losing the marks that the form itself
   carries — not a test.
   ═══════════════════════════════════════════════════════ */
let hasRead = false;
let hasWatched = false;
let hasLesson = true;   // false for a task the student brought themselves
let endObserver = null;

const li = (items) => items.map((t) => `<li>${esc(t)}</li>`).join('');
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderLesson(formId) {
  const form = getForm(formId);
  const paper = $('lesson-paper');
  if (!paper) return;

  hasRead = false;
  hasWatched = false;
  hasLesson = !!form;
  const videoWrap = $('lesson-video');
  if (videoWrap) { videoWrap.hidden = true; videoWrap.innerHTML = ''; }

  // A line pointing at the video only when there is one waiting — the footer
  // button looks the same either way, so the lesson has to say it is loaded.
  const videoLine = customTask.videoId
    ? '<p class="lesson-own-video">A video has been added to this task — “Watch a video” below plays it.</p>'
    : '';

  // No registry form means the task came from the student (js/own-task.js).
  // There is no form lesson to teach, so the receipt is just the task — and
  // the gate opens straight away rather than asking them to read nothing.
  if (!form) {
    paper.innerHTML = `
      <p class="lesson-eyebrow">Your own task</p>
      <h3 class="lesson-title">Your prompt, in your words</h3>
      <p class="lesson-what">This prompt is one you set yourself, so there is no form lesson to read first. It will still be marked on grammar, vocabulary, structure and content.</p>
      ${videoLine}
      <p class="lesson-prompt-label">Your prompt</p>
      <p class="lesson-prompt">${esc(currentTopic)}</p>`;
    if (endObserver) endObserver.disconnect();
    hasRead = true;
    syncGate();
    return;
  }

  // For a summary the passage IS the task, so it is printed here rather than
  // named — and because the gate watches the foot of this receipt, scrolling
  // past the whole passage is what unlocks the organiser. That is the reading
  // step, and it enforces itself.
  const task = isSummaryMode()
    ? `<p class="lesson-prompt-label">Your task</p>
       <p class="lesson-prompt">${esc(currentTopic)}</p>
       ${passageHtml()}`
    : `<p class="lesson-prompt-label">Your prompt</p>
       <p class="lesson-prompt">${esc(currentTopic)}</p>`;

  paper.innerHTML = `
    <p class="lesson-eyebrow">${esc(form.label)}</p>
    <h3 class="lesson-title">${esc(form.blurb)}</h3>
    <p class="lesson-what">${esc(form.lesson.what)}</p>
    <p class="lesson-head">How it is shaped</p>
    <ol class="lesson-list">${li(form.lesson.shape)}</ol>
    <p class="lesson-head">What marks it out</p>
    <ul class="lesson-list lesson-list--plain">${li(form.lesson.moves)}</ul>
    <p class="lesson-head">A model</p>
    <p class="lesson-model">${esc(form.lesson.model).replace(/\n\n/g, '<br><br>')}</p>
    ${videoLine}
    ${task}`;

  syncGate();

  // "Read" = the foot of the lesson has actually been on screen. An
  // IntersectionObserver rather than a scroll handler, because on a tall
  // desktop screen the whole lesson can be visible without any scrolling at
  // all — and that still counts as having reached the end.
  const end = $('lesson-end');
  const root = $('modal-body');
  if (endObserver) endObserver.disconnect();
  if (end && root && 'IntersectionObserver' in window) {
    endObserver = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { hasRead = true; syncGate(); }
    }, { root, threshold: 0.9 });
    endObserver.observe(end);
  } else {
    hasRead = true; // no observer support — never trap the student
    syncGate();
  }
}

function syncGate() {
  const btn = $('start-writing-btn');
  const gate = $('lesson-gate');
  const open = hasRead || hasWatched;
  if (btn) btn.disabled = !open;
  if (gate) {
    gate.textContent = open
      ? (hasWatched ? 'Video watched — off you go' : hasLesson ? 'Read — off you go' : 'Your own task — off you go')
      : 'Read to the end to start writing';
    gate.classList.toggle('is-open', open);
  }
}

/* The video is a bonus path, not the main one: the search runs through the
   backend proxy and quietly returns nothing when the server has no YouTube
   key or the visitor is signed out (see utils/ai-client.js). So the button
   says what happened rather than throwing. */
export async function loadLessonVideo() {
  const form = getForm(currentWritingType);
  const wrap = $('lesson-video');
  const btn = $('lesson-video-btn');
  if (!wrap) return;

  if (!wrap.hidden) { wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

  wrap.hidden = false;

  // Their own video wins outright — if a student has been sent a video, no
  // search result is a better answer than the one they were sent.
  if (customTask.videoId) {
    playVideo(wrap, customTask.videoId, customTask.videoStart);
    return;
  }

  if (!form) {
    wrap.innerHTML = '<p class="lesson-video-note">No video added. Paste a YouTube link on the setup page to use your own.</p>';
    return;
  }

  wrap.innerHTML = '<p class="lesson-video-note">Looking for a lesson video…</p>';
  if (btn) btn.disabled = true;

  const results = await youtubeSearch(form.video, { maxResults: 3 });
  if (btn) btn.disabled = false;

  if (!results.length) {
    wrap.innerHTML = `<p class="lesson-video-note">No video available right now — the lesson above covers it. (Sign in for videos.)</p>`;
    return;
  }

  wrap.innerHTML = `
    <p class="lesson-video-note">Pick one — playing it unlocks the writing too.</p>
    <div class="lesson-video-row">
      ${results.map((v) => `
        <button class="lesson-video-card" type="button" data-id="${v.videoId}">
          <img src="${v.thumb}" alt="" loading="lazy" />
          <span class="lesson-video-title">${esc(v.title)}</span>
          <span class="lesson-video-chan">${esc(v.channel)}</span>
        </button>`).join('')}
    </div>`;

  wrap.querySelectorAll('.lesson-video-card').forEach((card) => {
    card.addEventListener('click', () => playVideo(wrap, card.dataset.id, 0));
  });
}

// One embed path for both the searched video and the student's own one.
function playVideo(wrap, videoId, start = 0) {
  const params = `rel=0&modestbranding=1&autoplay=1${start ? `&start=${start}` : ''}`;
  wrap.innerHTML = `
    <div class="lesson-video-stage">
      <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}"
              title="Lesson video" frameborder="0" allowfullscreen
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"></iframe>
    </div>`;
  hasWatched = true;
  syncGate();
}

// ── Modal ──────────────────────────────────────────────
export function openWritingModal() {
  const modal = $('modal');
  if (!modal) return;
  syncTopicDisplay();
  renderLesson(currentWritingType);
  showPhase('learn');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('modal-body')?.scrollTo({ top: 0 });
}

export function closeWritingModal() {
  const modal = $('modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* Phases: learn → write → results, with 'organise' sitting between learn and
   write for summaries only. It is a step of the same writing phase rather than
   a fourth stage — the sheet it feeds is the same sheet, and everything after
   the assemble button is identical for every form. */
export function showPhase(phase) {
  const lessonSec = $('lesson-section');
  const summarySec = $('summary-section');
  const editorSec = $('editor-section');
  const resultsSec = $('results-section');
  const ftrLearn = $('ftr-learn');
  const ftrOrganize = $('ftr-organize');
  const ftrWrite = $('ftr-write');
  const ftrResults = $('ftr-results');
  const mhdrPhase = $('mhdr-phase');

  const show = (el, on, mode = 'block') => { if (el) el.style.display = on ? mode : 'none'; };

  show(lessonSec, phase === 'learn');
  show(summarySec, phase === 'organize');
  show(editorSec, phase === 'write');
  resultsSec?.classList.toggle('active', phase === 'results');

  show(ftrLearn, phase === 'learn', 'flex');
  show(ftrOrganize, phase === 'organize', 'flex');
  show(ftrWrite, phase === 'write', 'flex');
  show(ftrResults, phase === 'results', 'flex');

  if (mhdrPhase) {
    mhdrPhase.textContent = phase === 'learn' ? 'Learn'
      : phase === 'organize' ? 'Organise'
      : phase === 'write' ? 'Write'
      : 'Results';
  }
  // The sheet is titled by what is on it — a summary paragraph is not an essay.
  const editorLabel = $('editor-label');
  if (editorLabel) editorLabel.textContent = isSummaryMode() ? 'Your Summary Paragraph' : 'Your Essay';

  if (phase !== 'learn') $('modal-body')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Inject Rewrite Styles ──────────────────────────────
export function injectRewriteStyles() {
  if (document.getElementById('rewrite-injected-css')) return;
  const s = document.createElement('style');
  s.id = 'rewrite-injected-css';
  s.textContent = `
    .score-stamp.rewrite-stamp {
      background: #0a0a0a; color: #fff;
      font-size: clamp(1.4rem, 5vw, 2rem);
      letter-spacing: .04em; padding: .4em .7em;
    }
    .rewrite-stamp-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    #rewrite-info-btn {
      width: 26px; height: 26px; border-radius: 50%;
      border: 2px solid #0a0a0a; background: #fff; color: #0a0a0a;
      font-weight: 800; font-size: .85rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 2px 2px 0 #0a0a0a;
      transition: background .15s, color .15s;
    }
    #rewrite-info-btn:hover { background: #0a0a0a; color: #fff; }
    #rewrite-info-note {
      margin-top: 10px; padding: 12px 14px; background: #fffbe6;
      border: 2px solid #0a0a0a; box-shadow: 3px 3px 0 #0a0a0a;
      font-size: .875rem; line-height: 1.5; max-width: 480px;
    }
  `;
  document.head.appendChild(s);
}
