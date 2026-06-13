// spaceship.js — refined flying saucer with improved detail and realism
import * as THREE from "three";

export function buildSpaceship(scene) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  // ---------- materials ----------
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x7a8b9b,
    roughness: 0.35,
    metalness: 0.9,
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.6,
    metalness: 0.8,
  });
  const emissiveTrimMat = new THREE.MeshStandardMaterial({
    color: 0x00eeff,
    emissive: 0x008899,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ffdd,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
    emissive: 0x112222,
    emissiveIntensity: 0.3,
  });
  const podGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffdd55,
    emissive: 0xffaa00,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xaaccff,
    emissive: 0x446688,
    emissiveIntensity: 0.7,
    roughness: 0.2,
  });

  // ---------- main hull (lathe from detailed profile) ----------
  const profilePoints = [
    [0.0, 0.38], // centre top (dome base)
    [0.6, 0.38],
    [0.9, 0.32],
    [1.4, 0.18],
    [1.7, 0.0],
    [1.78, -0.2],
    [1.6, -0.45],
    [1.1, -0.5],
    [0.0, -0.5],
  ].map((p) => new THREE.Vector2(p[0], p[1]));

  const hull = new THREE.Mesh(
    new THREE.LatheGeometry(profilePoints, 64),
    hullMat,
  );
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // ---------- outer rim trim ----------
  const rimTrim = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.08, 16, 64),
    emissiveTrimMat,
  );
  rimTrim.rotation.x = Math.PI / 2;
  rimTrim.position.y = -0.15;
  group.add(rimTrim);

  // ---------- panel lines (thin torus rings) ----------
  const panelRadii = [1.2, 1.4, 1.6];
  panelRadii.forEach((r) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.025, 8, 64),
      darkTrimMat,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.0; // approximate intersection with hull
    group.add(ring);
  });

  // ---------- small windows around the upper rim ----------
  const windowCount = 16;
  const windowRadius = 1.65;
  const windowY = 0.12;
  const windowGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 8);
  for (let i = 0; i < windowCount; i++) {
    const angle = (i / windowCount) * Math.PI * 2;
    const win = new THREE.Mesh(windowGeo, windowMat);
    win.position.set(
      Math.cos(angle) * windowRadius,
      windowY,
      Math.sin(angle) * windowRadius,
    );
    win.rotation.x = Math.PI / 2; // face outward
    group.add(win);
  }

  // ---------- dome, base ring & antenna ----------
  const domeBaseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.05, 8, 32),
    darkTrimMat,
  );
  domeBaseRing.position.y = 0.38;
  domeBaseRing.rotation.x = Math.PI / 2;
  group.add(domeBaseRing);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    glassMat,
  );
  dome.position.y = 0.38;
  group.add(dome);

  const antennaPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8),
    new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.3,
      metalness: 0.9,
    }),
  );
  antennaPole.position.y = 0.9;
  group.add(antennaPole);

  const antennaBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff2200,
      emissiveIntensity: 0.8,
    }),
  );
  antennaBall.position.y = 1.12;
  group.add(antennaBall);

  // ---------- pilot silhouette ----------
  const pilotBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
  );
  pilotBody.position.y = 0.55;
  group.add(pilotBody);

  const pilotHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 }),
  );
  pilotHead.position.y = 0.8;
  group.add(pilotHead);

  // ---------- rim light pods (detailed) ----------
  const pods = [];
  const podBaseGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.15, 8);
  const podBaseMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.5,
    metalness: 0.8,
  });
  const podLightGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const podCount = 12;

  for (let i = 0; i < podCount; i++) {
    const a = (i / podCount) * Math.PI * 2;
    const podGroup = new THREE.Group();
    podGroup.position.set(Math.cos(a) * 1.55, -0.05, Math.sin(a) * 1.55);

    const base = new THREE.Mesh(podBaseGeo, podBaseMat);
    base.position.y = -0.07;
    podGroup.add(base);

    const light = new THREE.Mesh(podLightGeo, podGlowMat.clone()); // clone for individual control
    podGroup.add(light);

    group.add(podGroup);
    pods.push({ light, group: podGroup });
  }

  // ---------- under‑hull details ----------
  const underCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.7, 0.3, 16),
    darkTrimMat,
  );
  underCylinder.position.y = -0.6;
  group.add(underCylinder);

  // landing pads (3)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const padGroup = new THREE.Group();
    padGroup.position.set(Math.cos(angle) * 0.9, -0.78, Math.sin(angle) * 0.9);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6),
      darkTrimMat,
    );
    leg.position.y = -0.15;
    padGroup.add(leg);

    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8),
      darkTrimMat,
    );
    foot.position.y = -0.32;
    padGroup.add(foot);

    group.add(padGroup);
  }

  // ---------- tractor beam & under‑glow ----------
  const beamCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 1.6, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x66ffcc,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beamCone.position.y = -1.15;
  group.add(beamCone);

  const underLight = new THREE.PointLight(0x66ffcc, 1.5, 10, 2);
  underLight.position.y = -0.5;
  group.add(underLight);

  // ---------- collect hue‑changeable parts ----------
  const hueMaterials = [
    rimTrim.material,
    antennaBall.material,
    beamCone.material,
    underLight, // PointLight – handled separately
  ];
  const podLightMaterials = pods.map((p) => p.light.material);

  // ---------- public API ----------
  return {
    group,

    setHue(hueDeg) {
      const col = new THREE.Color().setHSL((hueDeg % 360) / 360, 0.9, 0.6);
      const emissiveCol = col.clone().multiplyScalar(0.4);

      // emissive trim ring
      rimTrim.material.color.copy(col);
      rimTrim.material.emissive.copy(emissiveCol);

      // antenna ball
      antennaBall.material.color.copy(col);
      antennaBall.material.emissive.copy(col);

      // pod lights
      podLightMaterials.forEach((mat) => {
        mat.color.copy(col);
        mat.emissive.copy(col);
      });

      // beam
      beamCone.material.color.copy(col);

      // under‑glow light
      underLight.color.copy(col);
    },

    update(t) {
      // slow rotation
      group.rotation.y += 0.01;

      // pulsating pod lights
      const basePulse = 1.2 + Math.sin(t * 5) * 0.5;
      pods.forEach((p, i) => {
        p.light.material.emissiveIntensity =
          basePulse + Math.sin(t * 7 + i) * 0.3;
      });

      // tractor beam opacity
      beamCone.material.opacity = 0.1 + Math.abs(Math.sin(t * 2)) * 0.08;

      // blinking antenna light
      antennaBall.material.emissiveIntensity = 0.5 + Math.sin(t * 8) * 0.5;
    },
  };
}
