/* ============================================================================
   WHERE A FILM IS KEPT — the draft and the published copy
   ----------------------------------------------------------------------------
   One Firestore document per film:

       filmDocs/{filmId} = { draft: "<json>", published: "<json>", updatedAt }

   TWO COPIES, AND THAT IS THE POINT. The words PrepBot says are read out to
   children, so a half-written line must not be able to reach one. The admin
   is served the DRAFT and everybody else the PUBLISHED copy, so a film can be
   worked on in the open — on the real television, at the real size, with the
   real voice — and only becomes the lesson when Publish is pressed.

   The document is stored as a JSON STRING rather than as a Firestore map. It
   is written and read whole, it is never queried by field, and a string
   cannot be half-merged by a retry.

   Reads are public (firestore.rules); writes are admin-only, and the admin
   check here is a tidy-up, not the lock.
   ========================================================================== */

import { normalise } from "./filmdoc.js";

const ADMIN_EMAIL = "eemadanyel@gmail.com";

let fb = null;
/** Firebase, fetched once and only when a film is actually asked for. */
async function firebase() {
  if (fb) return fb;
  const [{ auth, db }, store] = await Promise.all([
    import("/firebase-init.js"),
    import("firebase/firestore"),
  ]);
  fb = { auth, db, ...store };
  return fb;
}

/**
 * WHO IS SIGNED IN, ONCE FIREBASE HAS DECIDED.
 *
 * `auth.currentUser` is null for the first moment of every page while the
 * token is checked, so asking it straight away answers "nobody" even for the
 * admin — the films index would show its sorry-not-you line and the TV would
 * have no edit key. So the first answer is waited for, once, and kept.
 */
let who = null;
function user() {
  if (!who) {
    who = (async () => {
      const { auth } = await firebase();
      if (auth?.currentUser) return auth.currentUser;
      return new Promise((done) => {
        let off = () => {};
        /* a page with no account never calls back with anybody: give up
           rather than leave the caller waiting for ever */
        const giveUp = setTimeout(() => { off(); done(null); }, 6000);
        off = auth.onAuthStateChanged((u) => { clearTimeout(giveUp); off(); done(u || null); });
      });
    })().catch(() => null);
  }
  return who;
}

/** True once the signed-in account is the one allowed to edit films. */
export async function isFilmAdmin() {
  const u = await user();
  return !!(u && u.email === ADMIN_EMAIL);
}

const cache = new Map();          // filmId -> Promise<{ draft, published } | null>

function read(id) {
  if (!cache.has(id)) {
    cache.set(id, (async () => {
      try {
        const { db, doc, getDoc } = await firebase();
        const snap = await getDoc(doc(db, "filmDocs", id));
        return snap.exists() ? (snap.data() || {}) : {};
      } catch { return {}; }
    })());
  }
  return cache.get(id);
}

const parse = (s) => {
  if (!s || typeof s !== "string") return null;
  try { return normalise(JSON.parse(s)); } catch { return null; }
};

/**
 * The film to PLAY for whoever is watching: the admin's own draft if there is
 * one, otherwise what has been published. Null means "there is no document —
 * play the coded film".
 */
export async function filmToPlay(id) {
  const row = await read(id);
  if (!row) return null;
  if (await isFilmAdmin()) {
    const draft = parse(row.draft);
    if (draft) return { doc: draft, which: "draft" };
  }
  const live = parse(row.published);
  return live ? { doc: live, which: "published" } : null;
}

/** Both copies, for the editor. */
export async function filmBoth(id) {
  const row = await read(id);
  return { draft: parse(row?.draft), published: parse(row?.published) };
}

async function write(id, patch) {
  const { db, doc, setDoc, serverTimestamp } = await firebase();
  await setDoc(doc(db, "filmDocs", id), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
  const row = await read(id);
  Object.assign(row, patch);
}

/** Keep working on it. Nobody else sees this. */
export const saveDraft = (id, doc) => write(id, { draft: JSON.stringify(doc) });

/** Make it the lesson. The draft is kept, so editing can go straight on. */
export const publish = (id, doc) => write(id, { draft: JSON.stringify(doc), published: JSON.stringify(doc) });

/** Take the document away entirely: the coded film plays again. */
export const unpublish = (id) => write(id, { published: "" });

/**
 * EVERY FILM THAT HAS A DOCUMENT, for the index to list beside the coded ones
 * (admin/films). It reads the whole little collection in one go — there are
 * tens of films, not thousands — and says only what the index needs: whether
 * there is a draft, whether it is published, and what it is called.
 */
export async function allFilms() {
  try {
    const { db, collection, getDocs } = await firebase();
    const snap = await getDocs(collection(db, "filmDocs"));
    const out = new Map();
    snap.forEach((d) => {
      const row = d.data() || {};
      const doc = parse(row.draft) || parse(row.published);
      out.set(d.id, {
        draft: !!parse(row.draft),
        published: !!parse(row.published),
        title: doc?.title || "",
        beats: doc?.steps?.length || 0,
      });
    });
    return out;
  } catch { return new Map(); }
}

/** Forget what is cached for a film — after a write from another tab. */
export const forget = (id) => cache.delete(id);
