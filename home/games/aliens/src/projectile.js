// projectile.js — missile, exhaust trail and explosion burst
import * as THREE from 'three';
import { isMobile, CONFIG } from './config.js';

const X_AXIS = new THREE.Vector3(1, 0, 0);
const MAX_TRAIL = isMobile ? 28 : 44;

export function buildProjectile(scene) {
  /* ---- missile ---- */
  const rocket = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8eaef, roughness: 0.3, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 20), bodyMat);
  body.rotation.z = -Math.PI / 2; body.castShadow = true; rocket.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.6, 20),
    new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.35, metalness: 0.4 })
  );
  nose.rotation.z = -Math.PI / 2; nose.position.x = 0.9; nose.castShadow = true; rocket.add(nose);

  const finMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.5, metalness: 0.3 });
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.32), finMat);
    fin.position.x = -0.5;
    fin.rotation.x = (i / 3) * Math.PI * 2;
    fin.position.y = Math.cos((i / 3) * Math.PI * 2) * 0.18;
    fin.position.z = Math.sin((i / 3) * Math.PI * 2) * 0.18;
    rocket.add(fin);
  }

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.9, 14),
    new THREE.MeshBasicMaterial({ color: 0xffc24d, transparent: true, opacity: 0.9 })
  );
  flame.rotation.z = Math.PI / 2; flame.position.x = -1.0; flame.name = 'flame';
  rocket.add(flame);

  const rocketLight = new THREE.PointLight(0xffa033, 0, 6, 2);
  rocketLight.position.x = -0.8; rocket.add(rocketLight);
  rocket.scale.setScalar(1.5);
  scene.add(rocket);

  /* ---- trail ---- */
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_TRAIL * 3), 3));
  const trail = new THREE.Line(
    trailGeo,
    new THREE.LineBasicMaterial({ color: 0xffb04d, transparent: true, opacity: 0.55, depthWrite: false })
  );
  trail.frustumCulled = false; trail.visible = false;
  scene.add(trail);

  /* ---- explosion ---- */
  const N = isMobile ? 50 : 110;
  const exGeo = new THREE.BufferGeometry();
  exGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const exPoints = new THREE.Points(exGeo, new THREE.PointsMaterial({
    color: 0xffce5c, size: 0.4, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  exPoints.visible = false; exPoints.frustumCulled = false; scene.add(exPoints);
  const exShell = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  exShell.visible = false; scene.add(exShell);
  const exLight = new THREE.PointLight(0xffb24d, 0, 22, 2); scene.add(exLight);
  const exVel = new Float32Array(N * 3);

  /* ---- state ---- */
  const flying = { on: false };
  const pos = new THREE.Vector3();
  const dir = new THREE.Vector3(1, 0, 0);
  const detPoint = new THREE.Vector3();
  let travelTarget = 0, travelled = 0;
  let exLife = 0; const exMax = 0.85;

  function orient(d) { rocket.quaternion.setFromUnitVectors(X_AXIS, d); }

  return {
    rocket, trail,
    get isFlying() { return flying.on; },

    dock(muzzle, d) {
      rocket.visible = true;
      rocket.position.copy(muzzle);
      orient(d);
      rocket.getObjectByName('flame').visible = false;
      rocketLight.intensity = 0;
      trail.visible = false;
    },

    launch(muzzle, d, range) {
      flying.on = true;
      dir.copy(d).normalize();
      pos.copy(muzzle);
      detPoint.copy(dir).multiplyScalar(range);     // from turret origin
      travelTarget = muzzle.distanceTo(detPoint);
      travelled = 0;
      rocket.visible = true;
      rocket.position.copy(pos);
      orient(dir);
      rocket.getObjectByName('flame').visible = true;
      rocketLight.intensity = 1.4;
      this._trailPts = [];
      trail.visible = true;
    },

    // returns detonation point (Vector3) on the frame it detonates, else null
    update(dt) {
      if (!flying.on) return null;
      const step = CONFIG.projectileSpeed * dt;
      pos.addScaledVector(dir, step);
      travelled += step;
      rocket.position.copy(pos);

      const flame = rocket.getObjectByName('flame');
      flame.scale.setScalar(0.8 + Math.random() * 0.5);
      rocketLight.intensity = 1.2 + Math.random() * 0.6;

      // trail
      this._trailPts.push(pos.clone());
      if (this._trailPts.length > MAX_TRAIL) this._trailPts.shift();
      const arr = trailGeo.attributes.position.array;
      for (let i = 0; i < this._trailPts.length; i++) {
        arr[i * 3] = this._trailPts[i].x; arr[i * 3 + 1] = this._trailPts[i].y; arr[i * 3 + 2] = this._trailPts[i].z;
      }
      trailGeo.setDrawRange(0, this._trailPts.length);
      trailGeo.attributes.position.needsUpdate = true;

      if (travelled >= travelTarget) {
        flying.on = false;
        rocket.getObjectByName('flame').visible = false;
        rocketLight.intensity = 0;
        rocket.visible = false;
        trail.visible = false;
        return detPoint.clone();
      }
      return null;
    },

    explode(at) {
      const p = exGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        p[i * 3] = at.x; p[i * 3 + 1] = at.y; p[i * 3 + 2] = at.z;
        const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const sp = 4 + Math.random() * 9;
        exVel[i * 3] = d.x * sp; exVel[i * 3 + 1] = d.y * sp; exVel[i * 3 + 2] = d.z * sp;
      }
      exGeo.attributes.position.needsUpdate = true;
      exLife = exMax;
      exPoints.visible = true; exPoints.material.opacity = 1;
      exShell.visible = true; exShell.position.copy(at); exShell.scale.setScalar(0.2); exShell.material.opacity = 0.9;
      exLight.position.copy(at); exLight.intensity = 6;
    },

    updateExplosion(dt) {
      if (exLife <= 0) return;
      exLife -= dt;
      const t = 1 - exLife / exMax;
      const p = exGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        exVel[i * 3] *= 0.94;
        exVel[i * 3 + 1] = exVel[i * 3 + 1] * 0.94 - 6 * dt;
        exVel[i * 3 + 2] *= 0.94;
        p[i * 3] += exVel[i * 3] * dt;
        p[i * 3 + 1] += exVel[i * 3 + 1] * dt;
        p[i * 3 + 2] += exVel[i * 3 + 2] * dt;
      }
      exGeo.attributes.position.needsUpdate = true;
      exPoints.material.opacity = Math.max(0, 1 - t);
      exShell.scale.setScalar(0.2 + t * 5);
      exShell.material.opacity = Math.max(0, 0.9 * (1 - t));
      exLight.intensity = Math.max(0, 6 * (1 - t));
      if (exLife <= 0) { exPoints.visible = false; exShell.visible = false; exLight.intensity = 0; }
    },

    hideRocket() { rocket.visible = false; trail.visible = false; },
    _trailPts: [],
  };
}
