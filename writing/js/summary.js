/* ═══════════════════════════════════════════════════════
   THE GRAPHIC ORGANISER — how a summary gets written here.

   A summary fails in one of two ways, and a blank sheet invites both: the
   student either re-tells the first paragraph and stops, or copies sentences
   out of the passage and joins them up. The organiser makes both harder by
   changing the shape of the task. Instead of "summarise this", it asks the
   only question a student can actually answer — "what is THIS paragraph
   saying?" — once per paragraph, with that paragraph sitting next to the box.

   So the write phase has two steps:

     ORGANISE   one card per source paragraph, each with the paragraph on one
                side and a one-sentence box on the other, plus an optional
                opening line for the overall idea.
     PARAGRAPH  the boxes are assembled, in order, into the ordinary writing
                sheet — which from that point behaves exactly as it does for
                every other form, so grading, marking and results are unchanged.

   Going back is free and non-destructive: the sentences stay in the cards, the
   assembled draft stays on the sheet, and nothing is overwritten until the
   student presses the rebuild button, which says so.
═══════════════════════════════════════════════════════ */

import { $, currentPassage, customTask, safe } from './config.js';

// One sentence per source paragraph, plus [0] for the optional opening line.
// Kept here rather than in config because nothing outside this step needs it —
// what leaves the module is the assembled paragraph and the coverage plan.
let sentences = [];
let ideaSentence = '';
let passageKey = '';

const IDEA_PLACEHOLDER = 'Optional — one sentence saying what the whole passage is about.';

const CHEVRON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
  stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;

/* ── Small text helpers ────────────────────────────────── */
const words = (s) => (String(s).trim() ? String(s).trim().split(/\s+/) : []);
const wordCount = (s) => words(s).length;

// Sentence-ish count. Deliberately crude — it exists to say "that looks like
// two sentences", not to parse English, so an abbreviation counting as a stop
// is an acceptable price for something that never blocks the student.
const sentenceCount = (s) => (String(s).trim().match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || []).length;

/* Longest run of words this box shares with its source paragraph. Six is the
   line the examiner is given for "lifted" (js/api.js), so the organiser warns
   at the same number — the student should never be told one thing while
   writing and marked by another. */
function longestSharedRun(a, b) {
  const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
  const A = clean(a);
  const B = clean(b);
  if (!A.length || !B.length) return 0;

  let best = 0;
  let prev = new Array(B.length + 1).fill(0);
  for (let i = 1; i <= A.length; i += 1) {
    const cur = new Array(B.length + 1).fill(0);
    for (let j = 1; j <= B.length; j += 1) {
      if (A[i - 1] === B[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

// A sentence the assembler can put next to another one: capital at the front,
// a full stop at the back, no double spaces in the middle.
function tidy(raw) {
  let s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += '.';
  return s;
}

/* ── State ─────────────────────────────────────────────── */

/* THE flag for "are we summarising?", used by the setup screen, the lesson,
   the phases, the sheet and the examiner alike. A student's own prompt beats
   whatever was generated before it (js/own-task.js: last action wins), so a
   loaded passage that has been overridden must stop counting as the task —
   without being thrown away, since clearing the custom prompt hands the
   generated task straight back. */
export const isSummaryMode = () =>
  !customTask.usePrompt && !!(currentPassage && currentPassage.paragraphs?.length);

// The passage identity, so a new passage clears the boxes but a Retry on the
// same one keeps everything the student already worked out.
const keyOf = (p) => (p ? `${p.title}::${p.paragraphs.length}::${p.paragraphs[0]?.slice(0, 40)}` : '');

export function resetOrganizer() {
  sentences = [];
  ideaSentence = '';
  passageKey = '';
}

export function organizerProgress() {
  const total = currentPassage?.paragraphs.length || 0;
  let filled = 0;
  for (let i = 0; i < total; i += 1) if ((sentences[i] || '').trim()) filled += 1;
  return { filled, total, complete: total > 0 && filled === total };
}

// What the examiner is shown alongside the paragraph, so "you missed paragraph
// 4" is a check rather than a guess (js/api.js).
export function getPlan() {
  const rows = [];
  if (ideaSentence.trim()) rows.push({ label: 'Main idea', sentence: ideaSentence.trim() });
  (currentPassage?.paragraphs || []).forEach((_, i) => {
    if ((sentences[i] || '').trim()) rows.push({ label: `Paragraph ${i + 1}`, sentence: sentences[i].trim() });
  });
  return rows;
}

export function assembleParagraph() {
  const parts = [];
  if (ideaSentence.trim()) parts.push(tidy(ideaSentence));
  (currentPassage?.paragraphs || []).forEach((_, i) => {
    if ((sentences[i] || '').trim()) parts.push(tidy(sentences[i]));
  });
  return parts.join(' ');
}

// About a third of the source is the standard instruction, so the target is
// computed from the passage in front of them rather than being a fixed number
// that is wrong for half the passages.
export function lengthTarget() {
  const src = (currentPassage?.paragraphs || []).reduce((n, p) => n + wordCount(p), 0);
  const mid = Math.round(src / 3);
  const lo = Math.max(50, Math.round((mid * 0.75) / 5) * 5);
  const hi = Math.round((mid * 1.25) / 5) * 5;
  return { src, lo, hi };
}

/* ── The passage, printed ──────────────────────────────── */
/* Used twice: in the Learn phase (where reading it to the end is what unlocks
   the writing) and collapsed above the sheet in the paragraph step, because a
   summary that cannot see its source is a memory test. */
export function passageHtml() {
  if (!isSummaryMode()) return '';
  const { src } = lengthTarget();
  return `
    <div class="passage">
      <p class="passage-eyebrow">The passage — ${currentPassage.paragraphs.length} paragraphs, ${src} words</p>
      <h4 class="passage-title">${safe(currentPassage.title)}</h4>
      ${currentPassage.paragraphs.map((p, i) => `
        <p class="passage-para"><span class="passage-num">${i + 1}</span>${safe(p)}</p>`).join('')}
    </div>`;
}

/* ── The organiser ─────────────────────────────────────── */

export function buildOrganizer({ onChange } = {}) {
  const host = $('summary-section');
  if (!host || !isSummaryMode()) return;

  // New passage → new boxes. Same passage → leave the student's work alone.
  const key = keyOf(currentPassage);
  if (key !== passageKey) {
    passageKey = key;
    sentences = new Array(currentPassage.paragraphs.length).fill('');
    ideaSentence = '';
  }

  const { lo, hi } = lengthTarget();

  host.innerHTML = `
    <p class="sec-label">The Organiser</p>
    <p class="org-intro">
      One sentence for each paragraph, in your own words — then turn the boxes into a single
      paragraph. You can come back and change any sentence afterwards.
      Aim for about ${lo}–${hi} words in the end.
    </p>

    <div class="org-flow">
      <div class="org-card org-card--idea">
        <div class="org-card__hdr">
          <span class="org-num org-num--idea">Idea</span>
          <span class="org-card__ttl">The whole passage in one line <em>optional</em></span>
        </div>
        <div class="org-card__body org-card__body--idea">
          <div class="org-in">
            <textarea class="org-field" id="org-idea" rows="2" placeholder="${IDEA_PLACEHOLDER}"></textarea>
            <div class="org-meta" data-meta="idea"></div>
          </div>
        </div>
      </div>

      ${currentPassage.paragraphs.map((p, i) => `
        <div class="org-arrow" aria-hidden="true">${CHEVRON}</div>
        <div class="org-card" data-card="${i}">
          <div class="org-card__hdr">
            <span class="org-num">${i + 1}</span>
            <span class="org-card__ttl">What is paragraph ${i + 1} saying?</span>
          </div>
          <div class="org-card__body">
            <p class="org-src">${safe(p)}</p>
            <div class="org-in">
              <textarea class="org-field" data-i="${i}" rows="3"
                placeholder="One sentence, in your own words…"></textarea>
              <div class="org-meta" data-meta="${i}"></div>
            </div>
          </div>
        </div>`).join('')}

      <div class="org-arrow" aria-hidden="true">${CHEVRON}</div>
      <div class="org-foot">
        <p class="org-foot__hdr">Your summary paragraph so far</p>
        <p class="org-preview" id="org-preview"></p>
        <p class="org-foot__meta" id="org-foot-meta"></p>
      </div>
    </div>`;

  const idea = host.querySelector('#org-idea');
  idea.value = ideaSentence;
  idea.addEventListener('input', () => {
    ideaSentence = idea.value;
    refreshMeta('idea', ideaSentence, null);
    refreshFoot();
    onChange?.();
  });

  host.querySelectorAll('.org-field[data-i]').forEach((field) => {
    const i = Number(field.dataset.i);
    field.value = sentences[i] || '';
    field.addEventListener('input', () => {
      sentences[i] = field.value;
      refreshMeta(i, field.value, currentPassage.paragraphs[i]);
      refreshFoot();
      onChange?.();
    });
    refreshMeta(i, field.value, currentPassage.paragraphs[i]);
  });

  refreshMeta('idea', ideaSentence, null);
  refreshFoot();
}

/* The line under each box. It is a coach, not a gate: everything here is
   advice, and none of it stops the student pressing on. */
function refreshMeta(id, value, source) {
  const el = document.querySelector(`.org-meta[data-meta="${id}"]`);
  if (!el) return;

  const n = wordCount(value);
  if (!n) {
    el.className = 'org-meta';
    el.textContent = id === 'idea' ? 'Optional' : 'Empty';
    return;
  }

  const notes = [];
  let bad = false;

  const s = sentenceCount(value);
  if (s > 1) { notes.push(`${s} sentences — this box wants one`); bad = true; }

  if (source && longestSharedRun(value, source) >= 6) {
    notes.push('this looks copied from the passage — say it your own way');
    bad = true;
  }

  el.className = `org-meta${bad ? ' is-bad' : ' is-ok'}`;
  el.textContent = notes.length ? `${n} words · ${notes.join(' · ')}` : `${n} words`;
}

function refreshFoot() {
  const preview = $('org-preview');
  const meta = $('org-foot-meta');
  if (!preview || !meta) return;

  const text = assembleParagraph();
  const { filled, total } = organizerProgress();
  const { lo, hi } = lengthTarget();
  const n = wordCount(text);

  preview.textContent = text || 'Fill the boxes above and your paragraph builds itself here.';
  preview.classList.toggle('is-empty', !text);

  const missing = total - filled;
  meta.textContent = missing
    ? `${filled} of ${total} paragraphs covered — ${missing} still to do.`
    : `All ${total} paragraphs covered · ${n} words (aim for ${lo}–${hi}).`;
  meta.className = missing ? 'org-foot__meta' : 'org-foot__meta is-ok';
}

/* ── The aids that follow the student onto the sheet ────── */
/* The source (collapsed, because by now they have read it) and a row of
   linking words. Joining the boxes is the step the organiser cannot do for
   them — the connectives are what turn six correct sentences into a paragraph
   rather than a list — so the words are put within one click of the caret. */
const LINKERS = [
  'The passage explains that', 'The writer argues that', 'However,', 'In addition,',
  'As a result,', 'By contrast,', 'Once', 'Afterwards,', 'Both sides', 'Finally,',
];

export function buildSheetAids({ onInsert } = {}) {
  const host = $('summary-aids');
  if (!host) return;

  if (!isSummaryMode()) {
    host.hidden = true;
    host.innerHTML = '';
    return;
  }

  host.hidden = false;
  host.innerHTML = `
    <details class="sum-source">
      <summary>Read the passage again</summary>
      ${passageHtml()}
    </details>
    <div class="sum-linkers">
      <span class="sum-linkers__lbl">Linking words — tap to drop one in</span>
      <div class="sum-linkers__row">
        ${LINKERS.map((w, i) => `<button type="button" class="pp-sticky pp-sticky--tape pp-note-btn sum-linker pp-sticky--c${i % 6}" data-w="${safe(w)}">${safe(w)}</button>`).join('')}
      </div>
    </div>`;

  host.querySelectorAll('.sum-linker').forEach((btn) => {
    btn.addEventListener('click', () => {
      insertAtCaret($('writing-area'), btn.dataset.w);
      onInsert?.();
    });
  });
}

// Drop the word in where the caret is, with the spacing already right, and
// leave the caret after it so the student can keep typing.
function insertAtCaret(area, text) {
  if (!area) return;
  const start = area.selectionStart ?? area.value.length;
  const end = area.selectionEnd ?? start;
  const before = area.value.slice(0, start);
  const after = area.value.slice(end);
  const lead = before && !/\s$/.test(before) ? ' ' : '';
  const tail = after && !/^\s/.test(after) ? ' ' : '';
  const piece = `${lead}${text}${tail}`;

  area.value = before + piece + after;
  const caret = start + lead.length + text.length;
  area.setSelectionRange(caret, caret);
  area.focus();
  area.dispatchEvent(new Event('input', { bubbles: true }));
}
