import * as THREE from 'three';
import { Room }        from './lab/Room.js';
import { Furniture }   from './lab/Furniture.js';
import { Equipment }   from './lab/Equipment.js';
import { Pickup }      from './lab/Pickup.js';
import { Bunsen }      from './lab/Bunsen.js';
import { WashSink }    from './lab/WashSink.js';
import { Balance }     from './lab/Balance.js';
import { Decor }       from './lab/Decor.js';

/**
 * The chemistry lab as a self-contained room module (see RoomManager for the
 * interface). All of its contents live under `this.group`, so the manager can
 * show/hide/light the whole room by toggling one node. Geometry is built lazily
 * the first time the room is activated.
 *
 * To add another lab later: copy this shape, build into `this.group`, offset
 * its `bounds`/contents in world space, and add a portal entry linking the two.
 */
export class ChemistryRoom {
  constructor(scene, { camera, holder, economy, portalDoor } = {}) {
    this.scene      = scene;
    this.camera     = camera;
    this.holder     = holder;
    this.economy    = economy;
    this.portalDoor = portalDoor;   // shared { isOpen } gate, written by the Door

    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    this.colliders     = [];
    this.interactables = [];
    // Neighbour: the storage room, rendered only while the connecting door is open.
    this.portals       = portalDoor
      ? [{ to: 'storage', isOpen: () => portalDoor.isOpen }]
      : [];
    this.bounds        = new THREE.Box3(
      new THREE.Vector3(-6.5, -1, -5.5),
      new THREE.Vector3( 6.5,  4,  5.5),
    );
    this.spawn = new THREE.Vector3(0, 1.65, 2.5);

    this.active  = false;
    this._built  = false;
  }

  build() {
    if (this._built) return;
    this._built = true;
    const g = this.group;   // everything is parented here, so it gates as a unit

    // The right wall + connecting door are a persistent Boundary (see main.js),
    // so this room omits its right wall.
    this.room      = new Room(g, { omitRight: true });
    this.furniture = new Furniture(g);
    this.equipment = new Equipment(g);
    this.decor     = new Decor(g);   // fans, AC, charts, stickers, clock

    // One copy of each piece of glassware, out on the two work benches.
    // (Storage cupboards — and the bottles in them — now live in the store room.)
    const ctx = { holder: this.holder, camera: this.camera, economy: this.economy };
    const pickups = [
      new Pickup(g, { type: 'beaker', position: new THREE.Vector3( 1.5, 0.89, -1.2), ...ctx }),
      new Pickup(g, { type: 'flask',  position: new THREE.Vector3( 0.6, 0.89,  1.2), ...ctx }),
      ...this.equipment.tubeSlots.map(s => new Pickup(g, {
        type: 'tube', position: s.pos, color: s.color, ...ctx,
      })),
    ];

    // Tripod + wire gauze: two separable metal pickups. The gauze rests on the
    // tripod and rides along when you carry the tripod, but can also be lifted
    // off on its own. Neither shatters when dropped.
    const ts     = this.equipment.tripodSpot;
    const tripod = new Pickup(g, { type: 'tripod', breakable: false, position: new THREE.Vector3(ts.x, ts.top, ts.z), ...ctx });
    const gauze  = new Pickup(g, { type: 'gauze',  breakable: false, position: new THREE.Vector3(ts.x, ts.top + 0.17, ts.z), ...ctx });
    tripod.addRider(gauze, new THREE.Vector3(0, 0.17, 0));
    pickups.push(tripod, gauze);

    const bunsens = this.equipment.burnerSpots.map(s => new Bunsen(g, s));

    // Wash sink (interactive tap) against the back wall, and a live weighing
    // balance on the back bench that reads any glassware set on its pan.
    this.sink    = new WashSink(g, {});
    this.balance = new Balance(g, { x: 1.6, z: 1.2 });
    this._pickups = pickups;     // the balance scans these each frame

    this.colliders     = [...this.room.colliders, ...this.furniture.colliders, ...this.sink.colliders];
    this.interactables = [...pickups, ...bunsens, this.sink];
  }

  setActive(active) {
    if (active) this.build();
    this.active = active;
    this.group.visible = active;   // hides meshes AND drops the room's lights
  }

  update(delta) {
    if (!this.active) return;
    for (const i of this.interactables) i.update(delta);
    if (this.balance) this.balance.update(this._pickups);
    if (this.decor) this.decor.update(delta);
  }

  contains(point) { return this.bounds.containsPoint(point); }
}
