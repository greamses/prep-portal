/* ============================================================================
   Statistics Workbook — CHAPTER 6, last section: PROBABILITY TREES
   ----------------------------------------------------------------------------
   Two picks from a bag, drawn as a tree: two branches for the first pick, and
   from the end of each, two more for the second. Every branch carries its
   probability; the two branches from one point always add up to 1.

     fill the branches      the branches leaving a point add to 1 — find the
                            missing one
     multiply along         the chance of a whole path (red THEN blue) is the
                            branches along it multiplied; the four paths add to 1
     without putting back   (Middle+) the second pick has one counter fewer, and
                            one fewer of the colour that went first
     add the paths          (Middle+) "one of each" is two paths, "at least one
                            red" three: find each path, then add

   Answers are fractions, and any equal fraction is right (want.frac): 6/25
   and 12/50 are the same chance. The tree is drawn as lines with its labels
   laid over them as HTML, so a branch can carry an answer box on paper and on
   screen.
   ========================================================================== */

import { levelOf } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/** a/b in lowest terms, as text. */
const fr = (a, b) => { const g = gcd(a, b) || 1; return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`; };

const COLOURS = [["red", "blue", "R", "B"], ["green", "yellow", "G", "Y"], ["black", "white", "K", "W"]];

/** A bag of two colours: a of the first, b of the second. */
function bagOf(r, o) {
  const t = tier(o);
  const n = t === "gentle" ? r.pick([4, 5, 6]) : r.int(5, 10);
  const a = r.int(1, n - 1);
  const [c1, c2, s1, s2] = r.pick(COLOURS);
  return { a, b: n - a, n, c1, c2, s1, s2 };
}
/** The tree's numbers as [numerator, denominator] pairs. */
function branches({ a, b, n }, back) {
  const first = [[a, n], [b, n]];
  const second = back
    ? [[[a, n], [b, n]], [[a, n], [b, n]]]
    : [[[a - 1, n - 1], [b, n - 1]], [[a, n - 1], [b - 1, n - 1]]];
  const ends = [0, 1].flatMap((i) => [0, 1].map((j) => [first[i][0] * second[i][j][0], first[i][1] * second[i][j][1]]));
  return { first, second, ends };
}
const text = ([p, q]) => fr(p, q);

/**
 * The tree. `labels` are the eight things written on it, in order: the two
 * first branches, the four second branches, and (optionally) the four ends.
 * Each is text, or a box to fill. Drawn 132 × 66 mm.
 */
function treeHtml(bag, labels, { ends = false } = {}) {
  const W = 132, H = 66;
  const root = [4, 33], mid = [[50, 16], [50, 50]];
  const leaf = [[96, 6], [96, 26], [96, 40], [96, 60]];
  const ln = ([x1, y1], [x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2a2723" stroke-width="0.45"/>`;
  let svg = ln(root, mid[0]) + ln(root, mid[1]);
  leaf.forEach((p, k) => { svg += ln(mid[k >> 1], p); });
  /* a label sits halfway along its branch, just above it */
  const at = ([x1, y1], [x2, y2], up = 3.6) => [(x1 + x2) / 2, (y1 + y2) / 2 - up];
  const place = ([x, y], html, cls = "") => `<span class="pt-lab${cls}" style="left:${(x / W) * 100}%;top:${(y / H) * 100}%">${html}</span>`;
  let over = "";
  over += place(at(root, mid[0]), labels[0]) + place(at(root, mid[1], -3.6), labels[1]);
  over += place(mid[0], `<b>${bag.s1}</b>`, " pt-node") + place(mid[1], `<b>${bag.s2}</b>`, " pt-node");
  leaf.forEach((p, k) => {
    const from = mid[k >> 1];
    over += place(at(from, p, k % 2 ? -3.2 : 3.2), labels[2 + k]);
    over += place([p[0] + 6, p[1]], `<b>${[bag.s1, bag.s2][k >> 1]}${[bag.s1, bag.s2][k % 2]}</b>`, " pt-node");
    if (ends) over += place([p[0] + 24, p[1]], labels[6 + k], " pt-end");
  });
  return `<div class="pt-tree" style="width:${W}mm;height:${H}mm">` +
    `<svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" aria-hidden="true">${svg}</svg>${over}</div>`;
}

const story = (bag, back) =>
  `A bag holds ${bag.a} ${bag.c1} and ${bag.b} ${bag.c2} counters. One is taken out${back ? ", its colour noted, and put BACK" : " and NOT put back"}; then a second is taken. ` +
  `${bag.s1} means ${bag.c1}, ${bag.s2} means ${bag.c2}.`;

export const TR_GROUPS = [
  { id: "pb-tree", label: "Probability trees", blurb: "Two picks as branches: multiply along a path, add the paths you want." },
];

/* ═══ fill the branches ════════════════════════════════════════════════════*/

const ptFill = {
  id: "pt-fill",
  group: "pb-tree",
  label: "Fill in the branches",
  blurb: "Two branches from one point add up to 1.",
  heading: "Probability trees: fill in the branches",
  instruction: () =>
    "Each branch carries the chance of what is written at its end. From any point, one thing or the other must " +
    "happen, so the branches leaving it ADD UP TO 1: if one is 3/5, the other is 2/5. Fill in every empty branch.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return bagOf(r, o);
  },
  render(bag) {
    const t = branches(bag, true);
    const L = [text(t.first[0]), box(), text(t.second[0][0]), box(), box(), text(t.second[1][1])];
    return ask(story(bag, true)) + treeHtml(bag, L);
  },
  worked() {
    const bag = { a: 3, b: 2, n: 5, s1: "R", s2: "B" };
    return worked(treeHtml(bag, ["3/5", "2/5", "3/5", "2/5", "3/5", "2/5"]) +
      say("3 red out of 5, so red is 3/5 and blue is 2/5 — together 5/5, which is 1. The counter goes back, so the " +
        "second pick is the same bag: 3/5 and 2/5 again on every pair of branches."));
  },
  key(bag) {
    const t = branches(bag, true);
    return [t.first[1], t.second[0][1], t.second[1][0]].map(([p, q]) => want.frac(p, q));
  },
  answer(bag) {
    const t = branches(bag, true);
    return [`${text(t.first[1])}, ${text(t.second[0][1])}, ${text(t.second[1][0])}`];
  },
};

/* ═══ multiply along ═══════════════════════════════════════════════════════*/

const ptMultiply = {
  id: "pt-multiply",
  group: "pb-tree",
  label: "Multiply along the branches",
  blurb: "The chance of a whole path is its branches multiplied.",
  heading: "Probability trees: multiply along each path",
  instruction: () =>
    "A path from the start to an end is two things happening one after the other. Its chance is the two " +
    "branches along it MULTIPLIED: top times top, bottom times bottom. Write each path's chance at its end — " +
    "the four of them add up to 1.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return bagOf(r, o);
  },
  render(bag) {
    const t = branches(bag, true);
    const L = [...t.first.map(text), ...t.second.flat().map(text), box(), box(), box(), box()];
    return ask(story(bag, true)) + treeHtml(bag, L, { ends: true });
  },
  worked() {
    const bag = { a: 3, b: 2, n: 5, s1: "R", s2: "B" };
    return worked(treeHtml(bag, ["3/5", "2/5", "3/5", "2/5", "3/5", "2/5", "9/25", "6/25", "6/25", "4/25"], { ends: true }) +
      say("RR: 3/5 × 3/5 = 9/25. RB: 3/5 × 2/5 = 6/25. BR: 6/25. BB: 2/5 × 2/5 = 4/25. Check: 9 + 6 + 6 + 4 = 25, " +
        "so the four add to 25/25 = 1."));
  },
  key(bag) {
    return branches(bag, true).ends.map(([p, q]) => want.frac(p, q));
  },
  answer(bag) {
    return [branches(bag, true).ends.map(text).join(", ")];
  },
};

/* ═══ without putting it back ══════════════════════════════════════════════*/

const ptWithout = {
  id: "pt-without",
  group: "pb-tree",
  label: "Without putting it back",
  blurb: "The second pick has one counter fewer.",
  heading: "Probability trees: without putting it back",
  hardest: true,
  instruction: () =>
    "When the first counter is NOT put back, the bag is different for the second pick: one counter fewer in " +
    "all, and one fewer of the colour that came out first. So every second branch is over one less — and the " +
    "top pair and the bottom pair are not the same. Fill the second branches, then find the chance both are " +
    "the first colour.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    for (;;) { const b = bagOf(r, o); if (b.a >= 2 && b.b >= 2) return b; }
  },
  render(bag) {
    const t = branches(bag, false);
    const L = [...t.first.map(text), box(), box(), box(), box()];
    return ask(story(bag, false)) + treeHtml(bag, L) + ask(`P(both ${bag.c1}) = ${box()}`);
  },
  worked() {
    const bag = { a: 3, b: 2, n: 5, s1: "R", s2: "B" };
    return worked(treeHtml(bag, ["3/5", "2/5", "2/4", "2/4", "3/4", "1/4"]) +
      say("After a red comes out there are 4 left: 2 red and 2 blue, so 2/4 and 2/4. After a blue: 3 red and 1 blue, " +
        "so 3/4 and 1/4. Both red: 3/5 × 2/4 = 6/20, which is 3/10."));
  },
  key(bag) {
    const t = branches(bag, false);
    return [...t.second.flat().map(([p, q]) => want.frac(p, q)), want.frac(...t.ends[0])];
  },
  answer(bag) {
    const t = branches(bag, false);
    return [`${t.second.flat().map(text).join(", ")}; both ${bag.c1}: ${text(t.ends[0])}`];
  },
};

/* ═══ add the paths ════════════════════════════════════════════════════════*/

const ptPaths = {
  id: "pt-paths",
  group: "pb-tree",
  label: "Add the paths",
  blurb: "One of each is two paths; at least one is three.",
  heading: "Probability trees: add the paths you want",
  hardest: true,
  instruction: () =>
    "Find every path that gives what is asked, work out each one (multiply along it), and ADD them. “The same " +
    "colour” is the top path and the bottom path; “one of each” is the two middle paths; “at least one” of a " +
    "colour is every path with it in — or 1 take away the one path without it.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    for (;;) { const b = bagOf(r, o); if (b.a >= 2 && b.b >= 2) return { ...b, back: r.chance(0.5) }; }
  },
  render(bag) {
    const t = branches(bag, bag.back);
    const L = [...t.first.map(text), ...t.second.flat().map(text)];
    return ask(story(bag, bag.back)) + treeHtml(bag, L) +
      ask(`P(the same colour) = ${box()}`) + ask(`P(one of each) = ${box()}`) + ask(`P(at least one ${bag.c1}) = ${box()}`);
  },
  worked() {
    return worked(say("Red 3/5 then red 3/5 is 9/25; blue then blue is 4/25 — the same colour is 9/25 + 4/25 = 13/25. " +
      "One of each is RB + BR = 6/25 + 6/25 = 12/25. At least one red is 1 − P(BB) = 1 − 4/25 = 21/25."));
  },
  key(bag) {
    const t = branches(bag, bag.back);
    const [rr, rb, br, bb] = t.ends;
    const q = rr[1];
    return [want.frac(rr[0] + bb[0], q), want.frac(rb[0] + br[0], q), want.frac(rr[0] + rb[0] + br[0], q)];
  },
  answer(bag) {
    const t = branches(bag, bag.back);
    const [rr, rb, br, bb] = t.ends;
    const q = rr[1];
    return [`same ${fr(rr[0] + bb[0], q)}, one of each ${fr(rb[0] + br[0], q)}, at least one ${bag.c1} ${fr(q - bb[0], q)}`];
  },
};

export const TR_EXERCISES = [ptFill, ptMultiply, ptWithout, ptPaths];
