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
const admin = require("firebase-admin");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { GEMINI_MODELS, GROQ_DEFAULT_MODEL } = require("../ai-models");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Schemes we offer — DESCRIPTIVE "…-style" labels, never an exam body's name.
const SCHEMES = {
  wassce:   { label: "WASSCE-style",    desc: "a West-African senior-secondary certificate exam (SSCE/WASSCE style) for students in Nigeria" },
  utme:     { label: "UTME-style",      desc: "a Nigerian university matriculation exam (UTME style): four options, single best answer" },
  postutme: { label: "Post-UTME style", desc: "a Nigerian university post-UTME screening test" },
  sat:      { label: "SAT-style",       desc: "the digital SAT US college-admissions test: concise four-option multiple choice; for verbal items write your OWN short original passage and base the question on it" },
  igcse:    { label: "IGCSE-style",     desc: "an international GCSE (upper-secondary) exam at IGCSE difficulty: four-option multiple choice" },
  alevel:   { label: "A-Level-style",   desc: "an A-Level (advanced upper-secondary) exam: rigorous four-option multiple choice at A-Level difficulty" },
};

const SUBJECT_LABELS = {
  english: "English Language", mathematics: "Mathematics", biology: "Biology",
  physics: "Physics", chemistry: "Chemistry", economics: "Economics",
  government: "Government", commerce: "Commerce", geography: "Geography",
  crk: "Christian Religious Studies", irk: "Islamic Religious Studies",
  englishlit: "Literature in English", accounting: "Financial Accounting",
  history: "History", civiledu: "Civic Education", agric: "Agricultural Science",
};

const subjKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
const subjLabel = (k, given) => SUBJECT_LABELS[k] || given || (k ? k[0].toUpperCase() + k.slice(1) : "Subject");

function genPrompt(scheme, subjectLabel, topic, count) {
  const sc = SCHEMES[scheme] || SCHEMES.utme;
  return `You are an examiner writing ORIGINAL multiple-choice questions for ${subjectLabel}, in the STYLE of ${sc.desc}.

Generate exactly ${count} questions${topic ? ` focused on the topic: ${topic}` : ""}.

MANDATORY:
- Write your OWN, brand-new questions. Match the genre, format and difficulty of the exam — but NEVER reproduce, quote, or lightly reword any real past exam question.
- Do NOT include copyrighted passages, named datasets, diagrams or images. Self-contained text only.
- Exactly FOUR options each, with exactly ONE correct answer.
- Keep each question and option concise and unambiguous.
- Add a one-sentence explanation of the correct answer.

RESPOND ONLY WITH VALID JSON (no markdown):
{ "questions": [ { "question": "<text>", "options": ["A","B","C","D"], "answerIndex": <0-3>, "explanation": "<one sentence>" } ] }`;
}

// Try Groq first (fast/cheap), then Gemini. Returns parsed { questions: [...] }.
async function callModel(prompt) {
  // ① Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: GROQ_DEFAULT_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7, max_tokens: 4000,
          response_format: { type: "json_object" },
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d.choices?.[0]?.message?.content;
        if (t) return JSON.parse(t);
      }
    } catch (e) { console.warn("[cbt] groq:", e.message); }
  }
  // ② Gemini
  if (process.env.GEMINI_API_KEY) {
    for (const url of GEMINI_MODELS) {
      try {
        const r = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 6000 },
          }),
        });
        if (!r.ok) { if ([404, 429, 503].includes(r.status)) continue; break; }
        const d = await r.json();
        const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
        if (t) return JSON.parse(t);
      } catch (e) { continue; }
    }
  }
  throw new Error("AI is unavailable right now — try again.");
}

function cleanQuestions(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const q of arr) {
    if (!q || typeof q !== "object") continue;
    const question = String(q.question || "").trim().slice(0, 1000);
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o == null ? "" : o).trim().slice(0, 300)).filter(Boolean) : [];
    let ai = parseInt(q.answerIndex, 10);
    if (question.length < 6 || options.length < 2 || options.length > 6) continue;
    if (!Number.isInteger(ai) || ai < 0 || ai >= options.length) ai = 0;
    const dedupe = question.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push({ question, options, answerIndex: ai, explanation: String(q.explanation || "").slice(0, 500) });
  }
  return out;
}

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const stamp = admin.firestore.FieldValue.serverTimestamp;

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

      const raw = await callModel(genPrompt(scheme, label, topic, count));
      const questions = cleanQuestions(raw.questions);
      if (!questions.length) return res.status(502).json({ error: "The model returned no usable questions — try again." });

      const batch = db().batch();
      questions.forEach((q) => {
        const ref = db().collection("cbtQuestions").doc();
        batch.set(ref, {
          scheme, subject: key, subjectLabel: label,
          schemeSubject: `${scheme}__${key}`,
          topic: topic || null,
          question: q.question, options: q.options, answerIndex: q.answerIndex,
          explanation: q.explanation, source: "ai", createdAt: stamp(),
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
      if (!SCHEMES[scheme] || !subject) return res.status(400).json({ error: "scheme and subject are required." });

      // Single-field equality on schemeSubject → no composite index needed.
      const pool = random ? Math.max(limit * 4, 80) : limit;
      const snap = await db().collection("cbtQuestions")
        .where("schemeSubject", "==", `${scheme}__${subject}`).limit(pool).get();

      let questions = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id, question: x.question, options: x.options || [],
          answerIndex: typeof x.answerIndex === "number" ? x.answerIndex : 0,
          correctIndex: typeof x.answerIndex === "number" ? x.answerIndex : 0,
          explanation: x.explanation || "", subject: x.subject, subjectLabel: x.subjectLabel,
          scheme: x.scheme,
        };
      });
      if (random) {
        for (let i = questions.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]; }
      }
      questions = questions.slice(0, limit);
      res.json({ count: questions.length, scheme, subject, questions });
    } catch (e) {
      console.error("[/api/cbt]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
