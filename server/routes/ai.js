/**
 * AI proxy routes — all AI keys are app-level env vars, never in the browser.
 *
 * POST /api/ai/chat    — PrepBot (Groq → Claude → Gemini fallback chain)
 * POST /api/ai/claude  — Direct Claude access
 * POST /api/ai/gemini  — Proxy Gemini using app key
 * POST /api/ai/groq    — Proxy Groq using app key
 */

const express = require("express");
const crypto = require("crypto");
const admin = require("firebase-admin");
const Anthropic = require("@anthropic-ai/sdk");
const { authenticate } = require("../middleware/auth");
const access = require("../lib/access");
const { GEMINI_MODELS, GROQ_DEFAULT_MODEL, CLAUDE_DEFAULT_MODEL } = require("../ai-models");

const GEMINI_BASE_WHITELIST = "https://generativelanguage.googleapis.com/";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_CHAT_MODELS = GEMINI_MODELS;

module.exports = function () {
  const router = express.Router();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── Token-usage tracking (display-only) ──────
  // Two tiers, stored per-user in Firestore (aiUsage/{uid}):
  //   • windowTokens per rolling 5-hour window (resets 5h after the window started)
  //   • monthTokens per calendar month (resets at the UTC month boundary)
  // Both allocations are admin-editable (config/site.aiQuota via the Settings
  // page) and read through lib/access (defaults 10k / 300k).
  // BYUK requests (the student's own key) are not counted here. Never blocks.
  // Admins (by ADMIN_EMAIL) are unlimited: not tracked, not shown against a cap.
  const USAGE_WINDOW_MS = 5 * 60 * 60 * 1000;
  const usageDoc = (uid) => admin.firestore().collection("aiUsage").doc(uid);
  const winStart = (d) => d?.windowStart?.toMillis?.() ?? d?.windowStart ?? 0;
  const monthKey = (ms) => { const dt = new Date(ms); return `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`; };
  const nextMonthMs = (ms) => { const dt = new Date(ms); return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 1); };
  const isAdminEmail = (email) => !!email && email === process.env.ADMIN_EMAIL;
  const unlimitedUsage = () => ({ used: 0, allocation: null, resetAt: null, monthUsed: 0, monthAllocation: null, monthResetAt: null, unlimited: true });

  function usageShape({ used, start, monthTokens, now, quota }) {
    return {
      used,
      allocation: quota.windowTokens,
      resetAt: start + USAGE_WINDOW_MS,
      monthUsed: monthTokens,
      monthAllocation: quota.monthTokens,
      monthResetAt: nextMonthMs(now),
    };
  }

  async function readUsage(uid, email) {
    if (isAdminEmail(email)) return unlimitedUsage();
    const quota = await access.getAiQuota();
    const now = Date.now();
    const fresh = usageShape({ used: 0, start: now, monthTokens: 0, now, quota });
    if (!uid) return fresh;
    try {
      const snap = await usageDoc(uid).get();
      if (snap.exists) {
        const d = snap.data();
        const start = winStart(d);
        const within5h = now - start < USAGE_WINDOW_MS;
        const sameMonth = d.monthKey === monthKey(now);
        return usageShape({
          used: within5h ? d.tokensUsed || 0 : 0,
          start: within5h ? start : now,
          monthTokens: sameMonth ? d.monthTokens || 0 : 0,
          now,
          quota,
        });
      }
    } catch (_) {}
    return fresh;
  }

  async function bumpUsage(uid, addTokens, email) {
    if (isAdminEmail(email)) return unlimitedUsage();
    if (!uid || !addTokens) return readUsage(uid);
    const quota = await access.getAiQuota();
    const ref = usageDoc(uid);
    try {
      return await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const now = Date.now();
        const mk = monthKey(now);
        let start = now, used = 0, monthTokens = 0;
        if (snap.exists) {
          const d = snap.data();
          const s = winStart(d);
          if (now - s < USAGE_WINDOW_MS) { start = s; used = d.tokensUsed || 0; }
          if (d.monthKey === mk) monthTokens = d.monthTokens || 0;
        }
        used += addTokens;
        monthTokens += addTokens;
        tx.set(ref, {
          tokensUsed: used,
          windowStart: admin.firestore.Timestamp.fromMillis(start),
          monthTokens,
          monthKey: mk,
        });
        return usageShape({ used, start, monthTokens, now, quota });
      });
    } catch (_) {
      return readUsage(uid);
    }
  }

  // ── BYUK: bring-your-own-key, stored per user in Firestore ──────
  // The student saves a key per provider; we keep it server-side (byukKeys/{uid})
  // and use it only when they send a chat in "key mode". The raw key is never
  // returned to the browser — the client only learns which providers are set.
  const BYUK_PROVIDERS = ["gemini", "groq", "claude"];
  const byukDoc = (uid) => admin.firestore().collection("byukKeys").doc(uid);

  async function getByukKey(uid, provider) {
    if (!uid || !BYUK_PROVIDERS.includes(provider)) return null;
    try {
      const snap = await byukDoc(uid).get();
      return snap.exists ? snap.data()[provider] || null : null;
    } catch (_) { return null; }
  }

  async function configuredProviders(uid) {
    const out = { gemini: false, groq: false, claude: false };
    if (!uid) return out;
    try {
      const snap = await byukDoc(uid).get();
      if (snap.exists) {
        const d = snap.data();
        for (const p of BYUK_PROVIDERS) out[p] = !!d[p];
      }
    } catch (_) {}
    return out;
  }

  // Build/validate a Gemini generateContent URL from a model id (or pass-through).
  function geminiUrlFor(model) {
    if (!model) return GEMINI_CHAT_MODELS[0];
    if (model.startsWith(GEMINI_BASE_WHITELIST) && model.endsWith(":generateContent")) return model;
    return `${GEMINI_BASE_WHITELIST}v1beta/models/${model}:generateContent`;
  }

  // ── Guardrails: a server-side safety net for high-risk inputs ──────
  // Tight patterns only (to avoid flagging real exam topics like "sexual
  // reproduction"). On a match we return a safe reply without calling a model.
  // The model's own system prompt handles softer scope/safety cases.
  const GUARDRAILS = [
    {
      re: /\b(kill(ing)? myself|suicid|end my life|take my (own )?life|self[-\s]?harm(?:ing|ed|s)?|harm(?:ing)? myself|cut(ting)? myself)\b/i,
      reply: "I'm really sorry you're feeling like this — you matter, and you don't have to face it alone. Please reach out to someone you trust, like a parent, teacher or school counsellor, as soon as you can. If you might be in danger right now, contact a local emergency line. I'm here whenever you'd like help with your studies.",
    },
    {
      re: /\b((make|build|making|building)\s+(a\s+)?bomb|explosive device|how to (kill|murder|stab|shoot)\s+(a\s+|someone|people|him|her|them|the))\b/i,
      reply: "I can't help with anything dangerous or that could hurt people. I'm here to help you learn and prepare for your exams — what subject can I help you with?",
    },
    {
      re: /\b(porn|pornograph|nudes?|sexting|child\s*abuse|\brape\b)\b/i,
      reply: "That isn't something I can help with. I'm your exam study tutor, so let's keep it to your schoolwork — what topic would you like to go over?",
    },
  ];
  function guardrailCheck(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "user") {
        const t = messages[i].content || "";
        for (const g of GUARDRAILS) if (g.re.test(t)) return g.reply;
        return null;
      }
    }
    return null;
  }

  // ── Streaming helpers (used by POST /chat when { stream:true }) ──────
  // Groq speaks OpenAI-style SSE; we forward each delta.content as it lands.
  async function streamGroqInto({ apiKey, model, system, messages, temperature, max_tokens, onDelta }) {
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey || process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: system ? [{ role: "system", content: system }, ...messages] : messages,
        temperature,
        max_tokens,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });
    if (!r.ok || !r.body) throw new Error(`Groq HTTP ${r.status}`);
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", usedTokens = 0;
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
        if (payload === "[DONE]") return usedTokens;
        try {
          const j = JSON.parse(payload);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) onDelta(delta);
          if (j.usage?.total_tokens) usedTokens = j.usage.total_tokens;
        } catch (_) {}
      }
    }
    return usedTokens;
  }

  // Claude via the SDK's streaming helper. Returns total tokens used.
  async function streamClaudeInto({ apiKey, model, system, messages, max_tokens, onDelta, onAbort }) {
    const client = apiKey ? new Anthropic({ apiKey }) : anthropic;
    const stream = client.messages.stream({
      model: model || process.env.CLAUDE_MODEL || CLAUDE_DEFAULT_MODEL,
      max_tokens: max_tokens || 800,
      ...(system ? { system } : {}),
      messages,
    });
    if (onAbort) onAbort(() => stream.abort());
    stream.on("text", (t) => { if (t) onDelta(t); });
    const msg = await stream.finalMessage();
    return (msg?.usage?.input_tokens || 0) + (msg?.usage?.output_tokens || 0);
  }

  // Gemini has no streaming here — fetch the whole answer, emit as one chunk.
  async function geminiOnce({ system, messages, temperature, max_tokens, apiKey, modelUrl }) {
    const geminiBody = {
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature, maxOutputTokens: max_tokens },
    };
    const key = apiKey || process.env.GEMINI_API_KEY;
    const urls = modelUrl ? [modelUrl] : GEMINI_CHAT_MODELS;
    for (const url of urls) {
      try {
        const gemRes = await fetch(`${url}?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        });
        if (!gemRes.ok) {
          if ([404, 429, 503].includes(gemRes.status)) continue;
          break;
        }
        const data = await gemRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, tokens: data.usageMetadata?.totalTokenCount || 0 };
      } catch (_) { continue; }
    }
    return { text: "", tokens: 0 };
  }

  // NDJSON stream: one JSON object per line — {type:"delta"|"done"|"error"|"unavailable"}.
  // Provider fallback only happens before the first delta; once a provider has
  // emitted text we're committed to it (a mid-stream failure surfaces as error).
  async function handleStreamingChat(req, res) {
    const {
      messages = [], system, model = GROQ_DEFAULT_MODEL,
      temperature = 0.3, max_tokens = 800,
      byuk = false, provider,
    } = req.body;

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) res.flushHeaders();

    let started = false;
    let closed = false;
    res.on("close", () => { closed = true; });

    const write = (obj) => {
      if (closed || res.writableEnded) return;
      res.write(JSON.stringify(obj) + "\n");
    };
    const onDelta = (text) => {
      if (!text) return;
      started = true;
      write({ type: "delta", text });
    };
    // Record tokens for this turn, report the running total, then close out.
    const finish = async (prov, tokens) => {
      const usage = await bumpUsage(req.user?.uid, tokens || 0, req.user?.email);
      write({ type: "usage", ...usage });
      write({ type: "done", provider: prov });
      res.end();
    };

    // ── Guardrail safety net: high-risk input → safe reply, no model call ──
    const guard = guardrailCheck(messages);
    if (guard) {
      onDelta(guard);
      write({ type: "usage", ...(await readUsage(req.user?.uid, req.user?.email)) });
      write({ type: "done", provider: "guardrail" });
      return res.end();
    }

    // ── Key mode (BYUK): use the student's own key + chosen model. No fallback,
    //    no allocation counting — it's their key and their pick. ──
    if (byuk) {
      const key = await getByukKey(req.user?.uid, provider);
      if (!key) {
        write({ type: "error", text: `No ${provider || "provider"} key saved. Add your key in Key Mode first.` });
        return res.end();
      }
      try {
        if (provider === "groq") {
          await streamGroqInto({ apiKey: key, model, system, messages, temperature, max_tokens, onDelta });
        } else if (provider === "claude") {
          await streamClaudeInto({ apiKey: key, model, system, messages, max_tokens, onDelta, onAbort: (ab) => res.on("close", ab) });
        } else if (provider === "gemini") {
          const { text } = await geminiOnce({ system, messages, temperature, max_tokens, apiKey: key, modelUrl: geminiUrlFor(model) });
          if (text) onDelta(text);
        } else {
          write({ type: "error", text: "Unknown provider for Key Mode." });
          return res.end();
        }
        if (started) {
          write({ type: "usage", byuk: true, provider });
          write({ type: "done", provider });
          return res.end();
        }
        write({ type: "error", text: "Your key returned no response. Check the key and selected model." });
      } catch (e) {
        console.warn("[/api/ai/chat byuk]", e.message);
        write({ type: "error", text: started ? "Stream interrupted." : `Your ${provider} key failed: ${String(e.message).slice(0, 140)}` });
      }
      return res.end();
    }

    // ① Groq
    if (process.env.GROQ_API_KEY) {
      try {
        const tokens = await streamGroqInto({ model, system, messages, temperature, max_tokens, onDelta });
        if (started) return await finish("groq", tokens);
      } catch (e) {
        if (started) { write({ type: "error", text: "Stream interrupted. Please try again." }); return res.end(); }
        console.warn("[/api/ai/chat stream] Groq unavailable:", e.message);
      }
    }

    // ② Claude
    if (!started && process.env.ANTHROPIC_API_KEY) {
      try {
        const tokens = await streamClaudeInto({ system, messages, max_tokens, onDelta, onAbort: (ab) => res.on("close", ab) });
        if (started) return await finish("claude", tokens);
      } catch (e) {
        if (started) { write({ type: "error", text: "Stream interrupted. Please try again." }); return res.end(); }
        console.warn("[/api/ai/chat stream] Claude unavailable:", e.message);
      }
    }

    // ③ Gemini (non-streaming, emitted as a single chunk)
    if (!started && process.env.GEMINI_API_KEY) {
      try {
        const { text, tokens } = await geminiOnce({ system, messages, temperature, max_tokens });
        if (text) { onDelta(text); return await finish("gemini", tokens); }
      } catch (e) {
        console.warn("[/api/ai/chat stream] Gemini unavailable:", e.message);
      }
    }

    if (!started) {
      write({ type: "unavailable", text: "PrepBot is temporarily unavailable. Please try again in a moment." });
    }
    res.end();
  }

  // ── POST /api/ai/chat — PrepBot ──────────────────────────────
  // Fallback chain: Groq → Claude → Gemini (each skipped if key absent).
  // Pass { stream:true } for an NDJSON token stream; otherwise a single JSON reply.
  router.post("/chat", authenticate, async (req, res) => {
    // Access-gated (feature "prepbot", part "chat" — admin state + per-user
    // overrides via lib/access). The browser also gates this, so this is the
    // un-bypassable backstop: refusals go out as normal chat text in either
    // response shape so the widget never breaks its streaming contract.
    const verdict = await access.canUse(req, "prepbot", "chat");
    if (!verdict.allowed) {
      const premiumWall = verdict.reason === "premium-required";
      const text = premiumWall
        ? "PrepBot is a premium feature. Upgrade your plan at /subscribe.html to chat with PrepBot."
        : "PrepBot is currently unavailable. Please check back later.";
      const provider = premiumWall ? "premium_required" : "feature_disabled";
      if (req.body && req.body.stream) {
        res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
        res.write(JSON.stringify({ type: "delta", text }) + "\n");
        res.write(JSON.stringify({ type: "done", provider }) + "\n");
        return res.end();
      }
      return res.json({ provider, premiumRequired: premiumWall, text });
    }

    if (req.body && req.body.stream) {
      try {
        return await handleStreamingChat(req, res);
      } catch (err) {
        console.error("[/api/ai/chat stream]", err.message);
        if (!res.headersSent) return res.status(500).json({ error: err.message });
        if (!res.writableEnded) {
          try { res.write(JSON.stringify({ type: "error", text: "Server error." }) + "\n"); } catch (_) {}
          res.end();
        }
        return;
      }
    }
    try {
      const {
        messages = [],
        system,
        model = GROQ_DEFAULT_MODEL,
        temperature = 0.3,
        max_tokens = 2000,
      } = req.body;

      // ① Try Groq
      if (process.env.GROQ_API_KEY) {
        try {
          const groqRes = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: system
                ? [{ role: "system", content: system }, ...messages]
                : messages,
              temperature,
              max_tokens,
            }),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) {
              return res.json({ provider: "groq", text });
            }
          }
        } catch (_) {}
        console.warn("[/api/ai/chat] Groq unavailable, trying Claude");
      }

      // ② Try Claude
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const response = await anthropic.messages.create({
            model: process.env.CLAUDE_MODEL || CLAUDE_DEFAULT_MODEL,
            max_tokens: max_tokens || 2000,
            ...(system ? { system } : {}),
            messages,
          });
          const text = response.content[0]?.text;
          if (text) {
            return res.json({ provider: "claude", text });
          }
        } catch (_) {}
        console.warn("[/api/ai/chat] Claude unavailable, trying Gemini");
      }

      // ③ Try Gemini models in order
      if (process.env.GEMINI_API_KEY) {
        const geminiBody = {
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature, maxOutputTokens: max_tokens },
        };

        for (const modelUrl of GEMINI_CHAT_MODELS) {
          try {
            const gemRes = await fetch(
              `${modelUrl}?key=${process.env.GEMINI_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(geminiBody),
              }
            );
            if (!gemRes.ok) {
              if ([404, 429, 503].includes(gemRes.status)) continue;
              break;
            }
            const data = await gemRes.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return res.json({ provider: "gemini", text });
            }
          } catch (_) {
            continue;
          }
        }
        console.warn("[/api/ai/chat] All Gemini models unavailable");
      }

      res.json({
        provider: "unavailable",
        text: "PrepBot is temporarily unavailable. Please try again in a moment.",
      });
    } catch (err) {
      console.error("[/api/ai/chat]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/ai/generate — counted, non-streaming generation ────
  // Same allocation pool + premium gate as PrepBot, but a plain request/response
  // shape for one-shot jobs (theory question auto-generation, answer marking).
  // This is how the theory/activities AI shares the SAME token pool as PrepBot
  // instead of running on the learner's own key. Fallback: Groq → Claude → Gemini.
  router.post("/generate", authenticate, async (req, res) => {
    // The caller names which feature this generation belongs to (default
    // "theory"); only registry entries flagged usesAiGenerate are accepted, and
    // access is resolved per feature — so e.g. theory→free really frees this
    // endpoint. A client could claim a sibling feature, but every consumer
    // shares the same token pool + quota, so the claim buys nothing.
    const feature = String((req.body && req.body.feature) || "theory");
    const { FEATURES } = await access.registry();
    const entry = FEATURES.find((f) => f.id === feature);
    if (!entry || !entry.usesAiGenerate) {
      return res.status(400).json({ error: `Unknown AI feature "${feature}".` });
    }
    const verdict = await access.canUse(req, feature);
    if (!verdict.allowed) {
      if (verdict.reason === "premium-required") {
        return res.status(402).json({
          provider: "premium_required",
          premiumRequired: true,
          text: "This is a premium feature. Upgrade your plan at /subscribe.html to use it.",
        });
      }
      return res.status(403).json({ error: "feature_disabled", reason: verdict.reason });
    }
    try {
      const {
        messages = [],
        system,
        model = GROQ_DEFAULT_MODEL,
        temperature = 0.4,
        max_tokens = 2000,
      } = req.body || {};

      const guard = guardrailCheck(messages);
      if (guard) {
        return res.json({ provider: "guardrail", text: guard, usage: await readUsage(req.user.uid, req.user.email) });
      }

      let text = "", provider = "unavailable", tokens = 0;

      // ① Groq
      if (process.env.GROQ_API_KEY) {
        try {
          const r = await fetch(GROQ_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            body: JSON.stringify({
              model,
              messages: system ? [{ role: "system", content: system }, ...messages] : messages,
              temperature, max_tokens,
            }),
          });
          if (r.ok) {
            const data = await r.json();
            const t = data.choices?.[0]?.message?.content;
            if (t) { text = t; provider = "groq"; tokens = data.usage?.total_tokens || 0; }
          }
        } catch (e) { console.warn("[/api/ai/generate] Groq:", e.message); }
      }

      // ② Claude
      if (!text && process.env.ANTHROPIC_API_KEY) {
        try {
          const r = await anthropic.messages.create({
            model: process.env.CLAUDE_MODEL || CLAUDE_DEFAULT_MODEL,
            max_tokens, ...(system ? { system } : {}), messages,
          });
          const t = r.content?.[0]?.text;
          if (t) { text = t; provider = "claude"; tokens = (r.usage?.input_tokens || 0) + (r.usage?.output_tokens || 0); }
        } catch (e) { console.warn("[/api/ai/generate] Claude:", e.message); }
      }

      // ③ Gemini
      if (!text && process.env.GEMINI_API_KEY) {
        try {
          const r = await geminiOnce({ system, messages, temperature, max_tokens });
          if (r.text) { text = r.text; provider = "gemini"; tokens = r.tokens || 0; }
        } catch (e) { console.warn("[/api/ai/generate] Gemini:", e.message); }
      }

      const usage = await bumpUsage(req.user.uid, tokens, req.user.email);
      if (!text) {
        return res.json({ provider: "unavailable", text: "AI is temporarily unavailable. Please try again in a moment.", usage });
      }
      res.json({ provider, text, usage });
    } catch (err) {
      console.error("[/api/ai/generate]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/ai/usage — current token usage (5h window + month) ──
  router.get("/usage", authenticate, async (req, res) => {
    res.json(await readUsage(req.user.uid, req.user.email));
  });

  // ── BYUK key management (raw keys never leave the server) ──────
  // GET    /api/ai/byuk/keys  → which providers this student has configured
  // POST   /api/ai/byuk/key   → { provider, key } save/replace a key
  // DELETE /api/ai/byuk/key   → { provider } remove a key
  router.get("/byuk/keys", authenticate, async (req, res) => {
    res.json(await configuredProviders(req.user.uid));
  });

  router.post("/byuk/key", authenticate, async (req, res) => {
    const { provider, key } = req.body || {};
    if (!BYUK_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Unknown provider." });
    }
    if (!key || typeof key !== "string" || key.trim().length < 8) {
      return res.status(400).json({ error: "That key looks invalid." });
    }
    try {
      await byukDoc(req.user.uid).set({ [provider]: key.trim() }, { merge: true });
      res.json(await configuredProviders(req.user.uid));
    } catch (err) {
      console.error("[/api/ai/byuk/key]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.delete("/byuk/key", authenticate, async (req, res) => {
    const { provider } = req.body || {};
    if (!BYUK_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Unknown provider." });
    }
    try {
      await byukDoc(req.user.uid).set(
        { [provider]: admin.firestore.FieldValue.delete() },
        { merge: true }
      );
      res.json(await configuredProviders(req.user.uid));
    } catch (err) {
      console.error("[/api/ai/byuk/key delete]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/ai/claude — direct Claude access ───────────────
  router.post("/claude", authenticate, async (req, res) => {
    try {
      const { messages, system, model, max_tokens = 4096 } = req.body;

      const response = await anthropic.messages.create({
        model: model || process.env.CLAUDE_MODEL || CLAUDE_DEFAULT_MODEL,
        max_tokens,
        ...(system ? { system } : {}),
        messages,
      });

      res.json({
        provider: "claude",
        text: response.content[0]?.text || "",
        usage: response.usage,
      });
    } catch (err) {
      console.error("[/api/ai/claude]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/ai/gemini — proxy Gemini with app key ──────────
  router.post("/gemini", authenticate, async (req, res) => {
    try {
      const { body, modelUrl } = req.body;

      if (!modelUrl?.startsWith(GEMINI_BASE_WHITELIST)) {
        return res.status(400).json({ error: "Invalid Gemini model URL." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: "Gemini is not configured on this server." });
      }

      const upstream = await fetch(`${modelUrl}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await upstream.json();
      // Count against the shared allocation pool (same one PrepBot uses) so all
      // backend-proxied AI — theory/activities, writing, math — draws on it.
      if (upstream.ok) await bumpUsage(req.user?.uid, data?.usageMetadata?.totalTokenCount || 0, req.user?.email);
      res.status(upstream.status).json(data);
    } catch (err) {
      console.error("[/api/ai/gemini]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/ai/image — proxy simple image generation to the Cloudflare
  //    Workers AI worker (see /cloudflare/image-worker). Kept off the Gemini/
  //    Groq token pool on purpose: this draws on Cloudflare's own free daily
  //    neuron allocation, a separate resource entirely. ──────────
  router.post("/image", authenticate, async (req, res) => {
    try {
      if (!process.env.IMAGE_WORKER_URL || !process.env.IMAGE_WORKER_SECRET) {
        return res.status(503).json({ error: "Image generation is not configured on this server." });
      }

      const prompt = String(req.body?.prompt || "").trim().slice(0, 500);
      if (!prompt) return res.status(400).json({ error: "A prompt is required." });

      const upstream = await fetch(process.env.IMAGE_WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.IMAGE_WORKER_SECRET}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await upstream.json();
      res.status(upstream.status).json(data);
    } catch (err) {
      console.error("[/api/ai/image]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/ai/image-store — sign + upload a card image to Cloudinary.
  //    Same account already used for the homepage's real student photos
  //    (home/js/reveal.js). Chosen over Firebase Storage (now Blaze-only)
  //    and Cloudflare R2 (also gates its free tier behind a card on file) —
  //    Cloudinary's free plan needs neither. ──────────
  router.post("/image-store", authenticate, async (req, res) => {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(503).json({ error: "Image storage is not configured on this server." });
      }

      const imageBase64 = req.body?.imageBase64;
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ error: "An image is required." });
      }
      const file = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

      const folder = "prep-portal/flashcards";
      const timestamp = Math.floor(Date.now() / 1000);
      const signString = `folder=${folder}&timestamp=${timestamp}`;
      const signature = crypto.createHash("sha1").update(signString + apiSecret).digest("hex");

      const form = new URLSearchParams();
      form.set("file", file);
      form.set("api_key", apiKey);
      form.set("timestamp", String(timestamp));
      form.set("signature", signature);
      form.set("folder", folder);

      const upstream = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      const data = await upstream.json();
      if (!upstream.ok) {
        console.error("[/api/ai/image-store] Cloudinary error:", data);
        return res.status(upstream.status).json({ error: data?.error?.message || "Upload failed." });
      }

      // Deliver at a fixed small size — same on-the-fly transform pattern
      // the homepage's Cloudinary helper uses (home/js/reveal.js).
      const url = data.secure_url.replace("/upload/", "/upload/c_fill,g_auto,w_260,h_260/");
      res.json({ url });
    } catch (err) {
      console.error("[/api/ai/image-store]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/ai/youtube — proxy YouTube Data API ─────────────
  router.get("/youtube", authenticate, async (req, res) => {
    try {
      if (!process.env.YOUTUBE_API_KEY) {
        return res.status(503).json({ error: "YouTube is not configured on this server." });
      }

      const params = new URLSearchParams(req.query);
      params.set("key", process.env.YOUTUBE_API_KEY);

      const upstream = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`
      );
      const data = await upstream.json();
      res.status(upstream.status).json(data);
    } catch (err) {
      console.error("[/api/ai/youtube]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/ai/groq — proxy Groq with app key ──────────────
  router.post("/groq", authenticate, async (req, res) => {
    try {
      const { body } = req.body;

      if (!process.env.GROQ_API_KEY) {
        return res.status(503).json({ error: "Groq is not configured on this server." });
      }

      const upstream = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const data = await upstream.json();
      if (upstream.ok) await bumpUsage(req.user?.uid, data?.usage?.total_tokens || 0, req.user?.email);
      res.status(upstream.status).json(data);
    } catch (err) {
      console.error("[/api/ai/groq]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Solution-step animations: admin-curated overrides ────────────────────
  // The browser generates animation steps with the model, then an admin can
  // APPROVE a good one. Approved {states,notes} live in Firestore keyed by a
  // hash of (question|answer), and are served to every learner before any AI
  // call — so a question is only ever generated once, by an admin, on purpose.
  const stepsDoc = (h) => admin.firestore().collection("solutionSteps").doc(h);
  const isAdmin = (req) => !!req.user && req.user.email === process.env.ADMIN_EMAIL;
  const cleanHash = (h) => String(h || "").trim().replace(/[^a-z0-9]/gi, "").slice(0, 64);
  // Word-problem translation: [{phrase, tex}] pairing prose with its algebra.
  const cleanSetup = (arr) => Array.isArray(arr)
    ? arr
        .filter((x) => x && typeof x === "object")
        .slice(0, 8)
        .map((x) => ({ phrase: String(x.phrase || "").slice(0, 160), tex: String(x.tex || "").slice(0, 160) }))
        .filter((x) => x.phrase || x.tex)
    : [];

  // Who am I? (lets the client decide whether to show the approve controls)
  router.get("/whoami", authenticate, (req, res) => {
    res.json({ email: req.user.email || null, admin: isAdmin(req) });
  });

  // Public read of an approved override (returns {found:false} when absent).
  router.get("/steps/:hash", async (req, res) => {
    try {
      const h = cleanHash(req.params.hash);
      if (!h) return res.status(400).json({ error: "bad hash" });
      const snap = await stepsDoc(h).get();
      if (!snap.exists) return res.json({ found: false });
      const d = snap.data() || {};
      res.json({ found: true, states: d.states || [], notes: d.notes || [], setup: d.setup || [] });
    } catch (err) {
      console.error("[/api/ai/steps GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin-only: store / replace an approved override.
  router.post("/steps", authenticate, async (req, res) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access only." });
      const { hash, question, answer, states, notes, setup } = req.body || {};
      const h = cleanHash(hash);
      if (!h) return res.status(400).json({ error: "hash is required" });
      if (!Array.isArray(states) || states.length < 2 ||
          !states.every((s) => typeof s === "string" && s.trim() && s.length <= 200)) {
        return res.status(400).json({ error: "states must be 2+ short LaTeX strings" });
      }
      const cleanNotes = Array.isArray(notes)
        ? notes.slice(0, states.length).map((n) => String(n || "").slice(0, 160))
        : [];
      await stepsDoc(h).set({
        states: states.slice(0, 8),
        notes: cleanNotes,
        setup: cleanSetup(setup),
        question: String(question || "").slice(0, 1200),
        answer: String(answer || "").slice(0, 400),
        approvedBy: req.user.email || req.user.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.json({ ok: true });
    } catch (err) {
      console.error("[/api/ai/steps POST]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Solver expressions: admin-curated math to load into the GM scratchpad ──
  // So every learner loads the SAME, vetted expression(s) for a question rather
  // than a noisy auto-extraction. Keyed by the same (question|answer) hash.
  const solverDoc = (h) => admin.firestore().collection("solverExpressions").doc(h);
  const cleanExprs = (a) => Array.isArray(a)
    ? a.map((s) => String(s || "").trim().slice(0, 400)).filter(Boolean).slice(0, 20)
    : [];

  // Public read of the saved expressions for a question ({found:false} if none).
  router.get("/solver/:hash", async (req, res) => {
    try {
      const h = cleanHash(req.params.hash);
      if (!h) return res.status(400).json({ error: "bad hash" });
      const snap = await solverDoc(h).get();
      if (!snap.exists) return res.json({ found: false });
      res.json({ found: true, expressions: (snap.data() || {}).expressions || [] });
    } catch (err) {
      console.error("[/api/ai/solver GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin-only: save / replace the expressions for a question.
  router.post("/solver", authenticate, async (req, res) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access only." });
      const { hash, question, answer, expressions } = req.body || {};
      const h = cleanHash(hash);
      if (!h) return res.status(400).json({ error: "hash is required" });
      const exprs = cleanExprs(expressions);
      if (!exprs.length) return res.status(400).json({ error: "expressions must be 1+ non-empty strings" });
      await solverDoc(h).set({
        expressions: exprs,
        question: String(question || "").slice(0, 1200),
        answer: String(answer || "").slice(0, 400),
        savedBy: req.user.email || req.user.uid,
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.json({ ok: true });
    } catch (err) {
      console.error("[/api/ai/solver POST]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
