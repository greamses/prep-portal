/* ═══════════════════════════════════════════════════════
   PREPBOT — API LAYER
═══════════════════════════════════════════════════════ */

import {
  currentWritingType, setCurrentWritingType,
  currentTopic, setCurrentTopic, setGeneratedTopic,
  currentPassage, setCurrentPassage,
} from './config.js';
import { getForm, familyOf, formLabel, isSummaryForm } from './forms.js';
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

  return `You are an uncompromising secondary-school English examiner marking with a red pen. Find and mark real errors. Also give positive credit where writing is genuinely strong.

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
