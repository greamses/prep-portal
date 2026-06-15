import * as THREE from 'three';
import { ROOM } from './Room.js';

/**
 * A wash sink mounted against the back wall: a metal base cabinet with doors, a
 * matte dark-resin counter, a recessed stainless basin with a drain and standing
 * water, and a curved chrome gooseneck tap you can turn ON/OFF (aim at the
 * faucet and press E). While running, water falls from the aerator and the basin
 * surface ripples.
 *
 * Built into the room group passed as `scene`, so it gates with the room. The
 * faucet group is exposed as `mesh` (the raycast target); `colliders` blocks the
 * player from walking into the cabinet.
 *
 * envMapIntensity is kept low throughout — the lab's ceiling lights are bright,
 * and at full strength the light surfaces blow out to a reflective white.
 */

const MAT = {
  // Brushed-metal base cabinet (matte, barely reflective)
  cabinet : new THREE.MeshStandardMaterial({ color: 0xb0aea4, roughness: 0.74, metalness: 0.12, envMapIntensity: 0.35 }),
  door    : new THREE.MeshStandardMaterial({ color: 0xa3a197, roughness: 0.7,  metalness: 0.14, envMapIntensity: 0.35 }),
  toe     : new THREE.MeshStandardMaterial({ color: 0x5c5b54, roughness: 0.8,  metalness: 0.1,  envMapIntensity: 0.25 }),
  // Mid-grey epoxy-resin worktop — matte (no glare) but light enough that the
  // bright basin set into it clearly reads as a sink, not a tabletop.
  counter : new THREE.MeshStandardMaterial({ color: 0x6f726d, roughness: 0.64, metalness: 0.05, envMapIntensity: 0.3  }),
  // Bright stainless basin bowl — contrasts with the worktop so it's obvious
  basin   : new THREE.MeshStandardMaterial({ color: 0xc3c7c9, roughness: 0.28, metalness: 0.6,  envMapIntensity: 0.5  }),
  drain   : new THREE.MeshStandardMaterial({ color: 0x3a3d3f, roughness: 0.5,  metalness: 0.6,  envMapIntensity: 0.4  }),
  // Polished chrome for the tap + handles
  chrome  : new THREE.MeshStandardMaterial({ color: 0xccd0d4, roughness: 0.17, metalness: 0.95, envMapIntensity: 0.7  }),
};

function box(scene, w, h, d, mat, x, y, z, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = cast; m.receiveShadow = true;
  scene.add(m);
  return m;
}

export class WashSink {
  constructor(scene, { x = -3.5, z = ROOM.d / 2 - 0.34 } = {}) {
    const cx = x, cz = z;                         // against the back wall (z ≈ 4.66)
    const cabW = 1.2, cabH = 0.82, cabD = 0.55;
    const counterY = cabH + 0.04;                 // worktop centre
    const top = counterY + 0.02;                  // worktop surface (≈ 0.88)
    const frontZ = cz - cabD / 2;                 // cabinet face (room side)

    // ── Base cabinet ────────────────────────────────────────────────────────────
    box(scene, cabW, cabH, cabD, MAT.cabinet, cx, cabH / 2 + 0.06, cz);
    // Recessed toe-kick at the floor
    box(scene, cabW - 0.06, 0.12, cabD - 0.06, MAT.toe, cx, 0.06, cz);

    // Two doors with an inset reveal + slim vertical bar handles
    const doorH = cabH - 0.14, doorW = cabW / 2 - 0.03, doorY = cabH / 2 + 0.06;
    [-1, 1].forEach(s => {
      const dxc = s * (cabW / 4 + 0.005);
      box(scene, doorW, doorH, 0.02, MAT.door, cx + dxc, doorY, frontZ - 0.004);
      // Handle near the centre split
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 10), MAT.chrome);
      handle.position.set(cx + s * 0.05, doorY, frontZ - 0.03);
      scene.add(handle);
    });

    // ── Recessed stainless basin (floor + four short walls) ─────────────────────
    const bW = 0.62, bD = 0.42, depth = 0.22, wall = 0.018;

    // ── Worktop built as a FRAME around the basin cutout (so the bowl is visible
    //    from above — a solid slab would hide it and look like a tabletop) ───────
    const oW = cabW + 0.04, oD = cabD + 0.04;          // worktop outer footprint
    const sideW = oW / 2 - bW / 2, endD = oD / 2 - bD / 2;
    box(scene, oW, 0.04, endD, MAT.counter, cx, counterY, cz - (bD / 2 + oD / 2) / 2); // front rail
    box(scene, oW, 0.04, endD, MAT.counter, cx, counterY, cz + (bD / 2 + oD / 2) / 2); // back rail
    box(scene, sideW, 0.04, bD, MAT.counter, cx - (bW / 2 + oW / 2) / 2, counterY, cz); // left rail
    box(scene, sideW, 0.04, bD, MAT.counter, cx + (bW / 2 + oW / 2) / 2, counterY, cz); // right rail
    box(scene, oW, 0.09, 0.03, MAT.counter, cx, top + 0.045, cz + cabD / 2 + 0.005);    // upstand at wall
    const floorY = top - depth;
    box(scene, bW,   wall,  bD,   MAT.basin, cx,          floorY,             cz);            // floor
    box(scene, wall, depth, bD,   MAT.basin, cx - bW / 2, floorY + depth / 2, cz);            // left
    box(scene, wall, depth, bD,   MAT.basin, cx + bW / 2, floorY + depth / 2, cz);            // right
    box(scene, bW,   depth, wall, MAT.basin, cx,          floorY + depth / 2, cz - bD / 2);   // front (room side)
    box(scene, bW,   depth, wall, MAT.basin, cx,          floorY + depth / 2, cz + bD / 2);   // back (wall side)

    // Drain (recessed ring + cross strainer) at the basin floor
    const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.006, 20), MAT.drain);
    drain.position.set(cx, floorY + 0.006, cz); scene.add(drain);
    const strainer1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.002, 0.006), MAT.chrome);
    strainer1.position.set(cx, floorY + 0.01, cz); scene.add(strainer1);
    const strainer2 = strainer1.clone(); strainer2.rotation.y = Math.PI / 2; scene.add(strainer2);

    // Standing water in the basin (animated when the tap runs)
    this._waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x3f93b0, transmission: 0.78, roughness: 0.12,
      transparent: true, opacity: 0.5, side: THREE.DoubleSide,
      ior: 1.33, envMapIntensity: 0.5,
    });
    this._water = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.05, 0.03, bD - 0.05), this._waterMat);
    this._water.position.set(cx, floorY + 0.045, cz);
    scene.add(this._water);
    this._waterY = floorY + 0.045;

    // ── Curved chrome gooseneck tap ─────────────────────────────────────────────
    // Base at the BACK of the basin (against the wall, +z); the neck sweeps up and
    // FORWARD over the basin so the aerator points down toward the room (−z).
    const faucet = new THREE.Group();
    const baseZ  = cz + bD / 2 + 0.05;            // deck mount, wall side
    const tipZ   = cz - 0.03;                     // over the basin, room side
    const tipY   = top + 0.20;

    // Deck flange
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.025, 20), MAT.chrome);
    flange.position.set(cx, top + 0.012, baseZ); faucet.add(flange);

    // Swept neck (Catmull-Rom through control points → smooth gooseneck tube)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cx, top + 0.02,  baseZ),
      new THREE.Vector3(cx, top + 0.22,  baseZ),
      new THREE.Vector3(cx, top + 0.33,  baseZ - 0.03),
      new THREE.Vector3(cx, top + 0.345, (baseZ + tipZ) / 2),
      new THREE.Vector3(cx, top + 0.30,  tipZ),
      new THREE.Vector3(cx, tipY + 0.02, tipZ),
    ]);
    const neck = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.014, 14), MAT.chrome);
    neck.castShadow = true; faucet.add(neck);

    // Aerator at the spout tip
    const aerator = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.014, 0.03, 16), MAT.chrome);
    aerator.position.set(cx, tipY, tipZ); faucet.add(aerator);
    this._spoutTipY = tipY - 0.015;

    // Hot/cold lever handles on the deck (chrome arm + coloured indicator cap)
    [[-0.08, 0xc0392b], [0.08, 0x2e6fb0]].forEach(([dx, col]) => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 12), MAT.chrome);
      stem.position.set(cx + dx, top + 0.03, baseZ); faucet.add(stem);
      const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 12), MAT.chrome);
      lever.rotation.z = Math.PI / 2.6;
      lever.position.set(cx + dx + (dx < 0 ? -0.025 : 0.025), top + 0.065, baseZ); faucet.add(lever);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 12, 10),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, envMapIntensity: 0.4 }),
      );
      cap.position.set(cx + dx + (dx < 0 ? -0.05 : 0.05), top + 0.085, baseZ); faucet.add(cap);
    });
    scene.add(faucet);

    // Water stream (hidden until the tap is on)
    const streamH = this._spoutTipY - (this._waterY + 0.015);
    const streamMat = new THREE.MeshBasicMaterial({
      color: 0xbfe6f2, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false,
    });
    this._stream = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, streamH, 10), streamMat);
    this._stream.position.set(cx, (this._spoutTipY + this._waterY) / 2, tipZ);
    this._stream.visible = false;
    scene.add(this._stream);

    this.mesh = faucet;          // raycast target
    this.on   = false;
    this._t   = 0;

    this.colliders = [new THREE.Box3(
      new THREE.Vector3(cx - (cabW + 0.1) / 2, 0, cz - (cabD + 0.1) / 2),
      new THREE.Vector3(cx + (cabW + 0.1) / 2, 2.5, cz + (cabD + 0.1) / 2),
    )];
  }

  get hintText() { return this.on ? 'turn off tap' : 'turn on tap'; }

  toggle() {
    this.on = !this.on;
    this._stream.visible = this.on;
  }

  update(delta) {
    if (this.on) {
      this._t += delta;
      // Flowing stream: subtle length/opacity shimmer
      this._stream.scale.x = this._stream.scale.z = 0.85 + 0.3 * Math.random();
      this._stream.material.opacity = 0.5 + 0.2 * Math.random();
      // Basin ripple: gentle bob + opacity pulse
      this._water.position.y = this._waterY + Math.sin(this._t * 9) * 0.004;
      this._waterMat.opacity = 0.5 + 0.12 * (0.5 + 0.5 * Math.sin(this._t * 6));
    } else if (this._water.position.y !== this._waterY) {
      this._water.position.y = this._waterY;
      this._waterMat.opacity = 0.5;
    }
  }
}
