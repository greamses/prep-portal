/* ═══════════════════════════════════════════════════════
   PUZZLES — seeded picture generator for the Picture slider
   Draws a little landscape scene as one SVG string from the room seed, so
   every client computes an IDENTICAL picture locally — same philosophy as
   sudoku.js/slider.js: one seed, zero network traffic, nothing synced.

   The slider never slices the image itself: every tile paints the whole
   picture as its background and shows only its own window of it via
   background-size/background-position (see game.js), so this module
   doesn't need to know the grid size at all.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed } from './rng.js';

const ART_NS = 90210;
export const ART_SIZE = 600;

// Soft pastel palettes in the site's register — a day, a sunset and a night
// variant so back-to-back rounds don't all look alike.
const SKIES = [
  { top: '#aee0f2', bottom: '#eef6e9', glow: '#f4c95d', night: false },
  { top: '#f2c39b', bottom: '#f7e8c8', glow: '#ef9273', night: false },
  { top: '#39466b', bottom: '#5d6f99', glow: '#f2e8c9', night: true },
];
const HILL_SETS = [
  ['#c3dda6', '#9cc783', '#7cab63'],
  ['#cfe0ae', '#a6c489', '#83a969'],
];
const HOUSE_COLORS = ['#f2b3a0', '#f4c95d', '#a9cbe8', '#dcc3ea'];
const BALLOON_COLORS = ['#f07a7a', '#6fb7e8', '#f4c95d', '#9dcf9d'];

const r1 = (x) => Math.round(x * 10) / 10;

function pine(x, y, s, fill) {
  return `<rect x="${r1(x - 3 * s)}" y="${r1(y - 6 * s)}" width="${r1(6 * s)}" height="${r1(14 * s)}" fill="#8a6a4c"/>` +
    `<path d="M${r1(x)},${r1(y - 52 * s)} L${r1(x + 20 * s)},${r1(y - 20 * s)} L${r1(x - 20 * s)},${r1(y - 20 * s)} Z" fill="${fill}"/>` +
    `<path d="M${r1(x)},${r1(y - 36 * s)} L${r1(x + 24 * s)},${r1(y - 2 * s)} L${r1(x - 24 * s)},${r1(y - 2 * s)} Z" fill="${fill}"/>`;
}

function roundTree(x, y, s, fill) {
  return `<rect x="${r1(x - 3 * s)}" y="${r1(y - 18 * s)}" width="${r1(6 * s)}" height="${r1(20 * s)}" fill="#8a6a4c"/>` +
    `<circle cx="${r1(x)}" cy="${r1(y - 30 * s)}" r="${r1(17 * s)}" fill="${fill}"/>` +
    `<circle cx="${r1(x - 11 * s)}" cy="${r1(y - 22 * s)}" r="${r1(11 * s)}" fill="${fill}"/>` +
    `<circle cx="${r1(x + 11 * s)}" cy="${r1(y - 22 * s)}" r="${r1(11 * s)}" fill="${fill}"/>`;
}

function cloud(x, y, s) {
  return `<g fill="#ffffff" opacity="0.88">` +
    `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(30 * s)}" ry="${r1(14 * s)}"/>` +
    `<ellipse cx="${r1(x - 20 * s)}" cy="${r1(y + 4 * s)}" rx="${r1(20 * s)}" ry="${r1(10 * s)}"/>` +
    `<ellipse cx="${r1(x + 22 * s)}" cy="${r1(y + 5 * s)}" rx="${r1(18 * s)}" ry="${r1(9 * s)}"/>` +
    `</g>`;
}

// Builds the scene as an SVG string. Deterministic in `seed`.
export function sceneSvg(seed) {
  const rng = mulberry32(hashSeed(seed, ART_NS));
  const W = ART_SIZE;
  const sky = SKIES[Math.floor(rng() * SKIES.length)];
  const greens = HILL_SETS[Math.floor(rng() * HILL_SETS.length)];
  const parts = [];

  parts.push(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${sky.top}"/><stop offset="1" stop-color="${sky.bottom}"/>` +
    `</linearGradient></defs>`);
  parts.push(`<rect width="${W}" height="${W}" fill="url(#sky)"/>`);

  if (sky.night) {
    // Stars spread over the whole sky so no two night tiles look the same.
    for (let i = 0; i < 30; i++) {
      parts.push(`<circle cx="${r1(10 + rng() * (W - 20))}" cy="${r1(8 + rng() * 330)}" r="${r1(1 + rng() * 1.6)}" fill="#f4eed9" opacity="${r1(0.5 + rng() * 0.5)}"/>`);
    }
  }

  // Sun or moon
  const gx = 90 + rng() * (W - 180);
  const gy = 70 + rng() * 110;
  const gr = 34 + rng() * 12;
  if (sky.night) {
    parts.push(`<circle cx="${r1(gx)}" cy="${r1(gy)}" r="${r1(gr)}" fill="${sky.glow}"/>`);
    parts.push(`<circle cx="${r1(gx + gr * 0.42)}" cy="${r1(gy - gr * 0.18)}" r="${r1(gr * 0.82)}" fill="${sky.top}"/>`);
  } else {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.35;
      parts.push(`<line x1="${r1(gx + Math.cos(a) * (gr + 8))}" y1="${r1(gy + Math.sin(a) * (gr + 8))}" x2="${r1(gx + Math.cos(a) * (gr + 20))}" y2="${r1(gy + Math.sin(a) * (gr + 20))}" stroke="${sky.glow}" stroke-width="5" stroke-linecap="round"/>`);
    }
    parts.push(`<circle cx="${r1(gx)}" cy="${r1(gy)}" r="${r1(gr)}" fill="${sky.glow}"/>`);
  }

  // Clouds (day skies) — scattered so most tiles catch a detail.
  if (!sky.night) {
    const n = 3 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) {
      parts.push(cloud(50 + rng() * (W - 100), 50 + rng() * 220, 0.8 + rng() * 0.9));
    }
  }

  // A balloon or a kite in the upper half — a strong, unmistakable landmark.
  const bx = 70 + rng() * (W - 140);
  const by = 90 + rng() * 150;
  const bc = BALLOON_COLORS[Math.floor(rng() * BALLOON_COLORS.length)];
  if (rng() < 0.55) {
    parts.push(`<ellipse cx="${r1(bx)}" cy="${r1(by)}" rx="30" ry="36" fill="${bc}"/>` +
      `<path d="M${r1(bx)},${r1(by - 36)} Q${r1(bx + 13)},${r1(by)} ${r1(bx)},${r1(by + 36)} Q${r1(bx - 13)},${r1(by)} ${r1(bx)},${r1(by - 36)}" fill="#ffffff" opacity="0.35"/>` +
      `<line x1="${r1(bx - 12)}" y1="${r1(by + 32)}" x2="${r1(bx - 7)}" y2="${r1(by + 52)}" stroke="#6b5537" stroke-width="2"/>` +
      `<line x1="${r1(bx + 12)}" y1="${r1(by + 32)}" x2="${r1(bx + 7)}" y2="${r1(by + 52)}" stroke="#6b5537" stroke-width="2"/>` +
      `<rect x="${r1(bx - 9)}" y="${r1(by + 52)}" width="18" height="13" rx="2" fill="#a5794f"/>`);
  } else {
    parts.push(`<g transform="rotate(${r1(-20 + rng() * 40)} ${r1(bx)} ${r1(by)})">` +
      `<path d="M${r1(bx)},${r1(by - 30)} L${r1(bx + 22)},${r1(by)} L${r1(bx)},${r1(by + 30)} L${r1(bx - 22)},${r1(by)} Z" fill="${bc}"/>` +
      `<line x1="${r1(bx)}" y1="${r1(by - 30)}" x2="${r1(bx)}" y2="${r1(by + 30)}" stroke="#6b5537" stroke-width="1.6"/>` +
      `<line x1="${r1(bx - 22)}" y1="${r1(by)}" x2="${r1(bx + 22)}" y2="${r1(by)}" stroke="#6b5537" stroke-width="1.6"/>` +
      `<path d="M${r1(bx)},${r1(by + 30)} q10,26 -6,52" fill="none" stroke="#6b5537" stroke-width="2"/>` +
      `</g>`);
  }

  // Birds (day) — little double arcs.
  if (!sky.night) {
    const n = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const x = 40 + rng() * (W - 80);
      const y = 60 + rng() * 240;
      const s = 0.7 + rng() * 0.7;
      parts.push(`<path d="M${r1(x - 12 * s)},${r1(y)} Q${r1(x - 6 * s)},${r1(y - 8 * s)} ${r1(x)},${r1(y)} Q${r1(x + 6 * s)},${r1(y - 8 * s)} ${r1(x + 12 * s)},${r1(y)}" fill="none" stroke="#4a4238" stroke-width="${r1(2 * s)}" stroke-linecap="round"/>`);
    }
  }

  // Three layered hills, back to front.
  const h1 = 330 + rng() * 40;
  const h2 = 400 + rng() * 40;
  const h3 = 480 + rng() * 30;
  parts.push(`<path d="M0,${r1(h1 + 40)} Q${r1(90 + rng() * 80)},${r1(h1 - 60)} 300,${r1(h1 + 10)} T${W},${r1(h1 - 10 + rng() * 40)} V${W} H0 Z" fill="${greens[0]}"/>`);
  parts.push(`<path d="M0,${r1(h2 + 20)} Q${r1(140 + rng() * 100)},${r1(h2 - 70)} 340,${r1(h2)} T${W},${r1(h2 - 30 + rng() * 50)} V${W} H0 Z" fill="${greens[1]}"/>`);
  parts.push(`<path d="M0,${r1(h3 + 10)} Q${r1(160 + rng() * 120)},${r1(h3 - 60)} 380,${r1(h3)} T${W},${r1(h3 - 20 + rng() * 40)} V${W} H0 Z" fill="${greens[2]}"/>`);

  // A little house on the middle hill, most of the time.
  if (rng() < 0.7) {
    const hx = 90 + rng() * (W - 220);
    const hy = h2 + 26 + rng() * 30;
    const hc = HOUSE_COLORS[Math.floor(rng() * HOUSE_COLORS.length)];
    parts.push(`<g>` +
      `<rect x="${r1(hx)}" y="${r1(hy)}" width="76" height="52" fill="${hc}" stroke="#4a4238" stroke-width="2.5"/>` +
      `<path d="M${r1(hx - 8)},${r1(hy)} L${r1(hx + 38)},${r1(hy - 34)} L${r1(hx + 84)},${r1(hy)} Z" fill="#b0623f" stroke="#4a4238" stroke-width="2.5"/>` +
      `<rect x="${r1(hx + 10)}" y="${r1(hy + 18)}" width="16" height="16" fill="#fdf8ec" stroke="#4a4238" stroke-width="2"/>` +
      `<line x1="${r1(hx + 18)}" y1="${r1(hy + 18)}" x2="${r1(hx + 18)}" y2="${r1(hy + 34)}" stroke="#4a4238" stroke-width="1.5"/>` +
      `<rect x="${r1(hx + 46)}" y="${r1(hy + 22)}" width="18" height="30" rx="2" fill="#8a6a4c" stroke="#4a4238" stroke-width="2"/>` +
      `</g>`);
  }

  // Trees scattered across the front hills.
  const treeCount = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < treeCount; i++) {
    const x = 30 + rng() * (W - 60);
    const y = h3 + 20 + rng() * (W - h3 - 50);
    const s = 0.8 + rng() * 0.9;
    const fill = greens[Math.floor(rng() * 2)];
    parts.push(rng() < 0.5 ? pine(x, y, s, fill) : roundTree(x, y, s, fill));
  }

  // A winding path down the front hill, sometimes.
  if (rng() < 0.5) {
    const px = 120 + rng() * (W - 240);
    parts.push(`<path d="M${r1(px)},${r1(h3 + 20)} Q${r1(px - 60)},${r1(h3 + 70)} ${r1(px + 20)},${r1(h3 + 110)} T${r1(px - 30)},${W}" fill="none" stroke="#e8d8b8" stroke-width="16" stroke-linecap="round" opacity="0.9"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}">${parts.join('')}</svg>`;
}

// The scene as a data: URI, ready to drop into background-image / <img src>.
export function scenePictureUri(seed) {
  return `data:image/svg+xml,${encodeURIComponent(sceneSvg(seed))}`;
}
