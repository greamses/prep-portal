/**
 * Partner self-service routes (Phase 3) — a school/partner logs in to see their
 * own code, balance and earnings, and to request a payout.
 *
 * Everything is server-mediated and authorised by ownerUid, so the locked-down
 * Firestore rules never need to expose partners/earnings/payouts to the client.
 *
 *   POST /api/partner/claim   { code }            — link this account to a partner
 *   GET  /api/partner/me                          — my partner profile + ledger
 *   POST /api/partner/payout  { amountKobo?, bank } — request a withdrawal
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");

const MIN_PAYOUT_KOBO = 100000; // ₦1,000 minimum withdrawal

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const stamp = admin.firestore.FieldValue.serverTimestamp;

  const publicPartner = (p) => ({
    id: p.id,
    code: p.code || null,
    schoolName: p.schoolName || null,
    balanceKobo: p.balanceKobo || 0,
    lifetimeKobo: p.lifetimeKobo || 0,
    paidOutKobo: p.paidOutKobo || 0,
  });

  async function partnerForUser(uid) {
    const snap = await db().collection("partners").where("ownerUid", "==", uid).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  // ── POST /claim — attach the signed-in account to a partner via its code ──
  router.post("/claim", authenticate, async (req, res) => {
    try {
      const code = String((req.body && req.body.code) || "").trim().toUpperCase();
      if (!code) return res.status(400).json({ error: "code required" });

      const already = await partnerForUser(req.user.uid);
      if (already) return res.json({ ok: true, partner: publicPartner(already) });

      const codeSnap = await db().collection("referralCodes").doc(code).get();
      if (!codeSnap.exists) return res.status(404).json({ error: "That code isn't valid." });
      const partnerId = codeSnap.data().partnerId;
      const pRef = db().collection("partners").doc(partnerId);

      const partner = await db().runTransaction(async (t) => {
        const pSnap = await t.get(pRef);
        if (!pSnap.exists) { const e = new Error("Partner not found."); e.status = 404; throw e; }
        const p = pSnap.data();
        if (p.ownerUid && p.ownerUid !== req.user.uid) {
          const e = new Error("This code has already been claimed."); e.status = 409; throw e;
        }
        // If the partner was registered with a contact email, require a match.
        if (p.contactEmail && req.user.email &&
            p.contactEmail.toLowerCase() !== req.user.email.toLowerCase()) {
          const e = new Error("Sign in with the email this partner was registered with."); e.status = 403; throw e;
        }
        t.set(pRef, { ownerUid: req.user.uid, claimedAt: stamp() }, { merge: true });
        return { id: partnerId, ...p, ownerUid: req.user.uid };
      });

      res.json({ ok: true, partner: publicPartner(partner) });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("[/api/partner/claim]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /me — my partner profile, referral count, ledger, payout history ──
  router.get("/me", authenticate, async (req, res) => {
    try {
      const p = await partnerForUser(req.user.uid);
      if (!p) return res.json({ partner: null });

      const earnSnap = await db().collection("earnings").where("partnerId", "==", p.id).get();
      const earnings = earnSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      earnings.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
      const referrals = new Set(earnings.map((e) => e.fromUser)).size;

      const poSnap = await db().collection("payouts").where("partnerId", "==", p.id).get();
      const payouts = poSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      payouts.sort((a, b) => ms(b.requestedAt) - ms(a.requestedAt));

      res.json({
        partner: publicPartner(p),
        referrals,
        minPayoutKobo: MIN_PAYOUT_KOBO,
        earnings: earnings.slice(0, 100),
        payouts,
      });
    } catch (e) {
      console.error("[/api/partner/me]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /payout — request a withdrawal (admin approves manually) ──
  router.post("/payout", authenticate, async (req, res) => {
    try {
      const p = await partnerForUser(req.user.uid);
      if (!p) return res.status(404).json({ error: "No partner linked to this account." });

      const b = req.body || {};
      const bankName = String(b.bankName || "").trim();
      const accountName = String(b.accountName || "").trim();
      const accountNumber = String(b.accountNumber || "").trim();
      if (!bankName || !accountName || !accountNumber) {
        return res.status(400).json({ error: "Bank name, account name and account number are required." });
      }
      let amountKobo = Math.floor(Number(b.amountKobo) || (p.balanceKobo || 0));
      if (amountKobo < MIN_PAYOUT_KOBO) {
        return res.status(400).json({ error: `Minimum payout is ₦${MIN_PAYOUT_KOBO / 100}.` });
      }
      if (amountKobo > (p.balanceKobo || 0)) {
        return res.status(400).json({ error: "Amount exceeds your available balance." });
      }
      // One pending request at a time (filtered in code to avoid a composite index).
      const existing = await db().collection("payouts").where("partnerId", "==", p.id).get();
      if (existing.docs.some((d) => d.data().status === "requested")) {
        return res.status(409).json({ error: "You already have a pending payout request." });
      }

      const ref = await db().collection("payouts").add({
        partnerId: p.id,
        ownerUid: req.user.uid,
        schoolName: p.schoolName || null,
        amountKobo,
        bankName: bankName.slice(0, 80),
        accountName: accountName.slice(0, 80),
        accountNumber: accountNumber.slice(0, 30),
        status: "requested",
        requestedAt: stamp(),
      });
      res.json({ ok: true, id: ref.id });
    } catch (e) {
      console.error("[/api/partner/payout]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
