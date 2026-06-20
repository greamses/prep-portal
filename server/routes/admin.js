/**
 * Admin-only routes (requires ADMIN_EMAIL match).
 *
 * POST /api/admin/sync-users  — sync Firebase Auth users to Firestore
 * GET  /api/admin/users       — list all users
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate, requireAdmin } = require("../middleware/auth");

// A short, human-friendly redeem code: school initials + 4 unambiguous chars.
function makeCode(name) {
  const alnum = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const initials = String(name || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "PREP";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += alnum[Math.floor(Math.random() * alnum.length)];
  return initials + suffix;
}

module.exports = function (db, auth) {
  const router = express.Router();

  router.use(authenticate, requireAdmin);

  // Sync Firebase Auth users into Firestore
  router.post("/sync-users", async (req, res) => {
    try {
      const listResult = await auth.listUsers();
      const writes = [];

      for (const user of listResult.users) {
        const ref = db.collection("users").doc(user.uid);
        const snap = await ref.get();
        if (!snap.exists) {
          writes.push(
            ref.set({
              email: user.email,
              name: user.displayName || user.email.split("@")[0],
              role: "student",
              isPremium: false,
              createdAt: user.metadata.creationTime || new Date().toISOString(),
            })
          );
        }
      }

      await Promise.all(writes);
      res.json({ success: true, created: writes.length });
    } catch (err) {
      console.error("[/api/admin/sync-users]", err.message);
      res.status(500).json({ error: "Failed to sync users." });
    }
  });

  // List all Firestore users
  router.get("/users", async (req, res) => {
    try {
      const snap = await db.collection("users").get();
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json(users);
    } catch (err) {
      console.error("[/api/admin/users]", err.message);
      res.status(500).json({ error: "Failed to retrieve users." });
    }
  });

  // ── Partner program (Phase 2) ───────────────────────────────
  // Create a partner (school) + a unique redeem code (admin-onboarded only).
  router.post("/partners", async (req, res) => {
    try {
      const schoolName = String((req.body && req.body.schoolName) || "").trim();
      const contactEmail = String((req.body && req.body.contactEmail) || "").trim();
      if (!schoolName) return res.status(400).json({ error: "schoolName required" });

      let code;
      for (let i = 0; i < 6; i++) {
        const c = makeCode(schoolName);
        if (!(await db.collection("referralCodes").doc(c).get()).exists) { code = c; break; }
      }
      if (!code) return res.status(500).json({ error: "Could not generate a unique code — try again." });

      const partnerRef = db.collection("partners").doc();
      const ts = admin.firestore.FieldValue.serverTimestamp();
      const batch = db.batch();
      batch.set(partnerRef, {
        schoolName, contactEmail: contactEmail || null, code,
        balanceKobo: 0, lifetimeKobo: 0,
        createdBy: req.user.email || req.user.uid, createdAt: ts,
      });
      batch.set(db.collection("referralCodes").doc(code), {
        partnerId: partnerRef.id, schoolName, createdAt: ts,
      });
      await batch.commit();
      res.json({ ok: true, id: partnerRef.id, code });
    } catch (err) {
      console.error("[/api/admin/partners POST]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // List partners with their running balances.
  router.get("/partners", async (req, res) => {
    try {
      const snap = await db.collection("partners").get();
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.lifetimeKobo || 0) - (a.lifetimeKobo || 0));
      res.json(rows);
    } catch (err) {
      console.error("[/api/admin/partners GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // A partner's earnings ledger (newest first).
  router.get("/partners/:id/earnings", async (req, res) => {
    try {
      const snap = await db.collection("earnings").where("partnerId", "==", req.params.id).get();
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      res.json(rows);
    } catch (err) {
      console.error("[/api/admin/partners earnings]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
