/* ═══════════════════════════════════════════════════════
   RECALL PRESS — CARD IMAGE UPLOAD + AI GENERATION
   Picked or AI-generated images are stored via /api/ai/image-store,
   which signs and uploads them to Cloudinary (the same account the
   homepage's real student photos already use — see home/js/reveal.js).
   Chosen over Firebase Storage (Blaze-only as of Feb 2026) and
   Cloudflare R2 (also gates its free tier behind a card) since
   Cloudinary's free plan needs neither.
═══════════════════════════════════════════════════════ */
import { imageGenerate, imageStore } from '/utils/ai-client.js';

// A light resize/re-encode for user-picked photos, just to keep uploads
// reasonably sized — Cloudinary handles final display sizing at delivery
// time (see the c_fill,g_auto transform server/routes/ai.js applies).
const MAX_DIM = 1200;
const JPEG_QUALITY = 0.85;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = src;
  });
}

function toJpegDataUri(img) {
  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = MAX_DIM / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/**
 * Re-encode a picked image file and store it via Cloudinary. Returns the
 * delivery URL to persist on the card.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function uploadCardImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const url = URL.createObjectURL(file);
  let dataUri;
  try {
    const img = await loadImage(url);
    dataUri = toJpegDataUri(img);
  } finally {
    URL.revokeObjectURL(url);
  }
  return imageStore({ imageBase64: dataUri });
}

/**
 * Generate a simple illustration from a text prompt (via the Cloudflare
 * Workers AI proxy at /api/ai/image), then store it via Cloudinary the same
 * way as an upload. Returns the delivery URL to persist on the card.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateCardImage(prompt) {
  const dataUri = await imageGenerate({ prompt });
  return imageStore({ imageBase64: dataUri });
}
