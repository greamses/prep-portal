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
 * THE TABLE IS A DOZEN ORGANISERS WEARING ONE SHAPE.
 *
 * K-W-L, a T-chart, OREO, cause and effect, a sequence chain, the five
 * senses — every one of them is rows and columns with its headings already
 * written in. Giving each its own key on the rail would be a dozen keys for
 * one drawing; they are PRESETS of the table instead, and the child picks
 * the one the lesson is about.
 *
 *   heads   what goes across the top — the columns
 *   stubs   what goes down the side — a first column of labels that are
 *           part of the method, not something to fill in. OREO's four
 *           letters are not a question; they are the shape of the argument.
 */
export const TABLE_PRESETS = {
  blank: { label: "Blank", rows: 4, heads: ["", "", ""] },
  kwl: {
    label: "K · W · L",
    say: "What you knew before, what you wanted to know, and what you came away with.",
    rows: 5,
    heads: ["What I already know", "What I want to find out", "What I learned"],
  },
  tchart: {
    label: "T-chart",
    say: "Both sides, fairly, before you decide which one you are on.",
    rows: 6,
    heads: ["For", "Against"],
  },
  oreo: {
    label: "OREO",
    say: "Opinion, Reason, Example, Opinion again — an argument that closes where it opened.",
    heads: ["What I will write"],
    stubs: ["O — my opinion", "R — the reason for it", "E — an example that proves it", "O — my opinion again"],
  },
  cause: {
    label: "Cause and effect",
    say: "What happened, and what it made happen. One line for each pair.",
    rows: 6,
    heads: ["The cause — what happened", "The effect — what it made happen"],
  },
  chain: {
    label: "Sequence chain",
    say: "In order, from the first thing to the last.",
    heads: ["What happens"],
    stubs: ["First", "Next", "Then", "After that", "Finally"],
  },
  senses: {
    label: "The five senses",
    say: "Writing a reader can stand inside: what it was like for each sense.",
    heads: ["What it was like"],
    stubs: ["I saw", "I heard", "I felt", "I smelt", "I tasted"],
  },
};

const TABLE = {
  label: "Table",
  say: "Rows and columns, for the things that are only clear side by side.",
  grid: { rows: 4, cols: 3 },
  presets: TABLE_PRESETS,
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
  });

  /* ── the shape, and the boxes to type in ────────────────────────────── */
  const preset = () => (spec.presets ? spec.presets[state.preset] || spec.presets.blank : null);

  function fieldsOf() {
    if (!spec.grid) return spec.fields;
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
        out.push({
          id: `r${r}c${c}`,
          head: r === 0 ? (set?.heads?.[stubs ? c - 1 : c] ?? "") : "",
          x: 2 + c * cw, y: 4 + r * ch, w: cw - 1, h: ch - 1,
          mid: r === 0,
          stub,
        });
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
      return `<label class="og__field${f.mid ? " is-mid" : ""}" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%">
        ${f.head ? `<span class="og__head">${esc(f.head)}</span>` : ""}
        <textarea data-field="${f.id}" aria-label="${esc(f.head || f.hint || f.id)}"
                  placeholder="${esc(f.hint || "")}">${esc(state.fields[f.id] || "")}</textarea>
      </label>`;
    }).join("");
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
