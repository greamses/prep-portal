/* ═══════════════════════════════════════════════════════════════════════════
   ALGEBRA MOVES — spike

   Tap a term, pick a named move, watch the equation rearrange itself.

   The student names the move rather than dragging one term onto another. That
   is the whole design decision this spike exists to try: naming the move
   removes the guesswork about what a drag meant, which is where a drag-driven
   tool spends most of its difficulty and produces most of its wrong answers.
   It also happens to be what an exam wants a student to be able to say.

   Nothing reaches the screen unchecked. Every move is applied to a copy, run
   past the numeric verifier, and only then shown — a rewrite that cannot be
   proved to keep the same solutions is refused out loud.
   ═══════════════════════════════════════════════════════════════════════════ */

import { parse } from "./parse.js";
import { plain, fontReady } from "./layout.js";
import { offers } from "./ops.js";
import { preservesSolutions } from "./verify.js";
import { createStage } from "./render.js";
import { heroPaint } from "/utils/components/nav-icons.js";

const $ = (sel) => document.querySelector(sel);

const STARTERS = [
  "3x + 5 = 20",
  "2x - 7 = 4x + 1",
  "5 - x = 2",
  "2 + 3x + 1 = 7",
  "x/4 = 3",
  "-4x = 12",
];

let eq = null;
let past = [];      // [{ eq, note }] — every line of the working so far
let stage = null;

/* ── The working ────────────────────────────────────────────────────────── */

function renderSteps() {
  const list = $("#am-steps");
  list.textContent = "";
  past.forEach((step, i) => {
    const row = document.createElement("li");
    row.className = "am-step";
    const line = document.createElement("b");
    line.textContent = plain(step.eq);
    const why = document.createElement("span");
    why.textContent = step.note || (i === 0 ? "where we started" : "");
    row.append(line, why);
    list.appendChild(row);
  });
  list.scrollTop = list.scrollHeight;
  $("#am-undo").disabled = past.length < 2;
}

function say(text, tone = "") {
  const el = $("#am-say");
  el.textContent = text || "";
  el.className = `am-say ${tone}`;
}

/* ── The menu of moves ──────────────────────────────────────────────────── */

function renderOffers(id) {
  const box = $("#am-offers");
  box.textContent = "";

  if (!id) {
    box.innerHTML = `<span class="am-prompt">Tap a term to see what you can do with it.</span>`;
    return;
  }

  const list = offers(eq, id);
  if (!list.length) {
    box.innerHTML = `<span class="am-prompt">Nothing to do with that one.</span>`;
    return;
  }

  for (const offer of list) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pp-pill am-move";
    btn.innerHTML = `<em>${offer.label}</em><i>${offer.hint}</i>`;
    btn.addEventListener("click", () => apply(offer));
    box.appendChild(btn);
  }
}

/* ── Making a move ──────────────────────────────────────────────────────── */

function apply(offer) {
  const result = offer.run();

  if (result.error) {
    say(result.error, "is-no");
    return;
  }

  // The gate. A move is not shown until the numbers agree that it is the same
  // equation — see verify.js for why this is cheap and why it is not optional.
  const check = preservesSolutions(eq, result.eq);
  if (!check.ok) {
    say(`I will not do that — ${check.why}.`, "is-no");
    return;
  }

  eq = result.eq;
  past.push({ eq, note: result.note });
  stage.clearPick();
  stage.show(eq, { from: result.from });
  renderOffers(null);
  renderSteps();
  say(result.note, "is-ok");
}

function undo() {
  if (past.length < 2) return;
  past.pop();
  eq = past[past.length - 1].eq;
  stage.clearPick();
  stage.show(eq, { from: new Map() });
  renderOffers(null);
  renderSteps();
  say("Stepped back.");
}

/* ── Starting over ──────────────────────────────────────────────────────── */

function start(src) {
  let next;
  try {
    next = parse(src);
  } catch (err) {
    say(err.message, "is-no");
    return false;
  }
  eq = next;
  past = [{ eq, note: "" }];
  stage.forget();
  stage.show(eq, { animate: false });
  renderOffers(null);
  renderSteps();
  say("");
  $("#am-input").value = src;
  return true;
}

/* ── Wiring ─────────────────────────────────────────────────────────────── */

async function boot() {
  const paint = $(".am-paint");
  if (paint) paint.innerHTML = heroPaint();

  // Every width in the layout comes from measuring this font. Measure before
  // it has loaded and the whole equation is laid out to the fallback's metrics.
  await fontReady();

  stage = createStage($("#am-stage"), {
    onPick: (id) => {
      say("");
      renderOffers(id);
    },
  });

  const chips = $("#am-starters");
  for (const src of STARTERS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pp-pill am-starter";
    chip.textContent = src;
    chip.addEventListener("click", () => start(src));
    chips.appendChild(chip);
  }

  $("#am-set").addEventListener("click", () => start($("#am-input").value.trim()));
  $("#am-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") start($("#am-input").value.trim());
  });
  $("#am-undo").addEventListener("click", undo);
  $("#am-restart").addEventListener("click", () => start(past[0] ? plain(past[0].eq).replace(/−/g, "-") : STARTERS[0]));

  start(STARTERS[0]);
}

boot();
