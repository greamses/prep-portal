/**
 * Printing a workbook — who is allowed to.
 *
 * Printing used to be sold per workbook: ₦5,000 bought the right to print ONE
 * exact set of questions, keyed by a SHA-256 of the content options, for good.
 * That is gone. Printing is now part of the subscription — a subscriber prints
 * every workbook, as often as they like — so all that is left here is the list
 * of workbooks and the name that goes in the footer of a printed page.
 *
 * TWO THINGS SURVIVE THE REMOVAL and must not be deleted with the rest:
 *
 *   · `isPrintCharge`. Old ₦5,000 print charges are real transactions sitting
 *     in Paystack's history, and a re-delivered webhook for one must still
 *     never be read as a subscription payment. routes/payments.js checks this
 *     before it grants anything, and it has to go on being able to;
 *   · the `workbookPrints` and `workbookOrders` collections. Nothing writes
 *     them any more; they are the record of what people actually paid, and
 *     firestore.rules still keeps them server-only.
 */

const admin = require("firebase-admin");

const KIND = "workbook-print";

/* The printable workbooks. Printing any of them needs a subscription; the
   feature id below is the gate, and it is per workbook because the site's
   feature registry already has one part per workbook page. */
const WORKBOOKS = {
  "maths-workbook": "Maths Workbook",
  "geometry-workbook": "Geometry Workbook",
  "algebra-workbook": "Algebra Workbook",
  "statistics-workbook": "Statistics Workbook",
};
const FEATURE = "prep-math-activities";

const db = () => admin.firestore();

function normalizeMeta(meta) {
  if (!meta) return {};
  if (typeof meta === "string") { try { return JSON.parse(meta); } catch (_) { return {}; } }
  return meta;
}

const isPrintCharge = (tx) => normalizeMeta(tx && tx.metadata).kind === KIND;
const validWorkbook = (w) => Object.prototype.hasOwnProperty.call(WORKBOOKS, w);

/** The name printed in the footer of every page, so a copy that travels says whose it was. */
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

module.exports = { KIND, WORKBOOKS, FEATURE, normalizeMeta, isPrintCharge, validWorkbook, buyerName };
