/* ============================================================================
   LIVE — the same contract over Firebase's Realtime Database
   ----------------------------------------------------------------------------
   RTDB and not Firestore, and the reason is arithmetic rather than taste: one
   class of thirty, writing once every 400ms for a forty-minute lesson, is
   about 180,000 writes. Firestore's free tier stops at 20,000 a day — a single
   lesson would blow through it nine times over. RTDB is not write-capped; it
   caps SIMULTANEOUS CONNECTIONS at 100, which is about three classes at once,
   and 10 GB a month of TRAFFIC — and traffic, not reads, is what this file has
   to be careful with. A class of thirty, a forty-minute lesson, each child
   filling a box every ten seconds: listening per child (watchEach, below) that
   is about 25 MB, or some 400 lessons a month. Listening to the whole node it
   is about 740 MB, and 13. Flat out at the 400ms throttle the same two are
   618 MB and 18 GB — 16 lessons against none.

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
  onChildAdded, onChildChanged, onChildRemoved,
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

    /* The one that matters for the bill.
    
       RTDB charges for BANDWIDTH, not for reads, and onValue on a node sends
       the WHOLE node every time any part of it changes. Thirty children in one
       room, each saying where they are up to, and every one of those messages
       carries all thirty slots to all thirty tabs: the traffic goes up with the
       square of the class. At our payloads that is about 740 MB for a
       forty-minute lesson — 13 lessons a month before the free 10 GB is gone.

       Listening to the CHILDREN sends only the slot that moved. The same
       lesson is about 25 MB, which is some 400 lessons a month. The view the
       caller gets is identical; what changes is what came down the wire to
       build it. (The figures are worked in the live check, scratchpad
       live.mjs, at both the real rate and the throttle ceiling.)

       The callback is coalesced to a microtask because attaching fires
       onChildAdded once per child that is already there — one render for the
       roomful, not one per person. */
    watchEach(sub, cb) {
      const node = child(base, sub);
      const seen = new Map();
      let queued = false;
      const tell = () => {
        if (queued) return;
        queued = true;
        queueMicrotask(() => { queued = false; cb(Object.fromEntries(seen)); });
      };
      const put = (snap) => { seen.set(snap.key, snap.val()); tell(); };
      const drop = (snap) => { seen.delete(snap.key); tell(); };

      const offs = [
        onChildAdded(node, put),
        onChildChanged(node, put),
        onChildRemoved(node, drop),
      ];
      /* an empty room must still say so, once */
      tell();

      const stop = () => offs.forEach((o) => { try { o(); } catch { /* gone */ } });
      watching.push([node, null, stop]);
      return stop;
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
      watching.forEach(([node, handler, stop]) => {
        try { stop ? stop() : off(node, "value", handler); } catch { /* already gone */ }
      });
      watching.length = 0;
      base = null;
    },
  };
}
