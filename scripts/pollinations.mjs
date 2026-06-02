#!/usr/bin/env node
// ============================================================================
// Pollinations.ai  —  free, keyless image generation (FLUX).
//
// Usage:
//   node scripts/pollinations.mjs "<prompt>" <out.png> [width] [height] [seed]
//
// Returns image bytes directly over a plain GET — no API key, no billing.
// Requires Node 18+ (global fetch).
// ============================================================================

import { writeFileSync } from "node:fs";

const [, , prompt, out = "out.png", w = "768", h = "1024", seed] = process.argv;
if (!prompt) {
  console.error('Usage: node scripts/pollinations.mjs "<prompt>" <out.png> [w] [h] [seed]');
  process.exit(1);
}

const params = new URLSearchParams({ width: w, height: h, nologo: "true", model: "flux" });
if (seed) params.set("seed", seed);
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;

// Pollinations can be slow / occasionally flaky — retry a few times.
for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) throw new Error(`too small (${buf.length} bytes)`);
    writeFileSync(out, buf);
    console.log(`✓ Saved ${out} (${(buf.length / 1024).toFixed(0)} KB)`);
    process.exit(0);
  } catch (e) {
    console.error(`  attempt ${attempt} failed: ${e.message}`);
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000 * attempt));
  }
}
console.error(`✗ Gave up on ${out}`);
process.exit(1);
