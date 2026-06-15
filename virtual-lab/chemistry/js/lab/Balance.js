import * as THREE from 'three';

/**
 * A live electronic weighing balance. Set a piece of glassware (any Pickup)
 * down on the pan and its mass shows on the digital readout; lift it off and
 * the reading returns to 0.00 g. Built into the room group passed as `scene`.
 *
 * `update(pickups)` is called each frame with the room's Pickup list — anything
 * resting on the pan (not held) is summed onto the display.
 */

const steel   = new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.28, metalness: 0.75 });
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.5 });

export class Balance {
  constructor(scene, { x = 1.6, z = 1.2, top = 0.89 } = {}) {
    const bodyW = 0.34, bodyH = 0.10, bodyD = 0.30;

    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), bodyMat);
    body.position.set(x, top + bodyH / 2, z); body.castShadow = true; body.receiveShadow = true;
    scene.add(body);

    // Digital readout — a canvas texture so it can show a live number. It faces
    // +z (the entrance side the player approaches from) and tilts up to read.
    this._canvas = document.createElement('canvas');
    this._canvas.width = 256; this._canvas.height = 96;
    this._ctx = this._canvas.getContext('2d');
    this._tex = new THREE.CanvasTexture(this._canvas);
    this._tex.colorSpace = THREE.SRGBColorSpace;
    const disp = new THREE.Mesh(
      new THREE.PlaneGeometry(0.17, 0.055),
      new THREE.MeshBasicMaterial({ map: this._tex }),
    );
    disp.position.set(x, top + 0.055, z + bodyD / 2 + 0.006);
    disp.rotation.x = -0.45;
    scene.add(disp);

    // Pan support + circular stainless weighing pan
    const panY = top + bodyH + 0.035;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12), steel);
    post.position.set(x, top + bodyH + 0.015, z - 0.02); scene.add(post);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 28), steel);
    pan.position.set(x, panY, z - 0.02); pan.castShadow = true; scene.add(pan);

    this.panCenter = new THREE.Vector3(x, panY + 0.006, z - 0.02);
    this.panRadius = 0.12;

    this._value = -1;        // force the first draw
    this._draw(0);
  }

  // Sum the mass of every pickup resting on the pan and update the readout.
  update(pickups) {
    let mass = 0;
    for (const p of pickups) {
      if (!p || p.held || p._state !== 'rest') continue;
      const wp = p.mesh.position;     // room group sits at the origin → these are world coords
      const dx = wp.x - this.panCenter.x;
      const dz = wp.z - this.panCenter.z;
      const dy = wp.y - this.panCenter.y;
      if (Math.hypot(dx, dz) <= this.panRadius && dy > -0.04 && dy < 0.08) mass += (p.mass || 0);
    }
    if (Math.abs(mass - this._value) > 0.001) { this._value = mass; this._draw(mass); }
  }

  _draw(mass) {
    const c = this._ctx;
    c.fillStyle = '#06120e';
    c.fillRect(0, 0, 256, 96);
    c.fillStyle = '#39ffb0';
    c.textBaseline = 'middle';
    c.font = 'bold 54px monospace';
    c.textAlign = 'right';
    c.fillText(mass.toFixed(2), 200, 50);
    c.font = 'bold 30px monospace';
    c.textAlign = 'left';
    c.fillText('g', 210, 54);
    this._tex.needsUpdate = true;
  }
}
