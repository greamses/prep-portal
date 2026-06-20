/**
 * Payment routes — Paystack server-side verification (the money source of truth).
 *
 * Phase 1 of the partner-earnings system. Premium is granted ONLY here, from a
 * Paystack charge we verified ourselves — never trusted from the browser. Two
 * entry points funnel through one idempotent `applyCharge`:
 *
 *   POST /api/payments/verify   (authenticated)  — the browser calls this right
 *       after the Paystack popup succeeds, for an instant, authoritative unlock.
 *   POST /api/payments/webhook  (Paystack S2S)   — fires on the initial charge
 *       AND every recurring renewal; HMAC-SHA512 verified against the raw body.
 *
 * `applyCharge` is idempotent on the transaction reference (a re-delivered
 * webhook or a double verify is a no-op) and writes a `paymentEvents/{ref}`
 * record. Phase 2 (referral commissions) will hook in right where noted below.
 */

const express = require("express");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");

// Paystack plan code → our plan metadata (mirrors payment-manager.js PLANS).
const PLAN_BY_CODE = {
  PLN_3mghi8hr1mxg5lk: { name: "Pro",        tier: "pro",        billing: "monthly" },
  PLN_knvr81r8t903ria: { name: "Pro",        tier: "pro",        billing: "yearly"  },
  PLN_xodc0xq5eki6vyg: { name: "Premium",    tier: "premium",    billing: "monthly" },
  PLN_3os05kpnhpauvav: { name: "Premium",    tier: "premium",    billing: "yearly"  },
  PLN_la6q8cp6ryy2alq: { name: "Enterprise", tier: "enterprise", billing: "monthly" },
  PLN_bbypkk64rsyacww: { name: "Enterprise", tier: "enterprise", billing: "yearly"  },
};

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const SECRET = process.env.PAYSTACK_SECRET_KEY;

  // Paystack metadata can arrive as an object or a JSON string.
  function normalizeMeta(meta) {
    if (!meta) return {};
    if (typeof meta === "string") { try { return JSON.parse(meta); } catch (_) { return {}; } }
    return meta;
  }

  function planCodeOf(tx, meta) {
    if (tx.plan && typeof tx.plan === "object" && tx.plan.plan_code) return tx.plan.plan_code;
    if (typeof tx.plan === "string" && tx.plan) return tx.plan;
    return meta.plan_code || null;
  }

  function addCycle(from, billing) {
    const d = new Date(from);
    if (billing === "yearly") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d;
  }

  // Resolve the Firebase uid for a charge: prefer metadata.uid (set at checkout),
  // else look the customer up by email (the reliable path for renewals, whose
  // events don't carry the original metadata).
  async function resolveUid(metaUid, email) {
    if (metaUid) return metaUid;
    if (email) {
      try { return (await admin.auth().getUserByEmail(email)).uid; } catch (_) {}
    }
    return null;
  }

  // Apply a verified, successful transaction to the user's premium status.
  // Idempotent by `reference`. Returns { applied, premium }.
  async function applyCharge(tx) {
    const reference = tx && tx.reference;
    if (!reference) return { applied: false, premium: false };

    const meta = normalizeMeta(tx.metadata);
    const email = (tx.customer && tx.customer.email) || meta.email || null;
    const uid = await resolveUid(meta.uid, email);
    if (!uid) { console.warn("[payments] no uid for ref", reference); return { applied: false, premium: false }; }

    const code = planCodeOf(tx, meta);
    const plan = PLAN_BY_CODE[code] || {
      name: meta.plan || "Premium",
      tier: meta.planTier || "premium",
      billing: meta.billing || "monthly",
    };
    const amountKobo = Number(tx.amount) || 0;

    const evRef = db().collection("paymentEvents").doc(String(reference));
    const userRef = db().collection("users").doc(uid);

    return await db().runTransaction(async (t) => {
      if ((await t.get(evRef)).exists) return { applied: false, premium: true }; // already processed

      const now = new Date();
      const cur = (await t.get(userRef)).data() || {};
      const curExp = cur.subscriptionExpiry && cur.subscriptionExpiry.toDate
        ? cur.subscriptionExpiry.toDate()
        : null;
      // Extend from the later of now / current expiry so renewals stack.
      const base = curExp && curExp > now ? curExp : now;
      const expiry = addCycle(base, plan.billing);

      t.set(userRef, {
        isPremium: true,
        planId: code || cur.planId || null,
        planName: plan.name,
        planTier: plan.tier,
        billingCycle: plan.billing,
        lastPaymentRef: reference,
        subscriptionExpiry: admin.firestore.Timestamp.fromDate(expiry),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      t.set(evRef, {
        uid,
        reference,
        amountKobo,
        planCode: code || null,
        email,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        // ── Phase 2 hook: the referral code travels here so a commission can be
        //    credited to the partner from this verified charge.
        referredByCode: cur.referredByCode || meta.ref_code || null,
        commissionCredited: false,
      });

      return { applied: true, premium: true };
    });
  }

  // Ask Paystack whether a reference really succeeded. Returns the tx or null.
  async function paystackVerify(reference) {
    if (!SECRET) throw new Error("Paystack not configured");
    const r = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${SECRET}` } }
    );
    const j = await r.json().catch(() => null);
    return j && j.status && j.data ? j.data : null;
  }

  // ── POST /api/payments/verify ───────────────────────────────
  router.post("/verify", authenticate, async (req, res) => {
    try {
      const reference = req.body && req.body.reference;
      if (!reference) return res.status(400).json({ error: "reference required" });
      const tx = await paystackVerify(reference);
      if (!tx || tx.status !== "success") {
        return res.status(400).json({ ok: false, error: "Payment not successful." });
      }
      // Bind to the signed-in user — never trust a client-supplied uid.
      tx.metadata = normalizeMeta(tx.metadata);
      tx.metadata.uid = req.user.uid;
      const out = await applyCharge(tx);
      res.json({ ok: true, premium: !!out.premium });
    } catch (e) {
      console.error("[/api/payments/verify]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── Paystack webhook (raw body; mounted before express.json in index.js) ──
  async function webhook(req, res) {
    try {
      if (!SECRET) return res.sendStatus(503);
      const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
      const expected = crypto.createHmac("sha512", SECRET).update(raw).digest("hex");
      if (req.headers["x-paystack-signature"] !== expected) return res.sendStatus(401);

      const event = JSON.parse(raw.toString("utf8"));
      if (event.event === "charge.success" && event.data) {
        await applyCharge(event.data);
      }
      // Other events (subscription.create, invoice.*, charge refunds) can be
      // handled in later phases. Always 200 so Paystack stops retrying.
      res.sendStatus(200);
    } catch (e) {
      console.error("[/api/payments/webhook]", e.message);
      res.sendStatus(200); // acknowledged; logged for investigation
    }
  }

  return { router, webhook };
};
