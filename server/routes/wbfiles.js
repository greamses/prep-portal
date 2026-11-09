/**
 * MY WORKBOOKS — a teacher's (or anyone's) saved workbooks, in folders.
 *
 * A saved workbook is a printable workbook's settings, kept under a name: the
 * exercises and how many of each, the title, the paper, the code that makes
 * the same questions again, the page's own choices. Opening one puts those
 * settings back on its page. The file explorer (utils/components/file-explorer.js)
 * shows them, one tree per workbook, folders inside as deep as wanted.
 *
 *   workbookFiles/{uid}                 { folders: { [wb]: [path, …] } }
 *   workbookFiles/{uid}/files/{id}      { name, wb, wbName, url, store, settings, folder, count, savedAt }
 *
 *   GET    /api/wbfiles                          every file (without settings) + folders
 *   GET    /api/wbfiles/:id                      one file, with its settings
 *   POST   /api/wbfiles                          { name, wb, wbName, url, store, settings, folder, count } save (a name in a workbook replaces)
 *   POST   /api/wbfiles/move                     { ids, folder }
 *   POST   /api/wbfiles/:id/rename               { name } → { id, name }
 *   POST   /api/wbfiles/:id/copy                 { folder } → { id, name }
 *   DELETE /api/wbfiles/:id
 *   POST   /api/wbfiles/folders                  { wb, path }
 *   POST   /api/wbfiles/folders/move             { wb, from, to }
 *   DELETE /api/wbfiles/folders                  { wb, path, recursive }
 *
 * Only the server touches these (the rules' admin catch-all keeps the browser out).
 */
const express = require("express");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { authenticate } = require("../middleware/auth");

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const shelf = (uid) => db().collection("workbookFiles").doc(uid);
  const filesOf = (uid) => shelf(uid).collection("files");
  const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
  const clip = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
  const wbKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9-]+/g, "").slice(0, 60);
  const cleanPath = (p) => String(p || "").split("/").map((x) => x.replace(/\s+/g, " ").trim().slice(0, 60)).filter(Boolean).slice(0, 6).join("/");
  const under = (f, p) => f === p || f.startsWith(p + "/");
  const idOf = (wb, name) => crypto.createHash("sha1").update(`${wb}|${String(name).trim().toLowerCase()}`).digest("hex").slice(0, 24);
  const meta = (d) => { const x = d.data(); return { id: d.id, name: x.name, wb: x.wb, wbName: x.wbName || x.wb, url: x.url || "", store: x.store || "", folder: x.folder || "", count: x.count || 0, savedAt: ms(x.savedAt) }; };
  const guard = (fn) => async (req, res) => {
    try { await fn(req, res); } catch (e) {
      console.error("[/api/wbfiles]", e.message);
      res.status(500).json({ error: "My workbooks could not be reached." });
    }
  };
  const inWb = async (uid, wb) => (await filesOf(uid).where("wb", "==", wb).limit(500).get()).docs;
  async function freeName(uid, wb, want) {
    let name = want, n = 2;
    while ((await filesOf(uid).doc(idOf(wb, name)).get()).exists && n < 50) name = `${want} (${n++})`;
    return name;
  }

  router.get("/", authenticate, guard(async (req, res) => {
    const [snap, sh] = await Promise.all([filesOf(req.user.uid).orderBy("savedAt", "desc").limit(500).get(), shelf(req.user.uid).get()]);
    res.json({ ok: true, files: snap.docs.map(meta), folders: (sh.exists && sh.data().folders) || {} });
  }));

  router.get("/:id", authenticate, guard(async (req, res) => {
    if (["folders", "move"].includes(req.params.id)) return res.status(404).end();
    const d = await filesOf(req.user.uid).doc(String(req.params.id)).get();
    if (!d.exists) return res.status(404).json({ error: "That workbook is not there any more." });
    res.json({ ok: true, file: { ...meta(d), settings: d.data().settings || "{}" } });
  }));

  router.post("/", authenticate, guard(async (req, res) => {
    const b = req.body || {};
    const name = clip(b.name, 100), wb = wbKey(b.wb);
    if (!name) return res.status(400).json({ error: "Give the workbook a name." });
    if (!wb) return res.status(400).json({ error: "Which workbook?" });
    const settings = typeof b.settings === "string" ? b.settings : JSON.stringify(b.settings || {});
    if (settings.length > 200000) return res.status(400).json({ error: "Those settings are too big to keep." });
    const url = String(b.url || "").startsWith("/") ? String(b.url).slice(0, 200) : "";
    const id = idOf(wb, name), ref = filesOf(req.user.uid).doc(id);
    const had = (await ref.get()).exists;
    await ref.set({
      name, wb, wbName: clip(b.wbName, 80) || wb, url, store: clip(b.store, 80), settings,
      folder: cleanPath(b.folder), count: Math.max(0, Math.min(10000, Math.round(Number(b.count)) || 0)),
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ ok: true, id, name, replaced: had });
  }));

  router.post("/move", authenticate, guard(async (req, res) => {
    const ids = (Array.isArray(req.body && req.body.ids) ? req.body.ids : []).slice(0, 300).map(String);
    const folder = cleanPath(req.body && req.body.folder);
    const batch = db().batch();
    ids.forEach((id) => batch.set(filesOf(req.user.uid).doc(id), { folder }, { merge: true }));
    if (ids.length) await batch.commit();
    res.json({ ok: true, moved: ids.length });
  }));

  router.post("/folders", authenticate, guard(async (req, res) => {
    const wb = wbKey(req.body && req.body.wb), path = cleanPath(req.body && req.body.path);
    if (!wb || !path) return res.status(400).json({ error: "Name the folder." });
    const parts = path.split("/"), all = parts.map((_, i) => parts.slice(0, i + 1).join("/"));
    await shelf(req.user.uid).set({ folders: { [wb]: admin.firestore.FieldValue.arrayUnion(...all) } }, { merge: true });
    res.json({ ok: true, path });
  }));

  router.post("/folders/move", authenticate, guard(async (req, res) => {
    const wb = wbKey(req.body && req.body.wb);
    const from = cleanPath(req.body && req.body.from), to = cleanPath(req.body && req.body.to);
    if (!wb || !from || !to) return res.status(400).json({ error: "Which folder, and where to?" });
    if (to === from) return res.json({ ok: true, path: to });
    if (to.startsWith(from + "/")) return res.status(400).json({ error: "A folder cannot go inside itself." });
    const sh = await shelf(req.user.uid).get();
    const list = (sh.exists && sh.data().folders && sh.data().folders[wb]) || [];
    if (list.includes(to)) return res.status(409).json({ error: "There is a folder of that name there already." });
    const swap = (f) => (under(f, from) ? to + f.slice(from.length) : f);
    const parts = to.split("/"), above = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("/"));
    const inside = (await inWb(req.user.uid, wb)).filter((d) => under(d.data().folder || "", from));
    for (let i = 0; i < inside.length; i += 400) {
      const batch = db().batch();
      inside.slice(i, i + 400).forEach((d) => batch.set(d.ref, { folder: swap(d.data().folder || "") }, { merge: true }));
      await batch.commit();
    }
    await shelf(req.user.uid).set({ folders: { [wb]: [...new Set([...list.map(swap), ...above])] } }, { merge: true });
    res.json({ ok: true, path: to, moved: inside.length });
  }));

  router.delete("/folders", authenticate, guard(async (req, res) => {
    const wb = wbKey(req.body && req.body.wb), path = cleanPath(req.body && req.body.path);
    if (!wb || !path) return res.status(400).json({ error: "Which folder?" });
    const sh = await shelf(req.user.uid).get();
    const list = (sh.exists && sh.data().folders && sh.data().folders[wb]) || [];
    const inside = (await inWb(req.user.uid, wb)).filter((d) => under(d.data().folder || "", path));
    if (!(req.body && req.body.recursive) && (list.some((f) => f.startsWith(path + "/")) || inside.length)) return res.status(409).json({ error: "Empty the folder first." });
    for (let i = 0; i < inside.length; i += 400) {
      const batch = db().batch();
      inside.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    const gone = list.filter((f) => under(f, path));
    if (gone.length) await shelf(req.user.uid).set({ folders: { [wb]: admin.firestore.FieldValue.arrayRemove(...gone) } }, { merge: true });
    res.json({ ok: true, files: inside.length, folders: gone.length });
  }));

  router.post("/:id/rename", authenticate, guard(async (req, res) => {
    const ref = filesOf(req.user.uid).doc(String(req.params.id));
    const d = await ref.get();
    if (!d.exists) return res.status(404).json({ error: "That workbook is not there any more." });
    const name = clip(req.body && req.body.name, 100);
    if (!name) return res.status(400).json({ error: "Give it a name." });
    const id = idOf(d.data().wb, name);
    if (id === ref.id) { await ref.set({ name }, { merge: true }); return res.json({ ok: true, id, name }); }
    if ((await filesOf(req.user.uid).doc(id).get()).exists) return res.status(409).json({ error: "There is a workbook of that name already." });
    await filesOf(req.user.uid).doc(id).set({ ...d.data(), name });
    await ref.delete();
    res.json({ ok: true, id, name });
  }));

  router.post("/:id/copy", authenticate, guard(async (req, res) => {
    const d = await filesOf(req.user.uid).doc(String(req.params.id)).get();
    if (!d.exists) return res.status(404).json({ error: "That workbook is not there any more." });
    const x = d.data();
    const name = await freeName(req.user.uid, x.wb, `${x.name} (copy)`.slice(0, 100));
    const id = idOf(x.wb, name);
    await filesOf(req.user.uid).doc(id).set({ ...x, name, folder: cleanPath(req.body && req.body.folder), savedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ ok: true, id, name });
  }));

  router.delete("/:id", authenticate, guard(async (req, res) => {
    await filesOf(req.user.uid).doc(String(req.params.id)).delete();
    res.json({ ok: true });
  }));

  return router;
};
