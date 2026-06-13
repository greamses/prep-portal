/**
 * Ball physics: optimized for fast resets and forgiving "Arcade" scoring
 * SLOWED DOWN: Reduced launch speed, gravity, and movement for better playability
 */
import * as THREE from "three";

const AIR_DRAG = 0.92; // Increased drag (was 0.95) - slows ball more in air
const FLOOR_BOUNCE = 0.55; // Reduced bounce (was 0.65)
const FLOOR_FRICTION = 0.45; // More friction (was 0.55)
const RIM_BOUNCE = 0.3; // Softer rim bounces (was 0.4)
const BOARD_BOUNCE = 0.35; // Softer backboard (was 0.45)
const MAGNET_PULL = 7.0; // Gentler magnet (was 9.0)

/* ---------- Audio (Memory-Leak Fixed) ---------- */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let _gain = null;
let activeAudioNodes = 0;
const MAX_CONCURRENT_SOUNDS = 3;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    _gain = audioCtx.createGain();
    _gain.connect(audioCtx.destination);
    _gain.gain.value = 0.35; // Slightly lower volume for calmer feel
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playBounceSound(surface, impactVelocity) {
  if (activeAudioNodes >= MAX_CONCURRENT_SOUNDS) return;
  if (impactVelocity < 0.3) return; // Higher threshold for triggering sounds (was 0.4)
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  activeAudioNodes++;
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(_gain);
  
  let freq, decay, type, volScale;
  
  switch (surface) {
    case "rim":
      freq = 550 + Math.random() * 40; decay = 0.1; type = "triangle"; volScale = 0.03;
      break;
    case "board":
      freq = 160 + Math.random() * 20; decay = 0.12; type = "square"; volScale = 0.05;
      break;
    case "floor":
      freq = 70 + Math.random() * 30; decay = 0.2; type = "sine"; volScale = 0.08;
      break;
    case "swish":
      freq = 1000; decay = 0.3; type = "sine"; volScale = 0.05;
      break;
    default:
      freq = 100 + Math.random() * 30; decay = 0.18; type = "sine"; volScale = 0.08;
  }
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  if (surface === "swish") {
    osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.2);
  }
  
  const volume = Math.min(impactVelocity * volScale, 0.4);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
  
  osc.start();
  osc.stop(ctx.currentTime + decay);
  
  osc.onended = () => {
    try {
      osc.disconnect();
      gainNode.disconnect();
    } catch (e) {}
    activeAudioNodes--;
  };
}

/* ---------- Reusable temp vectors (minimize GC) ---------- */
const _vTmp = new THREE.Vector3();

export class BallPhysics {
  constructor(ballMesh, hoop) {
    this.mesh = ballMesh;
    this.hoop = hoop;
    this.radius = ballMesh.geometry.parameters.radius;
    this.gravity = 6.5; // REDUCED from 9.81 - slower, floatier ball

    this.velocity = new THREE.Vector3();
    this.angularVel = new THREE.Vector3();

    this.active = false;
    this.scoredThisShot = false;
    this.missedThisShot = false;
    this.passedRimPlane = false;
    this.prevY = 0;

    this.onScore = null;
    this.onRest = null;

    this.restTimer = 0;
    this._elapsedTime = 0;
    this._touchedFloor = false;
    this._touchedRim = false;
    this._touchedBoard = false;
    this._hasBouncedOnFloor = false;
    
    if (hoop && hoop.netPhysics) {
      this.netPhysics = hoop.netPhysics;
    }
  }

  launch(velocity, spinAxis) {
    if (this.active) return;

    // REDUCED LAUNCH MULTIPLIER from 1.5 to 0.85 for much slower shots
    this.velocity.copy(velocity).multiplyScalar(1.9);
    
    if (spinAxis) {
      this.angularVel.copy(spinAxis);
    } else {
      this.angularVel.set(-1, 0, 0).multiplyScalar(this.velocity.length() * 5); // Less spin (was *8)
    }

    this.active = true;
    this.scoredThisShot = false;
    this.missedThisShot = false;
    this.passedRimPlane = false;
    this.prevY = this.mesh.position.y;
    this.restTimer = 0;
    this._elapsedTime = 0;
    this._touchedRim = false;
    this._touchedBoard = false;
    this._touchedFloor = false;
    this._hasBouncedOnFloor = false;
  }

  reset(position) {
    this.mesh.position.copy(position);
    this.mesh.rotation.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.angularVel.set(0, 0, 0);

    this.active = false;
    this.scoredThisShot = false;
    this.missedThisShot = false;
    this.passedRimPlane = false;
    this.restTimer = 0;
    this._elapsedTime = 0;
    this._touchedFloor = false;
    this._hasBouncedOnFloor = false;
  }

  update(dt) {
    if (!this.active) return;

    // SLOWER GRAVITY: Using this.gravity (6.5) instead of hardcoded 9.81
    this.velocity.y += -this.gravity * 1.0 * dt; // Reduced gravity multiplier (was 1.5)
    this.velocity.multiplyScalar(1 - AIR_DRAG * dt);

    this.prevY = this.mesh.position.y;

    this._applyHoopMagnet(dt);
    
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z += this.velocity.z * dt;

    this.mesh.rotation.x += this.angularVel.x * dt;
    this.mesh.rotation.y += this.angularVel.y * dt;
    this.mesh.rotation.z += this.angularVel.z * dt;

    this._collideBackboard();
    this._collideRim();
    this._checkScore();
    this._collideFloor();
    this._collideWalls();

    const speedSq = this.velocity.x * this.velocity.x + 
                    this.velocity.y * this.velocity.y + 
                    this.velocity.z * this.velocity.z;
    const isOnFloor = this.mesh.position.y <= this.radius + 0.02;
    
    if (isOnFloor && speedSq < 0.15) { // Lower threshold (was 0.25)
      this.restTimer += dt;
      
      if (speedSq > 0.01) {
        this.velocity.multiplyScalar(0.8); // Faster deceleration (was 0.85)
        this.angularVel.multiplyScalar(0.75); // Faster angular decel (was 0.8)
      }
      
      if (this.restTimer > 0.2) { // Longer rest required (was 0.15)
        this._deactivate();
        return;
      }
    } else {
      this.restTimer = 0;
    }
    
    this._elapsedTime += dt;
    if (this._elapsedTime > 6.0 && !this.scoredThisShot) { // Longer timeout (was 5.0)
      this._deactivate();
    }
  }

  _deactivate() {
    this.active = false;
    this.velocity.set(0, 0, 0);
    this.angularVel.set(0, 0, 0);
    this.mesh.position.y = Math.max(this.mesh.position.y, this.radius);
    this.mesh.rotation.set(0, 0, 0);
    
    if (!this.scoredThisShot && !this.missedThisShot && this.onScore) {
      this.missedThisShot = true;
      this.onScore("miss");
    }
    
    if (this.onRest) this.onRest();
  }

  _applyHoopMagnet(dt) {
    if (!this.hoop || !this.hoop.rimCenter) return;
    
    const rim = this.hoop.rimCenter;
    const R = this.hoop.rimRadius;
    const p = this.mesh.position;

    if (this.velocity.y < 0 && p.y >= rim.y && p.y < rim.y + 0.6 && !this.scoredThisShot) { // Reduced range (was 0.7)
      const dx = rim.x - p.x;
      const dz = rim.z - p.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < (R * 2.2) * (R * 2.2)) { // Smaller pull zone (was 2.5)
        this.velocity.x += dx * MAGNET_PULL * dt;
        this.velocity.z += dz * MAGNET_PULL * dt;
      }
    }
  }

  _collideFloor() {
    const p = this.mesh.position;
    const floorY = 0;

    if (p.y - this.radius < floorY) {
      p.y = floorY + this.radius;

      if (!this._touchedFloor) {
        this._touchedFloor = true;
        if (!this.scoredThisShot && !this.missedThisShot && this.onScore) {
          this.missedThisShot = true;
          this.onScore("miss");
        }
      }

      if (this.velocity.y < 0) {
        const impact = -this.velocity.y;

        if (impact < 0.2) { // Lower threshold (was 0.3)
          this.velocity.y = 0;
        } else {
          this.velocity.y = impact * FLOOR_BOUNCE;
          playBounceSound("floor", impact);
        }

        this.velocity.x *= FLOOR_FRICTION;
        this.velocity.z *= FLOOR_FRICTION;
        this.angularVel.multiplyScalar(0.5); // More angular damping (was 0.6)
        this._hasBouncedOnFloor = true;
      }
    }
  }

  _collideWalls() {
    const p = this.mesh.position;
    const r = this.radius;
    let impact = 0;

    if (p.x > 7.85 - r) {
      p.x = 7.85 - r;
      impact = this.velocity.x;
      this.velocity.x *= -0.3; // Deader walls (was -0.4)
      if (impact > 0.5) playBounceSound("floor", impact);
    } else if (p.x < -7.85 + r) {
      p.x = -7.85 + r;
      impact = -this.velocity.x;
      this.velocity.x *= -0.3;
      if (impact > 0.5) playBounceSound("floor", impact);
    }
    
    if (p.z < -12.0 + r) {
      p.z = -12.0 + r;
      impact = -this.velocity.z;
      this.velocity.z *= -0.25; // Deader (was -0.35)
      if (impact > 0.5) playBounceSound("floor", impact);
    } else if (p.z > 12.0 - r) {
      p.z = 12.0 - r;
      impact = this.velocity.z;
      this.velocity.z *= -0.2; // Deader (was -0.3)
      if (impact > 0.5) playBounceSound("floor", impact);
    }
  }

  _collideBackboard() {
    if (!this.hoop || !this.hoop.backboard) return;
    
    const b = this.hoop.backboard;
    const p = this.mesh.position;
    const r = this.radius;

    if (p.z - r <= b.z && p.z - r >= b.z - 0.08 &&
        Math.abs(p.x - b.center.x) <= b.halfWidth &&
        Math.abs(p.y - b.center.y) <= b.halfHeight &&
        this.velocity.z < 0) {
      
      p.z = b.z + r;
      const impact = -this.velocity.z;

      this.velocity.z = impact * BOARD_BOUNCE;
      this.velocity.x *= 0.4; // More energy loss (was 0.5)
      this.velocity.y *= 0.4; // More energy loss (was 0.5)

      this._touchedBoard = true;
      playBounceSound("board", impact);
    }
  }

  _collideRim() {
    if (!this.hoop || !this.hoop.rimCenter) return;
    
    const rim = this.hoop.rimCenter;
    const R = this.hoop.rimRadius;
    const tube = this.hoop.rimTubeRadius || 0.022;
    const p = this.mesh.position;

    const dx = p.x - rim.x;
    const dz = p.z - rim.z;
    const dy = p.y - rim.y;

    const horizSq = dx * dx + dz * dz;
    if (horizSq < 1e-8) return;

    const horiz = Math.sqrt(horizSq);
    const invHoriz = 1 / horiz;
    const cx = dx * invHoriz * R;
    const cz = dz * invHoriz * R;

    const ex = dx - cx;
    const ez = dz - cz;

    const dist = Math.sqrt(ex * ex + ez * ez + dy * dy);
    const minDist = this.radius + tube;

    if (dist < minDist) {
      const invDist = 1 / dist;
      const nx = ex * invDist;
      const ny = dy * invDist;
      const nz = ez * invDist;

      const push = minDist - dist;

      p.x += nx * push;
      p.y += ny * push;
      p.z += nz * push;

      const vn = this.velocity.x * nx + this.velocity.y * ny + this.velocity.z * nz;

      if (vn < 0) {
        const bounce = (1 + RIM_BOUNCE) * vn;

        this.velocity.x -= bounce * nx;
        this.velocity.y -= bounce * ny;
        this.velocity.z -= bounce * nz;

        this.velocity.multiplyScalar(0.6); // More energy loss (was 0.7)
        this._touchedRim = true;
        playBounceSound("rim", -vn);
      }
    }
  }

  _checkScore() {
    if (this.scoredThisShot || this._touchedFloor || !this.hoop) return;
    
    const rim = this.hoop.rimCenter;
    const R = this.hoop.rimRadius;
    const p = this.mesh.position;

    if (this.prevY > rim.y && p.y <= rim.y && this.velocity.y < 0) {
      const dx = p.x - rim.x;
      const dz = p.z - rim.z;
      const horizSq = dx * dx + dz * dz;

      if (horizSq < (R + this.radius * 0.8) * (R + this.radius * 0.8)) {
        this.scoredThisShot = true;

        const swish = !this._touchedRim && !this._touchedBoard;

        this.velocity.x *= 0.2; // Slower after scoring (was 0.3)
        this.velocity.z *= 0.2; // Slower after scoring (was 0.3)
        this.velocity.y *= 0.5; // Slower fall (was 0.6)
        this.angularVel.multiplyScalar(0.4); // Less spin (was 0.5)

        if (this.netPhysics) {
          this.netPhysics.startWave(this.velocity, p);
        }

        if (swish) playBounceSound("swish", 0.8);

        if (this.onScore) {
          this.onScore(swish ? "swish" : "score");
        }
      }
    }
  }

  isOnFloor() {
    return this.mesh.position.y <= this.radius + 0.02;
  }

  isNetWaving() {
    return this.netPhysics ? this.netPhysics.waving : false;
  }

  getNetPhysics() {
    return this.netPhysics;
  }
}