/* ═══════════════════════════════════════════════════════
   SETUP MEMORY — "remember my setup" for the multiplayer games
   (Drills / Puzzles / Vocab / Geometry).

   Every pick a player makes on a setup screen is saved as they make it, so
   the next visit starts from their last game instead of the factory
   defaults. Fields that mean the same thing in every game (how to play,
   room size, how to join) live in ONE shared store so setting them once in
   any game sets them everywhere; everything else (subject, grid size,
   difficulty…) is per-game. Time limits are deliberately per-game — the
   games offer different lists, so a value that's valid in one is not in
   another.

   Restores are always validated by the caller through `get(field,
   fallback, allowed)` — a saved value that no longer exists (a removed
   topic, a renamed option) silently falls back rather than wedging the
   setup. Once a player actually STARTS a round the game marks the setup
   `done`; on the next visit `isReturning()` lets the page jump straight to
   the last section, with every previous pick shown as recap chips (each
   one clickable to change).
═══════════════════════════════════════════════════════ */

const SHARED_KEY = 'ppGameSetup:shared';
const SHARED_FIELDS = new Set(['mode', 'roomSize', 'roomAction']);

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function write(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch { /* private mode etc. — settings just don't persist */ }
}

export function createSetupMemory(game) {
  const gameKey = `ppGameSetup:${game}`;
  const own = read(gameKey);
  const shared = read(SHARED_KEY);

  return {
    // Restore one field. `allowed` is an array of valid values or a
    // predicate; a missing or no-longer-valid saved value yields `fallback`.
    get(field, fallback, allowed) {
      const source = SHARED_FIELDS.has(field) ? shared : own;
      const v = source[field];
      if (v === undefined || v === null) return fallback;
      if (Array.isArray(allowed)) return allowed.includes(v) ? v : fallback;
      if (typeof allowed === 'function') return allowed(v) ? v : fallback;
      return v;
    },

    // Persist a patch of fields. Shared fields route to the cross-game
    // store, the rest to this game's own.
    save(patch) {
      let ownDirty = false;
      let sharedDirty = false;
      for (const [k, v] of Object.entries(patch)) {
        if (SHARED_FIELDS.has(k)) { shared[k] = v; sharedDirty = true; }
        else { own[k] = v; ownDirty = true; }
      }
      if (ownDirty) write(gameKey, own);
      if (sharedDirty) write(SHARED_KEY, shared);
    },

    // True once this game has started a round with a saved setup — the cue
    // to skip ahead to the final section on the next visit.
    isReturning: () => !!own.done,
  };
}
