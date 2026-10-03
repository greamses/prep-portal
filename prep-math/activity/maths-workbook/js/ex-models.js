/* ============================================================================
   Maths Workbook — the BAR MODEL and word problems (chapter 9)
   ----------------------------------------------------------------------------
   The Singapore bar model: a word problem drawn as strips of paper before a
   single sum is done, so the child decides WHAT to work out by looking, and
   only then works it out. Four kinds of model, each its own section, and then
   the word problems with no picture at all — the child draws it:

     part–whole      two parts make a whole; find the whole, or a part
     comparison      one has more than the other; find it, or the difference
     part to part    "3 times as many", "2 for every 3" — equal UNITS
     part to whole   a fraction of the whole — the whole cut into units

   Every number is made to fit: units always divide, differences are always
   positive. The pictures come from modelart.js and, as a Singapore bar model
   is, they are DRAWN TO SCALE — the box with the question mark too, so a
   small difference never looks bigger than the amount it is the difference
   of. (The Algebra Workbook's rule is the opposite — its x box is never to
   scale — because there the picture must not give away x; here the sum is
   the point, and the picture's job is to say which sum.)
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf } from "./ex-remainder.js";
import { modelSvg, blankModelSvg, units } from "./modelart.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const story = (html) => `<p class="wb-ask mb-story">${html}</p>`;
const art = (html) => `<div class="mb-art">${html}</div>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const answers = (...labels) => ask(labels.map((l) => `${l} ${box()}`).join(" &nbsp;&nbsp; "));
const tier = (o) => levelOf(o).id;

const NAMES = ["Ada", "Tunde", "Musa", "Chika", "Bola", "Ngozi", "Emeka", "Zainab", "Kemi", "Ife", "Sani", "Amaka"];
const two = (r) => { const a = r.pick(NAMES); let b = r.pick(NAMES); while (b === a) b = r.pick(NAMES); return [a, b]; };
const THINGS = ["marbles", "stickers", "books", "oranges", "beads", "pencils", "sweets", "stamps"];

/** Numbers in the size a level uses. */
const size = (r, t, lo = 1) => (t === "gentle" ? r.int(Math.max(lo, 8), 60) : t === "middle" ? r.int(Math.max(lo, 105), 640) : r.int(Math.max(lo, 1050), 6400));

export const MODEL_GROUPS = [
  { chapter: "Chapter 9 · Bar models and word problems", id: "model-pw", label: "Part and whole", blurb: "Two parts make a whole — find the whole, or the part that is missing." },
  { id: "model-cmp", label: "Comparison", blurb: "One has more than the other — the extra is a box of its own." },
  { id: "model-pp", label: "Part to part", blurb: "“3 times as many”, “2 for every 3” — equal units." },
  { id: "model-pwf", label: "Part to whole", blurb: "A fraction of the whole: the whole cut into equal units." },
  { id: "model-word", label: "Word problems", blurb: "No picture — draw the model, then answer." },
];

/* ═══ the four kinds of problem — each makes { story, model, ask, key, answer } ═══*/

function partWhole(r, o) {
  const t = tier(o);
  const [A] = two(r);
  const thing = r.pick(THINGS);
  const three = t === "stretch" && r.chance(0.5);
  const parts = three ? [size(r, t), size(r, t), size(r, t)] : [size(r, t), size(r, t)];
  const whole = parts.reduce((s, v) => s + v, 0);
  const tones = ["a", "c", "a"];
  if (r.chance(0.5)) {
    const list = parts.length === 3 ? `${parts[0]} red, ${parts[1]} blue and ${parts[2]} green ${thing}` : `${parts[0]} red ${thing} and ${parts[1]} blue ${thing}`;
    return {
      story: `${A} has ${list}. How many ${thing} does ${A} have altogether?`,
      rows: [{ parts: parts.map((v, i) => ({ text: String(v), value: v, tone: tones[i] })), says: "?" }],
      labels: ["altogether:"], key: [whole], answer: [`${parts.join(" + ")} = ${whole}`],
    };
  }
  const miss = parts.length - 1;
  const knownSum = whole - parts[miss];
  return {
    story: `There are ${whole} ${thing} in a box. ${parts.length === 3 ? `${parts[0]} are red and ${parts[1]} are blue` : `${parts[0]} are red`}; the rest are green. How many are green?`,
    rows: [{ parts: [...parts.slice(0, miss).map((v, i) => ({ text: String(v), value: v, tone: tones[i] })), { text: "?", value: parts[miss], tone: "b" }], says: String(whole) }],
    labels: ["green:"], key: [parts[miss]], answer: [`${whole} − ${knownSum} = ${parts[miss]}`],
  };
}

function comparison(r, o) {
  const t = tier(o);
  const [A, B] = two(r);
  const thing = r.pick(THINGS);
  const small = size(r, t);
  const d = t === "gentle" ? r.int(3, 25) : t === "middle" ? r.int(12, 180) : r.int(110, 1900);
  const big = small + d;
  const both = t !== "gentle";
  const kind = r.int(0, 2); // 0 find the bigger · 1 find the smaller · 2 find the difference
  const rowA = (parts, says) => ({ name: A, parts, says });
  const rowB = (parts, says) => ({ name: B, parts, says });
  if (kind === 0) {
    return {
      story: `${A} has ${small} ${thing}. ${B} has ${d} more than ${A}. How many ${thing} does ${B} have?${both ? " How many do they have altogether?" : ""}`,
      rows: [rowA([{ text: String(small), value: small }], String(small)), rowB([{ text: String(small), value: small }, { text: String(d), value: d, tone: "c" }], "?")],
      labels: both ? [`${B}:`, "altogether:"] : [`${B}:`], key: both ? [big, small + big] : [big],
      answer: both ? [`${B}: ${small} + ${d} = ${big}`, `altogether: ${small} + ${big} = ${small + big}`] : [`${small} + ${d} = ${big}`],
    };
  }
  if (kind === 1) {
    return {
      story: `${A} has ${big} ${thing}. ${B} has ${d} fewer than ${A}. How many ${thing} does ${B} have?${both ? " How many do they have altogether?" : ""}`,
      rows: [rowA([{ text: "?", value: small, tone: "b" }, { text: String(d), value: d, tone: "c" }], String(big)), rowB([{ text: "?", value: small, tone: "b" }], "?")],
      labels: both ? [`${B}:`, "altogether:"] : [`${B}:`], key: both ? [small, small + big] : [small],
      answer: both ? [`${B}: ${big} − ${d} = ${small}`, `altogether: ${big} + ${small} = ${small + big}`] : [`${big} − ${d} = ${small}`],
    };
  }
  return {
    story: `${A} has ${big} ${thing} and ${B} has ${small}. How many more ${thing} does ${A} have than ${B}?`,
    rows: [rowA([{ text: String(small), value: small }, { text: "?", value: d, tone: "b" }], String(big)), rowB([{ text: String(small), value: small }], String(small))],
    labels: ["more:"], key: [d], answer: [`${big} − ${small} = ${d}`],
  };
}

function partPart(r, o) {
  const t = tier(o);
  const [A, B] = two(r);
  const thing = r.pick(THINGS);
  if (t === "stretch" && r.chance(0.5)) {
    /* a ratio: p for every q */
    const pairs = [[1, 2], [2, 3], [1, 3], [3, 4], [2, 5], [3, 5], [1, 4]];
    const [p, q] = r.pick(pairs);
    const u = r.int(6, 45);
    const total = (p + q) * u;
    return {
      story: `In a jar, for every ${p} red bead${p > 1 ? "s" : ""} there ${q > 1 ? "are" : "is"} ${q} blue bead${q > 1 ? "s" : ""}. There are ${total} beads in the jar. How many are red and how many are blue?`,
      rows: [{ name: "red", parts: units(p, "a"), says: null }, { name: "blue", parts: units(q, "b"), says: null }],
      total: String(total), cap: 20,
      labels: ["1 unit:", "red:", "blue:"], key: [u, p * u, q * u],
      answer: [`${p} + ${q} = ${p + q} units = ${total}, so 1 unit = ${u}`, `red ${p * u}, blue ${q * u}`],
    };
  }
  const k = t === "gentle" ? r.int(2, 3) : r.int(2, 5);
  const u = t === "gentle" ? r.int(2, 12) : t === "middle" ? r.int(6, 40) : r.int(25, 240);
  if (t !== "gentle" && r.chance(0.5)) {
    /* the difference is told, not the total */
    const diff = (k - 1) * u;
    return {
      story: `${A} has ${k} times as many ${thing} as ${B}. ${A} has ${diff} more than ${B}. How many does each of them have?`,
      rows: [{ name: A, parts: units(k, "a"), says: null }, { name: B, parts: units(1, "a"), says: null }],
      over: { from: 1, to: k, text: `${diff} more` }, cap: 20,
      labels: ["1 unit:", `${B}:`, `${A}:`], key: [u, u, k * u],
      answer: [`${k - 1} units = ${diff}, so 1 unit = ${u}`, `${B} ${u}, ${A} ${k * u}`],
    };
  }
  const total = (k + 1) * u;
  return {
    story: `${A} has ${k} times as many ${thing} as ${B}. Together they have ${total}. How many does each of them have?`,
    rows: [{ name: A, parts: units(k, "a"), says: null }, { name: B, parts: units(1, "a"), says: null }],
    total: String(total), cap: 20,
    labels: ["1 unit:", `${B}:`, `${A}:`], key: [u, u, k * u],
    answer: [`${k + 1} units = ${total}, so 1 unit = ${u}`, `${B} ${u}, ${A} ${k * u}`],
  };
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function partWholeFraction(r, o) {
  const t = tier(o);
  const dens = t === "gentle" ? [2, 3, 4, 5] : t === "middle" ? [3, 4, 5, 6, 8] : [4, 5, 6, 7, 8, 9, 10];
  const d = r.pick(dens);
  let n = r.int(1, d - 1);
  while (gcd(n, d) !== 1) n = r.int(1, d - 1);
  const u = t === "gentle" ? r.int(2, 10) : t === "middle" ? r.int(4, 25) : r.int(8, 60);
  const total = d * u;
  const row = [...units(n, "b"), ...units(d - n, "a")];
  if (t === "stretch" && r.chance(0.5)) {
    /* the part is told; find the whole */
    return {
      story: `${n}/${d} of the pupils in a school hall are girls. There are ${n * u} girls. How many pupils are in the hall? How many are boys?`,
      rows: [{ parts: row, says: "?" }], over: { from: 0, to: n, text: `${n * u} girls` }, cap: 20,
      labels: ["1 unit:", "pupils:", "boys:"], key: [u, total, total - n * u],
      answer: [`${n} units = ${n * u}, so 1 unit = ${u}`, `pupils ${total}, boys ${total - n * u}`],
    };
  }
  return {
    story: `There are ${total} pupils in a school hall. ${n}/${d} of them are girls. How many are girls, and how many are boys?`,
    rows: [{ parts: row, says: String(total) }], over: { from: 0, to: n, text: "girls" }, cap: 20,
    labels: ["1 unit:", "girls:", "boys:"], key: [u, n * u, total - n * u],
    answer: [`${d} units = ${total}, so 1 unit = ${u}`, `girls ${n * u}, boys ${total - n * u}`],
  };
}

const KINDS = [partWhole, comparison, partPart, partWholeFraction];
const draw = (p) => art(modelSvg(p.rows, { total: p.total ?? null, over: p.over ?? null, cap: p.cap ?? 7 }));

/** One exercise per kind: the story, its model drawn, the answers. */
function section(id, group, maker, { label, blurb, heading, instruction, example, exampleSay }) {
  return {
    id, group, label, blurb, heading,
    instruction: () => instruction,
    cols: 1,
    defaultCount: 3,
    make: (r, o) => maker(r, o),
    render: (p) => story(p.story) + draw(p) + answers(...p.labels),
    worked: () => worked(story(example.story) + draw(example) + say(exampleSay)),
    key: (p) => p.key.map((v) => want.num(v)),
    answer: (p) => p.answer,
  };
}

const pw = section("mod-pw", "model-pw", partWhole, {
  label: "Part and whole",
  blurb: "Find the whole, or the part that is missing.",
  heading: "Part and whole",
  instruction: "Read the story and look at the model. If you know the parts, ADD them for the whole. If you know the whole and a part, TAKE AWAY to find the part that is missing.",
  example: { story: "Kemi has 35 red beads and 27 blue beads. How many beads does Kemi have altogether?", rows: [{ parts: [{ text: "35", value: 35, tone: "a" }, { text: "27", value: 27, tone: "c" }], says: "?" }] },
  exampleSay: "Both parts are known and the whole is the question mark, so add: 35 + 27 = 62.",
});

const cmp = section("mod-cmp", "model-cmp", comparison, {
  label: "Comparison",
  blurb: "More than, fewer than, and how many more.",
  heading: "Comparing two amounts",
  instruction: "Two bars, lined up at the left. The longer one's EXTRA is its own box — that is the difference. To find the bigger amount, add the difference on; to find the smaller, take it off; to find the difference, take the smaller from the bigger.",
  example: { story: "Musa has 48 stamps. Bola has 15 more than Musa. How many stamps does Bola have?", rows: [{ name: "Musa", parts: [{ text: "48", value: 48 }], says: "48" }, { name: "Bola", parts: [{ text: "48", value: 48 }, { text: "15", value: 15, tone: "c" }], says: "?" }] },
  exampleSay: "Bola's bar is Musa's 48 and an extra 15. So Bola has 48 + 15 = 63.",
});

const pp = section("mod-pp", "model-pp", partPart, {
  label: "Part to part",
  blurb: "Times as many, and for every.",
  heading: "Part to part: equal units",
  instruction: "“3 times as many” means three equal boxes against one. Count the units, share the total (or the difference) between them to find ONE unit, then multiply up for each person.",
  example: { story: "Ada has 3 times as many stickers as Tunde. Together they have 48. How many does each have?", rows: [{ name: "Ada", parts: units(3, "a") }, { name: "Tunde", parts: units(1, "a") }], total: "48", cap: 20 },
  exampleSay: "4 units make 48, so 1 unit is 48 ÷ 4 = 12. Tunde has 1 unit, 12; Ada has 3 units, 36.",
});

const pwf = section("mod-pwf", "model-pwf", partWholeFraction, {
  label: "Part to whole",
  blurb: "A fraction of the whole, in equal units.",
  heading: "Part to whole: a fraction of the whole",
  instruction: "A fraction cuts the whole into equal units — fifths into 5. Share the whole between the units to find ONE unit, then count units for the part. (When the part is told instead, share THAT between its units.)",
  example: { story: "There are 40 pupils in a hall. 3/5 of them are girls. How many are girls, and how many are boys?", rows: [{ parts: [...units(3, "b"), ...units(2, "a")], says: "40" }], over: { from: 0, to: 3, text: "girls" }, cap: 20 },
  exampleSay: "5 units make 40, so 1 unit is 8. Girls are 3 units: 24. Boys are the other 2 units: 16.",
});

/* ═══ word problems: the same four kinds, and the child draws the model ═══*/

const word = {
  id: "mod-word",
  group: "model-word",
  label: "Word problems",
  blurb: "All four kinds mixed, no picture — draw the model first.",
  heading: "Word problems — draw the model, then answer",
  instruction: () =>
    "Each problem is one of the four kinds: part and whole, comparison, part to part, or part to whole. Decide which, DRAW its bar model in the space, then answer. Write what each bar is beside it.",
  cols: 1,
  defaultCount: 4,
  make: (r, o, k, i) => KINDS[(i + r.int(0, 3)) % 4](r, o),
  render: (p) => story(p.story) + art(blankModelSvg()) + answers(...p.labels),
  key: (p) => p.key.map((v) => want.num(v)),
  answer: (p) => p.answer,
};

export const MODEL_EXERCISES = [pw, cmp, pp, pwf, word];
