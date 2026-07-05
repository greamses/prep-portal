/**
 * TTS proxy routes — keys stay server-side.
 *
 * POST /api/tts/synthesize  — Google Cloud Text-to-Speech
 *   Body: { text, ssml?, voice?, languageCode?, speakingRate?, pitch? }
 *   Returns: { audioContent: "<base64 MP3>", audioEncoding: "MP3" }
 *
 * Auth: Google Cloud credentials are read from env in this priority order —
 *   1. GOOGLE_CLOUD_CREDENTIALS  (JSON string — use on Vercel)
 *   2. ./googleCloudKey.json     (local dev file, same project or separate)
 *   3. ./serviceAccountKey.json  (Firebase SA — works if TTS API is enabled
 *                                 on the same Google Cloud project)
 *
 * POST /api/tts/elevenlabs  — ElevenLabs premium voice
 *   Body: { text, voiceId? }
 *   Returns: { audioContent: "<base64 MP3>", audioEncoding: "MP3" }
 *   Requires ELEVENLABS_API_KEY in env; 503s (client falls back to the
 *   free Web Speech API) if unset. Also requires isPremium on the caller's
 *   Firestore profile (or ADMIN_EMAIL) — 403s otherwise, same upsell-gate
 *   pattern as PrepBot chat in ai.js — since it's a paid, metered API and
 *   the "Talk" toggle it backs is otherwise open to any logged-in guest.
 *
 * Both routes require a logged-in user (same `authenticate` gate) — this
 * proxies paid, metered third-party APIs, so it's never exposed
 * unauthenticated even on pages that are otherwise free/guest-accessible.
 */

const express = require("express");
const admin = require("firebase-admin");
const textToSpeech = require("@google-cloud/text-to-speech");
const { authenticate } = require("../middleware/auth");

const MAX_CHARS = 5000;

module.exports = function () {
  const router = express.Router();

  // ── Premium gate for ElevenLabs only — same shape as ai.js's chat gate,
  // with its own short-lived per-uid cache so a run of "Talk" lines
  // doesn't read users/{uid} on every request. ───────────────────────
  const PREMIUM_TTL_MS = 5 * 60 * 1000;
  const premiumCache = new Map(); // uid -> { premium, exp }

  async function isPremiumUser(req) {
    if (!req.user) return false;
    if (req.user.email && req.user.email === process.env.ADMIN_EMAIL) return true;
    const uid = req.user.uid;
    const hit = premiumCache.get(uid);
    if (hit && hit.exp > Date.now()) return hit.premium;
    try {
      const snap = await admin.firestore().collection("users").doc(uid).get();
      const premium = !!(snap.exists && snap.data() && snap.data().isPremium);
      premiumCache.set(uid, { premium, exp: Date.now() + PREMIUM_TTL_MS });
      return premium;
    } catch (_) {
      return hit ? hit.premium : false;
    }
  }

  // Lazily created so the server still starts even if TTS is unconfigured.
  let _client = null;

  function getClient() {
    if (_client) return _client;

    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      _client = new textToSpeech.TextToSpeechClient({
        credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
      });
      return _client;
    }

    // Local dev: dedicated Google Cloud key file
    try {
      const key = require("../googleCloudKey.json");
      _client = new textToSpeech.TextToSpeechClient({ credentials: key });
      return _client;
    } catch (_) {}

    // Fallback: Firebase service account (same GCP project, TTS API enabled)
    try {
      const sa = require("../serviceAccountKey.json");
      _client = new textToSpeech.TextToSpeechClient({ credentials: sa });
      return _client;
    } catch (_) {}

    // Last resort: ADC via GOOGLE_APPLICATION_CREDENTIALS env var
    _client = new textToSpeech.TextToSpeechClient();
    return _client;
  }

  // ── POST /api/tts/synthesize ──────────────────────────────────────
  router.post("/synthesize", authenticate, async (req, res) => {
    try {
      const {
        text,
        ssml,
        voice = "en-US-Neural2-F",
        languageCode = "en-US",
        speakingRate = 1.0,
        pitch = 0.0,
      } = req.body;

      if (!text && !ssml) {
        return res.status(400).json({ error: "text or ssml is required." });
      }

      const input = text || ssml;
      if (typeof input !== "string" || input.trim().length === 0) {
        return res.status(400).json({ error: "text must be a non-empty string." });
      }
      if (input.length > MAX_CHARS) {
        return res.status(400).json({ error: `text too long (max ${MAX_CHARS} chars).` });
      }

      const synthesisInput = ssml ? { ssml } : { text };

      const [response] = await getClient().synthesizeSpeech({
        input: synthesisInput,
        voice: { languageCode, name: voice },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: Math.min(Math.max(Number(speakingRate) || 1.0, 0.25), 4.0),
          pitch: Math.min(Math.max(Number(pitch) || 0.0, -20.0), 20.0),
        },
      });

      res.json({
        audioContent: Buffer.from(response.audioContent).toString("base64"),
        audioEncoding: "MP3",
      });
    } catch (err) {
      console.error("[/api/tts/synthesize]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/tts/elevenlabs — premium AI voice for PrepBot's "Talk"
  // mode (prep-math/mental-math). Behind the same login gate as the Google
  // TTS route above, on purpose: it's a paid, metered third-party API, and
  // this page has no other auth of its own — an unauthenticated proxy to a
  // billed API would be an open abuse vector. Callers fall back to the
  // free, unauthenticated Web Speech API on any failure (401, 503, network,
  // or ELEVENLABS_API_KEY simply not being set yet). ───────────────────
  router.post("/elevenlabs", authenticate, async (req, res) => {
    try {
      if (!(await isPremiumUser(req))) {
        return res.status(403).json({ error: "ElevenLabs voice is a premium feature." });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "ElevenLabs is not configured." });
      }

      // "Alice — Clear, Engaging Educator", one of ElevenLabs' default
      // "premade" voices. Those are API-usable on every plan, including
      // free; the old classic voices (e.g. "Rachel") were reclassified as
      // Voice-Library voices and now 402 for free accounts via the API.
      const { text, voiceId = "Xb7hH8MSUJpSbSDYk0k2" } = req.body;
      if (typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "text must be a non-empty string." });
      }
      if (text.length > MAX_CHARS) {
        return res.status(400).json({ error: `text too long (max ${MAX_CHARS} chars).` });
      }

      const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.45, similarity_boost: 0.75 },
        }),
      });

      if (!elResponse.ok) {
        const detail = await elResponse.text().catch(() => "");
        console.error("[/api/tts/elevenlabs]", elResponse.status, detail);
        return res.status(502).json({ error: "ElevenLabs request failed." });
      }

      const buf = Buffer.from(await elResponse.arrayBuffer());
      res.json({ audioContent: buf.toString("base64"), audioEncoding: "MP3" });
    } catch (err) {
      console.error("[/api/tts/elevenlabs]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/tts/voices — list available voices ───────────────────
  router.get("/voices", authenticate, async (req, res) => {
    try {
      const { languageCode = "en-US" } = req.query;
      const [result] = await getClient().listVoices({ languageCode });
      const voices = (result.voices || [])
        .map((v) => ({
          name: v.name,
          languageCodes: v.languageCodes,
          ssmlGender: v.ssmlGender,
          naturalSampleRateHertz: v.naturalSampleRateHertz,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      res.json({ voices });
    } catch (err) {
      console.error("[/api/tts/voices]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
