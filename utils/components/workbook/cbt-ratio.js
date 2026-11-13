/* ============================================================================
   RATIO FILMS FOR CBT QUESTIONS — one film, two kinds of question
   ----------------------------------------------------------------------------
     total   a total is shared in a ratio ("$600 in the ratio 3 : 2 : 1:
             what is Idowu's share?")
     part    one share is known ("boys to girls is 3 : 4, there are 60
             girls: how many boys?")

   Method 1, THE BOX METHOD: a bar for each person, cut into as many equal
   boxes as their number in the ratio. Find what ONE box is worth (the total
   over all the boxes, or the known share over its own boxes), write it in
   every box, then count the boxes asked for.
   Method 2: total -> a FRACTION OF THE WHOLE (Idowu has 1 box of 6: one
   sixth of 600); part -> EQUIVALENT FRACTIONS (3/4 = ?/60, times one box).

   Same layout and kit as ./cbt-films.js: the question small at the top, the
   picture in the centre, one working line under it, the margin for checks,
   the method on a receipt, MathJax, sounds, a title card before each method.
   The narration is written once (`steps` below) and filled from each
   question's config, so a new ratio question is a config, not a film.
   ========================================================================== */

import { modelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";
import { braceOf, film, mb, part } from "./film-kit.js";
import { mathLoad, mathifyPic, texAt } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W, K_ } from "./cbt-films.js";

const INK = "#2a2723", RED = "#c0453f", BLUE = "#2f6f8f", GREEN = "#2f7d4a", GREY = "#6b645b";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const word = (n) => WORDS[n] || String(n);
const fmt = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const tex = (n) => fmt(n).replace(/,/g, "{,}");

/**
 * cfg:
 *   question, story: [3 lines]
 *   names: ["Taiwo", "Kehinde", "Idowu"], ratio: [3, 2, 1]
 *   total: 600            (total mode)   | known: { who: 1, value: 60 }  (part mode)
 *   ask: index of the share asked for, or "all"
 *   money: "$" | "₦" | ""   unit: "" | "boys" ...   (said after numbers in the answer line)
 *   thing: "the money"      (what the total is, in words)
 *   closing: last line
 */
export function ratioFilm(cfg) {
  const { names, ratio } = cfg;
  const PART = !!cfg.known;
  const N = ratio.reduce((a, b) => a + b, 0);
  const UNIT = PART ? cfg.known.value / ratio[cfg.known.who] : cfg.total / N;
  const TOTAL = UNIT * N;
  const shares = ratio.map((r) => r * UNIT);
  const asks = cfg.ask === "all" ? ratio.map((_, i) => i) : [cfg.ask];
  const m = cfg.money || "";
  const money = (v) => `${m}${fmt(v)}`;
  /* a "$" inside \text{} opens maths mode and breaks the whole expression (it showed as raw
     "dfrac..." in the Taiwo film), so a dollar is written \$ */
  const moneyTex = (v) => `${m ? (m === "$" ? "\\$" : `\\text{${m}}`) : ""}${tex(v)}`;

  /* the bars: one row each, as many boxes as the ratio says, all the same size */
  const maxR = Math.max(...ratio);
  const CAP = Math.min(22, 104 / maxR);
  const rowsOf = (text) => ratio.map((r, i) => ({
    name: names[i],
    parts: Array.from({ length: r }, () => part(text, 1, ["a", "c", "d", "b"][i % 4])),
    ...(PART && i === cfg.known.who ? { below: [{ from: 0, to: r, text: money(cfg.known.value) }] } : {}),
    ...(PART && asks.includes(i) ? { below: [{ from: 0, to: r, text: "?" }] } : {}),
  }));
  const bars = (text) => mathifyPic(modelSvg(rowsOf(text), { cap: CAP, label: "", ...(PART ? {} : { total: money(TOTAL) }) }));
  const W = 18 + maxR * CAP + (PART ? 0 : 18);
  const BAR_AT = { x: 50 - (W * K_) / 2 + 18 * K_, y: 15 };

  const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
  const write = (s, H, keys, start = 0, gap = 0.35) => keys.forEach((k, i) => { const n = key(s, k); if (n) H.write(n, start + i * gap); });
  const main = (pieces, em = 8) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
  const side = (rows, em = 4.8) => svgBox(48, 12 * rows.length + 4, rows.map((pieces, i) => mathRow(pieces, { cx: 24, y: 9 + i * 12, em }).svg).join(""));
  const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
  const at = (y) => centred(150, y);

  /* the working lines */
  const sumTex = ratio.join(" + ");
  const a0 = asks[0], ra = ratio[a0];
  const answerTex = asks.length > 1 ? asks.map((i) => moneyTex(shares[i])).join("\\text{ and }") : moneyTex(shares[a0]);

  /* method two, part mode: the board r_a / r_k = ? / known */
  const eqSvg = () => {
    const k = cfg.known.who;
    const r = mathRow([{ k: "L", frac: [String(ra), String(ratio[k])] }, { gap: 6 }, { k: "eq", tex: "=" }, { gap: 6 }, { k: "R", frac: ["?", tex(cfg.known.value)] }], { cx: 69, y: 34, em: 11 });
    const Lf = r.at.L, Rr = r.at.R;
    const word2 = (kk, t, y) => texAt(`\\text{${t}}`, Rr.x + Rr.w / 2 + 4, y, { em: 4.6, color: GREY, anchor: "start", attrs: `data-mb="name" data-k="${kk}"` });
    const arc = (kk, x1, x2, y, up) => {
      const cx = (x1 + x2) / 2, cy = up ? y - 11 : y + 11;
      const dx = x2 - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      const head = (turn) => { const c = Math.cos(turn), s2 = Math.sin(turn); const bx = -ux * c + uy * s2, by = -uy * c - ux * s2; return `M${x2.toFixed(2)} ${y.toFixed(2)} l${(bx * 3.6).toFixed(2)} ${(by * 3.6).toFixed(2)}`; };
      return `<g data-mb="brace" data-mb-key="${kk}"><path d="M${x1.toFixed(2)} ${y.toFixed(2)} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y.toFixed(2)} ${head(0.45)} ${head(-0.45)}" fill="none" stroke="${RED}" stroke-width="0.9" stroke-linecap="round"/></g>`;
    };
    const topY = Lf.topBase - Lf.topAsc - 2, botY = Lf.botBase + 3, end = Rr.x - Math.max(Rr.topW, Rr.botW) / 2 - 3;
    return svgBox(150, 62, r.svg
      + texAt(tex(shares[a0]), Rr.x, Rr.topBase, { em: 11, color: GREEN, attrs: 'data-mb="num" data-k="ans"' })
      + word2("wt", names[a0], Lf.topBase) + word2("wb", names[k], Lf.botBase)
      + arc("over", Lf.x + 2, end, topY, true) + arc("under", Lf.x + 2, end, botY, false)
      + texAt(`\\times ${tex(UNIT)}`, (Lf.x + Rr.x) / 2 - 2, topY - 9, { em: 5.2, color: RED, attrs: 'data-mb="num" data-k="xo"' })
      + texAt(`\\times ${tex(UNIT)}`, (Lf.x + Rr.x) / 2 - 2, botY + 12, { em: 5.2, color: RED, attrs: 'data-mb="num" data-k="xu"' }));
  };

  const rowStage = (i) => (s, H) => {
    const ns = mb(s, "name")[i], bs = mb(s, "bar", i);
    if (ns) H.write(ns, 0);
    bs.forEach((b, j) => H.grow(b, 0.3 + j * 0.25));
  };
  const showBars = (s, H) => { mb(s, "name").forEach((n) => H.show(n)); mb(s, "bar").forEach((n) => H.show(n)); };

  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: cfg.question }],
    pics: {
      b1: () => bars(""),
      b2: () => bars(money(UNIT).replace(m, "")),
      mN: () => main([L("a", sumTex), L("e", "="), L("b", `${N}\\ \\text{boxes}`, BLUE)]),
      mU: () => main(PART
        ? [L("a", `${tex(cfg.known.value)} \\div ${ratio[cfg.known.who]}`), L("e", "="), L("b", tex(UNIT), BLUE)]
        : [L("a", `${tex(TOTAL)} \\div ${N}`), L("e", "="), L("b", tex(UNIT), BLUE)]),
      mA: () => main(asks.length > 1
        ? [L("a", asks.map((i) => `${ratio[i]} \\times ${tex(UNIT)}`).join(",\\ ")), L("e", "\\to"), L("b", answerTex, GREEN)]
        : [L("a", `${ra} \\times ${tex(UNIT)}`), L("e", "="), L("b", answerTex, GREEN)], asks.length > 1 ? 6.6 : 8),
      sC: () => side([[L("a", shares.map((v) => tex(v)).join(" + "))], [L("b", `= ${tex(TOTAL)}\\ \\checkmark`, GREEN)]], shares.length > 3 ? 4 : 4.8),
      sK: () => side([[L("a", `${tex(shares[a0])} : ${tex(cfg.known?.value ?? 0)}`)], [L("b", `= ${ra} : ${ratio[cfg.known?.who ?? 0]}\\ \\checkmark`, GREEN)]]),
      mF: () => main([L("a", `\\text{${names[a0]}}`), L("e", "="), L("b", `\\dfrac{${ra}}{${N}}\\ \\text{of}\\ ${moneyTex(TOTAL)}`, BLUE)]),
      mG: () => main([L("a", `${tex(TOTAL)} \\div ${N} \\times ${ra}`), L("e", "="), L("b", answerTex, GREEN)]),
      eq: () => (PART ? eqSvg() : svgBox(150, 10, "")),
    },
    picAt: {
      b1: BAR_AT, b2: BAR_AT, mN: at(37.5), mU: at(37.5), mA: at(37.5), sC: { x: 79.5, y: 16 }, sK: { x: 79.5, y: 16 },
      mF: at(37.5), mG: at(37.5), eq: centred(150, 15),
    },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "The box method", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: PART ? "Equivalent fractions" : "Fraction of the whole", y: 50.5 },
    ],
    stages: {
      ...Object.fromEntries(ratio.map((_, i) => [`b1.r${i}`, rowStage(i)])),
      "b1.total": (s, H) => H.draw(braceOf(s, "total"), 0),
      "b1.known": (s, H) => { if (PART) H.draw(braceOf(s, `below-${cfg.known.who}-0`), 0); },
      "b2.base": (s, H) => { showBars(s, H); if (PART) H.show(braceOf(s, `below-${cfg.known.who}-0`)); else H.show(braceOf(s, "total")); },
      "b2.fill": (s, H) => mb(s, "num").forEach((n, i) => H.write(n, i * 0.12)),
      "b2.ask": (s, H) => { if (PART) H.draw(braceOf(s, `below-${a0}-0`), 0); else asks.forEach((i) => mb(s, "bar", i).forEach((b) => H.lit(b, 0.2, 2.4))); },
      "mN.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.6),
      "mU.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.4); },
      "mA.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.4); H.sound("ding", 1.6); },
      "sC.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["b"], 1.2); H.sound("ding", 1.4); },
      "sK.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["b"], 1.2); H.sound("ding", 1.4); },
      "mF.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.6),
      "mG.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.6); write(s, H, ["b"], 1.6); H.sound("ding", 1.8); },
      "eq.left": (s, H) => write(s, H, ["Ln", "Lr", "Ld"].map((x) => x), 0, 0.3),
      "eq.right": (s, H) => write(s, H, ["eq", "Rd", "Rr", "wb", "Rn", "wt"], 0, 0.35),
      "eq.under": (s, H) => { H.draw(braceOf(s, "under"), 0); write(s, H, ["xu"], 0.6); },
      "eq.over": (s, H) => { H.draw(braceOf(s, "over"), 0); write(s, H, ["xo"], 0.6); },
      "eq.ans": (s, H) => { const q = key(s, "Rn"); if (q) q.style.opacity = "0"; write(s, H, ["ans"], 0.1); H.sound("ding", 0.5); },
    },
    steps: ({ push }) => {
      push(cfg.story[0], { on: ["a1"], transition: "iris", pause: 0.6 });
      push(cfg.story[1], { pause: 0.6 });
      push(cfg.story[2], { pause: 1 });

      /* ── METHOD ONE: THE BOX METHOD ── */
      const rowWords = names.map((n, i) => `${n}, ${word(ratio[i])} ${ratio[i] === 1 ? "box" : "boxes"}`);
      push(`Draw a bar for each one, cut into equal boxes. ${rowWords.join(". ")}.`,
        { on: ["b1", "k1"], add: ratio.map((_, i) => `b1.r${i}`),
          cue: Object.fromEntries(names.map((n, i) => [`b1.r${i}`, `${n},`])),
          transition: { kind: "card", title: "Method 1", sub: "The box method", hold: 1.6 }, pause: 0.6 });
      push("Every box is the same size. That's the whole idea of a ratio. The numbers in the ratio are counting boxes.", { pause: 0.8 });
      if (!PART) {
        push(`Count all the boxes. ${ratio.map(word).join(" plus ")}... ${word(N)} boxes.`, { on: ["mN"], add: ["mN.all"], cue: { "mN.all": "count all" }, pause: 0.6 });
        push(`And all ${word(N)} boxes together are ${cfg.thing}, ${money(TOTAL)}.`, { add: ["b1.total"], cue: { "b1.total": "together" }, pause: 0.8 });
        push(`So one box is ${money(TOTAL)} shared into ${word(N)}... ${money(UNIT)}.`,
          { on: ["b2", "mU"], off: ["b1", "mN"], add: ["b2.base", "mU.all", "b2.fill"], cue: { "mU.all": "shared into", "b2.fill": `${fmt(UNIT)}.` }, pause: 0.8 });
      } else {
        const k = cfg.known.who;
        push(`We know ${names[k]}: ${money(cfg.known.value)}. That's ${names[k]}'s ${word(ratio[k])} boxes.`, { add: ["b1.known"], cue: { "b1.known": `that's` }, pause: 0.8 });
        push(`So one box is ${money(cfg.known.value)} shared into ${word(ratio[k])}... ${money(UNIT)}.`,
          { on: ["b2", "mU"], off: ["b1"], add: ["b2.base", "mU.all", "b2.fill"], cue: { "mU.all": "shared into", "b2.fill": `${fmt(UNIT)}.` }, pause: 0.8 });
      }
      push(`Write ${money(UNIT)} in every box. They're all the same size, so they're all worth the same.`, { pause: 0.6 });
      const askLine = asks.length > 1
        ? `So ${asks.map((i) => `${names[i]} has ${word(ratio[i])} boxes, ${money(shares[i])}`).join(", and ")}.`
        : `${names[a0]} has ${word(ra)} ${ra === 1 ? "box" : "boxes"}. ${ra === 1 ? "" : `${word(ra)} times ${money(UNIT)}... `}${money(shares[a0])}.`;
      push(askLine, { on: ["mA"], off: ["mU"], add: ["b2.ask", "mA.all"], cue: { "mA.all": names[a0] }, pause: 1 });
      if (!PART) push(`Check it. Every share together: ${shares.map((v) => money(v)).join(", ")}. That makes ${money(TOTAL)}. It works.`, { on: ["sC"], add: ["sC.all"], cue: { "sC.all": "every share" }, pause: 1 });
      else push(`Check it. ${money(shares[a0])} to ${money(cfg.known.value)} is the same as ${word(ra)} to ${word(ratio[cfg.known.who])}. It works.`, { on: ["sK"], add: ["sK.all"], cue: { "sK.all": "check it" }, pause: 1 });

      /* ── METHOD TWO ── */
      if (!PART) {
        push(`Now another way. ${names[a0]} has ${word(ra)} of the ${word(N)} boxes. That's ${word(ra)} ${N === 2 ? "half" : `over ${word(N)}`} of the whole.`,
          { on: ["mF", "k2"], off: ["mA", "sC", "k1"], add: ["mF.all", "b2.ask"], cue: { "mF.all": "of the whole" },
            transition: { kind: "card", title: "Method 2", sub: "Fraction of the whole", hold: 1.6 }, pause: 0.8 });
        push(`So divide ${money(TOTAL)} by ${word(N)}, and take ${word(ra)}... ${money(shares[a0])}.`, { on: ["mG"], off: ["mF"], add: ["mG.all"], cue: { "mG.all": "divide" }, pause: 1 });
      } else {
        const k = cfg.known.who;
        push(`Now with fractions. ${names[a0]} over ${names[k]} is ${word(ra)} over ${word(ratio[k])}.`,
          { on: ["eq", "k2"], off: ["b2", "mA", "sK", "k1"], add: ["eq.left"], cue: { "eq.left": "over" },
            transition: { kind: "card", title: "Method 2", sub: "Equivalent fractions", hold: 1.6 }, pause: 0.6 });
        push(`And it's the same as ${names[a0]} over ${money(cfg.known.value)}. We don't know ${names[a0]}, so... question mark on top.`, { add: ["eq.right"], cue: { "eq.right": "the same as" }, pause: 0.6 });
        push(`Look at the bottoms. ${word(ratio[k])} becomes ${fmt(cfg.known.value)}. ${word(ratio[k])} times what? ${fmt(UNIT)}.`, { add: ["eq.under"], cue: { "eq.under": "becomes" }, pause: 0.8 });
        push(`So the top is multiplied by ${fmt(UNIT)} too. ${word(ra)} times ${fmt(UNIT)}... ${fmt(shares[a0])}.`, { add: ["eq.over", "eq.ans"], cue: { "eq.over": "so the top", "eq.ans": `${fmt(shares[a0])}.` }, pause: 1 });
      }
      push(cfg.closing || "Two ways, one answer. A ratio counts equal boxes: find one box, and count the boxes you want.");
    },
  });
}

/* ═══ THE QUESTIONS ═══════════════════════════════════════════════════════ */

const SHARE600 = {
  question: "Taiwo, Kehinde and Idowu are to share $600 in the ratio 3:2:1 respectively.",
  story: ["Taiwo, Kehinde and Idowu are sharing 600 dollars.", "Not equally. In the ratio three to two to one.", "Taiwo gets the most, Idowu the least. But how much is each share?"],
  names: ["Taiwo", "Kehinde", "Idowu"], ratio: [3, 2, 1], total: 600, money: "$", thing: "the money",
};
/* Upper primary 2025 first round Q45 and 4th edition Q20 */
export const share600Idowu = () => ratioFilm({ ...SHARE600, question: SHARE600.question + " What is Idowu's share?", ask: 2 });
/* Upper primary 5th edition Q23 */
export const share600Kehinde = () => ratioFilm({ ...SHARE600, question: SHARE600.question + " What is Kehinde's share?", ask: 1 });

/* ANMC 12th main Q27 */
export const share4000 = () => ratioFilm({
  question: "A father divided ₦4,000 between his three children in the ratio 1:3:4. Find the largest share.",
  story: ["A father shared 4,000 naira between his three children.", "In the ratio one to three to four.", "We want the largest share."],
  names: ["First", "Second", "Third"], ratio: [1, 3, 4], total: 4000, money: "₦", thing: "the money", ask: 2,
});

/* Junior secondary 5th edition Q8 */
export const share45000 = () => ratioFilm({
  question: "If ₦45,000.00 is shared among 3 people in the ratio 5:4:3, what is the least share?",
  story: ["45,000 naira is shared among three people.", "In the ratio five to four to three.", "We want the least share."],
  names: ["A", "B", "C"], ratio: [5, 4, 3], total: 45000, money: "₦", thing: "the money", ask: 2,
});

/* Upper primary 2025 finals Q4 */
export const ratio45sum135 = () => ratioFilm({
  question: "Two numbers are in the ratio 4:5. If the sum of the numbers is 135, find the numbers.",
  story: ["Two numbers are in the ratio four to five.", "Together they add up to 135.", "What are the two numbers?"],
  names: ["First", "Second"], ratio: [4, 5], total: 135, money: "", thing: "the sum", ask: "all",
});

/* ANMC 12th main Q47 */
export const angles1234 = () => ratioFilm({
  question: "The interior angles of a quadrilateral are in the ratio 1:2:3:4. Find the greatest angle.",
  story: ["A quadrilateral has four angles, in the ratio one to two to three to four.", "First, the angles of any four-sided shape add up to 360 degrees.", "So we're sharing 360 degrees in the ratio one, two, three, four."],
  names: ["A", "B", "C", "D"], ratio: [1, 2, 3, 4], total: 360, money: "", thing: "all four angles", ask: 3,
  closing: "Two ways, one answer. The greatest angle is 144 degrees.",
});

/* Upper primary 2022 first round Q1 */
export const boys34 = () => ratioFilm({
  question: "The ratio of boys to girls at the dance was 3:4. There were 60 girls at the dance. How many boys were at the dance?",
  story: ["At a dance, the ratio of boys to girls was three to four.", "There were 60 girls.", "How many boys were there?"],
  names: ["Boys", "Girls"], ratio: [3, 4], known: { who: 1, value: 60 }, ask: 0, money: "",
});

/* Upper primary 2025 finals Q41 */
export const girls35 = () => ratioFilm({
  question: "The ratio of boys to girls in a school is 3:5. If there are 312 boys, how many girls are in the school?",
  story: ["In a school, the ratio of boys to girls is three to five.", "There are 312 boys.", "How many girls are there?"],
  names: ["Boys", "Girls"], ratio: [3, 5], known: { who: 0, value: 312 }, ask: 1, money: "",
});

/* ANMC 15th first round Q31 */
export const ratio35small45 = () => ratioFilm({
  question: "The ratio of two natural numbers is 3/5. If the smaller one is 45, find the greater one.",
  story: ["Two numbers are in the ratio three to five.", "The smaller one is 45.", "What's the greater one?"],
  names: ["Smaller", "Greater"], ratio: [3, 5], known: { who: 0, value: 45 }, ask: 1, money: "",
});
