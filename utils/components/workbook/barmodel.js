/* ============================================================================
   PRINTABLE WORKBOOK — a bar model you BUILD
   ----------------------------------------------------------------------------
   On paper a word problem leaves an empty strip to draw its bar model in. On
   screen the strip becomes a board of bars, and the child builds the model
   the way a Singapore class does with paper strips:

     New bar        a bar on the next free row
     drag           move a bar anywhere; it settles on a row (so bars STACK,
                    lined up at the left) and its ends catch other bars' ends
     stretch        drag a bar's right edge — longer or shorter
     Units + / −    cut the bar into equal units (fifths, ten 10 % units …)
     Cut            tap a bar where it should break: it comes apart in two
     Over / Under   a curly brace over or under the picked bars, with words
     Colour         the bar's colour, round the four
     Delete         the picked bars, and the braces that hung on them

   and every word is written by DOUBLE-CLICKING it: a unit's own label (a
   number, a "?", "10 %"), or a brace's words. Tap picks a bar; with "Pick
   several" on (or Shift held) taps add to the picking, so one brace can span
   two bars.

   It is working, never marked — what the model shows goes in the answer
   boxes beside it. The engine keeps it with the question and makes every
   change one Undo step (interactive.js).

     [data-barmodel]   the strip to build in; what was printed in it comes back
                       on dispose()
     [data-start]      a model to begin from (JSON) — the printed picture, so
                       "From the picture" puts it on the board to be broken,
                       labelled and moved about
     [data-fold]       a board under a printed picture: it waits folded to one
                       button until it is wanted (or already has work on it)

   The model is plain data — { bars: [{ id, x, row, w, n, tone, labels }],
   braces: [{ id, ids, at, text }] } in board units, 600 across.
   ========================================================================== */

const W = 600;
const BAR = 26;
const GAP = 8;         // between two stacked bars with nothing between them
const ROOM = 30;       // what a brace and its words need over or under a bar
const LEVEL = 22;      // and each further brace stacked on the same side
const SNAP = 5;
const CATCH = 9;       // how near an end must come to catch another
const TONES = ["#bfe3ff", "#fff3a8", "#d6f0cf", "#ffd9cf", "#fffdf8"];
const INK = "#2a2723";
const GREY = "#6f685f";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clone = (m) => JSON.parse(JSON.stringify(m));
const blank = () => ({ bars: [], braces: [] });

function curly(x0, x1, y, dir) {
  const h = 9 * dir;
  const m = (x0 + x1) / 2;
  const r = Math.min(6, (x1 - x0) / 5);
  return `M${x0} ${y}Q${x0} ${y + h / 2} ${x0 + r} ${y + h / 2}H${m - r}Q${m} ${y + h / 2} ${m} ${y + h}` +
    `Q${m} ${y + h / 2} ${m + r} ${y + h / 2}H${x1 - r}Q${x1} ${y + h / 2} ${x1} ${y}`;
}

/** Where a brace is drawn: its span, its row, and how high it stacks. */
function braceSpots(model) {
  const byId = new Map(model.bars.map((b) => [b.id, b]));
  const spots = [];
  model.braces.forEach((br) => {
    const bars = br.ids.map((id) => byId.get(id)).filter(Boolean);
    if (!bars.length) return;
    const x0 = Math.min(...bars.map((b) => b.x));
    const x1 = Math.max(...bars.map((b) => b.x + b.w));
    const row = br.at === "above" ? Math.min(...bars.map((b) => b.row)) : Math.max(...bars.map((b) => b.row));
    /* a second brace on the same side of the same row, overlapping, goes a
       step further out */
    const level = spots.filter((s) => s.row === row && s.at === br.at && s.x0 < x1 && x0 < s.x1).length;
    spots.push({ br, x0, x1, row, at: br.at, level });
  });
  return spots;
}

/**
 *   mountBarModel(el, { saved, onChange })
 *     saved                 a model from before, or null
 *     onChange(now, before) after every change, for Undo
 *   → { get(), set(model), clear(), dispose() }
 */
export function mountBarModel(el, { saved = null, onChange = () => {} } = {}) {
  const printed = el.innerHTML;
  let model = saved ? clone(saved) : blank();
  let picked = new Set();
  let several = false;
  let cutting = false;
  let seq = 1 + Math.max(0, ...model.bars.map((b) => b.id), ...model.braces.map((b) => b.id));

  let start = null;
  try { start = el.dataset.start ? JSON.parse(el.dataset.start) : null; } catch { start = null; }
  const foldable = el.hasAttribute("data-fold");

  el.classList.add("is-building");
  el.classList.toggle("is-folded", foldable && !model.bars.length);
  el.innerHTML =
    (foldable ? `<button type="button" class="pp-btn wb-tint-2 mbb-open">Build the model on a board</button>` : "") +
    `<div class="mbb-tools" role="toolbar" aria-label="Bar model tools">` +
    (start ? `<button type="button" class="pp-btn wb-tint-3" data-t="copy" title="Put the printed model on the board">From the picture</button>` : "") +
    `<button type="button" class="pp-btn wb-tint-2" data-t="new">New bar</button>` +
    `<button type="button" class="pp-btn wb-tint-1" data-t="less" title="Fewer equal units">Units −</button>` +
    `<button type="button" class="pp-btn wb-tint-1" data-t="more" title="Cut into more equal units">Units +</button>` +
    `<button type="button" class="pp-btn wb-tint-3" data-t="cut" aria-pressed="false" title="Tap a bar where it should break">Cut</button>` +
    `<button type="button" class="pp-btn wb-tint-4" data-t="above" title="A brace over the picked bars">Brace over</button>` +
    `<button type="button" class="pp-btn wb-tint-4" data-t="below" title="A brace under the picked bars">Brace under</button>` +
    `<button type="button" class="pp-btn wb-tint-2" data-t="tone">Colour</button>` +
    `<button type="button" class="pp-btn wb-tint-3" data-t="many" aria-pressed="false" title="Taps add bars to the picking">Pick several</button>` +
    `<button type="button" class="pp-btn wb-tint-4" data-t="del">Delete</button>` +
    (foldable ? `<button type="button" class="pp-btn wb-tint-1" data-t="fold" title="Fold the board away">Close</button>` : "") +
    `</div>` +
    `<div class="mbb-board"><svg class="mbb-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>` +
    `<p class="mbb-hint">Double-click a bar or a brace to write on it. Drag a bar to move it, its right edge to stretch it.</p>`;
  const board = el.querySelector(".mbb-board");
  const svg = el.querySelector(".mbb-svg");
  const tools = el.querySelector(".mbb-tools");

  const rows = () => Math.max(3, ...model.bars.map((b) => b.row + 2));

  /* Rows STACK CLOSE: a row only makes room over or under its bar for the
     braces it actually has, so plain bars sit one just under the other, the
     way they are drawn on paper. */
  let tops = [];
  let height = 0;
  function layout() {
    const spots = braceSpots(model);
    tops = [];
    let y = 8;
    for (let r = 0; r < rows(); r++) {
      const room = (at) => {
        const mine = spots.filter((s) => s.row === r && s.at === at);
        return mine.length ? ROOM + LEVEL * Math.max(...mine.map((s) => s.level)) : 0;
      };
      y += room("above");
      tops[r] = y;
      y += BAR + room("below") + GAP;
    }
    height = y + 4;
  }
  const yOf = (row) => (row < tops.length ? tops[row] : tops[tops.length - 1] + (row - tops.length + 1) * (BAR + GAP));
  /** The row whose bar is nearest to a bar top at y — or the next empty one. */
  const rowAt = (y) => {
    let best = 0;
    for (let r = 0; r <= tops.length; r++) if (Math.abs(yOf(r) - y) < Math.abs(yOf(best) - y)) best = r;
    return best;
  };

  /* ── drawing ─────────────────────────────────────────────────────────── */
  function paint() {
    layout();
    const H = height;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    let out = "";
    for (let r = 0; r < rows(); r++) {
      out += `<line x1="0" x2="${W}" y1="${yOf(r) + BAR}" y2="${yOf(r) + BAR}" stroke="${GREY}" stroke-width="0.6" stroke-dasharray="2 6" opacity="0.35"/>`;
    }
    model.bars.forEach((b) => {
      const y = yOf(b.row);
      const on = picked.has(b.id);
      const unit = b.w / b.n;
      out += `<g class="mbb-bar${on ? " is-picked" : ""}" data-id="${b.id}">` +
        `<rect class="mbb-body" x="${b.x}" y="${y}" width="${b.w}" height="${BAR}" fill="${TONES[b.tone % TONES.length]}" stroke="${on ? "#d1495b" : INK}" stroke-width="${on ? 2.4 : 1.2}"/>`;
      for (let i = 1; i < b.n; i++) out += `<line x1="${b.x + i * unit}" x2="${b.x + i * unit}" y1="${y}" y2="${y + BAR}" stroke="${INK}" stroke-width="1"/>`;
      for (let i = 0; i < b.n; i++) {
        const t = b.labels[i];
        if (t) out += `<text x="${b.x + (i + 0.5) * unit}" y="${y + BAR / 2 + 5}" text-anchor="middle" font-size="${unit < 34 ? 11 : 14}" font-weight="700" fill="${INK}" pointer-events="none">${esc(t)}</text>`;
      }
      out += `<rect class="mbb-grip" data-grip="${b.id}" x="${b.x + b.w - 7}" y="${y - 3}" width="14" height="${BAR + 6}" fill="transparent"/>` +
        `<rect x="${b.x + b.w - 2}" y="${y + 7}" width="4" height="${BAR - 14}" rx="2" fill="${INK}" opacity="${on ? 0.7 : 0.25}" pointer-events="none"/>` +
        `</g>`;
    });
    braceSpots(model).forEach((s) => {
      const y = s.at === "above" ? yOf(s.row) - 3 - s.level * 22 : yOf(s.row) + BAR + 3 + s.level * 22;
      const dir = s.at === "above" ? -1 : 1;
      const ty = s.at === "above" ? y - 12 : y + 21;
      const words = s.br.text || "…";
      out += `<g class="mbb-brace" data-brace="${s.br.id}">` +
        `<path d="${curly(s.x0, s.x1, y, dir)}" fill="none" stroke="${GREY}" stroke-width="1.4"/>` +
        `<rect x="${(s.x0 + s.x1) / 2 - 40}" y="${ty - 14}" width="80" height="19" fill="transparent"/>` +
        `<text x="${(s.x0 + s.x1) / 2}" y="${ty}" text-anchor="middle" font-size="13" font-weight="700" fill="${s.br.text ? INK : GREY}">${esc(words)}</text></g>`;
    });
    svg.innerHTML = out;
    tools.querySelector('[data-t="cut"]').setAttribute("aria-pressed", String(cutting));
    tools.querySelector('[data-t="many"]').setAttribute("aria-pressed", String(several));
    board.classList.toggle("is-cutting", cutting);
  }

  /* ── changes, each one Undo step ─────────────────────────────────────── */
  function change(fn) {
    const before = clone(model);
    fn();
    model.braces = model.braces.filter((br) => br.ids.some((id) => model.bars.some((b) => b.id === id)));
    paint();
    if (JSON.stringify(before) !== JSON.stringify(model)) onChange(clone(model), before);
  }

  const pickedBars = () => model.bars.filter((b) => picked.has(b.id));
  const snap = (v) => Math.round(v / SNAP) * SNAP;
  /** An end near another bar's end (or the left edge) catches it. */
  function caught(v, self) {
    let best = v, gap = CATCH;
    [0, ...model.bars.filter((b) => b.id !== self).flatMap((b) => [b.x, b.x + b.w])].forEach((e) => {
      if (Math.abs(e - v) < gap) { gap = Math.abs(e - v); best = e; }
    });
    return gap < CATCH ? best : snap(v);
  }

  /** The point under the pointer, in board units. */
  function at(e) {
    const r = svg.getBoundingClientRect();
    const k = W / r.width;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
  }

  /* ── tools ───────────────────────────────────────────────────────────── */
  el.querySelector(".mbb-open")?.addEventListener("click", () => { el.classList.remove("is-folded"); paint(); });

  tools.addEventListener("click", (e) => {
    const t = e.target.closest("[data-t]")?.dataset.t;
    if (!t) return;
    if (t === "fold") { el.classList.add("is-folded"); return; }
    if (t === "copy") {
      change(() => {
        /* fresh ids after whatever is already there, so Undo can take it off */
        const map = new Map();
        const at = model.bars.length ? Math.max(...model.bars.map((b) => b.row)) + 1 : 0;
        start.bars.forEach((b) => { const id = seq++; map.set(b.id, id); model.bars.push({ ...clone(b), id, row: b.row + at }); });
        start.braces.forEach((br) => model.braces.push({ ...clone(br), id: seq++, ids: br.ids.map((i) => map.get(i)) }));
        picked.clear();
      });
      return;
    }
    if (t === "cut") { cutting = !cutting; paint(); return; }
    if (t === "many") { several = !several; paint(); return; }
    if (t === "new") {
      change(() => {
        const row = model.bars.length ? Math.max(...model.bars.map((b) => b.row)) + 1 : 0;
        const b = { id: seq++, x: 0, row, w: 200, n: 1, tone: model.bars.length % TONES.length, labels: [""] };
        model.bars.push(b);
        picked = new Set([b.id]);
      });
      return;
    }
    const bars = pickedBars();
    if (!bars.length) { flash("Tap a bar first to pick it."); return; }
    if (t === "more" || t === "less") {
      change(() => bars.forEach((b) => {
        b.n = Math.max(1, Math.min(20, b.n + (t === "more" ? 1 : -1)));
        b.labels = Array.from({ length: b.n }, (_, i) => b.labels[i] || "");
      }));
    } else if (t === "tone") {
      change(() => bars.forEach((b) => { b.tone = (b.tone + 1) % TONES.length; }));
    } else if (t === "del") {
      change(() => { model.bars = model.bars.filter((b) => !picked.has(b.id)); picked.clear(); });
    } else if (t === "above" || t === "below") {
      const br = { id: seq++, ids: bars.map((b) => b.id), at: t, text: "" };
      change(() => model.braces.push(br));
      editBrace(br.id);
    }
  });

  let flashing = 0;
  function flash(text) {
    const hint = el.querySelector(".mbb-hint");
    hint.textContent = text;
    hint.classList.add("is-loud");
    clearTimeout(flashing);
    flashing = setTimeout(() => {
      hint.classList.remove("is-loud");
      hint.textContent = "Double-click a bar or a brace to write on it. Drag a bar to move it, its right edge to stretch it.";
    }, 2200);
  }

  /* ── moving, stretching, picking, cutting ────────────────────────────── */
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const grip = e.target.closest("[data-grip]");
    const g = e.target.closest(".mbb-bar");
    if (!g) {
      const braceG = e.target.closest(".mbb-brace");
      if (braceG) { if (twice(`brace${braceG.dataset.brace}`)) editBrace(Number(braceG.dataset.brace)); return; }
      if (!several && !e.shiftKey) { picked.clear(); paint(); }
      return;
    }
    const b = model.bars.find((x) => x.id === Number(g.dataset.id));
    const p = at(e);
    if (cutting && !grip) {
      cutAt(b, p.x);
      return;
    }
    e.preventDefault();
    drag = { b, from: p, x: b.x, row: b.row, top: yOf(b.row), w: b.w, grip: !!grip, before: clone(model), moved: false, add: several || e.shiftKey };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = at(e);
    const dx = p.x - drag.from.x, dy = p.y - drag.from.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const b = drag.b;
    if (drag.grip) {
      b.w = Math.max(20, Math.min(W - b.x, caught(b.x + drag.w + dx, b.id) - b.x));
    } else {
      b.x = Math.max(0, Math.min(W - b.w, caught(drag.x + dx, b.id)));
      /* the right end can catch too, when the left has nothing near it */
      const right = caught(b.x + b.w, b.id);
      if (right !== snap(b.x + b.w) && Math.abs(right - (b.x + b.w)) < CATCH) b.x = Math.max(0, right - b.w);
      b.row = Math.min(rows(), rowAt(drag.top + dy));
    }
    paint();
  });
  const up = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) {
      /* a second tap on the same bar writes on it; a first one picks it */
      if (twice(`bar${d.b.id}`)) { editBar(d.b, d.from.x); return; }
      if (d.add) { if (picked.has(d.b.id)) picked.delete(d.b.id); else picked.add(d.b.id); } else picked = new Set([d.b.id]);
      paint();
      return;
    }
    picked = new Set(d.add ? [...picked, d.b.id] : [d.b.id]);
    paint();
    if (JSON.stringify(d.before) !== JSON.stringify(model)) onChange(clone(model), d.before);
  };
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);

  /** Break a bar in two where it was tapped — on a unit line if it has units. */
  function cutAt(b, x) {
    const unit = b.w / b.n;
    let k, cutX;
    if (b.n > 1) {
      k = Math.round((x - b.x) / unit);
      if (k <= 0 || k >= b.n) { flash("Tap between two units to cut there."); return; }
      cutX = b.x + k * unit;
    } else {
      cutX = snap(x);
      if (cutX - b.x < 10 || b.x + b.w - cutX < 10) { flash("Too near the end to cut."); return; }
    }
    change(() => {
      const right = { id: seq++, x: cutX, row: b.row, w: b.x + b.w - cutX, n: b.n > 1 ? b.n - k : 1, tone: b.tone, labels: b.n > 1 ? b.labels.slice(k) : [""] };
      b.w = cutX - b.x;
      if (b.n > 1) { b.n = k; b.labels = b.labels.slice(0, k); }
      model.bars.push(right);
      picked = new Set([b.id, right.id]);
    });
    cutting = false;
    paint();
  }

  /* ── writing on it ───────────────────────────────────────────────────── */
  function inputAt(x, y, w, value, done) {
    el.querySelector(".mbb-write")?.remove();
    const r = svg.getBoundingClientRect();
    const br = board.getBoundingClientRect();
    const k = r.width / W;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "mbb-write";
    input.value = value;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "write on the bar model");
    const width = Math.max(70, w * k);
    input.style.left = `${r.left - br.left + x * k - width / 2}px`;
    input.style.top = `${r.top - br.top + y * k - 14}px`;
    input.style.width = `${width}px`;
    board.appendChild(input);
    input.focus();
    input.select();
    let over = false;
    const finish = (keep) => {
      if (over) return;
      over = true;
      const v = input.value.trim().slice(0, 24);
      input.remove();
      if (keep) done(v);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  }

  function editBrace(id) {
    const s = braceSpots(model).find((x) => x.br.id === id);
    if (!s) return;
    const y = s.at === "above" ? yOf(s.row) - 3 - s.level * 22 - 16 : yOf(s.row) + BAR + 3 + s.level * 22 + 16;
    inputAt((s.x0 + s.x1) / 2, y, Math.min(160, s.x1 - s.x0), s.br.text, (v) => change(() => {
      const br = model.braces.find((x) => x.id === id);
      if (br) br.text = v;
    }));
  }

  /* A DOUBLE tap is counted here, not left to the browser's dblclick: the
     first tap picks the bar and the board is drawn afresh, and a dblclick
     whose two clicks land on two different elements never fires. Counting
     taps also makes it work with a finger. */
  let lastTap = null;
  function twice(what) {
    const now = Date.now();
    const yes = lastTap && lastTap.what === what && now - lastTap.at < 450;
    lastTap = yes ? null : { what, at: now };
    return yes;
  }

  function editBar(b, x) {
    const unit = b.w / b.n;
    const i = Math.max(0, Math.min(b.n - 1, Math.floor((x - b.x) / unit)));
    inputAt(b.x + (i + 0.5) * unit, yOf(b.row) + BAR / 2, unit, b.labels[i] || "", (v) => change(() => {
      const bar = model.bars.find((x) => x.id === b.id);
      if (bar) bar.labels[i] = v;
    }));
  }

  paint();

  return {
    get: () => clone(model),
    set(m) { model = m ? clone(m) : blank(); picked.clear(); paint(); return clone(model); },
    clear() { model = blank(); picked.clear(); paint(); },
    dispose() {
      el.classList.remove("is-building");
      el.innerHTML = printed;
    },
  };
}
