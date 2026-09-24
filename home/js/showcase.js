/* ============================================================================
   HOME — what is actually inside, sorted into its trades
   ----------------------------------------------------------------------------
   Someone landing on the front page sees a hero, some faces and a price list,
   and leaves believing this is a shop for past questions. It is a workshop:
   balances you take weights off, trains you send numbers through, squares you
   build out of tiles, maps you drag states onto, a 3D lab bench, workbooks
   that print.

   So: a wall of SNAPSHOTS, in BANDS — one band per kind of thing, because a
   flat grid of a dozen cards says "a pile" and the bands say "a workshop with
   rooms in it". A band is a name on a sticky note and nothing else — the
   cards under it say what is in the room better than a sentence would.

   Two rules hold this file down:

   1. The CARD is the one this site already has — the games hub's and the
      blog's (.science-card on receipt paper, a sticky note for the tag,
      blogs/css/blog.css) — never a second card design.
   2. The PICTURE is the activity's OWN drawing, imported from the activity
      itself: the real balance from balanceart.js, the real train from
      machine.js, the real tiles, plane, clock, pie, pattern, map, lab bench.
      Nothing here is drawn twice. Where a thing has no drawing of its own
      (the exam CBT, the games hub, the blogs) the nav's section scene stands
      in, and where there is not even that, one of our own icons does.

   The drawings are fetched only when their band comes near the fold, so the
   front page still loads as a front page and not as six activities at once.
   ========================================================================== */

import NAV_CONFIG from "/utils/components/nav-config.js";
import UI from "/utils/components/ui-icons.js";
import { NAV_ICONS as I } from "/utils/components/nav-icons.js";

/* the big section illustration the nav already draws for a whole section */
const navScene = (text) => () => ({ svg: NAV_CONFIG.find((s) => s.text === text)?.image || "" });
/* One of our own icons, shown large, for a thing that has no drawing yet.
   A ui-icon is a function of its size (nav icons are plain strings), so both
   kinds are asked for the same way. */
const iconShot = (icon) => () => ({ icon: typeof icon === "function" ? icon() : icon });

const WB_CSS = "/utils/components/workbook.css";

/* ── the snapshots: each one asks the activity for its own picture ───────── */

const SHOT = {
  /* the balance the Algebra Workbook prints: 2 bags and 1 = 7, so a bag is 3 */
  balance: async () => {
    const { balanceSvg } = await import("/prep-math/activity/algebra-workbook/js/balanceart.js");
    return { svg: balanceSvg({ bags: 2, n: 1 }, { bags: 0, n: 7 }, { letter: "x", worth: { x: 3 }, label: "A balance scale: two bags and a 1 against a 7" }) };
  },
  /* the function-machine train, with a number already through it */
  train: async () => {
    const { trainHtml } = await import("/utils/components/workbook/machine.js");
    return { html: trainHtml({ given: ["*2", "+3"], inVal: 4, outVal: 11 }), css: WB_CSS };
  },
  /* x² and six x laid out, the corner waiting to be filled */
  tiles: async () => {
    const { tilesHtml } = await import("/utils/components/workbook/tiles.js");
    return { html: tilesHtml({ a: 3, given: { x2: true, strips: true }, label: "Algebra tiles with the corner empty" }), css: WB_CSS };
  },
  /* the plane the graphs chapter plots on */
  graph: async () => {
    const { planeSvg } = await import("/prep-math/activity/algebra-workbook/js/gridart.js");
    return { svg: planeSvg({ x: [-1, 6], y: [-1, 9], cell: 4.4, lines: [{ m: 1, c: 2, name: "y = x + 2" }], pts: [[0, 2], [2, 4], [4, 6]] }) };
  },
  /* base blocks: 2 hundreds, 3 tens, 4 ones */
  blocks: async () => {
    const { blocksSvg } = await import("/prep-math/activity/maths-workbook/js/blocks.js");
    return { svg: blocksSvg([4, 3, 2], 10, { maxCells: 34, label: "Base-ten blocks: two hundreds, three tens and four ones" }) };
  },
  /* tallies — one of the ways Number Match asks you to write a number */
  tally: async () => {
    const { tallySvg } = await import("/prep-math/activity/statistics-workbook/js/pictoart.js");
    return { svg: tallySvg(17, { h: 9 }) };
  },
  /* the clock the Maths Workbook tells the time on */
  clock: async () => {
    const { clockSvg } = await import("/prep-math/activity/maths-workbook/js/clock.js");
    return { svg: clockSvg(3, 20, { fives: true, label: "A clock face at twenty past three" }) };
  },
  /* a solid from the Geometry Workbook's chapter on prisms */
  solid: async () => {
    const { roundSvg } = await import("/prep-math/activity/geometry-workbook/js/solid.js");
    return { svg: roundSvg("cylinder", { w: 44, h: 46 }) };
  },
  /* the growing pattern the Algebra Workbook builds a rule from */
  pattern: async () => {
    const { patternSvg } = await import("/prep-math/activity/algebra-workbook/js/seqart.js");
    return { svg: patternSvg(3, 2, 4, { cell: 4.6, label: "Place 4" }) };
  },
  /* a pie chart with its key, straight out of the Statistics Workbook */
  pie: async () => {
    const { pieSvg } = await import("/prep-math/activity/statistics-workbook/js/pieart.js");
    return { svg: pieSvg({ angles: [120, 90, 60, 90], names: ["Maize", "Yam", "Rice", "Beans"], title: "What the farm grew" }) };
  },
  /* the code box the JavaScript Workbook writes in, with its console */
  codebox: async () => {
    const { codeHtml } = await import("/utils/components/workbook/code.js");
    return { html: codeHtml({ src: `let age = 14;
console.log(typeof age);`, file: "types.js", out: 1 }), css: WB_CSS };
  },
  /* the lab hub's own bench, now that the scene lives in a module */
  lab: async () => {
    const { LAB_SCENES } = await import("/virtual-lab/js/scenes.js");
    return { svg: LAB_SCENES.chemistry() };
  },
  bench: async () => {
    const { LAB_SCENES } = await import("/virtual-lab/js/scenes.js");
    return { svg: LAB_SCENES.biology() };
  },
  /* the map the jigsaw drops its 37 states into */
  map: async () => {
    const { mapFrameSvg } = await import("/exam-archive/national/puzzles/js/mapjig.js");
    return { svg: mapFrameSvg(true) };
  },
  /* the seeded picture a slider puzzle is cut out of */
  scene: async () => {
    const { sceneSvg } = await import("/exam-archive/national/puzzles/js/art.js");
    return { svg: sceneSvg("front-page") };
  },
  exams: navScene("Exams"),
  blogs: navScene("Blogs"),
  play: navScene("Activities"),
  writing: iconShot(UI.edit),
  theory: iconShot(I.tools),
  cards: iconShot(UI.cards),
  words: iconShot(I.competitions),
};

/* ── the wall, in bands ──────────────────────────────────────────────────── */

export const BANDS = [
  {
    tag: "Maths",
    cards: [
      { art: "balance", title: "Balance scales", tag: "Algebra", line: "Take the same off both pans and the bag gives itself up.", href: "/prep-math/activity/algebra-workbook/index.html" },
      { art: "train", title: "Function machines", tag: "Functions", line: "Put a number on the card and ride it coach by coach.", href: "/prep-math/activity/algebra-workbook/index.html" },
      { art: "tiles", title: "Completing the square", tag: "Algebra", line: "Lay x² and its strips, then fill the corner that is missing.", href: "/prep-math/activity/algebra-workbook/index.html" },
      { art: "graph", title: "Graphs of functions", tag: "Graphs", line: "Tap the points, rule the line, read the rule back off it.", href: "/prep-math/activity/algebra-workbook/index.html" },
      { art: "blocks", title: "Manipulatives", tag: "Number", line: "Blocks, abacuses, tiles and charts on one endless table.", href: "/prep-math/activity/base-blocks/index.html" },
      { art: "tally", title: "Number Match", tag: "Number", line: "Every way of writing one number, poured out as notes.", href: "/prep-math/activity/number-match/index.html" },
    ],
  },
  {
    tag: "Workbooks",
    cards: [
      { art: "clock", title: "Maths Workbook", tag: "Number", line: "Place value, sums, remainders, fractions, time, multiplying.", href: "/prep-math/activity/maths-workbook/index.html" },
      { art: "solid", title: "Geometry Workbook", tag: "Geometry", line: "Angles, polygons, Pythagoras, circles, solids and area.", href: "/prep-math/activity/geometry-workbook/index.html" },
      { art: "pattern", title: "Algebra Workbook", tag: "Algebra", line: "Bar models, balance scales, sequences, completing the square.", href: "/prep-math/activity/algebra-workbook/index.html" },
      { art: "pie", title: "Statistics Workbook", tag: "Statistics", line: "Pictograms, bar charts, line graphs, pie charts, scatter.", href: "/prep-math/activity/statistics-workbook/index.html" },
      { art: "codebox", title: "JavaScript Workbook", tag: "Code", line: "Learn to code: an editor and a console on the page.", href: "/prep-math/activity/js-workbook/index.html" },
    ],
  },
  {
    tag: "Science",
    cards: [
      { art: "lab", title: "Virtual Chemistry Lab", tag: "Chemistry", line: "Mix reagents, run a titration, watch it react on a real bench.", href: "/virtual-lab/chemistry/index.html" },
      { art: "bench", title: "Physics & Biology benches", tag: "Physics", line: "Pendulums, springs, cells and slides — being built now.", href: "/virtual-lab/index.html" },
      { art: "blogs", title: "Science & study blogs", tag: "Reading", line: "Animals, plants, the human body, and how to revise them.", href: "/blogs/index.html" },
    ],
  },
  {
    tag: "Writing",
    cards: [
      { art: "writing", title: "Writing evaluator", tag: "Essays", line: "Six families of writing, planned in a mnemonic and marked paragraph by paragraph.", href: "/writing/index.html" },
      { art: "words", title: "Word games", tag: "Words", line: "Hangman on science and maths words, and proof-reading races.", href: "/exam-archive/national/vocab/index.html" },
      { art: "theory", title: "Theory practice", tag: "Marked", line: "Write a full answer and have the marks explained, one by one.", href: "/theory-page/index.html" },
    ],
  },
  {
    tag: "Puzzles",
    cards: [
      { art: "map", title: "Map of Nigeria jigsaw", tag: "Jigsaw", line: "Drag all 37 states home before the clock runs out.", href: "/exam-archive/national/puzzles/index.html" },
      { art: "scene", title: "Sliders, tangrams, shikaku", tag: "Sliders", line: "A fresh picture cut up every game, and no two rooms alike.", href: "/exam-archive/national/puzzles/index.html" },
      { art: "play", title: "Games that drill", tag: "Games", line: "Times tables against the clock, and 3D worlds to play in.", href: "/home/games/index.html" },
    ],
  },
  {
    tag: "Exams",
    cards: [
      { art: "exams", title: "CBT papers", tag: "CBT", line: "Common Entrance, WASSCE, UTME, SAT and IGCSE style, on a clock.", href: "/exam-archive/national/exams/index.html" },
      { art: "cards", title: "AI flashcards", tag: "Revision", line: "A deck made from whatever you are revising, and kept.", href: "/flashcards/library.html" },
    ],
  },
];

/** Every card on the wall, band by band — what the checks count. */
export const SHOWCASE = BANDS.flatMap((b) => b.cards.map((c) => ({ ...c, band: b.tag })));

/* the same arrow the games hub ends its cards with */
const ARROW = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>`;

const cardHtml = (s, c) =>
  `<a class="science-card pp-receipt science-card--p${c} shot" href="${s.href}">` +
  `<div class="card-inner pp-receipt__paper">` +
  `<span class="shot__frame" data-shot="${s.art}"></span>` +
  `<div class="card-badges"><span class="pp-sticky pp-sticky--c${c}">${s.tag}</span></div>` +
  `<h3 class="card-title">${s.title}</h3>` +
  `<p class="card-excerpt">${s.line}</p>` +
  `<div class="read-more">Open it ${ARROW}</div>` +
  `</div></a>`;

const bandHtml = (b, i) =>
  `<section class="band">` +
  `<header class="band__head">` +
  `<h3 class="band__tag pp-sticky pp-sticky--c${i % 6}">${b.tag}</h3>` +
    `</header>` +
  `<div class="science-grid showcase-grid">${b.cards.map((card, j) => cardHtml(card, (i + j) % 6)).join("")}</div>` +
  `</section>`;

/* ── filling in the pictures ─────────────────────────────────────────────── */

/**
 * An HTML picture (the train, the tiles) needs the workbook's own stylesheet,
 * and that sheet styles `body`. So it goes in a shadow root: the sheet applies
 * to the picture and to nothing else on the page. The picture is drawn at
 * paper size, so it is then scaled down to the width of the card.
 */
function mountHtmlArt(frame, { html, css }) {
  const root = frame.attachShadow({ mode: "open" });
  root.innerHTML =
    `<link rel="stylesheet" href="${css}">` +
    `<style>:host{display:block;position:relative;overflow:hidden}` +
    `.fit{position:absolute;top:0;left:0;transform-origin:top left;width:max-content}` +
    /* a snapshot shows the thing, not the tray of spare pieces beside it */
    `.tl-tray,.fm-tray{display:none}</style>` +
    `<div class="fit">${html}</div>`;
  const box = root.querySelector(".fit");
  const fit = () => {
    const w = box.scrollWidth;
    const h = box.scrollHeight;
    const room = frame.clientWidth;
    const tall = frame.clientHeight;
    if (!w || !h || !room || !tall) return;
    /* the frame is a fixed window, so the picture is fitted both ways */
    const k = Math.min(1, (room - 8) / w, (tall - 8) / h);
    box.style.transform = `scale(${k})`;
    box.style.left = `${Math.max(0, (room - w * k) / 2)}px`;
    box.style.top = `${Math.max(0, (tall - h * k) / 2)}px`;
  };
  root.querySelector("link").addEventListener("load", () => requestAnimationFrame(fit));
  /* the sheet may already be cached, in which case load never fires late */
  requestAnimationFrame(fit);
  setTimeout(fit, 400);
  addEventListener("resize", fit, { passive: true });
}

/** Ask one frame's activity for its drawing. */
export async function drawShot(frame) {
  const make = SHOT[frame.dataset.shot];
  if (!make || frame.dataset.drawn) return false;
  frame.dataset.drawn = "1";
  try {
    const art = await make();
    if (art.icon) {
      frame.innerHTML = `<span class="shot__icon">${art.icon}</span>`;
    } else if (art.svg) {
      frame.innerHTML = art.svg;
    } else if (art.html) {
      mountHtmlArt(frame, art);
    }
    frame.classList.add("is-drawn");
    return true;
  } catch (err) {
    /* a picture that will not load must not take the card with it */
    frame.remove();
    return false;
  }
}

/** Draw the wall into `.showcase-bands` — the site's own card, one per thing. */
export function mountShowcase(root = document) {
  const wall = root.querySelector(".showcase-bands");
  if (!wall) return 0;
  wall.innerHTML = BANDS.map(bandHtml).join("");

  const frames = [...wall.querySelectorAll(".shot__frame")];
  if (typeof IntersectionObserver === "function") {
    const eye = new IntersectionObserver((rows, obs) => {
      rows.forEach((row) => {
        if (!row.isIntersecting) return;
        obs.unobserve(row.target);
        drawShot(row.target);
      });
    }, { rootMargin: "400px 0px" });
    frames.forEach((f) => eye.observe(f));
  } else {
    frames.forEach(drawShot);
  }
  return SHOWCASE.length;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountShowcase());
  else mountShowcase();
}
