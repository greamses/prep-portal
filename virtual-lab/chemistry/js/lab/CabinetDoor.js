import * as THREE from 'three';

// Match Furniture.js cabinet constants
const CAB = { w: 2.3, h: 1.8, d: 0.52, z: 4.62 };

const DOOR_W  = CAB.w / 2 - 0.01;              // 1.14  — half cabinet width
const DOOR_H  = CAB.h / 2 - 0.03;              // 0.87  — upper compartment height
const DOOR_T  = 0.022;
const DOOR_Y  = CAB.h * 0.75;                  // 1.35  — centre of upper half
const FRONT_Z = CAB.z - CAB.d / 2 - DOOR_T / 2; // ~4.349

const OPEN_ANGLE = Math.PI * 0.528; // ~95°

const doorMat   = new THREE.MeshStandardMaterial({ color: 0xd4cbb0, roughness: 0.65 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 0.26, metalness: 0.72 });

export class CabinetDoor {
  constructor(scene, { cabinetX = 0, side = 'left' } = {}) {
    this.isOpen = false;
    this._t     = 0;
    this._dir   = 0;
    this._sign  = side === 'left' ? 1 : -1; // +1 left door opens left, -1 right opens right

    // Hinge is at the outer vertical edge of each door
    const hingeX = side === 'left'
      ? cabinetX - CAB.w / 2 + 0.015
      : cabinetX + CAB.w / 2 - 0.015;

    this._hinge = new THREE.Group();
    this._hinge.position.set(hingeX, DOOR_Y, FRONT_Z);
    scene.add(this._hinge);

    // Door panel offset so its outer edge sits at the hinge
    const panel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, DOOR_T), doorMat);
    panel.position.x = this._sign * DOOR_W / 2; // shift panel toward cabinet centre
    this._hinge.add(panel);

    // Recessed handle near inner edge
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.1, 0.028), handleMat);
    handle.position.set(this._sign * (DOOR_W - 0.08), 0, -DOOR_T);
    this._hinge.add(handle);

    // Raycasting target
    this.mesh = this._hinge;
  }

  get hintText() { return this.isOpen ? 'close' : 'open'; }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open()  { if (!this.isOpen) { this.isOpen = true;  this._dir =  1; } }
  close() { if ( this.isOpen) { this.isOpen = false; this._dir = -1; } }

  update(delta) {
    if (this._dir === 0) return;
    this._t = Math.max(0, Math.min(1, this._t + this._dir * delta * 3.5));
    const ease = 1 - (1 - this._t) ** 3;
    this._hinge.rotation.y = this._sign * ease * OPEN_ANGLE;
    if (this._t <= 0 || this._t >= 1) this._dir = 0;
  }
}
