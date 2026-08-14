/* ============================================================================
   Manipulatives — the counting frames
   ----------------------------------------------------------------------------
   Three abacuses, one mechanism. On every tier the beads that COUNT are packed
   against the reckoning bar and the rest are packed against the far end, so a
   tier is fully described by one number: how many are in. Tapping bead `i`
   either brings it in (count becomes i+1) or sends it and everything outside it
   away (count becomes i) — which is exactly how a real one behaves.

   The Chinese and Japanese frames stand their rods across the canvas with a bar
   between the fives and the ones; the Russian schoty runs its wires the other
   way with ten beads apiece and no bar at all, the middle pair darkened so you
   can see five without counting to it.

   All three lie FLAT on the paper, the way they lie on a desk, which is also
   what makes the 2D view read correctly for them.
   ========================================================================== */

import { cssVar } from "./config.js";

const B = () => window.BABYLON;

/* Bead travel and spacing, in world units (one unit cube = 1). */
const PITCH = 1.7;   // between neighbouring rods
const SLOT = 1.15;   // between neighbouring beads on a rod
const TRAVEL = 1.25; // how far a bead slides to change sides
const BAR_GAP = 1.0; // clear space either side of the reckoning bar
const EDGE = 1.2;    // frame margin
const PLATE = 0.18;  // thickness of the base plate
const BEAD_H = 0.5;

export const SPECS = {
  soroban: {
    label: "Soroban", upright: true, rods: 9,
    tiers: { heaven: { n: 1, worth: 5 }, earth: { n: 4, worth: 1 } },
  },
  suanpan: {
    label: "Suanpan", upright: true, rods: 9,
    tiers: { heaven: { n: 2, worth: 5 }, earth: { n: 5, worth: 1 } },
  },
  schoty: {
    label: "Schoty", upright: false, rods: 7,
    tiers: { earth: { n: 10, worth: 1 } },
  },
};

/* ── the thing on the canvas ──────────────────────────────────────────────── */

export function makeAbacus(variant) {
  const spec = SPECS[variant];
  const size = frameSize(spec);
  return {
    kind: "abacus",
    variant,
    l: Math.ceil(size.width),
    w: Math.ceil(size.depth),
    h: BEAD_H + PLATE,
    x: 0,
    z: 0,
    tag: null,
    rods: Array.from({ length: spec.rods }, () => ({ heaven: 0, earth: 0 })),
  };
}

/** How far a tier reaches from the bar when its beads are pushed right out. */
function reach(n) {
  return n ? BAR_GAP + (n - 1) * SLOT + TRAVEL + 0.5 : BAR_GAP;
}

/**
 * The frame, sized to its beads. The two tiers are different depths — a soroban
 * keeps one bead above the bar and four below — so the bar does NOT sit in the
 * middle of the plate; `barZ` is where it actually goes, and everything is hung
 * off that. Get this wrong and the frame has a bald patch on the short side.
 */
function frameSize(spec) {
  const heaven = reach(spec.tiers.heaven?.n || 0);
  const earth = reach(spec.tiers.earth.n);
  if (spec.upright) {
    return {
      width: spec.rods * PITCH + EDGE * 2,
      depth: heaven + earth + EDGE,
      barZ: (earth - heaven) / 2,
      heaven,
      earth,
    };
  }
  // the schoty has one tier and no bar: beads run in from the left-hand edge
  return {
    width: earth + EDGE,
    depth: spec.rods * PITCH + EDGE * 2,
    barZ: 0,
    heaven,
    earth,
  };
}

/** Where a bead sits along its rod, measured from the bar outward. */
function offsetOf(index, count) {
  const base = BAR_GAP + index * SLOT;
  return index < count ? base : base + TRAVEL;
}

/** The digit a rod is showing. */
export function rodValue(thing, r) {
  const spec = SPECS[thing.variant];
  const rod = thing.rods[r];
  const heaven = spec.tiers.heaven ? rod.heaven * spec.tiers.heaven.worth : 0;
  return heaven + rod.earth * spec.tiers.earth.worth;
}

/** The whole frame as one number, leftmost rod the highest place. */
export function abacusValue(thing) {
  const n = thing.rods.length;
  let total = 0;
  for (let r = 0; r < n; r++) total += rodValue(thing, r) * Math.pow(10, n - 1 - r);
  return total;
}

/** Every rod back to zero. */
export function clearAbacus(thing) {
  thing.rods.forEach((r) => { r.heaven = 0; r.earth = 0; });
}

/**
 * Tap a bead. Returns true when something actually moved.
 * `ref` is { rod, tier, index } straight off the mesh's metadata.
 */
export function tapBead(thing, ref) {
  const rod = thing.rods[ref.rod];
  if (!rod) return false;
  const was = rod[ref.tier];
  const now = ref.index < was ? ref.index : ref.index + 1;
  if (now === was) return false;
  rod[ref.tier] = now;
  return true;
}

/* ── meshes ───────────────────────────────────────────────────────────────── */

const matCache = new Map();
function mat(scene, token, fallback) {
  const hex = cssVar(token, fallback);
  const k = token + hex;
  if (matCache.has(k)) return matCache.get(k);
  const BJS = B();
  const m = new BJS.StandardMaterial("ab-" + k, scene);
  m.diffuseColor = BJS.Color3.FromHexString(norm(hex));
  m.specularColor = new BJS.Color3(0.12, 0.12, 0.12);
  m.specularPower = 64;
  matCache.set(k, m);
  return m;
}
export function clearAbacusMaterials() {
  matCache.forEach((m) => m.dispose());
  matCache.clear();
}
function norm(hex) {
  const h = String(hex || "").trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) return "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (/^#[0-9a-f]{6}$/i.test(h)) return h;
  if (/^#[0-9a-f]{8}$/i.test(h)) return h.slice(0, 7);
  return "#f0a868";
}

/**
 * Build the frame. Beads carry their own metadata so a tap knows which rod and
 * tier it landed on without any hit-testing arithmetic.
 */
export function buildAbacus(ctx, thing) {
  const BJS = B();
  const scene = ctx.scene;
  const spec = SPECS[thing.variant];
  const size = frameSize(spec);
  const root = new BJS.TransformNode("ab" + thing.id, scene);

  const frameMat = mat(scene, "--accent-warning", "#f0a868");
  const railMat = mat(scene, "--ink", "#2a2723");
  const rodMat = mat(scene, "--text-tertiary", "#9a948a");

  const plate = BJS.MeshBuilder.CreateBox("plate",
    { width: size.width, depth: size.depth, height: PLATE }, scene);
  plate.material = frameMat;
  plate.position.y = PLATE / 2;
  plate.parent = root;
  plate.receiveShadows = true;
  plate.metadata = { itemId: thing.id };
  ctx.shadows.addShadowCaster(plate);

  const beads = [];
  const heavenTier = spec.tiers.heaven;
  const earthTier = spec.tiers.earth;

  // rods, and the reckoning bar the tiers are counted against
  for (let r = 0; r < spec.rods; r++) {
    const along = -size.width / 2 + EDGE + PITCH * (r + 0.5);
    const wire = BJS.MeshBuilder.CreateBox("rod",
      spec.upright
        ? { width: 0.12, depth: size.depth - EDGE, height: 0.08 }
        : { width: size.width - EDGE, depth: 0.12, height: 0.08 },
      scene);
    wire.material = rodMat;
    wire.parent = root;
    wire.isPickable = false;
    if (spec.upright) wire.position.set(along, PLATE + 0.05, 0);
    else wire.position.set(0, PLATE + 0.05, -size.depth / 2 + EDGE + PITCH * (r + 0.5));
  }

  if (spec.upright) {
    const bar = BJS.MeshBuilder.CreateBox("bar",
      { width: size.width, depth: 0.34, height: 0.24 }, scene);
    bar.material = railMat;
    bar.parent = root;
    bar.isPickable = false;
    bar.position.set(0, PLATE + 0.12, size.barZ);
  }

  for (let r = 0; r < spec.rods; r++) {
    if (heavenTier) {
      for (let i = 0; i < heavenTier.n; i++) {
        beads.push(makeBead(ctx, root, thing, spec, size, r, "heaven", i));
      }
    }
    for (let i = 0; i < earthTier.n; i++) {
      beads.push(makeBead(ctx, root, thing, spec, size, r, "earth", i));
    }
  }

  const parts = { root, beads, size, spec, plate };
  syncAbacus(thing, parts, false);
  return parts;
}

function makeBead(ctx, root, thing, spec, size, r, tier, i) {
  const BJS = B();
  // On a schoty the fifth and sixth beads are dark: that is the whole trick of
  // reading one quickly, so it is not decoration.
  const dark = !spec.upright && (i === 4 || i === 5);
  const token = tier === "heaven"
    ? "--accent-danger"
    : dark ? "--accent-danger" : "--accent-secondary";
  const fallback = tier === "heaven" ? "#f07a7a" : dark ? "#f07a7a" : "#6fb7e8";

  const mesh = BJS.MeshBuilder.CreateSphere("bead",
    spec.upright
      ? { diameterX: 1.05, diameterY: BEAD_H, diameterZ: 0.92, segments: 10 }
      : { diameterX: 0.92, diameterY: BEAD_H, diameterZ: 1.05, segments: 10 },
    ctx.scene);
  mesh.material = mat(ctx.scene, token, fallback);
  mesh.parent = root;
  mesh.metadata = { bead: { thingId: thing.id, rod: r, tier, index: i } };
  ctx.shadows.addShadowCaster(mesh);

  mesh.__rod = r;
  mesh.__tier = tier;
  mesh.__index = i;
  mesh.__along = spec.upright
    ? -size.width / 2 + EDGE + PITCH * (r + 0.5)
    : -size.depth / 2 + EDGE + PITCH * (r + 0.5);
  return mesh;
}

/** Slide every bead to where the rod counts say it should be. */
export function syncAbacus(thing, parts, animate = true) {
  const BJS = B();
  const { spec, size } = parts;
  for (const mesh of parts.beads) {
    const rod = thing.rods[mesh.__rod];
    const count = rod[mesh.__tier];
    const off = offsetOf(mesh.__index, count);

    const y = PLATE + BEAD_H / 2;
    // Heaven is the far side of the bar and earth the near side — the frame is
    // lying on a desk, so "above the bar" is away from whoever is reading it.
    const target = spec.upright
      ? new BJS.Vector3(
          mesh.__along,
          y,
          size.barZ + (mesh.__tier === "heaven" ? off : -off)
        )
      : new BJS.Vector3(
          // wires run across, so beads travel in x and count in from the left
          -size.width / 2 + EDGE / 2 + 0.5 + (off - BAR_GAP),
          y,
          mesh.__along
        );

    if (!animate) { mesh.position.copyFrom(target); continue; }
    if (BJS.Vector3.Distance(mesh.position, target) < 0.001) continue;
    const ease = new BJS.CubicEase();
    ease.setEasingMode(BJS.EasingFunction.EASINGMODE_EASEOUT);
    BJS.Animation.CreateAndStartAnimation("bead", mesh, "position", 60, 9,
      mesh.position.clone(), target, BJS.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  }
}

/** Put the frame on its cell. */
export function placeAbacus(parts, thing) {
  parts.root.position.x = thing.x + thing.l / 2;
  parts.root.position.z = thing.z + thing.w / 2;
  parts.root.position.y = 0;
}

/** A one-line reading of the frame, for the HUD. */
export function abacusSentence(thing) {
  const digits = thing.rods.map((_, r) => rodValue(thing, r));
  const over = digits.some((d) => d > 9);
  const value = abacusValue(thing);
  return over
    ? `${value} — one of the rods is holding more than nine, ready to be carried.`
    : `${value}`;
}
