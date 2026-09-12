/* ============================================================================
   LIVE — the transport that needs nothing
   ----------------------------------------------------------------------------
   One store in this page's memory. Two rooms opened on the same path in the
   same page talk to each other, which makes it real for two things:

     · a test — two clients, one process, no network, no credentials;
     · one device — a board on a table with two children round it, where
       "collaboration" is two views of the same canvas and nothing has to leave
       the machine at all.

   It is the same contract as transport-rtdb, so nothing above it knows or
   cares which one it got.
   ========================================================================== */

/* Every room ever opened in this page, by path. Shared on purpose: that
   sharing IS the transport. */
const ROOMS = new Map();

function roomAt(path) {
  let room = ROOMS.get(path);
  if (!room) {
    room = { data: {}, watchers: new Map() };
    ROOMS.set(path, room);
  }
  return room;
}

/** Read a "a/b/c" path out of a plain object. */
function at(obj, sub) {
  return sub.split("/").reduce((o, k) => (o == null ? o : o[k]), obj);
}

/** Write into a "a/b/c" path, making the way as it goes. null removes. */
function put(obj, sub, value) {
  const keys = sub.split("/");
  const last = keys.pop();
  let node = obj;
  for (const k of keys) {
    if (typeof node[k] !== "object" || node[k] === null) node[k] = {};
    node = node[k];
  }
  if (value === null || value === undefined) delete node[last];
  else node[last] = value;
}

/** Everything that should hear about a change at `sub`. */
function tell(room, sub) {
  for (const [path, subs] of room.watchers) {
    /* A watcher hears about its own path and anything under it — a watcher on
       "presence" hears a write to "presence/abc". */
    if (sub === path || sub.startsWith(path + "/") || path.startsWith(sub + "/")) {
      const value = at(room.data, path) ?? null;
      subs.forEach((cb) => { try { cb(value); } catch { /* a bad listener is not our problem */ } });
    }
  }
}

/**
 * A transport backed by this page's memory.
 *
 * `open(path)` is what ties one to a room; two transports opened on the same
 * path share a store, which is how two clients in one test find each other.
 */
export function memoryTransport() {
  let room = null;
  const mine = [];          // paths to clear when this client goes
  const watching = [];      // [path, cb] so they can be taken off

  return {
    open(path) {
      room = roomAt(path);
      return Promise.resolve();
    },

    watch(sub, cb) {
      if (!room) return () => {};
      if (!room.watchers.has(sub)) room.watchers.set(sub, new Set());
      room.watchers.get(sub).add(cb);
      watching.push([sub, cb]);
      /* the first call is what is there now, so a latecomer is not blind */
      try { cb(at(room.data, sub) ?? null); } catch { /* as above */ }
      return () => {
        room.watchers.get(sub)?.delete(cb);
      };
    },

    write(sub, value) {
      if (!room) return Promise.resolve();
      put(room.data, sub, value);
      tell(room, sub);
      return Promise.resolve();
    },

    merge(sub, patch) {
      if (!room) return Promise.resolve();
      const was = at(room.data, sub);
      put(room.data, sub, { ...(was && typeof was === "object" ? was : {}), ...patch });
      tell(room, sub);
      return Promise.resolve();
    },

    clearOnLeave(sub) {
      mine.push(sub);
    },

    close() {
      if (!room) return;
      /* what a real disconnect would do for us */
      mine.forEach((sub) => { put(room.data, sub, null); tell(room, sub); });
      mine.length = 0;
      watching.forEach(([sub, cb]) => room.watchers.get(sub)?.delete(cb));
      watching.length = 0;
      room = null;
    },
  };
}

/** For tests: forget every room, so one test cannot colour the next. */
export function forgetRooms() {
  ROOMS.clear();
}
