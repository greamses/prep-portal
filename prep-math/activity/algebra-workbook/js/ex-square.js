/* ============================================================================
   Algebra Workbook — CHAPTER 8: completing the square
   ----------------------------------------------------------------------------
   x² + 6x is not a square. It is a square of side x with two strips of 3 x
   laid along two of its sides, and a corner missing. Fill that corner — 3 by
   3, nine ones — and the whole thing IS a square, of side x + 3. Everything in
   this chapter is that one picture:

     read a square      a square already made of tiles: what is its side, and
                        what does that say about x² + 6x + 9?
     fill the corner    the x² and the strips are laid; drag ones into the
                        corner until the square is finished, and count them
     lay it all out     an empty frame and an expression: lay the x², split the
                        x into halves along two sides, and fill the corner
     write it down      no tiles: halve the middle number, square it, and say
                        what the bracket is — including halves at Stretch
     a minus middle     x² − 6x + 9 is (x − 3)²: the strips are turned round
                        and the corner is still a plus
     solve with it      (Middle+) x² + 6x + 5 = 0 becomes (x + 3)² = 4, and a
                        number whose square is 4 is 2 or −2 — so x is −1 or −5

   The tiles are the shared piece (utils/components/workbook/tiles.js): the
   tray's three tiles copy themselves, so a child takes as many ones as the
   corner needs — which is how they find out how many that is.
   ========================================================================== */

import { tilesHtml, needsOf } from "/utils/components/workbook/tiles.js";
import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const art = (html) => `<div class="ab-art">${html}</div>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const side = (a, b) => `<div class="fn-side">${a}<div class="fn-lines">${b}</div></div>`;

const tier = (o) => levelOf(o).id;
const half = (n) => (Number.isInteger(n / 2) ? String(n / 2) : String(n / 2));

/** How big a square this level builds: (x + a). */
const sideOf = (r, o) => r.int(1, { gentle: 3, middle: 4, stretch: 5 }[tier(o)] || 3);

export const SQ2_GROUPS = [
  { id: "cs-tiles", chapter: "Chapter 8 · Completing the square", label: "The square in the tiles", blurb: "x² and two strips, and a corner waiting to be filled." },
  { id: "cs-write", label: "Writing it down", blurb: "Halve the middle number, square it — and that is the corner." },
];

/* ═══ 1. read a square that is already made ════════════════════════════════*/

const csSee = {
  id: "cs-see",
  group: "cs-tiles",
  label: "Read the finished square",
  blurb: "A square made of tiles: what is its side?",
  heading: "Read the square",
  instruction: () =>
    "The tiles make one big square. Its side is the x tile and the ones beside it: x and however many ones " +
    "lie along the edge. Count what the whole square is made of — one x², the strips, and the corner — and " +
    "you have written the same square two ways.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const a = sideOf(r, o);
    return { a };
  },
  render(item) {
    const { a } = item;
    const n = needsOf(a);
    return side(art(tilesHtml({ a, given: { x2: true, strips: true, ones: true }, label: `A square of side x + ${a}` })),
      ask(`Along one side: x and ${box()} ones.`) +
      eq(`x² + ${box()}x + ${box()} = (x + ${box()})²`) +
      ask(`It is made of one x², ${n.x} strips and ${n.one} ones.`));
  },
  worked() {
    return worked(art(tilesHtml({ a: 2, given: { x2: true, strips: true, ones: true } })) +
      say("Along the top: the x tile, then 2 ones — so the side is x + 2. The tiles are one x², 4 strips of x " +
        "and 4 ones: x² + 4x + 4. So x² + 4x + 4 = (x + 2)². Notice the 4 in the middle is TWICE the 2, and " +
        "the 4 at the end is the 2 SQUARED."));
  },
  key(item) {
    const { a } = item;
    return [want.num(a), want.num(2 * a), want.num(a * a), want.num(a)];
  },
  answer(item) {
    return [`x² + ${2 * item.a}x + ${item.a * item.a} = (x + ${item.a})²`];
  },
};

/* ═══ 2. fill the corner ═══════════════════════════════════════════════════*/

const csFill = {
  id: "cs-fill",
  group: "cs-tiles",
  label: "Fill the corner",
  blurb: "The x² and the strips are laid: how many ones finish it?",
  heading: "Complete the square",
  instruction: () =>
    "The x² tile and the strips of x are already laid — half of the x along the right, half along the bottom. " +
    "A corner is missing. On screen, drag ones out of the tray (each one copies itself, so there are as many " +
    "as you need) until the square is finished, then count them.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { a: sideOf(r, o) };
  },
  render(item) {
    const { a } = item;
    return side(art(tilesHtml({ a, given: { x2: true, strips: true }, label: "A square with its corner missing" })),
      eq(`x² + ${2 * a}x`) +
      ask(`Ones needed to finish it: ${box()}`) +
      eq(`x² + ${2 * a}x + ${box()} = (x + ${box()})²`));
  },
  worked() {
    return worked(art(tilesHtml({ a: 3, given: { x2: true, strips: true } })) +
      say("Six x, split into three along the right and three along the bottom. The corner they leave is 3 by 3, " +
        "so it takes 9 ones. x² + 6x + 9 = (x + 3)² — and 9 is 3 squared, where 3 is half of 6."));
  },
  key(item) {
    const { a } = item;
    return [
      want.tiles({ a, says: `${a * a} ones in the corner` }),
      want.num(a * a), want.num(a * a), want.num(a),
    ];
  },
  answer(item) {
    return [`${item.a * item.a} ones: x² + ${2 * item.a}x + ${item.a * item.a} = (x + ${item.a})²`];
  },
};

const csBuild = {
  id: "cs-build",
  group: "cs-tiles",
  label: "Lay it all out",
  blurb: "An empty frame: lay the x², split the x, fill the corner.",
  heading: "Build the square yourself",
  instruction: () =>
    "The frame is empty. Lay the x² tile in the big place, then split the x strips — half along the right and " +
    "half along the bottom, which is why the middle number is halved — and fill the corner with ones. Every " +
    "tile in the tray copies itself, so take as many as you need.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { a: sideOf(r, o) };
  },
  render(item) {
    const { a } = item;
    return side(art(tilesHtml({ a, label: "An empty frame" })),
      eq(`x² + ${2 * a}x + ${box()} = (x + ${box()})²`) +
      ask(`Strips along each side: ${box()}`));
  },
  key(item) {
    const { a } = item;
    return [
      want.tiles({ a, says: `one x², ${2 * a} strips (${a} each way) and ${a * a} ones` }),
      want.num(a * a), want.num(a), want.num(a),
    ];
  },
  answer(item) {
    return [`x² + ${2 * item.a}x + ${item.a * item.a} = (x + ${item.a})²`];
  },
};

const csMinus = {
  id: "cs-minus",
  group: "cs-tiles",
  label: "A minus middle",
  blurb: "x² − 6x + 9 is (x − 3)²: the strips are turned round.",
  heading: "A square with a minus middle",
  hardest: true,
  instruction: () =>
    "This time the middle is being taken away, so the strips are minus strips: turn each one round with its ± " +
    "handle (or shift-click it). The corner stays a plus — a minus times a minus is a plus — and the side is " +
    "x minus the number.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { a: sideOf(r, o) };
  },
  render(item) {
    const { a } = item;
    return side(art(tilesHtml({ a, given: { x2: true }, sign: -1, label: "A square with a minus middle" })),
      eq(`x² − ${2 * a}x + ${box()} = (x − ${box()})²`) +
      ask(`The corner is ${box()} by ${box()} ones.`));
  },
  worked() {
    return worked(say("x² − 6x: the six x are being taken away, so the strips are turned round — three minus " +
      "strips along the right, three along the bottom. The corner they leave is 3 by 3 = 9 ones, and those are " +
      "PLUS: x² − 6x + 9 = (x − 3)². Check it: (x − 3)(x − 3) = x² − 3x − 3x + 9."));
  },
  key(item) {
    const { a } = item;
    return [
      want.tiles({ a, sign: -1, says: `minus strips, and ${a * a} plus ones in the corner` }),
      want.num(a * a), want.num(a), want.num(a), want.num(a),
    ];
  },
  answer(item) {
    return [`x² − ${2 * item.a}x + ${item.a * item.a} = (x − ${item.a})²`];
  },
};

/* ═══ 3. writing it down ═══════════════════════════════════════════════════*/

const csWrite = {
  id: "cs-write",
  group: "cs-write",
  label: "Halve it and square it",
  blurb: "No tiles: half the middle number, squared, is the corner.",
  heading: "Complete the square in writing",
  instruction: (o) =>
    "Halve the middle number: that is what goes in the bracket. Square that half: that is what finishes the " +
    "square." + (tier(o) === "stretch" ? " An odd middle gives a half — 5 halved is 2.5, and 2.5 squared is 6.25." : ""),
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const t = tier(o);
    const odd = t === "stretch" && r.chance(0.4);
    const b = odd ? r.int(2, 9) * 2 + 1 : r.int(1, t === "gentle" ? 5 : 9) * 2;
    const minus = t !== "gentle" && r.chance(0.35);
    return { b, minus };
  },
  render(item) {
    const { b, minus } = item;
    return eq(`x² ${minus ? "−" : "+"} ${b}x + ${box()} = (x ${minus ? "−" : "+"} ${box()})²`);
  },
  worked() {
    return worked(say("x² + 10x + ▢: half of 10 is 5, so the bracket is (x + 5). Square that 5: 25 finishes the " +
      "square. x² + 10x + 25 = (x + 5)². The same either way round: x² − 10x + 25 = (x − 5)²."));
  },
  key(item) {
    const h = item.b / 2;
    return [want.num(h * h), want.num(h)];
  },
  answer(item) {
    const h = item.b / 2;
    return [`+ ${h * h}, (x ${item.minus ? "−" : "+"} ${half(item.b)})²`];
  },
};

const csSolve = {
  id: "cs-solve",
  group: "cs-write",
  label: "Solve by completing the square",
  blurb: "(x + 3)² = 4, so x + 3 is 2 or −2.",
  heading: "Solve it by completing the square",
  hardest: true,
  instruction: () =>
    "Complete the square on the left, keeping the equation true: add the corner to BOTH sides. Then a bracket " +
    "squared equals a number, and there are two numbers whose square is that — one plus, one minus. Take the " +
    "bracket's number off each to finish.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const t = tier(o);
    for (let g = 0; g < 200; g++) {
      const a = r.int(2, t === "middle" ? 5 : 7);
      const m = r.int(1, a - 1);
      const c = a * a - m * m;
      if (c <= 0) continue;
      return { a, m, c, roots: [-a + m, -a - m].sort((p, q) => p - q) };
    }
    return { a: 3, m: 2, c: 5, roots: [-5, -1] };
  },
  render(item) {
    const { a, c, m } = item;
    return eq(`x² + ${2 * a}x + ${c} = 0`) +
      eq(`(x + ${box()})² = ${box()}`) +
      ask(`x + ${a} is ${m} or −${m}, so x = ${box()} or ${box()}`);
  },
  worked() {
    return worked(say("x² + 6x + 5 = 0. Half of 6 is 3 and 3² is 9, so the square wants a 9 where the 5 is: " +
      "(x + 3)² = 9 − 5 = 4. A number whose square is 4 is 2 or −2, so x + 3 = 2 or x + 3 = −2, and x = −1 " +
      "or x = −5. Check the first: (−1)² + 6(−1) + 5 = 1 − 6 + 5 = 0."));
  },
  key(item) {
    const { a, m } = item;
    return [want.num(a), want.num(m * m), want.set(item.roots[0], item.roots[1])];
  },
  answer(item) {
    return [`(x + ${item.a})² = ${item.m * item.m}; x = ${item.roots[0]} or ${item.roots[1]}`];
  },
};

export const SQ2_EXERCISES = [csSee, csFill, csBuild, csMinus, csWrite, csSolve];
