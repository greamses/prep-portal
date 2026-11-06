/* ============================================================================
   PrepBot Board — POST /api/whiteboard/turn
   ----------------------------------------------------------------------------
   One tutor turn, streamed as NDJSON (one JSON object per line):
     {type:"start", voice}              voice: may the PrepBot voice be used today
     {type:"beat", beat}                one sentence + its strokes (as many as come)
     {type:"limited", text}             today's board allowance is used up
     {type:"error", text}               nothing could be said
     {type:"done", provider}
   The model's text is turned into beats as it arrives (lib/whiteboard-protocol).
   The model is stopped at the first beat that ASKS — PrepBot then waits for the
   learner — and at once if the learner cuts in (the request closes).
   ========================================================================== */

const express = require("express");
const { authenticate } = require("../middleware/auth");
const access = require("../lib/access");
const { createScanner } = require("../lib/whiteboard-protocol");
const { buildSystem, buildUserMessage, cleanInput } = require("../lib/whiteboard-prompt");
const { streamGemini, streamClaude, streamGroq } = require("../lib/ai-stream");
const { startTurn, endTurn } = require("../lib/board-usage");
const { guardrail } = require("../lib/guardrails");

const PROVIDERS = [
  { name: "gemini", run: streamGemini, has: () => !!process.env.GEMINI_API_KEY },
  { name: "claude", run: streamClaude, has: () => !!process.env.ANTHROPIC_API_KEY },
  { name: "groq", run: streamGroq, has: () => !!process.env.GROQ_API_KEY },
];

module.exports = function () {
  const router = express.Router();

  router.post("/turn", authenticate, async (req, res) => {
    const verdict = await access.canUse(req, "whiteboard");
    if (!verdict.allowed) {
      const premium = verdict.reason === "premium-required";
      return res.status(premium ? 402 : 403).json({
        error: premium ? "premium_required" : "feature_disabled",
        premiumRequired: premium,
        reason: verdict.reason,
      });
    }

    const input = cleanInput(req.body);
    if (!input.learner) return res.status(400).json({ error: "Say something to PrepBot first." });

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) res.flushHeaders();
    const write = (o) => { try { res.write(JSON.stringify(o) + "\n"); } catch (_) {} };

    const safe = guardrail(input.learner);
    if (safe) {
      write({ type: "start", voice: true });
      write({ type: "beat", beat: { ask: safe, do: [] } });
      write({ type: "done", provider: "guardrail" });
      return res.end();
    }

    const uid = req.user?.uid;
    const email = req.user?.email;
    const allowance = await startTurn(uid, email);
    if (!allowance.ok) {
      write({ type: "limited", text: "That's all the board time for today. Come back tomorrow and we'll carry on from here." });
      write({ type: "done", provider: null });
      return res.end();
    }
    write({ type: "start", voice: allowance.voice, turnsLeft: Number.isFinite(allowance.turnsLeft) ? allowance.turnsLeft : null });

    const ctrl = new AbortController();
    let closed = false;
    res.on("close", () => { closed = true; ctrl.abort(); });

    const system = buildSystem({ grade: input.grade, style: input.style });
    const messages = [{ role: "user", content: buildUserMessage(input) }];
    const scanner = createScanner({ noAsk: input.style === "lecture" });
    let sent = 0, spoken = 0, tokens = 0, provider = null;

    const onDelta = (text) => {
      for (const beat of scanner.push(text)) {
        sent++;
        spoken += (beat.say || beat.ask || "").length;
        write({ type: "beat", beat });
      }
      if (scanner.stopped) ctrl.abort(); // asked, or enough: stop the model writing
    };

    for (const p of PROVIDERS) {
      if (closed || sent) break;
      if (!p.has()) continue;
      try {
        const out = await p.run({ system, messages, maxTokens: 2000, temperature: 0.55, signal: ctrl.signal, onDelta });
        tokens += out?.tokens || 0;
        provider = p.name;
      } catch (e) {
        if (e?.name === "AbortError" || ctrl.signal.aborted) {
          provider = provider || p.name;
          break; // stopped on purpose (asked / cut in)
        }
        console.warn(`[whiteboard] ${p.name} failed:`, e?.status || "", e?.message || e);
        if (sent) break; // it had started talking: don't switch voices mid-turn
      }
    }

    if (!closed) {
      for (const beat of scanner.end()) {
        sent++;
        spoken += (beat.say || beat.ask || "").length;
        write({ type: "beat", beat });
      }
      if (!sent) write({ type: "error", text: "Sorry, I couldn't get my thoughts on the board just now. Please ask me again." });
      write({ type: "done", provider });
      res.end();
    }
    /* count it — the model was billed even if the learner left */
    endTurn(uid, email, { tokens: tokens || Math.round(spoken / 3), chars: spoken });
  });

  return router;
};
