// hub.js — games listing page (home/games/index.html).
// Renders the 2D/3D game grid with the same receipt-card system as the blogs.
import { GAMES } from "/home/games/games-data.js";
import { featureAndPartForPath, fetchFeatureConfig, defaultStates } from "/utils/features.js";

const I = {
  controller: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="meta-icon"><path d="M7.5 7.5h9a4.7 4.7 0 0 1 4.6 3.8l.7 3.7A2.5 2.5 0 0 1 17 16.6L15.8 15H8.2L7 16.6A2.5 2.5 0 0 1 2.2 15l.7-3.7A4.7 4.7 0 0 1 7.5 7.5z" fill="var(--accent-secondary)"/><rect x="4.9" y="10.7" width="1.6" height="4" rx="0.8" fill="#fff"/><rect x="3.7" y="11.9" width="4" height="1.6" rx="0.8" fill="#fff"/><circle cx="16.2" cy="11.6" r="1.2" fill="var(--accent-danger)"/><circle cx="18.5" cy="13" r="1.2" fill="var(--accent-primary)"/><circle cx="14.4" cy="13" r="1.2" fill="#fff"/></svg>`,
  cube: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="meta-icon"><path d="M12 12.6 20.8 7.8V16L12 20.8z" fill="var(--accent-warning)"/><path d="M12 12.6 3.2 7.8V16L12 20.8z" fill="var(--accent-secondary)"/><path d="M12 3.2 20.8 7.8 12 12.6 3.2 7.8z" fill="var(--accent-primary)"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:11px;height:11px;flex-shrink:0"><path d="M12 2.5l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 8.7l5.9-.9z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:11px;height:11px;flex-shrink:0"><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none" stroke="var(--text-tertiary)" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="10.5" width="16" height="10.4" rx="2.6" fill="var(--accent-primary)"/><circle cx="12" cy="15" r="1.7" fill="#fff"/><rect x="11.2" y="15.6" width="1.6" height="2.6" rx="0.8" fill="#fff"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>`,
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
