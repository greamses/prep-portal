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

   There is no backing board: a frame is four timbers with the rods threaded
   between them, and the desk shows through the gaps. The four rails are merged
   into one mesh, which is what makes the whole frame one thing to pick up.
   ========================================================================== */

import { BEAD_TOKENS, cssVar } from "./config.js";

const B = () => window.BABYLON;

/* Bead travel and spacing, in world units (one unit cube = 1). */
/* A bead is a squat bicone turned about its rod: WIDE across and THIN along,
   which is the shape that lets four of them pack into a couple of centimetres
   and still be caught by a fingertip. Everything else here is sized off it. */
const BEAD_D = 1.02;  // across the bead — the wide way, athwart the rod
const BEAD_T = 0.42;  // along the rod — the thin way
const BEAD_EYE = 0.05; // the hole it is threaded by, hidden inside the rod

const PITCH = 1.22;  // between neighbouring rods; must clear BEAD_D
const SLOT = 0.5;    // between neighbouring beads on a rod — packed, they touch
const TRAVEL = 0.62; // how far a bead slides to change sides
const BAR_GAP = 0.42; // clear space either side of the reckoning bar
const EDGE = 0.82;   // frame margin
const RAIL = 0.34;   // how thick the frame's four timbers are
const FRAME_H = 1.16; // deeper than a bead is wide, so the beads sit inside it
const ROD_T = 0.11;  // a rod's square section, a shade fatter than the bead's eye

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
    h: FRAME_H,
    x: 0,
    z: 0,
    tag: null,
    rods: Array.from({ length: spec.rods }, () => ({ heaven: 0, earth: 0 })),
  };
}

/** How far a tier reaches from the bar when its beads are pushed right out. */
function reach(n) {
  return n ? BAR_GAP + (n - 1) * SLOT + TRAVEL + BEAD_T / 2 : BAR_GAP;
}

/**
 * The frame, sized to its beads. The two tiers are different depths — a soroban
 * keeps one bead above the bar and four below — so the bar does NOT sit in the
 * middle of the frame; `barZ` is where it actually goes, and everything is hung
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
function mat(scene, token, fallback, shade = 1) {
  const hex = cssVar(token, fallback);
  const k = token + hex + shade;
  if (matCache.has(k)) return matCache.get(k);
  const BJS = B();
  const m = new BJS.StandardMaterial("ab-" + k, scene);
  m.diffuseColor = BJS.Color3.FromHexString(norm(hex)).scale(shade);
  m.specularColor = new BJS.Color3(0.16, 0.16, 0.16);
  m.specularPower = 48;
  matCache.set(k, m);
  return m;
}

/**
 * A bead's colour. Each rod wears its own accent, so the places are told apart
 * at a glance; the fives above the bar are the same hue gone deeper, which keeps
 * a rod reading as one thing. The schoty has no bar, so its fifth and sixth
 * beads stay contrasting — that is how you read one without counting.
 */
function beadPaint(spec, rod, tier, index) {
  if (!spec.upright && (index === 4 || index === 5)) {
    return { token: "--ink", fallback: "#2a2723", shade: 1 };
  }
  const [token, fallback] = BEAD_TOKENS[rod % BEAD_TOKENS.length];
  return { token, fallback, shade: tier === "heaven" ? 0.66 : 1 };
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
  // darker than the paper behind it, or the exposed stretch of rod between two
  // beads reads as a pale peg standing up rather than as wire running through
  const rodMat = mat(scene, "--text-tertiary", "#9a948a", 0.58);

  /* A real abacus has no backing board — four timbers and the rods threaded
     between them, and you can see the desk through it. The four rails are merged
     into ONE mesh so the frame still behaves like a single object: one thing to
     pick up and drag, and one mesh for the selection glow (the highlight layer
     takes a mesh, not a group). The end rails run the full width and the side
     rails fill the gap between them, so the corners butt rather than overlap. */
  const railMeshes = [
    ["far", size.width, RAIL, 0, size.depth / 2 - RAIL / 2],
    ["near", size.width, RAIL, 0, -(size.depth / 2 - RAIL / 2)],
    ["left", RAIL, size.depth - RAIL * 2, -(size.width / 2 - RAIL / 2), 0],
    ["right", RAIL, size.depth - RAIL * 2, size.width / 2 - RAIL / 2, 0],
  ].map(([name, w, d, x, z]) => {
    const m = BJS.MeshBuilder.CreateBox("rail-" + name,
      { width: w, depth: d, height: FRAME_H }, scene);
    m.position.set(x, FRAME_H / 2, z);
    return m;
  });

  const frame = BJS.Mesh.MergeMeshes(railMeshes, true, true);
  frame.name = "frame";
  frame.material = frameMat;
  frame.parent = root;
  frame.receiveShadows = true;
  frame.metadata = { itemId: thing.id };
  ctx.shadows.addShadowCaster(frame);

  const beads = [];
  const heavenTier = spec.tiers.heaven;
  const earthTier = spec.tiers.earth;

  /* The rods run THROUGH their beads now instead of under them: with the board
     gone there is nothing to lay a bead on, and threaded is what a real one is.
     Both ends are buried in the rails, so a rod stops where the timber starts. */
  for (let r = 0; r < spec.rods; r++) {
    const wire = BJS.MeshBuilder.CreateBox("rod",
      spec.upright
        ? { width: ROD_T, depth: size.depth - RAIL * 2, height: ROD_T }
        : { width: size.width - RAIL * 2, depth: ROD_T, height: ROD_T },
      scene);
    wire.material = rodMat;
    wire.parent = root;
    wire.isPickable = false;
    if (spec.upright) {
      wire.position.set(-size.width / 2 + EDGE + PITCH * (r + 0.5), FRAME_H / 2, 0);
    } else {
      wire.position.set(0, FRAME_H / 2, -size.depth / 2 + EDGE + PITCH * (r + 0.5));
    }
  }

  /* The reckoning bar spans between the side rails and stands the full depth of
     the frame, so a tier packed against it stops dead against something solid.
     It is the frame's own timber a few shades down, not a black bar: on a real
     soroban the beam is part of the frame, and painting it black made it read
     as a wall across the middle rather than as the thing you count against. */
  if (spec.upright) {
    const bar = BJS.MeshBuilder.CreateBox("bar",
      { width: size.width - RAIL * 2, depth: 0.22, height: FRAME_H }, scene);
    bar.material = mat(scene, "--accent-warning", "#f0a868", 0.72);
    bar.parent = root;
    bar.isPickable = false;
    bar.position.set(0, FRAME_H / 2, size.barZ);
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

  const parts = { root, beads, size, spec, frame };
  syncAbacus(thing, parts, false);
  return parts;
}

function makeBead(ctx, root, thing, spec, size, r, tier, i) {
  const BJS = B();
  const paint = beadPaint(spec, r, tier, i);

  /* A bead is a solid of revolution about the ROD, not about the vertical: it
     is threaded, so the rod is its axis and there is no other way for it to sit.
     The profile is a bicone with a little belly — widest at the equator, drawn
     in to the eye at both ends — which is what makes a packed tier read as a
     row of edges rather than a sausage. */
  const rr = BEAD_D / 2, tt = BEAD_T / 2;
  const mesh = BJS.MeshBuilder.CreateLathe("bead", {
    shape: [
      new BJS.Vector3(BEAD_EYE, -tt, 0),
      new BJS.Vector3(rr * 0.62, -tt * 0.44, 0),
      new BJS.Vector3(rr, 0, 0),
      new BJS.Vector3(rr * 0.62, tt * 0.44, 0),
      new BJS.Vector3(BEAD_EYE, tt, 0),
    ],
    tessellation: 18,
    closed: false,
  }, ctx.scene);

  /* The lathe turns about Y, so tip it onto the rod: the upright frames run
     their rods down Z, the schoty runs its wires across X. */
  if (spec.upright) mesh.rotation.x = Math.PI / 2;
  else mesh.rotation.z = Math.PI / 2;

  mesh.material = mat(ctx.scene, paint.token, paint.fallback, paint.shade);
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

    const y = FRAME_H / 2;
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
