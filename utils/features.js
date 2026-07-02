/**
 * Feature registry + admin-controlled state resolver.
 *
 * ONE source of truth for the app's toggleable features. The admin Settings page
 * (/admin/settings/index.html) writes each feature's state to config/site.features
 * via POST /api/config; every gate on the site reads it back through here.
 *
 * Each feature has one of three states:
 *   "off"     → hidden / blocked for everyone (including admins)
 *   "free"    → available to any signed-in user
 *   "premium" → available only to paying (isPremium) users  ← the default
 *
 * DEPENDENCY-FREE on purpose: no firebase, no bare import specifiers. That keeps
 * it safe to import from the self-contained premium-guard (which must not rely on
 * a host page's import map) and from anywhere else.
 */

export const FEATURE_STATES = ["off", "free", "premium"];

// The catalogue of everything an admin can gate. `paths` lets the page-level
// premium-guard resolve which feature a URL belongs to; inline-gated features
// (PrepBot, CBT written answers) have no paths and are looked up by id.
export const FEATURES = [
  {
    id: "virtual-lab",
    label: "Virtual Lab",
    desc: "3D chemistry, physics & biology simulations",
    group: "Learning Labs",
    default: "premium",
    paths: ["/virtual-lab"],
  },
  {
    id: "theory",
    label: "Theory Practice",
    desc: "AI-graded long-form theory answers",
    group: "Learning Labs",
    default: "premium",
    paths: ["/theory-page"],
  },
  {
    id: "writing",
    label: "Writing Trainer",
    desc: "Guided essay & composition coach",
    group: "Learning Labs",
    default: "premium",
    paths: ["/writing"],
  },
  {
    id: "activities",
    label: "Activities",
    desc: "Teacher-authored interactive activities",
    group: "Learning Labs",
    default: "premium",
    paths: ["/activity.html"],
  },
  {
    id: "prepbot",
    label: "PrepBot AI",
    desc: "AI study-assistant chat launcher",
    group: "AI Assistant",
    default: "premium",
    paths: [], // inline gate (prepbot.js)
  },
  {
    id: "cbt-written",
    label: "CBT Written Answers",
    desc: "Short-answer & theory questions inside CBT quizzes",
    group: "CBT",
    default: "premium",
    paths: [], // inline gate (quiz-engine.js)
  },
];

const BY_ID = Object.fromEntries(FEATURES.map((f) => [f.id, f]));

/** Built-in default state for every feature (used before/without a fetch). */
export function defaultStates() {
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.default]));
}

/** Resolve which feature a pathname belongs to (longest matching prefix wins). */
export function featureForPath(pathname) {
  const p = String(pathname || "").toLowerCase();
  let best = null;
  let bestLen = -1;
  for (const f of FEATURES) {
    for (const pre of f.paths || []) {
      const pl = pre.toLowerCase();
      if ((p === pl || p.startsWith(pl)) && pl.length > bestLen) {
        best = f.id;
        bestLen = pl.length;
      }
    }
  }
  return best;
}

// Cache the admin's config briefly so navigating across gated pages / re-checking
// within a quiz doesn't hammer /api/config. A short TTL keeps a flag change from
// lingering. The verdict is not security-sensitive: the server still enforces
// premium on the AI endpoints and archive.
let _cache = null;
let _cacheAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch every feature's current state, merged over the built-in defaults.
 * Fails OPEN to defaults (feature stays at its default state) so a config/network
 * blip never hard-blocks a page.
 */
export async function fetchFeatureStates(apiBase = "") {
  if (_cache && Date.now() - _cacheAt < TTL) return _cache;
  const merged = defaultStates();
  try {
    const r = await fetch(`${apiBase}/api/config`, { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      const f = (d && d.features) || {};
      for (const k in f) {
        if (k in merged && FEATURE_STATES.includes(f[k])) merged[k] = f[k];
      }
      _cache = merged;
      _cacheAt = Date.now();
    }
  } catch (_) {
    /* fail open to defaults */
  }
  return merged;
}

/** State for a single feature id ("off" | "free" | "premium"). */
export async function getFeatureState(id, apiBase = "") {
  const states = await fetchFeatureStates(apiBase);
  return states[id] || (BY_ID[id] && BY_ID[id].default) || "premium";
}
