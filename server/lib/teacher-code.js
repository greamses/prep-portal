/**
 * EVERY TEACHER HAS A CODE: six letters and figures (no 0/O/1/I), the same code students use to join the class.
 *   teacherClass/{teacherUid} = { code, teacherName }     classCodes/{code} = { teacherUid, teacherName }
 * A student with no email address signs up with a username and this code (routes/auth.js username-signup),
 * which also puts them in that teacher's class. The code is made the first time it is asked for and kept.
 */
const crypto = require("crypto");
const admin = require("firebase-admin");

const db = () => admin.firestore();
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({ length: 6 }, () => ALPHA[crypto.randomInt(ALPHA.length)]).join("");
const stamp = () => admin.firestore.FieldValue.serverTimestamp();

async function ensureTeacherCode(uid, teacherName = "") {
  const tcRef = db().collection("teacherClass").doc(uid);
  const tc = await tcRef.get();
  if (tc.exists && tc.data().code) return tc.data().code;
  for (let i = 0; i < 8; i++) {
    const code = makeCode();
    const made = await db().runTransaction(async (tx) => {
      const ref = db().collection("classCodes").doc(code);
      if ((await tx.get(ref)).exists) return false;
      tx.set(ref, { teacherUid: uid, teacherName, createdAt: stamp() });
      tx.set(tcRef, { code, teacherName, createdAt: stamp() }, { merge: true });
      return true;
    });
    if (made) return code;
  }
  throw new Error("Could not make a teacher code. Try again.");
}

/** The teacher a code belongs to, or null. */
async function teacherOf(code) {
  const c = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== 6) return null;
  const d = await db().collection("classCodes").doc(c).get();
  return d.exists ? { code: c, uid: d.data().teacherUid, name: d.data().teacherName || "your teacher" } : null;
}

module.exports = { ensureTeacherCode, teacherOf };
