/* ═══════════════════════════════════════════════════════
   PUZZLES — seeded online-photo source for the Jigsaw
   The big jigsaw grids (10×10–20×20) want real photographs, not the little
   drawn scene (art.js). For now those come from free image links: a fixed
   list of stable Lorem Picsum photo IDs (Unsplash-sourced, free to use),
   seeded-picked so every client in a room lands on the SAME picture with
   nothing synced — same philosophy as the rest of the puzzle generators.

   "For now" is load-bearing: swap PHOTO_IDS for your own hosted image URLs
   later and nothing else has to change. Keep the URLs query-free — each
   piece face injects this string into an SVG <image href> via innerHTML,
   where a bare `&` would break the markup.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed } from './rng.js';

const PHOTO_NS = 60606;

// Stable Picsum IDs that read well cut into a grid — landscapes, animals
// and nature with big shapes and clear colour regions (not flat skies).
const PHOTO_IDS = [
  10, 1015, 1016, 1018, 1024, 1036, 1039,
  1043, 1047, 1059, 1069, 1074, 1080, 1084,
];

// A square photo URL, deterministic in `seed`. 720² is plenty for a 20×20
// cut and light enough to fetch once (every piece references the same URL,
// so the browser caches a single image).
export function photoPictureUrl(seed) {
  const rng = mulberry32(hashSeed(seed, PHOTO_NS));
  const id = PHOTO_IDS[Math.floor(rng() * PHOTO_IDS.length)];
  return `https://picsum.photos/id/${id}/720/720`;
}
