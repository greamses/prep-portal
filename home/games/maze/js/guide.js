/* ============================================================================
   3D Maze — the Guide (Erika)
   ----------------------------------------------------------------------------
   A friendly companion who leads the player to the exit. She walks the maze's
   unique solution path, staying a couple of cells AHEAD of the player, and waits
   in front of any riddle gate that hasn't been solved yet. Purely cosmetic
   guidance — she never collides with the player.
   ========================================================================== */

import { CFG } from "./config.js";

const B = window.BABYLON;

const centerOf = (r, c) => new B.Vector3(c * CFG.cell, 0, r * CFG.cell);
function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function createGuide(scene, rig, path, gates) {
  const cells = (path && path.length) ? path : [[0, 0]];
  const holder = new B.TransformNode("guide", scene);
  holder.position = centerOf(cells[0][0], cells[0][1]);
  rig.root.parent = holder;
  rig.root.position.set(0, -(rig.footOffset || 0), 0);
  rig.play("idle");

  // nearest path index to a world position
  const nearestIndex = (pos) => {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < cells.length; i++) {
      const c = centerOf(cells[i][0], cells[i][1]);
      const d = Math.hypot(c.x - pos.x, c.z - pos.z);
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  };
  // path index each gate sits on — so she halts before an unsolved one
  const gateIdx = (gates || []).map((g) => nearestIndex(g.pos));

  let progress = 0; // furthest path index the player has reached (monotonic)
  let yaw = 0;
  const LEAD = 2;   // cells to stay ahead of the player

  function update(playerPos, active) {
    if (!active) { rig.play("idle"); return; }
    progress = Math.max(progress, nearestIndex(playerPos));

    // cap her target just before the first still-locked gate ahead
    let maxIdx = cells.length - 1;
    for (let k = 0; k < gateIdx.length; k++) {
      if (gates[k] && !gates[k].solved) maxIdx = Math.min(maxIdx, gateIdx[k]);
    }

    const targetIdx = Math.max(0, Math.min(progress + LEAD, maxIdx));
    const t = centerOf(cells[targetIdx][0], cells[targetIdx][1]);
    const dx = t.x - holder.position.x, dz = t.z - holder.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.18) {
      const running = d > CFG.cell * 1.6; // hurry to catch up if the player sprints
      const speed = running ? 0.22 : 0.12;
      const s = Math.min(speed, d) / d;
      holder.position.x += dx * s;
      holder.position.z += dz * s;
      yaw = lerpAngle(yaw, Math.atan2(dx, dz) + CFG.modelYaw, 0.2);
      holder.rotation.y = yaw;
      rig.play(running ? "run" : "walk");
    } else {
      rig.play("idle");
    }
  }

  return { holder, update };
}
