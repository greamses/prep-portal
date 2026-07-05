// hub.js — Mental Math landing page (prep-math/mental-math/index.html).
// Renders the ready-trick cards from tricks-data.js.
import { getReadyTricks } from "/prep-math/mental-math/tricks-data.js";

const SYSTEM_LABEL = {
  vedic: "Vedic",
  trachtenberg: "Trachtenberg",
  blend: "Vedic + Trachtenberg",
};

function renderCard(trick, idx) {
  const colorIdx = idx % 6;
  return `
    <a class="mm-card pp-receipt" href="${trick.href}">
      <div class="pp-receipt__paper">
        <span class="pp-sticky pp-sticky--c${colorIdx}">${SYSTEM_LABEL[trick.system] ?? trick.system}</span>
        <h2 class="mm-card-title">${trick.title}</h2>
        <p class="mm-card-summary">${trick.summary}</p>
        <div class="mm-card-cta">Learn it →</div>
      </div>
    </a>`;
}

const grid = document.getElementById("mmGrid");
grid.innerHTML = getReadyTricks().map(renderCard).join("");
