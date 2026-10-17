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
import { moneySvg, bill, billSvg } from "./purse.js";
import { down, num, esc } from "./video-kit.js";
import { stackText } from "./stackfrac.js";

/** The marks of a model, addressed the way the drawing names them. */
export const mb = (svg, kind, row = null) => [...(svg
  ? svg.querySelectorAll(`[data-mb="${kind}"]${row == null ? "" : `[data-mb-row="${row}"]`}`)
  : [])];
export const braceOf = (svg, key) => (svg ? svg.querySelector(`[data-mb="brace"][data-mb-key="${key}"]`) : null);
/** Another picture's drawing — the cut has to be made where the parts divide. */
export const svgIn = (stage, id) => stage.querySelector(`[data-t="${id}"] svg`);
export const MARKS = '[data-mb="bar"], [data-mb="num"], [data-mb="name"], [data-mb="brace"], '
  + '[data-mb="cut"], [data-mb="ctr"], [data-mb="cell"]';
export const SVGNS = "http://www.w3.org/2000/svg";

/* Where the left end and the top edge of EVERY bar sit, in width-units. The
   bars are not at the left margin: a model with row names keeps them in a
   column 17mm WIDE of its own bars, and that column has to be on the screen
   too, or the names run off the edge. */
export const BAR_X = 9;
export const BAR_Y = 20;
export const PIC_W = 47;        // how wide a FULL-WIDTH picture is drawn, in width-units
export const PAPER_MM = 150;    // and how many millimetres of paper that is

/**
 * A model placed by its own first bar rather than by its middle.
 *
 * The drawing is read for its viewBox and the corner of its first bar, both of
 * which are in the markup, so this needs no layout and works at build time.
 */
export function artAt(stage, id, html, widthU, at = {}, paperMm = PAPER_MM) {
  /* A VIEWBOX NEED NOT START AT THE ORIGIN. The fraction bar starts its at
     -0.6 -0.6, to give its own frame room to be drawn without being clipped,
     and a pattern that insisted on "0 0" silently fell through to the
     fallback — so every fraction bar was laid out as though it were a
     150mm sheet and came out twice the size it should be. */
  const vb = /viewBox="(-?[\d.]+)[ ,]+(-?[\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)"/.exec(html);
  const bar = /<rect[^>]*data-mb="bar"[^>]*>/.exec(html);
  const [mx, my, vw, vh] = vb
    ? [Number(vb[1]), Number(vb[2]), Number(vb[3]), Number(vb[4])]
    : [0, 0, 150, 50];
  const bx = bar ? Number(/ x="(-?[\d.]+)"/.exec(bar[0])?.[1] ?? 0) : 0;
  const by = bar ? Number(/ y="(-?[\d.]+)"/.exec(bar[0])?.[1] ?? 0) : 0;
  /* ONE RULER FOR EVERY PICTURE, and it is the paper the model was laid out
     on. Stretching each drawing to a fixed tile width instead magnifies the
     narrow ones: four little fraction parts, 30mm of paper, came out with
     bars five times the height of the bars in the film before them, and the
     figures in them five times the size. A millimetre is a millimetre. */
  const k = widthU / paperMm;                  // width-units per millimetre of paper
  const w = vw * k;                            // what this drawing is, at that ruler
  const h = vh * k;
  /* a tile is centred on its point, so its own middle is half a tile back
     from where the bar has to land */
  /* a film with several bars on the screen at once says where each one
     hangs; one with a single drawing leaves them all at the same corner */
  const x0 = at.x ?? BAR_X, y0 = at.y ?? BAR_Y;
  /* the bar's corner is measured from the viewBox's own corner, not from the
     origin, or a drawing with a margin round it hangs by that margin */
  return art(stage, id, x0 + w / 2 - (bx - mx) * k, down(y0 + h / 2 - (by - my) * k), w, html);
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

export const CT = { 100: ["#8fd39a", "#3f8f4f"], 10: ["#6fb7e8", "#2a6ca8"], 1: ["#f4c95d", "#c9922f"] };

/**
 * Lay `list` of counters inside `bar`, hidden, and give each one a number so a
 * step can deal them in order. Returns the <g> elements, in dealing order.
 *
 *   list   the worths, e.g. [100, 100, 10, 10, 10]
 *   from   what the first one's data-bit should be, so two bars can be dealt
 *          into alternately and still be one run of numbers
 */
export function pourInto(svg, bar, list, from = 0, box = null) {
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
    g.setAttribute("data-worth", String(worth));
    /* which BOX it was shared into, so that box's counters can turn into its
       number without disturbing anybody else's */
    if (box != null) g.setAttribute("data-box", String(box));
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

/**
 * MONEY SHARED INTO THE BARS, note by note.
 *
 * The user asked for this in as many words: *"The money should be shared in
 * the bars like the counters."* Dealt onto a table beside the model, the
 * notes are a second picture, and the child has to hold the bars in their
 * head while they count a pile that is nowhere near them. Dealt INTO the
 * boxes, the bar fills up with real money and the answer is a thing you can
 * see lying there before anybody writes a figure.
 *
 * A note is one of the till's own notes (`billSvg`), nested as its own
 * little `<svg>` so it keeps its proportions, and it wears `data-mb="ctr"`
 * like any other piece: one kind of thing goes in a box, and every step that
 * knows how to deal, fade or count a counter already knows how to deal, fade
 * and count money.
 */
export function pourNotes(svg, bar, list, from = 0, box = null) {
  if (!svg || !bar || !list.length) return [];
  const x = +bar.getAttribute("x"), y = +bar.getAttribute("y");
  const w = +bar.getAttribute("width"), h = +bar.getAttribute("height");
  const rows = list.length > 4 ? 2 : 1;
  const per = Math.ceil(list.length / rows);
  /* a note is twice as wide as it is tall, so whichever of the box's two
     measures runs out first is the one that decides how big it can be */
  const nw = Math.min((w / per) * 0.9, (h / rows) * 0.84 * 2);
  const nh = nw / 2;
  const gapX = w / per, gapY = h / rows;
  const made = [];
  list.forEach((worth, i) => {
    const col = i % per, row = Math.floor(i / per);
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("data-mb", "ctr");
    g.setAttribute("data-bit", String(from + i));
    g.setAttribute("data-worth", String(worth));
    if (box != null) g.setAttribute("data-box", String(box));
    g.style.opacity = "0";
    /* THE NAMESPACE HAS TO BE SAID OUT LOUD HERE. The till writes its notes
       to be dropped into a page, where an <svg> needs no xmlns; read back as
       XML without one, every mark in the note lands in NO namespace and comes
       out as a bare Element with no .style for the hand to animate. */
    const doc = new DOMParser().parseFromString(
      billSvg(worth).replace("<svg", `<svg xmlns="${SVGNS}"`), "image/svg+xml");
    const note = svg.ownerDocument.importNode(doc.documentElement, true);
    /* the till draws its notes in MILLIMETRES, which is right on paper and
       wrong inside another drawing: in here a number is a drawing unit, so
       the note is given its place and its size in the model's own measures */
    note.removeAttribute("class");
    note.setAttribute("x", (x + gapX * (col + 0.5) - nw / 2).toFixed(2));
    note.setAttribute("y", (y + gapY * (row + 0.5) - nh / 2).toFixed(2));
    note.setAttribute("width", nw.toFixed(2));
    note.setAttribute("height", nh.toFixed(2));
    g.appendChild(note);
    svg.appendChild(g);
    made.push(g);
  });
  return made;
}

/** What is lying in the boxes of a drawing, in prepbills or in counters. */
export const worthIn = (svg) => [...(svg ? svg.querySelectorAll('[data-mb="ctr"]') : [])]
  .reduce((t, n) => t + (Number(n.dataset.worth) || 0), 0);

/** The counters in one box, in the order they were dealt into it. */
export const inBox = (svg, box) => [...(svg ? svg.querySelectorAll(`[data-mb="ctr"][data-box="${box}"]`) : [])];

/** The counters already poured into a drawing, in the order they were dealt. */
export const CTR = '[data-mb="ctr"]';
export const pouredIn = (svg) => [...(svg ? svg.querySelectorAll('[data-mb="ctr"]') : [])]
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
export function hand(gsap, instant) {
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
  /* THE ORIGIN GOES IN THE TWEEN'S OWN VARS, AT BOTH ENDS OF IT.
     Setting it beside the tween and hoping it sticks is what made Tom's bar
     hang out in the middle of the screen while it grew and then snap home
     when the tween ended: a `fromTo` renders its starting state at once and
     builds its own transform record doing so, and an origin written a moment
     earlier is not part of that record. Spread `from(n)` into the from-vars
     AND the to-vars and there is one record, saying the same thing
     throughout. */

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
      away: (nodes) => [...(nodes || [])].forEach((n) => n.remove()),
      wipe: (n, to) => { if (n) n.setAttribute("fill", to); },
      slide: (n, to) => {
        if (!n || !to) return;
        n.setAttribute("x", to.getAttribute("x"));
        n.setAttribute("y", to.getAttribute("y"));
      },
      focus: () => {}, lit: () => {}, both: () => {},
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
      const o = from(n, "left");
      gsap.fromTo(n, { scaleX: 0, ...o },
        { scaleX: 1, ...o, duration: 0.6, delay, ease: "power2.out", onComplete: settle(n) });
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
      const o = from(n);
      gsap.fromTo(n, { opacity: 0, scale: 0.3, yPercent: -40, ...o },
        { opacity: 1, scale: 1, yPercent: 0, ...o, duration: 0.34, delay, ease: "back.out(2)", onComplete: settle(n) });
    },
    /**
     * PIECES TAKEN OFF AT THE MOMENT THE FIGURE REPLACES THEM.
     *
     * Clearing the whole table and then writing the numbers in one at a time
     * leaves the last box empty for over a second, and an empty box where
     * four hundreds were a moment ago reads as the money having gone
     * missing. Each box's counters go as that box's figure arrives, so the
     * counters are plainly BECOMING the number rather than being swept away
     * before it.
     */
    away(nodes, delay = 0) {
      const list = [...(nodes || [])];
      if (!list.length) return;
      gsap.to(list, {
        opacity: 0, scale: 0.55, duration: 0.22, delay, ease: "power1.in",
        onComplete: () => list.forEach((n) => n.remove()),
      });
    },
    /**
     * A MARK LOSING ITS COLOUR WHERE IT STANDS — the other way round from
     * `tint`, which brings a mark up to the colour the drawing gave it. A
     * part that is taken away is not rubbed out: it goes pale, so the child
     * can still see that it was there.
     */
    wipe(n, to, delay = 0) {
      if (!n) return;
      gsap.to(n, { fill: to, duration: 0.4, delay, ease: "power1.inOut" });
    },
    /**
     * A PIECE CARRIED FROM ONE BAR TO THE OTHER, and set down in its place.
     *
     * *"Show the two bars first, then move the second piece to the first bar
     * to show how much was added or removed."* Swapping in a finished picture
     * of five sixths asserts the answer; watching two sixths leave the bottom
     * bar and come to rest in the gap on the top one IS the addition, and the
     * child can see that nothing changed size on the way.
     */
    slide(n, to, delay = 0, hold = 0.55) {
      if (!n || !to) return;
      gsap.to(n, {
        attr: { x: to.getAttribute("x"), y: to.getAttribute("y") },
        duration: hold, delay, ease: "power2.inOut",
      });
    },
    /** A mark pointed at: a small, quick swell. */
    mark(n, delay = 0) {
      if (!n) return;
      n.style.opacity = "1";
      /* a bar is anchored at its left edge, here as everywhere else */
      const o = from(n, n.dataset && n.dataset.mb === "bar" ? "left" : "center");
      gsap.fromTo(n, { scale: 1, ...o },
        { scale: 1.05, ...o, duration: 0.22, delay, yoyo: true, repeat: 1, ease: "power1.inOut", onComplete: settle(n) });
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
      /* WORDS AND FIGURES ARE POINTED AT WITH COLOUR, NEVER BY SWELLING.
         Text is set against something — the box it sits in, the column it is
         written down — so growing it alone pushes it out of line with its own
         bar, or past the edge of the screen when it is already near it. Only
         a SHAPE may be scaled, or a shape and its figure together. */
      if (n.tagName === "text" || !inSvg(n)) { this.lit(n, delay, hold); return; }
      /* A BAR SWELLS ABOUT ITS LEFT EDGE, never its middle. Every bar in a
         model is anchored at the left — that is the rule that lets two of
         them be compared at all — so swelling one about its centre walks its
         left end out of the column and it looks as if it has come unstuck,
         then snaps back when the swell ends. */
      const o = from(n, n.dataset && n.dataset.mb === "bar" ? "left" : "center");
      gsap.timeline({ delay, onComplete: settle(n) })
        .to(n, { scale: to, ...o, duration: 0.4, ease: "back.out(1.7)" })
        .to(n, { scale: 1, ...o, duration: 0.4, ease: "power2.inOut" }, `+=${hold}`);
    },
    /**
     * A BAR AND THE FIGURE IN IT, swelled together — both about the BAR's
     * middle, so the figure stays where it is in its box the whole way
     * through instead of drifting across it.
     */
    both(bar, n, delay = 0, hold = 1.7, to = 1.18) {
      if (!bar) return;
      [bar, n].filter(Boolean).forEach((m) => { m.style.opacity = "1"; });
      /* and a bar with its figure swells about the BAR's left edge, for the
         same reason — the figure rides along so it keeps its place in the box */
      const o = inSvg(bar) ? { svgOrigin: originOf(bar, "left") } : { transformOrigin: "0% 50%" };
      [bar, n].filter(Boolean).forEach((m) => {
        gsap.timeline({ delay, onComplete: settle(m) })
          .to(m, { scale: to, ...o, duration: 0.4, ease: "back.out(1.7)" })
          .to(m, { scale: 1, ...o, duration: 0.4, ease: "power2.inOut" }, `+=${hold}`);
      });
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
        /* three kinds of mark, three ways of taking a colour: a line of
           working is coloured text, a figure in a box is a filled glyph, and
           a brace is a drawn stroke with its words on it */
        if (!inSvg(n)) { n.style.color = v; return; }
        const marks = n.tagName === "g" ? [...n.querySelectorAll("path, text")] : [n];
        marks.forEach((m) => {
          if (m.tagName === "text") m.style.fill = v;
          else { m.style.stroke = v; m.style.strokeWidth = v ? "0.9" : ""; }
        });
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
      const o = from(n);
      gsap.fromTo(n, { opacity: 0, scale: 0.35, ...o },
        { opacity: 1, scale: 1, ...o, duration: 0.36, delay, ease: "back.out(2.4)", onComplete: settle(n) });
    },
    /* A BRACE IS DRAWN ACROSS what is already there, so it is drawn the way a
       line is drawn: the stroke itself runs from one end to the other, and the
       words land on it once it has arrived. Nothing is scaled, so nothing can
       end up spanning the wrong bars. */
    draw(g, delay = 0) {
      if (!g) return;
      g.style.opacity = "1";
      const path = g.querySelector("path");
      /* ALL of the words, not the first of them: a brace labelled with a
         stacked fraction carries two figures and a rule, and fading in only
         the numerator leaves the fraction half-written */
      const label = [...g.querySelectorAll("text")];
      if (path) {
        const len = path.getTotalLength();
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
          strokeDashoffset: 0, duration: 0.55, delay, ease: "power2.out",
          onComplete() { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; },
        });
      }
      if (label.length) gsap.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: delay + 0.42 });
    },
    /* "?" becoming 12. The box does not empty and refill: the figure turns
       over in place, so it is plainly the same box being answered. */
    flip(n, text, delay = 0) {
      if (!n) return;
      const o = from(n);
      gsap.timeline({ delay, onComplete: settle(n) })
        .set(n, { opacity: 1, ...o })
        .to(n, { scaleY: 0, ...o, duration: 0.16, ease: "power1.in" })
        .add(() => { n.textContent = text; })
        .to(n, { scaleY: 1, ...o, duration: 0.3, ease: "back.out(2.2)" });
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
export function film({ pics = {}, picAt = {}, trays = {}, trayAt = {}, stages = {}, lines = [],
  asks = [], paperMm = PAPER_MM, picW = PIC_W, build: extra = null, steps: write }) {
  const PIC_IDS = Object.keys(pics);
  const TRAY_IDS = Object.keys(trays);
  const LINE_IDS = lines.map((l) => l.id);
  const ASK_IDS = asks.map((a) => a.id);
  const TILES = [...PIC_IDS, ...TRAY_IDS, ...LINE_IDS, ...ASK_IDS, "q", "rule"];

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
    PIC_IDS.forEach((id) => artAt(stage, id, pics[id](), picW, picAt[id], paperMm));
    /* a tray is an ordinary row of pieces, so it hangs where the bars are
       rather than being measured from a first bar it has not got */
    TRAY_IDS.forEach((id) => {
      /* a tray that has to hang UNDER a drawing says so, because the drawing
         is still on the screen and money dealt over the bars is money the
         child cannot see */
      const at = trayAt[id] || {};
      art(stage, id, at.x ?? 30, down(at.y ?? 27), at.w ?? 46, trays[id]());
    });
    asks.forEach((a) => asked(stage, a.id, a.text));
    /* THE WORKING STANDS IN A COLUMN OF ITS OWN, clear of the drawing.
       Centred tiles grew towards the picture as their text got longer, so a
       line nobody had measured ended up written across the bars. The column
       is anchored by its LEFT edge at SIDE_X and given a width to wrap in,
       which is a thing a teacher's board has and a stage had not. */
    lines.forEach((l) => side(stage, l.id, l.text, l.x ?? SIDE_X, l.y, l.c ?? 0, l.size ?? 2.5));
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
        if (!svg) return;
        /* COUNTERS COME OFF THE TABLE, they are not merely hidden.
           A counter is not part of the drawing: the stage that pours them
           makes them, and it makes a fresh set every time the step is
           replayed. Hiding the old set left it lying in the drawing, so
           after stepping back and forward twice there were three sets, one
           live and two dead; the dealing order picks counters by the order
           they were dealt, found three counters claiming to be the first
           one, and revealed a dead one while the live one stayed invisible.
           What the child saw was a box she had just watched being filled
           standing empty. */
        svg.querySelectorAll('[data-mb="ctr"]').forEach((n) => n.remove());
        svg.querySelectorAll(MARKS).forEach((n) => { n.style.opacity = "0"; });
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
        if (n) {
          if (o.lit) H.lit(n, o.delay || 0.2, o.hold || 1.7);
          else if (o.with) H.both(n, o.with(stage), o.delay || 0.2, o.hold || 1.7, o.to || 1.18);
          else H.focus(n, o.delay || 0.2, o.hold || 1.7, o.to || 1.22);
        }
      }
      ev.play(S, H, stage);
    },
  }));
  return { build, steps };
}

/* Where the working column starts, and how wide it may run. The drawing ends
   at about 56 across the screen, so 62 leaves a clear gutter between the two
   and 36 of width carries about fourteen characters a line at this size. */
export const SIDE_X = 59;
export const SIDE_W = 39;

/**
 * THE WORD PROBLEM, WRITTEN UP FIRST.
 *
 * *"Always write the word problem first to show what we are answering."* A
 * bar model is a way of reading a question, so a film that opens on a bar
 * has skipped the only part the child has to do by themselves. The words
 * stand across the top of the screen for as long as that example runs, and
 * every figure that follows can be checked back against them.
 */
export /**
 * WHAT A TILE SAYS, with its fractions written one figure over the other.
 * `tile` sets text, not markup, which is right for a figure and wrong for a
 * fraction — so the words are escaped first and the fractions built after,
 * which is the only order that is safe.
 */
const says = (box, text) => {
  const html = stackText(esc(String(text)));
  box.firstChild.innerHTML = html;
  /* a line holding a two-storey fraction needs the room for it, or the line
     above comes down on top of the numerator */
  if (html.includes('class="sf"')) box.firstChild.style.lineHeight = "2.05";
  return box;
};

export function asked(stage, id, text) {
  /* clear of the step counter in the top corner, and narrower than the
     screen: a line of words running the full width of a television is a line
     nobody finishes reading */
  const box = tile(stage, id, String(text), 52, down(7.5), { c: 0 });
  box.classList.add("vm-t--wrap");
  box.style.setProperty("--w", "74");
  box.firstChild.style.setProperty("font-size", "calc(var(--u) * 2)");
  box.firstChild.style.setProperty("font-weight", "700");
  return says(box, text);
}

/**
 * A line of the working: left-anchored in its column, and allowed to WRAP.
 *
 * `num` centres its tile and never wraps, which is right for a figure on its
 * own and wrong for a sentence — a centred sentence grows both ways, and the
 * way it grows is into the picture.
 */
export function side(stage, id, text, x, y, c, sizeU) {
  const box = tile(stage, id, String(text), x, down(y), { c });
  box.classList.add("vm-t--left", "vm-t--wrap");
  box.style.setProperty("--w", `${SIDE_W}`);
  box.firstChild.style.setProperty("font-size", `calc(var(--u) * ${sizeU})`);
  return says(box, text);
}

/**
 * Run a colour down a list of lines, one after another.
 *
 * The recap at the end of a film used to PULSE them, which scales the tile —
 * and a tile already near the right-hand edge grows straight off it. Colour
 * says the same thing and cannot move anything.
 */
export const runLit = (H, stage, ids, gap = 0.35, hold = 1.1) =>
  ids.forEach((id, i) => H.lit(stage.querySelector(`[data-t="${id}"]`)?.firstChild, 0.2 + i * gap, hold));

/* the parts a model is made of, written the way the drawing wants them */
export const part = (text, value, tone) => ({ text, value, tone });
export const ask = (value, tone) => part("?", value, tone);

/** One pile, one denomination: notes laid over one another, newest on top. */
export function stackOf(worth, n, { x = 0, label = "" } = {}) {
  return `<div class="vm-stack" style="--n:${n}">`
    + `<span class="vm-stack__lab">${esc(label || `×${n}`)}</span>`
    + `<span class="vm-stack__pile">`
    + Array.from({ length: n }, (_, i) =>
      `<span class="vm-stack__one" data-bit="${x + i}" style="--i:${i}">${moneySvg(bill(worth), { max: 1 })}</span>`).join("")
    + `</span></div>`;
}

