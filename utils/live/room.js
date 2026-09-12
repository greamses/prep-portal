/* ============================================================================
   LIVE — one room, three channels
   ----------------------------------------------------------------------------
   Everything on this site that wants to be live wants one of three things, and
   they cost wildly different amounts, so they are kept apart:

     PRESENCE   who is here, what they are on, where their cursor is. Changes
                constantly, matters for seconds, and must clean itself up when
                a tab closes — nobody should linger in a room they have left.
     STATE      the work itself: answers typed, cards moved, a score. Merged,
                survives a refresh, and is the only channel worth keeping.
     SEND/ON    a shout: "I ticked question 3". Never stored, never replayed.

   The transport is handed in, and there are two. `transport-memory` is real
   and works today — one browser tab, or a test — and `transport-rtdb` is the
   same contract over Firebase's Realtime Database. NOT Firestore: a class of
   thirty writing once every two seconds for forty minutes is 36,000 writes,
   and Firestore's free tier stops at 20,000 a day. RTDB is not write-capped;
   what it caps is simultaneous connections, which is about three classes at
   once before the free tier runs out.

   Every write is THROTTLED here rather than at the listener. Throttling what
   goes out is the only throttling that saves anything.
   ========================================================================== */

/**
 * A transport is four functions and a close:
 *
 *   watch(sub, cb) → stop      cb(value) whenever `sub` changes, and once now
 *   write(sub, value)          replace what is at `sub`
 *   merge(sub, patch)          merge fields into what is at `sub`
 *   clearOnLeave(sub)          delete `sub` when this client goes away
 *   close()                    let everything go
 *
 * `sub` is a path inside the room, like "state" or "presence/abc".
 */

const DEFAULT_THROTTLE = 400;   // ms between writes on a channel

/** A name for this tab, when the caller has not given one. */
function someoneId() {
  return `p${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Coalesce writes: gather what is asked for, send at most one every `every`
 * milliseconds, and never lose the last one.
 */
function throttled(every, send) {
  let pending = null;
  let timer = null;
  let last = 0;

  const flush = () => {
    timer = null;
    if (pending === null) return;
    const payload = pending;
    pending = null;
    last = Date.now();
    send(payload);
  };

  return {
    put(patch, { merge = true } = {}) {
      pending = merge && pending ? { ...pending, ...patch } : patch;
      if (timer) return;
      const wait = Math.max(0, every - (Date.now() - last));
      timer = setTimeout(flush, wait);
    },
    /** Send whatever is waiting, now — for leaving, and for tests. */
    flush() {
      if (timer) { clearTimeout(timer); timer = null; }
      flush();
    },
    get waiting() { return pending !== null; },
  };
}

/**
 * Join a room.
 *
 *   ns         what kind of thing this is — "maths-workbook", "number-match"
 *   code       which room; a workbook's assignment code, say
 *   role       "student" | "teacher" | "peer" — carried in presence, and the
 *              rules use it to decide who may write what
 *   me         { id, name, colour } — id defaults to a name for this tab
 *   transport  how it talks; memory by default, so this always does something
 *   throttle   ms between writes on any one channel
 *
 * → { id, me, presence, state, send, on, leave }
 */
export async function joinRoom({
  ns,
  code,
  role = "peer",
  me = null,
  transport = null,
  throttle = DEFAULT_THROTTLE,
} = {}) {
  if (!ns || !code) throw new Error("a room needs a ns and a code");

  const who = {
    id: me?.id || someoneId(),
    name: me?.name || "Someone",
    colour: me?.colour || null,
    role,
  };

  const bus = transport || (await import("./transport-memory.js")).memoryTransport();
  await bus.open?.(`live/${ns}/${code}`);

  const stops = [];
  let gone = false;

  /* ── presence ──────────────────────────────────────────────────────────
     Mine is at presence/<id> and goes when I do. Everyone's arrives as a
     list, me included: a teacher watching wants to see themselves in the
     room, and a caller who does not can filter on id. */
  const presencePath = `presence/${who.id}`;
  bus.clearOnLeave?.(presencePath);

  const presenceOut = throttled(throttle, (value) => {
    if (gone) return;
    /* `seen`, not `at`: the caller's own fields go in here beside ours, and a
       student saying they are AT question 3 had that rubbed out by a
       millisecond stamp sharing the name. Ours are id, name, colour, role and
       seen; everything else in here belongs to whoever called. */
    bus.write(presencePath, { ...value, ...who, seen: Date.now() });
  });

  /* ── state ─────────────────────────────────────────────────────────────
     Merged, not replaced: two people working on one room must not rub each
     other out, and a patch of { answers: { q3: "56" } } should leave q2 be. */
  const stateOut = throttled(throttle, (patch) => {
    if (gone) return;
    bus.merge("state", patch);
  });

  /* ── shouts ────────────────────────────────────────────────────────────
     One slot per person per event, rather than a list nobody empties: a
     cursor is only ever worth its latest value, and a list of them is a
     bill for storage that grows while somebody waggles a mouse. */
  const shouts = new Map();     // event → throttled sender

  const on = (channel, cb) => {
    let stop;
    if (channel === "presence") {
      stop = bus.watch("presence", (all) => {
        cb(Object.values(all || {}).filter(Boolean));
      });
    } else if (channel === "state") {
      stop = bus.watch("state", (value) => cb(value || {}));
    } else {
      /* A shout is { at, payload } per person. `at` is what makes a repeat of
         the same value still count as a new shout. */
      const heard = new Map();
      let arriving = true;
      stop = bus.watch(`wire/${channel}`, (all) => {
        for (const [id, entry] of Object.entries(all || {})) {
          if (!entry || id === who.id) continue;       // never hear yourself
          if (heard.get(id) === entry.at) continue;    // already heard
          heard.set(id, entry.at);
          /* Whatever is already in the room when you walk in is NOT a shout at
             you: a shout is transient by definition, and replaying the last
             cursor position to every latecomer is how "transient" quietly
             becomes "state". Note it as heard, and say nothing. */
          if (arriving) continue;
          cb(entry.payload, id);
        }
        arriving = false;
      });
    }
    stops.push(stop);
    return stop;
  };

  return {
    ns,
    code,
    id: who.id,
    me: who,

    presence: {
      /** Say where I am. Throttled; the last word always gets out. */
      set: (value = {}) => presenceOut.put(value),
      flush: () => presenceOut.flush(),
    },

    state: {
      /** Merge these fields into the room's state. */
      patch: (fields) => stateOut.put(fields),
      /** Send what is waiting now — before navigating away, say. */
      flush: () => stateOut.flush(),
    },

    /** Shout something transient. Never stored, never replayed to a latecomer. */
    send(channel, payload) {
      let out = shouts.get(channel);
      if (!out) {
        out = throttled(throttle, (value) => {
          if (gone) return;
          bus.write(`wire/${channel}/${who.id}`, { at: Date.now(), payload: value });
        });
        shouts.set(channel, out);
        bus.clearOnLeave?.(`wire/${channel}/${who.id}`);
      }
      out.put(payload, { merge: false });
    },

    on,

    /** Leave: say the last word, stop listening, and take myself out. */
    async leave() {
      if (gone) return;
      presenceOut.flush();
      stateOut.flush();
      shouts.forEach((s) => s.flush());
      gone = true;
      stops.forEach((stop) => { try { stop?.(); } catch { /* already gone */ } });
      try { await bus.write(presencePath, null); } catch { /* already gone */ }
      for (const channel of shouts.keys()) {
        try { await bus.write(`wire/${channel}/${who.id}`, null); } catch { /* the same */ }
      }
      bus.close?.();
    },
  };
}
