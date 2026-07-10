// hub.js — games listing page (home/games/index.html).
// Renders the 2D/3D game grid with the same receipt-card system as the blogs.
import { GAMES } from "/home/games/games-data.js";
import { featureAndPartForPath, fetchFeatureConfig, defaultStates } from "/utils/features.js";

const I = {
  controller: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"></path><path d="M7 8h10a5 5 0 0 1 5 5.5 3 3 0 0 1-5.4 1.8L15 13H9l-1.6 2.3A3 3 0 0 1 2 13.5 5 5 0 0 1 7 8z"></path></svg>`,
  cube: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:11px;height:11px;flex-shrink:0"><path d="M12 2.5l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 8.7l5.9-.9z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;flex-shrink:0"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  arrow: `<svg style="width:13px;height:13px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
};

const grid = document.getElementById("gamesGrid");
const tabs = document.querySelectorAll(".games-tab");
const heading = document.getElementById("gamesHeading");

// Live feature config (games-3d state + per-game part checkboxes) so the
// badges/locks reflect what the admin actually set, not the static `premium`
// field. Starts at registry defaults; refreshed async before first paint below.
let featureCfg = { states: defaultStates(), parts: {} };

// How the admin's settings apply to one game card:
//   "unavailable" (feature off / game unchecked) | "free" | "premium"
function gameAccess(game) {
  const { featureId, partId } = featureAndPartForPath(new URL(game.href, location.href).pathname);
  if (!featureId) return "free"; // unregistered (2D games) — no gate, no pill
  const state = featureCfg.states[featureId] || "premium";
  const parts = featureCfg.parts[featureId];
  if (state === "off" || (partId && parts && parts[partId] === false)) return "unavailable";
  return state === "free" ? "free" : "premium";
}

function renderCard(game, idx) {
  const colorIdx = idx % 6;
  const access = gameAccess(game);
  const locked = !game.ready || access === "unavailable";
  const tag = locked ? "div" : "a";
  const hrefAttr = locked ? "" : ` href="${game.href}"`;
  const badge = !game.ready
    ? `<span class="pp-pill pp-pill--static">${I.lock}<span>Coming Soon</span></span>`
    : access === "unavailable"
      ? `<span class="pp-pill pp-pill--static">${I.lock}<span>Unavailable</span></span>`
      : access === "premium"
        ? `<span class="pp-pill pp-pill--static theme-yellow">${I.star}<span>Premium</span></span>`
        : "";

  return `
    <${tag} class="science-card pp-receipt science-card--p${colorIdx}${locked ? " is-locked" : ""}"${hrefAttr}>
      <div class="card-inner pp-receipt__paper">
        ${game.image ? `<img class="card-featured-img" src="${game.image}" alt="${game.title}" loading="lazy" onerror="this.remove()">` : ""}
        <div class="card-badges">
          <span class="pp-sticky pp-sticky--c${colorIdx}">${game.category}</span>
          ${badge}
        </div>
        <div class="card-meta">
          <span>${I.controller} Solo player</span>
          <span>${I.cube} ${game.type === "3d" ? "3D" : "2D"}</span>
        </div>
        <h2 class="card-title">${game.title}</h2>
        <p class="card-excerpt">${game.desc}</p>
        <div class="read-more">${!game.ready ? "Coming soon" : locked ? "Unavailable" : `Play now ${I.arrow}`}</div>
      </div>
    </${tag}>`;
}

function render(type) {
  const games = GAMES.filter((g) => g.type === type);
  grid.innerHTML = games.map(renderCard).join("");
  heading.textContent = type === "3d" ? "3D Games" : "2D Games";
  tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.type === type));
}

function currentType() {
  const t = new URLSearchParams(location.search).get("type");
  return t === "3d" ? "3d" : "2d";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const type = tab.dataset.type;
    history.replaceState(null, "", `?type=${type}`);
    render(type);
  });
});

render(currentType());

// Refresh badges once the live admin config arrives (5-min cached; fail-open
// to defaults, so a config blip just leaves the built-in badges in place).
fetchFeatureConfig().then((cfg) => {
  featureCfg = cfg;
  render(currentType());
}).catch(() => {});
