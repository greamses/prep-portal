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
      res.json({ archiveEnabled: !!(s.exists && s.data().archiveEnabled === true) });
    } catch (_) {
      res.json({ archiveEnabled: false });
    }
  });

  router.post("/", authenticate, requireAdmin, async (req, res) => {
    try {
      const archiveEnabled = !!(req.body && req.body.archiveEnabled);
      await ref().set(
        { archiveEnabled, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      res.json({ ok: true, archiveEnabled });
    } catch (e) {
      console.error("[/api/config POST]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
