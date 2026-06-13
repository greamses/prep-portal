import * as THREE from "three";

export function buildLighting(scene) {
  // Richer ambient & hemisphere for outdoor GI simulation
  const hemi = new THREE.HemisphereLight(0xfffdf2, 0x3d4a3e, 0.7);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambient);

  // Warm afternoon sun
  // FIXED: shadow map was 4096×4096 — extreme GPU cost with no visible benefit
  // at this scale. 1024 is sharp enough and ~16× cheaper to render/store.
  const sun = new THREE.DirectionalLight(0xffecd4, 2.5);
  sun.position.set(-12, 18, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -25;
  sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // Soft blue sky bounce lighting from the opposite direction
  const skyBounce = new THREE.DirectionalLight(0x90b0e0, 0.6);
  skyBounce.position.set(10, 8, -10);
  scene.add(skyBounce);
}
