/* ═══════════════════════════════════════════════════════
   RECALL PRESS — MAIN ENTRY POINT
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { initTopicPicker } from './topic-picker.js';
import { initPress } from './press.js';
import { initReview, renderDecks } from './review.js';

initTopicPicker({});
initPress({ onPrinted: () => renderDecks() });
initReview();

auth.onAuthStateChanged((user) => {
  if (user) renderDecks();
});
