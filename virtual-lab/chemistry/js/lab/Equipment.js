import * as THREE from 'three';

/**
 * Static bench-top apparatus: test-tube racks, Bunsen burners (some lit) and
 * retort stands with ring clamps. Purely decorative scene dressing — built
 * once at construction and added straight to the scene.
 *
 * Bench top surface sits at y ≈ 0.89; every builder works in local space with
 * its base at y = 0 and is positioned onto the bench by _place().
 */

const TOP = 0.89; // bench-top height

const MAT = {
  wood    : new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.7 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x5e3c1e, roughness: 0.75 }),
  iron    : new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.45, metalness: 0.6 }),
  steel   : new THREE.MeshStandardMaterial({ color: 0xa6a6aa, roughness: 0.3, metalness: 0.8 }),
  brass   : new THREE.MeshStandardMaterial({ color: 0xb89436, roughness: 0.32, metalness: 0.7 }),
  glass   : new THREE.MeshStandardMaterial({ color: 0xcfe6ee, roughness: 0.1, transparent: true, opacity: 0.34, side: THREE.DoubleSide }),
  rubber  : new THREE.MeshStandardMaterial({ color: 0x222020, roughness: 0.85 }),
};

const TUBE_LIQUID = [0x3baaff, 0x4fd17a, 0xff7a4f, 0xc94fff, 0xffd24f, 0xff5f8a];
const liquidMat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, transparent: true, opacity: 0.82 });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

export class Equipment {
  constructor(scene) {
    this.scene = scene;
    this._build();
  }

  _place(group, x, z) {
    group.position.set(x, TOP, z);
    this.scene.add(group);
  }

  _build() {
    // One copy of each apparatus, laid out on the two central benches (Z = ±1.2).
    // A single rack (carrying a few tubes) + burner on the front bench; a single
    // retort stand on the back bench. This keeps the interactable count low.
    const BENCH_A = -1.2, BENCH_B = 1.2;

    // ── Test-tube rack (front bench) ──
    const rackX = -1.0;
    this._place(this._rack(), rackX, BENCH_A);

    // World-space slots where a pickable test tube should sit. The room turns
    // these into Pickup('tube') instances so they're grabbable & breakable.
    this.tubeSlots = [];
    const rackXs = [-0.06, 0, 0.06];     // three tubes, one rack
    rackXs.forEach((tx, j) => this.tubeSlots.push({
      pos: new THREE.Vector3(rackX + tx, TOP + 0.02, BENCH_A),
      color: TUBE_LIQUID[j % TUBE_LIQUID.length],
    }));

    // ── Bunsen burner (front bench) — built as an interactable by the room ──
    this.burnerSpots = [{ x: 0.5, z: BENCH_A, top: TOP }];

    // ── Tripod + wire gauze (front bench, next to the burner) ──
    // Built by the room as two separable Pickups (so they can be moved and the
    // gauze lifted off the tripod). We just publish where they start.
    this.tripodSpot = { x: -0.15, z: BENCH_A, top: TOP };

    // ── Retort stand with a round-bottom flask (back bench) ──
    this._place(this._retort(true), -0.6, BENCH_B);
  }

  // ── Test-tube rack (frame only; tubes are pickups placed by main.js) ─────────
  _rack() {
    const g = new THREE.Group();
    const W = 0.34, D = 0.085;
    g.add(mesh(new THREE.BoxGeometry(W, 0.018, D), MAT.wood, 0, 0.009, 0));                  // base board
    g.add(mesh(new THREE.BoxGeometry(0.028, 0.105, D), MAT.wood, -W / 2 + 0.02, 0.055, 0));  // ends
    g.add(mesh(new THREE.BoxGeometry(0.028, 0.105, D), MAT.wood,  W / 2 - 0.02, 0.055, 0));
    // Top rail split into two bars, leaving a centre slot for the tubes to drop through
    g.add(mesh(new THREE.BoxGeometry(W - 0.05, 0.016, 0.014), MAT.woodDark, 0, 0.10,  0.022));
    g.add(mesh(new THREE.BoxGeometry(W - 0.05, 0.016, 0.014), MAT.woodDark, 0, 0.10, -0.022));
    return g;
  }

  // ── Retort stand ─────────────────────────────────────────────────────────────
  _retort(withFlask = false) {
    const g = new THREE.Group();
    const rodX = -0.06;

    g.add(mesh(new THREE.BoxGeometry(0.19, 0.013, 0.13), MAT.iron, 0, 0.0065, 0));           // heavy base
    g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.52, 14), MAT.steel, rodX, 0.013 + 0.26, 0)); // rod

    // Boss head + ring clamp at mid height
    const ringY = 0.33;
    g.add(mesh(new THREE.BoxGeometry(0.03, 0.034, 0.03), MAT.iron, rodX, ringY, 0));         // boss
    g.add(mesh(new THREE.BoxGeometry(0.07, 0.01, 0.01), MAT.steel, rodX + 0.05, ringY, 0));  // arm
    const ring = mesh(new THREE.TorusGeometry(0.042, 0.004, 8, 24), MAT.steel, rodX + 0.11, ringY, 0);
    ring.rotation.x = Math.PI / 2; g.add(ring);                                              // support ring

    if (withFlask) {
      // Round-bottom flask resting in the ring
      const flask = new THREE.Group();
      flask.add(mesh(new THREE.SphereGeometry(0.045, 18, 14), MAT.glass, 0, 0, 0));
      flask.add(mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.07, 14), MAT.glass, 0, 0.05, 0));
      const fill = mesh(new THREE.SphereGeometry(0.038, 16, 12), liquidMat(0x4fd17a), 0, -0.004, 0);
      fill.scale.y = 0.7; flask.add(fill);
      flask.position.set(rodX + 0.11, ringY + 0.03, 0);
      g.add(flask);
      // Wire gauze square under the flask
      g.add(mesh(new THREE.BoxGeometry(0.085, 0.003, 0.085), MAT.steel, rodX + 0.11, ringY - 0.006, 0));
    } else {
      // Clamp near the top — grips a pickable test tube (placed by main.js)
      const clampY = 0.44;
      g.add(mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), MAT.iron, rodX, clampY, 0));
      g.add(mesh(new THREE.BoxGeometry(0.06, 0.009, 0.009), MAT.steel, rodX + 0.045, clampY, 0));
    }
    return g;
  }
}
