/* ============================================================================
   Maths Workbook — the DIVIDING AND REMAINDERS exercises
   ----------------------------------------------------------------------------
   One of the four families this workbook is made of; they are assembled into
   one registry in ./exercises.js. The level and help dials declared here are
   shared with the sums and the fractions, because all three are about numbers
   a child can hold rather than about place value.

   THE ORDER IS THE TEACHING, and here the order is the whole argument:

     A  group them        a pile of things and a pencil. No numbers yet.
     B  write it down     the same picture as a sentence, with every part named
     C  what is left over the remainder stops being a leftover and becomes a
                          fraction of one more group
     D  fraction bars     and once it is a fraction, it is a mixed number, and
                          a mixed number is an improper fraction
     E  short division    and LAST, the written method — the only section here
                          whose numbers are bigger than a child can count out,
                          because it is what you graduate to once the idea is
                          safe. Nothing in it is new except the writing: it is
                          still "how many groups, and what is left over", asked
                          one figure at a time.

   Section C is the hinge. A child who has grouped seventeen counters into
   threes-of-five-with-two-over, and then coloured three whole bars and two
   fifths of a fourth, has been shown that 17 ÷ 5 = 3 r 2 and 17/5 = 3 2/5 are
   the same sentence written twice. That is the only idea on this paper, and
   everything before it is preparation and everything after it is practice.

   Every question is said in the same words every time, and the divisor is
   always called the divisor.
   ========================================================================== */

import { pileSvg, jitterFor, traysSvg, SHAPE_NAMES, SHAPE_WORDS } from "./shapes.js";
import { barsSvg, sentence, mixed, improper } from "./bars.js";
import { busStop, shortWork } from "./divart.js";
import { flagStop, flagKey, flagWork, flagFits } from "./flagart.js";
import { longStop, longKey, longWork, longFits } from "./longart.js";
import { want } from "/utils/components/workbook/want.js";

const line = (size = "md") => `<span class="wb-line wb-line--${size}"></span>`;
const box = () => `<span class="rw-answer"></span>`;

/* A labelled answer slot: the word first, then the space. Every answer on this
   paper is asked for the same way round. */
const slot = (label) => `<span class="rw-slot"><em>${label}</em>${box()}</span>`;

export const REM_GROUPS = [
  { id: "group", chapter: "Chapter 4 · Dividing and remainders", label: "Group them", blurb: "A pile of things and a pencil. Ring the groups; count what is over." },
  { id: "write", label: "Write it down", blurb: "The same picture as a sentence, with every part named." },
  { id: "bridge", label: "What is left over", blurb: "The hinge: the remainder becomes a fraction of one more group." },
  { id: "short", label: "Short division", blurb: "The bus stop: divide one figure at a time and carry what is left over into the next." },
  { id: "long", label: "Long division", blurb: "The working written out: how many times it goes, multiply back, take away, bring the next one down." },
  { id: "flag", label: "Dividing with a flag", blurb: "By the first figure of the divisor, with the rest taken off crosswise — the criss-cross run backwards." },
  { id: "flaglong", label: "Long flag division", blurb: "The same, by a three-figure divisor: the flag is two figures now, so the crossing is a criss-cross and the last two figures are set apart." },
  { id: "div-decimal", label: "Dividing decimals", blurb: "The point stays put when you divide BY a whole number, and both points move when you do not." },
];

/* ── how hard ──────────────────────────────────────────────────────────────
   Small on purpose at every level. This paper is about an IDEA, and a child
   who loses the idea while working out 47 ÷ 8 has not been taught the idea. */

/* `dens` is the denominators a level uses. It is wider than `divisors` on
   purpose: eighths are an easy fraction to see and a hard number to divide by,
   so the fraction sections reach further than the dividing ones do. */
export const LEVELS = {
  gentle: {
    id: "gentle",
    label: "Gentle — up to 20 things, shared into 2s, 3s, 4s and 5s",
    max: 20, divisors: [2, 3, 4, 5], dens: [2, 3, 4, 6, 8], maxWhole: 3,
  },
  middle: {
    id: "middle",
    label: "Middle — up to 34 things, shared into 2s to 6s",
    max: 34, divisors: [2, 3, 4, 5, 6], dens: [2, 3, 4, 5, 6, 8], maxWhole: 4,
  },
  stretch: {
    id: "stretch",
    label: "Stretch — up to 48 things, shared into 3s to 9s",
    max: 48, divisors: [3, 4, 5, 6, 7, 8, 9], dens: [3, 4, 5, 6, 8, 10, 12], maxWhole: 5,
  },
};

export const levelOf = (o) => LEVELS[o.level] || LEVELS.gentle;

export const HELP = {
  show: { id: "show", label: "Show me — one done for you, and the picture already grouped" },
  help: { id: "help", label: "Help me — the picture and the sentence, both empty" },
  try: { id: "try", label: "Let me try — no words under the sentence" },
};
export const helpOf = (o) => HELP[o.help] || HELP.help;

/* ── drawing a division ────────────────────────────────────────────────────*/

/**
 * A division that leaves something over.
 *
 * A remainder of nought is a true and useful fact, and it is NOT what this
 * paper is teaching, so it is drawn out on purpose everywhere except the one
 * exercise that exists to catch it. A page of "remainder 0" would teach a
 * child that the last box is decoration.
 */
function drawDivision(r, o, { allowExact = false, max = null } = {}) {
  const L = levelOf(o);
  const top = Math.min(max || L.max, L.max);
  let d;
  let n;
  let guard = 0;
  do {
    d = r.pick(L.divisors);
    n = r.int(d + 1, top);
    guard++;
  } while (!allowExact && n % d === 0 && guard < 60);
  return { n, d, q: Math.floor(n / d), r: n % d };
}

/** The pile that goes with it — a shape, a colour and a wobble, all seeded. */
function drawPile(r, n) {
  const shape = r.pick(SHAPE_NAMES);
  return { shape, colour: r.int(0, 5), jit: jitterFor(r, n), word: SHAPE_WORDS[shape] };
}

const pile = (item) =>
  `<div class="rw-art">${pileSvg(item.n, { shape: item.shape, colour: item.colour, jit: item.jit })}</div>`;

/* ── A. group them ─────────────────────────────────────────────────────────*/

const ringGroups = {
  id: "ring-groups",
  group: "group",
  label: "Ring the groups",
  blurb: "Draw a ring round every group. Count the rings, then count what is left.",
  heading: "Ring the groups",
  instruction: () =>
    "Draw a ring round each group. When you cannot make another full group, " +
    "what is left over is the remainder.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const div = drawDivision(r, o);
    return { ...div, ...drawPile(r, div.n) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Ring groups of <b>${item.d}</b>.</p>` +
      pile(item) +
      `<p class="wb-ask">${slot("Groups")}${slot("Left over")}</p>`
    );
  },
  /* Fourteen in groups of four, because four is the one divisor whose groups
     land inside single rows of the pile — so the three rings are three clean
     ellipses and not a ring that wraps round the end of a row. */
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">Ring groups of <b>4</b>.</p>` +
      `<div class="rw-art">${pileSvg(14, { shape: "circle", colour: 0, rings: 4 })}</div>` +
      `<p class="wb-ask">Groups <b>3</b> &nbsp;·&nbsp; Left over <b>2</b></p>` +
      `<p class="wb-ask rw-worked__say">Three full groups of four is twelve. Two will not ` +
      `make another four, so two is the remainder.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.q), want.num(item.r), want.pen(".rw-art svg")];
  },
  answer(item) {
    return [`${item.q} groups, ${item.r} left over`];
  },
};

const shareOut = {
  id: "share-out",
  group: "group",
  label: "Share them out",
  blurb: "The other kind of division: not groups OF five, but shared BETWEEN five.",
  heading: "Share them out",
  instruction: () =>
    "Give one to each tray, then another, and keep going. Draw them in. " +
    "Stop when there are not enough to go all the way round.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const div = drawDivision(r, o, { max: 26 });
    return { ...div, ...drawPile(r, div.n) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Share <b>${item.n}</b> ${item.word} between ` +
      `<b>${item.d}</b> trays.</p>` +
      pile(item) +
      `<div class="rw-art">${traysSvg(item.d)}</div>` +
      `<p class="wb-ask">${slot("Each tray gets")}${slot("Left over")}</p>`
    );
  },
  key(item) {
    return [want.num(item.q), want.num(item.r), want.pen(".rw-art svg")];
  },
  answer(item) {
    return [`${item.q} each, ${item.r} left over`];
  },
};

/* ── B. write it down ──────────────────────────────────────────────────────*/

const pictureSentence = {
  id: "picture-sentence",
  group: "write",
  label: "Picture into a sentence",
  blurb: "Group the picture, then fill the sentence in underneath it.",
  heading: "Write the sentence under the picture",
  instruction: () =>
    "Ring the groups first. Then fill in the sentence. The words under each box say what goes in it.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const div = drawDivision(r, o);
    return { ...div, ...drawPile(r, div.n) };
  },
  render(item, o) {
    return (
      `<p class="wb-ask wb-ask--lead">Ring groups of <b>${item.d}</b>.</p>` +
      pile(item) +
      sentence(item, {
        given: { n: null, d: null, q: null, r: null },
        named: helpOf(o).id !== "try",
      })
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">Thirteen ${SHAPE_WORDS.circle}, in groups of 5.</p>` +
      sentence({ n: 13, d: 5, q: 2, r: 3 }) +
      `</div>`
    );
  },
  key(item) {
    return [want.num(item.n), want.num(item.d), want.num(item.q), want.num(item.r), want.pen(".rw-art svg")];
  },
  answer(item) {
    return [`${item.n} ÷ ${item.d} = ${item.q} r ${item.r}`];
  },
};

const nameTheParts = {
  id: "name-the-parts",
  group: "write",
  label: "Name the parts",
  blurb: "Which number is the divisor? Which is the remainder? The words, not the working.",
  heading: "Name the parts",
  instruction: () =>
    "Every one is already worked out. Write down which number is which.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const div = drawDivision(r, o);
    return { ...div, ask: r.pick(["d", "r", "q"]) };
  },
  render(item) {
    const asked = { d: "the divisor", r: "the remainder", q: "how many groups" }[item.ask];
    return (
      `<p class="wb-ask wb-ask--lead">` +
      sentence(item, { named: false }) +
      `</p><p class="wb-ask">Which number is <b>${asked}</b>? ${box()}</p>`
    );
  },
  key(item) {
    return [want.num(item[item.ask])];
  },
  answer(item) {
    return [String(item[item.ask])];
  },
};

const divideWrite = {
  id: "divide-write",
  group: "write",
  label: "Divide with no picture",
  blurb: "The same sentence once the counters are not needed.",
  heading: "Divide, and say what is left over",
  instruction: () => "Work each one out. Write how many groups, and the remainder.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    /* One in six comes out exactly. It is the only place on this paper a
       remainder of nought is allowed, and it is here so that "0" stays a
       possible answer rather than a mistake. */
    return drawDivision(r, o, { allowExact: r.chance(0.18) });
  },
  render(item, o) {
    return sentence(item, {
      given: { q: null, r: null },
      named: helpOf(o).id === "show",
    });
  },
  key(item) {
    return [want.num(item.q), want.num(item.r)];
  },
  answer(item) {
    return [`${item.q} r ${item.r}`];
  },
};

const buildBack = {
  id: "build-back",
  group: "write",
  label: "Work backwards",
  blurb: "Four groups of six with three over — what was the number?",
  heading: "Work backwards",
  instruction: () =>
    "You are told the groups and what was left. Work out how many there were to start with.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return drawDivision(r, o);
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead"><b>${item.q}</b> groups of <b>${item.d}</b>, ` +
      `and <b>${item.r}</b> left over.</p>` +
      `<p class="wb-ask">${slot("How many to start with")}</p>`
    );
  },
  key(item) {
    return [want.num(item.n)];
  },
  answer(item) {
    return [`${item.n} &nbsp;(${item.q} × ${item.d} + ${item.r})`];
  },
};

/* ── C. what is left over ──────────────────────────────────────────────────*/

const leftoverFraction = {
  id: "leftover-fraction",
  group: "bridge",
  label: "The bit left over is a fraction",
  blurb: "The hinge of the whole paper: 2 left out of a group of 5 is two fifths.",
  heading: "The bit left over is a fraction",
  instruction: () =>
    "The groups are full bars. What is left over does not fill a bar — colour it in, " +
    "and write how much of a bar it is.",
  cols: 1,
  defaultCount: 3,
  /* Between two and four whole bars. One whole bar barely makes the point, and
     six of them is a picture of nothing. */
  make(r, o) {
    let div;
    let guard = 0;
    do {
      div = drawDivision(r, o, { max: Math.min(30, levelOf(o).max) });
      guard++;
    } while ((div.q < 2 || div.q > 4) && guard < 60);
    return div;
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead"><b>${item.n}</b> shared into groups of <b>${item.d}</b> ` +
      `makes <b>${item.q}</b> full groups with <b>${item.r}</b> left over.</p>` +
      `<div class="rw-art">${barsSvg(item.d, item.q * item.d, item.q + 1)}</div>` +
      `<p class="wb-ask">Colour in the ${item.r} left over.</p>` +
      `<p class="wb-ask">So ${item.n} ÷ ${item.d} = ` +
      `${mixed(null, null, null, { blank: true })}</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead"><b>17</b> shared into groups of <b>5</b> makes ` +
      `<b>3</b> full groups with <b>2</b> left over.</p>` +
      `<div class="rw-art">${barsSvg(5, 17, 4)}</div>` +
      `<p class="wb-ask">Three whole bars, and 2 out of 5 of the next one. ` +
      `So 17 ÷ 5 = ${mixed(3, 2, 5)} — and that is the same as ${improper(17, 5)}.</p></div>`
    );
  },
  key(item) {
    return [
      want.colour({ count: item.r, says: `colour ${item.r} more` }),
      want.num(item.q), want.num(item.r), want.num(item.d),
    ];
  },
  answer(item) {
    return [`${item.q} ${item.r}/${item.d}`];
  },
};

/* ── D. fraction bars ──────────────────────────────────────────────────────*/

/** A mixed number small enough to draw. */
/* ── E. short division ─────────────────────────────────────────────────────
   The written method, on the same ruled sheet the sums and the multiplying use
   (divart.js). It is the printed half of the short division board — same shape
   on the page, so working one on the screen and one on paper is working the
   same thing twice.

   THE DIVISOR ALWAYS GOES INTO THE FIRST FIGURE. "7 into 1 won't go, so write
   nothing and take 10" is a real step and a real difficulty, and it is left to
   the board, which can ask for it one figure at a time and say why a nought
   there is not part of the answer. On paper, first, every column has a figure
   in it — the child can see how many answers are wanted by counting the boxes.

   Figure counts are separate EXERCISES, as they are in the multiplying, so a
   teacher can put "3 figures ÷ 1 figure" on a page and nothing else. What the
   LEVEL changes is the divisor — the same divisors the rest of the chapter
   shares out counters into. */

/* WITH A REMAINDER, OR WITHOUT — and never both in one exercise. A page of
   divisions where some come out and some do not is a page where a child cannot
   tell whether a leftover means "you have finished" or "you have gone wrong",
   and the two are worth practising apart: dividing exactly is checking a
   multiplication backwards, and dividing with something over is the harder
   idea that the answer is two numbers. Every written division in this chapter
   comes both ways, and its label says which it is. */

/** A number of `digits` figures whose first figure is at least `d`. */
function overD(r, d, digits) {
  let n = r.int(d, 9);
  for (let i = 1; i < digits; i++) n = n * 10 + r.int(0, 9);
  return n;
}

/** …and made to come out exactly, or made not to. */
const landOn = (n, d, exact) => {
  const over = n % d;
  if (exact) return n - over;
  if (over) return n;
  /* one MORE would sometimes be one figure longer — 99 + 1 is not a two-figure
     sum any more — and an exercise that says two figures has to mean it */
  return String(n + 1).length === String(n).length ? n + 1 : n - 1;
};

const shortSum = (r, o, digits, exact) => {
  const d = r.pick(levelOf(o).divisors);
  /* the first figure is at least the divisor, so the answer starts in the
     first column and every column has a box — and nudging the number to make
     it come out (or not) must not spoil either of those */
  for (let go = 0; go < 60; go++) {
    const n = landOn(overD(r, d, digits), d, exact);
    if (String(n).length === digits && Number(String(n)[0]) >= d) return { n, d };
  }
  const flat = Number(String(d) + "0".repeat(digits - 1));
  return { n: landOn(flat + (exact ? 0 : 1), d, exact), d };
};

function shortDivEx(id, digits, exact, label, count) {
  return {
    id,
    group: "short",
    label,
    blurb: exact
      ? "Divide one figure at a time; these all come out exactly."
      : "Divide one figure at a time; carry what is left into the next one.",
    heading: `Short division — ${exact ? "no remainder" : "with a remainder"}`,
    instruction: () =>
      "Start at the LEFT. How many times does it go into the first figure? Write that above "
      + "the bar, and write what is LEFT OVER in the little box in front of the next figure. "
      + "Now divide that figure with the carried number in front of it, and keep going. "
      + (exact
        ? "Every one of these goes exactly: if something is left at the end, look again."
        : "Whatever is left at the very end is the remainder."),
    cols: digits > 4 ? 1 : 2,
    defaultCount: count,
    make(r, o) {
      return shortSum(r, o, digits, exact);
    },
    render(item) {
      return `<p class="wb-ask wb-ask--lead"><b>${item.n} ÷ ${item.d}</b></p>`
        + `<div class="rw-art">${busStop(item.n, item.d)}</div>`;
    },
    worked() {
      const [n, d] = exact ? [426, 3] : (digits === 2 ? [85, 3] : [442, 3]);
      return `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>`
        + `<p class="wb-ask wb-ask--lead"><b>${n} ÷ ${d}</b></p>`
        + `<div class="rw-art">${busStop(n, d, { answer: true })}</div>`
        + `<p class="wb-ask rw-worked__say">${exact
          ? "3 into 4 goes 1, and 1 is left over — carry the 1 in front of the 2. "
            + "3 into 12 goes 4, and nothing is left. 3 into 6 goes 2, and nothing is left "
            + "over at the end either: 426 ÷ 3 = 142 exactly."
          : digits === 2
            ? "3 into 8 goes 2, and 2 is left over — carry the 2 in front of the 5. "
              + "3 into 25 goes 8, and 1 is left over. So 85 ÷ 3 = 28 remainder 1."
            : "3 into 4 goes 1, and 1 is left over — carry the 1 in front of the 4. "
              + "3 into 14 goes 4, and 2 is left over — carry the 2 in front of the 2. "
              + "3 into 22 goes 7, and 1 is left over. So 442 ÷ 3 = 147 remainder 1."
        }</p></div>`;
    },
    /* the boxes the sheet draws, in the order it draws them: the answer along
       the top, the remainder past the end of the bar, then the carried figures
       — which are working and are never marked */
    key(item) {
      const { q, carry, remainder } = shortWork(item.n, item.d);
      const out = q.map((f) => want.cell(f));
      if (remainder) out.push(want.cell(remainder));
      /* the left-overs are marked too: what is left after dividing a figure is
         one number and not another, and carrying the wrong one is exactly the
         mistake this method is worked out loud to catch */
      carry.forEach((c) => { if (c != null) out.push(want.num(c)); });
      return out;
    },
    answer(item) {
      const { q, remainder } = shortWork(item.n, item.d);
      const said = q.join("");
      return [`${item.n} ÷ ${item.d} = ${said}${remainder ? ` remainder ${remainder}` : ""}`];
    },
  };
}

/* ── F. LONG division ──────────────────────────────────────────────────────
   The method everybody was taught, and the one this chapter arrives at last:
   how many times it goes, multiply back, take away, bring the next one down.

   It is short division with the working written out, which is why it comes
   after it — and it is the only method here that copes with a divisor a child
   cannot hold in their head, which is why it comes at all. The plan is the
   written board's (longart.js → boards/longdiv.js), so the shape on paper is
   the shape on the screen.

   The figures brought down are PRINTED. Everything that is arithmetic — the
   answer figure, what it multiplies to, what is left when that is taken away —
   is asked for. */

/** A division worth writing out the long way, at this size and this kind. */
function longSum(r, o, digits, dwide, exact) {
  const tier = levelOf(o).id;
  const top = dwide === 2
    ? ({ gentle: 39, middle: 69, stretch: 99 }[tier] ?? 69)
    : ({ gentle: 349, middle: 649, stretch: 999 }[tier] ?? 649);
  const low = dwide === 2 ? 11 : 101;
  for (let go = 0; go < 400; go++) {
    const d = r.int(low, top);
    const n = landOn(overD(r, 1, digits), d, exact);
    if (String(n).length !== digits) continue;
    if (longFits(n, d)) return { n, d };
  }
  return { n: exact ? 441 : 442, d: 3 };
}

/** A worked example of the same shape, found the same way every time. */
function pickWorked(digits, dwide, exact, fits) {
  const low = dwide === 1 ? 3 : dwide === 2 ? 23 : 234;
  for (let d = low; d < low + 90; d += 7) {
    for (let n = 10 ** (digits - 1) + 234; n < 10 ** digits; n += 1237) {
      if (exact !== (n % d === 0)) continue;
      if (fits(n, d)) return [n, d];
    }
  }
  return null;
}

function longDivEx(id, digits, dwide, exact, label, count) {
  return {
    id,
    group: "long",
    label,
    blurb: exact
      ? "Multiply back, take away, bring the next one down — and these come out."
      : "Multiply back, take away, bring the next one down; what is left at the end is the remainder.",
    heading: `Long division — ${exact ? "no remainder" : "with a remainder"}`,
    instruction: () =>
      "How many times does the divisor go into the figures you have? Write that above the "
      + "bar. MULTIPLY it back and write what it comes to underneath, take that away, and "
      + "bring the next figure down beside what is left. Do it again with that number. "
      + (exact
        ? "Every one of these comes out: nothing should be left at the end."
        : "What is left when there is nothing more to bring down is the remainder."),
    cols: 1,
    defaultCount: count,
    make(r, o) {
      return longSum(r, o, digits, dwide, exact);
    },
    render(item) {
      return `<p class="wb-ask wb-ask--lead"><b>${item.n} ÷ ${item.d}</b></p>`
        + `<div class="rw-art">${longStop(item.n, item.d)}</div>`;
    },
    worked() {
      const found = pickWorked(Math.min(digits, 4), dwide, exact, longFits)
        || (exact ? [441, 3] : [442, 3]);
      const [n, d] = found;
      const w = longWork(n, d);
      const first = w.live[0];
      return `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>`
        + `<p class="wb-ask wb-ask--lead"><b>${n} ÷ ${d}</b></p>`
        + `<div class="rw-art">${longStop(n, d, { answer: true })}</div>`
        + `<p class="wb-ask rw-worked__say">`
        + `${d} into ${first.cur} goes ${first.q}, and ${first.q} × ${d} = ${first.product}, `
        + `which leaves ${first.rem}. Bring the next figure down and do it again. `
        + `${n} ÷ ${d} = ${w.quotient}${w.remainder ? ` remainder ${w.remainder}` : " exactly"}.`
        + `</p></div>`;
    },
    key(item) {
      return longKey(item.n, item.d).map((e) => want.cell(e.value));
    },
    answer(item) {
      const w = longWork(item.n, item.d);
      return [`${item.n} ÷ ${item.d} = ${w.quotient}${w.remainder ? ` remainder ${w.remainder}` : ""}`];
    },
  };
}

/* ── dividing decimals ─────────────────────────────────────────────────────
   Two different things wear the same name, and a child who is taught them as
   one rule learns neither:

     7.2 ÷ 4     the point does not move. You are sharing 7.2 into 4, and the
                 answer's point sits straight under the one you started with.
     7.2 ÷ 0.4   the point moves — BOTH of them, the same way, until the number
                 you are dividing BY is whole. 7.2 ÷ 0.4 is 72 ÷ 4, because
                 making both of them ten times bigger cannot change how many
                 times one goes into the other.

   Either way the division itself is the bus stop they already know, so what is
   asked for here is the dividing AND the one sentence about the point. */

const point = (n, dp) => (dp ? (n / 10 ** dp).toFixed(dp) : String(n));

/** A division that comes out exactly, so the answer is a decimal and not a mess. */
const exactSum = (r, o, figures) => {
  const d = r.pick(levelOf(o).divisors.filter((x) => x > 1));
  /* NEITHER NUMBER MAY END IN A NOUGHT. 17.0 ÷ 5 is a question about a nought
     that should not be written, and an answer of 3.40 is worse: the point is
     supposed to be the only new thing on the page. */
  for (let go = 0; go < 200; go++) {
    let q = r.int(2, 9);
    for (let i = 1; i < figures; i++) q = q * 10 + r.int(0, 9);
    const n = d * q;
    if (q % 10 && n % 10) return { d, q, n };
  }
  return { d: 4, q: 18, n: 72 };
};

function decDivEx(id, figures, moves, label, count) {
  return {
    id,
    group: "div-decimal",
    label,
    blurb: moves
      ? "Move both points until what you divide by is whole, then divide."
      : "Divide as usual; the point in the answer sits straight above the one you started with.",
    heading: moves ? "Dividing BY a decimal" : "Dividing a decimal",
    instruction: () => (moves
      ? "You cannot divide by part of a number, so move the point in BOTH numbers the same "
        + "way until the one you are dividing by is whole — ten times bigger each, which "
        + "cannot change how many times one goes into the other. Then divide as usual."
      : "The point does not move. Divide as if it were not there, and then write it into the "
        + "answer straight above where it stands in the number you divided."),
    cols: 2,
    defaultCount: count,
    make(r, o) {
      const { d, q, n } = exactSum(r, o, figures);
      return { d, q, n };
    },
    render(item) {
      const shown = moves
        ? `${point(item.n, 1)} ÷ ${point(item.d, 1)}`
        : `${point(item.n, 1)} ÷ ${item.d}`;
      const answer = moves ? String(item.q) : point(item.q, 1);
      return `<p class="wb-ask wb-ask--lead"><b>${shown}</b></p>`
        + `<p class="wb-ask">${moves
          ? `Move both points one place: <b>${item.n} ÷ ${item.d}</b>`
          : `Divide as if the point were not there: <b>${item.n} ÷ ${item.d}</b>`}</p>`
        + `<div class="rw-art">${busStop(item.n, item.d)}</div>`
        + `<p class="wb-ask">${moves
          ? `Both of them ten times bigger, so the answer is the same: ${shown} = `
          : `Now put the point back, straight above where it was: ${shown} = `}`
        + `<span class="rw-answer"></span></p>`;
    },
    worked() {
      const [n, d] = [72, 4];
      const shown = moves ? "7.2 ÷ 0.4" : "7.2 ÷ 4";
      return `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>`
        + `<p class="wb-ask wb-ask--lead"><b>${shown}</b></p>`
        + `<div class="rw-art">${busStop(n, d, { answer: true })}</div>`
        + `<p class="wb-ask rw-worked__say">${moves
          ? "You cannot divide by four tenths as it stands, so make both of them ten times "
            + "bigger: 7.2 becomes 72 and 0.4 becomes 4. Ten times as much shared between ten "
            + "times as many is the same share. 72 ÷ 4 = 18, so 7.2 ÷ 0.4 = 18."
          : "72 ÷ 4 = 18, and the point does not move: it was one place from the end of 7.2 "
            + "and it is one place from the end of the answer. 7.2 ÷ 4 = 1.8."
        }</p></div>`;
    },
    key(item) {
      const { q, carry, remainder } = shortWork(item.n, item.d);
      const out = q.map((f) => want.cell(f));
      if (remainder) out.push(want.cell(remainder));
      carry.forEach((c) => { if (c != null) out.push(want.num(c)); });
      out.push(want.num(moves ? item.q : point(item.q, 1)));
      return out;
    },
    answer(item) {
      const shown = moves
        ? `${point(item.n, 1)} ÷ ${point(item.d, 1)}`
        : `${point(item.n, 1)} ÷ ${item.d}`;
      return [`${shown} = ${moves ? item.q : point(item.q, 1)}`];
    },
  };
}

const decDivWhole = decDivEx("div-dec-21", 2, false, "Decimals — a decimal ÷ a whole number", 3);
const decDivThree = decDivEx("div-dec-31", 3, false, "Decimals — 3 figures ÷ a whole number", 2);
const decDivBy = decDivEx("div-dec-by", 2, true, "Decimals — dividing BY a decimal", 3);

/* ── dividing with a flag ──────────────────────────────────────────────────
   The division that goes with the criss-cross. Long division by 23 asks a child
   to guess how many 23s are in 123 and multiply back to find out; this asks
   them to divide by 2 — which they can do — and then take off a crossing, which
   is the criss-cross's own step run backwards.

   The figure first thought of is sometimes too big, and a child finds that out
   when the crossing will not come off what is left. That is the same thing long
   division asks of them, met one figure at a time instead of one number. */

const flagSum = (r, o, digits, dwide, exact) => {
  const tier = levelOf(o).id;
  const hi = { gentle: 3, middle: 5, stretch: 9 }[tier] ?? 5;
  for (let go = 0; go < 500; go++) {
    /* the FIRST figure is what the child divides by, so it is the one the
       level holds down; the flag can be anything, because a flag is only ever
       multiplied by one figure */
    const d = dwide === 2
      ? r.int(2, hi) * 10 + r.int(1, 9)
      : r.int(2, hi) * 100 + r.int(0, 9) * 10 + r.int(1, 9);
    let n = r.int(1, 9);
    for (let i = 1; i < digits; i++) n = n * 10 + r.int(0, 9);
    n = landOn(n, d, exact);
    if (String(n).length !== digits) continue;
    if (flagFits(n, d)) return { n, d };
  }
  return dwide === 2
    ? { n: exact ? 1219 : 1234, d: 23 }
    : { n: exact ? 123318 : 123456, d: 234 };
};

function flagDivEx(id, digits, dwide, exact, label, count) {
  const long = dwide === 3;
  return {
    id,
    group: long ? "flaglong" : "flag",
    label,
    blurb: long
      ? "Divide by the first figure only; the crossing is a criss-cross of the two flag figures."
      : "Divide by the first figure only, and take the crossing off what is left.",
    heading: `${long ? "Long flag division" : "Dividing with a flag"} — ${exact ? "no remainder" : "with a remainder"}`,
    instruction: () =>
      "The divisor is split: the FIRST figure divides, the rest is the flag. Divide what "
      + "stands there by the first figure and write the answer under the bar. Then take the "
      + "crossing off what comes down — "
      + (long
        ? "the first flag figure times the answer figure you have just written, PLUS the "
          + "second flag figure times the one before it, which is the criss-cross again. The "
          + "last two figures are set apart: they are not divided, they pay the crossings "
          + "that are still owed."
        : "that is the flag times the figure you have just written — and what is left is "
          + "what you divide next. If the crossing will not come off, the figure was one too "
          + "big: take one off it and try again.")
      + (exact ? " Every one of these comes out exactly." : ""),
    cols: 1,
    defaultCount: count,
    make(r, o) {
      return flagSum(r, o, digits, dwide, exact);
    },
    render(item) {
      return `<p class="wb-ask wb-ask--lead"><b>${item.n} ÷ ${item.d}</b></p>`
        + `<div class="rw-art">${flagStop(item.n, item.d)}</div>`;
    },
    worked() {
      const found = long
        ? (exact ? pickWorked(6, 3, true, flagFits) : [123456, 234])
        : (exact ? pickWorked(4, 2, true, flagFits) : [1234, 23]);
      const [n, d] = found || (long ? [123456, 234] : [1234, 23]);
      const w = flagWork(n, d);
      const say = long
        ? `The flag is ${w.flag.join(" and ")}, so each crossing is ${w.flag[0]} times the figure `
          + `just written plus ${w.flag[1]} times the one before it, and the last two figures are `
          + `set apart to pay what is still owed. `
        : `${w.main} into the first figures, then the crossing ${w.flag[0]} × that answer figure `
          + `taken off what comes down. When the crossing will not come off, the figure was one `
          + `too big. `;
      return `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>`
        + `<p class="wb-ask wb-ask--lead"><b>${n} ÷ ${d}</b></p>`
        + `<div class="rw-art">${flagStop(n, d, { answer: true })}</div>`
        + `<p class="wb-ask rw-worked__say">${say}`
        + `${n} ÷ ${d} = ${w.quotient}${w.remainder ? ` remainder ${w.remainder}` : " exactly"}.`
        + `</p></div>`;
    },
    key(item) {
      return flagKey(item.n, item.d).map((e) => (e.kind === "digit"
        ? want.cell(e.value)
        : want.num(e.value)));
    },
    answer(item) {
      const w = flagWork(item.n, item.d);
      return [`${item.n} ÷ ${item.d} = ${w.quotient}${w.remainder ? ` remainder ${w.remainder}` : ""}`];
    },
  };
}

/* ── the exercises themselves ──────────────────────────────────────────────
   Every written division at every size, twice: one that comes out and one that
   does not. The ids of the ones that were here before mean what they always
   meant — a division with something left over — so a workbook already set for
   a class still builds the paper it was set with.

   HOW BIG THEY GO: seven figures divided by three. That is further than a
   child is usually taken, and it is deliberate — the METHOD does not change,
   and the only way to show that is to run it out further than the point where
   a wrong method would fall over. */

const shortTwo = shortDivEx("div-short-21", 2, false, "Short division — 2 figures ÷ 1 figure, with a remainder", 6);
const shortThree = shortDivEx("div-short-31", 3, false, "Short division — 3 figures ÷ 1 figure, with a remainder", 4);
const shortFive = shortDivEx("div-short-51", 5, false, "Short division — 5 figures ÷ 1 figure, with a remainder", 3);
const shortSeven = shortDivEx("div-short-71", 7, false, "Short division — 7 figures ÷ 1 figure, with a remainder", 2);
const shortTwoX = shortDivEx("div-short-21x", 2, true, "Short division — 2 figures ÷ 1 figure, no remainder", 6);
const shortThreeX = shortDivEx("div-short-31x", 3, true, "Short division — 3 figures ÷ 1 figure, no remainder", 4);
const shortFiveX = shortDivEx("div-short-51x", 5, true, "Short division — 5 figures ÷ 1 figure, no remainder", 3);
const shortSevenX = shortDivEx("div-short-71x", 7, true, "Short division — 7 figures ÷ 1 figure, no remainder", 2);

const longThree = longDivEx("div-long-32", 3, 2, false, "Long division — 3 figures ÷ 2 figures, with a remainder", 3);
const longFive = longDivEx("div-long-52", 5, 2, false, "Long division — 5 figures ÷ 2 figures, with a remainder", 2);
const longSix = longDivEx("div-long-63", 6, 3, false, "Long division — 6 figures ÷ 3 figures, with a remainder", 2);
const longSeven = longDivEx("div-long-73", 7, 3, false, "Long division — 7 figures ÷ 3 figures, with a remainder", 2);
const longThreeX = longDivEx("div-long-32x", 3, 2, true, "Long division — 3 figures ÷ 2 figures, no remainder", 3);
const longFiveX = longDivEx("div-long-52x", 5, 2, true, "Long division — 5 figures ÷ 2 figures, no remainder", 2);
const longSixX = longDivEx("div-long-63x", 6, 3, true, "Long division — 6 figures ÷ 3 figures, no remainder", 2);
const longSevenX = longDivEx("div-long-73x", 7, 3, true, "Long division — 7 figures ÷ 3 figures, no remainder", 2);

const flagThree = flagDivEx("div-flag-32", 3, 2, false, "Flag division — 3 figures ÷ 2 figures, with a remainder", 3);
const flagFour = flagDivEx("div-flag-42", 4, 2, false, "Flag division — 4 figures ÷ 2 figures, with a remainder", 2);
const flagFive = flagDivEx("div-flag-52", 5, 2, false, "Flag division — 5 figures ÷ 2 figures, with a remainder", 2);
const flagThreeX = flagDivEx("div-flag-32x", 3, 2, true, "Flag division — 3 figures ÷ 2 figures, no remainder", 3);
const flagFourX = flagDivEx("div-flag-42x", 4, 2, true, "Flag division — 4 figures ÷ 2 figures, no remainder", 2);
const flagFiveX = flagDivEx("div-flag-52x", 5, 2, true, "Flag division — 5 figures ÷ 2 figures, no remainder", 2);

const flagLongFive = flagDivEx("div-flag-53", 5, 3, false, "Long flag division — 5 figures ÷ 3 figures, with a remainder", 2);
const flagLongSix = flagDivEx("div-flag-63", 6, 3, false, "Long flag division — 6 figures ÷ 3 figures, with a remainder", 2);
const flagLongSeven = flagDivEx("div-flag-73", 7, 3, false, "Long flag division — 7 figures ÷ 3 figures, with a remainder", 2);
const flagLongFiveX = flagDivEx("div-flag-53x", 5, 3, true, "Long flag division — 5 figures ÷ 3 figures, no remainder", 2);
const flagLongSixX = flagDivEx("div-flag-63x", 6, 3, true, "Long flag division — 6 figures ÷ 3 figures, no remainder", 2);
const flagLongSevenX = flagDivEx("div-flag-73x", 7, 3, true, "Long flag division — 7 figures ÷ 3 figures, no remainder", 2);

/* ── the registry ──────────────────────────────────────────────────────────*/

export const REM_EXERCISES = [
  ringGroups, shareOut,
  pictureSentence, nameTheParts, divideWrite, buildBack,
  leftoverFraction,
  shortTwoX, shortTwo, shortThreeX, shortThree, shortFiveX, shortFive, shortSevenX, shortSeven,
  longThreeX, longThree, longFiveX, longFive, longSixX, longSix, longSevenX, longSeven,
  flagThreeX, flagThree, flagFourX, flagFour, flagFiveX, flagFive,
  flagLongFiveX, flagLongFive, flagLongSixX, flagLongSix, flagLongSevenX, flagLongSeven,
  decDivWhole, decDivThree, decDivBy,
];

export { line, box, slot };
