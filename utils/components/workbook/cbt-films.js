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
      /* Spoken the way the user wrote it out (2026-11-12): short breaths, "so", "um", "hmm", "eh",
         a check-in every few lines. See .claude/skills/prepbot-lesson-voice, section 2b. */
      const say = (...lines) => lines.join(" ");

      /* ── METHOD ONE: THE BOX METHOD ── */
      push(say(
        "So um, someone bought a computer set.",
        "Later, they sold that same computer set for fifty seven thousand naira.",
        "But hmm, they did not make money o. They actually sold it at a loss.",
        "They lost twenty five percent. Twenty five percent of what they BOUGHT it for, you get?",
        "So what they bought it for is the big number we don't know yet. That is the one we are hunting, right?",
        "So picture it like this, eh. One whole bar. That bar is what they bought it for.",
        "We don't know it yet, so let's just put a question mark inside it. Just like that.",
      ), { on: ["a1", "b0", "m1"], add: ["b0.draw"] });

      push(say(
        "Now, twenty five percent. Hmm, twenty five out of a hundred. What is that, in a simpler way?",
        "It is a quarter. One out of four.",
        "So I'm going to cut our bar into four equal boxes. Watch. One cut, two cuts, three cuts.",
        "Four boxes now, all the same size, and each box is twenty five percent.",
        "And see, the bar is still the same bar o. Cutting it did not make it bigger or smaller.",
      ), { on: ["b1", "l1"], off: ["b0"], add: ["b1.cut"] });

      push(say(
        "Okay so, they lost twenty five percent. That's ONE box.",
        "Let me colour that last box differently and write lost on it. That box is gone, they never got it back.",
        "Now wait, eh, this is where people fall.",
        "Some people will quickly take twenty five percent of fifty seven thousand. Don't do that o.",
        "The loss is a quarter of what they BOUGHT it for, the big bar we don't know. Not a quarter of fifty seven thousand.",
      ), { on: ["b2", "l2"], off: ["b1"], add: ["b2.lose"],
        look: look.mark("b2", "bar", BOXES - 1), lookAt: { lit: true, delay: 1.6, hold: 2.2 } });

      push(say(
        "So, what did they actually collect when they sold it?",
        "The other three boxes. Just the three.",
        "And that is the fifty seven thousand. So fifty seven thousand is not the full bar o, it's what is left after the loss.",
        "Three boxes, fifty seven thousand. You follow me so far?",
      ), { on: ["l3"], add: ["b2.sold"],
        look: look.brace("b2", "above-0-0"), lookAt: { lit: true, delay: 1.2, hold: 2.0 } });

      push(say(
        "Now, if three boxes make fifty seven thousand, how much is ONE box?",
        "Hmm, we share fifty seven thousand into three.",
        "Fifty seven thousand divided by three. That's nineteen thousand.",
        "So one box is nineteen thousand. Let me write it in every box, the lost one too,",
        "because remember, all the boxes are the same size, eh.",
      ), { on: ["b3", "l4"], off: ["b2"], add: ["b3.each"],
        look: look.tile("l4"), lookAt: { delay: 2.8, hold: 2.0 } });

      push(say(
        "And what they bought it for is the whole bar. All four boxes.",
        "Four times nineteen thousand. Seventy six thousand.",
        "So they bought it for seventy six thousand naira.",
        "Let's check it sha. They lost one box, nineteen thousand. Seventy six thousand minus nineteen thousand is",
        "fifty seven thousand. That's exactly the price in the question. It works.",
        "So the answer is E, seventy six thousand.",
      ), { on: ["l5", "l6"], add: ["b3.cost"] });

      /* ── METHOD TWO: EQUIVALENT FRACTIONS ── */
      push(say(
        "Okay, now let me show you another way. No boxes this time, just fractions.",
        "So, they lost twenty five percent. What part did they still get?",
        "A hundred percent minus twenty five percent. Seventy five percent.",
        "So they sold it for seventy five percent of what they bought it for, right?",
      ), { on: ["m2", "k1"], off: ["b3", "m1", "l1", "l2", "l3", "l4", "l5", "l6"] });

      push(say(
        "Seventy five percent is seventy five over a hundred. Hmm, we can make that smaller.",
        "Divide the top and the bottom by twenty five, and you get three over four. Three quarters.",
        "And look, eh, it's the same thing as before. Three boxes out of four.",
      ), { on: ["k2", "eq"], add: ["eq.left"] });

      push(say(
        "Now, the selling price over what they bought it for. That's also three quarters.",
        "So on the other side, I put fifty seven thousand on top, because that is what they sold it for.",
        "And underneath, what they bought it for. We don't know it, so, question mark.",
        "Top goes with top, bottom goes with bottom. You get?",
      ), { add: ["eq.right"] });

      push(say(
        "Now, these two fractions are EQUAL. Equivalent fractions.",
        "And to make equivalent fractions, you multiply the top and the bottom by the same number.",
        "So look at the tops. Three becomes fifty seven thousand. Three times what?",
        "Hmm, fifty seven thousand divided by three. Nineteen thousand.",
        "So the top was multiplied by nineteen thousand. Same as one box, you see?",
      ), { on: ["k3"], add: ["eq.over"],
        look: look.tile("k3"), lookAt: { delay: 2.6, hold: 2.0 } });

      push(say(
        "And whatever you do to the top, you must do to the bottom o. Otherwise they won't be equal again.",
        "So four times nineteen thousand. Seventy six thousand.",
        "There's our question mark. Seventy six thousand naira. Same answer as the boxes.",
      ), { on: ["k4", "k5"], add: ["eq.under", "eq.ans"] });

      push(say(
        "So you see, two ways, one answer.",
        "The boxes help you SEE it. Three boxes out of four is fifty seven thousand.",
        "The fractions say the same thing with numbers.",
        "Just remember this one thing, eh. A loss, or a profit, is always a part of what they BOUGHT it for.",
        "That's the whole bar. The four boxes. The bottom of the fraction. Don't forget it o.",
      ), { play: (S, H, stage) => runLit(H, stage, ["k1", "k2", "k3", "k4"]) });
    },
  });
}
