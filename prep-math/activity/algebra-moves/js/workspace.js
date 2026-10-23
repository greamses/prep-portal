/* ═══════════════════════════════════════════════════════════════════════════
   ALGEBRA MOVES

   Tap a term and the line writes its next one. Three kinds of thing go on the
   canvas: an equation to solve, an expression to tidy up, and a formula with a
   set of values pinned to it — which is the first two with substitution in
   front of them.

   The student names the move rather than dragging one term onto another. That
   is the design decision the whole thing rests on: naming it removes the
   guesswork about what a drag meant, which is where a drag-driven tool spends
   most of its difficulty and produces most of its wrong answers. It is also
   what an exam asks a student to be able to say.

   Nothing reaches the canvas unchecked. Every move is applied to a copy and run
   past the numeric verifier first — see verify.js — so a rewrite that cannot be
   proved to keep the same solutions is refused out loud instead of drawn.
   ═══════════════════════════════════════════════════════════════════════════ */

import { parse, setRefs } from "./parse.js";
import { valueAt, preservesSolutions } from "./verify.js";
import { copy as copyNode } from "./calculus.js";
import { plain, fontReady } from "./layout.js";
import { createCanvas } from "./canvas.js";
import { createCard } from "./card.js";
import { createMenu } from "./menu.js";
import { createKeypad } from "./keypad.js";
import { createFormulaPicker } from "./formula-picker.js";
import { solve, bestOffers } from "./solve.js";
import { applyToBoth, everyOffer, asNumbers, flattenSums } from "./ops.js";
import { ruleFits } from "./rules.js";
import { noteFace, noteWriter, newNote } from "./notes.js";
import * as A from "./ast.js";
import { shellHTML } from "./shell.js";
import { heroPaint } from "/utils/components/nav-icons.js";

/* Where this workspace is mounted. Its own page hands over the whole frame
   under the nav; the workbooks' sidebar hands over a floating panel. Everything
   below looks things up inside it rather than in the document, so the two can
   stand side by side without either finding the other's buttons. */
let root = document;
let frameEl = null;

const $ = (sel) => root.querySelector(sel);

/* Equations and expressions side by side, because the second kind is the one
   nobody expects to be here. */
const STARTERS = [
  "3x + 5 = 20",
  "2x - 7 = 4x + 1",
  "3(x + 1) = 9",
  "(3x + 5)/4 = 5",
  "3x + 5 - x",
  "2(x + 3) + 4x",
  "-(3 - x)",
  "12y/4 - y",
];

let canvas = null;
let menu = null;
let keypad = null;
let cards = [];
let active = null;

/* ── Saying things ──────────────────────────────────────────────────────── */
let sayTimer = null;
function say(text, tone = "") {
  const el = $("#am-say");
  el.textContent = text || "";
  el.className = `am-say${tone ? ` is-${tone}` : ""}`;
  clearTimeout(sayTimer);
  if (text) sayTimer = setTimeout(() => { el.textContent = ""; el.className = "am-say"; }, 4200);
}

function countUp() {
  $("#am-count").textContent =
    cards.length === 0 ? "nothing on the canvas yet"
    : `${cards.length} ${cards.length === 1 ? "problem" : "problems"}`;
}

/* Letter -> the other card that finished there, x = 5, for "use what you
   solved over there" offers. Never the card doing the asking — and never
   assumed onto it either; this only ever builds a chip to tap, on purpose,
   because two different problems can share a letter name by coincidence. */
function solvedElsewhere(asking) {
  const pool = new Map();
  for (const other of cards) {
    if (other === asking) continue;
    const sv = other.solvedValue;
    if (sv && !pool.has(sv.name)) pool.set(sv.name, { ...sv, card: other });
  }
  return pool;
}

/* ── The menu that follows the picked glyph ─────────────────────────────── */
function openMenuFor(card) {
  const picked = card.picked;
  if (!picked) return menu.close();

  const moves = card.movesForPicked();

  const pool = solvedElsewhere(card);
  const reach = card.freeLettersInPick
    .map((name) => pool.get(name))
    .filter(Boolean)
    .map((hit) => ({
      key: "elsewhere",
      label: `Use ${hit.name} = ${hit.text}, solved on "${hit.card.title}"`,
      hint: "from another card",
      mark: `${hit.name} = ${hit.text}`,
      letter: hit.name,
      value: hit.value,
      expr: hit.expr || null,
    }));

  const offers = [...moves, ...reach];
  if (!offers.length) {
    menu.close();
    // While a formula still has numbers to go into it, nothing else is offered
    // anywhere — so a term with no move is a term with no letter of its own to
    // fill in, and saying it belongs where it is would be the wrong answer.
    if (card.waiting) return say("Put the numbers in first — tap a letter that has been given a value.");
    return say(card.solved ? "That one is finished." : "Nothing to do with that one — try its sign, or the = .");
  }

  menu.open(offers, () => card.rectFor(picked), (offer) => {
    if (offer.needsInput) return offer.op === "eq" ? startOperate(card) : startBothSides(card, offer.op);
    if (offer.cards) return splitInto(card, offer);
    const result = offer.letter ? card.useFromElsewhere(offer.letter, offer.value, offer.expr) : card.apply(offer);
    menu.close();
    if (result.refused) return say(`I will not do that — ${result.refused}.`, "no");
    say(result.note, "ok");
    canvas.revealCard(card.el);
  });
}

/* A ± is two answers written as one, and sin x = ½ is two angles: each goes on
   a card of its own, beside this one, to be worked down separately. */
function splitInto(card, offer) {
  menu.close();
  card.clearPick();
  for (const { eq, title } of offer.cards) addCard(eq, { given: card.given, title });
  say(offer.key === "branches" ? "Two cards, one for each answer — work each one down."
    : offer.cards.length > 1 ? `${offer.label} — one card each.` : `${offer.label} — on a new card.`, "ok");
}

/* The second way to make a move, said once and then never again: the chip is
   the obvious one, and this one has to be mentioned or nobody finds it. */
let hinted = false;
function hintOnce() {
  if (hinted) return;
  hinted = true;
  setTimeout(() => {
    if (!active?.picked) return;
    say("Or tap the = to send it across. Shift-click, or hold, to pick more than one.");
  }, 1400);
}

/* ── Something to both sides ──────────────────────────────────────────────
   The = offers + ▢, − ▢, × ▢ and ÷ ▢. Picking one opens the keypad in
   "both sides" mode: whatever is typed — 5, a, (b/(2a))² — is applied to both
   sides of THIS card when Enter is pressed, through the verifier like every
   other move. Closing the drawer abandons it. */
const BOTH_WORDS = {
  "+": "Add to both sides", "−": "Take away from both sides",
  "×": "Multiply both sides by", "÷": "Divide both sides by",
};
function startBothSides(card, op) {
  menu.close();
  showPane("type");
  openDrawer();
  keypad.setMode({
    label: `${BOTH_WORDS[op]} of ${plain(card.equation)}`,
    accept: (node) => {
      const trial = applyToBoth(card.equation, op, node);
      if (trial.error) return { refused: trial.error };
      const key = op === "+" || op === "−" ? "across" : op === "×" ? "times" : "divide";
      const result = card.apply({ key, mark: trial.mark, label: trial.note, run: () => trial });
      if (result.refused) return result;
      keypad.setMode(null);
      closeDrawer();
      say(result.note, "ok");
      canvas.revealCard(card.el);
      return result;
    },
  });
}

/* ── Double-click to write it yourself ──────────────────────────────────────
   A letter: put a number in it, everywhere it is written. A number: write it
   another way — 9 as 3², 0.5 as 1/2. The =: the whole line, typed as you would
   write it, for the step no single move makes. Each is checked before it lands. */
function startEdit(card, key) {
  menu.close();
  const nodeId = key.slice(0, key.indexOf("#"));
  const slot = key.slice(key.indexOf("#") + 1);
  const node = A.findById(card.equation, nodeId);
  let label, accept, start = "", whole = false;
  if (slot === "eq" || (card.equation.kind === "expr" && !node)) {
    whole = true;
    label = "Write the line your own way — it is kept if it says the same thing";
    start = plain(card.equation);
    accept = (root) => card.rewrite(root);
  } else if (node?.kind === "var") {
    label = `Put a number in for ${node.name}`;
    accept = (n) => card.editAt(key, n);
  } else if (node?.kind === "num") {
    label = `Write ${plain(node)} another way — the same number`;
    start = plain(node);
    accept = (n) => card.editAt(key, n);
  } else {
    return say("Double-click a letter, a number or the = to write it yourself.");
  }
  showPane("type");
  openDrawer();
  keypad.setMode({
    label, whole,
    accept: (what) => {
      const result = accept(what);
      if (result.refused) return result;
      keypad.setMode(null);
      closeDrawer();
      say(result.note, "ok");
      canvas.revealCard(card.el);
      return result;
    },
  });
  if (start) keypad.set(start);
}

/* ── Notes anywhere on the canvas ───────────────────────────────────────────
   The rail's pin: every press sticks a new note in the middle of what is in
   view, ready to write on — as many as are wanted. Drag one anywhere, tap it
   to write, × to take it off; a note left blank is not kept. */
let canvasWriter = null;
const freeNotes = [];
export function pinNote() {
  if (!canvas) return;
  canvasWriter ||= noteWriter(canvas.world);
  const at = canvas.centre();
  const n = newNote(freeNotes.length % 6);
  // Each new one lands a little below and right of the last, not on top of it.
  const step = (freeNotes.length % 6) * 22;
  const holder = document.createElement("div");
  holder.className = "am-free-note";
  holder.style.left = `${at.x - 110 + step}px`;
  holder.style.top = `${at.y - 30 + step}px`;
  const takeOff = () => {
    canvasWriter.drop(n);
    holder.remove();
    freeNotes.splice(freeNotes.indexOf(n), 1);
  };
  // The face is drawn again whenever the writing changes, and each face
  // opens the editor over itself.
  const mount = () => {
    const face = noteFace(n, {
      scaleOf: () => canvas.zoom,
      onTap: () => write(face),
      onDelete: takeOff,
    });
    holder.replaceChildren(face);
    return face;
  };
  const write = (face) => canvasWriter.write(n, face, (note, { empty }) => (empty ? takeOff() : mount()));
  canvas.world.appendChild(holder);
  freeNotes.push(n);
  write(mount());
  say("A note on the canvas — write on it, then drag it wherever it helps.", "ok");
}

/* ── Named equations ────────────────────────────────────────────────────────
   Every card is an equation with a name — E_1, E_2 — and the names are what
   is typed to work on it: E_1 + 3, E_1·2, E_1^2, or E_1 − E_2 to take one
   equation from another. Whatever is typed is done to the LEFT sides and to
   the RIGHT sides alike: f(E_1, E_2) is f(left₁, left₂) = f(right₁, right₂),
   which is true wherever the equations are. */
const nameTaken = (want, but = null) => cards.some((c) => c !== but && c.name === want);
function nextName() {
  for (let k = 1; ; k++) if (!nameTaken(`E_${k}`)) return `E_${k}`;
}
function syncNames() { setRefs(cards.map((c) => c.name)); }

function rename(card, want) {
  if (!/^[A-Za-z][A-Za-z0-9_]*\d$/.test(want) && !/^[A-Za-z]+_\w+$/.test(want)) {
    say("A name needs a number in it, like E_3 or A2 — a lone letter would be read as a letter.", "no");
    return false;
  }
  if (nameTaken(want, card)) { say(`${want} is already the name of another equation.`, "no"); return false; }
  card.name = want;
  syncNames();
  say(`That equation is ${want} now.`, "ok");
  return true;
}

function startOperate(card) {
  menu.close();
  syncNames();
  showPane("type");
  openDrawer();
  keypad.setMode({
    label: `Type what to do to ${card.name}: ${card.name} + 3, ${card.name}^2 — or another equation: ${card.name} − E_2`,
    whole: true,
    // Starting with an operation means "do it to this equation".
    translate: (s) => (/^\s*[-+−×*÷/^]/.test(s) ? `${card.name} ${s}` : s),
    accept: (root, src) => {
      const result = root.kind === "eq" ? card.rewrite(root) : combine(card, root.e, src);
      if (result.refused) return result;
      keypad.setMode(null);
      closeDrawer();
      say(result.note, "ok");
      return result;
    },
  });
  keypad.set(`${card.name} `);
}

/** The equation f(E_1, E_2, …) stands for, built side by side. */
function combine(card, f, src) {
  const used = [];
  A.walk(f, (n) => { if (n.kind === "ref" && !used.includes(n.name)) used.push(n.name); });
  if (!used.length) return { refused: `start with the equation's name — ${card.name}` };
  const from = used.map((nm) => cards.find((c) => c.name === nm));
  if (from.some((c) => !c || c.equation.kind !== "eq")) return { refused: "that names something that is not an equation on the canvas" };
  const side = (s) => {
    const build = (n) => {
      if (n.kind === "ref") return copyNode(cards.find((c) => c.name === n.name).equation[s]);
      const o = { ...n, id: A.freshId() };
      for (const k of ["k", "a", "b", "e", "lo", "hi", "to"]) if (n[k]) o[k] = build(n[k]);
      if (n.kids) o.kids = n.kids.map(build);
      return o;
    };
    return flattenSums(build(f));
  };
  const next = A.eqn(side("l"), side("r"));
  const said = src.trim();

  // A line that says nothing (×0, or E_1 − E_1) is refused.
  const letters = A.varsIn(next);
  let live = 0, zero = 0;
  for (let i = 0; i < 24; i++) {
    const env = Object.fromEntries(letters.map((v, k) => [v, 0.37 + ((i * (3 + 2 * k) + 5 * k) % 13) / 3]));
    const d = valueAt(next.l, env) - valueAt(next.r, env);
    if (!Number.isFinite(d)) continue;
    live++;
    if (Math.abs(d) < 1e-9) zero++;
  }
  if (live < 6) return { refused: "I could not check what that gives" };
  if (zero === live) return { refused: "that leaves 0 = 0, which says nothing" };

  // One equation, worked on: the next line of its own card.
  if (used.length === 1 && from[0] === card) {
    const same = preservesSolutions(card.equation, next, { given: card.given ? asNumbers(card.given) : null }).ok;
    const r = card.follow(next, same ? said : `${said} (may add an answer: check it)`);
    return r.refused ? r : { ok: true, note: same ? `${said}: ${plain(next)}` : `${said}: ${plain(next)} — squaring or multiplying by a letter can bring in an answer that is not one, so check yours in ${card.name}` };
  }
  // Equations combined: a new equation, on a card of its own.
  const given = Object.assign({}, ...from.map((c) => c.given || {}));
  const nm = nextName();
  addCard(next, { given: Object.keys(given).length ? given : null, title: said, name: nm });
  return { ok: true, note: `${said} is ${nm}: ${plain(next)}` };
}

/* ── The rule book ──────────────────────────────────────────────────────────
   Tap a rule and it is looked for among the moves on offer — on the glyphs
   that are picked, or anywhere on the card's last line when nothing is. A rule
   that does not fit there says so; it is never forced. */
function applyRule(rule) {
  const card = active && cards.includes(active) ? active : cards[cards.length - 1];
  if (!card) return say("Put a problem on the canvas first.");
  const picked = card.picks;
  // With nothing picked, the moves the solver would choose come first — take
  // the 5 across, not the 3x.
  const preferred = picked.length ? []
    : A.allTerms(card.equation).flatMap((t) => bestOffers(card.equation, t.id, { given: card.given }));
  const pool = [...preferred, ...everyOffer(card.equation, picked, { given: card.given })];
  for (const o of pool) {
    if (o.needsInput || !rule.keys.includes(o.key)) continue;
    if (o.cards) {
      if (!ruleFits(rule, o, null)) continue;
      splitInto(card, o);
      return;
    }
    const res = o.run();
    if (!res || res.error || !ruleFits(rule, o, res)) continue;
    const result = card.apply({ ...o, run: () => res });
    if (result.refused) continue;
    say(result.note, "ok");
    canvas.revealCard(card.el);
    return;
  }
  say(picked.length
    ? `“${rule.name}” does not fit what is picked.`
    : `“${rule.name}” does not fit anywhere on that line.`, "no");
}

/** The formula book, built into `host` — the rail's panel on this page. */
export function mountFormulaBook(host) {
  return createFormulaPicker(host, {
    onSubmit: ({ eq, given, find, title }) => {
      addCard(eq, { given, find, title });
      say(`${title} is on the canvas — tap a letter to put its number in.`, "ok");
    },
    onRule: applyRule,
  });
}

/* ── Putting a problem on the paper ─────────────────────────────────────── */
function addCard(eq, { given = null, title = "", find = "", name = "" } = {}) {
  const spot = canvas.freeSpot(cards.map((c) => ({
    x: parseFloat(c.el.style.left), y: parseFloat(c.el.style.top),
    // offsetWidth/Height are the card's own pixels, untouched by the canvas
    // zoom — the same space its left/top are written in.
    w: c.el.offsetWidth, h: c.el.offsetHeight,
  })));

  const card = createCard(eq, {
    x: spot.x, y: spot.y, given, title, find, name: name || nextName(),
    onPick: (picked, self) => {
      // Only one card can hold the menu at a time.
      for (const other of cards) if (other !== self) other.clearPick();
      active = self;
      // Cards grow downward as the working piles up, so one will eventually
      // reach under its neighbour. Touching a card brings it to the top of the
      // pile, which is what stops that mattering.
      if (picked) canvas.raise(self.el);
      if (picked) { openMenuFor(self); hintOnce(); } else menu.close();
    },
    onChange: (self) => { if (self.picked) openMenuFor(self); else menu.close(); },
    onEdit: (key, self) => startEdit(self, key),
    onRename: (want, self) => rename(self, want),
    // Lines pile up under the one being worked: follow them down.
    onGrow: (self) => requestAnimationFrame(() => { canvas.revealCard(self.el); menu.reposition(); }),
    onGesture: (offer, self) => {
      if (offer.cards) return splitInto(self, offer);
      if (offer.needsInput) return offer.op === "eq" ? startOperate(self) : startBothSides(self, offer.op);
      const result = self.apply(offer);
      menu.close();
      if (result.refused) return say(`I will not do that — ${result.refused}.`, "no");
      say(result.note, "ok");
      canvas.revealCard(self.el);
    },
    onRemove: (self) => {
      cards = cards.filter((c) => c !== self);
      if (active === self) { active = null; menu.close(); }
      countUp();
      syncNames();
    },
  });

  cards.push(card);
  syncNames();
  canvas.add(card.el);
  countUp();
  canvas.revealCard(card.el);
  return card;
}

/* ── Mounting ─────────────────────────────────────────────────────────────── */
/**
 * Build the workspace into `frame` and wire it up.
 *
 * The frame is filled from the one shell template unless it is already built,
 * so a page may lay the markup out itself and still get the same wiring.
 */
export async function mountAlgebraMoves(frame, { drawer = true } = {}) {
  root = frame;
  frameEl = frame;
  if (!frame.querySelector(".am-canvas")) frame.innerHTML = shellHTML();

  const paint = $(".am-paint");
  if (paint) paint.innerHTML = heroPaint();

  // Every width in the layout comes from measuring this font. Measure before it
  // has loaded and the whole equation is set to the fallback's metrics.
  await fontReady();

  canvas = createCanvas($("#am-canvas"));
  menu = createMenu(frame);
  canvas.onMove(() => menu.reposition());

  keypad = createKeypad($("#am-keypad"), {
    onSubmit: (eq, src, given, find) => {
      addCard(eq, { given, find });
      say(
        given
          ? `${plain(eq)} is on the canvas — tap a letter to put its number in.`
          : `${plain(eq)} is on the canvas.`,
        "ok"
      );
      closeDrawer();
    },
  });

  // Inside a workbook there is no page rail to hang the book on, so the
  // canvas's own rail carries a key for it.
  if (!drawer) {
    const pinKey = $("#am-pinkey");
    pinKey.hidden = false;
    pinKey.addEventListener("click", () => pinNote());
    const key = $("#am-book");
    key.hidden = false;
    key.addEventListener("click", async () => {
      const { openPanel, needCss } = await import("/utils/components/workbook/panels.js");
      needCss("/utils/components/workbook.css");
      const panel = openPanel({ title: "Formula book", size: { w: 460, h: 560 } });
      mountFormulaBook(panel.body);
    });
  }

  wireTabs();

  const chips = $("#am-starters");
  STARTERS.forEach((src, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `pp-sticky pp-note-btn am-starter pp-sticky--c${i % 6}`;
    chip.textContent = src;
    chip.addEventListener("click", () => keypad.set(src));
    chips.appendChild(chip);
  });

  // Tapping bare paper puts the menu away.
  $("#am-canvas").addEventListener("click", (e) => {
    if (e.target.closest(".am-card")) return;
    for (const c of cards) c.clearPick();
    menu.close();
  });

  $("#am-add").addEventListener("click", () => openDrawer());
  $("#am-drawer-close").addEventListener("click", () => closeDrawer());
  $("#am-zoom-in").addEventListener("click", () => canvas.zoomBy(1.25));
  $("#am-zoom-out").addEventListener("click", () => canvas.zoomBy(0.8));
  $("#am-zoom-reset").addEventListener("click", () => canvas.reset());
  wireFullScreen();

  $("#am-work").addEventListener("click", () => {
    if (!active) return say("Tap a problem first.");
    const worked = solve(active.equation, { given: active.given });
    if (!worked.solved) return say(worked.stuck || "I could not finish that one.", "no");
    const left = worked.steps.length - 1;
    if (left === 0) return say("That one is already finished.", "ok");
    const end = worked.steps[worked.steps.length - 1].equation;
    say(`${left} more ${left === 1 ? "step" : "steps"} to ${end}.`, "ok");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { menu.close(); closeDrawer(); }
  });

  // One of each kind, so the canvas says on sight that both are welcome here.
  for (const src of ["3x + 5 = 20", "3x + 5 - x"]) addCard(parse(src));
  canvas.reset();
  countUp();
  /* On its own page the keypad is the first thing to do, so it opens with the
     page. In a panel the canvas is small and the drawer would fill it, so it
     waits to be asked for. */
  if (drawer) openDrawer();

  /* On its own page, this wants to fill the screen without being asked — but
     the Fullscreen API needs a user gesture almost everywhere, and loading a
     page is not one. Trying here catches the browsers that allow it anyway;
     the one-off listener catches everyone else on the very first tap, which
     IS the gesture the API was waiting for. Never fires twice, and never
     fires at all in the workbook sidebar's panel, which is not meant to take
     over the window. */
  if (drawer) {
    const tryFullscreen = () => {
      if (fullNow()) return;
      (frameEl.requestFullscreen?.() ?? frameEl.webkitRequestFullscreen?.())?.catch?.(() => {});
    };
    tryFullscreen();
    document.addEventListener("pointerdown", tryFullscreen, { once: true, capture: true });
  }
}

/* ── The two ways in ──────────────────────────────────────────────
   Type your own, or take a formula off the shelf. The panes are hidden rather
   than unbuilt, so the keypad keeps its caret and the formula form keeps what
   was typed into it while you look at the other one. */
let showPane = () => {};
function wireTabs() {
  const tabs = [...root.querySelectorAll(".am-tab")];
  const show = (which) => {
    for (const tab of tabs) {
      const on = tab.dataset.pane === which;
      tab.classList.toggle("is-on", on);
      tab.setAttribute("aria-selected", String(on));
      $(`#am-pane-${tab.dataset.pane}`).hidden = !on;
    }
    if (which === "type") keypad?.focus();
  };
  for (const tab of tabs) tab.addEventListener("click", () => show(tab.dataset.pane));
  showPane = show;
}

/* ── Filling the screen ─────────────────────────────────────────────────────
   The FRAME goes fullscreen, not the document: the rail, the drawer and the
   menu of moves are all inside it, so they come along and keep working. The nav
   does not, which is the point — an endless sheet wants the whole window. */
const EXPAND = '<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/>';
const SHRINK = '<path d="M9 4v4a1 1 0 0 1-1 1H4M15 4v4a1 1 0 0 0 1 1h4M9 20v-4a1 1 0 0 0-1-1H4M15 20v-4a1 1 0 0 1 1-1h4"/>';

const fullNow = () => document.fullscreenElement || document.webkitFullscreenElement;

function wireFullScreen() {
  const btn = $("#am-full");
  const frame = frameEl;
  if (!btn || !frame) return;

  // Nothing here can promise fullscreen: an iframe without `allowfullscreen`,
  // and iPhone Safari, both refuse it outright. Take the button away rather
  // than leave one that does nothing when pressed.
  if (!(frame.requestFullscreen || frame.webkitRequestFullscreen)) { btn.hidden = true; return; }

  btn.addEventListener("click", async () => {
    try {
      if (fullNow()) await (document.exitFullscreen?.() ?? document.webkitExitFullscreen?.());
      else await (frame.requestFullscreen?.() ?? frame.webkitRequestFullscreen?.());
    } catch {
      say("This browser will not let the page fill the screen.", "no");
    }
  });

  const sync = () => {
    const on = !!fullNow();
    btn.querySelector("svg").innerHTML = on ? SHRINK : EXPAND;
    btn.title = on ? "Back to the page" : "Fill the screen";
    btn.setAttribute("aria-label", btn.title);
    btn.setAttribute("aria-pressed", String(on));
    // Every position on the canvas is measured off the frame, and the frame
    // just changed size under everything. The menu FOLLOWS rather than closing:
    // the first tap on the page is also what fills the screen, and closing here
    // threw away the very menu that tap had just opened.
    canvas.reset();
    // Re-centring goes back to the origin, which can leave the card being
    // worked on off the edge — bring it back before the menu follows it.
    if (active) canvas.revealCard(active.el);
    menu.reposition();
    requestAnimationFrame(() => menu.reposition());
  };
  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("webkitfullscreenchange", sync);
}

/* ── The keypad drawer ──────────────────────────────────────────────────────
   A shut drawer is slid off the bottom of the frame rather than removed, so it
   can come back with an animation — which leaves the keys and the line still in
   the tab order, and tabbing lands you in a keypad nobody can see. `inert` takes
   the whole thing out of reach without touching the transform. */
function openDrawer() {
  const drawer = $("#am-drawer");
  drawer.classList.add("is-open");
  drawer.inert = false;
  $("#am-add").setAttribute("aria-expanded", "true");
  if (!$("#am-pane-type").hidden) keypad?.focus();
}
function closeDrawer() {
  // Walking away from a "both sides" keypad abandons it.
  if (keypad?.mode) keypad.setMode(null);
  const drawer = $("#am-drawer");
  drawer.classList.remove("is-open");
  drawer.inert = true;
  $("#am-add").setAttribute("aria-expanded", "false");
}
