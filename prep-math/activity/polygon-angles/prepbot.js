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
  teacher.speak([{ text: "Drag a corner, or change the sides. Tap me to ask anything.", mode: "speech" }]);
}

/* Say what the shape is once it settles. Called from script.js on any change
   to the polygon; it waits for the dragging to stop, and says nothing when the
   shape is the one it last mentioned. */
export function noteShape({ sides, interior, sum }) {
  if (!teacher || teacher.asleep) return;
  clearTimeout(settleTimer);
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
