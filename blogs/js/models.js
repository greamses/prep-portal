/**
 * models.js - Centralized AI Model Configurations
 *
 * NOTE ON GROQ CORS:
 * Groq's API does not support direct browser requests (CORS).
 * To call these models graciously from the frontend, ensure your fetch
 * logic handles failures by suggesting a proxy or using a server-side
 * middleware to securely append headers.
 */

export const SHARED_MODELS = {
  groq: [
    {
      label: "Llama 3.3 70B",
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      requiresProxy: true,
    },
    {
      label: "Llama 3.1 8B",
      provider: "groq",
      model: "llama-3.1-8b-instant",
      requiresProxy: true,
    },
    {
      label: "Mixtral 8x7B",
      provider: "groq",
      model: "mixtral-8x7b-32768",
      requiresProxy: true,
    },
    {
      label: "Gemma 2 9B",
      provider: "groq",
      model: "gemma2-9b-it",
      requiresProxy: true,
    },
  ],
  gemini: [
    {
      label: "Gemini 3.1 Flash-Lite",
      provider: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent",
    },
    {
      label: "Gemini 3.1 Pro",
      provider: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent",
    },
    {
      label: "Gemini 2.5 Pro",
      provider: "gemini",
      url: "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent",
    },
    // Add other Gemini variants here...
  ],
};

// ─── SUBJECT DATA REGISTRY ──────────────────────────────────
// Maps URL parameters (?s=...) to the physical data.js paths
export const SUBJECT_REGISTRY = {
  plants: "/blogs/science/biology/plants/auto/data.js",
  animals: "/blogs/science/biology/animal/auto/data.js",
  animalfacts: "/blogs/science/biology/animal/auto/data.js",
};

// Alias for backward compatibility if needed in data.js
export const SUBJECT_MODELS = SHARED_MODELS;
