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

   THE LAYOUT (2026-11-12, *"Too much information is congested on screen … Use
   the center. Only use the side for extra calculations"*):
     top      the question, small
     centre   the ONE thing being worked: the bar, then one line of working
              under it, replaced as the working moves on
     side     only the extra sums a teacher does in the margin: 25 ÷ 25, the
              check, the trap
   All the maths is MathJax (./film-math.js); a fraction is reduced by striking
   its top and bottom and writing the new ones beside them. Sounds and screen
   changes come from ./film-fx.js through the drawing hand.

   47 steps: keep it so. The film editor keeps the user's own words step by
   step, and plays them on this drawing only while the counts agree.
   ========================================================================== */

import { modelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";
import { braceOf, film, mb, part } from "./film-kit.js";
import { mathLoad, mathifyPic, texAt, texBox } from "./film-math.js";

const INK = "#2a2723";
const RED = "#c0453f";
const BLUE = "#2f6f8f";
const GREEN = "#2f7d4a";
const GREY = "#6b645b";

/* the drawings are measured in millimetres of a 150 mm sheet, shown 60 units across */
const PAPER = 150, PIC_W = 60, K_ = PIC_W / PAPER;   // screen units per millimetre

/* ── a line of mathematics, laid out left to right and centred ──────────────
   pieces: { k, tex } a formula; { k, frac: [top, bottom] } a fraction (its
   rule is a line the hand draws); { gap } space. Every piece is a mark the
   hand writes by its data-k. Returns the markup and where each piece stands,
   so a fraction can be struck through and re-numbered beside itself. */
function mathRow(pieces, { cx = 75, y = 15, em = 7, color = INK } = {}) {
  const pad = em * 0.28;
  const laid = pieces.map((p) => {
    if (p.gap) return { ...p, w: p.gap };
    if (p.frac) {
      const t = texBox(p.frac[0], em), b = texBox(p.frac[1], em);
      return { ...p, t, b, w: Math.max(t.w, b.w) + em * 0.35 };
    }
    return { ...p, w: texBox(p.tex, em).w };
  });
  const total = laid.reduce((a, p) => a + p.w, 0) + pad * (laid.length - 1);
  let x = cx - total / 2;
  const at = {};
  const out = [];
  const axis = y - em * 0.27;                  // where a fraction's rule sits, level with the signs
  laid.forEach((p) => {
    const mid = x + p.w / 2;
    const ink = p.color || color;
    if (p.frac) {
      const topBase = axis - em * 0.2;
      const botBase = axis + em * 0.22 + p.b.asc;
      out.push(texAt(p.frac[0], mid, topBase, { em, color: ink, attrs: `data-mb="num" data-k="${p.k}n"` }));
      out.push(`<line data-mb="cut" data-k="${p.k}r" x1="${x.toFixed(2)}" x2="${(x + p.w).toFixed(2)}" y1="${axis.toFixed(2)}" y2="${axis.toFixed(2)}" stroke="${ink}" stroke-width="${(em * 0.06).toFixed(2)}" stroke-linecap="round"/>`);
      out.push(texAt(p.frac[1], mid, botBase, { em, color: ink, attrs: `data-mb="num" data-k="${p.k}d"` }));
      at[p.k] = { x: mid, w: p.w, topBase, topAsc: p.t.asc, topW: p.t.w, botBase, botAsc: p.b.asc, botW: p.b.w };
    } else if (!p.gap) {
      out.push(texAt(p.tex, mid, y, { em, color: ink, attrs: `data-mb="num" data-k="${p.k}"` }));
      at[p.k] = { x: mid, w: p.w };
    }
    x += p.w + pad;
  });
  return { svg: out.join(""), at };
}

/* A FRACTION REDUCED WHERE IT STANDS: a pen stroke through its top and its
   bottom, and the new figures written small beside them. */
function reduceMarks(f, key, top, bottom, em) {
  const sx = (w) => w / 2 + em * 0.12;
  const strike = (cx, base, asc, w, k) =>
    `<line data-mb="cut" data-k="${k}" x1="${(cx - sx(w)).toFixed(2)}" y1="${(base + em * 0.08).toFixed(2)}" x2="${(cx + sx(w)).toFixed(2)}" y2="${(base - asc - em * 0.06).toFixed(2)}" stroke="${RED}" stroke-width="${(em * 0.07).toFixed(2)}" stroke-linecap="round"/>`;
  const small = em * 0.62;
  return strike(f.x, f.topBase, f.topAsc, f.topW, `${key}xs`)
    + strike(f.x, f.botBase, f.botAsc, f.botW, `${key}ys`)
    + texAt(top, f.x + f.topW / 2 + small * 0.55, f.topBase - f.topAsc + small * 0.15, { em: small, color: BLUE, anchor: "start", attrs: `data-mb="num" data-k="${key}xn"` })
    + texAt(bottom, f.x + f.botW / 2 + small * 0.55, f.botBase + small * 0.45, { em: small, color: BLUE, anchor: "start", attrs: `data-mb="num" data-k="${key}yn"` });
}

const svgBox = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" overflow="visible">${inner}</svg>`;

/* where a drawing with no bar in it hangs: by its top-left corner, in screen units */
const centred = (wMm, y) => ({ x: 50 - (wMm * K_) / 2, y });

/* ═══ A PART AND ITS WHOLE, TWO WAYS ══════════════════════════════════════
   Every "this much is so many percent of the whole: find the whole" question
   is the same picture: the whole is a bar of N equal boxes, K of them are the
   part we were told about, one box is the part ÷ K, and the whole is N boxes.
   Then the same thing as equivalent fractions: K/N = part/?, times one box.
   A film gives its numbers, its labels and its own narration; the drawing,
   its stages and its layout are shared.

     cfg.N, cfg.K, cfg.known      boxes in the whole, boxes in the part, the part's value
     cfg.question                 the question as set
     cfg.labels                   { part, rest, whole, wholeTex, unitTex, money, wordTop, wordBottom }
     cfg.box                      method 1's fraction: { pct, top, bot, by } (25% = 1/4 ÷25, 80% = 4/5 ÷20)
     cfg.frac                     method 2's fraction: { top: tex line, pct, num, den, by }
     cfg.trap                     the wrong move, in TeX, struck out in the margin
     cfg.steps({ push, look, BOXES })   the narration, using the stage keys below
   ------------------------------------------------------------------------*/
function partWhole(cfg) {
  /* FORWARD: the whole is known and the part is found (a price after a loss, a profit, a discount).
     Otherwise the part is known and the whole is found. */
  const FWD = !!cfg.forward;
  const { N, K } = cfg;
  const BOXES = N;
  const UNIT = FWD ? cfg.whole / N : cfg.known / K;
  const WHOLE = FWD ? cfg.whole : UNIT * N;
  const known = FWD ? UNIT * K : cfg.known;      // the part, whichever way round it was given
  const L = cfg.labels;
  const f = (n) => n.toLocaleString("en-US");
  const t = (n) => f(n).replace(/,/g, "{,}");  // a figure in TeX
  /* the boxes share 120 mm, 48 units, in the middle of the screen */
  const BAR_MM = 120;
  /* A PART CAN BE MORE THAN THE WHOLE: a profit. Then the boxes run on past the whole (6 boxes
     sold against a cost of 5), so the longest row is what has to fit the 120 mm */
  const OVER = K > N;
  const ROW = Math.max(N, K), SHARED = Math.min(N, K);
  const PART_MM = BAR_MM / ROW;

  const boxes = (text, restTone = "a") => Array.from({ length: ROW }, (_, i) => part(text, 1, i >= SHARED ? restTone : "a"));
  const bars = (rows) => mathifyPic(modelSvg(rows, { cap: PART_MM, label: "" }));
  /* the braces: the part over the top; under it, the whole (and, past the whole, the profit) */
  const tops = OVER ? [{ from: 0, to: K, text: L.part }] : [{ from: 0, to: K, text: L.part }, { from: K, to: N, text: L.rest }];
  const lows = (whole) => (OVER ? [{ from: 0, to: N, text: whole }, { from: N, to: K, text: L.rest }] : [{ from: 0, to: N, text: whole }]);
  const REST = OVER ? "below-0-1" : "above-0-1";
  const CUT_GAP = N > 6 ? 0.32 : 0.95;

  /* the working under the bar, one line at a time */
  const MAIN_W = 150, MAIN_H = 30;
  const main = (pieces, extra = () => "", em = 8) => {
    const r = mathRow(pieces, { cx: MAIN_W / 2, y: 17, em });
    return svgBox(MAIN_W, MAIN_H, r.svg + extra(r.at));
  };
  /* the margin, for the extra sums */
  const SIDE_W = 48;
  const side = (rows, em = 5.2) => svgBox(SIDE_W, 12 * rows.length + 4, rows.map((pieces, i) =>
    mathRow(pieces, { cx: SIDE_W / 2, y: 9 + i * 12, em }).svg).join(""));

  const BAR_AT = { x: 50 - (BAR_MM * K_) / 2, y: 21 };
  const MAIN_AT = centred(MAIN_W, 31);
  const SIDE_AT = { x: 79.5, y: 21 };

  /* the equivalent-fraction board: K/N = known/?, with the arrows that say "times the same number" */
  const EQ_W = 150, EQ_H = 62;
  const eqSvg = () => {
    const r = mathRow([{ k: "L", frac: [String(K), String(N)] }, { gap: 6 }, { k: "eq", tex: "=" }, { gap: 6 }, { k: "R", frac: FWD ? ["?", t(WHOLE)] : [t(known), "?"] }],
      { cx: EQ_W / 2 - 6, y: 34, em: 11 });
    const Lf = r.at.L, Rr = r.at.R;
    const ans = FWD
      ? texAt(t(known), Rr.x, Rr.topBase, { em: 11, color: GREEN, attrs: 'data-mb="num" data-k="ans"' })
      : texAt(t(WHOLE), Rr.x, Rr.botBase, { em: 11, color: GREEN, attrs: 'data-mb="num" data-k="ans"' });
    const word = (k, txt, y) => texAt(`\\text{${txt}}`, Rr.x + Rr.w / 2 + 4, y, { em: 5, color: GREY, anchor: "start", attrs: `data-mb="name" data-k="${k}"` });
    /* AN ARROW'S HEAD LIES ALONG THE ARROW. It is worked out from the direction the curve is
       travelling as it arrives (from its control point to its end), so it points where the curve
       goes; the old fixed strokes pointed the wrong way on the lower arrow. */
    const arc = (k, x1, x2, y, up) => {
      const cx = (x1 + x2) / 2, cy = up ? y - 11 : y + 11;
      const dx = x2 - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const head = (turn) => {
        const c = Math.cos(turn), s2 = Math.sin(turn);
        const bx = -ux * c + uy * s2, by = -uy * c - ux * s2;   // back along the arrow, turned
        return `M${x2.toFixed(2)} ${y.toFixed(2)} l${(bx * 3.6).toFixed(2)} ${(by * 3.6).toFixed(2)}`;
      };
      return `<g data-mb="brace" data-mb-key="${k}"><path d="M${x1.toFixed(2)} ${y.toFixed(2)} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y.toFixed(2)} ${head(0.45)} ${head(-0.45)}" fill="none" stroke="${RED}" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    };
    const topY = Lf.topBase - Lf.topAsc - 2, botY = Lf.botBase + 3;
    const end = Rr.x - Math.max(Rr.topW, Rr.botW) / 2 - 3;
    return svgBox(EQ_W, EQ_H, r.svg + ans
      + word("ws", L.wordTop, Lf.topBase) + word("wc", L.wordBottom, Lf.botBase)
      + arc("over", Lf.x + 2, end, topY, true) + arc("under", Lf.x + 2, end, botY, false)
      + texAt(`\\times ${t(UNIT)}`, (Lf.x + Rr.x) / 2 - 2, topY - 9, { em: 5.4, color: RED, attrs: 'data-mb="num" data-k="xo"' })
      + texAt(`\\times ${t(UNIT)}`, (Lf.x + Rr.x) / 2 - 2, botY + 12, { em: 5.4, color: RED, attrs: 'data-mb="num" data-k="xu"' }));
  };

  /* marks by their names, written one after another */
  const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
  const write = (s, H, keys, start = 0, gap = 0.35) => keys.forEach((k, i) => {
    const n = key(s, k);
    if (!n) return;
    if (n.getAttribute("data-mb") === "cut") H.score(n, start + i * gap, 0.4); else H.write(n, start + i * gap);
  });
  const fracKeys = (k) => [`${k}n`, `${k}r`, `${k}d`];
  /* THE BOXES THAT WILL BE LOST STAY THE WHOLE'S COLOUR until the words about them take it away:
     the drawing gives them their colour, so without this they were pink before anyone said why */
  const plain = (s) => { const b = mb(s, "bar"); b.slice(SHARED, N).forEach((n) => { n.style.fill = b[0].getAttribute("fill"); }); };
  const B = cfg.box, F = cfg.frac;

  return film({
    paperMm: PAPER,
    picW: PIC_W,
    ready: mathLoad(),
    asks: [{ id: "a1", text: cfg.question }],
    pics: {
      /* ── method one: the bar ── */
      b0: () => bars([{ parts: [part(FWD ? f(WHOLE) : "?", N, "a")], below: [{ from: 0, to: 1, text: FWD ? L.whole : `${L.whole} = ?` }] }]),
      b1: () => bars([{ parts: boxes(`${100 / N}%`), below: [{ from: 0, to: N, text: FWD ? `${L.whole} = ${f(WHOLE)}` : `${L.whole} = ?` }] }]),
      b2: () => bars([{ parts: boxes(`${100 / N}%`, "d"), above: tops, below: lows(`${L.whole} = ?`) }]),
      b3: () => bars([{ parts: boxes(f(UNIT), "d"), above: FWD ? tops.map((b, i) => (i ? b : { ...b, text: `${L.part} = ?` })) : tops,
        below: lows(FWD ? `${L.whole} = ${f(WHOLE)}` : L.whole) }]),
      /* the working under it, one line at a time */
      mA: () => main([{ k: "p", tex: `${B.pct}\\%` }, { k: "e1", tex: "=" }, { k: "f", frac: [String(B.pct), "100"] }, { k: "e2", tex: "=" }, { k: "q", frac: [String(B.top), String(B.bot)], color: BLUE }],
        (at) => reduceMarks(at.f, "f", String(B.top), String(B.bot), 8)),
      mB: () => main(FWD ? [{ k: "a", tex: `${N}\\ \\text{boxes}` }, { k: "e", tex: "=" }, { k: "b", tex: t(WHOLE) }]
        : [{ k: "a", tex: `${K}\\ \\text{boxes}` }, { k: "e", tex: "=" }, { k: "b", tex: t(known) }]),
      mC: () => main([{ k: "a", tex: "1\\ \\text{box}" }, { k: "e", tex: "=" }, { k: "b", tex: FWD ? `${t(WHOLE)} \\div ${N}` : `${t(known)} \\div ${K}` }, { k: "e2", tex: "=" }, { k: "c", tex: t(UNIT), color: BLUE }]),
      mD: () => main(FWD ? [{ k: "a", tex: `${K}\\ \\text{${K === 1 ? "box" : "boxes"}}` }, { k: "e", tex: "=" }, { k: "b", tex: `${K} \\times ${t(UNIT)}` }, { k: "e2", tex: "=" }, { k: "c", tex: t(known), color: GREEN }]
        : [{ k: "a", tex: `${N}\\ \\text{boxes}` }, { k: "e", tex: "=" }, { k: "b", tex: `${N} \\times ${t(UNIT)}` }, { k: "e2", tex: "=" }, { k: "c", tex: t(WHOLE), color: GREEN }]),
      mE: () => main([{ k: "a", tex: `\\text{${FWD ? L.answer : L.whole}}` }, { k: "e", tex: "=" }, { k: "c", tex: `${L.money ? `\\text{${L.money}}` : ""}${t(FWD ? known : WHOLE)}${L.suffix ? `\\ \\text{${L.suffix}}` : ""}`, color: GREEN }], () => "", 9),
      /* the margin */
      sA: () => side([[{ k: "a", tex: `${B.pct} \\div ${B.by} = ${B.top}` }], [{ k: "b", tex: `100 \\div ${B.by} = ${B.bot}` }]]),
      sT: () => svgBox(SIDE_W, 20, mathRow([{ k: "a", tex: cfg.trap }], { cx: SIDE_W / 2, y: 10, em: 5.4 }).svg
        + `<line data-mb="cut" data-k="x" x1="4" y1="14" x2="${SIDE_W - 4}" y2="3" stroke="${RED}" stroke-width="0.8" stroke-linecap="round"/>`
        + texAt("\\text{not this}", SIDE_W / 2, 19, { em: 4, color: RED, attrs: 'data-mb="num" data-k="n"' })),
      sC: () => side(FWD
        ? [[{ k: "a", tex: OVER ? `${t(known)} - ${t(UNIT * (K - N))}` : `${t(known)} + ${t(UNIT * (N - K))}` }], [{ k: "b", tex: `= ${t(WHOLE)}\\ \\checkmark`, color: GREEN }]]
        : [[{ k: "a", tex: OVER ? `${t(WHOLE)} + ${t(UNIT * (K - N))}` : `${t(WHOLE)} - ${t(UNIT * (N - K))}` }], [{ k: "b", tex: `= ${t(known)}\\ \\checkmark`, color: GREEN }]]),
      /* ── method two ── */
      r2: () => {
        const top = mathRow([{ k: "p", tex: F.top }], { cx: MAIN_W / 2, y: 9, em: 7.5 });
        const low = mathRow([{ k: "s", tex: `${F.pct}\\%` }, { k: "e1", tex: "=" }, { k: "f", frac: [String(F.pct), "100"] }, { k: "e2", tex: "=" }, { k: "q", frac: [String(K), String(N)], color: BLUE }],
          { cx: MAIN_W / 2, y: 33, em: 8 });
        return svgBox(MAIN_W, 46, top.svg + low.svg + reduceMarks(low.at.f, "f", String(K), String(N), 8));
      },
      eq: () => eqSvg(),
      s2A: () => side([[{ k: "a", tex: `${F.pct} \\div ${F.by} = ${K}` }], [{ k: "b", tex: `100 \\div ${F.by} = ${N}` }]]),
      s2B: () => side([[{ k: "a", tex: FWD ? `${t(WHOLE)} \\div ${N}` : `${t(known)} \\div ${K}` }], [{ k: "b", tex: `= ${t(UNIT)}`, color: BLUE }]]),
      s2C: () => side([[{ k: "a", tex: FWD ? `${K} \\times ${t(UNIT)}` : `${N} \\times ${t(UNIT)}` }], [{ k: "b", tex: `= ${t(FWD ? known : WHOLE)}`, color: GREEN }]]),
    },
    picAt: {
      b0: BAR_AT, b1: BAR_AT, b2: BAR_AT, b3: BAR_AT,
      mA: MAIN_AT, mB: MAIN_AT, mC: MAIN_AT, mD: MAIN_AT, mE: centred(MAIN_W, 33),
      sA: SIDE_AT, sT: SIDE_AT, sC: SIDE_AT, s2A: SIDE_AT, s2B: SIDE_AT, s2C: { x: 79.5, y: 37 },
      r2: centred(MAIN_W, 18), eq: centred(EQ_W, 15),
    },
    /* the name of the method on a little receipt, centred under the working (*"put the method label
       centered below … a cute receipt design"*) */
    lines: [
      { id: "m1", receipt: true, sub: "Method 1", text: "The box method", y: 49 },
      { id: "m2", receipt: true, sub: "Method 2", text: "Equivalent fractions", y: 49 },
    ],
    stages: {
      /* the bar */
      "b0.bar": (s, H) => H.grow(mb(s, "bar")[0], 0),
      "b0.q": (s, H) => H.write(mb(s, "num")[0], 0),
      "b0.brace": (s, H) => H.draw(braceOf(s, "below-0-0"), 0),
      /* THE BAR IS CUT WHERE IT STANDS: the question mark steps aside and the lines are drawn down
         through the same bar, one after another (*"keep the bar and draw lines in it"*) */
      "b0.cut": (s, H) => {
        const bar = mb(s, "bar")[0];
        const q = mb(s, "num")[0];
        if (q) q.style.opacity = "0";
        if (!bar) return;
        const x = Number(bar.getAttribute("x")), y = Number(bar.getAttribute("y"));
        const w = Number(bar.getAttribute("width")), h = Number(bar.getAttribute("height"));
        for (let k = 1; k < N; k++) {
          let line = s.querySelector(`[data-mb="cut"][data-k="c${k}"]`);
          if (!line) {
            line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("data-mb", "cut");
            line.setAttribute("data-k", `c${k}`);
            line.setAttribute("x1", x + (w * k) / N); line.setAttribute("x2", x + (w * k) / N);
            line.setAttribute("y1", y); line.setAttribute("y2", y + h);
            line.setAttribute("stroke", INK); line.setAttribute("stroke-width", bar.getAttribute("stroke-width") || "0.5");
            s.appendChild(line);
          }
          H.score(line, (k - 1) * CUT_GAP, 0.45);
          H.sound("snip", (k - 1) * CUT_GAP + 0.3);
        }
      },
      /* ONLY THE WHOLE'S N BOXES: a profit's extra boxes are in the drawing (it is the longest row),
         but they do not exist until the profit is spoken of ("it cuts the 100% into 6 instead of 5") */
      "b1.base": (s, H) => { mb(s, "bar").slice(0, N).forEach((n) => H.show(n)); H.show(braceOf(s, "below-0-0")); },
      "b1.pct": (s, H) => mb(s, "num").slice(0, N).forEach((n, i) => H.write(n, i * 0.35)),
      /* the whole, as it stood when it was cut (a profit's extra boxes are not there yet) */
      "b2.base": (s, H) => {
        mb(s, "bar").slice(0, N).forEach((n) => H.show(n));
        plain(s);
        mb(s, "num").slice(0, N).forEach((n) => H.show(n));
        H.show(braceOf(s, "below-0-0"));
      },
      /* a loss: the boxes not sold take their own colour. A profit: the extra boxes GROW on past the whole */
      "b2.lose": (s, H) => {
        const b = mb(s, "bar"), nums = mb(s, "num");
        if (OVER) {
          b.slice(N).forEach((n, i) => H.grow(n, i * 0.5));
          nums.slice(N).forEach((n, i) => H.write(n, 0.5 + i * 0.5));
        } else {
          b.slice(K).forEach((n, i) => H.tint(n, b[0].getAttribute("fill"), i * 0.3));
        }
        H.draw(braceOf(s, REST), 0.5);
      },
      "b2.sold": (s, H) => H.draw(braceOf(s, "above-0-0"), 0),
      "b3.base": (s, H) => {
        mb(s, "bar").forEach((n) => H.show(n));
        ["above-0-0", REST, "below-0-0"].forEach((k) => H.show(braceOf(s, k)));
      },
      "b3.one": (s, H) => H.write(mb(s, "num")[0], 0),
      /* forward: the whole, already cut, before anything is taken off it or added on */
      "b3.bare": (s, H) => { mb(s, "bar").slice(0, N).forEach((n) => H.show(n)); plain(s); H.show(braceOf(s, "below-0-0")); },
      "b3.fill": (s, H) => mb(s, "num").slice(1, N).forEach((n, i) => H.write(n, i * (N > 6 ? 0.25 : 0.6))),
      /* the loss leaves, or the profit grows on past the whole */
      "b3.away": (s, H) => {
        const b = mb(s, "bar"), nums = mb(s, "num");
        if (OVER) {
          b.slice(N).forEach((n, i) => H.grow(n, i * 0.5));
          nums.slice(N).forEach((n, i) => H.write(n, 0.5 + i * 0.5));
        } else {
          b.slice(K).forEach((n, i) => H.tint(n, b[0].getAttribute("fill"), i * 0.3));
        }
        H.draw(braceOf(s, REST), 0.5);
      },
      "b3.part": (s, H) => H.draw(braceOf(s, "above-0-0"), 0),
      "b3.rest": (s, H) => mb(s, "num").slice(1).forEach((n, i) => H.write(n, i * 1.0)),

      /* the working under the bar */
      "mA.frac": (s, H) => write(s, H, ["p", "e1", ...fracKeys("f")], 0, 0.35),
      "mA.cut": (s, H) => { write(s, H, ["fxs", "fxn", "fys", "fyn"], 0, 0.55); write(s, H, ["e2", ...fracKeys("q")], 2.4, 0.3); },
      "mB.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.4),
      "mC.ask": (s, H) => write(s, H, ["a", "e"], 0, 0.3),
      "mC.div": (s, H) => { write(s, H, ["b"], 0); write(s, H, ["e2", "c"], 1.6, 0.4); },
      "mD.ask": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.35),
      "mD.ans": (s, H) => { write(s, H, ["e2", "c"], 0, 0.4); H.sound("ding", 0.6); },
      "mE.all": (s, H) => { write(s, H, ["a", "e", "c"], 0, 0.4); H.sound("ding", 1.0); },
      /* the margin */
      "sA.all": (s, H) => write(s, H, ["a", "b"], 0.6, 0.9),
      "sT.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["x", "n"], 1.4, 0.4); H.sound("warn", 1.4); },
      "sC.a": (s, H) => write(s, H, ["a"], 0),
      "sC.b": (s, H) => { write(s, H, ["b"], 0); H.sound("ding", 0.5); },

      /* method two */
      "r2.pct": (s, H) => write(s, H, ["p"], 0),
      "r2.frac": (s, H) => write(s, H, ["s", "e1", ...fracKeys("f")], 0, 0.35),
      "r2.cut": (s, H) => { write(s, H, ["fxs", "fxn", "fys", "fyn"], 0, 0.55); write(s, H, ["e2", ...fracKeys("q")], 2.4, 0.3); },
      "s2A.all": (s, H) => write(s, H, ["a", "b"], 0.6, 0.9),
      "eq.left": (s, H) => write(s, H, fracKeys("L"), 0, 0.35),
      /* forward, the bottom (the whole) is written first, so the "=" goes with it */
      "eq.sold": (s, H) => write(s, H, FWD ? ["Rn", "ws"] : ["eq", "Rn", "ws"], 0, 0.45),
      "eq.cost": (s, H) => write(s, H, FWD ? ["eq", "Rr", "Rd", "wc"] : ["Rr", "Rd", "wc"], 0, 0.45),
      "eq.underArc": (s, H) => H.draw(braceOf(s, "under"), 0),
      "eq.underX": (s, H) => write(s, H, ["xu"], 0),
      "eq.over": (s, H) => H.draw(braceOf(s, "over"), 0),
      "eq.overX": (s, H) => write(s, H, ["xo"], 0),
      "eq.under": (s, H) => { H.draw(braceOf(s, "under"), 0); write(s, H, ["xu"], 0.6); },
      "eq.ans": (s, H) => {
        const q = key(s, FWD ? "Rn" : "Rd");
        if (q) q.style.opacity = "0";
        write(s, H, ["ans"], 0.1);
        H.sound("ding", 0.5);
      },
      "s2B.all": (s, H) => write(s, H, ["a", "b"], 0, 0.9),
      "s2C.all": (s, H) => write(s, H, ["a", "b"], 0, 0.9),
    },
    /* EACH MARK WAITS FOR ITS WORDS (`cue`, film-kit cueAt), so a line re-worded in the film editor
       still draws on its word. One breath a step; `pause` is the silence after it. */
    steps: ({ push, look }) => cfg.steps({ push, look, BOXES }),
  });
}

/* ═══ 25% LOSS: FIND THE COST PRICE ═══════════════════════════════════════
   Scholastic 2022 first round, Q6. 47 steps: the user has re-worded them in
   the film editor, and the words are kept by step number. */
export function loss25() {
  return partWhole({
    N: 4, K: 3, known: 57000,
    question: "A computer set was sold for ₦57,000 at a loss of 25% on the cost price. Find the cost price.",
    labels: { part: "sold for 57,000", rest: "lost", whole: "cost price", money: "₦", wordTop: "sold", wordBottom: "bought" },
    box: { pct: 25, top: 1, bot: 4, by: 25 },
    frac: { top: "100\\% - 25\\% = 75\\%", pct: 75, by: 25 },
    trap: "\\tfrac14 \\times 57{,}000",
steps: ({ push, look, BOXES }) => {
    /* ── METHOD ONE: THE BOX METHOD ── */
    push("Someone bought a computer set.", { on: ["a1"], transition: "iris", pause: 0.5 });
    push("Later, they sold that same computer set... for fifty seven thousand naira.", { pause: 0.4 });
    push("But they did not make money. They actually sold it at a loss.", { pause: 0.6 });
    push("They lost twenty five percent. Twenty five percent of what they bought it for, you get?", { pause: 1 });
    push("So what they bought it for... that's the big number we don't know yet. That's the one we're hunting, right?",
      { pause: 0.8 });
    push("So picture it like this. One whole bar. That bar is what they bought it for.",
      { on: ["b0", "m1"], add: ["b0.bar", "b0.brace"], cue: { "b0.bar": "whole bar", "b0.brace": "bought it for" },
        transition: { kind: "card", title: "Method 1", sub: "The box method", hold: 1.6 }, pause: 0.5 });
    push("We don't know it yet, so let's just put a question mark inside it. Just like that.",
      { add: ["b0.q"], cue: { "b0.q": "question mark" }, pause: 1 });

    push("Now, twenty five percent. Twenty five out of a hundred... what is that, in a simpler way?",
      { on: ["mA"], add: ["mA.frac"], cue: { "mA.frac": "twenty five out of a hundred" }, pause: 1.6 });
    push("It's a quarter. One out of four.",
      { on: ["sA"], add: ["mA.cut", "sA.all"], cue: { "mA.cut": "quarter" }, pause: 0.6 });
    push("So I'm going to cut our bar into four equal boxes. Watch.", { off: ["mA", "sA"], pause: 0.5 });
    push("One cut... two cuts... three cuts.", { add: ["b0.cut"], cue: { "b0.cut": "one cut" }, pause: 0.6 });
    push("Four boxes now, all the same size. And each box is twenty five percent.",
      { on: ["b1"], off: ["b0"], add: ["b1.base", "b1.pct"], cue: { "b1.pct": "twenty five percent" }, pause: 0.8 });

    push("They lost twenty five percent. That's one box.",
      { on: ["b2"], off: ["b1"], add: ["b2.base", "b2.lose"], cue: { "b2.lose": "one box" }, pause: 0.5 });
    push("That box is gone. They never got it back.", { pause: 0.8 });
    push("Now wait. This is where people fall.", { pause: 0.7 });
    push("Some people will quickly take twenty five percent of fifty seven thousand. Don't do that.",
      { on: ["sT"], add: ["sT.all"], cue: { "sT.all": "twenty five percent of fifty seven thousand" }, pause: 0.6 });
    push("The loss is a quarter of what they bought it for. The big bar. Not a quarter of fifty seven thousand.",
      { look: look.mark("b2", "bar", BOXES - 1), lookAt: { lit: true, delay: 0.4, hold: 2.2 }, pause: 1 });
    push("So, what did they actually collect when they sold it?", { off: ["sT"], pause: 1.5 });
    push("The other three boxes. Just the three.", { add: ["b2.sold"], cue: { "b2.sold": "three" }, pause: 0.5 });
    push("And that's the fifty seven thousand. So fifty seven thousand is not the full bar. It's what is left after the loss.",
      { on: ["mB"], add: ["mB.all"], cue: { "mB.all": "fifty seven thousand" },
        look: look.brace("b2", "above-0-0"), lookAt: { lit: true, delay: 0.5, hold: 2.0 }, pause: 0.6 });
    push("Three boxes, fifty seven thousand. You follow me so far?", { pause: 1.4 });

    push("Now. If three boxes make fifty seven thousand... how much is one box?",
      { on: ["b3", "mC"], off: ["b2", "mB"], add: ["b3.base", "mC.ask"], cue: { "mC.ask": "one box" }, pause: 1.8 });
    push("We share fifty seven thousand into three. That's nineteen thousand.",
      { add: ["mC.div", "b3.one"], cue: { "mC.div": "fifty seven thousand", "b3.one": "nineteen thousand" }, pause: 0.6 });
    push("And all the boxes are the same size. So nineteen thousand, nineteen thousand, nineteen thousand... the lost one too.",
      { add: ["b3.rest"], cue: { "b3.rest": "so nineteen thousand" }, pause: 0.8 });
    push("And what they bought it for is the whole bar. All four boxes.",
      { on: ["mD"], off: ["mC"], add: ["mD.ask"], cue: { "mD.ask": "all four boxes" }, pause: 0.5 });
    push("Four times nineteen thousand... seventy six thousand.",
      { add: ["mD.ans"], cue: { "mD.ans": "seventy six thousand" }, pause: 0.8 });
    push("Let's check it. They lost one box, nineteen thousand. Seventy six thousand minus nineteen thousand...",
      { on: ["sC"], add: ["sC.a"], cue: { "sC.a": "seventy six thousand minus" }, pause: 0.4 });
    push("Fifty seven thousand. That's exactly the price in the question. It works.",
      { add: ["sC.b"], pause: 0.6 });
    push("So the answer is E. Seventy six thousand naira.",
      { on: ["mE"], off: ["mD", "sC"], add: ["mE.all"], cue: { "mE.all": "seventy six thousand" }, pause: 1.4 });

    /* ── METHOD TWO: EQUIVALENT FRACTIONS ── */
    push("Now let me show you another way. No boxes this time. Just fractions.",
      { on: ["m2"], off: ["b3", "mE", "m1"], transition: { kind: "card", title: "Method 2", sub: "Equivalent fractions", hold: 1.6 }, pause: 0.6 });
    push("They lost twenty five percent. So what part did they still get?", { pause: 1.5 });
    push("A hundred percent minus twenty five percent. Seventy five percent.",
      { on: ["r2"], add: ["r2.pct"], cue: { "r2.pct": "hundred percent" }, pause: 0.6 });
    push("Seventy five percent is seventy five over a hundred. We can make that smaller.",
      { add: ["r2.frac"], cue: { "r2.frac": "seventy five over a hundred" }, pause: 0.5 });
    push("Divide the top and the bottom by twenty five... and you get three over four. Three quarters.",
      { on: ["s2A"], add: ["r2.cut", "s2A.all"], cue: { "r2.cut": "divide", "s2A.all": "divide" }, pause: 0.6 });
    push("And look. It's the same thing as before. Three boxes out of four.", { pause: 0.8 });
    push("So, the selling price, over what they bought it for. Fifty seven thousand on top.",
      { on: ["eq"], off: ["r2", "s2A"], transition: "fade", add: ["eq.left", "eq.sold"],
        cue: { "eq.sold": "fifty seven thousand" }, pause: 0.4 });
    push("And underneath, what they bought it for. We don't know it, so... question mark.",
      { add: ["eq.cost"], cue: { "eq.cost": "question mark" }, pause: 0.5 });
    push("Top goes with top, bottom goes with bottom. You get?", { pause: 1 });
    push("Now these two fractions are equal. And to make equal fractions, you multiply the top and the bottom by the same number.",
      { pause: 0.6 });
    push("So look at the tops. Three becomes fifty seven thousand. Three times what?",
      { add: ["eq.over"], cue: { "eq.over": "three becomes" }, pause: 1.8 });
    push("Fifty seven thousand divided by three. Nineteen thousand.",
      { on: ["s2B"], add: ["s2B.all", "eq.overX"], cue: { "eq.overX": "nineteen thousand" }, pause: 0.5 });
    push("Same as one box, you see?", { pause: 0.9 });
    push("And whatever you do to the top, you must do to the bottom. Otherwise they won't be equal again.",
      { add: ["eq.under"], cue: { "eq.under": "to the bottom" }, pause: 0.6 });
    push("So four times nineteen thousand... seventy six thousand.",
      { on: ["s2C"], add: ["s2C.all", "eq.ans"], cue: { "s2C.all": "four times", "eq.ans": "seventy six thousand" }, pause: 0.6 });
    push("There's our question mark. Seventy six thousand naira. Same answer as the boxes.",
      { look: (stage) => stage.querySelector('[data-t="eq"] [data-k="ans"]'), lookAt: { lit: true, delay: 0.6, hold: 2.2 }, pause: 1 });
    push("So you see. Two ways, one answer. The boxes help you see it. The fractions say the same thing with numbers.",
      { pause: 0.8 });
    push("Just remember this one thing. A loss, or a profit, is always a part of what they bought it for. The whole bar. Don't forget it.");
  },
  });
}

/* ═══ 80% OF THE MARKS: FIND THE FULL MARKS ═══════════════════════════════
   Scholastic 2022 first round, Q8: "A boy who obtains 56 marks in a subject
   gets 80% of the total marks. What is the full marks of the subject?" */
export function score80() {
  return partWhole({
    N: 5, K: 4, known: 56,
    question: "A boy who obtains 56 marks in a subject gets 80% of the total marks. What is the full marks of the subject?",
    labels: { part: "got 56", rest: "missed", whole: "full marks", money: "", wordTop: "got", wordBottom: "full" },
    box: { pct: 80, top: 4, bot: 5, by: 20 },
    frac: { top: "\\text{he got } 80\\%", pct: 80, by: 20 },
    trap: "56 + 20\\%\\ \\text{of}\\ 56",
    steps: ({ push, look, BOXES }) => {
      /* ── METHOD ONE: THE BOX METHOD ── */
      push("A boy wrote an exam.", { on: ["a1"], transition: "iris", pause: 0.5 });
      push("He got fifty six marks.", { pause: 0.4 });
      push("And those fifty six marks are eighty percent of the full marks.", { pause: 0.6 });
      push("Not all of it. Eighty percent. So he missed some marks, right?", { pause: 1 });
      push("The question is... what were the full marks? That's the number we're hunting.", { pause: 0.8 });
      push("Picture it like this. One whole bar. That bar is the full marks.",
        { on: ["b0", "m1"], add: ["b0.bar", "b0.brace"], cue: { "b0.bar": "whole bar", "b0.brace": "full marks" },
          transition: { kind: "card", title: "Method 1", sub: "The box method", hold: 1.6 }, pause: 0.5 });
      push("We don't know it yet, so we put a question mark inside it.",
        { add: ["b0.q"], cue: { "b0.q": "question mark" }, pause: 1 });

      push("Now, eighty percent. Eighty out of a hundred... can we say that in a simpler way?",
        { on: ["mA"], add: ["mA.frac"], cue: { "mA.frac": "eighty out of a hundred" }, pause: 1.6 });
      push("Divide the top and the bottom by twenty. Four over five. Four fifths.",
        { on: ["sA"], add: ["mA.cut", "sA.all"], cue: { "mA.cut": "divide", "sA.all": "divide" }, pause: 0.6 });
      push("Four fifths means: cut the whole into five equal boxes, and he got four of them.", { off: ["mA", "sA"], pause: 0.6 });
      push("So, five equal boxes. One cut... two... three... four.", { add: ["b0.cut"], cue: { "b0.cut": "one cut" }, pause: 0.6 });
      push("Five boxes, all the same size. Each box is twenty percent.",
        { on: ["b1"], off: ["b0"], add: ["b1.base", "b1.pct"], cue: { "b1.pct": "twenty percent" }, pause: 0.8 });

      push("He got four of the boxes. Those four are his fifty six marks.",
        { on: ["b2"], off: ["b1"], add: ["b2.base", "b2.sold"], cue: { "b2.sold": "four of the boxes" }, pause: 0.5 });
      push("And this last box, he missed. Those are the marks he didn't get.",
        { add: ["b2.lose"], cue: { "b2.lose": "last box" }, pause: 0.8 });
      push("Now wait. This is where people fall.", { pause: 0.7 });
      push("Some people take twenty percent of fifty six and add it on. Don't do that.",
        { on: ["sT"], add: ["sT.all"], cue: { "sT.all": "twenty percent of fifty six" }, pause: 0.6 });
      push("The twenty percent is a part of the full marks. The big bar. Not a part of fifty six.",
        { look: look.mark("b2", "bar", BOXES - 1), lookAt: { lit: true, delay: 0.4, hold: 2.2 }, pause: 1 });
      push("So, four boxes make fifty six.",
        { on: ["mB"], off: ["sT"], add: ["mB.all"], cue: { "mB.all": "four boxes" },
          look: look.brace("b2", "above-0-0"), lookAt: { lit: true, delay: 0.5, hold: 2.0 }, pause: 0.6 });
      push("You follow me so far?", { pause: 1.4 });

      push("If four boxes make fifty six... how much is one box?",
        { on: ["b3", "mC"], off: ["b2", "mB"], add: ["b3.base", "mC.ask"], cue: { "mC.ask": "one box" }, pause: 1.8 });
      push("We share fifty six into four. That's fourteen.",
        { add: ["mC.div", "b3.one"], cue: { "mC.div": "fifty six", "b3.one": "fourteen" }, pause: 0.6 });
      push("And every box is the same size. So fourteen, fourteen, fourteen... and fourteen in the box he missed.",
        { add: ["b3.rest"], cue: { "b3.rest": "so fourteen" }, pause: 0.8 });
      push("The full marks are the whole bar. All five boxes.",
        { on: ["mD"], off: ["mC"], add: ["mD.ask"], cue: { "mD.ask": "all five boxes" }, pause: 0.5 });
      push("Five times fourteen... seventy.", { add: ["mD.ans"], cue: { "mD.ans": "seventy" }, pause: 0.8 });
      push("Let's check it. Seventy, minus the fourteen he missed...",
        { on: ["sC"], add: ["sC.a"], cue: { "sC.a": "seventy, minus" }, pause: 0.4 });
      push("Fifty six. That's his score. It works.", { add: ["sC.b"], pause: 0.6 });
      push("So the full marks are seventy. Option B.",
        { on: ["mE"], off: ["mD", "sC"], add: ["mE.all"], cue: { "mE.all": "seventy" }, pause: 1.4 });

      /* ── METHOD TWO: EQUIVALENT FRACTIONS ── */
      push("Now the same question with fractions. No boxes this time.",
        { on: ["m2"], off: ["b3", "mE", "m1"], transition: { kind: "card", title: "Method 2", sub: "Equivalent fractions", hold: 1.6 }, pause: 0.6 });
      push("He got eighty percent. As a fraction, that's eighty over a hundred.",
        { on: ["r2"], add: ["r2.pct", "r2.frac"], cue: { "r2.pct": "eighty percent", "r2.frac": "eighty over" }, pause: 0.5 });
      push("Divide the top and the bottom by twenty... four fifths.",
        { on: ["s2A"], add: ["r2.cut", "s2A.all"], cue: { "r2.cut": "divide", "s2A.all": "divide" }, pause: 0.6 });
      push("So four fifths of the full marks is fifty six. Let's write that as two fractions that are equal.", { pause: 0.6 });
      push("Four over five on this side.",
        { on: ["eq"], off: ["r2", "s2A"], transition: "fade", add: ["eq.left"], cue: { "eq.left": "four over five" }, pause: 0.4 });
      push("And on the other side, his marks over the full marks. Fifty six on top.",
        { add: ["eq.sold"], cue: { "eq.sold": "fifty six on top" }, pause: 0.4 });
      push("The full marks we don't know. So... question mark.",
        { add: ["eq.cost"], cue: { "eq.cost": "question mark" }, pause: 0.6 });
      push("To keep two fractions equal, you multiply the top and the bottom by the same number.", { pause: 0.6 });
      push("Look at the tops. Four becomes fifty six. Four times what?",
        { add: ["eq.over"], cue: { "eq.over": "four becomes" }, pause: 1.8 });
      push("Fifty six divided by four. Fourteen.",
        { on: ["s2B"], add: ["s2B.all", "eq.overX"], cue: { "eq.overX": "fourteen" }, pause: 0.5 });
      push("Same as one box, you see?", { pause: 0.9 });
      push("So the bottom is multiplied by fourteen too.",
        { add: ["eq.under"], cue: { "eq.under": "bottom" }, pause: 0.6 });
      push("Five times fourteen... seventy.",
        { on: ["s2C"], add: ["s2C.all", "eq.ans"], cue: { "s2C.all": "five times", "eq.ans": "seventy" }, pause: 0.6 });
      push("There's our question mark. Seventy marks. Same answer as the boxes.",
        { look: (stage) => stage.querySelector('[data-t="eq"] [data-k="ans"]'), lookAt: { lit: true, delay: 0.6, hold: 2.2 }, pause: 1 });
      push("Two ways, one answer. And remember: the eighty percent is a part of the full marks, never a part of the fifty six.");
    },
  });
}

/* ═══ 90% OF THE MARKS: FIND THE FULL MARKS ═══════════════════════════════
   Scholastic upper primary, 4th edition first round, Q10: "A boy who obtains
   72 marks in a subject gets 90% of the total marks. What is the full marks?" */
export function score90() {
  return partWhole({
    N: 10, K: 9, known: 72,
    question: "A boy who obtains 72 marks in a subject gets 90% of the total marks. What is the full marks of the subject?",
    labels: { part: "got 72", rest: "missed", whole: "full marks", money: "", wordTop: "got", wordBottom: "full" },
    box: { pct: 90, top: 9, bot: 10, by: 10 },
    frac: { top: "\\text{he got } 90\\%", pct: 90, by: 10 },
    trap: "72 + 10\\%\\ \\text{of}\\ 72",
    steps: ({ push, look, BOXES }) => {
      push("A boy wrote an exam.", { on: ["a1"], transition: "iris", pause: 0.5 });
      push("He got seventy two marks.", { pause: 0.4 });
      push("And those seventy two marks are ninety percent of the full marks.", { pause: 0.6 });
      push("Nearly all of it, but not all. So he missed a few marks, right?", { pause: 1 });
      push("The question is... what were the full marks? That's the number we're hunting.", { pause: 0.8 });
      push("Picture it like this. One whole bar. That bar is the full marks.",
        { on: ["b0", "m1"], add: ["b0.bar", "b0.brace"], cue: { "b0.bar": "whole bar", "b0.brace": "full marks" },
          transition: { kind: "card", title: "Method 1", sub: "The box method", hold: 1.6 }, pause: 0.5 });
      push("We don't know it yet, so we put a question mark inside it.",
        { add: ["b0.q"], cue: { "b0.q": "question mark" }, pause: 1 });
      push("Now, ninety percent. Ninety out of a hundred... can we say that in a simpler way?",
        { on: ["mA"], add: ["mA.frac"], cue: { "mA.frac": "ninety out of a hundred" }, pause: 1.6 });
      push("Divide the top and the bottom by ten. Nine over ten. Nine tenths.",
        { on: ["sA"], add: ["mA.cut", "sA.all"], cue: { "mA.cut": "divide", "sA.all": "divide" }, pause: 0.6 });
      push("Nine tenths means: cut the whole into ten equal boxes, and he got nine of them.", { off: ["mA", "sA"], pause: 0.6 });
      push("So, ten equal boxes. Watch the cuts.", { add: ["b0.cut"], cue: { "b0.cut": "watch" }, pause: 0.8 });
      push("Ten boxes, all the same size. Each box is ten percent.",
        { on: ["b1"], off: ["b0"], add: ["b1.base", "b1.pct"], cue: { "b1.pct": "ten percent" }, pause: 0.8 });
      push("He got nine of the boxes. Those nine are his seventy two marks.",
        { on: ["b2"], off: ["b1"], add: ["b2.base", "b2.sold"], cue: { "b2.sold": "nine of the boxes" }, pause: 0.5 });
      push("And this last box, he missed.", { add: ["b2.lose"], cue: { "b2.lose": "last box" }, pause: 0.8 });
      push("Now wait. This is where people fall.", { pause: 0.7 });
      push("Some people take ten percent of seventy two and add it on. Don't do that.",
        { on: ["sT"], add: ["sT.all"], cue: { "sT.all": "ten percent of seventy two" }, pause: 0.6 });
      push("The ten percent is a part of the full marks. The big bar. Not a part of seventy two.",
        { look: look.mark("b2", "bar", BOXES - 1), lookAt: { lit: true, delay: 0.4, hold: 2.2 }, pause: 1 });
      push("So, nine boxes make seventy two.",
        { on: ["mB"], off: ["sT"], add: ["mB.all"], cue: { "mB.all": "nine boxes" },
          look: look.brace("b2", "above-0-0"), lookAt: { lit: true, delay: 0.5, hold: 2.0 }, pause: 0.6 });
      push("You follow me so far?", { pause: 1.4 });
      push("If nine boxes make seventy two... how much is one box?",
        { on: ["b3", "mC"], off: ["b2", "mB"], add: ["b3.base", "mC.ask"], cue: { "mC.ask": "one box" }, pause: 1.8 });
      push("We share seventy two into nine. That's eight.",
        { add: ["mC.div", "b3.one"], cue: { "mC.div": "seventy two", "b3.one": "eight" }, pause: 0.6 });
      push("And every box is the same size, so every box is eight. Even the one he missed.",
        { add: ["b3.rest"], cue: { "b3.rest": "every box is eight" }, pause: 0.8 });
      push("The full marks are the whole bar. All ten boxes.",
        { on: ["mD"], off: ["mC"], add: ["mD.ask"], cue: { "mD.ask": "all ten boxes" }, pause: 0.5 });
      push("Ten times eight... eighty.", { add: ["mD.ans"], cue: { "mD.ans": "eighty" }, pause: 0.8 });
      push("Let's check it. Eighty, minus the eight he missed...",
        { on: ["sC"], add: ["sC.a"], cue: { "sC.a": "eighty, minus" }, pause: 0.4 });
      push("Seventy two. That's his score. It works.", { add: ["sC.b"], pause: 0.6 });
      push("So the full marks are eighty.",
        { on: ["mE"], off: ["mD", "sC"], add: ["mE.all"], cue: { "mE.all": "eighty" }, pause: 1.4 });
      push("Now the same question with fractions. No boxes this time.",
        { on: ["m2"], off: ["b3", "mE", "m1"], transition: { kind: "card", title: "Method 2", sub: "Equivalent fractions", hold: 1.6 }, pause: 0.6 });
      push("He got ninety percent. As a fraction, that's ninety over a hundred.",
        { on: ["r2"], add: ["r2.pct", "r2.frac"], cue: { "r2.pct": "ninety percent", "r2.frac": "ninety over" }, pause: 0.5 });
      push("Divide the top and the bottom by ten... nine tenths.",
        { on: ["s2A"], add: ["r2.cut", "s2A.all"], cue: { "r2.cut": "divide", "s2A.all": "divide" }, pause: 0.6 });
      push("So nine tenths of the full marks is seventy two. Two fractions that are equal.", { pause: 0.6 });
      push("Nine over ten on this side.",
        { on: ["eq"], off: ["r2", "s2A"], transition: "fade", add: ["eq.left"], cue: { "eq.left": "nine over ten" }, pause: 0.4 });
      push("And on the other side, his marks over the full marks. Seventy two on top.",
        { add: ["eq.sold"], cue: { "eq.sold": "seventy two on top" }, pause: 0.4 });
      push("The full marks we don't know. So... question mark.", { add: ["eq.cost"], cue: { "eq.cost": "question mark" }, pause: 0.6 });
      push("To keep two fractions equal, you multiply the top and the bottom by the same number.", { pause: 0.6 });
      push("Look at the tops. Nine becomes seventy two. Nine times what?", { add: ["eq.over"], cue: { "eq.over": "nine becomes" }, pause: 1.8 });
      push("Seventy two divided by nine. Eight.", { on: ["s2B"], add: ["s2B.all", "eq.overX"], cue: { "eq.overX": "eight" }, pause: 0.5 });
      push("Same as one box, you see?", { pause: 0.9 });
      push("So the bottom is multiplied by eight too.", { add: ["eq.under"], cue: { "eq.under": "bottom" }, pause: 0.6 });
      push("Ten times eight... eighty.",
        { on: ["s2C"], add: ["s2C.all", "eq.ans"], cue: { "s2C.all": "ten times", "eq.ans": "eighty" }, pause: 0.6 });
      push("There's our question mark. Eighty marks. Same answer as the boxes.",
        { look: (stage) => stage.querySelector('[data-t="eq"] [data-k="ans"]'), lookAt: { lit: true, delay: 0.6, hold: 2.2 }, pause: 1 });
      push("Two ways, one answer. The ninety percent is a part of the full marks, never a part of the seventy two.");
    },
  });
}

/* ═══ SOLD AT A 20% PROFIT: FIND THE COST PRICE ════════════════════════════
   Scholastic upper primary, 4th edition first round, Q15: "Laura sold a shirt
   at the rate of 1200 and made a profit of 20%. What was the cost price?"
   The part is MORE than the whole: the bar grows past the cost by one box. */
export function profit20() {
  return partWhole({
    N: 5, K: 6, known: 1200,
    question: "Laura sold a shirt at the rate of ₦1200 and made a profit of 20%. What was the cost price?",
    labels: { part: "sold for 1,200", rest: "profit", whole: "cost price", money: "₦", wordTop: "sold", wordBottom: "cost" },
    box: { pct: 20, top: 1, bot: 5, by: 20 },
    frac: { top: "100\\% + 20\\% = 120\\%", pct: 120, by: 20 },
    trap: "1{,}200 - 20\\%\\ \\text{of}\\ 1{,}200",
    steps: ({ push, look }) => {
      push("Laura bought a shirt.", { on: ["a1"], transition: "iris", pause: 0.5 });
      push("Then she sold it for one thousand two hundred naira.", { pause: 0.4 });
      push("And she made money on it. A profit of twenty percent.", { pause: 0.6 });
      push("Twenty percent of what she paid for it, you get?", { pause: 1 });
      push("So what she paid... the cost price. That's the number we're hunting.", { pause: 0.8 });
      push("Picture it like this. One whole bar. That bar is what she paid for the shirt.",
        { on: ["b0", "m1"], add: ["b0.bar", "b0.brace"], cue: { "b0.bar": "whole bar", "b0.brace": "what she paid" },
          transition: { kind: "card", title: "Method 1", sub: "The box method", hold: 1.6 }, pause: 0.5 });
      push("We don't know it yet, so we put a question mark inside it.", { add: ["b0.q"], cue: { "b0.q": "question mark" }, pause: 1 });
      push("Now, twenty percent. Twenty out of a hundred... what is that, in a simpler way?",
        { on: ["mA"], add: ["mA.frac"], cue: { "mA.frac": "twenty out of a hundred" }, pause: 1.6 });
      push("Divide the top and the bottom by twenty. One fifth.",
        { on: ["sA"], add: ["mA.cut", "sA.all"], cue: { "mA.cut": "divide", "sA.all": "divide" }, pause: 0.6 });
      push("So we cut what she paid into five equal boxes.", { off: ["mA", "sA"], pause: 0.5 });
      push("One cut... two... three... four.", { add: ["b0.cut"], cue: { "b0.cut": "one cut" }, pause: 0.6 });
      push("Five boxes, all the same size. Each box is twenty percent.",
        { on: ["b1"], off: ["b0"], add: ["b1.base", "b1.pct"], cue: { "b1.pct": "twenty percent" }, pause: 0.8 });
      push("Now the profit. She made twenty percent more. That's one more box.",
        { on: ["b2"], off: ["b1"], add: ["b2.base", "b2.lose"], cue: { "b2.lose": "one more box" }, pause: 0.6 });
      push("So she sold it for all six boxes. Five for what she paid, and one for her profit.",
        { add: ["b2.sold"], cue: { "b2.sold": "all six boxes" }, pause: 0.8 });
      push("Now wait. This is where people fall.", { pause: 0.7 });
      push("Some people take twenty percent of one thousand two hundred and take it away. Don't do that.",
        { on: ["sT"], add: ["sT.all"], cue: { "sT.all": "twenty percent of one thousand two hundred" }, pause: 0.6 });
      push("The profit is twenty percent of what she paid. Not twenty percent of the selling price.",
        { look: (stage) => stage.querySelectorAll('[data-t="b2"] [data-mb="bar"]')[5], lookAt: { lit: true, delay: 0.4, hold: 2.2 }, pause: 1 });
      push("So, six boxes make one thousand two hundred.",
        { on: ["mB"], off: ["sT"], add: ["mB.all"], cue: { "mB.all": "six boxes" },
          look: look.brace("b2", "above-0-0"), lookAt: { lit: true, delay: 0.5, hold: 2.0 }, pause: 0.6 });
      push("You follow me so far?", { pause: 1.4 });
      push("If six boxes make one thousand two hundred... how much is one box?",
        { on: ["b3", "mC"], off: ["b2", "mB"], add: ["b3.base", "mC.ask"], cue: { "mC.ask": "one box" }, pause: 1.8 });
      push("We share one thousand two hundred into six. That's two hundred.",
        { add: ["mC.div", "b3.one"], cue: { "mC.div": "one thousand two hundred", "b3.one": "two hundred" }, pause: 0.6 });
      push("And every box is the same size. So two hundred in every box. The profit box too.",
        { add: ["b3.rest"], cue: { "b3.rest": "so two hundred" }, pause: 0.8 });
      push("What she paid is the first five boxes.",
        { on: ["mD"], off: ["mC"], add: ["mD.ask"], cue: { "mD.ask": "five boxes" }, pause: 0.5 });
      push("Five times two hundred... one thousand.", { add: ["mD.ans"], cue: { "mD.ans": "one thousand" }, pause: 0.8 });
      push("Let's check it. One thousand, plus the two hundred profit...",
        { on: ["sC"], add: ["sC.a"], cue: { "sC.a": "one thousand, plus" }, pause: 0.4 });
      push("One thousand two hundred. That's the selling price. It works.", { add: ["sC.b"], pause: 0.6 });
      push("So the cost price is one thousand naira.",
        { on: ["mE"], off: ["mD", "sC"], add: ["mE.all"], cue: { "mE.all": "one thousand naira" }, pause: 1.4 });
      push("Now the same question with fractions.",
        { on: ["m2"], off: ["b3", "mE", "m1"], transition: { kind: "card", title: "Method 2", sub: "Equivalent fractions", hold: 1.6 }, pause: 0.6 });
      push("She made a profit of twenty percent. So she sold it for a hundred and twenty percent of what she paid.",
        { on: ["r2"], add: ["r2.pct"], cue: { "r2.pct": "a hundred and twenty percent" }, pause: 0.6 });
      push("A hundred and twenty over a hundred.", { add: ["r2.frac"], cue: { "r2.frac": "a hundred and twenty over" }, pause: 0.5 });
      push("Divide the top and the bottom by twenty... six fifths.",
        { on: ["s2A"], add: ["r2.cut", "s2A.all"], cue: { "r2.cut": "divide", "s2A.all": "divide" }, pause: 0.6 });
      push("Six fifths of what she paid is one thousand two hundred. Two fractions that are equal.", { pause: 0.6 });
      push("Six over five on this side.",
        { on: ["eq"], off: ["r2", "s2A"], transition: "fade", add: ["eq.left"], cue: { "eq.left": "six over five" }, pause: 0.4 });
      push("And on the other side, the selling price over the cost price. One thousand two hundred on top.",
        { add: ["eq.sold"], cue: { "eq.sold": "one thousand two hundred on top" }, pause: 0.4 });
      push("The cost price we don't know. So... question mark.", { add: ["eq.cost"], cue: { "eq.cost": "question mark" }, pause: 0.6 });
      push("Look at the tops. Six becomes one thousand two hundred. Six times what?", { add: ["eq.over"], cue: { "eq.over": "six becomes" }, pause: 1.8 });
      push("One thousand two hundred divided by six. Two hundred.",
        { on: ["s2B"], add: ["s2B.all", "eq.overX"], cue: { "eq.overX": "two hundred." }, pause: 0.5 });
      push("Same as one box, you see? So the bottom is multiplied by two hundred too.",
        { add: ["eq.under"], cue: { "eq.under": "bottom" }, pause: 0.6 });
      push("Five times two hundred... one thousand.",
        { on: ["s2C"], add: ["s2C.all", "eq.ans"], cue: { "s2C.all": "five times", "eq.ans": "one thousand" }, pause: 0.6 });
      push("There's our question mark. One thousand naira. Same answer as the boxes.",
        { look: (stage) => stage.querySelector('[data-t="eq"] [data-k="ans"]'), lookAt: { lit: true, delay: 0.6, hold: 2.2 }, pause: 1 });
      push("Two ways, one answer. A profit, like a loss, is always a part of what was paid. The whole bar.");
    },
  });
}

/* ═══ THE FORWARD FILMS: THE WHOLE IS KNOWN, FIND THE NEW AMOUNT ═══════════
   A price after a loss, a profit, a discount or a withdrawal. One narration,
   written once, that each question fills with its own story and numbers:

     story   [three opening lines]
     W, P, U the whole, the answer and one box, as they are SAID ("165,500")
     pct     the percentage; N, K boxes in the whole, boxes in the answer; by what divides 100
     restLine, partLine   what happens to the boxes (a box lost, a box gained)
     trapLine, trapCue    the wrong move, struck in the margin
     r2Line   method two's first line (says the percentage of the whole kept)
   ------------------------------------------------------------------------*/
function forwardFilm(c) {
  const { N, K, by } = c;
  const word = (n) => String(n);
  const pctBox = 100 / N;
  return partWhole({
    forward: true, N, K, whole: c.whole,
    question: c.question, labels: c.labels,
    box: { pct: c.pct, top: c.boxTop, bot: c.boxBot, by: c.boxBy },
    frac: { top: c.fracTop, pct: c.keepPct, by },
    trap: c.trap,
    steps: ({ push }) => {
      push(c.story[0], { on: ["a1"], transition: "iris", pause: 0.5 });
      push(c.story[1], { pause: 0.5 });
      push(c.story[2], { pause: 0.8 });
      push(`So we know the whole: ${c.W}. What we want is ${c.want}.`, { pause: 0.8 });
      push(`Picture ${c.wholePhrase} as one whole bar. ${c.W}.`,
        { on: ["b0", "m1"], add: ["b0.bar", "b0.brace", "b0.q"], cue: { "b0.bar": "whole bar", "b0.q": `${c.W}.` },
          transition: { kind: "card", title: "Method 1", sub: "The box method", hold: 1.6 }, pause: 0.6 });
      push(`Now, ${c.pct} percent. ${c.pct} out of a hundred... how do we say that more simply?`,
        { on: ["mA"], add: ["mA.frac"], cue: { "mA.frac": `${c.pct} out of a hundred` }, pause: 1.6 });
      push(`Divide the top and the bottom by ${c.boxBy}. ${c.boxTop} over ${c.boxBot}.`,
        { on: ["sA"], add: ["mA.cut", "sA.all"], cue: { "mA.cut": "divide", "sA.all": "divide" }, pause: 0.6 });
      push(`So we cut the bar into ${word(N)} equal boxes.`, { off: ["mA", "sA"], pause: 0.4 });
      push("Watch the cuts.", { add: ["b0.cut"], cue: { "b0.cut": "watch" }, pause: 0.8 });
      push(`${word(N)} boxes, all the same size. Each box is ${pctBox} percent.`,
        { on: ["b1"], off: ["b0"], add: ["b1.base", "b1.pct"], cue: { "b1.pct": `${pctBox} percent` }, pause: 0.8 });
      push(`All ${word(N)} boxes together make ${c.W}.`, { on: ["mB"], add: ["mB.all"], cue: { "mB.all": "together" }, pause: 0.6 });
      push("So how much is one box?", { pause: 1.6 });
      push(`${c.W} shared into ${word(N)}. That's ${c.U}.`,
        { on: ["b3", "mC"], off: ["b1", "mB"], add: ["b3.bare", "mC.ask", "mC.div", "b3.one"],
          cue: { "mC.div": "shared", "b3.one": `that's ${c.U}` }, pause: 0.6 });
      push(`And every box is the same size. So every box is ${c.U}.`,
        { add: ["b3.fill"], cue: { "b3.fill": "every box is" }, pause: 0.8 });
      push(c.restLine, { add: ["b3.away"], cue: { "b3.away": c.restCue }, pause: 0.8 });
      push(c.partLine, { add: ["b3.part"], cue: { "b3.part": c.partCue }, pause: 0.8 });
      push("Now wait. This is where people fall.", { pause: 0.7 });
      push(c.trapLine, { on: ["sT"], add: ["sT.all"], cue: { "sT.all": c.trapCue }, pause: 1 });
      push(c.timesLine || `So, ${word(K)} boxes. ${word(K)} times ${c.U}...`,
        { on: ["mD"], off: ["mC", "sT"], add: ["mD.ask"], cue: { "mD.ask": "times" }, pause: 0.5 });
      push(`${c.P}.`, { add: ["mD.ans"], pause: 0.8 });
      push(`Let's check it. ${c.checkLine}`, { on: ["sC"], add: ["sC.a"], cue: { "sC.a": "check" }, pause: 0.5 });
      push(`${c.W}. That's where we started. It works.`, { add: ["sC.b"], pause: 0.6 });
      push(c.answerLine, { on: ["mE"], off: ["mD", "sC"], add: ["mE.all"], cue: { "mE.all": c.P }, pause: 1.4 });

      push("Now the same question with fractions.",
        { on: ["m2"], off: ["b3", "mE", "m1"], transition: { kind: "card", title: "Method 2", sub: "Equivalent fractions", hold: 1.6 }, pause: 0.6 });
      push(c.r2Line, { on: ["r2"], add: ["r2.pct", "r2.frac"], cue: { "r2.frac": "over a hundred" }, pause: 0.6 });
      push(`Divide the top and the bottom by ${by}... ${word(K)} over ${word(N)}.`,
        { on: ["s2A"], add: ["r2.cut", "s2A.all"], cue: { "r2.cut": "divide", "s2A.all": "divide" }, pause: 0.6 });
      push(`${word(K)} over ${word(N)} is the same as ${c.newPhrase} over ${c.wholePhrase}.`,
        { on: ["eq"], off: ["r2", "s2A"], transition: "fade", add: ["eq.left"], cue: { "eq.left": `${word(K)} over ${word(N)}` }, pause: 0.6 });
      push(`${c.wholeCap} goes underneath. ${c.W}.`, { add: ["eq.cost"], cue: { "eq.cost": "underneath" }, pause: 0.5 });
      push(`${c.newCap}, we don't know. So... question mark on top.`, { add: ["eq.sold"], cue: { "eq.sold": "question mark" }, pause: 0.6 });
      push(`Look at the bottoms. ${word(N)} becomes ${c.W}. ${word(N)} times what?`,
        { add: ["eq.underArc"], cue: { "eq.underArc": "becomes" }, pause: 1.8 });
      push(`${c.W} divided by ${word(N)}. ${c.U}.`, { on: ["s2B"], add: ["s2B.all", "eq.underX"], cue: { "eq.underX": `${c.U}.` }, pause: 0.6 });
      push(`Same as one box, you see? So the top is multiplied by ${c.U} too.`, { add: ["eq.over", "eq.overX"], cue: { "eq.over": "top", "eq.overX": "top" }, pause: 0.6 });
      push(`${word(K)} times ${c.U}... ${c.P}.`,
        { on: ["s2C"], add: ["s2C.all", "eq.ans"], cue: { "s2C.all": "times", "eq.ans": `${c.P}.` }, pause: 0.6 });
      push(`There's our question mark. ${c.P}. Same answer as the boxes.`,
        { look: (stage) => stage.querySelector('[data-t="eq"] [data-k="ans"]'), lookAt: { lit: true, delay: 0.6, hold: 2.2 }, pause: 1 });
      push(c.closing);
    },
  });
}

/* Junior Secondary, 2nd edition first round, Q40 */
export const ps4Loss = () => forwardFilm({
  question: "Emeka bought a PS4 for ₦165,500. He sold it to Kelechi at a 20% loss. What did Kelechi pay?",
  whole: 165500, N: 5, K: 4, by: 20, pct: 20, boxTop: 1, boxBot: 5, boxBy: 20, keepPct: 80,
  W: "165,500", U: "33,100", P: "132,400",
  labels: { part: "Kelechi paid", rest: "loss", whole: "Emeka paid", answer: "Kelechi paid", money: "₦", wordTop: "sold", wordBottom: "bought" },
  fracTop: "100\\% - 20\\% = 80\\%", trap: "165{,}500 - 20",
  story: ["Emeka bought a PS4 for 165,500 naira.", "He sold it to Kelechi, at a loss of twenty percent.", "So Kelechi paid less than Emeka did. How much less?"],
  want: "what Kelechi paid", wholePhrase: "what Emeka paid", wholeCap: "What Emeka paid", newPhrase: "what Kelechi paid", newCap: "What Kelechi paid",
  restLine: "Emeka lost twenty percent. That's one box gone.", restCue: "one box",
  partLine: "So Kelechi paid for the other four boxes.", partCue: "other four",
  trapLine: "Some people take twenty away from 165,500. Twenty naira? No. It's twenty percent, one whole box.", trapCue: "take twenty away",
  checkLine: "132,400, plus the one box Emeka lost, 33,100...",
  answerLine: "So Kelechi paid 132,400 naira.",
  r2Line: "Emeka lost twenty percent, so Kelechi paid eighty percent of it. Eighty over a hundred.",
  closing: "Two ways, one answer. A loss is a part of what was paid first. Take the boxes away from the whole bar.",
});

/* Junior Secondary, 3rd edition first round, Q7 */
export const bikeProfit20 = () => forwardFilm({
  question: "Rohan bought a bike for $75000. He wants to sell it making a 20% profit. What is the selling price of the bike?",
  whole: 75000, N: 5, K: 6, by: 20, pct: 20, boxTop: 1, boxBot: 5, boxBy: 20, keepPct: 120,
  W: "75,000", U: "15,000", P: "90,000",
  labels: { part: "selling price", rest: "profit", whole: "cost price", answer: "selling price", money: "$", wordTop: "sell", wordBottom: "cost" },
  fracTop: "100\\% + 20\\% = 120\\%", trap: "75{,}000 + 20",
  story: ["Rohan bought a bike for 75,000 dollars.", "He wants to sell it, and make a profit of twenty percent.", "So he'll sell it for more than he paid. How much more?"],
  want: "the selling price", wholePhrase: "what he paid", wholeCap: "What he paid", newPhrase: "the selling price", newCap: "The selling price",
  restLine: "A profit of twenty percent is one more box. It grows on past what he paid.", restCue: "one more box",
  partLine: "So he sells it for all six boxes.", partCue: "all six",
  trapLine: "Some people add twenty to 75,000. Twenty dollars? No. It's twenty percent, one whole box.", trapCue: "add twenty",
  checkLine: "90,000, take away the profit box, 15,000...",
  answerLine: "So the selling price is 90,000 dollars.",
  r2Line: "A profit of twenty percent means he sells it for a hundred and twenty percent of what he paid. A hundred and twenty over a hundred.",
  closing: "Two ways, one answer. A profit is a part of what was paid. It grows the bar by that many boxes.",
});

/* Junior Secondary, 5th edition first round, Q28 */
export const bikeProfit10 = () => forwardFilm({
  question: "Fubara bought a bike for ₦200000. He wants to sell it making a 10% profit. What is the selling price of the bike?",
  whole: 200000, N: 10, K: 11, by: 10, pct: 10, boxTop: 1, boxBot: 10, boxBy: 10, keepPct: 110,
  W: "200,000", U: "20,000", P: "220,000",
  labels: { part: "selling price", rest: "profit", whole: "cost price", answer: "selling price", money: "₦", wordTop: "sell", wordBottom: "cost" },
  fracTop: "100\\% + 10\\% = 110\\%", trap: "200{,}000 + 10",
  story: ["Fubara bought a bike for 200,000 naira.", "He wants to sell it, and make a profit of ten percent.", "So he'll sell it for more than he paid. How much more?"],
  want: "the selling price", wholePhrase: "what he paid", wholeCap: "What he paid", newPhrase: "the selling price", newCap: "The selling price",
  restLine: "A profit of ten percent is one more box. It grows on past what he paid.", restCue: "one more box",
  partLine: "So he sells it for all eleven boxes.", partCue: "all eleven",
  trapLine: "Some people add ten to 200,000. Ten naira? No. It's ten percent, one whole box.", trapCue: "add ten",
  checkLine: "220,000, take away the profit box, 20,000...",
  answerLine: "So the selling price is 220,000 naira.",
  r2Line: "A profit of ten percent means he sells it for a hundred and ten percent of what he paid. A hundred and ten over a hundred.",
  closing: "Two ways, one answer. A profit is a part of what was paid. It grows the bar by that many boxes.",
});

/* Upper Primary, 2022 finals, Q45 */
export const shoeDiscount = () => forwardFilm({
  question: "If a shoe cost $20 and is reduced by 20%, how much will the new price be?",
  whole: 20, N: 5, K: 4, by: 20, pct: 20, boxTop: 1, boxBot: 5, boxBy: 20, keepPct: 80,
  W: "20", U: "4", P: "16",
  labels: { part: "new price", rest: "taken off", whole: "old price", answer: "new price", money: "$", wordTop: "new", wordBottom: "old" },
  fracTop: "100\\% - 20\\% = 80\\%", trap: "20 - 20 = 0",
  story: ["A shoe costs twenty dollars.", "The price is reduced by twenty percent.", "So the new price is less. How much is it?"],
  want: "the new price", wholePhrase: "the old price", wholeCap: "The old price", newPhrase: "the new price", newCap: "The new price",
  restLine: "Reduced by twenty percent. That's one box taken off.", restCue: "one box",
  partLine: "So the new price is the other four boxes.", partCue: "other four",
  trapLine: "Some people take twenty from twenty and get nothing. A free shoe? No. It's twenty percent, one box.", trapCue: "take twenty from twenty",
  checkLine: "16, plus the box taken off, 4...",
  answerLine: "So the new price is 16 dollars.",
  r2Line: "Reduced by twenty percent, so the new price is eighty percent of the old one. Eighty over a hundred.",
  closing: "Two ways, one answer. A reduction is a part of the old price. Take those boxes off the whole bar.",
});

/* Upper Primary, 2025 first round, Q29 */
export const withdraw10 = () => forwardFilm({
  question: "You had $10,000.00 in your account, you withdrew 10% of your current balance. How much money is your new balance?",
  whole: 10000, N: 10, K: 9, by: 10, pct: 10, boxTop: 1, boxBot: 10, boxBy: 10, keepPct: 90,
  W: "10,000", U: "1,000", P: "9,000",
  labels: { part: "new balance", rest: "withdrawn", whole: "old balance", answer: "new balance", money: "$", wordTop: "new", wordBottom: "old" },
  fracTop: "100\\% - 10\\% = 90\\%", trap: "10{,}000 - 10",
  story: ["You had 10,000 dollars in your account.", "You took out ten percent of it.", "So how much is left in the account?"],
  want: "the new balance", wholePhrase: "the old balance", wholeCap: "The old balance", newPhrase: "the new balance", newCap: "The new balance",
  restLine: "You took out ten percent. That's one box.", restCue: "one box",
  partLine: "So what's left is the other nine boxes.", partCue: "other nine",
  trapLine: "Some people take ten dollars away. No. It's ten percent, one whole box.", trapCue: "ten dollars",
  checkLine: "9,000, plus the box you took out, 1,000...",
  answerLine: "So the new balance is 9,000 dollars.",
  r2Line: "You took out ten percent, so ninety percent is left. Ninety over a hundred.",
  closing: "Two ways, one answer. Ten percent is one box of the whole. Take it off, and count what's left.",
});

/* ANMC upper primary, 15th edition first round, Q19: the answer is what is LEFT, so the one box
   left is the part, and the four boxes read are the rest */
export const pagesLeft = () => forwardFilm({
  question: "Tom is reading a 600 page book. He has read 80%. How many pages are left?",
  whole: 600, N: 5, K: 1, by: 20, pct: 80, boxTop: 4, boxBot: 5, boxBy: 20, keepPct: 20,
  W: "600", U: "120", P: "120",
  labels: { part: "left", rest: "read", whole: "the book", answer: "pages left", money: "", suffix: "pages", wordTop: "left", wordBottom: "book" },
  fracTop: "100\\% - 80\\% = 20\\%", trap: "80\\%\\ \\text{of}\\ 600 = 480",
  story: ["Tom is reading a book. It has 600 pages.", "He has read eighty percent of it.", "So how many pages are left for him to read?"],
  want: "the pages left", wholePhrase: "the whole book", wholeCap: "The whole book", newPhrase: "the pages left", newCap: "The pages left",
  restLine: "He has read eighty percent. That's four boxes. Those pages are done.", restCue: "four boxes",
  partLine: "So the pages left are the one box that's left.", partCue: "one box",
  trapLine: "Some people find eighty percent of 600, get 480, and stop. That's the pages he read, not the pages left.", trapCue: "eighty percent of 600",
  timesLine: "So the pages left are one box...",
  checkLine: "120 left, plus the 480 he read...",
  answerLine: "So there are 120 pages left.",
  r2Line: "He read eighty percent, so twenty percent is left. Twenty over a hundred.",
  closing: "Two ways, one answer. Read the question to the end: it asked for the pages left, not the pages read.",
});

/* Upper primary, 2022 finals, Q37: a profit of three boxes, on a box of 5.5 kobo */
export const hatProfit30 = () => forwardFilm({
  question: "A hat cost me 55 kobo. At what price must I sell it to make a profit of 30%?",
  whole: 55, N: 10, K: 13, by: 10, pct: 30, boxTop: 3, boxBot: 10, boxBy: 10, keepPct: 130,
  W: "55", U: "5.5", P: "71.5",
  labels: { part: "selling price", rest: "profit", whole: "cost price", answer: "selling price", money: "", suffix: "kobo", wordTop: "sell", wordBottom: "cost" },
  fracTop: "100\\% + 30\\% = 130\\%", trap: "55 + 30 = 85",
  story: ["A hat cost fifty five kobo.", "We want to sell it and make a profit of thirty percent.", "So what price do we sell it for?"],
  want: "the selling price", wholePhrase: "what the hat cost", wholeCap: "What the hat cost", newPhrase: "the selling price", newCap: "The selling price",
  restLine: "A profit of thirty percent is three more boxes. They grow on past what it cost.", restCue: "three more boxes",
  partLine: "So we sell it for all thirteen boxes.", partCue: "all thirteen",
  trapLine: "Some people add thirty to fifty five and get eighty five. Thirty kobo? No. It's thirty percent, three boxes.", trapCue: "add thirty",
  checkLine: "71.5, take away the three profit boxes, 16.5...",
  answerLine: "So we sell the hat for 71.5 kobo.",
  r2Line: "A profit of thirty percent means we sell it for a hundred and thirty percent of what it cost. A hundred and thirty over a hundred.",
  closing: "Two ways, one answer. Thirty percent is three boxes of ten. A profit grows the bar by that many boxes.",
});

/* Junior secondary, 5th edition first round, Q7: twenty boxes of 75 kg */
export const decrease15 = () => forwardFilm({
  question: "Decrease 1500 kg by 15%.",
  whole: 1500, N: 20, K: 17, by: 5, pct: 15, boxTop: 3, boxBot: 20, boxBy: 5, keepPct: 85,
  W: "1,500", U: "75", P: "1,275",
  labels: { part: "what is left", rest: "taken off", whole: "start", answer: "what is left", money: "", suffix: "kg", wordTop: "left", wordBottom: "start" },
  fracTop: "100\\% - 15\\% = 85\\%", trap: "1500 - 15",
  story: ["We start with 1,500 kilograms.", "We decrease it by fifteen percent.", "So how much is left?"],
  want: "what is left", wholePhrase: "the 1,500 kilograms", wholeCap: "The 1,500 kilograms", newPhrase: "what is left", newCap: "What is left",
  restLine: "Decrease by fifteen percent. That's three boxes taken off.", restCue: "three boxes",
  partLine: "So what's left is the other seventeen boxes.", partCue: "other seventeen",
  trapLine: "Some people take fifteen kilograms away. No. It's fifteen percent, three boxes.", trapCue: "fifteen kilograms",
  checkLine: "1,275, plus the three boxes taken off, 225...",
  answerLine: "So 1,275 kilograms are left.",
  r2Line: "Decrease by fifteen percent, so eighty five percent is left. Eighty five over a hundred.",
  closing: "Two ways, one answer. Fifteen percent is three boxes of twenty. Take them off the whole bar.",
});
