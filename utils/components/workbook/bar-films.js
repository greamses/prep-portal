/* ============================================================================
   THE BAR MODEL, in five films
   ----------------------------------------------------------------------------
   Chapter 9 of the Maths Workbook is five ideas, not one, and they used to be
   one film thirty-one steps long. A child who wants to know how a fraction is
   drawn as a bar should not have to sit through the setting-up, the sharing
   and the money first — and a teacher putting one idea in front of a class
   should be able to play that idea.

     bar-setup      what a bar IS, and the rules not to miss
     bar-parts      part to part, and part to whole
     bar-missing    completing the part you were not told
     bar-money      money questions, counted out in real prepbills
     bar-fractions  a bar cut into equal parts

   Each works TWO questions through, and each writes the word problem up
   first, so the child can see what is being answered before a bar is drawn.

   The drawing kit they are built with — the stage, the hand that draws, the
   question band, the counters and the money — is ./film-kit.js, shared with
   the fraction films so that two sets of films cannot drift into two ideas of
   what a bar model looks like.
   ========================================================================== */

import { modelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";
import {
  CTR,
  PAPER_MM,
  ask,
  braceOf,
  film,
  hand,
  inBox,
  mb,
  part,
  pourInto,
  pourNotes,
  pouredIn,
  runLit,
  stackOf,
  svgIn,
} from "./film-kit.js";

/* ═══ 1 · SETTING UP A BAR MODEL ═══════════════════════════════════════════
   What a bar IS, and the four rules a child loses marks for not keeping.
   Nothing is solved in this film: it is the one that has to be watched first
   and never again.
   ------------------------------------------------------------------------*/
export function barSetup() {
  /* EXAMPLE ONE — one thing, cut in two. Rules one to four live in it. */
  const W = 48, P1 = 20, P2 = W - P1;
  /* EXAMPLE TWO — two things compared, which is the whole of rule five */
  const ADA = 30, TOM = 45, DIFF = TOM - ADA;
  return film({
    asks: [
      { id: "a1", text: `Ada has a ribbon ${W} cm long. She cuts off ${P1} cm to wrap a parcel. `
        + "How long is the piece that is left?" },
      { id: "a2", text: `Tom has ${TOM} marbles. Ada has ${ADA}. How many more marbles has Tom than Ada?` },
    ],
    pics: {
      /* the whole bar carries the same brace underneath as the cut one, never
         shown — only reserving the room, so the bar does not hop up the screen
         when the cut comes */
      pw: () => modelSvg([{ parts: [part(String(W), W, "a")],
        below: [{ from: 0, to: 1, text: String(W) }] }], { label: "One bar" }),
      pc: () => modelSvg([{ parts: [part(String(P1), P1, "a"), ask(P2, "q")], says: String(W) }],
        { label: "A bar cut in two" }),
      /* two rows, to show the one rule a picture can break silently */
      ps: () => modelSvg([
        { name: "Ada", parts: [part(String(ADA), ADA, "a")] },
        { name: "Tom", parts: [part(String(ADA), ADA, "a"), ask(DIFF, "q")], says: String(TOM) },
      ], { label: "Two bars on one ruler" }),
    },
    lines: [
      { id: "r1", text: "1 · A bar is a THING", y: 12, c: 1, size: 2.2 },
      { id: "r2", text: "2 · Parts together ARE the whole", y: 19.6, c: 1, size: 2.2 },
      { id: "r3", text: "3 · A total is a BRACE", y: 27.2, c: 1, size: 2.2 },
      { id: "r4", text: "4 · Not told → a ? box, to size", y: 34.8, c: 1, size: 2.2 },
      { id: "r5", text: "5 · Compared bars, ONE ruler", y: 42.4, c: 1, size: 2.2 },
      /* the answers stand under the drawing, clear of the five rules */
      { id: "s1", text: `${W} − ${P1} = ${P2} cm`, x: 14, y: 34, c: 0, size: 2.8 },
      { id: "s2", text: `${TOM} − ${ADA} = ${DIFF} marbles`, x: 14, y: 40, c: 0, size: 2.8 },
    ],
    stages: {
      "pw.bar": (s, H) => H.grow(mb(s, "bar")[0]),
      "pw.num": (s, H) => H.write(mb(s, "num")[0]),
      "pw.cut": (s, H, stage) => {
        const bar = mb(s, "bar")[0];
        const at = mb(svgIn(stage, "pc"), "bar")[1];
        if (bar && at) H.cut(s, Number(at.getAttribute("x")), Number(bar.getAttribute("y")), Number(bar.getAttribute("height")));
      },
      "pc.cut": (s, H) => {
        const [b0, b1] = mb(s, "bar");
        H.show(b0); H.mark(b0, 0.1);
        H.show(b1); H.tint(b1, b0.getAttribute("fill"), 0.6);
      },
      "pc.first": (s, H) => H.write(mb(s, "num")[0], 0.25),
      "pc.ask": (s, H) => H.write(mb(s, "num")[1], 0.3),
      "pc.total": (s, H) => H.draw(braceOf(s, "below-0-0"), 0.25),
      "pc.ans": (s, H) => H.flip(mb(s, "num")[1], String(P2), 0.4),
      "ps.bars": (s, H) => {
        mb(s, "name").forEach((n, i) => H.write(n, i * 0.5));
        H.grow(mb(s, "bar", 0)[0], 0.3);
        H.write(mb(s, "num", 0)[0], 0.9);
        H.grow(mb(s, "bar", 1)[0], 0.9);
        H.write(mb(s, "num", 1)[0], 1.5);
      },
      "ps.extra": (s, H) => {
        H.grow(mb(s, "bar", 1)[1], 0.2);
        H.write(mb(s, "num", 1)[1], 0.8);
        H.draw(braceOf(s, "below-1-0"), 1.3);
      },
      "ps.ans": (s, H) => H.flip(mb(s, "num", 1)[1], String(DIFF), 0.4),
    },
    steps: ({ push, look }) => {
      push("Right then. Before anybody solves anything, we are going to set one of these up properly, "
        + "because almost every mark lost on a bar model is lost in the drawing and not in the sum. Read "
        + "the question at the top first — a ribbon, forty-eight centimetres of it, and a piece cut off. "
        + "Rule one. A BAR is a thing you have got, and the LENGTH of it is how much of it there is.",
        { on: ["a1", "pw", "r1"], add: ["pw.bar"] });

      push(`So this bar is the ribbon, and it is ${W}. Look where the ${W} goes: INSIDE the bar, because `
        + `the bar IS the forty-eight. They are not two separate things sitting next to each other. Long `
        + "bar, a lot. Short bar, a little. You can see which is bigger without counting anything, and "
        + "that is the whole reason we draw them.",
        { add: ["pw.num"], look: look.mark("pw", "num"), lookAt: { delay: 0.9, hold: 1.8, to: 1.35 } });

      push("Rule two, and it is the one everything else rests on. She cuts the ribbon — watch me cut it. "
        + "There. Now: has the amount of ribbon changed? It has not. Not a bit of it. Cutting a bar never "
        + "changes how much there is, so the parts together ARE the whole. Say that back to yourself, "
        + "because every question in this chapter is that sentence wearing a different hat.",
        { on: ["r2"], add: ["pw.cut"] });

      push(`Two pieces now, and I give the second its own colour so you can tell at a glance that they are `
        + `two things. The piece she cut off for the parcel is the one we were told about: ${P1} `
        + "centimetres, written inside its own box.",
        { on: ["pc"], off: ["pw"], add: ["pc.cut", "pc.first"] });

      push("Rule four, and this is where the drawing starts doing the thinking for you. The other piece we "
        + "were NOT told. So I do not leave the box empty and I do not guess — I put a question mark in "
        + "it, and I still draw the box the RIGHT size. Honestly, half of getting these right is being "
        + "willing to draw a box you cannot label yet.",
        { on: ["r4"], add: ["pc.ask"], look: look.mark("pc", "num", 1), lookAt: { delay: 1.0, hold: 2.2, to: 1.45 } });

      push("Rule three, and this is the one people get wrong most. The forty-eight does NOT go in a space "
        + "beside the bar. It goes on a curly brace UNDERNEATH, stretching across exactly the bit it is "
        + "the total of. Why so fussy? Because a number sitting beside a bar does not tell you what it is "
        + "counting. The brace does. It says: all of THIS is the ribbon she started with.",
        { on: ["r3"], add: ["pc.total"], look: look.brace("pc", "below-0-0"), lookAt: { lit: true, delay: 1.2, hold: 2.4 } });

      push(`And now the picture answers the question for us. The whole ribbon is ${W}. One piece is `
        + `${P1}. The piece left over is the bit of the bar the twenty does not cover — so it is `
        + `${W} take away ${P1}, which is ${P2} centimetres. Into the box it goes, where the question `
        + "mark was standing.",
        { on: ["s1"], add: ["pc.ans"] });

      push("Second question, and it brings in the one rule a drawing can break without you noticing. Tom "
        + "and Ada, marbles, and we want the DIFFERENCE. Two people, so two bars — one above the other, "
        + "both starting at the same left-hand edge, and drawn on one ruler. Ada is thirty. Tom begins "
        + "with a box exactly the same as hers, because whatever else is true, Tom has at least what Ada "
        + "has.",
        { on: ["a2", "ps", "r5"], off: ["a1", "pc", "s1"], add: ["ps.bars"] });

      push("Then the bit of Tom that sticks out past the end of Ada's bar. That box is the ANSWER to the "
        + "question — how many more — so it gets a question mark, drawn to the size I think it is. And "
        + "the brace under Tom's row says forty-five, because his row is all of his marbles, the matching "
        + "part and the extra together.",
        { add: ["ps.extra"], look: look.mark("ps", "num", 1, 1), lookAt: { delay: 1.4, hold: 2.2, to: 1.4 } });

      push(`Now look at the picture rather than the numbers. The thirty is covered. The question mark is `
        + `what is left of Tom's forty-five once Ada's thirty is taken off it — so it is ${TOM} take away `
        + `${ADA}, which is ${DIFF}. And here is why rule five matters: if I had drawn Tom's bar any old `
        + "length, that answer box would be the wrong size, and your eyes would have believed the picture "
        + "long before your arithmetic got a word in.",
        { on: ["s2"], add: ["ps.ans"] });

      push("That is the set-up, and those five rules are worth more than any trick. Draw the bar. Cut it "
        + "where the story cuts it. Brace the total, never write it beside. Question-mark what you were "
        + "not told, at the size you think it is. And if two things are being compared, measure them "
        + "against each other. Get those right and the sums at the end are the easy part.",
        { play: (S, H, stage) => runLit(H, stage, ["r1", "r2", "r3", "r4", "r5"]) });
    },
  });
}

/* ═══ 2 · PART TO PART, AND PART TO WHOLE ══════════════════════════════════
   The two shapes a bar model comes in, named and told apart — and the sharing
   that finds one unit, done with counters dropped INTO the bars.
   ------------------------------------------------------------------------*/
export function barParts() {
  /* EXAMPLE ONE — one thing cut in two: PART TO WHOLE */
  const BEADS = 600, RED = 250, BLUE = BEADS - RED;
  /* EXAMPLE TWO — two things weighed against each other: PART TO PART */
  const W = 600, TIMES = 2, UNIT = W / (TIMES + 1);      // 200
  const A = "Ben", B = "Amy";
  return film({
    asks: [
      { id: "a1", text: `A bag holds ${BEADS} beads. ${RED} of them are red and the rest are blue. `
        + "How many beads are blue?" },
      { id: "a2", text: `${A} has ${TIMES} times as many stickers as ${B}. Together they have ${W}. `
        + "How many stickers has each of them?" },
    ],
    pics: {
      /* PART TO WHOLE: one bar cut, the whole braced under it */
      pw: () => modelSvg([{ parts: [part(String(RED), RED, "a"), ask(BLUE, "q")], says: String(BEADS) }],
        { label: "Part to whole" }),
      /* PART TO PART: two rows weighed against each other */
      pp: () => modelSvg([
        { name: B, parts: [ask(UNIT, "a")], above: [{ from: 0, to: 1, text: "1 unit" }] },
        { name: A, parts: [ask(UNIT, "c"), ask(UNIT, "c")], below: [{ from: 0, to: 2, text: "2 units" }] },
      ], { total: String(W), label: "Part to part" }),
    },
    lines: [
      { id: "p1", text: `${BEADS} − ${RED} = ${BLUE} blue`, x: 14, y: 34, c: 0, size: 2.8 },
      { id: "k0", text: `1 + ${TIMES} = ${TIMES + 1} units`, y: 12, c: 0 },
      { id: "k1", text: `${TIMES + 1} units = ${W}`, y: 19.6, c: 2 },
      { id: "k2", text: `1 unit = ${W} ÷ ${TIMES + 1} = ${UNIT}`, y: 27.2, c: 1, size: 2.4 },
      { id: "k3", text: `${B} = ${UNIT},  ${A} = ${TIMES * UNIT}`, y: 34.8, c: 3, size: 2.4 },
    ],
    stages: {
      "pw.bars": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.5));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.5));
      },
      "pw.total": (s, H) => H.draw(braceOf(s, "below-0-0"), 0.3),
      "pw.ans": (s, H) => H.flip(mb(s, "num")[1], String(BLUE), 0.4),

      "pp.amy": (s, H) => {
        H.write(mb(s, "name")[0]);
        H.grow(mb(s, "bar", 0)[0], 0.3);
        H.write(mb(s, "num", 0)[0], 0.9);
      },
      "pp.ben": (s, H) => {
        H.write(mb(s, "name")[1]);
        mb(s, "bar", 1).forEach((n, i) => H.grow(n, 0.3 + i * 0.5));
        mb(s, "num", 1).forEach((n, i) => H.write(n, 0.9 + i * 0.5));
      },
      "pp.total": (s, H) => H.draw(braceOf(s, "total"), 0.25),
      "pp.units": (s, H) => { H.draw(braceOf(s, "above-0-0"), 0.2); H.draw(braceOf(s, "below-1-0"), 0.6); },
      /* THE SHARING, inside the bars. Six hundreds dealt round the three
         boxes — one each, every time round — so the bars fill up in front of
         the child instead of a tray filling up beside them. */
      "pp.pour": (s, H) => {
        mb(s, "num").forEach((n) => { n.style.opacity = "0"; });
        const bars = [mb(s, "bar", 0)[0], ...mb(s, "bar", 1)];
        bars.forEach((bar, k) => pourInto(s, bar, [100, 100], k * 2, k));
        /* dealt ROUND: one to each box, then round again */
        const all = pouredIn(s);
        const order = [all[0], all[2], all[4], all[1], all[3], all[5]];
        order.forEach((n, i) => H.drop(n, 0.3 + i * 0.5));
      },
      /* BOX BY BOX, AND THE FIGURE IS WRITTEN AS THE COUNTERS FADE, not after
         they have gone: a box with its counters taken off and its figure not
         yet written stands empty, and an empty box is what losing the money
         looks like. Starting both at the same moment means the two hundred is
         legible before the last of the two hundreds has faded. */
      "pp.filled": (s, H) => mb(s, "num").forEach((n, i) => {
        const at = 0.3 + i * 0.5;
        H.away(inBox(s, i), at);
        H.flip(n, String(UNIT), at);
      }),
    },
    steps: ({ push, look }) => {
      push("There are only two shapes a bar model ever comes in, and knowing which one you are looking at "
        + "is most of the battle. Here is the first: PART TO WHOLE. One thing — a bag of beads — cut into "
        + "two parts. The red ones we were told about, two hundred and fifty of them, in their own box. "
        + "The blue ones we were not, so that box gets a question mark and is drawn the size I reckon it "
        + "is.",
        { on: ["a1", "pw"], add: ["pw.bars"] });

      push(`And the brace underneath gathers the whole bag together and says ${BEADS}, because that is `
        + "what the bag holds — red ones and blue ones, the lot. One bar, two parts, one brace under the "
        + "whole of it. Whenever a question is about one thing being split up, that is the shape you are "
        + "drawing.",
        { add: ["pw.total"], look: look.brace("pw", "below-0-0"), lookAt: { lit: true, delay: 1.0, hold: 2.2 } });

      push(`Now read the answer off the picture rather than hunting for a sum. The whole bag is ${BEADS}. `
        + `The red box covers ${RED} of it. So the blue box is whatever the red one does not cover: `
        + `${BEADS} take away ${RED}, which is ${BLUE}. If you ever catch yourself adding here, look at `
        + "the bar again — a part cannot be bigger than the whole it came out of.",
        { on: ["p1"], add: ["pw.ans"], look: look.tile("p1"), lookAt: { delay: 1.2, hold: 2.0, to: 1.25 } });

      push("And here is the second shape: PART TO PART. Not one thing cut up — two DIFFERENT things, "
        + "weighed against each other. Ben and Amy and their stickers. Always start with the SMALLER one, "
        + "and Amy has fewest, so Amy is ONE unit: one box, and every other box on this screen is going "
        + "to be that same size.",
        { on: ["a2", "pp"], off: ["a1", "pw", "p1"], add: ["pp.amy"] });

      push(`Ben has ${TIMES} times as many, so Ben gets ${TIMES} boxes — the SAME box, twice, drawn one `
        + "after the other. Not one long bar. Two boxes, because the two-ness is the thing you are being "
        + "told, and a single long bar hides it. This is where the drawing is already doing arithmetic "
        + "for you, and you have not written a sum yet.",
        { add: ["pp.ben"] });

      push(`The two of them together have ${W}, so the brace comes down the side of BOTH rows — one `
        + "brace, both people, because the six hundred is the pair of them and not either one. And now "
        + "count the boxes on the screen. One for Amy, two for Ben: three boxes, all the same size. "
        + "Three units.",
        { on: ["k0"], add: ["pp.total", "pp.units"] });

      push(`Those three units ARE the ${W}, so one unit is six hundred shared into three. Now, you may be `
        + "able to say that straight off — but watch it happen anyway, because the counters show you "
        + "something a remembered fact does not: six counters, a hundred each. One into Amy's box. One "
        + "into Ben's first. One into his second. And round again.",
        { on: ["k1"], add: ["pp.pour"] });

      push(`And they came out even. Count what landed in one box: two hundreds, which is ${UNIT}. So one `
        + `unit is ${UNIT} — and notice nobody divided anything. The sharing WAS the division, and the `
        + "boxes did it.",
        { on: ["k2"], look: look.tile("k2"), lookAt: { delay: 1.0, hold: 2.2, to: 1.3 } });

      push(`So write it in every box and multiply back up. Amy has one unit: ${UNIT}. Ben has two of them: `
        + `${TIMES * UNIT}. Check it before you move: ${UNIT} and ${TIMES * UNIT} make ${W}, which is what `
        + `the brace said, and ${TIMES * UNIT} really is ${TIMES} times ${UNIT}. Both true, so it is right.`,
        { on: ["k3"], add: ["pp.filled"] });

      push("Two shapes, then, and they want different first moves. One thing cut up: part to whole, and "
        + "you add or take away along the bar. Two things compared: part to part, and you count the boxes "
        + "and find what ONE box is worth first. Before you write anything at all, ask yourself which of "
        + "those two you are looking at — because getting that wrong is how a correct sum ends up "
        + "answering a question nobody asked.",
        { play: (S, H, stage) => runLit(H, stage, ["k0", "k1", "k2", "k3"]) });
    },
  });
}

/* ═══ 3 · COMPLETING THE MISSING PART ══════════════════════════════════════
   Every bar-model question is one of three gaps, and which one you have
   decides whether you add, take away, or share. Including the share that does
   NOT come out even, which is where the counters have to be ungrouped.
   ------------------------------------------------------------------------*/
export function barMissing() {
  const P1 = 35, P2 = 27, W = P1 + P2;                   // 62
  const T = 450, N = 3, U = T / N;                       // 150
  /** The words written on a brace, so a "?" on one can be answered. */
  const braceWord = (svg, key) => braceOf(svg, key)?.querySelector("text");
  return film({
    asks: [
      { id: "a1", text: `A baker sells ${P1} pies in the morning and ${P2} pies in the afternoon. `
        + "How many pies does he sell in the day?" },
      { id: "a2", text: `The next day he sells ${W} pies, and ${P1} of them go in the morning. `
        + "How many does he sell in the afternoon?" },
      { id: "a3", text: `A rope ${T} cm long is cut into ${N} equal pieces. How long is each piece?` },
    ],
    pics: {
      /* the whole is missing */
      m1: () => modelSvg([{ parts: [part(String(P1), P1, "a"), part(String(P2), P2, "c")], says: "?" }],
        { label: "The whole is missing" }),
      /* a part is missing */
      m2: () => modelSvg([{ parts: [part(String(P1), P1, "a"), part("?", P2, "q")], says: String(W) }],
        { label: "A part is missing" }),
      /* three equal units, and a share that does not go */
      m3: () => modelSvg([
        { parts: [ask(U, "a"), ask(U, "a"), ask(U, "a")], says: String(T) },
      ], { label: "Three equal units" }),
    },
    lines: [
      { id: "g1", text: "Whole missing → ADD", y: 12, c: 2, size: 2.3 },
      { id: "g2", text: "Part missing → TAKE AWAY", y: 19.6, c: 1, size: 2.3 },
      { id: "g3", text: "Equal units → SHARE", y: 27.2, c: 3, size: 2.3 },
      { id: "s1", text: `${P1} + ${P2} = ${W} pies`, x: 14, y: 36, c: 2, size: 2.8 },
      { id: "s2", text: `${W} − ${P1} = ${P2} pies`, x: 14, y: 36, c: 1, size: 2.8 },
      { id: "s3", text: `${T} ÷ ${N} = ${U} cm`, x: 14, y: 40, c: 3, size: 2.8 },
    ],
    stages: {
      "m1.draw": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.5));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.5));
        H.draw(braceOf(s, "below-0-0"), 1.6);
      },
      "m1.ans": (s, H) => H.flip(braceWord(s, "below-0-0"), String(W), 0.4),
      "m2.draw": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.5));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.5));
        H.draw(braceOf(s, "below-0-0"), 1.6);
      },
      "m2.ans": (s, H) => H.flip(mb(s, "num")[1], String(P2), 0.4),
      "m3.draw": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.4));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.4));
        H.draw(braceOf(s, "below-0-0"), 1.8);
      },
      /* FOUR hundreds and five tens will not go three ways as they stand:
         the hundred has to be broken first. This is the whole reason the
         counters are worth a hundred. */
      "m3.pour": (s, H) => {
        /* the question marks come off: the counters are what is going in the
           boxes now, and a ? behind them is just something in the way */
        mb(s, "num").forEach((n) => { n.style.opacity = "0"; });
        const bars = mb(s, "bar");
        bars.forEach((bar, k) => pourInto(s, bar, [100], k, k));
        pouredIn(s).forEach((n, i) => H.drop(n, 0.3 + i * 0.45));
      },
      "m3.ungroup": (s, H) => {
        /* THE WHOLE BOX IS LAID OUT AGAIN. The fourth hundred becomes ten
           tens, so each box now holds a hundred AND five tens — and they have
           to share one layout, or the tens are placed over the hundred and it
           vanishes behind one of them. A hundred you cannot see is not a
           picture of anything. */
        mb(s, "num").forEach((n) => { n.style.opacity = "0"; });
        s.querySelectorAll(CTR).forEach((n) => n.remove());
        const bars = mb(s, "bar");
        bars.forEach((bar, k) => pourInto(s, bar, [100, 10, 10, 10, 10, 10], k * 6, k));
        const all = pouredIn(s);
        /* the hundreds were already in the boxes: they stay put */
        all.filter((n) => n.textContent === "100").forEach((n) => H.show(n));
        const tens = all.filter((n) => n.textContent === "10");
        /* and the tens are dealt round again: one to each box, five times */
        const order = [];
        for (let i = 0; i < 5; i += 1) for (let k = 0; k < 3; k += 1) order.push(tens[k * 5 + i]);
        order.forEach((n, i) => H.drop(n, 0.3 + i * 0.26));
      },
      /* the counters go, and the number they came to is written in their
         place — a box holding both says the same thing twice */
      "m3.filled": (s, H) => mb(s, "num").forEach((n, i) => {
        const at = 0.3 + i * 0.5;
        H.away(inBox(s, i), at);
        H.flip(n, String(U), at);
      }),
    },
    steps: ({ push, look }) => {
      push("Every bar-model question in the world is one of three gaps, and which gap you have got decides "
        + "what you do. Read the first one. Pies, morning and afternoon, and what we want is the whole "
        + "day. So both PARTS are known — thirty-five and twenty-seven, each in its own box — and the "
        + "question mark goes on the BRACE, because the brace is the thing we have not been told.",
        { on: ["a1", "m1", "g1"], add: ["m1.draw"] });

      push(`When the whole is missing, you ADD. Thirty-five and twenty-seven is sixty-two, so that question `
        + `mark on the brace becomes ${W} pies. And notice I did not need to know what the things were — `
        + "pies, beads, buses, naira. The picture does not care, which is exactly why it is worth drawing.",
        { on: ["s1"], add: ["m1.ans"], look: look.brace("m1", "below-0-0"), lookAt: { lit: true, delay: 1.0, hold: 2.0 } });

      push("Second gap, and it is the one people reach for the wrong operation on. Same baker, next day. "
        + "Now the WHOLE is known — sixty-two on the brace — and one of the PARTS is the question mark. "
        + "Look at the shape of it before you do anything: the box we want is the bit of the bar that the "
        + "thirty-five does not cover.",
        { on: ["a2", "m2", "g2"], off: ["a1", "m1", "s1"], add: ["m2.draw"],
          look: look.mark("m2", "num", 1), lookAt: { delay: 1.8, hold: 2.2, to: 1.45 } });

      push(`And that is a take-away, every time. The whole, less the part you know: ${W} take away ${P1} `
        + `is ${P2} pies, and into the box it goes. If you ever catch yourself adding here, look at the `
        + "picture again — you cannot have a part bigger than the whole it came out of.",
        { on: ["s2"], add: ["m2.ans"] });

      push("Third gap, and the last one. A rope, four hundred and fifty centimetres of it, cut into three "
        + "equal pieces. The whole is known and the parts are all the SAME size — three equal units, three "
        + "question marks. This is the one worth watching, because I have chosen numbers that do not go "
        + "neatly, and that is where a picture earns its keep.",
        { on: ["a3", "m3", "g3"], off: ["a2", "m2", "g1", "g2", "s2"], add: ["m3.draw"] });

      push("Four hundred and fifty. Start with hundreds: one into each box. That is three hundred gone and "
        + "a hundred and fifty still in my hand — and I cannot put that fourth hundred anywhere, because "
        + "one hundred will not go three ways.",
        { add: ["m3.pour"] });

      push("So UNGROUP it. One hundred is ten tens — the same amount, written in smaller pieces — and now "
        + "I have fifteen tens altogether. Watch: one ten to each box, round and round, five times over. "
        + "Five tens each. That is what ungrouping is FOR: you break a piece so that it will share.",
        { add: ["m3.ungroup"] });

      push(`So each box holds one hundred and five tens: a hundred and fifty. ${T} shared into ${N} is `
        + `${U}, so every piece of that rope is a hundred and fifty centimetres — and the counters got `
        + "there without anybody doing a division.",
        { on: ["s3"], add: ["m3.filled"], look: look.tile("s3"), lookAt: { delay: 1.8, hold: 2.0, to: 1.3 } });

      push("Three gaps, then, and you should name yours before you pick up a pencil. Whole missing: add. "
        + "Part missing: take away. Equal units: share. The picture tells you which one you are holding, "
        + "and once you know that, the sum at the end is the easy part.",
        /* the first two gaps come back up for the recap: a list you are told
           to remember has to be ON the screen while it is said */
        { on: ["g1", "g2"], play: (S, H, stage) => runLit(H, stage, ["g1", "g2", "g3"]) });
    },
  });
}

/* ═══ 4 · BAR MODELS AND MONEY ═════════════════════════════════════════════
   A money question is a bar question wearing a wallet, and money is the best
   thing to draw bars for because you can count the answer out and SEE it.

   THE NOTES ARE STACKED BY DENOMINATION, each kind in its own pile. That is
   not tidiness — it is what makes an EXCHANGE visible. A hundred that will
   not share three ways is swapped for five twenties, and you can only watch
   that happen if the hundreds have their own pile for one to leave.
   ------------------------------------------------------------------------*/


export function barMoney() {
  /* EXAMPLE ONE — an equal share that does NOT go in hundreds, so a note has
     to be changed before it will share. That is the whole reason money is
     worth drawing: the exchange is a thing you can watch happen. */
  const T1 = 750, N1 = 3, U1 = T1 / N1;                   // 250 each
  /* EXAMPLE TWO — the comparison, which is what most money questions are */
  const A = "Rosa", B = "Kate";
  const T2 = 800, MORE = 200, U2 = (T2 - MORE) / 2;       // 300
  return film({
    asks: [
      { id: "a1", text: `Three sisters share ₱${T1} equally. How much does each sister get?` },
      { id: "a2", text: `${A} and ${B} share ₱${T2}. ${A} gets ₱${MORE} more than ${B}. `
        + "How much does each of them get?" },
    ],
    pics: {
      /* three equal boxes and a brace: a share, drawn */
      e1: () => modelSvg([{ parts: [ask(U1, "a"), ask(U1, "a"), ask(U1, "a")], says: String(T1) }],
        { label: "Seven hundred and fifty shared three ways" }),
      /* one has what the other has, and a bit more */
      e2: () => modelSvg([
        { name: B, parts: [ask(U2, "a")] },
        { name: A, parts: [ask(U2, "a"), part(String(MORE), MORE, "d")] },
      ], { total: String(T2), label: "One has more than the other" }),
    },
    trays: {
      /* WHAT IS STILL IN MY HAND. The boxes hold what has been shared; this
         holds what has not, which is the only way the child can see that the
         last hundred is stuck. */
      h1: () => `<div class="vm-money vm-money--stacks">`
        + stackOf(100, 1, { x: 0, label: "₱100" })
        + stackOf(50, 1, { x: 1, label: "₱50" })
        + `</div>`,
      /* and the same money after the change: no hundred, three fifties */
      h2: () => `<div class="vm-money vm-money--stacks">`
        + stackOf(50, 3, { x: 0, label: "₱50 × 3" })
        + `</div>`,
    },
    trayAt: { h1: { x: 30, y: 36, w: 34 }, h2: { x: 30, y: 36, w: 34 } },
    lines: [
      { id: "hand", text: "still in my hand", x: 13, y: 30.5, c: 1, size: 2.1 },
      { id: "w1", text: `₱${T1} = 7 × 100 + 50`, y: 12, c: 2, size: 2.4 },
      { id: "w2", text: "100 = 50 + 50", y: 19.6, c: 1, size: 2.4 },
      { id: "w3", text: `${T1} ÷ ${N1} = ${U1}`, y: 27.2, c: 3, size: 2.6 },
      { id: "w4", text: `Take the ${MORE} off first`, y: 12, c: 1, size: 2.4 },
      { id: "w5", text: `${T2} − ${MORE} = ${T2 - MORE}`, y: 19.6, c: 0, size: 2.5 },
      { id: "w6", text: `2 units = ${T2 - MORE},  1 unit = ${U2}`, y: 27.2, c: 2, size: 2.3 },
      { id: "w7", text: `${B} = ${U2},  ${A} = ${U2 + MORE}`, y: 34.8, c: 3, size: 2.3 },
    ],
    stages: {
      /* a tray is hidden until it is counted out, piece by piece, like
         everything else on the stage */
      "h1.out": (s, H, stage, bits) => bits(stage, "h1").forEach((n, i) => H.drop(n, 0.2 + i * 0.35)),
      "h2.out": (s, H, stage, bits) => bits(stage, "h2").forEach((n, i) => H.drop(n, 0.2 + i * 0.3)),

      "e1.bars": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.4));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.4));
        H.draw(braceOf(s, "below-0-0"), 1.8);
      },
      /* two rounds of hundreds, dealt one to each box at a time */
      "e1.deal": (s, H) => {
        mb(s, "num").forEach((n) => { n.style.opacity = "0"; });
        mb(s, "bar").forEach((bar, k) => pourNotes(s, bar, [100, 100], k * 2, k));
        const all = pouredIn(s);
        const order = [all[0], all[2], all[4], all[1], all[3], all[5]];
        order.forEach((n, i) => H.drop(n, 0.3 + i * 0.45));
      },
      /* THE WHOLE BOX IS LAID OUT AGAIN when the fifty arrives, or the fifty
         is drawn over a hundred and the hundred is gone from the picture */
      "e1.fifty": (s, H) => {
        mb(s, "num").forEach((n) => { n.style.opacity = "0"; });
        s.querySelectorAll(CTR).forEach((n) => n.remove());
        mb(s, "bar").forEach((bar, k) => pourNotes(s, bar, [100, 100, 50], k * 3, k));
        const all = pouredIn(s);
        all.filter((n) => n.dataset.worth === "100").forEach((n) => H.show(n));
        all.filter((n) => n.dataset.worth === "50").forEach((n, i) => H.drop(n, 0.3 + i * 0.5));
      },
      "e1.filled": (s, H) => mb(s, "num").forEach((n, i) => {
        const at = 0.3 + i * 0.5;
        H.away(inBox(s, i), at);
        H.flip(n, String(U1), at);
      }),

      "e2.bars": (s, H) => {
        mb(s, "name").forEach((n, i) => H.write(n, i * 0.5));
        H.grow(mb(s, "bar", 0)[0], 0.25);
        H.write(mb(s, "num", 0)[0], 0.85);
        H.grow(mb(s, "bar", 1)[0], 0.8);
        H.write(mb(s, "num", 1)[0], 1.4);
      },
      "e2.extra": (s, H) => { H.grow(mb(s, "bar", 1)[1], 0.2); H.write(mb(s, "num", 1)[1], 0.8); },
      "e2.total": (s, H) => H.draw(braceOf(s, "total"), 0.2),
      /* the six hundreds that are left once the extra is off the top */
      "e2.deal": (s, H) => {
        [mb(s, "num", 0)[0], mb(s, "num", 1)[0]].forEach((n) => { n.style.opacity = "0"; });
        const even = [mb(s, "bar", 0)[0], mb(s, "bar", 1)[0]];
        even.forEach((bar, k) => pourNotes(s, bar, [100, 100, 100], k * 3, k));
        const all = pouredIn(s);
        const order = [all[0], all[3], all[1], all[4], all[2], all[5]];
        order.forEach((n, i) => H.drop(n, 0.3 + i * 0.4));
      },
      /* and the extra, put back where it belongs */
      "e2.back": (s, H) => {
        mb(s, "num", 1)[1].style.opacity = "0";
        pourNotes(s, mb(s, "bar", 1)[1], [100, 100], 90, 2)
          .forEach((n, i) => H.drop(n, 0.3 + i * 0.45));
      },
      "e2.filled": (s, H) => {
        [mb(s, "num", 0)[0], mb(s, "num", 1)[0]].forEach((n, i) => {
          const at = 0.3 + i * 0.5;
          H.away(inBox(s, i), at);
          H.flip(n, String(U2), at);
        });
        H.away(inBox(s, 2), 1.3);
        H.flip(mb(s, "num", 1)[1], String(MORE), 1.3);
      },
    },
    steps: ({ push, look }) => {
      push("Money questions are bar questions wearing a wallet, and they are the best ones to draw, "
        + "because at the end you can count the answer out and hold it in your hand. Read what we are "
        + "answering first: three sisters, seven hundred and fifty prepbills between them, shared EQUALLY. "
        + "Equally is the word that tells me what to draw — three boxes, all the same size, and a brace "
        + "underneath saying the whole lot comes to seven hundred and fifty.",
        { on: ["a1", "e1"], add: ["e1.bars"] });

      push("Now I share the money into the boxes, and I start with the biggest notes I have got, because "
        + "that is how anybody counts money out in real life. Seven hundreds and a fifty. One hundred to "
        + "the first sister, one to the second, one to the third. Round again: that is six hundreds gone, "
        + "two in every box, and look what is still in my hand.",
        { on: ["h1", "hand", "w1"], add: ["e1.deal", "h1.out"] });

      push("One hundred and one fifty left, and here is where a lot of people stop. That hundred will not "
        + "go three ways. I cannot tear it, and I am not allowed to give it to one sister and nothing to "
        + "the others. So I CHANGE it. The hundred goes back and two fifties come out instead — the same "
        + "money, in smaller pieces. That swap is the whole of what exchanging is.",
        { on: ["h2", "w2"], off: ["h1"], add: ["h2.out"],
          look: look.tile("w2"), lookAt: { delay: 1.6, hold: 2.2, to: 1.3 } });

      push("Three fifties now, and three sisters. That is one each, and my hands are empty. Watch them go "
        + "in — and notice that nothing was added and nothing was lost anywhere in that. The money that "
        + "was on the table at the start is the money sitting in those three boxes now; it has only "
        + "changed shape on the way.",
        { off: ["h2", "hand"], add: ["e1.fifty"] });

      push(`Count one box up. A hundred, another hundred, and a fifty: two hundred and fifty. And since `
        + `the boxes were filled the same way, round and round, every box holds the same — so each sister `
        + `gets two hundred and fifty. There is the division, done without dividing: ${T1} shared into `
        + `${N1} is ${U1}.`,
        { on: ["w3"], add: ["e1.filled"],
          look: look.tile("w3"), lookAt: { delay: 1.8, hold: 2.0, to: 1.3 } });

      push("Second question, and it is the shape most money questions come in. Rosa and Kate are sharing "
        + "eight hundred, and Rosa gets two hundred MORE than Kate. Start with the smaller one, always: "
        + "Kate is one box. And Rosa gets the SAME box to begin with, because she has everything Kate has "
        + "— the extra comes after. Draw it in that order and you cannot lose the comparison.",
        { on: ["a2", "e2"], off: ["a1", "e1", "w1", "w2", "w3"], add: ["e2.bars"] });

      push("Then the extra on the end, and THIS box I am allowed to label, because the question told me: "
        + "two hundred. And the brace down the side gathers both rows together and says eight hundred — "
        + "that is both of them, not one. Look at the shape of it. Two boxes the same, and a little one "
        + "hanging off the end. Every question with the word MORE in it comes out looking like that.",
        { add: ["e2.extra", "e2.total"],
          look: look.mark("e2", "num", 1, 1), lookAt: { delay: 1.2, hold: 2.2, to: 1.4 } });

      push("Here is the move, and it is the only new thing in this film. I cannot share eight hundred into "
        + "two equal boxes, because the boxes are NOT equal — one of them has that two hundred stuck on "
        + "the end. So take the two hundred off the top first. Eight hundred less two hundred is six "
        + "hundred, and what is left of the picture is two boxes that really are the same.",
        { on: ["w4", "w5"], look: look.tile("w5"), lookAt: { delay: 1.4, hold: 2.2, to: 1.3 } });

      push("Six hundred into two equal boxes, in hundreds again. One to Kate, one to Rosa, and round, and "
        + "round. Three hundreds each, and this time nothing is left over and nothing needs changing — "
        + "which is worth noticing, because it tells you the numbers in this one were chosen kindly. One "
        + "unit is three hundred.",
        { on: ["w6"], add: ["e2.deal"] });

      push("And now put the two hundred back where it belongs, on the end of Rosa's bar. Two more hundreds "
        + "into that little box. Nothing about Kate's row changed when I did that — her box is still three "
        + "hundred — because the extra was never hers. That is the bit people get wrong: they share the "
        + "whole eight hundred and then wonder why the difference has gone.",
        { add: ["e2.back"] });

      push(`Count it out, because with money you always can. Kate: three hundreds, three hundred. Rosa: `
        + `three hundreds and the two hundred as well, so five hundred. Now check it twice. Together they `
        + `make ${T2}, which is what was on the table. And Rosa has ${MORE} more than Kate, which is what `
        + "the question said. Both true, so it is right.",
        { on: ["w7"], add: ["e2.filled"] });

      push("So, money. Draw the bars the way the story tells you, smaller one first. If one person gets "
        + "MORE, take the extra off the top before you share anything. Count the share out in real notes, "
        + "biggest first, and when a note will not go round, change it for smaller ones instead of giving "
        + "up. And always finish by checking the total and the difference — that last check is not showing "
        + "off, it is the only thing standing between you and a wrong answer written neatly.",
        { play: (S, H, stage) => runLit(H, stage, ["w4", "w5", "w6", "w7"]) });
    },
  });
}

/* ═══ 5 · BARS AS FRACTIONS ════════════════════════════════════════════════
   A fraction is a bar cut into EQUAL parts, and almost every mistake children
   make with fractions is visible the moment you draw it: parts that are not
   equal, or a numerator counted off a different whole from the denominator.
   ------------------------------------------------------------------------*/
export function barFractions() {
  /* EXAMPLE ONE — three quarters of twenty */
  const W = 20, D = 4, Nn = 3;
  const each = W / D;                          // 5
  /* EXAMPLE TWO — two fifths of forty-five, a fraction that is not a half of
     anything and a share that still comes out whole */
  const W2 = 45, D2 = 5, N2 = 2;
  const each2 = W2 / D2;                       // 9
  const u = (n, tone) => Array.from({ length: n }, () => part("", 1, tone));
  const lab = (n, text, tone) => Array.from({ length: n }, () => part(text, 1, tone));
  /* A PART IS WORTH ONE HERE, not five or twenty, because what a quarter of
     twenty comes to is the thing being worked out. A row of four ones would
     otherwise be drawn 30mm wide and magnified to fill the tile, so these
     bars have to be told how wide a part of one is: a share of the paper,
     which puts the cut bar across the screen like every other model. */
  const PART_MM = (PAPER_MM - 10) / D;
  const PART2_MM = (PAPER_MM - 10) / D2;
  return film({
    asks: [
      /* the fraction is WORDS in the question and figures on the bar: that is
         how it is met on a page, and half the work is turning the one into
         the other */
      { id: "a1", text: `There are ${W} sweets in a jar. Rosa takes three quarters of them. `
        + "How many sweets does she take?" },
      { id: "a2", text: `A class has ${W2} children. Two fifths of them walk to school. `
        + "How many children walk to school?" },
    ],
    pics: {
      /* the whole, uncut */
      f0: () => modelSvg([{ parts: [part(String(W), W, "a")] }], { label: "One whole" }),
      /* cut into four equal parts: the DENOMINATOR is how many cuts */
      f1: () => modelSvg([{ parts: u(D, "a"), says: String(W) }], { cap: PART_MM, label: "Cut into four" }),
      /* three of them shaded: the NUMERATOR is how many you take */
      f2: () => modelSvg([{ parts: [...u(Nn, "d"), ...u(D - Nn, "a")],
        above: [{ from: 0, to: Nn, text: `${Nn}/${D}` }], says: String(W) }],
      { cap: PART_MM, label: "Three quarters" }),
      /* each part labelled, so the answer can be read off */
      f3: () => modelSvg([{ parts: [...lab(Nn, String(each), "d"), ...lab(D - Nn, String(each), "a")],
        above: [{ from: 0, to: Nn, text: String(Nn * each) }], says: String(W) }],
      { cap: PART_MM, label: "Read it off" }),
      /* and the trap: unequal parts are not fractions at all */
      f4: () => modelSvg([{ parts: [part("", 8, "q"), part("", 3, "q"), part("", 6, "q"), part("", 3, "q")],
        says: String(W) }], { label: "Not quarters" }),
      /* the second question, cut five ways */
      g0: () => modelSvg([{ parts: u(D2, "a"), says: String(W2) }],
        { cap: PART2_MM, label: "Cut into five" }),
      g1: () => modelSvg([{ parts: [...u(N2, "d"), ...u(D2 - N2, "a")],
        above: [{ from: 0, to: N2, text: `${N2}/${D2}` }], says: String(W2) }],
      { cap: PART2_MM, label: "Two fifths" }),
      g2: () => modelSvg([{ parts: [...lab(N2, String(each2), "d"), ...lab(D2 - N2, String(each2), "a")],
        above: [{ from: 0, to: N2, text: String(N2 * each2) }], says: String(W2) }],
      { cap: PART2_MM, label: "Two fifths of forty-five" }),
    },
    lines: [
      { id: "d1", text: "BOTTOM = how many parts", y: 12, c: 1, size: 2.3 },
      { id: "d2", text: "TOP = how many you take", y: 19.6, c: 3, size: 2.3 },
      { id: "d3", text: `${W} ÷ ${D} = ${each}  (one part)`, y: 29, c: 0, size: 2.5 },
      { id: "d4", text: `${Nn} × ${each} = ${Nn * each} sweets`, y: 36.6, c: 2, size: 2.5 },
      { id: "e3", text: `${W2} ÷ ${D2} = ${each2}  (one part)`, y: 29, c: 0, size: 2.5 },
      { id: "e4", text: `${N2} × ${each2} = ${N2 * each2} children`, y: 36.6, c: 2, size: 2.5 },
    ],
    stages: {
      "f0.draw": (s, H) => { H.grow(mb(s, "bar")[0]); H.write(mb(s, "num")[0], 0.8); },
      "f1.cut": (s, H) => {
        mb(s, "bar").forEach((n, i) => (i ? H.grow(n, 0.2 + i * 0.35) : H.show(n)));
        H.draw(braceOf(s, "below-0-0"), 1.8);
      },
      "f2.shade": (s, H) => {
        const bars = mb(s, "bar");
        bars.forEach((n, i) => (i < Nn ? H.tint(n, bars[Nn].getAttribute("fill"), 0.3 + i * 0.4) : H.show(n)));
        H.draw(braceOf(s, "below-0-0"));
        H.draw(braceOf(s, "above-0-0"), 1.6);
      },
      "f3.each": (s, H) => {
        /* THE BARS FIRST. This is a fresh drawing, where every mark starts
           hidden, so writing the fives into it without putting the boxes up
           left the figures hanging on an empty screen with nothing to be
           five OF. */
        mb(s, "bar").forEach((n) => H.show(n));
        H.draw(braceOf(s, "below-0-0"));
        mb(s, "num").forEach((n, i) => H.write(n, 0.3 + i * 0.4));
      },
      "f3.tot": (s, H) => H.draw(braceOf(s, "above-0-0"), 0.2),
      "f4.bad": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.3));
        H.draw(braceOf(s, "below-0-0"), 1.5);
      },
      "g0.cut": (s, H) => {
        mb(s, "bar").forEach((n, i) => (i ? H.grow(n, 0.2 + i * 0.3) : H.show(n)));
        H.draw(braceOf(s, "below-0-0"), 1.7);
      },
      "g1.shade": (s, H) => {
        const bars = mb(s, "bar");
        bars.forEach((n, i) => (i < N2 ? H.tint(n, bars[N2].getAttribute("fill"), 0.3 + i * 0.4) : H.show(n)));
        H.draw(braceOf(s, "below-0-0"));
        H.draw(braceOf(s, "above-0-0"), 1.5);
      },
      "g2.each": (s, H) => {
        mb(s, "bar").forEach((n) => H.show(n));
        H.draw(braceOf(s, "below-0-0"));
        mb(s, "num").forEach((n, i) => H.write(n, 0.3 + i * 0.35));
      },
      "g2.tot": (s, H) => H.draw(braceOf(s, "above-0-0"), 0.2),
    },
    steps: ({ push, look }) => {
      push("A fraction is a bar cut into EQUAL parts. That is the whole idea, and the word equal is doing "
        + "all the work in it. Read the question: twenty sweets in a jar, and Rosa takes three quarters of "
        + "them. So here is the whole jar — twenty sweets, drawn as one bar, uncut.",
        { on: ["a1", "f0"], add: ["f0.draw"] });

      push("Now, three quarters of it. The BOTTOM number of a fraction tells you how many equal parts to "
        + "cut the whole into, so the four says: four parts, all the same size. Cut, cut, cut. Four pieces "
        + "of bar, and the brace still says twenty, because cutting never changed how much there is.",
        { on: ["f1", "d1"], off: ["f0"], add: ["f1.cut"] });

      push("And the TOP number says how many of those parts you take. Three. So I shade three of the four "
        + "— and that shaded stretch is three quarters. Not three sweets: three PARTS, and each part is "
        + "worth however much a quarter of twenty is.",
        { on: ["f2", "d2"], off: ["f1"], add: ["f2.shade"],
          look: look.brace("f2", "above-0-0"), lookAt: { lit: true, delay: 1.8, hold: 2.2 } });

      push(`So find one part first, always. Twenty shared into four is five, so each piece of bar is worth `
        + `five. Write it in every box — every one, because they are all the same size.`,
        { on: ["f3", "d3"], off: ["f2"], add: ["f3.each"],
          look: look.tile("d3"), lookAt: { delay: 1.8, hold: 2.0, to: 1.3 } });

      push(`And then take the three you wanted: three fives, fifteen. So Rosa takes fifteen sweets. Notice `
        + "the order — find ONE part, then multiply up. It is the same two moves as every other bar model "
        + "in this chapter, which is rather the point.",
        { on: ["d4"], add: ["f3.tot"] });

      push("Now the mistake, because it is worth seeing. Here is a bar cut into four — but LOOK at them. "
        + "That first piece is nearly three times the last. Four parts, yes. Quarters, no. If the parts "
        + "are not equal they are not fractions at all, and no amount of correct arithmetic afterwards "
        + "will rescue the picture.",
        { on: ["f4"], off: ["f3"], add: ["f4.bad"],
          look: look.mark("f4", "bar", 0), lookAt: { lit: true, delay: 1.6, hold: 2.4 } });

      push("Second question, and the only thing that changes is the two numbers in the fraction. A class "
        + "of forty-five, and two fifths of them walk to school. Bottom number first, always: five. So the "
        + "whole class gets cut into five equal parts, and the brace underneath still says forty-five, "
        + "because they are all still there.",
        { on: ["a2", "g0"], off: ["a1", "f4", "d3", "d4"], add: ["g0.cut"] });

      push("Then the top number, which is two. Two of those five parts, shaded — and that is two fifths of "
        + "the class. Say what you are looking at out loud: two parts out of five, and every part the same "
        + "size as every other. If they were not, the picture would be lying.",
        { on: ["g1"], off: ["g0"], add: ["g1.shade"],
          look: look.brace("g1", "above-0-0"), lookAt: { lit: true, delay: 1.6, hold: 2.2 } });

      push(`One part first. Forty-five children shared into five parts: that is nine in each part. Nine, `
        + `nine, nine, nine, nine — in every box, because the boxes are equal. And if you are tempted to `
        + "skip this and do something clever with the two, do not. Find one part. It is the move that "
        + "never lets you down.",
        { on: ["g2", "e3"], off: ["g1"], add: ["g2.each"],
          look: look.tile("e3"), lookAt: { delay: 1.8, hold: 2.0, to: 1.3 } });

      push(`And now take the two you were asked for. Two nines: eighteen. So eighteen children walk to `
        + "school — and the other twenty-seven, the three fifths we did not shade, come some other way. "
        + "You can check that in your head: eighteen and twenty-seven make forty-five, the whole class.",
        { on: ["e4"], add: ["g2.tot"] });

      push("So: bottom number, how many equal parts. Top number, how many you take. Find what ONE part is "
        + "worth, then multiply back up. And before you do any of it, check with your eye that the parts "
        + "really are the same size — because a bar model is only as honest as its cutting.",
        { play: (S, H, stage) => runLit(H, stage, ["d1", "d2", "e3", "e4"]) });
    },
  });
}
