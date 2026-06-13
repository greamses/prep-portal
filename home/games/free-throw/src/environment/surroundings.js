import * as THREE from "three";
import { createBrickTexture, createRoofTexture, createWoodTexture } from "./textures.js";

export function buildSurroundings(scene) {
  // 1. ATMOSPHERICS & LIGHTING
  scene.background = new THREE.Color(0x8eb3ce); // Soft sky blue
  scene.fog = new THREE.FogExp2(0x8eb3ce, 0.025); // Blends distant mountains into sky

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft global illumination
  scene.add(ambientLight);
  
  const sunLight = new THREE.DirectionalLight(0xfff0dd, 1.2); // Warm sun
  sunLight.position.set(40, 50, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 150;
  sunLight.shadow.camera.left = -30;
  sunLight.shadow.camera.right = 30;
  sunLight.shadow.camera.top = 30;
  sunLight.shadow.camera.bottom = -30;
  scene.add(sunLight);

  // 2. DETAILED TERRAIN & SCENERY
  buildDetailedGround(scene);
  buildMountains(scene);
  buildRocks(scene);
  
  // 3. TEXTURES
  const roofTex = createRoofTexture();
  const brick1 = createBrickTexture([160, 60, 50], [120, 40, 30]);
  const brick2 = createBrickTexture([180, 160, 140],[150, 130, 110]);
  const brick3 = createBrickTexture([100, 110, 130],[80, 90, 110]);

  // 4. PLACEMENT OF HOUSES
  buildRealisticHouse(scene, 7.5, -18, brick1, roofTex); 
  buildRealisticHouse(scene, -8.0, -18.5, brick2, roofTex); 
  buildRealisticHouse(scene, 14.5, -17.5, brick3, roofTex);

  // 5. EXPANDED FOLIAGE
  const treeSpots = [[-13, -14], [-10, -15], [-6.5, -15.5], [-4, -16],
    [ 4, -16], [ 8, -15.5], [11, -15], [17, -14.5], 
    [-15, -18], [-2, -18],[3, -18],
    [-22, -10], [-19, -6],[22, -10], [25, -14] // Added peripheral trees
  ];
  treeSpots.forEach(([x, z]) => buildTree(scene, x, z));

  // Dense, varied hedges with pathing cutouts
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x4a7c36, roughness: 1, flatShading: true });
  for (let x = -16; x <= 16; x += 0.8) {
    // Cutout paths leading to house doors (Door X offset is -1.05 from house center)
    if (Math.abs(x - 6.45) < 1.2) continue;  // Path for house 1
    if (Math.abs(x - -9.05) < 1.2) continue; // Path for house 2
    if (Math.abs(x - 13.45) < 1.2) continue; // Path for house 3

    const s = 0.7 + Math.random() * 0.4;
    const bush = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 12), hedgeMat);
    deformGeometry(bush.geometry, 0.15); // make organic
    bush.position.set(x + (Math.random() - 0.5) * 0.3, s * 0.6, -12.8 + (Math.random() - 0.5) * 0.4);
    bush.castShadow = true; 
    bush.receiveShadow = true;
    scene.add(bush);
  }
}

function buildDetailedGround(scene) {
  const geo = new THREE.PlaneGeometry(100, 100, 64, 64);
  const pos = geo.attributes.position;
  
  // Deform ground to create rolling grassy hills
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i); // This represents world Z before plane rotation
    
    // Flatten the ground specifically where the houses sit (Z approx -18)
    const distanceToHouses = Math.abs(y + 18);
    const flattenFactor = Math.min(1.0, distanceToHouses / 8.0);
    
    // Sine/Cosine waves for rolling terrain
    const noise = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 1.5;
    pos.setZ(i, noise * flattenFactor);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ color: 0x3b5e2b, roughness: 1.0, flatShading: true });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

function buildRocks(scene) {
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 35; i++) {
    const size = 0.2 + Math.random() * 0.4;
    const rockGeo = new THREE.DodecahedronGeometry(size, 0);
    deformGeometry(rockGeo, 0.1);
    
    const rock = new THREE.Mesh(rockGeo, rockMat);
    // Scatter around bounds
    const x = (Math.random() - 0.5) * 60;
    const z = 5 - Math.random() * 30;
    
    rock.position.set(x, size * 0.4, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true; rock.receiveShadow = true;
    scene.add(rock);
  }
}

function buildRealisticHouse(scene, x, z, wallMap, roofMap) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  
  const w = 4.2, h = 2.4, d = 3.6;
  
  // Brick Walls
  const wallMat = new THREE.MeshStandardMaterial({ map: wallMap, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.set(0, h / 2, 0);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  // Tiled Roof with Overhangs
  const roofMat = new THREE.MeshStandardMaterial({ map: roofMap, roughness: 0.8 });
  const roofH = 1.6;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w+0.8, d+0.8) / 2, roofH, 4), roofMat);
  roof.position.set(0, h + roofH / 2, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true; roof.receiveShadow = true;
  group.add(roof);

  // Wooden Front Door
  const doorW = 0.8, doorH = 1.7;
  const doorMat = new THREE.MeshStandardMaterial({ map: createWoodTexture(), roughness: 0.7 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.05), doorMat);
  door.position.set(-w/4, doorH/2, d/2 + 0.02);
  group.add(door);

  // Stone Pathway connecting door to the street
  const pathD = 6.5;
  const pathGeo = new THREE.PlaneGeometry(1.2, pathD);
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 1.0 });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(-w/4, 0.05, d/2 + pathD/2); // Floats slightly to prevent Z-fighting
  path.receiveShadow = true;
  group.add(path);

  // [FIX APPLIED] Standard transparent glass compatible with all Three.js versions.
  const winW = 1.0, winH = 1.0;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const glassMat = new THREE.MeshPhysicalMaterial({ 
    color: 0x88ccff, 
    metalness: 0.2, 
    roughness: 0.05, 
    envMapIntensity: 1.0,
    transparent: true,
    opacity: 0.6 // Replaces transmission/thickness
  });

  const buildWindow = (wx, wy) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(winW+0.1, winH+0.1, 0.1), frameMat);
    frame.position.set(wx, wy, d/2 + 0.03);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
    glass.position.set(wx, wy, d/2 + 0.081);
    
    const sill = new THREE.Mesh(new THREE.BoxGeometry(winW+0.2, 0.08, 0.15), frameMat);
    sill.position.set(wx, wy - winH/2 - 0.04, d/2 + 0.05);
    
    group.add(frame, glass, sill);
  };
  buildWindow(w/4, h * 0.6);

  // Porch Light
  const lightFix = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  lightFix.position.set(-w/4 + 0.7, 1.8, d/2 + 0.1);
  group.add(lightFix);
  
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshBasicMaterial({ color: 0xffeeba }));
  bulb.position.set(-w/4 + 0.7, 1.75, d/2 + 0.15);
  group.add(bulb);
  
  const pLight = new THREE.PointLight(0xffeeba, 0.8, 5);
  pLight.position.copy(bulb.position);
  group.add(pLight);

  scene.add(group);
}

function buildMountains(scene) {
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x546b80, roughness: 1, flatShading: true });
  const mtnPositions = [[-22, 0, -32, 12, 10],[-12, 0, -36, 14, 12],[  2, 0, -38, 16, 13],[ 16, 0, -34, 13, 10],[ 26, 0, -30, 11,  8]];
  
  mtnPositions.forEach(([x, y, z, r, h]) => {
    const geo = new THREE.ConeGeometry(r, h, 6);
    deformGeometry(geo, 1.5); // Jagged mountains
    const m = new THREE.Mesh(geo, mountainMat);
    m.position.set(x, y + h / 2 - 1, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  });
}

function buildTree(scene, x, z) {
  const group = new THREE.Group();
  
  // Random variation
  const scale = 0.8 + Math.random() * 0.4;
  const trunkH = 1.0 + Math.random() * 0.4;
  const trunkR = 0.12 + Math.random() * 0.1;
  
  // Trunk with slight taper
  const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.8, trunkR, trunkH, 8, 4);
  const trunkMat = new THREE.MeshStandardMaterial({
    map: createWoodTexture(),
    roughness: 1,
    flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);
  
  // Small branches
  const branchMat = new THREE.MeshStandardMaterial({
    color: 0x5d3a1a,
    roughness: 0.9,
    flatShading: true
  });
  
  const branchCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
    const branchGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.5, 5);
    const branch = new THREE.Mesh(branchGeo, branchMat);
    branch.position.y = trunkH * 1.2;
    branch.rotation.z = Math.PI / 3 + Math.random() * 0.3;
    branch.rotation.y = angle;
    branch.castShadow = true;
    group.add(branch);
  }
  
  // Leaf clusters using clustered spheres (more organic than cones)
  const leafColors = [0x2f7a3a, 0x3a8a3f, 0x256d33, 0x1f5c28, 0x3d9140];
  const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
  
  // Main canopy - clustered spheres for fuller look
  const canopyGroup = new THREE.Group();
  
  // Central dense canopy using spheres
  const mainLeafGeo = new THREE.SphereGeometry(0.8 * scale, 8, 6);
  const leafMat = new THREE.MeshStandardMaterial({
    color: leafColor,
    roughness: 0.8,
    flatShading: true
  });
  
  const positions = [
    [0, trunkH * 0.9, 0, 0.9],
    [0.3, trunkH * 1.1, 0.3, 0.7],
    [-0.3, trunkH * 1.1, -0.2, 0.7],
    [0.2, trunkH * 1.3, -0.3, 0.65],
    [-0.2, trunkH * 1.3, 0.3, 0.65],
    [0, trunkH * 1.5, 0, 0.55],
    [0.4, trunkH * 1.15, -0.1, 0.5],
    [-0.4, trunkH * 1.15, 0.1, 0.5]
  ];
  
  positions.forEach(([lx, ly, lz, size]) => {
    const geo = new THREE.SphereGeometry(size * scale, 7, 5);
    // Slightly deform leaves
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      pos.setXYZ(
        i,
        x + (Math.random() - 0.5) * 0.15,
        y + (Math.random() - 0.5) * 0.15,
        z + (Math.random() - 0.5) * 0.15
      );
    }
    geo.computeVertexNormals();
    
    // Darker variant for some leaves
    const leafVariation = new THREE.MeshStandardMaterial({
      color: new THREE.Color(leafColor).multiplyScalar(0.8 + Math.random() * 0.3),
      roughness: 0.8,
      flatShading: true
    });
    
    const cluster = new THREE.Mesh(geo, leafVariation);
    cluster.position.set(lx * scale, ly, lz * scale);
    cluster.rotation.set(Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.3);
    cluster.castShadow = true;
    cluster.receiveShadow = true;
    canopyGroup.add(cluster);
  });
  
  // Add some hanging leaf tendrils
  for (let i = 0; i < 4; i++) {
    const tendrilGeo = new THREE.ConeGeometry(0.2, 0.6, 5, 4);
    const tendril = new THREE.Mesh(tendrilGeo, new THREE.MeshStandardMaterial({
      color: new THREE.Color(leafColor).multiplyScalar(0.9),
      roughness: 0.8,
      flatShading: true
    }));
    const angle = (i / 4) * Math.PI * 2;
    tendril.position.set(
      Math.cos(angle) * 0.6 * scale,
      trunkH * 0.8,
      Math.sin(angle) * 0.6 * scale
    );
    tendril.rotation.z = Math.PI * 0.7;
    tendril.rotation.y = angle;
    tendril.castShadow = true;
    canopyGroup.add(tendril);
  }
  
  group.add(canopyGroup);
  group.position.set(x, 0, z);
  group.scale.setScalar(1);
  group.rotation.y = Math.random() * Math.PI * 2;
  
  scene.add(group);
}

function deformGeometry(geometry, amount) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) <= 0.01) continue; // Keep bases flat/grounded
    pos.setXYZ(
      i,
      pos.getX(i) + (Math.random() - 0.5) * amount,
      pos.getY(i) + (Math.random() - 0.5) * amount,
      pos.getZ(i) + (Math.random() - 0.5) * amount
    );
  }
  geometry.computeVertexNormals();
}