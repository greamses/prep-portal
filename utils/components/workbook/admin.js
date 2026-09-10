/* ============================================================================
   PRINTABLE WORKBOOK — is this the admin?
   ----------------------------------------------------------------------------
   One question, asked so a control can be revealed rather than hidden: the
   watermark switch. Everyone's paper carries the mark; only the person whose
   mark it is may take it off.

   THE SWITCH IS REVEALED, NOT ENABLED. It starts absent from the DOM's flow —
   `hidden` on the row — and is shown when the signed-in account matches. A
   control that is present but disabled is an invitation to try, and a
   client-side check is not a lock: it is a tidy-up. The print pass is the
   thing with a lock on it, and that lock is on the server (print-pass.js).

   If Firebase is slow, or blocked, or the user is signed out, the switch
   simply never appears and the paper keeps its mark — which is the right way
   round for a default to fail.
   ========================================================================== */

import { onUser } from "./account.js";

const ADMIN_EMAIL = "eemadanyel@gmail.com";

/**
 * Calls back with true once, if and when the designated admin is signed in.
 * Never calls back with false: there is nothing to undo.
 */
export function onAdmin(fn) {
  let done = false;
  onUser((user) => {
    if (done || !user || user.email !== ADMIN_EMAIL) return;
    done = true;
    fn();
  });
}
