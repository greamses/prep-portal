/* ============================================================================
   THE SOROBAN PRACTICE BOARD — a soroban to work on, under a soroban film
   ----------------------------------------------------------------------------
   The user: "Add a soroban practice board below each soroban video".
   A real soroban in the site's 2D look (the Drills soroban and the films'):
   click a bead and it slides to or from the beam, the way a finger moves it.
     - the top (heaven) bead toggles five
     - an earth bead moves with the beads between it and the beam, as on a
       real frame: click one that is away and it and those above it come up;
       click one that is up and it and those below it go down
   A task card asks for practice that matches the lesson (setting numbers,
   simple sums, fives, small friends, big friends, multidigit, flash anzan,
   multiplying). Check compares the board with the answer; nothing is shown
   until the child asks (the reading under the rods is a toggle).

     mountSorobanBoard(host, { lesson: "sor-small" })
   ========================================================================== */
import { UI } from "/utils/components/ui-icons.js";
/* the site's one 2D soroban (the same drawing as Drills and the films) */
import { sorobanGeom, sorobanMarkup, slideRod } from "/utils/components/soroban-svg.js";

const NS = "http://www.w3.org/2000/svg";
const f = (n) => n.toFixed(2);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const digits = (n, rods) => String(Math.max(0, n)).padStart(rods, "0").slice(-rods).split("").map(Number).reverse();

/* ── the tasks, one maker per lesson ──────────────────────────────────────── */
/** a + b where every rod's move is of one kind (test(da, db) says whether a rod's pair is allowed) */
function sumWith(test, places, sub = false) {
  for (let tries = 0; tries < 400; tries++) {
    let a = 0, b = 0, ok = true, any = false;
    for (let p = 0; p < places; p++) {
      const da = rnd(p === places - 1 ? 1 : 0, 9), db = rnd(0, 9);
      if (!test(da, db)) { ok = false; break; }
      if (db) any = true;
      a += da * 10 ** p; b += db * 10 ** p;
    }
    if (ok && any && b > 0) return sub ? { a, b, ans: a - b } : { a, b, ans: a + b };
  }
  return null;
}
const SIMPLE_ADD = (da, db) => db <= 4 && (da % 5) + db <= 4;
const SIMPLE_SUB = (da, db) => db <= 4 && db <= da % 5;
const FIVE_ADD = (da, db) => (db >= 5 && da < 5 && da + db - 5 <= 4) || SIMPLE_ADD(da, db);
const FIVE_SUB = (da, db) => (db >= 5 && da >= 5 && (da - 5) >= db - 5) || SIMPLE_SUB(da, db);
const sumTask = (s, op) => ({ text: `Set ${s.a}, then ${op === "+" ? "add" : "take away"} ${s.b}.`, ans: s.ans, say: `${s.a} ${op === "+" ? "+" : "−"} ${s.b} = ${s.ans}` });
const TASKS = {
  "sor-count": () => { const n = rnd(1, 9); return { text: `Show ${n} on the ones rod.`, ans: n, say: `${n}` }; },
  "sor-place": () => { const n = pick([rnd(10, 99), rnd(100, 999), rnd(1000, 9999), rnd(100, 999) - (rnd(0, 1) ? 0 : 0)]); return { text: `Set ${n.toLocaleString("en-GB")}.`, ans: n, say: n.toLocaleString("en-GB") }; },
  "sor-simple": () => (rnd(0, 1) ? sumTask(sumWith(SIMPLE_ADD, 2), "+") : sumTask(sumWith((da, db) => SIMPLE_SUB(da, db) && da >= db, 2, true), "−")),
  "sor-fives": () => (rnd(0, 1) ? sumTask(sumWith(FIVE_ADD, rnd(1, 2)), "+") : sumTask(sumWith(FIVE_SUB, rnd(1, 2), true), "−")),
  "sor-small": () => {
    if (rnd(0, 1)) { const a = rnd(1, 4), b = rnd(5 - a, 4); return sumTask({ a, b, ans: a + b }, "+"); }
    const a = rnd(5, 8), b = rnd(a - 4, 4); return sumTask({ a, b, ans: a - b }, "−");
  },
  "sor-big": () => {
    if (rnd(0, 1)) { const a = rnd(2, 9), b = rnd(10 - a, 9); return sumTask({ a, b, ans: a + b }, "+"); }
    const a = rnd(10, 18), b = rnd(a - 9, 9); return sumTask({ a, b, ans: a - b }, "−");
  },
  "sor-multi": () => {
    if (rnd(0, 1)) { const a = rnd(25, 499), b = rnd(15, 499); return sumTask({ a, b, ans: a + b }, "+"); }
    const a = rnd(120, 899), b = rnd(15, a - 10); return sumTask({ a, b, ans: a - b }, "−");
  },
  "sor-anzan": () => {
    const ns = Array.from({ length: 4 }, () => rnd(1, 9));
    return { text: "Watch the numbers, move the beads, then show the total.", flash: ns, ans: ns.reduce((x, y) => x + y, 0), say: `${ns.join(" + ")} = ${ns.reduce((x, y) => x + y, 0)}` };
  },
  "sor-times1": () => { const a = rnd(12, 99), b = rnd(2, 9); return { text: `Work out ${a} × ${b} on the soroban.`, ans: a * b, say: `${a} × ${b} = ${a * b}` }; },
  "sor-times2": () => { const a = rnd(11, 49), b = rnd(11, 29); return { text: `Work out ${a} × ${b} on the soroban.`, ans: a * b, say: `${a} × ${b} = ${a * b}` }; },
};
const RODS = { "sor-count": 3, "sor-place": 5, "sor-simple": 3, "sor-fives": 3, "sor-small": 3, "sor-big": 3, "sor-multi": 4, "sor-anzan": 3, "sor-times1": 4, "sor-times2": 5 };
export const hasSorobanBoard = (lesson) => Object.prototype.hasOwnProperty.call(TASKS, lesson);

let cssDone = false;
function ensureCss() {
  if (cssDone) return;
  cssDone = true;
  const st = document.createElement("style");
  st.textContent = `
.sb-board { width: 100%; margin: 14px 0 0; }
.sb-board .pp-receipt__paper { padding: 14px 16px 18px; }
.sb-board__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.sb-board__title { margin: 0; font-family: var(--font-display); font-size: 0.95rem; color: var(--text-primary, #2a2723); }
.sb-board__task { margin: 10px 0 8px; display: inline-block; font-family: var(--font-mono, monospace); font-weight: 700; font-size: 0.9rem; }
.sb-board__flash { min-height: 2.6rem; font-family: var(--font-display); font-size: 2.2rem; text-align: center; color: var(--text-primary, #2a2723); }
.sb-board__wrap { display: grid; justify-items: center; }
.sb-board svg { max-width: 100%; height: auto; display: block; touch-action: manipulation; }
.sb-board [data-sb-bead] { cursor: pointer; }
.sb-board [data-sb-bead]:hover .sb-body { stroke: var(--accent-danger, #c0453f); stroke-width: 2; }
.sb-board__read text { font-family: "STIX Two Text", serif; }
.sb-board__keys { display: flex; gap: 8px; justify-content: center; margin-top: 10px; flex-wrap: wrap; }
.sb-board__keys button { display: inline-grid; place-items: center; width: 2.6rem; height: 2.6rem; padding: 0; }
.sb-board__keys button[aria-pressed="true"] { outline: 2px solid var(--accent-secondary, #6fb7e8); }
.sb-board__note { margin: 8px 0 0; min-height: 1.3em; text-align: center; font-family: var(--font-mono, monospace); font-size: 0.82rem; color: var(--text-secondary, #6b645b); }
.sb-board__note.is-ok { color: var(--accent-success-ink, #2f7d4a); font-weight: 700; }
.sb-board__note.is-bad { color: var(--accent-danger-ink, #c0453f); font-weight: 700; }
.sb-board__score { font-family: var(--font-mono, monospace); font-size: 0.78rem; font-weight: 700; }
`;
  document.head.append(st);
}

/** Mount a practice board for one soroban lesson into host; returns { destroy }. */
export function mountSorobanBoard(host, { lesson = "sor-simple" } = {}) {
  ensureCss();
  const rods = RODS[lesson] || 3, make = TASKS[lesson] || TASKS["sor-simple"];
  const g = sorobanGeom(rods, 22);
  const el = document.createElement("section");
  el.className = "sb-board pp-receipt";
  el.setAttribute("aria-label", "Soroban practice board");
  el.innerHTML = `<div class="pp-receipt__paper">
    <div class="sb-board__head"><h3 class="sb-board__title">Practise on the soroban</h3><span class="sb-board__score pp-pill" data-sb="score">0 right</span></div>
    <span class="sb-board__task pp-sticky pp-sticky--tape pp-sticky--c0" data-sb="task"></span>
    <div class="sb-board__flash" data-sb="flash" aria-live="polite" hidden></div>
    <div class="sb-board__wrap"></div>
    <div class="sb-board__keys">
      <button type="button" class="pp-btn" data-sb="check" data-tip="Check my answer" aria-label="Check my answer">${UI.check(20)}</button>
      <button type="button" class="pp-btn" data-sb="clear" data-tip="Clear the soroban" aria-label="Clear the soroban">${UI.trash(20)}</button>
      <button type="button" class="pp-btn" data-sb="read" data-tip="Show the reading under each rod" aria-label="Show the reading under each rod" aria-pressed="false">${UI.eye(20)}</button>
      <button type="button" class="pp-btn" data-sb="next" data-tip="Another one" aria-label="Another one">${UI.arrowRight(20)}</button>
    </div>
    <p class="sb-board__note" data-sb="note" aria-live="polite"></p></div>`;
  host.append(el);
  const $ = (k) => el.querySelector(`[data-sb="${k}"]`);

  /* the drawing: the shared soroban, and a row for the reading under it */
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${f(g.W)} ${f(g.H + 34)}`);
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "Soroban: click a bead to move it");
  svg.style.width = `${(rods * 3.1 + 4.4).toFixed(1)}rem`;          // a rod is about three rem: big enough to tap
  let o = sorobanMarkup(rods, { U: 22 });
  o += `<g class="sb-board__read" data-sb="reading" visibility="hidden">`;
  for (let p = 0; p < rods; p++) o += `<text data-sb-rd="${p}" x="${f(g.cx(p))}" y="${f(g.H + 26)}" text-anchor="middle" font-size="24" fill="#2a2723">0</text>`;
  o += `</g>`;
  svg.innerHTML = o;
  svg.querySelectorAll("[data-bead]").forEach((b) => { b.setAttribute("data-sb-bead", b.dataset.bead); b.setAttribute("role", "button"); });
  el.querySelector(".sb-board__wrap").append(svg);

  const val = Array(rods).fill(0);
  const paint = () => {
    for (let p = 0; p < rods; p++) {
      slideRod(svg, p, val[p], g, { ms: 320 });
      svg.querySelector(`[data-sb-rd="${p}"]`).textContent = String(val[p]);
    }
  };
  const value = () => val.reduce((s, v, p) => s + v * 10 ** p, 0);
  svg.addEventListener("click", (e) => {
    const g = e.target.closest("[data-sb-bead]");
    if (!g) return;
    const m = /^(\d+)(h|e(\d))$/.exec(g.dataset.sbBead);
    const p = Number(m[1]), v = val[p], up = v >= 5 ? 5 : 0, k = v % 5;
    if (m[2] === "h") val[p] = (up ? 0 : 5) + k;
    else { const i = Number(m[3]); val[p] = up + (i < k ? i : i + 1); }
    paint();
    $("note").textContent = ""; $("note").className = "sb-board__note";
  });

  let task = null, right = 0, flashTimer = null;
  const stopFlash = () => { clearTimeout(flashTimer); flashTimer = null; };
  function next() {
    stopFlash();
    task = make();
    val.fill(0); paint();
    $("task").textContent = task.text;
    $("note").textContent = ""; $("note").className = "sb-board__note";
    const fl = $("flash");
    fl.hidden = !task.flash;
    if (task.flash) {
      /* flash anzan: each number shows for a moment, then a blank gap */
      let i = 0;
      const show = () => {
        if (i >= task.flash.length) { fl.textContent = "?"; return; }
        fl.textContent = String(task.flash[i]);
        flashTimer = setTimeout(() => { fl.textContent = ""; i++; flashTimer = setTimeout(show, 500); }, 1200);
      };
      fl.textContent = "Ready…";
      flashTimer = setTimeout(show, 1000);
    }
  }
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sb]");
    if (!b || b.tagName !== "BUTTON") return;
    const k = b.dataset.sb, note = $("note");
    if (k === "check" && task) {
      const got = value();
      if (got === task.ans) { right++; $("score").textContent = `${right} right`; note.textContent = `Right: ${task.say}`; note.className = "sb-board__note is-ok"; }
      else { note.textContent = `Not yet: the soroban shows ${got.toLocaleString("en-GB")}. Have another go.`; note.className = "sb-board__note is-bad"; }
    } else if (k === "clear") { val.fill(0); paint(); note.textContent = ""; }
    else if (k === "next") next();
    else if (k === "read") {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on));
      $("reading").setAttribute("visibility", on ? "visible" : "hidden");
    }
  });
  next();
  return { el, destroy() { stopFlash(); el.remove(); } };
}
