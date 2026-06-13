/**
 * scene.js — renderer, camera, orbit controls, lighting and the room the
 * board sits in. Returns the handles main.js needs to drive the loop.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BOARD_SIZE } from "./config.js";

const isMobile =
  /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
  window.innerWidth < 1024;

export function createScene(canvas) {
  /* ---------- Renderer ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

  /* ---------- Scene ---------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0d13);
  scene.fog = new THREE.Fog(0x0a0d13, 22, 46);

  /* ---------- Camera + controls ---------- */
  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    120
  );
  camera.position.set(0, 9.5, 9.5);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;
  controls.minDistance = 7;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * 0.49; // never go under the table
  controls.minPolarAngle = Math.PI * 0.12;
  controls.enablePan = false;
  controls.update();

  /* ---------- Lighting ---------- */
  const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x20140a, 0.55);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(ambient);

  // Key spotlight, like a lamp over the table.
  const key = new THREE.SpotLight(0xfff2da, 90, 60, Math.PI / 5, 0.45, 1.6);
  key.position.set(-6, 16, 8);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  key.shadow.camera.near = 4;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 4;
  scene.add(key);
  scene.add(key.target);

  // Cool fill from the opposite side to shape the pieces.
  const fill = new THREE.DirectionalLight(0x9db4ff, 0.4);
  fill.position.set(8, 9, -6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffd9a0, 0.5);
  rim.position.set(0, 5, -12);
  scene.add(rim);

  /* ---------- Room (subtle floor + radial glow) ---------- */
  const floorGeo = new THREE.CircleGeometry(40, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0d1119,
    roughness: 0.92,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.9;
  floor.receiveShadow = true;
  scene.add(floor);

  // Faint glow ring under the board for depth.
  const glowGeo = new THREE.RingGeometry(BOARD_SIZE * 0.5, BOARD_SIZE * 0.9, 64);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x1a2740,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.55;
  scene.add(glow);

  /* ---------- Resize ---------- */
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  return { renderer, scene, camera, controls, isMobile };
}
