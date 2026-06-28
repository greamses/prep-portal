/**
 * usage route — exposes today's Firestore tally so the browser data-service can
 * check the caps before issuing reads/writes, and report its own usage.
 *
 *   GET  /api/usage          → { reads, writes, readCap, writeCap, readsBlocked, writesBlocked }
 *   POST /api/usage/record   → { reads, writes }  (browser-reported, clamped)
 */
const express = require("express");
const quota = require("../lib/quota");

module.exports = function () {
  const router = express.Router();

  router.get("/", async (_req, res) => {
    try {
      res.json(await quota.status());
    } catch (e) {
      res.json({ reads: 0, writes: 0, readCap: quota.READ_CAP, writeCap: quota.WRITE_CAP, readsBlocked: false, writesBlocked: false });
    }
  });

  router.post("/record", (req, res) => {
    const b = req.body || {};
    const reads = Math.max(0, Math.min(2000, parseInt(b.reads, 10) || 0));
    const writes = Math.max(0, Math.min(2000, parseInt(b.writes, 10) || 0));
    quota.addReads(reads);
    quota.addWrites(writes);
    res.json({ ok: true });
  });

  return router;
};
