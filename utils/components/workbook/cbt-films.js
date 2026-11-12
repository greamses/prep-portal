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
  const { N, K, known } = cfg;
  const BOXES = N;
  const UNIT = known / K;
  const WHOLE = UNIT * N;
  const L = cfg.labels;
  const f = (n) => n.toLocaleString("en-US");
  const t = (n) => f(n).replace(/,/g, "{,}");  // a figure in TeX
  /* the boxes share 120 mm, 48 units, in the middle of the screen */
  const BAR_MM = 120;
  const PART_MM = BAR_MM / N;

  const boxes = (text, restTone = "a") => Array.from({ length: N }, (_, i) => part(text, 1, i >= K ? restTone : "a"));
  const bars = (rows) => mathifyPic(modelSvg(rows, { cap: PART_MM, label: "" }));
  const tops = [{ from: 0, to: K, text: L.part }, { from: K, to: N, text: L.rest }];

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
    const r = mathRow([{ k: "L", frac: [String(K), String(N)] }, { gap: 6 }, { k: "eq", tex: "=" }, { gap: 6 }, { k: "R", frac: [t(known), "?"] }],
      { cx: EQ_W / 2 - 6, y: 34, em: 11 });
    const Lf = r.at.L, Rr = r.at.R;
    const ans = texAt(t(WHOLE), Rr.x, Rr.botBase, { em: 11, color: GREEN, attrs: 'data-mb="num" data-k="ans"' });
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
    const end = Rr.x - Rr.topW / 2 - 3;
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
  const B = cfg.box, F = cfg.frac;

  return film({
    paperMm: PAPER,
    picW: PIC_W,
    ready: mathLoad(),
    asks: [{ id: "a1", text: cfg.question }],
    pics: {
      /* ── method one: the bar ── */
      b0: () => bars([{ parts: [part("?", N, "a")], below: [{ from: 0, to: 1, text: `${L.whole} = ?` }] }]),
      b1: () => bars([{ parts: boxes(`${100 / N}%`), below: [{ from: 0, to: N, text: `${L.whole} = ?` }] }]),
      b2: () => bars([{ parts: boxes(`${100 / N}%`, "d"), above: tops, below: [{ from: 0, to: N, text: `${L.whole} = ?` }] }]),
      b3: () => bars([{ parts: boxes(f(UNIT), "d"), above: tops, below: [{ from: 0, to: N, text: L.whole }] }]),
      /* the working under it, one line at a time */
      mA: () => main([{ k: "p", tex: `${B.pct}\\%` }, { k: "e1", tex: "=" }, { k: "f", frac: [String(B.pct), "100"] }, { k: "e2", tex: "=" }, { k: "q", frac: [String(B.top), String(B.bot)], color: BLUE }],
        (at) => reduceMarks(at.f, "f", String(B.top), String(B.bot), 8)),
      mB: () => main([{ k: "a", tex: `${K}\\ \\text{boxes}` }, { k: "e", tex: "=" }, { k: "b", tex: t(known) }]),
      mC: () => main([{ k: "a", tex: "1\\ \\text{box}" }, { k: "e", tex: "=" }, { k: "b", tex: `${t(known)} \\div ${K}` }, { k: "e2", tex: "=" }, { k: "c", tex: t(UNIT), color: BLUE }]),
      mD: () => main([{ k: "a", tex: `${N}\\ \\text{boxes}` }, { k: "e", tex: "=" }, { k: "b", tex: `${N} \\times ${t(UNIT)}` }, { k: "e2", tex: "=" }, { k: "c", tex: t(WHOLE), color: GREEN }]),
      mE: () => main([{ k: "a", tex: `\\text{${L.whole}}` }, { k: "e", tex: "=" }, { k: "c", tex: `${L.money ? `\\text{${L.money}}` : ""}${t(WHOLE)}`, color: GREEN }], () => "", 9),
      /* the margin */
      sA: () => side([[{ k: "a", tex: `${B.pct} \\div ${B.by} = ${B.top}` }], [{ k: "b", tex: `100 \\div ${B.by} = ${B.bot}` }]]),
      sT: () => svgBox(SIDE_W, 20, mathRow([{ k: "a", tex: cfg.trap }], { cx: SIDE_W / 2, y: 10, em: 5.4 }).svg
        + `<line data-mb="cut" data-k="x" x1="4" y1="14" x2="${SIDE_W - 4}" y2="3" stroke="${RED}" stroke-width="0.8" stroke-linecap="round"/>`
        + texAt("\\text{not this}", SIDE_W / 2, 19, { em: 4, color: RED, attrs: 'data-mb="num" data-k="n"' })),
      sC: () => side([[{ k: "a", tex: `${t(WHOLE)} - ${t(UNIT * (N - K))}` }], [{ k: "b", tex: `= ${t(known)}\\ \\checkmark`, color: GREEN }]]),
      /* ── method two ── */
      r2: () => {
        const top = mathRow([{ k: "p", tex: F.top }], { cx: MAIN_W / 2, y: 9, em: 7.5 });
        const low = mathRow([{ k: "s", tex: `${F.pct}\\%` }, { k: "e1", tex: "=" }, { k: "f", frac: [String(F.pct), "100"] }, { k: "e2", tex: "=" }, { k: "q", frac: [String(K), String(N)], color: BLUE }],
          { cx: MAIN_W / 2, y: 33, em: 8 });
        return svgBox(MAIN_W, 46, top.svg + low.svg + reduceMarks(low.at.f, "f", String(K), String(N), 8));
      },
      eq: () => eqSvg(),
      s2A: () => side([[{ k: "a", tex: `${F.pct} \\div ${F.by} = ${K}` }], [{ k: "b", tex: `100 \\div ${F.by} = ${N}` }]]),
      s2B: () => side([[{ k: "a", tex: `${t(known)} \\div ${K}` }], [{ k: "b", tex: `= ${t(UNIT)}`, color: BLUE }]]),
      s2C: () => side([[{ k: "a", tex: `${N} \\times ${t(UNIT)}` }], [{ k: "b", tex: `= ${t(WHOLE)}`, color: GREEN }]]),
    },
    picAt: {
      b0: BAR_AT, b1: BAR_AT, b2: BAR_AT, b3: BAR_AT,
      mA: MAIN_AT, mB: MAIN_AT, mC: MAIN_AT, mD: MAIN_AT, mE: centred(MAIN_W, 33),
      sA: SIDE_AT, sT: SIDE_AT, sC: SIDE_AT, s2A: SIDE_AT, s2B: SIDE_AT, s2C: { x: 79.5, y: 37 },
      r2: centred(MAIN_W, 18), eq: centred(EQ_W, 15),
    },
    /* only the name of the method, small, in the corner under the step counter */
    lines: [
      { id: "m1", text: "1 · The box method", x: 2.5, y: 12.5, c: 1, size: 1.7, w: 32 },
      { id: "m2", text: "2 · Equivalent fractions", x: 2.5, y: 12.5, c: 1, size: 1.7, w: 32 },
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
          H.score(line, (k - 1) * 0.95, 0.45);
          H.sound("snip", (k - 1) * 0.95 + 0.3);
        }
      },
      "b1.base": (s, H) => { mb(s, "bar").forEach((n) => H.show(n)); H.show(braceOf(s, "below-0-0")); },
      "b1.pct": (s, H) => mb(s, "num").forEach((n, i) => H.write(n, i * 0.35)),
      "b2.base": (s, H) => {
        mb(s, "bar").forEach((n) => H.show(n));
        mb(s, "num").forEach((n) => H.show(n));
        H.show(braceOf(s, "below-0-0"));
      },
      /* the boxes not in the part take their own colour, and their brace */
      "b2.lose": (s, H) => {
        const b = mb(s, "bar");
        b.slice(K).forEach((n, i) => H.tint(n, b[0].getAttribute("fill"), i * 0.3));
        H.draw(braceOf(s, "above-0-1"), 0.5);
      },
      "b2.sold": (s, H) => H.draw(braceOf(s, "above-0-0"), 0),
      "b3.base": (s, H) => {
        mb(s, "bar").forEach((n) => H.show(n));
        ["above-0-0", "above-0-1", "below-0-0"].forEach((k) => H.show(braceOf(s, k)));
      },
      "b3.one": (s, H) => H.write(mb(s, "num")[0], 0),
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
      "eq.sold": (s, H) => write(s, H, ["eq", "Rn", "ws"], 0, 0.45),
      "eq.cost": (s, H) => write(s, H, ["Rr", "Rd", "wc"], 0, 0.45),
      "eq.over": (s, H) => H.draw(braceOf(s, "over"), 0),
      "eq.overX": (s, H) => write(s, H, ["xo"], 0),
      "eq.under": (s, H) => { H.draw(braceOf(s, "under"), 0); write(s, H, ["xu"], 0.6); },
      "eq.ans": (s, H) => {
        const q = key(s, "Rd");
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
