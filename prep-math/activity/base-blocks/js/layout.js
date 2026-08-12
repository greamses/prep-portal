/* ============================================================================
   Base Blocks — where a block lands on the mat
   ----------------------------------------------------------------------------
   The mat is an occupancy grid of unit cells. Nothing ever overlaps: a new or
   split-off piece is given the first free rectangle that fits, and "Tidy up"
   re-lays the whole mat in rows — one row per highlight colour, which is what
   makes highlighting an organising tool rather than just paint.
   ========================================================================== */

import { CFG } from "./config.js";

const N = CFG.mat;

export function occupancy(blocks, skip = null) {
  const grid = new Uint8Array(N * N);
  for (const b of blocks) {
    if (skip && skip.has(b.id)) continue;
    for (let z = b.z; z < b.z + b.w; z++) {
      for (let x = b.x; x < b.x + b.l; x++) {
        if (x >= 0 && x < N && z >= 0 && z < N) grid[z * N + x] = 1;
      }
    }
  }
  return grid;
}

export function fits(grid, x, z, l, w, pad = 0) {
  if (x < 0 || z < 0 || x + l > N || z + w > N) return false;
  const x0 = Math.max(0, x - pad), x1 = Math.min(N - 1, x + l - 1 + pad);
  const z0 = Math.max(0, z - pad), z1 = Math.min(N - 1, z + w - 1 + pad);
  for (let zz = z0; zz <= z1; zz++) {
    for (let xx = x0; xx <= x1; xx++) if (grid[zz * N + xx]) return false;
  }
  return true;
}

export function mark(grid, x, z, l, w) {
  for (let zz = z; zz < z + w; zz++) {
    for (let xx = x; xx < x + l; xx++) {
      if (xx >= 0 && xx < N && zz >= 0 && zz < N) grid[zz * N + xx] = 1;
    }
  }
}

/**
 * First free l×w rectangle, searched outwards from `near` so split pieces stay
 * beside the block they came from instead of jumping across the mat.
 */
export function findSpot(grid, l, w, near = null) {
  const pad = CFG.gap;
  const cx = near ? near.x : Math.floor((N - l) / 2);
  const cz = near ? near.z : Math.floor((N - w) / 2);

  let best = null;
  let bestD = Infinity;
  for (let z = 0; z + w <= N; z++) {
    for (let x = 0; x + l <= N; x++) {
      const d = (x - cx) * (x - cx) + (z - cz) * (z - cz);
      if (d >= bestD) continue;
      if (fits(grid, x, z, l, w, pad)) { best = { x, z }; bestD = d; }
    }
  }
  if (best) return best;

  // mat is tight — try again without the breathing space
  for (let z = 0; z + w <= N; z++) {
    for (let x = 0; x + l <= N; x++) {
      if (fits(grid, x, z, l, w, 0)) return { x, z };
    }
  }
  return null;
}

/**
 * Re-lay every block in rows, biggest first, grouped by highlight colour.
 * Returns false and changes nothing if the mat cannot hold the tidy layout.
 */
export function tidy(blocks) {
  const sorted = [...blocks].sort((a, b) => {
    const ta = a.tag == null ? 99 : a.tag;
    const tb = b.tag == null ? 99 : b.tag;
    if (ta !== tb) return ta - tb;
    const va = a.l * a.w * a.h, vb = b.l * b.w * b.h;
    if (va !== vb) return vb - va;
    return b.w - a.w;
  });

  const pad = CFG.gap;
  let x = 0, z = 0, rowW = 0, tag = sorted.length ? sorted[0].tag : null;
  let usedX = 0, usedZ = 0;
  const out = [];

  for (const b of sorted) {
    if (b.tag !== tag) { // a new colour starts a new row
      z += rowW + pad;
      x = 0; rowW = 0; tag = b.tag;
    }
    if (x + b.l > N) { // wrap
      z += rowW + pad;
      x = 0; rowW = 0;
    }
    if (b.l > N || z + b.w > N) return false; // out of paper
    out.push({ id: b.id, x, z });
    x += b.l + pad;
    rowW = Math.max(rowW, b.w);
    usedX = Math.max(usedX, x - pad);
    usedZ = Math.max(usedZ, z + rowW);
  }

  // sit the whole arrangement in the middle of the mat, not in a corner
  const dx = Math.max(0, Math.floor((N - usedX) / 2));
  const dz = Math.max(0, Math.floor((N - usedZ) / 2));

  const byId = new Map(out.map((o) => [o.id, o]));
  for (const b of blocks) {
    const o = byId.get(b.id);
    if (o) { b.x = o.x + dx; b.z = o.z + dz; }
  }
  return true;
}
