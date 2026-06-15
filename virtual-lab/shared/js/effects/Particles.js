import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Base particle system. Labs extend this for bubbles, smoke, sparks, etc.
 *
 * Usage:
 *   const ps = new ParticleSystem(scene, { count: 80, color: 0x00aaff });
 *   ps.emit(origin);          // burst at world position
 *   ps.update(delta);         // call each frame
 */
export class ParticleSystem {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.opts = {
      count:     opts.count     ?? 60,
      color:     opts.color     ?? 0xffffff,
      size:      opts.size      ?? 0.06,
      lifetime:  opts.lifetime  ?? 2.0,
      speed:     opts.speed     ?? 1.2,
      spread:    opts.spread    ?? 0.4,
      gravity:   opts.gravity   ?? -0.5,
    };

    this._particles = [];
    this._pool      = [];
    this._mesh      = null;
    this._init();
  }

  _init() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.opts.count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color:       this.opts.color,
      size:        this.opts.size,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    this._mesh = new THREE.Points(geo, mat);
    this._mesh.frustumCulled = false;
    this.scene.add(this._mesh);

    for (let i = 0; i < this.opts.count; i++) {
      this._pool.push({ active: false, idx: i, pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 0 });
    }
  }

  /** Spawn a burst of particles at worldPos */
  emit(worldPos, count) {
    const n = count ?? Math.floor(this.opts.count * 0.3);
    let spawned = 0;
    for (const p of this._pool) {
      if (p.active || spawned >= n) continue;
      p.active = true;
      p.pos.copy(worldPos);
      const { speed, spread } = this.opts;
      p.vel.set(
        (Math.random() - 0.5) * spread,
        Math.random() * speed,
        (Math.random() - 0.5) * spread
      );
      p.maxLife = p.life = this.opts.lifetime * (0.6 + Math.random() * 0.8);
      spawned++;
    }
  }

  update(delta) {
    const pos = this._mesh.geometry.attributes.position.array;
    const { gravity } = this.opts;

    for (const p of this._pool) {
      if (!p.active) {
        pos[p.idx * 3]     = 0;
        pos[p.idx * 3 + 1] = -9999;
        pos[p.idx * 3 + 2] = 0;
        continue;
      }
      p.life -= delta;
      if (p.life <= 0) { p.active = false; continue; }

      p.vel.y += gravity * delta;
      p.pos.addScaledVector(p.vel, delta);

      pos[p.idx * 3]     = p.pos.x;
      pos[p.idx * 3 + 1] = p.pos.y;
      pos[p.idx * 3 + 2] = p.pos.z;

      this._mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    }

    this._mesh.geometry.attributes.position.needsUpdate = true;
  }

  setColor(hex) { this._mesh.material.color.setHex(hex); }

  destroy() {
    this.scene.remove(this._mesh);
    this._mesh.geometry.dispose();
    this._mesh.material.dispose();
  }
}
