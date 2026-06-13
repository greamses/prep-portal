/**
 * pawn.js — the foot soldier. A short flared body, a collar ring, a narrow
 * neck, and a round head ball. Smallest and simplest of the set.
 */
import { sideMaterials } from "../materials.js";
import { turned, feltPad, finial, pieceGroup } from "./_common.js";

export const PAWN_HEIGHT = 0.86;

export function createPawn(side) {
  const { wood, felt } = sideMaterials(side);
  const g = pieceGroup("p", side);

  const profile = [
    [0.0, 0.0],
    [0.3, 0.0],
    [0.3, 0.05],
    [0.27, 0.09],
    [0.17, 0.13],
    [0.14, 0.2],
    [0.18, 0.26], // collar ring
    [0.13, 0.31],
    [0.1, 0.42],
    [0.135, 0.48], // neck flare (the "saucer")
    [0.115, 0.52],
    [0.09, 0.56],
  ];
  g.add(turned(profile, wood));
  g.add(finial(0.17, 0.69, wood)); // head ball
  g.add(feltPad(0.3, felt));
  return g;
}
