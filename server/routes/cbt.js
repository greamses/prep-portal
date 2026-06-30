/**
 * CBT bank — OUR OWN AI-generated objective questions (no exam-body content).
 *
 * Admin generates original, exam-style MCQs with one "expectation prompt" and we
 * save them to the `cbtQuestions` collection, building a bank organised by
 * scheme + subject. The CBT then serves from this bank — no past papers needed.
 *
 *   POST /api/cbt/generate   (admin) { scheme, subject, topic?, count } → save
 *   GET  /api/cbt/stats      (admin) → counts by scheme/subject
 *   GET  /api/cbt/facets?scheme=     → subjects (+counts) for a scheme
 *   GET  /api/cbt/questions?scheme=&subject=&limit=&random= → take a test
 */

const express = require("express");
const vm = require("vm");
const admin = require("firebase-admin");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { GEMINI_MODELS, GROQ_DEFAULT_MODEL } = require("../ai-models");
const quota = require("../lib/quota");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Schemes we offer — DESCRIPTIVE "…-style" labels, never an exam body's name.
// `region`: "nigeria" | "international" (for the builder's National/International tabs).
// `calib`: difficulty guidance fed into the prompt so questions match the exam.
const SCHEMES = {
  cee:      { label: "Common Entrance style", region: "nigeria", desc: "a Nigerian Common Entrance examination into junior secondary school (primary 5–6 level)",
    calib: "- Target ages 10–12 (end of primary). Basic arithmetic, fractions/decimals, simple geometry and everyday word problems. Keep it clear and age-appropriate." },
  utme:     { label: "UTME-style", region: "nigeria", desc: "a Nigerian university matriculation exam (UTME style): four options, single best answer",
    calib: "- UTME/JAMB standard for university entry (SS3 level). Questions must require real working — multi-step algebra, indices/surds/logs, trigonometry, basic calculus, sequences, probability, coordinate geometry. Comparable to a moderately hard JAMB item, NOT junior-school arithmetic." },
  wassce:   { label: "WASSCE-style", region: "nigeria", desc: "a West-African senior-secondary certificate exam (SSCE/WASSCE style)",
    calib: "- Senior-secondary certificate (SS1–SS3) standard. Solid multi-step problems across the senior syllabus — clearly harder than basic recall." },
  postutme: { label: "Post-UTME style", region: "nigeria", desc: "a Nigerian university post-UTME screening test",
    calib: "- University screening level: at or slightly above UTME difficulty, multi-step reasoning." },
  sat:      { label: "SAT-style", region: "international", desc: "the digital SAT US college-admissions test; for verbal items write your OWN short original passage and base the question on it",
    calib: "- Digital SAT standard: Heart of Algebra, Problem-Solving & Data Analysis, and Advanced Math; real-world contexts, multi-step reasoning, carefully designed distractors." },
  igcse:    { label: "IGCSE-style", region: "international", desc: "an international GCSE (upper-secondary) exam at IGCSE difficulty",
    calib: "- IGCSE (Extended) standard: multi-step problems covering the IGCSE syllabus at full exam difficulty." },
  alevel:   { label: "A-Level-style", region: "international", desc: "an A-Level (advanced upper-secondary) exam",
    calib: "- A-Level standard: advanced and rigorous — calculus, further algebra, mechanics/statistics where relevant; genuinely demanding multi-step questions." },
  practice: { label: "Practice", region: "practice", desc: "general revision/practice questions for the subject (NOT tied to any specific exam)",
    calib: "- Cover the core syllabus at a fair, mixed difficulty (a few easy, mostly medium, some genuinely hard) suitable for self-study revision." },
};

const SUBJECT_LABELS = {
  english: "English Language", mathematics: "Mathematics", biology: "Biology",
  physics: "Physics", chemistry: "Chemistry", economics: "Economics",
  government: "Government", commerce: "Commerce", geography: "Geography",
  crk: "Christian Religious Studies", irk: "Islamic Religious Studies",
  englishlit: "Literature in English", accounting: "Financial Accounting",
  history: "History", civiledu: "Civic Education", agric: "Agricultural Science",
  quantitative: "Quantitative Reasoning", verbal: "Verbal Reasoning",
  generalstudies: "General Studies", furthermaths: "Further Mathematics",
  ict: "ICT", businessstudies: "Business Studies",
};

// The exam scheme determines which subjects are offered (drives the builder's
// subject list). Subject keys map to SUBJECT_LABELS above.
const SENIOR_NG = [
  "english", "mathematics", "biology", "physics", "chemistry", "economics",
  "government", "commerce", "geography", "englishlit", "accounting",
  "crk", "irk", "agric", "history", "civiledu",
];
const SCHEME_SUBJECTS = {
  cee: ["english", "mathematics", "quantitative", "verbal", "generalstudies"],
  utme: SENIOR_NG,
  wassce: SENIOR_NG,
  postutme: SENIOR_NG,
  sat: ["mathematics", "english"],
  igcse: ["mathematics", "english", "biology", "physics", "chemistry", "economics", "geography", "history", "ict", "businessstudies"],
  alevel: ["mathematics", "furthermaths", "physics", "chemistry", "biology", "economics", "geography", "history"],
  practice: [...SENIOR_NG, "quantitative", "verbal", "generalstudies", "furthermaths", "ict", "businessstudies"],
};

const subjKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
const subjLabel = (k, given) => SUBJECT_LABELS[k] || given || (k ? k[0].toUpperCase() + k.slice(1) : "Subject");

// ── Class is the PRIMARY navigation axis: Class → Subject → Topic → Paper ────
// A class is a school level. The legacy free-text `grade` ("JSS1", "Primary 6")
// is normalised to a stable `classLevel` key ("jss1", "primary6") for querying.
// Classes are Grade 1–12. The Nigerian Primary/JSS/SSS labels map onto these:
//   Primary 1–6 → Grade 1–6 · JSS 1–3 → Grade 7–9 · SSS 1–3 → Grade 10–12.
const CLASS_LEVELS = Array.from({ length: 12 }, (_, i) => ({ key: `grade${i + 1}`, label: `Grade ${i + 1}` }));
const CLASS_LABELS = Object.fromEntries(CLASS_LEVELS.map((c) => [c.key, c.label]));
// Legacy class keys → their Grade equivalent, so old data + any stray input normalise.
const LEGACY_CLASS = {
  primary1: "grade1", primary2: "grade2", primary3: "grade3", primary4: "grade4", primary5: "grade5", primary6: "grade6",
  jss1: "grade7", jss2: "grade8", jss3: "grade9", sss1: "grade10", sss2: "grade11", sss3: "grade12",
};
// Accept a normalised key OR a free label and return the canonical Grade key.
const classKey = (g) => {
  const s = String(g == null ? "" : g).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  return LEGACY_CLASS[s] || s || null;
};
// "unsorted" is a holding pen for legacy questions with no class — it is NOT in
// CLASS_LEVELS (so it never shows to students via /classes), but it is a valid
// classLevel the admin editor can browse to re-tag those questions.
const classLabel = (k) => CLASS_LABELS[k] || (k === "unsorted" ? "Unsorted" : (k || "Any class"));

// Curated topic identity: `topic` is the display name, `topicKey` its stable id.
// Legacy/untagged questions live under the catch-all "General" topic.
const GENERAL_TOPIC = "General";
const topicKeyOf = (t) =>
  String(t == null ? "" : t).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "general";

// Composite keys → single-field equality queries (no composite index needed).
const csKey = (cl, subj) => `${cl}__${subj}`;
const cstKey = (cl, subj, tk) => `${cl}__${subj}__${tk}`;
const PAPER_SIZE = 60; // each paper holds at most 60 questions; papers per topic are unlimited
const paperKeyOf = (cl, subj, tk, paper) => `${cstKey(cl, subj, tk)}__p${paper}`;
const paperNoForCount = (count) => Math.floor(count / PAPER_SIZE) + 1; // which paper the NEXT question fills

// Accept only http(s) or site-relative URLs for images/videos (no inline scripts).
const safeUrl = (u) => {
  const s = String(u == null ? "" : u).trim().slice(0, 500);
  return /^(https?:\/\/|\/)\S+$/i.test(s) ? s : null;
};
// "set" = an intro video to watch before the questions; else tied to the question.
const videoScopeOf = (v) => (String(v || "").toLowerCase() === "set" ? "set" : "question");

// The exact .js shape we want the model to return (and that admins can copy to
// feed their own AI). String.raw keeps the double backslashes literal. It shows
// EVERY supported question type plus an inline-SVG image example.
const SAMPLE_JS = String.raw`/**
 * Return ONE JavaScript file shaped EXACTLY like this. Keep the array name
 * examQuestions. Every item MUST have a "type". Field rules per type:
 *   objective / polar  → "options" (array) + "answerIndex" (0-based). No "answer".
 *   short / theory / subjective → "answer" (string). No "options"/"answerIndex".
 * "image" is null, OR a self-contained inline <svg>…</svg> string, OR a public URL.
 * "video" is null, OR a public video URL (YouTube/Vimeo/.mp4). "videoScope" is
 *   "question" (watch with this question) or "set" (an intro to watch first).
 * "grade" is the class/level the question suits (e.g. "JSS1", "Primary 6",
 *   "SSS2") — REQUIRED on EVERY item.
 * Wrap maths in \( … \) using DOUBLE backslashes for commands, exactly as shown.
 */
const examQuestions = [
  {
    type: "objective",                       // 4 options, one correct
    grade: "SSS2",
    question: "Evaluate \\( \\int_0^1 (3x^2 + 2x)\\,dx \\).",
    image: null,
    video: null,
    options: ["\\( 2 \\)", "\\( 3 \\)", "\\( \\frac{5}{2} \\)", "\\( 1 \\)"],
    answerIndex: 0,
    hint: "Integrate term by term, then apply the limits.",
    explanation: ["\\( [x^3 + x^2]_0^1 = (1+1) - 0 = 2 \\)."]
  },
  {
    type: "objective",                       // video example — learner watches, then answers
    question: "According to the video, what is the main product of photosynthesis?",
    image: null,
    video: "https://www.youtube.com/watch?v=example",
    videoScope: "question",
    options: ["Glucose", "Protein", "Lipid", "Starch only"],
    answerIndex: 0,
    explanation: ["The video states glucose is the primary product; starch is a storage form."]
  },
  {
    type: "polar",                           // true/false or yes/no — two poles
    question: "Sodium reacts vigorously with cold water.",
    image: null,
    options: ["True", "False"],
    answerIndex: 0,
    explanation: ["Sodium is a Group 1 metal; it reacts vigorously with cold water to give hydrogen and sodium hydroxide."]
  },
  {
    type: "short",                           // short answer (a word/phrase) — no options
    question: "State the SI unit of electric current.",
    image: null,
    answer: "Ampere",
    explanation: ["The ampere (A) is the SI base unit of electric current."]
  },
  {
    type: "subjective",                      // fill-in-the-blank: ____ goes inside the sentence
    question: "The process by which green plants make food using sunlight is called ____.",
    image: null,
    answer: "photosynthesis",
    explanation: ["Photosynthesis converts light energy into chemical energy stored in glucose."]
  },
  {
    type: "theory",                          // written answer — model answer in "answer"
    question: "Explain why ionic compounds conduct electricity when molten but not when solid.",
    image: null,
    answer: "When molten, the ions are free to move and carry charge through the liquid. In the solid state the ions are locked in fixed positions in the lattice, so they cannot move and no current flows.",
    explanation: ["Conduction needs mobile charge carriers; in an ionic solid the ions are not free to move."]
  },
  {
    type: "objective",                       // image example — a SELF-CONTAINED inline SVG
    question: "In the diagram, the two resistors are connected in:",
    image: "<svg viewBox='0 0 120 40' xmlns='http://www.w3.org/2000/svg'><line x1='5' y1='20' x2='30' y2='20' stroke='currentColor' fill='none'/><rect x='30' y='12' width='25' height='16' fill='none' stroke='currentColor'/><rect x='65' y='12' width='25' height='16' fill='none' stroke='currentColor'/><line x1='90' y1='20' x2='115' y2='20' stroke='currentColor'/></svg>",
    options: ["Series", "Parallel", "Short circuit", "Open circuit"],
    answerIndex: 0,
    explanation: ["The resistors lie end to end on a single current path, so they are in series."]
  }
];`;

// What each question "type" means + the fields it must carry.
const TYPE_GUIDE = {
  objective:  'OBJECTIVE (MCQ) — a stem with EXACTLY four options and ONE correct answer. Set "options" (4 strings) + "answerIndex" (0-based). No "answer" field.',
  polar:      'POLAR — a true/false (or yes/no) statement. Set "options" to the two poles (e.g. ["True","False"]) + "answerIndex". No "answer" field.',
  short:      'SHORT — answered with a single word or short phrase. Set "answer" to that word/phrase. OMIT "options"/"answerIndex".',
  theory:     'THEORY — a longer written answer. Set "answer" to a concise model answer (the key marking points). OMIT "options"/"answerIndex".',
  subjective: 'SUBJECTIVE — a fill-in-the-blank: put a blank of 4+ underscores (____) somewhere INSIDE the question sentence where the missing word/phrase belongs, and set "answer" to the word/phrase that fills it. OMIT "options"/"answerIndex".',
};
const ALL_TYPES = Object.keys(TYPE_GUIDE);

function genPrompt(scheme, subjectLabel, topic, count, types, wantImages, video, grade) {
  const sc = SCHEMES[scheme] || SCHEMES.utme;
  const isMath = /math|further\s*math|quantitative/i.test(subjectLabel);
  const gradeStr = String(grade || "").trim().slice(0, 60);
  const gradeBlock = gradeStr
    ? `\nTARGET CLASS / GRADE: ${gradeStr}. Pitch vocabulary, context and difficulty for ${gradeStr}, and set "grade": "${gradeStr}" on EVERY question.\n`
    : `\nCLASS TAG: set "grade" on EVERY question to the class/level it best fits (e.g. "Primary 6", "JSS1", "JSS3", "SSS2"). This is REQUIRED — never omit it.\n`;
  let chosen = (Array.isArray(types) && types.length ? types : ["objective"])
    .map((t) => String(t).toLowerCase().trim()).filter((t) => TYPE_GUIDE[t]);
  if (!chosen.length) chosen = ["objective"];
  const typeBlock = chosen.map((t) => "- " + TYPE_GUIDE[t]).join("\n");
  const mixLine = chosen.length > 1
    ? `Use a realistic MIX of these ${chosen.length} question types across the set (not all the same): ${chosen.join(", ")}.`
    : `EVERY question must be of type "${chosen[0]}".`;
  const imageBlock = wantImages
    ? `IMAGES: where a diagram genuinely helps (geometry, circuits, graphs, structures), set "image" to a SELF-CONTAINED inline SVG string you create (<svg viewBox='…'>…</svg>, use stroke='currentColor' so it adapts to the theme); otherwise set "image": null. NEVER reference external or copyrighted image files.`
    : `IMAGES: set "image": null for every question (no diagrams).`;
  // Optional: questions BASED ON a video. The URL goes INTO the prompt so a
  // video-capable model (e.g. Gemini) can open and watch it; transcript optional.
  const vurl = video && video.url;
  const vtext = video && String(video.text || "").trim().slice(0, 6000);
  let videoBlock;
  if (vurl || vtext) {
    const ref = `${vurl ? `Video: ${vurl}\n` : ""}${vtext ? `Transcript / notes:\n${vtext}\n` : ""}`;
    const vrules = `Open and watch the link, then write questions GROUNDED in the video's concepts (do not contradict it). Do NOT just ask "what did the video say" literal recall — instead test real understanding ACROSS Bloom's levels: recall a key fact, explain an idea in the learner's own words, APPLY a concept to a fresh example/scenario not shown in the video, and analyse/compare where it fits. Weight toward Understand and Apply.`;
    videoBlock = video.scope === "set"
      ? `\nSOURCE VIDEO — WATCH-FIRST INTRO. The learner watches this ONE video first, then answers the whole set.\n${ref}${vrules} This single intro video is shown ONCE for the whole set, so set "video": null on each item (do not repeat it per question).\n`
      : `\nSOURCE VIDEO. Base the questions on this video.\n${ref}${vrules} For EACH question set "video" to the most relevant public URL (the one above, or a more specific clip/timestamp) and "videoScope": "question", so the learner watches it with that question.\n`;
  } else {
    videoBlock = `\nVIDEO (optional): you MAY give any question its own clip — set "video" to a public YouTube/Vimeo/.mp4 URL and "videoScope": "question". Otherwise set "video": null.\n`;
  }
  return `You are a SENIOR examiner writing ORIGINAL questions for ${subjectLabel}, in the STYLE of ${sc.desc}.

Generate exactly ${count} questions${topic ? ` focused on the topic: ${topic}` : ""}.
${gradeBlock}
QUESTION TYPES — ${mixLine}
${typeBlock}

COGNITIVE RANGE (Bloom's taxonomy) — do NOT make every question literal recall. Spread across:
- Remember (recall a fact/definition), Understand (explain/interpret in own words), Apply (use the idea in a NEW situation or worked example), Analyse (compare, contrast, give reasons), and where suitable Evaluate/Create.
Weight the mix toward Understand and Apply.

DIFFICULTY — match the real exam (critical):
${sc.calib}
- Do NOT write trivially easy or single-step questions unless the exam itself is at that level (${scheme === "cee" ? "this one is" : scheme === "practice" ? "use mixed difficulty" : "this one is NOT — it is a senior/exam-level test"}).
- Spread difficulty realistically: a few easier, mostly medium, some genuinely hard.
${isMath ? `
MATHEMATICS RIGOR:
- Require real multi-step working (typically 2–4 steps), not one-operation recall.
- Use topics that fit the level (algebra, indices, surds, logarithms, trigonometry, calculus, sequences/series, probability, coordinate geometry — choose what suits the scheme).
- For objective items, make ALL options plausible: distractors should reflect common mistakes (sign slips, wrong formula, mis-applied rule), never random numbers.
- Keep arithmetic clean enough to solve by hand unless the exam allows a calculator.
` : ""}
MANDATORY:
- Original, brand-new questions. NEVER reproduce, quote, or lightly reword a real past exam question.
- No copyrighted passages, named datasets or third-party diagrams. Self-contained content only.
- For objective/polar: options are the real answer values — NEVER the letters A/B/C/D or placeholders; "answerIndex" is the 0-based index of the correct option.
- For short/theory/subjective: provide a clear, correct "answer" (model answer / key points) and OMIT options.
- "explanation" is an array of short strings. Every item carries its correct "type" AND a "grade" (its class/level).
${imageBlock}
${videoBlock}- Wrap ALL mathematics in LaTeX delimiters using DOUBLE backslashes for commands, EXACTLY as in the sample (e.g. the sample's fractions/integrals). Keep money/currency as plain text, not inside math.

OUTPUT — return the result as a SINGLE COPY BLOCK: one fenced \`\`\`js code block containing ONLY "const examQuestions = [ … ];" EXACTLY in the format below. Put nothing before or after the code block — no prose, no JSON, no commentary:

\`\`\`js
${SAMPLE_JS}
\`\`\`

Now output ONLY the \`\`\`js copy block for ${count} ${subjectLabel} question(s).`;
}

// Resolve a question's type from its declared "type" (or infer from its shape).
function normType(t, q) {
  const s = String(t || "").toLowerCase().trim();
  if (TYPE_GUIDE[s]) return s;
  if (q && Array.isArray(q.options) && q.options.filter(Boolean).length >= 2) {
    return q.options.filter(Boolean).length === 2 ? "polar" : "objective";
  }
  if (q && typeof q.answer === "string" && q.answer.trim()) return "short";
  return "objective";
}

// Normalise an explanation (array kept as array, else trimmed string), fixLatex'd.
function normExpl(e, fix) {
  const f = fix ? fixLatex : (x) => String(x == null ? "" : x);
  return Array.isArray(e)
    ? e.map((x) => f(x).slice(0, 1200)).filter(Boolean).slice(0, 20)
    : f(e || "").slice(0, 3000);
}

// LaTeX often contains lone backslashes (\sqrt, \sin) that are invalid JSON
// escapes and break JSON.parse — double any backslash that isn't a valid escape.
function safeJson(t) {
  try { return JSON.parse(t); }
  catch (_) { return JSON.parse(String(t).replace(/\\(?![\\/"bfnrtu])/g, "\\\\")); }
}

// Some LaTeX commands collide with VALID JSON escapes (\frac→\f=form-feed,
// \beta→\b=backspace, \theta/\times/\tan→\t=tab), so JSON.parse silently turns
// them into a control char + the rest. Repair those control chars back to a
// backslash so the command (\frac, \beta, \theta…) is restored for MathJax.
function fixLatex(s) {
  s = String(s == null ? "" : s);
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c === 12) out += "\\f";
    else if (c === 8) out += "\\b";
    else if (c === 9) out += "\\t";
    else if (c === 13) out += "\\r"; // \rightarrow, \rho, \rfloor…
    else if (c === 10) out += "\\n"; // \nu, \neq, \nabla… (exam text rarely needs real newlines)
    else out += ch;
  }
  return out;
}

// One provider's raw text (or null on failure). json=true asks for JSON.
async function callGroqRaw(prompt, json) {
  if (!process.env.GROQ_API_KEY) return null;
  const body = { model: GROQ_DEFAULT_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 6000 };
  if (json) body.response_format = { type: "json_object" };
  const r = await fetch(GROQ_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: JSON.stringify(body) });
  if (r.ok) { const d = await r.json(); const t = d.choices?.[0]?.message?.content; if (t) return t; }
  return null;
}
async function callGeminiRaw(prompt, json) {
  if (!process.env.GEMINI_API_KEY) return null;
  for (const url of GEMINI_MODELS) {
    try {
      const gc = { temperature: 0.7, maxOutputTokens: 8000 };
      if (json) gc.responseMimeType = "application/json";
      const r = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: gc }) });
      if (!r.ok) { if ([404, 429, 503].includes(r.status)) continue; break; }
      const d = await r.json(); const t = d.candidates?.[0]?.content?.parts?.[0]?.text; if (t) return t;
    } catch (e) { continue; }
  }
  return null;
}

// Raw model text with a provider preference order. Defaults to Groq → Gemini
// (the generator's choice); marking overrides it per question type.
async function callModelRaw(prompt, json, order = ["groq", "gemini"]) {
  for (const p of order) {
    const fn = p === "gemini" ? callGeminiRaw : callGroqRaw;
    try { const t = await fn(prompt, json); if (t) return t; }
    catch (e) { console.warn(`[cbt] ${p}:`, e.message); }
  }
  throw new Error("AI is unavailable right now — try again.");
}

// JSON convenience wrapper (used by the rephrase flow + marking).
async function callModel(prompt, order) { return safeJson(await callModelRaw(prompt, true, order)); }

function cleanQuestions(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const q of arr) {
    if (!q || typeof q !== "object") continue;
    const question = fixLatex(q.question).trim().slice(0, 2000);
    if (question.length < 6) continue;
    const dedupe = question.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(dedupe)) continue;
    const type = normType(q.type, q);
    const explanation = normExpl(q.explanation, true);
    const hint = fixLatex(q.hint || "").slice(0, 600);
    const image = typeof q.image === "string" && q.image.trim() ? q.image.trim().slice(0, 80000) : null;
    const video = safeUrl(q.video);
    const videoScope = video ? videoScopeOf(q.videoScope) : "question";
    const grade = String(q.grade || "").trim().slice(0, 60) || null;
    const opts = Array.isArray(q.options) ? q.options.map((o) => fixLatex(o).trim().slice(0, 300)).filter(Boolean) : [];

    if (opts.length >= 2) {
      // Objective / polar (MCQ) — needs 2–6 real options + a correct index.
      if (opts.length > 6) continue;
      if (opts.every((o) => /^[A-D]$/i.test(o.trim()))) continue; // reject placeholders
      let ai = parseInt(q.answerIndex ?? q.correctIndex, 10);
      if ((!Number.isInteger(ai) || ai < 0 || ai >= opts.length) && typeof q.answer === "string") {
        const idx = opts.findIndex((o) => o === fixLatex(q.answer).trim());
        ai = idx >= 0 ? idx : 0;
      }
      if (!Number.isInteger(ai) || ai < 0 || ai >= opts.length) ai = 0;
      seen.add(dedupe);
      out.push({ type: opts.length === 2 && type === "polar" ? "polar" : "objective", question, options: opts, answerIndex: ai, answer: null, explanation, hint, image, video, videoScope, grade });
    } else {
      // Free-response (short / theory / subjective) — needs an answer.
      const answer = fixLatex(q.answer || "").trim().slice(0, 4000);
      if (!answer) continue;
      seen.add(dedupe);
      out.push({ type: ["short", "theory", "subjective"].includes(type) ? type : "short", question, options: null, answerIndex: null, answer, explanation, hint, image, video, videoScope, grade });
    }
  }
  return out;
}

// Validate/normalise an admin-supplied question (manual add or edit). Handles
// both MCQ (objective/polar) and free-response (short/theory/subjective).
function validBody(b) {
  const question = fixLatex(b.question).trim();
  if (question.length < 3) return { error: "Question text is required." };
  const wanted = String(b.type || "").toLowerCase();
  const isFree = ["short", "theory", "subjective"].includes(wanted);
  const explanation = Array.isArray(b.explanation)
    ? b.explanation.map((x) => fixLatex(x).slice(0, 800)).filter(Boolean).slice(0, 15)
    : fixLatex(b.explanation || "").slice(0, 2000);
  const hint = fixLatex(b.hint || "").slice(0, 600);
  let image = typeof b.image === "string" ? b.image.trim().slice(0, 80000) : null;
  if (!image) image = null;
  const video = safeUrl(b.video);
  const videoScope = video ? videoScopeOf(b.videoScope) : "question";
  // Class is required; topic defaults to the catch-all "General". `grade` keeps
  // the human label (derived from classLevel) for backward-compatible display.
  const classLevel = classKey(b.classLevel || b.grade);
  if (!classLevel) return { error: "Pick a class for this question." };
  const grade = classLabel(classLevel);
  const topic = String(b.topic || "").trim().slice(0, 120) || GENERAL_TOPIC;

  if (isFree) {
    const answer = fixLatex(b.answer || "").trim().slice(0, 4000);
    if (!answer) return { error: "Provide the model answer for this question." };
    return { type: wanted, question, options: null, answerIndex: null, answer, explanation, hint, image, video, videoScope, classLevel, grade, topic };
  }
  const options = Array.isArray(b.options) ? b.options.map((o) => fixLatex(o).trim().slice(0, 400)).filter(Boolean) : [];
  const ai = parseInt(b.answerIndex, 10);
  if (options.length < 2 || options.length > 6) return { error: "Provide 2 to 6 options." };
  if (!Number.isInteger(ai) || ai < 0 || ai >= options.length) return { error: "Choose which option is correct." };
  const type = wanted === "polar" || options.length === 2 ? "polar" : "objective";
  return { type, question, options, answerIndex: ai, answer: null, explanation, hint, image, video, videoScope, classLevel, grade, topic };
}

// Parse an uploaded question-library .js file of the form
//   const examQuestions = [ { question, image, options, correctIndex, hint, explanation } , … ];
// Runs in a sandboxed VM (admin-only feature) and returns the array. Because the
// file is real JS, string escaping (\( \) \frac …) is handled by the JS engine —
// no JSON-escape corruption.
function parseExamJs(code) {
  let src = String(code)
    .replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "") // strip markdown code fences
    .replace(/^\s*import\s.*$/gm, "")          // drop ES import lines (break vm)
    .replace(/^\s*export\s+default\s+/gm, "")
    .replace(/^\s*export\s+/gm, "");
  // Capture the FIRST array-valued top-level declaration (examQuestions,
  // quizData, chemistryObjective, …) regardless of its name.
  src = src.replace(/\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*\[/, "globalThis.__arr = [");
  const wrapped = src +
    "\n;(function(){ try { return (typeof __arr!=='undefined' && __arr) ||" +
    " (typeof examQuestions!=='undefined' && examQuestions) ||" +
    " (typeof module!=='undefined' && Array.isArray(module.exports) && module.exports) || []; } catch (e) { return []; } })();";
  const sandbox = { module: { exports: [] }, exports: {}, window: {}, console: { log() {}, warn() {}, error() {} } };
  sandbox.globalThis = sandbox;
  let out;
  try { out = vm.runInNewContext(wrapped, sandbox, { timeout: 4000 }); } catch (_) { out = null; }
  if (Array.isArray(out)) return out;
  return Array.isArray(sandbox.__arr) ? sandbox.__arr : [];
}

// Normalise imported items (correctIndex→answerIndex, keep image paths, keep
// explanation arrays). No fixLatex — the JS file's strings are already correct.
function importQuestions(arr) {
  const out = [];
  for (const q of arr || []) {
    if (!q || typeof q !== "object") continue;
    const question = String(q.question || "").trim().slice(0, 4000);
    if (question.length < 3) continue;
    const type = normType(q.type, q);
    const explanation = normExpl(q.explanation, false);
    const hint = String(q.hint || "").slice(0, 800);
    const image = typeof q.image === "string" && q.image.trim() ? q.image.trim().slice(0, 80000) : null;
    const video = safeUrl(q.video);
    const videoScope = video ? videoScopeOf(q.videoScope) : "question";
    const grade = String(q.grade || "").trim().slice(0, 60) || null;
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o == null ? "" : o).trim().slice(0, 800)).filter(Boolean) : [];

    if (options.length >= 2) {
      let ai = Number.isInteger(q.correctIndex) ? q.correctIndex : (Number.isInteger(q.answerIndex) ? q.answerIndex : -1);
      // Some files store the answer as text — match it to an option.
      if ((ai < 0 || ai >= options.length) && typeof q.answer === "string") {
        const idx = options.findIndex((o) => o === q.answer.trim());
        if (idx >= 0) ai = idx;
      }
      if (ai < 0 || ai >= options.length) ai = 0;
      out.push({ type: options.length === 2 && type === "polar" ? "polar" : "objective", question, options, answerIndex: ai, answer: null, explanation, hint, image, video, videoScope, grade });
    } else {
      // Free-response import (short / theory / subjective).
      const answer = String(q.answer == null ? "" : q.answer).trim().slice(0, 6000);
      if (!answer) continue;
      out.push({ type: ["short", "theory", "subjective"].includes(type) ? type : "short", question, options: null, answerIndex: null, answer, explanation, hint, image, video, videoScope, grade });
    }
  }
  return out;
}

// Rephrase a group of questions (keeps option order/count → correct answer stays
// at the same index). Returns an array aligned to `group` ([{question,options}]|null).
async function rephraseGroup(group) {
  const list = group.map((q, i) => `[${i}] QUESTION: ${q.question}\nOPTIONS: ${JSON.stringify(q.options || [])}`).join("\n\n");
  const prompt = `Rephrase these ${group.length} multiple-choice questions to be ORIGINAL wording while keeping the EXACT same meaning, difficulty and correct answer.
For EACH question:
- Reword the question stem in fresh language.
- Reword EVERY option, but keep them in the SAME order and the SAME count — do NOT add, remove or reorder options. The correct answer must stay in its original position.
- Keep EVERY mathematical/chemical expression wrapped in its delimiters exactly as in the original — \\( … \\) or $ … $. Never output a LaTeX command (\\frac, \\rightarrow, etc.) outside delimiters.
- Keep every number/answer correct. Do not change which option is correct.

Return ONLY JSON (same order as given):
{ "items": [ { "question": "<reworded>", "options": ["<reworded option 0>", "<reworded option 1>", "..."] } ] }

QUESTIONS:
${list}`;
  const raw = await callModel(prompt);
  const items = (raw && (raw.items || raw.questions)) || [];
  return group.map((q, i) => {
    const it = items[i];
    if (!it || typeof it !== "object") return null;
    const question = fixLatex(it.question).trim();
    const options = Array.isArray(it.options) ? it.options.map((o) => fixLatex(o).trim()).filter(Boolean) : [];
    if (question.length < 3 || options.length !== (q.options || []).length) return null;
    return { question, options };
  });
}

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const stamp = admin.firestore.FieldValue.serverTimestamp;

  // ── Admin /stats cache ──────────────────────────────────────────────────────
  // /stats scans the WHOLE cbtQuestions collection (~2.6k docs = ~2.6k Firestore
  // reads PER call). The admin Data tab re-loaded it on every visit, which alone
  // drained the daily read quota (17 loads ≈ 45k reads). We cache the computed
  // result and invalidate it whenever the bank is written to, so repeat loads —
  // and concurrent admins — cost ZERO reads while staying accurate after edits.
  let _statsCache = null, _statsAt = 0;
  const STATS_TTL = 10 * 60 * 1000; // backstop; writes invalidate immediately
  const invalidateStats = () => { _statsCache = null; _statsAt = 0; };

  // How many questions already sit in a class/subject/topic bucket. Uses the
  // count aggregate → billed as ONE read regardless of bucket size.
  async function bucketCount(cst) {
    try {
      const agg = await db().collection("cbtQuestions").where("classSubjectTopic", "==", cst).count().get();
      return agg.data().count || 0;
    } catch (_) {
      return 0;
    }
  }

  // Resolve the organising fields (classLevel/topic/composite keys) + auto-assign
  // the paper a question belongs in. `seq` lets batch writers pre-count once and
  // pass an offset so a 200-question import spreads across papers correctly.
  function organise(cl, subj, topicName, count) {
    const tk = topicKeyOf(topicName);
    const paperNo = paperNoForCount(count);
    return {
      classLevel: cl,
      topic: String(topicName || GENERAL_TOPIC).trim().slice(0, 120) || GENERAL_TOPIC,
      topicKey: tk,
      classSubject: csKey(cl, subj),
      classSubjectTopic: cstKey(cl, subj, tk),
      paperNo,
      paperKey: paperKeyOf(cl, subj, tk, paperNo),
    };
  }

  // Assign papers across a whole BATCH: bucket by class/subject/topic and
  // continue each bucket's paper numbering from its current size (one count read
  // per distinct bucket). Returns org fields aligned 1:1 with `items`.
  async function organiseBatch(subj, items) {
    const counts = {};
    const ensure = new Map(); // cst -> { cl, topic }
    const out = [];
    for (const it of items) {
      const cl = it.classLevel;
      const cst = cstKey(cl, subj, topicKeyOf(it.topic));
      if (counts[cst] == null) counts[cst] = await bucketCount(cst);
      out.push(organise(cl, subj, it.topic, counts[cst]));
      counts[cst] += 1;
      if (!ensure.has(cst)) ensure.set(cst, { cl, topic: it.topic });
    }
    for (const { cl, topic } of ensure.values()) await ensureTopic(cl, subj, topic);
    return out;
  }

  // ── Topic registry (cbtTopics) — the curated topic list per class+subject ──
  // One doc per `${classLevel}__${subject}` holding { classLevel, subject,
  // topics: [{name, key}] }. Drives the admin topic picker and the student
  // topic filter, so topics stay consistent instead of drifting free-text.
  const topicRegRef = (cl, subj) => db().collection("cbtTopics").doc(csKey(cl, subj));
  async function getTopicList(cl, subj) {
    try {
      const s = await topicRegRef(cl, subj).get();
      const arr = (s.exists && Array.isArray(s.data().topics)) ? s.data().topics : [];
      return arr.filter((t) => t && t.name).map((t) => ({ name: String(t.name).slice(0, 120), key: t.key || topicKeyOf(t.name) }));
    } catch (_) {
      return [];
    }
  }
  // Make sure a topic name is registered for a class+subject (idempotent).
  async function ensureTopic(cl, subj, topicName) {
    const name = String(topicName || "").trim().slice(0, 120);
    if (!name) return;
    const key = topicKeyOf(name);
    const ref = topicRegRef(cl, subj);
    try {
      await db().runTransaction(async (tx) => {
        const s = await tx.get(ref);
        const topics = (s.exists && Array.isArray(s.data().topics)) ? s.data().topics : [];
        if (topics.some((t) => (t.key || topicKeyOf(t.name)) === key)) return;
        topics.push({ name, key });
        tx.set(ref, { classLevel: cl, subject: subj, topics, updatedAt: stamp() }, { merge: true });
      });
    } catch (_) {}
  }

  // Whether to hide "original" (verbatim past-paper) questions from learners —
  // a kill-switch if the exam bodies object. Cached 30s; admins still see them.
  let _hoAt = 0, _ho = false;
  async function hideOriginals() {
    if (Date.now() - _hoAt < 30000) return _ho;
    try { const s = await db().collection("config").doc("site").get(); _ho = !!(s.exists && s.data().hideOriginals === true); }
    catch (_) { _ho = false; }
    _hoAt = Date.now();
    return _ho;
  }

  // ── POST /generate — admin builds the bank ──────────────────────
  router.post("/generate", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      const scheme = String(b.scheme || "").toLowerCase().trim();
      if (!SCHEMES[scheme]) return res.status(400).json({ error: "Unknown scheme." });
      const key = subjKey(b.subject);
      if (!key) return res.status(400).json({ error: "Subject is required." });
      const label = subjLabel(key, b.subject);
      const topic = String(b.topic || "").trim().slice(0, 120);
      const count = Math.min(Math.max(parseInt(b.count, 10) || 10, 1), 30);
      const types = Array.isArray(b.types) ? b.types.filter((t) => typeof t === "string" && t.trim()).slice(0, 6) : [];
      const wantImages = b.images === true || b.wantImages === true;
      // Optional: generate FROM a video the learner watches first.
      const video = { url: safeUrl(b.video), text: String(b.videoText || "").trim().slice(0, 6000), scope: videoScopeOf(b.videoScope) };
      const grade = String(b.grade || "").trim().slice(0, 60);

      // Ask for a .js file and parse it in the sandbox; fall back to JSON.
      const text = await callModelRaw(genPrompt(scheme, label, topic, count, types, wantImages, video, grade), false);
      let arr = parseExamJs(text);
      if (!arr.length) { try { const j = safeJson(text); arr = j.questions || j.items || (Array.isArray(j) ? j : []); } catch (_) {} }
      const questions = cleanQuestions(arr);
      if (!questions.length) return res.status(502).json({ error: "The model returned no usable questions — try again." });

      // Every question needs a class to file under (per-question grade or the
      // batch grade). The topic is the generation's topic (or "General").
      const batchClass = classKey(grade);
      const topicName = topic || GENERAL_TOPIC;
      const items = [];
      for (const q of questions) {
        const cl = classKey(q.grade) || batchClass;
        if (!cl) continue; // unclassifiable → can't be navigated to; drop it
        items.push({ q, classLevel: cl, grade: classLabel(cl), topic: topicName });
      }
      if (!items.length) return res.status(400).json({ error: "Pick a class/grade — generated questions need a class to file under." });

      const orgs = await organiseBatch(key, items.map((it) => ({ classLevel: it.classLevel, topic: it.topic })));
      const batch = db().batch();
      items.forEach((it, i) => {
        const q = it.q;
        // Watch-first → one intro URL stamped on the set; per-question → keep the
        // AI's own per-item video (falling back to the batch URL if it omitted one).
        let vurl, vscope;
        if (video.url && video.scope === "set") { vurl = video.url; vscope = "set"; }
        else if (q.video) { vurl = q.video; vscope = q.videoScope || "question"; }
        else if (video.url) { vurl = video.url; vscope = video.scope; }
        else { vurl = null; vscope = "question"; }
        const ref = db().collection("cbtQuestions").doc();
        batch.set(ref, {
          scheme, subject: key, subjectLabel: label,
          schemeSubject: `${scheme}__${key}`,
          ...orgs[i], grade: it.grade,
          type: q.type || "objective",
          question: q.question,
          options: q.options || null,
          answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : null,
          answer: q.answer || null,
          explanation: q.explanation, hint: q.hint || "", image: q.image || null,
          video: vurl, videoScope: vscope,
          source: "ai",
          createdAt: stamp(), updatedAt: stamp(),
        });
      });
      await batch.commit();
      invalidateStats();
      res.json({ ok: true, saved: items.length });
    } catch (e) {
      console.error("[/api/cbt/generate]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /stats — admin bank summary ─────────────────────────────
  router.get("/stats", authenticate, requireAdmin, async (_req, res) => {
    try {
      if (_statsCache && Date.now() - _statsAt < STATS_TTL) {
        return res.json({ ..._statsCache, cached: true });
      }
      const snap = await db().collection("cbtQuestions").get();
      quota.addReads(snap.size); // count the real fan-out, not just 1/request
      const byScheme = {};
      snap.forEach((d) => {
        const x = d.data();
        const s = x.scheme || "?";
        (byScheme[s] = byScheme[s] || { total: 0, subjects: {} });
        byScheme[s].total++;
        const k = x.subject || "?";
        byScheme[s].subjects[k] = (byScheme[s].subjects[k] || 0) + 1;
      });
      _statsCache = { total: snap.size, byScheme, schemes: SCHEMES, subjectLabels: SUBJECT_LABELS };
      _statsAt = Date.now();
      res.json(_statsCache);
    } catch (e) {
      console.error("[/api/cbt/stats]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /facets?scheme= — subjects for a scheme ─────────────────
  router.get("/facets", async (req, res) => {
    try {
      const scheme = String(req.query.scheme || "").toLowerCase().trim();
      if (!SCHEMES[scheme]) return res.json({ scheme, subjects: [] });
      const snap = await db().collection("cbtQuestions").where("scheme", "==", scheme).get();
      quota.addReads(snap.size);
      const counts = {};
      snap.forEach((d) => { const x = d.data(); if (x.subject) counts[x.subject] = (counts[x.subject] || 0) + 1; });
      const subjects = Object.entries(counts)
        .map(([key, count]) => ({ key, label: subjLabel(key), count }))
        .filter((s) => s.count > 0)
        .sort((a, b) => a.label.localeCompare(b.label));
      res.json({ scheme, schemeLabel: SCHEMES[scheme].label, total: snap.size, subjects });
    } catch (e) {
      console.error("[/api/cbt/facets]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /questions?scheme=&subject=&limit=&random= — take a test ─
  const msOf = (x) => (x && x.toMillis ? x.toMillis() : 0);
  const mapPublic = (x) => ({
    id: x.id, type: x.type || "objective", question: x.question, options: x.options || [],
    answerIndex: typeof x.answerIndex === "number" ? x.answerIndex : 0,
    correctIndex: typeof x.answerIndex === "number" ? x.answerIndex : 0,
    answer: x.answer || null,
    explanation: x.explanation || "", hint: x.hint || "", image: x.image || null,
    video: x.video || null, videoScope: x.videoScope || "question",
    paper: x.paperNo || x.paper || null, topic: x.topic || null,
    classLevel: x.classLevel || null, grade: x.grade || null,
    subject: x.subject, subjectLabel: x.subjectLabel, scheme: x.scheme,
  });

  router.get("/", async (req, res) => {
    try {
      const subject = subjKey(req.query.subject);
      const cls = classKey(req.query.class);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 60, 1), 60);
      const format = String(req.query.format || "").toLowerCase(); // "mcq" | "blank" | "theory" | ""
      const ho = await hideOriginals();
      const answerable = (x) => (Array.isArray(x.options) && x.options.length >= 2) || (typeof x.answer === "string" && x.answer.trim());

      let questions, meta;
      if (cls && subject) {
        // ── NEW MODEL: Class → Subject → Topic → Paper ──
        // A paper is a STABLE set of ≤60 questions, served via the single-field
        // paperKey equality (≤60 doc reads, ordered for a consistent paper).
        const topic = String(req.query.topic || "").trim();
        if (!topic) return res.status(400).json({ error: "topic is required for class/subject practice." });
        const tk = topicKeyOf(topic);
        const paperNo = Math.max(1, parseInt(req.query.paper, 10) || 1);
        const pk = paperKeyOf(cls, subject, tk, paperNo);
        const snap = await db().collection("cbtQuestions").where("paperKey", "==", pk).get();
        quota.addReads(snap.size);
        let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          .filter((x) => !(ho && x.source === "past")).filter(answerable);
        docs.sort((a, b) => msOf(a.createdAt) - msOf(b.createdAt)); // stable paper order
        questions = docs.map(mapPublic);
        meta = { class: cls, subject, topic, paper: paperNo };
      } else {
        // ── LEGACY: scheme → subject (kept for the existing exam flow) ──
        const scheme = String(req.query.scheme || "").toLowerCase().trim();
        if (!SCHEMES[scheme] || !subject) return res.status(400).json({ error: "Provide class+subject+topic (or scheme+subject)." });
        const paper = ["1", "2"].includes(String(req.query.paper)) ? String(req.query.paper) : null;
        const topicFilter = String(req.query.topic || "").toLowerCase().trim();
        const gradeFilter = String(req.query.grade || "").trim();
        const random = req.query.random !== "0";
        const snap = await db().collection("cbtQuestions")
          .where("schemeSubject", "==", `${scheme}__${subject}`).limit(Math.max(limit * 4, 150)).get();
        quota.addReads(snap.size);
        questions = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          .filter((x) => !(ho && x.source === "past")).filter(answerable).map(mapPublic);
        if (paper) questions = questions.filter((q) => String(q.paper || "") === paper);
        if (topicFilter) questions = questions.filter((q) => String(q.topic || "").toLowerCase() === topicFilter);
        if (gradeFilter) questions = questions.filter((q) => String(q.grade || "") === gradeFilter);
        if (random) for (let i = questions.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]; }
        meta = { scheme, subject, paper };
      }

      // Format filter: mcq = options-bearing; blank = fill-in-the-blank
      // (subjective); theory = the remaining free-response (theory/short/essay).
      const hasOpts = (q) => q.options && q.options.length >= 2;
      if (format === "mcq") questions = questions.filter(hasOpts);
      else if (format === "blank") questions = questions.filter((q) => !hasOpts(q) && q.type === "subjective");
      else if (format === "theory") questions = questions.filter((q) => !hasOpts(q) && q.type !== "subjective");

      questions = questions.slice(0, limit);
      res.json({ count: questions.length, ...meta, questions });
    } catch (e) {
      console.error("[/api/cbt]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /template — the exact .js shape + a ready-to-paste prompt (admin) ──
  // Optional params (scheme, subject, topic, count, types, images) make the
  // returned `prompt` parameter-aware — the SAME advanced prompt used in-app.
  router.get("/template", authenticate, requireAdmin, (req, res) => {
    const q = req.query || {};
    const scheme = SCHEMES[String(q.scheme || "").toLowerCase().trim()] ? String(q.scheme).toLowerCase().trim() : "utme";
    const key = subjKey(q.subject);
    const label = key ? subjLabel(key, q.subject) : "the subject";
    const topic = String(q.topic || "").trim().slice(0, 120);
    const count = Math.min(Math.max(parseInt(q.count, 10) || 20, 1), 60);
    const types = String(q.types || "").split(",").map((t) => t.trim().toLowerCase()).filter((t) => TYPE_GUIDE[t]);
    const wantImages = q.images === "1" || q.images === "true";
    const video = { url: safeUrl(q.video), text: String(q.videoText || "").trim().slice(0, 6000), scope: videoScopeOf(q.videoScope) };
    const grade = String(q.grade || "").trim().slice(0, 60);
    res.json({ template: SAMPLE_JS, types: ALL_TYPES, prompt: genPrompt(scheme, label, topic, count, types, wantImages, video, grade) });
  });

  // ── POST /mark — AI-grade a free-response answer (server-side, signed-in) ──
  // { question, answer, modelAnswer, type } → { score, outOf, feedback } /10.
  // Model rotation by type: short answers & fill-in-the-blanks go to Groq (fast,
  // cheap, plenty for a word/phrase); full theory goes to Gemini first (stronger
  // long-form reasoning). Each falls back to the other if its first pick is down.
  router.post("/mark", authenticate, async (req, res) => {
    try {
      const b = req.body || {};
      const question = String(b.question || "").trim().slice(0, 4000);
      const answer = String(b.answer || "").trim().slice(0, 6000);
      const model = String(b.modelAnswer || "").trim().slice(0, 6000);
      const type = String(b.type || "").toLowerCase().trim();
      if (!question || !answer) return res.json({ score: 0, outOf: 10, feedback: "No answer to mark." });

      // Short / fill-in-the-blank: a confident match to the model answer is full
      // marks with no AI round-trip — so these ALWAYS get marked, instantly.
      const isShort = type === "short" || type === "subjective";
      if (isShort && model) {
        const norm = (s) => String(s).toLowerCase().replace(/\\[()[\]]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
        const a = norm(answer), m = norm(model);
        if (a && m && (a === m || (m.length > 3 && (a === m || a.includes(m) || m.includes(a))))) {
          return res.json({ score: 10, outOf: 10, feedback: "Correct — matches the expected answer." });
        }
      }

      const prompt = `You are a fair, encouraging examiner. Grade the student's answer out of 10.
QUESTION: ${question}
${model ? `MODEL ANSWER / KEY POINTS: ${model}` : ""}
STUDENT ANSWER: ${answer}

Award marks for accuracy, relevant key points and clarity; ignore spelling/grammar unless it changes meaning. Give brief, specific, constructive feedback (1-3 sentences) and note any missed key points.
Return ONLY JSON: {"score": <0-10 integer>, "outOf": 10, "feedback": "<feedback>"}`;
      // short/subjective → Groq first; theory/essay (or unknown) → Gemini first.
      const order = isShort ? ["groq", "gemini"] : ["gemini", "groq"];
      let out;
      try { out = await callModel(prompt, order); } catch (_) { out = null; }
      let score = parseInt(out && out.score, 10);
      if (!Number.isInteger(score) || score < 0) score = 0;
      if (score > 10) score = 10;
      const feedback = (out && typeof out.feedback === "string" && out.feedback.trim())
        ? out.feedback.trim().slice(0, 1500)
        : "Couldn't grade automatically — compare your answer with the model answer shown.";
      res.json({ score, outOf: 10, feedback });
    } catch (e) {
      console.error("[/api/cbt/mark]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Count a bucket by a single-field key via the count aggregate (1 read).
  const keyCount = async (field, val) => {
    try { return (await db().collection("cbtQuestions").where(field, "==", val).count().get()).data().count || 0; }
    catch (_) { return 0; }
  };

  // ── GET /classes — the class axis (the FIRST step) with live counts ──
  let _clAt = 0, _clCache = null;
  router.get("/classes", async (_req, res) => {
    try {
      if (_clCache && Date.now() - _clAt < 5 * 60 * 1000) return res.json(_clCache);
      const classes = await Promise.all(
        CLASS_LEVELS.map(async (c) => ({ key: c.key, label: c.label, count: await keyCount("classLevel", c.key) })),
      );
      const data = { classes };
      _clCache = data; _clAt = Date.now();
      res.json(data);
    } catch (e) {
      console.error("[/api/cbt/classes]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /subjects?class= — subjects available for a class (+counts) ──
  // Class-first: subjects come from the topic registry (every class+subject that
  // has questions has a registry doc). Legacy ?scheme= mode kept for exam flow.
  router.get("/subjects", async (req, res) => {
    try {
      const cls = classKey(req.query.class);
      if (cls) {
        const snap = await db().collection("cbtTopics").where("classLevel", "==", cls).get();
        const subs = [...new Set(snap.docs.map((d) => d.data().subject).filter(Boolean))];
        const subjects = (await Promise.all(
          subs.map(async (k) => ({ key: k, label: subjLabel(k), count: await keyCount("classSubject", csKey(cls, k)) })),
        )).filter((s) => s.count > 0).sort((a, b) => a.label.localeCompare(b.label));
        return res.json({ class: cls, classLabel: classLabel(cls), subjects });
      }
      const scheme = String(req.query.scheme || "").toLowerCase().trim();
      if (!SCHEMES[scheme]) return res.json({ scheme, subjects: [] });
      const configured = SCHEME_SUBJECTS[scheme] || [];
      const snap = await db().collection("cbtQuestions").where("scheme", "==", scheme).get();
      quota.addReads(snap.size);
      const counts = {};
      snap.forEach((d) => { const k = d.data().subject; if (k) counts[k] = (counts[k] || 0) + 1; });
      const subjects = configured.map((k) => ({ key: k, label: subjLabel(k), count: counts[k] || 0 }));
      res.json({ scheme, schemeLabel: SCHEMES[scheme].label, subjects });
    } catch (e) {
      console.error("[/api/cbt/subjects]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /topics?class=&subject= — curated topics for a class+subject ──
  // Returns the registry topics with live question counts + how many papers each
  // holds (ceil(count/60)). Legacy ?scheme=&subject= mode kept for exam flow.
  router.get("/topics", async (req, res) => {
    try {
      const cls = classKey(req.query.class);
      const subject = subjKey(req.query.subject);
      if (cls && subject) {
        const list = await getTopicList(cls, subject);
        const topics = (await Promise.all(list.map(async (t) => {
          const count = await keyCount("classSubjectTopic", cstKey(cls, subject, t.key));
          return { topic: t.name, key: t.key, count, papers: Math.ceil(count / PAPER_SIZE) };
        }))).sort((a, b) => a.topic.localeCompare(b.topic));
        return res.json({ class: cls, subject, topics });
      }
      // Legacy: distinct topics for a scheme+subject(s).
      const scheme = String(req.query.scheme || "").toLowerCase().trim();
      if (!SCHEMES[scheme]) return res.json({ scheme, topics: [] });
      const subs = [].concat(req.query.subject || []).flatMap((s) => String(s).split(",")).map((s) => subjKey(s)).filter(Boolean);
      const counts = {}, gcounts = {};
      const tally = (docs) => { quota.addReads(docs.length); docs.forEach((d) => {
        const x = d.data();
        const t = (x.topic || "").trim(); if (t) counts[t] = (counts[t] || 0) + 1;
        const g = (x.grade || "").trim(); if (g) gcounts[g] = (gcounts[g] || 0) + 1;
      }); };
      if (subs.length) for (const sub of subs) tally((await db().collection("cbtQuestions").where("schemeSubject", "==", `${scheme}__${sub}`).get()).docs);
      else tally((await db().collection("cbtQuestions").where("scheme", "==", scheme).get()).docs);
      res.json({
        scheme,
        topics: Object.entries(counts).map(([topic, count]) => ({ topic, count })).sort((a, b) => a.topic.localeCompare(b.topic)),
        grades: Object.entries(gcounts).map(([grade, count]) => ({ grade, count })).sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true })),
      });
    } catch (e) {
      console.error("[/api/cbt/topics]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /papers?class=&subject=&topic= — papers for a topic (≤60 each) ──
  router.get("/papers", async (req, res) => {
    try {
      const cls = classKey(req.query.class);
      const subject = subjKey(req.query.subject);
      const topic = String(req.query.topic || "").trim();
      if (!cls || !subject || !topic) return res.status(400).json({ error: "class, subject and topic are required." });
      const count = await keyCount("classSubjectTopic", cstKey(cls, subject, topicKeyOf(topic)));
      const papers = Math.ceil(count / PAPER_SIZE);
      res.json({
        class: cls, subject, topic, count, paperSize: PAPER_SIZE, papers,
        list: Array.from({ length: papers }, (_, i) => ({ paper: i + 1, label: `Paper ${i + 1}` })),
      });
    } catch (e) {
      console.error("[/api/cbt/papers]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── Topic registry management (admin) ──
  // GET  /topic-list?class=&subject=  → raw curated topics [{name,key}]
  // POST /topic-list { class, subject, action:"add"|"remove", name }
  router.get("/topic-list", authenticate, requireAdmin, async (req, res) => {
    try {
      const cls = classKey(req.query.class), subject = subjKey(req.query.subject);
      if (!cls || !subject) return res.status(400).json({ error: "class and subject required." });
      res.json({ class: cls, subject, topics: await getTopicList(cls, subject) });
    } catch (e) {
      console.error("[/api/cbt/topic-list GET]", e.message);
      res.status(500).json({ error: e.message });
    }
  });
  router.post("/topic-list", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      const cls = classKey(b.class), subject = subjKey(b.subject);
      const name = String(b.name || "").trim().slice(0, 120);
      if (!cls || !subject || !name) return res.status(400).json({ error: "class, subject and name required." });
      const action = b.action === "remove" ? "remove" : "add";
      if (action === "add") {
        await ensureTopic(cls, subject, name);
      } else {
        const key = topicKeyOf(name);
        const ref = topicRegRef(cls, subject);
        await db().runTransaction(async (tx) => {
          const s = await tx.get(ref);
          const topics = (s.exists && Array.isArray(s.data().topics)) ? s.data().topics : [];
          tx.set(ref, { classLevel: cls, subject, topics: topics.filter((t) => (t.key || topicKeyOf(t.name)) !== key), updatedAt: stamp() }, { merge: true });
        });
      }
      res.json({ ok: true, topics: await getTopicList(cls, subject) });
    } catch (e) {
      console.error("[/api/cbt/topic-list POST]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /list?class=&subject=&topic=&paper= — admin: full docs for editing ──
  // Class-first; falls back to legacy ?scheme=&subject= when no class is given.
  router.get("/list", authenticate, requireAdmin, async (req, res) => {
    try {
      const cls = classKey(req.query.class);
      const subject = subjKey(req.query.subject);
      if (!subject) return res.status(400).json({ error: "subject required." });
      const col = db().collection("cbtQuestions");
      let items;
      if (cls) {
        const topic = String(req.query.topic || "").trim();
        const paperNo = parseInt(req.query.paper, 10);
        let snap;
        if (topic && paperNo > 0) snap = await col.where("paperKey", "==", paperKeyOf(cls, subject, topicKeyOf(topic), paperNo)).get();
        else if (topic) snap = await col.where("classSubjectTopic", "==", cstKey(cls, subject, topicKeyOf(topic))).get();
        else snap = await col.where("classSubject", "==", csKey(cls, subject)).get();
        items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } else {
        const scheme = String(req.query.scheme || "").toLowerCase().trim();
        if (!scheme) return res.status(400).json({ error: "class or scheme required." });
        items = (await col.where("schemeSubject", "==", `${scheme}__${subject}`).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      quota.addReads(items.length);
      items.sort((a, b) => msOf(b.createdAt) - msOf(a.createdAt));
      res.json({ count: items.length, questions: items });
    } catch (e) {
      console.error("[/api/cbt/list]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /question — admin: add one question manually ──
  router.post("/question", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      // Scheme is now an optional attribute (AI calibration + tag); Class is the
      // primary axis. Default to "practice" when not supplied.
      const scheme = SCHEMES[String(b.scheme || "").toLowerCase().trim()] ? String(b.scheme).toLowerCase().trim() : "practice";
      const key = subjKey(b.subject);
      if (!key) return res.status(400).json({ error: "Subject is required." });
      const v = validBody(b);
      if (v.error) return res.status(400).json({ error: v.error });

      // Auto-assign the paper from the current bucket size, register the topic.
      const cst = cstKey(v.classLevel, key, topicKeyOf(v.topic));
      const org = organise(v.classLevel, key, v.topic, await bucketCount(cst));
      await ensureTopic(v.classLevel, key, v.topic);

      const ref = db().collection("cbtQuestions").doc();
      await ref.set({
        scheme, subject: key, subjectLabel: subjLabel(key, b.subject),
        schemeSubject: `${scheme}__${key}`, source: "manual",
        ...v, ...org, createdAt: stamp(), updatedAt: stamp(),
      });
      invalidateStats();
      res.json({ ok: true, id: ref.id, paper: org.paperNo });
    } catch (e) {
      console.error("[/api/cbt/question POST]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── PUT /question/:id — admin: edit a question (incl. scheme/subject) ──
  router.put("/question/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      const ref = db().collection("cbtQuestions").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "Question not found." });
      const cur = snap.data();
      const v = validBody(b);
      if (v.error) return res.status(400).json({ error: v.error });

      const scheme = SCHEMES[String(b.scheme || "").toLowerCase().trim()] ? String(b.scheme).toLowerCase().trim() : (cur.scheme || "practice");
      const key = subjKey(b.subject) || cur.subject;
      if (!key) return res.status(400).json({ error: "Subject is required." });

      // Reassign the paper ONLY if the class/subject/topic bucket changed; an
      // in-place edit keeps the question in its existing paper.
      const newCst = cstKey(v.classLevel, key, topicKeyOf(v.topic));
      let org;
      if (cur.classSubjectTopic === newCst && cur.paperNo) {
        const tk = topicKeyOf(v.topic);
        org = {
          classLevel: v.classLevel, topic: v.topic, topicKey: tk,
          classSubject: csKey(v.classLevel, key), classSubjectTopic: newCst,
          paperNo: cur.paperNo, paperKey: paperKeyOf(v.classLevel, key, tk, cur.paperNo),
        };
      } else {
        org = organise(v.classLevel, key, v.topic, await bucketCount(newCst));
      }
      await ensureTopic(v.classLevel, key, v.topic);

      const patch = {
        ...v, ...org,
        scheme, subject: key, subjectLabel: subjLabel(key, b.subject || key),
        schemeSubject: `${scheme}__${key}`,
        updatedAt: stamp(),
      };
      await ref.set(patch, { merge: true });
      invalidateStats();
      res.json({ ok: true, paper: org.paperNo });
    } catch (e) {
      console.error("[/api/cbt/question PUT]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /rephrase — admin: AI-reword originals into "rephrased" copies ──
  // { scheme, subject, paper?, max? } — idempotent (skips originals already done).
  router.post("/rephrase", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      const scheme = String(b.scheme || "").toLowerCase().trim();
      const key = subjKey(b.subject);
      if (!SCHEMES[scheme] || !key) return res.status(400).json({ error: "scheme and subject required." });
      const paper = ["1", "2"].includes(String(b.paper)) ? String(b.paper) : null;
      const max = Math.min(Math.max(parseInt(b.max, 10) || 20, 1), 40);
      const ss = `${scheme}__${key}`;

      const snap = await db().collection("cbtQuestions").where("schemeSubject", "==", ss).get();
      quota.addReads(snap.size);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const done = new Set(docs.filter((d) => d.source === "rephrased" && d.originalId).map((d) => d.originalId));
      let originals = docs.filter((d) => d.source === "past" && !done.has(d.id));
      if (paper) originals = originals.filter((d) => String(d.paper || "") === paper);
      const remainingBefore = originals.length;
      const slice = originals.slice(0, max);

      let created = 0;
      for (let i = 0; i < slice.length; i += 10) {
        const group = slice.slice(i, i + 10);
        let out = null;
        try { out = await rephraseGroup(group); } catch (_) { out = null; }
        if (!out) continue;
        const batch = db().batch();
        let n = 0;
        group.forEach((orig, gi) => {
          const r = out[gi];
          if (!r || !Array.isArray(r.options) || r.options.length !== (orig.options || []).length) return;
          const ref = db().collection("cbtQuestions").doc();
          batch.set(ref, {
            scheme, subject: key, subjectLabel: orig.subjectLabel || subjLabel(key), schemeSubject: ss,
            paper: orig.paper || null, source: "rephrased", originalId: orig.id,
            type: orig.type || "objective",
            question: r.question, options: r.options, answerIndex: orig.answerIndex,
            explanation: orig.explanation || "", hint: orig.hint || "", image: orig.image || null,
            video: orig.video || null, videoScope: orig.videoScope || "question",
            createdAt: stamp(), updatedAt: stamp(),
          });
          n++;
        });
        if (n) { await batch.commit(); created += n; }
      }
      invalidateStats();
      res.json({ ok: true, created, processed: slice.length, remaining: Math.max(0, remainingBefore - slice.length) });
    } catch (e) {
      console.error("[/api/cbt/rephrase]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /import — admin: bulk-import a question-library .js file ──
  // body { scheme, subject, paper, source ("past"|"rephrased"|"manual"), jsCode }
  router.post("/import", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      const scheme = String(b.scheme || "").toLowerCase().trim();
      const key = subjKey(b.subject);
      if (!SCHEMES[scheme]) return res.status(400).json({ error: "Unknown scheme." });
      if (!key) return res.status(400).json({ error: "Subject is required." });
      const source = ["past", "rephrased", "manual"].includes(b.source) ? b.source : "past";
      // Optional: stamp one video on the whole imported batch (watch-first sets).
      const batchVideo = safeUrl(b.video);
      const batchVideoScope = videoScopeOf(b.videoScope);
      const batchClass = classKey(b.grade);
      const topicName = String(b.topic || "").trim().slice(0, 120) || GENERAL_TOPIC;

      let arr;
      try { arr = parseExamJs(b.jsCode || ""); }
      catch (e) { return res.status(400).json({ error: "Couldn't parse the JS file: " + e.message }); }
      const parsed = importQuestions(arr);
      if (!parsed.length) return res.status(400).json({ error: "No questions found (expected `const examQuestions = [ … ]`)." });

      // Each imported question needs a class to file under (its own grade, else
      // the batch class), and a topic (the batch topic, or "General").
      const items = [];
      for (const q of parsed) {
        const cl = classKey(q.grade) || batchClass;
        if (!cl) continue;
        items.push({ q, classLevel: cl, grade: classLabel(cl), topic: topicName });
      }
      if (!items.length) return res.status(400).json({ error: "Pick a class/grade — imported questions need a class to file under." });

      const orgs = await organiseBatch(key, items.map((it) => ({ classLevel: it.classLevel, topic: it.topic })));
      let written = 0;
      for (let i = 0; i < items.length; i += 400) {
        const batch = db().batch();
        items.slice(i, i + 400).forEach((it, j) => {
          const q = it.q;
          const org = orgs[i + j];
          const ref = db().collection("cbtQuestions").doc();
          let video, videoScope;
          if (batchVideo && batchVideoScope === "set") { video = batchVideo; videoScope = "set"; }
          else if (q.video) { video = q.video; videoScope = q.videoScope; }
          else if (batchVideo) { video = batchVideo; videoScope = batchVideoScope; }
          else { video = null; videoScope = "question"; }
          batch.set(ref, {
            scheme, subject: key, subjectLabel: subjLabel(key, b.subject),
            schemeSubject: `${scheme}__${key}`, source,
            ...q, ...org, grade: it.grade, video, videoScope,
            createdAt: stamp(), updatedAt: stamp(),
          });
        });
        await batch.commit();
        written += Math.min(400, items.length - i);
      }
      invalidateStats();
      res.json({ ok: true, imported: written });
    } catch (e) {
      console.error("[/api/cbt/import]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── DELETE /question/:id — admin ──
  router.delete("/question/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      await db().collection("cbtQuestions").doc(req.params.id).delete();
      invalidateStats();
      res.json({ ok: true });
    } catch (e) {
      console.error("[/api/cbt/question DELETE]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};

// Pure helpers exposed for one-off maintenance scripts (not used by the app).
module.exports.helpers = { genPrompt, parseExamJs, cleanQuestions, callModelRaw, safeJson, SAMPLE_JS };
