/* ============================================================================
   PERCENTAGES, FROM THE BEGINNING — three lessons before the question films
   ----------------------------------------------------------------------------
     pctWhat     a per cent is out of a HUNDRED: the hundred square merges into
                 fifths (20% = 20/100 = 1/5), halves, tenths; the numbers roll
     pctChange   a percentage OF an amount (a bar cut into fifths, then tenths),
                 then increase and decrease (a box added, a box gone pale)
     pctTraps    the keywords in a table, acting in examples; reverse
                 percentages; the traps (up 20% then down 20% is not back to
                 the start; the sale price is NOT the 100%)

   Everything the ratio lessons do, done here too (./ratio-intro.js): going up
   CUTS the boxes, going down MERGES them (lines fade); one question and one
   working line whose numbers ROLL to each new example; the equivalent fraction
   beside every step; the keyword ringed as it is said (./film-ask.js).
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";
import { rollAsk, swapWord, noteKeyword } from "./film-ask.js";

const INK = "#2a2723", BLUE = "#2f6f8f", GREEN = "#2f7d4a", PURPLE = "#6b4fa0", RED = "#c0453f";
const SKY = "#bfe3ff", BUTTER = "#fff3a8", LEAF = "#c8f0c0", PALE = "#e6e0d6", PART = "#f4c95d";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const main = (pieces, em = 8) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
const at = (y) => centred(150, y);
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const write = (s, H, ks, start = 0, gap = 0.35) => ks.forEach((k, i) => { const n = key(s, k); if (n) H.write(n, start + i * gap); });
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const line = (s, H, ding = false) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); if (ding) H.sound("ding", 1.5); };
const isInstant = (H) => H.show === H.grow;
const T = (k, x, y, size, anchor = "middle", fill = INK, extra = "") => `<text data-k="${k}" x="${x}" y="${y}" text-anchor="${anchor}" font-family="STIX Two Text, Cambria Math, serif" font-size="${size}" fill="${fill}" ${extra}>0</text>`;
const S = (x, y, size, t, anchor = "middle", fill = INK) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="STIX Two Text, Cambria Math, serif" font-size="${size}" fill="${fill}">${t}</text>`;

/* ── rolling, showing and hiding marks by their keys ─────────────────────── */
/** Roll each keyed text to its value (counting, or at once when the step is replayed). */
const roll = (vals) => (s, H) => {
  Object.entries(vals).forEach(([k, v]) => {
    const el = key(s, k);
    if (!el) return;
    if (typeof v === "string") { el.textContent = v; return; }
    const from = Number(el.textContent);
    if (isInstant(H) || !Number.isFinite(from) || from === v) { el.textContent = String(v); return; }
    const t0 = performance.now();
    const tick = (now) => {
      if (!el.isConnected) return;
      const t = Math.min(1, (now - t0) / 900);
      el.textContent = String(Math.round(from + (v - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  if (!isInstant(H)) H.sound("tick", 0);
};
/** Show (fade in) or hide (fade out) marks by key; a mark never shown is simply left hidden. */
const vis = (on = [], off = []) => (s, H) => {
  const instant = isInstant(H);
  on.forEach((k) => { const n = key(s, k); if (!n) return; n.style.transition = instant ? "" : "opacity .5s"; n.style.opacity = "1"; });
  off.forEach((k) => { const n = key(s, k); if (!n) return; n.style.transition = instant ? "" : "opacity .5s"; n.style.opacity = "0"; });
};
/** Lines by key: the wanted ones are DRAWN in (a cut), the rest FADE out (a merge). */
const linesTo = (all, want) => (s, H) => {
  const instant = isInstant(H);
  all.forEach((k) => {
    const g = s?.querySelector(`[data-mb-key="${k}"]`);
    if (!g) return;
    const showing = g.style.opacity === "1";
    if (want.includes(k)) { if (!showing) H.draw(g, instant ? 0 : 0.1); }
    else if (showing) { g.style.transition = instant ? "" : "opacity .5s"; g.style.opacity = "0"; }
  });
  if (!instant && all.some((k) => !want.includes(k))) H.sound("snip", 0.1);
};
const lineMark = (k, d, w = 0.5) => `<g data-mb="brace" data-mb-key="${k}"><path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}"/></g>`;

/* ── THE HUNDRED SQUARE ─────────────────────────────────────────────────── */
const HX = 52, HY = 3, HC = 4.6;
const H_LINES = [...Array.from({ length: 9 }, (_, i) => `gv${i + 1}`), ...Array.from({ length: 9 }, (_, i) => `gh${i + 1}`)];
const hLines = (rows) => rows.map((r) => `gh${r}`);
function hundred() {
  let o = "";
  for (let r = 0; r < 10; r++) o += `<rect data-mb="num" data-k="row${r}" x="${HX}" y="${HY + r * HC}" width="${10 * HC}" height="${HC}" fill="${BUTTER}"/>`;
  o += `<rect data-mb="bar" data-k="sq" x="${HX}" y="${HY}" width="${10 * HC}" height="${10 * HC}" fill="none" stroke="${INK}" stroke-width="0.8"/>`;
  for (let i = 1; i < 10; i++) {
    o += lineMark(`gv${i}`, `M${HX + i * HC} ${HY} V${HY + 10 * HC}`, 0.35);
    o += lineMark(`gh${i}`, `M${HX} ${HY + i * HC} H${HX + 10 * HC}`, 0.35);
  }
  o += `<g data-mb="name" data-k="sqlab">${S(HX + 5 * HC, HY + 10 * HC + 6, 4.4, "100 little squares = 100%")}</g>`;
  return svgBox(150, 56, o);
}
const shade = (n) => vis(Array.from({ length: n }, (_, r) => `row${r}`), Array.from({ length: 10 - n }, (_, r) => `row${n + r}`));
/** "20% = 20/100 = 1/5": the per cent, the fraction out of a hundred, and its simplest name */
function pctRoller() {
  return svgBox(150, 30, `<g data-mb="num" data-k="pr">`
    + T("p", 46, 20, 12, "end") + S(47.5, 20, 12, "%", "start") + S(66, 20, 12, "=")
    + T("fn", 80, 14, 8.5) + `<line x1="72" y1="16.8" x2="88" y2="16.8" stroke="${INK}" stroke-width="0.7"/>` + T("fd", 80, 25.5, 8.5)
    + `<g data-k="simp" style="opacity:0">${S(96, 20, 12, "=")}` + T("sn", 108, 14, 8.5, "middle", PURPLE)
    + `<line x1="102" y1="16.8" x2="114" y2="16.8" stroke="${PURPLE}" stroke-width="0.7"/>` + T("sd", 108, 25.5, 8.5, "middle", PURPLE)
    + T("sw", 120, 20, 6.5, "start", PURPLE, 'font-style="italic"') + `</g></g>`);
}
const showPr = (s, H) => { const g = key(s, "pr"); if (g) H.show(g); };

/* ═══ 1. WHAT A PERCENTAGE IS ══════════════════════════════════════════════ */
export function pctWhat() {
  const q = (pairs) => (svg, H, stage) => {
    const inner = stage?.querySelector('[data-t="a1"]')?.firstChild;
    pairs.forEach(([from, to]) => rollAsk(inner, from, to, { instant: isInstant(H), suffix: "\\%" }));
  };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "What is 20% as a fraction in its simplest form?" }],
    pics: { hs: () => hundred(), pr: () => pctRoller() },
    picAt: { hs: centred(150, 13), pr: at(35) },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "Per cent: out of a hundred", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Merge to the simplest fraction", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Same square, new per cent", y: 50.5 },
    ],
    stages: {
      "hs.draw": (s, H) => { H.grow(key(s, "sq"), 0.1); H_LINES.forEach((k, i) => H.draw(s.querySelector(`[data-mb-key="${k}"]`), 0.6 + i * 0.05)); H.write(key(s, "sqlab"), 1.6); },
      "hs.s20": shade(2),
      "pr.v20": (s, H) => { showPr(s, H); roll({ p: 20, fn: 20, fd: 100 })(s, H); },
      "hs.fifths": linesTo(H_LINES, hLines([2, 4, 6, 8])),
      "pr.fifth": (s, H) => { roll({ sn: 1, sd: 5, sw: "a fifth" })(s, H); vis(["simp"])(s, H); },
      "q.50": q([["20\\%", 50]]),
      "hs.s50": shade(5), "hs.halves": linesTo(H_LINES, hLines([5])),
      "pr.v50": roll({ p: 50, fn: 50, fd: 100, sn: 1, sd: 2, sw: "a half" }),
      "q.10": q([["20\\%", 10]]),
      "hs.s10": shade(1), "hs.tenths": linesTo(H_LINES, hLines([1, 2, 3, 4, 5, 6, 7, 8, 9])),
      "pr.v10": roll({ p: 10, fn: 10, fd: 100, sn: 1, sd: 10, sw: "a tenth" }),
      "q.40": q([["20\\%", 40]]),
      "hs.s40": shade(4), "hs.fifths2": linesTo(H_LINES, hLines([2, 4, 6, 8])),
      "pr.v40": roll({ p: 40, fn: 40, fd: 100, sn: 2, sd: 5, sw: "two fifths" }),
    },
    steps: ({ push }) => {
      push("What is twenty per cent as a fraction? To answer it, you only need to know what those two words, per cent, actually mean.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Per cent means out of a HUNDRED. So here's a square cut into a hundred little squares, and the whole square is one hundred per cent: all of it.",
        { on: ["hs", "k1"], add: ["hs.draw"], cue: { "hs.draw": "here's a square" }, transition: card("Idea 1", "Per cent: out of a hundred"), pause: 0.6 });
      push("Twenty per cent is twenty of those hundred squares: these two rows. As a fraction, that's twenty over a hundred.",
        { on: ["pr"], add: ["hs.s20", "pr.v20"], cue: { "hs.s20": "twenty of those", "pr.v20": "as a fraction" }, pause: 0.6 });
      push("But we can say it more simply. Watch the lines MERGE: every two rows become one strip, and the square is five equal strips. Our twenty squares are ONE strip out of five. Twenty per cent is a FIFTH.",
        { on: ["k2"], off: ["k1"], add: ["hs.fifths", "pr.fifth"], cue: { "hs.fifths": "watch the lines", "pr.fifth": "one strip out of five" },
          transition: card("Idea 2", "Merge to the simplest fraction"), pause: 0.8 });
      push("Twenty over a hundred and one fifth are equivalent fractions: the same amount of the square, said with smaller numbers. Merging is simplifying.", { pause: 0.8 });
      push("Same question, new number. Watch it roll to fifty per cent. Fifty squares: half the square. Merge into two strips, and it's one of the two. Fifty per cent is a HALF.",
        { on: ["k3"], off: ["k2"], add: ["q.50", "hs.s50", "hs.halves", "pr.v50"], cue: { "q.50": "watch it roll", "hs.s50": "fifty squares", "hs.halves": "merge into two", "pr.v50": "is a half" },
          transition: card("Idea 3", "Same square, new per cent"), pause: 0.8 });
      push("Now ten per cent. One row of ten. Cut the square into ten strips, and it's one of the ten: a TENTH. Ten per cent is a tenth, and that one is worth remembering, because ten per cent of anything is just that amount divided by ten.",
        { add: ["q.10", "hs.s10", "hs.tenths", "pr.v10"], cue: { "q.10": "now ten", "hs.tenths": "cut the square", "pr.v10": "a tenth" }, pause: 0.8 });
      push("And forty per cent: four rows. Merge into fifths again, and that's two strips of the five. Forty per cent is two fifths.",
        { add: ["q.40", "hs.s40", "hs.fifths2", "pr.v40"], cue: { "q.40": "and forty", "hs.fifths2": "merge into fifths", "pr.v40": "two strips" }, pause: 1 });
      push("So a per cent is a fraction out of a hundred. Merge the hundred squares into equal strips to find its simplest name: twenty per cent is a fifth, fifty is a half, ten is a tenth.");
    },
  });
}

/* ── THE BAR: a whole amount (100%) cut into fifths or tenths, one box more, one box gone ── */
const BX = 22, BW = 100, BY = 11, BH = 11;
const TENTHS = Array.from({ length: 9 }, (_, i) => `bd${i + 1}`);
const FIFTHS = ["bd2", "bd4", "bd6", "bd8"];
function amountBar() {
  let o = `<rect data-mb="bar" data-k="bb" x="${BX}" y="${BY}" width="${BW}" height="${BH}" fill="${SKY}" stroke="${INK}" stroke-width="0.8"/>`;
  o += `<rect data-mb="bar" data-k="bx" x="${BX + BW}" y="${BY}" width="${BW / 5}" height="${BH}" fill="${LEAF}" stroke="${INK}" stroke-width="0.8"/>`;
  o += `<g data-mb="num" data-k="bp"><rect x="${BX + 0.8 * BW}" y="${BY}" width="${BW / 5}" height="${BH}" fill="${PALE}" stroke="${INK}" stroke-width="0.8"/>`
    + `<path d="M${BX + 0.8 * BW} ${BY + BH} L${BX + BW} ${BY}" stroke="${RED}" stroke-width="0.8"/></g>`;
  for (let i = 1; i < 10; i++) o += lineMark(`bd${i}`, `M${BX + i * 10} ${BY} V${BY + BH}`, 0.55);
  for (let j = 0; j < 6; j++) o += `<g data-mb="num" data-k="lf${j}">${T(`lfv${j}`, BX + 10 + 20 * j, BY + 7.3, 4.6)}</g>`;
  for (let j = 0; j < 10; j++) o += `<g data-mb="num" data-k="lt${j}">${T(`ltv${j}`, BX + 5 + 10 * j, BY + 7.3, 3.8)}</g>`;
  o += `<g data-mb="name" data-k="top">${T("tv", BX + BW / 2, BY - 2.5, 5.2)}${S(BX + BW / 2, BY + BH + 6, 4.2, "100%")}</g>`;
  return svgBox(150, 36, o);
}
const LF = (n) => Array.from({ length: n }, (_, j) => `lf${j}`);
const LT = Array.from({ length: 10 }, (_, j) => `lt${j}`);
/** "20% of 60 = 12", every number rollable */
function ofRoller() {
  return svgBox(150, 30, `<g data-mb="num" data-k="or">`
    + T("op", 44, 20, 11, "end") + S(45.5, 20, 11, "% of", "start") + T("oa", 72, 20, 11, "start")
    + S(92, 20, 11, "=") + T("on", 98, 20, 11, "start", GREEN)
    + `<g data-k="ofr" style="opacity:0">` + T("ofw", 75, 28.5, 5, "middle", PURPLE, 'font-style="italic"') + `</g></g>`);
}

/* ═══ 2. PERCENT OF, INCREASE AND DECREASE ═════════════════════════════════ */
export function pctChange() {
  const q = (id, pairs, word = null) => (svg, H, stage) => {
    const inner = stage?.querySelector(`[data-t="${id}"]`)?.firstChild;
    pairs.forEach(([from, to, suffix = ""]) => rollAsk(inner, from, to, { instant: isInstant(H), suffix }));
    if (word) swapWord(inner, word[0], word[1], { instant: isInstant(H) });
  };
  const fifthLabels = (v, n = 5) => (s, H) => {
    roll(Object.fromEntries(Array.from({ length: 6 }, (_, j) => [`lfv${j}`, v])))(s, H);
    LF(n).forEach((k, j) => { const g = key(s, k); if (g && g.style.opacity !== "1") H.write(g, 0.2 + j * 0.15); });
  };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "Find 20% of 60." },
      { id: "a2", text: "Increase 80 by 20%." },
    ],
    pics: {
      bar: () => amountBar(),
      or: () => ofRoller(),
      mI: () => main([L("a", "80 + 16"), L("e", "="), L("b", "96", GREEN)]),
      mI2: () => main([L("a", "6 \\times 16 = 96"), L("e", "\\qquad"), L("b", "120\\% = \\tfrac{6}{5}", PURPLE)], 7),
      mD: () => main([L("a", "80 - 16 = 64"), L("e", "\\qquad"), L("b", "80\\% = \\tfrac{4}{5}", PURPLE)], 7),
    },
    picAt: { bar: centred(150, 15), or: at(35), mI: at(37.5), mI2: at(37.5), mD: at(37.5) },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "A per cent OF an amount", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Same question, new numbers", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Increase: one box more", y: 50.5 },
      { id: "k4", receipt: true, sub: "Idea 4", text: "Decrease: one box gone", y: 50.5 },
    ],
    stages: {
      "bar.draw": (s, H) => { H.grow(key(s, "bb"), 0.1); roll({ tv: 60 })(s, H); H.write(key(s, "top"), 0.7); },
      "bar.cut5": linesTo(TENTHS, FIFTHS),
      "bar.l12": fifthLabels(12),
      "or.v": (s, H) => { H.show(key(s, "or")); roll({ op: 20, oa: 60, on: 12, ofw: "a fifth of 60" })(s, H); vis(["ofr"])(s, H); },
      "q.80": q("a1", [["60", 80]]),
      "bar.r80": (s, H) => { roll({ tv: 80 })(s, H); fifthLabels(16)(s, H); },
      "or.r80": roll({ oa: 80, on: 16, ofw: "a fifth of 80" }),
      "or.r10": roll({ op: 10, on: 8, ofw: "a tenth of 80" }),
      "q.10": q("a1", [["20\\%", 10, "\\%"]]),
      "bar.cut10": (s, H) => { linesTo(TENTHS, TENTHS)(s, H); vis(LT, LF(6))(s, H); roll(Object.fromEntries(Array.from({ length: 10 }, (_, j) => [`ltv${j}`, 8])))(s, H);
        LT.forEach((k, j) => { const g = key(s, k); if (g) H.write(g, 0.4 + j * 0.08); }); },
      "bar.merge5": (s, H) => { linesTo(TENTHS, FIFTHS)(s, H); vis(LF(5), LT)(s, H); },
      "bar.ext": (s, H) => { H.grow(key(s, "bx"), 0.2); const g = key(s, "lf5"); if (g) H.write(g, 0.8); },
      "bar.gone": (s, H) => { vis(["bp"], ["bx", "lf5"])(s, H); },
      "q.dec": q("a2", [], ["Increase", "Decrease"]),
      "mI.all": (s, H) => line(s, H, true), "mI2.all": (s, H) => line(s, H), "mD.all": (s, H) => line(s, H, true),
    },
    steps: ({ push }) => {
      push("Find twenty per cent of sixty. A percentage OF something is a part of it, and the box method shows you exactly which part.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Draw sixty as one bar. All of it is a hundred per cent. Now, twenty per cent is a fifth, so CUT the bar into five equal boxes.",
        { on: ["bar", "k1"], add: ["bar.draw", "bar.cut5"], cue: { "bar.draw": "draw sixty", "bar.cut5": "cut the bar" }, transition: card("Idea 1", "A per cent OF an amount"), pause: 0.6 });
      push("Sixty shared into five is twelve. Twelve in every box. So twenty per cent of sixty, one box, is twelve.",
        { on: ["or"], add: ["bar.l12", "or.v"], cue: { "bar.l12": "twelve in every", "or.v": "so twenty per cent" }, pause: 0.8 });
      push("Same question, new number: watch sixty roll up to eighty. The bar is still five boxes, but now each is eighty shared into five... sixteen. Twenty per cent of eighty is sixteen.",
        { on: ["k2"], off: ["k1"], add: ["q.80", "bar.r80", "or.r80"], cue: { "q.80": "watch sixty", "bar.r80": "eighty shared", "or.r80": "twenty per cent of eighty" }, transition: card("Idea 2", "Same question, new numbers"), pause: 0.8 });
      push("And now the per cent rolls down to ten. Ten per cent is a tenth, so CUT every box in two: ten boxes. Eighty shared into ten is eight. Ten per cent of eighty is eight.",
        { add: ["q.10", "bar.cut10", "or.r10"], cue: { "q.10": "the per cent rolls", "bar.cut10": "cut every box", "or.r10": "ten per cent of eighty" }, pause: 0.8 });
      push("Now increase eighty by twenty per cent. First MERGE back into fifths, sixteen in each box. Increasing by twenty per cent means one MORE box of sixteen on the end.",
        { on: ["a2", "k3"], off: ["a1", "or", "k2"], add: ["bar.merge5", "bar.ext"], cue: { "bar.merge5": "first merge", "bar.ext": "one more box" }, transition: card("Idea 3", "Increase: one box more"), pause: 0.6 });
      push("Eighty plus sixteen... ninety-six. Count the boxes: six fifths, which is a hundred and twenty per cent of the old amount.",
        { on: ["mI"], add: ["mI.all"], cue: { "mI.all": "eighty plus" }, pause: 0.6 });
      push("Six boxes of sixteen is ninety-six too. So increasing by twenty per cent is the same as finding a hundred and twenty per cent.",
        { on: ["mI2"], off: ["mI"], add: ["mI2.all"], cue: { "mI2.all": "six boxes" }, pause: 0.8 });
      push("Now watch the question turn round: DECREASE eighty by twenty per cent. The extra box goes, and one of the five boxes goes too; it fades, it's taken away. Four boxes left: eighty take away sixteen is sixty-four, four fifths, eighty per cent.",
        { on: ["mD", "k4"], off: ["mI2", "k3"], add: ["q.dec", "bar.gone", "mD.all"], cue: { "q.dec": "turn round", "bar.gone": "the extra box goes", "mD.all": "four boxes left" },
          transition: card("Idea 4", "Decrease: one box gone"), pause: 1 });
      push("So: a per cent of an amount is that many boxes of it. Increase by a per cent and boxes are added; decrease, and boxes are taken away. Cut for smaller per cents, merge for bigger ones.");
    },
  });
}

/* ═══ 3. PERCENTAGE KEYWORDS, MADE SIMPLE (the long lesson) ════════════════
   *"Focus strongly on the percentages keywords video ... box the keyword and put a little note of
   what it is ... explain the keywords table and show in examples. Other keywords are interest,
   profit, loss, commission. The video can be very detailed, 10 minutes minimum ... let the user see
   you use the keywords very well and note how it is simple. Also show the equivalent fraction way."*
   Every example is the same four moves: read the question and BOX its keyword (a note says what it
   means), draw the whole as equal boxes, let the keyword act on the boxes, then the same answer as
   one multiplication by an equivalent fraction. */
function keywordTable5() {
  const COLS = [
    { head: "Take a part", fill: PART, words: ["of", "commission", "interest", "tax"] },
    { head: "Add on", fill: LEAF, words: ["increase by", "profit", "rise", "more than"] },
    { head: "Take away", fill: "#ffd7a3", words: ["decrease by", "discount", "loss", "off"] },
    { head: "Find the whole", fill: "#e8c8ff", words: ["original", "was", "before", "cost price"] },
    { head: "Out of", fill: BUTTER, words: ["out of", "what percent", "as a percentage", ""] },
  ];
  const X0 = 7.5, W = 27, HH = 8, RH = 6.2, TOP = 2;
  let o = "";
  COLS.forEach((c, j) => {
    const x = X0 + j * W;
    o += `<g data-mb="bar" data-k="th${j}"><rect x="${x}" y="${TOP}" width="${W}" height="${HH}" fill="${c.fill}" stroke="${INK}" stroke-width="0.6"/>`
      + `<text x="${x + W / 2}" y="${TOP + 5.3}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="800" font-size="3.1" fill="${INK}">${c.head}</text></g>`;
    c.words.forEach((w, i) => {
      const y = TOP + HH + i * RH;
      o += `<g data-mb="num" data-k="t${j}-${i}"><rect x="${x}" y="${y}" width="${W}" height="${RH}" fill="#fffdf8" stroke="${INK}" stroke-width="0.4"/>`
        + `<text x="${x + W / 2}" y="${y + 4.3}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="600" font-size="3.1" fill="${INK}">${w}</text></g>`;
    });
  });
  return svgBox(150, TOP * 2 + HH + 4 * RH, o);
}

/** The whole as n equal boxes (each worth `val`), `extra` boxes added on, the last `pale` taken away */
function kbar({ n, val, top, extra = 0, pale = 0 }) {
  const U = Math.min(17, 124 / (n + extra)), X0 = 75 - (U * (n + extra)) / 2, Y = 9, HB = 10;
  const fs = Math.min(4.4, U * 0.42);
  let o = `<g data-mb="name" data-k="top"><path d="M${X0} ${Y - 1.5} V${Y - 3} H${X0 + n * U} V${Y - 1.5}" fill="none" stroke="${INK}" stroke-width="0.5"/>`
    + `<text data-k="topv" x="${X0 + (n * U) / 2}" y="${Y - 4.2}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="4.6" fill="${INK}">${top}</text></g>`;
  for (let i = 0; i < n; i++) {
    o += `<rect data-mb="bar" data-k="b${i}" x="${(X0 + i * U).toFixed(2)}" y="${Y}" width="${U.toFixed(2)}" height="${HB}" fill="${SKY}" stroke="${INK}" stroke-width="0.6"/>`;
    o += `<g data-mb="num" data-k="v${i}">${S(X0 + i * U + U / 2, Y + 6.6, fs, String(val))}</g>`;
  }
  for (let j = 0; j < extra; j++) {
    const x = X0 + (n + j) * U;
    o += `<g data-mb="bar" data-k="x${j}"><rect x="${x.toFixed(2)}" y="${Y}" width="${U.toFixed(2)}" height="${HB}" fill="${LEAF}" stroke="${INK}" stroke-width="0.6"/>${S(x + U / 2, Y + 6.6, fs, String(val))}</g>`;
  }
  for (let i = n - pale; i < n; i++) {
    const x = X0 + i * U;
    o += `<g data-mb="num" data-k="p${i}"><rect x="${x.toFixed(2)}" y="${Y}" width="${U.toFixed(2)}" height="${HB}" fill="${PALE}" stroke="${INK}" stroke-width="0.6"/>`
      + `${S(x + U / 2, Y + 6.6, fs, String(val), "middle", "#9a948a")}<path d="M${x.toFixed(2)} ${Y + HB} L${(x + U).toFixed(2)} ${Y}" stroke="${RED}" stroke-width="0.7"/></g>`;
  }
  o += `<g data-mb="name" data-k="hund">${S(X0 + (n * U) / 2, Y + HB + 5.2, 3.8, "100%", "middle", "#6b645b")}</g>`;
  return svgBox(150, 26, o);
}
const kbarStages = (id, { n, extra = 0, pale = 0, part = 0, topTo = null }) => ({
  [`${id}.base`]: (s, H) => { H.write(key(s, "top"), 0); for (let i = 0; i < n; i++) H.grow(key(s, `b${i}`), 0.3 + i * Math.min(0.2, 2.2 / n)); H.write(key(s, "hund"), 0.5); },
  [`${id}.fill`]: (s, H) => { for (let i = 0; i < n; i++) H.write(key(s, `v${i}`), 0.1 + i * Math.min(0.15, 1.8 / n)); },
  /* THE PART IS COLOURED, and stays coloured: *"why not color the box of emphasis different. This
     visual cues help"*. Each action has its colour: a part is yellow, boxes added on are green,
     boxes taken away go pale and are struck out. */
  [`${id}.part`]: (s, H) => {
    for (let i = 0; i < part; i++) {
      const b = key(s, `b${i}`);
      if (!b) continue;
      if (isInstant(H)) { b.setAttribute("fill", PART); continue; }
      setTimeout(() => { b.style.transition = "fill .45s"; b.setAttribute("fill", PART); }, (0.2 + i * 0.3) * 1000);
      H.lit(b, 0.2 + i * 0.3, 1.2, RED);
    }
    if (!isInstant(H)) H.sound("pop", 0.2);
  },
  [`${id}.add`]: (s, H) => { for (let j = 0; j < extra; j++) H.grow(key(s, `x${j}`), 0.2 + j * 0.3); },
  [`${id}.take`]: (s, H) => { for (let i = n - pale; i < n; i++) H.write(key(s, `p${i}`), 0.2 + (i - n + pale) * 0.3); },
  [`${id}.whole`]: (s, H) => { const t = key(s, "topv"); if (t && topTo != null) { t.textContent = topTo; t.setAttribute("fill", GREEN); } H.sound("ding", 0.2); },
});

export function pctTraps() {
  const kw = (id, k, note, tone) => (svg, H, stage) => {
    const inner = stage?.querySelector(`[data-t="${id}"]`)?.firstChild;
    noteKeyword(inner, k, note, { instant: isInstant(H), tone });
  };
  const col = (j, n) => (s, H) => { H.write(key(s, `th${j}`), 0); for (let i = 0; i < n; i++) H.write(key(s, `t${j}-${i}`), 0.4 + i * 0.35); };
  const TAKE = "#f8d77a", ADD = "#c8f0c0", AWAY = "#ffd7a3", WHOLE = "#e8c8ff", OUT = "#fff3a8";

  /* the eleven examples: the question, its keyword(s) and their notes, the boxes, the two working lines */
  const EX = [
    { id: "e1", q: "Find 20% of 60.", keys: [["of", "of: take a part", TAKE]], bar: { n: 5, val: 12, top: "60", part: 1 },
      mB: "60 \\div 5 = 12\\ \\text{a box, and } 20\\% \\text{ is one box}", mF: "20\\% = \\tfrac{20}{100} = \\tfrac{1}{5},\\quad \\tfrac{1}{5} \\times 60 = 12" },
    { id: "e2", q: "A salesman earns 5% commission on sales of $400. How much commission does he earn?", keys: [["commission", "commission: a part of the sales", TAKE]], bar: { n: 20, val: 20, top: "$400", part: 1 },
      mB: "400 \\div 20 = 20\\ \\text{a box: one box is } \\$20", mF: "5\\% = \\tfrac{5}{100} = \\tfrac{1}{20},\\quad \\tfrac{1}{20} \\times 400 = \\$20" },
    { id: "e3", q: "Ade saves $500 at 10% interest for one year. Find the interest, and the total he then has.", keys: [["interest", "interest: a part, added on", TAKE]], bar: { n: 10, val: 50, top: "$500", part: 1, extra: 1 },
      mB: "\\text{interest} = \\$50,\\quad \\text{total} = 500 + 50 = \\$550", mF: "\\tfrac{1}{10} \\times 500 = 50,\\quad \\tfrac{11}{10} \\times 500 = \\$550" },
    { id: "e4", q: "Increase 80 by 25%.", keys: [["increase", "increase by: add on", ADD]], bar: { n: 4, val: 20, top: "80", extra: 1 },
      mB: "80 + 20 = 100", mF: "100\\% + 25\\% = \\tfrac{5}{4},\\quad \\tfrac{5}{4} \\times 80 = 100" },
    { id: "e5", q: "A trader buys a bag for $60 and sells it at a 20% profit. What is the selling price?", keys: [["profit", "profit: add on to the cost", ADD]], bar: { n: 5, val: 12, top: "$60", extra: 1 },
      mB: "60 + 12 = \\$72", mF: "120\\% = \\tfrac{6}{5},\\quad \\tfrac{6}{5} \\times 60 = \\$72" },
    { id: "e6", q: "A shirt costs $80. In a sale there is a 25% discount. What is the sale price?", keys: [["discount", "discount: take away", AWAY]], bar: { n: 4, val: 20, top: "$80", pale: 1 },
      mB: "80 - 20 = \\$60", mF: "100\\% - 25\\% = \\tfrac{3}{4},\\quad \\tfrac{3}{4} \\times 80 = \\$60" },
    { id: "e7", q: "A phone bought for $150 is sold at a 20% loss. What is the selling price?", keys: [["loss", "loss: take away from the cost", AWAY]], bar: { n: 5, val: 30, top: "$150", pale: 1 },
      mB: "150 - 30 = \\$120", mF: "80\\% = \\tfrac{4}{5},\\quad \\tfrac{4}{5} \\times 150 = \\$120" },
    { id: "e8", q: "Shoes that cost $50 are sold with 30% off. How much are they now?", keys: [["off", "off: take away", AWAY]], bar: { n: 10, val: 5, top: "$50", pale: 3 },
      mB: "50 - 15 = \\$35", mF: "70\\% = \\tfrac{7}{10},\\quad \\tfrac{7}{10} \\times 50 = \\$35" },
    { id: "e9", q: "A pupil scores 18 out of 24 in a test. What is that as a percentage?", keys: [["out of", "out of: make a fraction", OUT]], bar: { n: 4, val: 6, top: "24", part: 3 },
      mB: "18 = 3\\ \\text{of the } 4\\ \\text{boxes} = \\tfrac{3}{4} = 75\\%", mF: "\\tfrac{18}{24} = \\tfrac{3}{4} = \\tfrac{75}{100} = 75\\%" },
    { id: "e10", q: "After a 20% discount, a shirt costs $80. What was the original price?", keys: [["discount", "discount: take away", AWAY], ["original", "original: the whole, before", WHOLE]], bar: { n: 5, val: 20, top: "original ?", pale: 1, topTo: "$100" },
      mB: "80 \\div 4 = 20,\\quad 5 \\times 20 = \\$100", mF: "80 \\div \\tfrac{4}{5} = 80 \\times \\tfrac{5}{4} = \\$100" },
    { id: "e11", q: "A bag is sold for $72 at a 20% profit. Find the cost price.", keys: [["profit", "profit: add on", ADD], ["cost price", "cost price: the whole", WHOLE]], bar: { n: 5, val: 12, top: "cost price ?", extra: 1, topTo: "$60" },
      mB: "72 \\div 6 = 12,\\quad 5 \\times 12 = \\$60", mF: "72 \\div \\tfrac{6}{5} = 72 \\times \\tfrac{5}{6} = \\$60" },
  ];
  const asks = [{ id: "a0", text: "Percentage questions use a few keywords. Learn what each one tells you to do, and every question becomes simple." },
    ...EX.map((e) => ({ id: e.id, text: e.q, keys: e.keys.map((k) => k[0]) })),
    { id: "t1", text: "A price of $100 goes up by 20%, then down by 20%. What is it now?", keys: ["up", "down"] }];
  const pics = { kw: () => keywordTable5() };
  const picAt = { kw: centred(150, 15) };
  const stages = { "kw.c0": col(0, 4), "kw.c1": col(1, 4), "kw.c2": col(2, 4), "kw.c3": col(3, 4), "kw.c4": col(4, 3) };
  EX.forEach((e) => {
    pics[`${e.id}b`] = () => kbar(e.bar);
    pics[`${e.id}B`] = () => main([L("a", e.mB)], 6.4);
    pics[`${e.id}F`] = () => main([L("a", e.mF)], 6.4);
    picAt[`${e.id}b`] = centred(150, 24); picAt[`${e.id}B`] = at(38); picAt[`${e.id}F`] = at(38);
    Object.assign(stages, kbarStages(`${e.id}b`, e.bar));
    stages[`${e.id}B.all`] = (s, H) => { write(s, H, ["a"], 0); H.sound("ding", 0.8); };
    stages[`${e.id}F.all`] = (s, H) => { write(s, H, ["a"], 0); H.sound("ding", 0.8); };
    e.keys.forEach(([k, note, tone], j) => { stages[`k.${e.id}.${j}`] = kw(e.id, k, note, tone); });
  });
  pics.u1 = () => kbar({ n: 5, val: 20, top: "$100", extra: 1 });
  pics.u2 = () => kbar({ n: 5, val: 24, top: "$120", pale: 1 });
  pics.mU = () => main([L("a", "\\tfrac{6}{5} \\times \\tfrac{4}{5} = \\tfrac{24}{25} = 96\\%"), L("e", "\\quad"), L("b", "\\$96,\\ \\text{not } \\$100", RED)], 6.4);
  picAt.u1 = centred(150, 24); picAt.u2 = centred(150, 24); picAt.mU = at(38);
  Object.assign(stages, kbarStages("u1", { n: 5, extra: 1 }), kbarStages("u2", { n: 5, pale: 1 }));
  stages["mU.all"] = (s, H) => line(s, H, true);
  stages["k.t1.0"] = kw("t1", "up", "up 20% of $100", ADD);
  stages["k.t1.1"] = kw("t1", "down", "down 20% of $120!", AWAY);

  /* the words for each example: [read and box the keyword, draw the boxes, the keyword acts, the fraction way] */
  const SAY = {
    e1: ["First, find twenty per cent OF sixty. The keyword is 'of', so I'll box it. 'Of' means take a PART. We're not adding anything or taking anything away; we just want a piece of the sixty.",
      "Draw sixty as the whole, a hundred per cent. Twenty per cent is a fifth, so cut it into five equal boxes. Sixty shared into five is twelve in every box.",
      "Twenty per cent is ONE of those boxes. So twenty per cent of sixty is twelve. Notice how simple that was: the keyword told us what to do, and the boxes did the rest.",
      "And the fraction way, in one line. Twenty per cent is twenty out of a hundred, which is one fifth. 'Of' means multiply, so one fifth times sixty: twelve. Same answer."],
    e2: ["Next keyword: commission. A salesman earns five per cent commission on sales of four hundred dollars. Commission is the salesman's share, a PART of what he sold, so it belongs in the 'take a part' column.",
      "The whole is the sales, four hundred dollars. Five per cent is a twentieth, so cut it into twenty boxes. Four hundred shared into twenty is twenty dollars a box.",
      "His commission is one of those boxes: twenty dollars. That's it.",
      "The fraction way: five per cent is five over a hundred, one twentieth. One twentieth of four hundred is twenty dollars."],
    e3: ["Now interest. Ade saves five hundred dollars at ten per cent interest for a year. Interest is also a PART of the money, but here's the thing to notice: interest gets ADDED to the money in the account.",
      "Draw the five hundred dollars. Ten per cent is a tenth, so cut it into ten boxes of fifty.",
      "The interest is one box: fifty dollars. And because interest is added on, his total is the ten boxes plus one more: five hundred and fifty dollars.",
      "The fraction way: the interest is one tenth of five hundred, fifty. The total is eleven tenths of five hundred: five hundred and fifty. Two questions, one picture."],
    e4: ["Now the 'add on' column. Increase eighty by twenty-five per cent. 'Increase by' means the amount gets BIGGER: we keep all of it, and add some more on.",
      "Draw eighty. Twenty-five per cent is a quarter, so four boxes of twenty.",
      "Increasing by twenty-five per cent adds ONE more box of twenty on the end. Eighty plus twenty: a hundred.",
      "The fraction way: we keep a hundred per cent and add twenty-five, so it's a hundred and twenty-five per cent, five quarters. Five quarters of eighty is a hundred."],
    e5: ["Profit is in the same column. A trader buys a bag for sixty dollars and sells it at a twenty per cent profit. Profit means he sells for MORE than he paid, so profit adds on to the cost.",
      "The cost is the whole: sixty dollars. Twenty per cent is a fifth: five boxes of twelve.",
      "A twenty per cent profit adds one more box of twelve. Sixty plus twelve: the selling price is seventy-two dollars.",
      "The fraction way: a hundred and twenty per cent is six fifths. Six fifths of sixty is seventy-two dollars."],
    e6: ["Now the 'take away' column. A shirt costs eighty dollars, and there's a twenty-five per cent discount. A discount takes money OFF the price: the price goes down.",
      "Draw the eighty dollars. Twenty-five per cent is a quarter: four boxes of twenty.",
      "The discount takes one box away. Watch it go pale. Eighty take away twenty: the sale price is sixty dollars.",
      "The fraction way: a hundred per cent take away twenty-five is seventy-five per cent, three quarters. Three quarters of eighty is sixty dollars."],
    e7: ["Loss is the opposite of profit. A phone bought for a hundred and fifty dollars is sold at a twenty per cent loss. A loss means it's sold for LESS than it cost, so loss takes away from the cost.",
      "The cost is the whole: a hundred and fifty. Twenty per cent is a fifth: five boxes of thirty.",
      "The loss takes one box away. A hundred and fifty take away thirty: the selling price is a hundred and twenty dollars.",
      "The fraction way: eighty per cent is four fifths. Four fifths of a hundred and fifty is a hundred and twenty."],
    e8: ["'Off' is a little word with a big job. Shoes that cost fifty dollars are sold with thirty per cent off. Off means take away, just like discount.",
      "Thirty per cent is three tenths, so cut the fifty dollars into ten boxes of five.",
      "Thirty per cent off takes THREE boxes away. Fifty take away fifteen: thirty-five dollars.",
      "The fraction way: seventy per cent is left, seven tenths. Seven tenths of fifty is thirty-five dollars."],
    e9: ["Now the 'out of' column, which goes the other way. A pupil scores eighteen out of twenty-four. What's that as a percentage? 'Out of' tells you to write it as a FRACTION first.",
      "Draw the twenty-four marks as the whole. Eighteen and twenty-four are both made of sixes, so cut it into four boxes of six.",
      "Eighteen is three of the four boxes: three quarters. And three quarters of a hundred per cent is seventy-five per cent.",
      "The fraction way: eighteen over twenty-four simplifies to three quarters, and three quarters is seventy-five over a hundred: seventy-five per cent."],
    e10: ["Now the column that catches everybody: find the WHOLE. After a twenty per cent discount, a shirt costs eighty dollars. What was the original price? Two keywords: discount, take away; and original, the whole BEFORE the change.",
      "The original price is the whole: five boxes, but we don't know them yet. The discount took one box away, so the eighty dollars is what's LEFT: four boxes.",
      "Four boxes are eighty, so one box is twenty, and the original, all five boxes, is a hundred dollars. Not ninety-six! Taking twenty per cent of eighty would be using the wrong whole.",
      "The fraction way: eighty dollars is four fifths of the original. So divide by four fifths, which is the same as multiplying by five quarters: a hundred dollars."],
    e11: ["One more of those. A bag is sold for seventy-two dollars at a twenty per cent profit. Find the cost price. Profit adds on, and cost price is the whole before the profit.",
      "The cost price is five boxes, and the profit added a sixth. So the seventy-two dollars is SIX boxes.",
      "Six boxes are seventy-two, so one box is twelve, and the cost price, five boxes, is sixty dollars.",
      "The fraction way: seventy-two is six fifths of the cost. Divide by six fifths, times five sixths: sixty dollars."],
  };
  const COLS = { e1: "Take a part", e2: "Take a part", e3: "Take a part", e4: "Add on", e5: "Add on", e6: "Take away", e7: "Take away", e8: "Take away", e9: "Out of", e10: "Find the whole", e11: "Find the whole" };

  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks, pics, picAt,
    lines: [
      { id: "kt", receipt: true, sub: "The table", text: "five things a per cent can do", y: 50.5 },
      ...["Take a part", "Add on", "Take away", "Out of", "Find the whole"].map((t, i) => ({ id: `kc${i}`, receipt: true, sub: "Keyword", text: t, y: 50.5 })),
      { id: "kx", receipt: true, sub: "The trap", text: "the whole moves", y: 50.5 },
    ],
    stages,
    steps: ({ push }) => {
      push("Percentage questions look like they're all different, but they're built from a handful of keywords. In this lesson we'll learn what each keyword tells you to do, and then use them on question after question. You'll see how simple they become.",
        { on: ["a0"], transition: "iris", pause: 0.6 });
      push("Here's the table. The first column: take a PART. 'Of', commission, interest and tax all mean a piece of the amount. Twenty per cent of something, a five per cent commission, ten per cent interest: each is a part.",
        { on: ["kw", "kt"], add: ["kw.c0"], cue: { "kw.c0": "the first column" }, transition: card("The table", "five things a per cent can do"), pause: 0.6 });
      push("The second column: ADD ON. Increase by, profit, rise and more than. The amount gets bigger: you keep all of it and add the part on top.",
        { add: ["kw.c1"], cue: { "kw.c1": "the second column" }, pause: 0.6 });
      push("The third column: TAKE AWAY. Decrease by, discount, loss and off. The amount gets smaller: the part is taken away.",
        { add: ["kw.c2"], cue: { "kw.c2": "the third column" }, pause: 0.6 });
      push("The fourth column: find the WHOLE. Original, was, before and cost price. These tell you the number you want is the hundred per cent, from BEFORE the change. This is where most mistakes happen, so we'll take it slowly.",
        { add: ["kw.c3"], cue: { "kw.c3": "the fourth column" }, pause: 0.6 });
      push("And the last column: OUT OF. Out of, what percent, as a percentage. These go the other way: you're given two amounts and you turn them into a per cent.",
        { add: ["kw.c4"], cue: { "kw.c4": "the last column" }, pause: 0.6 });
      push("Here's the whole method, and it's the same every time. One: find the keyword and box it. Two: draw the whole as equal boxes. Three: let the keyword act on the boxes. Then we'll check it the fraction way. Let's go.", { pause: 1 });

      let prev = ["kw", "a0", "kt"];
      let colOn = null;
      EX.forEach((e, idx) => {
        const s = SAY[e.id], colIdx = ["Take a part", "Add on", "Take away", "Out of", "Find the whole"].indexOf(COLS[e.id]);
        const newCol = `kc${colIdx}`;
        const changeCol = newCol !== colOn;
        push(s[0], { on: [e.id, ...(changeCol ? [newCol] : [])], off: [...prev, ...(changeCol && colOn ? [colOn] : [])],
          add: e.keys.map((_, j) => `k.${e.id}.${j}`), cue: Object.fromEntries(e.keys.map(([k], j) => [`k.${e.id}.${j}`, j ? k : s[0].split(" ").slice(0, 3).join(" ")])),
          ...(changeCol ? { transition: card("Keyword", COLS[e.id]) } : {}), pause: 0.6 });
        colOn = newCol;
        push(s[1], { on: [`${e.id}b`], add: [`${e.id}b.base`, ...(e.bar.topTo ? [] : [`${e.id}b.fill`])], cue: { [`${e.id}b.fill`]: "shared into" }, pause: 0.6 });
        const acts = [...(e.bar.topTo ? [`${e.id}b.fill`] : []), ...(e.bar.part ? [`${e.id}b.part`] : []), ...(e.bar.extra ? [`${e.id}b.add`] : []), ...(e.bar.pale ? [`${e.id}b.take`] : []), ...(e.bar.topTo ? [`${e.id}b.whole`] : [])];
        push(s[2], { on: [`${e.id}B`], add: [...acts, `${e.id}B.all`], pause: 0.8 });
        push(s[3], { on: [`${e.id}F`], off: [`${e.id}B`], add: [`${e.id}F.all`], cue: { [`${e.id}F.all`]: "the fraction way" }, pause: idx === EX.length - 1 ? 1 : 0.8 });
        prev = [e.id, `${e.id}b`, `${e.id}F`];
      });

      /* the trap */
      push("Now a trap that uses two keywords at once. A price of a hundred dollars goes UP by twenty per cent, then DOWN by twenty per cent. Most people say it's back to a hundred. Let's see.",
        { on: ["t1", "kx"], off: [...prev, colOn], add: ["k.t1.0", "k.t1.1"], cue: { "k.t1.0": "goes up", "k.t1.1": "then down" }, transition: card("The trap", "the whole moves"), pause: 0.6 });
      push("Up twenty per cent: the whole is a hundred, five boxes of twenty, and we add one more. A hundred and twenty.",
        { on: ["u1"], add: ["u1.base", "u1.fill", "u1.add"], cue: { "u1.add": "add one more" }, pause: 0.6 });
      push("Now down twenty per cent. But twenty per cent of WHAT? Of the new price, a hundred and twenty. That's the new whole: five boxes of twenty-four. Take one away... ninety-six dollars.",
        { on: ["u2"], off: ["u1"], add: ["u2.base", "u2.fill", "u2.take"], cue: { "u2.take": "take one away" }, pause: 0.8 });
      push("The fraction way shows it straight away: six fifths, then four fifths, is twenty-four twenty-fifths: ninety-six per cent of where you started. The second per cent belongs to a different whole.",
        { on: ["mU"], add: ["mU.all"], cue: { "mU.all": "six fifths" }, pause: 1 });
      push("So that's every percentage question. Box the keyword. Ask which column it's in: take a part, add on, take away, find the whole, or out of. Draw the whole as equal boxes and let the keyword act on them, or do the same thing in one line with an equivalent fraction. A few words, one method, and it really is that simple.");
    },
  });
}
