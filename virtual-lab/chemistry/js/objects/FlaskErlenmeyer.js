import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class FlaskErlenmeyer {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.liquidColor = opts.liquidColor ?? 0xaa44ff;
    this.mesh = this._build(opts.x ?? 0);
    scene.add(this.mesh);
  }

  _build(x) {
    const group = new THREE.Group();
    group.position.set(x, 0.55, 0);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.15,
      roughness: 0, transmission: 0.92, thickness: 0.5,
      side: THREE.DoubleSide,
    });

    // Build Erlenmeyer profile with lathe geometry
    const pts = [];
    // Neck
    pts.push(new THREE.Vector2(0.08, 0.6));
    pts.push(new THREE.Vector2(0.10, 0.55));
    pts.push(new THREE.Vector2(0.10, 0.40));
    // Shoulder
    pts.push(new THREE.Vector2(0.22, 0.28));
    pts.push(new THREE.Vector2(0.36, 0.10));
    // Base
    pts.push(new THREE.Vector2(0.42, 0.00));
    pts.push(new THREE.Vector2(0.42, -0.02));

    const latheGeo = new THREE.LatheGeometry(pts, 32);
    const flask = new THREE.Mesh(latheGeo, glassMat);
    flask.castShadow = true;
    group.add(flask);

    // Liquid fill
    const liqPts = [];
    liqPts.push(new THREE.Vector2(0.0,  0.0));
    liqPts.push(new THREE.Vector2(0.36, 0.0));
    liqPts.push(new THREE.Vector2(0.28, 0.18));
    liqPts.push(new THREE.Vector2(0.0,  0.25));
    const liqGeo = new THREE.LatheGeometry(liqPts, 32);
    this._liquid = new THREE.Mesh(liqGeo, new THREE.MeshStandardMaterial({
      color: this.liquidColor, transparent: true, opacity: 0.65,
    }));
    this._liquid.position.y = -0.02;
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
