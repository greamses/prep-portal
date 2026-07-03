/* ═══════════════════════════════════════════════════════
   RECALL PRESS — MAIN ENTRY POINT
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { enhanceSelects } from '/utils/components/pp-select.js';
import { initTopicPicker } from './topic-picker.js';
import { initPress } from './press.js';
import { initReview, renderDecks } from './review.js';

initTopicPicker({});
initPress({ onPrinted: () => renderDecks() });
initReview();
enhanceSelects(document.querySelector('.press-form'));

auth.onAuthStateChanged((user) => {
  if (user) renderDecks();
});
