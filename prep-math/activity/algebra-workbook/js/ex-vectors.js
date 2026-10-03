/* ============================================================================
   Algebra Workbook — CHAPTER 13: VECTORS
   ----------------------------------------------------------------------------
   A vector is a MOVE: so far across and so far up. It is written as a column,
   across on top and up underneath, and drawn as an arrow — the same arrow
   wherever it starts.

   THE BASICS
     read a vector         count the squares an arrow goes across and up
     where a move ends     a starting point and a vector: the end point
     adding, taking away   tops together, bottoms together
     a number times        both parts multiplied (and 2a − 3b)

   LENGTH AND DIRECTION
     length                Pythagoras: √(x² + y²)
     between two points    from A to B is B's coordinates take away A's
     parallel              one is a multiple of the other

   FURTHER
     the resultant         two arrows nose to tail: one move that does both
     i and j               3i − 4j is 3 across and 4 down
     dot product           (Middle+) tops multiplied + bottoms multiplied; 0
                           means the vectors are at right angles
     position vectors      (Stretch) from A to B is b − a; the midpoint is
                           half of a + b

   Lengths are made from whole-number right-angled triangles (3-4-5, 5-12-13
   …), so every answer is a whole number.
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq mt-eq">${html}</p>`;
const art = (html) => `<div class="ab-art">${html}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const side = (a, b) => `<div class="fn-side">${a}<div class="fn-lines">${b}</div></div>`;
const tier = (o) => levelOf(o).id;
const num = (n) => (n < 0 ? `−${-n}` : String(n));

/** A column vector in round brackets; parts are numbers or boxes. */
const col = (x, y) => `<span class="mt-mat vc-col wb-mathbox" style="grid-template-columns: auto">` +
  `<span class="mt-c">${typeof x === "number" ? num(x) : x}</span><span class="mt-c">${typeof y === "number" ? num(y) : y}</span></span>`;
const blank = () => col(box(), box());
const tx = (tex, text) => `<span data-tex="${tex}">${text}</span>`;
/** a bold letter for a vector, |a| for its length, AB with its arrow. */
const V = (L) => tx(`\\mathbf{${L}}`, L);
const LEN = (L) => tx(`|\\mathbf{${L}}|`, `|${L}|`);
const AB = (P, Q) => tx(`\\overrightarrow{${P}${Q}}`, `${P}${Q}`);

/** A part of a vector, by level: no minus at Gentle. */
const part = (r, t, big = 5) => (t === "gentle" ? r.int(1, big) : r.pick([...Array(big).keys()].flatMap((k) => [k + 1, -(k + 1)])));
const vec = (r, t, big) => [part(r, t, big), part(r, t, big)];
const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [9, 12, 15]];
function triple(r, t) {
  const [x, y, h] = r.pick(t === "gentle" ? TRIPLES.slice(0, 4) : TRIPLES);
  const s = () => (t === "gentle" ? 1 : r.pick([1, -1]));
  return { x: x * s(), y: y * s(), h };
}

/**
 * Arrows on squared paper. arrows: [{ from: [x, y], v: [dx, dy], name, col }].
 * The grid is fitted round them with a square to spare.
 */
function arrowsSvg(arrows, { dots = [] } = {}) {
  const pts = [...arrows.flatMap((a) => [a.from, [a.from[0] + a.v[0], a.from[1] + a.v[1]]]), ...dots.map((d) => d.at)];
  const x0 = Math.min(...pts.map((p) => p[0])) - 1, x1 = Math.max(...pts.map((p) => p[0])) + 1;
  const y0 = Math.min(...pts.map((p) => p[1])) - 1, y1 = Math.max(...pts.map((p) => p[1])) + 1;
  const c = Math.max(x1 - x0, y1 - y0) > 12 ? 3.4 : 4.6;
  const X = (x) => 2 + (x - x0) * c, Y = (y) => 2 + (y1 - y) * c;
  const f = (n) => (+n).toFixed(2);
  let s = "";
  for (let x = x0; x <= x1; x++) s += `<line x1="${f(X(x))}" y1="${f(Y(y0))}" x2="${f(X(x))}" y2="${f(Y(y1))}" stroke="#dcd6ca" stroke-width="0.25"/>`;
  for (let y = y0; y <= y1; y++) s += `<line x1="${f(X(x0))}" y1="${f(Y(y))}" x2="${f(X(x1))}" y2="${f(Y(y))}" stroke="#dcd6ca" stroke-width="0.25"/>`;
  const COLS = ["#2f6ea8", "#c0453f", "#3d8a4a"];
  arrows.forEach((a, k) => {
    const colr = a.col || COLS[k % COLS.length];
    const [ax, ay] = [X(a.from[0]), Y(a.from[1])];
    const [bx, by] = [X(a.from[0] + a.v[0]), Y(a.from[1] + a.v[1])];
    const L = Math.hypot(bx - ax, by - ay) || 1;
    const ux = (bx - ax) / L, uy = (by - ay) / L;
    const hx = bx - ux * 2.6, hy = by - uy * 2.6;
    s += `<line x1="${f(ax)}" y1="${f(ay)}" x2="${f(hx)}" y2="${f(hy)}" stroke="${colr}" stroke-width="0.7"${a.dash ? ' stroke-dasharray="1.6 1"' : ""}/>` +
      `<path d="M${f(bx)} ${f(by)}L${f(hx - uy * 1.2)} ${f(hy + ux * 1.2)}L${f(hx + uy * 1.2)} ${f(hy - ux * 1.2)}Z" fill="${colr}"/>`;
    if (a.name) s += `<text x="${f((ax + bx) / 2 - uy * 3)}" y="${f((ay + by) / 2 + ux * 3 + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="800" fill="${colr}">${a.name}</text>`;
  });
  dots.forEach((d) => {
    s += `<circle cx="${f(X(d.at[0]))}" cy="${f(Y(d.at[1]))}" r="0.9" fill="#2a2723"/>` +
      `<text x="${f(X(d.at[0]) + 1.4)}" y="${f(Y(d.at[1]) - 1.4)}" font-family="JetBrains Mono, monospace" font-size="3.2" font-weight="800" fill="#2a2723">${d.name}</text>`;
  });
  const W = 4 + (x1 - x0) * c, H = 4 + (y1 - y0) * c;
  return `<svg class="gr-fig" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" role="img" aria-label="Vectors drawn as arrows on squared paper">${s}</svg>`;
}

export const VC_GROUPS = [
  { id: "vc-basics", chapter: "Chapter 13 · Vectors", label: "Vectors: the basics", blurb: "A move across and up, written as a column and drawn as an arrow." },
  { id: "vc-length", label: "Length and direction", blurb: "Pythagoras for the length; a multiple for parallel." },
  { id: "vc-more", label: "Resultants, i and j, dot product", blurb: "Nose to tail; 3i − 4j; and when two vectors are at right angles." },
];

/* ═══ THE BASICS ═══════════════════════════════════════════════════════════*/

const vcRead = {
  id: "vc-read",
  group: "vc-basics",
  label: "Read a vector off the grid",
  blurb: "Squares across on top, squares up underneath.",
  heading: "Vectors: reading an arrow",
  instruction: () =>
    "Follow the arrow from its tail to its head. Count how many squares it goes ACROSS (right is plus, left is " +
    "minus) and write that on top; count how many it goes UP (down is minus) and write that underneath.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    return { a: vec(r, t), b: vec(r, t) };
  },
  render(item) {
    const { a, b } = item;
    return side(art(arrowsSvg([{ from: [0, 0], v: a, name: "a" }, { from: [Math.max(a[0], 0) + 2 + Math.max(-b[0], 0), 0], v: b, name: "b" }])),
      eq(`${V("a")} = ${blank()} &nbsp; ${V("b")} = ${blank()}`));
  },
  worked() {
    return worked(side(art(arrowsSvg([{ from: [0, 0], v: [3, 2], name: "a" }])), eq(`${V("a")} = ${col(3, 2)}`)) +
      say("From tail to head the arrow goes 3 squares right and 2 squares up: 3 on top, 2 underneath."));
  },
  key: (item) => [...item.a, ...item.b].map((v) => want.num(v)),
  answer: (item) => [`a = (${num(item.a[0])}, ${num(item.a[1])}), b = (${num(item.b[0])}, ${num(item.b[1])})`],
};

const vcEnd = {
  id: "vc-end",
  group: "vc-basics",
  label: "Where a move ends",
  blurb: "Start point + vector = end point.",
  heading: "Vectors: where does it end?",
  instruction: () =>
    "A vector moves a point. Add its top number to the point's x, and its bottom number to the point's y: that " +
    "is where the point ends up.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    return { p: [r.int(t === "gentle" ? 0 : -4, 5), r.int(t === "gentle" ? 0 : -4, 5)], v: vec(r, t) };
  },
  render(item) {
    return eq(`(${num(item.p[0])}, ${num(item.p[1])}) moved by ${col(...item.v)} ends at (${box()}, ${box()})`);
  },
  worked() {
    return worked(eq(`(2, 1) moved by ${col(3, -2)} ends at (5, −1)`) + say("2 + 3 = 5 across, and 1 + (−2) = −1 up."));
  },
  key: (item) => [want.num(item.p[0] + item.v[0]), want.num(item.p[1] + item.v[1])],
  answer: (item) => [`(${num(item.p[0] + item.v[0])}, ${num(item.p[1] + item.v[1])})`],
};

const vcAdd = {
  id: "vc-add",
  group: "vc-basics",
  label: "Adding and taking away",
  blurb: "Tops together, bottoms together.",
  heading: "Vectors: adding and taking away",
  instruction: () =>
    "To add two vectors, add the top numbers and add the bottom numbers — two moves one after the other. Taking " +
    "away works the same way: top take away top, bottom take away bottom.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    return { a: vec(r, t, 7), b: vec(r, t, 7), s: r.chance(0.5) ? 1 : -1 };
  },
  render(item) {
    return eq(`${col(...item.a)} ${item.s > 0 ? "+" : "−"} ${col(...item.b)} = ${blank()}`);
  },
  worked() {
    return worked(eq(`${col(3, 2)} + ${col(1, -5)} = ${col(4, -3)}`) + say("3 + 1 = 4 on top; 2 + (−5) = −3 underneath."));
  },
  key: (item) => [want.num(item.a[0] + item.s * item.b[0]), want.num(item.a[1] + item.s * item.b[1])],
  answer: (item) => [`(${num(item.a[0] + item.s * item.b[0])}, ${num(item.a[1] + item.s * item.b[1])})`],
};

const vcScalar = {
  id: "vc-scalar",
  group: "vc-basics",
  label: "A number times a vector",
  blurb: "Both parts multiplied: the same direction, k times as long.",
  heading: "Vectors: multiplying by a number",
  instruction: () =>
    "A number in front of a vector multiplies BOTH parts: 3a is three of the move a, end to end — the same " +
    "direction, three times as long. A minus number turns it round. For 2a − 3b, multiply first, then take away.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    return { a: vec(r, t), b: vec(r, t), k: r.int(2, 4), m: t === "gentle" ? 0 : r.pick([-3, -2, -1, 1, 2]) };
  },
  render(item) {
    const { a, b, k, m } = item;
    const what = m === 0 ? `${k}${V("a")}` : `${k}${V("a")} ${m < 0 ? "−" : "+"} ${Math.abs(m) === 1 ? "" : Math.abs(m)}${V("b")}`;
    return eq(`${V("a")} = ${col(...a)}${m === 0 ? "" : ` &nbsp; ${V("b")} = ${col(...b)}`} &nbsp; ${what} = ${blank()}`);
  },
  worked() {
    return worked(eq(`${V("a")} = ${col(2, -1)} &nbsp; 3${V("a")} = ${col(6, -3)}`) + say("3 × 2 = 6 and 3 × (−1) = −3."));
  },
  key: (item) => [0, 1].map((i) => want.num(item.k * item.a[i] + item.m * item.b[i])),
  answer: (item) => [`(${[0, 1].map((i) => num(item.k * item.a[i] + item.m * item.b[i])).join(", ")})`],
};

/* ═══ LENGTH AND DIRECTION ═════════════════════════════════════════════════*/

const vcMag = {
  id: "vc-mag",
  group: "vc-length",
  label: "The length of a vector",
  blurb: "Across and up are the two short sides: Pythagoras.",
  heading: "The length (magnitude) of a vector",
  instruction: () =>
    "A vector's two parts are the two short sides of a right-angled triangle, and the arrow is the long side. " +
    "So its length is √(x² + y²): square both parts (a square is never minus), add, and take the square root.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => triple(r, tier(o)),
  render(item) {
    return eq(`${V("a")} = ${col(item.x, item.y)} &nbsp; x² + y² = ${box()} &nbsp; ${LEN("a")} = ${box()}`);
  },
  worked() {
    return worked(eq(`${V("a")} = ${col(3, -4)}`) + say("3² + (−4)² = 9 + 16 = 25, and √25 = 5. The vector is 5 units long."));
  },
  key: (item) => [want.num(item.h * item.h), want.num(item.h)],
  answer: (item) => [`${item.x * item.x} + ${item.y * item.y} = ${item.h * item.h}; length ${item.h}`],
};

const vcBetween = {
  id: "vc-between",
  group: "vc-length",
  label: "From one point to another",
  blurb: "B's coordinates take away A's.",
  heading: "The vector from A to B",
  instruction: () =>
    "To get from A to B you go (B's x − A's x) across and (B's y − A's y) up. So the vector from A to B is B's " +
    "coordinates TAKE AWAY A's — where you finish, take away where you started. Then find how far it is.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const T = triple(r, t);
    const A = [r.int(t === "gentle" ? 0 : -5, 4), r.int(t === "gentle" ? 0 : -5, 4)];
    return { A, B: [A[0] + T.x, A[1] + T.y], T };
  },
  render(item) {
    const { A, B } = item;
    return eq(`A is (${num(A[0])}, ${num(A[1])}) and B is (${num(B[0])}, ${num(B[1])}).`) +
      eq(`${AB("A", "B")} = ${blank()} &nbsp; the distance AB = ${box()}`);
  },
  worked() {
    return worked(eq(`A is (1, 2) and B is (4, 6). &nbsp; ${AB("A", "B")} = ${col(3, 4)}`) +
      say("4 − 1 = 3 across and 6 − 2 = 4 up. Its length is √(9 + 16) = 5."));
  },
  key: (item) => [want.num(item.T.x), want.num(item.T.y), want.num(item.T.h)],
  answer: (item) => [`(${num(item.T.x)}, ${num(item.T.y)}); ${item.T.h}`],
};

const PAR = ["parallel", "not parallel"];

const vcParallel = {
  id: "vc-parallel",
  group: "vc-length",
  label: "Parallel vectors",
  blurb: "One is a number times the other.",
  heading: "Parallel vectors",
  instruction: () =>
    "Two vectors are PARALLEL when one is a number times the other — both parts multiplied by the SAME number. " +
    "Divide top by top and bottom by bottom: if the two answers are the same, they are parallel, and that " +
    "answer is the number.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const a = vec(r, t, 4);
    const k = r.pick(t === "gentle" ? [2, 3] : [-3, -2, 2, 3, 4]);
    const par = r.chance(0.6);
    const b = par ? [k * a[0], k * a[1]] : [k * a[0], k * a[1] + r.pick([-2, -1, 1, 2])];
    return { a, b, k, par };
  },
  render(item) {
    return eq(`${V("a")} = ${col(...item.a)} &nbsp; ${V("b")} = ${col(...item.b)}`) +
      eq(`top ÷ top = ${box()} &nbsp; so they are ${tick(...PAR)}`);
  },
  worked() {
    return worked(eq(`${V("a")} = ${col(2, 3)} &nbsp; ${V("b")} = ${col(6, 9)}`) +
      say("6 ÷ 2 = 3 and 9 ÷ 3 = 3 — the same, so b = 3a and they are parallel."));
  },
  key: (item) => [want.num(item.k), want.tick(item.par ? 0 : 1)],
  answer: (item) => [`top ÷ top = ${num(item.k)}; ${PAR[item.par ? 0 : 1]}`],
};

/* ═══ FURTHER ══════════════════════════════════════════════════════════════*/

const vcResult = {
  id: "vc-result",
  group: "vc-more",
  label: "The resultant",
  blurb: "Two arrows nose to tail: one move that does both.",
  heading: "The resultant of two vectors",
  instruction: () =>
    "Put the second arrow's tail on the first arrow's head. The single arrow from the very start to the very " +
    "end (drawn dashed) is the RESULTANT — one move that does the same as the two. Read all three off the grid, " +
    "and check: the resultant is the two added.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    for (;;) {
      const a = vec(r, t), b = vec(r, t);
      const s = [a[0] + b[0], a[1] + b[1]];
      /* a and b must not lie along one line, and must end somewhere new */
      if ((s[0] || s[1]) && a[0] * b[1] !== a[1] * b[0]) return { a, b, s };
    }
  },
  render(item) {
    const { a, b, s } = item;
    return side(art(arrowsSvg([{ from: [0, 0], v: a, name: "a" }, { from: a, v: b, name: "b" }, { from: [0, 0], v: s, name: "r", dash: true }])),
      eq(`${V("a")} = ${blank()} &nbsp; ${V("b")} = ${blank()}`) + eq(`${V("r")} = ${V("a")} + ${V("b")} = ${blank()}`));
  },
  key: (item) => [...item.a, ...item.b, ...item.s].map((v) => want.num(v)),
  answer: (item) => [`a (${item.a.map(num).join(", ")}), b (${item.b.map(num).join(", ")}), r (${item.s.map(num).join(", ")})`],
};

const vcIJ = {
  id: "vc-ij",
  group: "vc-more",
  label: "i and j",
  blurb: "i is one across, j is one up: 3i − 4j.",
  heading: "Vectors written with i and j",
  instruction: () =>
    "i is the vector one square ACROSS and j the vector one square UP. So 3i − 4j means 3 across and 4 down: it " +
    "is the column with 3 on top and −4 underneath. Write the column, then the length.",
  cols: 1,
  defaultCount: 4,
  make: (r, o) => triple(r, tier(o)),
  render(item) {
    const { x, y } = item;
    const ij = `${x === 1 ? "" : x === -1 ? "−" : num(x)}${V("i")} ${y < 0 ? "−" : "+"} ${Math.abs(y) === 1 ? "" : Math.abs(y)}${V("j")}`;
    return eq(`${V("a")} = ${ij} = ${blank()} &nbsp; ${LEN("a")} = ${box()}`);
  },
  worked() {
    return worked(eq(`${V("a")} = 3${V("i")} − 4${V("j")} = ${col(3, -4)}`) + say("3 across, 4 down. Length √(9 + 16) = 5."));
  },
  key: (item) => [want.num(item.x), want.num(item.y), want.num(item.h)],
  answer: (item) => [`(${num(item.x)}, ${num(item.y)}); length ${item.h}`],
};

const PERP = ["at right angles", "not at right angles"];

const vcDot = {
  id: "vc-dot",
  group: "vc-more",
  label: "The dot product",
  blurb: "Tops multiplied + bottoms multiplied; 0 means a right angle.",
  heading: "The dot product",
  hardest: true,
  instruction: () =>
    "The DOT PRODUCT of two vectors is a number: multiply the two tops, multiply the two bottoms, and add. When " +
    "it comes to 0, the two vectors are PERPENDICULAR — at right angles to each other.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const a = vec(r, t, 5);
    if (r.chance(0.45)) { const k = r.pick([1, 2, -1]); return { a, b: [-k * a[1], k * a[0]] }; }
    return { a, b: vec(r, t, 5) };
  },
  render(item) {
    return eq(`${V("a")} = ${col(...item.a)} &nbsp; ${V("b")} = ${col(...item.b)}`) +
      eq(`${tx("\\mathbf{a}\\cdot\\mathbf{b}", "a · b")} = ${box()} &nbsp; so they are ${tick(...PERP)}`);
  },
  worked() {
    return worked(eq(`${V("a")} = ${col(2, 3)} &nbsp; ${V("b")} = ${col(-3, 2)}`) +
      say("2 × (−3) + 3 × 2 = −6 + 6 = 0, so a and b are at right angles."));
  },
  key(item) {
    const d = item.a[0] * item.b[0] + item.a[1] * item.b[1];
    return [want.num(d), want.tick(d === 0 ? 0 : 1)];
  },
  answer(item) {
    const d = item.a[0] * item.b[0] + item.a[1] * item.b[1];
    return [`${num(d)}: ${PERP[d === 0 ? 0 : 1]}`];
  },
};

const vcPosition = {
  id: "vc-position",
  group: "vc-more",
  label: "Position vectors and the midpoint",
  blurb: "From A to B is b − a; the midpoint is half of a + b.",
  heading: "Position vectors",
  hardest: true,
  minLevel: "stretch",
  instruction: () =>
    "The POSITION VECTOR of a point is the vector from the origin O to it: A has position vector a, B has b. To " +
    "go from A to B, go back to O (−a) and out to B (+b): the vector is b − a. The MIDPOINT M of AB has position " +
    "vector ½(a + b) — the average of the two.",
  cols: 1,
  defaultCount: 3,
  make(r) {
    for (;;) {
      const a = [r.int(-6, 6), r.int(-6, 6)], b = [r.int(-6, 6), r.int(-6, 6)];
      if ((a[0] + b[0]) % 2 || (a[1] + b[1]) % 2 || (a[0] === b[0] && a[1] === b[1])) continue;
      return { a, b };
    }
  },
  render(item) {
    return eq(`${V("a")} = ${col(...item.a)} &nbsp; ${V("b")} = ${col(...item.b)}`) +
      eq(`${AB("A", "B")} = ${blank()} &nbsp; ${AB("O", "M")} = ${blank()}`);
  },
  worked() {
    return worked(eq(`${V("a")} = ${col(2, 1)} &nbsp; ${V("b")} = ${col(6, 5)}`) +
      say("From A to B: b − a = (6 − 2, 5 − 1) = (4, 4). The midpoint: ½(a + b) = ½(8, 6) = (4, 3)."));
  },
  key(item) {
    const { a, b } = item;
    return [b[0] - a[0], b[1] - a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2].map((v) => want.num(v));
  },
  answer(item) {
    const { a, b } = item;
    return [`AB (${num(b[0] - a[0])}, ${num(b[1] - a[1])}); OM (${num((a[0] + b[0]) / 2)}, ${num((a[1] + b[1]) / 2)})`];
  },
};

export const VC_EXERCISES = [vcRead, vcEnd, vcAdd, vcScalar, vcMag, vcBetween, vcParallel, vcResult, vcIJ, vcDot, vcPosition];
