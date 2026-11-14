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
import { mathLoad, mathifyPic } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W, K_ } from "./cbt-films.js";

const BLUE = "#2f6f8f", GREEN = "#2f7d4a";

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

/* ═══ 1. WHAT A RATIO IS ═══════════════════════════════════════════════════ */
export function ratioWhat() {
  const CAP = 104 / 12;
  const KIDS = ["Boys", "Girls"];
  const PRICE = ["Old", "New"];
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "A class has 12 boys and 8 girls. What is the ratio of boys to girls?" },
      { id: "a2", text: "A price of $80 is increased in the ratio 5:4. What is the new price?" },
    ],
    pics: {
      c1: () => bars(KIDS, [12, 8], { cap: CAP }),
      c2: () => bars(KIDS, [3, 2], { text: "4", unit: 4, cap: CAP }),
      p1: () => bars(PRICE, [4, 5], { below: { 0: [{ from: 0, to: 4, text: "$80" }] } }),
      p2: () => bars(PRICE, [4, 5], { text: "20", below: { 0: [{ from: 0, to: 4, text: "$80" }] } }),
      p3: () => bars(PRICE, [4, 3], { text: "20", below: { 0: [{ from: 0, to: 4, text: "$80" }] } }),
      m1: () => main([L("a", "12 : 8")]),
      m2: () => main([L("a", "12 : 8"), L("e", "="), L("b", "3 : 2", BLUE)]),
      m3: () => main([L("a", "30 : 20"), L("e", "="), L("b", "3 : 2", BLUE)]),
      s1: () => side([[L("a", "\\text{actual: } 12,\\ 8")], [L("b", "\\text{ratio: } 3 : 2", BLUE)]]),
      m4: () => main([L("a", "80 \\div 4"), L("e", "="), L("b", "20", BLUE)]),
      m5: () => main([L("a", "5 \\times 20"), L("e", "="), L("b", "\\$100", GREEN)]),
      m6: () => main([L("a", "3 \\times 20"), L("e", "="), L("b", "\\$60", GREEN)]),
      m7: () => main([L("a", "3 : 2"), L("e1", "="), L("b", "6 : 4"), L("e2", "="), L("c", "9 : 6"), L("e3", "="), L("d", "12 : 8", BLUE)], 7),
    },
    picAt: {
      c1: barAt(12, 1, CAP), c2: barAt(12, 1, CAP), p1: barAt(5), p2: barAt(5), p3: barAt(4),
      m1: at(37.5), m2: at(37.5), m3: at(37.5), m4: at(37.5), m5: at(37.5), m6: at(37.5), m7: at(37.5), s1: { x: 79.5, y: 16 },
    },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "What a ratio is", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Ratio or actual value?", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Increase and decrease", y: 50.5 },
      { id: "k4", receipt: true, sub: "Idea 4", text: "Scaling", y: 50.5 },
    ],
    stages: {
      "c1.r0": rowStage(0), "c1.r1": rowStage(1),
      "c2.all": (s, H) => { showBars(s, H); fill(s, H); },
      "p1.r0": rowStage(0), "p1.r1": rowStage(1),
      "p1.old": (s, H) => H.draw(braceOf(s, "below-0-0"), 0),
      "p2.base": (s, H) => { showBars(s, H); H.show(braceOf(s, "below-0-0")); },
      "p2.fill": fill,
      "p2.new": (s, H) => mb(s, "bar", 1).forEach((b) => H.lit(b, 0.2, 2.4)),
      "p3.all": (s, H) => { mb(s, "name").forEach((n) => H.show(n)); mb(s, "bar", 0).forEach((b) => H.show(b)); H.show(braceOf(s, "below-0-0"));
        mb(s, "bar", 1).forEach((b, j) => H.grow(b, 0.2 + j * 0.25)); fill(s, H); },
      "m1.all": (s, H) => write(s, H, ["a"], 0),
      "m2.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "m3.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "s1.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["b"], 1.2); },
      "m4.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "m5.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); H.sound("ding", 1.5); },
      "m6.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); H.sound("ding", 1.5); },
      "m7.all": (s, H) => write(s, H, ["a", "e1", "b", "e2", "c", "e3", "d"], 0, 0.55),
    },
    steps: ({ push }) => {
      push("Here's a class with twelve boys and eight girls, and the question wants the ratio of boys to girls. Before we answer it, let's be clear about what a ratio actually is, because the whole topic rests on it.",
        { on: ["a1"], transition: "iris", pause: 0.6 });

      /* ── IDEA 1 ── */
      push("Let me draw them. One box for every boy... twelve boxes. One box for every girl... eight boxes. Look at the two rows side by side, because a ratio is simply a way of COMPARING two amounts.",
        { on: ["c1", "k1"], add: ["c1.r0", "c1.r1"], cue: { "c1.r0": "every boy", "c1.r1": "every girl" }, transition: card("Idea 1", "What a ratio is"), pause: 0.6 });
      push("Written as a ratio, boys to girls is twelve to eight, with two dots between them that we read as 'to'. Boys go first because the question said boys first. The order is part of the answer, so never swap it.",
        { on: ["m1"], add: ["m1.all"], cue: { "m1.all": "twelve to eight" }, pause: 0.6 });
      push("Now watch what happens when I put the children into groups of four. The boys make three groups, and the girls make two. So for every three boys there are two girls. Twelve to eight says exactly the same thing as three to two.",
        { on: ["c2", "m2"], off: ["c1", "m1"], add: ["c2.all", "m2.all"], cue: { "m2.all": "for every three" }, pause: 0.8 });

      /* ── IDEA 2 ── */
      push("Here's the bit everybody gets wrong. The ratio three to two does NOT mean there are three boys. There are twelve. Three and two are the ratio; twelve and eight are the actual values. A ratio only tells you how the groups compare.",
        { on: ["s1", "k2"], off: ["k1"], add: ["s1.all"], cue: { "s1.all": "actual values" }, transition: card("Idea 2", "Ratio or actual value?"), pause: 0.8 });
      push("Think of another class with thirty boys and twenty girls. Different children, bigger numbers... and the same ratio, because thirty to twenty is three to two as well. Lots of different classes can share one ratio. That's why a ratio alone can't tell you how many.",
        { on: ["m3"], off: ["m2"], add: ["m3.all"], cue: { "m3.all": "thirty to twenty" }, pause: 0.8 });

      /* ── IDEA 3 ── */
      push("Now a price of eighty dollars is increased in the ratio five to four. That means new price to old price is five to four. So the old price is four boxes, and the new price is five boxes of exactly the same size.",
        { on: ["a2", "p1", "k3"], off: ["a1", "c2", "s1", "m3", "k2"], add: ["p1.r0", "p1.r1"], cue: { "p1.r0": "four boxes", "p1.r1": "five boxes" },
          transition: card("Idea 3", "Increase and decrease"), pause: 0.6 });
      push("The old price, all four boxes, is eighty dollars. So one box is eighty shared into four... twenty dollars. Write twenty in every box, because every box is the same size.",
        { on: ["p2", "m4"], off: ["p1"], add: ["p1.old", "p2.base", "m4.all", "p2.fill"], cue: { "m4.all": "shared into", "p2.fill": "write twenty" }, pause: 0.8 });
      push("The new price is five boxes. Five times twenty... one hundred dollars. The bigger number came first in the ratio, five to four, so the price went UP.",
        { on: ["m5"], off: ["m4"], add: ["p2.new", "m5.all"], cue: { "m5.all": "five times" }, pause: 0.8 });
      push("Decrease it in the ratio three to four instead, and the new price is only three of those boxes. Three times twenty... sixty dollars. When the first number is the smaller one, the amount goes DOWN.",
        { on: ["p3", "m6"], off: ["p2", "m5"], add: ["p3.all", "m6.all"], cue: { "m6.all": "three times twenty" }, pause: 1 });

      /* ── IDEA 4 ── */
      push("Last idea: scaling. Multiply both numbers of a ratio by the same number and the ratio doesn't change. Three to two... six to four... nine to six... twelve to eight. Every one of them describes the very same class.",
        { on: ["a1", "m7", "k4"], off: ["a2", "p3", "m6", "k3"], add: ["m7.all"], cue: { "m7.all": "three to two" }, transition: card("Idea 4", "Scaling"), pause: 0.8 });
      push("Dividing works the same way. Twelve to eight, divide both by four, and you're back to three to two — which is what we did with the groups. The rule is: whatever you do to one side, do to the other.", { pause: 1 });
      push("So, a ratio compares two amounts. Its numbers are not the actual values. It can be scaled up or down without changing, and a ratio like five to four can grow an amount, or shrink it.");
    },
  });
}

/* ═══ 2. THE PARTS OF A RATIO ══════════════════════════════════════════════ */
export function ratioParts() {
  const N = ["Ade", "Bola"];
  const R = [3, 5];
  const AT = barAt(5);
  const ATT = barAt(5, 1, null, true);
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "Ade and Bola share some sweets in the ratio 3:5. Bola gets 18 more sweets than Ade. How many sweets are there altogether?" },
      { id: "a2", text: "Ade and Bola share 64 sweets in the ratio 3:5." },
      { id: "a3", text: "In the ratio 3:5, Ade gets 21 sweets." },
    ],
    pics: {
      q0: () => bars(N, R),
      qW: () => bars(N, R, { total: "8 boxes" }),
      qD: () => bars(N, R, { below: { 1: [{ from: 3, to: 5, text: "2 boxes" }] } }),
      qS: () => bars(N, R, { text: "8", total: "64" }),
      qP: () => bars(N, R, { text: "7", below: { 0: [{ from: 0, to: 3, text: "21" }] } }),
      qA: () => bars(N, R, { text: "9", below: { 1: [{ from: 3, to: 5, text: "18" }] } }),
      mPP: () => main([L("a", "\\text{Ade} : \\text{Bola}"), L("e", "="), L("b", "3 : 5", BLUE)]),
      mPW: () => main([L("a", "\\text{Ade}"), L("e", "="), L("b", "\\dfrac{3}{8}\\ \\text{of the whole}", BLUE)]),
      mPD: () => main([L("a", "5 - 3"), L("e", "="), L("b", "2\\ \\text{boxes more}", BLUE)]),
      mS: () => main([L("a", "64 \\div 8"), L("e", "="), L("b", "8\\ \\text{a box}", BLUE)]),
      mP: () => main([L("a", "21 \\div 3"), L("e", "="), L("b", "7\\ \\text{a box}", BLUE)]),
      mD: () => main([L("a", "18 \\div 2"), L("e", "="), L("b", "9\\ \\text{a box}", BLUE)]),
      mA: () => main([L("a", "8 \\times 9"), L("e", "="), L("b", "72\\ \\text{sweets}", GREEN)]),
      sK: () => side([[L("a", "\\text{Ade } 27,\\ \\text{Bola } 45")], [L("b", "45 - 27 = 18\\ \\checkmark", GREEN)]], 4.2),
    },
    picAt: { q0: AT, qW: ATT, qD: AT, qS: ATT, qP: AT, qA: AT,
      mPP: at(37.5), mPW: at(37.5), mPD: at(37.5), mS: at(37.5), mP: at(37.5), mD: at(37.5), mA: at(37.5), sK: { x: 79.5, y: 16 } },
    lines: [
      { id: "k1", receipt: true, sub: "Part to part", text: "one share to the other", y: 50.5 },
      { id: "k2", receipt: true, sub: "Part to whole", text: "one share to all of it", y: 50.5 },
      { id: "k3", receipt: true, sub: "Part to difference", text: "the gap between them", y: 50.5 },
      { id: "k4", receipt: true, sub: "Spot it", text: "sum, difference or one part?", y: 50.5 },
    ],
    stages: {
      "q0.r0": rowStage(0), "q0.r1": rowStage(1),
      "qW.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "total"), 0.2); },
      "qD.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "below-1-0"), 0.2); mb(s, "bar", 1).slice(3).forEach((b) => H.lit(b, 0.3, 2.4)); },
      "qS.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "total"), 0.2); },
      "qP.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "below-0-0"), 0.2); },
      "qA.all": (s, H) => { showBars(s, H); H.draw(braceOf(s, "below-1-0"), 0.2); },
      "qS.fill": fill, "qP.fill": fill, "qA.fill": fill,
      ...Object.fromEntries(["mPP", "mPW", "mPD", "mS", "mP", "mD"].map((m) => [`${m}.all`, (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); }])),
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

      /* spotting it */
      push("Here's the skill that matters: reading which of these a problem gives you. Words like share, altogether, in all or total give you the WHOLE. 'They share sixty-four sweets' means all eight boxes are sixty-four.",
        { on: ["a2", "qS", "k4"], off: ["a1", "qD", "mPD", "k3"], add: ["qS.all"], cue: { "qS.all": "they share" },
          transition: card("Spot it", "sum, difference or one part?"), pause: 0.6 });
      push("So one box is sixty-four shared into eight... eight sweets. Write eight in every box.",
        { on: ["mS"], add: ["mS.all", "qS.fill"], cue: { "mS.all": "shared into", "qS.fill": "write eight" }, pause: 0.8 });
      push("If a problem names ONE person's share — 'Ade gets twenty-one' — that's a part. Twenty-one is Ade's three boxes, so one box is twenty-one shared into three... seven.",
        { on: ["a3", "qP", "mP"], off: ["a2", "qS", "mS"], add: ["qP.all", "mP.all", "qP.fill"], cue: { "mP.all": "shared into three", "qP.fill": "seven." }, pause: 0.8 });
      push("And words like more than, less than, or difference point at the GAP. Back to our question: Bola gets eighteen MORE than Ade. That eighteen is the two extra boxes, not anybody's share.",
        { on: ["a1", "qA"], off: ["a3", "qP", "mP"], add: ["qA.all"], cue: { "qA.all": "eighteen more" }, pause: 0.6 });
      push("So one box is eighteen shared into two... nine sweets. Nine in every box.",
        { on: ["mD"], add: ["mD.all", "qA.fill"], cue: { "mD.all": "shared into two", "qA.fill": "nine sweets" }, pause: 0.8 });
      push("The question wants ALL the sweets: that's all eight boxes. Eight times nine... seventy-two sweets.",
        { on: ["mA"], off: ["mD"], add: ["mA.all"], cue: { "mA.all": "eight times" }, pause: 0.8 });
      push("Check it. Ade has three nines, twenty-seven; Bola has five nines, forty-five. Forty-five take away twenty-seven is eighteen. It works.",
        { on: ["sK"], add: ["sK.all"], cue: { "sK.all": "check it" }, pause: 1 });
      push("So before you calculate anything, ask what the number in the problem IS: the whole, one part, or the difference. Match it to the right boxes, find one box, and the rest follows.");
    },
  });
}

/* ═══ 3. COMPOUND RATIO ════════════════════════════════════════════════════ */
export function ratioCompound() {
  const AB = barAt(3), BC = barAt(5), ABC = barAt(15);
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "The ratio of Ade's money to Bola's is 2:3, and Bola's money to Chidi's is 4:5. Find the ratio of Ade's money to Chidi's." },
      { id: "a2", text: "Together, Ade, Bola and Chidi have $175. How much does each of them have?" },
    ],
    pics: {
      r1: () => bars(["Ade", "Bola"], [2, 3]),
      r2: () => bars(["Bola", "Chidi"], [4, 5]),
      r3: () => bars(["Ade", "Bola", "Chidi"], [8, 12, 15]),
      r4: () => bars(["Ade", "Bola", "Chidi"], [8, 12, 15], { text: "5", total: "$175" }),
      m1: () => main([L("a", "A : B = 2 : 3"), L("e", ",\\quad"), L("b", "B : C = 4 : 5")], 7),
      mL: () => main([L("a", "\\text{LCM}(3, 4)"), L("e", "="), L("b", "12", BLUE)]),
      m2: () => main([L("a", "2 : 3 = 8 : 12"), L("e", ",\\quad"), L("b", "4 : 5 = 12 : 15")], 7),
      m3: () => main([L("a", "A : B : C"), L("e", "="), L("b", "8 : 12 : 15", BLUE)]),
      m4: () => main([L("a", "A : C"), L("e", "="), L("b", "8 : 15", GREEN)]),
      m5: () => main([L("a", "\\dfrac{2}{3} \\times \\dfrac{4}{5}"), L("e", "="), L("b", "\\dfrac{8}{15}", GREEN)]),
      m6: () => main([L("a", "8 + 12 + 15 = 35"), L("e", ",\\quad"), L("b", "175 \\div 35 = 5", BLUE)], 7),
      m7: () => main([L("a", "8 \\times 5,\\ 12 \\times 5,\\ 15 \\times 5"), L("e", "\\to"), L("b", "\\$40,\\ \\$60,\\ \\$75", GREEN)], 6.2),
      sK: () => side([[L("a", "40 : 60 = 2 : 3\\ \\checkmark", GREEN)], [L("b", "60 : 75 = 4 : 5\\ \\checkmark", GREEN)]], 4.4),
    },
    picAt: { r1: AB, r2: BC, r3: ABC, r4: barAt(15, 1, null, true),
      m1: at(37.5), mL: at(37.5), m2: at(37.5), m3: at(37.5), m4: at(37.5), m5: at(37.5), m6: at(37.5), m7: at(37.5), sK: { x: 79.5, y: 16 } },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "Make the shared one match", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Multiply the ratios", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Share in the joined ratio", y: 50.5 },
    ],
    stages: {
      "r1.r0": rowStage(0), "r1.r1": rowStage(1),
      "r2.r0": rowStage(0), "r2.r1": rowStage(1),
      "r3.r0": rowStage(0), "r3.r1": rowStage(1), "r3.r2": rowStage(2),
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
      push("Scale the first ratio by four: two to three becomes eight to twelve. Scale the second by three: four to five becomes twelve to fifteen. Remember, scaling both sides never changes a ratio.",
        { on: ["m2"], off: ["mL"], add: ["m2.a", "m2.b"], cue: { "m2.a": "by four", "m2.b": "by three" }, pause: 0.8 });
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
