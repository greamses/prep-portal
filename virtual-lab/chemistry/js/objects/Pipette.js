import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Pipette {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.mesh = this._build(opts.x ?? 0);
    scene.add(this.mesh);
  }

  _build(x) {
    const group = new THREE.Group();
    group.position.set(x, 0.7, 0);
    group.rotation.z = Math.PI / 8;

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.22,
      roughness: 0, transmission: 0.9, thickness: 0.2,
      side: THREE.DoubleSide,
    });

    // Bulb
    const bulbGeo = new THREE.SphereGeometry(0.14, 20, 20);
    const bulb = new THREE.Mesh(bulbGeo, new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.3 }));
    bulb.position.y = 0.6;
    group.add(bulb);

    // Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.05, 0.02, 1.2, 20);
    group.add(new THREE.Mesh(shaftGeo, mat));

    // Tip
    const tipGeo = new THREE.ConeGeometry(0.02, 0.2, 12);
    const tip = new THREE.Mesh(tipGeo, mat);
    tip.position.y = -0.7;
    group.add(tip);

    return group;
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.mesh.traverse(c => { c.geometry?.dispose(); c.material?.dispose(); });
  }
}
