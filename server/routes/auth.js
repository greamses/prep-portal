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

  /* ══ A STUDENT WITH NO EMAIL ADDRESS ═══════════════════════════════════════
     Signs up with a USERNAME and their TEACHER'S CODE. The account's login is <username>@prepportal.com (it is
     never written to: notify-out.js sends no mail to that domain). The code is checked here, on the server, so
     there is no such account without a teacher, and the student joins that teacher's class at once.

       POST /api/auth/username-signup  { username, password, teacherCode, name, extra }  →  { ok, email, teacherName }
       The page then signs in with the email and password as usual. */
  const { teacherOf } = require("../lib/teacher-code");
  const RESERVED = new Set(["admin", "administrator", "support", "help", "hello", "info", "contact", "results", "noreply", "no-reply", "mail", "postmaster", "abuse", "billing", "team", "teacher", "student", "prepportal", "root", "security", "webmaster"]);
  const STUDENT_EXTRA = ["activeClass", "schoolName", "focusSubject", "parentContact"];
  const tries = new Map();   // ip → [timestamps]: a few sign-ups a minute from one place is plenty
  router.post("/username-signup", async (req, res) => {
    try {
      const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
      const now = Date.now(), recent = (tries.get(ip) || []).filter((t) => now - t < 60000);
      if (recent.length >= 8) return res.status(429).json({ error: "Too many tries. Wait a minute and try again." });
      tries.set(ip, [...recent, now]);

      const b = req.body || {};
      const username = String(b.username || "").trim().toLowerCase();
      const password = String(b.password || "");
      const name = String(b.name || "").replace(/\s+/g, " ").trim().slice(0, 80);
      if (!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username) || /[._-]{2}/.test(username)) {
        return res.status(400).json({ error: "A username is 3 to 24 letters or numbers (you may use . _ or - between them)." });
      }
      if (RESERVED.has(username)) return res.status(400).json({ error: "That username is taken. Try another." });
      if (password.length < 6) return res.status(400).json({ error: "The password needs at least 6 characters." });
      if (!name) return res.status(400).json({ error: "Write your full name." });
      const teacher = await teacherOf(b.teacherCode);
      if (!teacher) return res.status(400).json({ error: "That teacher code is not right. Ask your teacher for their code." });

      const email = `${username}@prepportal.com`;
      let user;
      try {
        user = await admin.auth().createUser({ email, password, displayName: name, emailVerified: false });
      } catch (e) {
        if (e && e.code === "auth/email-already-exists") return res.status(409).json({ error: "That username is taken. Try another." });
        if (e && e.code === "auth/invalid-password") return res.status(400).json({ error: "The password needs at least 6 characters." });
        throw e;
      }
      const extra = {};
      STUDENT_EXTRA.forEach((k) => { if (b.extra && typeof b.extra[k] === "string") extra[k] = b.extra[k].slice(0, 120); });
      const db = admin.firestore(), stamp = admin.firestore.FieldValue.serverTimestamp();
      await db.collection("users").doc(user.uid).set({
        name, email, username, noEmail: true, role: "student", isPremium: false,
        teacherUid: teacher.uid, teacherCode: teacher.code, createdAt: new Date().toISOString(), ...extra,
      });
      await db.collection("teacherStudents").doc(teacher.uid).collection("roster").doc(user.uid).set({
        name, email, username, joinedAt: stamp, source: "signup",
      }, { merge: true });
      res.json({ ok: true, email, teacherName: teacher.name });
    } catch (err) {
      console.error("[/api/auth/username-signup]", err.message);
      res.status(500).json({ error: "The account could not be made. Try again." });
    }
  });

  return router;
};
