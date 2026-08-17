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
import { footprint } from "./layout.js";

const B = () => window.BABYLON;

/* Bead travel and spacing, in world units (one unit cube = 1). */
/* A bead is a squat bicone turned about its rod: wide across, and A UNIT CUBE
   LONG in the direction it travels. That length is the measure of the whole
   frame — it is what a bead is compared against on this canvas, so a bead you
   can put beside a unit block and see are the same is worth the extra paper.
   Everything else here is sized off it. */
const BEAD_T = 1.0;   // along the rod — one unit cube, the way a bead travels
const BEAD_D = 1.3;   // across the bead — the wide way, athwart the rod
const BEAD_EYE = 0.07; // the hole it is threaded by, hidden inside the rod

const PITCH = 1.55;  // between neighbouring rods; must clear BEAD_D
const SLOT = 1.1;    // between neighbouring beads on a rod — packed, they touch
const TRAVEL = 1.45; // how far a bead slides to change sides
const BAR_GAP = 1.0; // clear space either side of the reckoning bar
const EDGE = 1.1;    // frame margin
const RAIL = 0.45;   // how thick the frame's four timbers are
const FRAME_H = 1.5; // deeper than a bead is wide, so the beads sit inside it
const ROD_T = 0.15;  // a rod's square section, a shade fatter than the bead's eye

/* The readout: a sticky note with the number the beads are showing, held at
   frame height beyond the far rail. There is no board behind it — the note is
   the whole of it, on a clear sheet, so what shows around it is the paper. */
/* Deep enough that the number on it is a couple of units tall against a frame
   this size — a note sized for the old small frame came out a thin strip. */
const READ_D = 4.2;  // how deep the note's sheet is
const READ_GAP = 0.3; // clear paper between the frame and its note
const READ_PAD = READ_D + READ_GAP;
/* It is held at frame height rather than laid on the paper. Flat it was legible
   from straight above and hidden behind the far rail from every other angle —
   the rail is well over a unit tall and the note is a sheet with no thickness at
   all. Up here its face clears the rail, and being horizontal it still reads
   straight on in the 2D view. */
const SLATE_H = FRAME_H;

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
    // the readout stands above the frame and is part of the thing, so it has to
    // be inside the footprint or the next piece along would be placed on top
    w: Math.ceil(size.depth + READ_PAD),
    h: FRAME_H,
    x: 0,
    z: 0,
    angle: 0, // radians, applied to the whole assembly
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

  /* The frame hangs off a hub shifted back by half the readout's depth, so the
     frame AND its slate together sit centred on the thing's footprint. Every
     frame part is built in the frame's own coordinates and parented here, which
     is what lets the bead arithmetic below stay ignorant of the slate. */
  const hub = new BJS.TransformNode("abHub" + thing.id, scene);
  hub.parent = root;
  hub.position.z = -READ_PAD / 2;

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
  frame.parent = hub;
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
    wire.parent = hub;
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
    bar.parent = hub;
    bar.isPickable = false;
    bar.position.set(0, FRAME_H / 2, size.barZ);
  }

  for (let r = 0; r < spec.rods; r++) {
    if (heavenTier) {
      for (let i = 0; i < heavenTier.n; i++) {
        beads.push(makeBead(ctx, hub, thing, spec, size, r, "heaven", i));
      }
    }
    for (let i = 0; i < earthTier.n; i++) {
      beads.push(makeBead(ctx, hub, thing, spec, size, r, "earth", i));
    }
  }

  /* ── the readout note, held above the frame ─────────────────────────────── */
  /* One sheet and nothing behind it. There WAS a timber slate here for the note
     to be stuck on; it read as a plank across the top of every frame and told
     you nothing, so the note is on its own now — a clear sheet with a coloured
     patch on it, and the paper showing through everywhere else.

     The frame is on the hub, shifted back by half the readout's depth, so the
     sheet is measured from THERE and not from the root: the frame's far rail is
     at `size.depth/2 - READ_PAD/2`, and a gap past it works out as simply half
     a gap beyond half the frame. */
  const slateZ = size.depth / 2 + READ_GAP / 2;

  const px = Math.min(2048, Math.round(size.width * 64));
  const py = Math.min(1024, Math.round(READ_D * 64));
  const tex = new BJS.DynamicTexture("abRead" + thing.id, { width: px, height: py }, scene, false);
  tex.wrapU = BJS.Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = BJS.Texture.CLAMP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 4;
  tex.hasAlpha = true;

  const readMat = new BJS.StandardMaterial("abReadMat" + thing.id, scene);
  readMat.diffuseTexture = tex;
  readMat.useAlphaFromDiffuseTexture = true;
  readMat.specularColor = new BJS.Color3(0.02, 0.02, 0.02);

  const readFace = BJS.MeshBuilder.CreateGround("readFace",
    { width: size.width, height: READ_D }, scene);
  readFace.position.set(0, SLATE_H, slateZ);
  readFace.parent = root;
  readFace.material = readMat;
  // the note belongs to the abacus, so grabbing it picks the whole thing up
  readFace.metadata = { itemId: thing.id };
  /* Deliberately NOT a shadow caster: the shadow map ignores the texture's
     alpha, so the sheet would drop a full rectangle on the paper and give away
     the clear part the note is stuck to. */

  const parts = { root, hub, beads, size, spec, frame, readFace, tex, readMat, shown: null };
  syncAbacus(thing, parts, false);
  return parts;
}

/**
 * Paint the slate. Kept off the render loop — it is only redrawn when the number
 * it is showing actually changes, which for a frame being read is most presses
 * and for one sitting still is never.
 */
/* A sticky note per frame, so three abacuses side by side are told apart by the
   colour of their notes before you have read a digit of any of them. */
const NOTE_TOKENS = {
  soroban: ["--accent-primary", "#f4c95d"],
  suanpan: ["--accent-secondary", "#6fb7e8"],
  schoty: ["--accent-success", "#7cc47c"],
};

function paintReadout(thing, parts) {
  const value = abacusValue(thing);
  if (parts.shown === value) return;
  parts.shown = value;

  const tex = parts.tex;
  const g = tex.getContext();
  const w = tex.getSize().width;
  const h = tex.getSize().height;

  /* Transparent everywhere but the note itself, so what shows around it is the
     frame's own timber — a note stuck on the headboard, not a printed panel. */
  g.clearRect(0, 0, w, h);

  const [token, fallback] = NOTE_TOKENS[thing.variant] || NOTE_TOKENS.soroban;
  const paper = cssVar(token, fallback);
  const nh = h * 0.78;
  const text = String(value);

  /* THE DIGITS never change size — a readout that shrinks as you count is a
     fidget — so the size is set by what the widest number this frame can hold
     needs, and stays there. */
  const widest = "0".repeat(thing.rods.length + 1);
  let size = Math.floor(nh * 0.66);
  const fontAt = (px) => `700 ${px}px "JetBrains Mono", ui-monospace, monospace`;
  g.font = fontAt(size);
  const room = w * 0.82;
  if (g.measureText(widest).width > room) {
    size = Math.max(12, Math.floor(size * (room / g.measureText(widest).width)));
    g.font = fontAt(size);
  }

  /* THE PAPER does change: the note is only as wide as the number written on
     it, so a nought gets a small square and nine digits get a long one. A note
     cut for the widest number this frame could ever hold left a single nought
     marooned in the middle of an empty sheet. */
  const nw = Math.min(w * 0.94, Math.max(nh * 1.1, g.measureText(text).width + nh * 0.62));

  g.save();
  g.translate(w / 2, h / 2);
  g.rotate(-0.035); // a note is never put on straight
  g.shadowColor = "rgba(30,26,20,0.36)";
  g.shadowBlur = h * 0.1;
  g.shadowOffsetY = h * 0.04;
  g.fillStyle = paper;
  g.fillRect(-nw / 2, -nh / 2, nw, nh);
  g.shadowColor = "transparent";

  // the peeled corner, bottom-right
  const curl = Math.min(nw, nh) * 0.22;
  g.fillStyle = "rgba(30,26,20,0.15)";
  g.beginPath();
  g.moveTo(nw / 2, nh / 2 - curl);
  g.lineTo(nw / 2, nh / 2);
  g.lineTo(nw / 2 - curl, nh / 2);
  g.closePath();
  g.fill();

  // ink, not the flipping token: the note is always a pale pastel in both themes
  g.font = fontAt(size);
  g.fillStyle = "#2a2723";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(value), 0, size * 0.04);
  g.restore();

  tex.update(true);
}

function makeBead(ctx, hub, thing, spec, size, r, tier, i) {
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
  mesh.parent = hub;
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
  paintReadout(thing, parts);
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
  const f = footprint(thing);
  parts.root.position.x = thing.x + f.l / 2;
  parts.root.position.z = thing.z + f.w / 2;
  parts.root.position.y = 0;
  // the whole assembly turns together — frame, beads and slate
  parts.root.rotation.y = thing.angle || 0;
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
