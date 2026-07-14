/* ═══════════════════════════════════════════════════════
   PUZZLES — seeded PRNG
   Shared by every puzzle engine (sudoku.js, slider.js, ...) — same
   primitives as Drills' rng.js. A room's `seed` plus these two functions
   is all any client needs to compute an identical puzzle locally, with
   zero network sync.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS, BOT_NS } from '/utils/games/rng.js';

export { mulberry32, hashSeed, BOT_NS };

// The seeded-room primitives are shared by every game (see /utils/games/rng.js):
// one seed, one identical round on every client, with nothing synced.

