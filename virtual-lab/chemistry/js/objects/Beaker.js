import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Beaker {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.liquidColor = opts.liquidColor ?? 0x3baaff;
    this.mesh = this._build(opts.x ?? 0);
    scene.add(this.mesh);
  }

  _build(x) {
    const group = new THREE.Group();
    group.position.set(x, 0.6, 0);

    // Glass body — open-top cylinder
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.18,
      roughness: 0, metalness: 0, transmission: 0.9,
      thickness: 0.5, side: THREE.DoubleSide,
    });

    const outerGeo = new THREE.CylinderGeometry(0.38, 0.32, 1.1, 32, 1, true);
    const outer = new THREE.Mesh(outerGeo, glassMat);
    outer.castShadow = true;
    group.add(outer);

    // Bottom disc
    const baseGeo = new THREE.CircleGeometry(0.32, 32);
    const base = new THREE.Mesh(baseGeo, glassMat);
    base.rotation.x = -Math.PI / 2;
    base.position.y = -0.55;
    group.add(base);

    // Liquid
    const liqGeo = new THREE.CylinderGeometry(0.30, 0.28, 0.55, 32);
    const liqMat = new THREE.MeshStandardMaterial({
      color: this.liquidColor, transparent: true, opacity: 0.72,
      roughness: 0.1,
    });
    this._liquid = new THREE.Mesh(liqGeo, liqMat);
    this._liquid.position.y = -0.27;
    group.add(this._liquid);

    // Spout notch (small box cutout hint)
    const spoutGeo = new THREE.BoxGeometry(0.12, 0.1, 0.05);
    const spout = new THREE.Mesh(spoutGeo, glassMat);
    spout.position.set(0.33, 0.52, 0);
    group.add(spout);

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
