/**
 * AI proxy routes — all AI keys are app-level env vars, never in the browser.
 *
 * POST /api/ai/chat    — PrepBot (tries Groq first, falls back to Claude)
 * POST /api/ai/claude  — Direct Claude access
 * POST /api/ai/gemini  — Proxy Gemini using app key
 * POST /api/ai/groq    — Proxy Groq using app key
 */

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { authenticate } = require("../middleware/auth");

const GEMINI_BASE_WHITELIST = "https://generativelanguage.googleapis.com/";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

module.exports = function () {
  const router = express.Router();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── POST /api/ai/chat — PrepBot ──────────────────────────────
  // Tries app-level Groq first; falls back to Claude.
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
          return res.json({
            provider: "groq",
            text: data.choices?.[0]?.message?.content || "",
          });
        }
        console.warn("[/api/ai/chat] Groq error, falling back to Claude");
      }

      // ② Fall back to Claude
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.json({
          provider: "unavailable",
          text: "PrepBot is currently unavailable.",
        });
      }

      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: max_tokens || 2000,
        ...(system ? { system } : {}),
        messages,
      });

      res.json({
        provider: "claude",
        text: response.content[0]?.text || "",
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
