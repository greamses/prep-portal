/**
 * queen.js — tall, elegant body with a flared collar and a coronet of points
 * topped by a ball finial. The crown points are small cones set around the
 * rim of the head.
 */
import * as THREE from "three";
import { sideMaterials } from "../materials.js";
import { turned, feltPad, finial, pieceGroup } from "./_common.js";

export const QUEEN_HEIGHT = 1.4;

export function createQueen(side) {
  const { wood, felt } = sideMaterials(side);
  const g = pieceGroup("q", side);

  const profile = [
    [0.0, 0.0],
    [0.36, 0.0],
    [0.36, 0.06],
    [0.31, 0.11],
    [0.2, 0.17],
    [0.23, 0.24], // base ring
    [0.17, 0.32],
    [0.12, 0.62],
    [0.11, 0.8],
    [0.16, 0.86], // collar
    [0.13, 0.9],
    [0.1, 0.96],
    [0.2, 1.04], // crown base belly
    [0.24, 1.12], // crown rim
    [0.16, 1.16],
  ];
  g.add(turned(profile, wood));

  // Coronet: points around the crown rim.
  const points = 8;
  const rimR = 0.21;
  const coneGeo = new THREE.ConeGeometry(0.05, 0.13, 12);
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const tip = new THREE.Mesh(coneGeo, wood);
    tip.position.set(Math.cos(a) * rimR, 1.2, Math.sin(a) * rimR);
    tip.castShadow = true;
    g.add(tip);
  }

  g.add(finial(0.09, 1.26, wood)); // central jewel
  g.add(feltPad(0.36, felt));
  return g;
}
