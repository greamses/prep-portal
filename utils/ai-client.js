/* ═══════════════════════════════════════════════════════════════════════
   AI CLIENT — the ONE place the browser talks to a model.

   Every AI feature on the site (PrepBot, writing evaluator, theory analyser,
   math tutor, problem/video generators) routes its network call through here.
   Features supply only their own prompt / request body and parse their own
   result. Provider selection, the model-fallback chain, Firebase auth and
   error handling live in this module — not copy-pasted per feature.

   Model lists are the central ones in /utils/ai-models.js. Two call modes:
     • 'backend' (default) — POST to the authenticated server proxy
       (/api/ai/gemini, /api/ai/groq); the server holds the provider key.
     • a real provider key  — POST directly to Google / Groq from the browser.
   ═══════════════════════════════════════════════════════════════════════ */

import {
  GEMINI_MODELS,
  GEMINI_MODELS_QUALITY_FIRST,
  GEMINI_SKIP_STATUSES,
  GROQ_MODELS,
} from '/utils/ai-models.js';
import { auth } from '/firebase-init.js';

/* In local dev the static site is served on :5500 while the API runs on :5000;
   in production they share an origin. Same trick PrepBot uses. */
const API_BASE =
  (typeof window !== 'undefined' && window.location.port === '5500')
    ? 'http://127.0.0.1:5000'
    : '';

/* Firebase ID token for the authenticated backend proxy. */
async function _idToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to use AI features.');
  return user.getIdToken();
}

/** Pull the plain text out of a Gemini generateContent response. */
export function geminiText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/** Pull the plain text out of a Groq / OpenAI-style chat response. */
export function groqText(data) {
  return data?.choices?.[0]?.message?.content ?? '';
}

/**
 * One Gemini generateContent call, with model fallback.
 *
 * @param {object}   o.body        Gemini request body (contents, generationConfig, …).
 * @param {string}  [o.key]        'backend' (default) → authenticated /api/ai/gemini proxy.
 *                                 A real "AIza…" key  → direct call to Google.
 * @param {string[]}[o.models]     Fallback chain of model URLs (defaults to the central list).
 * @param {number}  [o.timeoutMs]  Abort each request after this long in direct mode.
 * @returns {Promise<object>}      Raw Gemini response JSON of the first model that answers.
 */
export async function geminiGenerate({
  body,
  key = 'backend',
  models = GEMINI_MODELS,
  timeoutMs = 30000,
} = {}) {
  const direct = key && key !== 'backend';
  const token = direct ? null : await _idToken();
  let lastErr = null;

  for (let i = 0; i < models.length; i++) {
    const modelUrl = models[i];
    let res;
    try {
      if (direct) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        res = await fetch(`${modelUrl}?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
      } else {
        res = await fetch(`${API_BASE}/api/ai/gemini`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ body, modelUrl }),
        });
      }
    } catch (e) {
      lastErr = e;        // network error / abort — try the next model
      continue;
    }

    // 403 is deliberately in GEMINI_SKIP_STATUSES: a free-tier key gets 403
    // from a paid-only Pro model, which means "try the next model," not
    // "your key is invalid." Only 401 (genuinely unauthenticated) short-
    // circuits immediately below.
    if (GEMINI_SKIP_STATUSES.has(res.status)) {
      lastErr = new Error(`Gemini model ${i + 1} unavailable (${res.status})`);
      continue;
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 401) {
        throw new Error(direct
          ? `Invalid Gemini API key (${res.status}). Please check your key.`
          : 'No Gemini key found. Add one in Account Settings.');
      }
      throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
    }
    return res.json();
  }
  throw lastErr || new Error('All Gemini models are unavailable. Please try again later.');
}

/**
 * One Groq chat-completions call.
 *
 * Pass a full `body` to choose the model yourself (single shot, no fallback),
 * or pass `system`/`prompt` to fan out across the central Groq model chain.
 *
 * @param {object}  [o.body]        Full Groq request body. Single attempt when given.
 * @param {string}  [o.system]      Convenience: system message (used when no body).
 * @param {string}  [o.prompt]      Convenience: user message (used when no body).
 * @param {string}  [o.key]         'backend' (default) → authenticated /api/ai/groq proxy.
 *                                  A real key → direct call to Groq.
 * @param {boolean} [o.json]        Request a JSON-object response (convenience mode).
 * @returns {Promise<object>}       Raw Groq response JSON of the first model that answers.
 */
export async function groqGenerate({
  body,
  system,
  prompt,
  key = 'backend',
  models = GROQ_MODELS,
  temperature = 0.2,
  maxTokens = 8192,
  json = false,
} = {}) {
  const direct = key && key !== 'backend';
  const token = direct ? null : await _idToken();

  const send = (reqBody) =>
    direct
      ? fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify(reqBody),
        })
      : fetch(`${API_BASE}/api/ai/groq`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ body: reqBody }),
        });

  /* Caller supplied a complete body → honour their model, single attempt. */
  if (body) {
    const res = await send(body);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Groq API ${res.status}: ${errText.slice(0, 200)}`);
    }
    return res.json();
  }

  /* Convenience mode → fan out across the central Groq model chain. */
  let lastErr = null;
  for (const model of models) {
    const reqBody = {
      model: model.model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...(prompt ? [{ role: 'user', content: prompt }] : []),
      ],
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    };
    let res;
    try {
      res = await send(reqBody);
    } catch (e) {
      lastErr = e;
      continue;
    }
    if (GEMINI_SKIP_STATUSES.has(res.status)) {
      lastErr = new Error(`Groq model ${model.label || model.model} unavailable (${res.status})`);
      continue;
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      lastErr = new Error(`Groq API ${res.status} (${model.label || model.model}): ${errText.slice(0, 200)}`);
      continue;
    }
    return res.json();
  }
  throw lastErr || new Error('All Groq models are unavailable. Please try again later.');
}

// Shared instruction for both the Gemini and Groq attempts in
// craftImagePrompt() below. Forces the model to (1) resolve the actual
// subject/answer instead of illustrating the question text, and (2) commit
// to concrete, specific colors/background/composition instead of the
// generic "flat design, bold solid colors" boilerplate that a weak model
// (or a lazy one) tends to just echo back.
function imagePromptInstruction(text) {
  return (
    'You are a visual prompt engineer for a text-to-image model (FLUX / ' +
    'Stable Diffusion style), writing prompts for flashcard icons.\n\n' +
    `Flashcard text: "${text}"\n\n` +
    'Step 1 (silent): work out the actual subject the icon should show — ' +
    'if the text is a question, that is its answer (e.g. "Which planet is ' +
    'farthest from the Sun?" → Neptune; "Which planet is largest?" → ' +
    'Jupiter), not the question itself.\n\n' +
    'Step 2: write ONE image-generation prompt (1-3 sentences) for a flat ' +
    'vector icon of that specific subject. It MUST commit to concrete, ' +
    'specific choices — not generic wording:\n' +
    '- The subject\'s own real/distinctive colors (e.g. Neptune: deep ' +
    'blue with icy white highlights; Jupiter: tan and cream bands with a ' +
    'reddish-orange storm spot) — never just "bold solid colors."\n' +
    '- A specific background (e.g. "dark navy starfield," "pale cream ' +
    'backdrop," "soft gradient sky") — never left unstated.\n' +
    '- A specific composition/framing (e.g. "centered, filling most of a ' +
    'square frame," "three-quarter view," "symmetrical front view").\n\n' +
    'Weave in naturally, without quoting them as a list: flat design, ' +
    'bold color blocking, minimal shading, clean vector icon style, no ' +
    'text/letters/numbers/words/labels/captions anywhere in the image.\n\n' +
    'Every prompt you write for a different flashcard must read as ' +
    'visibly different from the others — vary colors, background and ' +
    'composition to fit that specific subject.\n\n' +
    'Reply with ONLY the finished prompt sentence(s) — no preamble, no ' +
    'quotes, no bullet points, no explanation.'
  );
}

/**
 * Ask an LLM to write a well-structured, subject-specific text-to-image
 * prompt from a short piece of source text (e.g. a flashcard's front/back),
 * instead of shipping that text into a fixed generic template.
 *
 * Tries Gemini first via the STRONGEST-first model chain (see
 * GEMINI_MODELS_QUALITY_FIRST) since this is a one-shot, low-volume call
 * where prompt quality matters more than speed/cost. If every Gemini model
 * fails, tries Groq as a second LLM attempt before giving up. Only falls
 * back to the caller's own plain-template `fallbackPrompt` if BOTH fail, so
 * image generation is never blocked by this step.
 *
 * @param {string} text            The source text to build an image prompt from.
 * @param {string} fallbackPrompt  Prompt to use if every LLM attempt fails.
 * @returns {Promise<string>}      The crafted (or fallback) image prompt.
 */
export async function craftImagePrompt(text, fallbackPrompt) {
  const instruction = imagePromptInstruction(text);

  try {
    const data = await geminiGenerate({
      key: 'backend',
      models: GEMINI_MODELS_QUALITY_FIRST,
      body: {
        contents: [{ role: 'user', parts: [{ text: instruction }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 300 },
      },
    });
    const prompt = geminiText(data).trim().replace(/^["']|["']$/g, '');
    if (prompt) return prompt;
  } catch (e) {
    console.warn('[ai-client] craftImagePrompt: Gemini unavailable, trying Groq:', e.message);
  }

  try {
    const data = await groqGenerate({
      key: 'backend',
      prompt: instruction,
      temperature: 0.85,
      maxTokens: 300,
    });
    const prompt = groqText(data).trim().replace(/^["']|["']$/g, '');
    if (prompt) return prompt;
  } catch (e) {
    console.warn('[ai-client] craftImagePrompt: Groq also unavailable, using plain template:', e.message);
  }

  return fallbackPrompt;
}

/**
 * One simple-image generation call, proxied through /api/ai/image to the
 * Cloudflare Workers AI worker. Kept separate from geminiGenerate/groqGenerate
 * since it's a different provider drawing on a different resource pool
 * (Cloudflare neurons, not LLM tokens) — see server/routes/ai.js.
 *
 * @param {string} o.prompt  Plain-text description of the image (max 500 chars).
 * @returns {Promise<string>} A data: URI (base64 JPEG) ready for an <img src>.
 */
export async function imageGenerate({ prompt } = {}) {
  const token = await _idToken();
  const res = await fetch(`${API_BASE}/api/ai/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Image generation ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.image) throw new Error('No image came back — try again.');
  return `data:image/jpeg;base64,${data.image}`;
}

/**
 * Store an image (a data: URI or bare base64 string) via /api/ai/image-store,
 * which signs and uploads it to Cloudinary server-side. Returns the delivery
 * URL to persist (e.g. on a flashcard's frontImage/backImage field).
 *
 * @param {string} o.imageBase64  A data: URI or bare base64-encoded image.
 * @returns {Promise<string>} The stored image's URL.
 */
export async function imageStore({ imageBase64 } = {}) {
  const token = await _idToken();
  const res = await fetch(`${API_BASE}/api/ai/image-store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ imageBase64 }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Image storage ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.url) throw new Error('No stored image URL came back — try again.');
  return data.url;
}
