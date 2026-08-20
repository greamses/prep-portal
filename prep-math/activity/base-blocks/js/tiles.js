/* ============================================================================
   Manipulatives — algebra tiles and blocks
   ----------------------------------------------------------------------------
   The blocks make a NUMBER out of its places. These make an EXPRESSION out of
   its terms: x³ and x² and x and 1, in two variables, each of them with a
   negative.

   ── x is not five ─────────────────────────────────────────────────────────
   The one rule that makes algebra tiles work is that the x-tile's length is not
   a whole number of unit tiles. If it were, a learner would lay units along it,
   count them, and "find out" what x is — and x is the thing you are not told.
   So X_LEN is 4.6 and Y_LEN is 2.7: near enough to the squared paper to sit on
   it tidily, far enough that no number of units ever fits. A piece is measured,
   laid out and dragged at its TRUE length — the rest of the canvas works in
   whole cells, and these do not, because two pieces put side by side have to
   touch.

   x² is x by x, y² is y by y, and xy is one of each — so the tiles only fit
   together the ways the algebra allows, which is the whole of the teaching.

   ── the tiles lie flat, the cubes stand up ────────────────────────────────
   The family goes as far as the SOLIDS: x³ is x by x by x, x²y is an x-square
   standing y tall, xy² and y³ likewise. Those four have a third side that is a
   LENGTH, so they are built with it and they stand up off the paper.

   Everything below them is a TILE and has NO THIRD SIDE AT ALL — x², xy, y², x,
   y and 1 are flat: sheets on the paper, not slabs above it. Their thickness is
   not part of what they are worth (an x² is an area, x by x), and every
   thickness tried — a full unit, then a wafer — read as a box and buried the
   rectangle the pieces are put down to show. So thickness here says one thing
   only, and says it plainly: a piece with a third side is a CUBE and stands up,
   a piece without one is a TILE and lies flat.

   That is the model as well as the picture. A tile's `h` is 0, so `isSolid` is
   simply "has a height", the turn handle sits on the paper where the tile is,
   and nothing has to know a magic wafer number. Only the drawing lifts a tile,
   by `LIFT` — a hair, so the sheet is not fighting the paper for the same
   pixels.

   ── and both can be picked up off the paper ───────────────────────────────
   A piece carries a `y` (how far it is held above the paper) and a `tip` (a
   rotation about its own length). Those two are the third dimension made
   movable: Turn spins a piece where it lies, Tip stands it up on an edge or
   over onto another face, and Lift holds it above the paper so pieces can be
   stacked. A tile stood upright is a sheet seen edge-on, which is why the
   materials here are drawn on BOTH sides — culled, an x² stood up would vanish
   as you walked round it.

   ── the negative is the same tile turned over ─────────────────────────────
   A negative tile is the same shape in the same size, in red, with a minus on
   it. Put a tile and its negative together and they are nothing: that is a ZERO
   PAIR, and cancelling them is the Merge key's job on this family.
   ========================================================================== */

import { cssVar } from "./config.js";
import { footprint, standing } from "./layout.js";

const B = () => window.BABYLON;

/* The lengths, in world units (one unit cube = 1). Neither divides into a
   whole number of units, on purpose — see above. */
export const X_LEN = 4.6;
export const Y_LEN = 2.7;

/* A tile has no thickness: it is a sheet lying on the paper. Written down so
   the specs below say what they mean, and so nothing reads a bare 0 as an
   oversight. */
const FLAT = 0;

/* How far off the paper a tile is DRAWN — not how thick it is. Two surfaces at
   the same height fight for the same pixels, and the winner changes with the
   angle; a hair of clearance settles it and is invisible.

   Tiles overlap on purpose (a piece is dropped onto its opposite to cancel the
   pair, and they move through each other freely), so two sheets at the SAME
   hair would fight each other just as badly. Each one is lifted by its own id
   instead — a ladder of steps far too small to see and too small to stack into
   anything, but enough that no two sheets are ever exactly level. */
const LIFT = 0.012;
const STEP = 0.0015;
const liftOf = (thing) => LIFT + (Math.abs(thing.id | 0) % 24) * STEP;

/* One unit across — the short side of the x and y tiles and the side of the
   unit tile. A real measurement, and nothing to do with lying flat. */
const ONE = 1;

const BLUE = { token: "--accent-secondary", fallback: "#6fb7e8" }; // all x
const GREEN = { token: "--accent-success", fallback: "#7cc47c" };  // x and y both
const AMBER = { token: "--accent-warning", fallback: "#f0a868" };  // all y
const BUTTER = { token: "--accent-primary", fallback: "#f4c95d" }; // the plain unit

/**
 * The ten pieces, by what they are worth, written the way an expression is:
 * highest degree first, and x before y at the same degree.
 *
 * `l`, `w` and `h` are the TRUE lengths — a side is x, or y, or one. `x` and
 * `y` are the powers, which is what the term is for reading an expression back:
 * how many x's and how many y's are multiplied together. Colour says which
 * letters a piece is made of and nothing else.
 */
export const TILES = [
  { id: "x3", label: "x³", l: X_LEN, w: X_LEN, h: X_LEN, x: 3, y: 0, ...BLUE },
  { id: "x2y", label: "x²y", l: X_LEN, w: X_LEN, h: Y_LEN, x: 2, y: 1, ...GREEN },
  { id: "xy2", label: "xy²", l: X_LEN, w: Y_LEN, h: Y_LEN, x: 1, y: 2, ...GREEN },
  { id: "y3", label: "y³", l: Y_LEN, w: Y_LEN, h: Y_LEN, x: 0, y: 3, ...AMBER },
  { id: "x2", label: "x²", l: X_LEN, w: X_LEN, h: FLAT, x: 2, y: 0, ...BLUE },
  { id: "xy", label: "xy", l: X_LEN, w: Y_LEN, h: FLAT, x: 1, y: 1, ...GREEN },
  { id: "y2", label: "y²", l: Y_LEN, w: Y_LEN, h: FLAT, x: 0, y: 2, ...AMBER },
  { id: "x", label: "x", l: X_LEN, w: ONE, h: FLAT, x: 1, y: 0, ...BLUE },
  { id: "y", label: "y", l: Y_LEN, w: ONE, h: FLAT, x: 0, y: 1, ...AMBER },
  { id: "one", label: "1", l: ONE, w: ONE, h: FLAT, x: 0, y: 0, ...BUTTER },
];

/** A piece that stands up off the paper: x³, x²y, xy², y³ — the ones with a
    third side. Everything else is a sheet. */
export const isSolid = (spec) => spec.h > 0;

/* The red every negative tile is, in both themes: a negative is not a different
   PIECE, it is the same piece turned over, and the underside of a set of
   algebra tiles is red. */
const MINUS_HEX = "#d2544a";

export const tileSpec = (id) => TILES.find((t) => t.id === id) || TILES[0];

/* ── the thing on the canvas ──────────────────────────────────────────────── */

export function makeTile(id, sign = 1) {
  const spec = tileSpec(id);
  return {
    kind: "tile",
    variant: spec.id,
    sign: sign < 0 ? -1 : 1,
    // carried on the tile so layout.js can read an expression's order off it
    // without having to know what an algebra tile is
    degree: spec.x + spec.y,
    tag: null,
    x: 0, z: 0, angle: 0,
    /* TRUE lengths, not cells. A piece is exactly as big as it is worth, and
       two of them laid side by side must TOUCH — an x-tile rounded up to five
       cells would leave four tenths of a unit of daylight between it and the
       next piece, and a row of tiles that does not close up cannot show you a
       rectangle. Tiles live off the grid; everything else is still on it. */
    l: spec.l,
    w: spec.w,
    h: spec.h,
  };
}

/** What one tile is worth, as { x, y, n } — n negative for a negative tile. */
export function tileTerm(thing) {
  const spec = tileSpec(thing.variant);
  return { x: spec.x, y: spec.y, n: thing.sign };
}

/* x, x², x³ — a power is written the way it is written, up as far as the set
   goes, which is the cube. */
const SUP = ["", "", "²", "³"];
const letters = (x, y) =>
  (x ? "x" + SUP[x] : "") + (y ? "y" + SUP[y] : "");

/* The same term for MathJax, which wants the powers spelled out. */
const letterTex = (x, y) =>
  (x ? "x" + (x > 1 ? `^{${x}}` : "") : "") + (y ? "y" + (y > 1 ? `^{${y}}` : "") : "");

/**
 * Read every tile on the canvas back as an expression.
 *
 * Terms are gathered by their powers and written in the order a textbook writes
 * them — the highest degree first, and x before y at the same degree. Comes
 * back twice over: `text` to read or to speak, `tex` for MathJax to set.
 */
export function tilesReading(tiles) {
  const by = new Map();
  for (const t of tiles) addTerm(by, tileTerm(t));
  return writeTerms(by);
}

/** Add one term to a gathering of them, keyed by its powers. */
export function addTerm(by, { x, y, n }) {
  const key = x + "," + y;
  by.set(key, (by.get(key) || 0) + n);
  return by;
}

/**
 * Write a gathering of terms out as an expression — once to read, once for
 * MathJax to set. Highest degree first, and x before y at the same degree,
 * which is the order a textbook writes them in.
 */
export function writeTerms(by) {
  const terms = [...by.entries()]
    .map(([key, n]) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y, n };
    })
    .filter((t) => t.n !== 0)
    .sort((a, b) => (b.x + b.y) - (a.x + a.y) || b.x - a.x);

  if (!terms.length) return { terms, text: "0", tex: "0" };

  const write = (glyphs, minus, plus) => terms
    .map((t, i) => {
      const size = Math.abs(t.n);
      const part = glyphs(t.x, t.y);
      const number = size === 1 && part ? "" : String(size);
      const body = number + part;
      return i === 0 ? (t.n < 0 ? minus + body : body)
        : ` ${t.n < 0 ? minus : plus} ${body}`;
    })
    .join("");

  return { terms, text: write(letters, "−", "+"), tex: write(letterTex, "-", "+") };
}

/**
 * What a SIDE of that length is, as a term.
 *
 * The lengths of this family are 4.6, 2.7 and 1, and no two of them are within
 * a hair of each other, so a measured edge says which letter it is without
 * having to ask the piece. That is what lets the area frame read an edge off
 * whatever is laid along it — an x² tile lying along the top of the frame
 * offers an x-long side, and x is what it contributes.
 */
export function termOfLength(len, sign = 1) {
  const near = (a, b) => Math.abs(a - b) < 0.12;
  if (near(len, X_LEN)) return { x: 1, y: 0, n: sign };
  if (near(len, Y_LEN)) return { x: 0, y: 1, n: sign };
  if (near(len, ONE)) return { x: 0, y: 0, n: sign };
  return null;
}

/**
 * Pair a tile off against its opposite.
 *
 * Returns the ids to remove: as many matched pairs as the selection holds, of
 * the same tile with opposite signs. Anything left over stays on the canvas —
 * three x's and one −x cancel one pair, not all four.
 */
export function zeroPairs(tiles) {
  const gone = new Set();
  for (const spec of TILES) {
    const plus = tiles.filter((t) => t.variant === spec.id && t.sign > 0 && !gone.has(t.id));
    const minus = tiles.filter((t) => t.variant === spec.id && t.sign < 0 && !gone.has(t.id));
    const pairs = Math.min(plus.length, minus.length);
    for (let i = 0; i < pairs; i++) {
      gone.add(plus[i].id);
      gone.add(minus[i].id);
    }
  }
  return gone;
}

/* ── meshes ───────────────────────────────────────────────────────────────── */

const matCache = new Map();
function mat(scene, hex, shade = 1) {
  const k = hex + shade;
  if (matCache.has(k)) return matCache.get(k);
  const BJS = B();
  const m = new BJS.StandardMaterial("tl-" + k, scene);
  const c = BJS.Color3.FromHexString(hex).scale(shade);
  m.diffuseColor = c;
  m.specularColor = new BJS.Color3(0.03, 0.03, 0.03);
  /* A sheet has two sides to be looked at once it can be TIPPED UP on its edge.
     Culled, an x² stood upright would vanish the moment you walked round it —
     which is the one thing a piece standing in a diagram must not do. */
  m.backFaceCulling = false;
  matCache.set(k, m);
  return m;
}
export function clearTileMaterials() {
  matCache.forEach((m) => m.dispose());
  matCache.clear();
}

export function colourOfTile(thing) {
  const spec = tileSpec(thing.variant);
  return thing.sign < 0 ? MINUS_HEX : cssVar(spec.token, spec.fallback);
}

export function buildTile(ctx, thing) {
  const BJS = B();
  const scene = ctx.scene;
  const spec = tileSpec(thing.variant);
  const root = new BJS.TransformNode("tl" + thing.id, scene);

  /* Drawn at its TRUE length, inside a footprint rounded up to whole cells —
     so an x-tile visibly overhangs four squares and falls short of five, and no
     counting of units will ever tell you what x is.

     A CUBE IS A BOX AND A TILE IS A SHEET. The four solids are built with their
     true height, which is what makes an x³ a cube and not a tall box. The other
     six get a ground: no sides to catch the light, so however low the camera
     goes there is no edge to see and no thickness to mistake for part of what
     the piece is worth. A sheet casts no shadow either — a shadow under a tile
     is the same lie as an edge on it. */
  const solid = isSolid(spec);
  const slab = solid
    ? BJS.MeshBuilder.CreateBox("tile",
        { width: spec.l, depth: spec.w, height: spec.h }, scene)
    : BJS.MeshBuilder.CreateGround("tile",
        { width: spec.l, height: spec.w }, scene);
  /* The ROOT carries how high the piece rides — half its standing height, plus
     any lift, plus (for a sheet) the hair that keeps it off the paper — so that
     tipping the root turns the piece about its own middle and the whole thing
     stays resting on the paper. The parts hang off that middle. */
  slab.position.y = 0;
  slab.parent = root;
  slab.receiveShadows = true;
  slab.metadata = { itemId: thing.id };
  slab.material = mat(scene, colourOfTile(thing));
  if (solid) ctx.shadows.addShadowCaster(slab);

  /* The label is printed on a sheet a whisker above the piece rather than on
     the piece itself: a box takes one material for all six faces, and the top
     is the only one anybody reads. */
  const face = BJS.MeshBuilder.CreateGround("tileFace",
    { width: spec.l * 0.94, height: spec.w * 0.94 }, scene);
  face.position.y = (solid ? spec.h / 2 : 0) + 0.004;
  face.parent = root;
  face.metadata = { itemId: thing.id };

  const k = Math.min(128, 1024 / Math.max(spec.l, spec.w));
  const tex = new BJS.DynamicTexture("tlTex" + thing.id,
    { width: Math.round(spec.l * k), height: Math.round(spec.w * k) }, scene, false);
  tex.hasAlpha = true;
  const fm = new BJS.StandardMaterial("tlFace" + thing.id, scene);
  fm.diffuseTexture = tex;
  fm.useAlphaFromDiffuseTexture = true;
  fm.specularColor = new BJS.Color3(0, 0, 0);
  fm.emissiveColor = new BJS.Color3(0.3, 0.3, 0.3);
  fm.backFaceCulling = false; // read from either side once the piece stands up
  face.material = fm;

  const parts = { root, slab, face, tex, faceMat: fm };
  paintTile(thing, parts);
  return parts;
}

export function paintTile(thing, parts) {
  const tex = parts.tex;
  const g = tex && tex.getContext ? tex.getContext() : null;
  if (!g) return;
  const W = tex.getSize().width;
  const H = tex.getSize().height;
  const spec = tileSpec(thing.variant);

  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  g.textAlign = "center";
  g.textBaseline = "middle";

  const label = (thing.sign < 0 ? "−" : "") + spec.label;
  let size = Math.round(Math.min(W, H) * (spec.id === "one" ? 0.52 : 0.4));
  g.font = `700 ${size}px Unbounded, system-ui, sans-serif`;
  /* "−x²y" on the top of an xy² is four glyphs across a face that is only y
     wide: measure it and come down until it fits, rather than letting the
     writing run off the piece. */
  const room = W * 0.84;
  const wide = g.measureText(label).width;
  if (wide > room) {
    size = Math.max(8, Math.round(size * (room / wide)));
    g.font = `700 ${size}px Unbounded, system-ui, sans-serif`;
  }
  g.fillStyle = "rgba(20,19,15,0.82)";
  g.fillText(label, W / 2, H / 2 + size * 0.04);

  tex.update(true);
}

export function placeTile(parts, thing) {
  const f = footprint(thing);
  const spec = tileSpec(thing.variant);
  parts.root.position.x = thing.x + f.l / 2;
  parts.root.position.z = thing.z + f.w / 2;
  /* Resting on the paper however it is lying, plus the hair of clearance a
     sheet needs to stop it fighting the paper for the same pixels. */
  parts.root.position.y = standing(thing).h / 2 + (thing.y || 0)
    + (isSolid(spec) ? 0 : liftOf(thing));
  parts.root.rotation.x = thing.tip || 0;
  parts.root.rotation.y = thing.angle || 0;
}

/** What view.js watches to know a tile has to be drawn again. */
export function tileShape(thing) {
  return `${thing.variant}/${thing.sign}`;
}
