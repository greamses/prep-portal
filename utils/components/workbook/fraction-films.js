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

     like         the parts already match, so adding is COUNTING them
     equivalents  cutting every part the same way changes what the parts are
                  CALLED and not how much is coloured
     unlike       cut both bars until the parts match, then count
     mixed        whole bars and part bars, and the borrow is one whole bar
                  being cut up

   They are built with the same kit as the bar films (./film-kit.js), so the
   stage, the hand that draws, the question band and the step machinery are
   shared and cannot drift apart.
   ========================================================================== */

import { barSvg } from "./fracbar.js";
import { film, mb, runLit } from "./film-kit.js";

/* the three colours the paper shades a part with, so the film and the
   printed page cannot disagree about what "coloured" looks like */
const SHADE = "#bfe3ff";
const PAPER = "#fffdf8";
const TAKEN = "#f0ece4";

/** The parts of one bar, in order along it. */
const cells = (s) => [...(s ? s.querySelectorAll('[data-mb="cell"]') : [])];
/** The frame of the bar — the thing that grows when the bar is drawn. */
const frame = (s) => mb(s, "bar")[0];

/**
 * DRAW A BAR: the frame grows, its parts appear as an empty row of boxes, and
 * only then does the colour go in, one part at a time. That order is the
 * lesson — the bar is cut first and coloured second, which is exactly what
 * the top and bottom numbers mean, in that order.
 */
const drawBar = (s, H, { at = 0, gap = 0.22, from = PAPER } = {}) => {
  H.grow(frame(s), at);
  const list = cells(s);
  const colour = list.filter((c) => c.getAttribute("fill") !== PAPER);
  list.filter((c) => c.getAttribute("fill") === PAPER).forEach((c) => H.show(c));
  colour.forEach((c, i) => H.tint(c, from, at + 0.55 + i * gap));
  return list;
};

/**
 * A BAR BEING CUT: the colour is already on it and does not move. The old
 * divisions stand first, because they are the bar you had; then the new parts
 * are drawn along it, left to right, which is what cutting looks like.
 */
const cutBar = (s, H, gap = 0.18) => {
  H.grow(frame(s), 0);
  s.querySelectorAll('[data-mb="cut"]').forEach((n) => H.show(n));
  cells(s).forEach((c, i) => H.grow(c, 0.3 + i * gap));
};

/**
 * A BAR BEING TAKEN FROM. The parts that go do not vanish, they go pale where
 * they stand: a child taking four tenths off seven has to be able to see that
 * they were there, or the bar is the answer rather than the working.
 */
const takeBar = (s, H, at = 0.9, gap = 0.16) => {
  H.grow(frame(s), 0);
  const list = cells(s);
  list.filter((c) => c.getAttribute("fill") === PAPER).forEach((c) => H.show(c));
  list.filter((c) => c.getAttribute("fill") === SHADE).forEach((c) => H.tint(c, PAPER, 0.4));
  list.filter((c) => c.getAttribute("fill") === TAKEN).forEach((c, i) => H.tint(c, SHADE, at + i * gap));
};

/* A fraction film is drawn on a narrower paper than a bar model: one bar is
   76mm, so measuring it against the 150mm sheet would leave it a third of
   the screen wide and the parts too small to count. */
const PAPER_MM = 80, PIC_W = 44;
/* where the bars hang: left edge, and the top of each one */
const X = 13;

/* ═══ 1 · ADDING AND TAKING AWAY WHEN THE PARTS MATCH ══════════════════════*/

export function fracLike() {
  const A1 = 2, A2 = 3, D1 = 8;            // 2/8 + 3/8 = 5/8
  const B1 = 7, B2 = 4, D2 = 10;           // 7/10 − 4/10 = 3/10
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
      p2: () => barSvg({ num: A2, den: D1, label: `${A2} eighths` }),
      p3: () => barSvg({ num: A1 + A2, den: D1, label: `${A1 + A2} eighths` }),
      q1: () => barSvg({ num: B1, den: D2, label: `${B1} tenths` }),
      q2: () => barSvg({ num: B1, den: D2, gone: B2, label: `${B1 - B2} tenths left` }),
    },
    picAt: {
      p1: { x: X, y: 18 }, p2: { x: X, y: 27 }, p3: { x: X, y: 40 },
      q1: { x: X, y: 20 }, q2: { x: X, y: 33 },
    },
    lines: [
      { id: "n1", text: `${A1}/${D1}`, x: 4, y: 19.4, c: 0, size: 2.8 },
      { id: "n2", text: `${A2}/${D1}`, x: 4, y: 28.4, c: 0, size: 2.8 },
      { id: "n3", text: `${A1 + A2}/${D1}`, x: 4, y: 41.4, c: 2, size: 2.8 },
      { id: "m1", text: `${B1}/${D2}`, x: 4, y: 21.4, c: 0, size: 2.8 },
      { id: "m2", text: `${B1 - B2}/${D2}`, x: 4, y: 34.4, c: 2, size: 2.8 },
      { id: "w1", text: "The parts are the SAME size", y: 12, c: 1, size: 2.2 },
      { id: "w2", text: `${A1} + ${A2} = ${A1 + A2} parts`, y: 20, c: 0, size: 2.5 },
      { id: "w3", text: `${A1}/${D1} + ${A2}/${D1} = ${A1 + A2}/${D1}`, y: 28, c: 2, size: 2.6 },
      { id: "w4", text: "The bottom NEVER moves", y: 36, c: 3, size: 2.2 },
      { id: "x1", text: `${B1} − ${B2} = ${B1 - B2} parts`, y: 20, c: 0, size: 2.5 },
      { id: "x2", text: `${B1}/${D2} − ${B2}/${D2} = ${B1 - B2}/${D2}`, y: 28, c: 2, size: 2.6 },
    ],
    stages: {
      "p1.draw": (s, H) => drawBar(s, H),
      "p2.draw": (s, H) => drawBar(s, H),
      "p3.draw": (s, H) => drawBar(s, H, { gap: 0.3 }),
      "q1.draw": (s, H) => drawBar(s, H),
      /* the same seven parts, four of them losing their colour where they
         stand — the taking away happens ON the bar */
      "q2.draw": (s, H) => takeBar(s, H, 1.1, 0.4),
    },
    steps: ({ push, look }) => {
      push("Fractions are the first place in arithmetic where the obvious move is the wrong one, so we are going "
        + "to do the whole of this on a bar, where you can see it. Read the question. Rosa eats two eighths of a "
        + "pizza. Here is the pizza as a bar: cut into EIGHT equal parts, because the bottom number is eight, and "
        + "two of them coloured, because the top number is two.",
        { on: ["a1", "p1", "n1"], add: ["p1.draw"] });

      push("Then she eats three eighths more. Same pizza, same size of part — look at the two bars, the parts "
        + "line up exactly. That is the whole reason this question is an easy one, and I want you to notice it "
        + "NOW, while it is true, because the next film is about what happens when it is not.",
        { on: ["p2", "n2", "w1"], add: ["p2.draw"],
          look: look.tile("w1"), lookAt: { delay: 1.8, hold: 2.2, to: 1.2 } });

      push("So put them together. Two coloured parts, and three coloured parts, all of them eighths — count "
        + "them. One, two, three, four, five. Five parts coloured out of eight: five eighths. You did not do "
        + "anything clever there, you counted, and counting is all adding ever was.",
        { on: ["p3", "n3", "w2"], add: ["p3.draw"] });

      push("Now look hard at the bottom number, because this is where the marks go missing. It was eight before "
        + "and it is eight after. It did not become sixteen. The bottom number is not a thing you are counting — "
        + "it is the NAME of the part, it tells you how big one piece is, and putting two pieces together never "
        + "changed the size of a piece.",
        { on: ["w3", "w4"], look: look.tile("w4"), lookAt: { lit: true, delay: 1.4, hold: 2.4 } });

      push("Taking away is the same bar read backwards. The jug holds seven tenths, so: ten equal parts, seven "
        + "of them coloured. Ada pours out four tenths. Watch what happens to the bar rather than to the "
        + "numbers.",
        { on: ["a2", "q1", "m1"], off: ["a1", "p1", "p2", "p3", "n1", "n2", "n3", "w1", "w2", "w3"],
          add: ["q1.draw"] });

      push("Four of the coloured parts go pale — poured out, gone. Count what is still coloured: three. Three "
        + "tenths left in the jug. And the bottom number has not moved again: tenths went out and tenths are "
        + "left, because you cannot pour tenths out of a jug and have eighths left behind.",
        { on: ["q2", "m2", "x1"], add: ["q2.draw"],
          look: look.tile("x1"), lookAt: { delay: 2.2, hold: 2.0, to: 1.25 } });

      push(`So, when the parts already match: count the coloured parts, add or take away as the story says, and `
        + `copy the bottom number down underneath. ${B1} tenths less ${B2} tenths is ${B1 - B2} tenths. The one `
        + "thing you must never do is add the bottoms — and if you are ever tempted, draw the bar and the "
        + "temptation goes away on its own.",
        { on: ["x2", "w4"], play: (S, H, stage) => runLit(H, stage, ["x1", "x2", "w4"]) });
    },
  });
}

/* ═══ 2 · THE SAME FRACTION, ANOTHER NAME ══════════════════════════════════*/

export function fracEqual() {
  const K = 3;                               // every part cut into three
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
    picAt: { e1: { x: X, y: 19 }, e2: { x: X, y: 31 }, e3: { x: X, y: 19 }, e4: { x: X, y: 31 } },
    lines: [
      { id: "n1", text: "1/2", x: 4, y: 20.4, c: 0, size: 2.8 },
      { id: "n2", text: "3/6", x: 4, y: 32.4, c: 2, size: 2.8 },
      { id: "n3", text: "2/3", x: 4, y: 20.4, c: 0, size: 2.8 },
      { id: "n4", text: "6/9", x: 4, y: 32.4, c: 2, size: 2.8 },
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
      /* THE COLOUR IS ALREADY THERE AND ONLY THE CUTS ARE NEW. This bar is
         the one above it after cutting, so the shading does not arrive — it
         was never away. What is new is the lines. */
      "e2.cut": (s, H) => cutBar(s, H, 0.12),
      "e4.cut": (s, H) => cutBar(s, H, 0.1),
    },
    steps: ({ push, look }) => {
      push("This one is the key to the next film, so stay with it even though it looks as though nothing "
        + "is happening. Rosa says a half and three sixths are the same amount. Here is the half: a bar "
        + "cut into two, one part coloured. We are going to find out whether she is right by doing "
        + "something to the bar that cannot possibly change how much of it is coloured.",
        { on: ["a1", "e1", "n1"], add: ["e1.draw"] });

      push("I am going to CUT every part into three. Not just the coloured one — every part, the same way, "
        + "right along the bar. Watch the colour while I do it. Did any of it move? Did any arrive, or go "
        + "away? No. Exactly as much of that bar is blue after the cutting as before it, because cutting "
        + "has never once changed how much there is.",
        { on: ["e2", "w1"], add: ["e2.cut"],
          look: look.tile("w1"), lookAt: { delay: 2.0, hold: 2.2, to: 1.2 } });

      push("But what it is CALLED has changed. Count the parts now: six. Count the coloured ones: three. "
        + "Three parts coloured out of six — three sixths. Same bar, same colour, new name. So Rosa is "
        + "right, and the bar is the reason, not a rule somebody told her.",
        { on: ["n2", "w2"], look: look.tile("n2"), lookAt: { delay: 1.4, hold: 2.0, to: 1.3 } });

      push("Here is what that looks like in the numbers, and the numbers only say what you have just "
        + "watched. Every part became three parts, so the bottom was multiplied by three: two sixes. And "
        + "the one coloured part became three coloured parts, so the top was multiplied by three as well. "
        + "The SAME three, top and bottom — because it was one cut, done to the whole bar.",
        { on: ["w3", "w4", "w5"] });

      push("Second question, same move, different numbers. Two thirds of a cup, wanted in ninths. Draw the "
        + "two thirds: a bar cut into three, two of them coloured. Then ask yourself the only question "
        + "that matters here — what do I cut each part into to turn thirds into ninths? Three, because "
        + "three threes are nine.",
        { on: ["a2", "e3", "n3"], off: ["a1", "e1", "e2", "n1", "n2", "w1", "w2", "w3", "w4", "w5"],
          add: ["e3.draw"] });

      push("So cut each third into three. Nine parts now, and the colour has not shifted an inch — it "
        + "never does. Count the coloured ones: six. Two thirds IS six ninths, so she needs six of the "
        + "little measures. Top times three, bottom times three, and the bar is what says so.",
        { on: ["e4", "n4", "x1", "x2", "x3"], add: ["e4.cut"],
          look: look.tile("x3"), lookAt: { delay: 2.4, hold: 2.0, to: 1.3 } });

      push("One fraction, any number of names — a half is also two quarters, three sixths, five tenths, as "
        + "far as you care to cut. That is not a curiosity, it is a TOOL: in the next film there are two "
        + "bars whose parts do not match, and the only way to add them is to rename one of them, or both, "
        + "until they do.",
        { play: (S, H, stage) => runLit(H, stage, ["x1", "x2", "x3"]) });
    },
  });
}

/* ═══ 3 · WHEN THE PARTS DO NOT MATCH ══════════════════════════════════════*/

export function fracUnlike() {
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
      u1: () => barSvg({ num: 1, den: 2, label: "one half" }),
      u2: () => barSvg({ num: 1, den: 3, label: "one third" }),
      u3: () => barSvg({ num: 3, den: 6, was: 2, label: "three sixths" }),
      u4: () => barSvg({ num: 2, den: 6, was: 3, label: "two sixths" }),
      u5: () => barSvg({ num: 5, den: 6, label: "five sixths" }),
      v1: () => barSvg({ num: 9, den: 12, was: 4, label: "nine twelfths" }),
      v2: () => barSvg({ num: 8, den: 12, was: 3, label: "eight twelfths" }),
      v3: () => barSvg({ num: 9, den: 12, gone: 8, label: "one twelfth left" }),
    },
    picAt: {
      u1: { x: X, y: 18 }, u2: { x: X, y: 27 }, u3: { x: X, y: 18 }, u4: { x: X, y: 27 },
      u5: { x: X, y: 40 }, v1: { x: X, y: 18 }, v2: { x: X, y: 27 }, v3: { x: X, y: 40 },
    },
    lines: [
      { id: "n1", text: "1/2", x: 4, y: 19.4, c: 0, size: 2.8 },
      { id: "n2", text: "1/3", x: 4, y: 28.4, c: 0, size: 2.8 },
      { id: "n3", text: "3/6", x: 4, y: 19.4, c: 2, size: 2.8 },
      { id: "n4", text: "2/6", x: 4, y: 28.4, c: 2, size: 2.8 },
      { id: "n5", text: "5/6", x: 4, y: 41.4, c: 3, size: 2.8 },
      { id: "m1", text: "9/12", x: 3, y: 19.4, c: 2, size: 2.6 },
      { id: "m2", text: "8/12", x: 3, y: 28.4, c: 2, size: 2.6 },
      { id: "m3", text: "1/12", x: 3, y: 41.4, c: 3, size: 2.6 },
      { id: "w1", text: "Parts of different SIZES", y: 12, c: 1, size: 2.2 },
      { id: "w2", text: "Cut both until they match", y: 19.5, c: 1, size: 2.2 },
      { id: "w3", text: "halves × 3, thirds × 2", y: 27, c: 0, size: 2.3 },
      { id: "w4", text: "3/6 + 2/6 = 5/6", y: 35, c: 2, size: 2.6 },
      { id: "x1", text: "quarters × 3, thirds × 4", y: 27, c: 0, size: 2.3 },
      { id: "x2", text: "9/12 − 8/12 = 1/12", y: 35, c: 2, size: 2.5 },
    ],
    stages: {
      "u1.draw": (s, H) => drawBar(s, H),
      "u2.draw": (s, H) => drawBar(s, H),
      "u3.cut": (s, H) => cutBar(s, H, 0.25),
      "u4.cut": (s, H) => cutBar(s, H, 0.25),
      "u5.draw": (s, H) => drawBar(s, H, { gap: 0.26 }),
      "v1.cut": (s, H) => drawBar(s, H, { gap: 0.12 }),
      "v2.cut": (s, H) => drawBar(s, H, { gap: 0.12 }),
      "v3.take": (s, H) => takeBar(s, H),
    },
    steps: ({ push, look }) => {
      push("Now the one everybody gets wrong, and I want to show you WHY it is wrong before I show you "
        + "what to do instead. Rosa eats half a bar. Kate eats a third of a bar the same size. Here they "
        + "are, one under the other, drawn the same length — because the two bars were the same size to "
        + "begin with, and that is the only reason this question makes sense at all.",
        { on: ["a1", "u1", "u2", "n1", "n2"], add: ["u1.draw", "u2.draw"] });

      push("Look at the two coloured pieces. They are not the same size. One is half a bar and one is a "
        + "third, and a third is smaller. So if I try to count them — one piece and one piece makes two "
        + "pieces — two of WHAT? There is no such thing as two of a piece that keeps changing size. That "
        + "is the whole trouble, and it is why adding the tops and the bottoms gives nonsense.",
        { on: ["w1"], look: look.tile("w1"), lookAt: { lit: true, delay: 2.0, hold: 2.4 } });

      push("So we do the thing from the last film. Cut both bars until their parts match. Halves cut into "
        + "three are sixths. Thirds cut into two are sixths. Watch both bars being cut — and watch the "
        + "colour, which does not move on either of them, because cutting never changes how much there "
        + "is.",
        { on: ["u3", "u4", "n3", "n4", "w2", "w3"], off: ["u1", "u2", "n1", "n2"],
          add: ["u3.cut", "u4.cut"] });

      push("Now look at them. Every part on the top bar is exactly the size of every part on the bottom "
        + "one. The half has become three sixths; the third has become two sixths. Nobody ate any more "
        + "chocolate while I did that — we renamed it, and that is all.",
        { look: look.tile("n3"), lookAt: { delay: 1.2, hold: 2.0, to: 1.3 } });

      push("And NOW it is the easy sum from the first film, because the parts match. Three sixths and two "
        + "sixths: count them. Five sixths between them. The bottom number stays at six, because six is "
        + "the name of the piece, and all we did was put pieces together.",
        { on: ["u5", "n5", "w4"], off: ["u3", "u4", "n3", "n4"], add: ["u5.draw"] });

      push("Second question, and taking away goes the same way round. Three quarters of a metre, with two "
        + "thirds cut off it. Quarters and thirds do not match either — so what do both of them cut into? "
        + "Twelfths: quarters cut into three, thirds cut into four. Here they are, both already cut, and "
        + "you can see the old quarter and third lines underneath.",
        { on: ["a2", "v1", "v2", "m1", "m2", "x1"],
          off: ["a1", "u5", "n5", "w1", "w2", "w3", "w4"], add: ["v1.cut", "v2.cut"] });

      push("Three quarters is nine twelfths. Two thirds is eight twelfths. And nine twelfths with eight "
        + "twelfths taken off leaves one twelfth — watch the eight go pale, and count what is still "
        + "coloured. One little piece. So the offcut is a twelfth of a metre, which is about eight "
        + "centimetres, and that is a believable length for the end of a plank.",
        { on: ["v3", "m3", "x2"], off: ["v1", "v2", "m1", "m2"], add: ["v3.take"] });

      push("So the whole of it is three moves, and only the middle one is new. Look at the parts: if they "
        + "do not match, you cannot count them. Cut both bars until they do — the smallest number both "
        + "bottoms go into. Then count the parts and keep the bottom number. Never add the bottoms: the "
        + "bottom is a NAME, and adding two names together gets you nothing at all.",
        { play: (S, H, stage) => runLit(H, stage, ["x1", "x2"]) });
    },
  });
}

/* ═══ 4 · MIXED NUMBERS, WHEN THE PARTS DO NOT MATCH ═══════════════════════*/

export function fracMixed() {
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
      /* the fraction halves of the first question, cut to sixths */
      h1: () => barSvg({ num: 1, den: 2, label: "one half" }),
      h2: () => barSvg({ num: 1, den: 3, label: "one third" }),
      h3: () => barSvg({ num: 3, den: 6, was: 2, label: "three sixths" }),
      h4: () => barSvg({ num: 2, den: 6, was: 3, label: "two sixths" }),
      h5: () => barSvg({ num: 5, den: 6, label: "five sixths" }),
      /* and the second, where there is not enough to take away from */
      k1: () => barSvg({ num: 3, den: 12, was: 4, label: "three twelfths" }),
      k2: () => barSvg({ num: 8, den: 12, was: 3, label: "eight twelfths" }),
      /* ONE WHOLE BAR, BORROWED and cut into twelfths like the rest */
      k3: () => barSvg({ num: 12, den: 12, label: "one whole, in twelfths" }),
      k4: () => barSvg({ num: 12, den: 12, gone: 8, label: "eight twelfths taken" }),
      k5: () => barSvg({ num: 7, den: 12, label: "seven twelfths left" }),
    },
    picAt: {
      h1: { x: X, y: 20 }, h2: { x: X, y: 29 }, h3: { x: X, y: 20 }, h4: { x: X, y: 29 },
      h5: { x: X, y: 41 },
      k1: { x: X, y: 29 }, k2: { x: X, y: 38 }, k3: { x: X, y: 20 }, k4: { x: X, y: 20 },
      k5: { x: X, y: 41 },
    },
    lines: [
      { id: "n1", text: "1/2", x: 4, y: 21.4, c: 0, size: 2.8 },
      { id: "n2", text: "1/3", x: 4, y: 30.4, c: 0, size: 2.8 },
      { id: "n3", text: "3/6", x: 4, y: 21.4, c: 2, size: 2.8 },
      { id: "n4", text: "2/6", x: 4, y: 30.4, c: 2, size: 2.8 },
      { id: "n5", text: "5/6", x: 4, y: 42.4, c: 3, size: 2.8 },
      { id: "m1", text: "3/12", x: 3, y: 30.4, c: 2, size: 2.5 },
      { id: "m2", text: "8/12", x: 3, y: 39.4, c: 1, size: 2.5 },
      { id: "m3", text: "12/12", x: 2.5, y: 21.4, c: 0, size: 2.4 },
      { id: "m4", text: "7/12", x: 3, y: 42.4, c: 3, size: 2.6 },
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
      "h1.draw": (s, H) => drawBar(s, H),
      "h2.draw": (s, H) => drawBar(s, H),
      "h3.cut": (s, H) => cutBar(s, H, 0.25),
      "h4.cut": (s, H) => cutBar(s, H, 0.25),
      "h5.draw": (s, H) => drawBar(s, H, { gap: 0.26 }),
      "k1.cut": (s, H) => drawBar(s, H, { gap: 0.12 }),
      "k2.cut": (s, H) => drawBar(s, H, { gap: 0.12 }),
      "k3.draw": (s, H) => drawBar(s, H, { gap: 0.09 }),
      "k4.take": (s, H) => takeBar(s, H, 0.5, 0.16),
      "k5.draw": (s, H) => drawBar(s, H, { gap: 0.14 }),
    },
    steps: ({ push, look }) => {
      push("A mixed number is a whole thing and a bit of another one, and that is all it is — one and a "
        + "half kilometres is one whole kilometre, and half of the next. The good news is that the wholes "
        + "and the bits never get in each other way, so you deal with them separately. Wholes first, "
        + "because they are the easy part: one and two make three whole kilometres.",
        { on: ["a1", "w1", "w2"], look: look.tile("w2"), lookAt: { delay: 1.8, hold: 2.0, to: 1.25 } });

      push("Now the bits, and here they are drawn: half of a kilometre, and a third of a kilometre. You "
        + "have met this already — the parts do not match, so there is nothing to count yet. Halves and "
        + "thirds both go into sixths, so cut both bars into sixths.",
        { on: ["h1", "h2", "n1", "n2", "w3"], add: ["h1.draw", "h2.draw"] });

      push("Cut, and cut. The half is three sixths, the third is two sixths, and not one scrap of colour "
        + "moved while I did it. Now they match, so now they can be counted: three sixths and two sixths "
        + "is five sixths.",
        { on: ["h3", "h4", "n3", "n4"], off: ["h1", "h2", "n1", "n2"], add: ["h3.cut", "h4.cut"] });

      push("Five sixths of a kilometre, on top of the three whole kilometres we already had. So Rosa has "
        + "walked three and five sixths kilometres. Put the two halves of the answer back together at the "
        + "very end, never in the middle — the wholes were counted with wholes and the parts with parts, "
        + "and that is what keeps it straight.",
        { on: ["h5", "n5", "w4", "w5"], off: ["h3", "h4", "n3", "n4"], add: ["h5.draw"],
          look: look.tile("w5"), lookAt: { delay: 2.0, hold: 2.2, to: 1.3 } });

      push("Second question, and this is the one with teeth in it. Three and a quarter litres, with one "
        + "and two thirds poured out. Quarters and thirds, so twelfths again: a quarter is three twelfths, "
        + "two thirds is eight twelfths. Draw them both and then look at what is being asked.",
        { on: ["a2", "k1", "k2", "m1", "m2", "x1"],
          off: ["a1", "h5", "n5", "w1", "w2", "w3", "w4", "w5"], add: ["k1.cut", "k2.cut"] });

      push("I am being asked to take eight twelfths away from three twelfths. Look at the two bars — there "
        + "is not enough coloured on the top one. You cannot pour eight little measures out of a jug that "
        + "has three in it. This is exactly the place where people write the answer upside down and take "
        + "the three from the eight instead, so stop here and name the problem: not enough.",
        { on: ["x2"], look: look.tile("x2"), lookAt: { lit: true, delay: 1.6, hold: 2.4 } });

      push("So we BORROW, and on a bar you can see what borrowing actually is. There are three whole "
        + "litres standing there as well. Take ONE of them and cut it into twelfths — the same twelfths, "
        + "because a whole thing is twelve twelfths of itself. Watch it come in and be cut.",
        { on: ["k3", "m3", "x3"], add: ["k3.draw"] });

      push("Now count what we have got to take from: twelve twelfths in the borrowed bar and three "
        + "twelfths in the other one. Fifteen twelfths. And the wholes have gone down from three to two, "
        + "because one of them has been cut up and is sitting there in pieces.",
        { on: ["x4"] });

      push("Now the taking away can happen. Eight twelfths out of the borrowed bar — watch them go pale. "
        + "Four twelfths left in it, and the three twelfths we had all along, which makes seven twelfths. "
        + "And the wholes: two left, less the one that was poured out, is one.",
        /* the 12/12 label goes with it: that bar is not twelve twelfths any
           more, it is the four that are left */
        { on: ["k4", "x5"], off: ["k3", "m3"], add: ["k4.take"] });

      push("So one and seven twelfths litres are left in the jug. Check that it is sensible before you "
        + "write it down: we poured out a bit less than two litres from a bit more than three, so a bit "
        + "more than one should be left. It is. That check costs you five seconds and catches the "
        + "upside-down answer every time.",
        { on: ["k5", "m4", "x6"], off: ["k1", "k2", "k4", "m1", "m2"], add: ["k5.draw"] });

      push("Mixed numbers, then. Wholes with wholes and parts with parts. Cut the parts until they match, "
        + "the way you always do. And if there are not enough parts to take away from, borrow one whole "
        + "and cut it up — it is not a trick, it is one of the bars going into pieces so that the pieces "
        + "can be counted.",
        { play: (S, H, stage) => runLit(H, stage, ["x3", "x4", "x5", "x6"]) });
    },
  });
}
