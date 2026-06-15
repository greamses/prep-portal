import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Burner {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this._lit  = false;
    this.mesh  = this._build(opts.x ?? 0);
    scene.add(this.mesh);
  }

  _build(x) {
    const group = new THREE.Group();
    group.position.set(x, 0, 0);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.4, metalness: 0.8 });

    // Base
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.1, 32);
    const base = new THREE.Mesh(baseGeo, metalMat);
    base.receiveShadow = true;
    group.add(base);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 20);
    const stem = new THREE.Mesh(stemGeo, metalMat);
    stem.position.y = 0.4;
    group.add(stem);

    // Barrel (top)
    const barrelGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.25, 20, 1, true);
    const barrel = new THREE.Mesh(barrelGeo, metalMat);
    barrel.position.y = 0.87;
    group.add(barrel);

    // Flame (hidden by default)
    const flameGeo = new THREE.ConeGeometry(0.1, 0.4, 12);
    this._flame = new THREE.Mesh(flameGeo, new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 2,
      transparent: true, opacity: 0.0,
    }));
    this._flame.position.y = 1.2;
    group.add(this._flame);

    // Point light for flame glow (off by default)
    this._light = new THREE.PointLight(0xff5500, 0, 3);
    this._light.position.y = 1.3;
    group.add(this._light);

    // Click to toggle
    group.userData.clickable = true;
    group.addEventListener('lab:pick', () => this.toggle());

    return group;
  }

  toggle() {
    this._lit = !this._lit;
    this._flame.material.opacity = this._lit ? 0.85 : 0.0;
    this._light.intensity        = this._lit ? 2.0  : 0.0;
  }

  get isLit() { return this._lit; }

  update(delta) {
    if (this._lit) {
      // Flicker
      this._flame.material.opacity = 0.7 + Math.sin(Date.now() * 0.012) * 0.15;
      this._light.intensity        = 1.8 + Math.sin(Date.now() * 0.018) * 0.4;
      this._flame.scale.y          = 1 + Math.sin(Date.now() * 0.009) * 0.1;
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.mesh.traverse(c => { c.geometry?.dispose(); c.material?.dispose(); });
  }
}
