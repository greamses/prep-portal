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

     WORDS       more than 150, always, whatever the form.
     PARAGRAPHS  at least 5 — except NARRATIVE, which is paced by its story
                 rather than by a plan, and except a SUMMARY, which is one
                 paragraph by definition and could not obey the rule at all.
     SENTENCES   at least 5 per paragraph, except the introduction, which is
                 allowed to be short because its job is to open, not to argue.
     LENGTH      at least 7 words in every sentence.

   Two things are deliberately NOT counted. A line with no full stop and ten
   words or fewer is a HEADING, not a paragraph — a headline, a diary date, a
   salutation, a sign-off, a report heading — and several forms taught here
   require one, so it is skipped rather than failed. And the copy/paste lock
   below is not a rule about the text: it is a rule about how the text got
   there. Nothing on the sheet may be pasted in and nothing may be copied out.
═══════════════════════════════════════════════════════ */

import { currentWritingType } from './config.js';
import { familyOf } from './forms.js';

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
export function rulesFor({ summary = false, formId = currentWritingType } = {}) {
  const exemptParagraphs = summary || familyOf(formId) === 'narrative';
  return {
    minWords: MIN_WORDS,
    minParagraphs: exemptParagraphs ? 0 : MIN_PARAGRAPHS,
    minSentences: MIN_SENTENCES,
    minSentenceWords: MIN_SENTENCE_WORDS,
    // Why the paragraph rule is missing, in the student's words. A rule that
    // silently disappears reads as a bug.
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
export function checkDraft(text, { summary = false, formId = currentWritingType } = {}) {
  const R = rulesFor({ summary, formId });
  const words = wordCount(text);
  const blocks = splitParagraphs(text);
  const paragraphs = blocks.filter((b) => !isHeading(b));

  const rows = [];

  rows.push({
    id: 'words',
    label: `More than ${R.minWords} words`,
    ok: words > R.minWords,
    detail: words
      ? (words > R.minWords ? `${plural(words, 'word', 'words')}` : `${plural(words, 'word', 'words')} — ${R.minWords + 1 - words} to go`)
      : 'nothing written yet',
  });

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

  const broken = rows.filter((r) => !r.ok);
  return {
    ok: broken.length === 0 && words > 0,
    words,
    paragraphs: paragraphs.length,
    rows,
    broken: broken.length,
  };
}

/* ── The checklist under the sheet ──────────────────────── */

const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12.5 5 5L20 6.5"/></svg>`;
const OPEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"
  stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg>`;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderRules(host, result) {
  if (!host) return;
  host.innerHTML = `
    <p class="wrules__hdr">
      The rules of the sheet
      <span class="wrules__tally${result.ok ? ' is-ok' : ''}">
        ${result.ok ? 'all met' : `${result.broken} still to meet`}
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
    </ul>
    <p class="wrules__note" id="wrules-note" hidden></p>`;
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

function flash(kind) {
  const note = document.getElementById('wrules-note');
  if (!note) return;
  note.textContent = BLOCK_MSG[kind] || BLOCK_MSG.paste;
  note.hidden = false;
  clearTimeout(flash.t);
  flash.t = setTimeout(() => { note.hidden = true; }, 2600);
}

export function lockWriting(el) {
  if (!el || el.dataset.ppLocked) return;
  el.dataset.ppLocked = '1';

  ['copy', 'cut', 'paste'].forEach((type) => {
    el.addEventListener(type, (e) => { e.preventDefault(); flash(type); });
  });
  el.addEventListener('drop', (e) => { e.preventDefault(); flash('drop'); });
  el.addEventListener('dragstart', (e) => e.preventDefault());
  // Without this the browser shows a "you may drop here" cursor over a target
  // that will refuse the drop, which reads as the page being broken.
  el.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'none'; });
}
