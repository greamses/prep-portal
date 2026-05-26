/**
 * Admin-only routes (requires ADMIN_EMAIL match).
 *
 * POST /api/admin/sync-users  — sync Firebase Auth users to Firestore
 * GET  /api/admin/users       — list all users
 */

const express = require("express");
const { authenticate, requireAdmin } = require("../middleware/auth");

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

  return router;
};
