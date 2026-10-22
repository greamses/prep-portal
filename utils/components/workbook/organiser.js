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
  `<ellipse cx="${cx}" cy="${cy}" rx="${(r / ASPECT).toFixed(2)}" ry="${r}" fill="${fill}"${extra}/>`;
/** A point on a ring that looks like a ring, not an oval. */
const ring = (cx, cy, r, i, n) => {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return [cx + (Math.cos(a) * r) / ASPECT, cy + Math.sin(a) * r];
};

/* ── the shapes ──────────────────────────────────────────────────────────
   Every field is placed in PERCENTAGES of the sheet, so one organiser is one
   drawing at any size — on a phone, in a panel, on a board at the front. */

/* A sesame seed, scattered across the crown of the bun. They are drawn at an
   angle each, because a seed that is level is a seed somebody drew. */
const seed = (x, y, a) =>
  `<ellipse cx="${x}" cy="${y}" rx="1.5" ry="0.72" fill="#fdf0d2" stroke="#d8b878"`
  + ` stroke-width="0.18" transform="rotate(${a} ${x} ${y})"/>`;

/** A ruffled edge — lettuce, and the lick of melted cheese. */
function ruffle(y, amp, n, from = 4, to = 96) {
  let d = `M${from} ${y}`;
  const w = (to - from) / n;
  for (let i = 0; i < n; i++) {
    const x = from + w * i;
    d += ` q${(w / 4).toFixed(2)} ${amp} ${(w / 2).toFixed(2)} 0 q${(w / 4).toFixed(2)} ${-amp} ${(w / 2).toFixed(2)} 0`;
  }
  return d;
}

const BURGER = {
  label: "Paragraph burger",
  say: "A paragraph has a top, a filling and a bottom. Build it before you write it.",
  art: () => `
    <defs>
      <linearGradient id="og-bunTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f0c988"/><stop offset="0.55" stop-color="#dfa85f"/>
        <stop offset="1" stop-color="#cf9348"/>
      </linearGradient>
      <linearGradient id="og-bunLow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d79f55"/><stop offset="1" stop-color="#c0863c"/>
      </linearGradient>
      <linearGradient id="og-meat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8d5733"/><stop offset="1" stop-color="#6d3f24"/>
      </linearGradient>
    </defs>

    <!-- the crown: domed, with the shine a baked crust has -->
    <path d="M5 23.5C5 11.5 22 4.5 50 4.5s45 7 45 19v1.5H5z" fill="url(#og-bunTop)"
          stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M12 17c6-6 20-9.5 33-9.6" fill="none" stroke="#fae3bb" stroke-width="1.6"
          stroke-linecap="round" opacity="0.65"/>
    ${[[23, 15, -16], [36, 11.5, 9], [50, 10.2, -5], [64, 11.8, 14], [77, 15.6, -10],
       [30, 19, 6], [58, 18, -12], [71, 20.4, 8], [44, 16.6, 3]].map(([x, y, a]) => seed(x, y, a)).join("")}

    <!-- lettuce: a band with a ruffled hem -->
    <path d="${ruffle(26, 3.4, 7)} L96 38 L4 38Z" fill="#9ed06f" stroke="${INK}" stroke-width="0.9"/>
    <path d="${ruffle(29.5, 2.2, 9)}" fill="none" stroke="#7bb352" stroke-width="0.7" opacity="0.8"/>

    <!-- tomato: a slice, with its pale core and its seeds -->
    <rect x="6" y="39" width="88" height="13" rx="0" fill="#e2574f" stroke="${INK}" stroke-width="0.9"/>
    <rect x="9" y="42" width="82" height="7" fill="#ef8178" opacity="0.75"/>
    ${[14, 28, 42, 56, 70, 84].map((x) => `<ellipse cx="${x}" cy="45.5" rx="1.5" ry="1.1" fill="#f6c9a0" stroke="#c9463f" stroke-width="0.2"/>`).join("")}

    <!-- cheese: a square slice that has begun to go over the edge -->
    <path d="M5 53h90v9.5c0 0-6 1-9 4.2-2 2-4.4 1.2-6-0.6-1.6-1.8-4-2-5.6 0.2-1.8 2.4-5 2-6.6-0.2-1.4-2-4-1.8-5.4 0.4-1.6 2.4-5 2.2-6.6 0-1.4-2-4-2-5.6 0.2-1.8 2.2-4.8 1.8-6.4-0.4C45 64 42.6 64 41 66c-2 2.4-5 1.6-6.4-0.4C33 63.4 30.6 63.6 29 65.6c-1.8 2.2-5 1.6-6.6-0.6C21 63 18.6 63.2 17 65c-2 2.2-5.4 1.4-7-0.8-1-1.4-3-1.6-5-1.7z"
          fill="#f7c948" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>

    <!-- the patty, and the heel it sits on -->
    <rect x="4" y="66" width="92" height="12" fill="url(#og-meat)" stroke="${INK}" stroke-width="1"/>
    ${[12, 30, 48, 66, 84].map((x) => `<rect x="${x}" y="69.6" width="7" height="1.3" fill="#4e2b16" opacity="0.5"/>`).join("")}
    <path d="M6 79h88v9c0 4.6-4 7.6-10 7.6H16C10 95.6 6 92.6 6 88z" fill="url(#og-bunLow)"
          stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`,
  fields: [
    { id: "top", head: "Topic sentence — what the whole paragraph is about", x: 12, y: 8, w: 76, h: 13 },
    { id: "a", head: "First detail", x: 7, y: 27.5, w: 86, h: 10 },
    { id: "b", head: "Second detail", x: 8, y: 39.5, w: 84, h: 12 },
    { id: "c", head: "Third detail", x: 8, y: 53.5, w: 84, h: 11 },
    { id: "end", head: "Closing sentence", x: 10, y: 80, w: 80, h: 14 },
  ],
};

const MOUNTAIN = {
  label: "Story mountain",
  say: "A story climbs to one moment and comes down the other side. Put yours on the slope.",
  art: () => `
    <defs>
      <linearGradient id="og-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dbeeff"/><stop offset="1" stop-color="#f4f7e8"/>
      </linearGradient>
      <linearGradient id="og-rock" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#9fb3c8"/><stop offset="0.48" stop-color="#c2d2e0"/>
        <stop offset="0.52" stop-color="#8ea3b8"/><stop offset="1" stop-color="#6f869d"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="100" height="92" fill="url(#og-sky)"/>

    <!-- the hills behind, so the climb has something to be bigger than -->
    <path d="M0 92 Q14 72 27 80 Q38 86 46 92Z" fill="#b9cbb0" opacity="0.75"/>
    <path d="M58 92 Q70 74 82 81 Q92 86 100 92Z" fill="#b9cbb0" opacity="0.75"/>

    <!-- THE MOUNTAIN, drawn in curves. A story does not climb in a straight
         line and neither should the picture of one: the rise is slow, the
         turn is sudden, and the way down is quicker than the way up. -->
    <path d="M2 92 C14 90 20 76 28 62 C36 48 42 28 50 13 C58 28 65 50 73 64 C80 77 88 90 98 92Z"
          fill="url(#og-rock)" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
    <!-- the snow on the top, melted unevenly as snow is -->
    <path d="M50 13 C54 20 57 27 59.6 33 C56 35 54 31.6 51 33.4 C48.4 35 46 32 43.4 33.6 C41.6 30 44 24 50 13Z"
          fill="#fdfdfb" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
    <!-- a crease down each face, so it reads as rock and not as a triangle -->
    <path d="M50 16 C47 32 42 46 33 60" fill="none" stroke="#6f869d" stroke-width="0.7" opacity="0.7"/>
    <path d="M52 20 C56 36 62 50 70 62" fill="none" stroke="#5d7389" stroke-width="0.7" opacity="0.5"/>

    <!-- the path up it, and the five places the story stops -->
    <path d="M8 90 C18 86 22 76 30 66 C37 57 42 36 50 18 C57 36 63 56 71 66 C78 76 84 86 92 90"
          fill="none" stroke="#fffdf8" stroke-width="1.1" stroke-dasharray="2.4 2.4" opacity="0.9"/>
    <rect x="0" y="90" width="100" height="10" fill="#9bb882"/>
    <path d="${ruffle(90, 1.4, 22, 0, 100)}" fill="none" stroke="#86a66f" stroke-width="0.9"/>
    ${[[8, 90], [30, 66], [50, 18], [71, 66], [92, 90]].map(([x, y]) =>
      circ(x, y, 2.2, "#c0453f", ' stroke="#fffdf8" stroke-width="0.8"')).join("")}`,
  fields: [
    { id: "open", head: "Opening — who, where, when", x: 1, y: 60, w: 22, h: 26 },
    { id: "rise", head: "Build-up — what starts to go wrong", x: 13, y: 33, w: 23, h: 24 },
    { id: "top", head: "The moment everything turns", x: 34, y: 0.5, w: 32, h: 12 },
    { id: "fall", head: "What happens because of it", x: 64, y: 33, w: 23, h: 24 },
    { id: "end", head: "Ending — how it is left", x: 77, y: 60, w: 22, h: 26 },
  ],
};

const TABLE = {
  label: "Table",
  say: "Rows and columns, for the things that are only clear side by side.",
  grid: { rows: 4, cols: 3 },
};

const VENN = {
  label: "Venn diagram",
  say: "What belongs to one, what belongs to the other, and what they share in the middle.",
  art: () => circ(38, 54, 36, "#bfe3ff", ` fill-opacity="0.62" stroke="${INK}" stroke-width="1.2"`)
    + circ(62, 54, 36, "#ffd9cf", ` fill-opacity="0.62" stroke="${INK}" stroke-width="1.2"`),
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
        + ` stroke="${INK}" stroke-width="0.7" stroke-dasharray="2 2"/>`;
      discs += circ(x.toFixed(2), y.toFixed(2), 15, "#d6f0cf", ` stroke="${INK}" stroke-width="1.1"`);
    });
    return spokes + discs + circ(cx, cy, 15, "#fff3a8", ` stroke="${INK}" stroke-width="1.3"`);
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
  const state = {
    fields: { ...(saved?.fields || {}) },
    pins: Array.isArray(saved?.pins) ? saved.pins.map((p) => ({ ...p })) : [],
    grid: { ...(spec.grid || {}), ...(saved?.grid || {}) },
  };
  let seq = 1 + Math.max(0, ...state.pins.map((p) => p.id || 0));
  let picked = null;

  const el = document.createElement("div");
  el.className = `og og--${kind}`;
  el.innerHTML = `
    <div class="og__top">
      <p class="og__say">${esc(spec.say)}</p>
      <span class="og__keys">
        <button type="button" class="pp-btn wb-tint-2 og__key" data-og="pin"
                aria-label="Add a pin for a sticky note" data-tip="Add a pin, then write its note">${PIN_ICON}</button>
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

  const tell = () => onChange({ fields: { ...state.fields }, pins: state.pins.map((p) => ({ ...p })), grid: { ...state.grid } });

  /* ── the shape, and the boxes to type in ────────────────────────────── */
  function fieldsOf() {
    if (!spec.grid) return spec.fields;
    /* a table is its own fields, because how many there are is a setting */
    const { rows, cols } = state.grid;
    const out = [];
    const cw = 96 / cols;
    const ch = 92 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({
          id: `r${r}c${c}`,
          head: r === 0 ? `Heading ${c + 1}` : "",
          x: 2 + c * cw, y: 4 + r * ch, w: cw - 1, h: ch - 1,
          mid: r === 0,
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
      let out = `<rect x="2" y="4" width="96" height="92" fill="#fffdf8" stroke="${INK}" stroke-width="1.1"/>`
        + `<rect x="2" y="4" width="96" height="${ch}" fill="#fff3a8" stroke="${INK}" stroke-width="1.1"/>`;
      for (let c = 1; c < cols; c++) out += `<line x1="${2 + c * cw}" y1="4" x2="${2 + c * cw}" y2="96" stroke="${INK}" stroke-width="0.8"/>`;
      for (let r = 1; r < rows; r++) out += `<line x1="2" y1="${4 + r * ch}" x2="98" y2="${4 + r * ch}" stroke="${INK}" stroke-width="0.8"/>`;
      art.innerHTML = out;
      return;
    }
    art.innerHTML = spec.art();
  }

  function paintFields() {
    fieldsEl.innerHTML = fieldsOf().map((f) => `
      <label class="og__field${f.mid ? " is-mid" : ""}" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%">
        ${f.head ? `<span class="og__head">${esc(f.head)}</span>` : ""}
        <textarea data-field="${f.id}" aria-label="${esc(f.head || f.hint || f.id)}"
                  placeholder="${esc(f.hint || "")}">${esc(state.fields[f.id] || "")}</textarea>
      </label>`).join("");
  }

  /* ── the pins ────────────────────────────────────────────────────────── */
  function paintPins() {
    pinsEl.innerHTML = state.pins.map((p) => `
      <button type="button" class="og__pin${picked === p.id ? " is-picked" : ""}" data-pin="${p.id}"
              style="left:${p.x}%;top:${p.y}%"
              aria-label="${p.note ? "The note on this pin" : "An empty pin — click to write its note"}"
              data-tip="${p.note ? "Click to change this note" : "Click to write this note"}">${PIN_ICON}</button>`).join("");
  }

  /**
   * THE NOTES, DRAWN. They are the site's own sticky notes, painted on to a
   * sheet of their own above the shape: a note is a piece of paper lying on
   * the board, not a box in it. The canvas takes no clicks — the PIN is the
   * handle, which is the point of pinning them.
   */
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
    state.pins.forEach((p) => {
      if (!p.note || !p.note.runs?.length) return;
      const note = makeNote({ runs: p.note.runs, paper: p.note.paper || 0 });
      const lay = layoutNote(note, { maxWidth: roomFor(p, state.pins, r.width) });
      g.save();
      /* the note hangs BELOW and a little right of its pin, the way a note
         pushed on to a pin hangs from it */
      g.translate((p.x / 100) * r.width - lay.width * 0.18, (p.y / 100) * r.height + 6);
      paintSticky(g, note, lay, { tilt: tiltOf(p.id) });
      g.restore();
    });
  }

  const paintAll = () => { paintArt(); paintFields(); paintPins(); paintNotes(); };

  /* ── what the keys do ────────────────────────────────────────────────── */
  el.addEventListener("click", (e) => {
    const k = e.target.closest("[data-og]")?.dataset.og;
    if (k === "pin") {
      const p = { id: seq++, x: 50, y: 46, note: null };
      state.pins.push(p);
      picked = p.id;
      paintAll();
      tell();
      write(p);
      return;
    }
    if (k === "row+") { state.grid.rows = Math.min(12, state.grid.rows + 1); paintAll(); tell(); return; }
    if (k === "col+") { state.grid.cols = Math.min(8, state.grid.cols + 1); paintAll(); tell(); return; }
    if (k === "row-" || k === "col-") { shrink(k === "row-" ? "rows" : "cols"); return; }
    if (k === "clear") {
      if (picked == null) return;
      state.pins = state.pins.filter((p) => p.id !== picked);
      picked = null;
      paintAll();
      tell();
      return;
    }
    const pin = e.target.closest("[data-pin]")?.dataset.pin;
    if (pin && !dragged) {
      const p = state.pins.find((x) => x.id === Number(pin));
      picked = p.id;
      paintPins();
      write(p);
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
  async function write(pin) {
    const { createStickyEditor } = await import("/utils/components/sticky-note-editor.js");
    if (!pad) {
      pad = createStickyEditor({
        host: el,
        onInput: (note) => {
          if (!pad.on) return;
          pad.on.note = { runs: note.runs, paper: note.paper };
          paintNotes();
        },
        onDone: (note) => {
          if (!pad.on) return;
          pad.on.note = { runs: note.runs, paper: note.paper };
          pad.on = null;
          paintNotes();
          tell();
        },
      });
    }
    pad.on = pin;
    pad.open(makeNote(pin.note && pin.note.runs ? { runs: pin.note.runs, paper: pin.note.paper || 0 } : {}));
  }

  const watch = new ResizeObserver(() => paintNotes());
  watch.observe(sheet);
  paintAll();
  requestAnimationFrame(paintNotes);

  return {
    el,
    get: () => ({ fields: { ...state.fields }, pins: state.pins.map((p) => ({ ...p })), grid: { ...state.grid } }),
    dispose() { watch.disconnect(); pad?.destroy?.(); el.remove(); },
  };
}

/* the pin and the bin, in the house's filled icon language */
const PIN_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">`
  + `<path d="M9.4 2.6h5.2l-1 5.2 3.8 3.4v2H6.6v-2l3.8-3.4z" fill="var(--accent-danger,#c0453f)"/>`
  + `<rect x="11.2" y="13.2" width="1.6" height="8.2" fill="var(--ink,#2a2723)"/></svg>`;
const BIN_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">`
  + `<rect x="8.6" y="2.4" width="6.8" height="2.6" fill="var(--accent-danger,#c0453f)"/>`
  + `<rect x="3" y="5" width="18" height="3.2" fill="var(--accent-danger,#c0453f)"/>`
  + `<rect x="5.2" y="9.4" width="13.6" height="12" fill="var(--accent-primary,#f4c95d)" stroke="var(--ink,#2a2723)" stroke-width="1.2"/></svg>`;
