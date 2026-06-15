import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * First-person hands, parented to the camera. Replaces the 2D crosshair: the
 * right hand reaches toward what's in range, both hands come together to cradle
 * a picked-up object, and the procedural fallback fingers clench when grabbing.
 *
 * Loads a sculpted hand GLB and falls back to a procedural hand until the file
 * exists. Drop a model at: virtual-lab/shared/models/hand.glb
 *
 * Hand model: "Hand" (https://sketchfab.com/3d-models/hand-793cce8e3ffa4aa393f6ad0143ddffd9)
 * by hotboom (https://sketchfab.com/hotboom), licensed CC BY 4.0
 * (http://creativecommons.org/licenses/by/4.0/). Keep this credit on use.
 */

/* ╔══════════════════════════════════════════════════════════════════════════╗
   ║  TUNE ME — every hand / held-object placement lives here. Edit & reload.  ║
   ║  Camera space:  +X = right,  +Y = up,  -Z = forward (away from you).       ║
   ║  pos = [x, y, z] in metres.   rot = [x, y, z] in radians.                  ║
   ╚══════════════════════════════════════════════════════════════════════════╝ */
const TUNE = {
  // ── Loaded model fit/orientation ──
  modelLen:   0.20,                 // target hand length (metres)
  modelRot:   [0, -Math.PI / 2, 0], // orient so fingers point forward (-Z)
  modelScale: 1.0,                  // extra multiplier after auto-fit

  // ── Idle: hands resting, nothing in range ──
  restRight:  { pos: [ 0.27, -0.43, -0.74], rot: [ 0.22, -0.12,  0.05] },
  restLeft:   { pos: [-0.29, -0.45, -0.78], rot: [ 0.20,  0.12, -0.05] },

  // ── Reaching: right hand stretches toward an interactable ──
  reachRight: { pos: [ 0.15, -0.27, -1.02], rot: [ 0.00, -0.05,  0.02] },

  // ── Holding: BOTH hands come together to cradle the object near centre ──
  holdRight:  { pos: [ 0.11, -0.34, -0.55], rot: [ 0.55, -0.40, -0.30] },
  holdLeft:   { pos: [-0.11, -0.34, -0.55], rot: [ 0.55,  0.40,  0.30] },

  // ── The held object's anchor: sits BETWEEN the two hands ──
  heldObject: { pos: [ 0.00, -0.32, -0.55], rot: [0, 0, 0], scale: 1.0 },
};

// Procedural-fallback poses (its fingers point +Y, so it needs its own set).
const PROC = {
  restRight:  { pos: [ 0.21, -0.32, -0.60], rot: [-1.15, -0.28,  0.16] },
  restLeft:   { pos: [-0.23, -0.35, -0.64], rot: [-1.10,  0.30, -0.16] },
  reachRight: { pos: [ 0.10, -0.16, -0.92], rot: [-1.48, -0.06,  0.05] },
  holdRight:  { pos: [ 0.12, -0.30, -0.52], rot: [-1.30, -0.30,  0.10] },
  holdLeft:   { pos: [-0.12, -0.30, -0.52], rot: [-1.10,  0.30, -0.10] },
};

const CURL = -1;
const lerp = (a, b, t) => a + (b - a) * t;
const V = a => new THREE.Vector3(a[0], a[1], a[2]);
const E = a => new THREE.Euler(a[0], a[1], a[2]);
const pose = t => ({ p: V(t.pos), e: E(t.rot) });

function buildPoses(src) {
  return {
    restRight:  pose(src.restRight),
    restLeft:   pose(src.restLeft),
    reachRight: pose(src.reachRight),
    holdRight:  pose(src.holdRight),
    holdLeft:   pose(src.holdLeft),
  };
}

// blend(out, A, B, t) → out = lerp(A, B, t).  Safe when out === A.
function blendPose(out, A, B, t) {
  out.p.lerpVectors(A.p, B.p, t);
  out.e.set(lerp(A.e.x, B.e.x, t), lerp(A.e.y, B.e.y, t), lerp(A.e.z, B.e.z, t));
}

// ── Procedural fallback geometry ───────────────────────────────────────────────

const skinMat = new THREE.MeshPhysicalMaterial({
  color: 0xc6886a, roughness: 0.62, metalness: 0.0,
  clearcoat: 0.28, clearcoatRoughness: 0.6,
  sheen: 0.35, sheenColor: new THREE.Color(0xd98a6a), sheenRoughness: 0.7,
});
const nailMat = new THREE.MeshPhysicalMaterial({
  color: 0xe7c2b1, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.28,
});
const cuffMat = new THREE.MeshStandardMaterial({ color: 0xeceae2, roughness: 0.8 });
const BALL = new THREE.SphereGeometry(1, 18, 14);

function ball(mat, sx, sy, sz, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(BALL, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

function makeFinger(segLens, baseR, restCurl) {
  const joints = [];
  let parent = new THREE.Group();
  const root = parent;
  let r = baseR;
  segLens.forEach((len, i) => {
    const joint = new THREE.Group();
    parent.add(joint);
    joint.add(ball(skinMat, r * 1.16, r * 1.16, r * 0.98));
    const half = len / 2;
    joint.add(ball(skinMat, r * 1.04, half + r * 0.5, r * 0.86, 0, half, 0));
    if (i === segLens.length - 1) {
      const tipR = r * 0.8;
      joint.add(ball(skinMat, tipR * 1.05, tipR * 1.1, tipR * 0.92, 0, len - tipR * 0.4, tipR * 0.15));
      const nail = ball(nailMat, tipR * 0.92, len * 0.30, tipR * 0.55, 0, len - len * 0.18, -tipR * 0.62);
      nail.rotation.x = 0.18;
      joint.add(nail);
    }
    joint.rotation.x = CURL * restCurl[i];
    const next = new THREE.Group();
    next.position.y = len;
    joint.add(next);
    joints.push(joint);
    parent = next;
    r *= 0.8;
  });
  return { root, joints, restCurl };
}

function makeProceduralHand(side) {
  const sign = side === 'right' ? 1 : -1;
  const hand = new THREE.Group();
  hand.add(ball(skinMat, 0.072, 0.092, 0.03, 0, 0.005, 0));
  hand.add(ball(skinMat, 0.062, 0.05, 0.034, 0, -0.055, 0.003));
  hand.add(ball(skinMat, 0.032, 0.058, 0.03, sign * 0.04, -0.018, 0.014));
  hand.add(ball(skinMat, 0.024, 0.06, 0.026, -sign * 0.05, -0.02, 0.004));
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.06, 16), skinMat);
  wrist.position.y = -0.085; hand.add(wrist);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.075, 18), cuffMat);
  cuff.position.y = -0.14; hand.add(cuff);

  const defs = [
    { x:  0.027, y: 0.082, z: 0.006, len: 0.075, r: 0.0094, splay:  0.13 },
    { x:  0.009, y: 0.090, z: 0.010, len: 0.083, r: 0.0098, splay:  0.03 },
    { x: -0.010, y: 0.084, z: 0.006, len: 0.078, r: 0.0093, splay: -0.05 },
    { x: -0.028, y: 0.072, z: 0.000, len: 0.060, r: 0.0082, splay: -0.16 },
  ];
  const restCurl = [0.24, 0.36, 0.30];
  const fingers = defs.map(d => {
    const segs = [d.len * 0.45, d.len * 0.33, d.len * 0.22];
    const f = makeFinger(segs, d.r, restCurl.slice());
    f.root.position.set(sign * d.x, d.y, d.z);
    f.root.rotation.z = -sign * d.splay;
    f.root.rotation.x = -0.12;
    hand.add(f.root);
    return f;
  });
  const thumb = makeFinger([0.03, 0.024], 0.0115, [0.35, 0.4]);
  thumb.root.position.set(sign * 0.05, -0.028, 0.02);
  thumb.root.rotation.set(-0.7, sign * 0.35, sign * 1.0);
  hand.add(thumb.root);
  return { group: hand, fingers, thumb };
}

// ── Hands ──────────────────────────────────────────────────────────────────────

export class Hands {
  constructor(camera, { modelUrl = '../shared/models/hand.glb', onReady } = {}) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.visible = false;
    camera.add(this.group);

    // Anchor that picked-up objects ride in — sits between the hands.
    this.holder = new THREE.Object3D();
    this.holder.position.copy(V(TUNE.heldObject.pos));
    this.holder.rotation.copy(E(TUNE.heldObject.rot));
    this.holder.scale.setScalar(TUNE.heldObject.scale);
    camera.add(this.holder);

    this._modelMode = false;
    this._onReady   = onReady || (() => {});
    this._readyFired = false;

    // Animation state
    this._reach = 0; this._reachTarget = 0;
    this._grab  = 0; this._grabTarget  = 0;
    this._hold  = 0; this._holdTarget  = 0;
    this._pulse = 0;
    this._bob   = 0;
    this._clear = Infinity;          // distance to nearest surface ahead

    // Scratch poses (avoid per-frame allocation)
    this._sr = { p: new THREE.Vector3(), e: new THREE.Euler() };
    this._sl = { p: new THREE.Vector3(), e: new THREE.Euler() };

    // Procedural fallback shown immediately
    this._poses = buildPoses(PROC);
    this.right = makeProceduralHand('right');
    this.left  = makeProceduralHand('left');
    this.group.add(this.right.group, this.left.group);

    this._loadModel(modelUrl);
  }

  _loadModel(url) {
    const loader = new GLTFLoader();
    const draco  = new DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(draco);
    loader.load(
      url,
      gltf => { this._installModel(gltf.scene); this._ready(); },
      undefined,
      () => { this._ready(); /* no model — keep procedural fallback */ },
    );
  }

  _ready() {
    if (this._readyFired) return;
    this._readyFired = true;
    this._onReady();
  }

  _installModel(scene) {
    const fit = obj => {
      const box  = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const ctr  = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const s = (TUNE.modelLen / maxDim) * TUNE.modelScale;
      obj.scale.setScalar(s);
      obj.position.sub(ctr.multiplyScalar(s));
      obj.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
      const wrap = new THREE.Group();
      wrap.rotation.set(TUNE.modelRot[0], TUNE.modelRot[1], TUNE.modelRot[2]);
      wrap.add(obj);
      return wrap;
    };

    this.group.remove(this.right.group, this.left.group);

    const leftSource = scene.clone(true);
    const rightModel = fit(scene);
    const leftWrap   = fit(leftSource);
    leftWrap.traverse(o => { if (o.isMesh) o.material = o.material.clone(); });

    // Mirror on an OUTER node (after orientation) so fingers don't flip backward.
    const mirror = new THREE.Group();
    mirror.scale.x = -1;
    mirror.add(leftWrap);

    const rg = new THREE.Group(); rg.add(rightModel);
    const lg = new THREE.Group(); lg.add(mirror);
    this.right = { group: rg };
    this.left  = { group: lg };
    this.group.add(rg, lg);

    this._poses = buildPoses(TUNE);   // switch to the tunable model pose set
    this._modelMode = true;
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  setReaching(on) { this._reachTarget = on ? 1 : 0; }
  setHolding(on)  { this._holdTarget  = on ? 1 : 0; }
  setClearance(d) { this._clear = d; }   // nearest surface distance ahead (metres)
  pulseGrab() { this._pulse = 0.36; }

  // Clamp a hand/holder Z so its forward reach stays in front of nearby geometry
  _retractZ(z) {
    const HAND_LEN = 0.26;                 // how far the mesh extends past its origin
    const maxFwd = -(this._clear - HAND_LEN);
    return z < maxFwd ? maxFwd : z;        // z is negative = forward
  }

  update(delta, moving = false) {
    if (this._pulse > 0) { this._pulse -= delta; this._grabTarget = 1; }
    else this._grabTarget = Math.max(this._reach * 0.15, this._hold * 0.6);

    this._reach += (this._reachTarget - this._reach) * Math.min(1, delta * 9);
    this._grab  += (this._grabTarget  - this._grab)  * Math.min(1, delta * 16);
    this._hold  += (this._holdTarget  - this._hold)  * Math.min(1, delta * 10);

    this._bob += delta * (moving ? 9 : 2.2);
    const bobY = Math.sin(this._bob) * (moving ? 0.012 : 0.004);

    const P = this._poses;

    // Right: rest → reach, then blend toward the hold (cradle) pose
    blendPose(this._sr, P.restRight, P.reachRight, this._reach);
    blendPose(this._sr, this._sr, P.holdRight, this._hold);
    this.right.group.position.set(this._sr.p.x, this._sr.p.y + bobY, this._retractZ(this._sr.p.z));
    this.right.group.rotation.copy(this._sr.e);

    // Left: rest, then blend toward the hold pose
    this._sl.p.copy(P.restLeft.p); this._sl.e.copy(P.restLeft.e);
    blendPose(this._sl, this._sl, P.holdLeft, this._hold);
    this.left.group.position.set(this._sl.p.x, this._sl.p.y + bobY * 0.6, this._retractZ(this._sl.p.z));
    this.left.group.rotation.copy(this._sl.e);

    // Retract the held object too so it doesn't poke through nearby surfaces
    this.holder.position.z = this._retractZ(TUNE.heldObject.pos[2]);

    if (this._modelMode) {
      // Static model: fake a grab as a small forward press (skip while holding)
      if (this._hold < 0.5) {
        this.right.group.position.z -= this._grab * 0.03;
        this.right.group.position.y -= this._grab * 0.02;
        this.right.group.rotation.x += this._grab * 0.28;
      }
    } else {
      this._curlHand(this.right, this._grab, this._reach);
      this._curlHand(this.left, Math.max(this._reach * 0.05, this._hold * 0.5), 0);
    }
  }

  _curlHand(hand, grab, reach) {
    hand.fingers.forEach(f => {
      f.joints.forEach((j, i) => {
        const rest = f.restCurl[i] * (1 - reach * 0.6);
        const amt  = rest + grab * (0.55 + i * 0.28);
        j.rotation.x = CURL * amt;
      });
    });
    hand.thumb.joints.forEach((j, i) => {
      const rest = hand.thumb.restCurl[i] * (1 - reach * 0.4);
      j.rotation.x = CURL * (rest + grab * (0.4 + i * 0.2));
    });
  }
}
