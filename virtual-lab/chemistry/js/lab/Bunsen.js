import * as THREE from 'three';

/**
 * Bunsen burner with a working gas knob. Aim at it and press E to turn the
 * flame on/off; the knob rotates a quarter-turn and the flame (with a small
 * point light) appears and flickers while lit. The flame is adjustable —
 * increase()/decrease() (scroll or +/− on desktop, the on-screen buttons on
 * mobile) trim it between a low simmer and a roaring blue cone.
 */

const MAT = {
  iron  : new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.45, metalness: 0.6 }),
  steel : new THREE.MeshStandardMaterial({ color: 0xa6a6aa, roughness: 0.3, metalness: 0.8 }),
  brass : new THREE.MeshStandardMaterial({ color: 0xb89436, roughness: 0.32, metalness: 0.7 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x222020, roughness: 0.85 }),
  knob  : new THREE.MeshStandardMaterial({ color: 0xc23b2b, roughness: 0.5 }),
};
const flameOuterMat = new THREE.MeshBasicMaterial({ color: 0x57b0ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
const flameInnerMat = new THREE.MeshBasicMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.9,  blending: THREE.AdditiveBlending, depthWrite: false });

function m(geo, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

export class Bunsen {
  constructor(scene, { x = 0, z = 0, top = 0.89, on = false } = {}) {
    this._g = new THREE.Group();
    this._g.position.set(x, top, z);
    scene.add(this._g);

    this._g.add(m(new THREE.CylinderGeometry(0.05, 0.056, 0.012, 24), MAT.iron, 0, 0.006, 0));  // base
    this._g.add(m(new THREE.CylinderGeometry(0.016, 0.02, 0.022, 18), MAT.iron, 0, 0.022, 0));  // throat
    this._g.add(m(new THREE.CylinderGeometry(0.011, 0.013, 0.115, 18), MAT.steel, 0, 0.09, 0)); // barrel
    const collar = m(new THREE.TorusGeometry(0.013, 0.004, 8, 18), MAT.brass, 0, 0.05, 0);
    collar.rotation.x = Math.PI / 2; this._g.add(collar);                                        // air collar
    const spigot = m(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 10), MAT.brass, 0.045, 0.02, 0);
    spigot.rotation.z = Math.PI / 2; this._g.add(spigot);
    const hose = m(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 10), MAT.rubber, 0.085, 0.02, 0);
    hose.rotation.z = Math.PI / 2; this._g.add(hose);

    // Gas knob (the interact handle): a red valve + lever that turns a quarter-turn
    this._knob = new THREE.Group();
    this._knob.position.set(0.058, 0.02, 0);
    const valve = m(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 14), MAT.knob);
    valve.rotation.z = Math.PI / 2;
    const lever = m(new THREE.BoxGeometry(0.006, 0.03, 0.006), MAT.knob, 0, 0, 0);
    this._knob.add(valve, lever);
    this._g.add(this._knob);

    // Flame (hidden until lit) + local point light
    this._flame = new THREE.Group();
    this._flame.visible = false;
    this._outer = m(new THREE.ConeGeometry(0.018, 0.075, 14), flameOuterMat.clone(), 0, 0.185, 0);
    this._inner = m(new THREE.ConeGeometry(0.009, 0.042, 12), flameInnerMat.clone(), 0, 0.168, 0);
    this._outer.castShadow = this._inner.castShadow = false;
    this._flame.add(this._outer, this._inner);
    this._light = new THREE.PointLight(0x66b0ff, 0.6, 0.85, 2);
    this._light.position.set(0, 0.2, 0);
    this._light.visible = false;
    this._flame.add(this._light);
    this._g.add(this._flame);

    this.on = false;
    this.level = 0.6;             // flame size, 0..1 (adjustable while lit)
    this._t = Math.random() * 100;
    this.mesh = this._g;          // raycast target (whole burner)
    this.isBunsen = true;         // lets the input layer route +/− & scroll here

    if (on) this.toggle();
  }

  get hintText() { return this.on ? 'turn off' : 'turn on'; }

  toggle() {
    this.on = !this.on;
    this._flame.visible = this.on;
    this._light.visible = this.on;
    this._knob.rotation.x = this.on ? Math.PI / 2 : 0;  // quarter-turn
    if (this.on) {
      // Ignite instantly: set a full flame state THIS frame instead of letting
      // it grow from the default cone size on the next update() — that one-frame
      // grow read as a brief lag/pop when lighting the burner.
      this._t = 0;
      this._applyLevel();
      this._outer.scale.set(1, 1, 1);
      this._inner.scale.set(1, 1, 1);
      this._light.intensity = 0.5 + this.level * 0.7;
    }
  }

  // Flame height/light scale with the level; called whenever the level changes.
  _applyLevel() {
    const L = this.level;
    this._flame.scale.set(0.85 + L * 0.35, 0.6 + L * 1.0, 0.85 + L * 0.35);
    this._light.distance = 0.55 + L * 0.9;
  }

  increase() {
    if (!this.on) { this.level = 0.4; this.toggle(); return; }   // off → light low
    this.level = Math.min(1, this.level + 0.2);
    this._applyLevel();
  }

  decrease() {
    if (!this.on) return;
    this.level -= 0.2;
    if (this.level < 0.2) { this.level = 0.4; this.toggle(); }   // turned all the way down → off
    else this._applyLevel();
  }

  update(delta) {
    if (!this.on) return;
    this._t += delta;
    const t = this._t * 6;
    const n = 0.5 + 0.34 * Math.sin(t * 1.7) + 0.16 * Math.sin(t * 4.3 + 1.1);
    const flick = THREE.MathUtils.clamp(0.78 + 0.34 * n + (Math.random() - 0.5) * 0.06, 0.6, 1.3);
    this._outer.scale.set(0.92 + n * 0.2, flick, 0.92 + n * 0.2);
    this._inner.scale.set(1, 0.8 + n * 0.35, 1);
    this._outer.material.opacity = 0.4 + 0.22 * n;
    this._inner.material.opacity = 0.8 + 0.15 * n;
    const jx = (Math.random() - 0.5) * 0.004;
    this._outer.position.x = jx;
    this._inner.position.x = jx * 0.5;
    // Overall brightness tracks the flame level so a bigger flame lights more.
    this._light.intensity = (0.3 + this.level * 0.8) * (0.7 + 0.5 * n) + (Math.random() - 0.5) * 0.08;
  }
}
