/* ============================================================================
   3D Maze — riddle gates (ancient wooden gate)
   ----------------------------------------------------------------------------
   A locked gate types out a riddle (typewriter) on an aged-wood panel; the
   player TYPES the answer and presses OPEN GATE. Correct → onSolve() opens the
   gate. The game keeps running behind the panel, so a slow answer lets the
   zombies catch up.
   ========================================================================== */

import { CFG } from "./config.js";

const $ = (s) => document.querySelector(s);

const BANKS = {
  math: [
    { q: "7 × 8 = ?", a: ["56"] },
    { q: "15% of 200 = ?", a: ["30"] },
    { q: "12 + 9 × 2 = ?", a: ["30"] },
    { q: "Square root of 144 = ?", a: ["12"] },
    { q: "Half of 250 = ?", a: ["125"] },
    { q: "3 cubed (3³) = ?", a: ["27"] },
    { q: "Perimeter of a 5 × 3 rectangle?", a: ["16"] },
    { q: "The prime number right after 7?", a: ["11"] },
    { q: "100 − 37 = ?", a: ["63"] },
    { q: "A dozen plus a half-dozen?", a: ["18"] },
  ],
  english: [
    { q: "Plural of 'mouse'?", a: ["mice"] },
    { q: "Past tense of 'go'?", a: ["went"] },
    { q: "Opposite of 'ancient'?", a: ["modern", "new"] },
    { q: "Correct spelling — recieve or receive?", a: ["receive"] },
    { q: "A synonym for 'happy'?", a: ["glad", "joyful", "cheerful", "merry"] },
    { q: "Opposite of 'begin'?", a: ["end", "finish", "stop"] },
    { q: "Plural of 'child'?", a: ["children"] },
    { q: "Past tense of 'run'?", a: ["ran"] },
  ],
  science: [
    { q: "What gas do plants take in?", a: ["carbon dioxide", "co2"] },
    { q: "How many legs does an insect have?", a: ["6", "six"] },
    { q: "Which planet is the Red Planet?", a: ["mars"] },
    { q: "Water is hydrogen and ___?", a: ["oxygen"] },
    { q: "Which organ pumps blood?", a: ["heart"] },
    { q: "The centre of an atom is the ___?", a: ["nucleus"] },
    { q: "What force pulls things to Earth?", a: ["gravity"] },
    { q: "Solid, liquid and ___?", a: ["gas"] },
  ],
};
const LABEL = { math: "MATH GATE", english: "ENGLISH GATE", science: "SCIENCE GATE" };

let state = null;     // { answers:[], onSolve }
let typeTimer = null;

const norm = (s) => s.toLowerCase().trim().replace(/^(a|an|the)\s+/, "").replace(/[^a-z0-9 ]/g, "");

function typeQuestion(text) {
  const el = $("#mz-riddle-q");
  if (!el) return;
  el.textContent = "";
  let i = 0;
  clearInterval(typeTimer);
  typeTimer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(typeTimer);
  }, 26);
}

function submit() {
  if (!state) return;
  const input = $("#mz-riddle-input");
  const val = norm(input.value || "");
  if (val && state.answers.some((a) => norm(a) === val)) {
    const cb = state.onSolve;
    state = null;
    clearInterval(typeTimer);
    $("#maze-riddle").hidden = true;
    cb && cb();
  } else {
    $("#mz-riddle-fb").textContent = "The gate holds fast… try again.";
    const card = $("#maze-riddle .mz-riddle-card");
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
  }
}

export function initRiddles() {
  if (!$("#maze-riddle")) return;
  $("#mz-riddle-go").addEventListener("click", submit);
  $("#mz-riddle-input").addEventListener("keydown", (e) => {
    e.stopPropagation(); // don't leak typing to game controls
    if (e.key === "Enter") submit();
  });
}

export function openRiddle(onSolve) {
  const subs = ["math", "english", "science"];
  const sub = CFG.subject && BANKS[CFG.subject] ? CFG.subject : subs[(Math.random() * subs.length) | 0];
  const bank = BANKS[sub];
  const r = bank[(Math.random() * bank.length) | 0];
  state = { answers: r.a, onSolve };
  const tag = $("#mz-riddle-tag");
  if (tag) tag.textContent = "⚜ " + LABEL[sub] + " ⚜";
  $("#mz-riddle-fb").textContent = "";
  const input = $("#mz-riddle-input");
  input.value = "";
  $("#maze-riddle").hidden = false;
  typeQuestion(r.q);
  setTimeout(() => input.focus(), 60);
}

export function isRiddleOpen() { return !!state; }

export function closeRiddle() {
  state = null;
  clearInterval(typeTimer);
  const el = $("#maze-riddle");
  if (el) el.hidden = true;
}
