/* =====================================================================
   Move engine — the queue and the actual twists/rotations.

   A layer turn reparents the affected cubies under a world-space pivot,
   animates a 90 degree rotation, then bakes the transform back into
   cubeGroup and snaps to the lattice so state never drifts. Instant
   (un-animated) variants drive thumbnails and scan setup.
   ===================================================================== */
import * as THREE from "three";
import { SP, TURN_MS, ROT_MS, VIEW } from "./constants.js";
import { easeInOut, snapQuaternion } from "./helpers.js";
import { scene, cubeGroup, cubies } from "./scene.js";
import { S } from "./state.js";
import { parseMoves } from "./moves.js";
import { showMove } from "./ui.js";
import { registerMove } from "./game-flow.js";

/* ---------- queue / pump -------------------------------------------- */
export const queue = [];

export function enqueue(move) {
  queue.push(move);
  pump();
}

export function pump() {
  if (S.animating || queue.length === 0) return;
  const move = queue.shift();
  if (move.type === "face") runFaceTurn(move);
  else if (move.type === "rot") runCubeRotate(move);
  else if (move.type === "after") {
    move.fn();
    pump();
  }
}

function runFaceTurn(move) {
  const { prime: pr, scramble: isScramble, dur, double } = move;
  const duration = (double ? 1.5 : 1) * (dur || TURN_MS);
  S.animating = true;
  const dirWorld = move.dir || VIEW[move.letter];
  const layers = move.layers || [move.layer ?? 1];
  const q = cubeGroup.quaternion;

  if (!isScramble && move.notation) showMove(move.notation);

  cubeGroup.updateMatrixWorld(true);
  const active = cubies.filter((c) => {
    const wp = c.position.clone().applyQuaternion(q);
    return layers.includes(Math.round(wp.dot(dirWorld) / SP));
  });

  const angle = (pr ? 1 : -1) * (Math.PI / 2) * (double ? 2 : 1);
  const pivot = new THREE.Group();
  scene.add(pivot);
  active.forEach((c) => pivot.attach(c));

  const finish = () => {
    pivot.quaternion.setFromAxisAngle(dirWorld, angle);
    pivot.updateMatrixWorld(true);
    active.forEach((c) => {
      cubeGroup.attach(c);
      c.position.set(
        Math.round(c.position.x / SP) * SP,
        Math.round(c.position.y / SP) * SP,
        Math.round(c.position.z / SP) * SP,
      );
      c.quaternion.copy(snapQuaternion(c.quaternion));
    });
    scene.remove(pivot);
    S.animating = false;
    if (!isScramble) registerMove();
    pump();
  };

  const start = performance.now();
  (function step(now) {
    const t = Math.min((now - start) / duration, 1);
    pivot.quaternion.setFromAxisAngle(dirWorld, angle * easeInOut(t));
    if (t < 1) requestAnimationFrame(step);
    else finish();
  })(performance.now());
}

function runCubeRotate({ axis, dir }) {
  S.animating = true;
  const startQ = cubeGroup.quaternion.clone();
  const deltaQ = new THREE.Quaternion().setFromAxisAngle(
    axis,
    dir * (Math.PI / 2),
  );
  const targetQ = new THREE.Quaternion().multiplyQuaternions(deltaQ, startQ);

  const finish = () => {
    cubeGroup.quaternion.copy(snapQuaternion(targetQ));
    S.animating = false;
    pump();
  };

  const start = performance.now();
  (function step(now) {
    const t = Math.min((now - start) / ROT_MS, 1);
    cubeGroup.quaternion.copy(startQ).slerp(targetQ, easeInOut(t));
    if (t < 1) requestAnimationFrame(step);
    else finish();
  })(performance.now());
}

/* ---------- solved detection ---------------------------------------- */
export function isSolved() {
  const faces = {};
  const n = new THREE.Vector3();
  for (const c of cubies) {
    for (const s of c.userData.stickers) {
      n.copy(s.dir).applyQuaternion(c.quaternion).round();
      const k = `${n.x},${n.y},${n.z}`;
      (faces[k] || (faces[k] = new Set())).add(s.color);
    }
  }
  return Object.values(faces).every((set) => set.size === 1);
}

/* ---------- instant (un-animated) application ----------------------- */
export function applyMoveInstant(arr, turn, isPrime, double) {
  const { dir, layers } = turn;
  const angle = (isPrime ? 1 : -1) * (Math.PI / 2) * (double ? 2 : 1);
  const q = new THREE.Quaternion().setFromAxisAngle(dir, angle);
  arr.forEach((c) => {
    if (!layers.includes(Math.round(c.position.clone().dot(dir)))) return;
    c.position.applyQuaternion(q);
    c.position.set(
      Math.round(c.position.x),
      Math.round(c.position.y),
      Math.round(c.position.z),
    );
    c.quaternion.premultiply(q);
    c.quaternion.copy(snapQuaternion(c.quaternion));
  });
}

export function applyAlgoInstant(arr, moves) {
  for (const t of parseMoves(moves))
    applyMoveInstant(arr, t.turn, t.prime, t.double);
}
