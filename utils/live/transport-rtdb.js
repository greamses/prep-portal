/* ============================================================================
   LIVE — the same contract over Firebase's Realtime Database
   ----------------------------------------------------------------------------
   RTDB and not Firestore, and the reason is arithmetic rather than taste: one
   class of thirty, writing once every 400ms for a forty-minute lesson, is
   about 180,000 writes. Firestore's free tier stops at 20,000 a day — a single
   lesson would blow through it nine times over. RTDB is not write-capped; it
   caps SIMULTANEOUS CONNECTIONS at 100, which is about three classes at once,
   and 10 GB a month of traffic, which at these payload sizes is thousands of
   lessons.

   It also brings onDisconnect, which is the fiddliest part of presence and the
   main reason not to hand-roll this on a socket: a tab that is closed, or a
   laptop lid that is shut on a train, takes its owner out of the room without
   anyone having to notice.

   BEFORE THIS WORKS someone has to create the database — see docs/live.md.
   Until then `transport-memory` is the default and everything above this file
   carries on regardless.
   ========================================================================== */

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getDatabase, ref, child, onValue, off, set, update, onDisconnect,
} from "firebase/database";

/* The same project every other page uses. `databaseURL` is the one field the
   other copies of this config do not carry, because nothing else needed it. */
const FIREBASE = {
  apiKey: "AIzaSyA2N3uI_XfSIVsto2Ku1g_qSezmD3qFmbk",
  authDomain: "prep-portal-2026.firebaseapp.com",
  databaseURL: "https://prep-portal-2026-default-rtdb.firebaseio.com",
  projectId: "prep-portal-2026",
  storageBucket: "prep-portal-2026.firebasestorage.app",
  messagingSenderId: "837672918701",
  appId: "1:837672918701:web:c0e40bcae21c3ec4e23024",
};

/**
 * A transport over the Realtime Database.
 *
 *   url   the database to talk to, if it is not the project's default one —
 *         a database made outside the United States gets its own hostname,
 *         and the console will tell you what it is
 */
export function rtdbTransport({ url = null } = {}) {
  const app = getApps().length ? getApp() : initializeApp(FIREBASE);
  const db = getDatabase(app, url || FIREBASE.databaseURL);

  let base = null;
  const watching = [];      // [ref, cb] so they can all be taken off at the end

  return {
    open(path) {
      base = ref(db, path);
      return Promise.resolve();
    },

    watch(sub, cb) {
      const node = child(base, sub);
      const handler = onValue(node, (snap) => cb(snap.val()));
      watching.push([node, handler]);
      return () => off(node, "value", handler);
    },

    write(sub, value) {
      return set(child(base, sub), value);
    },

    merge(sub, patch) {
      /* update() merges at the top level of the node, which is what "patch"
         means here: a patch of { answers: {...} } replaces `answers` whole and
         leaves its siblings alone. Anything wanting to merge INSIDE answers
         patches "state/answers" instead. */
      return update(child(base, sub), patch);
    },

    clearOnLeave(sub) {
      /* The whole reason for RTDB over a socket of our own: the server takes
         this out when the connection drops, whether the tab was closed, the
         laptop shut, or the train went into a tunnel. */
      return onDisconnect(child(base, sub)).remove();
    },

    close() {
      watching.forEach(([node, handler]) => {
        try { off(node, "value", handler); } catch { /* already gone */ }
      });
      watching.length = 0;
      base = null;
    },
  };
}
