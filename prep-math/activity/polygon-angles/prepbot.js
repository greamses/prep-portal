/* ============================================================================
   POLYGON ANGLES — PrepBot
   ----------------------------------------------------------------------------
   The shared teaching mascot (prep-math/mental-math/shared/prepbot-teacher.js),
   the same character as Mental Math ×11 and Cartesian Art.

   It used to run a scripted lesson: seven modules of numbered steps, gated
   behind a map of locked nodes, each step waiting for the learner to perform
   one exact action before the next sentence would come. That has been taken
   out — the page is the explorer now, the way its three sibling tabs are — so
   what is left here is the character itself: it says what the figure currently
   is when the polygon changes, and its "Ask" button opens the site's real chat
   for anything else.

   As a TUTOR it has the run of the page (teacher.control): the chat's replies
   can change the number of sides, turn and resize the polygon, switch to the
   interior-triangles or exterior-sum view and play it, and show or hide every
   layer. It works the page's own controls, so nothing here reaches into
   script.js.
   ========================================================================== */

import { PrepbotTeacher } from "/prep-math/mental-math/shared/prepbot-teacher.js";
import { auth } from "/firebase-init.js";

const NAMES = {
  3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon",
  7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon",
  11: "hendecagon", 12: "dodecagon",
};

let teacher = null;
let lastSpoken = null;
let settleTimer = null;
let quietUntil = 0;       // while the tutor is working the page, the figure is not described over it

// ── the page's own controls, worked by the tutor ──
const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function slide(id, value) {
  const el = $(id);
  if (!el) return false;
  const v = Math.max(Number(el.min), Math.min(Number(el.max), Number(value)));
  if (!Number.isFinite(v)) return false;
  el.value = String(v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
function setMode(mode) {
  const b = document.querySelector(`.anim-mode-btn[data-mode="${mode}"]`);
  if (!b) return false;
  b.click();
  return true;
}
const LAYERS = {
  protractors: "t-protractors", protractor: "t-protractors", angles: "t-protractors", labels: "t-labels", "angle labels": "t-labels",
  vertices: "t-vertices", corners: "t-vertices", centre: "t-center", center: "t-center", "side labels": "t-sidelabels", sides: "t-sidelabels",
  diagonals: "t-diagonals", radii: "t-radii", fill: "t-fill", grid: "t-grid",
};
function layer(name, on) {
  const key = Object.keys(LAYERS).sort((a, b) => b.length - a.length).find((k) => name.toLowerCase().includes(k));
  const el = key && $(LAYERS[key]);
  if (!el) return `There is no layer called "${name}".`;
  if (el.checked !== on) { el.checked = on; el.dispatchEvent(new Event("change", { bubbles: true })); }
  return "";
}
const num = (s) => { const m = /-?\d+(\.\d+)?/.exec(String(s)); return m ? Number(m[0]) : NaN; };
const modeNow = () => document.querySelector(".anim-mode-btn.active")?.dataset.mode || "none";
/** Run the interior or exterior animation from the start to the end, slowly enough to watch. */
async function sweep(to = 1) {
  if (modeNow() === "none") setMode("interior");
  const from = Number($("sl-anim").value) >= to ? 0 : Number($("sl-anim").value);
  const steps = 60;
  for (let i = 0; i <= steps; i++) { slide("sl-anim", from + ((to - from) * i) / steps); await wait(55); }
}
function describe() {
  const n = Number($("sl-sides").value);
  const on = (id) => $(id)?.checked;
  const shown = Object.entries({ protractors: "t-protractors", "angle labels": "t-labels", vertices: "t-vertices", centre: "t-center", "side labels": "t-sidelabels", diagonals: "t-diagonals", radii: "t-radii", fill: "t-fill", grid: "t-grid" });
  return `The student is on the Polygon Angles explorer: one polygon drawn on a canvas, which they can drag by its corners.
NOW: ${/^[aeio]/.test(NAMES[n] || "") || n === 8 || n === 11 ? "an" : "a"} ${NAMES[n] || `${n}-sided polygon`} with ${n} sides. Interior angles add to (${n} - 2) x 180 = ${(n - 2) * 180} degrees; if regular each is ${Math.round(((n - 2) * 180 / n) * 100) / 100} degrees. Exterior angles add to 360, each ${Math.round((360 / n) * 100) / 100} degrees if regular. It splits into ${n - 2} triangles from one corner and has ${(n * (n - 3)) / 2} diagonals.
View: ${{ none: "normal", interior: "interior angles as triangles", exterior: "exterior angle sum" }[modeNow()]}, animation at ${Math.round(Number($("sl-anim").value) * 100)}%. Rotation ${$("sl-rot").value} degrees, size ${$("sl-radius").value}.
Showing: ${shown.filter(([, id]) => on(id)).map(([k]) => k).join(", ") || "nothing extra"}. Hidden: ${shown.filter(([, id]) => !on(id)).map(([k]) => k).join(", ") || "nothing"}.`;
}
function takeControl() {
  const acting = (fn) => async (args) => { quietUntil = Date.now() + 6000; return fn(args); };
  teacher.control({
    title: "the Polygon Angles explorer",
    context: describe,
    intro: "You are the tutor on this page and you can work the polygon yourself. Change one thing at a time, then ask the student what they notice.",
    commands: {
      sides: { use: "sides <3-12>", does: "draws a regular polygon with that many sides", direct: true, run: acting((a) => (slide("sl-sides", num(a)) ? "" : "How many sides?")) },
      turn: { use: "turn <0-359>", does: "rotates the polygon to that angle", direct: true, run: acting((a) => (slide("sl-rot", num(a)) ? "" : "Turn it to what angle?")) },
      size: { use: "size <70-210>", does: "makes the polygon bigger or smaller", direct: true, run: acting((a) => (slide("sl-radius", num(a)) ? "" : "What size?")) },
      view: { use: "view <normal | interior | exterior>", does: "normal figure, the interior angles cut into triangles, or the exterior angles gathered into a full turn", direct: true,
        run: acting((a) => (setMode(/int/i.test(a) ? "interior" : /ext/i.test(a) ? "exterior" : /norm|none|plain/i.test(a) ? "none" : "?") ? "" : "Which view: normal, interior or exterior?")) },
      play: { use: "play", does: "runs the current view's animation from start to finish", direct: true, run: acting(async () => { await sweep(1); return ""; }) },
      progress: { use: "progress <0-100>", does: "sets the animation to that percent", run: acting((a) => { if (modeNow() === "none") setMode("interior"); return slide("sl-anim", num(a) / 100) ? "" : "What percent?"; }) },
      show: { use: "show <protractors | angle labels | vertices | centre | side labels | diagonals | radii | fill | grid>", does: "shows that layer", run: acting((a) => layer(a, true)) },
      hide: { use: "hide <the same layer names>", does: "hides that layer", run: acting((a) => layer(a, false)) },
      reset: { use: "reset", does: "makes the polygon regular again after corners were dragged", direct: true, run: acting(() => { slide("sl-sides", $("sl-sides").value); return ""; }) },
      zoom: { use: "zoom <in | out | reset>", does: "zooms the canvas", run: acting((a) => { const b = $(/out/i.test(a) ? "btn-zoom-out" : /reset|fit/i.test(a) ? "btn-zoom-reset" : "btn-zoom-in"); b?.click(); return ""; }) },
    },
  });
}

function mount() {
  const root = document.createElement("div");
  root.id = "pa-prepbot";
  root.className = "mm-prepbot pa-prepbot";
  root.innerHTML = `
    <div class="mm-prepbot-bubble mm-prepbot-bubble--speech mm-prepbot-bubble--hidden" id="paBotBubble" aria-hidden="true">
      <p id="paBotText"></p>
    </div>
    <div class="mm-prepbot-avatar-wrap">
      <div class="mm-prepbot-menu" id="paBotMenu">
        <button class="mm-prepbot-menu-btn" id="paBotAsk" type="button" title="Ask PrepBot a question" aria-label="Ask PrepBot a question"></button>
        <button class="mm-prepbot-menu-btn" id="paBotVoice" type="button" title="Beep or talking voice" aria-label="Toggle beep or talking voice"></button>
        <button class="mm-prepbot-menu-btn" id="paBotSleep" type="button" title="Sleep" aria-label="Sleep PrepBot"></button>
        <button class="mm-prepbot-menu-btn" id="paBotPoke" type="button" title="Wiggle" aria-label="Wiggle PrepBot"></button>
      </div>
      <div class="mm-prepbot-avatar" id="paBotAvatar" aria-hidden="true"></div>
    </div>`;
  document.body.appendChild(root);

  teacher = new PrepbotTeacher({
    root,
    boundsEl: document.body,
    auth,
    menu: {
      ask: root.querySelector("#paBotAsk"),
      voice: root.querySelector("#paBotVoice"),
      sleep: root.querySelector("#paBotSleep"),
      poke: root.querySelector("#paBotPoke"),
    },
  });

  /* GSAP only drives the idle impulses, so the bot is usable the moment it
     mounts and simply becomes livelier once this resolves. */
  import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
    .then((m) => { teacher.gsap = m.default || m.gsap || m; teacher.scheduleIdle(); })
    .catch(() => { /* no idle animation; everything else still works */ });

  /* The bubble starts hidden (the shared markup tucks it away for the menu),
     so anything that speaks has to bring it back first. */
  teacher.show();
  teacher.speak([{ text: `Drag a corner, or change the sides. ${teacher.keysLine()} Tell me what to show you, and I will do it.`, mode: "speech" }]);
  takeControl();
}

/* Say what the shape is once it settles. Called from script.js on any change
   to the polygon; it waits for the dragging to stop, and says nothing when the
   shape is the one it last mentioned. */
export function noteShape({ sides, interior, sum }) {
  if (!teacher || teacher.asleep) return;
  clearTimeout(settleTimer);
  if (Date.now() < quietUntil) { lastSpoken = `${sides}:${Math.round(interior)}`; return; }
  settleTimer = setTimeout(() => {
    const key = `${sides}:${Math.round(interior)}`;
    if (key === lastSpoken) return;
    lastSpoken = key;
    const name = NAMES[sides] || `${sides}-sided polygon`;
    teacher.show();
    teacher.speak([
      { text: `A ${name}: ${sides} sides, so the angles add to ${Math.round(sum)}°.`, mode: "speech" },
    ]);
  }, 900);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}

/* script.js is a classic script, so it can't import this module — the hook goes
   on window, the same way the page's other cross-script handles do. */
window.PolygonPrepbot = { noteShape };
