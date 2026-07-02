/**
 * Site config — small admin-controlled flags read by the client.
 *
 *   GET  /api/config                          → flags + { features }   (public)
 *   POST /api/config { archiveEnabled, ... }   → set them               (admin only)
 *
 * `archiveEnabled` gates the verbatim past-paper archive. It DEFAULTS TO FALSE
 * (off) when unset, so the archive stays disabled until an admin turns it on.
 *
 * `features` is a map of featureId → "off" | "free" | "premium", set from the
 * admin Settings page. Only overrides are stored here; the client applies its own
 * built-in defaults (utils/features.js) for any feature the admin never touched.
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate, requireAdmin } = require("../middleware/auth");

const FEATURE_STATES = ["off", "free", "premium"];

module.exports = function () {
  const router = express.Router();
  const ref = () => admin.firestore().collection("config").doc("site");

  router.get("/", async (_req, res) => {
    try {
      const s = await ref().get();
      const d = s.exists ? s.data() : {};
      res.json({
        archiveEnabled: d.archiveEnabled === true,
        hideOriginals: d.hideOriginals === true,
        features: d.features && typeof d.features === "object" ? d.features : {},
      });
    } catch (_) {
      res.json({ archiveEnabled: false, hideOriginals: false, features: {} });
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
      await ref().set(patch, { merge: true });
      const s = await ref().get();
      const d = s.data() || {};
      res.json({
        ok: true,
        archiveEnabled: d.archiveEnabled === true,
        hideOriginals: d.hideOriginals === true,
        features: d.features && typeof d.features === "object" ? d.features : {},
      });
    } catch (e) {
      console.error("[/api/config POST]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
