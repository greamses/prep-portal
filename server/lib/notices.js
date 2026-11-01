/**
 * Notices for the bell.
 *
 * A student's notices live in a SUBcollection (studentNotices/{uid}/items), like
 * their assignments, so no client rule can read them: the bell asks the server
 * (/api/classes/bell). A notice is one line the person should see: a task they
 * were set, or a result that went in.
 *
 *   { kind: "task" | "result", title, text, url, from, at, seen: false }
 *
 * `id` makes a notice replace itself (one per student per task: re-assigning,
 * or checking a paper eight times, must not bury the bell in copies).
 */

const admin = require("firebase-admin");
const { sendOut } = require("./notify-out");

const db = () => admin.firestore();
const stamp = () => admin.firestore.FieldValue.serverTimestamp();

const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

function shape(n) {
  return {
    kind: n.kind === "result" ? "result" : "task",
    title: clip(n.title, 120) || "Notice",
    text: clip(n.text, 240),
    url: clip(n.url, 300),
    from: clip(n.from, 80),
    at: stamp(),
    seen: false,
  };
}

/** Tell these students. Failures are swallowed: a missed notice must never fail an assignment.
 *  out: { push, mail }  also send it as a push notification to their devices, and/or an email (notify-out.js). Off by default:
 *  a notice about something the student has just done on the page in front of them needs neither. */
async function notifyStudents(uids, n, id = null, out = null) {
  try {
    const list = [...new Set((uids || []).map(String))].filter(Boolean);
    for (let i = 0; i < list.length; i += 400) {
      const batch = db().batch();
      list.slice(i, i + 400).forEach((uid) => {
        const col = db().collection("studentNotices").doc(uid).collection("items");
        batch.set(id ? col.doc(id) : col.doc(), shape(n));
      });
      await batch.commit();
    }
  } catch (e) {
    console.error("[notices]", e.message);
  }
  if (out && (out.push || out.mail)) await sendOut(uids, shape(n), { push: !!out.push, mail: !!out.mail, tag: id || "" });
}

module.exports = { notifyStudents };
