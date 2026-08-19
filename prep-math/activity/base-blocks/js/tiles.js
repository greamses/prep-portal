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

   ── unit, rod, flat, cube — in x and in y ─────────────────────────────────
   The family goes all the way up to the SOLIDS: x³ is x by x by x, x²y is an
   x-square standing y tall, and so on down to the unit, which is one by one by
   one. It is the same four shapes the base blocks have, built out of x and y
   instead of out of ten — and that is why every flat piece here is exactly ONE
   UNIT THICK. Stack x of the x² flats and you have the x³ cube; if a tile were
   a thin wafer instead, that sentence would be a lie, and the cube would sit on
   the canvas as a picture of itself rather than as x of anything.

   ── the negative is the same tile turned over ─────────────────────────────
   A negative tile is the same shape in the same size, in red, with a minus on
   it. Put a tile and its negative together and they are nothing: that is a ZERO
   PAIR, and cancelling them is the Merge key's job on this family.
   ========================================================================== */

import { cssVar } from "./config.js";
import { footprint } from "./layout.js";

const B = () => window.BABYLON;

/* The lengths, in world units (one unit cube = 1). Neither divides into a
   whole number of units, on purpose — see above. */
export const X_LEN = 4.6;
export const Y_LEN = 2.7;

/* A flat piece is one unit thick — the same depth a base-ten flat has, so the
   two families sit on the paper at the same height and x of the x² flats really
   is the x³ cube. */
const FLAT = 1;

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
  { id: "x", label: "x", l: X_LEN, w: FLAT, h: FLAT, x: 1, y: 0, ...BLUE },
  { id: "y", label: "y", l: Y_LEN, w: FLAT, h: FLAT, x: 0, y: 1, ...AMBER },
  { id: "one", label: "1", l: 1, w: 1, h: 1, x: 0, y: 0, ...BUTTER },
];

/** A piece that stands up off the paper: x³, x²y, xy², y³. */
export const isSolid = (spec) => spec.h > FLAT;

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
  for (const t of tiles) {
    const { x, y, n } = tileTerm(t);
    const key = x + "," + y;
    by.set(key, (by.get(key) || 0) + n);
  }
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
     counting of units will ever tell you what x is. The height is true as well,
     which is what makes an x³ a cube and not a tall box. */
  const slab = BJS.MeshBuilder.CreateBox("tile",
    { width: spec.l, depth: spec.w, height: spec.h }, scene);
  slab.position.y = spec.h / 2;
  slab.parent = root;
  slab.receiveShadows = true;
  slab.metadata = { itemId: thing.id };
  slab.material = mat(scene, colourOfTile(thing));
  ctx.shadows.addShadowCaster(slab);

  /* The label is printed on a sheet a whisker above the tile rather than on the
     box itself: a box takes one material for all six faces, and the top is the
     only one anybody reads. */
  const face = BJS.MeshBuilder.CreateGround("tileFace",
    { width: spec.l * 0.94, height: spec.w * 0.94 }, scene);
  face.position.y = spec.h + 0.004;
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
  parts.root.position.x = thing.x + f.l / 2;
  parts.root.position.z = thing.z + f.w / 2;
  parts.root.position.y = 0;
  parts.root.rotation.y = thing.angle || 0;
}

/** What view.js watches to know a tile has to be drawn again. */
export function tileShape(thing) {
  return `${thing.variant}/${thing.sign}`;
}
