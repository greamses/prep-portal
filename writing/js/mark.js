/* ═══════════════════════════════════════════════════════
   MARKING — how a finished sheet becomes a result.

   One door out of the write phase: markDraft(). Behind it are two routes.

   AN ESSAY is marked PARAGRAPH BY PARAGRAPH. Each paragraph is its own small
   call to the pen (js/api.js markParagraph), and a short verdict is written at
   the end from the notes those passes left rather than from the essay again.
   The reasons, in the order they matter:

     • It costs less per call. The old grader asked for every red mark and the
       whole rubric in one twenty-thousand-token answer; these are a few
       hundred tokens each, and the verdict pass never re-reads the text.
     • It fails in pieces. A paragraph that will not mark comes back unmarked,
       with the student's own words intact, and the other eight still carry
       their marks. Before, one bad brace lost the entire marking.
     • It marks the ninth paragraph as carefully as the first, which a model
       holding a whole essay in its head demonstrably does not.
     • It can say where it is. "Paragraph 4 of 7" is a real progress bar, not a
       spinner over a forty-second silence.

   A SUMMARY does not come this way. It is one paragraph by definition, so
   splitting it gains nothing and would cost an extra call; and its marking
   needs the whole source passage in front of the examiner to catch lifting,
   which is exactly the context a per-paragraph pass throws away. Summaries
   keep the single-call grader (js/api.js gradeEssay).

   THE ARITHMETIC IS OURS, NOT THE MODEL'S. Grammar & Mechanics is computed
   from the marks actually made — the tally in scoreFromMarks below — and
   Vocabulary & Style from the per-paragraph diction bands, weighted by length.
   Only Structure and Content are scored by the model, because only they need a
   judgement rather than a sum. Asking a language model to total its own
   deductions is what used to cap every summary in the seventies.
   ═══════════════════════════════════════════════════════ */

import { currentLevel, currentTopic } from './config.js';
import { getLevel, marksAt } from './levels.js';
import { markParagraph, verdictFromNotes, gradeEssay } from './api.js';
import { isSummaryMode, getPlan } from './summary.js';
import { splitParagraphs, splitSentences } from './rules.js';

/* ── What the red pen actually cost ──────────────────────
   Reads the tags back out of the marked-up text and adds up the losses. Two
   things make this level-aware:

     • a mark the level does not use is never charged, even if the model made
       it anyway — belt and braces against a stray tag turning into a lost mark
       a student cannot be taught to avoid;
     • the total is scaled by the level. The same eight slips are a stage of
       learning in Grade 5 and eight lost marks in Grade 11, and lossScale in
       js/levels.js is where that judgement is written down.

   `lift` is never charged at any level: carrying six words out of a passage is
   a summary-craft failure, not a mechanical error. It is still marked, still
   explained, just not paid for. */
const NEVER_CHARGED = new Set(['lift']);

export function scoreFromMarks(annotatedText, { levelId = currentLevel } = {}) {
  const L = getLevel(levelId);
  const tallies = {};
  let raw = 0;
  let counted = 0;

  // Attribute order varies (fix= may precede loss=), so scan the opening tags
  // and pull each attribute out on its own rather than assuming a fixed shape.
  for (const tag of String(annotatedText || '').match(/<mark\b[^>]*>/gi) || []) {
    const type = (tag.match(/type=['"]([^'"]+)['"]/i) || [])[1] || '';
    const loss = parseInt((tag.match(/loss=['"]\s*(-?\d+)/i) || [])[1] || '0', 10);
    if (type) tallies[type] = (tallies[type] || 0) + 1;
    if (!loss || NEVER_CHARGED.has(type) || !marksAt(levelId, type)) continue;
    raw += Math.abs(loss);
    counted += 1;
  }

  const deducted = Math.round(raw * L.lossScale);
  return { pct: Math.max(0, Math.min(100, 100 - deducted)), deducted, counted, tallies };
}

/** A category's marks from a percentage — 84% of a /30 category is 25. */
const share = (pct, outOf) => Math.max(0, Math.min(outOf, Math.round((pct / 100) * outOf)));

const wordsIn = (s) => String(s || '').trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

/* ── The essay route ─────────────────────────────────────
   Sequential, not parallel. Six paragraphs fired at once is six times the
   chance of tripping a rate limit, and the wall-clock saving is small because
   each call is already short — while going one at a time is what lets the
   overlay honestly say which paragraph is being marked. */
async function markInPasses(userText, { levelId, onProgress }) {
  const L = getLevel(levelId);
  const blocks = splitParagraphs(userText);
  const total = blocks.length;

  const results = [];
  for (let i = 0; i < total; i++) {
    onProgress?.({ done: i, total, phase: 'paragraphs' });
    // eslint-disable-next-line no-await-in-loop
    const r = await markParagraph({ index: i, total, text: blocks[i], levelId });
    results.push({ ...r, text: blocks[i] });
  }
  onProgress?.({ done: total, total, phase: 'verdict' });

  // The marked-up piece, reassembled in order. A paragraph that failed to mark
  // contributes its own untouched words, so the student still reads back
  // everything they wrote.
  const annotatedText = results.map((r) => r.annotated).join('\n\n');
  const marks = scoreFromMarks(annotatedText, { levelId });

  const paragraphs = results.map((r, i) => ({
    words: wordsIn(r.text),
    sentences: splitSentences(r.text).length,
    marks: (r.annotated.match(/<mark\b/gi) || []).length,
    onTopic: r.onTopic,
    note: r.note,
    index: i,
  }));
  const offTopicCount = paragraphs.filter((p) => !p.onTopic).length;

  /* Every paragraph off topic is not a marking, it is a wrong answer, and there
     is nothing for the verdict pass to weigh. Say so and stop — the one place
     the pipeline deliberately spends fewer calls rather than more. */
  if (total && offTopicCount === total) {
    return {
      offTopic: true,
      offTopicReason: `This does not answer the task that was set: “${String(currentTopic || '').slice(0, 160)}”.`,
      totalScore: 0,
      rubric: L.rubric.map((r) => ({ ...r, score: 0, feedback: '' })),
      annotatedText: '',
      suggestions: [],
      studyTips: [],
      passes: total,
    };
  }

  const v = await verdictFromNotes({ paragraphs, tallies: marks.tallies, levelId, offTopicCount });

  if (v.offTopic) {
    return {
      offTopic: true,
      offTopicReason: String(v.offTopicReason || '').slice(0, 400),
      totalScore: 0,
      rubric: L.rubric.map((r) => ({ ...r, score: 0, feedback: '' })),
      annotatedText: '',
      suggestions: [],
      studyTips: [],
      passes: total + 1,
    };
  }

  // Vocabulary is the weighted mean of the bands the paragraph passes gave —
  // weighted by length, so a two-line paragraph does not outvote a page. A
  // paragraph that failed to mark simply does not vote.
  const voted = results
    .map((r, i) => ({ pct: r.vocabPct, w: paragraphs[i].words }))
    .filter((x) => x.pct != null && x.w > 0);
  const vocabPct = voted.length
    ? Math.round(voted.reduce((n, x) => n + x.pct * x.w, 0) / voted.reduce((n, x) => n + x.w, 0))
    : 70;

  const outOf = (cat) => (L.rubric.find((r) => r.category === cat) || { outOf: 0 }).outOf;
  const grammarOut = outOf('Grammar & Mechanics');
  const vocabOut = outOf('Vocabulary & Style');
  const structureOut = outOf('Structure & Coherence');
  const contentOut = outOf('Creativity & Content');

  const detail = marks.counted
    ? `${marks.counted} error${marks.counted === 1 ? '' : 's'} marked, costing ${marks.deducted}.`
    : 'No grammatical or mechanical errors found.';

  const rubric = [
    {
      category: 'Grammar & Mechanics',
      outOf: grammarOut,
      score: share(marks.pct, grammarOut),
      feedback: `${detail} ${String(v.grammarFeedback || '')}`.trim(),
    },
    {
      category: 'Vocabulary & Style',
      outOf: vocabOut,
      score: share(vocabPct, vocabOut),
      feedback: String(v.vocabFeedback || ''),
    },
    {
      category: 'Structure & Coherence',
      outOf: structureOut,
      score: Math.max(0, Math.min(structureOut, Math.round(Number(v.structureScore) || 0))),
      feedback: String(v.structureFeedback || ''),
    },
    {
      category: 'Creativity & Content',
      outOf: contentOut,
      score: Math.max(0, Math.min(contentOut, Math.round(Number(v.contentScore) || 0))),
      feedback: String(v.contentFeedback || ''),
    },
  ];

  const totalScore = Math.min(
    L.ceiling,
    rubric.reduce((n, r) => n + r.score, 0),
  );

  return {
    offTopic: false,
    offTopicReason: '',
    totalScore,
    rubric,
    annotatedText,
    suggestions: (Array.isArray(v.suggestions) ? v.suggestions : []).map(String).filter(Boolean).slice(0, 6),
    studyTips: (Array.isArray(v.studyTips) ? v.studyTips : [])
      .filter((t) => t && (t.title || t.tip))
      .map((t) => ({ title: String(t.title || ''), tip: String(t.tip || '') }))
      .slice(0, 4),
    // How many AI calls this marking actually took. Recorded on the submission
    // so the cost of a marking is a number somebody can look at rather than a
    // thing we assume.
    passes: total + 1,
    unmarked: results.filter((r) => !r.ok).length,
  };
}

/** The one door. Everything downstream — js/render.js, the submission — takes
    the same shape whichever route was used. */
export async function markDraft(userText, { levelId = currentLevel, onProgress } = {}) {
  if (isSummaryMode()) {
    onProgress?.({ done: 0, total: 1, phase: 'summary' });
    const data = await gradeEssay(userText, { plan: getPlan(), levelId });
    return { ...data, passes: 1, unmarked: 0 };
  }
  return markInPasses(userText, { levelId, onProgress });
}
