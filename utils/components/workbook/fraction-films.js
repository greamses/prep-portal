/* ============================================================================
   FRACTIONS, in four films
   ----------------------------------------------------------------------------
   Adding fractions is the first place in a child's arithmetic where the
   obvious thing — add the tops, add the bottoms — is wrong, and no amount of
   being told "find the common denominator" fixes that, because the words are
   an answer to a question they have not felt yet.

   So all four of these are done on the BAR, and on the same bar the workbook
   prints (`./fracbar.js`, `barSvg`): a strip cut into equal parts with some
   of them coloured. On a bar the whole thing is visible —

     like         ONE bar. The parts already match, so adding is colouring in
                  more of the same bar and taking away is rubbing some out
     equivalents  cutting every part the same way changes what the parts are
                  CALLED and not how much is coloured; the new cuts are drawn
                  in a colour of their own so you can see which ones we made
     unlike       two bars, so you can see the parts do not match — then the
                  pieces of the second bar are CARRIED UP onto the first one
     mixed        whole bars and part bars, and the borrow is one whole bar
                  being cut up

   They are built with the same kit as the bar films (./film-kit.js), so the
   stage, the hand that draws, the question band and the step machinery are
   shared and cannot drift apart.
   ========================================================================== */

import { barSvg, stackSvg } from "./fracbar.js";
import { film, mb, runLit } from "./film-kit.js";

/* the colours the paper shades a part with, so the film and the printed page
   cannot disagree about what "coloured" looks like */
const SHADE = "#bfe3ff";
const PAPER = "#fffdf8";
const TAKEN = "#f0ece4";
const ADDED = "#cfe9c4";

/** The parts of a drawing — all of them, or the ones in one bar of a stack. */
const cells = (s, r = null) => [...(s
  ? s.querySelectorAll(`[data-mb="cell"]${r == null ? "" : `[data-row="${r}"]`}`)
  : [])];
/** The frame of a bar — the thing that grows when the bar is drawn. */
const frame = (s, r = 0) => (s ? s.querySelector(`[data-mb="bar"][data-mb-row="${r}"]`) : null);
/** The cuts made to get two bars to match, which are drawn in their own colour. */
const newCuts = (s, r = 0) => [...(s
  ? s.querySelectorAll(`[data-mb="cut"][data-new="1"][data-row="${r}"]`)
  : [])];
/** The old divisions, from before the cutting. */
const oldCuts = (s, r = 0) => [...(s
  ? s.querySelectorAll(`[data-mb="cut"]:not([data-new])[data-row="${r}"]`)
  : [])];
const fillOf = (c) => c.getAttribute("fill");
const colouredIn = (list) => list.filter((c) => fillOf(c) === SHADE || fillOf(c) === ADDED);

/**
 * DRAW A BAR: the frame grows, its parts appear as an empty row of boxes, and
 * only then does the colour go in, one part at a time. That order is the
 * lesson — the bar is cut first and coloured second, which is exactly what
 * the top and bottom numbers mean, in that order.
 */
const drawBar = (s, H, { row = 0, at = 0, gap = 0.22, from = PAPER } = {}) => {
  H.grow(frame(s, row), at);
  const list = cells(s, row);
  list.filter((c) => fillOf(c) === PAPER).forEach((c) => H.show(c));
  list.filter((c) => fillOf(c) !== PAPER).forEach((c, i) => H.tint(c, from, at + 0.55 + i * gap));
  return list;
};

/**
 * A BAR BEING CUT. The colour is already on it and does not move; what is new
 * is the lines, and they are made one at a time, left to right, in the colour
 * that says "we made this one".
 */
const cutBar = (s, H, { row = 0, at = 0.3, gap = 0.32 } = {}) => {
  H.grow(frame(s, row), 0);
  cells(s, row).forEach((c) => (fillOf(c) === PAPER ? H.show(c) : H.tint(c, fillOf(c), 0)));
  oldCuts(s, row).forEach((n) => H.show(n));
  /* EACH CUT IS MADE, not revealed: drawn down through the bar from the top,
     one after another along it, so the child watches the bar being divided
     rather than finding it already divided. */
  newCuts(s, row).forEach((n, i) => H.score(n, at + i * gap));
};

/**
 * PARTS TAKEN AWAY, ONE AT A TIME. *"Animate the taking away one by one."*
 * Four tenths going pale together is an answer; four tenths going pale one
 * after another is four tenths being poured out, and the child can count
 * them as they go.
 */
const takeBar = (s, H, { row = 0, at = 0.9, gap = 0.5 } = {}) => {
  H.grow(frame(s, row), 0);
  const list = cells(s, row);
  list.filter((c) => fillOf(c) === PAPER).forEach((c) => H.show(c));
  list.filter((c) => fillOf(c) === SHADE || fillOf(c) === ADDED).forEach((c) => H.tint(c, PAPER, 0.4));
  list.filter((c) => fillOf(c) === TAKEN).forEach((c, i) => H.tint(c, SHADE, at + i * gap));
};

/* A fraction film is drawn on a narrower paper than a bar model: one bar is
   76mm, so measuring it against the 150mm sheet would leave it a third of
   the screen wide and the parts too small to count. */
const PAPER_MM = 80, PIC_W = 44;
/* where the bars hang: the left edge, and the top of the first one */
const X = 13;
/* one bar is 10mm deep and they stand 14mm apart, which at this scale is */
const ROW_DROP = 14 * (PIC_W / PAPER_MM);
const MID = 2.75;                        // from the top of a bar to its middle

/* ═══ 1 · ONE BAR, WHEN THE PARTS ALREADY MATCH ════════════════════════════*/

export function fracLike() {
  const A1 = 2, A2 = 3, D1 = 8;            // 2/8 + 3/8 = 5/8
  const B1 = 7, B2 = 4, D2 = 10;           // 7/10 − 4/10 = 3/10
  /* ONE BAR, ALL THROUGH. *"Use a single bar for the addition and
     subtraction of like fractions."* Two eighths and three eighths are parts
     of the same pizza, and drawing them as two bars quietly says they are
     parts of two pizzas — which is the very mistake the next film has to
     undo. The pictures below are the same bar at four moments of its life,
     hung at the same place on the screen, so what the child sees is one bar
     being coloured in and then rubbed out. */
  const AT = { x: X, y: 26 };
  return film({
    paperMm: PAPER_MM,
    picW: PIC_W,
    asks: [
      { id: "a1", text: `Rosa eats ${A1}/${D1} of a pizza, and later she eats ${A2}/${D1} more. `
        + "How much of the pizza has she eaten altogether?" },
      { id: "a2", text: `A jug holds ${B1}/${D2} of a litre. Ada pours out ${B2}/${D2} of a litre. `
        + "How much is left in the jug?" },
    ],
    pics: {
      p1: () => barSvg({ num: A1, den: D1, label: `${A1} eighths` }),
      p2: () => barSvg({ num: A1 + A2, den: D1, plus: A2, label: `${A2} eighths more` }),
      p3: () => barSvg({ num: A1 + A2, den: D1, label: `${A1 + A2} eighths` }),
      q1: () => barSvg({ num: B1, den: D2, label: `${B1} tenths` }),
      q2: () => barSvg({ num: B1, den: D2, gone: B2, label: `${B1 - B2} tenths left` }),
    },
    picAt: { p1: AT, p2: AT, p3: AT, q1: AT, q2: AT },
    lines: [
      { id: "n1", text: `${A1}/${D1}`, x: 4, y: 28.6, c: 0, size: 2.8 },
      { id: "n3", text: `${A1 + A2}/${D1}`, x: 4, y: 28.6, c: 2, size: 2.8 },
      { id: "m1", text: `${B1}/${D2}`, x: 4, y: 28.6, c: 0, size: 2.8 },
      { id: "m2", text: `${B1 - B2}/${D2}`, x: 4, y: 28.6, c: 2, size: 2.8 },
      { id: "w1", text: "ONE bar, same size parts", y: 12, c: 1, size: 2.2 },
      { id: "w2", text: `${A1} + ${A2} = ${A1 + A2} parts`, y: 20, c: 0, size: 2.5 },
      { id: "w3", text: `${A1}/${D1} + ${A2}/${D1} = ${A1 + A2}/${D1}`, y: 28, c: 2, size: 2.6 },
      { id: "w4", text: "The bottom NEVER moves", y: 38, c: 3, size: 2.2 },
      { id: "x1", text: `${B1} − ${B2} = ${B1 - B2} parts`, y: 20, c: 0, size: 2.5 },
      { id: "x2", text: `${B1}/${D2} − ${B2}/${D2} = ${B1 - B2}/${D2}`, y: 28, c: 2, size: 2.6 },
    ],
    stages: {
      "p1.draw": (s, H) => drawBar(s, H),
      /* the same bar, with three more parts coloured in — in a colour of
         their own, so the two eighths and the three eighths can still be
         told apart on the one bar */
      "p2.more": (s, H) => {
        H.grow(frame(s), 0);
        const list = cells(s);
        list.forEach((c) => (fillOf(c) === ADDED ? null : H.show(c)));
        list.filter((c) => fillOf(c) === ADDED).forEach((c, i) => H.tint(c, PAPER, 0.4 + i * 0.45));
      },
      /* and now they are all just eighths */
      "p3.one": (s, H) => {
        H.grow(frame(s), 0);
        const list = cells(s);
        list.filter((c) => fillOf(c) === PAPER).forEach((c) => H.show(c));
        list.filter((c) => fillOf(c) === SHADE).forEach((c, i) => H.tint(c, i < A1 ? SHADE : ADDED, 0.3 + i * 0.12));
      },
      "q1.draw": (s, H) => drawBar(s, H, { gap: 0.16 }),
      "q2.take": (s, H) => takeBar(s, H, { at: 0.8, gap: 0.55 }),
    },
    steps: ({ push, look }) => {
      push("Fractions are the first place in arithmetic where the obvious move is the wrong one, so we are going "
        + "to do the whole of this on a bar, where you can see it. Read the question. Rosa eats two eighths of a "
        + "pizza. Here is the pizza: ONE bar, cut into eight equal parts because the bottom number is eight, and "
        + "two of them coloured because the top number is two.",
        { on: ["a1", "p1", "n1", "w1"], add: ["p1.draw"] });

      push("Then she eats three eighths more — and watch, because this is the bit that matters. It is the SAME "
        + "pizza. I do not draw another bar; I colour in three more parts of the one we have got, in green so "
        + "you can still see which three they were. One, two, three.",
        { on: ["p2"], off: ["p1"], add: ["p2.more"] });

      push("Now count every part that is coloured, green and blue together. One, two, three, four, five. Five "
        + "parts out of eight: five eighths. And every one of them is the same width — a green part is exactly an eighth, "
        + "the same as a blue one — so I can let them all go back to one colour. Nothing was clever there. You "
        + "counted.",
        { on: ["p3", "n3", "w2"], off: ["p2", "n1"], add: ["p3.one"] });

      push("Now look hard at the bottom number, because this is where the marks go missing. It was eight before "
        + "and it is eight after. It did not become sixteen. The bottom number is not a thing you are counting — "
        + "it is the NAME of the part, it tells you how big one piece is, and colouring in more pieces never "
        + "changed the size of a piece.",
        { on: ["w3", "w4"], look: look.tile("w4"), lookAt: { lit: true, delay: 1.4, hold: 2.4 } });

      push("Taking away is the same bar read backwards, so if you can do the first one you can do this one. "
        + "The jug holds seven tenths of a litre: one bar, ten equal parts, seven of them coloured in. Then "
        + "Ada pours four tenths out of it. Now, watch what happens to the BAR rather than to the numbers — "
        + "the numbers will look after themselves once you can see what is going on, and that is true of "
        + "every question in this chapter.",
        { on: ["a2", "q1", "m1"], off: ["a1", "p3", "n3", "w1", "w2", "w3"], add: ["q1.draw"] });

      push("And out they go, one at a time. That is one tenth gone. Two. Three. Four — and count what is still "
        + "coloured. Three. Three tenths left in the jug. The bottom number has not moved again: tenths went out "
        + "and tenths are left, because you cannot pour tenths out of a jug and have eighths left behind.",
        { on: ["q2", "m2", "x1"], off: ["q1", "m1"], add: ["q2.take"],
          look: look.tile("x1"), lookAt: { delay: 3.0, hold: 2.0, to: 1.25 } });

      push(`So, when the parts already match: one bar, count the coloured parts, add or take away as the story `
        + `says, and copy the bottom number down underneath. ${B1} tenths less ${B2} tenths is ${B1 - B2} `
        + "tenths. The one thing you must never do is add the bottoms — and if you are ever tempted, draw the "
        + "bar and the temptation goes away on its own.",
        { on: ["x2", "w4"], play: (S, H, stage) => runLit(H, stage, ["x1", "x2", "w4"]) });
    },
  });
}

/* ═══ 2 · THE SAME FRACTION, ANOTHER NAME ══════════════════════════════════*/

export function fracEqual() {
  const K = 3;                               // every part cut into three
  const AT = { x: X, y: 19 }, AT2 = { x: X, y: 31 };
  return film({
    paperMm: PAPER_MM,
    picW: PIC_W,
    asks: [
      { id: "a1", text: "Rosa says that 1/2 and 3/6 are the same amount of bar. Is she right?" },
      { id: "a2", text: "A recipe needs 2/3 of a cup of milk, and the only measure in the kitchen is "
        + "marked in ninths. How many ninths does she need?" },
    ],
    pics: {
      e1: () => barSvg({ num: 1, den: 2, label: "one half" }),
      e2: () => barSvg({ num: K, den: 2 * K, was: 2, label: "three sixths" }),
      e3: () => barSvg({ num: 2, den: 3, label: "two thirds" }),
      e4: () => barSvg({ num: 2 * K, den: 3 * K, was: 3, label: "six ninths" }),
    },
    picAt: { e1: AT, e2: AT2, e3: AT, e4: AT2 },
    lines: [
      { id: "n1", text: "1/2", x: 4, y: 21.6, c: 0, size: 2.8 },
      { id: "n2", text: "3/6", x: 4, y: 33.6, c: 2, size: 2.8 },
      { id: "n3", text: "2/3", x: 4, y: 21.6, c: 0, size: 2.8 },
      { id: "n4", text: "6/9", x: 4, y: 33.6, c: 2, size: 2.8 },
      { id: "w1", text: "Cut EVERY part the same way", y: 12, c: 1, size: 2.2 },
      { id: "w2", text: "The colour did not move", y: 19, c: 3, size: 2.2 },
      { id: "w3", text: "1 × 3 = 3   (top)", y: 27, c: 0, size: 2.4 },
      { id: "w4", text: "2 × 3 = 6   (bottom)", y: 34, c: 0, size: 2.4 },
      { id: "w5", text: "1/2 = 3/6", y: 42, c: 2, size: 2.8 },
      { id: "x1", text: "2 × 3 = 6   (top)", y: 27, c: 0, size: 2.4 },
      { id: "x2", text: "3 × 3 = 9   (bottom)", y: 34, c: 0, size: 2.4 },
      { id: "x3", text: "2/3 = 6/9", y: 42, c: 2, size: 2.8 },
    ],
    stages: {
      "e1.draw": (s, H) => drawBar(s, H),
      "e3.draw": (s, H) => drawBar(s, H),
      "e2.cut": (s, H) => cutBar(s, H, { gap: 0.3 }),
      "e4.cut": (s, H) => cutBar(s, H, { gap: 0.24 }),
    },
    steps: ({ push, look }) => {
      push("This one is the key to the next film, so stay with it even though it looks as though nothing is "
        + "happening. Rosa says a half and three sixths are the same amount. Here is the half: a bar cut into "
        + "two, one part coloured. We are going to find out whether she is right by doing something to the bar "
        + "that cannot possibly change how much of it is coloured.",
        { on: ["a1", "e1", "n1"], add: ["e1.draw"] });

      push("I am going to CUT every part into three. Not just the coloured one — every part, the same way, "
        + "right along the bar, and the cuts I make are the orange ones so you can tell them from the line that "
        + "was already there. Watch the colour while I do it. Did any of it move? Did any arrive, or go away? "
        + "No. Exactly as much of that bar is blue after the cutting as before it.",
        { on: ["e2", "w1"], add: ["e2.cut"],
          look: look.tile("w1"), lookAt: { delay: 2.2, hold: 2.2, to: 1.2 } });

      push("But what it is CALLED has changed. Count the parts now: six. Count the coloured ones: three. Three "
        + "parts coloured out of six — three sixths. Same bar, same colour, new name. So Rosa is right, and the "
        + "bar is the reason, not a rule somebody told her.",
        { on: ["n2", "w2"], look: look.tile("n2"), lookAt: { delay: 1.4, hold: 2.0, to: 1.3 } });

      push("Here is what that looks like in the numbers, and the numbers only say what you have just watched. "
        + "Every part became three parts, so the bottom was multiplied by three: two sixes. And the one coloured "
        + "part became three coloured parts, so the top was multiplied by three as well. The SAME three, top and "
        + "bottom — because it was one cut, done to the whole bar.",
        { on: ["w3", "w4", "w5"] });

      push("Second question, same move, different numbers. Two thirds of a cup, wanted in ninths. Draw the two "
        + "thirds: a bar cut into three, two of them coloured. Then ask yourself the only question that matters "
        + "here — what do I cut each part into to turn thirds into ninths? Three, because three threes are nine.",
        { on: ["a2", "e3", "n3"], off: ["a1", "e1", "e2", "n1", "n2", "w1", "w2", "w3", "w4", "w5"],
          add: ["e3.draw"] });

      push("So cut each third into three — six new orange cuts, and the two black lines that were there all "
        + "along. The colour has not shifted an inch; it never does. Count the coloured ones: six. Two thirds IS "
        + "six ninths, so she needs six of the little measures. Top times three, bottom times three, and the bar "
        + "is what says so.",
        { on: ["e4", "n4", "x1", "x2", "x3"], add: ["e4.cut"],
          look: look.tile("x3"), lookAt: { delay: 2.6, hold: 2.0, to: 1.3 } });

      push("One fraction, any number of names — a half is also two quarters, three sixths, five tenths, as far "
        + "as you care to cut. That is not a curiosity, it is a TOOL: in the next film there are two bars whose "
        + "parts do not match, and the only way to add them is to rename one of them, or both, until they do.",
        { play: (S, H, stage) => runLit(H, stage, ["x1", "x2", "x3"]) });
    },
  });
}

/* ═══ 3 · TWO BARS, AND THE PIECES CARRIED FROM ONE TO THE OTHER ═══════════*/

export function fracUnlike() {
  /* TWO BARS FIRST, THEN THE PIECES MOVE. *"For unlike fractions, show the
     two bars first, then move the second piece to the first bar to show how
     much was added or removed."* Swapping in a finished picture of five
     sixths asserts the answer; watching two sixths leave the bottom bar and
     come to rest in the gap on the top one IS the addition, and you can see
     on the way that the piece never changes size. */
  const AT = { x: X, y: 20 };
  const R0 = 20 + MID, R1 = 20 + ROW_DROP + MID;
  return film({
    paperMm: PAPER_MM,
    picW: PIC_W,
    asks: [
      { id: "a1", text: "Rosa eats 1/2 of a chocolate bar. Kate eats 1/3 of another bar the same size. "
        + "How much of a bar have they eaten between them?" },
      { id: "a2", text: "A plank is 3/4 of a metre long. A piece 2/3 of a metre is cut off it. "
        + "How long is the piece that is left?" },
    ],
    pics: {
      uu: () => stackSvg([{ num: 1, den: 2 }, { num: 1, den: 3 }], { label: "a half and a third" }),
      cc: () => stackSvg([{ num: 3, den: 6, was: 2 }, { num: 2, den: 6, was: 3, plus: 2 }],
        { label: "three sixths and two sixths" }),
      vv: () => stackSvg([{ num: 9, den: 12, was: 4 }, { num: 8, den: 12, was: 3, plus: 8 }],
        { label: "nine twelfths and eight twelfths" }),
    },
    picAt: { uu: AT, cc: AT, vv: AT },
    lines: [
      { id: "n1", text: "1/2", x: 4, y: R0, c: 0, size: 2.7 },
      { id: "n2", text: "1/3", x: 4, y: R1, c: 0, size: 2.7 },
      { id: "n3", text: "3/6", x: 4, y: R0, c: 2, size: 2.7 },
      { id: "n4", text: "2/6", x: 4, y: R1, c: 2, size: 2.7 },
      { id: "n5", text: "5/6", x: 4, y: R0, c: 3, size: 2.7 },
      { id: "m1", text: "9/12", x: 3, y: R0, c: 2, size: 2.5 },
      { id: "m2", text: "8/12", x: 3, y: R1, c: 1, size: 2.5 },
      { id: "m3", text: "1/12", x: 3, y: R0, c: 3, size: 2.5 },
      { id: "w1", text: "Parts of different SIZES", y: 12, c: 1, size: 2.2 },
      { id: "w2", text: "Cut both until they match", y: 19.5, c: 1, size: 2.2 },
      { id: "w3", text: "halves × 3, thirds × 2", y: 27, c: 0, size: 2.3 },
      { id: "w4", text: "3/6 + 2/6 = 5/6", y: 35, c: 2, size: 2.6 },
      { id: "x1", text: "quarters × 3, thirds × 4", y: 27, c: 0, size: 2.3 },
      { id: "x2", text: "9/12 − 8/12 = 1/12", y: 35, c: 2, size: 2.5 },
    ],
    stages: {
      "uu.draw": (s, H) => { drawBar(s, H, { row: 0 }); drawBar(s, H, { row: 1, at: 0.5 }); },
      "cc.cut": (s, H) => { cutBar(s, H, { row: 0, gap: 0.22 }); cutBar(s, H, { row: 1, at: 1.5, gap: 0.22 }); },
      /* the two sixths leave the bottom bar and fill the gap on the top one */
      "cc.carry": (s, H) => {
        const holes = cells(s, 0).filter((c) => fillOf(c) === PAPER);
        cells(s, 1).filter((c) => fillOf(c) === ADDED)
          .forEach((m, i) => H.slide(m, holes[i], 0.4 + i * 0.75, 0.7));
      },
      "vv.cut": (s, H) => { cutBar(s, H, { row: 0, gap: 0.14 }); cutBar(s, H, { row: 1, at: 1.7, gap: 0.14 }); },
      /* and here the pieces are carried up to LIE ON what they take away */
      "vv.carry": (s, H) => {
        const take = colouredIn(cells(s, 0));
        cells(s, 1).filter((c) => fillOf(c) === ADDED)
          .forEach((m, i) => H.slide(m, take[i], 0.3 + i * 0.3, 0.55));
      },
      /* one at a time, each pair going pale together: that piece is gone */
      "vv.take": (s, H) => {
        const take = colouredIn(cells(s, 0));
        const movers = cells(s, 1).filter((c) => fillOf(c) === ADDED);
        movers.forEach((m, i) => {
          H.wipe(m, TAKEN, 0.3 + i * 0.32);
          H.wipe(take[i], TAKEN, 0.3 + i * 0.32);
        });
      },
    },
    steps: ({ push, look }) => {
      push("Now the one everybody gets wrong, and I want to show you WHY it is wrong before I show you what to "
        + "do instead. Rosa eats half a bar. Kate eats a third of a bar the same size. Two people, two bars — "
        + "drawn the same length, because the two chocolate bars were the same size to begin with, and that is "
        + "the only reason this question makes sense at all.",
        { on: ["a1", "uu", "n1", "n2"], add: ["uu.draw"] });

      push("Look at the two coloured pieces. They are not the same size. One is half a bar and one is a third, "
        + "and a third is smaller. So if I try to count them — one piece and one piece makes two pieces — two of "
        + "WHAT? There is no such thing as two of a piece that keeps changing size. That is the whole trouble, "
        + "and it is why adding the tops and the bottoms gives nonsense.",
        { on: ["w1"], look: look.tile("w1"), lookAt: { lit: true, delay: 2.0, hold: 2.4 } });

      push("So we do the thing from the last film. Cut both bars until their parts match. Halves cut into three "
        + "are sixths; thirds cut into two are sixths. The orange lines are the cuts I am making — and watch the "
        + "colour on both bars, which does not shift an inch, because cutting only renames what is there.",
        { on: ["cc", "n3", "n4", "w2", "w3"], off: ["uu", "n1", "n2"], add: ["cc.cut"] });

      push("Now every part on the top bar is exactly the size of every part on the bottom one, and THAT is what "
        + "lets me do the next thing. Watch Kate's two sixths. I am going to pick them up and carry them onto "
        + "Rosa's bar, into the empty parts — one, and two. They do not change size on the way. They just move.",
        { add: ["cc.carry"] });

      push("And look at the top bar now. Three blue sixths and two green sixths, all in one bar, all the same "
        + "size. Count them: five. Five sixths of a bar eaten between them — and you can SEE it is five sixths, "
        + "because there is one empty part left out of six. The bottom number stayed at six the whole time, "
        + "because six is the name of the piece and nobody changed the pieces.",
        { on: ["n5", "w4"], off: ["n3", "n4"],
          look: look.tile("w4"), lookAt: { delay: 1.6, hold: 2.2, to: 1.25 } });

      push("Second question, and taking away is the same move with a different ending. Three quarters of a metre "
        + "of plank, with two thirds of a metre cut off it. Quarters and thirds do not match either, so cut both "
        + "into twelfths: quarters into three, thirds into four. All those orange lines are cuts I have made to "
        + "get the two bars to agree.",
        { on: ["a2", "vv", "m1", "m2", "x1"],
          off: ["a1", "cc", "n5", "w1", "w2", "w3", "w4"], add: ["vv.cut"] });

      push("Three quarters is nine twelfths, and two thirds is eight twelfths. Now I carry the eight up — but "
        + "this time they are not filling a gap, they are landing ON the pieces they take away. One on top of "
        + "one, and so on, eight times.",
        { add: ["vv.carry"] });

      push("And now watch them go, one pair at a time. Each piece that lands takes the piece underneath it with "
        + "it. One gone. Two. Three — and on to eight. Count what is left coloured on that top bar when they "
        + "have finished. One little piece. One twelfth of a metre, which is about eight centimetres, and that "
        + "is a believable length for the end of a plank.",
        { on: ["m3", "x2"], off: ["m1", "m2"], add: ["vv.take"] });

      push("So the whole of it is three moves, and only the middle one is new. Look at the parts: if they do not "
        + "match, you cannot count them. Cut both bars until they do — the smallest number both bottoms go into. "
        + "Then carry the pieces across and count. Never add the bottoms: the bottom is a NAME, and adding two "
        + "names together gets you nothing at all.",
        { play: (S, H, stage) => runLit(H, stage, ["x1", "x2"]) });
    },
  });
}

/* ═══ 4 · MIXED NUMBERS, WHEN THE PARTS DO NOT MATCH ═══════════════════════*/

export function fracMixed() {
  const AT = { x: X, y: 20 }, LOW = { x: X, y: 33 };
  const R0 = 20 + MID, R1 = 20 + ROW_DROP + MID;
  return film({
    paperMm: PAPER_MM,
    picW: PIC_W,
    asks: [
      { id: "a1", text: "Rosa walks 1 1/2 km before school and 2 1/3 km after it. "
        + "How far has she walked in the day?" },
      { id: "a2", text: "A jug holds 3 1/4 litres. 1 2/3 litres are poured out. "
        + "How much is left in the jug?" },
    ],
    pics: {
      /* the fraction halves of the first question, cut to sixths and carried */
      hh: () => stackSvg([{ num: 1, den: 2 }, { num: 1, den: 3 }], { label: "a half and a third" }),
      hc: () => stackSvg([{ num: 3, den: 6, was: 2 }, { num: 2, den: 6, was: 3, plus: 2 }],
        { label: "three sixths and two sixths" }),
      /* and the second, where there is not enough to take away from */
      k1: () => barSvg({ num: 3, den: 12, was: 4, label: "three twelfths" }),
      k2: () => barSvg({ num: 8, den: 12, was: 3, label: "eight twelfths" }),
      /* ONE WHOLE BAR, BORROWED and cut into twelfths like the rest */
      k3: () => barSvg({ num: 12, den: 12, label: "one whole, in twelfths" }),
      k4: () => barSvg({ num: 12, den: 12, gone: 8, label: "eight twelfths taken" }),
      k5: () => barSvg({ num: 7, den: 12, label: "seven twelfths left" }),
    },
    picAt: {
      hh: AT, hc: AT,
      k1: { x: X, y: 29 }, k2: { x: X, y: 38 }, k3: AT, k4: AT, k5: { x: X, y: 41 },
    },
    lines: [
      { id: "n1", text: "1/2", x: 4, y: R0, c: 0, size: 2.7 },
      { id: "n2", text: "1/3", x: 4, y: R1, c: 0, size: 2.7 },
      { id: "n3", text: "3/6", x: 4, y: R0, c: 2, size: 2.7 },
      { id: "n4", text: "2/6", x: 4, y: R1, c: 2, size: 2.7 },
      { id: "n5", text: "5/6", x: 4, y: R0, c: 3, size: 2.7 },
      { id: "m1", text: "3/12", x: 3, y: 31.6, c: 2, size: 2.5 },
      { id: "m2", text: "8/12", x: 3, y: 40.6, c: 1, size: 2.5 },
      { id: "m3", text: "12/12", x: 2.5, y: 22.6, c: 0, size: 2.4 },
      { id: "m4", text: "7/12", x: 3, y: 43.6, c: 3, size: 2.6 },
      { id: "w1", text: "Wholes with wholes", y: 12, c: 1, size: 2.3 },
      { id: "w2", text: "1 + 2 = 3 whole km", y: 19, c: 0, size: 2.4 },
      { id: "w3", text: "halves and thirds → sixths", y: 27, c: 1, size: 2.2 },
      { id: "w4", text: "3/6 + 2/6 = 5/6", y: 34.5, c: 2, size: 2.5 },
      { id: "w5", text: "3 5/6 km", y: 42, c: 3, size: 2.8 },
      { id: "x1", text: "quarters, thirds → twelfths", y: 12, c: 1, size: 2.2 },
      { id: "x2", text: "3/12 is not enough", y: 19.5, c: 1, size: 2.3 },
      { id: "x3", text: "borrow 1 whole = 12/12", y: 27, c: 0, size: 2.2 },
      { id: "x4", text: "12/12 + 3/12 = 15/12", y: 34, c: 0, size: 2.3 },
      { id: "x5", text: "15/12 − 8/12 = 7/12", y: 41, c: 2, size: 2.4 },
      { id: "x6", text: "2 − 1 = 1 whole litre", y: 48, c: 3, size: 2.3 },
    ],
    stages: {
      "hh.draw": (s, H) => { drawBar(s, H, { row: 0 }); drawBar(s, H, { row: 1, at: 0.5 }); },
      "hc.cut": (s, H) => { cutBar(s, H, { row: 0, gap: 0.22 }); cutBar(s, H, { row: 1, at: 1.4, gap: 0.22 }); },
      "hc.carry": (s, H) => {
        const holes = cells(s, 0).filter((c) => fillOf(c) === PAPER);
        cells(s, 1).filter((c) => fillOf(c) === ADDED)
          .forEach((m, i) => H.slide(m, holes[i], 0.4 + i * 0.75, 0.7));
      },
      "k1.cut": (s, H) => drawBar(s, H, { gap: 0.12 }),
      "k2.cut": (s, H) => drawBar(s, H, { gap: 0.12 }),
      "k3.draw": (s, H) => drawBar(s, H, { gap: 0.09 }),
      "k4.take": (s, H) => takeBar(s, H, { at: 0.5, gap: 0.34 }),
      "k5.draw": (s, H) => drawBar(s, H, { gap: 0.14 }),
    },
    steps: ({ push, look }) => {
      push("A mixed number is a whole thing and a bit of another one, and that is all it is — one and a half "
        + "kilometres is one whole kilometre, and half of the next. The good news is that the wholes and the "
        + "bits never get in each other way, so you deal with them separately. Wholes first, because they are "
        + "the easy part: one and two make three whole kilometres.",
        { on: ["a1", "w1", "w2"], look: look.tile("w2"), lookAt: { delay: 1.8, hold: 2.0, to: 1.25 } });

      push("Now the bits, and here they are on two bars: half of a kilometre, and a third of a kilometre. You "
        + "have met this already — the parts do not match, so there is nothing to count yet. Halves and thirds "
        + "both go into sixths, so sixths it is.",
        { on: ["hh", "n1", "n2", "w3"], add: ["hh.draw"] });

      push("Cut both, in orange so you can see which cuts are mine. The half is three sixths; the third is two "
        + "sixths; and not one scrap of colour moved while I did it. Now the parts match, so now the pieces can "
        + "travel.",
        { on: ["hc", "n3", "n4"], off: ["hh", "n1", "n2"], add: ["hc.cut"] });

      push("Watch the two green sixths travel up and settle into the gaps on the first bar. There, and there. Count "
        + "the top bar now: five sixths of a kilometre. On top of the three whole kilometres we already had, so "
        + "Rosa has walked three and five sixths kilometres. Put the two halves of the answer together at the "
        + "very end, never in the middle.",
        { on: ["n5", "w4", "w5"], off: ["n3", "n4"], add: ["hc.carry"] });

      push("Second question, and this is the one with teeth in it. Three and a quarter litres, with one and two "
        + "thirds poured out. Quarters and thirds, so twelfths again: a quarter is three twelfths, two thirds is "
        + "eight twelfths. Draw them both and then look at what is being asked.",
        { on: ["a2", "k1", "k2", "m1", "m2", "x1"],
          off: ["a1", "hc", "n5", "w1", "w2", "w3", "w4", "w5"], add: ["k1.cut", "k2.cut"] });

      push("I am being asked to take eight twelfths away from three twelfths. Look at the two bars — there is "
        + "not enough coloured on the top one. You cannot pour eight little measures out of a jug that has three "
        + "in it. This is exactly where people write the answer upside down and take the three from the eight "
        + "instead, so stop here and name the problem: not enough.",
        { on: ["x2"], look: look.tile("x2"), lookAt: { lit: true, delay: 1.6, hold: 2.4 } });

      push("So we BORROW, and on a bar you can see what borrowing actually is. There are three whole litres "
        + "standing there as well. Take ONE of them and cut it into twelfths — the same twelfths, because a "
        + "whole thing is twelve twelfths of itself. Watch it come in and be cut.",
        { on: ["k3", "m3", "x3"], add: ["k3.draw"] });

      push("Now count what we have got to take from: twelve twelfths in the borrowed bar and three twelfths in "
        + "the other one. Fifteen twelfths. And the wholes have gone down from three to two, because one of them "
        + "has been cut up and is sitting there in pieces.",
        { on: ["x4"] });

      push("Now the taking away, and I am going to do it one at a time so you can count with me. Out goes one "
        + "twelfth. Two. Three. Four, five, six, seven, eight. Four twelfths left in the borrowed bar, and the "
        + "three twelfths we had all along, which makes seven twelfths. And the wholes: two left, less the one "
        + "that was poured out, is one.",
        { on: ["k4", "x5"], off: ["k3", "m3"], add: ["k4.take"] });

      push("So one and seven twelfths litres are left in the jug. Check that it is sensible before you write it "
        + "down: we poured out a bit less than two litres from a bit more than three, so a bit more than one "
        + "should be left. It is. That check costs you five seconds and catches the upside-down answer every "
        + "time.",
        { on: ["k5", "m4", "x6"], off: ["k1", "k2", "k4", "m1", "m2"], add: ["k5.draw"] });

      push("Mixed numbers, then. Wholes with wholes and parts with parts. Cut the parts until they match, the "
        + "way you always do, and carry the pieces across. And if there are not enough parts to take away from, "
        + "borrow one whole and cut it up — it is not a trick, it is one of the bars going into pieces so that "
        + "the pieces can be counted.",
        { play: (S, H, stage) => runLit(H, stage, ["x3", "x4", "x5", "x6"]) });
    },
  });
}
