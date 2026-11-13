/* ============================================================================
   "FIND 1% FIRST" FILMS — for percentages that do not cut into friendly boxes
   ----------------------------------------------------------------------------
   35% is 7 boxes of 20, 26% is 13 of 50: boxes that small cannot be read. So
   these films use a DOUBLE NUMBER LINE (percent along the top, the amount
   along the bottom) and the unitary method: find ONE percent, then any
   percent is that many of it.

     discount35   Scholastic upper primary 2022 first round Q46: an oven at
                  195, 35% off. 1% = 1.95, pay 65% = 126.75. Method 2: build
                  35% from 10% and 5%.
     alloy26      Scholastic upper primary 2025 finals Q33: 26% copper, 130 g
                  of copper wanted. 1% = 5 g, 100% = 500 g. Method 2:
                  equivalent fractions, 26/100 = 130/?.

   Same layout and kit as the other CBT films: the question small at the top,
   the line in the centre, one working line under it, the margin for checks,
   the method on a receipt, MathJax, sounds, a title card before each method.
   ========================================================================== */

import { braceOf, film } from "./film-kit.js";
import { mathLoad, texAt } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";

const INK = "#2a2723", RED = "#c0453f", BLUE = "#2f6f8f", GREEN = "#2f7d4a", GREY = "#6b645b";
const SKY = "#bfe3ff", PEACH = "#ffd9cf", COPPER = "#f2b48a";

/* the double number line: a bar 120 mm long, the percent above it, the amount below */
const X0 = 15, LEN = 120, BY = 17, BH = 10, TOP = 12.5, BOT = 37;
const xAt = (pct) => X0 + (LEN * pct) / 100;
function line({ part, partTone, restTone, labels }) {
  let out = `<rect data-mb="cell" data-k="bar" x="${X0}" y="${BY}" width="${LEN}" height="${BH}" fill="${restTone}" stroke="${INK}" stroke-width="0.5"/>`;
  out += `<rect data-mb="cell" data-k="part" x="${X0}" y="${BY}" width="${(LEN * part / 100).toFixed(2)}" height="${BH}" fill="${partTone}" stroke="${INK}" stroke-width="0.5"/>`;
  /* one percent: a sliver, marked in red */
  out += `<rect data-mb="cell" data-k="one" x="${X0}" y="${BY - 1.5}" width="${(LEN / 100).toFixed(2)}" height="${BH + 3}" fill="${RED}"/>`;
  out += `<line data-mb="cut" data-k="lead" x1="${X0 + 0.6}" y1="${BY - 1.5}" x2="${X0 + 7}" y2="${TOP - 4}" stroke="${RED}" stroke-width="0.4"/>`;
  labels.forEach(({ k, pct, text, below, inside, color, dx = 0 }) => {
    out += texAt(text, xAt(pct) + dx, inside ? BY + BH * 0.7 : below ? BOT : TOP, { em: 4.6, color: color || (below ? BLUE : INK), attrs: `data-mb="num" data-k="${k}"` });
  });
  return svgBox(150, 44, out);
}

function kit() {
  const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
  const write = (s, H, keys, start = 0, gap = 0.35) => keys.forEach((k, i) => {
    const n = key(s, k);
    if (!n) return;
    if (n.getAttribute("data-mb") === "cut") H.score(n, start + i * gap, 0.4); else H.write(n, start + i * gap);
  });
  const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
  const main = (pieces, em = 7.6) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
  const side = (rows, em = 4.6) => svgBox(48, 12 * rows.length + 4, rows.map((pieces, i) => mathRow(pieces, { cx: 24, y: 9 + i * 12, em }).svg).join(""));
  const at = (y) => centred(150, y);
  /* the part of the bar: it grows from the left, the way it is talked about */
  const grow = (s, H, k, d = 0) => { const n = key(s, k); if (n) H.grow(n, d); };
  return { key, write, L, main, side, at, grow };
}

/* ── an oven at 195 with 35% off ── */
export function discount35() {
  const { key, write, L, main, side, at, grow } = kit();
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "In a catalogue, an electric oven is listed at ₦195. A shop sells the oven at a discount of 35%. Find the sale price." }],
    pics: {
      nl: () => line({ part: 65, partTone: SKY, restTone: PEACH, labels: [
        { k: "t0", pct: 0, text: "0\\%" }, { k: "t100", pct: 100, text: "100\\%" }, { k: "t65", pct: 65, text: "65\\%" }, { k: "toff", pct: 82.5, text: "35\\%\\ \\text{off}", color: RED },
        { k: "t1", pct: 0, text: "1\\%", color: RED, dx: 9 },
        { k: "b0", pct: 0, text: "0", below: true }, { k: "b100", pct: 100, text: "\\text{₦}195", below: true },
        { k: "b1", pct: 0, text: "1.95", below: true, color: RED, dx: 9 }, { k: "b65", pct: 65, text: "\\text{₦}126.75", below: true, color: GREEN },
      ] }),
      mW: () => main([L("a", "100\\%"), L("e", "="), L("b", "\\text{₦}195", BLUE)]),
      m1: () => main([L("a", "1\\%"), L("e", "="), L("b", "195 \\div 100"), L("e2", "="), L("c", "1.95", RED)]),
      m65: () => main([L("a", "65\\%"), L("e", "="), L("b", "65 \\times 1.95"), L("e2", "="), L("c", "\\text{₦}126.75", GREEN)]),
      sC: () => side([[L("a", "35 \\times 1.95 = 68.25")], [L("b", "195 - 68.25")], [L("c", "= 126.75\\ \\checkmark", GREEN)]]),
      bld: () => svgBox(150, 58, [
        ["a", "10\\% = 195 \\div 10 = 19.5", INK], ["b", "30\\% = 3 \\times 19.5 = 58.5", INK], ["c", "5\\% = 19.5 \\div 2 = 9.75", INK],
        ["d", "35\\% = 58.5 + 9.75 = 68.25", BLUE], ["e", "195 - 68.25 = \\text{₦}126.75", GREEN],
      ].map(([k, t, c], i) => mathRow([L(k, t, c)], { cx: 75, y: 8 + i * 11, em: 6.4 }).svg).join("")),
    },
    picAt: { nl: at(14), mW: at(33.5), m1: at(33.5), m65: at(33.5), sC: { x: 79.5, y: 14 }, bld: at(15) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Find 1% first", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Build it from 10%", y: 50.5 },
    ],
    stages: {
      "nl.bar": (s, H) => { grow(s, H, "bar"); write(s, H, ["t0", "b0", "t100", "b100"], 0.6, 0.3); },
      "nl.one": (s, H) => { write(s, H, ["one"], 0); write(s, H, ["lead", "t1"], 0.4, 0.3); },
      "nl.b1": (s, H) => write(s, H, ["b1"], 0),
      "nl.pay": (s, H) => { grow(s, H, "part"); write(s, H, ["t65", "toff"], 0.7, 0.5); },
      "nl.b65": (s, H) => { write(s, H, ["b65"], 0); H.sound("ding", 0.3); },
      "mW.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.4),
      "m1.a": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.4),
      "m1.b": (s, H) => write(s, H, ["e2", "c"], 0, 0.4),
      "m65.a": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.4),
      "m65.b": (s, H) => write(s, H, ["e2", "c"], 0, 0.4),
      "sC.all": (s, H) => { write(s, H, ["a", "b"], 0, 1.6); write(s, H, ["c"], 3.6); H.sound("ding", 3.8); },
      ...Object.fromEntries(["a", "b", "c", "d", "e"].map((k) => [`bld.${k}`, (s, H) => { write(s, H, [k], 0); if (k === "e") H.sound("ding", 0.4); }])),
    },
    steps: ({ push }) => {
      push("An electric oven is listed at 195 naira.", { on: ["a1"], transition: "iris", pause: 0.5 });
      push("The shop gives a discount of thirty five percent.", { pause: 0.6 });
      push("So we pay less than 195. But how much less?", { pause: 1.2 });
      push("Draw the price as a bar. The whole bar is a hundred percent. That's 195 naira.",
        { on: ["nl", "k1", "mW"], add: ["nl.bar", "mW.all"], cue: { "nl.bar": "draw the price", "mW.all": "that's 195" },
          transition: { kind: "card", title: "Method 1", sub: "Find 1% first", hold: 1.6 }, pause: 0.6 });
      push("Here's the trick. Find one percent first. One percent is 195 shared into a hundred.",
        { on: ["m1"], off: ["mW"], add: ["nl.one", "m1.a"], cue: { "nl.one": "one percent first", "m1.a": "shared into" }, pause: 0.6 });
      push("195 divided by a hundred... 1.95.", { add: ["m1.b", "nl.b1"], cue: { "m1.b": "1.95", "nl.b1": "1.95" }, pause: 0.8 });
      push("Thirty five percent comes off, so we pay the rest. A hundred take away thirty five... sixty five percent.",
        { add: ["nl.pay"], cue: { "nl.pay": "we pay the rest" }, pause: 0.8 });
      push("Sixty five percent is sixty five lots of one percent. Sixty five times 1.95...",
        { on: ["m65"], off: ["m1"], add: ["m65.a"], cue: { "m65.a": "sixty five times" }, pause: 0.6 });
      push("126.75. So we pay 126 naira, 75 kobo.", { add: ["m65.b", "nl.b65"], cue: { "m65.b": "126.75", "nl.b65": "so we pay" }, pause: 1 });
      push("Check it. The discount is thirty five lots of 1.95. That's 68.25. 195 take away 68.25... 126.75. It works.",
        { on: ["sC"], add: ["sC.all"], cue: { "sC.all": "check it" }, pause: 1 });
      push("Another way, with no one percent at all. Ten percent is easy: divide by ten. 19.5.",
        { on: ["bld", "k2"], off: ["nl", "m65", "sC", "k1"], add: ["bld.a"], cue: { "bld.a": "ten percent is easy" },
          transition: { kind: "card", title: "Method 2", sub: "Build it from 10%", hold: 1.6 }, pause: 0.6 });
      push("Thirty percent is three tens. Three times 19.5, 58.5.", { add: ["bld.b"], cue: { "bld.b": "three tens" }, pause: 0.6 });
      push("Five percent is half of ten percent. Half of 19.5, 9.75.", { add: ["bld.c"], cue: { "bld.c": "half of ten" }, pause: 0.6 });
      push("So thirty five percent is 58.5 plus 9.75... 68.25.", { add: ["bld.d"], cue: { "bld.d": "58.5 plus" }, pause: 0.6 });
      push("Take that off the price. 195 take away 68.25... 126.75. Same answer.", { add: ["bld.e"], cue: { "bld.e": "195 take away" }, pause: 1 });
      push("Two ways, one answer. Find one percent first, or build the percent from tens and fives.");
    },
  });
}

/* ── 26% copper: how much alloy gives 130 g of copper ── */
export function alloy26() {
  const { key, write, L, main, side, at, grow } = kit();
  const eqSvg = () => {
    const r = mathRow([{ k: "L", frac: ["26", "100"] }, { gap: 6 }, { k: "eq", tex: "=" }, { gap: 6 }, { k: "R", frac: ["130", "?"] }], { cx: 69, y: 34, em: 11 });
    const Lf = r.at.L, Rr = r.at.R;
    const arc = (kk, x1, x2, y, up) => {
      const cx = (x1 + x2) / 2, cy = up ? y - 11 : y + 11;
      const dx = x2 - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      const head = (turn) => { const c = Math.cos(turn), s2 = Math.sin(turn); const bx = -ux * c + uy * s2, by = -uy * c - ux * s2; return `M${x2.toFixed(2)} ${y.toFixed(2)} l${(bx * 3.6).toFixed(2)} ${(by * 3.6).toFixed(2)}`; };
      return `<g data-mb="brace" data-mb-key="${kk}"><path d="M${x1.toFixed(2)} ${y.toFixed(2)} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y.toFixed(2)} ${head(0.45)} ${head(-0.45)}" fill="none" stroke="${RED}" stroke-width="0.9" stroke-linecap="round"/></g>`;
    };
    const word = (k, t, y) => texAt(`\\text{${t}}`, Rr.x + Rr.w / 2 + 4, y, { em: 4.6, color: GREY, anchor: "start", attrs: `data-mb="name" data-k="${k}"` });
    const topY = Lf.topBase - Lf.topAsc - 2, botY = Lf.botBase + 3, end = Rr.x - Math.max(Rr.topW, Rr.botW) / 2 - 3;
    return svgBox(150, 62, r.svg
      + texAt("500", Rr.x, Rr.botBase, { em: 11, color: GREEN, attrs: 'data-mb="num" data-k="ans"' })
      + word("wt", "copper", Lf.topBase) + word("wb", "alloy", Lf.botBase)
      + arc("over", Lf.x + 2, end, topY, true) + arc("under", Lf.x + 2, end, botY, false)
      + texAt("\\times 5", (Lf.x + Rr.x) / 2 - 2, topY - 9, { em: 5.4, color: RED, attrs: 'data-mb="num" data-k="xo"' })
      + texAt("\\times 5", (Lf.x + Rr.x) / 2 - 2, botY + 12, { em: 5.4, color: RED, attrs: 'data-mb="num" data-k="xu"' }));
  };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "An alloy contains 26% of copper. What quantity of alloy is required to get 130 g of copper?" }],
    pics: {
      nl: () => line({ part: 26, partTone: COPPER, restTone: "#e8edf3", labels: [
        { k: "t0", pct: 0, text: "0\\%" }, { k: "t100", pct: 100, text: "100\\%" }, { k: "t26", pct: 26, text: "26\\%" }, { k: "tcu", pct: 13, text: "\\text{copper}", color: "#7a3410", inside: true },
        { k: "t1", pct: 0, text: "1\\%", color: RED, dx: 9 },
        { k: "b0", pct: 0, text: "0", below: true }, { k: "b26", pct: 26, text: "130\\text{ g}", below: true },
        { k: "b1", pct: 0, text: "5\\text{ g}", below: true, color: RED, dx: 9 }, { k: "bq", pct: 100, text: "?", below: true }, { k: "b100", pct: 100, text: "500\\text{ g}", below: true, color: GREEN },
      ] }),
      m26: () => main([L("a", "26\\%"), L("e", "="), L("b", "130\\text{ g}", BLUE)]),
      m1: () => main([L("a", "1\\%"), L("e", "="), L("b", "130 \\div 26"), L("e2", "="), L("c", "5\\text{ g}", RED)]),
      m100: () => main([L("a", "100\\%"), L("e", "="), L("b", "100 \\times 5"), L("e2", "="), L("c", "500\\text{ g}", GREEN)]),
      sC: () => side([[L("a", "26\\%\\ \\text{of}\\ 500")], [L("b", "= 26 \\times 5")], [L("c", "= 130\\ \\checkmark", GREEN)]]),
      eq: () => eqSvg(),
    },
    picAt: { nl: at(14), m26: at(33.5), m1: at(33.5), m100: at(33.5), sC: { x: 79.5, y: 14 }, eq: centred(150, 15) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Find 1% first", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Equivalent fractions", y: 50.5 },
    ],
    stages: {
      "nl.bar": (s, H) => { grow(s, H, "bar"); write(s, H, ["t0", "b0", "t100", "bq"], 0.6, 0.3); },
      "nl.cu": (s, H) => { grow(s, H, "part"); write(s, H, ["tcu", "t26", "b26"], 0.7, 0.4); },
      "nl.one": (s, H) => { write(s, H, ["one"], 0); write(s, H, ["lead", "t1"], 0.4, 0.3); },
      "nl.b1": (s, H) => write(s, H, ["b1"], 0),
      "nl.b100": (s, H) => { const q = key(s, "bq"); if (q) q.style.opacity = "0"; write(s, H, ["b100"], 0); H.sound("ding", 0.3); },
      "m26.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.4),
      "m1.a": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.4),
      "m1.b": (s, H) => write(s, H, ["e2", "c"], 0, 0.4),
      "m100.all": (s, H) => { write(s, H, ["a", "e", "b"], 0, 0.4); write(s, H, ["e2", "c"], 1.8, 0.4); },
      "sC.all": (s, H) => { write(s, H, ["a", "b"], 0, 1.2); write(s, H, ["c"], 2.6); H.sound("ding", 2.8); },
      "eq.left": (s, H) => write(s, H, ["Ln", "Lr", "Ld"], 0, 0.3),
      "eq.right": (s, H) => write(s, H, ["eq", "Rn", "wt", "Rr", "Rd", "wb"], 0, 0.35),
      "eq.over": (s, H) => { H.draw(braceOf(s, "over"), 0); write(s, H, ["xo"], 0.6); },
      "eq.under": (s, H) => { H.draw(braceOf(s, "under"), 0); write(s, H, ["xu"], 0.6); },
      "eq.ans": (s, H) => { const q = key(s, "Rd"); if (q) q.style.opacity = "0"; write(s, H, ["ans"], 0.1); H.sound("ding", 0.5); },
    },
    steps: ({ push }) => {
      push("An alloy is a metal made by mixing metals together.", { on: ["a1"], transition: "iris", pause: 0.5 });
      push("This alloy is twenty six percent copper.", { pause: 0.6 });
      push("We want 130 grams of copper. How much alloy do we need?", { pause: 1.2 });
      push("Draw the alloy as a bar. The whole bar is a hundred percent of the alloy. We don't know how much that is yet.",
        { on: ["nl", "k1"], add: ["nl.bar"], cue: { "nl.bar": "draw the alloy" },
          transition: { kind: "card", title: "Method 1", sub: "Find 1% first", hold: 1.6 }, pause: 0.6 });
      push("Twenty six percent of it is copper. That's this part, and it's 130 grams.",
        { on: ["m26"], add: ["nl.cu", "m26.all"], cue: { "nl.cu": "twenty six percent", "m26.all": "130 grams" }, pause: 0.8 });
      push("Now find one percent. Twenty six percent is 130 grams, so one percent is 130 shared into twenty six.",
        { on: ["m1"], off: ["m26"], add: ["nl.one", "m1.a"], cue: { "nl.one": "find one percent", "m1.a": "shared into" }, pause: 0.6 });
      push("130 divided by twenty six... five grams.", { add: ["m1.b", "nl.b1"], cue: { "m1.b": "five grams", "nl.b1": "five grams" }, pause: 0.8 });
      push("And the whole alloy is a hundred percent. A hundred lots of five grams... 500 grams.",
        { on: ["m100"], off: ["m1"], add: ["m100.all", "nl.b100"], cue: { "m100.all": "a hundred lots", "nl.b100": "500 grams" }, pause: 1 });
      push("Check it. Twenty six percent of 500 is twenty six fives... 130. It works.", { on: ["sC"], add: ["sC.all"], cue: { "sC.all": "check it" }, pause: 1 });
      push("Another way. Twenty six out of every hundred grams is copper.",
        { on: ["eq", "k2"], off: ["nl", "m100", "sC", "k1"], add: ["eq.left"], cue: { "eq.left": "twenty six out of" },
          transition: { kind: "card", title: "Method 2", sub: "Equivalent fractions", hold: 1.6 }, pause: 0.6 });
      push("And we want 130 grams of copper, out of an amount of alloy we don't know.", { add: ["eq.right"], cue: { "eq.right": "130 grams" }, pause: 0.6 });
      push("Look at the tops. Twenty six becomes 130. Twenty six times what? Five.", { add: ["eq.over"], cue: { "eq.over": "becomes" }, pause: 0.8 });
      push("So the bottom is multiplied by five too. A hundred times five... 500.", { add: ["eq.under", "eq.ans"], cue: { "eq.under": "so the bottom", "eq.ans": "500." }, pause: 1 });
      push("So we need 500 grams of alloy to get 130 grams of copper.", { pause: 0.8 });
      push("Two ways, one answer. Find one percent first, and any percent is easy.");
    },
  });
}
