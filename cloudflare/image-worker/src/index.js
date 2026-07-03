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
