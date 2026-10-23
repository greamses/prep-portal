/* ═══════════════════════════════════════════════════════════════════════════
   A CARD

   One problem, and the working under it. Every move writes a NEW line rather
   than replacing the one above, so the card grows downward and the whole
   derivation stays on the paper — which is the thing a single-equation stage
   could never show and the reason the canvas was worth building.

   Rows are lined up on their equals signs, the way working is lined up by hand.
   Only the last row is live; the ones above it are what you already did.
   ═══════════════════════════════════════════════════════════════════════════ */

import { UI } from "/utils/components/ui-icons.js";
import { noteFace, noteWriter, newNote, PIN } from "./notes.js";
import { buildRow, paintRow, flipInto } from "./render.js";
import { plain, refFace } from "./layout.js";
import { preservesSolutions } from "./verify.js";
import { isSolved, solvedLetterValue } from "./solve.js";
import { substituteExpr, substituteAll, asNumbers, hasSubstitutions, offerTo, substitute, EQUALS, atomOffers, multiOffers, atomTerm, isEqualsKey } from "./ops.js";
import * as A from "./ast.js";
import * as R from "./rational.js";

const SIZE = 34;
const ROW_GAP = 10;
const PAD = 18;
const NOTE_GAP = 12;   // matches .am-work__why margin-left

/* The six papers of .pp-sticky (components.css), taken in turn so a canvas of
   problems reads as a pad of notes rather than a stack of windows. Tilts are
   fixed rather than random: a tilt that changes every reload makes the canvas
   feel unstable, and past about two degrees the working stops sitting level
   enough to read down. */
/** The moves that are done to both sides, and so are written in the margin. */
const MARGIN = new Set(["across", "divide", "times", "flip"]);

const PAPERS = 6;
const TILTS = [-1.7, 1.2, -0.9, 1.8, -1.4, 0.8];

let seq = 0;

/** A single value as it is written on the card: 5, 1/2, −3. */
const fmt = (v) => R.toText(v).replace(/-/g, "−");

/** A given value as it is written on the card: v = 5, t = 1/2, a = −3. */
const said = (given) =>
  Object.entries(given).map(([k, v]) => `${k} = ${fmt(v)}`);

export function createCard(eq, { x, y, given = null, title = "", find = "", name = "", onPick, onChange, onGesture, onRemove, onEdit, onRename, onGrow, uid = null }) {
  const id = `card${++seq}`;
  const rows = [];        // { row, offset, note, from }
  // The GLYPH that is picked — its atom key (nodeId#slot), so the 3 and the x
  // of 3x, the + between terms and the = are each a thing of their own.
  // Several can be picked at once; the LAST one picked is the one the menu
  // sits beside.
  let picks = [];
  const primary = () => picks[picks.length - 1] || null;
  let undone = [];        // lines stepped back off the bottom, newest last

  const el = document.createElement("div");
  el.className = `am-card pp-sticky--c${seq % PAPERS}`;
  el.dataset.card = id;
  el.style.setProperty("--am-tilt", `${TILTS[seq % TILTS.length]}deg`);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  // The letters this card was handed values for, and the number each stands
  // for. Held as exact rationals; the verifier wants them as plain numbers, and
  // converting once here keeps that conversion out of every move.
  const values = given && Object.keys(given).length ? given : null;
  const pinned = values ? asNumbers(values) : null;

  const grip = document.createElement("div");
  grip.className = "am-card__grip";
  grip.innerHTML = `<span class="am-card__dots" aria-hidden="true"></span>`;

  /* The equation's name — E₁ — which is what is typed to combine it with
     another (E_1 − E_2). Tap it to call it something else. */
  let label = name;
  const tag = document.createElement("button");
  tag.type = "button";
  tag.className = "am-card__label";
  const showTag = () => {
    tag.textContent = refFace(label);
    tag.title = `This equation is ${label} — tap to rename it`;
    tag.setAttribute("aria-label", tag.title);
  };
  showTag();
  tag.addEventListener("pointerdown", (e) => e.stopPropagation());
  tag.addEventListener("click", (e) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.className = "am-card__rename";
    input.value = label;
    input.spellcheck = false;
    input.setAttribute("aria-label", "A name for this equation");
    tag.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (keep) => {
      if (done) return;
      done = true;
      const want = input.value.trim().replace(/\s+/g, "_");
      if (keep && want && want !== label) {
        const answer = onRename?.(want, api);
        if (answer === true) label = want;
      }
      showTag();
      input.replaceWith(tag);
    };
    input.addEventListener("keydown", (k) => {
      if (k.key === "Enter") finish(true);
      if (k.key === "Escape") finish(false);
      k.stopPropagation();
    });
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("pointerdown", (k) => k.stopPropagation());
  });
  grip.appendChild(tag);
  if (title) {
    const name = document.createElement("b");
    name.className = "am-card__name";
    name.textContent = title;
    grip.appendChild(name);
  }

  const tools = document.createElement("div");
  tools.className = "am-card__tools";
  tools.innerHTML = `
    <button type="button" class="am-card__btn" data-act="back" title="Step back" aria-label="Step back" disabled>
      ${UI.undo(15)}
    </button>
    <button type="button" class="am-card__btn" data-act="forward" title="Step forward again" aria-label="Step forward again" disabled>
      ${UI.redo(15)}
    </button>
    <button type="button" class="am-card__btn" data-act="close" title="Take it off the canvas" aria-label="Take it off the canvas">
      ${UI.close(15)}
    </button>`;
  grip.appendChild(tools);

  const sheet = document.createElement("div");
  sheet.className = "am-card__sheet";

  /* The question, written above the working the way it is written above the
     working on paper. It stays there after every number has gone in, because
     what the letters stood for is most of what the answer means. */
  let ask = null;
  if (values) {
    ask = document.createElement("p");
    ask.className = "am-card__given";
    ask.innerHTML = `<span>given</span> ${said(values).join(", ")}${find ? ` &middot; <span>find</span> ${find}` : ""}`;
  }

  const flag = document.createElement("div");
  flag.className = "am-card__done";
  flag.hidden = true;

  el.append(grip, ...(ask ? [ask] : []), sheet, flag);

  /* ── Laying the rows out ─────────────────────────────────────────────────
     Every row is nudged right so all the equals signs sit on one line. */
  function relayout() {
    const gutter = Math.max(...rows.map((r) => r.row.eqX));
    let top = 0;
    for (const entry of rows) {
      entry.offset = { x: gutter - entry.row.eqX, y: top };
      top += entry.row.h + ROW_GAP;
    }
    for (const entry of rows) {
      if (!entry.el) continue;
      entry.el.style.left = `${PAD + entry.offset.x}px`;
      entry.el.style.top = `${PAD + entry.offset.y}px`;
    }

    // The reason sits in a margin to the right of its line, so the paper has to
    // be wide enough to hold it — otherwise it writes itself onto the canvas.
    let width = 0;
    for (const entry of rows) {
      const note = entry.el?.querySelector(".am-work__why");
      const pins = entry.el?.querySelector(".am-pins");
      // The pinned notes sit after the margin note, not on top of it.
      if (pins) pins.style.marginLeft = `${(note ? NOTE_GAP + note.offsetWidth : 0) + NOTE_GAP}px`;
      const margin = (note ? NOTE_GAP + note.offsetWidth : 0) + (pins ? NOTE_GAP + pins.offsetWidth : 0);
      width = Math.max(width, entry.offset.x + entry.row.w + margin);
    }

    sheet.style.width = `${width + PAD * 2}px`;
    sheet.style.height = `${Math.max(0, top - ROW_GAP) + PAD * 2}px`;
  }

  function paint(entry, live) {
    // The card says whether something is picked up, because the equals sign is
    // only a place to put things while something is in hand.
    if (live) el.classList.toggle("has-pick", picks.length > 0);
    const svg = paintRow(entry.row, { live, picked: live ? picks : null });
    const holder = document.createElement("div");
    holder.className = `am-work${live ? " is-live" : ""}`;
    holder.appendChild(svg);
    if (entry.note) {
      const why = document.createElement("i");
      why.className = "am-work__why";
      why.textContent = entry.note;
      holder.appendChild(why);
    }
    holder.appendChild(pinsFor(entry));
    entry.el = holder;
    entry.svg = svg;
    return holder;
  }

  /** The notes stuck on a line, and the pin that sticks another one on. */
  const writer = noteWriter(el);
  const scaleOf = () => el.getBoundingClientRect().width / el.offsetWidth || 1;
  function pinsFor(entry) {
    entry.pins ||= [];
    const box = document.createElement("div");
    box.className = "am-pins";
    for (const n of entry.pins) {
      const face = noteFace(n, {
        scaleOf,
        onSized: relayout,
        onTap: () => write(entry, n, face),
        onDelete: () => {
          writer.drop(n);
          entry.pins = entry.pins.filter((x) => x !== n);
          refreshPins(entry);
        },
      });
      box.appendChild(face);
    }
    const add = document.createElement("button");
    add.type = "button";
    add.className = "am-pin";
    add.title = "Pin a note to this line";
    add.setAttribute("aria-label", "Pin a note to this line");
    add.innerHTML = PIN;
    add.addEventListener("click", (e) => {
      e.stopPropagation();
      const n = newNote(entry.pins.length % 6);
      entry.pins.push(n);
      refreshPins(entry);
      write(entry, n, entry.el?.querySelector(`[data-pin="${n.id}"]`));
    });
    box.appendChild(add);
    return box;
  }

  function refreshPins(entry) {
    if (!entry.el) return;
    const old = entry.el.querySelector(".am-pins");
    if (old) old.replaceWith(pinsFor(entry));
    relayout();
  }

  function write(entry, n, face) {
    writer.write(n, face, (note, { empty }) => {
      // A note left blank is not a note.
      if (empty) entry.pins = entry.pins.filter((x) => x !== note);
      refreshPins(entry);
    });
  }

  /** Redraw only the last row — the only one whose selection can change. */
  function repaintLive() {
    const last = rows[rows.length - 1];
    if (!last || !last.el) return;
    const fresh = paint(last, true);
    sheet.replaceChild(fresh, sheet.lastElementChild);
    relayout();
  }

  function push(nextEq, { from = new Map(), note = "", animate = true } = {}) {
    const prev = rows[rows.length - 1];
    if (prev && prev.el) {
      // The row above stops being live the moment a new one lands under it.
      const stale = paint(prev, false);
      sheet.replaceChild(stale, sheet.lastElementChild);
    }

    // `from` is kept with the row: stepping forward again replays the same
    // travel rather than fading the writing in from nowhere.
    const entry = { row: buildRow(nextEq, SIZE), note, from };
    rows.push(entry);

    const holder = paint(entry, true);
    sheet.appendChild(holder);
    relayout();

    if (animate && prev) {
      flipInto({
        prevRow: prev.row, prevOffset: { x: PAD + prev.offset.x, y: PAD + prev.offset.y },
        newRow: entry.row, newOffset: { x: PAD + entry.offset.x, y: PAD + entry.offset.y },
        newSvg: entry.svg, from,
      });
      holder.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 260, easing: "ease", fill: "backwards" }
      );
    }

    done(nextEq);
    arrows();
    onChange?.(api);
    // The card is longer now: whoever holds it keeps the new line in sight.
    if (animate) onGrow?.(api);
  }

  /* An equation finishes at an answer and an expression finishes when there is
     nothing left to do to it, so the flag says which of the two happened. */
  function done(nextEq) {
    const over = isSolved(nextEq, { given: values });
    flag.hidden = !over;
    if (over) {
      flag.dataset.tag = nextEq.kind === "expr" ? "as tidy as it goes" : "solved";
      flag.textContent = plain(nextEq);
    }
  }

  /** The two arrows only offer what there is: a step to take back, a step to
      put back. A greyed arrow says where you are in the working. */
  function arrows() {
    tools.querySelector("[data-act='back']").disabled = rows.length < 2;
    tools.querySelector("[data-act='forward']").disabled = undone.length === 0;
  }

  function stepBack() {
    if (rows.length < 2) return;
    // Keep the whole row, not just its equation: put back the same reason and
    // the same travel when the forward arrow is pressed.
    undone.push(rows.pop());
    sheet.removeChild(sheet.lastElementChild);
    picks = [];
    const last = rows[rows.length - 1];
    const fresh = paint(last, true);
    sheet.replaceChild(fresh, sheet.lastElementChild);
    relayout();
    done(last.row.eq);
    arrows();
    onPick?.(null, api);
    onChange?.(api);
  }

  function stepForward() {
    const back = undone.pop();
    if (!back) return;
    picks = [];
    push(back.row.eq, { from: back.from, note: back.note });
    onPick?.(null, api);
  }

  /* ── Tapping a glyph ─────────────────────────────────────────────────────
     A tap picks one glyph. Shift-, Ctrl- or ⌘-click — or HOLDING a glyph on
     a touch screen — adds it to what is picked instead, so 3x and 5 can be
     carried over together, or three like terms folded at once. */
  const HOLD_MS = 450;
  let holdTimer = null;
  let heldKey = null;              // a hold already toggled this glyph; eat the click

  function togglePick(key) {
    picks = picks.includes(key) ? picks.filter((k) => k !== key) : [...picks, key];
    repaintLive();
    onPick?.(primary(), api);
  }

  sheet.addEventListener("pointerdown", (e) => {
    const hit = e.target.closest?.(".am-hit");
    if (!hit) return;
    e.stopPropagation();               // a glyph is not a handle for the card
    const key = hit.dataset.key;
    clearTimeout(holdTimer);
    if (e.pointerType !== "mouse") {
      holdTimer = setTimeout(() => { heldKey = key; togglePick(key); navigator.vibrate?.(12); }, HOLD_MS);
    }
  });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) {
    sheet.addEventListener(ev, () => clearTimeout(holdTimer));
  }

  /* Double-click a letter to put a number in it, a number to write it another
     way, the = to write the whole line out yourself. What is typed is checked
     like any other move. */
  /* Told apart here rather than with "dblclick": the first click repaints the
     line, so the browser's own double-click lands on a glyph that has already
     been replaced and never arrives. Same glyph, twice, quickly, is the edit. */
  let lastTap = { key: null, at: 0 };
  const DOUBLE_MS = 380;

  sheet.addEventListener("click", (e) => {
    const hit = e.target.closest?.(".am-hit");
    // Handled here, so the canvas below must not also treat it as a tap on bare
    // paper. It cannot work that out for itself: repainting the row detaches
    // this very target, and by the time the click reaches the canvas its
    // e.target has no ancestors left to recognise.
    if (hit) e.stopPropagation();

    const key = hit?.dataset.key || null;
    if (key && heldKey === key) { heldKey = null; return; }
    heldKey = null;

    const now = performance.now();
    if (key && lastTap.key === key && now - lastTap.at < DOUBLE_MS && onEdit) {
      lastTap = { key: null, at: 0 };
      picks = [];
      repaintLive();
      onPick?.(null, api);
      onEdit(key, api);
      return;
    }
    lastTap = { key, at: now };

    if (key && (e.shiftKey || e.ctrlKey || e.metaKey)) { togglePick(key); return; }

    /* A second tap, somewhere else, is a DESTINATION: put the term(s) the picked
       glyphs belong to there — over the =, or onto a like term. If that reads
       as a move, it is the move; if it does not, the tap simply picks up the
       glyph that was tapped, which is what a tap always does. */
    if (picks.length && key && !picks.includes(key)) {
      const eq = api.equation;
      if (picks.length > 1 && isEqualsKey(key)) {
        const many = multiOffers(eq, picks, { given: values }).find((o) => o.key === "across");
        if (many) { onGesture?.(many, api); return; }
      } else if (picks.length === 1) {
        const from = atomTerm(eq, primary());
        const to = isEqualsKey(key) ? EQUALS : atomTerm(eq, key)?.id;
        if (from && to && to !== from.id) {
          const offer = offerTo(eq, from.id, to);
          if (offer) { onGesture?.(offer, api); return; }
        }
      }
    }

    const was = primary();
    const next = key && !(picks.length === 1 && key === was) ? key : null;
    if (!next && !picks.length && !hit) return;
    picks = next ? [next] : [];
    repaintLive();
    onPick?.(primary(), api);
  });

  tools.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "back") stepBack();
    if (act === "forward") stepForward();
    if (act === "close") { el.remove(); onRemove?.(api); }
  });

  const api = {
    id,
    el,
    grip,
    get equation() { return rows[rows.length - 1].row.eq; },
    get picked() { return primary(); },
    get picks() { return [...picks]; },
    get depth() { return rows.length; },
    get solved() { return isSolved(rows[rows.length - 1].row.eq, { given: values }); },
    get given() { return values; },

    /** Is there still a number waiting to go into this line? */
    get waiting() { return hasSubstitutions(rows[rows.length - 1].row.eq, values); },

    /** x = 5, once this card is finished there — what another card's
        substitution can reach across for. */
    get solvedValue() {
      const sv = solvedLetterValue(rows[rows.length - 1].row.eq, { given: values });
      if (!sv) return null;
      return { ...sv, text: sv.expr ? plain(sv.expr) : fmt(sv.value) };
    },

    /** What to call this card in another card's menu. */
    get title() { return title || plain(rows[0].row.eq); },

    /** Letters in the term the picked glyph belongs to that THIS card was
        never given a value for — candidates for pulling one in from another. */
    get freeLettersInPick() {
      const term = atomTerm(rows[rows.length - 1].row.eq, primary());
      if (!term) return [];
      return A.varsIn(term).filter((n) => !(values && n in values));
    },

    /** Where a glyph sits on screen, so a menu can be put beside it. */
    rectFor(key) {
      const last = rows[rows.length - 1];
      const node = last.svg?.querySelector(`.am-hit[data-key="${key}"]`);
      if (!node) return null;
      /* Centred on the glyph, but below (or above) the WHOLE line: a glyph on
         top of a fraction bar would otherwise have its menu laid over the
         denominator it sits above. */
      const g = node.getBoundingClientRect();
      const line = last.svg.getBoundingClientRect();
      return { left: g.left, width: g.width, right: g.right, top: line.top, bottom: line.bottom, height: line.height };
    },

    /* Every move the picked glyph means — see atomOffers in ops.js. The 3 of
       3x offers ÷3, the + between two like terms offers to fold them, the =
       offers the both-sides moves. Short marks, so a row of them still reads
       faster than doing the algebra. */
    movesForPicked() {
      if (!picks.length) return [];
      return picks.length > 1
        ? multiOffers(this.equation, picks, { given: values })
        : atomOffers(this.equation, picks[0], { given: values });
    },

    /** Make a move. Returns null when it was refused, with the reason. */
    apply(offer) {
      const result = offer.run();
      if (result.error) return { refused: result.error };
      const verdict = preservesSolutions(this.equation, result.eq, { given: pinned, scaledBy: result.scaledBy, upToConstant: result.upToConstant, inverse: result.inverse });
      if (!verdict.ok) return { refused: verdict.why };
      picks = [];
      // A move made here is a new branch of the working: whatever was stepped
      // back off the bottom is not on the way to it any more.
      undone = [];
      // Only the moves that do something to BOTH sides get a margin mark, the
      // way working is annotated by hand: +5, ÷3. A tidying step's mark is the
      // answer it produced, which is already written on the line.
      push(result.eq, { from: result.from, note: MARGIN.has(offer.key) ? offer.mark : "" });
      return { ok: true, note: result.note };
    },

    /** Reach into another card: substitute a value IT solved for, into
        whatever letter in the picked term matches it. This is why `apply`
        will not do: this card was never given that letter, so the verifier
        has to be told about it just for this one check, the same way a
        formula's own given values are. */
    useFromElsewhere(letter, value, expr = null) {
      if (!picks.length) return { refused: "Nothing is picked." };
      if (expr) return this.substituteExpression(letter, expr);
      const extended = { ...(values || {}), [letter]: value };
      const eq = rows[rows.length - 1].row.eq;
      const term = atomTerm(eq, primary());
      if (!term) return { refused: "There is no letter there to put a number into." };
      const result = substitute(eq, term.id, extended);
      if (result.error) return { refused: result.error };
      const verdict = preservesSolutions(eq, result.eq, { given: asNumbers(extended) });
      if (!verdict.ok) return { refused: verdict.why };
      picks = [];
      undone = [];
      push(result.eq, { from: result.from, note: result.note });
      return { ok: true, note: result.note };
    },

    /** y = 2x + 1, from another equation or typed in: every y in the line
        becomes 2x + 1, checked with y worked out from x. */
    substituteExpression(letter, expr) {
      const now = this.equation;
      const result = substituteExpr(now, letter, expr);
      if (result.error) return { refused: result.error };
      const verdict = preservesSolutions(now, result.eq, { given: pinned, defs: result.defs });
      if (!verdict.ok) return { refused: verdict.why };
      picks = [];
      undone = [];
      push(result.eq, { from: result.from, note: "" });
      return { ok: true, note: result.note };
    },

    /** A line that follows from this one (E_1 squared, E_1 − E_2 …): written
        under it. `checked` says whether it says EXACTLY the same; when it only
        follows (squaring can bring in an answer), the margin says so. */
    follow(nextEq, note) {
      if (nextEq.kind !== "eq") return { refused: "that is not an equation" };
      picks = [];
      undone = [];
      push(nextEq, { note });
      return { ok: true };
    },

    get name() { return label; },
    set name(v) { label = v; showTag(); },

    /* ── For a live classroom (live.js) ───────────────────────────────────
       The card as data — every line as the text the parser reads back, its
       margin note and its pinned notes — and the way back from that data. */
    uid: uid || `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    snapshot() {
      return {
        name: label, title, find,
        given: values ? Object.fromEntries(Object.entries(values).map(([k, v]) => [k, R.toText(v)])) : null,
        x: parseFloat(el.style.left) || 0, y: parseFloat(el.style.top) || 0,
        rows: rows.map((r) => ({ eq: plain(r.row.eq), note: r.note || "", pins: (r.pins || []).map((n) => ({ ...n })) })),
      };
    },
    /** Replace the working with these lines (another person's). */
    loadRows(list, parseLine) {
      if (!list?.length) return;
      picks = [];
      undone = [];
      rows.length = 0;
      sheet.textContent = "";
      for (const r of list) {
        push(parseLine(r.eq), { animate: false, note: r.note || "" });
        rows[rows.length - 1].pins = (r.pins || []).map((n) => ({ ...n }));
      }
      for (const entry of rows) refreshPins(entry);
      relayout();
    },
    /** Someone else is working on this card: their name on it, or null. */
    markWorker(names) {
      let tag = el.querySelector(".am-card__worker");
      if (!names) { tag?.remove(); el.classList.remove("is-worked"); return; }
      if (!tag) { tag = document.createElement("span"); tag.className = "am-card__worker"; el.appendChild(tag); }
      tag.textContent = names;
      el.classList.add("is-worked");
    },

    /** A line typed by hand, kept only if it says the same as the last one. */
    rewrite(nextEq) {
      const now = this.equation;
      if (nextEq.kind !== now.kind) return { refused: now.kind === "eq" ? "this card holds an equation, so the line needs its = sign" : "this card holds an expression, so no = sign" };
      const verdict = preservesSolutions(now, nextEq, { given: pinned });
      if (!verdict.ok) return { refused: verdict.why };
      picks = [];
      undone = [];
      push(nextEq, { note: "" });
      return { ok: true, note: `Your own step: ${plain(nextEq)}` };
    },

    /** Double-clicked glyph `key`, typed as `node`: a letter takes a number (a
        substitution), a number is written another way with the same value. */
    editAt(key, node) {
      const now = this.equation;
      const nodeId = key.slice(0, key.indexOf("#"));
      const target = A.findById(now, nodeId);
      if (!target || (target.kind !== "var" && target.kind !== "num")) return { refused: "only a letter or a number can be changed that way" };
      if (target.kind === "var") {
        const v = A.exactValue(node);
        // A letter or an expression goes in too: y = 2x + 1 is a substitution.
        if (!v) return this.substituteExpression(target.name, node);
        const extended = { ...(values || {}), [target.name]: v };
        const result = substituteAll(now, target.name, v);
        if (result.error) return { refused: result.error };
        const verdict = preservesSolutions(now, result.eq, { given: asNumbers(extended) });
        if (!verdict.ok) return { refused: verdict.why };
        picks = [];
        undone = [];
        push(result.eq, { from: result.from, note: "" });
        return { ok: true, note: result.note };
      }
      const next = A.replace(now, nodeId, { ...node, paren: node.kind === "sum" || node.kind === "neg" });
      const verdict = preservesSolutions(now, next, { given: pinned });
      if (!verdict.ok) return { refused: "that is not the same number" };
      picks = [];
      undone = [];
      push(next, { note: "" });
      return { ok: true, note: `${plain(target)} written as ${plain(node)}` };
    },

    clearPick() { if (picks.length) { picks = []; repaintLive(); } },
    stepBack,
    stepForward,
    working: () => rows.map((r) => ({ equation: plain(r.row.eq), note: r.note })),
    remove() { el.remove(); onRemove?.(api); },
  };

  push(eq, { animate: false, note: "" });
  return api;
}
