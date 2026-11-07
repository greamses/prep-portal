/* ============================================================================
   Streaming model calls, cancellable — for PrepBoard.
   ----------------------------------------------------------------------------
   Each streamer calls onDelta(text) as the model writes, takes an AbortSignal
   (a learner cutting in stops the model at once — nothing more is generated or
   billed), and resolves to the tokens used. They throw an Error with .status
   on an HTTP failure so the caller can try the next provider.

   New code, used only by routes/whiteboard.js. The older streamers inside
   routes/ai.js are left untouched for now (they cannot be cancelled; merge
   these in once this has been proven on the live site).
   ========================================================================== */

const Anthropic = require("@anthropic-ai/sdk");
const { GEMINI_MODELS, CLAUDE_DEFAULT_MODEL } = require("../ai-models");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_BOARD_MODEL = process.env.GROQ_BOARD_MODEL || "llama-3.3-70b-versatile";

/** Read an SSE body: calls onData(json) for each `data:` line. */
async function readSSE(body, onData) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try { onData(JSON.parse(payload)); } catch (_) { /* a broken frame: skip it */ }
    }
  }
}

const httpError = (who, r) => {
  const e = new Error(`${who} HTTP ${r.status}`);
  e.status = r.status;
  return e;
};

/** Gemini, streamed (streamGenerateContent, SSE). Tries the model list in order
    until one answers; a model that has started writing is kept. */
/* Thinking models write nothing until they have finished thinking, which turns
   a stream into one late lump. The board needs words at once, so each model is
   asked to think as little as it allows: "minimal", else "low" (gemini-3.8-flash
   refuses minimal), else no setting at all — each refusal is a 400, retried. */
const THINKING = [{ thinkingLevel: "minimal" }, { thinkingLevel: "low" }, null];

async function streamGemini({
  system, messages, temperature = 0.5, maxTokens = 900, signal, onDelta, models = GEMINI_MODELS,
  firstByteMs = 6000,      // a model that has said nothing by then is skipped
  deadline = Date.now() + 12000, // after this, give up on Gemini (the caller tries another provider)
}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) { const e = new Error("Gemini not configured"); e.status = 503; throw e; }
  const bodyFor = (thinking) => JSON.stringify({
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { temperature, maxOutputTokens: maxTokens, ...(thinking ? { thinkingConfig: thinking } : {}) },
  });
  let last = null;
  for (const url of models) {
    for (let ti = 0; ti < THINKING.length; ti++) {
      const thinking = THINKING[ti];
      if (signal?.aborted) { const e = new Error("aborted"); e.name = "AbortError"; throw e; }
      if (Date.now() > deadline) throw last || Object.assign(new Error("Gemini too slow"), { status: 504 });
      const streamUrl = url.replace(/:generateContent$/, ":streamGenerateContent") + `?alt=sse&key=${key}`;
      /* one attempt: its own abort, tied to the caller's, and to a first-byte timer */
      const attempt = new AbortController();
      const relay = () => attempt.abort();
      signal?.addEventListener("abort", relay, { once: true });
      let spoke = false;
      const timer = setTimeout(() => { if (!spoke) attempt.abort(); }, Math.min(firstByteMs, Math.max(500, deadline - Date.now())));
      try {
        const r = await fetch(streamUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: bodyFor(thinking), signal: attempt.signal });
        if (!r.ok || !r.body) {
          last = httpError("Gemini", r);
          if (r.status === 400 && thinking) continue;       // try the next thinking setting
          break;                                             // next model
        }
        let tokens = 0;
        await readSSE(r.body, (j) => {
          const parts = j.candidates?.[0]?.content?.parts || [];
          for (const p of parts) if (p.text && !p.thought) { spoke = true; onDelta(p.text); }
          if (j.usageMetadata?.totalTokenCount) tokens = j.usageMetadata.totalTokenCount;
        });
        return { tokens, model: url.split("/models/")[1]?.split(":")[0] || "gemini" };
      } catch (e) {
        if (signal?.aborted) throw e;            // the caller stopped it: not a failure
        if (spoke) return { tokens: 0, model: "gemini" }; // it had started: keep what was said
        last = e;
        break;                                   // silent too long, or the network: next model
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", relay);
      }
    }
  }
  throw last || new Error("No Gemini model answered");
}

let anthropic = null;
/** Claude, streamed through the SDK. */
async function streamClaude({ system, messages, maxTokens = 900, signal, onDelta, model }) {
  if (!process.env.ANTHROPIC_API_KEY) { const e = new Error("Claude not configured"); e.status = 503; throw e; }
  anthropic = anthropic || new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = anthropic.messages.stream({
    model: model || process.env.CLAUDE_MODEL || CLAUDE_DEFAULT_MODEL,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages,
  });
  const stop = () => stream.abort();
  signal?.addEventListener("abort", stop, { once: true });
  try {
    stream.on("text", (t) => { if (t) onDelta(t); });
    const msg = await stream.finalMessage();
    return { tokens: (msg?.usage?.input_tokens || 0) + (msg?.usage?.output_tokens || 0), model: "claude" };
  } finally {
    signal?.removeEventListener("abort", stop);
  }
}

/** Groq (OpenAI-style SSE), cancellable. */
async function streamGroq({ system, messages, temperature = 0.5, maxTokens = 900, signal, onDelta, model = GROQ_BOARD_MODEL }) {
  if (!process.env.GROQ_API_KEY) { const e = new Error("Groq not configured"); e.status = 503; throw e; }
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: system ? [{ role: "system", content: system }, ...messages] : messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal,
  });
  if (!r.ok || !r.body) throw httpError("Groq", r);
  let tokens = 0;
  await readSSE(r.body, (j) => {
    const d = j.choices?.[0]?.delta?.content;
    if (d) onDelta(d);
    if (j.usage?.total_tokens) tokens = j.usage.total_tokens;
  });
  return { tokens, model: "groq" };
}

module.exports = { streamGemini, streamClaude, streamGroq, readSSE };
