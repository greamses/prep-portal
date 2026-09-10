/* ============================================================================
   Geometry Workbook — the TRIANGLE exercises
   ----------------------------------------------------------------------------
   Three families, all about one fact and the two things that follow from it.

   THE FACT: the angles inside a triangle add up to 180°. It is not told first
   and practised after — it is FOUND. A child measures three triangles with a
   protractor and notices the totals keep coming out at 180 (or 179, or 181,
   which is its own lesson about measuring). Then they tear the corners off a
   paper triangle and lay them on a straight line, and the three fit exactly,
   which is the same fact in a form nobody can argue with. Only then is it a
   rule.

   WHAT FOLLOWS INSIDE: a missing angle is 180 minus the other two. Then the
   triangles that hand you a second fact for free — an isosceles triangle's
   two base angles are equal, a right-angled triangle already has 90 in it.

   WHAT FOLLOWS OUTSIDE: carry a side on past a corner and the angle outside
   is 180 minus the one inside (a straight line), which is the same as the two
   FAR angles added together — and going all the way round the outside, the
   three turns make one whole turn, 360°.
   ========================================================================== */

import {
  figureSvg, trianglePoints, regularPoints, tearTriangle, pasteLine, cornersOnLine, NAMES,
} from "./figure.js";
import { levelOf, helpOf, stepped, triangleAngles, dealer, regularFor } from "./levels.js";
import { protractorSvg } from "../../maths-workbook/js/protractor.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const deg = (label) => `<span class="wb-slot"><em>${label}</em>${box()}°</span>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;

const HALF = { w: 68, h: 50 };
const WIDE = { w: 118, h: 62 };

/* A gentle turn, so a page of triangles does not all sit on one line — but
   never so far that the base is no longer roughly along the bottom, because a
   triangle standing on its point is a harder picture than the question. */
const tiltOf = (r) => r.pick([-20, -10, 0, 0, 10, 20]);

export const TRI_GROUPS = [
  {
    id: "tri-sum",
    chapter: "Chapter 1 · Polygon angles",
    label: "Angles in a triangle add up to 180°",
    blurb: "Find it out first: measure with a protractor, then tear the corners off.",
  },
];

export const INSIDE_GROUPS = [
  {
    id: "tri-inside",
    label: "Finding angles inside a triangle",
    blurb: "180 minus the other two — and the triangles that give you a second fact free.",
  },
];

export const EXT_GROUPS = [
  {
    id: "exterior",
    label: "Exterior angles of a triangle",
    blurb: "Carry a side on past a corner. The angle outside, and all three round the outside.",
  },
];

/* ═══ 1. the sum ═══════════════════════════════════════════════════════════ */

const triMeasure = {
  id: "tri-measure",
  group: "tri-sum",
  label: "Measure the three angles",
  blurb: "Protractor on every corner, then add them up. The totals keep coming out the same.",
  heading: "Measure every angle, then add them up",
  instruction: () =>
    "Cut out the protractor. Measure the angle in each corner and write it down, " +
    "then add the three together. Do all of them before you look for a pattern.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const [A, B, C] = triangleAngles(r, o);
    return { A, B, C, tilt: tiltOf(r) };
  },
  render(item) {
    return (
      art(figureSvg(trianglePoints(item.A, item.B, item.C, { tilt: item.tilt }), {
        labels: ["", "", ""], letters: true, box: WIDE,
      })) +
      `<p class="wb-ask">${deg("A =")}${deg("B =")}${deg("C =")}${deg("Altogether")}</p>`
    );
  },
  /* The instrument prints at every level of help — see the maths workbook: a
     page that says "cut out the protractor" and has none on it is broken. At
     Show me the note about the totals is added under it. */
  alwaysWorked: true,
  worked(o) {
    return (
      `<div class="wb-worked gw-cut"><p class="wb-worked__tag">Cut this out</p>` +
      art(protractorSvg()) +
      (helpOf(o).id === "show"
        ? `<p class="wb-ask wb-worked__say">Put the dot on the corner and the flat edge along ` +
          `one side. Read where the other side crosses, using the ring of numbers that ` +
          `starts at 0 on the first side. If your three angles add up to 179 or 181, ` +
          `that is close enough — protractors and pencils are not perfect.</p>`
        : "") +
      `</div>`
    );
  },
  /* Measured, so 2° either way; the total of three measurements 3°. */
  key(item) {
    return [want.num(item.A, 2), want.num(item.B, 2), want.num(item.C, 2), want.num(180, 3)];
  },
  answer(item) {
    return [`A = ${item.A}°, B = ${item.B}°, C = ${item.C}° — altogether 180°`];
  },
};

const triTear = {
  id: "tri-tear",
  group: "tri-sum",
  label: "Tear the corners off",
  blurb: "Cut a triangle out, tear off its three corners, lay them on a line. They fit.",
  heading: "Tear the corners off and put them together",
  instruction: () =>
    "Cut round the triangle. Tear off the three coloured corners along the " +
    "dotted curves. Stick them on the line with their points all touching the dot. " +
    "What shape do the three corners make together?",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    const [A, B, C] = triangleAngles(r, o);
    return { A, B, C, tilt: tiltOf(r) };
  },
  render(item) {
    return (
      art(tearTriangle(item.A, item.B, item.C, { tilt: item.tilt })) +
      art(pasteLine()) +
      `<p class="wb-ask">The three corners make a ${`<span class="wb-line wb-line--md"></span>`} ` +
      `line, so together they are ${box()}°.</p>`
    );
  },
  worked() {
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">What it will look like</p>` +
      art(cornersOnLine(50, 60, 70)) +
      `<p class="wb-ask wb-worked__say">Three corners of 50°, 60° and 70° laid side by side ` +
      `make a straight line — and a straight line is 180°. Any triangle does this.</p></div>`
    );
  },
  key() {
    return [want.stick(), want.text("straight", "a straight line", "straight line"), want.num(180)];
  },
  answer() {
    return ["a straight line — 180°, whatever the triangle"];
  },
};

let checkFlip = 0;
const triCheck = {
  id: "tri-check",
  group: "tri-sum",
  label: "Could it be a triangle?",
  blurb: "Three angles. Add them — only 180 makes a triangle.",
  heading: "Could these be the angles of a triangle?",
  instruction: () =>
    "Add the three angles together. If they make exactly 180°, they could be a " +
    "triangle. If not, they cannot — however they are drawn.",
  cols: 2,
  defaultCount: 6,
  /* Half of them are triangles and half are not, alternating — six coin tosses
     come up five-to-one often enough that "yes" would score well on its own. The
     ones that are NOT triangles miss by a step or two, never by a mile. */
  make(r, o, k, i) {
    if (i === 0) checkFlip = r.chance(0.5) ? 1 : 0;
    const [A, B, C] = triangleAngles(r, o);
    const yes = (i + checkFlip) % 2 === 0;
    const s = levelOf(o).step;
    const off = yes ? 0 : r.pick([-2, -1, 1, 2]) * Math.max(s, 5);
    return { a: A, b: B, c: C + off, yes };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">${item.a}°, ${item.b}°, ${item.c}°</p>` +
      `<p class="wb-ask">${deg("Altogether")}</p>` +
      `<span class="wb-tick"><span class="wb-tick__one"><span class="wb-box"></span>triangle</span>` +
      `<span class="wb-tick__one"><span class="wb-box"></span>not a triangle</span></span>`
    );
  },
  key(item) {
    return [want.num(item.a + item.b + item.c), want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    const t = item.a + item.b + item.c;
    return [`${t}° — ${item.yes ? "yes, a triangle" : "no, not a triangle"}`];
  },
};

/* ═══ 3. inside ════════════════════════════════════════════════════════════ */

const triMissing = {
  id: "tri-missing",
  group: "tri-inside",
  label: "Find the missing angle",
  blurb: "Two angles given. The third is whatever is left of 180.",
  heading: "Find the missing angle",
  instruction: () =>
    "The three angles add up to 180°. Add the two you know, then take that away " +
    "from 180.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const [A, B, C] = triangleAngles(r, o);
    return { A, B, C, missing: r.int(0, 2), tilt: tiltOf(r) };
  },
  render(item) {
    const vals = [item.A, item.B, item.C];
    const labels = vals.map((v, i) => (i === item.missing ? "x" : `${v}°`));
    return (
      art(figureSvg(trianglePoints(item.A, item.B, item.C, { tilt: item.tilt }), { labels, box: HALF })) +
      `<p class="wb-ask">${deg("x =")}</p>`
    );
  },
  worked() {
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>` +
      art(figureSvg(trianglePoints(50, 70, 60), { labels: ["50°", "70°", "x"], box: HALF })) +
      `<p class="wb-ask wb-worked__say">50 + 70 = 120. The three make 180, so ` +
      `x = 180 − 120 = <b>60°</b>.</p></div>`
    );
  },
  key(item) {
    return [want.num([item.A, item.B, item.C][item.missing])];
  },
  answer(item) {
    return [`x = ${[item.A, item.B, item.C][item.missing]}°`];
  },
};

const triIsosceles = {
  id: "tri-isosceles",
  group: "tri-inside",
  label: "Isosceles triangles",
  blurb: "Two equal sides, so two equal angles — the second fact comes free.",
  heading: "Isosceles triangles",
  instruction: () =>
    "The little marks show which two sides are the same length. The two angles " +
    "at the bottom of those sides are equal too. Find the angles marked with letters.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const b = stepped(r, o, 25, 75); // each base angle
    const t = 180 - 2 * b; // the top
    return { b, t, given: r.pick(["top", "base"]), tilt: tiltOf(r) };
  },
  render(item) {
    const labels = item.given === "top" ? ["x", "x", `${item.t}°`] : [`${item.b}°`, "x", "y"];
    return (
      art(figureSvg(trianglePoints(item.b, item.b, item.t, { tilt: item.tilt }), {
        labels, ticks: [1, 2], box: HALF,
      })) +
      `<p class="wb-ask">${deg("x =")}${item.given === "top" ? "" : deg("y =")}</p>`
    );
  },
  worked() {
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>` +
      art(figureSvg(trianglePoints(70, 70, 40), { labels: ["x", "x", "40°"], ticks: [1, 2], box: HALF })) +
      `<p class="wb-ask wb-worked__say">180 − 40 = 140 is left for the two bottom angles, ` +
      `and they are equal, so each is 140 ÷ 2 = <b>70°</b>.</p></div>`
    );
  },
  key(item) {
    return item.given === "top" ? [want.num(item.b)] : [want.num(item.b), want.num(item.t)];
  },
  answer(item) {
    return item.given === "top"
      ? [`x = ${item.b}° (each bottom angle)`]
      : [`x = ${item.b}°, y = ${item.t}°`];
  },
};

const triRight = {
  id: "tri-right",
  group: "tri-inside",
  label: "Right-angled triangles",
  blurb: "The square in the corner is 90° already, so the other two make 90.",
  heading: "Right-angled triangles",
  instruction: () =>
    "The small square means that corner is a right angle — 90°. That leaves " +
    "90° for the other two corners between them.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const a = stepped(r, o, 25, 65);
    return { a, at: r.pick([0, 1]), tilt: tiltOf(r) };
  },
  render(item) {
    /* The right angle sits on the base, at whichever end; the given angle is at
       the other end of the base, and x is the corner at the top. */
    const angs = item.at === 0 ? [90, item.a, 90 - item.a] : [item.a, 90, 90 - item.a];
    const labels = angs.map((v, i) => (i === item.at ? "" : i === 2 ? "x" : `${v}°`));
    return (
      art(figureSvg(trianglePoints(angs[0], angs[1], angs[2], { tilt: item.tilt }), {
        labels, right: [item.at], box: HALF,
      })) +
      `<p class="wb-ask">${deg("x =")}</p>`
    );
  },
  key(item) {
    return [want.num(90 - item.a)];
  },
  answer(item) {
    return [`x = ${90 - item.a}°`];
  },
};

/* The expressions a triangle's angles can be written as, x chosen first so
   everything comes out whole. */
function term(c, k) {
  const x = c === 1 ? "x" : `${c}x`;
  if (!k) return x;
  return k > 0 ? `${x} + ${k}°` : `${x} − ${-k}°`;
}

const triAlgebra = {
  id: "tri-algebra",
  group: "tri-inside",
  label: "Angles written with x",
  blurb: "Two steps: add the expressions, make them equal 180, find x.",
  heading: "Find x, then each angle",
  instruction: () =>
    "The three angles still add up to 180°. Add the three expressions together, " +
    "set the total equal to 180, and find x. Then work out each angle.",
  cols: 2,
  defaultCount: 3,
  make(r, o) {
    let guard = 0;
    for (;;) {
      const x = stepped(r, o, 15, 45);
      const cs = [r.int(1, 3), r.int(1, 3), r.int(1, 2)];
      const ks = [0, r.pick([0, 0, 10, 20, -10]), 0];
      const a = cs[0] * x + ks[0];
      const b = cs[1] * x + ks[1];
      const c = 180 - a - b;
      ks[2] = c - cs[2] * x;
      if ((c >= 20 && c <= 130 && a >= 20 && b >= 20 && Math.abs(ks[2]) <= 60) || ++guard > 80) {
        return { x, cs, ks, a, b, c, tilt: tiltOf(r) };
      }
    }
  },
  render(item) {
    const labels = item.cs.map((c, i) => term(c, item.ks[i]));
    return (
      art(figureSvg(trianglePoints(item.a, item.b, item.c, { tilt: item.tilt }), { labels, box: HALF })) +
      `<p class="wb-ask">${deg("x =")}</p>`
    );
  },
  key(item) {
    return [want.num(item.x)];
  },
  answer(item) {
    return [`x = ${item.x}° — the angles are ${item.a}°, ${item.b}° and ${item.c}°`];
  },
};

/* ═══ 7. outside ═══════════════════════════════════════════════════════════ */

const extLine = {
  id: "ext-line",
  group: "exterior",
  label: "Outside and inside make a straight line",
  blurb: "The side is carried on straight, so outside + inside = 180°.",
  heading: "The angle outside the corner",
  instruction: () =>
    "One side has been carried on past the corner as a dotted line. The angle " +
    "inside and the angle outside sit on a straight line, so together they are 180°.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [A, B, C] = triangleAngles(r, o);
    return { A, B, C, tilt: tiltOf(r) };
  },
  render(item) {
    return (
      art(figureSvg(trianglePoints(item.A, item.B, item.C, { tilt: item.tilt }), {
        labels: [null, `${item.B}°`, null], ext: [{ at: 1, label: "x" }], box: HALF,
      })) +
      `<p class="wb-ask">${deg("x =")}</p>`
    );
  },
  worked() {
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>` +
      art(figureSvg(trianglePoints(60, 70, 50), { labels: [null, "70°", null], ext: [{ at: 1, label: "x" }], box: HALF })) +
      `<p class="wb-ask wb-worked__say">70° inside and x outside make a straight line, ` +
      `so x = 180 − 70 = <b>110°</b>.</p></div>`
    );
  },
  key(item) {
    return [want.num(180 - item.B)];
  },
  answer(item) {
    return [`x = ${180 - item.B}°`];
  },
};

const extFind = {
  id: "ext-find",
  group: "exterior",
  label: "The outside angle is the two far ones added",
  blurb: "The shortcut: the exterior angle equals the two opposite inside angles.",
  heading: "The outside angle from the two far corners",
  instruction: () =>
    "The angle outside a corner is equal to the two inside angles at the OTHER two " +
    "corners, added together. Check it the long way if you like: find the third " +
    "inside angle, then take it from 180.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [A, B, C] = triangleAngles(r, o);
    return { A, B, C, tilt: tiltOf(r) };
  },
  render(item) {
    return (
      art(figureSvg(trianglePoints(item.A, item.B, item.C, { tilt: item.tilt }), {
        labels: [`${item.A}°`, null, `${item.C}°`], ext: [{ at: 1, label: "x" }], box: HALF,
      })) +
      `<p class="wb-ask">${deg("x =")}</p>`
    );
  },
  worked() {
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>` +
      art(figureSvg(trianglePoints(60, 70, 50), { labels: ["60°", null, "50°"], ext: [{ at: 1, label: "x" }], box: HALF })) +
      `<p class="wb-ask wb-worked__say">The two far corners are 60° and 50°, so x = 60 + 50 = ` +
      `<b>110°</b>. The long way agrees: the third inside angle is 180 − 110 = 70, and ` +
      `180 − 70 = 110.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.A + item.C)];
  },
  answer(item) {
    return [`x = ${item.A}° + ${item.C}° = ${item.A + item.C}°`];
  },
};

const extSum = {
  id: "ext-sum",
  group: "exterior",
  label: "All three outside angles",
  blurb: "Walk round the outside and you turn all the way round once: 360°.",
  heading: "The three outside angles add up to 360°",
  instruction: () =>
    "Each side has been carried on past a corner, all going the same way round. " +
    "Walk round the triangle and you turn through all three outside angles — one " +
    "whole turn, 360°. Find the missing one.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const [A, B, C] = triangleAngles(r, o);
    return { A, B, C, missing: r.int(0, 2), tilt: tiltOf(r) };
  },
  render(item) {
    const outs = [180 - item.A, 180 - item.B, 180 - item.C];
    const ext = [0, 1, 2].map((at) => ({ at, label: at === item.missing ? "x" : `${outs[at]}°` }));
    return (
      art(figureSvg(trianglePoints(item.A, item.B, item.C, { tilt: item.tilt }), {
        labels: [null, null, null], ext, box: { w: 70, h: 58 },
      })) +
      `<p class="wb-ask">${deg("x =")}</p>`
    );
  },
  key(item) {
    return [want.num(180 - [item.A, item.B, item.C][item.missing])];
  },
  answer(item) {
    return [`x = ${180 - [item.A, item.B, item.C][item.missing]}° (the three make 360°)`];
  },
};

const dealExtRegular = dealer();
const extRegular = {
  id: "ext-regular",
  group: "exterior",
  label: "Outside angles of a regular shape",
  blurb: "The same whole turn, shared equally: 360 ÷ the number of sides.",
  heading: "The outside angle of a regular shape",
  instruction: () =>
    "Every outside angle of a regular shape is the same, and together they still " +
    "make one whole turn. So each one is 360° shared between the corners.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    return { n: dealExtRegular(r, regularFor(o), i) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">A regular ${NAMES[item.n]}</p>` +
      art(figureSvg(regularPoints(item.n), { labels: [], ext: [{ at: 1, label: "x" }], ticks: true, box: HALF })) +
      `<p class="wb-ask">360° ÷ ${box()} = ${box()}°</p>`
    );
  },
  key(item) {
    return [want.num(item.n), want.num(360 / item.n)];
  },
  answer(item) {
    return [`360° ÷ ${item.n} = ${360 / item.n}°`];
  },
};

export const TRI_EXERCISES = [triMeasure, triTear, triCheck];
export const INSIDE_EXERCISES = [triMissing, triIsosceles, triRight, triAlgebra];
export const EXT_EXERCISES = [extLine, extFind, extSum, extRegular];
