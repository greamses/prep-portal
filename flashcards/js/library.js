/* ═══════════════════════════════════════════════════════
   RECALL PRESS — LIBRARY ENTRY POINT
   The shelf (deck grid + Leitner drawers) and the review session.
   Everyone can browse and study here; only teachers/admins get the
   "Print a New Deck" link through to the generator (./index.html).
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { watchProfile } from '/utils/data-service.js';
import { initReview, renderDecks } from './review.js';

const newDeckLink = document.getElementById('library-new-deck');

initReview();

auth.onAuthStateChanged((user) => {
  if (!user) return;
  renderDecks();
  watchProfile(user.uid, (data) => {
    if (!newDeckLink) return;
    newDeckLink.hidden = !(data?.role === 'teacher' || data?.role === 'admin');
  });
});
