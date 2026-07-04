/**
 * Centralized AI model definitions — edit here to update all AI features.
 *
 * GEMINI_MODELS       — URL strings for fallback chains (theory-analyser, video.js, server)
 * GEMINI_MODELS_UI    — labeled objects for UI dropdowns
 * GROQ_MODELS         — labeled objects for UI dropdowns + fallback chain
 * GROQ_DEFAULT_MODEL  — default model ID for the server /api/ai/chat fallback
 * CLAUDE_MODELS       — labeled objects for UI dropdowns
 * CLAUDE_DEFAULT_MODEL— default model ID for the server /api/ai/chat fallback
 * GEMINI_SKIP_STATUSES— HTTP codes that mean "try next model"
 */

// ── Gemini ─────────────────────────────────────────────────────────────────

export const GEMINI_MODELS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
];

export const GEMINI_MODELS_UI = [
  { label: 'Gemini 3.5 Flash-Lite', provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent' },
  { label: 'Gemini 3.5 Flash',      provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent' },
  { label: 'Gemini 3.5 Pro',        provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-pro:generateContent' },
  { label: 'Gemini 3.0 Flash',      provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent' },
  { label: 'Gemini 2.5 Flash-Lite', provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent' },
  { label: 'Gemini 2.5 Flash',      provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent' },
  { label: 'Gemini 2.5 Pro',        provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent' },
  { label: 'Gemini 2.0 Flash',      provider: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent' },
];

export const GEMINI_SKIP_STATUSES = new Set([404, 429, 503, 529]);

// Same models, ordered STRONGEST-first instead of cheapest-first. Use this
// (instead of the default GEMINI_MODELS) for one-shot, low-volume, quality-
// sensitive jobs — e.g. crafting an image-generation prompt — where getting
// a better result on the first try matters more than saving a few tokens.
// Lite variants are pushed to the end since they're the weakest reasoners.
export const GEMINI_MODELS_QUALITY_FIRST = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
];

// ── Groq ───────────────────────────────────────────────────────────────────

export const GROQ_MODELS = [
  { label: 'Llama 3.3 70B',  provider: 'groq', model: 'llama-3.3-70b-versatile' },
  { label: 'Llama 3.1 8B',   provider: 'groq', model: 'llama-3.1-8b-instant' },
  { label: 'Qwen3 32B',      provider: 'groq', model: 'qwen/qwen3-32b' },
  { label: 'Mixtral 8x7B',   provider: 'groq', model: 'mixtral-8x7b-32768' },
  { label: 'Gemma 2 9B',     provider: 'groq', model: 'gemma2-9b-it' },
  { label: 'GPT-OSS 120B',   provider: 'groq', model: 'openai/gpt-oss-120b' },
  { label: 'GPT-OSS 20B',    provider: 'groq', model: 'openai/gpt-oss-20b' },
];

export const GROQ_DEFAULT_MODEL = 'llama-3.1-8b-instant';

// ── Claude ─────────────────────────────────────────────────────────────────

export const CLAUDE_MODELS = [
  { label: 'Claude Haiku 4.5',  model: 'claude-haiku-4-5-20251001' },
  { label: 'Claude Sonnet 4.6', model: 'claude-sonnet-4-6' },
  { label: 'Claude Opus 4.7',   model: 'claude-opus-4-7' },
];

export const CLAUDE_DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
