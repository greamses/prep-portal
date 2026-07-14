/**
 * Feature registry + access resolver — the ONE source of truth for gating.
 *
 * The admin Settings page (/admin/settings/) writes each feature's state to
 * config/site via POST /api/config; every gate on the site — client page guards,
 * inline gates AND the server routes (via server/lib/access.js, which imports
 * this same file) — resolves access through resolveAccess() below, so client and
 * server can never disagree on semantics.
 *
 * Each feature has one of three global states (WHO can use it):
 *   "off"     → hidden / blocked for everyone (including admins)
 *   "free"    → available to any signed-in user
 *   "premium" → available only to paying (isPremium) users  ← the default
 *
 * A feature may also declare `parts` (WHICH pieces are included) — boolean
 * sub-settings the admin can check all-or-some of (config/site.featureParts),
 * e.g. the individual games under "games-3d". An absent part entry = enabled.
 *
 * Per-user overrides live on users/{uid}.featureOverrides (admin-written only;
 * listed in firestore.rules protectedUserFields):
 *   { [featureId]: { access?: "grant"|"block", parts?: { [partId]: bool } } }
 * Resolution order: part-disabled → user block → user grant → global state.
 * A grant deliberately beats global "off" (private-beta: off for everyone,
 * granted to testers); a block beats everything, including global "free".
 *
 * ADDING A NEW FEATURE = one entry in FEATURES below. The admin Settings page,
 * the per-user override editor, /api/config validation and the server helper
 * all render/derive from this registry automatically. See docs/feature-flags.md.
 *
 * DEPENDENCY-FREE on purpose: no firebase, no bare import specifiers. That keeps
 * it safe to import from the self-contained premium-guard (which must not rely
 * on a host page's import map) and to dynamically import() from the CJS server.
 */

export const FEATURE_STATES = ["off", "free", "premium"];

// The catalogue of everything an admin can gate. `paths` lets the page-level
// premium-guard resolve which feature a URL belongs to; a part may carry its
// own `path` (e.g. each 3D game's folder) so a page can resolve to a sub-part.
// Inline-gated features (PrepBot, CBT written answers) have no paths and are
// looked up by id. `usesAiGenerate` marks features allowed to call
// POST /api/ai/generate (the server validates the claimed feature against it);
// `usesImageGen` does the same for POST /api/ai/image, which draws on
// Cloudflare's neuron allocation rather than the LLM token pool.
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
    usesAiGenerate: true,
  },
  {
    id: "writing",
    label: "Writing Trainer",
    desc: "Guided essay & composition coach",
    group: "Learning Labs",
    default: "premium",
    paths: ["/writing"],
    usesAiGenerate: true,
  },
  {
    id: "activities",
    label: "Activities",
    desc: "Teacher-authored interactive activities",
    group: "Learning Labs",
    default: "premium",
    paths: ["/activity.html"],
    usesAiGenerate: true,
    parts: [
      { id: "author", label: "Authoring (teachers create & edit)" },
      { id: "attempt", label: "Attempting (students open & submit)" },
    ],
  },
  {
    id: "flashcards",
    label: "AI Flashcards",
    desc: "AI-printed spaced-repetition flashcard decks",
    group: "Learning Labs",
    default: "premium",
    paths: ["/flashcards"],
    usesAiGenerate: true,
    usesImageGen: true, // card illustrations
  },
  {
    id: "prep-math-activities",
    label: "Prep-Math Activities",
    desc: "Interactive math studios (Cartesian Art, fractions, angles…)",
    group: "Learning Labs",
    default: "premium",
    paths: ["/prep-math/activity"],
    parts: [
      { id: "cartesian-art", label: "Cartesian Art", path: "/prep-math/activity/cartesian-art" },
      { id: "equivalent-fractions", label: "Equivalent Fractions", path: "/prep-math/activity/equivalent-fractions" },
      { id: "polygon-angles", label: "Polygon Angles", path: "/prep-math/activity/polygon-angles" },
      { id: "surface-area", label: "Surface Area", path: "/prep-math/activity/surface-area" },
      { id: "transversals", label: "Transversals", path: "/prep-math/activity/transversals" },
    ],
  },
  {
    id: "games-3d",
    label: "3D Games",
    desc: "Immersive 3D practice games (Bearing Courier, 3D Maze, Grand Chess, etc.)",
    group: "Games",
    default: "premium",
    paths: [],
    parts: [
      { id: "aliens", label: "Alien Invasion", path: "/home/games/aliens" },
      { id: "chess", label: "Grand Chess", path: "/home/games/chess" },
      { id: "free-throw", label: "Free Throw", path: "/home/games/free-throw" },
      { id: "drone", label: "Bearing Courier", path: "/home/games/drone" },
      { id: "maze", label: "3D Maze", path: "/home/games/maze" },
      { id: "rubiks-cube", label: "Speed Cube", path: "/home/games/rubiks-cube" },
    ],
  },
  {
    id: "prepbot",
    label: "PrepBot AI",
    desc: "AI study-assistant chat launcher",
    group: "AI Assistant",
    default: "premium",
    paths: [], // inline gate (prepbot.js) + server gate (/api/ai/chat, /api/tts)
    usesImageGen: true, // the avatar picker's "draw my character" tile
    parts: [
      { id: "chat", label: "Chat" },
      { id: "voice", label: "Voice (ElevenLabs read-aloud)" },
      { id: "images", label: "Character images (PrepBot draws your avatar)" },
    ],
  },
  {
    id: "cbt-written",
    label: "CBT Written Answers",
    desc: "Short-answer & theory questions inside CBT quizzes",
    group: "CBT",
    default: "premium",
    paths: [], // inline gate (quiz-engine.js)
    parts: [
      { id: "short", label: "Short answers" },
      { id: "theory", label: "Theory (long-form)" },
    ],
  },
  {
    id: "classroom",
    label: "Classroom",
    desc: "Teacher classes: create a class & students join with a code",
    group: "Classroom",
    default: "premium",
    paths: [], // server gate (/api/classroom)
  },
  {
    id: "calendar",
    label: "Calendar",
    desc: "Site events calendar (viewing; editing stays admin-only)",
    group: "Classroom",
    default: "free",
    paths: [], // server gate (/api/calendar)
  },
];

const BY_ID = Object.fromEntries(FEATURES.map((f) => [f.id, f]));

/** Built-in default state for every feature (used before/without a fetch). */
export function defaultStates() {
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.default]));
}

/**
 * Resolve which feature — and, when a part declares its own path, which part —
 * a pathname belongs to. Longest matching prefix wins across feature paths AND
 * part paths, so /home/games/maze beats nothing else and yields
 * { featureId: "games-3d", partId: "maze" }.
 */
export function featureAndPartForPath(pathname) {
  const p = String(pathname || "").toLowerCase();
  let best = { featureId: null, partId: null };
  let bestLen = -1;
  const consider = (pre, featureId, partId) => {
    const pl = String(pre).toLowerCase();
    if ((p === pl || p.startsWith(pl)) && pl.length > bestLen) {
      best = { featureId, partId };
      bestLen = pl.length;
    }
  };
  for (const f of FEATURES) {
    for (const pre of f.paths || []) consider(pre, f.id, null);
    for (const part of f.parts || []) {
      if (part.path) consider(part.path, f.id, part.id);
    }
  }
  return best;
}

/** Back-compat: just the feature id for a pathname (parts included). */
export function featureForPath(pathname) {
  return featureAndPartForPath(pathname).featureId;
}

/**
 * THE canonical access decision — pure data in, verdict out. Shared verbatim by
 * every client gate and by the server (server/lib/access.js), so the semantics
 * can never drift. All inputs are plain data; no I/O here.
 *
 * @param {object} q
 * @param {string}  q.featureId    registry feature id
 * @param {string}  [q.partId]     sub-part being used (omit for "the feature")
 * @param {string}  q.state        global "off"|"free"|"premium" for the feature
 * @param {object}  [q.globalParts]  config/site.featureParts[featureId]
 * @param {object}  [q.override]     users/{uid}.featureOverrides[featureId]
 * @param {boolean} q.isPremium    caller-computed (server treats ADMIN_EMAIL as premium)
 * @returns {{allowed: boolean, reason: string}}
 */
export function resolveAccess({ featureId, partId, state, globalParts, override, isPremium }) {
  void featureId; // part of the call signature for logging/symmetry; unused here
  // 1. Which parts apply: an override with a parts map defines them outright;
  //    a grant without parts means "all parts"; otherwise the global parts map
  //    (absent entry ⇒ enabled).
  const parts =
    override && override.parts ? override.parts
    : override && override.access === "grant" ? null // grant w/o parts = all
    : globalParts || null;
  if (partId && parts && parts[partId] === false) {
    return { allowed: false, reason: "part-disabled" };
  }
  // 2. Per-user block beats everything (incl. global free / grant).
  if (override && override.access === "block") {
    return { allowed: false, reason: "override-block" };
  }
  // 3. Per-user grant beats global state INCLUDING "off" — a deliberate, named
  //    exception the admin chose (enables private betas). Block already won above.
  if (override && override.access === "grant") {
    return { allowed: true, reason: "override-grant" };
  }
  // 4. Global three-state (unchanged semantics: off blocks admins too).
  if (state === "off") return { allowed: false, reason: "off" };
  if (state === "free") return { allowed: true, reason: "free" };
  return isPremium
    ? { allowed: true, reason: "premium" }
    : { allowed: false, reason: "premium-required" };
}

// Cache the admin's config briefly so navigating across gated pages / re-checking
// within a quiz doesn't hammer /api/config. A short TTL keeps a flag change from
// lingering. The verdict is not security-sensitive: the server enforces access
// on its own routes through the same registry.
let _cache = null;
let _cacheAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch the feature config: every feature's current state merged over the
 * built-in defaults, plus the global parts map. Fails OPEN to defaults (feature
 * stays at its default state, all parts enabled) so a config/network blip never
 * hard-blocks a page.
 * @returns {Promise<{states: object, parts: object}>}
 */
export async function fetchFeatureConfig(apiBase = "") {
  if (_cache && Date.now() - _cacheAt < TTL) return _cache;
  const merged = { states: defaultStates(), parts: {} };
  try {
    const r = await fetch(`${apiBase}/api/config`, { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      const f = (d && d.features) || {};
      for (const k in f) {
        if (k in merged.states && FEATURE_STATES.includes(f[k])) merged.states[k] = f[k];
      }
      const fp = (d && d.featureParts) || {};
      for (const k in fp) {
        if (k in BY_ID && fp[k] && typeof fp[k] === "object") merged.parts[k] = fp[k];
      }
      _cache = merged;
      _cacheAt = Date.now();
    }
  } catch (_) {
    /* fail open to defaults */
  }
  return merged;
}

/** Back-compat: map of featureId → state. */
export async function fetchFeatureStates(apiBase = "") {
  return (await fetchFeatureConfig(apiBase)).states;
}

/** State for a single feature id ("off" | "free" | "premium"). */
export async function getFeatureState(id, apiBase = "") {
  const states = await fetchFeatureStates(apiBase);
  return states[id] || (BY_ID[id] && BY_ID[id].default) || "premium";
}

/**
 * Convenience for client gates: resolve a feature/part for a user profile in
 * one call. `profile` is the users/{uid} doc data (or null) — supplies both
 * isPremium and featureOverrides.
 */
export async function resolveUserAccess({ featureId, partId, profile, apiBase = "" }) {
  const cfg = await fetchFeatureConfig(apiBase);
  const state = cfg.states[featureId] || (BY_ID[featureId] && BY_ID[featureId].default) || "premium";
  return resolveAccess({
    featureId,
    partId,
    state,
    globalParts: cfg.parts[featureId],
    override: profile && profile.featureOverrides && profile.featureOverrides[featureId],
    isPremium: !!(profile && profile.isPremium),
  });
}
