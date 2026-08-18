/* ============================================================================
   Manipulatives — where a thing lands on the canvas
   ----------------------------------------------------------------------------
   The canvas has no edges. Cells are integers on an unbounded plane (negatives
   included) and the occupancy map is a sparse Set of "x,z" keys, so an empty
   canvas costs nothing however far you wander across it.

   Because there is always more paper, placement cannot fail: findSpot walks
   rings outward from where you wanted the thing and takes the first fit.
   ========================================================================== */

import { CFG } from "./config.js";

const key = (x, z) => x + "," + z;

/**
 * The cells a thing actually stands on.
 *
 * `l` and `w` are what a thing IS — a rod is ten by one however it is lying —
 * but a thing turned off the square covers a bigger square patch of paper than
 * that, and the occupancy grid is axis-aligned. So the footprint is the upright
 * box around the turned rectangle, which at a right angle is just `l` and `w`
 * swapped and in between is larger than either.
 */
export function footprint(item) {
  const a = item.angle || 0;
  if (!a) return { l: item.l, w: item.w };
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  // a hair off before rounding up, so a right angle comes out exact rather than
  // gaining a cell to a cosine that is 1e-17 shy of zero
  return {
    l: Math.max(1, Math.ceil(item.l * c + item.w * s - 1e-9)),
    w: Math.max(1, Math.ceil(item.l * s + item.w * c - 1e-9)),
  };
}

export function occupancy(items, skip = null) {
  const grid = new Set();
  for (const b of items) {
    if (skip && skip.has(b.id)) continue;
    const f = footprint(b);
    mark(grid, b.x, b.z, f.l, f.w);
  }
  return grid;
}

export function fits(grid, x, z, l, w, pad = 0) {
  for (let zz = z - pad; zz < z + w + pad; zz++) {
    for (let xx = x - pad; xx < x + l + pad; xx++) {
      if (grid.has(key(xx, zz))) return false;
    }
  }
  return true;
}

export function mark(grid, x, z, l, w) {
  for (let zz = z; zz < z + w; zz++) {
    for (let xx = x; xx < x + l; xx++) grid.add(key(xx, zz));
  }
}

export function unmark(grid, x, z, l, w) {
  for (let zz = z; zz < z + w; zz++) {
    for (let xx = x; xx < x + l; xx++) grid.delete(key(xx, zz));
  }
}

/**
 * The nearest free l×w rectangle to `near`, searched in rings so split pieces
 * settle beside the block they came from. Rings rather than a full scan: the
 * plane is unbounded, so there is nothing to scan to the end of.
 */
export function findSpot(grid, l, w, near = null) {
  const pad = CFG.gap;
  const cx = near ? Math.round(near.x) : 0;
  const cz = near ? Math.round(near.z) : 0;
  if (fits(grid, cx, cz, l, w, pad)) return { x: cx, z: cz };

  /* Rings are squares, so the first fit found while walking one is usually a
     corner — take the whole ring and keep the nearest fit instead, or pieces
     land strung out on the diagonal. */
  for (let r = 1; r <= CFG.searchRings; r++) {
    let best = null;
    let bestD = Infinity;
    for (let d = -r; d <= r; d++) {
      for (const c of [
        { x: cx + d, z: cz - r },
        { x: cx + d, z: cz + r },
        { x: cx - r, z: cz + d },
        { x: cx + r, z: cz + d },
      ]) {
        const dist = (c.x - cx) * (c.x - cx) + (c.z - cz) * (c.z - cz);
        if (dist >= bestD) continue;
        if (fits(grid, c.x, c.z, l, w, pad)) { best = c; bestD = dist; }
      }
    }
    if (best) return best;
  }
  return null; // only if the canvas is somehow full for CFG.searchRings cells
}

/* ── how the canvas is set out ────────────────────────────────────────────── */

/* POSITIVE z is up the screen on this canvas — measured by projecting a point
   at z −20 and one at z +20 and comparing their screen y, not reasoned about.
   The camera looks down the paper from just off the −z axis, so it is easy to
   talk yourself into the opposite and the algebra reads fine either way. */
const UP = 1;

/**
 * The order blocks are read in: the biggest place first.
 *
 * A cube, then flats, then rods, then units — the way a number is written, so
 * the canvas is laid out the way it would be said. Highlight colour breaks a
 * tie, so a marked group still stays together within its place.
 */
function byPlace(a, b) {
  const va = a.l * a.w * a.h;
  const vb = b.l * b.w * b.h;
  if (va !== vb) return vb - va;
  const ta = a.tag == null ? 99 : a.tag;
  const tb = b.tag == null ? 99 : b.tag;
  if (ta !== tb) return ta - tb;
  return b.w - a.w;
}

/**
 * Lay a list out left to right in rows, and say how big the block of them is.
 *
 * ONE ROW is the point: "biggest place first, left to right" is a sentence, and
 * a sentence that wraps after every other word is not one. So the row runs as
 * wide as it needs to and only wraps past `cap`, which is there to stop a
 * hundred unit cubes marching off over the horizon.
 */
function rows(list, sorter, { cap = 150 } = {}) {
  const pad = CFG.gap;
  const sorted = [...list].sort(sorter);
  const foot = new Map(sorted.map((b) => [b.id, footprint(b)]));
  const widest = sorted.reduce((n, b) => Math.max(n, foot.get(b.id).l), 1);
  const total = sorted.reduce((n, b) => n + foot.get(b.id).l + pad, 0) - pad;
  const wrap = Math.max(widest, Math.min(total, cap));

  const out = [];
  let x = 0, z = 0, rowW = 0, usedX = 0;
  for (const b of sorted) {
    const f = foot.get(b.id);
    if (x && x + f.l > wrap) { z += rowW + pad; x = 0; rowW = 0; }
    out.push({ item: b, x, z });
    x += f.l + pad;
    rowW = Math.max(rowW, f.w);
    usedX = Math.max(usedX, x - pad);
  }
  return { out, w: usedX, h: z + rowW };
}

/**
 * Set the whole canvas out: BLOCKS ABOVE, TOOLS BELOW.
 *
 * The blocks are one band across the top, biggest place to smallest, left to
 * right — the order a number is written in, so the paper reads like the number
 * it is holding. The tools go in a band underneath in the order they were put
 * out, because that order is the learner's own and nothing about a soroban says
 * it belongs before or after a chart.
 *
 * The two bands are centred on the same middle line, so the canvas has a
 * top half and a bottom half however much is in either.
 */
export function arrange(blocks, things) {
  const pad = CFG.gap;
  const top = rows(blocks, byPlace);
  const bottom = rows(things, (a, b) => a.id - b.id, { cap: 200 });

  /* `rows` counts its rows downward in its own space, so a world z is that
     SUBTRACTED from the top of the band — and an item's stored z is its LOW
     corner, which up here is its bottom edge. Get either wrong and the rows
     come out in reverse.  */
  function put(band, topZ) {
    const dx = -Math.round(band.w / 2);
    for (const o of band.out) {
      o.item.x = o.x + dx;
      o.item.z = Math.round(topZ - UP * (o.z + footprint(o.item).w));
    }
  }

  // the blocks' band hangs off the middle line upwards, the tools' band below it
  put(top, UP * (top.h + pad));
  put(bottom, UP * -pad);
  return true;
}

/** The cell-space bounding box of a set of items, or null when there are none. */
export function bounds(items) {
  if (!items.length) return null;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, top = 1;
  for (const b of items) {
    const f = footprint(b);
    x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + f.l);
    z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z + f.w);
    top = Math.max(top, b.h);
  }
  return { x0, x1, z0, z1, top };
}
