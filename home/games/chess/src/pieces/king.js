/**
 * king.js — the tallest piece. Same regal body as the queen but crowned with
 * a cross finial instead of a coronet.
 */
import * as THREE from "three";
import { sideMaterials } from "../materials.js";
import { turned, feltPad, pieceGroup } from "./_common.js";

export const KING_HEIGHT = 1.55;

export function createKing(side) {
  const { wood, felt } = sideMaterials(side);
  const g = pieceGroup("k", side);

  const profile = [
    [0.0, 0.0],
    [0.37, 0.0],
    [0.37, 0.06],
    [0.32, 0.11],
    [0.21, 0.17],
    [0.24, 0.24], // base ring
    [0.18, 0.33],
    [0.13, 0.66],
    [0.12, 0.86],
    [0.17, 0.92], // collar
    [0.14, 0.96],
    [0.11, 1.02],
    [0.21, 1.1], // crown belly
    [0.24, 1.2], // crown rim
    [0.19, 1.26],
    [0.17, 1.32],
  ];
  g.add(turned(profile, wood));

  // The cross finial.
  const barGeo = new THREE.BoxGeometry(0.07, 0.26, 0.07);
  const vert = new THREE.Mesh(barGeo, wood);
  vert.position.y = 1.45;
  vert.castShadow = true;
  g.add(vert);

  const crossGeo = new THREE.BoxGeometry(0.18, 0.07, 0.07);
  const horiz = new THREE.Mesh(crossGeo, wood);
  horiz.position.y = 1.47;
  horiz.castShadow = true;
  g.add(horiz);

  g.add(feltPad(0.37, felt));
  return g;
}
