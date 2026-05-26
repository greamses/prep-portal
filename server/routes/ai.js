/**
 * AI proxy routes — all external AI API keys live here, never in the browser.
 *
 * POST /api/ai/chat    — PrepBot (tries user's Groq key first, falls back to Claude)
 * POST /api/ai/claude  — Direct Claude access (app key, no user key needed)
 * POST /api/ai/gemini  — Proxy Gemini using the user's stored key
 * POST /api/ai/groq    — Proxy Groq using the user's stored key
 */

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { authenticate } = require("../middleware/auth");

const GEMINI_BASE_WHITELIST = "https://generativelanguage.googleapis.com/";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

module.exports = function (db) {
  const router = express.Router();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── Fetch user's AI keys from Firestore (server-side only) ───
  async function getUserKeys(uid) {
    try {
      const snap = await db.collection("users").doc(uid).get();
      const d = snap.data() || {};
      return { groq: d.groqKey || null, gemini: d.geminiKey || null };
    } catch {
      return { groq: null, gemini: null };
    }
  }

  // ── POST /api/ai/chat — PrepBot ──────────────────────────────
  // Tries the user's Groq key first; falls back to app-level Claude.
  router.post("/chat", authenticate, async (req, res) => {
    try {
      const {
        messages = [],
        system,
        model = "llama-3.1-8b-instant",
        temperature = 0.3,
        max_tokens = 2000,
      } = req.body;

      const keys = await getUserKeys(req.user.uid);

      // ① Try Groq with user's key
      if (keys.groq) {
        const groqRes = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keys.groq}`,
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
        // Groq returned an error — fall through to Claude
        console.warn("[/api/ai/chat] Groq error, falling back to Claude");
      }

      // ② Fall back to app-level Claude (skip gracefully if key not configured)
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.json({
          provider: "unavailable",
          text: "PrepBot is currently unavailable. Add a Groq API key in Account Settings to enable it.",
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
      const {
        messages,
        system,
        model,
        max_tokens = 4096,
        temperature = 0.7,
      } = req.body;

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

  // ── POST /api/ai/gemini — proxy Gemini with user's key ───────
  router.post("/gemini", authenticate, async (req, res) => {
    try {
      const { body, modelUrl } = req.body;

      if (!modelUrl?.startsWith(GEMINI_BASE_WHITELIST)) {
        return res.status(400).json({ error: "Invalid Gemini model URL." });
      }

      const keys = await getUserKeys(req.user.uid);
      if (!keys.gemini) {
        return res.status(403).json({
          error: "No Gemini key configured. Add one in Account Settings.",
        });
      }

      const upstream = await fetch(`${modelUrl}?key=${keys.gemini}`, {
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

  // ── POST /api/ai/groq — proxy Groq with user's key ──────────
  router.post("/groq", authenticate, async (req, res) => {
    try {
      const { body } = req.body;

      const keys = await getUserKeys(req.user.uid);
      if (!keys.groq) {
        return res.status(403).json({
          error: "No Groq key configured. Add one in Account Settings.",
        });
      }

      const upstream = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keys.groq}`,
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
