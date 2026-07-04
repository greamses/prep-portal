/* ═══════════════════════════════════════════════════════
   RECALL PRESS — GENERATOR ENTRY POINT
   The topic picker + press (print flow) and the card editor.
   The library page (read-only practice) is a separate page.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { enhanceSelects } from '/utils/components/pp-select.js';
import { initTopicPicker } from './topic-picker.js';
import { initPress } from './press.js';
import { initCardEditor, renderEditDecks, openEditor } from './card-editor.js';

initTopicPicker({});
initCardEditor();
initPress({ onPrinted: (deck) => openEditor(deck.deckId) });
enhanceSelects(document.querySelector('.press-form'));

auth.onAuthStateChanged((user) => {
  if (user) renderEditDecks();
});
