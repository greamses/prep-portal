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
import { PORTRAITS } from '/data/vocab/history/leaders.js';

const PHOTO_NS = 60606;
const LEADER_NS = 60607;

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

/* ── Nigerian leaders ─────────────────────────────────────────────────────
   The same portraits the Vocab game asks you to name (data/vocab/history/
   leaders.js), reused here as the picture to rebuild — slide a head of state
   back together, then go and spell his name next door. Seeded off the room
   seed like every other picture, so a room shares one face with nothing
   synced.

   Portraits are tall (3:4) and the board is square, so the picture has to be
   cropped, not squashed. There is no image library in this project, so the
   crop is done where the pixels already are — a canvas in the page. The files
   are served from our own origin, so the canvas stays untainted and toDataURL
   is allowed; the result is the same square data: URI shape the "your photo"
   upload produces, which is why nothing downstream needs to know. */
export function leaderPortrait(seed) {
  const rng = mulberry32(hashSeed(seed, LEADER_NS));
  return PORTRAITS[Math.floor(rng() * PORTRAITS.length)];
}

const SQUARE = 640; // sharp enough for a 20×20 jigsaw cut, small enough to hold

/** The seeded leader portrait as a square JPEG data: URI. Resolves to '' if
    the image can't be fetched, which just falls the round back to its default
    picture rather than starting a puzzle with no face on it. */
export function leaderPictureUri(seed) {
  const portrait = leaderPortrait(seed);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SQUARE;
        canvas.height = SQUARE;
        const w = img.naturalWidth, h = img.naturalHeight;
        const side = Math.min(w, h);
        // Faces sit high in a portrait, so a tall picture is cropped from
        // near the top rather than the middle — a centred crop takes the chin
        // and the collar and leaves the eyes outside the board.
        const sx = (w - side) / 2;
        const sy = h > w ? (h - side) * 0.18 : (h - side) / 2;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, SQUARE, SQUARE);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = portrait.img;
  });
}
