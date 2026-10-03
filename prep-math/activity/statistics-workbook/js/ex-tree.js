/* ============================================================================
   Statistics Workbook — CHAPTER 6, last sections: PROBABILITY TREES and TABLES
   ----------------------------------------------------------------------------
   Two picks from a bag, drawn as a tree — in the same dress as the factor
   tree (utils/components/workbook/factortree.js): round NODES joined by grey
   branches, a colour for each row.

     A NODE HOLDS AN OUTCOME — what happened: R, B, or "red". It is a circle
     that stretches into a pill when the outcome is longer than a letter or
     two. The whole path's outcome (RB) sits in a pill at the end of the path.
     A BRANCH CARRIES A PROBABILITY, written beside it. A node is never where
     a fraction goes.

     name the outcomes      the branches are given; fill the empty nodes
     fill the branches      the branches leaving a node add to 1 — find the
                            missing one
     multiply along         the chance of a whole path (red THEN blue) is the
                            branches along it multiplied; the four paths add to 1
     without putting back   (Middle+) the second pick has one counter fewer, and
                            one fewer of the colour that went first
     add the paths          (Middle+) "one of each" is two paths, "at least one
                            red" three: find each path, then add

   And PROBABILITY TABLES, the other way of setting the same things out:

     the table of outcomes  two spinners: every pair in a grid, counted
     a table of chances     each outcome with its probability; they add to 1
     a two-way table        counts sorted two ways, and the chances read off it

   Answers are fractions, and any equal fraction is right (want.frac): 6/25
   and 12/50 are the same chance.
   ========================================================================== */

import { levelOf } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";
import { tableHtml } from "./pictoart.js";

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
  /* above Gentle the outcomes are sometimes written out: the nodes stretch */
  const full = t !== "gentle" && r.chance(0.4);
  return { a, b: n - a, n, c1, c2, s1, s2, full };
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

/** What a node says for the first or the second colour, and for a whole path. */
const name = (bag, i) => (bag.full ? [bag.c1, bag.c2][i] : [bag.s1, bag.s2][i]);
const path = (bag, i, j) => (bag.full ? `${name(bag, i)}, ${name(bag, j)}` : `${name(bag, i)}${name(bag, j)}`);
/** Every way a node's outcome may be written. */
const nameWant = (bag, i) => want.text([bag.s1, bag.s2][i], [bag.c1, bag.c2][i]);
const pathWant = (bag, i, j) => {
  const s = [bag.s1, bag.s2], c = [bag.c1, bag.c2];
  return want.text(`${s[i]}${s[j]}`, `${s[i]}, ${s[j]}`, `${c[i]}, ${c[j]}`, `${c[i]} ${c[j]}`, `${c[i]} then ${c[j]}`);
};

/**
 * The tree, in the factor tree's dress.
 *   labels   the six probabilities on the branches, in order: the two first
 *            branches, then the four second ones. Each is text, or a box.
 *   ends     the four path probabilities (text or a box), or null for none
 *   blank    the nodes left empty for the child to name: "m0" "m1" (after the
 *            first pick), "l0"…"l3" (after the second), "o0"…"o3" (the path)
 */
function treeHtml(bag, labels, { ends = null, blank = [] } = {}) {
  const wide = bag.full;
  const X = wide ? { root: 9, mid: 50, leaf: 96, out: 128, end: 158 } : { root: 9, mid: 46, leaf: 86, out: 110, end: 134 };
  const W = (ends ? X.end + 12 : X.out + (wide ? 18 : 10)), H = 78, TOP = 9;
  const root = [X.root, TOP + 33], mid = [[X.mid, TOP + 16], [X.mid, TOP + 50]];
  const leaf = [6, 26, 40, 60].map((y) => [X.leaf, TOP + y]);
  const ln = ([x1, y1], [x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  let svg = ln(root, mid[0]) + ln(root, mid[1]);
  leaf.forEach((p, k) => { svg += ln(mid[k >> 1], p) + `<line class="pt-dots" x1="${p[0]}" y1="${p[1]}" x2="${X.out}" y2="${p[1]}"/>`; });
  const at = (x, y) => `left:${x}mm;top:${y}mm`;
  /* a probability sits halfway along its branch, on the outside of it */
  const lab = ([x1, y1], [x2, y2], up, html) => `<span class="pt-lab" style="${at((x1 + x2) / 2, (y1 + y2) / 2 - up)}">${html}</span>`;
  const node = (key, [x, y], row, text) => blank.includes(key)
    ? `<span class="pt-node pt-row${row} is-empty" style="${at(x, y)}"><span class="wb-answer"></span></span>`
    : `<span class="pt-node pt-row${row}" style="${at(x, y)}">${text}</span>`;
  let over = `<span class="pt-node pt-row0 is-top" style="${at(...root)}">Start</span>`;
  over += lab(root, mid[0], 4.6, labels[0]) + lab(root, mid[1], -4.6, labels[1]);
  over += node("m0", mid[0], 1, name(bag, 0)) + node("m1", mid[1], 1, name(bag, 1));
  leaf.forEach((p, k) => {
    const i = k >> 1, j = k % 2;
    over += lab(mid[i], p, j ? -4 : 4, labels[2 + k]);
    over += node(`l${k}`, p, 2, name(bag, j));
    over += node(`o${k}`, [X.out, p[1]], 3, path(bag, i, j));
    if (ends) over += `<span class="pt-end" style="${at(X.end, p[1])}">${ends[k]}</span>`;
  });
  const heads = `<span class="pt-head" style="${at(X.mid, 3)}">1st pick</span><span class="pt-head" style="${at(X.leaf, 3)}">2nd pick</span>` +
    `<span class="pt-head" style="${at(X.out, 3)}">Outcome</span>${ends ? `<span class="pt-head" style="${at(X.end, 3)}">Probability</span>` : ""}`;
  return `<div class="pt-tree" style="width:${W}mm;height:${H}mm">` +
    `<svg class="pt-lines" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" aria-hidden="true">${svg}</svg>${heads}${over}</div>`;
}

const story = (bag, back) =>
  `A bag holds ${bag.a} ${bag.c1} and ${bag.b} ${bag.c2} counters. One is taken out${back ? ", its colour noted, and put BACK" : " and NOT put back"}; then a second is taken. ` +
  (bag.full ? "" : `${bag.s1} means ${bag.c1}, ${bag.s2} means ${bag.c2}.`);

export const TR_GROUPS = [
  { id: "pb-tree", label: "Probability trees", blurb: "Outcomes in the nodes, chances on the branches: multiply along a path, add the paths you want." },
  { id: "pb-table", label: "Probability tables", blurb: "Every outcome set out in a table, and the chances read off it." },
];

/* ═══ name the outcomes ════════════════════════════════════════════════════*/

const NAMED = ["m1", "l1", "o1", "l2", "o2", "o3"];

const ptOutcomes = {
  id: "pt-outcomes",
  group: "pb-tree",
  label: "Name the outcomes",
  blurb: "A node holds what happened; a branch holds its chance.",
  heading: "Probability trees: name the outcomes",
  instruction: () =>
    "A tree has NODES and BRANCHES. A node holds an OUTCOME — what happened at that pick. A branch carries the " +
    "CHANCE of reaching the node at its end. At the end of each path, the outcome of the whole path is written: " +
    "first pick, then second pick. Read the chances on the branches and fill in every empty node.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    for (;;) { const b = bagOf(r, o); if (b.a !== b.b) return b; }
  },
  render(bag) {
    const t = branches(bag, true);
    return ask(story(bag, true) + (bag.full ? "" : " Write the letters.")) +
      treeHtml(bag, [...t.first.map(text), ...t.second.flat().map(text)], { blank: NAMED });
  },
  worked() {
    const bag = { a: 3, b: 2, n: 5, c1: "red", c2: "blue", s1: "R", s2: "B" };
    return worked(treeHtml(bag, ["3/5", "2/5", "3/5", "2/5", "3/5", "2/5"]) +
      say("3 of the 5 counters are red, so the branch marked 3/5 ends at R and the one marked 2/5 ends at B. " +
        "The top path is red then red: RR. The next is red then blue: RB. Then BR, and BB."));
  },
  key(bag) {
    return [nameWant(bag, 1), nameWant(bag, 1), pathWant(bag, 0, 1), nameWant(bag, 0), pathWant(bag, 1, 0), pathWant(bag, 1, 1)];
  },
  answer(bag) {
    return [`${name(bag, 1)}; ${name(bag, 1)}, ${path(bag, 0, 1)}; ${name(bag, 0)}, ${path(bag, 1, 0)}; ${path(bag, 1, 1)}`];
  },
};

/* ═══ fill the branches ════════════════════════════════════════════════════*/

const ptFill = {
  id: "pt-fill",
  group: "pb-tree",
  label: "Fill in the branches",
  blurb: "Two branches from one point add up to 1.",
  heading: "Probability trees: fill in the branches",
  instruction: () =>
    "Each branch carries the chance of the outcome in the node at its end. From any node, one thing or the other " +
    "must happen, so the branches leaving it ADD UP TO 1: if one is 3/5, the other is 2/5. Fill in every empty branch.",
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
    const bag = { a: 3, b: 2, n: 5, c1: "red", c2: "blue", s1: "R", s2: "B" };
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
    "branches along it MULTIPLIED: top times top, bottom times bottom. Write each path's chance beside its outcome — " +
    "the four of them add up to 1.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return bagOf(r, o);
  },
  render(bag) {
    const t = branches(bag, true);
    return ask(story(bag, true)) + treeHtml(bag, [...t.first.map(text), ...t.second.flat().map(text)], { ends: [box(), box(), box(), box()] });
  },
  worked() {
    const bag = { a: 3, b: 2, n: 5, c1: "red", c2: "blue", s1: "R", s2: "B" };
    return worked(treeHtml(bag, ["3/5", "2/5", "3/5", "2/5", "3/5", "2/5"], { ends: ["9/25", "6/25", "6/25", "4/25"] }) +
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
    const bag = { a: 3, b: 2, n: 5, c1: "red", c2: "blue", s1: "R", s2: "B" };
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

/* ═══ PROBABILITY TABLES ═══════════════════════════════════════════════════*/

const cell = () => `<span class="wb-cell"></span>`;
const art = (html) => `<div class="sw-art">${html}</div>`;
const side = (figure, words) => `<div class="sw-side">${figure}<div class="sw-lines">${words}</div></div>`;

/* ── the table of outcomes: two spinners ─────────────────────────────────── */

const spaceOf = (it) => Array.from({ length: it.m }, (_, a) => Array.from({ length: it.n }, (_, b) => (it.times ? (a + 1) * (b + 1) : a + b + 2)));
const waysOf = (it, test) => spaceOf(it).flat().filter(test).length;

const tbSpace = {
  id: "tb-space",
  group: "pb-table",
  label: "The table of outcomes",
  blurb: "Two spinners: every pair in a grid, then count.",
  heading: "Probability tables: every outcome in a grid",
  instruction: () =>
    "When two things happen together, a TABLE shows every outcome: one spinner along the top, the other down " +
    "the side, and each cell is what that pair gives. Every cell is equally likely, so a chance is the number of " +
    "cells you want over the number of cells there are. Fill the empty cells, then count.",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    const t = tier(o);
    const m = t === "gentle" ? 3 : r.int(3, 4), n = t === "gentle" ? r.int(3, 4) : r.int(4, 5);
    const times = t === "stretch" ? r.chance(0.6) : false;
    const it = { m, n, times };
    const all = spaceOf(it).flat();
    /* a result that comes up more than once, and a line to be above */
    const counts = {}; all.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    const common = Object.keys(counts).map(Number).filter((v) => counts[v] >= 2);
    const want1 = r.pick(common);
    const sorted = [...new Set(all)].sort((a, b) => a - b);
    const over = sorted[r.int(1, sorted.length - 2)];
    /* three cells left empty, in three different rows where there are three */
    const hide = [0, 1, 2].map((k) => [k % m, r.int(0, n - 1)]);
    return { ...it, want1, over, hide, even: r.chance(0.5) };
  },
  render(it) {
    const T = spaceOf(it);
    const hid = new Set(it.hide.map(([a, b]) => `${a},${b}`));
    const head = [it.times ? "×" : "+", ...Array.from({ length: it.n }, (_, b) => String(b + 1))];
    const rows = T.map((row, a) => [String(a + 1), ...row.map((v, b) => (hid.has(`${a},${b}`) ? cell() : String(v)))]);
    const what = it.times ? "product" : "total";
    return ask(`One spinner has the numbers 1 to ${it.m} (down the side) and another has 1 to ${it.n} (along the top). ` +
      `Both are spun and the two numbers are ${it.times ? "multiplied" : "added"}.`) +
      side(art(tableHtml(head, rows, "pb-table pb-grid")),
        ask(`How many outcomes are there altogether? ${box()}`) +
        ask(`P(the ${what} is ${it.want1}) = ${box()}`) +
        ask(`P(the ${what} is more than ${it.over}) = ${box()}`) +
        ask(`P(the ${what} is ${it.even ? "even" : "odd"}) = ${box()}`));
  },
  worked() {
    return worked(say("Spinners 1 to 3 and 1 to 3, added: the table has 3 × 3 = 9 cells. A total of 4 is made by " +
      "1 + 3, 2 + 2 and 3 + 1 — three cells — so P(total is 4) = 3/9, which is 1/3."));
  },
  key(it) {
    const T = spaceOf(it), all = it.m * it.n;
    const seen = new Set();
    const cells = it.hide.filter(([a, b]) => !seen.has(`${a},${b}`) && seen.add(`${a},${b}`))
      .sort((p, q) => p[0] - q[0] || p[1] - q[1]).map(([a, b]) => want.cell(String(T[a][b])));
    return [...cells, want.num(all),
      want.frac(waysOf(it, (v) => v === it.want1), all),
      want.frac(waysOf(it, (v) => v > it.over), all),
      want.frac(waysOf(it, (v) => (v % 2 === 0) === it.even), all)];
  },
  answer(it) {
    const all = it.m * it.n;
    return [`${all} outcomes; ${fr(waysOf(it, (v) => v === it.want1), all)}; ${fr(waysOf(it, (v) => v > it.over), all)}; ` +
      `${fr(waysOf(it, (v) => (v % 2 === 0) === it.even), all)}`];
  },
};

/* ── a table of chances: they add up to 1 ────────────────────────────────── */

const SPIN = ["red", "blue", "green", "yellow", "white"];
const dec = (hundredths) => String(hundredths / 100);

const tbChances = {
  id: "tb-chances",
  group: "pb-table",
  label: "A table of chances",
  blurb: "Each outcome with its probability: together they make 1.",
  heading: "Probability tables: the chances add up to 1",
  instruction: () =>
    "A probability table lists every outcome with its chance. One of them MUST happen, so the chances add up " +
    "to 1 — which finds a missing one. For “this OR that”, add their chances. And to say how often to expect an " +
    "outcome, multiply its chance by the number of tries.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const k = tier(o) === "gentle" ? 3 : r.int(4, 5);
    const step = tier(o) === "gentle" ? 10 : 5;
    for (;;) {
      const parts = Array.from({ length: k - 1 }, () => r.int(1, tier(o) === "gentle" ? 4 : 7) * step);
      const last = 100 - parts.reduce((a, b) => a + b, 0);
      if (last < step || last > 60) continue;
      const p = [...parts, last];
      const miss = r.int(0, k - 1);
      let x = r.int(0, k - 1), y = r.int(0, k - 1);
      if (x === y) y = (y + 1) % k;
      const tries = r.pick([20, 40, 60, 100, 200]);
      const z = r.int(0, k - 1);
      if (!Number.isInteger((p[z] * tries) / 100)) continue;
      return { p, miss, x, y, z, tries };
    }
  },
  render(it) {
    const names = SPIN.slice(0, it.p.length);
    const table = `<table class="sw-table pb-table"><tbody><tr><td>Colour</td>${names.map((n) => `<td>${n}</td>`).join("")}</tr>` +
      `<tr><td>Probability</td>${it.p.map((v, i) => `<td>${i === it.miss ? box() : dec(v)}</td>`).join("")}</tr></tbody></table>`;
    return ask("A spinner lands on one of these colours. The table gives the chance of each.") + art(table) +
      ask(`P(${names[it.x]} or ${names[it.y]}) = ${box()}`) +
      ask(`P(not ${names[it.z]}) = ${box()}`) +
      ask(`In ${it.tries} spins, about how many would you expect to be ${names[it.z]}? ${box()}`);
  },
  worked() {
    return worked(say("Red 0.2, blue 0.5 and green missing: 0.2 + 0.5 = 0.7, so green is 1 − 0.7 = 0.3. " +
      "P(red or green) = 0.2 + 0.3 = 0.5. In 40 spins expect 0.2 × 40 = 8 reds."));
  },
  key(it) {
    return [want.num(it.p[it.miss] / 100, 0.0001), want.num((it.p[it.x] + it.p[it.y]) / 100, 0.0001),
      want.num((100 - it.p[it.z]) / 100, 0.0001), want.num((it.p[it.z] * it.tries) / 100)];
  },
  answer(it) {
    return [`${dec(it.p[it.miss])}; ${dec(it.p[it.x] + it.p[it.y])}; ${dec(100 - it.p[it.z])}; ${(it.p[it.z] * it.tries) / 100}`];
  },
};

/* ── a two-way table ─────────────────────────────────────────────────────── */

const WAYS = [
  { rows: ["Boys", "Girls"], one: ["boy", "girl"], cols: ["Walk", "Bus", "Car"], does: ["walks", "comes by bus", "comes by car"], who: "pupil" },
  { rows: ["Boys", "Girls"], one: ["boy", "girl"], cols: ["Football", "Chess", "Music"], does: ["chose football", "chose chess", "chose music"], who: "pupil" },
  { rows: ["Adults", "Children"], one: ["adult", "child"], cols: ["Tea", "Juice", "Water"], does: ["chose tea", "chose juice", "chose water"], who: "person" },
];

const tbTwoWay = {
  id: "tb-twoway",
  group: "pb-table",
  label: "A two-way table",
  blurb: "Counts sorted two ways; the chances read straight off.",
  heading: "Probability tables: a two-way table",
  hardest: true,
  instruction: () =>
    "A two-way table sorts the same people two ways at once, with the totals along the edges. Fill the empty " +
    "cells from the totals. Then a chance is read straight off: the cell (or total) you want, over the total " +
    "of the group being chosen from — the grand total, unless you are told the person comes from one row.",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    const w = r.int(0, WAYS.length - 1);
    const big = tier(o) === "stretch" ? 18 : 12;
    const n = [0, 1].map(() => [0, 1, 2].map(() => r.int(2, big)));
    return { w, n, c0: r.int(0, 2), c1: r.int(0, 2), row: r.int(0, 1), col: r.int(0, 2), given: tier(o) === "stretch" };
  },
  render(it) {
    const W = WAYS[it.w], n = it.n;
    const rowT = n.map((row) => row.reduce((a, b) => a + b, 0));
    const colT = [0, 1, 2].map((c) => n[0][c] + n[1][c]);
    const body = n.map((row, a) => `<tr><td>${W.rows[a]}</td>${row.map((v, c) => `<td>${a === 0 && c === it.c0 ? cell() : v}</td>`).join("")}` +
      `<td class="pb-total">${a === 1 ? cell() : rowT[a]}</td></tr>`).join("");
    const foot = `<tr><td>Total</td>${colT.map((v, c) => `<td class="pb-total">${c === it.c1 ? cell() : v}</td>`).join("")}<td class="pb-total">${rowT[0] + rowT[1]}</td></tr>`;
    const table = `<table class="sw-table pb-table"><thead><tr><th></th>${W.cols.map((c) => `<th>${c}</th>`).join("")}<th>Total</th></tr></thead><tbody>${body}${foot}</tbody></table>`;
    const a = W.one[it.row];
    return art(table) + ask(`One ${W.who} is chosen at random.`) +
      ask(`P(a ${a}) = ${box()}`) +
      ask(`P(the ${W.who} ${W.does[it.col]}) = ${box()}`) +
      ask(`P(a ${a} who ${W.does[it.col]}) = ${box()}`) +
      (it.given ? ask(`A ${a} is chosen at random. P(the ${a} ${W.does[it.col]}) = ${box()}`) : "");
  },
  worked() {
    return worked(say("If 30 pupils are in the table, 12 of them girls, and 5 of the girls walk: P(a girl) = 12/30 = 2/5; " +
      "P(a girl who walks) = 5/30 = 1/6. But if you are TOLD a girl is chosen, only the girls' row counts: " +
      "P(she walks) = 5/12."));
  },
  key(it) {
    const n = it.n;
    const rowT = n.map((row) => row.reduce((a, b) => a + b, 0));
    const colT = [0, 1, 2].map((c) => n[0][c] + n[1][c]);
    const all = rowT[0] + rowT[1];
    return [want.cell(String(n[0][it.c0])), want.cell(String(rowT[1])), want.cell(String(colT[it.c1])),
      want.frac(rowT[it.row], all), want.frac(colT[it.col], all), want.frac(n[it.row][it.col], all),
      ...(it.given ? [want.frac(n[it.row][it.col], rowT[it.row])] : [])];
  },
  answer(it) {
    const n = it.n;
    const rowT = n.map((row) => row.reduce((a, b) => a + b, 0));
    const colT = [0, 1, 2].map((c) => n[0][c] + n[1][c]);
    const all = rowT[0] + rowT[1];
    return [`cells ${n[0][it.c0]}, ${rowT[1]}, ${colT[it.c1]}; ${fr(rowT[it.row], all)}; ${fr(colT[it.col], all)}; ${fr(n[it.row][it.col], all)}` +
      (it.given ? `; ${fr(n[it.row][it.col], rowT[it.row])}` : "")];
  },
};

export const TR_EXERCISES = [ptOutcomes, ptFill, ptMultiply, ptWithout, ptPaths, tbSpace, tbChances, tbTwoWay];
