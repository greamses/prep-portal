import * as THREE from 'three';
import { ROOM } from './Room.js';
import { Door } from './Door.js';

/**
 * The shared wall + door between the chemistry lab and the store room.
 *
 * This is owned by NEITHER room: it's added straight to the scene and stays
 * visible at all times. That's what stops the "wall goes black / door vanishes"
 * bug — when you close the door from inside the store room and the chemistry
 * room deactivates, the boundary (its wall, doorway and door) is still there to
 * seal the opening from the store-room side.
 *
 * Exposes: group, colliders (Box3[], always fed to the controls), interactables
 * ([door]) and door.
 */

const DOORWAY = { z: 3, w: 1.2, h: 2.1 };
const wallMat = new THREE.MeshStandardMaterial({ color: 0xe4dfd3, roughness: 0.84 });
const jambMat = new THREE.MeshStandardMaterial({ color: 0xcfc8ba, roughness: 0.7 });

export class Boundary {
  constructor(scene, { gate } = {}) {
    this.group = new THREE.Group();
    scene.add(this.group);            // persistent — never hidden

    this.colliders     = [];
    this.interactables = [];

    this._wall();
    this.door = new Door(this.group, {
      x: ROOM.w / 2, z: DOORWAY.z, w: DOORWAY.w, h: DOORWAY.h, gate,
    });
    this.interactables.push(this.door);
  }

  _box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    this.group.add(m);
  }

  _collider(cx, cz, w, d, h) {
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(cx - w / 2, 0, cz - d / 2),
      new THREE.Vector3(cx + w / 2, h, cz + d / 2),
    ));
  }

  // The right wall of the chemistry room (x = ROOM.w/2), with the doorway gap.
  _wall() {
    const t = 0.14, h = ROOM.h, d = ROOM.d, x = ROOM.w / 2 + t / 2;
    const dw = DOORWAY;
    const gz0 = dw.z - dw.w / 2, gz1 = dw.z + dw.w / 2;

    const frontLen = gz0 - (-d / 2);
    if (frontLen > 0.01) {
      const cz = (-d / 2 + gz0) / 2;
      this._box(t, h, frontLen, wallMat, x, h / 2, cz);
      this._collider(ROOM.w / 2, cz, t + 0.3, frontLen, h);
    }
    const backLen = (d / 2) - gz1;
    if (backLen > 0.01) {
      const cz = (gz1 + d / 2) / 2;
      this._box(t, h, backLen, wallMat, x, h / 2, cz);
      this._collider(ROOM.w / 2, cz, t + 0.3, backLen, h);
    }
    const lintelH = h - dw.h;
    if (lintelH > 0.01) {
      this._box(t, lintelH, dw.w, wallMat, x, dw.h + lintelH / 2, dw.z);
    }

    // Frame (jambs + head)
    const fw = 0.06;
    this._box(t + 0.05, dw.h, fw, jambMat, x, dw.h / 2, gz0 - fw / 2);
    this._box(t + 0.05, dw.h, fw, jambMat, x, dw.h / 2, gz1 + fw / 2);
    this._box(t + 0.05, fw, dw.w + fw * 2, jambMat, x, dw.h + fw / 2, dw.z);
  }

  update(delta) {
    for (const i of this.interactables) i.update(delta);
  }
}
