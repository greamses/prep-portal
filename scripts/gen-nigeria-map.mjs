/* Generates data/vocab/nigeria-map.js — Nigeria's 36 states + the FCT — from
   Natural Earth 10m admin-1 (public domain), the same source family as the
   world map. Hand-curated on top of it:
     - RENAME  fixes NE's spellings ("Nassarawa") and quizzes the Federal
               Capital Territory as "Abuja", which is how a school asks it.
     - INFO    capital-city hint + geopolitical zone for every state. States
               whose capital shares (or nearly spells) their name get a
               bespoke hint instead — a clue must never contain its word.
   All 37 are quizzed: every state is fair game in a Nigerian classroom.

   RUNNING IT (rarely needed — only to re-curate): this repo intentionally
   has no dependencies, so run it from a scratch directory that has them:
     npm i topojson-client d3-geo   (topojson unused here but shared setup)
     curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
     node /path/to/prep-portal/scripts/gen-nigeria-map.mjs
   The 40MB world file is scanned WITHOUT a full JSON.parse (this machine is
   memory-poor); a pre-extracted nigeria-adm1.geojson in the CWD is used
   instead when present. Writes the data file into the repo next to itself. */
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import fs from 'fs';

const require = createRequire(pathToFileURL(join(process.cwd(), 'noop.js')));
const { geoMercator, geoPath, geoArea } = await import(pathToFileURL(require.resolve('d3-geo')));
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'nigeria-map.js');

// ── Load the 37 features ────────────────────────────────────────────────
function loadFeatures() {
  if (fs.existsSync('nigeria-adm1.geojson')) {
    return JSON.parse(fs.readFileSync('nigeria-adm1.geojson', 'utf8')).features;
  }
  // Stream-ish scan of the whole-world file: split on feature starts, parse
  // only the pieces that mention Nigeria — never JSON.parse 40MB at once.
  const s = fs.readFileSync('ne_10m_admin_1_states_provinces.geojson', 'utf8');
  const feats = [];
  for (const p of s.split('{"type":"Feature",').slice(1)) {
    if (!p.includes('"admin":"Nigeria"')) continue;
    feats.push(JSON.parse('{"type":"Feature",' + p.slice(0, p.lastIndexOf('}}') + 2)));
  }
  return feats;
}

const RENAME = {
  'Nassarawa': 'Nasarawa',              // NE's spelling; the state is Nasarawa
  'Federal Capital Territory': 'Abuja', // quizzed the way a school asks it
};

const Z = { NC: 0, NE: 1, NW: 2, SE: 3, SS: 4, SW: 5 };
// name -> [zone, capital] · capital '' means the hint is bespoke (below)
const INFO = {
  // ── North Central ──
  Benue: [Z.NC, 'Makurdi'], Kogi: [Z.NC, 'Lokoja'], Kwara: [Z.NC, 'Ilorin'],
  Nasarawa: [Z.NC, 'Lafia'], Niger: [Z.NC, 'Minna'], Plateau: [Z.NC, 'Jos'],
  Abuja: [Z.NC, ''],
  // ── North East ──
  Adamawa: [Z.NE, 'Yola'], Bauchi: [Z.NE, ''], Borno: [Z.NE, 'Maiduguri'],
  Gombe: [Z.NE, ''], Taraba: [Z.NE, 'Jalingo'], Yobe: [Z.NE, 'Damaturu'],
  // ── North West ──
  Jigawa: [Z.NW, 'Dutse'], Kaduna: [Z.NW, ''], Kano: [Z.NW, ''],
  Katsina: [Z.NW, ''], Kebbi: [Z.NW, ''], Sokoto: [Z.NW, ''], Zamfara: [Z.NW, 'Gusau'],
  // ── South East ──
  Abia: [Z.SE, 'Umuahia'], Anambra: [Z.SE, 'Awka'], Ebonyi: [Z.SE, 'Abakaliki'],
  Enugu: [Z.SE, ''], Imo: [Z.SE, 'Owerri'],
  // ── South South ──
  'Akwa Ibom': [Z.SS, 'Uyo'], Bayelsa: [Z.SS, 'Yenagoa'], 'Cross River': [Z.SS, 'Calabar'],
  Delta: [Z.SS, 'Asaba'], Edo: [Z.SS, 'Benin City'], Rivers: [Z.SS, 'Port Harcourt'],
  // ── South West ──
  Ekiti: [Z.SW, ''], Lagos: [Z.SW, 'Ikeja'], Ogun: [Z.SW, 'Abeokuta'],
  Ondo: [Z.SW, 'Akure'], Osun: [Z.SW, 'Osogbo'], Oyo: [Z.SW, 'Ibadan'],
};

// A capital-city hint would name (or nearly spell) these states.
const BESPOKE = {
  Abuja: 'The Federal Capital Territory, carved out at the centre of the country.',
  Bauchi: "Home of Yankari, the country's most famous game reserve.",
  Gombe: 'The Jewel in the Savannah, on the upper Gongola basin.',
  Kaduna: "Its capital, seat of the old Northern Region, shares the state's name.",
  Kano: 'The ancient commercial nerve-centre of the North, famous for its dye pits.',
  Katsina: 'Home of Daura, seat of one of the seven Hausa kingdoms.',
  Kebbi: 'Famous for the Argungu fishing festival.',
  Sokoto: 'Seat of the Caliphate founded by Usman dan Fodio.',
  Enugu: 'The Coal City state.',
  Ekiti: 'The Fountain of Knowledge — a land of hills in the South-West.',
};

const feats = loadFeatures().map((f) => ({
  ...f, name: RENAME[f.properties.name] || f.properties.name,
}));
if (feats.length !== 37) throw new Error(`expected 37 features, got ${feats.length}`);

// ── Project & bake ──────────────────────────────────────────────────────
const W = 1000;
const fc = { type: 'FeatureCollection', features: feats };
const proj = geoMercator().fitWidth(W, fc);
const [[x0, y0], [, y1]] = geoPath(proj).bounds(fc);
const H = Math.ceil(y1 - y0);
proj.translate([proj.translate()[0] - x0, proj.translate()[1] - y0]);
const path = geoPath(proj);

const round1 = (d) => d.replace(/-?\d+\.\d+/g, (m) => {
  const v = (+m).toFixed(1);
  return v.endsWith('.0') ? v.slice(0, -2) : v;
});

function anchor(f) {
  let g = f.geometry;
  if (g.type === 'MultiPolygon') {
    let best = null, bestA = -1;
    for (const coords of g.coordinates) {
      const poly = { type: 'Polygon', coordinates: coords };
      const a = geoArea(poly);
      if (a > bestA) { bestA = a; best = poly; }
    }
    g = best;
  }
  const [cx, cy] = path.centroid(g);
  return [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10];
}

const rows = feats.map((f) => {
  const info = INFO[f.name];
  if (!info) throw new Error(`no INFO for ${f.name}`);
  const hint = BESPOKE[f.name] || `Its capital city is ${info[1]}.`;
  const [cx, cy] = anchor(f);
  return { name: f.name, hint, zone: info[0], cx, cy, d: round1(path(f)) };
}).sort((a, b) => a.name.localeCompare(b.name));

console.log(`states baked: ${rows.length}`);
const perZ = {};
for (const r of rows) perZ[r.zone] = (perZ[r.zone] || 0) + 1;
console.log('per zone:', JSON.stringify(perZ));
for (const r of rows) {
  if (r.hint.toLowerCase().includes(r.name.toLowerCase())) console.log('!! hint names itself:', r.name);
  if (!/^[A-Za-z][A-Za-z -]*$/.test(r.name)) console.log('!! odd name:', r.name);
}

const ZONE_KEYS = ['n-central', 'n-east', 'n-west', 's-east', 's-south', 's-west'];
const body = rows.map((r) =>
  `  [${JSON.stringify(r.name)}, ${JSON.stringify(r.hint)}, ${r.zone}, ${r.cx}, ${r.cy}, ${JSON.stringify(r.d)}],`
).join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   MAP OF NIGERIA — the 36 states + the FCT, outlines from Natural Earth
   (public domain, 10m admin-1), projected once (geoMercator) and baked to
   SVG paths at build time by scripts/gen-nigeria-map.mjs. Capitals, zones
   and hints are hand-curated in that script.

   Same drawn-topic shape as the world map: the game lights ONE state on the
   whole map and you name it; a scoped round asks one geopolitical zone.
   Every state is quizzed — all 37 are fair game in a Nigerian classroom.

   Each row: [name, hint, zone, cx, cy, path]. cx/cy anchor the clue's
   locator ring on the state's biggest landmass. This file is LAZY-LOADED
   (via words/geography.js or a dynamic import) — never import it statically
   from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};

export const ZONE_KEYS = ${JSON.stringify(ZONE_KEYS)};

const RAW = [
${body}
];

export const STATES = RAW.map(([name, hint, zone, cx, cy, d]) => ({
  name, hint, zone: ZONE_KEYS[zone], cx, cy, d,
}));

// What the game quizzes, shaped like any other topic's words: the state's
// NAME is the word, its capital (or a bespoke line) is the clue, and \`s\` is
// the zone scope key a scoped round filters on.
export const GAME_STATES = STATES.map((c) => ({ w: c.name, d: c.hint, s: c.zone, state: c }));
`;

fs.writeFileSync(OUT, out);
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`wrote data/vocab/nigeria-map.js (${kb} KB, viewBox ${W}x${H})`);
