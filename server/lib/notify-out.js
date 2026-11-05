/**
 * Notices that leave the site: a push notification on the student's devices, and an email for a result.
 *
 * PUSH (standard Web Push, no Firebase Messaging): a browser that said yes keeps a subscription at
 *   pushSubs/{uid}/subs/{hash of the endpoint} = { endpoint, keys: { p256dh, auth }, at, ua }
 * and each notice is sent to every one of them, signed with the site's VAPID keys (env VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).
 * A subscription the push service says is gone (404, 410) is removed. The service worker (sw.js) shows it.
 *
 * EMAIL (Resend's HTTP API, env RESEND_API_KEY, MAIL_FROM): the address on the student's account, unless they turned results
 * email off (emailPrefs/{uid}.off). Every email carries a one-click link to turn it off, signed so nobody can turn off
 * somebody else's. With no RESEND_API_KEY nothing is sent and nothing fails.
 *
 * Both are best-effort and capped in time: a notice that cannot leave must never hold up or fail the thing that caused it.
 */

const crypto = require("crypto");
const admin = require("firebase-admin");

const db = () => admin.firestore();
const SITE = process.env.SITE_URL || "https://www.prepportal.com.ng";
const clip = (s, n) => String(s == null ? "" : s).slice(0, n);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const subId = (endpoint) => crypto.createHash("sha256").update(String(endpoint)).digest("hex").slice(0, 40);

let webpush = null;
function pusher() {
  if (webpush !== null) return webpush;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) { webpush = false; return false; }
  try {
    webpush = require("web-push");
    webpush.setVapidDetails(`mailto:${process.env.ADMIN_EMAIL || "hello@prepportal.com.ng"}`, pub, priv);
  } catch (e) { console.error("[push] web-push unavailable:", e.message); webpush = false; }
  return webpush;
}

/** Keep one browser's subscription for this person. */
async function saveSub(uid, sub, ua = "") {
  if (!sub || typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) throw new Error("Not a push subscription.");
  await db().collection("pushSubs").doc(uid).collection("subs").doc(subId(sub.endpoint)).set({
    endpoint: clip(sub.endpoint, 1000), keys: { p256dh: clip(sub.keys.p256dh, 200), auth: clip(sub.keys.auth, 100) },
    ua: clip(ua, 160), at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
async function dropSub(uid, endpoint) {
  await db().collection("pushSubs").doc(uid).collection("subs").doc(subId(endpoint)).delete();
}

async function pushTo(uids, { title, body, url, tag }) {
  const wp = pusher();
  if (!wp) return 0;
  const payload = JSON.stringify({ title: clip(title, 80) || "Prep Portal", body: clip(body, 200), url: clip(url, 300) || "/", tag: clip(tag, 80) });
  let sent = 0;
  await Promise.all(uids.map(async (uid) => {
    const snap = await db().collection("pushSubs").doc(uid).collection("subs").limit(10).get();
    await Promise.all(snap.docs.map(async (d) => {
      const s = d.data();
      try { await wp.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 3 * 24 * 3600, urgency: "normal" }); sent++; }
      catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) await d.ref.delete().catch(() => {}); else console.error("[push]", e && (e.statusCode || e.message)); }
    }));
  }));
  return sent;
}

/* ── email ─────────────────────────────────────────────────────────────────── */
const secret = () => process.env.NOTIFY_SECRET || process.env.VAPID_PRIVATE_KEY || process.env.PAYSTACK_SECRET_KEY || "prep-portal";
const offToken = (uid) => crypto.createHmac("sha256", secret()).update(`mail-off:${uid}`).digest("hex").slice(0, 32);
const offLink = (uid) => `${SITE}/api/notify/email/off?u=${encodeURIComponent(uid)}&t=${offToken(uid)}`;
const checkOff = (uid, t) => typeof t === "string" && t.length === 32 && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(offToken(uid)));

function mailHtml({ title, text, url, from }, uid) {
  const link = url ? (/^https?:/.test(url) ? url : SITE + url) : SITE;
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f0ece3;font-family:'JetBrains Mono',Consolas,monospace;color:#1d1b18">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#fffdf7;box-shadow:0 6px 18px rgba(29,27,24,.12)">
<tr><td style="padding:22px 26px 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6f675b">Prep Portal${from ? ` &middot; ${esc(from)}` : ""}</td></tr>
<tr><td style="padding:0 26px;font-family:Unbounded,Arial,sans-serif;font-weight:800;font-size:22px;line-height:1.25">${esc(title)}</td></tr>
<tr><td style="padding:12px 26px 4px;font-size:14px;line-height:1.6">${esc(text)}</td></tr>
<tr><td style="padding:16px 26px 24px"><a href="${esc(link)}" style="display:inline-block;padding:11px 18px;background:#f4c95d;color:#1d1b18;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 3px 8px rgba(29,27,24,.18)">Open it</a></td></tr>
</table>
<p style="max-width:560px;margin:14px auto 0;font-size:11px;line-height:1.5;color:#8a8174">You get this because a result of yours went in on prepportal.com.ng. <a href="${esc(offLink(uid))}" style="color:#8a8174">Stop result emails</a>.</p>
</td></tr></table></body></html>`;
}

async function mailTo(uids, n) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return 0;
  const from = process.env.MAIL_FROM || "Prep Portal <results@prepportal.com.ng>";
  let sent = 0;
  await Promise.all(uids.map(async (uid) => {
    try {
      const pref = await db().collection("emailPrefs").doc(uid).get();
      if (pref.exists && pref.data().off === true) return;
      const user = await admin.auth().getUser(uid);
      /* a student who signed up with a username has a login address, not a mailbox */
      if (!user.email || /@prepportal\.com$/i.test(user.email)) return;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from, to: [user.email], subject: clip(`${n.title}: ${n.text}`, 140),
          html: mailHtml(n, uid),
          text: `${n.title}\n\n${n.text}\n\nOpen it: ${n.url ? (/^https?:/.test(n.url) ? n.url : SITE + n.url) : SITE}\n\nStop result emails: ${offLink(uid)}`,
          headers: { "List-Unsubscribe": `<${offLink(uid)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        }),
      });
      if (r.ok) sent++; else console.error("[mail]", r.status, (await r.text()).slice(0, 200));
    } catch (e) { console.error("[mail]", e.message); }
  }));
  return sent;
}

/** Send a notice out: push to every device that said yes, and (when `mail`) an email. Never throws; gives up after `ms`. */
async function sendOut(uids, n, { push = true, mail = false, tag = "", ms = 7000 } = {}) {
  const list = [...new Set((uids || []).map(String))].filter(Boolean).slice(0, 500);
  if (!list.length) return;
  const work = Promise.allSettled([
    push ? pushTo(list, { title: n.title, body: n.text, url: n.url, tag: tag || n.kind }) : 0,
    mail ? mailTo(list, n) : 0,
  ]);
  await Promise.race([work, new Promise((r) => setTimeout(r, ms))]);
}

module.exports = { sendOut, saveSub, dropSub, checkOff, publicKey: () => process.env.VAPID_PUBLIC_KEY || "" };
