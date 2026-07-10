/**
 * Site config — small admin-controlled flags read by the client.
 *
 *   GET  /api/config                          → flags + { features, featureParts, aiQuota }  (public)
 *   POST /api/config { archiveEnabled, ... }   → set them                                     (admin only)
 *
 * `archiveEnabled` gates the verbatim past-paper archive. It DEFAULTS TO FALSE
 * (off) when unset, so the archive stays disabled until an admin turns it on.
 *
 * `features` is a map of featureId → "off" | "free" | "premium", set from the
 * admin Settings page. Only overrides are stored here; the client applies its own
 * built-in defaults (utils/features.js) for any feature the admin never touched.
 *
 * `featureParts` is featureId → { partId: bool } — the "check all or some"
 * sub-settings under a feature (e.g. individual 3D games). Absent = enabled.
 * Ids are validated against the shared registry so a typo can't silently no-op.
 *
 * `aiQuota` is { windowTokens, monthTokens } — the admin-editable AI token
 * allocations consumed by server/routes/ai.js usage tracking.
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate, requireAdmin } = require("../middleware/auth");
const access = require("../lib/access");

const FEATURE_STATES = ["off", "free", "premium"];
const QUOTA_MAX = 10000000; // sanity clamp on admin-entered token counts

module.exports = function () {
  const router = express.Router();
  const ref = () => admin.firestore().collection("config").doc("site");

  const shape = (d) => ({
    archiveEnabled: d.archiveEnabled === true,
    hideOriginals: d.hideOriginals === true,
    features: d.features && typeof d.features === "object" ? d.features : {},
    featureParts: d.featureParts && typeof d.featureParts === "object" ? d.featureParts : {},
    aiQuota: d.aiQuota && typeof d.aiQuota === "object" ? d.aiQuota : {},
  });

  router.get("/", async (_req, res) => {
    try {
      const s = await ref().get();
      res.json(shape(s.exists ? s.data() : {}));
    } catch (_) {
      res.json(shape({}));
    }
  });

  // Set any provided flag(s); only the keys present in the body are changed.
  router.post("/", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      const patch = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      if ("archiveEnabled" in b) patch.archiveEnabled = !!b.archiveEnabled;
      if ("hideOriginals" in b) patch.hideOriginals = !!b.hideOriginals;
      // Feature states: keep only valid "off"|"free"|"premium" entries. set()
      // with merge deep-merges this map, so untouched features are preserved.
      if (b.features && typeof b.features === "object") {
        const clean = {};
        for (const [id, state] of Object.entries(b.features)) {
          if (FEATURE_STATES.includes(state)) clean[id] = state;
        }
        if (Object.keys(clean).length) patch.features = clean;
      }
      // Sub-part checkboxes: registry-validated (unknown feature/part ids and
      // non-boolean values are dropped) — deep-merged like features.
      const parts = await access.cleanFeatureParts(b.featureParts);
      if (parts) patch.featureParts = parts;
      // AI quota: positive clamped integers only; partial patches fine.
      if (b.aiQuota && typeof b.aiQuota === "object") {
        const q = {};
        for (const k of ["windowTokens", "monthTokens"]) {
          const n = Math.floor(Number(b.aiQuota[k]));
          if (Number.isFinite(n) && n > 0) q[k] = Math.min(n, QUOTA_MAX);
        }
        if (Object.keys(q).length) patch.aiQuota = q;
      }
      await ref().set(patch, { merge: true });
      access.invalidateConfigCache(); // this instance serves the change immediately
      const s = await ref().get();
      res.json({ ok: true, ...shape(s.data() || {}) });
    } catch (e) {
      console.error("[/api/config POST]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
