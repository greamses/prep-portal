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
const prints = require("../lib/workbook-prints");

// Paystack plan code → our plan metadata (mirrors payment-manager.js PLANS).
// priceKobo is what one charge of the plan costs; monthlyEqKobo is the
// per-month value (used to size the yearly commission as a 6-month
// equivalent — see creditReferral below).
//
// A charge ONLY grants premium when it names one of these plans and paid at
// least that plan's price, in naira. Anything else — a charge with no plan, an
// unknown plan, a plan paid for with less money, a tutoring booking, a
// workbook print — is not a subscription and changes nothing. Before this,
// any successful charge of any amount was applied as premium.
const PLAN_BY_CODE = {
  PLN_3mghi8hr1mxg5lk: { name: "Pro",        tier: "pro",        billing: "monthly", priceKobo: 1000000,   monthlyEqKobo: 1000000 },
  PLN_knvr81r8t903ria: { name: "Pro",        tier: "pro",        billing: "yearly",  priceKobo: 12000000,  monthlyEqKobo: 1000000 },
  PLN_xodc0xq5eki6vyg: { name: "Premium",    tier: "premium",    billing: "monthly", priceKobo: 3000000,   monthlyEqKobo: 3000000 },
  PLN_3os05kpnhpauvav: { name: "Premium",    tier: "premium",    billing: "yearly",  priceKobo: 34200000,  monthlyEqKobo: 2850000 },
  PLN_la6q8cp6ryy2alq: { name: "Enterprise", tier: "enterprise", billing: "monthly", priceKobo: 15000000,  monthlyEqKobo: 15000000 },
  PLN_bbypkk64rsyacww: { name: "Enterprise", tier: "enterprise", billing: "yearly",  priceKobo: 162000000, monthlyEqKobo: 13500000 },
};

/**
 * Is this verified Paystack transaction really a subscription payment?
 * Returns { plan, code } or { reason } saying why not.
 */
function subscriptionOf(tx, planCode) {
  if (!tx || tx.status !== "success") return { reason: "The payment did not succeed." };
  if (String(tx.currency || "").toUpperCase() !== "NGN") return { reason: "The payment was not in naira." };
  const plan = PLAN_BY_CODE[planCode];
  if (!plan) return { reason: "That payment was not for a subscription plan." };
  /* The price is Paystack's own record of the plan when the transaction
     carries it (it comes from Paystack, not the browser), so a price changed
     in the dashboard does not turn real subscribers away; our table is the
     fallback. */
  const po = (tx.plan_object && tx.plan_object.plan_code === planCode && tx.plan_object)
    || (tx.plan && typeof tx.plan === "object" && tx.plan.plan_code === planCode && tx.plan) || null;
  const paystackPrice = po ? Number(po.amount) || 0 : 0;
  if (paystackPrice && paystackPrice !== plan.priceKobo) {
    console.warn(`[payments] Paystack says ${planCode} costs ${paystackPrice} kobo; PLAN_BY_CODE says ${plan.priceKobo}`);
  }
  const price = paystackPrice || plan.priceKobo;
  if ((Number(tx.amount) || 0) < price) return { reason: "The amount paid is less than the plan's price." };
  return { plan, code: planCode };
}

// Partner commission: 10% of each subscription, for the first 6 months.
//   monthly plan → 10% of each charge, capped at 6 charges (6 cycles).
//   yearly  plan → one payment of 10% × (6 × monthlyEq), exhausting the cap.
const COMMISSION_RATE = 0.10;
const COMMISSION_MAX_CYCLES = 6;

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
    /* A ₦5,000 workbook print is not a subscription. It never grants premium,
       whichever door it comes in by (see lib/workbook-prints.js). */
    if (meta.kind === prints.KIND) return { applied: false, premium: false };
    const email = (tx.customer && tx.customer.email) || meta.email || null;
    const uid = await resolveUid(meta.uid, email);
    if (!uid) { console.warn("[payments] no uid for ref", reference); return { applied: false, premium: false }; }

    /* Only a real plan, paid in full, is a subscription (see PLAN_BY_CODE). */
    const sub = subscriptionOf(tx, planCodeOf(tx, meta));
    if (!sub.plan) {
      console.warn("[payments] not applied as premium:", reference, sub.reason);
      return { applied: false, premium: false, rejected: sub.reason };
    }
    const { plan, code } = sub;
    const amountKobo = Number(tx.amount) || 0;

    const evRef = db().collection("paymentEvents").doc(String(reference));
    const userRef = db().collection("users").doc(uid);
    const inc = admin.firestore.FieldValue.increment;
    const stamp = admin.firestore.FieldValue.serverTimestamp;

    return await db().runTransaction(async (t) => {
      // ── READS (all reads must precede writes in a Firestore transaction) ──
      if ((await t.get(evRef)).exists) return { applied: false, premium: true }; // already processed
      const cur = (await t.get(userRef)).data() || {};

      // Resolve the referral → partner, and size the commission, before writing.
      const refCode = cur.referredByCode || meta.ref_code || null;
      const cyclesPaid = cur.referralCyclesPaid || 0;
      let partnerRef = null, commissionKobo = 0, cyclesToAdd = 0, partnerId = null;
      if (refCode && cyclesPaid < COMMISSION_MAX_CYCLES) {
        const codeSnap = await t.get(db().collection("referralCodes").doc(String(refCode)));
        partnerId = codeSnap.exists ? codeSnap.data().partnerId : null;
        if (partnerId && partnerId !== uid) {            // never self-refer
          const pRef = db().collection("partners").doc(partnerId);
          if ((await t.get(pRef)).exists) {
            if (plan.billing === "yearly") {
              const baseKobo = (plan.monthlyEqKobo || Math.round(amountKobo / 12)) * COMMISSION_MAX_CYCLES;
              commissionKobo = Math.round(baseKobo * COMMISSION_RATE);
              cyclesToAdd = COMMISSION_MAX_CYCLES - cyclesPaid;   // exhaust the cap
            } else {
              commissionKobo = Math.round(amountKobo * COMMISSION_RATE);
              cyclesToAdd = 1;
            }
            partnerRef = pRef;
          }
        }
      }

      // ── WRITES ──
      const now = new Date();
      const curExp = cur.subscriptionExpiry && cur.subscriptionExpiry.toDate
        ? cur.subscriptionExpiry.toDate() : null;
      const expiry = addCycle(curExp && curExp > now ? curExp : now, plan.billing);

      const userUpdate = {
        isPremium: true,
        planId: code || cur.planId || null,
        planName: plan.name,
        planTier: plan.tier,
        billingCycle: plan.billing,
        lastPaymentRef: reference,
        subscriptionExpiry: admin.firestore.Timestamp.fromDate(expiry),
        updatedAt: stamp(),
      };
      if (cyclesToAdd > 0) userUpdate.referralCyclesPaid = cyclesPaid + cyclesToAdd;
      t.set(userRef, userUpdate, { merge: true });

      t.set(evRef, {
        uid, reference, amountKobo, planCode: code || null, email,
        processedAt: stamp(),
        referredByCode: refCode,
        partnerId: commissionKobo > 0 ? partnerId : null,
        commissionKobo,
        commissionCredited: commissionKobo > 0,
      });

      if (partnerRef && commissionKobo > 0) {
        // Bump the partner's running balance + lifetime…
        t.set(partnerRef, {
          balanceKobo: inc(commissionKobo),
          lifetimeKobo: inc(commissionKobo),
          updatedAt: stamp(),
        }, { merge: true });
        // …and append an immutable ledger entry (the audit trail).
        t.set(db().collection("earnings").doc(), {
          partnerId,
          fromUser: uid,
          fromEmail: email,
          amountKobo: commissionKobo,
          chargeKobo: amountKobo,
          planTier: plan.tier,
          billing: plan.billing,
          reference,
          cycle: cyclesPaid + 1,
          createdAt: stamp(),
        });
      }

      return { applied: true, premium: true, commissionKobo };
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
      if (prints.isPrintCharge(tx)) {
        return res.status(400).json({ ok: false, error: "That payment was for a workbook print, not a plan." });
      }
      // Bind to the signed-in user — never trust a client-supplied uid.
      tx.metadata = normalizeMeta(tx.metadata);
      tx.metadata.uid = req.user.uid;
      const out = await applyCharge(tx);
      if (out.rejected) return res.status(400).json({ ok: false, error: out.rejected });
      res.json({ ok: true, premium: !!out.premium });
    } catch (e) {
      console.error("[/api/payments/verify]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/payments/apply-code ───────────────────────────
  // A learner attaches a partner's referral code to their account before paying.
  // Locked once a commission has been paid, to stop code-swapping after the fact.
  router.post("/apply-code", authenticate, async (req, res) => {
    try {
      const code = String((req.body && req.body.code) || "").trim().toUpperCase();
      if (!code) return res.status(400).json({ error: "code required" });
      const codeSnap = await db().collection("referralCodes").doc(code).get();
      if (!codeSnap.exists) return res.status(404).json({ error: "That code isn't valid." });
      const partnerId = codeSnap.data().partnerId;
      if (partnerId === req.user.uid) return res.status(400).json({ error: "You can't use your own code." });
      const userRef = db().collection("users").doc(req.user.uid);
      const cur = (await userRef.get()).data() || {};
      if ((cur.referralCyclesPaid || 0) > 0) {
        return res.status(409).json({ error: "A referral is already locked to your subscription." });
      }
      await userRef.set({ referredByCode: code, referredByPartner: partnerId }, { merge: true });
      res.json({ ok: true, code });
    } catch (e) {
      console.error("[/api/payments/apply-code]", e.message);
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
        if (prints.isPrintCharge(event.data)) await prints.applyPrintCharge(event.data);
        else await applyCharge(event.data);
      }
      // Other events (subscription.create, invoice.*, charge refunds) can be
      // handled in later phases. Always 200 so Paystack stops retrying.
      res.sendStatus(200);
    } catch (e) {
      console.error("[/api/payments/webhook]", e.message);
      res.sendStatus(200); // acknowledged; logged for investigation
    }
  }

  return { router, webhook, applyCharge };
};
