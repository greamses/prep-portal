/* ============================================================================
   NUMBER MATCH — the page
   ----------------------------------------------------------------------------
   A board of numerals and a deck of notes. Every note says a number some way
   OTHER than its numeral, and the work is putting each note on the numeral it
   means — so a number gathers its whole group: its words, its places, its
   addition, its tally, its blocks.

   Two ways to move a note, because one of them always fails somebody: DRAG it
   with a finger or a mouse, or TAP it and tap a cell. The tap route is also
   the keyboard route — the notes and the cells are real buttons, so Enter does
   what a tap does and the whole activity works without a pointer at all.
   ========================================================================== */

import { FORMS, FORM_IDS } from "./forms.js";
import { RANGES, buildRound, isDone } from "./round.js";

const $ = (sel, root = document) => root.querySelector(sel);

/* Our own marks, drawn here — never an emoji, never a borrowed icon set. */
const ICON = {
  again: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.4"/><path d="M19.8 3.6v4.4h-4.4"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" '
    + 'stroke-linecap="round" aria-hidden="true">'
    + '<path d="M4 7h8M16.5 7H20M4 17h3.5M12 17h8M14 4.6v4.8M9.5 14.6v4.8"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
    + 'stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
    + 'stroke-linejoin="round" aria-hidden="true">'
    + '<rect x="3" y="6" width="11" height="14" rx="1.6"/><path d="M8 6V4.6a1.6 1.6 0 0 1 1.9-1.57l9 1.6A1.6 1.6 0 0 1 20.2 6.4l-2 11.3"/></svg>',
};

const KEEP = "prep-portal:number-match";

const S = {
  rangeId: RANGES[0].id,
  forms: FORM_IDS.slice(),
  count: 4,
  seed: 1,
  round: null,
  placed: new Map(),   // card id → the numeral it was put on
  held: null,          // the note picked up by a tap
  slips: 0,
};

/* ── remembering how this teacher likes it set ────────────────────────────*/

function remember() {
  try {
    localStorage.setItem(KEEP, JSON.stringify({ rangeId: S.rangeId, forms: S.forms, count: S.count }));
  } catch { /* a browser that refuses storage still plays perfectly */ }
}

function recall() {
  try {
    const was = JSON.parse(localStorage.getItem(KEEP) || "null");
    if (!was) return;
    if (RANGES.some((r) => r.id === was.rangeId)) S.rangeId = was.rangeId;
    if (Array.isArray(was.forms)) {
      const kept = FORM_IDS.filter((id) => was.forms.includes(id));
      /* Two forms is the floor: with one there is nothing to group. */
      if (kept.length >= 2) S.forms = kept;
    }
    if ([3, 4, 5, 6].includes(was.count)) S.count = was.count;
  } catch { /* the same */ }
}

/* ── dealing ──────────────────────────────────────────────────────────────*/

function deal() {
  S.seed = (Math.floor(Math.random() * 999983) + 1) >>> 0;
  S.round = buildRound({ range: S.rangeId, forms: S.forms, count: S.count, seed: S.seed });
  S.placed = new Map();
  S.held = null;
  S.slips = 0;
  drawBoard();
  drawDeck();
  say("");
}

function drawBoard() {
  const board = $("#nm-grid");
  board.style.setProperty("--nm-cols", S.round.range.cols);
  board.innerHTML = S.round.grid
    .map((n) => `<button type="button" class="nm-cell" data-n="${n}">`
      + `<b class="nm-cell__n">${n}</b></button>`)
    .join("");
}

/** A note's colour is its FORM's colour, so the words are always one paper. */
const toneOf = (formId) => `pp-sticky--c${FORM_IDS.indexOf(formId) % 6}`;

/* A tilt that is this note's own, and the same every time it is drawn. */
function tiltOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 9) / 2 - 2;   // −2° … +2°
}

function cardHtml(card) {
  const face = card.kind === "art"
    ? `<span class="nm-card__art">${card.html}</span>`
    : `<span class="nm-card__text">${card.text}</span>`;
  /* The name read out is the FORM, never the value — see forms.js. */
  return `<button type="button" class="nm-card pp-sticky ${toneOf(card.form)}"`
    + ` data-card="${card.id}" style="--pp-note-tilt:${tiltOf(card.id)}deg"`
    + ` aria-label="${card.label} — ${card.kind === "art" ? card.text : card.text}">`
    + `${face}<em class="nm-card__tag">${card.label}</em></button>`;
}

/**
 * ONE note at a time.
 *
 * A wall of notes is a sorting job before it is a number job — the eye picks
 * the easy ones off and the hard ones are left in a heap. One note, one
 * decision: what does THIS say, and where does it go.
 */
function drawDeck() {
  const next = S.round.cards.find((c) => !S.placed.has(c.id));
  $("#nm-deck").innerHTML = next ? cardHtml(next) : "";
}

/* ── putting a note down ──────────────────────────────────────────────────*/

const cellFor = (n) => $(`.nm-cell[data-n="${n}"]`);

function place(cardId, n) {
  const card = S.round.cards.find((c) => c.id === cardId);
  if (!card || S.placed.has(cardId)) return;
  const cell = cellFor(n);
  const noteEl = $(`.nm-card[data-card="${cardId}"]`);

  if (card.n !== n) {
    S.slips += 1;
    /* Wrong, and said so on the spot: the note stays in the deck and both it
       and the cell shake, because a child needs to see WHICH pair was refused. */
    [cell, noteEl].forEach((el) => {
      if (!el) return;
      el.classList.remove("is-wrong");
      void el.offsetWidth;      // restart the animation
      el.classList.add("is-wrong");
      setTimeout(() => el.classList.remove("is-wrong"), 480);
    });
    /* The note stays HELD after a refusal. A child who guesses wrong reaches
       for the same note again, and if the refusal had quietly put it down that
       second tap would pick it up again rather than trying another number —
       two taps to get back to where they already were. */
    hold(cardId);
    say(`That note is not ${n}. Read it again — what number is it saying?`);
    return;
  }

  S.placed.set(cardId, n);
  hold(null);

  /* The note is STUCK ON the number, not swapped for a dot. What was matched
     stays there to be read: the square ends up saying the same thing twice,
     once in figures and once the other way, which is the whole point. */
  if (noteEl) {
    noteEl.classList.remove("is-dragging", "is-held");
    noteEl.removeAttribute("style");
    noteEl.style.setProperty("--pp-note-tilt", `${tiltOf(card.id)}deg`);
    noteEl.classList.add("is-stuck");
    noteEl.disabled = true;
    cell.appendChild(noteEl);
  }
  cell.classList.add("is-complete");
  cell.setAttribute("aria-label", `${n} — ${card.label}`);
  say("");
  drawDeck();

  if (isDone(S.round, S.placed)) {
    say(S.slips
      ? `All of them home, with ${S.slips} slip${S.slips === 1 ? "" : "s"} on the way.`
      : "All of them home, and not one slip.", true);
  }
}

function hold(cardId) {
  S.held = cardId;
  document.querySelectorAll(".nm-card").forEach((el) => {
    el.classList.toggle("is-held", el.dataset.card === cardId);
  });
  /* Every cell shows it can take the note, so tapping has somewhere to go. */
  document.querySelectorAll(".nm-cell").forEach((el) => el.classList.toggle("is-armed", !!cardId));
}

function say(words, win = false) {
  const el = $("#nm-say");
  el.textContent = words;
  el.classList.toggle("nm-say--win", !!(words && win));
}

/* ── dragging ─────────────────────────────────────────────────────────────*/

let drag = null;

/**
 * The cell under the finger.
 *
 * The whole STACK at that point is read, not just the topmost thing. A pointer
 * that has been captured goes on being delivered to the note it captured
 * whatever `pointer-events` says, so the note being carried may well be the
 * top of the stack — looking only at the top would find the note and never the
 * cell underneath it.
 */
function cellAt(x, y) {
  const stack = document.elementsFromPoint
    ? document.elementsFromPoint(x, y)
    : [document.elementFromPoint(x, y)];
  for (const el of stack) {
    const cell = el && el.closest ? el.closest(".nm-cell") : null;
    if (cell) return cell;
  }
  return null;
}

function overCell(cell) {
  document.querySelectorAll(".nm-cell.is-over").forEach((el) => {
    if (el !== cell) el.classList.remove("is-over");
  });
  if (cell) cell.classList.add("is-over");
}

function wireDeck() {
  const deck = $("#nm-deck");

  deck.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".nm-card");
    if (!el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    /* No pointer capture: the note is given `pointer-events: none` the moment
       it is lifted, so that the board can be hit-tested through it, and a
       capture on an element that cannot be hit is not a thing to rely on. The
       rest of the gesture is listened for on the document instead. */
    drag = {
      el, id: el.dataset.card, pointer: e.pointerId,
      x0: e.clientX, y0: e.clientY,
      dx: e.clientX - r.left, dy: e.clientY - r.top,
      w: r.width, h: r.height, moved: false,
    };
  });

  /* Once a note is in the air the gesture belongs to the whole document, not
     to the deck it came from. Listening on the deck means the release has to
     find its way back there to be heard — and it does not: the note under the
     finger is transparent to pointers by then, so the thing actually under it
     is a CELL, which is in the board and never bubbles to the deck at all. */
  document.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved) {
      /* A press that has not travelled is still a tap. Six pixels of slack,
         because a finger never lands perfectly still. */
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      /* The note is about to leave the deck's flow to follow the finger, and
         the deck would close the hole behind it — a shorter deck, a shorter
         page, and the browser re-anchoring the scroll to compensate. The board
         then slides under the finger and the note lands on the wrong number.
         So the note leaves a gap exactly its own size and nothing reflows. */
      const gap = document.createElement("span");
      gap.className = "nm-gap";
      gap.style.width = `${drag.w}px`;
      gap.style.height = `${drag.h}px`;
      drag.el.after(gap);
      drag.gap = gap;

      drag.el.style.width = `${drag.w}px`;
      drag.el.style.height = `${drag.h}px`;
      drag.el.classList.add("is-dragging");
      document.body.classList.add("nm-dragging");
      hold(null);
    }
    drag.el.style.left = `${e.clientX - drag.dx}px`;
    drag.el.style.top = `${e.clientY - drag.dy}px`;
    overCell(cellAt(e.clientX, e.clientY));
  });

  const drop = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const { el, id, moved, gap } = drag;
    drag = null;
    if (gap) gap.remove();
    if (!moved) { hold(S.held === id ? null : id); return; }

    const cell = cellAt(e.clientX, e.clientY);
    overCell(null);
    el.classList.remove("is-dragging");
    document.body.classList.remove("nm-dragging");
    el.style.cssText = el.style.cssText.replace(/(left|top|width|height):[^;]*;?/g, "");
    if (cell) place(id, Number(cell.dataset.n));
  };
  document.addEventListener("pointerup", drop);
  document.addEventListener("pointercancel", drop);

  /* Enter or Space on a note. A keyboard press has no pointer behind it, which
     is exactly what detail 0 means — so this never doubles up with a tap. */
  deck.addEventListener("click", (e) => {
    const el = e.target.closest(".nm-card");
    if (!el || e.detail !== 0) return;
    hold(S.held === el.dataset.card ? null : el.dataset.card);
  });
}

function wireBoard() {
  $("#nm-grid").addEventListener("click", (e) => {
    const cell = e.target.closest(".nm-cell");
    if (!cell) return;
    if (!S.held) {
      say("Pick a note first, then tap the number it means.");
      return;
    }
    place(S.held, Number(cell.dataset.n));
  });
}

/* ── settings ─────────────────────────────────────────────────────────────*/

const optHtml = (kind, val, label, on, hint = "") =>
  `<button type="button" class="pp-sticky pp-note-btn nm-opt${on ? " is-on" : ""}"`
  + ` data-opt="${kind}" data-val="${val}" aria-pressed="${on}">`
  + `<span>${label}</span>${hint ? `<em>${hint}</em>` : ""}</button>`;

function drawSettings() {
  $("#nm-ranges").innerHTML = RANGES
    .map((r) => optHtml("range", r.id, r.label, S.rangeId === r.id)).join("");
  $("#nm-forms").innerHTML = FORMS
    .map((f) => optHtml("form", f.id, f.label, S.forms.includes(f.id), f.hint)).join("");
  $("#nm-counts").innerHTML = [3, 4, 5, 6]
    .map((c) => optHtml("count", c, `${c} numbers`, S.count === c)).join("");
}

function wireSettings() {
  const modal = $("#nm-settings");
  const open = () => { drawSettings(); modal.hidden = false; $(".nm-modal__close", modal).focus(); };
  const shut = () => { modal.hidden = true; $("#nm-open-settings").focus(); };

  $("#nm-open-settings").addEventListener("click", open);
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) shut(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) shut(); });

  modal.addEventListener("click", (e) => {
    const btn = e.target.closest(".nm-opt");
    if (!btn) return;
    const { opt, val } = btn.dataset;

    if (opt === "range") S.rangeId = val;
    if (opt === "count") S.count = Number(val);
    if (opt === "form") {
      const on = S.forms.includes(val);
      /* Never below two: one form deals one note per number, and a lone note
         is not a group to gather. */
      if (on && S.forms.length <= 2) {
        say("Keep at least two ways of writing a number — one on its own is nothing to match.");
        return;
      }
      S.forms = on ? S.forms.filter((f) => f !== val) : FORM_IDS.filter((f) => f === val || S.forms.includes(f));
    }
    remember();
    drawSettings();
    deal();
  });
}

/* ── go ───────────────────────────────────────────────────────────────────*/

function start() {
  $("#nm-again").innerHTML = `${ICON.again}<span>New round</span>`;
  $("#nm-open-settings").innerHTML = `${ICON.settings}<span>Settings</span>`;
  $(".nm-modal__close").innerHTML = ICON.close;
  $("#nm-eyebrow-icon").innerHTML = ICON.cards;

  recall();
  wireDeck();
  wireBoard();
  wireSettings();
  $("#nm-again").addEventListener("click", deal);
  deal();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
