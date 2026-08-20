/* ============================================================================
   Manipulatives — snapping: to the squares, and to a side
   ----------------------------------------------------------------------------
   Most of the canvas is on the grid and cannot be anywhere else: a block moves
   a whole cell at a time because a block IS a whole number of unit cubes. The
   algebra tiles are the exception — x is not a whole number of squares, so they
   move freely, and freely means a hair of daylight between two pieces that were
   meant to touch.

   That is what these two are for, and they are deliberately separate:

   SQUARES  puts a piece down on the paper's own ruling — whole cells, the way
            everything else lands. Straightens a row of unit tiles at a stroke,
            and is no use at all to an x-tile, which is 4.6 cells long.
   FLUSH    puts a piece down against the piece already there: an edge within
            reach of another edge is pulled level with it, so a rectangle built
            out of tiles CLOSES instead of very nearly closing.

   Flush wins where it finds something, because it is the more particular
   answer: it is about this piece and that one, not about the paper.

   Both work the same way in the third dimension, once a piece has been lifted
   off the paper — squares to whole units of height, flush onto the top of
   whatever it is being stacked on.
   ========================================================================== */

import { store } from "./state.js";
import { footprint, standing } from "./layout.js";

/* How near an edge has to come before it catches, in world units. Under half a
   cell on purpose: any more and the two kinds of snapping would fight over the
   same gap, because a whole cell is never more than half a cell away. */
export const TOL = 0.45;

/** The box a thing fills — on the paper and above it — with a move applied. */
export function boxOf(b, dx = 0, dz = 0, dy = null) {
  const f = footprint(b);
  const y0 = dy == null ? (b.y || 0) : dy;
  return {
    x0: b.x + dx, x1: b.x + dx + f.l,
    z0: b.z + dz, z1: b.z + dz + f.w,
    y0, y1: y0 + standing(b).h,
  };
}

/** The box round a whole group of things. */
function groupBox(list, dx = 0, dz = 0, dy = null) {
  let g = null;
  for (const b of list) {
    const o = boxOf(b, dx, dz, dy == null ? null : (b.y || 0) + dy);
    if (!g) { g = { ...o }; continue; }
    g.x0 = Math.min(g.x0, o.x0); g.x1 = Math.max(g.x1, o.x1);
    g.z0 = Math.min(g.z0, o.z0); g.z1 = Math.max(g.z1, o.z1);
    g.y0 = Math.min(g.y0, o.y0); g.y1 = Math.max(g.y1, o.y1);
  }
  return g;
}

/* Two spans are beside each other if they overlap at all, or all but touch. A
   piece across the canvas must not tug at an edge it is nowhere near. */
const near = (a0, a1, b0, b1) => a0 < b1 + TOL && b0 < a1 + TOL;

/** Keep the smallest correction that is within reach, or nothing. */
function best(cur, candidates) {
  let out = cur;
  for (const c of candidates) {
    if (Math.abs(c) > TOL) continue;
    if (out == null || Math.abs(c) < Math.abs(out)) out = c;
  }
  return out;
}

/**
 * Where a move should really land.
 *
 * Given what is moving, the move it is asking for and everything it might land
 * against, this returns the move with the snap folded in. The two axes are
 * settled SEPARATELY — a tile pushed up against another one along its left edge
 * should still slide freely up and down that edge, which is exactly how you
 * build a row.
 */
export function snapMove(moving, dx, dz, others) {
  const { grid, side } = store.snap;
  if (!grid && !side) return { dx, dz, caught: false };

  const g = groupBox(moving, dx, dz);
  if (!g) return { dx, dz, caught: false };
  let ax = null;
  let az = null;

  if (side) {
    for (const o of others) {
      const b = boxOf(o);
      // a piece up in the air does not line up with one lying on the paper
      if (!near(g.y0, g.y1, b.y0, b.y1)) continue;
      /* Butt up against it, or line up with it: the far edge to our near one,
         our far edge to its near one, or the two left (or two right) edges
         level, which is how a stack of pieces stays a stack. */
      if (near(g.z0, g.z1, b.z0, b.z1)) {
        ax = best(ax, [b.x1 - g.x0, b.x0 - g.x1, b.x0 - g.x0, b.x1 - g.x1]);
      }
      if (near(g.x0, g.x1, b.x0, b.x1)) {
        az = best(az, [b.z1 - g.z0, b.z0 - g.z1, b.z0 - g.z0, b.z1 - g.z1]);
      }
    }
  }

  const caught = ax != null || az != null;

  if (grid) {
    if (ax == null) ax = Math.round(g.x0) - g.x0;
    if (az == null) az = Math.round(g.z0) - g.z0;
  }

  return { dx: dx + (ax || 0), dz: dz + (az || 0), caught };
}

/**
 * Where a lift should really land.
 *
 * `want` is the height being asked for, for the group as a whole. Flush stacks
 * the group on top of whatever it is over (or drops it back onto the paper);
 * squares puts it at a whole number of units. Nothing ever goes below the paper.
 */
export function snapLift(moving, want, others) {
  const { grid, side } = store.snap;
  const y = Math.max(0, want);
  if (!grid && !side) return y;

  const g = groupBox(moving, 0, 0);
  if (!g) return y;
  const height = g.y1 - g.y0;
  let put = null;

  if (side) {
    /* The paper is a surface like any other, so it is in the running: a piece
       lowered to within reach of the paper lands ON it rather than a hair
       above it. */
    put = best(put, [0 - y]);
    for (const o of others) {
      const b = boxOf(o);
      if (!near(g.x0, g.x1, b.x0, b.x1)) continue;
      if (!near(g.z0, g.z1, b.z0, b.z1)) continue;
      put = best(put, [b.y1 - y, b.y0 - height - y]);
    }
  }
  if (put == null && grid) put = Math.round(y) - y;

  return Math.max(0, y + (put || 0));
}

/** Everything a moving group could land against — itself excepted. */
export function othersThan(moving) {
  const ids = new Set(moving.map((b) => b.id));
  return store.blocks.concat(store.things).filter((b) => !ids.has(b.id));
}
