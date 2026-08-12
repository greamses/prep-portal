/* ═══════════════════════════════════════════════════════
   PREPBOT — API LAYER
═══════════════════════════════════════════════════════ */

import {
  currentWritingType, setCurrentWritingType,
  currentTopic, setCurrentTopic, setGeneratedTopic,
  currentPassage, setCurrentPassage,
} from './config.js';
import { getForm, familyOf, formLabel, isSummaryForm, getMnemonic } from './forms.js';
import { fallbackPassageFor } from './passages.js';
import { isSummaryMode } from './summary.js';
import { geminiGenerate, groqGenerate, groqText } from '/utils/ai-client.js';

// ── Gemini call — delegates to the shared AI client (backend proxy) ──
async function geminiPost(body) {
  const data = await geminiGenerate({ body, key: 'backend' });
  return { data, label: 'Gemini' };
}

// ── Groq call — delegates to the shared AI client (backend proxy) ──
async function groqPost({ system, prompt, json = false, temperature = 0.2, maxTokens = 8192 }) {
  const data = await groqGenerate({ system, prompt, json, temperature, maxTokens, key: 'backend' });
  return { label: 'Groq', text: groqText(data) };
}

function canTryFallback(err) {
  return /No Gemini key|API Error|Gemini API|unavailable|over quota|quota|overload|400|403|404|429|503|529/i.test(err?.message || '');
}

async function generateTextWithFallback({ geminiBody, groqPrompt, temperature = 0.2, maxTokens = 8192, json = false }) {
  try {
    const { data, label } = await geminiPost(geminiBody);
    return {
      provider: 'gemini',
      label,
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    };
  } catch (err) {
    if (!canTryFallback(err)) throw err;
    console.warn('[Writing] Gemini unavailable; trying Groq fallback:', err.message);
    const result = await groqPost({
      prompt: groqPrompt,
      json,
      temperature,
      maxTokens,
    });
    return { provider: 'groq', ...result };
  }
}

async function gradeWithFallback({ geminiBody, groqSystem, groqPrompt }) {
  try {
    const { data, label } = await geminiPost(geminiBody);
    return {
      provider: 'gemini',
      label,
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    };
  } catch (err) {
    if (!canTryFallback(err)) throw err;
    console.warn('[Writing] Gemini grading unavailable; trying Groq fallback:', err.message);
    const result = await groqPost({
      system: groqSystem,
      prompt: groqPrompt,
      json: true,
      temperature: 0.1,
      maxTokens: 12000,
    });
    return { provider: 'groq', ...result };
  }
}

// ── Writing-Type Substitution Guidelines ────────────────
function getSubstitutionGuidelines(type) {
  const guides = {
    narrative: `
SUBSTITUTION STYLE — NARRATIVE writing:
  Word subs (<sub>): Replace dull, flat verbs and adjectives with vivid, character-driven ones.
    • Verbs of motion/speech are the highest priority: walked → trudged/slunk/bolted; said → whispered/snapped/murmured/blurted.
    • Replace generic nouns with concrete, sensory-specific ones: place → alleyway/threshold/clearing.
    • Offer 3 options at different emotional registers so the student can pick the mood.
  Sentence rewrites (<sent>): Rewrite weak sentences to create pace, tension, or voice.
    • Use sentence fragments deliberately for effect. Vary length.
    • Inject sensory detail (sight, sound, smell, touch) into rewrites.
    • Version 1 should heighten tension/drama; version 2 should deepen interiority/reflection.`,
    
    descriptive: `
SUBSTITUTION STYLE — DESCRIPTIVE writing:
  Word subs (<sub>): Target sensory poverty — any word that tells rather than shows.
    • Replace colour/size/shape adjectives with figurative ones: big → looming/vast/cathedral-like.
    • Verbs should evoke texture and movement: moved → drifted/shimmered/rippled.
    • Offer 3 options across visual, tactile, and auditory senses where possible.
  Sentence rewrites (<sent>): Expand thin sentences into images.
    • Version 1 uses a simile or metaphor. Version 2 uses precise concrete detail (no figurative).
    • Both versions must create a clear picture without telling the reader what to feel.`,
    
    argumentative: `
SUBSTITUTION STYLE — ARGUMENTATIVE / PERSUASIVE writing:
  Word subs (<sub>): Target imprecise, casual, or emotive words.
    • Replace "I think/feel/believe" hedges with assertive academic alternatives: it is clear that / evidence suggests / one must acknowledge.
    • Replace vague intensifiers: very → markedly/considerably/significantly; bad → detrimental/counterproductive.
    • Replace informal connectives: but → however/nevertheless/conversely; so → therefore/consequently/as a result.
    • Offer 3 options at different formality levels.
  Sentence rewrites (<sent>): Sharpen logic and structure.
    • Version 1 adds a concession-rebuttal pattern (although X, Y).
    • Version 2 tightens with a topic sentence + evidence clause structure.`,
    
    expository: `
SUBSTITUTION STYLE — EXPOSITORY / INFORMATIVE writing:
  Word subs (<sub>): Target vague or informal diction.
    • Replace pseudo-academic words with genuinely precise ones: use → employ/utilise/apply (whichever fits the context).
    • Replace "a lot of / many" with quantified or specific alternatives: numerous/a significant proportion of/the majority of.
    • Replace passive constructions where the actor matters: it was found → researchers found / studies show.
    • Offer 3 options ranked from informal to formal.
  Sentence rewrites (<sent>): Improve clarity and logical flow.
    • Version 1 uses an active voice topic sentence + supporting clause.
    • Version 2 uses a definition or classification structure for the same idea.`,
    
    summary: `
SUBSTITUTION STYLE — SUMMARY writing:
  Word subs (<sub>): Target words LIFTED from the passage and words that are longer than they need to be.
    • Any content word carried over from the source is the first priority — offer 3 genuine paraphrases, never a synonym of a synonym that changes the meaning.
    • Replace narrative flourish with neutral reporting diction: hurried → went; insists → argues; wonderful → effective.
    • Replace vague attributions with precise ones: it says → the passage explains / the writer argues / the author concedes.
  Sentence rewrites (<sent>): Rewrite for compression and for joining.
    • Version 1 says the same thing in fewer words.
    • Version 2 links the sentence to the one before it with a connective (however, as a result, in addition), so the paragraph reads as continuous writing rather than a list.
    • NEVER rewrite in a way that adds information the passage did not contain.`,

    general: `
SUBSTITUTION STYLE — GENERAL:
  Word subs (<sub>): Replace any weak, vague, or overused word with 3 stronger alternatives.
    • Prefer specific over general, active over passive, concrete over abstract.
  Sentence rewrites (<sent>): Offer 2 rewrites — one for clarity, one for impact.`,
  };
  
  return guides[type] || guides.general;
}

/* ── The examiner, in two moods ──────────────────────────
   ONE marker, one JSON contract, one results renderer. A summary is not a
   different product — it is the same red pen with a different rubric, so
   everything that does not change (the detection rules, the annotation tags,
   the JSON shape) is written once and the summary branch only swaps what a
   summary is actually marked on. */
function getSystemPrompt({ summary = false } = {}) {
  const offTopic = summary
    ? `Before marking anything, decide: is this a genuine attempt to SUMMARISE the given passage?

Mark offTopic: true if ANY of these apply:
  • The response is about something the passage does not discuss.
  • The response is the student's OWN opinion of the subject rather than an account of what the passage said.
  • The response is a bare copy of the passage or of one of its paragraphs, reproduced with almost no compression.
  • The response is under ~30 meaningful words, or is random/incoherent text.

Mark offTopic: false (proceed to mark normally) if:
  • The response summarises the passage, even partially, clumsily or in too many words.
  • The student missed some paragraphs but genuinely summarised others.`
    : `Before marking anything, decide: does this essay address the assigned TOPIC?

Mark offTopic: true if ANY of these apply:
  • The essay is about a completely different subject.
  • The essay is a bare restatement of the topic with no real content (under ~30 meaningful words).
  • The student has written in a different language with only isolated English words.
  • The essay appears to be random or incoherent text with no connection to the topic.

Mark offTopic: false (proceed to mark normally) if:
  • The essay attempts the topic, even loosely, imperfectly, or creatively.
  • The student drifts off-topic in one section but the main thrust addresses the prompt.`;

  const calibration = summary
    ? `CALIBRATION — READ THIS CAREFULLY, A SUMMARY IS SCORED DIFFERENTLY:

  THE SCORE COMES FROM GRAMMAR AND MECHANICS ALONE. A summary starts at 100 and
  loses marks ONLY for the grammatical and mechanical errors you actually mark up
  in annotatedText — spelling, punctuation, agreement, tense, articles, prepositions,
  fragments, run-ons, comma splices, word order, capitalisation. Nothing else.
  A summary with flawless grammar scores 100 even if its coverage is thin.

  Coverage & Accuracy, Own Words and Cohesion are NOT SCORED. Set their "score" and
  "outOf" to 0 and put your judgement in their "feedback" — that is where the student
  learns what they missed, what they lifted and what order to put it in. Say it fully
  and plainly there; it costs them no marks, so be direct rather than harsh.

  Grammar & Mechanics: set "outOf" to 100 and "score" to 100 minus the total of the
  loss values on the grammatical/mechanical marks you made. Do NOT deduct for lifting,
  for missed paragraphs, for intrusions or for order — mark and explain those, but
  never let them touch the number.

STILL MARK, and still say so in the feedback (they just do not cost marks): adding an opinion
of the passage, adding facts of your own, quoting, keeping its examples or statistics, or
writing longer than about a third of the original.`
    : `CALIBRATION:
  Grammar & Mechanics /30: 30=zero errors, 24-26=2-3 minor slips, 18-22=4-7 mixed errors, 12-16=8-12 clear mechanical weaknesses, 6-10=13+ errors.
  Vocabulary & Style /25: 23-25=varied/precise/sophisticated, 18-22=generally good, 12-16=frequent vague diction, 6-10=very limited.
  Structure & Coherence /25: 23-25=clear intro/body/conclusion, 18-22=mostly organised, 12-16=partial structure, 6-10=little organisation.
  Creativity & Content /20: 18-20=genuinely original/rich detail, 13-17=interesting but uneven, 8-12=generic, 3-7=very thin.`;

  // outOf 0 = a category that is COMMENTED ON but not scored; js/render.js
  // renders those as a note rather than a mark out of something.
  const rubricJson = summary
    ? `    { "category": "Coverage & Accuracy", "score": 0, "outOf": 0, "feedback": "" },
    { "category": "Own Words", "score": 0, "outOf": 0, "feedback": "" },
    { "category": "Cohesion as One Paragraph", "score": 0, "outOf": 0, "feedback": "" },
    { "category": "Grammar & Mechanics", "score": 0, "outOf": 100, "feedback": "" }`
    : `    { "category": "Grammar & Mechanics", "score": 0, "outOf": 30, "feedback": "" },
    { "category": "Vocabulary & Style", "score": 0, "outOf": 25, "feedback": "" },
    { "category": "Structure & Coherence", "score": 0, "outOf": 25, "feedback": "" },
    { "category": "Creativity & Content", "score": 0, "outOf": 20, "feedback": "" }`;

  // The one mark that only exists in a summary: words carried over from the
  // source. It is the characteristic failure of the form, so it gets a red-pen
  // code of its own rather than being buried in a margin comment.
  const summaryMarks = summary
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY-SPECIFIC MARKING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are given the SOURCE PASSAGE, numbered by paragraph, and the student's one-paragraph summary.

STEP 1 — LIFTING. Compare the summary against the passage word by word. Mark EVERY run of 6 or more
consecutive words taken from the passage with <mark type="lift" fix="a paraphrase of that run" loss="-3">.
Do not mark ordinary unavoidable wording (names, technical terms, "the writer", short common phrases).

STEP 2 — COVERAGE. Work through the passage paragraph by paragraph and decide whether each one's main
point is present. In the "Coverage & Accuracy" feedback, name the paragraph numbers that are MISSING and
the paragraph numbers that are MISREPORTED, in plain words the student can act on.

STEP 3 — INTRUSION. Mark anything the student has added that the passage does not contain — an opinion,
a judgement, an example of their own — with <mark type="del" loss="-2">, and say so in a margin comment.

STEP 4 — ORDER. If the points appear in a different order from the passage, say so in the
"Cohesion as One Paragraph" feedback and give the correct order.

Use <good reason="..."> generously on well-compressed sentences: a point of a whole paragraph carried
accurately in one clause of the student's own is the hardest thing to do in this form.
`
    : '';

  /* The sheet would not let the student submit until the piece met these
     (js/rules.js). Telling the examiner keeps the two from contradicting each
     other in both directions: it must not demand a sixth paragraph of a
     narrative that is exempt, and it must not be impressed by a fifth
     sentence that is filler. */
  const houseRules = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE RULES THE SHEET ENFORCED BEFORE THIS REACHED YOU:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • more than 150 words — SUMMARIES are exempt: a summary is about a third of
    its passage, and length is not a virtue in it
  • at least 5 paragraphs — NARRATIVE forms and summaries are exempt from this
  • at least 5 sentences in every paragraph after the introduction
  • at least 7 words in every sentence

Do not congratulate the student for meeting them; they had no choice. Do not
demand a word or paragraph count of a form that is exempt — a short, tight
summary is the form done WELL and must never be marked down for its length.
DO judge whether the
sentences and paragraphs earn their place — a paragraph padded to five with
filler, or a sentence stretched to seven words with "in my own opinion I think
that", is weaker than an honest short one, and Structure & Coherence and
Vocabulary & Style are where you say so.
`;

  return `You are an uncompromising secondary-school English examiner marking with a red pen. Find and mark real errors. Also give positive credit where writing is genuinely strong.
${houseRules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OFF-TOPIC DETECTION — CHECK THIS FIRST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${offTopic}

When offTopic is true:
  • Set all rubric scores to 0.
  • Leave annotatedText as an empty string "".
  • Leave suggestions and studyTips as empty arrays [].
  • Provide a brief offTopicReason (1–2 plain sentences explaining why).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${calibration}

${summary
  ? `TOTAL: totalScore = the Grammar & Mechanics score, i.e. 100 minus the grammatical and
mechanical losses you marked. A clean summary scores 100 — there is no ceiling here and no
band table to squeeze it into. Do not average anything, and do not let the unscored
categories pull it down.`
  : `TOTAL BANDS: 85-95 near-perfect | 70-84 good | 55-69 average | 40-54 weak | 0-39 very weak.
NEVER exceed 95. When in doubt, choose the LOWER score.`}
${summaryMarks}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERB TENSE — DETECTION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — Establish the dominant tense. Narratives = simple past. Expository/argumentative = simple present.
STEP 2 — Mark <mark type="vt"> on every verb that breaks the dominant tense without logical reason.
  Tense shift mid-paragraph: "He opened the door and sees a stranger." → fix="saw"
  Past where PAST PERFECT required: "After he ate, he went to school." → fix="had eaten"
  Wrong auxiliary: "She have been waiting." → fix="has been waiting"
  Non-standard Nigerian: "They have went home." → fix="have gone"
STEP 3 — DO NOT mark: historic present, dialogue, general truths ("water boils"), conditionals.
fix= attribute: always provide the corrected verb or verb phrase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAPITALISATION — DETECTION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use <mark type="cap"> when MUST be capitalised but isn't. Use <mark type="lc"> when capitalised but MUST NOT be.

STEP 1 — SCAN FOR "i" AS PRONOUN (most missed): "Yesterday i went." → fix="I"
STEP 2 — SCAN EVERY SENTENCE OPENING: "He opened the door. the room was empty." → fix="The"

ALWAYS capitalise: names, titles before names, specific places, nationalities/languages/religions, days/months, institutions, book titles, acronyms.
NEVER capitalise: generic common nouns, school subjects (except English/French), seasons, compass directions (generic), family terms with possessive ("my father").

COMMON NIGERIAN ERRORS: "My Father" → "my father", "In The Morning" → "the morning", "igbo" → "Igbo", "last monday" → "Monday".
fix= attribute: always provide the correctly capitalised/lowercased word.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPELLING — DETECTION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use <mark type="sp"> only when certain of misspelling. Provide fix=.

NEVER mark: British spellings (colour, centre, organise), Nigerian/West African (learnt, spelt, ageing), proper nouns.

ACTIVELY MARK common misspellings:
  Vowel confusion: recieve→receive, beleive→believe, freind→friend
  Consonant doubling: occured→occurred, begining→beginning, writting→writing
  Silent letters: goverment→government, intresting→interesting, definitly→definitely
  Word confusions: alot→a lot, aswell→as well, untill→until

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getSubstitutionGuidelines(familyOf(currentWritingType))}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBSTITUTION RULES:
- Use <sub> on any weak/vague/overused word. Provide exactly 3 comma-separated options.
- Use <sent> on any flat/unclear sentence. Provide exactly 2 rewrites separated by |||.
- NEVER use the original word as an option.

RESPOND ONLY WITH VALID JSON. No markdown.

{
  "offTopic": false,
  "offTopicReason": "",
  "totalScore": 0,
  "rubric": [
${rubricJson}
  ],
  "annotatedText": "",
  "suggestions": [],
  "studyTips": []
}

ANNOTATION TAGS:
1. <mark type="del" loss="-2">word</mark>
2. <mark type="ins" fix="word" loss="-2"> </mark>
3. <mark type="cap" fix="Word" loss="-2">word</mark>
4. <mark type="lc" fix="word" loss="-2">Word</mark>
5. <mark type="trans" loss="-2">wrong order phrase</mark>
6. <mark type="para" loss="-2"> </mark>
7. <mark type="spell" fix="full form" loss="-1">abbr</mark>
8. <mark type="sp" fix="correct spelling" loss="-2">mispeled</mark>
9. <mark type="run" loss="-3">fused clause</mark>
10. <mark type="frag" loss="-3">Because it rained.</mark>
11. <mark type="punct" fix="correct" loss="-2">,</mark>
12. <mark type="ww" fix="correct word" loss="-2">there</mark>
13. <mark type="agr" fix="corrected" loss="-3">The students was</mark>
14. <mark type="vt" fix="correct verb" loss="-2">Yesterday I go</mark>
15. <mark type="art" fix="correct article" loss="-2">I need a information</mark>
16. <mark type="prep" fix="correct preposition" loss="-2">depend of</mark>
17. <mark type="rep" loss="-1">very very good</mark>
18. <mark type="ref" fix="clearer" loss="-2">he said to him</mark>
19. <mark type="cs" loss="-3">clause, clause</mark>
20. <mark type="wo" fix="correct order" loss="-2">I yesterday went</mark>
21. <mark type="par" fix="parallel form" loss="-2">running, to jump, swim</mark>
${summary ? '22. <mark type="lift" fix="say this in your own words" loss="-3">six or more words copied from the passage</mark>\n' : ''}
HIGHLIGHTS: <hl cat="grammar|vocab|structure|style|good">text</hl>
POSITIVE: <good reason="...">phrase</good>
COMMENTS: <comment text="..."> </comment>
SUBS: <sub opts="opt1, opt2, opt3">word</sub>
SENTENCE: <sent opts="Version 1.|||Version 2.">sentence</sent>

Always include fix="..." on types 3,4,7,8,11,12,13,14,15,16,18,20,21${summary ? ',22' : ''}.
Preserve paragraph breaks as \\n\\n. Escape all JSON strings.`;
}

// ── Topic Generation ───────────────────────────────────
const GENERIC_FALLBACKS = [
  "Write about a challenge you faced and what it taught you.",
  "Write about the kind of future you want and the habits that can help you reach it.",
  "Write about a person who changed how you think about something.",
  "Write about an event that changed the way you see responsibility.",
];

function fallbackTopicFor(formId) {
  const form = getForm(formId);
  const topics = (form && form.fallbacks && form.fallbacks.length) ? form.fallbacks : GENERIC_FALLBACKS;
  return topics[Math.floor(Math.random() * topics.length)];
}

/* ── The passage a summary is written from ───────────────
   A summary form has no prompt to generate: the task IS the passage, and the
   graphic organiser needs it paragraph by paragraph rather than as one blob,
   so this returns { title, paragraphs[] } and keeps the split the model made
   instead of guessing at one later. FIVE paragraphs is the floor — the
   organiser puts one box under each. */
const MIN_PARAS = 5;
const MAX_PARAS = 7;

// Models sometimes emit a raw newline or tab inside a JSON string, which is
// illegal JSON and throws before we ever see the passage. Same scrub the essay
// grader has always done, hoisted so both callers share it.
const stripControl = (s) => String(s).replace(/[\u0000-\u0009\u000B-\u001F]+/g, ' ');

function normalisePassage(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const paragraphs = (Array.isArray(raw.paragraphs) ? raw.paragraphs : [])
    .map((p) => String(p || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (paragraphs.length < MIN_PARAS) return null;
  return {
    title: String(raw.title || 'Reading Passage').replace(/^["']+|["']+$/g, '').trim(),
    paragraphs: paragraphs.slice(0, MAX_PARAS),
  };
}

// What the receipt on the landing page says once a passage is loaded. It is
// also what the examiner is shown as the TOPIC, so it has to state the task.
export function summaryTaskLine(passage) {
  return `Read the passage “${passage.title}” (${passage.paragraphs.length} paragraphs) and summarise it in ONE paragraph, in your own words.`;
}

export async function fetchGeneratedPassage(formId, callbacks = {}) {
  const { onStart, onSuccess, onError } = callbacks;

  setCurrentWritingType(formId);
  onStart?.();

  const form = getForm(formId);
  const ask = form ? form.ask : 'an informational passage suitable for a secondary-school student';

  const prompt = `Write ONE original reading passage for a secondary-school student (age 13–16) anywhere in the world, to be summarised.

PASSAGE TYPE: ${form ? form.label : 'Informational'} — ${ask}.

Rules:
• Exactly ${MIN_PARAS} or 6 paragraphs. Never fewer than ${MIN_PARAS}.
• Each paragraph must carry exactly ONE main point, developed with detail, so that a student can reduce it to a single sentence. Never put two equally important points in one paragraph.
• 55–85 words per paragraph. The whole passage should read as continuous prose, not as notes.
• Keep it universal. Do NOT tie it to any single country, region or culture: no place names, no currencies, no national institutions, exams, holidays or public figures.
• Original writing only — never reproduce an existing published text.
• Plain, direct English a 13-year-old can read without a dictionary. No subheadings, no bullet points, no questions at the end.
• Give it a short factual title of 2–6 words.

Return ONLY valid JSON, no markdown:
{"title":"...","paragraphs":["...","...","...","...","..."]}`;

  try {
    const result = await generateTextWithFallback({
      geminiBody: {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.9,
          maxOutputTokens: 2400,
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
      groqPrompt: prompt,
      json: true,
      temperature: 0.9,
      maxTokens: 2400,
    });

    const raw = String(result.text || '');
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    let parsed = null;
    if (start !== -1 && end !== -1) {
      try { parsed = JSON.parse(stripControl(raw.substring(start, end + 1))); }
      catch { parsed = null; }
    }

    // A short or unparseable passage is worse than no passage at all — the
    // organiser would build four boxes and the lesson would have lied. Fall
    // through to a passage we wrote ourselves instead.
    const passage = normalisePassage(parsed) || fallbackPassageFor(formId);
    setCurrentPassage(passage);
    setCurrentTopic(summaryTaskLine(passage));
    setGeneratedTopic(currentTopic);
    onSuccess?.(passage);
  } catch (err) {
    console.error(err);
    const passage = fallbackPassageFor(formId);
    setCurrentPassage(passage);
    setCurrentTopic(summaryTaskLine(passage));
    setGeneratedTopic(currentTopic);
    onSuccess?.(passage);
  }
}

export async function fetchGeneratedTopic(formId, callbacks = {}) {
  const { onStart, onSuccess, onError } = callbacks;

  // Summary forms are handed a passage, not a question. Routing it here means
  // every caller (the picker, the reroll button) gets the right thing without
  // having to know which family it is looking at.
  if (isSummaryForm(formId)) return fetchGeneratedPassage(formId, callbacks);

  setCurrentWritingType(formId);
  setCurrentPassage(null);
  onStart?.();

  const form = getForm(formId);
  // The form's own `ask` is what makes a news-report prompt different from a
  // short-story prompt — without it the model returns the same four "write
  // about a memorable day" topics whatever you picked.
  const ask = form
    ? form.ask
    : 'a piece of writing suitable for a secondary-school student';

  try {
    // Culture-neutral on purpose: this page is used well outside one country,
    // and a prompt that assumes local places, money or institutions is simply
    // unanswerable for half the students who get it.
    const prompt = `Generate ONE original writing prompt for a secondary-school student (age 13–16) anywhere in the world.

FORM: ${form ? form.label : 'General'} — ${ask}.

Rules:
• The prompt must suit that form specifically, and could not be answered well in any other form.
• Keep it universal. Do NOT tie it to any single country, region or culture: no place names, no currencies, no national institutions, exams, holidays or public figures. A student in any country should be able to answer it from ordinary life.
• Be specific rather than broad — one situation, not a theme.
• It must be answerable in 200–500 words.
• Plain, direct English.

Return ONLY the prompt text — no quotes, no label, no explanation.`;
    const result = await generateTextWithFallback({
      geminiBody: {
        contents: [{ parts: [{ text: prompt }] }],
        // maxOutputTokens must cover both the model's internal "thinking"
        // tokens (2.5+ series reasons before answering) and the visible
        // reply — 130 was too tight and produced truncated fragments.
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 400,
          thinkingConfig: { thinkingBudget: 0 },
        }
      },
      groqPrompt: prompt,
      temperature: 0.9,
      maxTokens: 400,
    });
    
    const text = (result.text || "").trim()
      .replace(/^["']+|["']+$/g, '');
    const topic = text || fallbackTopicFor(formId);
    setCurrentTopic(topic);
    setGeneratedTopic(topic);
    onSuccess?.(topic);

  } catch (err) {
    console.error(err);
    const topic = fallbackTopicFor(formId);
    setCurrentTopic(topic);
    setGeneratedTopic(topic);
    onSuccess?.(topic);
  }
}

/* ═══════════════════════════════════════════════════════
   THE VIDEO QUERY — the form AND the prompt, not the form alone.

   Every student given a news report used to be sent the same search, because
   the query was a fixed string on the form. But the prompt is half of what a
   student wants a video about: somebody writing a news report on a flooded
   road and somebody writing one on a school competition are not looking for
   the same lesson. So the form's seed query is enriched with the few words in
   the prompt that actually carry it.

   Stopwords here are not the usual list — they are the words a WRITING PROMPT
   is made of. "Write", "describe", "paragraph", "essay" and "student" appear
   in almost every prompt on this page, so they identify nothing and would
   only dilute the search. The caller (js/ui.js) searches the enriched query
   first and falls back to the bare form query if it finds nothing, because a
   narrower search is only better when it returns something.
═══════════════════════════════════════════════════════ */
const PROMPT_STOPWORDS = new Set(`
a an and are as at be been being but by can could do does for from had has have
how i if in into is it its may might must not of on one or should so some such
than that the their them then there these they this those to too two up upon us
use used very was we were what when where which while who whom why will with
would you your yours anybody anyone anything everything nobody nothing someone
something write writing written wrote written essay paragraph paragraphs piece
prompt topic task question answer word words line lines about tell telling told
say saying said give giving given make making made take taking taken put using
describe description explain explanation argue argument report letter story
narrative account passage summary summarise summarize review speech article
diary entry read reader readers student students school teacher class year old
own real true clear good better best whole full single first second third last
least most many much more less own way ways thing things time times day days
`.trim().split(/\s+/));

export function videoQueryFor(formId, topic) {
  const form = getForm(formId);
  const seed = form ? form.video : 'how to write an essay for students';
  // Words already in the seed add nothing — "instructions procedural text" +
  // "instructions" is a longer query for the same search.
  const seen = new Set(seed.toLowerCase().split(/\W+/));
  const keys = String(topic || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !PROMPT_STOPWORDS.has(w) && !seen.has(w));

  // Distinct words, longest first — the long ones are the specific ones — and
  // never more than three, because a six-word tail matches nothing on YouTube.
  const picked = [...new Set(keys)].sort((a, b) => b.length - a.length).slice(0, 3);
  return picked.length ? `${seed} ${picked.join(' ')}` : seed;
}

/* ═══════════════════════════════════════════════════════
   THE MODEL TEXT — a full piece in the form, on a NEIGHBOURING subject.

   The forms registry carries a `model`, but it is three sentences: enough to
   show a voice, not enough to show a shape. A student who has never seen a
   whole news report cannot be taught one by an extract of its second
   paragraph. So this writes a complete one — and writes it to the same house
   rules the student's own sheet will enforce (js/rules.js), so the model is
   an example of a piece that would be accepted rather than a piece that would
   not.

   THE ONE HARD RULE: it must not answer the student's own prompt. A model
   that answers the question in front of them is not a model, it is the
   homework, and it would be copied. So the generator is made to invent a
   NEIGHBOURING task — same form, same kind of situation, different subject —
   and to print that task above the piece, so the student can see for
   themselves that it is a different question.

   Each block of the model is tagged with the letter of the mnemonic it
   demonstrates (js/forms.js MNEMONICS), which is what turns it from a good
   piece of writing into a taught one: the chart says "C — Claim, stated
   plainly", and the model shows the paragraph where that is being done.
═══════════════════════════════════════════════════════ */
const modelCache = new Map();

/* "Do not answer their prompt" is an instruction, and an instruction is not a
   guarantee — a model that quietly answers the question in front of the
   student is the homework, and it would be copied. So the invented task is
   CHECKED against theirs rather than trusted: five or more consecutive words
   in common means the generator has drifted back onto the topic. Five is
   lower than the six the lifting mark uses (js/summary.js), because here a
   false positive costs one retry and a false negative costs the exercise. */
const RETOPIC_RUN = 5;

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

function normaliseModel(raw, mn) {
  if (!raw || typeof raw !== 'object') return null;
  const want = mn.keys.map((k) => k.k);
  const parts = (Array.isArray(raw.parts) ? raw.parts : [])
    .map((p) => ({
      k: String(p?.k || '').trim().toUpperCase().slice(0, 1),
      text: String(p?.text || '').replace(/[ \t]+/g, ' ').trim(),
    }))
    .filter((p) => p.text);
  if (!parts.length) return null;

  /* Every key must be demonstrated, in the mnemonic's own order. A model that
     silently skips a step teaches the step is optional, and a chart with a
     tile nothing points at is worse than no chart — so a broken tagging falls
     back to the hand-written extract rather than being shown half-labelled. */
  const got = parts.map((p) => p.k);
  const covered = want.every((k, i) => got[i] === k);
  if (!covered || got.length !== want.length) return null;

  const source = (Array.isArray(raw.source) ? raw.source : [])
    .map((p) => String(p || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return {
    task: String(raw.task || '').replace(/^["']+|["']+$/g, '').trim(),
    source,
    parts,
  };
}

export async function fetchModelText(formId, { topic = '' } = {}) {
  const mn = getMnemonic(formId);
  const form = getForm(formId);
  if (!mn || !form) return null;

  const cacheKey = `${formId}::${topic}`;
  if (modelCache.has(cacheKey)) return modelCache.get(cacheKey);

  const summary = isSummaryForm(formId);
  const chart = mn.keys.map((k) => `  ${k.k} = ${k.name} — ${k.what}`).join('\n');
  const keyList = mn.keys.map((k) => k.k).join(', ');

  // The house rules, so the model is a piece the sheet would actually accept.
  // A summary is exempt from both counts (js/rules.js) and must stay short.
  const houseRules = summary
    ? `• ONE paragraph only. Aim for 90–140 words — a summary is about a third of its source, and length is not a virtue in it.
• Every sentence at least 7 words long.`
    : `• More than 150 words in total; 220–320 is the right size.
• ${familyOf(formId) === 'narrative' ? 'Paragraph it as the story needs — no fixed count.' : 'At least 5 paragraphs.'}
• At least 5 sentences in every paragraph after the introduction.
• Every sentence at least 7 words long. No one-word or two-word sentences.`;

  const sourceRule = summary
    ? `\nBecause this is a SUMMARY, also invent the short passage being summarised and return it as "source": an array of exactly 3 paragraphs, 45–60 words each, one main point in each. The model summary must cover all three, in order, in the student's own words. The "task" is the instruction to summarise that passage.`
    : '';

  const prompt = `Write ONE complete MODEL answer that a secondary-school student (age 13–16) can learn the FORM from.

FORM: ${form.label} — ${form.ask}

THE STUDENT'S OWN PROMPT (for context only):
"${topic || '(none set yet)'}"

RULE 1 — DO NOT ANSWER THAT PROMPT. Invent a DIFFERENT task in the same form: the same kind of situation, a clearly different subject, so that nothing in your model can be copied into their answer. It must be near enough that the moves transfer and far enough that the content does not. Put your invented task in "task".

RULE 2 — TAG THE MOVES. The form is taught by this mnemonic:

${mn.word}
${chart}

Split your model into exactly ${mn.keys.length} parts, one per letter, IN THIS ORDER: ${keyList}. Each part is the stretch of writing where that move is being made. A part may be more than one paragraph — separate paragraphs inside a part with \\n\\n. Do not label anything inside the text itself; the tag is the "k" field and nothing else.

RULE 3 — IT MUST OBEY THE RULES THE STUDENT IS HELD TO:
${houseRules}

RULE 4 — Keep it universal. No country, currency, national institution, exam, holiday or public figure. Plain, direct English a 13-year-old can read.${sourceRule}

Return ONLY valid JSON, no markdown:
{"task":"...",${summary ? '"source":["...","...","..."],' : ''}"parts":[${mn.keys.map((k) => `{"k":"${k.k}","text":"..."}`).join(',')}]}`;

  async function attempt(extra) {
    const result = await generateTextWithFallback({
      geminiBody: {
        contents: [{ parts: [{ text: prompt + extra }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.85,
          maxOutputTokens: 3000,
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
      groqPrompt: prompt + extra,
      json: true,
      temperature: 0.85,
      maxTokens: 3000,
    });

    const raw = String(result.text || '');
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    let parsed = null;
    try { parsed = JSON.parse(stripControl(raw.substring(start, end + 1))); }
    catch { return null; }
    return normaliseModel(parsed, mn);
  }

  /* What must differ is not the same thing for every form. A summary's task
     line is boilerplate — "Read the passage X and summarise it in ONE
     paragraph, in your own words" (summaryTaskLine) — so comparing task
     against task would flag every summary ever generated and no student would
     ever see a model. For a summary the thing that must be new is the
     PASSAGE; for everything else it is the question. */
  const against = summary
    ? (currentPassage?.paragraphs || []).join(' ')
    : topic;
  const subjectOf = (m) => (summary ? m.source.join(' ') : m.task);
  const tooClose = (m) => !!against && longestSharedRun(subjectOf(m), against) >= RETOPIC_RUN;

  let model = await attempt('');
  // One retry, and only when it drifted back onto their topic. A second miss
  // falls back to the hand-written extract rather than billing a third call.
  if (model && tooClose(model)) {
    model = await attempt(`

YOUR PREVIOUS ATTEMPT FAILED RULE 1: ${summary
  ? 'the passage you invented was the student\'s own passage rewritten. Invent a passage on a COMPLETELY DIFFERENT SUBJECT'
  : 'the task you invented was the student\'s own prompt in different words. Invent a task about a DIFFERENT SUBJECT ENTIRELY'} — same form, same kind of situation, nothing in common with what they were given.`);
    if (model && tooClose(model)) return null;
  }

  if (model) modelCache.set(cacheKey, model);
  return model;
}

/* ═══════════════════════════════════════════════════════
   PARAGRAPH SUGGESTIONS — Groq, because this one has to be fast.

   Every other call on this page can take four seconds: you press a button and
   you wait for a prompt, a passage, a model, a marking. This one is different
   — the student is mid-paragraph with a cursor blinking, and a suggestion
   that arrives after they have moved on is worse than none. So it goes
   STRAIGHT to Groq rather than through the Gemini-then-Groq ladder the rest
   of the file uses, and it asks for very little: three lines, no preamble.

   What it must never do is write the paragraph. A suggestion here is a
   QUESTION or a MISSING DETAIL — "what did the room smell like?", "name the
   figure you are claiming" — because a student who is handed sentences stops
   writing and starts accepting. The prompt says so in as many words, and the
   suggestions are rendered as prompts to answer, not text to insert: there is
   deliberately no button that puts one on the page.
═══════════════════════════════════════════════════════ */
export async function suggestForMove(formId, keyIndex, { topic = '', draft = '' } = {}) {
  const mn = getMnemonic(formId);
  const form = getForm(formId);
  const key = mn?.keys[keyIndex];
  if (!key || !form) return [];

  const written = draft.trim();
  const state = written
    ? `WHAT THEY HAVE WRITTEN IN THIS BOX SO FAR:\n"${written.slice(0, 900)}"`
    : 'THIS BOX IS STILL EMPTY.';

  const prompt = `You are helping a secondary-school student (age 13–16) write ONE part of a piece of writing.

FORM: ${form.label}
THEIR TASK: ${topic || '(not set)'}
THE PART THEY ARE ON: "${key.k} — ${key.name}" — ${key.what}

${state}

Give exactly 3 suggestions for what to ADD to this part. Rules:
• Each one must be specific to THEIR task above, not general writing advice. "Add more detail" is useless; "say what the queue smelt like at that hour" is not.
• Phrase each as a question they can answer or a detail they are missing — NEVER as a sentence they could copy into their writing. You are not writing this for them.
• ${written ? 'Do not repeat what they have already written. Suggest what is MISSING from it.' : 'They have not started, so suggest the three things this part most needs.'}
• Under 18 words each. Plain English.

Return ONLY valid JSON: {"tips":["...","...","..."]}`;

  try {
    const data = await groqGenerate({
      prompt,
      json: true,
      temperature: 0.75,
      maxTokens: 400,
      key: 'backend',
    });
    const raw = groqText(data) || '';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return [];
    const parsed = JSON.parse(stripControl(raw.substring(start, end + 1)));
    return (Array.isArray(parsed.tips) ? parsed.tips : [])
      .map((t) => String(t || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 3);
  } catch (err) {
    console.warn('[Writing] suggestions unavailable:', err.message);
    return [];
  }
}

/* ═══════════════════════════════════════════════════════
   REPLACEMENTS ON A HIGHLIGHT — the red pen, before the marking.

   The results page already offers these: a blue underline under a weak word
   opens three alternatives, an amber one under a flat sentence opens two
   rewrites (the <sub> and <sent> tags). But that is AFTER the marking, on a
   piece that has already been scored, which is the wrong end of the lesson —
   the student who wanted a better word wanted it while they were reaching
   for one.

   So the same two offers are made on a highlight in the draft, and they are
   generated with the SAME family guidelines the examiner uses
   (getSubstitutionGuidelines) — a narrative gets vivid verbs, an argument
   gets precision, a summary gets paraphrase. A student who is coached toward
   one thing while writing and marked against another has been set up.

   Groq, like the planner's suggestions: the student has a word selected and
   a cursor waiting. Never returns the original, never returns fewer options
   than it promised — a menu with one item on it is not a choice.
═══════════════════════════════════════════════════════ */
export async function fetchReplacements({ kind, selection, sentence = '', topic = '' } = {}) {
  const sel = String(selection || '').trim();
  if (!sel) return [];

  const family = familyOf(currentWritingType);
  const word = kind === 'word';
  const n = word ? 3 : 2;

  const prompt = `A secondary-school student (age 13–16) is writing ${formLabel(currentWritingType)}${topic ? ` on this task: "${topic}"` : ''}.

They have highlighted ${word ? 'this WORD or PHRASE' : 'this SENTENCE'} in their own draft and want a better version:

"${sel}"

${sentence && word ? `THE SENTENCE IT SITS IN (for context — do not rewrite it):\n"${sentence}"\n` : ''}
${getSubstitutionGuidelines(family)}

Give exactly ${n} replacement${n === 1 ? '' : 's'}. Rules:
• ${word
    ? 'Each must fit the sentence grammatically exactly where the highlighted words are — same part of speech, same number and tense. It has to drop straight in.'
    : 'Each must say what their sentence says, better. Do not add facts they did not write, and do not change their meaning or their opinion.'}
• NEVER return the original, and never a trivial variation of it.
• Keep the student's own voice. These must sound like a 14-year-old wrote them on a good day, not like an adult wrote them.
• ${word ? 'No explanations, just the replacement words.' : 'No explanations, just the rewritten sentences.'}

Return ONLY valid JSON: {"options":[${Array(n).fill('"..."').join(',')}]}`;

  try {
    const data = await groqGenerate({
      prompt,
      json: true,
      temperature: 0.8,
      maxTokens: 500,
      key: 'backend',
    });
    const raw = groqText(data) || '';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return [];
    const parsed = JSON.parse(stripControl(raw.substring(start, end + 1)));
    const same = (a, b) => a.toLowerCase().replace(/[^a-z0-9]/g, '') === b.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (Array.isArray(parsed.options) ? parsed.options : [])
      .map((o) => String(o || '').replace(/\s+/g, ' ').trim().replace(/^["']+|["']+$/g, ''))
      .filter((o) => o && !same(o, sel))
      .slice(0, n);
  } catch (err) {
    console.warn('[Writing] replacements unavailable:', err.message);
    return [];
  }
}

// ── Essay Grading ──────────────────────────────────────
/* One entry point for both. A summary hands the same examiner the source
   passage (numbered, because coverage feedback has to be able to say "you
   missed paragraph 4") and, if the student used the organiser, the sentence
   they wrote for each paragraph — which turns "is anything missing?" from a
   judgement into a check. */
export async function gradeEssay(userText, { plan = null } = {}) {
  const summary = isSummaryMode();
  const system = getSystemPrompt({ summary });

  let prompt;
  if (summary) {
    const source = currentPassage.paragraphs
      .map((p, i) => `[Paragraph ${i + 1}] ${p}`).join('\n\n');
    const planned = (plan || []).filter((r) => r && r.sentence);
    const planBlock = planned.length
      ? `\n\nTHE STUDENT'S PLAN — the sentence they wrote for each paragraph in the organiser:\n${
          planned.map((r) => `[${r.label}] ${r.sentence}`).join('\n')
        }\nUse this only to check coverage. Mark the SUMMARY PARAGRAPH below, not the plan.`
      : '';
    prompt = `TASK: Summary — the student read the passage below and reduced it to ONE paragraph.
PASSAGE TYPE: ${formLabel(currentWritingType)}
PASSAGE TITLE: ${currentPassage.title}
PARAGRAPHS IN THE PASSAGE: ${currentPassage.paragraphs.length}

SOURCE PASSAGE:
${source}${planBlock}

STUDENT SUMMARY PARAGRAPH:
${userText}`;
  } else {
    // The examiner is told the FORM — a news report is marked on things a short
    // story is not — while the red-pen substitution style keys off its family.
    prompt = `WRITING FORM: ${formLabel(currentWritingType)}\nFAMILY: ${familyOf(currentWritingType)}\nTOPIC: ${currentTopic}\n\nSTUDENT ESSAY:\n${userText}`;
  }

  const { text } = await gradeWithFallback({
    geminiBody: {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 20000 }
    },
    groqSystem: system,
    groqPrompt: prompt,
  });
  
  let raw = text || "";
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1) {
    raw = raw.substring(jsonStart, jsonEnd + 1);
  } else {
    throw new Error("No JSON object found in response");
  }
  
  raw = raw.replace(/[\u0000-\u0009\u000B-\u001F]+/g, "");
  return JSON.parse(raw);
}
