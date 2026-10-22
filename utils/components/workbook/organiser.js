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

const BURGER = {
  label: "Paragraph burger",
  say: "A paragraph has a top, a filling and a bottom. Build it before you write it.",
  art: () => `
    <path d="M6 20C6 11 22 6 50 6s44 5 44 14v3H6z" fill="#e8b96a" stroke="${INK}" stroke-width="1"/>
    <path d="M14 13.5c1.6-1.2 3.2-1.2 4.8 0M30 10.5c1.6-1.2 3.2-1.2 4.8 0M52 9.6c1.6-1.2 3.2-1.2 4.8 0M72 11.4c1.6-1.2 3.2-1.2 4.8 0"
          fill="none" stroke="#c99a46" stroke-width="1.1" stroke-linecap="round"/>
    <rect x="5" y="25" width="90" height="15" fill="#8fc96b" stroke="${INK}" stroke-width="1"/>
    <rect x="6" y="42" width="88" height="15" fill="#e2706a" stroke="${INK}" stroke-width="1"/>
    <rect x="5" y="59" width="90" height="15" fill="#f6d35a" stroke="${INK}" stroke-width="1"/>
    <path d="M6 78h88v10c0 4-3 6-8 6H14c-5 0-8-2-8-6z" fill="#e0ae5d" stroke="${INK}" stroke-width="1"/>`,
  fields: [
    { id: "top", head: "Topic sentence — what the whole paragraph is about", x: 8, y: 7.5, w: 84, h: 13 },
    { id: "a", head: "First detail", x: 7, y: 26, w: 86, h: 13 },
    { id: "b", head: "Second detail", x: 8, y: 43, w: 84, h: 13 },
    { id: "c", head: "Third detail", x: 7, y: 60, w: 86, h: 13 },
    { id: "end", head: "Closing sentence", x: 8, y: 78, w: 84, h: 13 },
  ],
};

const MOUNTAIN = {
  label: "Story mountain",
  say: "A story climbs to one moment and comes down the other side. Put yours on the slope.",
  art: () => `
    <path d="M3 88 L26 60 L50 16 L74 60 L97 88Z" fill="#dce9f7" stroke="${INK}" stroke-width="1.2"/>
    <path d="M50 16 L62 38 H38Z" fill="#fffdf8" stroke="${INK}" stroke-width="0.9"/>
    <line x1="2" y1="88" x2="98" y2="88" stroke="${INK}" stroke-width="1.4"/>
    ${[[26, 60], [50, 16], [74, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#c0453f"/>`).join("")}
    <circle cx="6" cy="88" r="2" fill="#c0453f"/><circle cx="94" cy="88" r="2" fill="#c0453f"/>`,
  fields: [
    { id: "open", head: "Opening — who, where, when", x: 1, y: 62, w: 23, h: 24 },
    { id: "rise", head: "Build-up — what starts to go wrong", x: 15, y: 34, w: 23, h: 22 },
    { id: "top", head: "The moment everything turns", x: 36, y: 1, w: 28, h: 13 },
    { id: "fall", head: "What happens because of it", x: 62, y: 34, w: 23, h: 22 },
    { id: "end", head: "Ending — how it is left", x: 76, y: 62, w: 23, h: 24 },
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
        ${spec.grid ? `<button type="button" class="pp-btn wb-tint-1 og__key" data-og="row" aria-label="One more row" data-tip="One more row">+ row</button>
        <button type="button" class="pp-btn wb-tint-1 og__key" data-og="col" aria-label="One more column" data-tip="One more column">+ col</button>` : ""}
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
    if (k === "row") { state.grid.rows = Math.min(12, state.grid.rows + 1); paintAll(); tell(); return; }
    if (k === "col") { state.grid.cols = Math.min(8, state.grid.cols + 1); paintAll(); tell(); return; }
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
