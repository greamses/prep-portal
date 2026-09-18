/* ============================================================================
   Manipulatives — the balance scale
   ----------------------------------------------------------------------------
   An equation you can see tip. The left-hand pan holds x — a box with an x on
   it that does not say how much it weighs — and blocks go on either pan. The
   beam leans towards whichever side is heavier, so before a single number is
   written down the scale has already said "x is more than 3".

   ── finding x by balancing it ─────────────────────────────────────────────
   x starts at FIVE. Put blocks on the other pan and the scale tips one way or
   the other; press the balance key and the scale is made level by letting x BE
   whatever the blocks say — the right-hand pan, less whatever blocks are
   sitting beside x on the left. That is solving x + 2 = 9 with your hands: what
   x has to weigh for the two sides to be the same.

   ── a block can be turned over ────────────────────────────────────────────
   Tap a piece in a pan and it turns negative — red, the way an algebra tile's
   underside is — and weighs its own size the OTHER way. A piece and its
   opposite on the same pan are nothing at all, so they cancel and both come
   off. Only a piece and its EXACT opposite cancel: a −1 beside a rod is 9, not
   a pair.

   ── what lives where ──────────────────────────────────────────────────────
   The pans hold their pieces as data (`thing.left`, `thing.right` — `{ l, w,
   h, sign }`), not as blocks on the paper. A block dropped on a pan LEAVES the
   paper and goes into the pan, which is why the pieces there tip with it and
   are never counted into the canvas's own total. x is the store's (`store.
   xValue`), not the scale's — x is one letter, whichever scale weighs it.
   ========================================================================== */

import { cssVar, toBase } from "./config.js";
import { footprint } from "./layout.js";
import { blockBox, colourOf } from "./blocks.js";

const B = () => window.BABYLON;

/* ── measurements, in world units (a unit cube is 1) ──────────────────────── */
/* The pans HANG from the ends of a beam on a tall pillar, rather than standing
   on it. The canvas is mostly looked at from above, and pans standing on the
   beam hid it: from overhead you saw two big dishes and no lean at all. Hung,
   the beam runs across the top of everything, visibly slanted, and the pan
   that has gone down is visibly further away. */
const PAN_R = 4.8;        // a pan's radius
const ARM = 9.5;          // from the pivot to where each pan hangs
const PAN_Z = 1;          // the pans hang a little towards the far side…
const SIGN_Z = -5;        // …so the sign can lie at the near foot
const PILLAR_H = 10;      // how tall the pillar the beam turns on is
const HANG = 5.6;         // how far below its end of the beam a pan hangs
const PAN_T = 0.3;        // how thick a pan is
const MAX_TILT = 0.26;    // radians: as far as the beam ever leans
const X_SIDE = 2.2;       // the x box — deliberately NOT a whole number of units
const ROOM = 6.4;         // the square inside a pan pieces are laid out in
const GAP = 0.35;         // between piles of different pieces in a pan

export const SCALE_L = Math.ceil(2 * (ARM + PAN_R));
export const SCALE_W = 13;
/** How high the top of the scale is — where its balance key is pinned. */
export const SCALE_TOP = PILLAR_H + 4;
export const MAX_IN_PAN = 30; // pieces a pan will hold before it says so

/** The one x the whole canvas weighs, until a balance says otherwise. */
export const X_DEFAULT = 5;

const MINUS_HEX = "#d2544a"; // the same red as a negative algebra tile

/* ── the thing on the canvas ──────────────────────────────────────────────── */

export function makeScale() {
  return {
    kind: "scale",
    tag: null,
    x: 0, z: 0, angle: 0,
    l: SCALE_L,
    w: SCALE_W,
    h: PILLAR_H + 2,
    left: [],
    right: [],
  };
}

export const scales = (things) => things.filter((t) => t.kind === "scale");

const worth = (p) => p.l * p.w * p.h * (p.sign < 0 ? -1 : 1);
const sumOf = (pan) => pan.reduce((n, p) => n + worth(p), 0);
const shapeKey = (p) => [p.l, p.w, p.h].sort((a, b) => b - a).join("x");

/**
 * What the two pans weigh, and which way the scale leans.
 *
 * `lean` is +1 when the LEFT is heavier (x's side goes down), −1 when the right
 * is, 0 when it is level.
 */
export function weigh(thing, xValue) {
  const extra = sumOf(thing.left);
  const left = xValue + extra;
  const right = sumOf(thing.right);
  const lean = Math.sign(left - right);
  return { x: xValue, extra, left, right, lean, level: lean === 0 };
}

/** How far the beam leans for this weighing, in radians. */
export function tiltOf(w) {
  if (w.level) return 0;
  const big = Math.max(Math.abs(w.left), Math.abs(w.right), 1);
  const share = Math.min(1, Math.abs(w.left - w.right) / big);
  /* Never a hair's lean for a small difference: 5 against 4 has to be SEEN to
     tip, or it reads as level. */
  return w.lean * MAX_TILT * (0.45 + 0.55 * share);
}

/**
 * The scale as a sentence: x + 2 > 9, written the way it would be on paper,
 * once to read and once for MathJax. The relation is the SCALE's, not ours —
 * it says which side is heavier and nothing about what x ought to be.
 */
export function scaleSentence(thing, xValue, base = 10) {
  const w = weigh(thing, xValue);
  const n = (v) => toBase(Math.abs(v), base);
  const neg = (v) => (v < 0 ? "−" : "") + n(v);
  const lhs = w.extra === 0 ? "x"
    : `x ${w.extra > 0 ? "+" : "−"} ${n(w.extra)}`;
  const rel = w.lean > 0 ? ">" : w.lean < 0 ? "<" : "=";
  const text = `${lhs} ${rel} ${neg(w.right)}`;
  const tex = text.replace(/−/g, "-");
  return { ...w, text, tex, rel };
}

/** A pan by name. */
const panOf = (thing, side) => (side === "left" ? thing.left : thing.right);

/**
 * Take out every piece that has its exact opposite on the same pan.
 * Returns how many pairs went.
 */
export function cancelInPan(pan) {
  let pairs = 0;
  for (let i = 0; i < pan.length; i++) {
    const a = pan[i];
    const j = pan.findIndex((b, k) => k !== i && shapeKey(b) === shapeKey(a) && b.sign !== a.sign);
    if (j < 0) continue;
    pan.splice(Math.max(i, j), 1);
    pan.splice(Math.min(i, j), 1);
    pairs += 1;
    i = -1; // the list moved under us; start again
  }
  return pairs;
}

/** A piece's name, by its size in this base. */
export function pieceWord(p, base) {
  const [a, b, c] = [p.l, p.w, p.h].sort((x, y) => y - x);
  const name = a === 1 ? "unit"
    : a === base && b === 1 ? "rod"
    : a === base && b === base && c === 1 ? "flat"
    : a === base && b === base && c === base ? "cube"
    : `${p.l} × ${p.w} × ${p.h} block`;
  return (p.sign < 0 ? "negative " : "") + name;
}

/**
 * Put a block into a pan. False only when the pan is already full.
 *
 * Neither this nor a flip cancels anything by itself: the pair is left lying
 * together for a moment first (see `hasPair`), so that "a piece and its
 * opposite are nothing" is something you WATCH happen rather than a piece that
 * simply fails to arrive.
 */
export function addToPan(thing, side, block) {
  const pan = panOf(thing, side);
  if (pan.length >= MAX_IN_PAN) return false;
  pan.push({ l: block.l, w: block.w, h: block.h, sign: block.sign < 0 ? -1 : 1 });
  return true;
}

/** Turn a piece in a pan over. Returns the piece as it now is. */
export function flipInPan(thing, side, index) {
  const p = panOf(thing, side)[index];
  if (!p) return null;
  p.sign = p.sign < 0 ? 1 : -1;
  return { ...p };
}

/** Does either pan hold a piece beside its exact opposite? */
export function hasPair(thing) {
  return [thing.left, thing.right].some((pan) => pan.some((a) =>
    pan.some((b) => b !== a && b.sign !== a.sign && shapeKey(b) === shapeKey(a))));
}

/** Take the pairs out of both pans; how many went. */
export function cancelPans(thing) {
  return cancelInPan(thing.left) + cancelInPan(thing.right);
}

/** Take a pan's pieces out; the positive ones come back as blocks. */
export function emptyPans(thing) {
  const out = thing.left.concat(thing.right);
  thing.left = [];
  thing.right = [];
  return out;
}

/**
 * Where a pan's middle is on the paper, in world cells — worked out from the
 * scale's own place and turn, so a block can be tested against it.
 */
export function panCentre(thing, side) {
  const f = footprint(thing);
  const cx = thing.x + f.l / 2;
  const cz = thing.z + f.w / 2;
  const lx = side === "left" ? -ARM : ARM;
  const lz = PAN_Z;
  const a = thing.angle || 0;
  const c = Math.cos(a);
  const s = Math.sin(a);
  /* Babylon's rotation.y, applied to a local point: the same turn the rig is
     given, so the pan we test is the pan you see. */
  return { x: cx + lx * c + lz * s, z: cz - lx * s + lz * c };
}

/** Which pan (if either) a block let go of at this spot has landed in. */
export function panUnder(thing, block) {
  const f = footprint(block);
  const bx = block.x + f.l / 2;
  const bz = block.z + f.w / 2;
  for (const side of ["left", "right"]) {
    const c = panCentre(thing, side);
    if (Math.hypot(bx - c.x, bz - c.z) <= PAN_R + 0.6) return side;
  }
  return null;
}

/**
 * Balance: let x weigh whatever makes the two sides the same. The right-hand
 * pan, less whatever is standing beside x on the left.
 */
export function balanceX(thing) {
  const blocks = thing.left.length + thing.right.length;
  if (!blocks) return null;
  return sumOf(thing.right) - sumOf(thing.left);
}

/* ── laying pieces out in a pan ───────────────────────────────────────────── */

/**
 * Where each piece sits in its pan, relative to the pan's middle, and how much
 * the whole lot has to be shrunk to fit.
 *
 * Alike pieces go together: units in a little square, rods side by side the way
 * a flat is made of them, flats and cubes in a pile. The piles stand in a row,
 * and the row is shrunk — all of it by the same amount, so a rod is still ten
 * units long beside the units — only when it would not fit in the pan.
 */
function layOut(pan, withX) {
  const groups = new Map();
  pan.forEach((p, index) => {
    const key = shapeKey(p) + (p.sign < 0 ? "-" : "+");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ p, index });
  });

  const piles = [];
  if (withX) {
    piles.push({ l: X_SIDE, w: X_SIDE, h: X_SIDE, at: [{ x: true, lx: 0, lz: 0, ly: 0 }] });
  }
  const order = [...groups.values()].sort((a, b) =>
    Math.abs(worth(b[0].p)) - Math.abs(worth(a[0].p)) || a[0].p.sign - b[0].p.sign);
  for (const list of order) {
    const [a, b, c] = [list[0].p.l, list[0].p.w, list[0].p.h].sort((x, y) => y - x);
    /* Lying flat: longest along the row, shortest up. */
    const l = a, w = b, h = c;
    let perRow, perLayer;
    if (a === b && a * b <= 4) { perRow = 5; perLayer = 25; }       // units
    else if (a > b && b * 2 <= a) { perRow = 1; perLayer = Math.max(1, Math.floor(a / b)); } // rods
    else { perRow = 1; perLayer = 1; }                              // flats, cubes
    const at = [];
    list.forEach(({ index }, i) => {
      const layer = Math.floor(i / perLayer);
      const k = i % perLayer;
      const col = perRow > 1 ? k % perRow : 0;
      const row = perRow > 1 ? Math.floor(k / perRow) : k;
      at.push({ index, lx: col * l, lz: row * w, ly: layer * h, l, w, h });
    });
    const n = Math.min(list.length, perLayer);
    const cols = perRow > 1 ? Math.min(n, perRow) : 1;
    const rows = perRow > 1 ? Math.ceil(n / perRow) : n;
    piles.push({ l: cols * l, w: rows * w, h: Math.ceil(list.length / perLayer) * h, at });
  }

  /* One row of piles, then shrunk to the pan and centred on it. */
  let cursor = 0;
  let deep = 0;
  for (const pile of piles) {
    pile.x0 = cursor;
    cursor += pile.l + GAP;
    deep = Math.max(deep, pile.w);
  }
  const wide = Math.max(0, cursor - GAP);
  const k = Math.min(1, ROOM / Math.max(wide, deep, 1e-6));

  const out = [];
  for (const pile of piles) {
    for (const a of pile.at) {
      const pl = a.x ? X_SIDE : a.l;
      const pw = a.x ? X_SIDE : a.w;
      const ph = a.x ? X_SIDE : a.h;
      out.push({
        index: a.x ? -1 : a.index,
        x: !!a.x,
        cx: (pile.x0 + a.lx + pl / 2 - wide / 2) * k,
        cz: (a.lz + pw / 2 - (pile.w) / 2) * k,
        cy: (a.ly + ph / 2) * k,
        l: pl, w: pw, h: ph,
      });
    }
  }
  return { pieces: out, k };
}

/* ── meshes ───────────────────────────────────────────────────────────────── */

const matCache = new Map();
function mat(scene, hex, shade = 1) {
  const k = hex + "/" + shade;
  if (matCache.has(k)) return matCache.get(k);
  const BJS = B();
  const m = new BJS.StandardMaterial("sc-" + k, scene);
  m.diffuseColor = BJS.Color3.FromHexString(norm(hex)).scale(shade);
  m.specularColor = new BJS.Color3(0.06, 0.06, 0.06);
  matCache.set(k, m);
  return m;
}
export function clearScaleMaterials() {
  matCache.forEach((m) => m.dispose());
  matCache.clear();
}
function norm(hex) {
  const h = String(hex || "").trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) return "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (/^#[0-9a-f]{6}$/i.test(h)) return h;
  if (/^#[0-9a-f]{8}$/i.test(h)) return h.slice(0, 7);
  return "#b98a5a";
}

/** A flat label printed on a sheet — the x on its box, the sentence on the sign. */
function labelSheet(scene, name, w, d, px) {
  const BJS = B();
  const sheet = BJS.MeshBuilder.CreateGround(name, { width: w, height: d }, scene);
  const tex = new BJS.DynamicTexture(name + "Tex",
    { width: Math.round(w * px), height: Math.round(d * px) }, scene, false);
  tex.hasAlpha = true;
  const m = new BJS.StandardMaterial(name + "Mat", scene);
  m.diffuseTexture = tex;
  m.useAlphaFromDiffuseTexture = true;
  m.specularColor = new BJS.Color3(0, 0, 0);
  m.emissiveColor = new BJS.Color3(0.35, 0.35, 0.35);
  m.backFaceCulling = false;
  sheet.material = m;
  return { sheet, tex, m };
}

export function buildScale(ctx, thing) {
  const BJS = B();
  const scene = ctx.scene;
  const root = new BJS.TransformNode("sc" + thing.id, scene);
  const id = thing.id;

  const wood = cssVar("--accent-warning", "#f0a868");
  const ink = cssVar("--ink", "#2a2723");
  const tray = cssVar("--surface-secondary", "#efe8dc");

  const tag = (m) => { m.metadata = { itemId: id }; m.parent = root; return m; };

  /* The foot the whole thing stands on, and the pillar the beam turns on. */
  const foot = tag(BJS.MeshBuilder.CreateBox("scFoot",
    { width: 5, depth: 4, height: 0.5 }, scene));
  foot.position.set(0, 0.25, PAN_Z);
  foot.material = mat(scene, wood, 0.8);

  const pillar = tag(BJS.MeshBuilder.CreateCylinder("scPillar",
    { diameter: 0.8, height: PILLAR_H, tessellation: 18 }, scene));
  pillar.position.set(0, PILLAR_H / 2 + 0.5, PAN_Z);
  pillar.material = mat(scene, wood, 0.9);

  /* The beam hangs off a pivot node: turning the NODE turns the beam and the
     needle together, and the pans are put where its ends have got to. */
  const pivot = new BJS.TransformNode("scPivot", scene);
  pivot.parent = root;
  pivot.position.set(0, PILLAR_H + 0.7, PAN_Z);

  const beam = tag(BJS.MeshBuilder.CreateBox("scBeam",
    { width: ARM * 2 + 0.6, depth: 0.7, height: 0.45 }, scene));
  beam.parent = pivot;
  beam.material = mat(scene, wood);

  const hub = tag(BJS.MeshBuilder.CreateCylinder("scHub",
    { diameter: 1.1, height: 0.9, tessellation: 20 }, scene));
  hub.parent = pivot;
  hub.rotation.x = Math.PI / 2;
  hub.material = mat(scene, ink, 1);

  /* The needle stands straight up off the beam and swings with it, over a mark
     that is where it points when the two sides are the same. */
  const needle = tag(BJS.MeshBuilder.CreateBox("scNeedle",
    { width: 0.16, depth: 0.16, height: 2.4 }, scene));
  needle.parent = pivot;
  needle.position.y = 1.3;
  needle.material = mat(scene, "#d2544a");

  const mark = tag(BJS.MeshBuilder.CreateBox("scMark",
    { width: 0.12, depth: 0.12, height: 0.7 }, scene));
  mark.position.set(0, PILLAR_H + 0.7 + 2.9, PAN_Z - 0.3);
  mark.material = mat(scene, ink);

  /* A hook at each end of the beam, for a pan to hang from. */
  for (const dx of [-ARM, ARM]) {
    const hook = tag(BJS.MeshBuilder.CreateSphere("scHook",
      { diameter: 0.55, segments: 10 }, scene));
    hook.parent = pivot;
    hook.position.x = dx;
    hook.material = mat(scene, ink, 1);
  }

  /* The two pans, each on three strings from its hook. They are NOT children
     of the beam — a pan hangs straight down however the beam leans, which is
     what lets the pieces in it stay put — so the strings are fixed to the PAN
     and meet exactly where the hook will be. */
  const pans = {};
  for (const side of ["left", "right"]) {
    const node = new BJS.TransformNode("scPan-" + side, scene);
    node.parent = root;
    const top = new BJS.Vector3(0, HANG, 0);
    const lines = [0, 1, 2].map((i) => {
      const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
      return [new BJS.Vector3(Math.cos(a) * PAN_R * 0.94, PAN_T, Math.sin(a) * PAN_R * 0.94), top];
    });
    const strings = BJS.MeshBuilder.CreateLineSystem("scStrings", { lines }, scene);
    strings.parent = node;
    strings.color = BJS.Color3.FromHexString(norm(ink));
    strings.isPickable = false;
    const dish = tag(BJS.MeshBuilder.CreateCylinder("scDish",
      { diameter: PAN_R * 2, height: PAN_T, tessellation: 48 }, scene));
    dish.parent = node;
    dish.position.y = PAN_T / 2;
    dish.material = mat(scene, tray);
    dish.metadata.dish = { thingId: id, side };
    dish.receiveShadows = true;
    const rim = tag(BJS.MeshBuilder.CreateTorus("scRim",
      { diameter: PAN_R * 2, thickness: 0.28, tessellation: 48 }, scene));
    rim.parent = node;
    rim.position.y = PAN_T;
    rim.material = mat(scene, wood, 0.85);
    rim.metadata.dish = { thingId: id, side };
    ctx.shadows.addShadowCaster(dish);
    /* What is in the pan hangs off here, lifted to the dish's top. */
    const load = new BJS.TransformNode("scLoad-" + side, scene);
    load.parent = node;
    load.position.y = PAN_T;
    pans[side] = { node, dish, load, pieces: [] };
  }
  [pillar, beam, hub, needle].forEach((m) => ctx.shadows.addShadowCaster(m));

  /* The sign at its foot: what the scale says, as a sentence. */
  const sign = labelSheet(scene, "scSign" + id, 8, 2.4, 64);
  sign.sheet.parent = root;
  sign.sheet.position.set(0, 0.02, SIGN_Z);
  sign.sheet.metadata = { itemId: id };

  const parts = {
    root, slab: foot, face: null, pivot, beam, pans,
    sign: sign.sheet, signTex: sign.tex, tex: sign.tex,
    tilt: 0, goal: 0, vel: 0, loadKey: "", signKey: "",
  };

  /* The beam swings on a spring, a little past level and back, the way a real
     one settles — a scale that simply stopped would not look as if it had
     weighed anything. */
  const obs = scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(0.05, scene.getEngine().getDeltaTime() / 1000 || 0.016);
    const pull = parts.goal - parts.tilt;
    if (Math.abs(pull) < 1e-4 && Math.abs(parts.vel) < 1e-4) {
      if (parts.tilt !== parts.goal) { parts.tilt = parts.goal; applyTilt(parts); }
      return;
    }
    parts.vel += (pull * 60 - parts.vel * 7) * dt;
    parts.tilt += parts.vel * dt;
    applyTilt(parts);
  });
  root.onDisposeObservable.add(() => {
    scene.onBeforeRenderObservable.remove(obs);
    sign.m.dispose();
  });

  applyTilt(parts);
  return parts;
}

/** Put the beam and both pans where a lean of `parts.tilt` puts them. */
function applyTilt(parts) {
  const t = parts.tilt;
  parts.pivot.rotation.z = t;
  const y0 = parts.pivot.position.y;
  const c = Math.cos(t);
  const s = Math.sin(t);
  /* A positive lean lifts the right-hand end: +x goes to (cos t, sin t). */
  parts.pans.left.node.position.set(-ARM * c, y0 - ARM * s - HANG, PAN_Z);
  parts.pans.right.node.position.set(ARM * c, y0 + ARM * s - HANG, PAN_Z);
}

export function placeScale(parts, thing) {
  const f = footprint(thing);
  parts.root.position.x = thing.x + f.l / 2;
  parts.root.position.y = 0;
  parts.root.position.z = thing.z + f.w / 2;
  parts.root.rotation.y = thing.angle || 0;
}

/**
 * Make the rig match the scale: the pieces in each pan, the sentence on the
 * sign, and which way the beam is to lean. The beam SWINGS there (see the
 * spring above) unless this is a redraw that should not animate.
 */
export function syncScale(ctx, thing, parts, { base = 10, xValue = X_DEFAULT, animate = true } = {}) {
  const key = JSON.stringify([thing.left, thing.right, base]);
  if (key !== parts.loadKey) {
    parts.loadKey = key;
    fillPan(ctx, thing, parts, "left", base);
    fillPan(ctx, thing, parts, "right", base);
  }

  const said = scaleSentence(thing, xValue, base);
  const signKey = said.text + "|" + xValue + "|" + base;
  if (signKey !== parts.signKey) {
    parts.signKey = signKey;
    paintSign(parts, said, xValue, base);
  }

  parts.goal = tiltOf(said);
  if (!animate) {
    parts.tilt = parts.goal;
    parts.vel = 0;
    applyTilt(parts);
  }
}

function fillPan(ctx, thing, parts, side, base) {
  const BJS = B();
  const scene = ctx.scene;
  const pan = parts.pans[side];
  for (const m of pan.pieces) {
    ctx.shadows.removeShadowCaster(m);
    /* The x's printed face owns its texture; the blocks share cached ones. */
    m.dispose(false, !!m.metadata?.own);
  }
  pan.pieces = [];

  const list = panOf(thing, side);
  const { pieces, k } = layOut(list, side === "left");
  for (const at of pieces) {
    let mesh;
    if (at.x) {
      mesh = BJS.MeshBuilder.CreateBox("scX",
        { width: X_SIDE, depth: X_SIDE, height: X_SIDE }, scene);
      mesh.material = mat(scene, cssVar("--accent-secondary", "#6fb7e8"));
      const face = labelSheet(scene, "scXFace" + thing.id, X_SIDE * 0.9, X_SIDE * 0.9, 56);
      face.sheet.parent = mesh;
      face.sheet.position.y = X_SIDE / 2 + 0.01;
      face.sheet.metadata = { pan: { thingId: thing.id, side, index: -1 }, own: true };
      paintX(face.tex);
      pan.pieces.push(face.sheet);
    } else {
      const p = list[at.index];
      const hex = p.sign < 0 ? MINUS_HEX : colourOf({ ...p, tag: null }, base);
      mesh = blockBox(scene, { l: at.l, w: at.w, h: at.h }, hex, "scPiece");
    }
    mesh.parent = pan.load;
    mesh.scaling.set(k, k, k);
    mesh.position.set(at.cx, at.cy, at.cz);
    mesh.metadata = { pan: { thingId: thing.id, side, index: at.index } };
    mesh.receiveShadows = true;
    ctx.shadows.addShadowCaster(mesh);
    pan.pieces.push(mesh);
  }
}

function paintX(tex) {
  const g = tex.getContext();
  const { width: W, height: H } = tex.getSize();
  g.clearRect(0, 0, W, H);
  g.fillStyle = "rgba(20,19,15,0.86)";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `italic 700 ${Math.round(H * 0.72)}px "STIX Two Text", Cambria, Georgia, serif`;
  g.fillText("x", W / 2, H / 2 - H * 0.04);
  tex.update(true);
}

/**
 * The sign: the relation the scale is showing, big, and underneath what x is
 * weighing just now. Figures in the mono, the site's rule for numbers here.
 */
function paintSign(parts, said, xValue, base) {
  const tex = parts.signTex;
  const g = tex.getContext();
  const { width: W, height: H } = tex.getSize();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);

  // the paper: a pale sticky note, the canvas's own way of saying something
  g.fillStyle = said.level ? "#e3f4dc" : "#fff4c7";
  const r = H * 0.12;
  g.beginPath();
  g.moveTo(r, 0); g.lineTo(W - r, 0); g.quadraticCurveTo(W, 0, W, r);
  g.lineTo(W, H - r); g.quadraticCurveTo(W, H, W - r, H);
  g.lineTo(r, H); g.quadraticCurveTo(0, H, 0, H - r);
  g.lineTo(0, r); g.quadraticCurveTo(0, 0, r, 0);
  g.fill();

  g.fillStyle = "#14130f";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const mono = '"JetBrains Mono", ui-monospace, monospace';
  let size = Math.round(H * 0.42);
  g.font = `700 ${size}px ${mono}`;
  const room = W * 0.9;
  const wide = g.measureText(said.text).width;
  if (wide > room) {
    size = Math.max(10, Math.round(size * room / wide));
    g.font = `700 ${size}px ${mono}`;
  }
  g.fillText(said.text, W / 2, H * 0.36);

  g.font = `500 ${Math.round(H * 0.2)}px ${mono}`;
  g.fillStyle = "rgba(20,19,15,0.7)";
  const xs = (xValue < 0 ? "−" : "") + toBase(Math.abs(xValue), base);
  g.fillText(said.level ? (said.extra ? `level · x = ${xs}` : "level")
    : `x is ${xs} · tipped`, W / 2, H * 0.76);
  tex.update(true);
}

/** What view.js watches to know the rig has to be built again. */
export function scaleShape() {
  return "scale";
}
