/**
 * Taking a task out for good: an assigned workbook or a shared paper, with everything that hangs off it.
 * Used by the administrator's old-task clean-up (routes/classes.js) and by a teacher deleting their own
 * work from My exams (routes/exams.js), so the two can never disagree about what "deleted" means.
 */

const KINDS = {
  workbook: { col: "workbookAssignments", item: (c) => `wb_${c}`, owner: "teacherUid" },
  paper: { col: "sharedPapers", item: (c) => `paper_${c}`, owner: "ownerUid" },
};

/**
 * Delete the task, its scores, each student's copy and notice, and the teacher's result notices.
 * Returns false if there was no such task. `mayDelete(ownerUid)` may refuse (a teacher may only
 * delete their own): then it returns "forbidden" and nothing is touched.
 */
async function deleteTask(db, kind, code, mayDelete = () => true) {
  const k = KINDS[kind];
  const ref = db.collection(k.col).doc(code);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const a = snap.data();
  const owner = a.teacherUid || a.ownerUid;
  if (!mayDelete(owner)) return "forbidden";
  const results = await ref.collection("results").get();
  /* everyone who has it in their list: those who sent a score, and the owner's whole class */
  const who = new Set(results.docs.map((d) => d.id));
  if (owner) (await db.collection("teacherStudents").doc(owner).collection("roster").get()).docs.forEach((d) => who.add(d.id));
  const refs = [...results.docs.map((d) => d.ref)];
  who.forEach((uid) => {
    refs.push(db.collection("studentAssignments").doc(uid).collection("items").doc(k.item(code)));
    refs.push(db.collection("studentNotices").doc(uid).collection("items").doc(`task_${kind}_${code}`));
  });
  if (owner) {
    const notes = await db.collection("teacherNotices").doc(owner).collection("items").where("code", "==", code).get();
    notes.docs.forEach((d) => refs.push(d.ref));
  }
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  await ref.delete();
  return true;
}

module.exports = { KINDS, deleteTask };
