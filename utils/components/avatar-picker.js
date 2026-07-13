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

   A "seed" is whatever identifies a face:
     - a built-in name ("Astro")   -> a DiceBear drawing
     - "upload:<id>"               -> one of this player's own photos
     - anything else (a bot name)  -> a DiceBear drawing, so bots get a face too
═══════════════════════════════════════════════════════ */

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

// ── Photo handling ──────────────────────────────────────────────────────
// Downscale + centre-crop to a square, then compress — a phone photo is
// megabytes, and localStorage is not.
function resizeAvatarFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
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
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not read that image.')); };
    img.src = objectUrl;
  });
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

  function render() {
    grid.innerHTML = '';

    const uploadTile = document.createElement('label');
    uploadTile.className = `pp-sticky pp-sticky--tape sticky-choice avatar-choice avatar-choice--upload ${stickyColor(0)}`;
    uploadTile.innerHTML = UPLOAD_ICON_SVG;
    uploadTile.addEventListener('click', () => uploadInput.click());
    grid.appendChild(uploadTile);

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
      const url = await resizeAvatarFile(file);
      const entry = { id: `u${Date.now().toString(36)}`, url };
      uploads = writeUploads([entry, ...uploads]); // newest first; the oldest falls off the end
      select(uploads.some((u) => u.id === entry.id) ? UPLOAD_PREFIX + entry.id : selectedSeed);
      render();
    } catch {
      alert("Couldn't use that photo — please try a different image.");
    }
  });

  render();
  return { render, seed: getAvatarSeed };
}
