/**
 * bishop.js — the mitre. A tall slender body, a bulbous head, a small ball
 * finial, and the signature diagonal slit cut into the mitre.
 */
import * as THREE from "three";
import { sideMaterials } from "../materials.js";
import { turned, feltPad, finial, pieceGroup } from "./_common.js";

export const BISHOP_HEIGHT = 1.18;

export function createBishop(side) {
  const { wood, felt } = sideMaterials(side);
  const g = pieceGroup("b", side);

  const profile = [
    [0.0, 0.0],
    [0.32, 0.0],
    [0.32, 0.06],
    [0.28, 0.1],
    [0.18, 0.15],
    [0.21, 0.22], // base ring
    [0.15, 0.3],
    [0.115, 0.5],
    [0.16, 0.56], // collar saucer
    [0.13, 0.6],
    [0.1, 0.66],
    [0.17, 0.78], // mitre belly
    [0.19, 0.86],
    [0.14, 0.96],
    [0.06, 1.02],
  ];
  g.add(turned(profile, wood));
  g.add(finial(0.07, 1.08, wood)); // tip ball

  // The mitre slit — a thin dark wedge carved across the head.
  const slitGeo = new THREE.BoxGeometry(0.42, 0.13, 0.06);
  const slit = new THREE.Mesh(
    slitGeo,
    new THREE.MeshStandardMaterial({ color: 0x140d07, roughness: 0.8 })
  );
  slit.position.y = 0.9;
  slit.rotation.z = Math.PI / 5;
  g.add(slit);

  g.add(feltPad(0.32, felt));
  return g;
}
