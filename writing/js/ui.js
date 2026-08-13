/* ═══════════════════════════════════════════════════════
   PREPBOT — UI UTILITIES
═══════════════════════════════════════════════════════ */

import { $, currentTopic, currentWritingType, setCurrentWritingType, customTask } from './config.js';
import { fetchGeneratedTopic, fetchModelText, videoQueryFor } from './api.js';
import { FAMILIES, getForm, formLabel, isSummaryForm, familyOf, getMnemonic, keyColorClass } from './forms.js';
import { isSummaryMode, passageHtml } from './summary.js';
import { initOwnTask, releaseCustomPrompt, canShareTask, ownTaskEls } from './own-task.js';
import { initAssign, syncAssignBtn } from './assign.js';
import { createCarousel, renderChoiceStep, renderCustomStep } from '/utils/components/setup-carousel.js';
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
  /* The key has to be painted in the SAME ink as the marks on the paper. It was
     written in a hardcoded palette (#dc2626, #7c3aed, #0055ff…) from before the
     site went to soft paper, so the legend showed hard tailwind red beside a
     mark that is actually a soft --red — a key that disagrees with the thing it
     is a key to. Tokens now, so the two can never drift again. */
  const marks = [
    { code: 'del', name: 'Delete Word', color: 'var(--red)', loss: '-2' },
    { code: 'ins', name: 'Insert Missing Word', color: 'var(--green)', loss: '-2' },
    { code: 'cap', name: 'Capitalise', color: 'var(--amber)', loss: '-2' },
    { code: 'lc', name: 'Make Lowercase', color: 'var(--blue)', loss: '-2' },
    { code: 'trans', name: 'Transpose / Swap', color: 'var(--blue)', loss: '-2' },
    { code: 'para', name: 'New Paragraph', color: 'var(--ink)', loss: '-2' },
    { code: 'spell', name: 'Spell Out Abbreviation', color: 'var(--muted)', loss: '-1' },
    { code: 'sp', name: 'Misspelling', color: 'var(--red)', loss: '-2' },
    { code: 'run', name: 'Run-on Sentence', color: 'var(--red)', loss: '-3' },
    { code: 'frag', name: 'Sentence Fragment', color: 'var(--red)', loss: '-3' },
    { code: 'punct', name: 'Wrong Punctuation', color: 'var(--red)', loss: '-2' },
    { code: 'ww', name: 'Wrong Word', color: 'var(--red)', loss: '-2' },
    { code: 'agr', name: 'Subject-Verb Agreement', color: 'var(--amber)', loss: '-3' },
    { code: 'vt', name: 'Wrong Verb Tense', color: 'var(--amber)', loss: '-2' },
    { code: 'art', name: 'Article Error', color: 'var(--blue)', loss: '-2' },
    { code: 'prep', name: 'Wrong Preposition', color: 'var(--blue)', loss: '-2' },
    { code: 'rep', name: 'Unnecessary Repetition', color: 'var(--amber)', loss: '-1' },
    { code: 'ref', name: 'Unclear Pronoun Reference', color: 'var(--green)', loss: '-2' },
    { code: 'cs', name: 'Comma Splice', color: 'var(--red)', loss: '-3' },
    { code: 'wo', name: 'Word Order Error', color: 'var(--blue)', loss: '-2' },
    { code: 'par', name: 'Faulty Parallel Structure', color: 'var(--green)', loss: '-2' },
    { code: 'lift', name: 'Lifted from the Passage', color: 'var(--red)', loss: '-3' },
  ];

  const highlights = [
    { name: 'Grammar Cluster', bg: 'color-mix(in srgb, var(--yellow) 55%, transparent)' },
    { name: 'Vocabulary Issue', bg: 'color-mix(in srgb, var(--blue) 30%, transparent)' },
    { name: 'Structure Issue', bg: 'color-mix(in srgb, var(--amber) 30%, transparent)' },
    { name: 'Style Issue', bg: 'color-mix(in srgb, var(--accent-tertiary, var(--blue)) 45%, transparent)' },
    { name: 'Good Writing', bg: 'color-mix(in srgb, var(--green) 30%, transparent)' },
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

/* ── Landing setup — the shared step carousel ───────────
   Three questions, in this order and no other:

     1. which FAMILY of writing      ("Narrative" alone is not a thing you can
     2. which FORM inside it          be marked on — see js/forms.js)
     3. where the PROMPT comes from  — we write you one, you paste the one you
                                       were set, or you take one off the shelf

   Step 3 is the point of the ordering. A prompt is taught, marked and filed by
   its form, so it cannot be asked for until the form is settled — which is why
   the "your own prompt" box does not exist on the page until you get here. It
   is staged in the HTML and MOVED into the last two slides (js/own-task.js).
   ─────────────────────────────────────────────────────── */
let pickedFamily = null;
let pickedForm = null;
let pickedSource = null;
// Sharing belongs to the library — the Share button stays away until somebody
// has been there. See syncTopicDisplay().
let libraryVisited = false;

export function initSetup({ onGenerated, onDeepLink } = {}) {
  const mount = $('writing-setup');
  const beginBtn = $('begin-writing-btn');
  const refreshBtn = $('topic-refresh-btn');
  if (!mount) return;

  const carousel = createCarousel(mount);
  carousel.addSlide('family', 'Form');
  carousel.addSlide('style', 'Style');
  carousel.addSlide('source', 'Prompt');
  carousel.addSlide('own', 'Your task');
  carousel.addSlide('shelf', 'Library');

  function showFamilyStep() {
    renderChoiceStep(carousel, 'family', {
      title: 'What kind of writing?',
      subtitle: `${FAMILIES.length} families. Each one is marked differently.`,
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
      subtitle: 'Pick one, then say where the prompt should come from.',
      name: 'writing-form',
      colorOffset: 2,
      options: fam.forms.map((f) => ({
        value: f.id,
        label: f.label,
        note: f.blurb,
        checked: f.id === pickedForm,
      })),
      skipLabel: 'Use this',
      onPick: (formId) => {
        // Picking a form no longer writes a prompt on its own — that is now one
        // of three answers to the last question, not the only one.
        pickedForm = formId;
        setCurrentWritingType(formId);
        showSourceStep();
        carousel.goTo('source');
      },
    });
  }

  // ── Step 3 — where the prompt comes from ─────────────
  function showSourceStep() {
    const label = formLabel(pickedForm);
    renderChoiceStep(carousel, 'source', {
      title: `${label} — where is the prompt coming from?`,
      subtitle: 'Ours, yours, or one already on the shelf. You can come back and swap.',
      name: 'writing-source',
      colorOffset: 4,
      options: [
        { value: 'generate', label: 'Write me one', note: `an original ${label.toLowerCase()} prompt`, checked: pickedSource === 'generate' },
        { value: 'own', label: 'I have my own', note: 'paste the prompt you were set', checked: pickedSource === 'own' },
        { value: 'library', label: 'From the library', note: `prompts kept under ${label}`, checked: pickedSource === 'library' },
      ],
      skipLabel: 'Use this',
      onPick: (src) => {
        pickedSource = src;
        if (src === 'generate') { generate(pickedForm); return; }
        if (src === 'own') { showOwnStep(); carousel.goTo('own'); return; }
        showShelfStep();
        carousel.goTo('shelf');
      },
    });
  }

  // The last two slides are not built from options — they hold the real
  // elements, moved here from the page so every id and listener survives.
  function showOwnStep() {
    const els = ownTaskEls();
    if (!els) return;
    renderCustomStep(carousel, 'own', {
      title: 'Your own task',
      subtitle: `It will be taught and marked as ${formLabel(pickedForm)} — and kept in the library under it.`,
      content: els.panel,
    });
    els.focusPrompt();
  }

  function showShelfStep() {
    const els = ownTaskEls();
    if (!els || !els.shelf) return;
    libraryVisited = true;
    syncTopicDisplay();
    renderCustomStep(carousel, 'shelf', {
      title: 'On the shelf',
      subtitle: 'Prompts already filed under this form — yours, and any we have published.',
      content: els.shelf,
    });
    els.refreshShelf();
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

  // Teachers get an Assign button on the slip. Resolves quietly to nothing for
  // everybody else — the roster endpoint behind it is teachers-only.
  initAssign();

  // Another prompt for the SAME form — the point of the refresh is to reroll
  // the topic, not to send you back through the picker.
  refreshBtn?.addEventListener('click', () => { if (pickedForm) generate(pickedForm); });

  // Their own prompt/video. The panel and the shelf are wired here and then
  // handed to the last two slides above — there is no other door into them.
  initOwnTask({
    onChange: () => {
      syncTopicDisplay();
      if (beginBtn) beginBtn.disabled = !currentTopic;
    },
    // A saved or shared task carries its form, so the whole walk can be
    // replayed: family → form → "I have my own" → the box holding it.
    onFormRestored: (formId) => {
      if (getForm(formId)) {
        pickedForm = formId;
        pickedFamily = familyOf(formId);
        pickedSource = 'own';
        showFamilyStep();
        showStyleStep();
        showSourceStep();
      }
      showOwnStep();
      carousel.start('family');
      if (getForm(formId)) { carousel.goTo('style'); carousel.goTo('source'); }
      carousel.goTo('own');
    },
    // A slip taken off the shelf is already applied; land them on the box so
    // they can see what they picked, edit it, or clear it. The shelf is stepped
    // out of rather than stacked on — the two are siblings, not a sequence.
    onLibraryPick: () => {
      showOwnStep();
      if (carousel.current() === 'shelf') carousel.back();
      carousel.goTo('own');
    },
    /* A task followed from a link opens itself. The carousel is still walked
       to the right step underneath (onFormRestored, above), so closing the
       modal lands them on the setup they would have had — but they are not
       made to walk it first to reach a task somebody already chose for them. */
    onDeepLink: () => onDeepLink?.(),
  });
}

// ── Sync Topic Display ─────────────────────────────────
export function syncTopicDisplay() {
  const topicDisplay = $('topic-display');
  if (topicDisplay) {
    topicDisplay.textContent = currentTopic
      || 'Pick a form above, then say where the prompt should come from.';
  }
  const flag = $('topic-own-flag');
  if (flag) flag.hidden = !customTask.usePrompt;
  /* Sharing is a LIBRARY action. Setting yourself a task is the common case and
     it needs no share button in the way — the prompt is filed either way. So the
     button only appears once somebody has actually been to the library, which is
     where handing a task to somebody else belongs. */
  const shareBtn = $('topic-share-btn');
  if (shareBtn) shareBtn.style.display = (libraryVisited && canShareTask()) ? '' : 'none';
  // Assigning is a teacher's action and is NOT gated on the library — a teacher
  // setting a task for a class is the point of the page, not a library errand.
  syncAssignBtn();
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

/* ── The wall chart ────────────────────────────────────
   One tile per letter of the form's mnemonic (js/forms.js), in the shared
   sticky-note palette — fixed light pastels with dark ink, so the chart reads
   the same in either theme and looks like paper pinned to a wall rather than
   like chrome. See [[ui-reuse-shared-components]]: this is .pp-sticky, not a
   new card. `keyColorClass` lives in forms.js because THREE views paint the
   same four steps and they all have to agree: this chart, the blocks of the
   model text below it, and the boxes of the planner the student writes in. */
function mnemonicChartHtml(formId) {
  const mn = getMnemonic(formId);
  if (!mn) return '';
  return `
    <div class="mchart">
      <p class="mchart__hdr">
        <span class="mchart__word">${mn.word.split('').map((c, i) =>
          `<span class="mchart__wl ${keyColorClass(i)}">${esc(c)}</span>`).join('')}</span>
        <span class="mchart__gloss">${esc(mn.gloss)}</span>
      </p>
      <div class="mchart__grid">
        ${mn.keys.map((k, i) => `
          <div class="mchart__tile pp-sticky ${keyColorClass(i)}" style="--pp-note-tilt:${(i % 2 ? 1 : -1) * (0.8 + (i % 3) * 0.5)}deg">
            <span class="mchart__k">${esc(k.k)}</span>
            <span class="mchart__name">${esc(k.name)}</span>
            <span class="mchart__what">${esc(k.what)}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

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

  /* The chart comes BEFORE the shape list on purpose. The list is the
     explanation and the chart is the thing to remember; a student who reads
     only the first screen should leave with the word. */
  paper.innerHTML = `
    <p class="lesson-eyebrow">${esc(form.label)}</p>
    <h3 class="lesson-title">${esc(form.blurb)}</h3>
    <p class="lesson-what">${esc(form.lesson.what)}</p>
    <p class="lesson-head">Remember it as</p>
    ${mnemonicChartHtml(formId)}
    <p class="lesson-head">How it is shaped</p>
    <ol class="lesson-list">${li(form.lesson.shape)}</ol>
    <p class="lesson-head">What marks it out</p>
    <ul class="lesson-list lesson-list--plain">${li(form.lesson.moves)}</ul>
    <p class="lesson-head">A model</p>
    <div id="lesson-model-zone">${modelStubHtml(form)}</div>
    ${videoLine}
    ${task}`;

  $('lesson-model-btn')?.addEventListener('click', () => loadModelText());
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

/* ── The model text ────────────────────────────────────
   What sits under "A model" before anybody asks for one: the hand-written
   extract from the registry, plus the offer of a whole piece. The extract is
   not thrown away when the AI writes one — it is the fallback for a student
   who is signed out or over quota, and it costs nothing to leave in place
   until the real thing arrives.

   The generated piece is only ever a NEIGHBOURING task (js/api.js), and the
   task it answers is printed at the top of it so a student can see that for
   themselves. Every block is tagged with the letter of the mnemonic it
   demonstrates, in the tile's own colour — the chart above says what the move
   is, and the model shows the paragraph doing it. */
function modelStubHtml(form) {
  return `
    <p class="lesson-model">${esc(form.lesson.model).replace(/\n\n/g, '<br><br>')}</p>
    <div class="lmodel__ask">
      <button class="btn btn-ghost lmodel__btn" id="lesson-model-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 5h11" /><path d="M4 10h16" /><path d="M4 15h9" />
          <path d="m15.5 20 5-5" /><path d="M18 17.5 20.5 20" />
        </svg>
        Write me a full model
      </button>
      <span class="lmodel__note">On a different task in the same form — never on your own prompt.</span>
    </div>`;
}

function modelHtml(model, mn) {
  /* Tiles are matched to blocks by POSITION, not by letter: OTTO, MOOD and
     ADDS repeat a letter, so `k` alone could not say which tile a block
     belongs to. The parse (js/api.js normaliseModel) already guarantees the
     blocks arrive in the mnemonic's order and one per key. */
  const source = model.source.length
    ? `<div class="lmodel__source">
         <p class="lmodel__srclbl">The passage it summarises</p>
         ${model.source.map((p, i) => `<p class="lmodel__srcp"><span class="passage-num">${i + 1}</span>${esc(p)}</p>`).join('')}
       </div>`
    : '';

  return `
    <div class="lmodel">
      <p class="lmodel__tasklbl">A different task, in the same form</p>
      <p class="lmodel__task">${esc(model.task)}</p>
      ${source}
      ${model.parts.map((p, i) => `
        <div class="lmodel__part">
          <span class="lmodel__chip pp-sticky ${keyColorClass(i)}" title="${esc(mn.keys[i].name)}">
            <span class="lmodel__chipk">${esc(mn.keys[i].k)}</span>
            <span class="lmodel__chipn">${esc(mn.keys[i].name)}</span>
          </span>
          <div class="lmodel__text">
            ${p.text.split(/\n{2,}/).map((par) => `<p>${esc(par)}</p>`).join('')}
          </div>
        </div>`).join('')}
      <p class="lmodel__foot">Every block is one move of <strong>${esc(mn.word)}</strong>, in order. Your own piece should make the same moves about something else entirely.</p>
    </div>`;
}

let modelLoading = false;

export async function loadModelText() {
  const zone = $('lesson-model-zone');
  const mn = getMnemonic(currentWritingType);
  const form = getForm(currentWritingType);
  if (!zone || !mn || !form || modelLoading) return;

  modelLoading = true;
  const btn = $('lesson-model-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Writing you one…'; }

  try {
    const model = await fetchModelText(currentWritingType, { topic: currentTopic });
    if (model) {
      zone.innerHTML = modelHtml(model, mn);
      // The model can be long, and it sits above the prompt at the foot of the
      // lesson — bring its top into view rather than leaving the student
      // wherever the button used to be.
      zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      throw new Error('unusable model');
    }
  } catch (err) {
    console.warn('[Writing] model text unavailable:', err.message);
    zone.innerHTML = modelStubHtml(form);
    const note = zone.querySelector('.lmodel__note');
    if (note) {
      note.textContent = 'Could not write one just then — the extract above still shows the voice. Try again in a moment.';
      note.classList.add('is-bad');
    }
    $('lesson-model-btn')?.addEventListener('click', () => loadModelText());
  } finally {
    modelLoading = false;
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

/* ── Where the video shows ──────────────────────────────
   There is ONE video panel and it moves. It used to live inside the Learn
   phase and nowhere else, which was fine while the only way onto the sheet
   was through the lesson. A task opened from a short link (/w/<code>) skips
   Learn entirely, so the student would have been shown a "Watch a video"
   button whose video appeared in a section that was not on screen.

   Its home is remembered rather than assumed, so putting it back after a trip
   to the planner does not leave it hanging below the lesson's end marker. */
const VIDEO_HOSTS = ['lesson-section', 'summary-section', 'plan-section', 'editor-section'];
let videoHome = null;

function homeTheVideo(wrap) {
  if (!videoHome) videoHome = { parent: wrap.parentElement, next: wrap.nextElementSibling };
  const host = VIDEO_HOSTS.map((id) => $(id)).find((el) => el && el.style.display !== 'none');
  if (!host || wrap.parentElement === host) return;
  if (host === videoHome.parent) videoHome.parent.insertBefore(wrap, videoHome.next);
  else host.appendChild(wrap);
}

export async function loadLessonVideo() {
  const form = getForm(currentWritingType);
  const wrap = $('lesson-video');
  // Three buttons, one search — whichever phase they pressed it in, all of
  // them go quiet while it runs.
  const setBusy = (v) => ['lesson-video-btn', 'organize-video-btn', 'plan-video-btn']
    .forEach((id) => { const b = $(id); if (b) b.disabled = v; });
  if (!wrap) return;

  homeTheVideo(wrap);

  // Already loaded — moving it was the whole job; just take them to it.
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
  setBusy(true);

  /* The search is built from the FORM and the PROMPT together (js/api.js
     videoQueryFor) — a news report on a flooded road and one on a school
     competition do not want the same lesson. But a narrower search is only
     better when it returns something, so a miss falls back to the form's own
     query rather than telling the student there is no video. */
  const narrow = videoQueryFor(currentWritingType, currentTopic);
  let results = await youtubeSearch(narrow, { maxResults: 3 });
  if (!results.length && narrow !== form.video) {
    results = await youtubeSearch(form.video, { maxResults: 3 });
  }
  setBusy(false);

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

/* Phases: learn → write → results, with a planning step in between. Which
   planning step depends on the form — 'organise' is the summary's own
   graphic organiser (js/summary.js), 'plan' is the mnemonic planner every
   other form gets (js/planner.js) — but they are the same stage of the same
   journey and both feed the same sheet. Everything after the assemble button
   is identical for every form. */
export function showPhase(phase) {
  const lessonSec = $('lesson-section');
  const summarySec = $('summary-section');
  const planSec = $('plan-section');
  const editorSec = $('editor-section');
  const resultsSec = $('results-section');
  const ftrLearn = $('ftr-learn');
  const ftrOrganize = $('ftr-organize');
  const ftrPlan = $('ftr-plan');
  const ftrWrite = $('ftr-write');
  const ftrResults = $('ftr-results');
  const mhdrPhase = $('mhdr-phase');

  const show = (el, on, mode = 'block') => { if (el) el.style.display = on ? mode : 'none'; };

  show(lessonSec, phase === 'learn');
  show(summarySec, phase === 'organize');
  show(planSec, phase === 'plan');
  show(editorSec, phase === 'write');
  resultsSec?.classList.toggle('active', phase === 'results');

  show(ftrLearn, phase === 'learn', 'flex');
  show(ftrOrganize, phase === 'organize', 'flex');
  show(ftrPlan, phase === 'plan', 'flex');
  show(ftrWrite, phase === 'write', 'flex');
  show(ftrResults, phase === 'results', 'flex');

  if (mhdrPhase) {
    mhdrPhase.textContent = phase === 'learn' ? 'Learn'
      : phase === 'organize' ? 'Organise'
      : phase === 'plan' ? 'Plan'
      : phase === 'write' ? 'Write'
      : 'Results';
  }
  // The sheet is titled by what is on it — a summary paragraph is not an essay.
  const editorLabel = $('editor-label');
  if (editorLabel) editorLabel.textContent = isSummaryMode() ? 'Your Summary Paragraph' : 'Your Essay';

  if (phase !== 'learn') $('modal-body')?.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Rewrite styles ────────────────────────────────────
   These are in style.css now, in the page's own tokens. They were injected
   here as a hardcoded block — 2px solid #0a0a0a with a hard offset shadow,
   the brutalist look the site left behind — and being injected at runtime it
   outranked the stylesheet, so the REWRITE stamp stayed black-on-white long
   after everything around it had gone to soft paper. Kept as a no-op because
   main.js calls it on load. */
export function injectRewriteStyles() { /* see style.css → REWRITE STAMP */ }
