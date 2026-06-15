import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * The player's own body, shown in third-person view. One textured Mixamo model
 * (walking.glb) carries the walk clip; the idle / opening / carry clips come from
 * tiny animation-only GLBs retargeted onto the same skeleton by bone name.
 *
 * The controller drives it every frame: `setPosition` / `setFacingYaw` place it
 * under the player, and `setLocomotion(speed, carrying)` crossfades between idle,
 * walk, and carry (the "Texting & Walking" clip). `triggerOpen()` plays the
 * opening gesture once. All clips are converted to "in place" by pinning the
 * hips' local-Y root motion (this rig is Z-up, so forward travel is local Y).
 *
 * `handAnchor` is a metre-scale node at chest height for carried glassware — the
 * controller parents the held-object holder here while in third-person.
 */

const NATURAL_HEIGHT = 1.7;   // the model's natural rendered height (no scaling)

const ANIM_URLS = {
  idle:  '../shared/models/breathing-idle.anim.glb',
  open:  '../shared/models/opening.anim.glb',
  carry: '../shared/models/texting-walking.anim.glb',
};

export class PlayerAvatar {
  constructor(scene, { url = '../shared/models/walking.glb', height = 1.7, facing = Math.PI, onReady } = {}) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    // Metre-scale anchor for carried items (the skeleton itself is cm-scale, so
    // we don't parent to a bone). Sits at hand/chest height, slightly forward.
    this.handAnchor = new THREE.Object3D();
    this.handAnchor.position.set(0, 1.15, 0.28);
    this.group.add(this.handAnchor);

    this._height  = height;
    this._facing  = facing;
    this._onReady = onReady || (() => {});

    this._mixer = null;
    this._actions = {};
    this._cur = null;
    this._curAct = null;
    this._hips = null;
    this._hips0 = new THREE.Vector3();
    this._ready = false;
    this._openT = 0;
    this._carryHoldT = 0;

    this._load(url);
  }

  async _load(url) {
    try {
      const loader = new GLTFLoader();
      const base = await loader.loadAsync(url);
      this._setupModel(base.scene);

      const clips = { walk: base.animations[0] };
      const extra = await Promise.all(
        Object.entries(ANIM_URLS).map(async ([k, u]) => [k, (await loader.loadAsync(u)).animations[0]]),
      );
      for (const [k, c] of extra) clips[k] = c;

      this._mixer = new THREE.AnimationMixer(this._model);
      for (const [k, clip] of Object.entries(clips)) {
        if (clip) this._actions[k] = this._mixer.clipAction(clip);
      }
      this._openDur = (clips.open || clips.walk).duration;
      this._carryHoldT = this._findCarryHoldTime();

      this._setState('idle');
      this._ready = true;
      this._onReady();
    } catch (err) {
      console.warn('[PlayerAvatar] load failed', err);
      this._onReady();
    }
  }

  _setupModel(model) {
    model.scale.setScalar(this._height / NATURAL_HEIGHT);
    model.traverse(o => {
      if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.frustumCulled = false; }
    });
    this.group.add(model);
    this._model = model;

    model.traverse(o => { if (o.isBone && /hips$/i.test(o.name) && !this._hips) this._hips = o; });
    if (!this._hips) model.traverse(o => { if (o.isBone && !this._hips) this._hips = o; });
    if (this._hips) this._hips0.copy(this._hips.position);
  }

  _findBone(re) {
    let found = null;
    this._model.traverse(o => { if (!found && o.isBone && re.test(o.name)) found = o; });
    return found;
  }

  // The carry clip ("Texting & Walking") swings the arms through the walk cycle.
  // Freezing it on a random frame can leave the hands down by the sides. Sample
  // the clip once and find the time where a hand is HIGHEST (arms raised, holding
  // the phone) — that's the frame we snap to when standing still with an object.
  _findCarryHoldTime() {
    const carry = this._actions.carry;
    if (!carry) return 0;
    const hand = this._findBone(/right_?hand$/i) || this._findBone(/hand$/i);
    if (!hand) return 0;

    carry.reset().setEffectiveWeight(1).play();
    const dur = carry.getClip().duration;
    const v = new THREE.Vector3();
    let bestT = 0, bestY = -Infinity;
    const N = 60;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * dur;
      this._mixer.setTime(t);
      this._model.updateMatrixWorld(true);
      hand.getWorldPosition(v);
      if (v.y > bestY) { bestY = v.y; bestT = t; }
    }
    carry.stop();
    this._mixer.setTime(0);
    return bestT;
  }

  _setState(key) {
    if (this._cur === key || !this._actions[key]) return;
    const next = this._actions[key].reset();
    if (key === 'open') { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
    else next.setLoop(THREE.LoopRepeat, Infinity);
    next.fadeIn(0.25).play();
    if (this._curAct) this._curAct.fadeOut(0.25);
    this._curAct = next;
    this._cur = key;
  }

  // ── Driven by the controller ────────────────────────────────────────────────
  setPosition(x, z) { this.group.position.set(x, 0, z); }
  setFacingYaw(yaw) { this.group.rotation.y = yaw + this._facing; }
  setVisible(v)     { this.group.visible = v; }

  setLocomotion(speed, carrying) {
    if (!this._ready || this._openT > 0) return;          // opening gesture owns the body
    const moving = speed > 0.15;
    if (carrying) {
      // Stay in the carry pose while holding. We have no "hold still" clip, so
      // when moving we play the carry walk; when stopped we PIN the clip to its
      // arms-raised frame (_carryHoldT) and pause — the hands keep the item up
      // instead of stopping on a random arms-down frame of the walk cycle.
      this._setState('carry');
      const a = this._actions.carry;
      if (a) {
        if (moving) {
          a.paused = false;
        } else {
          a.time = this._carryHoldT;
          a.paused = true;
        }
      }
    } else {
      this._setState(moving ? 'walk' : 'idle');
    }
  }

  triggerOpen() {
    if (!this._ready) return;
    this._openT = this._openDur;
    this._setState('open');
  }

  update(delta) {
    if (!this._mixer) return;
    this._mixer.update(delta);
    if (this._hips) this._hips.position.y = this._hips0.y;   // strip forward root motion (local +Y)
    if (this._openT > 0) { this._openT -= delta; if (this._openT <= 0) this._setState('idle'); }
  }
}
