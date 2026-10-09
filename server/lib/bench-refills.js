/**
 * Chemistry Bench refills — a pack of ten, paid for through Paystack.
 *
 * The bench itself is free. A stock bottle or jar on it holds only so much, and
 * when one runs out it is refilled with a REFILL: one refill fills any one
 * bottle. Refills are sold ten at a time, and the count is kept here, on the
 * server, in `benchRefills/{uid}` — the browser can neither grant itself any
 * nor spend one without asking.
 *
 * The same shape as a tutor booking (lib/tutor-bookings.js):
 *   1. the browser asks for an order;
 *   2. the SERVER prices it from PACK and files `benchRefillOrders/{ref}`;
 *   3. the browser pays that reference, that amount;
 *   4. the refills are added only from a charge WE verified with Paystack, for
 *      at least the order's price, in naira — by the browser's verify or by the
 *      webhook, whichever arrives first. Idempotent on the reference.
 *
 * These charges carry `kind: "bench-refills"` in their metadata, and the
 * subscription path (routes/payments.js) never counts one as premium.
 * The admin has no count: an admin's refill is always granted.
 */

const crypto = require("crypto");
const admin = require("firebase-admin");

const KIND = "bench-refills";

/* Mirrors PACK in /virtual-lab/chemistry-2d/js/account.js — the price a
   learner is shown. Change one, change both: the server charges what THIS says. */
const PACK = { refills: 10, naira: 1000 };

const db = () => admin.firestore();
const stamp = () => admin.firestore.FieldValue.serverTimestamp();
const inc = (n) => admin.firestore.FieldValue.increment(n);

function normalizeMeta(meta) {
  if (!meta) return {};
  if (typeof meta === "string") { try { return JSON.parse(meta); } catch (_) { return {}; } }
  return meta;
}

const isRefillCharge = (tx) => normalizeMeta(tx && tx.metadata).kind === KIND;

/** How many refills an account has left. */
async function balance(uid) {
  const snap = await db().collection("benchRefills").doc(uid).get();
  return snap.exists ? Math.max(0, Number(snap.data().left) || 0) : 0;
}

/** Open an order the browser will ask Paystack to charge for. */
async function openOrder({ uid, email }) {
  const reference = `pp_refill_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  await db().collection("benchRefillOrders").doc(reference).set({
    uid, email: email || null,
    refills: PACK.refills,
    amountKobo: PACK.naira * 100,
    status: "pending",
    createdAt: stamp(),
  });
  return { reference, amountKobo: PACK.naira * 100, refills: PACK.refills, kind: KIND };
}

/**
 * Turn a verified Paystack transaction into refills. `asUid`, when given, is
 * the signed-in caller and must own the order (the browser path); the webhook
 * passes none and trusts the order it finds.
 */
async function applyRefillCharge(tx, asUid = null) {
  const reference = tx && tx.reference;
  if (!reference) return { ok: false, error: "No reference." };
  if (tx.status !== "success") return { ok: false, error: "Payment not successful." };
  if (String(tx.currency || "").toUpperCase() !== "NGN") return { ok: false, error: "The payment was not in naira." };

  const orderRef = db().collection("benchRefillOrders").doc(String(reference));
  const evRef = db().collection("paymentEvents").doc(String(reference));

  return await db().runTransaction(async (t) => {
    const orderSnap = await t.get(orderRef);
    if (!orderSnap.exists) return { ok: false, error: "Unknown refill order." };
    const order = orderSnap.data();
    if (asUid && order.uid !== asUid) return { ok: false, error: "This order belongs to another account." };
    if ((Number(tx.amount) || 0) < order.amountKobo) {
      return { ok: false, error: "The amount paid is less than the price of the refills." };
    }
    const walletRef = db().collection("benchRefills").doc(order.uid);
    const walletSnap = await t.get(walletRef);
    const had = walletSnap.exists ? Math.max(0, Number(walletSnap.data().left) || 0) : 0;
    if (order.status === "paid") return { ok: true, already: true, left: had };

    t.set(walletRef, { left: had + order.refills, bought: inc(order.refills), updatedAt: stamp() }, { merge: true });
    t.set(orderRef, { status: "paid", paidAt: stamp() }, { merge: true });
    t.set(evRef, {
      kind: KIND, uid: order.uid, reference,
      email: (tx.customer && tx.customer.email) || order.email || null,
      amountKobo: Number(tx.amount) || 0, refills: order.refills,
      processedAt: stamp(),
    });
    return { ok: true, left: had + order.refills, added: order.refills };
  });
}

/** Spend one refill. Resolves to { ok, left } or { ok: false, left: 0 }. */
async function useOne(uid) {
  const ref = db().collection("benchRefills").doc(uid);
  return await db().runTransaction(async (t) => {
    const snap = await t.get(ref);
    const left = snap.exists ? Math.max(0, Number(snap.data().left) || 0) : 0;
    if (left < 1) return { ok: false, left: 0, error: "You have no refills left." };
    t.set(ref, { left: left - 1, used: inc(1), updatedAt: stamp() }, { merge: true });
    return { ok: true, left: left - 1 };
  });
}

module.exports = { KIND, PACK, isRefillCharge, balance, openOrder, applyRefillCharge, useOne };
