import * as THREE from "three";
import { createAsphaltTexture, createGrassTexture } from "./textures.js";

export function buildCourt(scene) {
  // Ground / Grass
  const grassTex = createGrassTexture();
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 1,
    metalness: 0
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Asphalt Court
  const courtMat = new THREE.MeshStandardMaterial({
    map: createAsphaltTexture(),
    roughness: 0.9,
    metalness: 0.05,
  });
  const court = new THREE.Mesh(new THREE.PlaneGeometry(16, 18), courtMat);
  court.rotation.x = -Math.PI / 2;
  court.position.set(0, 0.0, -3);
  court.receiveShadow = true;
  scene.add(court);
  
  // Red concrete curbs with beveled look
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x9b2a22,
    roughness: 0.85,
    bumpMap: createAsphaltTexture(),
    bumpScale: 0.02
  });
  const curbT = 0.4,
    curbH = 0.18;
  const zF = 6,
    zB = -12,
    xH = 8;
  
  const back = new THREE.Mesh(new THREE.BoxGeometry(xH * 2 + curbT * 2, curbH, curbT), curbMat);
  back.position.set(0, curbH / 2, zB - curbT / 2);
  back.castShadow = true;
  back.receiveShadow = true;
  scene.add(back);
  
  const sideGeo = new THREE.BoxGeometry(curbT, curbH, zF - zB);
  const left = new THREE.Mesh(sideGeo, curbMat);
  left.position.set(-xH - curbT / 2, curbH / 2, (zF + zB) / 2);
  left.castShadow = true;
  left.receiveShadow = true;
  scene.add(left);
  
  const right = new THREE.Mesh(sideGeo, curbMat);
  right.position.set(xH + curbT / 2, curbH / 2, (zF + zB) / 2);
  right.castShadow = true;
  right.receiveShadow = true;
  scene.add(right);
  
  addCourtLines(scene);
}

function addCourtLines(scene) {
  // Slightly faded, realistic paint material
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.9,
    transparent: true,
    opacity: 0.85
  });
  
  const line = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.012, z);
    scene.add(m);
  };
  
  line(3.66, 0.06, 0, -8);
  line(3.66, 0.06, 0, -3.4);
  line(0.06, 4.6, -1.83, -5.7);
  line(0.06, 4.6, 1.83, -5.7);
  
  const circle = new THREE.Mesh(
    new THREE.RingGeometry(1.78, 1.84, 64),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide, opacity: 0.85, transparent: true })
  );
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(0, 0.012, -3.4);
  scene.add(circle);
  
  const arc = new THREE.Mesh(
    new THREE.RingGeometry(6.72, 6.78, 96, 1, Math.PI * 0.18, Math.PI * 0.64),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide, opacity: 0.85, transparent: true })
  );
  arc.rotation.x = -Math.PI / 2;
  arc.position.set(0, 0.012, -8);
  scene.add(arc);
  
  const bx = 7.85,
    bz1 = -11.85,
    bz2 = 5.85;
  line(bx * 2, 0.06, 0, bz1);
  line(bx * 2, 0.06, 0, bz2);
  line(0.06, bz2 - bz1, -bx, (bz1 + bz2) / 2);
  line(0.06, bz2 - bz1, bx, (bz1 + bz2) / 2);
}