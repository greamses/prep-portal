/* ============================================================================
   CHEMISTRY BENCH — the page
   ----------------------------------------------------------------------------
   Five test tubes in a rack, a shelf of bottles, a handful of tests, and a
   notebook that writes down what was seen. One tube is the tube in hand: a tap
   on a bottle puts a measure of it in that tube, a tap on a tool uses it there.
   With a mouse a bottle can also be dragged onto any tube.

   The chemistry is chem.js, the drawing is draw.js; this file only joins the
   student's hand to the two of them and keeps the notebook.
   ========================================================================== */

import { REAGENTS, GROUPS, TUBE_NAMES, CAP, TASKS, newTube, add, heat, rinse, test, tasksDone, reagent, chemHtml, isEmpty } from "./chem.js";
import { benchSvg, paintTube, bubble, film, bottleSvg, TOOL_ICON } from "./draw.js";
import { UI } from "/utils/components/ui-icons.js";
import { mountTooltips } from "/utils/components/tooltip.js";

const KEY = "chem-bench-v1";
const LOG_MAX = 40;
const $ = (id) => document.getElementById(id);

// ── what is remembered between visits ───────────────────────────────────────
const state = { tubes: TUBE_NAMES.map(newTube), sel: 0, dose: "portion", explain: true, done: [], log: [] };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (saved && Array.isArray(saved.tubes) && saved.tubes.length === TUBE_NAMES.length) {
    Object.assign(state, saved, { tubes: saved.tubes.map((t) => ({ ...newTube(), ...t, gas: null })) });
  }
} catch { /* a bad save is just an empty bench */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ } };

// ── the bench ───────────────────────────────────────────────────────────────
$("cl-bench-box").innerHTML = benchSvg();
const tubeEls = [...document.querySelectorAll(".cl-tube")];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** A sentence from chem.js; a formula inside it is written {Fe(OH)3}. */
const prose = (s) => esc(s).replace(/\{([^}]+)\}/g, (_, f) => chemHtml(f));

function paintAll() {
  tubeEls.forEach((g, i) => {
    paintTube(g, state.tubes[i]);
    g.classList.toggle("is-sel", i === state.sel);
    g.setAttribute("aria-pressed", String(i === state.sel));
  });
  holds();
}

/** Under the rack: what has gone into the tube in hand. */
function holds() {
  const t = state.tubes[state.sel];
  const names = t.added.map((id) => reagent(id).name);
  $("cl-holds").innerHTML = `<b>Tube ${TUBE_NAMES[state.sel]}</b> ` +
    (isEmpty(t) ? "is empty." : `holds ${esc(names.join(", "))}. <span class="cl-holds__vol">${Math.round((t.vol / CAP) * 100)}% full</span>`);
}

function select(i) {
  state.sel = i;
  paintAll();
  save();
}

/** The sticky note above the rack: the last thing seen, in the student's words. */
function say(text, tube = null, kind = "") {
  $("cl-say-tag").textContent = tube === null ? "Chemistry bench" : `Tube ${TUBE_NAMES[tube]}`;
  $("cl-say-text").textContent = text;
  const note = $("cl-say");
  note.classList.remove("is-new", "is-no");
  void note.offsetWidth;
  note.classList.add(kind === "no" ? "is-no" : "is-new");
}

// ── doing something to a tube ───────────────────────────────────────────────
function record(i, res) {
  const last = state.log[0];
  const same = last && last.tube === i && last.title === res.title && JSON.stringify(last.obs) === JSON.stringify(res.obs);
  if (same) last.times = (last.times || 1) + 1;
  else state.log.unshift({ tube: i, title: res.title, obs: res.obs });
  state.log.length = Math.min(state.log.length, LOG_MAX);

  const fresh = tasksDone(res, state.tubes[i]).filter((id) => !state.done.includes(id));
  state.done.push(...fresh);
  renderLog();
  if (fresh.length) renderTasks(fresh);
  const seen = res.obs.map((o) => o.text).join(" ");
  say(seen || res.title + ".", i);
  save();
}

function pour(i, id) {
  const t = state.tubes[i];
  const r = reagent(id);
  const res = add(t, id, state.dose);
  if (res.refused) return say(res.refused, i, "no");
  const g = tubeEls[i];
  const flags = res.flags;
  const painted = paintTube(g, t, { fresh: flags.some((f) => f.startsWith("ppt:")) });
  if (r.kind === "solution") film(g, "pour", { rgb: painted.look.rgb, level: 14 + (t.vol / CAP) * 150 }, 700);
  else film(g, "drop", { rgb: r.kind === "indicator" ? painted.look.rgb : [120, 120, 124] }, 800);
  if (flags.some((f) => f.startsWith("gas:"))) bubble(g, t, flags.includes("gas:O2") ? 1.8 : 1);
  holds();
  record(i, res);
}

function useTool(i, tool) {
  const t = state.tubes[i];
  const g = tubeEls[i];
  let res;
  if (tool === "heat") {
    res = heat(t);
    if (res.refused) return say(res.refused, i, "no");
    film(g, "heat", {}, 2400);
    paintTube(g, t);
    if (res.flags.some((f) => f.startsWith("gas:"))) bubble(g, t, 1.3);
  } else if (tool === "rinse") {
    if (isEmpty(t)) return say("This tube is already clean.", i, "no");
    res = rinse(t);
    paintTube(g, t);
    g.querySelector(".cl-bubbles").innerHTML = "";
  } else {
    res = test(t, tool);
    if (res.refused) return say(res.refused, i, "no");
    if (tool === "lit" || tool === "glow") film(g, "splint", { tip: tool, end: res.fx }, 2400);
    else { const [, from, to] = res.fx.split("-"); film(g, "litmus", { from, to }, 2400); }
    paintTube(g, t);
  }
  holds();
  record(i, res);
}

// ── the shelf and the tools ─────────────────────────────────────────────────
function renderShelf() {
  $("cl-shelf").innerHTML = GROUPS.map((grp) => `
    <section class="cl-group">
      <h3 class="cl-group__name">${grp.label}</h3>
      <div class="cl-group__row">
        ${REAGENTS.filter((r) => r.group === grp.id).map((r) => `
          <button type="button" class="cl-bottle" data-reagent="${r.id}" data-tip="Add ${esc(r.name)}" aria-label="Add ${esc(r.name)}">
            ${bottleSvg(r)}
            <span class="cl-bottle__formula">${r.kind === "indicator" ? "" : chemHtml(r.formula)}</span>
            <span class="cl-bottle__name">${esc(r.name.replace(/ solution$/, "").replace(/^dilute /, ""))}</span>
          </button>`).join("")}
      </div>
    </section>`).join("");
}

const TOOLS = [
  { id: "heat", label: "Heat", tip: "Heat the tube in the Bunsen flame (H)", icon: TOOL_ICON.heat },
  { id: "lit", label: "Lighted splint", tip: "Hold a lighted splint at the mouth", icon: TOOL_ICON.lit },
  { id: "glow", label: "Glowing splint", tip: "Hold a glowing splint at the mouth", icon: TOOL_ICON.glow },
  { id: "red", label: "Red litmus", tip: "Test with damp red litmus paper", icon: TOOL_ICON.red },
  { id: "blue", label: "Blue litmus", tip: "Test with damp blue litmus paper", icon: TOOL_ICON.blue },
  { id: "rinse", label: "Rinse", tip: "Empty and rinse the tube (R)", icon: UI.droplet(22) },
];
function renderTools() {
  $("cl-tools").innerHTML = TOOLS.map((t) =>
    `<button type="button" class="cl-tool" data-tool="${t.id}" data-tip="${t.tip}" aria-label="${t.tip}">${t.icon}<span>${t.label}</span></button>`
  ).join("");
  renderDose();
}
function renderDose() {
  document.querySelectorAll("[data-dose]").forEach((b) => {
    const on = b.dataset.dose === state.dose;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

// ── the notebook ────────────────────────────────────────────────────────────
function renderLog() {
  const list = $("cl-log");
  if (!state.log.length) {
    list.innerHTML = `<li class="cl-entry cl-entry--none">Nothing written yet. Pick a tube, then tap a bottle on the shelf.</li>`;
  } else {
    list.innerHTML = state.log.map((e) => `
      <li class="cl-entry">
        <p class="cl-entry__head"><span class="cl-entry__tube">${TUBE_NAMES[e.tube]}</span>${esc(e.title)}${e.times > 1 ? ` <span class="cl-entry__times">&times; ${e.times}</span>` : ""}</p>
        ${e.obs.map((o) => `
          <p class="cl-obs">${esc(o.text)}</p>
          ${o.why || o.eq ? `<p class="cl-why">${o.why ? prose(o.why) : ""}${o.eq ? `<span class="cl-eq">${chemHtml(o.eq)}</span>` : ""}</p>` : ""}`).join("")}
      </li>`).join("");
  }
  $("cl-notebook").classList.toggle("is-plain", !state.explain);
  const ex = $("cl-explain");
  ex.textContent = state.explain ? "Hide the chemistry" : "Show the chemistry";
  ex.setAttribute("aria-pressed", String(state.explain));
}

function renderTasks(fresh = []) {
  $("cl-tasks").innerHTML = TASKS.map((t) => {
    const done = state.done.includes(t.id);
    return `<li class="cl-task${done ? " is-done" : ""}${fresh.includes(t.id) ? " is-fresh" : ""}"><span class="cl-task__box">${done ? UI.check(16) : ""}</span><span>${esc(t.text)}</span></li>`;
  }).join("");
  $("cl-score").textContent = `${state.done.length} of ${TASKS.length}`;
}

// ── hands ───────────────────────────────────────────────────────────────────
const tubeAt = (x, y) => {
  const el = document.elementFromPoint(x, y);
  const g = el && el.closest ? el.closest(".cl-tube") : null;
  return g ? Number(g.dataset.tube) : -1;
};

tubeEls.forEach((g, i) => {
  g.addEventListener("click", () => select(i));
  g.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); }
  });
});

// a bottle: tap to add to the tube in hand; with a mouse, drag it onto any tube
let drag = null;
let swallowClick = false;
$("cl-shelf").addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".cl-bottle");
  if (!b || e.pointerType === "touch" || e.button !== 0) return;
  drag = { b, id: b.dataset.reagent, x: e.clientX, y: e.clientY, ghost: null, over: -1 };
});
window.addEventListener("pointermove", (e) => {
  if (!drag) return;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    drag.ghost = document.createElement("div");
    drag.ghost.className = "cl-ghost";
    drag.ghost.innerHTML = drag.b.querySelector("svg").outerHTML;
    document.body.appendChild(drag.ghost);
    document.body.classList.add("cl-dragging");
  }
  drag.ghost.style.transform = `translate(${e.clientX - 22}px, ${e.clientY - 40}px)`;
  const over = tubeAt(e.clientX, e.clientY);
  if (over !== drag.over) {
    tubeEls.forEach((g, i) => g.classList.toggle("is-over", i === over));
    drag.over = over;
  }
});
window.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (!d.ghost) return;                 // it was a tap: the click handler has it
  d.ghost.remove();
  document.body.classList.remove("cl-dragging");
  tubeEls.forEach((g) => g.classList.remove("is-over"));
  swallowClick = true;
  setTimeout(() => (swallowClick = false), 0);
  const over = tubeAt(e.clientX, e.clientY);
  if (over >= 0) { select(over); pour(over, d.id); }
});
$("cl-shelf").addEventListener("click", (e) => {
  const b = e.target.closest(".cl-bottle");
  if (!b || swallowClick) return;
  pour(state.sel, b.dataset.reagent);
});

$("cl-tools").addEventListener("click", (e) => {
  const b = e.target.closest(".cl-tool");
  if (b) useTool(state.sel, b.dataset.tool);
});
document.querySelectorAll("[data-dose]").forEach((b) =>
  b.addEventListener("click", () => { state.dose = b.dataset.dose; renderDose(); save(); })
);
$("cl-explain").addEventListener("click", () => { state.explain = !state.explain; renderLog(); save(); });
$("cl-clear-log").addEventListener("click", () => { state.log = []; renderLog(); save(); });
$("cl-rinse-all").addEventListener("click", () => {
  state.tubes = TUBE_NAMES.map(newTube);
  document.querySelectorAll(".cl-bubbles, .cl-fx").forEach((b) => (b.innerHTML = ""));
  paintAll();
  say("All five tubes are rinsed and back in the rack.");
  save();
});

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  const n = Number(e.key);
  if (n >= 1 && n <= TUBE_NAMES.length) return select(n - 1);
  const k = e.key.toLowerCase();
  if (k === "h") useTool(state.sel, "heat");
  else if (k === "r") useTool(state.sel, "rinse");
  else if (k === "arrowright") select((state.sel + 1) % TUBE_NAMES.length);
  else if (k === "arrowleft") select((state.sel + TUBE_NAMES.length - 1) % TUBE_NAMES.length);
});

renderShelf();
renderTools();
renderLog();
renderTasks();
paintAll();
mountTooltips();
