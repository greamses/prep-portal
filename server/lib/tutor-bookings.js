/**
 * Tutor bookings — a block of one-to-one sessions, paid for through Paystack.
 *
 * The browser used to write `tutor-bookings/{ref}` itself from the Paystack
 * callback, with whatever package, sessions and amount it said. The rules only
 * let the admin write there, so every real booking was refused — and had they
 * allowed it, anyone could have booked sessions without paying.
 *
 * Now it is the same shape as a workbook print (lib/workbook-prints.js):
 *   1. the browser asks for an order — package, sessions per child, children;
 *   2. the SERVER prices it from its own table and files `tutorOrders/{ref}`;
 *   3. the browser pays that reference, that amount;
 *   4. the booking is written only from a charge WE verified with Paystack,
 *      for at least the order's price, in naira — by the browser's verify or
 *      by the webhook, whichever arrives first. Idempotent on the reference.
 *
 * These charges carry `kind: "tutor-booking"` in their metadata, and the
 * subscription path (routes/payments.js) never counts one as premium.
 */

const crypto = require("crypto");
const admin = require("firebase-admin");

const KIND = "tutor-booking";

/* Mirrors TUTOR_PACKAGES in /subscribe.js — the prices a parent is shown.
   Change one, change both: the server charges what THIS table says. */
const PACKAGES = {
  "math-only":    { name: "Mathematics",     tagline: "Maths only",                ratePerHour: 8000 },
  "math-science": { name: "Maths + Science", tagline: "Maths & one Science",       ratePerHour: 10000 },
  "math-english": { name: "Maths + English", tagline: "Maths & English",           ratePerHour: 12000 },
  "all-subjects": { name: "All Subjects",    tagline: "Maths · English · Science", ratePerHour: 15000 },
};
const SESSIONS = [4, 8, 12];
const MAX_CHILDREN = 10;

const db = () => admin.firestore();
const stamp = () => admin.firestore.FieldValue.serverTimestamp();

function normalizeMeta(meta) {
  if (!meta) return {};
  if (typeof meta === "string") { try { return JSON.parse(meta); } catch (_) { return {}; } }
  return meta;
}

const isTutorCharge = (tx) => normalizeMeta(tx && tx.metadata).kind === KIND;

/* The first child at the full rate, each extra child 5% off — in naira, the
   same arithmetic as the page. */
function priceOf(ratePerHour, sessions, children) {
  const extra = Math.round(ratePerHour * 0.95);
  return ratePerHour * sessions + extra * sessions * (children - 1);
}

/** Why this request cannot be an order, or null. */
function problemWith({ packageId, sessions, children }) {
  if (!Object.prototype.hasOwnProperty.call(PACKAGES, packageId)) return "Unknown package.";
  if (!SESSIONS.includes(sessions)) return `Sessions per child must be ${SESSIONS.join(", ")}.`;
  if (!Number.isInteger(children) || children < 1 || children > MAX_CHILDREN) {
    return `Children must be 1 to ${MAX_CHILDREN}.`;
  }
  return null;
}

/** Open an order the browser will ask Paystack to charge for. */
async function openOrder({ uid, email, packageId, sessions, children }) {
  const pkg = PACKAGES[packageId];
  const totalNaira = priceOf(pkg.ratePerHour, sessions, children);
  const reference = `pp_tutor_${packageId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  await db().collection("tutorOrders").doc(reference).set({
    uid, email: email || null, packageId, sessions, children,
    amountKobo: totalNaira * 100,
    status: "pending",
    createdAt: stamp(),
  });
  return { reference, amountKobo: totalNaira * 100, kind: KIND };
}

/**
 * Turn a verified Paystack transaction into a booking. `asUid`, when given, is
 * the signed-in caller and must own the order (the browser path); the webhook
 * passes none and trusts the order it finds.
 */
async function applyTutorCharge(tx, asUid = null) {
  const reference = tx && tx.reference;
  if (!reference) return { ok: false, error: "No reference." };
  if (tx.status !== "success") return { ok: false, error: "Payment not successful." };
  if (String(tx.currency || "").toUpperCase() !== "NGN") return { ok: false, error: "The payment was not in naira." };

  const orderRef = db().collection("tutorOrders").doc(String(reference));
  const bookRef = db().collection("tutor-bookings").doc(String(reference));
  const evRef = db().collection("paymentEvents").doc(String(reference));

  return await db().runTransaction(async (t) => {
    const orderSnap = await t.get(orderRef);
    if (!orderSnap.exists) return { ok: false, error: "Unknown booking order." };
    const order = orderSnap.data();
    if (asUid && order.uid !== asUid) return { ok: false, error: "This booking belongs to another account." };
    if ((Number(tx.amount) || 0) < order.amountKobo) {
      return { ok: false, error: "The amount paid is less than the booking's price." };
    }

    const bookSnap = await t.get(bookRef);
    const pkg = PACKAGES[order.packageId];
    const summary = { sessions: order.sessions, children: order.children, packageName: pkg.name };
    if (bookSnap.exists) return { ok: true, already: true, ...summary };

    const email = (tx.customer && tx.customer.email) || order.email || null;
    const amountNaira = Math.round((Number(tx.amount) || 0) / 100);
    t.set(bookRef, {
      userId: order.uid,
      email,
      packageId: order.packageId,
      packageName: pkg.name,
      subjects: pkg.tagline,
      ratePerHour: pkg.ratePerHour,
      sessionsPerChild: order.sessions,
      childCount: order.children,
      sessionsRemaining: order.sessions * order.children,
      amountPaid: amountNaira,
      paymentRef: reference,
      status: "active",
      purchasedAt: new Date().toISOString(),
      verifiedAt: stamp(),
    });
    t.set(orderRef, { status: "paid", paidAt: stamp() }, { merge: true });
    t.set(evRef, {
      kind: KIND, uid: order.uid, reference, email,
      amountKobo: Number(tx.amount) || 0, packageId: order.packageId,
      processedAt: stamp(),
    });
    return { ok: true, ...summary };
  });
}

module.exports = {
  KIND, PACKAGES, SESSIONS, MAX_CHILDREN,
  isTutorCharge, priceOf, problemWith, openOrder, applyTutorCharge,
};
