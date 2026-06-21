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
};

const subjKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
const subjLabel = (k, given) => SUBJECT_LABELS[k] || given || (k ? k[0].toUpperCase() + k.slice(1) : "Subject");

// The exact .js shape we want the model to return (and that admins can copy to
// feed their own AI). String.raw keeps the double backslashes literal.
const SAMPLE_JS = String.raw`const examQuestions = [
  {
    question: "Evaluate \\( \\int_0^1 (3x^2 + 2x)\\,dx \\).",
    image: null,
    options: ["\\( 2 \\)", "\\( 3 \\)", "\\( \\frac{5}{2} \\)", "\\( 1 \\)"],
    answerIndex: 0,
    explanation: ["\\( [x^3 + x^2]_0^1 = 1 + 1 = 2 \\)."]
  },
  {
    question: "Which gas is usually collected by downward delivery (upward displacement of air)?",
    image: null,
    options: ["Hydrogen", "Ammonia", "Carbon dioxide", "Methane"],
    answerIndex: 2,
    explanation: ["Carbon dioxide is denser than air, so it is collected by upward displacement of air."]
  }
];`;

function genPrompt(scheme, subjectLabel, topic, count, types) {
  const sc = SCHEMES[scheme] || SCHEMES.utme;
  const isMath = /math|further\s*math|quantitative/i.test(subjectLabel);
  const typeLine = (Array.isArray(types) && types.length)
    ? `\nUse a mix of these question types: ${types.join(", ")}.`
    : "";
  return `You are a SENIOR examiner writing ORIGINAL multiple-choice questions for ${subjectLabel}, in the STYLE of ${sc.desc}.

Generate exactly ${count} questions${topic ? ` focused on the topic: ${topic}` : ""}.${typeLine}

DIFFICULTY — match the real exam (critical):
${sc.calib}
- Do NOT write trivially easy or single-step questions unless the exam itself is at that level (${scheme === "cee" ? "this one is" : "this one is NOT — it is a senior/exam-level test"}).
- Spread difficulty realistically: a few easier, mostly medium, some genuinely hard.
${isMath ? `
MATHEMATICS RIGOR:
- Require real multi-step working (typically 2–4 steps), not one-operation recall.
- Use topics that fit the level (algebra, indices, surds, logarithms, trigonometry, calculus, sequences/series, probability, coordinate geometry — choose what suits the scheme).
- Make ALL four options plausible: distractors should reflect common mistakes (sign slips, wrong formula, mis-applied rule), never random numbers.
- Keep arithmetic clean enough to solve by hand unless the exam allows a calculator.
` : ""}
MANDATORY:
- Original, brand-new questions. NEVER reproduce, quote, or lightly reword a real past exam question.
- No copyrighted passages, named datasets, diagrams or images. Self-contained text only.
- Exactly FOUR options each, exactly ONE correct. Options are the real answer values — NEVER the letters A/B/C/D or placeholders.
- "answerIndex" is the 0-based index of the correct option.
- "explanation" is an array of short strings. "image" is null.
- Wrap ALL mathematics in LaTeX delimiters using DOUBLE backslashes for commands, EXACTLY as in the sample (e.g. the sample's fractions/integrals). Keep money/currency as plain text, not inside math.

OUTPUT — return ONLY a JavaScript file: a single "const examQuestions = [ … ];" array
EXACTLY in this format. No JSON, no markdown fences, no prose, no comments:

${SAMPLE_JS}

Now output ONLY the JavaScript for ${count} ${subjectLabel} question(s).`;
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

// Raw model text (Groq → Gemini). json=true asks for a JSON object response.
async function callModelRaw(prompt, json) {
  if (process.env.GROQ_API_KEY) {
    try {
      const body = { model: GROQ_DEFAULT_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 6000 };
      if (json) body.response_format = { type: "json_object" };
      const r = await fetch(GROQ_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: JSON.stringify(body) });
      if (r.ok) { const d = await r.json(); const t = d.choices?.[0]?.message?.content; if (t) return t; }
    } catch (e) { console.warn("[cbt] groq:", e.message); }
  }
  if (process.env.GEMINI_API_KEY) {
    for (const url of GEMINI_MODELS) {
      try {
        const gc = { temperature: 0.7, maxOutputTokens: 8000 };
        if (json) gc.responseMimeType = "application/json";
        const r = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: gc }) });
        if (!r.ok) { if ([404, 429, 503].includes(r.status)) continue; break; }
        const d = await r.json(); const t = d.candidates?.[0]?.content?.parts?.[0]?.text; if (t) return t;
      } catch (e) { continue; }
    }
  }
  throw new Error("AI is unavailable right now — try again.");
}

// JSON convenience wrapper (used by the rephrase flow).
async function callModel(prompt) { return safeJson(await callModelRaw(prompt, true)); }

function cleanQuestions(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const q of arr) {
    if (!q || typeof q !== "object") continue;
    const question = fixLatex(q.question).trim().slice(0, 1000);
    const options = Array.isArray(q.options) ? q.options.map((o) => fixLatex(o).trim().slice(0, 300)).filter(Boolean) : [];
    let ai = parseInt(q.answerIndex ?? q.correctIndex, 10);
    if (question.length < 6 || options.length < 2 || options.length > 6) continue;
    // Reject placeholder options like ["A","B","C","D"] the model sometimes echoes.
    if (options.every((o) => /^[A-D]$/i.test(o.trim()))) continue;
    if (!Number.isInteger(ai) || ai < 0 || ai >= options.length) ai = 0;
    const dedupe = question.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push({ question, options, answerIndex: ai, explanation: fixLatex(q.explanation).slice(0, 500) });
  }
  return out;
}

// Validate/normalise an admin-supplied question (manual add or edit).
function validBody(b) {
  const question = fixLatex(b.question).trim();
  const options = Array.isArray(b.options) ? b.options.map((o) => fixLatex(o).trim().slice(0, 400)).filter(Boolean) : [];
  const ai = parseInt(b.answerIndex, 10);
  if (question.length < 3) return { error: "Question text is required." };
  if (options.length < 2 || options.length > 6) return { error: "Provide 2 to 6 options." };
  if (!Number.isInteger(ai) || ai < 0 || ai >= options.length) return { error: "Choose which option is correct." };
  const explanation = Array.isArray(b.explanation)
    ? b.explanation.map((x) => fixLatex(x).slice(0, 800)).filter(Boolean).slice(0, 15)
    : fixLatex(b.explanation || "").slice(0, 2000);
  const hint = fixLatex(b.hint || "").slice(0, 600);
  let image = typeof b.image === "string" ? b.image.trim().slice(0, 80000) : null;
  if (!image) image = null;
  const paper = ["1", "2"].includes(String(b.paper)) ? String(b.paper) : null;
  return { question, options, answerIndex: ai, explanation, hint, image, paper };
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
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o == null ? "" : o).trim().slice(0, 800)).filter(Boolean) : [];
    let ai = Number.isInteger(q.correctIndex) ? q.correctIndex : (Number.isInteger(q.answerIndex) ? q.answerIndex : -1);
    if (question.length < 3 || options.length < 2) continue;
    // Some files store the answer as text — match it to an option.
    if ((ai < 0 || ai >= options.length) && typeof q.answer === "string") {
      const idx = options.findIndex((o) => o === q.answer.trim());
      if (idx >= 0) ai = idx;
    }
    if (ai < 0 || ai >= options.length) ai = 0;
    const explanation = Array.isArray(q.explanation)
      ? q.explanation.map((x) => String(x == null ? "" : x).slice(0, 1200)).filter(Boolean).slice(0, 20)
      : String(q.explanation || "").slice(0, 3000);
    const hint = String(q.hint || "").slice(0, 800);
    const image = typeof q.image === "string" && q.image.trim() ? q.image.trim().slice(0, 80000) : null;
    out.push({ question, options, answerIndex: ai, explanation, hint, image });
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
      const paper = ["1", "2"].includes(String(b.paper)) ? String(b.paper) : null;
      const types = Array.isArray(b.types) ? b.types.filter((t) => typeof t === "string" && t.trim()).slice(0, 6) : [];

      // Ask for a .js file and parse it in the sandbox; fall back to JSON.
      const text = await callModelRaw(genPrompt(scheme, label, topic, count, types), false);
      let arr = parseExamJs(text);
      if (!arr.length) { try { const j = safeJson(text); arr = j.questions || j.items || (Array.isArray(j) ? j : []); } catch (_) {} }
      const questions = cleanQuestions(arr);
      if (!questions.length) return res.status(502).json({ error: "The model returned no usable questions — try again." });

      const batch = db().batch();
      questions.forEach((q) => {
        const ref = db().collection("cbtQuestions").doc();
        batch.set(ref, {
          scheme, subject: key, subjectLabel: label,
          schemeSubject: `${scheme}__${key}`,
          topic: topic || null, paper,
          question: q.question, options: q.options, answerIndex: q.answerIndex,
          explanation: q.explanation, image: null, source: "ai",
          createdAt: stamp(), updatedAt: stamp(),
        });
      });
      await batch.commit();
      res.json({ ok: true, saved: questions.length });
    } catch (e) {
      console.error("[/api/cbt/generate]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /stats — admin bank summary ─────────────────────────────
  router.get("/stats", authenticate, requireAdmin, async (_req, res) => {
    try {
      const snap = await db().collection("cbtQuestions").get();
      const byScheme = {};
      snap.forEach((d) => {
        const x = d.data();
        const s = x.scheme || "?";
        (byScheme[s] = byScheme[s] || { total: 0, subjects: {} });
        byScheme[s].total++;
        const k = x.subject || "?";
        byScheme[s].subjects[k] = (byScheme[s].subjects[k] || 0) + 1;
      });
      res.json({ total: snap.size, byScheme, schemes: SCHEMES, subjectLabels: SUBJECT_LABELS });
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
  router.get("/", async (req, res) => {
    try {
      const scheme = String(req.query.scheme || "").toLowerCase().trim();
      const subject = subjKey(req.query.subject);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 60);
      const random = req.query.random !== "0";
      const paper = ["1", "2"].includes(String(req.query.paper)) ? String(req.query.paper) : null;
      if (!SCHEMES[scheme] || !subject) return res.status(400).json({ error: "scheme and subject are required." });

      // Single-field equality on schemeSubject → no composite index needed; the
      // optional paper filter is applied in code.
      const ho = await hideOriginals();
      const pool = Math.max(limit * 4, 150);
      const snap = await db().collection("cbtQuestions")
        .where("schemeSubject", "==", `${scheme}__${subject}`).limit(pool).get();

      let questions = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        // Kill-switch: hide verbatim originals if enabled (keep rephrased/ai/manual).
        .filter((x) => !(ho && x.source === "past"))
        .map((x) => ({
          id: x.id, question: x.question, options: x.options || [],
          answerIndex: typeof x.answerIndex === "number" ? x.answerIndex : 0,
          correctIndex: typeof x.answerIndex === "number" ? x.answerIndex : 0,
          explanation: x.explanation || "", hint: x.hint || "", image: x.image || null,
          paper: x.paper || null, subject: x.subject, subjectLabel: x.subjectLabel,
          scheme: x.scheme,
        }));
      if (paper) questions = questions.filter((q) => String(q.paper || "") === paper);
      if (random) {
        for (let i = questions.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]; }
      }
      questions = questions.slice(0, limit);
      res.json({ count: questions.length, scheme, subject, paper, questions });
    } catch (e) {
      console.error("[/api/cbt]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /template — the exact .js shape to feed an AI (admin) ──
  router.get("/template", authenticate, requireAdmin, (_req, res) => {
    res.json({ template: SAMPLE_JS });
  });

  // ── GET /subjects?scheme= — subjects the scheme offers (+counts) ──
  // The exam scheme DETERMINES the subject list (config), with live counts.
  router.get("/subjects", async (req, res) => {
    try {
      const scheme = String(req.query.scheme || "").toLowerCase().trim();
      if (!SCHEMES[scheme]) return res.json({ scheme, subjects: [] });
      const configured = SCHEME_SUBJECTS[scheme] || [];
      const snap = await db().collection("cbtQuestions").where("scheme", "==", scheme).get();
      const counts = {};
      snap.forEach((d) => { const k = d.data().subject; if (k) counts[k] = (counts[k] || 0) + 1; });
      const subjects = configured.map((k) => ({ key: k, label: subjLabel(k), count: counts[k] || 0 }));
      res.json({ scheme, schemeLabel: SCHEMES[scheme].label, subjects });
    } catch (e) {
      console.error("[/api/cbt/subjects]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /list?scheme=&subject=&paper= — admin: full docs for editing ──
  router.get("/list", authenticate, requireAdmin, async (req, res) => {
    try {
      const scheme = String(req.query.scheme || "").toLowerCase().trim();
      const subject = subjKey(req.query.subject);
      const paper = ["1", "2"].includes(String(req.query.paper)) ? String(req.query.paper) : null;
      if (!scheme || !subject) return res.status(400).json({ error: "scheme and subject required." });
      const snap = await db().collection("cbtQuestions").where("schemeSubject", "==", `${scheme}__${subject}`).get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (paper) items = items.filter((x) => String(x.paper || "") === paper);
      items.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
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
      const scheme = String(b.scheme || "").toLowerCase().trim();
      const key = subjKey(b.subject);
      if (!SCHEMES[scheme]) return res.status(400).json({ error: "Unknown scheme." });
      if (!key) return res.status(400).json({ error: "Subject is required." });
      const v = validBody(b);
      if (v.error) return res.status(400).json({ error: v.error });
      const ref = db().collection("cbtQuestions").doc();
      await ref.set({
        scheme, subject: key, subjectLabel: subjLabel(key, b.subject),
        schemeSubject: `${scheme}__${key}`, source: "manual",
        ...v, createdAt: stamp(), updatedAt: stamp(),
      });
      res.json({ ok: true, id: ref.id });
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
      const v = validBody(b);
      if (v.error) return res.status(400).json({ error: v.error });
      const patch = { ...v, updatedAt: stamp() };
      const scheme = String(b.scheme || "").toLowerCase().trim();
      const key = subjKey(b.subject);
      if (SCHEMES[scheme] && key) {
        patch.scheme = scheme; patch.subject = key;
        patch.subjectLabel = subjLabel(key, b.subject);
        patch.schemeSubject = `${scheme}__${key}`;
      }
      await ref.set(patch, { merge: true });
      res.json({ ok: true });
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
            question: r.question, options: r.options, answerIndex: orig.answerIndex,
            explanation: orig.explanation || "", hint: orig.hint || "", image: orig.image || null,
            createdAt: stamp(), updatedAt: stamp(),
          });
          n++;
        });
        if (n) { await batch.commit(); created += n; }
      }
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
      const paper = ["1", "2"].includes(String(b.paper)) ? String(b.paper) : "1";
      const source = ["past", "rephrased", "manual"].includes(b.source) ? b.source : "past";

      let arr;
      try { arr = parseExamJs(b.jsCode || ""); }
      catch (e) { return res.status(400).json({ error: "Couldn't parse the JS file: " + e.message }); }
      const items = importQuestions(arr);
      if (!items.length) return res.status(400).json({ error: "No questions found (expected `const examQuestions = [ … ]`)." });

      let written = 0;
      for (let i = 0; i < items.length; i += 400) {
        const batch = db().batch();
        items.slice(i, i + 400).forEach((q) => {
          const ref = db().collection("cbtQuestions").doc();
          batch.set(ref, {
            scheme, subject: key, subjectLabel: subjLabel(key, b.subject),
            schemeSubject: `${scheme}__${key}`, paper, source,
            ...q, createdAt: stamp(), updatedAt: stamp(),
          });
        });
        await batch.commit();
        written += Math.min(400, items.length - i);
      }
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
      res.json({ ok: true });
    } catch (e) {
      console.error("[/api/cbt/question DELETE]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
