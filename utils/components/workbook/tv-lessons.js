/* ============================================================================
   TWO OF PREPBOT'S LESSONS: a shop bill, and the box method for ratios
   ----------------------------------------------------------------------------
   Both play on the shared teacher's TV (mental-math/shared/prepbot-tv.js) and
   are built from the same kit as the division and algebra films (vedic
   explain.js `tile`, `art`, `acts`): a scene is written in hundredths of the
   screen, and every step first LAYS the screen as it stood before it and then
   plays only its own change, so stepping back or skipping lands exactly where
   it should.

   THE SHOP BILL is the Toy Shop's own sum, worked slowly: two at a price, a
   percentage off, a second line, the subtotal, the tax, the total, and the
   change counted back into your hand. Every figure arrives one at a time
   beside the one it came from, because the thing a child cannot see at a real
   till is the ORDER — what is worked out before what.

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

/* ═══ the shop bill ════════════════════════════════════════════════════════*/

const TEDDY = `<svg viewBox="0 0 64 64">
  <circle cx="18" cy="16" r="7" fill="#d9a05b"/><circle cx="46" cy="16" r="7" fill="#d9a05b"/>
  <circle cx="32" cy="24" r="14" fill="#e8b878"/>
  <ellipse cx="32" cy="29" rx="6.5" ry="5" fill="#f6e7d8"/>
  <circle cx="27" cy="21" r="1.9" fill="${INK}"/><circle cx="37" cy="21" r="1.9" fill="${INK}"/>
  <path d="M20 38h24a8 8 0 0 1 8 8v8a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6v-8a8 8 0 0 1 8-8z" fill="#e8b878"/>
  <ellipse cx="32" cy="48" rx="7" ry="8" fill="#f6e7d8"/></svg>`;

const KITE = `<svg viewBox="0 0 64 64">
  <path d="M32 4L54 30 32 58 10 30z" fill="#7cc47c" stroke="#3f8f4f" stroke-width="2.5"/>
  <path d="M32 4v54M10 30h44" stroke="#3f8f4f" stroke-width="2"/></svg>`;

/* the lettering is sized to what the tag has to hold: "20% off" at the price
   tag's size ran out through the hole the string goes through */
const TAG = (text, tone) => {
  const fs = Math.min(24, Math.round(134 / Math.max(1, String(text).length)));
  return `<svg viewBox="0 0 120 54"><path d="M4 8h92l20 19-20 19H4z" fill="${tone}" stroke="${INK}" stroke-width="3"/>`
    + `<circle cx="99" cy="27" r="4" fill="#fffdf8" stroke="${INK}" stroke-width="2"/>`
    + `<text x="48" y="29" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace"`
    + ` font-size="${fs}" font-weight="800" fill="${INK}">${text}</text></svg>`;
};

function shopScene() {
  /* the Toy Shop's own numbers, so the film and the shop agree */
  const each = 12.5, qty = 2, off = 20;
  const gross = each * qty;                 // 25.00
  const ten = gross / 10;                   // 2.50
  const cut = ten * 2;                      // 5.00
  const net = gross - cut;                  // 20.00
  const kEach = 4, kQty = 3, kLine = 12;    // the second line
  const sub = net + kLine;                  // 32.00
  const tax = sub / 10;                     // 3.20
  const total = sub + tax;                  // 35.20
  const paid = 40;
  const change = paid - total;              // 4.80

  const LX = 62;                            // where the working is written
  const line = (i) => down(5.5 + i * 5.5);  // nine lines, all above BOTTOM

  const ids = {
    lines: ["w0", "w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8"],
  };
  const ALL = ["q", "t1", "t2", "tag", "pct", "k1", "k2", "k3", "ktag", ...ids.lines];

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    num(stage, "q", "What does the basket come to?", 50, down(2.6), 0, 3);

    art(stage, "t1", 9, down(12), 8.5, TEDDY);
    art(stage, "t2", 18.5, down(12), 8.5, TEDDY);
    art(stage, "tag", 14, down(20), 12, TAG(money(each), "#fff3a8"));
    art(stage, "pct", 14, down(27), 12, TAG(`${off}% off`, "#f6c6c2"));

    art(stage, "k1", 8, down(38), 6.4, KITE);
    art(stage, "k2", 14.5, down(38), 6.4, KITE);
    art(stage, "k3", 21, down(38), 6.4, KITE);
    art(stage, "ktag", 14.5, down(46), 11, TAG(money(kEach), "#fff3a8"));

    num(stage, "w0", `${qty} × ${money(each)} = ${money(gross)}`, LX, line(0), 0, 2.7);
    num(stage, "w1", `10% of ${money(gross)} = ${money(ten)}`, LX, line(1), 3, 2.7);
    num(stage, "w2", `${off}% = twice that = ${money(cut)}`, LX, line(2), 3, 2.7);
    num(stage, "w3", `${money(gross)} − ${money(cut)} = ${money(net)}`, LX, line(3), 1, 2.7);
    num(stage, "w4", `${kQty} × ${money(kEach)} = ${money(kLine)}`, LX, line(4), 2, 2.7);
    num(stage, "w5", `${money(net)} + ${money(kLine)} = ${money(sub)}`, LX, line(5), 0, 2.7);
    num(stage, "w6", `tax 10% of ${money(sub)} = ${money(tax)}`, LX, line(6), 3, 2.7);
    num(stage, "w7", `${money(sub)} + ${money(tax)} = ${money(total)}`, LX, line(7), 4, 2.7);
    num(stage, "w8", `${money(paid)} − ${money(total)} = ${money(change)}`, LX, line(8), 2, 2.7);
  };

  const events = [];
  let on = new Set();
  const push = (say, { show = [], off: gone = [], play = () => {} } = {}) => {
    const before = new Set(on);
    show.forEach((id) => on.add(id));
    gone.forEach((id) => on.delete(id));
    events.push({ say, before, show, play });
  };

  push("Two teddy bears are in the basket, and the shelf says each one is twelve prepbills and fifty.",
    { show: ["q", "t1", "t2", "tag"] });
  push(`Two of them, at ${money(each)} each. ${money(each)} and ${money(each)} is ${money(gross)}. `
    + "Always do the multiplying first, before anything is taken off.",
    { show: ["w0"], play: (S) => { S.pulse("t1", 0.2); S.pulse("t2", 0.4); } });
  push(`But the teddies have a sale tag: ${off} per cent off. ${off} per cent OF the ${money(gross)} — not off the shelf price, off the line.`,
    { show: ["pct"], play: (S) => S.pulse("pct", 0.3) });
  push(`Ten per cent is the easy one: it is ${money(gross)} with the figures slid one place to the right, which is ${money(ten)}.`,
    { show: ["w1"] });
  push(`And ${off} per cent is twice ten per cent. Twice ${money(ten)} is ${money(cut)}. That is what the sale takes off.`,
    { show: ["w2"], play: (S) => S.pulse("w2", 0.3) });
  push(`So take it off: ${money(gross)} less ${money(cut)} leaves ${money(net)}. The teddy line is ${money(net)}.`,
    { show: ["w3"], play: (S) => S.pulse("w3", 0.4) });
  push(`There are three kites too, at ${money(kEach)} each. Three fours are twelve, so that line is ${money(kLine)}.`,
    { show: ["k1", "k2", "k3", "ktag", "w4"] });
  push(`Now add the lines up: ${money(net)} and ${money(kLine)} is ${money(sub)}. That is the subtotal — what the toys cost.`,
    { show: ["w5"], play: (S) => { S.dim("w0", 0.35, 0.2); S.dim("w1", 0.35, 0.2); S.dim("w2", 0.35, 0.2); } });
  push(`The tax comes LAST, and it is worked out on the subtotal, not on one toy. Ten per cent of ${money(sub)} is ${money(tax)}.`,
    { show: ["w6"] });
  push(`Add it on: ${money(sub)} and ${money(tax)} is ${money(total)}. That is the number to pay.`,
    { show: ["w7"], play: (S) => S.pulse("w7", 0.4) });
  push(`Say you hand over ${money(paid)}. The change is ${money(paid)} take away ${money(total)} — which is ${money(change)}.`,
    { show: ["w8"] });
  push(`And you can check it the way a shopkeeper does: count UP from ${money(total)}. `
    + `Eighty makes thirty-six, then thirty-seven, thirty-eight, thirty-nine, forty. Four prepbills and eighty — ${money(change)}.`,
    { play: (S) => S.pulse("w8", 0.3) });

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

/* ═══ opening one ══════════════════════════════════════════════════════════*/

const SCENES = { shop: shopScene, ratio: ratioScene, shift: shiftScene };
let tvOpen = false;

/** Play a lesson by name, with or without a strip to light up while it runs. */
export async function playLesson(kind, title = "", strip = null) {
  if (tvOpen) return;
  const made = (SCENES[kind] || shopScene)();
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
