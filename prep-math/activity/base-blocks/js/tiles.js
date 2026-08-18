/* ============================================================================
   Manipulatives — algebra tiles
   ----------------------------------------------------------------------------
   The blocks make a NUMBER out of its places. These make an EXPRESSION out of
   its terms: x² and x and 1, in two variables, each of them with a negative.

   ── x is not five ─────────────────────────────────────────────────────────
   The one rule that makes algebra tiles work is that the x-tile's length is not
   a whole number of unit tiles. If it were, a learner would lay units along it,
   count them, and "find out" what x is — and x is the thing you are not told.
   So X_LEN is 4.6 and Y_LEN is 2.7: near enough to the squared paper to sit on
   it tidily, far enough that no number of units ever fits. The tile OCCUPIES a
   whole number of cells (the grid is integers) but it is DRAWN at its true
   length, and the two are deliberately different.

   x² is x by x, y² is y by y, and xy is one of each — so the tiles only fit
   together the ways the algebra allows, which is the whole of the teaching.

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

const THICK = 0.32; // a tile is a tile, not a block: it lies flat and thin

/**
 * The six tiles, by what they are worth.
 *
 * `l` and `w` are the true lengths. `power` is what the term is for reading an
 * expression back: how many x's and how many y's are multiplied together.
 */
export const TILES = [
  { id: "x2", label: "x²", l: X_LEN, w: X_LEN, x: 2, y: 0, token: "--accent-secondary", fallback: "#6fb7e8" },
  { id: "xy", label: "xy", l: X_LEN, w: Y_LEN, x: 1, y: 1, token: "--accent-success", fallback: "#7cc47c" },
  { id: "y2", label: "y²", l: Y_LEN, w: Y_LEN, x: 0, y: 2, token: "--accent-warning", fallback: "#f0a868" },
  { id: "x", label: "x", l: X_LEN, w: 1, x: 1, y: 0, token: "--accent-secondary", fallback: "#6fb7e8" },
  { id: "y", label: "y", l: Y_LEN, w: 1, x: 0, y: 1, token: "--accent-warning", fallback: "#f0a868" },
  { id: "one", label: "1", l: 1, w: 1, x: 0, y: 0, token: "--accent-primary", fallback: "#f4c95d" },
];

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
    // what it OCCUPIES: whole cells, because the grid is integers
    l: Math.ceil(spec.l),
    w: Math.ceil(spec.w),
    h: THICK,
  };
}

/** What one tile is worth, as { x, y, n } — n negative for a negative tile. */
export function tileTerm(thing) {
  const spec = tileSpec(thing.variant);
  return { x: spec.x, y: spec.y, n: thing.sign };
}

/**
 * Read every tile on the canvas back as an expression.
 *
 * Terms are gathered by their powers and written in the order a textbook writes
 * them — the highest degree first, and x before y at the same degree.
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

  if (!terms.length) return { terms, text: "0" };

  const text = terms
    .map((t, i) => {
      const sign = t.n < 0 ? "−" : "+";
      const size = Math.abs(t.n);
      const part = [
        t.x ? (t.x === 1 ? "x" : "x²") : "",
        t.y ? (t.y === 1 ? "y" : "y²") : "",
      ].join("");
      const number = size === 1 && part ? "" : String(size);
      const body = number + part;
      return i === 0 ? (t.n < 0 ? "−" + body : body) : ` ${sign} ${body}`;
    })
    .join("");
  return { terms, text };
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
     counting of units will ever tell you what x is. */
  const slab = BJS.MeshBuilder.CreateBox("tile",
    { width: spec.l, depth: spec.w, height: THICK }, scene);
  slab.position.y = THICK / 2;
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
  face.position.y = THICK + 0.004;
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
  const size = Math.round(Math.min(W, H) * (spec.id === "one" ? 0.52 : 0.4));
  g.font = `700 ${size}px Unbounded, system-ui, sans-serif`;
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
