/**
 * classify-cbt-topics.js — AI topic/class classifier for the practice bank.
 *
 * READS NOTHING FROM FIRESTORE. It works off the committed static export
 * (data/cbt/c/*.js) and calls the AI (Gemini → Groq) to:
 *   1. propose a short, Nigerian-curriculum topic list per class+subject bucket,
 *   2. assign every question to one of those topics, and
 *   3. judge whether the question's content actually fits its current class,
 *      proposing a better grade when it clearly doesn't.
 *
 * It writes a REVIEWABLE mapping to server/scripts/cbt-reclassify.json. It does
 * NOT touch the live bank — apply-cbt-reclassify.js does that later (after the
 * Firestore daily quota resets), once you've approved the proposed changes.
 *
 *   node server/scripts/classify-cbt-topics.js                  # all buckets
 *   node server/scripts/classify-cbt-topics.js grade10__biology # one bucket
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { GEMINI_MODELS, GROQ_DEFAULT_MODEL } = require("../ai-models");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const C_DIR = path.join(__dirname, "..", "..", "data", "cbt", "c");
const OUT = path.join(__dirname, "cbt-reclassify.json");

const CLASS_LABELS = {};
for (let i = 1; i <= 12; i++) CLASS_LABELS["grade" + i] = "Grade " + i;
const MAX_TOPICS = 10;      // cap per subject to avoid sprawl
const BATCH = 15;           // questions per assignment call

// ── AI plumbing (mirrors server/routes/cbt.js) ─────────────────────────────
// Strong Groq models first — the small llama-3.1-8b returns unmatchable topic
// strings & incomplete arrays for batch classification. Gemini is a last resort
// (the key is currently 429-rate-limited, so it usually no-ops fast).
const GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", GROQ_DEFAULT_MODEL];
async function callGroqRaw(prompt, model) {
  if (!process.env.GROQ_API_KEY) return null;
  const body = { model, messages: [{ role: "user", content: prompt }], temperature: 0.1, max_tokens: 4000, response_format: { type: "json_object" } };
  const r = await fetch(GROQ_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: JSON.stringify(body) });
  if (r.ok) { const d = await r.json(); return d.choices?.[0]?.message?.content || null; }
  return null;
}
async function callGeminiRaw(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  for (const url of GEMINI_MODELS) {
    try {
      const r = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 6000, responseMimeType: "application/json" } }),
      });
      if (!r.ok) { if ([404, 429, 503].includes(r.status)) continue; break; }
      const d = await r.json(); const t = d.candidates?.[0]?.content?.parts?.[0]?.text; if (t) return t;
    } catch (_) { continue; }
  }
  return null;
}
async function ai(prompt) {
  for (const model of GROQ_MODELS) {
    try { const t = await callGroqRaw(prompt, model); if (t) { const j = parse(t); if (j) return j; } } catch (_) {}
    await sleep(400);
  }
  try { const t = await callGeminiRaw(prompt); if (t) { const j = parse(t); if (j) return j; } } catch (_) {}
  return null;
}
function parse(t) {
  try { return JSON.parse(t); } catch (_) {}
  const m = String(t).match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (_) {} }
  return null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Load the static bank ───────────────────────────────────────────────────
function loadBuckets() {
  const buckets = {};
  for (const f of fs.readdirSync(C_DIR).filter((x) => x.endsWith(".js"))) {
    const txt = fs.readFileSync(path.join(C_DIR, f), "utf8");
    const m = txt.match(/export const QUESTIONS = (\[[\s\S]*\]);/);
    if (!m) continue;
    for (const q of JSON.parse(m[1])) {
      const key = `${q.classLevel}__${q.subject}`;
      (buckets[key] = buckets[key] || { classLevel: q.classLevel, subject: q.subject, subjectLabel: q.subjectLabel || q.subject, questions: [] }).questions.push(q);
    }
  }
  return buckets;
}

const labelFor = (b) => `${CLASS_LABELS[b.classLevel] || b.classLevel} ${b.subjectLabel}`;
// Natural Title Case: keep connector words lowercase (but not as the first word).
const SMALL = new Set(["and", "or", "of", "the", "in", "to", "for", "with", "a", "an"]);
const tidyTopic = (t) => String(t).trim().split(/\s+/)
  .map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w))
  .join(" ").slice(0, 60);
const qText = (q) => {
  let s = String(q.question || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (Array.isArray(q.options) && q.options.length) s += " [options: " + q.options.map((o) => String(o).slice(0, 40)).join(" | ").slice(0, 200) + "]";
  if (q.answer) s += " [answer: " + String(q.answer).slice(0, 80) + "]";
  return s;
};

async function proposeTaxonomy(b) {
  // Sample real questions so the taxonomy fits the ACTUAL content (these banks
  // are clustered, not a balanced syllabus) and splits big groups into useful
  // sub-topics rather than one catch-all.
  const sample = [];
  const step = Math.max(1, Math.floor(b.questions.length / 40));
  for (let i = 0; i < b.questions.length && sample.length < 40; i += step) sample.push(b.questions[i]);
  const lines = sample.map((q) => "- " + String(q.question || "").replace(/\s+/g, " ").slice(0, 110)).join("\n");
  const prompt =
`You are a Nigerian (UBE/WAEC) curriculum expert organising a "${labelFor(b)}" question bank into syllabus TOPICS.
Here is a representative SAMPLE of the questions:
${lines}

Produce 5 to ${MAX_TOPICS} topics that:
- collectively cover the sample (every question should fit exactly one),
- are granular enough that no single topic would swallow most questions — split a dominant area into its real sub-topics (e.g. cells → "Cell Structure & Organelles", "Cell Theory", "Cell Transport", "Prokaryotes & Eukaryotes"),
- use natural, full syllabus names in Title Case (e.g. "Genetics and Variation", not "Genetics Variation").
Return ONLY JSON: {"topics":["...","..."]}`;
  // Retry hard — a transient AI failure must NOT silently collapse the bucket
  // to a single "General" topic (that would wipe a good classification).
  for (let attempt = 0; attempt < 4; attempt++) {
    const j = await ai(prompt);
    let topics = (j && Array.isArray(j.topics) ? j.topics : []).map(tidyTopic).filter(Boolean);
    topics = [...new Set(topics)].slice(0, MAX_TOPICS);
    if (topics.length >= 2) return topics;
    await sleep(1500);
  }
  return null; // signal failure → caller skips the bucket
}

async function assignBatch(b, topics, qs) {
  const list = qs.map((q, i) => `${i}. ${qText(q)}`).join("\n");
  const prompt =
`Subject: "${labelFor(b)}". Available TOPICS (choose the single best fit, copy the exact string):
${topics.map((t) => `- ${t}`).join("\n")}

For each numbered question: pick the best topic from the list above, and judge whether its content/difficulty really fits ${CLASS_LABELS[b.classLevel] || b.classLevel}. If it clearly belongs to a different Nigerian grade, set suggestedClass to "grade1".."grade12"; otherwise null.
Questions:
${list}

Return ONLY JSON: {"a":[{"i":0,"topic":"<exact topic>","suggestedClass":null}, ...]} with one entry per question index.`;
  const j = await ai(prompt);
  return (j && Array.isArray(j.a)) ? j.a : [];
}

// snap an AI topic string to the taxonomy (exact, then case-insensitive, then includes)
function snap(topics, t) {
  if (!t) return null;
  const s = String(t).trim();
  let hit = topics.find((x) => x === s) || topics.find((x) => x.toLowerCase() === s.toLowerCase());
  if (hit) return hit;
  hit = topics.find((x) => x.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(x.toLowerCase()));
  return hit || null;
}
const validClass = (c) => (c && CLASS_LABELS[String(c).toLowerCase()] ? String(c).toLowerCase() : null);

(async () => {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) { console.error("No AI keys in server/.env"); process.exit(1); }
  const all = loadBuckets();
  const only = process.argv[2]; // optional single bucket key
  const keys = only ? [only] : Object.keys(all);
  if (only && !all[only]) { console.error("No such bucket:", only, "\nAvailable:\n", Object.keys(all).join("\n ")); process.exit(1); }

  // Merge into any existing output (so buckets can be done incrementally).
  let out = { generatedAt: new Date().toISOString(), buckets: {}, assignments: [], classChanges: [] };
  if (fs.existsSync(OUT)) { try { out = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (_) {} }
  out.generatedAt = new Date().toISOString();

  for (const key of keys) {
    const b = all[key];
    process.stdout.write(`\n[${key}] ${b.questions.length} questions — taxonomy… `);
    const topics = await proposeTaxonomy(b);
    if (!topics) { console.log("FAILED (AI unavailable) — bucket SKIPPED, existing data kept."); continue; }
    process.stdout.write(`${topics.length} topics: ${topics.join(", ")}\n`);

    const counts = {}; topics.forEach((t) => (counts[t] = 0));
    // drop any prior assignments for this bucket (re-run safe)
    out.assignments = out.assignments.filter((a) => `${a.oldClass}__${a.subject}` !== key);
    out.classChanges = out.classChanges.filter((c) => `${c.oldClass}__${c.subject}` !== key);

    // Pass 1: batch every question; collect any that don't resolve to a topic.
    const result = new Map(); // id -> { topic, suggestedClass }
    const pending = b.questions.slice();
    let pass = 0;
    while (pending.length && pass < 3) {
      pass++;
      const stillPending = [];
      for (let i = 0; i < pending.length; i += BATCH) {
        const slice = pending.slice(i, i + BATCH);
        const res = await assignBatch(b, topics, slice);
        slice.forEach((q, j) => {
          // match by explicit index, else by position when the array lines up
          const r = res.find((x) => Number(x.i) === j) || (res.length === slice.length ? res[j] : null) || {};
          const topic = snap(topics, r.topic);
          if (topic) result.set(q.id, { topic, suggestedClass: validClass(r.suggestedClass) });
          else stillPending.push(q);
        });
        process.stdout.write(`  pass${pass} …${Math.min(i + BATCH, pending.length)}/${pending.length}\r`);
      }
      pending.length = 0; pending.push(...stillPending);
      if (pending.length) await sleep(600);
    }

    let unresolved = 0;
    for (const q of b.questions) {
      const r = result.get(q.id) || {};
      const topic = r.topic || (unresolved++, topics[0]); // last-resort: first topic
      counts[topic] = (counts[topic] || 0) + 1;
      const newClass = r.suggestedClass && r.suggestedClass !== q.classLevel ? r.suggestedClass : q.classLevel;
      const changed = newClass !== q.classLevel;
      out.assignments.push({ id: q.id, subject: q.subject, oldClass: q.classLevel, oldTopic: q.topic || "General", newTopic: topic, newClass, classChanged: changed });
      if (changed) out.classChanges.push({ id: q.id, subject: q.subject, oldClass: q.classLevel, newClass, question: String(q.question || "").slice(0, 120) });
    }
    out.buckets[key] = { classLevel: b.classLevel, subject: b.subject, label: labelFor(b), taxonomy: topics, topicCounts: counts, unresolved };
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log(`\n  done — per topic: ${Object.entries(counts).map(([t, n]) => `${t}:${n}`).join(", ")}${unresolved ? `  (unresolved→${topics[0]}: ${unresolved})` : ""}`);
  }

  const moves = out.classChanges.length;
  console.log(`\n\nWrote ${OUT}`);
  console.log(`Buckets classified: ${keys.length}. Class-change flags so far: ${moves}.`);
  process.exit(0);
})().catch((e) => { console.error("\nClassify failed:", e); process.exit(1); });
