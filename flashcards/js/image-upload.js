/* ═══════════════════════════════════════════════════════
   RECALL PRESS — CARD IMAGE UPLOAD + AI GENERATION
   Re-encodes any picked or AI-generated image to PNG (sharper
   for the mostly text/diagram content flashcards carry) and
   uploads it to Firebase Storage under the signed-in user's
   own folder.
═══════════════════════════════════════════════════════ */
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '/firebase-init.js';
import { imageGenerate } from '/utils/ai-client.js';

const MAX_DIM = 800;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = src;
  });
}

function toPngBlob(img) {
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
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not convert image to PNG'))),
      'image/png',
    );
  });
}

async function storeCardImage(deckId, cardId, side, blob) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to add images.');
  const path = `users/${user.uid}/flashcardImages/${deckId}/${cardId}-${side}.png`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/png' });
  return getDownloadURL(storageRef);
}

/**
 * Upload a card-face image, converted to PNG. Returns the download URL.
 * @param {string} deckId
 * @param {string} cardId
 * @param {'front'|'back'} side
 * @param {File} file
 */
export async function uploadCardImage(deckId, cardId, side, file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const blob = await toPngBlob(img);
    return storeCardImage(deckId, cardId, side, blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Generate a simple illustration for a card face from a text prompt (via the
 * Cloudflare Workers AI proxy at /api/ai/image), then store it the same way
 * as an upload. Returns the download URL.
 * @param {string} deckId
 * @param {string} cardId
 * @param {'front'|'back'} side
 * @param {string} prompt
 */
export async function generateCardImage(deckId, cardId, side, prompt) {
  const dataUri = await imageGenerate({ prompt });
  const img = await loadImage(dataUri);
  const blob = await toPngBlob(img);
  return storeCardImage(deckId, cardId, side, blob);
}
