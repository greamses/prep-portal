/**
 * Workbook print passes — see lib/workbook-prints.js for what a pass is.
 *
 *   POST /api/workbooks/pass      { workbook, key }            may I print this?
 *   POST /api/workbooks/checkout  { workbook, key, summary }   open a ₦5,000 order
 *   POST /api/workbooks/verify    { reference }                after the popup
 *
 * All three need a signed-in user. The admin may always print, and is told so
 * by /pass without an order. Paystack's webhook reaches the same grant through
 * routes/payments.js, which hands print charges over rather than treating
 * them as a subscription.
 */

const express = require("express");
const { authenticate } = require("../middleware/auth");
const P = require("../lib/workbook-prints");

module.exports = function () {
  const router = express.Router();
  const isAdmin = (req) => !!req.user && !!req.user.email && req.user.email === process.env.ADMIN_EMAIL;

  function checkBody(req, res) {
    const { workbook, key } = req.body || {};
    if (!P.validWorkbook(workbook)) { res.status(400).json({ error: "Unknown workbook." }); return null; }
    if (!P.validKey(key)) { res.status(400).json({ error: "Bad workbook key." }); return null; }
    return { workbook, key };
  }

  router.post("/pass", authenticate, async (req, res) => {
    try {
      const b = checkBody(req, res);
      if (!b) return;
      if (isAdmin(req)) {
        return res.json({ ok: true, paid: true, admin: true, buyer: "Prep Portal", order: "ADMIN" });
      }
      const pass = await P.findPass(req.user.uid, b.workbook, b.key);
      if (pass) return res.json({ ok: true, paid: true, ...pass });
      res.json({ ok: true, paid: false, price: P.PRICE_KOBO / 100 });
    } catch (e) {
      console.error("[/api/workbooks/pass]", e.message);
      res.status(500).json({ error: "Could not check the print pass." });
    }
  });

  router.post("/checkout", authenticate, async (req, res) => {
    try {
      const b = checkBody(req, res);
      if (!b) return;
      if (isAdmin(req)) return res.status(400).json({ error: "The admin prints free." });
      if (await P.findPass(req.user.uid, b.workbook, b.key)) {
        return res.status(409).json({ error: "This workbook is already paid for." });
      }
      const order = await P.openOrder({
        uid: req.user.uid, email: req.user.email, workbook: b.workbook, key: b.key,
        summary: req.body.summary,
      });
      res.json({ ok: true, ...order, email: req.user.email, kind: P.KIND, label: P.WORKBOOKS[b.workbook] });
    } catch (e) {
      console.error("[/api/workbooks/checkout]", e.message);
      res.status(500).json({ error: "Could not open the order." });
    }
  });

  router.post("/verify", authenticate, async (req, res) => {
    try {
      const reference = req.body && req.body.reference;
      if (!reference || typeof reference !== "string") return res.status(400).json({ error: "reference required" });
      const tx = await P.paystackVerify(reference);
      if (!tx) return res.status(400).json({ ok: false, error: "Payment not found." });
      const out = await P.applyPrintCharge(tx, req.user.uid);
      if (!out.ok) return res.status(400).json(out);
      res.json(out);
    } catch (e) {
      console.error("[/api/workbooks/verify]", e.message);
      res.status(500).json({ error: "Could not confirm the payment." });
    }
  });

  return router;
};
