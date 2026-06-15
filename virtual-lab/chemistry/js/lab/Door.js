import * as THREE from 'three';

/**
 * A full-height swing door that connects two rooms. Aim at it and press E to
 * open/close. It carries a shared `gate` object ({ isOpen }) which the
 * RoomManager reads to decide whether the neighbouring room is rendered:
 *   • opening sets gate.isOpen = true immediately, so the next room streams in
 *     as the door swings;
 *   • closing keeps it true until the leaf is fully shut, then flips it false
 *     so the neighbour stops rendering (the "occlusion behind a closed door" win).
 *
 * Lives in the boundary wall's opening; the hinge is at one jamb.
 */

const leafMat   = new THREE.MeshStandardMaterial({ color: 0xb9ad93, roughness: 0.62 });
const railMat   = new THREE.MeshStandardMaterial({ color: 0xa49a82, roughness: 0.6 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 0.26, metalness: 0.72 });

const OPEN_ANGLE = Math.PI * 0.52; // ~94°

export class Door {
  constructor(scene, { x = 6, z = 3, w = 1.2, h = 2.1, gate = null } = {}) {
    this.isOpen = false;
    this._t     = 0;
    this._dir   = 0;
    this.gate   = gate;

    const leafW = w - 0.04, leafH = h - 0.05, leafT = 0.05;

    // Hinge at the -Z jamb; the leaf extends toward +Z when closed.
    this._hinge = new THREE.Group();
    this._hinge.position.set(x, leafH / 2 + 0.02, z - w / 2 + 0.02);
    scene.add(this._hinge);

    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafT, leafH, leafW), leafMat);
    leaf.position.z = leafW / 2;
    leaf.castShadow = leaf.receiveShadow = true;
    this._hinge.add(leaf);

    // Cross rails for a panelled look
    [-leafH / 2 + 0.18, 0, leafH / 2 - 0.18].forEach(ry => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(leafT + 0.012, 0.06, leafW - 0.06), railMat);
      rail.position.set(0, ry, leafW / 2);
      this._hinge.add(rail);
    });

    // Lever handle near the free (inner) edge
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 12), handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.05, 0, leafW - 0.12);
    this._hinge.add(handle);

    this.mesh = this._hinge;   // raycast target
  }

  get hintText() { return this.isOpen ? 'close door' : 'open door'; }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this._dir   = 1;
    if (this.gate) this.gate.isOpen = true;   // stream the neighbour in right away
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._dir   = -1;                          // gate stays open until fully shut
  }

  update(delta) {
    if (this._dir === 0) return;
    this._t = Math.max(0, Math.min(1, this._t + this._dir * delta * 2.4));
    const ease = 1 - (1 - this._t) ** 3;
    this._hinge.rotation.y = -ease * OPEN_ANGLE;   // swings open toward the chemistry side
    if (this._t <= 0) { this._dir = 0; if (this.gate) this.gate.isOpen = false; }
    if (this._t >= 1)   this._dir = 0;
  }
}
