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

export function occupancy(items, skip = null) {
  const grid = new Set();
  for (const b of items) {
    if (skip && skip.has(b.id)) continue;
    mark(grid, b.x, b.z, b.l, b.w);
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

/**
 * Re-lay everything in rows, biggest first, grouped by highlight colour, and
 * centre the result on the origin. The row width is chosen so the whole thing
 * comes out roughly square rather than one endless line.
 */
export function tidy(items) {
  if (!items.length) return true;

  const sorted = [...items].sort((a, b) => {
    const ta = a.tag == null ? 99 : a.tag;
    const tb = b.tag == null ? 99 : b.tag;
    if (ta !== tb) return ta - tb;
    const va = a.l * a.w * a.h, vb = b.l * b.w * b.h;
    if (va !== vb) return vb - va;
    return b.w - a.w;
  });

  const pad = CFG.gap;
  const area = sorted.reduce((n, b) => n + (b.l + pad) * (b.w + pad), 0);
  const widest = sorted.reduce((n, b) => Math.max(n, b.l), 1);
  const wrap = Math.max(widest, Math.ceil(Math.sqrt(area) * 1.25));

  let x = 0, z = 0, rowW = 0, tag = sorted[0].tag;
  let usedX = 0, usedZ = 0;
  const out = [];

  for (const b of sorted) {
    if (b.tag !== tag) { // a new colour starts a new row
      z += rowW + pad;
      x = 0; rowW = 0; tag = b.tag;
    }
    if (x && x + b.l > wrap) {
      z += rowW + pad;
      x = 0; rowW = 0;
    }
    out.push({ id: b.id, x, z });
    x += b.l + pad;
    rowW = Math.max(rowW, b.w);
    usedX = Math.max(usedX, x - pad);
    usedZ = Math.max(usedZ, z + rowW);
  }

  const dx = -Math.round(usedX / 2);
  const dz = -Math.round(usedZ / 2);
  const byId = new Map(out.map((o) => [o.id, o]));
  for (const b of items) {
    const o = byId.get(b.id);
    if (o) { b.x = o.x + dx; b.z = o.z + dz; }
  }
  return true;
}

/** The cell-space bounding box of a set of items, or null when there are none. */
export function bounds(items) {
  if (!items.length) return null;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, top = 1;
  for (const b of items) {
    x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.l);
    z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z + b.w);
    top = Math.max(top, b.h);
  }
  return { x0, x1, z0, z1, top };
}
