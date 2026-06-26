/* ============================================================================
   3D Maze — enemies ("zombies")
   ----------------------------------------------------------------------------
   Hunters that chase the player through the maze using BFS over the grid (never
   through walls), slower than the player so they're escapable. Uses the loaded
   zombie rig (run/idle) when supplied; falls back to a red octahedron otherwise.
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;

function cellOf(x, z, rows, cols) {
  return {
    r: Math.max(0, Math.min(rows - 1, Math.round(z / CFG.cell))),
    c: Math.max(0, Math.min(cols - 1, Math.round(x / CFG.cell))),
  };
}
function centerOf(r, c, y) {
  return new B.Vector3(c * CFG.cell, y, r * CFG.cell);
}
function neighbours(grid, r, c) {
  const rows = grid.length, cols = grid[0].length, out = [];
  if (r > 0 && !grid[r - 1][c].n && !grid[r][c].n) out.push([r - 1, c]);
  if (c < cols - 1 && !grid[r][c].e && !grid[r][c + 1].e) out.push([r, c + 1]);
  if (r < rows - 1 && !grid[r][c].s && !grid[r + 1][c].s) out.push([r + 1, c]);
  if (c > 0 && !grid[r][c].w && !grid[r][c - 1].w) out.push([r, c - 1]);
  return out;
}
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

export function createEnemies(scene, grid, { count = 1, speed = 0.07, model = null } = {}) {
  const rows = grid.length, cols = grid[0].length;

  // spawn AT the entrance cell so they trail her from BEHIND as she heads in
  const spots = [[1, 0], [0, 1], [1, 1]];

  let octMat = null, octGlow = null;
  const enemies = [];
  for (let i = 0; i < count; i++) {
    const [r, c] = i === 0 ? [0, 0] : spots[(Math.random() * spots.length) | 0];
    let mesh, play = null, footY = 0;
    if (model && i === 0) {
      mesh = model.root;
      footY = -(model.footOffset || 0); // seat feet on the ground
      play = model.play;
    } else {
      if (!octMat) {
        octMat = new B.StandardMaterial("enemyMat", scene);
        octMat.diffuseColor = B.Color3.FromHexString("#f04a4a");
        octMat.emissiveColor = new B.Color3(0.55, 0.05, 0.05);
        octGlow = new B.GlowLayer("enemyGlow", scene);
        octGlow.intensity = 0.8;
      }
      mesh = B.MeshBuilder.CreatePolyhedron("enemy", { type: 1, size: 0.62 }, scene);
      mesh.material = octMat;
      footY = CFG.eyeH * 0.6;
      octGlow.addIncludedOnlyMesh(mesh);
    }
    mesh.position = centerOf(r, c, footY);
    enemies.push({ mesh, play, footY, target: null, phase: Math.random() * 6.28, isModel: !!(model && i === 0) });
  }

  function update(playerPos, hunting = true) {
    const p = cellOf(playerPos.x, playerPos.z, rows, cols);
    const t = performance.now() * 0.004;
    for (const e of enemies) {
      let moved = false;
      if (hunting) {
        if (!e.target || B.Vector3.Distance(e.mesh.position, e.target) < 0.12) {
          const ec = cellOf(e.mesh.position.x, e.mesh.position.z, rows, cols);
          const next = bfsNext(grid, ec.r, ec.c, p.r, p.c);
          e.target = next ? centerOf(next[0], next[1], e.footY) : null;
        }
        if (e.target) {
          const dir = e.target.subtract(e.mesh.position);
          dir.y = 0;
          const d = dir.length();
          if (d > 0.001) {
            dir.normalize();
            e.mesh.position.x += dir.x * Math.min(speed, d);
            e.mesh.position.z += dir.z * Math.min(speed, d);
            if (e.isModel) e.mesh.rotation.y = Math.atan2(dir.x, dir.z) + CFG.modelYaw;
            moved = true;
          }
        }
      }
      if (e.play) e.play(moved ? "run" : "idle"); // idle until actually chasing
      if (!e.isModel) {
        e.mesh.rotation.y += 0.05;
        e.mesh.position.y = e.footY + Math.sin(t + e.phase) * 0.16;
      }
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

  function setAlert() {} // (zombie has no alert colour)

  return { enemies, update, caught, setAlert };
}
