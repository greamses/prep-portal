/* ═══════════════════════════════════════════════════════
   PREPBOT — CONFIG & CONSTANTS
═══════════════════════════════════════════════════════ */

// DOM shortcut
export const $ = id => document.getElementById(id);

// HTML escape utility
export const safe = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// ── API ─────────────────────────────────────────────────
export { GEMINI_MODELS_UI as GEMINI_MODELS, GROQ_MODELS, GEMINI_SKIP_STATUSES as QUOTA_CODES } from '../../utils/ai-models.js';

import { DEFAULT_LEVEL, getLevel } from './levels.js';

// Key getter
export const getGeminiKey = () => {
  const key = window.PrepPortalKeys?.gemini || null;
  if (!key) throw new Error('No Gemini key found. Please sign in and add your key in Account Settings.');
  return key;
};

export const getGroqKey = () => {
  const key = window.PrepPortalKeys?.groq || null;
  if (!key) throw new Error('No Groq key found. Please add your Groq key in Account Settings.');
  return key;
};

// ── Error Type Metadata ─────────────────────────────────
export const ERROR_TYPES = {
  del: { name: 'Delete Word', desc: 'This word is unnecessary and should be removed from the sentence.' },
  ins: { name: 'Insert Missing Word', desc: 'A word is missing here. The suggested fix shows what to insert.' },
  cap: { name: 'Capitalise', desc: 'This word should begin with a capital letter — start of sentence or a proper noun.' },
  lc: { name: 'Make Lowercase', desc: 'This word is incorrectly capitalised in this position.' },
  trans: { name: 'Transpose / Swap Order', desc: 'The words in this phrase are in the wrong order and need to be swapped.' },
  para: { name: 'New Paragraph', desc: 'A new paragraph should begin at this point in the text.' },
  spell: { name: 'Spell Out Abbreviation', desc: 'Write this abbreviation out in full. Avoid abbreviations in formal writing.' },
  sp: { name: 'Misspelling', desc: 'This word is spelled incorrectly. Check a dictionary for the correct spelling.' },
  run: { name: 'Run-on Sentence', desc: 'Two or more independent clauses are fused without correct punctuation or a coordinating conjunction.' },
  frag: { name: 'Sentence Fragment', desc: 'This is not a complete sentence — it is missing a subject, a predicate, or both.' },
  punct: { name: 'Wrong Punctuation', desc: 'The punctuation mark here is incorrect or misplaced for this context.' },
  ww: { name: 'Wrong Word', desc: "Incorrect word choice — likely a homophone (e.g. there/their/they're) or confusion between similar words." },
  agr: { name: 'Subject-Verb Agreement', desc: 'The subject and verb do not agree in number or person. E.g. "The students was" should be "The students were".' },
  vt: { name: 'Wrong Verb Tense', desc: 'The verb tense used here does not match the time frame of the sentence or passage.' },
  art: { name: 'Article Error (a/an/the)', desc: 'Wrong or missing article. Article use depends on context and whether a noun is countable.' },
  prep: { name: 'Wrong Preposition', desc: 'Incorrect preposition used. Many are idiomatic, e.g. "interested in", not "interested on".' },
  rep: { name: 'Unnecessary Repetition', desc: 'This word or phrase appears too soon after its previous use. Vary your vocabulary.' },
  ref: { name: 'Unclear Pronoun Reference', desc: 'It is unclear which noun this pronoun refers to. Rewrite to remove the ambiguity.' },
  cs: { name: 'Comma Splice', desc: 'Two independent clauses joined only by a comma. Use a semicolon, a conjunction, or two separate sentences.' },
  wo: { name: 'Word Order Error', desc: 'The words are not in the standard English grammatical order for this phrase or clause.' },
  par: { name: 'Faulty Parallel Structure', desc: 'All items in a list must be in the same grammatical form (e.g. all gerunds or all infinitives).' },
  // Summary only — the characteristic failure of the form, so it gets its own
  // red-pen code rather than being hidden inside a margin comment.
  lift: { name: 'Lifted from the Passage', desc: 'Six or more words copied straight from the passage. A summary must be in your own words — rewrite this in a way that keeps the meaning but not the wording.' },
};

// Which action buttons to show per error type: d=delete, m=move, c=custom
export const ERROR_ACTIONS = {
  del: { d: true, m: false, c: false },
  ins: { d: false, m: false, c: false },
  cap: { d: false, m: false, c: true },
  lc: { d: false, m: false, c: true },
  sp: { d: false, m: false, c: true },
  ww: { d: false, m: false, c: true },
  vt: { d: false, m: false, c: true },
  art: { d: false, m: false, c: true },
  prep: { d: false, m: false, c: true },
  agr: { d: false, m: false, c: true },
  ref: { d: false, m: false, c: true },
  rep: { d: true, m: false, c: true },
  cs: { d: false, m: false, c: true },
  wo: { d: false, m: false, c: true },
  trans: { d: false, m: true, c: false },
  para: { d: true, m: false, c: false },
  spell: { d: false, m: false, c: true },
  run: { d: false, m: false, c: true },
  frag: { d: false, m: false, c: true },
  punct: { d: false, m: false, c: true },
  par: { d: false, m: false, c: true },
  lift: { d: false, m: false, c: true },
  word: { d: false, m: false, c: true },
  sent: { d: false, m: true, c: true },
};

// ── Shared Mutable State ────────────────────────────────
export let geminiModelIdx = 0;
export let currentTopic = "";
// The last prompt the generator produced, kept apart from currentTopic so that
// clearing a custom task can fall back to it instead of leaving the student's
// own prompt on a slip that no longer claims to be theirs.
export let generatedTopic = "";
export let currentWritingType = 'general';
/* Which grade band this piece is written and marked at (js/levels.js). Chosen
   before the form — it changes the gate, the rubric and the pen — and carried
   on a filed task, so a class opening their teacher's link is marked at the
   level the teacher set it for rather than at whatever they last picked. */
export let currentLevel = DEFAULT_LEVEL;
/* The library id of the task on the sheet, when it came from one — a link, an
   assignment, a slip off the shelf. It is what a finished piece is filed
   AGAINST, and so it is what decides whose class list the work lands in: a
   student answering their teacher's task must file under the TEACHER's task
   id, not under a fresh copy of the same words filed under their own name.
   Empty for a prompt this browser generated, which is filed on submit. */
export let currentTaskId = '';
// The passage a SUMMARY is written from: { title, paragraphs: [...] }. Null for
// every other family — which is also how the rest of the page asks "are we in
// summary mode?" without importing the form registry everywhere.
export let currentPassage = null;
export let commentCounter = 0;
export let commentStore = {};

// A task the student brought themselves — a prompt they were set and/or a
// YouTube lesson their teacher sent. `usePrompt` is what decides whether the
// receipt is showing their prompt or a generated one; the video is kept
// either way, because a custom video over a generated prompt is a real case.
// Wired in js/own-task.js.
export let customTask = { prompt: '', video: '', videoId: '', videoStart: 0, usePrompt: false };

export const setGeminiModelIdx = (val) => { geminiModelIdx = val; };
export const setCurrentTopic = (val) => { currentTopic = val; };
export const setGeneratedTopic = (val) => { generatedTopic = val; };
export const setCustomTask = (val) => {
  customTask = { prompt: '', video: '', videoId: '', videoStart: 0, usePrompt: false, ...(val || {}) };
};
export const setCurrentWritingType = (val) => { currentWritingType = val; };

/* The level is remembered between visits. A student is in one class all year,
   and asking them their grade every single time — on the step that now comes
   FIRST — would be the most tedious question on the page. The step still shows,
   with their answer already ticked; they walk past it rather than answer it. */
const LEVEL_KEY = 'pp.writing.level';

export const setCurrentLevel = (val, { remember = true } = {}) => {
  currentLevel = getLevel(val).id;
  if (!remember) return;
  try { localStorage.setItem(LEVEL_KEY, currentLevel); } catch (_) { /* private mode */ }
};

export const setCurrentTaskId = (val) => { currentTaskId = String(val || ''); };

export const rememberedLevel = () => {
  try { return getLevel(localStorage.getItem(LEVEL_KEY)).id; } catch (_) { return DEFAULT_LEVEL; }
};
export const setCurrentPassage = (val) => { currentPassage = val || null; };
export const setCommentCounter = (val) => { commentCounter = val; };
export const resetCommentStore = () => { commentStore = {}; };
