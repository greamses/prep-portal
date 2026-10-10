/**
 * Server-side AI model definitions — mirrors utils/ai-models.js.
 * Edit utils/ai-models.js first, then keep this in sync.
 */

const GEMINI_MODELS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
];

const GROQ_DEFAULT_MODEL = 'llama-3.1-8b-instant';
const CLAUDE_DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

/* What a student may pick in PrepBot on the SITE'S keys — mirrors SITE_CHAT_MODELS
   in utils/ai-models.js. Anything not here is refused and the automatic chain is used. */
const SITE_CHAT_MODELS = {
  'gemini:gemini-3.8-flash': { provider: 'gemini', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  'gemini:gemini-3.5-flash-lite': { provider: 'gemini', model: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite' },
  'groq:llama-3.3-70b-versatile': { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  'groq:openai/gpt-oss-120b': { provider: 'groq', model: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
  'groq:llama-3.1-8b-instant': { provider: 'groq', model: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
  'claude:haiku': { provider: 'claude', model: CLAUDE_DEFAULT_MODEL, label: 'Claude Haiku 4.5' },
};

module.exports = { GEMINI_MODELS, GROQ_DEFAULT_MODEL, CLAUDE_DEFAULT_MODEL, SITE_CHAT_MODELS };
