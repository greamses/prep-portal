/**
 * Portal/cell room manager.
 *
 * Rooms are registered as lazy factories and built the first time they're
 * needed. Each frame the manager finds which room the player is in, then keeps
 * that room plus any neighbour reachable through an OPEN portal (door/window)
 * active — everything else is deactivated (hidden, unlit, not updated). This is
 * the cheap "don't render/light rooms behind closed doors" win.
 *
 * A room module must expose:
 *   group        : THREE.Group (its whole contents; added to the scene)
 *   colliders    : Box3[]                (walls/furniture for player collision)
 *   interactables: object[]              ({ mesh, update(), toggle()… })
 *   portals      : { to:string, isOpen():bool }[]
 *   bounds       : THREE.Box3            (region that counts as "inside")
 *   build()      : void                  (lazy, idempotent)
 *   setActive(b) : void                  (toggle visibility/lights/updates)
 *   update(dt)   : void
 *   contains(p)  : bool
 */
export class RoomManager {
  constructor(scene, ctx = {}) {
    this.scene = scene;
    this.ctx = ctx;
    this.factories = new Map();
    this.rooms = new Map();
    this.active = [];
    this.current = null;
  }

  register(id, factory) { this.factories.set(id, factory); return this; }

  _get(id) {
    if (!this.rooms.has(id)) {
      const room = this.factories.get(id)(this.scene, this.ctx);
      room.id = id;
      this.rooms.set(id, room);
    }
    return this.rooms.get(id);
  }

  /** Build + activate the starting room and make it current. */
  start(id) {
    this.current = this._get(id);
    this.current.setActive(true);
    this.active = [this.current];
    return this.current;
  }

  update(delta, position) {
    // 1. Which room is the player standing in? (keep current if still inside)
    let cur = this.current;
    if (!cur || !cur.contains(position)) {
      for (const r of this.rooms.values()) {
        if (r._built && r.contains(position)) { cur = r; break; }
      }
    }
    this.current = cur;

    // 2. Visible set = current + neighbours reachable through an open portal
    const visible = new Set([cur]);
    for (const p of cur.portals) {
      if (p.isOpen()) visible.add(this._get(p.to));
    }

    // 3. Flip activation to match the visible set
    for (const r of this.rooms.values()) {
      const want = visible.has(r);
      if (want !== r.active) r.setActive(want);
    }

    this.active = [...visible];

    // 4. Tick the active rooms
    for (const r of this.active) r.update(delta);
  }

  get colliders() {
    const out = [];
    for (const r of this.active) out.push(...r.colliders);
    return out;
  }

  get interactables() {
    const out = [];
    for (const r of this.active) out.push(...r.interactables);
    return out;
  }
}
