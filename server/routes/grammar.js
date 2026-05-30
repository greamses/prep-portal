/**
 * Grammar Police API
 *
 *   GET  /api/grammar/book    â€” public. The full editorial book content
 *                               (lessons, passages, exercises, furniture,
 *                               mascot + media). In-memory cached; the content
 *                               lives in ../content/grammarBook.js so copy can
 *                               be edited server-side with no front-end rebuild.
 *
 *   POST /api/grammar/check   â€” authenticated. Runs an AI grammar/punctuation
 *                               check on the student's own writing using the
 *                               app's server-side keys (Groq â†’ Claude â†’ Gemini
 *                               fallback) and returns structured JSON.
 *
 * Response of /check:
 *   {
 *     provider: "groq" | "claude" | "gemini",
 *     summary: "one friendly sentence",
 *     corrected: "the text with fixes applied",
 *     errors: [ { type, wrong, fix, why } ]
 *   }
 */

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { authenticate } = require("../middleware/auth");
const {
  GEMINI_MODELS,
  GROQ_DEFAULT_MODEL,
  CLAUDE_DEFAULT_MODEL,
} = require("../ai-models");

// ── Book registry ──────────────────────────────────────────────────────────
// The renderer is content-driven, so the SAME engine serves any number of books.
// Register each book module here under a URL-safe id; the default keeps the old
// /book response unchanged. Add a book: drop a module in ../content and add a line.
const BOOK = require("../content/grammarBook");
const BOOKS = {
  "grammar-police": BOOK,
  // "maths-magic": require("../content/mathsMagic"),
};
const DEFAULT_BOOK = "grammar-police";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Strip stray control characters (keep \n at 0x0A) that break JSON.parse.
const CONTROL_CHARS = new RegExp("[\u0000-\u0009\u000B-\u001F]+", "g");

// â”€â”€ The marking brief. Focused on the confusables + punctuation this book
//    teaches, but tolerant of British/Nigerian spelling. JSON-only output. â”€â”€
const CHECK_SYSTEM = `You are "Sergeant Sentence", a friendly but sharp grammar coach for Nigerian secondary-school students. You check a short piece of the student's own writing for the specific mistakes this workbook teaches.

PRIORITISE these error types (use the "type" value shown):
  confusable  â€” they're/their/there, we're/were/where, you're/your, it's/its, to/too/two, than/then
  punctuation â€” missing or wrong . ? , or apostrophe '
  capital     â€” sentence not starting with a capital, or lowercase "i"
  spelling    â€” only clear misspellings
  agreement   â€” subject/verb agreement (he go -> he goes)

RULES:
  - Do NOT mark British or Nigerian spellings (colour, centre, organise, learnt) as errors.
  - Only report REAL errors. If the writing is already correct, return an empty errors array and a congratulatory summary.
  - "fix" must be the corrected word/mark only. "why" must be one short, kind sentence a 13-year-old understands.
  - "corrected" is the full text with every fix applied, otherwise unchanged.
  - Keep "summary" to ONE encouraging sentence.

RESPOND WITH VALID JSON ONLY. No markdown, no backticks. Schema:
{
  "summary": "string",
  "corrected": "string",
  "errors": [
    { "type": "confusable|punctuation|capital|spelling|agreement", "wrong": "string", "fix": "string", "why": "string" }
  ]
}`;

function buildPrompt(text) {
  return `Check this student's writing and return JSON only.\n\nSTUDENT WRITING:\n"""\n${text}\n"""`;
}

// Pull the first {...} block and parse it (models sometimes wrap with prose).
function parseJsonLoose(raw) {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON object in model output.");
  const cleaned = raw.slice(s, e + 1).replace(CONTROL_CHARS, " ");
  return JSON.parse(cleaned);
}

function normalise(obj) {
  const errors = Array.isArray(obj.errors) ? obj.errors : [];
  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    corrected: typeof obj.corrected === "string" ? obj.corrected : "",
    errors: errors
      .filter((e) => e && (e.wrong || e.fix))
      .slice(0, 40)
      .map((e) => ({
        type: String(e.type || "grammar"),
        wrong: String(e.wrong || ""),
        fix: String(e.fix || ""),
        why: String(e.why || ""),
      })),
  };
}

// â”€â”€ Provider fallback chain (mirrors /api/ai/chat) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function runGroq(prompt) {
  if (!process.env.GROQ_API_KEY) return null;
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_DEFAULT_MODEL,
      messages: [
        { role: "system", content: CHECK_SYSTEM },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function runClaude(anthropic, prompt) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const r = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || CLAUDE_DEFAULT_MODEL,
    max_tokens: 2000,
    system: CHECK_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  return r.content?.[0]?.text || null;
}

async function runGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  const body = {
    systemInstruction: { parts: [{ text: CHECK_SYSTEM }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 2000,
    },
  };
  for (const modelUrl of GEMINI_MODELS) {
    try {
      const r = await fetch(`${modelUrl}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        if ([404, 429, 503].includes(r.status)) continue;
        break;
      }
      const data = await r.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      continue;
    }
  }
  return null;
}

// ── Learning-video search (public, server-side keys) ───────────────────────────
// Kid-friendly English channels for grammar/punctuation.
const VIDEO_CHANNELS = [
  { name: "Grammar Songs by Melissa", handle: "grammarsongsmelissa" },
  { name: "Scratch Garden", handle: "scratchgarden" },
  { name: "English Tree TV", handle: "englishteetv" },
  { name: "BBC Bitesize", handle: "bbcbitesize" },
  { name: "Khan Academy", handle: "khanacademy" },
  { name: "TED-Ed", handle: "teded" },
];

function scoreVideoTitle(title, keywords) {
  const t = (title || "").toLowerCase();
  if (["hindi", "urdu", "tamil", "telugu", "cbse", "ncert"].some((w) => t.includes(w))) return -100;
  if (!keywords?.length) return 1;
  return keywords.filter((k) => t.includes(String(k).toLowerCase())).length;
}

async function ytSearchServer(query, keywords) {
  if (!process.env.YOUTUBE_API_KEY) return null;
  const params = new URLSearchParams({
    part: "snippet", type: "video", maxResults: "5", videoEmbeddable: "true",
    safeSearch: "strict", relevanceLanguage: "en", regionCode: "NG",
    q: `${query} English`, key: process.env.YOUTUBE_API_KEY,
  });
  const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!r.ok) return null;
  const data = await r.json();
  if (!data.items?.length) return null;
  const best = data.items
    .map((it) => ({ it, s: scoreVideoTitle(it.snippet.title, keywords) }))
    .sort((a, b) => b.s - a.s)[0];
  if (!best || best.s < 1) return null;
  const it = best.it;
  return {
    videoId: it.id.videoId,
    title: it.snippet.title,
    channel: it.snippet.channelTitle,
    thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || "",
  };
}

async function planVideoSearch(topic) {
  if (!process.env.GEMINI_API_KEY) return null;
  const chList = VIDEO_CHANNELS.slice(0, 4).map((c, i) => `Channel ${i + 1}: ${c.name}`).join("\n");
  const prompt = `You are an educational video expert for Nigerian primary/JSS English students.
TOPIC: "${topic}"
CRITICAL: All content must be in ENGLISH. Never suggest Hindi/Urdu/other-language content.
TASK 1 - the single precise grammar/punctuation concept.
TASK 2 - 4 to 6 MUST-MATCH keywords.
TASK 3 - one search query per channel; append "English lesson for kids".
Channels:
${chList}
Return ONLY valid JSON, no markdown:
{"topicLabel":"<concept>","mustMatchTerms":["<kw1>","<kw2>","<kw3>","<kw4>"],"searches":[{"query":"<Channel> <concept> English lesson for kids","channel":"<Channel>"},{"query":"...","channel":"..."},{"query":"...","channel":"..."},{"query":"...","channel":"..."}]}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 600 },
  };
  for (const modelUrl of GEMINI_MODELS) {
    try {
      const r = await fetch(`${modelUrl}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) { if ([404, 429, 503].includes(r.status)) continue; break; }
      const data = await r.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const s = text.indexOf("{"), e = text.lastIndexOf("}");
      if (s < 0 || e < 0) continue;
      return JSON.parse(text.slice(s, e + 1).replace(CONTROL_CHARS, " "));
    } catch { continue; }
  }
  return null;
}

module.exports = function () {
  const router = express.Router();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // â”€â”€ GET /api/grammar/book â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  router.get("/book", (req, res) => {
    // ?book=<id> selects which book; omitting it returns the default (unchanged).
    const id = (req.query.book || DEFAULT_BOOK).toString();
    const book = BOOKS[id];
    if (!book) return res.status(404).json({ error: `Unknown book "${id}".` });
    // Content is static per deploy; let the browser cache it for an hour.
    res.set("Cache-Control", "public, max-age=3600");
    res.json(book);
  });

  // ── GET /api/grammar/video?topic=… — public learning-video search ──────────
  // Uses the server-side GEMINI_API_KEY + YOUTUBE_API_KEY (no sign-in needed).
  router.get("/video", async (req, res) => {
    const topic = (req.query.topic || "").toString().trim().slice(0, 200);
    if (!topic) return res.status(400).json({ error: "No topic." });
    res.set("Cache-Control", "public, max-age=86400");
    try {
      const plan = await planVideoSearch(topic);
      const terms = plan?.mustMatchTerms?.length
        ? plan.mustMatchTerms
        : topic.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3);
      const searches = plan?.searches?.length
        ? plan.searches
        : VIDEO_CHANNELS.slice(0, 4).map((c) => ({ query: `${c.name} ${topic} English lesson for kids`, channel: c.name }));
      for (const s of searches) {
        const v = await ytSearchServer(s.query, terms);
        if (v) {
          return res.json({
            video: { ...v, embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}?rel=0&modestbranding=1` },
          });
        }
      }
    } catch (err) {
      console.warn("[/api/grammar/video]", err.message);
    }
    // Fallback: a channel search link (no API key / no match).
    const c = VIDEO_CHANNELS[0];
    return res.json({
      channel: c.name,
      search: `https://www.youtube.com/@${c.handle}/search?query=${encodeURIComponent(topic + " English lesson")}`,
    });
  });

  // â”€â”€ POST /api/grammar/check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  router.post("/check", authenticate, async (req, res) => {
    const text = (req.body?.text || "").toString().trim();
    if (!text) return res.status(400).json({ error: "No text provided." });
    if (text.length > 4000) {
      return res.status(413).json({ error: "Text too long (max 4000 characters)." });
    }

    const prompt = buildPrompt(text);

    const attempts = [
      ["groq", () => runGroq(prompt)],
      ["claude", () => runClaude(anthropic, prompt)],
      ["gemini", () => runGemini(prompt)],
    ];

    for (const [provider, run] of attempts) {
      try {
        const raw = await run();
        if (!raw) continue;
        const parsed = normalise(parseJsonLoose(raw));
        return res.json({ provider, ...parsed });
      } catch (err) {
        console.warn(`[/api/grammar/check] ${provider} failed:`, err.message);
      }
    }

    res.status(502).json({
      error: "The grammar checker is busy right now. Please try again in a moment.",
    });
  });

  return router;
};
