/**
 * Push and email settings.
 *
 *   GET  /api/notify/vapid                 the public key a browser subscribes with
 *   POST /api/notify/push      { sub }      keep this browser's subscription (signed in)
 *   POST /api/notify/push/off  { endpoint } forget it
 *   GET  /api/notify/prefs                 { email: true|false }
 *   POST /api/notify/prefs     { email }    results by email on or off
 *   GET  /api/notify/email/off?u=&t=       the one-click "stop result emails" link in every email
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");
const out = require("../lib/notify-out");

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();

  router.get("/vapid", (req, res) => res.json({ ok: true, key: out.publicKey() }));

  router.post("/push", authenticate, async (req, res) => {
    try { await out.saveSub(req.user.uid, req.body && req.body.sub, req.get("user-agent") || ""); res.json({ ok: true }); }
    catch (e) { res.status(400).json({ error: e.message || "Could not keep the subscription." }); }
  });
  router.post("/push/off", authenticate, async (req, res) => {
    try { await out.dropSub(req.user.uid, String((req.body && req.body.endpoint) || "")); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: "Could not forget the subscription." }); }
  });

  router.get("/prefs", authenticate, async (req, res) => {
    try { const p = await db().collection("emailPrefs").doc(req.user.uid).get(); res.json({ ok: true, email: !(p.exists && p.data().off === true) }); }
    catch (e) { res.status(500).json({ error: "Could not read your settings." }); }
  });
  router.post("/prefs", authenticate, async (req, res) => {
    try { await db().collection("emailPrefs").doc(req.user.uid).set({ off: !(req.body && req.body.email === true), at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: "Could not save your settings." }); }
  });

  const page = (title, text) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f0ece3;font-family:Consolas,monospace;color:#1d1b18;padding:16px">
<div style="max-width:420px;background:#fffdf7;padding:26px;box-shadow:0 6px 18px rgba(29,27,24,.12)"><h1 style="font-family:Arial,sans-serif;font-size:20px;margin:0 0 10px">${title}</h1><p style="margin:0 0 16px;line-height:1.6;font-size:14px">${text}</p><a href="/" style="color:#1d1b18">prepportal.com.ng</a></div></body></html>`;
  const off = async (req, res) => {
    const uid = String(req.query.u || ""), t = String(req.query.t || "");
    if (!uid || !out.checkOff(uid, t)) return res.status(400).type("html").send(page("That link is not right", "The link to stop result emails did not match. Open the email again and use the link at the bottom."));
    try {
      await db().collection("emailPrefs").doc(uid).set({ off: true, at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      res.type("html").send(page("Result emails stopped", "You will not get result emails any more. Your results still show in the bell on the site, and you can turn emails back on from there."));
    } catch (e) { res.status(500).type("html").send(page("Something went wrong", "Your setting could not be saved. Please try the link again.")); }
  };
  router.get("/email/off", off);
  router.post("/email/off", off);     // one-click unsubscribe from the mail client

  return router;
};
