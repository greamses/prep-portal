/**
 * Workbook print passes — ₦5,000 buys the right to print ONE exact workbook.
 *
 * "Exact" is a key the browser computes: SHA-256 of the workbook's content
 * options (the sections and counts, the seed code, the level and help dials),
 * leaving out the cosmetic ones (title, paper size, name line, answer key on
 * or off). The same key is the same questions in the same order, so a paid
 * workbook can be printed again next week — and re-rolling or adding a
 * section is a different workbook, and a different pass.
 *
 * Money is only ever believed from Paystack. A pass is granted from a charge
 * WE verified, for at least the price, in naira, against an order this user
 * opened — and the grant is idempotent on the transaction reference, so the
 * browser's verify and Paystack's webhook can both arrive and only one counts.
 *
 * These charges are marked `kind: "workbook-print"` in their metadata. The
 * subscription path (routes/payments.js) must never see one as a premium
 * payment; it checks `isPrintCharge` before it does anything.
 */

const crypto = require("crypto");
const admin = require("firebase-admin");

const PRICE_KOBO = 500000; // ₦5,000
const KIND = "workbook-print";

/* The workbooks that are sold per print. Anything else prints free. */
const WORKBOOKS = {
  "maths-workbook": "Maths Workbook",
  "geometry-workbook": "Geometry Workbook",
};

const db = () => admin.firestore();
const stamp = () => admin.firestore.FieldValue.serverTimestamp();

function normalizeMeta(meta) {
  if (!meta) return {};
  if (typeof meta === "string") { try { return JSON.parse(meta); } catch (_) { return {}; } }
  return meta;
}

const isPrintCharge = (tx) => normalizeMeta(tx && tx.metadata).kind === KIND;
const validKey = (k) => typeof k === "string" && /^[a-f0-9]{64}$/.test(k);
const validWorkbook = (w) => Object.prototype.hasOwnProperty.call(WORKBOOKS, w);
const passId = (uid, workbook, key) => `${uid}_${workbook}_${key}`;

/* A code a person can read off the foot of a printed page and quote back:
   six characters from the reference, no 0/O/1/I. */
function orderCode(reference) {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const h = crypto.createHash("sha256").update(String(reference)).digest();
  let s = "";
  for (let i = 0; i < 6; i++) s += A[h[i] % A.length];
  return `WB-${s}`;
}

async function buyerName(uid, email) {
  try {
    const u = (await db().collection("users").doc(uid).get()).data() || {};
    const name = u.displayName || u.name || u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ");
    if (name) return String(name).slice(0, 60);
  } catch (_) {}
  try {
    const a = await admin.auth().getUser(uid);
    if (a.displayName) return a.displayName.slice(0, 60);
  } catch (_) {}
  return email ? String(email).split("@")[0] : "Prep Portal user";
}

/** The pass for this user and workbook, or null. */
async function findPass(uid, workbook, key) {
  const snap = await db().collection("workbookPrints").doc(passId(uid, workbook, key)).get();
  if (!snap.exists) return null;
  const d = snap.data();
  return { buyer: d.buyerName, order: d.orderCode, paidAt: d.paidAt ? d.paidAt.toMillis() : null };
}

/** Open an order: what the browser will ask Paystack to charge for. */
async function openOrder({ uid, email, workbook, key, summary }) {
  const reference = `wbp_${workbook.split("-")[0]}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  await db().collection("workbookOrders").doc(reference).set({
    uid, email: email || null, workbook, key,
    summary: String(summary || "").slice(0, 300),
    amountKobo: PRICE_KOBO,
    status: "pending",
    createdAt: stamp(),
  });
  return { reference, amountKobo: PRICE_KOBO };
}

/**
 * Turn a verified Paystack transaction into a pass. Idempotent on the
 * reference. `asUid`, when given, is the signed-in caller and must own the
 * order (the browser path); the webhook passes none and trusts the order.
 */
async function applyPrintCharge(tx, asUid = null) {
  const reference = tx && tx.reference;
  if (!reference) return { ok: false, error: "No reference." };
  if (tx.status !== "success") return { ok: false, error: "Payment not successful." };
  if (String(tx.currency || "NGN").toUpperCase() !== "NGN") return { ok: false, error: "Wrong currency." };
  if ((Number(tx.amount) || 0) < PRICE_KOBO) return { ok: false, error: "Amount is less than the price." };

  const orderRef = db().collection("workbookOrders").doc(String(reference));
  const evRef = db().collection("paymentEvents").doc(String(reference));

  return await db().runTransaction(async (t) => {
    const orderSnap = await t.get(orderRef);
    if (!orderSnap.exists) return { ok: false, error: "Unknown order." };
    const order = orderSnap.data();
    if (asUid && order.uid !== asUid) return { ok: false, error: "This order belongs to another account." };

    const pRef = db().collection("workbookPrints").doc(passId(order.uid, order.workbook, order.key));
    const [evSnap, pSnap] = [await t.get(evRef), await t.get(pRef)];
    if (evSnap.exists && pSnap.exists) {
      const d = pSnap.data();
      return { ok: true, already: true, workbook: order.workbook, key: order.key, buyer: d.buyerName, order: d.orderCode };
    }

    const email = (tx.customer && tx.customer.email) || order.email || null;
    const name = await buyerName(order.uid, email);
    const code = orderCode(reference);

    t.set(pRef, {
      uid: order.uid, email, workbook: order.workbook, key: order.key,
      summary: order.summary || "",
      reference, amountKobo: Number(tx.amount) || PRICE_KOBO,
      buyerName: name, orderCode: code,
      paidAt: stamp(),
    });
    t.set(orderRef, { status: "paid", paidAt: stamp() }, { merge: true });
    t.set(evRef, {
      kind: KIND, uid: order.uid, reference, email,
      amountKobo: Number(tx.amount) || 0, workbook: order.workbook,
      processedAt: stamp(),
    });
    return { ok: true, workbook: order.workbook, key: order.key, buyer: name, order: code };
  });
}

/** Ask Paystack whether a reference really succeeded. The tx, or null. */
async function paystackVerify(reference) {
  const SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!SECRET) throw new Error("Paystack not configured");
  const r = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${SECRET}` } }
  );
  const j = await r.json().catch(() => null);
  return j && j.status && j.data ? j.data : null;
}

module.exports = {
  PRICE_KOBO, KIND, WORKBOOKS,
  normalizeMeta, isPrintCharge, validKey, validWorkbook,
  findPass, openOrder, applyPrintCharge, buyerName, paystackVerify,
};
