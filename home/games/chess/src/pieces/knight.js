/**
 * knight.js — the horse. The one piece that can't be lathed, so the head is
 * an extruded side-profile silhouette (the classic way knights are carved)
 * mounted on a short turned pedestal. Knights are rotated to face the enemy:
 * white looks toward -z (the far side), black looks toward +z.
 */
import * as THREE from "three";
import { sideMaterials } from "../materials.js";
import { turned, feltPad, pieceGroup } from "./_common.js";

export const KNIGHT_HEIGHT = 1.12;

export function createKnight(side) {
  const { wood, felt } = sideMaterials(side);
  const g = pieceGroup("n", side);

  /* ---------- Pedestal ---------- */
  const pedestal = [
    [0.0, 0.0],
    [0.33, 0.0],
    [0.33, 0.06],
    [0.29, 0.1],
    [0.19, 0.15],
    [0.22, 0.21], // base ring
    [0.18, 0.27],
    [0.2, 0.33],
  ];
  g.add(turned(pedestal, wood));

  /* ---------- Horse head (extruded silhouette, facing +x) ---------- */
  const s = new THREE.Shape();
  s.moveTo(-0.2, 0.3);
  s.lineTo(-0.24, 0.55);
  s.lineTo(-0.22, 0.8);
  s.lineTo(-0.17, 0.98);
  s.lineTo(-0.06, 1.1); // poll
  s.lineTo(0.0, 1.2); // ear tip
  s.lineTo(0.08, 1.07);
  s.lineTo(0.15, 1.13); // forelock / forehead
  s.lineTo(0.29, 1.0); // brow
  s.lineTo(0.42, 0.9); // nose bridge
  s.lineTo(0.45, 0.78); // muzzle front
  s.lineTo(0.38, 0.71); // mouth
  s.lineTo(0.22, 0.73); // jaw
  s.lineTo(0.12, 0.64); // throat
  s.lineTo(0.07, 0.48);
  s.lineTo(0.12, 0.34); // front of neck base
  s.lineTo(-0.2, 0.3);

  const depth = 0.26;
  const headGeo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 3,
  });
  headGeo.translate(0, 0, -depth / 2); // centre on z
  headGeo.computeVertexNormals();
  const head = new THREE.Mesh(headGeo, wood);
  head.castShadow = true;
  head.receiveShadow = true;

  // A carved mane ridge running down the back of the neck.
  const maneGeo = new THREE.BoxGeometry(0.05, 0.55, 0.18);
  const mane = new THREE.Mesh(maneGeo, wood);
  mane.position.set(-0.19, 0.72, 0);
  mane.rotation.z = 0.18;
  mane.castShadow = true;
  head.add(mane);

  // Two inset eyes.
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x120a05, roughness: 0.6 });
  const eyeGeo = new THREE.SphereGeometry(0.035, 12, 8);
  for (const z of [depth / 2 - 0.02, -depth / 2 + 0.02]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.2, 0.98, z);
    head.add(eye);
  }

  g.add(head);
  g.add(feltPad(0.33, felt));

  // Face the opponent: white looks toward -z (far side), black toward +z.
  g.rotation.y = side === "white" ? Math.PI / 2 : -Math.PI / 2;
  return g;
}
