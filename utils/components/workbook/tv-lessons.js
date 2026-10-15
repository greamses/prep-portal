/* ============================================================================
   TWO OF PREPBOT'S LESSONS: a shop bill, and the box method for ratios
   ----------------------------------------------------------------------------
   Both play on the shared teacher's TV (mental-math/shared/prepbot-tv.js) and
   are built from the same kit as the division and algebra films (vedic
   explain.js `tile`, `art`, `acts`): a scene is written in hundredths of the
   screen, and every step first LAYS the screen as it stood before it and then
   plays only its own change, so stepping back or skipping lands exactly where
   it should.

   (There was a shop-bill film here too. It is gone: the Toy Shop teaches that
   one by PREPBOT WORKING THE REAL SHOP — pressing its buttons, opening its
   calculator, typing in its boxes — which teaches where things are as well as
   what order they come in. See toy-shop/js/guide.js.)

   THE BOX METHOD is the one picture that answers every sharing question. A
   ratio is not two numbers, it is a number of BOXES; count them, find what
   one box is worth, and multiply back up. Once the boxes are drawn, "how much
   does each get", "how much more does one get" and "what is the whole" are
   all the same drawing read three ways — which is why it is worth drawing.

   The strip and the TV plumbing live here once and serve both, rather than
   being copied per lesson the way the algebra films copy it.
   ========================================================================== */

import { tile, art, acts, PLAY } from "/prep-math/activity/vedic-maths-workbook/js/explain.js";
import { ICON_PREPBOT } from "/prep-math/mental-math/shared/icons.js";
import { needCss } from "./panels.js";
/* the card's own place tints and column headings, so the film and the card
   never disagree about what a place is worth */
import { placeFill, worthOf } from "./shift.js";
/* the workbook's own bar-model drawing, so the film and the paper cannot
   disagree about what one looks like (ch 9, and its brace rule) */
import { modelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";

/* The strip's dress. A page that is not a workbook does not link video.css,
   and an unstyled strip is not merely plain — it is invisible, which is how
   the Toy Shop first shipped it. The module brings its own. */
needCss("/utils/components/workbook/video.css");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** What opens a lesson: PrepBot and a play button; the name is the tooltip. */
export const lessonStrip = (kind, label) =>
  `<div class="vm-video vm-video--icon has-video" data-tvlesson="${esc(kind)}" data-title="${esc(label)}" tabindex="0" `
  + `aria-label="Watch PrepBot explain: ${esc(label)}" title="Watch PrepBot explain: ${esc(label)}">`
  + `<span class="vm-video__bot">${ICON_PREPBOT}</span>`
  + `<span class="vm-video__go">${PLAY}</span></div>`;

/* a hundredth of the screen's HEIGHT, in hundredths of its width (16 : 9) */
const VH = 0.5625;
/* `down` turns a distance measured ACROSS the screen into the same distance
   measured DOWN it — and the result is a percentage of the HEIGHT, so it runs
   0 to 100 over an argument of 0 to 56.25. Pass it 58 and the tile is below
   the screen. Two whole lines of the ratio film were laid out off the bottom
   that way before anyone looked. */
const down = (w) => w / VH;
const BOTTOM = 53;                       // the largest argument that still shows

const INK = "#2a2723";
const num = (stage, id, text, x, y, c, sizeU = 3.3) =>
  tile(stage, id, String(text), x, y, { c }).firstChild.style.setProperty("font-size", `calc(var(--u) * ${sizeU})`);

const money = (n) => n.toFixed(2);

/* ═══ the box method for ratios ════════════════════════════════════════════*/

const BOX = (fill, label) =>
  `<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" fill="${fill}" stroke="${INK}" stroke-width="5"/>`
  + (label ? `<text x="50" y="54" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace"`
    + ` font-size="38" font-weight="800" fill="${INK}">${label}</text>` : "")
  + `</svg>`;

const BRACE = (w) =>
  `<svg viewBox="0 0 ${w} 20" preserveAspectRatio="none">`
  + `<path d="M2 2v7a5 5 0 0 0 5 5h${w / 2 - 14}a5 5 0 0 1 5 5a5 5 0 0 1 5-5h${w / 2 - 14}a5 5 0 0 0 5-5V2"`
  + ` fill="none" stroke="${INK}" stroke-width="3"/></svg>`;

function ratioScene() {
  const p = 4, q = 5;                       // the ratio
  const shares = p + q;                     // 9
  const one = 50;                           // what one box is worth
  const whole = shares * one;               // 450
  const A = "Ada", B = "Bola";

  const W = 7.2;                            // a box, across the screen
  const GAP = 0.9;
  const ROW_A = down(15), ROW_B = down(29);
  const X0 = 10;
  const boxAt = (i) => X0 + W / 2 + i * (W + GAP);

  const aIds = Array.from({ length: p }, (_, i) => `a${i}`);
  const bIds = Array.from({ length: q }, (_, i) => `b${i}`);
  const aFill = Array.from({ length: p }, (_, i) => `af${i}`);
  const bFill = Array.from({ length: q }, (_, i) => `bf${i}`);
  const ALL = ["q", "la", "lb", "count", "brace", "whole", "one", "ta", "tb", "check", "diff",
    ...aIds, ...bIds, ...aFill, ...bFill];

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    /* the step sticker sits top-left, so the question is set to its right */
    num(stage, "q", `Share ${whole} in the ratio ${p} : ${q}`, 56, down(2.6), 0, 2.6);

    num(stage, "la", A, X0 - 5, ROW_A, 3, 2.6);
    num(stage, "lb", B, X0 - 5, ROW_B, 4, 2.6);
    aIds.forEach((id, i) => art(stage, id, boxAt(i), ROW_A, W, BOX("#bfe3ff", "")));
    bIds.forEach((id, i) => art(stage, id, boxAt(i), ROW_B, W, BOX("#c8f0c0", "")));
    aFill.forEach((id, i) => art(stage, id, boxAt(i), ROW_A, W, BOX("#bfe3ff", String(one))));
    bFill.forEach((id, i) => art(stage, id, boxAt(i), ROW_B, W, BOX("#c8f0c0", String(one))));

    const mid = X0 + (q * (W + GAP)) / 2 - GAP / 2;
    num(stage, "count", `${p} + ${q} = ${shares} boxes`, 74, down(13), 0, 2.9);
    art(stage, "brace", mid, down(39), q * (W + GAP), BRACE(300));
    num(stage, "whole", String(whole), mid, down(46), 2, 3.4);
    num(stage, "one", `${whole} ÷ ${shares} = ${one} a box`, 74, down(21), 1, 2.9);
    num(stage, "ta", `${A}: ${p} × ${one} = ${p * one}`, 74, down(29), 3, 2.9);
    num(stage, "tb", `${B}: ${q} × ${one} = ${q * one}`, 74, down(36), 4, 2.9);
    num(stage, "check", `${p * one} + ${q * one} = ${whole} ✓`, 74, down(43), 2, 2.7);
    /* bottom-right is PrepBot's corner; this goes under the brace instead */
    num(stage, "diff", `one box more = ${one}`, mid, down(52), 1, 2.7);
  };

  const events = [];
  let on = new Set();
  const push = (say, { show = [], off: gone = [], play = () => {} } = {}) => {
    const before = new Set(on);
    show.forEach((id) => on.add(id));
    gone.forEach((id) => on.delete(id));
    events.push({ say, before, show, play });
  };

  push(`${A} and ${B} are to share ${whole} in the ratio ${p} to ${q}. `
    + `Here is the thing to understand first: the ratio does NOT say ${A} gets ${p}. It says ${A} gets ${p} BOXES.`,
    { show: ["q"] });
  push(`So draw them. ${p} boxes for ${A} — all exactly the same size, because every box is worth the same.`,
    { show: ["la", ...aIds], play: (S) => aIds.forEach((id, i) => S.pop(id, 0.3 + i * 0.16)) });
  push(`And ${q} boxes for ${B}. Same size again. The picture is the ratio.`,
    { show: ["lb", ...bIds], play: (S) => bIds.forEach((id, i) => S.pop(id, 0.3 + i * 0.16)) });
  push(`Now count every box on the page: ${p} and ${q} is ${shares}. Nine boxes between them.`,
    { show: ["count"], play: (S) => [...aIds, ...bIds].forEach((id, i) => S.pulse(id, 0.2 + i * 0.1)) });
  push(`And all ${shares} of those boxes TOGETHER are the whole ${whole}. That is the sentence the picture gives you, and it is the one worth writing down.`,
    { show: ["brace", "whole"] });
  push(`So one box is ${whole} shared into ${shares}: ${whole} ÷ ${shares} = ${one}. `
    + "Finding one box is the whole method — everything else is multiplying.",
    { show: ["one"], play: (S) => S.pulse("one", 0.4) });
  push(`Write ${one} in every box, so you can see it.`,
    { show: [...aFill, ...bFill], off: [...aIds, ...bIds],
      play: (S) => [...aFill, ...bFill].forEach((id, i) => S.pop(id, 0.2 + i * 0.12)) });
  push(`${A} has ${p} boxes, and each is ${one}: ${p} × ${one} = ${p * one}.`,
    { show: ["ta"], play: (S) => aFill.forEach((id, i) => S.pulse(id, 0.2 + i * 0.12)) });
  push(`${B} has ${q}: ${q} × ${one} = ${q * one}.`,
    { show: ["tb"], play: (S) => bFill.forEach((id, i) => S.pulse(id, 0.2 + i * 0.12)) });
  push(`Check it, every time: ${p * one} and ${q * one} is ${whole} — the amount you started with. If it does not come back, one box was wrong.`,
    { show: ["check"], play: (S) => S.pulse("check", 0.4) });
  push(`And now the picture answers questions it was not asked. "How much MORE does ${B} get?" `
    + `Look: ${B} has one box more than ${A}. One box is ${one}. You do not work it out again.`,
    { show: ["diff"], play: (S) => { S.pulse(bFill[q - 1], 0.3); S.pulse("diff", 0.6); } });
  push("That is the box method, and it is the same three moves every time. "
    + "Turn the ratio into boxes. Find what ONE box is worth. Multiply back up — and check.",
    { play: (S) => { S.pulse("count", 0.2); S.pulse("one", 0.5); S.pulse("check", 0.8); } });

  const lay = (S, set) => ALL.forEach((id) => S.put(id, { on: set.has(id) ? 1 : 0 }));
  const steps = events.map((ev) => ({
    say: ev.say,
    show(stage, how) {
      const S = acts(stage, how.gsap, how.instant);
      lay(S, ev.before);
      ev.show.forEach((id, j) => { if (!ev.before.has(id)) S.pop(id, 0.3 + j * 0.14); });
      ev.play(S);
    },
  }));
  return { build, steps };
}

/* ═══ the digit shift: × and ÷ by a power of ten ═══════════════════════════
   The card's own lesson (utils/components/workbook/shift.js), moving. The one
   thing it is for is that THE POINT DOES NOT MOVE. "Move the point two
   places" is how most of us were taught and it is the wrong way round: the
   point belongs to the paper, not to the number. A figure is worth ten times
   more one place to the left because that is what a place IS — so the figures
   are what travel, and the film shows them travelling.
   ------------------------------------------------------------------------*/

function shiftScene() {
  const COLS = 7;                          // 1000 down to 0.001
  const W = 10.6;
  const X0 = 14;
  const colX = (i) => X0 + i * W;
  const placeOf = (i) => 3 - i;            // column 3 is the units
  const colOfPlace = (p) => 3 - p;
  const ROW = down(22);

  /* the point is nailed between the units and the tenths, for ever */
  const POINT_X = (colX(3) + colX(4)) / 2;

  /* 3.45 — the figure, and the place it starts in */
  const FIGS = [["f3", "3", 0], ["f4", "4", -1], ["f5", "5", -2]];
  const headIds = Array.from({ length: COLS }, (_, i) => `h${i}`);
  const cellIds = Array.from({ length: COLS }, (_, i) => `c${i}`);
  const ALL = ["q", "point", "read", "say", "say2", "hold",
    ...headIds, ...cellIds, ...FIGS.map((f) => f[0])];

  const CELL = (fill) =>
    `<svg viewBox="0 0 100 100"><rect x="2" y="2" width="96" height="96" fill="${fill}"`
    + ` stroke="${INK}" stroke-width="3" opacity="0.5"/></svg>`;
  const POINT = `<svg viewBox="0 0 20 100"><circle cx="10" cy="76" r="7" fill="#c0453f"/>`
    + `<path d="M10 6v54" stroke="#c0453f" stroke-width="3" stroke-dasharray="6 6"/></svg>`;

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    num(stage, "q", "3.45 × 100", 50, down(3), 0, 3.4);

    headIds.forEach((id, i) => num(stage, id, worthOf(placeOf(i)), colX(i), down(11), 0, 2.2));
    cellIds.forEach((id, i) => art(stage, id, colX(i), ROW, W, CELL(placeFill(placeOf(i)))));
    FIGS.forEach(([id, d, p]) => num(stage, id, d, colX(colOfPlace(p)), ROW, 0, 5));
    /* the nought that holds an empty place: drawn faint, because it is holding
       the place rather than counting anything */
    num(stage, "hold", "0", colX(3), ROW, 0, 5);

    art(stage, "point", POINT_X, ROW, 1.8, POINT);
    num(stage, "read", "3.45", 50, down(34), 2, 4);
    num(stage, "say", "", 50, down(43), 1, 2.6);
    num(stage, "say2", "", 50, down(50), 3, 2.6);
  };

  const events = [];
  let on = new Set();
  /* where each figure is STANDING at this point in the film, and what the two
     lines under the board say */
  let shift = 0;
  let readText = "3.45";
  let line1 = "";
  let line2 = "";
  let sumText = "3.45 × 100";
  const push = (say, { show = [], off: gone = [], at = shift, read = readText, l1 = line1, l2 = line2,
    q = sumText, play = () => {} } = {}) => {
    const before = new Set(on);
    const beforeShift = shift;
    show.forEach((id) => on.add(id));
    gone.forEach((id) => on.delete(id));
    shift = at; readText = read; line1 = l1; line2 = l2; sumText = q;
    events.push({ say, before, show, play, shift: at, beforeShift, read, l1, l2, q });
  };

  push("Here is a board of places, and a number standing in them: three point four five.",
    { show: [...headIds, ...cellIds, "f3", "f4", "f5", "point", "read"] });
  push("Look at the point. It is part of the BOARD, not part of the number — it is nailed between "
    + "the units and the tenths, and it is not going to move once in this whole film.",
    { play: (S) => S.pulse("point", 0.3) });
  push("We want three point four five times a hundred.", { show: ["q"], play: (S) => S.pulse("q", 0.3) });
  push("A hundred is ten squared — two tens multiplied together. So this is a slide of TWO places.",
    { l1: "100 = 10², so two places", show: ["say"] });
  push("Times means every figure is worth ten times MORE, and worth-ten-times-more is one place to the LEFT. "
    + "So the whole number slides left. One place.",
    { at: 1, read: "34.5", play: (S) => S.pulse("read", 0.9) });
  push("And again. That is two.", { at: 2, read: "345", play: (S) => S.pulse("read", 0.9) });
  push("Read it off the board: three hundred and forty-five. The three is in the hundreds now — "
    + "not because we did anything to it, but because that is where it is STANDING.",
    { l1: "3.45 × 100 = 345", play: (S) => { S.pulse("f3", 0.3); S.pulse("read", 0.7); } });
  push("Nothing was added and nothing was taken away. The figures are the same three figures. "
    + "This is the whole of multiplying by ten, and it is why the answer is never 3.400.",
    { l2: "same figures, different places", show: ["say2"] });

  /* and the other way */
  push("Now the other way. Put it back, and divide by ten instead.",
    { at: 0, read: "3.45", q: "3.45 ÷ 10", l1: "", l2: "",
      play: (S) => S.pulse("q", 0.3) });
  push("Dividing makes every figure worth ten times LESS — so this time they slide to the RIGHT. One place.",
    { at: -1, read: "0.345" });
  push("And look at the units column. It is empty now, and an empty place between the figures and the point "
    + "has to be held — so a nought comes in to hold it.",
    { show: ["hold"], play: (S) => { S.pulse("hold", 0.4); S.dim("hold", 0.55, 1.2); } });
  push("That nought is not a number we invented. It is the place-holder, and it is the one everybody forgets. "
    + "Three point four five divided by ten is nought point three four five.",
    { l1: "3.45 ÷ 10 = 0.345", play: (S) => S.pulse("read", 0.5) });
  push("One last thing. A NEGATIVE power turns the whole thing round: times ten to the minus two is the same "
    + "as divided by a hundred, and it goes right, not left.",
    { l2: "× 10⁻² is ÷ 100 — the other way", play: (S) => S.pulse("say2", 0.4) });
  push("So there are only two things to remember. Times goes LEFT, divide goes RIGHT, and as many places as "
    + "the power says. The point never moves — you do.",
    { play: (S) => { S.pulse("point", 0.3); S.pulse("say", 0.6); } });

  const lay = (S, ev) => {
    ALL.forEach((id) => S.put(id, { on: ev.before.has(id) ? 1 : 0 }));
    /* every figure is PUT in the column it stood in before this step, so a
       step played out of order still starts from the right board */
    FIGS.forEach(([id, , p]) => S.put(id, { x: colX(colOfPlace(p + ev.beforeShift)), y: ROW }));
  };
  const steps = events.map((ev) => ({
    say: ev.say,
    show(stage, how) {
      const S = acts(stage, how.gsap, how.instant);
      lay(S, ev);
      S.put("q", { text: ev.q, on: ev.before.has("q") ? 1 : 0 });
      S.put("read", { text: ev.read });
      S.put("say", { text: ev.l1 });
      S.put("say2", { text: ev.l2 });
      /* the holder nought is drawn FAINT: it is holding the place, not
         counting anything, which is the whole point of it */
      if (ev.before.has("hold")) S.put("hold", { on: 0.5 });
      ev.show.forEach((id, j) => { if (!ev.before.has(id)) S.pop(id, 0.3 + j * 0.06); });
      /* the slide itself: the figures travel, the point does not */
      if (ev.shift !== ev.beforeShift) {
        FIGS.forEach(([id, , p], i) => S.move(id, colX(colOfPlace(p + ev.shift)), ROW, 0.3 + i * 0.1));
      }
      ev.play(S);
    },
  }));
  return { build, steps };
}

/* ═══ the bar model ════════════════════════════════════════════════════════
   The method the Maths Workbook's chapter 9 is built on, taught in the order
   it is actually used: a bar is a thing, cutting it makes the parts, and what
   you are NOT told goes in a box with a question mark.

   The pictures are drawn by the workbook's own `modelSvg`, so the film and
   the paper cannot disagree about what a bar model looks like — including the
   rule that matters most on the page: A TOTAL IS NEVER WRITTEN BESIDE A BAR.
   It is a curly brace over the stretch it covers, because the brace is what
   says WHAT the total is the total of.
   ------------------------------------------------------------------------*/

function barScene() {
  const WHOLE = 48;                      // the total in the problem
  const TIMES = 3;                       // Ada has three times as many as Bola
  const unit = WHOLE / (TIMES + 1);      // 12
  const A = "Ada", B = "Bola";

  const box = (text, value, tone) => ({ text, value, tone });
  const q = (tone) => box("?", unit, tone);

  /* the five pictures the film moves between, each the whole model as it
     stands at that moment */
  const PICS = {
    /* a whole cut into two parts — the idea before the problem */
    m1: () => modelSvg([{ parts: [box("20", 20, "a"), box("28", 28, "b")], says: String(WHOLE) }],
      { label: "A bar cut into two parts" }),
    /* the same, with one part unknown: what you are not told is a box */
    m2: () => modelSvg([{ parts: [box("20", 20, "a"), box("?", 28, "q")], says: String(WHOLE) }],
      { label: "A bar with one part unknown" }),
    /* the problem: one unit against three, braced down the side */
    m3: () => modelSvg([
      { name: B, parts: [q("a")] },
      { name: A, parts: [q("b"), q("b"), q("b")] },
    ], { total: String(WHOLE), label: "One unit against three" }),
    /* the units counted */
    m4: () => modelSvg([
      { name: B, parts: [q("a")], above: [{ from: 0, to: 1, text: "1 unit" }] },
      { name: A, parts: [q("b"), q("b"), q("b")], below: [{ from: 0, to: 3, text: "3 units" }] },
    ], { total: String(WHOLE), label: "The units counted" }),
    /* one unit found, and written in every box */
    m5: () => modelSvg([
      { name: B, parts: [box(String(unit), unit, "a")], says: String(unit) },
      { name: A, parts: [box(String(unit), unit, "b"), box(String(unit), unit, "b"), box(String(unit), unit, "b")],
        says: String(TIMES * unit) },
    ], { total: String(WHOLE), label: "Every box filled in" }),
    /* and the difference the picture answers without being asked */
    m6: () => modelSvg([
      { name: B, parts: [box(String(unit), unit, "a")] },
      { name: A, parts: [box(String(unit), unit, "q"), box(String(unit), unit, "b"), box(String(unit), unit, "b")],
        above: [{ from: 1, to: 3, text: `${2 * unit} more` }] },
    ], { total: String(WHOLE), label: "How many more" }),
  };

  const PIC_IDS = Object.keys(PICS);
  /* the model is wide and its total brace hangs off the right of it, so the
     working starts clear of BOTH — at 58 wide the brace ran under the sums */
  const LX = 77;
  const line = (i) => down(12 + i * 7.6);
  const WORK = ["k0", "k1", "k2", "k3", "k4"];
  const ALL = ["q", "rule", ...PIC_IDS, ...WORK];

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    num(stage, "q", `${A} has ${TIMES} times as many as ${B}. Together, ${WHOLE}.`, 50, down(3), 0, 2.6);
    PIC_IDS.forEach((id) => art(stage, id, 28, down(28), 50, PICS[id]()));
    num(stage, "rule", "a total is a BRACE, never a number beside a bar", 28, down(48), 1, 2.2);

    num(stage, "k0", `${1} + ${TIMES} = ${TIMES + 1} units`, LX, line(0), 0, 2.5);
    num(stage, "k1", `${TIMES + 1} units = ${WHOLE}`, LX, line(1), 2, 2.5);
    num(stage, "k2", `1 unit = ${WHOLE} ÷ ${TIMES + 1} = ${unit}`, LX, line(2), 1, 2.4);
    num(stage, "k3", `${B} = ${unit},  ${A} = ${TIMES} × ${unit} = ${TIMES * unit}`, LX, line(3), 3, 2.2);
    num(stage, "k4", `${unit} + ${TIMES * unit} = ${WHOLE} ✓`, LX, line(4), 2, 2.4);
  };

  const events = [];
  let on = new Set();
  const push = (say, { show = [], off: gone = [], play = () => {} } = {}) => {
    const before = new Set(on);
    show.forEach((id) => on.add(id));
    gone.forEach((id) => on.delete(id));
    events.push({ say, before, show, play });
  };

  push("A bar model is one idea. A BAR is a thing — a length of ribbon, a number of stickers, "
    + "an amount of money — and how long it is, is how much of it there is.",
    { show: ["m1"] });
  push(`Here is a whole of ${WHOLE}, cut into two parts: ${20} and ${28}. Cutting a bar does not change it. `
    + "The parts are still the whole, which is the fact every one of these pictures is built on.");
  push("Now look at how the total is written. It is NOT a number beside the bar. It is a curly brace "
    + "UNDER the stretch it covers — and that matters, because the brace is what tells you what "
    + "the total is the total OF.", { show: ["rule"] });
  push("And whatever you are not told goes in a box with a question mark in it. The box is still drawn "
    + "the right size, because you are going to find out what it is.", { show: ["m2"], off: ["m1"] });

  push(`So here is a real question. ${A} has ${TIMES} times as many stickers as ${B}, and together they `
    + `have ${WHOLE}. How many has each?`, { show: ["q"], off: ["m2", "rule"] });
  push(`Start with the SMALLER one, always. ${B} has the fewest, so ${B} is ONE unit — one box, and `
    + "every other box in the picture will be the same size as it.", { show: ["m3"] });
  push(`And ${TIMES} times as many means ${TIMES} of that SAME box. Not a longer box — three of them. `
    + "That is what times as many looks like.");
  push(`The two of them together are ${WHOLE}, so the brace goes down the side of BOTH rows. `
    + "One brace, over everything it is the total of.");
  push(`Now count the boxes: ${B} has 1 and ${A} has ${TIMES}, which is ${TIMES + 1} units altogether.`,
    { show: ["m4", "k0"], off: ["m3"] });
  push(`And those ${TIMES + 1} units ARE the ${WHOLE}. That is the sentence the picture hands you, and `
    + "it is the one worth writing down.", { show: ["k1"] });
  push(`So one unit is ${WHOLE} shared into ${TIMES + 1}: ${unit}. Finding one unit is the whole method — `
    + "everything after it is multiplying.", { show: ["k2"], play: (S) => S.pulse("k2", 0.4) });
  push(`Write ${unit} in every box. ${B} has ${unit}, and ${A} has ${TIMES} of them, which is ${TIMES * unit}.`,
    { show: ["m5", "k3"], off: ["m4"] });
  push(`Check it, every time: ${unit} and ${TIMES * unit} is ${WHOLE} — the number you started with. `
    + "If it does not come back, one unit was wrong.", { show: ["k4"], play: (S) => S.pulse("k4", 0.4) });
  push(`And now the picture answers a question nobody asked. "How many MORE has ${A}?" `
    + `Look at it: two boxes more. ${2 * unit}. You do not work it out again — you read it off.`,
    { show: ["m6"], off: ["m5"], play: (S) => S.pulse("m6", 0.4) });
  push("That is the bar model, and it is the same three moves every time. Draw what you are told, with "
    + "the smaller thing as one unit. Find what ONE unit is worth. Multiply back up — and check.",
    { play: (S) => { S.pulse("k0", 0.2); S.pulse("k2", 0.5); S.pulse("k4", 0.8); } });

  const lay = (S, set) => ALL.forEach((id) => S.put(id, { on: set.has(id) ? 1 : 0 }));
  const steps = events.map((ev) => ({
    say: ev.say,
    show(stage, how) {
      const S = acts(stage, how.gsap, how.instant);
      lay(S, ev.before);
      ev.show.forEach((id, j) => { if (!ev.before.has(id)) S.pop(id, 0.3 + j * 0.16); });
      ev.play(S);
    },
  }));
  return { build, steps };
}

/* ═══ opening one ══════════════════════════════════════════════════════════*/

const SCENES = { ratio: ratioScene, shift: shiftScene, bar: barScene };
let tvOpen = false;

/** Play a lesson by name, with or without a strip to light up while it runs. */
export async function playLesson(kind, title = "", strip = null) {
  if (tvOpen) return;
  const made = (SCENES[kind] || ratioScene)();
  /* the stage is measured in hundredths of its own width, so --u is set when
     it is built and again whenever the window changes shape */
  const sized = (stage) => {
    made.build(stage);
    stage.querySelector(".vm-tv").style.setProperty("--u", `${stage.clientWidth / 100}px`);
  };
  tvOpen = true;
  strip?.classList.add("is-playing");
  try {
    const { openTv } = await import("/prep-math/mental-math/shared/prepbot-tv.js");
    await openTv({ title, build: sized, steps: made.steps });
    const refit = () => {
      const st = document.querySelector(".mm-tv-overlay [data-tv='stage'] .vm-tv");
      if (st) st.style.setProperty("--u", `${st.parentElement.clientWidth / 100}px`);
    };
    window.addEventListener("resize", refit);
    document.addEventListener("fullscreenchange", refit);
    const watch = new MutationObserver(() => {
      if (document.querySelector(".mm-tv-overlay")) return;
      watch.disconnect();
      window.removeEventListener("resize", refit);
      document.removeEventListener("fullscreenchange", refit);
      tvOpen = false;
      strip?.classList.remove("is-playing");
    });
    watch.observe(document.body, { childList: true });
  } catch (err) {
    tvOpen = false;
    strip?.classList.remove("is-playing");
    console.error("PrepBot's TV could not be opened", err);
  }
}

if (typeof document !== "undefined" && !document.__tvLessons) {
  document.__tvLessons = true;
  const open = (e) => {
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    const strip = e.target.closest?.(".vm-video[data-tvlesson]");
    if (!strip) return;
    e.preventDefault();
    playLesson(strip.dataset.tvlesson, strip.dataset.title || "", strip);
  };
  document.addEventListener("click", open);
  document.addEventListener("keydown", open);
}
