/* ============================================================================
   TWO SCALES — the bench
   ----------------------------------------------------------------------------
   The scales themselves, the blocks and all four moves are the workbook's own
   piece (utils/components/workbook/scales.js), so the bench and the Algebra
   Workbook's balance chapter behave exactly alike — a child who has done one
   can do the other without being told anything twice.

   What is left here is the bench around it: which puzzle, how hard, what is
   still to find, undo, and the line that says what just happened.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
import { mountTooltips } from "/utils/components/tooltip.js";
import * as SC from "/utils/components/workbook/scales.js";
import { LEVELS, makePuzzle } from "./generate.js";

const $ = (sel, root = document) => root.querySelector(sel);
const NAMES = ["Scale A", "Scale B"];
const KEEP = "prep-portal:two-scales";

const ICON = { again: UI.again(), undo: UI.undo(), settings: UI.settings(), close: UI.close(), scales: UI.upDown() };

const S = {
  level: "evaluate",
  seed: 1,
  want: ["y"],
  answer: {},
  past: [],       // every state before this one, for undo
  moves: 0,
  live: null,     // the mounted scales
  story: "",
};

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
  S.want = p.want;
  S.answer = p.answer;
  S.story = p.story;
  S.past = [];
  S.moves = 0;
  S.live?.dispose();
  $("#ts-board").innerHTML = SC.scalesHtml(p.scales, { names: NAMES });
  mount();
  say(p.story);
  tally();
}

let last = null;      // the state before the newest move
let quiet = false;    // true while the page itself is setting the scales

function mount() {
  last = null;
  quiet = false;
  S.live = SC.mountScales($("#ts-board"), {
    names: NAMES,
    onSay: (words, kind) => say(words, kind),
    onChange: (now) => {
      if (quiet) { quiet = false; last = SC.copy(now); tally(); return; }
      if (last) { S.past.push(last); S.moves += 1; }
      last = SC.copy(now);
      tally();
      mountTooltips(document);
      if (isDone()) {
        const all = SC.found(now, S.want);
        say(`Both scales agree: ${S.want.map((k) => `${k} = ${all[k]}`).join(", ")} — in ${S.moves} move${S.moves === 1 ? "" : "s"}.`, "win");
      }
    },
  });
}

const isDone = () => {
  const st = S.live?.state();
  if (!st) return false;
  return S.want.every((kind) => st.scales.some((sc) => SC.valueOf(sc, kind) === S.answer[kind]));
};

function tally() {
  const st = S.live?.state();
  const found = st ? SC.found(st, S.want) : {};
  $("#ts-goal").innerHTML = `<span class="ts-goal__tag">Find</span>` + S.want
    .map((k) => `<span class="ts-found${found[k] !== undefined ? " is-found" : ""}"><b>${k}</b>${found[k] !== undefined ? ` = ${found[k]}` : ""}</span>`).join("");
  $("#ts-moves").textContent = `${S.moves} move${S.moves === 1 ? "" : "s"}`;
}

function say(words, kind = "") {
  const el = $("#ts-say");
  el.textContent = words;
  el.className = `ts-say${kind ? ` ts-say--${kind}` : ""}`;
}

/* ── the bar ──────────────────────────────────────────────────────────────*/

function wireBar() {
  $("#ts-again").addEventListener("click", deal);
  $("#ts-undo").addEventListener("click", () => {
    const back = S.past.pop();
    if (!back) { say("Nothing to take back yet."); return; }
    S.moves = Math.max(0, S.moves - 1);
    quiet = true;
    S.live.set(back);
    say("Taken back.");
  });
  $("#ts-reset").addEventListener("click", () => {
    S.past = [];
    S.moves = 0;
    quiet = true;
    S.live?.reset();
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
  wireBar();
  wireSettings();
  deal();
  mountTooltips(document);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
