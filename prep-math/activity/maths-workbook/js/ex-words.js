/* ============================================================================
   Maths Workbook — WORDS AND FIGURES, a step at a time
   ----------------------------------------------------------------------------
   Chapter two, and the part most learners come unstuck on. Writing
   4 070 506 in words is not one skill, it is five or six small ones stacked,
   and a sheet that asks for the whole thing at once only finds out that the
   child cannot do it — it never finds out WHICH of the five.

   So this file is deliberately made of small sections, each one asking for one
   thing and nothing else:

     saying it            twenty, then forty-two, then three hundred and six
     the periods          what a period is, and what this one is called
     one period           read three figures, then say the period's name
     the whole number     thousands, then millions, then the big ones
     the other way        words back into figures
     the empty period     "two million and six" — the one that catches everyone
     which reading        three readings of one number, one of them right

   ── how big the numbers get ───────────────────────────────────────────────
   To the quadrillions period, which is eighteen figures. That is past where a
   JavaScript number stops being exact, so every number here is a STRING of
   digits from the moment it is drawn to the moment it is marked — see the note
   over the period helpers in numbers.js. Nothing in this file ever calls
   Number() on a long number, and nothing should.

   ── what may be marked ────────────────────────────────────────────────────
   The marker strips spaces and commas before it compares (normText in want.js),
   so "1 234 567" and "1234567" are the same answer to it. That means grouping
   a number into periods CANNOT be marked, and there is no exercise here that
   pretends to: the period work asks for the period's NAME instead, which can.
   ========================================================================== */

import {
  wordsOf, groupDigits, periodsOf, periodName, drawDigits, onlyDigits, PERIODS,
  figuresHtml,
} from "./numbers.js";
import { levelOf, helpOf } from "./ex-remainder.js";
import { want } from "/utils/components/workbook/want.js";

/* ── the marks a child writes in ───────────────────────────────────────────*/

const line = (size = "md") => `<span class="wb-line wb-line--${size}"></span>`;
/* A whole number written out reaches right across the page and then some, so
   its answer place is a ruled box rather than a rule — one place still, so it
   is marked as one answer. */
const write = (lines = 2) => `<span class="wb-line wb-line--write" style="--wb-lines:${lines}"></span>`;
/* Every number the child reads off this chapter is written as periods and
   figures that know their own place, so that interactive mode can label them
   — see figuresHtml. On paper it is the same number it always was. */
const fig = (d) => figuresHtml(d);
const said = (w) => `<em class="wb-words">${w}</em>`;

/* Both spellings of every answer in words. The marker keeps letters and
   figures and throws the rest away, so a hyphen never matters — but "and"
   is letters, and whether a child writes it is not something to be marked
   wrong for. */
const asWords = (w) => want.words(w, w.replace(/ and /g, " "));
/* Figures: the marker strips the spaces, so one form would do. Both are given
   because the key is also read by a person. */
const asFigures = (d) => want.text(d, groupDigits(d));

/* ── how long a number each level draws ────────────────────────────────────
   The level dial on this workbook is about how many things are counted, not
   about how long a number is, so these sections carry their own ladder. Every
   level still reaches the top of its own section; what changes is where it
   starts. */
const spanFor = (o, lo, hi) => {
  const L = levelOf(o).id;
  const step = Math.max(1, Math.round((hi - lo) / 3));
  if (L === "gentle") return [lo, Math.min(hi, lo + step)];
  if (L === "middle") return [Math.min(hi, lo + step), Math.min(hi, lo + 2 * step)];
  return [Math.min(hi, lo + 2 * step), hi];
};
const drawSpan = (r, o, lo, hi, over = {}) => {
  const [a, b] = spanFor(o, lo, hi);
  return drawDigits(r, r.int(a, b), { zeros: 0.3, ...over });
};

export const WORD_GROUPS = [
  {
    chapter: "Chapter 2 · Words and figures",
    id: "say",
    label: "Saying a number",
    blurb: "One step at a time: twenty, forty-two, three hundred and six, and what a period is.",
  },
  {
    id: "wordfig",
    label: "Words and figures",
    blurb: "Both directions, from thousands up to the quadrillions — and the traps in between.",
  },
];

export const WORD_EXERCISES = [
  /* ────────────────────────────── saying it ──────────────────────────────*/
  {
    id: "w-ones",
    group: "say",
    label: "Up to twenty",
    blurb: "The twenty words every other number is built out of.",
    heading: "Write each number in words",
    instruction: () => "Write the word for each number.",
    cols: 3,
    defaultCount: 6,
    tenOnly: true,
    make(r) {
      return { d: String(r.int(0, 20)) };
    },
    render(item) {
      return `<p class="wb-ask">${fig(item.d)} &nbsp;=&nbsp; ${line("md")}</p>`;
    },
    key(item) { return [asWords(wordsOf(item.d))]; },
    answer(item) { return [wordsOf(item.d)]; },
  },

  {
    id: "w-tens",
    group: "say",
    label: "Tens and ones",
    blurb: "Forty-two: the tens word, then the ones word, with a hyphen between them.",
    heading: "Write each number in words",
    instruction: (o) => (helpOf(o).id === "show"
      ? "Write the word for each number. Two words joined by a hyphen: forty-two, sixty-one."
      : "Write the word for each number."),
    cols: 3,
    defaultCount: 6,
    tenOnly: true,
    make(r) {
      /* never a round ten at Show me — the hyphen is the thing being taught */
      return { d: String(r.int(21, 99)) };
    },
    render(item) {
      return `<p class="wb-ask">${fig(item.d)} &nbsp;=&nbsp; ${line("md")}</p>`;
    },
    key(item) { return [asWords(wordsOf(item.d))]; },
    answer(item) { return [wordsOf(item.d)]; },
  },

  {
    id: "w-hundreds",
    group: "say",
    label: "Hundreds, and the word AND",
    blurb: "Three hundred and six. The `and` goes in front of what is left after the hundreds.",
    heading: "Write each number in words",
    instruction: () => "Write the word for each number. Say `and` after the hundreds.",
    cols: 2,
    defaultCount: 6,
    tenOnly: true,
    make(r) {
      const h = r.int(1, 9);
      /* a tail under a hundred is what the `and` is for, so it is the common
         case here and not an accident */
      const tail = r.chance(0.75) ? r.int(1, 99) : r.int(0, 0);
      return { d: String(h * 100 + tail) };
    },
    render(item) {
      return `<p class="wb-ask">${fig(item.d)} &nbsp;=&nbsp; ${line("lg")}</p>`;
    },
    key(item) { return [asWords(wordsOf(item.d))]; },
    answer(item) { return [wordsOf(item.d)]; },
  },

  /* ────────────────────────────── the periods ────────────────────────────*/
  {
    id: "w-period-name",
    group: "say",
    label: "Name the period",
    blurb: "A long number is read in threes. This asks what the three on the left are called.",
    heading: "Name the period",
    instruction: () => "Each number is written in periods of three figures. Write the name of the period the figures on the LEFT belong to — thousand, million, billion, trillion or quadrillion.",
    cols: 2,
    defaultCount: 6,
    tenOnly: true,
    make(r, o) {
      const d = drawSpan(r, o, 4, 18);
      return { d, name: periodName(d.length - 1) };
    },
    render(item) {
      return `<p class="wb-ask">${fig(item.d)} &nbsp;—&nbsp; the left period is the ${line("md")}</p>`;
    },
    key(item) { return [asWords(item.name)]; },
    answer(item) { return [item.name]; },
  },

  {
    id: "w-period-count",
    group: "say",
    label: "How many periods",
    blurb: "Counting the threes from the right — the first thing to do with a long number.",
    heading: "How many periods?",
    instruction: () => "Split each number into periods of three figures, counting from the RIGHT, and write how many periods it has.",
    cols: 3,
    defaultCount: 6,
    tenOnly: true,
    make(r, o) {
      return { d: drawSpan(r, o, 4, 18) };
    },
    render(item) {
      return `<p class="wb-ask">${fig(item.d)} &nbsp;=&nbsp; ${line("xs")} periods</p>`;
    },
    key(item) { return [want.num(periodsOf(item.d).length)]; },
    answer(item) { return [String(periodsOf(item.d).length)]; },
  },

  {
    id: "w-one-period",
    group: "say",
    label: "One period at a time",
    blurb: "Read the three figures, then say the period's name. The whole method, on one period.",
    heading: "Read the left period",
    instruction: () => "Write the figures on the LEFT in words, and then the name of their period — like `two hundred and thirty-four million`.",
    cols: 1,
    defaultCount: 5,
    tenOnly: true,
    make(r, o) {
      const d = drawSpan(r, o, 7, 18);
      const parts = periodsOf(d);
      const name = periodName(d.length - 1);
      return { d, said: `${wordsOf(parts[0])} ${name}` };
    },
    render(item) {
      return `<p class="wb-ask wb-ask--lead">${fig(item.d)}</p>` + `<p class="wb-ask">${line("lg")}</p>`;
    },
    key(item) { return [asWords(item.said)]; },
    answer(item) { return [item.said]; },
  },

  /* ──────────────────────── figures into words ───────────────────────────*/
  {
    id: "w-to-words-th",
    group: "wordfig",
    label: "Thousands in words",
    blurb: "Four, five and six figures: one period, then the rest.",
    heading: "Write each number in words",
    instruction: () => "Write each number in words.",
    cols: 1,
    defaultCount: 4,
    tenOnly: true,
    make(r, o) {
      return { d: drawSpan(r, o, 4, 6) };
    },
    render(item) {
      return `<p class="wb-ask wb-ask--lead">${fig(item.d)}</p>` + `<p class="wb-ask">${write(2)}</p>`;
    },
    key(item) { return [asWords(wordsOf(item.d))]; },
    answer(item) { return [wordsOf(item.d)]; },
  },

  {
    id: "w-to-words-mil",
    group: "wordfig",
    label: "Millions in words",
    blurb: "Seven to nine figures — two period names to get in the right order.",
    heading: "Write each number in words",
    instruction: () => "Write each number in words.",
    cols: 1,
    defaultCount: 4,
    tenOnly: true,
    make(r, o) {
      return { d: drawSpan(r, o, 7, 9) };
    },
    render(item) {
      return `<p class="wb-ask wb-ask--lead">${fig(item.d)}</p>` + `<p class="wb-ask">${write(2)}</p>`;
    },
    key(item) { return [asWords(wordsOf(item.d))]; },
    answer(item) { return [wordsOf(item.d)]; },
  },

  {
    id: "w-to-words-big",
    group: "wordfig",
    label: "Billions to quadrillions",
    blurb: "Ten figures and up. The method never changes — there is just more of it.",
    heading: "Write each number in words",
    instruction: () => "Write each number in words. Take one period at a time, from the left.",
    cols: 1,
    defaultCount: 3,
    tenOnly: true,
    make(r, o) {
      return { d: drawSpan(r, o, 10, 18) };
    },
    render(item) {
      return `<p class="wb-ask wb-ask--lead">${fig(item.d)}</p>` + `<p class="wb-ask">${write(3)}</p>`;
    },
    key(item) { return [asWords(wordsOf(item.d))]; },
    answer(item) { return [wordsOf(item.d)]; },
  },

  /* ──────────────────────── words into figures ───────────────────────────*/
  {
    id: "w-from-words",
    group: "wordfig",
    label: "Words into figures",
    blurb: "The other way round, up to the millions.",
    heading: "Write each one in figures",
    instruction: () => "Write each number in figures.",
    cols: 1,
    defaultCount: 4,
    tenOnly: true,
    make(r, o) {
      return { d: drawSpan(r, o, 4, 9) };
    },
    render(item) {
      return `<p class="wb-ask">${said(wordsOf(item.d))} &nbsp;=&nbsp; ${line("lg")}</p>`;
    },
    key(item) { return [asFigures(item.d)]; },
    answer(item) { return [groupDigits(item.d)]; },
  },

  {
    id: "w-from-words-big",
    group: "wordfig",
    label: "Big words into figures",
    blurb: "Billions and up: every period gets three figures, whether it was said or not.",
    heading: "Write each one in figures",
    instruction: () => "Write each number in figures. Every period that is not the first one takes three figures, so fill the gaps with noughts.",
    cols: 1,
    defaultCount: 3,
    tenOnly: true,
    make(r, o) {
      return { d: drawSpan(r, o, 10, 18) };
    },
    render(item) {
      return `<p class="wb-ask">${said(wordsOf(item.d))}</p>` + `<p class="wb-ask">${line("lg")}</p>`;
    },
    key(item) { return [asFigures(item.d)]; },
    answer(item) { return [groupDigits(item.d)]; },
  },

  /* ─────────────────────────── the traps ─────────────────────────────────*/
  {
    id: "w-empty-period",
    group: "wordfig",
    label: "The period that is not said",
    blurb: "Two million and six. A period of noughts is not read out — and is the commonest thing to get wrong going back.",
    heading: "Mind the empty period",
    instruction: () => "One period in each number is all noughts, so it is not said at all. Write each one in figures.",
    cols: 1,
    defaultCount: 4,
    tenOnly: true,
    make(r, o) {
      return { d: drawSpan(r, o, 7, 15, { hole: 1, zeros: 0.2 }) };
    },
    render(item) {
      return `<p class="wb-ask">${said(wordsOf(item.d))} &nbsp;=&nbsp; ${line("lg")}</p>`;
    },
    key(item) { return [asFigures(item.d)]; },
    answer(item) { return [groupDigits(item.d)]; },
  },

  {
    id: "w-which-reading",
    group: "wordfig",
    label: "Which reading is right?",
    blurb: "Three readings of one number: one right, one that drops a period, one that loses the and.",
    heading: "Tick the reading that is right",
    instruction: () => "Only one of the three is the number written above it. Tick it.",
    cols: 1,
    defaultCount: 4,
    tenOnly: true,
    make(r, o) {
      const d = drawSpan(r, o, 7, 12, { zeros: 0.25 });
      const right = wordsOf(d);
      /* the two wrong ones are the two slips this chapter is about: a period
         name moved down, and the number said without its `and` tail */
      const parts = periodsOf(d);
      const dropped = parts.length > 2
        ? wordsOf(parts.slice(1).join("").replace(/^0+(?=\d)/, "") || "0")
        : right.replace(/ and /, " ");
      const slipped = right.includes(" and ")
        ? right.replace(/ and /, " ")
        : right.replace(PERIODS[parts.length - 1], PERIODS[Math.max(1, parts.length - 2)]);
      const pool = [right, dropped, slipped].map((w, i) => ({ w, right: i === 0 }));
      /* two wrong ones that came out the same as each other, or as the right
         one, would make the question unanswerable */
      const seen = new Set();
      const uniq = pool.filter((p) => (seen.has(p.w) ? false : seen.add(p.w)));
      while (uniq.length < 3) uniq.push({ w: `${right} thousand`, right: false });
      const shown = r.shuffle(uniq.slice(0, 3));
      return { d, shown, at: shown.findIndex((p) => p.right) };
    },
    render(item) {
      return (
        `<p class="wb-ask wb-ask--lead">${fig(item.d)}</p>` +
        `<span class="wb-tick wb-tick--down">` +
        item.shown.map((p) => `<span class="wb-tick__one"><span class="wb-box"></span>${p.w}</span>`).join("") +
        `</span>`
      );
    },
    key(item) { return [want.tick(item.at)]; },
    answer(item) { return [item.shown[item.at].w]; },
  },

  {
    id: "w-both-ways",
    group: "wordfig",
    label: "Both ways, mixed",
    blurb: "Figures one line, words the next, in no order — the test that the method has stuck.",
    heading: "Figures and words",
    instruction: () => "Where you are given figures, write the words. Where you are given words, write the figures.",
    cols: 1,
    defaultCount: 5,
    tenOnly: true,
    make(r, o) {
      return { d: drawSpan(r, o, 5, 15), toWords: r.chance(0.5) };
    },
    render(item) {
      if (item.toWords) {
        return `<p class="wb-ask wb-ask--lead">${fig(item.d)}</p>` + `<p class="wb-ask">${write(2)}</p>`;
      }
      return `<p class="wb-ask">${said(wordsOf(item.d))} &nbsp;=&nbsp; ${line("lg")}</p>`;
    },
    key(item) {
      return [item.toWords ? asWords(wordsOf(item.d)) : asFigures(item.d)];
    },
    answer(item) {
      return [item.toWords ? wordsOf(item.d) : groupDigits(item.d)];
    },
  },
];
