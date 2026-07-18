#!/usr/bin/env node
/**
 * Stamp cache-busting version queries onto the game pages' ES modules.
 *
 * WHY THIS EXISTS
 * ---------------
 * index.html is served `max-age=0, must-revalidate`, so the HTML is always
 * fresh — but the JS it points at can still come from a stale cache (the
 * browser's HTTP cache, a service worker's Cache Storage, or a CDN edge). That
 * mismatch is the worst possible outcome: NEW markup running OLD code, which
 * blows up on elements the old code expects and the new markup no longer has
 * (e.g. `createCarousel(null)` after a mount id is renamed).
 *
 * Fixing it at the cache layer means chasing every cache. Fixing it here means
 * the problem cannot occur: when a module's CONTENT changes, its URL changes,
 * and a URL that has never been requested cannot be stale in any cache.
 *
 * WHAT IT DOES
 * ------------
 * For each page: hash that page's modules (+ the shared ones they import),
 * then rewrite index.html so
 *   - the entry <script src> is  ./js/main.js?v=<hash>
 *   - an import map remaps every app module to the same ?v=<hash>, so the
 *     modules main.js imports are versioned too. (Relative specifiers do NOT
 *     inherit a parent's query string, so without this, main.js?v=new would
 *     still pull a stale rng.js.)
 *
 * The hash only changes when the code changes, so this is a no-op on deploys
 * that didn't touch these files. Run via `npm run deploy`; safe to run by hand.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Shared modules EVERY page imports by absolute path. Changing one of these
// must also bust the pages, so they go into the hash and get remapped too.
const SHARED = [
  '/utils/components/setup-carousel.js',
  '/utils/components/avatar-picker.js',
  '/utils/components/admin-images.js',
  // The seeded-room machinery every game runs on. A stale copy of any of these
  // against fresh page code would desync a room, so they go into the hash.
  '/utils/games/rng.js',
  '/utils/games/bots.js',
  '/utils/games/bot-names.js',
  '/utils/games/seeded-room.js',
  '/utils/games/leaderboard.js',
  '/utils/games/setup-memory.js',
];

// `extra` is for absolute-path modules only one page imports — the vocab word
// bank lives in /data, outside any page's js/ dir, but editing a word still has
// to bust that page. The per-subject word files are imported DYNAMICALLY at
// round start; an import map remaps a dynamic import just like a static one, so
// they must be listed here or a fresh page could load a stale bank.
const VOCAB_SUBJECTS = [
  'life-science', 'earth-science', 'physical-science', 'space-science',
  'general-maths', 'biology', 'chemistry', 'physics',
  'algebra', 'geometry', 'statistics', 'geography',
];
const PAGES = [
  { name: 'geometry' },
  { name: 'drills' },
  { name: 'puzzles' },
  {
    name: 'vocab',
    extra: [
      '/data/vocab/index.js',
      '/data/vocab/topics.js',
      '/data/vocab/manifest.js',
      '/data/vocab/periodic-table.js',
      '/data/vocab/world-map.js',
      '/data/vocab/nigeria-map.js',
      // The Laws hangman words are derived from the shared study bank, so a
      // stale copy of the bank against fresh page code must bust the page too.
      '/data/laws/laws.js',
      // Likewise the IUPAC-naming compounds.
      '/data/chem/iupac.js',
      // Only the subjects that have actually been generated — the bank ships a
      // subject at a time, and hashing a file that doesn't exist would break the
      // build.
      ...VOCAB_SUBJECTS
        .map((s) => `/data/vocab/words/${s}.js`)
        .filter((rel) => existsSync(join(ROOT, rel.slice(1)))),
    ],
  },
].map((p) => ({
  ...p,
  extra: p.extra || [],
  dir: join(ROOT, 'exam-archive', 'national', p.name),
  urlBase: `/exam-archive/national/${p.name}`,
}));

const read = (p) => readFileSync(p, 'utf8');
// A page may override the shared list (e.g. a study page with no game infra).
const sharedFor = (page) => [...(page.shared ?? SHARED), ...page.extra];

function hashFor(page) {
  const h = createHash('sha256');
  const jsDir = join(page.dir, 'js');
  const files = readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort();
  for (const f of files) h.update(read(join(jsDir, f)));
  for (const s of sharedFor(page)) h.update(read(join(ROOT, s)));
  return h.digest('hex').slice(0, 8);
}

function buildImportMap(page, version, existing) {
  // Preserve whatever was already mapped (the firebase CDN pins) and add the
  // app modules on top.
  const imports = { ...existing };
  const jsDir = join(page.dir, 'js');
  for (const f of readdirSync(jsDir).filter((x) => x.endsWith('.js')).sort()) {
    const url = `${page.urlBase}/js/${f}`;
    imports[url] = `${url}?v=${version}`;
  }
  for (const s of sharedFor(page)) imports[s] = `${s}?v=${version}`;
  return { imports };
}

let changed = 0;

for (const page of PAGES) {
  const htmlPath = join(page.dir, 'index.html');
  if (!existsSync(htmlPath)) continue;

  const version = hashFor(page);
  let html = read(htmlPath);
  const before = html;

  // 1. Entry script — always re-stamp (strips any previous ?v=).
  html = html.replace(
    /(<script type="module" src="\.\/js\/main\.js)(\?v=[a-f0-9]+)?(")/,
    `$1?v=${version}$3`,
  );

  // 2. Import map — merge app modules into the existing map, keeping the
  //    firebase pins that are already there.
  html = html.replace(
    /(<script type="importmap">\s*)([\s\S]*?)(\s*<\/script>)/,
    (_m, open, body, close) => {
      let existingImports = {};
      try {
        const parsed = JSON.parse(body);
        // Drop previously-generated app entries so a stale version can't linger.
        for (const [k, v] of Object.entries(parsed.imports || {})) {
          const isApp = k.startsWith(page.urlBase) || sharedFor(page).includes(k);
          if (isApp) continue;
          // A local module that has since been DELETED (the old single-Science
          // vocab bank, say) would otherwise stay pinned in the map for ever.
          const isLocal = k.startsWith('/');
          if (isLocal && !existsSync(join(ROOT, k.slice(1)))) continue;
          existingImports[k] = v;
        }
      } catch {
        console.error(`  ! could not parse the import map in ${page.name}/index.html — leaving it alone`);
        return _m;
      }
      const map = buildImportMap(page, version, existingImports);
      const json = JSON.stringify(map, null, 2)
        .split('\n')
        .map((line, i) => (i === 0 ? line : '      ' + line))
        .join('\n');
      return `${open}${json}${close}`;
    },
  );

  if (html !== before) {
    writeFileSync(htmlPath, html);
    changed++;
    console.log(`  ✓ ${page.name} → v=${version}`);
  } else {
    console.log(`  · ${page.name} → v=${version} (unchanged)`);
  }
}

console.log(changed ? `\nStamped ${changed} page(s).` : '\nAll pages already up to date.');
