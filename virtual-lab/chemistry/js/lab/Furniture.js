import * as THREE from 'three';
import { ROOM } from './Room.js';

// Shared materials
const MAT = {
  benchTop  : new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.12, metalness: 0.0, envMapIntensity: 1.0 }),
  benchBody : new THREE.MeshStandardMaterial({ color: 0x9c8e78, roughness: 0.68 }),
  steel     : new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.28, metalness: 0.75 }),
  cabinet   : new THREE.MeshStandardMaterial({ color: 0xd4cbb0, roughness: 0.65 }),
  cabinetIn : new THREE.MeshStandardMaterial({ color: 0xc3b89c, roughness: 0.78, side: THREE.DoubleSide }),
  cabinetDark: new THREE.MeshStandardMaterial({ color: 0x2e2b26, roughness: 0.82 }),
  bottleAmber: new THREE.MeshPhysicalMaterial({ color: 0x7a4012, roughness: 0.18, transmission: 0.55, transparent: true, opacity: 0.85 }),
  bottleClear: new THREE.MeshPhysicalMaterial({ color: 0xbfd8df, roughness: 0.08, transmission: 0.82, transparent: true, opacity: 0.55 }),
  boardGreen: new THREE.MeshStandardMaterial({ color: 0x2e5a25, roughness: 0.92 }),
  stoolSeat : new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.65 }),
  fumeBody  : new THREE.MeshStandardMaterial({ color: 0xe0dbd2, roughness: 0.78 }),
  fumeGlass : new THREE.MeshPhysicalMaterial({
    color: 0x90c8dc, transmission: 0.75, roughness: 0.06,
    transparent: true, opacity: 0.32, side: THREE.DoubleSide,
  }),
  gold : new THREE.MeshStandardMaterial({ color: 0xb8920a, roughness: 0.18, metalness: 0.85 }),
};

function bx(scene, w, h, d, mat, x, y, z, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function addCol(list, cx, cz, w, d, h = 2.5) {
  list.push(new THREE.Box3(
    new THREE.Vector3(cx - w / 2, 0, cz - d / 2),
    new THREE.Vector3(cx + w / 2, h, cz + d / 2),
  ));
}

export class Furniture {
  constructor(scene) {
    this.scene     = scene;
    this.colliders = [];
    this._build();
  }

  // Two central work benches; chairs sit on one side (the +Z, entrance side).
  static BENCH_Z = [-1.2, 1.2];

  _build() {
    this._centerBenches();
    this._fumeHood();
    this._stools();
  }
  // The wash sink and weighing balance are their own interactive/live modules
  // (lab/WashSink.js, lab/Balance.js), built by ChemistryRoom.

  // ── Bench builder ───────────────────────────────────────────────────────────
  // cx, cz = center; len = length along X
  _bench(cx, cz, len = 4.2) {
    const topH = 0.05, bodyH = 0.84, d = 0.72;
    const topY  = bodyH + topH / 2;
    const bodyY = bodyH / 2;

    bx(this.scene, len,        topH,  d,      MAT.benchTop,  cx, topY,  cz);
    bx(this.scene, len - 0.08, bodyH, d - 0.08, MAT.benchBody, cx, bodyY, cz);

    // Legs (4 steel tubes)
    const lxOff = len / 2 - 0.08, lzOff = d / 2 - 0.06;
    [[lxOff, lzOff],[lxOff,-lzOff],[-lxOff,lzOff],[-lxOff,-lzOff]].forEach(([lx,lz]) => {
      bx(this.scene, 0.04, bodyH, 0.04, MAT.steel, cx + lx, bodyY, cz + lz);
    });

    // Gas taps (chrome knobs)
    [-1.2, 0, 1.2].forEach(dx => {
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.1, 8), MAT.steel);
      tap.position.set(cx + dx, bodyH + topH + 0.05, cz + d / 2 - 0.09);
      this.scene.add(tap);
    });

    // Sink (shallow depression appearance on top-left)
    bx(this.scene, 0.32, 0.01, 0.26, MAT.cabinetDark, cx - len / 2 + 0.38, bodyH + topH + 0.005, cz);

    addCol(this.colliders, cx, cz, len, d);
  }

  // ── Central work benches ────────────────────────────────────────────────────
  _centerBenches() {
    Furniture.BENCH_Z.forEach(cz => this._bench(0, cz, 4.2));
  }

  // (Storage cupboards now live in the adjoining store room — see Cupboards.js.)

  // ── Fume hood (front-right corner) ─────────────────────────────────────────
  _fumeHood() {
    const fx = 4.9, fz = -4.2, fW = 1.6, fH = 2.1, fD = 0.9;

    // Body
    bx(this.scene, fW, fH, fD, MAT.fumeBody, fx, fH / 2, fz);
    // Duct on top
    bx(this.scene, fW - 0.1, 0.88, fD - 0.1, MAT.fumeBody, fx, fH + 0.44, fz);
    // Sash glass pane
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(fW - 0.1, fH * 0.45), MAT.fumeGlass);
    pane.position.set(fx, fH * 0.7, fz - fD / 2 - 0.01);
    this.scene.add(pane);
    // Interior dark back
    bx(this.scene, fW - 0.08, fH - 0.1, 0.02, MAT.cabinetDark, fx, fH / 2, fz + fD / 2 - 0.02);

    addCol(this.colliders, fx, fz, fW + 0.1, fD + 0.1);
  }


  // ── Round stools ─────────────────────────────────────────────────────────────
  // Three round stools along ONE side (+Z, the entrance side) of each work bench.
  _stools() {
    const xs  = [-1.2, 0, 1.2];
    const bD2 = 0.72 / 2 + 0.30;     // bench half-depth + legroom

    Furniture.BENCH_Z.forEach(cz => {
      xs.forEach(sx => this._stool(sx, cz + bD2));
    });
  }

  // A round lab stool: cylindrical seat, single post, and a footrest ring.
  _stool(sx, sz) {
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 16), MAT.stoolSeat);
    seat.position.set(sx, 0.72, sz);
    seat.castShadow = true;
    this.scene.add(seat);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.72, 8), MAT.steel);
    leg.position.set(sx, 0.36, sz);
    leg.castShadow = true;
    this.scene.add(leg);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 6, 18), MAT.steel);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(sx, 0.22, sz);
    this.scene.add(ring);
  }
}
