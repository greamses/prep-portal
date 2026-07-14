/* ═══════════════════════════════════════════════════════
   AVATAR PICKER — shared by every multiplayer game (Drills, Puzzles,
   Geometry, Vocab).

   One player, one face. The four games used to each keep their own copy of
   this code AND their own localStorage keys (drillAvatarSeed / puzzleAvatarSeed
   / geoAvatarSeed), so the same child arrived at each game wearing a different
   face. Everything now reads and writes ONE pair of keys.

   A player's photos are kept as a LIST, not a single "custom" slot that each
   new upload silently overwrote — upload a few, pick between them, delete the
   ones you're done with. Photos never leave the device: they're downscaled and
   cropped to a small square JPEG in a canvas and stored as data URLs in
   localStorage. There is no server upload.

   PrepBot can also DRAW a character to order: describe one, and the picture it
   makes is saved into exactly the same list as a photo. That tile only appears
   for players allowed the prepbot/images feature (see utils/features.js); the
   server gates the endpoint on the same part, so hiding the tile is a courtesy,
   not the security boundary.

   A "seed" is whatever identifies a face:
     - a built-in name ("Astro")   -> a DiceBear drawing
     - "upload:<id>"               -> one of this player's own pictures
     - anything else (a bot name)  -> a DiceBear drawing, so bots get a face too
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { getProfile } from '/utils/data-service.js';
import { resolveUserAccess } from '/utils/features.js';
import { imageGenerate } from '/utils/ai-client.js';

export const AVATAR_SEEDS = ['Explorer', 'Astro', 'Ranger', 'Comet', 'Nova', 'Pixel', 'Quokka', 'Robo', 'Sunny', 'Turbo', 'Breezy', 'Sparkle'];

const SEED_KEY = 'ppAvatarSeed';
const UPLOADS_KEY = 'ppAvatarUploads';
const UPLOAD_PREFIX = 'upload:';
const MAX_UPLOADS = 6; // localStorage is ~5MB and shared with the rest of the site
const AVATAR_PX = 160;

// The per-game keys this replaced. Read once, then retired.
const LEGACY_SEED_KEYS = ['drillAvatarSeed', 'puzzleAvatarSeed', 'geoAvatarSeed'];
const LEGACY_PHOTO_KEYS = ['drillAvatarCustom', 'puzzleAvatarCustom', 'geoAvatarCustom'];

const stickyColor = (i) => `pp-sticky--c${i % 6}`;

const UPLOAD_ICON_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1-1.6A1.5 1.5 0 0 1 10.4 3.6h3.2a1.5 1.5 0 0 1 1.3.8l1 1.6h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" fill="none" stroke="var(--text-tertiary)" stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="12" cy="12.5" r="3.4" fill="none" stroke="var(--text-tertiary)" stroke-width="1.6"/>
</svg>`;

const REMOVE_ICON_SVG = `<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
  <path d="M3 3 L9 9 M9 3 L3 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

// A pencil over a spark — "PrepBot draws this one".
const DRAW_ICON_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <path d="M4 20l1.2-4 9.4-9.4a2 2 0 0 1 2.8 0l0.6 0.6a2 2 0 0 1 0 2.8L8.6 19.4 4 20Z" fill="none" stroke="var(--text-tertiary)" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M19.2 3.2l0.7 1.6 1.6 0.7-1.6 0.7-0.7 1.6-0.7-1.6L16.9 5.5l1.6-0.7 0.7-1.6Z" fill="var(--text-tertiary)"/>
</svg>`;

// ── Store ───────────────────────────────────────────────────────────────
function readUploads() {
  try {
    const raw = JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((u) => u && u.id && u.url) : [];
  } catch {
    return [];
  }
}

// Photos are the one thing here big enough to blow the storage budget. If the
// write is rejected, drop the oldest photo and try again rather than losing the
// one the player just picked.
function writeUploads(list) {
  let attempt = list.slice(0, MAX_UPLOADS);
  while (attempt.length) {
    try {
      localStorage.setItem(UPLOADS_KEY, JSON.stringify(attempt));
      return attempt;
    } catch {
      attempt = attempt.slice(0, -1);
    }
  }
  localStorage.removeItem(UPLOADS_KEY);
  return [];
}

let uploads = readUploads();
let selectedSeed = localStorage.getItem(SEED_KEY) || '';

// One-time migration off the old per-game keys. An old "custom" seed pointed at
// that game's single photo, which now becomes the first entry in the list.
(function migrate() {
  if (!localStorage.getItem(SEED_KEY)) {
    for (const key of LEGACY_SEED_KEYS) {
      const old = localStorage.getItem(key);
      if (old && old !== 'custom') { selectedSeed = old; break; }
    }
  }
  if (!uploads.length) {
    const photos = LEGACY_PHOTO_KEYS
      .map((key) => localStorage.getItem(key))
      .filter((url) => url && url.startsWith('data:'));
    const unique = [...new Set(photos)];
    if (unique.length) {
      uploads = writeUploads(unique.map((url, i) => ({ id: `legacy${i}`, url })));
      const hadCustom = LEGACY_SEED_KEYS.some((k) => localStorage.getItem(k) === 'custom');
      if (hadCustom && uploads[0]) selectedSeed = UPLOAD_PREFIX + uploads[0].id;
    }
  }
  [...LEGACY_SEED_KEYS, ...LEGACY_PHOTO_KEYS].forEach((k) => localStorage.removeItem(k));

  if (!selectedSeed) selectedSeed = AVATAR_SEEDS[0];
  localStorage.setItem(SEED_KEY, selectedSeed);
}());

function findUpload(seed) {
  if (typeof seed !== 'string' || !seed.startsWith(UPLOAD_PREFIX)) return null;
  const id = seed.slice(UPLOAD_PREFIX.length);
  return uploads.find((u) => u.id === id) || null;
}

// ── Public reads ────────────────────────────────────────────────────────
export function avatarUrl(seed) {
  const mine = findUpload(seed);
  if (mine) return mine.url;
  // A seed pointing at a photo that's since been deleted — and every bot name —
  // falls through to a drawn face.
  const drawn = typeof seed === 'string' && seed.startsWith(UPLOAD_PREFIX) ? AVATAR_SEEDS[0] : seed;
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(drawn)}&size=64`;
}

export function getAvatarSeed() {
  return selectedSeed;
}

// ── Picture handling ────────────────────────────────────────────────────
// Downscale + centre-crop to a square, then compress. A phone photo is
// megabytes and localStorage is not; a generated picture is already square but
// still far bigger than it needs to be at 48px on screen. Both go through here.
function squareJpeg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_PX;
      canvas.height = AVATAR_PX;
      const ctx = canvas.getContext('2d');
      const crop = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - crop) / 2;
      const sy = (img.naturalHeight - crop) / 2;
      ctx.drawImage(img, sx, sy, crop, crop, 0, 0, AVATAR_PX, AVATAR_PX);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = src;
  });
}

async function resizeAvatarFile(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await squareJpeg(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ── PrepBot: draw me a character ────────────────────────────────────────
// The player writes who they want to be; this wraps that in a style so what
// comes back is a usable avatar (a centred head-and-shoulders portrait) rather
// than a landscape or a page of text.
const MAX_WISH = 160;

function characterPrompt(wish) {
  return [
    `Friendly cartoon avatar portrait of ${wish}.`,
    'Head and shoulders, centred, facing forward, big expressive eyes,',
    'flat bold colours, soft pastel background, clean children\'s storybook',
    'illustration style. No text, no letters, no logos, no watermark.',
  ].join(' ');
}

async function canDrawCharacters() {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const profile = await getProfile(user.uid);
    const verdict = await resolveUserAccess({ featureId: 'prepbot', partId: 'images', profile });
    return !!verdict.allowed;
  } catch {
    return false; // no gate answer -> no tile; the server would refuse anyway
  }
}

/**
 * Renders the picker into `grid` and keeps the selection in sync.
 *   grid        — the container element (a .sticky-grid)
 *   uploadInput — a hidden <input type="file" accept="image/*">
 *   radioName   — the radio group's name, unique to the page
 *   onChange    — called with the new seed whenever the selection changes
 * Returns { render, seed } — `render` re-draws (rarely needed by callers).
 */
export function mountAvatarPicker({ grid, uploadInput, radioName, onChange }) {
  // Starts false so the tile never flickers in for someone who can't have it;
  // the gate is async (it needs the user's profile), so the grid re-renders if
  // the answer comes back yes.
  let canDraw = false;

  function select(seed) {
    selectedSeed = seed;
    localStorage.setItem(SEED_KEY, seed);
    if (onChange) onChange(seed);
  }

  function tile(i, { seed, imgUrl, alt, extraClass = '', removable = false }) {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice ${extraClass} ${stickyColor(i)}`;
    label.innerHTML = `
      <input type="radio" name="${radioName}" value="${seed}" ${seed === selectedSeed ? 'checked' : ''} />
      <img src="${imgUrl}" alt="${alt}" loading="lazy" />
    `;
    if (removable) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'avatar-remove';
      remove.setAttribute('aria-label', 'Remove this photo');
      remove.innerHTML = REMOVE_ICON_SVG;
      // Inside a <label>, a plain click would also tick the radio.
      remove.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploads = writeUploads(uploads.filter((u) => UPLOAD_PREFIX + u.id !== seed));
        if (selectedSeed === seed) select(uploads[0] ? UPLOAD_PREFIX + uploads[0].id : AVATAR_SEEDS[0]);
        render();
      });
      label.appendChild(remove);
    }
    return label;
  }

  // Saves a finished square JPEG into the list and wears it. Shared by the
  // camera and by PrepBot — a drawn character is just another picture.
  function keepPicture(url) {
    const entry = { id: `u${Date.now().toString(36)}`, url };
    uploads = writeUploads([entry, ...uploads]); // newest first; the oldest falls off the end
    if (uploads.some((u) => u.id === entry.id)) select(UPLOAD_PREFIX + entry.id);
    render();
  }

  function render() {
    grid.innerHTML = '';

    const uploadTile = document.createElement('label');
    uploadTile.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice avatar-choice--upload ${stickyColor(0)}`;
    uploadTile.innerHTML = UPLOAD_ICON_SVG;
    uploadTile.addEventListener('click', () => uploadInput.click());
    grid.appendChild(uploadTile);

    if (canDraw) {
      const drawTile = document.createElement('label');
      drawTile.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice avatar-choice--draw ${stickyColor(0)}`;
      drawTile.title = 'Ask PrepBot to draw your character';
      drawTile.innerHTML = DRAW_ICON_SVG;
      drawTile.addEventListener('click', openDrawDialog);
      grid.appendChild(drawTile);
    }

    uploads.forEach((u, i) => {
      grid.appendChild(tile(i + 1, {
        seed: UPLOAD_PREFIX + u.id,
        imgUrl: u.url,
        alt: 'Your photo',
        extraClass: 'avatar-choice--saved',
        removable: true,
      }));
    });

    AVATAR_SEEDS.forEach((seed, i) => {
      grid.appendChild(tile(uploads.length + 1 + i, {
        seed, imgUrl: avatarUrl(seed), alt: `${seed} avatar`,
      }));
    });
  }

  grid.addEventListener('change', (e) => {
    const input = e.target.closest(`input[name="${radioName}"]`);
    if (input) select(input.value);
  });

  uploadInput.addEventListener('change', async () => {
    const file = uploadInput.files && uploadInput.files[0];
    uploadInput.value = ''; // so the same file can be picked again later
    if (!file) return;
    try {
      keepPicture(await resizeAvatarFile(file));
    } catch {
      alert("Couldn't use that photo — please try a different image.");
    }
  });

  // ── PrepBot's drawing pad ─────────────────────────────────────────────
  // A dialog rather than an inline field: generation takes a few seconds and
  // returns something you'll want to look at before you commit to wearing it.
  function openDrawDialog() {
    const bd = document.createElement('div');
    bd.className = 'avatar-draw-bd';
    bd.innerHTML = `
      <div class="avatar-draw pp-sticky pp-sticky--tape pp-sticky--c2" role="dialog" aria-modal="true" aria-label="Ask PrepBot to draw your character">
        <p class="avatar-draw-title">Who do you want to be?</p>
        <p class="avatar-draw-sub">Describe your character and PrepBot will draw it.</p>
        <input class="avatar-draw-input" type="text" maxlength="${MAX_WISH}"
               placeholder="a girl astronaut with braids" aria-label="Describe your character" />
        <div class="avatar-draw-stage" hidden><img class="avatar-draw-preview" alt="" /></div>
        <p class="avatar-draw-status" role="status"></p>
        <div class="avatar-draw-actions">
          <button type="button" class="pp-sticky pp-note-btn pp-sticky--c1 avatar-draw-cancel">Cancel</button>
          <button type="button" class="pp-sticky pp-note-btn pp-sticky--c0 avatar-draw-go">Draw</button>
          <button type="button" class="pp-sticky pp-note-btn pp-sticky--c3 avatar-draw-keep" hidden>Use this</button>
        </div>
      </div>`;
    document.body.appendChild(bd);

    const $ = (sel) => bd.querySelector(sel);
    const input = $('.avatar-draw-input');
    const stage = $('.avatar-draw-stage');
    const preview = $('.avatar-draw-preview');
    const status = $('.avatar-draw-status');
    const go = $('.avatar-draw-go');
    const keep = $('.avatar-draw-keep');

    let drawn = null; // the square JPEG, once we have one
    const close = () => bd.remove();

    async function draw() {
      const wish = input.value.trim().slice(0, MAX_WISH);
      if (!wish) { input.focus(); return; }
      go.disabled = true;
      keep.hidden = true;
      status.textContent = 'PrepBot is drawing…';
      bd.classList.add('is-busy');
      try {
        const raw = await imageGenerate({ prompt: characterPrompt(wish), feature: 'prepbot' });
        drawn = await squareJpeg(raw);
        preview.src = drawn;
        preview.alt = wish;
        stage.hidden = false;
        status.textContent = 'Like it? Keep it, or draw another.';
        keep.hidden = false;
        go.textContent = 'Draw again';
      } catch (e) {
        // 402 comes back when the feature is on but the player isn't premium.
        status.textContent = /402|premium/i.test(String(e && e.message))
          ? 'Drawing characters is a premium feature.'
          : "PrepBot couldn't draw that one — try describing it differently.";
      } finally {
        go.disabled = false;
        bd.classList.remove('is-busy');
      }
    }

    go.addEventListener('click', draw);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); draw(); } });
    keep.addEventListener('click', () => { if (drawn) keepPicture(drawn); close(); });
    $('.avatar-draw-cancel').addEventListener('click', close);
    bd.addEventListener('click', (e) => { if (e.target === bd) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    input.focus();
  }

  render();

  // Ask whether this player may have PrepBot draw for them, and add the tile if
  // so. Deliberately not awaited: the picker must be usable the instant it's
  // mounted, gate or no gate.
  canDrawCharacters().then((allowed) => {
    if (!allowed) return;
    canDraw = true;
    render();
  });

  return { render, seed: getAvatarSeed };
}
