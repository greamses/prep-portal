/* ============================================================================
   Place Value Workbook — the exercises, as one registry
   ----------------------------------------------------------------------------
   ONE list, read by the builder (which offers them), the workbook (which prints
   them) and the answer key (which marks them), so a new exercise is an entry
   here and nothing else. Same shape as tools.js and sheets.js on the
   manipulatives canvas.

   Every entry answers the same four questions:

     make(r, o, k)  — draw k questions off the seeded stream r under options o.
     render(item,o) — the question as it appears on the paper, with the writing
                      left blank. Never returns the answer, not even hidden in
                      an attribute: the sheet gets printed.
     answer(item,o) — one short string per question, for the key.
     cols / group   — how it sits on the page, and which section it belongs to.

   `group` of `k` questions per printed item is the only fiddly bit, and it
   exists for one reason: a place-value chart with a single number in it wastes
   most of a chart. So a chart exercise says `groupSize: 5` and gets one chart
   holding five numbers, while everything else takes the default of one.

   The exercises run from the concrete to the abstract on purpose — blocks you
   count, blocks you put in a chart, a chart with the blocks taken away, then
   the number on its own — and the builder lists them in that order, because
   that order IS the teaching sequence.
   ========================================================================== */

import { blocksSvg, drawingBox } from "./blocks.js";
import { chartHtml, powersFor } from "./chart.js";
import {
  drawNumber, digitsOf, figures, inWords, placeName, placeNameLower,
  placeNameFor, digitChar, digitChars,
} from "./numbers.js";
import { toBase } from "../../base-blocks/js/config.js";

/* ── the marks a child writes in ───────────────────────────────────────────
   A ruled line, a box for one character, and a box for one word. Three sizes
   of line and nothing else: the length of the line is a hint about the length
   of the answer, so it is chosen and not left to the browser. */

/* How many block-cells fit across a full-width question: the printable width
   of the page, less the margins and the number in the left column, divided by
   CELL_MM. Beyond this a pile wraps onto a second row rather than running off
   the paper. */
const WIDE = 64;

/* …and how many fit across ONE HALF of a question, for the two piles that get
   set side by side to be compared. Half the width, less the gap between them. */
const PAIR = 42;

const line = (size = "md") => `<span class="pv-line pv-line--${size}"></span>`;
const box = () => `<span class="pv-box"></span>`;
const num = (n, base) => `<span class="pv-num">${figures(n, base)}</span>`;

/* ── how big a number an exercise may use ──────────────────────────────────*/

/**
 * Blocks are a picture, and a picture of nine hundred-flats is a page of its
 * own. So the blocks exercises cap the TOP place — the rest of the places run
 * their full range, and the abstract exercises further down carry the big
 * leading digits.
 */
function blocksNumber(r, o, { places }) {
  const p = Math.min(places, 4);
  const capTop = p >= 4 ? 2 : p === 3 ? 3 : o.base - 1;
  const d = [];
  for (let i = 0; i < p; i++) {
    if (i === p - 1) d.push(r.int(1, Math.min(capTop, o.base - 1)));
    else if (r.chance(o.zeros)) d.push(0);
    else d.push(r.int(1, o.base - 1));
  }
  /* Not every place below the top may be empty. Three flats and nothing else
     is a real number, but it is not a COUNTING question — there is only one
     kind of piece in the picture — and a page with two of them on it looks
     like the generator gave up. A chart or an expanded form can have 300; a
     pile may not. */
  if (p > 1 && d.slice(0, p - 1).every((x) => x === 0)) d[r.int(0, p - 2)] = r.int(1, o.base - 1);
  let n = 0;
  for (let i = p - 1; i >= 0; i--) n = n * o.base + d[i];
  return { n, places: p };
}

/** The place names of a blocks pile, lowest first — for the key and the answers. */
function blockNames(o, places) {
  return Array.from({ length: places }, (_, p) => placeName(p, o.base));
}

/** "3 hundreds, 8 tens and 6 ones" — how an answer about blocks is said. */
function saidCounts(counts, o) {
  const parts = [];
  for (let p = counts.length - 1; p >= 0; p--) {
    if (!counts[p]) continue;
    parts.push(`${counts[p]} ${placeNameFor(counts[p], p, o.base)}`);
  }
  if (!parts.length) return "nothing";
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

/* ── the registry ──────────────────────────────────────────────────────────*/

export const GROUPS = [
  { id: "blocks", label: "Number blocks", blurb: "The concrete stage: pieces you can count, trade and draw." },
  { id: "charts", label: "Place value charts", blurb: "The bridge: a column for each place, to write into and read off." },
  { id: "numbers", label: "The number on its own", blurb: "The abstract stage: expanded form, words, stepping, rounding, comparing and ordering." },
];

export const EXERCISES = [
  /* ───────────────────────────── blocks ─────────────────────────────────── */
  {
    id: "blocks-count",
    group: "blocks",
    label: "Count the blocks",
    blurb: "A pile of blocks; write what it comes to.",
    heading: "Count the blocks",
    instruction: () => "Count the blocks in each pile and write the number.",
    cols: 1,
    defaultCount: 4,
    maxPlaces: 4,
    make(r, o) {
      const { n, places } = blocksNumber(r, o, { places: o.places });
      return { n, places, counts: digitsOf(n, o.base, places) };
    },
    render(item, o) {
      return (
        `<div class="pv-art">${blocksSvg(item.counts, o.base, { maxCells: WIDE, label: "A pile of base blocks" })}</div>` +
        `<p class="pv-ask">The number is ${line("md")}</p>`
      );
    },
    answer(item, o) {
      return [`${figures(item.n, o.base)} &nbsp;(${saidCounts(item.counts, o)})`];
    },
  },

  {
    id: "blocks-chart",
    group: "blocks",
    label: "Blocks into the chart",
    blurb: "Blocks on the left, an empty chart underneath — the bridge between the two.",
    heading: "Put the blocks in the chart",
    instruction: () =>
      "Write how many of each piece there are in the chart, then write the number.",
    cols: 1,
    defaultCount: 3,
    maxPlaces: 4,
    make(r, o) {
      const { n, places } = blocksNumber(r, o, { places: o.places });
      return { n, places, counts: digitsOf(n, o.base, places) };
    },
    render(item, o) {
      return (
        /* Smaller here than in section A: the pile and the chart are one
           question, and the chart under it is the half that gets written in. */
        `<div class="pv-art">${blocksSvg(item.counts, o.base, { maxCells: WIDE, cellMm: 1.9, label: "A pile of base blocks" })}</div>` +
        chartHtml({
          powers: powersFor(item.places),
          base: o.base,
          rows: [{ digits: null, tail: "" }],
          tail: "The number",
        })
      );
    },
    answer(item, o) {
      const d = digitsOf(item.n, o.base, item.places);
      return [d.slice().reverse().map(digitChar).join(" | ") + " &nbsp;→&nbsp; " + figures(item.n, o.base)];
    },
  },

  {
    id: "blocks-draw",
    group: "blocks",
    label: "Draw the blocks",
    blurb: "A number and a sheet of squared paper; draw the pile that shows it.",
    heading: "Draw the blocks",
    instruction: (o) =>
      `Draw the blocks that show each number. Every square on the paper is a unit block, ` +
      `and every ${o.base}th line is heavier, so you can count a ` +
      `${placeNameLower(1, o.base).replace(/s$/, "")} out without measuring it.`,
    cols: 1,
    defaultCount: 2,
    maxPlaces: 3,
    make(r, o) {
      const { n, places } = blocksNumber(r, o, { places: Math.min(o.places, 3) });
      return { n, places, counts: digitsOf(n, o.base, places) };
    },
    render(item, o) {
      return (
        `<p class="pv-ask pv-ask--lead">Draw ${num(item.n, o.base)}.</p>` +
        `<div class="pv-art pv-art--box">${drawingBox(o.base, { rows: 14, cols: WIDE })}</div>`
      );
    },
    answer(item, o) {
      return [saidCounts(item.counts, o)];
    },
  },

  {
    id: "blocks-trade",
    group: "blocks",
    label: "Trade the blocks",
    blurb: "A pile with too many of one piece; trade up and write it the tidy way.",
    heading: "Trade the blocks",
    instruction: (o) =>
      `Somebody has left too many of one piece in each pile. Trade ${o.base} of a ` +
      `smaller piece for one of the next piece up, until no place has ${o.base} or ` +
      `more, then write the number.`,
    cols: 1,
    defaultCount: 3,
    maxPlaces: 4,
    make(r, o) {
      const { n, places } = blocksNumber(r, o, { places: Math.max(2, Math.min(o.places, 3)) });
      const tidy = digitsOf(n, o.base, places);
      /* Untidy it: take one from a place that has something in it and pay it
         back as `base` of the place below. The pile is worth the same number —
         that is the whole idea — it is just written in a way nobody would
         choose, and the child's job is to choose again. */
      const canGive = [];
      for (let p = 1; p < places; p++) if (tidy[p] > 0) canGive.push(p);
      const from = canGive.length ? r.pick(canGive) : places - 1;
      const messy = tidy.slice();
      messy[from] -= 1;
      messy[from - 1] += o.base;
      return { n, places, tidy, messy };
    },
    render(item, o) {
      const names = blockNames(o, item.places);
      const blanks = names
        .slice()
        .reverse()
        .map((nm) => `${line("xs")} <em>${nm.toLowerCase()}</em>`)
        .join("&nbsp;&nbsp;");
      return (
        `<div class="pv-art">${blocksSvg(item.messy, o.base, { maxCells: WIDE, label: "A pile of base blocks with too many of one piece" })}</div>` +
        `<p class="pv-ask">Tidied up: ${blanks}</p>` +
        `<p class="pv-ask">The number is ${line("md")}</p>`
      );
    },
    answer(item, o) {
      return [`${saidCounts(item.tidy, o)} = ${figures(item.n, o.base)}`];
    },
  },

  {
    id: "blocks-compare",
    group: "blocks",
    label: "Which pile is worth more?",
    blurb: "Two piles side by side. The heap that covers more paper is not always the bigger number.",
    heading: "Which pile is worth more?",
    instruction: () =>
      "Write what each pile comes to, then put &lt; or &gt; in the box. Read the " +
      "biggest piece first — a scatter of loose units takes up room and is worth " +
      "the least of anything on the page.",
    cols: 1,
    defaultCount: 3,
    maxPlaces: 3,
    make(r, o) {
      const places = Math.min(o.places, 3);
      const a = blocksNumber(r, o, { places });
      /* The second pile is grown from the first, sharing its top place more
         often than not, so the two cannot be told apart on the biggest piece
         alone and have to be read down to the place where they differ.
         They are never equal, unlike the abstract compare further down: two
         identical pictures read as a printing mistake, not as a question. */
      const da = digitsOf(a.n, o.base, places);
      let nb = a.n;
      let guard = 0;
      while (nb === a.n && guard++ < 40) {
        const db = da.slice();
        const p = r.int(0, places - (r.chance(0.6) ? 2 : 1));
        db[p] = r.int(p === places - 1 ? 1 : 0, o.base - 1);
        if (r.chance(0.4)) {
          const q = r.int(0, Math.max(0, places - 2));
          db[q] = r.int(0, o.base - 1);
        }
        nb = 0;
        for (let i = places - 1; i >= 0; i--) nb = nb * o.base + db[i];
      }
      if (nb === a.n) nb = a.n + 1;
      return { places, a: a.n, b: nb };
    },
    render(item, o) {
      const pile = (tag, n) =>
        `<div class="pv-pair__side">` +
        `<span class="pv-pair__tag">${tag}</span>` +
        `<div class="pv-art">${blocksSvg(digitsOf(n, o.base, item.places), o.base, {
          maxCells: PAIR, cellMm: 1.7, label: "A pile of base blocks",
        })}</div>` +
        `</div>`;
      return (
        `<div class="pv-pair">${pile("a", item.a)}${pile("b", item.b)}</div>` +
        `<p class="pv-ask">a is ${line("sm")} &nbsp; b is ${line("sm")}</p>` +
        `<p class="pv-ask">a ${box()} b</p>`
      );
    },
    answer(item, o) {
      const sign = item.a > item.b ? "&gt;" : "&lt;";
      return [`${figures(item.a, o.base)} ${sign} ${figures(item.b, o.base)}`];
    },
  },

  /* ───────────────────────────── charts ─────────────────────────────────── */
  {
    id: "chart-write",
    group: "charts",
    label: "Write it into the chart",
    blurb: "Numbers down the side, one digit to a column.",
    heading: "Write each number into the chart",
    instruction: () => "Put one digit in each column. Leave a place empty only if it has a zero — and then write the zero.",
    cols: 1,
    groupSize: 5,
    defaultCount: 5,
    make(r, o, k) {
      const ns = [];
      for (let i = 0; i < k; i++) ns.push(drawNumber(r, o));
      return { ns };
    },
    render(item, o) {
      return chartHtml({
        powers: powersFor(o.places),
        base: o.base,
        side: "Number",
        rows: item.ns.map((n) => ({ side: figures(n, o.base), digits: null })),
      });
    },
    answer(item, o) {
      return item.ns.map(
        (n) => `${figures(n, o.base)} → ${toBase(n, o.base).split("").join(" | ")}`
      );
    },
  },

  {
    id: "chart-read",
    group: "charts",
    label: "Read it off the chart",
    blurb: "The chart is filled in; write the number it says.",
    heading: "Read the number off the chart",
    instruction: () => "Each row of the chart is one number. Write it in figures.",
    cols: 1,
    groupSize: 5,
    defaultCount: 5,
    make(r, o, k) {
      const ns = [];
      for (let i = 0; i < k; i++) ns.push(drawNumber(r, o, { zeros: Math.max(o.zeros, 0.3) }));
      return { ns };
    },
    render(item, o) {
      return chartHtml({
        powers: powersFor(o.places),
        base: o.base,
        tail: "The number",
        rows: item.ns.map((n) => ({ digits: digitsOf(n, o.base, o.places), tail: "" })),
      });
    },
    answer(item, o) {
      return item.ns.map((n) => figures(n, o.base));
    },
  },

  {
    id: "chart-mixed",
    group: "charts",
    label: "Fill in the gaps",
    blurb: "Some rows give the number, some give the columns. Fill in whichever half is missing.",
    heading: "Fill in the missing half",
    instruction: () =>
      "Every row of this chart is one number with half of it left out. Where the " +
      "number is given, write it into the columns; where the columns are given, " +
      "write the number.",
    cols: 1,
    groupSize: 6,
    defaultCount: 6,
    make(r, o, k) {
      /* Strict alternation off one coin, rather than a coin per row: left to
         chance a chart can come out with five rows running the same way, and a
         chart that only ever goes one way is two exercises pretending to be
         one. The coin decides which way the top row goes. */
      const flip = r.chance(0.5) ? 1 : 0;
      const rows = [];
      for (let i = 0; i < k; i++) {
        rows.push({
          n: drawNumber(r, o, { zeros: Math.max(o.zeros, 0.3) }),
          toChart: (i + flip) % 2 === 0,
        });
      }
      return { rows };
    },
    render(item, o) {
      return chartHtml({
        powers: powersFor(o.places),
        base: o.base,
        side: "Number",
        rows: item.rows.map((row) => ({
          side: row.toChart ? figures(row.n, o.base) : "",
          digits: row.toChart ? null : digitsOf(row.n, o.base, o.places),
        })),
      });
    },
    answer(item, o) {
      return item.rows.map((row) =>
        row.toChart
          ? `${figures(row.n, o.base)} → ${toBase(row.n, o.base).split("").join(" | ")}`
          : figures(row.n, o.base)
      );
    },
  },

  {
    id: "chart-value",
    group: "charts",
    label: "What is that digit worth?",
    blurb: "One digit is ringed; say the place it is in and what it stands for.",
    heading: "What is the ringed digit worth?",
    instruction: () =>
      "One digit in each number is ringed. Write which place it is in, and what it is worth.",
    cols: 2,
    defaultCount: 6,
    make(r, o) {
      const n = drawNumber(r, o, { zeros: 0 });
      const p = r.int(0, o.places - 1);
      const d = digitsOf(n, o.base, o.places)[p];
      return { n, p, d };
    },
    render(item, o) {
      const digits = digitsOf(item.n, o.base, o.places);
      /* The number written out with the chosen digit ringed. Written here
         digit by digit rather than as a string, because the ring has to land on
         a PLACE and not on the n-th character of a grouped string. */
      let out = "";
      for (let p = o.places - 1; p >= 0; p--) {
        if (p < o.places - 1 && (p + 1) % 3 === 0) out += `<span class="pv-gap"></span>`;
        const ch = digitChar(digits[p]);
        out += p === item.p ? `<span class="pv-ring">${ch}</span>` : `<span>${ch}</span>`;
      }
      return (
        `<p class="pv-ask pv-ask--lead"><span class="pv-num pv-num--spread">${out}</span></p>` +
        `<p class="pv-ask">Place: ${line("sm")}</p>` +
        `<p class="pv-ask">Worth: ${line("sm")}</p>`
      );
    },
    answer(item, o) {
      const worth = item.d * Math.pow(o.base, item.p);
      return [`${placeNameLower(item.p, o.base)} · ${figures(worth, o.base)}`];
    },
  },

  /* ──────────────────────────── the number ──────────────────────────────── */
  {
    id: "expanded",
    group: "numbers",
    label: "Break it apart",
    blurb: "472 = 400 + 70 + 2.",
    heading: "Break each number apart",
    instruction: () => "Write each number as its places added together. Leave out any place that is zero.",
    cols: 2,
    defaultCount: 6,
    make(r, o) {
      return { n: drawNumber(r, o, { zeros: Math.min(o.zeros, 0.2) }) };
    },
    render(item, o) {
      const digits = digitsOf(item.n, o.base, o.places);
      const parts = digits.filter((d) => d > 0).length;
      /* One short blank per place that is actually there. Short, because three
         full-length lines and two plus signs do not fit across half a page —
         and a blank longer than its answer is a hint that there is more to
         write. */
      const blanks = Array.from({ length: Math.max(2, parts) }, () => line("eq")).join(" + ");
      return `<p class="pv-ask pv-ask--lead">${num(item.n, o.base)} = ${blanks}</p>`;
    },
    answer(item, o) {
      const digits = digitsOf(item.n, o.base, o.places);
      const parts = [];
      for (let p = o.places - 1; p >= 0; p--) {
        if (digits[p]) parts.push(figures(digits[p] * Math.pow(o.base, p), o.base));
      }
      return [parts.join(" + ")];
    },
  },

  {
    id: "expanded-back",
    group: "numbers",
    label: "Put it back together",
    blurb: "400 + 70 + 2 = 472 — the same fact read the other way.",
    heading: "Put each number back together",
    instruction: () => "Add the places up and write the number.",
    cols: 2,
    defaultCount: 6,
    make(r, o) {
      const n = drawNumber(r, o, { zeros: Math.min(o.zeros, 0.2) });
      return { n };
    },
    render(item, o) {
      const digits = digitsOf(item.n, o.base, o.places);
      const parts = [];
      for (let p = o.places - 1; p >= 0; p--) {
        if (digits[p]) parts.push(figures(digits[p] * Math.pow(o.base, p), o.base));
      }
      return `<p class="pv-ask pv-ask--lead">${parts.join(" + ")} = ${line("sm")}</p>`;
    },
    answer(item, o) {
      return [figures(item.n, o.base)];
    },
  },

  {
    id: "words",
    group: "numbers",
    label: "Figures and words",
    blurb: "Both directions, mixed. Base ten only — English has no word for a base-five number.",
    heading: "Figures and words",
    instruction: () => "Where you are given figures, write the words. Where you are given words, write the figures.",
    cols: 1,
    defaultCount: 5,
    tenOnly: true,
    make(r, o) {
      const n = drawNumber(r, o, { zeros: Math.max(o.zeros, 0.3) });
      return { n, toWords: r.chance(0.5) };
    },
    render(item, o) {
      if (item.toWords) {
        return `<p class="pv-ask pv-ask--lead">${num(item.n, o.base)} &nbsp;=&nbsp; ${line("lg")}</p>`;
      }
      return `<p class="pv-ask pv-ask--lead"><em class="pv-words">${inWords(item.n)}</em> &nbsp;=&nbsp; ${line("sm")}</p>`;
    },
    answer(item, o) {
      return [item.toWords ? inWords(item.n) : figures(item.n, o.base)];
    },
  },

  {
    id: "neighbours",
    group: "numbers",
    label: "One more, one less",
    blurb: "Step up and down by a whole place — over the boundary as often as not.",
    heading: "One more, one less",
    instruction: () =>
      "Each number comes with a step. Write the number that much more, and the " +
      "number that much less. Watch a place that is already full: stepping past " +
      "it empties it and carries into the next place along.",
    cols: 2,
    defaultCount: 6,
    make(r, o) {
      /* The step is always ONE of a place a child can name — one unit, one ten,
         one hundred — because what is being asked is which place changes, not
         how to add an awkward number. */
      const p = r.int(0, Math.min(o.places - 1, 2));
      const step = Math.pow(o.base, p);
      const d = digitsOf(drawNumber(r, o, { zeros: Math.min(o.zeros, 0.2) }), o.base, o.places);
      /* Three questions in five are BUILT to cross a boundary: a full place to
         carry out of, or an empty one to borrow into. Left to chance most
         numbers step without either, and then the exercise teaches nothing but
         copying a digit out. */
      const roll = r.raw();
      if (roll < 0.35) d[p] = o.base - 1;
      else if (roll < 0.6 && p < o.places - 1) d[p] = 0;
      let n = 0;
      for (let i = o.places - 1; i >= 0; i--) n = n * o.base + d[i];
      /* …but never "take the whole number away": 100 less than 100 is a fine
         sum and a rotten question about places. */
      if (n === step) n += r.int(1, o.base - 1);
      return { n, step };
    },
    render(item, o) {
      const s = figures(item.step, o.base);
      return (
        `<p class="pv-ask pv-ask--lead">${num(item.n, o.base)}</p>` +
        `<p class="pv-ask"><em>${s} more</em> ${line("sm")}</p>` +
        `<p class="pv-ask"><em>${s} less</em> ${line("sm")}</p>`
      );
    },
    answer(item, o) {
      return [
        `${figures(item.n + item.step, o.base)} &nbsp;·&nbsp; ${figures(item.n - item.step, o.base)}`,
      ];
    },
  },

  {
    id: "how-many",
    group: "numbers",
    label: "How many tens in all?",
    blurb: "470 has 47 tens, not 7. The idea every written method later rests on.",
    heading: "How many in all?",
    instruction: () =>
      "Not the digit sitting in that place — how many there are in the whole " +
      "number. Cover every place to the right of the one you are asked about, " +
      "and read off what is left.",
    cols: 2,
    defaultCount: 6,
    make(r, o) {
      /* Never the TOP place: "how many thousands in 4 706" answers itself off
         the first digit, and the whole point of the question is the places
         stacked above the one being asked about. A two-place number has no
         such place, and there the question is honestly the easy one. */
      return {
        n: drawNumber(r, o, { zeros: Math.min(o.zeros, 0.2) }),
        p: r.int(1, Math.max(1, o.places - 2)),
      };
    },
    render(item, o) {
      return (
        `<p class="pv-ask pv-ask--lead">${num(item.n, o.base)}</p>` +
        `<p class="pv-ask">How many ${placeNameLower(item.p, o.base)} in all? ${line("sm")}</p>`
      );
    },
    answer(item, o) {
      const all = Math.floor(item.n / Math.pow(o.base, item.p));
      /* "1 ten", not "1 tens" — the key is read out loud to a class. */
      return [`${figures(all, o.base)} ${placeNameFor(all, item.p, o.base)}`];
    },
  },

  {
    id: "round",
    group: "numbers",
    label: "Round it",
    blurb: "To the nearest ten, hundred or thousand. One digit decides, and it is not the one being rounded.",
    heading: "Round each number",
    instruction: (o) =>
      `Round each number to the place you are asked for. Look at the digit just ` +
      `below that place: if it is ${figures(Math.ceil(o.base / 2), o.base)} or ` +
      `more the place goes up by one, and if it is less the place stays as it ` +
      `is. Either way every place below it becomes a zero.`,
    cols: 2,
    defaultCount: 6,
    make(r, o) {
      const p = r.int(1, o.places - 1);
      const d = digitsOf(drawNumber(r, o, { zeros: Math.min(o.zeros, 0.15) }), o.base, o.places);
      /* One in four sits exactly on the halfway digit, because "and 5 goes up"
         is the half of the rule a child is actually being asked to remember.
         Only in an even base is there a digit exactly halfway to land on. */
      if (o.base % 2 === 0 && r.chance(0.25)) d[p - 1] = o.base / 2;
      let n = 0;
      for (let i = o.places - 1; i >= 0; i--) n = n * o.base + d[i];
      return { n, p };
    },
    render(item, o) {
      return (
        `<p class="pv-ask pv-ask--lead">${num(item.n, o.base)}</p>` +
        `<p class="pv-ask">to the nearest ${placeNameFor(1, item.p, o.base)} ${line("sm")}</p>`
      );
    },
    answer(item, o) {
      /* The rule as it is TAUGHT — the one digit just below decides — and not
         "whichever multiple is nearer". The two agree in base ten; in an odd
         base they can part company, and the key has to say what the paper
         asked for. */
      const step = Math.pow(o.base, item.p);
      const below = digitsOf(item.n, o.base, o.places)[item.p - 1];
      const down = Math.floor(item.n / step) * step;
      return [figures(below * 2 >= o.base ? down + step : down, o.base)];
    },
  },

  {
    id: "compare",
    group: "numbers",
    label: "Bigger, smaller or the same",
    blurb: "Two numbers a whisker apart; put < , > or = between them.",
    heading: "Which is bigger?",
    instruction: () =>
      "Put &lt; , &gt; or = in the box. Compare the biggest place first, and only move down a place when the two are equal.",
    cols: 2,
    defaultCount: 6,
    make(r, o) {
      const a = drawNumber(r, o, { zeros: o.zeros });
      const digits = digitsOf(a, o.base, o.places);
      const b = digits.slice();
      if (r.chance(0.12)) {
        /* One pair in eight is equal. Without them a child learns that the
           answer is always an arrow. */
        return { a, b: a };
      }
      /* Change ONE place, low down more often than high up, so the pair has to
         be read all the way along and not judged on its first digit. */
      const weights = [];
      for (let p = 0; p < o.places; p++) weights.push(...Array(o.places - p).fill(p));
      const p = r.pick(weights);
      let d = r.int(0, o.base - 1);
      while (d === b[p] || (p === o.places - 1 && d === 0)) d = r.int(0, o.base - 1);
      b[p] = d;
      let nb = 0;
      for (let i = o.places - 1; i >= 0; i--) nb = nb * o.base + b[i];
      return { a, b: nb };
    },
    render(item, o) {
      return `<p class="pv-ask pv-ask--lead">${num(item.a, o.base)} ${box()} ${num(item.b, o.base)}</p>`;
    },
    answer(item) {
      return [item.a > item.b ? "&gt;" : item.a < item.b ? "&lt;" : "="];
    },
  },

  {
    id: "order",
    group: "numbers",
    label: "Put them in order",
    blurb: "Four numbers built from nearly the same digits.",
    heading: "Put them in order",
    instruction: () => "Write the four numbers again, smallest first.",
    cols: 1,
    defaultCount: 3,
    make(r, o) {
      /* All four share a leading digit some of the time, so ordering cannot be
         done on the first figure alone. */
      const base = drawNumber(r, o, { zeros: o.zeros });
      const seen = new Set([base]);
      const ns = [base];
      let guard = 0;
      while (ns.length < 4 && guard++ < 60) {
        const d = digitsOf(base, o.base, o.places);
        const p = r.int(0, o.places - 2);
        d[p] = r.int(0, o.base - 1);
        if (r.chance(0.5)) {
          const q = r.int(0, o.places - 2);
          d[q] = r.int(0, o.base - 1);
        }
        let n = 0;
        for (let i = o.places - 1; i >= 0; i--) n = n * o.base + d[i];
        if (!seen.has(n)) { seen.add(n); ns.push(n); }
      }
      return { ns: r.shuffle(ns) };
    },
    render(item, o) {
      return (
        `<p class="pv-ask pv-ask--lead pv-given">${item.ns.map((n) => num(n, o.base)).join("<span class=\"pv-sep\">·</span>")}</p>` +
        `<p class="pv-ask">${item.ns.map(() => line("sm")).join(" , ")}</p>`
      );
    },
    answer(item, o) {
      return [item.ns.slice().sort((x, y) => x - y).map((n) => figures(n, o.base)).join(", ")];
    },
  },

  {
    id: "build",
    group: "numbers",
    label: "Build the biggest and the smallest",
    blurb: "A handful of digits, used once each. The zero is the trap, and it is deliberate.",
    heading: "Build the biggest and the smallest",
    instruction: () =>
      "Use every digit once. Careful with a zero — a number does not begin with one.",
    cols: 2,
    defaultCount: 4,
    make(r, o) {
      /* Once each — so there can never be more digits than the base has. */
      const pool = digitChars(o.base).map((c, i) => i);
      const picked = r.shuffle(pool).slice(0, Math.min(o.places, o.base));
      /* Slip a zero in most of the time: the smallest number you can build
         from 0, 4, 7 is 407 and not 047, and that is the only thing this
         exercise is really about. */
      if (!picked.includes(0) && r.chance(0.6)) picked[r.int(0, picked.length - 1)] = 0;
      return { digits: picked };
    },
    render(item) {
      const chips = item.digits.map((d) => `<span class="pv-chip">${digitChar(d)}</span>`).join("");
      return (
        `<p class="pv-ask pv-ask--lead">${chips}</p>` +
        `<p class="pv-ask">Biggest ${line("sm")}</p>` +
        `<p class="pv-ask">Smallest ${line("sm")}</p>`
      );
    },
    answer(item, o) {
      const desc = item.digits.slice().sort((a, b) => b - a);
      const asc = item.digits.slice().sort((a, b) => a - b);
      if (asc[0] === 0) {
        const swap = asc.findIndex((d) => d > 0);
        if (swap > 0) [asc[0], asc[swap]] = [asc[swap], asc[0]];
      }
      const read = (arr) => figures(arr.reduce((s, d) => s * o.base + d, 0), o.base);
      return [`biggest ${read(desc)} · smallest ${read(asc)}`];
    },
  },
];

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/** Whether an exercise can run at all under these options, and why not. */
export function unavailable(ex, o) {
  if (ex.tenOnly && o.base !== 10) return "base ten only";
  return null;
}

/** The number of places an exercise will actually use. */
export function placesFor(ex, o) {
  return ex.maxPlaces ? Math.min(o.places, ex.maxPlaces) : o.places;
}
