/* ============================================================================
   LIVE — the one door in
   ----------------------------------------------------------------------------
   Pages ask for a room here rather than choosing a transport themselves, so
   that switching the whole site from one to the other is a single line.

   RIGHT NOW IT IS THE MEMORY TRANSPORT, because the project has no Realtime
   Database yet — there is no databaseURL in the Firebase config and nothing to
   connect to. Everything below joins a room, keeps presence, merges state and
   throttles its writes exactly as it will when the database exists; what it
   does not do is reach another device.

   To turn it on: make the database (docs/live.md has the three steps), then
   set LIVE_READY to true. Nothing else changes.
   ========================================================================== */

import { joinRoom } from "./room.js";

/** Flip to true once the Realtime Database exists. See docs/live.md. */
export const LIVE_READY = false;

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
