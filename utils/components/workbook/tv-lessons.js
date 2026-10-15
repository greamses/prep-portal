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
   The method chapter 9 of the Maths Workbook is built on, taught in the order
   it is actually used: a bar is a thing, cutting it makes the parts, and what
   you are NOT told goes in a box with a question mark.

   DRAWN, NOT REVEALED. Every bar grows from its left edge while the sentence
   about it is being said, a bar that is cut is CUT — the line comes down
   through it — and every number is written into its box afterwards, one box
   at a time. This film used to swap whole finished pictures in and out, which
   is the one thing a bar-model lesson must not do: with this method the
   drawing IS the working, so a picture that arrives complete has already done
   the lesson and left nothing to watch.

   EVERY PICTURE STANDS IN THE SAME PLACE. Each model is its own drawing with
   its own height, and a model with names and a total down its side starts its
   bars 17mm further in than one without — so centring them all on one point
   made the bars jump sideways and upwards between steps. Each is placed by
   its OWN first bar instead, so that bar's top-left corner lands on the same
   spot of the screen in every picture, and the lesson looks like one drawing
   being added to rather than a slideshow.

   And there is ONE picture per geometry, holding everything it will ever
   show. Nothing shifts under the marks — which is what forced the old version
   to swap pictures, since adding a brace to a model moves every row below it.

   The pictures are drawn by the workbook's own `modelSvg`, so the film and the
   paper cannot disagree about what a bar model looks like — including the rule
   that matters most on the page: A TOTAL IS NEVER WRITTEN BESIDE A BAR. It is
   a curly brace over the stretch it covers, because the brace is what says
   WHAT the total is the total of. `modelSvg` names its marks (`data-mb`), and
   that is how a step draws this brace and not that one.
   ------------------------------------------------------------------------*/

/** The marks of a model, addressed the way the drawing names them. */
const mb = (svg, kind, row = null) => [...(svg
  ? svg.querySelectorAll(`[data-mb="${kind}"]${row == null ? "" : `[data-mb-row="${row}"]`}`)
  : [])];
const braceOf = (svg, key) => (svg ? svg.querySelector(`[data-mb="brace"][data-mb-key="${key}"]`) : null);
const MARKS = '[data-mb="bar"], [data-mb="num"], [data-mb="name"], [data-mb="brace"], [data-mb="cut"]';
const SVGNS = "http://www.w3.org/2000/svg";

/* Where the left end and the top edge of EVERY bar sit, in width-units. The
   bars are not at the left margin: a model with row names keeps them in a
   column 17mm WIDE of its own bars, and that column has to be on the screen
   too, or the names run off the edge. */
const BAR_X = 9;
const BAR_Y = 20;
const PIC_W = 47;        // how wide a picture is drawn, in width-units

/**
 * A model placed by its own first bar rather than by its middle.
 *
 * The drawing is read for its viewBox and the corner of its first bar, both of
 * which are in the markup, so this needs no layout and works at build time.
 */
function artAt(stage, id, html, widthU) {
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html);
  const bar = /<rect[^>]*data-mb="bar"[^>]*>/.exec(html);
  const [vw, vh] = vb ? [Number(vb[1]), Number(vb[2])] : [150, 50];
  const bx = bar ? Number(/ x="([\d.]+)"/.exec(bar[0])?.[1] ?? 0) : 0;
  const by = bar ? Number(/ y="([\d.]+)"/.exec(bar[0])?.[1] ?? 0) : 0;
  const k = widthU / vw;                       // width-units per drawing unit
  const h = vh * k;                            // the tile's height, in width-units
  /* a tile is centred on its point, so its own middle is half a tile back
     from where the bar has to land */
  return art(stage, id, BAR_X + widthU / 2 - bx * k, down(BAR_Y + h / 2 - by * k), widthU, html);
}

/**
 * THE HAND THAT DRAWS A MODEL: grow a bar, cut one in two, give a part its own
 * colour, write a number into a box, draw a brace across what it spans, turn
 * one figure into another.
 *
 * Each has a "just be there" form as well, because stepping back rebuilds the
 * stage and replays every step before the one asked for, instantly — so every
 * one of these has to be able to arrive without being watched.
 */
function hand(gsap, instant) {
  /* SVG TRANSFORM ORIGINS ARE NOT CSS ONES. Asking for "center center" on a
     mark inside an SVG leaves a residual translation behind when the tween
     lands — the braces finished 16 millimetres to the left of the bars they
     were supposed to span. `svgOrigin` is given in the drawing's OWN
     coordinates, which is the only way to scale a mark about a point of
     itself and have it come to rest where it was drawn. */
  const originOf = (n, at = "center") => {
    const b = n.getBBox();
    return `${at === "left" ? b.x : b.x + b.width / 2} ${b.y + b.height / 2}`;
  };
  /* A MARK MUST END WHERE THE DRAWING PUT IT. GSAP leaves the matrix it was
     tweening on the element, and an origin it worked out for itself leaves a
     translation in that matrix — so the figures came to rest five millimetres
     above the bars they belonged in. Clearing the transform when a tween ends
     gives the mark back to the drawing, and makes the whole class of mistake
     impossible rather than merely fixed here. */
  const settle = (n) => () => gsap.set(n, { clearProps: "transform" });
  /* and the origin has to be set BEFORE the starting state is applied: a
     `fromTo` renders its "from" at once, while an origin passed in its "to"
     only takes effect when the delay runs out, so the two disagree and the
     difference is baked in as a shift. */
  const about = (n, at) => gsap.set(n, { svgOrigin: originOf(n, at) });

  const on = (n) => {
    if (!n) return;
    n.style.opacity = "1";
    n.style.fill = "";
    if (gsap) { gsap.killTweensOf(n); gsap.set(n, { clearProps: "transform" }); }
    /* a brace left half-drawn when the learner stepped back */
    n.querySelectorAll?.("path").forEach((d) => { d.style.strokeDasharray = ""; d.style.strokeDashoffset = ""; });
    n.querySelectorAll?.("text").forEach((t) => { t.style.opacity = "1"; });
  };
  /** The knife line down a bar, made on demand and kept with the drawing. */
  const knife = (svg, x, y, h) => {
    let line = svg.querySelector('[data-mb="cut"]');
    if (!line) {
      line = document.createElementNS(SVGNS, "line");
      line.setAttribute("data-mb", "cut");
      line.setAttribute("stroke", "#2a2723");
      line.setAttribute("stroke-width", "0.8");
      line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line);
    }
    line.setAttribute("x1", x); line.setAttribute("x2", x);
    line.setAttribute("y1", y - 1.6); line.setAttribute("y2", y + h + 1.6);
    line.style.opacity = "1";
    return { line, len: h + 3.2 };
  };

  if (instant || !gsap) {
    return {
      show: on, grow: on, write: on, draw: on, mark: on,
      tint: (n) => on(n),
      flip: (n, text) => { if (n) { n.textContent = text; on(n); } },
      cut: (svg, x, y, h) => { if (svg) knife(svg, x, y, h); },
    };
  }
  return {
    show: on,
    /* A BAR IS A LENGTH, so it arrives by GETTING longer — from its left end,
       the way a hand draws one. This is the thing the lesson is about. */
    grow(n, delay = 0) {
      if (!n) return;
      n.style.opacity = "1";
      about(n, "left");
      gsap.fromTo(n, { scaleX: 0 },
        { scaleX: 1, duration: 0.6, delay, ease: "power2.out", onComplete: settle(n) });
    },
    /* A BAR THAT IS CUT IS CUT. The line comes down through it like a knife,
       so the child sees the cut being MADE — a bar that merely changes colour
       in two halves has not been cut in front of anybody. */
    cut(svg, x, y, h, delay = 0) {
      if (!svg) return;
      const { line, len } = knife(svg, x, y, h);
      gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.45, delay, ease: "power2.in" });
    },
    /* and then each part takes its own colour, one after the other, so they
       are plainly two things now and not one */
    tint(n, from, delay = 0) {
      if (!n) return;
      n.style.opacity = "1";
      gsap.fromTo(n, { fill: from }, { fill: n.getAttribute("fill"), duration: 0.45, delay, ease: "power1.inOut" });
    },
    /** A mark pointed at: a small, quick swell. */
    mark(n, delay = 0) {
      if (!n) return;
      n.style.opacity = "1";
      about(n);
      gsap.fromTo(n, { scale: 1 },
        { scale: 1.05, duration: 0.22, delay, yoyo: true, repeat: 1, ease: "power1.inOut", onComplete: settle(n) });
    },
    /* A NUMBER IS WRITTEN INTO A BOX: it lands in it, one box at a time, in
       reading order. It does not fade up — that looks like a label appearing,
       not like somebody writing. */
    write(n, delay = 0) {
      if (!n) return;
      about(n);
      gsap.fromTo(n, { opacity: 0, scale: 0.35 },
        { opacity: 1, scale: 1, duration: 0.36, delay, ease: "back.out(2.4)", onComplete: settle(n) });
    },
    /* A BRACE IS DRAWN ACROSS what is already there, so it is drawn the way a
       line is drawn: the stroke itself runs from one end to the other, and the
       words land on it once it has arrived. Nothing is scaled, so nothing can
       end up spanning the wrong bars. */
    draw(g, delay = 0) {
      if (!g) return;
      g.style.opacity = "1";
      const path = g.querySelector("path");
      const label = g.querySelector("text");
      if (path) {
        const len = path.getTotalLength();
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
          strokeDashoffset: 0, duration: 0.55, delay, ease: "power2.out",
          onComplete() { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; },
        });
      }
      if (label) gsap.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: delay + 0.42 });
    },
    /* "?" becoming 12. The box does not empty and refill: the figure turns
       over in place, so it is plainly the same box being answered. */
    flip(n, text, delay = 0) {
      if (!n) return;
      about(n);
      gsap.timeline({ delay, onComplete: settle(n) })
        .set(n, { opacity: 1 })
        .to(n, { scaleY: 0, duration: 0.16, ease: "power1.in" })
        .add(() => { n.textContent = text; })
        .to(n, { scaleY: 1, duration: 0.3, ease: "back.out(2.2)" });
    },
  };
}

function barScene() {
  const WHOLE = 48;                      // the total in the problem
  const TIMES = 3;                       // Ben has three times as many as Amy
  const unit = WHOLE / (TIMES + 1);      // 12
  const A = "Ben", B = "Amy";
  const P1 = 20, P2 = WHOLE - P1;        // the two parts of the opening bar
  const MORE = (TIMES - 1) * unit;       // what the last brace reads

  const part = (text, value, tone) => ({ text, value, tone });
  const ask = (tone) => part("?", unit, tone);

  const PICS = {
    /* The whole bar carries the SAME brace underneath as the cut one — never
       shown, only reserving the room for it — so that the two drawings are
       the same height and the bar does not hop up the screen at the cut. */
    pw: () => modelSvg([{ parts: [part(String(WHOLE), WHOLE, "a")],
      below: [{ from: 0, to: 1, text: String(WHOLE) }] }], { label: "One bar" }),
    pc: () => modelSvg([{ parts: [part(String(P1), P1, "a"), part(String(P2), P2, "b")], says: String(WHOLE) }],
      { label: "A bar cut into two parts" }),
    pr: () => modelSvg([
      { name: B, parts: [ask("a")], above: [{ from: 0, to: 1, text: "1 unit" }] },
      { name: A, parts: [ask("b"), ask("b"), ask("b")],
        above: [{ from: 1, to: TIMES, text: `${MORE} more` }],
        below: [{ from: 0, to: TIMES, text: `${TIMES} units` }] },
    ], { total: String(WHOLE), label: "One unit against three" }),
  };
  const PIC_IDS = Object.keys(PICS);

  /* What each stage of a picture puts on the paper, and in what order a hand
     would put it there. A step names the stages it adds; the stages before it
     are put straight on. `stage` is passed because the cut has to be made at
     the very place the parts will divide, which only the cut drawing knows. */
  const STAGES = {
    "pw.bar": (s, H) => H.grow(mb(s, "bar")[0]),
    "pw.num": (s, H) => H.write(mb(s, "num")[0]),
    "pw.cut": (s, H, stage) => {
      const bar = mb(s, "bar")[0];
      const at = mb(stage.querySelector('[data-t="pc"] svg'), "bar")[1];
      if (bar && at) H.cut(s, Number(at.getAttribute("x")), Number(bar.getAttribute("y")), Number(bar.getAttribute("height")));
    },
    /* two parts now, and they are shown ONE AFTER THE OTHER — the left one
       pointed at, then the right one taking a colour of its own */
    "pc.parts": (s, H) => {
      const [b0, b1] = mb(s, "bar");
      H.show(b0); H.mark(b0, 0.1);
      H.show(b1); H.tint(b1, b0.getAttribute("fill"), 0.6);
    },
    "pc.nums": (s, H) => mb(s, "num").forEach((n, i) => H.write(n, 0.25 + i * 0.55)),
    "pc.total": (s, H) => H.draw(braceOf(s, "below-0-0"), 0.25),
    "pc.ask": (s, H) => H.flip(mb(s, "num")[1], "?", 0.3),

    "pr.amy": (s, H) => {
      H.write(mb(s, "name")[0]);
      H.grow(mb(s, "bar", 0)[0], 0.3);
      H.write(mb(s, "num", 0)[0], 0.9);
    },
    /* three bars, drawn one after the other — which is the point of the step:
       it is three of the SAME box, not one longer one */
    "pr.ben": (s, H) => {
      H.write(mb(s, "name")[1]);
      mb(s, "bar", 1).forEach((n, i) => H.grow(n, 0.3 + i * 0.5));
      mb(s, "num", 1).forEach((n, i) => H.write(n, 0.9 + i * 0.5));
    },
    "pr.total": (s, H) => H.draw(braceOf(s, "total"), 0.25),
    "pr.units": (s, H) => { H.draw(braceOf(s, "above-0-0"), 0.2); H.draw(braceOf(s, "below-1-0"), 0.6); },
    /* THE NUMBER ENTRY the whole lesson is aimed at: every "?" turns into 12,
       one box after another, so the child sees the unit being carried round
       the picture rather than an answered picture appearing */
    "pr.filled": (s, H) => mb(s, "num").forEach((n, i) => H.flip(n, String(unit), 0.25 + i * 0.55)),
    "pr.more": (s, H) => H.draw(braceOf(s, "above-1-0"), 0.25),
  };
  const picOf = (key) => key.split(".")[0];

  const WORK = ["k0", "k1", "k2", "k3", "k4"];
  const TILES = ["q", "rule", ...PIC_IDS, ...WORK];
  const LX = 77;
  const line = (i) => down(12 + i * 7.6);

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    num(stage, "q", `${A} has ${TIMES} times as many as ${B}. Together, ${WHOLE}.`, 50, down(3), 0, 2.6);
    PIC_IDS.forEach((id) => artAt(stage, id, PICS[id](), PIC_W));
    num(stage, "rule", "a total is a BRACE, never a number beside a bar", 36, down(38), 1, 2.0);

    num(stage, "k0", `1 + ${TIMES} = ${TIMES + 1} units`, LX, line(0), 0, 2.5);
    num(stage, "k1", `${TIMES + 1} units = ${WHOLE}`, LX, line(1), 2, 2.5);
    num(stage, "k2", `1 unit = ${WHOLE} ÷ ${TIMES + 1} = ${unit}`, LX, line(2), 1, 2.4);
    num(stage, "k3", `${B} = ${unit},  ${A} = ${TIMES} × ${unit} = ${TIMES * unit}`, LX, line(3), 3, 2.2);
    num(stage, "k4", `${unit} + ${TIMES * unit} = ${WHOLE} ✓`, LX, line(4), 2, 2.4);
  };

  const events = [];
  let tiles = new Set();
  let drawn = [];
  const push = (say, { on = [], off = [], add = [], play = () => {} } = {}) => {
    const beforeTiles = new Set(tiles);
    const beforeDrawn = drawn.slice();
    on.forEach((t) => tiles.add(t));
    off.forEach((t) => tiles.delete(t));
    drawn = [...drawn, ...add];
    events.push({ say, beforeTiles, beforeDrawn, on, off, add, play });
  };

  /* ── what a bar is ─────────────────────────────────────────────────────*/
  push("Right then, let us start with what a bar actually IS, because every single thing after this "
    + "comes out of it. A bar is something you have got — a length of ribbon, a pile of stickers, "
    + "money in a tin. And the LENGTH of the bar is how much of it there is. That is the whole trick: "
    + "a long bar means a lot, a short bar means a little, and you can see which is which without "
    + "counting a thing.",
    { on: ["pw"], add: ["pw.bar"] });

  push(`So this bar is ${WHOLE}. ${WHOLE} stickers, let us say. And notice where I have written the `
    + `${WHOLE} — INSIDE the bar, because the bar IS the ${WHOLE}. They are not two different things. `
    + "Now watch very carefully, because I am going to cut it.",
    { add: ["pw.num"] });

  push("There. Straight down, right through it. Now the cut is the whole point of this lesson, so look "
    + "hard at what has changed and what has not. The LENGTH has not changed — not a millimetre of it. "
    + "All I have done is decide where one part stops and the next one starts. That is the only thing "
    + "cutting a bar ever does.",
    { add: ["pw.cut"] });

  push("So now I have two parts where I had one thing. This piece on the left. And this piece on the "
    + "right, which I will give a colour of its own so you can tell them apart at a glance. And here is "
    + `the fact that every one of these pictures rests on, so say it back to me: the parts together ARE `
    + `the whole. It was ${WHOLE} before I cut it and it is ${WHOLE} after.`,
    { on: ["pc"], off: ["pw"], add: ["pc.parts"] });

  push(`This part here is ${P1}, so the other one has to be ${P2} — because the two of them have to `
    + `come home to ${WHOLE}. And look at the LENGTHS while you are there: the ${P2} is visibly longer `
    + `than the ${P1}, exactly as it ought to be. These pictures are drawn to scale, so a bar model `
    + "will never tell you a lie about which amount is the bigger one.",
    { add: ["pc.nums"] });

  push("Now the total, and watch WHERE I put it, because this is the bit people get wrong. It does "
    + "NOT go in a space next to the bar. It goes on a curly brace underneath, and the brace stretches "
    + "across exactly the bit it is the total OF. Why does that matter so much? Because a number "
    + "sitting beside a bar does not tell you what it is counting. The brace does. It says: all of "
    + `THIS, the whole stretch, comes to ${WHOLE} — and you can see what "this" is.`,
    { on: ["rule"], add: ["pc.total"] });

  push("And now the only other thing you need before we start. When you are not TOLD a number, you "
    + "do not leave the box empty and you certainly do not guess — you put a question mark in it, and "
    + "you still draw the box the right size. That question mark is a promise: I do not know this yet, "
    + "but I am going to. Honestly, half of getting these right is being willing to draw a box you "
    + "cannot label.",
    { add: ["pc.ask"] });

  /* ── a real question ──────────────────────────────────────────────────*/
  push(`Right. A real question, the sort that turns up in a test. ${A} has ${TIMES} times as many `
    + `stickers as ${B}, and between the two of them they have ${WHOLE}. How many has each of them? `
    + "Now, you could sit there and try numbers until a pair of them works. We are not going to do "
    + "that. We are going to draw it, and then the drawing will simply tell us.",
    { on: ["q"], off: ["pc", "rule"] });

  push(`Always start with the SMALLER one. ${B} has the fewest, so ${B} gets ONE box — and that box is `
    + "now our unit, our measuring stick for the whole picture. Every other box I draw will be exactly "
    + "the same size as this one. That is the decision the entire question hangs on, so say it out "
    + "loud as you draw it: the smallest one is one unit.",
    { on: ["pr"], add: ["pr.amy"] });

  push(`And now "${TIMES} times as many" — watch this, because it catches very nearly everybody. It `
    + `does NOT mean draw ${A} one longer box. It means draw ${TIMES} of ${B}'s box, and I am drawing `
    + "them one at a time so you can count them going on. One. Two. Three — three of the same, side by "
    + "side. If you ever catch yourself drawing one long bar for three times as many, stop and cut it "
    + "into three, because in a minute it is the COUNTING of those boxes that does all the work.",
    { add: ["pr.ben"] });

  push(`The two of them together have ${WHOLE}. Together — both rows — so the brace cannot sit on one `
    + "row, can it? It has to come down the side of BOTH of them. One brace, round everything it is "
    + `the total of. And if you brace only ${A}'s row, you have just written down something that is `
    + "not true, and the rest of your working will do as it is told and go wrong.",
    { add: ["pr.total"] });

  push(`Now count the boxes. ${B} has 1. ${A} has ${TIMES}. One and ${TIMES} is ${TIMES + 1}, so there `
    + `are ${TIMES + 1} units in this picture altogether — and every one of them is the same size, `
    + "which is the only reason counting them is allowed at all. I am writing that down, because it is "
    + "the first real line of working.",
    { add: ["pr.units"], on: ["k0"] });

  push(`And here is the sentence the picture hands you for nothing: those ${TIMES + 1} units ARE the `
    + `${WHOLE}. Not roughly the ${WHOLE} — they are it, because between them they cover the whole `
    + `brace, and the brace says ${WHOLE}. So: ${TIMES + 1} units equals ${WHOLE}. Write that down as `
    + "well. Everything left to do comes out of that one line.",
    { on: ["k1"] });

  push(`So if ${TIMES + 1} units are ${WHOLE}, then ONE unit is ${WHOLE} shared into ${TIMES + 1}, `
    + `which is ${unit}. And that is the method — that is the bar model, right there. Finding what one `
    + "unit is worth is the mountain; every single thing after it is multiplying. If you can get "
    + "yourself to “one unit equals”, you have done the hard part.",
    { on: ["k2"], play: (S) => S.pulse("k2", 0.4) });

  push(`So ${unit} goes in every box. EVERY box — they are all the same size, so they all hold the `
    + `same. Watch them fill up, one at a time. ${B} has one of them, so ${B} has ${unit}. ${A} has `
    + `${TIMES} of them, so ${A} has ${TIMES} ${unit}s, which is ${TIMES * unit}. And notice what I did `
    + `NOT do: I did not work ${A}'s out from scratch. I found one unit and multiplied it back up.`,
    { add: ["pr.filled"], on: ["k3"] });

  push(`Now check it. Every time, and check it against the number you were GIVEN. ${unit} and `
    + `${TIMES * unit} is ${WHOLE} — which is what the question said the two of them had between them. `
    + "It comes home. And if it had not come home, then one unit was wrong, and so was everything "
    + "built on top of it — far better to find that out here than to find it out in the marking.",
    { on: ["k4"], play: (S) => S.pulse("k4", 0.4) });

  push(`And now the best part. The picture answers questions nobody even asked it. "How many MORE has `
    + `${A} than ${B}?" Do not work it out again — LOOK at it. ${A} has two boxes more than ${B}, and a `
    + `box is ${unit}, so it is ${MORE}. You read it straight off the drawing. That is what you get for `
    + "drawing the thing properly: one picture, and every question about it is already answered on it.",
    { add: ["pr.more"], play: (S) => S.pulse("k0", 0.1) });

  push("So — three moves, and they are the same three every single time. Draw what you are told, with "
    + "the smallest thing as one unit. Find what ONE unit is worth. Then multiply back up, and check it "
    + "comes home. Ribbon, money, stickers, sweets, people on a bus — it genuinely does not matter what "
    + "the question is about. Bars, count the units, find one unit, multiply back.",
    { play: (S) => { S.pulse("k0", 0.2); S.pulse("k2", 0.5); S.pulse("k4", 0.8); } });

  const svgOf = (stage, id) => stage.querySelector(`[data-t="${id}"] svg`);

  const steps = events.map((ev) => ({
    say: ev.say,
    show(stage, how) {
      const S = acts(stage, how.gsap, how.instant);
      const already = hand(how.gsap, true);              // the replay: no watching
      const H = hand(how.gsap, how.instant);             // this step, drawn

      /* the tiles as they stood before this step — and then the ones this
         step CLEARS, at once rather than fading, because the picture replacing
         one of them stands in the same place: a bar that fades out from under
         its replacement is read as two bars */
      TILES.forEach((id) => S.put(id, { on: ev.beforeTiles.has(id) ? 1 : 0 }));
      ev.off.forEach((id) => S.put(id, { on: 0 }));
      /* every mark of every picture off, then the ones already drawn put back
         at once — the stage is rebuilt for each step, so a "?" that was turned
         over into a 12 has to be turned over again on the way past */
      PIC_IDS.forEach((id) => {
        const svg = svgOf(stage, id);
        if (svg) svg.querySelectorAll(MARKS).forEach((n) => { n.style.opacity = "0"; });
      });
      ev.beforeDrawn.forEach((k) => STAGES[k](svgOf(stage, picOf(k)), already, stage));

      /* and this step's own: a picture is simply switched on, because it is its
         MARKS that are drawn — popping the whole tile would zoom the model in
         and bury the one thing worth watching */
      ev.on.forEach((id, j) => {
        if (ev.beforeTiles.has(id)) return;
        if (PICS[id]) S.put(id, { on: 1 }); else S.pop(id, 0.2 + j * 0.12);
      });
      ev.add.forEach((k) => STAGES[k](svgOf(stage, picOf(k)), H, stage));
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
