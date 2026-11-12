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
      /* the same colour and brace as the cut bar, so the bar that is cut IS this bar */
      b0: () => modelSvg([{ parts: [part("?", BOXES, "a")], below: [{ from: 0, to: 1, text: "cost price = ?" }] }],
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
    /* ONE STAGE PER THING THE HAND DOES, so each can be drawn while the line about it is said */
    stages: {
      "b0.bar": (s, H) => H.grow(mb(s, "bar")[0], 1.7),
      "b0.q": (s, H) => H.write(mb(s, "num")[0], 3.0),
      "b0.brace": (s, H) => H.draw(braceOf(s, "below-0-0"), 3.4),
      /* THE BAR IS CUT WHERE IT STANDS: the question mark steps aside and three lines are drawn
         down through the same bar, one after another. Nothing is cleared away and redrawn. */
      "b0.cut": (s, H) => {
        const bar = mb(s, "bar")[0];
        const q = mb(s, "num")[0];
        if (q) { H.show(q); if (H.fade) H.fade(q, 0.1); else q.style.opacity = "0"; }
        if (!bar) return;
        const x = Number(bar.getAttribute("x")), y = Number(bar.getAttribute("y"));
        const w = Number(bar.getAttribute("width")), h = Number(bar.getAttribute("height"));
        for (let k = 1; k < BOXES; k++) {
          let line = s.querySelector(`[data-mb="cut"][data-k="c${k}"]`);
          if (!line) {
            line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("data-mb", "cut");
            line.setAttribute("data-k", `c${k}`);
            line.setAttribute("x1", x + (w * k) / BOXES); line.setAttribute("x2", x + (w * k) / BOXES);
            line.setAttribute("y1", y); line.setAttribute("y2", y + h);
            line.setAttribute("stroke", INK); line.setAttribute("stroke-width", bar.getAttribute("stroke-width") || "0.5");
            s.appendChild(line);
          }
          H.score(line, 0.15 + (k - 1) * 0.95, 0.45);
        }
      },
      /* the cut bar, as the drawing that has four boxes: it lands exactly on the one just cut */
      "b1.base": (s, H) => {
        mb(s, "bar").forEach((n) => H.show(n));
        H.draw(braceOf(s, "below-0-0"));
      },
      "b1.pct": (s, H) => mb(s, "num").forEach((n, i) => H.write(n, 3.0 + i * 0.35)),
      "b2.base": (s, H) => {
        mb(s, "bar").forEach((n) => H.show(n));
        mb(s, "num").forEach((n) => H.show(n));
        H.draw(braceOf(s, "below-0-0"));
      },
      "b2.lose": (s, H) => {
        const bars = mb(s, "bar");
        H.tint(bars[BOXES - 1], bars[0].getAttribute("fill"), 2.4);
        H.draw(braceOf(s, "above-0-1"), 2.9);
      },
      "b2.sold": (s, H) => H.draw(braceOf(s, "above-0-0"), 0.6),
      "b3.base": (s, H) => {
        mb(s, "bar").forEach((n) => H.show(n));
        H.draw(braceOf(s, "above-0-0"));
        H.draw(braceOf(s, "above-0-1"));
        const t = braceOf(s, "below-0-0")?.querySelector("text");
        if (t) t.textContent = "?";             // stepping back un-answers it
        H.draw(braceOf(s, "below-0-0"));
      },
      "b3.one": (s, H) => H.write(mb(s, "num")[0], 3.2),
      "b3.rest": (s, H) => mb(s, "num").slice(1).forEach((n, i) => H.write(n, 2.8 + i * 1.0)),
      "b3.cost": (s, H) => {
        const t = braceOf(s, "below-0-0")?.querySelector("text");
        if (t) H.flip(t, `cost price = ${f(COST)}`, 2.2);
      },
      "eq.left": (s, H) => {
        H.write(markOf(s, "top"), 3.6);
        H.grow(mb(s, "bar", 0)[0], 3.9);
        H.write(markOf(s, "bot"), 4.3);
      },
      "eq.sold": (s, H) => {
        H.write(markOf(s, "eq"), 1.8);
        H.write(markOf(s, "sold"), 3.4);
        H.write(markOf(s, "ws"), 3.8);
      },
      "eq.cost": (s, H) => {
        H.grow(mb(s, "bar", 1)[0], 0.3);
        const q = markOf(s, "cost");
        if (q) q.textContent = "?";            // stepping back puts the question mark back
        H.write(q, 3.6);
        H.write(markOf(s, "wc"), 4.0);
      },
      "eq.over": (s, H) => H.draw(braceOf(s, "over"), 1.6),
      "eq.under": (s, H) => H.draw(braceOf(s, "under"), 1.8),
      "eq.ans": (s, H) => H.flip(markOf(s, "cost"), f(COST), 2.2),
    },
    /* THE DELAYS IN THE STAGES ARE WHERE THE WORD LANDS: about two and a half words a second, so a
       mark drawn at 3.0 s arrives on the word that names it, not at the start of the sentence.
       SPOKEN THE WAY THE USER SPEAKS (.claude/skills/prepbot-lesson-voice, 2b), ONE BREATH A STEP.
       Each step says one thing and draws that thing while it is said; `pause` is the silence after,
       longest after a question, so the child answers in their head before PrepBot does. */
    steps: ({ push, look }) => {
      /* ── METHOD ONE: THE BOX METHOD ── */
      push("Someone bought a computer set.", { on: ["a1"], pause: 0.5 });
      push("Later, they sold that same computer set... for fifty seven thousand naira.", { pause: 0.4 });
      push("But they did not make money. They actually sold it at a loss.", { pause: 0.6 });
      push("They lost twenty five percent. Twenty five percent of what they bought it for, you get?", { pause: 1 });
      push("So what they bought it for... that's the big number we don't know yet. That's the one we're hunting, right?",
        { on: ["m1"], pause: 0.8 });
      push("So picture it like this. One whole bar. That bar is what they bought it for.",
        { on: ["b0"], add: ["b0.bar", "b0.brace"], pause: 0.5 });
      push("We don't know it yet, so let's just put a question mark inside it. Just like that.",
        { add: ["b0.q"], pause: 1 });

      push("Now, twenty five percent. Twenty five out of a hundred... what is that, in a simpler way?",
        { pause: 1.6 });
      push("It's a quarter. One out of four.", { on: ["l1"], pause: 0.6 });
      push("So I'm going to cut our bar into four equal boxes. Watch.", { pause: 0.5 });
      push("One cut... two cuts... three cuts.", { add: ["b0.cut"], pause: 0.6 });
      push("Four boxes now, all the same size. And each box is twenty five percent.",
        { on: ["b1"], off: ["b0"], add: ["b1.base", "b1.pct"], pause: 0.8 });

      push("They lost twenty five percent. That's one box.",
        { on: ["b2"], off: ["b1"], add: ["b2.base", "b2.lose"], pause: 0.5 });
      push("That box is gone. They never got it back.", { on: ["l2"], pause: 0.8 });
      push("Now wait. This is where people fall.", { pause: 0.7 });
      push("Some people will quickly take twenty five percent of fifty seven thousand. Don't do that.",
        { pause: 0.6 });
      push("The loss is a quarter of what they bought it for. The big bar. Not a quarter of fifty seven thousand.",
        { look: look.mark("b2", "bar", BOXES - 1), lookAt: { lit: true, delay: 0.4, hold: 2.2 }, pause: 1 });
      push("So, what did they actually collect when they sold it?", { pause: 1.5 });
      push("The other three boxes. Just the three.", { add: ["b2.sold"], pause: 0.5 });
      push("And that's the fifty seven thousand. So fifty seven thousand is not the full bar. It's what is left after the loss.",
        { on: ["l3"], look: look.brace("b2", "above-0-0"), lookAt: { lit: true, delay: 0.5, hold: 2.0 }, pause: 0.6 });
      push("Three boxes, fifty seven thousand. You follow me so far?", { pause: 1.4 });

      push("Now. If three boxes make fifty seven thousand... how much is one box?",
        { on: ["b3"], off: ["b2"], add: ["b3.base"], pause: 1.8 });
      push("We share fifty seven thousand into three. That's nineteen thousand.",
        { on: ["l4"], add: ["b3.one"], pause: 0.6 });
      push("And all the boxes are the same size. So nineteen thousand, nineteen thousand, nineteen thousand... the lost one too.",
        { add: ["b3.rest"], pause: 0.8 });
      push("And what they bought it for is the whole bar. All four boxes.", { pause: 0.5 });
      push("Four times nineteen thousand... seventy six thousand.", { on: ["l5"], add: ["b3.cost"], pause: 0.8 });
      push("Let's check it. They lost one box, nineteen thousand. Seventy six thousand minus nineteen thousand...",
        { on: ["l6"], pause: 0.4 });
      push("Fifty seven thousand. That's exactly the price in the question. It works.", { pause: 0.6 });
      push("So the answer is E. Seventy six thousand naira.", { pause: 1.4 });

      /* ── METHOD TWO: EQUIVALENT FRACTIONS ── */
      push("Now let me show you another way. No boxes this time. Just fractions.",
        { on: ["m2"], off: ["b3", "m1", "l1", "l2", "l3", "l4", "l5", "l6"], pause: 0.6 });
      push("They lost twenty five percent. So what part did they still get?", { pause: 1.5 });
      push("A hundred percent minus twenty five percent. Seventy five percent.", { on: ["k1"], pause: 0.6 });
      push("Seventy five percent is seventy five over a hundred. We can make that smaller.",
        { on: ["k2"], pause: 0.5 });
      push("Divide the top and the bottom by twenty five... and you get three over four. Three quarters.",
        { on: ["eq"], add: ["eq.left"], pause: 0.6 });
      push("And look. It's the same thing as before. Three boxes out of four.", { pause: 0.8 });
      push("So, the selling price, over what they bought it for. Fifty seven thousand on top.",
        { add: ["eq.sold"], pause: 0.4 });
      push("And underneath, what they bought it for. We don't know it, so... question mark.",
        { add: ["eq.cost"], pause: 0.5 });
      push("Top goes with top, bottom goes with bottom. You get?", { pause: 1 });
      push("Now these two fractions are equal. And to make equal fractions, you multiply the top and the bottom by the same number.",
        { pause: 0.6 });
      push("So look at the tops. Three becomes fifty seven thousand. Three times what?",
        { add: ["eq.over"], pause: 1.8 });
      push("Fifty seven thousand divided by three. Nineteen thousand.",
        { on: ["k3"], pause: 0.5 });
      push("Same as one box, you see?", { pause: 0.9 });
      push("And whatever you do to the top, you must do to the bottom. Otherwise they won't be equal again.",
        { add: ["eq.under"], pause: 0.6 });
      push("So four times nineteen thousand... seventy six thousand.",
        { on: ["k4"], add: ["eq.ans"], pause: 0.6 });
      push("There's our question mark. Seventy six thousand naira. Same answer as the boxes.",
        { on: ["k5"], pause: 1 });
      push("So you see. Two ways, one answer. The boxes help you see it. The fractions say the same thing with numbers.",
        { play: (S, H, stage) => runLit(H, stage, ["k1", "k2", "k3", "k4"]), pause: 0.8 });
      push("Just remember this one thing. A loss, or a profit, is always a part of what they bought it for. The whole bar. Don't forget it.");
    },
  });
}
