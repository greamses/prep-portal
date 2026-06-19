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

    if (GEMINI_SKIP_STATUSES.has(res.status)) {
      lastErr = new Error(`Gemini model ${i + 1} unavailable (${res.status})`);
      continue;
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) {
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
