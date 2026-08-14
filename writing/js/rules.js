/* ═══════════════════════════════════════════════════════
   THE RULES OF THE SHEET — what a draft must be before it may be marked.

   Everywhere else on this page the coaching is advice: the organiser's meta
   line, the length target, the lesson. This file is the one place that says
   NO. It exists because the commonest way to waste a marking is to submit
   three sentences and a full stop, and because the shape of a piece is part
   of the form — a five-paragraph essay written as one block has already lost
   the marks that Structure & Coherence carries, and it is kinder to say so on
   the sheet than in the results.

   The four rules:

     WORDS       more than 150 — except a SUMMARY, where length is not a
                 virtue: the target is about a third of its own passage, and
                 a floor that outran that third would be telling the student
                 to pad the one form whose whole skill is compression.
     PARAGRAPHS  at least 5 — except NARRATIVE, which is paced by its story
                 rather than by a plan, and except a SUMMARY, which is one
                 paragraph by definition and could not obey the rule at all.
     SENTENCES   at least 5 per paragraph, except the introduction, which is
                 allowed to be short because its job is to open, not to argue.
     LENGTH      at least 7 words in every sentence.

   So a summary is held only to its sentences — which is right. What keeps it
   from being three words long is its own machinery: the organiser will not
   open the sheet until every source paragraph has a box, and the examiner
   marks anything under ~30 meaningful words as off-topic (js/api.js).

   Two things are deliberately NOT counted. A line with no full stop and ten
   words or fewer is a HEADING, not a paragraph — a headline, a diary date, a
   salutation, a sign-off, a report heading — and several forms taught here
   require one, so it is skipped rather than failed. And the copy/paste lock
   below is not a rule about the text: it is a rule about how the text got
   there. Nothing on the sheet may be pasted in and nothing may be copied out.
═══════════════════════════════════════════════════════ */

import { currentWritingType, currentLevel } from './config.js';
import { familyOf } from './forms.js';
import { getLevel } from './levels.js';
import { showTip } from './tip.js';

/* The numbers above are the JUNIOR (Grades 7–9) gate, which is what this file
   enforced for everybody before the level question existed. They are kept as
   the exported names because other modules quote them, but the live figures
   now come from the chosen band — see js/levels.js, and rulesFor() below. */
export const MIN_WORDS = 150;              // strictly MORE than this
export const MIN_PARAGRAPHS = 5;
export const MIN_SENTENCES = 5;            // per paragraph, intro excepted
export const MIN_SENTENCE_WORDS = 7;

// A "word" is anything with a letter or digit in it, so an em dash on its own
// does not inflate the count and the footer never disagrees with the gate.
const wordsIn = (s) => String(s || '').trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
const wordCount = (s) => wordsIn(s).length;

/* Abbreviations that end in a full stop and are not the end of a sentence.
   Without this "Dr. Ade arrived" is two sentences, the first of them one word
   long, and a student is failed by a rule they did not break. */
const ABBR = /\b(?:mr|mrs|ms|dr|prof|rev|sr|jr|st|vs|etc|no|fig|dept|govt|approx|e\.g|i\.e)\.$/i;

/* Sentence-ish splitting. A stop only ends a sentence when whitespace or the
   end of the line follows it (so 3.5 and www.x.org survive), and any closing
   quote or bracket is allowed to sit between the stop and that whitespace. */
export function splitSentences(para) {
  const raw = String(para || '').match(/[^.!?…]+[.!?…]+["'”’)\]]*(?=\s|$)|[^.!?…]+$/g) || [];
  const out = [];
  raw.forEach((piece) => {
    const prev = out[out.length - 1];
    if (prev !== undefined && ABBR.test(prev.trim())) out[out.length - 1] = prev + piece;
    else out.push(piece);
  });
  return out.map((s) => s.trim()).filter(Boolean);
}

/* A heading rather than a paragraph: no terminal stop, and short. Every form
   that needs one (news headline, diary date, Dear Sir/Madam, Yours faithfully,
   FINDINGS) lands here, and nothing that is genuinely a paragraph does. */
function isHeading(line) {
  const t = String(line).trim();
  if (!t) return true;
  if (/[.!?…]$/.test(t.replace(/["'”’)\]]+$/, ''))) return false;
  return wordCount(t) <= 10;
}

// Any line break starts a new paragraph — that is what the Enter key means to
// a student, and a textarea soft-wraps, so nothing here is an accident.
export function splitParagraphs(text) {
  return String(text || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);
}

/* Which rules this form is actually held to. The exemptions are the whole
   reason this is a function: a personal narrative and a summary are not badly
   written for being shaped differently. */
export function rulesFor({ summary = false, formId = currentWritingType, levelId = currentLevel } = {}) {
  const exemptParagraphs = summary || familyOf(formId) === 'narrative';
  // The floors are the LEVEL's, not the page's: a Grade 5 piece is finished at
  // 80 words and three paragraphs, and a Grade 11 one is not finished at 150.
  const g = getLevel(levelId).gate;
  return {
    minWords: summary ? 0 : g.minWords,
    minParagraphs: exemptParagraphs ? 0 : g.minParagraphs,
    minSentences: g.minSentences,
    minSentenceWords: g.minSentenceWords,
    // Why a rule is missing, in the student's words. A rule that silently
    // disappears reads as a bug — and the summary's word note has to point at
    // the number that DOES govern it, or the row is just an absence.
    wordNote: 'A summary is about a third of its passage — the organiser says what to aim for.',
    paragraphNote: summary
      ? 'A summary is one paragraph, so there is no paragraph count to meet.'
      : exemptParagraphs
        ? 'Narrative writing is paced by its story, so there is no paragraph count to meet.'
        : '',
  };
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* ── The check ──────────────────────────────────────────
   Returns the rules as a list of rows, because that is how they are shown:
   a checklist under the sheet that fills in as the student writes, not an
   error message thrown at them when they press submit. */
export function checkDraft(text, { summary = false, formId = currentWritingType, levelId = currentLevel } = {}) {
  const R = rulesFor({ summary, formId, levelId });
  const words = wordCount(text);
  const blocks = splitParagraphs(text);
  const paragraphs = blocks.filter((b) => !isHeading(b));

  const rows = [];

  if (R.minWords) {
    rows.push({
      id: 'words',
      label: `More than ${R.minWords} words`,
      ok: words > R.minWords,
      detail: words
        ? (words > R.minWords ? `${plural(words, 'word', 'words')}` : `${plural(words, 'word', 'words')} — ${R.minWords + 1 - words} to go`)
        : 'nothing written yet',
    });
  } else {
    rows.push({
      id: 'words',
      label: 'Length',
      ok: true,
      exempt: true,
      detail: words ? `${R.wordNote} ${plural(words, 'word', 'words')} so far.` : R.wordNote,
    });
  }

  if (R.minParagraphs) {
    rows.push({
      id: 'paragraphs',
      label: `At least ${R.minParagraphs} paragraphs`,
      ok: paragraphs.length >= R.minParagraphs,
      detail: paragraphs.length
        ? `${plural(paragraphs.length, 'paragraph', 'paragraphs')} so far`
        : 'start a new line for each new paragraph',
    });
  } else {
    rows.push({
      id: 'paragraphs',
      label: 'Paragraphs',
      ok: true,
      exempt: true,
      detail: R.paragraphNote,
    });
  }

  // Every paragraph after the introduction needs its five sentences. The
  // introduction is exempt, so with one paragraph on the sheet there is
  // nothing to fail yet — the row stays open rather than pretending to pass.
  const thin = [];
  paragraphs.forEach((p, i) => {
    if (i === 0) return;
    const n = splitSentences(p).length;
    if (n < R.minSentences) thin.push({ i: i + 1, n });
  });
  rows.push({
    id: 'sentences',
    label: `${R.minSentences} sentences in every paragraph after the first`,
    ok: thin.length === 0,
    detail: thin.length
      ? `${thin.map((t) => `paragraph ${t.i} has ${t.n}`).join(', ')}`
      : (paragraphs.length > 1 ? 'every paragraph is long enough' : 'the introduction is exempt'),
  });

  // The 7-word floor is checked on the whole sheet, headings included in
  // nothing — a headline is not a sentence and is not measured as one.
  const short = [];
  paragraphs.forEach((p, i) => {
    splitSentences(p).forEach((s) => {
      const n = wordCount(s);
      if (n < R.minSentenceWords) short.push({ para: i + 1, n, text: s });
    });
  });
  rows.push({
    id: 'sentence-length',
    label: `${R.minSentenceWords} words in every sentence`,
    ok: short.length === 0,
    detail: short.length
      ? `${plural(short.length, 'sentence is', 'sentences are')} too short — “${short[0].text.slice(0, 48)}${short[0].text.length > 48 ? '…' : ''}” has ${short[0].n}`
      : (words ? 'no short sentences' : 'nothing written yet'),
  });

  /* A summary exempt from both counts can hold an empty sheet with nothing
     unmet on it, which would leave the tally saying "all met" over a disabled
     Submit. An empty sheet is its own state and is reported as one. */
  const broken = rows.filter((r) => !r.ok);
  return {
    empty: words === 0,
    ok: broken.length === 0 && words > 0,
    words,
    paragraphs: paragraphs.length,
    rows,
    broken: broken.length,
  };
}

/* ── The sentence you just finished ─────────────────────
   The checklist is a summary and summaries are read late: a student who
   writes eleven short sentences finds out about all eleven at the end, by
   which time fixing them is a rewrite. So the moment a full stop is typed,
   the sentence it closed is measured and said out loud.

   The trigger is the terminator, not the keystroke. Deleting back past a full
   stop must not scold anybody, and neither must moving the caret, so the
   caller passes whether the text GREW — anything else is not somebody
   finishing a sentence. Returns null when there is nothing to say, which is
   almost always; this runs on every keypress. */
export function justClosedSentence(text, { grew = true } = {}) {
  if (!grew) return null;
  const t = String(text || '');
  // A terminator, optionally behind a closing quote or bracket, at the very
  // end of what has been typed. Trailing spaces are fine — the student has
  // finished the sentence and moved on.
  if (!/[.!?…]["'”’)\]]*\s*$/.test(t)) return null;
  // An abbreviation is not the end of a sentence, and "..." is one mark.
  if (ABBR.test(t.trimEnd())) return null;

  // The last paragraph is where the caret is, by definition — the terminator
  // was just typed at the very end of the text.
  const paraStart = t.lastIndexOf('\n') + 1;
  const para = t.slice(paraStart);
  const sentences = splitSentences(para);
  const last = sentences[sentences.length - 1];
  if (!last) return null;

  const n = wordCount(last);
  if (n >= MIN_SENTENCE_WORDS) return null;

  // Character offsets too, so the warning can be a tooltip pointing AT the
  // sentence rather than a line of text somewhere else on the page.
  const at = para.lastIndexOf(last);
  const start = at === -1 ? paraStart : paraStart + at;
  return { text: last, words: n, need: MIN_SENTENCE_WORDS, start, end: start + last.length };
}

/* ── The checklist under the sheet ──────────────────────── */

const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12.5 5 5L20 6.5"/></svg>`;
const OPEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"
  stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg>`;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Redrawn on every keystroke. Transient messages are NOT in here — they are
   tooltips over the text they are about (js/tip.js), which is also what keeps
   them alive: anything rendered into this panel was destroyed by the next
   character typed, one character later. */
export function renderRules(host, result) {
  if (!host) return;
  host.innerHTML = `
    <p class="wrules__hdr">
      The rules of the sheet
      <span class="wrules__tally${result.ok ? ' is-ok' : ''}">
        ${result.ok ? 'all met' : result.empty ? 'nothing written yet' : `${result.broken} still to meet`}
      </span>
    </p>
    <ul class="wrules__list">
      ${result.rows.map((r) => `
        <li class="wrule${r.exempt ? ' is-exempt' : r.ok ? ' is-ok' : ''}">
          <span class="wrule__mark">${r.exempt || r.ok ? TICK : OPEN}</span>
          <span class="wrule__body">
            <span class="wrule__label">${esc(r.label)}</span>
            ${r.detail ? `<span class="wrule__detail">${esc(r.detail)}</span>` : ''}
          </span>
        </li>`).join('')}
    </ul>`;
}

/* ── The lock ───────────────────────────────────────────
   Nothing is pasted onto this sheet and nothing is copied off it. Blocking
   the clipboard EVENTS rather than the keys is what makes it hold: the
   keyboard shortcut, the right-click menu item, the edit menu and the
   middle-click on Linux all raise the same three events, and all three are
   cancellable. Dragging text is the fourth door and is shut here too. */
const BLOCK_MSG = {
  paste: 'Pasting is off on this sheet — the writing has to be yours, typed here.',
  copy: 'Copying is off on this sheet.',
  cut: 'Cutting is off on this sheet — select and retype instead.',
  drop: 'Dragging text in is off on this sheet.',
};

function flash(el, kind) {
  // At the caret: the clipboard acted where the caret is, so that is where
  // the answer belongs.
  const at = el?.selectionStart ?? 0;
  say(BLOCK_MSG[kind] || BLOCK_MSG.paste, { el, start: at, end: at, ms: 2800 });
}

/* Anything that has to be said the instant it happens rather than tallied —
   a blocked paste, a sentence closed two words short. It is a TOOLTIP
   pointing at the characters concerned (js/tip.js): a message in a panel
   underneath makes the reader go and find what it is about.

   Falls back to nothing rather than to a panel. Every caller has an element
   and an offset, because every one of these messages is about a place in the
   text; if one ever is not, it does not belong here. */
export function say(message, { el, start = 0, end = start, ms = 3600 } = {}) {
  if (!el) return;
  showTip({ el, start, end, html: `<span class="pptip__note">${message}</span>`, kind: 'warn', ms });
}

export function lockWriting(el) {
  if (!el || el.dataset.ppLocked) return;
  el.dataset.ppLocked = '1';

  ['copy', 'cut', 'paste'].forEach((type) => {
    el.addEventListener(type, (e) => { e.preventDefault(); flash(el, type); });
  });
  el.addEventListener('drop', (e) => { e.preventDefault(); flash(el, 'drop'); });
  el.addEventListener('dragstart', (e) => e.preventDefault());
  // Without this the browser shows a "you may drop here" cursor over a target
  // that will refuse the drop, which reads as the page being broken.
  el.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'none'; });
}
