/* ═══════════════════════════════════════════════════════
   RECALL PRESS — CARD IMAGE UPLOAD + AI GENERATION
   Re-encodes any picked or AI-generated image to a small JPEG
   data: URI and stores it straight on the card's frontImage/
   backImage field in Firestore (users/{uid}/flashcardDecks/{id}).
   No blob storage service involved on purpose — Cloud Storage
   for Firebase now requires the Blaze billing plan, and Firestore
   itself stays free on Spark, so images are kept small enough
   (~15KB) to live inline instead.
═══════════════════════════════════════════════════════ */
import { imageGenerate } from '/utils/ai-client.js';

// Small enough that even a deck with images on every card face stays
// comfortably under Firestore's 1 MiB per-document limit.
const MAX_DIM = 240;
const JPEG_QUALITY = 0.6;
const MAX_DATA_URI_LENGTH = 40000; // ~40KB, generous margin over the ~15KB typical output

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
  const dataUri = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  if (dataUri.length > MAX_DATA_URI_LENGTH) {
    throw new Error('That image is too detailed to store — try a simpler picture.');
  }
  return dataUri;
}

/**
 * Re-encode a picked image file to a small JPEG data: URI.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function uploadCardImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return toJpegDataUri(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Generate a simple illustration from a text prompt (via the Cloudflare
 * Workers AI proxy at /api/ai/image), re-encoded to the same small JPEG
 * data: URI shape as an upload.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateCardImage(prompt) {
  const dataUri = await imageGenerate({ prompt });
  const img = await loadImage(dataUri);
  return toJpegDataUri(img);
}
