/* ============================================================================
   GRAPHIC ORGANISERS — the shapes a lesson thinks in
   ----------------------------------------------------------------------------
   The first version of this was a list of headed boxes, which is a form and
   not an organiser. An organiser is a SHAPE: the burger says a paragraph has
   a top, a filling and a bottom; the mountain says a story climbs, turns and
   comes down; the two circles say what is the same and what is not. A child
   who fills one in has been taught something by the shape before they write
   a word, and that is the whole reason the things exist.

     burger      the paragraph: topic sentence, the filling, closing sentence
     mountain    the story: opening, build-up, climax, falling, ending
     table       rows and columns, for anything that is a comparison in a grid
     venn        two circles: this only, both, that only
     roundabout  the story's parts round a middle: five circles and a hub

   TWO WAYS TO WRITE ON ONE, and a child may use either on the same sheet.

     TYPING      every region of the shape is a box you type straight into.
     STICKY NOTES  a PIN goes down first, where the note should be; the note
                 is then written on it. Notes hang off pins rather than
                 floating free, and that is what makes the board behave: a
                 pin knows how far it is from its neighbours, so its note is
                 given a width that will not run into them and a tilt of its
                 own — an idea board, not a tidy grid of rectangles.

   The notes are the site's own sticky notes (sticky-note.js), written with
   the site's own editor (sticky-note-editor.js), so the writing is formatted
   the way it is formatted everywhere else: face, size, bold, colour, and an
   equation if the thought needs one.

   It is WORKING PAPER, never marked, like the bar model board and the
   counters. What a child decides here goes in the answer boxes beside it.
   ========================================================================== */

import {
  makeNote, layoutNote, paintSticky, PAPERS, TILT,
} from "/utils/components/sticky-note.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const INK = "#2a2723";

/**
 * THE SHEET IS THREE BY TWO, AND A CIRCLE MUST STILL BE A CIRCLE.
 *
 * Every shape is drawn in a 0–100 box stretched over the sheet, which is what
 * lets a field be placed in plain percentages and land exactly on the part of
 * the drawing it belongs to. The price is that a `<circle>` comes out an egg —
 * and a Venn diagram of two eggs is not a Venn diagram. So anything round is
 * drawn as an ellipse that is round AFTER the stretch, and anything placed
 * round a ring is placed the same way.
 */
const ASPECT = 3 / 2;
const circ = (cx, cy, r, fill, extra = "") =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${(r / ASPECT).toFixed(2)}" ry="${r}" fill="${fill}"`
  + ` vector-effect="non-scaling-stroke"${extra}/>`;
/** A point on a ring that looks like a ring, not an oval. */
const ring = (cx, cy, r, i, n) => {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return [cx + (Math.cos(a) * r) / ASPECT, cy + Math.sin(a) * r];
};

/* ── the shapes ──────────────────────────────────────────────────────────
   Every field is placed in PERCENTAGES of the sheet, so one organiser is one
   drawing at any size — on a phone, in a panel, on a board at the front. */

/* ── the shapes, in line ─────────────────────────────────────────────────
   THEY ARE DRAWN, NOT FILLED. A shape with a colour in it is a picture of a
   burger; a shape in outline is a thing to write inside — which is what
   these are for, and what they look like when they come off a printer. Only
   the pencil is on the paper. */
/* `non-scaling-stroke` is doing real work here. The 0–100 box is stretched
   over a 3:2 sheet, so without it a stroke comes out half as wide again
   across as it is down — the steep face of the mountain drew as a fat black
   wedge and its baseline as a hairline. With it, a line is the width it says
   it is, whichever way it runs. */
const LINE = `fill="none" stroke="${INK}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"`;

/* A sesame seed on the crown, each at its own angle: one that is level is a
   seed somebody drew. */
const seed = (x, y, a) =>
  `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="0.66" ${LINE} stroke-width="0.5"`
  + ` transform="rotate(${a} ${x} ${y})"/>`;

/** A ruffled edge — lettuce, and the lick of melted cheese. */
function ruffle(y, amp, n, from = 4, to = 96) {
  let d = `M${from} ${y}`;
  const w = (to - from) / n;
  for (let i = 0; i < n; i++) {
    d += ` q${(w / 4).toFixed(2)} ${amp} ${(w / 2).toFixed(2)} 0 q${(w / 4).toFixed(2)} ${-amp} ${(w / 2).toFixed(2)} 0`;
  }
  return d;
}

const BURGER = {
  label: "Paragraph burger",
  say: "A paragraph has a top, a filling and a bottom. Build it before you write it.",
  art: () => `
    <path d="M5 23.5C5 11.5 22 4.5 50 4.5s45 7 45 19v1.5H5z" ${LINE} stroke-width="1.8"/>
    ${[[23, 15, -16], [36, 11.5, 9], [50, 10.2, -5], [64, 11.8, 14], [77, 15.6, -10],
       [30, 19, 6], [58, 18, -12], [71, 20.4, 8], [44, 16.6, 3]].map(([x, y, a]) => seed(x, y, a)).join("")}
    <path d="${ruffle(26, 3.4, 7)} L96 38 L4 38Z" ${LINE} stroke-width="1"/>
    <rect x="6" y="39" width="88" height="13" ${LINE} stroke-width="1"/>
    ${[14, 28, 42, 56, 70, 84].map((x) => `<ellipse cx="${x}" cy="45.5" rx="1.4" ry="1.1" ${LINE} stroke-width="0.5"/>`).join("")}
    <path d="M5 53h90v9.5c0 0-6 1-9 4.2-2 2-4.4 1.2-6-0.6-1.6-1.8-4-2-5.6 0.2-1.8 2.4-5 2-6.6-0.2-1.4-2-4-1.8-5.4 0.4-1.6 2.4-5 2.2-6.6 0-1.4-2-4-2-5.6 0.2-1.8 2.2-4.8 1.8-6.4-0.4C45 64 42.6 64 41 66c-2 2.4-5 1.6-6.4-0.4C33 63.4 30.6 63.6 29 65.6c-1.8 2.2-5 1.6-6.6-0.6C21 63 18.6 63.2 17 65c-2 2.2-5.4 1.4-7-0.8-1-1.4-3-1.6-5-1.7z"
          ${LINE} stroke-width="1"/>
    <rect x="4" y="66" width="92" height="12" ${LINE} stroke-width="1.5"/>
    ${[12, 30, 48, 66, 84].map((x) => `<path d="M${x} 70.2h7" ${LINE} stroke-width="0.8"/>`).join("")}
    <path d="M6 79h88v9c0 4.6-4 7.6-10 7.6H16C10 95.6 6 92.6 6 88z" ${LINE} stroke-width="1.8"/>`,
  fields: [
    { id: "top", head: "Topic sentence — what the whole paragraph is about", x: 12, y: 8, w: 76, h: 13 },
    { id: "a", head: "First detail", x: 7, y: 27.5, w: 86, h: 10 },
    { id: "b", head: "Second detail", x: 8, y: 39.5, w: 84, h: 12 },
    { id: "c", head: "Third detail", x: 8, y: 53.5, w: 84, h: 11 },
    { id: "end", head: "Closing sentence", x: 10, y: 80, w: 80, h: 14 },
  ],
};

/**
 * THE MOUNTAIN IS NOT SYMMETRICAL, and it is not smooth.
 *
 * A story that climbs and falls at the same rate is a story nothing happens
 * in: the build-up is the long part, the turn is near the top and the way
 * down is short and fast. And a slope ruled in one clean curve is a hill on a
 * road sign — a real climb has ledges, false summits and bits that give way,
 * which is also what a story has. So the path is walked in short rugged steps
 * rather than drawn in one stroke, and the peak sits well right of the middle.
 */
const PEAK = [58, 11];
function ridge() {
  /* the knees of the climb and the drop; the rough is added between them */
  const up = [[2, 92], [12, 84], [20, 79], [27, 68], [33, 62], [38, 47], [45, 40], [50, 28], [54, 20], PEAK];
  const down = [PEAK, [63, 22], [67, 34], [72, 40], [76, 55], [82, 63], [87, 78], [92, 84], [98, 92]];
  const rough = (pts, k) => {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      /* ONE NOTCH PART WAY ALONG EACH LEG — a ledge, a false summit, a bit
         that has given way. It leans the way the slope leans, and it is
         gentler at the foot: a notch down there crosses the ground line and
         leaves the mountain looking torn rather than rough. */
      const t = 0.55;
      const foot = Math.min(1, (92 - Math.max(y0, y1)) / 22);
      const nx = x0 + (x1 - x0) * t + (i % 2 ? 1 : -1) * 0.8 * k * foot;
      const ny = Math.min(91.4, y0 + (y1 - y0) * t + (i % 3 ? 0.9 : -0.7) * foot);
      d += ` L${nx.toFixed(2)} ${ny.toFixed(2)} L${x1} ${y1}`;
    }
    return d;
  };
  return rough(up, 1) + rough(down, -1).replace(/^M[\d.]+ [\d.]+/, "");
}

const MOUNTAIN = {
  label: "Story mountain",
  say: "A story climbs to one moment and comes down the other side — and the way down is quicker.",
  /* THE PATH IS RUGGED, NOT SYMMETRIC — so a box sized to fit the slope in
     one telling may sit wrong in the next. Its fields are moveable for the
     same reason the five stations became pins: the shape says roughly
     where a part of the story happens, and the child settles it exactly. */
  movable: true,
  art: () => `
    <path d="${ridge()}" ${LINE} stroke-width="1.8"/>
    <path d="M2 92h96" ${LINE} stroke-width="1.5"/>
    <!-- snow on the top, broken off unevenly as snow is -->
    <path d="M${PEAK[0]} ${PEAK[1]} L62.6 20 L60 22 L57.6 19.4 L55 22.4 L52.6 20.6 L${PEAK[0]} ${PEAK[1]}Z"
          ${LINE} stroke-width="0.8"/>
    <!-- a crease down each face, so it reads as rock and not as a triangle -->
    <path d="M56 16 C50 30 44 44 34 60" ${LINE} stroke-width="0.55" opacity="0.6"/>
    <path d="M60 18 C64 32 68 46 76 58" ${LINE} stroke-width="0.55" opacity="0.6"/>
    <!-- the path, picking its way up and down -->
    <path d="M8 90 L16 86 L14 82 L24 76 L22 71 L32 64 L30 58 L40 48 L44 42 L48 34 L${PEAK[0]} ${PEAK[1] + 3}
             L64 26 L70 36 L74 48 L80 60 L86 72 L92 88"
          ${LINE} stroke-width="0.9" stroke-dasharray="2.6 2.4" opacity="0.8"/>`,
  /* THE STATIONS ARE PINS, NOT DOTS. A dot drawn on the slope is somewhere
     the lesson decided; a pin is somewhere the child can move. */
  pins: [[8, 90], [27, 68], PEAK, [76, 55], [92, 88]],
  fields: [
    { id: "open", head: "Opening — who, where, when", x: 1, y: 60, w: 21, h: 26 },
    { id: "rise", head: "Build-up — what starts to go wrong", x: 16, y: 30, w: 22, h: 24 },
    { id: "top", head: "The moment everything turns", x: 42, y: 0.5, w: 32, h: 9 },
    { id: "fall", head: "What happens because of it", x: 66, y: 28, w: 21, h: 22 },
    { id: "end", head: "Ending — how it is left", x: 78, y: 60, w: 21, h: 26 },
  ],
};

/**
 * THE TABLE'S PRESETS — and there are only two, on purpose.
 *
 * K-W-L really is a table: three columns, as many rows as you have thoughts,
 * and nothing about it that a shape would say better. Everything else that
 * looked table-ish from a distance — OREO, a T-chart, cause and effect, a
 * sequence chain, the five senses — has a SHAPE of its own further up this
 * file, because the shape is the teaching. Flattening them into a grid with
 * their headings typed in throws away the only part that was doing any work.
 */
export const TABLE_PRESETS = {
  blank: { label: "Blank", rows: 4, heads: ["", "", ""] },
  kwl: {
    label: "K · W · L",
    say: "What you knew before, what you wanted to know, and what you came away with.",
    rows: 5,
    heads: ["What I already know", "What I want to find out", "What I learned"],
  },
};

const TABLE = {
  label: "Table",
  say: "Rows and columns, for the things that are only clear side by side.",
  grid: { rows: 4, cols: 3 },
  presets: TABLE_PRESETS,
};

/**
 * OREO — an argument built like the biscuit it is named after.
 *
 * Opinion, Reason, Example, Opinion again: it closes where it opened, and
 * that is the whole lesson. Drawn as four stacked layers of a cookie —
 * wafer, cream, cream, wafer — so the two O's are visibly the same thing
 * top and bottom, which a column of identical boxes cannot say.
 *
 * The wafers are the opinions: scalloped at the rim and pricked the way a
 * biscuit is. The cream between them is what holds the argument up.
 */
function wafer(y, h) {
  /* a scalloped edge down each side, as a moulded biscuit has.
     THE RIM IS ONE PATH, walked round: down the left, across the foot, back
     up the right. Built as two paths and pasted together it came out as an
     `H` with three numbers after it — a horizontal line shooting off the
     side of the biscuit, which is exactly what it drew. */
  const n = 5;
  const step = h / n;
  let left = "";
  let right = "";
  for (let i = 0; i < n; i++) {
    left += ` q-2.4 ${(step / 2).toFixed(2)} 0 ${step.toFixed(2)}`;
    right += ` q2.4 ${(-step / 2).toFixed(2)} 0 ${(-step).toFixed(2)}`;
  }
  return `<path d="M14 ${y}${left} H86${right} Z" ${LINE} stroke-width="1.6"/>`;
}
const OREO_ROWS = [
  { id: "o1", head: "O — my opinion", y: 3, h: 20, kind: "wafer" },
  { id: "r", head: "R — the reason I think so", y: 25.5, h: 21, kind: "cream" },
  { id: "e", head: "E — an example that proves it", y: 49, h: 21, kind: "cream" },
  { id: "o2", head: "O — so, my opinion again", y: 72.5, h: 20, kind: "wafer" },
];
const OREO = {
  label: "OREO",
  say: "Opinion, Reason, Example, Opinion again — an argument that closes where it opened.",
  art: () => OREO_ROWS.map((r) => {
    /* The pricking a real biscuit has was drawn here and taken out again:
       it lands in the middle of the wafer, which is exactly where the
       child writes, so it was either invisible under the ruled lines or
       clutter across them. The scalloped rim says biscuit on its own. */
    if (r.kind === "wafer") return wafer(r.y, r.h);
    /* the cream: squeezed out a little past the biscuit */
    return `<path d="M11 ${r.y}h78a3 3 0 0 1 0 ${r.h}H11a3 3 0 0 1 0-${r.h}z" ${LINE} stroke-width="1.4"/>`;
  }).join(""),
  fields: OREO_ROWS.map((r) => ({
    id: r.id, head: r.head,
    x: r.kind === "wafer" ? 16 : 13, y: r.y + 1, w: r.kind === "wafer" ? 68 : 74, h: r.h - 2,
  })),
};

/**
 * THE T-CHART — and it is a literal T, not two columns.
 *
 * The crossbar is what makes it one: the two headings sit ON it, so the eye
 * reads "this against that" before it reads either side. Drawn as a plain
 * two-column grid it is a table, and a table says nothing about weighing
 * one thing against another.
 *
 * The foot is where a balanced argument differs from a list: having set the
 * two sides out, you have to come down somewhere. It is below the stem and
 * behind a dashed rule, so it reads as the thing you do LAST.
 */
const TCHART = {
  label: "T-chart",
  say: "Both sides of it, side by side — and what you think once you have weighed them.",
  art: () => `<rect x="5" y="1" width="90" height="10" ${LINE} stroke-width="1.2"/>`
    + `<path d="M4 23h92" ${LINE} stroke-width="2.4"/>`
    + `<path d="M50 23v57" ${LINE} stroke-width="2.4"/>`
    + `<path d="M6 83.5h88" ${LINE} stroke-width="1" stroke-dasharray="3 3"/>`,
  fields: [
    { id: "ask", head: "", x: 6.5, y: 1.9, w: 87, h: 8.2, mid: true, hint: "The question" },
    { id: "forHead", head: "", x: 9, y: 13, w: 34, h: 8, mid: true, hint: "For" },
    { id: "againstHead", head: "", x: 57, y: 13, w: 34, h: 8, mid: true, hint: "Against" },
    { id: "for", head: "", x: 8, y: 25, w: 37, h: 55 },
    { id: "against", head: "", x: 55, y: 25, w: 37, h: 55 },
    { id: "verdict", head: "", x: 6, y: 85.5, w: 88, h: 12, hint: "So, on balance…" },
  ],
};

/**
 * AN ARROW, pointing where it is going.
 *
 * The stroke is told not to scale (so the shaft is an even width whichever
 * way it runs) but a FILL is not: a head drawn as a plain triangle comes out
 * half again as wide as it is tall on a three-by-two sheet. So the head is
 * built from the line's own direction with the across-ness divided out, the
 * same correction the circles get.
 */
function arrow(x1, y1, x2, y2, head = 3) {
  const dx = (x2 - x1) * ASPECT;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  /* back along the line, then out to each side of it */
  const bx = x2 - (ux * head) / ASPECT;
  const by = y2 - uy * head;
  const sx = (-uy * head * 0.5) / ASPECT;
  const sy = ux * head * 0.5;
  return `<path d="M${x1} ${y1}L${x2} ${y2}" ${LINE} stroke-width="1.3"/>`
    + `<path d="M${x2} ${y2}L${(bx + sx).toFixed(2)} ${(by + sy).toFixed(2)}`
    + `L${(bx - sx).toFixed(2)} ${(by - sy).toFixed(2)}Z" fill="${INK}"/>`;
}

/**
 * THE FISHBONE — one effect, and everything that feeds it.
 *
 * The head is the thing that happened; the bones are the kinds of reason it
 * happened, slanting back towards the tail because every one of them came
 * BEFORE it. Drawn the other way round — bones leaning forward — it reads as
 * consequences, which is a different diagram entirely.
 */
const FISH_BONES = [
  ["Who", -1], ["Where", -1], ["When", -1],
  ["What was used", 1], ["How it was done", 1], ["Why", 1],
];
const FISHBONE = {
  label: "Fishbone",
  say: "The head is what happened. Each bone is a kind of reason it happened.",
  art: () => {
    const spineY = 50;
    let out = arrow(3, spineY, 76, spineY, 3.6);
    /* the head: the effect everything else runs into */
    out += `<path d="M77 ${spineY - 15}L97 ${spineY}L77 ${spineY + 15}Z" ${LINE} stroke-width="1.6"/>`;
    FISH_BONES.forEach(([, way], i) => {
      const at = 16 + (i % 3) * 20;          // where the bone meets the spine
      const tipX = at - 9;
      const tipY = spineY + way * 33;
      out += `<path d="M${at} ${spineY}L${tipX} ${tipY}" ${LINE} stroke-width="1.3"/>`;
      /* two small ribs off each bone: the details under a reason */
      [0.42, 0.72].forEach((t) => {
        const rx = at + (tipX - at) * t;
        const ry = spineY + (tipY - spineY) * t;
        out += `<path d="M${rx.toFixed(2)} ${ry.toFixed(2)}l6 ${(way * -3).toFixed(2)}" ${LINE} stroke-width="0.8" opacity="0.65"/>`;
      });
    });
    return out;
  },
  fields: [
    { id: "effect", head: "", x: 79, y: 42, w: 19, h: 16, mid: true, hint: "What happened" },
    ...FISH_BONES.map(([head, way], i) => {
      const at = 16 + (i % 3) * 20;
      /* each bone's writing sits under its own tip and nowhere near the
         next one's: overlapping fields run their rules together and the
         three columns read as one block */
      return {
        id: `b${i}`, head,
        x: Math.max(0.5, at - 17), y: way < 0 ? 4 : 68,
        w: 17, h: 26,
      };
    }),
  ],
};

/**
 * THE CAUSE AND EFFECT MAP — three things in a row, not two.
 *
 * The fishbone up there is only the causes; this one has the other half.
 * What led to it comes in from the left, the thing itself stands in the
 * middle, and what came of it goes out to the right, so the map is read in
 * the direction time runs. Every arrow points the same way for the same
 * reason: an arrow that turned back would be saying the effect caused the
 * event.
 */
const CE_AT = [11, 41.5, 72];        // where the three side boxes sit
const CE_MID = CE_AT.map((y) => y + 8.5);
const CAUSES = {
  label: "Cause and effect",
  say: "What led to it on the left, the thing itself in the middle, and what came of it on the right.",
  art: () => {
    let out = "";
    CE_AT.forEach((y) => {
      out += `<rect x="2" y="${y}" width="22" height="17" ${LINE} stroke-width="1.3"/>`;
      out += `<rect x="76" y="${y}" width="22" height="17" ${LINE} stroke-width="1.3"/>`;
    });
    out += `<rect x="38" y="30" width="24" height="40" ${LINE} stroke-width="2"/>`;
    /* in from the three causes, fanning onto the middle box */
    const into = [38, 50, 62];
    CE_MID.forEach((y, i) => { out += arrow(25, y, 36.4, into[i], 2.6); });
    /* and out of it to the three effects, opening again */
    CE_MID.forEach((y, i) => { out += arrow(63.6, into[i], 75, y, 2.6); });
    return out;
  },
  labels: [
    { text: "Causes", x: 13, y: 2.5, w: 20 },
    { text: "Effects", x: 87, y: 2.5, w: 20 },
  ],
  fields: [
    ...CE_AT.map((y, i) => ({ id: `c${i}`, head: "", x: 3.2, y: y + 1, w: 19.6, h: 15, hint: "Because…" })),
    { id: "event", head: "What happened", x: 39.5, y: 31.5, w: 21, h: 37 },
    ...CE_AT.map((y, i) => ({ id: `e${i}`, head: "", x: 77.2, y: y + 1, w: 19.6, h: 15, hint: "And so…" })),
  ],
};

/**
 * THE SEQUENCE CHAIN — it turns a corner, and that is deliberate.
 *
 * Six steps straight across would be six tiny boxes nobody can write in. So
 * the chain goes along the top, turns down the right-hand side and comes
 * back along the bottom, the way a line of writing does — which keeps every
 * box the same generous size and keeps the order unmistakable, because the
 * arrows never stop pointing from the step you have just done to the one
 * you do next.
 *
 * The words are printed in the boxes. "First, next, then" is the vocabulary
 * the chain is teaching; leaving the headings blank teaches nothing.
 */
const SEQ_SAYS = ["First", "Next", "Then", "After that", "And then", "Finally"];
const SEQ_X = [4, 37, 70];
const SEQ_W = 26;
const SEQ_H = 30;
const SEQ_TOP = 6;
const SEQ_BOT = 58;
/* reading order: along the top, down, and back along the bottom */
const SEQ_AT = [
  [SEQ_X[0], SEQ_TOP], [SEQ_X[1], SEQ_TOP], [SEQ_X[2], SEQ_TOP],
  [SEQ_X[2], SEQ_BOT], [SEQ_X[1], SEQ_BOT], [SEQ_X[0], SEQ_BOT],
];
const SEQUENCE = {
  label: "Sequence chain",
  say: "One step to the next, in the order they happened.",
  art: () => {
    let out = SEQ_AT.map(([x, y]) =>
      `<rect x="${x}" y="${y}" width="${SEQ_W}" height="${SEQ_H}" ${LINE} stroke-width="1.4"/>`).join("");
    const midTop = SEQ_TOP + SEQ_H / 2;
    const midBot = SEQ_BOT + SEQ_H / 2;
    /* along the top, left to right */
    out += arrow(SEQ_X[0] + SEQ_W + 0.6, midTop, SEQ_X[1] - 0.6, midTop, 2.6);
    out += arrow(SEQ_X[1] + SEQ_W + 0.6, midTop, SEQ_X[2] - 0.6, midTop, 2.6);
    /* down the right-hand side */
    out += arrow(SEQ_X[2] + SEQ_W / 2, SEQ_TOP + SEQ_H + 0.6, SEQ_X[2] + SEQ_W / 2, SEQ_BOT - 0.6, 2.6);
    /* and back along the bottom, right to left */
    out += arrow(SEQ_X[2] - 0.6, midBot, SEQ_X[1] + SEQ_W + 0.6, midBot, 2.6);
    out += arrow(SEQ_X[1] - 0.6, midBot, SEQ_X[0] + SEQ_W + 0.6, midBot, 2.6);
    return out;
  },
  fields: SEQ_AT.map(([x, y], i) => ({
    id: `s${i}`, head: SEQ_SAYS[i],
    x: x + 2, y: y + 1.5, w: SEQ_W - 4, h: SEQ_H - 3,
  })),
};

/**
 * THE FIVE SENSES — and they are DRAWN, not listed.
 *
 * "See / hear / smell / taste / touch" written down the side of a table is
 * five words to read. An eye, an ear, a nose, a mouth and a hand are five
 * things to recognise, which is the whole reason this organiser exists: it
 * is for describing, and it asks with pictures.
 *
 * Each sense is drawn in its own little square space and then squashed
 * across by the same amount the sheet stretches, so an eye is an eye and
 * not a wide eye. Everything inside `organ()` is therefore authored as if
 * on graph paper, centred on nothing, in a box about sixteen across.
 */
const organ = (cx, cy, body, s = 0.78) =>
  `<g transform="translate(${cx} ${cy}) scale(${(s / ASPECT).toFixed(4)} ${s})">${body}</g>`;

const SENSE_EYE = `<path d="M-8 -5.2C-4.6 -8.4 4.6 -8.4 8 -5.2" ${LINE} stroke-width="1"/>`
  + `<path d="M-7.6 0C-4.2 -5.6 4.2 -5.6 7.6 0C4.2 5.6 -4.2 5.6 -7.6 0Z" ${LINE} stroke-width="1.4"/>`
  + `<circle r="2.9" ${LINE} stroke-width="1.1"/>`
  + `<circle r="1.2" fill="${INK}"/>`;

const SENSE_EAR = `<path d="M4.4 -5.6C1.4 -7.8 -3.8 -7.2 -5.4 -3C-6.8 0.6 -5.6 3.6 -3.8 5.4C-2.4 6.8 -0.4 7.4 0.8 6.2C1.8 5.2 1.4 4 2.4 3.2" ${LINE} stroke-width="1.4"/>`
  + `<path d="M2.2 -2.4C-0.2 -4 -2.8 -2.8 -3.2 -0.4C-3.6 1.8 -2.6 3.4 -1 3.8" ${LINE} stroke-width="1"/>`
  + `<path d="M6 -2.6C7.4 -1.2 7.4 1.2 6 2.6" ${LINE} stroke-width="0.9" opacity="0.7"/>`;

const SENSE_NOSE = `<path d="M0 -7.4C-1 -3.6 -3.2 -0.4 -4.8 1.8C-5.8 3.2 -4.8 4.6 -3.2 4.4" ${LINE} stroke-width="1.4"/>`
  + `<path d="M-3.6 4.8C-1.8 7 2.4 7 4.4 4.6" ${LINE} stroke-width="1.4"/>`
  + `<path d="M3.2 3C2.6 4.6 0.6 5.2 -0.6 4.6" ${LINE} stroke-width="0.9"/>`
  + `<path d="M6 -2.6q1.4-1.2 0-2.4q-1.4-1.2 0-2.4" ${LINE} stroke-width="0.9" opacity="0.7"/>`;

const SENSE_MOUTH = `<path d="M-7.6 0C-5.2 -4.6 -2.4 -2.4 0 -2.8C2.4 -3.2 5.2 -4.6 7.6 0C4.6 5 -4.6 5 -7.6 0Z" ${LINE} stroke-width="1.4"/>`
  + `<path d="M-7.6 0H7.6" ${LINE} stroke-width="1"/>`
  + `<path d="M-2.6 0.8C-2.6 3.4 2.6 3.4 2.6 0.8" ${LINE} stroke-width="0.9"/>`;

/* the palm has no top edge: a line across there cuts the fingers off */
const SENSE_HAND = `<path d="M-4.2 -2V-5.6M-1.5 -2V-7.4M1.2 -2V-7M3.9 -2V-5.2" ${LINE} stroke-width="1.5"/>`
  + `<path d="M-5.4 -2V2.2C-5.4 7.6 5.4 7.6 5.4 2.2V-2" ${LINE} stroke-width="1.4"/>`
  + `<path d="M-5.4 0.6C-7.6 0.2 -8.2 -2 -6.6 -2.8C-5.6 -3.2 -5 -2.4 -5 -1.6" ${LINE} stroke-width="1.3"/>`;

const SENSE_ROWS = [
  { id: "see", head: "It looks…", art: SENSE_EYE },
  { id: "hear", head: "It sounds…", art: SENSE_EAR },
  { id: "smell", head: "It smells…", art: SENSE_NOSE },
  { id: "taste", head: "It tastes…", art: SENSE_MOUTH },
  { id: "touch", head: "It feels…", art: SENSE_HAND },
];
const SENSE_TOP = 13;
const SENSE_H = 17;
const SENSES = {
  label: "Five senses",
  say: "Describe it with all five — what you see, hear, smell, taste and feel.",
  art: () => {
    let out = `<rect x="4" y="1.5" width="92" height="9" ${LINE} stroke-width="1.2"/>`
      + `<rect x="4" y="${SENSE_TOP}" width="92" height="${SENSE_H * 5}" ${LINE} stroke-width="1.6"/>`
      + `<path d="M20 ${SENSE_TOP}v${SENSE_H * 5}" ${LINE} stroke-width="1"/>`;
    SENSE_ROWS.forEach((row, i) => {
      if (i) out += `<path d="M4 ${SENSE_TOP + i * SENSE_H}h92" ${LINE} stroke-width="0.8"/>`;
      out += organ(12, SENSE_TOP + i * SENSE_H + SENSE_H / 2, row.art);
    });
    return out;
  },
  fields: [
    { id: "thing", head: "", x: 5, y: 2, w: 90, h: 8, mid: true, hint: "What you are describing" },
    ...SENSE_ROWS.map((row, i) => ({
      id: row.id, head: row.head,
      x: 22, y: SENSE_TOP + i * SENSE_H + 1.5, w: 72, h: SENSE_H - 3,
    })),
  ],
};

/**
 * A FLOW CHART — and the shapes mean things.
 *
 * A stadium is where it starts and stops, a box is something you DO, and a
 * diamond is a question with two ways out. A flow chart drawn in all
 * rectangles is a list with arrows on it.
 */
const FLOW = {
  label: "Flow chart",
  say: "A box is something you do. A diamond is a question, and it has two ways out.",
  art: () => {
    const r = 5;
    let out = "";
    /* start: a stadium */
    out += `<path d="M38 2h24a${(r / ASPECT).toFixed(2)} ${r} 0 0 1 0 10H38a${(r / ASPECT).toFixed(2)} ${r} 0 0 1 0-10z" ${LINE} stroke-width="1.5"/>`;
    out += arrow(50, 12, 50, 19);
    out += `<rect x="31" y="19" width="38" height="13" ${LINE} stroke-width="1.5"/>`;
    out += arrow(50, 32, 50, 39);
    /* the question */
    out += `<path d="M50 39L${(50 + 20 / ASPECT).toFixed(2)} 51L50 63L${(50 - 20 / ASPECT).toFixed(2)} 51Z" ${LINE} stroke-width="1.5"/>`;
    /* its two ways out, started clear of the diamond so they do not draw
       over the two points that make it a diamond */
    out += arrow(50 + 20 / ASPECT + 1.5, 51, 74, 51);
    out += arrow(50 - 20 / ASPECT - 1.5, 51, 26, 51);
    out += `<rect x="74" y="43" width="24" height="16" ${LINE} stroke-width="1.4"/>`;
    out += `<rect x="2" y="43" width="24" height="16" ${LINE} stroke-width="1.4"/>`;
    /* and both come back to the same end */
    out += `<path d="M86 59v14H50" ${LINE} stroke-width="1.1" stroke-dasharray="2.5 2.5"/>`;
    out += `<path d="M14 59v14h36" ${LINE} stroke-width="1.1" stroke-dasharray="2.5 2.5"/>`;
    out += arrow(50, 73, 50, 81);
    out += `<path d="M38 81h24a${(r / ASPECT).toFixed(2)} ${r} 0 0 1 0 10H38a${(r / ASPECT).toFixed(2)} ${r} 0 0 1 0-10z" ${LINE} stroke-width="1.5"/>`;
    return out;
  },
  /* THE WORDS ON THE TWO WAYS OUT are the whole point of a diamond, and they
     are HTML rather than SVG text: this sheet stretches its drawing three by
     two, which is fine for a line and turns a letter into a wide letter. */
  labels: [{ text: "yes", x: 62, y: 45 }, { text: "no", x: 30, y: 45 }],
  fields: [
    { id: "start", head: "", x: 39, y: 2.5, w: 22, h: 9, mid: true, hint: "Start" },
    { id: "step", head: "", x: 32, y: 20, w: 36, h: 11, hint: "The first thing you do" },
    { id: "ask", head: "", x: 38, y: 44, w: 24, h: 14, mid: true, hint: "The question" },
    { id: "yes", head: "", x: 75, y: 44, w: 22, h: 14, hint: "If yes…" },
    { id: "no", head: "", x: 3, y: 44, w: 22, h: 14, hint: "If no…" },
    { id: "end", head: "", x: 39, y: 81.5, w: 22, h: 9, mid: true, hint: "End" },
  ],
};

const VENN = {
  label: "Venn diagram",
  say: "What belongs to one, what belongs to the other, and what they share in the middle.",
  art: () => circ(38, 54, 36, "none", ` stroke="${INK}" stroke-width="1.8"`)
    + circ(62, 54, 36, "none", ` stroke="${INK}" stroke-width="1.8"`),
  fields: [
    { id: "aName", head: "", x: 6, y: 5, w: 28, h: 8, mid: true, one: true, hint: "This one" },
    { id: "bName", head: "", x: 66, y: 5, w: 28, h: 8, mid: true, one: true, hint: "That one" },
    { id: "a", head: "Only this one", x: 9, y: 38, w: 20, h: 32 },
    { id: "both", head: "Both", x: 41, y: 38, w: 18, h: 32 },
    { id: "b", head: "Only that one", x: 71, y: 38, w: 20, h: 32 },
  ],
};

/** Five round a hub: the parts every story has, in the order they are asked. */
const ROUND_PARTS = ["Characters", "Setting", "The problem", "What happens", "How it ends"];
const ROUNDABOUT = {
  label: "Story merry-go-round",
  say: "The story in the middle, and its five parts round it.",
  art: () => {
    const R = 34, cx = 50, cy = 50, n = ROUND_PARTS.length;
    let spokes = "";
    let discs = "";
    ROUND_PARTS.forEach((_, i) => {
      const [x, y] = ring(cx, cy, R, i, n);
      spokes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}"`
        + ` stroke="${INK}" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>`;
      discs += circ(x.toFixed(2), y.toFixed(2), 15, "none", ` stroke="${INK}" stroke-width="1.5"`);
    });
    return spokes + discs + circ(cx, cy, 15, "none", ` stroke="${INK}" stroke-width="2"`);
  },
  fields: (() => {
    const R = 34, cx = 50, cy = 50, n = ROUND_PARTS.length;
    const round = ROUND_PARTS.map((head, i) => {
      const [x, y] = ring(cx, cy, R, i, n);
      return { id: `p${i}`, head, x: x - 8, y: y - 9, w: 16, h: 18, mid: true };
    });
    return [{ id: "hub", head: "The story", x: cx - 8, y: cy - 9, w: 16, h: 18, mid: true }, ...round];
  })(),
};

export const ORGANISERS = {
  burger: BURGER,
  mountain: MOUNTAIN,
  venn: VENN,
  roundabout: ROUNDABOUT,
  oreo: OREO,
  tchart: TCHART,
  causes: CAUSES,
  sequence: SEQUENCE,
  senses: SENSES,
  fishbone: FISHBONE,
  flow: FLOW,
  table: TABLE,
};
export const ORGANISER_IDS = Object.keys(ORGANISERS);

/* ── the pins, and the notes that hang off them ──────────────────────────*/

/** A tilt that is this pin's own and never changes: a board, not a grid. */
const tiltOf = (id) => {
  const n = Math.sin(id * 12.9898) * 43758.5453;
  return TILT + (n - Math.floor(n) - 0.5) * 0.17;
};

/**
 * HOW WIDE A NOTE MAY BE: as far as its nearest neighbour, and no further.
 * That is what pinning the notes buys — a free-floating note has to be
 * dragged out of the way of the next one, and a pinned one simply knows.
 */
function roomFor(pin, pins, boardW) {
  let near = boardW;
  pins.forEach((o) => {
    if (o.id === pin.id) return;
    const dx = ((o.x - pin.x) / 100) * boardW;
    const dy = ((o.y - pin.y) / 100) * boardW * 0.62;
    near = Math.min(near, Math.hypot(dx, dy));
  });
  return Math.max(120, Math.min(300, near * 0.92));
}

/**
 * Hang an organiser on `host`.
 *
 *   kind      which shape
 *   saved     { fields: {id: text}, pins: [{id,x,y,note}], grid: {rows,cols} }
 *   onChange  called with all of that whenever anything changes
 */
export function mountOrganiser(host, { kind = "burger", saved = null, onChange = () => {} } = {}) {
  const spec = ORGANISERS[kind] || BURGER;
  /**
   * A PIN IS A PLACE. A NOTE IS A THING. They are kept apart on purpose.
   *
   * The first version made a pin and opened a pad on it, which gets the
   * order wrong: you do not decide where a thought goes before you have had
   * it. So a pin is an empty marker you put where something belongs, a note
   * is written on its own and lies loose on the board, and the two are
   * brought together by DRAGGING the note onto the pin. Pull it off again
   * and it is loose again; the pin stays where it was put.
   */
  const state = {
    fields: { ...(saved?.fields || {}) },
    pins: Array.isArray(saved?.pins) ? saved.pins.map((p) => ({ ...p })) : [],
    notes: Array.isArray(saved?.notes) ? saved.notes.map((n) => ({ ...n })) : [],
    grid: { ...(spec.grid || {}), ...(saved?.grid || {}) },
    preset: saved?.preset || (spec.presets ? "blank" : null),
    /* A BOX DRAWN ONE SIZE IS A GUESS AT HOW MUCH SOMEONE WILL WRITE. This
       keeps only what has been PULLED away from that guess — x/y (moved,
       mountain only) and w/h (resized, every shape) per field id — so a
       field with no entry here still tracks the shape's own layout if it
       is ever changed in code. */
    layout: { ...(saved?.layout || {}) },
  };
  /* a note written on a pin by the older version comes off it, as a note */
  state.pins.forEach((pn) => {
    if (!pn.note) return;
    state.notes.push({ id: -pn.id, x: pn.x, y: pn.y, pin: pn.id, ...pn.note });
    delete pn.note;
  });
  /* SOME SHAPES COME WITH THEIR PINS. The mountain's five stations used to be
     dots painted on the slope — somewhere the lesson had decided. As pins
     they are somewhere the child can move, and the shape still arrives
     saying where the story usually stops. Only on a sheet nobody has
     touched: once there is work on it, the board is theirs. */
  if (!saved && Array.isArray(spec.pins)) {
    spec.pins.forEach(([x, y], i) => state.pins.push({ id: i + 1, x, y }));
  }
  let seq = 1 + Math.max(0, ...state.pins.map((p) => p.id || 0), ...state.notes.map((n) => Math.abs(n.id) || 0));
  let picked = null;

  const el = document.createElement("div");
  el.className = `og og--${kind}`;
  el.innerHTML = `
    <div class="og__top">
      <p class="og__say">${esc(spec.say)}</p>
      <span class="og__keys">
        <button type="button" class="pp-btn wb-tint-2 og__key" data-og="pin"
                aria-label="Put a pin on the board" data-tip="A pin: somewhere a note can go">${PIN_ICON}</button>
        <button type="button" class="pp-btn wb-tint-2 og__key" data-og="note"
                aria-label="Write a sticky note" data-tip="Write a note, then drag it onto a pin">${NOTE_ICON}</button>
        ${spec.presets ? `<span class="og__sets">${Object.entries(spec.presets).map(([id, t]) =>
          `<button type="button" class="pp-plain og__set" data-set="${id}" aria-pressed="false">${esc(t.label)}</button>`).join("")}</span>` : ""}
        ${spec.grid ? `<button type="button" class="pp-btn wb-tint-1 og__key" data-og="row+" aria-label="One more row" data-tip="One more row">+ row</button>
        <button type="button" class="pp-btn wb-tint-1 og__key" data-og="row-" aria-label="One row fewer" data-tip="Take the last row off">&minus; row</button>
        <button type="button" class="pp-btn wb-tint-1 og__key" data-og="col+" aria-label="One more column" data-tip="One more column">+ col</button>
        <button type="button" class="pp-btn wb-tint-1 og__key" data-og="col-" aria-label="One column fewer" data-tip="Take the last column off">&minus; col</button>` : ""}
        <button type="button" class="pp-btn wb-tint-4 og__key" data-og="clear"
                aria-label="Take the picked pin off" data-tip="Take the picked pin off">${BIN_ICON}</button>
      </span>
    </div>
    <div class="og__sheet" data-sheet>
      <svg class="og__art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
      <div class="og__fields"></div>
      <canvas class="og__notes" aria-hidden="true"></canvas>
      <div class="og__pins"></div>
    </div>`;
  host.appendChild(el);

  const sheet = el.querySelector("[data-sheet]");
  const art = el.querySelector(".og__art");
  const fieldsEl = el.querySelector(".og__fields");
  const pinsEl = el.querySelector(".og__pins");
  const canvas = el.querySelector(".og__notes");

  const tell = () => onChange({
    fields: { ...state.fields },
    pins: state.pins.map((p) => ({ ...p })),
    notes: state.notes.map((n) => ({ ...n })),
    grid: { ...state.grid },
    preset: state.preset,
    layout: { ...state.layout },
  });

  /* ── the shape, and the boxes to type in ────────────────────────────── */
  const preset = () => (spec.presets ? spec.presets[state.preset] || spec.presets.blank : null);

  /** A field as drawn: the shape's own x/y/w/h, with whatever has been
      dragged or pulled away from that laid over it. */
  const layoutOf = (f) => {
    const o = state.layout[f.id];
    return o ? { ...f, ...o } : f;
  };

  function fieldsOf() {
    if (!spec.grid) return spec.fields.map(layoutOf);
    /* a table is its own fields, because how many there are is a setting */
    const set = preset();
    const stubs = set?.stubs || null;
    const { rows, cols } = state.grid;
    const out = [];
    const cw = 96 / cols;
    const ch = 92 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        /* THE STUB IS PART OF THE METHOD, not a question. OREO's four
           letters are the shape of the argument; they are printed down the
           side, not left for the child to guess at. */
        const stub = stubs && c === 0 && r > 0 ? stubs[r - 1] : null;
        out.push(layoutOf({
          id: `r${r}c${c}`,
          head: r === 0 ? (set?.heads?.[stubs ? c - 1 : c] ?? "") : "",
          x: 2 + c * cw, y: 4 + r * ch, w: cw - 1, h: ch - 1,
          mid: r === 0,
          stub,
        }));
      }
    }
    return out;
  }

  function paintArt() {
    if (spec.grid) {
      const { rows, cols } = state.grid;
      const cw = 96 / cols;
      const ch = 92 / rows;
      let out = `<rect x="2" y="4" width="96" height="92" ${LINE} stroke-width="1.8"/>`
        + `<path d="M2 ${4 + ch}h96" ${LINE} stroke-width="1.8"/>`;
      for (let c = 1; c < cols; c++) out += `<path d="M${2 + c * cw} 4v92" ${LINE} stroke-width="0.8"/>`;
      for (let r = 2; r < rows; r++) out += `<path d="M2 ${4 + r * ch}h96" ${LINE} stroke-width="0.8"/>`;
      art.innerHTML = out;
      return;
    }
    art.innerHTML = spec.art();
  }

  function paintFields() {
    fieldsEl.innerHTML = fieldsOf().map((f) => {
      if (f.stub) {
        return `<span class="og__field og__stub" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%">${esc(f.stub)}</span>`;
      }
      /* A <div>, not a <label>: a label forwards any click inside it
         straight to the textarea, which is wrong the moment there is a
         grip in the corner to press instead. */
      return `<div class="og__field${f.mid ? " is-mid" : ""}" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%" data-fieldbox="${f.id}">
        ${f.head ? `<span class="og__head">${esc(f.head)}</span>` : ""}
        <textarea data-field="${f.id}" aria-label="${esc(f.head || f.hint || f.id)}"
                  placeholder="${esc(f.hint || "")}">${esc(state.fields[f.id] || "")}</textarea>
        ${spec.movable ? `<span class="og__grip og__grip--move" data-move="${f.id}" data-tip="Drag to move it" aria-hidden="true">${MOVE_ICON}</span>` : ""}
        <span class="og__grip og__grip--size" data-resize="${f.id}" data-tip="Pull to size it" aria-hidden="true">${RESIZE_ICON}</span>
      </div>`;
    }).join("");
    if (spec.labels) {
      fieldsEl.insertAdjacentHTML("beforeend", spec.labels.map((l) =>
        `<span class="og__label" style="left:${l.x}%;top:${l.y}%${l.w ? `;width:${l.w}%;margin-left:${-l.w / 2}%` : ""}">${esc(l.text)}</span>`).join(""));
    }
    if (spec.presets) {
      el.querySelectorAll("[data-set]").forEach((k) => k.setAttribute("aria-pressed", String(k.dataset.set === state.preset)));
      const say = el.querySelector(".og__say");
      if (say) say.textContent = preset()?.say || spec.say;
    }
  }

  /* ── the pins ────────────────────────────────────────────────────────── */
  function paintPins() {
    pinsEl.innerHTML = state.pins.map((p) => `
      <button type="button" class="pp-plain og__pin${picked === p.id ? " is-picked" : ""}${state.notes.some((n) => n.pin === p.id) ? " has-note" : ""}${over === p.id ? " is-over" : ""}" data-pin="${p.id}"
              style="left:${p.x}%;top:${p.y}%"
              aria-label="A pin — drag a note onto it"
              data-tip="Drag a note onto this pin">${PIN_ICON}</button>`).join("");
  }

  /**
   * THE NOTES, DRAWN. They are the site's own sticky notes, painted on to a
   * sheet of their own above the shape: a note is a piece of paper lying on
   * the board, not a box in it. The canvas takes no clicks — the PIN is the
   * handle, which is the point of pinning them.
   */
  /** Where a note sits: on its pin if it has one, else where it was left. */
  const spotOf = (n) => {
    const pin = n.pin ? state.pins.find((p) => p.id === n.pin) : null;
    return pin ? { x: pin.x, y: pin.y, pinned: true } : { x: n.x, y: n.y, pinned: false };
  };

  function paintNotes() {
    const r = sheet.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, r.width, r.height);
    noteBoxes = [];
    state.notes.forEach((n) => {
      if (!n.runs?.length) return;
      const at = spotOf(n);
      const note = makeNote({ runs: n.runs, paper: n.paper || 0 });
      /* ON A PIN it is measured against its neighbours, so a board of them
         cannot overlap; loose, it takes whatever width it wants. */
      const lay = layoutNote(note, {
        maxWidth: at.pinned ? roomFor(at, state.pins, r.width) : 300,
      });
      const x = (at.x / 100) * r.width - lay.width * (at.pinned ? 0.18 : 0.5);
      const y = (at.y / 100) * r.height + (at.pinned ? 6 : -lay.height / 2);
      g.save();
      g.translate(x, y);
      paintSticky(g, note, lay, { tilt: tiltOf(n.id), ruled: true });
      g.restore();
      /* kept so the note can be picked up again: the canvas cannot be asked
         what is under a finger, so the boxes are remembered as they are drawn */
      noteBoxes.push({ id: n.id, x, y, w: lay.width, h: lay.height });
    });
  }
  let noteBoxes = [];
  /** The topmost note under a point on the sheet, if any. */
  const noteAt = (px, py) => [...noteBoxes].reverse()
    .find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) || null;

  const paintAll = () => { paintArt(); paintFields(); paintPins(); paintNotes(); };

  /* ── what the keys do ────────────────────────────────────────────────── */
  el.addEventListener("click", (e) => {
    const k = e.target.closest("[data-og]")?.dataset.og;
    if (k === "pin") {
      /* AN EMPTY PIN, and nothing else happens. A pin says "something goes
         here"; what goes there is decided later, by dragging a note on. */
      const pin = { id: seq++, x: 50, y: 46 };
      state.pins.push(pin);
      picked = pin.id;
      paintAll();
      tell();
      return;
    }
    if (k === "note") {
      const n = { id: seq++, x: 50, y: 30, pin: null, runs: null, paper: 0 };
      state.notes.push(n);
      write(n);
      return;
    }
    const set = e.target.closest("[data-set]")?.dataset.set;
    if (set && spec.presets) {
      const t = spec.presets[set];
      if (!t) return;
      const written = Object.values(state.fields).some((v) => String(v || "").trim());
      if (written && !confirm("Change the table? What is written in it stays, but the headings and the shape change.")) return;
      state.preset = set;
      state.grid = {
        rows: t.stubs ? t.stubs.length + 1 : (t.rows || 4),
        cols: (t.heads?.length || 2) + (t.stubs ? 1 : 0),
      };
      paintAll();
      tell();
      return;
    }
    if (k === "row+") { state.grid.rows = Math.min(12, state.grid.rows + 1); paintAll(); tell(); return; }
    if (k === "col+") { state.grid.cols = Math.min(8, state.grid.cols + 1); paintAll(); tell(); return; }
    if (k === "row-" || k === "col-") { shrink(k === "row-" ? "rows" : "cols"); return; }
    if (k === "clear") {
      if (picked == null) return;
      /* a pin taken off sets its note loose rather than taking the writing
         with it: the words were the work, the pin was only a place */
      state.notes.forEach((n) => { if (n.pin === picked) { const a = spotOf(n); n.pin = null; n.x = a.x; n.y = a.y; } });
      state.pins = state.pins.filter((p) => p.id !== picked);
      picked = null;
      paintAll();
      tell();
      return;
    }
  });

  /**
   * ONE ROW OR COLUMN FEWER — the last one, and what was written in it goes
   * with it.
   *
   * Two things it will not do. It will not take the last row or the last
   * column away, because a table of nothing is not a table and there would
   * be no key left to grow it back from. And it will not throw away writing
   * without asking: a table is filled in slowly and there is no step back on
   * this sheet, so a row with words in it is worth one question. An empty
   * one goes without a word, because asking about nothing is just a door to
   * open twice.
   */
  function shrink(which) {
    const n = state.grid[which];
    if (n <= 1) return;
    const last = n - 1;
    const doomed = fieldsOf().filter((f) => {
      const m = /^r(\d+)c(\d+)$/.exec(f.id);
      return m && Number(m[which === "rows" ? 1 : 2]) === last;
    });
    const written = doomed.some((f) => (state.fields[f.id] || "").trim());
    const what = which === "rows" ? "row" : "column";
    if (written && !confirm(`Take the last ${what} off? What is written in it goes too.`)) return;
    doomed.forEach((f) => { delete state.fields[f.id]; });
    state.grid[which] = last;
    paintAll();
    tell();
  }

  /* typing straight into the shape */
  fieldsEl.addEventListener("input", (e) => {
    const id = e.target.dataset.field;
    if (!id) return;
    state.fields[id] = e.target.value;
    tell();
  });

  /**
   * A BOX IS PULLED, NOT TYPED. The corner grip changes width and height —
   * every shape — and the move grip, only where `spec.movable` says a box
   * does not have one right place (the mountain's rugged slope). Both are
   * worked straight on the DOM while a drag is live, the way a pin is, so
   * nothing is lost by re-rendering the field mid-keystroke; the state and
   * the save happen once, on release.
   */
  let fieldDrag = null;
  fieldsEl.addEventListener("pointerdown", (e) => {
    const resizeId = e.target.closest("[data-resize]")?.dataset.resize;
    const moveId = e.target.closest("[data-move]")?.dataset.move;
    const id = resizeId || moveId;
    if (!id) return;
    const f = fieldsOf().find((x) => x.id === id);
    if (!f) return;
    e.preventDefault();
    const r = sheet.getBoundingClientRect();
    fieldDrag = resizeId
      ? { id, kind: "size", r, left: f.x, top: f.y }
      : { id, kind: "move", r, fromX: e.clientX, fromY: e.clientY, startX: f.x, startY: f.y, w: f.w, h: f.h };
    fieldsEl.setPointerCapture(e.pointerId);
  });
  fieldsEl.addEventListener("pointermove", (e) => {
    if (!fieldDrag) return;
    const box = fieldsEl.querySelector(`[data-fieldbox="${fieldDrag.id}"]`);
    if (fieldDrag.kind === "size") {
      const px = ((e.clientX - fieldDrag.r.left) / fieldDrag.r.width) * 100;
      const py = ((e.clientY - fieldDrag.r.top) / fieldDrag.r.height) * 100;
      const w = Math.max(6, Math.min(100 - fieldDrag.left, px - fieldDrag.left));
      const h = Math.max(5, Math.min(100 - fieldDrag.top, py - fieldDrag.top));
      state.layout[fieldDrag.id] = { ...(state.layout[fieldDrag.id] || {}), w, h };
      if (box) { box.style.width = `${w}%`; box.style.height = `${h}%`; }
      return;
    }
    const dx = ((e.clientX - fieldDrag.fromX) / fieldDrag.r.width) * 100;
    const dy = ((e.clientY - fieldDrag.fromY) / fieldDrag.r.height) * 100;
    const x = Math.max(0, Math.min(100 - fieldDrag.w, fieldDrag.startX + dx));
    const y = Math.max(0, Math.min(100 - fieldDrag.h, fieldDrag.startY + dy));
    state.layout[fieldDrag.id] = { ...(state.layout[fieldDrag.id] || {}), x, y };
    if (box) { box.style.left = `${x}%`; box.style.top = `${y}%`; }
  });
  const dropField = () => {
    if (!fieldDrag) return;
    fieldDrag = null;
    tell();
  };
  fieldsEl.addEventListener("pointerup", dropField);
  fieldsEl.addEventListener("pointercancel", dropField);

  /**
   * A NOTE IS DRAGGED, AND A PIN CATCHES IT.
   *
   * The notes are painted on a canvas, which cannot be asked what is under a
   * finger — so the boxes are remembered as they are drawn (`noteBoxes`) and
   * the sheet does the hit-testing itself. Dropped on a pin the note takes
   * the pin and is measured against its neighbours from then on; dropped
   * anywhere else it simply lies where it was put. Double-click one to open
   * it again.
   */
  const PIN_CATCH = 7;        // how near a pin has to be, in sheet-widths %
  let noteDrag = null;
  /* CAUGHT ON THE WAY DOWN. A note lying over a field is ABOVE it on the
     board, so it must get the press — and a listener that waits for the
     event to bubble gets it after the field has already taken the caret.
     The note is only intercepted when one is really under the finger. */
  sheet.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".og__pin")) return;
    const r = sheet.getBoundingClientRect();
    const hit = noteAt(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    const n = state.notes.find((x) => x.id === hit.id);
    if (!n) return;
    e.preventDefault();
    e.stopPropagation();
    const at = spotOf(n);
    noteDrag = { n, r, from: { x: e.clientX, y: e.clientY }, at, moved: false };
    sheet.setPointerCapture(e.pointerId);
  }, true);
  sheet.addEventListener("pointermove", (e) => {
    if (!noteDrag) return;
    const dx = ((e.clientX - noteDrag.from.x) / noteDrag.r.width) * 100;
    const dy = ((e.clientY - noteDrag.from.y) / noteDrag.r.height) * 100;
    if (!noteDrag.moved && Math.hypot(dx, dy) < 0.8) return;
    noteDrag.moved = true;
    noteDrag.n.pin = null;              // picked up, it is loose until it lands
    noteDrag.n.x = Math.max(2, Math.min(98, noteDrag.at.x + dx));
    noteDrag.n.y = Math.max(2, Math.min(98, noteDrag.at.y + dy));
    /* the pin it would land on lights up, so you can see it is going to catch */
    const near = nearestPin(noteDrag.n.x, noteDrag.n.y);
    over = near ? near.id : null;
    paintPins();
    paintNotes();
  });
  const dropNote = () => {
    if (!noteDrag) return;
    const d = noteDrag;
    noteDrag = null;
    over = null;
    if (!d.moved) {
      if (twiceNote(d.n.id)) write(d.n);
      paintPins();
      return;
    }
    const near = nearestPin(d.n.x, d.n.y);
    if (near) d.n.pin = near.id;
    paintAll();
    tell();
  };
  sheet.addEventListener("pointerup", dropNote);
  sheet.addEventListener("pointercancel", dropNote);

  let over = null;
  function nearestPin(x, y) {
    let best = null;
    let gap = PIN_CATCH;
    state.pins.forEach((p) => {
      const d = Math.hypot(p.x - x, (p.y - y) * 0.62);
      if (d < gap) { gap = d; best = p; }
    });
    return best;
  }

  /* a second tap opens the note again; counted here, as everywhere else on
     the bench, because the sheet is repainted between the two */
  let lastNote = null;
  function twiceNote(id) {
    const now = Date.now();
    const yes = lastNote && lastNote.id === id && now - lastNote.at < 450;
    lastNote = yes ? null : { id, at: now };
    return yes;
  }

  /* ── a pin is put where the note should be ───────────────────────────── */
  let drag = null;
  let dragged = false;
  pinsEl.addEventListener("pointerdown", (e) => {
    const id = e.target.closest("[data-pin]")?.dataset.pin;
    if (!id) return;
    const p = state.pins.find((x) => x.id === Number(id));
    if (!p) return;
    e.preventDefault();
    picked = p.id;
    dragged = false;
    drag = { p, r: sheet.getBoundingClientRect() };
    pinsEl.setPointerCapture(e.pointerId);
    paintPins();
  });
  pinsEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const x = ((e.clientX - drag.r.left) / drag.r.width) * 100;
    const y = ((e.clientY - drag.r.top) / drag.r.height) * 100;
    if (Math.abs(x - drag.p.x) < 0.4 && Math.abs(y - drag.p.y) < 0.4 && !dragged) return;
    dragged = true;
    drag.p.x = Math.max(1, Math.min(96, Math.round(x * 2) / 2));
    drag.p.y = Math.max(1, Math.min(94, Math.round(y * 2) / 2));
    paintPins();
    paintNotes();
  });
  const drop = () => {
    if (!drag) return;
    drag = null;
    if (dragged) tell();
    /* the press that ends a drag must not also open the editor */
    setTimeout(() => { dragged = false; }, 0);
  };
  pinsEl.addEventListener("pointerup", drop);
  pinsEl.addEventListener("pointercancel", drop);

  /* ── writing a note on a pin ─────────────────────────────────────────── */
  let pad = null;
  /**
   * WRITING A NOTE — in the site's one note editor, the same pad as the
   * workbook's Notes key and the Toy Shop's. There is no second note here:
   * the face, the size, the colour of the writing, the paper under it and an
   * equation if the thought needs one all work the way they work everywhere
   * else (sticky-note-editor.js).
   */
  async function write(note) {
    const { createStickyEditor } = await import("/utils/components/sticky-note-editor.js");
    if (!pad) {
      pad = createStickyEditor({
        host: el,
        onInput: (n) => {
          if (!pad.on) return;
          Object.assign(pad.on, { runs: n.runs, paper: n.paper });
          paintNotes();
        },
        onDone: (n) => {
          if (!pad.on) return;
          Object.assign(pad.on, { runs: n.runs, paper: n.paper });
          /* a note left blank is not a note */
          if (!pad.on.runs?.some((r) => String(r.text || "").trim() || r.tex)) {
            state.notes = state.notes.filter((x) => x.id !== pad.on.id);
          }
          pad.on = null;
          paintNotes();
          paintPins();
          tell();
        },
      });
    }
    pad.on = note;
    pad.open(makeNote(note.runs ? { runs: note.runs, paper: note.paper || 0 } : {}));
  }

  const watch = new ResizeObserver(() => paintNotes());
  watch.observe(sheet);
  paintAll();
  requestAnimationFrame(paintNotes);

  return {
    el,
    get: () => ({
      fields: { ...state.fields },
      pins: state.pins.map((p) => ({ ...p })),
      notes: state.notes.map((n) => ({ ...n })),
      grid: { ...state.grid },
      preset: state.preset,
      layout: { ...state.layout },
    }),
    dispose() { watch.disconnect(); pad?.destroy?.(); el.remove(); },
  };
}

/* the pin and the bin, in the house's filled icon language */
const PIN_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">`
  + `<path d="M9.4 2.6h5.2l-1 5.2 3.8 3.4v2H6.6v-2l3.8-3.4z" fill="var(--accent-danger,#c0453f)"/>`
  + `<rect x="11.2" y="13.2" width="1.6" height="8.2" fill="var(--ink,#2a2723)"/></svg>`;
const NOTE_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">`
  + `<rect x="3.4" y="4.6" width="17.2" height="15.8" fill="var(--accent-primary,#fff3a8)" stroke="var(--ink,#2a2723)" stroke-width="1.2"/>`
  + `<rect x="8.6" y="2.8" width="7" height="3.2" fill="var(--text-tertiary,#6f685f)" opacity="0.55"/>`
  + `<rect x="6" y="10" width="12" height="1.3" fill="var(--ink,#2a2723)" opacity="0.45"/>`
  + `<rect x="6" y="13.4" width="12" height="1.3" fill="var(--ink,#2a2723)" opacity="0.45"/>`
  + `<rect x="6" y="16.8" width="7.4" height="1.3" fill="var(--ink,#2a2723)" opacity="0.45"/></svg>`;
const BIN_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">`
  + `<rect x="8.6" y="2.4" width="6.8" height="2.6" fill="var(--accent-danger,#c0453f)"/>`
  + `<rect x="3" y="5" width="18" height="3.2" fill="var(--accent-danger,#c0453f)"/>`
  + `<rect x="5.2" y="9.4" width="13.6" height="12" fill="var(--accent-primary,#f4c95d)" stroke="var(--ink,#2a2723)" stroke-width="1.2"/></svg>`;

/* a corner to pull a box bigger or smaller by, and a cross to drag it by */
const RESIZE_ICON = `<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">`
  + `<path d="M20 8 8 20M20 14 14 20M20 20H17" fill="none" stroke="var(--text-tertiary,#6f685f)"`
  + ` stroke-width="2.2" stroke-linecap="round"/></svg>`;
const MOVE_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">`
  + `<path d="M12 2 8.6 6h6.8Z" fill="var(--text-tertiary,#6f685f)"/>`
  + `<path d="M12 22 8.6 18h6.8Z" fill="var(--text-tertiary,#6f685f)"/>`
  + `<path d="M2 12 6 8.6v6.8Z" fill="var(--text-tertiary,#6f685f)"/>`
  + `<path d="M22 12 18 8.6v6.8Z" fill="var(--text-tertiary,#6f685f)"/>`
  + `<rect x="10.4" y="10.4" width="3.2" height="3.2" fill="var(--text-tertiary,#6f685f)"/></svg>`;
