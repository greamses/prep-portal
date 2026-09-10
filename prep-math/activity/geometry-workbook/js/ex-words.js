/* ============================================================================
   Geometry Workbook — WORD PROBLEMS
   ----------------------------------------------------------------------------
   The same facts, with the picture taken away and a sentence put in its place.
   That is the whole difficulty of a word problem: nothing new is being taught,
   but the child has to decide which fact the sentence is about, and the
   diagram that used to decide it for them is gone.

   So every problem here is about exactly ONE of the facts the sections above
   taught, and they are dealt so a page mixes them — a page of six triangle
   problems in a row is six sums, not six decisions.

   Each problem comes with a ruled box for the working. "Show your working" in
   an empty space gets one line in the middle; rules say how much is expected.
   Contexts are ordinary things with corners — a roof, a tile, a field, a
   ladder — so the sentence is never harder to picture than the geometry.
   ========================================================================== */

import { NAMES, aName } from "./figure.js";
import { levelOf, stepped, triangleAngles, regularFor, sidesFor } from "./levels.js";

const box = () => `<span class="wb-answer"></span>`;
const rank = (o) => ({ gentle: 0, middle: 1, stretch: 2 }[levelOf(o).id] ?? 0);
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/* The problems. Each says the lowest level it belongs at, makes its own
   numbers off the seeded stream, and returns the sentence and the answer. */
const BANK = [
  {
    min: 0,
    make(r, o) {
      const [a, b, c] = triangleAngles(r, o);
      return {
        text: `A roof frame is a triangle. Two of its corners are ${a}° and ${b}°. What is the third corner?`,
        ans: `${c}°  (180 − ${a} − ${b})`,
      };
    },
  },
  {
    min: 0,
    make(r, o) {
      const b = stepped(r, o, 30, 75);
      const t = 180 - 2 * b;
      return {
        text: `Seen from the front, a tent is an isosceles triangle. The angle at the top is ${t}°. What are the two angles at the bottom?`,
        ans: `${b}° each  ((180 − ${t}) ÷ 2)`,
      };
    },
  },
  {
    min: 0,
    make(r, o) {
      const n = r.pick(regularFor(o));
      const thing = r.pick(["floor tile", "window", "badge", "table top", "garden bed"]);
      const each = ((n - 2) * 180) / n;
      return {
        text: `A ${thing} is shaped like a regular ${NAMES[n]}. What is the size of each of its corners?`,
        ans: `${each}°  (${(n - 2) * 180} ÷ ${n})`,
      };
    },
  },
  {
    min: 0,
    make(r, o) {
      const n = r.pick(sidesFor(o));
      return {
        text: `A school field has ${n} straight sides. What do all its corners add up to?`,
        ans: `${(n - 2) * 180}°  ((${n} − 2) × 180)`,
      };
    },
  },
  {
    min: 0,
    make(r, o) {
      /* Three corners drawn, the fourth whatever is left of 360 — redrawn
         until the fourth is a corner a real field could have. */
      let a;
      let b;
      let c;
      let d;
      let guard = 0;
      do {
        a = stepped(r, o, 70, 110);
        b = stepped(r, o, 70, 110);
        c = stepped(r, o, 70, 110);
        d = 360 - a - b - c;
      } while ((d < 50 || d > 140) && ++guard < 60);
      return {
        text: `A farm plot has four straight sides. Three of its corners are ${a}°, ${b}° and ${c}°. What is the fourth corner?`,
        ans: `${d}°  (360 − ${a + b + c})`,
      };
    },
  },
  {
    min: 1,
    make(r, o) {
      const a = stepped(r, o, 55, 80);
      return {
        text: `A ladder leans against a wall and makes an angle of ${a}° with the ground. The wall meets the ground at a right angle. What angle does the ladder make with the wall?`,
        ans: `${90 - a}°  (90 − ${a})`,
      };
    },
  },
  {
    min: 1,
    make(r, o) {
      const [a, , c] = triangleAngles(r, o);
      return {
        text: `One side of a triangular garden is carried on as a straight path. The two corners of the garden furthest from where the path starts are ${a}° and ${c}°. What angle does the path make with the garden's other side?`,
        ans: `${a + c}°  (the outside angle is the two far corners added: ${a} + ${c})`,
      };
    },
  },
  {
    min: 1,
    make(r, o) {
      const n = r.pick(regularFor(o).filter((m) => m >= 4));
      const each = ((n - 2) * 180) / n;
      return {
        text: `Every corner of a regular shape measures ${each}°. How many sides does it have?`,
        ans: `${n} — ${aName(n)}  (outside angle ${180 - each}°, 360 ÷ ${180 - each})`,
      };
    },
  },
  {
    min: 1,
    make(r, o) {
      const n = r.pick(sidesFor(o));
      return {
        text: `The corners of a shape add up to ${(n - 2) * 180}°. How many sides does it have?`,
        ans: `${n}  (${(n - 2) * 180} ÷ 180 = ${n - 2}, then + 2)`,
      };
    },
  },
  {
    min: 1,
    make() {
      return {
        text: `An equilateral triangle has all three sides the same length. What is each of its angles, and what is each angle outside it?`,
        ans: `60° inside, 120° outside`,
      };
    },
  },
  {
    min: 2,
    make(r) {
      const set = r.pick([[1, 2, 3], [1, 1, 2], [2, 3, 4], [1, 2, 6], [3, 4, 5], [1, 3, 5]]);
      const x = 180 / set.reduce((s, c) => s + c, 0);
      const said = set.map((c) => (c === 1 ? "x" : `${c}x`)).join(", ").replace(/, ([^,]*)$/, " and $1");
      return {
        text: `The angles of a triangle are ${said}. Find x, and the size of each angle.`,
        ans: `x = ${x}°; the angles are ${set.map((c) => c * x + "°").join(", ")}`,
      };
    },
  },
  {
    min: 2,
    make(r) {
      const set = r.pick([[1, 2, 3, 4], [1, 1, 2, 2], [2, 3, 3, 4], [1, 2, 3, 3], [2, 3, 4, 6]]);
      const x = 360 / set.reduce((s, c) => s + c, 0);
      const said = set.map((c) => (c === 1 ? "x" : `${c}x`)).join(", ").replace(/, ([^,]*)$/, " and $1");
      return {
        text: `The four angles of a quadrilateral are ${said}. Find x, and the size of each angle.`,
        ans: `x = ${x}°; the angles are ${set.map((c) => c * x + "°").join(", ")}`,
      };
    },
  },
];

let order = null;

export const WORD_GROUPS = [
  {
    id: "geo-words",
    label: "Word problems",
    blurb: "The same facts with the picture taken away — the skill is choosing which one.",
  },
];

const geoWords = {
  id: "geo-words",
  group: "geo-words",
  label: "Word problems",
  blurb: "Roofs, tiles, fields and ladders. One fact each, dealt so a page mixes them.",
  heading: "Word problems",
  instruction: () =>
    "Read it twice. Decide which fact it is about — a triangle's 180°, a shape's " +
    "total, a straight line, a regular shape — and draw a quick sketch if it helps.",
  cols: 1,
  defaultCount: 6,
  /* Dealt from the problems this level may use, shuffled once on the first
     question, so six problems are six different kinds. */
  make(r, o, k, i) {
    const allowed = BANK.filter((p) => p.min <= rank(o));
    if (i === 0 || !order) order = r.shuffle(allowed.map((_, j) => j));
    const p = allowed[order[i % order.length]];
    return p.make(r, o);
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead gw-word">${item.text}</p>` +
      `<span class="wb-work" style="--wb-lines:3">` +
      `<span class="wb-work__rule" style="top:33.3%"></span>` +
      `<span class="wb-work__rule" style="top:66.6%"></span></span>` +
      `<p class="wb-ask"><span class="wb-slot"><em>Answer</em>${box()}</span></p>`
    );
  },
  answer(item) {
    return [cap(item.ans)];
  },
};

export const WORD_EXERCISES = [geoWords];
