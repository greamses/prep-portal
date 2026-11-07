/**
 * Prep Portal — simple image generation worker.
 *
 * Called server-to-server from the Vercel app (server/routes/ai.js,
 * POST /api/ai/image) — never directly from the browser, so there's no CORS
 * handling here and the shared secret is safe to check with a simple
 * equality (the caller is our own trusted server, not a public client).
 */
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const auth = request.headers.get("Authorization") || "";
    if (auth !== `Bearer ${env.SHARED_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    /* SPEECH: PrepBoard's free voice (MeloTTS, MIT). { tts: "<sentence>" }
       → { audio: "<base64 MP3>" }. It shares the account's free daily
       Workers AI allowance with the pictures, and costs very little of it. */
    if (typeof body?.tts === "string") {
      const text = body.tts.trim().slice(0, 1200);
      if (!text) return new Response(JSON.stringify({ error: "text is empty" }), { status: 400, headers: { "Content-Type": "application/json" } });
      try {
        const out = await env.AI.run("@cf/myshell-ai/melotts", { prompt: text, lang: "en" });
        const audio = typeof out === "string" ? out : out?.audio;
        if (!audio) throw new Error("no audio");
        return new Response(JSON.stringify({ audio }), { headers: { "Content-Type": "application/json" } });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || "Speech failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    const prompt = String(body?.prompt || "").trim().slice(0, 500);
    if (!prompt) {
      return new Response(JSON.stringify({ error: "A prompt is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const result = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
        prompt,
      });
      // { image: "<base64 JPEG>" }
      return new Response(JSON.stringify({ image: result.image }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "Generation failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
