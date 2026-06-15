import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const PLAYER_HEIGHT = 1.65;
const PLAYER_RADIUS = 0.32;
const WALK_SPEED    = 4.2;

export class FirstPersonControls extends EventTarget {
  constructor(camera, domElement, { colliders = [], roomMin, roomMax } = {}) {
    super();
    this.camera       = camera;
    this.colliders    = colliders;
    this.roomMin      = roomMin ?? new THREE.Vector3(-5.6, 0, -4.6);
    this.roomMax      = roomMax ?? new THREE.Vector3( 5.6, 0,  4.6);
    this.interactTarget = null;

    this._keys      = {};
    this._joystick  = new THREE.Vector2();
    this._lookStick = new THREE.Vector2();   // mobile right-stick look (continuous)
    this._active    = false; // true when either locked (desktop) or touch moving (mobile)
    this._focus     = null;  // when set: { yaw, pitch, range } — look is clamped & walking is off

    // PointerLockControls for desktop mouse-look
    this._plc = new PointerLockControls(camera, domElement);

    this._plc.addEventListener('lock',   () => { this._active = true;  this.dispatchEvent(new Event('lock'));   });
    this._plc.addEventListener('unlock', () => { this._active = false; this.dispatchEvent(new Event('unlock')); });

    document.addEventListener('keydown', e => {
      this._keys[e.code] = true;
      // Ignore auto-repeat so holding E doesn't rapidly flip a burner on/off
      // (which looked like the flame lagging / flickering before it caught).
      if (e.code === 'KeyE' && !e.repeat && this.interactTarget) this.interactTarget.toggle();
    });
    document.addEventListener('keyup', e => { this._keys[e.code] = false; });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  get isLocked() { return this._plc.isLocked; }

  lock()   { this._plc.lock(); }
  unlock() { this._plc.unlock(); }

  /** Called by VirtualJoystick for mobile movement */
  setJoystick(x, y) {
    this._joystick.set(x, y);
    this._active = (x !== 0 || y !== 0) || this.isLocked;
  }

  /** Called by VirtualJoystick for mobile look (touch drag on right side) */
  rotateLook(dx, dy) {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.camera.quaternion);
    euler.y -= dx * 0.0038;
    euler.x  = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, euler.x - dy * 0.0038));
    this.camera.quaternion.setFromEuler(euler);
  }

  /** Called by VirtualJoystick for the mobile look stick (held deflection) */
  setLookStick(x, y) { this._lookStick.set(x, y); }

  get isFocused() { return !!this._focus; }

  /**
   * Focus mode: aim at `center` (a world-space Vector3) and lock the view into a
   * small cone around it, disabling walking. Pass null to release. The caller
   * pairs this with a zoom-in so the player can examine one apparatus closely.
   */
  setFocus(center, range = 0.42) {
    if (!center) { this._focus = null; return; }
    this.camera.lookAt(center);
    const e = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    this._focus = { yaw: e.y, pitch: e.x, range };
  }

  setInteractTarget(t) { this.interactTarget = t; }

  on(evt, fn) { this.addEventListener(evt, fn); }

  // ── Per-frame update ─────────────────────────────────────────────────────────

  update(delta) {
    // Focus mode: every frame, clamp the camera orientation into the cone around
    // the focused point (this also reins in desktop mouse-look, which bypasses
    // rotateLook) and skip movement entirely.
    if (this._focus) {
      const e = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
      const f = this._focus;
      const cy = Math.max(f.yaw   - f.range, Math.min(f.yaw   + f.range, e.y));
      const cx = Math.max(f.pitch - f.range, Math.min(f.pitch + f.range, e.x));
      if (cy !== e.y || cx !== e.x) { e.y = cy; e.x = cx; this.camera.quaternion.setFromEuler(e); }
      return;
    }

    // Continuous look from the mobile right stick (applied every frame, even
    // when standing still — so it must run before the movement early-return).
    if (this._lookStick.lengthSq() > 0) {
      const LOOK = 320; // deg-ish per second at full deflection
      this.rotateLook(this._lookStick.x * LOOK * delta, this._lookStick.y * LOOK * delta);
    }

    const k = this._keys;
    const j = this._joystick;

    const fwd    = (k['KeyW'] || k['ArrowUp']    ? 1 : 0) - (k['KeyS'] || k['ArrowDown']  ? 1 : 0) - j.y;
    const strafe = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft']  ? 1 : 0) + j.x;

    if (fwd === 0 && strafe === 0) return;
    if (!this._plc.isLocked && j.lengthSq() === 0) return; // desktop: only move when locked

    const speed = WALK_SPEED * delta;
    const prevX = this.camera.position.x;
    const prevZ = this.camera.position.z;

    // PointerLockControls' moveForward/Right work regardless of lock state.
    // Compute the full desired delta, then resolve each axis independently so
    // the player smoothly slides along walls instead of locking at corners.
    this._plc.moveForward(fwd * speed);
    this._plc.moveRight(strafe * speed);
    this.camera.position.y = PLAYER_HEIGHT;

    const targetX = this.camera.position.x;
    const targetZ = this.camera.position.z;

    // Start from the previous position and admit each axis only if it's clear
    this.camera.position.x = prevX;
    this.camera.position.z = prevZ;

    this.camera.position.x = targetX;
    if (this._collides()) this.camera.position.x = prevX;

    this.camera.position.z = targetZ;
    if (this._collides()) this.camera.position.z = prevZ;

    // Safety: if we somehow ended up inside geometry (spawned/clipped), back out
    if (this._collides()) {
      this.camera.position.x = prevX;
      this.camera.position.z = prevZ;
    }

    // Hard clamp to room bounds
    this.camera.position.x = Math.max(this.roomMin.x, Math.min(this.roomMax.x, this.camera.position.x));
    this.camera.position.z = Math.max(this.roomMin.z, Math.min(this.roomMax.z, this.camera.position.z));
    this.camera.position.y = PLAYER_HEIGHT;
  }

  // ── Collision ──────────────────────────────────────────────────────────────

  _collides() {
    const p   = this.camera.position;
    const box = new THREE.Box3(
      new THREE.Vector3(p.x - PLAYER_RADIUS, 0.05, p.z - PLAYER_RADIUS),
      new THREE.Vector3(p.x + PLAYER_RADIUS, PLAYER_HEIGHT, p.z + PLAYER_RADIUS)
    );
    return this.colliders.some(c => box.intersectsBox(c));
  }
}
