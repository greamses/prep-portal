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
 *   free Web Speech API) if unset. Access-gated as the "voice" part of the
 *   "prepbot" feature (lib/access: admin state + per-user overrides) —
 *   403s when denied — since it's a paid, metered API and the "Talk"
 *   toggle it backs is otherwise open to any logged-in guest.
 *
 * Both routes require a logged-in user (same `authenticate` gate) — this
 * proxies paid, metered third-party APIs, so it's never exposed
 * unauthenticated even on pages that are otherwise free/guest-accessible.
 */

const express = require("express");
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { authenticate } = require("../middleware/auth");
const access = require("../lib/access");

const MAX_CHARS = 5000;

// ── Static on-disk cache for ElevenLabs audio ──────────────────────────
// A stopgap "serve it from here" store until Google Cloud Storage is wired
// up: synthesised lines are written as plain .mp3 files under the repo-root
// /tts-cache/ folder, which is served statically. A committed file is then
// served straight off the static/CDN layer for free — no ElevenLabs call and
// no function work at all. (vercel.json bundles this folder into the function
// via includeFiles so the route can also detect a hit.)
//
// Note: on a read-only serverless filesystem the WRITE below silently no-ops,
// so prod won't self-populate — generate the library by running the server
// with a writable disk (e.g. locally in Talk mode) and commit the .mp3s.
const TTS_CACHE_DIR = process.env.TTS_CACHE_DIR || path.resolve(__dirname, "../../tts-cache");
const TTS_CACHE_URL = "/tts-cache";
try { fs.mkdirSync(TTS_CACHE_DIR, { recursive: true }); } catch (_) {}

function cacheFileFor(voiceId, text) {
  const hash = crypto.createHash("sha1").update(`${voiceId}|${text}`).digest("hex");
  return { file: path.join(TTS_CACHE_DIR, `${hash}.mp3`), url: `${TTS_CACHE_URL}/${hash}.mp3` };
}

module.exports = function () {
  const router = express.Router();

  // ── ElevenLabs response cache ──────────────────────────────────────
  // ElevenLabs bills per character synthesised, and this page's narration is
  // scripted and highly repetitive (the same lines every playback, and many
  // static lines shared across every number). Cache the finished MP3 by
  // voice+text so a repeat is served for free instead of re-billing. This is
  // a simple in-process LRU: it survives for the life of a warm serverless
  // instance (which comfortably covers a student's whole session and is
  // shared across students hitting the same instance). Bounded so a long tail
  // of one-off custom numbers can't grow it without limit.
  const ELEVEN_CACHE_MAX = 500;
  const elevenCache = new Map(); // "voiceId|text" -> base64 mp3 (insertion order = LRU)
  function cacheGet(key) {
    if (!elevenCache.has(key)) return null;
    const v = elevenCache.get(key);
    elevenCache.delete(key); // re-insert to mark most-recently-used
    elevenCache.set(key, v);
    return v;
  }
  function cacheSet(key, v) {
    if (elevenCache.has(key)) elevenCache.delete(key);
    elevenCache.set(key, v);
    if (elevenCache.size > ELEVEN_CACHE_MAX) {
      elevenCache.delete(elevenCache.keys().next().value); // evict oldest
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
  // ── POST /api/tts/kokoro — PrepBoard's FREE voice: Kokoro-82M (Apache 2.0)
  // on our own small host (tools/kokoro-tts: a Docker image for Cloud Run or a
  // Hugging Face Space). KOKORO_URL + KOKORO_TOKEN on this server; no key, no
  // per-character bill. Same login gate and the same caches as ElevenLabs.
  // 503 when not configured — the board then uses ElevenLabs or the browser.
  const KOKORO_VOICES = new Set([
    "af_heart", "af_bella", "af_nicole", "af_sarah", "af_aoede", "af_kore",
    "am_michael", "am_fenrir", "am_puck", "am_echo",
    "bf_emma", "bf_isabella", "bf_alice", "bf_lily",
    "bm_george", "bm_fable", "bm_lewis", "bm_daniel",
  ]);
  const kokoroBase = () => String(process.env.KOKORO_URL || "").replace(/\/+$/, "");
  router.post("/kokoro", authenticate, async (req, res) => {
    try {
      let verdict = await access.canUse(req, "whiteboard");
      if (!verdict.allowed) verdict = await access.canUse(req, "prepbot", "voice");
      if (!verdict.allowed) return res.status(403).json({ error: "voice not available", reason: verdict.reason });
      const base = kokoroBase();
      const worker = process.env.IMAGE_WORKER_URL;
      /* no Kokoro host: the free voice is MeloTTS on our Cloudflare worker */
      if (!base && !worker) return res.status(503).json({ error: "No free voice is configured." });
      const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
      if (!text) return res.status(400).json({ error: "text must be a non-empty string." });
      if (text.length > 1200) return res.status(400).json({ error: "text too long (max 1200 chars)." });
      const voice = base ? (KOKORO_VOICES.has(req.body?.voice) ? req.body.voice : "af_heart") : "melo";

      const { file: cacheFile, url: cacheUrl } = cacheFileFor(`kokoro~${voice}`, text);
      try { if (fs.existsSync(cacheFile)) return res.json({ url: cacheUrl, audioEncoding: "MP3", cached: "disk" }); } catch (_) {}
      const cacheKey = `kokoro~${voice}|${text}`;
      const hit = cacheGet(cacheKey);
      if (hit) return res.json({ audioContent: hit, audioEncoding: "MP3", cached: "mem" });

      if (!base) {
        const w = await fetch(worker, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.IMAGE_WORKER_SECRET || ""}` },
          body: JSON.stringify({ tts: text }),
        });
        const j = await w.json().catch(() => ({}));
        if (!w.ok || !j.audio) {
          console.error("[/api/tts/kokoro] melo", w.status, j.error || "");
          return res.status(502).json({ error: "Free voice request failed." });
        }
        cacheSet(cacheKey, j.audio);
        let outUrl = null;
        try { fs.writeFileSync(cacheFile, Buffer.from(j.audio, "base64")); outUrl = cacheUrl; } catch (_) {}
        return res.json({ audioContent: j.audio, audioEncoding: "MP3", url: outUrl, engine: "melo" });
      }

      /* a host waking from sleep can take most of a minute */
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 55000);
      let r;
      try {
        r = await fetch(`${base}/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.KOKORO_TOKEN || ""}` },
          body: JSON.stringify({ text, voice, speed: 1.0 }),
          signal: ctrl.signal,
        });
      } finally { clearTimeout(timer); }
      if (!r.ok) {
        console.error("[/api/tts/kokoro]", r.status, await r.text().catch(() => ""));
        return res.status(502).json({ error: "Kokoro request failed." });
      }
      const buf = Buffer.from(await r.arrayBuffer());
      const base64 = buf.toString("base64");
      cacheSet(cacheKey, base64);
      let outUrl = null;
      try { fs.writeFileSync(cacheFile, buf); outUrl = cacheUrl; } catch (_) {}
      res.json({ audioContent: base64, audioEncoding: "MP3", url: outUrl });
    } catch (err) {
      console.error("[/api/tts/kokoro]", err.message);
      res.status(err.name === "AbortError" ? 504 : 500).json({ error: err.message });
    }
  });
  /* GET /api/tts/kokoro/wake — the board opens: wake a sleeping voice host
     now, so it is ready by the time the first sentence is asked for. */
  router.get("/kokoro/wake", authenticate, async (req, res) => {
    const base = kokoroBase();
    if (!base) return res.json({ configured: !!process.env.IMAGE_WORKER_URL, engine: "melo" });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 50000);
    try {
      const r = await fetch(`${base}/health`, { signal: ctrl.signal });
      res.json({ configured: true, ok: r.ok, engine: "kokoro" });
    } catch (e) {
      res.json({ configured: true, ok: false });
    } finally { clearTimeout(timer); }
  });

  router.post("/elevenlabs", authenticate, async (req, res) => {
    try {
      // Gated as PrepBot's "voice" part (feature state + per-user overrides
      // + the voice sub-checkbox in admin Settings). 403 on any denial —
      // callers fall back to Web Speech regardless of the status code.
      let verdict = await access.canUse(req, "prepbot", "voice");
      // PrepBoard speaks with the same voice (its daily voice allowance
      // is counted by routes/whiteboard.js, which tells the board when to stop)
      if (!verdict.allowed && req.body?.from === "board") verdict = await access.canUse(req, "whiteboard");
      if (!verdict.allowed) {
        return res.status(403).json({ error: "ElevenLabs voice is not available on your plan.", reason: verdict.reason });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "ElevenLabs is not configured." });
      }

      // "Alice — Clear, Engaging Educator", one of ElevenLabs' default
      // "premade" voices. Those are API-usable on every plan, including
      // free; the old classic voices (e.g. "Rachel") were reclassified as
      // Voice-Library voices and now 402 for free accounts via the API.
      const board = req.body?.from === "board";
      /* The board's voices: ElevenLabs' default (premade) voices, usable on
         every plan. Only these, so the endpoint cannot be used to spend on
         any voice at all. A board sentence uses the most natural model
         (multilingual v2, a little more expression); everything else keeps
         the fast one it always had. */
      const BOARD_VOICES = new Set([
        "Xb7hH8MSUJpSbSDYk0k2", "XrExE9yKIg1WjnnlVkGX", "EXAVITQu4vr4xnSDxMaL", "cgSgspJ2msm6clMCkdW9", "pFZP5JQG7iQjIQuC4Bku",
        "JBFqnCBsd6RMkjVDRZzb", "nPczCjzI2devNBz1zQrb", "cjVigY5qzO86Huf0OWal", "IKne3meq5aSn9XLyUdCD", "onwK4e9ZLuTAKqWW03F9",
        ...String(process.env.BOARD_EXTRA_VOICES || "").split(",").map((v) => v.trim()).filter(Boolean),
      ]);
      const ALICE = "Xb7hH8MSUJpSbSDYk0k2";
      let { text, voiceId = ALICE } = req.body;
      if (board && !BOARD_VOICES.has(voiceId)) voiceId = ALICE;
      if (!board && voiceId !== ALICE && !BOARD_VOICES.has(voiceId)) voiceId = ALICE;
      const MODEL = board ? "eleven_multilingual_v2" : "eleven_turbo_v2_5";
      const SETTINGS = board
        ? { stability: 0.38, similarity_boost: 0.8, style: 0.28, use_speaker_boost: true }
        : { stability: 0.45, similarity_boost: 0.75 };
      if (typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "text must be a non-empty string." });
      }
      if (text.length > MAX_CHARS) {
        return res.status(400).json({ error: `text too long (max ${MAX_CHARS} chars).` });
      }

      const cacheVoice = board ? `${voiceId}~v2` : voiceId; // a board line in the natural model is its own recording
      const { file: cacheFile, url: cacheUrl } = cacheFileFor(cacheVoice, text);

      // 1) Static disk hit — hand back the static URL so the browser loads it
      // straight off the CDN/static layer. No ElevenLabs call, no bytes here.
      try {
        if (fs.existsSync(cacheFile)) {
          return res.json({ url: cacheUrl, audioEncoding: "MP3", cached: "disk" });
        }
      } catch (_) {}

      // 2) Warm-instance memory hit.
      const cacheKey = `${cacheVoice}|${text}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        return res.json({ audioContent: cached, audioEncoding: "MP3", cached: "mem" });
      }

      const say = (vid) => fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: MODEL,
          voice_settings: SETTINGS,
        }),
        // NOT sending `apply_text_normalization`. It is ElevenLabs' own
        // normaliser and it handles numbers, dates, currency and
        // abbreviations — not superscripts, fractions, roots or relations,
        // which are the things that were being read wrongly. On the v2.5
        // models it is an Enterprise-plan feature as well. Callers send text
        // that has already been through utils/speech-maths.js, which turns
        // the maths AND the figures into words, so there is nothing left for
        // it to do and nothing to risk a 400 over.
      });

      let elResponse = await say(voiceId);
      /* a voice this account cannot use (402/404): say it in Alice instead */
      if (!elResponse.ok && voiceId !== ALICE && [400, 401, 402, 404, 422].includes(elResponse.status)) {
        console.warn("[/api/tts/elevenlabs] voice", voiceId, elResponse.status, "— falling back to Alice");
        elResponse = await say(ALICE);
      }
      if (!elResponse.ok) {
        const detail = await elResponse.text().catch(() => "");
        console.error("[/api/tts/elevenlabs]", elResponse.status, detail);
        return res.status(502).json({ error: "ElevenLabs request failed." });
      }

      const buf = Buffer.from(await elResponse.arrayBuffer());
      const base64 = buf.toString("base64");
      cacheSet(cacheKey, base64); // remember it so the next identical line is free

      // Best-effort persist to the static folder so it can be committed and
      // then served for free forever. No-ops on a read-only filesystem.
      let outUrl = null;
      try { fs.writeFileSync(cacheFile, buf); outUrl = cacheUrl; } catch (_) {}

      res.json({ audioContent: base64, audioEncoding: "MP3", url: outUrl });
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
