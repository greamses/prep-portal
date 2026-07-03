/* ═══════════════════════════════════════════════════════
   RECALL PRESS — CREATOR-ONLY GUARD (generator page)
   Only teachers/admins print new decks; everyone else (students,
   parents, logged-out visitors) is sent to the library instead.
   Self-contained veil so the form never flashes before the role
   check resolves — mirrors /utils/auth/premium-guard.js.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { watchProfile } from '/utils/data-service.js';

const veil = (() => {
  const dark =
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  const el = document.createElement('div');
  el.id = 'creator-veil';
  el.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;' +
    'justify-content:center;font:600 14px/1.5 system-ui,-apple-system,sans-serif;' +
    (dark ? 'background:#1a1815;color:#cfc8bd;' : 'background:#fffdf8;color:#6b655c;');
  el.textContent = 'Checking access…';
  (document.body || document.documentElement).appendChild(el);
  return el;
})();
const reveal = () => veil.remove();
const toLibrary = () => location.replace('/flashcards/library.html');

// Never trap a real creator behind the veil if the profile read stalls.
let settled = false;
const veilTimeout = setTimeout(() => {
  settled = true;
  reveal();
}, 6000);

auth.onAuthStateChanged((user) => {
  if (settled) return;
  if (!user) {
    settled = true;
    clearTimeout(veilTimeout);
    return toLibrary();
  }
  watchProfile(user.uid, (data) => {
    if (settled) return;
    settled = true;
    clearTimeout(veilTimeout);
    const isCreator = data?.role === 'teacher' || data?.role === 'admin';
    if (isCreator) reveal();
    else toLibrary();
  });
});
