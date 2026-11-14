/* ============================================================================
   RATIO, FROM THE BEGINNING — three lessons before the question films
   ----------------------------------------------------------------------------
   The user asked for three introductions to ratio:
     1  ratioWhat      what a ratio is; ratio or actual values; increasing and
                       decreasing in a ratio; scaling
     2  ratioParts     part to part, part to whole, part to difference — and
                       spotting which one a problem gives you (a sum, a
                       difference, or one person's share)
     3  ratioCompound  compound ratio: joining A : B and B : C through the one
                       they share, and multiplying ratios

   Same kit as the question films (./cbt-ratio.js): bars from the workbook's own
   modelSvg (every box the same size), one working line under the picture, a
   receipt naming the idea, MathJax, a title card before each idea. Each opens
   on its word problem and answers it.
   ========================================================================== */

import { modelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";
import { braceOf, film, mb, part } from "./film-kit.js";
import { mathLoad, mathifyPic, texAt } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W, K_ } from "./cbt-films.js";
import { rollAsk, rollAskRatio, swapWord } from "./film-ask.js";
import { tableLine, tableCol } from "./film-table.js";

const BLUE = "#2f6f8f", GREEN = "#2f7d4a", PURPLE = "#6b4fa0";
/* the same step as EQUIVALENT FRACTIONS, beside the ratio */
const FR = (a, b, c, d) => [L("g", "\\qquad"), L("f", `\\dfrac{${a}}{${b}} = \\dfrac{${c}}{${d}}`, PURPLE)];

/* ── the shared pieces ─────────────────────────────────────────────────── */
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const main = (pieces, em = 8) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
const side = (rows, em = 4.6) => svgBox(48, 12 * rows.length + 4, rows.map((pieces, i) => mathRow(pieces, { cx: 24, y: 9 + i * 12, em }).svg).join(""));
const at = (y) => centred(150, y);
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const write = (s, H, keys, start = 0, gap = 0.35) => keys.forEach((k, i) => { const n = key(s, k); if (n) H.write(n, start + i * gap); });
const TONES = ["a", "b", "c", "d"];

/** A bar per row: `counts` boxes each, all the same size; `text` in every box (or ""). */
function bars(names, counts, { text = "", cap = null, unit = 1, below = {}, above = {}, total = null } = {}) {
  const maxR = Math.max(...counts);
  const CAP = cap || Math.min(22, 104 / (maxR * unit));
  const rows = counts.map((n, i) => ({
    name: names[i],
    parts: Array.from({ length: n }, () => part(text, unit, TONES[i % 4])),
    ...(below[i] ? { below: below[i] } : {}),
    ...(above[i] ? { above: above[i] } : {}),
  }));
  return mathifyPic(modelSvg(rows, { cap: CAP, label: "", ...(total ? { total } : {}) }));
}
/** Where a bar picture sits so it is centred, whatever its width. */
function barAt(maxBoxes, unit = 1, cap = null, hasTotal = false) {
  const CAP = cap || Math.min(22, 104 / (maxBoxes * unit));
  const W = 18 + maxBoxes * unit * CAP + (hasTotal ? 18 : 0);
  return { x: 50 - (W * K_) / 2 + 18 * K_, y: 15 };
}
const rowStage = (i) => (s, H) => {
  const ns = mb(s, "name")[i], bs = mb(s, "bar", i);
  if (ns) H.write(ns, 0);
  bs.forEach((b, j) => H.grow(b, 0.3 + j * Math.min(0.25, 2.4 / Math.max(1, bs.length))));
};
const showBars = (s, H) => { mb(s, "name").forEach((n) => H.show(n)); mb(s, "bar").forEach((n) => H.show(n)); };
const fill = (s, H) => mb(s, "num").forEach((n, i) => H.write(n, i * 0.08));
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });

/* ── BOXES THAT CUT AND MERGE ─────────────────────────────────────────────
   *"Use the boxes to show how ratio scales. If it goes up, it cuts, if it goes down it merges.
   Always show merging animation."* A row is one long box with its dividing lines drawn SEPARATELY
   (each its own mark), so a ratio going up is lines being DRAWN through the boxes (a cut), and
   going down is lines FADING (two boxes merging into one). The rows share one box size, so the
   bars keep their length whatever happens to the numbers.
     rows   [{ name, n }]   n: the finest cells the row is ever cut into
     unit   the width of one finest cell (picture units; 150 across)
     labels { key: { every, text } }  a number written in each merged box of `every` cells */
const SKY = "#bfe3ff", BUTTER = "#fff3a8", INKC = "#2a2723";
function boxRows(rows, unit, labels = {}) {
  const X0 = 26, ROW = 11, GAP = 6, TOP = 4;
  let out = "";
  rows.forEach((r, i) => {
    const y = TOP + i * (ROW + GAP), w = r.n * unit;
    out += texAt(`\\text{${r.name}}`, X0 - 3, y + ROW * 0.68, { em: 4.4, anchor: "end", attrs: 'data-mb="name"' });
    out += `<rect data-mb="bar" data-mb-row="${i}" x="${X0}" y="${y}" width="${w.toFixed(2)}" height="${ROW}" fill="${r.fill || (i % 2 ? BUTTER : SKY)}" stroke="${INKC}" stroke-width="0.7"/>`;
    for (let k = 1; k < r.n; k++) {
      const x = (X0 + k * unit).toFixed(2);
      out += `<g data-mb="brace" data-mb-key="d${i}-${k}"><path d="M${x} ${y} V${y + ROW}" fill="none" stroke="${INKC}" stroke-width="0.55"/></g>`;
    }
    Object.entries(labels).forEach(([key, { every, text }]) => {
      for (let g = 0; g < r.n / every; g++) {
        out += texAt(text, X0 + (g + 0.5) * every * unit, y + ROW * 0.7, { em: 4.6, attrs: `data-mb="num" data-k="${key}-${i}-${g}"` });
      }
    });
  });
  return svgBox(150, TOP * 2 + rows.length * ROW + (rows.length - 1) * GAP, out);
}
const divs = (s, row, keep) => [...(s?.querySelectorAll(`[data-mb-key^="d${row}-"]`) || [])]
  .filter((g) => keep(Number(g.dataset.mbKey.split("-")[1])));
/** Grow a row, then draw its lines that pass `which`, one after another. */
const growRow = (row, which, gap = 0.06) => (s, H) => {
  const n = mb(s, "name")[row], bar = s?.querySelector(`[data-mb="bar"][data-mb-row="${row}"]`);
  if (n) H.write(n, 0);
  if (bar) H.grow(bar, 0.15);
  divs(s, row, which).forEach((g, j) => H.draw(g, 0.75 + j * gap));
};
/** CUT: draw the lines that pass `which`, in every row. */
const cutRows = (rows, which, gap = 0.05) => (s, H) => rows.forEach((row) => divs(s, row, which).forEach((g, j) => H.draw(g, 0.1 + j * gap)));
/** MERGE: the lines that pass `which` fade, and each merged box gets its number. */
const mergeRows = (rows, which, labelKey = null) => (s, H) => {
  /* only the lines ON the paper merge away; a line not yet drawn (a later cut) is left for later */
  rows.forEach((row) => H.fade(divs(s, row, which).filter((g) => g.style.opacity !== "0"), 0.15));
  if (labelKey) [...(s?.querySelectorAll(`[data-k^="${labelKey}-"]`) || [])].forEach((n, i) => H.write(n, 0.9 + i * 0.12));
};
const showRows = (rows, which) => (s, H) => {
  mb(s, "name").forEach((n) => H.show(n));
  rows.forEach((row) => { H.show(s?.querySelector(`[data-mb="bar"][data-mb-row="${row}"]`)); divs(s, row, which).forEach((g) => H.show(g)); });
};

/* ═══ 1. WHAT A RATIO IS ═══════════════════════════════════════════════════ */
/* THE ROLLING RATIO: one line, "a : b" with its fraction a/b beside it and what was done over the
   colon, whose figures roll to each new value. The same comparison is never written out again as
   a new line; the numbers turn over, up when the boxes are cut, down when they merge. */
function ratioRoller() {
  const T = (k, x, y, size, anchor, fill = INKC, w = 400) => `<text data-k="${k}" x="${x}" y="${y}" text-anchor="${anchor}" font-family="STIX Two Text, Cambria Math, serif" font-weight="${w}" font-size="${size}" fill="${fill}">0</text>`;
  return svgBox(150, 30, `<g data-mb="num" data-k="rs">`
    + T("ra", 58, 21, 13, "end") + `<text x="63" y="20" text-anchor="middle" font-family="STIX Two Text, serif" font-size="13" fill="${INKC}">:</text>` + T("rb", 68, 21, 13, "start")
    + T("op", 63, 8.5, 6, "middle", "#c0453f", 700)
    + T("fn", 104, 13.5, 8.5, "middle", PURPLE) + `<line x1="97" y1="16.2" x2="111" y2="16.2" stroke="${PURPLE}" stroke-width="0.7"/>` + T("fd", 104, 24.5, 8.5, "middle", PURPLE)
    + `</g>`);
}
/** Roll the ratio line to a : b (and its fraction), with `op` written over the colon */
const rollTo = (a, b, op = "") => (s, H) => {
  const instant = H.show === H.grow;
  const g = key(s, "rs");
  if (g) H.show(g);
  const set = (k, v) => {
    const el = key(s, k);
    if (!el) return;
    const from = Number(el.textContent) || 0;
    if (instant || from === v || from === 0) { el.textContent = String(v); return; }
    const t0 = performance.now();
    const tick = (now) => {
      if (!el.isConnected) return;
      const t = Math.min(1, (now - t0) / 900);
      el.textContent = String(Math.round(from + (v - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  set("ra", a); set("rb", b); set("fn", a); set("fd", b);
  const o = key(s, "op");
  if (o) o.textContent = op;
  if (!instant && op) H.sound("tick", 0);
};
/** roll the numbers in the question itself (./film-ask.js rollAsk) */
const rollQ = (pairs) => (svg, H, stage) => {
  const inner = stage?.querySelector('[data-t="a1"]')?.firstChild;
  pairs.forEach(([from, to]) => rollAsk(inner, from, to, { instant: H.show === H.grow }));
};

export function ratioWhat() {
  const PRICE = ["Old", "New"];
  const at15 = centred(150, 15);
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "A class has 12 boys and 8 girls. What is the ratio of boys to girls?" },
      { id: "a2", text: "A price of $80 is increased in the ratio 5:4. What is the new price?" },
    ],
    pics: {
      g12: () => boxRows([{ name: "Boys", n: 12 }, { name: "Girls", n: 8 }], 100 / 12, { m4: { every: 4, text: "4" } }),
      g30: () => boxRows([{ name: "Boys", n: 30 }, { name: "Girls", n: 20 }], 100 / 30, { m10: { every: 10, text: "10" } }),
      gS: () => boxRows([{ name: "Boys", n: 36 }, { name: "Girls", n: 24 }], 100 / 36),
      p1: () => bars(PRICE, [4, 5], { below: { 0: [{ from: 0, to: 4, text: "$80" }] } }),
      p2: () => bars(PRICE, [4, 5], { text: "20", below: { 0: [{ from: 0, to: 4, text: "$80" }] } }),
      p3: () => bars(PRICE, [4, 3], { text: "20", below: { 0: [{ from: 0, to: 4, text: "$80" }] } }),
      rs: () => ratioRoller(),
      s1: () => side([[L("a", "\\text{actual: } 12,\\ 8")], [L("b", "\\text{ratio: } 3 : 2", BLUE)]]),
      m4: () => main([L("a", "80 \\div 4"), L("e", "="), L("b", "20", BLUE)]),
      m5: () => main([L("a", "5 \\times 20"), L("e", "="), L("b", "\\$100", GREEN)]),
      m6: () => main([L("a", "3 \\times 20"), L("e", "="), L("b", "\\$60", GREEN)]),
    },
    picAt: {
      g12: at15, g30: at15, gS: at15, p1: barAt(5), p2: barAt(5), p3: barAt(4),
      rs: at(37.5), m4: at(37.5), m5: at(37.5), m6: at(37.5), s1: { x: 79.5, y: 16 },
    },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "What a ratio is", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Ratio or actual value?", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Increase and decrease", y: 50.5 },
      { id: "k4", receipt: true, sub: "Idea 4", text: "Scaling: cut up, merge down", y: 50.5 },
    ],
    stages: {
      "g12.r0": growRow(0, () => true), "g12.r1": growRow(1, () => true),
      "g12.merge": mergeRows([0, 1], (k) => k % 4 !== 0, "m4"),
      "g30.r0": growRow(0, () => true, 0.03), "g30.r1": growRow(1, () => true, 0.03),
      "g30.merge": mergeRows([0, 1], (k) => k % 10 !== 0, "m10"),
      "gS.base": (s, H) => { growRow(0, (k) => k % 12 === 0)(s, H); growRow(1, (k) => k % 12 === 0)(s, H); },
      "gS.cut2": cutRows([0, 1], (k) => k % 6 === 0 && k % 12 !== 0, 0.12),
      "gS.cut4": cutRows([0, 1], (k) => k % 3 === 0 && k % 6 !== 0, 0.08),
      "gS.merge": mergeRows([0, 1], (k) => k % 12 !== 0),
      "gS.cut3": cutRows([0, 1], (k) => k % 4 === 0 && k % 12 !== 0, 0.1),
      "rs.v128": rollTo(12, 8), "rs.v32": rollTo(3, 2, "÷ 4"), "rs.v3020": rollTo(30, 20), "rs.v32b": rollTo(3, 2, "÷ 10"),
      "rs.base": rollTo(3, 2), "rs.v64": rollTo(6, 4, "× 2"), "rs.v128b": rollTo(12, 8, "× 2"), "rs.v32c": rollTo(3, 2, "÷ 4"), "rs.v96": rollTo(9, 6, "× 3"),
      /* the price question turns into the decrease: 5:4 rolls down to 3:4 and "increased" turns over */
      "q2.down": (svg, H, stage) => {
        const inner = stage?.querySelector('[data-t="a2"]')?.firstChild, instant = H.show === H.grow;
        swapWord(inner, "increased", "decreased", { instant });
        rollAskRatio(inner, "5:4", [3, 4], { instant });
      },
      "q.up": rollQ([["12", 30], ["8", 20]]), "q.down": rollQ([["12", 12], ["8", 8]]),
      "p1.r0": rowStage(0), "p1.r1": rowStage(1),
      "p1.old": (s, H) => H.draw(braceOf(s, "below-0-0"), 0),
      "p2.base": (s, H) => { showBars(s, H); H.show(braceOf(s, "below-0-0")); },
      "p2.fill": fill,
      "p2.new": (s, H) => mb(s, "bar", 1).forEach((b) => H.lit(b, 0.2, 2.4)),
      "p3.all": (s, H) => { mb(s, "name").forEach((n) => H.show(n)); mb(s, "bar", 0).forEach((b) => H.show(b)); H.show(braceOf(s, "below-0-0"));
        mb(s, "bar", 1).forEach((b, j) => H.grow(b, 0.2 + j * 0.25)); fill(s, H); },
      "m4.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "s1.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["b"], 1.2); },
      "m5.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); H.sound("ding", 1.5); },
      "m6.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); H.sound("ding", 1.5); },
    },
    steps: ({ push }) => {
      push("Here's a class with twelve boys and eight girls, and the question wants the ratio of boys to girls. Before we answer it, let's be clear about what a ratio actually is, because the whole topic rests on it.",
        { on: ["a1"], transition: "iris", pause: 0.6 });

      /* ── IDEA 1 ── */
      push("Let me draw them. One box for every boy... twelve boxes. One box for every girl... eight boxes, all the same size. Look at the two rows side by side, because a ratio is simply a way of COMPARING two amounts.",
        { on: ["g12", "k1"], add: ["g12.r0", "g12.r1"], cue: { "g12.r0": "every boy", "g12.r1": "every girl" }, transition: card("Idea 1", "What a ratio is"), pause: 0.6 });
      push("Written as a ratio, boys to girls is twelve to eight, with two dots between them that we read as 'to'. And beside it, the same comparison as a fraction: twelve over eight. Boys go first because the question said boys first, so never swap the order.",
        { on: ["rs"], add: ["rs.v128"], cue: { "rs.v128": "twelve to eight" }, pause: 0.6 });
      push("Now watch the boxes MERGE, four at a time. The lines between them fade away... and the boys become three big boxes, the girls two. Watch the numbers roll down with them: twelve to eight becomes three to two, and twelve eighths becomes three halves. The bars haven't changed at all.",
        { add: ["g12.merge", "rs.v32"], cue: { "g12.merge": "the lines between", "rs.v32": "roll down" }, pause: 0.8 });

      /* ── IDEA 2 ── */
      push("Here's the bit everybody gets wrong. The ratio three to two does NOT mean there are three boys. There are twelve. Three and two are the ratio; twelve and eight are the actual values. A ratio only tells you how the groups compare.",
        { on: ["s1", "k2"], off: ["k1"], add: ["s1.all"], cue: { "s1.all": "actual values" }, transition: card("Idea 2", "Ratio or actual value?"), pause: 0.8 });
      push("Now change the class. Watch the question: thirty boys and twenty girls. Thirty boxes for the boys, and twenty for the girls. Different children, bigger numbers.",
        { on: ["g30"], off: ["g12", "s1"], add: ["q.up", "rs.v3020", "g30.r0", "g30.r1"], cue: { "q.up": "watch the question", "rs.v3020": "thirty boys", "g30.r0": "thirty boxes", "g30.r1": "twenty for" }, pause: 0.6 });
      push("Merge them, ten at a time. Watch the lines go... three big boxes of boys, two of girls. Thirty to twenty rolls down to three to two as well, just as thirty twentieths is three halves. Lots of different classes share one ratio, and that's why a ratio alone can't tell you how many.",
        { add: ["g30.merge", "rs.v32b"], cue: { "g30.merge": "watch the lines", "rs.v32b": "rolls down" }, pause: 0.8 });

      /* ── IDEA 3 ── */
      push("Now a price of eighty dollars is increased in the ratio five to four. That means new price to old price is five to four. So the old price is four boxes, and the new price is five boxes of exactly the same size.",
        { on: ["a2", "p1", "k3"], off: ["a1", "g30", "rs", "k2"], add: ["p1.r0", "p1.r1"], cue: { "p1.r0": "four boxes", "p1.r1": "five boxes" },
          transition: card("Idea 3", "Increase and decrease"), pause: 0.6 });
      push("The old price, all four boxes, is eighty dollars. So one box is eighty shared into four... twenty dollars. Write twenty in every box, because every box is the same size.",
        { on: ["p2", "m4"], off: ["p1"], add: ["p1.old", "p2.base", "m4.all", "p2.fill"], cue: { "m4.all": "shared into", "p2.fill": "write twenty" }, pause: 0.8 });
      push("The new price is five boxes. Five times twenty... one hundred dollars. The bigger number came first in the ratio, five to four, so the price went UP.",
        { on: ["m5"], off: ["m4"], add: ["p2.new", "m5.all"], cue: { "m5.all": "five times" }, pause: 0.8 });
      push("Now watch the question change: DECREASED in the ratio three to four instead. The new price is only three of those boxes. Three times twenty... sixty dollars. When the first number is the smaller one, the amount goes DOWN.",
        { on: ["p3", "m6"], off: ["p2", "m5"], add: ["q2.down", "p3.all", "m6.all"], cue: { "q2.down": "DECREASED", "p3.all": "only three", "m6.all": "three times twenty" }, pause: 1 });

      /* ── IDEA 4: SCALING, ON THE BOXES ── */
      push("Last idea: scaling. Back to our class, twelve boys and eight girls, as three to two in boxes. Now I CUT every box in two... and the numbers roll up: six to four, six quarters. The bars are just as long as before; there are simply more, smaller boxes.",
        { on: ["a1", "gS", "rs", "k4"], off: ["a2", "p3", "m6", "k3"], add: ["q.down", "gS.base", "rs.base", "gS.cut2", "rs.v64"],
          cue: { "gS.cut2": "cut every box", "rs.v64": "roll up" }, transition: card("Idea 4", "Scaling: cut up, merge down"), pause: 0.6 });
      push("Cut every box in two again... twelve to eight, twelve eighths. Cutting makes the numbers BIGGER, and both rows are cut the same way, so the comparison never changes.",
        { add: ["gS.cut4", "rs.v128b"], cue: { "gS.cut4": "in two again", "rs.v128b": "twelve to eight" }, pause: 0.8 });
      push("Going down is the other way round: we MERGE. Watch the lines fade, four boxes at a time... and the numbers roll back down to three to two. Up, we cut. Down, we merge. That's simplifying a fraction: twelve eighths to three halves.",
        { add: ["gS.merge", "rs.v32c"], cue: { "gS.merge": "watch the lines", "rs.v32c": "roll back" }, pause: 0.8 });
      push("And cut every box into three instead... nine to six, nine sixths. Whatever you multiply or divide one side by, you do to the other, because every box in both rows is cut, or merged, the same way.",
        { add: ["gS.cut3", "rs.v96"], cue: { "gS.cut3": "into three", "rs.v96": "nine to six" }, pause: 1 });
      push("So, a ratio compares two amounts. Its numbers are not the actual values. Cutting the boxes scales it up, merging scales it down, and a ratio like five to four can grow an amount, or shrink it.");
    },
  });
}

/* ═══ 2. THE PARTS OF A RATIO ══════════════════════════════════════════════ */
/* THE KEYWORD TABLE. *"List keywords in a table when talking about keywords."* Three columns, one
   for each thing a number in a problem can be; each column's words come in as they are read. */
function keywordTable() {
  const COLS = [
    { head: "The whole (sum)", fill: "#c8f0c0", words: ["share", "altogether", "in all", "total", "together"] },
    { head: "The gap (difference)", fill: "#ffd7a3", words: ["more than", "less than", "fewer than", "difference", "exceeds"] },
    { head: "One part", fill: "#bfe3ff", words: ["gets", "has", "receives", "is given", "'s share is"] },
  ];
  const X0 = 9, W = 44, HH = 8, RH = 6, TOP = 2;
  let out = "";
  COLS.forEach((c, j) => {
    const x = X0 + j * W;
    out += `<g data-mb="bar" data-mb-row="${j}"><rect x="${x}" y="${TOP}" width="${W}" height="${HH}" fill="${c.fill}" stroke="#2a2723" stroke-width="0.6"/>`
      + `<text x="${x + W / 2}" y="${TOP + 5.4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="800" font-size="3.6" fill="#2a2723">${c.head}</text></g>`;
    c.words.forEach((w, i) => {
      const y = TOP + HH + i * RH;
      out += `<g data-mb="num" data-k="t${j}-${i}"><rect x="${x}" y="${y}" width="${W}" height="${RH}" fill="#fffdf8" stroke="#2a2723" stroke-width="0.4"/>`
        + `<text x="${x + W / 2}" y="${y + 4.2}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="600" font-size="3.4" fill="#2a2723">${w.replace(/'/g, "&#8217;")}</text></g>`;
    });
  });
  return svgBox(150, TOP * 2 + HH + 5 * RH, out);
}

export function ratioParts() {
  const N = ["Ade", "Bola"];
  const R = [3, 5];
  const AT = barAt(5);
  const ATT = barAt(5, 1, null, true);
  const T = () => barAt(3, 1, 30);
  /* one keyword on the screen jumps while it is said (./film-ask.js .fa-act) */
  const act = (k) => (svg, H, stage) => {
    const n = stage?.querySelector(`[data-k="kw-${k}"]`);
    /* only when the step is PLAYED: a replayed step (the instant hand, whose show and grow are one) is silent */
    if (!n || H.show === H.grow) return;
    n.classList.remove("fa-act");
    void n.offsetWidth;
    n.classList.add("fa-act");
    H.sound("pop", 0);
  };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "Ade and Bola share some sweets in the ratio 3:5. Bola gets 18 more sweets than Ade. How many sweets are there altogether?" },
      { id: "a2", text: "Ade and Bola share 64 sweets in the ratio 3:5." },
      { id: "a3", text: "In the ratio 3:5, Ade gets 21 sweets." },
      { id: "t1", text: "Bola has 2 more than Ade." },
      { id: "t2", text: "Bola has twice as many as Ade." },
      { id: "t3", text: "Bola has twice more than Ade." },
    ],
    pics: {
      q0: () => bars(N, R),
      qW: () => bars(N, R, { total: "8 boxes" }),
      qD: () => bars(N, R, { below: { 1: [{ from: 3, to: 5, text: "2 boxes" }] } }),
      qS: () => bars(N, R, { text: "8", total: "64" }),
      qP: () => bars(N, R, { text: "7", below: { 0: [{ from: 0, to: 3, text: "21" }] } }),
      qA: () => bars(N, R, { text: "9", below: { 1: [{ from: 3, to: 5, text: "18" }] } }),
      /* the traps: the same two people, three different relationships */
      tr1: () => mathifyPic(modelSvg([
        { name: "Ade", parts: [part("Ade", 1, "a")] },
        { name: "Bola", parts: [part("Ade", 1, "b"), part("2", 0.35, "d")], above: [{ from: 1, to: 2, text: "2 more" }] },
      ], { cap: 30, label: "" })),
      tr2: () => mathifyPic(modelSvg([
        { name: "Ade", parts: [part("", 1, "a")] },
        { name: "Bola", parts: [part("", 1, "b"), part("", 1, "b")], below: [{ from: 0, to: 2, text: "twice Ade" }] },
      ], { cap: 30, label: "" })),
      tr3: () => mathifyPic(modelSvg([
        { name: "Ade", parts: [part("", 1, "a")] },
        { name: "Bola", parts: [part("", 1, "b"), part("", 1, "d"), part("", 1, "d")], above: [{ from: 1, to: 3, text: "twice Ade, MORE" }] },
      ], { cap: 30, label: "" })),
      mPP: () => main([L("a", "\\text{Ade} : \\text{Bola}"), L("e", "="), L("b", "3 : 5", BLUE)]),
      mPW: () => main([L("a", "\\text{Ade}"), L("e", "="), L("b", "\\dfrac{3}{8}\\ \\text{of the whole}", BLUE)]),
      mPD: () => main([L("a", "5 - 3"), L("e", "="), L("b", "2\\ \\text{boxes more}", BLUE)]),
      mS: () => main([L("a", "64 \\div 8"), L("e", "="), L("b", "8\\ \\text{a box}", BLUE)]),
      mP: () => main([L("a", "21 \\div 3"), L("e", "="), L("b", "7\\ \\text{a box}", BLUE)]),
      mD: () => main([L("a", "18 \\div 2"), L("e", "="), L("b", "9\\ \\text{a box}", BLUE)]),
      mA: () => main([L("a", "8 \\times 9"), L("e", "="), L("b", "72\\ \\text{sweets}", GREEN)]),
      mT1: () => main([L("a", "\\text{Bola} = \\text{Ade} + 2"), L("e", "\\quad"), L("b", "\\text{a number, not a ratio}", BLUE)], 6.4),
      mT2: () => main([L("a", "\\text{Bola} = 2 \\times \\text{Ade}"), L("e", "\\quad"), L("b", "\\text{Ade} : \\text{Bola} = 1 : 2", BLUE)], 6.4),
      mT3: () => main([L("a", "\\text{Bola} = \\text{Ade} + 2 \\times \\text{Ade}"), L("e", "\\quad"), L("b", "1 : 3", BLUE)], 6.4),
      sK: () => side([[L("a", "\\text{Ade } 27,\\ \\text{Bola } 45")], [L("b", "45 - 27 = 18\\ \\checkmark", GREEN)]], 4.2),
    },
    picAt: { q0: AT, qW: ATT, qD: AT, qS: ATT, qP: AT, qA: AT, tr1: T(), tr2: T(), tr3: T(),
      mPP: at(37.5), mPW: at(37.5), mPD: at(37.5), mS: at(37.5), mP: at(37.5), mD: at(37.5), mA: at(37.5),
      mT1: at(37.5), mT2: at(37.5), mT3: at(37.5), sK: { x: 79.5, y: 16 } },
    lines: [
      { id: "k1", receipt: true, sub: "Part to part", text: "one share to the other", y: 50.5 },
      { id: "k2", receipt: true, sub: "Part to whole", text: "one share to all of it", y: 50.5 },
      { id: "k3", receipt: true, sub: "Part to difference", text: "the gap between them", y: 50.5 },
      { id: "k4", receipt: true, sub: "Spot it", text: "sum, difference or one part?", y: 50.5 },
      { id: "k5", receipt: true, sub: "The trap", text: "relationship before keyword", y: 50.5 },
      tableLine("kw", [
        { head: "The whole (sum)", tone: 2, cells: ["share", "altogether", "in all", "total", "together"] },
        { head: "The gap (difference)", tone: 4, cells: ["more than", "less than", "fewer than", "difference", "exceeds"] },
        { head: "One part", tone: 3, cells: ["gets", "has", "receives", "is given", "'s share is"] },
      ], { y: 26, w: 80, size: 1.6 }),
    ],
    stages: {
      "q0.r0": rowStage(0), "q0.r1": rowStage(1),
      "qW.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "total"), 0.2); },
      "qD.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "below-1-0"), 0.2); mb(s, "bar", 1).slice(3).forEach((b) => H.lit(b, 0.3, 2.4)); },
      "kw.heads": () => {},
      "kw.c0": tableCol("kw", 0), "kw.c1": tableCol("kw", 1), "kw.c2": tableCol("kw", 2),
      "qS.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "total"), 0.2); },
      "qP.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "below-0-0"), 0.2); },
      "qA.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "below-1-0"), 0.2); },
      "qS.fill": fill, "qP.fill": fill, "qA.fill": fill,
      "tr1.all": (s, H) => { rowStage(0)(s, H); rowStage(1)(s, H); mb(s, "num").forEach((n) => H.write(n, 0.9)); H.draw(braceOf(s, "above-1-0"), 1.4); },
      "tr2.all": (s, H) => { rowStage(0)(s, H); rowStage(1)(s, H); H.draw(braceOf(s, "below-1-0"), 1.2); },
      "tr3.all": (s, H) => { rowStage(0)(s, H); rowStage(1)(s, H); H.draw(braceOf(s, "above-1-0"), 1.4); },
      "kwa.share": act("share"), "kwa.altogether": act("altogether"), "kwa.gets": act("gets"), "kwa.more": act("more-than"),
      "kwb.more": act("more-than"), "kwb.twice": act("twice-as-many-as"), "kwb.twicemore": act("twice-more-than"),
      ...Object.fromEntries(["mPP", "mPW", "mPD", "mS", "mP", "mD", "mT1", "mT2", "mT3"].map((m) => [`${m}.all`, (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); }])),
      "mA.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); H.sound("ding", 1.5); },
      "sK.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["b"], 1.2); H.sound("ding", 1.4); },
    },
    steps: ({ push }) => {
      push("Ade and Bola share some sweets in the ratio three to five, and Bola gets eighteen more than Ade. How many sweets are there altogether? To answer that, you need to see that one ratio hides THREE different comparisons.",
        { on: ["a1"], transition: "iris", pause: 0.6 });

      /* part to part */
      push("Draw it first. Ade has three boxes... and Bola has five, every box the same size. Comparing one share with the other share is called part to part: Ade to Bola is three to five.",
        { on: ["q0", "mPP", "k1"], add: ["q0.r0", "q0.r1", "mPP.all"], cue: { "q0.r0": "three boxes", "q0.r1": "has five", "mPP.all": "part to part" },
          transition: card("Part to part", "one share to the other"), pause: 0.6 });

      /* part to whole */
      push("Now look at ALL the boxes together. Three and five make eight. That's the whole. Ade has three boxes out of the eight, so Ade's share is three eighths of the whole, and Bola's is five eighths. That's part to whole.",
        { on: ["qW", "mPW", "k2"], off: ["q0", "mPP", "k1"], add: ["qW.all", "mPW.all"], cue: { "mPW.all": "three eighths" },
          transition: card("Part to whole", "one share to all of it"), pause: 0.8 });

      /* part to difference */
      push("And the third one hides in the gap. Bola has five boxes and Ade has three, so Bola has two boxes MORE. Those two extra boxes are the difference. Comparing a share with that gap is part to difference.",
        { on: ["qD", "mPD", "k3"], off: ["qW", "mPW", "k2"], add: ["qD.all", "mPD.all"], cue: { "mPD.all": "two boxes more" },
          transition: card("Part to difference", "the gap between them"), pause: 0.8 });

      /* spotting it: the table of keywords */
      push("Here's the skill that matters: reading WHICH of these a problem gives you. Some words are clues, so let's put them in a table. Words like share, altogether, in all, total and together point at the WHOLE.",
        { on: ["kw", "k4"], off: ["a1", "qD", "mPD", "k3"], add: ["kw.heads", "kw.c0"], cue: { "kw.c0": "words like share" },
          transition: card("Spot it", "sum, difference or one part?"), pause: 0.5 });
      push("More than, less than, fewer than, difference and exceeds point at the GAP between the shares.",
        { add: ["kw.c1"], cue: { "kw.c1": "more than" }, pause: 0.5 });
      push("And gets, has, receives, or one person's share, point at ONE PART. Let's use the table on some examples.",
        { add: ["kw.c2"], cue: { "kw.c2": "gets" }, pause: 0.8 });

      /* the examples, the keyword acting as it is said */
      push("'Ade and Bola SHARE sixty-four sweets.' Share is a whole word, so sixty-four is all eight boxes together.",
        { on: ["a2", "qS"], off: ["kw"], add: ["kwa.share", "qS.all"], cue: { "kwa.share": "Share is", "qS.all": "all eight" }, pause: 0.6 });
      push("So one box is sixty-four shared into eight... eight sweets. Write eight in every box.",
        { on: ["mS"], add: ["mS.all", "qS.fill"], cue: { "mS.all": "shared into", "qS.fill": "write eight" }, pause: 0.8 });
      push("'Ade GETS twenty-one sweets.' Gets, with one name: that's a part. Twenty-one is Ade's three boxes, so one box is twenty-one shared into three... seven.",
        { on: ["a3", "qP", "mP"], off: ["a2", "qS", "mS"], add: ["kwa.gets", "qP.all", "mP.all", "qP.fill"], cue: { "kwa.gets": "Gets, with", "qP.all": "Ade's three boxes", "mP.all": "shared into three", "qP.fill": "seven." }, pause: 0.8 });
      push("Back to our question: Bola gets eighteen MORE THAN Ade. More than is a gap word, so that eighteen is the two extra boxes, not anybody's share.",
        { on: ["a1", "qA"], off: ["a3", "qP", "mP"], add: ["kwa.more", "qA.all"], cue: { "kwa.more": "More than is", "qA.all": "two extra boxes" }, pause: 0.6 });
      push("So one box is eighteen shared into two... nine sweets. Nine in every box.",
        { on: ["mD"], add: ["mD.all", "qA.fill"], cue: { "mD.all": "shared into two", "qA.fill": "nine sweets" }, pause: 0.8 });
      push("The question asks for the sweets ALTOGETHER: a whole word, so that's all eight boxes. Eight times nine... seventy-two sweets.",
        { on: ["mA"], off: ["mD"], add: ["kwa.altogether", "mA.all"], cue: { "kwa.altogether": "ALTOGETHER", "mA.all": "eight times" }, pause: 0.8 });
      push("Check it. Ade has three nines, twenty-seven; Bola has five nines, forty-five. Forty-five take away twenty-seven is eighteen. It works.",
        { on: ["sK"], add: ["sK.all"], cue: { "sK.all": "check it" }, pause: 1 });

      /* ── THE TRAP: keywords without the relationship ── */
      push("Now a warning. Keywords are clues, not rules, and if you grab one without reading the relationship around it, you'll fall straight into a trap. Watch three sentences that look almost the same.",
        { on: ["k5"], off: ["a1", "qA", "mA", "sK", "k4"], transition: card("The trap", "relationship before keyword"), pause: 0.6 });
      push("'Bola has TWO MORE than Ade.' More than: a gap. Bola is Ade, and then two more sweets on the end. The gap is two actual sweets. That's a number, not a ratio at all.",
        { on: ["t1", "tr1", "mT1"], add: ["kwb.more", "tr1.all", "mT1.all"], cue: { "kwb.more": "More than:", "tr1.all": "Bola is Ade", "mT1.all": "a number, not" }, pause: 0.8 });
      push("'Bola has TWICE AS MANY as Ade.' There's no gap word here. Twice means times two: Ade is one box, Bola is two of the same boxes. Ade to Bola is one to two.",
        { on: ["t2", "tr2", "mT2"], off: ["t1", "tr1", "mT1"], add: ["kwb.twice", "tr2.all", "mT2.all"], cue: { "kwb.twice": "Twice means", "tr2.all": "Ade is one box", "mT2.all": "one to two" }, pause: 0.8 });
      push("'Bola has TWICE MORE than Ade.' This one has TWO keywords, twice and more than, and you need both. Bola has Ade's amount, and then MORE on top, and the more is twice Ade. One box, plus two boxes: three boxes. One to three!",
        { on: ["t3", "tr3", "mT3"], off: ["t2", "tr2", "mT2"], add: ["kwb.twicemore", "tr3.all", "mT3.all"], cue: { "kwb.twicemore": "TWO keywords", "tr3.all": "and then MORE", "mT3.all": "one box, plus" }, pause: 1 });
      push("Three sentences, three different answers: plus two, times two, and times three. A child who only spotted 'more than' or only spotted 'twice' would get two of them wrong. So read the WHOLE relationship first, draw it, and only then let the keywords help.", { pause: 1 });
      push("So before you calculate anything, ask what the number in the problem IS: the whole, one part, or the difference. Read the relationship, match it to the right boxes, find one box, and the rest follows.");
    },
  });
}

/* ═══ 3. COMPOUND RATIO ════════════════════════════════════════════════════ */
export function ratioCompound() {
  /* each person keeps their own colour in every picture they are in */
  const ADE = { name: "Ade", n: 8, fill: "#bfe3ff" }, BOLA = { name: "Bola", n: 12, fill: "#fff3a8" }, CHIDI = { name: "Chidi", n: 15, fill: "#c8f0c0" };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "The ratio of Ade's money to Bola's is 2:3, and Bola's money to Chidi's is 4:5. Find the ratio of Ade's money to Chidi's." },
      { id: "a2", text: "Together, Ade, Bola and Chidi have $175. How much does each of them have?" },
    ],
    pics: {
      /* the same box size throughout (one fifteenth of the bar), so a cut is a cut and the rows of
         the joined ratio are exactly the rows that were cut: Ade 2 boxes of 4, Bola 3 of 4, and so on */
      r1: () => boxRows([ADE, BOLA], 100 / 15),
      r2: () => boxRows([BOLA, CHIDI], 100 / 15),
      r3: () => boxRows([ADE, BOLA, CHIDI], 100 / 15),
      r4: () => bars(["Ade", "Bola", "Chidi"], [8, 12, 15], { text: "5", total: "$175" }),
      m1: () => main([L("a", "A : B = 2 : 3"), L("e", ",\\quad"), L("b", "B : C = 4 : 5")], 7),
      mL: () => main([L("a", "\\text{LCM}(3, 4)"), L("e", "="), L("b", "12", BLUE)]),
      m2: () => main([L("a", "2 : 3 = 8 : 12\\ \\left(\\tfrac{2}{3} = \\tfrac{8}{12}\\right)"), L("e", ",\\quad"), L("b", "4 : 5 = 12 : 15\\ \\left(\\tfrac{4}{5} = \\tfrac{12}{15}\\right)")], 5.6),
      m3: () => main([L("a", "A : B : C"), L("e", "="), L("b", "8 : 12 : 15", BLUE)]),
      m4: () => main([L("a", "A : C"), L("e", "="), L("b", "8 : 15", GREEN)]),
      m5: () => main([L("a", "\\dfrac{2}{3} \\times \\dfrac{4}{5}"), L("e", "="), L("b", "\\dfrac{8}{15}", GREEN)]),
      m6: () => main([L("a", "8 + 12 + 15 = 35"), L("e", ",\\quad"), L("b", "175 \\div 35 = 5", BLUE)], 7),
      m7: () => main([L("a", "8 \\times 5,\\ 12 \\times 5,\\ 15 \\times 5"), L("e", "\\to"), L("b", "\\$40,\\ \\$60,\\ \\$75", GREEN)], 6.2),
      sK: () => side([[L("a", "40 : 60 = 2 : 3\\ \\checkmark", GREEN)], [L("b", "60 : 75 = 4 : 5\\ \\checkmark", GREEN)]], 4.4),
    },
    picAt: { r1: centred(150, 15), r2: centred(150, 15), r3: centred(150, 13), r4: barAt(15, 1, null, true),
      m1: at(37.5), mL: at(37.5), m2: at(37.5), m3: at(37.5), m4: at(37.5), m5: at(37.5), m6: at(37.5), m7: at(37.5), sK: { x: 79.5, y: 16 } },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "Make the shared one match", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Multiply the ratios", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Share in the joined ratio", y: 50.5 },
    ],
    stages: {
      "r1.r0": growRow(0, (k) => k % 4 === 0), "r1.r1": growRow(1, (k) => k % 4 === 0),
      "r1.cut": cutRows([0, 1], (k) => k % 4 !== 0, 0.06),
      "r2.r0": growRow(0, (k) => k % 3 === 0), "r2.r1": growRow(1, (k) => k % 3 === 0),
      "r2.cut": cutRows([0, 1], (k) => k % 3 !== 0, 0.05),
      "r3.r0": growRow(0, () => true, 0.03), "r3.r1": growRow(1, () => true, 0.03), "r3.r2": growRow(2, () => true, 0.03),
      "r4.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "total"), 0.2); fill(s, H); },
      "r3.ends": (s, H) => { [0, 2].forEach((i) => mb(s, "bar", i).forEach((b) => H.lit(b, 0.2, 2.6))); },
      "m1.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.7),
      "mL.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "m2.a": (s, H) => write(s, H, ["a"], 0),
      "m2.b": (s, H) => write(s, H, ["e", "b"], 0, 0.4),
      "m3.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "m4.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); H.sound("ding", 1.5); },
      "m5.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.6); write(s, H, ["b"], 1.5); H.sound("ding", 1.7); },
      "m6.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["e", "b"], 1.2, 0.4); },
      "m7.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.6); write(s, H, ["b"], 1.6); H.sound("ding", 1.8); },
      "sK.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["b"], 1.2); H.sound("ding", 1.4); },
    },
    steps: ({ push }) => {
      push("Ade's money to Bola's is two to three, and Bola's money to Chidi's is four to five. We want Ade to Chidi. Two ratios, joined by one person they share... and that person is the key to the whole thing.",
        { on: ["a1"], transition: "iris", pause: 0.6 });

      /* ── IDEA 1 ── */
      push("Draw the first ratio. Ade gets two boxes, and Bola gets three boxes, every box the same size. That's Ade to Bola, two to three.",
        { on: ["r1", "m1", "k1"], add: ["r1.r0", "r1.r1", "m1.all"], cue: { "r1.r0": "Ade gets", "r1.r1": "Bola gets", "m1.all": "two to three" },
          transition: card("Idea 1", "Make the shared one match"), pause: 0.4 });
      push("Now the second ratio on its own. Bola, four boxes, and Chidi, five. And here's the trap: Bola is three boxes in one ratio and four in the other, so those boxes can't be the same size. You can't join Ade to Chidi until Bola is the SAME number of boxes in both.",
        { on: ["r2"], off: ["r1"], add: ["r2.r0", "r2.r1"], cue: { "r2.r0": "Bola, four", "r2.r1": "Chidi, five" }, pause: 0.8 });
      push("So find a number that both three and four go into: the lowest common multiple, twelve. Bola will be twelve boxes in both ratios.",
        { on: ["mL"], off: ["m1"], add: ["mL.all"], cue: { "mL.all": "lowest common" }, pause: 0.6 });
      push("Back to the first ratio. To make Bola twelve, CUT every box into four. Ade's two boxes become eight, and Bola's three become twelve. Two to three is now eight to twelve, and the bars haven't changed length at all.",
        { on: ["r1", "m2"], off: ["r2", "mL"], add: ["r1.cut", "m2.a"], cue: { "r1.cut": "cut every box", "m2.a": "is now eight" }, pause: 0.8 });
      push("Now the second ratio. Cut every box into three. Bola's four boxes become twelve, and Chidi's five become fifteen. Four to five is twelve to fifteen. Cutting both rows the same way never changes a ratio.",
        { on: ["r2"], off: ["r1"], add: ["r2.cut", "m2.b"], cue: { "r2.cut": "cut every box", "m2.b": "four to five is" }, pause: 0.8 });
      push("Now Bola matches, so the three can stand together. Ade, eight boxes. Bola, twelve. Chidi, fifteen. Ade to Bola to Chidi is eight to twelve to fifteen.",
        { on: ["r3", "m3"], off: ["r2", "m2"], add: ["r3.r0", "r3.r1", "r3.r2", "m3.all"], cue: { "r3.r0": "Ade, eight", "r3.r1": "Bola, twelve", "r3.r2": "Chidi, fifteen", "m3.all": "Ade to Bola to" }, pause: 0.8 });
      push("And the question only wants Ade to Chidi. Leave Bola out: eight to fifteen.",
        { on: ["m4"], off: ["m3"], add: ["r3.ends", "m4.all"], cue: { "m4.all": "eight to fifteen" }, pause: 1 });

      /* ── IDEA 2 ── */
      push("There's a quicker way, called the compound ratio. Write each ratio as a fraction and multiply them: two thirds times four fifths is eight fifteenths. So the compound ratio of two to three and four to five is eight to fifteen... the same answer.",
        { on: ["m5", "k2"], off: ["m4", "k1"], add: ["m5.all"], cue: { "m5.all": "two thirds" }, transition: card("Idea 2", "Multiply the ratios"), pause: 0.8 });
      push("It works because Bola cancels out, the threes and fours meeting in the middle. Multiply the first numbers together, multiply the second numbers together. That's all a compound ratio is.", { pause: 1 });

      /* ── IDEA 3 ── */
      push("Now suppose all three of them have one hundred and seventy-five dollars together. The joined ratio, eight to twelve to fifteen, tells us how to share it.",
        { on: ["a2", "r3", "k3"], off: ["a1", "m5", "k2"], transition: card("Idea 3", "Share in the joined ratio"), pause: 0.6 });
      push("Count all the boxes. Eight plus twelve plus fifteen... thirty-five. So one box is one hundred and seventy-five shared into thirty-five... five dollars.",
        { on: ["r4", "m6"], off: ["r3"], add: ["r4.all", "m6.all"], cue: { "m6.all": "count all" }, pause: 0.8 });
      push("Ade has eight boxes, forty dollars. Bola has twelve, sixty dollars. Chidi has fifteen, seventy-five dollars.",
        { on: ["m7"], off: ["m6"], add: ["m7.all"], cue: { "m7.all": "Ade has" }, pause: 0.8 });
      push("Check them against the ratios we started with. Forty to sixty is two to three. Sixty to seventy-five is four to five. Both work.",
        { on: ["sK"], add: ["sK.all"], cue: { "sK.all": "forty to sixty" }, pause: 1 });
      push("So when two ratios share a person, make that person the same number of boxes in both, join them, and then treat the result like any other ratio.");
    },
  });
}
