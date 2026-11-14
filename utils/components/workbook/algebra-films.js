/* ============================================================================
   ALGEBRA DERIVATIONS — the quadratic formula, by completing the square
   ----------------------------------------------------------------------------
   *"Add a new video on derivations. Deriving the quadratic formula using
   completing the square and with the geometry visuals (this should be very
   detailed too)."*

   The picture is the one that makes completing the square make sense:
     x²   a square with sides x
     bx   a strip x tall and b wide beside it
   CUT the strip down the middle (two strips b/2 wide), TURN one half and lay
   it along the bottom of the square: an L shape that is nearly a square, with
   one corner missing, (b/2)². ADD that corner (to both sides of the equation,
   to keep it balanced) and the shape IS a square, (x + b/2)².
   Part 1 does it with numbers (x² + 6x = 16); part 2 does it with letters,
   step by step, all the way to x = (−b ± √(b² − 4ac)) / 2a; then a check
   with part 1's numbers, and what b² − 4ac says about the answers.
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad, texAt } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";

const INK = "#2a2723", BLUE = "#2f6f8f", GREEN = "#2f7d4a", RED = "#c0453f", PURPLE = "#6b4fa0";
const SKY = "#bfe3ff", BUTTER = "#fff3a8", LEAF = "#c8f0c0", PEACH = "#ffd7a3";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const main = (pieces, em = 7.4) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
const at = (y) => centred(150, y);
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const isInstant = (H) => H.show === H.grow;
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const tex = (t, x, y, k, { em = 4.6, color = INK, anchor = "middle" } = {}) => texAt(t, x, y, { em, color, anchor, attrs: `data-mb="num" data-k="${k}"` });

/* ── THE PICTURE ──────────────────────────────────────────────────────────
   labels: { x, sq, strip, w, half, hw, corner, big } as TeX */
function geo(lab) {
  const X = 44, Y = 8, S = 30, W = 14, H2 = W / 2;
  const P = X + S + H2;                  // where the strip is cut
  let o = "";
  /* the x² square */
  o += `<rect data-mb="bar" data-k="sq" x="${X}" y="${Y}" width="${S}" height="${S}" fill="${SKY}" stroke="${INK}" stroke-width="0.7"/>`;
  o += tex(lab.sq, X + S / 2, Y + S / 2 + 2, "lsq", { em: 6 });
  o += tex(lab.x, X + S / 2, Y - 2, "lxt");
  o += tex(lab.x, X - 3, Y + S / 2 + 1.5, "lxl", { anchor: "end" });
  /* the strip, as two halves (one rect each), shown together first */
  o += `<rect data-mb="bar" data-k="s1" x="${X + S}" y="${Y}" width="${H2}" height="${S}" fill="${BUTTER}" stroke="${INK}" stroke-width="0.7"/>`;
  o += `<g data-k="mv" style="transform-box: view-box; transform-origin: ${P}px ${Y + S}px">`
    + `<rect data-mb="bar" data-k="s2" x="${P}" y="${Y}" width="${H2}" height="${S}" fill="${BUTTER}" stroke="${INK}" stroke-width="0.7"/>`
    + `</g>`;
  /* the strip's own labels (before the cut) */
  o += tex(lab.strip, X + S + H2, Y + S / 2 + 2, "lstrip", { em: 5 });
  o += tex(lab.w, X + S + H2, Y - 2, "lw");
  /* the cut */
  o += `<g data-mb="brace" data-mb-key="cut"><path d="M${P} ${Y - 1} V${Y + S + 1}" fill="none" stroke="${RED}" stroke-width="0.8" stroke-dasharray="2 1.2"/></g>`;
  /* after the cut: the halves' labels; the moved half's labels sit where it lands */
  o += tex(lab.half, X + S + H2 / 2, Y + S / 2 + 2, "lh1", { em: 3.8 });
  o += tex(lab.hw, X + S + H2 / 2, Y - 2, "lhw1", { em: 3.8 });
  o += tex(lab.half, X + S / 2, Y + S + H2 / 2 + 1.4, "lh2", { em: 3.8 });
  o += tex(lab.hw, X - 3, Y + S + H2 / 2 + 1.4, "lhw2", { em: 3.8, anchor: "end" });
  /* the missing corner */
  o += `<g data-mb="brace" data-mb-key="corner"><path d="M${X + S} ${Y + S} h${H2} v${H2} h${-H2} z" fill="none" stroke="${PURPLE}" stroke-width="0.7" stroke-dasharray="1.5 1"/></g>`;
  o += `<rect data-mb="num" data-k="cfill" x="${X + S}" y="${Y + S}" width="${H2}" height="${H2}" fill="${PEACH}" stroke="${PURPLE}" stroke-width="0.7"/>`;
  o += tex(lab.corner, X + S + H2 + 3, Y + S + H2 / 2 + 1.4, "lc", { em: 3.8, color: PURPLE, anchor: "start" });
  /* the whole square */
  o += `<g data-mb="brace" data-mb-key="big"><path d="M${X} ${Y} h${S + H2} v${S + H2} h${-(S + H2)} z" fill="none" stroke="${GREEN}" stroke-width="1.3"/></g>`;
  o += tex(lab.big, X + (S + H2) / 2, Y + S + H2 + 6, "lbig", { em: 4.6, color: GREEN });
  return svgBox(150, 58, o);
}
const fadeOut = (s, H, ks) => ks.forEach((k) => { const n = key(s, k); if (!n) return; n.style.transition = isInstant(H) ? "" : "opacity .4s"; n.style.opacity = "0"; });
const geoStages = (p) => ({
  [`${p}.sq`]: (s, H) => { H.grow(key(s, "sq"), 0.1); ["lxt", "lxl", "lsq"].forEach((k, i) => H.write(key(s, k), 0.7 + i * 0.35)); },
  [`${p}.strip`]: (s, H) => { H.grow(key(s, "s1"), 0.1); H.grow(key(s, "s2"), 0.1); H.write(key(s, "lstrip"), 0.8); H.write(key(s, "lw"), 1.1); },
  /* the knife comes down the middle of the strip */
  [`${p}.cut`]: (s, H) => {
    H.draw(s?.querySelector('[data-mb-key="cut"]'), 0.1);
    if (!isInstant(H)) H.sound("snip", 0.2);
    fadeOut(s, H, ["lstrip", "lw"]);
    ["lh1", "lhw1"].forEach((k, i) => H.write(key(s, k), 0.9 + i * 0.3));
  },
  /* one half TURNS and slides under the square */
  [`${p}.move`]: (s, H) => {
    const g = key(s, "mv"), X = 44, S = 30, W = 14;
    if (!g) return;
    const to = `translate(${-(S + W / 2)}px, 0px) rotate(90deg)`;
    fadeOut(s, H, ["cut"]);
    const c = s?.querySelector('[data-mb-key="cut"]'); if (c) { c.style.transition = isInstant(H) ? "" : "opacity .3s"; c.style.opacity = "0"; }
    if (isInstant(H)) g.style.transform = to;
    else { g.style.transition = "transform 1.4s cubic-bezier(.5,0,.2,1)"; requestAnimationFrame(() => { g.style.transform = to; }); H.sound("flip", 0.1); }
    ["lh2", "lhw2"].forEach((k, i) => H.write(key(s, k), 1.5 + i * 0.3));
  },
  [`${p}.corner`]: (s, H) => { H.draw(s?.querySelector('[data-mb-key="corner"]'), 0.1); },
  [`${p}.fill`]: (s, H) => { H.write(key(s, "cfill"), 0.1); H.write(key(s, "lc"), 0.5); if (!isInstant(H)) H.sound("pop", 0.2); },
  [`${p}.big`]: (s, H) => { H.draw(s?.querySelector('[data-mb-key="big"]'), 0.1); H.write(key(s, "lbig"), 0.8); if (!isInstant(H)) H.sound("ding", 0.9); },
});
const ALL = (p) => [`${p}.sq`, `${p}.strip`, `${p}.cut`, `${p}.move`, `${p}.corner`, `${p}.fill`, `${p}.big`];

export function quadFormula() {
  /* the working lines: key -> [tex, colour, size] */
  const EQ = {
    n1: ["x^{2} + 6x = 16"],
    n2: ["x^{2} + 6x + 9 = 16 + 9"],
    n3: ["(x + 3)^{2} = 25", GREEN],
    n4: ["x + 3 = 5\\ \\ \\text{or}\\ \\ x + 3 = -5"],
    n5: ["x = 2\\ \\ \\text{or}\\ \\ x = -8", GREEN],
    g1: ["ax^{2} + bx + c = 0"],
    g2: ["x^{2} + \\dfrac{b}{a}x + \\dfrac{c}{a} = 0"],
    g3: ["x^{2} + \\dfrac{b}{a}x = -\\dfrac{c}{a}"],
    g4: ["x^{2} + \\dfrac{b}{a}x + \\left(\\dfrac{b}{2a}\\right)^{2} = \\left(\\dfrac{b}{2a}\\right)^{2} - \\dfrac{c}{a}", null, 6.2],
    g5: ["\\left(x + \\dfrac{b}{2a}\\right)^{2} = \\dfrac{b^{2}}{4a^{2}} - \\dfrac{c}{a}", GREEN],
    g6: ["\\dfrac{b^{2}}{4a^{2}} - \\dfrac{4ac}{4a^{2}} = \\dfrac{b^{2} - 4ac}{4a^{2}}", null, 6.8],
    g7: ["x + \\dfrac{b}{2a} = \\pm\\dfrac{\\sqrt{b^{2} - 4ac}}{2a}", null, 7],
    g8: ["x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}", GREEN, 8.4],
    c1: ["a = 1,\\ b = 6,\\ c = -16"],
    c2: ["x = \\dfrac{-6 \\pm \\sqrt{36 + 64}}{2} = \\dfrac{-6 \\pm 10}{2}", null, 6.8],
    c3: ["x = \\dfrac{4}{2} = 2\\ \\ \\text{or}\\ \\ x = \\dfrac{-16}{2} = -8\\ \\ \\checkmark", GREEN, 6.8],
    d1: ["b^{2} - 4ac > 0:\\ \\text{two answers}\\quad = 0:\\ \\text{one}\\quad < 0:\\ \\text{none}", PURPLE, 5.6],
  };
  const pics = {
    gn: () => geo({ x: "x", sq: "x^{2}", strip: "6x", w: "6", half: "3x", hw: "3", corner: "9", big: "(x + 3)^{2}" }),
    gg: () => geo({ x: "x", sq: "x^{2}", strip: "\\tfrac{b}{a}x", w: "\\tfrac{b}{a}", half: "\\tfrac{b}{2a}x", hw: "\\tfrac{b}{2a}", corner: "\\left(\\tfrac{b}{2a}\\right)^{2}", big: "\\left(x + \\tfrac{b}{2a}\\right)^{2}" }),
    ...Object.fromEntries(Object.entries(EQ).map(([k, [t, c, em]]) => [k, () => main([L("a", t, c)], em || 7.4)])),
  };
  const picAt = { gn: centred(150, 11), gg: centred(150, 11), ...Object.fromEntries(Object.keys(EQ).map((k) => [k, at(35.5)])) };
  const stages = {
    ...geoStages("gn"), ...geoStages("gg"),
    ...Object.fromEntries(Object.keys(EQ).map((k) => [`${k}.all`, (s, H) => { const n = key(s, "a"); if (n) H.write(n, 0.1); if (["n3", "n5", "g5", "g8", "c3"].includes(k)) H.sound("ding", 0.6); }])),
  };
  /* one working line at a time: show `k`, hide the one before */
  let shown = null;
  const eq = (k) => { const off = shown ? [shown] : []; shown = k; return { on: [k], off, add: [`${k}.all`] }; };
  /* a step's options from several pieces: lists join, cues merge, the rest is kept */
  const merge = (...objs) => {
    const o = {};
    objs.forEach((x) => Object.entries(x || {}).forEach(([k, v]) => {
      if (["on", "off", "add"].includes(k)) o[k] = [...(o[k] || []), ...v];
      else if (k === "cue") o.cue = { ...(o.cue || {}), ...v };
      else o[k] = v;
    }));
    return o;
  };

  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "Where does the quadratic formula come from? Derive it by completing the square, with a picture." },
      { id: "a2", html: true, text: "Solve <i>x</i>² + 6<i>x</i> = 16 by completing the square." },
      { id: "a3", html: true, text: "Now any quadratic: <i>ax</i>² + <i>bx</i> + <i>c</i> = 0. Solve it for <i>x</i>." },
    ],
    pics, picAt,
    lines: [
      { id: "k1", receipt: true, sub: "Part 1", text: "Completing the square, with numbers", y: 50.5 },
      { id: "k2", receipt: true, sub: "Part 2", text: "The same steps, with letters", y: 50.5 },
      { id: "k3", receipt: true, sub: "Part 3", text: "Check it, and read the root", y: 50.5 },
    ],
    stages,
    steps: ({ push: raw }) => {
      const push = (say, ...parts) => raw(say, merge(...parts));
      push("You've probably met the quadratic formula: x equals minus b, plus or minus the square root of b squared minus four a c, all over two a. It looks like it fell out of the sky. It didn't. Today we'll build it ourselves, with a picture, so you'll never have to just trust it again.",
        { on: ["a1"], transition: "iris", pause: 0.8 });
      push("The idea we need is called completing the square. Before we touch any letters, let's see it with ordinary numbers, because the picture is exactly the same.", { pause: 0.6 });

      /* ── PART 1: NUMBERS ── */
      push("Here's the equation: x squared plus six x equals sixteen. We don't know x, so we'll draw what each part MEANS. x squared is the area of a square whose sides are x long.",
        merge({ on: ["a2", "gn", "k1"], off: ["a1"], add: ["gn.sq"] }, eq("n1")), { });
      push("And six x is the area of a strip that's x tall and six wide. Lay it beside the square. Together, the square and the strip have an area of sixteen. That's all the equation says.",
        { add: ["gn.strip"], cue: { "gn.strip": "six x is" }, pause: 0.8 });
      push("Now the clever part. Cut the strip straight down the middle. Each half is three wide, so each half has an area of three x.",
        { add: ["gn.cut"], cue: { "gn.cut": "cut the strip" }, pause: 0.6 });
      push("Take one half, turn it round, and lay it along the bottom of the square. Watch it move. Nothing has been added or lost: the area is still sixteen. But look at the shape now.",
        { add: ["gn.move"], cue: { "gn.move": "take one half" }, pause: 0.8 });
      push("It's ALMOST a square. A big square with sides of x plus three, except for one little corner that's missing: a corner three by three, so nine.",
        { add: ["gn.corner"], cue: { "gn.corner": "except for one" }, pause: 0.8 });
      push("So let's fill it in. Add nine to the picture to complete the square. But an equation is a balance: whatever we add to one side, we must add to the other. So nine goes on BOTH sides.",
        merge({ add: ["gn.fill"], cue: { "gn.fill": "fill it in" } }, eq("n2")), { pause: 0.8 });
      push("Now the left side is a perfect square, sides x plus three, so its area is x plus three, squared. And the right side is sixteen plus nine, twenty-five. That's why it's called completing the square: we added the missing corner.",
        merge({ add: ["gn.big"], cue: { "gn.big": "now the left side" } }, eq("n3")), { pause: 0.8 });
      push("A square with area twenty-five has sides of five. But careful: minus five, times minus five, is also twenty-five. So x plus three is five, OR x plus three is minus five. Never forget the minus one.",
        eq("n4"), { pause: 0.8 });
      push("Take three from both sides: x is two, or x is minus eight. Two answers. Check the first: two squared is four, plus six twos is twelve, sixteen. It works.",
        eq("n5"), { pause: 1 });

      /* ── PART 2: LETTERS ── */
      push("Now the real thing. Any quadratic looks like this: a x squared, plus b x, plus c, equals nought. a, b and c are just numbers we haven't been told. We'll do exactly what we just did, step by step.",
        merge({ on: ["a3", "k2"], off: ["a2", "gn", "k1"], transition: card("Part 2", "The same steps, with letters") }, eq("g1")), { });
      push("Step one. Our picture started with x squared, one square, not a lots of them. So divide every term by a. That gives x squared, plus b over a x, plus c over a, equals nought.",
        eq("g2"), { pause: 0.8 });
      push("Step two. Move the number on its own, c over a, to the other side. Take it from both sides: x squared plus b over a x equals minus c over a. Now it looks just like x squared plus six x equals sixteen.",
        eq("g3"), { pause: 0.8 });
      push("So draw it the same way. A square, x by x. A strip beside it, x tall, and this time b over a wide.",
        { on: ["gg"], add: ["gg.sq", "gg.strip"], cue: { "gg.strip": "a strip" }, pause: 0.8 });
      push("Cut the strip down the middle. Half of b over a is b over two a. So each half is b over two a wide.",
        { add: ["gg.cut"], cue: { "gg.cut": "cut the strip" }, pause: 0.6 });
      push("Turn one half and lay it along the bottom. Again, the same area, and again a big square with one corner missing.",
        { add: ["gg.move", "gg.corner"], cue: { "gg.move": "turn one half", "gg.corner": "one corner" }, pause: 0.8 });
      push("The missing corner is b over two a by b over two a: b over two a, squared. Fill it in, and to keep the balance, add it to BOTH sides.",
        merge({ add: ["gg.fill"], cue: { "gg.fill": "fill it in" } }, eq("g4")), { pause: 0.8 });
      push("The left side is now a complete square with sides x plus b over two a. So it's x plus b over two a, all squared. On the right, b over two a squared is b squared over four a squared, then minus c over a.",
        merge({ add: ["gg.big"], cue: { "gg.big": "the left side" } }, eq("g5")), { pause: 0.8 });
      push("Step three: tidy the right side into one fraction. The bottoms are four a squared and a. Multiply c over a, top and bottom, by four a: four a c over four a squared. Now subtract: b squared minus four a c, all over four a squared.",
        eq("g6"), { pause: 0.8 });
      push("So x plus b over two a, squared, equals b squared minus four a c, over four a squared. Step four: take the square root of both sides, just like we did with twenty-five. And don't forget: plus OR minus.",
        { pause: 0.6 });
      push("The square root of the bottom, four a squared, is two a. The top stays under a root: the square root of b squared minus four a c. So x plus b over two a equals plus or minus that root, over two a.",
        eq("g7"), { pause: 0.8 });
      push("Last step: take b over two a from both sides. Both fractions are over two a, so they join into one. x equals minus b, plus or minus the square root of b squared minus four a c, all over two a. That's the quadratic formula, and we built it from a square and a strip.",
        eq("g8"), { pause: 1.2 });

      /* ── PART 3: CHECK AND READ ── */
      push("Let's check it against part one. x squared plus six x equals sixteen is x squared plus six x minus sixteen equals nought. So a is one, b is six, and c is minus sixteen.",
        merge({ on: ["k3"], off: ["gg", "k2"], transition: card("Part 3", "Check it, and read the root") }, eq("c1")), { });
      push("Put them in. b squared is thirty-six. Minus four a c is minus four times one times minus sixteen, which is PLUS sixty-four. Thirty-six plus sixty-four is a hundred, and its square root is ten. So x is minus six, plus or minus ten, over two.",
        eq("c2"), { pause: 0.8 });
      push("Minus six plus ten is four, over two: two. Minus six minus ten is minus sixteen, over two: minus eight. The same two answers the picture gave us.",
        eq("c3"), { pause: 1 });
      push("One more thing the formula tells you, before you even finish. The part under the root, b squared minus four a c, is called the discriminant. If it's positive, its root gives a plus and a minus: two answers. If it's nought, plus and minus nought are the same: one answer. And if it's negative, there's no real square root, so no real answer at all.",
        eq("d1"), { pause: 1 });
      push("So the quadratic formula is just completing the square, done once with letters, so you never have to do it again. A square, a strip cut in half, one missing corner, and the same steps every time.");
    },
  });
}
