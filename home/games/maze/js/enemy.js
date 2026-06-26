/* ============================================================================
   3D Maze — enemies ("hunters")
   ----------------------------------------------------------------------------
   Red drones that roam the corridors and hunt the player using BFS through the
   maze grid (so they never walk through walls). They're slower than the player,
   so they're escapable. caught() reports a collision with the player.
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;
const FLOAT_Y = CFG.eyeH * 0.6;

function cellOf(x, z, rows, cols) {
  return {
    r: Math.max(0, Math.min(rows - 1, Math.round(z / CFG.cell))),
    c: Math.max(0, Math.min(cols - 1, Math.round(x / CFG.cell))),
  };
}
function centerOf(r, c) {
  return new B.Vector3(c * CFG.cell, FLOAT_Y, r * CFG.cell);
}

/** Open neighbours of a cell (no wall between). */
function neighbours(grid, r, c) {
  const rows = grid.length, cols = grid[0].length;
  const out = [];
  if (r > 0 && !grid[r][c].n) out.push([r - 1, c]);
  if (c < cols - 1 && !grid[r][c].e) out.push([r, c + 1]);
  if (r < rows - 1 && !grid[r][c].s) out.push([r + 1, c]);
  if (c > 0 && !grid[r][c].w) out.push([r, c - 1]);
  return out;
}

/** BFS from (sr,sc) to (tr,tc); return the first step cell, or null. */
function bfsNext(grid, sr, sc, tr, tc) {
  if (sr === tr && sc === tc) return null;
  const rows = grid.length, cols = grid[0].length;
  const prev = Array.from({ length: rows }, () => Array(cols).fill(null));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const q = [[sr, sc]];
  seen[sr][sc] = true;
  while (q.length) {
    const [r, c] = q.shift();
    if (r === tr && c === tc) break;
    for (const [nr, nc] of neighbours(grid, r, c)) {
      if (!seen[nr][nc]) { seen[nr][nc] = true; prev[nr][nc] = [r, c]; q.push([nr, nc]); }
    }
  }
  if (!seen[tr][tc]) return null;
  let cur = [tr, tc];
  while (prev[cur[0]][cur[1]] && !(prev[cur[0]][cur[1]][0] === sr && prev[cur[0]][cur[1]][1] === sc)) {
    cur = prev[cur[0]][cur[1]];
  }
  return cur;
}

export function createEnemies(scene, grid, { count = 2, speed = 0.12 } = {}) {
  const rows = grid.length, cols = grid[0].length;

  const mat = new B.StandardMaterial("enemyMat", scene);
  mat.diffuseColor = B.Color3.FromHexString("#f04a4a");
  mat.emissiveColor = new B.Color3(0.55, 0.05, 0.05);
  mat.specularColor = new B.Color3(0.2, 0.2, 0.2);
  const glow = new B.GlowLayer("enemyGlow", scene);
  glow.intensity = 0.8;

  // spawn in the far half of the maze, away from the player's start (0,0)
  const spots = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (r + c > (rows + cols) / 2) spots.push([r, c]);

  const enemies = [];
  for (let i = 0; i < count; i++) {
    const [r, c] = spots.length ? spots[(Math.random() * spots.length) | 0] : [rows - 1, cols - 1];
    const mesh = B.MeshBuilder.CreatePolyhedron("enemy", { type: 1, size: 0.62 }, scene); // octahedron
    mesh.material = mat;
    mesh.position = centerOf(r, c);
    glow.addIncludedOnlyMesh(mesh);
    enemies.push({ mesh, target: null, phase: Math.random() * 6.28 });
  }

  function update(playerPos) {
    const p = cellOf(playerPos.x, playerPos.z, rows, cols);
    const t = performance.now() * 0.004;
    for (const e of enemies) {
      if (!e.target || B.Vector3.Distance(e.mesh.position, e.target) < 0.12) {
        const ec = cellOf(e.mesh.position.x, e.mesh.position.z, rows, cols);
        const next = bfsNext(grid, ec.r, ec.c, p.r, p.c);
        e.target = next ? centerOf(next[0], next[1]) : null;
      }
      if (e.target) {
        const dir = e.target.subtract(e.mesh.position);
        dir.y = 0;
        const d = dir.length();
        if (d > 0.001) {
          dir.normalize();
          e.mesh.position.x += dir.x * Math.min(speed, d);
          e.mesh.position.z += dir.z * Math.min(speed, d);
        }
      }
      e.mesh.rotation.y += 0.05;
      e.mesh.position.y = FLOAT_Y + Math.sin(t + e.phase) * 0.16;
    }
  }

  function caught(playerPos) {
    for (const e of enemies) {
      const dx = e.mesh.position.x - playerPos.x;
      const dz = e.mesh.position.z - playerPos.z;
      if (Math.hypot(dx, dz) < CFG.cell * 0.42) return true;
    }
    return false;
  }

  return { enemies, update, caught };
}
