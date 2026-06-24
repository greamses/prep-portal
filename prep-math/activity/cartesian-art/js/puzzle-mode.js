/* ============================================================================
   Cartesian Art — guided puzzle mode
   ----------------------------------------------------------------------------
   Plays a saved puzzle: faint numbered "ghost" dots show where the outline
   should go (connect-the-dots), the mission bar shows the prompt + progress,
   and "Check" scores the attempt (order-independent exact-lattice matching)
   with a star result. Free mode hides all of this.
   ========================================================================== */

import { state, subscribe, exitPuzzle, scoreAttempt, clearPoints } from "./state.js";
import { layers, toPx, onRender } from "./grid.js";

const SVGNS = "http://www.w3.org/2000/svg";
const $ = (s) => document.querySelector(s);

function el(name, attrs = {}, parent = null) {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function clear(g) { while (g.firstChild) g.removeChild(g.firstChild); }

/* ── ghost target dots ─────────────────────────────────────────────────── */
function renderGhosts() {
  const G = layers.ghost;
  clear(G);
  if (state.mode !== "puzzle" || !state.puzzle) return;
  const got = new Set(state.points.map((p) => `${p.x},${p.y}`));
  state.puzzle.targets.forEach((t, i) => {
    const p = toPx(t.x, t.y);
    const hit = got.has(`${t.x},${t.y}`);
    const g = el("g", { class: `ca-ghost${hit ? " ca-ghost--hit" : ""}` }, G);
    el("circle", { cx: p.x, cy: p.y, r: 9, class: "ca-ghost-ring" }, g);
    if (hit) {
      el("path", {
        d: `M${p.x - 3.6} ${p.y + 0.2} L${p.x - 1} ${p.y + 2.8} L${p.x + 4} ${p.y - 3}`,
        class: "ca-ghost-check",
      }, g);
    } else {
      el("text", { x: p.x, y: p.y + 3.5, class: "ca-ghost-num" }, g).textContent = String(i + 1);
    }
  });
}

/* ── mission bar ───────────────────────────────────────────────────────── */
function updateMission() {
  const bar = $("#ca-mission");
  if (!bar) return;
  const on = state.mode === "puzzle" && !!state.puzzle;
  bar.hidden = !on;
  document.body.classList.toggle("ca-in-puzzle", on);
  if (!on) return;
  $("#mission-title").textContent = state.puzzle.title || "Mission";
  $("#mission-prompt").textContent =
    state.puzzle.prompt || "Plot the numbered points, then close the loop.";
  const s = scoreAttempt();
  $("#mission-progress").textContent = `${s.correct}/${s.total} points`;
}

/* ── result overlay ────────────────────────────────────────────────────── */
const STAR = (filled) =>
  `<svg viewBox="0 0 24 24" class="ca-star ${filled ? "is-on" : ""}" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 18.4 5.7 21.1 7.2 14.6l-5-4.4 6.6-.6z"/></svg>`;

function showResult() {
  const s = scoreAttempt();
  const overlay = $("#ca-result");
  if (!overlay) return;
  $("#result-stars").innerHTML = [1, 2, 3].map((n) => STAR(s.stars >= n)).join("");
  $("#result-score").textContent = `${s.score}%`;
  let msg = `${s.correct} of ${s.total} points matched`;
  if (s.extra) msg += ` · ${s.extra} extra`;
  if (!state.closed && s.correct === s.total) msg += " · close the loop for 3 stars!";
  $("#result-detail").textContent = msg;
  const head = $("#result-head");
  if (head) head.textContent = s.stars === 3 ? "Masterpiece!" : s.stars ? "Nice work!" : "Keep going!";
  overlay.classList.add("is-open");
}

function hideResult() {
  $("#ca-result")?.classList.remove("is-open");
}

export function initPuzzleMode() {
  renderGhosts();
  updateMission();

  subscribe((reason) => {
    if (reason === "puzzle") { renderGhosts(); updateMission(); }
    else if (reason === "points" || reason === "close") { renderGhosts(); updateMission(); }
    else if (reason === "grid") { renderGhosts(); }
  });
  onRender(renderGhosts);

  $("#mission-check")?.addEventListener("click", showResult);
  $("#mission-exit")?.addEventListener("click", () => { hideResult(); exitPuzzle(); });

  $("#result-retry")?.addEventListener("click", () => { hideResult(); clearPoints(); });
  $("#result-done")?.addEventListener("click", () => { hideResult(); });
  $("#result-close")?.addEventListener("click", hideResult);
  $("#ca-result")?.addEventListener("click", (e) => {
    if (e.target.id === "ca-result") hideResult();
  });
}
