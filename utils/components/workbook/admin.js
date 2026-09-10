/* ============================================================================
   PRINTABLE WORKBOOK — is this the admin?
   ----------------------------------------------------------------------------
   One question, asked so a control can be revealed rather than hidden: the
   watermark switch. Everyone's paper carries the mark; only the person whose
   mark it is may take it off.

   THE SWITCH IS REVEALED, NOT ENABLED. It starts absent from the DOM's flow —
   `hidden` on the row — and is shown when the signed-in account matches. A
   control that is present but disabled is an invitation to try, and a
   client-side check is not a lock: it is a tidy-up. Nothing here is a security
   boundary and nothing needs to be, because the worst a determined stranger
   can do is print their own copy without a logo on it.

   SELF-CONTAINED, like premium-guard.js: full gstatic URLs rather than bare
   specifiers, so a page without an import map still works, and every failure
   is swallowed. If Firebase is slow, or blocked, or the user is signed out,
   the switch simply never appears and the paper keeps its mark — which is the
   right way round for a default to fail.
   ========================================================================== */

const ADMIN_EMAIL = "eemadanyel@gmail.com";

/**
 * Calls back with true once, if and when the designated admin is signed in.
 * Never calls back with false: there is nothing to undo.
 */
export function onAdmin(fn) {
  let done = false;
  (async () => {
    try {
      const [{ initializeApp, getApps, getApp }, { getAuth, onAuthStateChanged }] =
        await Promise.all([
          import("https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js"),
          import("https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js"),
        ]);
      const app = getApps().length
        ? getApp()
        : initializeApp({
            apiKey: "AIzaSyA2N3uI_XfSIVsto2Ku1g_qSezmD3qFmbk",
            authDomain: "prep-portal-2026.firebaseapp.com",
            projectId: "prep-portal-2026",
            storageBucket: "prep-portal-2026.firebasestorage.app",
            messagingSenderId: "837672918701",
            appId: "1:837672918701:web:c0e40bcae21c3ec4e23024",
          });
      onAuthStateChanged(getAuth(app), (user) => {
        if (done || !user || user.email !== ADMIN_EMAIL) return;
        done = true;
        fn();
      });
    } catch {
      /* No Firebase, no switch, and the mark stays on. */
    }
  })();
}
