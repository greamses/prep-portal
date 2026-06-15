import * as THREE from 'three';

// Must match Furniture.js cabinet constants
const CAB = { w: 2.3, h: 1.8, d: 0.52, z: 4.62 };

// 3 stacked lower drawers per cabinet (slot 0 = bottom)
const SLOT_H  = (CAB.h / 2) / 3;  // 0.30
const DRAWER_W = CAB.w - 0.06;     // 2.24
const DRAWER_H = SLOT_H - 0.03;    // 0.27
const DRAWER_D = CAB.d - 0.04;     // 0.48
const FRONT_Z  = CAB.z - CAB.d / 2 - 0.011;  // front face of cabinet ≈ 4.349

// A small palette so the 9 drawers don't all look identical inside
const LIQUIDS = [0x3baaff, 0x4fd17a, 0xff7a4f, 0xc94fff, 0xffd24f, 0xff5f8a];

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcec6a8, roughness: 0.62 });
const pullMat = new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 0.26, metalness: 0.72 });
const intMat  = new THREE.MeshStandardMaterial({ color: 0x78685a, roughness: 0.85, side: THREE.BackSide });
const bottomMat = new THREE.MeshStandardMaterial({ color: 0x68584a, roughness: 0.85 });
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x90c8e0, transmission: 0.88, roughness: 0.05,
  transparent: true, opacity: 0.35,
});
export class Drawer {
  constructor(scene, { cabinetX = 0, slot = 0 } = {}) {
    this.scene  = scene;
    this.isOpen = false;
    this._t     = 0;
    this._dir   = 0;
    this._openDist = 0.42;

    const drawerY = SLOT_H * slot + SLOT_H / 2;       // 0.15 / 0.45 / 0.75
    const liqMat = new THREE.MeshStandardMaterial({
      color: LIQUIDS[(Math.round(cabinetX) + slot * 2 + 9) % LIQUIDS.length],
      roughness: 0.35, transparent: true, opacity: 0.82,
    });

    // Group origin = front face of cabinet at this drawer's height
    this._group = new THREE.Group();
    this._group.position.set(cabinetX, drawerY, FRONT_Z);
    scene.add(this._group);

    // Front face (at local Z=0, facing player)
    const face = new THREE.Mesh(new THREE.BoxGeometry(DRAWER_W, DRAWER_H, 0.022), bodyMat);
    this._group.add(face);

    // Pull handle (slightly proud of face)
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.018), pullMat);
    pull.position.z = -0.02;
    this._group.add(pull);

    // Interior shell — revealed when open, extends into cabinet (+Z from face)
    this._interior = new THREE.Group();
    this._interior.visible = false;

    const iW = DRAWER_W - 0.05, iD = DRAWER_D - 0.05, iH = DRAWER_H - 0.03;

    const shell = new THREE.Mesh(new THREE.BoxGeometry(iW, iH, iD), intMat);
    shell.position.z = iD / 2; // extends back into cabinet
    this._interior.add(shell);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(iW - 0.01, 0.01, iD - 0.01), bottomMat);
    floor.position.set(0, -iH / 2, iD / 2);
    this._interior.add(floor);

    // Beaker
    const beaker = new THREE.Group();
    const body   = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.029, 0.085, 14), glassMat);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.025, 0.040, 14), liqMat);
    liquid.position.y = -0.021;
    beaker.add(body, liquid);
    beaker.position.set(0, -iH / 2 + 0.05, iD / 2);
    beaker.scale.setScalar(0.88);
    this._interior.add(beaker);

    this._group.add(this._interior);

    // Raycasting surface
    this.mesh = this._group;
  }

  get hintText() { return this.isOpen ? 'close' : 'open'; }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this._dir   = 1;
    this._interior.visible = true;
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._dir   = -1;
  }

  update(delta) {
    if (this._dir === 0) return;
    this._t = Math.max(0, Math.min(1, this._t + this._dir * delta * 3.5));
    const ease = 1 - (1 - this._t) ** 3;
    this._group.position.z = FRONT_Z - ease * this._openDist;
    if (this._t <= 0) { this._dir = 0; this._interior.visible = false; }
    if (this._t >= 1)   this._dir = 0;
  }
}
