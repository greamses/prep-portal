/* =====================================================================
   Renderer, scene graph and the cube itself.

   The camera is fixed; the whole cube lives in `cubeGroup` whose
   orientation the player changes. This module owns the THREE objects that
   the rest of the game reads, plus cube construction and camera/resize.
   ===================================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { SP, HALF, FACE_COLORS, WHITE, YELLOW, DIRS } from "./constants.js";
import { canvas, wrap } from "./dom.js";

/* ---------- renderer / scene ----------------------------------------- */
export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
let camDist = 8.6;

export function placeCamera() {
  // fixed three-quarter view so front (+z), right (+x) and top (+y) read
  const d = camDist;
  camera.position.set(d * 0.46, d * 0.4, d * 0.79);
  camera.lookAt(0, 0, 0);
}
placeCamera();

// Dolly the camera in/out (pinch + wheel), clamped to a sane range.
export function dollyCamera(delta) {
  camDist = Math.max(6, Math.min(14, camDist + delta));
  placeCamera();
}

scene.add(new THREE.AmbientLight(0xffffff, 0.62));
const key = new THREE.DirectionalLight(0xffffff, 0.85);
key.position.set(6, 10, 7);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 1;
key.shadow.camera.far = 40;
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -8;
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.32);
fill.position.set(-7, -3, -5);
scene.add(fill);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.ShadowMaterial({ opacity: 0.15 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2.8;
ground.receiveShadow = true;
scene.add(ground);

/* ---------- build the cube ------------------------------------------ */
export const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

export const cubies = [];
const cubieGeo = new RoundedBoxGeometry(0.96, 0.96, 0.96, 4, 0.12);
const plasticMat = new THREE.MeshStandardMaterial({
  color: 0x26231f,
  roughness: 0.62,
  metalness: 0.05,
});
const stickerGeo = new RoundedBoxGeometry(0.78, 0.78, 0.06, 3, 0.1);

export function createCubie(x, y, z) {
  const cubie = new THREE.Mesh(cubieGeo, plasticMat);
  cubie.castShadow = true;
  cubie.receiveShadow = true;
  cubie.position.set(x * SP, y * SP, z * SP);
  cubie.userData.stickers = [];

  const coords = { x, y, z };
  for (const dir of DIRS) {
    const axis = dir.x ? "x" : dir.y ? "y" : "z";
    const sign = dir.x || dir.y || dir.z;
    if (coords[axis] !== sign) continue; // interior face

    const color = FACE_COLORS[`${dir.x},${dir.y},${dir.z}`];
    const sticker = new THREE.Mesh(
      stickerGeo,
      new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0 }),
    );
    sticker.position.copy(dir).multiplyScalar(HALF - 0.01);
    if (axis === "x") sticker.rotation.y = Math.PI / 2;
    else if (axis === "y") sticker.rotation.x = Math.PI / 2;
    sticker.userData.baseColor = color;
    cubie.add(sticker);
    cubie.userData.stickers.push({ dir: dir.clone(), color });
  }

  const colors = cubie.userData.stickers.map((s) => s.color);
  const n = colors.length;
  const hasWhite = colors.includes(WHITE);
  const hasYellow = colors.includes(YELLOW);
  cubie.userData.crossPiece =
    n === 1 ? colors[0] !== YELLOW : n === 2 ? hasWhite : false;
  cubie.userData.firstLayerPiece =
    cubie.userData.crossPiece || (n === 3 && hasWhite);
  cubie.userData.secondLayerPiece =
    cubie.userData.firstLayerPiece || (n === 2 && !hasWhite && !hasYellow);
  cubie.userData.lastLayerPiece = hasYellow;

  return cubie;
}

// Fill `group` with 26 cubies, collecting them into `arr`.
export function populateCube(group, arr) {
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue; // hidden core
        const cubie = createCubie(x, y, z);
        group.add(cubie);
        arr.push(cubie);
      }
}
populateCube(cubeGroup, cubies);

// Reset every cubie to its solved home position/orientation in place.
export function rebuildSolved() {
  let idx = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const c = cubies[idx++];
        c.position.set(x * SP, y * SP, z * SP);
        c.quaternion.identity();
      }
}

/* ---------- resize --------------------------------------------------- */
export function resize() {
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
