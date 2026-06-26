/* ============================================================================
   3D Maze — enemies ("zombies")
   ----------------------------------------------------------------------------
   • A detailed chaser (Yaku) that trails from behind.
   • Shadow ambush zombies hidden in dead-ends that WAKE when the player runs
     past, then chase. BFS over the grid (never through walls), slower than the
     player. Closes in for the kill inside the player's cell (corner-safe) and
     plays a bite when it catches you.
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;

function cellOf(x, z, rows, cols) {
  return {
    r: Math.max(0, Math.min(rows - 1, Math.round(z / CFG.cell))),
    c: Math.max(0, Math.min(cols - 1, Math.round(x / CFG.cell))),
  };
}
function centerOf(r, c, y) { return new B.Vector3(c * CFG.cell, y, r * CFG.cell); }
function neighbours(grid, r, c) {
  const rows = grid.length, cols = grid[0].length, out = [];
  if (r > 0 && !grid[r][c].n) out.push([r - 1, c]);
  if (c < cols - 1 && !grid[r][c].e) out.push([r, c + 1]);
  if (r < rows - 1 && !grid[r][c].s) out.push([r + 1, c]);
  if (c > 0 && !grid[r][c].w) out.push([r, c - 1]);
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

export function createEnemies(scene, grid, { speed = 0.07 } = {}) {
  const rows = grid.length, cols = grid[0].length;
  let shadowMat = null, eyeMat = null, shadowGlow = null;
  const enemies = [];

  /** The detailed chaser (Yaku rig). Wrapped in a holder so facing works. */
  function spawn(model, { cell = [0, 0], awake = true, ambush = false } = {}) {
    const holder = new B.TransformNode("zhold", scene);
    holder.position = centerOf(cell[0], cell[1], 0);
    let play = null;
    if (model) {
      model.root.setEnabled(true);
      model.root.parent = holder;
      model.root.position.set(0, -(model.footOffset || 0), 0);
      play = model.play;
    } else {
      // marker fallback
      const m = B.MeshBuilder.CreatePolyhedron("enemy", { type: 1, size: 0.62 }, scene);
      const mm = new B.StandardMaterial("em", scene);
      mm.diffuseColor = B.Color3.FromHexString("#f04a4a");
      mm.emissiveColor = new B.Color3(0.55, 0.05, 0.05);
      m.material = mm; m.parent = holder; m.position.y = CFG.eyeH * 0.6;
    }
    enemies.push({ mesh: holder, play, target: null, phase: Math.random() * 6.28, awake, ambush, biting: false, model: !!model });
  }

  /** A dark shadow zombie (primitives + glowing eyes), dormant until you pass. */
  function spawnShadow(cell) {
    if (!shadowMat) {
      shadowMat = new B.StandardMaterial("shMat", scene);
      shadowMat.diffuseColor = new B.Color3(0.04, 0.05, 0.06);
      shadowMat.specularColor = new B.Color3(0, 0, 0);
      eyeMat = new B.StandardMaterial("eyeMat", scene);
      eyeMat.emissiveColor = new B.Color3(0.9, 0.1, 0.05);
      eyeMat.diffuseColor = new B.Color3(0.9, 0.1, 0.05);
      shadowGlow = new B.GlowLayer("shGlow", scene);
      shadowGlow.intensity = 0.7;
    }
    const root = new B.TransformNode("shadow", scene);
    root.position = centerOf(cell[0], cell[1], 0);
    const part = (mesh, mat, x, y, z) => { mesh.material = mat; mesh.position.set(x, y, z); mesh.parent = root; return mesh; };
    part(B.MeshBuilder.CreateCapsule("sb", { height: 1.5, radius: 0.34 }, scene), shadowMat, 0, 0.95, 0);
    part(B.MeshBuilder.CreateSphere("sh", { diameter: 0.42 }, scene), shadowMat, 0, 1.75, 0);
    const eL = part(B.MeshBuilder.CreateSphere("eL", { diameter: 0.09 }, scene), eyeMat, -0.09, 1.78, 0.18);
    const eR = part(B.MeshBuilder.CreateSphere("eR", { diameter: 0.09 }, scene), eyeMat, 0.09, 1.78, 0.18);
    shadowGlow.addIncludedOnlyMesh(eL); shadowGlow.addIncludedOnlyMesh(eR);
    enemies.push({ mesh: root, play: null, target: null, phase: Math.random() * 6.28, awake: false, ambush: true, biting: false, model: false });
  }

  function update(playerPos) {
    const p = cellOf(playerPos.x, playerPos.z, rows, cols);
    const t = performance.now() * 0.004;
    for (const e of enemies) {
      if (e.biting) { if (e.play) e.play("bite"); continue; }

      // ambush wake when the player passes near
      if (e.ambush && !e.awake) {
        const d0 = Math.hypot(e.mesh.position.x - playerPos.x, e.mesh.position.z - playerPos.z);
        if (d0 < CFG.cell * 1.6) e.awake = true;
      }
      if (!e.awake) {
        if (e.play) e.play("idle");
        e.mesh.position.y = Math.sin(t + e.phase) * 0.04; // faint breathing
        continue;
      }

      // chase
      let moved = false;
      const ec = cellOf(e.mesh.position.x, e.mesh.position.z, rows, cols);
      if (ec.r === p.r && ec.c === p.c) {
        e.target = new B.Vector3(playerPos.x, 0, playerPos.z); // close in for the kill (corner-safe)
      } else if (!e.target || B.Vector3.Distance(e.mesh.position, e.target) < 0.12) {
        const next = bfsNext(grid, ec.r, ec.c, p.r, p.c);
        e.target = next ? centerOf(next[0], next[1], 0) : null;
      }
      if (e.target) {
        const dir = e.target.subtract(e.mesh.position);
        dir.y = 0;
        const d = dir.length();
        if (d > 0.001) {
          dir.normalize();
          e.mesh.position.x += dir.x * Math.min(speed, d);
          e.mesh.position.z += dir.z * Math.min(speed, d);
          e.mesh.rotation.y = Math.atan2(dir.x, dir.z) + CFG.modelYaw;
          moved = true;
        }
      }
      if (e.play) {
        const dist = Math.hypot(e.mesh.position.x - playerPos.x, e.mesh.position.z - playerPos.z);
        e.play(!moved ? "idle" : dist < CFG.cell * 2.5 ? "run" : "crawl");
      }
      e.mesh.position.y = moved ? 0 : Math.sin(t + e.phase) * 0.04;
    }
  }

  function caught(playerPos) {
    for (const e of enemies) {
      if (!e.awake) continue;
      const dx = e.mesh.position.x - playerPos.x;
      const dz = e.mesh.position.z - playerPos.z;
      if (Math.hypot(dx, dz) < CFG.cell * 0.55) return true;
    }
    return false;
  }

  /** Play the bite on the nearest awake zombie + freeze it (on catch). */
  function bite(playerPos) {
    let best = null, bd = Infinity;
    for (const e of enemies) {
      if (!e.awake) continue;
      const d = Math.hypot(e.mesh.position.x - playerPos.x, e.mesh.position.z - playerPos.z);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) {
      best.biting = true;
      best.mesh.rotation.y = Math.atan2(playerPos.x - best.mesh.position.x, playerPos.z - best.mesh.position.z) + CFG.modelYaw;
      if (best.play) best.play("bite");
    }
  }

  function setAlert() {}

  return { enemies, update, caught, setAlert, bite, spawn, spawnShadow };
}
