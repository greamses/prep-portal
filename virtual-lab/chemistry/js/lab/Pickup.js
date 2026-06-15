import * as THREE from 'three';

/**
 * A grabbable piece of equipment. Look at it and press E to pick it up — it
 * rides in the camera holder between the hands. Press E again to put it down:
 *   • if the crosshair is aimed at a surface within reach, it's placed there;
 *   • otherwise it falls to the floor and SHATTERS (shards + splash + sound).
 *
 * Each piece is modelled with its base at the group origin (y = 0).
 */

const PLACE_RANGE = 2.2;   // max distance the crosshair can place onto a surface
const GRAVITY     = 8.0;   // m/s² for falling glass & shards
const SHARD_COUNT = 11;

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xcfe6ee, transmission: 0.9, roughness: 0.06, thickness: 0.4,
  transparent: true, opacity: 0.4, side: THREE.DoubleSide, ior: 1.45,
});
// Cheap glass (no transmission) for high-count items like test tubes
const glassCheap = new THREE.MeshStandardMaterial({
  color: 0xcfe6ee, roughness: 0.1, transparent: true, opacity: 0.34, side: THREE.DoubleSide,
});
const rimMat = new THREE.MeshStandardMaterial({ color: 0xdfeaef, roughness: 0.25 });
const capMat = new THREE.MeshStandardMaterial({ color: 0x2e2b26, roughness: 0.6 });
const shardGeo = new THREE.TetrahedronGeometry(0.02);
// Cheap glassy material for shards (no transmission → fast even with many)
const shardMat = new THREE.MeshStandardMaterial({
  color: 0xcfe6ee, roughness: 0.1, metalness: 0.0,
  transparent: true, opacity: 0.85, side: THREE.DoubleSide,
});

// Metal/ceramic materials for the tripod + wire gauze (non-glass apparatus)
const ironMat    = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.45, metalness: 0.6 });
const steelMat   = new THREE.MeshStandardMaterial({ color: 0xa6a6aa, roughness: 0.3,  metalness: 0.8 });
const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.9 });

const LIQUID = { flask: 0x4fd17a, beaker: 0x3baaff, bottle: 0xff7a4f, tube: 0xffd24f };
// Nominal mass (grams) shown by the weighing balance when set on its pan
const MASS = { beaker: 102.4, flask: 87.6, tube: 14.2, bottle: 58.3, tripod: 240.0, gauze: 21.5 };
const liquidMat = hex => new THREE.MeshStandardMaterial({
  color: hex, roughness: 0.35, transparent: true, opacity: 0.82,
});

function isUnder(obj, root) {
  for (let p = obj; p; p = p.parent) if (p === root) return true;
  return false;
}

const _wq = new THREE.Quaternion();   // scratch for liquid leveling

// Lazily-created WebAudio crack (a filtered noise burst). Needs a user gesture,
// which the E-press provides.
let _actx;
function playCrack() {
  try {
    _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _actx;
    if (ctx.state === 'suspended') ctx.resume();
    const dur = 0.28, n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    const g = ctx.createGain(); g.gain.value = 0.5;
    src.connect(hp); hp.connect(g); g.connect(ctx.destination);
    src.start();
  } catch (_) { /* audio unavailable — ignore */ }
}

export class Pickup {
  constructor(scene, { type = 'beaker', position, holder, camera, color, economy = null, cheap = false, breakable = true }) {
    this.scene     = scene;
    this.holder    = holder;
    this.camera    = camera;
    this.type      = type;
    this.economy   = economy;    // gates whether a glass is allowed to break
    this.held      = false;
    this._state    = 'rest';     // rest | falling | broken | settled
    this._cheap    = cheap;      // use non-transmission glass (cheap, for many items)
    this._breakable = breakable; // metal apparatus (tripod/gauze) never shatters
    this._riders   = null;       // items resting on top that ride along when carried
    this.mass      = MASS[type] ?? 50.0;   // grams — read by the weighing balance
    this._liqHex   = color ?? LIQUID[type] ?? 0x3baaff;   // liquid colour

    this.mesh = this._build(type);
    this.mesh.position.copy(position);
    this.mesh.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(this.mesh);

    this._vel    = new THREE.Vector3();
    this._shards = [];
    this._splash = null;
    this._t      = 0;
  }

  // Only targetable by the crosshair when resting on a surface (not mid-fall)
  get isInteractable() { return this._state === 'rest' && !this.held; }
  get hintText() { return this.held ? 'put down' : 'pick up'; }

  toggle() { this.held ? this.drop() : this.pick(); }

  // Register an item that rests on top of this one (e.g. a wire gauze on a
  // tripod) so it's carried along when this is picked up. `offset` is where the
  // rider sits relative to this object's base.
  addRider(other, offset) {
    (this._riders ||= []).push({ p: other, offset: offset.clone() });
  }

  pick() {
    if (this.held || this._state !== 'rest') return;
    this.held = true;
    this.holder.add(this.mesh);
    // Placement/rotation/scale live in Hands.js (TUNE.heldObject)
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);

    // Carry along anything resting on top (only if it's free to come).
    if (this._riders) for (const r of this._riders) {
      const p = r.p;
      if (p.held || p._state !== 'rest') continue;
      p.held = true;
      p._ridingOn = this;
      this.mesh.add(p.mesh);
      p.mesh.position.copy(r.offset);
      p.mesh.rotation.set(0, 0, 0);
    }
  }

  // Set riders back down on top of this object once it comes to rest.
  _releaseRiders() {
    if (!this._riders) return;
    for (const r of this._riders) {
      const p = r.p;
      if (p._ridingOn !== this) continue;
      p._ridingOn = null;
      p.held = false;
      this.scene.add(p.mesh);
      p.mesh.position.set(
        this.mesh.position.x + r.offset.x,
        this.mesh.position.y + r.offset.y,
        this.mesh.position.z + r.offset.z,
      );
      p.mesh.rotation.set(0, 0, 0);
      p._state = 'rest';
    }
  }

  drop() {
    if (!this.held) return;
    this.held = false;

    // Re-parent to the scene, keeping the current world transform
    const wp = new THREE.Vector3();
    this.mesh.getWorldPosition(wp);
    this.scene.add(this.mesh);
    this.mesh.position.copy(wp);
    this.mesh.rotation.set(0, 0, 0);

    // Where is the crosshair pointing? (ray from the camera, straight ahead)
    const origin = new THREE.Vector3();
    const dir    = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    this.camera.getWorldDirection(dir);

    const ray = new THREE.Raycaster(origin, dir, 0, PLACE_RANGE);
    const hit = ray.intersectObjects(this.scene.children, true)
      .find(h => !isUnder(h.object, this.camera) && !isUnder(h.object, this.mesh));

    // Place only on a roughly-horizontal surface within reach
    let placed = false;
    if (hit && hit.face) {
      const nrm = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (nrm.y > 0.5) {
        this.mesh.position.set(hit.point.x, hit.point.y + 0.001, hit.point.z);
        placed = true;
      }
    }

    if (placed) {
      this._state = 'rest';           // gently set down — still grabbable
      if (this._liquid) this._liquid.quaternion.identity();   // settle level
      this._releaseRiders();          // set the gauze etc. back on top
    } else {
      // Too far / no surface: let it fall (riders ride down with it and are
      // released when it lands — see update()/_settleIntact()).
      this._state = 'falling';
      this._vel.set(dir.x * 0.5, 0, dir.z * 0.5);   // a little forward momentum
    }
  }

  // Keep the liquid surface roughly level with the world while carried. The
  // slerp lags behind the container, so quick turns make the fluid slosh.
  _levelLiquid(delta) {
    if (!this._liquid) return;
    this.mesh.getWorldQuaternion(_wq).invert();
    this._liquid.quaternion.slerp(_wq, Math.min(1, delta * 7));
  }

  update(delta) {
    if (this.held) { this._levelLiquid(delta); return; }

    if (this._state === 'falling') {
      this._vel.y -= GRAVITY * delta;
      this.mesh.position.addScaledVector(this._vel, delta);
      this.mesh.rotation.x += delta * 2.0;
      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0;
        // Metal apparatus never shatters; glass breaks only if the budget allows.
        if (this._breakable && (!this.economy || this.economy.tryBreak())) this._shatter();
        else this._settleIntact();
      }
    } else if (this._state === 'broken') {
      this._t += delta;
      let moving = false;

      for (const s of this._shards) {
        if (s.userData.rest) continue;        // already settled — leave it
        s.userData.v.y -= GRAVITY * delta;
        s.position.addScaledVector(s.userData.v, delta);
        if (s.position.y <= 0.006) {           // hit the floor — apply friction
          s.position.y = 0.006;
          s.userData.v.x *= 0.5; s.userData.v.z *= 0.5; s.userData.v.y = 0;
          if (Math.hypot(s.userData.v.x, s.userData.v.z) < 0.03) {
            s.userData.v.set(0, 0, 0);
            s.userData.rest = true;            // come to rest and stop animating
          }
        } else moving = true;
        s.rotation.x += s.userData.r.x * delta;
        s.rotation.y += s.userData.r.y * delta;
      }

      // Splash spreads once, then holds (stays on the floor until refresh)
      if (this._splash && this._t < 0.5) {
        const e = 1 - Math.pow(1 - this._t / 0.5, 2);
        this._splash.scale.setScalar(0.2 + e * 1.3);
      }

      // Once everything has settled, stop updating but keep the debris in place
      if (!moving && this._t > 0.6) this._state = 'settled';
    }
  }

  // Out of budget: the glass survives the drop and rests upright on the floor
  _settleIntact() {
    this._state = 'rest';
    this.mesh.rotation.set(0, 0, 0);
    if (this._liquid) this._liquid.quaternion.identity();
    this._releaseRiders();   // anything carried down settles on top
  }

  _shatter() {
    this._state = 'broken';
    this._t = 0;
    const p = this.mesh.position.clone();
    this.scene.remove(this.mesh);
    playCrack();

    // Glass shards bursting outward
    for (let i = 0; i < SHARD_COUNT; i++) {
      const m = new THREE.Mesh(shardGeo, shardMat.clone());
      m.material.opacity = 0.85;
      m.position.set(p.x, 0.02, p.z);
      m.scale.setScalar(0.6 + Math.random() * 0.9);
      const a = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 1.1;
      m.userData.v = new THREE.Vector3(Math.cos(a) * speed, 1.0 + Math.random() * 1.4, Math.sin(a) * speed);
      m.userData.r = new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, 0);
      this.scene.add(m);
      this._shards.push(m);
    }

    // Liquid splash on the floor
    const splashMat = new THREE.MeshBasicMaterial({
      color: this._liqHex, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
    });
    this._splash = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), splashMat);
    this._splash.rotation.x = -Math.PI / 2;
    this._splash.position.set(p.x, 0.004, p.z);
    this.scene.add(this._splash);
  }

  // ── Geometry ───────────────────────────────────────────────────────────────
  _build(type) {
    const g = new THREE.Group();
    if (type === 'flask')  return this._flask(g);
    if (type === 'bottle') return this._bottle(g);
    if (type === 'tube')   return this._tube(g);
    if (type === 'tripod') return this._tripod(g);
    if (type === 'gauze')  return this._gauze(g);
    return this._beaker(g);
  }

  // Tripod stand (ring + three splayed legs). Base at y = 0; ring top at y ≈ 0.17,
  // where a wire gauze sits.
  _tripod(g) {
    const ringY = 0.17, R = 0.085;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.005, 8, 24), ironMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = ringY; g.add(ring);
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3;
      const top  = new THREE.Vector3(Math.cos(a) * R,    ringY, Math.sin(a) * R);
      const foot = new THREE.Vector3(Math.cos(a) * 0.14, 0,     Math.sin(a) * 0.14);
      const dir  = top.clone().sub(foot);
      const len  = dir.length();
      const leg  = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 8), ironMat);
      leg.position.copy(top.clone().add(foot).multiplyScalar(0.5));
      leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      g.add(leg);
    }
    return g;
  }

  // Wire gauze square with a ceramic centre. Base at y = 0 so it can rest either
  // on a tripod (carried via addRider) or flat on a bench.
  _gauze(g) {
    const square = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.004, 0.16), steelMat);
    square.position.y = 0.002;
    const centre = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.006, 20), ceramicMat);
    centre.position.y = 0.006;
    g.add(square, centre);
    return g;
  }

  _flask(g) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.05, 0.10, 24), glassMat);
    body.position.y = 0.05;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 18), glassMat);
    neck.position.y = 0.125;
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 18), rimMat);
    lip.rotation.x = Math.PI / 2; lip.position.y = 0.15;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.046, 0.05, 24), liquidMat(this._liqHex));
    liq.position.y = 0.027;
    g.add(body, neck, lip, liq);
    this._liquid = liq;
    return g;
  }

  _beaker(g) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.04, 0.085, 24), glassMat);
    body.position.y = 0.0425;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.003, 8, 24), rimMat);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.085;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.036, 0.045, 24), liquidMat(this._liqHex));
    liq.position.y = 0.024;
    g.add(body, rim, liq);
    this._liquid = liq;
    return g;
  }

  _tube(g) {
    const r = 0.0085, h = 0.115;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14, 1, true), glassCheap);
    body.position.y = h / 2;
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), glassCheap);
    bottom.scale.y = 0.85;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0012, 6, 16), glassCheap);
    rim.rotation.x = Math.PI / 2; rim.position.y = h;
    const lh = 0.05;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r * 0.82, lh, 14), liquidMat(this._liqHex));
    liq.position.y = lh / 2 + 0.004;
    g.add(body, bottom, rim, liq);
    this._liquid = liq;
    return g;
  }

  _bottle(g) {
    const gm = this._cheap ? glassCheap : glassMat;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.10, 20), gm);
    body.position.y = 0.05;
    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.03, 0.025, 18), gm);
    shoulder.position.y = 0.1125;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 16), gm);
    neck.position.y = 0.135;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.022, 16), capMat);
    cap.position.y = 0.156;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.031, 0.06, 20), liquidMat(this._liqHex));
    liq.position.y = 0.035;
    g.add(body, shoulder, neck, cap, liq);
    this._liquid = liq;
    return g;
  }
}
