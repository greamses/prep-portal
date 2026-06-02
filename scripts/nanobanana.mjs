#!/usr/bin/env node
// ============================================================================
// Nano Banana  —  Google Gemini 2.5 Flash Image generator/editor.
//
// Usage:
//   node scripts/nanobanana.mjs "<prompt>" [out.png] [inputImage]
//
//   • <prompt>      text describing the image (required)
//   • out.png       where to save it (default: nanobanana.png)
//   • inputImage    optional source image to EDIT instead of generate
//
// Needs a Gemini API key in GEMINI_API_KEY — set it in the environment or put
//   GEMINI_API_KEY=your_key_here
// in the project's .env file (already git-ignored, so it never gets committed).
//
// Requires Node 18+ (uses global fetch + ES modules).
// ============================================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";

// ── Minimal .env loader so the key can live in a git-ignored .env ────────────
for (const file of [".env", "server/.env"]) {
  if (process.env.GEMINI_API_KEY || !existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("✗ No GEMINI_API_KEY found (set it in the env or in .env).");
  process.exit(1);
}

const [, , prompt, out = "nanobanana.png", inputImage] = process.argv;
if (!prompt) {
  console.error('Usage: node scripts/nanobanana.mjs "<prompt>" [out.png] [inputImage]');
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-image";
const parts = [{ text: prompt }];

// Optional: pass a source image to edit it rather than generate from scratch.
if (inputImage) {
  const ext = inputImage.split(".").pop().toLowerCase();
  parts.push({
    inlineData: {
      mimeType: ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png",
      data: readFileSync(inputImage).toString("base64"),
    },
  });
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
  {
    method: "POST",
    headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
  }
);

if (!res.ok) {
  console.error(`✗ Gemini API error ${res.status}:`, (await res.text()).slice(0, 600));
  process.exit(1);
}

const json = await res.json();
const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
if (!img) {
  console.error("✗ No image in response:", JSON.stringify(json).slice(0, 600));
  process.exit(1);
}

writeFileSync(out, Buffer.from(img.inlineData.data, "base64"));
console.log(`✓ Saved ${out}`);
