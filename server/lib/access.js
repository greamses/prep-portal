/**
 * Server-side feature access — the authoritative enforcement layer.
 *
 * Routes never check isPremium ad-hoc anymore; they ask this module:
 *
 *   const access = require("../lib/access");
 *   const v = await access.canUse(req, "theory");            // {allowed, reason}
 *   router.post("/x", authenticate, access.requireFeature("activities", "author"), …)
 *
 * The registry AND the resolution algorithm live in /utils/features.js — the
 * same dependency-free ES module the browser gates import — loaded here once
 * via dynamic import() so client and server semantics can never drift.
 * (vercel.json includeFiles must list utils/features.js: nft cannot trace a
 * computed dynamic import.)
 *
 * Resolution order (see resolveAccess in utils/features.js):
 *   part-disabled → per-user block → per-user grant → global off/free/premium
 *
 * Inputs:
 *   • config/site  { features, featureParts, aiQuota }  — cached 60 s
 *   • users/{uid}  { isPremium, featureOverrides }       — cached 5 min per uid
 *   • ADMIN_EMAIL ⇒ treated as premium (same bypass ai.js always had; a global
 *     "off" still blocks admins by design)
 *
 * Failure policy: config read errors fail OPEN to registry defaults (a
 * Firestore blip must not take the site down); user reads fail CLOSED to the
 * last cached verdict, then to "not premium" — the server is the real gate.
 */

const admin = require("firebase-admin");
const path = require("path");
const { pathToFileURL } = require("url");

// ── shared registry (browser ESM, loaded once) ─────────────────────────────
let _registryPromise = null;
function registry() {
  if (!_registryPromise) {
    const file = path.join(__dirname, "..", "..", "utils", "features.js");
    _registryPromise = import(pathToFileURL(file).href);
  }
  return _registryPromise;
}

// ── config/site cache (60 s) ───────────────────────────────────────────────
const CONFIG_TTL_MS = 60 * 1000;
let _config = null; // { states, parts, aiQuota }
let _configAt = 0;

const AI_QUOTA_DEFAULTS = { windowTokens: 10000, monthTokens: 300000 };

async function getSiteConfig() {
  if (_config && Date.now() - _configAt < CONFIG_TTL_MS) return _config;
  const reg = await registry();
  const merged = { states: reg.defaultStates(), parts: {}, aiQuota: { ...AI_QUOTA_DEFAULTS } };
  try {
    const snap = await admin.firestore().collection("config").doc("site").get();
    const d = (snap.exists && snap.data()) || {};
    const f = d.features || {};
    for (const k in f) {
      if (k in merged.states && reg.FEATURE_STATES.includes(f[k])) merged.states[k] = f[k];
    }
    if (d.featureParts && typeof d.featureParts === "object") merged.parts = d.featureParts;
    if (d.aiQuota && typeof d.aiQuota === "object") {
      const w = Number(d.aiQuota.windowTokens);
      const m = Number(d.aiQuota.monthTokens);
      if (Number.isFinite(w) && w > 0) merged.aiQuota.windowTokens = w;
      if (Number.isFinite(m) && m > 0) merged.aiQuota.monthTokens = m;
    }
    _config = merged;
    _configAt = Date.now();
  } catch (_) {
    /* fail open to registry defaults; don't cache the failure */
  }
  return merged;
}

// ── per-user entitlement cache (5 min) ─────────────────────────────────────
const USER_TTL_MS = 5 * 60 * 1000;
const userCache = new Map(); // uid -> { value: {isPremium, overrides}, exp }

async function getUserAccess(uid, email) {
  if (email && email === process.env.ADMIN_EMAIL) {
    return { isPremium: true, overrides: {} };
  }
  if (!uid) return { isPremium: false, overrides: {} };
  const hit = userCache.get(uid);
  if (hit && hit.exp > Date.now()) return hit.value;
  try {
    const snap = await admin.firestore().collection("users").doc(uid).get();
    const d = (snap.exists && snap.data()) || {};
    const value = {
      isPremium: !!d.isPremium,
      overrides: d.featureOverrides && typeof d.featureOverrides === "object" ? d.featureOverrides : {},
    };
    userCache.set(uid, { value, exp: Date.now() + USER_TTL_MS });
    return value;
  } catch (_) {
    return hit ? hit.value : { isPremium: false, overrides: {} }; // fail closed
  }
}

// ── the one question routes ask ────────────────────────────────────────────
/** @returns {Promise<{allowed:boolean, reason:string}>} */
async function canUse(req, featureId, partId) {
  const [reg, cfg, user] = await Promise.all([
    registry(),
    getSiteConfig(),
    getUserAccess(req.user && req.user.uid, req.user && req.user.email),
  ]);
  const known = reg.FEATURES.some((f) => f.id === featureId);
  const state = known ? cfg.states[featureId] : "premium"; // unknown id: safest gate
  return reg.resolveAccess({
    featureId,
    partId,
    state,
    globalParts: cfg.parts[featureId],
    override: user.overrides[featureId],
    isPremium: user.isPremium,
  });
}

/**
 * Express middleware form. Denials:
 *   off / override-block / part-disabled → 403 {error:"feature_disabled", reason}
 *   premium-required                     → 402 {error:"premium_required", premiumRequired:true}
 * (402 shape matches what clients already handle from the old isPremium gates.)
 */
function requireFeature(featureId, partId) {
  return async (req, res, next) => {
    try {
      const v = await canUse(req, featureId, partId);
      if (v.allowed) return next();
      if (v.reason === "premium-required") {
        return res.status(402).json({
          error: "premium_required",
          premiumRequired: true,
          text: "This is a premium feature. Upgrade your plan at /subscribe.html to use it.",
        });
      }
      return res.status(403).json({ error: "feature_disabled", reason: v.reason });
    } catch (e) {
      console.error("[access.requireFeature]", featureId, e.message);
      // Resolution itself blew up (not a Firestore read — those are handled
      // above). Deny premium-default features rather than silently opening.
      return res.status(503).json({ error: "access_check_failed" });
    }
  };
}

/** Admin-editable AI token allocations (window = rolling 5 h). */
async function getAiQuota() {
  return (await getSiteConfig()).aiQuota;
}

/** Validate a POSTed featureParts patch against the registry. Returns clean map or null. */
async function cleanFeatureParts(input) {
  if (!input || typeof input !== "object") return null;
  const reg = await registry();
  const byId = Object.fromEntries(reg.FEATURES.map((f) => [f.id, f]));
  const clean = {};
  for (const [fid, parts] of Object.entries(input)) {
    const feature = byId[fid];
    if (!feature || !feature.parts || !parts || typeof parts !== "object") continue;
    const validParts = new Set(feature.parts.map((p) => p.id));
    const cp = {};
    for (const [pid, on] of Object.entries(parts)) {
      if (validParts.has(pid) && typeof on === "boolean") cp[pid] = on;
    }
    if (Object.keys(cp).length) clean[fid] = cp;
  }
  return Object.keys(clean).length ? clean : null;
}

/** Drop caches (used by /api/config POST so admin edits apply immediately on this instance). */
function invalidateConfigCache() {
  _config = null;
  _configAt = 0;
}

module.exports = {
  registry,
  getSiteConfig,
  getUserAccess,
  canUse,
  requireFeature,
  getAiQuota,
  cleanFeatureParts,
  invalidateConfigCache,
};
