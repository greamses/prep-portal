import * as THREE from 'three';
import { Pickup }    from './lab/Pickup.js';
import { Cupboards } from './lab/Cupboards.js';

/**
 * Storage / prep room — the scaffolded second room that sits beyond the
 * chemistry lab's right-wall doorway. It shares the same RoomModule interface
 * as ChemistryRoom (see RoomManager), so the manager streams it in only while
 * the connecting door is open.
 *
 * Built in absolute world space at X ∈ [6, 11], Z ∈ [0, 5], floor at Y = 0
 * (so Pickup's break-on-floor logic still works). The west side is left open —
 * the chemistry room's right wall (with its doorway) is the shared boundary.
 */

const MAT = {
  floor  : new THREE.MeshStandardMaterial({ color: 0x3a3e36, roughness: 0.78 }),
  wall   : new THREE.MeshStandardMaterial({ color: 0xdad3c4, roughness: 0.86 }),
  ceil   : new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.9 }),
  shelf  : new THREE.MeshStandardMaterial({ color: 0xb9a888, roughness: 0.7 }),
  steel  : new THREE.MeshStandardMaterial({ color: 0x8d8d92, roughness: 0.3, metalness: 0.75 }),
  amber  : new THREE.MeshPhysicalMaterial({ color: 0x7a4012, roughness: 0.18, transmission: 0.5, transparent: true, opacity: 0.85 }),
  clear  : new THREE.MeshPhysicalMaterial({ color: 0xbfd8df, roughness: 0.08, transmission: 0.82, transparent: true, opacity: 0.55 }),
  cap    : new THREE.MeshStandardMaterial({ color: 0x2e2b26, roughness: 0.6 }),
};

// Interior extents
const X0 = 6, X1 = 11, Z0 = 0, Z1 = 5, H = 3;
const CX = (X0 + X1) / 2, CZ = (Z0 + Z1) / 2, W = X1 - X0, D = Z1 - Z0;

function box(parent, w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m);
  return m;
}

export class StorageRoom {
  constructor(scene, { camera, holder, economy, portalDoor } = {}) {
    this.scene   = scene;
    this.camera  = camera;
    this.holder  = holder;
    this.economy = economy;

    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    this.colliders     = [];
    this.interactables = [];
    // Back to the chemistry room through the same shared door.
    this.portals = portalDoor
      ? [{ to: 'chemistry', isOpen: () => portalDoor.isOpen }]
      : [];
    this.bounds = new THREE.Box3(
      new THREE.Vector3(X0 + 0.2, -1, Z0 - 0.2),
      new THREE.Vector3(X1,        4, Z1 + 0.2),
    );
    this.spawn = new THREE.Vector3(CX, 1.65, CZ);

    this.active = false;
    this._built = false;
  }

  build() {
    if (this._built) return;
    this._built = true;
    const g = this.group;

    this._ctx       = { holder: this.holder, camera: this.camera, economy: this.economy };
    this._pickables = [];          // every shelf/cupboard bottle is grabbable

    this._shell(g);
    this._lighting(g);
    this._fridge(g);
    this._shelving(g);             // open rack of pickable reagent bottles

    // The storage cupboards (relocated from the chemistry lab) line the north
    // wall: two carcasses with working drawers + doors. Their shelf bottles are
    // handed back to us as world positions so they're pickable too.
    const cupboards = new Cupboards(g, {
      cabinetXs: [-1.15, 1.15],
      offset: new THREE.Vector3(CX, 0, 0),
      onShelfItem: (world, color) => this._addBottle(world, color),
    });
    this.colliders.push(...cupboards.colliders);

    this.interactables = [...cupboards.interactables, ...this._pickables];
  }

  // A grabbable reagent bottle (cheap glass — there are many of them) that can be
  // set back down on any shelf the crosshair is aimed at.
  _addBottle(world, color) {
    this._pickables.push(new Pickup(this.group, {
      type: 'bottle', color, cheap: true,
      position: world.clone(), ...this._ctx,
    }));
  }

  // ── Room shell (floor / ceiling / 3 closed walls; west is the shared wall) ──
  _shell(g) {
    box(g, W, 0.12, D, MAT.floor, CX, -0.06, CZ);             // floor
    box(g, W, 0.10, D, MAT.ceil,  CX, H + 0.05, CZ, false);   // ceiling

    const t = 0.14;
    // East wall (x = X1)
    box(g, t, H, D, MAT.wall, X1 + t / 2, H / 2, CZ);
    this._col(X1, CZ, t + 0.3, D);
    // South wall (z = Z0)
    box(g, W, H, t, MAT.wall, CX, H / 2, Z0 - t / 2);
    this._col(CX, Z0, W, t + 0.3);
    // North wall (z = Z1)
    box(g, W, H, t, MAT.wall, CX, H / 2, Z1 + t / 2);
    this._col(CX, Z1, W, t + 0.3);
  }

  _col(cx, cz, w, d, h = H) {
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(cx - w / 2, 0, cz - d / 2),
      new THREE.Vector3(cx + w / 2, h, cz + d / 2),
    ));
  }

  _lighting(g) {
    const fixtureMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xfff4e2, emissiveIntensity: 2.0, roughness: 0.6,
    });
    box(g, 1.6, 0.04, 0.16, fixtureMat, CX, H - 0.04, CZ, false);

    const lamp = new THREE.PointLight(0xfff3df, 18, 12, 2);
    lamp.position.set(CX, H - 0.2, CZ);
    g.add(lamp);

    const fill = new THREE.HemisphereLight(0xd6dde8, 0x2c2a24, 0.5);
    g.add(fill);
  }

  // ── Open shelving against the east wall (north wall holds the cupboards) ──
  // Three reachable shelves, each carrying two pickable reagent bottles.
  _shelving(g) {
    const cx = X1 - 0.18, cz = 2.5, span = 2.6, depth = 0.32;
    const COLORS = [0x3baaff, 0x4fd17a, 0xff7a4f, 0xc94fff, 0xffd24f];

    [0.55, 1.05, 1.55].forEach((y, row) => {
      box(g, depth, 0.03, span, MAT.shelf, cx, y, cz);
      [-0.55, 0.55].forEach((dz, i) =>
        this._addBottle(new THREE.Vector3(cx, y + 0.03, cz + dz), COLORS[(row * 2 + i) % COLORS.length]));
    });

    // End posts
    const half = span / 2;
    [[cx, cz - half], [cx, cz + half]].forEach(([px, pz]) =>
      box(g, 0.04, 1.8, 0.04, MAT.steel, px, 0.9, pz));
  }

  // ── Lab refrigerator (against the south wall) ───────────────────────────────
  _fridge(g) {
    const fw = 0.74, fh = 1.78, fd = 0.7;
    const fx = 9.4, fz = Z0 + fd / 2 + 0.04;     // back near the south wall
    const frontZ = fz + fd / 2;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeef1f3, roughness: 0.32, metalness: 0.15 });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xe2e6ea, roughness: 0.28, metalness: 0.25 });

    box(g, fw, fh, fd, bodyMat, fx, fh / 2, fz);                                  // body
    box(g, fw - 0.06, fh * 0.62, 0.03, doorMat, fx, fh * 0.31, frontZ + 0.018);  // fridge door
    box(g, fw - 0.06, fh * 0.32, 0.03, doorMat, fx, fh * 0.81, frontZ + 0.018);  // freezer door

    // Vertical bar handles near the hinge-opposite edge
    const hx = fx - fw / 2 + 0.10;
    box(g, 0.03, 0.46, 0.035, MAT.steel, hx, fh * 0.33, frontZ + 0.05);
    box(g, 0.03, 0.20, 0.035, MAT.steel, hx, fh * 0.80, frontZ + 0.05);

    this._col(fx, fz, fw + 0.04, fd + 0.04);
  }

  setActive(active) {
    if (active) this.build();
    this.active = active;
    this.group.visible = active;
  }

  update(delta) {
    if (!this.active) return;
    for (const i of this.interactables) i.update(delta);
  }

  contains(point) { return this.bounds.containsPoint(point); }
}
