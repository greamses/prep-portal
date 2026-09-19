/* ============================================================================
   NUMBER MATCH — the page
   ----------------------------------------------------------------------------
   A board of numerals with every note poured over it. Every note says a number some way
   OTHER than its numeral, and the work is putting each note on the numeral it
   means — so a number gathers its whole group: its words, its places, its
   addition, its tally, its blocks.

   Two ways to move a note, because one of them always fails somebody: DRAG it
   with a finger or a mouse, or TAP it and tap a cell. The tap route is also
   the keyboard route — the notes and the cells are real buttons, so Enter does
   what a tap does and the whole activity works without a pointer at all.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
import { FORMS, FORM_IDS } from "./forms.js";
import { RANGES, buildRound, isDone } from "./round.js";

const $ = (sel, root = document) => root.querySelector(sel);

/* Our own marks, drawn here — never an emoji, never a borrowed icon set. */
const ICON = { again: UI.again(), settings: UI.settings(), close: UI.close(), cards: UI.cards() };

/* The thumbtack the dashboard's class calendar pins its notes with — the same
   pin, so a matched note is pinned to its number the way a class is pinned to
   its day. */
const PIN = `<svg class="nm-pin" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">`
  + `<circle cx="12" cy="12" r="7" fill="#e07a5f"/>`
  + `<circle cx="12" cy="12" r="7" fill="none" stroke="#b9543c" stroke-width="1.2"/>`
  + `<circle cx="9.6" cy="9.6" r="2" fill="rgba(255,255,255,.75)"/></svg>`;

const KEEP = "prep-portal:number-match";

const S = {
  rangeId: RANGES[0].id,
  forms: FORM_IDS.slice(),
  seed: 1,
  round: null,
  placed: new Map(),   // card id → the numeral it was put on
  held: null,          // the note picked up by a tap
  slips: 0,
  top: 0,             // the highest note on the heap, so the one touched comes up
};

/* ── remembering how this teacher likes it set ────────────────────────────*/

function remember() {
  try {
    localStorage.setItem(KEEP, JSON.stringify({ rangeId: S.rangeId, forms: S.forms }));
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
  } catch { /* the same */ }
}

/* ── dealing ──────────────────────────────────────────────────────────────*/

function deal() {
  S.seed = (Math.floor(Math.random() * 999983) + 1) >>> 0;
  /* every number on the board gets its note */
  S.round = buildRound({ range: S.rangeId, forms: S.forms, seed: S.seed });
  S.placed = new Map();
  S.held = null;
  S.slips = 0;
  drawBoard();
  pour();
  tally();
  say("");
}

/** How many notes are home, beside the deck. */
function tally() {
  const home = S.placed.size;
  const all = S.round.cards.length;
  $("#nm-count").textContent = `${home} of ${all} home`;
}

function drawBoard() {
  const board = $("#nm-grid");
  board.style.setProperty("--nm-cols", S.round.range.cols);
  /* A number no chosen form can write (7 has no expanded form) gets no note,
     and says so by being quieter — it is not a square left undone. */
  const have = new Set(S.round.cards.map((c) => c.n));
  board.innerHTML = S.round.grid
    .map((n) => `<button type="button" class="nm-cell${have.has(n) ? "" : " nm-cell--none"}" data-n="${n}">`
      + `<b class="nm-cell__n">${n}</b><span class="nm-cell__notes"></span></button>`)
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
 * EVERY note, poured onto the table.
 *
 * The way the map jigsaw pours its states onto the map: all of them at once,
 * scattered and overlapping, lying ON the board rather than in a deck beside
 * it — so the page is all table. A note is picked up, moved anywhere, put
 * down anywhere; it only pins itself into a square when that square is its
 * own number. The heap is seeded by the round, so a note lands in the same
 * place every time the round is drawn.
 */
function pour() {
  const heap = $("#nm-heap");
  const rnd = seeded(S.seed ^ 0x5eed);
  const loose = S.round.cards.filter((c) => !S.placed.has(c.id));
  heap.innerHTML = loose.map(cardHtml).join("");
  S.top = 0;
  const r = heap.getBoundingClientRect();
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  [...heap.querySelectorAll(".nm-card")].forEach((el, i) => {
    /* the centre of each note, spread over the whole table; the edges kept
       clear so a note is never more than half off the paper */
    const x = 7 + rnd() * 86;
    const y = 4 + rnd() * 92;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.zIndex = String(++S.top);
    /* poured: each note falls from the top middle of the table to its place,
       one after another, so you see the heap made */
    if (el.animate && !still) {
      const dx = ((50 - x) / 100) * r.width;
      const dy = ((6 - y) / 100) * r.height;
      el.animate(
        [{ translate: `calc(-50% + ${dx}px) calc(-50% + ${dy}px)`, opacity: 0 }, { translate: "-50% -50%", opacity: 1 }],
        { duration: 520, delay: Math.min(i * 18, 900), easing: "cubic-bezier(.2,.8,.3,1)", fill: "backwards" },
      );
    }
  });
}

/** A small seeded random stream, for the heap only. */
function seeded(n) {
  let a = n >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── putting a note down ──────────────────────────────────────────────────*/

const cellFor = (n) => $(`.nm-cell[data-n="${n}"]`);

const shake = (...els) => els.forEach((el) => {
  if (!el) return;
  el.classList.remove("is-wrong");
  void el.offsetWidth;      // restart the animation
  el.classList.add("is-wrong");
  setTimeout(() => el.classList.remove("is-wrong"), 480);
});

/** Put a note on a number. True when it was that number's note. */
function place(cardId, n) {
  const card = S.round.cards.find((c) => c.id === cardId);
  if (!card || S.placed.has(cardId)) return false;
  const cell = cellFor(n);
  const noteEl = $(`.nm-card[data-card="${cardId}"]`);

  if (card.n !== n) {
    S.slips += 1;
    /* Wrong, and said so on the spot: both the note and the square shake,
       because a child needs to see WHICH pair was refused. */
    shake(cell, noteEl);
    say(`That note is not ${n}. Read it again — what number is it saying?`);
    return false;
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
    noteEl.insertAdjacentHTML("afterbegin", PIN);
    (cell.querySelector(".nm-cell__notes") || cell).appendChild(noteEl);
  }
  cell.classList.add("is-complete");
  cell.setAttribute("aria-label", `${n} — ${card.label}`);
  say("");
  tally();

  if (isDone(S.round, S.placed)) {
    say(S.slips
      ? `All of them home, with ${S.slips} slip${S.slips === 1 ? "" : "s"} on the way.`
      : "All of them home, and not one slip.", true);
  }
  return true;
}

function hold(cardId) {
  S.held = cardId;
  document.querySelectorAll(".nm-heap .nm-card").forEach((el) => {
    el.classList.toggle("is-held", el.dataset.card === cardId);
    if (el.dataset.card === cardId) el.style.zIndex = String(++S.top);
  });
  /* Every cell shows it can take the note, so tapping has somewhere to go. */
  document.querySelectorAll(".nm-cell").forEach((el) => el.classList.toggle("is-armed", !!cardId));
}

function say(words, win = false) {
  const el = $("#nm-say");
  el.textContent = words;
  el.classList.toggle("nm-say--win", !!(words && win));
}

/* ── dragging, on the table ───────────────────────────────────────────────*/

let drag = null;

/**
 * The cell under the finger.
 *
 * The whole STACK at that point is read, not just the topmost thing: other
 * loose notes lie on the table too, and the square is found under all of them.
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

/** Put a note's centre at a point on screen, as a share of the table, kept on the paper. */
function setAt(el, px, py) {
  const r = $("#nm-heap").getBoundingClientRect();
  const x = Math.max(0, Math.min(100, ((px - r.left) / r.width) * 100));
  const y = Math.max(0, Math.min(100, ((py - r.top) / r.height) * 100));
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;
}

function wireTable() {
  const heap = $("#nm-heap");

  heap.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".nm-card");
    if (!el || el.disabled) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    /* where on the note it was taken, so it does not jump to the finger */
    drag = {
      el, id: el.dataset.card, pointer: e.pointerId,
      x0: e.clientX, y0: e.clientY,
      dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2),
      moved: false,
    };
    el.style.zIndex = String(++S.top);
  });

  /* Once a note is in the air the gesture belongs to the whole document: the
     note is transparent to pointers while it is carried (so the square under
     it can be found), and the release lands on whatever is beneath. */
  document.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved) {
      /* A press that has not travelled is still a tap. Six pixels of slack,
         because a finger never lands perfectly still. */
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      drag.el.classList.add("is-dragging");
      document.body.classList.add("nm-dragging");
      hold(null);
    }
    setAt(drag.el, e.clientX - drag.dx, e.clientY - drag.dy);
    overCell(cellAt(e.clientX, e.clientY));
  });

  const drop = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const { el, id, moved } = drag;
    drag = null;
    if (!moved) { hold(S.held === id ? null : id); return; }
    const cell = cellAt(e.clientX, e.clientY);
    overCell(null);
    el.classList.remove("is-dragging");
    document.body.classList.remove("nm-dragging");
    /* Put down where it was let go: on its own square it pins itself in;
       anywhere else it just lies there, like a state dropped off its spot. */
    if (cell) place(id, Number(cell.dataset.n));
  };
  document.addEventListener("pointerup", drop);
  document.addEventListener("pointercancel", drop);

  /* Enter or Space on a note. A keyboard press has no pointer behind it, which
     is exactly what detail 0 means — so this never doubles up with a tap. */
  heap.addEventListener("click", (e) => {
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
      say("Pick a note up off the table first, then tap the number it means.");
      return;
    }
    const id = S.held;
    /* A refused tap keeps the note HELD: the child reaches for the same note
       again, and a second tap should try another number, not pick it up. */
    if (!place(id, Number(cell.dataset.n))) hold(id);
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
  wireTable();
  wireBoard();
  wireSettings();
  $("#nm-again").addEventListener("click", deal);
  deal();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
