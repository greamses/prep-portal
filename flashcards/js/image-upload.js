/* ═══════════════════════════════════════════════════════
   RECALL PRESS — CARD IMAGE UPLOAD
   Re-encodes any picked image to PNG (sharper for the mostly
   text/diagram content flashcards carry) and uploads it to
   Firebase Storage under the signed-in user's own folder.
═══════════════════════════════════════════════════════ */
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '/firebase-init.js';

const MAX_DIM = 800;

function toPng(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
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
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error('Could not convert image to PNG'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}

/**
 * Upload a card-face image, converted to PNG. Returns the download URL.
 * @param {string} deckId
 * @param {string} cardId
 * @param {'front'|'back'} side
 * @param {File} file
 */
export async function uploadCardImage(deckId, cardId, side, file) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to add images.');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');

  const blob = await toPng(file);
  const path = `users/${user.uid}/flashcardImages/${deckId}/${cardId}-${side}.png`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/png' });
  return getDownloadURL(storageRef);
}
