/**
 * rook.js — the castle tower. A sturdy cylindrical body topped by a
 * crenellated parapet (the battlements are cut, not lathed, so they're
 * modelled as separate boxes around the rim).
 */
import * as THREE from "three";
import { sideMaterials } from "../materials.js";
import { turned, feltPad, pieceGroup } from "./_common.js";

export const ROOK_HEIGHT = 0.9;

export function createRook(side) {
  const { wood, felt } = sideMaterials(side);
  const g = pieceGroup("r", side);

  const profile = [
    [0.0, 0.0],
    [0.34, 0.0],
    [0.34, 0.06],
    [0.3, 0.1],
    [0.24, 0.16],
    [0.27, 0.22], // base ring
    [0.22, 0.28],
    [0.21, 0.62],
    [0.26, 0.66], // top flare
    [0.28, 0.74],
    [0.28, 0.82],
    [0.2, 0.82], // hollow lip of the parapet
  ];
  g.add(turned(profile, wood));

  // Crenellations: 6 merlons cut into the top ring.
  const merlonCount = 6;
  const ringR = 0.26;
  const merlonGeo = new THREE.BoxGeometry(0.12, 0.1, 0.12);
  for (let i = 0; i < merlonCount; i++) {
    const a = (i / merlonCount) * Math.PI * 2;
    const m = new THREE.Mesh(merlonGeo, wood);
    m.position.set(Math.cos(a) * ringR, 0.86, Math.sin(a) * ringR);
    m.rotation.y = -a;
    m.castShadow = true;
    g.add(m);
  }

  g.add(feltPad(0.34, felt));
  return g;
}
