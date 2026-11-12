/* ============================================================================
   FILMS FOR ONE CBT QUESTION
   ----------------------------------------------------------------------------
   A question on a CBT paper can name a film (`film: "loss-25"` in its bank),
   and the feedback strip under it then carries PrepBot's play key
   (exam-archive/national/question/js/quiz-engine.js). These films work THAT
   question, with its own numbers, the way a teacher would at the board.

     loss-25   "A computer set was sold for 57,000 at a loss of 25% on the cost
               price. Find the cost price." (Scholastic, upper primary, 2022
               first round, Q6) — two ways: the box method, then equivalent
               fractions.

   Built with the bar films' kit (./film-kit.js) and drawn by the workbook's
   own modelSvg, so a box here is the box the Maths Workbook prints.
   ========================================================================== */

import { modelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";
import { PAPER_MM, braceOf, film, mb, part, runLit } from "./film-kit.js";
import { fracHtml } from "./stackfrac.js";

const INK = "#2a2723";

/* ═══ 25% LOSS: FIND THE COST PRICE ═══════════════════════════════════════*/
export function loss25() {
  const SOLD = 57000, PCT = 25;
  const BOXES = 100 / PCT;                    // 4
  const KEPT = BOXES - 1;                     // 3
  const ONE = SOLD / KEPT;                    // 19,000
  const COST = ONE * BOXES;                   // 76,000
  const f = (n) => n.toLocaleString("en-US");
  /* four boxes across the screen, like every other bar model */
  const PART_MM = (PAPER_MM - 10) / BOXES;
  const boxes = (text, lossTone = "a") => Array.from({ length: BOXES }, (_, i) => part(text, 1, i === BOXES - 1 ? lossTone : "a"));
  /* A FIGURE WITH A COMMA IN IT is written as markup: stackText reads "57,000/76,000" as "000/76" */
  const frac = (n, d) => fracHtml(n, d);

  /* the equivalent-fraction board, drawn as marks the hand can write one at a time */
  const T = (key, x, y, text, size = 9, fill = INK, kind = "num") =>
    `<text data-mb="${kind}" data-k="${key}" x="${x}" y="${y}" text-anchor="middle" font-family="JetBrains Mono, monospace" `
    + `font-size="${size}" font-weight="800" fill="${fill}">${text}</text>`;
  const ARC = (key, d, lx, ly, label, ink) =>
    `<g data-mb="brace" data-mb-key="${key}"><path d="${d}" fill="none" stroke="${ink}" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<text x="${lx}" y="${ly}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="5" font-weight="800" fill="${ink}">${label}</text></g>`;
  /* drawn at 1.3 times its own measures, so the fractions are the size of the bars in method one */
  const eqSvg = () => `<svg viewBox="0 0 150 84" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1.3)">`
    + `<rect data-mb="bar" data-mb-row="0" x="12" y="29" width="16" height="0.9" fill="${INK}"/>`
    + `<rect data-mb="bar" data-mb-row="1" x="50" y="29" width="40" height="0.9" fill="${INK}"/>`
    + T("top", 20, 25, String(KEPT))
    + T("bot", 20, 40.5, String(BOXES))
    + T("eq", 39, 33, "=")
    + T("sold", 70, 25, f(SOLD))
    + T("cost", 70, 40.5, "?")
    + T("ws", 103, 24, "sold", 4.2, "#6b645b", "name")
    + T("wc", 103, 39.5, "cost", 4.2, "#6b645b", "name")
    + ARC("over", "M21 15 Q45 1 68 14 M68 14 l-4.2 -0.6 M68 14 l-1.6 -3.8", 45, 5.4, `× ${f(ONE)}`, "#c0453f")
    + ARC("under", "M21 45 Q45 59 68 46 M68 46 l-4.2 0.6 M68 46 l-1.6 3.8", 45, 60, `× ${f(ONE)}`, "#c0453f")
    + `</g></svg>`;
  const markOf = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);

  return film({
    asks: [
      { id: "a1", text: `A computer set was sold for ₦${f(SOLD)} at a loss of ${PCT}% on the cost price. Find the cost price.` },
    ],
    pics: {
      /* the cost price: one whole bar, and we do not know it */
      b0: () => modelSvg([{ parts: [part("?", BOXES, "q")], below: [{ from: 0, to: 1, text: "cost price" }] }],
        { cap: PART_MM, label: "The cost price" }),
      /* 25% is a quarter, so the bar is cut into four equal boxes */
      b1: () => modelSvg([{ parts: boxes(`${PCT}%`), below: [{ from: 0, to: BOXES, text: "cost price = ?" }] }],
        { cap: PART_MM, label: "Four quarters" }),
      /* the box that was lost, and the three he was paid for */
      b2: () => modelSvg([{ parts: boxes(`${PCT}%`, "d"),
        above: [{ from: 0, to: KEPT, text: `sold for ${f(SOLD)}` }, { from: KEPT, to: BOXES, text: "lost" }],
        below: [{ from: 0, to: BOXES, text: "cost price = ?" }] }],
      { cap: PART_MM, label: "Three boxes sold" }),
      /* one box found, written in every box, and the whole read off */
      b3: () => modelSvg([{ parts: boxes(f(ONE), "d"),
        above: [{ from: 0, to: KEPT, text: `sold for ${f(SOLD)}` }, { from: KEPT, to: BOXES, text: "lost" }],
        below: [{ from: 0, to: BOXES, text: "?" }] }],
      { cap: PART_MM, label: "One box each" }),
      /* method two */
      eq: () => eqSvg(),
    },
    /* artAt reads the first rule's corner unscaled (x 12, y 29): these put the board's own corner at (5, 20) */
    picAt: { eq: { x: 5 + 12 * (47 / 150), y: 20 + 29 * (47 / 150) } },
    lines: [
      /* method one, down the right */
      { id: "m1", text: "1 · THE BOX METHOD", y: 12, c: 1, size: 2.2 },
      { id: "l1", text: `${PCT}% = a quarter: 4 boxes`, y: 18, c: 0, size: 2.2 },
      { id: "l2", text: "lost 1 box, sold 3", y: 24, c: 3, size: 2.2 },
      { id: "l3", text: `3 boxes = ${f(SOLD)}`, y: 30, c: 0, size: 2.2 },
      { id: "l4", text: `1 box = ${f(SOLD)} ÷ 3 = ${f(ONE)}`, y: 36, c: 4, size: 2.2 },
      { id: "l5", text: `4 boxes = ${f(COST)}`, y: 42, c: 2, size: 2.4 },
      { id: "l6", text: `check: ${f(COST)} − ${f(ONE)} = ${f(SOLD)}`, y: 48, c: 0, size: 2.0 },
      /* method two */
      { id: "m2", text: "2 · EQUIVALENT FRACTIONS", y: 12, c: 1, size: 2.2 },
      { id: "k1", text: `100% − ${PCT}% = 75%`, y: 18, c: 0, size: 2.2 },
      { id: "k2", text: `sold for ${frac(75, 100)} = ${frac(KEPT, BOXES)} of the cost`, y: 25.5, c: 3, size: 2.2, html: true },
      { id: "k3", text: `${f(SOLD)} ÷ 3 = ${f(ONE)}`, y: 34, c: 4, size: 2.2 },
      { id: "k4", text: `4 × ${f(ONE)} = ${f(COST)}`, y: 40, c: 2, size: 2.4 },
      { id: "k5", text: `${frac(KEPT, BOXES)} = ${frac(f(SOLD), f(COST))}`, y: 47.5, c: 2, size: 2.2, html: true },
    ],
    stages: {
      "b0.draw": (s, H) => {
        H.grow(mb(s, "bar")[0]);
        H.write(mb(s, "num")[0], 0.8);
        H.draw(braceOf(s, "below-0-0"), 1.3);
      },
      "b1.cut": (s, H) => {
        mb(s, "bar").forEach((n, i) => (i ? H.grow(n, 0.2 + i * 0.35) : H.show(n)));
        mb(s, "num").forEach((n, i) => H.write(n, 1.5 + i * 0.3));
        H.draw(braceOf(s, "below-0-0"), 2.8);
      },
      "b2.lose": (s, H) => {
        const bars = mb(s, "bar");
        bars.forEach((n, i) => (i === BOXES - 1 ? H.tint(n, bars[0].getAttribute("fill"), 0.3) : H.show(n)));
        mb(s, "num").forEach((n) => H.show(n));
        H.draw(braceOf(s, "below-0-0"));
        H.draw(braceOf(s, "above-0-1"), 0.9);
      },
      "b2.sold": (s, H) => H.draw(braceOf(s, "above-0-0"), 0.3),
      "b3.each": (s, H) => {
        mb(s, "bar").forEach((n) => H.show(n));
        H.draw(braceOf(s, "above-0-0"));
        H.draw(braceOf(s, "above-0-1"));
        const t = braceOf(s, "below-0-0")?.querySelector("text");
        if (t) t.textContent = "?";             // stepping back un-answers it
        H.draw(braceOf(s, "below-0-0"));
        mb(s, "num").forEach((n, i) => H.write(n, 0.3 + i * 0.45));
      },
      "b3.cost": (s, H) => {
        const g = braceOf(s, "below-0-0");
        const t = g?.querySelector("text");
        if (t) H.flip(t, `cost price = ${f(COST)}`, 0.3);
      },
      "eq.left": (s, H) => {
        const [r0] = mb(s, "bar", 0);
        H.write(markOf(s, "top"), 0.1);
        H.grow(r0, 0.4);
        H.write(markOf(s, "bot"), 0.9);
      },
      "eq.right": (s, H) => {
        const [r1] = mb(s, "bar", 1);
        H.write(markOf(s, "eq"), 0.1);
        H.write(markOf(s, "sold"), 0.5);
        H.write(markOf(s, "ws"), 0.8);
        H.grow(r1, 1.1);
        const q = markOf(s, "cost");
        if (q) q.textContent = "?";            // stepping back puts the question mark back
        H.write(q, 1.7);
        H.write(markOf(s, "wc"), 2.0);
      },
      "eq.over": (s, H) => H.draw(braceOf(s, "over"), 0.3),
      "eq.under": (s, H) => H.draw(braceOf(s, "under"), 0.3),
      "eq.ans": (s, H) => H.flip(markOf(s, "cost"), f(COST), 0.4),
    },
    steps: ({ push, look }) => {
      /* ── METHOD ONE: THE BOX METHOD ── */
      push(`Read the question with me first, slowly, because every word in it is doing a job. A computer set was `
        + `SOLD for fifty-seven thousand, and the seller made a loss of twenty-five per cent on the cost price. `
        + `The cost price is what he paid for it in the first place, and that is the number we are hunting. `
        + `So I draw the cost price as one whole bar, and I put a question mark in it, because we do not know it yet.`,
        { on: ["a1", "b0", "m1"], add: ["b0.draw"] });

      push(`Now, twenty-five per cent. Say it the friendly way: twenty-five out of a hundred is a QUARTER. `
        + `So I cut the cost price into four equal boxes, and each box is twenty-five per cent of it. `
        + `Watch the cuts: one, two, three. Four boxes, all the same size, and together they are still the whole `
        + `cost price. Cutting a bar never changes how much there is.`,
        { on: ["b1", "l1"], off: ["b0"], add: ["b1.cut"] });

      push(`A loss of twenty-five per cent means he lost ONE of those boxes. He did not get it back when he sold. `
        + `So I colour the last box differently and label it: lost. And here is the trap. Lots of people take `
        + `twenty-five per cent of fifty-seven thousand. Do not. The loss is a quarter of the COST price, the bar `
        + `we do not know, not a quarter of the selling price.`,
        { on: ["b2", "l2"], off: ["b1"], add: ["b2.lose"],
          look: look.mark("b2", "bar", BOXES - 1), lookAt: { lit: true, delay: 1.2, hold: 2.2 } });

      push(`So what did he actually get paid? The other three boxes. Three boxes is the fifty-seven thousand. `
        + `That one sentence is the whole question, and the picture gave it to us: three equal boxes make `
        + `fifty-seven thousand.`,
        { on: ["l3"], add: ["b2.sold"],
          look: look.brace("b2", "above-0-0"), lookAt: { lit: true, delay: 0.9, hold: 2.0 } });

      push(`If three boxes are fifty-seven thousand, how much is ONE box? Share it into three. Fifty-seven `
        + `thousand divided by three is nineteen thousand. Find one box first, always. Then I write nineteen `
        + `thousand in every box, the lost one too, because all four boxes are the same size.`,
        { on: ["b3", "l4"], off: ["b2"], add: ["b3.each"],
          look: look.tile("l4"), lookAt: { delay: 2.4, hold: 2.0 } });

      push(`And the cost price is all four boxes. Four nineteen thousands: seventy-six thousand. So the computer `
        + `cost seventy-six thousand. Check it, every time. He lost one box, nineteen thousand. Seventy-six `
        + `thousand take away nineteen thousand is fifty-seven thousand, the price in the question. It comes back, `
        + `so the answer is option E.`,
        { on: ["l5", "l6"], add: ["b3.cost"] });

      /* ── METHOD TWO: EQUIVALENT FRACTIONS ── */
      push(`Now the same question a second way, with no boxes at all, so you can choose the one you like. `
        + `If he lost twenty-five per cent, what part of the cost price did he still get? A hundred per cent take `
        + `away twenty-five per cent: seventy-five per cent.`,
        { on: ["m2", "k1"], off: ["b3", "m1", "l1", "l2", "l3", "l4", "l5", "l6"] });

      push(`Seventy-five per cent is seventy-five out of a hundred, and that fraction makes smaller. Divide the top `
        + `and the bottom by twenty-five, and you get three quarters. Three quarters of the cost price. Notice it `
        + `is the very same three boxes out of four we drew a minute ago, written as a fraction.`,
        { on: ["k2", "eq"], add: ["eq.left"] });

      push(`So write the sentence as two fractions that are EQUAL. Sold over cost. On the left, three over four. `
        + `On the right, the real money: fifty-seven thousand on top, because that is what he sold it for, and a `
        + `question mark underneath, because the cost is what we want. Top goes with top, bottom goes with bottom.`,
        { add: ["eq.right"] });

      push(`Equivalent fractions are made by multiplying the top and the bottom by the SAME number. So look at the `
        + `tops. What turns three into fifty-seven thousand? Fifty-seven thousand divided by three is nineteen `
        + `thousand. So the top was multiplied by nineteen thousand. Same number as one box, you see.`,
        { on: ["k3"], add: ["eq.over"],
          look: look.tile("k3"), lookAt: { delay: 2.2, hold: 2.0 } });

      push(`And whatever you do to the top, you must do to the bottom, or the fractions stop being equal. `
        + `Four times nineteen thousand is seventy-six thousand. So the question mark is seventy-six thousand, `
        + `and the cost price is seventy-six thousand, the same answer as the boxes gave us.`,
        { on: ["k4", "k5"], add: ["eq.under", "eq.ans"] });

      push(`Two ways, one answer. The boxes let you SEE that three quarters of the cost is fifty-seven thousand. `
        + `The fractions say the same thing in numbers. And whichever you use, remember the trap: a loss or a profit `
        + `is a part of the COST price, so the cost price is the whole, the four boxes, the bottom of the fraction.`,
        { play: (S, H, stage) => runLit(H, stage, ["k1", "k2", "k3", "k4"]) });
    },
  });
}
