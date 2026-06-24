/**
 * models.js - Centralized AI Model Configurations
 *
 * NOTE ON GROQ CORS:
 * Groq's API does not support direct browser requests (CORS).
 * To call these models graciously from the frontend, ensure your fetch
 * logic handles failures by suggesting a proxy or using a server-side
 * middleware to securely append headers.
 */

import { GROQ_MODELS, GEMINI_MODELS_UI } from '../../utils/ai-models.js';

export const SHARED_MODELS = {
  groq: GROQ_MODELS.map(m => ({ ...m, requiresProxy: true })),
  gemini: GEMINI_MODELS_UI,
};

// ─── SUBJECT DATA REGISTRY ──────────────────────────────────
// All subject data (config, topics, labels, styles) now lives in one place:
//   /blogs/js/data.js  →  SUBJECTS + getSubjectData(key)
// This module only keeps the shared AI model list.

// Alias kept for backward compatibility.
export const SUBJECT_MODELS = SHARED_MODELS;
