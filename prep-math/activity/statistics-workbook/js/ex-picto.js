/* ============================================================================
   Statistics Workbook — CHAPTER 1: Pictograms
   ----------------------------------------------------------------------------
   From the simplest thing a child can do with data to the hardest thing a
   pictogram asks, one step at a time:

     sort and count        a jumble of shapes: tap each one as you count it,
                           then count every kind into a table
     tally marks           reading tallies in gates of five, then turning a
                           list of answers into a tally chart
     reading a pictogram   one symbol is one thing: how many, the most, the
                           least, how many more, how many altogether
     symbols worth more    a key — one symbol is 2, 5, 10 … — and what a half
                           (and at Stretch a quarter) of a symbol is worth
     build a pictogram     from a table, into empty boxes: tapped on screen,
                           whole → half → empty, and marked row by row; a
                           pictogram half drawn to finish; choosing the key
     problems              money, fractions of the total, working backwards
                           from a pictogram, and spotting one that misleads

   Concrete first (things to touch and count), then the picture that stands for
   them, then the numbers and questions with nothing to count. Every answer is
   a number in a box, a tick, or the pictogram itself.
   ========================================================================== */

import { scatter, scatterSvg, shapeIcon, SHAPES, tallySvg, pictoSvg, symbolAt, SYMBOLS, tableHtml } from "./pictoart.js";
import { levelOf, helpOf, dealer } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead">${html}</p>`;
const art = (html) => `<div class="sw-art">${html}</div>`;
const side = (figure, words) => `<div class="sw-side">${figure}<div class="sw-lines">${words}</div></div>`;
/** A table and a pictogram side by side, each keeping its own size, wrapping when there is no room. */
const pair = (a, b) => `<div class="sw-pair">${a}${b}</div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
const L = levelOf;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fmt = (v) => String(Math.round(v * 100) / 100);

/* ── the data a pictogram is drawn from ────────────────────────────────── */

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DATA = [
  { title: "Favourite fruit", noun: "children", one: "child", symbol: "smiley", cats: ["Mango", "Orange", "Banana", "Pawpaw", "Apple"] },
  { title: "Books read this week", noun: "books", one: "book", symbol: "book", cats: WEEK },
  { title: "Fish caught", noun: "fish", one: "fish", symbol: "fish", cats: ["Ada", "Bayo", "Chidi", "Dayo", "Efe"] },
  { title: "Cars passing the school", noun: "cars", one: "car", symbol: "car", cats: ["Red", "Blue", "White", "Black", "Silver"] },
  { title: "Sunny days", noun: "days", one: "day", symbol: "sun", cats: ["January", "February", "March", "April", "May"] },
  { title: "Goals scored", noun: "goals", one: "goal", symbol: "ball", cats: ["Eagles", "Lions", "Stars", "Tigers", "Rockets"] },
  { title: "Cups of zobo sold", noun: "cups", one: "cup", symbol: "cup", cats: WEEK, price: 50 },
];
const dealData = dealer();

/**
 * Rows for a pictogram: `rows` categories, each a number of symbols made of
 * the parts this question allows (whole only, or halves, or quarters), all
 * different so "the most" and "the least" have one answer.
 */
function rowsOf(r, ctx, rows, { key = 1, parts = [1], most = 8, least = 1 } = {}) {
  const cats = ctx.cats.slice(0, rows);
  for (let g = 0; g < 300; g++) {
    const n = cats.map(() => {
      const whole = r.int(least, most);
      const part = r.pick(parts.map((p) => (p === 1 ? 0 : p)));
      return whole + part > most ? whole : whole + part;
    });
    if (new Set(n).size === n.length) return cats.map((label, i) => ({ label, n: n[i], v: n[i] * key }));
  }
  return cats.map((label, i) => ({ label, n: i + 1, v: (i + 1) * key }));
}

const keyText = (k, ctx) => `${k} ${k === 1 ? ctx.one : ctx.noun}`;

/* ═══ the groups ═══════════════════════════════════════════════════════════*/

export const PG_GROUPS = [
  { id: "pg-sort", chapter: "Chapter 1 · Pictograms", label: "Sort and count", blurb: "Tap each shape as you count it, then count every kind." },
  { id: "pg-tally", label: "Tally marks", blurb: "Gates of five: read them, then make them from a list." },
  { id: "pg-read", label: "Reading a pictogram", blurb: "One symbol is one thing: how many, most, least, how many more." },
  { id: "pg-key", label: "Symbols worth more", blurb: "The key: one symbol stands for 2, 5 or 10 — and half a symbol for half that." },
  { id: "pg-make", label: "Build a pictogram", blurb: "From a table into empty boxes — tapped on screen, marked row by row." },
  { id: "pg-solve", label: "Pictogram problems", blurb: "Money, fractions of the total, working backwards, and a pictogram that misleads." },
];

/* ═══ 1. sort and count ════════════════════════════════════════════════════*/

function jumble(r, o, big = false) {
  const t = tier(o);
  const kinds = r.shuffle(Object.keys(SHAPES)).slice(0, L(o).kinds);
  const hi = { gentle: 6, middle: 9, stretch: 12 }[t] || 6;
  const counts = Object.fromEntries(kinds.map((k) => [k, r.int(2, hi)]));
  const h = big || t === "stretch" ? 56 : 44;
  return { kinds, counts, h, items: scatter(r, counts, { w: 96, h }) };
}

const pgTap = {
  id: "pg-tap",
  group: "pg-sort",
  label: "Tap and count one kind",
  blurb: "Colour (or tap) every one of a kind as you count it, so none is counted twice.",
  heading: "Count one kind",
  instruction: () =>
    "Colour each shape of the kind asked for as you count it — on screen, tap it. Colouring as you go " +
    "means none is missed and none is counted twice.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const j = jumble(r, o);
    return { ...j, target: j.kinds[i % j.kinds.length] };
  },
  render(item) {
    const s = SHAPES[item.target];
    return art(scatterSvg(item.items, { h: item.h })) +
      ask(`Colour every ${s.name} ${shapeIcon(item.target)}. There are ${box()} ${s.plural}.`);
  },
  worked() {
    return worked(say("Start at the top left and work across, like reading. Colour each circle as you " +
      "count it: 1, 2, 3 … When you reach the bottom, the last number you said is how many circles there are."));
  },
  key(item) {
    const n = item.counts[item.target];
    return [want.colour({ count: n, says: `all ${n} ${SHAPES[item.target].plural}` }), want.num(n)];
  },
  answer(item) {
    return [`${item.counts[item.target]} ${SHAPES[item.target].plural}`];
  },
};

const pgCountAll = {
  id: "pg-count-all",
  group: "pg-sort",
  label: "Count every kind into a table",
  blurb: "Sort the jumble: how many of each shape?",
  heading: "Sort and count every kind",
  instruction: () =>
    "Count each kind of shape and write how many in the table. Make a tally mark as you count each " +
    "one if it helps. Then add up the column: it should be every shape in the box.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return jumble(r, o);
  },
  render(item) {
    const rows = item.kinds.map((k) => [`${shapeIcon(k)} ${SHAPES[k].plural}`, `<span class="sw-tallycell"></span>`, box()]);
    rows.push(["<b>Altogether</b>", "", box()]);
    return art(scatterSvg(item.items, { h: item.h })) + tableHtml(["Shape", "Tally", "How many"], rows);
  },
  key(item) {
    const total = item.kinds.reduce((a, k) => a + item.counts[k], 0);
    /* a pencil on the jumble, to tick shapes off as they are counted — not on
       the little shapes in the table */
    return [want.pen(".sw-art svg.sw-fig"), ...item.kinds.map((k) => want.num(item.counts[k])), want.num(total)];
  },
  answer(item) {
    return [item.kinds.map((k) => `${SHAPES[k].plural} ${item.counts[k]}`).join(", ")];
  },
};

/* ═══ 2. tally marks ═══════════════════════════════════════════════════════*/

const pgTallyRead = {
  id: "pg-tally-read",
  group: "pg-tally",
  label: "Read the tally",
  blurb: "Count the gates in fives, then the ones left over.",
  heading: "How many do the tally marks show?",
  instruction: () =>
    "Each gate — four marks and one across — is 5. Count the gates in fives (5, 10, 15 …), then add " +
    "the single marks left over.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const [lo, hi] = { gentle: [3, 15], middle: [8, 30], stretch: [20, 60] }[tier(o)] || [3, 15];
    return { n: r.int(lo, hi) };
  },
  render(item) {
    return side(art(tallySvg(item.n)), ask(`${box()}`));
  },
  worked() {
    return worked(side(art(tallySvg(13)), say("Two gates: 5, 10. Then three single marks: 11, 12, 13. The tally shows <b>13</b>.")));
  },
  key(item) {
    return [want.num(item.n)];
  },
  answer(item) {
    return [String(item.n)];
  },
};

const LISTS = [
  { title: "Favourite colours", words: ["red", "blue", "green", "yellow"] },
  { title: "How we came to school", words: ["walk", "bus", "car", "bike"] },
  { title: "Favourite sports", words: ["football", "tennis", "athletics", "basketball"] },
  { title: "Pets at home", words: ["cat", "dog", "fish", "bird"] },
];
const dealList = dealer();

const pgTallyMake = {
  id: "pg-tally-make",
  group: "pg-tally",
  label: "From a list to a tally chart",
  blurb: "Go through the answers once, making a mark for each — then count the marks.",
  heading: "Make a tally chart",
  instruction: () =>
    "Go through the answers once, from the first to the last. For each one, make one tally mark on " +
    "its row, and cross the answer out so you do not use it twice. Draw every fifth mark across the " +
    "other four. Then count each row.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const list = dealList(r, LISTS, i);
    const kinds = list.words.slice(0, L(o).kinds);
    const n = { gentle: 12, middle: 20, stretch: 30 }[tier(o)] || 12;
    const answers = Array.from({ length: n }, () => r.pick(kinds));
    kinds.forEach((w, j) => { if (!answers.includes(w)) answers[j] = w; });
    return { title: list.title, kinds, answers };
  },
  render(item) {
    const count = (w) => item.answers.filter((a) => a === w).length;
    void count;
    const rows = item.kinds.map((w) => [w, `<span class="sw-tallycell"></span>`, box()]);
    rows.push(["<b>Altogether</b>", "", box()]);
    return lead(`${item.title}: the answers`) + `<p class="sw-list">${item.answers.join(", ")}</p>` +
      tableHtml(["Answer", "Tally", "How many"], rows);
  },
  key(item) {
    return [...item.kinds.map((w) => want.num(item.answers.filter((a) => a === w).length)), want.num(item.answers.length)];
  },
  answer(item) {
    return [item.kinds.map((w) => `${w} ${item.answers.filter((a) => a === w).length}`).join(", ")];
  },
};

/* ═══ 3. reading a pictogram (one symbol, one thing) ═══════════════════════*/

const pgReadOne = {
  id: "pg-read-one",
  group: "pg-read",
  label: "One symbol, one thing",
  blurb: "Count the symbols in a row; compare rows; add them all.",
  heading: "Read the pictogram",
  instruction: () =>
    "Here every symbol stands for one. Count along a row for how many. The longest row is the most; " +
    "the shortest is the least.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const ctx = dealData(r, DATA, i);
    const rows = rowsOf(r, ctx, { gentle: 3, middle: 4, stretch: 5 }[tier(o)] || 3, { most: L(o).most });
    return { ctx: DATA.indexOf(ctx), rows, ask: r.int(0, rows.length - 1) };
  },
  render(item) {
    const ctx = DATA[item.ctx];
    const byV = item.rows.slice().sort((a, b) => b.v - a.v);
    const fig = pictoSvg({ rows: item.rows, symbol: ctx.symbol, key: { n: 1, noun: ctx.one }, title: ctx.title, cols: 0 });
    return side(art(fig),
      ask(`${item.rows[item.ask].label}: ${box()} ${ctx.noun}`) +
      ask("The most:") + tick(...item.rows.map((r) => r.label)) +
      ask(`How many more for ${byV[0].label} than ${byV[byV.length - 1].label}? ${box()}`) +
      ask(`Altogether: ${box()} ${ctx.noun}`));
  },
  worked() {
    const rows = [{ label: "Mango", n: 4 }, { label: "Orange", n: 2 }, { label: "Banana", n: 5 }];
    return worked(side(art(pictoSvg({ rows, symbol: "smiley", key: { n: 1, noun: "child" }, title: "Favourite fruit", cols: 0 })),
      say("Mango has 4 faces: 4 children. Banana's row is longest: the most, 5. 5 − 2 = 3 more for " +
        "Banana than Orange. Altogether 4 + 2 + 5 = <b>11</b>.")));
  },
  key(item) {
    const byV = item.rows.slice().sort((a, b) => b.v - a.v);
    const most = item.rows.indexOf(byV[0]);
    const total = item.rows.reduce((a, r) => a + r.v, 0);
    return [want.num(item.rows[item.ask].v), want.tick(most), want.num(byV[0].v - byV[byV.length - 1].v), want.num(total)];
  },
  answer(item) {
    const byV = item.rows.slice().sort((a, b) => b.v - a.v);
    const total = item.rows.reduce((a, r) => a + r.v, 0);
    return [`${item.rows[item.ask].v}; most ${byV[0].label}; ${byV[0].v - byV[byV.length - 1].v} more; ${total} altogether`];
  },
};

/* ═══ 4. symbols worth more ════════════════════════════════════════════════*/

/** A key other than 1 for this level, and the part-symbols the level reads. */
function keyFor(r, o) {
  const keys = L(o).keys.filter((k) => k !== 1);
  return r.pick(keys);
}
/* quarters only when the key divides into quarters */
const partsFor = (o, k) => L(o).parts.filter((p) => Number.isInteger(k * p));

const pgReadKey = {
  id: "pg-read-key",
  group: "pg-key",
  label: "Read it with the key",
  blurb: "Count the symbols, then times by the key. Half a symbol is half the key.",
  heading: "Use the key",
  instruction: (o) =>
    "Look at the key first: it says how many one symbol stands for. Count the symbols in a row and " +
    "multiply by that number." + (tier(o) === "gentle" ? "" : " Part of a symbol is that part of the key: half a symbol is half of it."),
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const ctx = dealData(r, DATA, i + 2);
    const key = keyFor(r, o);
    const rows = rowsOf(r, ctx, { gentle: 3, middle: 4, stretch: 4 }[tier(o)] || 3, { key, parts: partsFor(o, key), most: 6 });
    return { ctx: DATA.indexOf(ctx), key, rows };
  },
  render(item) {
    const ctx = DATA[item.ctx];
    const byV = item.rows.slice().sort((a, b) => b.v - a.v);
    const fig = pictoSvg({ rows: item.rows, symbol: ctx.symbol, key: { n: item.key, noun: ctx.noun }, title: ctx.title, cols: 0 });
    const table = tableHtml([ctx.title.split(" ")[0], `How many ${ctx.noun}`], item.rows.map((r) => [r.label, box()]));
    return side(art(fig), table +
      ask(`How many more for ${byV[0].label} than ${byV[byV.length - 1].label}? ${box()}`) +
      ask(`Altogether: ${box()}`));
  },
  worked() {
    const rows = [{ label: "Monday", n: 3 }, { label: "Tuesday", n: 1.5 }, { label: "Wednesday", n: 4 }];
    return worked(side(art(pictoSvg({ rows, symbol: "book", key: { n: 2, noun: "books" }, title: "Books read", cols: 0 })),
      say("The key: one book stands for 2 books. Monday: 3 symbols, 3 × 2 = 6. Tuesday: one and a half " +
        "symbols — 2 for the whole one, 1 for the half — 3. Wednesday: 4 × 2 = <b>8</b>.")));
  },
  key(item) {
    const byV = item.rows.slice().sort((a, b) => b.v - a.v);
    const total = item.rows.reduce((a, r) => a + r.v, 0);
    return [...item.rows.map((r) => want.num(r.v)), want.num(byV[0].v - byV[byV.length - 1].v), want.num(total)];
  },
  answer(item) {
    const total = item.rows.reduce((a, r) => a + r.v, 0);
    return [`${item.rows.map((r) => `${r.label} ${fmt(r.v)}`).join(", ")}; altogether ${fmt(total)}`];
  },
};

const PART_KEYS = { middle: [2, 4, 10, 6], stretch: [4, 8, 20, 100] };
const PART_WORDS = { 1: "a whole symbol", 0.5: "half a symbol", 0.25: "a quarter of a symbol", 0.75: "three quarters of a symbol" };

const pgParts = {
  id: "pg-parts",
  group: "pg-key",
  label: "What is part of a symbol worth?",
  blurb: "Half a symbol is half the key; a quarter is a quarter of it.",
  heading: "What does each one stand for?",
  minLevel: "middle",
  instruction: () =>
    "The key says what a whole symbol stands for. Half a symbol stands for half of that; a quarter " +
    "for a quarter of it; three quarters for three of those quarters.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const ctx = r.pick(DATA);
    const key = r.pick(PART_KEYS[tier(o)] || PART_KEYS.middle);
    return { ctx: DATA.indexOf(ctx), key, parts: tier(o) === "stretch" ? [1, 0.5, 0.25, 0.75] : [1, 0.5] };
  },
  render(item) {
    const ctx = DATA[item.ctx];
    const pic = (p) => `<svg class="sw-icon" viewBox="0 0 10 10" width="8mm" height="8mm" aria-hidden="true">` +
      `<defs><clipPath id="pc-q1"><rect width="2.5" height="10"/></clipPath><clipPath id="pc-q2"><rect width="5" height="10"/></clipPath><clipPath id="pc-q3"><rect width="7.5" height="10"/></clipPath></defs>` +
      symbolAt(ctx.symbol, 0, 0, 10, p) + `</svg>`;
    return lead(`Key: ${pic(1)} = ${item.key} ${ctx.noun}`) +
      item.parts.slice(1).map((p) => ask(`${pic(p)} ${PART_WORDS[p]} = ${box()} ${ctx.noun}`)).join("");
  },
  key(item) {
    return item.parts.slice(1).map((p) => want.num(item.key * p));
  },
  answer(item) {
    return [item.parts.slice(1).map((p) => `${PART_WORDS[p]}: ${fmt(item.key * p)}`).join("; ")];
  },
};

/* ═══ 5. build a pictogram ═════════════════════════════════════════════════*/

/** Rows for a pictogram to BUILD: whole and half symbols only (a box can hold a half). */
function buildRows(r, o, i, n = null) {
  const ctx = DATA[(i + 3) % DATA.length];
  const t = tier(o);
  const key = t === "gentle" ? r.pick([1, 2]) : t === "middle" ? r.pick([2, 10]) : r.pick([4, 20]);
  const parts = t === "gentle" ? [1] : [1, 0.5];
  const rows = rowsOf(r, ctx, n || { gentle: 3, middle: 4, stretch: 5 }[t] || 3, { key, parts, most: { gentle: 6, middle: 6, stretch: 7 }[t] || 6 });
  return { ctx: DATA.indexOf(ctx), key, rows };
}

const pgBuild = {
  id: "pg-build",
  group: "pg-make",
  label: "Draw the pictogram from the table",
  blurb: "Divide each number by the key; draw that many symbols — a half at the end if needed.",
  heading: "Build the pictogram",
  instruction: (o) =>
    "For each row, divide the number in the table by the key: that is how many symbols to draw. " +
    "Draw them from the left, in the boxes, with no gaps" + (tier(o) === "gentle" ? "." : "; if there is a half left, draw half a symbol at the end.") +
    " On screen, tap a box: once for a whole symbol, again for half, again to empty it.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return buildRows(r, o, i);
  },
  render(item) {
    const ctx = DATA[item.ctx];
    const cols = Math.min(9, Math.ceil(Math.max(...item.rows.map((x) => x.n))) + 2);
    const table = tableHtml([ctx.title.split(" ")[0], `How many ${ctx.noun}`], item.rows.map((x) => [x.label, fmt(x.v)]));
    const fig = pictoSvg({ rows: item.rows.map((x) => ({ label: x.label, build: true })), symbol: ctx.symbol, key: { n: item.key, noun: ctx.noun }, title: ctx.title, cols });
    return pair(table, art(fig));
  },
  worked() {
    return worked(say("Key: one cup stands for 2 cups. Monday sold 6: 6 ÷ 2 = 3, so three cups. Tuesday " +
      "sold 5: 5 ÷ 2 = 2½, so two cups and half a cup at the end."));
  },
  key(item) {
    return [want.picto({ rows: item.rows.map((x) => Math.round(x.n * 2)), says: item.rows.map((x) => `${x.label}: ${fmt(x.n)} symbols`).join(", ") })];
  },
  answer(item) {
    return [item.rows.map((x) => `${x.label}: ${fmt(x.n)} symbols`).join(", ")];
  },
};

const pgComplete = {
  id: "pg-complete",
  group: "pg-make",
  label: "Finish the pictogram and the table",
  blurb: "Read the rows that are drawn into the table; draw the rows the table gives.",
  heading: "Finish both",
  instruction: () =>
    "Some rows are drawn and some are only in the table. Read each drawn row with the key and write " +
    "its number in the table. Draw the rows the table gives but the pictogram does not have.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const b = buildRows(r, o, i + 1, 4);
    const toBuild = r.shuffle([0, 1, 2, 3]).slice(0, 2).sort();
    return { ...b, toBuild };
  },
  render(item) {
    const ctx = DATA[item.ctx];
    const cols = Math.min(9, Math.ceil(Math.max(...item.rows.map((x) => x.n))) + 2);
    const table = tableHtml([ctx.title.split(" ")[0], `How many ${ctx.noun}`],
      item.rows.map((x, j) => [x.label, item.toBuild.includes(j) ? fmt(x.v) : box()]));
    const fig = pictoSvg({
      rows: item.rows.map((x, j) => (item.toBuild.includes(j) ? { label: x.label, build: true } : { label: x.label, n: x.n })),
      symbol: ctx.symbol, key: { n: item.key, noun: ctx.noun }, title: ctx.title, cols,
    });
    return pair(table, art(fig));
  },
  key(item) {
    const read = item.rows.filter((x, j) => !item.toBuild.includes(j)).map((x) => want.num(x.v));
    return [...read, want.picto({ rows: item.rows.map((x, j) => (item.toBuild.includes(j) ? Math.round(x.n * 2) : null)), says: item.toBuild.map((j) => `${item.rows[j].label}: ${fmt(item.rows[j].n)} symbols`).join(", ") })];
  },
  answer(item) {
    return [item.rows.map((x, j) => `${x.label} ${fmt(x.v)}${item.toBuild.includes(j) ? ` (${fmt(x.n)} symbols)` : ""}`).join(", ")];
  },
};

/* The best key: every row comes out in whole or half symbols, with as few
   symbols as that allows. The wrong choices are a smaller key that works but
   draws twice as many, a bigger one that leaves quarters, and one that does
   not divide at all. */
const KEY_SETS = { middle: { k: 10, opts: [5, 10, 20, 3] }, stretch: { k: 20, opts: [10, 20, 40, 15] } };

const pgChooseKey = {
  id: "pg-choose-key",
  group: "pg-make",
  label: "Choose the best key",
  blurb: "Whole or half symbols in every row, and as few of them as that allows.",
  heading: "Which key is best?",
  minLevel: "middle",
  instruction: () =>
    "A good key makes every row come out in whole symbols or halves — never quarters or thirds — and " +
    "does not make the rows so long they will not fit. Try each key on every number.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const set = KEY_SETS[tier(o)] || KEY_SETS.middle;
    const half = set.k / 2;
    let vals;
    do { vals = [0, 0, 0, 0].map(() => r.int(2, 18) * half); } while (!vals.some((v) => (v / half) % 2 === 1) || Math.max(...vals) / set.k > 9 || new Set(vals).size < 4);
    return { vals, k: set.k, opts: set.opts };
  },
  render(item) {
    return lead(`The numbers: ${item.vals.join(", ")}`) + ask("The best key: one symbol stands for") + tick(...item.opts.map(String));
  },
  worked() {
    return worked(say("35, 20, 45: a key of 10 gives 3½, 2, 4½ — halves at most. A key of 5 works too, but " +
      "draws twice as many symbols. A key of 20 gives 1¾: quarters. So <b>10</b>."));
  },
  key(item) {
    return [want.tick(item.opts.indexOf(item.k))];
  },
  answer(item) {
    return [`${item.k} — ${item.vals.map((v) => fmt(v / item.k)).join(", ")} symbols`];
  },
};

/* ═══ 6. problems ══════════════════════════════════════════════════════════*/

const SELLING = DATA.filter((d) => d.price);
const pgProblems = {
  id: "pg-problems",
  group: "pg-solve",
  label: "Money, fractions and working backwards",
  blurb: "Use the pictogram's numbers: cost, what fraction of all, how many symbols to add.",
  heading: "Solve with the pictogram",
  instruction: () =>
    "Work out the numbers from the pictogram first — write them beside the rows if it helps — then " +
    "answer. A fraction of the total is that row's number over the total, made as simple as it goes.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const ctx = r.pick(SELLING);
    const t = tier(o);
    const key = t === "gentle" ? 2 : t === "middle" ? r.pick([2, 10]) : r.pick([4, 20]);
    const rows = rowsOf(r, ctx, 4, { key, parts: t === "gentle" ? [1] : [1, 0.5], most: 6 });
    const a = r.int(0, 3);
    const b = (a + 1 + r.int(0, 2)) % 4;
    const extra = (key / (t === "gentle" ? 1 : 2)) * r.int(1, 4);
    return { ctx: DATA.indexOf(ctx), key, rows, a, b, extra };
  },
  render(item) {
    const ctx = DATA[item.ctx];
    const fig = pictoSvg({ rows: item.rows, symbol: ctx.symbol, key: { n: item.key, noun: ctx.noun }, title: ctx.title, cols: 0 });
    const A = item.rows[item.a];
    const B = item.rows[item.b];
    return art(fig) +
      ask(`Each ${ctx.one} costs ₦${ctx.price}. How much was taken on ${A.label}? ₦${box()}`) +
      ask(`What fraction of all the ${ctx.noun} were sold on ${B.label}? ${box()}`) +
      ask(`On Saturday, ${item.extra} more ${ctx.noun} were sold than on ${A.label}. How many symbols would Saturday's row need? ${box()}`);
  },
  worked() {
    return worked(say("Key 2 cups. Monday shows 3 symbols: 6 cups. At ₦50 each that is <b>₦300</b>. All the rows " +
      "add up to 20 cups, so Monday is 6/20 = <b>3/10</b> of them. Saturday sold 6 + 3 = 9 cups: 9 ÷ 2 = <b>4½</b> symbols."));
  },
  key(item) {
    const ctx = DATA[item.ctx];
    const A = item.rows[item.a];
    const B = item.rows[item.b];
    const total = item.rows.reduce((s, x) => s + x.v, 0);
    const g = gcd(B.v, total);
    const forms = [`${B.v / g}/${total / g}`, `${B.v}/${total}`];
    const sym = (A.v + item.extra) / item.key;
    const symForms = Number.isInteger(sym) ? [String(sym)] : [String(sym), `${Math.floor(sym)}½`, `${Math.floor(sym)} 1/2`];
    return [want.num(A.v * ctx.price), want.text(...forms), want.text(...symForms)];
  },
  answer(item) {
    const ctx = DATA[item.ctx];
    const A = item.rows[item.a];
    const B = item.rows[item.b];
    const total = item.rows.reduce((s, x) => s + x.v, 0);
    const g = gcd(B.v, total);
    return [`₦${A.v * ctx.price}; ${B.v / g}/${total / g}; ${fmt((A.v + item.extra) / item.key)} symbols`];
  },
};

const FAULTS = ["The symbols are different sizes", "There is no key", "The symbols are not lined up", "Nothing is wrong"];
let wrongTurn = 0;

const pgWrong = {
  id: "pg-wrong",
  group: "pg-solve",
  label: "What is wrong with it?",
  blurb: "A pictogram can mislead: big symbols, no key, crooked rows.",
  heading: "What is wrong with this pictogram?",
  instruction: () =>
    "A fair pictogram has every symbol the same size, the symbols lined up in columns so rows can be " +
    "compared by length, and a key saying what one symbol stands for. Tick what is wrong — or that nothing is.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    if (i === 0) wrongTurn = r.int(0, 3);
    const fault = (i + wrongTurn) % 4;
    const ctx = r.pick(DATA);
    const rows = rowsOf(r, ctx, 3, { key: 2, parts: [1], most: 5 });
    return { ctx: DATA.indexOf(ctx), rows, fault, sizes: rows.map((_, j) => [1, 0.7, 1.3][(j + i) % 3]) };
  },
  render(item) {
    const ctx = DATA[item.ctx];
    const fig = pictoSvg({
      rows: item.rows, symbol: ctx.symbol, title: ctx.title, cols: 0,
      key: item.fault === 1 ? null : { n: 2, noun: ctx.noun },
      sizes: item.fault === 0 ? item.sizes : null,
      ragged: item.fault === 2,
    });
    return art(fig) + tick(...FAULTS);
  },
  key(item) {
    return [want.tick(item.fault)];
  },
  answer(item) {
    return [FAULTS[item.fault]];
  },
};

export const PG_EXERCISES = [
  pgTap, pgCountAll,
  pgTallyRead, pgTallyMake,
  pgReadOne,
  pgReadKey, pgParts,
  pgBuild, pgComplete, pgChooseKey,
  pgProblems, pgWrong,
];

void SYMBOLS; void helpOf;
