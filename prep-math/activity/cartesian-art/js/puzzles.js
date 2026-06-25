/* ============================================================================
   Cartesian Art — puzzle store (Firestore)
   ----------------------------------------------------------------------------
   CRUD for the `cartesianArt` collection. Reads are open to any signed-in
   learner; writes are admin-only (enforced by firestore.rules — the client
   check here is just UX). One puzzle doc:
     { title, prompt, difficulty, grid:{xMin,xMax,yMin,yMax},
       points:[{x,y}], closed, authorEmail, createdAt, updatedAt }
   ========================================================================== */

import { db, auth } from "/firebase-init.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export const ADMIN_EMAIL = "eemadanyel@gmail.com";

export function isAdminUser(user = auth.currentUser) {
  return !!(user && user.email === ADMIN_EMAIL);
}

const COL = "cartesianArt";

/** All puzzles, newest first. */
export async function listPuzzles() {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** One puzzle by id, or null. */
export async function getPuzzle(id) {
  const d = await getDoc(doc(db, COL, id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

/** Create (no id) or overwrite (id) a puzzle. Returns the id. Admin only. */
export async function savePuzzle(data, id = null) {
  const payload = {
    title: String(data.title || "Untitled").slice(0, 120),
    prompt: String(data.prompt || "").slice(0, 400),
    difficulty: data.difficulty || "easy",
    grid: data.grid,
    shapes: data.shapes || null,
    points: data.points || [],
    closed: !!data.closed,
    authorEmail: auth.currentUser?.email || null,
    updatedAt: serverTimestamp(),
  };
  if (id) {
    await setDoc(doc(db, COL, id), payload, { merge: true });
    return id;
  }
  payload.createdAt = serverTimestamp();
  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

/** Delete a puzzle. Admin only. */
export async function deletePuzzle(id) {
  await deleteDoc(doc(db, COL, id));
}
