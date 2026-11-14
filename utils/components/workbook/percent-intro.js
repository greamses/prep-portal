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
import { rollAsk, swapWord } from "./film-ask.js";

const INK = "#2a2723", BLUE = "#2f6f8f", GREEN = "#2f7d4a", PURPLE = "#6b4fa0", RED = "#c0453f";
const SKY = "#bfe3ff", BUTTER = "#fff3a8", LEAF = "#c8f0c0", PALE = "#e6e0d6";
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

/* ═══ 3. KEYWORDS, REVERSE PERCENTAGES AND TRAPS ═══════════════════════════ */
function keywordTable() {
  const COLS = [
    { head: "Take a part", fill: SKY, words: ["of", "per cent of", "what is 20%"] },
    { head: "Add boxes", fill: LEAF, words: ["increase by", "profit", "rise", "more than"] },
    { head: "Take boxes away", fill: "#ffd7a3", words: ["decrease by", "discount", "loss", "off"] },
    { head: "Find the whole", fill: "#e8c8ff", words: ["was", "original", "before", "cost price"] },
  ];
  const X0 = 9, W = 33, HH = 8, RH = 6, TOP = 2;
  let o = "";
  COLS.forEach((c, j) => {
    const x = X0 + j * W;
    o += `<g data-mb="bar" data-k="th${j}"><rect x="${x}" y="${TOP}" width="${W}" height="${HH}" fill="${c.fill}" stroke="${INK}" stroke-width="0.6"/>`
      + `<text x="${x + W / 2}" y="${TOP + 5.4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="800" font-size="3.3" fill="${INK}">${c.head}</text></g>`;
    c.words.forEach((w, i) => {
      const y = TOP + HH + i * RH;
      o += `<g data-mb="num" data-k="t${j}-${i}"><rect x="${x}" y="${y}" width="${W}" height="${RH}" fill="#fffdf8" stroke="${INK}" stroke-width="0.4"/>`
        + `<text x="${x + W / 2}" y="${y + 4.2}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="600" font-size="3.3" fill="${INK}">${w}</text></g>`;
    });
  });
  return svgBox(150, TOP * 2 + HH + 4 * RH, o);
}
/** a bar of n boxes (5 = 100%), with `extra` boxes after it and `pale` boxes at its end */
function boxesBar(label, n, value, { extra = 0, pale = 0, tone = SKY, extraValue = value } = {}) {
  const U = 18, X0 = 30, Y = 6, HB = 10;
  let o = `<g data-mb="name" data-k="bl">${S(X0 - 3, Y + 7, 4.4, label, "end")}</g>`;
  for (let i = 0; i < n + extra; i++) {
    const gone = i >= n - pale && i < n, more = i >= n;
    o += `<g data-mb="bar" data-k="b${i}"><rect x="${X0 + i * U}" y="${Y}" width="${U}" height="${HB}" fill="${gone ? PALE : more ? LEAF : tone}" stroke="${INK}" stroke-width="0.7"/>`
      + S(X0 + i * U + U / 2, Y + 6.8, 4.2, more ? extraValue : value) + (gone ? `<path d="M${X0 + i * U} ${Y + HB} L${X0 + (i + 1) * U} ${Y}" stroke="${RED}" stroke-width="0.8"/>` : "") + `</g>`;
  }
  return svgBox(150, 22, o);
}
const growBoxes = (n, from = 0) => (s, H) => { const lb = key(s, "bl"); if (lb) H.write(lb, 0); for (let i = from; i < n; i++) { const g = key(s, `b${i}`); if (g) H.grow(g, 0.3 + (i - from) * 0.25); } };

export function pctTraps() {
  const act = (id, k) => (svg, H, stage) => {
    if (isInstant(H)) return;
    const n = stage?.querySelector(`[data-t="${id}"] [data-k="kw-${k}"]`);
    if (!n) return;
    n.classList.remove("fa-act"); void n.offsetWidth; n.classList.add("fa-act");
    H.sound("pop", 0);
  };
  const col = (j, n) => (s, H) => { H.write(key(s, `th${j}`), 0); for (let i = 0; i < n; i++) H.write(key(s, `t${j}-${i}`), 0.3 + i * 0.3); };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "A shirt was sold at a 20% discount for $80. What was the original price?" },
      { id: "t1", text: "A price of $100 goes up by 20%, then down by 20%. What is it now?" },
    ],
    pics: {
      kw: () => keywordTable(),
      r1: () => boxesBar("Sale", 4, "20"),
      r2: () => boxesBar("Original", 5, "20"),
      w1: () => boxesBar("Wrong", 4, "20", { extra: 1, extraValue: "16" }),
      u1: () => boxesBar("Up 20%", 5, "20", { extra: 1 }),
      u2: () => boxesBar("Down 20%", 5, "24", { pale: 1 }),
      mR1: () => main([L("a", "80 \\div 4"), L("e", "="), L("b", "20\\ \\text{a box}", BLUE)]),
      mR2: () => main([L("a", "5 \\times 20"), L("e", "="), L("b", "\\$100", GREEN)]),
      mW: () => main([L("a", "80 + 20\\%\\ \\text{of}\\ 80 = 96"), L("e", "\\quad"), L("b", "\\text{wrong!}", RED)], 6.6),
      mU1: () => main([L("a", "100 + 20 = 120"), L("e", "\\quad"), L("b", "\\tfrac{120}{5} = 24\\ \\text{a box}", BLUE)], 6.6),
      mU2: () => main([L("a", "120 - 24"), L("e", "="), L("b", "96 \\ne 100", RED)]),
    },
    picAt: { kw: centred(150, 14), r1: centred(150, 15), r2: centred(150, 15), w1: centred(150, 15), u1: centred(150, 15), u2: centred(150, 15),
      mR1: at(37.5), mR2: at(37.5), mW: at(37.5), mU1: at(37.5), mU2: at(37.5) },
    lines: [
      { id: "k1", receipt: true, sub: "Spot it", text: "what does the per cent do?", y: 50.5 },
      { id: "k2", receipt: true, sub: "Reverse", text: "find the 100% first", y: 50.5 },
      { id: "k3", receipt: true, sub: "The trap", text: "the 100% moves", y: 50.5 },
    ],
    stages: {
      "kw.c0": col(0, 3), "kw.c1": col(1, 4), "kw.c2": col(2, 4), "kw.c3": col(3, 4),
      "x.disc": act("a1", "discount"),
      "r1.grow": growBoxes(4),
      "r2.grow": (s, H) => { for (let i = 0; i < 4; i++) H.show(key(s, `b${i}`)); H.show(key(s, "bl")); H.grow(key(s, "b4"), 0.3); },
      "w1.grow": (s, H) => { for (let i = 0; i < 4; i++) H.show(key(s, `b${i}`)); H.show(key(s, "bl")); H.grow(key(s, "b4"), 0.3); },
      "u1.grow": growBoxes(6),
      "u2.grow": (s, H) => { growBoxes(5)(s, H); },
      "mR1.all": (s, H) => line(s, H), "mR2.all": (s, H) => line(s, H, true), "mW.all": (s, H) => line(s, H), "mU1.all": (s, H) => line(s, H), "mU2.all": (s, H) => line(s, H, true),
    },
    steps: ({ push }) => {
      push("A shirt was sold at a twenty per cent discount for eighty dollars. What was the original price? This is where most people go wrong, so let's first sort out what each percentage word tells you to DO.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Here's a table. 'Of' means take a part: twenty per cent OF sixty is one fifth of it.",
        { on: ["kw", "k1"], add: ["kw.c0"], cue: { "kw.c0": "'Of' means" }, transition: card("Spot it", "what does the per cent do?"), pause: 0.4 });
      push("Increase by, profit, rise and more than ADD boxes to the whole. Decrease by, discount, loss and off TAKE boxes away.",
        { add: ["kw.c1", "kw.c2"], cue: { "kw.c1": "increase by", "kw.c2": "decrease by" }, pause: 0.4 });
      push("And words like was, original, before and cost price tell you the number you're looking for is the WHOLE, the hundred per cent, from before the change.",
        { add: ["kw.c3"], cue: { "kw.c3": "words like was" }, pause: 0.8 });
      push("Back to the shirt. DISCOUNT takes a box away, and ORIGINAL asks for the whole. So the whole is five boxes, and after twenty per cent off, eighty dollars is what's LEFT: four boxes.",
        { on: ["r1", "k2"], off: ["kw", "k1"], add: ["x.disc", "r1.grow"], cue: { "x.disc": "DISCOUNT", "r1.grow": "four boxes" }, transition: card("Reverse", "find the 100% first"), pause: 0.6 });
      push("Four boxes are eighty, so one box is eighty shared into four... twenty dollars.",
        { on: ["mR1"], add: ["mR1.all"], cue: { "mR1.all": "one box is" }, pause: 0.6 });
      push("The original price is all five boxes. Five times twenty... one hundred dollars.",
        { on: ["r2", "mR2"], off: ["r1", "mR1"], add: ["r2.grow", "mR2.all"], cue: { "r2.grow": "all five", "mR2.all": "five times" }, pause: 0.8 });
      push("Here's the trap. A lot of people take twenty per cent of eighty, sixteen, and add it back on: ninety-six. Wrong! The twenty per cent was a fifth of the ORIGINAL, not of the sale price. The boxes in eighty are twenties, not sixteens.",
        { on: ["w1", "mW", "k3"], off: ["r2", "mR2", "k2"], add: ["w1.grow", "mW.all"], cue: { "mW.all": "a lot of people" }, transition: card("The trap", "the 100% moves"), pause: 0.8 });
      push("The same trap in another dress. A hundred dollars goes UP by twenty per cent: one more box of twenty, a hundred and twenty.",
        { on: ["t1", "u1", "mU1"], off: ["a1", "w1", "mW"], add: ["u1.grow", "mU1.all"], cue: { "u1.grow": "one more box", "mU1.all": "a hundred and twenty" }, pause: 0.6 });
      push("Then DOWN by twenty per cent. But twenty per cent of what? Of a hundred and twenty now: the new whole. Its fifths are twenty-fours. Take one away... ninety-six. NOT back to a hundred.",
        { on: ["u2", "mU2"], off: ["u1", "mU1"], add: ["u2.grow", "mU2.all"], cue: { "u2.grow": "its fifths", "mU2.all": "take one away" }, pause: 1 });
      push("So before you work out any percentage, ask: a per cent of WHAT? Find the hundred per cent first, the whole the per cent belongs to, and draw it as five boxes. The keywords help, but the whole decides.");
    },
  });
}
