/* ============================================================================
   TWO SCALES — the page
   ----------------------------------------------------------------------------
   Two balance scales that know about each other. What a child does here:

     tap a block            it crosses to the other pan of its own scale and
                            its sign turns over
     drag a block           onto the other pan (the same thing), or onto
                            another block in its own pan (numbers add up,
                            opposites cancel)
     share the pans         when both pans cut into equal helpings
     drag the rule chip     when a scale says what a letter is worth, that
                            chip carries it to the OTHER scale: drop it on
                            that letter — or on a whole pan — and the letter
                            is swapped for what it is worth. Substitution.

   Every legal move keeps both scales true, so the beams never tip; a move
   that would not is refused, with a line saying why.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
import { mountTooltips } from "/utils/components/tooltip.js";
import * as M from "./model.js";
import { scaleHtml } from "./art.js";
import { LEVELS, makePuzzle } from "./generate.js";

const $ = (sel, root = document) => root.querySelector(sel);
const NAMES = ["Scale A", "Scale B"];
const KEEP = "prep-portal:two-scales";

const ICON = {
  again: UI.again(), undo: UI.undo(), settings: UI.settings(), close: UI.close(),
  share: UI.half(), scales: UI.upDown(),
};

const S = {
  level: "evaluate",
  seed: 1,
  st: null,
  past: [],        // every state before this one, for undo
  moves: 0,
  held: null,      // a block picked up by a tap-and-tap
};

/* ── remembering the dial ─────────────────────────────────────────────────*/
const remember = () => { try { localStorage.setItem(KEEP, JSON.stringify({ level: S.level })); } catch { /* fine without it */ } };
const recall = () => {
  try {
    const was = JSON.parse(localStorage.getItem(KEEP) || "null");
    if (was && LEVELS[was.level]) S.level = was.level;
  } catch { /* the same */ }
};

/* ── a new puzzle ─────────────────────────────────────────────────────────*/

function deal() {
  S.seed = (Math.floor(Math.random() * 999983) + 1) >>> 0;
  const p = makePuzzle(S.level, S.seed);
  S.st = { scales: p.scales, want: p.want, answer: p.answer };
  S.start = M.copy(S.st);
  S.story = p.story;
  S.past = [];
  S.moves = 0;
  S.held = null;
  draw();
  say(p.story);
}

const step = (next, words) => {
  if (!next) return false;
  S.past.push(M.copy(S.st));
  S.st = next;
  S.moves += 1;
  S.held = null;
  draw();
  if (M.isDone(S.st)) {
    const all = M.found(S.st);
    say(`Both scales agree: ${S.st.want.map((k) => `${k} = ${all[k]}`).join(", ")} — in ${S.moves} move${S.moves === 1 ? "" : "s"}.`, "win");
  } else if (words) say(words);
  return true;
};

/* ── drawing ──────────────────────────────────────────────────────────────*/

function draw() {
  const rules = M.rulesOf(S.st);
  $("#ts-board").innerHTML = S.st.scales
    .map((sc, i) => scaleHtml(sc, i, { name: NAMES[i], rule: rules.find((r) => r.i === i) }))
    .join("");
  /* sharing: only where both pans really do cut into equal helpings */
  S.st.scales.forEach((sc, i) => {
    const k = M.sharesInto(sc);
    const box = $(`[data-acts="${i}"]`);
    box.innerHTML = k >= 2
      ? `<button type="button" class="pp-sticky pp-note-btn ts-share" data-share="${i}" data-k="${k}" data-tip="Cut both pans into ${k} equal helpings and keep one">${ICON.share}<span>Share into ${k}</span></button>`
      : "";
  });
  const found = M.found(S.st);
  $("#ts-goal").innerHTML = `<span class="ts-goal__tag">Find</span>` + S.st.want
    .map((k) => `<span class="ts-found${found[k] !== undefined ? " is-found" : ""}"><b>${k}</b>${found[k] !== undefined ? ` = ${found[k]}` : ""}</span>`).join("");
  $("#ts-moves").textContent = `${S.moves} move${S.moves === 1 ? "" : "s"}`;
  mountTooltips(document);
}

function say(words, kind = "") {
  const el = $("#ts-say");
  el.textContent = words;
  el.className = `ts-say${kind ? ` ts-say--${kind}` : ""}`;
}

const shake = (el) => {
  if (!el) return;
  el.classList.remove("is-no"); void el.offsetWidth; el.classList.add("is-no");
  setTimeout(() => el.classList.remove("is-no"), 420);
};

/* ── what a drop means ────────────────────────────────────────────────────*/

const ruleFor = (i) => M.rulesOf(S.st).find((r) => r.i === i) || null;

/**
 * A block let go over something.
 *   onBlock   the block under the finger (or null)
 *   onPan     { i, pan } the pan under the finger (or null)
 */
function drop(id, onBlock, onPan) {
  const from = M.whereIs(S.st, id);
  if (!from) return;
  const rule = ruleFor(from.i);
  const carries = rule && rule.pan !== from.pan && rule.tiles.length === 1;

  /* a letter on the other scale, and this block is what that letter is worth */
  if (onBlock) {
    const to = M.whereIs(S.st, onBlock);
    if (to && to.i !== from.i) {
      if (!carries) { shake($(`.ts-block[data-id="${id}"]`)); say(`Only a scale that says what a letter is worth can fill it in somewhere else. Get ${to.b.kind} or x on its own first.`, "no"); return; }
      if (!step(M.substitute(S.st, rule, onBlock), `Swapped ${rule.kind} for ${M.faceOf(rule.tiles[0])} — that is what ${NAMES[from.i]} says it is worth.`)) {
        shake($(`.ts-block[data-id="${onBlock}"]`));
        say(`That is not ${rule.kind}. A letter may only be swapped for what its own scale says.`, "no");
      }
      return;
    }
    if (to && to.i === from.i && to.pan === from.pan) {
      if (step(M.merge(S.st, id, onBlock), "Put together.")) return;
      shake($(`.ts-block[data-id="${id}"]`));
      say("Two of the same letter stay two blocks — only numbers add up, and a block and its opposite cancel.", "no");
      return;
    }
    if (to && to.i === from.i) { step(M.across(S.st, id), `${M.faceOf(from.b)} crossed over — it changes sign.`); return; }
  }

  if (onPan) {
    if (onPan.i !== from.i) {
      if (!carries) { shake($(`.ts-block[data-id="${id}"]`)); say("A block cannot jump to the other scale on its own — only what a scale says a letter is worth may travel.", "no"); return; }
      if (!step(M.substituteAll(S.st, rule, onPan.i, onPan.pan), `Every ${rule.kind} on that pan swapped for ${M.faceOf(rule.tiles[0])}.`)) {
        say(`There is no ${rule.kind} on that pan to swap.`, "no");
      }
      return;
    }
    if (onPan.pan !== from.pan) { step(M.across(S.st, id), `${M.faceOf(from.b)} crossed over — it changes sign.`); return; }
  }
}

/** The rule chip let go somewhere. */
function dropRule(i, onBlock, onPan) {
  const rule = ruleFor(i);
  if (!rule) return;
  if (onBlock) {
    const to = M.whereIs(S.st, onBlock);
    if (to && to.i === i) { say("A scale cannot fill itself in — carry it to the other scale.", "no"); shake($(`.ts-rule[data-rule="${i}"]`)); return; }
    if (!step(M.substitute(S.st, rule, onBlock), `${rule.kind} swapped for what ${NAMES[i]} says it is worth.`)) {
      shake($(`.ts-block[data-id="${onBlock}"]`));
      say(`That block is not ${rule.kind}.`, "no");
    }
    return;
  }
  if (onPan) {
    if (onPan.i === i) { say("A scale cannot fill itself in — carry it to the other scale.", "no"); return; }
    if (!step(M.substituteAll(S.st, rule, onPan.i, onPan.pan), `Every ${rule.kind} on that pan swapped.`)) {
      say(`There is no ${rule.kind} on that pan to swap.`, "no");
    }
  }
}

/* ── dragging ─────────────────────────────────────────────────────────────*/

let drag = null;

const under = (x, y) => {
  const stack = document.elementsFromPoint(x, y);
  let b = null; let pan = null;
  for (const el of stack) {
    if (!b && !el.closest?.(".ts-rule")) { const hit = el.closest?.(".ts-block[data-id]"); if (hit && (!drag || hit.dataset.id !== drag.id)) b = hit; }
    if (!pan) { const p = el.closest?.(".ts-pan"); if (p) pan = p; }
  }
  return { b, pan };
};

function wireDrag() {
  const board = $("#ts-board");

  board.addEventListener("pointerdown", (e) => {
    const chip = e.target.closest(".ts-rule");
    const el = e.target.closest(".ts-block:not(.is-mini)");
    if (!chip && !el) return;
    e.preventDefault();
    const node = chip || el;
    const r = node.getBoundingClientRect();
    drag = {
      kind: chip ? "rule" : "block",
      id: chip ? null : el.dataset.id,
      i: chip ? Number(chip.dataset.rule) : null,
      node, x0: e.clientX, y0: e.clientY,
      dx: e.clientX - r.left, dy: e.clientY - r.top,
      w: r.width, h: r.height, moved: false, pointer: e.pointerId,
    };
  });

  document.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      drag.ghost = drag.node.cloneNode(true);
      drag.ghost.classList.add("ts-ghost");
      drag.ghost.style.width = `${drag.w}px`;
      drag.ghost.style.height = `${drag.h}px`;
      document.body.appendChild(drag.ghost);
      drag.node.classList.add("is-lifted");
    }
    drag.ghost.style.left = `${e.clientX - drag.dx}px`;
    drag.ghost.style.top = `${e.clientY - drag.dy}px`;
    const { b, pan } = under(e.clientX, e.clientY);
    document.querySelectorAll(".is-over").forEach((n) => n.classList.remove("is-over"));
    (b || pan)?.classList.add("is-over");
  });

  const up = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const d = drag;
    drag = null;
    document.querySelectorAll(".is-over").forEach((n) => n.classList.remove("is-over"));
    d.ghost?.remove();
    d.node.classList.remove("is-lifted");
    if (!d.moved) {
      /* a tap: a block crosses over; the chip waits to be tapped onto something */
      if (d.kind === "block") {
        const at = M.whereIs(S.st, d.id);
        step(M.across(S.st, d.id), at ? `${M.faceOf(at.b)} crossed over — it changes sign.` : "");
      } else {
        S.held = S.held === `rule${d.i}` ? null : `rule${d.i}`;
        document.querySelectorAll(".ts-rule").forEach((c) => c.classList.toggle("is-held", S.held === `rule${c.dataset.rule}`));
        say(S.held ? "Now tap the same letter on the other scale — or a whole pan." : "");
      }
      return;
    }
    const { b, pan } = under(e.clientX, e.clientY);
    const onPan = pan ? { i: Number(pan.dataset.scale), pan: pan.dataset.pan } : null;
    if (d.kind === "rule") dropRule(d.i, b?.dataset.id || null, onPan);
    else drop(d.id, b?.dataset.id || null, onPan);
  };
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", up);

  /* tap-then-tap, the keyboard's way too */
  board.addEventListener("click", (e) => {
    const share = e.target.closest(".ts-share");
    if (share) { step(M.share(S.st, Number(share.dataset.share), Number(share.dataset.k)), `Both pans shared into ${share.dataset.k}.`); return; }
    if (!S.held) return;
    const i = Number(S.held.slice(4));
    const hit = e.target.closest(".ts-block:not(.is-mini)");
    const pan = e.target.closest(".ts-pan");
    if (hit) dropRule(i, hit.dataset.id, null);
    else if (pan) dropRule(i, null, { i: Number(pan.dataset.scale), pan: pan.dataset.pan });
  });
}

/* ── the bar ──────────────────────────────────────────────────────────────*/

function wireBar() {
  $("#ts-again").addEventListener("click", deal);
  $("#ts-undo").addEventListener("click", () => {
    const back = S.past.pop();
    if (!back) { say("Nothing to take back yet."); return; }
    S.st = back;
    S.moves = Math.max(0, S.moves - 1);
    draw();
    say("Taken back.");
  });
  $("#ts-reset").addEventListener("click", () => {
    if (!S.start) return;
    S.past.push(M.copy(S.st));
    S.st = M.copy(S.start);
    S.moves = 0;
    draw();
    say(S.story);
  });
}

function wireSettings() {
  const modal = $("#ts-settings");
  const open = () => { drawSettings(); modal.hidden = false; $(".ts-modal__close", modal).focus(); };
  const shut = () => { modal.hidden = true; $("#ts-open-settings").focus(); };
  $("#ts-open-settings").addEventListener("click", open);
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) shut(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) shut(); });
  modal.addEventListener("click", (e) => {
    const btn = e.target.closest(".ts-opt");
    if (!btn) return;
    S.level = btn.dataset.val;
    remember();
    drawSettings();
    deal();
  });
}

function drawSettings() {
  $("#ts-levels").innerHTML = Object.values(LEVELS).map((l) =>
    `<button type="button" class="pp-sticky pp-note-btn ts-opt${S.level === l.id ? " is-on" : ""}" data-val="${l.id}" aria-pressed="${S.level === l.id}">` +
    `<span>${l.label.split(" — ")[0]}</span><em>${l.label.split(" — ")[1] || ""}</em></button>`).join("");
}

/* ── go ───────────────────────────────────────────────────────────────────*/

function start() {
  $("#ts-again").innerHTML = `${ICON.again}<span>New puzzle</span>`;
  $("#ts-undo").innerHTML = `${ICON.undo}<span>Undo</span>`;
  $("#ts-reset").innerHTML = `${ICON.close}<span>Start again</span>`;
  $("#ts-open-settings").innerHTML = `${ICON.settings}<span>Settings</span>`;
  $(".ts-modal__close").innerHTML = ICON.close;
  $("#ts-eyebrow-icon").innerHTML = ICON.scales;
  recall();
  wireDrag();
  wireBar();
  wireSettings();
  deal();
  mountTooltips(document);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
