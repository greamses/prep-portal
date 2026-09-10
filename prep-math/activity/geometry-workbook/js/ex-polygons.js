/* ============================================================================
   Geometry Workbook — the POLYGON exercises
   ----------------------------------------------------------------------------
   Three families, and the first is the one that makes the other two make sense.

   CUT IT INTO TRIANGLES. The rule for the angles of a polygon — (n − 2) × 180
   — is useless as a rule and obvious as a picture. Stand at one corner, draw a
   line to every corner you can reach without walking along a side, and the
   shape falls into triangles: always two fewer than it has sides, because the
   two corners next to you are already joined to you. Every triangle is 180°,
   so the whole shape is that many 180s. A child who has drawn the lines five
   times does not need the formula; they can see it.

   So this section comes at the concept from four sides, deliberately: DRAW the
   lines yourself; COUNT the triangles already drawn; fill in the PATTERN table
   until the rule writes itself in the last row; and cut from the MIDDLE
   instead — n triangles, too many by exactly the 360° round the centre — which
   is the same answer reached a different way, and the second way is what turns
   a trick into an understanding.

   THEN THE SUM, as a four-box flow: sides → triangles → × 180 → total. Then
   FINDING ONE ANGLE: the total minus the ones you know, or, for a regular
   shape, the total shared equally.
   ========================================================================== */

import {
  figureSvg, regularPoints, irregularPoints, roundedAngles, NAMES, aName,
} from "./figure.js";
import { levelOf, helpOf, sidesFor, regularFor, dealer } from "./levels.js";

const box = () => `<span class="wb-answer"></span>`;
const deg = (label) => `<span class="wb-slot"><em>${label}</em>${box()}°</span>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const HALF = { w: 68, h: 50 };

/** A value printed in a flow box, or the box left blank. */
const cell = (v) => (v === null || v === undefined ? box() : `<b class="gw-given">${v}</b>`);

/**
 * The four-box flow the whole polygon section is built on:
 *   sides → triangles → triangles × 180 → the total.
 * Written the same way every time, with the arrows, so it is a thing a child
 * can follow with their finger rather than a formula to remember.
 */
function flow({ n = null, t = null, sum = null }, { named = true } = {}) {
  /* The value is wrapped in one span: the step is a column (label over value),
     and a box followed by "× 180" left loose in a column is two rows, not one. */
  const step = (label, content) =>
    `<span class="gw-flow__step">${named ? `<em>${label}</em>` : ""}` +
    `<span class="gw-flow__val">${content}</span></span>`;
  const arrow = `<span class="gw-flow__arrow">→</span>`;
  return (
    `<div class="gw-flow">` +
    step("sides", cell(n)) + arrow +
    step("triangles", cell(t)) + arrow +
    step("× 180°", `${cell(t)} × 180`) + arrow +
    step("angles add to", `${cell(sum)}°`) +
    `</div>`
  );
}

export const DECOMP_GROUPS = [
  {
    id: "decomp",
    label: "Cutting shapes into triangles",
    blurb: "Draw the lines from one corner; count the triangles; see the rule in a table.",
  },
];

export const POLY_GROUPS = [
  {
    id: "poly-sum",
    label: "The angles of any shape",
    blurb: "Sides, take away two, times 180 — as a flow you can follow with a finger.",
  },
  {
    id: "poly-each",
    label: "Finding each angle",
    blurb: "The total minus the ones you know — or, if it is regular, the total shared out.",
  },
];

/* ═══ 2. cutting into triangles ════════════════════════════════════════════ */

const dealDraw = dealer();
const decompDraw = {
  id: "decomp-draw",
  group: "decomp",
  label: "Draw the lines yourself",
  blurb: "From the red dot, rule a line to every corner you can reach. Count the triangles.",
  heading: "Cut each shape into triangles",
  instruction: () =>
    "Start at the red dot. Rule a straight line from it to every other corner — " +
    "except the two right next to it, which it is already joined to. Count the " +
    "triangles you have made.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const n = dealDraw(r, sidesFor(o), i);
    return { n, pts: irregularPoints(r, n) };
  },
  render(item) {
    return (
      art(figureSvg(item.pts, { mark: 0, box: HALF })) +
      `<p class="wb-ask"><span class="wb-slot"><em>Sides</em>${box()}</span>` +
      `<span class="wb-slot"><em>Triangles</em>${box()}</span></p>`
    );
  },
  worked() {
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>` +
      art(figureSvg(regularPoints(6), { fan: 0, mark: 0, box: HALF })) +
      `<p class="wb-ask wb-worked__say">A hexagon has 6 sides. From one corner there are ` +
      `3 lines to draw, and they make <b>4</b> triangles — two fewer than the sides, ` +
      `because the two corners next to the dot are already joined to it.</p></div>`
    );
  },
  answer(item) {
    return [`${item.n} sides → ${item.n - 2} triangles`];
  },
};

const dealCount = dealer();
const decompCount = {
  id: "decomp-count",
  group: "decomp",
  label: "Count the triangles already drawn",
  blurb: "The lines are there. Count, multiply by 180, and you have the angle sum.",
  heading: "Count the triangles, then add up the angles",
  instruction: () =>
    "Each shape has been cut into triangles from one corner. Every triangle's " +
    "angles make 180°, so the shape's angles are that many 180s.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    const n = dealCount(r, sidesFor(o), i);
    return { n, pts: irregularPoints(r, n) };
  },
  render(item, o) {
    return (
      `<div class="gw-side">` +
      art(figureSvg(item.pts, { fan: 0, box: { w: 60, h: 46 } })) +
      flow({ n: helpOf(o).id === "show" ? item.n : null }, { named: helpOf(o).id !== "try" }) +
      `</div>`
    );
  },
  answer(item) {
    return [`${item.n} sides → ${item.n - 2} triangles → ${item.n - 2} × 180 = ${(item.n - 2) * 180}°`];
  },
};

/**
 * The pattern table. One per workbook is plenty — it is an organiser, not a
 * drill — and its last row is the point: at the stretch level it asks for a
 * shape with n sides, and the child who has filled the rows above writes the
 * rule down themselves.
 */
const decompTable = {
  id: "decomp-table",
  group: "decomp",
  label: "The pattern table",
  blurb: "Fill it in row by row until the rule writes itself in the last line.",
  heading: "Find the pattern",
  instruction: () =>
    "Fill in the table one row at a time. Look down each column when you have " +
    "finished — the triangles are always the sides take away two.",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    const last = Math.min(levelOf(o).maxSides, 8);
    const rows = [];
    for (let n = 3; n <= last; n++) rows.push(n);
    return { rows, withN: levelOf(o).step === 1 };
  },
  render(item, o) {
    const filled = { show: 2, help: 1, try: 0 }[helpOf(o).id] ?? 1;
    const body = item.rows
      .map((n, i) => {
        const give = i < filled;
        const shape = figureSvg(regularPoints(n), { fan: n > 3 ? 0 : null, box: { w: 26, h: 20 }, pad: 1.2, thin: true });
        return (
          `<tr><td class="gw-table__shape">${shape}</td>` +
          `<td>${NAMES[n]}</td>` +
          `<td>${give ? n : ""}</td>` +
          `<td>${give ? n - 2 : ""}</td>` +
          `<td>${give ? `${(n - 2) * 180}°` : ""}</td></tr>`
        );
      })
      .join("");
    const tail = item.withN
      ? `<tr class="gw-table__rule"><td></td><td>any shape</td><td><b>n</b></td><td></td><td></td></tr>`
      : "";
    return (
      `<table class="gw-table"><thead><tr>` +
      `<th>Shape</th><th>Name</th><th>Sides</th><th>Triangles</th><th>Angles add to</th>` +
      `</tr></thead><tbody>${body}${tail}</tbody></table>`
    );
  },
  answer(item) {
    const rows = item.rows.map((n) => `${NAMES[n]}: ${n} sides, ${n - 2} triangles, ${(n - 2) * 180}°`);
    if (item.withN) rows.push("n sides: n − 2 triangles, (n − 2) × 180°");
    return rows;
  },
};

const dealCentre = dealer();
const decompCentre = {
  id: "decomp-centre",
  group: "decomp",
  label: "Cut from the middle instead",
  blurb: "A second way to the same answer — n triangles, less the 360° round the middle.",
  heading: "Cut from the middle — the same answer another way",
  instruction: () =>
    "This time the shape is cut from a point in the middle, so there is one " +
    "triangle for every side. But the angles round the middle point are not " +
    "corners of the shape — they make a full turn, 360°, and have to be taken away.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const n = dealCentre(r, sidesFor(o), i);
    return { n, pts: regularPoints(n) };
  },
  render(item) {
    return (
      `<div class="gw-side">` +
      art(figureSvg(item.pts, { centre: true, box: { w: 46, h: 42 } })) +
      `<div class="gw-lines">` +
      `<p class="wb-ask">There are ${box()} triangles, so ${box()} × 180° = ${box()}°.</p>` +
      `<p class="wb-ask">The angles round the middle make ${box()}°.</p>` +
      `<p class="wb-ask">So the corners of the shape make ${box()}° − ${box()}°</p>` +
      `<p class="wb-ask">= ${box()}°.</p>` +
      `</div></div>`
    );
  },
  answer(item) {
    const n = item.n;
    return [`${n} × 180 = ${n * 180}; ${n * 180} − 360 = ${(n - 2) * 180}° — the same as ${n - 2} × 180`];
  },
};

/* ═══ 4. the angles of any shape ═══════════════════════════════════════════ */

const dealSum = dealer();
const polySum = {
  id: "poly-sum",
  group: "poly-sum",
  label: "What do the angles add up to?",
  blurb: "Named shapes, through the four-box flow.",
  heading: "What do the angles of each shape add up to?",
  instruction: () =>
    "Count the sides. Take away two to get the triangles. Multiply by 180.",
  cols: 1,
  defaultCount: 5,
  make(r, o, k, i) {
    return { n: dealSum(r, sidesFor(o, { from: 3 }), i) };
  },
  render(item, o) {
    return (
      `<div class="gw-side">` +
      art(figureSvg(regularPoints(item.n), { box: { w: 34, h: 30 } })) +
      `<div class="gw-lines"><p class="wb-ask wb-ask--lead">${aName(item.n)[0].toUpperCase() + aName(item.n).slice(1)}</p>` +
      flow({ n: helpOf(o).id === "show" ? item.n : null }, { named: helpOf(o).id !== "try" }) +
      `</div></div>`
    );
  },
  worked() {
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">A pentagon</p>` +
      flow({ n: 5, t: 3, sum: 540 }) +
      `<p class="wb-ask wb-worked__say">Five sides, take away two, is three triangles. ` +
      `Three lots of 180 is 540.</p></div>`
    );
  },
  answer(item) {
    return [`${NAMES[item.n]}: (${item.n} − 2) × 180 = ${(item.n - 2) * 180}°`];
  },
};

const dealSides = dealer();
const polySides = {
  id: "poly-sides",
  group: "poly-sum",
  label: "Work backwards to the sides",
  blurb: "The total is given. Divide by 180 for the triangles, add two for the sides.",
  heading: "How many sides has the shape got?",
  instruction: () =>
    "Run the flow backwards: divide the total by 180 to find the triangles, then " +
    "add the two back on to find the sides.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const n = dealSides(r, sidesFor(o, { from: 4 }), i);
    return { n, sum: (n - 2) * 180 };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">The angles add up to <b>${item.sum}°</b>.</p>` +
      `<p class="wb-ask">${item.sum} ÷ 180 = ${box()} triangles</p>` +
      `<p class="wb-ask">${box()} + 2 = ${box()} sides</p>`
    );
  },
  answer(item) {
    return [`${item.sum} ÷ 180 = ${item.n - 2}; ${item.n - 2} + 2 = ${item.n} sides (${NAMES[item.n]})`];
  },
};

/* ═══ 5. finding each angle ════════════════════════════════════════════════ */

const dealMissing = dealer();
const polyMissing = {
  id: "poly-missing",
  group: "poly-each",
  label: "The missing corner",
  blurb: "Every angle but one is marked. The total, minus the ones you know.",
  heading: "Find the missing angle",
  instruction: () =>
    "First work out what all the angles of the shape add up to. Then add the " +
    "ones you know and take them away from the total.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    const n = dealMissing(r, sidesFor(o).filter((m) => m <= 6), i);
    const pts = irregularPoints(r, n);
    const angles = roundedAngles(pts, Math.max(levelOf(o).step, 5));
    return { n, pts, angles, missing: r.int(0, n - 1) };
  },
  render(item) {
    const labels = item.angles.map((a, i) => (i === item.missing ? "x" : `${a}°`));
    return (
      art(figureSvg(item.pts, { labels, box: { w: 70, h: 54 }, note: "not drawn accurately" })) +
      `<p class="wb-ask">${deg("They add up to")}</p>` +
      `<p class="wb-ask">${deg("x =")}</p>`
    );
  },
  /* The example's numbers are READ OFF its own drawing, not made up and printed
     on it: a worked example is the one figure a child checks with a protractor
     to see whether they believe it. */
  worked() {
    const pts = [[0, 0], [60, 0], [70, 40], [10, 50]];
    const a = roundedAngles(pts, 5);
    const known = [a[0], a[2], a[3]];
    const sum = known.reduce((t, v) => t + v, 0);
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>` +
      art(figureSvg(pts, { labels: [`${a[0]}°`, "x", `${a[2]}°`, `${a[3]}°`], box: HALF })) +
      `<p class="wb-ask wb-worked__say">A quadrilateral is 2 triangles, so its angles add ` +
      `up to 360°. ${known.join(" + ")} = ${sum}, so x = 360 − ${sum} = <b>${360 - sum}°</b>.</p></div>`
    );
  },
  answer(item) {
    const sum = (item.n - 2) * 180;
    return [`total ${sum}°; x = ${item.angles[item.missing]}°`];
  },
};

const dealRegular = dealer();
const polyRegular = {
  id: "poly-regular",
  group: "poly-each",
  label: "Each corner of a regular shape",
  blurb: "All the sides equal, so all the corners equal: the total shared out.",
  heading: "Each angle of a regular shape",
  instruction: () =>
    "In a regular shape every side is the same length (see the little marks) and " +
    "every corner is the same size. Work out the total, then share it equally " +
    "between the corners.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    return { n: dealRegular(r, regularFor(o), i) };
  },
  render(item) {
    const labels = Array.from({ length: item.n }, (_, i) => (i === 0 ? "x" : ""));
    return (
      `<p class="wb-ask wb-ask--lead">A regular ${NAMES[item.n]}</p>` +
      art(figureSvg(regularPoints(item.n), { labels, ticks: true, box: HALF })) +
      `<p class="wb-ask">${box()}° ÷ ${box()} = ${box()}°</p>`
    );
  },
  worked() {
    return (
      `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">A regular hexagon</p>` +
      art(figureSvg(regularPoints(6), { labels: ["x", "", "", "", "", ""], ticks: true, box: HALF })) +
      `<p class="wb-ask wb-worked__say">A hexagon's angles add up to 4 × 180 = 720°. ` +
      `There are 6 equal corners, so each is 720 ÷ 6 = <b>120°</b>.</p></div>`
    );
  },
  answer(item) {
    const sum = (item.n - 2) * 180;
    return [`${sum}° ÷ ${item.n} = ${sum / item.n}°`];
  },
};

const dealBack = dealer();
const polyRegularBack = {
  id: "poly-regular-back",
  group: "poly-each",
  label: "How many sides, from one angle?",
  blurb: "Each corner is given. Go outside the corner: 360 ÷ the outside angle.",
  heading: "How many sides has the regular shape got?",
  instruction: () =>
    "The outside angle at a corner is 180 minus the inside one, and all the " +
    "outside angles make 360°. So 360 ÷ the outside angle is the number of corners.",
  cols: 2,
  defaultCount: 4,
  hardest: true,
  make(r, o, k, i) {
    const n = dealBack(r, regularFor(o).filter((m) => m >= 4), i);
    return { n, each: ((n - 2) * 180) / n };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Each angle is <b>${item.each}°</b>.</p>` +
      `<p class="wb-ask">Outside angle: 180 − ${item.each} = ${box()}°</p>` +
      `<p class="wb-ask">360 ÷ ${box()} = ${box()} sides</p>`
    );
  },
  answer(item) {
    const out = 180 - item.each;
    return [`outside ${out}°; 360 ÷ ${out} = ${item.n} sides (${NAMES[item.n]})`];
  },
};

export const DECOMP_EXERCISES = [decompDraw, decompCount, decompTable, decompCentre];
export const POLY_SUM_EXERCISES = [polySum, polySides];
export const POLY_EACH_EXERCISES = [polyMissing, polyRegular, polyRegularBack];
