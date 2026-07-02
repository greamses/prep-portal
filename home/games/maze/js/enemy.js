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
  const enemies = [];

  /** Spawn a zombie. Clones the shared prototype so every zombie is the same
   *  Yaku model with its own skeleton + animations. Marker fallback if no proto. */
  function spawn(proto, { cell = [0, 0], awake = true, ambush = false, wakeAt = 0 } = {}) {
    const holder = new B.TransformNode("zhold", scene);
    holder.position = centerOf(cell[0], cell[1], 0);
    let play = null;
    if (proto && proto.container) {
      const inst = proto.container.instantiateModelsToScene((n) => n, false);
      const cloneRoot = inst.rootNodes[0];
      cloneRoot.parent = holder;
      cloneRoot.position.set(0, -(proto.footOffset || 0), 0);
      // A skinned mesh keeps its BIND-POSE bounding box (anchored near the world
      // origin), so once a zombie stands off to the side its box leaves the view
      // frustum and Babylon culls it — the zombie goes invisible while this
      // holder keeps hunting you. Opt the meshes out of frustum culling so they
      // always render wherever they actually stand.
      cloneRoot.getChildMeshes(false).forEach((m) => {
        m.alwaysSelectAsActiveMesh = true;
        m.isVisible = true;
        // These Mixamo rigs carry a scaled armature, so their bone matrices have a
        // ~100x scale. On the GPU that overflows float precision and collapses
        // every vertex to a point → the enemy renders INVISIBLE while its AI still
        // hunts you. CPU skinning (double precision) handles it. Set at spawn, so
        // the mesh's shader compiles for CPU skinning from the start.
        m.computeBonesUsingShaders = false;
      });
      inst.skeletons.forEach((sk) => { sk.useTextureToStoreBoneMatrices = false; });
      const ag = inst.animationGroups;
      const byName = {};
      proto.clipOrder.forEach((nm, i) => { if (ag[i]) { byName[nm] = ag[i]; ag[i].stop(); } });
      let current = null;
      play = (nm) => {
        const g = byName[nm];
        if (!g || g === current) return;
        for (const k in byName) if (byName[k] !== g) byName[k].stop();
        const loop = nm !== "bite";
        g.loopAnimation = loop;
        g.start(loop, 1.0, g.from, g.to, false);
        if (!loop) g.onAnimationGroupEndObservable.addOnce(() => { g.goToFrame(g.to); g.pause(); });
        current = g;
      };
      play("idle");
    } else {
      const m = B.MeshBuilder.CreatePolyhedron("enemy", { type: 1, size: 0.62 }, scene);
      const mm = new B.StandardMaterial("em", scene);
      mm.diffuseColor = B.Color3.FromHexString("#f04a4a");
      mm.emissiveColor = new B.Color3(0.55, 0.05, 0.05);
      m.material = mm; m.parent = holder; m.position.y = CFG.eyeH * 0.6;
    }
    enemies.push({ mesh: holder, play, target: null, phase: Math.random() * 6.28, awake, ambush, wakeAt, biting: false, model: !!(proto && proto.container) });
  }

  function update(playerPos) {
    const p = cellOf(playerPos.x, playerPos.z, rows, cols);
    const t = performance.now() * 0.004;
    for (const e of enemies) {
      if (e.biting) { if (e.play) e.play("bite"); continue; }

      // wake: ambushers when you pass near; the chaser after its countdown
      if (!e.awake) {
        if (e.ambush) {
          const d0 = Math.hypot(e.mesh.position.x - playerPos.x, e.mesh.position.z - playerPos.z);
          if (d0 < CFG.cell * 1.6) e.awake = true;
        } else if (e.wakeAt && performance.now() >= e.wakeAt) {
          e.awake = true;
        }
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
      if (Math.hypot(dx, dz) < CFG.cell * 0.3) return true; // must be right on her
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

  return { enemies, update, caught, setAlert, bite, spawn };
}
