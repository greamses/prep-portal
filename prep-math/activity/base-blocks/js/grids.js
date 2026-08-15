/* ============================================================================
   Manipulatives — the charts and grids
   ----------------------------------------------------------------------------
   A board is a thin slab with a table drawn on its top face. The top is a
   separate single-sided plane, not a face of the slab, so a pick returns that
   face's texture coordinates directly and a tap can be turned into a row and a
   column with nothing but arithmetic.

   The place-value chart is the one that talks to the rest of the canvas: it
   reads whatever blocks are standing in its columns, and it relabels itself the
   moment the working base changes.
   ========================================================================== */

import { PLACES, placeDims, placeOf, toBase, baseWord, cssVar } from "./config.js";
import { footprint } from "./layout.js";

const B = () => window.BABYLON;

const SLAB = 0.22;      // how thick the board is
const CELL = 2;         // canvas cells per table cell (multiply / divide)
const COL = 12;         // canvas cells per place-value column
const HEAD = 4;         // canvas cells of header depth
const AREA = 13;        // canvas cells of column depth

export const GRID_MAX = 12; // tables run to twelve twelves

/* ── the thing on the canvas ──────────────────────────────────────────────── */

export function makeBoard(variant, base) {
  if (variant === "place") {
    return {
      kind: "board", variant, tag: null, x: 0, z: 0, angle: 0,
      l: PLACES.length * COL, w: HEAD + AREA, h: SLAB,
    };
  }
  const n = GRID_MAX + 1; // a header line plus 1..12
  return {
    kind: "board", variant, tag: null, x: 0, z: 0, angle: 0,
    l: n * CELL, w: n * CELL, h: SLAB,
    hidden: [],          // "r,c" of cells blanked for practice
    focus: null,         // { r, c } lit row and column
  };
}

/* ── meshes ───────────────────────────────────────────────────────────────── */

export function buildBoard(ctx, thing, base) {
  const BJS = B();
  const scene = ctx.scene;
  const root = new BJS.TransformNode("bd" + thing.id, scene);

  const slab = BJS.MeshBuilder.CreateBox("slab",
    { width: thing.l, depth: thing.w, height: SLAB }, scene);
  slab.position.y = SLAB / 2;
  slab.parent = root;
  slab.receiveShadows = true;
  slab.metadata = { itemId: thing.id };
  const edge = new BJS.StandardMaterial("bdEdge" + thing.id, scene);
  edge.diffuseColor = BJS.Color3.FromHexString(norm(cssVar("--ink", "#2a2723")));
  edge.specularColor = new BJS.Color3(0, 0, 0);
  slab.material = edge;
  ctx.shadows.addShadowCaster(slab);

  const face = BJS.MeshBuilder.CreateGround("face",
    { width: thing.l - 0.12, height: thing.w - 0.12 }, scene);
  face.position.y = SLAB + 0.002;
  face.parent = root;
  face.metadata = { itemId: thing.id, boardFace: true };

  /* No mipmaps and clamped edges. A board's face is a single quad seen more or
     less straight on, so mips buy nothing — and an oblong non-power-of-two one
     (the place-value chart is 2016 × 714) comes out black with them on. */
  const px = Math.min(2048, Math.round(thing.l * 42));
  const py = Math.min(2048, Math.round(thing.w * 42));
  const tex = new BJS.DynamicTexture("bdTex" + thing.id, { width: px, height: py }, scene, false);
  tex.wrapU = BJS.Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = BJS.Texture.CLAMP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 4;
  const faceMat = new BJS.StandardMaterial("bdFace" + thing.id, scene);
  faceMat.diffuseTexture = tex;
  faceMat.specularColor = new BJS.Color3(0.02, 0.02, 0.02);
  face.material = faceMat;

  const parts = { root, slab, face, tex, edge, faceMat };
  paintBoard(thing, parts, { base });
  return parts;
}

export function placeBoard(parts, thing) {
  const f = footprint(thing);
  parts.root.position.x = thing.x + f.l / 2;
  parts.root.position.z = thing.z + f.w / 2;
  parts.root.position.y = 0;
  /* Turning the root turns the drawn face with it, which is the point — and the
     face's texture coordinates are untouched, so a tap still lands on the square
     it looks like it landed on however the board is lying. */
  parts.root.rotation.y = thing.angle || 0;
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

export function paintBoard(thing, parts, opts = {}) {
  const tex = parts.tex;
  const g = tex.getContext();
  const W = tex.getSize().width;
  const H = tex.getSize().height;

  const paper = cssVar("--surface-primary", "#fffdf8");
  const ink = cssVar("--ink", "#2a2723");
  const soft = cssVar("--text-secondary", "#6b655c");

  g.clearRect(0, 0, W, H);
  g.fillStyle = paper;
  g.fillRect(0, 0, W, H);
  g.textAlign = "center";
  g.textBaseline = "middle";

  if (thing.variant === "place") drawPlace(g, W, H, thing, opts, { ink, soft });
  else drawTable(g, W, H, thing, opts, { ink, soft });

  // invertY: a 2D canvas counts rows downward and the ground's V runs upward,
  // so without this every label comes out upside down
  tex.update(true);
}

function drawPlace(g, W, H, thing, opts, c) {
  const base = opts.base || 10;
  const reading = opts.reading || { counts: [], strays: 0, total: 0 };
  const cols = PLACES.length;
  const cw = W / cols;
  const headH = H * (HEAD / (HEAD + AREA));

  // biggest place on the left, the way a number is written
  const order = [...PLACES].reverse();

  for (let i = 0; i < cols; i++) {
    const p = order[i];
    const x = i * cw;
    const d = placeDims(p.id, base);
    const worth = d.l * d.w * d.h;

    g.fillStyle = tint(cssVar(TOKENS[p.id], "#f4c95d"), 0.9);
    g.fillRect(x, 0, cw, headH);

    g.fillStyle = "#2a2723";
    g.font = `700 ${Math.round(headH * 0.3)}px Unbounded, system-ui, sans-serif`;
    g.fillText(p.plural, x + cw / 2, headH * 0.32);
    g.font = `600 ${Math.round(headH * 0.2)}px "JetBrains Mono", monospace`;
    g.fillText(`${worth}  ·  ${base}^${p.power}`, x + cw / 2, headH * 0.66);

    // the count standing in this column
    const n = reading.counts[p.id] || 0;
    g.fillStyle = c.ink;
    g.font = `900 ${Math.round(headH * 0.62)}px Unbounded, system-ui, sans-serif`;
    g.globalAlpha = n ? 0.16 : 0.07;
    g.fillText(String(n), x + cw / 2, headH + (H - headH) / 2);
    g.globalAlpha = 1;
  }

  g.strokeStyle = rgba(c.ink, 0.5);
  g.lineWidth = 4;
  g.beginPath();
  for (let i = 1; i < cols; i++) { g.moveTo(i * cw, 0); g.lineTo(i * cw, H); }
  g.moveTo(0, headH); g.lineTo(W, headH);
  g.stroke();
  g.strokeRect(2, 2, W - 4, H - 4);
}

const TOKENS = {
  unit: "--accent-primary",
  rod: "--accent-secondary",
  flat: "--accent-success",
  cube: "--accent-danger",
};

function drawTable(g, W, H, thing, opts, c) {
  const n = GRID_MAX + 1;
  const cw = W / n;
  const ch = H / n;
  const divide = thing.variant === "divide";
  const hidden = new Set(thing.hidden || []);
  const focus = thing.focus;

  const headFill = tint(cssVar("--accent-primary", "#f4c95d"), 0.85);
  const focusFill = tint(cssVar("--accent-secondary", "#6fb7e8"), 0.35);
  const answerFill = tint(cssVar("--accent-success", "#7cc47c"), 0.6);

  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      const x = col * cw;
      const y = r * ch;
      const isHead = r === 0 || col === 0;
      const lit = focus && (r === focus.r || col === focus.c) && !isHead;
      const answer = focus && r === focus.r && col === focus.c;

      if (isHead) { g.fillStyle = headFill; g.fillRect(x, y, cw, ch); }
      else if (answer) { g.fillStyle = answerFill; g.fillRect(x, y, cw, ch); }
      else if (lit) { g.fillStyle = focusFill; g.fillRect(x, y, cw, ch); }

      let text = "";
      if (r === 0 && col === 0) text = divide ? "÷" : "×";
      else if (r === 0) text = String(col);
      else if (col === 0) text = String(r);
      else if (!hidden.has(r + "," + col)) text = String(r * col);

      if (!text) continue;
      g.fillStyle = isHead ? "#2a2723" : c.ink;
      const size = Math.round(ch * (isHead ? 0.44 : 0.4));
      g.font = `${isHead ? 700 : 500} ${size}px "JetBrains Mono", monospace`;
      g.fillText(text, x + cw / 2, y + ch / 2 + 1);
    }
  }

  g.strokeStyle = rgba(c.ink, 0.28);
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 1; i < n; i++) {
    g.moveTo(i * cw, 0); g.lineTo(i * cw, H);
    g.moveTo(0, i * ch); g.lineTo(W, i * ch);
  }
  g.stroke();

  g.strokeStyle = rgba(c.ink, 0.6);
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(cw, 0); g.lineTo(cw, H);
  g.moveTo(0, ch); g.lineTo(W, ch);
  g.stroke();
  g.strokeRect(2, 2, W - 4, H - 4);
}

/* ── interaction ──────────────────────────────────────────────────────────── */

/**
 * Turn a pick on the board's face into something happening.
 * `uv` is Babylon's texture coordinate: u across, v UP from the bottom.
 */
export function tapBoard(thing, uv, base) {
  if (thing.variant === "place") return { changed: false };
  const n = GRID_MAX + 1;
  const col = Math.floor(uv.x * n);
  const r = Math.floor((1 - uv.y) * n);
  if (r < 0 || col < 0 || r >= n || col >= n) return { changed: false };

  if (r === 0 || col === 0) {
    // a header taps the whole line into focus
    thing.focus = r === 0 && col === 0 ? null : { r: r || null, c: col || null };
    return { changed: true, message: null };
  }

  thing.focus = { r, c: col };
  const product = r * col;
  if (thing.variant === "divide") {
    return { changed: true, message: `${product} ÷ ${r} = ${col}` };
  }
  return { changed: true, message: `${r} × ${col} = ${product}` };
}

/** Blank a cell out for practice (or bring it back). */
export function toggleCell(thing, uv) {
  if (thing.variant === "place") return false;
  const n = GRID_MAX + 1;
  const col = Math.floor(uv.x * n);
  const r = Math.floor((1 - uv.y) * n);
  if (r < 1 || col < 1 || r >= n || col >= n) return false;
  const key = r + "," + col;
  const set = new Set(thing.hidden || []);
  if (set.has(key)) set.delete(key); else set.add(key);
  thing.hidden = [...set];
  return true;
}

/* ── the place-value chart reads the canvas ───────────────────────────────── */

/** Which blocks are standing on this chart, and in which column. */
export function placeReading(thing, blocks, base) {
  const counts = {};
  const wrong = [];
  let total = 0;

  for (const b of blocks) {
    const cx = b.x + b.l / 2;
    const cz = b.z + b.w / 2;
    if (cx < thing.x || cx > thing.x + thing.l) continue;
    if (cz < thing.z || cz > thing.z + thing.w) continue;

    const col = Math.min(PLACES.length - 1, Math.floor((cx - thing.x) / COL));
    const place = [...PLACES].reverse()[col];
    counts[place.id] = (counts[place.id] || 0) + 1;
    total += b.l * b.w * b.h;
    if (placeOf(b, base) !== place.id) wrong.push(b);
  }

  const order = [...PLACES].reverse();
  const digits = order.map((p) => counts[p.id] || 0);
  const tidy = digits.every((d) => d < base) && !wrong.length;
  return { counts, digits, strays: wrong.length, total, tidy };
}

export function placeSentence(reading, base) {
  if (!reading.total) return "Stand some blocks in the columns.";
  if (reading.strays) {
    return `${reading.strays} block${reading.strays === 1 ? " is" : "s are"} in the wrong column.`;
  }
  if (!reading.tidy) {
    return `${reading.total} units on the chart — a column is holding ${base} or more, so it can be traded.`;
  }
  const digits = reading.digits.join("").replace(/^0+(?=\d)/, "");
  return `The chart reads ${digits} — ${reading.total} units in base ${baseWord(base)} is ${toBase(reading.total, base)}.`;
}

/* ── colour helpers ───────────────────────────────────────────────────────── */

function norm(hex) {
  const h = String(hex || "").trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) return "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (/^#[0-9a-f]{6}$/i.test(h)) return h;
  if (/^#[0-9a-f]{8}$/i.test(h)) return h.slice(0, 7);
  return "#2a2723";
}
function rgba(hex, a) {
  const h = norm(hex).replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function tint(hex, a) {
  return rgba(hex, a);
}
