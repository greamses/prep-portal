/* ════════════════════════════════════════
   main.js — entry point
════════════════════════════════════════ */
import { initGeminiKey, initYTKey, clearKeysOnUnload } from './js/keys.js';
import { initSetupForm, rebuildSlots, checkReady } from './js/setup-form.js';
import { initModal } from './js/modal.js';
import { initTeacherAssign } from './js/teacher-assign.js';
import { auth } from '/firebase-init.js';

/* Expose auth-token getter so TheoryAnalyser (global IIFE) can
   authenticate backend Gemini proxy calls without being an ES module. */
window._getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to use AI features.');
  return user.getIdToken();
};

initGeminiKey();
initYTKey();
clearKeysOnUnload();
initSetupForm();
initModal();
initTeacherAssign();
rebuildSlots();
checkReady();
