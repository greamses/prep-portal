/**
 * AI proxy routes — all AI keys are app-level env vars, never in the browser.
 *
 * POST /api/ai/chat    — PrepBot (Groq → Claude → Gemini fallback chain)
 * POST /api/ai/claude  — Direct Claude access
 * POST /api/ai/gemini  — Proxy Gemini using app key
 * POST /api/ai/groq    — Proxy Groq using app key
 */

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { authenticate } = require("../middleware/auth");

const GEMINI_BASE_WHITELIST = "https://generativelanguage.googleapis.com/";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const GEMINI_CHAT_MODELS = [
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-pro:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
];

module.exports = function () {
  const router = express.Router();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── POST /api/ai/chat — PrepBot ──────────────────────────────
  // Fallback chain: Groq → Claude → Gemini (each skipped if key absent).
  router.post("/chat", authenticate, async (req, res) => {
    try {
      const {
        messages = [],
        system,
        model = "llama-3.1-8b-instant",
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
            model: process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
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

  // ── POST /api/ai/claude — direct Claude access ───────────────
  router.post("/claude", authenticate, async (req, res) => {
    try {
      const { messages, system, model, max_tokens = 4096 } = req.body;

      const response = await anthropic.messages.create({
        model: model || process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
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
      res.status(upstream.status).json(data);
    } catch (err) {
      console.error("[/api/ai/gemini]", err.message);
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
      res.status(upstream.status).json(data);
    } catch (err) {
      console.error("[/api/ai/groq]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
