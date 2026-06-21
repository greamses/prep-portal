/**
 * Site config — small admin-controlled flags read by the client.
 *
 *   GET  /api/config                 → { archiveEnabled }   (public)
 *   POST /api/config { archiveEnabled } → set it             (admin only)
 *
 * `archiveEnabled` gates the verbatim past-paper archive. It DEFAULTS TO FALSE
 * (off) when unset, so the archive stays disabled until an admin turns it on.
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate, requireAdmin } = require("../middleware/auth");

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
      });
    } catch (_) {
      res.json({ archiveEnabled: false, hideOriginals: false });
    }
  });

  // Set any provided flag(s); only the keys present in the body are changed.
  router.post("/", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      const patch = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      if ("archiveEnabled" in b) patch.archiveEnabled = !!b.archiveEnabled;
      if ("hideOriginals" in b) patch.hideOriginals = !!b.hideOriginals;
      await ref().set(patch, { merge: true });
      const s = await ref().get();
      const d = s.data() || {};
      res.json({ ok: true, archiveEnabled: d.archiveEnabled === true, hideOriginals: d.hideOriginals === true });
    } catch (e) {
      console.error("[/api/config POST]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
