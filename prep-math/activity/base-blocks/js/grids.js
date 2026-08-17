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

import {
  PLACES, placeAt, worthOf, placeDims, placeOf, placeColour, toBase, baseWord, cssVar,
} from "./config.js";
import { footprint } from "./layout.js";

const B = () => window.BABYLON;

const SLAB = 0.22;      // how thick the board is
const CELL = 2;         // canvas cells per table cell (multiply / divide)

/* ── the place-value chart, measured in canvas cells ──────────────────────────
   Down the face, top to bottom: a GUTTER of grow/shrink tabs on the left edge,
   then for every column a TRAY of spare counters, a HEAD of labels, and the
   AREA the counters sit in. */
const GUT = 3;          // width of the left-hand gutter
const COL = 9;          // width of one place column
const TRAY = 2;         // depth of the spare-counter tray along the top
const HEAD = 2.5;       // depth of the heading band
const AREA = 5.5;       // depth of the counter area
/* TRAY + HEAD + AREA is 10 on purpose: the chart is exactly as deep as a flat
   is wide, so it sits on the paper as one more hundred rather than towering
   over everything else on the canvas. */

export const MIN_PLACES = 2;
export const MAX_PLACES = 7;   // powers 0…6 — as far as the names carry
export const MAX_DOTS = 20;    // as many as a column this deep holds legibly

/**
 * How far a table runs.
 *
 * A times table stops being new at the last digit the base has: past 4 in base
 * five every product is one you have already met, wearing a carry. So the table
 * is (base−1) by (base−1) — the whole of multiplication in that base and not a
 * square more, which is why a base-five table is small enough to hold in the
 * head and a base-ten one is not.
 *
 * Base ten is the one exception, and it is a fact about us rather than about
 * ten: the twelve-times table is learnt whole, so it stays whole.
 */
export const GRID_MAX = 12; // base ten runs to twelve twelves
export function tableMax(base) {
  return base === 10 ? GRID_MAX : base - 1;
}

/** The table a board is actually carrying (its own, not the canvas's). */
function maxOf(thing) {
  return thing.max || tableMax(thing.base || 10);
}

/** How wide and deep a chart of `n` places is, in cells. */
export function chartSize(n) {
  return { l: GUT + n * COL, w: TRAY + HEAD + AREA };
}

/* ── the thing on the canvas ──────────────────────────────────────────────── */

export function makeBoard(variant, base) {
  if (variant === "place") {
    const places = PLACES.length;
    return {
      kind: "board", variant, tag: null, x: 0, z: 0, angle: 0,
      ...chartSize(places), h: SLAB,
      places,
      /* Counters, one entry per column in the order they are drawn — biggest
         place on the LEFT, the way a number is written. They are the chart's own
         way of holding a digit, for when you want to work the places without
         fetching a block for every one. */
      counters: Array.from({ length: places }, () => 0),
    };
  }
  /* A table carries the base it was written in, the way a counting frame does:
     view.js watches `thing.base` and builds the rig again when it changes, which
     it must, because a base-five table is a different size of board. */
  const max = tableMax(base);
  const n = max + 1; // a header line, then 1…max
  return {
    kind: "board", variant, tag: null, x: 0, z: 0, angle: 0,
    base, max,
    l: n * CELL, w: n * CELL, h: SLAB,
    hidden: [],          // "r,c" of cells blanked for practice
    focus: null,         // { r, c } lit row and column
  };
}

/**
 * Move a table to another base. Every product on it is rewritten, and the board
 * itself changes size — in base five there are four rows, in base twelve eleven.
 *
 * The place-value chart does not come here: it relabels its columns in the new
 * base without changing shape, so a repaint is all it needs.
 */
export function rebaseBoard(thing, base) {
  if (thing.variant === "place" || thing.base === base) return false;
  const max = tableMax(base);
  thing.base = base;
  thing.max = max;
  const n = max + 1;
  thing.l = n * CELL;
  thing.w = n * CELL;
  /* A square that no longer exists cannot stay hidden, and a row lit off the
     end of the table would light nothing at all. */
  thing.hidden = (thing.hidden || []).filter((key) => {
    const [r, c] = key.split(",").map(Number);
    return r <= max && c <= max;
  });
  const f = thing.focus;
  if (f && ((f.r || 0) > max || (f.c || 0) > max)) thing.focus = null;
  return true;
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
     (the place-value chart is 2016 × 714) comes out black with them on.

     One scale for both sides, never a per-side cap: the counter layout is worked
     out in cells and drawn in pixels, and those two only agree while a cell is
     the same number of pixels across as it is deep. */
  const k = Math.min(42, 2048 / thing.l, 2048 / thing.w);
  const px = Math.round(thing.l * k);
  const py = Math.round(thing.w * k);
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
  const reading = opts.reading || { counts: {}, strays: 0, total: 0 };
  const counters = countersOf(thing);
  const order = placeOrder(thing);          // biggest place first, left to right
  const k = W / thing.l;                    // pixels per cell (both ways alike)
  const trayH = TRAY * k;
  const headH = HEAD * k;
  const gutW = GUT * k;
  const colW = COL * k;

  drawGutter(g, gutW, H, thing, k, c);

  for (let i = 0; i < order.length; i++) {
    const p = order[i];
    const x = gutW + i * colW;
    const hex = colourOfPlace(p);

    /* the tray: one spare counter per column, sitting over its own place, ready
       to be dragged down into it */
    g.fillStyle = rgba(c.ink, 0.05);
    g.fillRect(x, 0, colW, trayH);
    dot(g, x + colW / 2, trayH / 2, Math.min(trayH, colW) * 0.3, hex, c.ink, 0.5);

    g.fillStyle = tint(hex, 0.9);
    g.fillRect(x, trayH, colW, headH);

    g.fillStyle = "#2a2723";
    g.font = `700 ${Math.round(headH * 0.3)}px Unbounded, system-ui, sans-serif`;
    g.fillText(fit(g, p.plural, colW * 0.92), x + colW / 2, trayH + headH * 0.32);
    g.font = `600 ${Math.round(headH * 0.2)}px "JetBrains Mono", monospace`;
    g.fillText(`${worthOf(p.power, base)}  ·  ${base}^${p.power}`,
      x + colW / 2, trayH + headH * 0.66);

    // the count in this column, written faintly behind its counters
    const areaY = trayH + headH;
    const areaH = H - areaY;
    const n = reading.counts[p.id] || 0;
    g.fillStyle = c.ink;
    g.font = `900 ${Math.round(headH * 0.62)}px Unbounded, system-ui, sans-serif`;
    g.globalAlpha = n ? 0.13 : 0.06;
    g.fillText(String(n), x + colW / 2, areaY + areaH / 2);
    g.globalAlpha = 1;

    /* A column holding `base` counters or more is one trade away from being a
       digit; say so on the column itself rather than only in the toast. */
    const held = counters[i] || 0;
    if (held >= base) {
      g.fillStyle = tint(cssVar("--accent-warning", "#f0a868"), 0.22);
      g.fillRect(x, areaY, colW, areaH);
    }
    for (const s of counterSpots(held, x, areaY, colW, areaH)) {
      dot(g, s.cx, s.cy, s.r, hex, c.ink, 1);
    }
  }

  g.strokeStyle = rgba(c.ink, 0.5);
  g.lineWidth = 4;
  g.beginPath();
  for (let i = 0; i <= order.length; i++) {
    const x = gutW + i * colW;
    g.moveTo(x, 0); g.lineTo(x, H);
  }
  g.moveTo(gutW, trayH); g.lineTo(W, trayH);
  g.moveTo(gutW, trayH + headH); g.lineTo(W, trayH + headH);
  g.stroke();
  g.strokeRect(2, 2, W - 4, H - 4);
}

/**
 * The + and − that make the chart wider or narrower, down its left edge.
 * Two hairline glyphs and nothing else — no panel, no rule, no fill: the whole
 * point of the gutter is to be there when you look for it and invisible when
 * you are not.
 */
function drawGutter(g, gutW, H, thing, k, c) {
  const s = gutW * 0.19;
  const arm = (cy, minus) => {
    g.strokeStyle = rgba(c.ink, 0.45);
    g.lineWidth = Math.max(2, gutW * 0.035);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(gutW / 2 - s, cy); g.lineTo(gutW / 2 + s, cy);
    if (!minus) { g.moveTo(gutW / 2, cy - s); g.lineTo(gutW / 2, cy + s); }
    g.stroke();
  };
  arm(H * 0.25, false);                       // grow: a bigger place on the left
  g.globalAlpha = thing.places > MIN_PLACES ? 1 : 0.22;
  arm(H * 0.75, true);                        // shrink, if the column is empty
  g.globalAlpha = 1;
}

function dot(g, cx, cy, r, hex, ink, alpha) {
  g.globalAlpha = alpha;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = hex;
  g.fill();
  g.lineWidth = Math.max(2, r * 0.18);
  g.strokeStyle = rgba(ink, 0.55);
  g.stroke();
  g.globalAlpha = 1;
}

/** Shrink a label until it fits the column it is written across. */
function fit(g, text, max) {
  if (g.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 4 && g.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}

/** A place's colour — the same three, repeating with the periods. */
function colourOfPlace(p) {
  return placeColour(p.power);
}

const PER_ROW = 5; // counters read at a glance in fives, the way a tally does

/**
 * Where the dots in one column sit, in whatever units the rect is given in.
 * ONE function for drawing and for hit-testing: the moment those two disagree
 * you can see a counter you cannot pick up.
 *
 * Laid out in rows of five, centred in the column, shrinking to fit however
 * many there are — so a column holds thirty without any leaving the paper.
 */
export function counterSpots(n, x0, y0, w, h) {
  const out = [];
  if (!n) return out;
  const perRow = Math.min(PER_ROW, n);
  const rows = Math.ceil(n / perRow);
  const cell = Math.min(w / (perRow + 0.6), h / (rows + 0.6));
  const r = Math.min(cell * 0.36, w * 0.11);
  const startY = y0 + (h - rows * cell) / 2;

  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow);
    // the last row is centred under the full ones above it
    const inRow = Math.min(perRow, n - row * perRow);
    const rowX = x0 + (w - inRow * cell) / 2;
    out.push({
      cx: rowX + (i % perRow) * cell + cell / 2,
      cy: startY + row * cell + cell / 2,
      r,
    });
  }
  return out;
}

/** The chart's columns, biggest place first — the way a number is written. */
export function placeOrder(thing) {
  const n = thing.places || PLACES.length;
  return Array.from({ length: n }, (_, i) => placeAt(n - 1 - i));
}

/** Keep the counter list the same length as the chart is wide. */
function countersOf(thing) {
  const n = thing.places || (thing.places = PLACES.length);
  if (!Array.isArray(thing.counters)) thing.counters = [];
  while (thing.counters.length < n) thing.counters.unshift(0);
  while (thing.counters.length > n) thing.counters.shift();
  return thing.counters;
}

function drawTable(g, W, H, thing, opts, c) {
  const base = thing.base || opts.base || 10;
  const n = maxOf(thing) + 1;
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

      /* Written in the working base, headings and products alike — in base five
         three fours is 22, and the table only teaches that if it says so. */
      let text = "";
      if (r === 0 && col === 0) text = divide ? "÷" : "×";
      else if (r === 0) text = toBase(col, base);
      else if (col === 0) text = toBase(r, base);
      else if (!hidden.has(r + "," + col)) text = toBase(r * col, base);

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
 * What is under a point on the place-value chart.
 * `uv` is Babylon's texture coordinate: u across, v UP from the bottom — so a
 * cell measured down from the top of the face is `(1 - v) * thing.w`.
 *
 * Returns a zone, the column it belongs to (null in the gutter) and, in the
 * counter area, the index of the counter the point landed on (−1 for bare
 * paper). The counter index comes from `counterSpots`, the same function that
 * draws them, so what you can see is exactly what you can pick up.
 */
export function hitPlace(thing, uv) {
  const xc = uv.x * thing.l;
  const yc = (1 - uv.y) * thing.w;
  const n = thing.places || PLACES.length;

  if (xc < GUT) {
    return { zone: yc < thing.w / 2 ? "grow" : "shrink", col: null, index: -1 };
  }
  const col = Math.min(n - 1, Math.max(0, Math.floor((xc - GUT) / COL)));
  if (yc < TRAY) return { zone: "tray", col, index: -1 };
  if (yc < TRAY + HEAD) return { zone: "head", col, index: -1 };

  const x0 = GUT + col * COL;
  const y0 = TRAY + HEAD;
  const held = countersOf(thing)[col] || 0;
  const spots = counterSpots(held, x0, y0, COL, AREA);
  let index = -1;
  for (let i = spots.length - 1; i >= 0; i--) {
    const s = spots[i];
    const dx = xc - s.cx;
    const dy = yc - s.cy;
    // a shade wider than the dot looks, so a fingertip does not have to be exact
    if (dx * dx + dy * dy <= (s.r * 1.35) ** 2) { index = i; break; }
  }
  return { zone: "area", col, index };
}

/**
 * A tap on the place-value chart. Bare paper in a column drops a counter in it,
 * a counter takes itself back out, the heading trades a full column for one
 * counter in the place to its left, and the gutter makes the chart wider or
 * narrower.
 */
export function tapPlace(thing, uv, base, { remove = false } = {}) {
  const hit = hitPlace(thing, uv);
  if (hit.zone === "grow") return growChart(thing);
  if (hit.zone === "shrink") return shrinkChart(thing);

  const order = placeOrder(thing);
  const i = hit.col;
  const p = order[i];
  const counters = countersOf(thing);

  if (hit.zone === "head") return tradeUp(thing, i, base);
  if (hit.zone === "tray") {
    if (counters[i] >= MAX_DOTS) return full(p);
    counters[i] += 1;
    return { changed: true, message: held(counters[i], p, i, order, base) };
  }

  // in the counter area: a counter takes itself away, bare paper adds one
  if (remove || hit.index >= 0) {
    if (!counters[i]) return { changed: false, message: `No ${p.plural.toLowerCase()} to take away.` };
    counters[i] -= 1;
    return { changed: true, message: `Took one ${p.label.toLowerCase()} away — ${counters[i]} left.` };
  }
  if (counters[i] >= MAX_DOTS) return full(p);
  counters[i] += 1;
  return { changed: true, message: held(counters[i], p, i, order, base) };
}

function full(p) {
  return { changed: false, message: `A column holds ${MAX_DOTS} ${p.plural.toLowerCase()} at most — trade some up.` };
}

function held(n, p, i, order, base) {
  if (n >= base && i > 0) {
    return `${n} ${p.plural.toLowerCase()} — tap the heading to trade ${base} of them for one ${order[i - 1].label.toLowerCase()}.`;
  }
  return `${n} ${n === 1 ? p.label.toLowerCase() : p.plural.toLowerCase()}.`;
}

/** Trade `base` counters in column `i` for one in the place to its left. */
function tradeUp(thing, i, base) {
  const order = placeOrder(thing);
  const counters = countersOf(thing);
  const p = order[i];
  if (i === 0) {
    return {
      changed: false,
      message: `${p.plural} is the biggest place on this chart — press + on the left edge to add another.`,
    };
  }
  if (counters[i] < base) {
    return {
      changed: false,
      message: `${base} ${p.plural.toLowerCase()} make one ${order[i - 1].label.toLowerCase()} — this column has ${counters[i]}.`,
    };
  }
  counters[i] -= base;
  counters[i - 1] += 1;
  return {
    changed: true,
    message: `Traded ${base} ${p.plural.toLowerCase()} for one ${order[i - 1].label.toLowerCase()}.`,
  };
}

/* ── growing and shrinking the chart ──────────────────────────────────────── */

export function growChart(thing) {
  const n = thing.places || PLACES.length;
  if (n >= MAX_PLACES) {
    return { changed: false, message: `${MAX_PLACES} places is as wide as this chart goes.` };
  }
  // normalise the list against the OLD width first, or countersOf pads it and
  // the unshift below adds a second empty column nobody asked for
  countersOf(thing).unshift(0);
  thing.places = n + 1;
  Object.assign(thing, chartSize(thing.places));
  /* The new column is drawn on the LEFT, so the chart grows leftwards too —
     otherwise every column already on it slides sideways under the counters. */
  thing.x -= COL;
  return {
    changed: true, rebuilt: true,
    message: `Added a column — ${placeAt(thing.places - 1).plural.toLowerCase()}.`,
  };
}

export function shrinkChart(thing) {
  const n = thing.places || PLACES.length;
  const counters = countersOf(thing);
  if (n <= MIN_PLACES) {
    return { changed: false, message: `A chart needs at least ${MIN_PLACES} places.` };
  }
  if (counters[0]) {
    return {
      changed: false,
      message: `Empty the ${placeOrder(thing)[0].plural.toLowerCase()} column before taking it away.`,
    };
  }
  counters.shift();
  thing.places = n - 1;
  Object.assign(thing, chartSize(thing.places));
  thing.x += COL;
  return { changed: true, rebuilt: true, message: "Took a column off the chart." };
}

/* ── moving a counter from one place to another ───────────────────────────── */

/**
 * Drag a counter between columns. Going DOWN a place a counter breaks into as
 * many of the smaller place as it is worth — one flat becomes ten rods — and
 * going UP it takes that many to make one. That exchange is the chart's whole
 * job, so it is done by the same arithmetic in both directions.
 *
 * `from` and `to` are column indices; `from` may be null, meaning the tray.
 */
export function moveCounter(thing, from, to, base) {
  const order = placeOrder(thing);
  const counters = countersOf(thing);
  const dst = order[to];

  if (from === null) {
    if (counters[to] >= MAX_DOTS) return full(dst);
    counters[to] += 1;
    return { changed: true, message: held(counters[to], dst, to, order, base) };
  }
  if (from === to) return { changed: false, message: null };

  const src = order[from];
  if (!counters[from]) {
    return { changed: false, message: `No ${src.plural.toLowerCase()} to move.` };
  }

  const step = Math.abs(src.power - dst.power);
  const many = Math.pow(base, step);

  if (src.power > dst.power) {
    // one of the bigger place breaks into `many` of the smaller
    if (counters[to] + many > MAX_DOTS) {
      return {
        changed: false,
        message: `One ${src.label.toLowerCase()} is ${many} ${dst.plural.toLowerCase()} — more than a column holds.`,
      };
    }
    counters[from] -= 1;
    counters[to] += many;
    return {
      changed: true,
      message: `One ${src.label.toLowerCase()} broke into ${many} ${dst.plural.toLowerCase()}.`,
    };
  }

  // going up: it takes `many` of the smaller place to make one of the bigger
  if (counters[from] < many) {
    return {
      changed: false,
      message: `It takes ${many} ${src.plural.toLowerCase()} to make one ${dst.label.toLowerCase()} — there ${counters[from] === 1 ? "is" : "are"} ${counters[from]}.`,
    };
  }
  if (counters[to] >= MAX_DOTS) return full(dst);
  counters[from] -= many;
  counters[to] += 1;
  return {
    changed: true,
    message: `${many} ${src.plural.toLowerCase()} made one ${dst.label.toLowerCase()}.`,
  };
}

/** A counter dragged clear of the chart is thrown away. */
export function dropCounter(thing, from) {
  const counters = countersOf(thing);
  if (from === null) return { changed: false, message: null }; // a tray dot: nothing taken
  if (!counters[from]) return { changed: false, message: null };
  counters[from] -= 1;
  const p = placeOrder(thing)[from];
  return { changed: true, message: `Threw one ${p.label.toLowerCase()} away.` };
}

/** The colour a counter in a column wears — for the ghost that follows a drag. */
export function counterColour(thing, col) {
  return colourOfPlace(placeOrder(thing)[col]);
}

export function tapBoard(thing, uv, base) {
  if (thing.variant === "place") return { changed: false };
  const b = thing.base || base || 10;
  const n = maxOf(thing) + 1;
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
  /* Away from base ten the fact is worth saying twice — once the way the table
     writes it, once in the tens the learner already counts in. */
  const tail = b === 10 ? "" : ` — ${product} in tens.`;
  const say = (a, op, c2, d) =>
    `${toBase(a, b)} ${op} ${toBase(c2, b)} = ${toBase(d, b)}${tail}`;
  if (thing.variant === "divide") return { changed: true, message: say(product, "÷", r, col) };
  return { changed: true, message: say(r, "×", col, product) };
}

/** Blank a cell out for practice (or bring it back). */
export function toggleCell(thing, uv) {
  if (thing.variant === "place") return false;
  const n = maxOf(thing) + 1;
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

  /* Counters first: a counter in a column IS one of that place, so it counts
     towards the digit exactly as a block standing there would. */
  const order = placeOrder(thing);
  const counters = countersOf(thing);
  for (let i = 0; i < order.length; i++) {
    const n = counters[i] || 0;
    if (!n) continue;
    const p = order[i];
    counts[p.id] = (counts[p.id] || 0) + n;
    total += n * worthOf(p.power, base);
  }

  for (const b of blocks) {
    const cx = b.x + b.l / 2;
    const cz = b.z + b.w / 2;
    if (cx < thing.x || cx > thing.x + thing.l) continue;
    if (cz < thing.z || cz > thing.z + thing.w) continue;
    // the gutter is not a place — a block parked on it is not standing anywhere
    if (cx - thing.x < GUT) continue;

    const col = Math.min(order.length - 1, Math.floor((cx - thing.x - GUT) / COL));
    const place = order[col];
    counts[place.id] = (counts[place.id] || 0) + 1;
    total += b.l * b.w * b.h;
    if (placeOf(b, base) !== place.id) wrong.push(b);
  }

  const digits = order.map((p) => counts[p.id] || 0);
  const tidy = digits.every((d) => d < base) && !wrong.length;
  return { counts, digits, strays: wrong.length, total, tidy };
}

export function placeSentence(reading, base) {
  if (!reading.total) return "Tap a column to drop a counter in it, or stand blocks in the columns.";
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
