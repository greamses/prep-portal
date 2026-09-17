/* ============================================================================
   LIVE — the one door in
   ----------------------------------------------------------------------------
   Pages ask for a room here rather than choosing a transport themselves, so
   that switching the whole site from one to the other is a single line.

   IT IS ON (2026-09-16). The Realtime Database exists, in europe-west1, and is
   running the rules in database.rules.json. A page that joins a room talks to
   it — presence, state and shouts reach other devices.

   The memory transport is still the fallback, and still does something real:
   a page whose import map has no firebase/database, or a browser that cannot
   reach Firebase, keeps working with everyone in that one tab rather than
   throwing. Set LIVE_READY back to false to put the whole site on it.
   ========================================================================== */

import { joinRoom } from "./room.js";

/** Flip to true once the Realtime Database exists. See docs/live.md. */
export const LIVE_READY = true;

/**
 * A room, on the best transport this site can currently reach.
 *
 * The RTDB transport is imported only when it is going to be used: it pulls in
 * firebase/database, which is not in most pages' import maps, and a page that
 * is not live should not fail to load over a module it never needed.
 */
export async function openRoom({ ns, code, role = "peer", me = null } = {}) {
  let transport = null;
  if (LIVE_READY) {
    try {
      const { rtdbTransport } = await import("./transport-rtdb.js");
      transport = rtdbTransport();
    } catch (err) {
      /* No database, or firebase/database missing from the import map. Say so
         once — quietly, because a workbook must still work — and carry on with
         the transport that needs nothing. */
      console.warn("[live] falling back to the memory transport:", err?.message || err);
    }
  }
  if (!transport) {
    const { memoryTransport } = await import("./transport-memory.js");
    transport = memoryTransport();
  }
  return joinRoom({ ns, code, role, me, transport });
}

/**
 * An id that satisfies the database rules: presence and shouts may only be
 * written by their owner, which is enforced by the KEY beginning with the uid.
 * A tab suffix keeps one person in two tabs from fighting over one slot.
 */
export function idFor(uid) {
  const tab = Math.random().toString(36).slice(2, 6);
  return uid ? `${uid}:${tab}` : `anon${tab}`;
}
