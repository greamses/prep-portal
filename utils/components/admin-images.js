/* ── ADMIN IMAGE OVERRIDES ────────────────────────────────────────────────
   Lets the admin point any "image slot" at a URL or an uploaded file, while
   everyone else simply sees the result. Reusable across the site (scientist
   portraits today; any puzzle / drill / activity image tomorrow).

   Storage model — one Firestore doc per NAMESPACE:
       imageOverrides/{namespace} = { <slotKey>: <url>, ... }
   so a whole namespace loads in a single read. Uploaded files go to Firebase
   Storage at  imageOverrides/{namespace}/{slotKey}  and the download URL is
   what gets stored. Reads are public; writes are admin-only (firestore.rules).

   Use:
     import { imageOverride, attachImageAdmin } from '/utils/components/admin-images.js';
     const url = await imageOverride('scientists', name);        // read (anyone)
     attachImageAdmin(el, { ns:'scientists', key:name, apply });  // admin editor
*/
import { auth, db, storage } from '/firebase-init.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const ADMIN_EMAIL = 'eemadanyel@gmail.com';
export const isImageAdmin = () => !!(auth.currentUser && auth.currentUser.email === ADMIN_EMAIL);

// A Firestore/Storage-safe slot key.
export const slugKey = (s) =>
  String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';

const nsCache = new Map(); // namespace -> Promise<map>
function loadNamespace(ns) {
  if (!nsCache.has(ns)) {
    nsCache.set(ns, (async () => {
      try {
        const snap = await getDoc(doc(db, 'imageOverrides', ns));
        return snap.exists() ? (snap.data() || {}) : {};
      } catch { return {}; }
    })());
  }
  return nsCache.get(ns);
}

/** The admin-set URL for a slot, or null. Public read, cached per namespace. */
export async function imageOverride(ns, key) {
  const map = await loadNamespace(ns);
  const v = map[slugKey(key)];
  return typeof v === 'string' && v ? v : null;
}

async function writeOverride(ns, key, url) {
  const k = slugKey(key);
  await setDoc(doc(db, 'imageOverrides', ns), { [k]: url || '', updatedAt: serverTimestamp() }, { merge: true });
  const map = await loadNamespace(ns);
  map[k] = url || '';
}

async function uploadImageFile(ns, key, file) {
  const sRef = storageRef(storage, `imageOverrides/${ns}/${slugKey(key)}`);
  await uploadBytes(sRef, file);
  return getDownloadURL(sRef);
}

// ── The admin editor (a pencil + a small popover) ────────────────────────
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const css = `
  .imgadm-host { position: relative; }
  .imgadm-edit {
    position: absolute; right: -6px; bottom: -6px; z-index: 5;
    width: 20px; height: 20px; padding: 0; border: 0; border-radius: 50%;
    display: grid; place-items: center; cursor: pointer;
    background: var(--accent-secondary, #f4c95d); color: #14130f;
    box-shadow: 0 1px 4px rgba(20,19,15,.35);
    opacity: 0; transition: opacity .15s ease;
  }
  .imgadm-host:hover .imgadm-edit, .imgadm-edit:focus-visible { opacity: 1; }
  .imgadm-edit svg { width: 12px; height: 12px; }
  .imgadm-pop {
    position: fixed; z-index: 10000; width: 260px; max-width: calc(100vw - 24px);
    background: var(--surface-primary, #fff); color: var(--ink, #14130f);
    border: 1.5px solid var(--border-subtle, #ddd); border-radius: 12px;
    box-shadow: 0 12px 34px rgba(20,19,15,.3); padding: 12px; font-family: var(--font-mono, monospace);
  }
  .imgadm-pop h4 { margin: 0 0 8px; font-size: .8rem; font-family: var(--font-display, inherit); }
  .imgadm-pop input[type=text] { width: 100%; box-sizing: border-box; padding: .45rem .5rem; font-size: .78rem;
    border: 1.5px solid var(--border-subtle, #ccc); border-radius: 8px; background: var(--app-bg, #fff); color: inherit; }
  .imgadm-row { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .imgadm-btn { font: 600 .74rem var(--font-mono, monospace); padding: .4rem .7rem; border-radius: 999px; border: 0; cursor: pointer;
    background: var(--accent-secondary, #f4c95d); color: #14130f; }
  .imgadm-btn.ghost { background: none; border: 1.5px solid var(--border-subtle, #ccc); color: var(--text-secondary, #666); }
  .imgadm-note { margin: 8px 0 0; font-size: .68rem; color: var(--text-tertiary, #999); min-height: 1em; }
  `;
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
}

const PENCIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

let openPop = null;
function closePop() { if (openPop) { openPop.remove(); openPop = null; document.removeEventListener('click', onDocClick, true); } }
function onDocClick(e) { if (openPop && !openPop.contains(e.target) && !e.target.closest('.imgadm-edit')) closePop(); }

function openEditor(anchor, { ns, key, apply }) {
  closePop();
  const pop = document.createElement('div');
  pop.className = 'imgadm-pop';
  pop.innerHTML = `
    <h4>Set image</h4>
    <input type="text" class="imgadm-url" placeholder="Paste an image URL" spellcheck="false" />
    <div class="imgadm-row">
      <button type="button" class="imgadm-btn imgadm-save">Save link</button>
      <button type="button" class="imgadm-btn ghost imgadm-upload">Upload…</button>
      <button type="button" class="imgadm-btn ghost imgadm-clear">Remove</button>
    </div>
    <input type="file" accept="image/*" class="imgadm-file" hidden />
    <p class="imgadm-note"></p>`;
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.top = `${Math.min(r.bottom + 8, window.innerHeight - pop.offsetHeight - 8)}px`;
  pop.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8))}px`;
  openPop = pop;
  setTimeout(() => document.addEventListener('click', onDocClick, true), 0);

  const note = pop.querySelector('.imgadm-note');
  const urlInput = pop.querySelector('.imgadm-url');
  const done = (url) => { try { apply(url || null); } catch { /* ignore */ } closePop(); };
  const fail = (m) => { note.textContent = m; };

  pop.querySelector('.imgadm-save').addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return fail('Enter a URL or upload a file.');
    note.textContent = 'Saving…';
    try { await writeOverride(ns, key, url); done(url); } catch { fail('Could not save — check you are signed in as admin.'); }
  });
  pop.querySelector('.imgadm-clear').addEventListener('click', async () => {
    note.textContent = 'Removing…';
    try { await writeOverride(ns, key, ''); done(''); } catch { fail('Could not save.'); }
  });
  const file = pop.querySelector('.imgadm-file');
  pop.querySelector('.imgadm-upload').addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    note.textContent = 'Uploading…';
    try {
      const url = await uploadImageFile(ns, key, f);
      await writeOverride(ns, key, url);
      done(url);
    } catch { fail('Upload failed — check Storage rules / admin sign-in.'); }
  });
}

/** Give an element an admin-only "edit image" affordance. No-op for non-admins.
    `apply(url|null)` is called after a successful change so the caller can
    re-render the image in place. */
export function attachImageAdmin(el, { ns, key, apply }) {
  if (!isImageAdmin()) return;
  injectStyles();
  el.classList.add('imgadm-host');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'imgadm-edit';
  btn.title = 'Set image (admin)';
  btn.innerHTML = PENCIL;
  btn.addEventListener('click', (e) => { e.stopPropagation(); openEditor(btn, { ns, key, apply }); });
  el.appendChild(btn);
}
