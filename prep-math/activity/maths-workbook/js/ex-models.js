/* ============================================================================
   Maths Workbook — the BAR MODEL and word problems (chapter 9)
   ----------------------------------------------------------------------------
   The Singapore bar model: a word problem drawn as strips of paper before a
   single sum is done, so the child decides WHAT to work out by looking, and
   only then works it out. It is one picture for a great many kinds of
   problem, and each has its own section:

     part and whole   two parts make a whole; find the whole, or a part
     comparison       one has more than the other; find it, or the difference
     ratio            "3 times as many", "2 for every 3", 2 : 3 : 4 — equal
                      UNITS; told the total, the difference, or one share
     fractions        a fraction of the whole, the whole from its part, and a
                      fraction OF WHAT IS LEFT
     percentages      the whole as 10 (or 4, or 5) equal units of 10 % (25 %,
                      20 %); a percentage of, the whole from its percentage,
                      and going up or down by a percentage
     degrees          360° and 180° as the whole: a pie chart's angles, and
                      angles in a ratio or with a difference

   and then the word problems with no picture at all — the child builds it.

   Every number is made to fit: units always divide, differences are always
   positive. The pictures come from modelart.js and, as a Singapore bar model
   is, they are DRAWN TO SCALE — the box with the question mark too, so a
   small difference never looks bigger than the amount it is the difference
   of. (The Algebra Workbook's rule is the opposite — its x box is never to
   scale — because there the picture must not give away x; here the sum is
   the point, and the picture's job is to say which sum.)

   Numbers are never written beside a bar: what a stretch of bars comes to
   is on a brace over or under it (modelart.js).
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { levelOf } from "./ex-remainder.js";
import { modelSvg, blankModelSvg, boardUnder, units } from "./modelart.js";

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
const three = (r) => { const [a, b] = two(r); let c = r.pick(NAMES); while (c === a || c === b) c = r.pick(NAMES); return [a, b, c]; };
const THINGS = ["marbles", "stickers", "books", "oranges", "beads", "pencils", "sweets", "stamps"];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const naira = (n) => `₦${n.toLocaleString("en-NG")}`;

/** Numbers in the size a level uses. */
const size = (r, t, lo = 1) => (t === "gentle" ? r.int(Math.max(lo, 8), 60) : t === "middle" ? r.int(Math.max(lo, 105), 640) : r.int(Math.max(lo, 1050), 6400));
/** The size of one unit, by level. */
const unitSize = (r, t) => (t === "gentle" ? r.int(2, 12) : t === "middle" ? r.int(6, 40) : r.int(25, 240));

/**
 * One row of equal units in groups: [{ n, tone, text, label }]. A group with
 * a label gets a brace over it; `whole` braces the whole row underneath.
 */
function grouped(groups, { name = null, whole = null, unitText = "" } = {}) {
  const parts = [];
  const above = [];
  groups.forEach((g) => {
    const from = parts.length;
    parts.push(...units(g.n, g.tone, g.text ?? unitText));
    if (g.label) above.push({ from, to: parts.length, text: g.label });
  });
  const row = { name, parts, above };
  if (whole != null) row.below = [{ from: 0, to: parts.length, text: whole }];
  return row;
}

export const MODEL_GROUPS = [
  { chapter: "Chapter 9 · Bar models and word problems", id: "model-pw", label: "Part and whole", blurb: "Two parts make a whole — find the whole, or the part that is missing." },
  { id: "model-cmp", label: "Comparison", blurb: "One has more than the other — the extra is a box of its own." },
  { id: "model-pp", label: "Ratio", blurb: "“3 times as many”, 2 : 3, 2 : 3 : 4 — equal units." },
  { id: "model-pwf", label: "Fractions", blurb: "A fraction of the whole, the whole from a part, and a fraction of what is left." },
  { id: "model-pct", label: "Percentages", blurb: "The whole as ten units of 10 % — or four of 25 %, five of 20 %." },
  { id: "model-deg", label: "Degrees", blurb: "360° and 180° as the whole: pie charts and angles." },
  { id: "model-word", label: "Word problems", blurb: "No picture — build the model, then answer." },
];

/* ═══ the kinds of problem — each makes { story, rows, …, labels, key, answer } ═══*/

function partWhole(r, o) {
  const t = tier(o);
  const [A] = two(r);
  const thing = r.pick(THINGS);
  const trio = t === "stretch" && r.chance(0.5);
  const parts = trio ? [size(r, t), size(r, t), size(r, t)] : [size(r, t), size(r, t)];
  const whole = parts.reduce((s, v) => s + v, 0);
  const tones = ["a", "c", "d"];
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

const RATIOS = [[1, 2], [2, 3], [1, 3], [3, 4], [2, 5], [3, 5], [1, 4], [4, 5], [3, 7], [5, 8]];

function ratio(r, o) {
  const t = tier(o);
  const [A, B] = two(r);
  const thing = r.pick(THINGS);
  const u = unitSize(r, t);
  const kinds = t === "gentle" ? ["times-total"] : t === "middle" ? ["times-total", "times-diff", "pq-total", "pq-diff"] : ["pq-total", "pq-diff", "pq-share", "three", "times-diff"];
  const kind = r.pick(kinds);

  if (kind === "times-total" || kind === "times-diff") {
    const k = t === "gentle" ? r.int(2, 3) : r.int(2, 5);
    const rows = [{ name: A, parts: units(k, "a") }, { name: B, parts: units(1, "a") }];
    if (kind === "times-diff") {
      const diff = (k - 1) * u;
      rows[0].above = [{ from: 1, to: k, text: `${diff} more` }];
      return {
        story: `${A} has ${k} times as many ${thing} as ${B}. ${A} has ${diff} more than ${B}. How many does each of them have?`,
        rows, cap: 20,
        labels: ["1 unit:", `${B}:`, `${A}:`], key: [u, u, k * u],
        answer: [`${k - 1} units = ${diff}, so 1 unit = ${u}`, `${B} ${u}, ${A} ${k * u}`],
      };
    }
    const total = (k + 1) * u;
    return {
      story: `${A} has ${k} times as many ${thing} as ${B}. Together they have ${total}. How many does each of them have?`,
      rows, total: String(total), cap: 20,
      labels: ["1 unit:", `${B}:`, `${A}:`], key: [u, u, k * u],
      answer: [`${k + 1} units = ${total}, so 1 unit = ${u}`, `${B} ${u}, ${A} ${k * u}`],
    };
  }

  if (kind === "three") {
    const [X, Y, Z] = three(r);
    const trios = [[1, 2, 3], [2, 3, 4], [1, 2, 4], [2, 3, 5], [3, 4, 5], [1, 3, 5]];
    const [p, q, s] = r.pick(trios);
    const total = (p + q + s) * u;
    const money = r.chance(0.5);
    return {
      story: money
        ? `${naira(total)} is shared among ${X}, ${Y} and ${Z} in the ratio ${p} : ${q} : ${s}. How much does each get?`
        : `${X}, ${Y} and ${Z} share ${total} ${thing} in the ratio ${p} : ${q} : ${s}. How many does each get?`,
      rows: [{ name: X, parts: units(p, "a") }, { name: Y, parts: units(q, "c") }, { name: Z, parts: units(s, "d") }],
      total: money ? naira(total) : String(total), cap: 16,
      labels: ["1 unit:", `${X}:`, `${Y}:`, `${Z}:`], key: [u, p * u, q * u, s * u],
      answer: [`${p} + ${q} + ${s} = ${p + q + s} units = ${total}, so 1 unit = ${u}`, `${X} ${p * u}, ${Y} ${q * u}, ${Z} ${s * u}`],
    };
  }

  const [p, q] = r.pick(RATIOS);
  const rows = [{ name: A, parts: units(p, "a") }, { name: B, parts: units(q, "c") }];
  if (kind === "pq-diff") {
    const diff = (q - p) * u;
    rows[1].above = [{ from: p, to: q, text: `${diff} more` }];
    return {
      story: `The ratio of ${A}'s ${thing} to ${B}'s is ${p} : ${q}. ${B} has ${diff} more than ${A}. How many does each have?`,
      rows, cap: 16,
      labels: ["1 unit:", `${A}:`, `${B}:`], key: [u, p * u, q * u],
      answer: [`${q} − ${p} = ${q - p} units = ${diff}, so 1 unit = ${u}`, `${A} ${p * u}, ${B} ${q * u}`],
    };
  }
  if (kind === "pq-share") {
    rows[0].below = [{ from: 0, to: p, text: String(p * u) }];
    return {
      story: `${A} and ${B} share some ${thing} in the ratio ${p} : ${q}. ${A} gets ${p * u}. How many does ${B} get, and how many were there altogether?`,
      rows, cap: 16,
      labels: ["1 unit:", `${B}:`, "altogether:"], key: [u, q * u, (p + q) * u],
      answer: [`${p} units = ${p * u}, so 1 unit = ${u}`, `${B} ${q * u}, altogether ${(p + q) * u}`],
    };
  }
  const total = (p + q) * u;
  return {
    story: `In a jar, for every ${p} red bead${p > 1 ? "s" : ""} there ${q > 1 ? "are" : "is"} ${q} blue bead${q > 1 ? "s" : ""}. There are ${total} beads in the jar. How many are red and how many are blue?`,
    rows: [{ name: "red", parts: units(p, "a") }, { name: "blue", parts: units(q, "c") }],
    total: String(total), cap: 16,
    labels: ["1 unit:", "red:", "blue:"], key: [u, p * u, q * u],
    answer: [`${p} + ${q} = ${p + q} units = ${total}, so 1 unit = ${u}`, `red ${p * u}, blue ${q * u}`],
  };
}

function fraction(r, o) {
  const t = tier(o);
  const kinds = t === "gentle" ? ["of"] : t === "middle" ? ["of", "whole", "left"] : ["whole", "left", "rest", "rest"];
  const kind = r.pick(kinds);
  const u = t === "gentle" ? r.int(2, 10) : t === "middle" ? r.int(4, 25) : r.int(8, 60);

  if (kind === "rest") {
    /* a fraction, and then a fraction of what is LEFT: the left-over units
       are exactly the second fraction's denominator, so each is one part */
    const plans = [[1, 3, 1], [1, 3, 1], [2, 5, 1], [2, 5, 2], [1, 4, 1], [1, 4, 2], [3, 7, 1], [3, 7, 3], [1, 5, 1], [1, 5, 3], [3, 8, 2], [2, 7, 4]];
    const [n1, d1, m] = r.pick(plans);
    const rest = d1 - n1;
    const total = d1 * u;
    const [A] = two(r);
    const left = (rest - m) * u;
    return {
      story: `${A} had ${naira(total)}. ${A} spent ${n1}/${d1} of it on books, then ${m}/${rest} of what was left on food. How much did ${A} spend on food, and how much was left?`,
      rows: [grouped([{ n: n1, tone: "b", label: "books" }, { n: m, tone: "c", label: "food" }, { n: rest - m, tone: "a", label: "left" }], { whole: naira(total) })],
      cap: 18,
      labels: ["1 unit (₦):", "food (₦):", "left (₦):"], key: [u, m * u, left],
      answer: [`${d1} units = ${total}, so 1 unit = ${u}`, `what was left is ${rest} units, ${m}/${rest} of it is ${m} unit${m > 1 ? "s" : ""} = ${m * u}`, `left: ${rest - m} units = ${left}`],
    };
  }

  const dens = t === "gentle" ? [2, 3, 4, 5] : t === "middle" ? [3, 4, 5, 6, 8] : [4, 5, 6, 7, 8, 9, 10];
  const d = r.pick(dens);
  let n = r.int(1, d - 1);
  while (gcd(n, d) !== 1) n = r.int(1, d - 1);
  const total = d * u;

  if (kind === "left") {
    /* the part LEFT is told — the whole is found from it */
    const [A] = two(r);
    return {
      story: `${A} spent ${n}/${d} of some money and had ${naira((d - n) * u)} left. How much did ${A} have at first?`,
      rows: [grouped([{ n, tone: "b", label: "spent" }, { n: d - n, tone: "a", label: naira((d - n) * u) }], { whole: "?" })],
      cap: 18,
      labels: ["1 unit (₦):", "at first (₦):"], key: [u, total],
      answer: [`${d - n} units = ${(d - n) * u}, so 1 unit = ${u}`, `at first: ${d} units = ${total}`],
    };
  }
  if (kind === "whole") {
    return {
      story: `${n}/${d} of the pupils in a school hall are girls. There are ${n * u} girls. How many pupils are in the hall? How many are boys?`,
      rows: [grouped([{ n, tone: "b", label: `${n * u} girls` }, { n: d - n, tone: "a", label: "boys" }], { whole: "?" })],
      cap: 18,
      labels: ["1 unit:", "pupils:", "boys:"], key: [u, total, total - n * u],
      answer: [`${n} units = ${n * u}, so 1 unit = ${u}`, `pupils ${total}, boys ${total - n * u}`],
    };
  }
  return {
    story: `There are ${total} pupils in a school hall. ${n}/${d} of them are girls. How many are girls, and how many are boys?`,
    rows: [grouped([{ n, tone: "b", label: "girls" }, { n: d - n, tone: "a", label: "boys" }], { whole: String(total) })],
    cap: 18,
    labels: ["1 unit:", "girls:", "boys:"], key: [u, n * u, total - n * u],
    answer: [`${d} units = ${total}, so 1 unit = ${u}`, `girls ${n * u}, boys ${total - n * u}`],
  };
}

/* a percentage as units: ten of 10 %, five of 20 % or four of 25 % */
const PCT_SPLITS = [{ k: 10, each: 10 }, { k: 5, each: 20 }, { k: 4, each: 25 }];

function percent(r, o) {
  const t = tier(o);
  const kinds = t === "gentle" ? ["of"] : t === "middle" ? ["of", "whole", "change"] : ["whole", "change", "change", "of"];
  const kind = r.pick(kinds);
  const split = t === "gentle" ? r.pick(PCT_SPLITS.slice(1)) : r.pick(PCT_SPLITS);
  const { k, each } = split;
  const n = r.int(1, k - 1);
  const pct = n * each;
  const u = t === "gentle" ? r.int(2, 12) : t === "middle" ? r.int(3, 30) : r.int(12, 150);
  const total = k * u;
  const unitText = `${each}%`;

  if (kind === "change") {
    const up = r.chance(0.5);
    const price = total * 10;
    const step = u * 10;
    if (up) {
      return {
        story: `A bag cost ${naira(price)}. Its price went up by ${pct}%. What is the new price?`,
        rows: [
          { name: "before", parts: units(k, "a", unitText), below: [{ from: 0, to: k, text: naira(price) }] },
          { name: "after", parts: [...units(k, "a", unitText), ...units(n, "c", unitText)], above: [{ from: k, to: k + n, text: `+${pct}%` }], below: [{ from: 0, to: k + n, text: "?" }] },
        ], cap: 12,
        labels: [`${each}% (₦):`, "new price (₦):"], key: [step, price + n * step],
        answer: [`100% = ${k} units = ${price}, so 1 unit (${each}%) = ${step}`, `new price: ${k + n} units = ${price + n * step}`],
      };
    }
    return {
      story: `A bag cost ${naira(price)}. In a sale its price came down by ${pct}%. What is the sale price?`,
      rows: [
        { name: "before", parts: units(k, "a", unitText), below: [{ from: 0, to: k, text: naira(price) }] },
        { name: "sale", parts: [...units(k - n, "a", unitText), ...units(n, "q", unitText)], above: [{ from: k - n, to: k, text: `−${pct}%` }], below: [{ from: 0, to: k - n, text: "?" }] },
      ], cap: 12,
      labels: [`${each}% (₦):`, "sale price (₦):"], key: [step, price - n * step],
      answer: [`100% = ${k} units = ${price}, so 1 unit (${each}%) = ${step}`, `sale price: ${k - n} units = ${price - n * step}`],
    };
  }
  if (kind === "whole") {
    return {
      story: `${pct}% of the pupils in a school are in the football club. There are ${n * u} pupils in the club. How many pupils are in the school?`,
      rows: [grouped([{ n, tone: "c", label: `${n * u} pupils` }, { n: k - n, tone: "a" }], { whole: "100% = ?", unitText })],
      cap: 13,
      labels: [`${each}%:`, "pupils:"], key: [u, total],
      answer: [`${pct}% is ${n} unit${n > 1 ? "s" : ""} = ${n * u}, so 1 unit (${each}%) = ${u}`, `100% = ${k} units = ${total}`],
    };
  }
  return {
    story: `There are ${total} pupils in a school. ${pct}% of them walk to school. How many pupils walk to school?`,
    rows: [grouped([{ n, tone: "c", label: `${pct}% = ?` }, { n: k - n, tone: "a" }], { whole: `100% = ${total}`, unitText })],
    cap: 13,
    labels: [`${each}%:`, "walk:"], key: [u, n * u],
    answer: [`100% = ${k} units = ${total}, so 1 unit (${each}%) = ${u}`, `${pct}% = ${n} units = ${n * u}`],
  };
}

function degrees(r, o) {
  const t = tier(o);
  const kinds = t === "gentle" ? ["pie"] : t === "middle" ? ["pie", "line", "point"] : ["triangle", "point", "diff", "pie"];
  const kind = r.pick(kinds);

  if (kind === "pie") {
    const d = r.pick(t === "gentle" ? [3, 4, 6] : [4, 5, 6, 8, 9, 10, 12]);
    let n = r.int(1, d - 1);
    while (gcd(n, d) !== 1) n = r.int(1, d - 1);
    const u = t === "gentle" ? r.int(2, 8) : r.int(3, 20);
    const total = d * u;
    const fruit = r.pick(["mango", "orange", "pawpaw", "banana", "guava"]);
    const per = 360 / d;
    return {
      story: `${total} pupils were asked their favourite fruit, and ${n * u} chose ${fruit}. On a pie chart of all ${total}, what angle is the ${fruit} sector?`,
      rows: [grouped([{ n, tone: "b", label: `${fruit}: ${n * u}` }, { n: d - n, tone: "a" }], { whole: `${total} pupils = 360°` })],
      cap: 14,
      labels: ["1 unit (°):", `${fruit} (°):`], key: [per, n * per],
      answer: [`${total} pupils = ${d} units of ${u} = 360°, so 1 unit = 360 ÷ ${d} = ${per}°`, `${fruit}: ${n} unit${n > 1 ? "s" : ""} = ${n * per}°`],
    };
  }
  if (kind === "diff") {
    /* two angles on a straight line, one a given amount bigger */
    const small = r.int(20, 75);
    const diff = 180 - 2 * small;
    const big = small + diff;
    return {
      story: `Two angles sit together on a straight line. One is ${diff}° bigger than the other. How big is each angle?`,
      rows: [
        { name: "small", parts: [{ text: "?", value: small, tone: "a" }] },
        { name: "big", parts: [{ text: "?", value: small, tone: "a" }, { text: `${diff}°`, value: diff, tone: "c" }] },
      ], total: "180°",
      labels: ["small (°):", "big (°):"], key: [small, big],
      answer: [`take the ${diff}° off: 180 − ${diff} = ${180 - diff}, two equal angles, so small = ${small}°`, `big = ${small} + ${diff} = ${big}°`],
    };
  }
  const whole = kind === "point" ? 360 : 180;
  const sets = kind === "triangle"
    ? [[1, 2, 3], [2, 3, 4], [1, 1, 2], [2, 3, 5], [1, 3, 5], [4, 5, 6], [1, 2, 6], [2, 2, 5]]
    : kind === "line" ? [[1, 2], [1, 3], [2, 3], [1, 5], [4, 5], [2, 7], [1, 8], [5, 7]]
      : [[1, 2, 3], [2, 3, 4], [1, 3, 5], [3, 4, 5], [1, 2, 5], [2, 3, 7], [1, 4, 7]];
  /* every set's units divide its whole (180 or 360) */
  const parts = r.pick(sets);
  const s2 = parts.reduce((s, v) => s + v, 0);
  const per = whole / s2;
  const names = ["a", "b", "c"].slice(0, parts.length);
  const place = kind === "triangle" ? "the angles of a triangle" : kind === "line" ? "two angles on a straight line" : "three angles round a point";
  const tones = ["a", "c", "d"];
  return {
    story: `${place[0].toUpperCase()}${place.slice(1)}, ${names.join(", ").replace(/, (?=[^,]*$)/, " and ")}, are in the ratio ${parts.join(" : ")}. How big is each angle?`,
    rows: [grouped(parts.map((n, i) => ({ n, tone: tones[i], label: names[i] })), { whole: `${whole}°` })],
    cap: 16,
    labels: ["1 unit (°):", ...names.map((x) => `${x} (°):`)], key: [per, ...parts.map((n) => n * per)],
    answer: [`${parts.join(" + ")} = ${s2} units = ${whole}°, so 1 unit = ${per}°`, names.map((x, i) => `${x} = ${parts[i] * per}°`).join(", ")],
  };
}

export const MODEL_KINDS = { partWhole, comparison, ratio, fraction, percent, degrees };
const KINDS = [partWhole, comparison, ratio, fraction, percent, degrees];
const draw = (p) => art(modelSvg(p.rows, { total: p.total ?? null, over: p.over ?? null, cap: p.cap ?? 7 }));
/* a question's picture, with a board under it on screen to rebuild it on */
const drawWithBoard = (p) => art(modelSvg(p.rows, { total: p.total ?? null, over: p.over ?? null, cap: p.cap ?? 7 }) +
  boardUnder(p.rows, { over: p.over ?? null, cap: p.cap ?? 7 }));

/** One exercise per kind: the story, its model drawn, the answers. */
function section(id, group, maker, { label, blurb, heading, instruction, example, exampleSay }) {
  return {
    id, group, label, blurb, heading,
    instruction: () => instruction,
    cols: 1,
    defaultCount: 3,
    make: (r, o) => maker(r, o),
    render: (p) => story(p.story) + drawWithBoard(p) + answers(...p.labels),
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
  example: { story: "Musa has 48 stamps. Bola has 15 more than Musa. How many stamps does Bola have?", rows: [{ name: "Musa", parts: [{ text: "48", value: 48 }] }, { name: "Bola", parts: [{ text: "48", value: 48 }, { text: "15", value: 15, tone: "c" }], says: "?" }] },
  exampleSay: "Bola's bar is Musa's 48 and an extra 15. So Bola has 48 + 15 = 63.",
});

const pp = section("mod-pp", "model-pp", ratio, {
  label: "Ratio",
  blurb: "Times as many, p : q, three-way shares.",
  heading: "Ratio: equal units",
  instruction: "A ratio is a count of equal boxes: 2 : 3 is two boxes against three. Find what the story tells you a number of boxes is — the total, the difference, or one person's share — and divide to find ONE unit. Then multiply up for each.",
  example: { story: "Ada and Tunde share 45 stickers in the ratio 2 : 3. How many does each get?", rows: [{ name: "Ada", parts: units(2, "a") }, { name: "Tunde", parts: units(3, "c") }], total: "45", cap: 16 },
  exampleSay: "5 units make 45, so 1 unit is 45 ÷ 5 = 9. Ada has 2 units, 18; Tunde has 3 units, 27.",
});

const pwf = section("mod-pwf", "model-pwf", fraction, {
  label: "Fractions",
  blurb: "Of the whole, the whole from a part, of what is left.",
  heading: "Fractions of a whole",
  instruction: "A fraction cuts the whole into equal units — fifths into 5. Whatever number you are told, share it between ITS units to find one unit. “Of what was left” cuts only the left-over units, so draw the second fraction on those.",
  example: { story: "Ada had ₦600. She spent 1/3 of it on books, then 1/2 of what was left on food. How much was left?", rows: [grouped([{ n: 1, tone: "b", label: "books" }, { n: 1, tone: "c", label: "food" }, { n: 1, tone: "a", label: "left" }], { whole: "₦600" })], cap: 18 },
  exampleSay: "3 units make ₦600, so 1 unit is ₦200. Books take 1 unit; half of the 2 left-over units is 1 unit for food; 1 unit, ₦200, is left.",
});

const pct = section("mod-pct", "model-pct", percent, {
  label: "Percentages",
  blurb: "Percentage of, the whole from it, up and down by it.",
  heading: "Percentages as units",
  instruction: "100% is the whole bar. Cut it into ten units of 10% (or five of 20%, four of 25%), so a percentage is a count of units. Find ONE unit from the number you are told, then count units for the answer. A rise ADDS units to the bar; a fall takes them off.",
  example: { story: "There are 80 pupils in a class. 30% of them walk to school. How many walk?", rows: [grouped([{ n: 3, tone: "c", label: "30% = ?" }, { n: 7, tone: "a" }], { whole: "100% = 80", unitText: "10%" })], cap: 13 },
  exampleSay: "100% is 10 units = 80, so 1 unit (10%) is 8. 30% is 3 units: 24 pupils.",
});

const deg = section("mod-deg", "model-deg", degrees, {
  label: "Degrees",
  blurb: "Pie chart angles, angles in a ratio.",
  heading: "Degrees: 360° and 180° as the whole",
  instruction: "A whole turn is 360°, a straight line and a triangle's three angles 180°. Make the bar that whole, cut it into the units the story gives, and find ONE unit in degrees. A pie chart's whole is everybody asked, so the same bar is people AND degrees.",
  example: { story: "The angles of a triangle, a, b and c, are in the ratio 1 : 2 : 3. How big is each?", rows: [grouped([{ n: 1, tone: "a", label: "a" }, { n: 2, tone: "c", label: "b" }, { n: 3, tone: "d", label: "c" }], { whole: "180°" })], cap: 16 },
  exampleSay: "6 units make 180°, so 1 unit is 30°. a = 30°, b = 60°, c = 90°.",
});

/* ═══ word problems: every kind mixed, and the child builds the model ═══*/

const word = {
  id: "mod-word",
  group: "model-word",
  label: "Word problems",
  blurb: "Every kind mixed, no picture — build the model first.",
  heading: "Word problems — build the model, then answer",
  instruction: () =>
    "Each problem is one of the kinds in this chapter: part and whole, comparison, ratio, fractions, percentages or degrees. Decide which, DRAW its bar model in the space, then answer. On screen, build it from bars: drag them, stretch them, cut them into units, and label them over, in and under.",
  cols: 1,
  defaultCount: 4,
  make: (r, o, k, i) => KINDS[(i + r.int(0, KINDS.length - 1)) % KINDS.length](r, o),
  render: (p) => story(p.story) + art(blankModelSvg({ h: 44 })) + answers(...p.labels),
  key: (p) => p.key.map((v) => want.num(v)),
  answer: (p) => p.answer,
};

export const MODEL_EXERCISES = [pw, cmp, pp, pwf, pct, deg, word];
