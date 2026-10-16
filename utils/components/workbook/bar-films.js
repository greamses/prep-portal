/* ============================================================================
   THE BAR MODEL, in five films
   ----------------------------------------------------------------------------
   Chapter 9 of the Maths Workbook is five ideas, not one, and they used to be
   one film thirty-one steps long. A child who wants to know how a fraction is
   drawn as a bar should not have to sit through the setting-up, the sharing
   and the money first — and a teacher putting one idea in front of a class
   should be able to play that idea.

     bar-setup      what a bar IS, and the rules not to miss
     bar-parts      part to part, and part to whole
     bar-missing    completing the part you were not told
     bar-money      money questions, counted out in real prepbills
     bar-fractions  a bar cut into equal parts

   They share one drawing kit, below, so five films cannot drift into five
   different ideas of what a bar model looks like.

   HOW A FILM POINTS AT SOMETHING. Not by moving the screen — magnifying the
   whole drawing to point at one bar takes everything else off the edges, and
   the child loses the thing the bar is PART of at the moment you are telling
   them how it fits. The MARK swells where it stands (`focus`), or takes a
   colour for as long as it is talked about (`lit`), and the drawing holds
   still around it.
   ========================================================================== */

import { tile, art, acts } from "/prep-math/activity/vedic-maths-workbook/js/explain.js";
import { modelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";
/* the SAME counters the child deals on the mat, and the SAME money that is
   counted out at the shop till — a second drawing of either would be a
   second counter and a second currency */
import { discSvg, one as oneCounter } from "./counters.js";
import { moneySvg, bill } from "./purse.js";
import { down, num, esc } from "./video-kit.js";

/** The marks of a model, addressed the way the drawing names them. */
const mb = (svg, kind, row = null) => [...(svg
  ? svg.querySelectorAll(`[data-mb="${kind}"]${row == null ? "" : `[data-mb-row="${row}"]`}`)
  : [])];
const braceOf = (svg, key) => (svg ? svg.querySelector(`[data-mb="brace"][data-mb-key="${key}"]`) : null);
/** Another picture's drawing — the cut has to be made where the parts divide. */
const svgIn = (stage, id) => stage.querySelector(`[data-t="${id}"] svg`);
const MARKS = '[data-mb="bar"], [data-mb="num"], [data-mb="name"], [data-mb="brace"], [data-mb="cut"], [data-mb="ctr"]';
const SVGNS = "http://www.w3.org/2000/svg";

/* Where the left end and the top edge of EVERY bar sit, in width-units. The
   bars are not at the left margin: a model with row names keeps them in a
   column 17mm WIDE of its own bars, and that column has to be on the screen
   too, or the names run off the edge. */
const BAR_X = 9;
const BAR_Y = 20;
const PIC_W = 47;        // how wide a picture is drawn, in width-units

/**
 * A model placed by its own first bar rather than by its middle.
 *
 * The drawing is read for its viewBox and the corner of its first bar, both of
 * which are in the markup, so this needs no layout and works at build time.
 */
function artAt(stage, id, html, widthU) {
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html);
  const bar = /<rect[^>]*data-mb="bar"[^>]*>/.exec(html);
  const [vw, vh] = vb ? [Number(vb[1]), Number(vb[2])] : [150, 50];
  const bx = bar ? Number(/ x="([\d.]+)"/.exec(bar[0])?.[1] ?? 0) : 0;
  const by = bar ? Number(/ y="([\d.]+)"/.exec(bar[0])?.[1] ?? 0) : 0;
  const k = widthU / vw;                       // width-units per drawing unit
  const h = vh * k;                            // the tile's height, in width-units
  /* a tile is centred on its point, so its own middle is half a tile back
     from where the bar has to land */
  return art(stage, id, BAR_X + widthU / 2 - bx * k, down(BAR_Y + h / 2 - by * k), widthU, html);
}

/* ═══ counters, INSIDE the bar they are being shared into ══════════════════
   A number is shared INTO the boxes it is being shared into. Dealing the
   counters onto a tray beside the model makes the child hold two pictures at
   once and match them up in their head; dropping them inside the bars makes
   the bar fill up in front of them, which is what sharing looks like.

   THEY ARE WORTH A HUNDRED EACH, on purpose. A share that comes out even in
   hundreds teaches nothing about sharing — it is the one that does NOT that
   needs the picture, and for that you have to be able to UNGROUP: one hundred
   broken into ten tens, and ten tens will go three ways where one hundred
   will not.
   ------------------------------------------------------------------------*/

const CT = { 100: ["#8fd39a", "#3f8f4f"], 10: ["#6fb7e8", "#2a6ca8"], 1: ["#f4c95d", "#c9922f"] };

/**
 * Lay `list` of counters inside `bar`, hidden, and give each one a number so a
 * step can deal them in order. Returns the <g> elements, in dealing order.
 *
 *   list   the worths, e.g. [100, 100, 10, 10, 10]
 *   from   what the first one's data-bit should be, so two bars can be dealt
 *          into alternately and still be one run of numbers
 */
function pourInto(svg, bar, list, from = 0) {
  if (!svg || !bar || !list.length) return [];
  const x = +bar.getAttribute("x"), y = +bar.getAttribute("y");
  const w = +bar.getAttribute("width"), h = +bar.getAttribute("height");
  /* as many to a row as will fit without the discs touching, and never more
     than two rows — a bar packed three deep stops reading as a bar */
  const rows = list.length > 6 ? 2 : 1;
  const per = Math.ceil(list.length / rows);
  const r = Math.min((h / rows) * 0.36, (w / per) * 0.38);
  const gapX = w / per, gapY = h / rows;
  const made = [];
  list.forEach((worth, i) => {
    const col = i % per, row = Math.floor(i / per);
    const cx = x + gapX * (col + 0.5);
    const cy = y + gapY * (row + 0.5);
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("data-mb", "ctr");
    g.setAttribute("data-bit", String(from + i));
    g.style.opacity = "0";
    const [fill, edge] = CT[worth] || CT[1];
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
    c.setAttribute("fill", fill); c.setAttribute("stroke", edge);
    c.setAttribute("stroke-width", String(r * 0.16));
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", cx); t.setAttribute("y", cy + r * 0.34);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-family", "JetBrains Mono, monospace");
    t.setAttribute("font-size", String(r * (String(worth).length > 2 ? 0.78 : 0.95)));
    t.setAttribute("font-weight", "700");
    t.setAttribute("fill", "#14130f");
    t.textContent = String(worth);
    g.appendChild(c); g.appendChild(t);
    svg.appendChild(g);
    made.push(g);
  });
  return made;
}

/** The counters already poured into a drawing, in the order they were dealt. */
const CTR = '[data-mb="ctr"]';
const pouredIn = (svg) => [...(svg ? svg.querySelectorAll('[data-mb="ctr"]') : [])]
  .sort((a, b) => Number(a.dataset.bit) - Number(b.dataset.bit));

/**
 * THE HAND THAT DRAWS A MODEL: grow a bar, cut one in two, give a part its own
 * colour, write a number into a box, draw a brace across what it spans, turn
 * one figure into another.
 *
 * Each has a "just be there" form as well, because stepping back rebuilds the
 * stage and replays every step before the one asked for, instantly — so every
 * one of these has to be able to arrive without being watched.
 */
function hand(gsap, instant) {
  /* SVG TRANSFORM ORIGINS ARE NOT CSS ONES. Asking for "center center" on a
     mark inside an SVG leaves a residual translation behind when the tween
     lands — the braces finished 16 millimetres to the left of the bars they
     were supposed to span. `svgOrigin` is given in the drawing's OWN
     coordinates, which is the only way to scale a mark about a point of
     itself and have it come to rest where it was drawn. */
  /* AN SVG MARK AND AN HTML TILE NEED DIFFERENT ORIGINS. Inside a drawing the
     origin has to be given in the drawing's own coordinates (`svgOrigin`);
     outside it, the ordinary CSS one means what it says. Getting this wrong
     either throws (getBBox is SVG-only) or silently scales a tile about the
     middle of the screen. */
  const inSvg = (n) => typeof n.getBBox === "function" && !!n.ownerSVGElement;
  const originOf = (n, at = "center") => {
    const b = n.getBBox();
    return `${at === "left" ? b.x : b.x + b.width / 2} ${b.y + b.height / 2}`;
  };
  /** Where to scale a mark about, whichever kind of mark it is. */
  const from = (n, at = "center") => (inSvg(n)
    ? { svgOrigin: originOf(n, at) }
    : { transformOrigin: at === "left" ? "0% 50%" : "50% 50%" });
  /* A MARK MUST END WHERE THE DRAWING PUT IT. GSAP leaves the matrix it was
     tweening on the element, and an origin it worked out for itself leaves a
     translation in that matrix — so the figures came to rest five millimetres
     above the bars they belonged in. Clearing the transform when a tween ends
     gives the mark back to the drawing, and makes the whole class of mistake
     impossible rather than merely fixed here. */
  const settle = (n) => () => gsap.set(n, { clearProps: "transform" });
  /* and the origin has to be set BEFORE the starting state is applied: a
     `fromTo` renders its "from" at once, while an origin passed in its "to"
     only takes effect when the delay runs out, so the two disagree and the
     difference is baked in as a shift. */
  const about = (n, at) => gsap.set(n, from(n, at));

  const on = (n) => {
    if (!n) return;
    n.style.opacity = "1";
    n.style.fill = "";
    if (gsap) { gsap.killTweensOf(n); gsap.set(n, { clearProps: "transform" }); }
    /* a brace left half-drawn when the learner stepped back */
    n.querySelectorAll?.("path").forEach((d) => { d.style.strokeDasharray = ""; d.style.strokeDashoffset = ""; });
    n.querySelectorAll?.("text").forEach((t) => { t.style.opacity = "1"; });
  };
  /** The knife line down a bar, made on demand and kept with the drawing. */
  const knife = (svg, x, y, h) => {
    let line = svg.querySelector('[data-mb="cut"]');
    if (!line) {
      line = document.createElementNS(SVGNS, "line");
      line.setAttribute("data-mb", "cut");
      line.setAttribute("stroke", "#2a2723");
      line.setAttribute("stroke-width", "0.8");
      line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line);
    }
    line.setAttribute("x1", x); line.setAttribute("x2", x);
    line.setAttribute("y1", y - 1.6); line.setAttribute("y2", y + h + 1.6);
    line.style.opacity = "1";
    return { line, len: h + 3.2 };
  };

  if (instant || !gsap) {
    return {
      show: on, grow: on, write: on, draw: on, mark: on, deal: on, drop: on,
      focus: () => {}, lit: () => {},
      tint: (n) => on(n),
      flip: (n, text) => { if (n) { n.textContent = text; on(n); } },
      cut: (svg, x, y, h) => { if (svg) knife(svg, x, y, h); },
    };
  }
  return {
    show: on,
    /* A BAR IS A LENGTH, so it arrives by GETTING longer — from its left end,
       the way a hand draws one. This is the thing the lesson is about. */
    grow(n, delay = 0) {
      if (!n) return;
      n.style.opacity = "1";
      about(n, "left");
      gsap.fromTo(n, { scaleX: 0 },
        { scaleX: 1, duration: 0.6, delay, ease: "power2.out", onComplete: settle(n) });
    },
    /* A BAR THAT IS CUT IS CUT. The line comes down through it like a knife,
       so the child sees the cut being MADE — a bar that merely changes colour
       in two halves has not been cut in front of anybody. */
    cut(svg, x, y, h, delay = 0) {
      if (!svg) return;
      const { line, len } = knife(svg, x, y, h);
      gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.45, delay, ease: "power2.in" });
    },
    /* and then each part takes its own colour, one after the other, so they
       are plainly two things now and not one */
    tint(n, from, delay = 0) {
      if (!n) return;
      n.style.opacity = "1";
      gsap.fromTo(n, { fill: from }, { fill: n.getAttribute("fill"), duration: 0.45, delay, ease: "power1.inOut" });
    },
    /* A COUNTER DEALT, or a note laid on the table. These are pieces of an
       ordinary HTML row rather than marks inside a drawing, so they are moved
       the plain way — and they come DOWN onto the table, because that is what
       a hand putting something down looks like. */
    deal(n, delay = 0) {
      if (!n) return;
      gsap.fromTo(n, { opacity: 0, scale: 0.4, y: "-=14" },
        { opacity: 1, scale: 1, y: "+=14", duration: 0.4, delay, ease: "back.out(1.9)",
          onComplete() { gsap.set(n, { clearProps: "transform" }); } });
    },
    /**
     * A PIECE PUT DOWN WHERE IT GOES. A counter dropped into the bar it is
     * being shared into; a note laid on its pile. It comes down from a little
     * above, because that is what a hand putting something down looks like,
     * and it is SVG-safe — the transform is cleared when it lands.
     */
    drop(n, delay = 0) {
      if (!n) return;
      about(n);
      gsap.fromTo(n, { opacity: 0, scale: 0.3, yPercent: -40 },
        { opacity: 1, scale: 1, yPercent: 0, duration: 0.34, delay, ease: "back.out(2)", onComplete: settle(n) });
    },
    /** A mark pointed at: a small, quick swell. */
    mark(n, delay = 0) {
      if (!n) return;
      n.style.opacity = "1";
      about(n);
      gsap.fromTo(n, { scale: 1 },
        { scale: 1.05, duration: 0.22, delay, yoyo: true, repeat: 1, ease: "power1.inOut", onComplete: settle(n) });
    },
    /**
     * LOOK AT THIS ONE — and the screen does not move.
     *
     * Magnifying the whole drawing to point at one bar takes everything else
     * off the edges, so the child loses the thing the bar is PART of at the
     * exact moment you are telling them how it fits. The mark itself swells
     * instead, holds while the sentence about it is said, and settles back.
     * Scaling about its own middle is what keeps it in its row while it does.
     */
    focus(n, delay = 0, hold = 1.7, to = 1.22) {
      if (!n) return;
      n.style.opacity = "1";
      about(n);
      gsap.timeline({ delay, onComplete: settle(n) })
        .to(n, { scale: to, duration: 0.4, ease: "back.out(1.7)" })
        .to(n, { scale: 1, duration: 0.4, ease: "power2.inOut" }, `+=${hold}`);
    },
    /**
     * The other way to say "this one": the mark takes a colour for as long as
     * it is being talked about. Better than swelling for a brace, whose whole
     * job is to span exactly what it spans, and for a bar in a row of bars
     * that must stay the same size as its neighbours to mean anything.
     */
    lit(n, delay = 0, hold = 1.7, ink = "var(--accent-danger)") {
      if (!n) return;
      n.style.opacity = "1";
      const paint = (v) => {
        const marks = n.tagName === "g" ? [...n.querySelectorAll("path, text")] : [n];
        marks.forEach((m) => {
          if (m.tagName === "text") m.style.fill = v;
          else { m.style.stroke = v; m.style.strokeWidth = v ? "0.9" : ""; }
        });
        if (!n.tagName || n.tagName === "SPAN" || n.tagName === "DIV") n.style.color = v;
      };
      gsap.timeline({ delay, onComplete: () => paint("") })
        .add(() => paint(ink))
        .to({}, { duration: hold })
        .add(() => paint(""));
    },
    /* A NUMBER IS WRITTEN INTO A BOX: it lands in it, one box at a time, in
       reading order. It does not fade up — that looks like a label appearing,
       not like somebody writing. */
    write(n, delay = 0) {
      if (!n) return;
      about(n);
      gsap.fromTo(n, { opacity: 0, scale: 0.35 },
        { opacity: 1, scale: 1, duration: 0.36, delay, ease: "back.out(2.4)", onComplete: settle(n) });
    },
    /* A BRACE IS DRAWN ACROSS what is already there, so it is drawn the way a
       line is drawn: the stroke itself runs from one end to the other, and the
       words land on it once it has arrived. Nothing is scaled, so nothing can
       end up spanning the wrong bars. */
    draw(g, delay = 0) {
      if (!g) return;
      g.style.opacity = "1";
      const path = g.querySelector("path");
      const label = g.querySelector("text");
      if (path) {
        const len = path.getTotalLength();
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
          strokeDashoffset: 0, duration: 0.55, delay, ease: "power2.out",
          onComplete() { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; },
        });
      }
      if (label) gsap.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: delay + 0.42 });
    },
    /* "?" becoming 12. The box does not empty and refill: the figure turns
       over in place, so it is plainly the same box being answered. */
    flip(n, text, delay = 0) {
      if (!n) return;
      about(n);
      gsap.timeline({ delay, onComplete: settle(n) })
        .set(n, { opacity: 1 })
        .to(n, { scaleY: 0, duration: 0.16, ease: "power1.in" })
        .add(() => { n.textContent = text; })
        .to(n, { scaleY: 1, duration: 0.3, ease: "back.out(2.2)" });
    },
  };
}


/* ═══ one film, assembled ══════════════════════════════════════════════════
   Every one of the five is the same machine: some PICTURES (model drawings,
   each holding every mark it will ever show), some TRAYS (counters and money,
   whose pieces are laid out one at a time), some LINES of working, and a list
   of steps saying what is said and what is drawn while it is said.

   A step may also name ONE mark to be picked out while it is talked about —
   `look` finds it, and it swells where it stands or takes a colour. The
   screen never moves.
   ------------------------------------------------------------------------*/
function film({ pics = {}, trays = {}, stages = {}, lines = [], build: extra = null, steps: write }) {
  const PIC_IDS = Object.keys(pics);
  const TRAY_IDS = Object.keys(trays);
  const LINE_IDS = lines.map((l) => l.id);
  const TILES = [...PIC_IDS, ...TRAY_IDS, ...LINE_IDS, "q", "rule"];

  const svgOf = (stage, id) => stage.querySelector(`[data-t="${id}"] svg`);
  const bits = (stage, id) => [...(stage.querySelector(`[data-t="${id}"]`)?.querySelectorAll("[data-bit]") || [])]
    .sort((a, b) => Number(a.dataset.bit) - Number(b.dataset.bit));
  const picOf = (key) => key.split(".")[0];

  /* what a step may ask to be looked at */
  const look = {
    mark: (id, kind, i = 0, row = null) => (stage) => mb(svgOf(stage, id), kind, row)[i],
    brace: (id, key) => (stage) => braceOf(svgOf(stage, id), key),
    tile: (id) => (stage) => stage.querySelector(`[data-t="${id}"]`)?.firstChild,
    bit: (id, i) => (stage) => bits(stage, id)[i],
  };

  const events = [];
  let tiles = new Set();
  let drawn = [];
  const push = (say, { on = [], off = [], add = [], play = () => {}, look: at = null, lookAt = null } = {}) => {
    const beforeTiles = new Set(tiles);
    const beforeDrawn = drawn.slice();
    on.forEach((t) => tiles.add(t));
    off.forEach((t) => tiles.delete(t));
    drawn = [...drawn, ...add];
    events.push({ say, beforeTiles, beforeDrawn, on, off, add, play, look: at, lookAt });
  };

  write({ push, look });

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    PIC_IDS.forEach((id) => artAt(stage, id, pics[id](), PIC_W));
    /* a tray is an ordinary row of pieces, so it hangs where the bars are
       rather than being measured from a first bar it has not got */
    TRAY_IDS.forEach((id) => art(stage, id, 30, down(27), 46, trays[id]()));
    lines.forEach((l) => num(stage, l.id, l.text, l.x ?? 77, down(l.y), l.c ?? 0, l.size ?? 2.5));
    if (extra) extra(stage);
  };

  const steps = events.map((ev) => ({
    say: ev.say,
    show(stage, how) {
      const S = acts(stage, how.gsap, how.instant);
      const already = hand(how.gsap, true);
      const H = hand(how.gsap, how.instant);

      TILES.forEach((id) => S.put(id, { on: ev.beforeTiles.has(id) ? 1 : 0 }));
      ev.off.forEach((id) => S.put(id, { on: 0 }));
      PIC_IDS.forEach((id) => {
        const svg = svgOf(stage, id);
        if (svg) svg.querySelectorAll(MARKS).forEach((n) => { n.style.opacity = "0"; });
      });
      TRAY_IDS.forEach((id) => bits(stage, id).forEach((n) => { n.style.opacity = "0"; }));
      ev.beforeDrawn.forEach((k) => stages[k]?.(svgOf(stage, picOf(k)), already, stage, bits));

      ev.on.forEach((id, j) => {
        if (ev.beforeTiles.has(id)) return;
        if (pics[id] || trays[id]) S.put(id, { on: 1 }); else S.pop(id, 0.2 + j * 0.12);
      });
      ev.add.forEach((k) => stages[k]?.(svgOf(stage, picOf(k)), H, stage, bits));

      if (ev.look && !how.instant && how.gsap) {
        const n = ev.look(stage);
        const o = ev.lookAt || {};
        if (n) (o.lit ? H.lit(n, o.delay || 0.2, o.hold || 1.7) : H.focus(n, o.delay || 0.2, o.hold || 1.7, o.to || 1.22));
      }
      ev.play(S, H, stage);
    },
  }));
  return { build, steps };
}

/* the parts a model is made of, written the way the drawing wants them */
const part = (text, value, tone) => ({ text, value, tone });
const ask = (value, tone) => part("?", value, tone);

/* ═══ 1 · SETTING UP A BAR MODEL ═══════════════════════════════════════════
   What a bar IS, and the four rules a child loses marks for not keeping.
   Nothing is solved in this film: it is the one that has to be watched first
   and never again.
   ------------------------------------------------------------------------*/
export function barSetup() {
  const W = 48, P1 = 20, P2 = W - P1;
  return film({
    pics: {
      /* the whole bar carries the same brace underneath as the cut one, never
         shown — only reserving the room, so the bar does not hop up the screen
         when the cut comes */
      pw: () => modelSvg([{ parts: [part(String(W), W, "a")],
        below: [{ from: 0, to: 1, text: String(W) }] }], { label: "One bar" }),
      pc: () => modelSvg([{ parts: [part(String(P1), P1, "a"), part(String(P2), P2, "b")], says: String(W) }],
        { label: "A bar cut in two" }),
      /* two rows, to show the one rule a picture can break silently */
      ps: () => modelSvg([
        { name: "Ada", parts: [part("30", 30, "a")] },
        { name: "Tom", parts: [part("45", 45, "c")] },
      ], { label: "Two bars on one ruler" }),
    },
    lines: [
      { id: "r1", text: "1 · a bar is a THING", x: 72, y: 12, c: 1, size: 2.2 },
      { id: "r2", text: "2 · parts together ARE the whole", x: 72, y: 19.6, c: 1, size: 2.2 },
      { id: "r3", text: "3 · a total is a BRACE", x: 72, y: 27.2, c: 1, size: 2.2 },
      { id: "r4", text: "4 · not told → a ? box, to size", x: 72, y: 34.8, c: 1, size: 2.2 },
      { id: "r5", text: "5 · compared bars, ONE ruler", x: 72, y: 42.4, c: 1, size: 2.2 },
    ],
    stages: {
      "pw.bar": (s, H) => H.grow(mb(s, "bar")[0]),
      "pw.num": (s, H) => H.write(mb(s, "num")[0]),
      "pw.cut": (s, H, stage) => {
        const bar = mb(s, "bar")[0];
        const at = mb(svgIn(stage, "pc"), "bar")[1];
        if (bar && at) H.cut(s, Number(at.getAttribute("x")), Number(bar.getAttribute("y")), Number(bar.getAttribute("height")));
      },
      "pc.parts": (s, H) => {
        const [b0, b1] = mb(s, "bar");
        H.show(b0); H.mark(b0, 0.1);
        H.show(b1); H.tint(b1, b0.getAttribute("fill"), 0.6);
      },
      "pc.nums": (s, H) => mb(s, "num").forEach((n, i) => H.write(n, 0.25 + i * 0.55)),
      "pc.total": (s, H) => H.draw(braceOf(s, "below-0-0"), 0.25),
      "pc.ask": (s, H) => H.flip(mb(s, "num")[1], "?", 0.3),
      "ps.bars": (s, H) => {
        mb(s, "name").forEach((n, i) => H.write(n, i * 0.5));
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.3 + i * 0.6));
        mb(s, "num").forEach((n, i) => H.write(n, 0.9 + i * 0.6));
      },
    },
    steps: ({ push, look }) => {
      push("Right then. Before anybody solves anything, we are going to set one of these up properly, "
        + "because almost every mark lost on a bar model is lost in the drawing and not in the sum. "
        + "Rule one. A BAR is a thing you have got — ribbon, stickers, money in a tin — and the LENGTH "
        + "of it is how much of it there is. Long bar, a lot. Short bar, a little. You can see which is "
        + "bigger without counting anything, and that is the whole reason we draw them.",
        { on: ["pw", "r1"], add: ["pw.bar"] });

      push(`So this bar is ${W}. And look where the ${W} goes: INSIDE the bar, because the bar IS the `
        + `${W}. They are not two separate things sitting next to each other.`,
        { add: ["pw.num"], look: look.mark("pw", "num"), lookAt: { delay: 0.9, hold: 1.8, to: 1.35 } });

      push("Rule two, and it is the one everything else rests on. Watch me cut it. There. Now — has the "
        + "amount changed? It has not. Not a bit of it. Cutting a bar never changes how much there is, "
        + "so the parts together ARE the whole. Say that back to yourself, because every single question "
        + "in this chapter is that sentence wearing a different hat.",
        { on: ["r2"], add: ["pw.cut"] });

      push(`Two parts now. This one on the left, and this one on the right — and I give the second its own `
        + `colour so you can tell at a glance that they are two things. ${P1} and ${P2}, and they come `
        + `home to ${W}, because they have to.`,
        { on: ["pc"], off: ["pw"], add: ["pc.parts", "pc.nums"] });

      push("Rule three, and this is the one people get wrong most. The total does NOT go in a space beside "
        + "the bar. It goes on a curly brace UNDERNEATH, stretching across exactly the bit it is the total "
        + "of. Why so fussy? Because a number sitting beside a bar does not tell you what it is counting. "
        + "The brace does. It says: all of THIS comes to forty-eight — and you can see what THIS is.",
        { on: ["r3", "rule"], add: ["pc.total"], look: look.brace("pc", "below-0-0"), lookAt: { lit: true, delay: 1.2, hold: 2.4 } });

      push("Rule four. When you are not TOLD a number you do not leave the box empty and you do not guess "
        + "— you put a question mark in it, and you still draw the box the RIGHT size. Honestly, half of "
        + "getting these right is being willing to draw a box you cannot label yet.",
        { on: ["r4"], add: ["pc.ask"], look: look.mark("pc", "num", 1), lookAt: { delay: 1.0, hold: 2.2, to: 1.45 } });

      push("And rule five, which a drawing can break without you noticing. When two bars are COMPARED they "
        + "must be drawn on one ruler and lined up at the same left-hand edge. Thirty and forty-five: the "
        + "forty-five has to look half as long again, or the picture is telling you a lie that your eyes "
        + "will believe before your arithmetic does.",
        { on: ["ps", "r5"], off: ["pc", "rule"], add: ["ps.bars"],
          look: look.mark("ps", "bar", 1), lookAt: { delay: 1.6, hold: 2.2, to: 1.1 } });

      push("That is the set-up, and those five rules are worth more than any trick. Draw the bar. Cut it "
        + "where the story cuts it. Brace the total, never write it beside. Question-mark what you were "
        + "not told, at the size you think it is. And if two things are being compared, measure them "
        + "against each other. Get those right and the sums at the end are the easy part.",
        { play: (S) => { S.pulse("r1", 0.2); S.pulse("r2", 0.5); S.pulse("r3", 0.8); S.pulse("r4", 1.1); S.pulse("r5", 1.4); } });
    },
  });
}

/* ═══ 2 · PART TO PART, AND PART TO WHOLE ══════════════════════════════════
   The two shapes a bar model comes in, named and told apart — and the sharing
   that finds one unit, done with counters dropped INTO the bars.
   ------------------------------------------------------------------------*/
export function barParts() {
  const W = 600, TIMES = 2, UNIT = W / (TIMES + 1);      // 200
  const A = "Ben", B = "Amy";
  return film({
    pics: {
      /* PART TO WHOLE: one bar cut, the whole braced under it */
      pw: () => modelSvg([{ parts: [part("250", 250, "a"), part("350", 350, "b")], says: String(W) }],
        { label: "Part to whole" }),
      /* PART TO PART: two rows weighed against each other */
      pp: () => modelSvg([
        { name: B, parts: [ask(UNIT, "a")], above: [{ from: 0, to: 1, text: "1 unit" }] },
        { name: A, parts: [ask(UNIT, "c"), ask(UNIT, "c")], below: [{ from: 0, to: 2, text: "2 units" }] },
      ], { total: String(W), label: "Part to part" }),
    },
    lines: [
      { id: "k0", text: `1 + ${TIMES} = ${TIMES + 1} units`, y: 12, c: 0 },
      { id: "k1", text: `${TIMES + 1} units = ${W}`, y: 19.6, c: 2 },
      { id: "k2", text: `1 unit = ${W} ÷ ${TIMES + 1} = ${UNIT}`, y: 27.2, c: 1, size: 2.4 },
      { id: "k3", text: `${B} = ${UNIT},  ${A} = ${TIMES * UNIT}`, y: 34.8, c: 3, size: 2.4 },
    ],
    build: (stage) => {
      num(stage, "q", `${A} has ${TIMES} times as many as ${B}. Together, ${W}.`, 50, down(3), 0, 2.6);
    },
    stages: {
      "pw.bars": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.5));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.5));
      },
      "pw.total": (s, H) => H.draw(braceOf(s, "below-0-0"), 0.3),

      "pp.amy": (s, H) => {
        H.write(mb(s, "name")[0]);
        H.grow(mb(s, "bar", 0)[0], 0.3);
        H.write(mb(s, "num", 0)[0], 0.9);
      },
      "pp.ben": (s, H) => {
        H.write(mb(s, "name")[1]);
        mb(s, "bar", 1).forEach((n, i) => H.grow(n, 0.3 + i * 0.5));
        mb(s, "num", 1).forEach((n, i) => H.write(n, 0.9 + i * 0.5));
      },
      "pp.total": (s, H) => H.draw(braceOf(s, "total"), 0.25),
      "pp.units": (s, H) => { H.draw(braceOf(s, "above-0-0"), 0.2); H.draw(braceOf(s, "below-1-0"), 0.6); },

      /* THE SHARING, inside the bars. Six hundreds dealt round the three
         boxes — one each, every time round — so the bars fill up in front of
         the child instead of a tray filling up beside them. */
      "pp.pour": (s, H) => {
        mb(s, "num").forEach((n) => { n.style.opacity = "0"; });
        const bars = [mb(s, "bar", 0)[0], ...mb(s, "bar", 1)];
        bars.forEach((bar, k) => pourInto(s, bar, [100, 100], k * 2));
        /* dealt ROUND: one to each box, then round again */
        const all = pouredIn(s);
        const order = [all[0], all[2], all[4], all[1], all[3], all[5]];
        order.forEach((n, i) => H.drop(n, 0.3 + i * 0.5));
      },
      "pp.filled": (s, H) => {
        s.querySelectorAll(CTR).forEach((n) => n.remove());
        mb(s, "num").forEach((n, i) => H.flip(n, String(UNIT), 0.3 + i * 0.5));
      },
    },
    steps: ({ push, look }) => {
      push("There are only two shapes a bar model ever comes in, and knowing which one you are looking at "
        + "is most of the battle. Here is the first: PART TO WHOLE. One thing, cut into parts. Two hundred "
        + "and fifty and three hundred and fifty, and the brace underneath says what the whole lot comes "
        + "to. You use it when you know the parts and want the whole, or you know the whole and one part "
        + "and want the other.",
        { on: ["pw"], add: ["pw.bars", "pw.total"] });

      push("And here is the second: PART TO PART. Not one thing cut up — two DIFFERENT things, weighed "
        + "against each other. Amy's marbles and Ben's marbles. Same picture family, completely different "
        + "question, and the giveaway is in the words: times as many, more than, the ratio of. Any of "
        + "those and you are drawing two rows, not one bar.",
        { on: ["q", "pp"], off: ["pw"], add: ["pp.amy"] });

      push(`Always start with the SMALLER one, and Amy has fewest — so Amy is ONE unit, one box, and every `
        + `other box in this picture will be exactly the same size as hers. ${A} has twice as many, which `
        + `does NOT mean one longer box. It means two of Amy's box. Two of the same, side by side.`,
        { add: ["pp.ben"] });

      push(`The two of them together have ${W}, so the brace comes down the side of BOTH rows — one brace, `
        + "round everything it is the total of. Now count the boxes: one and two is three units, and every "
        + "one of them is the same size, which is the only reason counting them is allowed.",
        { on: ["k0"], add: ["pp.total", "pp.units"] });

      push(`Those three units ARE the ${W}, so one unit is ${W} shared into three. Now, you may be able to `
        + "do that in your head — but I want you to SEE what sharing means, so I am going to do it with "
        + "counters, and I am going to put them straight into the boxes they are being shared into.",
        { on: ["k1"] });

      push("Six counters, a hundred each. One into Amy's box. One into Ben's first. One into his second. "
        + "And round again — one each, every time round, never two to the same box, because the boxes have "
        + "to stay the same size as one another. That is dividing: giving them out one at a time until "
        + "they are gone.",
        { add: ["pp.pour"] });

      push(`And they came out even. Count what landed in one box: two hundreds, which is ${UNIT}. So one `
        + `unit is ${UNIT} — the same answer the sharing gave us, because that is what the division sign `
        + "was asking for all along.",
        { on: ["k2"], look: look.tile("k2"), lookAt: { delay: 0.4, hold: 2.0, to: 1.3 } });

      push(`So write it in every box and multiply back up. Amy has one unit: ${UNIT}. Ben has two of them: `
        + `${TIMES * UNIT}. And check against what you were given — ${UNIT} and ${TIMES * UNIT} is ${W}, `
        + "which is what they had between them. It comes home, so it is right.",
        { on: ["k3"], add: ["pp.filled"] });
    },
  });
}

/* ═══ 3 · COMPLETING THE MISSING PART ══════════════════════════════════════
   Every bar-model question is one of three gaps, and which one you have
   decides whether you add, take away, or share. Including the share that does
   NOT come out even, which is where the counters have to be ungrouped.
   ------------------------------------------------------------------------*/
export function barMissing() {
  const P1 = 35, P2 = 27, W = P1 + P2;                   // 62
  const T = 450, N = 3, U = T / N;                       // 150
  return film({
    pics: {
      /* the whole is missing */
      m1: () => modelSvg([{ parts: [part(String(P1), P1, "a"), part(String(P2), P2, "c")], says: "?" }],
        { label: "The whole is missing" }),
      /* a part is missing */
      m2: () => modelSvg([{ parts: [part(String(P1), P1, "a"), part("?", P2, "q")], says: String(W) }],
        { label: "A part is missing" }),
      /* three equal units, and a share that does not go */
      m3: () => modelSvg([
        { parts: [ask(U, "a"), ask(U, "a"), ask(U, "a")], says: String(T) },
      ], { label: "Three equal units" }),
    },
    lines: [
      { id: "g1", text: "whole missing → ADD", x: 74, y: 12, c: 2, size: 2.3 },
      { id: "g2", text: "part missing → TAKE AWAY", x: 74, y: 19.6, c: 1, size: 2.3 },
      { id: "g3", text: "equal units → SHARE", x: 74, y: 27.2, c: 3, size: 2.3 },
      { id: "s1", text: `${P1} + ${P2} = ${W}`, y: 38, c: 2, size: 2.6 },
      { id: "s2", text: `${W} − ${P1} = ${P2}`, y: 38, c: 1, size: 2.6 },
      { id: "s3", text: `${T} ÷ ${N} = ${U}`, y: 38, c: 3, size: 2.6 },
    ],
    stages: {
      "m1.draw": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.5));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.5));
        H.draw(braceOf(s, "below-0-0"), 1.6);
      },
      "m2.draw": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.5));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.5));
        H.draw(braceOf(s, "below-0-0"), 1.6);
      },
      "m3.draw": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.4));
        mb(s, "num").forEach((n, i) => H.write(n, 0.8 + i * 0.4));
        H.draw(braceOf(s, "below-0-0"), 1.8);
      },
      /* FOUR hundreds and five tens will not go three ways as they stand:
         the hundred has to be broken first. This is the whole reason the
         counters are worth a hundred. */
      "m3.pour": (s, H) => {
        /* the question marks come off: the counters are what is going in the
           boxes now, and a ? behind them is just something in the way */
        mb(s, "num").forEach((n) => { n.style.opacity = "0"; });
        const bars = mb(s, "bar");
        bars.forEach((bar, k) => pourInto(s, bar, [100], k));
        pouredIn(s).forEach((n, i) => H.drop(n, 0.3 + i * 0.45));
      },
      "m3.ungroup": (s, H) => {
        /* THE WHOLE BOX IS LAID OUT AGAIN. The fourth hundred becomes ten
           tens, so each box now holds a hundred AND five tens — and they have
           to share one layout, or the tens are placed over the hundred and it
           vanishes behind one of them. A hundred you cannot see is not a
           picture of anything. */
        mb(s, "num").forEach((n) => { n.style.opacity = "0"; });
        s.querySelectorAll(CTR).forEach((n) => n.remove());
        const bars = mb(s, "bar");
        bars.forEach((bar, k) => pourInto(s, bar, [100, 10, 10, 10, 10, 10], k * 6));
        const all = pouredIn(s);
        /* the hundreds were already in the boxes: they stay put */
        all.filter((n) => n.textContent === "100").forEach((n) => H.show(n));
        const tens = all.filter((n) => n.textContent === "10");
        /* and the tens are dealt round again: one to each box, five times */
        const order = [];
        for (let i = 0; i < 5; i += 1) for (let k = 0; k < 3; k += 1) order.push(tens[k * 5 + i]);
        order.forEach((n, i) => H.drop(n, 0.3 + i * 0.26));
      },
      /* the counters go, and the number they came to is written in their
         place — a box holding both says the same thing twice */
      "m3.filled": (s, H) => {
        s.querySelectorAll(CTR).forEach((n) => n.remove());
        mb(s, "num").forEach((n, i) => H.flip(n, String(U), 0.3 + i * 0.5));
      },
    },
    steps: ({ push, look }) => {
      push("Every bar-model question in the world is one of three gaps, and which gap you have got decides "
        + "what you do. Here is the first. Both parts known, and the WHOLE is the question mark. Thirty-five "
        + "and twenty-seven, and a question mark on the brace. When the whole is missing, you ADD.",
        { on: ["m1", "g1"], add: ["m1.draw"] });

      push(`So thirty-five and twenty-seven is sixty-two, and the question mark on that brace becomes a `
        + `${W}. Notice I did not need to know what the things were — beads, buses, naira. The picture `
        + "does not care, which is exactly why it is worth drawing.",
        { on: ["s1"], look: look.tile("s1"), lookAt: { delay: 0.4, hold: 1.8, to: 1.3 } });

      push("Second gap, and it is the one people reach for the wrong operation on. Now the WHOLE is known "
        + "— sixty-two on the brace — and one of the PARTS is the question mark. Look at the shape of it "
        + "before you do anything: the box you want is the bit of the bar that the thirty-five does not "
        + "cover.",
        { on: ["m2", "g2"], off: ["m1", "s1"], add: ["m2.draw"],
          look: look.mark("m2", "num", 1), lookAt: { delay: 1.8, hold: 2.2, to: 1.45 } });

      push("And that is a take-away, every time. The whole, less the part you know. Sixty-two take away "
        + "thirty-five is twenty-seven. If you ever catch yourself adding here, look at the picture again "
        + "— you cannot have a part bigger than the whole it came out of.",
        { on: ["s2"] });

      push("Third gap. The whole is known and the parts are all the SAME size — equal units. Four hundred "
        + "and fifty shared into three. This is the one worth watching, because I have chosen numbers that "
        + "do not go neatly, and that is where a picture earns its keep.",
        { on: ["m3", "g3"], off: ["m2", "g1", "g2", "s2"], add: ["m3.draw"] });

      push("Four hundred and fifty. Start with hundreds: one into each box. That is three hundred gone and "
        + "a hundred and fifty still in my hand — and I cannot put that fourth hundred anywhere, because "
        + "one hundred will not go three ways.",
        { add: ["m3.pour"] });

      push("So UNGROUP it. One hundred is ten tens — the same amount, written in smaller pieces — and now "
        + "I have fifteen tens altogether. Watch: one ten to each box, round and round, five times over. "
        + "Five tens each. That is what ungrouping is FOR: you break a piece so that it will share.",
        { add: ["m3.ungroup"] });

      push(`So each box holds one hundred and five tens: a hundred and fifty. ${T} shared into ${N} is `
        + `${U}, and the counters got there without anybody doing a division. Add the gaps up in your head `
        + "before every question — whole missing, add. Part missing, take away. Equal units, share. Three "
        + "gaps, three moves, and the picture tells you which.",
        { on: ["s3"], add: ["m3.filled"], look: look.tile("s3"), lookAt: { delay: 1.8, hold: 2.0, to: 1.3 },
          play: (S) => { S.pulse("g3", 0.3); } });
    },
  });
}

/* ═══ 4 · BAR MODELS AND MONEY ═════════════════════════════════════════════
   A money question is a bar question wearing a wallet, and money is the best
   thing to draw bars for because you can count the answer out and SEE it.

   THE NOTES ARE STACKED BY DENOMINATION, each kind in its own pile. That is
   not tidiness — it is what makes an EXCHANGE visible. A hundred that will
   not share three ways is swapped for five twenties, and you can only watch
   that happen if the hundreds have their own pile for one to leave.
   ------------------------------------------------------------------------*/

/** One pile, one denomination: notes laid over one another, newest on top. */
function stackOf(worth, n, { x = 0, label = "" } = {}) {
  return `<div class="vm-stack" style="--n:${n}">`
    + `<span class="vm-stack__lab">${esc(label || `×${n}`)}</span>`
    + `<span class="vm-stack__pile">`
    + Array.from({ length: n }, (_, i) =>
      `<span class="vm-stack__one" data-bit="${x + i}" style="--i:${i}">${moneySvg(bill(worth), { max: 1 })}</span>`).join("")
    + `</span></div>`;
}

export function barMoney() {
  const WHOLE = 48, MORE = 12, UNIT = (WHOLE - MORE) / 2;   // 18
  const A = "Rosa", B = "Kate";
  return film({
    pics: {
      /* the comparison shape, which is what nearly every money question is */
      pq: () => modelSvg([
        { name: B, parts: [ask(UNIT, "a")] },
        { name: A, parts: [ask(UNIT, "a"), part(String(MORE), MORE, "d")] },
      ], { total: String(WHOLE), label: "One has more than the other" }),
    },
    trays: {
      /* what is on the table at the start: one 20, one 10, one 5, two 2s,
         four 1s — and the piles keep their own places all through */
      mo: () => `<div class="vm-money vm-money--stacks">`
        + stackOf(20, 1, { x: 0, label: "₱20" })
        + stackOf(10, 1, { x: 1, label: "₱10" })
        + stackOf(5, 2, { x: 2, label: "₱5" })
        + stackOf(2, 4, { x: 4, label: "₱2" })
        + `</div>`,
      /* and the same money after the swap: the ₱20 gone, four ₱5s in its place */
      mx: () => `<div class="vm-money vm-money--stacks">`
        + stackOf(10, 1, { x: 0, label: "₱10" })
        + stackOf(5, 6, { x: 1, label: "₱5 × 6" })
        + stackOf(2, 4, { x: 7, label: "₱2" })
        + `</div>`,
    },
    lines: [
      { id: "q0", text: `take the ${MORE} off first`, x: 74, y: 12, c: 1, size: 2.4 },
      { id: "q1", text: `${WHOLE} − ${MORE} = ${WHOLE - MORE}`, y: 19.6, c: 0 },
      { id: "q2", text: `2 units = ${WHOLE - MORE},  1 unit = ${UNIT}`, y: 27.2, c: 1, size: 2.4 },
      { id: "q3", text: `${B} = ${UNIT},  ${A} = ${UNIT + MORE}`, y: 34.8, c: 3, size: 2.3 },
    ],
    build: (stage) => {
      num(stage, "q", `${A} and ${B} share ₱${WHOLE}. ${A} gets ₱${MORE} more.`, 50, down(3), 0, 2.4);
    },
    stages: {
      "pq.bars": (s, H) => {
        mb(s, "name").forEach((n, i) => H.write(n, i * 0.5));
        H.grow(mb(s, "bar", 0)[0], 0.25);
        H.write(mb(s, "num", 0)[0], 0.85);
        H.grow(mb(s, "bar", 1)[0], 0.75);
        H.write(mb(s, "num", 1)[0], 1.35);
      },
      "pq.extra": (s, H) => { H.grow(mb(s, "bar", 1)[1], 0.2); H.write(mb(s, "num", 1)[1], 0.8); },
      "pq.total": (s, H) => H.draw(braceOf(s, "total"), 0.2),
      "pq.filled": (s, H) => [mb(s, "num", 0)[0], mb(s, "num", 1)[0]]
        .forEach((n, i) => H.flip(n, String(UNIT), 0.3 + i * 0.5)),
      /* the money counted onto the table, pile by pile */
      "mo.out": (s, H, stage, bits) => bits(stage, "mo").forEach((n, i) => H.drop(n, 0.2 + i * 0.3)),
      "mx.out": (s, H, stage, bits) => bits(stage, "mx").forEach((n, i) => H.drop(n, 0.2 + i * 0.26)),
    },
    steps: ({ push, look }) => {
      push("Money questions are bar questions wearing a wallet, and they are the best ones to draw, "
        + "because at the end you can count the answer out and hold it. Rosa and Kate are sharing "
        + "forty-eight prepbills, and Rosa gets twelve more than Kate. Here is the money, and notice how "
        + "it is laid out: each kind of note in its OWN pile. Twenties here, tens here, fives, twos.",
        { on: ["q", "mo"], add: ["mo.out"] });

      push("Why pile them like that? Because when you have to swap a note for smaller ones, you need to "
        + "see it LEAVE one pile and arrive in another. Watch. I cannot easily split a twenty between two "
        + "people, so I change it: the twenty goes, and four fives come back in its place. Same money — "
        + "count it — different shape. That swap is the whole of what exchanging is.",
        { on: ["mx"], off: ["mo"], add: ["mx.out"] });

      push("Now the bars. Kate is the smaller one, so Kate is one box. And Rosa has the SAME box, because "
        + "she has everything Kate has and a bit more — so I draw her the same box first and leave the "
        + "extra till after. That order matters; it is what stops you drawing one long bar and losing the "
        + "comparison.",
        { on: ["pq"], off: ["mx"], add: ["pq.bars", "pq.total"] });

      push("And then the extra on the end, and THIS box I can label, because I was told it: twelve. Look "
        + "at the shape — two boxes the same, and a little one hanging off. Every question with the word "
        + "MORE in it comes out looking like that.",
        { add: ["pq.extra"], look: look.mark("pq", "num", 1, 1), lookAt: { delay: 1.0, hold: 2.4, to: 1.4 } });

      push("Here is the move, and it is the only new thing in this film. I cannot share forty-eight into "
        + "two equal boxes, because the boxes are NOT equal — one of them has that twelve stuck on it. So "
        + "take the twelve off the top FIRST. Forty-eight less twelve is thirty-six, and what is left is "
        + "two boxes that really are the same.",
        { on: ["q0", "q1"], look: look.tile("q1"), lookAt: { delay: 0.6, hold: 2.2, to: 1.3 } });

      push(`Two equal units making ${WHOLE - MORE}, so one unit is half of that: ${UNIT}. And now put the `
        + `twelve back where it belongs. Kate has ${UNIT}. Rosa has ${UNIT} and the ${MORE} as well, which `
        + `is ${UNIT + MORE}.`,
        { on: ["q2", "q3"], add: ["pq.filled"] });

      push(`And count it out, because with money you always can. Eighteen for Kate, thirty for Rosa. `
        + `Together that is ${WHOLE}, which is what was on the table — and the difference between them `
        + `is ${MORE}, which is what the question said. Both true, so it is right. That last check is not `
        + "showing off; it is the only thing standing between you and a wrong answer written neatly.",
        { on: ["mx"], off: ["pq"], add: ["mx.out"] });
    },
  });
}

/* ═══ 5 · BARS AS FRACTIONS ════════════════════════════════════════════════
   A fraction is a bar cut into EQUAL parts, and almost every mistake children
   make with fractions is visible the moment you draw it: parts that are not
   equal, or a numerator counted off a different whole from the denominator.
   ------------------------------------------------------------------------*/
export function barFractions() {
  const W = 20, D = 4, Nn = 3;                // three quarters of 20
  const each = W / D;                          // 5
  const u = (n, tone) => Array.from({ length: n }, () => part("", 1, tone));
  return film({
    pics: {
      /* the whole, uncut */
      f0: () => modelSvg([{ parts: [part(String(W), W, "a")] }], { label: "One whole" }),
      /* cut into four equal parts: the DENOMINATOR is how many cuts */
      f1: () => modelSvg([{ parts: u(D, "a"), says: String(W) }], { label: "Cut into four" }),
      /* three of them shaded: the NUMERATOR is how many you take */
      f2: () => modelSvg([{ parts: [...u(Nn, "d"), ...u(D - Nn, "a")],
        above: [{ from: 0, to: Nn, text: `${Nn}/${D}` }], says: String(W) }], { label: "Three quarters" }),
      /* each part labelled, so the answer can be read off */
      f3: () => modelSvg([{ parts: [...Array.from({ length: Nn }, () => part(String(each), 1, "d")),
        ...Array.from({ length: D - Nn }, () => part(String(each), 1, "a"))],
        above: [{ from: 0, to: Nn, text: String(Nn * each) }], says: String(W) }], { label: "Read it off" }),
      /* and the trap: unequal parts are not fractions at all */
      f4: () => modelSvg([{ parts: [part("", 8, "q"), part("", 3, "q"), part("", 6, "q"), part("", 3, "q")],
        says: String(W) }], { label: "Not quarters" }),
    },
    lines: [
      { id: "d1", text: "BOTTOM = how many parts", x: 74, y: 12, c: 1, size: 2.3 },
      { id: "d2", text: "TOP = how many you take", x: 74, y: 19.6, c: 3, size: 2.3 },
      { id: "d3", text: `${W} ÷ ${D} = ${each}  (one part)`, y: 29, c: 0, size: 2.5 },
      { id: "d4", text: `${Nn} × ${each} = ${Nn * each}`, y: 36.6, c: 2, size: 2.5 },
    ],
    stages: {
      "f0.draw": (s, H) => { H.grow(mb(s, "bar")[0]); H.write(mb(s, "num")[0], 0.8); },
      "f1.cut": (s, H) => {
        mb(s, "bar").forEach((n, i) => (i ? H.grow(n, 0.2 + i * 0.35) : H.show(n)));
        H.draw(braceOf(s, "below-0-0"), 1.8);
      },
      "f2.shade": (s, H) => {
        const bars = mb(s, "bar");
        bars.forEach((n, i) => (i < Nn ? H.tint(n, bars[Nn].getAttribute("fill"), 0.3 + i * 0.4) : H.show(n)));
        H.draw(braceOf(s, "below-0-0"));
        H.draw(braceOf(s, "above-0-0"), 1.6);
      },
      "f3.each": (s, H) => {
        H.draw(braceOf(s, "below-0-0"));
        mb(s, "num").forEach((n, i) => H.write(n, 0.3 + i * 0.4));
      },
      "f3.tot": (s, H) => H.draw(braceOf(s, "above-0-0"), 0.2),
      "f4.bad": (s, H) => {
        mb(s, "bar").forEach((n, i) => H.grow(n, 0.2 + i * 0.3));
        H.draw(braceOf(s, "below-0-0"), 1.5);
      },
    },
    steps: ({ push, look }) => {
      push("A fraction is a bar cut into EQUAL parts. That is the whole idea, and the word equal is doing "
        + "all the work in it. Here is one whole — twenty sweets, say — drawn as a single bar.",
        { on: ["f0"], add: ["f0.draw"] });

      push("Now, three quarters of it. The BOTTOM number of a fraction tells you how many equal parts to "
        + "cut the whole into, so the four says: four parts, all the same size. Cut, cut, cut. Four pieces "
        + "of bar, and the brace still says twenty, because cutting never changed how much there is.",
        { on: ["f1", "d1"], off: ["f0"], add: ["f1.cut"] });

      push("And the TOP number says how many of those parts you take. Three. So I shade three of the four "
        + "— and that shaded stretch is three quarters. Not three sweets: three PARTS, and each part is "
        + "worth however much a quarter of twenty is.",
        { on: ["f2", "d2"], off: ["f1"], add: ["f2.shade"],
          look: look.brace("f2", "above-0-0"), lookAt: { lit: true, delay: 1.8, hold: 2.2 } });

      push(`So find one part first, always. Twenty shared into four is five, so each piece of bar is worth `
        + `five. Write it in every box — every one, because they are all the same size.`,
        { on: ["f3", "d3"], off: ["f2"], add: ["f3.each"],
          look: look.tile("d3"), lookAt: { delay: 1.8, hold: 2.0, to: 1.3 } });

      push(`And then take the three you wanted: three fives, fifteen. Three quarters of twenty is fifteen. `
        + "Notice the order — find ONE part, then multiply up. It is the same two moves as every other bar "
        + "model in this chapter, which is rather the point.",
        { on: ["d4"], add: ["f3.tot"] });

      push("Now the mistake, because it is worth seeing. Here is a bar cut into four — but LOOK at them. "
        + "That first piece is nearly three times the last. Four parts, yes. Quarters, no. If the parts "
        + "are not equal they are not fractions at all, and no amount of correct arithmetic afterwards "
        + "will rescue the picture.",
        { on: ["f4"], off: ["f3"], add: ["f4.bad"],
          look: look.mark("f4", "bar", 0), lookAt: { lit: true, delay: 1.6, hold: 2.4 } });

      push("So: bottom number, how many equal parts. Top number, how many you take. Find what ONE part is "
        + "worth, then multiply back up. And before you do any of it, check with your eye that the parts "
        + "really are the same size — because a bar model is only as honest as its cutting.",
        { off: ["f4"], on: ["f3", "d3", "d4"], add: [],
          play: (S) => { S.pulse("d1", 0.2); S.pulse("d2", 0.5); S.pulse("d3", 0.9); S.pulse("d4", 1.2); } });
    },
  });
}
