/* ============================================================================
   3D Maze — riddle gates (ancient wooden gate)
   ----------------------------------------------------------------------------
   A locked gate types out a riddle (typewriter) on an aged-wood panel; the
   player TYPES the answer and presses OPEN GATE. Correct → onSolve() opens the
   gate. The game keeps running behind the panel, so a slow answer lets the
   zombies catch up.
   ========================================================================== */

const $ = (s) => document.querySelector(s);

const BANK = [
  { q: "I have keys but no locks, and space but no room. What am I?", a: ["keyboard"] },
  { q: "What must be broken before you can use it?", a: ["egg"] },
  { q: "What gets wetter the more it dries?", a: ["towel"] },
  { q: "What has hands but cannot clap?", a: ["clock"] },
  { q: "What has a neck but no head?", a: ["bottle"] },
  { q: "I travel the world but stay in a corner. What am I?", a: ["stamp", "postage stamp"] },
  { q: "The more you take, the more you leave behind. What are they?", a: ["footsteps", "footprints", "steps"] },
  { q: "What has many teeth but cannot bite?", a: ["comb", "zipper", "zip"] },
  { q: "What goes up but never comes down?", a: ["age"] },
  { q: "What has a thumb and four fingers but is not alive?", a: ["glove"] },
];

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
  const r = BANK[(Math.random() * BANK.length) | 0];
  state = { answers: r.a, onSolve };
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
