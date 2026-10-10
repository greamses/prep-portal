/* ============================================================================
   Algebra Workbook — PrepBot's videos: completing the square, and the machine
   ----------------------------------------------------------------------------
   Two videos on the shared teacher's TV (mental-math/shared/prepbot-tv.js),
   built from the same kit as the division ones (vedic explain.js `tile`, `art`,
   `acts`): a scene is written in hundredths of the screen, every step first
   LAYS the screen as it stood before it and then plays only its own change, so
   stepping back or skipping lands exactly where it should.

   COMPLETING THE SQUARE is the chapter's one picture, moving. x² + 6x is a
   square of side x with six strips beside it; three go along the bottom, three
   turn on their side and go up the edge, and then a corner is missing — three
   by three, nine ones. Fill it and the thing IS a square, of side x + 3. The
   algebra appears line by line beside the picture it came from, so that
   "halve the middle number and square it" is a thing the child has watched
   happen rather than a rule they were handed.

   THE MACHINE is the chapter's other one: a number climbs aboard at IN, every
   coach does its job, one number steps off at OUT. The card really travels —
   it stops at each coach and turns over into what that coach made of it — and
   then the same train is run backwards, which is the whole of working out an
   inverse.

   Both are 472-÷-3's cousins: one sum, worked slowly, with everything the
   paper shows on the screen at once.
   ========================================================================== */

import { tile, art, acts, PLAY } from "/prep-math/activity/vedic-maths-workbook/js/explain.js";
import { ICON_PREPBOT } from "/prep-math/mental-math/shared/icons.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** What opens a section: PrepBot and a play button — the method's name is the tooltip. */
export const videoStrip = (kind, label) =>
  `<div class="vm-video vm-video--icon has-video" data-algvideo="${kind}" data-title="${esc(label)}" tabindex="0" `
  + `aria-label="Watch PrepBot explain: ${esc(label)}" title="Watch PrepBot explain: ${esc(label)}">`
  + `<span class="vm-video__bot">${ICON_PREPBOT}</span>`
  + `<span class="vm-video__go">${PLAY}</span></div>`;

/* a hundredth of the screen's HEIGHT, in hundredths of its width (the screen is 16 : 9) */
const VH = 0.5625;
/** A distance across the screen, said as a distance DOWN it. */
const down = (w) => w / VH;

const INK = "#2a2723";
const num = (stage, id, text, x, y, c, sizeU = 3.3) =>
  tile(stage, id, String(text), x, y, { c }).firstChild.style.setProperty("font-size", `calc(var(--u) * ${sizeU})`);

/* ── the tiles the chapter is taught with ─────────────────────────────────
   The same three pieces as the paper (utils/components/workbook/tiles.js):
   the x² square in sky, the x strip in butter, the one in leaf. */
const SKY = ["#bfe3ff", "#2f6ea8"];
const BUTTER = ["#ffe9a8", "#c9922f"];
const LEAF = ["#c8f0c0", "#3f8f4f"];

const slab = (w, h, [fill, edge], label, fs) =>
  `<svg viewBox="0 0 ${w} ${h}"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="${fill}" stroke="${edge}" stroke-width="2"/>`
  + (label ? `<text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace"`
    + ` font-size="${fs}" font-weight="800" fill="${INK}">${label}</text>` : "")
  + `</svg>`;

/* ═══ completing the square ════════════════════════════════════════════════*/

function squareScene(b = 6, c = 5) {
  const h = b / 2;                       // half the middle number — the whole trick
  const corner = h * h;                  // what the corner holds
  const shift = corner - c;              // what has to be taken away again
  /* the house minus, not a hyphen: the paper writes −5 and so does the film */
  const neg = (v) => String(v).replace("-", "−");

  /* the figure, in hundredths of the screen's WIDTH; y is turned with down() */
  const A = 20;                          // the side of the x² square
  const U = A / 6;                       // one "1", and the thickness of a strip
  const OX = 9;                          // the figure's left edge
  const OY = down(10);                   // and its top

  const sq = { x: OX + A / 2, y: OY + down(A / 2) };
  /* the three strips along the bottom, and the three up the right-hand edge */
  const botAt = (i) => ({ x: OX + A / 2, y: OY + down(A + U / 2 + i * U) });
  const sideAt = (i) => ({ x: OX + A + U / 2 + i * U, y: OY + down(A / 2) });
  /* the loose strips, before they are put anywhere */
  const looseAt = (i) => ({ x: OX + A + 11 + (i % 2) * 9, y: OY + down(2 + Math.floor(i / 2) * 4.2) });
  /* the corner: h by h ones */
  const oneAt = (i) => ({
    x: OX + A + U / 2 + (i % h) * U,
    y: OY + down(A + U / 2 + Math.floor(i / h) * U),
  });

  const SIDE = A + h * U;                // the finished square's side, on screen

  /* the algebra, written up the right of the screen as each line is earned */
  const LX = 66;
  const line = (i) => down(13 + i * 8);

  const ids = {
    lines: ["e0", "e1", "e2", "e3", "e4", "e5"],
    strips: Array.from({ length: b }, (_, i) => `st${i}`),
    bots: Array.from({ length: h }, (_, i) => `bs${i}`),
    sides: Array.from({ length: h }, (_, i) => `sd${i}`),
    ones: Array.from({ length: corner }, (_, i) => `on${i}`),
  };
  const ALL = ["sum", "sq", "hole", "lx", "lh1", "lh2", "sideLab", ...ids.lines,
    ...ids.strips, ...ids.bots, ...ids.sides, ...ids.ones];

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    num(stage, "sum", `x² + ${b}x + ${c} = 0`, 50, down(3.6), 0, 4.4);

    art(stage, "sq", sq.x, sq.y, A, slab(100, 100, SKY, "x²", 30));
    /* the strips: loose ones to start with, and the ones that end up laid down
       and turned on their side — a tile cannot be rotated, so turning one IS
       the loose one going off and the standing one coming on */
    ids.strips.forEach((id, i) => { const p = looseAt(i); art(stage, id, p.x, p.y, A * 0.42, slab(100, 17, BUTTER, "x", 11)); });
    ids.bots.forEach((id, i) => { const p = botAt(i); art(stage, id, p.x, p.y, A, slab(100, 100 * (U / A), BUTTER, "x", 26)); });
    ids.sides.forEach((id, i) => { const p = sideAt(i); art(stage, id, p.x, p.y, U, slab(100 * (U / A), 100, BUTTER, "", 0)); });
    ids.ones.forEach((id, i) => { const p = oneAt(i); art(stage, id, p.x, p.y, U, slab(100, 100, LEAF, "", 0)); });

    /* the corner, outlined before it is filled: the hole is the question */
    art(stage, "hole", OX + A + (h * U) / 2, OY + down(A + (h * U) / 2), h * U,
      `<svg viewBox="0 0 100 100"><rect x="3" y="3" width="94" height="94" fill="none" stroke="${INK}"`
      + ` stroke-width="4" stroke-dasharray="11 9"/></svg>`);

    num(stage, "lx", "x", OX + A / 2, OY - down(2.6), 3, 3);
    num(stage, "lh1", String(h), OX + A + (h * U) / 2, OY - down(2.6), 4, 3);
    num(stage, "lh2", String(h), OX - 3.4, OY + down(A + (h * U) / 2), 4, 3);
    num(stage, "sideLab", `x + ${h}`, OX + SIDE / 2, OY + down(SIDE) + down(4.6), 2, 3.4);

    num(stage, "e0", `x² + ${b}x`, LX, line(0), 0, 3.6);
    num(stage, "e1", `x² + ${b}x + ${corner} = (x + ${h})²`, LX, line(1), 2, 3.4);
    num(stage, "e2", `x² + ${b}x + ${c} = (x + ${h})² − ${shift}`, LX, line(2), 1, 3.4);
    num(stage, "e3", `(x + ${h})² = ${shift}`, LX, line(3), 3, 3.6);
    num(stage, "e4", `x + ${h} = ${Math.sqrt(shift)}  or  x + ${h} = −${Math.sqrt(shift)}`, LX, line(4), 4, 3);
    num(stage, "e5", `x = ${neg(-h + Math.sqrt(shift))}  or  x = ${neg(-h - Math.sqrt(shift))}`, LX, line(5), 2, 3.8);
  };

  /* ── the script ─────────────────────────────────────────────────────────*/
  const events = [];
  let on = new Set();
  /* `off` is as load-bearing as `show`: a piece that was put away has to STAY
     away when a later step rebuilds the screen, or the loose strips sit there
     for the rest of the film beside the ones they turned into. */
  const push = (say, { show = [], off = [], play = () => {} } = {}) => {
    const before = new Set(on);
    show.forEach((id) => on.add(id));
    off.forEach((id) => on.delete(id));
    events.push({ say, before, after: new Set(on), show, play });
  };

  push(`We want to solve x² + ${b}x + ${c} = 0. The trouble is that x² + ${b}x is not a square — so let us make it one.`,
    { show: ["sum", "e0"] });
  push("Here is x². A square, of side x.", { show: ["sq", "lx"] });
  push(`And here are the ${b} x strips. Each one is x long.`, { show: ids.strips });
  push(`Share them between TWO sides of the square: ${h} along the bottom, and ${h} turned on their side up the edge. `
    + `That is why we HALVE the middle number.`,
    { show: [...ids.bots, ...ids.sides], off: ids.strips,
      play: (S) => {
        ids.strips.forEach((id, i) => {
          const to = i < h ? botAt(i) : sideAt(i - h);
          S.move(id, to.x, to.y, 0.2 + i * 0.18);
          S.hide(id, 1.5 + i * 0.1);
        });
        [...ids.bots, ...ids.sides].forEach((id, i) => S.pop(id, 1.6 + i * 0.1));
      } });
  push(`Now look at the corner. It is empty — and it is ${h} by ${h}.`, { show: ["hole", "lh1", "lh2"] });
  push(`So it takes ${corner} ones to fill it. ${h} squared. That is the number we have to add.`,
    { show: ids.ones, play: (S) => ids.ones.forEach((id, i) => S.pop(id, 0.4 + i * 0.12)) });
  push(`And now it IS a square — every side is x + ${h}. So x² + ${b}x + ${corner} is (x + ${h}) squared.`,
    { show: ["sideLab", "e1"], play: (S) => { S.pulse("sideLab", 0.3); S.pulse("e1", 0.6); } });
  push(`But we were not given + ${corner}. We were given + ${c}. We put ${corner} in, so we must take `
    + `${shift} back out: x² + ${b}x + ${c} is (x + ${h})² − ${shift}.`,
    { show: ["e2"], play: (S) => { S.dim("e1", 0.4, 0.2); ids.ones.slice(c).forEach((id, i) => S.dim(id, 0.35, 0.5 + i * 0.1)); } });
  push(`So the whole equation is (x + ${h})² − ${shift} = 0 — which says (x + ${h})² = ${shift}.`, { show: ["e3"] });
  push(`What number squared is ${shift}? There are two: ${Math.sqrt(shift)} and −${Math.sqrt(shift)}. `
    + `A square forgets the sign, so both have to be let back in.`,
    { show: ["e4"], play: (S) => S.pulse("e4", 0.4) });
  push(`Take the ${h} off each side. x = ${neg(-h + Math.sqrt(shift))}, or x = ${neg(-h - Math.sqrt(shift))}. `
    + `Two answers, and the order you say them in does not matter.`,
    { show: ["e5"], play: (S) => S.pulse("e5", 0.5) });

  const lay = (S, set) => ALL.forEach((id) => S.put(id, { on: set.has(id) ? 1 : 0 }));
  const steps = events.map((ev) => ({
    say: ev.say,
    show(stage, how) {
      const S = acts(stage, how.gsap, how.instant);
      lay(S, ev.before);
      /* the loose strips start where they started, every time */
      ids.strips.forEach((id, i) => { const p = looseAt(i); S.put(id, { on: ev.before.has(id) ? 1 : 0, x: p.x, y: p.y }); });
      ev.show.forEach((id, j) => { if (!ev.before.has(id)) S.pop(id, 0.3 + j * 0.18); });
      ev.play(S);
    },
  }));
  return { build, steps };
}

/* ═══ the function machine ═════════════════════════════════════════════════*/

const COACH = (job) =>
  `<svg viewBox="0 0 120 90"><rect x="4" y="10" width="112" height="56" fill="#fffdf8" stroke="${INK}" stroke-width="4"/>`
  + `<rect x="12" y="18" width="96" height="40" fill="#eaf4ff" stroke="#2f6ea8" stroke-width="3"/>`
  + `<text x="60" y="39" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace"`
  + ` font-size="26" font-weight="800" fill="${INK}">${job}</text>`
  + `<circle cx="30" cy="74" r="11" fill="#2a2723"/><circle cx="30" cy="74" r="4" fill="#f4c95d"/>`
  + `<circle cx="90" cy="74" r="11" fill="#2a2723"/><circle cx="90" cy="74" r="4" fill="#f4c95d"/></svg>`;

const ENGINE = `<svg viewBox="0 0 120 90"><rect x="6" y="26" width="52" height="40" fill="#2f6ea8" stroke="${INK}" stroke-width="4"/>`
  + `<rect x="58" y="12" width="46" height="54" fill="#c0453f" stroke="${INK}" stroke-width="4"/>`
  + `<rect x="18" y="6" width="14" height="22" fill="${INK}"/><circle cx="25" cy="4" r="7" fill="#f4c95d"/>`
  + `<circle cx="28" cy="74" r="11" fill="#2a2723"/><circle cx="28" cy="74" r="4" fill="#f4c95d"/>`
  + `<circle cx="80" cy="74" r="13" fill="#2a2723"/><circle cx="80" cy="74" r="5" fill="#f4c95d"/></svg>`;

const CARD = (n) =>
  `<svg viewBox="0 0 90 70"><rect x="3" y="3" width="84" height="64" fill="#fff3a8" stroke="${INK}" stroke-width="4"/>`
  + `<text x="45" y="37" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace"`
  + ` font-size="34" font-weight="800" fill="${INK}">${n}</text></svg>`;

const DOOR = (word) =>
  `<svg viewBox="0 0 90 46"><rect x="2" y="2" width="86" height="42" fill="#e8f6e4" stroke="#3f8f4f" stroke-width="3"/>`
  + `<text x="45" y="24" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace"`
  + ` font-size="19" font-weight="800" fill="${INK}">${word}</text></svg>`;

function trainScene(jobs = ["× 3", "+ 2"], ins = [4, 10]) {
  const doJob = (v, j) => (j[0] === "×" ? v * Number(j.slice(1)) : v + Number(j.slice(1)));
  /** What the card says after `k` coaches, starting from `x`. */
  const after = (x, k) => jobs.slice(0, k).reduce(doJob, x);
  const stops = [13, 36, 58, 80];        // IN, coach 1, coach 2, OUT — across the screen
  const RY = down(22);                   // the rails
  const CY = RY - down(9);               // where the card rides

  /* The card is a DRAWING, so it cannot be turned over the way a number tile is
     — `flip` would write text over the top of its picture. Its face is redrawn
     instead, and every step says where the card stands and what it says, so
     stepping back rebuilds it exactly. */
  const face = (stage, v) => {
    const n = stage.querySelector('[data-t="card"]')?.firstChild;
    if (n) n.innerHTML = CARD(v);
  };

  const ALL = ["title", "door0", "door1", "c0", "c1", "eng", "card", "f0", "f1", "f2", "r0", "r1"];

  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    num(stage, "title", "A function is a machine", 50, down(5), 0, 4.2);
    art(stage, "door0", stops[0], RY + down(7), 9, DOOR("IN"));
    art(stage, "door1", stops[3], RY + down(7), 9, DOOR("OUT"));
    art(stage, "c0", stops[1], RY, 13, COACH(jobs[0]));
    art(stage, "c1", stops[2], RY, 13, COACH(jobs[1]));
    art(stage, "eng", 93, RY, 12, ENGINE);
    art(stage, "card", stops[0], CY, 7, CARD(ins[0]));

    /* the captions are placed DOWN the screen directly — down() turns a width
       into a height, and using it on a number that was already a height sent
       every one of these clean off the bottom */
    num(stage, "f0", `${ins[0]} goes in`, 50, 63, 0, 3.2);
    num(stage, "f1", `${ins[0]} ${jobs[0]} = ${after(ins[0], 1)},   ${after(ins[0], 1)} ${jobs[1]} = ${after(ins[0], 2)}`, 50, 71, 2, 3.1);
    num(stage, "f2", "the machine is  3x + 2", 50, 79, 1, 3.4);
    num(stage, "r0", "backwards: undo each job, the other way round", 50, 87, 4, 3);
    num(stage, "r1", `${after(ins[0], 2)} − 2 = ${after(ins[0], 1)},   ${after(ins[0], 1)} ÷ 3 = ${ins[0]}`, 50, 94, 4, 2.9);
  };

  /* Every event says where the card STANDS and what it SAYS, so a step rebuilt
     from scratch puts it back exactly — which is what going back a step does. */
  const events = [];
  let on = new Set();
  let spot = 0;
  let val = ins[0];
  const push = (say, { show = [], play = () => {}, to = spot, says = val } = {}) => {
    const before = { on: new Set(on), spot, val };
    show.forEach((id) => on.add(id));
    spot = to;
    val = says;
    events.push({ say, before, show, play });
  };

  push("A function is a machine. Here it is drawn as a train: a number climbs aboard at IN, every coach does its "
    + "job to it, and one number steps off at OUT.",
    { show: ["title", "door0", "door1", "c0", "c1", "eng"] });
  push(`Put ${ins[0]} on the card, and stand it at IN.`,
    { show: ["card", "f0"], play: (S) => S.pulse("card", 0.5) });
  push(`The first coach says ${jobs[0]}. The card rides in, and comes out as ${after(ins[0], 1)}.`,
    { to: 1, says: after(ins[0], 1),
      play: (S, F) => { S.move("card", stops[1], CY, 0.3); F(after(ins[0], 1), 0.9); S.pulse("c0", 0.9); } });
  push(`The next coach says ${jobs[1]}. ${after(ins[0], 1)} ${jobs[1]} is ${after(ins[0], 2)}.`,
    { to: 2, says: after(ins[0], 2),
      play: (S, F) => { S.move("card", stops[2], CY, 0.3); F(after(ins[0], 2), 0.9); S.pulse("c1", 0.9); } });
  push(`And it steps off at OUT. ${ins[0]} went in; ${after(ins[0], 2)} came out.`,
    { to: 3, show: ["f1"], play: (S) => { S.move("card", stops[3], CY, 0.3); S.pulse("f1", 1.2); } });
  push(`Send another one through. ${ins[1]} goes in — ${ins[1]} ${jobs[0]} is ${after(ins[1], 1)}, and that ${jobs[1]} `
    + `is ${after(ins[1], 2)}. The SAME jobs every time: that is what makes it a machine and not a guess.`,
    { to: 3, says: after(ins[1], 2),
      play: (S, F) => {
        S.move("card", stops[0], CY, 0.1);
        F(ins[1], 0.4);
        S.move("card", stops[1], CY, 1.1);
        F(after(ins[1], 1), 1.8);
        S.move("card", stops[2], CY, 2.1);
        F(after(ins[1], 2), 2.8);
        S.move("card", stops[3], CY, 3.1);
      } });
  push("Written down, the machine is 3x + 2 — multiply by 3, then add 2. The order is the order of the coaches: "
    + "3(x + 2) would be a different train, and a different answer.",
    { show: ["f2"], play: (S) => S.pulse("f2", 0.5) });
  push("To go BACKWARDS, undo every job — and in the other order. Take the 2 away first, then divide by 3.",
    { show: ["r0"], play: (S) => { S.pulse("c1", 0.4); S.pulse("c0", 1.0); } });
  push(`So ${after(ins[0], 2)} comes back to ${ins[0]}. That is the inverse: the same train, ridden the other way.`,
    { to: 0, says: ins[0], show: ["r1"],
      play: (S, F) => {
        S.move("card", stops[2], CY, 0.3);
        F(after(ins[0], 1), 1.0);
        S.move("card", stops[1], CY, 1.2);
        F(ins[0], 2.0);
        S.move("card", stops[0], CY, 2.2);
        S.pulse("r1", 1.2);
      } });

  const steps = events.map((ev) => ({
    say: ev.say,
    show(stage, how) {
      const S = acts(stage, how.gsap, how.instant);
      /* The card's face is redrawn ON THE TIMELINE, never on a setTimeout: a
         step rebuilt instantly (going back, or skipping) must land on its own
         last face and not have an old timer repaint it a second later. */
      const F = (v, delay) => {
        if (how.instant || !how.gsap) { face(stage, v); return; }
        how.gsap.delayedCall(delay, () => face(stage, v));
      };
      ALL.forEach((id) => S.put(id, { on: ev.before.on.has(id) ? 1 : 0 }));
      face(stage, ev.before.val);
      S.put("card", { on: ev.before.on.has("card") ? 1 : 0, x: stops[ev.before.spot], y: CY });
      ev.show.forEach((id, j) => { if (!ev.before.on.has(id)) S.pop(id, 0.3 + j * 0.18); });
      ev.play(S, F);
    },
  }));
  return { build, steps };
}

/* ── the strip is tapped: the set comes up ───────────────────────────────── */

const SCENES = { square: squareScene, train: trainScene };

let tvOpen = false;
async function play(strip) {
  if (tvOpen) return;
  const made = (SCENES[strip.dataset.algvideo] || squareScene)();
  const sized = (stage) => {
    made.build(stage);
    stage.querySelector(".vm-tv").style.setProperty("--u", `${stage.clientWidth / 100}px`);
  };
  tvOpen = true;
  strip.classList.add("is-playing");
  try {
    const { openTv } = await import("/prep-math/mental-math/shared/prepbot-tv.js");
    await openTv({ title: strip.dataset.title || "", build: sized, steps: made.steps });
    const refit = () => {
      const st = document.querySelector(".mm-tv-overlay [data-tv='stage'] .vm-tv");
      if (st) st.style.setProperty("--u", `${st.parentElement.clientWidth / 100}px`);
    };
    window.addEventListener("resize", refit);
    document.addEventListener("fullscreenchange", refit);
    const watch = new MutationObserver(() => {
      if (document.querySelector(".mm-tv-overlay")) return;
      watch.disconnect();
      window.removeEventListener("resize", refit);
      document.removeEventListener("fullscreenchange", refit);
      tvOpen = false;
      strip.classList.remove("is-playing");
    });
    watch.observe(document.body, { childList: true });
  } catch (err) {
    tvOpen = false;
    strip.classList.remove("is-playing");
    console.error("PrepBot's TV could not be opened", err);
  }
}

if (typeof document !== "undefined" && !document.__algVideo) {
  document.__algVideo = true;
  const open = (e) => {
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    const strip = e.target.closest?.(".vm-video[data-algvideo]");
    if (!strip) return;
    e.preventDefault();
    play(strip);
  };
  document.addEventListener("click", open);
  document.addEventListener("keydown", open);
}
