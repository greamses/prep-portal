import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class TestTube {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.liquidColor = opts.liquidColor ?? 0xff4444;
    this.mesh = this._build(opts.x ?? 0);
    scene.add(this.mesh);
  }

  _build(x) {
    const group = new THREE.Group();
    group.position.set(x, 0.8, 0);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.2,
      roughness: 0, transmission: 0.92, thickness: 0.3,
      side: THREE.DoubleSide,
    });

    // Tube body
    const tubeGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 24, 1, true);
    group.add(new THREE.Mesh(tubeGeo, glassMat));

    // Rounded bottom
    const capGeo = new THREE.SphereGeometry(0.1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, glassMat);
    cap.position.y = -0.5;
    group.add(cap);

    // Liquid
    const liqGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.45, 24);
    this._liquid = new THREE.Mesh(liqGeo, new THREE.MeshStandardMaterial({
      color: this.liquidColor, transparent: true, opacity: 0.75,
    }));
    this._liquid.position.y = -0.27;
    group.add(this._liquid);

    return group;
  }

  setLiquidColor(hex) {
    this.liquidColor = hex;
    this._liquid.material.color.setHex(hex);
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.mesh.traverse(c => { c.geometry?.dispose(); c.material?.dispose(); });
  }
}
