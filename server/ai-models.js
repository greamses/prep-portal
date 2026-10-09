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

module.exports = { GEMINI_MODELS, GROQ_DEFAULT_MODEL, CLAUDE_DEFAULT_MODEL };
