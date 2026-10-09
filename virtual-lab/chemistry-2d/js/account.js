/* ============================================================
   Chemistry Bench: who is at the bench, and what they may use
   ------------------------------------------------------------
   The bench and every practical on it are FREE to anyone signed in.
   Two things are not:
     · PrepBot (its demonstrations, its set-ups, its help and its chat) is
       for premium members: the "prepbot" feature, part "bench", resolved
       through the one registry (/utils/features.js) like every other gate.
     · A stock bottle that has run out is refilled with a REFILL. Refills are
       sold ten for ₦1,000 and one fills any one bottle or jar. The count is
       kept by the server (server/lib/bench-refills.js): this file only asks.
       The admin's refills are unlimited.
   How much is left in each bottle is the learner's own record, kept in
   benchStock/{uid} as well as on this device, so that a bottle is not made
   full again by clearing the browser.
   ============================================================ */

import { auth } from "/firebase-init.js";
import { watchProfile, getDoc, saveDoc } from "/utils/data-service.js";
import { resolveUserAccess } from "/utils/features.js";

/* Mirrors PACK in server/lib/bench-refills.js: the server charges what IT says. */
export const PACK = { refills: 10, naira: 1000 };
const PK = "pk_live_f4ddce00cea983792c801c129d875e64086d68da";

// bot: may PrepBot be used? (null until it is known, and then it is not withheld)
// refills: how many are left (null = not known yet); unlimited: the admin
export const account = { user: null, bot: null, refills: null, unlimited: false, stock: null };
const subs = new Set();
const tell = () => subs.forEach((cb) => { try { cb(account); } catch { /* a listener's own trouble */ } });
/** Be told whenever something about the account changes (and once now). */
export function onAccount(cb) { subs.add(cb); cb(account); return () => subs.delete(cb); }

const API = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";
async function api(method, path, body) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.ok === false) { const e = new Error(d.error || "Something went wrong."); e.left = d.left; throw e; }
  return d;
}

let unwatch = null;
auth.onAuthStateChanged(async (user) => {
  if (unwatch) { unwatch(); unwatch = null; }
  Object.assign(account, { user, bot: user ? null : false, refills: null, unlimited: false, stock: null });
  tell();
  if (!user) return;
  unwatch = watchProfile(user.uid, async (profile) => {
    try {
      const v = await resolveUserAccess({ featureId: "prepbot", partId: "bench", profile });
      account.bot = Boolean(v.allowed);
    } catch { account.bot = Boolean(profile && profile.isPremium); }
    tell();
  });
  try { const d = await api("GET", "/api/payments/bench/balance"); account.refills = d.left; account.unlimited = Boolean(d.unlimited); } catch { account.refills = 0; }
  try { const d = await getDoc(`benchStock/${user.uid}`, { force: true }); account.stock = (d && d.stock) || {}; } catch { account.stock = {}; }
  tell();
});

/** Spend one refill. Resolves to true when the bottle may be filled. */
export async function useRefill() {
  const d = await api("POST", "/api/payments/bench/use", {});
  account.refills = d.left ?? account.refills;
  account.unlimited = Boolean(d.unlimited);
  tell();
  return true;
}

function loadSDK() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("The payment window could not be opened. Check your connection."));
    document.head.appendChild(s);
  });
}

/**
 * Buy a pack of refills. Resolves to how many the account then has; rejects
 * with an Error (message "closed" when the learner shut the payment window).
 */
export async function buyRefills() {
  const order = await api("POST", "/api/payments/bench/order", {});
  await loadSDK();
  return new Promise((resolve, reject) => {
    let paid = false;
    window.PaystackPop.setup({
      key: PK,
      email: order.email || account.user.email,
      amount: order.amountKobo,
      currency: "NGN",
      ref: order.reference,
      metadata: { kind: order.kind, uid: account.user.uid, custom_fields: [{ display_name: "Chemistry Bench", variable_name: "refills", value: `${order.refills} refills` }] },
      callback: (response) => {
        paid = true;
        api("POST", "/api/payments/bench/verify", { reference: response.reference })
          .then((r) => { account.refills = r.left; tell(); resolve(r.left); })
          .catch(() => reject(new Error(`Payment received. Your refills will appear shortly: quote ${response.reference} to support if they do not.`)));
      },
      onClose: () => { if (!paid) reject(new Error("closed")); },
    }).openIframe();
  });
}

/** Keep what is left in each bottle with the account (not oftener than every 20 s, and on leaving). */
let pending = null, timer = null, last = 0;
function flush() {
  clearTimeout(timer);
  timer = null;
  if (!pending || !account.user) return;
  const stock = pending;
  pending = null;
  last = Date.now();
  saveDoc(`benchStock/${account.user.uid}`, { stock, updatedAt: Date.now() }, { merge: false, skipIfUnchanged: true }).catch(() => {});
}
export function keepStock(stock, now = false) {
  if (!account.user) return;
  pending = { ...stock };
  if (now) return flush();
  if (!timer) timer = setTimeout(flush, Math.max(1500, 20000 - (Date.now() - last)));
}
window.addEventListener("pagehide", flush);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
