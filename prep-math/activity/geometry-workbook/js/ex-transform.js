/* ============================================================================
   Geometry Workbook — CHAPTER 5: 2D transformations
   ----------------------------------------------------------------------------
   Reflection, rotation and scaling — in that order, as asked — with a short
   way in and a way out:

     0. what a transformation is     object and image, A → A′; congruent
                                     (same shape, same size) and similar
                                     (same shape, a different size)
     1. reflection                   complete a symmetrical picture · reflect
                                     a shape in a mirror line · reflect points
                                     · the rules for the axes and y = ±x ·
                                     find the mirror line
     2. rotation                     which way is it facing after a turn ·
                                     rotate a shape about a centre · the rules
                                     about the origin · describe a rotation ·
                                     rotational symmetry
     3. scaling (enlargement)        find the scale factor · enlarge a shape ·
                                     enlarge from a centre · coordinates from
                                     the origin · what happens to lengths,
                                     perimeter, angles and area · find the
                                     centre
     4. describe it fully            which transformation, and everything
                                     needed to do it again

   Everything happens on squared paper and every corner is on a crossing, so
   an image is found by COUNTING SQUARES — across and up from the mirror, the
   centre of the turn, the centre of the enlargement — which is the method
   the book wants, and the one that works in an exam with no tracing paper.
   The rules with coordinates come after the counting, as a shortcut for what
   the counting always does.

   By level. Gentle: upright and flat mirror lines, the axes, half and
   quarter turns about a corner or the origin, scale factors 2 and 3.
   Middle: the diagonal mirror y = x, turns about any point, scale factor 4
   and a half. Stretch: y = −x, finding a centre that is not marked, scale
   factors ½, ⅓ and 1½.
   ========================================================================== */

import {
  reflect, rotate, enlarge, lineName, lineForms, num, pt, frame, boundsOf, tfGrid, edgesRuled, edgesOf, miniShape,
} from "./transform.js";
import { levelOf, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const small = () => `<span class="wb-answer gw-num"></span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const coord = (label) => `<span class="wb-slot"><em>${label}</em>(&nbsp;${small()},&nbsp;${small()})</span>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;
const worked = (tag, body) => `<div class="wb-worked"><p class="wb-worked__tag">${tag}</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const line = () => `<span class="wb-line wb-line--md"></span>`;

const tier = (o) => levelOf(o).id;
const at = (o, list) => list[{ gentle: 0, middle: 1, stretch: 2 }[tier(o)] ?? 0];
const NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];
const PRIMES = NAMES.map((n) => `${n}′`);
const MAX_CELLS = 14; // a grid wider than this does not fit half a page

/* ── shapes ────────────────────────────────────────────────────────────────
   None of them has a line of symmetry or turns onto itself — checked, not
   judged by eye: an L with equal arms is symmetric about its diagonal, and
   then its mirror image IS a turn of it, so "was it flipped or turned?" has
   no answer. */
const SHAPES = [
  [[0, 0], [2, 0], [0, 3]],
  [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]],
  [[0, 0], [3, 0], [2, 2], [0, 2]],
  [[0, 0], [2, 0], [2, 1], [3, 1], [3, 2], [0, 2]],
  [[0, 0], [3, 0], [1, 2]],
];
const SMALL_SHAPES = [
  [[0, 0], [2, 0], [0, 1]],
  [[0, 0], [2, 0], [2, 1], [0, 2]],
  [[0, 0], [2, 0], [1, 1], [0, 1]],
  [[0, 0], [1, 0], [0, 2]],
];

const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
const minXY = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))];
const extent = (pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
};
const scale = (pts, k) => pts.map(([x, y]) => [x * k, y * k]);
const fits = (b) => b[1] - b[0] <= MAX_CELLS && b[3] - b[2] <= MAX_CELLS;

/** A shape from `bank`, turned a random number of quarter turns and maybe
    flipped, with its lowest-left corner at the origin. */
function oriented(r, bank = SHAPES) {
  let q = r.pick(bank);
  const turns = r.int(0, 3);
  for (let t = 0; t < turns; t++) q = q.map(([x, y]) => [-y, x]);
  if (r.chance(0.5)) q = q.map(([x, y]) => [-x, y]);
  const [mx, my] = minXY(q);
  return shift(q, -mx, -my);
}

const drawKey = (item, says) => want.draw({
  says,
  check: (lines, fig) => edgesRuled(edgesOf(item.image, !!item.open), lines, fig, frame(...item.bounds)),
});

/** A scale factor as it is written: 2, ½, 1½. */
const kName = (k) => (k === 0.5 ? "½" : Math.abs(k - 1 / 3) < 1e-9 ? "⅓" : k === 1.5 ? "1½" : String(k));
const kForms = (k) => (Number.isInteger(k) ? null
  : k === 0.5 ? ["1/2", "0.5", "½", "a half"] : Math.abs(k - 1 / 3) < 1e-9 ? ["1/3", "⅓", "0.33", "0.333"]
    : k === 1.5 ? ["1.5", "3/2", "1½", "1 1/2"] : k === 0.25 ? ["1/4", "0.25", "¼"] : k === 1 / 9 ? ["1/9"] : k === 2.25 ? ["2.25", "9/4", "2¼", "2 1/4"] : [String(k)]);
const kWant = (k) => (Number.isInteger(k) ? want.num(k) : want.text(...kForms(k)));

/** What a turn is called. */
const turnName = (deg) => ({ 90: "90° anticlockwise", "-90": "90° clockwise", 180: "180° (a half turn)", 270: "270° anticlockwise", "-270": "270° clockwise" }[deg] || `${deg}°`);

/* ── the groups ────────────────────────────────────────────────────────────*/

export const TF_GROUPS = [
  { id: "tf-intro", chapter: "Chapter 5 · 2D transformations", label: "What a transformation is" },
  { id: "tf-reflect", label: "Reflection" },
  { id: "tf-rotate", label: "Rotation" },
  { id: "tf-scale", label: "Scaling (enlargement)" },
  { id: "tf-describe", label: "Describe the transformation" },
];

/* ═══ 0. what a transformation is ══════════════════════════════════════════*/

const dealSame = dealer();
const tfSame = {
  id: "tf-same",
  group: "tf-intro",
  label: "Congruent, similar or neither?",
  blurb: "Object and image: the same shape and size, the same shape bigger, or a different shape.",
  heading: "Same shape? Same size?",
  instruction: () =>
    "A transformation moves or changes a shape. The shape you start with is the OBJECT; where it " +
    "ends up is the IMAGE (its corners get a dash: A becomes A′). If the image is exactly the same " +
    "shape and size — only moved, turned or flipped — the two are CONGRUENT. If it is the same " +
    "shape but bigger or smaller, they are SIMILAR. Tick which the blue image is.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const kind = dealSame(r, ["congruent", "similar", "neither"], i);
    const obj = oriented(r, SMALL_SHAPES);
    let img;
    if (kind === "congruent") {
      img = r.chance(0.5) ? obj.map(([x, y]) => [-x, y]) : obj.map(([x, y]) => [-y, x]);
    } else if (kind === "similar") {
      img = scale(obj, 2);
    } else {
      img = r.chance(0.5) ? obj.map(([x, y]) => [2 * x, y]) : obj.map(([x, y]) => [x, 2 * y]);
    }
    const [mx, my] = minXY(img);
    img = shift(img, extent(obj)[0] + 2 - mx, -my);
    return { kind, obj, img, bounds: boundsOf([...obj, ...img]) };
  },
  render(item) {
    return art(tfGrid({ bounds: item.bounds, shapes: [{ pts: item.obj }, { pts: item.img, image: true }] })) +
      tick("congruent", "similar", "neither");
  },
  worked() {
    const obj = [[0, 0], [2, 0], [0, 1]];
    const img = shift(scale(obj, 2), 4, 0);
    return worked("One done for you", side(
      art(tfGrid({ bounds: boundsOf([...obj, ...img]), shapes: [{ pts: obj, names: ["A", "B", "C"] }, { pts: img, image: true, names: ["A′", "B′", "C′"] }] })),
      say("The blue image is the same shape as the object, but every side is twice as long. Same " +
        "shape, different size: they are <b>similar</b>. A reflection or a rotation would have kept " +
        "it the same size — congruent.")));
  },
  key(item) {
    return [want.tick(["congruent", "similar", "neither"].indexOf(item.kind))];
  },
  answer(item) {
    return [{ congruent: "congruent — same shape, same size", similar: "similar — same shape, bigger", neither: "neither — stretched one way only, so a different shape" }[item.kind]];
  },
};

/* ═══ 1. reflection ════════════════════════════════════════════════════════*/

const tfSym = {
  id: "tf-sym",
  group: "tf-reflect",
  label: "Complete the symmetrical picture",
  blurb: "Half a picture and a mirror line. Draw the other half, square for square.",
  heading: "Draw the other half",
  instruction: () =>
    "The dashed red line is a MIRROR LINE (a line of symmetry). Every corner of the picture has a " +
    "partner on the other side, exactly as far from the line, straight across. Count the squares " +
    "from the line to each corner, count the same on the other side, and join up.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const h = r.int(3, at(o, [5, 6, 7]));
    const n = r.int(2, 3);
    const half = [[0, 0]];
    for (let j = 1; j <= n; j++) half.push([-r.int(1, at(o, [3, 4, 4])), Math.round((j * h) / (n + 1))]);
    half.push([0, h]);
    const across = r.chance(0.5);
    const L = across ? { k: "y", v: 0 } : { k: "x", v: 0 };
    const obj = across ? half.map(([x, y]) => [y, -x]) : half;
    const image = obj.map((p) => reflect(p, L));
    return { obj, image, open: true, L, bounds: boundsOf([...obj, ...image]) };
  },
  render(item) {
    return art(tfGrid({ bounds: item.bounds, shapes: [{ pts: item.obj, open: true }], lines: [{ L: item.L, name: "mirror line" }] }));
  },
  worked() {
    const obj = [[0, 0], [-2, 1], [-1, 3], [0, 4]];
    const L = { k: "x", v: 0 };
    const img = obj.map((p) => reflect(p, L));
    return worked("One done for you", side(
      art(tfGrid({ bounds: boundsOf([...obj, ...img]), shapes: [{ pts: obj, open: true }, { pts: img, open: true, image: true }], lines: [{ L, name: "mirror line" }] })),
      say("The corner 2 squares to the left of the line has a partner 2 squares to the right; the one " +
        "1 square left has a partner 1 square right, at the same height. Join them in the same order " +
        "and the picture is symmetrical.")));
  },
  key(item) {
    return [drawKey(item, "the same shape on the other side, each corner the same number of squares from the line")];
  },
  answer() {
    return ["the mirror image of the half, each corner the same distance from the line"];
  },
};

/** The mirror lines a level uses, through the origin of the shape's grid. */
const MIRRORS = [
  [{ k: "x", v: 0 }, { k: "y", v: 0 }],
  [{ k: "x", v: 0 }, { k: "y", v: 0 }, { k: "d", s: 1 }],
  [{ k: "x", v: 0 }, { k: "y", v: 0 }, { k: "d", s: 1 }, { k: "d", s: -1 }],
];

/** A shape wholly on one side of mirror L (touching it only at Stretch). */
function besideMirror(r, o, L) {
  const gap = tier(o) === "stretch" ? r.int(0, 2) : r.int(1, 2);
  for (let g = 0; g < 60; g++) {
    let obj = oriented(r);
    const [w, h] = extent(obj);
    if (L.k === "x") obj = shift(obj, -w - gap, -r.int(0, h));
    else if (L.k === "y") obj = shift(obj, -r.int(0, w), gap);
    else {
      obj = shift(obj, -r.int(1, 3), r.int(0, 2));
      /* above y = x (y − x ≥ gap), or above y = −x (x + y ≥ gap) */
      const lo = Math.min(...obj.map(([x, y]) => (L.s === 1 ? y - x : x + y)));
      obj = shift(obj, 0, gap - lo);
    }
    const image = obj.map((p) => reflect(p, L));
    const bounds = boundsOf([...obj, ...image, [0, 0]]);
    if (fits(bounds)) return { obj, image, bounds };
  }
  const obj = [[-3, 0], [-1, 0], [-3, 2]];
  return { obj, image: obj.map((p) => reflect(p, { k: "x", v: 0 })), bounds: boundsOf([...obj, [3, 0]]) };
}

const tfReflectDraw = {
  id: "tf-reflect-draw",
  group: "tf-reflect",
  label: "Reflect the shape",
  blurb: "Corner by corner: count to the mirror line, count the same past it.",
  heading: "Reflect the shape in the mirror line",
  instruction: (o) =>
    "Take one corner at a time. Count how many squares it is from the mirror line, going straight " +
    "towards the line (at right angles to it). Count the same number of squares past the line and " +
    "mark the image corner. Do every corner, then join them in the same order." +
    (tier(o) !== "gentle" ? " For a sloping mirror, go diagonally across the squares, corner to corner." : ""),
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const L = r.pick(at(o, MIRRORS));
    return { L, ...besideMirror(r, o, L) };
  },
  render(item) {
    return art(tfGrid({ bounds: item.bounds, shapes: [{ pts: item.obj, names: NAMES }], lines: [{ L: item.L, name: "mirror line" }] }));
  },
  worked() {
    const L = { k: "x", v: 0 };
    const obj = [[-3, 0], [-1, 0], [-3, 2]];
    const img = obj.map((p) => reflect(p, L));
    return worked("One done for you", side(
      art(tfGrid({ bounds: boundsOf([...obj, ...img]), shapes: [{ pts: obj, names: NAMES }, { pts: img, image: true, names: PRIMES }], lines: [{ L, name: "mirror line" }] })),
      say("A is 3 squares left of the mirror, so A′ is 3 squares right of it. B is 1 square left, so " +
        "B′ is 1 square right. The image is the same size, but it faces the other way — a " +
        "reflection flips a shape over.")));
  },
  key(item) {
    return [drawKey(item, "every corner the same distance past the mirror line")];
  },
  answer(item) {
    return [`the shape flipped over ${item.L.k === "d" ? "the sloping line" : "the line"}, each corner as far past it as it was in front`];
  },
};

/** Points on the axes grid and their images in L, all on the paper. */
function mirrorPoints(r, o, L, n, R = 5) {
  const out = [];
  for (let g = 0; g < 400 && out.length < n; g++) {
    const p = [r.int(-R + 1, R - 1), r.int(-R + 1, R - 1)];
    const q = reflect(p, L);
    const on = q[0] === p[0] && q[1] === p[1];
    if (Math.max(...q.map(Math.abs)) > R - 1) continue;
    if (on && (tier(o) === "gentle" || out.some((u) => u.on))) continue;
    if (out.some((u) => u.p[0] === p[0] && u.p[1] === p[1])) continue;
    out.push({ p, q, on });
  }
  return out;
}

const tfReflectPts = {
  id: "tf-reflect-pts",
  group: "tf-reflect",
  label: "Reflect points on the axes",
  blurb: "Plot, count across the line, read the new coordinates — and a point on the line stays put.",
  heading: "Reflect each point in the mirror line",
  instruction: () =>
    "Coordinates are (across, up) — (3, −2) is 3 to the right of 0 and 2 down. For each point, count " +
    "straight to the mirror line and the same again past it, and write the coordinates of the image. " +
    "A point ON the mirror line does not move: its image is itself (an 'invariant' point).",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const L = tier(o) === "gentle" ? r.pick([{ k: "x", v: 0 }, { k: "y", v: 0 }])
      : tier(o) === "middle" ? r.pick([{ k: "x", v: r.pick([-2, -1, 1, 2]) }, { k: "y", v: r.pick([-2, -1, 1, 2]) }])
        : r.pick([{ k: "d", s: 1 }, { k: "d", s: -1 }]);
    return { L, pts: mirrorPoints(r, o, L, 3) };
  },
  render(item) {
    const fig = tfGrid({
      bounds: [-5, 5, -5, 5], axes: true, lines: [{ L: item.L }],
      points: item.pts.map((u, j) => ({ p: u.p, name: NAMES[j], col: "#2a2723" })),
    });
    return side(art(fig), item.pts.map((u, j) => ask(`${NAMES[j]} ${pt(u.p)} → ${coord(PRIMES[j])}`)).join(""));
  },
  worked() {
    return worked("One done for you", say(
      "Mirror line x = 1 (upright, through 1 on the x-axis). A (3, 2) is 2 squares to the right of the " +
      "line, so A′ is 2 squares to the left: <b>(−1, 2)</b>. The height stays the same — a mirror " +
      "that stands up only changes the across."));
  },
  key(item) {
    return item.pts.flatMap((u) => [want.num(u.q[0]), want.num(u.q[1])]);
  },
  answer(item) {
    return [`in ${lineName(item.L)}: ` + item.pts.map((u, j) => `${PRIMES[j]} ${pt(u.q)}${u.on ? " (on the line — it stays)" : ""}`).join(", ")];
  },
};

const RULE_LINES = [
  [{ k: "y", v: 0, say: "the x-axis" }, { k: "x", v: 0, say: "the y-axis" }],
  [{ k: "y", v: 0, say: "the x-axis" }, { k: "x", v: 0, say: "the y-axis" }, { k: "d", s: 1, say: "the line y = x" }],
  [{ k: "y", v: 0, say: "the x-axis" }, { k: "x", v: 0, say: "the y-axis" }, { k: "d", s: 1, say: "the line y = x" }, { k: "d", s: -1, say: "the line y = −x" }],
];

const tfReflectRule = {
  id: "tf-reflect-rule",
  group: "tf-reflect",
  label: "The rules for reflecting",
  blurb: "In the x-axis the y changes sign; in the y-axis the x does; in y = x they swap.",
  heading: "Reflect without drawing",
  instruction: (o) =>
    "The shortcuts. Reflect in the x-axis: (x, y) → (x, −y) — the across stays, the up changes " +
    "sign. In the y-axis: (x, y) → (−x, y)." + (tier(o) !== "gentle" ? " In the line y = x: (x, y) → (y, x) — they swap." : "") +
    (tier(o) === "stretch" ? " In y = −x: (x, y) → (−y, −x) — they swap and both change sign." : "") +
    " If you are not sure, sketch the axes and count.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const L = r.pick(at(o, RULE_LINES));
    const pts = [];
    while (pts.length < 4) {
      const p = [r.int(-6, 6), r.int(-6, 6)];
      if (p[0] === 0 || p[1] === 0 || p[0] === p[1] || pts.some((u) => u[0] === p[0] && u[1] === p[1])) continue;
      pts.push(p);
    }
    return { L, pts };
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead">Reflect in ${item.L.say}.</p>` +
      item.pts.map((p) => ask(`${pt(p)} → (&nbsp;${small()},&nbsp;${small()})`)).join("");
  },
  worked() {
    return worked("The four rules", say(
      "x-axis: (3, 2) → (3, −2). y-axis: (3, 2) → (−3, 2). y = x: (3, 2) → (2, 3). " +
      "y = −x: (3, 2) → (−2, −3). Check one by plotting it: the rule is only a quick way of counting."));
  },
  key(item) {
    return item.pts.flatMap((p) => reflect(p, item.L).map((v) => want.num(v)));
  },
  answer(item) {
    return [item.pts.map((p) => `${pt(p)} → ${pt(reflect(p, item.L))}`).join(", ")];
  },
};

/** An object and its image on the axes grid, wholly on the paper. */
function onAxes(r, o, make, R = 5) {
  for (let g = 0; g < 300; g++) {
    const obj = shift(oriented(r, SMALL_SHAPES), r.int(-R + 1, R - 3), r.int(-R + 1, R - 3));
    const res = make(obj);
    if (!res) continue;
    const all = [...obj, ...res.image, ...(res.extra || [])];
    if (all.every(([x, y]) => Math.abs(x) <= R - 1 && Math.abs(y) <= R - 1)) return { obj, ...res };
  }
  return null;
}

const FIND_LINES = [
  (r) => r.pick([{ k: "x", v: r.int(-2, 2) }, { k: "y", v: r.int(-2, 2) }]),
  (r) => r.pick([{ k: "x", v: r.int(-2, 2) }, { k: "y", v: r.int(-2, 2) }, { k: "d", s: 1 }]),
  (r) => r.pick([{ k: "x", v: r.int(-2, 2) }, { k: "y", v: r.int(-2, 2) }, { k: "d", s: 1 }, { k: "d", s: -1 }]),
];

/** Is every corner of obj strictly on one side of L? */
const oneSide = (obj, L) => {
  const side = ([x, y]) => (L.k === "x" ? x - L.v : L.k === "y" ? y - L.v : L.s === 1 ? y - x : y + x);
  const s = obj.map(side);
  return s.every((v) => v > 0) || s.every((v) => v < 0);
};

const tfMirrorFind = {
  id: "tf-mirror-find",
  group: "tf-reflect",
  label: "Find the mirror line",
  blurb: "Halfway between each corner and its image — then name the line.",
  heading: "Where is the mirror line?",
  instruction: () =>
    "The mirror line is exactly halfway between every corner and its image. Find the halfway point " +
    "between A and A′, and between B and B′, and draw the line through them. Then write its " +
    "equation: an upright line through 2 on the x-axis is x = 2; a flat line through −1 on the " +
    "y-axis is y = −1; the diagonal through (0, 0) and (1, 1) is y = x.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    for (let g = 0; g < 50; g++) {
      const L = at(o, FIND_LINES)(r);
      const res = onAxes(r, o, (obj) => (oneSide(obj, L) ? { image: obj.map((p) => reflect(p, L)) } : null));
      if (res) return { L, ...res };
    }
    const L = { k: "x", v: 0 };
    const obj = [[-3, 0], [-1, 0], [-3, 2]];
    return { L, obj, image: obj.map((p) => reflect(p, L)) };
  },
  render(item) {
    const fig = tfGrid({
      bounds: [-5, 5, -5, 5], axes: true,
      shapes: [{ pts: item.obj, names: NAMES }, { pts: item.image, image: true, names: PRIMES }],
    });
    return side(art(fig), ask("The mirror line is") + ask(line()));
  },
  worked() {
    return worked("One done for you", say(
      "A is at (−3, 1) and A′ at (1, 1): halfway between −3 and 1 is −1. Every corner pairs up the " +
      "same way, so the line is upright through −1 on the x-axis: <b>x = −1</b>."));
  },
  key(item) {
    return [want.text(...lineForms(item.L))];
  },
  answer(item) {
    return [lineName(item.L)];
  },
};

/* ═══ 2. rotation ══════════════════════════════════════════════════════════*/

const TURN_BANK = [[-90, 180], [-90, 90, 180], [-90, 90, 180, 270, -270]];
const TURN_WORDS = {
  "-90": "a quarter turn clockwise", 90: "a quarter turn anticlockwise", 180: "a half turn",
  270: "three quarters of a turn anticlockwise", "-270": "three quarters of a turn clockwise",
};

const tfTurn = {
  id: "tf-turn",
  group: "tf-rotate",
  label: "Which way is it facing?",
  blurb: "Quarter turn, half turn, clockwise, anticlockwise — pick the picture.",
  heading: "Which picture shows the turn?",
  instruction: () =>
    "A rotation turns a shape. CLOCKWISE is the way a clock's hands go; ANTICLOCKWISE is the other " +
    "way. A quarter turn is 90°, a half turn 180°, three quarters 270°, a whole turn 360°. Turn the " +
    "page, or picture yourself turning the shape, and tick the picture it ends up as. One of them " +
    "is a flip, not a turn — watch out for it.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const base = oriented(r);
    const deg = r.pick(at(o, TURN_BANK));
    const turned = (d) => base.map((p) => rotate(p, [0, 0], d));
    const right = turned(deg);
    const wrongs = [deg === 180 ? turned(-90) : turned(-deg), deg === 180 ? turned(90) : turned(180), base.map(([x, y]) => [-x, y])];
    const opts = r.shuffle([{ pts: right, ok: true }, ...wrongs.map((pts) => ({ pts, ok: false }))]);
    return { base, deg, opts };
  },
  render(item) {
    return side(
      art(miniShape(item.base, { size: 20 })),
      ask(`Turn it <b>${TURN_WORDS[item.deg]}</b>.`) + tick(...item.opts.map((u) => miniShape(u.pts, { size: 13 }))));
  },
  worked() {
    return worked("How to see it", say(
      "Hold the page and turn it a quarter of the way round, the way a clock's hands go: that is " +
      "what a quarter turn clockwise does to the shape. The picture that is a mirror image can never " +
      "be reached by turning — only by flipping."));
  },
  key(item) {
    return [want.tick(item.opts.findIndex((u) => u.ok))];
  },
  answer(item) {
    return [`picture ${item.opts.findIndex((u) => u.ok) + 1} (${TURN_WORDS[item.deg]})`];
  },
};

const tfRotateDraw = {
  id: "tf-rotate-draw",
  group: "tf-rotate",
  label: "Rotate the shape",
  blurb: "About a centre, by a quarter or a half turn — count from the centre.",
  heading: "Rotate the shape about the red point",
  instruction: () =>
    "A rotation needs three things: the CENTRE (the red point, which does not move), the ANGLE, and " +
    "the DIRECTION. Tracing paper makes it easy: trace the shape, hold your pencil on the centre, " +
    "turn the paper. Or count: a corner 3 across and 1 up from the centre ends up 1 across and 3 " +
    "DOWN after a quarter turn clockwise — the across and up swap places, and one changes direction. " +
    "After a half turn it is 3 back and 1 down.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const degs = at(o, [[-90, 180], [-90, 90, 180], [-90, 90, 180]]);
    for (let g = 0; g < 100; g++) {
      const obj = oriented(r);
      const deg = r.pick(degs);
      const c = tier(o) === "gentle" ? r.pick(obj) : [r.int(-1, extent(obj)[0] + 1), r.int(-1, extent(obj)[1] + 1)];
      const image = obj.map((p) => rotate(p, c, deg));
      const bounds = boundsOf([...obj, ...image, c]);
      if (fits(bounds)) return { obj, deg, c, image, bounds };
    }
    const obj = [[0, 0], [2, 0], [0, 3]];
    return { obj, deg: 180, c: [0, 0], image: obj.map((p) => rotate(p, [0, 0], 180)), bounds: boundsOf([...obj, [-2, -3]]) };
  },
  render(item) {
    return art(tfGrid({ bounds: item.bounds, shapes: [{ pts: item.obj, names: NAMES }], points: [{ p: item.c, name: "" }] })) +
      ask(`Rotate it <b>${turnName(item.deg)}</b> about the red point.`);
  },
  worked() {
    const obj = [[1, 0], [3, 0], [1, 2]];
    const c = [0, 0];
    const img = obj.map((p) => rotate(p, c, -90));
    return worked("One done for you", side(
      art(tfGrid({ bounds: boundsOf([...obj, ...img, c]), shapes: [{ pts: obj, names: NAMES }, { pts: img, image: true, names: PRIMES }], points: [{ p: c }] })),
      say("A quarter turn clockwise. C is 1 across and 2 up from the centre, so C′ is 2 across and " +
        "1 DOWN. B is 3 across, 0 up, so B′ is 0 across and 3 down. The image is the same size and " +
        "shape — only turned.")));
  },
  key(item) {
    return [drawKey(item, `the shape turned ${turnName(item.deg)} about the red point`)];
  },
  answer(item) {
    return [`turned ${turnName(item.deg)}; the red point stays where it is`];
  },
};

const ORIGIN_TURNS = [[180, -90], [180, -90, 90], [180, -90, 90, 270]];
const tfRotatePts = {
  id: "tf-rotate-pts",
  group: "tf-rotate",
  label: "The rules for turning about the origin",
  blurb: "90° clockwise: (x, y) → (y, −x). 180°: both change sign.",
  heading: "Rotate each point about the origin (0, 0)",
  instruction: () =>
    "Shortcuts for turning about the origin. A half turn (180°): (x, y) → (−x, −y), both change " +
    "sign. A quarter turn clockwise: (x, y) → (y, −x). A quarter turn anticlockwise: " +
    "(x, y) → (−y, x). Sketch one on squared paper if you want to see why.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const deg = r.pick(at(o, ORIGIN_TURNS));
    const pts = [];
    while (pts.length < 4) {
      const p = [r.int(-6, 6), r.int(-6, 6)];
      if ((p[0] === 0 && p[1] === 0) || pts.some((u) => u[0] === p[0] && u[1] === p[1])) continue;
      pts.push(p);
    }
    return { deg, pts };
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead">${turnName(item.deg)} about (0, 0)</p>` +
      item.pts.map((p) => ask(`${pt(p)} → (&nbsp;${small()},&nbsp;${small()})`)).join("");
  },
  worked() {
    return worked("One done for you", say(
      "(4, 1), a quarter turn clockwise: (x, y) → (y, −x) gives <b>(1, −4)</b>. Check on the grid: " +
      "4 across and 1 up turns into 1 across and 4 down."));
  },
  key(item) {
    return item.pts.flatMap((p) => rotate(p, [0, 0], item.deg).map((v) => want.num(v)));
  },
  answer(item) {
    return [item.pts.map((p) => `${pt(p)} → ${pt(rotate(p, [0, 0], item.deg))}`).join(", ")];
  },
};

const DESCRIBE_TURNS = [-90, 90, 180];
const tfRotateDescribe = {
  id: "tf-rotate-describe",
  group: "tf-rotate",
  label: "Describe the rotation",
  blurb: "How far, which way — and, at Stretch, where the centre is.",
  heading: "Describe the rotation",
  instruction: (o) =>
    "Look at one side of the object and the same side of the image. Has it turned a quarter or a " +
    "half, and which way? " + (tier(o) === "stretch"
      ? "The centre is not marked: it is the one point that is the same distance from every corner as from its image. Try tracing paper, pinned at a point, until the shape turns onto its image."
      : "The centre of the turn is marked."),
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    for (let g = 0; g < 80; g++) {
      const deg = r.pick(DESCRIBE_TURNS);
      const c = tier(o) === "gentle" ? [0, 0] : [r.int(-2, 2), r.int(-2, 2)];
      const res = onAxes(r, o, (obj) => ({ image: obj.map((p) => rotate(p, c, deg)), extra: [c] }));
      if (res) return { deg, c, ...res };
    }
    const obj = [[1, 1], [3, 1], [1, 2]];
    return { deg: 180, c: [0, 0], obj, image: obj.map((p) => rotate(p, [0, 0], 180)) };
  },
  render(item, o) {
    const marked = tier(o) !== "stretch";
    const fig = tfGrid({
      bounds: [-5, 5, -5, 5], axes: true,
      shapes: [{ pts: item.obj, names: NAMES }, { pts: item.image, image: true, names: PRIMES }],
      points: marked ? [{ p: item.c, name: "" }] : [],
    });
    return side(art(fig),
      ask("The shape has been turned") + tick("90° clockwise", "90° anticlockwise", "180°") +
      (marked ? "" : ask(coord("about the centre"))));
  },
  key(item, o) {
    const out = [want.tick({ "-90": 0, 90: 1, 180: 2 }[item.deg])];
    if (tier(o) === "stretch") out.push(want.num(item.c[0]), want.num(item.c[1]));
    return out;
  },
  answer(item) {
    return [`rotation ${turnName(item.deg)} about ${pt(item.c)}`];
  },
};

/* The shapes for rotational symmetry, and how many ways each fits itself. */
const regular = (n) => [...Array(n)].map((_, k) => {
  const a = Math.PI / 2 + (2 * Math.PI * k) / n + (n % 2 ? 0 : Math.PI / n);
  return [Math.cos(a), Math.sin(a)];
});
const SYM = [
  { name: "square", pts: regular(4), order: 4 },
  { name: "rectangle", pts: [[0, 0], [3, 0], [3, 1.6], [0, 1.6]], order: 2 },
  { name: "equilateral triangle", pts: regular(3), order: 3 },
  { name: "kite", pts: [[0, 2.4], [1, 1.4], [0, -1.6], [-1, 1.4]], order: 1 },
  { name: "isosceles triangle", pts: [[-1, 0], [1, 0], [0, 2.6]], order: 1 },
  { name: "regular hexagon", pts: regular(6), order: 6 },
  { name: "regular pentagon", pts: regular(5), order: 5, min: 1 },
  { name: "parallelogram", pts: [[0, 0], [3, 0], [4, 1.8], [1, 1.8]], order: 2, min: 1 },
  { name: "rhombus", pts: [[0, -1.6], [1, 0], [0, 1.6], [-1, 0]], order: 2, min: 1 },
  { name: "isosceles trapezium", pts: [[0, 0], [4, 0], [3, 1.8], [1, 1.8]], order: 1, min: 1 },
  { name: "regular octagon", pts: regular(8), order: 8, min: 2 },
  { name: "cross", pts: [[1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [2, 2], [2, 3], [1, 3], [1, 2], [0, 2], [0, 1], [1, 1]], order: 4, min: 2 },
  { name: "Z shape", pts: [[0, 2], [2, 2], [2, 1], [3, 1], [3, 0], [1, 0], [1, 1], [0, 1]], order: 2, min: 2 },
  { name: "T shape", pts: [[0, 3], [3, 3], [3, 2], [2, 2], [2, 0], [1, 0], [1, 2], [0, 2]], order: 1, min: 2 },
];
const dealSym = dealer();
const tfRotSym = {
  id: "tf-rot-sym",
  group: "tf-rotate",
  label: "Rotational symmetry",
  blurb: "How many times does it fit onto itself in one whole turn?",
  heading: "The order of rotational symmetry",
  instruction: () =>
    "Turn the shape about its centre. Count how many times, in one whole turn, it looks exactly as " +
    "it did at the start — the finish counts, the start does not. That number is its ORDER of " +
    "rotational symmetry. A shape that only fits at the end of the whole turn has order 1: it has " +
    "no rotational symmetry.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const lvl = { gentle: 0, middle: 1, stretch: 2 }[tier(o)] ?? 0;
    const s = dealSym(r, SYM.filter((u) => (u.min || 0) <= lvl), i);
    return { name: s.name, order: s.order, pts: s.pts };
  },
  render(item) {
    return side(art(miniShape(item.pts, { size: 24 })), ask(slot("order")));
  },
  worked() {
    return worked("One done for you", say(
      "A rectangle looks the same after a half turn, and again after the whole turn: it fits onto " +
      "itself 2 times, so its order of rotational symmetry is <b>2</b>. A square fits after every " +
      "quarter turn: order 4."));
  },
  key(item) {
    return [want.num(item.order)];
  },
  answer(item) {
    return [`${item.name}: order ${item.order}`];
  },
};

/* ═══ 3. scaling ═══════════════════════════════════════════════════════════*/

const SF = [[2, 3], [2, 3, 4, 0.5], [0.5, 1 / 3, 1.5, 3]];
/** An object that k keeps on whole squares, and small enough to fit. */
function forScale(r, k) {
  const den = k === 0.5 || k === 1.5 ? 2 : Math.abs(k - 1 / 3) < 1e-9 ? 3 : 1;
  const bank = k >= 3 ? SMALL_SHAPES : den > 1 ? SMALL_SHAPES : SHAPES;
  return scale(oriented(r, bank), den);
}

const tfSf = {
  id: "tf-sf",
  group: "tf-scale",
  label: "Find the scale factor",
  blurb: "Image side ÷ object side — bigger than 1 grows it, less than 1 shrinks it.",
  heading: "What is the scale factor?",
  instruction: () =>
    "An ENLARGEMENT keeps the shape but changes the size: every length is multiplied by the same " +
    "number, the SCALE FACTOR. Pick a side of the object, find the same side on the image, and " +
    "divide: image length ÷ object length. A scale factor less than 1 (like ½) makes it smaller — " +
    "it is still called an enlargement.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    for (let g = 0; g < 60; g++) {
      const k = r.pick(at(o, SF));
      const obj = forScale(r, k);
      let img = scale(obj, k);
      img = shift(img, extent(obj)[0] + 2 - minXY(img)[0], 0);
      const bounds = boundsOf([...obj, ...img]);
      if (fits(bounds)) return { k, obj, img, bounds };
    }
    const obj = [[0, 0], [2, 0], [0, 1]];
    return { k: 2, obj, img: shift(scale(obj, 2), 4, 0), bounds: boundsOf([...obj, [8, 2]]) };
  },
  render(item) {
    return art(tfGrid({ bounds: item.bounds, shapes: [{ pts: item.obj }, { pts: item.img, image: true }] })) + ask(slot("scale factor"));
  },
  worked() {
    return worked("One done for you", say(
      "The bottom of the object is 2 squares; the bottom of the image is 6 squares. 6 ÷ 2 = 3: the " +
      "scale factor is <b>3</b>. Check another side — every side must be 3 times as long."));
  },
  key(item) {
    return [kWant(item.k)];
  },
  answer(item) {
    return [`scale factor ${kName(item.k)}`];
  },
};

const tfEnlargeDraw = {
  id: "tf-enlarge-draw",
  group: "tf-scale",
  label: "Enlarge the shape",
  blurb: "Every side times the scale factor, starting from the corner marked A′.",
  heading: "Enlarge the shape by the scale factor",
  instruction: () =>
    "Draw the image starting at the corner marked A′. Go round the object side by side: a side " +
    "that goes 2 across becomes 2 × the scale factor across on the image; a side that goes 1 up " +
    "and 1 across becomes (1 × scale factor) up and across. The angles do not change.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const ks = at(o, [[2], [2, 3], [3, 0.5]]);
    for (let g = 0; g < 60; g++) {
      const k = r.pick(ks);
      const obj = forScale(r, k);
      let image = scale(obj, k);
      image = shift(image, extent(obj)[0] + 2 - minXY(image)[0], -r.int(0, 1));
      const bounds = boundsOf([...obj, ...image]);
      if (fits(bounds)) return { k, obj, image, bounds };
    }
    const obj = [[0, 0], [2, 0], [0, 1]];
    return { k: 2, obj, image: shift(scale(obj, 2), 4, 0), bounds: boundsOf([...obj, [8, 2]]) };
  },
  render(item) {
    return art(tfGrid({
      bounds: item.bounds, shapes: [{ pts: item.obj, names: NAMES }],
      points: [{ p: item.image[0], name: "A′", col: "#2f6ea8" }],
    })) + ask(`Scale factor <b>${kName(item.k)}</b>`);
  },
  key(item) {
    return [drawKey(item, `every side ${kName(item.k)} times as long, starting at A′`)];
  },
  answer(item) {
    return [`every side × ${kName(item.k)}, the same angles, starting at A′`];
  },
};

const tfEnlargeCentre = {
  id: "tf-enlarge-centre",
  group: "tf-scale",
  label: "Enlarge from a centre",
  blurb: "From the centre to each corner, times the scale factor: that is where the image corner goes.",
  heading: "Enlarge the shape from the centre O",
  instruction: () =>
    "The CENTRE of enlargement fixes where the image goes. For each corner of the object, count " +
    "from O: so many across, so many up. Multiply both by the scale factor and count that far from " +
    "O — that is the image's corner. (Or draw a line from O through the corner and carry it on: " +
    "the image corner is on that line, scale factor times as far from O.)",
  cols: 2,
  defaultCount: 3,
  make(r, o) {
    const ks = at(o, [[2], [2, 3], [0.5, 3]]);
    for (let g = 0; g < 100; g++) {
      const k = r.pick(ks);
      const obj0 = forScale(r, k === 0.5 ? 0.5 : 1);
      const c = tier(o) === "gentle" ? [0, 0] : k === 0.5 ? [-2 * r.int(0, 1), -2 * r.int(0, 1)] : [-r.int(1, 2), -r.int(0, 2)];
      const obj = tier(o) === "gentle" ? obj0 : shift(obj0, k === 0.5 ? 2 * r.int(0, 1) : r.int(0, 1), k === 0.5 ? 2 * r.int(0, 1) : r.int(0, 1));
      const image = obj.map((p) => enlarge(p, c, k));
      if (!image.flat().every(Number.isInteger)) continue;
      const bounds = boundsOf([...obj, ...image, c]);
      if (fits(bounds)) return { k, c, obj, image, bounds };
    }
    const obj = [[0, 0], [2, 0], [0, 1]];
    return { k: 2, c: [0, 0], obj, image: scale(obj, 2), bounds: boundsOf([...obj, [4, 2]]) };
  },
  render(item) {
    return art(tfGrid({ bounds: item.bounds, shapes: [{ pts: item.obj, names: NAMES }], points: [{ p: item.c, name: "O" }] })) +
      ask(`Scale factor <b>${kName(item.k)}</b>, centre O`);
  },
  worked() {
    const obj = [[1, 1], [2, 1], [1, 2]];
    const c = [0, 0];
    const img = obj.map((p) => enlarge(p, c, 2));
    return worked("One done for you", side(
      art(tfGrid({ bounds: boundsOf([...obj, ...img, c]), shapes: [{ pts: obj, names: NAMES }, { pts: img, image: true, names: PRIMES }], points: [{ p: c, name: "O" }] })),
      say("Scale factor 2. A is 1 across and 1 up from O, so A′ is 2 across and 2 up. B is 2 across, " +
        "1 up, so B′ is 4 across, 2 up. Every image corner is twice as far from O, on the same line.")));
  },
  key(item) {
    return [drawKey(item, `every corner ${kName(item.k)} times as far from O, on the line from O`)];
  },
  answer(item) {
    return [`image corners at ${item.image.map((p) => `(${num(p[0] - item.c[0])}, ${num(p[1] - item.c[1])})`).join(", ")} counted from O`];
  },
};

const tfEnlargePts = {
  id: "tf-enlarge-pts",
  group: "tf-scale",
  label: "Enlarge from the origin",
  blurb: "Centre (0, 0): multiply both coordinates by the scale factor.",
  heading: "Enlarge each point, centre (0, 0)",
  instruction: () =>
    "When the centre of enlargement is the origin, the shortcut is: multiply both coordinates by " +
    "the scale factor. (x, y) → (kx, ky).",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const k = r.pick(at(o, [[2], [2, 3], [0.5, 3, 1.5]]));
    const step = k === 0.5 || k === 1.5 ? 2 : 1;
    const pts = [];
    while (pts.length < 4) {
      const p = [r.int(-4, 4) * step, r.int(-4, 4) * step];
      if ((p[0] === 0 && p[1] === 0) || pts.some((u) => u[0] === p[0] && u[1] === p[1])) continue;
      pts.push(p);
    }
    return { k, pts };
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead">Scale factor ${kName(item.k)}</p>` +
      item.pts.map((p) => ask(`${pt(p)} → (&nbsp;${small()},&nbsp;${small()})`)).join("");
  },
  key(item) {
    return item.pts.flatMap((p) => enlarge(p, [0, 0], item.k).map((v) => want.num(v)));
  },
  answer(item) {
    return [item.pts.map((p) => `${pt(p)} → ${pt(enlarge(p, [0, 0], item.k))}`).join(", ")];
  },
};

const tfEffects = {
  id: "tf-effects",
  group: "tf-scale",
  label: "Lengths, perimeter, angles, area",
  blurb: "Lengths and perimeter × k, angles the same, area × k².",
  heading: "What an enlargement does",
  instruction: () =>
    "Enlarge a rectangle and see what happens to each measurement. Every length is multiplied by " +
    "the scale factor — so the perimeter is too. The angles do not change at all. But the AREA is " +
    "multiplied by the scale factor TWICE (once for the length, once for the width): scale factor 3 " +
    "makes the area 9 times as big.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const k = r.pick(at(o, [[2, 3], [2, 3, 4], [0.5, 3, 1.5]]));
    const step = k === 0.5 || k === 1.5 ? 2 : 1;
    const a = r.int(2, 5) * step;
    let b = r.int(1, 4) * step;
    if (b === a) b += step;
    return { k, a, b };
  },
  render(item) {
    const { a, b, k } = item;
    const row = (name, before, unit = "") => `<tr><td>${name}</td><td>${before}${unit}</td><td class="wb-cell"></td></tr>`;
    return ask(`A rectangle ${a} cm by ${b} cm is enlarged by scale factor <b>${kName(k)}</b>.`) +
      `<table class="gw-table gw-table--area"><thead><tr><th></th><th>Object</th><th>Image</th></tr></thead><tbody>` +
      row("Length", a, " cm") + row("Width", b, " cm") + row("Perimeter", 2 * (a + b), " cm") +
      row("Area", a * b, " cm²") + row("Each corner", 90, "°") + `</tbody></table>` +
      ask(`The perimeter is × ${small()} &nbsp; The area is × ${small()}`);
  },
  worked() {
    return worked("One done for you", say(
      "A 3 by 2 rectangle, scale factor 2: 6 by 4. Perimeter 10 → 20 (× 2). Area 6 → 24: that is " +
      "× 4, which is 2 × 2. The corners are still 90°."));
  },
  key(item) {
    const { a, b, k } = item;
    return [want.num(a * k), want.num(b * k), want.num(2 * (a + b) * k), want.num(a * b * k * k), want.num(90), kWant(k), kWant(k * k)];
  },
  answer(item) {
    const { a, b, k } = item;
    return [`${a * k} by ${b * k}; perimeter ${2 * (a + b) * k}; area ${a * b * k * k}; corners 90°; perimeter × ${kName(k)}, area × ${kName(k * k)}`];
  },
};

const tfFindCentre = {
  id: "tf-find-centre",
  group: "tf-scale",
  label: "Find the centre of enlargement",
  blurb: "Join each image corner to its object corner and carry on: the lines meet at the centre.",
  heading: "Find the centre and the scale factor",
  instruction: () =>
    "Draw a line from each corner of the image through the matching corner of the object, and " +
    "carry it on. The lines all cross at one point: the centre of enlargement. Write its " +
    "coordinates, and the scale factor (image length ÷ object length).",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const ks = at(o, [[2], [2, 3], [2, 3, 0.5]]);
    for (let g = 0; g < 200; g++) {
      const k = r.pick(ks);
      const c = [r.int(-4, 2), r.int(-4, 2)];
      const res = onAxes(r, o, (obj) => {
        const image = obj.map((p) => enlarge(p, c, k));
        if (!image.flat().every(Number.isInteger)) return null;
        /* the object must not sit on the centre, or no lines can be drawn */
        if (obj.some((p) => p[0] === c[0] && p[1] === c[1])) return null;
        return { image, extra: [c] };
      }, 6);
      if (res) return { k, c, ...res };
    }
    const obj = [[1, 1], [2, 1], [1, 2]];
    return { k: 2, c: [0, 0], obj, image: scale(obj, 2) };
  },
  render(item) {
    const fig = tfGrid({
      bounds: [-6, 6, -6, 6], axes: true, cell: 4.4,
      shapes: [{ pts: item.obj, names: NAMES }, { pts: item.image, image: true, names: PRIMES }],
    });
    return side(art(fig), ask(coord("centre")) + ask(slot("scale factor")));
  },
  key(item) {
    return [want.pen(), want.num(item.c[0]), want.num(item.c[1]), kWant(item.k)];
  },
  answer(item) {
    return [`centre ${pt(item.c)}, scale factor ${kName(item.k)}`];
  },
};

/* ═══ 4. describe it fully ═════════════════════════════════════════════════*/

const dealDescribe = dealer();
const tfDescribe = {
  id: "tf-describe",
  group: "tf-describe",
  label: "Describe the transformation fully",
  blurb: "Name it, and give everything needed to do it again.",
  heading: "Describe the transformation fully",
  instruction: () =>
    "First decide: has it been flipped (a REFLECTION), turned (a ROTATION), or changed size (an " +
    "ENLARGEMENT)? Then 'fully' means everything someone would need to do it again: a reflection " +
    "needs its mirror line; a rotation its angle, direction and centre; an enlargement its scale " +
    "factor and centre.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const kind = dealDescribe(r, ["reflection", "rotation", "enlargement"], i);
    for (let g = 0; g < 100; g++) {
      if (kind === "reflection") {
        const L = at(o, FIND_LINES)(r);
        const res = onAxes(r, o, (obj) => (oneSide(obj, L) ? { image: obj.map((p) => reflect(p, L)) } : null));
        if (res) return { kind, L, ...res, says: `a reflection in the line ${lineName(L)}` };
      } else if (kind === "rotation") {
        const deg = r.pick(DESCRIBE_TURNS);
        const c = tier(o) === "gentle" ? [0, 0] : [r.int(-2, 2), r.int(-2, 2)];
        const res = onAxes(r, o, (obj) => ({ image: obj.map((p) => rotate(p, c, deg)), extra: [c] }));
        if (res) return { kind, deg, c, ...res, says: `a rotation ${turnName(deg)} about ${pt(c)}` };
      } else {
        const kk = r.pick(at(o, [[2], [2, 3], [2, 3, 0.5]]));
        const c = tier(o) === "gentle" ? [0, 0] : [r.int(-3, 1), r.int(-3, 1)];
        const res = onAxes(r, o, (obj) => {
          const image = obj.map((p) => enlarge(p, c, kk));
          return image.flat().every(Number.isInteger) && !obj.some((p) => p[0] === c[0] && p[1] === c[1]) ? { image, extra: [c] } : null;
        });
        if (res) return { kind, k: kk, c, ...res, says: `an enlargement, scale factor ${kName(kk)}, centre ${pt(c)}` };
      }
    }
    const obj = [[1, 1], [3, 1], [1, 2]];
    return { kind: "reflection", L: { k: "x", v: 0 }, obj, image: obj.map((p) => reflect(p, { k: "x", v: 0 })), says: "a reflection in the line x = 0" };
  },
  render(item) {
    const fig = tfGrid({
      bounds: [-5, 5, -5, 5], axes: true,
      shapes: [{ pts: item.obj, names: NAMES }, { pts: item.image, image: true, names: PRIMES }],
    });
    return side(art(fig), ask("It is") + tick("a reflection", "a rotation", "an enlargement") + ask("In full:") + ask(line()));
  },
  worked() {
    return worked("What 'fully' means", say(
      "Not just 'a rotation' but '<b>a rotation 90° clockwise about (1, 0)</b>'. Not just 'an " +
      "enlargement' but '<b>an enlargement, scale factor 2, centre (0, 0)</b>'. Not just 'a " +
      "reflection' but '<b>a reflection in the line y = x</b>'."));
  },
  key(item) {
    return [want.tick(["reflection", "rotation", "enlargement"].indexOf(item.kind)), want.free()];
  },
  answer(item) {
    return [item.says];
  },
};

export const TF_EXERCISES = [
  tfSame,
  tfSym, tfReflectDraw, tfReflectPts, tfReflectRule, tfMirrorFind,
  tfTurn, tfRotateDraw, tfRotatePts, tfRotateDescribe, tfRotSym,
  tfSf, tfEnlargeDraw, tfEnlargeCentre, tfEnlargePts, tfEffects, tfFindCentre,
  tfDescribe,
];
