/**
 * pieces/_common.js — shared tooling every piece module uses.
 *
 * Real Staunton pieces are turned on a lathe: their body is a silhouette
 * (a 2D profile) spun around the vertical axis. So each piece module just
 * describes its profile as a list of [radius, height] points, and `turned()`
 * lathes it into a smooth solid. Knight is the one exception — its head is
 * sculpted separately in knight.js.
 *
 * All pieces share: a felt pad under the base, cast/receive shadows, and a
 * consistent up-axis where y=0 is the board surface.
 */
import * as THREE from "three";

const LATHE_SEGMENTS = 56;

/**
 * Build a lathed body from profile points.
 *
 * A lathe only spins the profile into a thin shell, so if the profile doesn't
 * touch the central axis at both ends the top/bottom are left open and you can
 * see straight into the hollow interior. We auto-cap each profile by pulling it
 * onto the axis (radius 0) at the bottom and top, which seals the shell into a
 * solid-looking turned piece.
 *
 * @param {Array<[number,number]>} points - [radius, y] from bottom to top.
 * @param {THREE.Material} material
 */
export function turned(points, material) {
  const capped = [...points];
  const EPS = 1e-3;
  const first = capped[0];
  const last = capped[capped.length - 1];
  if (first[0] > EPS) capped.unshift([0, first[1]]); // close the base
  if (last[0] > EPS) capped.push([0, last[1]]); // close the top

  const pts = capped.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y));
  const geo = new THREE.LatheGeometry(pts, LATHE_SEGMENTS);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A thin felt disc tucked under the base so pieces look planted. */
export function feltPad(radius, feltMat) {
  const geo = new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.02, 32);
  const pad = new THREE.Mesh(geo, feltMat);
  pad.position.y = 0.01;
  pad.receiveShadow = true;
  return pad;
}

/** A small sphere finial used to top several pieces. */
export function finial(radius, y, material) {
  const geo = new THREE.SphereGeometry(radius, 24, 16);
  const ball = new THREE.Mesh(geo, material);
  ball.position.y = y;
  ball.castShadow = true;
  return ball;
}

/**
 * Generate a smooth base→stem profile shared by most pieces, so each module
 * only has to describe what makes it distinctive on top.
 * Returns points up to `topY`; modules append their crown.
 */
export function baseProfile(baseR, topY) {
  return [
    [0.0, 0.0],
    [baseR, 0.0],
    [baseR, 0.05],
    [baseR * 0.96, 0.1],
    [baseR * 0.7, 0.16],
    [baseR * 0.62, 0.22],
    [baseR * 0.66, 0.3], // little flare ring
    [baseR * 0.5, 0.4],
    [baseR * 0.34, topY * 0.7],
    [baseR * 0.3, topY],
  ];
}

/** Wrap a built piece in a group and tag it. */
export function pieceGroup(type, side) {
  const g = new THREE.Group();
  g.userData.type = type;
  g.userData.side = side;
  return g;
}
