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

  // ── Publish: re-export the static practice bank from Firestore, then deploy ──
  // Preferred path: trigger the "Publish CBT bank" GitHub Action (workflow_dispatch)
  // which re-exports data/cbt from Firestore, commits it, and pushes — Vercel then
  // auto-deploys. This is what makes editor changes actually go live; students keep
  // reading committed static files at the edge (≈0 Firestore reads).
  //   Needs: GH_DISPATCH_TOKEN (PAT with Actions: read/write) + the FIREBASE_SERVICE_ACCOUNT
  //   GitHub Actions secret. GH_REPO/GH_PUBLISH_WORKFLOW override the defaults.
  // Fallback: if no GH token is configured, POST the Vercel Deploy Hook (DEPLOY_HOOK_URL),
  // which only REDEPLOYS the already-committed bank (no re-export) — kept so the button
  // never hard-fails. A short cooldown prevents spamming publishes.
  const GH_REPO = process.env.GH_REPO || "greamses/prep-portal";
  const GH_WORKFLOW = process.env.GH_PUBLISH_WORKFLOW || "publish-bank.yml";
  const GH_REF = process.env.GH_PUBLISH_REF || "main";

  async function dispatchPublishWorkflow() {
    const token = process.env.GH_DISPATCH_TOKEN;
    if (!token) return false;
    const url = `https://api.github.com/repos/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "prep-portal-publish",
      },
      body: JSON.stringify({ ref: GH_REF }),
    });
    if (r.status === 204) return true;
    const body = await r.text().catch(() => "");
    throw new Error(`GitHub dispatch ${r.status}: ${body.slice(0, 200)}`);
  }

  let lastPublish = 0;
  router.post("/publish", async (req, res) => {
    const hasGh = !!process.env.GH_DISPATCH_TOKEN;
    const hook = process.env.DEPLOY_HOOK_URL;
    if (!hasGh && !hook) {
      return res.status(503).json({ error: "Publishing isn't set up yet. Add a GH_DISPATCH_TOKEN (to run the Publish CBT bank action) or a DEPLOY_HOOK_URL env var." });
    }
    const now = Date.now();
    if (now - lastPublish < 120000) {
      const wait = Math.ceil((120000 - (now - lastPublish)) / 1000);
      return res.status(429).json({ error: `Just published — wait ${wait}s before publishing again.` });
    }
    lastPublish = now;
    try {
      const ranExport = await dispatchPublishWorkflow();
      if (!ranExport) {
        const r = await fetch(hook, { method: "POST" });
        if (!r.ok) throw new Error("deploy hook returned " + r.status);
      }
      res.json({
        ok: true,
        reexported: ranExport,
        message: ranExport
          ? "Publishing… re-exporting from Firestore and deploying. Live in ~2–3 minutes."
          : "Redeploying the current bank… live in ~1–2 minutes. (Note: this does NOT pull new editor changes — set GH_DISPATCH_TOKEN to enable a full re-export.)",
      });
    } catch (e) {
      lastPublish = 0; // failed — allow an immediate retry
      console.error("[/api/admin/publish]", e.message);
      res.status(502).json({ error: "Couldn't trigger publish: " + e.message });
    }
  });

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

  // ── Payouts (Phase 3) ───────────────────────────────────────
  // List payout requests (optionally ?status=requested|paid|rejected), newest first.
  router.get("/payouts", async (req, res) => {
    try {
      const snap = await db.collection("payouts").get();
      let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (req.query.status) rows = rows.filter((r) => r.status === req.query.status);
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      rows.sort((a, b) => ms(b.requestedAt) - ms(a.requestedAt));
      res.json(rows);
    } catch (err) {
      console.error("[/api/admin/payouts GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Approve a payout: atomically debit the partner's balance and mark it paid.
  router.post("/payouts/:id/approve", async (req, res) => {
    try {
      const poRef = db.collection("payouts").doc(req.params.id);
      const inc = admin.firestore.FieldValue.increment;
      const ts = admin.firestore.FieldValue.serverTimestamp;
      const result = await db.runTransaction(async (t) => {
        const poSnap = await t.get(poRef);
        if (!poSnap.exists) { const e = new Error("Payout not found."); e.status = 404; throw e; }
        const po = poSnap.data();
        if (po.status !== "requested") { const e = new Error(`Payout is already ${po.status}.`); e.status = 409; throw e; }
        const pRef = db.collection("partners").doc(po.partnerId);
        const pSnap = await t.get(pRef);
        const bal = (pSnap.exists && pSnap.data().balanceKobo) || 0;
        if (bal < po.amountKobo) { const e = new Error("Partner balance is now lower than the request."); e.status = 409; throw e; }
        t.set(pRef, { balanceKobo: inc(-po.amountKobo), paidOutKobo: inc(po.amountKobo), updatedAt: ts() }, { merge: true });
        t.set(poRef, { status: "paid", paidAt: ts(), paidBy: req.user.email || req.user.uid }, { merge: true });
        return { amountKobo: po.amountKobo };
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      console.error("[/api/admin/payouts approve]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Reject a payout (no balance change).
  router.post("/payouts/:id/reject", async (req, res) => {
    try {
      const poRef = db.collection("payouts").doc(req.params.id);
      const snap = await poRef.get();
      if (!snap.exists) return res.status(404).json({ error: "Payout not found." });
      if (snap.data().status !== "requested") return res.status(409).json({ error: `Payout is already ${snap.data().status}.` });
      await poRef.set({
        status: "rejected",
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectedBy: req.user.email || req.user.uid,
        reason: String((req.body && req.body.reason) || "").slice(0, 200) || null,
      }, { merge: true });
      res.json({ ok: true });
    } catch (err) {
      console.error("[/api/admin/payouts reject]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
