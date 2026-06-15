import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Add a standard lab lighting rig to any scene.
 * Usage: applyLabLighting(scene)
 */
export function applyLabLighting(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff8e7, 1.2);
  key.position.set(5, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xa8c8ff, 0.4);
  fill.position.set(-5, 3, -4);
  scene.add(fill);

  const rim = new THREE.PointLight(0x4361ee, 0.6, 20);
  rim.position.set(0, 8, -6);
  scene.add(rim);

  return { ambient, key, fill, rim };
}
