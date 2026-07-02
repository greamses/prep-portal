/* ═══════════════════════════════════════════════════════
   PREPBOT — API LAYER
═══════════════════════════════════════════════════════ */

import {
  currentWritingType, setCurrentWritingType,
  currentTopic, setCurrentTopic,
} from './config.js';
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
    
    general: `
SUBSTITUTION STYLE — GENERAL:
  Word subs (<sub>): Replace any weak, vague, or overused word with 3 stronger alternatives.
    • Prefer specific over general, active over passive, concrete over abstract.
  Sentence rewrites (<sent>): Offer 2 rewrites — one for clarity, one for impact.`,
  };
  
  return guides[type] || guides.general;
}

// ── System Prompt ───────────────────────────────────────
function getSystemPrompt() {
  return `You are an uncompromising secondary-school English examiner marking with a red pen. Find and mark real errors. Also give positive credit where writing is genuinely strong.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OFF-TOPIC DETECTION — CHECK THIS FIRST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before marking anything, decide: does this essay address the assigned TOPIC?

Mark offTopic: true if ANY of these apply:
  • The essay is about a completely different subject.
  • The essay is a bare restatement of the topic with no real content (under ~30 meaningful words).
  • The student has written in a different language with only isolated English words.
  • The essay appears to be random or incoherent text with no connection to the topic.

Mark offTopic: false (proceed to mark normally) if:
  • The essay attempts the topic, even loosely, imperfectly, or creatively.
  • The student drifts off-topic in one section but the main thrust addresses the prompt.

When offTopic is true:
  • Set all rubric scores to 0.
  • Leave annotatedText as an empty string "".
  • Leave suggestions and studyTips as empty arrays [].
  • Provide a brief offTopicReason (1–2 plain sentences explaining why).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CALIBRATION:
  Grammar & Mechanics /30: 30=zero errors, 24-26=2-3 minor slips, 18-22=4-7 mixed errors, 12-16=8-12 clear mechanical weaknesses, 6-10=13+ errors.
  Vocabulary & Style /25: 23-25=varied/precise/sophisticated, 18-22=generally good, 12-16=frequent vague diction, 6-10=very limited.
  Structure & Coherence /25: 23-25=clear intro/body/conclusion, 18-22=mostly organised, 12-16=partial structure, 6-10=little organisation.
  Creativity & Content /20: 18-20=genuinely original/rich detail, 13-17=interesting but uneven, 8-12=generic, 3-7=very thin.

TOTAL BANDS: 85-95 near-perfect | 70-84 good | 55-69 average | 40-54 weak | 0-39 very weak.
NEVER exceed 95. When in doubt, choose the LOWER score.

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
${getSubstitutionGuidelines(currentWritingType)}
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
    { "category": "Grammar & Mechanics", "score": 0, "outOf": 30, "feedback": "" },
    { "category": "Vocabulary & Style", "score": 0, "outOf": 25, "feedback": "" },
    { "category": "Structure & Coherence", "score": 0, "outOf": 25, "feedback": "" },
    { "category": "Creativity & Content", "score": 0, "outOf": 20, "feedback": "" }
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

HIGHLIGHTS: <hl cat="grammar|vocab|structure|style|good">text</hl>
POSITIVE: <good reason="...">phrase</good>
COMMENTS: <comment text="..."> </comment>
SUBS: <sub opts="opt1, opt2, opt3">word</sub>
SENTENCE: <sent opts="Version 1.|||Version 2.">sentence</sent>

Always include fix="..." on types 3,4,7,8,11,12,13,14,15,16,18,20,21.
Preserve paragraph breaks as \\n\\n. Escape all JSON strings.`;
}

// ── Topic Generation ───────────────────────────────────
const FALLBACK_TOPICS = {
  narrative: [
    "Write a story about a student who finds a forgotten letter inside an old textbook.",
    "Write a story about the day a normal journey to school became unforgettable.",
    "Write a story about someone who had to make a brave choice when nobody else would help.",
    "Write a story that begins with: The classroom went completely silent."
  ],
  descriptive: [
    "Describe a busy market just before a heavy rain begins.",
    "Describe an abandoned building that seems to hold many memories.",
    "Describe your school compound early in the morning before lessons begin.",
    "Describe a festival scene using sounds, colours, smells, and movement."
  ],
  argumentative: [
    "Should students be allowed to use mobile phones in school? Give reasons for your view.",
    "Do exams truly measure intelligence? Write an essay arguing your position.",
    "Should every secondary school student learn a practical skill before graduation?",
    "Is social media more helpful than harmful to teenagers?"
  ],
  expository: [
    "Explain how students can manage their time better during exam preparation.",
    "Explain the importance of reading in improving writing skills.",
    "Explain three ways young people can contribute positively to their community.",
    "Explain how peer pressure can affect a student's choices."
  ],
  general: [
    "Write about a challenge you faced and what it taught you.",
    "Write about the kind of future you want and the habits that can help you reach it.",
    "Write about a person who has influenced your education.",
    "Write about an event that changed the way you see responsibility."
  ]
};

function fallbackTopicFor(type) {
  const key = String(type || 'general').toLowerCase().split(/\s+/)[0];
  const topics = FALLBACK_TOPICS[key] || FALLBACK_TOPICS.general;
  return topics[Math.floor(Math.random() * topics.length)];
}

export async function fetchGeneratedTopic(type, callbacks = {}) {
  const { onStart, onSuccess, onError } = callbacks;
  
  setCurrentWritingType(type);
  onStart?.();
  
  try {
    const prompt = `Generate ONE original, age-appropriate ${type} writing topic for a Nigerian secondary school student (SS1–SS2, age 13–15). Engaging, specific, achievable in 200–500 words. Return ONLY the topic text — no quotes, no label, no explanation.`;
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
    const topic = text || "Write about a memorable experience and what you learned from it.";
    setCurrentTopic(topic);
    onSuccess?.(topic);
    
  } catch (err) {
    console.error(err);
    const topic = fallbackTopicFor(type);
    setCurrentTopic(topic);
    onSuccess?.(topic);
  }
}

// ── Essay Grading ──────────────────────────────────────
export async function gradeEssay(userText) {
  const system = getSystemPrompt();
  const prompt = `WRITING TYPE: ${currentWritingType.toUpperCase()}\nTOPIC: ${currentTopic}\n\nSTUDENT ESSAY:\n${userText}`;
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
