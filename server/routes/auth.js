/**
 * Auth session routes — turn a Firebase ID token into an httpOnly session
 * cookie that the Vercel middleware can verify on every page request.
 *
 *   POST   /api/auth/session  { idToken }  → sets __session cookie
 *   DELETE /api/auth/session               → clears it (logout)
 *   POST   /api/auth/logout                → clears it (sendBeacon-friendly)
 *
 * The session cookie is the server-side source of truth for "is this person
 * signed in", so access control no longer depends on client JS.
 */

const express = require("express");
const admin = require("firebase-admin");

// Firebase session cookies may live 5 min – 14 days; use 5 days.
const SESSION_MS = 5 * 24 * 60 * 60 * 1000;

module.exports = function () {
  const router = express.Router();

  const cookieOpts = (req) => ({
    maxAge: SESSION_MS,
    httpOnly: true,
    // Secure in production (https); relaxed for local http testing.
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    sameSite: "lax",
    path: "/",
  });

  router.post("/session", async (req, res) => {
    try {
      const { idToken } = req.body || {};
      if (!idToken) return res.status(400).json({ error: "idToken required" });
      // Verify the ID token (rejects expired/forged) before minting a cookie.
      const decoded = await admin.auth().verifyIdToken(idToken);
      // Grant the admin an `admin:true` custom claim so Firestore rules can
      // recognise admin writes (dashboard role/plan edits, money collections)
      // without hardcoding the email in the rules. Takes effect on next token
      // refresh — so an admin should sign out/in once after this ships.
      if (decoded.email && decoded.email === process.env.ADMIN_EMAIL && decoded.admin !== true) {
        try { await admin.auth().setCustomUserClaims(decoded.uid, { admin: true }); } catch (_) {}
      }
      const sessionCookie = await admin
        .auth()
        .createSessionCookie(idToken, { expiresIn: SESSION_MS });
      res.cookie("__session", sessionCookie, cookieOpts(req));
      res.json({ ok: true });
    } catch (err) {
      console.error("[/api/auth/session]", err.message);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  });

  const clear = (req, res) => {
    res.clearCookie("__session", { path: "/" });
    res.json({ ok: true });
  };
  router.delete("/session", clear);
  router.post("/logout", clear);

  return router;
};
