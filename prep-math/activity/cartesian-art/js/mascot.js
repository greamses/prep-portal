/* ============================================================================
   Cartesian Art — the mascot
   ----------------------------------------------------------------------------
   "Plotsy" — a little marker-pin character whose pointed tip sits exactly on
   the current lattice point, so kids can see which coordinate they're on. Our
   own inline SVG (no emoji). Glides between points via a CSS transform
   transition; size is fixed in pixels so it never scales oddly with the grid.
   ========================================================================== */

import { state, subscribe } from "./state.js";
import { layers, toPx, onRender } from "./grid.js";

const SVGNS = "http://www.w3.org/2000/svg";

/* Group-local geometry: the tip is at (0,0); the bulb floats above it. */
const MARKUP = `
  <ellipse class="cam-shadow" cx="0" cy="2" rx="9" ry="3.2"></ellipse>
  <g class="cam-body">
    <path class="cam-pin" d="M0 0 C -6 -10 -16 -16 -16 -28 a16 16 0 1 1 32 0 C 16 -16 6 -10 0 0 Z"></path>
    <circle class="cam-cheek" cx="-7.5" cy="-25" r="3"></circle>
    <circle class="cam-cheek" cx="7.5" cy="-25" r="3"></circle>
    <circle class="cam-eye-white" cx="-5.2" cy="-31" r="3.4"></circle>
    <circle class="cam-eye-white" cx="5.2" cy="-31" r="3.4"></circle>
    <circle class="cam-eye" cx="-4.3" cy="-30.6" r="1.7"></circle>
    <circle class="cam-eye" cx="6.1" cy="-30.6" r="1.7"></circle>
    <path class="cam-smile" d="M-4.5 -25 Q 0 -21.5 4.5 -25"></path>
  </g>
`;

let g = null;

function position() {
  if (!g) return;
  const p = toPx(state.cursor.x, state.cursor.y);
  g.style.transform = `translate(${p.x}px, ${p.y}px)`;
}

/** Play a little squash when the mascot lands on a new point. */
function bounce() {
  if (!g) return;
  const body = g.querySelector(".cam-body");
  if (!body) return;
  body.classList.remove("cam-hop");
  // force reflow so the animation restarts
  void body.getBoundingClientRect();
  body.classList.add("cam-hop");
}

export function initMascot() {
  g = document.createElementNS(SVGNS, "g");
  g.setAttribute("class", "ca-mascot");
  g.innerHTML = MARKUP;
  layers.mascot.appendChild(g);

  position();
  subscribe((reason) => {
    if (reason === "cursor") {
      position();
      bounce();
    } else if (reason === "grid") {
      position();
    }
  });
  onRender(position);
}
