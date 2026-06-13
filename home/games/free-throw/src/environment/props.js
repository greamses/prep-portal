import * as THREE from "three";
import { createWoodTexture, createChainLinkTexture } from "./textures.js";

export function buildPropsAndFence(scene) {
  buildFence(scene);
  buildCourtProps(scene);
  buildLifeElements(scene);
}

function buildFence(scene) {
  const fenceMat = new THREE.MeshStandardMaterial({
    map: createChainLinkTexture(), transparent: true, alphaTest: 0.3,
    side: THREE.DoubleSide, metalness: 0.7, roughness: 0.4, color: 0x99aabb
  });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x8a929a, metalness: 0.8, roughness: 0.3 });

  const fenceZ = -12.2, fH = 3.2, fW = 18;
  const fence = new THREE.Mesh(new THREE.PlaneGeometry(fW, fH), fenceMat);
  fence.position.set(0, fH / 2, fenceZ);
  fence.castShadow = true;
  scene.add(fence);

  const railGeo = new THREE.CylinderGeometry(0.04, 0.04, fW, 8);
  const top = new THREE.Mesh(railGeo, postMat);
  top.rotation.z = Math.PI / 2;
  top.position.set(0, fH, fenceZ);
  scene.add(top);

  for (let x = -fW / 2; x <= fW / 2 + 0.01; x += 3) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, fH + 0.2, 10), postMat);
    post.position.set(x, (fH + 0.2) / 2, fenceZ);
    post.castShadow = true;
    scene.add(post);
  }

  buildBunting(scene, -fW/2 + 0.4, fW/2 - 0.4, fH - 0.05, fenceZ + 0.02);
}

function buildBunting(scene, xStart, xEnd, y, z) {
  const colors =[0xff5a5f, 0xffd23f, 0x3ec1d3, 0xff9a3c, 0x6cc24a, 0xe05fbf];
  const string = new THREE.Mesh(new THREE.BoxGeometry(xEnd - xStart, 0.015, 0.015), new THREE.MeshStandardMaterial({ color: 0x111 }));
  string.position.set((xStart + xEnd) / 2, y, z);
  scene.add(string);

  let i = 0;
  for (let x = xStart; x <= xEnd; x += 0.42, i++) {
    const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide, roughness: 0.8 });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-0.14,0,0, 0.14,0,0, 0,-0.36,0]), 3));
    geo.setIndex([0, 1, 2]); geo.computeVertexNormals();
    const flag = new THREE.Mesh(geo, mat);
    flag.position.set(x, y - 0.02, z + 0.005);
    flag.rotation.z = (Math.random() - 0.5) * 0.15;
    scene.add(flag);
  }
}

function buildCourtProps(scene) {
  // Real Wood Bench
  const woodMat = new THREE.MeshStandardMaterial({ map: createWoodTexture(), roughness: 0.8 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.5), woodMat);
  bench.position.set(7.2, 0.55, 1.5);
  bench.castShadow = true; bench.receiveShadow = true;
  scene.add(bench);
  [-1.0, 1.0].forEach(lx => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.5), woodMat);
    leg.position.set(7.2 + lx, 0.275, 1.5);
    leg.castShadow = true; scene.add(leg);
  });

  // Metallic Trophy
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.15 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.10, 0.32, 32), goldMat);
  cup.position.set(7.7, 0.78, 1.5);
  cup.castShadow = true; scene.add(cup);

  // Leftover Basketball on the court
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xc44512, roughness: 0.85, bumpScale: 0.02 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), ballMat);
  ball.position.set(-4.5, 0.12, -2);
  ball.rotation.set(Math.random(), Math.random(), 0);
  ball.castShadow = true; ball.receiveShadow = true;
  scene.add(ball);
}

function buildLifeElements(scene) {
  // Scattered Autumn Leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xc45c12, side: THREE.DoubleSide, roughness: 0.9 });
  const leafGeo = new THREE.PlaneGeometry(0.1, 0.15);
  for(let i=0; i<30; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set((Math.random()-0.5)*14, 0.015, (Math.random()-0.5)*14 - 3);
    leaf.rotation.set(-Math.PI/2, 0, Math.random() * Math.PI * 2);
    leaf.receiveShadow = true;
    scene.add(leaf);
  }

  // Flock of Birds in the distance
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  for(let i=0; i<7; i++) {
    const bird = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 3), birdMat);
    bird.position.set(10 + Math.random()*5, 15 + Math.random()*2, -20 + Math.random()*5);
    bird.rotation.set(Math.PI/2, 0, -Math.PI/4 + (Math.random()-0.5)*0.2);
    scene.add(bird);
  }
}