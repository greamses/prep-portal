/**
 * board.js — the physical chessboard: 64 inlaid squares, a turned-wood frame
 * with bevelled edges, and engraved file/rank labels. Returns a group plus a
 * `squareMeshes` lookup so the interaction layer can highlight individual
 * squares.
 */
import * as THREE from "three";
import { getMaterials } from "./materials.js";
import { SQUARE, BOARD, BOARD_SIZE, FRAME, squareToWorld, isLightSquare } from "./config.js";

const TILE_H = 0.18; // square thickness
const FRAME_H = 0.32;

export function createBoard() {
  const group = new THREE.Group();
  const mats = getMaterials();
  const squareMeshes = []; // squareMeshes[file][rank]

  /* ---------- Squares ---------- */
  const tileGeo = new THREE.BoxGeometry(SQUARE, TILE_H, SQUARE);
  for (let file = 0; file < BOARD; file++) {
    squareMeshes[file] = [];
    for (let rank = 0; rank < BOARD; rank++) {
      const mat = (isLightSquare(file, rank) ? mats.lightSquare : mats.darkSquare).clone();
      const tile = new THREE.Mesh(tileGeo, mat);
      const pos = squareToWorld(file, rank, -TILE_H / 2);
      tile.position.copy(pos);
      tile.receiveShadow = true;
      tile.userData.square = { file, rank };
      group.add(tile);
      squareMeshes[file][rank] = tile;
    }
  }

  /* ---------- Frame ---------- */
  const outer = BOARD_SIZE + FRAME * 2;
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-outer / 2, -outer / 2);
  frameShape.lineTo(outer / 2, -outer / 2);
  frameShape.lineTo(outer / 2, outer / 2);
  frameShape.lineTo(-outer / 2, outer / 2);
  frameShape.lineTo(-outer / 2, -outer / 2);
  const hole = new THREE.Path();
  const inner = BOARD_SIZE / 2;
  hole.moveTo(-inner, -inner);
  hole.lineTo(inner, -inner);
  hole.lineTo(inner, inner);
  hole.lineTo(-inner, inner);
  hole.lineTo(-inner, -inner);
  frameShape.holes.push(hole);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: FRAME_H,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 3,
  });
  frameGeo.rotateX(-Math.PI / 2);
  const frame = new THREE.Mesh(frameGeo, mats.frame);
  frame.position.y = -FRAME_H;
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);

  // Solid underside so the board reads as a thick slab from low angles.
  const baseGeo = new THREE.BoxGeometry(outer, 0.3, outer);
  const base = new THREE.Mesh(baseGeo, mats.frame);
  base.position.y = -FRAME_H - 0.15;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  /* ---------- Engraved labels ---------- */
  addLabels(group);

  return { group, squareMeshes };
}

/** File letters a–h and rank numbers 1–8 burnt into the frame. */
function addLabels(group) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const labelMat = new THREE.MeshBasicMaterial({
    color: 0xd9b779,
    transparent: true,
    opacity: 0.85,
  });
  const edge = BOARD_SIZE / 2 + FRAME * 0.5;

  for (let i = 0; i < BOARD; i++) {
    const fileTex = makeLabelTexture(files[i]);
    const rankTex = makeLabelTexture(String(i + 1));
    const fGeo = new THREE.PlaneGeometry(0.4, 0.4);

    // Files along the near edge (+z).
    const f = squareToWorld(i, 0, 0.01);
    const fileMesh = new THREE.Mesh(fGeo, labelMat.clone());
    fileMesh.material.map = fileTex;
    fileMesh.rotation.x = -Math.PI / 2;
    fileMesh.position.set(f.x, 0.01, edge);
    group.add(fileMesh);

    // Ranks along the left edge (-x).
    const r = squareToWorld(0, i, 0.01);
    const rankMesh = new THREE.Mesh(fGeo, labelMat.clone());
    rankMesh.material.map = rankTex;
    rankMesh.rotation.x = -Math.PI / 2;
    rankMesh.position.set(-edge, 0.01, r.z);
    group.add(rankMesh);
  }
}

function makeLabelTexture(text) {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = "#d9b779";
  ctx.font = "bold 40px Cinzel, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, s / 2, s / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
