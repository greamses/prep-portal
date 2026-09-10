/* ============================================================================
   Geometry Workbook — CHAPTER 3: pyramids and prisms
   ----------------------------------------------------------------------------
   Fourteen sections, in the order they were asked for:

     faces, edges and corners · stick shapes · faces and surfaces · side faces
     and base faces · pyramid or prism: the bases · pyramid or prism: the side
     faces · detecting from nets · the rule for faces, edges and corners ·
     surface area · volume · real-world practicals · one base open · both
     bases open · the frustum

   The chapter climbs the way a child can: count what you can see on a real
   drawing (the hidden edges are dashed, not missing), build the skeleton out
   of sticks and balls, sort bases from side faces, tell a prism from a
   pyramid by those two things alone, unfold them into nets, and only then
   write down the rules — the counts as n+2, 3n, 2n; the area as the faces
   added up; the volume as a layer times how many layers, and a pyramid as a
   third of the prism it fits in.

   Every count is checked against the model it is drawn from (solid.js keeps
   the corners, edges and faces), so the rule and the picture cannot disagree.
   ========================================================================== */

import {
  prism, pyramid, frustum, without, regularBase, rectBase, rightTriBase,
  solidSvg, roundSvg, prismNet, pyramidNet, cuboidNet, frustumNet, cubeNet, CUBE_NETS, visibleFaces, lieDown,
} from "./solid.js";
import { levelOf, helpOf, stepped, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const small = () => `<span class="wb-answer gw-num"></span>`;
const num = (label) => `<span class="wb-slot"><em>${label}</em>${small()}</span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;
const worked = (tag, body) => `<div class="wb-worked"><p class="wb-worked__tag">${tag}</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const line = () => `<span class="wb-line wb-line--md"></span>`;

const FIG = { w: 56, h: 46 };
const BIG = { w: 70, h: 56 };

/* ── the solids a level uses ───────────────────────────────────────────────*/

const SIDES = { gentle: [3, 4], middle: [3, 4, 5, 6], stretch: [3, 4, 5, 6, 7, 8] };
const sidesOf = (o) => SIDES[levelOf(o).id] || SIDES.gentle;

const POLY = { 3: "triangular", 4: "square", 5: "pentagonal", 6: "hexagonal", 7: "heptagonal", 8: "octagonal" };

/** The counts, by the rule — the checks compare them with the model. */
export function counts(kind, n) {
  if (kind === "pyramid") return { F: n + 1, E: 2 * n, V: n + 1 };
  return { F: n + 2, E: 3 * n, V: 2 * n }; // prism and frustum alike
}

/** A solid to draw: a prism, pyramid or (on its own) a cuboid. */
function makeSolid(kind, n, { cuboid = false } = {}) {
  if (kind === "prism") return cuboid ? prism(rectBase(34, 20), 22) : prism(regularBase(n, 18), 26);
  if (kind === "pyramid") return pyramid(regularBase(n, 20), 30);
  return frustum(regularBase(n, 20), 18, 0.55);
}

const nameOf = (kind, n, cuboid = false) =>
  cuboid ? "cuboid" : kind === "frustum" ? `${POLY[n]} frustum` : `${POLY[n]} ${kind}`;
/* the names a child might write for the same solid */
function namesFor(kind, n, cuboid = false) {
  const main = nameOf(kind, n, cuboid);
  const out = [main];
  if (cuboid) out.push("rectangular prism", "cuboid prism");
  if (kind === "pyramid" && n === 4) out.push("square based pyramid", "square-based pyramid");
  if (kind === "pyramid" && n === 3) out.push("triangle based pyramid", "tetrahedron", "triangular based pyramid");
  if (kind === "prism" && n === 3) out.push("triangle prism");
  if (kind === "prism" && n === 4 && !cuboid) out.push("cuboid", "square prism", "rectangular prism");
  return out;
}

const yawOf = (r) => r.pick([22, 28, 34, 40, -24, -32]);

/* Groups: one per section, the first carrying the chapter. */
export const SOLID_GROUPS = [
  { id: "fev", chapter: "Chapter 3 · Pyramids and prisms", label: "Faces, edges and corners" },
  { id: "sticks", label: "Stick shapes" },
  { id: "surfaces", label: "Faces and surfaces" },
  { id: "bases", label: "Side faces and base faces" },
  { id: "pp-bases", label: "Pyramid or prism: the bases" },
  { id: "pp-sides", label: "Pyramid or prism: the side faces" },
  { id: "nets", label: "Detecting from nets" },
  { id: "fev-rule", label: "The rule for faces, edges and corners" },
  { id: "sa", label: "Surface area of pyramids and prisms" },
  { id: "vol", label: "Volume of pyramids and prisms" },
  { id: "real", label: "Real-world practicals" },
  { id: "open1", label: "One base open" },
  { id: "open2", label: "Both bases open" },
  { id: "frustum", label: "The frustum" },
];

/* ═══ 1. faces, edges and corners ══════════════════════════════════════════*/

const dealCount = dealer();
const fevCount = {
  id: "fev-count",
  group: "fev",
  label: "Count them",
  blurb: "A real drawing — the edges round the back are dashed, so every one can be counted.",
  heading: "Count the faces, edges and corners",
  instruction: () =>
    "A face is a flat side. An edge is where two faces meet. A corner is where edges meet. " +
    "The dashed lines are edges round the back — count them too.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const pool = sidesOf(o).flatMap((n) => [["prism", n], ["pyramid", n]]);
    const [kind, n] = dealCount(r, pool, i);
    return { kind, n, cuboid: kind === "prism" && n === 4 && r.chance(0.5), yaw: yawOf(r) };
  },
  render(item) {
    const s = makeSolid(item.kind, item.n, { cuboid: item.cuboid });
    return art(solidSvg(s, { yaw: item.yaw, dots: true, box: FIG })) +
      ask(`${num("Faces")}${num("Edges")}${num("Corners")}`);
  },
  worked() {
    const s = prism(rectBase(34, 20), 22);
    return worked("One done for you", side(art(solidSvg(s, { dots: true, box: FIG })),
      say("A cuboid: 6 flat faces (3 you can see, 3 round the back), 12 edges (3 of them dashed), " +
        "and 8 corners.")));
  },
  key(item) {
    const c = counts(item.kind, item.n);
    return [want.num(c.F), want.num(c.E), want.num(c.V)];
  },
  answer(item) {
    const c = counts(item.kind, item.n);
    return [`${nameOf(item.kind, item.n, item.cuboid)}: ${c.F} faces, ${c.E} edges, ${c.V} corners`];
  },
};

const fevWhich = {
  id: "fev-which",
  group: "fev",
  label: "Face, edge or corner?",
  blurb: "One part is marked in red. Say which kind it is.",
  heading: "Is the red part a face, an edge or a corner?",
  instruction: () => "Tick one box for each: what is the part marked in red?",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const n = r.pick(sidesOf(o));
    const kind = r.pick(["prism", "pyramid"]);
    const yaw = yawOf(r);
    /* a face you can SEE — shading one round the back shades nothing */
    const seen = visibleFaces(makeSolid(kind, n), { yaw });
    return { kind, n, what: ["face", "edge", "corner"][(i + r.int(0, 2)) % 3], yaw, pickAt: r.int(0, 20), face: r.pick(seen) };
  },
  render(item) {
    const s = makeSolid(item.kind, item.n);
    const opts = { yaw: item.yaw, box: FIG };
    if (item.what === "face") opts.pick = [item.face];
    if (item.what === "edge") { const e = s.edges[item.pickAt % s.edges.length]; opts.markEdge = [e.a, e.b]; }
    if (item.what === "corner") opts.markCorner = item.pickAt % s.pts.length;
    return art(solidSvg(s, opts)) + tick("face", "edge", "corner");
  },
  key(item) {
    return [want.tick(["face", "edge", "corner"].indexOf(item.what))];
  },
  answer(item) {
    return [`${item.what}`];
  },
};

/* ═══ 2. stick shapes ══════════════════════════════════════════════════════*/

const dealStick = dealer();
const stickCount = {
  id: "stick-count",
  group: "sticks",
  label: "Build it from sticks",
  blurb: "Every edge is a stick, every corner a ball of clay.",
  heading: "How many sticks, how many balls?",
  instruction: () =>
    "To build the skeleton of a shape, every edge is one stick and every corner is one " +
    "ball of clay that the sticks push into. Count what you would need.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const pool = sidesOf(o).flatMap((n) => [["prism", n], ["pyramid", n]]);
    const [kind, n] = dealStick(r, pool, i);
    return { kind, n, yaw: yawOf(r) };
  },
  render(item) {
    return art(solidSvg(makeSolid(item.kind, item.n), { yaw: item.yaw, show: "sticks", box: FIG })) +
      ask(`${num("Sticks")}${num("Balls")}`);
  },
  key(item) {
    const c = counts(item.kind, item.n);
    return [want.num(c.E), want.num(c.V)];
  },
  answer(item) {
    const c = counts(item.kind, item.n);
    return [`${c.E} sticks, ${c.V} balls (${nameOf(item.kind, item.n)})`];
  },
};

const dealWhich = dealer();
const stickWhich = {
  id: "stick-which",
  group: "sticks",
  label: "What can I build?",
  blurb: "A pile of sticks and balls — which shape uses exactly all of them?",
  heading: "Which shape uses every stick and every ball?",
  instruction: () =>
    "You must use all the sticks and all the balls. Work out the edges and corners of each " +
    "shape and tick the one that matches.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const pool = sidesOf(o).flatMap((m) => [["prism", m], ["pyramid", m]]);
    const [kind, n] = dealWhich(r, pool, i);
    /* the three offered: the right one, the other kind with the same base,
       and the same kind with a base one side different */
    const other = kind === "prism" ? "pyramid" : "prism";
    const n2 = n === 3 ? 4 : n - 1;
    const opts = r.shuffle([[kind, n], [other, n], [kind, n2]]);
    return { kind, n, opts };
  },
  render(item) {
    const c = counts(item.kind, item.n);
    return ask(`<b>${c.E}</b> sticks and <b>${c.V}</b> balls of clay.`) +
      tick(...item.opts.map(([k, n]) => nameOf(k, n)));
  },
  key(item) {
    return [want.tick(item.opts.findIndex(([k, n]) => k === item.kind && n === item.n))];
  },
  answer(item) {
    return [nameOf(item.kind, item.n)];
  },
};

/* ═══ 3. faces and surfaces ════════════════════════════════════════════════*/

const ROUND = {
  cylinder: { flat: 2, curved: 1, rolls: true, stacks: true },
  cone: { flat: 1, curved: 1, rolls: true, stacks: false },
  sphere: { flat: 0, curved: 1, rolls: true, stacks: false },
  hemisphere: { flat: 1, curved: 1, rolls: true, stacks: false },
};

const dealSurf = dealer();
const surfCount = {
  id: "surf-count",
  group: "surfaces",
  label: "Flat faces and curved surfaces",
  blurb: "A face is flat; a curved surface bends. Count each kind.",
  heading: "Flat faces and curved surfaces",
  instruction: () =>
    "A flat face is flat, like the side of a box. A curved surface bends, like the side of a " +
    "tin. Count how many of each the shape has.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const pool = ["cylinder", "cone", "sphere", "hemisphere", "prism", "pyramid"];
    const kind = dealSurf(r, pool, i);
    return { kind, n: r.pick(sidesOf(o)), yaw: yawOf(r) };
  },
  render(item) {
    const pic = ROUND[item.kind] ? roundSvg(item.kind, { w: 40, h: 40 })
      : solidSvg(makeSolid(item.kind, item.n), { yaw: item.yaw, box: { w: 44, h: 40 } });
    return art(pic) + ask(`${num("Flat faces")}${num("Curved surfaces")}`);
  },
  key(item) {
    const c = ROUND[item.kind] || { flat: counts(item.kind, item.n).F, curved: 0 };
    return [want.num(c.flat), want.num(c.curved)];
  },
  answer(item) {
    const c = ROUND[item.kind] || { flat: counts(item.kind, item.n).F, curved: 0 };
    return [`${ROUND[item.kind] ? item.kind : nameOf(item.kind, item.n)}: ${c.flat} flat, ${c.curved} curved`];
  },
};

const dealRoll = dealer();
const surfRoll = {
  id: "surf-roll",
  group: "surfaces",
  label: "Will it roll? Will it stack?",
  blurb: "A curved surface rolls; two flat faces opposite each other stack.",
  heading: "Will it roll? Will it stack?",
  instruction: () =>
    "A shape with a curved surface can roll. A shape stacks if it has a flat face on top " +
    "and a flat face underneath, so another can sit on it.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const kind = dealRoll(r, ["cylinder", "cone", "sphere", "prism", "pyramid", "hemisphere"], i);
    return { kind, n: r.pick(sidesOf(o)), yaw: yawOf(r) };
  },
  render(item) {
    const pic = ROUND[item.kind] ? roundSvg(item.kind, { w: 40, h: 40 })
      : solidSvg(makeSolid(item.kind, item.n), { yaw: item.yaw, box: { w: 44, h: 40 } });
    return art(pic) + `<p class="gw-tickrow">Rolls: ${tick("yes", "no")}</p><p class="gw-tickrow">Stacks: ${tick("yes", "no")}</p>`;
  },
  facts(item) {
    if (ROUND[item.kind]) return ROUND[item.kind];
    return { rolls: false, stacks: item.kind === "prism" };
  },
  key(item) {
    const f = this.facts(item);
    return [want.tick(f.rolls ? 0 : 1), want.tick(f.stacks ? 0 : 1)];
  },
  answer(item) {
    const f = this.facts(item);
    return [`${ROUND[item.kind] ? item.kind : nameOf(item.kind, item.n)}: ${f.rolls ? "rolls" : "does not roll"}, ${f.stacks ? "stacks" : "does not stack"}`];
  },
};

/* ═══ 4. side faces and base faces ═════════════════════════════════════════*/

const baseWhich = {
  id: "base-which",
  group: "bases",
  label: "Base or side face?",
  blurb: "The face it stands on (and the one opposite, in a prism) is a base.",
  heading: "Is the shaded face a base or a side face?",
  instruction: () =>
    "A base is the face a prism or pyramid is named after — the end of a prism (it has two, " +
    "one at each end) or the bottom of a pyramid. Every other face is a side face.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const kind = r.pick(["prism", "pyramid"]);
    const n = r.pick(sidesOf(o));
    const s = makeSolid(kind, n);
    const yaw = yawOf(r);
    /* a base about a third of the time — and always a face you can see: a
       pyramid's base is underneath, so for that one it is seen from below */
    const isBase = (i + r.int(0, 2)) % 3 === 0;
    const pitch = isBase && kind === "pyramid" ? -20 : 22;
    const seen = visibleFaces(s, { yaw, pitch });
    const pool = seen.filter((j) => (s.faces[j].kind === "base") === isBase);
    return { kind, n, face: r.pick(pool.length ? pool : seen), yaw, pitch };
  },
  render(item) {
    const s = makeSolid(item.kind, item.n);
    return art(solidSvg(s, { yaw: item.yaw, pitch: item.pitch, pick: [item.face], box: FIG })) + tick("base", "side face");
  },
  key(item) {
    return [want.tick(makeSolid(item.kind, item.n).faces[item.face].kind === "base" ? 0 : 1)];
  },
  answer(item) {
    return [makeSolid(item.kind, item.n).faces[item.face].kind === "base" ? "base" : "side face"];
  },
};

const baseCount = {
  id: "base-count",
  group: "bases",
  label: "How many of each?",
  blurb: "Bases in blue, side faces in yellow. Count both.",
  heading: "Count the bases and the side faces",
  instruction: () => "The bases are coloured blue and the side faces yellow. Count each, including any round the back.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { kind: r.pick(["prism", "pyramid"]), n: r.pick(sidesOf(o)), yaw: yawOf(r) };
  },
  render(item) {
    return art(solidSvg(makeSolid(item.kind, item.n), { yaw: item.yaw, show: "solid", box: FIG })) +
      ask(`${num("Bases")}${num("Side faces")}`);
  },
  key(item) {
    return [want.num(item.kind === "prism" ? 2 : 1), want.num(item.n)];
  },
  answer(item) {
    return [`${item.kind === "prism" ? 2 : 1} base${item.kind === "prism" ? "s" : ""}, ${item.n} side faces`];
  },
};

/* ═══ 5. pyramid or prism: the bases ═══════════════════════════════════════*/

const dealPPB = dealer();
const ppbTick = {
  id: "ppb-tick",
  group: "pp-bases",
  label: "Prism or pyramid?",
  blurb: "Two bases the same, facing each other: a prism. One base and a point: a pyramid.",
  heading: "Prism or pyramid?",
  instruction: () =>
    "A prism has TWO bases, the same shape, one at each end. A pyramid has ONE base, and its " +
    "sides meet at a point. Tick which it is and write how many bases.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const pool = sidesOf(o).flatMap((n) => [["prism", n], ["pyramid", n]]);
    const [kind, n] = dealPPB(r, pool, i);
    return { kind, n, yaw: yawOf(r) };
  },
  render(item) {
    return art(solidSvg(makeSolid(item.kind, item.n), { yaw: item.yaw, box: FIG })) +
      tick("prism", "pyramid") + ask(num("Bases"));
  },
  key(item) {
    return [want.tick(item.kind === "prism" ? 0 : 1), want.num(item.kind === "prism" ? 2 : 1)];
  },
  answer(item) {
    return [`${item.kind} — ${item.kind === "prism" ? 2 : 1} base${item.kind === "prism" ? "s" : ""}`];
  },
};

const dealName = dealer();
const ppbName = {
  id: "ppb-name",
  group: "pp-bases",
  label: "Name it by its base",
  blurb: "A prism or pyramid is named after the shape of its base.",
  heading: "Name each solid",
  instruction: () =>
    "Look at the base: a triangle, a square, a pentagon… Then say prism or pyramid. A " +
    "triangle base and two ends makes a triangular prism.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const pool = sidesOf(o).flatMap((n) => [["prism", n], ["pyramid", n]]);
    const [kind, n] = dealName(r, pool, i);
    return { kind, n, yaw: yawOf(r) };
  },
  render(item) {
    return art(solidSvg(makeSolid(item.kind, item.n), { yaw: item.yaw, show: "solid", box: FIG })) +
      ask(`It is a ${line()}`);
  },
  key(item) {
    return [want.words(...namesFor(item.kind, item.n))];
  },
  answer(item) {
    return [nameOf(item.kind, item.n)];
  },
};

/* ═══ 6. pyramid or prism: the side faces ══════════════════════════════════*/

const dealPPS = dealer();
const ppsShape = {
  id: "pps-shape",
  group: "pp-sides",
  label: "What shape are the side faces?",
  blurb: "A prism's side faces are rectangles; a pyramid's are triangles.",
  heading: "What shape are the side faces?",
  instruction: () =>
    "The side faces of a prism are rectangles, one for every side of the base. The side " +
    "faces of a pyramid are triangles meeting at the top. Tick the shape and count them.",
  cols: 2,
  defaultCount: 6,
  make(r, o, k, i) {
    const pool = sidesOf(o).flatMap((n) => [["prism", n], ["pyramid", n]]);
    const [kind, n] = dealPPS(r, pool, i);
    return { kind, n, yaw: yawOf(r) };
  },
  render(item) {
    return art(solidSvg(makeSolid(item.kind, item.n), { yaw: item.yaw, show: "solid", box: FIG })) +
      tick("rectangles", "triangles") + ask(num("How many"));
  },
  key(item) {
    return [want.tick(item.kind === "prism" ? 0 : 1), want.num(item.n)];
  },
  answer(item) {
    return [`${item.n} ${item.kind === "prism" ? "rectangles" : "triangles"}`];
  },
};

const ppsFromBase = {
  id: "pps-from-base",
  group: "pp-sides",
  label: "From the base to the sides",
  blurb: "No picture: the base has n sides, so there are n side faces.",
  heading: "How many side faces?",
  instruction: () =>
    "Every side of the base has one side face standing on it — a rectangle for a prism, a " +
    "triangle for a pyramid.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const ns = [...sidesOf(o), ...(levelOf(o).id === "stretch" ? [10, 12] : [])];
    return { kind: r.pick(["prism", "pyramid"]), n: r.pick(ns) };
  },
  render(item) {
    const base = POLY[item.n] ? `a ${POLY[item.n]} base` : `a base with ${item.n} sides`;
    return ask(`<b>A ${item.kind}</b> with ${base}.`) + ask(`${num("Side faces")}`) + tick("rectangles", "triangles");
  },
  key(item) {
    return [want.num(item.n), want.tick(item.kind === "prism" ? 0 : 1)];
  },
  answer(item) {
    return [`${item.n} ${item.kind === "prism" ? "rectangles" : "triangles"}`];
  },
};

/* ═══ 7. detecting from nets ═══════════════════════════════════════════════*/

const dealNet = dealer();
const netWhich = {
  id: "net-which",
  group: "nets",
  label: "What does it fold into?",
  blurb: "Count the faces and look at their shapes: the base is shaded.",
  heading: "Which solid does the net fold into?",
  instruction: () =>
    "Imagine cutting the net out and folding it on the lines. Rectangles in a row are the " +
    "sides of a prism; triangles round a shape are the sides of a pyramid. Tick the solid.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    /* no regular square prism: its net is a cuboid's, and "square prism" and
       "cuboid" would both be right */
    const pool = [["cuboid", 4], ...sidesOf(o).flatMap((n) => (n === 4 ? [["pyramid", n]] : [["prism", n], ["pyramid", n]]))];
    const [kind, n] = dealNet(r, pool, i);
    /* the wrong answers: the other kind, a different base, the cuboid — never
       the same name twice */
    const lab = ([k, m]) => (k === "cuboid" ? "cuboid" : nameOf(k, m));
    const cands = [
      [kind, n],
      [kind === "pyramid" ? "prism" : "pyramid", kind === "cuboid" ? 4 : n],
      [kind === "cuboid" ? "prism" : kind, n === 3 ? 5 : n === 5 ? 6 : 3],
      ["cuboid", 4], ["prism", 3], ["pyramid", 3], ["prism", 5], ["pyramid", 5], ["prism", 6],
    ].filter(([k, m]) => !(k === "prism" && m === 4));
    const opts = [];
    cands.forEach((c) => { if (opts.length < 4 && !opts.some((x) => lab(x) === lab(c))) opts.push(c); });
    return { kind, n, opts: r.shuffle(opts) };
  },
  label2: (k, n) => (k === "cuboid" ? "cuboid" : nameOf(k, n)),
  render(item) {
    const net = item.kind === "cuboid" ? cuboidNet(16, 10, 12)
      : item.kind === "prism" ? prismNet(item.n, 9, 16) : pyramidNet(item.n, 12, 14);
    return art(net) + tick(...item.opts.map(([k, n]) => this.label2(k, n)));
  },
  key(item) {
    return [want.tick(item.opts.findIndex(([k, n]) => k === item.kind && n === item.n))];
  },
  answer(item) {
    return [this.label2(item.kind, item.n)];
  },
};

let cubeFlip = 0;
const netCube = {
  id: "net-cube",
  group: "nets",
  label: "Will it make a cube?",
  blurb: "Six squares — but only some arrangements fold up without a gap.",
  heading: "Will these six squares fold into a cube?",
  instruction: () =>
    "Imagine folding it: one square is the bottom, and each of the others has to land on a " +
    "different face. If two land on the same face, it does not make a cube.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    if (i === 0) cubeFlip = r.chance(0.5) ? 1 : 0;
    const yes = (i + cubeFlip) % 2 === 0;
    return { yes, kind: r.pick(yes ? CUBE_NETS.yes : CUBE_NETS.no) };
  },
  render(item) {
    return art(cubeNet(item.kind, 9)) + tick("makes a cube", "does not");
  },
  key(item) {
    return [want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    return [item.yes ? "makes a cube" : "does not make a cube"];
  },
};

/* ═══ 8. the rule for faces, edges and corners ═════════════════════════════*/

function ruleTable(kind) {
  const id = `rule-${kind}`;
  const rule = kind === "prism" ? ["n + 2", "3n", "2n"] : ["n + 1", "2n", "n + 1"];
  return {
    id,
    group: "fev-rule",
    label: kind === "prism" ? "The prism table" : "The pyramid table",
    blurb: kind === "prism"
      ? "Fill it in row by row; the last row is the rule — n+2, 3n, 2n."
      : "Fill it in row by row; the last row is the rule — n+1, 2n, n+1.",
    heading: kind === "prism" ? "Find the rule for prisms" : "Find the rule for pyramids",
    instruction: () =>
      `Fill in the table one row at a time. Look down each column when it is done: every ` +
      `number depends only on how many sides the base has.`,
    cols: 1,
    defaultCount: 1,
    make(r, o) {
      const last = Math.min(sidesOf(o).slice(-1)[0] + 2, 8);
      const rows = [];
      for (let n = 3; n <= last; n++) rows.push(n);
      return { rows, withN: levelOf(o).id !== "gentle" };
    },
    render(item, o) {
      const filled = { show: 1, help: 0, try: 0 }[helpOf(o).id] ?? 0;
      const body = item.rows.map((n, i) => {
        const c = counts(kind, n);
        const pic = solidSvg(makeSolid(kind, n), { box: { w: 20, h: 18 } });
        const cells = i < filled
          ? `<td>${c.F}</td><td>${c.E}</td><td>${c.V}</td>`
          : `<td class="wb-cell"></td><td class="wb-cell"></td><td class="wb-cell"></td>`;
        return `<tr><td class="gw-table__shape">${pic}</td><td>${POLY[n]} ${kind}</td><td>${n}</td>${cells}</tr>`;
      }).join("");
      const tail = item.withN
        ? `<tr class="gw-table__rule"><td></td><td>any ${kind}</td><td><b>n</b></td><td class="wb-cell"></td><td class="wb-cell"></td><td class="wb-cell"></td></tr>`
        : "";
      return `<table class="gw-table"><thead><tr><th>Shape</th><th>Name</th><th>Base sides</th>` +
        `<th>Faces</th><th>Edges</th><th>Corners</th></tr></thead><tbody>${body}${tail}</tbody></table>`;
    },
    key(item, o) {
      const filled = { show: 1, help: 0, try: 0 }[helpOf(o).id] ?? 0;
      const out = [];
      item.rows.forEach((n, i) => {
        if (i < filled) return;
        const c = counts(kind, n);
        out.push(want.num(c.F), want.num(c.E), want.num(c.V));
      });
      if (item.withN) {
        const alt = (e) => [e, e.replace(/\s/g, ""), e.replace("3n", "3 × n").replace("2n", "2 × n"), e.replace("3n", "n × 3").replace("2n", "n × 2")];
        rule.forEach((e) => out.push(want.text(...alt(e))));
      }
      return out;
    },
    answer(item) {
      const rows = item.rows.map((n) => {
        const c = counts(kind, n);
        return `${POLY[n]} ${kind}: ${c.F} faces, ${c.E} edges, ${c.V} corners`;
      });
      if (item.withN) rows.push(`any ${kind}: faces ${rule[0]}, edges ${rule[1]}, corners ${rule[2]}`);
      return rows;
    },
  };
}
const rulePrism = ruleTable("prism");
const rulePyramid = ruleTable("pyramid");

const ruleUse = {
  id: "rule-use",
  group: "fev-rule",
  label: "Use the rule",
  blurb: "A base with 10 sides is too many to draw — the rule does it.",
  heading: "Use the rule",
  instruction: () =>
    "Prism: faces n + 2, edges 3n, corners 2n. Pyramid: faces n + 1, edges 2n, corners n + 1 " +
    "— where n is the number of sides of the base.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const ns = levelOf(o).id === "gentle" ? [7, 8, 9, 10] : [7, 8, 9, 10, 12, 15, 20];
    return { kind: r.pick(["prism", "pyramid"]), n: r.pick(ns) };
  },
  render(item) {
    return ask(`<b>A ${item.kind}</b> whose base has <b>${item.n}</b> sides.`) +
      ask(`${num("Faces")}${num("Edges")}${num("Corners")}`);
  },
  key(item) {
    const c = counts(item.kind, item.n);
    return [want.num(c.F), want.num(c.E), want.num(c.V)];
  },
  answer(item) {
    const c = counts(item.kind, item.n);
    return [`${c.F} faces, ${c.E} edges, ${c.V} corners`];
  },
};

const ruleEuler = {
  id: "rule-euler",
  group: "fev-rule",
  label: "Faces + corners − edges",
  blurb: "It always comes to 2. Use it to find the one that is missing.",
  heading: "Faces + corners − edges = 2",
  instruction: () =>
    "For every prism and every pyramid, faces + corners − edges comes to 2. Use it to find " +
    "the number that is missing.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const kind = r.pick(["prism", "pyramid"]);
    const n = r.int(3, 12);
    return { kind, n, hide: r.pick(["F", "E", "V"]) };
  },
  render(item) {
    const c = counts(item.kind, item.n);
    const show = (k, label) => (item.hide === k ? num(label) : `<span class="wb-slot"><em>${label}</em><b>${c[k]}</b></span>`);
    return ask(`${show("F", "Faces")}${show("V", "Corners")}${show("E", "Edges")}`);
  },
  key(item) {
    return [want.num(counts(item.kind, item.n)[item.hide])];
  },
  answer(item) {
    const c = counts(item.kind, item.n);
    return [`${c.F} + ${c.V} − ${c.E} = 2, so the missing one is ${c[item.hide]}`];
  },
};

/* ═══ 9. surface area ══════════════════════════════════════════════════════*/

const unit = "cm";
const sq = `${unit}²`;
const cube = `${unit}³`;
const dimOf = (r, o, lo, hi) => r.int(lo, hi);
const sizes = (o) => ({ gentle: [2, 6], middle: [2, 10], stretch: [3, 15] }[levelOf(o).id] || [2, 6]);

/* The area table: a row for each kind of face — how many, the area of one,
   the area of all of them — then the total. At Show me the first row is
   filled in. */
function areaTable(rows, o) {
  const filled = helpOf(o).id === "show" ? 1 : 0;
  const body = rows.map((row, i) => i < filled
    ? `<tr><td>${row.name}</td><td>${row.count}</td><td>${row.one} ${sq}</td><td>${row.count * row.one} ${sq}</td></tr>`
    : `<tr><td>${row.name}</td><td>${row.count}</td><td class="wb-cell"></td><td class="wb-cell"></td></tr>`).join("");
  return `<table class="gw-table gw-table--area"><thead><tr><th>Faces</th><th>How many</th><th>Area of one</th><th>Altogether</th></tr></thead>` +
    `<tbody>${body}<tr class="gw-table__rule"><td>Surface area</td><td></td><td></td><td class="wb-cell"></td></tr></tbody></table>`;
}
function areaKey(rows, o) {
  const filled = helpOf(o).id === "show" ? 1 : 0;
  const out = [];
  rows.forEach((row, i) => { if (i >= filled) out.push(want.num(row.one), want.num(row.one * row.count)); });
  out.push(want.num(rows.reduce((s, row) => s + row.one * row.count, 0)));
  return out;
}

const cuboidRows = ({ l, w, h }) => [
  { name: "top and bottom", count: 2, one: l * w },
  { name: "front and back", count: 2, one: l * h },
  { name: "the two ends", count: 2, one: w * h },
];

const saCuboid = {
  id: "sa-cuboid",
  group: "sa",
  label: "Surface area of a cuboid",
  blurb: "Three pairs of rectangles — find one of each and double it.",
  heading: "The surface area of a cuboid",
  instruction: () =>
    "The surface area is the area of every face added up — all the card you would need to " +
    "make it. A cuboid's faces come in three matching pairs.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const [lo, hi] = sizes(o);
    return { l: dimOf(r, o, lo + 1, hi), w: dimOf(r, o, lo, hi - 1), h: dimOf(r, o, lo, hi - 1) };
  },
  render(item, o) {
    const s = prism(rectBase(item.l * 4, item.w * 4), item.h * 4);
    const fig = solidSvg(s, { box: { w: 58, h: 46 }, dims: [{ a: 4, b: 5, text: `${item.l} ${unit}` }, { a: 5, b: 6, text: `${item.w} ${unit}` }, { up: true, text: `${item.h} ${unit}` }] });
    return art(fig) + areaTable(cuboidRows(item), o);
  },
  key(item, o) {
    return areaKey(cuboidRows(item), o);
  },
  answer(item) {
    const rows = cuboidRows(item);
    return [`${rows.map((x) => `2 × ${x.one}`).join(" + ")} = ${rows.reduce((s, x) => s + 2 * x.one, 0)} ${sq}`];
  },
};

/* A triangular prism lying down, like a chocolate-bar box: the triangle end
   faces you, its sides are labelled round it, and the length runs along the
   bottom. */
function triPrismFig(a, b, c, length) {
  const s = lieDown(prism(rightTriBase(a * 4, b * 4), 60));
  const dims = [{ a: 3, b: 4, text: `${a}` }, { a: 3, b: 5, text: `${b}` }];
  if (c) dims.push({ a: 4, b: 5, text: `${c}` });
  dims.push({ along: true, text: length });
  return solidSvg(s, { yaw: -58, pitch: 18, box: { w: 62, h: 42 }, dims });
}

/* right-angled triangles with whole sides */
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [9, 12, 15]];
const triRows = ({ a, b, c, L }) => [
  { name: "the two triangle ends", count: 2, one: (a * b) / 2 },
  { name: `rectangle ${a} by ${L}`, count: 1, one: a * L },
  { name: `rectangle ${b} by ${L}`, count: 1, one: b * L },
  { name: `rectangle ${c} by ${L}`, count: 1, one: c * L },
];
const saTri = {
  id: "sa-triprism",
  group: "sa",
  label: "Surface area of a triangular prism",
  blurb: "Two triangles and three rectangles — each rectangle a side of the triangle by the length.",
  heading: "The surface area of a triangular prism",
  instruction: () =>
    "Two triangle ends (each half of base × height) and three rectangles, one on each side of " +
    "the triangle. Every rectangle is that side times the length of the prism.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const [a, b, c] = r.pick(levelOf(o).id === "gentle" ? TRIPLES.slice(0, 2) : TRIPLES);
    const [lo, hi] = sizes(o);
    return { a, b, c, L: dimOf(r, o, lo + 2, hi + 2) };
  },
  render(item, o) {
    const fig = triPrismFig(item.a, item.b, item.c, `${item.L} ${unit}`);
    return art(fig) + areaTable(triRows(item), o);
  },
  key(item, o) {
    return areaKey(triRows(item), o);
  },
  answer(item) {
    const rows = triRows(item);
    return [`${rows.map((x) => x.count * x.one).join(" + ")} = ${rows.reduce((s, x) => s + x.count * x.one, 0)} ${sq}`];
  },
};

const pyrRows = ({ b, s }) => [
  { name: "the square base", count: 1, one: b * b },
  { name: "the triangles", count: 4, one: (b * s) / 2 },
];
const saPyramid = {
  id: "sa-pyramid",
  group: "sa",
  label: "Surface area of a square pyramid",
  blurb: "One square and four triangles; each triangle is half of base × slant height.",
  heading: "The surface area of a square-based pyramid",
  instruction: () =>
    "The base is a square. The four side faces are the same triangle: half of the base edge " +
    "times the slant height (measured up the middle of the face, not the edge).",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const [lo, hi] = sizes(o);
    let b = dimOf(r, o, lo, hi);
    let s = dimOf(r, o, lo + 1, hi + 3);
    if ((b * s) % 2) s += 1;
    return { b, s };
  },
  render(item, o) {
    const p = pyramid(regularBase(4, 20), 30);
    const fig = solidSvg(p, { box: { w: 56, h: 46 }, dims: [{ a: 0, b: 1, text: `${item.b} ${unit}` }] });
    return art(fig) + `<p class="wb-ask gw-note">slant height ${item.s} ${unit}</p>` + areaTable(pyrRows(item), o);
  },
  key(item, o) {
    return areaKey(pyrRows(item), o);
  },
  answer(item) {
    const rows = pyrRows(item);
    return [`${item.b * item.b} + 4 × ${(item.b * item.s) / 2} = ${rows.reduce((s, x) => s + x.count * x.one, 0)} ${sq}`];
  },
};

const saFormula = {
  id: "sa-formula",
  group: "sa",
  label: "The formula: 2 × base + perimeter × height",
  blurb: "Every prism at once: the two ends, and the sides unrolled into one long rectangle.",
  heading: "Surface area of any prism",
  instruction: () =>
    "Unroll the side faces of a prism and they make ONE rectangle: as long as the perimeter " +
    "of the base, as tall as the prism. So surface area = 2 × base area + perimeter × height.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    /* Gentle keeps every number small enough to multiply in the head. */
    const g = levelOf(o).id === "gentle";
    const n = r.pick([3, 4, 5, 6, 8]);
    const side0 = r.int(2, g ? 5 : 9);
    const A = r.int(6, g ? 30 : 60);
    return { n, side: side0, A, h: r.int(g ? 2 : 3, g ? 10 : 15) };
  },
  render(item) {
    const P = item.n * item.side;
    return ask(`A prism: base area <b>${item.A} ${sq}</b>, base perimeter <b>${P} ${unit}</b>, height <b>${item.h} ${unit}</b>.`) +
      ask(`2 × ${box()} + ${box()} × ${box()} = ${box()} ${sq}`);
  },
  key(item) {
    const P = item.n * item.side;
    return [want.num(item.A), want.num(P), want.num(item.h), want.num(2 * item.A + P * item.h)];
  },
  answer(item) {
    const P = item.n * item.side;
    return [`2 × ${item.A} + ${P} × ${item.h} = ${2 * item.A + P * item.h} ${sq}`];
  },
};

/* ═══ 10. volume ═══════════════════════════════════════════════════════════*/

const volCubes = {
  id: "vol-cubes",
  group: "vol",
  label: "Count the cubes in layers",
  blurb: "One layer, then how many layers — the idea under every volume formula.",
  heading: "How many cubes?",
  instruction: () =>
    "Count the cubes in the bottom layer (the base). Count how many layers there are. " +
    "Multiply: that is the volume, in cubes.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const hi = { gentle: 4, middle: 5, stretch: 6 }[levelOf(o).id] || 4;
    return { l: r.int(2, hi), w: r.int(2, hi), h: r.int(2, hi) };
  },
  render(item) {
    const s = prism(rectBase(item.l, item.w), item.h);
    return art(solidSvg(s, { grid: true, box: { w: 50, h: 44 } })) +
      ask(`${num("In a layer")}${num("Layers")}`) + ask(num("Cubes"));
  },
  key(item) {
    return [want.num(item.l * item.w), want.num(item.h), want.num(item.l * item.w * item.h)];
  },
  answer(item) {
    return [`${item.l * item.w} × ${item.h} = ${item.l * item.w * item.h} cubes`];
  },
};

const volCuboid = {
  id: "vol-cuboid",
  group: "vol",
  label: "Volume of a cuboid",
  blurb: "length × width × height — the layer, times the layers.",
  heading: "The volume of a cuboid",
  instruction: () => "Volume = length × width × height. The answer is in cubic units.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [lo, hi] = sizes(o);
    return { l: r.int(lo, hi), w: r.int(lo, hi), h: r.int(lo, hi) };
  },
  render(item) {
    const s = prism(rectBase(item.l * 4, item.w * 4), item.h * 4);
    return art(solidSvg(s, { box: { w: 56, h: 46 }, dims: [{ a: 4, b: 5, text: `${item.l}` }, { a: 5, b: 6, text: `${item.w}` }, { up: true, text: `${item.h}` }] })) +
      ask(`${box()} × ${box()} × ${box()} = ${box()} ${cube}`);
  },
  key(item) {
    return [want.set(item.l, item.w, item.h), want.num(item.l * item.w * item.h)];
  },
  answer(item) {
    return [`${item.l} × ${item.w} × ${item.h} = ${item.l * item.w * item.h} ${cube}`];
  },
};

const volPrism = {
  id: "vol-prism",
  group: "vol",
  label: "Volume of a triangular prism",
  blurb: "The triangle's area is the layer; the length is how many layers.",
  heading: "The volume of a triangular prism",
  instruction: () =>
    "Any prism: volume = area of the base × length. For a triangle base the area is half of " +
    "base × height.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [a, b] = r.pick(TRIPLES);
    const [lo, hi] = sizes(o);
    return { a, b, L: r.int(lo + 2, hi + 2) };
  },
  render(item) {
    return art(triPrismFig(item.a, item.b, null, `${item.L}`)) +
      ask(`Base area ${box()} ${sq}`) + ask(`Volume ${box()} ${cube}`);
  },
  key(item) {
    const B = (item.a * item.b) / 2;
    return [want.num(B), want.num(B * item.L)];
  },
  answer(item) {
    const B = (item.a * item.b) / 2;
    return [`½ × ${item.a} × ${item.b} = ${B}; ${B} × ${item.L} = ${B * item.L} ${cube}`];
  },
};

const volPyramid = {
  id: "vol-pyramid",
  group: "vol",
  label: "Volume of a pyramid",
  blurb: "A third of the prism with the same base and height.",
  heading: "The volume of a pyramid",
  instruction: () =>
    "A pyramid holds exactly a third of the prism with the same base and height — three of " +
    "them fill it. So volume = ⅓ × base area × height.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [lo, hi] = sizes(o);
    const b = r.int(lo, hi);
    let h = r.int(lo, hi + 3);
    while ((b * b * h) % 3) h++;
    return { b, h };
  },
  render(item) {
    const p = pyramid(regularBase(4, 20), 30);
    return art(solidSvg(p, { box: { w: 52, h: 46 }, dims: [{ a: 0, b: 1, text: `${item.b}` }] })) +
      `<p class="wb-ask gw-note">square base ${item.b} ${unit} · height ${item.h} ${unit}</p>` +
      ask(`⅓ × ${box()} × ${box()} = ${box()} ${cube}`);
  },
  key(item) {
    return [want.num(item.b * item.b), want.num(item.h), want.num((item.b * item.b * item.h) / 3)];
  },
  answer(item) {
    return [`⅓ × ${item.b * item.b} × ${item.h} = ${(item.b * item.b * item.h) / 3} ${cube}`];
  },
};

const volThird = {
  id: "vol-third",
  group: "vol",
  label: "Three pyramids fill the prism",
  blurb: "Same base, same height: the pyramid is a third, the prism is three times.",
  heading: "Pyramid and prism with the same base and height",
  instruction: () =>
    "A pyramid and a prism with the same base and the same height: pour the pyramid full of " +
    "sand into the prism three times and it is full.",
  cols: 2,
  defaultCount: 4,
  make(r) {
    const pyr = r.int(4, 40);
    return { pyr, ask: r.pick(["prism", "pyramid"]) };
  },
  render(item) {
    return item.ask === "prism"
      ? ask(`The pyramid holds <b>${item.pyr} ${cube}</b>. The prism holds ${box()} ${cube}.`)
      : ask(`The prism holds <b>${item.pyr * 3} ${cube}</b>. The pyramid holds ${box()} ${cube}.`);
  },
  key(item) {
    return [want.num(item.ask === "prism" ? item.pyr * 3 : item.pyr)];
  },
  answer(item) {
    return [item.ask === "prism" ? `${item.pyr} × 3 = ${item.pyr * 3} ${cube}` : `${item.pyr * 3} ÷ 3 = ${item.pyr} ${cube}`];
  },
};

/* ═══ 11. real-world practicals ════════════════════════════════════════════*/

const REAL = [
  (r) => { const l = r.int(4, 9) * 10, w = r.int(3, 6) * 10, h = r.int(3, 6) * 10; const L = (l * w * h) / 1000;
    return { text: `A fish tank is ${l} cm long, ${w} cm wide and ${h} cm tall. How many litres of water does it hold when full? (1 litre = 1000 cm³)`, want: [L], ans: `${l} × ${w} × ${h} = ${l * w * h} cm³ = ${L} litres` }; },
  (r) => { const [a, b, c] = r.pick(TRIPLES.slice(0, 1)); const L = r.int(4, 9); const area = (a + b + c) * L;
    return { text: `A big tent is a triangular prism ${L} m long. Its triangle ends have sides of ${a} m, ${b} m and ${c} m. The floor and the two sloping sides are rectangles of canvas. How many square metres of canvas are they altogether?`, want: [area], ans: `(${a} + ${b} + ${c}) × ${L} = ${area} m²` }; },
  (r) => { const l = r.int(10, 30), w = r.int(8, 20), h = r.int(5, 12); const sa = 2 * (l * w + l * h + w * h);
    return { text: `A gift box is ${l} cm by ${w} cm by ${h} cm. How much wrapping paper covers it exactly, with no overlap?`, want: [sa], ans: `2 × (${l * w} + ${l * h} + ${w * h}) = ${sa} cm²` }; },
  (r) => { const b = r.int(4, 10), s = r.int(3, 8) * 2; const t = 2 * b * s;
    return { text: `A roof is a square pyramid on a ${b} m by ${b} m house. Each triangle has a slant height of ${s} m. How many square metres of tiles cover the four triangles?`, want: [t], ans: `4 × ½ × ${b} × ${s} = ${t} m²` }; },
  (r) => { const [a, b] = r.pick(TRIPLES); const L = r.int(10, 30); const v = (a * b * L) / 2;
    return { text: `A chocolate box is a triangular prism ${L} cm long. Its end is a right-angled triangle with the two short sides ${a} cm and ${b} cm. What is its volume?`, want: [v], ans: `½ × ${a} × ${b} × ${L} = ${v} cm³` }; },
  (r) => { const l = r.int(3, 8), w = r.int(2, 5), d = r.int(1, 2); const v = l * w * d;
    return { text: `A pool is ${l} m long, ${w} m wide and ${d} m deep. How many cubic metres of water fill it?`, want: [v], ans: `${l} × ${w} × ${d} = ${v} m³` }; },
];
const realWords = {
  id: "real-words",
  group: "real",
  label: "Real-world practicals",
  blurb: "Tanks, tents, boxes and roofs: decide whether it is area or volume first.",
  heading: "Real-world practicals",
  instruction: () =>
    "First decide: is this about covering the outside (surface area, square units) or filling " +
    "the inside (volume, cubic units)? Then work it out.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    if (i === 0 || !this.order) this.order = r.shuffle(REAL.map((_, j) => j));
    return REAL[this.order[i % REAL.length]](r);
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead gw-word">${item.text}</p>` +
      `<span class="wb-workbox" style="--wb-lines:3"><span class="wb-workbox__rule" style="top:33.3%"></span><span class="wb-workbox__rule" style="top:66.6%"></span></span>` +
      ask(slot("Answer"));
  },
  key(item) {
    return [want.nums(...item.want)];
  },
  answer(item) {
    return [item.ans];
  },
};

const realMeasure = {
  id: "real-measure",
  group: "real",
  label: "Measure a real box",
  blurb: "Find a box at home or in class, measure it, and work out both.",
  heading: "Measure a real box",
  instruction: () =>
    "Find a real box — a cereal box, a shoe box, a tissue box. Measure its length, width and " +
    "height with a ruler, to the nearest centimetre, then work out its surface area and volume.",
  cols: 1,
  defaultCount: 1,
  make() { return {}; },
  render() {
    return ask(`${slot("Length", " cm")}${slot("Width", " cm")}${slot("Height", " cm")}`) +
      ask(`${slot("Surface area", " cm²")}${slot("Volume", " cm³")}`);
  },
  /* the child's own box: only the grown-up can check it */
  key() {
    return [want.free(), want.free(), want.free(), want.free(), want.free()];
  },
  answer() {
    return ["depends on the box — surface area 2(lw + lh + wh), volume l × w × h"];
  },
};

/* ═══ 12. one base open ════════════════════════════════════════════════════*/

const openBox = {
  id: "open-box",
  group: "open1",
  label: "An open box",
  blurb: "A box with no lid: five faces, and one less rectangle of card.",
  heading: "A box with no lid",
  instruction: () =>
    "An open box has lost its top. Count the faces that are left, and work out the card it " +
    "needs: the surface area of the whole box, less the lid.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const [lo, hi] = sizes(o);
    return { l: r.int(lo + 1, hi + 1), w: r.int(lo, hi), h: r.int(lo, hi) };
  },
  render(item) {
    const s = prism(rectBase(item.l * 4, item.w * 4), item.h * 4);
    const open = without(s, [1]); // the top base
    return side(
      art(solidSvg(open, { pitch: 30, box: { w: 58, h: 48 }, dims: [{ a: 4, b: 5, text: `${item.l}` }, { a: 5, b: 6, text: `${item.w}` }, { up: true, text: `${item.h}` }] })),
      ask(num("Faces")) + ask(`Card: ${box()} ${sq}`)
    );
  },
  key(item) {
    const { l, w, h } = item;
    return [want.num(5), want.num(l * w + 2 * l * h + 2 * w * h)];
  },
  answer(item) {
    const { l, w, h } = item;
    return [`5 faces; ${l * w} + 2 × ${l * h} + 2 × ${w * h} = ${l * w + 2 * l * h + 2 * w * h} ${sq}`];
  },
};

const openPyr = {
  id: "open-count",
  group: "open1",
  label: "Take a base away",
  blurb: "Any solid with one base gone — the faces, the edges, the corners that are left.",
  heading: "One base taken away",
  instruction: () =>
    "One base has been taken off. The corners and edges are all still there — only a face " +
    "has gone. Count what is left.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { kind: r.pick(["prism", "pyramid"]), n: r.pick(sidesOf(o)) };
  },
  render(item) {
    const s = makeSolid(item.kind, item.n);
    const open = without(s, [item.kind === "prism" ? 1 : 0]);
    return art(solidSvg(open, { pitch: item.kind === "pyramid" ? -22 : 30, box: FIG })) +
      ask(`${num("Faces")}${num("Edges")}${num("Corners")}`);
  },
  key(item) {
    const c = counts(item.kind, item.n);
    return [want.num(c.F - 1), want.num(c.E), want.num(c.V)];
  },
  answer(item) {
    const c = counts(item.kind, item.n);
    return [`${c.F - 1} faces, ${c.E} edges, ${c.V} corners`];
  },
};

/* ═══ 13. both bases open ══════════════════════════════════════════════════*/

const tube = {
  id: "tube",
  group: "open2",
  label: "A tube: both ends open",
  blurb: "A prism with no ends is only its side faces — perimeter × length.",
  heading: "A tube with both ends open",
  instruction: () =>
    "With both bases gone only the side faces are left. Unrolled they are one rectangle: " +
    "the perimeter of the end, times the length.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const n = r.pick(sidesOf(o));
    const [lo, hi] = sizes(o);
    return { n, a: r.int(lo, hi), L: r.int(lo + 3, hi + 6) };
  },
  render(item) {
    const s = lieDown(without(prism(regularBase(item.n, 12), 40), [0, 1]));
    return art(solidSvg(s, { yaw: 55, pitch: 18, box: { w: 62, h: 40 } })) +
      ask(`Each side of the end is ${item.a} ${unit}; it is ${item.L} ${unit} long.`) +
      ask(`${num("Faces")}`) + ask(`Area ${box()} ${sq}`);
  },
  key(item) {
    return [want.num(item.n), want.num(item.n * item.a * item.L)];
  },
  answer(item) {
    return [`${item.n} faces; ${item.n} × ${item.a} × ${item.L} = ${item.n * item.a * item.L} ${sq}`];
  },
};

/* ═══ 14. the frustum ══════════════════════════════════════════════════════*/

const frCount = {
  id: "fr-count",
  group: "frustum",
  label: "What is a frustum?",
  blurb: "A pyramid with its top sliced off level: two bases, trapezium sides.",
  heading: "Faces, edges and corners of a frustum",
  instruction: () =>
    "A frustum is what is left of a pyramid when the top is cut off level. It has two bases " +
    "(the same shape, different sizes) and a trapezium for every side. Count.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { n: r.pick(sidesOf(o)), yaw: yawOf(r) };
  },
  render(item) {
    return art(solidSvg(makeSolid("frustum", item.n), { yaw: item.yaw, show: "solid", dots: true, box: FIG })) +
      ask(`${num("Faces")}${num("Edges")}${num("Corners")}`) + tick("rectangles", "triangles", "trapezia");
  },
  key(item) {
    const c = counts("frustum", item.n);
    return [want.num(c.F), want.num(c.E), want.num(c.V), want.tick(2)];
  },
  answer(item) {
    const c = counts("frustum", item.n);
    return [`${c.F} faces, ${c.E} edges, ${c.V} corners; the sides are trapezia`];
  },
};

const frArea = {
  id: "fr-area",
  group: "frustum",
  label: "Surface area of a frustum",
  blurb: "Two squares and four trapezia — each trapezium is half the two parallel sides × the slant.",
  heading: "The surface area of a square frustum",
  instruction: () =>
    "Big square + small square + four trapezia. A trapezium's area is half of (the two " +
    "parallel sides added) × the slant height.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const g = levelOf(o).id === "gentle";
    const a = r.int(g ? 4 : 6, g ? 8 : 14);
    const b = r.int(2, a - 2);
    let s = r.int(g ? 2 : 3, g ? 6 : 9);
    if (((a + b) * s) % 2) s++;
    return { a, b, s };
  },
  render(item, o) {
    const rows = [
      { name: "the big square", count: 1, one: item.a * item.a },
      { name: "the small square", count: 1, one: item.b * item.b },
      { name: "the trapezia", count: 4, one: ((item.a + item.b) * item.s) / 2 },
    ];
    return art(frustumNet(item.a, item.b, item.s, { box: { w: 52, h: 52 } })) +
      `<p class="wb-ask gw-note">big square ${item.a} · small square ${item.b} · slant ${item.s} (${unit})</p>` + areaTable(rows, o);
  },
  key(item, o) {
    return areaKey([
      { count: 1, one: item.a * item.a }, { count: 1, one: item.b * item.b }, { count: 4, one: ((item.a + item.b) * item.s) / 2 },
    ], o);
  },
  answer(item) {
    const t = ((item.a + item.b) * item.s) / 2;
    return [`${item.a * item.a} + ${item.b * item.b} + 4 × ${t} = ${item.a * item.a + item.b * item.b + 4 * t} ${sq}`];
  },
};

const frVolume = {
  id: "fr-volume",
  group: "frustum",
  label: "Volume of a frustum",
  blurb: "The whole pyramid, less the little one cut off the top.",
  heading: "The volume of a frustum",
  instruction: () =>
    "A frustum is a big pyramid with a small one taken off the top. Work out both volumes " +
    "(⅓ × base area × height) and take the small one away.",
  cols: 1,
  defaultCount: 2,
  make(r) {
    /* similar pyramids: the small one's base and height are k/K of the big one's */
    const K = r.pick([2, 3]);
    const b = r.int(2, 4);            // small base edge
    const hs = r.pick([3, 6]);        // small height
    return { B: b * K, H: hs * K, b, h: hs };
  },
  render(item) {
    return side(art(solidSvg(makeSolid("frustum", 4), { show: "solid", box: { w: 50, h: 44 } })),
      ask(`Whole pyramid: square base ${item.B} ${unit}, height ${item.H} ${unit}.`) +
      ask(`Cut off: square base ${item.b} ${unit}, height ${item.h} ${unit}.`) +
      ask(`Big ${box()} ${cube} − small ${box()} ${cube}`) + ask(`= ${box()} ${cube}`));
  },
  key(item) {
    const big = (item.B * item.B * item.H) / 3;
    const smallV = (item.b * item.b * item.h) / 3;
    return [want.num(big), want.num(smallV), want.num(big - smallV)];
  },
  answer(item) {
    const big = (item.B * item.B * item.H) / 3;
    const smallV = (item.b * item.b * item.h) / 3;
    return [`${big} − ${smallV} = ${big - smallV} ${cube}`];
  },
};

export const SOLID_EXERCISES = [
  fevCount, fevWhich,
  stickCount, stickWhich,
  surfCount, surfRoll,
  baseWhich, baseCount,
  ppbTick, ppbName,
  ppsShape, ppsFromBase,
  netWhich, netCube,
  rulePrism, rulePyramid, ruleUse, ruleEuler,
  saCuboid, saTri, saPyramid, saFormula,
  volCubes, volCuboid, volPrism, volPyramid, volThird,
  realWords, realMeasure,
  openBox, openPyr,
  tube,
  frCount, frArea, frVolume,
];
