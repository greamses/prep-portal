import * as THREE from 'three';
import { Drawer }      from './Drawer.js';
import { CabinetDoor } from './CabinetDoor.js';

/**
 * A relocatable bank of storage cupboards: the open-front carcasses (with
 * shelves + reagent bottles) plus their working Drawers and CabinetDoors.
 *
 * Everything is built in the cabinets' native frame (back wall at z ≈ 4.62,
 * fronts facing -Z) into a single group, which is then placed via `offset`.
 * This lets the same cupboards live in any room without changing the Drawer /
 * CabinetDoor classes (they keep their hard-coded CAB.z). Colliders are emitted
 * in world space with the offset already applied.
 *
 * Exposes: group, colliders (Box3[]), interactables (Drawer/CabinetDoor[]).
 */

// Must match Drawer.js / CabinetDoor.js
const CAB = { w: 2.3, h: 1.8, d: 0.52, z: 4.62 };
const T   = 0.022;

const MAT = {
  cabinet    : new THREE.MeshStandardMaterial({ color: 0xd4cbb0, roughness: 0.65 }),
  cabinetIn  : new THREE.MeshStandardMaterial({ color: 0xc3b89c, roughness: 0.78, side: THREE.DoubleSide }),
  cabinetDark: new THREE.MeshStandardMaterial({ color: 0x2e2b26, roughness: 0.82 }),
  bottleAmber: new THREE.MeshPhysicalMaterial({ color: 0x7a4012, roughness: 0.18, transmission: 0.55, transparent: true, opacity: 0.85 }),
  bottleClear: new THREE.MeshPhysicalMaterial({ color: 0xbfd8df, roughness: 0.08, transmission: 0.82, transparent: true, opacity: 0.55 }),
};

export class Cupboards {
  /**
   * @param onShelfItem optional (worldPos: THREE.Vector3, color: number) => void.
   *   When given, it's called for each shelf slot INSTEAD of building a static
   *   bottle — so the caller can drop a pickable item there. Fewer items are
   *   placed in this mode to keep the grabbable count (and cost) down.
   */
  constructor(parent, { cabinetXs = [-1.15, 1.15], offset = new THREE.Vector3(), onShelfItem = null } = {}) {
    this.group = new THREE.Group();
    this.group.position.copy(offset);
    parent.add(this.group);

    this.offset        = offset;
    this.onShelfItem   = onShelfItem;
    this.colliders     = [];
    this.interactables = [];
    this._build(cabinetXs, offset);
  }

  _bx(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  _build(cabinetXs, offset) {
    cabinetXs.forEach(cx => this._carcass(cx, offset));

    // Working parts: 3 stacked drawers (lower) + 2 doors (upper) per cabinet.
    cabinetXs.forEach(cx => {
      [0, 1, 2].forEach(slot =>
        this.interactables.push(new Drawer(this.group, { cabinetX: cx, slot })));
      this.interactables.push(new CabinetDoor(this.group, { cabinetX: cx, side: 'left'  }));
      this.interactables.push(new CabinetDoor(this.group, { cabinetX: cx, side: 'right' }));
    });
  }

  // One open-front carcass with under-counter top, mid divider, two shelves,
  // a countertop, and a few reagent bottles on the shelves.
  _carcass(cx, offset) {
    const cZ = CAB.z, cH = CAB.h, cW = CAB.w, cD = CAB.d, t = T;
    const backZ = cZ + cD / 2 - t / 2;

    this._bx(cW, cH, t,  MAT.cabinetIn, cx, cH / 2, backZ);                     // back
    this._bx(t,  cH, cD, MAT.cabinetIn, cx - cW / 2 + t / 2, cH / 2, cZ);       // left side
    this._bx(t,  cH, cD, MAT.cabinetIn, cx + cW / 2 - t / 2, cH / 2, cZ);       // right side
    this._bx(cW, t,  cD, MAT.cabinetIn, cx, t / 2,      cZ);                    // bottom
    this._bx(cW, t,  cD, MAT.cabinetIn, cx, cH - t / 2, cZ);                    // under-counter top
    this._bx(cW - t * 2, t, cD - 0.02, MAT.cabinetIn, cx, cH / 2, cZ);          // mid divider

    this._bx(cW + 0.04, 0.05, cD + 0.04, MAT.cabinetDark, cx, cH + 0.025, cZ);  // countertop

    const shelfY = [cH * 0.62, cH * 0.82];
    shelfY.forEach((sy, i) => {
      this._bx(cW - t * 2 - 0.01, 0.018, cD - 0.06, MAT.cabinetIn, cx, sy, cZ + 0.01);
      this._shelfBottles(cx, sy + 0.01, cZ, i);
    });

    // Collider in world space (group offset applied manually)
    const w = cW, d = cD + 0.15;
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(offset.x + cx - w / 2, 0,   offset.z + cZ - d / 2),
      new THREE.Vector3(offset.x + cx + w / 2, 2.5, offset.z + cZ + d / 2),
    ));
  }

  _shelfBottles(cx, y, cZ, row) {
    const COLORS = [0x3baaff, 0x4fd17a, 0xff7a4f, 0xc94fff, 0xffd24f];

    // Pickable mode: fewer items, handed to the caller as world positions.
    if (this.onShelfItem) {
      const cols = [-0.5, 0.5];
      cols.forEach((dx, i) => {
        const world = new THREE.Vector3(
          this.offset.x + cx + dx, y, this.offset.z + cZ + 0.02);
        this.onShelfItem(world, COLORS[(i + row) % COLORS.length]);
      });
      return;
    }

    // Static dressing mode
    const cols = row === 0 ? [-0.7, -0.2, 0.45, 0.85] : [-0.55, 0.0, 0.7];
    cols.forEach((dx, i) => {
      const h = 0.13 + ((i + row) % 3) * 0.03;
      const mat = (i + row) % 2 ? MAT.bottleAmber : MAT.bottleClear;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, h, 14), mat);
      body.position.set(cx + dx, y + h / 2, cZ + 0.02);
      body.castShadow = true;
      this.group.add(body);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.03, 12), MAT.cabinetDark);
      cap.position.set(cx + dx, y + h + 0.014, cZ + 0.02);
      this.group.add(cap);
    });
  }
}
