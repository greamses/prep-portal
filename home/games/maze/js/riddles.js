/* ============================================================================
   3D Maze — riddle gates ("wheel openers")
   ----------------------------------------------------------------------------
   A locked gate pops a riddle with a rotary wheel of answers: spin with ◄ ► to
   the answer and press OPEN GATE. Correct → onSolve() (the gate opens). The game
   keeps running behind the panel, so a slow answer lets the zombies catch up.
   ========================================================================== */

const $ = (s) => document.querySelector(s);

const BANK = [
  { q: "I have keys but no locks, and space but no room. What am I?", options: ["A map", "A keyboard", "A piano", "A car"], answer: 1 },
  { q: "What has to be broken before you can use it?", options: ["A window", "A promise", "An egg", "A code"], answer: 2 },
  { q: "What gets wetter the more it dries?", options: ["A towel", "The sun", "A sponge", "The rain"], answer: 0 },
  { q: "What has hands but cannot clap?", options: ["A clock", "A statue", "A glove", "A tree"], answer: 0 },
  { q: "What has a neck but no head?", options: ["A giraffe", "A bottle", "A shirt", "A road"], answer: 1 },
  { q: "I travel the world but stay in a corner. What am I?", options: ["A bird", "A stamp", "The wind", "A clock"], answer: 1 },
  { q: "The more you take, the more you leave behind. What are they?", options: ["Footsteps", "Photos", "Coins", "Words"], answer: 0 },
  { q: "What has many teeth but cannot bite?", options: ["A saw", "A comb", "A zipper", "A shark"], answer: 1 },
  { q: "What goes up but never comes down?", options: ["A balloon", "Your age", "Smoke", "A kite"], answer: 1 },
];

let state = null; // { options, answer, idx, onSolve }

function render() {
  if (!state) return;
  $("#mz-wheel-opt").textContent = state.options[state.idx];
}
function cycle(d) {
  if (!state) return;
  state.idx = (state.idx + d + state.options.length) % state.options.length;
  $("#mz-riddle-fb").textContent = "";
  render();
}
function confirm() {
  if (!state) return;
  if (state.idx === state.answer) {
    const cb = state.onSolve;
    state = null;
    $("#maze-riddle").hidden = true;
    cb && cb();
  } else {
    $("#mz-riddle-fb").textContent = "Wrong — try again!";
    const card = $("#maze-riddle .mz-riddle-card");
    card.classList.remove("shake");
    void card.offsetWidth; // restart animation
    card.classList.add("shake");
  }
}

export function initRiddles() {
  if (!$("#maze-riddle")) return;
  $("#mz-wheel-prev").addEventListener("click", () => cycle(-1));
  $("#mz-wheel-next").addEventListener("click", () => cycle(1));
  $("#mz-riddle-go").addEventListener("click", confirm);
}

export function openRiddle(onSolve) {
  const r = BANK[(Math.random() * BANK.length) | 0];
  state = { options: r.options.slice(), answer: r.answer, idx: 0, onSolve };
  $("#mz-riddle-q").textContent = r.q;
  $("#mz-riddle-fb").textContent = "";
  render();
  $("#maze-riddle").hidden = false;
}

export function isRiddleOpen() { return !!state; }

export function closeRiddle() {
  state = null;
  const el = $("#maze-riddle");
  if (el) el.hidden = true;
}
